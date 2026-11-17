# Project Architecture Status — Origami Mathematical Reasoning (`PROJECT_ARCHITECTURE_STATUS.md`)

**Версия документа:** Architecture Evolution Package v1.1 (Reconciled)  
**Дата фиксации:** 2026-11-17  
**Основополагающий тезис проекта:**  
> *OMR развивается от специализированного математического ядра к модульной архитектуре инженерного рассуждения. Математическая корректность, конструктивное происхождение, кинематическая достижимость и физическая осуществимость рассматриваются как самостоятельные области знания. Их взаимодействие организуется через явно определённые интерфейсы, сохранение происхождения доказательств и контроль эпистемических состояний. Исследование интеграции этих областей является отдельным направлением развития проекта и не предполагает автоматического изменения существующего математического ядра.*

---

## B1. `IMPLEMENTED` — Фактически реализовано в исходном коде (`src/*`)

Подтверждено прямым чтением `src/core/*`, `src/components/*`, `src/App.tsx`:

1. **Математическое ядро OMR (`src/core/*`, TypeScript `"strict": true`):**
   - `src/core/types.ts` — чистые иммутабельные типы `Contract 02 v2` (`GeometryState`, `LineNormalParams`, `OperationRequest`, `ReflectionWitness`, `TraceEntry`, `VerificationClaim`, `VerificationVerdict`, `VerifierTolerances`), хранение координат в двойной точности `IEEE-754 f64` без округления.
   - `src/core/operationRequest.ts` — фабрика `createOperationRequest` и `cloneOperationRequest` с `Object.freeze` (`deepFreeze` в памяти процесса), явной привязкой к `sourceStateId` / `sourceStateVersion` и дизъюнктным разбиением `movingVertexIds` / `fixedVertexIds`.
   - `src/core/l2GeometryEngine.ts` — слой **L2** для единственной геометрической операции `REFLECTION_ACROSS_LINE` ($p' = p - 2\frac{n\cdot p - c}{n\cdot n}n$) по доверенному `OperationRequest`, выпуск `ReflectionWitness`, проверка `REQUEST_STATE_MISMATCH` и `INVALID_OPERATION_REQUEST`. *(В `validateLineParams:75-87` присутствует открытый дефект диагностики переполнения `normSq` — см. `D-3`.)*
   - `src/core/trace.ts` — иммутабельный журнал переходов `TRACE` с глубокой заморозкой состояний, запросов и свидетельств (`createTraceEntry`, `appendTraceEntry`, `clone*`, без криптографической канонизации JCS/SHA-256).
   - `src/core/l7IndependentVerifier.ts` — изолированный Zero-Trust верификатор **L7** (`verifyResult`, `verifyProcess`) с **алгоритмической/модульной изоляцией** (`0` рантайм-импортов из `L2`, `TRACE` и `operationRequest`, но поверх общей арифметики `IEEE-754 f64` в одном процессе), игнорированием `claimedResiduals`, проверкой `requestBound` / `witnessBound`, масштаб-инвариантных аксиом $r_{\text{mid}}, r_{\text{perp}}$, scope-aware инвариантов и строгого `stepIndex`. Вердикты ограничены `PASS | FAIL | UNDETERMINED`. *(В коде сохраняются открытые ограничения/дефекты `D-1`, `D-2`, `D-4`, `D-5`.)*
2. **Клиентский стенд (`src/components/VerificationWorkbench.tsx`, `src/App.tsx`):**
   - Интерактивная визуализация 2D-отражения, журнала `TRACE`, проверок `L7` и паспорта проекта.
3. **Сопутствующие статические артефакты репозитория:**
   - `public/assets/aistudio/` содержит **17** исторических файлов (2 PDF + 15 `.md`, включая дубликаты), которые Vite при сборке копирует в `dist/assets/aistudio/` (`D-6`, сохранены намеренно по `ROD-02`/`OD-05`); в корне снимка AI Studio присутствует `bun.lock` наряду с актуальным `package-lock.json` (`.git` отсутствует).

**Что НЕ реализовано в коде (строгая граница честности):** слои `L1` (`FACE_SUBDIVISION`), `L3`, `L4`, `L5`, `L6`, статус `CAPABILITY_GAP` / `NOT_APPLICABLE`, криптографическая привязка `TRACE` (JCS + SHA-256), интервальная/`BigInt`-арифметика, исправления дефектов `D-1`–`D-5`, шестиуровневый классификатор `classifyPropertyF` (`tests/propertyF_v1.test.ts` ожидает `ROD-03`), а также любые программные модули `CRP-01 / MCAR`, `PWRP` и координационного слоя рассуждений.

---

## B2. `TESTED` — Зафиксировано в реальных тестовых файлах (`tests/*`)

Подтверждено статической инспекцией `tests/contract02.test.ts` и `tests/metamorphic.test.ts` (`36` блоков `test(...)` на диске; при документационной сверке команды `npm test` / `npm run lint` / `npm run build` повторно не запускались, каталог `dist/` отсутствует — исторические прогоны зафиксированы в `PHASE_2_2_IMPLEMENTATION_REPORT.md`, `PHASE_2_3_STEP_1..3_REPORT.md` и `BASELINE_INTEGRITY_CHECK_REPORT.md`):

1. **`tests/contract02.test.ts` — `19` контрактных тестов (`C02-01..C02-19`):**
   - Позитивные и негативные проверки `OperationRequest → L2 ↔ TRACE ↔ L7`, согласованная подмена свидетельства, масштабная инвариантность уравнения прямой, частичное отражение, вырожденные входы, разрывы `TRACE`, проверка `stepIndex`, глубокая заморозка и статическая проверка отсутствия рантайм-импортов `L2`/`TRACE`/`operationRequest` в `L7`.
2. **`tests/metamorphic.test.ts` — `17` метаморфных тестов:**
   - `13` тестов свойств `Properties A–E`;
   - `4` базовых теста **`Property F`** (строки `1375–1718`): `Property F1` (полное отражение по 4 осям на треугольных сетках), `Property F2` (частичное отражение: `moving` / `fixed` / `mixed` в базовой форме), `Property F3` (1 вершина на оси + коллинеарная грань на оси без вызова `L7`) и `Phase 2.3.3 Negative Controls`: `NC-F1`, `NC-F2`, `NC-F3` и `Independent D vs F Rotation Control`.
3. **Честная граница тестового слоя `Property F` (пять уровней состояния):**
   - *(a) Спецификация `Property F` полностью оформлена (`DOCUMENTED`);*
   - *(b) В `tests/metamorphic.test.ts` фактически реализованы и присутствуют (`TESTED`) базовые `F1–F3`, `NC-F1..NC-F3` и Rotation Control;*
   - *(c) Полный 6-уровневый классификатор `classifyPropertyF` (6 взаимоисключающих исходов `HOLDS | VIOLATION | FIXED_UNCHANGED | FIXED_CHANGED | MIXED_NOT_APPLICABLE | DEGENERATE_NOT_EVALUATED`) и `tests/propertyF_v1.test.ts` в коде **НЕ реализованы** (`DOCUMENTED / PROPOSED`, `0` упоминаний в `src/` и `tests/`);*
   - *(d) План из `15` мутаций (`PF1-MUT-01..15`) только спроектирован (`PROPOSED`);*
   - *(e) В текущей сверке выполнена статическая проверка кода и контрольных сумм SHA-256 без свежего рантайм-запуска тестов; ветка `tests/propertyF_v1.test.ts` ждёт решения владельца (`ROD-03: WAITING FOR EXPLICIT OWNER AUTHORIZATION`).*

---

## B3. `DOCUMENTED` — Исследовано и описано в проектной документации (без реализации в коде)

1. **Проектные спецификации ядра и адаптеров (`docs/`):**
   - Архитектура не реализованных пока слоёв `L1`, `L3–L6`, `Contract 01`, `Tool Integration Layer` (`FOLD`, `ToolAdapter`) и `AI Skill` (Phase 8).
2. **Пакет инженерной консолидации `Phase 2.3.3` (`Property F Test Layer v1`):**
   - Полная спецификация Варианта B (`PHASE_2_3_3_REIMPLEMENTATION_SPEC.md`, `PHASE_2_3_3_TEST_MATRIX_V2.md`, `PROPERTY_F_TEST_LAYER_V1.md`, `PHASE_2_3_3_PROPERTY_F_SPECIFICATION.md`, `PHASE_2_3_3_PROPERTY_F_VALIDATION.md`), закрытие аудита `AUD-A01..F01` (`PHASE_2_3_3_AUDIT_FINDINGS_RESOLUTION.md`), процедурные решения `ROD-01`, `ROD-02` (`APPROVED`) и ожидание `ROD-03` (`PHASE_2_3_3_OWNER_DECISIONS.md`).
   - Документированный каталог известных дефектов и ограничений **`D-1` — `D-8`**:
     - `D-1`: нецентрированная Shoelace в `L7` (`l7IndependentVerifier.ts:81-90`);
     - `D-2`: абсолютный порог вырожденности `degenerateAreaEpsilon = 1e-12` (`L7:50, 896`) + `<` vs `<=` в базовом тесте (`metamorphic.test.ts:1411, 1457`);
     - `D-3`: вводящее в заблуждение `DEGENERATE_NORMAL` при переполнении `normSq` в `L2` (`l2GeometryEngine.ts:75-87`);
     - `D-4`: наследование `areaEpsilon: overrides?.areaEpsilon ?? epsilon` (`L7:59`);
     - `D-5`: вакуумный `L7 PASS` с `orientationInverted: true` при 0 чисто движущихся граней (`L7:847, 934, 945-947`);
     - `D-6`: рассинхрон ранних документов и 17 исторических файлов в `public/assets/aistudio/` (копируемых Vite в `dist/assets/aistudio/`);
     - `D-7`: пробелы базовых 4 тестов `Property F` в `tests/metamorphic.test.ts` + двухполитическая полоса допусков оракул vs `L7` (`OD-02`, `AUD-D01`);
     - `D-8`: расхождение размера JS-бандла в прошлых отчётах (`562.64 kB` vs `335.25 kB`, статус причины — `UNRESOLVED`).
3. **Пакет `CRP-01 / MCAR` (`MCAR_*.md`):**
   - Исследование конструктивного мышления (`Whole Structure ≠ Single Piece`), 4 парадигмы порождения (`Single-Piece`, `Modular`, `Hybrid`, `Multi-Part Enclosure`), модель из 8+4 характеристик, таксономия соединений, 6 эпистемических правил, сценарная валидация `M1–M9` и обоснование выделения отдельно от `PWRP`.
4. **Пакет `PWRP v1.1` (`PWRP_V1_1_*.md`, поверх базы `PWRP v1.0`):**
   - Таксономия из 14 паттернов (6 макро-осей с 13 физическими паттернами `PWRP-01..09, 11..14` + мета-уровень `PWRP-10`), разведение пар `01/05`, `06/09`, `08/13`, `04/14`, `11/12`, проверка на `S1–S16` и границы непокрытых физических доменов.
5. **Межархитектурные аудиты и 4-уровневое разделение корректности:**
   - `OMR_CROSS_ARCHITECTURE_AUDIT.md`, `OMR_REASONING_FLOW_PROPOSAL.md`, `OMR_ARCHITECTURE_BOUNDARIES.md` (вердикт `CONSISTENT WITH REVISIONS`);
   - `OMR_INTERFACE_CONTRACT_AUDIT.md`, `OMR_EPISTEMIC_VECTOR_SPECIFICATION.md`, `OMR_REASONING_LOOP_CONTROL_SPECIFICATION.md` (вердикт `INTERFACES DEFINED WITH GAPS`).
   - Закреплено строгое различение: **математической корректности** (`OMR L2/L7`), **конструктивной корректности** (`CRP-01 / MCAR`), **кинематической достижимости** (`OMR L4` — запланировано) и **физической осуществимости** (`PWRP v1.1`).

---

## B4. `PROPOSED` — Сформулированные, но НЕ утверждённые владельцем предложения

Следующие решения оформлены в документах и аудитах как инженерные предложения (`PROPOSED`) и **не являются действующим каноном или кодом**:
1. **Реализация `Property F Test Layer v1` (`tests/propertyF_v1.test.ts` + 15 мутаций):** ожидает `ROD-03: WAITING FOR EXPLICIT OWNER AUTHORIZATION`.
2. **Исправления дефектов ядра `D-1`–`D-5` в будущей `Phase 2.4`:** центрирование Shoelace в `L7` (`D-1`), масштабно-относительный критерий вырожденности (`D-2`), раздельная диагностика переполнения `normSq` в `L2` (`D-3`), отвязка `areaEpsilon` от `epsilon` (`D-4`), введение `NOT_APPLICABLE` или диагностики при 0 движущихся граней (`D-5`), возможная стандартизация `Face2D.vertexIds` (`AUD-C01`).
3. **Трёхосевой эпистемический вектор** `Verdict = (M_OMR, C_MCAR, P_PWRP-10)` с матрицей допустимых комбинаций, картой условных веток `BranchVerdicts` и асимметричной независимостью осей.
4. **Контракты обмена между подсистемами:**
   - `MCAR → OMR` с маркером `HYPOTHESIS_SCOPED` и запретом вывода однолистовой трассы при `COMPONENT_PROVENANCE = UNKNOWN`;
   - `OMR → PWRP` с отделением математических фактов `L7` от конструктивных входов `MCAR` и физических параметров;
   - `PWRP → MCAR / OMR` (`PhysicalFeedbackPayload`) с нелинейными возвратами управления и **сохранением уже доказанных подрезультатов `L7 PASS`** (`preservedValidSubResults`).
5. **Механизм контроля циклов рассуждений:** `BRANCH_IDENTITY` (каноническая подпись `CanonicalBranchSignature`), `REJECTION_RECORD`, предикаты `REOPEN_CONDITION`, раздельный `RETURN_DEPTH` (`modeSwitchBacktracks` / `jointRevisionBacktracks`) и `LOOP_DETECTION`.
6. **Разделение происхождения накопления в `PWRP-07`:** `LAYER_ACCUMULATION` vs `MODULE_TOLERANCE_ACCUMULATION` vs `HYBRID_STACK` в структуре `AccumulationRecord`.
7. **Исследовательский трек проекта:** `OMR — Integrated Engineering Reasoning Architecture` (связывание конструктивного, математического и физического рассуждения без изменения ядра `L1–L7`).

---

## B5. `UNRESOLVED` — Открытые вопросы (сохранены без искусственного закрытия)

- **Размер JS-бандла (`D-8`):** причина расхождения `562.64 kB` vs `335.25 kB` в отчётах прошлых сборок — **`UNRESOLVED`** (в данной сверке сборка не выполнялась, `dist/` отсутствует, гипотезы не утверждены как причина).
- **Статус `L7` при 0 движущихся граней (`D-5`) и полоса допусков (`D-7`):** контрактное решение по вакуумному `PASS` / `NOT_APPLICABLE` и официальное утверждение политики расхождения оракула vs `L7` на Phase 2.4.
- **Прочие технические вопросы `OMR Core` / `Phase 2.3.3`:** `ROD-03` (`WAITING FOR EXPLICIT OWNER AUTHORIZATION`), `AUD-C01` (`Face2D.vertexIds` в Contract 02 v3), `D-1..D-4` целевые решения в Phase 2.4, `OD-05` (архивирование 17 файлов `public/assets/aistudio/` вне Phase 2.3.3).
- **Эпистемический вектор:** `EV-U01` (`OBSERVED_ONLY` vs `UNDETERMINED`/`NOT_APPLICABLE`), `EV-U02` (статус `Multi-Part Enclosure` в `C_MCAR`), `EV-U03` (упразднение `MATHEMATICALLY_VALID` в перечне `PWRP-10`).
- **Контроль циклов и идентичность гипотез:** `LC-U01` (канонизация 3D-разбиений), `LC-U02` (лимиты возвратов), разделение `STRUCTURAL_SIGNATURE` и `CONFIGURATION_SIGNATURE`.
- **Мультикомпонентность и интерфейсы с ядром:** `MCAR-O01..O06` (включая `MCAR-O02`: мультикомпонентность в будущем `L1`), точная композиция `HYBRID_STACK` в `PWRP-07`, строгие схемы обмена данными.
- **Физика и метрология `PWRP`:** `PWRP-O01..O13` (сжимаемость пакета, $n \to n^3$, многовершинные узлы при $t>0$, калибровка, каузальные цепочки).

*(Полный детализированный перечень сведён в [`OMR_ARCHITECTURE_OPEN_QUESTIONS.md`](./OMR_ARCHITECTURE_OPEN_QUESTIONS.md).)*
