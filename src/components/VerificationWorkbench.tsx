/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useMemo, useState } from 'react';
import {
  AlertTriangle,
  Check,
  Info,
  RotateCcw,
  ShieldAlert,
} from 'lucide-react';
import {
  createInitialGeometryState,
  reflectAcrossLine,
} from '../core/l2GeometryEngine';
import {
  DEFAULT_VERIFIER_TOLERANCES,
  verifyProcess,
  verifyResult,
} from '../core/l7IndependentVerifier';
import {
  appendTraceEntry,
  cloneGeometryState,
  cloneReflectionWitness,
  createTraceEntry,
} from '../core/trace';
import type {
  GeometryState,
  LineNormalParams,
  Point2D,
  ReflectionWitness,
  TraceEntry,
  VerificationVerdict,
} from '../core/types';

export type FoldStage = 'initial' | 'subdivided' | 'reflected';
export type TestCaseId = 'T-01' | 'T-02' | 'T-03' | 'T-04';
type AxisPresetId = 'diag_unit' | 'oblique_3x_4y_5' | 'scaled_1e6';

interface VerificationWorkbenchProps {
  stage: FoldStage;
  onStageChange: (stage: FoldStage) => void;
  testCase: TestCaseId;
  onTestCaseChange: (tc: TestCaseId) => void;
}

const AXIS_PRESETS: Record<
  AxisPresetId,
  { label: string; line: LineNormalParams }
> = {
  diag_unit: {
    label: 'x + y = 1',
    line: { nx: 1, ny: 1, c: 1 },
  },
  oblique_3x_4y_5: {
    label: '3x − 4y = 5',
    line: { nx: 3, ny: -4, c: 5 },
  },
  scaled_1e6: {
    label: '10⁶·(x + y = 1)',
    line: { nx: 1e6, ny: 1e6, c: 1e6 },
  },
};

function buildBaseSquareTriangleState(axisPreset: AxisPresetId): {
  initialState: GeometryState;
  movingVertexIds: string[];
  line: LineNormalParams;
} {
  if (axisPreset === 'oblique_3x_4y_5') {
    const initialState = createInitialGeometryState({
      stateId: 'state-v0',
      version: 0,
      vertices: [
        { id: 'A', position: { x: 2, y: 1 } },
        { id: 'B', position: { x: 0, y: 0 } },
        { id: 'C', position: { x: 3, y: 0 } },
      ],
      edges: [
        { id: 'E1', startVertexId: 'A', endVertexId: 'B' },
        { id: 'E2', startVertexId: 'B', endVertexId: 'C' },
        { id: 'E3', startVertexId: 'C', endVertexId: 'A' },
      ],
      faces: [{ id: 'F0', vertexIds: ['A', 'B', 'C'] }],
    });
    return {
      initialState,
      movingVertexIds: ['A', 'B', 'C'],
      line: AXIS_PRESETS.oblique_3x_4y_5.line,
    };
  }

  // Subdivided unit square: F0_A fixed, F0_B has moving vertex V2
  const initialState = createInitialGeometryState({
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

  return {
    initialState,
    movingVertexIds: ['V2'],
    line: AXIS_PRESETS[axisPreset].line,
  };
}

export function VerificationWorkbench({
  stage,
  onStageChange,
  testCase,
  onTestCaseChange,
}: VerificationWorkbenchProps) {
  const [traceMode, setTraceMode] = useState<'result' | 'process'>('process');
  const [axisPreset, setAxisPreset] = useState<AxisPresetId>('diag_unit');
  const [degenerateMode, setDegenerateMode] = useState<boolean>(false);

  const execution = useMemo(() => {
    const { initialState, movingVertexIds, line } =
      buildBaseSquareTriangleState(axisPreset);

    // Run L2 certifying geometry engine (normal projection + ReflectionWitness)
    const l2Out = reflectAcrossLine({
      sourceState: initialState,
      line,
      movingVertexIds,
      stepIndex: 0,
      precisionContext: DEFAULT_VERIFIER_TOLERANCES.epsilon,
    });

    let claimSource = l2Out.traceEntry.sourceState;
    let claimResult = l2Out.resultingState;
    let claimParams = l2Out.traceEntry.parameters;
    let claimWitness: ReflectionWitness = l2Out.witness;
    let trace: readonly TraceEntry[] = [l2Out.traceEntry];

    if (degenerateMode) {
      claimParams = {
        ...claimParams,
        line: { nx: 0, ny: 0, c: line.c },
      };
      claimWitness = cloneReflectionWitness({
        ...claimWitness,
        axis: { n: { nx: 0, ny: 0 }, c: line.c },
      });
      trace = [
        createTraceEntry({
          operationId: l2Out.traceEntry.operationId,
          stepIndex: 0,
          sourceState: claimSource,
          resultingState: claimResult,
          parameters: claimParams,
          witness: claimWitness,
          precision: DEFAULT_VERIFIER_TOLERANCES.epsilon,
          provenance: l2Out.traceEntry.provenance,
        }),
      ];
    } else if (testCase === 'T-02') {
      // Corrupt moving vertex to (2, 0) AND forge L2 claimedResiduals to 0
      // to prove L7 ignores claimedResiduals and verifies axioms independently.
      const targetId = movingVertexIds[0];
      const corruptedPos: Point2D =
        axisPreset === 'oblique_3x_4y_5' ? { x: 2.5, y: 0.5 } : { x: 2, y: 0 };
      claimResult = cloneGeometryState({
        ...claimResult,
        vertices: claimResult.vertices.map((v) =>
          v.id === targetId ? { id: v.id, position: corruptedPos } : v
        ),
      });
      claimWitness = cloneReflectionWitness({
        ...claimWitness,
        vertexPairs: claimWitness.vertexPairs.map((pair) =>
          pair.vertexId === targetId
            ? { ...pair, pPrime: corruptedPos }
            : pair
        ),
        claimedResiduals: {
          maxMidpointError: 0,
          maxCollinearityError: 0,
        },
      });
      trace = [
        createTraceEntry({
          operationId: l2Out.traceEntry.operationId,
          stepIndex: 0,
          sourceState: claimSource,
          resultingState: claimResult,
          parameters: claimParams,
          witness: claimWitness,
          precision: DEFAULT_VERIFIER_TOLERANCES.epsilon,
          provenance: 'FORGED_WITNESS_RESIDUALS_SIMULATION',
        }),
      ];
    } else if (testCase === 'T-03') {
      // Tamper axis scalar c in claim.parameters after L2 emitted witness
      claimParams = {
        ...claimParams,
        line: { nx: line.nx, ny: line.ny, c: line.c + 0.25 },
      };
      trace = [
        createTraceEntry({
          operationId: l2Out.traceEntry.operationId,
          stepIndex: 0,
          sourceState: claimSource,
          resultingState: claimResult,
          parameters: claimParams,
          witness: claimWitness,
          precision: DEFAULT_VERIFIER_TOLERANCES.epsilon,
          provenance: 'TAMPERED_AXIS_PARAMETERS',
        }),
      ];
    } else if (testCase === 'T-04') {
      // Two-step trace where step 1 is a valid transition from step0.resultingState,
      // but step 1's sourceState inside TRACE is disconnected from step 0's resultingState.
      const step1Valid = reflectAcrossLine({
        sourceState: l2Out.resultingState,
        line: { nx: 1, ny: 0, c: 0 },
        movingVertexIds: [movingVertexIds[0]],
        stepIndex: 1,
        precisionContext: DEFAULT_VERIFIER_TOLERANCES.epsilon,
      });

      const brokenIntermediate = cloneGeometryState({
        ...l2Out.resultingState,
        vertices: l2Out.resultingState.vertices.map((v) =>
          v.id === movingVertexIds[0]
            ? {
                id: v.id,
                position: { x: v.position.x + 0.12, y: v.position.y + 0.05 },
              }
            : v
        ),
      });

      const brokenEntry1 = createTraceEntry({
        operationId: step1Valid.traceEntry.operationId,
        stepIndex: 1,
        sourceState: brokenIntermediate,
        resultingState: step1Valid.resultingState,
        parameters: step1Valid.traceEntry.parameters,
        witness: step1Valid.witness,
        precision: DEFAULT_VERIFIER_TOLERANCES.epsilon,
        provenance: 'BROKEN_TRACE_CONTINUITY',
      });

      trace = appendTraceEntry([l2Out.traceEntry], brokenEntry1);
      // Result Verification inspects the valid step 1 claim directly
      claimSource = step1Valid.traceEntry.sourceState;
      claimResult = step1Valid.resultingState;
      claimParams = step1Valid.traceEntry.parameters;
      claimWitness = step1Valid.witness;
    }

    const resultVerdict = verifyResult({
      sourceState: claimSource,
      resultingState: claimResult,
      operation: 'REFLECTION_ACROSS_LINE',
      parameters: claimParams,
      witness: claimWitness,
    });

    const processVerdict = verifyProcess(trace);

    const activeVerdict: VerificationVerdict | null =
      stage === 'reflected'
        ? traceMode === 'process'
          ? processVerdict
          : resultVerdict
        : null;

    return {
      initialState,
      displayState: stage === 'reflected' ? claimResult : initialState,
      line,
      movingVertexIds,
      activeWitness: claimWitness,
      trace,
      activeVerdict,
      resultVerdict,
      processVerdict,
    };
  }, [axisPreset, degenerateMode, stage, testCase, traceMode]);

  const isReflected = stage === 'reflected';

  // Map R² coordinates onto 240x240 SVG viewport (UI rendering layer only)
  const toSvg = (p: Point2D) => {
    if (axisPreset === 'oblique_3x_4y_5') {
      return {
        sx: 24 + ((p.x + 0.5) / 4.0) * 192,
        sy: 216 - ((p.y + 2.0) / 4.0) * 192,
      };
    }
    return {
      sx: 36 + ((p.x + 0.3) / 2.6) * 180,
      sy: 204 - ((p.y + 0.2) / 1.6) * 160,
    };
  };

  const vertexLookup = new Map(
    execution.displayState.vertices.map((v) => [v.id, v.position])
  );
  const initialLookup = new Map(
    execution.initialState.vertices.map((v) => [v.id, v.position])
  );

  const getLineSegmentSvg = (line: LineNormalParams) => {
    const pts: Point2D[] = [];
    if (Math.abs(line.ny) > 1e-9) {
      pts.push({ x: -0.4, y: (line.c - line.nx * -0.4) / line.ny });
      pts.push({ x: 3.4, y: (line.c - line.nx * 3.4) / line.ny });
    } else if (Math.abs(line.nx) > 1e-9) {
      const xVal = line.c / line.nx;
      pts.push({ x: xVal, y: -2 });
      pts.push({ x: xVal, y: 2 });
    }
    if (pts.length < 2) return null;
    return { a: toSvg(pts[0]), b: toSvg(pts[1]) };
  };

  const axisSvg = getLineSegmentSvg(execution.line);
  const verdict = execution.activeVerdict;
  const witness = execution.activeWitness;

  const selectTestCase = (tc: TestCaseId) => {
    setDegenerateMode(false);
    onTestCaseChange(tc);
    onStageChange('reflected');
  };

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-stretch">
      {/* Left Column: Core Client Controls & Axiomatic L7 Verdict */}
      <div className="flex flex-col justify-between gap-6 lg:col-span-6">
        <div>
          <p className="font-mono text-xs text-blue-700">
            Contract 02 v2 · Certifying ReflectionWitness ↔ Axiomatic L7 Verifier
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
            Сертификационное ядро L2 ↔ L7
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            L2 формирует свидетельство{' '}
            <span className="font-mono text-xs">ReflectionWitness</span>, а
            изолированный верификатор{' '}
            <span className="font-mono text-xs">L7</span> проверяет привязку
            состояний, масштаб-инвариантные аксиомы{' '}
            <span className="font-mono text-xs">midpointError</span> /{' '}
            <span className="font-mono text-xs">collinearityError</span> и
            инварианты области действия без повторного запуска решателя.
          </p>

          {/* Axis & Stage Controls */}
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => onStageChange('initial')}
                className={`whitespace-nowrap rounded-lg px-3 py-2 text-xs font-medium transition-colors cursor-pointer ${
                  stage === 'initial'
                    ? 'bg-slate-900 text-white'
                    : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-100'
                }`}
              >
                1. Состояние S₀
              </button>
              <button
                type="button"
                onClick={() => onStageChange('subdivided')}
                className={`whitespace-nowrap rounded-lg px-3 py-2 text-xs font-medium transition-colors cursor-pointer ${
                  stage === 'subdivided'
                    ? 'bg-slate-900 text-white'
                    : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-100'
                }`}
              >
                2. Ось сгиба
              </button>
              <button
                type="button"
                onClick={() => onStageChange('reflected')}
                className={`whitespace-nowrap rounded-lg px-3 py-2 text-xs font-medium transition-colors cursor-pointer ${
                  stage === 'reflected'
                    ? 'bg-blue-700 text-white'
                    : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-100'
                }`}
              >
                3. Witness → L7
              </button>
            </div>

            <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-1">
              {(Object.keys(AXIS_PRESETS) as AxisPresetId[]).map((presetKey) => (
                <button
                  key={presetKey}
                  type="button"
                  onClick={() => setAxisPreset(presetKey)}
                  className={`whitespace-nowrap rounded-md px-2.5 py-1 font-mono text-xs font-medium transition-colors cursor-pointer ${
                    axisPreset === presetKey
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {AXIS_PRESETS[presetKey].label}
                </button>
              ))}
            </div>
          </div>

          {/* Scenario & Verification Mode Selector */}
          <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-medium text-slate-700">
                Сценарий проверки и режим L7
              </span>
              <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-1">
                <button
                  type="button"
                  onClick={() => setTraceMode('process')}
                  className={`whitespace-nowrap rounded-md px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer ${
                    traceMode === 'process'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Process Verification
                </button>
                <button
                  type="button"
                  onClick={() => setTraceMode('result')}
                  className={`whitespace-nowrap rounded-md px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer ${
                    traceMode === 'result'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Result Verification
                </button>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-5">
              <button
                type="button"
                onClick={() => selectTestCase('T-01')}
                className={`rounded-lg border px-2.5 py-2 text-left text-xs transition-colors cursor-pointer ${
                  !degenerateMode && testCase === 'T-01'
                    ? 'border-blue-600 bg-blue-50 text-blue-900'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                <span className="block font-mono font-semibold">T-01</span>
                <span className="block text-[11px] text-slate-500">Эталон</span>
              </button>
              <button
                type="button"
                onClick={() => selectTestCase('T-02')}
                className={`rounded-lg border px-2.5 py-2 text-left text-xs transition-colors cursor-pointer ${
                  !degenerateMode && testCase === 'T-02'
                    ? 'border-rose-600 bg-rose-50 text-rose-900'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                <span className="block font-mono font-semibold">T-02</span>
                <span className="block text-[11px] text-slate-500">
                  Подмена + 0-отчёт
                </span>
              </button>
              <button
                type="button"
                onClick={() => selectTestCase('T-03')}
                className={`rounded-lg border px-2.5 py-2 text-left text-xs transition-colors cursor-pointer ${
                  !degenerateMode && testCase === 'T-03'
                    ? 'border-rose-600 bg-rose-50 text-rose-900'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                <span className="block font-mono font-semibold">T-03</span>
                <span className="block text-[11px] text-slate-500">Сдвиг оси c</span>
              </button>
              <button
                type="button"
                onClick={() => selectTestCase('T-04')}
                className={`rounded-lg border px-2.5 py-2 text-left text-xs transition-colors cursor-pointer ${
                  !degenerateMode && testCase === 'T-04'
                    ? 'border-rose-600 bg-rose-50 text-rose-900'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                <span className="block font-mono font-semibold">T-04</span>
                <span className="block text-[11px] text-slate-500">Разрыв TRACE</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setDegenerateMode(true);
                  onStageChange('reflected');
                }}
                className={`rounded-lg border px-2.5 py-2 text-left text-xs transition-colors cursor-pointer ${
                  degenerateMode
                    ? 'border-amber-600 bg-amber-50 text-amber-900'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                <span className="block font-mono font-semibold">DEG</span>
                <span className="block text-[11px] text-slate-500">||n|| = 0</span>
              </button>
            </div>
          </div>
        </div>

        {/* L7 Independent Verdict, Axiomatic Residuals & Predicates */}
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <span className="font-mono text-xs text-slate-500">
              {traceMode === 'process' ? 'verifyProcess(trace)' : 'verifyResult(claim)'} · ε = 1e-7
            </span>
            <span className="inline-flex items-center gap-1.5 font-mono text-xs font-semibold">
              {!verdict && (
                <>
                  <Info className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
                  <span className="text-slate-500">PENDING</span>
                </>
              )}
              {verdict?.status === 'PASS' && (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-700" aria-hidden="true" />
                  <span className="text-emerald-700">PASS</span>
                </>
              )}
              {verdict?.status === 'FAIL' && (
                <>
                  <AlertTriangle className="h-3.5 w-3.5 text-rose-700" aria-hidden="true" />
                  <span className="text-rose-700">FAIL</span>
                </>
              )}
              {verdict?.status === 'UNDETERMINED' && (
                <>
                  <ShieldAlert className="h-3.5 w-3.5 text-amber-700" aria-hidden="true" />
                  <span className="text-amber-700">UNDETERMINED</span>
                </>
              )}
            </span>
          </div>

          {/* Independently Computed Axiomatic Residuals (L7) */}
          <p className="mt-3 text-[11px] font-medium text-slate-500">
            Независимые невязки L7 (вычислены без доверия к L2)
          </p>
          <dl className="mt-2 grid grid-cols-2 gap-3 text-xs sm:grid-cols-3">
            <div>
              <dt className="text-slate-500">midpointError</dt>
              <dd className="mt-0.5 font-mono font-semibold tabular-nums text-slate-900">
                {verdict ? verdict.residuals.midpointError.toExponential(2) : '0.00e+0'}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">collinearityError</dt>
              <dd className="mt-0.5 font-mono font-semibold tabular-nums text-slate-900">
                {verdict ? verdict.residuals.collinearityError.toExponential(2) : '0.00e+0'}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">maxLengthError</dt>
              <dd className="mt-0.5 font-mono font-semibold tabular-nums text-slate-900">
                {verdict ? verdict.residuals.maxLengthError.toExponential(2) : '0.00e+0'}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">areaError</dt>
              <dd className="mt-0.5 font-mono font-semibold tabular-nums text-slate-900">
                {verdict ? verdict.residuals.areaError.toExponential(2) : '0.00e+0'}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">maxFixedDisplacement</dt>
              <dd className="mt-0.5 font-mono font-semibold tabular-nums text-slate-900">
                {verdict ? verdict.residuals.maxFixedDisplacement.toExponential(2) : '0.00e+0'}
              </dd>
            </div>
          </dl>

          {/* Boolean Predicates */}
          {verdict && (
            <div className="mt-4 border-t border-slate-100 pt-3">
              <p className="text-xs font-medium text-slate-500">Предикаты L7</p>
              <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 font-mono text-[11px]">
                {(
                  Object.entries(verdict.predicates) as [string, boolean][]
                ).map(([key, ok]) => (
                  <div key={key} className="flex items-center justify-between gap-2">
                    <span className="truncate text-slate-600">{key}</span>
                    <span className={ok ? 'font-semibold text-emerald-700' : 'font-semibold text-rose-700'}>
                      {String(ok)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Diagnostics */}
          {verdict && verdict.diagnostics.length > 0 && (
            <div className="mt-3 border-t border-slate-100 pt-3">
              <p className="text-xs font-medium text-slate-500">Диагностика L7</p>
              <ul className="mt-1 space-y-1 font-mono text-[11px] text-rose-700">
                {verdict.diagnostics.map((msg, idx) => (
                  <li key={`${idx}-${msg}`}>{msg}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Right Column: R² Viewport + ReflectionWitness & TRACE Inspector */}
      <div className="flex flex-col justify-between gap-5 rounded-xl border border-slate-200 bg-white p-6 lg:col-span-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <span className="font-mono text-xs text-slate-500">
            Пространство ℝ² · {execution.displayState.stateId} (v{execution.displayState.version}) ·{' '}
            {AXIS_PRESETS[axisPreset].label}
          </span>
          <button
            type="button"
            onClick={() => {
              setDegenerateMode(false);
              onTestCaseChange('T-01');
              onStageChange('initial');
            }}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 cursor-pointer"
          >
            <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Сбросить</span>
          </button>
        </div>

        <div className="flex items-center justify-center">
          <svg
            viewBox="0 0 240 240"
            className="h-56 w-56 sm:h-64 sm:w-64"
            role="img"
            aria-label="Визуализация состояния геометрии L2 и аксиоматической проверки L7"
          >
            {isReflected &&
              execution.initialState.faces.map((face) => {
                const pts = face.vertexIds
                  .map((id) => initialLookup.get(id))
                  .filter((p): p is Point2D => Boolean(p))
                  .map(toSvg)
                  .map((s) => `${s.sx},${s.sy}`)
                  .join(' ');
                return (
                  <polygon
                    key={`ghost-${face.id}`}
                    points={pts}
                    fill="none"
                    stroke="#CBD5E1"
                    strokeWidth="1"
                    strokeDasharray="4 4"
                  />
                );
              })}

            {execution.displayState.faces.map((face) => {
              const pts = face.vertexIds
                .map((id) => vertexLookup.get(id))
                .filter((p): p is Point2D => Boolean(p))
                .map(toSvg)
                .map((s) => `${s.sx},${s.sy}`)
                .join(' ');
              const isMovingFace = face.vertexIds.some((id) =>
                execution.movingVertexIds.includes(id)
              );
              const strokeColor =
                isReflected && isMovingFace && verdict?.status === 'FAIL'
                  ? '#BE123C'
                  : isReflected && isMovingFace && verdict?.status === 'UNDETERMINED'
                    ? '#B45309'
                    : isMovingFace
                      ? '#1D4ED8'
                      : '#0F172A';
              const fillColor =
                isReflected && isMovingFace && verdict?.status === 'FAIL'
                  ? 'rgba(225, 29, 72, 0.14)'
                  : isMovingFace
                    ? 'rgba(29, 78, 216, 0.12)'
                    : 'rgba(241, 245, 249, 0.7)';

              return (
                <polygon
                  key={face.id}
                  points={pts}
                  fill={fillColor}
                  stroke={strokeColor}
                  strokeWidth="1.75"
                />
              );
            })}

            {(stage === 'subdivided' || stage === 'reflected') && axisSvg && (
              <line
                x1={axisSvg.a.sx}
                y1={axisSvg.a.sy}
                x2={axisSvg.b.sx}
                y2={axisSvg.b.sy}
                stroke="#1D4ED8"
                strokeWidth="1.5"
                strokeDasharray={stage === 'subdivided' ? '5 4' : undefined}
              />
            )}

            {execution.displayState.vertices.map((v) => {
              const s = toSvg(v.position);
              const isMoving = execution.movingVertexIds.includes(v.id);
              return (
                <g key={v.id}>
                  <circle
                    cx={s.sx}
                    cy={s.sy}
                    r={isMoving ? 4 : 3}
                    fill={
                      isReflected && isMoving && verdict?.status === 'FAIL'
                        ? '#BE123C'
                        : isMoving
                          ? '#1D4ED8'
                          : '#0F172A'
                    }
                  />
                  <text
                    x={s.sx + 6}
                    y={s.sy - 5}
                    className="fill-slate-600 font-mono text-[9px]"
                  >
                    {v.id}({v.position.x.toFixed(2)},{v.position.y.toFixed(2)})
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* ReflectionWitness Inspector (L2 Producer Output) */}
        <div className="border-t border-slate-100 pt-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs font-medium text-slate-500">
              Свидетельство L2 · ReflectionWitness
            </p>
            <span className="font-mono text-[11px] text-slate-500">
              {witness.sourceStateId}@v{witness.sourceStateVersion} →{' '}
              {witness.targetStateId}@v{witness.targetStateVersion}
            </span>
          </div>

          <div className="mt-2 rounded-lg border border-slate-200 bg-slate-50 p-3 font-mono text-[11px] text-slate-700">
            <div className="flex flex-wrap items-center justify-between gap-2 text-slate-600">
              <span>{witness.witnessId}</span>
              <span>
                axis: n=({witness.axis.n.nx}, {witness.axis.n.ny}), c={witness.axis.c}
              </span>
            </div>

            <div className="mt-2 space-y-1">
              {witness.vertexPairs.map((pair) => (
                <div
                  key={pair.vertexId}
                  className="flex flex-wrap items-center justify-between gap-2 rounded bg-white px-2 py-1 text-slate-800"
                >
                  <span className="font-semibold text-blue-700">{pair.vertexId}</span>
                  <span>
                    ({pair.p.x.toFixed(4)}, {pair.p.y.toFixed(4)}) → (
                    {pair.pPrime.x.toFixed(4)}, {pair.pPrime.y.toFixed(4)})
                  </span>
                </div>
              ))}
            </div>

            {witness.claimedResiduals && (
              <div className="mt-2 border-t border-slate-200 pt-2 text-[11px] text-slate-500">
                L2 claimedResiduals (не доверенные для L7): mid=
                {witness.claimedResiduals.maxMidpointError.toExponential(2)}, col=
                {witness.claimedResiduals.maxCollinearityError.toExponential(2)}
              </div>
            )}
          </div>
        </div>

        {/* Immutable TRACE Snapshot Inspector */}
        <div className="border-t border-slate-100 pt-4">
          <p className="text-xs font-medium text-slate-500">
            Журнал переходов TRACE ({execution.trace.length} записей)
          </p>
          <ul className="mt-2 space-y-1.5">
            {execution.trace.map((entry) => (
              <li
                key={`${entry.operationId}-${entry.stepIndex}`}
                className="rounded-lg bg-slate-50 px-3 py-2 font-mono text-[11px] text-slate-700"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-semibold text-slate-900">
                    step {entry.stepIndex} · {entry.operation} ·{' '}
                    {entry.sourceState.stateId}@v{entry.sourceStateVersion}→
                    {entry.resultingState.stateId}@v{entry.targetStateVersion}
                  </span>
                  <span className="text-slate-500">{entry.provenance}</span>
                </div>
                <div className="mt-1 text-slate-500">
                  witness: {entry.witness.witnessId} · moving:[
                  {entry.parameters.movingVertexIds.join(',')}] · fixed:[
                  {entry.parameters.fixedVertexIds.join(',')}]
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
