# Constructive Fold Taxonomy — Research Package (`docs/research/constructive-fold-taxonomy/`)

> **Document Status:** `RESEARCH ONLY` (`PROPOSED / EXPLORATORY`)  
> **Non-Canonical Notice:** This package is **NOT** canonical OMR architecture. It does **NOT** modify `L1–L7` (`docs/ARCHITECTURE.md`), `src/core/*`, `Contract 02 v2`, `MCAR / CRP-01`, `PWRP v1.1`, or `docs/SOURCE_REGISTRY.md`. No runtime code, schemas, or verification guarantees are implemented here.

---

## 1. Research Purpose and Scope

This research package preserves and organizes the findings of the exploratory study **"OMR — Constructive Fold Classification: Folds, Functional Angles, and Locking Mechanisms"** inside the `Origami-mathematical-reasoning` documentation tree without promoting unverified engineering hypotheses into OMR canon.

Its purpose is to investigate a layer of **constructive semantics** for origami: describing not only *what geometric transformation* a crease executes, but *what constructive function* a crease or crease subcomplex serves in an assembled structure, *how its angles operate*, *what mechanisms resist separation or unfolding*, and *what happens if that element is removed or relaxed*.

### Package Structure

| Document | Contents | Primary Status |
| :--- | :--- | :--- |
| [`README.md`](./README.md) | Research purpose, scope, non-canonical status, architectural boundaries | `RESEARCH ONLY` |
| [`FUNCTIONAL_ROLES.md`](./FUNCTIONAL_ROLES.md) | Eight non-exclusive functional role labels and operation-vs-function decoupling | `PROPOSED` |
| [`ANGLE_MODEL.md`](./ANGLE_MODEL.md) | Separation of 3 geometric angle primitives and 6 proposed functional angle roles | `PROPOSED` |
| [`LOCK_MECHANISMS.md`](./LOCK_MECHANISMS.md) | Eight preliminary locking/retention mechanism classes and physical dependencies | `PROPOSED` / `HYPOTHESIS` |
| [`CRITICALITY_MODEL.md`](./CRITICALITY_MODEL.md) | Four-dimensional constructive criticality profile `<M, S, R, K>` | `PROPOSED` / `HYPOTHESIS` |
| [`DATA_MODEL_PROPOSAL.md`](./DATA_MODEL_PROPOSAL.md) | Non-implemented conceptual attribute model for a `ConstructiveUnit` | `PROPOSED` |
| [`OPEN_QUESTIONS.md`](./OPEN_QUESTIONS.md) | Unresolved terminological, mathematical, mechanical, and modeling questions | `OPEN` |
| [`SOURCE_AUDIT.md`](./SOURCE_AUDIT.md) | Evidence register separating `VERIFIED`, `DOCUMENTED`, `PROPOSED`, `HYPOTHESIS`, `UNVERIFIED`, and `REJECTED` claims | `AUDIT` |

---

## 2. Core Conceptual Separation: Operation, Sequence, Function, Obstruction, and Physics

A central requirement identified by this study is preventing category conflation across five distinct questions:

| Dimension | Question Answered | Example | Canonical / Existing OMR Location (if any) |
| :--- | :--- | :--- | :--- |
| **Geometric Operation** | *What geometric transformation is performed?* | Mountain ($M$), Valley ($V$), `0`, inside reverse (*nakawari-ori*), outside reverse (*kabuse-ori*), sink (*shizume-ori*), pleat/crimp (*dan-ori*) | Partial 2D reflection only in `src/core/*` (`L2`) |
| **Folding Sequence** | *When and in what order is it performed?* | Form pocket first $\prec$ flex tab $\prec$ insert tab; stack layers $\prec$ crimp | `ASSEMBLY_SEQUENCE` (`MCAR`) / `PWRP-08` (step order) |
| **Constructive Function** | *What structural role does the fold/gadget fulfill in the target state?* | `FORM`, `STRUCT`, `CONNECT`, `LOCK`, `KINEMATIC`, `EXCESS_MGMT`, `PROCEDURAL_REF`, `SURFACE_COLOR` | **This research package (`PROPOSED`)** |
| **Mathematical Obstruction** | *Why is a desired folding realization mathematically or kinematically impossible?* | Disconnected configuration space, metric violation, self-intersection, layer-order conflict | Six obstruction classes (research context) / `L1–L7` verifier checks |
| **Physical Feasibility** | *Does the construction survive material limits, friction, thickness, and elasticity?* | Slip-out when friction is too low, spring-back, tear at sharp bend radius, buckling | `PWRP v1.1` (`PWRP-01..14`, `PWRP-10` arbiter) |

**Key Rule:** An operation (such as a sink or tuck) does **not** automatically determine its constructive function, and a connecting operation (`CONNECT`) does **not** automatically produce a mechanical lock (`LOCK`).

---

## 3. Relationship to Existing OMR Architecture (`L1–L7`, `MCAR`, `PWRP`)

Per [`OMR_ARCHITECTURE_MAP.md`](../../../OMR_ARCHITECTURE_MAP.md), existing OMR research and engineering span three independent domains:
1. **`D1`: Mathematical Reasoning (`L1–L7`)** — currently implemented only for 2D `REFLECTION_ACROSS_LINE` (`L2`, `OperationRequest`, `TRACE`, `L7` in `src/core/*`). `L1` and `L3–L6` are unimplemented specification layers in [`docs/ARCHITECTURE.md`](../../ARCHITECTURE.md).
2. **`D2`: Constructive Reasoning (`CRP-01 / MCAR`)** — documented research modeling `COMPONENTS`, `JOINTS`, `INTERFACES`, `JOINING_METHOD` (`POCKET_FLAP`, `INTERLOCK`, `ADHESIVE`, etc.), and `ASSEMBLY_SEQUENCE`.
3. **`D3`: Physical World Reasoning (`PWRP v1.1`)** — documented research covering 13 physical patterns (`PWRP-01..09`, `11..14`) and the `PWRP-10` epistemic arbiter.

### Strict Architectural Boundary Constraints
- **No direct mapping to `L1–L7`:** This taxonomy must **not** be mapped 1-to-1 onto `L1–L7`. For example, `FORM` does not equal `L2`, and `LOCK` does not automatically belong to `L4` (kinematics), since real locks frequently rely on `L3`-style layer ordering, `MCAR`-style joint geometry, and `PWRP`-style friction/thickness/elasticity.
- **Separate from Obstruction Classes:** Obstructions classify *why a realization fails*; constructive roles classify *what a fold or gadget is intended to do structurally*.
- **Proposed Future Interface Points (Non-Binding):**
  - For single-sheet origami, this taxonomy studies fine-grained intra-sheet constructive units (`ConstructiveUnit`) analogous to how `MCAR` decomposes inter-component `JOINTS`.
  - For pocket/tab/crimp retention, lock mechanism attributes provide structured hypotheses that could later route to `PWRP v1.1` checks (e.g., `PWRP-03` spatial clearance, `PWRP-04` friction, `PWRP-05` finite bend radius/offset, `PWRP-06` spring-back, `PWRP-08` path dependence, `PWRP-12` buckling/multistability) without altering `PWRP` or `MCAR` contracts.

---

## 4. Epistemic Discipline Used Across This Package

All statements in this package follow the five-level epistemic separation required by OMR research standards ([`docs/RESEARCH_BASE.md`](../../RESEARCH_BASE.md) and [`SOURCE_AUDIT.md`](./SOURCE_AUDIT.md)):
- **A. Established Mathematical Facts** (e.g., isometric invariance of sector angles; degree-4 vertex spherical coupling; rigid-foldability NP-hardness results).
- **B. Documented Origami Construction Techniques** (e.g., standard reverse/sink/crimp maneuvers; *Masu* box, *Sonobe* unit, *tato* overlap closures).
- **C. Mechanical Interpretations** (e.g., V-beam flexural stiffening; Coulomb wedge/capstan friction; elastic bistability).
- **D. Proposed Classification** (the 8 roles, 6 functional angle roles, 8 lock classes, `<M, S, R, K>` profile, and `ConstructiveUnit` attributes).
- **E. Unverified Hypotheses & Unverified Terms** (e.g., whether specific Japanese craft terms such as `tomeshiro` appear canonically in Shuzo Fujimoto's works, or whether multi-axis modular cycles lock without friction).

No illustrative example in this package is presented as a mathematical theorem or experimentally measured validation.
