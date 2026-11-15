/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Trusted OperationRequest factory & defensive immutable cloning.
 * Separates the authoritative operation intent from L2's VerificationClaim
 * and ReflectionWitness so L7 can verify correspondence to the original task.
 */

import { deepFreeze } from './trace';
import type {
  GeometryState,
  LineNormalParams,
  OperationRequest,
  VertexId,
} from './types';

export class OperationRequestError extends Error {
  readonly code: 'INVALID_OPERATION_REQUEST';

  constructor(message: string) {
    super(message);
    this.name = 'OperationRequestError';
    this.code = 'INVALID_OPERATION_REQUEST';
  }
}

export interface CreateOperationRequestInput {
  readonly operationRequestId?: string;
  readonly operation?: 'REFLECTION_ACROSS_LINE';
  readonly sourceState: GeometryState;
  readonly line: LineNormalParams;
  readonly movingVertexIds: readonly VertexId[];
  readonly fixedVertexIds?: readonly VertexId[];
  readonly requestProvenance?: string;
  readonly timestamp?: string;
}

let requestSequenceCounter = 0;

/**
 * Builds and deeply freezes an authoritative OperationRequest bound to a specific
 * sourceStateId and sourceStateVersion.
 */
export function createOperationRequest(
  input: CreateOperationRequestInput
): OperationRequest {
  if (!input || typeof input !== 'object') {
    throw new OperationRequestError('OperationRequest input must be an object');
  }
  if (!input.sourceState || typeof input.sourceState !== 'object') {
    throw new OperationRequestError('OperationRequest requires a valid sourceState');
  }
  if (
    typeof input.sourceState.stateId !== 'string' ||
    input.sourceState.stateId.trim().length === 0
  ) {
    throw new OperationRequestError('sourceState.stateId must be a non-empty string');
  }
  if (
    typeof input.sourceState.version !== 'number' ||
    !Number.isFinite(input.sourceState.version)
  ) {
    throw new OperationRequestError('sourceState.version must be a finite number');
  }

  const operation = input.operation ?? 'REFLECTION_ACROSS_LINE';
  if (operation !== 'REFLECTION_ACROSS_LINE') {
    throw new OperationRequestError(
      `Unsupported operation type in v0.x: ${String(operation)}`
    );
  }

  const operationRequestId =
    input.operationRequestId ??
    `req-reflect-v${input.sourceState.version}-${String(++requestSequenceCounter).padStart(4, '0')}`;
  if (typeof operationRequestId !== 'string' || operationRequestId.trim().length === 0) {
    throw new OperationRequestError('operationRequestId must be a non-empty string');
  }

  const requestProvenance =
    input.requestProvenance ?? 'OMR_TRUSTED_REQUEST_AUTHORITY';
  if (typeof requestProvenance !== 'string' || requestProvenance.trim().length === 0) {
    throw new OperationRequestError('requestProvenance must be a non-empty string');
  }

  const movingCopy = [...input.movingVertexIds];
  const movingSet = new Set<VertexId>(movingCopy);
  const derivedFixedIds = input.sourceState.vertices
    .filter((v) => !movingSet.has(v.id))
    .map((v) => v.id);
  const fixedCopy = input.fixedVertexIds
    ? [...input.fixedVertexIds]
    : derivedFixedIds;

  const request: OperationRequest = {
    operationRequestId,
    operation,
    sourceStateId: input.sourceState.stateId,
    sourceStateVersion: input.sourceState.version,
    parameters: {
      line: {
        nx: input.line.nx,
        ny: input.line.ny,
        c: input.line.c,
      },
      movingVertexIds: [...movingCopy],
      fixedVertexIds: [...fixedCopy],
    },
    movingVertexIds: movingCopy,
    fixedVertexIds: fixedCopy,
    requestProvenance,
    timestamp: input.timestamp ?? new Date().toISOString(),
  };

  return deepFreeze(request);
}

/**
 * Returns a deeply frozen structural clone of an OperationRequest.
 */
export function cloneOperationRequest(
  request: OperationRequest
): OperationRequest {
  const cloned: OperationRequest = {
    operationRequestId: request.operationRequestId,
    operation: request.operation,
    sourceStateId: request.sourceStateId,
    sourceStateVersion: request.sourceStateVersion,
    parameters: {
      line: {
        nx: request.parameters.line.nx,
        ny: request.parameters.line.ny,
        c: request.parameters.line.c,
      },
      movingVertexIds: [...request.parameters.movingVertexIds],
      fixedVertexIds: [...request.parameters.fixedVertexIds],
    },
    movingVertexIds: [...request.movingVertexIds],
    fixedVertexIds: [...request.fixedVertexIds],
    requestProvenance: request.requestProvenance,
    ...(request.timestamp !== undefined ? { timestamp: request.timestamp } : {}),
  };

  return deepFreeze(cloned);
}
