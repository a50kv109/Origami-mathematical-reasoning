# Phase 2.3.3 Full Test Matrix V2 (`PHASE_2_3_3_TEST_MATRIX_V2.md`)

**Версия матрицы:** v2.2 (Audit Findings Corrected) `[P]`.  
**Назначение:** Полная матрица тестов для **Варианта B (`Property F Test Layer v1`)** поверх **6-уровневой архитектуры (`Level 0–Level 5`)** по всем 8 категориям, с закрытием замечаний `AUD-A01..F01`, побайтовым сохранением **36** существующих тестов (`19 contract02 + 17 metamorphic`), разделением `D-4` и `D-5` и структурированным планом из 15 мутаций `[E][S][M][P]`.  
**Ограничение режима:** Код тестов и мутации **не запускались и не вносились** `[E]`.

---

## 0. Побайтово неприкосновенный регрессионный baseline (`36/36`, SHA-256 заморожен)

| Файл | Текущий SHA-256 `[E]` | Состав тестов | Режим сохранности (`OD-03`, `ROD-01`) |
| :--- | :--- | :--- | :--- |
| `tests/contract02.test.ts` | `a474d079b07adbbd6ed60150770c86205399e7bc4e83705a29b9df7686a40672` | `19` тестов (`C02-01..C02-19`) | **Побайтово неизменен (`0` правок)** |
| `tests/metamorphic.test.ts` | `284ba2c390e4e942c8755a831ff86586a9629066be1803859fa9daba68d587d8` | `13` (`A–E`) + `4` базовых `F` | **Побайтово неизменен (`0` правок)**; новый слой размещается в `tests/propertyF_v1.test.ts` (`package.json:13`) |

---

## 1. Категория 1 — Positive Controls (`PF1-POS-*`)

| ID | Input Geometry | Checked Level(s) & Expected Result | Detectable Defect | Specification Basis |
| :--- | :--- | :--- | :--- | :--- |
| `PF1-POS-01` | 5 треугольников CCW/CW × 4 оси (`horizontal`, `vertical`, `diag`, `oblique 3x-4y=5` с `c≠0`) — 20 граней, все `moving` | Level 1=`ALL_MOVING`, Level 2=`NON_DEGENERATE`, Level 5=`20/20 HOLDS`. `L7`: `PASS`, `orientationInverted=true` | Поломка отражения при ненормированной нормали, `c < 0`, CCW/CW, смене знака | `Spec §2`; Сценарий 1, 3 `[S][M]` |
| `PF1-POS-02` | Составной граф: `F_MOV` (`moving`), `F_FIX` (`fixed`), `F_MIX` (`mixed`) | `F_MOV` $\to$ `HOLDS`; `F_FIX` $\to$ `FIXED_UNCHANGED` ($\|p_1-p_0\|_2 \le 10^{-12}$); `F_MIX` $\to$ `MIXED_NOT_APPLICABLE`. `L7`: `PASS` | Ошибочная классификация граней, пропуск проверки координат fixed | Сценарий 3, 4, 5 `[S][M]` |
| `PF1-POS-03` | Треугольник `ALL_MOVING`, **1 вершина на оси** (`(0,0)` на `y=x`), 2 вне оси | Level 2=`NON_DEGENERATE`, Level 5=`HOLDS`. `L7`: `PASS` | Ложная отбраковка грани с вершиной на оси | Сценарий 2 `[S][M]` |
| `PF1-POS-04` | Треугольник `ALL_MOVING`, **2 вершины на оси** (`(0,0),(4,0)` на `y=0`), 1 вне оси (`(1,2)`) | Level 5=`HOLDS` (`A0=+4, A1=-4`). `L7`: `PASS` | Дефект площади при совпадении ребра с осью | Сценарий 2 `[M][P]` |
| `PF1-POS-05` | Смешанная грань `MIXED`: **движущаяся вершина лежит точно на оси** (`disp = 0`), одна `moving` вне оси, одна `fixed` | Level 1=`MIXED` (строго по `VertexId`, не по смещению), Level 5=`MIXED_NOT_APPLICABLE` | Ошибка смешения Level 1 с эвристикой `disp > 1e-9` | Сценарий 5; Level 1 `[M][P]` |
| `PF1-POS-06` | Цепочка из 2 отражений `S0 -> S1 -> S2` (`L2` + `L7.verifyProcess`) | Шаг 1: `HOLDS` (`-A0`); Шаг 2: `HOLDS` (`+A0`). `L7.verifyProcess`: `PASS`, `stepsVerified=2` | Потеря инверсии/связности в цепочке | Сценарий 3; `Contract 02 #18` `[D][P]` |

---

## 2. Категория 2 — Negative Controls & Level 0 Guards (`PF1-NEG-*`)

| ID | Input Geometry / Fault | Checked Level(s) & Expected Result | Detectable Defect | Specification Basis |
| :--- | :--- | :--- | :--- | :--- |
| `PF1-NEG-01` | **Сырой поворот на 180°** треугольника `ALL_MOVING` (`A1 === +A0`) | Level 3=`orientationSignInverted=false`, Level 5=`VIOLATION`. `L7`: `FAIL`, `orientationInverted=false` | Подмена отражения собственным движением ($SO(2)$) | Сценарий 9 `[M][S]` |
| `PF1-NEG-02` | **Подделка `claimedResiduals = 0`** на повороте 180° | Level 5=`VIOLATION`. `L7`: **`FAIL`** (`orientationInverted=false`) | Слепое доверие к `claimedResiduals` | Сценарий 9 `[S][D]` |
| `PF1-NEG-03` | **Изоляция `L7 Stage D` (`orientationInverted`):** поворот 180° с `{ epsilon: 10, areaEpsilon: 1e-7 }` *(НЕ тестирует `D-4`!)* | `L7`: **`FAIL` исключительно из-за `Stage D` (`orientationInverted=false`)** при `Stage C PASS`; Level 5=`VIOLATION` | Мёртвый код `orientationInverted` в `Stage D` | Раздел 5.1 Spec; `Validation §3.9` `[S][P]` |
| `PF1-NEG-04` | **Мутация `moving`-вершины** на `+0.5` после `L2` | Level 5=`VIOLATION`. `L7`: `FAIL` (`areaPreserved=false`) | Искажение движущейся грани | `Acceptance §1.2` `[S]` |
| `PF1-NEG-05` | **Пост-отражательный коллапс** ($\|A_0\|=2 > 10^{-12}$, `S1` схлопнут в $A_1=0$) | Level 2=`NON_DEGENERATE` (по $S_0$), Level 3=`postReflectionCollapse=true`, Level 5=**`VIOLATION`**. `L7`: `FAIL` | Нарушение запрета Level 2 на чтение $S_1$ | Таблица приоритетов №7 `[M][S]` |
| `PF1-NEG-06` | **`FIXED_CHANGED` — сдвиг 1 вершины** на `(1e-4, 0)` | Level 3=`maxFixedVertexDistance=1e-4`, Level 5=`FIXED_CHANGED`. `L7`: `FAIL` | Пропуск дрейфа фиксированных вершин | Сценарий 8 `[S][D]` |
| `PF1-NEG-07` | **`FIXED_CHANGED` — жёсткий перенос** fixed-грани на `(1.0, 0)` ($\Delta A = 0$) | Level 3=`maxFixedVertexDistance=1.0`, Level 5=`FIXED_CHANGED`. `L7`: `FAIL`, `areaPreserved=true` | Проверка fixed-граней по площади (`AUD-A02`) | Сценарий 8 `[D][M]` |
| `PF1-NEG-08` | **`FIXED_CHANGED` — жёсткий поворот** fixed-грани на `15°` ($\Delta A = 0$) | Level 5=`FIXED_CHANGED`. `L7`: `FAIL`, `fixedVerticesUnchanged=false`, `areaPreserved=true` | Пропуск жёсткого вращения fixed-грани | Сценарий 8 `[M][P]` |
| `PF1-NEG-09` | **Наивное правило на смешанной грани (`NC-F2`)** | Level 1=`MIXED` $\to$ Level 4=`NOT_APPLICABLE_MIXED` $\to$ Level 5=`MIXED_NOT_APPLICABLE` | Ложное применение Property F к смешанным граням | Сценарий 5 `[S][D]` |
| `PF1-NEG-10a` | **Level 0A/0B: неизвестный `VertexId` в грани или дыра / пересечение `moving ∩ fixed`** | **Level 0A/0B**: `InputIntegrityError` (`UNKNOWN_VERTEX_ID` / `PARTITION_OVERLAP_VIOLATION` / `PARTITION_COVERAGE_HOLE`). `L7`: `FAIL` (`idsPreserved=false`) | Маскировка невалидных ID под исход Level 5 | `AUD-A01`, Таблица №4 `[S][P]` |
| `PF1-NEG-10b` | **Level 0A/0B (`AUD-B01`): отсутствующая вершина в `resultingState`** (`V2` есть в `source.vertices` и `movingIds`/`fixedIds`, но удалена из `result.vertices`, вкл. случай `ALL_FIXED`) | **Level 0A/0B**: `InputIntegrityError` (`MISSING_RESULT_VERTEX`). `L7`: `FAIL` (`idsPreserved=false`) | Отсутствие симметричной проверки `result.vertices` (и тихий пропуск при `ALL_FIXED`) | `AUD-B01`, `AUD-A02` `[S][P]` |
| `PF1-NEG-11` | **Level 0B (`OD-01C`, `AUD-C01`): внутренние повторы `['A','A','B']`, `['A','B','B','C']` и замыкающий повтор `['A','B','C','A']`** | **Level 0B** *(локальное предусловие `Property F v1`)*: `InputIntegrityError` (`DUPLICATE_VERTEX_ID_INTERNAL` / `DUPLICATE_CLOSING_VERTEX_ID`). Фиксируется, что текущий `L7` (`560-591`) и `Face2D` этот повтор не запрещают | Нарушение локальной канонической формы открытого цикла; документирование открытого вопроса `Face2D` | `OD-01C`, `AUD-C01` `[S][P]` |
| `PF1-NEG-12` | **Level 0B (`OD-01D`): пустая грань `vertexIds = []`** | **Level 0B**: `InputIntegrityError` (`EMPTY_FACE_VERTICES`). Фиксируется расхождение с `L7:852` (`continue`) | Маскировка пустого массива под `DEGENERATE` | `OD-01D`, Таблица №6 `[S][P]` |

---

## 3. Категория 3 — Boundary Tests (`PF1-BND-*`, вкл. `AUD-B03`, `AUD-D01`)

| ID | Input Geometry / Parameter | Checked Level(s) & Expected Result | Detectable Defect | Specification Basis |
| :--- | :--- | :--- | :--- | :--- |
| `PF1-BND-01` | Точная граница **`\|A_0\| === 1e-12`** (`b=2e-6, h=1e-6`, ось `y=0`) | Level 2=`DEGENERATE` (`<=`), Level 5=**`DEGENERATE_NOT_EVALUATED`**. `L7`: **`UNDETERMINED`** | Расхождение `<` vs `<=` на границе `1e-12` | `Spec §4`; `R1` `[S][D]` |
| `PF1-BND-02` | Сразу над порогом **`\|A_0\| = 1e-12 + 1e-6`** | Level 2=`NON_DEGENERATE`, Level 5=**`HOLDS`**. `L7`: **`PASS`** | Завышенный порог вырожденности | `R1` `[S][D]` |
| `PF1-BND-03` | Ошибка площади **`1e-14`** (`<= 1e-12`) при `A0 = 1` | Level 3=`withinOracleReflectionTol=true`, Level 5=**`HOLDS`**. `L7`: **`PASS`** | Отсутствие допуска `f64` | `OD-02` `[S][D]` |
| `PF1-BND-04` | **Полоса расхождения для $|A_0| \le 10^5$ (`AUD-D01`):** (а) `A0 = 1`, ошибка `1e-9` $\in (10^{-12}, 10^{-7}]$; (б) `A0 = 1e6` ($> 10^5$), ошибка `5e-7` ($\le \tau_{\text{area}}(10^6)=10^{-6}$, но $> 10^{-7}$) | (а) Оракул: **`VIOLATION`**, `L7`: **`PASS`**; (б) Оракул: **`HOLDS`**, `L7`: **`FAIL`** *(иллюстрация инверсии масштабируемого и абсолютного допусков при $\|A_0\|>10^5$)* | Смешение двух политик или неверное предположение о глобальном преобладании $\varepsilon_{\text{oracle}}$ | `OD-02`, `AUD-D01`, `Spec §4.2` `[S][M]` |
| `PF1-BND-05` | Превышение обоих порогов при `A0 = 1`: ошибка площади **`1e-5`** (`> 1e-7`) | Level 5=**`VIOLATION`**. `L7`: **`FAIL`** (`areaPreserved=false`) | Ослабление `L7.areaEpsilon` | `OD-02` `[S]` |
| `PF1-BND-06` | **Вершина вблизи оси (`dist = 1e-9`)** (`base=2, height=1e-9`, `A0 = 1e-9 > 1e-12`) | Без snapping; Level 5=**`HOLDS`**. `L7`: **`PASS`** | Ложный epsilon-snapping | Таблица №9; `Property E` `[S][M]` |
| `PF1-BND-07` | Границы нормы нормали: `||n|| = 0.9e-12` (отказ `L2`) vs `||n|| = 1.1e-12` (`L2 OK` + `HOLDS`) | `0.9e-12` $\to$ ошибка `L2`; `1.1e-12` $\to$ `HOLDS` и `L7 PASS` | Дрейф `zeroNormalEpsilon = 1e-12` | `Acceptance §1.3` `[S][P]` |
| `PF1-BND-08` | **Граничные случаи $\tau_{\text{coord}} = 10^{-12}$ для `ALL_FIXED` (`AUD-B03`, `AUD-A02`):** невырожденная и вырожденная (`A0=0`) fixed-грань со сдвигом вершины по оси `x` на `(a) 1e-12` (точное равенство `<=`), `(b) 1e-9` (`1e-12 < d <= 1e-7`), `(c) 1e-5` (`> 1e-7`) | **(a)** Level 3=`maxFixedVertexDistance=1e-12 <= 1e-12` $\to$ Level 5=**`FIXED_UNCHANGED`**, `L7 PASS`; **(b)** Level 5=**`FIXED_CHANGED`**, `L7 PASS`; **(c)** Level 5=**`FIXED_CHANGED`**, `L7 FAIL` (`fixedVerticesUnchanged=false`). Одинаково для вытянутой грани (`ΔA > 1e-12` при `d=1e-12`) — площадь не меняет вердикт! | Использование `<` вместо `<=`, смешение манхэттенской/чебышевской метрики с евклидовой нормой или опора `ALL_FIXED` на площадь (`AUD-A02`) | `AUD-A02`, `AUD-B03` `[M][P]` |

---

## 4. Категория 4 — Degeneracy & Priority Matrix Tests (`PF1-DEG-*`)

| ID | Input Geometry | Checked Level(s) & Expected Result | Detectable Defect | Specification Basis |
| :--- | :--- | :--- | :--- | :--- |
| `PF1-DEG-01` | Коллинеарная грань **вне оси** (`y=x+1`, ось `x=10`), `ALL_MOVING` | Level 2=`DEGENERATE`, Level 5=`DEGENERATE_NOT_EVALUATED`. `L7`: `UNDETERMINED` | Проверка коллинеарности только на оси | Сценарий 6 (`NC-F3`) `[S][D]` |
| `PF1-DEG-02` | **Все 3 вершины на оси** (`(0,0),(1,1),(2,2)` на `y=x`), `ALL_MOVING` | Level 2=`DEGENERATE`, Level 5=`DEGENERATE_NOT_EVALUATED`. `L7`: `UNDETERMINED` | Ошибочный `HOLDS` из нулевого сдвига | Таблица №8 `[M][P]` |
| `PF1-DEG-03` | Вырожденная + невырожденная `ALL_MOVING`-грани в одном графе | `F_DEG` $\to$ `DEGENERATE_NOT_EVALUATED`, `F_VALID` $\to$ `HOLDS`. `L7`: **`PASS`** | Ошибочный `UNDETERMINED` при наличии валидной грани | `L7:914-925` `[S][D]` |
| `PF1-DEG-04` | **Грань с `< 3` вершинами (`AUD-B02`): `k = 1` (`['V0']`) и `k = 2` (`['V0','V1']`), `ALL_MOVING`** | **Level 2** (`FEWER_THAN_3_VERTICES`) $\to$ **Level 5**=`DEGENERATE_NOT_EVALUATED` (для обоих `k=1` и `k=2`). `L7`: **`UNDETERMINED`** | Падение Shoelace или необработка `k = 1` / `k = 2` | `AUD-B02`, Таблица №3 `[S][M]` |
| `PF1-DEG-05` | **`MIXED` + `DEGENERATE` (`OD-01A`):** коллинеарная грань `A0=0`, `V0,V1 ∈ moving`, `V2 ∈ fixed` | Level 1=`MIXED`, Level 2=`DEGENERATE`, Level 4=`NOT_APPLICABLE_MIXED`, Level 5=**`MIXED_NOT_APPLICABLE`** | Инверсия приоритета (`DEGENERATE > MIXED`) | `OD-01A`, Таблица №1 `[S][P]` |
| `PF1-DEG-06` | **`ALL_FIXED` + `DEGENERATE` (`OD-01B`, `AUD-A02`):** коллинеарная `ALL_FIXED`-грань `A0=0` (без сдвига vs со сдвигом `1e-4`) | Level 1=`ALL_FIXED`, Level 2=`DEGENERATE`, Level 4=`APPLICABLE_FIXED_INVARIANCE`, Level 5=**`FIXED_UNCHANGED`** / **`FIXED_CHANGED`** строго по евклидовым координатам | Пропуск координатной проверки вырожденной fixed-грани | `OD-01B`, `AUD-A02` `[S][P]` |

---

## 5. Категория 5 — Non-Convex Polygon Tests (`PF1-NCONV-*`)

| ID | Input Geometry | Checked Level(s) & Expected Result | Detectable Defect | Specification Basis |
| :--- | :--- | :--- | :--- | :--- |
| `PF1-NCONV-01` | Невыпуклый 5-угольник (вогнутый, **CCW**, `A0 > 0`), `ALL_MOVING` | Level 5=`HOLDS` (`A1 = -A0 < 0`). `L7`: `PASS` | Ошибка формулы площади на вогнутых/дальнейших вершинах (`MUT-12`) | Сценарий 7 `[M][D]` |
| `PF1-NCONV-02` | Тот же невыпуклый 5-угольник (**CW**, `A0 < 0`), `ALL_MOVING` | Level 5=`HOLDS` (`A1 = -A0 > 0`). `L7`: `PASS` | Предположение `A0 > 0` при проверке знака | Сценарий 7 `[M][D]` |
| `PF1-NCONV-03` | Невыпуклый L-образный 6-угольник: отражение vs поворот 180° | Отражение: **`HOLDS`**; поворот 180°: **`VIOLATION`** (`L7 FAIL`) | Сбой инверсии на `n > 4` при сохранении площади | Сценарий 7, 9 `[M][P]` |

---

## 6. Категория 6 — Metamorphic Tests (`PF1-META-*`)

| ID | Metamorphic Relation | Expected Result | Detectable Defect | Specification Basis |
| :--- | :--- | :--- | :--- | :--- |
| `PF1-META-01` | `F -> R_L(F) -> R_L(R_L(F))` (Property F × Property A) | Каждый шаг `HOLDS`; `A2 === +A0` | Асимметрия знаков ориентации | `Acceptance §1.5` `[M][P]` |
| `PF1-META-02` | Масштаб `(αn, αc)` при `α ∈ {1e-4, -7.5, 1e4}` (Property F × Property C) | Идентичный `HOLDS` независимо от `α` | Утечка знака `α` | `Spec §1` `[M][P]` |
| `PF1-META-03` | Обращение обхода `reverse(vertexIds)` (открытый цикл) | `A0(F_rev) = -A0(F)`; оба `HOLDS` | Зависимость от стартового обхода | `Validation §3.7` `[M][P]` |
| `PF1-META-04` | Сдвиг на `v = (50, -30)` (Property F × Property B) | `A(T_v(F)') = -A(T_v(F))`; `HOLDS` | Нарушение трансляционной инвариантности | `D-1` контраст `[M][P]` |

---

## 7. Категория 7 — Known Limitation Characterization (`PF1-CHAR-*`, `OD-04`, `AUD-E01`)

*Набор ограничен дефектами Property F (`D-1`, `D-2`, `D-4`, `D-5`). Дефекты **`D-3`** (`L2 normSq overflow`) и **`D-8`** (`bundle size`) явно исключены и вынесены в отдельные технические исследования (`Spec §5.3`).*

| ID | Defect | Input Geometry / Call | Current Observed Assertions (`2.3.3`) | Expected Behavior After Fix (`2.4`) |
| :- | :- | :--- | :--- | :--- |
| `PF1-CHAR-D1` | **`D-1`** | Единичный треугольник, сдвиг `(+1e8,+1e8)` и `(+1e9,+1e9)`, `L2` отражение | Оракул (`centered`): **`HOLDS`**; `L7`: `status === 'FAIL'` (`1e8`) и `'UNDETERMINED'` (`1e9`) | `L7`: `'PASS'`, `orientationInverted === true` |
| `PF1-CHAR-D2` | **`D-2`** | Невырожденный треугольник `1e-6` (`\|A0\|=5e-13`), `L2` отражение | **Два раздельных assert (`AUD-E01`):** (1) `verdict.status === 'UNDETERMINED'`; (2) `oracle.outcome === 'DEGENERATE_NOT_EVALUATED'` | После масштабного порога (`c·L²`) в 2.4: `L7` `'PASS'` + `oracle` `'HOLDS'` |
| `PF1-CHAR-D4` | **`D-4`** | `verifyResult(claim, req, { epsilon: 1e-2 })` (**БЕЗ** `areaEpsilon`), ошибка площади `1e-4` | `verdict.status === 'PASS'` и `verdict.predicates.areaPreserved === true` | `verdict.status === 'FAIL'`, `areaPreserved === false` |
| `PF1-CHAR-D5` | **`D-5`** | 3 графа: `100% MIXED`, `100% FIXED`, `0` граней (0 невырожденных `ALL_MOVING`) | **Три явных assert (`AUD-E01`):** `verdict.status === 'PASS'`, `orientationInverted === true`, и `!verdict.diagnostics.some(d => /NOT_APPLICABLE\|NO_MOVING_FACE\|VACUOUS/i.test(d))` (+ оракул `MIXED_NOT_APPLICABLE` / `FIXED_UNCHANGED`) | Появление явной диагностики неприменимости (и/или статус в v3) |

---

## 8. Категория 8 — Программа мутационного тестирования (`PF1-MUT-01..15`, 5 классов — БЕЗ запуска на текущем этапе)

**Статус исполнения:** Ни одна из 15 мутаций **ещё не запускалась** `[E]`; таблица задаёт план проверки после разрешения `ROD-03`.

### 8.1. Процедура и критерии исходов (`KILLED / SURVIVED / EQUIVALENT / INVALID`)
- **Процедура для `PF1-MUT-XX`:** Внести ровно 1 изолированную мутацию $\to$ запустить `npm test` $\to$ зафиксировать упавшие тесты и исход $\to$ откатить мутацию и сверить чистое дерево (`SHA-256` неизменных файлов не меняется ни на одном шаге).
- **Критерии:**
  - **`KILLED`:** `npm test` завершается падением целевых `assert` из `PF1-*`;
  - **`SURVIVED`:** код компилируется и все тесты `npm test` проходят зелёными (требует доработки матрицы);
  - **`EQUIVALENT`:** формально доказана семантическая эквивалентность на всём домене;
  - **`INVALID`:** ошибка компиляции TypeScript / синтаксиса или нарушение условий запуска.

### 8.2. Каталог 15 мутаций по 5 классам (исправлено по `AUD-F01`)

| Класс | ID | Объект мутации | Внедряемая мутация | Ожидаемые убивающие тесты (`KILLED`) и обоснование |
| :--- | :--- | :--- | :--- | :--- |
| **1. Классификатор** | `MUT-01` | Level 1 (`PartitionClass`) | Замена проверки `VertexId` на эвристику `hypot(p1-p0) > 1e-9` | `PF1-POS-05` |
| **1. Классификатор** | `MUT-02` | Level 2 (`centeredSignedArea`) | Удаление центрирования по `pts[0]` (возврат к глобальной Shoelace) | `PF1-CHAR-D1` (проверка оракула на `1e8`/`1e9`) |
| **1. Классификатор** | `MUT-03` | **Дефект тестового классификатора** (Level 3 `signedSumError`) | Замена `\|A1 + A0\| <= τ` на `\|\|A1\| - \|A0\|\| <= τ` (утрата контроля инверсии знака внутри классификатора) | `PF1-NEG-01` *(Отличие от `MUT-13`: ломает сам проверяющий классификатор при валидном входе `PF1-NEG-01`)* |
| **1. Классификатор** | `MUT-04` | Level 3 (`withinOracleFixedCoordTol`) | Возврат `fixedAreaDiff <= τ_area` вместо чистого `maxFixedVertexDistance <= τ_coord` (или пропуск `maxFixedVertexDistance`) | `PF1-NEG-07`, `PF1-NEG-08`, `PF1-BND-08` (вытянутая fixed-грань) |
| **1. Классификатор** | `MUT-05` | Level 5 (`PropertyOutcome`) | Возврат `'FIXED_UNCHANGED'` вместо `'FIXED_CHANGED'` при ложном `withinOracleFixedCoordTol` | `PF1-NEG-06` |
| **2. Пороги** | `MUT-06` | Level 2 (`GeometryDegeneracy`) | Смена `<=` на `<` в `\|A0\| <= thresholdUsed` | `PF1-BND-01` |
| **2. Пороги** | `MUT-07` | Level 3 (`withinOracleReflectionTol`) | Ослабление `1e-12 * max(1, \|A0\|)` до `1e-7 * max(1, \|A0\|)` | `PF1-BND-04(а)` (`1e-9` при `A0=1`) |
| **2. Пороги** | `MUT-08` | Level 3 (`τ_coord`) | Ослабление `τ_coord` с `1e-12` до `1e-3` (или замена `<` на `<=` vs `>`) | `PF1-NEG-06`, `PF1-BND-08` |
| **3. Приоритеты** | `MUT-09` | Level 4 (`PropertyApplicability`) | Перестановка: проверка `DEGENERATE` **раньше** `MIXED` | `PF1-DEG-05` |
| **3. Приоритеты** | `MUT-10` | Level 4 (`PropertyApplicability`) | Перестановка: проверка `DEGENERATE` **раньше** `ALL_FIXED` | `PF1-DEG-06` |
| **3. Приоритеты** | `MUT-11` | Level 2 / Level 3 | Проверка вырожденности по `min(\|A0\|, \|A1\|)` вместо строго по $S_0$ | `PF1-NEG-05` |
| **4. Фикстуры** | `MUT-12` | Вогнутая фикстура и чувствительность площади к вогнутости (`AUD-F01`) | Временная инъекция дефекта «площадь только первого угла `(p0, p1, p2)`» (игнорирует вершины `3..k-1`): на выпуклом/треугольном тесте дефект выживает (`SURVIVED`), но **убивается** вогнутой частью 5-угольника / L-6-угольника, где знак/площадь искажены на отсечённой вогнутой вершине | **`PF1-NCONV-01`, `PF1-NCONV-02`, `PF1-NCONV-03`** *(Доказывает незаменимость невыпуклых фикстур по сравнению с треугольниками и выпуклыми многоугольниками)* |
| **4. Фикстуры** | `MUT-13` | **Дефект входной модели результата `L2`** (`AUD-F01`) | Подмена входного результата в тестовом прогоне `PF1-POS-01` (передача результата поворота на 180° вместо отражения `L2`, не редактируя `src/core/*`) | **`PF1-POS-01`** *(Отличие от `MUT-03`: классификатор исправен, мутирована модель результата `L2` во входных данных позитивного теста)* |
| **5. Некорректные входы** | `MUT-14` | Level 0B (`Input Integrity Guard`) | Пропуск проверки повторов `vertexIds` (`['A','A','B']`, `['A','B','C','A']`) | `PF1-NEG-11` |
| **5. Некорректные входы** | `MUT-15` | Level 0A/0B (`Input Integrity Guard`) | Пропуск проверки `vertexIds.length === 0` или отсутствующей в `result` вершины | `PF1-NEG-10a`, `PF1-NEG-10b`, `PF1-NEG-12` |
