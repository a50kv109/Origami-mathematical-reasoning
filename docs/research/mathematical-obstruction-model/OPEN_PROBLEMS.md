# Open Mathematical Problems and Recovery Agenda (`OPEN_PROBLEMS.md`)

> **Document Status:** `RESEARCH ONLY — NON-CANONICAL` (`OPEN`)  
> **Rule:** Items below mark **missing sources, unformalized mathematical models, or blocked engineering decisions** confirmed by the repository recovery audit. No equations, experimental parameters, or proofs are reconstructed from memory when absent from repository files.

---

## 1. Priority P0 — Unrecovered Primary Sources

### `OP-1`: Recovery of Primary `PAT-30` Setup, Equations, and Proof (`F-C1`)
- **Status:** **`UNVERIFIED`** (**Primary payload absent from repository**)
- **What exists in repo:** Only three bibliographic references to an experiment labeled **`PAT-30 (2D Panels → Fold → 3D Closure)`** and protocol **`REASON OUTSIDE. VERIFY INSIDE`**, attributed to external notebook chat `#28 Самоаудит контекста и архитектурных решений`:
  - [`docs/SOURCE_REGISTRY.md`](../../SOURCE_REGISTRY.md), line `53`
  - [`docs/RESEARCH_BASE.md`](../../RESEARCH_BASE.md), line `47`
  - [`src/data/passportData.ts`](../../../src/data/passportData.ts), lines `689-698`
- **What is missing from repo:**
  - Exact panel dimensions and vertex coordinates (the external `3–4–5` triangular panel setup discussed outside the repo is not stored in any repository file);
  - Hinge connectivity graphs and dihedral axis definitions;
  - Initial vs. target 3D state definitions and admissibility assumptions (`T = 0`, rigid facets, tolerances);
  - Closure constraint equations and the formal impossibility/obstruction proof.
- **Blocking rule:** `PAT-30` **MUST remain classified `UNVERIFIED`** until primary notebook records or verified derivations are imported into the repository.

---

## 2. Priority P1 — Process-Global Verification & Numerical Hardening Closure

### `OP-2`: Process-Global `S₀ → Sₖ` Verification (`verifyProcessGlobal`)
- **Status:** **`DOCUMENTED` architecture / Unimplemented in `src/core/`** (see [`LOCAL_GLOBAL_CONSISTENCY.md`](./LOCAL_GLOBAL_CONSISTENCY.md) `§2`, `§4`)
- **Open mathematical tasks:**
  1. Formulate end-to-end invariant checks comparing `S_K` against `S_0` (rigid panel lengths/diagonals, area parity $(-1)^{m_f}$, global anchors $\bigcap_i F_i$) without falsely requiring `S_K == S_0` on non-cyclic fold trajectories.
  2. Define explicit uncertainty-budget bounds $\mathcal{B}(K, \operatorname{ULP}(\max |P_k|), \text{cond})$ distinguishing `VERIFIED`, `VIOLATED`, and `INDETERMINATE` when `binary64` precision is exhausted.
  3. Integrate four-valued `Verification Coverage` (`NOT_APPLICABLE`) to eliminate vacuous `orientationInverted: true` (`D-5` / `UQ-04`).

### `OP-3`: Integration of Hardened Arithmetic & Exact Reference Oracle (`OD-03`, `ROD-03`, `UQ-01..05`)
- **Status:** **`EXPERIMENTALLY_OBSERVED` defects / Pending Owner Decisions** ([`OMR_PHASE_2_4_DEFECT_TAXONOMY.md`](../../../OMR_PHASE_2_4_DEFECT_TAXONOMY.md), `§10`; [`OMR_PHASE_3_1_FINAL_AUDIT_AND_CLOSURE.md`](../../../OMR_PHASE_3_1_FINAL_AUDIT_AND_CLOSURE.md), `§8`)
- **Open mathematical & policy tasks:**
  1. **`UQ-01` (`D-2`):** Select dimensionless degeneracy metric ($\rho = 2|S|/D^2$ vs. $2|S|/P^2$ vs. altitude/diameter) and threshold policy $\eta_{\text{deg}}$, and harmonize `<` (`tests/metamorphic.test.ts:1411`) vs. `<=` (`l7IndependentVerifier.ts:896`).
  2. **`UQ-02` (`D-3`):** Implement power-of-two exponent scaling for `validateLineParams` and Householder projection in `L2` (and `L7 Stage C` finite-axis check), plus boundary error policy when true image exceeds `Number.MAX_VALUE`.
  3. **`UQ-03` (`D-4` / `D-7`):** Uncouple `areaEpsilon` from `epsilon` (`l7IndependentVerifier.ts:59`) and decide relative / perimeter-coupled area acceptance policy beyond absolute `1e-7`.
  4. **`UQ-04` (`D-5`):** Resolve vacuous `orientationInverted: true` cleanly against `Contract 02 v2` (`src/core/types.ts:165`).
  5. **`UQ-05` (`D-1`):** Adopt centered + compensated (`TwoProduct`/`Sum2`) or exact dyadic `BigInt` Shoelace in `L7`, while keeping `L7` algorithmically independent of `L2` (`Common-Mode Failure` prevention) and preserving `Level D BigRational` oracle (`exactNumericalOracle.ts`) strictly inside `tests/`.
  6. **`ROD-03`:** Unfreeze `tests/propertyF_v1.test.ts` (6-level `classifyPropertyF`, 15 mutations) upon owner authorization.
  7. **Benchmark hygiene (`Phase 2.5.1`):** Clean up `A / B / D` equal-start test harness, withdraw `B1`, and tag `B2` strictly as 2D hinge kinematics ([`OMR_PHASE_2_5_1_INDEPENDENT_AUDIT.md`](../../../OMR_PHASE_2_5_1_INDEPENDENT_AUDIT.md), lines `140-143`).

---

## 3. Priority P2 — Geometric Embedding, Topological Simplicity & `L1` Foundations

### `OP-4`: Topological Simplicity and Self-Intersection Separation (`F-D6` / `L1`)
- **Status:** **`UNVERIFIED` / Unimplemented (`Phase 3 Contract 01`)**
- **Problem:** As demonstrated by bow-tie `2S = 0` (`F-D6` in [`NUMERICAL_AND_INVARIANT_FOUNDATIONS.md`](./NUMERICAL_AND_INVARIANT_FOUNDATIONS.md)), signed Shoelace area — even in exact `BigInt` — cannot separate collinearity (`orient2d = 0` for all vertex triples), self-intersection (`∃ non-adjacent edges crossing`), zero-length edges, and invalid cyclic boundary topology.
- **Open tasks:**
  1. Formalize planar face simplicity (`isSimplePolygon`), regular cellular complex preconditions (no boundary self-identifications/loops), and `FACE_SUBDIVISION` invariants (`PGS-2D`, `portableId != localId`).
  2. Evaluate the `Construction DAG` inductive proof hypothesis (`F-E4`, marked `[ГИПОТЕЗА]` in [`RESEARCH_INTEGRATION_V1.md`](../../../RESEARCH_INTEGRATION_V1.md), lines `183-186`).
  3. Extend from planar 2D face simplicity to 3D polyhedral embedding & non-self-intersection predicates (`folding3d` boundary noted in [`ORI_STUDIO_INITIAL_AUDIT.md`](../../../ORI_STUDIO_INITIAL_AUDIT.md)).

---

## 4. Priority P3 — General Obstruction Model, Discrete Holonomy & Global Integrability

### `OP-5`: Six-Class Mathematical Obstruction Model (`F-A2`)
- **Status:** **`UNVERIFIED`** (**Absent from repository** beyond one table label in [`docs/research/constructive-fold-taxonomy/README.md`](../constructive-fold-taxonomy/README.md), line `38`)
- **Open tasks:**
  1. Define formal, typed feasibility predicates across obstruction domains (topological, algebraic/holonomic, metric/numerical, geometric embedding, kinematic, plus explicit interface to physical feasibility boundary).
  2. Establish explicit **selective prerequisite dependencies** between obstruction domains (e.g., topological manifoldness and edge metric consistency as prerequisites for polyhedral realization) without forcing an invalid total lattice order across heterogeneous spaces.

### `OP-6`: General Discrete Holonomy Model ($T_n \circ \dots \circ T_1 = I$) (`F-B4`)
- **Status:** **`UNVERIFIED`** (**Absent from repository**)
- **Open tasks:**
  1. Formulate ordered transformation-product consistency $T_n \circ \dots \circ T_1 = I$ around crease-complex vertices and multi-face loops in $\mathrm{SE}(3)$ / $O(3)$, strictly preserving non-commutative composition order.
  2. Address spinor double-cover sign sensitivity (as noted externally for quaternion loop $q_n \cdots q_1 = [+1, 0, 0, 0]$ vs. $-1$ in `ori-studio`) and translational closure gap (`LoopGap`) across arbitrary 3D dihedral angles.

### `OP-7`: Cycle Bases, Homology / Cocycles, and Local-to-Global Integrability
- **Status:** **`UNVERIFIED`** (**Absent from repository**)
- **Open tasks:**
  1. Specify exact homological/cocycle closure conditions over cellular complexes ($S = (M, T)$) and fundamental/generating cycle bases.
  2. State precise topological and metric assumptions under which local flatness / per-cycle consistency implies global integrability — **without** falsely claiming simple connectivity is necessary when generating cycles are explicitly verified.

---

## 5. Priority P4 — Continuous Kinematic Reachability & Physical Feasibility Boundary

### `OP-8`: Continuous Kinematic Reachability (`L4`)
- **Status:** **`DOCUMENTED` roadmap target (`Phase 5–7`) / Unimplemented**
- **Open tasks:**
  1. Formalize continuous rigid configuration-space trajectory $\gamma(t) : [0,1] \to \mathcal{C}_{\text{free}}$ (separation from static final configuration validity and Akitaya et al. 2016 NP-hardness; [`docs/RESEARCH_L2_L7_SOURCES.md`](../../RESEARCH_L2_L7_SOURCES.md), lines `63`, `70`).
  2. Investigate kinematic disconnection and locking questions flagged in [`docs/research/constructive-fold-taxonomy/OPEN_QUESTIONS.md`](../constructive-fold-taxonomy/OPEN_QUESTIONS.md) (`§3–§6`): rigid disconnect conditions for closed sink folds (*shizume-ori*), vs. friction-dependent cycles (*Sonobe*, `tuck`/`crimp`).

### `OP-9`: Unified Formal Bridge to Physical Feasibility (`PWRP v1.1`)
- **Status:** **`DOCUMENTED` interface target / Open research**
- **Open tasks:** Connect mathematical predicates (`M_OMR`) cleanly to `PWRP` thickness, radius, friction, flexural stiffness ($n \cdot E t^3 \dots n^3 \cdot E t^3$ scaling hypothesis), and buckling models (`PWRP-O01..O13` in [`OMR_ARCHITECTURE_OPEN_QUESTIONS.md`](../../../OMR_ARCHITECTURE_OPEN_QUESTIONS.md), lines `38-45`) while strictly preserving $\tau_{\text{geometry}} \neq \tau_{\text{material}} \neq \tau_{\text{fabrication}}$.
