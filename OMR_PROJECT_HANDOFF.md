# OMR — Project Handoff and Continuity Guide
## Master Context Document for Incoming AI Agents and Independent Engineers
**Document Version:** 1.0.0  
**Project:** Origami Mathematical Reasoning (OMR)  
**Project Owner:** Andrey Artsybashev  
**Baseline Release:** `v0.1.0-alpha` (Contract 02 v2 · Phase 2.2 Hardened)  
**Current Phase:** Phase 3.1 Closure $\to$ Phase 3.2 Readiness  
**Target Audience:** Any new AI model (Claude, GPT, Gemini, DeepSeek, Local LLM) or human engineer resuming development without access to prior conversation history.

---

## 1. Project Identity and Prime Objective

**Origami Mathematical Reasoning (OMR)** is an open, certifying, axiomatic mathematical engine designed to represent 2D origami geometry, deterministic crease transformations, and independent Zero-Trust verification.

### What OMR Is:
- A high-integrity, certifying mathematical core implemented in TypeScript (`src/core/*`).
- An implementation of the **Certifying Algorithms paradigm** (Mehlhorn et al.): operations produce a witness ($W$), and an independent verifier ($L7$) checks the witness without trusting the generator ($L2$).
- A reproducible, append-only, immutable transformation ledger (**`TRACE`**).

### What OMR Is NOT:
- **Not a finished origami application or CAD software.**
- **Not a 3D kinematics or physics engine.** (No sheet thickness, no bending resistance, no 3D space curves).
- **Not a general-purpose origami solver.** (The 7 Huzita-Justin folding axioms are not yet automatically solved).
- **Not a conversational chatbot or UI dashboard.** (The React UI is solely an interactive verification test bench).

---

## 2. Core Architectural Principles (Inviolable Rules)

Every incoming engineer or AI agent MUST memorize and uphold these five cardinal rules:

1. **Producer Claim $\ne$ Receiver Truth**:
   The generator ($L2$) produces a resulting state and an optional set of claimed diagnostic residuals (`witness.claimedResiduals`). The verifier ($L7$) **completely ignores** all claimed residuals and recalculates every metric, axiom, and invariant from raw coordinates.
2. **Execution Success $\ne$ Verification Success**:
   Just because $L2$ executed an operation without crashing does not mean the mathematics are valid. An operation is only valid if $L7$ independently issues a `PASS` verdict.
3. **Zero Rounding in Geometric States**:
   Coordinates in `GeometryState` are exact IEEE-754 double-precision floats (`f64`). Any use of `.toFixed()`, manual truncation, or coordinate rounding inside the geometric engine is **strictly forbidden**. Precision tolerances belong strictly to the receiving verifier ($L7$).
4. **Authoritative Request Binding (`requestBound`)**:
   An operation is never verified in a vacuum. It is verified against a trusted, frozen `OperationRequest` created outside $L2$. If an adversarial generator reflects geometry across Axis B while claiming Axis A, $L7$ detects the mismatch and issues a `FAIL` verdict.
5. **Absolute Immutability**:
   All states, requests, witnesses, and trace entries are deeply frozen via `deepFreeze` (`Object.freeze`). Mutation of existing state objects is prohibited.

---

## 3. Current Implementation Status (`v0.1.0-alpha`)

### 3.1 What is Implemented in Code (`src/core/*`)
- **`src/core/types.ts`**: Pure TypeScript type contracts (Contract 02 v2). Zero runtime computations.
- **`src/core/operationRequest.ts`**:
  - `createOperationRequest(input)`: Validates disjoint vertex partitions ($V_{mov} \cap V_{fix} = \emptyset$, $V_{mov} \cup V_{fix} = V$), binds to `sourceStateId@version`, and deeply freezes the request.
- **`src/core/l2GeometryEngine.ts`**:
  - Single supported operation: **`REFLECTION_ACROSS_LINE`**.
  - Formula: Affine normal projection $p' = p - 2 \cdot \frac{n \cdot p - c}{\|n\|^2} \cdot n$.
  - Inputs: Normal line parameters $n_x x + n_y y = c$, `movingVertexIds`, `fixedVertexIds`.
  - Outputs: `resultingState`, `witness: ReflectionWitness`, `traceEntry: TraceEntry`.
- **`src/core/l7IndependentVerifier.ts`**:
  - Zero runtime imports from $L2$ or $TRACE$ (pure algorithmic isolation).
  - Four verification stages:
    - *Stage A*: Input admissibility (finite floats, $\|n\| > \varepsilon_{zero}$).
    - *Stage B*: 3-way binding (`request <-> claim <-> witness <-> states`).
    - *Stage C*: Reflection axioms ($r_{mid} \le \varepsilon$, $r_{\perp} \le \varepsilon$).
    - *Stage D*: Scope-aware metric invariants (edge lengths, Shoelace area, orientation inversion).
  - Verdicts: `'PASS' | 'FAIL' | 'UNDETERMINED'`.
- **`src/core/trace.ts`**: Append-only transition ledger enforcing monotonic integer `stepIndex`.

### 3.2 Test Baseline (`tests/*`)
- **`tests/contract02.test.ts`**: 19 tests verifying Contract 02 v2, negative controls, and $L7$ isolation.
- **`tests/metamorphic.test.ts`**: 17 tests verifying algebraic properties:
  - *Property A*: Involution ($R_L(R_L(P)) = P$).
  - *Property B*: Scale invariance of line coefficients ($R_{(\alpha n, \alpha c)} = R_{(n, c)}$).
  - *Property C*: Translation equivariance ($T_v(R_L(P)) = R_{T_v(L)}(T_v(P))$).
  - *Property D*: Distance invariance (internal isometry).
  - *Property E*: Fixed points on axis.
  - *Property F1–F3*: Oriented area conservation and sign inversion.
- **Test execution**: `npm test` runs all 36 tests via Node.js native test runner (`tsx --test`).

---

## 4. Phase History and Key Discoveries

| Phase | Core Focus | Key Discoveries & Milestones |
| :--- | :--- | :--- |
| **Phase 1** | Conceptual Foundation | Established 7-layer architecture ($L1$ Topology to $L7$ Verification). |
| **Phase 2.1** | Prototype Implementation | Built Contract 02 v2, $L2$ 2D reflection engine, and $L7$ independent verifier. |
| **Phase 2.2** | Trusted Request Binding | Introduced `OperationRequest` to prevent coordinated claim/witness substitution. |
| **Phase 2.3** | Metamorphic Testing | Implemented Properties A–F; established `ROD-03` to govern extended test layer. |
| **Phase 2.4** | Numerical Hardening Research | **Falsification of standard Shoelace under large coordinates (D-1)**. Discovered that at $x = 10^7$, uncentered Shoelace loses 14 digits. Evaluated Candidate B (centered coordinates). |
| **Phase 2.5** | Domain Experimentation | Proved that on standard origami paper ($200 \times 200$ mm), IEEE-754 binary64 provides sub-atomic accuracy ($10^{-13}$ mm). Identified multi-step cumulative drift. |
| **Phase 2.6** | Documentation Audit | Harmonized all Phase 2 documentation; established strict documentation hierarchy. |
| **Phase 3.0** | Agent Integration Layer (AIL) | Architected the Agent Integration Layer, adapter boundaries, and security model. |
| **Phase 3.1** | Minimal Entry Contract | Designed Minimal Agent Entry Contract (MAEC), Zero-Hallucination capability discovery, canonical diagonal fold example, and implementation boundaries. |

---

## 5. Catalog of Known Defects and Numerical Limits (`D-1` — `D-8`)

Do NOT attempt to "fix" these in existing files without explicit authorization:

- **`D-1` (Uncentered Shoelace Area Cancellation)**:
  `computeSignedArea` in `l7IndependentVerifier.ts:81-90` calculates area from origin $(0,0)$. Rigidly translating geometry to $x > 10^6$ causes loss of precision. *Mitigation*: Keep coordinates in $[-10\,000, 10\,000]$ mm.
- **`D-2` (Absolute Area Degeneracy Threshold)**:
  `degenerateAreaEpsilon = 1e-12` in `l7IndependentVerifier.ts:50` is absolute. Micro-triangles smaller than $10^{-12} \text{ mm}^2$ are misclassified as degenerate.
- **`D-3` (Normal Vector Normalization Overflow)**:
  In `l2GeometryEngine.ts:75-87`, when $\|n\| > 10^{154}$, `normSq` overflows to `Infinity` and is mistakenly classified as `DEGENERATE_NORMAL`.
- **`D-4` (Fallback Coupling in Tolerances)**:
  `l7IndependentVerifier.ts:59` silently sets `areaEpsilon = epsilon` if `areaEpsilon` is not explicitly passed.
- **`D-5` (Vacuous Orientation PASS)**:
  In folds with zero purely moving faces (all fixed or mixed), `orientationInverted` defaults to `true`.
- **`D-6` (Historical Assets Inconsistency)**:
  `public/assets/aistudio/` contains 17 historical reference files preserved under `ROD-02`.
- **`D-7` (Result-Only Multi-Step Permissiveness)**:
  Single-step verification does not detect cumulative drift over 50+ sequential folds. Requires `verifyProcess`.
- **`D-8` (Bundle Size Discrepancy — UNRESOLVED)**:
  Vite bundle size varies between environments (`562 kB` in AI Studio vs `335 kB` in external Claude).

---

## 6. Reserved Owner Decisions (Strictly Enforced)

Incoming engineers/agents must respect these reserved decisions:

1. **`ROD-03` / `OD-02`: Property F Extended Test Layer**:
   - Status: **`WAITING FOR EXPLICIT OWNER AUTHORIZATION`**.
   - Do NOT create `tests/propertyF_v1.test.ts` (15 mutations, 6-level classifier).
2. **`OD-01`: Transport Protocol Selection**:
   - Deciding whether Phase 3.2 exposes MCP, REST, CLI, or pure TypeScript library.
3. **`OD-03`: Candidate B Numerical Hardening**:
   - Updating `l7IndependentVerifier.ts` with centered Shoelace is deferred to Phase 3.4.
4. **`OD-04`: Huzita-Justin Axioms Solver Scope**:
   - Automated point-line solver is deferred to Phase 4.

---

## 7. Prohibited Assumptions for New Agents

When continuing work on OMR, you MUST NOT:
- **Assume a REST API or MCP server already exists**: No network endpoints currently run on port 3000 (port 3000 is Vite).
- **Assume a single entry function exists**: There is currently no `omr.execute()` in `src/core/`.
- **Assume OMR does 3D folding**: OMR Core is strictly 2D planar geometry.
- **Assume faces auto-subdivide along crease lines**: Creases and faces must be pre-subdivided in the input `GeometryState`.
- **Assume you can modify `src/core/*`**: The core is frozen for documentation and adapter tasks.

---

## 8. Exact Steps to Reproduce the Existing System

To verify that the system is fully operational in your environment:

```bash
# 1. Install dependencies exactly as locked
npm ci

# 2. Run all 36 certifying and metamorphic tests
npm test
# Expected: 36 tests pass, 0 fail

# 3. Verify TypeScript type checking
npm run lint
# Expected: 0 errors (strict mode enabled)

# 4. Verify web verification workbench build
npm run build
# Expected: dist/ generated successfully
```

---

## 9. Recommended Next Engineering Phase: Phase 3.2

When the project owner authorizes Phase 3.2, implement the **Minimal Local Entry Adapter**:

1. **Path**: Create files exclusively under `src/entry/` (do not touch `src/core/`).
2. **Components**:
   - `src/entry/types.ts`: Define `MinimalAgentRequest` and `MinimalAgentResponse`.
   - `src/entry/capabilityDiscovery.ts`: Implement `getAgentCapabilityManifest()`.
   - `src/entry/validation.ts`: Implement strict JSON float checking (rejecting `NaN`, `Infinity`, `null`) and partition checks.
   - `src/entry/agentEntry.ts`: Implement `submitAgentOperation(rawRequest: unknown)` facade.
3. **Testing**:
   - Create `tests/agentEntry.test.ts` to test the facade and negative controls.
4. **Verification**: Confirm all 36 core tests remain untouched and passing.
