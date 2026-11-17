# OMR Phase 2.4 — Defect Taxonomy & Evidence Consolidation (`OMR_PHASE_2_4_DEFECT_TAXONOMY.md`)

**Execution Mode:** `STRICT READ-ONLY RESEARCH & AUDIT`  
**Authorization Status:** Research and evidence consolidation only. **No implementation is authorized.** `ROD-03` (`Phase 2.3.3`) remains `WAITING FOR EXPLICIT OWNER AUTHORIZATION`.  
**Primary Sources Examined:** [OMR_PHASE_2_4_EXPERIMENTAL_EVIDENCE.md](./OMR_PHASE_2_4_EXPERIMENTAL_EVIDENCE.md), [src/core/types.ts](./src/core/types.ts), [src/core/operationRequest.ts](./src/core/operationRequest.ts), [src/core/trace.ts](./src/core/trace.ts), [src/core/l2GeometryEngine.ts](./src/core/l2GeometryEngine.ts), [src/core/l7IndependentVerifier.ts](./src/core/l7IndependentVerifier.ts), [tests/contract02.test.ts](./tests/contract02.test.ts), [tests/metamorphic.test.ts](./tests/metamorphic.test.ts), [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md), [package.json](./package.json).

---

## 1. Executive Summary

This document consolidates the experimental evidence from OMR Phase 2.4 into a rigorous, non-authoritative defect taxonomy across `D-1` through `D-8`, cross-checked directly against the live repository state (`src/core/*`, `tests/*`, `docs/ARCHITECTURE.md`, `package.json`).

Key consolidated findings:
- **Epistemic discipline:** Every claim is strictly separated into **experimentally reproduced facts**, **mathematical conclusions**, **engineering interpretations**, **hypotheses**, and **unresolved questions**.
- **Dimension classification:**
  - **Numerical Integrity (`D-1`, `D-2`, `D-3`, `D-7`):** Confirmed in live IEEE-754 `binary64` executions. Note that `D-1` and `D-2` cross into epistemic impact because numerical failures in `L7` corrupt `VerificationVerdict` (`UNDETERMINED` or false `PASS`), while `D-7` bridges numerical tolerances and epistemic acceptance gates.
  - **Epistemic Integrity (`D-4`, `D-5`):** Confirmed in `src/core/l7IndependentVerifier.ts`. Silent tolerance coupling (`D-4`) and vacuous `orientationInverted: true` (`D-5`) undermine what `PASS` actually certifies without touching underlying arithmetic.
  - **Documentation / Infrastructure Integrity (`D-6`):** Verified across workspace inspection (root reconciliation completed previously; `18` attachment files reside in `public/assets/aistudio/`, `.git` absent locally, `tests/metamorphic.test.ts` duplicates Shoelace logic).
  - **Build Reproducibility & Bundle-Size Discrepancy (`D-8`):** Local `vite build` bundle size (`562.64 kB` / `562647 B`, `1666` modules) is **CONFIRMED** (`REPRODUCED`), while the root cause of the external `335.25 kB` discrepancy remains **INSUFFICIENT EVIDENCE** / **UNRESOLVED**.
- **Critical Corrections Verified Against Source Code:**
  - Contrary to earlier external dossier claims, `L2` **does throw** `DEGENERATE_NORMAL` on `n = (1e160, 1e160)` (via `!Number.isFinite(normSq)`), whereas `L2` silently returns `-Infinity` on finite normals with large coordinates (`n = (1,1), p = (1e308,0)`).
  - `D-4` in live code is an explicit fallback `areaEpsilon: overrides?.areaEpsilon ?? epsilon` (`l7IndependentVerifier.ts:59`), not independent uncoupled constants.

---

## 2. Evidence Integrity and Source Coverage

### 2.1 Source Coverage Audit
| Source | Coverage | Verification Status | Notes |
| :--- | :--- | :--- | :--- |
| [OMR_PHASE_2_4_EXPERIMENTAL_EVIDENCE.md](./OMR_PHASE_2_4_EXPERIMENTAL_EVIDENCE.md) | Complete read (`194` lines) | Cross-checked line-by-line | All reported numerical outputs match live `L2`/`L7` execution mechanics; missing coverage gaps noted below. |
| [src/core/l2GeometryEngine.ts](./src/core/l2GeometryEngine.ts) | Complete (`404` lines) | Directly verified | Lines `67–90`, `310–336` govern `D-3`. |
| [src/core/l7IndependentVerifier.ts](./src/core/l7IndependentVerifier.ts) | Complete (`1286` lines) | Directly verified | Lines `46–67` (`D-4`), `81–90` (`D-1`), `345–417`, `764–811`, `846–948` (`D-2`, `D-5`, `D-7`). |
| [src/core/types.ts](./src/core/types.ts), [operationRequest.ts](./src/core/operationRequest.ts), [trace.ts](./src/core/trace.ts) | Complete | Directly verified | Contract 02 v2 types and `deepFreeze` invariants intact. |
| [tests/contract02.test.ts](./tests/contract02.test.ts), [tests/metamorphic.test.ts](./tests/metamorphic.test.ts) | Complete (`19` + `17` = `36` tests) | Directly verified & executed (`36/36 PASS`) | Note: `tests/metamorphic.test.ts:1383–1417` duplicates non-centered `computeSignedArea` and uses strict `< 1e-12` (`DEGENERATE_AREA_THRESHOLD`), whereas `L7:896` uses `<=`. |
| [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md), [package.json](./package.json) | Complete | Directly verified | Contract 02 v2 rules and npm scripts verified. |
| External commit `a3397d9` & external `335.25 kB` bundle | Unavailable in sandbox | **UNAVAILABLE / UNVERIFIABLE** | `.git` is absent in this environment; external build artifacts do not exist locally. |

### 2.2 Cross-Check Discrepancies & Gaps in `OMR_PHASE_2_4_EXPERIMENTAL_EVIDENCE.md`
1. **Verified claims:** Every recorded numerical table in `OMR_PHASE_2_4_EXPERIMENTAL_EVIDENCE.md` (`D-1` Series A1/A2/B, `D-2` 7 cases, `D-3` 9 cases, `D-4` 6 override cases, `D-5` 4 face configs, `D-7` 2 tolerance bypasses, `D-8` build metrics, `npm test` `36/36`, `tsc --noEmit` exit `0`) is consistent with `src/core/` line-for-line logic.
2. **Evidence gaps identified during cross-check (`[NOT TESTED]`):**
   - `D-1`: Only $n=3$ triangles were executed experimentally; $n \ge 4$ non-convex/self-intersecting polygons remain `[MATHEMATICAL DERIVATION]` / `[NOT TESTED]`.
   - `D-3`: `L7` Stage C (`evalAxiomResidualsForLine`, `l7IndependentVerifier.ts:767–803`) overflow when `L2` returns a **finite** `pPrime` (e.g., an on-axis vertex `p = (1.5e158, -1.5e158)` with `n = (1e150, 1e150), c = 0`, where `L2` keeps `p' = p` finite because `dot = 0`, while `L7` computes `nx * (p.x + pPrime.x) = 4.5e308 -> Infinity`!) was not tested in the evidence report (`[NOT TESTED]`).
   - `D-4`: Coupling between `epsilon` and `degenerateAreaEpsilon` was not tabulated (source line `64` shows `degenerateAreaEpsilon` is **not** coupled to `epsilon`, unlike `areaEpsilon` on line `59`).
   - `D-7`: Boundary strictness (`<=` in `L7:896` vs `<` in `tests/metamorphic.test.ts:1411` at exact `1e-12`, and `<` vs `<=` at `1e-7`) was not explicitly probed.
   - `D-8`: Local bundle size (`562.64 kB`) was reproduced, but no chunk module-level diff/visualizer inspection was run (`dist/` contents beyond size/directory listing were not analyzed).

---

## 3. Defect Classification `D-1` through `D-8`

### Primary Taxonomy Overview
| ID | Primary Dimension | Secondary Dimension / Cross-Cut | Reproduction Status |
| :--- | :--- | :--- | :--- |
| **`D-1`** | **A. Numerical Integrity** | B. Epistemic Integrity (corrupts `L7` verdict into false `PASS` or `UNDETERMINED`) | **`CONFIRMED`** |
| **`D-2`** | **A. Numerical Integrity** | B. Epistemic Integrity (misclassifies non-degenerate micro-faces / degenerate needles) | **`CONFIRMED`** |
| **`D-3`** | **A. Numerical Integrity** | B. Epistemic Integrity (`L2` returns `-Infinity` without error; false `DEGENERATE_NORMAL` message) | **`CONFIRMED`** *(Dossier claim that `n=1e160` does not throw: `NOT REPRODUCED`)* |
| **`D-4`** | **B. Epistemic Integrity** | A. Numerical Integrity (silent override coupling alters area acceptance bounds) | **`CONFIRMED`** *(Dossier claim that tolerances are independent: `NOT REPRODUCED`)* |
| **`D-5`** | **B. Epistemic Integrity** | Contract 02 semantics (`orientationInverted: true` asserted vacuously) | **`CONFIRMED`** |
| **`D-6`** | **Documentation / Infrastructure Integrity** | Build cleanliness (`public/assets/aistudio/`) & test-code duplication | **`CONFIRMED`** (repo state verified; `.git` unavailable) |
| **`D-7`** | **A. Numerical Integrity** | B. Epistemic Integrity (verification gap between `1e-12` and `1e-7`) | **`CONFIRMED`** |
| **`D-8`** | **Build Reproducibility & Bundle-Size Discrepancy** | Infrastructure / toolchain environment | **`PARTIALLY CONFIRMED`** (Local `562.64 kB` `CONFIRMED`; external diff `INSUFFICIENT EVIDENCE`) |

---

### `D-1`: Shoelace Numerical Instability
1. **Original claim:** Non-centered Shoelace formula in `L7` loses precision under large coordinate translations $L$, causing zero area (`UNDETERMINED`) or wrong sign/magnitude.
2. **Exact source location:** `src/core/l7IndependentVerifier.ts:81-90` (`computeSignedArea`), invoked at lines `890-891`; duplicated in `tests/metamorphic.test.ts:1383-1403`.
3. **Experimental input conditions:** Right triangles $(L,L), (L+\Delta x, L), (L, L+\Delta y)$ for $L \in \{0, 10^6, 10^8, 10^9, 10^{10}\}$: Series A1 ($\Delta x=1, \Delta y=10^{-4}$, axis `y=0`), Series A2 (same, axis `x+2y=3`), Series B ($\Delta x=1, \Delta y=1$, axis `x+2y=3`).
4. **Observed output:**
   - **Series A1 (`y=0`):** At $L=10^6, 10^8, 10^9$, `shoelaceSrc = 0`, `shoelaceDst = 0`, `L7` returns `UNDETERMINED` (`orientationInverted: false`). At $L=10^{10}$, `shoelaceSrc = -8192`, `shoelaceDst = +8192`, and `L7` returns **false `PASS`** (`areaError: 0`, `orientationInverted: true`). Centered determinant and exact BigInt dyadic evaluation over the actual `binary64` coordinates yield `+4.9591064453125e-5` (sign `+1`) and `-4.9591064453125e-5` (sign `-1`).
   - **Series A2 & B (`x+2y=3`):** At $L=10^6, 10^8$, `L7` fails via `AREA_PRESERVATION_FAILED` (`areaError = 6.1e-5`, `0.25`, `0.5`). At $L=10^{10}$, Shoelace returns `-8192` / `+2048` (`areaError = 6144` in A2; `8192` in B).
5. **Expected mathematical or engineering behavior:** Translation invariance of signed area: $S(T_v(F)) = S(F)$ for the represented `binary64` polygon whenever vertex differences remain distinct in `binary64`. `L7` must never invert the sign or report `|S| = 8192` on a triangle whose `binary64` representation has area $\approx 5\cdot 10^{-5}$.
6. **Reproduction status:** **`CONFIRMED`** (`[REPRODUCED]`).
7. **Scope and limitations of evidence:** Experimentally tested only on $n=3$ triangles up to $L=10^{10}$. Does not yet cover $n \ge 4$ non-convex/self-intersecting polygons or shifts where $\Delta y \le \text{ULP}(L)$ (at which point `binary64` input quantization itself collapses the triangle before `L7` runs).
8. **Potential impact on OMR contracts:** Directly corrupts Contract 02 v2 Stage D (`areaPreserved`, `orientationInverted`, `areaError`, and `VerificationStatus`) without breaking schema types.
9. **Dependencies on other defects:** Interacts directly with `D-2` (zeroed Shoelace triggers the `<= degenerateAreaEpsilon` branch) and compounds with `D-3` / `L2` FP64 rounding at large $L$ (`Series A2` at $L \ge 10^9$).
10. **Additional experiment to strengthen/falsify:** Test non-convex polygons ($n = 4, 6, 12$) and shifts $L \in [10^{11}, 10^{15}]$ to separate FP64 input quantization collapse (`exactBinary64Area === 0`) from Shoelace cancellation, and compare simple centered `binary64` sum vs `TwoProduct`/`Sum2` expansion on concave $n$-gons.

---

### `D-2`: Scale-Dependent Degeneracy Threshold
1. **Original claim:** Fixed absolute `degenerateAreaEpsilon = 1e-12` ignores linear face size, falsely rejecting small well-conditioned triangles as collinear (`UNDETERMINED`) while accepting macro-scale near-collinear needles (`PASS`).
2. **Exact source location:** `src/core/l7IndependentVerifier.ts:50` (`DEFAULT_VERIFIER_TOLERANCES.degenerateAreaEpsilon = 1e-12`), line `896` (`Math.abs(signed0) <= tol.degenerateAreaEpsilon`); mirrored in `tests/metamorphic.test.ts:1405, 1411` (`< 1e-12`).
3. **Experimental input conditions:** Reflection across `y=0` of: micro right triangles (legs `1e-6`, `1e-7`), small equilateral (`side=1e-6`), long thin needle (`D=1e6, h=1e-10`), strictly collinear (`(0,0)-(1,1)-(2,2)`), and nearly collinear triangles (`D=1, h=1e-13`; `D=100, h=1e-12`).
4. **Observed output:**
   - Micro right (`1e-6`, `|S|=5e-13`, $\rho=0.5$), micro right (`1e-7`, `|S|=5e-15`, $\rho=0.5$), and small equilateral (`1e-6`, `|S|=4.33e-13`, $\rho=0.866$) all receive `L7` **`UNDETERMINED`**, `orientationInverted: false`.
   - Long needle (`D=1e6, h=1e-10`, `|S|=5e-5`, $\rho=10^{-16}$) and medium needle (`D=100, h=1e-12`, `|S|=5e-11`, $\rho=10^{-14}$) receive `L7` **`PASS`**, `orientationInverted: true`.
5. **Expected mathematical or engineering behavior:** Geometric degeneracy (collinearity) is scale-invariant under uniform scaling $p \mapsto k p$. Well-conditioned micro-faces should not be classified as "collinear vertices", and near-collinear macro-needles at machine-epsilon aspect ratio should not pass as robustly non-degenerate without explicit policy.
6. **Reproduction status:** **`CONFIRMED`** (`[REPRODUCED]`).
7. **Scope and limitations of evidence:** Tested on 7 unshifted triangles near origin; did not evaluate $n \ge 4$ self-intersecting polygons (where $S \approx 0$ even when $D > 0$ and vertices are non-collinear) or exact boundary `|S| === 1e-12` (`<=` vs `<`).
8. **Potential impact on OMR contracts:** Changing `degenerateAreaEpsilon` from `[L^2]` area semantics to a dimensionless shape ratio alters the meaning of `VerifierTolerances.degenerateAreaEpsilon` in Contract 02 v2 (`src/core/types.ts:140`).
9. **Dependencies on other defects:** Directly coupled to `D-1` (relies on `computeSignedArea` output) and `D-7` (interacts with absolute `areaEpsilon = 1e-7` on small accepted faces).
10. **Additional experiment to strengthen/falsify:** Evaluate $\rho = 2|S|/D^2$ vs $2|S|/P^2$ vs `minAltitude / D` on non-convex $n$-gons, bow-tie self-intersections, and translated micro-triangles ($L = 10^6, \text{leg} = 10^{-6}$).

---

### `D-3`: Normalization and Reflection Overflow/Underflow
1. **Original claim:** `L2` normal check (`normSq = nx*nx + ny*ny`) overflows/underflows at extreme normals, and earlier dossier analysis hypothesized `L2` fails silently on `(1e160, 1e160)`.
2. **Exact source location:** `src/core/l2GeometryEngine.ts:75-87` (`validateLineParams`), lines `310-316` (`reflectAcrossLine` projection), lines `324-330` (`claimedResiduals`); `src/core/l7IndependentVerifier.ts:396-406` (Stage A `norm`), lines `773-782` (Stage C `r_mid`, `r_perp`).
3. **Experimental input conditions:**
   - Normals `(1e160, 1e160)`, `(1e-160, 1e-160)` (default `eps0=1e-12` and `eps0=0`), `(1e308, 1e308)`, `(1e-308, 1e-308)` (default and `eps0=0`) at `p=(1,2), c=0`.
   - Finite normals with large coordinates: `n=(1,1)` at `p=(1e308,0)` and `(1e308,1e308)`; `n=(1e150,1e150)` at `p=(1e160,0)` and `(1e158,0)`.
4. **Observed output:**
   - `(1e160, 1e160)` & `(1e308, 1e308)`: `norm` is finite (`1.414e160`, `1.414e308`), `normSq = Infinity`, `L2` **throws** `L2EngineError('DEGENERATE_NORMAL')` with misleading message `||n|| = ... <= 1e-12`.
   - `(1e-160, 1e-160)` with `eps0=0`: `normSq = 2e-320` (subnormal precision loss), `L2` returns `(-2.000033398823774, -1.0000333988237742)` (error `~3.34e-5`), `L7` returns **`FAIL`** (`midpointError = 2.3617e-5`).
   - `(1e-308, 1e-308)` (both default and `eps0=0`): `normSq = 0` (underflow), `L2` throws `DEGENERATE_NORMAL`.
   - Finite normals `n=(1,1), p=(1e308,0)` and `n=(1e150,1e150), p=(1e158..1e160, 0)`: `nx*p.x` or `2*dot` overflows to `Infinity`, `L2` **returns without throwing** with `pPrime = (-Infinity, -Infinity)` and `claimedResiduals.maxMidpointError = Infinity`, causing `L7` to return **`UNDETERMINED`** — even though exact images `(0, -1e308)` and `(0, -1e158)` are finite and representable in `binary64`.
5. **Expected mathematical or engineering behavior:** Scale invariance $(n, c) \mapsto (\alpha n, \alpha c)$ should preserve finite reflections whenever inputs and true outputs are well inside `binary64` normal range; `L2` should never mislabel normal overflow as `||n|| <= 1e-12` nor silently emit `±Infinity` into `GeometryState` / `TRACE`.
6. **Reproduction status:** **`CONFIRMED`** as an `L2` numerical stability defect (`[REPRODUCED]`). *(Sub-claim from external dossier that `L2` does not throw on `n=(1e160,1e160)`: **`NOT REPRODUCED`**.)*
7. **Scope and limitations of evidence:** `L7` Stage C overflow on a **finite** `L2` output (e.g., `pPrime = p` on axis at `1.5e158` with `n=(1e150,1e150)`) was derived analytically (`[MATHEMATICAL DERIVATION]`) and was **`[NOT TESTED]`** in the experimental harness.
8. **Potential impact on OMR contracts:** Violates finite-number state invariants in `TRACE`/`GeometryState` (when `L2` outputs `-Infinity`) and `L2EngineError` error semantics; schemas in `types.ts` do not need breaking changes unless an explicit overflow error code is added.
9. **Dependencies on other defects:** Can invalidate coordinates downstream (`D-1` area / `L7` `UNDETERMINED`); scaling normals without scaling projection dot-products leaves projection overflow unfixed.
10. **Additional experiment to strengthen/falsify:** Execute `n=(1e150, 1e150), p=(1.5e158, -1.5e158), c=0` in `L2 -> L7` to confirm whether `L7` Stage C produces false `FAIL` (`midpointError = Infinity`) on an exact finite fixed-point state.

---

### `D-4`: Coupling of Linear and Area Tolerances
1. **Original claim:** Live `L7` silently couples `areaEpsilon` to `overrides.epsilon` in `resolveTolerances`; earlier external dossier erroneously claimed `epsilon` and `areaEpsilon` were independent constants lacking perimeter coupling.
2. **Exact source location:** `src/core/l7IndependentVerifier.ts:53-67` (specifically line `59`: `areaEpsilon: overrides?.areaEpsilon ?? epsilon`).
3. **Experimental input conditions:** Unit right triangle `(0,0),(1,0),(0,1)` reflected across `y=0`, with `C.y` tampered to `-5` (`deltaArea = 2.0`) and `-1 - 2e-8` (`deltaArea ≈ 1e-8`), tested under 6 `toleranceOverrides` combinations.
4. **Observed output:**
   - `{ epsilon: 10 }` alone on `deltaArea = 2.0`: **`PASS`** (`areaError = 2`, **`areaPreserved: true`**).
   - `{ epsilon: 10, areaEpsilon: 1e-7 }` on `deltaArea = 2.0`: **`FAIL`** (`areaPreserved: false`, `orientationInverted: false`, `axiomsSatisfied: true`).
   - `{ epsilon: 1e-10 }` alone on `deltaArea ≈ 1e-8`: **`FAIL`** via `AREA_PRESERVATION_FAILED` (`areaError = 1e-8 > areaEpsilon = 1e-10`).
   - `{ areaEpsilon: 1e-9 }` alone on `deltaArea ≈ 1e-8`: `axiomsSatisfied: true` (`epsilon` remained `1e-7`), `areaPreserved: false`.
5. **Expected mathematical or engineering behavior:** Overriding linear residual tolerance (`epsilon`, dimension $[L]$) must not silently overwrite area tolerance (`areaEpsilon`, dimension $[L^2]$); each tolerance should fall back to its own documented default (`DEFAULT_VERIFIER_TOLERANCES.areaEpsilon`).
6. **Reproduction status:** **`CONFIRMED`** (`[REPRODUCED]`) for the live unidirectional coupling `areaEpsilon ?? epsilon ?? 1e-7`. *(External dossier claim that `epsilon` and `areaEpsilon` are already independent in code: **`NOT REPRODUCED`**.)*
7. **Scope and limitations of evidence:** Exhaustively verified for `epsilon` and `areaEpsilon`; `zeroNormalEpsilon` and `degenerateAreaEpsilon` were verified by code inspection (`lines 60–65`) to fall back to `DEFAULT_VERIFIER_TOLERANCES` without coupling (`[VERIFIED FACT]`), not explicitly re-probed.
8. **Potential impact on OMR contracts:** Uncoupling `resolveTolerances` restores intended `VerifierTolerances` semantics in Contract 02 v2; however, any external caller relying on passing `{ epsilon }` alone to relax `areaEpsilon` simultaneously would observe stricter area checks.
9. **Dependencies on other defects:** Directly affects `D-7` (tolerance acceptance) and enabled the historical `D-5` isolation confusion until `{ epsilon: 10, areaEpsilon: 1e-7 }` was explicitly passed.
10. **Additional experiment to strengthen/falsify:** Audit all callers/tests across any candidate branches to confirm no legitimate test assumes `{ epsilon: X }` implicitly sets `areaEpsilon = X`.

---

### `D-5`: Vacuum `PASS` and Verification Semantics
1. **Original claim:** `L7` initializes `orientationInverted = true` and only gates failure on `hasNonDegenerateMovingFace`, emitting `status: 'PASS'` with `predicates.orientationInverted === true` even when zero moving non-degenerate faces were evaluated.
2. **Exact source location:** `src/core/l7IndependentVerifier.ts:847` (`let orientationInverted = true;`), line `857` (skips mixed faces), line `934` (`hasNonDegenerateMovingFace && !orientationInverted`), lines `939-947` (`UNDETERMINED` vs `PASS`).
3. **Experimental input conditions:** Valid `y=0` reflections across 4 topological configurations: (1) `faces: []`, (2) single mixed face (`moving=['C'], fixed=['A','B']`), (3) single degenerate moving face (`(0,0),(1,1),(2,2)`), (4) single fixed face + separate moving vertex `D`.
4. **Observed output:** Cases (1) `faces: []`, (2) mixed-only, and (4) fixed-only all returned **`status: 'PASS'`** with **`predicates.orientationInverted === true`** and `diagnostics: []`. Case (3) degenerate-only returned **`status: 'UNDETERMINED'`** with `orientationInverted: false`.
5. **Expected mathematical or engineering behavior:** Epistemic soundness: when no applicable moving non-degenerate face exists, orientation inversion was **not applicable** (`NOT_APPLICABLE`) — it was neither positively verified nor falsified. Returning `orientationInverted: true` conflates "no counterexample checked" with "property verified". *(Note: historical `D-5` in Phase 2.3.3 also referred to the debunked claim that `orientationInverted` could not fail in isolation; `{ epsilon: 10, areaEpsilon: 1e-7 }` already isolates it.)*
6. **Reproduction status:** **`CONFIRMED`** (`[REPRODUCED]`).
7. **Scope and limitations of evidence:** Tested on simple single-face / empty-face meshes; mixed + degenerate combinations (e.g., 1 mixed face + 1 degenerate face) behave per lines `939–944` (`UNDETERMINED` because `hasDegenerateMovingFace` is true while `hasNonDegenerateMovingFace` is false — verified in source `[VERIFIED FACT]`, `[NOT TESTED]` explicitly).
8. **Potential impact on OMR contracts:** **High Contract Impact.** `VerificationPredicates.orientationInverted` in `src/core/types.ts:165` is strictly `readonly orientationInverted: boolean`. Changing its type or making `faces: []` fail/undetermined breaks Contract 02 v2 and existing `contract02.test.ts` tests.
9. **Dependencies on other defects:** Directly adjacent to `D-2` (determines whether a moving face enters `hasDegenerateMovingFace` vs `hasNonDegenerateMovingFace`) and `D-7` (false/vacuous `PASS` semantics).
10. **Additional experiment to strengthen/falsify:** Inventory all existing `36` tests (`contract02.test.ts`, `metamorphic.test.ts`) that pass `faces: []` or mixed-only faces and check whether they assert `verdict.predicates.orientationInverted === true` or only `verdict.status === 'PASS'`.

---

### `D-6`: Documentation and Repository Infrastructure Integrity
1. **Original claim:** Documentation drift (`README.md`, `REPOSITORY_STRUCTURE.md` vs code), root clutter, `17+` attachment files inside `public/assets/aistudio/`, and duplicate helper logic / missing Property F extended suite.
2. **Exact source location:** Workspace root (`68+` historical/audit `.md` files), `public/assets/aistudio/` (`18` files), `tests/metamorphic.test.ts:1383-1417` (duplicate `computeSignedArea` and `DEGENERATE_AREA_THRESHOLD`), `src/core/` vs absent `tests/propertyF_v1.test.ts`.
3. **Experimental input conditions:** Directory inventory, file hashing, `npm test`, and link checks across the live workspace.
4. **Observed output:** Earlier reconciliation aligned top-level docs (`README.md`, `OMR_ARCHITECTURE_*`, `DOCUMENTATION_RECONCILIATION_REPORT.md`); `.git` is absent (`GIT_ABSENT`); `18` files remain in `public/assets/aistudio/` (intentionally preserved per `ROD-02`/`OD-05` and Phase 2.4 attachment); `tests/metamorphic.test.ts` retains `computeSignedArea` using Shoelace with `< 1e-12` (differing from `L7`'s `<= 1e-12`); `36/36` tests exist (`tests/propertyF_v1.test.ts` absent pending `ROD-03`).
5. **Expected mathematical or engineering behavior:** Single source of truth for test counts/status, strict separation of historical attachments from runtime `dist/assets/` if archived post-Phase 2.3.3, and zero undocumented divergence between test helpers (`<`) and `L7` (`<=`).
6. **Reproduction status:** **`CONFIRMED`** for workspace state and helper duplication (`[VERIFIED FACT]`); external commit `a3397d9` claims are **`INSUFFICIENT EVIDENCE`** because `.git` is absent.
7. **Scope and limitations of evidence:** Complete local filesystem inspection; git history unreachable.
8. **Potential impact on OMR contracts:** Zero direct impact on Contract 02 types; affects audit traceability and `ROD-03` governance.
9. **Dependencies on other defects:** `D-6` (`public/assets/aistudio/`) empirically clarifies `D-8` (static files are copied to `dist/assets/aistudio/`, **not** bundled into the JS chunk). Also shares `computeSignedArea` vulnerability (`D-1`) inside `tests/metamorphic.test.ts`.
10. **Additional experiment to strengthen/falsify:** Diff `<` vs `<=` at exact `|S| = 1e-12` between `tests/metamorphic.test.ts:1411` and `l7IndependentVerifier.ts:896`.

---

### `D-7`: Insufficient Sensitivity of Geometric Verification Tolerances
1. **Original claim:** Default `L7` tolerances (`epsilon = 1e-7`, `areaEpsilon = 1e-7`) allow large coordinate/area corruptions relative to metamorphic accuracy (`1e-12`) and relative to small-face areas; additionally, basic Property F tests in `tests/metamorphic.test.ts` omit 6-level classification and `L7`-isolated degenerate/mixed/FIXED_CHANGED controls.
2. **Exact source location:** `src/core/l7IndependentVerifier.ts:46-51` (`DEFAULT_VERIFIER_TOLERANCES`), lines `728, 749, 806, 902, 912, 919`; vs `tests/metamorphic.test.ts:45, 1414-1417, 1419-1718`.
3. **Experimental input conditions:** (a) Unit triangle + fixed `F(5,5)` with moving `C'.y` displaced by `5e-8` and `F.x` displaced by `9e-8`; (b) thin non-degenerate triangle `(0,0),(1,0),(0,1e-11)` (`|S0|=5e-12 > 1e-12`) with reflected `C'.y` distorted from `-1e-11` to `-9e-8`.
4. **Observed output:** Both corruptions return **`L7 status: 'PASS'`** with all 9 predicates `true`: (a) `maxFixedDisplacement = 9e-8`, `maxLengthError = 5e-8`, `areaError = 2.5e-8`; (b) **`9000x` relative area and height distortion** yields `areaError = 4.4995e-8 <= 1e-7` and `PASS`.
5. **Expected mathematical or engineering behavior:** Acceptance tolerances should reflect explicit mathematical bounds (linear vs quadratic area propagation, relative vs absolute bounds for small admissible faces), and test coverage should explicitly separate L2-precision oracle checks (`1e-12` / ULP) from `L7` certifying bounds (`1e-7` or refined model).
6. **Reproduction status:** **`CONFIRMED`** (`[REPRODUCED]`).
7. **Scope and limitations of evidence:** Verified at default tolerances for small/unit scales; did not test scale-dependent relaxation needed when `ULP(L) > 1e-7` (e.g., $L = 10^{10}$ where exact FP64 reflection exceeds `epsilon = 1e-7`, as seen in `D-1` Series A2/B at $L \ge 10^9$).
8. **Potential impact on OMR contracts:** Tightening `DEFAULT_VERIFIER_TOLERANCES` or changing `areaEpsilon` to relative/perimeter-coupled affects all Contract 02 v2 consumers and multi-step chains (`verifyProcess`).
9. **Dependencies on other defects:** Directly interacts with `D-2` (tiny faces near `1e-12` can suffer huge relative errors under `areaEpsilon = 1e-7`), `D-4` (`resolveTolerances` coupling), and `D-5` (false/vacuous `PASS`).
10. **Additional experiment to strengthen/falsify:** Sweep `L2` ULP rounding error vs `L7` residuals across scales $10^{-10} \dots 10^{12}$ and polygon perimeters $P \in [10^{-6}, 10^6]$ to determine mathematically achievable `L7` lower/upper bounds.

---

### `D-8`: Build Reproducibility and Bundle-Size Discrepancy
1. **Original claim:** Historical AI Studio builds produce `562.64 kB` JS bundle whereas an external environment (Claude) reported `335.25 kB` on ostensibly matching major dependencies.
2. **Exact source location:** `package.json`, `vite.config.ts`, `dist/assets/index-BkBji0rN.js` (generated during `npm run build`).
3. **Experimental input conditions:** Executed `npm run build` (`vite build`) in AI Studio (`vite 8.3.8`, `typescript 7.0.2`, `react 19.3.1`, `react-dom 19.3.1`, `@tailwindcss/vite 4.3.5`, `esbuild 0.28.2`, `rolldown 1.2.19`).
4. **Observed output:** `vite build` succeeded in `875 ms`, transforming `1666` modules: `dist/index.html` (`1.62 kB` / `1627 B`), `dist/assets/index-DB-ql1sT.css` (`25.09 kB` / `25093 B`), **`dist/assets/index-BkBji0rN.js` = `562.64 kB` (`562647 B`, gzip `162.04 kB`)**. Attachments in `public/assets/aistudio/` were copied verbatim into `dist/assets/aistudio/` and excluded from the JS chunk.
5. **Expected mathematical or engineering behavior:** Reproducible deterministic production bundles across identical source + lockfile environments, or an explicit explanation of any toolchain/module difference.
6. **Reproduction status:** **`PARTIALLY CONFIRMED`** — local `562.64 kB` (`562647 B`, `1666` modules) is **`CONFIRMED`** (`[REPRODUCED]`), and the hypothesis that `public/assets/aistudio/` files bloat the `.js` bundle is falsified (`NOT REPRODUCED`). The comparative discrepancy vs external `335.25 kB` remains **`INSUFFICIENT EVIDENCE` / `[UNRESOLVED]`**.
7. **Scope and limitations of evidence:** External `335.25 kB` build artifacts, external `package-lock.json`/`rolldown` minor versions, and chunk symbol composition (`1666` modules in `dist/assets/index-BkBji0rN.js`) were not inspected.
8. **Potential impact on OMR contracts:** None on `src/core/` mathematical contracts (`L2`/`L7`/Contract 02).
9. **Dependencies on other defects:** Partially tested against `D-6` (`public/assets/aistudio/` does **not** enter the JS bundle; `src/` UI/Lucide/React/Vite Rolldown chunking governs JS size).
10. **Additional experiment to strengthen/falsify:** Run a bundle-treemap / AST module-size inspection on `dist/assets/index-BkBji0rN.js` (listing top 20 contributors among the `1666` modules) and compare `bun.lock` vs `package-lock.json` versions (`lucide-react` tree-shaking, `react` dev/prod mode, `rolldown` minifier).

---

## 4. Numerical Integrity Analysis

### 4.1 Explicit Category Distinctions (`[MATHEMATICAL DERIVATION]`)
To prevent category errors in Phase 2.4 design, the following concepts must remain strictly separated:
1. **Exact mathematical degeneracy:** Exact geometric collapse over $\mathbb{R}$ or $\mathbb{Q}$ (e.g., $\det(p_1-p_0, p_2-p_0) = 0$ over $\mathbb{Q}$, $\|n\| = 0$, zero edge length).
2. **Numerical near-degeneracy:** Non-zero exact geometry whose aspect ratio or feature size approaches IEEE-754 precision limits ($\rho \sim \varepsilon_{\text{mach}}$ or feature $\sim \text{ULP}(L)$), where floating-point cancellation flips signs or produces noise indistinguishable from zero.
3. **Application-specific ill-conditioning:** Valid, well-separated `binary64` geometry that is too sharp, thin, or extreme for downstream physical/domain tolerances (e.g., an admissible needle triangle with $\rho = 10^{-8}$ that loses 8 digits in downstream solvers or fails physical material folding rules).
4. **Mathematical verification:** Exact symbolic/axiomatic proof over $\mathbb{R}$ or $\mathbb{Q}$ without rounding error.
5. **Numerical verification:** Residual-based checking (`L7`) within explicit finite-precision error bounds (`binary64` tolerances for axioms, lengths, and areas) over quantized inputs.
6. **Physical simulation / experimental validation:** Material thickness, plastic hinges, layer ordering (`PWRP`/`L3–L4`), and physical feasibility—completely outside `L2`/`L7` planar reflection verification.

### 4.2 Mandatory Mathematical Restrictions (`[MATHEMATICAL DERIVATION]`)
1. **Centered Shoelace is NOT an exact orientation predicate:** Centering $u_i = p_i - p_0$ removes $O(\|T\|^2 \varepsilon_{\text{mach}})$ translation cancellation, **but** (a) in `binary64`, $u_{1x} u_{2y} - u_{2x} u_{1y}$ still suffers catastrophic cancellation when triangles are nearly collinear ($\rho \to \varepsilon_{\text{mach}}$), and (b) for general $n$-gons ($n \ge 4$), non-convex or self-intersecting polygons require error-free expansion / exact dyadic summation rather than plain FP64 subtraction or a single 3-point `orient2d` call.
2. **`Math.hypot` alone does NOT prevent all overflow in reflection calculations:** `Math.hypot(nx, ny)` stays finite up to $\sim 1.797\cdot 10^{308}$ (`D-3` confirmed `norm` finite at `1e308`), yet `L2` still failed because `normSq = nx*nx + ny*ny` overflowed at `1e160`, `nx*p.x` overflowed at `n=1e150, p=1e160`, and `2*signedOffset` overflowed at `n=(1,1), p=(1e308,0)` even though the exact reflection `(0, -1e308)` is completely representable.
3. **No single scale-free degeneracy threshold is universally correct:** While $\rho = 2|S|/D^2$ removes `D-2`'s linear-scale bias, any chosen $\eta_{\text{deg}}$ encodes a trade-off between rejecting near-collinear noise and accepting legitimately skinny meshes (`n`-gons, self-intersections where $S=0$ with $D>0$, or anisotropic creases).
4. **Linear and area tolerances cannot be derived from one another without explicit mathematical assumptions:** The linearized bound $|\delta S| \le \frac{1}{2} P \varepsilon$ holds only for small perturbations $\varepsilon \ll \min_i \|e_i\|$ (omitting the $O(n\varepsilon^2)$ second-order term) and assumes worst-case adversarial vertex perturbations rather than correlated rigid/floating-point rounding.
5. **Exact arithmetic over `binary64` values does NOT reconstruct original intended decimal or rational inputs:** `binary64ToExactDyadic` operates on **Level C** (the already quantized `binary64` numbers in `GeometryState`), not **Level B** (the intended decimal `1e-4` or rational `1/3`). As seen in `D-1` at $L=10^{10}$, `exactSrcArea` over `binary64` is `+4.9591064453125e-5`, already differing by `~0.82%` from the intended mathematical `+5e-5` due to input quantization in `1e10 + 1e-4`.

---

## 5. Epistemic Integrity Analysis

### 5.1 Core Epistemic Invariants (`[VERIFIED FACT]` & `[ENGINEERING PROPOSAL]`)
- **Producer claim $\ne$ Receiver truth:** Under `Contract 02 v2` (`docs/ARCHITECTURE.md:45-53`), `L2`'s `ReflectionWitness.claimedResiduals` is explicitly ignored by `L7`. However, `D-4` and `D-5` show that `L7` itself can weaken its own epistemic guarantees.
- **`PASS` does NOT mean physical feasibility:** `L7` checks mathematical/numerical planar reflection axioms (`r_mid`, `r_perp`), 2D graph rigidity, and orientation sign reversal—zero overlap (`L3`), thickness (`PWRP`), or constructibility (`MCAR`).
- **`UNDETERMINED` does NOT mean `FALSE`:** `UNDETERMINED` strictly means the verifier cannot establish truth or falsehood within admissible inputs/precision (e.g., collinear face `signed0 = 0`, non-finite inputs, or `||n|| <= epsZero`). Yet `D-1` causes genuine non-degenerate faces to fall into `UNDETERMINED`, while `D-2` pushes well-conditioned `1e-6` faces into `UNDETERMINED`.

### 5.2 Mechanisms Eroding Epistemic Integrity
1. **Silent Tolerance Weakening (`D-4`):** A caller adjusting linear axiom tolerances (`{ epsilon: 10 }`) silently relaxes `areaEpsilon` to `10`, causing `L7` to certify a `400%` area distortion (`0.5 -> -2.5`) as `PASS` (`areaPreserved: true`) without any diagnostic warning.
2. **Vacuous Predicate Certification (`D-5`):** Initializing `orientationInverted = true` asserts a positive universal property when the domain of quantification (purely moving non-degenerate faces) is **empty** (`faces: []`, mixed-only, fixed-only). A downstream consumer inspecting `verdict.predicates.orientationInverted === true` cannot distinguish "verified across 10 faces" from "0 faces checked".
3. **False `PASS` via Cancellation (`D-1`):** At $L=10^{10}$ across `y=0`, two identically broken Shoelace evaluations (`-8192` and `+8192`) cancel in `areaError` and invert signs artificially, producing `PASS` with `diagnostics: []`.

---

## 6. Documentation and Build Integrity (`D-6` & `D-8`)

- **`D-6` (Documentation & Repository State):**
  - Top-level documentation reconciliation (`README.md`, `OMR_ARCHITECTURE_*`, `DOCUMENTATION_RECONCILIATION_REPORT.md`) is already reflected on disk, resolving historical README/test-count staleness.
  - Remaining infrastructure issues (`[VERIFIED FACT]`): (1) absence of `.git` prevents commit provenance checks (`a3397d9`); (2) `18` attachment files persist in `public/assets/aistudio/` (protected by `ROD-02`/`OD-05`); (3) `tests/metamorphic.test.ts:1383-1417` duplicates Shoelace and disagrees on `<` vs `<=` at `1e-12`; (4) `tests/propertyF_v1.test.ts` awaits `ROD-03`.
- **`D-8` (Build Integrity):**
  - `npm test` (`36/36`), `npm run lint` (`tsc --noEmit`), and `npm run build` (`vite build`) all succeed cleanly (`exit 0`).
  - `562.64 kB` (`562647 B`) JS chunk size is reproducibly confirmed in AI Studio and definitively **not** caused by inlining `public/assets/aistudio/` (which Vite copies directly to `dist/assets/aistudio/`).
  - The differential gap vs the external `335.25 kB` measurement remains **`UNRESOLVED`** (`INSUFFICIENT EVIDENCE`) until module-level bundle composition or external toolchain details are compared.

---

## 7. Cross-Defect Dependency Matrix

| Defect Pair | Classification | Reasoning |
| :--- | :--- | :--- |
| **`D-1 ↔ D-2`** | **`DIRECT DEPENDENCY`** | `L7` passes `computeSignedArea(srcPts)` (`D-1`) directly into `Math.abs(signed0) <= tol.degenerateAreaEpsilon` (`D-2`, line `896`). As reproduced at $L=10^6..10^9$ (`Series A1`), Shoelace cancellation zeros out `signed0`, triggering `D-2`'s degeneracy branch on a non-degenerate triangle. |
| **`D-2 ↔ D-7`** | **`INDIRECT RELATIONSHIP`** | `D-2` decides which faces are admitted as non-degenerate into Stage D, while `D-7` governs the acceptance band (`areaEpsilon = 1e-7`) applied to admitted faces. Because `D-2` admits macro-needles (`1e6 x 1e-10`) and rejects micro-triangles (`1e-6`), while `D-7` accepts `areaError <= 1e-7` regardless of face size, small admitted faces (`5e-12`) can suffer `9000x` relative distortion (`D-7b`). |
| **`D-3 ↔ D-1`** | **`SHARED ROOT CAUSE`** *(plus secondary downstream cascade)* | Both stem from unscaled naive `binary64` algebraic formulas (`nx*nx + ny*ny`, `2*dot`, $\sum x_i y_{i+1} - x_{i+1} y_i$) applied without range/shift conditioning. In addition, `L2` coordinate quantization or `-Infinity` (`D-3`) feeds directly into `L7` Stage D area evaluation (`D-1`), though `D-1` triggers independently even when `L2` is exact (e.g., `y=0` reflection). |
| **`D-4 ↔ D-7`** | **`DIRECT DEPENDENCY`** | `D-4` (`areaEpsilon ?? epsilon`) directly alters the effective area acceptance threshold evaluated in `D-7`: widening `epsilon` silently widens `D-7`'s area pass band (`deltaArea = 2.0 -> PASS`), and tightening `epsilon` silently tightens it. |
| **`D-5 ↔ D-7`** | **`SHARED ROOT CAUSE`** *(and **`INDIRECT RELATIONSHIP`**)* | Both reflect coarse Stage D epistemic rules under `Contract 02 v2`: `D-5` treats unverified/empty face sets as `orientationInverted: true` (`PASS`), while `D-7` treats coarse `1e-7` residuals as full geometric `PASS` even when `1e-12` or relative accuracy fails. Together they create blind spots where `PASS` overstates verification coverage. |
| **`D-8 ↔ D-6`** | **`NO DEMONSTRATED RELATIONSHIP`** *(for JS chunk size)* | Experimental build execution showed `public/assets/aistudio/` (`D-6`) is copied as static files to `dist/assets/aistudio/` and **not** bundled into `index-BkBji0rN.js` (`562.64 kB`). No evidence links the `68+` `.md` documentation files or `public/assets/aistudio/` to the `562.64 kB` vs `335.25 kB` JS bundle discrepancy. |

---

## 8. Risk Prioritization

### A. Mathematical / Numerical Risk Ranking
| Rank | Defect | Rationale & Supporting Evidence |
| :-: | :--- | :--- |
| **1** | **`D-3`** | **Highest catastrophic domain failure:** `L2` silently returns `(-Infinity, -Infinity)` into `GeometryState`/`TRACE` on finite representable reflections (`n=(1,1), p=(1e308,0)`), falsely throws `DEGENERATE_NORMAL` on finite normal `1e160`, and loses `~3.34e-5` accuracy in subnormals (`n=1e-160`). |
| **2** | **`D-1`** | **Highest silent sign/magnitude corruption:** Produces `0` area at $L \ge 10^6$ and `-8192` (inverted sign, $1.64\times 10^8\times$ magnitude error, false `PASS`) at $L = 10^{10}$ on non-degenerate `binary64` coordinates. |
| **3** | **`D-2`** | **Scale-invariance breakdown:** Rejects ideal $\rho = 0.866$ equilateral micro-triangles (`1e-6`) as collinear and admits $\rho = 10^{-16}$ needles (`1e6 x 1e-10`) as non-degenerate. |
| **4** | **`D-7`** | **Quantitative precision gap:** Permits `9000x` relative distortion on small admissible faces (`|S0|=5e-12`) and `5e-8`/`9e-8` coordinate errors to pass `L7`. |
| *(N/A)* | `D-4`, `D-5`, `D-6`, `D-8` | Primarily epistemic, configuration, documentation, or build-artifact issues rather than numerical instability. |

### B. Verification / Epistemic Risk Ranking
| Rank | Defect | Rationale & Supporting Evidence |
| :-: | :--- | :--- |
| **1** | **`D-4`** | **Silent verifier subversion:** A single parameter override `{ epsilon: 10 }` silently disables `areaEpsilon = 1e-7`, letting `L7` return `PASS` (`areaPreserved: true`) on a `400%` area mutation (`deltaArea = 2.0`). |
| **2** | **`D-1`** | **False certification of corrupted orientation:** At $L=10^{10}$ (`y=0`), `L7` reports `status: 'PASS'` and `orientationInverted: true` while computed face areas are completely wrong (`-8192` vs `+4.959e-5`), and falsely marks valid shifted meshes `UNDETERMINED` at $L=10^6..10^9$. |
| **3** | **`D-5`** | **Vacuous truth assertion:** `L7` asserts `predicates.orientationInverted === true` and `PASS` when zero applicable moving faces exist (`faces: []`, mixed-only, fixed-only), conflating `NOT_APPLICABLE` with `VERIFIED`. |
| **4** | **`D-7`** | **Overclaiming by `PASS`:** `L7` `PASS` at `1e-7` masks `50,000x` regressions beyond the `1e-12` metamorphic oracle and `9000x` relative distortions on small faces. |
| **5** | **`D-2`** | **Misclassification of verification state:** Confuses geometric collinearity (`UNDETERMINED`) with small physical scale, and masks numerical fragility on extreme needles (`PASS`). |
| **6** | **`D-3`** | **Misleading error attribution:** Emits `DEGENERATE_NORMAL (||n|| = 1.41e160 <= 1e-12)` and delegates `L2` projection overflow to `L7` `UNDETERMINED` instead of explicit numerical domain errors. |
| **7** | **`D-6` / `D-8`** | **Traceability & environment transparency:** Local `.git` absence, test Shoelace duplication, and unresolved `D-8` bundle delta limit full external cross-environment provenance without corrupting `L7` runtime verdicts. |

---

## 9. Readiness Assessment & Architectural Consequences

### 9.1 Architectural Consequences (Research Proposals Only)
The experimental evidence supports evaluating a clean conceptual separation into two layers while strictly preserving **`Producer claim != Receiver truth`** and **`L7` runtime isolation** (`L7` must never import `L2` execution logic):

1. **Numerical Integrity Layer (`[ENGINEERING PROPOSAL]`):**
   - Scope: Scale-safe arithmetic (`2^k` exponent scaling for normals and dot-product projections), robust geometric primitives (`TwoProduct`/`Sum2` or exact dyadic integer summation over centered coordinates for arbitrary $n$-gons; `orient2d` only as a $n=3$ sign filter), explicit overflow/underflow guards, and well-defined error bounds.
   - Isolation rule: If `L2` and `L7` share low-level IEEE-754 primitives (e.g., `frexp/ldexp` or `exactDyadicArea`), they must remain distinct in geometric algorithms (Householder projection in `L2` vs reflection residuals + metric/area axioms in `L7`) to prevent Common-Mode Failures.
2. **Verification Semantics Layer (`[ENGINEERING PROPOSAL]`):**
   - Scope: Separate applicability and verification states (`VERIFIED`, `NOT_VERIFIED`, `NOT_APPLICABLE`) from binary pass/fail assumptions, and clarify `PASS` / `FAIL` / `UNDETERMINED` semantics in future contract revisions without breaking Contract 02 v2 prematurely.

### 9.2 Defect Readiness Classification
| Defect | Readiness Classification | Justification |
| :--- | :--- | :--- |
| **`D-1`** | **`READY FOR SOLUTION DESIGN`** | Root cause, failure thresholds ($L \ge 10^6..10^{10}$), and exact dyadic/centered alternatives are completely established. *(Design readiness $\ne$ authorization to implement.)* |
| **`D-2`** | **`REQUIRES ARCHITECTURAL DECISION`** | Mathematical scale invariance is confirmed, but choosing $\eta_{\text{deg}}$, handling $n \ge 4$ self-intersections, and deciding Contract 02 compatibility for `degenerateAreaEpsilon` require owner policy decisions. |
| **`D-3`** | **`READY FOR SOLUTION DESIGN`** *(with minor extra experiment on `L7` Stage C overflow)* | Both normal `normSq` overflow/subnormal precision collapse and projection overflow (`2*dot`, `nx*px`) are reproduced; requires policy confirmation on throwing vs scaled projection at `MAX_VALUE` boundary. |
| **`D-4`** | **`READY FOR SOLUTION DESIGN`** | Root cause (`l7IndependentVerifier.ts:59`) and exact fix (`?? DEFAULT_VERIFIER_TOLERANCES.areaEpsilon`) are fully verified; needs only owner decision on whether perimeter-coupled `areaEpsilon` is part of Phase 2.4 or deferred. |
| **`D-5`** | **`REQUIRES ARCHITECTURAL DECISION`** | Behavior is 100% reproduced, but modifying `VerificationPredicates.orientationInverted` or adding `NOT_APPLICABLE` touches `Contract 02 v2` (`src/core/types.ts:165`) and requires explicit owner contract sign-off. |
| **`D-6`** | **`REQUIRES ARCHITECTURAL DECISION`** | Governed by existing owner directives (`ROD-02`/`OD-05`, `ROD-03`); missing `.git` provenance cannot be resolved from inside the sandbox. |
| **`D-7`** | **`REQUIRES ARCHITECTURAL DECISION`** *(and **`REQUIRES ADDITIONAL EXPERIMENTS`**)* | Gap is reproduced, but tightening or relativizing `L7` tolerances vs isolating an independent `tests/` oracle involves contract compatibility and multi-scale error-bound calibration (`ROD-03` decoupling). |
| **`D-8`** | **`INSUFFICIENT EVIDENCE`** | Local `562.64 kB` build is confirmed, but external `335.25 kB` build contents and toolchain tree-shaking differences are unavailable here. |

---

## 10. Unresolved Questions

1. **`UQ-01` (`D-2`):** What exact dimensionless degeneracy metric ($\rho = 2|S|/D^2$, $2|S|/P^2$, or altitude/diameter) and policy threshold $\eta_{\text{deg}}$ should replace `degenerateAreaEpsilon = 1e-12`, and how should self-intersecting polygons ($n \ge 4$, $S = 0, D > 0$) be classified?
2. **`UQ-02` (`D-3`):** When a mathematically exact reflection output genuinely exceeds `Number.MAX_VALUE`, should `L2` throw `L2EngineError('INVALID_COORDINATE')` instead of emitting `±Infinity` into `GeometryState` and `TRACE`?
3. **`UQ-03` (`D-4` / `D-7`):** Should Phase 2.4 strictly uncouple `areaEpsilon` from `epsilon` (`D-4` bugfix only), or also introduce perimeter-coupled / relative area tolerances (`|\delta S| \le \frac{1}{2} P \varepsilon + \dots`) in `L7`?
4. **`UQ-04` (`D-5`):** Within `Contract 02 v2` vs `v3`, how should vacuous `orientationInverted: true` be resolved without breaking existing callers (`faces: []`, mixed-only, fixed-only)?
5. **`UQ-05` (`D-1` / `Contract 02`):** For $n \ge 4$ faces, should `Phase 2.4` compute signed area via centered `TwoProduct`+`Sum2` expansion with exact `BigInt` fallback on `binary64` inputs (Level C), deferring exact rational `ExactGeometryState` (Level B) to `Phase 2.5+`?
6. **`UQ-06` (`D-8`):** Why does identical source + `vite 8.3.8` / `typescript 7.0.2` / `rolldown 1.2.19` produce `562.64 kB` in AI Studio vs `335.25 kB` in the external Claude environment?

---

## 11. Recommended Next Research Experiments (Read-Only Only)

1. **Test `L7` Stage C Overflow on Finite `L2` Outputs (`D-3`):** Run `n = (1e150, 1e150), c = 0, p = (1.5e158, -1.5e158)` through `L2 -> L7` to test whether `L7` falsely returns `FAIL` (`midpointError = Infinity`) when `L2` returns an exact finite fixed point.
2. **Non-Convex & Self-Intersecting $n$-Gons Across Translations (`D-1` / `D-2`):** Run shifted concave 5-gons, 12-gons, and bow-tie quads ($L \in [0, 10^{10}]$) comparing Shoelace, centered FP64, and exact `BigInt` dyadic summation.
3. **`1e-12` Boundary Strictness Check (`D-2` / `D-6`):** Test exact `|S| === 1e-12` against `L7:896` (`<=`) vs `tests/metamorphic.test.ts:1411` (`<`).
4. **Multi-Scale `L2` Error Calibration (`D-7`):** Measure actual `L2` ULP and residual errors across coordinates $10^{-12} \dots 10^{12}$ and $100\dots 1000$-step reflection chains against an exact `BigRational` reference in memory.
5. **Read-Only Bundle Composition Audit (`D-8`):** Inspect top module contributors inside `dist/assets/index-BkBji0rN.js` (e.g., via source map / bundle symbol scan) to determine what accounts for the `562.64 kB` JS payload locally.

---

## 12. Explicit Non-Authorization Statement

This document is strictly a **read-only research and evidence-consolidation artifact**.
- **No Phase 2.4 implementation is authorized** by this report or by the readiness classifications in Section 9.
- **No source files, tests, configurations, package files, or existing contracts/documentation were modified** during its production.
- **`ROD-03` (`Phase 2.3.3` Property F test layer)** remains **`WAITING FOR EXPLICIT OWNER AUTHORIZATION`** and is not superseded, triggered, or merged into Phase 2.4 by this taxonomy.
- Any transition to solution implementation requires explicit owner decisions on all architectural questions (`UQ-01`–`UQ-05`) and separate explicit authorization.
