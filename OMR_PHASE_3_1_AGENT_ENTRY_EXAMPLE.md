# OMR Phase 3.1 — End-to-End Agent Entry Reference Example
## Concrete Walkthrough: Diagonal Reflection of a 100mm Origami Square
**Document Version:** 1.0.0  
**Phase:** 3.1 (Minimal Agent Entry Contract)  
**Status:** REFERENCE EXAMPLE SPECIFICATION (READ-ONLY CORE BASELINE)  
**Core Target:** OMR Core `v0.1.0-alpha` (Contract 02 v2 · Phase 2.2 Hardened Baseline)  
**Field Annotations:** `[EXISTING]` / `[DERIVED]` / `[PROPOSED]`

---

## 1. Scenario Definition: Canonical Origami Diagonal Fold

An external AI agent (e.g. Gemini, Claude, or a local agent) is tasked with executing the fundamental origami base fold: folding a standard 100mm × 100mm square sheet in half along its diagonal crease $V_3(0,100) \to V_1(100,0)$.

### 1.1 Geometry of the Initial State ($S_0$)
The sheet consists of two triangular faces meeting at the diagonal crease edge $E_D(V_3 - V_1)$:
- **Fixed Face $F_0$**: $[V_0(0,0), V_1(100,0), V_3(0,100)]$ (stays on the table).
- **Moving Flap $F_1$**: $[V_3(0,100), V_2(100,100), V_1(100,0)]$ (flips over the crease).
- **Vertices**:
  - $V_0 = (0, 0)$
  - $V_1 = (100, 0)$
  - $V_2 = (100, 100)$
  - $V_3 = (0, 100)$
- **Crease Line**: connects $V_3(0,100)$ and $V_1(100,0)$, satisfying $x + y = 100$.
  - Implicit normal form: $n_x \cdot x + n_y \cdot y = c$ with $n_x = 1$, $n_y = 1$, $c = 100$.
  - Normal magnitude: $\|n\| = \sqrt{1^2 + 1^2} = \sqrt{2} \approx 1.4142135623730951$.

### 1.2 Expected Transformation
Under reflection across $x + y = 100$:
- Fixed vertices $V_0, V_1, V_3$ remain unchanged.
- Moving vertex $V_2(100, 100)$ transforms as:
  $$p' = p - 2 \cdot \frac{n \cdot p - c}{\|n\|^2} \cdot n = (100, 100) - 2 \cdot \frac{100 + 100 - 100}{2} \cdot (1, 1) = (100, 100) - 100 \cdot (1, 1) = (0, 0)$$
- Flap $F_1$ lands exactly on top of fixed face $F_0$.
- Orientation of $F_1$ inverts (clockwise $\to$ counter-clockwise or vice versa).

---

## 2. End-to-End Walkthrough: 6-Stage Lifecycle

```
EXTERNAL AGENT                          ENTRY ADAPTER                           OMR CORE (L2 / L7)
      │                                       │                                          │
      │── 1. GET /capabilities ──────────────>│                                          │
      │<─ 2. AgentCapabilityManifest ─────────│ (Zero-Hallucination Manifest)            │
      │                                       │                                          │
      │── 3. POST /operations (Submit) ──────>│                                          │
      │                                       │── 4. Validate Schema & Floats ───────────│
      │                                       │── 5. createOperationRequest() ──────────>│ [src/core/operationRequest.ts]
      │                                       │                                          │ (deepFreeze, partition check)
      │                                       │── 6. reflectAcrossLine() ───────────────>│ [src/core/l2GeometryEngine.ts]
      │                                       │<─ 7. resultingState, witness, trace ─────│ (IEEE-754 coordinates, no rounding)
      │                                       │                                          │
      │                                       │── 8. verifyResult(claim, request) ──────>│ [src/core/l7IndependentVerifier.ts]
      │                                       │<─ 9. VerificationVerdict (PASS) ─────────│ (independent residuals & axioms)
      │                                       │                                          │
      │<─ 10. MinimalAgentResponse ───────────│                                          │
```

---

### Stage 0: Capability Discovery (`DISCOVER`)

The external agent queries the entry adapter to ascertain supported operations, arithmetic representation, and known numerical defect envelopes.

> **Transport Architecture Note:** The HTTP request below is a *conceptual transport illustration* for a future REST/MCP adapter (Phase 3.2+). In current `v0.1.0-alpha`, no HTTP server runs on port 3000 (port 3000 is dedicated to the Vite frontend). Callers in Node.js invoke functions directly.

#### Conceptual Agent Query:
```http
GET /api/v1/capabilities HTTP/1.1
Host: omr.local
Accept: application/json
```

#### Adapter Response (`AgentCapabilityManifest`):
```json
{
  "manifestVersion": "omr.ail.v0.1.0",
  "coreVersion": "0.1.0-alpha",
  "contractSpecification": "CONTRACT_02_V2",
  "timestamp": "2026-11-17T12:00:00.000Z",
  "numericalKernel": {
    "arithmeticModel": "IEEE_754_BINARY64",
    "machineEpsilon": 2.220446049250313e-16,
    "roundingMode": "ROUND_TO_NEAREST_EVEN",
    "coordinatePrecisionPolicy": "ZERO_ROUNDING",
    "knownDefects": [
      { "defectId": "D-1", "name": "Catastrophic Shoelace Area Cancellation", "severity": "CRITICAL" },
      { "defectId": "D-2", "name": "Absolute Area Degeneracy Misclassification", "severity": "HIGH" },
      { "defectId": "D-3", "name": "Normal Vector Normalization Overflow/Underflow", "severity": "HIGH" },
      { "defectId": "D-7", "name": "Result-Only Tolerance Permissiveness", "severity": "MEDIUM" }
    ]
  },
  "operationalEnvelope": {
    "coordinateMin": -10000.0,
    "coordinateMax": 10000.0,
    "maxVerticesPerState": 500,
    "maxFacesPerState": 500,
    "maxEdgesPerState": 1500,
    "maxSequenceSteps": 100
  },
  "supportedOperations": [
    {
      "operation": "REFLECTION_ACROSS_LINE",
      "dimension": "2D",
      "requiredParameters": ["line.nx", "line.ny", "line.c", "movingVertexIds"],
      "optionalParameters": ["fixedVertexIds"],
      "witnessEmitted": "ReflectionWitness",
      "supportedVerificationModes": ["RESULT_VERIFICATION", "PROCESS_VERIFICATION"]
    }
  ],
  "unsupportedOperations": [
    { "operation": "FOLD_3D", "reasonCode": "DIMENSION_MISMATCH" },
    { "operation": "FACE_SUBDIVISION", "reasonCode": "TOPOLOGY_MUTATION_UNSUPPORTED" },
    { "operation": "CURVED_CREASE", "reasonCode": "NON_LINEAR_GEOMETRY" },
    { "operation": "LAYER_ORDERING_Z", "reasonCode": "PHYSICAL_MODEL_MISSING" },
    { "operation": "HUZITA_JUSTIN_AXIOMS_GENERAL", "reasonCode": "AXIOM_SOLVER_UNIMPLEMENTED" }
  ],
  "verifierCapabilities": {
    "verifierProvenance": "L7_AXIOMATIC_CERTIFYING_VERIFIER_V2",
    "isolationPolicy": "ZERO_L2_DEPENDENCY",
    "zeroTrustPolicy": "CLAIMED_RESIDUALS_IGNORED",
    "defaultTolerances": {
      "epsilon": 1e-7,
      "areaEpsilon": 1e-7,
      "zeroNormalEpsilon": 1e-12,
      "degenerateAreaEpsilon": 1e-12
    },
    "verifiedInvariants": [
      "requestBound", "witnessBound", "axiomsSatisfied", "lengthsPreserved",
      "areaPreserved", "orientationInverted", "fixedVerticesUnchanged",
      "idsPreserved", "traceContinuous"
    ],
    "possibleVerdicts": ["PASS", "FAIL", "UNDETERMINED"]
  }
}
```

---

### Stage 1: Agent Submission (`SUBMIT`)

Having verified that `REFLECTION_ACROSS_LINE` is supported and coordinate bounds are within $[-10000, 10000]$, the agent submits the canonical request payload:

#### Agent Payload (`MinimalAgentRequest`):
```json
{
  "protocolVersion": "omr.ail.v0.1.0",
  "clientRequestId": "gemini-session-42-step-1",
  "operation": "REFLECTION_ACROSS_LINE",
  "sourceState": {
    "stateId": "state-v0",
    "version": 0,
    "vertices": [
      { "id": "V0", "position": { "x": 0.0, "y": 0.0 } },
      { "id": "V1", "position": { "x": 100.0, "y": 0.0 } },
      { "id": "V2", "position": { "x": 100.0, "y": 100.0 } },
      { "id": "V3", "position": { "x": 0.0, "y": 100.0 } }
    ],
    "edges": [
      { "id": "E0", "startVertexId": "V0", "endVertexId": "V1" },
      { "id": "E1", "startVertexId": "V1", "endVertexId": "V2" },
      { "id": "E2", "startVertexId": "V2", "endVertexId": "V3" },
      { "id": "E3", "startVertexId": "V3", "endVertexId": "V0" },
      { "id": "ED", "startVertexId": "V3", "endVertexId": "V1" }
    ],
    "faces": [
      { "id": "F0", "vertexIds": ["V0", "V1", "V3"] },
      { "id": "F1", "vertexIds": ["V3", "V2", "V1"] }
    ]
  },
  "parameters": {
    "line": {
      "nx": 1.0,
      "ny": 1.0,
      "c": 100.0
    },
    "movingVertexIds": ["V2"],
    "fixedVertexIds": ["V0", "V1", "V3"]
  },
  "verificationMode": "RESULT_VERIFICATION"
}
```

---

### Stage 2: Adapter Validation & Mapping to Core Types

The entry adapter receives the raw JSON and performs validation before contacting core:
1. **Float Finite Check**: All coordinates and line coefficients are verified with `Number.isFinite`.
2. **Partition Check**:
   - `movingVertexIds` $\cap$ `fixedVertexIds` $= \emptyset$ (Disjoint $\checkmark$)
   - `movingVertexIds` $\cup$ `fixedVertexIds` $= \{V_0, V_1, V_2, V_3\}$ (Complete $\checkmark$)
3. **Core Request Invocation**:
   Adapter calls `src/core/operationRequest.ts`:
   ```typescript
   const trustedRequest = createOperationRequest({
     sourceState: req.sourceState,
     line: req.parameters.line,
     movingVertexIds: req.parameters.movingVertexIds,
     fixedVertexIds: req.parameters.fixedVertexIds,
     requestProvenance: 'OMR_AGENT_ENTRY_ADAPTER_V0_1',
   });
   ```

---

### Stage 3: Core L2 Execution (`EXECUTE`)

The adapter passes `trustedRequest` and `sourceState` to `src/core/l2GeometryEngine.ts`:
```typescript
const l2Output = reflectAcrossLine({
  request: trustedRequest,
  sourceState: trustedRequest.sourceState,
  operationId: 'op-001',
  witnessId: 'witness-001',
  targetStateId: 'state-v1',
  stepIndex: 1,
});
```

#### Intermediate Resulting State ($S_1$) emitted by L2:
```json
{
  "stateId": "state-v1",
  "version": 1,
  "vertices": [
    { "id": "V0", "position": { "x": 0.0, "y": 0.0 } },
    { "id": "V1", "position": { "x": 100.0, "y": 0.0 } },
    { "id": "V2", "position": { "x": 0.0, "y": 0.0 } },
    { "id": "V3", "position": { "x": 0.0, "y": 100.0 } }
  ],
  "edges": [
    { "id": "E0", "startVertexId": "V0", "endVertexId": "V1" },
    { "id": "E1", "startVertexId": "V1", "endVertexId": "V2" },
    { "id": "E2", "startVertexId": "V2", "endVertexId": "V3" },
    { "id": "E3", "startVertexId": "V3", "endVertexId": "V0" },
    { "id": "ED", "startVertexId": "V3", "endVertexId": "V1" }
  ],
  "faces": [
    { "id": "F0", "vertexIds": ["V0", "V1", "V3"] },
    { "id": "F1", "vertexIds": ["V3", "V2", "V1"] }
  ]
}
```

#### Reflection Witness emitted by L2:
```json
{
  "witnessId": "witness-001",
  "operationId": "op-001",
  "operationRequestId": "opreq-state-v0-v0-1",
  "operation": "REFLECTION_ACROSS_LINE",
  "sourceStateId": "state-v0",
  "sourceStateVersion": 0,
  "targetStateId": "state-v1",
  "targetStateVersion": 1,
  "axis": {
    "n": { "nx": 1.0, "ny": 1.0 },
    "c": 100.0
  },
  "movingVertexIds": ["V2"],
  "fixedVertexIds": ["V0", "V1", "V3"],
  "vertexPairs": [
    {
      "vertexId": "V2",
      "p": { "x": 100.0, "y": 100.0 },
      "pPrime": { "x": 0.0, "y": 0.0 }
    }
  ],
  "claimedResiduals": {
    "maxMidpointError": 0.0,
    "maxCollinearityError": 0.0
  }
}
```

---

### Stage 4: Independent L7 Verification (`VERIFY`)

The adapter builds the certifying `VerificationClaim` and calls `src/core/l7IndependentVerifier.ts`:
```typescript
const claim: VerificationClaim = {
  sourceState: trustedRequest.sourceState,
  resultingState: l2Output.resultingState,
  operation: 'REFLECTION_ACROSS_LINE',
  parameters: trustedRequest.parameters,
  witness: l2Output.witness,
};

const verdict = verifyResult(claim, trustedRequest);
```

#### Independent Invariants Computed by L7:
1. **Request & Witness Binding**:
   - `operationRequestId` matches across Request, Witness, and Claim ($\checkmark$)
   - Parameter line $(1, 1, 100)$ matches axis in Witness and Claim ($\checkmark$)
2. **Reflection Axioms**:
   - Midpoint of $V_2(100, 100)$ and $V_2'(0, 0)$ is $(50, 50)$.
   - $n \cdot p_{mid} = 1 \cdot 50 + 1 \cdot 50 = 100 = c$. Residual $r_{mid} = 0.0 \le 10^{-7}$ ($\checkmark$)
   - Displacement vector: $p' - p = (-100, -100)$, which is exactly $-100 \cdot (1, 1)$, parallel to $n = (1, 1)$. Residual $r_{\perp} = 0.0 \le 10^{-7}$ ($\checkmark$)
3. **Fixed Vertices**:
   - Displacement of $V_0, V_1, V_3$ is exactly $0.0 \le 10^{-7}$ ($\checkmark$)
4. **Isometry & Metric Invariants**:
   - Flap $F_1$: Edges $E_1(V_1-V_2)$ was length $100$, now $(V_1-V_2')$ is length $\|(100,0)-(0,0)\| = 100$. Length error $= 0.0$ ($\checkmark$)
   - Edge $E_2(V_2-V_3)$ was length $100$, now $(V_2'-V_3)$ is length $\|(0,0)-(0,100)\| = 100$. Length error $= 0.0$ ($\checkmark$)
   - Signed area of $F_1$ in $S_0$: $V_3(0,100) \to V_2(100,100) \to V_1(100,0) = -5000.0$ (clockwise).
   - Signed area of $F_1$ in $S_1$: $V_3(0,100) \to V_2'(0,0) \to V_1(100,0) = +5000.0$ (counter-clockwise).
   - Magnitude preserved: $|-5000| = |+5000| = 5000$. Area error $= 0.0 \le 10^{-7}$ ($\checkmark$)
   - Orientation inverted: $\mathrm{sgn}(-5000) \ne \mathrm{sgn}(+5000)$ ($\checkmark$)
5. **Verdict**: `status: "PASS"`

---

### Stage 5: Final Response Delivery (`RECEIVE`)

The entry adapter packages the mathematical truth into the canonical response format and delivers it to the agent.

#### Canonical Response Payload (`MinimalAgentResponse`):
```json
{
  "protocolVersion": "0.1.0",
  "responseId": "resp-20261117-001",
  "inResponseTo": "gemini-session-42-step-1",
  "execution": {
    "status": "EXECUTED",
    "operationId": "op-001"
  },
  "result": {
    "resultingState": {
      "stateId": "state-v1",
      "version": 1,
      "vertices": [
        { "id": "V0", "position": { "x": 0.0, "y": 0.0 } },
        { "id": "V1", "position": { "x": 100.0, "y": 0.0 } },
        { "id": "V2", "position": { "x": 0.0, "y": 0.0 } },
        { "id": "V3", "position": { "x": 0.0, "y": 100.0 } }
      ],
      "edges": [
        { "id": "E0", "startVertexId": "V0", "endVertexId": "V1" },
        { "id": "E1", "startVertexId": "V1", "endVertexId": "V2" },
        { "id": "E2", "startVertexId": "V2", "endVertexId": "V3" },
        { "id": "E3", "startVertexId": "V3", "endVertexId": "V0" },
        { "id": "ED", "startVertexId": "V3", "endVertexId": "V1" }
      ],
      "faces": [
        { "id": "F0", "vertexIds": ["V0", "V1", "V3"] },
        { "id": "F1", "vertexIds": ["V3", "V2", "V1"] }
      ]
    },
    "witness": {
      "witnessId": "witness-001",
      "operationId": "op-001",
      "operationRequestId": "opreq-state-v0-v0-1",
      "operation": "REFLECTION_ACROSS_LINE",
      "sourceStateId": "state-v0",
      "sourceStateVersion": 0,
      "targetStateId": "state-v1",
      "targetStateVersion": 1,
      "axis": {
        "n": { "nx": 1.0, "ny": 1.0 },
        "c": 100.0
      },
      "movingVertexIds": ["V2"],
      "fixedVertexIds": ["V0", "V1", "V3"],
      "vertexPairs": [
        {
          "vertexId": "V2",
          "p": { "x": 100.0, "y": 100.0 },
          "pPrime": { "x": 0.0, "y": 0.0 }
        }
      ]
    }
  },
  "trace": {
    "stepIndex": 1,
    "entry": {
      "operationId": "op-001",
      "operationRequestId": "opreq-state-v0-v0-1",
      "stepIndex": 1,
      "operation": "REFLECTION_ACROSS_LINE",
      "sourceStateVersion": 0,
      "targetStateVersion": 1,
      "sourceState": { "stateId": "state-v0", "version": 0, "vertices": [], "edges": [], "faces": [] },
      "resultingState": { "stateId": "state-v1", "version": 1, "vertices": [], "edges": [], "faces": [] },
      "parameters": {
        "line": { "nx": 1.0, "ny": 1.0, "c": 100.0 },
        "movingVertexIds": ["V2"],
        "fixedVertexIds": ["V0", "V1", "V3"]
      },
      "precision": 53,
      "provenance": "OMR_AGENT_ENTRY_ADAPTER_V0_1",
      "timestamp": "2026-11-17T12:00:00.125Z"
    }
  },
  "verification": {
    "serviceStatus": "VERIFIED",
    "verdict": {
      "status": "PASS",
      "mode": "RESULT_VERIFICATION",
      "residuals": {
        "midpointError": 0.0,
        "collinearityError": 0.0,
        "maxFixedDisplacement": 0.0,
        "maxLengthError": 0.0,
        "areaError": 0.0
      },
      "predicates": {
        "requestBound": true,
        "witnessBound": true,
        "axiomsSatisfied": true,
        "lengthsPreserved": true,
        "areaPreserved": true,
        "orientationInverted": true,
        "fixedVerticesUnchanged": true,
        "idsPreserved": true,
        "traceContinuous": true
      },
      "diagnostics": []
    }
  },
  "limitations": [
    "COORDINATE_BOUND_COMPLIANT: Coordinates within [-10000, 10000] mm.",
    "DEFECT_ADVISORY: Single-step verification; use PROCESS_VERIFICATION for multi-step sequences to detect cumulative drift (D-7)."
  ]
}
```

---

## 3. Negative Scenarios and Robust Error Handling

To prove the robustness of the entry contract, we illustrate four negative control experiments.

### 3.1 Negative Case A: Agent Requests Unsupported Operation (`FOLD_3D`)

An LLM agent attempts to request a 3D fold with a dihedral rotation angle:

#### Rejected Agent Request:
```json
{
  "protocolVersion": "omr.ail.v0.1.0",
  "clientRequestId": "agent-neg-1",
  "operation": "FOLD_3D",
  "sourceState": { "stateId": "state-v0", "version": 0, "vertices": [], "edges": [], "faces": [] },
  "parameters": { "crease": "ED", "dihedralAngle": 3.14159 }
}
```

#### Entry Layer Response:
```json
{
  "protocolVersion": "omr.ail.v0.1.0",
  "responseId": "resp-err-001",
  "clientRequestId": "agent-neg-1",
  "status": "REJECTED",
  "error": {
    "code": "UNSUPPORTED_OPERATION",
    "message": "Operation 'FOLD_3D' is unsupported by OMR Core v0.1.0.",
    "reasonCode": "DIMENSION_MISMATCH",
    "details": "OMR Core v0.1.0 is strictly a 2D planar certifying engine. Dihedral rotations in R^3 are not supported.",
    "discoveryReference": "/capabilities",
    "supportedOperations": ["REFLECTION_ACROSS_LINE"]
  }
}
```

---

### 3.2 Negative Case B: Partition Incompleteness / Unknown Vertex ID

The agent specifies vertex `'V99'` which does not exist in `sourceState.vertices`:

#### Rejected Agent Request:
```json
{
  "protocolVersion": "omr.ail.v0.1.0",
  "clientRequestId": "agent-neg-2",
  "operation": "REFLECTION_ACROSS_LINE",
  "sourceState": { ... },
  "parameters": {
    "line": { "nx": 1.0, "ny": 1.0, "c": 100.0 },
    "movingVertexIds": ["V2", "V99"],
    "fixedVertexIds": ["V0", "V1", "V3"]
  }
}
```

#### Entry Layer Response:
```json
{
  "protocolVersion": "omr.ail.v0.1.0",
  "responseId": "resp-err-002",
  "clientRequestId": "agent-neg-2",
  "status": "REJECTED",
  "error": {
    "code": "UNKNOWN_VERTEX_ID",
    "message": "movingVertexIds contains ID 'V99' not present in sourceState.vertices.",
    "details": "sourceState defines: ['V0', 'V1', 'V2', 'V3']"
  }
}
```

---

### 3.3 Negative Case C: Degenerate Geometry / Collinear Face (`UNDETERMINED`)

The agent submits a source state where face $F_1$ is collinear (e.g. vertices lie on the same straight line):

#### Verification Result from L7:
```json
{
  "status": "UNDETERMINED",
  "mode": "RESULT_VERIFICATION",
  "residuals": {
    "midpointError": 0.0,
    "collinearityError": 0.0,
    "maxFixedDisplacement": 0.0,
    "maxLengthError": 0.0,
    "areaError": 0.0
  },
  "predicates": {
    "requestBound": true,
    "witnessBound": true,
    "axiomsSatisfied": true,
    "lengthsPreserved": true,
    "areaPreserved": true,
    "orientationInverted": false,
    "fixedVerticesUnchanged": true,
    "idsPreserved": true,
    "traceContinuous": true
  },
  "diagnostics": [
    "DEGENERATE_FACE_ORIENTATION_UNDETERMINED: Face 'F1' initial area 0 <= degenerateAreaEpsilon (1e-12). Signed orientation inversion cannot be certified."
  ]
}
```

---

### 3.4 Negative Case D: Metric Distortion / Falsified Vertex (`FAIL`)

An external or adversarial agent substitutes coordinates such that edge lengths are stretched or sheared:

#### Verification Result from L7:
```json
{
  "status": "FAIL",
  "mode": "RESULT_VERIFICATION",
  "residuals": {
    "midpointError": 25.412,
    "collinearityError": 18.204,
    "maxFixedDisplacement": 0.0,
    "maxLengthError": 14.142,
    "areaError": 2500.0
  },
  "predicates": {
    "requestBound": true,
    "witnessBound": false,
    "axiomsSatisfied": false,
    "lengthsPreserved": false,
    "areaPreserved": false,
    "orientationInverted": false,
    "fixedVerticesUnchanged": true,
    "idsPreserved": true,
    "traceContinuous": true
  },
  "diagnostics": [
    "AXIOM_VIOLATION: Midpoint residual 25.412 > epsilon (1e-7)",
    "ISOMETRY_VIOLATION: Edge 'E1' length changed from 100.0 to 114.142 (error: 14.142 > 1e-7)",
    "AREA_VIOLATION: Face 'F1' area changed from 5000.0 to 7500.0 (error: 2500.0 > 1e-7)"
  ]
}
```
The adversarial claim is completely rejected by L7 Zero-Trust verification.
