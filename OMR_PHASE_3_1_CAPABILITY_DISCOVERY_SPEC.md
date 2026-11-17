# OMR Phase 3.1 — Capability Discovery Specification
## Document Identity & Core Synchronization Standard
**Document Version:** 1.0.0  
**Phase:** 3.1 (Minimal Agent Entry Contract)  
**Status:** ARCHITECTURAL DESIGN SPECIFICATION (READ-ONLY CORE BASELINE)  
**Core Target:** OMR Core `v0.1.0-alpha` (Contract 02 v2 · Phase 2.2 Hardened Baseline)  
**Classification:** `[EXISTING]` / `[DERIVED]` / `[PROPOSED]`

---

## 1. Discovery Philosophy: The Zero-Hallucination Policy

External Large Language Model agents (such as Gemini, Claude, and GPT) frequently attempt geometric and mathematical problem-solving by improvising unverified capabilities, assuming hidden 3D engines, or submitting unsupported operations (e.g., arbitrary 3D rotation angles, automatic crease mesh-splitting, or spline folds).

In the Origami Mathematical Reasoning (OMR) architecture, capability discovery is governed by the **Zero-Hallucination Policy**:

1. **Manifest Authoritativeness**: The agent must discover the exact mathematical and numerical limits of the core before constructing or submitting an operation request.
2. **Explicit Negative Bounds**: Unsupported operations are not omitted silently; they are explicitly enumerated with machine-readable rejection codes and mathematical rationale.
3. **Producer Claim ≠ Receiver Truth**: An agent cannot declare its own expectations or assumptions as parameters. If an agent submits an operation outside the capability manifest, the entry layer must reject the request at validation time before any core geometric engine is invoked.
4. **Self-Describing Numerical Limits**: Numerical tolerances, machine representations, coordinate domains, and known defect envelopes (such as D-1 Shoelace translation error or D-2 degeneracy thresholds) are published directly within the discovery manifest.

---

## 2. Canonical Manifest Structure (`AgentCapabilityManifest`)

The capability manifest is an immutable, machine-readable JSON structure returned by the entry layer upon receiving a `DISCOVER` query (`GET /capabilities` or MCP `get_capabilities`).

> **Transport Architecture Note:** References to `GET /capabilities` or MCP tools describe *conceptual transport interfaces* for Phase 3.2+ adapters. In `v0.1.0-alpha`, no network service is running; capabilities are verified programmatically or via specification.

### 2.1 TypeScript Type Definitions

```typescript
/**
 * OMR Agent Capability Discovery Schema
 * Classification annotations:
 *   [EXISTING] - Directly reflects types/constants in src/core/types.ts or src/core/l7IndependentVerifier.ts
 *   [DERIVED]  - Computed or aggregated from core exports
 *   [PROPOSED] - Canonical entry manifest structure introduced in Phase 3.1
 */

// [PROPOSED] Top-level Capability Manifest
export interface AgentCapabilityManifest {
  readonly manifestVersion: string;                       // [PROPOSED] 'omr.ail.v0.1.0'
  readonly coreVersion: string;                           // [DERIVED]  '0.1.0-alpha'
  readonly contractSpecification: string;                 // [EXISTING] 'CONTRACT_02_V2'
  readonly timestamp: string;                             // [PROPOSED] ISO-8601 generation time
  readonly numericalKernel: NumericalKernelDescriptor;    // [DERIVED]  Mathematical & floating-point bounds
  readonly operationalEnvelope: OperationalEnvelope;      // [PROPOSED] Recommended domain limits
  readonly supportedOperations: readonly SupportedOperationDescriptor[]; // [DERIVED] Implemented operations
  readonly unsupportedOperations: readonly UnsupportedOperationDescriptor[]; // [PROPOSED] Explicit negative boundaries
  readonly verifierCapabilities: VerifierCapabilitiesDescriptor; // [EXISTING] L7 verifier configuration & invariants
}

// [DERIVED] Description of floating-point kernel
export interface NumericalKernelDescriptor {
  readonly arithmeticModel: 'IEEE_754_BINARY64';          // [EXISTING] double-precision floats
  readonly machineEpsilon: number;                         // [DERIVED]  2.220446049250313e-16
  readonly roundingMode: 'ROUND_TO_NEAREST_EVEN';         // [DERIVED]  V8 / JS standard
  readonly coordinatePrecisionPolicy: 'ZERO_ROUNDING';    // [EXISTING] Contract 02 v2 prohibits .toFixed
  readonly knownDefects: readonly NumericalDefectDescriptor[]; // [DERIVED] Audited Phase 2.4/2.6 defect register
}

// [PROPOSED] Audited defect envelope metadata
export interface NumericalDefectDescriptor {
  readonly defectId: 'D-1' | 'D-2' | 'D-3' | 'D-7';       // [DERIVED]
  readonly name: string;                                   // [PROPOSED]
  readonly severity: 'CRITICAL' | 'HIGH' | 'MEDIUM';       // [PROPOSED]
  readonly safeOperatingCondition: string;                 // [PROPOSED]
}

// [PROPOSED] Recommended operational bounds to avoid catastrophic cancellation
export interface OperationalEnvelope {
  readonly coordinateMin: number;                          // [PROPOSED] -10000.0 (mm)
  readonly coordinateMax: number;                          // [PROPOSED] +10000.0 (mm)
  readonly maxVerticesPerState: number;                    // [PROPOSED] 500
  readonly maxFacesPerState: number;                       // [PROPOSED] 500
  readonly maxEdgesPerState: number;                       // [PROPOSED] 1500
  readonly maxSequenceSteps: number;                       // [PROPOSED] 100
}

// [DERIVED] Supported operation specification
export interface SupportedOperationDescriptor {
  readonly operation: 'REFLECTION_ACROSS_LINE';            // [EXISTING] OperationRequest['operation']
  readonly dimension: '2D';                                // [EXISTING] Planar 2D only
  readonly requiredParameters: readonly string[];          // [EXISTING] ['line.nx', 'line.ny', 'line.c', 'movingVertexIds']
  readonly optionalParameters: readonly string[];          // [EXISTING] ['fixedVertexIds']
  readonly parameterSchema: {
    readonly line: {
      readonly equation: 'nx * x + ny * y = c';            // [EXISTING] Implicit line formula
      readonly constraints: 'Math.hypot(nx, ny) > zeroNormalEpsilon'; // [EXISTING]
    };
    readonly partition: {
      readonly movingDisjointFromFixed: true;              // [EXISTING] movingVertexIds ∩ fixedVertexIds = ∅
      readonly coversAllVertices: true;                    // [EXISTING] movingVertexIds ∪ fixedVertexIds = V
    };
  };
  readonly witnessEmitted: 'ReflectionWitness';             // [EXISTING] Contract 02 v2 witness
  readonly supportedVerificationModes: readonly ('RESULT_VERIFICATION' | 'PROCESS_VERIFICATION')[]; // [EXISTING]
}

// [PROPOSED] Explicit unsupported operation enumeration
export interface UnsupportedOperationDescriptor {
  readonly operation: string;                              // [PROPOSED] e.g., 'FOLD_3D', 'FACE_SUBDIVISION'
  readonly reasonCode: UnsupportedReasonCode;              // [PROPOSED]
  readonly rationale: string;                              // [PROPOSED]
  readonly futurePhaseTarget?: string;                     // [PROPOSED]
}

export type UnsupportedReasonCode =
  | 'DIMENSION_MISMATCH'               // Target requires 3D coordinates or non-planar topology
  | 'TOPOLOGY_MUTATION_UNSUPPORTED'   // Target requires dynamic mesh cutting / crease splitting
  | 'NON_LINEAR_GEOMETRY'              // Target requires curved creases or spline approximations
  | 'PHYSICAL_MODEL_MISSING'           // Target requires layer thickness, friction, or collision
  | 'AXIOM_SOLVER_UNIMPLEMENTED';      // General Huzita-Justin axioms 1-7 algebraic solver not yet in core

// [EXISTING] L7 verifier specification
export interface VerifierCapabilitiesDescriptor {
  readonly verifierProvenance: 'L7_AXIOMATIC_CERTIFYING_VERIFIER_V2'; // [EXISTING]
  readonly isolationPolicy: 'ZERO_L2_DEPENDENCY';          // [EXISTING] L7 imports no runtime geometry helpers
  readonly zeroTrustPolicy: 'CLAIMED_RESIDUALS_IGNORED';   // [EXISTING] witness.claimedResiduals never trusted
  readonly defaultTolerances: {
    readonly epsilon: number;                              // [EXISTING] 1e-7
    readonly areaEpsilon: number;                          // [EXISTING] 1e-7
    readonly zeroNormalEpsilon: number;                    // [EXISTING] 1e-12
    readonly degenerateAreaEpsilon: number;                // [EXISTING] 1e-12
  };
  readonly verifiedInvariants: readonly string[];          // [EXISTING] Predicate checklist
  readonly possibleVerdicts: readonly ('PASS' | 'FAIL' | 'UNDETERMINED')[]; // [EXISTING]
}
```

---

## 3. Canonical Manifest Payload (`v0.1.0-alpha`)

Below is the concrete discovery payload generated for OMR Core `v0.1.0-alpha`. External agents receiving this response obtain an exact blueprint of what OMR can and cannot do:

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
      {
        "defectId": "D-1",
        "name": "Catastrophic Shoelace Area Cancellation",
        "severity": "CRITICAL",
        "safeOperatingCondition": "Keep coordinates bounded within [-10000, 10000] mm. Avoid large rigid translations."
      },
      {
        "defectId": "D-2",
        "name": "Absolute Area Degeneracy Misclassification",
        "severity": "HIGH",
        "safeOperatingCondition": "Faces must have area > 1e-12 mm^2 to avoid being classified as degenerate/collinear."
      },
      {
        "defectId": "D-3",
        "name": "Normal Vector Normalization Overflow/Underflow",
        "severity": "HIGH",
        "safeOperatingCondition": "Line parameters must satisfy Math.hypot(nx, ny) > 1e-12 and Math.hypot(nx, ny) < 1e150."
      },
      {
        "defectId": "D-7",
        "name": "Result-Only Tolerance Permissiveness",
        "severity": "MEDIUM",
        "safeOperatingCondition": "Use PROCESS_VERIFICATION over multi-step folding sequences to prevent error accumulation."
      }
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
      "requiredParameters": [
        "line.nx",
        "line.ny",
        "line.c",
        "movingVertexIds"
      ],
      "optionalParameters": [
        "fixedVertexIds"
      ],
      "parameterSchema": {
        "line": {
          "equation": "nx * x + ny * y = c",
          "constraints": "Math.hypot(nx, ny) > zeroNormalEpsilon"
        },
        "partition": {
          "movingDisjointFromFixed": true,
          "coversAllVertices": true
        }
      },
      "witnessEmitted": "ReflectionWitness",
      "supportedVerificationModes": [
        "RESULT_VERIFICATION",
        "PROCESS_VERIFICATION"
      ]
    }
  ],
  "unsupportedOperations": [
    {
      "operation": "FOLD_3D",
      "reasonCode": "DIMENSION_MISMATCH",
      "rationale": "OMR Core v0.1.0 is strictly a 2D planar certifying engine. Dihedral angle rotations in R^3 are not supported.",
      "futurePhaseTarget": "Phase 4.x"
    },
    {
      "operation": "FACE_SUBDIVISION",
      "reasonCode": "TOPOLOGY_MUTATION_UNSUPPORTED",
      "rationale": "Dynamic topological face splitting along fold lines is not implemented in L2. Input GeometryState must already contain pre-subdivided faces and edges matching crease lines.",
      "futurePhaseTarget": "Phase 3.5"
    },
    {
      "operation": "CURVED_CREASE",
      "reasonCode": "NON_LINEAR_GEOMETRY",
      "rationale": "Only straight-line creases (linear segments) are supported. Curved folds require non-Euclidean developable surface models.",
      "futurePhaseTarget": "Out of Scope"
    },
    {
      "operation": "LAYER_ORDERING_Z",
      "reasonCode": "PHYSICAL_MODEL_MISSING",
      "rationale": "Faces occupy a mathematical 2D plane with zero thickness. Permutations of layer order, self-collision, and paper thickness are not tracked.",
      "futurePhaseTarget": "Phase 4.x"
    },
    {
      "operation": "HUZITA_JUSTIN_AXIOMS_GENERAL",
      "reasonCode": "AXIOM_SOLVER_UNIMPLEMENTED",
      "rationale": "General geometric construction solvers (Axioms 1 through 7) are not yet integrated into L2. The calling agent must pre-calculate the line normal equation (nx, ny, c) and provide it directly.",
      "futurePhaseTarget": "Phase 3.3"
    }
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
      "requestBound",
      "witnessBound",
      "axiomsSatisfied",
      "lengthsPreserved",
      "areaPreserved",
      "orientationInverted",
      "fixedVerticesUnchanged",
      "idsPreserved",
      "traceContinuous"
    ],
    "possibleVerdicts": [
      "PASS",
      "FAIL",
      "UNDETERMINED"
    ]
  }
}
```

---

## 4. Core Synchronization & Zero-Divergence Standard

A central risk in AI systems is documentation drift: the documentation or API manifest promises capabilities that the core implementation does not support.

To guarantee zero divergence:

### 4.1 Single Source of Truth
The capability discovery module (`src/entry/capabilityDiscovery.ts`) must derive its supported operations strictly from the exported types of `src/core/types.ts`:
- Supported operations are constrained by `OperationRequest['operation']` (`'REFLECTION_ACROSS_LINE'`).
- If a developer or researcher adds a new operation to `src/core/types.ts`, the TypeScript compiler enforces that the capability manifest generator must either declare an adapter descriptor or fail compilation.

### 4.2 Automated Capability Manifest Test
The test suite must include a test (`tests/entryCapabilitySync.test.ts` in Phase 3.2) verifying:
1. Every operation in `supportedOperations` can be instantiated via `createOperationRequest`.
2. Every operation in `supportedOperations` can be executed by `l2GeometryEngine`.
3. Every operation in `supportedOperations` produces a claim verifiable by `l7IndependentVerifier`.
4. Any operation in `unsupportedOperations` is guaranteed to be rejected with code `UNSUPPORTED_OPERATION` if submitted to `submitAgentOperation`.

---

## 5. Agent Error Handling for Unsupported Operations

When an agent requests an operation listed in `unsupportedOperations`, the entry adapter rejects it immediately without modifying state or generating execution traces.

### 5.1 Rejection Response Format

```json
{
  "protocolVersion": "omr.ail.v0.1.0",
  "responseId": "resp-err-001",
  "clientRequestId": "agent-req-99",
  "status": "REJECTED",
  "error": {
    "code": "UNSUPPORTED_OPERATION",
    "message": "Operation 'FOLD_3D' is not supported by OMR Core v0.1.0.",
    "reasonCode": "DIMENSION_MISMATCH",
    "details": "OMR Core v0.1.0 is strictly a 2D planar certifying engine. Dihedral angle rotations in R^3 are not supported.",
    "discoveryReference": "/capabilities",
    "supportedOperations": [
      "REFLECTION_ACROSS_LINE"
    ]
  }
}
```

---

## 6. Implementation Blueprint (`src/entry/capabilityDiscovery.ts`)

```typescript
/**
 * Entry Adapter Module: Capability Discovery
 * Classification: [PROPOSED] (To be created in Phase 3.2 without touching src/core/*)
 */

import { DEFAULT_VERIFIER_TOLERANCES } from '../core/l7IndependentVerifier';
import type { AgentCapabilityManifest } from './types';

export function getAgentCapabilityManifest(): AgentCapabilityManifest {
  return {
    manifestVersion: 'omr.ail.v0.1.0',
    coreVersion: '0.1.0-alpha',
    contractSpecification: 'CONTRACT_02_V2',
    timestamp: new Date().toISOString(),
    numericalKernel: {
      arithmeticModel: 'IEEE_754_BINARY64',
      machineEpsilon: Number.EPSILON,
      roundingMode: 'ROUND_TO_NEAREST_EVEN',
      coordinatePrecisionPolicy: 'ZERO_ROUNDING',
      knownDefects: [
        {
          defectId: 'D-1',
          name: 'Catastrophic Shoelace Area Cancellation',
          severity: 'CRITICAL',
          safeOperatingCondition: 'Keep coordinates bounded within [-10000, 10000] mm.'
        },
        {
          defectId: 'D-2',
          name: 'Absolute Area Degeneracy Misclassification',
          severity: 'HIGH',
          safeOperatingCondition: 'Faces must have area > 1e-12 mm^2.'
        },
        {
          defectId: 'D-3',
          name: 'Normal Vector Normalization Overflow/Underflow',
          severity: 'HIGH',
          safeOperatingCondition: 'Math.hypot(nx, ny) must be between 1e-12 and 1e150.'
        },
        {
          defectId: 'D-7',
          name: 'Result-Only Tolerance Permissiveness',
          severity: 'MEDIUM',
          safeOperatingCondition: 'Use PROCESS_VERIFICATION over multi-step folding sequences.'
        }
      ]
    },
    operationalEnvelope: {
      coordinateMin: -10000.0,
      coordinateMax: 10000.0,
      maxVerticesPerState: 500,
      maxFacesPerState: 500,
      maxEdgesPerState: 1500,
      maxSequenceSteps: 100
    },
    supportedOperations: [
      {
        operation: 'REFLECTION_ACROSS_LINE',
        dimension: '2D',
        requiredParameters: ['line.nx', 'line.ny', 'line.c', 'movingVertexIds'],
        optionalParameters: ['fixedVertexIds'],
        parameterSchema: {
          line: {
            equation: 'nx * x + ny * y = c',
            constraints: 'Math.hypot(nx, ny) > zeroNormalEpsilon'
          },
          partition: {
            movingDisjointFromFixed: true,
            coversAllVertices: true
          }
        },
        witnessEmitted: 'ReflectionWitness',
        supportedVerificationModes: ['RESULT_VERIFICATION', 'PROCESS_VERIFICATION']
      }
    ],
    unsupportedOperations: [
      {
        operation: 'FOLD_3D',
        reasonCode: 'DIMENSION_MISMATCH',
        rationale: 'OMR Core v0.1.0 is strictly a 2D planar certifying engine.',
        futurePhaseTarget: 'Phase 4.x'
      },
      {
        operation: 'FACE_SUBDIVISION',
        reasonCode: 'TOPOLOGY_MUTATION_UNSUPPORTED',
        rationale: 'Dynamic topological face splitting along fold lines is not implemented.',
        futurePhaseTarget: 'Phase 3.5'
      },
      {
        operation: 'CURVED_CREASE',
        reasonCode: 'NON_LINEAR_GEOMETRY',
        rationale: 'Only straight-line creases are supported.',
        futurePhaseTarget: 'Out of Scope'
      },
      {
        operation: 'LAYER_ORDERING_Z',
        reasonCode: 'PHYSICAL_MODEL_MISSING',
        rationale: 'Zero-thickness 2D plane; layer stack permutations are not tracked.',
        futurePhaseTarget: 'Phase 4.x'
      },
      {
        operation: 'HUZITA_JUSTIN_AXIOMS_GENERAL',
        reasonCode: 'AXIOM_SOLVER_UNIMPLEMENTED',
        rationale: 'Calling agent must pre-calculate the line normal equation (nx, ny, c).',
        futurePhaseTarget: 'Phase 3.3'
      }
    ],
    verifierCapabilities: {
      verifierProvenance: 'L7_AXIOMATIC_CERTIFYING_VERIFIER_V2',
      isolationPolicy: 'ZERO_L2_DEPENDENCY',
      zeroTrustPolicy: 'CLAIMED_RESIDUALS_IGNORED',
      defaultTolerances: {
        epsilon: DEFAULT_VERIFIER_TOLERANCES.epsilon,
        areaEpsilon: DEFAULT_VERIFIER_TOLERANCES.areaEpsilon,
        zeroNormalEpsilon: DEFAULT_VERIFIER_TOLERANCES.zeroNormalEpsilon,
        degenerateAreaEpsilon: DEFAULT_VERIFIER_TOLERANCES.degenerateAreaEpsilon
      },
      verifiedInvariants: [
        'requestBound',
        'witnessBound',
        'axiomsSatisfied',
        'lengthsPreserved',
        'areaPreserved',
        'orientationInverted',
        'fixedVerticesUnchanged',
        'idsPreserved',
        'traceContinuous'
      ],
      possibleVerdicts: ['PASS', 'FAIL', 'UNDETERMINED']
    }
  };
}
```
