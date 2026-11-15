/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Phase 2.3 — Implementation Step 1 & Step 2: Deterministic Metamorphic Tests
 * Covers:
 *   - Property A: Reflection Involution: R_L(R_L(P)) = P
 *   - Property B: Axis Coefficient Scaling: R_(n,c)(P) = R_(alpha*n, alpha*c)(P)
 *   - Property C: Translation Equivariance: T_v(R_L(P)) = R_(T_v(L))(T_v(P))
 *   - Property D: Pairwise Distance Invariance: ||R_L(P_i) - R_L(P_j)|| = ||P_i - P_j||
 *   - Property E: Fixed Points on Reflection Axis: P in L => R_L(P) = P
 *   - Negative Controls: Corrupted distance, displaced axis/fixed vertices, forged claimedResiduals
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createInitialGeometryState,
  reflectAcrossLine,
} from '../src/core/l2GeometryEngine';
import {
  DEFAULT_VERIFIER_TOLERANCES,
  verifyProcess,
  verifyResult,
} from '../src/core/l7IndependentVerifier';
import { createOperationRequest } from '../src/core/operationRequest';
import type {
  GeometryState,
  LineNormalParams,
  Point2D,
  ReflectionWitness,
  VertexId,
} from '../src/core/types';

const FIXED_TIMESTAMP = '2026-01-01T00:00:00.000Z';
const METAMORPHIC_COORD_TOLERANCE = 1e-12;
// Relative distance tolerance scaled by max(1, ||P_i - P_j||) so small & moderate distances stay tight
const METAMORPHIC_DISTANCE_REL_TOLERANCE = 1e-12;

function makeSubdividedSquare(stateId = 'sq-v0', version = 0): GeometryState {
  return createInitialGeometryState({
    stateId,
    version,
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

function makeAsymmetricPolygonMesh(
  stateId = 'mesh-v0',
  version = 0
): GeometryState {
  return createInitialGeometryState({
    stateId,
    version,
    vertices: [
      { id: 'P0', position: { x: -2.5, y: 1.25 } },
      { id: 'P1', position: { x: 0.75, y: -1.5 } },
      { id: 'P2', position: { x: 3.5, y: 2.0 } },
      { id: 'P3', position: { x: 1.25, y: 4.5 } },
      { id: 'P4', position: { x: -1.0, y: 3.0 } },
    ],
    edges: [
      { id: 'E_01', startVertexId: 'P0', endVertexId: 'P1' },
      { id: 'E_14', startVertexId: 'P1', endVertexId: 'P4' },
      { id: 'E_40', startVertexId: 'P4', endVertexId: 'P0' },
      { id: 'E_12', startVertexId: 'P1', endVertexId: 'P2' },
      { id: 'E_24', startVertexId: 'P2', endVertexId: 'P4' },
      { id: 'E_23', startVertexId: 'P2', endVertexId: 'P3' },
      { id: 'E_34', startVertexId: 'P3', endVertexId: 'P4' },
    ],
    faces: [
      { id: 'F_LEFT', vertexIds: ['P0', 'P1', 'P4'] },
      { id: 'F_MID', vertexIds: ['P1', 'P2', 'P4'] },
      { id: 'F_TOP', vertexIds: ['P4', 'P2', 'P3'] },
    ],
  });
}

function translateGeometryState(
  state: GeometryState,
  v: Point2D,
  stateId: string,
  version: number
): GeometryState {
  return createInitialGeometryState({
    stateId,
    version,
    vertices: state.vertices.map((vertex) => ({
      id: vertex.id,
      position: {
        x: vertex.position.x + v.x,
        y: vertex.position.y + v.y,
      },
    })),
    edges: state.edges,
    faces: state.faces,
  });
}

function translateLine(line: LineNormalParams, v: Point2D): LineNormalParams {
  return {
    nx: line.nx,
    ny: line.ny,
    c: line.c + line.nx * v.x + line.ny * v.y,
  };
}

interface FailureDiagnosticContext {
  readonly property: string;
  readonly parameters: Record<string, unknown>;
  readonly sourceState: GeometryState;
  readonly expectedRelation: string;
}

function assertTopologyPreserved(
  actual: GeometryState,
  expected: GeometryState,
  ctx: FailureDiagnosticContext
): void {
  const details = JSON.stringify({
    property: ctx.property,
    parameters: ctx.parameters,
    sourceStateId: ctx.sourceState.stateId,
    sourceVersion: ctx.sourceState.version,
    expectedRelation: ctx.expectedRelation,
  });

  assert.equal(
    actual.vertices.length,
    expected.vertices.length,
    `Vertex count mismatch (${details})`
  );
  for (let i = 0; i < expected.vertices.length; i++) {
    assert.equal(
      actual.vertices[i]?.id,
      expected.vertices[i]?.id,
      `Vertex ID mismatch at index ${i} (${details})`
    );
  }

  assert.equal(
    actual.edges.length,
    expected.edges.length,
    `Edge count mismatch (${details})`
  );
  for (let i = 0; i < expected.edges.length; i++) {
    assert.deepEqual(
      actual.edges[i],
      expected.edges[i],
      `Edge topology mismatch at index ${i} (${details})`
    );
  }

  assert.equal(
    actual.faces.length,
    expected.faces.length,
    `Face count mismatch (${details})`
  );
  for (let i = 0; i < expected.faces.length; i++) {
    assert.deepEqual(
      actual.faces[i],
      expected.faces[i],
      `Face topology mismatch at index ${i} (${details})`
    );
  }
}

function assertStatesGeometricallyEquivalent(
  actual: GeometryState,
  expected: GeometryState,
  tolerance: number,
  ctx: FailureDiagnosticContext,
  fixedVertexIds: readonly VertexId[] = []
): number {
  assertTopologyPreserved(actual, expected, ctx);

  const actualMap = new Map(actual.vertices.map((v) => [v.id, v.position]));
  const expectedMap = new Map(expected.vertices.map((v) => [v.id, v.position]));
  const fixedSet = new Set(fixedVertexIds);

  let maxResidual = 0;
  let worstVertexId = '';
  let maxFixedResidual = 0;
  let worstFixedId = '';

  for (const [id, expPos] of expectedMap.entries()) {
    const actPos = actualMap.get(id);
    assert.ok(
      actPos,
      `Missing vertex ${id} in actual state for ${ctx.property}`
    );
    const residual = Math.hypot(actPos.x - expPos.x, actPos.y - expPos.y);
    if (residual > maxResidual) {
      maxResidual = residual;
      worstVertexId = id;
    }
    if (fixedSet.has(id) && residual > maxFixedResidual) {
      maxFixedResidual = residual;
      worstFixedId = id;
    }
  }

  assert.ok(
    maxFixedResidual <= tolerance,
    `Fixed vertex drift exceeded tolerance (${JSON.stringify({
      property: ctx.property,
      parameters: ctx.parameters,
      sourceState: {
        stateId: ctx.sourceState.stateId,
        version: ctx.sourceState.version,
        vertices: ctx.sourceState.vertices,
      },
      expectedRelation: `${ctx.expectedRelation} (fixed vertices invariant)`,
      worstFixedId,
      actualResidual: maxFixedResidual,
      tolerance,
    })})`
  );

  assert.ok(
    maxResidual <= tolerance,
    `Coordinate residual exceeded tolerance (${JSON.stringify({
      property: ctx.property,
      parameters: ctx.parameters,
      sourceState: {
        stateId: ctx.sourceState.stateId,
        version: ctx.sourceState.version,
        vertices: ctx.sourceState.vertices,
      },
      expectedRelation: ctx.expectedRelation,
      worstVertexId,
      actualResidual: maxResidual,
      tolerance,
    })})`
  );

  return maxResidual;
}

// ===========================================================================
// Property A — Reflection Involution: R_L(R_L(P)) = P
// ===========================================================================

test('Property A (Involution): R_L(R_L(P)) restores full geometry, IDs, topology, and passes L7', () => {
  const cases: readonly {
    readonly id: string;
    readonly buildState: () => GeometryState;
    readonly line: LineNormalParams;
    readonly movingVertexIds: readonly VertexId[];
  }[] = [
    {
      id: 'subdivided-square-partial',
      buildState: () => makeSubdividedSquare('sq-inv-v0', 0),
      line: { nx: 1, ny: 1, c: 1 },
      movingVertexIds: ['V2'],
    },
    {
      id: 'subdivided-square-full-oblique',
      buildState: () => makeSubdividedSquare('sq-full-v0', 0),
      line: { nx: 3, ny: -4, c: 5 },
      movingVertexIds: ['V0', 'V1', 'V2', 'V3'],
    },
    {
      id: 'asymmetric-mesh-partial-negative-line',
      buildState: () => makeAsymmetricPolygonMesh('mesh-part-v0', 0),
      line: { nx: -2.5, ny: 1.75, c: -3.25 },
      movingVertexIds: ['P2', 'P3'],
    },
    {
      id: 'asymmetric-mesh-full-vertical-line',
      buildState: () => makeAsymmetricPolygonMesh('mesh-vert-v0', 0),
      line: { nx: 1, ny: 0, c: -1.5 },
      movingVertexIds: ['P0', 'P1', 'P2', 'P3', 'P4'],
    },
    {
      id: 'asymmetric-mesh-full-horizontal-line',
      buildState: () => makeAsymmetricPolygonMesh('mesh-horiz-v0', 0),
      line: { nx: 0, ny: 1, c: 2.25 },
      movingVertexIds: ['P0', 'P1', 'P2', 'P3', 'P4'],
    },
  ];

  for (const tc of cases) {
    const s0 = tc.buildState();

    // Step 1: S0 -> S1 via OperationRequest A
    const reqA = createOperationRequest({
      operationRequestId: `req-inv-${tc.id}-A`,
      sourceState: s0,
      line: tc.line,
      movingVertexIds: tc.movingVertexIds,
      timestamp: FIXED_TIMESTAMP,
    });
    const out1 = reflectAcrossLine({
      request: reqA,
      sourceState: s0,
      targetStateId: `${s0.stateId}-step1`,
      stepIndex: 0,
      timestamp: FIXED_TIMESTAMP,
    });

    const verdict1 = verifyResult(
      {
        sourceState: s0,
        resultingState: out1.resultingState,
        operation: 'REFLECTION_ACROSS_LINE',
        parameters: out1.traceEntry.parameters,
        witness: out1.witness,
      },
      reqA
    );
    assert.equal(
      verdict1.status,
      'PASS',
      `Step 1 L7 verifyResult failed for ${tc.id}: ${verdict1.diagnostics.join('; ')}`
    );
    assert.equal(verdict1.predicates.requestBound, true);
    assert.equal(verdict1.predicates.witnessBound, true);

    // Verify fixed vertices stayed unchanged after step 1
    const movingSet = new Set(tc.movingVertexIds);
    const fixedIds = s0.vertices
      .filter((v) => !movingSet.has(v.id))
      .map((v) => v.id);
    for (const fid of fixedIds) {
      const p0 = s0.vertices.find((v) => v.id === fid)!.position;
      const p1 = out1.resultingState.vertices.find((v) => v.id === fid)!.position;
      const drift = Math.hypot(p1.x - p0.x, p1.y - p0.y);
      assert.ok(
        drift <= METAMORPHIC_COORD_TOLERANCE,
        `Fixed vertex ${fid} drifted in step 1 of ${tc.id}: residual=${drift}`
      );
    }

    // Step 2: S1 -> S2 via distinct OperationRequest B with same geometric axis
    const reqB = createOperationRequest({
      operationRequestId: `req-inv-${tc.id}-B`,
      sourceState: out1.resultingState,
      line: tc.line,
      movingVertexIds: tc.movingVertexIds,
      timestamp: FIXED_TIMESTAMP,
    });
    assert.notEqual(reqA.operationRequestId, reqB.operationRequestId);

    const out2 = reflectAcrossLine({
      request: reqB,
      sourceState: out1.resultingState,
      targetStateId: `${s0.stateId}-step2`,
      stepIndex: 1,
      timestamp: FIXED_TIMESTAMP,
    });

    const verdict2 = verifyResult(
      {
        sourceState: out1.resultingState,
        resultingState: out2.resultingState,
        operation: 'REFLECTION_ACROSS_LINE',
        parameters: out2.traceEntry.parameters,
        witness: out2.witness,
      },
      reqB
    );
    assert.equal(
      verdict2.status,
      'PASS',
      `Step 2 L7 verifyResult failed for ${tc.id}: ${verdict2.diagnostics.join('; ')}`
    );

    const processVerdict = verifyProcess(
      [out1.traceEntry, out2.traceEntry],
      [reqA, reqB]
    );
    assert.equal(
      processVerdict.status,
      'PASS',
      `Process L7 verifyProcess failed for ${tc.id}: ${processVerdict.diagnostics.join('; ')}`
    );
    assert.equal(processVerdict.predicates.traceContinuous, true);
    assert.equal(processVerdict.predicates.requestBound, true);

    // Validate sequence metadata
    assert.notEqual(s0.stateId, out1.resultingState.stateId);
    assert.notEqual(out1.resultingState.stateId, out2.resultingState.stateId);
    assert.ok(s0.version < out1.resultingState.version);
    assert.ok(out1.resultingState.version < out2.resultingState.version);

    // Compare S2 back to S0 across all vertices, IDs, and topology
    assertStatesGeometricallyEquivalent(
      out2.resultingState,
      s0,
      METAMORPHIC_COORD_TOLERANCE,
      {
        property: 'Property A: Reflection Involution R_L(R_L(P)) = P',
        parameters: {
          caseId: tc.id,
          line: tc.line,
          movingVertexIds: tc.movingVertexIds,
        },
        sourceState: s0,
        expectedRelation: 'R_L(R_L(P)) equals P in coordinates, IDs, and topology',
      },
      fixedIds
    );
  }
});

// ===========================================================================
// Property B — Axis Coefficient Scaling: R_(n,c)(P) = R_(αn,αc)(P)
// ===========================================================================

test('Property B (Axis Coefficient Scaling): R_(n,c)(P) = R_(alpha*n, alpha*c)(P) across admissible alpha', () => {
  const alphas = [1, -1, 1e-3, 1e3, 1e6] as const;

  const scenarios: readonly {
    readonly id: string;
    readonly sourceState: GeometryState;
    readonly baseLine: LineNormalParams;
    readonly movingVertexIds: readonly VertexId[];
  }[] = [
    {
      id: 'square-partial-diag',
      sourceState: makeSubdividedSquare('sq-scale-v0', 0),
      baseLine: { nx: 1, ny: 1, c: 1 },
      movingVertexIds: ['V2'],
    },
    {
      id: 'mesh-partial-oblique',
      sourceState: makeAsymmetricPolygonMesh('mesh-scale-part-v0', 0),
      baseLine: { nx: 3, ny: -4, c: 5 },
      movingVertexIds: ['P2', 'P3'],
    },
    {
      id: 'mesh-full-negative-oblique',
      sourceState: makeAsymmetricPolygonMesh('mesh-scale-full-v0', 0),
      baseLine: { nx: -1.5, ny: 2.25, c: -3.5 },
      movingVertexIds: ['P0', 'P1', 'P2', 'P3', 'P4'],
    },
  ];

  for (const sc of scenarios) {
    const movingSet = new Set(sc.movingVertexIds);
    const fixedIds = sc.sourceState.vertices
      .filter((v) => !movingSet.has(v.id))
      .map((v) => v.id);

    const baseReq = createOperationRequest({
      operationRequestId: `req-scale-${sc.id}-base`,
      sourceState: sc.sourceState,
      line: sc.baseLine,
      movingVertexIds: sc.movingVertexIds,
      timestamp: FIXED_TIMESTAMP,
    });
    const baseOut = reflectAcrossLine({
      request: baseReq,
      sourceState: sc.sourceState,
      stepIndex: 0,
      timestamp: FIXED_TIMESTAMP,
    });
    const baseVerdict = verifyResult(
      {
        sourceState: sc.sourceState,
        resultingState: baseOut.resultingState,
        operation: 'REFLECTION_ACROSS_LINE',
        parameters: baseOut.traceEntry.parameters,
        witness: baseOut.witness,
      },
      baseReq
    );
    assert.equal(baseVerdict.status, 'PASS');

    for (const alpha of alphas) {
      const scaledLine: LineNormalParams = {
        nx: alpha * sc.baseLine.nx,
        ny: alpha * sc.baseLine.ny,
        c: alpha * sc.baseLine.c,
      };
      const scaledNorm = Math.hypot(scaledLine.nx, scaledLine.ny);
      assert.ok(
        scaledNorm > DEFAULT_VERIFIER_TOLERANCES.zeroNormalEpsilon,
        `Scaled normal for alpha=${alpha} must remain above zeroNormalEpsilon`
      );

      const scaledReq = createOperationRequest({
        operationRequestId: `req-scale-${sc.id}-alpha-${String(alpha)}`,
        sourceState: sc.sourceState,
        line: scaledLine,
        movingVertexIds: sc.movingVertexIds,
        timestamp: FIXED_TIMESTAMP,
      });
      const scaledOut = reflectAcrossLine({
        request: scaledReq,
        sourceState: sc.sourceState,
        stepIndex: 0,
        timestamp: FIXED_TIMESTAMP,
      });

      // Verify independently through L7 using default tolerances (no relaxation)
      const scaledVerdict = verifyResult(
        {
          sourceState: sc.sourceState,
          resultingState: scaledOut.resultingState,
          operation: 'REFLECTION_ACROSS_LINE',
          parameters: scaledOut.traceEntry.parameters,
          witness: scaledOut.witness,
        },
        scaledReq
      );
      assert.equal(
        scaledVerdict.status,
        'PASS',
        `L7 verifyResult failed for ${sc.id} alpha=${alpha}: ${scaledVerdict.diagnostics.join('; ')}`
      );
      assert.equal(scaledVerdict.predicates.requestBound, true);
      assert.equal(scaledVerdict.predicates.axiomsSatisfied, true);

      assertStatesGeometricallyEquivalent(
        scaledOut.resultingState,
        baseOut.resultingState,
        METAMORPHIC_COORD_TOLERANCE,
        {
          property:
            'Property B: Axis Coefficient Scaling R_(n,c)(P) = R_(alpha*n, alpha*c)(P)',
          parameters: {
            scenarioId: sc.id,
            alpha,
            baseLine: sc.baseLine,
            scaledLine,
            movingVertexIds: sc.movingVertexIds,
          },
          sourceState: sc.sourceState,
          expectedRelation:
            'Scaled-axis reflection state equals baseline (alpha=1) reflection state',
        },
        fixedIds
      );
    }
  }
});

// ===========================================================================
// Property C — Translation Equivariance: T_v(R_L(P)) = R_(T_v(L))(T_v(P))
// ===========================================================================

test('Property C (Translation Equivariance): T_v(R_L(P)) = R_(T_v(L))(T_v(P)) with L7 verification', () => {
  const translations: readonly { readonly label: string; readonly v: Point2D }[] = [
    { label: 'positive', v: { x: 4.5, y: 7.25 } },
    { label: 'negative', v: { x: -6.5, y: -3.75 } },
    { label: 'mixed-sign', v: { x: -8.25, y: 5.5 } },
    { label: 'moderate-offset', v: { x: 42.125, y: -31.875 } },
  ];

  const scenarios: readonly {
    readonly id: string;
    readonly sourceState: GeometryState;
    readonly line: LineNormalParams;
    readonly movingVertexIds: readonly VertexId[];
  }[] = [
    {
      id: 'square-partial',
      sourceState: makeSubdividedSquare('sq-trans-v0', 0),
      line: { nx: 1, ny: 1, c: 1 },
      movingVertexIds: ['V2'],
    },
    {
      id: 'mesh-partial',
      sourceState: makeAsymmetricPolygonMesh('mesh-trans-part-v0', 0),
      line: { nx: 3, ny: -4, c: 5 },
      movingVertexIds: ['P2', 'P3'],
    },
    {
      id: 'mesh-full',
      sourceState: makeAsymmetricPolygonMesh('mesh-trans-full-v0', 0),
      line: { nx: -2, ny: 5, c: 3 },
      movingVertexIds: ['P0', 'P1', 'P2', 'P3', 'P4'],
    },
  ];

  for (const sc of scenarios) {
    // Branch 1 step 1: Reflect original P across L
    const reqOriginal = createOperationRequest({
      operationRequestId: `req-trans-${sc.id}-orig`,
      sourceState: sc.sourceState,
      line: sc.line,
      movingVertexIds: sc.movingVertexIds,
      timestamp: FIXED_TIMESTAMP,
    });
    const reflectedOriginal = reflectAcrossLine({
      request: reqOriginal,
      sourceState: sc.sourceState,
      stepIndex: 0,
      timestamp: FIXED_TIMESTAMP,
    });
    const verdictOrig = verifyResult(
      {
        sourceState: sc.sourceState,
        resultingState: reflectedOriginal.resultingState,
        operation: 'REFLECTION_ACROSS_LINE',
        parameters: reflectedOriginal.traceEntry.parameters,
        witness: reflectedOriginal.witness,
      },
      reqOriginal
    );
    assert.equal(
      verdictOrig.status,
      'PASS',
      `Original branch L7 failed for ${sc.id}: ${verdictOrig.diagnostics.join('; ')}`
    );

    for (const tr of translations) {
      // Branch 1 step 2: T_v(R_L(P))
      const translatedReflected = translateGeometryState(
        reflectedOriginal.resultingState,
        tr.v,
        `branch1-${sc.id}-${tr.label}`,
        1
      );

      // Branch 2: T_v(P) and T_v(L) where c' = c + nx*a + ny*b, then R_(T_v(L))(T_v(P))
      const translatedSource = translateGeometryState(
        sc.sourceState,
        tr.v,
        `translated-src-${sc.id}-${tr.label}`,
        0
      );
      const translatedAxis = translateLine(sc.line, tr.v);
      const reqTranslated = createOperationRequest({
        operationRequestId: `req-trans-${sc.id}-${tr.label}`,
        sourceState: translatedSource,
        line: translatedAxis,
        movingVertexIds: sc.movingVertexIds,
        timestamp: FIXED_TIMESTAMP,
      });
      const reflectedTranslated = reflectAcrossLine({
        request: reqTranslated,
        sourceState: translatedSource,
        stepIndex: 0,
        timestamp: FIXED_TIMESTAMP,
      });

      const verdictTranslated = verifyResult(
        {
          sourceState: translatedSource,
          resultingState: reflectedTranslated.resultingState,
          operation: 'REFLECTION_ACROSS_LINE',
          parameters: reflectedTranslated.traceEntry.parameters,
          witness: reflectedTranslated.witness,
        },
        reqTranslated
      );
      assert.equal(
        verdictTranslated.status,
        'PASS',
        `Translated branch L7 failed for ${sc.id} (${tr.label}): ${verdictTranslated.diagnostics.join('; ')}`
      );
      assert.equal(verdictTranslated.predicates.requestBound, true);
      assert.equal(verdictTranslated.predicates.witnessBound, true);

      assertStatesGeometricallyEquivalent(
        reflectedTranslated.resultingState,
        translatedReflected,
        METAMORPHIC_COORD_TOLERANCE,
        {
          property:
            'Property C: Translation Equivariance T_v(R_L(P)) = R_(T_v(L))(T_v(P))',
          parameters: {
            scenarioId: sc.id,
            translationLabel: tr.label,
            v: tr.v,
            originalLine: sc.line,
            translatedLine: translatedAxis,
            movingVertexIds: sc.movingVertexIds,
          },
          sourceState: sc.sourceState,
          expectedRelation:
            'R_(T_v(L))(T_v(P)) equals T_v(R_L(P)) in all vertex coordinates and topology',
        }
      );
    }
  }
});

// ===========================================================================
// Negative Controls: Corrupted Metamorphic Result & Unshifted Axis c
// ===========================================================================

test('Negative Control: Corrupted metamorphic result with forged claimedResiduals=0 is rejected with FAIL by L7', () => {
  const s0 = makeAsymmetricPolygonMesh('neg-mesh-v0', 0);
  const line: LineNormalParams = { nx: 3, ny: -4, c: 5 };
  const movingVertexIds = ['P2', 'P3'];

  const req = createOperationRequest({
    operationRequestId: 'req-meta-neg-01',
    sourceState: s0,
    line,
    movingVertexIds,
    timestamp: FIXED_TIMESTAMP,
  });
  const out = reflectAcrossLine({
    request: req,
    sourceState: s0,
    stepIndex: 0,
    timestamp: FIXED_TIMESTAMP,
  });

  // Deliberately corrupt vertex P2 in both resultingState and witness.vertexPairs,
  // while forging witness.claimedResiduals to 0.
  const delta: Point2D = { x: 1e-3, y: -1e-3 };
  const corruptedState = createInitialGeometryState({
    stateId: out.resultingState.stateId,
    version: out.resultingState.version,
    vertices: out.resultingState.vertices.map((v) =>
      v.id === 'P2'
        ? {
            id: v.id,
            position: { x: v.position.x + delta.x, y: v.position.y + delta.y },
          }
        : v
    ),
    edges: out.resultingState.edges,
    faces: out.resultingState.faces,
  });

  const forgedWitness: ReflectionWitness = {
    ...out.witness,
    vertexPairs: out.witness.vertexPairs.map((pair) =>
      pair.vertexId === 'P2'
        ? {
            ...pair,
            pPrime: {
              x: pair.pPrime.x + delta.x,
              y: pair.pPrime.y + delta.y,
            },
          }
        : pair
    ),
    claimedResiduals: {
      maxMidpointError: 0,
      maxCollinearityError: 0,
    },
  };

  const verdict = verifyResult(
    {
      sourceState: s0,
      resultingState: corruptedState,
      operation: 'REFLECTION_ACROSS_LINE',
      parameters: out.traceEntry.parameters,
      witness: forgedWitness,
    },
    req
  );

  assert.equal(verdict.status, 'FAIL');
  assert.equal(verdict.predicates.axiomsSatisfied, false);
  assert.ok(
    verdict.residuals.midpointError > DEFAULT_VERIFIER_TOLERANCES.epsilon ||
      verdict.residuals.collinearityError > DEFAULT_VERIFIER_TOLERANCES.epsilon
  );

  const processVerdict = verifyProcess(
    [
      {
        ...out.traceEntry,
        resultingState: corruptedState,
        witness: forgedWitness,
      },
    ],
    [req]
  );
  assert.equal(processVerdict.status, 'FAIL');
  assert.equal(processVerdict.predicates.axiomsSatisfied, false);
});

test('Negative Control: Translating geometry without shifting c -> c + nx*a + ny*b breaks translation equivariance', () => {
  const s0 = makeSubdividedSquare('neg-trans-v0', 0);
  const line: LineNormalParams = { nx: 3, ny: -4, c: 5 };
  const v: Point2D = { x: 4.5, y: 7.25 }; // nx*a + ny*b = 13.5 - 29 = -15.5 != 0

  const req1 = createOperationRequest({
    operationRequestId: 'req-neg-trans-1',
    sourceState: s0,
    line,
    movingVertexIds: ['V2'],
    timestamp: FIXED_TIMESTAMP,
  });
  const out1 = reflectAcrossLine({
    request: req1,
    sourceState: s0,
    timestamp: FIXED_TIMESTAMP,
  });
  const expectedTranslated = translateGeometryState(
    out1.resultingState,
    v,
    'expected-trans-v1',
    1
  );

  const translatedSource = translateGeometryState(s0, v, 'src-trans-v0', 0);
  const unshiftedLineReq = createOperationRequest({
    operationRequestId: 'req-neg-trans-2',
    sourceState: translatedSource,
    line, // c intentionally NOT shifted!
    movingVertexIds: ['V2'],
    timestamp: FIXED_TIMESTAMP,
  });
  const wrongBranch = reflectAcrossLine({
    request: unshiftedLineReq,
    sourceState: translatedSource,
    timestamp: FIXED_TIMESTAMP,
  });

  const v2Expected = expectedTranslated.vertices.find(
    (vt) => vt.id === 'V2'
  )!.position;
  const v2Wrong = wrongBranch.resultingState.vertices.find(
    (vt) => vt.id === 'V2'
  )!.position;
  const discrepancy = Math.hypot(
    v2Wrong.x - v2Expected.x,
    v2Wrong.y - v2Expected.y
  );
  assert.ok(
    discrepancy > 1.0,
    `Expected large discrepancy when c is not translated, got ${discrepancy}`
  );
});

// ===========================================================================
// Phase 2.3.2 Helpers for Property D & Property E
// ===========================================================================

function computeExpectedReflectionPoint(
  p: Point2D,
  line: LineNormalParams
): Point2D {
  const normSq = line.nx * line.nx + line.ny * line.ny;
  const factor = (2 * (line.nx * p.x + line.ny * p.y - line.c)) / normSq;
  return {
    x: p.x - factor * line.nx,
    y: p.y - factor * line.ny,
  };
}

function assertSubsetPairwiseDistancesPreserved(
  sourceState: GeometryState,
  resultingState: GeometryState,
  vertexIds: readonly VertexId[],
  ctx: FailureDiagnosticContext
): number {
  const srcMap = new Map(sourceState.vertices.map((v) => [v.id, v.position]));
  const dstMap = new Map(resultingState.vertices.map((v) => [v.id, v.position]));

  let maxDistanceError = 0;
  let checkedPairs = 0;

  for (let i = 0; i < vertexIds.length; i++) {
    for (let j = i + 1; j < vertexIds.length; j++) {
      const idA = vertexIds[i]!;
      const idB = vertexIds[j]!;
      const pA0 = srcMap.get(idA);
      const pB0 = srcMap.get(idB);
      const pA1 = dstMap.get(idA);
      const pB1 = dstMap.get(idB);
      assert.ok(pA0 && pB0, `Missing source vertices (${idA}, ${idB}) for ${ctx.property}`);
      assert.ok(pA1 && pB1, `Missing resulting vertices (${idA}, ${idB}) for ${ctx.property}`);

      const d0 = Math.hypot(pA0.x - pB0.x, pA0.y - pB0.y);
      const d1 = Math.hypot(pA1.x - pB1.x, pA1.y - pB1.y);
      const err = Math.abs(d1 - d0);
      const tol = METAMORPHIC_DISTANCE_REL_TOLERANCE * Math.max(1, d0);

      if (err > maxDistanceError) {
        maxDistanceError = err;
      }
      checkedPairs++;

      assert.ok(
        err <= tol,
        `Pairwise distance violation on (${idA}, ${idB}): ${JSON.stringify({
          property: ctx.property,
          parameters: ctx.parameters,
          sourceStateId: sourceState.stateId,
          expectedRelation: `${ctx.expectedRelation} (||P'_${idA}-P'_${idB}|| = ||P_${idA}-P_${idB}||)`,
          d0,
          d1,
          actualResidual: err,
          tolerance: tol,
        })}`
      );
    }
  }

  assert.ok(
    checkedPairs > 0,
    `Expected at least one unordered vertex pair for ${ctx.property}`
  );
  return maxDistanceError;
}

// ===========================================================================
// Property D — Pairwise Distance Invariance: ||R_L(P_i) - R_L(P_j)|| = ||P_i - P_j||
// ===========================================================================

test('Property D1 (Pairwise Distance Invariance — Full Reflection): all unordered adjacent & non-adjacent pairs preserved across geometries and axes', () => {
  const axes: readonly { readonly label: string; readonly line: LineNormalParams }[] = [
    { label: 'diag_x_plus_y_1', line: { nx: 1, ny: 1, c: 1 } },
    { label: 'oblique_3x_minus_4y_5', line: { nx: 3, ny: -4, c: 5 } },
    { label: 'neg_oblique', line: { nx: -2.5, ny: 1.75, c: -3.25 } },
    { label: 'vertical_x_minus_1_5', line: { nx: 1, ny: 0, c: -1.5 } },
  ];

  const geometries: readonly {
    readonly name: string;
    readonly state: GeometryState;
  }[] = [
    { name: 'subdividedSquare', state: makeSubdividedSquare('dist-sq-v0', 0) },
    {
      name: 'asymmetricPolygonMesh',
      state: makeAsymmetricPolygonMesh('dist-mesh-v0', 0),
    },
  ];

  for (const geom of geometries) {
    const allIds = geom.state.vertices.map((v) => v.id);
    // Confirm test covers non-adjacent pairs as well as edges
    const totalUnorderedPairs = (allIds.length * (allIds.length - 1)) / 2;
    assert.ok(totalUnorderedPairs > geom.state.edges.length);

    for (const axis of axes) {
      const req = createOperationRequest({
        operationRequestId: `req-dist-full-${geom.name}-${axis.label}`,
        sourceState: geom.state,
        line: axis.line,
        movingVertexIds: allIds,
        timestamp: FIXED_TIMESTAMP,
      });
      const out = reflectAcrossLine({
        request: req,
        sourceState: geom.state,
        stepIndex: 0,
        timestamp: FIXED_TIMESTAMP,
      });

      assertTopologyPreserved(out.resultingState, geom.state, {
        property: 'Property D: Pairwise Distance Invariance (Full)',
        parameters: { geometry: geom.name, axis: axis.label, line: axis.line },
        sourceState: geom.state,
        expectedRelation: 'Topology and vertex identities preserved',
      });

      assertSubsetPairwiseDistancesPreserved(geom.state, out.resultingState, allIds, {
        property: 'Property D: Pairwise Distance Invariance (Full)',
        parameters: { geometry: geom.name, axis: axis.label, line: axis.line },
        sourceState: geom.state,
        expectedRelation: '||R_L(P_i) - R_L(P_j)|| = ||P_i - P_j|| for all unordered pairs',
      });

      const verdict = verifyResult(
        {
          sourceState: geom.state,
          resultingState: out.resultingState,
          operation: 'REFLECTION_ACROSS_LINE',
          parameters: out.traceEntry.parameters,
          witness: out.witness,
        },
        req
      );
      assert.equal(
        verdict.status,
        'PASS',
        `L7 verifyResult failed for Property D full (${geom.name}, ${axis.label}): ${verdict.diagnostics.join('; ')}`
      );
      assert.equal(verdict.predicates.lengthsPreserved, true);
      assert.equal(verdict.predicates.idsPreserved, true);
    }
  }
});

test('Property D2 (Pairwise Distance Invariance — Partial Reflection): all unordered pairs within moving and within fixed subsets preserved', () => {
  // 6-vertex mesh: 3 purely moving vertices (D, E, G) and 3 purely fixed vertices (A, B, C),
  // including non-adjacent pairs inside each subset and mixed boundary edges between subsets.
  const partialMesh = createInitialGeometryState({
    stateId: 'dist-partial-v0',
    version: 0,
    vertices: [
      { id: 'A', position: { x: -2, y: 0 } },
      { id: 'B', position: { x: 0, y: 0 } },
      { id: 'C', position: { x: -1, y: 2 } },
      { id: 'D', position: { x: 2, y: 0.5 } },
      { id: 'E', position: { x: 5, y: 1.5 } },
      { id: 'G', position: { x: 3.5, y: 4 } },
    ],
    edges: [
      { id: 'E_AB', startVertexId: 'A', endVertexId: 'B' },
      { id: 'E_BC', startVertexId: 'B', endVertexId: 'C' },
      { id: 'E_CA', startVertexId: 'C', endVertexId: 'A' },
      { id: 'E_DE', startVertexId: 'D', endVertexId: 'E' },
      { id: 'E_EG', startVertexId: 'E', endVertexId: 'G' },
      { id: 'E_GD', startVertexId: 'G', endVertexId: 'D' },
      { id: 'E_BD', startVertexId: 'B', endVertexId: 'D' },
      { id: 'E_CG', startVertexId: 'C', endVertexId: 'G' },
    ],
    faces: [
      { id: 'F_FIXED', vertexIds: ['A', 'B', 'C'] },
      { id: 'F_MOVING', vertexIds: ['D', 'E', 'G'] },
      { id: 'F_BRIDGE', vertexIds: ['B', 'D', 'G', 'C'] },
    ],
  });

  const movingIds = ['D', 'E', 'G'];
  const fixedIds = ['A', 'B', 'C'];
  const line: LineNormalParams = { nx: 3, ny: -4, c: 5 };

  const req = createOperationRequest({
    operationRequestId: 'req-dist-partial-01',
    sourceState: partialMesh,
    line,
    movingVertexIds: movingIds,
    timestamp: FIXED_TIMESTAMP,
  });
  const out = reflectAcrossLine({
    request: req,
    sourceState: partialMesh,
    stepIndex: 0,
    timestamp: FIXED_TIMESTAMP,
  });

  assertTopologyPreserved(out.resultingState, partialMesh, {
    property: 'Property D: Pairwise Distance Invariance (Partial)',
    parameters: { line, movingIds, fixedIds },
    sourceState: partialMesh,
    expectedRelation: 'Topology and vertex identities preserved',
  });

  assertSubsetPairwiseDistancesPreserved(partialMesh, out.resultingState, movingIds, {
    property: 'Property D: Pairwise Distance Invariance (Partial Moving)',
    parameters: { line, movingIds },
    sourceState: partialMesh,
    expectedRelation: 'All unordered pairs within movingVertexIds preserve distance',
  });

  assertSubsetPairwiseDistancesPreserved(partialMesh, out.resultingState, fixedIds, {
    property: 'Property D: Pairwise Distance Invariance (Partial Fixed)',
    parameters: { line, fixedIds },
    sourceState: partialMesh,
    expectedRelation: 'All unordered pairs within fixedVertexIds preserve distance',
  });

  const verdict = verifyResult(
    {
      sourceState: partialMesh,
      resultingState: out.resultingState,
      operation: 'REFLECTION_ACROSS_LINE',
      parameters: out.traceEntry.parameters,
      witness: out.witness,
    },
    req
  );
  assert.equal(verdict.status, 'PASS');
  assert.equal(verdict.predicates.lengthsPreserved, true);
  assert.equal(verdict.predicates.fixedVerticesUnchanged, true);
});

// ===========================================================================
// Property E — Fixed Points on Reflection Axis: P ∈ L => R_L(P) = P
// ===========================================================================

test('Property E1 (Fixed Points on Axis): single and multiple on-axis points across multiple axes stay unchanged while off-axis vertices reflect', () => {
  interface AxisScenario {
    readonly id: string;
    readonly line: LineNormalParams;
    readonly state: GeometryState;
    readonly onAxisVertexIds: readonly VertexId[];
    readonly movingVertexIds: readonly VertexId[];
    readonly expectedFixedIds: readonly VertexId[];
  }

  // Scenario 1: Diagonal x + y = 1 — two on-axis vertices (V3=(0,1), V1=(1,0)),
  // one moving off-axis (V2=(1,1)), one fixed off-axis (V0=(0,0)).
  // Put V3 in movingVertexIds and V1 in fixedVertexIds to test both classifications.
  const sqDiag = makeSubdividedSquare('axis-sq-diag-v0', 0);

  // Scenario 2: Oblique 3x - 4y = 5 — exact on-axis points:
  //   A(3, 1) -> 3*3 - 4*1 = 5
  //   B(-1, -2) -> 3*(-1) - 4*(-2) = -3 + 8 = 5
  //   C(7, 4) -> 3*7 - 4*4 = 21 - 16 = 5
  // Off-axis points:
  //   M1(0, 2) -> moving
  //   M2(5, -1) -> moving
  const meshOblique = createInitialGeometryState({
    stateId: 'axis-oblique-v0',
    version: 0,
    vertices: [
      { id: 'A', position: { x: 3, y: 1 } },
      { id: 'B', position: { x: -1, y: -2 } },
      { id: 'C', position: { x: 7, y: 4 } },
      { id: 'M1', position: { x: 0, y: 2 } },
      { id: 'M2', position: { x: 5, y: -1 } },
    ],
    edges: [
      { id: 'E_AB', startVertexId: 'A', endVertexId: 'B' },
      { id: 'E_AC', startVertexId: 'A', endVertexId: 'C' },
      { id: 'E_AM1', startVertexId: 'A', endVertexId: 'M1' },
      { id: 'E_CM1', startVertexId: 'C', endVertexId: 'M1' },
      { id: 'E_BM2', startVertexId: 'B', endVertexId: 'M2' },
      { id: 'E_AM2', startVertexId: 'A', endVertexId: 'M2' },
    ],
    faces: [
      { id: 'F_TOP', vertexIds: ['A', 'C', 'M1'] },
      { id: 'F_BOT', vertexIds: ['B', 'A', 'M2'] },
    ],
  });

  // Scenario 3: Line 2x + y = 0 — single on-axis vertex Q0(1, -2) listed as moving,
  // plus off-axis moving triangle Q1(3, 2), Q2(-1, 4), Q3(2, 5).
  const meshSingleAxisPt = createInitialGeometryState({
    stateId: 'axis-single-v0',
    version: 0,
    vertices: [
      { id: 'Q0', position: { x: 1, y: -2 } }, // 2*1 + (-2) = 0 (on axis)
      { id: 'Q1', position: { x: 3, y: 2 } },
      { id: 'Q2', position: { x: -1, y: 4 } },
      { id: 'Q3', position: { x: 2, y: 5 } },
    ],
    edges: [
      { id: 'E_01', startVertexId: 'Q0', endVertexId: 'Q1' },
      { id: 'E_12', startVertexId: 'Q1', endVertexId: 'Q2' },
      { id: 'E_20', startVertexId: 'Q2', endVertexId: 'Q0' },
      { id: 'E_13', startVertexId: 'Q1', endVertexId: 'Q3' },
      { id: 'E_32', startVertexId: 'Q3', endVertexId: 'Q2' },
    ],
    faces: [
      { id: 'F_BASE', vertexIds: ['Q0', 'Q1', 'Q2'] },
      { id: 'F_CAP', vertexIds: ['Q1', 'Q3', 'Q2'] },
    ],
  });

  const scenarios: readonly AxisScenario[] = [
    {
      id: 'diag-mixed-on-axis',
      line: { nx: 1, ny: 1, c: 1 },
      state: sqDiag,
      onAxisVertexIds: ['V3', 'V1'],
      movingVertexIds: ['V2', 'V3'], // V3 is on-axis & moving; V1 is on-axis & fixed
      expectedFixedIds: ['V0', 'V1'],
    },
    {
      id: 'oblique-multiple-on-axis-moving',
      line: { nx: 3, ny: -4, c: 5 },
      state: meshOblique,
      onAxisVertexIds: ['A', 'B', 'C'],
      movingVertexIds: ['A', 'B', 'C', 'M1', 'M2'],
      expectedFixedIds: [],
    },
    {
      id: 'oblique-multiple-on-axis-fixed',
      line: { nx: 3, ny: -4, c: 5 },
      state: meshOblique,
      onAxisVertexIds: ['A', 'B', 'C'],
      movingVertexIds: ['M1', 'M2'],
      expectedFixedIds: ['A', 'B', 'C'],
    },
    {
      id: 'single-on-axis-point-moving',
      line: { nx: 2, ny: 1, c: 0 },
      state: meshSingleAxisPt,
      onAxisVertexIds: ['Q0'],
      movingVertexIds: ['Q0', 'Q1', 'Q2', 'Q3'],
      expectedFixedIds: [],
    },
  ];

  for (const sc of scenarios) {
    const req = createOperationRequest({
      operationRequestId: `req-fixedpt-${sc.id}`,
      sourceState: sc.state,
      line: sc.line,
      movingVertexIds: sc.movingVertexIds,
      timestamp: FIXED_TIMESTAMP,
    });
    assert.deepEqual(req.fixedVertexIds, sc.expectedFixedIds);

    const out = reflectAcrossLine({
      request: req,
      sourceState: sc.state,
      stepIndex: 0,
      timestamp: FIXED_TIMESTAMP,
    });

    assert.deepEqual(out.witness.fixedVertexIds, sc.expectedFixedIds);
    assert.deepEqual(
      out.traceEntry.parameters.fixedVertexIds,
      sc.expectedFixedIds
    );
    assertTopologyPreserved(out.resultingState, sc.state, {
      property: 'Property E: Fixed Points on Reflection Axis',
      parameters: { scenario: sc.id, line: sc.line },
      sourceState: sc.state,
      expectedRelation: 'Vertex IDs and topology preserved',
    });

    const movingSet = new Set(sc.movingVertexIds);
    const onAxisSet = new Set(sc.onAxisVertexIds);

    for (const v0 of sc.state.vertices) {
      const v1 = out.resultingState.vertices.find((v) => v.id === v0.id);
      assert.ok(v1, `Missing vertex ${v0.id} in resultingState`);

      if (onAxisSet.has(v0.id)) {
        const axisResidual = Math.hypot(
          v1.position.x - v0.position.x,
          v1.position.y - v0.position.y
        );
        assert.ok(
          axisResidual <= METAMORPHIC_COORD_TOLERANCE,
          `On-axis vertex ${v0.id} in ${sc.id} moved by ${axisResidual} > ${METAMORPHIC_COORD_TOLERANCE}`
        );
      } else if (movingSet.has(v0.id)) {
        const expectedP = computeExpectedReflectionPoint(v0.position, sc.line);
        const moveResidual = Math.hypot(
          v1.position.x - expectedP.x,
          v1.position.y - expectedP.y
        );
        assert.ok(
          moveResidual <= METAMORPHIC_COORD_TOLERANCE,
          `Off-axis moving vertex ${v0.id} in ${sc.id} mismatch: residual=${moveResidual}`
        );
        const movedDistance = Math.hypot(
          v1.position.x - v0.position.x,
          v1.position.y - v0.position.y
        );
        assert.ok(
          movedDistance > 1e-3,
          `Off-axis moving vertex ${v0.id} was expected to reflect away from start`
        );
      }
    }

    const verdict = verifyResult(
      {
        sourceState: sc.state,
        resultingState: out.resultingState,
        operation: 'REFLECTION_ACROSS_LINE',
        parameters: out.traceEntry.parameters,
        witness: out.witness,
      },
      req
    );
    assert.equal(
      verdict.status,
      'PASS',
      `L7 rejected valid Property E case ${sc.id}: ${verdict.diagnostics.join('; ')}`
    );
    assert.equal(verdict.predicates.requestBound, true);
    assert.equal(verdict.predicates.witnessBound, true);
    assert.equal(verdict.predicates.fixedVerticesUnchanged, true);
    assert.equal(verdict.predicates.idsPreserved, true);
  }
});

test('Property E2 (No Implicit Axis Snapping): vertex 1e-9 off axis in movingVertexIds reflects across axis rather than snapping to fixed', () => {
  const nearOffset = 1e-9;
  // Axis: y = 0 (nx = 0, ny = 1, c = 0). P_NEAR is at (2, 1e-9) — NOT on the axis.
  const state = createInitialGeometryState({
    stateId: 'near-axis-v0',
    version: 0,
    vertices: [
      { id: 'P_NEAR', position: { x: 2, y: nearOffset } },
      { id: 'P_OFF1', position: { x: 0, y: 2 } },
      { id: 'P_OFF2', position: { x: 4, y: 2 } },
    ],
    edges: [
      { id: 'E1', startVertexId: 'P_NEAR', endVertexId: 'P_OFF1' },
      { id: 'E2', startVertexId: 'P_OFF1', endVertexId: 'P_OFF2' },
      { id: 'E3', startVertexId: 'P_OFF2', endVertexId: 'P_NEAR' },
    ],
    faces: [{ id: 'F0', vertexIds: ['P_NEAR', 'P_OFF1', 'P_OFF2'] }],
  });

  const line: LineNormalParams = { nx: 0, ny: 1, c: 0 };
  const req = createOperationRequest({
    operationRequestId: 'req-near-axis-no-snap',
    sourceState: state,
    line,
    movingVertexIds: ['P_NEAR', 'P_OFF1', 'P_OFF2'],
    timestamp: FIXED_TIMESTAMP,
  });
  assert.deepEqual(req.fixedVertexIds, []);

  const out = reflectAcrossLine({
    request: req,
    sourceState: state,
    timestamp: FIXED_TIMESTAMP,
  });

  const pNearAfter = out.resultingState.vertices.find(
    (v) => v.id === 'P_NEAR'
  )!.position;
  // Reflected y must be -1e-9 (not snapped to +1e-9 or 0)
  const errFromExpectedReflected = Math.hypot(
    pNearAfter.x - 2,
    pNearAfter.y - -nearOffset
  );
  assert.ok(errFromExpectedReflected <= 1e-15);
  assert.ok(Math.abs(pNearAfter.y - nearOffset) > 1.5e-9);

  const verdict = verifyResult(
    {
      sourceState: state,
      resultingState: out.resultingState,
      operation: 'REFLECTION_ACROSS_LINE',
      parameters: out.traceEntry.parameters,
      witness: out.witness,
    },
    req
  );
  assert.equal(verdict.status, 'PASS');
});

// ===========================================================================
// Phase 2.3.2 Negative Controls (Property D & Property E)
// ===========================================================================

test('Negative Control (Property D): corrupted coordinate breaks pairwise distance & forged claimedResiduals=0 is rejected by L7', () => {
  const s0 = makeAsymmetricPolygonMesh('neg-dist-v0', 0);
  const allIds = s0.vertices.map((v) => v.id);
  const line: LineNormalParams = { nx: 3, ny: -4, c: 5 };

  const req = createOperationRequest({
    operationRequestId: 'req-neg-dist-01',
    sourceState: s0,
    line,
    movingVertexIds: allIds,
    timestamp: FIXED_TIMESTAMP,
  });
  const out = reflectAcrossLine({
    request: req,
    sourceState: s0,
    timestamp: FIXED_TIMESTAMP,
  });

  // Shift vertex P3 by +2e-3 along x in resultingState & witness.vertexPairs and forge claimedResiduals=0
  const corrupted = createInitialGeometryState({
    stateId: out.resultingState.stateId,
    version: out.resultingState.version,
    vertices: out.resultingState.vertices.map((v) =>
      v.id === 'P3'
        ? { id: v.id, position: { x: v.position.x + 2e-3, y: v.position.y } }
        : v
    ),
    edges: out.resultingState.edges,
    faces: out.resultingState.faces,
  });

  assert.throws(
    () =>
      assertSubsetPairwiseDistancesPreserved(s0, corrupted, allIds, {
        property: 'Negative Control D',
        parameters: { line },
        sourceState: s0,
        expectedRelation: 'Distance invariance',
      }),
    /Pairwise distance violation/
  );

  const forgedWitness: ReflectionWitness = {
    ...out.witness,
    vertexPairs: out.witness.vertexPairs.map((pair) =>
      pair.vertexId === 'P3'
        ? {
            ...pair,
            pPrime: { x: pair.pPrime.x + 2e-3, y: pair.pPrime.y },
          }
        : pair
    ),
    claimedResiduals: { maxMidpointError: 0, maxCollinearityError: 0 },
  };

  const verdict = verifyResult(
    {
      sourceState: s0,
      resultingState: corrupted,
      operation: 'REFLECTION_ACROSS_LINE',
      parameters: out.traceEntry.parameters,
      witness: forgedWitness,
    },
    req
  );
  assert.equal(verdict.status, 'FAIL');
  assert.equal(verdict.predicates.axiomsSatisfied, false);
  assert.equal(verdict.predicates.lengthsPreserved, false);
});

test('Negative Control (Property E): displaced on-axis vertex (both fixed & moving) is rejected by L7 despite forged claimedResiduals=0; huge forged residuals do not fail valid result', () => {
  const s0 = makeSubdividedSquare('neg-axis-v0', 0);
  const line: LineNormalParams = { nx: 1, ny: 1, c: 1 };

  // Case 1: On-axis vertex V3 classified as fixed, then displaced by 1e-3
  const reqFixed = createOperationRequest({
    operationRequestId: 'req-neg-axis-fixed',
    sourceState: s0,
    line,
    movingVertexIds: ['V2'], // V3 is fixed and on x + y = 1
    timestamp: FIXED_TIMESTAMP,
  });
  const outFixed = reflectAcrossLine({
    request: reqFixed,
    sourceState: s0,
    timestamp: FIXED_TIMESTAMP,
  });

  const displacedFixed = createInitialGeometryState({
    stateId: outFixed.resultingState.stateId,
    version: outFixed.resultingState.version,
    vertices: outFixed.resultingState.vertices.map((v) =>
      v.id === 'V3'
        ? { id: v.id, position: { x: v.position.x + 1e-3, y: v.position.y } }
        : v
    ),
    edges: outFixed.resultingState.edges,
    faces: outFixed.resultingState.faces,
  });
  const forgedFixedWitness: ReflectionWitness = {
    ...outFixed.witness,
    claimedResiduals: { maxMidpointError: 0, maxCollinearityError: 0 },
  };

  const fixedVerdict = verifyResult(
    {
      sourceState: s0,
      resultingState: displacedFixed,
      operation: 'REFLECTION_ACROSS_LINE',
      parameters: outFixed.traceEntry.parameters,
      witness: forgedFixedWitness,
    },
    reqFixed
  );
  assert.equal(fixedVerdict.status, 'FAIL');
  assert.equal(fixedVerdict.predicates.fixedVerticesUnchanged, false);

  // Case 2: On-axis vertex V3 classified as moving, then displaced by 1e-3 off the axis
  const reqMoving = createOperationRequest({
    operationRequestId: 'req-neg-axis-moving',
    sourceState: s0,
    line,
    movingVertexIds: ['V2', 'V3'],
    timestamp: FIXED_TIMESTAMP,
  });
  const outMoving = reflectAcrossLine({
    request: reqMoving,
    sourceState: s0,
    timestamp: FIXED_TIMESTAMP,
  });

  const displacedMoving = createInitialGeometryState({
    stateId: outMoving.resultingState.stateId,
    version: outMoving.resultingState.version,
    vertices: outMoving.resultingState.vertices.map((v) =>
      v.id === 'V3'
        ? {
            id: v.id,
            position: { x: v.position.x + 1e-3, y: v.position.y + 1e-3 },
          }
        : v
    ),
    edges: outMoving.resultingState.edges,
    faces: outMoving.resultingState.faces,
  });
  const forgedMovingWitness: ReflectionWitness = {
    ...outMoving.witness,
    vertexPairs: outMoving.witness.vertexPairs.map((pair) =>
      pair.vertexId === 'V3'
        ? {
            ...pair,
            pPrime: { x: pair.pPrime.x + 1e-3, y: pair.pPrime.y + 1e-3 },
          }
        : pair
    ),
    claimedResiduals: { maxMidpointError: 0, maxCollinearityError: 0 },
  };

  const movingVerdict = verifyResult(
    {
      sourceState: s0,
      resultingState: displacedMoving,
      operation: 'REFLECTION_ACROSS_LINE',
      parameters: outMoving.traceEntry.parameters,
      witness: forgedMovingWitness,
    },
    reqMoving
  );
  assert.equal(movingVerdict.status, 'FAIL');
  assert.equal(movingVerdict.predicates.axiomsSatisfied, false);

  // Case 3: Huge forged claimedResiduals on mathematically valid reflection must still PASS
  const hugeClaimedWitness: ReflectionWitness = {
    ...outMoving.witness,
    claimedResiduals: { maxMidpointError: 1e6, maxCollinearityError: 1e6 },
  };
  const validDespiteForgedVerdict = verifyResult(
    {
      sourceState: s0,
      resultingState: outMoving.resultingState,
      operation: 'REFLECTION_ACROSS_LINE',
      parameters: outMoving.traceEntry.parameters,
      witness: hugeClaimedWitness,
    },
    reqMoving
  );
  assert.equal(validDespiteForgedVerdict.status, 'PASS');
  assert.ok(validDespiteForgedVerdict.residuals.midpointError <= 1e-12);
});

