# Phase 2.3.3 Specification-Based Reimplementation Spec (`PHASE_2_3_3_REIMPLEMENTATION_SPEC.md`)

**Версия контракта:** Draft v1.2 (Audit Findings Corrected) `[P]`.  
**Статус документа:** Спецификация приведена в соответствие со всеми замечаниями `PHASE_2_3_3_PRE_IMPLEMENTATION_AUDIT.md` (`AUD-A01..F01`). Код (`src/*`, `tests/*`) **не изменён** `[E]`; реализация ожидает принятия `ROD-01`/`ROD-02` и отдельного разрешения владельца (`ROD-03`).  
**Происхождение:** Самостоятельная спецификация на базе `src/core/*`, `tests/*`, `PHASE_2_3_3_PROPERTY_F_SPECIFICATION.md` и `PHASE_2_3_3_PROPERTY_F_VALIDATION.md`. Материалы недоступной внешней ветки `candidate/phase-2-3-3-rework` используются только как вторичное свидетельство `[D]`.

---

## 1. Принципы и границы архитектуры `Property F Test Layer v1`

1. **Эпистемическое разделение ролей:**
   - `L2` (`src/core/l2GeometryEngine.ts`) — выполняет геометрическую операцию.
   - `L7` (`src/core/l7IndependentVerifier.ts`) — проверяет результат согласно действующему контракту ядра.
   - `Property F Test Layer v1` — исследует свойство ориентации по собственному **шестиуровневому классификатору**.
   - `Mutation Testing` — проверяет способность тестового слоя обнаруживать внесённые дефекты.
2. **Программная изоляция от `src/core/*`:**
   - Модуль тестового классификатора не импортирует внутренние функции `L7` (`computeSignedArea`, `resolveTolerances` и др.) и не разделяет helper-код с `L2`/`L7` `[P]`.
   - Взаимодействие с ядром — **строго через публичные контракты**: `reflectVertices`, `buildReflectionOperationRequest`, `verifyResult` / `verifyProcess` и типы `src/core/types.ts` `[S][P]`.
3. **Честная граница независимости оракула:**
   - Тестовый оракул имеет **архитектурную (программную)**, а не математическую независимость: он использует ту же плоскую модель ориентированной площади Гаусса (Shoelace), что и `L7` `[M]`. Внешний эталон (Ori Studio) остаётся вне Phase 2.3.3 `[P]`.
4. **Неизменность ядра и базовых тестов (SHA-256 Freeze):**
   - `src/core/*` не изменяется (`D-1`–`D-8` остаются неисправленными в 2.3.3) `[E]`.
   - Все **36** существующих тестов (`19` в `tests/contract02.test.ts` + `17` в `tests/metamorphic.test.ts`) остаются **побайтово неизменными** (`OD-03`) `[E][P]`.
   - Новый слой планируется в отдельном файле `tests/propertyF_v1.test.ts` (`package.json:13`: `"tsx --test tests/*.test.ts"` `[S]`).

---

## 2. Шестиуровневая архитектура классификатора (`Level 0 — Level 5`)

Система состоит из **шести строго последовательных уровней (`Level 0`–`Level 5`)** (ациклический DAG).  
**Архитектурный инвариант:** каждый уровень выдаёт собственный типизированный результат; **последующий уровень не имеет права заново переинтерпретировать предыдущий по косвенным признакам** `[P]`.

```text
[Level 0: Input Integrity Guard]       ──(0A graph / 0B face rejection)──► InputIntegrityError
        │  (VerifiedFaceInput)
        ▼
[Level 1: PartitionClass]              ──► 'ALL_MOVING' | 'ALL_FIXED' | 'MIXED'
        │
        ▼
[Level 2: GeometryDegeneracy]          ──► 'NON_DEGENERATE' | 'DEGENERATE'  (строго по S_0!)
        │
        ▼
[Level 3: FaceGeometricObservation]    ──► A0, A1, |A1+A0|, ||A1|-|A0||, |A1-A0|, maxDisp, collapse
        │
        ▼
[Level 4: PropertyApplicability]       ──► Applicable / Not Applicable (по таблице приоритетов)
        │
        ▼
[Level 5: PropertyOutcome]             ──► 6 взаимоисключающих исходов
```

### Уровень 0: `Input Integrity Guard` (разделение граф-уровня `0A` и грань-уровня `0B`, `AUD-A01`, `AUD-C01`)
- **Вход:** `face: Face2D`, `source: GeometryState`, `result: GeometryState`, `movingIds: ReadonlySet<VertexId>`, `fixedIds: ReadonlySet<VertexId>` (плюс опциональные исходные массивы разбиения для проверки дублей).
- **Выход:** `VerifiedFaceInput` (валидированные пары `(vertexId, p0, p1, role: 'MOVING' | 'FIXED')` канонической грани) либо отказ `InputIntegrityError` с кодом ошибки.
- **Ответственность (два явных подуровня):**
  - **0A — Целостность граф-уровня (`GeometryState` и разбиение):**
    1. Уникальность ID вершин внутри `source.vertices` и `result.vertices` (иначе `DUPLICATE_STATE_VERTEX_ID`).
    2. Непересечение разбиения: `movingIds ∩ fixedIds = ∅` (иначе `PARTITION_OVERLAP_VIOLATION`).
    3. Полное покрытие вершин состояния разбиением и соответствие множеств вершин `source.vertices` и `result.vertices` (если вершина из `source` отсутствует в `result`, или не входит в `movingIds ∪ fixedIds` $\to$ `MISSING_RESULT_VERTEX` / `PARTITION_COVERAGE_HOLE`).
  - **0B — Целостность грань-уровня (`face.vertexIds`):**
    1. Непустота грани: `face.vertexIds.length > 0` (`OD-01D`, иначе `EMPTY_FACE_VERTICES`).
    2. Присутствие каждого `vid ∈ face.vertexIds` в `source.vertices`, `result.vertices` и ровно одном из `movingIds ⊕ fixedIds` (иначе `UNKNOWN_VERTEX_ID` / `MISSING_RESULT_VERTEX` / `UNMAPPED_FACE_VERTEX`).
    3. **Локальное предусловие `Property F v1` (`OD-01C`, `AUD-C01`):** отсутствие внутренних повторений `['A','A','B']`, `['A','B','B','C']` (`DUPLICATE_VERTEX_ID_INTERNAL`) и повторения первой вершины в конце `['A','B','C','A']` (`DUPLICATE_CLOSING_VERTEX_ID`).  
       *Важная контрактная оговорка (`AUD-C01`):* действующий формат `Face2D` (`src/core/types.ts:29-32`) и `L2`/`L7` не запрещают `['A','B','C','A']`. Данный запрет является **локальной строгой политикой Level 0 слоя `Property F v1`**, а не утверждением о нарушении формата `GeometryState`. Стандартизация `Face2D.vertexIds` остаётся открытым вопросом для **Contract 02 v3 / Phase 2.4**.
- **Запрещённые зависимости:** Не читает координаты (`x, y`), не вычисляет площади и не маскирует структурный отказ под исход Level 5 (`DEGENERATE_NOT_EVALUATED`).

### Уровень 1: `PartitionClass` (Комбинаторная классификация разбиения)
- **Вход:** Только `roles` из `VerifiedFaceInput` (выход Level 0).
- **Выход:** `type PartitionClass = 'ALL_MOVING' | 'ALL_FIXED' | 'MIXED'`.
- **Ответственность:** Все `'MOVING'` $\to$ `'ALL_MOVING'`; все `'FIXED'` $\to$ `'ALL_FIXED'`; иначе $\to$ `'MIXED'`.
- **Запрещённые зависимости:** Запрещено читать координаты `p0`, `p1` и оценивать смещения (`hypot(p1 - p0) > eps`), чтобы движущаяся вершина на оси отражения (`disp = 0`) в смешанной грани не исказила класс `MIXED` `[M]`.

### Уровень 2: `GeometryDegeneracy` (Геометрическая вырожденность строго по $S_0$)
- **Вход:** Только исходные координаты `pts0: Point2D[]` (из `VerifiedFaceInput`) и `degenerateAreaEpsilon = 1e-12` (`[S]`).
- **Выход:**
  ```ts
  interface GeometryDegeneracy {
    status: 'NON_DEGENERATE' | 'DEGENERATE';
    vertexCount: number;
    signedArea0: number;
    absArea0: number;
    thresholdUsed: number; // 1e-12
    reason: 'OK' | 'FEWER_THAN_3_VERTICES' | 'AREA_LEQ_THRESHOLD';
  }
  ```
- **Ответственность:** Расчёт `signedArea0 = centeredSignedArea(pts0)`; классификация `pts0.length < 3 || |A_0| <= thresholdUsed` $\implies$ `'DEGENERATE'`, иначе `'NON_DEGENERATE'`.
- **Запрещённые зависимости:** Запрещено обращаться к результирующему состоянию $S_1$ (`result`) и к `PartitionClass`. Коллапс площади после отражения никогда не переводит $S_0$ в `'DEGENERATE'`.

### Уровень 3: `FaceGeometricObservation` (Чистые геометрические измерения $S_0 \to S_1$, `AUD-A02`, `AUD-A03`)
- **Вход:** `pts0: Point2D[]`, `pts1: Point2D[]`, результат Level 2 `degeneracy: GeometryDegeneracy` (передаёт `signedArea0`, `status` и `thresholdUsed` без повторной ревизии вырожденности), допуски $\tau_{\text{coord}} = 10^{-12}$, $\tau_{\text{area}}(A_0) = 10^{-12}\cdot\max(1, |A_0|)$.
- **Выход:**
  ```ts
  interface FaceGeometricObservation {
    signedArea0: number;              // из Level 2
    signedArea1: number;              // centeredSignedArea(pts1)
    absArea0: number;
    absArea1: number;
    signedSumError: number;           // |A1 + A0|
    absAreaDiff: number;              // ||A1| - |A0||
    fixedAreaDiff: number;            // |A1 - A0| — ТОЛЬКО диагностическая метрика, НЕ влияет на ALL_FIXED!
    maxFixedVertexDistance: number;   // max_i ||p1_i - p0_i||_2 (евклидова норма)
    postReflectionCollapse: boolean;  // (degeneracy.status === 'NON_DEGENERATE') && (absArea1 <= degeneracy.thresholdUsed)
    orientationSignInverted: boolean; // sign(A0) !== 0 && sign(A1) === -sign(A0)
    withinOracleReflectionTol: boolean; // signedSumError <= τ_area(A0) && absAreaDiff <= τ_area(A0)
    withinOracleFixedCoordTol: boolean; // maxFixedVertexDistance <= τ_coord (БЕЗ проверки площади!)
  }
  ```
- **Ответственность и критическая правка (`AUD-A02`, `AUD-A03`):**
  1. Неизменность `ALL_FIXED` (`withinOracleFixedCoordTol`) оценивается **строго покоординатно по евклидовой норме**:
     $$\max_i \|p_i^{S_1} - p_i^{S_0}\|_2 = \max_i \sqrt{(x_{1,i}-x_{0,i})^2 + (y_{1,i}-y_{0,i})^2} \le \tau_{\text{coord}} = 10^{-12}.$$
     Поле `fixedAreaDiff` остаётся только справочной диагностической метрикой и **исключено** из критерия `FIXED_UNCHANGED` / `FIXED_CHANGED`.
  2. `postReflectionCollapse` не вводит зашитую константу `1e-12`, а опирается непосредственно на `degeneracy.status === 'NON_DEGENERATE'` и `degeneracy.thresholdUsed` из Level 2.
- **Запрещённые зависимости:** Не пересматривает решения Level 1/Level 2, не выбирает применимость свойства, не использует helper-код `L7`.

### Уровень 4: `PropertyApplicability` (Применимость свойства по таблице приоритетов)
- **Вход:** Только `PartitionClass` (Level 1) и `GeometryDegeneracy.status` (Level 2).
- **Выход:**
  ```ts
  type PropertyApplicability =
    | { kind: 'NOT_APPLICABLE_MIXED'; reason: 'MIXED_PARTITION' }
    | { kind: 'APPLICABLE_FIXED_INVARIANCE'; sourceDegenerate: boolean }
    | { kind: 'NOT_APPLICABLE_DEGENERATE'; reason: 'ALL_MOVING_DEGENERATE_IN_S0' }
    | { kind: 'APPLICABLE_ORIENTATION_REVERSAL' };
  ```
- **Ответственность:** Реализует строгий приоритет: `MIXED` $\to$ `ALL_FIXED` $\to$ `ALL_MOVING + DEGENERATE` $\to$ `ALL_MOVING + NON_DEGENERATE`.
- **Запрещённые зависимости:** Не читает сырые координаты `pts0`/`pts1` и не пересчитывает `FaceGeometricObservation`.

### Уровень 5: `PropertyOutcome` (Итоговый вердикт классификатора)
- **Вход:** Только `PropertyApplicability` (Level 4) и `FaceGeometricObservation` (Level 3).
- **Выход:** Один из шести взаимоисключающих статусов:
  `HOLDS | VIOLATION | FIXED_UNCHANGED | FIXED_CHANGED | MIXED_NOT_APPLICABLE | DEGENERATE_NOT_EVALUATED`.
- **Ответственность:**
  - `NOT_APPLICABLE_MIXED` $\implies$ `'MIXED_NOT_APPLICABLE'`;
  - `NOT_APPLICABLE_DEGENERATE` $\implies$ `'DEGENERATE_NOT_EVALUATED'`;
  - `APPLICABLE_FIXED_INVARIANCE` $\implies$ `obs.withinOracleFixedCoordTol ? 'FIXED_UNCHANGED' : 'FIXED_CHANGED'`;
  - `APPLICABLE_ORIENTATION_REVERSAL` $\implies$ `obs.withinOracleReflectionTol ? 'HOLDS' : 'VIOLATION'`.
- **Запрещённые зависимости:** Не читает `face`, `source`, `result`, `movingIds`, `fixedIds` напрямую; не вызывает `L2` или `L7`.

---

## 3. Окончательная таблица приоритетов (9 граничных комбинаций)

| # | Комбинация / Краевой случай | Итоговое правило `Property F Test Layer v1` | Слой | Соответствие `L7` `[S]` и статус контракта |
| :- | :--- | :--- | :--- | :--- |
| **1** | **`MIXED` + `DEGENERATE`** | **`MIXED_NOT_APPLICABLE`** (`OD-01A`) | Level 4 | Совпадает с `L7:854-859` |
| **2** | **`ALL_FIXED` + `DEGENERATE`** (`AUD-A02`) | **`FIXED_UNCHANGED`** если $\max_i \|p_{1,i}-p_{0,i}\|_2 \le 10^{-12}$, иначе **`FIXED_CHANGED`** *(площадь не участвует; отсутствие вершины отсечено на Level 0)* | Level 4 $\to$ Level 5 | Совпадает с `L7 Stage B:738-754` (проверка координат) и `Stage D:895` |
| **3** | **`ALL_MOVING` + `DEGENERATE`** ($\|A_0\| \le 10^{-12}$ или $k \in \{1, 2\}$) | **`DEGENERATE_NOT_EVALUATED`** (строго по $S_0$) | Level 2 $\to$ Level 5 | Совпадает с `L7:896` (`UNDETERMINED`, если нет валидных moving-граней) |
| **4** | **Некорректные `vertexIds` / потеря вершины в `result` (`AUD-A01`, `AUD-B01`)** | **Отказ Level 0** (`0A` или `0B`: `UNKNOWN_VERTEX_ID`, `MISSING_RESULT_VERTEX`, `PARTITION_OVERLAP_VIOLATION`) | Level 0 | Совпадает с `L7:567-591, 656-677` (`FAIL`: `idsPreserved=false`) |
| **5** | **Повторяющиеся `vertexIds` внутри грани (`AUD-C01`)** | **Отказ Level 0B** (`OD-01C` — **локальная политика тестового слоя**, включая `['A','B','C','A']`) | Level 0B | Отличается от `L7:560-591` (не проверяет дубли в `face.vertexIds`). Стандартизация `Face2D` — **открытый вопрос Contract 02 v3 / Phase 2.4**. |
| **6** | **Пустые вершины грани (`vertexIds = []`)** | **Отказ Level 0B** (`EMPTY_FACE_VERTICES`, `OD-01D`) | Level 0B | Отличается от `L7:852` (`continue;`). Документируется в `PF1-NEG-12`. |
| **7** | **Пост-отражательный коллапс** ($\|A_0\| > 10^{-12}$, $\|A_1\| \le 10^{-12}$) | **`VIOLATION`** (`Level 2` = `NON_DEGENERATE` по $S_0$; `Level 3` `postReflectionCollapse=true`) | Level 2 $\to$ Level 5 | Совпадает с `L7:899-907` (`FAIL`) |
| **8** | **Вершина на оси** ($n\cdot p = c$, `moving`) | При $\|A_0\| > 10^{-12}$ $\implies$ **`HOLDS`**; если **все** вершины на оси $\implies$ **`DEGENERATE_NOT_EVALUATED`** | Level 2 $\to$ Level 5 | Совпадает с `L2` + `L7` |
| **9** | **Вершина вблизи оси** (`dist = 1e-9`) | Без snapping; при $\|A_0\| > 10^{-12}$ $\implies$ **`HOLDS`** (иначе `DEGENERATE` по `D-2`) | Level 2 $\to$ Level 5 | Совпадает с `L2` + `L7` |

---

## 4. Политика допусков и область расхождения оракула и `L7` (`OD-02`, `AUD-D01`)

Необходимо строго различать **две независимые политики допусков**, которые **не являются** попытками измерить одинаковую чувствительность разными числами:

1. **Четыре независимые компоненты:**
   - **Линейный координатный / изометрический допуск:** $\tau_{\text{coord}} = 10^{-12}$ в оракуле (евклидова норма $\max_i \|p_{1,i}-p_{0,i}\|_2 \le 10^{-12}$ для `ALL_FIXED`, граница равенства `<=`) vs `L7.epsilon = 10^{-7}` (для `Stage B/C` и изометрии длин `Stage D`).
   - **Допуск площади:** в оракуле **относительно-абсолютный** $\tau_{\text{area}}(A_0) = 10^{-12}\cdot\max(1, |A_0|)$ (учитывает накопление численного шума `IEEE-754` на крупных гранях); в `L7` — **строго абсолютный** `areaEpsilon = 10^{-7}` (`l7IndependentVerifier.ts:48, 902, 919`).
   - **Критерий геометрической вырожденности:** абсолютный $\varepsilon_{\text{deg}} = 10^{-12}$ (`|A0| <= 1e-12`) в обоих контурах (`D-2` в Phase 2.3.3 не правится).
   - **Численный шум:** центрирование по `pts[0]` в тестовом оракуле подавляет ошибку сдвига вплоть до $10^9$ (пока $L \sim 1$), тогда как `L7` использует нецентрированную Shoelace (`D-1`).
2. **Область применимости полосы расхождения (границы малой и большой площади, `AUD-D01`):**
   - **Малая и единичная площадь ($0 < |A_0| \le 1$, вкл. порог $10^{-12}$):** $\tau_{\text{area}}(A_0) = 10^{-12} < 10^{-7}$. Ошибки в полосе $(10^{-12}, 10^{-7}]$ дают `VIOLATION` в оракуле и `PASS` в `L7` (`PF1-BND-04`).
   - **Умеренная площадь ($1 < |A_0| \le 10^5$):** $\tau_{\text{area}}(A_0) = 10^{-12}|A_0| \le 10^{-7}$. Оракул остаётся строже (или равен на границе $|A_0|=10^5$) `L7`; полоса расхождения сужается к $(10^{-12}|A_0|, 10^{-7}]$.
   - **Большая площадь ($|A_0| > 10^5$):** $\tau_{\text{area}}(A_0) = 10^{-12}|A_0| > 10^{-7}$ — **порядок строгости инвертируется**: абсолютный `L7.areaEpsilon = 10^{-7}` становится *строже* масштабируемого допуска оракула (напр., при $|A_0| = 10^6$ ошибка `5e-7` пройдёт `<= 1e-6` в оракуле, но упадёт в `L7`!). Полоса $(10^{-12}, 10^{-7}]$ в `PF1-BND-04` формулируется строго для домена $|A_0| \le 10^5$.

---

## 5. Разделение `D-4`/`D-5`, жизненный цикл Characterization Tests и отдельные исследования (`AUD-E01`)

### 5.1. Разделение `D-4` и `D-5`
- `PF1-NEG-03` (`{ epsilon: 10, areaEpsilon: 1e-7 }`) — **только изоляция `Stage D`** (`orientationInverted`), НЕ тестирует `D-4`.
- `PF1-CHAR-D4` (`{ epsilon: 1e-2 }` без `areaEpsilon` при ошибке площади `1e-4`) — **самостоятельный тест наследования в `resolveTolerances` (`D-4`)**.
- `PF1-CHAR-D5` (`100% MIXED`, `100% FIXED`, `0` граней) — **самостоятельный тест вакуумного `PASS` (`D-5`)**.

### 5.2. Characterization Tests (`D-1`, `D-2`, `D-4`, `D-5`) и триггеры миграции (`AUD-E01`)
Characterization Tests фиксируют текущее поведение `L7` с пометкой `[Characterization: D-X — known issue until Phase 2.4]`, **не закрепляя дефект как норму**:

| ID / Дефект | Текущее наблюдаемое поведение (`2.3.3`) | Ожидаемое поведение после исправления (`2.4`) | Конкретный `assert`-триггер падения | Порядок перевода в `Regression` |
| :- | :--- | :--- | :--- | :--- |
| **`PF1-CHAR-D1`** (`D-1`) | Оракул (`centered`): **`HOLDS`**; `L7`: **`FAIL`** (`1e8`) и **`UNDETERMINED`** (`1e9`) | `L7`: **`PASS`** (`areaPreserved=true`, `orientationInverted=true`) | Падение `assert.equal(v8.status, 'FAIL')` и `assert.equal(v9.status, 'UNDETERMINED')`, когда `L7` начнёт возвращать `'PASS'` | Заменить ожидание `'FAIL'`/`'UNDETERMINED'` на `'PASS'` + `orientationInverted=true`; сменить тег на `[Regression: D-1]` |
| **`PF1-CHAR-D2`** (`D-2`) | Два явных assert: (1) `L7.status === 'UNDETERMINED'` на треугольнике `1e-6` (`\|A0\|=5e-13`); (2) `oracle.outcome === 'DEGENERATE_NOT_EVALUATED'` при абсолютном пороге `1e-12` | После внедрения масштабного порога (`c·L²`) и в `L7`, и в Level 2 оракула: `L7` $\to$ **`PASS`**, оракул $\to$ **`HOLDS`** | Падение `assert.equal(verdict.status, 'UNDETERMINED')` при обновлении `L7` в 2.4 (сигнализирует о необходимости синхронно обновить порог Level 2) | Синхронизировать формулу вырожденности Level 2 с `L7`, переключить оба assert на `'PASS'` / `'HOLDS'`, перенести в `[Regression: D-2]` |
| **`PF1-CHAR-D4`** (`D-4`) | `verifyResult(..., { epsilon: 1e-2 })` при ошибке площади `1e-4` возвращает **`PASS`** | Возвращает **`FAIL`** (`areaPreserved=false`), т.к. `areaEpsilon` остаётся `1e-7` | Падение `assert.equal(verdict.status, 'PASS')` и `assert.equal(verdict.predicates.areaPreserved, true)` | Переключить на `'FAIL'` + `areaPreserved === false`, добавить проверку `{ areaEpsilon: 1e-2 }`, тег `[Regression: D-4]` |
| **`PF1-CHAR-D5`** (`D-5`) | На `100% MIXED` / `100% FIXED` / `0` граней: оракул даёт `MIXED_NOT_APPLICABLE` / `FIXED_UNCHANGED`; `L7` проверяется тремя конкретными assert: `verdict.status === 'PASS'`, `verdict.predicates.orientationInverted === true`, и `!verdict.diagnostics.some(d => /NOT_APPLICABLE|NO_MOVING_FACE|VACUOUS/i.test(d))` | `L7` добавляет явную диагностику неприменимости в `verdict.diagnostics` (и/или отдельный статус предиката в Contract v3) | Гарантированное падение проверки отсутствия маркера неприменимости в `verdict.diagnostics` (или смены `orientationInverted`) | Обновить assert под новую диагностику `verdict.diagnostics` (и предикат v3), перевести в `[Regression: D-5]` |

### 5.3. Отдельный перечень технических исследований вне набора `Property F` (`AUD-E01`)
Дефекты **`D-3`** (переполнение `normSq = Infinity` с вводящим в заблуждение сообщением `<= 1e-12` в `src/core/l2GeometryEngine.ts:75-87`) и **`D-8`** (расхождение размера JS-бандла `562.64` vs `335.25 kB`) **явно исключаются** из набора Property F Characterization Tests и относятся к:
- **`D-3`:** контуру unit/contract-тестов нормали `L2` (`tests/contract02.test.ts` / Phase 2.4);
- **`D-8`:** изолированной диагностике сборки Vite (`Phase 2.4` / build audit).

---

## 6. Протокол сохранения базовой версии (`SHA-256`)

| Файл | Зафиксированный SHA-256 `[E]` | Требование ПОСЛЕ будущей реализации |
| :--- | :--- | :--- |
| `src/core/l2GeometryEngine.ts` | `0a06323947a436d85d6983c95849dd3e5a90d403e912a6f8eced7f511906abd4` | Идентичен |
| `src/core/l7IndependentVerifier.ts` | `fad116688fec4c084203fb863aaa2b55be958ed3b9391336cc971cbb098e7786` | Идентичен |
| `src/core/operationRequest.ts` | `9e5918ca7f58af33f438b8a37a2f266f62c927c17a315e6ea79b2ce4ef2472ca` | Идентичен |
| `src/core/trace.ts` | `edb8454a4ccccf6848a06f8e67309ad0543d2830569af41912cba93d981d37be` | Идентичен |
| `src/core/types.ts` | `438b7659f2318162ff96cbcc396bce753970a8aa4a33a8f45607d2475fa4680c` | Идентичен |
| `tests/contract02.test.ts` (`19` тестов) | `a474d079b07adbbd6ed60150770c86205399e7bc4e83705a29b9df7686a40672` | Идентичен |
| `tests/metamorphic.test.ts` (`17` тестов) | `284ba2c390e4e942c8755a831ff86586a9629066be1803859fa9daba68d587d8` | Идентичен (`tests/propertyF_v1.test.ts`) |
| `package.json` / `package-lock.json` | `9aec8b0a...d5f88` / `2efbc194...74c25` | Идентичны |

---

## 7. Критерий готовности к реализации (`Implementation Readiness Gate`)
Спецификация внутренне непротиворечива (`AUD-A01..F01` закрыты). Переход к написанию `tests/propertyF_v1.test.ts` и запуску 15 мутаций открывается только после принятия владельцем `ROD-01`, `ROD-02` и отдельного явного разрешения `ROD-03`.
