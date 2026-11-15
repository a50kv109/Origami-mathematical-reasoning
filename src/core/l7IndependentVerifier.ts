/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * L7 — Axiomatic Certifying Zero-Trust Geometric Verifier (Contract 02 v2)
 *
 * CRITICAL ISOLATION RULE:
 * This module MUST NOT import any runtime functions or geometry helpers from L2 or TRACE.
 * Only pure TypeScript contract types (`import type ... from './types'`) are permitted.
 *
 * Independent Mathematical Model (Certifying Algorithms Paradigm):
 * Rather than re-running L2's projection or building a duplicate 3x3 reflection matrix solver,
 * L7 verifies the ReflectionWitness emitted by L2 in four strictly ordered stages:
 *   Stage A: Input admissibility validation (finite IEEE-754 numbers, ||n|| > zeroNormalEpsilon -> else UNDETERMINED)
 *   Stage B: Three-way witness binding (witness <-> claim <-> sourceState <-> resultingState, disjoint partition, fixed immobility)
 *   Stage C: Scale-invariant geometric axioms of reflection:
 *              r_mid  = |n · (p + p') - 2c| / (2 ||n||) <= epsilon
 *              r_perp = |(p' - p) × n| / ||n|| <= epsilon
 *            (By exact identity ||p' - p'_exact||_2 = sqrt(4*r_mid^2 + r_perp^2), these axioms are
 *             mathematically necessary and sufficient without re-executing any solver.)
 *   Stage D: Scope-aware metric invariants (purely moving & purely fixed edges/faces preserve lengths & |area|;
 *            non-degenerate purely moving faces strictly invert signed orientation; boundary/mixed elements excluded).
 *
 * Under Zero-Trust, L7 completely ignores witness.claimedResiduals.
 */

import type {
  Edge2D,
  Face2D,
  GeometryState,
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

function undeterminedPredicates(traceContinuous: boolean): VerificationPredicates {
  return {
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

/**
 * Mode 1: RESULT VERIFICATION (Certifying Witness + Axiomatic Verification)
 * Independently validates a claimed transformation result via its ReflectionWitness.
 */
export function verifyResult(
  claim: VerificationClaim,
  toleranceOverrides?: Partial<VerifierTolerances>
): VerificationVerdict {
  const tol = resolveTolerances(toleranceOverrides);
  const diagnostics: string[] = [];

  const { line, movingVertexIds, fixedVertexIds } = claim.parameters;
  const witness = claim.witness;

  // =========================================================================
  // STAGE A: Input Admissibility Validation (non-finite or ||n|| <= epsZero -> UNDETERMINED)
  // =========================================================================
  if (!witness || typeof witness !== 'object') {
    diagnostics.push('WITNESS_MISSING: VerificationClaim must provide a ReflectionWitness');
    return {
      status: 'FAIL',
      mode: 'RESULT_VERIFICATION',
      residuals: zeroResiduals(),
      predicates: undeterminedPredicates(true),
      diagnostics,
    };
  }

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

  if (
    !isFiniteNumber(line.nx) ||
    !isFiniteNumber(line.ny) ||
    !isFiniteNumber(line.c) ||
    src.hasInvalidNumber ||
    dst.hasInvalidNumber ||
    witnessHasInvalidNumber
  ) {
    diagnostics.push(
      'UNDETERMINED: numeric inputs (axis, state version, vertex coordinates, or witness pairs) contain non-finite IEEE-754 values'
    );
    return {
      status: 'UNDETERMINED',
      mode: 'RESULT_VERIFICATION',
      residuals: zeroResiduals(),
      predicates: undeterminedPredicates(true),
      diagnostics,
    };
  }

  const normClaim = Math.hypot(line.nx, line.ny);
  const normWitness = Math.hypot(witness.axis.n.nx, witness.axis.n.ny);
  if (
    !isFiniteNumber(normClaim) ||
    normClaim <= tol.zeroNormalEpsilon ||
    !isFiniteNumber(normWitness) ||
    normWitness <= tol.zeroNormalEpsilon
  ) {
    diagnostics.push(
      `UNDETERMINED: degenerate axis normal (claim ||n||=${normClaim}, witness ||n||=${normWitness}, epsZero=${tol.zeroNormalEpsilon})`
    );
    return {
      status: 'UNDETERMINED',
      mode: 'RESULT_VERIFICATION',
      residuals: zeroResiduals(),
      predicates: undeterminedPredicates(true),
      diagnostics,
    };
  }

  // =========================================================================
  // STAGE B: Three-Way Witness Binding (witness <-> claim <-> sourceState <-> resultingState)
  // Note: witness.claimedResiduals is intentionally ignored (Zero-Trust).
  // =========================================================================
  let witnessBound = true;

  if (
    claim.operation !== 'REFLECTION_ACROSS_LINE' ||
    witness.operation !== 'REFLECTION_ACROSS_LINE'
  ) {
    witnessBound = false;
    diagnostics.push(
      `OPERATION_MISMATCH: claim=${claim.operation}, witness=${witness.operation}`
    );
  }

  if (
    typeof witness.witnessId !== 'string' ||
    witness.witnessId.length === 0 ||
    typeof witness.operationId !== 'string' ||
    witness.operationId.length === 0
  ) {
    witnessBound = false;
    diagnostics.push('WITNESS_METADATA_INVALID: missing witnessId or operationId');
  }

  if (
    typeof claim.sourceState.stateId !== 'string' ||
    claim.sourceState.stateId.length === 0 ||
    typeof claim.resultingState.stateId !== 'string' ||
    claim.resultingState.stateId.length === 0 ||
    claim.sourceState.stateId === claim.resultingState.stateId
  ) {
    witnessBound = false;
    diagnostics.push(
      `STATE_ID_INVALID: sourceState.stateId="${claim.sourceState.stateId}", resultingState.stateId="${claim.resultingState.stateId}"`
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

  // Exact disjoint partition check across claim parameters and witness
  const claimMoving = collectIdSet(movingVertexIds);
  const claimFixed = collectIdSet(fixedVertexIds);
  const witnessMoving = collectIdSet(witness.movingVertexIds);
  const witnessFixed = collectIdSet(witness.fixedVertexIds);

  if (
    claimMoving.hasDuplicates ||
    claimFixed.hasDuplicates ||
    witnessMoving.hasDuplicates ||
    witnessFixed.hasDuplicates
  ) {
    idsPreserved = false;
    witnessBound = false;
    diagnostics.push('DUPLICATE_PARTITION_ID: movingVertexIds or fixedVertexIds contains duplicates');
  }

  if (
    !setsEqual(claimMoving.set, witnessMoving.set) ||
    !setsEqual(claimFixed.set, witnessFixed.set)
  ) {
    witnessBound = false;
    idsPreserved = false;
    diagnostics.push('WITNESS_PARTITION_MISMATCH: witness moving/fixed vertex lists differ from claim.parameters');
  }

  for (const id of claimMoving.set) {
    if (!src.map.has(id) || claimFixed.set.has(id)) {
      idsPreserved = false;
      witnessBound = false;
    }
  }
  for (const id of claimFixed.set) {
    if (!src.map.has(id)) {
      idsPreserved = false;
      witnessBound = false;
    }
  }
  for (const id of src.map.keys()) {
    if (!claimMoving.set.has(id) && !claimFixed.set.has(id)) {
      idsPreserved = false;
      witnessBound = false;
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

  if (
    duplicatePairIds ||
    pairMap.size !== witnessMoving.set.size
  ) {
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
      diagnostics.push(`WITNESS_MISSING_PAIR: missing vertexPair or state entry for ${id}`);
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

  // Fixed vertices immobility check
  let maxFixedDisplacement = 0;
  for (const id of src.map.keys()) {
    if (claimMoving.set.has(id)) continue;
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
  // STAGE C: Scale-Invariant Geometric Axioms of Reflection (No Solver Re-run)
  //   r_mid  = |n · (p + p') - 2c| / (2 ||n||) <= epsilon
  //   r_perp = |(p' - p) × n| / ||n|| <= epsilon
  // =========================================================================
  let midpointError = 0;
  let collinearityError = 0;

  const evalAxiomResiduals = (p: Point2D, pPrime: Point2D) => {
    const midRes =
      Math.abs(line.nx * (p.x + pPrime.x) + line.ny * (p.y + pPrime.y) - 2 * line.c) /
      (2 * normClaim);
    const colRes =
      Math.abs((pPrime.x - p.x) * line.ny - (pPrime.y - p.y) * line.nx) /
      normClaim;
    if (midRes > midpointError) midpointError = midRes;
    if (colRes > collinearityError) collinearityError = colRes;
  };

  for (const id of claimMoving.set) {
    const srcPos = src.map.get(id);
    const dstPos = dst.map.get(id);
    if (srcPos && dstPos) {
      evalAxiomResiduals(srcPos, dstPos);
    }
    const pair = pairMap.get(id);
    if (pair) {
      evalAxiomResiduals(pair.p, pair.pPrime);
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
  // STAGE D: Scope-Aware Metric Invariants
  // - Purely moving edges/faces: length & |area| preservation + orientation inversion
  // - Purely fixed edges/faces: length & |area| preservation
  // - Boundary/mixed edges & faces (spanning moving & fixed): NOT checked for rigidity
  // =========================================================================
  let maxLengthError = 0;

  const isPurelyMovingVertex = (id: VertexId) => claimMoving.set.has(id);
  const isPurelyFixedVertex = (id: VertexId) =>
    claimFixed.set.has(id) && !claimMoving.set.has(id);

  for (const edge of claim.sourceState.edges) {
    const purelyMoving =
      isPurelyMovingVertex(edge.startVertexId) &&
      isPurelyMovingVertex(edge.endVertexId);
    const purelyFixed =
      isPurelyFixedVertex(edge.startVertexId) &&
      isPurelyFixedVertex(edge.endVertexId);

    if (!purelyMoving && !purelyFixed) {
      // Boundary edge between moving and fixed subsets: excluded from rigidity check
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
      // Boundary/mixed face spanning moving and fixed vertices: excluded from rigidity & inversion checks
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

    // All pairwise chords of purely moving / purely fixed faces must preserve length
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
 * Independently validates every step S_i -> S_{i+1} in TRACE via its attached ReflectionWitness,
 * operationId binding, monotonic stepIndex, monotonic version sequence, and structural state continuity.
 */
export function verifyProcess(
  trace: readonly TraceEntry[],
  toleranceOverrides?: Partial<VerifierTolerances>
): VerificationVerdict {
  const diagnostics: string[] = [];

  if (!Array.isArray(trace) || trace.length === 0) {
    diagnostics.push('UNDETERMINED: TRACE is empty');
    return {
      status: 'UNDETERMINED',
      mode: 'PROCESS_VERIFICATION',
      residuals: zeroResiduals(),
      predicates: undeterminedPredicates(false),
      diagnostics,
    };
  }

  let traceContinuous = true;
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

  for (let i = 0; i < trace.length; i++) {
    const entry = trace[i];

    if (!entry.witness) {
      traceContinuous = false;
      witnessBound = false;
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
      if (entry.stepIndex <= prev.stepIndex) {
        traceContinuous = false;
        anyFail = true;
        diagnostics.push(
          `TRACE_ORDER_ERROR at step ${i}: stepIndex=${entry.stepIndex} is not strictly greater than previous stepIndex=${prev.stepIndex}`
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
      diagnostics.push(`[step ${entry.stepIndex}] ${msg}`);
    }
  }

  let status: VerificationStatus;
  if (anyFail || !traceContinuous) {
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
