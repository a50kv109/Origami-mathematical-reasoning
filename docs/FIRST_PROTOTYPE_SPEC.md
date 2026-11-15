# First Prototype Specification — Спецификация реализованного прототипа (`Contract 02 v2: L2 ↔ L7`)

**Статус:** **Реализовано и верифицировано в OMR `v0.1.0` (Phase 2.1)** (`src/core/*`, `tests/contract02.test.ts` — 13/13 тестов PASS).  
**Цель прототипа:** подтвердить работу цикла **L2 (вычисление + `ReflectionWitness`) → TRACE (иммутабельный журнал) → L7 (Zero-Trust аксиоматическая проверка)** на 2D-операции `REFLECTION_ACROSS_LINE`.

> *Примечание о синхронизации:* ранние проектные черновики Stage 1 предполагали матрицу `R = 2uuᵀ - I`, встроенную операцию `FACE_SUBDIVISION`, допуски `1e-9`, пересчёт `p'_expected` на стороне L7 и вердикт `CAPABILITY_GAP`. В фактической реализации Phase 2.1 (`v0.1.0`) спецификация уточнена под парадигму **Certifying Algorithms**, описанную ниже.

---

## 1. Границы применимости (Scope `v0.1.0`)

- **Реализовано в прототипе:**
  - плоская 2D-геометрия нулевой толщины в `ℝ²` в двойной точности IEEE-754 без округления (`.toFixed()` запрещён);
  - произвольный предразбитый 2D-граф `GeometryState` (в эталоне — единичный квадрат `[0, 1] × [0, 1]` с двумя треугольными гранями `F0_A` и `F0_B`, а также наклонная ось `3x - 4y = 5` и масштабирование `10⁶`);
  - оператор **`REFLECTION_ACROSS_LINE`** с поддержкой полного или частичного отражения (`movingVertexIds` / `fixedVertexIds`);
  - выпуск свидетельства **`ReflectionWitness`** и иммутабельный журнал переходов **`TRACE`** (`src/core/trace.ts`);
  - аксиоматический верификатор **`L7`** в двух режимах: `verifyResult` (`RESULT_VERIFICATION`) и `verifyProcess` (`PROCESS_VERIFICATION`).
- **Не реализовано в `v0.1.0` (отложено на Phase 2.2 / Phase 3+):**
  - `FACE_SUBDIVISION` и `MATERIAL_CUT` (Contract 01 `L1 ↔ L2`, Phase 3) — исходная топология передаётся через `createInitialGeometryState`;
  - runtime-вердикт `CAPABILITY_GAP` (запланирован на следующие этапы);
  - 3D-координаты, двугранные углы, кинематика `γ(t)` (`L4`), порядок перекрытия слоёв (`L3`), криволинейные сгибы (`L5`), оптимизация (`L6`).

---

## 2. Математическая постановка `L2` (`src/core/l2GeometryEngine.ts`)

1. **Начальное состояние `S₀`:** в эталонном сценарии `square_reflection` создаётся единичный квадрат с вершинами `V0(0,0)`, `V1(1,0)`, `V2(1,1)`, `V3(0,1)`, диагональным ребром `ED(V3, V1)` и двумя треугольными гранями:
   - `F0_A = [V0, V1, V3]` (неподвижная, площадь `0.5`);
   - `F0_B = [V3, V2, V1]` (движущаяся вершина `V2`, площадь `0.5`).
2. **Задание оси отражения (`LineNormalParams`):** прямая задаётся общим уравнением $n_x x + n_y y = c$ без требования единичной длины нормали ($\|n\| > \varepsilon_{\text{zero}}$, где $\varepsilon_{\text{zero}} = 10^{-12}$).
3. **Формула ортогональной проекции (L2):** для каждой вершины $p$ из `movingVertexIds`:
   $$p' = p - 2 \frac{n \cdot p - c}{n \cdot n} n$$
   Для `x + y = 1` (`nx = 1, ny = 1, c = 1`) вершина `V2(1,1)` переходит в `(0,0)`.
4. **Выпуск свидетельства и записи `TRACE`:** `reflectAcrossLine` возвращает глубоко замороженные `resultingState`, `witness: ReflectionWitness` (содержащий `vertexPairs` и недоверенные диагностические `claimedResiduals`) и `traceEntry: TraceEntry`.

---

## 3. Протокол независимой аксиоматической проверки L7 (`src/core/l7IndependentVerifier.ts`)

Верификатор `L7` **не импортирует** функции из `L2` и `TRACE` и **не пересчитывает** образ $p'$ решателем. Вместо этого выполняются 4 строго упорядоченных этапа:

- **Stage A — Допустимость входа (`UNDETERMINED`):** проверка конечности (`Number.isFinite`) всех чисел IEEE-754 в оси, версиях состояний, координатах вершин и `witness.vertexPairs`, а также `||n|| > zeroNormalEpsilon` через `Math.hypot(nx, ny)`.
- **Stage B — Трёхсторонняя привязка свидетельства (`FAIL` при нарушении):**
  - соответствие `witness ↔ claim ↔ sourceState ↔ resultingState` по `stateId`, версиям (`targetStateVersion > sourceStateVersion`), `operationId` и параметрам оси;
  - строгое сохранение `VertexID`, `EdgeID`, `FaceID` и дизъюнктного разбиения `movingVertexIds` / `fixedVertexIds`;
  - биекция `witness.vertexPairs` на `movingVertexIds`;
  - неподвижность `fixedVertexIds` (`maxFixedDisplacement <= epsilon`);
  - **Zero-Trust:** поле `witness.claimedResiduals` полностью игнорируется.
- **Stage C — Масштаб-инвариантные аксиомы отражения (`axiomsSatisfied`):**
  $$r_{\text{mid}}(p, p') = \frac{|n \cdot (p + p') - 2c|}{2\|n\|} \le \varepsilon, \qquad r_{\text{perp}}(p, p') = \frac{|(p' - p) \times n|}{\|n\|} \le \varepsilon$$
  По точному геометрическому тождеству $\|p' - p'_{\text{exact}}\|_2 = \sqrt{4\,r_{\text{mid}}^2 + r_{\text{perp}}^2}$ выполнение обеих аксиом необходимо и достаточно для подтверждения отражения без повторного запуска алгоритма `L2`.
- **Stage D — Инварианты с учётом области действия (Scope-Aware):**
  - для чисто движущихся и чисто фиксированных рёбер и хорд граней: сохранение длин ($|\Delta L| \le \varepsilon$);
  - для чисто движущихся и чисто фиксированных граней: сохранение модуля площади по Гауссу ($||S'| - |S|| \le \varepsilon_{\text{area}}$);
  - для невырожденных чисто движущихся граней ($|S_0| > \varepsilon_{\text{degArea}}$): строгая инверсия знака ориентированной площади ($\operatorname{sign}(S_1) = -\operatorname{sign}(S_0)$);
  - смешанные (пограничные) элементы, разделённые между `moving` и `fixed`, намеренно исключаются из проверки жёсткости.

### Допуски по умолчанию (`DEFAULT_VERIFIER_TOLERANCES`)
- `epsilon`: `1e-7`
- `areaEpsilon`: `1e-7`
- `zeroNormalEpsilon`: `1e-12`
- `degenerateAreaEpsilon`: `1e-12`

Возвращаемые вердикты `VerificationVerdict.status`: **`PASS` | `FAIL` | `UNDETERMINED`**.

---

## 4. Тестовое покрытие прототипа (`tests/contract02.test.ts` и стенд `VerificationWorkbench.tsx`)

### Сценарии интерактивного стенда (`VerificationWorkbench.tsx`)
- **`T-01` (Эталон):** валидное отражение по пресетам `x + y = 1`, `3x − 4y = 5` или `10⁶·(x + y = 1)` → **`PASS`**.
- **`T-02` (Подмена + 0-отчёт):** искажение координаты цели и подделка `claimedResiduals = 0` → `L7` игнорирует `claimedResiduals` и выявляет нарушение аксиом/метрик → **`FAIL`**.
- **`T-03` (Сдвиг оси `c`):** рассогласование оси между `claim.parameters` и `witness` → `witnessBound = false` → **`FAIL`**.
- **`T-04` (Разрыв `TRACE`):** двухшаговый журнал с разрывом `trace[0].resultingState !== trace[1].sourceState` → `verifyProcess` возвращает **`FAIL`**, тогда как `verifyResult` на изолированном шаге 1 даёт `PASS`.
- **`DEG` (Вырожденная нормаль):** `||n|| = 0` → **`UNDETERMINED`**.

### Автоматические тесты (`npm test` — 13/13 PASS)
Помимо стендовых кейсов, `tests/contract02.test.ts` проверяет: отклонение смещения `1e-2`, подмену `sourceState`, подмену разбиения `movingVertexIds`/`fixedVertexIds`, инвариантность к масштабу `1e6`, частичное отражение подграфа, невырожденный `FAIL` рядом с вырожденной гранью (запрет маскировки реальных ошибок через `UNDETERMINED`), разрывы `stateId`/`version`, граничные значения `epsilon`, глубокую заморозку (`deepFreeze`) и статическую изоляцию `l7IndependentVerifier.ts` (отсутствие импортов из `L2`/`TRACE` и 3×3 матриц).
