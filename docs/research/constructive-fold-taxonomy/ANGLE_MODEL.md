# Functional Angle Classification Model (`ANGLE_MODEL.md`)

> **Status:** `PROPOSED` (Research Model — Non-Canonical)  
> **Critical Constraint:** Geometric angle primitives (`[A]`) and functional angle roles (`[D]`) are **different classification dimensions**. Sector angles and dihedral angles are **not interchangeable**. No unsupported universal numerical angle thresholds are introduced.

---

## 1. Separation of Three Distinct Geometric Angle Primitives `[A]`

In origami geometry, three distinct mathematical objects are routinely conflated under the single word "angle":

| Geometric Angle Primitive | Domain & Definition | Behavior Under Isometric Folding | Primary Mathematical Constraints |
| :--- | :--- | :--- | :--- |
| **1. Sector Angle ($\theta_{i,i+1}$)** | Planar angle in the flat sheet $M \subset \mathbb{R}^2$ between two adjacent crease rays $e_i, e_{i+1}$ incident to a vertex $v$. | **Invariant** during isometric folding (fixed once crease pattern is cut/drawn). | Sets Gaussian curvature angular defect ($\Delta\theta = 2\pi - \sum \theta_k$), flat-foldability (Kawasaki–Justin: alternating sum $= 0$), and rigid vertex speed coefficients. |
| **2. Dihedral Fold Angle ($\rho_i \in [-\pi,\pi]$)** | Signed extrinsic rotation angle between the surface normals of two adjacent facets sharing crease $e_i$ ($\rho=0$ flat, $>0$ valley, $<0$ mountain, $\pm\pi$ flat-folded). | **Dynamic variable** changing along folding path $t \in [0,1]$ ($0 \to \rho_{\text{target}}$). | Coupled around interior vertices by spherical rotational closure $\prod_i R_{c_i}(\rho_i) = I$; drives V-beam cross-sectional stiffness and clamping pinch. |
| **3. Spatial / Inter-Surface Angle ($\phi_{A,B}$)** | 3D angle in $\mathbb{R}^3$ between **non-adjacent** panels, flanges, structural walls, pocket throats, or tab insertion axes. | **Derived / Emergent** from a chain of $\theta$ and $\rho$ across intervening facets. | Governs wing dihedral, box-wall orthogonality ($90^\circ$), pocket insertion alignment, and multi-axis cage interference. |

---

## 2. Six Proposed Functional Angle Roles `[D]`

> **Notice:** These six functional classes are **proposed descriptive engineering roles**, **not** six independent mathematical theorems or disjoint partitions. A single geometric angle (e.g., $\rho_i$ on a V-beam keel) can be both *structural* and *shape-defining*.

### Functional Angle Matrix (Answering All Six Analytical Questions)

| Proposed Functional Angle Role | Underlying Geometric Object(s) | 1. Determines Final Shape? | 2. Controls a DOF? | 3. Participates in Locking? | 4. Changes During Folding? | 5. Independent or Constrained? | 6. Structural Consequence of Altering Value |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **1. Shape-Defining Angles** | Facet sector angles $\theta_{i,i+1}$ of visible panels; target dihedral angles $\rho_i$ on exterior edges. | **Yes** (directly determines facet geometry and 3D polyhedral corners). | **Indirectly** (sets kinematic boundary posture). | **No** (not by itself). | $\theta$: **No**.<br>$\rho$: **Yes** ($0 \to \rho_{\text{target}}$). | Constrained by Gaussian angular defect and global polyhedral closure. | Distorts silhouette, breaks facet closure, or violates flat-foldability. |
| **2. Structural Angles** | Dihedral angles $\rho_i$ of stiffening ribs, keels, gussets; spatial angles $\phi$ between load-bearing walls. | **Partially** (sets structural depth/profile, often internally). | **Often freezes** local bending DOFs once braced. | **Indirectly** (maintains wall pressure/spacing needed by pockets). | $\rho, \phi$: **Yes** during assembly; braced at $f_1$. | Constrained by connected shell compatibility (e.g., miter gussets fixing wall angle). | Flattening a V-beam ($\rho \to 0$) collapses cross-sectional flexural stiffness $K_\theta$ and invites buckling. |
| **3. Connection / Alignment Angles** | Spatial alignment/insertion angle $\phi_{\text{tab,pocket}}$ between mating flanges; seam turn angles. | **No** (seam- or interface-level). | **Guides** mating translation/rotation DOF. | **Prerequisite** (aligns engagement, does not itself lock). | $\phi$: **Yes** (converges toward alignment upon seating). | Constrained by seam geometry, pocket depth, and finite thickness $t$. | Misalignment prevents tab entry, creates seam gaps, or causes layer collision (`PWRP-03`). |
| **4. Locking / Retention Angles** | Undercut shoulder angle $\theta_{\text{hook}}$ (sector); over-center snap dihedral $\rho_{\text{lock}}$; wedge/taper angle $\alpha_w$; inter-axis cage angle $\gamma$. | **No** (typically internal or local to joint). | **Yes** (blocks or constrains release DOF). | **Yes** (primary retention geometry). | $\theta_{\text{hook}}, \gamma$: **No**.<br>$\rho_{\text{lock}}$: **Yes** (passes snap threshold). | Constrained by pocket throat width, wall stiffness, and static friction $\mu_s$ (for wedge/friction locks). | Removing undercut allows rigid withdrawal; wedge angle exceeding friction cone ($\alpha_w > \arctan\mu_s$) causes slip-out (`PWRP-04`). |
| **5. Motion-Controlling Angles** | Vertex sector angles $(\alpha, \beta)$ at degree-4 vertices; driving input dihedral $\rho_{\text{in}}$. | **Only** at deployment endpoints. | **Yes** (directly parameterizes 1-DOF path and transmission ratio). | **Can induce** kinematic singularity blocks (e.g., $\alpha = 90^\circ$ suppressor). | $\alpha, \beta$: **No**.<br>$\rho_{\text{in}}$: **Yes** (independent driver). | Coupled at degree-4 vertices by spherical trigonometry: $\tan(\rho_2/2) = p(\alpha,\beta)\tan(\rho_1/2)$. | Alters transmission speed $p$; at critical sector values (such as $90^\circ$), suppresses orthogonal motion ($p=0$). |
| **6. Resulting / Derived Angles** | Follower dihedral angles $\rho_{\text{out}}$; residual clearance angles $\phi_{\text{res}}$; elastic spring-back equilibrium angles. | **Yes** (defines realized 3D posture). | **No** (dependent slave variable). | **Occasionally** (passive frictional wedging). | **Yes** (driven passively by upstream DOFs and material spring-back). | **Fully constrained** (function of driving angles, sector geometry, and stiffness/friction equilibrium). | Cannot be modified independently without stretching/tearing facets (`PWRP-01`) or changing driving angles. |

---

## 3. Methodological Guardrails

1. **No Universal Numerical Angle Thresholds:** Aside from exact geometric identities (such as $\sum \theta_k = 2\pi$ for Euclidean flatness, alternating sum $\theta_1 - \theta_2 + \dots = 0$ for flat-foldability `[A]`, or the local Coulomb friction-cone criterion $\alpha_w < \arctan\mu_s$ where $\mu_s$ is material-dependent `[C]`), this model introduces **no arbitrary fixed angle cutoffs** (e.g., "a lock must be $30^\circ$"). Effective locking angles depend on thickness, friction, throat geometry, and panel stiffness (`PWRP-01..06`).
2. **Traceability:** Sector angles ($\theta$) belong to the invariant 2D crease geometry; dihedral angles ($\rho$) belong to crease hinge actuation/equilibrium; spatial angles ($\phi$) belong to multi-panel / inter-component 3D relations.
