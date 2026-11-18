# Locking and Retention Mechanism Catalogue (`LOCK_MECHANISMS.md`)

> **Status:** `PROPOSED` / `HYPOTHESIS` (Preliminary Catalogue — Requires Analytical Derivation & Experimental Verification)  
> **Critical Rule:** **Insertion $\ne$ Locking.** A `CONNECT` mechanism is **not** automatically a `LOCK` mechanism. A mechanism qualifies as a lock only when resistance to release is established under explicitly stated geometric, kinematic, or physical assumptions.

---

## 1. Taxonomy of Retention Physics

Before classifying mechanisms, retention must be decomposed into **five non-equivalent retention drivers** (frequently combined in real paper structures):

| Retention Driver | Ideal Zero-Thickness Rigid Model ($t=0, \mu_s=0$) | Physical Reality ($t>0, \mu_s>0, K_\theta>0$) | Relevant `PWRP v1.1` Routing Hints `[PROPOSED]` |
| :--- | :--- | :--- | :--- |
| **Geometric Blocking** | Direct boundary collision prevents withdrawal in at least some directions (e.g., pocket walls block normal lift; undercut blocks withdrawal). | Remains valid; strength bounded by material yield/tear (`PWRP-01`) and local buckling (`PWRP-12`). | `PWRP-01`, `PWRP-03`, `PWRP-12` |
| **Kinematic Blocking** | No continuous rigid-panel path $\gamma(t)$ exists to the unfolded state without facet self-intersection (e.g., hypothesized closed-sink trap; multi-axis cycle under rigid facets). | Release requires elastic facet bowing or crumpling (`PWRP-06`, `PWRP-12`). | `PWRP-06`, `PWRP-08`, `PWRP-12` |
| **Friction-Dependent Retention** | **Fails completely** when $\mu_s = 0$ (tab slides out freely). | Holds when normal clamping force $F_n$ satisfies $\|F_{\text{pull}}\| \le \mu_s F_n$ (`PWRP-04`). | `PWRP-04`, `PWRP-06`, `PWRP-13` (stress relaxation) |
| **Thickness-Dependent Retention** | **Vanishes** when $t = 0$ (nested bends have zero path-length offset). | Finite thickness $t > 0$ forces arc-length mismatch and normal clamping across multi-layer bends (`PWRP-05`, `PWRP-07`). | `PWRP-05`, `PWRP-07`, `PWRP-04` |
| **Elastic / Bistable Retention** | **Undefined** without non-zero panel flexural stiffness ($K_\theta = 0$). | Energy barrier $\Delta E > 0$ separates resting folded state from open state (`PWRP-06`, `PWRP-12`). | `PWRP-06`, `PWRP-12`, `PWRP-13` (fatigue) |

---

## 2. Eight Preliminary Locking Mechanism Classes

Each class below uses the standardized evaluation template separating documented craft reality (`[B]`) from mechanical interpretation (`[C]`) and unverified theoretical claims (`[E]`).

---

### 2.1 Direct Pocket-and-Flap Insertion (*Straight Tuck / Sashikomi*)
- **Mechanism Description:** A protruding triangular or trapezoidal flap is hinged and slid straight into a pre-formed multi-layer pocket bounded by folded creases `[B]`.
- **Participating Constructive Elements:** Male insertion flap (tab), female pocket cavity ($\ge 2$ stacked layers), tab hinge crease, closed pocket edge creases `[B][D]`.
- **Required Geometric Relations:** Tab insertion axis roughly orthogonal to the unfolding axis of host walls; tab width $\le$ pocket cavity width (`PWRP-03` clearance); sufficient overlap depth $d$ `[C][D]`.
- **Insertion / Assembly Sequence:** Strict: pocket cavity and walls must be folded first, followed by flexing and sliding the tab into the mouth (`PWRP-08`) `[B][C]`.
- **Possible Release Path:** Straight 1D translation back out along the inverse insertion axis `[C]`.
- **Reversibility:** Fully reversible `[B]`.
- **Dependence on Friction:** **Essential along the withdrawal axis.** Without friction ($\mu_s = 0$), pocket walls block normal lifting, **not** axial slide-out `[C]`.
- **Dependence on Finite Thickness:** Moderate—thickness inside a tight pocket provides normal contact pressure $F_n$ (`PWRP-03`/`04`) `[C]`.
- **Dependence on Elastic Deformation:** Needed during insertion (bowing the tab/pocket mouth to enter) and to sustain normal clamping force against pocket walls `[C]`.
- **Evidence Status:** `DOCUMENTED` as construction/joint technique (`MCAR` `POCKET_FLAP`); `HYPOTHESIS` as a self-sufficient lock (acts primarily as `CONNECT` unless friction/elastic pinch resists axial pull) `[B][C]`.
- **Unresolved Questions:** What overlap-depth-to-width ratio and friction coefficient threshold turn straight insertion from a mere `CONNECT` joint into a reliable `LOCK`?

---

### 2.2 Undercut / Hook-Slot Retention (*Shouldered Tab / Ear-Lock*)
- **Mechanism Description:** Similar to 2.1, except the inserted flap features a lateral shoulder, barb, or widened tip whose internal span exceeds the pocket entrance throat (or hooks behind an internal folded lip) `[B]`.
- **Participating Constructive Elements:** Barbed/shouldered tab, constricted pocket entrance throat ($w_{\text{throat}}$), wider internal cavity ($w_{\text{tab}} > w_{\text{throat}}$) `[B][D]`.
- **Required Geometric Relations:** Positive undercut geometry where $w_{\text{tab}} > w_{\text{throat}}$ along the direct withdrawal axis `[C][D]`.
- **Insertion / Assembly Sequence:** Strict: pocket throat formed first; tab temporarily flexed/buckled to pass $w_{\text{throat}}$, then elastically expands inside cavity `[B][C]`.
- **Possible Release Path:** Cannot withdraw rigidly along a straight axis without colliding against the throat edge; release requires intentional elastic bowing/buckling to narrow the tab below $w_{\text{throat}}$ (or widening the slot) `[C]`.
- **Reversibility:** Reversible with deliberate manipulation `[B]`.
- **Dependence on Friction:** **Not required for static end-state blocking** (though friction helps damp rattle and slip) `[C]`.
- **Dependence on Finite Thickness:** Low for end-state geometry; finite thickness and stiffness govern insertion force and throat tear resistance (`PWRP-01`, `PWRP-03`) `[C]`.
- **Dependence on Elastic Deformation:** **Required** during both snap-in insertion and non-destructive release `[C]`.
- **Evidence Status:** `DOCUMENTED` in paperboard/origami box & envelope closures; mechanical undercut model is `[C][PROPOSED]`.
- **Unresolved Questions:** Exact non-rigid elastic admissibility bounds preventing tab creasing/tearing during throat passage (`PWRP-01`, `PWRP-12`).

---

### 2.3 External Wrap Clamp / Cover Fold (*Kabuse-ori* Straddle Wrap)
- **Mechanism Description:** External outer flaps wrap over and around an internal stack of layers (e.g., via an outside reverse fold, *kabuse-ori*, or brim wrap), forming a U-shaped saddle straddling the inner core `[B]`.
- **Participating Constructive Elements:** Outer straddling walls (clamping saddle), wrapped spine/edge crease, sandwiched internal core layers `[B][D]`.
- **Required Geometric Relations:** Outer walls fold $\approx \pm\pi$ around both faces of the internal stack, encapsulating the core on at least three sides `[C][D]`.
- **Insertion / Assembly Sequence:** Moderate to strict: internal layers must be collated before the outer cover wraps over them (`PWRP-08`) `[B]`.
- **Possible Release Path:** Spreading/opening the outer straddling walls and un-inverting the cover crease; or axial slip of inner layers out of the open end `[C]`.
- **Reversibility:** Fully reversible `[B]`.
- **Dependence on Friction:** Lateral splaying of core layers is **geometrically blocked** by the saddle walls; axial slippage along the open side depends on **pinch friction** at the wrapped apex `[C]`.
- **Dependence on Finite Thickness:** High—finite thickness of the inner stack determines pinch compression and outer-wrap offset (`PWRP-05`) `[C]`.
- **Dependence on Elastic Deformation:** Moderate (elastic spring-back of the outer cover can loosen pinch unless plastic crease memory or additional tucks hold the wrap closed) `[C]`.
- **Evidence Status:** `DOCUMENTED` (*kabuse-ori* operation `[B]`); clamping interpretation `[C]` / `[PROPOSED]`.
- **Unresolved Questions:** When does outer-wrap spring-back (`PWRP-06`) overcome apex pinch friction (`PWRP-04`), requiring a secondary tuck to keep the clamp closed?

---

### 2.4 Multi-Layer Crimp / Stepped Retention (*Dan-ori* Through Stacked Layers)
- **Mechanism Description:** Two closely spaced parallel creases of opposite polarity (a stepped pleat / crimp, *dan-ori*) are formed simultaneously through $N \ge 2$ stacked layers `[B]`.
- **Participating Constructive Elements:** $N \ge 2$ stacked sheet layers sharing a staggered Z-jog cross-section separated by step offset $\Delta d$ `[B][D]`.
- **Required Geometric Relations:** Closely spaced parallel creases ($\Delta d$ small relative to facet span) traversing multiple aligned layers `[B][C]`.
- **Insertion / Assembly Sequence:** Strict: layers must be stacked flush before the simultaneous stepped crease is formed (`PWRP-08`) `[B]`.
- **Possible Release Path:** Flattening both opposite bends simultaneously, which requires coordinated relative shear/slip across all $N$ layers `[C]`.
- **Reversibility:** Reversible, leaving persistent plastic crease marks `[B]`.
- **Dependence on Friction:** **Essential.** Friction resists interlayer slip required to unfold nested radii (`PWRP-04`) `[C]`.
- **Dependence on Finite Thickness:** **Critical hypothesis.** In zero-thickness ($t=0$) coplanar layers, a sharp Z-jog introduces no path-length mismatch; at finite thickness ($t>0$), nested bends force inner/outer arc-length differences ($\Delta L \propto t \Delta\rho$), coupling bending to interlayer shear and normal clamping (`PWRP-05`, `PWRP-07`) `[C][E]`.
- **Dependence on Elastic Deformation:** Plastic creasing + residual elastic clamping between layers `[C]`.
- **Evidence Status:** `DOCUMENTED` craft technique (*dan-ori* / crimp `[B]`); capstan/offset locking explanation is an unverified mechanical `HYPOTHESIS` (`[C][E]`) requiring controlled derivation and physical testing.
- **Unresolved Questions:** Under what sheet thickness $t$, layer count $N$, step spacing $\Delta d$, and $\mu_s$ does a multi-layer crimp resist unfolding vs. spring open?

---

### 2.5 Closed Sink Lock (*Closed Shizume-ori* Inversion Trap)
- **Mechanism Description:** A pyramidal corner or polygonal ridge bounded by a closed crease loop is pushed inward (*shizume-ori*) without opening the surrounding outer layers flat (*closed sink*), inverting the interior creases inside-out `[B]`.
- **Participating Constructive Elements:** Inverted interior pyramid/ridge facets, surrounding outer wall facets, closed perimeter crease loop forming a constricted neck `[B][D]`.
- **Required Geometric Relations:** Closed crease ring bounding an inverted subcomplex whose unfolded volume would intersect the surrounding outer walls along rigid rotations `[C][E]`.
- **Insertion / Assembly Sequence:** Strict; typically requires temporary non-rigid flexing of outer facets during assembly `[B]`.
- **Possible Release Path:** Either unfolding the entire outer collar flat enough to clear the ring (if geometrically possible), or forcing elastic buckling/pop-through of the inverted core `[B][C]`.
- **Reversibility:** Reversible only via deliberate manipulation/deformation; often difficult `[B]`.
- **Dependence on Friction:** Low to none if a rigid kinematic obstacle blocks unfolding `[C][E]`.
- **Dependence on Finite Thickness:** Low for the topological/kinematic obstruction itself; high thickness increases resistance to elastic pop-through (`PWRP-01`, `PWRP-03`) `[C]`.
- **Dependence on Elastic Deformation:** Elastic buckling is required to enter (and often to exit) if rigid configuration space is disconnected `[C][E]`.
- **Evidence Status:** `DOCUMENTED` maneuver (`shizume-ori` `[B]`); claiming *every* closed sink creates disconnected rigid configuration space components is currently an **`UNVERIFIED` mathematical hypothesis (`[E]`)**—it depends on vertex star geometry, outer collar freedom, and facet proportions.
- **Unresolved Questions:** Which exact crease-ring geometries guarantee a proven kinematic obstruction (disconnected rigid configuration space) vs. merely high elastic resistance?

---

### 2.6 Cyclic Overlapping Flaps (*Iris / Pinwheel Overlap*)
- **Mechanism Description:** $N \ge 3$ boundary flaps around a polygonal rim are folded sequentially inward so flap $k$ lies atop flap $k+1$, and flap $N$ is tucked beneath flap $1$ `[B]`.
- **Participating Constructive Elements:** Cyclic sequence of $N$ flaps, their non-parallel base hinges, and the overlap interface between flap $N$ and flap $1$ `[B][D]`.
- **Required Geometric Relations:** Intransitive cyclic local stacking order ($F_1 \prec F_2 \prec \dots \prec F_N \prec F_1$) combined with non-parallel hinge axes so flaps cannot rotate upward rigidly as one piece `[A][C]`.
- **Insertion / Assembly Sequence:** Strict cyclic sequence ($1 \to 2 \to \dots \to N$, flexing flap $N$ beneath flap $1$) `[B]`.
- **Possible Release Path:** Elastic bending of flap $N$ to extract its tip from beneath flap $1$, breaking the cycle `[B][C]`.
- **Reversibility:** Fully reversible `[B]`.
- **Dependence on Friction:** Friction stabilizes small perturbations, **but** cyclic stacking + non-parallel hinges create genuine **layer-order / geometric collision blocking** against pure rigid unfolding once seated `[A][C]`.
- **Dependence on Finite Thickness:** Low for blocking principle; high thickness increases tension at overlap crossings (`PWRP-03`, `PWRP-05`) `[C]`.
- **Dependence on Elastic Deformation:** Needed to weave flap $N$ under flap $1$ and to release it `[C]`.
- **Evidence Status:** `DOCUMENTED` closure (*tato*, cyclic box lids `[B]`); rigid-unfolding collision argument is grounded in layer-order geometry (`[A][C]`) but awaits formal proof per polygon geometry.
- **Unresolved Questions:** Minimum overlap area and hinge angle separation required so flaps cannot flex out passively under elastic spring-back.

---

### 2.7 Multi-Axis Modular Cage Lock (*Sonobe-Type Tri-Axial Cycle*)
- **Mechanism Description:** Multiple identical or paired modules connect via individual straight pocket-and-flap insertions (Mechanism 2.1) arranged around a closed polyhedral vertex or face cycle `[B]`.
- **Participating Constructive Elements:** $M \ge 3$ modules (`MCAR` `COMPONENTS`), their pockets and tabs (`INTERFACES`), and closed cycle of joints (`JOINTS` / `ASSEMBLY_TOPOLOGY`) `[B][D]`.
- **Required Geometric Relations:** Individual tab insertion vectors $\{\vec{u}_1, \dots, \vec{u}_M\}$ in a cycle point along non-parallel directions in $\mathbb{R}^3$ such that no single rigid-body translation vector simultaneously withdraws all tabs without colliding with pocket bottoms/sides `[C][E]`.
- **Insertion / Assembly Sequence:** Strict on closing the final module in a cycle (requires temporary elastic flexing of the closing tab) `[B][C]`.
- **Possible Release Path:** Elastically flexing one unit/tab out of its pocket to break the cycle, after which remaining joints slide apart easily `[B][C]`.
- **Reversibility:** Fully reversible `[B]`.
- **Dependence on Friction:** **Crucial open check.** While rigid *global translation* of rigid modules is blocked by non-parallel axes, individual tabs can still rotate, twist, or slide sequentially if modules flex or if friction ($\mu_s$) is zero! Therefore, true **self-locking without friction is NOT yet proven** `[E]`.
- **Dependence on Finite Thickness:** Moderate—pocket clearance vs. tight fit alters clamping pressure (`PWRP-03`, `PWRP-04`) `[C]`.
- **Dependence on Elastic Deformation:** Required both to close the final cycle module and to resist/permit tab pull-out (`PWRP-06`) `[C]`.
- **Evidence Status:** `DOCUMENTED` assembly technique (*Sonobe* polyhedra `[B]`); frictionless self-locking claim is an **`UNVERIFIED HYPOTHESIS` (`[E]`)** requiring formal kinematics/mechanics analysis.
- **Unresolved Questions:** Does a zero-friction rigid-panel 3-unit *Sonobe* vertex cycle remain locked against sequential rotational/sliding disassembly, or does it rely fundamentally on friction + panel bending stiffness?

---

### 2.8 Elastic / Bistable Snap Lock (*Curved-Crease or Over-Center Toggle*)
- **Mechanism Description:** Crease networks with non-zero panel bending (e.g., curved creases, hyperbolic paraboloids, over-constrained/non-developable vertex cells) store elastic strain energy through an intermediate barrier ($0 < t < 1$) before snapping into a stable low-energy resting state at $t = 1$ `[A][B][C]`.
- **Participating Constructive Elements:** Elastically bowed sheet panels and coupled crease hinges `[C][D]`.
- **Required Geometric Relations:** Potential energy landscape $E(\rho)$ possesses two local minima separated by an unstable saddle/peak barrier ($\Delta E > 0$) `[A][C]`.
- **Insertion / Assembly Sequence:** Low sequence dependence (often snaps collectively across the cell) `[B][C]`.
- **Possible Release Path:** Applying external force sufficient to overcome the energy barrier $\Delta E$ back toward the open minimum `[C]`.
- **Reversibility:** Fully reversible (designed as a bistable toggle) `[B][C]`.
- **Dependence on Friction:** Minimal/secondary `[C]`.
- **Dependence on Finite Thickness:** Thickness $t$ enters directly into panel bending stiffness ($D \propto E t^3$) (`PWRP-06`, `PWRP-12`) `[C]`.
- **Dependence on Elastic Deformation:** **100% Essential.** Vanishes identically in zero-stiffness membranes or purely rigid hinge-and-plate models without compliance `[C]`.
- **Evidence Status:** `VERIFIED` / `DOCUMENTED` in discrete-shell and origami-metamaterial mechanics (`[A][C]`: Grinspun et al. non-zero rest-energy bistability; `PWRP-12` multistability).
- **Unresolved Questions:** How to bound fatigue degradation over repeated snap cycles (`PWRP-13`) and distinguish intentional bistable snaps from unwanted buckling (`PWRP-12`).
