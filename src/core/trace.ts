/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Structured immutable TRACE journal for Contract 02 v2 transitions.
 */

import type {
  GeometryState,
  ReflectionParameters,
  ReflectionWitness,
  TraceEntry,
} from './types';

/**
 * Recursively freezes an object graph so snapshots and witnesses inside TRACE cannot be mutated.
 */
export function deepFreeze<T>(value: T): T {
  if (value === null || typeof value !== 'object') {
    return value;
  }

  if (!Object.isFrozen(value)) {
    Object.freeze(value);
  }

  const propNames = Object.getOwnPropertyNames(value);
  for (const name of propNames) {
    const prop = (value as Record<string, unknown>)[name];
    if (prop !== null && typeof prop === 'object') {
      deepFreeze(prop);
    }
  }

  return value;
}

/**
 * Creates a deep, immutable clone of a GeometryState snapshot (IEEE-754 coordinates preserved).
 */
export function cloneGeometryState(state: GeometryState): GeometryState {
  const cloned: GeometryState = {
    stateId: state.stateId,
    version: state.version,
    vertices: state.vertices.map((v) => ({
      id: v.id,
      position: { x: v.position.x, y: v.position.y },
    })),
    edges: state.edges.map((e) => ({
      id: e.id,
      startVertexId: e.startVertexId,
      endVertexId: e.endVertexId,
    })),
    faces: state.faces.map((f) => ({
      id: f.id,
      vertexIds: [...f.vertexIds],
    })),
  };

  return deepFreeze(cloned);
}

/**
 * Creates a deep, immutable clone of a ReflectionWitness.
 */
export function cloneReflectionWitness(
  witness: ReflectionWitness
): ReflectionWitness {
  const cloned: ReflectionWitness = {
    witnessId: witness.witnessId,
    operationId: witness.operationId,
    operation: witness.operation,
    sourceStateId: witness.sourceStateId,
    sourceStateVersion: witness.sourceStateVersion,
    targetStateId: witness.targetStateId,
    targetStateVersion: witness.targetStateVersion,
    axis: {
      n: {
        nx: witness.axis.n.nx,
        ny: witness.axis.n.ny,
      },
      c: witness.axis.c,
    },
    movingVertexIds: [...witness.movingVertexIds],
    fixedVertexIds: [...witness.fixedVertexIds],
    vertexPairs: witness.vertexPairs.map((pair) => ({
      vertexId: pair.vertexId,
      p: { x: pair.p.x, y: pair.p.y },
      pPrime: { x: pair.pPrime.x, y: pair.pPrime.y },
    })),
    ...(witness.claimedResiduals !== undefined
      ? {
          claimedResiduals: {
            maxMidpointError: witness.claimedResiduals.maxMidpointError,
            maxCollinearityError: witness.claimedResiduals.maxCollinearityError,
          },
        }
      : {}),
  };

  return deepFreeze(cloned);
}

export interface CreateTraceEntryInput {
  readonly operationId: string;
  readonly stepIndex: number;
  readonly sourceState: GeometryState;
  readonly resultingState: GeometryState;
  readonly parameters: ReflectionParameters;
  readonly witness: ReflectionWitness;
  readonly precision: number;
  readonly provenance: string;
  readonly timestamp?: string;
}

/**
 * Constructs an immutable TraceEntry with deeply frozen states and witness.
 */
export function createTraceEntry(input: CreateTraceEntryInput): TraceEntry {
  const entry: TraceEntry = {
    operationId: input.operationId,
    stepIndex: input.stepIndex,
    operation: 'REFLECTION_ACROSS_LINE',
    sourceStateVersion: input.sourceState.version,
    targetStateVersion: input.resultingState.version,
    sourceState: cloneGeometryState(input.sourceState),
    resultingState: cloneGeometryState(input.resultingState),
    parameters: {
      line: {
        nx: input.parameters.line.nx,
        ny: input.parameters.line.ny,
        c: input.parameters.line.c,
      },
      movingVertexIds: [...input.parameters.movingVertexIds],
      fixedVertexIds: [...input.parameters.fixedVertexIds],
    },
    witness: cloneReflectionWitness(input.witness),
    precision: input.precision,
    provenance: input.provenance,
    timestamp: input.timestamp ?? new Date().toISOString(),
  };

  return deepFreeze(entry);
}

/**
 * Returns a new frozen TRACE array with the given entry appended.
 */
export function appendTraceEntry(
  trace: readonly TraceEntry[],
  entry: TraceEntry
): readonly TraceEntry[] {
  return Object.freeze([...trace, deepFreeze(entry)]);
}
