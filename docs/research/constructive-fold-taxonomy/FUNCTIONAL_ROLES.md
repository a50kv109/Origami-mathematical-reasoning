# Functional Roles of Folds and Constructive Units (`FUNCTIONAL_ROLES.md`)

> **Status:** `PROPOSED` (Research Taxonomy — Non-Canonical)  
> **Epistemic Tagging:** `[A]` Mathematical fact · `[B]` Documented technique · `[C]` Mechanical interpretation · `[D]` Proposed classification · `[E]` Unverified hypothesis

---

## 1. Core Architectural Principle: Non-Exclusive Multi-Label Roles

Testing preliminary disjoint fold buckets against real origami models shows that **functional categories must be modeled as non-exclusive role labels**, not mutually exclusive partitions `[D]`:

1. **Multi-functionality on a single crease:** A single crease commonly serves two or three roles at once. For instance, in a traditional *Masu* box, the upper rim crease simultaneously establishes the top silhouette edge (`FORM`), wraps the inner flap onto the outer wall (`CONNECT`), and traps the diagonal corner gusset (`LOCK`) `[B][D]`.
2. **Annotation unit is not always a single crease:** While `FORM` or `KINEMATIC` hinge labels can apply to an individual crease edge $e_i$, functions such as `LOCK`, `SURFACE_COLOR`, or `EXCESS_MGMT` typically emerge only at the scale of a **constructive unit / gadget** (a vertex star, a tab-and-pocket pair, a multi-layer crimp zone, or a modular joint cycle) `[D]`.
3. **Operation $\ne$ Final Constructive Function:** Geometric maneuvers (*inside reverse / nakawari-ori*, *outside reverse / kabuse-ori*, *sink / shizume-ori*, *pleat or crimp / dan-ori*, *squash*, *rabbit ear*) describe **how paper moves/inverts**, not **why the resulting crease exists structurally**. For example:
   - An open sink (*shizume-ori*) can flatten a sharp corner to alter the silhouette (`FORM`) `[B]`.
   - A hidden sink pocket in an algorithm like *Origamizer* stows surplus paper out of sight (`EXCESS_MGMT`) `[A][B]`.
   - A closed sink (*shizume-ori*) around a constricted collar can mechanically trap an internal pyramid (`LOCK` / kinematic barrier) `[C][E]`.

---

## 2. The Eight Proposed Functional Roles

The preliminary six-role list (`FORM`, `STRUCT`, `CONNECT`, `LOCK`, `KINEMATIC`, `AUXILIARY`) is refined to **eight non-exclusive roles** after splitting `AUXILIARY` (whose passive marks and active tucks conflict geometrically) and adding `SURFACE_COLOR` `[D]`:

| Code | Role Name | Primary Constructive Purpose | Typical Crease State in Target $f_1$ |
| :--- | :--- | :--- | :--- |
| `FORM` | Form-Generating | Establishes visible exterior facets, silhouette boundaries, and 3D envelope | $\rho_i \ne 0$ (target dihedral) |
| `STRUCT` | Structural / Framing | Provides flexural stiffness, load-bearing cross-sections, bulkheads, or spacing | $\rho_i \ne 0$ (braced/corrugated/mitered) |
| `CONNECT` | Connecting / Joining | Brings sheet regions or separate modules into contact, overlap, or nesting | $\rho_i \ne 0$ at seam/flap interface |
| `LOCK` | Locking / Retention | Introduces a barrier resisting separation, spring-back, or unfolding | $\rho_i \ne 0$ (or cyclic/undercut gadget) |
| `KINEMATIC` | Kinematic / Control | Transmits, scales, splits, synchronizes, or suppresses continuous motion | Dynamic $\rho_i(t)$ or `0` mode suppressor |
| `EXCESS_MGMT` | Excess Management | Stows surplus paper area or equalizes layer thickness out of external view | $\rho_i \approx \pm\pi$ (active folded tuck) |
| `PROCEDURAL_REF` | Procedural Reference | Establishes construction landmarks or pre-creases before later steps | $\rho_i = 0$ (unfolded in final $f_1$) |
| `SURFACE_COLOR` | Surface / Color Routing | Inverts outward sheet normal ($\vec{n} \to -\vec{n}$) to expose opposite paper face | $\rho_i \approx \pm\pi$ (turn/flip gadget) |

---

## 3. Detailed Role Definitions

### 3.1 `FORM` — Form-Generating
- **Definition:** Creases and subcomplexes defining exterior facets, boundary edges, and 3D volume of the target state $f_1$ `[D]`.
- **Constructive Function:** Partitions the flat sheet into visible panels and concentrates discrete angular defect ($\Delta\theta = 2\pi - \sum\theta_k$) at vertices to generate polyhedral form `[A]`.
- **Distinguishing Characteristics:** Perturbing its dihedral angle immediately alters the external silhouette or target approximation `[D]`.
- **Confidence / Sources:** High (`[A][B]`: Demaine & Tachi, *Origamizer* seamless floor polygons; Demaine et al., strip-wrapping silhouettes).

### 3.2 `STRUCT` — Structural / Framing
- **Definition:** Creases generating spatial stiffness, load-bearing cross-sections, internal gussets, or structural spacing (`rivers`, wall members) without necessarily defining exterior shape `[D]`.
- **Constructive Function:** Converts compliant flat sheet into stiffer profiles (e.g., V-beams, corrugated ribs, mitered corner gussets) by increasing cross-sectional moment of area and coupling bending into membrane loads `[C]`.
- **Distinguishing Characteristics:** Controls flexural stiffness $K_\theta$, wall orthogonality, or spacing; often hidden internally `[C]`.
- **Confidence / Sources:** High (`[A][C]`: Grinspun et al., *Discrete Shells* V-beam vs. flat-beam rigidity; Lang *TreeMaker* rivers; *Origamizer* wall polygons).

### 3.3 `CONNECT` — Connecting / Joining
- **Definition:** Creases and flap/pocket complexes that bring distant regions of a single sheet—or separate modular units—into overlapping, nested, or abutting contact `[D]`.
- **Constructive Function:** Establishes seam continuity and layer-overlap ordering (`INTERFACES` / `JOINTS` in `MCAR`) `[B][D]`.
- **Distinguishing Characteristics:** Creates contact/nesting, **but does not by itself prevent axial sliding or elastic unfolding**. `CONNECT` without `LOCK` requires external glue, tape, or clamping `[D]`.
- **Confidence / Sources:** High (`[B][D]`: `MCAR_PATTERN_PASSPORT.md`; standard tab-in-pocket modular assembly).

### 3.4 `LOCK` — Locking / Retention
- **Definition:** Creases or constructive gadgets creating a geometric, topological, kinematic, frictional, or elastic-energy barrier against separation or spring-back `[D]`.
- **Constructive Function:** Eliminates or resists release degrees of freedom ($f_1 \not\to f_0$) without external fasteners `[C][D]`.
- **Distinguishing Characteristics:** Directly stabilizes retention; frequently occupies negligible visual surface area `[D]`.
- **Confidence / Sources:** High as a functional category (`[B][C][D]`); specific pure-geometric vs. friction boundaries remain open for verification (see [`LOCK_MECHANISMS.md`](./LOCK_MECHANISMS.md)).

### 3.5 `KINEMATIC` — Kinematic / Control
- **Definition:** Coupled hinges and vertex gadgets that transmit, scale, synchronize, split, or suppress motion along continuous folding paths $F(M,t)$ `[A][D]`.
- **Constructive Function:** Governs spherical rotational closure around vertices ($\prod R_{c_i}(\rho_i) = I$), speed ratios, and bifurcation branch selection (including `0`-assigned *optional creases* acting as mode switches) `[A]`.
- **Distinguishing Characteristics:** Characterized over the motion trajectory $t \in [0,1]$, not purely at static $f_1$ `[A]`.
- **Confidence / Sources:** Very High (`[A]`: Akitaya, Demaine, Horiyama, Hull, Ku & Tachi, *Rigid Foldability is NP-Hard*).

### 3.6 `EXCESS_MGMT` — Excess Management *(Split from Preliminary `AUXILIARY`)*
- **Definition:** Active folds ($\rho_i \ne 0$, typically $\pm\pi$ in $f_1$) whose purpose is hiding surplus sheet area or equalizing local layer thickness inside/behind visible facets `[A][D]`.
- **Constructive Function:** Resolves paper-budget overflow between adjacent target faces without protruding through the exterior silhouette `[A][B]`.
- **Distinguishing Characteristics:** Physically folded in $f_1$ (unlike `PROCEDURAL_REF`), yet contributes neither primary silhouette (`FORM`) nor primary structural bracing (`STRUCT`) `[D]`.
- **Confidence / Sources:** High (`[A][B]`: Demaine & Tachi, *Origamizer* tuck proxies; Demaine, Demaine & Mitchell, excess-hiding folds).

### 3.7 `PROCEDURAL_REF` — Procedural Reference *(Split from Preliminary `AUXILIARY`)*
- **Definition:** Landmark pinches, grid subdivisions, and pre-creases created solely to locate geometry or soften hinges for a later step, returning flat ($\rho_i = 0$) in $f_1$ `[B][D]`.
- **Constructive Function:** Executes geometric construction alignments (e.g., Huzita–Justin axioms) or lowers assembly effort prior to compound operations `[B]`.
- **Distinguishing Characteristics:** Absent as an active hinge in the final folded posture ($\rho_i = 0$) `[A][D]`.
- **Confidence / Sources:** High (`[A][B]`: Ku & Tachi `0` / unused creases $C \setminus C(f)$; standard origami pre-creasing).

### 3.8 `SURFACE_COLOR` — Surface / Color Routing *(Added Category)*
- **Definition:** Crease gadgets whose primary constructive intent is flipping the visible sheet normal ($\vec{n} \to -\vec{n}$) to expose the opposite face/color `[A][B][D]`.
- **Constructive Function:** Routes front/back surface identity independently of macro-silhouette `[A][B]`.
- **Distinguishing Characteristics:** Removing the flip keeps or nearly preserves 3D shape while inverting visible color/surface pattern `[D]`.
- **Confidence / Sources:** High (`[A][B]`: Demaine, Demaine & Mitchell, *color-reversal gadgets* in two-color silhouette/polyhedral wrapping; standard figurative color-change flaps).

---

## 4. Illustrative Examples (Separating Shape, Connection, and Lock)

> **Epistemic Note:** The classifications below are **illustrative examples (`[B][D]`)** used to test role boundaries, **not** experimentally measured ablation results (`[E]`).

| Model | `FORM` (Shape-Creating) | `STRUCT` (Framing/Stiffening) | `CONNECT` (Connection-Creating) | `LOCK` (Connection-Locking) | `PROCEDURAL_REF` / Other |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **1. Dart Paper Airplane (Standard vs. Locked-Keel)** | Centerline valley fold; diagonal nose-narrowing folds; horizontal wing-root mountain folds | Centerline valley + wing-root folds acting jointly as a V/Y-beam fuselage keel | Standard dart: fuselage layers merely abut (no dedicated lock; splays unless held) | Locked variant: folding a small nose/tail tab over the bottom spine or applying a multi-layer *dan-ori* crimp to clamp both keel walls | Wing dihedral trim creases (minor `FORM`) |
| **2. Traditional Boat (*Kamibune* / Newspaper Boat)** | Roof diagonals (hull sides); brim folds (gunwale rim); central mast triangle exposed after inversion | Inverted hull curvature + rolled gunwale rim giving hoop stiffness | Lower brim bands folded onto side walls; corner tabs folded around edges to bridge front & back layers | Wrapping the outer corner tips around the rim collar *before* turning the hull inside-out creates a wrapped edge collar at bow/stern seams | Midline/quarter alignment creases (`PROCEDURAL_REF`) |
| **3. Candy-Wrapper / Packet-End Closure** | Longitudinal seam/tube folds forming the container body | — (or end-seam flange stiffness) | Flattening the open end and folding it over once or twice brings opposing walls into contact (springs back if released) | Corner fold + tuck into transverse pleat pocket, tight multi-layer *dan-ori* Z-crimp, or helical twist-pinch | — |
| **4. Traditional *Masu* Box (+ Locking-Lid Variant)** | Four base-square creases and four vertical wall creases | Four diagonal corner miter gussets folded flat inside walls (maintaining $90^\circ$ corners) | Four upper rim panels folded $180^\circ$ over wall tops into the box interior | Rim flap tips wedging onto the box floor, trapping corner miters against outward collapse *(Lid variant: shouldered front tongue in wall slit)* | Diagonal center reference creases (`PROCEDURAL_REF`); double-side color contrast if bicolor (`SURFACE_COLOR`) |
| **5. Modular *Sonobe* Polyhedron** | Diagonal mountain/valley creases shaping each unit's 3D pyramidal facet | Facet triangular ridges stiffening each module shell | Sliding one unit's triangular tab into an adjacent unit's pocket (slides back out if isolated) | **Emergent cycle:** closing 3 units around a vertex creates non-parallel insertion axes preventing rigid withdrawal | Central reference crease (`PROCEDURAL_REF`) |
| **6. Cyclic Envelope / *Tato* Closure** | Base polygon creases defining pouch perimeter | — | Folding $N=4$ corner flaps sequentially inward over the center (lifts freely if not tucked) | Tucking Flap 4 beneath Flap 1 converts an acyclic stack into a cyclic overlap ($F_1 \prec F_2 \prec F_3 \prec F_4 \prec F_1$) | Pre-crease grid (`PROCEDURAL_REF`) |
