# Phase 2.3 — Step 2 Implementation Report (`PHASE_2_3_STEP_2_REPORT.md`)

**Этап:** Phase 2.3.2 — Metamorphic Tests: Pairwise Distance Invariance & Fixed Points on Axis  
**Итоговый вердикт:** **`ACCEPTED`** *(в пределах протестированного умеренного числового домена)*  
**Статус:** **PASS (30/30 автотестов)**  
**Дата отчёта:** 2026-11-15  
**Затронутые файлы:** изменён только `tests/metamorphic.test.ts` (добавлены 6 новых тестов к 5 существующим тестам Step 1) и создан настоящий отчёт `PHASE_2_3_STEP_2_REPORT.md`. Файлы `src/core/*`, `tests/contract02.test.ts`, `package.json`, `package-lock.json` и исторические отчёты **не изменялись**; новые зависимости **не добавлялись**; глобальные допуски верификатора **не ослаблялись**.

---

## 1. Реализованные метаморфные свойства (`tests/metamorphic.test.ts`)

К существующим тестам Step 1 (Properties A, B, C + 2 негативных контроля) добавлены проверки свойств **D** и **E** и 2 новых негативных контроля:

### 1.1. Property D — Попарная инвариантность расстояний ($\|R_L(P_i) - R_L(P_j)\| = \|P_i - P_j\|$)

- **`Property D1 (Pairwise Distance Invariance — Full Reflection)`:**
  - Проверены две детерминированные многовершинные геометрии (`subdividedSquare`: 4 вершины, 5 рёбер, **6** неупорядоченных пар; `asymmetricPolygonMesh`: 5 вершин, 7 рёбер, **10** неупорядоченных пар) по **4 осям** отражения: $x+y=1$, $3x-4y=5$, $-2.5x+1.75y=-3.25$, $x=-1.5$.
  - В каждом прогоне проверяются **все неупорядоченные пары вершин** (включая несмежные хорды/диагонали, а не только рёбра графа: `totalUnorderedPairs > edges.length`), сохранение всех `VertexID`/`EdgeID`/`FaceID` и топологии (`assertTopologyPreserved`), а также `L7` (`verifyResult` → `PASS`, `lengthsPreserved === true`, `idsPreserved === true`).
- **`Property D2 (Pairwise Distance Invariance — Partial Reflection)`:**
  - Проверена 6-вершинная геометрия с двумя трёхвершинными подграфами: подвижным (`movingIds = ['D', 'E', 'G']`) и неподвижным (`fixedIds = ['A', 'B', 'C']`), соединёнными граничными рёбрами (`E_BD`, `E_CG`).
  - Независимо проверены все неупорядоченные пары внутри `movingIds` и внутри `fixedIds` (межмножественные граничные рёбра при частичном отражении допускают растяжение), а также `L7` (`verifyResult` → `PASS`, `lengthsPreserved === true`, `fixedVerticesUnchanged === true`).

### 1.2. Property E — Неподвижные точки на оси отражения ($P \in L \implies R_L(P) = P$)

- **`Property E1 (Fixed Points on Axis)`:**
  - Покрыты **4 сценария по 3 различным осям** ($x+y=1$, $3x-4y=5$, $2x+y=0$):
    1. Смешанная классификация на $x+y=1$ (`subdividedSquare`: две вершины на оси — `V3` передана в `movingVertexIds`, `V1` в `fixedVertexIds`; плюс подвижная `V2` и неподвижная `V0` вне оси).
    2. Несколько точных точек на наклонной оси $3x-4y=5$ (`A(3,1)`, `B(-1,-2)`, `C(7,4)`) в `movingVertexIds`, с подвижными точками `M1(0,2)`, `M2(5,-1)` вне оси.
    3. Те же три точки на оси $3x-4y=5$ в `fixedVertexIds`, при подвижных `M1`, `M2`.
    4. Одна точка на оси $2x+y=0$ (`Q0(1,-2)`) в `movingVertexIds` вместе с подвижным треугольником `Q1`, `Q2`, `Q3` вне оси.
  - Проверяется неизменность координат всех вершин на оси, точная классификация `fixedVertexIds` в `OperationRequest`, `witness` и `traceEntry.parameters`, сохранение `ID`/топологии, точное отражение вершин вне оси против независимого оракула `computeExpectedReflectionPoint`, а также `L7` (`verifyResult` → `PASS`, `requestBound === true`, `witnessBound === true`, `fixedVerticesUnchanged === true`, `idsPreserved === true`).
- **`Property E2 (No Implicit Axis Snapping)`:**
  - Вершина `P_NEAR(2, 1e-9)`, отстоящая от оси $y=0$ на $10^{-9}$ и переданная в `movingVertexIds`, отражается в $(2, -10^{-9})$ (погрешность $\le 10^{-15}$, фактическое смещение $> 1.5\cdot 10^{-9}$), а не «прилипает» к $y=0$ и не переводится неявно в неподвижные. `L7` возвращает `PASS`.

---

## 2. Численные допуски и область применимости

В тестах разграничены допуски сравнения координат, допуски сравнения расстояний и штатные допуски верификатора `L7`:

1. **Координатный метаморфный допуск (`METAMORPHIC_COORD_TOLERANCE`):** `1e-12` (евклидово отклонение `Math.hypot(dx, dy) <= 1e-12`, использован для проверки неизменности точек на оси и отражения точек вне оси).
2. **Допуск инвариантности расстояний (`METAMORPHIC_DISTANCE_REL_TOLERANCE`):** `1e-12`, масштабируемый по длине исходной хорды:
   $$\text{tol}(d_0) = 10^{-12} \cdot \max(1,\; d_0), \qquad d_0 = \|P_i - P_j\|_2.$$
   Это отдельный критерий от координатного допуска, устойчивый для малых и умеренных расстояний.
3. **Штатные допуски `L7` (`DEFAULT_VERIFIER_TOLERANCES`):** `epsilon = 1e-7`, `areaEpsilon = 1e-7`, `zeroNormalEpsilon = 1e-12`, `degenerateAreaEpsilon = 1e-12` (не изменялись).

**Граница применимости (Domain Caveat):**
Все проверки Step 2 выполнены в **умеренном детерминированном числовом домене** (координаты и коэффициенты прямой порядка $10^{-1} \dots 10^{1}$, за исключением пограничной проверки $10^{-9}$ в `E2`). Настоящий отчёт **не утверждает** прохождение тестов для экстремальных масштабов, субмикронной геометрии или границ `DEGENERATE_NORMAL` (домены `D3–D6` плана `PHASE_2_3_METAMORPHIC_TEST_PLAN.md` запланированы на следующие подэтапы).

---

## 3. Негативные контроли (Step 2)

1. **`Negative Control (Property D)`:**
   - После отражения `asymmetricPolygonMesh` относительно $3x-4y=5$ вершина `P3` в `resultingState` и `witness.vertexPairs` смещена на `+2e-3` по $x$, а `witness.claimedResiduals` подделаны в `{ maxMidpointError: 0, maxCollinearityError: 0 }`.
   - `assertSubsetPairwiseDistancesPreserved` бросает `Pairwise distance violation`, а `L7` (`verifyResult`) возвращает `status === 'FAIL'` с `predicates.axiomsSatisfied === false` и `predicates.lengthsPreserved === false`.
2. **`Negative Control (Property E)`:**
   - **Случай 1 (fixed vertex on axis):** вершина `V3` на оси $x+y=1$, классифицированная как `fixed`, смещена на `+1e-3` при подделанных `claimedResiduals = 0` → `L7` возвращает `FAIL` (`fixedVerticesUnchanged === false`).
   - **Случай 2 (moving vertex on axis):** вершина `V3` на оси $x+y=1$, переданная в `movingVertexIds`, смещена на `(+1e-3, +1e-3)` в `resultingState` и `witness.vertexPairs` при подделанных `claimedResiduals = 0` → `L7` возвращает `FAIL` (`axiomsSatisfied === false`).
   - **Случай 3 (huge forged claimedResiduals on valid geometry):** математически корректное отражение с подделанными `claimedResiduals = { maxMidpointError: 1e6, maxCollinearityError: 1e6 }` → `L7` всё равно возвращает `PASS` (`residuals.midpointError <= 1e-12`), подтверждая, что `L7` пересчитывает геометрические невязки самостоятельно и не доверяет полю `claimedResiduals` от `L2`.

---

## 4. Наблюдения по архитектуре ядра (`L2` / `L7`)

1. **Отсутствие неявного притягивания к оси (`Property E2`):** `L2` отражает любую вершину из `movingVertexIds` строго по формуле $P - 2\frac{n\cdot P - c}{\|n\|^2}n$ без неявного порога «прилипания» к прямой, поэтому вершина на расстоянии $10^{-9}$ корректно переносится на противоположную сторону оси.
2. **Семантика неподвижных вершин в `L7`:** для вершин из `fixedVertexIds` `L7` проверяет предикат неподвижности (`maxFixedDisplacement <= epsilon`), тогда как требование принадлежности вершины оси отражения проверяется через аксиомы отражения для вершин из `movingVertexIds` ($r_{\text{mid}}, r_{\text{perp}} \le \varepsilon$, которые для $P \in L$ автоматически требуют $P' = P$). Контракт не содержит отдельного предиката «все фиксированные вершины обязаны лежать на оси», что корректно отражает поддержку частичных отражений (`Property D2`, `contract02` тест №8).

---

## 5. Точные результаты проверки сборки и тестов

Все команды выполнены после финальной правки `tests/metamorphic.test.ts`:

- **`npm test` (`tsx --test tests/*.test.ts`):**
  - Выполнено: **`30` тестов** (`19` в `tests/contract02.test.ts` + `11` в `tests/metamorphic.test.ts`: 5 из Step 1 + 6 из Step 2).
  - Результат: `# tests 30` / `# pass 30` / `# fail 0` / `# cancelled 0` / `# skipped 0` (`duration_ms 697.251231`).
- **`npm run lint` (`tsc --noEmit` со `"strict": true`):**
  - Код возврата `0`, ошибок типизации нет.
- **`npm run build` (`vite build`):**
  - Код возврата `0`, `1666 modules transformed`, `✓ built in 711ms` (`dist/index.html 1.62 kB`, `dist/assets/index-rgXMFcwF.css 25.03 kB`, `dist/assets/index-QUwyWl3L.js 562.64 kB`).

---

## 6. Рекомендация для следующего шага

Перейти к **Phase 2.3.3**: реализовать проверки **Property F** (обращение знака ориентированной площади граней при полном отражении и контроль ориентации подмножеств при частичном отражении) и стресс-тесты числовых доменов **D3–D6** (крупные координаты, микрогеометрия, большие сдвиги и границы `DEGENERATE_NORMAL`) согласно `PHASE_2_3_METAMORPHIC_TEST_PLAN.md`.

---

## 7. Итоговый вердикт

**`ACCEPTED`** — требования **Phase 2.3.2** выполнены полностью в рамках неизменного ядра (`src/core/*` не модифицировалось), все 30/30 тестов, строгая проверка TypeScript (`tsc --noEmit`) и производственная сборка (`vite build`) проходят без ошибок в пределах протестированного умеренного числового домена.
