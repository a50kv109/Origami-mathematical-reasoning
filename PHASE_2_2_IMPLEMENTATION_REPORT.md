# Phase 2.2 Implementation Report — Trusted `OperationRequest` & Contract 02 Hardening

**Вердикт:** **ACCEPTED**  
**Базовый релиз:** `origami-mathematical-reasoning@0.1.0`  
**Дата отчёта:** 2026-11-15  
**Статус проверок:** `npm test` **19/19 PASS**, `npm run lint` (`tsc --noEmit` со `"strict": true`) **0 ошибок**, `npm run build` (`vite build`) **PASS** без предупреждений `__dirname`.

---

## 1. Резюме изменений Phase 2.2

В рамках Phase 2.2 устранены ключевые архитектурные и инженерные риски, зафиксированные после Phase 2.1 (`v0.1.0`):

1. Введён отдельный доверенный иммутабельный контракт **`OperationRequest`** (`src/core/types.ts`, `src/core/operationRequest.ts`), отделённый от `VerificationClaim` и `ReflectionWitness`.
2. Генератор **L2** (`src/core/l2GeometryEngine.ts`) переведён на приём `OperationRequest`, строгую проверку соответствия `sourceState` запросу (`REQUEST_STATE_MISMATCH`) и исполнение только запрошенных параметров.
3. Независимый верификатор **L7** (`src/core/l7IndependentVerifier.ts`) усилен проверкой соответствия исходному `OperationRequest` (предикат `requestBound`), отбрасывая даже согласованную подмену `claim.parameters + witness.axis + resultingState` на другую ось или другое разбиение вершин.
4. Журнал **TRACE** и `verifyProcess` (`src/core/trace.ts`, `src/core/l7IndependentVerifier.ts`) защищены от `NaN`, `Infinity`, `-Infinity`, отрицательных/дробных `stepIndex`, повторного использования `operationRequestId` и разрыва непрерывности между шагами и запросами.
5. Включён `"strict": true` в `tsconfig.json`, исправлено ESM-определение корневого пути в `vite.config.ts` (без `__dirname`), обновлены стенд `VerificationWorkbench.tsx`, автотесты `tests/contract02.test.ts` и 4 разрешённых документа.

---

## 2. Детализация по задачам

### Task A — Контракт `OperationRequest` (`src/core/types.ts`, `src/core/operationRequest.ts`)
- Добавлен интерфейс `OperationRequest` со следующими полями:
  - `operationRequestId: string`
  - `operation: 'REFLECTION_ACROSS_LINE'`
  - `sourceStateId: string`
  - `sourceStateVersion: number`
  - `parameters: ReflectionParameters` (`line: { nx, ny, c }`, `movingVertexIds`, `fixedVertexIds`)
  - `movingVertexIds: readonly VertexId[]`
  - `fixedVertexIds: readonly VertexId[]`
  - `requestProvenance: string`
  - `timestamp?: string`
- Реализована фабрика `createOperationRequest` и функция защитного клонирования `cloneOperationRequest` с `deepFreeze`, валидацией идентификаторов/происхождения и явным выделением `OperationRequest` отдельно от `VerificationClaim` и `ReflectionWitness`.
- Расширен `VerificationPredicates` предикатом `requestBound: boolean`, а `ReflectionWitness` и `TraceEntry` — полем `operationRequestId` (и `request: OperationRequest` в `TraceEntry`).

### Task B — Привязка `L2` (`src/core/l2GeometryEngine.ts`)
- `ReflectAcrossLineInput` переведён на обязательный `request: OperationRequest` вместо свободных `line` и `movingVertexIds`.
- Добавлены коды ошибок `INVALID_OPERATION_REQUEST` и `REQUEST_STATE_MISMATCH` в `L2ErrorCode`.
- `reflectAcrossLine` проверяет метаданные запроса, точное соответствие `sourceState.stateId === request.sourceStateId` и `sourceState.version === request.sourceStateVersion`, согласованность разбиения `movingVertexIds` / `fixedVertexIds` и сохраняет исходную формулу нормальной проекции IEEE-754 без округления.
- В выпускаемый `ReflectionWitness` записывается `operationRequestId`, а в `TraceEntry` — глубоко замороженный снимок `request`.

### Task C — Верификация `L7` относительно `OperationRequest` (`src/core/l7IndependentVerifier.ts`)
- Обновлены сигнатуры:
  - `verifyResult(claim, request, toleranceOverrides?)`
  - `verifyProcess(trace, trustedRequests, toleranceOverrides?)`
- Сохранена строгая архитектурная изоляция `L7`: в `src/core/l7IndependentVerifier.ts` разрешены только `import type ... from './types'` (нулевой рантайм-импорт из `l2GeometryEngine.ts`, `trace.ts`, `operationRequest.ts`; нет повторного 3×3 решателя).
- **Stage A:** проверяет конечность чисел IEEE-754 и невырожденность нормали `||n|| > zeroNormalEpsilon` не только в `claim`/`witness`/состояниях, но и в `request` (`UNDETERMINED` при нарушении).
- **Stage B (`requestBound` + `witnessBound`):** проверяет наличие доверенного `request`, `operationRequestId`, `requestProvenance`, `operation`, `sourceStateId/Version`, точное совпадение коэффициентов прямой и дизъюнктных множеств `movingVertexIds`/`fixedVertexIds` между `request`, `claim` и `witness`.
- **Stage C:** оценивает масштаб-инвариантные аксиомы $r_{\text{mid}}$ и $r_{\text{perp}}$ (относительно масштабирования коэффициентов уравнения прямой $(n_x, n_y, c) \mapsto \alpha\,(n_x, n_y, c)$) против **обоих** наборов параметров — `request.parameters.line` и `claim.parameters.line`. Благодаря этому согласованная подмена оси в `claim + witness + resultingState` при неизменном `OperationRequest` гарантированно даёт `status: 'FAIL'`, `requestBound: false` и `axiomsSatisfied: false`.

### Task D — Усиление `TRACE` (`src/core/trace.ts`, `src/core/l7IndependentVerifier.ts`)
- `createTraceEntry` требует и глубоко замораживает `request: OperationRequest`, фиксирует `operationRequestId` и проверяемые состояния/свидетельства.
- `verifyProcess` проверяет:
  - соответствие `trace.length === trustedRequests.length` и структурное равенство `entry.request` и `trustedRequests[i]`;
  - отсутствие повторного использования `operationRequestId` между шагами (`TRACE_DUPLICATE_REQUEST_ID`);
  - валидность каждого `stepIndex`: `typeof entry.stepIndex === 'number' && Number.isFinite(entry.stepIndex) && Number.isInteger(entry.stepIndex) && entry.stepIndex >= 0`;
  - строгую монотонность `entry.stepIndex > prev.stepIndex`;
  - последовательную согласованность операций, версий и состояний (`prev.resultingState` ↔ `entry.sourceState` ↔ `trustedRequests[i].sourceStateId/Version`).

### Task E — Качество типов и сборки (`tsconfig.json`, `vite.config.ts`)
- В `tsconfig.json` включён `"strict": true`; все модули `src/` и `tests/` проходят `tsc --noEmit` без ослабления конфигурации.
- В `vite.config.ts` `__dirname` заменён на ESM-совместимый путь через `fileURLToPath(new URL('.', import.meta.url))`; предупреждение Vite 8 `configLoader: 'native'` о `__dirname` полностью устранено.
- Интерактивный стенд `src/components/VerificationWorkbench.tsx` переведён на `createOperationRequest` и новые сигнатуры `reflectAcrossLine`, `verifyResult`, `verifyProcess`.

### Task F — Тесты (`tests/contract02.test.ts`)
- Все 13 исходных тестов Contract 02 сохранены и переведены на `OperationRequest` без ослабления утверждений.
- Добавлены 6 новых тестовых блоков (`13`–`18`), доводящие покрытие до **19/19** тестов:
  - **Тест 13:** обязательная проверка согласованной подмены оси B в `claim.parameters` + `witness.axis` + `resultingState` при неизменном `OperationRequest` (ось A) → `FAIL`, `requestBound = false`, `axiomsSatisfied = false` в `verifyResult` и `verifyProcess`.
  - **Тест 14:** подмена `operationRequestId`, `sourceStateId/Version`, `operation`, а также согласованная подмена разбиения `movingVertexIds`/`fixedVertexIds` → ошибки L2 и `FAIL` в L7.
  - **Тест 15:** отсутствие `OperationRequest` в L2/L7 и повторное использование `OperationRequest` на несовместимом `sourceState` → ошибки/отказ `FAIL`.
  - **Тест 16:** несогласованность `TraceEntry.request` с доверенной последовательностью `trustedRequests` → `FAIL`.
  - **Тест 17:** отклонение `stepIndex` со значениями `NaN`, `Infinity`, `-Infinity`, `-1`, `1.5`, немонотонных `stepIndex`, а также проверка, что корректный `stepIndex` не маскирует разрыв `sourceState`.
  - **Тест 18:** валидные многошаговые последовательности (`S₀ → S₁ → S₂`) и инволюция (двойное отражение относительно одной оси) → `PASS`.

---

## 3. Результаты запуска проверок

Выполнено после завершения всех правок кода и тестов:

- **`npm test` (`tsx --test tests/*.test.ts`):**
  - `# tests 19`
  - `# pass 19`
  - `# fail 0`
- **`npm run lint` (`tsc --noEmit`):**
  - код возврата `0`, 0 ошибок TypeScript в режиме `"strict": true`.
- **`npm run build` (`vite build`):**
  - код возврата `0`, сборка в `dist/` завершена успешно (`vite v8.3.8`, `dist/assets/index-QUwyWl3L.js 562.64 kB`), предупреждений `__dirname` нет.

---

## 4. Обновлённая документация и границы

- Актуализированы только 4 разрешённых документа: `docs/ARCHITECTURE.md`, `docs/FIRST_PROTOTYPE_SPEC.md`, `docs/DEVELOPMENT_ROADMAP.md`, `README.md` (включая уточнение, что инвариантность $r_{\text{mid}}$ и $r_{\text{perp}}$ относится к масштабированию коэффициентов уравнения прямой $(n_x, n_y, c) \mapsto \alpha\,(n_x, n_y, c)$).
- Исторические отчёты и аудиты в корне репозитория (`ACCEPTANCE_AUDIT_V1.md`, `PHASE_2_IMPLEMENTATION_REPORT.md`, `PHASE_2_1_IMPLEMENTATION_REPORT.md`, `RESEARCH_INTEGRATION_V1.md`, `RELEASE_READINESS_AUDIT_V1.md`, `RELEASE_PREPARATION_TASK_A_REPORT.md`, `RELEASE_PREPARATION_TASK_B_REPORT.md`) не изменялись.
- Вне рамок Phase 2.2 по-прежнему остаются: слой `L1` (`FACE_SUBDIVISION`), `L3–L6`, `CAPABILITY_GAP`, криптографическая канонизация/подпись `OperationRequest` и `TRACE` (JCS + SHA-256), а также точная/интервальная арифметика вместо IEEE-754 `f64`.

---

## 5. Итоговый вердикт

**ACCEPTED** — все задачи Phase 2.2 (Task A–F, документация и отчётность) реализованы в полном объёме, изоляция `L7` и точность IEEE-754 сохранены, все 19 автотестов, строгая проверка TypeScript и сборка Vite проходят без ошибок.
