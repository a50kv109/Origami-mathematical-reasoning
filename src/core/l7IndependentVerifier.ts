/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * L7 — Axiomatic Certifying Zero-Trust Geometric Verifier (Contract 02 v2 · Phase 2.2 Hardened)
 *
 * CRITICAL ISOLATION RULE:
 * This module MUST NOT import any runtime functions or geometry helpers from L2, TRACE, or OperationRequest factories.
 * Only pure TypeScript contract types (`import type ... from './types'`) are permitted.
 *
 * Independent Mathematical Model (Certifying Algorithms Paradigm + Trusted Request Binding):
 * L7 verifies both:
 *   1. Mathematical validity of the resulting geometry via scale-normalized reflection axioms and metric invariants.
 *   2. Strict correspondence to the separate, trusted OperationRequest (detecting coordinated substitution of claim + witness).
 *
 * Verification Stages:
 *   Stage A: Input admissibility validation (finite IEEE-754 numbers, ||n|| > zeroNormalEpsilon -> else UNDETERMINED)
 *   Stage B: Trusted OperationRequest binding & three-way witness binding (request <-> claim <-> witness <-> states)
 *   Stage C: Reflection axioms evaluated against both the trusted request axis and claim axis:
 *              r_mid  = |n · (p + p') - 2c| / (2 ||n||) <= epsilon
 *              r_perp = |(p' - p) × n| / ||n|| <= epsilon
 *   Stage D: Scope-aware metric invariants (purely moving & purely fixed edges/faces preserve lengths & |area|;
 *            non-degenerate purely moving faces strictly invert signed orientation; boundary/mixed elements excluded).
 *
 * Under Zero-Trust, L7 completely ignores witness.claimedResiduals and never trusts claim/witness as the task authority.
 */

import type {
  Edge2D,
  Face2D,
  GeometryState,
  LineNormalParams,
  OperationRequest,
  Point2D,
  ReflectionWitnessVertexPair,
  TraceEntry,
  VerificationClaim,
  VerificationPredicates,
  VerificationResiduals,
  VerificationStatus,
  VerificationVerdict,
  VerifierTolerances,
  VertexId,
} from './types';

export const DEFAULT_VERIFIER_TOLERANCES: VerifierTolerances = {
  epsilon: 1e-7,
  areaEpsilon: 1e-7,
  zeroNormalEpsilon: 1e-12,
  degenerateAreaEpsilon: 1e-12,
};

function resolveTolerances(
  overrides?: Partial<VerifierTolerances>
): VerifierTolerances {
  const epsilon = overrides?.epsilon ?? DEFAULT_VERIFIER_TOLERANCES.epsilon;
  return {
    epsilon,
    areaEpsilon: overrides?.areaEpsilon ?? epsilon,
    zeroNormalEpsilon:
      overrides?.zeroNormalEpsilon ??
      DEFAULT_VERIFIER_TOLERANCES.zeroNormalEpsilon,
    degenerateAreaEpsilon:
      overrides?.degenerateAreaEpsilon ??
      DEFAULT_VERIFIER_TOLERANCES.degenerateAreaEpsilon,
  };
}

function isFiniteNumber(n: unknown): n is number {
  return typeof n === 'number' && Number.isFinite(n);
}

function euclideanDistance(a: Point2D, b: Point2D): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

/**
 * Autonomous Shoelace signed area formula:
 * Positive for counter-clockwise orientation, negative for clockwise.
 */
function computeSignedArea(points: readonly Point2D[]): number {
  if (points.length < 3) return 0;
  let sum = 0;
  for (let i = 0; i < points.length; i++) {
    const curr = points[i];
    const next = points[(i + 1) % points.length];
    sum += curr.x * next.y - next.x * curr.y;
  }
  return sum / 2;
}

function zeroResiduals(): VerificationResiduals {
  return {
    midpointError: 0,
    collinearityError: 0,
    maxFixedDisplacement: 0,
    maxLengthError: 0,
    areaError: 0,
  };
}

function defaultFalsePredicates(
  traceContinuous: boolean,
  requestBound = false
): VerificationPredicates {
  return {
    requestBound,
    witnessBound: false,
    axiomsSatisfied: false,
    lengthsPreserved: false,
    areaPreserved: false,
    orientationInverted: false,
    fixedVerticesUnchanged: false,
    idsPreserved: false,
    traceContinuous,
  };
}

function buildVertexMap(state: GeometryState): {
  map: Map<VertexId, Point2D>;
  hasDuplicateVertexIds: boolean;
  hasDuplicateEdgeIds: boolean;
  hasDuplicateFaceIds: boolean;
  hasInvalidNumber: boolean;
} {
  const map = new Map<VertexId, Point2D>();
  let hasDuplicateVertexIds = false;
  let hasInvalidNumber = !isFiniteNumber(state.version);

  for (const v of state.vertices) {
    if (map.has(v.id)) {
      hasDuplicateVertexIds = true;
    }
    if (!isFiniteNumber(v.position.x) || !isFiniteNumber(v.position.y)) {
      hasInvalidNumber = true;
    }
    map.set(v.id, v.position);
  }

  const edgeIds = new Set<string>();
  let hasDuplicateEdgeIds = false;
  for (const e of state.edges) {
    if (edgeIds.has(e.id)) {
      hasDuplicateEdgeIds = true;
    }
    edgeIds.add(e.id);
  }

  const faceIds = new Set<string>();
  let hasDuplicateFaceIds = false;
  for (const f of state.faces) {
    if (faceIds.has(f.id)) {
      hasDuplicateFaceIds = true;
    }
    faceIds.add(f.id);
  }

  return {
    map,
    hasDuplicateVertexIds,
    hasDuplicateEdgeIds,
    hasDuplicateFaceIds,
    hasInvalidNumber,
  };
}

function collectIdSet(ids: readonly VertexId[]): {
  set: Set<VertexId>;
  hasDuplicates: boolean;
} {
  const set = new Set<VertexId>();
  let hasDuplicates = false;
  for (const id of ids) {
    if (set.has(id)) {
      hasDuplicates = true;
    }
    set.add(id);
  }
  return { set, hasDuplicates };
}

function setsEqual(a: ReadonlySet<string>, b: ReadonlySet<string>): boolean {
  if (a.size !== b.size) return false;
  for (const item of a) {
    if (!b.has(item)) return false;
  }
  return true;
}

function stringArraysIdentical(
  a: readonly string[],
  b: readonly string[]
): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

function edgesMatch(
  a: readonly Edge2D[],
  b: readonly Edge2D[]
): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (
      a[i].id !== b[i].id ||
      a[i].startVertexId !== b[i].startVertexId ||
      a[i].endVertexId !== b[i].endVertexId
    ) {
      return false;
    }
  }
  return true;
}

function facesMatch(
  a: readonly Face2D[],
  b: readonly Face2D[]
): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (
      a[i].id !== b[i].id ||
      a[i].vertexIds.length !== b[i].vertexIds.length
    ) {
      return false;
    }
    for (let j = 0; j < a[i].vertexIds.length; j++) {
      if (a[i].vertexIds[j] !== b[i].vertexIds[j]) return false;
    }
  }
  return true;
}

function statesStructurallyIdentical(
  a: GeometryState,
  b: GeometryState
): boolean {
  if (a.stateId !== b.stateId || a.version !== b.version) return false;
  if (a.vertices.length !== b.vertices.length) return false;
  for (let i = 0; i < a.vertices.length; i++) {
    if (
      a.vertices[i].id !== b.vertices[i].id ||
      a.vertices[i].position.x !== b.vertices[i].position.x ||
      a.vertices[i].position.y !== b.vertices[i].position.y
    ) {
      return false;
    }
  }
  return edgesMatch(a.edges, b.edges) && facesMatch(a.faces, b.faces);
}

function requestsStructurallyIdentical(
  a: OperationRequest,
  b: OperationRequest
): boolean {
  return (
    a.operationRequestId === b.operationRequestId &&
    a.operation === b.operation &&
    a.sourceStateId === b.sourceStateId &&
    a.sourceStateVersion === b.sourceStateVersion &&
    a.requestProvenance === b.requestProvenance &&
    a.parameters.line.nx === b.parameters.line.nx &&
    a.parameters.line.ny === b.parameters.line.ny &&
    a.parameters.line.c === b.parameters.line.c &&
    stringArraysIdentical(a.movingVertexIds, b.movingVertexIds) &&
    stringArraysIdentical(a.fixedVertexIds, b.fixedVertexIds) &&
    stringArraysIdentical(
      a.parameters.movingVertexIds,
      b.parameters.movingVertexIds
    ) &&
    stringArraysIdentical(
      a.parameters.fixedVertexIds,
      b.parameters.fixedVertexIds
    )
  );
}

/**
 * Mode 1: RESULT VERIFICATION (Trusted OperationRequest + Certifying Witness + Axiomatic Verification)
 * Independently validates both mathematical correctness and strict adherence to the separate OperationRequest.
 */
export function verifyResult(
  claim: VerificationClaim,
  request: OperationRequest,
  toleranceOverrides?: Partial<VerifierTolerances>
): VerificationVerdict {
  const tol = resolveTolerances(toleranceOverrides);
  const diagnostics: string[] = [];

  if (!request || typeof request !== 'object') {
    diagnostics.push(
      'REQUEST_MISSING: verifyResult requires a separate trusted OperationRequest'
    );
    return {
      status: 'FAIL',
      mode: 'RESULT_VERIFICATION',
      residuals: zeroResiduals(),
      predicates: defaultFalsePredicates(true, false),
      diagnostics,
    };
  }

  if (!claim || typeof claim !== 'object') {
    diagnostics.push('CLAIM_MISSING: VerificationClaim is required');
    return {
      status: 'FAIL',
      mode: 'RESULT_VERIFICATION',
      residuals: zeroResiduals(),
      predicates: defaultFalsePredicates(true, false),
      diagnostics,
    };
  }

  const witness = claim.witness;
  if (!witness || typeof witness !== 'object') {
    diagnostics.push('WITNESS_MISSING: VerificationClaim must provide a ReflectionWitness');
    return {
      status: 'FAIL',
      mode: 'RESULT_VERIFICATION',
      residuals: zeroResiduals(),
      predicates: defaultFalsePredicates(true, false),
      diagnostics,
    };
  }

  const line = claim.parameters?.line;
  const reqLine = request.parameters?.line;
  if (!line || !reqLine) {
    diagnostics.push('AXIS_PARAMETERS_MISSING: line parameters missing in claim or request');
    return {
      status: 'FAIL',
      mode: 'RESULT_VERIFICATION',
      residuals: zeroResiduals(),
      predicates: defaultFalsePredicates(true, false),
      diagnostics,
    };
  }

  // =========================================================================
  // STAGE A: Input Admissibility Validation (non-finite or ||n|| <= epsZero -> UNDETERMINED)
  // =========================================================================
  const src = buildVertexMap(claim.sourceState);
  const dst = buildVertexMap(claim.resultingState);

  let witnessHasInvalidNumber =
    !isFiniteNumber(witness.sourceStateVersion) ||
    !isFiniteNumber(witness.targetStateVersion) ||
    !isFiniteNumber(witness.axis?.n?.nx) ||
    !isFiniteNumber(witness.axis?.n?.ny) ||
    !isFiniteNumber(witness.axis?.c);

  if (!witnessHasInvalidNumber) {
    for (const pair of witness.vertexPairs) {
      if (
        !isFiniteNumber(pair.p?.x) ||
        !isFiniteNumber(pair.p?.y) ||
        !isFiniteNumber(pair.pPrime?.x) ||
        !isFiniteNumber(pair.pPrime?.y)
      ) {
        witnessHasInvalidNumber = true;
        break;
      }
    }
  }

  const requestHasInvalidNumber =
    !isFiniteNumber(request.sourceStateVersion) ||
    !isFiniteNumber(reqLine.nx) ||
    !isFiniteNumber(reqLine.ny) ||
    !isFiniteNumber(reqLine.c);

  if (
    !isFiniteNumber(line.nx) ||
    !isFiniteNumber(line.ny) ||
    !isFiniteNumber(line.c) ||
    src.hasInvalidNumber ||
    dst.hasInvalidNumber ||
    witnessHasInvalidNumber ||
    requestHasInvalidNumber
  ) {
    diagnostics.push(
      'UNDETERMINED: numeric inputs (request, axis, state version, vertex coordinates, or witness pairs) contain non-finite IEEE-754 values'
    );
    return {
      status: 'UNDETERMINED',
      mode: 'RESULT_VERIFICATION',
      residuals: zeroResiduals(),
      predicates: defaultFalsePredicates(true, false),
      diagnostics,
    };
  }

  const normRequest = Math.hypot(reqLine.nx, reqLine.ny);
  const normClaim = Math.hypot(line.nx, line.ny);
  const normWitness = Math.hypot(witness.axis.n.nx, witness.axis.n.ny);
  if (
    !isFiniteNumber(normRequest) ||
    normRequest <= tol.zeroNormalEpsilon ||
    !isFiniteNumber(normClaim) ||
    normClaim <= tol.zeroNormalEpsilon ||
    !isFiniteNumber(normWitness) ||
    normWitness <= tol.zeroNormalEpsilon
  ) {
    diagnostics.push(
      `UNDETERMINED: degenerate axis normal (request ||n||=${normRequest}, claim ||n||=${normClaim}, witness ||n||=${normWitness}, epsZero=${tol.zeroNormalEpsilon})`
    );
    return {
      status: 'UNDETERMINED',
      mode: 'RESULT_VERIFICATION',
      residuals: zeroResiduals(),
      predicates: defaultFalsePredicates(true, false),
      diagnostics,
    };
  }

  // =========================================================================
  // STAGE B: Trusted OperationRequest Binding & Three-Way Witness Binding
  // Note: witness.claimedResiduals is intentionally ignored (Zero-Trust).
  // =========================================================================
  let requestBound = true;
  let witnessBound = true;

  if (
    typeof request.operationRequestId !== 'string' ||
    request.operationRequestId.trim().length === 0 ||
    typeof request.requestProvenance !== 'string' ||
    request.requestProvenance.trim().length === 0 ||
    typeof request.sourceStateId !== 'string' ||
    request.sourceStateId.trim().length === 0
  ) {
    requestBound = false;
    diagnostics.push(
      'REQUEST_METADATA_INVALID: missing operationRequestId, sourceStateId, or requestProvenance'
    );
  }

  if (request.operation !== 'REFLECTION_ACROSS_LINE') {
    requestBound = false;
    diagnostics.push(
      `REQUEST_OPERATION_UNSUPPORTED: request.operation=${String(request.operation)}`
    );
  }

  if (
    claim.operation !== 'REFLECTION_ACROSS_LINE' ||
    witness.operation !== 'REFLECTION_ACROSS_LINE'
  ) {
    witnessBound = false;
    requestBound = false;
    diagnostics.push(
      `OPERATION_MISMATCH: request=${request.operation}, claim=${claim.operation}, witness=${witness.operation}`
    );
  }

  if (claim.operation !== request.operation || witness.operation !== request.operation) {
    requestBound = false;
    witnessBound = false;
  }

  if (
    typeof witness.witnessId !== 'string' ||
    witness.witnessId.length === 0 ||
    typeof witness.operationId !== 'string' ||
    witness.operationId.length === 0 ||
    typeof witness.operationRequestId !== 'string' ||
    witness.operationRequestId.length === 0
  ) {
    witnessBound = false;
    requestBound = false;
    diagnostics.push(
      'WITNESS_METADATA_INVALID: missing witnessId, operationId, or operationRequestId'
    );
  }

  if (witness.operationRequestId !== request.operationRequestId) {
    requestBound = false;
    witnessBound = false;
    diagnostics.push(
      `REQUEST_ID_MISMATCH: witness.operationRequestId="${witness.operationRequestId}" vs request.operationRequestId="${request.operationRequestId}"`
    );
  }

  if (
    typeof claim.sourceState.stateId !== 'string' ||
    claim.sourceState.stateId.length === 0 ||
    typeof claim.resultingState.stateId !== 'string' ||
    claim.resultingState.stateId.length === 0 ||
    claim.sourceState.stateId === claim.resultingState.stateId
  ) {
    witnessBound = false;
    requestBound = false;
    diagnostics.push(
      `STATE_ID_INVALID: sourceState.stateId="${claim.sourceState.stateId}", resultingState.stateId="${claim.resultingState.stateId}"`
    );
  }

  if (
    claim.sourceState.stateId !== request.sourceStateId ||
    claim.sourceState.version !== request.sourceStateVersion
  ) {
    requestBound = false;
    diagnostics.push(
      `REQUEST_SOURCE_STATE_MISMATCH: request(${request.sourceStateId}@v${request.sourceStateVersion}) vs sourceState(${claim.sourceState.stateId}@v${claim.sourceState.version})`
    );
  }

  if (
    witness.sourceStateId !== request.sourceStateId ||
    witness.sourceStateVersion !== request.sourceStateVersion
  ) {
    requestBound = false;
    witnessBound = false;
    diagnostics.push(
      `REQUEST_WITNESS_SOURCE_MISMATCH: witness(${witness.sourceStateId}@v${witness.sourceStateVersion}) vs request(${request.sourceStateId}@v${request.sourceStateVersion})`
    );
  }

  if (
    witness.sourceStateId !== claim.sourceState.stateId ||
    witness.targetStateId !== claim.resultingState.stateId ||
    witness.sourceStateVersion !== claim.sourceState.version ||
    witness.targetStateVersion !== claim.resultingState.version ||
    claim.resultingState.version <= claim.sourceState.version
  ) {
    witnessBound = false;
    diagnostics.push(
      `WITNESS_STATE_BINDING_FAILED: witness(${witness.sourceStateId}@v${witness.sourceStateVersion} -> ${witness.targetStateId}@v${witness.targetStateVersion}) vs states(${claim.sourceState.stateId}@v${claim.sourceState.version} -> ${claim.resultingState.stateId}@v${claim.resultingState.version})`
    );
  }

  if (
    line.nx !== reqLine.nx ||
    line.ny !== reqLine.ny ||
    line.c !== reqLine.c ||
    witness.axis.n.nx !== reqLine.nx ||
    witness.axis.n.ny !== reqLine.ny ||
    witness.axis.c !== reqLine.c
  ) {
    requestBound = false;
    diagnostics.push(
      `REQUEST_AXIS_MISMATCH: request axis=(${reqLine.nx}, ${reqLine.ny}, c=${reqLine.c}), claim axis=(${line.nx}, ${line.ny}, c=${line.c}), witness axis=(${witness.axis.n.nx}, ${witness.axis.n.ny}, c=${witness.axis.c})`
    );
  }

  if (
    witness.axis.n.nx !== line.nx ||
    witness.axis.n.ny !== line.ny ||
    witness.axis.c !== line.c
  ) {
    witnessBound = false;
    diagnostics.push(
      `WITNESS_AXIS_MISMATCH: witness axis=(${witness.axis.n.nx}, ${witness.axis.n.ny}, c=${witness.axis.c}) vs claim axis=(${line.nx}, ${line.ny}, c=${line.c})`
    );
  }

  // Structural ID preservation across states
  let idsPreserved =
    !src.hasDuplicateVertexIds &&
    !dst.hasDuplicateVertexIds &&
    !src.hasDuplicateEdgeIds &&
    !dst.hasDuplicateEdgeIds &&
    !src.hasDuplicateFaceIds &&
    !dst.hasDuplicateFaceIds &&
    claim.sourceState.vertices.length === claim.resultingState.vertices.length &&
    edgesMatch(claim.sourceState.edges, claim.resultingState.edges) &&
    facesMatch(claim.sourceState.faces, claim.resultingState.faces);

  if (idsPreserved) {
    for (const id of src.map.keys()) {
      if (!dst.map.has(id)) {
        idsPreserved = false;
        break;
      }
    }
  }

  for (const edge of claim.sourceState.edges) {
    if (!src.map.has(edge.startVertexId) || !src.map.has(edge.endVertexId)) {
      idsPreserved = false;
    }
  }
  for (const face of claim.sourceState.faces) {
    for (const vid of face.vertexIds) {
      if (!src.map.has(vid)) {
        idsPreserved = false;
      }
    }
  }

  // Exact disjoint partition check across request, claim.parameters, and witness
  const reqMoving = collectIdSet(request.movingVertexIds);
  const reqFixed = collectIdSet(request.fixedVertexIds);
  const reqParamMoving = collectIdSet(request.parameters.movingVertexIds);
  const reqParamFixed = collectIdSet(request.parameters.fixedVertexIds);
  const claimMoving = collectIdSet(claim.parameters.movingVertexIds);
  const claimFixed = collectIdSet(claim.parameters.fixedVertexIds);
  const witnessMoving = collectIdSet(witness.movingVertexIds);
  const witnessFixed = collectIdSet(witness.fixedVertexIds);

  if (
    reqMoving.hasDuplicates ||
    reqFixed.hasDuplicates ||
    reqParamMoving.hasDuplicates ||
    reqParamFixed.hasDuplicates ||
    claimMoving.hasDuplicates ||
    claimFixed.hasDuplicates ||
    witnessMoving.hasDuplicates ||
    witnessFixed.hasDuplicates
  ) {
    idsPreserved = false;
    witnessBound = false;
    requestBound = false;
    diagnostics.push(
      'DUPLICATE_PARTITION_ID: movingVertexIds or fixedVertexIds contains duplicates'
    );
  }

  if (
    !setsEqual(reqMoving.set, reqParamMoving.set) ||
    !setsEqual(reqFixed.set, reqParamFixed.set)
  ) {
    requestBound = false;
    idsPreserved = false;
    diagnostics.push(
      'REQUEST_INTERNAL_PARTITION_MISMATCH: OperationRequest top-level partition differs from request.parameters'
    );
  }

  if (
    !setsEqual(claimMoving.set, reqMoving.set) ||
    !setsEqual(claimFixed.set, reqFixed.set) ||
    !setsEqual(witnessMoving.set, reqMoving.set) ||
    !setsEqual(witnessFixed.set, reqFixed.set)
  ) {
    requestBound = false;
    idsPreserved = false;
    diagnostics.push(
      'REQUEST_PARTITION_MISMATCH: claim or witness moving/fixed vertex lists differ from OperationRequest'
    );
  }

  if (
    !setsEqual(claimMoving.set, witnessMoving.set) ||
    !setsEqual(claimFixed.set, witnessFixed.set)
  ) {
    witnessBound = false;
    idsPreserved = false;
    diagnostics.push(
      'WITNESS_PARTITION_MISMATCH: witness moving/fixed vertex lists differ from claim.parameters'
    );
  }

  for (const id of reqMoving.set) {
    if (!src.map.has(id) || reqFixed.set.has(id)) {
      idsPreserved = false;
      witnessBound = false;
      requestBound = false;
    }
  }
  for (const id of reqFixed.set) {
    if (!src.map.has(id)) {
      idsPreserved = false;
      witnessBound = false;
      requestBound = false;
    }
  }
  for (const id of src.map.keys()) {
    if (!reqMoving.set.has(id) && !reqFixed.set.has(id)) {
      idsPreserved = false;
      witnessBound = false;
      requestBound = false;
    }
  }

  if (!idsPreserved) {
    diagnostics.push(
      'ID_INTEGRITY_VIOLATION: VertexID, EdgeID, FaceID, or moving/fixed partition mismatch'
    );
  }

  // Bind witness.vertexPairs 1-to-1 with movingVertexIds, sourceState, and resultingState
  const pairMap = new Map<VertexId, ReflectionWitnessVertexPair>();
  let duplicatePairIds = false;
  for (const pair of witness.vertexPairs) {
    if (pairMap.has(pair.vertexId)) {
      duplicatePairIds = true;
    }
    pairMap.set(pair.vertexId, pair);
  }

  if (duplicatePairIds || pairMap.size !== witnessMoving.set.size) {
    witnessBound = false;
    diagnostics.push(
      `WITNESS_PAIRS_CARDINALITY_MISMATCH: vertexPairs=${witness.vertexPairs.length}, distinct=${pairMap.size}, moving=${witnessMoving.set.size}`
    );
  }

  for (const pair of witness.vertexPairs) {
    if (!witnessMoving.set.has(pair.vertexId)) {
      witnessBound = false;
      diagnostics.push(
        `WITNESS_UNEXPECTED_VERTEX_PAIR: ${pair.vertexId} is not in movingVertexIds`
      );
    }
  }

  for (const id of witnessMoving.set) {
    const pair = pairMap.get(id);
    const srcPos = src.map.get(id);
    const dstPos = dst.map.get(id);
    if (!pair || !srcPos || !dstPos) {
      witnessBound = false;
      diagnostics.push(
        `WITNESS_MISSING_PAIR: missing vertexPair or state entry for ${id}`
      );
      continue;
    }
    if (pair.p.x !== srcPos.x || pair.p.y !== srcPos.y) {
      witnessBound = false;
      diagnostics.push(
        `WITNESS_SOURCE_MISMATCH for ${id}: witness.p=(${pair.p.x}, ${pair.p.y}) vs sourceState=(${srcPos.x}, ${srcPos.y})`
      );
    }
    const targetDiff = euclideanDistance(pair.pPrime, dstPos);
    if (targetDiff > tol.epsilon) {
      witnessBound = false;
      diagnostics.push(
        `WITNESS_TARGET_MISMATCH for ${id}: ||witness.pPrime - resultingState||=${targetDiff} > epsilon=${tol.epsilon}`
      );
    }
  }

  // Fixed vertices immobility check (against trusted request fixed partition)
  let maxFixedDisplacement = 0;
  for (const id of src.map.keys()) {
    if (reqMoving.set.has(id)) continue;
    const p = src.map.get(id);
    const pClaimed = dst.map.get(id);
    if (!p || !pClaimed) continue;
    const disp = euclideanDistance(p, pClaimed);
    if (disp > maxFixedDisplacement) {
      maxFixedDisplacement = disp;
    }
  }

  const fixedVerticesUnchanged = maxFixedDisplacement <= tol.epsilon;
  if (!fixedVerticesUnchanged) {
    diagnostics.push(
      `FIXED_VERTEX_DISPLACED: maxFixedDisplacement=${maxFixedDisplacement} > epsilon=${tol.epsilon}`
    );
  }

  // =========================================================================
  // STAGE C: Geometric Axioms of Reflection Evaluated Against Request & Claim Axes
  //   r_mid  = |n · (p + p') - 2c| / (2 ||n||) <= epsilon
  //   r_perp = |(p' - p) × n| / ||n|| <= epsilon
  // Evaluating against BOTH reqLine and claim line ensures coordinated axis substitution
  // fails axiomsSatisfied against the requested axis while single-side claim tampering
  // also fails axiomsSatisfied.
  // =========================================================================
  let midpointError = 0;
  let collinearityError = 0;

  const evalAxiomResidualsForLine = (
    p: Point2D,
    pPrime: Point2D,
    axisLine: LineNormalParams,
    axisNorm: number
  ) => {
    const midRes =
      Math.abs(
        axisLine.nx * (p.x + pPrime.x) +
          axisLine.ny * (p.y + pPrime.y) -
          2 * axisLine.c
      ) /
      (2 * axisNorm);
    const colRes =
      Math.abs((pPrime.x - p.x) * axisLine.ny - (pPrime.y - p.y) * axisLine.nx) /
      axisNorm;
    if (midRes > midpointError) midpointError = midRes;
    if (colRes > collinearityError) collinearityError = colRes;
  };

  const vertexIdsToVerify = new Set<VertexId>([
    ...reqMoving.set,
    ...claimMoving.set,
  ]);
  for (const id of vertexIdsToVerify) {
    const srcPos = src.map.get(id);
    const dstPos = dst.map.get(id);
    if (srcPos && dstPos) {
      evalAxiomResidualsForLine(srcPos, dstPos, reqLine, normRequest);
      evalAxiomResidualsForLine(srcPos, dstPos, line, normClaim);
    }
    const pair = pairMap.get(id);
    if (pair) {
      evalAxiomResidualsForLine(pair.p, pair.pPrime, reqLine, normRequest);
      evalAxiomResidualsForLine(pair.p, pair.pPrime, line, normClaim);
    }
  }

  const axiomsSatisfied =
    midpointError <= tol.epsilon && collinearityError <= tol.epsilon;
  if (!axiomsSatisfied) {
    diagnostics.push(
      `AXIOM_RESIDUAL_VIOLATION: midpointError=${midpointError}, collinearityError=${collinearityError}, epsilon=${tol.epsilon}`
    );
  }

  // =========================================================================
  // STAGE D: Scope-Aware Metric Invariants (evaluated on trusted request partition)
  // =========================================================================
  let maxLengthError = 0;

  const isPurelyMovingVertex = (id: VertexId) => reqMoving.set.has(id);
  const isPurelyFixedVertex = (id: VertexId) =>
    reqFixed.set.has(id) && !reqMoving.set.has(id);

  for (const edge of claim.sourceState.edges) {
    const purelyMoving =
      isPurelyMovingVertex(edge.startVertexId) &&
      isPurelyMovingVertex(edge.endVertexId);
    const purelyFixed =
      isPurelyFixedVertex(edge.startVertexId) &&
      isPurelyFixedVertex(edge.endVertexId);

    if (!purelyMoving && !purelyFixed) {
      continue;
    }

    const a0 = src.map.get(edge.startVertexId);
    const b0 = src.map.get(edge.endVertexId);
    const a1 = dst.map.get(edge.startVertexId);
    const b1 = dst.map.get(edge.endVertexId);
    if (!a0 || !b0 || !a1 || !b1) {
      maxLengthError = Infinity;
      continue;
    }
    const err = Math.abs(euclideanDistance(a1, b1) - euclideanDistance(a0, b0));
    if (err > maxLengthError) maxLengthError = err;
  }

  let areaError = 0;
  let orientationInverted = true;
  let hasNonDegenerateMovingFace = false;
  let hasDegenerateMovingFace = false;

  for (const face of claim.sourceState.faces) {
    if (face.vertexIds.length === 0) continue;

    const allMoving = face.vertexIds.every((vid) => isPurelyMovingVertex(vid));
    const allFixed = face.vertexIds.every((vid) => isPurelyFixedVertex(vid));

    if (!allMoving && !allFixed) {
      continue;
    }

    const srcPts: Point2D[] = [];
    const dstPts: Point2D[] = [];
    for (const vid of face.vertexIds) {
      const p0 = src.map.get(vid);
      const p1 = dst.map.get(vid);
      if (p0) srcPts.push(p0);
      if (p1) dstPts.push(p1);
    }

    if (
      srcPts.length !== face.vertexIds.length ||
      dstPts.length !== face.vertexIds.length
    ) {
      maxLengthError = Infinity;
      areaError = Infinity;
      if (allMoving) orientationInverted = false;
      continue;
    }

    for (let i = 0; i < face.vertexIds.length; i++) {
      for (let j = i + 1; j < face.vertexIds.length; j++) {
        const err = Math.abs(
          euclideanDistance(dstPts[i], dstPts[j]) -
            euclideanDistance(srcPts[i], srcPts[j])
        );
        if (err > maxLengthError) maxLengthError = err;
      }
    }

    const signed0 = computeSignedArea(srcPts);
    const signed1 = computeSignedArea(dstPts);
    const absErr = Math.abs(Math.abs(signed1) - Math.abs(signed0));
    if (absErr > areaError) areaError = absErr;

    if (allMoving) {
      if (Math.abs(signed0) <= tol.degenerateAreaEpsilon) {
        hasDegenerateMovingFace = true;
      } else {
        hasNonDegenerateMovingFace = true;
        const sign0 = Math.sign(signed0);
        const sign1 = Math.sign(signed1);
        if (sign1 !== -sign0 || Math.abs(signed1 + signed0) > tol.areaEpsilon) {
          orientationInverted = false;
          diagnostics.push(
            `ORIENTATION_INVERSION_FAILED on moving face ${face.id}: signed0=${signed0}, signed1=${signed1}`
          );
        }
      }
    }
  }

  const lengthsPreserved = maxLengthError <= tol.epsilon;
  if (!lengthsPreserved) {
    diagnostics.push(
      `ISOMETRY_VIOLATION: maxLengthError=${maxLengthError} > epsilon=${tol.epsilon}`
    );
  }

  const areaPreserved = areaError <= tol.areaEpsilon;
  if (!areaPreserved) {
    diagnostics.push(
      `AREA_PRESERVATION_FAILED: areaError=${areaError} > areaEpsilon=${tol.areaEpsilon}`
    );
  }

  const anyHardFailure =
    !requestBound ||
    !witnessBound ||
    !idsPreserved ||
    !axiomsSatisfied ||
    !fixedVerticesUnchanged ||
    !lengthsPreserved ||
    !areaPreserved ||
    (hasNonDegenerateMovingFace && !orientationInverted);

  let status: VerificationStatus;
  if (anyHardFailure) {
    status = 'FAIL';
  } else if (!hasNonDegenerateMovingFace && hasDegenerateMovingFace) {
    orientationInverted = false;
    status = 'UNDETERMINED';
    diagnostics.push(
      'UNDETERMINED: purely moving face has zero area (collinear vertices); orientation inversion cannot be established'
    );
  } else {
    status = 'PASS';
  }

  return {
    status,
    mode: 'RESULT_VERIFICATION',
    residuals: {
      midpointError,
      collinearityError,
      maxFixedDisplacement,
      maxLengthError,
      areaError,
    },
    predicates: {
      requestBound,
      witnessBound,
      axiomsSatisfied,
      lengthsPreserved,
      areaPreserved,
      orientationInverted,
      fixedVerticesUnchanged,
      idsPreserved,
      traceContinuous: true,
    },
    diagnostics,
  };
}

/**
 * Mode 2: PROCESS VERIFICATION
 * Independently validates every step S_i -> S_{i+1} in TRACE against the separate sequence of trusted
 * OperationRequests, verifying request binding, non-finite/monotonic stepIndex, version monotonicity,
 * operation sequence consistency, and structural state continuity.
 */
export function verifyProcess(
  trace: readonly TraceEntry[],
  trustedRequests: readonly OperationRequest[],
  toleranceOverrides?: Partial<VerifierTolerances>
): VerificationVerdict {
  const diagnostics: string[] = [];

  if (!Array.isArray(trace) || trace.length === 0) {
    if (!Array.isArray(trustedRequests) || trustedRequests.length > 0) {
      diagnostics.push(
        'TRACE_REQUEST_COUNT_MISMATCH: TRACE is empty but trustedRequests is missing or non-empty'
      );
      return {
        status: 'FAIL',
        mode: 'PROCESS_VERIFICATION',
        residuals: zeroResiduals(),
        predicates: defaultFalsePredicates(false, false),
        diagnostics,
      };
    }

    diagnostics.push('UNDETERMINED: TRACE is empty');
    return {
      status: 'UNDETERMINED',
      mode: 'PROCESS_VERIFICATION',
      residuals: zeroResiduals(),
      predicates: defaultFalsePredicates(false, true),
      diagnostics,
    };
  }

  if (!Array.isArray(trustedRequests)) {
    diagnostics.push(
      'TRACE_REQUESTS_MISSING: verifyProcess requires trusted OperationRequest sequence'
    );
    return {
      status: 'FAIL',
      mode: 'PROCESS_VERIFICATION',
      residuals: zeroResiduals(),
      predicates: defaultFalsePredicates(false, false),
      diagnostics,
    };
  }

  if (trustedRequests.length !== trace.length) {
    diagnostics.push(
      `TRACE_REQUEST_COUNT_MISMATCH: trace.length=${trace.length} vs trustedRequests.length=${trustedRequests.length}`
    );
    return {
      status: 'FAIL',
      mode: 'PROCESS_VERIFICATION',
      residuals: zeroResiduals(),
      predicates: defaultFalsePredicates(false, false),
      diagnostics,
    };
  }

  let traceContinuous = true;
  let requestBound = true;
  let witnessBound = true;
  let axiomsSatisfied = true;
  let lengthsPreserved = true;
  let areaPreserved = true;
  let orientationInverted = true;
  let fixedVerticesUnchanged = true;
  let idsPreserved = true;

  let midpointError = 0;
  let collinearityError = 0;
  let maxFixedDisplacement = 0;
  let maxLengthError = 0;
  let areaError = 0;

  let anyFail = false;
  let anyUndetermined = false;
  const seenRequestIds = new Set<string>();

  for (let i = 0; i < trace.length; i++) {
    const entry = trace[i];
    const trustedReq = trustedRequests[i];

    if (
      typeof entry.stepIndex !== 'number' ||
      !Number.isFinite(entry.stepIndex) ||
      !Number.isInteger(entry.stepIndex) ||
      entry.stepIndex < 0
    ) {
      traceContinuous = false;
      anyFail = true;
      diagnostics.push(
        `TRACE_INVALID_STEP_INDEX at step ${i}: stepIndex=${String(entry.stepIndex)} must be a finite non-negative integer`
      );
    }

    if (!trustedReq || typeof trustedReq !== 'object') {
      traceContinuous = false;
      requestBound = false;
      anyFail = true;
      diagnostics.push(`TRACE_TRUSTED_REQUEST_MISSING at step ${i}`);
      continue;
    }

    if (!entry.request || typeof entry.request !== 'object') {
      traceContinuous = false;
      requestBound = false;
      anyFail = true;
      diagnostics.push(`TRACE_ENTRY_REQUEST_MISSING at step ${i}`);
      continue;
    }

    if (
      entry.operationRequestId !== trustedReq.operationRequestId ||
      entry.request.operationRequestId !== trustedReq.operationRequestId
    ) {
      traceContinuous = false;
      requestBound = false;
      anyFail = true;
      diagnostics.push(
        `TRACE_REQUEST_ID_MISMATCH at step ${i}: entry.operationRequestId=${entry.operationRequestId}, entry.request.id=${entry.request.operationRequestId}, trusted.id=${trustedReq.operationRequestId}`
      );
    }

    if (!requestsStructurallyIdentical(entry.request, trustedReq)) {
      traceContinuous = false;
      requestBound = false;
      anyFail = true;
      diagnostics.push(
        `TRACE_REQUEST_MISMATCH at step ${i}: recorded TRACE request differs from trusted OperationRequest`
      );
    }

    if (seenRequestIds.has(trustedReq.operationRequestId)) {
      traceContinuous = false;
      requestBound = false;
      anyFail = true;
      diagnostics.push(
        `TRACE_DUPLICATE_REQUEST_ID at step ${i}: operationRequestId="${trustedReq.operationRequestId}" reused across TRACE steps`
      );
    } else if (trustedReq.operationRequestId.length > 0) {
      seenRequestIds.add(trustedReq.operationRequestId);
    }

    if (!entry.witness) {
      traceContinuous = false;
      witnessBound = false;
      requestBound = false;
      anyFail = true;
      diagnostics.push(`TRACE_WITNESS_MISSING at step ${i}`);
      continue;
    }

    if (entry.operationId !== entry.witness.operationId) {
      traceContinuous = false;
      witnessBound = false;
      anyFail = true;
      diagnostics.push(
        `TRACE_OPERATION_ID_MISMATCH at step ${i}: entry.operationId=${entry.operationId} vs witness.operationId=${entry.witness.operationId}`
      );
    }

    if (
      entry.operation !== trustedReq.operation ||
      entry.operation !== 'REFLECTION_ACROSS_LINE'
    ) {
      traceContinuous = false;
      requestBound = false;
      anyFail = true;
      diagnostics.push(
        `TRACE_OPERATION_SEQUENCE_ERROR at step ${i}: entry.operation=${String(entry.operation)} vs trusted=${String(trustedReq.operation)}`
      );
    }

    if (
      entry.sourceStateVersion !== entry.sourceState.version ||
      entry.targetStateVersion !== entry.resultingState.version ||
      entry.targetStateVersion <= entry.sourceStateVersion
    ) {
      traceContinuous = false;
      anyFail = true;
      diagnostics.push(
        `TRACE_VERSION_ERROR at step ${i}: sourceStateVersion=${entry.sourceStateVersion} (${entry.sourceState.version}) -> targetStateVersion=${entry.targetStateVersion} (${entry.resultingState.version})`
      );
    }

    if (i > 0) {
      const prev = trace[i - 1];
      if (
        typeof prev.stepIndex !== 'number' ||
        typeof entry.stepIndex !== 'number' ||
        !Number.isFinite(prev.stepIndex) ||
        !Number.isFinite(entry.stepIndex) ||
        !(entry.stepIndex > prev.stepIndex)
      ) {
        traceContinuous = false;
        anyFail = true;
        diagnostics.push(
          `TRACE_ORDER_ERROR at step ${i}: stepIndex=${String(entry.stepIndex)} is not strictly greater than previous stepIndex=${String(prev.stepIndex)}`
        );
      }
      if (!statesStructurallyIdentical(prev.resultingState, entry.sourceState)) {
        traceContinuous = false;
        anyFail = true;
        diagnostics.push(
          `TRACE_DISCONTINUITY between step ${i - 1} and step ${i}: resultingState does not match next sourceState`
        );
      }
      if (
        trustedReq.sourceStateId !== prev.resultingState.stateId ||
        trustedReq.sourceStateVersion !== prev.resultingState.version
      ) {
        traceContinuous = false;
        requestBound = false;
        anyFail = true;
        diagnostics.push(
          `TRACE_REQUEST_CONTINUITY_ERROR between step ${i - 1} and step ${i}: trusted request expects ${trustedReq.sourceStateId}@v${trustedReq.sourceStateVersion}, previous resultingState is ${prev.resultingState.stateId}@v${prev.resultingState.version}`
        );
      }
      if (
        entry.witness.sourceStateId !== prev.resultingState.stateId ||
        entry.witness.sourceStateVersion !== prev.resultingState.version
      ) {
        traceContinuous = false;
        witnessBound = false;
        anyFail = true;
        diagnostics.push(
          `TRACE_WITNESS_CONTINUITY_ERROR between step ${i - 1} and step ${i}`
        );
      }
    }

    const stepVerdict = verifyResult(
      {
        sourceState: entry.sourceState,
        resultingState: entry.resultingState,
        operation: entry.operation,
        parameters: entry.parameters,
        witness: entry.witness,
      },
      trustedReq,
      toleranceOverrides
    );

    if (stepVerdict.status === 'FAIL') anyFail = true;
    if (stepVerdict.status === 'UNDETERMINED') anyUndetermined = true;

    midpointError = Math.max(midpointError, stepVerdict.residuals.midpointError);
    collinearityError = Math.max(
      collinearityError,
      stepVerdict.residuals.collinearityError
    );
    maxFixedDisplacement = Math.max(
      maxFixedDisplacement,
      stepVerdict.residuals.maxFixedDisplacement
    );
    maxLengthError = Math.max(maxLengthError, stepVerdict.residuals.maxLengthError);
    areaError = Math.max(areaError, stepVerdict.residuals.areaError);

    requestBound = requestBound && stepVerdict.predicates.requestBound;
    witnessBound = witnessBound && stepVerdict.predicates.witnessBound;
    axiomsSatisfied = axiomsSatisfied && stepVerdict.predicates.axiomsSatisfied;
    lengthsPreserved = lengthsPreserved && stepVerdict.predicates.lengthsPreserved;
    areaPreserved = areaPreserved && stepVerdict.predicates.areaPreserved;
    orientationInverted =
      orientationInverted && stepVerdict.predicates.orientationInverted;
    fixedVerticesUnchanged =
      fixedVerticesUnchanged && stepVerdict.predicates.fixedVerticesUnchanged;
    idsPreserved = idsPreserved && stepVerdict.predicates.idsPreserved;

    for (const msg of stepVerdict.diagnostics) {
      diagnostics.push(`[step ${String(entry.stepIndex)}] ${msg}`);
    }
  }

  let status: VerificationStatus;
  if (anyFail || !traceContinuous || !requestBound) {
    status = 'FAIL';
  } else if (anyUndetermined) {
    status = 'UNDETERMINED';
  } else {
    status = 'PASS';
  }

  return {
    status,
    mode: 'PROCESS_VERIFICATION',
    residuals: {
      midpointError,
      collinearityError,
      maxFixedDisplacement,
      maxLengthError,
      areaError,
    },
    predicates: {
      requestBound,
      witnessBound,
      axiomsSatisfied,
      lengthsPreserved,
      areaPreserved,
      orientationInverted,
      fixedVerticesUnchanged,
      idsPreserved,
      traceContinuous,
    },
    diagnostics,
  };
}
