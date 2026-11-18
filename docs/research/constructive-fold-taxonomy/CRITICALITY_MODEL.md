# Four-Dimensional Constructive Criticality Model (`CRITICALITY_MODEL.md`)

> **Status:** `PROPOSED` / `HYPOTHESIS` (Non-Canonical Research Model)  
> **Restrictions:** The four axes below are **separate analytical dimensions**, **not** proven statistically or logically independent variables. No validated numerical scoring scale or thresholds are claimed without an operational experimental procedure.

---

## 1. Why a Single 1D Significance Hierarchy Fails

Ordering origami folds along a single linear scale (e.g., `Primary > Secondary > Auxiliary`) produces systematic contradictions in real folded structures:
- **Small geometric scale $\ne$ low mechanical necessity:** A small corner tuck or fuselage crimp changes almost zero visible surface area, yet removing it can allow wings or pouch flaps to spring open immediately.
- **Large geometric scale $\ne$ retention capability:** The centerline fold of a dart paper airplane defines the entire macro-symmetry and primary exterior silhouette, yet provides zero retention preventing the keel from splaying apart.
- **Hidden creases $\ne$ expendable creases:** Internal *Masu* box corner miters are mostly concealed inside the finished walls, yet removing them destroys the box's $90^\circ$ corner bracing.

---

## 2. The Four-Dimensional Criticality Profile `<M, S, R, K>`

To decouple visual scale from stiffness, retention, and kinematics, each fold or `ConstructiveUnit` $U$ is evaluated conceptually along four dimensions using the notation **`<M, S, R, K>`**:

| Dimension | Name | What It Evaluates | Conceptual Perturbation / Ablation Test (If $U$ is Removed, Relaxed $\rho \to 0$, or Left Open) | Qualitative Levels *(Non-Numeric Research Labels)* |
| :--- | :--- | :--- | :--- | :--- |
| **`M`** | **Morphological Criticality** | Contribution to visible 3D envelope, facets, and silhouette | Holding other hinges fixed, if $U$ is flattened/removed, how strongly does the exterior silhouette or surface shape change? | `Primary` / `Secondary` / `Null` |
| **`S`** | **Structural / Stiffness Criticality** | Contribution to cross-sectional rigidity, load paths, and buckling resistance | If $U$ is removed or relaxed, does the structure lose bending stiffness (e.g., V-beam flattening) or collapse under handling/gravity? | `LoadBearing` / `Stabilizing` / `Null` |
| **`R`** | **Retention Criticality** | Contribution to holding joined parts or folded posture against spring-back or separation | If $U$ is omitted (with no external glue, tape, or clamps), do joined layers separate or spring open toward $f_0$? | `LockCritical` / `ConnectionOnly` / `Null` |
| **`K`** | **Kinematic Criticality** | Contribution to folding reachability, motion transmission, or bifurcation control | Along continuous motion $F(M,t)$, is $U$ required to fold/deploy, or does it select/suppress a motion branch? | `EssentialHinge` / `ModeSelector` / `Auxiliary` |

---

## 3. Illustrative Profiles (Qualitative Examples — NOT Measured Data)

> **Epistemic Guardrail:** The tuples below (including `<M=0, S=0, R=1, K=0>` shorthand) are **qualitative illustrative examples (`[D]`)**, **not** experimentally measured scores (`[E]`). No normalized `[0,1]` scale is defined or validated yet.

| Illustrative Constructive Element | Qualitative `<M, S, R, K>` Profile | Conceptual Interpretation |
| :--- | :--- | :--- |
| **Locked-keel nose/tail tuck on a dart airplane** | `<Secondary/Low M, Low S, LockCritical R, Auxiliary K>` *(shorthand: `<0, 0, 1, 0>`)* | Tiny change to exterior silhouette and stiffness, minimal role in initial wing folding, yet prevents fuselage layers from splaying open. |
| **Centerline valley + wing-root folds (V-beam) of a dart airplane** | `<Primary M, LoadBearing S, Null R, EssentialHinge K>` | Defines macro shape, supplies beam bending stiffness, is essential to form the fuselage, but does not itself lock the layers closed. |
| ***Masu* box corner miter gussets** | `<Secondary/Hidden M, LoadBearing S, ConnectionOnly/Support R, EssentialHinge K>` | Concealed between inner and outer walls, yet maintains wall orthogonality and corner bracing. |
| **Final tucked flap (Flap 4 under Flap 1) in a cyclic *tato* envelope** | `<Secondary M, Null S, LockCritical R, Auxiliary/Step K>` | Negligible silhouette impact once Flap 4 is already folded down, yet converts an unstable stack into a closed cyclic overlap. |
| **$90^\circ$ sector suppressor / optional crease in a Ku–Tachi gadget** | `<Null M, Null S, Null/Mode-Block R, ModeSelector K>` | May remain completely unfolded ($\rho = 0$) while selectively enabling or blocking an adjacent kinematic branch. |
| **Initial grid-division pinch mark** | `<Null M, Null S, Null R, Auxiliary K>` | Completely unfolded ($\rho = 0$) in target state $f_1$; serves only as a construction reference. |

---

## 4. Open Methodological Constraints

1. **No Uncalibrated Numerical Scoring:** Do not assign continuous numerical weights (e.g., `R = 0.87`) until explicit perturbation protocols and physical/kinematic testbeds are defined (`OPEN_QUESTIONS.md #7`).
2. **Coupling Between Dimensions:** `M`, `S`, `R`, and `K` are **not claimed to be orthogonal or statistically independent** across all models (e.g., flattening a V-beam keel lowers `S` precisely by changing its shape `M`, and opening a *Masu* rim flap affects `M`, `R`, and corner clamping `S` together).
3. **Need for Benchmark Testing:** The `<M, S, R, K>` model must be tested through controlled ablation studies on real benchmark crease patterns (*Dart Airplane*, *Kamibune Boat*, *Masu Box*, *Sonobe Octahedron*, *Miura-ori*) before considering any canonical adoption.
