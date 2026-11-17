# Project Architecture Status — Origami Mathematical Reasoning (`PROJECT_ARCHITECTURE_STATUS.md`)

**Версия документа:** Architecture Evolution Package v1.0 (Phase B)  
**Дата фиксации:** 2026-11-17  
**Основополагающий тезис проекта:**  
> *OMR развивается от специализированного математического ядра к модульной архитектуре инженерного рассуждения. Математическая корректность, конструктивное происхождение и физическая осуществимость рассматриваются как самостоятельные области знания. Их взаимодействие организуется через явно определённые интерфейсы, сохранение происхождения доказательств и контроль эпистемических состояний. Исследование интеграции этих областей является отдельным направлением развития проекта и не предполагает автоматического изменения существующего математического ядра.*

---

## B1. `IMPLEMENTED` — Фактически реализовано в исходном коде и подтверждено тестами

Подтверждено чтением `src/core/*`, `tests/*` и отчётами `PHASE_2_2_IMPLEMENTATION_REPORT.md`, `PHASE_2_3_STEP_2_REPORT.md`, `PHASE_2_3_STEP_3_REPORT.md`, `PHASE_2_3_3_OWNER_DECISIONS.md`:

1. **Математическое ядро OMR (`src/core/*`, TypeScript `"strict": true`):**
   - `src/core/types.ts` — чистые иммутабельные типы `Contract 02 v2` (`GeometryState`, `LineNormalParams`, `OperationRequest`, `ReflectionWitness`, `TraceEntry`, `VerificationClaim`, `VerificationVerdict`, `VerifierTolerances`), хранение координат в двойной точности IEEE-754 без округления.
   - `src/core/operationRequest.ts` — фабрика `createOperationRequest` и `cloneOperationRequest` с `deepFreeze`, явной привязкой к `sourceStateId` / `sourceStateVersion` и дизъюнктным разбиением `movingVertexIds` / `fixedVertexIds`.
   - `src/core/l2GeometryEngine.ts` — слой **L2** для единственной геометрической операции `REFLECTION_ACROSS_LINE` ($p' = p - 2\frac{n\cdot p - c}{n\cdot n}n$) по доверенному `OperationRequest`, выпуск `ReflectionWitness`, проверка `REQUEST_STATE_MISMATCH` и `INVALID_OPERATION_REQUEST`.
   - `src/core/trace.ts` — иммутабельный журнал переходов `TRACE` с глубокой заморозкой состояний, запросов и свидетельств (`createTraceEntry`, `appendTraceEntry`, `clone*`).
   - `src/core/l7IndependentVerifier.ts` — изолированный Zero-Trust верификатор **L7** (`verifyResult`, `verifyProcess`) с нулевым рантайм-импортом из `L2`, `TRACE` и `operationRequest`, игнорированием `claimedResiduals`, проверкой `requestBound` / `witnessBound`, масштаб-инвариантных аксиом $r_{\text{mid}}, r_{\text{perp}}$, scope-aware инвариантов и строгого `stepIndex`. Вердикты ограничены `PASS | FAIL | UNDETERMINED`.
2. **Автоматическое тестовое покрытие (`tests/*`):**
   - `tests/contract02.test.ts` — 19 тестов контракта `L2 ↔ L7` и `OperationRequest`.
   - `tests/metamorphic.test.ts` — 17 базовых тестов (Properties A–E и базовая ремедиация F на момент Step 3; суммарно 36 существующих тестов зафиксированы как неизменяемая база в `PHASE_2_3_3_OWNER_DECISIONS.md`).
3. **Клиентский стенд (`src/components/VerificationWorkbench.tsx`, `src/App.tsx`):**
   - Интерактивная визуализация 2D-отражения, журнала `TRACE`, проверок `L7` и паспорта проекта.

**Что НЕ реализовано в коде (строгая граница честности):** слои `L1` (`FACE_SUBDIVISION`), `L3`, `L4`, `L5`, `L6`, статус `CAPABILITY_GAP`, криптографическая привязка `TRACE` (JCS + SHA-256), интервальная/`BigInt`-арифметика, `tests/propertyF_v1.test.ts` (ожидает `ROD-03`), а также любые программные модули `CRP-01 / MCAR`, `PWRP` и координационного слоя рассуждений.

---

## B2. `DOCUMENTED` — Исследовано и описано в проектной документации (без реализации в коде)

1. **Проектные спецификации ядра и адаптеров (`docs/`):**
   - Архитектура не реализованных пока слоёв `L1`, `L3–L6`, `Contract 01`, `Tool Integration Layer` (`FOLD`, `ToolAdapter`) и `AI Skill` (Phase 8).
2. **Пакет инженерной консолидации `Phase 2.3.3` (`Property F Test Layer v1`):**
   - Полная спецификация Варианта B (`PHASE_2_3_3_REIMPLEMENTATION_SPEC.md`, `PHASE_2_3_3_TEST_MATRIX_V2.md`, `PROPERTY_F_TEST_LAYER_V1.md`), закрытие аудита `AUD-A01..F01` (`PHASE_2_3_3_AUDIT_FINDINGS_RESOLUTION.md`), процедурные решения `ROD-01`, `ROD-02` (`APPROVED`) и ожидание `ROD-03` (`PHASE_2_3_3_OWNER_DECISIONS.md`).
3. **Пакет `CRP-01 / MCAR` (`MCAR_*.md`):**
   - Исследование конструктивного мышления (`Whole Structure ≠ Single Piece`), 4 парадигмы порождения (`Single-Piece`, `Modular`, `Hybrid`, `Multi-Part Enclosure`), модель из 8+4 характеристик, таксономия соединений, 6 эпистемических правил, сценарная валидация `M1–M9` и обоснование выделения отдельно от `PWRP`.
4. **Пакет `PWRP v1.1` (`PWRP_V1_1_*.md`, поверх базы `PWRP v1.0`):**
   - Таксономия из 14 паттернов (6 макро-осей с 13 физическими паттернами `PWRP-01..09, 11..14` + мета-уровень `PWRP-10`), разведение пар `01/05`, `06/09`, `08/13`, `04/14`, `11/12`, проверка на `S1–S16` и границы непокрытых физических доменов.
5. **Межархитектурные аудиты:**
   - `OMR_CROSS_ARCHITECTURE_AUDIT.md`, `OMR_REASONING_FLOW_PROPOSAL.md`, `OMR_ARCHITECTURE_BOUNDARIES.md` (вердикт `CONSISTENT WITH REVISIONS`);
   - `OMR_INTERFACE_CONTRACT_AUDIT.md`, `OMR_EPISTEMIC_VECTOR_SPECIFICATION.md`, `OMR_REASONING_LOOP_CONTROL_SPECIFICATION.md` (вердикт `INTERFACES DEFINED WITH GAPS`).

---

## B3. `PROPOSED` — Сформулированные, но НЕ утверждённые владельцем предложения

Следующие решения оформлены в аудитах как инженерные предложения (`PROPOSED`) и **не являются действующим каноном**:
1. **Трёхосевой эпистемический вектор** `Verdict = (M_OMR, C_MCAR, P_PWRP-10)` с матрицей допустимых комбинаций, картой условных веток `BranchVerdicts` и асимметричной независимостью осей.
2. **Контракты обмена между подсистемами:**
   - `MCAR → OMR` с маркером `HYPOTHESIS_SCOPED` и запретом вывода однолистовой трассы при `COMPONENT_PROVENANCE = UNKNOWN`;
   - `OMR → PWRP` с отделением математических фактов `L7` от конструктивных входов `MCAR` и физических параметров;
   - `PWRP → MCAR / OMR` (`PhysicalFeedbackPayload`) с нелинейными возвратами управления и **сохранением уже доказанных подрезультатов `L7 PASS`** (`preservedValidSubResults`).
3. **Механизм контроля циклов рассуждений:** `BRANCH_IDENTITY` (каноническая подпись `CanonicalBranchSignature`), `REJECTION_RECORD`, предикаты `REOPEN_CONDITION`, раздельный `RETURN_DEPTH` (`modeSwitchBacktracks` / `jointRevisionBacktracks`) и `LOOP_DETECTION`.
4. **Разделение происхождения накопления в `PWRP-07`:** `LAYER_ACCUMULATION` vs `MODULE_TOLERANCE_ACCUMULATION` vs `HYBRID_STACK` в структуре `AccumulationRecord`.
5. **Новый исследовательский трек проекта:** `OMR — Integrated Engineering Reasoning Architecture` (связывание конструктивного, математического и физического рассуждения без изменения ядра `L1–L7`).

---

## B4. `UNRESOLVED` — Открытые вопросы (сохранены без искусственного закрытия)

- **Эпистемический вектор:** `EV-U01` (`OBSERVED_ONLY` vs `UNDETERMINED`/`NOT_APPLICABLE`), `EV-U02` (статус `Multi-Part Enclosure` в `C_MCAR`), `EV-U03` (упразднение `MATHEMATICALLY_VALID` в перечне `PWRP-10`).
- **Контроль циклов и идентичность гипотез:** `LC-U01` (канонизация 3D-разбиений), `LC-U02` (лимиты возвратов), разделение `STRUCTURAL_SIGNATURE` и `CONFIGURATION_SIGNATURE`.
- **Мультикомпонентность и интерфейсы с ядром:** `MCAR-O01..O06` (включая `MCAR-O02`: мультикомпонентность в будущем `L1`), точная композиция `HYBRID_STACK` в `PWRP-07`, строгие схемы обмена данными.
- **Физика и метрология `PWRP`:** `PWRP-O01..O13` (сжимаемость пакета, $n \to n^3$, многовершинные узлы при $t>0$, калибровка, каузальные цепочки).
- **Технические вопросы вне архитектуры интеграции:** `Phase 2.3.3` ожидание `ROD-03`, `AUD-C01` (`Face2D` в Contract 02 v3), `D-3` (`normSq = Infinity` в `L2`), `D-8` (разница размера JS-бандла), `OD-05` (`public/assets/aistudio/`).

*(Полный детализированный перечень сведён в [`OMR_ARCHITECTURE_OPEN_QUESTIONS.md`](./OMR_ARCHITECTURE_OPEN_QUESTIONS.md).)*
