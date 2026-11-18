# Open Questions and Research Validation Agenda (`OPEN_QUESTIONS.md`)

> **Status:** `OPEN` (Unresolved Research Questions Blocking Any Future Canonization)

The following ten open questions must be investigated before promoting any part of the constructive fold taxonomy, lock catalogue, or `<M, S, R, K>` profile into OMR canonical specifications or code.

---

### 1. Verification of Japanese Terminology and Fujimoto References
- Can *tomeshiro* (`止め代` / `留め代`)—as well as secondary phrases raised in preliminary drafts (`uchigawa yori fusagu`, `kasaneru bubun`, `wa ni suru`)—be confirmed in accessible primary texts of Shuzo Fujimoto (*Twist Origami 1/3*, *Solid Origami*) as formal origami locking terminology, or is *tomeshiro* strictly general Japanese craft/packaging vocabulary (*allowance/margin for fastening*)?
- *Current stance:* **Quarantined as `UNVERIFIED` in [`SOURCE_AUDIT.md`](./SOURCE_AUDIT.md)**; excluded from any canonical glossary.

### 2. Verification of the Alleged "Nakazawa" Locking Mechanism
- An earlier draft cited a `"Nakazawa / lock-bottom dart"` paper airplane crease lock without verifiable bibliographic provenance. Does a documented `"Nakazawa"` bottom-lock dart convention exist in primary origami/aeromodeling literature, or was that citation hallucinated?
- *Current stance:* **Flagged as `UNVERIFIED`**; omitted from [`FUNCTIONAL_ROLES.md`](./FUNCTIONAL_ROLES.md) examples.

### 3. Formal Conditions for Purely Geometric vs. Friction-Dependent Locks
- Under an explicit mathematical model ($t=0, \mu_s=0$, rigid vs. compliant facets), which of the eight lock classes in [`LOCK_MECHANISMS.md`](./LOCK_MECHANISMS.md) genuinely block release purely by geometry or topology, and which depend irreducibly on static friction ($\mu_s > 0$) or elastic clamping forces?

### 4. Finite-Thickness and Elastic Insertion Conditions
- Practical locks such as straight tucks (2.1), undercut tabs (2.2), cyclic flaps (2.6), and closing a *Sonobe* cycle (2.7) are often **rigidly unreachable** from the unfolded state $f_0$ without temporary panel bowing during $t \in (0,1)$, and multi-layer crimps (2.4) appear to vanish conceptually at $t = 0$. What analytical thickness ($t/L$), bend-radius ($R_{\min}$), and elastic-strain inequalities cleanly bound admissible snap-in and crimp locks?

### 5. Genuine Multi-Axis Retention vs. Friction in Cyclic Modular Assemblies
- In a 3-unit *Sonobe* vertex cycle (or larger modular polyhedra), non-parallel insertion vectors block pure rigid global translation. However, can the cycle still disassemble sequentially via small rotations, local twists, or elastic flexing if $\mu_s \to 0$? That is, **is multi-axis modular locking truly self-retaining without friction**, or is friction + panel stiffness indispensable?

### 6. Kinematic Obstruction Conditions for Closed Sink Folds
- Under rigid-panel assumptions, do **closed sink folds** (*shizume-ori*) always create disconnected components in the rigid configuration space (true kinematic obstruction), or only for specific vertex-star angles and collar constraints? What exact geometric conditions guarantee rigid non-releasability?

### 7. Operational Measurement of `<M, S, R, K>`
- How can Morphological (`M`), Structural (`S`), Retention (`R`), and Kinematic (`K`) criticality be measured reproducibly (e.g., Hausdorff envelope deviation under crease ablation for `M`; modal/flexural stiffness drop for `S`; critical pull/unfold force threshold for `R`; DOF/branch loss for `K`)—and how correlated are they in real models?

### 8. Single-Sheet vs. Modular Submodels
- Do intra-sheet closures (e.g., *Masu* box interior rim flaps, cyclic *tato* folds) and inter-module assemblies (*Sonobe* joints) require separate structural submodels in OMR, or can single-sheet pocket/flap pairs be represented cleanly via `MCAR`-compatible `INTERFACES` scoped to `SINGLE_SHARED_SHEET`?

### 9. Algorithmic Extraction of Constructive Gadgets from Crease Patterns
- Given an unlabeled crease pattern (vertex coordinates, `M/V/0` assignments, and `faceOrders`), to what extent can functional gadgets (`LOCK` pockets, `EXCESS_MGMT` tucks, `SURFACE_COLOR` reversals, Ku–Tachi `KINEMATIC` splitters) be detected automatically without human annotation?

### 10. Non-Disruptive Relationship to `MCAR` and `PWRP v1.1`
- If future OMR phases integrate constructive annotations, how should `ConstructiveUnit` map to `MCAR` (`JOINTS`, `INTERFACES`, `JOINING_METHOD`) and `PWRP v1.1` (`PWRP-03/04/05/06/08/12`) **without** altering existing `MCAR`, `PWRP`, or `L1–L7` mathematical verifier contracts?
