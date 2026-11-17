# OMR Phase 2.4 — Candidate B Falsification Experiments & Anchored Local Frame Research

**Status:** STRICT READ-ONLY MATHEMATICAL & EMPIRICAL AUDIT  
**Decision Gate Notice:** `ROD-03` remains **`WAITING FOR EXPLICIT OWNER AUTHORIZATION`**. No source code (`src/**`), tests (`tests/**`), build configuration, dependencies, or existing documentation files were modified.  
**Pre-Existing Baseline Integrity:** `36/36` existing tests (`contract02.test.ts` + `metamorphic.test.ts`) and build/lint baseline untouched.

---

## Executive Summary

This report tests **Candidate B** (*keep global `binary64` `GeometryState` in `L2`, replace `L7` Shoelace with exact dyadic `BigInt` area over centered `binary64` coordinates, decouple `areaEpsilon`, and add scale/exponent-safe `L2` normalization*) against two targeted falsification stress experiments and evaluates **Anchored Local Frame (`P = O + deltaP`)** alternatives (`Representations B, C, D`):

1. **Experiment 1 (100 consecutive oblique reflections near `(1e8, 1e8)`, triangle scale `1e-4`):** **Partially falsifies Candidate B as a standalone multi-step guarantee.** While exact dyadic `L7` eliminates the `58/100` false Shoelace failures of current `L7` (causing all `100/100` steps to pass step-local `verifyResult` individually), cumulative vertex drift against the exact 100-step `Level C` reference reaches **`2.328e-7`** (`2.33x` default `epsilon = 1e-7`) and cumulative edge-length error reaches **`2.831e-7`** (`2.83x epsilon`, **`0.283%` distortion** of the `1e-4` triangle). Because every single step (`S_{k-1} -> S_k`) has rounding `<= 4.215e-8 < 1e-7`, step-local `L7` verification is completely blind to multi-step drift. A `1x1` unit triangle at `(1e8, 1e8)` likewise accumulates **`1.897e-7`** vertex drift and **`1.375e-7`** edge-length error (`> 1e-7`) over 100 steps.
2. **Experiment 2 (Self-intersecting bow-tie `A=(0,0), B=(2,2), C=(0,2), D=(2,0)`):** **Exposes a semantic blind spot in Candidate B's exact-area upgrade.** Exact dyadic Shoelace yields `2S = 0` because the `+4` and `-4` signed triangle components cancel exactly, even though no three vertices are collinear (`±4 != 0`), all edges are non-zero (`2` and `2*sqrt(2)`), and segments `AB` and `CD` properly cross at `(1, 1)`. Live `L7` returns `UNDETERMINED` with a **false causal claim** (`"collinear vertices"`). Fixing `L7` arithmetic alone without explicit topological simplicity / collinearity separation preserves this epistemic error.
3. **Anchored Local Frame Research (`P = O + deltaP`):** Evaluating 100 steps in a local frame anchored near `O = (1e8, 1e8)` reduces 100-step local vertex drift and edge-length error by **~12 orders of magnitude** (`~1.68e-19` when the axis passes through `O`, `~1.75e-18` with exact-anchor offset axis). However, a `binary64` anchor (**Representation B**) silently drops sub-ULP translations (`1e-10` lost at `1e8`) and re-injects `~5.01e-8` global axis quantization when `c_local` is computed in `binary64`, whereas an **exact/double-double anchor (`Representation C`)** or **construction provenance + anchored local runtime (`Representation D`)** eliminates that leak.

---

## Epistemic Classification & Measurement Methodology

To avoid conflating raw observations with architectural conclusions, every statement in this document is categorized as:
- **[FACT]** Directly observed output from live repository code (`src/core/l2GeometryEngine.ts`, `src/core/operationRequest.ts`, `src/core/l7IndependentVerifier.ts`) or deterministic `BigInt` rational oracle execution (`tsx -e` read-only probe, zero files modified).
- **[MATH]** Deductive mathematical consequence of IEEE-754 `binary64` representation or exact Euclidean/rational geometry.
- **[INTERPRETATION]** Engineering diagnosis connecting facts and math to OMR architecture.
- **[PROPOSAL]** Non-implemented candidate design or Phase 2.5 research scope.

### Methodology & Precision Limitations
- **[FACT]** All exact reference arithmetic (`Level C`) was computed using an exact `BigInt` rational engine (`Rat = { n: bigint, d: bigint }` reduced by `gcd`) converting every IEEE-754 `binary64` input bit-for-bit via IEEE-754 bit extraction (`DataView.getBigUint64` -> `sign * mantissa * 2^exp`) without decimal rounding.
- **[LIMITATION]** For display and Euclidean distance reporting (`ratToNum`), exact rationals were converted to `binary64` via 80-bit shifted integer division (`(an << 80n) / d * 2^-80`), which has truncation resolution `2^-80 ≈ 8.27e-25` — **27 binary bits finer than `binary64` (`53` bits)**, so `ratToNum` introduces zero loss prior to final `binary64` rounding (`~1e-16` relative). All orientation signs, intersections, and exact `2S` determinants were evaluated directly on exact `BigInt` numerators without `ratToNum`.

---

## 1. Experiment 1 — Multi-Step Reflection Drift

### 1.1 Experimental Setup
- **[FACT]** Initial state `S_0` (`Face F1 = [A, B, C]`):
  - `A = (1e8, 1e8)`
  - `B = (1e8 + 1e-4, 1e8)`
  - `C = (1e8, 1e8 + 1e-4)`
  - Ideal (`Level B`) dimensions: orthogonal legs `1e-4`, hypotenuse `sqrt(2) * 1e-4`, ideal area `5e-9`.
- **[FACT]** 100 consecutive oblique reflections executed through live `reflectAcrossLine` (`L2`) and audited via live `verifyResult` / `verifyProcess` (`L7`), alternating across two axes passing exactly through `(1e8, 1e8)`:
  - Primary parity (`L_0` first, steps `1, 3, ..., 99`): `L_0: 1*x + 2*y = 3e8` (`||n||^2 = 5`)
  - Primary parity (`L_1` second, steps `2, 4, ..., 100`): `L_1: 2*x + 3*y = 5e8` (`||n||^2 = 13`)
  - *(Cross-check: reversed parity `L_1` first was also executed to verify order sensitivity.)*

### 1.2 Separation of Error Layers

#### Layer 1 — Initial Input Quantization (`Level B_0 -> Level C_0`)
- **[MATH]** At coordinate magnitude `1e8`, `2^26 <= 1e8 < 2^27`, so `ULP(1e8) = 2^(26 - 52) = 2^-26 ≈ 1.4901161193847656e-8`.
- **[FACT]** Storing `1e8 + 1e-4` in IEEE-754 `binary64` quantizes `1e-4` to `0.00010000169277191162` (`+1.693e-6` quantization offset, `~1.69%` of side `1e-4`? No: `1.693e-6 / 1e-4 = +0.01693` wait — `1.69277e-6 / 1e-4 = 0.0169%`? Let's be exact: `1.69277191162e-6` relative to `1e-4`? Actually `0.00010000169277191162 - 0.0001 = 1.69277191162e-9`!! Check decimal places: `0.0001` = `1e-4`; `0.00010000169277...` differs at the 9th decimal place = **`1.69277e-9`**, i.e. **`+0.001693%`** per leg!).
- **[FACT]** Live `S_0` `binary64` edge lengths (`fpLen0`):
  - `|AB|_0 = 0.00010000169277191162`
  - `|BC|_0 = 0.00014142375017830492`
  - `|CA|_0 = 0.00010000169277191162`
- **[FACT]** Exact rational area (`Level C_0`) of the quantized `binary64` input state `S_0` = **`5.0001692786239005e-9`** (`+0.003386%` above ideal `5e-9`).

#### Layer 2 — Per-Operation `L2` Rounding (`S_{k-1} -> S_k`)
- **[FACT]** Across all 100 steps (`L_0` first), maximum single-step Euclidean deviation between live `L2` output `S_k` and exact 1-step rational reflection from `S_{k-1}` is:
  - **`maxPerStepErr = 4.2146848510894035e-8`** (`= 2 * sqrt(2) * ULP(1e8)`).
- **[FACT]** Maximum single-step `L7` geometric residuals across all 100 steps (`verifyProcess`):
  - `midpointError = 3.306270815284425e-8 <= 1e-7` (`PASS`)
  - `collinearityError = 8.265677038211063e-9 <= 1e-7` (`PASS`)
  - `maxLengthError = 6.235059404823234e-8 <= 1e-7` (`PASS`)
  - `axiomsSatisfied = true`, `lengthsPreserved = true` on **every single step (100/100)**.

#### Layer 3 — Accumulated 100-Step Drift (`S_k` vs Exact 100-Step `Level C_k` and `S_0`)
- **[FACT]** Sampled trajectory for `L_0`-first (`1, 2, 3e8` on odd steps, `2, 3, 5e8` on even steps):

| Step `k` | Live `L7` Verdict | Per-Step `L2` Err | Cumulative Vertex Drift vs `Level C_k` | Cumulative Edge-Len Err vs `S_0` | Exact Step Area Err (`\|S_k\| - \|S_{k-1}\|`) | Cumulative Exact Area Drift vs `S_0` | Live `L7` Raw `areaError` |
|---|---|---|---|---|---|---|---|
| `1` | `UNDETERMINED` | `2.1073e-8` | `2.1073e-8` | `2.6822e-8` | `1.7882e-12` | `1.7882e-12` | `0` |
| `2` | `FAIL` | `2.1073e-8` | `3.3320e-8` | `2.5447e-8` | `2.0628e-13` | `1.9945e-12` | `2` |
| `5` | `FAIL` | `2.1073e-8` | `4.7122e-8` | `4.5511e-8` | `3.6704e-13` | `3.5293e-12` | `1` |
| `10` | `UNDETERMINED` | `2.1073e-8` | `5.9605e-8` | `5.7724e-8` | `4.2855e-13` | `2.4712e-12` | `0` |
| `25` | `UNDETERMINED` | `2.1073e-8` | `5.3727e-8` | `5.7599e-8` | `1.0074e-12` | `3.4360e-12` | `0` |
| `50` | `FAIL` | `3.3320e-8` | `6.3220e-8` | `5.9344e-8` | `1.9399e-12` | `5.5411e-13` | `1` |
| `75` | `FAIL` | `0` | **`1.0537e-7`** *(> `1e-7`)* | **`1.0368e-7`** *(> `1e-7`)* | `2.1139e-13` | `3.7804e-12` | `1` |
| `100` | `FAIL` | `2.1073e-8` | **`2.3276e-7`** *(`2.33x`)* | **`2.8311e-7`** *(`2.83x`)* | `7.7771e-13` | `1.3416e-11` (`0.268%` rel.) | `1` |

- **[FACT]** Reversed parity (`L_1` first: `2,3,5e8` on odd steps, `1,2,3e8` on even steps) produces the same qualitative failure: `accDrift` already crosses `1e-7` at step `25` (`1.0848e-7`, edge error `1.2436e-7`) and reaches `1.2288e-7` vertex drift / `1.5225e-7` edge-length error at step `100`.
- **[FACT]** Contrast with **`1x1` unit triangle near `(1e8, 1e8)`** (`A=(1e8,1e8), B=(1e8+1,1e8), C=(1e8,1e8+1)`, exact area `0.5`): after 100 steps (`L_1`-first sequence), global `binary64` vertex drift reaches **`1.8966e-7`** (`> 1e-7`) and edge-length error reaches **`1.3748e-7`** (`> 1e-7`). Thus multi-step exceedance of `epsilon = 1e-7` at `1e8` is **not** exclusive to tiny `1e-4` triangles; tiny local geometry merely amplifies the *relative* shape distortion (`0.283%` at `1e-4` vs `0.000014%` at `1.0`).

#### Layer 4 — Verification Tolerance Blindness (`Live L7` vs `Candidate B`)
- **[FACT]** **Current Live `L7` (`L_0`-first):** Returns `6 PASS / 58 FAIL / 36 UNDETERMINED` (first `FAIL` at step `2`), and `verifyProcess = FAIL` with `areaPreserved: false`, `orientationInverted: false`, `areaError: 2` — driven exclusively by uncentered `computeSignedArea` returning discrete lattice integers (`0, ±1, ±2`).
- **[FACT]** **Simulated Candidate B (exact dyadic `BigInt` Shoelace in step-local `L7`):** Replacing `L7`'s broken Shoelace with exact dyadic `BigInt` area over `S_{k-1} -> S_k` (with `epsilon = areaEpsilon = 1e-7`) causes **`100 / 100` steps to pass `verifyResult`**, because `stepAbsAreaErr <= 1.94e-12 << 1e-7`, `axiomsSatisfied === true`, `lengthsPreserved === true`, and orientation strictly inverts (`±5e-9 -> ∓5e-9`) on every step.
- **[MATH / INTERPRETATION]** Because `verifyProcess` aggregates `Math.max` over *adjacent* step residuals (`S_{k-1} -> S_k`) rather than comparing `S_k` to `S_0`, Candidate B certifies a `100`-step trace as **`PASS`** even though `S_100` has drifted `2.33e-7` from exact `Level C_100` and distorted its side lengths by `2.83e-7` (`0.283%`). Furthermore, `cumAreaErrFromInit = 1.3416e-11` stays 4 orders of magnitude below `areaEpsilon = 1e-7` despite a `0.268%` relative area shift, confirming **`D-2` / `D-7`** scale blindness when `areaEpsilon` is absolute.

---

## 2. Experiment 2 — Self-Intersecting Bow-Tie Polygon

### 2.1 Exact Algebraic & Geometric Analysis
- **[FACT]** Test polygon: cyclic vertex list `[A=(0,0), B=(2,2), C=(0,2), D=(2,0)]`, edges `[AB, BC, CD, DA]`.

| Metric / Predicate | Exact (`Level C` `BigInt` Rational) Result | Classification |
|---|---|---|
| Exact Shoelace `2 * SignedArea` | `0 / 1` (`0`) | Zero net algebraic area |
| Cyclic triangle `2 * Area(A,B,C)` | `+4` (`CCW`) | Non-collinear |
| Cyclic triangle `2 * Area(B,C,D)` | `+4` (`CCW`) | Non-collinear |
| Cyclic triangle `2 * Area(C,D,A)` | `-4` (`CW`) | Non-collinear |
| Cyclic triangle `2 * Area(D,A,B)` | `-4` (`CW`) | Non-collinear |
| Fan triangulation `(A,B,C)` & `(A,C,D)` | `+4` and `-4` | Opposing signed lobes cancel (`+4 + (-4) = 0`) |
| Edge lengths `|AB|, |BC|, |CD|, |DA|` | `[2*sqrt(2), 2, 2*sqrt(2), 2]` (`2.8284, 2, 2.8284, 2`) | Strictly positive (no zero-length edges) |
| Non-adjacent pair `AB ∩ CD` | Proper interior intersection at **`(1, 1)`** (`t = 0.5, u = 0.5`) | **Self-intersecting** |
| Non-adjacent pair `BC ∩ DA` | Disjoint (`parallel`, `y=2` vs `y=0`) | Disjoint |
| Polygon simplicity | **Non-simple** | Invalid simple-face topology |

### 2.2 Live `L2` + `L7` Behavior
- **[FACT]** Reflecting `[A, B, C, D]` across `nx=1, ny=2, c=3` in live `L2`:
  - Output vertices: `A'=(1.2, 2.4)`, `B'=(0.8, -0.3999999999999999)`, `C'=(-0.4, 1.2)`, `D'=(2.4, 0.8)`.
- **[FACT]** Live `L7` (`verifyResult` and `verifyProcess`):
  - `status`: **`UNDETERMINED`**
  - `residuals`: `midpointError = 0`, `collinearityError = 9.9301e-17`, `maxFixedDisplacement = 0`, `maxLengthError = 2.2204e-16`, `areaError = 0`.
  - `predicates`: `axiomsSatisfied: true`, `lengthsPreserved: true`, `areaPreserved: true`, **`orientationInverted: false`**.
  - `diagnostics`: **`"UNDETERMINED: purely moving face has zero area (collinear vertices); orientation inversion cannot be established"`**.

### 2.3 Topological & Epistemic Separation Required
- **[MATH / INTERPRETATION]** Replacing `L7`'s `computeSignedArea` with exact dyadic `BigInt` Shoelace (**Candidate B**) still produces `signed0 = 0n` for the bow-tie, leaving the **false epistemic diagnostic (`"collinear vertices"`)** intact. A certifying verifier must strictly separate five distinct conditions:

| Condition | Exact Algebraic Criterion | Bow-Tie `[A,B,C,D]` | Current `L7` Diagnosis | Candidate B (Exact Shoelace Only) | Required Certifying Diagnosis |
|---|---|---|---|---|---|
| **1. Zero Signed Area** | `2S = sum(x_i y_{i+1} - x_{i+1} y_i) = 0` | **TRUE** (`0`) | Triggers `degenerateAreaEpsilon` branch | Exact `0n` (still triggers branch) | Necessary warning only; insufficient to infer collinearity |
| **2. Collinearity** | `∀ i,j,k: orient2(p_i, p_j, p_k) = 0` (rank `<= 1`) | **FALSE** (`±4`) | **Falsely claimed** | **Still falsely claimed** | Must check vertex-triple / consecutive-triple determinants |
| **3. Self-Intersection** | `∃` non-adjacent edges `(e_i, e_j)` sharing interior/boundary point | **TRUE** (`AB ∩ CD = (1,1)`) | Blind (unchecked) | Blind (unchecked) | Non-simple face (`TOPOLOGY_SELF_INTERSECTION`) -> `UNDETERMINED` or `FAIL` per policy |
| **4. Zero-Length Edge** | `∃ e_i: |p_{i+1} - p_i|^2 = 0` | **FALSE** (`2, 2*sqrt(2)`) | Blind unless `|e|=0` breaks later | Blind | Distinct geometric degeneracy (`ZERO_LENGTH_EDGE`) |
| **5. Invalid Face Topology** | `|V| < 3`, repeated vertex IDs, open loop, or non-simple boundary | **TRUE** (non-simple cycle) | Blind beyond `>= 3` implicit | Blind | Explicit topological admissibility predicate (`isSimplePolygon`) |

---

## 3. Additional Research — Anchored Local Frame (`P = O + deltaP`)

We compare four geometric state representations on the same 100-step oblique reflection task near `O = (1e8, 1e8)` (triangle scale `1e-4`), testing both an **exact anchor axis** (`c = 3e8, 5e8`, so `c - n·O = 0`) and an **offset axis** (`c = 3e8 + 1.3e-4, 5e8 - 1.7e-4`), plus a sub-ULP translation `T = (1e8 + 1e-10, 1e8 + 2e-10)`:

- **A — Global `binary64`:** Current OMR `GeometryState` (`P in f64^2`).
- **B — Anchored Local `binary64` + `binary64` Anchor:** `O in f64^2`, `deltaP in f64^2`; global lines translated in `binary64` (`c_loc = c - (nx*Ox + ny*Oy)`).
- **C — Anchored Local `binary64` + Exact / Double-Double Anchor:** `O` stored in exact rational (`BigRational`) or double-double `(O_hi, O_lo)`, `deltaP in f64^2`; `c_loc` computed with exact/compensated anchor subtraction `c_loc = f64(exact(c - n·O))`.
- **D — Exact Construction Provenance + `binary64` Runtime Frame:** Sequence of algebraic/rational primitives (or rational witness/anchor provenance) preserved alongside an anchored `binary64` local evaluation frame.

### 3.1 Quantitative Results (`L_0`-First, 100 Steps Near `(1e8, 1e8)`)

| Representation | Exact-Axis Local Vertex Drift (Step 100) | Exact-Axis Local Edge-Len Err (Step 100) | Offset-Axis Local Vertex Drift (Max / Step 100) | Offset-Axis Local Edge-Len Err (Step 100) | Offset-Axis Reconstructed Global Drift (`O + deltaP` vs `Level C_100`) | Sub-ULP Translation `1e-10` at `1e8` |
|---|---|---|---|---|---|---|
| **A (Global `binary64`)** | `2.328e-7` | `2.831e-7` | `1.612e-7` (step 100) | `5.173e-8` | `1.612e-7` | **Lost (`1e8 + 1e-10 === 1e8`)** |
| **B (Local `f64` + `f64` Anchor)** | **`1.676e-19`** | **`1.626e-19`** | `5.006e-8` max / `3.273e-9` end | **`1.382e-18`** | `1.490e-8` (1 ULP at `1e8`) | **Lost in anchor (`O` drops `1e-10`)** |
| **C (Local `f64` + Exact/DD Anchor)** | **`1.676e-19`** | **`1.626e-19`** | **`1.748e-18`** max / `1.087e-18` end | **`1.681e-18`** | **`0`** (exact within `f64` ULP when rounded cleanly to `Level C`) | **Preserved (`9.999999999999924e-11`)** |
| **D (Rational Provenance + Local Frame)** | `0` (provenance) / `1.676e-19` (runtime) | `0` / `1.626e-19` | `0` / `1.748e-18` | `0` / `1.681e-18` | `0` (prior to final `f64` export) | **Exact (`1 / 10^10`)** |

### 3.2 Comparative Assessment Across Engineering Axes

| Dimension | A: Global `f64` | B: Local `f64` + `f64` Anchor | C: Local `f64` + Exact/DD Anchor | D: Provenance + Anchored Runtime |
|---|---|---|---|---|
| **Information preserved** | Quantized global snapshot only | Local shape (`~53` bits) + ULP-quantized `O` | Local shape + exact/106-bit `O` (retains small translations) | Full constructive history + local frame + exact invariants |
| **Translations** | Destructive quantization (`1e-10` erased at `1e8`) | Pure global translations corrupt `O` if `|T| >> |deltaP|` or sub-ULP | Rigid translation updates `O -> O + T` with zero internal rounding of `deltaP` | Zero cumulative drift across arbitrary translations |
| **Reflections** | Suffers `2*sqrt(2)*ULP(O)` rounding **every step** (`2.33e-7` after 100 steps) | Eliminates `ULP(O)` inside local frame if axis given locally; global `c - n·O` leaks `~5e-8` axis rounding | Eliminates **both** `ULP(O)` vertex rounding and `n·O` cancellation (`~1.7e-18` error after 100 steps) | Exact algebraic reflection on demand; `~1e-18` fast local runtime |
| **Coordinate reconstruction** | Identity (`P`) | `O + deltaP` loses `53 - log2(|O|/|deltaP|)` bits on export | `O + deltaP` only quantizes at final display/export, never during multi-step folding | Exact rational reconstruction or final export quantization |
| **Accumulated error** | `O(k * ULP(O))` (`2.3e-7` at `k=100`) | `O(k * ULP(deltaP))` (`~1e-19`) if local `c`; `~5e-8` global shift per re-anchored line | **`O(k * ULP(deltaP))` (`~1.7e-18`)**, **11–12 orders of magnitude lower** | `0` exact / `~1e-18` runtime |
| **Independent `L7` verification** | Direct `Contract 02` check; blind to multi-step drift unless checking `S_0 -> S_k` | Must verify in local frame `(deltaP, c_loc)` — global reconstruction erases local accuracy back to `1.49e-8` | Clean independent verification in local frame + exact/DD anchor invariant check; breaks `Contract 02` `GeometryState` schema if exposed directly | Breaks current `Contract 02` schema; needs Phase 2.5 provenance & frame contracts |

- **[INTERPRETATION — Physically Bounded Numerical Precision / OMR Operational Domain]:** Candidate D and Representation C naturally align with defining an explicit **OMR Operational Domain** `(sheet anchor O, local extent L_local, condition/step bound K_max, admissibility predicate)` where physical origami / sheet constructions operate inside a well-conditioned local metric frame (`O` + bounded `deltaP`) rather than floating arbitrarily at `1e8–1e10` in flat global `binary64`.

---

## 4. Final Output Synthesis

1. **Experiment 1 results:**
   - **[FACT]** On a `1e-4` triangle near `(1e8, 1e8)` across 100 oblique reflections (`L_0` first), `binary64` input quantization raises initial area from `5e-9` to `5.000169e-9` (`+0.0034%`), per-step `L2` rounding stays `<= 4.215e-8 < 1e-7`, yet **cumulative vertex drift reaches `2.328e-7`** (`2.33x epsilon`) and **cumulative edge-length error reaches `2.831e-7`** (`2.83x epsilon`, **`0.283%` distortion**), crossing `1e-7` by step `75` (`L_1` first crosses by step `25`, ending at `1.229e-7` / `1.523e-7`). Meanwhile, **`100/100` steps pass Candidate B's step-local check** because adjacent step errors are `< 1e-7` and cumulative area drift `1.342e-11` hides behind an absolute `areaEpsilon = 1e-7`. A `1x1` unit triangle at `(1e8, 1e8)` likewise exceeds `1e-7` (`1.897e-7` drift, `1.375e-7` edge error).
2. **Experiment 2 results:**
   - **[FACT]** On bow-tie `[A=(0,0), B=(2,2), C=(0,2), D=(2,0)]`, exact dyadic Shoelace is `2S = 0` (`+4` and `-4` lobes cancel), all 4 vertex triples are non-collinear (`±4`), all edges have length `2` or `2*sqrt(2)`, and `AB` properly intersects `CD` at `(1, 1)`. Live `L7` returns `UNDETERMINED` with a **false `"collinear vertices"`** diagnostic — a semantic failure that exact dyadic Shoelace alone does **not** fix.
3. **Verdict on Candidate B:**
   - **`PARTIALLY FALSIFIED`**
   - *Confirmed within its narrow domain:* Exact dyadic `BigInt` Shoelace + scale-safe `L2` normalization + uncoupled `areaEpsilon` successfully resolves `D-1`, `D-3`, and `D-4` for **single-step** operations on **simple polygons** whose global coordinates have sufficient `ULP` headroom (`K * ULP(|P|) << epsilon`).
   - *Falsified as a complete architectural solution:* (a) Step-local `S_{k-1} -> S_k` verification passes `100/100` steps while global `binary64` drift violates `epsilon = 1e-7` over `K=100` steps at `1e8`; (b) absolute `areaEpsilon` masks `0.27%` relative area drift (`D-2`/`D-7`); and (c) exact dyadic `2S = 0` still misclassifies non-simple self-intersecting polygons as `"collinear"`.
4. **Does Candidate D deserve a separate Phase 2.5 research track?**
   - **`YES`** — specifically framed around **Physically Bounded Numerical Precision (OMR Operational Domain)** and **Representation C/D (Local Frame `P = O + deltaP` with exact/double-double anchor + construction provenance + topological simplicity)**. It solves the `ULP(|O|)` drift ceiling (`~10^12x` drift reduction in Exp 1) and separates workspace/assembly translations from local crease geometry, but requires new state/contract schemas that should **not** overload Phase 2.4 hardening.
5. **Smallest architectural change preserving current OMR contracts:**
   - **[PROPOSAL — Pending Explicit Authorization (`ROD-03`)]** Keep `Contract 02 v2` (`GeometryState` in `binary64`, `L2`/`L7` zero-import isolation) untouched for **Phase 2.4** by applying four minimal, contract-preserving patches:
     1. **`L2`:** Scale normal `(nx, ny)` by power-of-two `Math.hypot`/exponent scaling (`D-3`) without altering `GeometryState`.
     2. **`L7` Shoelace + `D-4`:** Replace `computeSignedArea` with exact `BigInt` centered/dyadic Shoelace and uncouple `areaEpsilon` from `epsilon` (`DEFAULT_VERIFIER_TOLERANCES.areaEpsilon`) + relative area check (`D-1, D-2, D-4, D-7`).
     3. **`L7` Topological & Collinearity Diagnostics:** Explicitly distinguish `2S = 0` with non-zero triple determinants + non-adjacent segment intersection (`non-simple / self-intersecting`) from true rank-1 collinearity in `verifyResult` diagnostics (Experiment 2 fix).
     4. **`L7` `verifyProcess` End-to-End Anchor & Domain Envelope:** In `verifyProcess`, track cumulative metric drift (`S_k` vs `S_0` edge lengths & `|area|`) alongside step-local residuals and declare an explicit single-step/coordinate admissibility envelope `(L_max, K_max)` — preventing Candidate B's `100`-step silent drift (`Experiment 1`) without changing a single `Contract 02` type signature.
