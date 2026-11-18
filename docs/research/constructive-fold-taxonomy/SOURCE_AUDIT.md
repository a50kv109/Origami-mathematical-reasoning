# Source Audit and Epistemic Evidence Register (`SOURCE_AUDIT.md`)

> **Purpose:** Preserve full epistemic transparency across every mathematical fact, documented craft practice, mechanical interpretation, proposed taxonomy element, unverified claim, and rejected reference inherited from earlier research drafts.  
> **Non-Modification Guarantee:** Existing [`docs/SOURCE_REGISTRY.md`](../../SOURCE_REGISTRY.md) and canonical architecture documents were inspected and left untouched.

---

## 1. Status Legend

| Status | Definition |
| :--- | :--- |
| `VERIFIED` | Checked directly against an accessible primary paper, repository file, or reliable independent reference. |
| `DOCUMENTED` | Well-documented in origami or mechanics literature, though formal proof in OMR context is not yet reproduced here. |
| `PROPOSED` | Conceptual classification, structural model, or attribute sketch introduced by this research track. |
| `HYPOTHESIS` | Mechanical or mathematical claim requiring formal derivation, simulation, or physical experiment. |
| `UNVERIFIED` | Cited source, exact page reference, or specialized term could not be verified against accessible primary sources. |
| `REJECTED` | Contradicted by direct inspection of the repository or reliable evidence. |

---

## 2. Claim-by-Claim Audit Register

| # | Claim / Concept | Source Cited | Source Type | Exact Reference | Verification Status | Confidence | Limitations & Notes |
| :-: | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | **OMR codebase currently implements only 2D `REFLECTION_ACROSS_LINE` (`L2`, `OperationRequest`, `TRACE`, `L7`), while `L1` and `L3–L6` are unimplemented.** | `docs/ARCHITECTURE.md`, `OMR_ARCHITECTURE_MAP.md`, `OMR_DOCUMENTATION_INVENTORY.md` | Local repo specs | `docs/ARCHITECTURE.md` §§1–3; `OMR_ARCHITECTURE_MAP.md` §2 | `VERIFIED` | High | Directly verified in workspace markdown specifications. |
| 2 | **`MCAR / CRP-01` models `COMPONENTS`, `JOINTS`, `INTERFACES`, `POCKET_FLAP` / `INTERLOCK`, and `ASSEMBLY_SEQUENCE`; `PWRP v1.1` models `PWRP-01..14` + `PWRP-10`.** | `MCAR_PATTERN_PASSPORT.md`, `MCAR_PWRP_RELATIONSHIP.md`, `PWRP_V1_1_TAXONOMY_PROPOSAL.md` | Local research docs | `MCAR_PATTERN_PASSPORT.md` §§5–6; `PWRP_V1_1_TAXONOMY_PROPOSAL.md` §§1–3 | `VERIFIED` | High | Documented research in repo; neither is implemented in runtime code. |
| 3 | **Sector angles $\theta$ are isometric invariants; degree-4 rigid vertices satisfy spherical $\tan(\rho_2/2) = p(\alpha,\beta)\tan(\rho_1/2)$ coupling; `0`/optional creases, wires, splitters, and $90^\circ$ suppressors formalize kinematic mode control.** | Akitaya, Demaine, Horiyama, Hull, Ku & Tachi (*Rigid Foldability is NP-Hard*, JoCG) | Peer-reviewed computational geometry paper | Confirmed external paper (arXiv / JoCG) | `VERIFIED` | Very High | Applies to rigid zero-thickness vertex/gadget kinematics; does not cover friction or elastic tucks. |
| 4 | ***Origamizer* decomposes wrapping into floor polygons, wall triangles/quadrangles, and interior excess-hiding tucks (tuck proxy).** | Demaine & Tachi (*Origamizer*, SoCG 2017) | Peer-reviewed computational origami paper | Confirmed external paper (SoCG 2017) | `VERIFIED` | Very High | Concerns polyhedral wrapping synthesis; tucks hide excess area rather than mechanically locking seams. |
| 5 | **Color-reversal gadgets and turn/excess-hiding gadgets flip visible sheet normals ($\vec{n}\to-\vec{n}$) independently of silhouette geometry.** | Demaine, Demaine & Mitchell (*Folding Flat Silhouettes and Wrapping Polyhedral Packages*) | Peer-reviewed computational origami paper | Confirmed external paper (1999/2000; *Geometric Folding Algorithms*) | `VERIFIED` | Very High | Justifies adding `SURFACE_COLOR` and splitting `EXCESS_MGMT` from `PROCEDURAL_REF`. |
| 6 | **V-beam folded cross-sections increase flexural stiffness $K_\theta$ compared to flat sheets; discrete shells capture non-zero rest-angle elastic bistability.** | Grinspun et al. (*Discrete Shells*, 2003 / DDG Course); Burgoon & Wood | Peer-reviewed graphics / mechanics literature | Confirmed external literature | `VERIFIED` | High | Continuum/mesh approximation; quantitative origami stiffness requires per-material calibration. |
| 7 | **Japanese operation terms: `nakawari-ori` (中割り折り, inside reverse), `kabuse-ori` (かぶせ折り, outside reverse), `shizume-ori` (沈め折り, open/closed sink), `dan-ori` (段折り, pleat/crimp).** | Standard origami literature (Lang, Engel, Kasahara; Japanese folding references) | External origami references | Verified via external search against standard Japanese glossaries | `VERIFIED` | High | These describe **folding operations**, not automatically constructive functions or locks. |
| 8 | **Traditional *Masu* box (rim flaps over walls trapping miters), *Sonobe* modular tab-in-pocket cycle, and cyclic *tato* flap-under-flap closure exist as documented craft techniques.** | Standard origami corpus (Kasahara; Sonobe modular tradition) | Documented craft techniques | Verified via external craft documentation | `DOCUMENTED` | High | Craft existence is documented; exact frictionless stability bounds remain mechanical hypotheses. |
| 9 | **Eight non-exclusive multi-label functional roles (`FORM`, `STRUCT`, `CONNECT`, `LOCK`, `KINEMATIC`, `EXCESS_MGMT`, `PROCEDURAL_REF`, `SURFACE_COLOR`).** | Research synthesis (`FUNCTIONAL_ROLES.md`) | Research taxonomy proposal | `FUNCTIONAL_ROLES.md` §§1–3 | `PROPOSED` | Medium–High | Coherent conceptual framework; requires pattern annotation coverage test (`OPEN_QUESTIONS.md #9`). |
| 10 | **Separation of 3 geometric angle types ($\theta, \rho, \phi$) and 6 proposed functional angle roles.** | Research synthesis (`ANGLE_MODEL.md`) | Mathematical separation (`[A]`) + role proposal (`[D]`) | `ANGLE_MODEL.md` §§1–2 | Geometric split: `VERIFIED`<br>6 functional roles: `PROPOSED` | High (split) / Medium (roles) | Functional angle roles can overlap; not six independent mathematical axioms. |
| 11 | **Four-dimensional constructive criticality profile `<M, S, R, K>`.** | Research synthesis (`CRITICALITY_MODEL.md`) | Conceptual model / engineering hypothesis | `CRITICALITY_MODEL.md` §§1–3 | `PROPOSED` / `HYPOTHESIS` | Medium | Resolves 1D ranking paradox qualitatively; lacks validated scoring protocol or statistical independence proof. |
| 12 | **Multi-layer crimp (`dan-ori`, Lock 2.4) creates capstan/offset locking through finite-thickness arc-length differentials ($t > 0$).** | Research synthesis (`LOCK_MECHANISMS.md`) + Tachi thick-origami analogy | Mechanical interpretation | `LOCK_MECHANISMS.md` §2.4 | `HYPOTHESIS` | Medium | Craft technique is `DOCUMENTED`; exact friction/thickness/offset lock boundary is unverified analytically/experimentally. |
| 13 | **Closed sink (`shizume-ori`, Lock 2.5) *always* creates disconnected components in rigid configuration space.** | Earlier pasted research draft | Mathematical claim | `LOCK_MECHANISMS.md` §2.5 | `HYPOTHESIS` / `UNVERIFIED` | Low–Medium | Some closed sinks trap geometry rigidly, but generality across arbitrary star/collar geometry is unproven. |
| 14 | **Cyclic modular assemblies (*Sonobe* 3-unit cycle, Lock 2.7) self-lock purely geometrically without friction.** | Earlier pasted research draft | Mechanical/kinematic claim | `LOCK_MECHANISMS.md` §2.7 | `HYPOTHESIS` / `UNVERIFIED` | Low–Medium | Pure global rigid translation is blocked by non-parallel axes, **but** sequential rotation/flexing disassembly at $\mu_s=0$ is not ruled out. |
| 15 | **`TOMESHIRO` (`止め代` / `留め代`) as an origami-specific canonical locking term in Shuzo Fujimoto's works, plus Fujimoto page citations (`p. 36 & 109`, `p. 61 & 96`) and secondary phrases (`uchigawa yori fusagu`, `kasaneru bubun`, `wa ni suru`).** | Earlier pasted research draft citing `Twist Origami 3.pdf` / `Solid Origami.pdf` | Unverified claim / PDFs absent from workspace | `docs/SOURCE_REGISTRY.md` lists titles #21–23 only; PDFs not present in `/app/applet` | **`UNVERIFIED`** | Very Low | External search confirms `止め代` (`tomeshiro`) is **general Japanese papercraft/packaging/sewing vocabulary** (*fastening/tucking margin*), **NOT** an established canonical origami lock term in Fujimoto's public references. Do not promote to canonical glossary. |
| 16 | **Alleged `"Nakazawa / lock-bottom dart"` paper airplane locking fold.** | Earlier pasted research draft | Unverified citation | None verifiable | **`UNVERIFIED`** | Very Low | Quarantined pending primary-source verification (`OPEN_QUESTIONS.md #2`). |
| 17 | **Citation of an `"OMR Terminological Registry"` inside the repository as evidence for `kabuse-ori`, `dan-ori`, `shizume-ori`.** | Earlier pasted research draft | Non-existent repository artifact | Checked via repo-wide `grep` and `docs/SOURCE_REGISTRY.md` | **`REJECTED`** | High (that artifact does not exist) | No file named `"OMR Terminological Registry"` exists in the repo; `docs/SOURCE_REGISTRY.md` only references `#29 Ori Studio Multilingual Origami Research` for `Reverse`, `Squash`, `Rabbit Ear`, `Sink`. |

---

## 3. Repository Files Inspected (Read-Only Check)

Existing repository files inspected to determine documentation conventions and verify boundaries without altering them:
- `OMR_ARCHITECTURE_MAP.md`
- `OMR_DOCUMENTATION_INVENTORY.md`
- `docs/ARCHITECTURE.md`
- `docs/REPOSITORY_STRUCTURE.md`
- `docs/RESEARCH_BASE.md`
- `docs/SOURCE_REGISTRY.md`
- `MCAR_PATTERN_PASSPORT.md`
- `MCAR_PWRP_RELATIONSHIP.md`
- `PWRP_V1_1_TAXONOMY_PROPOSAL.md`
- `PWRP_V1_1_PATTERN_CATALOG.md`
