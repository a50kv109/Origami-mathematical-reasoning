# OMR — Project Documentation Inventory (`OMR_DOCUMENTATION_INVENTORY.md`)

**Версия:** OMR Project Documentation Consolidation v1.1 (Reconciled)  
**Дата инвентаризации:** 2026-11-17  
**Режим проверки:** Read-Only аудит фактической файловой структуры рабочего пространства AI Studio (без `.git`; в корне присутствует `bun.lock` наряду с актуальным `package-lock.json`; `dist/` отсутствует).  
**Принцип статусов:** Разграничиваются инженерные статусы **`IMPLEMENTED`** (код `src/*`), **`TESTED`** (проверочные наборы `tests/*` на диске, с разделением статической проверки от рантайм-запуска), **`DOCUMENTED`**, **`PROPOSED`** и **`UNRESOLVED`**; а для жизненного цикла документов — `ACCEPTED` (только при явном подтверждении владельца), `CURRENT`, `PROPOSED`, `UNRESOLVED`, `HISTORICAL`, `SUPERSEDED`.

---

## 1. Общая проектная и архитектурная документация (`/` и `docs/`)

| № | Название документа | Назначение | Статус | Архитектурный уровень | Актуальность | Связанные документы | Нужда в обновлении | Сохранение без изменений |
| :- | :--- | :--- | :- | :--- | :--- | :--- | :--- | :--- |
| 1 | `README.md` | Корневой обзор OMR `v0.1.0`, `36` тестов (`19+17`), границы `L7`, дефекты `D-1`–`D-8`, roadmap и ссылки | `CURRENT` | Общий проект | Синхронизирован с кодом, тестами (`36`), статусом `Property F` и `D-1`–`D-8` | `CHANGELOG.md`, `PROJECT_ARCHITECTURE_STATUS.md`, `DOCUMENTATION_RECONCILIATION_REPORT.md` | Обновлён при сверке | Базовая структура `v0.1.0` сохранена |
| 2 | `CHANGELOG.md` | Хронология изменений релиза (`Keep a Changelog`) | `CURRENT` *(секция `[0.1.0]` историческая с неточностью по `public/assets/aistudio/`)* | Общий проект | Актуализирована `[Unreleased]` с явной фиксацией 17 файлов `public/assets/aistudio/` | `README.md`, `RELEASE_NOTES.md`, `DOCUMENTATION_RECONCILIATION_REPORT.md` | Обновлена `[Unreleased]` | Секция `[0.1.0]` намеренно не переписывалась |
| 3 | `RELEASE_NOTES.md` | Состав и ограничения software-релиза `v0.1.0` | `HISTORICAL` *(релизный снимок)* | Общий проект | Отражает конкретный срез `v0.1.0` (2026-11-15) | `CHANGELOG.md`, `README.md` | **Нет** *(нового релиза кода не было)* | **Сохранить полностью нетронутым** |
| 4 | `CONTRIBUTING.md` | Правила изоляции `L7`, лицензирования и тестирования | `CURRENT` | Инженерный процесс | Актуально | `docs/ARCHITECTURE.md`, `tests/*` | Нет | Сохранить без изменений |
| 5 | `docs/ARCHITECTURE.md` | Семислойная архитектура `L1–L7` и `Contract 02 v2` (`v0.1.0`) | `CURRENT` *(по ядру `L1–L7`)* | Архитектура ядра `OMR` | Актуален для `L1–L7` (`Phase 2.2`) | `OMR_ARCHITECTURE_MAP.md`, `src/core/*` | Нет *(защищено §2)* | **Не изменять** |
| 6 | `docs/DEVELOPMENT_ROADMAP.md` | Дорожная карта `Phase 1–8` математического ядра | `CURRENT` *(по `Phase 1–8`)* | Планирование ядра | Актуален для ядра `L1–L7` | `OMR_RESEARCH_REGISTER.md` | Нет *(включается ссылкой в реестр)* | Не изменять |
| 7 | `docs/FIRST_PROTOTYPE_SPEC.md` | Спецификация прототипа `L2 ↔ L7` | `CURRENT` | Ядро `L2 ↔ L7` | Актуален для `Phase 2.2` | `docs/ARCHITECTURE.md` | Нет | Не изменять |
| 8 | `docs/REPOSITORY_STRUCTURE.md` | Структура каталогов `v0.1.0` и целевой модульности | `CURRENT` *(снимок `v0.1.0`)* | Инженерная структура | Актуален на `v0.1.0` (без корневых отчётов 2.3/PWRP/MCAR) | `OMR_DOCUMENTATION_INVENTORY.md` | Нет | Не изменять |
| 9 | `docs/PROJECT_README.md`, `docs/TOOL_INTEGRATION_ARCHITECTURE.md`, `docs/RESEARCH_BASE.md`, `docs/SOURCE_REGISTRY.md`, `docs/REUSE_AND_GAP_ANALYSIS.md`, `docs/RESEARCH_L2_L7_SOURCES.md`, `docs/MODULAR_MATHEMATICAL_IDENTITY.md` | Исследовательская база Phase 1–2 и архитектура будущих адаптеров (`FOLD`, `ToolAdapter`) | `CURRENT` *(база Phase 1–2)* | Исследования и адаптеры | Актуально как опорный источник | `RESEARCH_INTEGRATION_V1.md`, `OMR_ARCHITECTURE_EVOLUTION.md` | Нет | Сохранить без изменений |

---

## 2. Исторические отчёты релизов, аудитов и этапов Phase 2.1 – 2.3.2

| № | Название документа | Назначение | Статус | Архитектурный уровень | Актуальность | Связанные документы | Обновление / Сохранение |
| :- | :--- | :--- | :- | :--- | :--- | :--- | :--- |
| 10 | `ACCEPTANCE_AUDIT_V1.md`, `PHASE_2_IMPLEMENTATION_REPORT.md` | Аудит и отчёт раннего прототипа до Phase 2.1 (`3×3` матрица) | `SUPERSEDED` | История Phase 2 | Заменены Phase 2.1 (`Contract 02 v2`) | `PHASE_2_1_IMPLEMENTATION_REPORT.md` | **Не менять, не удалять** (история) |
| 11 | `PHASE_2_1_IMPLEMENTATION_REPORT.md` | Отчёт о реализации Phase 2.1 (`v0.1.0`, `ReflectionWitness`, 13 тестов) | `HISTORICAL` / `ACCEPTED` *(в рамках 2.1)* | История Phase 2.1 | Перекрыто расширением `OperationRequest` в Phase 2.2 | `PHASE_2_2_IMPLEMENTATION_REPORT.md` | Сохранить без изменений |
| 12 | `PHASE_2_2_IMPLEMENTATION_REPORT.md` | Отчёт реализации Phase 2.2 (`OperationRequest`, `requestBound`, 19 тестов) | `ACCEPTED` *(для кода `v0.1.0` Phase 2.2)* | Ядро `L2 ↔ L7` | Актуальное описание продакшн-ядра `src/core/*` | `src/core/*`, `tests/contract02.test.ts` | Сохранить без изменений |
| 13 | `RESEARCH_INTEGRATION_V1.md`, `ORI_STUDIO_INITIAL_AUDIT.md`, `ORI_STUDIO_GEOMETRY_ENGINE_REPORT.md` | Исследование внешних методов и аудит Ori Studio | `HISTORICAL` | Исследования Phase 1–2 | Историческая база решений | `docs/RESEARCH_L2_L7_SOURCES.md` | Сохранить без изменений |
| 14 | `RELEASE_READINESS_AUDIT_V1.md`, `RELEASE_PREPARATION_TASK_A_REPORT.md`, `RELEASE_PREPARATION_TASK_B_REPORT.md` | Подготовка и аудит выпуска `v0.1.0` | `HISTORICAL` | Релиз `v0.1.0` | Относится к 2026-11-15 | `RELEASE_NOTES.md` | Сохранить без изменений |
| 15 | `PHASE_2_3_METAMORPHIC_TEST_PLAN.md`, `PHASE_2_3_STEP_1_REPORT.md`, `PHASE_2_3_STEP_2_REPORT.md` | План и отчёты Phase 2.3.1 (24 теста) и Phase 2.3.2 (32 теста, `ACCEPTED`) | `ACCEPTED` *(для Steps 1–2)* | Тестирование ядра | Действующие тесты A–E в `tests/metamorphic.test.ts` | `CANONICAL_BASELINE_RECOVERY_REPORT.md` | Сохранить без изменений |
| 16 | `CANONICAL_BASELINE_RECOVERY_REPORT.md`, `BASELINE_INTEGRITY_CHECK_REPORT.md` | Синхронизация и верификация канонической базы `32/32` | `HISTORICAL` *(акт сверки от 2026-11-15)* | Baseline-контроль | Историческая фиксация до Step 3 (`36/36`) | `PHASE_2_3_STEP_3_REPORT.md` | Сохранить без изменений |
| 17 | `PHASE_2_3_STEP_3_REPORT.md` | Отчёт исправлений Phase 2.3.3 (`36/36`, `CONDITIONALLY ACCEPTED`) | `HISTORICAL` *(промежуточный этап 2.3.3)* | Тестирование Property F | Замещён новым инженерным пакетом 2.3.3 ниже | `PHASE_2_3_3_*` | Сохранить без изменений |

---

## 3. Пакет Phase 2.3.3 — Engineering Consolidation (`Property F`)

| № | Название документа | Назначение | Статус | Архитектурный уровень | Актуальность | Связанные документы | Обновление / Сохранение |
| :- | :--- | :--- | :- | :--- | :--- | :--- | :--- |
| 18 | `PHASE_2_3_3_ENGINEERING_CONSOLIDATION.md`, `PHASE_2_3_3_EVIDENCE_MATRIX.md`, `PHASE_2_3_3_CANDIDATE_SOURCE_RECOVERY.md`, `PHASE_2_3_3_ARCHIVE_FORENSIC_REPORT.md`, `PHASE_2_3_3_CANDIDATE_MANIFEST.md`, `PHASE_2_3_3_FINALIZATION_OPTIONS.md`, `PHASE_2_3_3_INTEGRATION_READINESS.md`, `PHASE_2_3_3_NUMERICAL_DOMAIN_DESIGN.md`, `PHASE_2_3_3_PROPERTY_F_SPECIFICATION.md`, `PHASE_2_3_3_PROPERTY_F_VALIDATION.md`, `PHASE_2_3_3_ACCEPTANCE_PROTOCOL.md`, `PHASE_2_3_3_DECISION_RECORD.md` | Форензика `D-1`–`D-8` и спецификация завершения Phase 2.3.3 (`Property F`) | `CURRENT` *(внутри трека 2.3.3)* / `HISTORICAL` *(для ранних версий до ревизии v1.2)* | Тестирование `Property F` | Отражают исследовательский контур Phase 2.3.3 без права менять код до `ROD-03` | `PHASE_2_3_3_REIMPLEMENTATION_SPEC.md`, `PHASE_2_3_3_OWNER_DECISIONS.md` | **Не изменять** *(сохраняется целостность 2.3.3)* |
| 19 | `PHASE_2_3_3_REIMPLEMENTATION_SPEC.md`, `PHASE_2_3_3_TEST_MATRIX_V2.md`, `PROPERTY_F_TEST_LAYER_V1.md`, `PHASE_2_3_3_PRE_IMPLEMENTATION_AUDIT.md`, `PHASE_2_3_3_AUDIT_FINDINGS_RESOLUTION.md`, `PHASE_2_3_3_OWNER_DECISIONS.md` | Финальная спецификация Варианта B (`Property F Test Layer v1`), закрытие аудита `AUD-A01..F01`, ворота `ROD-01/02 (APPROVED)` и `ROD-03 (WAITING FOR EXPLICIT OWNER AUTHORIZATION)` | `CURRENT` *(готовая спецификация; `ROD-01/02` `ACCEPTED/APPROVED`, `tests/propertyF_v1.test.ts` и `15` мутаций в статусе `PROPOSED` / не запускались)* | Тестирование `Property F` (`tests/propertyF_v1.test.ts` план) | Актуально (в `tests/metamorphic.test.ts` есть только `F1–F3`/`NC-F1..NC-F3`; классификатор не реализован) | `tests/metamorphic.test.ts`, `OMR_RESEARCH_REGISTER.md` (`R-02`) | **Не изменять** |
| 19a | `public/assets/aistudio/*` (17 файлов: 2 PDF + 15 `.md`, включая дубликаты) | Исторические вложения ранних сессий AI Studio | `HISTORICAL` *(актив сборки `dist/assets/aistudio/`)* | Артефакты среды (`D-6`, `OD-05`) | Сохраняются без изменений, удаления или перемещения согласно `ROD-02: APPROVED` | `PHASE_2_3_3_OWNER_DECISIONS.md`, `PHASE_2_3_3_ARCHIVE_FORENSIC_REPORT.md` | **Запрещено удалять / менять (`ROD-02`)** |

---

## 4. Исследовательский пакет `PWRP` (`v1.0` и `v1.1`)

| № | Название документа | Назначение | Статус | Архитектурный уровень | Актуальность | Связанные документы | Обновление / Сохранение |
| :- | :--- | :--- | :- | :--- | :--- | :--- | :--- |
| 20 | `PWRP_RESEARCH_REPORT.md`, `PWRP_PATTERN_CATALOG.md`, `PWRP_OMR_INTEGRATION_PROPOSAL.md`, `PWRP_OPEN_QUESTIONS.md`, `PWRP_SCENARIO_VALIDATION.md`, `PWRP_COVERAGE_MATRIX.md`, `PWRP_TAXONOMY_REVIEW.md` | Первоначальное исследование и сценарная валидация `PWRP v1.0` (`PWRP-01..10`) | `SUPERSEDED` *(таксономически перекрыты `v1.1`, но сохраняются как первичный источник выводов `v1.0`)* | Физическое рассуждение (`AI Skill` план) | Перекрыты `PWRP_V1_1_*`, `PWRP_OMR_INTEGRATION_PROPOSAL.md` остаётся опорным для `AI Skill` | `PWRP_V1_1_*`, `OMR_ARCHITECTURE_EVOLUTION.md` | **Не изменять, не удалять** |
| 21 | `PWRP_V1_1_TAXONOMY_PROPOSAL.md`, `PWRP_V1_1_PATTERN_CATALOG.md`, `PWRP_V1_1_COVERAGE_MATRIX.md`, `PWRP_V1_1_CHANGELOG.md` | Актуальная ревизия таксономии физического мира (`PWRP-01..14`, `13` физических + `PWRP-10` мета-уровень, 16 сценариев `S1–S16`) | `CURRENT` *(исследовательский пакет; статус `PROPOSED` для интеграции в `AI Skill`)* | Физическое рассуждение (`PWRP v1.1`) | Актуальный первичный источник `PWRP` | `OMR_ARCHITECTURE_MAP.md`, `OMR_CROSS_ARCHITECTURE_AUDIT.md`, `OMR_INTERFACE_CONTRACT_AUDIT.md` | **Не изменять** |

---

## 5. Исследовательский пакет `CRP-01 / MCAR`

| № | Название документа | Назначение | Статус | Архитектурный уровень | Актуальность | Связанные документы | Обновление / Сохранение |
| :- | :--- | :--- | :- | :--- | :--- | :--- | :--- |
| 22 | `MCAR_RESEARCH_REPORT.md`, `MCAR_PATTERN_PASSPORT.md`, `MCAR_SCENARIO_VALIDATION.md`, `MCAR_PWRP_RELATIONSHIP.md` | Исследование конструктивного мышления (`Whole Structure ≠ Single Piece`), 8+4 полей, соединений, `M1–M9`, обоснование выделения `CRP-01` отдельно от `PWRP` | `CURRENT` *(исследовательский пакет; статус `PROPOSED`)* | Конструктивное рассуждение (`CRP-01`) | Актуальный первичный источник `MCAR` | `OMR_ARCHITECTURE_MAP.md`, `OMR_CROSS_ARCHITECTURE_AUDIT.md`, `OMR_INTERFACE_CONTRACT_AUDIT.md` | **Не изменять** |

---

## 6. Межархитектурные аудиты и спецификации интеграции

| № | Название документа | Назначение | Статус | Архитектурный уровень | Актуальность | Связанные документы | Обновление / Сохранение |
| :- | :--- | :--- | :- | :--- | :--- | :--- | :--- |
| 23 | `OMR_CROSS_ARCHITECTURE_AUDIT.md`, `OMR_REASONING_FLOW_PROPOSAL.md`, `OMR_ARCHITECTURE_BOUNDARIES.md` | Первый межархитектурный аудит (`CONSISTENT WITH REVISIONS`): границы `CRP/PWRP/L1–L7`, нелинейный поток и возвраты | `PROPOSED` *(исследовательский аудит)* | Интеграционная архитектура | Актуально (уточнено вторым аудитом) | `OMR_INTERFACE_CONTRACT_AUDIT.md`, `OMR_ARCHITECTURE_MAP.md` | **Не изменять** |
| 24 | `OMR_INTERFACE_CONTRACT_AUDIT.md`, `OMR_EPISTEMIC_VECTOR_SPECIFICATION.md`, `OMR_REASONING_LOOP_CONTROL_SPECIFICATION.md` | Второй аудит (`INTERFACES DEFINED WITH GAPS`): контракты `MCAR↔OMR↔PWRP`, вектор `(M, C, P)`, контроль циклов, `PWRP-07` | `PROPOSED` / `UNRESOLVED` *(исследовательский аудит)* | Интеграционная архитектура | Актуальный первичный источник по интерфейсам | `OMR_ARCHITECTURE_DECISION_RECORD.md`, `OMR_ARCHITECTURE_OPEN_QUESTIONS.md` | **Не изменять** |

---

## 7. Пакет консолидации и сверки (`OMR Architecture Evolution Package` + `Reconciliation`)

Связующие документы верхнего уровня (обновлены без перезаписи исторических отчётов, кода и тестов):
- `OMR_DOCUMENTATION_INVENTORY.md` *(настоящий реестр, `CURRENT`)*
- `PROJECT_ARCHITECTURE_STATUS.md` *(объективное разделение `Implemented / Tested / Documented / Proposed / Unresolved`, `CURRENT`)*
- `OMR_ARCHITECTURE_EVOLUTION.md` *(хронология развития архитектуры, `CURRENT`)*
- `OMR_ARCHITECTURE_MAP.md` *(карта 3 областей знания, 4 областей корректности и координации, `CURRENT`)*
- `OMR_ARCHITECTURE_DECISION_RECORD.md` *(реестр решений, принципов и их статусов, `CURRENT`)*
- `OMR_RESEARCH_REGISTER.md` *(реестр треков `R-01..R-08`, `CURRENT`)*
- `OMR_ARCHITECTURE_OPEN_QUESTIONS.md` *(сводный реестр открытых вопросов и `D-1..D-8`, `UNRESOLVED`)*
- `OMR_DOCUMENTATION_CONSOLIDATION_REPORT.md` *(первичный отчёт консолидации v1.0, `HISTORICAL / SUPERSEDED` в части расхождений, закрытых сверкой)*
- `DOCUMENTATION_RECONCILIATION_REPORT.md` *(итоговый отчёт документационной сверки расхождений с фактическим состоянием кода и файлов, `CURRENT`)*
