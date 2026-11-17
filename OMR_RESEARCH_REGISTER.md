# OMR — Research Register (`OMR_RESEARCH_REGISTER.md`)

**Версия:** Architecture Evolution Package v1.0 (Phase F)  
**Назначение:** Единый реестр исследовательских и инженерных направлений проекта OMR.  
**Ограничение планирования:** Реестр не назначает календарные сроки и не создаёт обязательств по немедленной программной реализации.

---

## 1. Сводный реестр направлений (`R-01` — `R-08`)

| ID | Направление | Состояние | Надтрек |
| :- | :--- | :--- | :--- |
| **`R-01`** | **OMR Mathematical Core (`L1–L7`)** | `Existing` | Базовое ядро (`L2`/`L7` в коде, `L1`/`L3–L6` в проекте) |
| **`R-02`** | **Property F / Phase 2.3.3** | `Existing research` | Верификационное тестирование `Contract 02` |
| **`R-03`** | **CRP-01 / MCAR** | `Documented research` | Интегрированное инженерное рассуждение *(Происхождение)* |
| **`R-04`** | **PWRP v1.1** | `Documented research` | Интегрированное инженерное рассуждение *(Физическое поведение)* |
| **`R-05`** | **Cross-Architecture Integration** | `Proposed research` | **`OMR — Integrated Engineering Reasoning Architecture`** |
| **`R-06`** | **Interface Contract Formalization** | `Open research` | **`OMR — Integrated Engineering Reasoning Architecture`** |
| **`R-07`** | **Epistemic Vector Formalization** | `Open research` | **`OMR — Integrated Engineering Reasoning Architecture`** |
| **`R-08`** | **Reasoning Loop Control** | `Open research` | **`OMR — Integrated Engineering Reasoning Architecture`** |

---

## 2. Детализация по каждому направлению

### `R-01` — OMR Mathematical Core (`Existing`)
- **Цель:** Формальное математическое представление геометрических состояний (`L1–L7`), детерминированное выполнение операций, журнал `TRACE` и независимая Zero-Trust верификация.
- **Текущая зрелость:** Реализованы (`IMPLEMENTED`) 2D `L2 REFLECTION_ACROSS_LINE`, `OperationRequest`, `TRACE` (in-process `deepFreeze`) и алгоритмически/модульно изолированный `L7` (`Contract 02 v2`, `v0.1.0` Phase 2.2) поверх общей арифметики `IEEE-754 f64`; на диске зафиксированы (`TESTED`) `36` тестов (`19` в `tests/contract02.test.ts` + `17` в `tests/metamorphic.test.ts`); `L1`, `L3–L6`, `CAPABILITY_GAP`, точная/интервальная арифметика и `JCS + SHA-256` — на уровне проектных спецификаций (`DOCUMENTED`).
- **Существующие документы:** `README.md`, `docs/ARCHITECTURE.md`, `docs/DEVELOPMENT_ROADMAP.md`, `docs/FIRST_PROTOTYPE_SPEC.md`, `PHASE_2_2_IMPLEMENTATION_REPORT.md`, `RESEARCH_INTEGRATION_V1.md`, `PHASE_2_3_3_ARCHIVE_FORENSIC_REPORT.md`.
- **Нерешённые вопросы:** `AUD-C01` (стандартизация `Face2D.vertexIds` для Contract 02 v3), открытые дефекты/ограничения кода **`D-1`** (нецентрированная Shoelace в `L7`), **`D-2`** (абсолютный порог `1e-12`), **`D-3`** (переполнение `normSq` в `L2`), **`D-4`** (`areaEpsilon ?? epsilon` в `L7:59`), **`D-5`** (вакуумный `PASS` с `orientationInverted: true` при 0 движущихся граней), **`D-8`** (`UNRESOLVED` расхождение размера JS-бандла), `CAPABILITY_GAP`, реализация `Phase 3` (`L1 ↔ L2`).
- **Зависимости:** Не зависит от `MCAR` и `PWRP`; сохраняется неизменным при исследованиях `R-03..R-08`.
- **Возможный следующий шаг:** Изолированная подготовка и планирование `Phase 2.4` / `Phase 3` (`Contract 01`) по отдельному решению владельца.

### `R-02` — Property F / Phase 2.3.3 (`Existing research`)
- **Цель:** Инженерно-консолидированное завершение метаморфного тестирования инверсии ориентации (`Property F`) поверх нетронутого математического ядра (`src/core/*`) и базовых `36` тестов.
- **Текущая зрелость:** В `tests/metamorphic.test.ts` присутствуют (`TESTED`) `4` базовых теста `Property F` (`F1–F3`, `NC-F1..NC-F3`, Rotation Control); полный 6-уровневый классификатор `classifyPropertyF`, файл `tests/propertyF_v1.test.ts` и `15` мутаций **не реализованы и не запускались** (`DOCUMENTED / PROPOSED`). Закрыты 10 замечаний аудита (`AUD-A01..F01`), утверждены `ROD-01` и `ROD-02`; реализация ожидает `ROD-03: WAITING FOR EXPLICIT OWNER AUTHORIZATION`.
- **Существующие документы:** `PHASE_2_3_3_REIMPLEMENTATION_SPEC.md`, `PHASE_2_3_3_TEST_MATRIX_V2.md`, `PROPERTY_F_TEST_LAYER_V1.md`, `PHASE_2_3_3_PROPERTY_F_SPECIFICATION.md`, `PHASE_2_3_3_PROPERTY_F_VALIDATION.md`, `PHASE_2_3_3_PRE_IMPLEMENTATION_AUDIT.md`, `PHASE_2_3_3_AUDIT_FINDINGS_RESOLUTION.md`, `PHASE_2_3_3_OWNER_DECISIONS.md`, а также пакет форензики `PHASE_2_3_3_*`.
- **Нерешённые вопросы:** Выдача явного разрешения `ROD-03`; пробелы базовых тестов + двухполитическая полоса допусков оракул vs `L7` (`D-7` / `OD-02`); оператор `<` vs `<=` на `1e-12` в `tests/metamorphic.test.ts`; вынесенные внеконтурные `D-3` (`L2`), **`D-8` (`UNRESOLVED` бандл)** и `D-6` / `OD-05` (`17` файлов в `public/assets/aistudio/`).
- **Зависимости:** Опирается на `R-01` (`src/core/*`, `36` существующих тестов); изолирован от `R-03..R-08`.
- **Возможный следующий шаг:** При отдельном получении `ROD-03` — создание `tests/propertyF_v1.test.ts` и прогон `15` мутаций.

### `R-03` — CRP-01 / MCAR (`Documented research`)
- **Цель:** Формирование конструктивного мышления агента (*«Единство не требует единого происхождения»*): распознавание `Single-Piece / Modular / Hybrid / Multi-Part Enclosure`, декомпозиция на `COMPONENTS` и `JOINTS`, удержание `HYPOTHESIS_SET` и `UNKNOWN`.
- **Текущая зрелость:** Завершена исследовательская постановка v1.0 (4 отчёта/паспорта, проверка на 8+1 сценариях `M1–M9`, обоснование отделения от `PWRP`). Код отсутствует.
- **Существующие документы:** `MCAR_RESEARCH_REPORT.md`, `MCAR_PATTERN_PASSPORT.md`, `MCAR_SCENARIO_VALIDATION.md`, `MCAR_PWRP_RELATIONSHIP.md`.
- **Нерешённые вопросы:** `MCAR-O01..O06` (граница self-joining kirigami, мультикомпонентность в `L1`, промежуточная устойчивость при сборке, визуальные признаки происхождения, старение швов, манифест сборки).
- **Зависимости:** Связан с `R-04` (маршрутизация швов), `R-05..R-08`, а концептуально — с `SOL` (`OBJECT/RELATION/CONSTRAINT/STATE`).
- **Возможный следующий шаг:** Рецензирование владельцем открытых вопросов `MCAR-O01..O06` и связи с `R-06..R-08`.

### `R-04` — PWRP v1.1 (`Documented research`)
- **Цель:** Библиотека закономерностей рассуждения о физическом мире (13 физических паттернов по 6 макро-осям + мета-уровень `PWRP-10`), не позволяющая агенту подменять физическую допустимость идеальной 2D/3D геометрией.
- **Текущая зрелость:** Завершена ревизия `v1.1` (`TAXONOMY V1.1 READY FOR REVIEW`) поверх базы `v1.0` (`PWRP_RESEARCH_REPORT.md` и др.) с проверкой на 16 сценариях `S1–S16`. Код отсутствует.
- **Существующие документы:** `PWRP_V1_1_TAXONOMY_PROPOSAL.md`, `PWRP_V1_1_PATTERN_CATALOG.md`, `PWRP_V1_1_COVERAGE_MATRIX.md`, `PWRP_V1_1_CHANGELOG.md` + 7 исторических/опорных документов `PWRP v1.0`.
- **Нерешённые вопросы:** `PWRP-O01..O13` (эффективная толщина $T_{\text{eff}}$, пластический шарнир, переход $n \to n^3$, многовершинные узлы при $t>0$, калибровка без магических чисел, причинная сеть `Physical Causal Pattern Network`).
- **Зависимости:** В части входов опирается на будущий `L3` (`R-01`) и разделённый вход `PWRP-07` (`R-06`).
- **Возможный следующий шаг:** Рецензирование и утверждение/доработка таксономии `v1.1` владельцем.

### `R-05` — Cross-Architecture Integration (`Proposed research`)
- **Цель:** Согласованное объединение конструктивного (`MCAR`), математического (`OMR L1–L7`) и физического (`PWRP v1.1`) рассуждений в единой исследовательской концепции `OMR — Integrated Engineering Reasoning Architecture`.
- **Текущая зрелость:** Выполнен первый аудит (`CONSISTENT WITH REVISIONS`), сформулированы трёхосевое разделение, границы и нелинейный поток. Не канонизировано.
- **Существующие документы:** `OMR_CROSS_ARCHITECTURE_AUDIT.md`, `OMR_REASONING_FLOW_PROPOSAL.md`, `OMR_ARCHITECTURE_BOUNDARIES.md`, `OMR_ARCHITECTURE_MAP.md`.
- **Нерешённые вопросы:** Статус концептуальной связи с `SOL` и расширение переносимости за пределы оригами (гипотеза о системе способов мышления об объектах и процессах).
- **Зависимости:** Опирается на `R-01`, `R-03`, `R-04`; уточняется через `R-06`, `R-07`, `R-08`.
- **Возможный следующий шаг:** Проверка владельцем выводов обоих аудитов и фиксация приоритетов между `R-06..R-08`.

### `R-06` — Interface Contract Formalization (`Open research`)
- **Цель:** Доведение контрактов обмена данными `MCAR → OMR`, `OMR → PWRP`, `PWRP → MCAR / OMR` и разделения накопления в `PWRP-07` (`LAYER_ACCUMULATION` vs `MODULE_TOLERANCE_ACCUMULATION`) от предложений аудита до строгих проверяемых спецификаций.
- **Текущая зрелость:** Проведён аудит (`INTERFACES DEFINED WITH GAPS`), зафиксированы `PROPOSED`-схемы (`PhysicalFeedbackPayload`, `AccumulationRecord`, `HYPOTHESIS_SCOPED`, сохранение `preservedValidSubResults` из `L7`).
- **Существующие документы:** `OMR_INTERFACE_CONTRACT_AUDIT.md`.
- **Нерешённые вопросы:** Область применимости сохранённых результатов `L7` при частичном изменении геометрии, точная композиция `HYBRID_STACK`, мультикомпонентность в `L1` (`MCAR-O02`).
- **Зависимости:** Напрямую зависит от `R-05`, `R-07`, `R-08` и дорожной карты `R-01` (`Phase 3`/`Phase 5`).
- **Возможный следующий шаг:** Детальная проработка открытых пробелов из `OMR_ARCHITECTURE_OPEN_QUESTIONS.md`.

### `R-07` — Epistemic Vector Formalization (`Open research`)
- **Цель:** Строгая формализация трёхосевого вектора `Verdict = (M_OMR, C_MCAR, P_PWRP-10)`, матрицы допустимых комбинаций, семантики `UNKNOWN` и условных оценок `BranchVerdicts`.
- **Текущая зрелость:** Подготовлена начальная спецификация (`PROPOSED` + `UNRESOLVED`).
- **Существующие документы:** `OMR_EPISTEMIC_VECTOR_SPECIFICATION.md`, `OMR_CROSS_ARCHITECTURE_AUDIT.md` (§4).
- **Нерешённые вопросы:** `EV-U01` (`OBSERVED_ONLY` vs `UNDETERMINED`/`NOT_APPLICABLE`), `EV-U02` (`Multi-Part Enclosure` в `C_MCAR`), `EV-U03` (упразднение `MATHEMATICALLY_VALID` из `PWRP-10`), полная формальная верификация матрицы комбинаций `(M, C, P)`.
- **Зависимости:** Связан с `PWRP-10` (`R-04`), `L7 VerificationStatus` (`R-01`) и ветвлением гипотез (`R-08`).
- **Возможный следующий шаг:** Разрешение `EV-U01..U03` и аудит полноты таблицы переходов `(M, C, P)`.

### `R-08` — Reasoning Loop Control (`Open research`)
- **Цель:** Математически и логически корректное управление нелинейными возвратами между физикой, сборкой и конструктивными гипотезами без зацикливания и комбинаторного взрыва.
- **Текущая зрелость:** Подготовлена начальная спецификация `BRANCH_IDENTITY`, `REJECTION_RECORD`, `REOPEN_CONDITION`, раздельного `RETURN_DEPTH` и `LOOP_DETECTION` (`PROPOSED`).
- **Существующие документы:** `OMR_REASONING_LOOP_CONTROL_SPECIFICATION.md`, `OMR_REASONING_FLOW_PROPOSAL.md`.
- **Нерешённые вопросы:** `LC-U01` (канонизация 3D-разбиений), `LC-U02` (обоснование лимитов возвратов), **разделение `STRUCTURAL_SIGNATURE` и `CONFIGURATION_SIGNATURE`** в идентичности гипотез.
- **Зависимости:** Опирается на `R-03` (`HYPOTHESIS_SET`), `R-06` (`PhysicalFeedbackPayload`), `R-07` (`BranchVerdicts`).
- **Возможный следующий шаг:** Формальное исследование идентичности гипотез (структурная vs конфигурационная подпись) до любого прототипирования.
