# Numerical and Invariant Foundations (`NUMERICAL_AND_INVARIANT_FOUNDATIONS.md`)

> **Document Status:** `RESEARCH ONLY — NON-CANONICAL`  
> **Scope:** Consolidated mathematical invariants, reflection axioms, IEEE-754 `binary64` counterexamples (`D-1`–`D-5`, `D-7`), bow-tie topological separation, exact dyadic/rational oracle foundations, and anchored-frame evaluation recovered directly from repository code and Phase 2.3–2.5.1 audits.  
> **Core Baseline Preserved:** `src/core/*` and `tests/*` remain frozen at `v0.1.0-alpha` (`36/36` passing tests). Architectural upgrades documented below (`Candidate B`, `BigRational Oracle`, `Anchored Local Frame`) are **NOT implemented** in `src/core/`.

---

## Summary Index of Consolidated Findings

| ID | Topic | Epistemic Status | Implementation Status in `src/core/` |
| :--- | :--- | :--- | :--- |
| [`F-E1`](#f-e1-orthogonal-projection-reflection-householder-matrix-and-l7-sufficiency-identity) | Reflection equation, Householder $H$, and $r_{\text{mid}}/r_{\text{perp}}$ sufficiency identity | **`PROVEN`** | Implemented (`l2GeometryEngine.ts`, `l7IndependentVerifier.ts`) |
| [`F-E2`](#f-e2-metamorphic-properties-ag-and-six-outcome-property-f-classification) | Metamorphic Properties `A–G` and 6-outcome Property `F` classification | **`DERIVED`** *(spec `DOCUMENTED`)* | `A–F3` tested (`metamorphic.test.ts`); `classifyPropertyF` frozen (`ROD-03`) |
| [`F-D1`](#f-d1-uncentered-shoelace-cancellation-and-invalidity-of-orient2d-alone-for-general-n-gons) | Uncentered Shoelace shift cancellation & `orient2d` limit for $n \ge 4$ | **`EXPERIMENTALLY_OBSERVED`** & **`DERIVED`** | Vulnerable formula active in `l7IndependentVerifier.ts:81-90` |
| [`F-D2`](#f-d2-absolute-degeneracy-threshold-and-scale-dependence) | Absolute `degenerateAreaEpsilon = 1e-12` scale dependence | **`EXPERIMENTALLY_OBSERVED`** | Active in `l7IndependentVerifier.ts:50, 896` |
| [`F-D3`](#f-d3-normal-vector-overflow-subnormal-underflow-and-projection-overflow) | Normal `normSq` overflow, subnormal loss, & projection overflow | **`EXPERIMENTALLY_OBSERVED`** & **`DERIVED`** | Active in `l2GeometryEngine.ts:75-87, 310-316` |
| [`F-D4`](#f-d4-tolerance-coupling-and-linearized-perimeter-based-area-perturbation-bound) | `resolveTolerances` coupling & $|\delta S| \le \frac{1}{2} P |\delta p| + O(n\varepsilon^2)$ | **`EXPERIMENTALLY_OBSERVED`** & **`DERIVED`** | Coupling active in `l7IndependentVerifier.ts:59` |
| [`F-D5`](#f-d5-vacuous-orientation-result-and-tolerance-permissiveness-d-7) | Vacuous `orientationInverted: true` & `D-7` small-face distortion | **`EXPERIMENTALLY_OBSERVED`** | Active in `l7IndependentVerifier.ts:46-51, 847, 934` |
| [`F-D6`](#f-d6-bow-tie-self-intersection-with-exact-signed-area-zero) | Bow-tie self-intersection with exact `2S = 0` | **`EXPERIMENTALLY_OBSERVED`** | Unguarded in `l7IndependentVerifier.ts` |
| [`F-D7`](#f-d7-exact-dyadic-binary64-decoding-and-4-level-bigrational-oracle) | Exact dyadic `binary64` $\to \mathbb{Q}$ decoding & 4-level `BigRational` oracle | **`DERIVED`** / **`DOCUMENTED`** | Not implemented in `src/core/` or `tests/` |
| [`F-E3`](#f-e3-anchored-local-coordinates-research-representations-a-d) | Anchored local frame `P = O + deltaP` (`Representations A–D`) | **`DOCUMENTED`** *(prop. / reserve)* | Not implemented (deferred research reserve) |

---

## `F-E1`: Orthogonal Projection Reflection, Householder Matrix, and `L7` Sufficiency Identity

### 1. Exact Mathematical Statement
1. For a line $L = \{x \in \mathbb{R}^2 : n \cdot x = c\}$ with $n = (n_x, n_y) \neq (0, 0)$, the orthogonal planar reflection of $p \in \mathbb{R}^2$ across $L$ is:
   $$p' = R_L(p) = p - 2 \frac{n \cdot p - c}{n \cdot n} n.$$
   Equivalently, using unit normal $\hat{n} = n / \|n\|_2$ and any base point $q_0 \in L$ ($n \cdot q_0 = c$), the linear part is the symmetric orthogonal Householder matrix:
   $$H = I - 2 \hat{n}\hat{n}^T \in O(2), \qquad H^2 = I, \qquad \det(H) = -1, \qquad R_L(p) = q_0 + H(p - q_0).$$
   *(In tangent unit vector $u$ with $u \perp n$, $H$ is equivalently $R = 2uu^T - I$.)*
2. Defining two $\|n\|_2$-normalized independent axial/displacement residuals on any candidate pair $(p, p')$:
   $$r_{\text{mid}}(p, p') = \frac{|n \cdot (p + p') - 2c|}{2 \|n\|_2}, \qquad r_{\text{perp}}(p, p') = \frac{|(p' - p) \times n|}{\|n\|_2},$$
   where $(a_x, a_y) \times (b_x, b_y) = a_x b_y - a_y b_x$, the Euclidean coordinate error relative to the exact reflected point $p'_{\text{exact}} = R_L(p)$ satisfies the **exact Pythagorean sufficiency identity**:
   $$\|p' - p'_{\text{exact}}\|_2 = \sqrt{4 r_{\text{mid}}^2 + r_{\text{perp}}^2}.$$

### 2. Definitions and Assumptions
- Ambient space: Euclidean plane $\mathbb{R}^2$ (`T = 0` zero-thickness model).
- Axis non-degeneracy: $\|n\|_2 > 0$ (`||n|| > zeroNormalEpsilon` in runtime).
- Zero-trust separation: `L7` evaluates $r_{\text{mid}}$ and $r_{\text{perp}}$ against **both** the trusted `OperationRequest` axis and `VerificationClaim` axis without recomputing `L2`'s projection point or a $3\times 3$ homogeneous matrix (explicitly removed from `L7` to prevent common-mode formulation failure).

### 3. Derivation or Proof Status
**`PROVEN`** (exact Euclidean vector identity).  
Proof sketch from repository derivation ([`PHASE_2_3_METAMORPHIC_TEST_PLAN.md`](../../../PHASE_2_3_METAMORPHIC_TEST_PLAN.md) `§2`): write $\delta = p' - p'_{\text{exact}}$. Because $n \cdot (p + p'_{\text{exact}}) = 2c$, we have $|n \cdot (p + p') - 2c| = |n \cdot \delta|$, giving the $\hat{n}$-component $|\delta \cdot \hat{n}| = 2 r_{\text{mid}}$. Because $(p'_{\text{exact}} - p) \parallel n$, we have $(p' - p) \times \hat{n} = \delta \times \hat{n}$, giving the $\hat{n}_\perp$-component $|\delta \cdot \hat{n}_\perp| = r_{\text{perp}}$. Orthogonality of $\hat{n}$ and $\hat{n}_\perp$ yields $\|\delta\|_2^2 = 4 r_{\text{mid}}^2 + r_{\text{perp}}^2$. Notice $r_{\text{mid}} \le \varepsilon \land r_{\text{perp}} \le \varepsilon \implies \|p' - p'_{\text{exact}}\|_2 \le \sqrt{5}\,\varepsilon$, and conversely any $\delta > \sqrt{5}\,\varepsilon$ violates at least one of the two axioms.

### 4. Reproducible Numerical Example
- Unit square $[0,1]^2$ subdivided along diagonal `V3(0,1) -- V1(1,0)`, reflected across `x + y = 1` (`nx = 1, ny = 1, c = 1`) with `movingVertexIds = ['V2']`: `V2(1,1)` maps exactly to `(0,0)` with `r_mid = 0`, `r_perp = 0`, `L7 status: 'PASS'` ([`docs/FIRST_PROTOTYPE_SPEC.md`](../../FIRST_PROTOTYPE_SPEC.md), lines `29-36`).
- Verified across oblique line `3x - 4y = 5` and scaled lines $10^6 \cdot (x + y = 1)$ in all 19 tests of [`tests/contract02.test.ts`](../../../tests/contract02.test.ts).

### 5. Counterexample or Limitation
- While exact over $\mathbb{R}$, IEEE-754 evaluation of `normSq = nx*nx + ny*ny`, `n · p`, and `(p' - p) × n` breaks under extreme exponents (see [`F-D3`](#f-d3-normal-vector-overflow-subnormal-underflow-and-projection-overflow)).
- Proves correctness of a single planar reflection on a fixed topology only; does **not** check polygon simplicity, layer Z-order, or multi-step global drift.

### 6. Exact Repository Source and Line References
- [`src/core/l2GeometryEngine.ts`](../../../src/core/l2GeometryEngine.ts): lines `5-8`, `310-330`.
- [`src/core/l7IndependentVerifier.ts`](../../../src/core/l7IndependentVerifier.ts): lines `19-25`, `756-811`.
- [`docs/FIRST_PROTOTYPE_SPEC.md`](../../FIRST_PROTOTYPE_SPEC.md): lines `34-36`, `52-55`.
- [`PHASE_2_3_METAMORPHIC_TEST_PLAN.md`](../../../PHASE_2_3_METAMORPHIC_TEST_PLAN.md): lines `53-63`.
- [`PHASE_2_3_3_PROPERTY_F_SPECIFICATION.md`](../../../PHASE_2_3_3_PROPERTY_F_SPECIFICATION.md): lines `16-21`.
- [`ACCEPTANCE_AUDIT_V1.md`](../../../ACCEPTANCE_AUDIT_V1.md): lines `19`, `26` (earlier PCRS `R = 2uu^T - I` history).
- [`tests/contract02.test.ts`](../../../tests/contract02.test.ts): lines `831-848` (static `L7` isolation, confirming absence of `Matrix3x3` / `applyHomogeneous3x3`).

### 7. Implementation Status
**Implemented** in `src/core/l2GeometryEngine.ts` and `src/core/l7IndependentVerifier.ts`; continuously tested by 19 contract tests.

---

## `F-E2`: Metamorphic Properties (`A–G`) and Six-Outcome Property `F` Classification

### 1. Exact Mathematical Statement
Seven invariant relations characterize planar reflection $R_L$ over a partitioned `GeometryState` $(P, L, M)$ with $L = (n, c)$ and $M \sqcup F_{\text{fixed}} = V(P)$:
- **Property A (Involution):** $R_L(R_L(P)) = P$.
- **Property B (Line Coefficient Scaling Invariance):** $R_{(\alpha n, \alpha c)}(P) = R_{(n, c)}(P)$ for all $\alpha \in \mathbb{R} \setminus \{0\}$.
- **Property C (Translation Equivariance):** $T_v(R_{(n,c)}(P)) = R_{(n, c + n \cdot v)}(T_v(P))$ for any $v \in \mathbb{R}^2$.
- **Property D (Pairwise Distance Invariance / Isometry):** $\forall p_i, p_j \in M$ (and $\forall p_i, p_j \in F_{\text{fixed}}$), $\|R_L(p_i) - R_L(p_j)\|_2 = \|p_i - p_j\|_2$. *(Mixed pairs $(p_i \in M, p_j \in F_{\text{fixed}})$ are NOT invariant unless $p_i \in L$.)*
- **Property E (Fixed-Point Locus):** $n \cdot p = c \implies R_L(p) = p$ even when $p \in M$.
- **Property F (Orientation Reversal & Six-Outcome Face Classifier):** For simple non-degenerate polygon $f \subseteq M$ ($|A_0(f)| > \varepsilon_{\text{degArea}}$), $\det(H) = -1 \implies A(R_L(f)) = -A(f)$. Partitioning all faces yields six mutually exclusive classifier outcomes:
  1. `HOLDS` ($f \subseteq M$, $|A_0| > \varepsilon_{\text{deg}}$, $|A_1 + A_0| \le \tau_{\text{area}} \land ||A_1|-|A_0|| \le \tau_{\text{area}}$)
  2. `VIOLATION` ($f \subseteq M$, $|A_0| > \varepsilon_{\text{deg}}$, sign/magnitude fails; includes proper rotations $\det(R_\theta) = +1$)
  3. `FIXED_UNCHANGED` ($f \subseteq F_{\text{fixed}}$, $\forall v \in f: \|p_1 - p_0\|_2 \le \tau_{\text{coord}} \land |A_1 - A_0| \le \tau_{\text{area}}$)
  4. `FIXED_CHANGED` ($f \subseteq F_{\text{fixed}}$, negation of `FIXED_UNCHANGED` — explicitly catches rigid translations of fixed faces where $|A_1 - A_0| = 0$)
  5. `MIXED_NOT_APPLICABLE` ($f \cap M \neq \varnothing \land f \cap F_{\text{fixed}} \neq \varnothing$, combinatorial partition check)
  6. `DEGENERATE_NOT_EVALUATED` ($|A_0| \le \varepsilon_{\text{deg}}$, including $|f| < 3$ and collinear faces)
- **Property G (Zero-Trust Negative Control):** Tampered coordinates, forged `claimedResiduals = 0`, improper rotations, and coordinated `claim + witness` substitutions against `OperationRequest` must return `L7 status: 'FAIL'`.

### 2. Definitions and Assumptions
- Zero-thickness $\mathbb{R}^2$, disjoint partition $M \sqcup F_{\text{fixed}} = V$, non-degenerate normal $\|n\| > \varepsilon_{\text{zero}}$, simple non-self-intersecting faces for Shoelace orientation interpretation.
- In `classifyPropertyF`, $\varepsilon_{\text{deg}} = 10^{-12}$ (`<=`), $\tau_{\text{area}} = 10^{-12}\max(1, |A_0|)$, whereas `L7` uses `DEFAULT_VERIFIER_TOLERANCES` (`1e-7`, causing a deliberate two-tier gap on $(10^{-12}\max(1,|A_0|), 10^{-7}]$).

### 3. Derivation or Proof Status
**`DERIVED`** from orthogonal group $O(2)$ algebra ($H^2 = I$, $\det(H) = -1$, homogeneity degree $0$ in $(n,c)$, affine covariance under translation). Note the six-outcome `classifyPropertyF` specification is **`DOCUMENTED`** cleanly from forensic source reconstruction (`PHASE_2_3_3_PROPERTY_F_SPECIFICATION.md`).

### 4. Reproducible Numerical Example
- Unit square reflected across `diag` ($x - y = 0$), `oblique` ($3x - 4y = 5$), `vertical` ($x = -1.5$), `horizontal` ($y = 2.25$) verifies Properties `A–F3` across 17 tests in [`tests/metamorphic.test.ts`](../../../tests/metamorphic.test.ts).
- $180^\circ$ rotation preserves all 6 pairwise square distances (Property `D`) and $|A|$ while keeping $\operatorname{sign}(A_1) = +\operatorname{sign}(A_0)$, isolated as `FAIL` solely via `orientationInverted: false` when `{ epsilon: 10, areaEpsilon: 1e-7 }` bypasses Stage C ([`PHASE_2_3_3_PROPERTY_F_SPECIFICATION.md`](../../../PHASE_2_3_3_PROPERTY_F_SPECIFICATION.md), line `63`).

### 5. Counterexample or Limitation
- Symmetric bug cancellation in `Property A`: if `L2` contains a symmetric error (e.g., wrong sign inversion), double application $R_L \circ R_L$ can still return `S_0`; thus `A` complements but never replaces `L7` ([`RESEARCH_INTEGRATION_V1.md`](../../../RESEARCH_INTEGRATION_V1.md), line `113`).
- Discrepancy between live `tests/metamorphic.test.ts:1411` (`< 1e-12`) and `l7IndependentVerifier.ts:896` (`<= 1e-12`) at boundary `|A| === 1e-12`.
- Rigid translation `(0.5, 0.25)` of a fixed face satisfies $|A_1 - A_0| = 0$, proving area-only checking fails to catch `FIXED_CHANGED` without conjunction with vertex immobility ([`PHASE_2_3_3_PROPERTY_F_SPECIFICATION.md`](../../../PHASE_2_3_3_PROPERTY_F_SPECIFICATION.md), lines `55-57`).

### 6. Exact Repository Source and Line References
- [`PHASE_2_3_METAMORPHIC_TEST_PLAN.md`](../../../PHASE_2_3_METAMORPHIC_TEST_PLAN.md): lines `14-64`, `142-151`.
- [`PHASE_2_3_3_PROPERTY_F_SPECIFICATION.md`](../../../PHASE_2_3_3_PROPERTY_F_SPECIFICATION.md): lines `8-64`, `69-76`.
- [`tests/metamorphic.test.ts`](../../../tests/metamorphic.test.ts): lines `1375-1721` (base `F1–F3`).
- [`OMR_PHASE_3_1_FINAL_AUDIT_AND_CLOSURE.md`](../../../OMR_PHASE_3_1_FINAL_AUDIT_AND_CLOSURE.md): lines `150`, `187-189` (`ROD-03` freeze gate).

### 7. Implementation Status
Properties `A–F3` are **implemented and passing** (`17/17` tests in `tests/metamorphic.test.ts`). The extended 6-outcome classifier (`tests/propertyF_v1.test.ts`, 15 mutations) is **`DOCUMENTED` / unimplemented**, blocked pending `ROD-03`.

---

## `F-D1`: Uncentered Shoelace Cancellation and Invalidity of `orient2d` Alone for General $n$-Gons

### 1. Exact Mathematical Statement
1. Evaluating signed polygon area in IEEE-754 `binary64` via the uncentered Shoelace sum around global origin $(0,0)$:
   $$2S_{\text{uncentered}} = \sum_{i=0}^{n-1} (x_i y_{i+1} - x_{i+1} y_i)$$
   loses up to $2\log_2(\|T\| / \operatorname{diam}(F))$ bits of significand precision under coordinate translation $T$ ($x_i = T_x + u_i, y_i = T_y + v_i$), producing catastrophic subtractive cancellation (`S = 0` or inverted large spurious values).
2. Shifting to a local face vertex anchor $p_0 = (x_0, y_0)$:
   $$2S_{\text{centered}} = \sum_{i=1}^{n-2} \big((x_i - x_0)(y_{i+1} - y_0) - (x_{i+1} - x_0)(y_i - y_0)\big)$$
   is algebraically identical to $2S_{\text{uncentered}}$ over exact $\mathbb{R}/\mathbb{Q}$ for every closed loop while reducing intermediate term magnitudes from $O(\|T\|^2)$ to $O(\operatorname{diam}(F)^2)$ — provided $p_i - p_0$ has not already vanished below $\operatorname{ULP}(T)$ on input.
3. Replacing `computeSignedArea` with a single 3-point predicate `orient2d(a, b, c)` is **mathematically invalid for general `Face2D` polygons with $n \ge 4$ vertices** (including non-convex faces and faces with collinear initial triples).

### 2. Definitions and Assumptions
- Input vertices stored as IEEE-754 `binary64` (`53`-bit significand, $\varepsilon_{\text{mach}} = 2^{-52} \approx 2.22 \times 10^{-16}$).
- `Face2D.vertexIds` (`src/core/types.ts:29-32`) permits arbitrary $n \ge 3$ vertex cycles, not only triangles.

### 3. Derivation or Proof Status
**`EXPERIMENTALLY_OBSERVED`** (failures across shifts $10^6\text{–}10^{10}$ and $25\text{–}50\,\text{m}$) and **`DERIVED`** (origin-shift invariance proof + mathematical proof that `orient2d(p_0, p_1, p_2)` cannot determine total signed area or orientation sign for general $n \ge 4$ non-convex polygons where fan triangles have opposing signs).

### 4. Reproducible Numerical Example
Tested in [`OMR_PHASE_2_4_EXPERIMENTAL_EVIDENCE.md`](../../../OMR_PHASE_2_4_EXPERIMENTAL_EVIDENCE.md) (`§1`, Series A1: triangle $A=(L,L), B=(L+1,L), C=(L, L+10^{-4})$, ideal area $+5 \times 10^{-5}$, reflected across $y=0$):
- $L = 0$: `shoelaceSrc = +5e-5`, `shoelaceDst = -5e-5` $\to$ `L7 PASS`.
- $L \in \{10^6, 10^8, 10^9\}$: `shoelaceSrc = 0`, `shoelaceDst = 0` $\to$ false **`L7 UNDETERMINED`** (`"collinear vertices"`), whereas exact dyadic area over the represented `binary64` inputs is $\approx +5 \times 10^{-5}$.
- $L = 10^{10}$: `shoelaceSrc = -8192`, `shoelaceDst = +8192` ($1.6384 \times 10^8\times$ error, inverted sign!) $\to$ **`areaError = 0`**, **`L7` returns false `PASS`** (`orientationInverted: true`).
- Realistic table scale ([`OMR_PHASE_2_5_REALISTIC_DOMAIN_EXPERIMENT.md`](../../../OMR_PHASE_2_5_REALISTIC_DOMAIN_EXPERIMENT.md), `§5.1(b)`): $200 \times 200\,\text{mm}$ sheet at $O = (25\,000, 25\,000)\,\text{mm}$ (`25 m`) gives `areaError = 1.192e-7 > 1e-7` $\to$ false **`FAIL`** even though `maxLengthError = 1.575e-11 mm`. At $O = (50\,000, 50\,000)\,\text{mm}$, `areaError = 7.153e-7`.

### 5. Counterexample or Limitation
- In `binary64`, centered subtraction $p_i - p_0$ alone still cancels if a triangle/polygon is nearly collinear ($\rho \to \varepsilon_{\text{mach}}$), or across $n \ge 4$ non-convex polygons with opposing triangle terms without compensated summation (`TwoProduct` + `Sum2`) or exact dyadic `BigInt` accumulation.
- Once feature size $\le \operatorname{ULP}(T)$ (input quantization loss prior to `L7`), centering cannot reconstruct lost input precision (e.g., at $L = 10^{10}$, exact dyadic area of the quantized `binary64` triangle is already $+4.9591064453125 \times 10^{-5}$ instead of $+5 \times 10^{-5}$).

### 6. Exact Repository Source and Line References
- [`src/core/l7IndependentVerifier.ts`](../../../src/core/l7IndependentVerifier.ts): lines `81-90` (`computeSignedArea`), invoked at lines `890-891`.
- [`tests/metamorphic.test.ts`](../../../tests/metamorphic.test.ts): lines `1383-1403` (duplicated uncentered Shoelace).
- [`OMR_PHASE_2_4_EXPERIMENTAL_EVIDENCE.md`](../../../OMR_PHASE_2_4_EXPERIMENTAL_EVIDENCE.md): lines `18-69`.
- [`OMR_PHASE_2_4_CRITICAL_AUDIT.md`](../../../OMR_PHASE_2_4_CRITICAL_AUDIT.md): lines `39-51`.
- [`OMR_PHASE_2_5_REALISTIC_DOMAIN_EXPERIMENT.md`](../../../OMR_PHASE_2_5_REALISTIC_DOMAIN_EXPERIMENT.md): lines `18`, `129-134`.
- [`OMR_PHASE_2_5_1_INDEPENDENT_AUDIT.md`](../../../OMR_PHASE_2_5_1_INDEPENDENT_AUDIT.md): lines `52`, `105`.

### 7. Implementation Status
Uncentered Shoelace **remains active** in frozen `src/core/l7IndependentVerifier.ts:81-90`. `Candidate B` (centered / exact dyadic Shoelace) is `ACCEPTED AS ARCHITECTURAL DIRECTION` (`OD-03`), **not implemented**. Safe unhardened domain: $[-10\,000, 10\,000]\,\text{mm}$.

---

## `F-D2`: Absolute Degeneracy Threshold and Scale Dependence

### 1. Exact Mathematical Statement
Using a fixed absolute area cutoff $|S| \le \varepsilon_{\text{degArea}}$ (`1e-12`) to detect collinear/degenerate faces breaks uniform scaling invariance ($p \mapsto k p \implies S \mapsto k^2 S$). Well-conditioned micro-scale polygons ($\rho \sim O(1)$) fail into `UNDETERMINED`, while machine-epsilon-thin needle polygons ($D \gg h$, aspect ratio $\sim 10^{16}$) pass as non-degenerate. A scale-invariant dimensionless shape ratio is e.g.:
$$\rho = \frac{2 |S|}{D^2}, \qquad D = \max_{i < j} \|p_i - p_j\|_2.$$

### 2. Definitions and Assumptions
- Live check in `L7`: `Math.abs(signed0) <= tol.degenerateAreaEpsilon` (`1e-12`).
- Note that selecting any dimensionless threshold $\eta_{\text{deg}}$ (e.g., $10^{-12}$ vs. $10^{-14}$) is a design/policy boundary (`UQ-01`), not a universal mathematical theorem, and for $n \ge 4$ self-intersecting polygons $\rho = 0$ even when vertices are non-collinear.

### 3. Derivation or Proof Status
**`EXPERIMENTALLY_OBSERVED`** (on 7 test triangles and meter-unit conversion); dimensional scaling argument ($[S] = L^2$, $[\rho] = L^0$) is **`DERIVED`**.

### 4. Reproducible Numerical Example
From [`OMR_PHASE_2_4_EXPERIMENTAL_EVIDENCE.md`](../../../OMR_PHASE_2_4_EXPERIMENTAL_EVIDENCE.md) (`§2`, lines `80-89`) and [`OMR_PHASE_2_5_REALISTIC_DOMAIN_EXPERIMENT.md`](../../../OMR_PHASE_2_5_REALISTIC_DOMAIN_EXPERIMENT.md) (line `134`):
- Small equilateral triangle ($a = 10^{-6}$, $\rho = 0.8660$, $|S| = 4.3301 \times 10^{-13} \le 10^{-12}$) $\to$ `L7` returns **`UNDETERMINED`** (`orientationInverted: false`).
- Micro right triangle $1 \times 1\,\mu\text{m}$ expressed in meters (`(0,0), (1e-6,0), (0,1e-6)`, $|S| = 5 \times 10^{-13}\,\text{m}^2$) $\to$ `L7` returns **`UNDETERMINED`** (`"collinear vertices"`).
- Extreme needle `(0,0), (1e6,0), (5e5, 1e-10)` ($|S| = 5 \times 10^{-5} > 10^{-12}$, apex angle $\approx 2 \times 10^{-16}\,\text{rad}$, $\rho = 10^{-16}$) $\to$ `L7` returns **`PASS`** (`orientationInverted: true`).

### 5. Counterexample or Limitation
- No single dimensionless $\rho$ threshold isolates collinearity cleanly from self-intersections where $2S = 0$ despite $D > 0$ (`F-D6`), or differentiates geometric rank-1 collinearity from deliberately sharp crease facets.

### 6. Exact Repository Source and Line References
- [`src/core/l7IndependentVerifier.ts`](../../../src/core/l7IndependentVerifier.ts): lines `50`, `896`.
- [`tests/metamorphic.test.ts`](../../../tests/metamorphic.test.ts): lines `1405`, `1411` (uses strict `<` instead of `<=`).
- [`OMR_PHASE_2_4_EXPERIMENTAL_EVIDENCE.md`](../../../OMR_PHASE_2_4_EXPERIMENTAL_EVIDENCE.md): lines `73-93`.
- [`OMR_PHASE_2_4_CRITICAL_AUDIT.md`](../../../OMR_PHASE_2_4_CRITICAL_AUDIT.md): lines `53-63`.
- [`OMR_PHASE_2_4_DEFECT_TAXONOMY.md`](../../../OMR_PHASE_2_4_DEFECT_TAXONOMY.md): lines `82-95`, `302`.

### 7. Implementation Status
Absolute threshold `degenerateAreaEpsilon = 1e-12` **remains active** in frozen `src/core/l7IndependentVerifier.ts:50, 896`.

---

## `F-D3`: Normal-Vector Overflow, Subnormal Underflow, and Projection Overflow

### 1. Exact Mathematical Statement
Evaluating `normSq = nx*nx + ny*ny` directly in `binary64` (`L2`) without power-of-two exponent scaling causes:
1. Overflow to `+Infinity` when $\max(|n_x|, |n_y|) \gtrsim 1.34 \times 10^{154}$ (`||n||` still finite up to $\sim 1.797 \times 10^{308}$), triggering `DEGENERATE_NORMAL` with a misleading diagnostic (`<= 1e-12`).
2. Subnormal precision collapse in `normSq` when $\|n\|_2 \lesssim 10^{-160}$ (down to `~14` mantissa bits) and underflow to `0` at $\sim 10^{-308}$.
3. Intermediate dot/scalar projection overflow (`nx * p.x` or `2 * signedOffset`) in `p' = p - factor * n` even for unit/moderate normals and representable mathematical images, silently emitting `(-Infinity, -Infinity)` into `GeometryState` and `TRACE` without throwing `L2EngineError`.
4. Analytically in `L7 Stage C`, evaluating `nx * (p.x + pPrime.x)` directly can overflow to `Infinity` on finite on-axis fixed points ($n \cdot p = c \implies p' = p$ finite in `L2`).

### 2. Definitions and Assumptions
- IEEE-754 `binary64` finite range (`Number.MAX_VALUE` $\approx 1.7977 \times 10^{308}$, `MIN_NORMAL` $\approx 2.225 \times 10^{-308}$).

### 3. Derivation or Proof Status
**`EXPERIMENTALLY_OBSERVED`** in `L2 → L7` execution for items 1–3; **`DERIVED`** analytically (`MATHEMATICAL DERIVATION`) from exponent bounds for item 4 (`L7 Stage C` finite fixed-point overflow not yet executed in test harness).

### 4. Reproducible Numerical Example
From [`OMR_PHASE_2_4_EXPERIMENTAL_EVIDENCE.md`](../../../OMR_PHASE_2_4_EXPERIMENTAL_EVIDENCE.md) (`§3`, lines `104-121`):
- `n = (1e160, 1e160), p = (1, 2), c = 0`: `norm = 1.4142e160` (finite), `normSq = Infinity` $\to$ `L2` throws `DEGENERATE_NORMAL` reporting `||n|| = 1.414213562373095e+160 <= 1e-12`. *(Refutes an earlier dossier hypothesis that `L2` fails silently without throwing on `1e160`.)*
- `n = (1e-160, 1e-160), p = (1, 2), c = 0` with `zeroNormalEpsilon = 0`: `normSq = 2e-320` (subnormal), `L2` returns `(-2.000033398823774, -1.0000333988237742)` (error `3.34e-5` vs. exact `(-2, -1)`); `L7` returns **`FAIL`** (`midpointError = 2.3617e-5`).
- `n = (1, 1), p = (1e308, 0), c = 0`: `2 * signedOffset = 2e308` overflows to `Infinity`, `L2` returns **`(-Infinity, -Infinity)`** without throw (`L7 UNDETERMINED`), even though exact image `(0, -1e308)` is representable in `binary64`.
- `n = (1e150, 1e150), p = (1e158, 0), c = 0`: `2 * dot` overflows $\to$ `(-Infinity, -Infinity)` despite finite exact image `(0, -1e158)`.
- Analytical `L7 Stage C` case (`NOT TESTED` in runtime): `n = (1e150, 1e150), p = (1.5e158, -1.5e158), c = 0` ([`OMR_PHASE_2_4_DEFECT_TAXONOMY.md`](../../../OMR_PHASE_2_4_DEFECT_TAXONOMY.md), lines `43`, `111`).

### 5. Counterexample or Limitation
- Scaling $n$ alone (`m = max(|nx|, |ny|)`) fixes `normSq` overflow/underflow, **but does not prevent** `nx * p.x` or `2 * signedOffset` overflow when $\|p\| \sim 10^{308}$ ([`OMR_PHASE_2_4_CRITICAL_AUDIT.md`](../../../OMR_PHASE_2_4_CRITICAL_AUDIT.md), lines `75-76`).

### 6. Exact Repository Source and Line References
- [`src/core/l2GeometryEngine.ts`](../../../src/core/l2GeometryEngine.ts): lines `75-87` (`validateLineParams`), `310-330` (projection & `claimedResiduals`).
- [`src/core/l7IndependentVerifier.ts`](../../../src/core/l7IndependentVerifier.ts): lines `396-406` (Stage A `hypot`), `773-782` (Stage C `evalAxiomResidualsForLine`).
- [`OMR_PHASE_2_4_EXPERIMENTAL_EVIDENCE.md`](../../../OMR_PHASE_2_4_EXPERIMENTAL_EVIDENCE.md): lines `97-121`.
- [`OMR_PHASE_2_4_CRITICAL_AUDIT.md`](../../../OMR_PHASE_2_4_CRITICAL_AUDIT.md): lines `65-76`.
- [`OMR_PHASE_2_4_DEFECT_TAXONOMY.md`](../../../OMR_PHASE_2_4_DEFECT_TAXONOMY.md): lines `43`, `98-115`.

### 7. Implementation Status
Unscaled `normSq` and raw scalar-first projection **remain active** in frozen `src/core/l2GeometryEngine.ts`.

---

## `F-D4`: Tolerance Coupling and Linearized Perimeter-Based Area Perturbation Bound

### 1. Exact Mathematical Statement
1. In `L7` (`resolveTolerances`), omitting `areaEpsilon` silently binds it to `epsilon`:
   $$\text{areaEpsilon}_{\text{eff}} = \text{overrides?.areaEpsilon} \;\text{??}\; (\text{overrides?.epsilon} \;\text{??}\; 10^{-7}),$$
   conflating linear tolerance $[L]$ with area tolerance $[L^2]$.
2. Variational analysis of Shoelace signed area for an $n$-gon with vertices $p_i$ perturbed by $\|\delta p_i\|_2 \le \varepsilon$ yields:
   $$2\,\delta S = \sum_{i=0}^{n-1} \det(p_{i+1} - p_{i-1},\, \delta p_i) + \sum_{i=0}^{n-1} \det(\delta p_i,\, \delta p_{i+1}),$$
   giving the linearized perimeter-coupled upper bound:
   $$|\delta S| \le \frac{1}{2} P \, |\delta p| + O(n \varepsilon^2), \qquad P = \sum_{i=0}^{n-1} \|p_{i+1} - p_i\|_2.$$

### 2. Definitions and Assumptions
- Simple closed polygon of perimeter $P$ and vertex count $n$.
- First-order approximation holds when perturbation $|\delta p| \ll \min_i \|e_i\|$ (if $|\delta p|$ is comparable to edge lengths, the quadratic $O(n\varepsilon^2)$ term is non-negligible).

### 3. Derivation or Proof Status
Unidirectional fallback coupling in `src/core/l7IndependentVerifier.ts:59` is **`EXPERIMENTALLY_OBSERVED`** (and refutes an earlier dossier assertion that constants were independent). The perimeter bound $|\delta S| \le \frac{1}{2}P|\delta p| + O(n\varepsilon^2)$ is **`DERIVED`** via multivariable differentiation of $2S$ (`||p_{i+1}-p_{i-1}|| <= ||e_i|| + ||e_{i-1}||`).

### 4. Reproducible Numerical Example
From [`OMR_PHASE_2_4_EXPERIMENTAL_EVIDENCE.md`](../../../OMR_PHASE_2_4_EXPERIMENTAL_EVIDENCE.md) (`§4.1`, lines `127-140`) on right triangle `A(0,0), B(1,0), C(0,1)` ($S_0 = +0.5$) across $y = 0$:
- Tampering `C'.y = -5` ($S_1 = -2.5$, `areaError = 2.0`, 400% distortion) with `{ epsilon: 10 }` (omitting `areaEpsilon`) yields **`L7 status: 'PASS'`** (`areaPreserved: true`) because `areaEpsilon` silently became `10`.
- Passing `{ epsilon: 10, areaEpsilon: 1e-7 }` restores **`FAIL`** (`areaPreserved: false`, isolating orientation/area checks).
- Tightening `{ epsilon: 1e-10 }` on small tamper `deltaArea = 1.000000005e-8` triggers `AREA_PRESERVATION_FAILED` (`> 1e-10`).

### 5. Counterexample or Limitation
- Coupling `areaEpsilon` solely to `P * epsilon` as a tolerance rule is a **worst-case** bound and does not replace deciding relative area policy (`UQ-03`) or uncoupling `resolveTolerances` (`l7IndependentVerifier.ts:59`).

### 6. Exact Repository Source and Line References
- [`src/core/l7IndependentVerifier.ts`](../../../src/core/l7IndependentVerifier.ts): lines `53-67` (`resolveTolerances`, specifically line `59`).
- [`OMR_PHASE_2_4_CRITICAL_AUDIT.md`](../../../OMR_PHASE_2_4_CRITICAL_AUDIT.md): lines `28`, `78-84`.
- [`OMR_PHASE_2_4_EXPERIMENTAL_EVIDENCE.md`](../../../OMR_PHASE_2_4_EXPERIMENTAL_EVIDENCE.md): lines `127-140`.
- [`OMR_PHASE_2_4_DEFECT_TAXONOMY.md`](../../../OMR_PHASE_2_4_DEFECT_TAXONOMY.md): lines `118-132`.

### 7. Implementation Status
Fallback `overrides?.areaEpsilon ?? epsilon` **remains active** in frozen `src/core/l7IndependentVerifier.ts:59`.

---

## `F-D5`: Vacuous Orientation Result and Tolerance Permissiveness (`D-7`)

### 1. Exact Mathematical Statement
1. **`D-5` (Vacuous Universal Quantification):** Initializing `let orientationInverted = true;` (`l7IndependentVerifier.ts:847`) while gating failure on `hasNonDegenerateMovingFace && !orientationInverted` (`line 934`) causes `L7` to return `status: 'PASS'` with `predicates.orientationInverted === true` whenever zero non-degenerate purely moving faces exist (`faces: []`, 100% mixed faces, or 100% fixed faces).
2. **`D-7` (Tolerance Permissiveness Band):** With `DEFAULT_VERIFIER_TOLERANCES = { epsilon: 1e-7, areaEpsilon: 1e-7 }` (`l7IndependentVerifier.ts:46-51`), perturbations $\le 10^{-7}$ pass `L7` despite exceeding oracle precision ($10^{-12}$) by $5\times 10^4\times$ and distorting admissible small faces (`|S0| > 1e-12`) by several thousand times relative area.

### 2. Definitions and Assumptions
- Contract 02 v2 (`src/core/types.ts:165`) defines `orientationInverted` strictly as `boolean` (no `NOT_APPLICABLE` enum value in `VerificationStatus` or `VerificationPredicates`).

### 3. Derivation or Proof Status
**`EXPERIMENTALLY_OBSERVED`** directly against live `src/core/l7IndependentVerifier.ts`.

### 4. Reproducible Numerical Example
From [`OMR_PHASE_2_4_EXPERIMENTAL_EVIDENCE.md`](../../../OMR_PHASE_2_4_EXPERIMENTAL_EVIDENCE.md) (`§4.2`, `§5.1`, lines `142-163`):
- `D-5`: (1) `faces: []`; (2) single mixed face `moving=['C'], fixed=['A','B']`; (3) fixed face `F0=[A,B,C]` with separate moving `D` $\to$ all three return **`L7 status: 'PASS'`**, **`orientationInverted: true`**, `diagnostics: []`.
- `D-7a`: Unit triangle + fixed `F(5,5)` with moving `C'.y` shifted by `5e-8` and `F.x` shifted by `9e-8` $\to$ **`PASS`**.
- `D-7b`: Small triangle `(0,0), (1,0), (0, 1e-11)` (`|S_0| = 5e-12 > 1e-12`) with reflected `C'.y` distorted from `-1e-11` to `-9e-8` (**$9000\times$ relative height and area distortion**, `areaError = 4.4995e-8`) $\to$ **`L7 PASS`** with all 9 predicates `true`.

### 5. Counterexample or Limitation
- Resolving `D-5` cleanly touches Contract 02 v2 types (`VerificationPredicates` / `NOT_APPLICABLE` four-valued logic), which cannot be changed silently without breaking backward compatibility (`UQ-04`, [`OMR_PROCESS_VERIFICATION_ARCHITECTURE.md`](../../../OMR_PROCESS_VERIFICATION_ARCHITECTURE.md), lines `89`, `111`).

### 6. Exact Repository Source and Line References
- [`src/core/l7IndependentVerifier.ts`](../../../src/core/l7IndependentVerifier.ts): lines `46-51`, `847`, `857`, `926-947`.
- [`src/core/types.ts`](../../../src/core/types.ts): lines `159-169`.
- [`OMR_PHASE_2_4_EXPERIMENTAL_EVIDENCE.md`](../../../OMR_PHASE_2_4_EXPERIMENTAL_EVIDENCE.md): lines `142-163`.
- [`OMR_PHASE_2_4_DEFECT_TAXONOMY.md`](../../../OMR_PHASE_2_4_DEFECT_TAXONOMY.md): lines `136-146`, `164-174`.

### 7. Implementation Status
Both `D-5` and `D-7` defaults **remain active** in frozen `src/core/l7IndependentVerifier.ts`.

---

## `F-D6`: Bow-Tie Self-Intersection With Exact Signed Area Zero

### 1. Exact Mathematical Statement
For a closed $n$-gon ($n \ge 4$), zero exact algebraic signed area $2S_{\text{exact}} = 0$ does **NOT** imply collinear vertices or zero-length edges. Self-intersecting polygons produce cancelling positive and negative lobes such that $2S = 0$ identically over $\mathbb{Z}/\mathbb{Q}$, while non-adjacent edges cross transversely and all vertex triples are non-collinear.

### 2. Definitions and Assumptions
- Polygon defined as cyclic vertex list $P = [v_0, v_1, \dots, v_{n-1}]$ with boundary edges $e_i = (v_i, v_{(i+1)\bmod n})$.
- Simplicity predicate `isSimplePolygon`: $\forall$ non-adjacent edge pairs $(e_i, e_j)$, $e_i \cap e_j = \varnothing$ (and adjacent edges meet only at shared endpoint).

### 3. Derivation or Proof Status
**`EXPERIMENTALLY_OBSERVED`** (`Phase 2.4 Experiment 2`) with exact `BigInt` integer calculation proving the epistemic flaw in both current `L7` and an exact-Shoelace-only `Candidate B`.

### 4. Reproducible Numerical Example
From [`OMR_PHASE_2_4_CANDIDATE_B_FALSIFICATION.md`](../../../OMR_PHASE_2_4_CANDIDATE_B_FALSIFICATION.md) (`§2`, lines `90-126`) on bow-tie quad `A=(0,0), B=(2,2), C=(0,2), D=(2,0)`:
- Exact signed area: $2S_{\text{exact}} = 0$ (`+4` and `-4` fan lobes cancel exactly to `0n`).
- Cyclic vertex triples: `2*Area(A,B,C) = +4`, `2*Area(B,C,D) = +4`, `2*Area(C,D,A) = -4`, `2*Area(D,A,B) = -4` (all non-collinear).
- Edge lengths: $[2\sqrt{2}, 2, 2\sqrt{2}, 2]$ (all strictly positive).
- Edge crossing: `AB` properly intersects `CD` at `(1, 1)` ($t = 0.5, u = 0.5$).
- Reflection across `nx=1, ny=2, c=3`: live `L7` returns `UNDETERMINED` with the **false causal diagnostic** `"UNDETERMINED: purely moving face has zero area (collinear vertices); orientation inversion cannot be established"`.

### 5. Counterexample or Limitation
- Directly falsifies any `L7` fix that swaps `computeSignedArea` for exact `BigInt` dyadic Shoelace (`Candidate B`) **without** separating: (1) $2S = 0$; (2) rank-1 vertex-triple collinearity; (3) edge self-intersection; (4) zero-length edges; and (5) invalid face topology (`isSimplePolygon`).

### 6. Exact Repository Source and Line References
- [`OMR_PHASE_2_4_CANDIDATE_B_FALSIFICATION.md`](../../../OMR_PHASE_2_4_CANDIDATE_B_FALSIFICATION.md): lines `14`, `90-126`, `168`.
- [`src/core/l7IndependentVerifier.ts`](../../../src/core/l7IndependentVerifier.ts): lines `896`, `939-944` (hardcoded `"collinear vertices"` message).
- [`OMR_PHASE_3_1_FINAL_AUDIT_AND_CLOSURE.md`](../../../OMR_PHASE_3_1_FINAL_AUDIT_AND_CLOSURE.md): lines `178-179`.

### 7. Implementation Status
Simplicity / collinearity separation is **not implemented** in `src/core/l7IndependentVerifier.ts`.

---

## `F-D7`: Exact Dyadic `binary64` Decoding and 4-Level `BigRational` Oracle

### 1. Exact Mathematical Statement
1. **Lossless Dyadic Decoding:** Every finite IEEE-754 `binary64` float $x$ represents an exact dyadic rational $x \in \mathbb{D} \subset \mathbb{Q}$:
   $$x = \begin{cases} (-1)^s \cdot (2^{52} + \text{frac}) \cdot 2^{\text{exp} - 1075}, & \text{if } 1 \le \text{exp} \le 2046 \text{ (normal)}, \\ (-1)^s \cdot \text{frac} \cdot 2^{-1074}, & \text{if } \text{exp} = 0, \text{frac} \neq 0 \text{ (subnormal)}, \\ 0, & \text{if } \text{exp} = 0, \text{frac} = 0. \end{cases}$$
2. **Rational Closure of Planar Reflections:** Given $(p_x, p_y) \in \mathbb{Q}^2$ and $(n_x, n_y, c) \in \mathbb{Q}^3$ with $n_x^2 + n_y^2 \neq 0$, the exact reflection
   $$t = \frac{n_x p_x + n_y p_y - c}{n_x^2 + n_y^2} \in \mathbb{Q}, \qquad p'_{\text{exact}} = (p_x - 2 t n_x,\; p_y - 2 t n_y) \in \mathbb{Q}^2$$
   uses only rational field operations ($+, -, \times, \div$, zero $\sqrt{\cdot}$) and therefore closes strictly inside $\mathbb{Q}$ over any finite chain length $K$. Note that $p'_{\text{exact}}$ generally leaves $\mathbb{D}$ (non-power-of-two denominators $n_x^2 + n_y^2$) even when inputs are dyadic.
3. **Squared Axial Axioms Without $\sqrt{\cdot}$:**
   $$r_{\text{mid}}^2 = \frac{(n_x (p_x + p'_x) + n_y (p_y + p'_y) - 2c)^2}{4 (n_x^2 + n_y^2)} \in \mathbb{Q}, \qquad r_{\text{perp}}^2 = \frac{((p'_x - p_x) n_y - (p'_y - p_y) n_x)^2}{n_x^2 + n_y^2} \in \mathbb{Q}.$$
4. **Oracle Precision Hierarchy (Levels A–D + Fixed-Point Distinction):**
   - **Level A (Ideal $\mathbb{R}^2$):** Exact real geometry (including irrationals such as $\sqrt{2}$, $\pi$).
   - **Level B (Intended $\mathbb{Q}^2$):** Exact `BigRational` over pre-quantization decimal/rational inputs (e.g., $1/3$, $1/10000$). Comparing `Level C` vs. `Level B` isolates input quantization error.
   - **Level C (Quantized $\mathbb{D} \subset \mathbb{Q}$):** Exact `BigRational` (reduced by `gcd`) initialized via bit-exact decoding of actual `binary64` coordinates/parameters. Comparing `Level D` vs. `Level C` isolates pure `L2`/`L7` algorithmic error.
   - **Level D (FP64 Outputs):** Actual IEEE-754 `number` outputs of `L2` and `L7`.
   - *(Crucial correction from Phase 2.5.1):* The 512-bit fixed-point engine used in Phase 2.5 (`mulH = (a*b) >> 512n`, `divH = (a << 512n) / b`) is **NOT** an exact `BigRational` Level C oracle because every multiplication truncates toward $-\infty$ and every division truncates toward $0$ (drift $\sim 2^{-507} \approx 2.39 \times 10^{-153}$ over 50 steps).

### 2. Definitions and Assumptions
- Exact rational closure applies only to rational affine reflection chains (and rational distance-squared / area-squared invariants). Operations introducing radicals (Huzita–Justin Axioms `O1–O7`, dihedral rotations by arbitrary angles, Fujimoto ratios $\sqrt{(n-m)/(n+m)}$) exit $\mathbb{Q}$.
- In JavaScript/ECMAScript, hardware directed rounding modes (`fesetround`) do not exist; any sound `Interval64` filter requires explicit bit-level `nextDown`/`nextUp` over `DataView` / `BigUint64Array` handling $\pm 0$, subnormals, and dependency bloat.

### 3. Derivation or Proof Status
**`DERIVED`** (IEEE-754 `binary64` specification + field closure of $\mathbb{Q}$); architecture and oracle design are **`DOCUMENTED`** in repository specifications. *(An earlier exploratory dossier claim proposing naive `(1 ± eps)` multiplicative intervals in JS was analytically refuted as unsound in [`OMR_PHASE_2_4_CRITICAL_AUDIT.md`](../../../OMR_PHASE_2_4_CRITICAL_AUDIT.md), lines `99-106`.)*

### 4. Reproducible Numerical Example
- `binary64` quantization gap (`Level B` vs. `Level C`): in `Phase 2.4 Exp 1`, storing `(1e8 + 1e-4, 1e8)` in `binary64` quantizes `1e-4` to `0.00010000169277191162` (`+1.693e-9` offset), changing exact rational triangle area from `5.0e-9` (`Level B`) to `5.0001692786239005e-9` (`Level C`).
- Used as read-only reference in `Phase 2.4` (`D-1` shift at $L = 10^{10}$, `Exp 1`, `Exp 2` `2S = 0n`).

### 5. Counterexample or Limitation
- Denominator bit-length grows exponentially across unconstrained rational compositions (`~O(2^k)`) if `GeometryState` were migrated naively to `BigRational` ([`RESEARCH_INTEGRATION_V1.md`](../../../RESEARCH_INTEGRATION_V1.md), line `80`).
- Because `Contract 02 v2` stores vertices in `binary64` (`src/core/types.ts:13-16`), `L2` quantizes back to `binary64` at every step, preventing pure chain-level exactness unless state formats change (`Phase 2.5+`).

### 6. Exact Repository Source and Line References
- [`OMR_PHASE_2_4_ORACLE_SPECIFICATION.md`](../../../OMR_PHASE_2_4_ORACLE_SPECIFICATION.md): lines `8-42`.
- [`OMR_PHASE_2_4_CRITICAL_AUDIT.md`](../../../OMR_PHASE_2_4_CRITICAL_AUDIT.md): lines `92-113`.
- [`OMR_PHASE_2_5_1_INDEPENDENT_AUDIT.md`](../../../OMR_PHASE_2_5_1_INDEPENDENT_AUDIT.md): lines `15-31`, `116`, `141`.
- [`RESEARCH_INTEGRATION_V1.md`](../../../RESEARCH_INTEGRATION_V1.md): lines `80-89`.
- [`public/assets/aistudio/Paste_November_17__2026_-_7_25PM_ab54face`](../../../public/assets/aistudio/Paste_November_17__2026_-_7_25PM_ab54face): lines `61-74`, `84-86`.

### 7. Implementation Status
**Not implemented** in `src/core/*` or persistent `tests/` files (invoked only in read-only inline experimental probes).

---

## `F-E3`: Anchored Local Coordinates (`P = O + deltaP`) — Architectural Proposal

### 1. Exact Mathematical Statement
Partitioning vertex coordinates as $p = O + \delta p$ (scene/sheet anchor $O$ plus local sheet offset $\delta p$) decouples translation scale $\|O\|$ from internal shape extent $\|\delta p\|$:
- **Rep A (Global `binary64`):** Current `GeometryState` ($p \in \mathbb{F}_{64}^2$); each step incurs $O(\operatorname{ULP}(O))$ rounding.
- **Rep B (Local `f64` + `f64` anchor):** $O \in \mathbb{F}_{64}^2$, $\delta p \in \mathbb{F}_{64}^2$, global line converted via `c_loc = c - (nx*Ox + ny*Oy)` in `binary64`.
- **Rep C (Local `f64` + Exact / Double-Double anchor):** $O \in \mathbb{Q}^2$ (or DD), $\delta p \in \mathbb{F}_{64}^2$, `c_loc = f64(exact(c - n · O))`.
- **Rep D (Exact Provenance + Local Frame):** Algebraic/rational construction history alongside anchored `binary64` evaluation.

### 2. Definitions and Assumptions
- Translation-invariant geometric invariants (pairwise distances, centered Shoelace area, differences $p_i - p_j$) depend strictly on $\delta p$ and are invariant to $O$ prior to global coordinate export.

### 3. Derivation or Proof Status
**`DOCUMENTED`** (`ENGINEERING PROPOSAL` / architectural reserve). Note that [`OMR_PHASE_2_5_1_INDEPENDENT_AUDIT.md`](../../../OMR_PHASE_2_5_1_INDEPENDENT_AUDIT.md) (`§2`) demonstrated that the initial `Phase 2.5` comparison mixed global quantization and unquantized `D` inputs, requiring equal-start verification before drawing numerical conclusions.

### 4. Reproducible Numerical Example
From [`OMR_PHASE_2_4_CANDIDATE_B_FALSIFICATION.md`](../../../OMR_PHASE_2_4_CANDIDATE_B_FALSIFICATION.md) (`§3.1`, `100` steps near `O = (1e8, 1e8)`, `1e-4` triangle):
- **Offset-axis 100-step local vertex drift:** `1.612e-7` (Rep A) vs. `5.006e-8 max` (Rep B, leaks global `c - n·O` `f64` quantization) vs. **`1.748e-18 max`** (Rep C).
- **Sub-ULP translation `(1e8 + 1e-10)`:** Lost completely in Rep A and Rep B (`1e8 + 1e-10 === 1e8`); preserved in Rep C (`9.999999999999924e-11`).
- **Equal-start re-check at realistic table `O = (10 000, 10 000) mm`, 50 steps** ([`OMR_PHASE_2_5_1_INDEPENDENT_AUDIT.md`](../../../OMR_PHASE_2_5_1_INDEPENDENT_AUDIT.md), lines `48-54`, `108`): local drift `2.12e-13 mm` (Rep D exact anchor) vs. `9.80e-12 mm` (Centered FP64 `Approach B`) vs. `1.68e-11 mm` (Current `Approach A`).

### 5. Counterexample or Limitation
- In realistic origami/packaging domains (`200 × 200 mm`, tables `<= 10 m`), even `Approach B` (`9.80e-12 mm`) is `~9` orders of magnitude finer than physical plotter tolerances (`±0.05 mm`) and `4` orders below `1e-7`, making breaking changes to `Contract 02` `GeometryState` for `Anchored Local Frame` **unjustified** in single-sheet 2D Phase 2.4–2.5 ([`OMR_PHASE_2_5_1_INDEPENDENT_AUDIT.md`](../../../OMR_PHASE_2_5_1_INDEPENDENT_AUDIT.md), lines `108`, `121`, `134`).
- Exporting Rep B/C back into global `binary64` (`O + deltaP`) re-quantizes coordinates back to `ULP(O)`.

### 6. Exact Repository Source and Line References
- [`OMR_PHASE_2_4_CANDIDATE_B_FALSIFICATION.md`](../../../OMR_PHASE_2_4_CANDIDATE_B_FALSIFICATION.md): lines `15`, `130-160`, `173-174`.
- [`OMR_PHASE_2_5_REALISTIC_DOMAIN_EXPERIMENT.md`](../../../OMR_PHASE_2_5_REALISTIC_DOMAIN_EXPERIMENT.md): lines `14-20`, `92-125`, `166-180`.
- [`OMR_PHASE_2_5_1_INDEPENDENT_AUDIT.md`](../../../OMR_PHASE_2_5_1_INDEPENDENT_AUDIT.md): lines `35-54`, `108`, `120-121`, `134`.

### 7. Implementation Status
**Not implemented.** Retained strictly as a documented **architectural reserve** for future multi-sheet or kilometer-scale assembly scenes.
