/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Phase 2.3 — Implementation Step 1: Core Deterministic Metamorphic Tests
 * Covers:
 *   - Property A: Reflection Involution: R_L(R_L(P)) = P
 *   - Property B: Axis Coefficient Scaling: R_(n,c)(P) = R_(alpha*n, alpha*c)(P)
 *   - Property C: Translation Equivariance: T_v(R_L(P)) = R_(T_v(L))(T_v(P))
 *   - Negative Control: Corrupted result + forged claimedResiduals = 0 rejected by L7
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
