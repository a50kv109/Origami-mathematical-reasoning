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
  appendTraceEntry,
  cloneGeometryState,
  createTraceEntry,
} from '../src/core/trace';
import type {
  GeometryState,
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

test('1. Valid reflection with ReflectionWitness passes Result & Process verification', () => {
  const s0 = makeUnitSquareTriangleState();
  const { resultingState: s1, witness, traceEntry } = reflectAcrossLine({
    sourceState: s0,
    line: { nx: 1, ny: 1, c: 1 },
    movingVertexIds: ['V3', 'V2', 'V1'],
    stepIndex: 0,
  });

  const v2 = s1.vertices.find((v) => v.id === 'V2');
  assert.ok(v2);
  assert.ok(Math.abs(v2.position.x - 0) <= 1e-12);
  assert.ok(Math.abs(v2.position.y - 0) <= 1e-12);
  assert.equal(witness.sourceStateId, s0.stateId);
  assert.equal(witness.targetStateId, s1.stateId);
  assert.equal(witness.sourceStateVersion, 0);
  assert.equal(witness.targetStateVersion, 1);

  const claimResult = verifyResult({
    sourceState: s0,
    resultingState: s1,
    operation: 'REFLECTION_ACROSS_LINE',
    parameters: traceEntry.parameters,
    witness,
  });
  assert.equal(claimResult.status, 'PASS');
  assert.equal(claimResult.predicates.witnessBound, true);
  assert.equal(claimResult.predicates.axiomsSatisfied, true);
  assert.equal(claimResult.predicates.lengthsPreserved, true);
  assert.equal(claimResult.predicates.areaPreserved, true);
  assert.equal(claimResult.predicates.orientationInverted, true);
  assert.equal(claimResult.predicates.fixedVerticesUnchanged, true);
  assert.equal(claimResult.predicates.idsPreserved, true);
  assert.ok(claimResult.residuals.midpointError <= 1e-12);
  assert.ok(claimResult.residuals.collinearityError <= 1e-12);

  const processResult = verifyProcess([traceEntry]);
  assert.equal(processResult.status, 'PASS');
  assert.equal(processResult.predicates.traceContinuous, true);
});

test('2a. Corrupted result coordinate (2, 0) counterexample is rejected with FAIL by L7', () => {
  const s0 = makeUnitSquareTriangleState();
  const { resultingState: validS1, witness, traceEntry } = reflectAcrossLine({
    sourceState: s0,
    line: { nx: 1, ny: 1, c: 1 },
    movingVertexIds: ['V2'],
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

  const verdict = verifyResult({
    sourceState: s0,
    resultingState: tamperedS1,
    operation: 'REFLECTION_ACROSS_LINE',
    parameters: traceEntry.parameters,
    witness: tamperedWitness,
  });

  assert.equal(verdict.status, 'FAIL');
  assert.equal(verdict.predicates.axiomsSatisfied, false);
  assert.ok(verdict.residuals.collinearityError > 1.4);
});

test('2b. Result coordinate shifted by 1e-2 is rejected with FAIL', () => {
  const s0 = makeUnitSquareTriangleState();
  const { resultingState: validS1, witness, traceEntry } = reflectAcrossLine({
    sourceState: s0,
    line: { nx: 1, ny: 1, c: 1 },
    movingVertexIds: ['V2'],
  });

  const shiftedS1: GeometryState = {
    ...validS1,
    vertices: validS1.vertices.map((v) =>
      v.id === 'V2' ? { id: v.id, position: { x: 0.01, y: 0 } } : v
    ),
  };

  const verdict = verifyResult({
    sourceState: s0,
    resultingState: shiftedS1,
    operation: 'REFLECTION_ACROSS_LINE',
    parameters: traceEntry.parameters,
    witness,
  });

  assert.equal(verdict.status, 'FAIL');
  assert.equal(verdict.predicates.axiomsSatisfied, false);
  assert.equal(verdict.predicates.witnessBound, false);
});

test('3. Tampered sourceState (mismatch between sourceState and witness) fails with witnessBound=false', () => {
  const s0 = makeUnitSquareTriangleState();
  const { resultingState: s1, witness, traceEntry } = reflectAcrossLine({
    sourceState: s0,
    line: { nx: 1, ny: 1, c: 1 },
    movingVertexIds: ['V2'],
  });

  const tamperedSource: GeometryState = cloneGeometryState({
    ...s0,
    vertices: s0.vertices.map((v) =>
      v.id === 'V2' ? { id: v.id, position: { x: 1.5, y: 1 } } : v
    ),
  });

  const verdict = verifyResult({
    sourceState: tamperedSource,
    resultingState: s1,
    operation: 'REFLECTION_ACROSS_LINE',
    parameters: traceEntry.parameters,
    witness,
  });

  assert.equal(verdict.status, 'FAIL');
  assert.equal(verdict.predicates.witnessBound, false);
});

test('4. Tampered axis parameters (n or c) in witness or claim fails L7 verification', () => {
  const s0 = makeUnitSquareTriangleState();
  const { resultingState: s1, witness, traceEntry } = reflectAcrossLine({
    sourceState: s0,
    line: { nx: 1, ny: 1, c: 1 },
    movingVertexIds: ['V2'],
  });

  // 4a. Tamper c in claim.parameters only
  const claimTamperedVerdict = verifyResult({
    sourceState: s0,
    resultingState: s1,
    operation: 'REFLECTION_ACROSS_LINE',
    parameters: {
      ...traceEntry.parameters,
      line: { nx: 1, ny: 1, c: 1.25 },
    },
    witness,
  });
  assert.equal(claimTamperedVerdict.status, 'FAIL');
  assert.equal(claimTamperedVerdict.predicates.witnessBound, false);
  assert.equal(claimTamperedVerdict.predicates.axiomsSatisfied, false);

  // 4b. Tamper normal n in witness only
  const witnessTamperedVerdict = verifyResult({
    sourceState: s0,
    resultingState: s1,
    operation: 'REFLECTION_ACROSS_LINE',
    parameters: traceEntry.parameters,
    witness: {
      ...witness,
      axis: { n: { nx: 2, ny: 1 }, c: 1 },
    },
  });
  assert.equal(witnessTamperedVerdict.status, 'FAIL');
  assert.equal(witnessTamperedVerdict.predicates.witnessBound, false);
});

test('5. Tampered movingVertexIds (reclassifying moving vertex as fixed or omitting vertex) fails L7', () => {
  const s0 = makeSubdividedSquareState();
  const { resultingState: s1, witness, traceEntry } = reflectAcrossLine({
    sourceState: s0,
    line: { nx: 1, ny: 1, c: 1 },
    movingVertexIds: ['V2'],
  });

  // 5a. Move V2 into fixedVertexIds in claim & witness
  const movedToFixedVerdict = verifyResult({
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
  });
  assert.equal(movedToFixedVerdict.status, 'FAIL');
  assert.equal(movedToFixedVerdict.predicates.fixedVerticesUnchanged, false);

  // 5b. Omit a vertex from fixedVertexIds (incomplete partition)
  const omittedVertexVerdict = verifyResult({
    sourceState: s0,
    resultingState: s1,
    operation: 'REFLECTION_ACROSS_LINE',
    parameters: {
      ...traceEntry.parameters,
      fixedVertexIds: ['V0', 'V1'], // V3 omitted!
    },
    witness,
  });
  assert.equal(omittedVertexVerdict.status, 'FAIL');
  assert.equal(omittedVertexVerdict.predicates.idsPreserved, false);
  assert.equal(omittedVertexVerdict.predicates.witnessBound, false);
});

test('6. Forged claimedResiduals=0 cannot fool L7 when coordinates are invalid', () => {
  const s0 = makeUnitSquareTriangleState();
  const { resultingState: s1, witness, traceEntry } = reflectAcrossLine({
    sourceState: s0,
    line: { nx: 1, ny: 1, c: 1 },
    movingVertexIds: ['V2'],
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

  const verdict = verifyResult({
    sourceState: s0,
    resultingState: corruptedS1,
    operation: 'REFLECTION_ACROSS_LINE',
    parameters: traceEntry.parameters,
    witness: forgedWitness,
  });

  assert.equal(verdict.status, 'FAIL');
  assert.equal(verdict.predicates.axiomsSatisfied, false);
  assert.ok(verdict.residuals.midpointError > 0.1);
  assert.ok(verdict.residuals.collinearityError > 0.1);
});

test('7. Scale invariance of reflection axis: multiplying n and c by 1e6 passes cleanly', () => {
  const s0 = makeUnitSquareTriangleState();
  const scale = 1e6;
  const { resultingState: s1, witness, traceEntry } = reflectAcrossLine({
    sourceState: s0,
    line: { nx: 3 * scale, ny: -4 * scale, c: 5 * scale },
    movingVertexIds: ['V3', 'V2', 'V1'],
  });

  const verdict = verifyProcess([traceEntry], { epsilon: 1e-12 });
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
  const { resultingState: s1, witness, traceEntry } = reflectAcrossLine({
    sourceState: s0,
    line: { nx: 1, ny: 0, c: 4 },
    movingVertexIds: ['D', 'E', 'G'],
  });

  const verdict = verifyResult({
    sourceState: s0,
    resultingState: s1,
    operation: 'REFLECTION_ACROSS_LINE',
    parameters: traceEntry.parameters,
    witness,
  });

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
  const brokenVerdict = verifyResult({
    sourceState: s0,
    resultingState: brokenInternalS1,
    operation: 'REFLECTION_ACROSS_LINE',
    parameters: traceEntry.parameters,
    witness,
  });
  assert.equal(brokenVerdict.status, 'FAIL');
  assert.equal(brokenVerdict.predicates.lengthsPreserved, false);
});

test('9. Degenerate inputs: ||n|| = 0 and NaN/Infinity return UNDETERMINED in L7 without masking real FAILs', () => {
  const s0 = makeUnitSquareTriangleState();
  const validOut = reflectAcrossLine({
    sourceState: s0,
    line: { nx: 1, ny: 1, c: 1 },
    movingVertexIds: ['V3', 'V2', 'V1'],
  });

  // 9a. Degenerate zero normal in L2 throws DEGENERATE_NORMAL
  assert.throws(
    () =>
      reflectAcrossLine({
        sourceState: s0,
        line: { nx: 0, ny: 0, c: 1 },
        movingVertexIds: ['V2'],
      }),
    (err: unknown) =>
      err instanceof L2EngineError && err.code === 'DEGENERATE_NORMAL'
  );

  // 9b. Degenerate zero normal in L7 returns UNDETERMINED
  const degNormalVerdict = verifyResult({
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
      axis: { n: { nx: 0, ny: 0 }, c: 1 },
    },
  });
  assert.equal(degNormalVerdict.status, 'UNDETERMINED');

  // 9c. NaN / Infinity in coordinates -> UNDETERMINED
  const nanState: GeometryState = {
    ...validOut.resultingState,
    vertices: validOut.resultingState.vertices.map((v) =>
      v.id === 'V2' ? { id: v.id, position: { x: Number.NaN, y: 0 } } : v
    ),
  };
  const nanVerdict = verifyResult({
    sourceState: s0,
    resultingState: nanState,
    operation: 'REFLECTION_ACROSS_LINE',
    parameters: validOut.traceEntry.parameters,
    witness: validOut.witness,
  });
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
  const colOut = reflectAcrossLine({
    sourceState: collinear,
    line: { nx: 1, ny: 1, c: 1 },
    movingVertexIds: ['A', 'B', 'C'],
  });
  const colVerdict = verifyResult({
    sourceState: collinear,
    resultingState: colOut.resultingState,
    operation: 'REFLECTION_ACROSS_LINE',
    parameters: colOut.traceEntry.parameters,
    witness: colOut.witness,
  });
  assert.equal(colVerdict.status, 'UNDETERMINED');

  // 9e. Degenerate face MUST NOT mask a real axiom failure
  const badColS1: GeometryState = {
    ...colOut.resultingState,
    vertices: colOut.resultingState.vertices.map((v) =>
      v.id === 'C' ? { id: v.id, position: { x: 10, y: 10 } } : v
    ),
  };
  const badColVerdict = verifyResult({
    sourceState: collinear,
    resultingState: badColS1,
    operation: 'REFLECTION_ACROSS_LINE',
    parameters: colOut.traceEntry.parameters,
    witness: colOut.witness,
  });
  assert.equal(badColVerdict.status, 'FAIL');
});

test('10. Broken link between witness and stateId / stateVersion returns FAIL', () => {
  const s0 = makeUnitSquareTriangleState();
  const { resultingState: s1, witness, traceEntry } = reflectAcrossLine({
    sourceState: s0,
    line: { nx: 1, ny: 1, c: 1 },
    movingVertexIds: ['V2'],
  });

  // 10a. Wrong targetStateVersion in witness
  const wrongVersionVerdict = verifyResult({
    sourceState: s0,
    resultingState: s1,
    operation: 'REFLECTION_ACROSS_LINE',
    parameters: traceEntry.parameters,
    witness: {
      ...witness,
      targetStateVersion: 99,
    },
  });
  assert.equal(wrongVersionVerdict.status, 'FAIL');
  assert.equal(wrongVersionVerdict.predicates.witnessBound, false);

  // 10b. Wrong sourceStateId in witness
  const wrongIdVerdict = verifyResult({
    sourceState: s0,
    resultingState: s1,
    operation: 'REFLECTION_ACROSS_LINE',
    parameters: traceEntry.parameters,
    witness: {
      ...witness,
      sourceStateId: 'state-stale-id',
    },
  });
  assert.equal(wrongIdVerdict.status, 'FAIL');
  assert.equal(wrongIdVerdict.predicates.witnessBound, false);
});

test('11. TRACE discontinuity, duplicate IDs, tolerance boundaries, and IEEE-754 precision', () => {
  const s0 = makeUnitSquareTriangleState();
  const step0 = reflectAcrossLine({
    sourceState: s0,
    line: { nx: 1, ny: 1, c: 1 },
    movingVertexIds: ['V2'],
    stepIndex: 0,
  });
  const step1 = reflectAcrossLine({
    sourceState: step0.resultingState,
    line: { nx: 1, ny: 0, c: 0 },
    movingVertexIds: ['V1'],
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
    witness: step1.witness,
    precision: 1e-7,
    provenance: 'TEST_TAMPERED_TRACE',
  });
  const brokenTrace: readonly TraceEntry[] = appendTraceEntry(
    [step0.traceEntry],
    brokenEntry1
  );
  const brokenProcessVerdict = verifyProcess(brokenTrace);
  assert.equal(brokenProcessVerdict.status, 'FAIL');
  assert.equal(brokenProcessVerdict.predicates.traceContinuous, false);

  // Empty TRACE -> UNDETERMINED
  const emptyVerdict = verifyProcess([]);
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
    { epsilon: eps }
  );
  assert.equal(outsideVerdict.status, 'FAIL');
  assert.equal(outsideVerdict.predicates.axiomsSatisfied, false);

  // Duplicate ID in movingVertexIds -> FAIL in L7, Error in L2
  assert.throws(
    () =>
      reflectAcrossLine({
        sourceState: s0,
        line: { nx: 1, ny: 1, c: 1 },
        movingVertexIds: ['V2', 'V2'],
      }),
    (err: unknown) =>
      err instanceof L2EngineError && err.code === 'DUPLICATE_VERTEX_ID'
  );
  const dupVerdict = verifyResult({
    sourceState: s0,
    resultingState: step0.resultingState,
    operation: 'REFLECTION_ACROSS_LINE',
    parameters: {
      ...step0.traceEntry.parameters,
      movingVertexIds: ['V2', 'V2'],
    },
    witness: step0.witness,
  });
  assert.equal(dupVerdict.status, 'FAIL');
  assert.equal(dupVerdict.predicates.idsPreserved, false);
});

test('12. Deep immutability & L7 architectural isolation (no L2 imports, no 3x3 matrix solver)', () => {
  const s0 = makeUnitSquareTriangleState();
  const { resultingState: s1, witness, traceEntry } = reflectAcrossLine({
    sourceState: s0,
    line: { nx: 1, ny: 1, c: 1 },
    movingVertexIds: ['V2'],
  });

  assert.equal(Object.isFrozen(s0), true);
  assert.equal(Object.isFrozen(s1), true);
  assert.equal(Object.isFrozen(witness), true);
  assert.equal(Object.isFrozen(witness.vertexPairs), true);
  assert.equal(Object.isFrozen(witness.vertexPairs[0]), true);
  assert.equal(Object.isFrozen(traceEntry), true);
  assert.equal(Object.isFrozen(traceEntry.witness), true);

  const l7Source = fs.readFileSync(
    path.resolve(process.cwd(), 'src/core/l7IndependentVerifier.ts'),
    'utf8'
  );
  assert.equal(l7Source.includes('l2GeometryEngine'), false);
  assert.equal(l7Source.includes('./trace'), false);
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
