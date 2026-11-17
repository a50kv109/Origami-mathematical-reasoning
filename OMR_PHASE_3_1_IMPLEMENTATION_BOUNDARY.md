# OMR Phase 3.1 — Implementation Boundary & Governance Architecture
## Architectural Separation: Core, Entry Adapters, Owner Decisions, and Out-of-Scope
**Document Version:** 1.0.0  
**Phase:** 3.1 (Minimal Agent Entry Contract)  
**Status:** ARCHITECTURAL DESIGN SPECIFICATION (READ-ONLY CORE BASELINE)  
**Core Target:** OMR Core `v0.1.0-alpha` (Contract 02 v2 · Phase 2.2 Hardened Baseline)

---

## 1. Executive Summary & Purpose

The purpose of this document is to establish an unambiguous, inviolable architectural boundary for the Origami Mathematical Reasoning (OMR) system. It prevents feature creep, protects the mathematical rigor of the certifying core, and provides external contributors, AI agents, and independent GitHub auditors with exact boundaries between:

1. **What is Already Implemented in Core (`[IMPLEMENTED]`)**: Verified, production-grade core modules in `src/core/`.
2. **What Requires a New Adapter Layer (`[ADAPTER REQUIRED]`)**: Proposed non-invasive entry layer in `src/entry/`.
3. **What Requires Explicit Owner Authorization (`[OWNER DECISION REQUIRED]`)**: Critical architectural crossroads and reserved decisions (including `ROD-03`).
4. **What is Strictly Out of Scope (`[OUT OF SCOPE]`)**: Physics, 3D kinematics, and non-linear folds.
5. **Blueprint for GitHub Getting Started Guide**: Clean onboarding standard for external researchers and autonomous agents.

---

## 2. Four-Part Implementation Boundary Matrix

```
┌───────────────────────────────────────────────────────────────────────────────┐
│ PART 1: IMPLEMENTED IN CORE [src/core/*]                                       │
│ - Contract 02 v2 Data Types (types.ts)                                        │
│ - Trusted Request Factory & Partition Checker (operationRequest.ts)           │
│ - Certifying Deterministic 2D Affine Engine (l2GeometryEngine.ts)             │
│ - Axiomatic Zero-Trust Verifier: Result & Process (l7IndependentVerifier.ts)  │
│ - Deep-Freeze Immutability & Continuous TRACE Ledger (trace.ts)               │
└──────────────────────────────────────┬────────────────────────────────────────┘
                                       │ (Zero-mutation dependency boundary)
                                       ▼
┌───────────────────────────────────────────────────────────────────────────────┐
│ PART 2: REQUIRED ENTRY ADAPTER LAYER [src/entry/*] (PROPOSED)                 │
│ - Single Entry Facade: submitAgentOperation()                                 │
│ - Dynamic Capability Discovery: getAgentCapabilityManifest()                  │
│ - Zero-Hallucination Rejection of Unsupported Operations                      │
│ - Strict IEEE-754 Finite Float & JSON De-serialization Guard                  │
│ - Transport Bindings (MCP / REST / CLI / TypeScript Library)                   │
└──────────────────────────────────────┬────────────────────────────────────────┘
                                       │ (Awaiting owner sign-off)
                                       ▼
┌───────────────────────────────────────────────────────────────────────────────┐
│ PART 3: DECISIONS REQUIRING OWNER AUTHORIZATION                               │
│ - Primary Protocol Selection (MCP vs CLI vs REST)                             │
│ - ROD-03 Unfreezing: Metamorphic Property F Test Creation                     │
│ - Phase 2.4 Hardening Adoption: Candidate B (Centered Shoelace)               │
│ - Geometric Scope: Huzita-Justin Axioms 1-7 Algebraic Solver Integration      │
└──────────────────────────────────────┬────────────────────────────────────────┘
                                       │ (Explicitly excluded)
                                       ▼
┌───────────────────────────────────────────────────────────────────────────────┐
│ PART 4: OUT OF SCOPE                                                          │
│ - 3D Dihedral Rotations & Non-Planar Space Curves (Fold 3D)                   │
│ - Curved Creases (Splines / Non-Euclidean Surfaces)                           │
│ - Physical Mechanics (Paper Thickness, Friction, Stress-Strain, Collision)    │
│ - Natural Language Chatbot UI / Telemetry Dashboards                          │
└───────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Part 1: Implemented in Core (`[IMPLEMENTED]`)

The following capabilities are completely implemented, covered by 36 unit/metamorphic test suites, and audited:

| Module | Exact File Path | Exported Capabilities | Invariants Enforced |
| :--- | :--- | :--- | :--- |
| **Contract 02 v2 Types** | `src/core/types.ts` | `GeometryState`, `Vertex2D`, `Edge2D`, `Face2D`, `LineNormalParams`, `ReflectionParameters`, `OperationRequest`, `ReflectionWitness`, `TraceEntry`, `VerifierTolerances`, `VerificationClaim`, `VerificationVerdict`, `VerificationStatus` | Zero runtime computations; pure structural typing. |
| **Operation Request** | `src/core/operationRequest.ts` | `createOperationRequest()`, `OperationRequestError` | Disjoint vertex partitioning ($V_{mov} \cap V_{fix} = \emptyset$); strict source-state binding (`sourceStateId@vX`); defensive `deepFreeze`. |
| **L2 Geometry Engine** | `src/core/l2GeometryEngine.ts` | `reflectAcrossLine()`, `createInitialGeometryState()`, `L2EngineError` | Affine normal projection $p' = p - 2\frac{n\cdot p - c}{\|n\|^2}n$; exact IEEE-754 coordinates without rounding; ID preservation; witness emission. |
| **L7 Independent Verifier** | `src/core/l7IndependentVerifier.ts` | `verifyResult()`, `verifyProcess()`, `DEFAULT_VERIFIER_TOLERANCES` | Zero runtime geometry helper imports; independent Shoelace area; independent collinearity; scale-normalized reflection axioms; orientation inversion check; 3-way request-claim-witness binding. |
| **TRACE Ledger** | `src/core/trace.ts` | `createTraceEntry()`, `appendTraceEntry()`, `cloneGeometryState()`, `deepFreeze()` | Cryptographically consistent, immutable, monotonic step index sequence. |

### Architectural Invariant:
**The files in `src/core/*` are FROZEN.** Under no circumstances may an entry adapter modify, monkey-patch, or extend the internal behavior of these core files without a dedicated core release.

---

## 4. Part 2: Required Entry Adapter Layer (`[ADAPTER REQUIRED]`)

Currently, an external caller must manually orchestrate:
1. `createOperationRequest(input)`
2. `reflectAcrossLine(input)`
3. Construct `VerificationClaim` object
4. `verifyResult(claim, request)`

This orchestration places an unacceptable burden of internal architectural knowledge on external agents. The proposed Entry Adapter Layer provides a clean facade:

### Proposed Module Architecture (`src/entry/`):

1. **`src/entry/types.ts`**:
   - `MinimalAgentRequest`, `MinimalAgentResponse`, `AgentCapabilityManifest`.
   - Error code enumeration: `UNSUPPORTED_OPERATION`, `SCHEMA_VALIDATION_ERROR`, `CORE_ENGINE_ERROR`, `VERIFICATION_FAILED`.
2. **`src/entry/capabilityDiscovery.ts`**:
   - Implements `getAgentCapabilityManifest()`.
   - Declares supported operations (`REFLECTION_ACROSS_LINE`) and negative boundaries (`FOLD_3D`, `FACE_SUBDIVISION`, etc.).
3. **`src/entry/validation.ts`**:
   - Validates JSON input before core handoff.
   - **Float Guard**: Detects `NaN`, `Infinity`, or string-encoded numbers. Converts and validates JSON strict adherence.
   - **Partition Guard**: Ensures all vertices in `sourceState` are accounted for in moving or fixed arrays.
4. **`src/entry/agentEntry.ts`**:
   - Single programmatic entry point:
     ```typescript
     export async function submitAgentOperation(
       request: unknown
     ): Promise<MinimalAgentResponse>;
     ```
   - Automatically coordinates validation, `createOperationRequest`, `l2GeometryEngine.reflectAcrossLine`, claim creation, and `l7IndependentVerifier.verifyResult`.

---

## 5. Part 3: Decisions Requiring Explicit Owner Authorization (`[OWNER DECISION REQUIRED]`)

The following architectural and testing items are deliberately deferred and require explicit sign-off from the project owner before implementation:

### 5.1 Protocol Transport Selection (Decision OD-01)
* **Question**: How should external AI agents connect to OMR?
* **Options**:
  1. *Option A (Model Context Protocol / MCP)*: Native tools for Claude Desktop, Gemini CLI, Cursor, and Windsurf.
  2. *Option B (Lightweight REST / Fastify API)*: Language-agnostic HTTP/JSON endpoint on `port 3000`.
  3. *Option C (TypeScript / Node CLI)*: Zero-network standard input/output (`cat fold.json | omr-fold`).
  4. *Option D (Headless npm Library)*: Core export consumed via direct ES module import.
* **Status**: Awaiting Owner Decision. Recommended default: Dual export (TypeScript library + optional MCP server).

### 5.2 Reserved Operational Decision ROD-03: Property F Test Creation (Decision OD-02)
* **Question**: Should the deferred metamorphic test `tests/propertyF_v1.test.ts` be created and executed?
* **Context**: `ROD-03` was established during Phase 2.2 to prevent uncoordinated test creation from masking verification tolerances.
* **Status**: **`WAITING FOR EXPLICIT OWNER AUTHORIZATION`**. No test file may be written until the owner grants approval.

### 5.3 Numerical Hardening Kernel Upgrade (Decision OD-03)
* **Question**: Should OMR Core upgrade its Shoelace area formula to Candidate B (Centered Local Coordinates + Kahan-Babuška compensated summation)?
* **Context**: Audited Phase 2.4/2.6 findings confirmed that under large rigid translations ($x = 10^7$ mm), standard Shoelace loses 14 digits of precision, whereas Candidate B maintains 16 digits of precision.
* **Status**: Awaiting Owner Decision for Phase 3.4.

### 5.4 Huzita-Justin Axioms 1–7 General Solver (Decision OD-04)
* **Question**: Should OMR implement an algebraic point-line solver for all 7 Huzita-Justin origami axioms?
* **Context**: Currently, L2 expects the normal line equation $(n_x, n_y, c)$ to be pre-calculated by the caller. Implementing Axioms 1–7 requires an algebraic solver for cubic/quadratic intersections.
* **Status**: Awaiting Owner Decision for Phase 4 roadmap.

---

## 6. Part 4: Strictly Out of Scope (`[OUT OF SCOPE]`)

To maintain mathematical certainty and verifiable invariants, the following features are strictly prohibited from the OMR v0.x roadmap:

1. **3D Non-Planar Dihedral Kinematics (`FOLD_3D`)**:
   - Origami folded in 3D requires non-linear rotational dynamics, rigid body kinematics, and non-Euclidean space curves.
   - *Policy*: OMR remains strictly a certifying 2D planar system in v0.x.
2. **Curved Creases / Spline Surfaces (`CURVED_CREASE`)**:
   - Folds along non-straight lines produce developable surfaces with non-zero Gaussian curvature across facet boundaries.
   - *Policy*: All creases must be linear segments ($n_x \cdot x + n_y \cdot y = c$).
3. **Physical Paper Simulation**:
   - Zero-thickness model is strictly enforced. Physical material properties (bending stiffness, friction, multi-layer sheet thickness, plastic deformation, stress-strain tensors) are out of scope.
4. **Chatbots, Telemetry, and Floating AI Assistants**:
   - In accordance with the AI Studio Constitution and OMR Epistemic Integrity rules, OMR contains zero telemetry, zero system log panels, and zero conversational chatbot fluff. It is an uncompromised mathematical reasoning engine.

---

## 7. Blueprint: GitHub "Getting Started for Agents and Auditors"

When the OMR repository is published or inspected by external researchers on GitHub, the following guide in `README.md` governs onboarding:

```markdown
# Getting Started for External Agents and Independent Auditors

OMR (Origami Mathematical Reasoning) is an axiomatic, certifying geometric engine
for verifying planar origami folding operations.

## 1. Quick Verification (Auditor Workflow)
To independently verify the mathematical core:

```bash
# Clone and enter workspace
git clone https://github.com/origami-omr/omr-core.git
cd omr-core

# Install exact dependencies
npm ci

# Run all 36 certifying and metamorphic test suites
npm test
```
Expected output: 36 tests passing (19 contract02 v2 certifying + 17 metamorphic).

## 2. Querying Engine Capabilities (Agent Workflow)
Before submitting an operation, query the capability manifest:

```typescript
import { getAgentCapabilityManifest } from './src/entry/capabilityDiscovery';

const capabilities = getAgentCapabilityManifest();
console.log(capabilities.supportedOperations);
// Outputs: ['REFLECTION_ACROSS_LINE']
```

## 3. Submitting a Certified Fold
```typescript
import { submitAgentOperation } from './src/entry/agentEntry';

const response = await submitAgentOperation({
  protocolVersion: "omr.ail.v0.1.0",
  clientRequestId: "researcher-run-01",
  operation: "REFLECTION_ACROSS_LINE",
  sourceState: mySquareState,
  parameters: {
    line: { nx: 1, ny: 1, c: 100 },
    movingVertexIds: ["V2"],
    fixedVertexIds: ["V0", "V1", "V3"]
  }
});

console.log(response.status); // "SUCCESS"
console.log(response.verificationVerdict.status); // "PASS"
```
```

---

## 8. Summary of Architectural Guarantees

1. **Isolation**: L7 verifier remains completely isolated from L2 solver logic.
2. **Immutability**: Every state, request, witness, and trace entry is deeply frozen.
3. **Zero-Trust**: L7 ignores claims from L2 and recomputes all metric invariants independently.
4. **Predictability**: Unsupported operations fail fast at the boundary with actionable diagnostics.
