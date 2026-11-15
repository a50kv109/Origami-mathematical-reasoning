# First Prototype Specification — Спецификация реализованного прототипа (`Contract 02 v2: L2 ↔ L7`)

**Статус:** **Реализовано и усилено в Phase 2.2** (`src/core/*`, `tests/contract02.test.ts` — **19/19 тестов PASS**).  
**Цель прототипа:** подтвердить работу цикла **OperationRequest (доверенный запрос) → L2 (вычисление + `ReflectionWitness`) → TRACE (иммутабельный журнал) → L7 (Zero-Trust аксиоматическая проверка соответствия результату и исходному запросу)** на 2D-операции `REFLECTION_ACROSS_LINE`.

> *Примечание о синхронизации:* ранние проектные черновики Stage 1 предполагали матрицу `R = 2uuᵀ - I`, встроенную операцию `FACE_SUBDIVISION`, допуски `1e-9`, пересчёт `p'_expected` на стороне L7 и вердикт `CAPABILITY_GAP`. В фактической реализации Phase 2.1–2.2 спецификация уточнена под парадигму **Certifying Algorithms + Trusted OperationRequest**, описанную ниже.

---

## 1. Границы применимости (Scope)

- **Реализовано в прототипе:**
  - плоская 2D-геометрия нулевой толщины в `ℝ²` в двойной точности IEEE-754 без округления (`.toFixed()` запрещён);
  - произвольный предразбитый 2D-граф `GeometryState` (в эталоне — единичный квадрат `[0, 1] × [0, 1]` с двумя треугольными гранями `F0_A` и `F0_B`, наклонная ось `3x - 4y = 5` и масштабирование коэффициентов уравнения прямой `(nx, ny, c)` на `10⁶`);
  - отдельный доверенный иммутабельный запрос **`OperationRequest`** (`src/core/operationRequest.ts`);
  - оператор **`REFLECTION_ACROSS_LINE`** с поддержкой полного или частичного отражения (`movingVertexIds` / `fixedVertexIds`);
  - выпуск свидетельства **`ReflectionWitness`** и иммутабельный журнал переходов **`TRACE`** (`src/core/trace.ts`);
  - аксиоматический верификатор **`L7`** в двух режимах: `verifyResult(claim, request, overrides?)` (`RESULT_VERIFICATION`) и `verifyProcess(trace, trustedRequests, overrides?)` (`PROCESS_VERIFICATION`).
- **Не реализовано (отложено на Phase 3+):**
  - `FACE_SUBDIVISION` и `MATERIAL_CUT` (Contract 01 `L1 ↔ L2`, Phase 3) — исходная топология передаётся через `createInitialGeometryState`;
  - runtime-вердикт `CAPABILITY_GAP` (запланирован на следующие этапы);
  - криптографическая привязка `TRACE` (JCS + SHA-256);
  - 3D-координаты, двугранные углы, кинематика `γ(t)` (`L4`), порядок перекрытия слоёв (`L3`), криволинейные сгибы (`L5`), оптимизация (`L6`).

---

## 2. Математическая постановка `OperationRequest` и `L2` (`src/core/operationRequest.ts`, `src/core/l2GeometryEngine.ts`)

1. **Начальное состояние `S₀`:** в эталонном сценарии `square_reflection` создаётся единичный квадрат с вершинами `V0(0,0)`, `V1(1,0)`, `V2(1,1)`, `V3(0,1)`, диагональным ребром `ED(V3, V1)` и двумя треугольными гранями:
   - `F0_A = [V0, V1, V3]` (неподвижная, площадь `0.5`);
   - `F0_B = [V3, V2, V1]` (движущаяся вершина `V2`, площадь `0.5`).
2. **Доверенный запрос `OperationRequest`:** формируется вне `L2`, `VerificationClaim` и `ReflectionWitness` с помощью `createOperationRequest(...)` и глубоко замораживается (`deepFreeze`). Фиксирует `operationRequestId`, `operation`, `sourceStateId`, `sourceStateVersion`, канонические параметры оси и разбиения вершин, а также `requestProvenance`.
3. **Задание оси отражения (`LineNormalParams`):** прямая задаётся общим уравнением $n_x x + n_y y = c$ без требования единичной длины нормали ($\|n\| > \varepsilon_{\text{zero}}$, где $\varepsilon_{\text{zero}} = 10^{-12}$).
4. **Формула ортогональной проекции (L2):** `reflectAcrossLine({ request, sourceState, ... })` проверяет соответствие `sourceState` полям `request.sourceStateId/Version` (иначе выбрасывает `REQUEST_STATE_MISMATCH`), выполняет отражение строго по `request.parameters.line` и `request.movingVertexIds`:
   $$p' = p - 2 \frac{n \cdot p - c}{n \cdot n} n$$
   Для `x + y = 1` (`nx = 1, ny = 1, c = 1`) вершина `V2(1,1)` переходит в `(0,0)`.
5. **Выпуск свидетельства и записи `TRACE`:** `reflectAcrossLine` возвращает глубоко замороженные `resultingState`, `witness: ReflectionWitness` (привязанный к `operationRequestId` и содержащий `vertexPairs` и недоверенные диагностические `claimedResiduals`) и `traceEntry: TraceEntry` (со снимком `request`).

---

## 3. Протокол независимой аксиоматической проверки L7 (`src/core/l7IndependentVerifier.ts`)

Верификатор `L7` **не импортирует** рантайм-функции из `L2`, `TRACE` и `operationRequest` и **не пересчитывает** образ $p'$ решателем. Вместо этого выполняются 4 строго упорядоченных этапа:

- **Stage A — Допустимость входа (`UNDETERMINED`):** проверка конечности (`Number.isFinite`) всех чисел IEEE-754 в `request`, оси `claim`/`witness`, версиях состояний, координатах вершин и `witness.vertexPairs`, а также `||n|| > zeroNormalEpsilon` через `Math.hypot(nx, ny)`.
- **Stage B — Привязка к `OperationRequest` и трёхсторонняя привязка свидетельства (`FAIL` при нарушении):**
  - проверка `requestBound`: наличие и совпадение `operationRequestId`, `requestProvenance`, `operation`, `sourceStateId/Version`, канонических параметров оси и дизъюнктного разбиения `movingVertexIds`/`fixedVertexIds` между доверенным `request`, `claim` и `witness` (обнаруживает даже согласованную подмену `claim + witness + geometry` на другую ось или другое разбиение);
  - проверка `witnessBound`: соответствие `witness ↔ claim ↔ sourceState ↔ resultingState` по `stateId`, версиям (`targetStateVersion > sourceStateVersion`) и `operationId`;
  - строгое сохранение `VertexID`, `EdgeID`, `FaceID`;
  - биекция `witness.vertexPairs` на `movingVertexIds` и неподвижность `fixedVertexIds` (`maxFixedDisplacement <= epsilon`);
  - **Zero-Trust:** поле `witness.claimedResiduals` полностью игнорируется.
- **Stage C — Аксиомы отражения, инвариантные к масштабированию коэффициентов уравнения прямой (`axiomsSatisfied`):**
  $$r_{\text{mid}}(p, p') = \frac{|n \cdot (p + p') - 2c|}{2\|n\|} \le \varepsilon, \qquad r_{\text{perp}}(p, p') = \frac{|(p' - p) \times n|}{\|n\|} \le \varepsilon$$
  Аксиомы проверяются относительно **обоих** наборов параметров — доверенного `request.parameters.line` и `claim.parameters.line`. Нормировка на $\|n\|$ обеспечивает инвариантность именно к масштабированию коэффициентов уравнения прямой $(n_x, n_y, c) \mapsto \alpha\,(n_x, n_y, c)$. По точному тождеству $\|p' - p'_{\text{exact}}\|_2 = \sqrt{4\,r_{\text{mid}}^2 + r_{\text{perp}}^2}$ выполнение аксиом необходимо и достаточно для подтверждения отражения без повторного запуска алгоритма `L2`.
- **Stage D — Инварианты с учётом области действия (Scope-Aware):**
  - для чисто движущихся и чисто фиксированных рёбер и хорд граней: сохранение длин ($|\Delta L| \le \varepsilon$);
  - для чисто движущихся и чисто фиксированных граней: сохранение модуля площади по Гауссу ($||S'| - |S|| \le \varepsilon_{\text{area}}$);
  - для невырожденных чисто движущихся граней ($|S_0| > \varepsilon_{\text{degArea}}$): строгая инверсия знака ориентированной площади ($\operatorname{sign}(S_1) = -\operatorname{sign}(S_0)$);
  - смешанные (пограничные) элементы, разделённые между `moving` и `fixed`, намеренно исключаются из проверки жёсткости.
- **Усиленная проверка процесса `verifyProcess(trace, trustedRequests, overrides?)`:**
  - проверка точного соответствия `trace.length === trustedRequests.length` и структурной идентичности `entry.request` и `trustedRequests[i]`;
  - запрет повторного использования `operationRequestId` между шагами `TRACE`;
  - строгая проверка `typeof entry.stepIndex === 'number' && Number.isFinite(entry.stepIndex) && Number.isInteger(entry.stepIndex) && entry.stepIndex >= 0`, а также строгой монотонности `entry.stepIndex > prev.stepIndex` (отклоняет `NaN`, `Infinity`, `-Infinity`, отрицательные и дробные индексы);
  - проверка непрерывности состояний (`prev.resultingState` ↔ `entry.sourceState` ↔ `trustedRequests[i].sourceStateId/Version`) и монотонного роста версий.

### Допуски по умолчанию (`DEFAULT_VERIFIER_TOLERANCES`)
- `epsilon`: `1e-7`
- `areaEpsilon`: `1e-7`
- `zeroNormalEpsilon`: `1e-12`
- `degenerateAreaEpsilon`: `1e-12`

Возвращаемые вердикты `VerificationVerdict.status`: **`PASS` | `FAIL` | `UNDETERMINED`**.

---

## 4. Тестовое покрытие прототипа (`tests/contract02.test.ts` и стенд `VerificationWorkbench.tsx`)

### Сценарии интерактивного стенда (`VerificationWorkbench.tsx`)
- **`T-01` (Эталон):** валидное отражение по пресетам `x + y = 1`, `3x − 4y = 5` или `10⁶·(x + y = 1)` при доверенном `OperationRequest` → **`PASS`**.
- **`T-02` (Подмена + 0-отчёт):** искажение координаты цели и подделка `claimedResiduals = 0` → `L7` игнорирует `claimedResiduals` и выявляет нарушение аксиом/метрик → **`FAIL`**.
- **`T-03` (Сдвиг оси `c`):** рассогласование оси между `claim.parameters` и `request`/`witness` → `requestBound = false`, `witnessBound = false` → **`FAIL`**.
- **`T-04` (Разрыв `TRACE`):** двухшаговый журнал с разрывом `trace[0].resultingState !== trace[1].sourceState` → `verifyProcess` возвращает **`FAIL`**, тогда как `verifyResult(claim, req1)` на изолированном шаге 1 даёт `PASS`.
- **`DEG` (Вырожденная нормаль):** `||n|| = 0` → **`UNDETERMINED`**.

### Автоматические тесты (`npm test` — 19/19 PASS)
Помимо стендовых кейсов, `tests/contract02.test.ts` проверяет:
- согласованную подмену оси в `claim + witness + resultingState` при неизменном `OperationRequest` (`FAIL`, `requestBound = false`, `axiomsSatisfied = false`);
- подмену `operationRequestId`, `sourceStateId/Version`, `operation` и согласованную подмену разбиения `movingVertexIds`/`fixedVertexIds`;
- отсутствие `OperationRequest`, несовпадение `entry.request` с `trustedRequests` и повторное использование `OperationRequest` на несовместимом `sourceState`;
- отклонение `stepIndex` со значениями `NaN`, `Infinity`, `-Infinity`, `-1`, `1.5` и немонотонными индексами;
- валидные многошаговые последовательности и инволюцию (двойное отражение относительно одной оси);
- отклонение смещения `1e-2`, масштабирование коэффициентов уравнения прямой на `1e6`, частичное отражение подграфа, граничные значения `epsilon`, глубокую заморозку (`deepFreeze`) всех объектов включая `OperationRequest` и статическую изоляцию `l7IndependentVerifier.ts`.
