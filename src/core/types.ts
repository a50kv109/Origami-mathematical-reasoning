/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Inter-Module Contract 02 (v2): L2 <-> L7 Certifying Contract Type Definitions
 * Pure TypeScript types/interfaces only — zero runtime computation or helpers.
 */

export type VertexId = string;
export type EdgeId = string;
export type FaceId = string;

export interface Point2D {
  readonly x: number;
  readonly y: number;
}

export interface Vertex2D {
  readonly id: VertexId;
  readonly position: Point2D;
}

export interface Edge2D {
  readonly id: EdgeId;
  readonly startVertexId: VertexId;
  readonly endVertexId: VertexId;
}

export interface Face2D {
  readonly id: FaceId;
  readonly vertexIds: readonly VertexId[];
}

/**
 * Immutable 2D GeometryState snapshot.
 * Coordinates are stored as IEEE-754 numbers without rounding.
 * Precision tolerances belong strictly to the receiving verifier (L7), not GeometryState.
 */
export interface GeometryState {
  readonly stateId: string;
  readonly version: number;
  readonly vertices: readonly Vertex2D[];
  readonly edges: readonly Edge2D[];
  readonly faces: readonly Face2D[];
}

/**
 * Implicit line equation: nx * x + ny * y = c
 */
export interface LineNormalParams {
  readonly nx: number;
  readonly ny: number;
  readonly c: number;
}

export interface ReflectionParameters {
  readonly line: LineNormalParams;
  readonly movingVertexIds: readonly VertexId[];
  readonly fixedVertexIds: readonly VertexId[];
}

/**
 * Trusted immutable operation request created outside L2/Claim/Witness.
 * L2 must execute exactly these requested parameters, and L7 independently
 * checks correspondence between the result, witness, TRACE, and this request.
 */
export interface OperationRequest {
  readonly operationRequestId: string;
  readonly operation: 'REFLECTION_ACROSS_LINE';
  readonly sourceStateId: string;
  readonly sourceStateVersion: number;
  readonly parameters: ReflectionParameters;
  readonly movingVertexIds: readonly VertexId[];
  readonly fixedVertexIds: readonly VertexId[];
  readonly requestProvenance: string;
  readonly timestamp?: string;
}

export interface ReflectionWitnessVertexPair {
  readonly vertexId: VertexId;
  readonly p: Point2D;
  readonly pPrime: Point2D;
}

/**
 * Optional diagnostic residuals reported by the generator (L2).
 * Under Zero-Trust, L7 MUST ignore these values and recompute residuals independently.
 */
export interface ReflectionWitnessClaimedResiduals {
  readonly maxMidpointError: number;
  readonly maxCollinearityError: number;
}

/**
 * Certifying reflection witness emitted by L2 and independently checked by L7.
 */
export interface ReflectionWitness {
  readonly witnessId: string;
  readonly operationId: string;
  readonly operationRequestId: string;
  readonly operation: 'REFLECTION_ACROSS_LINE';
  readonly sourceStateId: string;
  readonly sourceStateVersion: number;
  readonly targetStateId: string;
  readonly targetStateVersion: number;
  readonly axis: {
    readonly n: {
      readonly nx: number;
      readonly ny: number;
    };
    readonly c: number;
  };
  readonly movingVertexIds: readonly VertexId[];
  readonly fixedVertexIds: readonly VertexId[];
  readonly vertexPairs: readonly ReflectionWitnessVertexPair[];
  readonly claimedResiduals?: ReflectionWitnessClaimedResiduals;
}

export interface TraceEntry {
  readonly operationId: string;
  readonly operationRequestId: string;
  readonly stepIndex: number;
  readonly operation: 'REFLECTION_ACROSS_LINE';
  readonly sourceStateVersion: number;
  readonly targetStateVersion: number;
  readonly sourceState: GeometryState;
  readonly resultingState: GeometryState;
  readonly parameters: ReflectionParameters;
  readonly request: OperationRequest;
  readonly witness: ReflectionWitness;
  readonly precision: number;
  readonly provenance: string;
  readonly timestamp: string;
}

export interface VerifierTolerances {
  readonly epsilon: number;
  readonly areaEpsilon: number;
  readonly zeroNormalEpsilon: number;
  readonly degenerateAreaEpsilon: number;
}

export interface VerificationClaim {
  readonly sourceState: GeometryState;
  readonly resultingState: GeometryState;
  readonly operation: 'REFLECTION_ACROSS_LINE';
  readonly parameters: ReflectionParameters;
  readonly witness: ReflectionWitness;
}

export interface VerificationResiduals {
  readonly midpointError: number;
  readonly collinearityError: number;
  readonly maxFixedDisplacement: number;
  readonly maxLengthError: number;
  readonly areaError: number;
}

export interface VerificationPredicates {
  readonly requestBound: boolean;
  readonly witnessBound: boolean;
  readonly axiomsSatisfied: boolean;
  readonly lengthsPreserved: boolean;
  readonly areaPreserved: boolean;
  readonly orientationInverted: boolean;
  readonly fixedVerticesUnchanged: boolean;
  readonly idsPreserved: boolean;
  readonly traceContinuous: boolean;
}

export type VerificationStatus = 'PASS' | 'FAIL' | 'UNDETERMINED';

export interface VerificationVerdict {
  readonly status: VerificationStatus;
  readonly mode: 'RESULT_VERIFICATION' | 'PROCESS_VERIFICATION';
  readonly residuals: VerificationResiduals;
  readonly predicates: VerificationPredicates;
  readonly diagnostics: readonly string[];
}
