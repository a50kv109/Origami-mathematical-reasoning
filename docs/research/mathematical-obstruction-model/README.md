# Mathematical Obstruction Model — Research Package (`docs/research/mathematical-obstruction-model/`)

> **Document Status:** `RESEARCH ONLY — NON-CANONICAL`  
> **Non-Canonical Notice:** This package is **NOT** canonical OMR architecture. It does **NOT** modify `L1–L7` ([`docs/ARCHITECTURE.md`](../../ARCHITECTURE.md)), `src/core/*`, `tests/*`, `Contract 02 v2`, `MCAR / CRP-01`, `PWRP v1.1`, [`docs/RESEARCH_BASE.md`](../../RESEARCH_BASE.md), [`docs/SOURCE_REGISTRY.md`](../../SOURCE_REGISTRY.md), or the sibling research package [`docs/research/constructive-fold-taxonomy/`](../constructive-fold-taxonomy/README.md). No new runtime code or verification behavior is implemented here.

---

## 1. Purpose and Phase 1 Consolidation Scope

This package consolidates, preserves, and traces the **verified and repository-documented mathematical findings** of Origami Mathematical Reasoning (OMR) without mixing proven identities or experimentally reproduced numerical counterexamples with unrecovered external material or unformalized hypotheses.

### Current Package Contents (Phase 1)

| Document | Scope & Contents | Primary Evidence Basis |
| :--- | :--- | :--- |
| [`README.md`](./README.md) | Package boundaries, epistemic classification, and conceptual separations | Existing OMR architecture & audit corpus |
| [`NUMERICAL_AND_INVARIANT_FOUNDATIONS.md`](./NUMERICAL_AND_INVARIANT_FOUNDATIONS.md) | Consolidated findings `F-E1`–`F-E3` and `F-D1`–`F-D7` (reflection geometry, metamorphic invariants, IEEE-754 counterexamples `D-1..D-5`/`D-7`, bow-tie `2S = 0`, exact dyadic $\mathbb{Q}$ oracle, anchored-frame research) | `src/core/*`, `tests/*`, Phase 2.3–2.5.1 docs |
| [`LOCAL_GLOBAL_CONSISTENCY.md`](./LOCAL_GLOBAL_CONSISTENCY.md) | Findings `F-B1`–`F-B2` (step-local vs. process-global `verifyProcess` gap, non-commutativity of reflections, static vs. kinematic reachability, explicit absence of $\mathrm{SE}(3)$ holonomy) | `src/core/l7IndependentVerifier.ts`, `OMR_PROCESS_VERIFICATION_ARCHITECTURE.md`, Phase 2.4–2.5.1 audits |
| [`OPEN_PROBLEMS.md`](./OPEN_PROBLEMS.md) | Absent or unformalized targets: `PAT-30` recovery (`UNVERIFIED`), six-class obstruction predicates, discrete holonomy, cycle bases, geometric embedding, continuous kinematics `γ(t)`, and hardening gates (`OD-03`, `ROD-03`) | Repository gap audit & open-question registers |

### Deferred Documents (Not Created in Phase 1)

Because primary mathematical sources or formal predicate definitions are currently absent from the repository, the following planned sibling documents are **intentionally omitted** until their primary evidence or formal derivations are supplied:

- `OBSTRUCTION_CLASSES.md` *(blocked: six-class typed predicates & prerequisite structure not formalized in repo)*
- `HOLONOMY_MODEL.md` *(blocked: general cyclic composition $T_n \circ \dots \circ T_1 = I$ & cocycle conditions absent from repo)*
- `GEOMETRIC_EMBEDDING.md` *(blocked: 3D embedding & global non-self-intersection formalisms beyond 2D bow-tie counterexample)*
- `KINEMATIC_FEASIBILITY.md` *(blocked: `L4` continuous trajectory $\gamma(t)$ feasibility predicates unimplemented)*
- `PHYSICAL_FEASIBILITY_BOUNDARY.md` *(deferred to Phase 2: detailed bridge to [`PWRP_RESEARCH_REPORT.md`](../../../PWRP_RESEARCH_REPORT.md))*
- `PAT30_CASE_STUDY.md` *(blocked: primary `PAT-30` setup, equations, assumptions, and proof absent from repo)*

---

## 2. Conceptual Separation Across Domains

Per [`OMR_ARCHITECTURE_MAP.md`](../../../OMR_ARCHITECTURE_MAP.md) (`§2a`), [`PWRP_RESEARCH_REPORT.md`](../../../PWRP_RESEARCH_REPORT.md), and [`docs/research/constructive-fold-taxonomy/README.md`](../constructive-fold-taxonomy/README.md) (`§2`), OMR research strictly prevents category conflation across five distinct questions:

| Domain | Question Answered | Canonical / Research Location | Current Code Reality |
| :--- | :--- | :--- | :--- |
| **1. Mathematical Feasibility (`L1–L7`)** | *Are geometric transformations, axioms, invariants, and process traces formally valid under ideal (`T = 0`) assumptions?* | [`docs/ARCHITECTURE.md`](../../ARCHITECTURE.md), [`NUMERICAL_AND_INVARIANT_FOUNDATIONS.md`](./NUMERICAL_AND_INVARIANT_FOUNDATIONS.md) | **Partially implemented** in `src/core/*` (`OperationRequest → L2 reflectAcrossLine → TRACE → L7 verifyResult/verifyProcess` for 2D reflection only). `L1`, `L3–L6` are unimplemented specifications. |
| **2. Constructive Fold Taxonomy (`D2` / Intra-Sheet)** | *What structural/functional role, angle role, retention hypothesis, or criticality `<M, S, R, K>` does a fold or gadget serve?* | [`docs/research/constructive-fold-taxonomy/README.md`](../constructive-fold-taxonomy/README.md), `CRP-01 / MCAR` | **Research only** (`PROPOSED` / `HYPOTHESIS`). Completely separate from mathematical proofs and obstruction predicates. |
| **3. Mathematical Obstruction Theory** | *Which typed mathematical condition makes a target configuration or folding realization impossible (topological, metric, algebraic/holonomic, embedding, kinematic)?* | This package (`OPEN` / largely unrecovered; see [`OPEN_PROBLEMS.md`](./OPEN_PROBLEMS.md)) | Formal six-class obstruction system is **not implemented** and **not formalized** in repository files. |
| **4. Physical Feasibility (`PWRP v1.1`)** | *Does a construction remain viable under non-zero thickness ($T > 0$), bend radius ($R_{\min}$), friction ($\mu$), elasticity, buckling, and tool limits ($\tau_{\text{material}}, \tau_{\text{fabrication}}$)?* | [`PWRP_RESEARCH_REPORT.md`](../../../PWRP_RESEARCH_REPORT.md) (`PWRP-01..14`, `PWRP-10` arbiter) | **Documented research only** ($\text{Geometric Possibility} \neq \text{Physical Feasibility}$). |
| **5. Existing OMR Core (`L1–L7` Architecture)** | *How are responsibilities partitioned across isolated verification boundaries?* | [`docs/ARCHITECTURE.md`](../../ARCHITECTURE.md), [`docs/DEVELOPMENT_ROADMAP.md`](../../DEVELOPMENT_ROADMAP.md) | Frozen `v0.1.0-alpha` (`36/36` passing tests across `contract02.test.ts` and `metamorphic.test.ts`). `ROD-03` and `OD-01..OD-04` pending owner authorization. |

---

## 3. Six Mandatory Mathematical Distinctions

All entries in this package preserve six non-negotiable mathematical boundaries:

1. **Local compatibility vs. global consistency:** Passing step-local checks ($S_{i-1} \to S_i$) or local vertex checks does not imply global end-to-end consistency ($S_0 \to S_K$) or global cycle closure ([`LOCAL_GLOBAL_CONSISTENCY.md`](./LOCAL_GLOBAL_CONSISTENCY.md)).
2. **Cycle consistency vs. geometric embedding:** Algebraic closure around vertices or cycles (or zero signed area cancellation `2S = 0` on a bow-tie polygon) does not guarantee a non-self-intersecting geometric embedding in $\mathbb{R}^2$ or $\mathbb{R}^3$.
3. **Trivial holonomy vs. physical realizability:** Even exact algebraic cycle closure under zero-thickness idealized paper does not imply manufacturability or stability under finite thickness, friction, spring-back, or buckling.
4. **Static feasibility vs. continuous kinematic reachability:** Existence of a valid final folded geometry does not prove the existence of a continuous, collision-free rigid folding path $\gamma(t)$ from the unfolded state.
5. **Exact rational arithmetic vs. high-precision floating-point arithmetic:** Exact $\mathbb{Q}$ (`BigRational` over decoded IEEE-754 dyadics) eliminates rounding error for purely rational reflection sequences, whereas extended fixed-point (`512-bit`) or extended floating-point remains approximate (`MUL/DIV` truncation).
6. **Mathematical obstruction vs. physical failure:** Domain-typed mathematical infeasibility predicates over ideal geometry/topology/kinematics are strictly separated from constitutive mechanical material failures (`PWRP`).

---

## 4. Epistemic Discipline and Allowed Status Labels

In compliance with [`docs/RESEARCH_BASE.md`](../../RESEARCH_BASE.md) (`§1–§3`), every finding in this package carries one strictly defined status label:

| Status Label | Definition Used in This Package |
| :--- | :--- |
| **`PROVEN`** | Formally established mathematical identity/theorem whose derivation holds completely under explicit Euclidean/rational assumptions and is verified in OMR sources. |
| **`DERIVED`** | Analytically derived mathematical consequence (e.g., from IEEE-754 representation, $O(2)$ algebra, or variational perturbation bounds) documented in repository audits. |
| **`EXPERIMENTALLY_OBSERVED`** | Directly reproduced numerical counterexample or behavior executed against live `src/core/*` modules (note: empirical observation alone does not turn a finite test run into a universal theorem). |
| **`DOCUMENTED`** | Specified in repository architecture/research documents or external codebase audits (e.g., Ori Studio Rust audit) without OMR core implementation. |
| **`HYPOTHESIS`** | Explicitly conjectured mechanism or research proposal awaiting mathematical proof or empirical validation. |
| **`UNVERIFIED`** | Referenced in the repository (e.g., `PAT-30`, six obstruction classes) without primary setup, equations, or proofs present in repository files. |

**Negative Rules Applied Strictly:**
- Zero core code (`src/core/*`) or test files (`tests/*`) are modified.
- No formulas, coordinates, or experimental numbers are reconstructed from memory when absent from repository sources.
- External findings from [`ORI_STUDIO_INITIAL_AUDIT.md`](../../../ORI_STUDIO_INITIAL_AUDIT.md) are never presented as implemented OMR capabilities.
