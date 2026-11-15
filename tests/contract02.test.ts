/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  createInitialGeometryState,
  L2EngineError,
  reflectAcrossLine,
} from '../src/core/l2GeometryEngine';
import {
  verifyProcess,
  verifyResult,
} from '../src/core/l7IndependentVerifier';
import {
  createOperationRequest,
  OperationRequestError,
} from '../src/core/operationRequest';
import {
  appendTraceEntry,
  cloneGeometryState,
  createTraceEntry,
} from '../src/core/trace';
import type {
  GeometryState,
  OperationRequest,
  ReflectionWitness,
  TraceEntry,
} from '../src/core/types';

function makeUnitSquareTriangleState(): GeometryState {
  // Triangle F0_B = [V3(0,1), V2(1,1), V1(1,0)] (clockwise, signed area = -0.5)
  return createInitialGeometryState({
    stateId: 'state-v0',
    version: 0,
    vertices: [
      { id: 'V3', position: { x: 0, y: 1 } },
      { id: 'V2', position: { x: 1, y: 1 } },
      { id: 'V1', position: { x: 1, y: 0 } },
    ],
    edges: [
      { id: 'E1', startVertexId: 'V3', endVertexId: 'V2' },
      { id: 'E2', startVertexId: 'V2', endVertexId: 'V1' },
      { id: 'E3', startVertexId: 'V1', endVertexId: 'V3' },
    ],
    faces: [{ id: 'F0_B', vertexIds: ['V3', 'V2', 'V1'] }],
  });
}

function makeSubdividedSquareState(): GeometryState {
  // Two triangles sharing diagonal V3(0,1)-V1(1,0):
  // F0_A = [V0(0,0), V1(1,0), V3(0,1)] (fixed)
  // F0_B = [V3(0,1), V2(1,1), V1(1,0)] (moving vertex V2)
  return createInitialGeometryState({
    stateId: 'state-v0',
    version: 0,
    vertices: [
      { id: 'V0', position: { x: 0, y: 0 } },
      { id: 'V1', position: { x: 1, y: 0 } },
      { id: 'V2', position: { x: 1, y: 1 } },
      { id: 'V3', position: { x: 0, y: 1 } },
    ],
    edges: [
      { id: 'E0', startVertexId: 'V0', endVertexId: 'V1' },
      { id: 'E1', startVertexId: 'V1', endVertexId: 'V2' },
      { id: 'E2', startVertexId: 'V2', endVertexId: 'V3' },
      { id: 'E3', startVertexId: 'V3', endVertexId: 'V0' },
      { id: 'ED', startVertexId: 'V3', endVertexId: 'V1' },
    ],
    faces: [
      { id: 'F0_A', vertexIds: ['V0', 'V1', 'V3'] },
      { id: 'F0_B', vertexIds: ['V3', 'V2', 'V1'] },
    ],
  });
}

function makeTwoIslandPartialState(): GeometryState {
  // Purely fixed triangle F_FIXED: A(0,0), B(1,0), C(0,1)
  // Purely moving triangle F_MOVING: D(2,0), E(3,0), G(2,1)
  // Boundary edges E_BD1(B-D) and E_BD2(C-G) span fixed & moving subsets;
  // reflecting F_MOVING across x = 4 stretches boundary edges while keeping internal geometry rigid.
  return createInitialGeometryState({
    stateId: 'partial-v0',
    version: 0,
    vertices: [
      { id: 'A', position: { x: 0, y: 0 } },
      { id: 'B', position: { x: 1, y: 0 } },
      { id: 'C', position: { x: 0, y: 1 } },
      { id: 'D', position: { x: 2, y: 0 } },
      { id: 'E', position: { x: 3, y: 0 } },
      { id: 'G', position: { x: 2, y: 1 } },
    ],
    edges: [
      { id: 'E_AB', startVertexId: 'A', endVertexId: 'B' },
      { id: 'E_BC', startVertexId: 'B', endVertexId: 'C' },
      { id: 'E_CA', startVertexId: 'C', endVertexId: 'A' },
      { id: 'E_DE', startVertexId: 'D', endVertexId: 'E' },
      { id: 'E_EG', startVertexId: 'E', endVertexId: 'G' },
      { id: 'E_GD', startVertexId: 'G', endVertexId: 'D' },
      { id: 'E_BD1', startVertexId: 'B', endVertexId: 'D' },
      { id: 'E_BD2', startVertexId: 'C', endVertexId: 'G' },
    ],
    faces: [
      { id: 'F_FIXED', vertexIds: ['A', 'B', 'C'] },
      { id: 'F_MOVING', vertexIds: ['D', 'E', 'G'] },
      { id: 'F_BRIDGE', vertexIds: ['B', 'D', 'G', 'C'] },
    ],
  });
}

test('1. Valid reflection with OperationRequest and ReflectionWitness passes Result & Process verification', () => {
  const s0 = makeUnitSquareTriangleState();
  const req = createOperationRequest({
    sourceState: s0,
    line: { nx: 1, ny: 1, c: 1 },
    movingVertexIds: ['V3', 'V2', 'V1'],
  });
  const { resultingState: s1, witness, traceEntry } = reflectAcrossLine({
    request: req,
    sourceState: s0,
    stepIndex: 0,
  });

  const v2 = s1.vertices.find((v) => v.id === 'V2');
  assert.ok(v2);
  assert.ok(Math.abs(v2.position.x - 0) <= 1e-12);
  assert.ok(Math.abs(v2.position.y - 0) <= 1e-12);
  assert.equal(witness.operationRequestId, req.operationRequestId);
  assert.equal(witness.sourceStateId, s0.stateId);
  assert.equal(witness.targetStateId, s1.stateId);
  assert.equal(witness.sourceStateVersion, 0);
  assert.equal(witness.targetStateVersion, 1);

  const claimResult = verifyResult(
    {
      sourceState: s0,
      resultingState: s1,
      operation: 'REFLECTION_ACROSS_LINE',
      parameters: traceEntry.parameters,
      witness,
    },
    req
  );
  assert.equal(claimResult.status, 'PASS');
  assert.equal(claimResult.predicates.requestBound, true);
  assert.equal(claimResult.predicates.witnessBound, true);
  assert.equal(claimResult.predicates.axiomsSatisfied, true);
  assert.equal(claimResult.predicates.lengthsPreserved, true);
  assert.equal(claimResult.predicates.areaPreserved, true);
  assert.equal(claimResult.predicates.orientationInverted, true);
  assert.equal(claimResult.predicates.fixedVerticesUnchanged, true);
  assert.equal(claimResult.predicates.idsPreserved, true);
  assert.ok(claimResult.residuals.midpointError <= 1e-12);
  assert.ok(claimResult.residuals.collinearityError <= 1e-12);

  const processResult = verifyProcess([traceEntry], [req]);
  assert.equal(processResult.status, 'PASS');
  assert.equal(processResult.predicates.requestBound, true);
  assert.equal(processResult.predicates.traceContinuous, true);
});

test('2a. Corrupted result coordinate (2, 0) counterexample is rejected with FAIL by L7', () => {
  const s0 = makeUnitSquareTriangleState();
  const req = createOperationRequest({
    sourceState: s0,
    line: { nx: 1, ny: 1, c: 1 },
    movingVertexIds: ['V2'],
  });
  const { resultingState: validS1, witness, traceEntry } = reflectAcrossLine({
    request: req,
    sourceState: s0,
  });

  const tamperedS1: GeometryState = {
    ...validS1,
    vertices: validS1.vertices.map((v) =>
      v.id === 'V2' ? { id: v.id, position: { x: 2, y: 0 } } : v
    ),
  };

  // Even if witness.pPrime were also altered to match tamperedS1, L7 axioms reject (2, 0)
  const tamperedWitness: ReflectionWitness = {
    ...witness,
    vertexPairs: witness.vertexPairs.map((pair) =>
      pair.vertexId === 'V2' ? { ...pair, pPrime: { x: 2, y: 0 } } : pair
    ),
  };

  const verdict = verifyResult(
    {
      sourceState: s0,
      resultingState: tamperedS1,
      operation: 'REFLECTION_ACROSS_LINE',
      parameters: traceEntry.parameters,
      witness: tamperedWitness,
    },
    req
  );

  assert.equal(verdict.status, 'FAIL');
  assert.equal(verdict.predicates.axiomsSatisfied, false);
  assert.ok(verdict.residuals.collinearityError > 1.4);
});

test('2b. Result coordinate shifted by 1e-2 is rejected with FAIL', () => {
  const s0 = makeUnitSquareTriangleState();
  const req = createOperationRequest({
    sourceState: s0,
    line: { nx: 1, ny: 1, c: 1 },
    movingVertexIds: ['V2'],
  });
  const { resultingState: validS1, witness, traceEntry } = reflectAcrossLine({
    request: req,
    sourceState: s0,
  });

  const shiftedS1: GeometryState = {
    ...validS1,
    vertices: validS1.vertices.map((v) =>
      v.id === 'V2' ? { id: v.id, position: { x: 0.01, y: 0 } } : v
    ),
  };

  const verdict = verifyResult(
    {
      sourceState: s0,
      resultingState: shiftedS1,
      operation: 'REFLECTION_ACROSS_LINE',
      parameters: traceEntry.parameters,
      witness,
    },
    req
  );

  assert.equal(verdict.status, 'FAIL');
  assert.equal(verdict.predicates.axiomsSatisfied, false);
  assert.equal(verdict.predicates.witnessBound, false);
});

test('3. Tampered sourceState (mismatch between sourceState and witness/request) fails with witnessBound=false & requestBound=false', () => {
  const s0 = makeUnitSquareTriangleState();
  const req = createOperationRequest({
    sourceState: s0,
    line: { nx: 1, ny: 1, c: 1 },
    movingVertexIds: ['V2'],
  });
  const { resultingState: s1, witness, traceEntry } = reflectAcrossLine({
    request: req,
    sourceState: s0,
  });

  const tamperedSource: GeometryState = cloneGeometryState({
    ...s0,
    vertices: s0.vertices.map((v) =>
      v.id === 'V2' ? { id: v.id, position: { x: 1.5, y: 1 } } : v
    ),
  });

  const verdict = verifyResult(
    {
      sourceState: tamperedSource,
      resultingState: s1,
      operation: 'REFLECTION_ACROSS_LINE',
      parameters: traceEntry.parameters,
      witness,
    },
    req
  );

  assert.equal(verdict.status, 'FAIL');
  assert.equal(verdict.predicates.witnessBound, false);
});

test('4. Tampered axis parameters (n or c) in witness or claim fails L7 verification', () => {
  const s0 = makeUnitSquareTriangleState();
  const req = createOperationRequest({
    sourceState: s0,
    line: { nx: 1, ny: 1, c: 1 },
    movingVertexIds: ['V2'],
  });
  const { resultingState: s1, witness, traceEntry } = reflectAcrossLine({
    request: req,
    sourceState: s0,
  });

  // 4a. Tamper c in claim.parameters only
  const claimTamperedVerdict = verifyResult(
    {
      sourceState: s0,
      resultingState: s1,
      operation: 'REFLECTION_ACROSS_LINE',
      parameters: {
        ...traceEntry.parameters,
        line: { nx: 1, ny: 1, c: 1.25 },
      },
      witness,
    },
    req
  );
  assert.equal(claimTamperedVerdict.status, 'FAIL');
  assert.equal(claimTamperedVerdict.predicates.requestBound, false);
  assert.equal(claimTamperedVerdict.predicates.witnessBound, false);
  assert.equal(claimTamperedVerdict.predicates.axiomsSatisfied, false);

  // 4b. Tamper normal n in witness only
  const witnessTamperedVerdict = verifyResult(
    {
      sourceState: s0,
      resultingState: s1,
      operation: 'REFLECTION_ACROSS_LINE',
      parameters: traceEntry.parameters,
      witness: {
        ...witness,
        axis: { n: { nx: 2, ny: 1 }, c: 1 },
      },
    },
    req
  );
  assert.equal(witnessTamperedVerdict.status, 'FAIL');
  assert.equal(witnessTamperedVerdict.predicates.requestBound, false);
  assert.equal(witnessTamperedVerdict.predicates.witnessBound, false);
});

test('5. Tampered movingVertexIds (reclassifying moving vertex as fixed or omitting vertex) fails L7', () => {
  const s0 = makeSubdividedSquareState();
  const req = createOperationRequest({
    sourceState: s0,
    line: { nx: 1, ny: 1, c: 1 },
    movingVertexIds: ['V2'],
  });
  const { resultingState: s1, witness, traceEntry } = reflectAcrossLine({
    request: req,
    sourceState: s0,
  });

  // 5a. Move V2 into fixedVertexIds in claim & witness while request stays unchanged
  const movedToFixedVerdict = verifyResult(
    {
      sourceState: s0,
      resultingState: s1,
      operation: 'REFLECTION_ACROSS_LINE',
      parameters: {
        ...traceEntry.parameters,
        movingVertexIds: [],
        fixedVertexIds: ['V0', 'V1', 'V2', 'V3'],
      },
      witness: {
        ...witness,
        movingVertexIds: [],
        fixedVertexIds: ['V0', 'V1', 'V2', 'V3'],
        vertexPairs: [],
      },
    },
    req
  );
  assert.equal(movedToFixedVerdict.status, 'FAIL');
  assert.equal(movedToFixedVerdict.predicates.requestBound, false);

  // 5b. Omit a vertex from fixedVertexIds (incomplete partition)
  const omittedVertexVerdict = verifyResult(
    {
      sourceState: s0,
      resultingState: s1,
      operation: 'REFLECTION_ACROSS_LINE',
      parameters: {
        ...traceEntry.parameters,
        fixedVertexIds: ['V0', 'V1'], // V3 omitted!
      },
      witness,
    },
    req
  );
  assert.equal(omittedVertexVerdict.status, 'FAIL');
  assert.equal(omittedVertexVerdict.predicates.idsPreserved, false);
  assert.equal(omittedVertexVerdict.predicates.witnessBound, false);
  assert.equal(omittedVertexVerdict.predicates.requestBound, false);
});

test('6. Forged claimedResiduals=0 cannot fool L7 when coordinates are invalid', () => {
  const s0 = makeUnitSquareTriangleState();
  const req = createOperationRequest({
    sourceState: s0,
    line: { nx: 1, ny: 1, c: 1 },
    movingVertexIds: ['V2'],
  });
  const { resultingState: s1, witness, traceEntry } = reflectAcrossLine({
    request: req,
    sourceState: s0,
  });

  const corruptedS1: GeometryState = {
    ...s1,
    vertices: s1.vertices.map((v) =>
      v.id === 'V2' ? { id: v.id, position: { x: 0.6, y: -0.2 } } : v
    ),
  };

  const forgedWitness: ReflectionWitness = {
    ...witness,
    vertexPairs: witness.vertexPairs.map((pair) =>
      pair.vertexId === 'V2' ? { ...pair, pPrime: { x: 0.6, y: -0.2 } } : pair
    ),
    claimedResiduals: {
      maxMidpointError: 0,
      maxCollinearityError: 0,
    },
  };

  const verdict = verifyResult(
    {
      sourceState: s0,
      resultingState: corruptedS1,
      operation: 'REFLECTION_ACROSS_LINE',
      parameters: traceEntry.parameters,
      witness: forgedWitness,
    },
    req
  );

  assert.equal(verdict.status, 'FAIL');
  assert.equal(verdict.predicates.axiomsSatisfied, false);
  assert.ok(verdict.residuals.midpointError > 0.1);
  assert.ok(verdict.residuals.collinearityError > 0.1);
});

test('7. Scale invariance of reflection line equation coefficients: multiplying (nx, ny, c) by 1e6 passes cleanly', () => {
  const s0 = makeUnitSquareTriangleState();
  const scale = 1e6;
  const req = createOperationRequest({
    sourceState: s0,
    line: { nx: 3 * scale, ny: -4 * scale, c: 5 * scale },
    movingVertexIds: ['V3', 'V2', 'V1'],
  });
  const { resultingState: s1, witness, traceEntry } = reflectAcrossLine({
    request: req,
    sourceState: s0,
  });

  const verdict = verifyProcess([traceEntry], [req], { epsilon: 1e-12 });
  assert.equal(verdict.status, 'PASS');
  assert.equal(verdict.predicates.axiomsSatisfied, true);
  assert.ok(verdict.residuals.midpointError < 1e-12);
  assert.ok(verdict.residuals.collinearityError < 1e-12);
  assert.equal(witness.axis.n.nx, 3 * scale);
  assert.equal(s1.version, 1);
});

test('8. Partial reflection allows boundary edge stretching while enforcing rigidity on purely moving & purely fixed subgraphs', () => {
  const s0 = makeTwoIslandPartialState();
  // Reflect F_MOVING across x = 4 (line: 1*x + 0*y = 4) while F_FIXED stays at x in [0,1].
  // Boundary edges E_BD1 (from (1,0) to (2,0) -> (1,0) to (6,0)) and E_BD2 change length from 1 to 5.
  const req = createOperationRequest({
    sourceState: s0,
    line: { nx: 1, ny: 0, c: 4 },
    movingVertexIds: ['D', 'E', 'G'],
  });
  const { resultingState: s1, witness, traceEntry } = reflectAcrossLine({
    request: req,
    sourceState: s0,
  });

  const verdict = verifyResult(
    {
      sourceState: s0,
      resultingState: s1,
      operation: 'REFLECTION_ACROSS_LINE',
      parameters: traceEntry.parameters,
      witness,
    },
    req
  );

  assert.equal(verdict.status, 'PASS');
  assert.equal(verdict.predicates.lengthsPreserved, true);
  assert.equal(verdict.predicates.areaPreserved, true);
  assert.equal(verdict.predicates.orientationInverted, true);
  assert.equal(verdict.predicates.fixedVerticesUnchanged, true);
  assert.ok(verdict.residuals.maxLengthError <= 1e-12);

  // Confirm that stretching an internal purely moving edge fails
  const brokenInternalS1: GeometryState = {
    ...s1,
    vertices: s1.vertices.map((v) =>
      v.id === 'E' ? { id: v.id, position: { x: 5.5, y: 0 } } : v
    ),
  };
  const brokenVerdict = verifyResult(
    {
      sourceState: s0,
      resultingState: brokenInternalS1,
      operation: 'REFLECTION_ACROSS_LINE',
      parameters: traceEntry.parameters,
      witness,
    },
    req
  );
  assert.equal(brokenVerdict.status, 'FAIL');
  assert.equal(brokenVerdict.predicates.lengthsPreserved, false);
});

test('9. Degenerate inputs: ||n|| = 0 and NaN/Infinity return UNDETERMINED in L7 without masking real FAILs', () => {
  const s0 = makeUnitSquareTriangleState();
  const reqValid = createOperationRequest({
    sourceState: s0,
    line: { nx: 1, ny: 1, c: 1 },
    movingVertexIds: ['V3', 'V2', 'V1'],
  });
  const validOut = reflectAcrossLine({
    request: reqValid,
    sourceState: s0,
  });

  // 9a. Degenerate zero normal in L2 throws DEGENERATE_NORMAL
  const reqDeg = createOperationRequest({
    sourceState: s0,
    line: { nx: 0, ny: 0, c: 1 },
    movingVertexIds: ['V2'],
  });
  assert.throws(
    () =>
      reflectAcrossLine({
        request: reqDeg,
        sourceState: s0,
      }),
    (err: unknown) =>
      err instanceof L2EngineError && err.code === 'DEGENERATE_NORMAL'
  );

  // 9b. Degenerate zero normal in L7 returns UNDETERMINED
  const reqDegAll = createOperationRequest({
    sourceState: s0,
    line: { nx: 0, ny: 0, c: 1 },
    movingVertexIds: ['V3', 'V2', 'V1'],
  });
  const degNormalVerdict = verifyResult(
    {
      sourceState: s0,
      resultingState: validOut.resultingState,
      operation: 'REFLECTION_ACROSS_LINE',
      parameters: {
        line: { nx: 0, ny: 0, c: 1 },
        movingVertexIds: ['V3', 'V2', 'V1'],
        fixedVertexIds: [],
      },
      witness: {
        ...validOut.witness,
        operationRequestId: reqDegAll.operationRequestId,
        axis: { n: { nx: 0, ny: 0 }, c: 1 },
      },
    },
    reqDegAll
  );
  assert.equal(degNormalVerdict.status, 'UNDETERMINED');

  // 9c. NaN / Infinity in coordinates -> UNDETERMINED
  const nanState: GeometryState = {
    ...validOut.resultingState,
    vertices: validOut.resultingState.vertices.map((v) =>
      v.id === 'V2' ? { id: v.id, position: { x: Number.NaN, y: 0 } } : v
    ),
  };
  const nanVerdict = verifyResult(
    {
      sourceState: s0,
      resultingState: nanState,
      operation: 'REFLECTION_ACROSS_LINE',
      parameters: validOut.traceEntry.parameters,
      witness: validOut.witness,
    },
    reqValid
  );
  assert.equal(nanVerdict.status, 'UNDETERMINED');

  // 9d. Collinear zero-area purely moving face -> UNDETERMINED (when otherwise valid)
  const collinear = createInitialGeometryState({
    version: 0,
    vertices: [
      { id: 'A', position: { x: 0, y: 0 } },
      { id: 'B', position: { x: 1, y: 1 } },
      { id: 'C', position: { x: 2, y: 2 } },
    ],
    edges: [],
    faces: [{ id: 'F0', vertexIds: ['A', 'B', 'C'] }],
  });
  const reqCol = createOperationRequest({
    sourceState: collinear,
    line: { nx: 1, ny: 1, c: 1 },
    movingVertexIds: ['A', 'B', 'C'],
  });
  const colOut = reflectAcrossLine({
    request: reqCol,
    sourceState: collinear,
  });
  const colVerdict = verifyResult(
    {
      sourceState: collinear,
      resultingState: colOut.resultingState,
      operation: 'REFLECTION_ACROSS_LINE',
      parameters: colOut.traceEntry.parameters,
      witness: colOut.witness,
    },
    reqCol
  );
  assert.equal(colVerdict.status, 'UNDETERMINED');

  // 9e. Degenerate face MUST NOT mask a real axiom failure
  const badColS1: GeometryState = {
    ...colOut.resultingState,
    vertices: colOut.resultingState.vertices.map((v) =>
      v.id === 'C' ? { id: v.id, position: { x: 10, y: 10 } } : v
    ),
  };
  const badColVerdict = verifyResult(
    {
      sourceState: collinear,
      resultingState: badColS1,
      operation: 'REFLECTION_ACROSS_LINE',
      parameters: colOut.traceEntry.parameters,
      witness: colOut.witness,
    },
    reqCol
  );
  assert.equal(badColVerdict.status, 'FAIL');
});

test('10. Broken link between witness and stateId / stateVersion returns FAIL', () => {
  const s0 = makeUnitSquareTriangleState();
  const req = createOperationRequest({
    sourceState: s0,
    line: { nx: 1, ny: 1, c: 1 },
    movingVertexIds: ['V2'],
  });
  const { resultingState: s1, witness, traceEntry } = reflectAcrossLine({
    request: req,
    sourceState: s0,
  });

  // 10a. Wrong targetStateVersion in witness
  const wrongVersionVerdict = verifyResult(
    {
      sourceState: s0,
      resultingState: s1,
      operation: 'REFLECTION_ACROSS_LINE',
      parameters: traceEntry.parameters,
      witness: {
        ...witness,
        targetStateVersion: 99,
      },
    },
    req
  );
  assert.equal(wrongVersionVerdict.status, 'FAIL');
  assert.equal(wrongVersionVerdict.predicates.witnessBound, false);

  // 10b. Wrong sourceStateId in witness
  const wrongIdVerdict = verifyResult(
    {
      sourceState: s0,
      resultingState: s1,
      operation: 'REFLECTION_ACROSS_LINE',
      parameters: traceEntry.parameters,
      witness: {
        ...witness,
        sourceStateId: 'state-stale-id',
      },
    },
    req
  );
  assert.equal(wrongIdVerdict.status, 'FAIL');
  assert.equal(wrongIdVerdict.predicates.witnessBound, false);
  assert.equal(wrongIdVerdict.predicates.requestBound, false);
});

test('11. TRACE discontinuity, duplicate IDs, tolerance boundaries, and IEEE-754 precision', () => {
  const s0 = makeUnitSquareTriangleState();
  const req0 = createOperationRequest({
    sourceState: s0,
    line: { nx: 1, ny: 1, c: 1 },
    movingVertexIds: ['V2'],
  });
  const step0 = reflectAcrossLine({
    request: req0,
    sourceState: s0,
    stepIndex: 0,
  });

  const req1 = createOperationRequest({
    sourceState: step0.resultingState,
    line: { nx: 1, ny: 0, c: 0 },
    movingVertexIds: ['V1'],
  });
  const step1 = reflectAcrossLine({
    request: req1,
    sourceState: step0.resultingState,
    stepIndex: 1,
  });

  // Corrupt continuity in TRACE
  const brokenIntermediate = cloneGeometryState({
    ...step0.resultingState,
    vertices: step0.resultingState.vertices.map((v) =>
      v.id === 'V2' ? { id: v.id, position: { x: 0.05, y: 0.05 } } : v
    ),
  });
  const brokenEntry1 = createTraceEntry({
    operationId: step1.traceEntry.operationId,
    stepIndex: 1,
    sourceState: brokenIntermediate,
    resultingState: step1.resultingState,
    parameters: step1.traceEntry.parameters,
    request: req1,
    witness: step1.witness,
    precision: 1e-7,
    provenance: 'TEST_TAMPERED_TRACE',
  });
  const brokenTrace: readonly TraceEntry[] = appendTraceEntry(
    [step0.traceEntry],
    brokenEntry1
  );
  const brokenProcessVerdict = verifyProcess(brokenTrace, [req0, req1]);
  assert.equal(brokenProcessVerdict.status, 'FAIL');
  assert.equal(brokenProcessVerdict.predicates.traceContinuous, false);

  // Empty TRACE with empty requests -> UNDETERMINED
  const emptyVerdict = verifyProcess([], []);
  assert.equal(emptyVerdict.status, 'UNDETERMINED');

  // Tolerance boundary inside epsilon (5e-8 <= 1e-7) vs outside (5e-7 > 1e-7)
  const eps = 1e-7;
  const insideS1: GeometryState = {
    ...step0.resultingState,
    vertices: step0.resultingState.vertices.map((v) =>
      v.id === 'V2' ? { id: v.id, position: { x: 5e-8, y: 0 } } : v
    ),
  };
  const insideVerdict = verifyResult(
    {
      sourceState: s0,
      resultingState: insideS1,
      operation: 'REFLECTION_ACROSS_LINE',
      parameters: step0.traceEntry.parameters,
      witness: step0.witness,
    },
    req0,
    { epsilon: eps }
  );
  assert.equal(insideVerdict.status, 'PASS');

  const outsideS1: GeometryState = {
    ...step0.resultingState,
    vertices: step0.resultingState.vertices.map((v) =>
      v.id === 'V2' ? { id: v.id, position: { x: 5e-7, y: 0 } } : v
    ),
  };
  const outsideVerdict = verifyResult(
    {
      sourceState: s0,
      resultingState: outsideS1,
      operation: 'REFLECTION_ACROSS_LINE',
      parameters: step0.traceEntry.parameters,
      witness: step0.witness,
    },
    req0,
    { epsilon: eps }
  );
  assert.equal(outsideVerdict.status, 'FAIL');
  assert.equal(outsideVerdict.predicates.axiomsSatisfied, false);

  // Duplicate ID in movingVertexIds -> FAIL in L7, Error in L2
  const dupReq = createOperationRequest({
    sourceState: s0,
    line: { nx: 1, ny: 1, c: 1 },
    movingVertexIds: ['V2', 'V2'],
  });
  assert.throws(
    () =>
      reflectAcrossLine({
        request: dupReq,
        sourceState: s0,
      }),
    (err: unknown) =>
      err instanceof L2EngineError && err.code === 'DUPLICATE_VERTEX_ID'
  );
  const dupVerdict = verifyResult(
    {
      sourceState: s0,
      resultingState: step0.resultingState,
      operation: 'REFLECTION_ACROSS_LINE',
      parameters: {
        ...step0.traceEntry.parameters,
        movingVertexIds: ['V2', 'V2'],
      },
      witness: step0.witness,
    },
    req0
  );
  assert.equal(dupVerdict.status, 'FAIL');
  assert.equal(dupVerdict.predicates.idsPreserved, false);
});

test('12. Deep immutability & L7 architectural isolation (no L2/TRACE/OperationRequest runtime imports, no 3x3 matrix solver)', () => {
  const s0 = makeUnitSquareTriangleState();
  const req = createOperationRequest({
    sourceState: s0,
    line: { nx: 1, ny: 1, c: 1 },
    movingVertexIds: ['V2'],
  });
  const { resultingState: s1, witness, traceEntry } = reflectAcrossLine({
    request: req,
    sourceState: s0,
  });

  assert.equal(Object.isFrozen(req), true);
  assert.equal(Object.isFrozen(req.parameters), true);
  assert.equal(Object.isFrozen(req.parameters.line), true);
  assert.equal(Object.isFrozen(req.movingVertexIds), true);
  assert.equal(Object.isFrozen(req.fixedVertexIds), true);
  assert.equal(Object.isFrozen(s0), true);
  assert.equal(Object.isFrozen(s1), true);
  assert.equal(Object.isFrozen(witness), true);
  assert.equal(Object.isFrozen(witness.vertexPairs), true);
  assert.equal(Object.isFrozen(witness.vertexPairs[0]), true);
  assert.equal(Object.isFrozen(traceEntry), true);
  assert.equal(Object.isFrozen(traceEntry.request), true);
  assert.equal(Object.isFrozen(traceEntry.witness), true);

  const l7Source = fs.readFileSync(
    path.resolve(process.cwd(), 'src/core/l7IndependentVerifier.ts'),
    'utf8'
  );
  assert.equal(l7Source.includes('l2GeometryEngine'), false);
  assert.equal(l7Source.includes('./trace'), false);
  assert.equal(l7Source.includes('./operationRequest'), false);
  assert.equal(l7Source.includes('buildHomogeneousReflectionMatrix'), false);
  assert.equal(l7Source.includes('applyHomogeneous3x3'), false);
  assert.equal(l7Source.includes('Matrix3x3'), false);
  assert.equal(l7Source.includes('.toFixed('), false);

  const l2Source = fs.readFileSync(
    path.resolve(process.cwd(), 'src/core/l2GeometryEngine.ts'),
    'utf8'
  );
  assert.equal(l2Source.includes('.toFixed('), false);
});

// ===========================================================================
// Phase 2.2 Hardening Tests: OperationRequest Binding & TRACE Validation
// ===========================================================================

test('13. Coordinated substitution of claim.parameters + witness.axis + resulting geometry across axis B while keeping OperationRequest axis A MUST return FAIL', () => {
  const s0 = makeUnitSquareTriangleState();

  // Trusted OperationRequest requests reflection across axis A: x + y = 1
  const reqA = createOperationRequest({
    operationRequestId: 'req-axis-A',
    sourceState: s0,
    line: { nx: 1, ny: 1, c: 1 },
    movingVertexIds: ['V2'],
  });

  // Malicious/faulty solver instead performs a mathematically valid reflection across axis B: x = 0.5
  const reqB = createOperationRequest({
    operationRequestId: 'req-axis-B',
    sourceState: s0,
    line: { nx: 1, ny: 0, c: 0.5 },
    movingVertexIds: ['V2'],
  });
  const outB = reflectAcrossLine({
    request: reqB,
    sourceState: s0,
    stepIndex: 0,
  });

  // Coordinated forgery: claim.parameters, witness.axis, resultingState, AND witness.operationRequestId
  // are all fabricated to claim axis B under reqA's ID.
  const forgedWitness: ReflectionWitness = {
    ...outB.witness,
    operationRequestId: reqA.operationRequestId,
  };

  // Without reqA, outB's geometry would look mathematically valid for axis B;
  // against trusted reqA, L7 MUST reject with FAIL!
  const resultVerdict = verifyResult(
    {
      sourceState: s0,
      resultingState: outB.resultingState,
      operation: 'REFLECTION_ACROSS_LINE',
      parameters: outB.traceEntry.parameters,
      witness: forgedWitness,
    },
    reqA
  );
  assert.equal(resultVerdict.status, 'FAIL');
  assert.equal(resultVerdict.predicates.requestBound, false);
  assert.equal(resultVerdict.predicates.axiomsSatisfied, false);

  const forgedEntry = createTraceEntry({
    operationId: outB.traceEntry.operationId,
    stepIndex: 0,
    sourceState: s0,
    resultingState: outB.resultingState,
    parameters: outB.traceEntry.parameters,
    request: reqB,
    witness: forgedWitness,
    precision: 1e-7,
    provenance: 'COORDINATED_SUBSTITUTION_PROBE',
  });
  const processVerdict = verifyProcess([forgedEntry], [reqA]);
  assert.equal(processVerdict.status, 'FAIL');
  assert.equal(processVerdict.predicates.requestBound, false);
  assert.equal(processVerdict.predicates.traceContinuous, false);
});

test('14. Request ID, sourceState, operation type, and coordinated partition substitutions fail L2 & L7', () => {
  const s0 = makeSubdividedSquareState();
  const req = createOperationRequest({
    operationRequestId: 'req-sub-01',
    sourceState: s0,
    line: { nx: 1, ny: 1, c: 1 },
    movingVertexIds: ['V2'],
  });
  const out = reflectAcrossLine({
    request: req,
    sourceState: s0,
    stepIndex: 0,
  });

  // 14a. Witness operationRequestId substitution
  const badIdVerdict = verifyResult(
    {
      sourceState: s0,
      resultingState: out.resultingState,
      operation: 'REFLECTION_ACROSS_LINE',
      parameters: out.traceEntry.parameters,
      witness: {
        ...out.witness,
        operationRequestId: 'req-different-999',
      },
    },
    req
  );
  assert.equal(badIdVerdict.status, 'FAIL');
  assert.equal(badIdVerdict.predicates.requestBound, false);
  assert.equal(badIdVerdict.predicates.witnessBound, false);

  // 14b. Source state version/id mismatch against OperationRequest -> L2 throws & L7 fails
  const wrongVersionState = cloneGeometryState({
    ...s0,
    stateId: 'state-v99',
    version: 99,
  });
  assert.throws(
    () =>
      reflectAcrossLine({
        request: req,
        sourceState: wrongVersionState,
      }),
    (err: unknown) =>
      err instanceof L2EngineError && err.code === 'REQUEST_STATE_MISMATCH'
  );
  const wrongSourceVerdict = verifyResult(
    {
      sourceState: wrongVersionState,
      resultingState: out.resultingState,
      operation: 'REFLECTION_ACROSS_LINE',
      parameters: out.traceEntry.parameters,
      witness: out.witness,
    },
    req
  );
  assert.equal(wrongSourceVerdict.status, 'FAIL');
  assert.equal(wrongSourceVerdict.predicates.requestBound, false);

  // 14c. Operation type substitution (runtime cast)
  const badOpVerdict = verifyResult(
    {
      sourceState: s0,
      resultingState: out.resultingState,
      operation: 'ROTATION_2D' as unknown as 'REFLECTION_ACROSS_LINE',
      parameters: out.traceEntry.parameters,
      witness: out.witness,
    },
    req
  );
  assert.equal(badOpVerdict.status, 'FAIL');
  assert.equal(badOpVerdict.predicates.requestBound, false);

  // 14d. Coordinated moving/fixed partition substitution across claim + witness + geometry
  const reqOtherPartition = createOperationRequest({
    operationRequestId: 'req-other-part',
    sourceState: s0,
    line: { nx: 1, ny: 1, c: 1 },
    movingVertexIds: ['V3'],
  });
  const outOtherPartition = reflectAcrossLine({
    request: reqOtherPartition,
    sourceState: s0,
  });
  const badPartitionVerdict = verifyResult(
    {
      sourceState: s0,
      resultingState: outOtherPartition.resultingState,
      operation: 'REFLECTION_ACROSS_LINE',
      parameters: outOtherPartition.traceEntry.parameters,
      witness: {
        ...outOtherPartition.witness,
        operationRequestId: req.operationRequestId,
      },
    },
    req
  );
  assert.equal(badPartitionVerdict.status, 'FAIL');
  assert.equal(badPartitionVerdict.predicates.requestBound, false);
});

test('15. Missing OperationRequest and repeated request reuse on incompatible sourceState are rejected', () => {
  const s0 = makeUnitSquareTriangleState();
  const req0 = createOperationRequest({
    operationRequestId: 'req-reuse-00',
    sourceState: s0,
    line: { nx: 1, ny: 1, c: 1 },
    movingVertexIds: ['V2'],
  });
  const step0 = reflectAcrossLine({
    request: req0,
    sourceState: s0,
    stepIndex: 0,
  });

  // 15a. Invalid OperationRequest creation rejected
  assert.throws(
    () =>
      createOperationRequest({
        operationRequestId: '   ',
        sourceState: s0,
        line: { nx: 1, ny: 1, c: 1 },
        movingVertexIds: ['V2'],
      }),
    (err: unknown) => err instanceof OperationRequestError
  );

  // 15b. Missing request in L2 throws INVALID_OPERATION_REQUEST
  assert.throws(
    () =>
      reflectAcrossLine({
        request: undefined as unknown as OperationRequest,
        sourceState: s0,
      }),
    (err: unknown) =>
      err instanceof L2EngineError && err.code === 'INVALID_OPERATION_REQUEST'
  );

  // 15c. Missing request in L7 verifyResult returns FAIL with requestBound=false
  const missingReqVerdict = verifyResult(
    {
      sourceState: s0,
      resultingState: step0.resultingState,
      operation: 'REFLECTION_ACROSS_LINE',
      parameters: step0.traceEntry.parameters,
      witness: step0.witness,
    },
    undefined as unknown as OperationRequest
  );
  assert.equal(missingReqVerdict.status, 'FAIL');
  assert.equal(missingReqVerdict.predicates.requestBound, false);

  // 15d. Missing/count-mismatched trustedRequests in verifyProcess returns FAIL
  const missingTraceReqVerdict = verifyProcess([step0.traceEntry], []);
  assert.equal(missingTraceReqVerdict.status, 'FAIL');
  assert.equal(missingTraceReqVerdict.predicates.requestBound, false);

  // 15e. Reusing req0 for step 1 (incompatible sourceState s1) throws in L2 and fails in L7
  assert.throws(
    () =>
      reflectAcrossLine({
        request: req0,
        sourceState: step0.resultingState,
        stepIndex: 1,
      }),
    (err: unknown) =>
      err instanceof L2EngineError && err.code === 'REQUEST_STATE_MISMATCH'
  );

  const req1 = createOperationRequest({
    operationRequestId: 'req-step-01',
    sourceState: step0.resultingState,
    line: { nx: 1, ny: 0, c: 0 },
    movingVertexIds: ['V1'],
  });
  const step1 = reflectAcrossLine({
    request: req1,
    sourceState: step0.resultingState,
    stepIndex: 1,
  });

  // Attempting to reuse req0 as the second trusted request in verifyProcess fails
  const reusedReqProcess = verifyProcess(
    [step0.traceEntry, step1.traceEntry],
    [req0, req0]
  );
  assert.equal(reusedReqProcess.status, 'FAIL');
  assert.equal(reusedReqProcess.predicates.requestBound, false);
  assert.equal(reusedReqProcess.predicates.traceContinuous, false);
});

test('16. Inconsistent request inside TraceEntry vs trustedRequests sequence returns FAIL', () => {
  const s0 = makeUnitSquareTriangleState();
  const reqA = createOperationRequest({
    operationRequestId: 'req-consistent-A',
    sourceState: s0,
    line: { nx: 1, ny: 1, c: 1 },
    movingVertexIds: ['V2'],
  });
  const outA = reflectAcrossLine({
    request: reqA,
    sourceState: s0,
    stepIndex: 0,
  });

  const reqB = createOperationRequest({
    operationRequestId: reqA.operationRequestId, // same ID, different axis!
    sourceState: s0,
    line: { nx: 1, ny: 1, c: 2 },
    movingVertexIds: ['V2'],
  });

  const inconsistentTraceEntry = createTraceEntry({
    operationId: outA.traceEntry.operationId,
    stepIndex: 0,
    sourceState: s0,
    resultingState: outA.resultingState,
    parameters: outA.traceEntry.parameters,
    request: reqB,
    witness: outA.witness,
    precision: 1e-7,
    provenance: 'TAMPERED_ENTRY_REQUEST',
  });

  const verdict = verifyProcess([inconsistentTraceEntry], [reqA]);
  assert.equal(verdict.status, 'FAIL');
  assert.equal(verdict.predicates.requestBound, false);
  assert.equal(verdict.predicates.traceContinuous, false);
});

test('17. Hardened TRACE stepIndex validation rejects NaN, Infinity, -Infinity, negative, fractional, and non-monotonic stepIndex', () => {
  const s0 = makeUnitSquareTriangleState();
  const req0 = createOperationRequest({
    operationRequestId: 'req-stepidx-0',
    sourceState: s0,
    line: { nx: 1, ny: 1, c: 1 },
    movingVertexIds: ['V2'],
  });
  const step0 = reflectAcrossLine({
    request: req0,
    sourceState: s0,
    stepIndex: 0,
  });

  const req1 = createOperationRequest({
    operationRequestId: 'req-stepidx-1',
    sourceState: step0.resultingState,
    line: { nx: 1, ny: 0, c: 0 },
    movingVertexIds: ['V1'],
  });
  const step1 = reflectAcrossLine({
    request: req1,
    sourceState: step0.resultingState,
    stepIndex: 1,
  });

  const invalidIndices = [
    Number.NaN,
    Number.POSITIVE_INFINITY,
    Number.NEGATIVE_INFINITY,
    -1,
    1.5,
  ];

  for (const badStepIndex of invalidIndices) {
    const badEntry: TraceEntry = {
      ...step0.traceEntry,
      stepIndex: badStepIndex,
    };
    const verdict = verifyProcess([badEntry], [req0]);
    assert.equal(
      verdict.status,
      'FAIL',
      `Expected FAIL for stepIndex=${String(badStepIndex)}`
    );
    assert.equal(verdict.predicates.traceContinuous, false);
  }

  // Non-monotonic stepIndex (1 -> 1) fails
  const nonMonotonicStep1: TraceEntry = {
    ...step1.traceEntry,
    stepIndex: 0,
  };
  const nonMonoVerdict = verifyProcess(
    [step0.traceEntry, nonMonotonicStep1],
    [req0, req1]
  );
  assert.equal(nonMonoVerdict.status, 'FAIL');
  assert.equal(nonMonoVerdict.predicates.traceContinuous, false);

  // Valid monotonic stepIndex (0 -> 1) still fails if sourceState continuity is broken
  const brokenIntermediate = cloneGeometryState({
    ...step0.resultingState,
    vertices: step0.resultingState.vertices.map((v) =>
      v.id === 'V2' ? { id: v.id, position: { x: 0.25, y: 0.25 } } : v
    ),
  });
  const validIndexBrokenState: TraceEntry = createTraceEntry({
    operationId: step1.traceEntry.operationId,
    stepIndex: 1,
    sourceState: brokenIntermediate,
    resultingState: step1.resultingState,
    parameters: step1.traceEntry.parameters,
    request: req1,
    witness: step1.witness,
    precision: 1e-7,
    provenance: 'BROKEN_STATE_VALID_STEP_INDEX',
  });
  const brokenContinuity = verifyProcess(
    [step0.traceEntry, validIndexBrokenState],
    [req0, req1]
  );
  assert.equal(brokenContinuity.status, 'FAIL');
  assert.equal(brokenContinuity.predicates.traceContinuous, false);
});

test('18. Valid multi-step reflection sequence and involution across same axis pass verifyProcess', () => {
  const s0 = makeSubdividedSquareState();

  // 18a. Two distinct reflections: S0 -> S1 -> S2
  const req0 = createOperationRequest({
    operationRequestId: 'req-multi-0',
    sourceState: s0,
    line: { nx: 1, ny: 1, c: 1 },
    movingVertexIds: ['V2'],
  });
  const step0 = reflectAcrossLine({
    request: req0,
    sourceState: s0,
    stepIndex: 0,
  });

  const req1 = createOperationRequest({
    operationRequestId: 'req-multi-1',
    sourceState: step0.resultingState,
    line: { nx: 1, ny: 0, c: 0 },
    movingVertexIds: ['V2'],
  });
  const step1 = reflectAcrossLine({
    request: req1,
    sourceState: step0.resultingState,
    stepIndex: 1,
  });

  const multiVerdict = verifyProcess(
    [step0.traceEntry, step1.traceEntry],
    [req0, req1]
  );
  assert.equal(multiVerdict.status, 'PASS');
  assert.equal(multiVerdict.predicates.requestBound, true);
  assert.equal(multiVerdict.predicates.traceContinuous, true);
  assert.equal(multiVerdict.predicates.axiomsSatisfied, true);
  assert.equal(multiVerdict.predicates.fixedVerticesUnchanged, true);

  // 18b. Involution: second reflection across the SAME axis returns V2 to (1, 1)
  const reqInv = createOperationRequest({
    operationRequestId: 'req-involution-1',
    sourceState: step0.resultingState,
    line: { nx: 1, ny: 1, c: 1 },
    movingVertexIds: ['V2'],
  });
  const stepInv = reflectAcrossLine({
    request: reqInv,
    sourceState: step0.resultingState,
    stepIndex: 1,
  });

  const restoredV2 = stepInv.resultingState.vertices.find((v) => v.id === 'V2');
  assert.ok(restoredV2);
  assert.ok(Math.abs(restoredV2.position.x - 1) <= 1e-12);
  assert.ok(Math.abs(restoredV2.position.y - 1) <= 1e-12);

  const invVerdict = verifyProcess(
    [step0.traceEntry, stepInv.traceEntry],
    [req0, reqInv]
  );
  assert.equal(invVerdict.status, 'PASS');
  assert.equal(invVerdict.predicates.requestBound, true);
  assert.equal(invVerdict.predicates.traceContinuous, true);
});
