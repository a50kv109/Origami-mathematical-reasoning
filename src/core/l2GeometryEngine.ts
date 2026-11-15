/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * L2 — Certifying Deterministic 2D Geometry Engine
 * Implements general affine reflection via normal projection:
 *   p' = p - 2 * ((n · p - c) / (n · n)) * n
 * and emits an immutable ReflectionWitness bound to source and resulting states.
 *
 * Policy:
 * - Zero rounding (.toFixed forbidden); coordinates stored in IEEE-754 double precision.
 * - Preserves all VertexIDs, EdgeIDs, and FaceIDs.
 * - Transforms only movingVertexIds; leaves fixedVertexIds untouched.
 */

import {
  cloneGeometryState,
  cloneOperationRequestSnapshot,
  cloneReflectionWitness,
  createTraceEntry,
  deepFreeze,
} from './trace';
import type {
  Edge2D,
  Face2D,
  GeometryState,
  LineNormalParams,
  OperationRequest,
  Point2D,
  ReflectionWitness,
  ReflectionWitnessVertexPair,
  TraceEntry,
  Vertex2D,
  VertexId,
} from './types';

export const L2_SOLVER_PROVENANCE = 'OMR_L2_CERTIFYING_GEOMETRY_ENGINE_V2';
const L2_DEFAULT_ZERO_NORMAL_THRESHOLD = 1e-12;

export type L2ErrorCode =
  | 'INVALID_COORDINATE'
  | 'DEGENERATE_NORMAL'
  | 'UNKNOWN_VERTEX_ID'
  | 'DUPLICATE_VERTEX_ID'
  | 'INVALID_OPERATION_REQUEST'
  | 'REQUEST_STATE_MISMATCH';

export class L2EngineError extends Error {
  readonly code: L2ErrorCode;

  constructor(code: L2ErrorCode, message: string) {
    super(message);
    this.name = 'L2EngineError';
    this.code = code;
  }
}

function assertFiniteNumber(value: number, label: string): void {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new L2EngineError(
      'INVALID_COORDINATE',
      `${label} must be a finite IEEE-754 number, received ${String(value)}`
    );
  }
}

function validateLineParams(
  line: LineNormalParams,
  zeroNormalEps: number
): { nx: number; ny: number; c: number; normSq: number; norm: number } {
  assertFiniteNumber(line.nx, 'line.nx');
  assertFiniteNumber(line.ny, 'line.ny');
  assertFiniteNumber(line.c, 'line.c');

  const norm = Math.hypot(line.nx, line.ny);
  const normSq = line.nx * line.nx + line.ny * line.ny;
  if (
    norm <= zeroNormalEps ||
    !Number.isFinite(norm) ||
    !Number.isFinite(normSq) ||
    normSq === 0
  ) {
    throw new L2EngineError(
      'DEGENERATE_NORMAL',
      `Line normal (${line.nx}, ${line.ny}) is degenerate (||n|| = ${norm} <= ${zeroNormalEps})`
    );
  }

  return { nx: line.nx, ny: line.ny, c: line.c, normSq, norm };
}

function validateGeometryState(state: GeometryState): Set<VertexId> {
  assertFiniteNumber(state.version, 'state.version');
  const idSet = new Set<VertexId>();

  for (const vertex of state.vertices) {
    if (idSet.has(vertex.id)) {
      throw new L2EngineError(
        'DUPLICATE_VERTEX_ID',
        `Duplicate VertexID in sourceState: ${vertex.id}`
      );
    }
    idSet.add(vertex.id);
    assertFiniteNumber(vertex.position.x, `vertex[${vertex.id}].x`);
    assertFiniteNumber(vertex.position.y, `vertex[${vertex.id}].y`);
  }

  return idSet;
}

function sameStringSet(a: readonly string[], b: readonly string[]): boolean {
  if (a.length !== b.length) return false;
  const setA = new Set(a);
  const setB = new Set(b);
  if (setA.size !== setB.size) return false;
  for (const item of setA) {
    if (!setB.has(item)) return false;
  }
  return true;
}

export function createInitialGeometryState(input: {
  readonly stateId?: string;
  readonly version?: number;
  readonly vertices: readonly Vertex2D[];
  readonly edges: readonly Edge2D[];
  readonly faces: readonly Face2D[];
}): GeometryState {
  const version = input.version ?? 0;
  const state: GeometryState = {
    stateId: input.stateId ?? `state-v${version}`,
    version,
    vertices: input.vertices.map((v) => ({
      id: v.id,
      position: { x: v.position.x, y: v.position.y },
    })),
    edges: input.edges.map((e) => ({
      id: e.id,
      startVertexId: e.startVertexId,
      endVertexId: e.endVertexId,
    })),
    faces: input.faces.map((f) => ({
      id: f.id,
      vertexIds: [...f.vertexIds],
    })),
  };

  validateGeometryState(state);
  return deepFreeze(state);
}

export interface ReflectAcrossLineInput {
  readonly request: OperationRequest;
  readonly sourceState: GeometryState;
  readonly operationId?: string;
  readonly witnessId?: string;
  readonly targetStateId?: string;
  readonly stepIndex?: number;
  readonly precisionContext?: number;
  readonly zeroNormalEpsilon?: number;
  readonly timestamp?: string;
}

export interface ReflectAcrossLineOutput {
  readonly resultingState: GeometryState;
  readonly witness: ReflectionWitness;
  readonly traceEntry: TraceEntry;
}

/**
 * Reflects movingVertexIds defined in the trusted OperationRequest across line nx*x + ny*y = c
 * using normal projection:
 *   p' = p - 2 * ((n · p - c) / (n · n)) * n
 * Emits deeply frozen resultingState, ReflectionWitness (bound to operationRequestId), and TraceEntry.
 */
export function reflectAcrossLine(
  input: ReflectAcrossLineInput
): ReflectAcrossLineOutput {
  if (!input.request || typeof input.request !== 'object') {
    throw new L2EngineError(
      'INVALID_OPERATION_REQUEST',
      'reflectAcrossLine requires a trusted OperationRequest'
    );
  }

  const request = cloneOperationRequestSnapshot(input.request);

  if (
    typeof request.operationRequestId !== 'string' ||
    request.operationRequestId.trim().length === 0
  ) {
    throw new L2EngineError(
      'INVALID_OPERATION_REQUEST',
      'OperationRequest.operationRequestId must be a non-empty string'
    );
  }
  if (
    typeof request.requestProvenance !== 'string' ||
    request.requestProvenance.trim().length === 0
  ) {
    throw new L2EngineError(
      'INVALID_OPERATION_REQUEST',
      'OperationRequest.requestProvenance must be a non-empty string'
    );
  }
  if (request.operation !== 'REFLECTION_ACROSS_LINE') {
    throw new L2EngineError(
      'INVALID_OPERATION_REQUEST',
      `Unsupported operation in OperationRequest: ${String(request.operation)}`
    );
  }

  if (
    input.sourceState.stateId !== request.sourceStateId ||
    input.sourceState.version !== request.sourceStateVersion
  ) {
    throw new L2EngineError(
      'REQUEST_STATE_MISMATCH',
      `Supplied sourceState (${input.sourceState.stateId}@v${input.sourceState.version}) does not match OperationRequest (${request.sourceStateId}@v${request.sourceStateVersion})`
    );
  }

  if (
    !sameStringSet(request.movingVertexIds, request.parameters.movingVertexIds) ||
    !sameStringSet(request.fixedVertexIds, request.parameters.fixedVertexIds)
  ) {
    throw new L2EngineError(
      'INVALID_OPERATION_REQUEST',
      'OperationRequest top-level moving/fixed vertex lists differ from parameters'
    );
  }

  const zeroNormalEps =
    input.zeroNormalEpsilon ?? L2_DEFAULT_ZERO_NORMAL_THRESHOLD;
  const vertexIds = validateGeometryState(input.sourceState);
  const { nx, ny, c, normSq, norm } = validateLineParams(
    request.parameters.line,
    zeroNormalEps
  );

  const movingSet = new Set<VertexId>();
  for (const id of request.movingVertexIds) {
    if (!vertexIds.has(id)) {
      throw new L2EngineError(
        'UNKNOWN_VERTEX_ID',
        `OperationRequest movingVertexIds references unknown VertexID: ${id}`
      );
    }
    if (movingSet.has(id)) {
      throw new L2EngineError(
        'DUPLICATE_VERTEX_ID',
        `OperationRequest movingVertexIds contains duplicate VertexID: ${id}`
      );
    }
    movingSet.add(id);
  }

  const fixedSet = new Set<VertexId>();
  for (const id of request.fixedVertexIds) {
    if (!vertexIds.has(id)) {
      throw new L2EngineError(
        'UNKNOWN_VERTEX_ID',
        `OperationRequest fixedVertexIds references unknown VertexID: ${id}`
      );
    }
    if (fixedSet.has(id)) {
      throw new L2EngineError(
        'DUPLICATE_VERTEX_ID',
        `OperationRequest fixedVertexIds contains duplicate VertexID: ${id}`
      );
    }
    if (movingSet.has(id)) {
      throw new L2EngineError(
        'INVALID_OPERATION_REQUEST',
        `VertexID ${id} appears in both movingVertexIds and fixedVertexIds`
      );
    }
    fixedSet.add(id);
  }

  for (const id of vertexIds) {
    if (!movingSet.has(id) && !fixedSet.has(id)) {
      throw new L2EngineError(
        'INVALID_OPERATION_REQUEST',
        `OperationRequest moving/fixed partition omits sourceState VertexID: ${id}`
      );
    }
  }

  const orderedMovingIds = input.sourceState.vertices
    .filter((v) => movingSet.has(v.id))
    .map((v) => v.id);
  const orderedFixedIds = input.sourceState.vertices
    .filter((v) => fixedSet.has(v.id))
    .map((v) => v.id);

  const vertexPairs: ReflectionWitnessVertexPair[] = [];
  let maxMidpointError = 0;
  let maxCollinearityError = 0;

  const transformedVertices: Vertex2D[] = input.sourceState.vertices.map(
    (vertex) => {
      if (!movingSet.has(vertex.id)) {
        return {
          id: vertex.id,
          position: { x: vertex.position.x, y: vertex.position.y },
        };
      }

      const p: Point2D = vertex.position;
      const signedOffset = nx * p.x + ny * p.y - c;
      const factor = (2 * signedOffset) / normSq;
      const pPrime: Point2D = {
        x: p.x - factor * nx,
        y: p.y - factor * ny,
      };

      vertexPairs.push({
        vertexId: vertex.id,
        p: { x: p.x, y: p.y },
        pPrime: { x: pPrime.x, y: pPrime.y },
      });

      const midRes =
        Math.abs(nx * (p.x + pPrime.x) + ny * (p.y + pPrime.y) - 2 * c) /
        (2 * norm);
      const colRes =
        Math.abs((pPrime.x - p.x) * ny - (pPrime.y - p.y) * nx) / norm;
      if (midRes > maxMidpointError) maxMidpointError = midRes;
      if (colRes > maxCollinearityError) maxCollinearityError = colRes;

      return {
        id: vertex.id,
        position: pPrime,
      };
    }
  );

  const stepIndex = input.stepIndex ?? input.sourceState.version;
  const nextVersion = input.sourceState.version + 1;
  const defaultTargetStateId = `state-v${nextVersion}`;
  const targetStateId =
    input.targetStateId ??
    (defaultTargetStateId === input.sourceState.stateId
      ? `${defaultTargetStateId}-s${stepIndex}`
      : defaultTargetStateId);

  const nextState = cloneGeometryState({
    stateId: targetStateId,
    version: nextVersion,
    vertices: transformedVertices,
    edges: input.sourceState.edges,
    faces: input.sourceState.faces,
  });

  const operationId =
    input.operationId ?? `op-reflect-step-${String(stepIndex).padStart(3, '0')}`;

  const witness = cloneReflectionWitness({
    witnessId: input.witnessId ?? `witness-${operationId}`,
    operationId,
    operationRequestId: request.operationRequestId,
    operation: 'REFLECTION_ACROSS_LINE',
    sourceStateId: input.sourceState.stateId,
    sourceStateVersion: input.sourceState.version,
    targetStateId: nextState.stateId,
    targetStateVersion: nextState.version,
    axis: {
      n: { nx, ny },
      c,
    },
    movingVertexIds: orderedMovingIds,
    fixedVertexIds: orderedFixedIds,
    vertexPairs,
    claimedResiduals: {
      maxMidpointError,
      maxCollinearityError,
    },
  });

  const traceEntry = createTraceEntry({
    operationId,
    stepIndex,
    sourceState: input.sourceState,
    resultingState: nextState,
    parameters: {
      line: { nx, ny, c },
      movingVertexIds: orderedMovingIds,
      fixedVertexIds: orderedFixedIds,
    },
    request,
    witness,
    precision: input.precisionContext ?? 1e-7,
    provenance: L2_SOLVER_PROVENANCE,
    timestamp: input.timestamp,
  });

  return {
    resultingState: nextState,
    witness,
    traceEntry,
  };
}
