# Local and Global Consistency (`LOCAL_GLOBAL_CONSISTENCY.md`)

> **Document Status:** `RESEARCH ONLY — NON-CANONICAL`  
> **Scope:** Consolidation of verified/reproduced OMR results on step-local vs. process-global verification (`F-B1`), non-commutativity of sequential planar reflections (`F-B2`), current `verifyProcess` boundaries, missing end-to-end $S_0 \to S_K$ anchor comparisons, static validity vs. continuous kinematic reachability, and the explicit boundary separating existing 2D results from **unformalized/absent** 3D spatial holonomy (`F-B4`).

---

## 1. Epistemic Boundary Declaration (What Exists vs. What Does Not)

To prevent architectural overclaiming:
1. **Verified / Experimentally Observed in Repository:**
   - **Sequential numerical process drift (`F-B1`):** Proof-by-counterexample that adjacent-step `verifyProcess` (`S_{i-1} -> S_i`) returning `PASS` does **not** guarantee $S_0 \to S_K$ invariant preservation within the same tolerance $\varepsilon$.
   - **Two-reflection $O(2)$ non-commutativity (`F-B2`):** Algebraic identity that $R_{L_2} \circ R_{L_1} \neq R_{L_1} \circ R_{L_2}$ on non-orthogonal intersecting lines, composing to a planar rotation by $2\angle(L_1, L_2)$ preserving area sign ($\det = +1$).
   - **2D hinged accordion kinematics (`Class B2`):** Experimentally tested planar `180°` reflection chain transmitting hinge vertex drift across $K \in \{10, 20, 50\}$ folds.
2. **External Codebase Audit Reference Only (`ORI_STUDIO_INITIAL_AUDIT.md`, NOT in OMR):**
   - Vertex quaternion closure $q_n \cdots q_1 = [+1, 0, 0, 0]$ (`oristudio-cp::checks_spatial`) and 3D dual spanning-tree loop gap / collision checks (`oristudio-cp::folding3d`) exist only in the audited external GPL/MIT Rust workspace `ori-studio`, **not** in OMR `src/core/`.
3. **Absent / Unformalized in Repository (`F-B4`):**
   - **No general $\mathrm{SE}(3)$ / $O(3)$ discrete holonomy model exists in OMR.** General cycle consistency equations $T_n \circ \dots \circ T_1 = I$ over multi-face dual cycles, homology/cohomological cocycle obstructions, and topological conditions linking local flatness to global integrability do **not** exist in repository files (see [`OPEN_PROBLEMS.md`](./OPEN_PROBLEMS.md)).

---

## 2. `F-B1`: Step-Local Verification vs. Process-Global Correctness

### 2.1 Exact Mathematical Statement
For any state sequence $S_0 \xrightarrow{op_1} S_1 \xrightarrow{op_2} \dots \xrightarrow{op_K} S_K$ verified under tolerance $\varepsilon > 0$:
$$\big(\forall i \in \{1,\dots,K\}:\; \text{Verify}_{\text{local}}(S_{i-1} \to S_i) = \text{PASS}\big) \;\;\not\Longrightarrow\;\; d_{\text{inv}}(S_0, S_K) \le \varepsilon.$$
Specifically, if each transition $i$ admits residual error $|\Delta_i| \le \varepsilon$, triangle-inequality accumulation permits global deviation up to $\sum_{i=1}^K |\Delta_i| \le K \varepsilon$ (and $O(K \cdot \operatorname{ULP})$ under correlated rounding).

**Formula (`STEP-LOCAL PASS != PROCESS-GLOBAL PASS`):**  
([`OMR_PROCESS_VERIFICATION_ARCHITECTURE.md`](../../../OMR_PROCESS_VERIFICATION_ARCHITECTURE.md), lines `37-47`).

### 2.2 Exact Source Limitations in Current `verifyProcess`
Inspection of [`src/core/l7IndependentVerifier.ts`](../../../src/core/l7IndependentVerifier.ts) (`lines 980-1285`) confirms **what `verifyProcess` actually verifies — and what it misses**:

- **What `verifyProcess` DOES enforce (implemented in frozen `v0.1.0-alpha`):**
  1. Non-empty trace, `trustedRequests.length === trace.length`, structural equality of `entry.request` and `trustedRequests[i]` (`lines 987-1109`).
  2. Uniqueness of `operationRequestId` across all steps (`lines 1111-1120`).
  3. Non-negative finite integer strict monotonicity of `stepIndex` (`lines 1061-1072, 1166-1178`) and state `version` monotonicity (`lines 1152-1162`).
  4. Adjacent state-to-state structural identity `statesStructurallyIdentical(prev.resultingState, entry.sourceState)` (`line 1179`) and request/witness chaining (`lines 1186-1207`).
  5. Per-step `verifyResult` execution **exclusively on `S_{i-1} -> S_i`** (`lines 1210-1220`).
- **What `verifyProcess` DOES NOT check (architectural gap):**
  1. **Zero reference to `trace[0].sourceState` at end of loop:** `trace[K-1].resultingState` is never compared against `trace[0].sourceState` for rigid edge-length preservation, non-moving global anchors $\bigcap_i F_i$, area parity $(-1)^{m_f} \operatorname{sign}(S_0(f))$, or expected round-trip closure ($S_K \approx S_0$ on cyclic involutions).
  2. **Step-local `Math.max` aggregation (`lines 1225-1235`):** `maxLengthError = Math.max(maxLengthError, stepVerdict.residuals.maxLengthError)` measures only the largest single-step jump, completely blind to secular drift across $K$ steps.
  3. **Boolean `&&` predicate aggregation (`lines 1237-1246`):** Cannot prevent vacuous `PASS` (`D-5`) or detect when cumulative error exhausts the `binary64` uncertainty budget.

### 2.3 Reproduced Counterexamples (`EXPERIMENTALLY_OBSERVED`)
1. **Counterexample 1 (`Phase 2.5.1` Direct `verifyProcess` Probe, `200 × 200 mm`, $K = 50$ steps):**  
   With `toleranceOverrides = { epsilon: 2e-13, areaEpsilon: 2e-10 }`, live `verifyProcess` returned **`PASS`** (`maxStepLengthError = 1.705e-13 <= 2e-13`), whereas end-to-end length error between $S_0$ and $S_{50}$ reached **`2.842e-13 > 2e-13`** ([`OMR_PHASE_2_5_1_INDEPENDENT_AUDIT.md`](../../../OMR_PHASE_2_5_1_INDEPENDENT_AUDIT.md), lines `94-99`).
2. **Counterexample 2 (`Phase 2.4 Exp 1`, `(1e8, 1e8)`, `1e-4` triangle, $K = 100$ steps):**  
   Under Candidate B's exact dyadic Shoelace per step (`verifyResult` on `S_{k-1} -> S_k`, `epsilon = 1e-7`), **`100 / 100` individual steps pass** (`maxPerStepErr = 4.215e-8 < 1e-7`, `maxStepLengthErr = 6.235e-8 < 1e-7`). Yet cumulative drift relative to the exact 100-step `Level C` trajectory reaches **`2.328e-7`** (`2.33x epsilon`) in vertices and **`2.831e-7`** (`2.83x epsilon`, **`0.283%` shape distortion**) in edge lengths, crossing `1e-7` by step `75` (`L_0`-first parity) or step `25` (`L_1`-first parity). A full `1 × 1` unit triangle at `(1e8, 1e8)` similarly drifts `1.897e-7` vertices / `1.375e-7` edges over 100 steps ([`OMR_PHASE_2_4_CANDIDATE_B_FALSIFICATION.md`](../../../OMR_PHASE_2_4_CANDIDATE_B_FALSIFICATION.md), lines `13`, `57-86`).

---

## 3. `F-B2`: Non-Commutativity of Sequential Planar Reflections (Composition Order)

### 3.1 Exact Mathematical Statement (`DERIVED`)
Let $L_1, L_2 \subset \mathbb{R}^2$ be two intersecting lines with unit normals $\hat{n}_1, \hat{n}_2$ meeting at signed angle $\phi = \angle(L_1, L_2)$ around intersection point $q \in L_1 \cap L_2$.
- **Order-preserving composition:** Applying $R_{L_1}$ first and $R_{L_2}$ second yields the proper Euclidean rotation around $q$ by angle $2\phi$:
  $$(R_{L_2} \circ R_{L_1})(p) = q + H_2 H_1 (p - q), \qquad H_2 H_1 = (I - 2\hat{n}_2\hat{n}_2^T)(I - 2\hat{n}_1\hat{n}_1^T) \in SO(2), \qquad \det(H_2 H_1) = (-1)(-1) = +1.$$
- **Non-commutativity:** Whenever $L_1 \neq L_2$ and $L_1 \not\perp L_2$ ($\phi \notin \{0, \pi/2\} \pmod{\pi}$), swapping operation order inverts rotation sense ($2\phi \mapsto -2\phi$):
  $$R_{L_2} \circ R_{L_1} \neq R_{L_1} \circ R_{L_2}.$$
- **Orientation parity:** A single reflection reverses signed area ($\det(H) = -1$), whereas an even sequence of $2k$ reflections on the same face $f$ restores original signed orientation ($\det = +1$).

### 3.2 Physical & Numerical Path-Dependence Observed in OMR
- **Numerical order sensitivity (`EXPERIMENTALLY_OBSERVED`):** In `Phase 2.4 Exp 1` (`L_0: x+2y=3e8`, `L_1: 2x+3y=5e8`), executing $L_0$-first crosses `1e-7` drift at step `75` (ending `2.328e-7`), whereas reversed order $L_1$-first crosses `1e-7` at step `25` (ending `1.229e-7`) ([`OMR_PHASE_2_4_CANDIDATE_B_FALSIFICATION.md`](../../../OMR_PHASE_2_4_CANDIDATE_B_FALSIFICATION.md), lines `77-80`).
- **Metamorphic relation & parity (`DERIVED`):** Explicitly recorded in [`RESEARCH_INTEGRATION_V1.md`](../../../RESEARCH_INTEGRATION_V1.md) (`§3.3.4`, line `109`: $R_{L_2} \circ R_{L_1}$ = rotation preserving area sign) and [`OMR_PROCESS_VERIFICATION_ARCHITECTURE.md`](../../../OMR_PROCESS_VERIFICATION_ARCHITECTURE.md) (line `88`: $\operatorname{sign}(S_K(f)) = (-1)^{m_f}\operatorname{sign}(S_0(f))$ where $m_f$ counts pure-moving reflections of face $f$).
- **Physical non-commutativity (`DOCUMENTED`):** `PWRP-08` (*Path Dependence & Irreversibility*, [`PWRP_RESEARCH_REPORT.md`](../../../PWRP_RESEARCH_REPORT.md), lines `35`, `39`, `77`) extends order sensitivity from geometric $O(2)$ non-commutativity to irreversible crease-memory and layer trapping ($A \circ B \neq B \circ A$).

---

## 4. Proposed Six-Category Process-Global Verification Architecture (`DOCUMENTED — NOT IMPLEMENTED`)

To bridge the `verifyProcess` gap without breaking `Contract 02 v2` signatures, [`OMR_PROCESS_VERIFICATION_ARCHITECTURE.md`](../../../OMR_PROCESS_VERIFICATION_ARCHITECTURE.md) (`§2–§4`, lines `51-114`) specifies an additive 6-category global verifier (`VERIFIED | VIOLATED | INDETERMINATE | NOT_APPLICABLE`):

| # | Category | Scope & Global Check (Beyond Step-Local `verifyProcess`) |
| :- | :--- | :--- |
| **1** | `Local Transition Validity` | Per-step axioms, binding, `TRACE` chain continuity (`existing L7`). |
| **2** | `Cumulative Numerical Drift` | Trajectory deviation across $S_0 \dots S_K$ and drift rate relative to $K \cdot \operatorname{ULP}$. |
| **3** | `End-to-End Rigid Invariants` | $S_0 \to S_K$ preservation of rigid edge/diagonal lengths $\|e\|_K \leftrightarrow \|e\|_0$, face area magnitudes, and global anchors $\bigcap_i \text{fixed}_i$ — **without** falsely requiring $S_K \approx S_0$ except on closed/involution loops. |
| **4** | `Global Geometric Invariants` | Topological simplicity (`isSimplePolygon` on $S_0, S_K$), dimensionless $\rho = 2|S|/D^2$, orientation parity $(-1)^{m_f}$ (`Phase 2.5+: z-order`). |
| **5** | `Verification Coverage` | Explicit accounting of checked vs. skipped (`MIXED` / `DEGENERATE` / empty) faces as `NOT_APPLICABLE` instead of vacuous `true`. |
| **6** | `Uncertainty Propagation` | Finite-precision budget $\mathcal{B}(K, \operatorname{ULP}(\max |P_k|), \text{cond})$ returning `INDETERMINATE` when `binary64` resolution is exhausted. |

---

## 5. Static Validity vs. Continuous Kinematic Reachability & External 3D Audit Boundary

### 5.1 What Current 2D Models Establish vs. Omit
1. **Static configuration validity (`L2`/`L7`):** A sequence of 2D planar reflections establishes at most that vertex coordinates satisfy discrete axial projection and panel-level length/area preservation on $180^\circ$ flat reflections.
2. **Audit lessons from Phase 2.5 scenarios `B1` and `B2`** ([`OMR_PHASE_2_5_1_INDEPENDENT_AUDIT.md`](../../../OMR_PHASE_2_5_1_INDEPENDENT_AUDIT.md), lines `58-73`, `122-123`):
   - **`B1` (`200 × 200 Box Net`) is `INVALID EXPERIMENT`:** Vertices exceeded paper boundary (`201 mm`), locking tabs had T-junction graph disconnection (`N_TAB`/`E_TAB`), only 3 edges were declared, and 4 walls overlapped coplanarly at $180^\circ$ (whereas a real box requires $90^\circ$ dihedral folds and corner gussets).
   - **`B2` (`200 × 40 Accordion`, $K = 10, 20, 50$) is `PARTIALLY CONFIRMED`:** Valid **strictly as a planar 2D kinematic hinge chain** inheriting hinge-axis rounding errors $(B_k, T_k)$. After $K$ steps, all $K + 1$ panels occupy the exact same coplanar $3.92 \times 40\,\text{mm}$ footprint without Z-order (`L3`), thickness (`PWRP`), or continuous non-self-intersection (`L4`).
3. **Continuous reachability (`L4`):** Proving a folded configuration exists statically does **not** prove a continuous rigid collision-free path $\gamma(t) : [0,1] \to \mathcal{C}_{\text{free}}$ exists from the flat state ([`docs/RESEARCH_BASE.md`](../../RESEARCH_BASE.md), line `17`; [`docs/RESEARCH_L2_L7_SOURCES.md`](../../RESEARCH_L2_L7_SOURCES.md), line `70`, citing Akitaya et al. 2016 NP-hardness).

### 5.2 External Audit Context vs. OMR Reality (Do Not Conflate)
[`ORI_STUDIO_INITIAL_AUDIT.md`](../../../ORI_STUDIO_INITIAL_AUDIT.md) (`lines 120-122, 138-155`) documents how the external Rust workspace **Ori Studio (`0.9.0`)** checks:
- Local 3D vertex rotational closure via ordered quaternion product `q_n * ... * q_1 = [1, 0, 0, 0]` (`+1` specifically, rather than `|w|`, to distinguish Maekawa parity $\rho = \pm 180^\circ$);
- Dual spanning-tree placement + cycle `LoopGap` + 3D link self-intersection verdicts (`oristudio-cp::folding3d`);
- Seven-stage flat-folded Z-order gate checks including Taco-Taco / Taco-Tortilla / Tortilla-Tortilla constraints (`oristudio-fold` / `oristudio-layer-order`).

**Strict Boundary:** None of these external Rust mechanisms exist inside OMR `src/core/*`, and even Ori Studio's spatial placement (`checks_spatial` / `folding3d`) verifies static dihedral consistency and collisions rather than a general continuous $\gamma(t)$ rigid-motion solver.

---

## 6. Unrecovered / Absent Mathematical Formalisms (`F-B4` Scope Boundary)

The repository currently contains **NO** general mathematical formalization of:
1. Arbitrary ordered cycle consistency $T_n \circ \dots \circ T_1 = I$ across $\mathrm{SE}(3)$ / $O(3)$ transformations (where composition order is non-commutative and essential);
2. Cycle-basis vs. topological connectivity conditions (note: checking closure over a homology/fundamental cycle basis suffices for flat/polyhedral holonomy without requiring simple connectivity, whereas local flatness alone does not guarantee global integrability without explicit topological domain assumptions);
3. Algebraic cocycle or homological cellular-complex closure conditions (`∂_2`, strong regularity, Euler shell prerequisites).

These topics remain tracked as open mathematical research targets in [`OPEN_PROBLEMS.md`](./OPEN_PROBLEMS.md).
