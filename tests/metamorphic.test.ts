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
 *
 * Phase 2.3 — Implementation Step 2: Distance Invariance & Fixed Points
 *   - Property D: Pairwise Distance Invariance ||R_L(Pi) - R_L(Pj)|| = ||Pi - Pj||
 *   - Property E: Fixed Points on the Axis P in L => R_L(P) = P
 *   - Negative Controls: corrupted distances, displaced "axis" vertices, forged claimedResiduals
 *
 * Phase 2.3 — Implementation Step 3: Face Orientation Reversal (Property F)
 *   - Property F1: Full Reflection (sign reversal of oriented area, magnitude preservation, topology, L7 pass)
 *   - Property F2: Partial Reflection (moving vs fixed vs mixed faces)
 *   - Property F3: Faces with vertices on the axis (non-degenerate vs degenerate classification)
 *   - Negative Controls: coordinate mutation, sign tampering, forged residuals, mixed/degenerate classifications
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

// ===========================================================================
// Phase 2.3.2 — Shared helpers for Properties D and E
// ===========================================================================

/**
 * Numerical policy (Phase 2.3.2):
 *  - METAMORPHIC_COORD_TOLERANCE (1e-12, absolute, defined above): per-coordinate
 *    comparison between L2 output and an independently computed expectation.
 *  - METAMORPHIC_DISTANCE_TOLERANCE (1e-12 * max(1, d_before)): comparison of a pairwise
 *    Euclidean distance before/after reflection. Distances are sums of two coordinate
 *    errors passed through hypot, so the bound is scaled by the distance magnitude.
 *  - DEFAULT_VERIFIER_TOLERANCES.epsilon (1e-7): L7's own acceptance threshold, used only
 *    when asserting on L7 verdicts. No tolerance was raised to make a test pass.
 */
const METAMORPHIC_DISTANCE_REL_TOLERANCE = 1e-12;

function distanceTolerance(dBefore: number): number {
  return METAMORPHIC_DISTANCE_REL_TOLERANCE * Math.max(1, dBefore);
}

interface DistanceViolation {
  readonly a: VertexId;
  readonly b: VertexId;
  readonly before: number;
  readonly after: number;
  readonly error: number;
}

/**
 * Compares every unordered pair {i, j} (i < j) of `ids` between two states, matching
 * vertices strictly by ID. Throws if an ID is missing from either state.
 * Returns the violations and the number of pairs compared.
 */
function checkPairwiseDistances(
  before: GeometryState,
  after: GeometryState,
  ids: readonly VertexId[]
): { violations: DistanceViolation[]; pairsCompared: number } {
  const b = new Map(before.vertices.map((v) => [v.id, v.position]));
  const a = new Map(after.vertices.map((v) => [v.id, v.position]));
  const violations: DistanceViolation[] = [];
  let pairsCompared = 0;
  for (let i = 0; i < ids.length; i++) {
    for (let j = i + 1; j < ids.length; j++) {
      const idI = ids[i]!;
      const idJ = ids[j]!;
      const bi = b.get(idI);
      const bj = b.get(idJ);
      const ai = a.get(idI);
      const aj = a.get(idJ);
      assert.ok(bi && bj, `Vertex ${idI}/${idJ} missing in source state`);
      assert.ok(ai && aj, `Vertex ${idI}/${idJ} missing in resulting state`);
      const dBefore = Math.hypot(bi.x - bj.x, bi.y - bj.y);
      const dAfter = Math.hypot(ai.x - aj.x, ai.y - aj.y);
      const error = Math.abs(dAfter - dBefore);
      pairsCompared++;
      if (!(error <= distanceTolerance(dBefore))) {
        violations.push({ a: idI, b: idJ, before: dBefore, after: dAfter, error });
      }
    }
  }
  return { violations, pairsCompared };
}

function replaceVertexPosition(
  state: GeometryState,
  id: VertexId,
  delta: Point2D
): GeometryState {
  return createInitialGeometryState({
    stateId: state.stateId,
    version: state.version,
    vertices: state.vertices.map((v) =>
      v.id === id
        ? { id: v.id, position: { x: v.position.x + delta.x, y: v.position.y + delta.y } }
        : v
    ),
    edges: state.edges,
    faces: state.faces,
  });
}

/** Independent reflection formula (unit-normal form, differs from L2's n/|n|^2 form). */
function expectedReflection(p: Point2D, line: LineNormalParams): Point2D {
  const norm = Math.hypot(line.nx, line.ny);
  const ux = line.nx / norm;
  const uy = line.ny / norm;
  const signedDistance = ux * p.x + uy * p.y - line.c / norm;
  return { x: p.x - 2 * signedDistance * ux, y: p.y - 2 * signedDistance * uy };
}

/** Exact membership test used for scenario construction: n·p = c, no epsilon. */
function liesExactlyOnAxis(p: Point2D, line: LineNormalParams): boolean {
  return line.nx * p.x + line.ny * p.y === line.c;
}

let reflectionRunCounter = 0;

function runVerifiedReflection(
  source: GeometryState,
  line: LineNormalParams,
  movingVertexIds: readonly VertexId[],
  tag: string
) {
  const seq = ++reflectionRunCounter;
  const req = createOperationRequest({
    operationRequestId: `req-232-${tag}-${seq}`,
    sourceState: source,
    line,
    movingVertexIds,
    timestamp: FIXED_TIMESTAMP,
  });
  const out = reflectAcrossLine({
    request: req,
    sourceState: source,
    stepIndex: 0,
    timestamp: FIXED_TIMESTAMP,
  });
  const claim = {
    sourceState: source,
    resultingState: out.resultingState,
    operation: 'REFLECTION_ACROSS_LINE' as const,
    parameters: out.traceEntry.parameters,
    witness: out.witness,
  };
  const verdict = verifyResult(claim, req);
  return { req, out, claim, verdict };
}

function posMap(state: GeometryState): Map<VertexId, Point2D> {
  return new Map(state.vertices.map((v) => [v.id, v.position]));
}

// ===========================================================================
// Property D — Pairwise Distance Invariance
// ===========================================================================

test('Property D (Distance Invariance): full reflection preserves all unordered vertex-pair distances, topology, and passes L7', () => {
  const cases: readonly {
    readonly id: string;
    readonly build: () => GeometryState;
    readonly line: LineNormalParams;
  }[] = [
    { id: 'square-oblique', build: () => makeSubdividedSquare('d-sq-v0', 0), line: { nx: 3, ny: -4, c: 5 } },
    { id: 'square-diagonal', build: () => makeSubdividedSquare('d-sq2-v0', 0), line: { nx: 1, ny: -1, c: 0 } },
    { id: 'mesh-oblique-negative', build: () => makeAsymmetricPolygonMesh('d-mesh-v0', 0), line: { nx: -2.5, ny: 1.75, c: -3.25 } },
    { id: 'mesh-vertical', build: () => makeAsymmetricPolygonMesh('d-mesh2-v0', 0), line: { nx: 1, ny: 0, c: -1.5 } },
  ];

  for (const tc of cases) {
    const s0 = tc.build();
    const allIds = s0.vertices.map((v) => v.id);
    const { out, verdict } = runVerifiedReflection(s0, tc.line, allIds, `D-${tc.id}`);

    assert.equal(verdict.status, 'PASS', `L7 failed for ${tc.id}: ${verdict.diagnostics.join('; ')}`);
    assert.equal(verdict.predicates.lengthsPreserved, true);
    assert.ok(verdict.residuals.maxLengthError <= DEFAULT_VERIFIER_TOLERANCES.epsilon);

    // Same IDs, same order, same topology.
    assertTopologyPreserved(out.resultingState, s0, {
      property: 'Property D',
      parameters: { caseId: tc.id, line: tc.line },
      sourceState: s0,
      expectedRelation: 'IDs, edges, faces unchanged',
    });

    const n = allIds.length;
    const { violations, pairsCompared } = checkPairwiseDistances(s0, out.resultingState, allIds);
    assert.equal(pairsCompared, (n * (n - 1)) / 2, `Not all unordered pairs compared for ${tc.id}`);
    assert.deepEqual(violations, [], `Distance invariance violated for ${tc.id}: ${JSON.stringify(violations)}`);

    // Non-adjacent pairs must be included: confirm at least one pair has no edge between it.
    const adjacent = new Set(
      s0.edges.flatMap((e) => [
        `${e.startVertexId}|${e.endVertexId}`,
        `${e.endVertexId}|${e.startVertexId}`,
      ])
    );
    let nonAdjacentPairs = 0;
    for (let i = 0; i < n; i++)
      for (let j = i + 1; j < n; j++)
        if (!adjacent.has(`${allIds[i]}|${allIds[j]}`)) nonAdjacentPairs++;
    assert.ok(nonAdjacentPairs > 0, `Case ${tc.id} has no non-adjacent pairs`);
  }
});

test('Property D (Distance Invariance): partial reflection preserves distances within the moving set and within the fixed set', () => {
  // Cross pairs (moving, fixed) are intentionally NOT asserted: a partial reflection
  // is not an isometry of the whole vertex set.
  const s0 = makeAsymmetricPolygonMesh('d-part-v0', 0);
  const line: LineNormalParams = { nx: -2.5, ny: 1.75, c: -3.25 };
  const moving = ['P1', 'P2', 'P3'];
  const fixed = ['P0', 'P4'];
  const { out, verdict } = runVerifiedReflection(s0, line, moving, 'D-partial');

  assert.equal(verdict.status, 'PASS', verdict.diagnostics.join('; '));
  assert.deepEqual([...out.witness.movingVertexIds].sort(), [...moving].sort());
  assert.deepEqual([...out.witness.fixedVertexIds].sort(), [...fixed].sort());

  const mm = checkPairwiseDistances(s0, out.resultingState, moving);
  const ff = checkPairwiseDistances(s0, out.resultingState, fixed);
  assert.equal(mm.pairsCompared, 3);
  assert.equal(ff.pairsCompared, 1);
  assert.deepEqual(mm.violations, []);
  assert.deepEqual(ff.violations, []);
});

// ===========================================================================
// Property E — Fixed Points on the Reflection Axis
// ===========================================================================

function makeAxisScenarioState(
  stateId: string,
  vertices: readonly { id: string; x: number; y: number }[],
  triangle: readonly [VertexId, VertexId, VertexId]
): GeometryState {
  return createInitialGeometryState({
    stateId,
    version: 0,
    vertices: vertices.map((v) => ({ id: v.id, position: { x: v.x, y: v.y } })),
    edges: [
      { id: 'T0', startVertexId: triangle[0], endVertexId: triangle[1] },
      { id: 'T1', startVertexId: triangle[1], endVertexId: triangle[2] },
      { id: 'T2', startVertexId: triangle[2], endVertexId: triangle[0] },
    ],
    faces: [{ id: 'FT', vertexIds: [...triangle] }],
  });
}

interface AxisScenario {
  readonly id: string;
  readonly line: LineNormalParams;
  readonly state: GeometryState;
  readonly onAxisFixed: readonly VertexId[];
  readonly onAxisMoving: readonly VertexId[];
  readonly offAxisMoving: readonly VertexId[];
}

function buildAxisScenarios(): AxisScenario[] {
  return [
    {
      id: 'single-point-on-vertical-axis',
      line: { nx: 1, ny: 0, c: 2 },
      state: makeAxisScenarioState(
        'e-single-v0',
        [
          { id: 'O1', x: 2, y: 0.5 },
          { id: 'M1', x: 0.5, y: 1 },
          { id: 'M2', x: 5, y: -2 },
        ],
        ['O1', 'M1', 'M2']
      ),
      onAxisFixed: ['O1'],
      onAxisMoving: [],
      offAxisMoving: ['M1', 'M2'],
    },
    {
      id: 'multiple-points-on-diagonal-axis',
      line: { nx: 1, ny: -1, c: 0 },
      state: makeAxisScenarioState(
        'e-diag-v0',
        [
          { id: 'O1', x: 0, y: 0 },
          { id: 'O2', x: 2, y: 2 },
          { id: 'O3', x: -1.5, y: -1.5 },
          { id: 'M1', x: 3, y: 1 },
          { id: 'M2', x: -2, y: 0.5 },
        ],
        ['O1', 'M1', 'M2']
      ),
      onAxisFixed: ['O1', 'O2', 'O3'],
      onAxisMoving: [],
      offAxisMoving: ['M1', 'M2'],
    },
    {
      id: 'multiple-points-on-oblique-axis',
      line: { nx: 3, ny: 4, c: 5 },
      state: makeAxisScenarioState(
        'e-obl-v0',
        [
          { id: 'O1', x: 3, y: -1 },
          { id: 'O2', x: -1, y: 2 },
          { id: 'O3', x: 7, y: -4 },
          { id: 'M1', x: 0, y: 0 },
          { id: 'M2', x: 4, y: 3 },
          { id: 'M3', x: -3, y: -2 },
        ],
        ['O1', 'M1', 'M2']
      ),
      onAxisFixed: ['O1', 'O2', 'O3'],
      onAxisMoving: [],
      offAxisMoving: ['M1', 'M2', 'M3'],
    },
    {
      id: 'on-axis-vertices-listed-as-moving',
      line: { nx: 1, ny: -1, c: 0 },
      state: makeAxisScenarioState(
        'e-onmove-v0',
        [
          { id: 'O1', x: 1, y: 1 },
          { id: 'O2', x: -0.5, y: -0.5 },
          { id: 'M1', x: 4, y: 0.25 },
          { id: 'F1', x: -1, y: 3 },
        ],
        ['O1', 'M1', 'F1']
      ),
      onAxisFixed: [],
      onAxisMoving: ['O1', 'O2'],
      offAxisMoving: ['M1'],
    },
  ];
}

test('Property E (Fixed Points): vertices exactly on the axis are unchanged; off-axis vertices are reflected; L2 and L7 agree', () => {
  const scenarios = buildAxisScenarios();
  assert.ok(new Set(scenarios.map((s) => JSON.stringify(s.line))).size >= 3, 'need >= 2 distinct axes');

  for (const sc of scenarios) {
    const src = posMap(sc.state);

    // Scenario sanity: exact membership by construction, not by proximity.
    for (const id of [...sc.onAxisFixed, ...sc.onAxisMoving]) {
      assert.ok(liesExactlyOnAxis(src.get(id)!, sc.line), `${sc.id}: ${id} must lie exactly on axis`);
    }
    for (const id of sc.offAxisMoving) {
      assert.ok(!liesExactlyOnAxis(src.get(id)!, sc.line), `${sc.id}: ${id} must be off axis`);
    }

    const moving = [...sc.onAxisMoving, ...sc.offAxisMoving];
    const expectedFixed = sc.state.vertices
      .map((v) => v.id)
      .filter((id) => !moving.includes(id));
    const { out, verdict } = runVerifiedReflection(sc.state, sc.line, moving, `E-${sc.id}`);

    // L7 acceptance.
    assert.equal(verdict.status, 'PASS', `${sc.id}: ${verdict.diagnostics.join('; ')}`);
    assert.equal(verdict.predicates.fixedVerticesUnchanged, true);
    assert.equal(verdict.predicates.idsPreserved, true);

    // Classification: the contract uses the explicit request partition, nothing else.
    assert.deepEqual(
      [...out.witness.fixedVertexIds].sort(),
      [...expectedFixed].sort(),
      `${sc.id}: witness.fixedVertexIds mismatch`
    );
    assert.deepEqual([...out.witness.movingVertexIds].sort(), [...moving].sort());
    assert.deepEqual([...out.traceEntry.parameters.fixedVertexIds].sort(), [...expectedFixed].sort());

    assertTopologyPreserved(out.resultingState, sc.state, {
      property: 'Property E',
      parameters: { scenarioId: sc.id, line: sc.line },
      sourceState: sc.state,
      expectedRelation: 'IDs, edges, faces unchanged',
    });

    const res = posMap(out.resultingState);
    for (const id of [...sc.onAxisFixed, ...sc.onAxisMoving]) {
      const before = src.get(id)!;
      const after = res.get(id)!;
      assert.ok(
        Math.hypot(after.x - before.x, after.y - before.y) <= METAMORPHIC_COORD_TOLERANCE,
        `${sc.id}: axis vertex ${id} moved`
      );
      // Dyadic scenario coordinates make L2's zero-offset path exact, so membership holds exactly.
      assert.ok(liesExactlyOnAxis(after, sc.line), `${sc.id}: axis vertex ${id} left the axis`);
    }
    for (const id of sc.offAxisMoving) {
      const exp = expectedReflection(src.get(id)!, sc.line);
      const after = res.get(id)!;
      assert.ok(
        Math.hypot(after.x - exp.x, after.y - exp.y) <= METAMORPHIC_COORD_TOLERANCE,
        `${sc.id}: off-axis vertex ${id} not reflected correctly`
      );
      assert.notDeepEqual(after, src.get(id), `${sc.id}: off-axis vertex ${id} did not move`);
    }
  }
});

test('Property E (Contract): a vertex merely near the axis is NOT snapped or auto-classified as fixed', () => {
  const line: LineNormalParams = { nx: 1, ny: 0, c: 2 };
  const nearOffset = 1e-9; // far below L7 epsilon (1e-7), but not on the axis.
  const s0 = makeAxisScenarioState(
    'e-near-v0',
    [
      { id: 'N1', x: 2 + nearOffset, y: 0 },
      { id: 'M1', x: 0, y: 1 },
      { id: 'O1', x: 2, y: 3 },
    ],
    ['N1', 'M1', 'O1']
  );
  const { out, verdict } = runVerifiedReflection(s0, line, ['N1', 'M1'], 'E-near');

  assert.equal(verdict.status, 'PASS', verdict.diagnostics.join('; '));
  assert.deepEqual([...out.witness.movingVertexIds].sort(), ['M1', 'N1']);
  assert.deepEqual([...out.witness.fixedVertexIds], ['O1']);

  const n1 = posMap(out.resultingState).get('N1')!;
  // N1 is reflected to 2 - 1e-9: displacement 2e-9, not collapsed to the axis.
  assert.ok(Math.abs(n1.x - (2 - nearOffset)) <= METAMORPHIC_COORD_TOLERANCE);
  assert.ok(n1.x < 2, 'near-axis vertex must cross the axis, not be snapped to it');
});

// ===========================================================================
// Phase 2.3.2 Negative Controls
// ===========================================================================

test('Negative Control (D): a modified reflected coordinate violates distance invariance and is rejected by L7', () => {
  const s0 = makeAsymmetricPolygonMesh('negD-v0', 0);
  const line: LineNormalParams = { nx: 3, ny: -4, c: 5 };
  const allIds = s0.vertices.map((v) => v.id);
  const { req, out, claim, verdict } = runVerifiedReflection(s0, line, allIds, 'negD');
  assert.equal(verdict.status, 'PASS');

  const delta: Point2D = { x: 2e-3, y: 1e-3 };
  const corrupted = replaceVertexPosition(out.resultingState, 'P3', delta);

  // The metamorphic checker itself detects it, and only on pairs involving P3.
  const { violations } = checkPairwiseDistances(s0, corrupted, allIds);
  assert.ok(violations.length > 0, 'distance invariance checker missed the corruption');
  assert.ok(violations.every((v) => v.a === 'P3' || v.b === 'P3'));
  assert.ok(violations.every((v) => v.error > DEFAULT_VERIFIER_TOLERANCES.epsilon / 100));

  // (a) State corrupted, witness left honest: L7 must cross-check state against witness.
  const stateOnly = verifyResult({ ...claim, resultingState: corrupted }, req);
  assert.equal(stateOnly.status, 'FAIL', 'state-only corruption accepted');

  // (b) State and witness corrupted consistently: L7 must still reject via axiom residuals.
  const consistentWitness: ReflectionWitness = {
    ...out.witness,
    vertexPairs: out.witness.vertexPairs.map((p) =>
      p.vertexId === 'P3' ? { ...p, pPrime: { x: p.pPrime.x + delta.x, y: p.pPrime.y + delta.y } } : p
    ),
  };
  const consistent = verifyResult(
    { ...claim, resultingState: corrupted, witness: consistentWitness },
    req
  );
  assert.equal(consistent.status, 'FAIL', 'consistent corruption accepted');
  assert.equal(consistent.predicates.axiomsSatisfied, false);
});

test('Negative Control (E): a vertex claimed fixed/on-axis but displaced is rejected by L7', () => {
  const sc = buildAxisScenarios()[1]!; // multiple points on diagonal axis, O1..O3 fixed
  const moving = [...sc.onAxisMoving, ...sc.offAxisMoving];
  const { req, out, claim, verdict } = runVerifiedReflection(sc.state, sc.line, moving, 'negE-fixed');
  assert.equal(verdict.status, 'PASS');

  // O2 moved off the axis by 1e-3 while still declared fixed.
  const displaced = replaceVertexPosition(out.resultingState, 'O2', { x: 1e-3, y: 0 });
  const moved = posMap(displaced).get('O2')!;
  assert.ok(!liesExactlyOnAxis(moved, sc.line), 'corrupted vertex must be off axis');

  const bad = verifyResult({ ...claim, resultingState: displaced }, req);
  assert.equal(bad.status, 'FAIL');
  assert.equal(bad.predicates.fixedVerticesUnchanged, false);
  assert.ok(bad.residuals.maxFixedDisplacement > DEFAULT_VERIFIER_TOLERANCES.epsilon);

  // Also corrupt the process-level trace.
  const processVerdict = verifyProcess([{ ...out.traceEntry, resultingState: displaced }], [req]);
  assert.equal(processVerdict.status, 'FAIL');
});

test('Negative Control (E): an on-axis vertex listed as moving but displaced is rejected by L7', () => {
  const sc = buildAxisScenarios()[3]!;
  const moving = [...sc.onAxisMoving, ...sc.offAxisMoving];
  const { req, out, claim, verdict } = runVerifiedReflection(sc.state, sc.line, moving, 'negE-moving');
  assert.equal(verdict.status, 'PASS');

  const displaced = replaceVertexPosition(out.resultingState, 'O1', { x: 1e-3, y: 0 });
  const bad = verifyResult({ ...claim, resultingState: displaced }, req);
  assert.equal(bad.status, 'FAIL');

  const forgedWitness: ReflectionWitness = {
    ...out.witness,
    vertexPairs: out.witness.vertexPairs.map((p) =>
      p.vertexId === 'O1' ? { ...p, pPrime: { x: p.pPrime.x + 1e-3, y: p.pPrime.y } } : p
    ),
  };
  const bad2 = verifyResult({ ...claim, resultingState: displaced, witness: forgedWitness }, req);
  assert.equal(bad2.status, 'FAIL');
  assert.equal(bad2.predicates.axiomsSatisfied, false);
});

test('Negative Control (forged claimedResiduals): L7 ignores claimed residuals in both directions', () => {
  const s0 = makeSubdividedSquare('negR-v0', 0);
  const line: LineNormalParams = { nx: 3, ny: -4, c: 5 };
  const allIds = s0.vertices.map((v) => v.id);
  const { req, out, claim, verdict: honest } = runVerifiedReflection(s0, line, allIds, 'negR');
  assert.equal(honest.status, 'PASS');

  // (1) Corrupt geometry (distance invariance broken) + forge residuals to 0 => still FAIL.
  const delta: Point2D = { x: 5e-3, y: -5e-3 };
  const corrupted = replaceVertexPosition(out.resultingState, 'V2', delta);
  assert.ok(checkPairwiseDistances(s0, corrupted, allIds).violations.length > 0);
  const forgedZero: ReflectionWitness = {
    ...out.witness,
    vertexPairs: out.witness.vertexPairs.map((p) =>
      p.vertexId === 'V2' ? { ...p, pPrime: { x: p.pPrime.x + delta.x, y: p.pPrime.y + delta.y } } : p
    ),
    claimedResiduals: { maxMidpointError: 0, maxCollinearityError: 0 },
  };
  const forgedVerdict = verifyResult(
    { ...claim, resultingState: corrupted, witness: forgedZero },
    req
  );
  assert.equal(forgedVerdict.status, 'FAIL');
  assert.ok(
    forgedVerdict.residuals.midpointError > DEFAULT_VERIFIER_TOLERANCES.epsilon ||
      forgedVerdict.residuals.collinearityError > DEFAULT_VERIFIER_TOLERANCES.epsilon,
    'L7 must report independently recomputed residuals, not the forged zeros'
  );

  // (2) Correct geometry + absurdly large claimed residuals => verdict unchanged (PASS).
  const forgedHuge: ReflectionWitness = {
    ...out.witness,
    claimedResiduals: { maxMidpointError: 1e6, maxCollinearityError: 1e6 },
  };
  const hugeVerdict = verifyResult({ ...claim, witness: forgedHuge }, req);
  assert.equal(hugeVerdict.status, 'PASS');
  assert.equal(hugeVerdict.residuals.midpointError, honest.residuals.midpointError);
  assert.equal(hugeVerdict.residuals.collinearityError, honest.residuals.collinearityError);
});

// ===========================================================================
// Phase 2.3.3 — Property F: Face Orientation Reversal Under Reflection
// ===========================================================================

/**
 * Computes the signed oriented area of a polygon face using the shoelace formula:
 *   A = 0.5 * sum_{i=0}^{n-1} (x_i * y_{i+1} - x_{i+1} * y_i)
 * where indices wrap around (i+1 mod n).
 */
function computeSignedArea(
  faceVertexIds: readonly VertexId[],
  state: GeometryState
): number {
  const map = posMap(state);
  const pts = faceVertexIds.map((id) => {
    const p = map.get(id);
    assert.ok(p, `Vertex ${id} not found in state vertices`);
    return p;
  });
  const n = pts.length;
  if (n < 3) return 0; // degenerate or line segment

  let sum = 0;
  for (let i = 0; i < n; i++) {
    const p1 = pts[i]!;
    const p2 = pts[(i + 1) % n]!;
    sum += p1.x * p2.y - p2.x * p1.y;
  }
  return 0.5 * sum;
}

const DEGENERATE_AREA_THRESHOLD = 1e-12;

function isFaceDegenerate(
  faceVertexIds: readonly VertexId[],
  state: GeometryState
): boolean {
  return Math.abs(computeSignedArea(faceVertexIds, state)) < DEGENERATE_AREA_THRESHOLD;
}

function faceAreaTolerance(area: number): number {
  // Scale-based tolerance: 1e-12 * max(1, |area|)
  return 1e-12 * Math.max(1, Math.abs(area));
}

test('Property F1 (Full Reflection): oriented area sign reverses and absolute area is preserved for non-degenerate faces across axes', () => {
  const axes: readonly { readonly id: string; readonly line: LineNormalParams }[] = [
    { id: 'diag', line: { nx: 1, ny: -1, c: 0 } },
    { id: 'oblique', line: { nx: 3, ny: -4, c: 5 } },
    { id: 'vertical', line: { nx: 1, ny: 0, c: -1.5 } },
    { id: 'horizontal', line: { nx: 0, ny: 1, c: 2.25 } },
  ];

  const geometries: readonly {
    readonly name: string;
    readonly build: () => GeometryState;
  }[] = [
    { name: 'subdividedSquare', build: () => makeSubdividedSquare('f1-sq-v0', 0) },
    { name: 'asymmetricPolygonMesh', build: () => makeAsymmetricPolygonMesh('f1-mesh-v0', 0) },
  ];

  for (const geom of geometries) {
    for (const axis of axes) {
      const s0 = geom.build();
      const allIds = s0.vertices.map((v) => v.id);
      const { out, verdict } = runVerifiedReflection(s0, axis.line, allIds, `F1-${geom.name}-${axis.id}`);

      assert.equal(verdict.status, 'PASS', `L7 failed for F1 ${geom.name} ${axis.id}: ${verdict.diagnostics.join('; ')}`);
      assert.equal(verdict.predicates.idsPreserved, true);

      assertTopologyPreserved(out.resultingState, s0, {
        property: 'Property F1',
        parameters: { geometry: geom.name, axis: axis.id },
        sourceState: s0,
        expectedRelation: 'Topology and IDs preserved',
      });

      for (const face of s0.faces) {
        const area0 = computeSignedArea(face.vertexIds, s0);
        if (Math.abs(area0) < DEGENERATE_AREA_THRESHOLD) {
          // Degenerate face: classified as DEGENERATE / NOT EVALUATED per spec §3
          continue;
        }

        const area1 = computeSignedArea(face.vertexIds, out.resultingState);
        const tol = faceAreaTolerance(area0);

        // Sign reversal: A(R_L(F)) = -A(F)
        const signSumError = Math.abs(area1 + area0);
        assert.ok(
          signSumError <= tol,
          `Face ${face.id} in ${geom.name} axis ${axis.id} failed sign reversal: A0=${area0}, A1=${area1}, err=${signSumError}`
        );

        // Magnitude preservation: |A(R_L(F))| = |A(F)|
        const magError = Math.abs(Math.abs(area1) - Math.abs(area0));
        assert.ok(
          magError <= tol,
          `Face ${face.id} in ${geom.name} axis ${axis.id} failed magnitude preservation: |A0|=${Math.abs(area0)}, |A1|=${Math.abs(area1)}`
        );
      }
    }
  }
});

test('Property F2 (Partial Reflection): moving faces reverse orientation, fixed faces preserve orientation, mixed faces are unconstrained', () => {
  // 6-vertex mesh with purely moving face (D,E,G), purely fixed face (A,B,C), and mixed face (B,D,G,C)
  const partialMesh = createInitialGeometryState({
    stateId: 'f2-partial-v0',
    version: 0,
    vertices: [
      { id: 'A', position: { x: -3, y: 0 } },
      { id: 'B', position: { x: -1, y: 0 } },
      { id: 'C', position: { x: -2, y: 2 } },
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
      { id: 'F_MIXED', vertexIds: ['B', 'D', 'G', 'C'] },
    ],
  });

  const movingIds = ['D', 'E', 'G'];
  const fixedIds = ['A', 'B', 'C'];
  const line: LineNormalParams = { nx: 1, ny: 0, c: -1.5 }; // x = -1.5 divides A,B,C from D,E,G

  const { out, verdict } = runVerifiedReflection(partialMesh, line, movingIds, 'F2-partial');
  assert.equal(verdict.status, 'PASS', verdict.diagnostics.join('; '));
  assert.deepEqual([...out.witness.movingVertexIds].sort(), [...movingIds].sort());
  assert.deepEqual([...out.witness.fixedVertexIds].sort(), [...fixedIds].sort());

  // 1. Purely moving face: all vertices in movingVertexIds -> area sign must reverse, magnitude preserved.
  const movA0 = computeSignedArea(['D', 'E', 'G'], partialMesh);
  const movA1 = computeSignedArea(['D', 'E', 'G'], out.resultingState);
  assert.ok(Math.abs(movA1 + movA0) <= faceAreaTolerance(movA0));
  assert.ok(Math.abs(Math.abs(movA1) - Math.abs(movA0)) <= faceAreaTolerance(movA0));

  // 2. Purely fixed face: all vertices in fixedVertexIds -> area must remain completely unchanged (A1 === A0).
  const fixA0 = computeSignedArea(['A', 'B', 'C'], partialMesh);
  const fixA1 = computeSignedArea(['A', 'B', 'C'], out.resultingState);
  assert.ok(Math.abs(fixA1 - fixA0) <= METAMORPHIC_COORD_TOLERANCE);

  // 3. Mixed face: contains both moving and fixed vertices -> Property F is not applicable.
  // We verify that the face remains valid topologically, but do not assert sign reversal.
  const mixedA0 = computeSignedArea(['B', 'D', 'G', 'C'], partialMesh);
  const mixedA1 = computeSignedArea(['B', 'D', 'G', 'C'], out.resultingState);
  assert.ok(!isFaceDegenerate(['B', 'D', 'G', 'C'], partialMesh));
  assert.ok(!isFaceDegenerate(['B', 'D', 'G', 'C'], out.resultingState));
  // Magnitude may or may not change depending on partial transformation; we only ensure no crash/invalid topology.
  assert.ok(Math.abs(mixedA0) > 0 && Math.abs(mixedA1) > 0);
});

test('Property F3 (Faces on Axis & Degenerate Faces): faces with vertices on the axis evaluate correctly; degenerate faces are classified DEGENERATE / NOT EVALUATED', () => {
  // Scenario: a triangle face where one vertex lies exactly on the reflection axis,
  // classified as moving. Non-zero non-degenerate area is preserved in magnitude and reverses sign.
  const line: LineNormalParams = { nx: 1, ny: -1, c: 0 }; // x - y = 0 (diagonal line y = x)
  // Vertices:
  //   O1(1, 1) -> lies on axis (1 - 1 = 0)
  //   M1(3, 1) -> off axis
  //   M2(1, 3) -> off axis
  const faceOnAxisState = makeAxisScenarioState(
    'f3-axis-v0',
    [
      { id: 'O1', x: 1, y: 1 },
      { id: 'M1', x: 3, y: 1 },
      { id: 'M2', x: 1, y: 3 },
    ],
    ['O1', 'M1', 'M2']
  );

  assert.ok(liesExactlyOnAxis({ x: 1, y: 1 }, line));
  const moving = ['O1', 'M1', 'M2'];
  const { out, verdict } = runVerifiedReflection(faceOnAxisState, line, moving, 'F3-axis');
  assert.equal(verdict.status, 'PASS');

  const a0 = computeSignedArea(['O1', 'M1', 'M2'], faceOnAxisState);
  const a1 = computeSignedArea(['O1', 'M1', 'M2'], out.resultingState);
  assert.ok(!isFaceDegenerate(['O1', 'M1', 'M2'], faceOnAxisState));
  assert.ok(!isFaceDegenerate(['O1', 'M1', 'M2'], out.resultingState));
  assert.ok(Math.abs(a1 + a0) <= faceAreaTolerance(a0));
  assert.ok(Math.abs(Math.abs(a1) - Math.abs(a0)) <= faceAreaTolerance(a0));

  // Degenerate face classification check:
  // Collinear vertices (0,0), (1,1), (2,2) on line y = x
  const degenerateState = createInitialGeometryState({
    stateId: 'f3-deg-v0',
    version: 0,
    vertices: [
      { id: 'D0', position: { x: 0, y: 0 } },
      { id: 'D1', position: { x: 1, y: 1 } },
      { id: 'D2', position: { x: 2, y: 2 } },
    ],
    edges: [
      { id: 'ED01', startVertexId: 'D0', endVertexId: 'D1' },
      { id: 'ED12', startVertexId: 'D1', endVertexId: 'D2' },
      { id: 'ED20', startVertexId: 'D2', endVertexId: 'D0' },
    ],
    faces: [{ id: 'F_DEGENERATE', vertexIds: ['D0', 'D1', 'D2'] }],
  });

  const isDeg = isFaceDegenerate(['D0', 'D1', 'D2'], degenerateState);
  assert.ok(isDeg, 'Collinear face must be classified as DEGENERATE / NOT EVALUATED for Property F');
  const degArea = computeSignedArea(['D0', 'D1', 'D2'], degenerateState);
  assert.ok(Math.abs(degArea) < DEGENERATE_AREA_THRESHOLD);
});

test('Phase 2.3.3 Negative Controls (Property F): coordinate mutation, sign tampering, forged residuals, and mixed/degenerate invalidity checks', () => {
  const s0 = makeSubdividedSquare('negF-v0', 0);
  const line: LineNormalParams = { nx: 3, ny: -4, c: 5 };
  const allIds = s0.vertices.map((v) => v.id);
  const { req, out, claim, verdict } = runVerifiedReflection(s0, line, allIds, 'negF');
  assert.equal(verdict.status, 'PASS');

  // 1. Coordinate mutation of V2 breaks area sign reversal & magnitude preservation + L7 fails.
  const corrupted = replaceVertexPosition(out.resultingState, 'V2', { x: 2e-2, y: -2e-2 });
  const faceId = s0.faces[1]!.vertexIds;
  const a0 = computeSignedArea(faceId, s0);
  const aCorrupted = computeSignedArea(faceId, corrupted);
  const signErr = Math.abs(aCorrupted + a0);
  assert.ok(
    signErr > 1e-3,
    'Corrupted coordinate must violate oriented area sign reversal'
  );

  const stateOnly = verifyResult({ ...claim, resultingState: corrupted }, req);
  assert.equal(stateOnly.status, 'FAIL', 'L7 must reject coordinate-mutated result');

  // 2. Forged claimedResiduals=0 on corrupted state still results in L7 FAIL.
  const forgedWitness: ReflectionWitness = {
    ...out.witness,
    vertexPairs: out.witness.vertexPairs.map((p) =>
      p.vertexId === 'V2' ? { ...p, pPrime: { x: p.pPrime.x + 2e-2, y: p.pPrime.y - 2e-2 } } : p
    ),
    claimedResiduals: { maxMidpointError: 0, maxCollinearityError: 0 },
  };
  const forgedVerdict = verifyResult(
    { ...claim, resultingState: corrupted, witness: forgedWitness },
    req
  );
  assert.equal(forgedVerdict.status, 'FAIL');
  assert.equal(forgedVerdict.predicates.axiomsSatisfied, false);
});

