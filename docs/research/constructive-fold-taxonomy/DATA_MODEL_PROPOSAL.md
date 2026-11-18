# Conceptual Data Model Proposal (`DATA_MODEL_PROPOSAL.md`)

> **Status:** `PROPOSED` (Conceptual Research Sketch — **NOT Implemented**)  
> **Strict Restrictions:**  
> - Contains **NO TypeScript interfaces**, runtime validation schemas, or executable code.  
> - Does **NOT** modify `src/core/*`, `Contract 02 v2`, `MCAR / CRP-01`, `PWRP v1.1`, or `L1–L7` definitions.  
> - Does **NOT** map constructive units 1-to-1 onto `L1–L7`.

---

## 1. Why the Annotation Unit Is a `ConstructiveUnit` (Not Always a Single Crease)

Empirical inspection of origami models demonstrates that constructive intent spans multiple topological scales. Requiring every functional annotation to attach strictly to a single edge $e_i$ creates structural ambiguity:

| Valid Carrier Scale for `ConstructiveUnit` | Concrete Example | Why Single-Edge Annotation Fails |
| :--- | :--- | :--- |
| **Single Crease** | Dart airplane centerline valley fold | Sufficient when function is localized on one hinge line. |
| **Single Vertex Star** | Degree-4 *Miura-ori* vertex or Ku–Tachi suppressor | Coupling speed ratios $p(\alpha,\beta)$ belong to the vertex neighborhood, not one edge alone. |
| **Connected Crease Subgraph (Gadget)** | *Color-reversal gadget*, *closed-sink collar*, *multi-layer crimp zone* | Function emerges from coordinated polarity and spacing across $k \ge 2$ creases. |
| **Pocket / Flap Constructive Pair** | *Masu* rim-flap-plus-floor pocket or *tato* overlap edge | Separates male tab, hinge line, and female pocket walls within a single sheet. |
| **Inter-Module Connection (`MCAR` Joint)** | *Sonobe* tab-in-pocket cycle across 3 modules | Spans multiple independent sheet provenances (`COMPONENT_PROVENANCE`); cannot be stored inside a single-sheet edge list. |

### Mandatory Single-Sheet vs. Modular Distinction
Following `MCAR / CRP-01` (*"Whole Structure $\ne$ Single Piece"*), a `ConstructiveUnit` must explicitly distinguish:
- **`IntraSheet` scope:** All participating faces, creases, and pocket/flap boundaries originate from one continuous sheet (`Single-Piece` provenance).
- **`InterModule` scope:** Contacting interfaces cross distinct component boundaries (`Modular` / `Hybrid` / `Multi-Part Enclosure`), referencing `MCAR` `componentId` and `jointId` identifiers rather than falsifying a single-sheet fold trace.

---

## 2. Conceptual Attribute Specification for `ConstructiveUnit`

The table below lists conceptual fields for future study (not a software schema):

| Conceptual Field Group | Conceptual Sub-Attributes & Meaning | Epistemic & Boundary Notes |
| :--- | :--- | :--- |
| **1. Identity & Scope** | `unit_id`; `provenance_scope` (`IntraSheet` \| `InterModule` \| `Unknown`) | Preserves `MCAR` rule against assuming `Single-Piece` without evidence. |
| **2. Participating Topology (`carrier_topology`)** | References to participating vertices, creases, faces, raw sheet boundary edges / corners (*kado*), and optional `MCAR` `component_refs` / `joint_refs` | Supports multi-scale annotation (edge, vertex, subgraph, pocket-flap pair, or cross-module joint). |
| **3. Geometric Primitive & Operation** | `mv_assignment` (`M` \| `V` \| `0` \| `Optional`); `operation_type` (`simple` \| `inside_reverse` \| `outside_reverse` \| `sink_open` \| `sink_closed` \| `crimp` \| `pleat` \| `squash` \| `rabbit_ear` \| `petal` \| `twist` \| `curved` \| `unknown`) | Keeps geometric operation strictly decoupled from functional role. |
| **4. Functional Roles (`functional_roles`)** | Non-exclusive multi-label subset of `{FORM, STRUCT, CONNECT, LOCK, KINEMATIC, EXCESS_MGMT, PROCEDURAL_REF, SURFACE_COLOR}` | Allows a crease/unit to serve multiple roles simultaneously. |
| **5. Constructive Significance (`criticality_profile`)** | Qualitative `<M, S, R, K>` tuple (`morphological`, `structural`, `retention`, `kinematic`) + `measurement_status` (`QualitativeHypothesis` \| `AbalationTested`) | Separates visual prominence from stiffness, retention, and kinematic necessity. |
| **6. Angular Parameters (`angular_parameters`)** | `sector_angles` ($\theta$, invariant planar metrics); `target_dihedral_angles` ($\rho \in [-\pi,\pi]$); `spatial_relations` ($\phi$, insertion alignment, undercut/wedge angles); `coupling_constraints` (e.g., vertex speed relations) | Enforces three-way separation between $\theta$, $\rho$, and $\phi$ (`ANGLE_MODEL.md`). |
| **7. Retention Mechanism (`retention_mechanism`, nullable)** | Populated when `LOCK` or `CONNECT` is present: `mechanism_class` (8 proposed classes in `LOCK_MECHANISMS.md` or `None` / `Unknown`); `retention_physics` flags (`geometric_blocking`, `kinematic_blocking`, `friction_dependent`, `thickness_dependent`, `elastic_bistability`); `reversibility`; `non_destructive_release` | Prevents friction/elastic locks from masquerading as pure zero-thickness geometric locks; preserves `Unknown`. |
| **8. Dependencies & Sequence Constraints** | `geometric_prerequisites` (upstream elements locating the unit); `sequence_constraints` (partial order $U_a \prec U_b$ needed for accessible insertion or crimping) | Captures path dependence (`PWRP-08`) separately from static end-state roles. |
| **9. Optional Cross-Track Bridges (`[PROPOSED]`)** | `mcar_bridge`: optional links to `MCAR` `jointId`, `JOINING_METHOD`, `INTERFACE_DOF`; `pwrp_routing_hints`: non-binding physical pattern pointers (e.g., `PWRP-03/04/05/06/08/12`) | Strictly advisory pointers; changes neither `MCAR` nor `PWRP v1.1` contracts and specifies zero `L1–L7` runtime bindings. |

---

## 3. Architectural Non-Interference Guarantee

- **Independent from `L1–L7`:** No field above assigns responsibility to `L1`, `L2`, `L3`, `L4`, `L5`, `L6`, or `L7`.
- **Independent from Obstruction Model:** `ConstructiveUnit` captures *structural role and intent*, whereas obstruction classes capture *why a proposed realization fails mathematical, kinematic, or physical validity*.
- **Safe `UNKNOWN` Defaults:** Any unobserved internal overlap, unverified retention physics, or ambiguous assembly order must remain explicitly marked `Unknown` per OMR epistemic rules (`MCAR` / `PWRP-10`).
