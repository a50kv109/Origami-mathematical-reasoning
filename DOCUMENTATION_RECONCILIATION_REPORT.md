# OMR Documentation Reconciliation Report (`DOCUMENTATION_RECONCILIATION_REPORT.md`)

**Дата сверки:** 2026-11-17  
**Режим выполнения:** Строго документационная сверка (*Documentation-Only Reconciliation*). Исходный код (`src/**`), тесты (`tests/**`), зависимости и конфигурация (`package*.json`, `tsconfig.json`, `vite.config.ts`), активы (`public/assets/aistudio/**`), релизные снимки (`RELEASE_NOTES.md`), исторические отчёты `Phase 2.x` / `PHASE_2_3_3_*`, исследовательские пакеты `MCAR_*`, `PWRP_*` и исходные аудиты **не изменялись**. Сборка `npm run build` и тесты `npm test` не запускались (`dist/` отсутствует).

---

## 1. Устранённые расхождения между документацией и реальной кодовой базой

1. **Число и состав автотестов (`README.md`, `PROJECT_ARCHITECTURE_STATUS.md`, `OMR_ARCHITECTURE_EVOLUTION.md`, `OMR_RESEARCH_REGISTER.md`):**
   - *Было:* `README.md` (разделы 2, 8, 10) отражал срез `19/19` тестов `tests/contract02.test.ts` (Phase 2.2), не учитывая `tests/metamorphic.test.ts`; в сводных документах статус `TESTED` не был выделен отдельно от `IMPLEMENTED`, а граница `Property F` могла считываться неоднозначно.
   - *Стало:* Зафиксирован точный состав на диске (**`36` тестов**: `19` в `tests/contract02.test.ts` + `17` в `tests/metamorphic.test.ts`), выделена категория **`TESTED`**, и чётко разграничены статический подсчёт/инспекция кода vs отсутствие свежего рантайм-прогона `npm test` в данном цикле.
2. **Пятиуровневая граница `Property F` (`Phase 2.3.3`):**
   - *Зафиксировано без искажений:*
     - *(a)* полная спецификация Варианта B оформлена (`DOCUMENTED` в `PHASE_2_3_3_*`, `PROPERTY_F_TEST_LAYER_V1.md`);
     - *(b)* в `tests/metamorphic.test.ts` (строки `1375–1718`) фактически присутствуют (`TESTED`) `4` базовых теста: `F1`, `F2`, `F3`, `NC-F1..NC-F3` + `Independent D vs F Rotation Control`;
     - *(c)* полный 6-уровневый классификатор `classifyPropertyF` (`HOLDS | VIOLATION | FIXED_UNCHANGED | FIXED_CHANGED | MIXED_NOT_APPLICABLE | DEGENERATE_NOT_EVALUATED`) и `tests/propertyF_v1.test.ts` **не реализованы** (`0` вхождений в `src/` и `tests/`);
     - *(d)* матрица из `15` мутаций (`PF1-MUT-01..15`) только спроектирована (`PROPOSED`);
     - *(e)* свежие рантайм-прогоны и мутации не выполнялись; работа над `tests/propertyF_v1.test.ts` заблокирована до явного решения владельца **`ROD-03: WAITING FOR EXPLICIT OWNER AUTHORIZATION`**.
3. **Каталог известных дефектов и ограничений `D-1` — `D-8`:**
   - *Было:* Часть дефектов `D-1`–`D-8` присутствовала только в разрозненных документах `PHASE_2_3_3_*`, не отражалась в `README.md`, `PROJECT_ARCHITECTURE_STATUS.md`, `OMR_ARCHITECTURE_DECISION_RECORD.md`, `OMR_RESEARCH_REGISTER.md` и `OMR_ARCHITECTURE_OPEN_QUESTIONS.md`.
   - *Стало:* Все 8 пунктов **`D-1`–`D-8`** явно зафиксированы с точными ссылками на строки `src/core/l2GeometryEngine.ts`, `src/core/l7IndependentVerifier.ts`, `tests/metamorphic.test.ts` и с честной оговоркой, что ни один из них **не исправлен в коде**. Для **`D-8`** (разница размера JS-бандла `562.64 kB` vs `335.25 kB`) строго сохранён статус **`UNRESOLVED`** без домыслов о причине.
4. **Историческое расхождение по `public/assets/aistudio/` и среда рабочего пространства (`D-6`, `ROD-02`, `OD-05`):**
   - *Было:* В исторической секции `CHANGELOG.md ## [0.1.0]` значилась запись об удалении `public/assets/aistudio/`, при этом в корневом `README.md` отсутствовало пояснение по текущему состоянию каталога.
   - *Стало:* Сама историческая секция `[0.1.0]` в `CHANGELOG.md` **не переписывалась**, а в `[Unreleased]`, `README.md`, `PROJECT_ARCHITECTURE_STATUS.md`, `OMR_ARCHITECTURE_OPEN_QUESTIONS.md` и `OMR_DOCUMENTATION_INVENTORY.md` явно зафиксировано фактическое наличие **17** исторических файлов (2 PDF + 15 `.md`, включая дубликаты) в `public/assets/aistudio/`, которые Vite копирует в `dist/assets/aistudio/` и которые намеренно сохраняются нетронутыми согласно `ROD-02` / `OD-05`. Также отражено наличие `bun.lock` в корне снимка AI Studio (наряду с актуальным `package-lock.json`) и отсутствие `.git` в изолированном контейнере.
5. **Границы изоляции `L7` и 4 области корректности:**
   - В `README.md`, `PROJECT_ARCHITECTURE_STATUS.md`, `OMR_ARCHITECTURE_MAP.md` и `OMR_ARCHITECTURE_DECISION_RECORD.md` прямо зафиксировано, что изоляция `L7` является **алгоритмической и модульной** (нулевые рантайм-импорты из `L2`/`TRACE`/`operationRequest`), но работает в одном процессе поверх общей арифметики `IEEE-754 f64` и in-process `deepFreeze` (`Object.freeze`) без криптографической привязки.
   - Закреплено чёткое разграничение **четырёх несмешиваемых областей корректности**: математическая (`OMR L2/L7`), конструктивная (`CRP-01 / MCAR`), кинематическая достижимость (`OMR L4`, запланировано) и физическая осуществимость (`PWRP v1.1`), с сохранением 4 эпистемических принципов (`Producer claim ≠ Receiver truth`, `GSA — transport, not proof`, `UNKNOWN ≠ FALSE`, `Absence of physical verification ≠ physical infeasibility`).

---

## 2. Актуальная таблица статусов системы

| Компонент / направление | Статус | Фактическое основание на диске |
| :--- | :--- | :--- |
| Контракты `Contract 02 v2`, `OperationRequest`, 2D `L2` отражение, `TRACE` (`deepFreeze`), 4-этапный `L7`, веб-стенд UI | **`IMPLEMENTED`** | `src/core/*.ts`, `src/components/*.tsx`, `src/App.tsx` |
| Контрактные и базовые метаморфные тесты (`19` Contract 02 + `13` A–E + `4` базовых `Property F1–F3`, `NC-F1..NC-F3`, Rotation Control = `36` тестов) | **`TESTED`** *(в коде тестов на диске; в этой сверке рантайм-запуск не выполнялся)* | `tests/contract02.test.ts` (19), `tests/metamorphic.test.ts` (17) |
| Архитектура `L1`, `L3–L6`, `Contract 01`, адаптеры `ToolAdapter`; пакет `Phase 2.3.3` (`Spec`, `Validation`, `Matrix v2`, 6-уровневый `classifyPropertyF`, `D-1`–`D-7`); исследования `CRP-01/MCAR`, `PWRP v1.1` и оба межархитектурных аудита | **`DOCUMENTED`** | `docs/*`, `PHASE_2_3_3_*`, `PROPERTY_F_TEST_LAYER_V1.md`, `MCAR_*`, `PWRP_V1_1_*`, `OMR_*_AUDIT.md` |
| `tests/propertyF_v1.test.ts` + 15 мутаций; исправления `D-1`–`D-5` в `Phase 2.4`; трёхосевой вектор `(M_OMR, C_MCAR, P_PWRP-10)`, контракты `MCAR↔OMR↔PWRP`, контроль циклов, разделение `PWRP-07`, трек `Integrated Engineering Reasoning Architecture` | **`PROPOSED`** | `PHASE_2_3_3_OWNER_DECISIONS.md` (`ROD-03`), `OMR_ARCHITECTURE_DECISION_RECORD.md` |
| Причина разницы размера JS-бандла (`D-8`: `562.64` vs `335.25 kB`); ожидание `ROD-03`; `D-5` (статус `NOT_APPLICABLE` в L7); `AUD-C01` (`Face2D.vertexIds`); архивирование `public/assets/aistudio/` (`OD-05`); вопросы `EV-U01..U03`, `LC-U01..U02`, `OQ-*`, `MCAR-O*`, `PWRP-O*` | **`UNRESOLVED`** | `OMR_ARCHITECTURE_OPEN_QUESTIONS.md`, `PHASE_2_3_3_ARCHIVE_FORENSIC_REPORT.md` |

---

## 3. Список изменённых файлов и обоснование

| № | Файл | Причина изменения |
| :- | :--- | :--- |
| 1 | `README.md` | Синхронизированы состав тестов (`19 + 17 = 36`), границы `Property F` (`ROD-03`), алгоритмические/арифметические границы изоляции `L7`, раздел известных дефектов/ограничений `D-1`–`D-8`, состояние `public/assets/aistudio/` (17 файлов) и `bun.lock` |
| 2 | `CHANGELOG.md` | Добавлена честная запись о выполненной документационной сверке в секцию `## [Unreleased] / ### Documentation`; историческая секция `[0.1.0]` не изменялась |
| 3 | `PROJECT_ARCHITECTURE_STATUS.md` | Введена явная категория **`TESTED`** отдельно от `IMPLEMENTED`, `DOCUMENTED`, `PROPOSED`, `UNRESOLVED`; включены 5 границ `Property F`, каталог `D-1`–`D-8`, 4 области корректности и уточнённые границы `L7` |
| 4 | `OMR_ARCHITECTURE_EVOLUTION.md` | Уточнён Этап 3: фактические `17` тестов в `tests/metamorphic.test.ts` (включая базовые `F1–F3`, `NC-F1..NC-F3`, Rotation Control), отсутствие `classifyPropertyF` / `15` мутаций, ожидание `ROD-03` и фиксация `D-1`–`D-8` |
| 5 | `OMR_ARCHITECTURE_MAP.md` | Уточнены границы изоляции `L7` в `D1` и добавлен раздел `2a` с явным разграничением математической, конструктивной, кинематической и физической корректности |
| 6 | `OMR_ARCHITECTURE_DECISION_RECORD.md` | Синхронизированы `ADR-001` и `ADR-002` с `D-1`–`D-8` (включая `D-5`, `D-6`, `D-7`, `D-8`), 4 областями корректности и границами `L7` |
| 7 | `OMR_RESEARCH_REGISTER.md` | Обновлены треки `R-01` и `R-02`: состав тестов `36`, 5-уровневый статус `Property F`, дефекты `D-1`–`D-8` и статус `ROD-03` |
| 8 | `OMR_ARCHITECTURE_OPEN_QUESTIONS.md` | Добавлен сводный реестр технических дефектов и ограничений `D-1`–`D-8` со строгим сохранением `D-8` как `UNRESOLVED` и явной фиксацией `ROD-03` |
| 9 | `OMR_DOCUMENTATION_INVENTORY.md` | Актуализированы принцип статусов (`IMPLEMENTED/TESTED/DOCUMENTED/PROPOSED/UNRESOLVED`), карточки `README.md`, `CHANGELOG.md`, `Phase 2.3.3`, 17 файлов `public/assets/aistudio/`, наличие `bun.lock` и ссылка на настоящий отчёт |
| 10 | `DOCUMENTATION_RECONCILIATION_REPORT.md` | Создан настоящий итоговый отчёт сверки и верификации целостности |

---

## 4. Файлы и каталоги, намеренно сохранённые без изменений

- **Исходный код (`src/**`):** `src/core/l2GeometryEngine.ts`, `src/core/l7IndependentVerifier.ts`, `src/core/operationRequest.ts`, `src/core/trace.ts`, `src/core/types.ts`, `src/components/VerificationWorkbench.tsx`, `src/data/passportData.ts`, `src/App.tsx`, `src/main.tsx` *(ни `D-1`–`D-5`, ни другие правки кода не вносились)*.
- **Существующие тесты (`tests/**`):** `tests/contract02.test.ts` (`19` тестов), `tests/metamorphic.test.ts` (`17` тестов). Новый `tests/propertyF_v1.test.ts` не создавался (`ROD-03`).
- **Конфигурация и зависимости:** `package.json`, `package-lock.json`, `bun.lock`, `tsconfig.json`, `vite.config.ts`, `index.html`, `metadata.json`.
- **Публичные вложения (`public/assets/aistudio/**`):** все **17** файлов (2 PDF + 15 `.md`) полностью сохранены по `ROD-02` / `OD-05`.
- **Замороженные документы и исторические пакеты:** `RELEASE_NOTES.md`, `CONTRIBUTING.md`, весь каталог `docs/*` (включая `docs/ARCHITECTURE.md`, `docs/REPOSITORY_STRUCTURE.md`, `docs/DEVELOPMENT_ROADMAP.md`), все исторические отчёты (`ACCEPTANCE_AUDIT_V1.md`, `PHASE_2_*`, `RELEASE_*`, `RESEARCH_INTEGRATION_V1.md`, `ORI_STUDIO_*`, `CANONICAL_BASELINE_RECOVERY_REPORT.md`, `BASELINE_INTEGRITY_CHECK_REPORT.md`), пакет `Phase 2.3.3` (`PHASE_2_3_3_*`, `PROPERTY_F_TEST_LAYER_V1.md`), пакет `MCAR_*`, пакеты `PWRP_*` (`v1.0` и `v1.1`), оба межархитектурных аудита (`OMR_CROSS_ARCHITECTURE_AUDIT.md`, `OMR_REASONING_FLOW_PROPOSAL.md`, `OMR_ARCHITECTURE_BOUNDARIES.md`, `OMR_INTERFACE_CONTRACT_AUDIT.md`, `OMR_EPISTEMIC_VECTOR_SPECIFICATION.md`, `OMR_REASONING_LOOP_CONTROL_SPECIFICATION.md`) и первичный `OMR_DOCUMENTATION_CONSOLIDATION_REPORT.md`.

---

## 5. Проверка границ и контрольных сумм целостности (`SHA-256`)

Выполнена read-only проверка контрольных сумм в рабочей среде AI Studio **после** завершения правок документации:

| Артефакт | Наблюдаемый `SHA-256` | Состояние |
| :--- | :--- | :--- |
| `src/core/l2GeometryEngine.ts` | `0a06323947a436d85d6983c95849dd3e5a90d403e912a6f8eced7f511906abd4` | Идентичен baseline |
| `src/core/l7IndependentVerifier.ts` | `fad116688fec4c084203fb863aaa2b55be958ed3b9391336cc971cbb098e7786` | Идентичен baseline |
| `src/core/operationRequest.ts` | `9e5918ca7f58af33f438b8a37a2f266f62c927c17a315e6ea79b2ce4ef2472ca` | Идентичен baseline |
| `src/core/trace.ts` | `edb8454a4ccccf6848a06f8e67309ad0543d2830569af41912cba93d981d37be` | Идентичен baseline |
| `src/core/types.ts` | `438b7659f2318162ff96cbcc396bce753970a8aa4a33a8f45607d2475fa4680c` | Идентичен baseline |
| `tests/contract02.test.ts` | `a474d079b07adbbd6ed60150770c86205399e7bc4e83705a29b9df7686a40672` | Идентичен baseline |
| `tests/metamorphic.test.ts` | `284ba2c390e4e942c8755a831ff86586a9629066be1803859fa9daba68d587d8` | Идентичен baseline |
| `package.json` | `9aec8b0a8aeccdc1d81f7e878dd393109e8762b5f3c644ececf21804423d5f88` | Идентичен baseline |
| `package-lock.json` | `2efbc19485a8671091420bb92f83f7dcaf3ddf68282a8e7bfc2d54ec6a074c25` | Идентичен baseline |
| `tsconfig.json` | `edd557dbb099f6275d59d050f1408f3513b8a5961f15a325ffda72308129e5b0` | Идентичен baseline |
| `vite.config.ts` | `259008f9afe45913b761890c9f9cfd73084a01a812e60b17cce219693419cb91` | Идентичен baseline |
| `RELEASE_NOTES.md` | `3b74a97d3172f5b128b1e9dc6e31e0a897e9234ed93594853b1df979c34edc81` | Не изменён |
| `CONTRIBUTING.md` | `837ab0dd948b913973a18d5deff5f0680823bcc600ece6a0ffdf005bcfbc1c94` | Не изменён |
| `docs/ARCHITECTURE.md` | `04984d3fa5bd744d2423a00a7a6a43dcb319f0061ddc7c2a63f23b990b74f8e6` | Не изменён |

Дополнительные инварианты среды:
- `public/assets/aistudio/`: `17` файлов сохранены; `dist/` отсутствует (`DIST_ABSENT=true`); `bun.lock` присутствует в корне (`BUNLOCK_PRESENT=true`);
- Символы `classifyPropertyF`, `DEGENERATE_NOT_EVALUATED`, `MIXED_NOT_APPLICABLE`, `FIXED_CHANGED` в `src/` и `tests/` отсутствуют (`0` совпадений).

---

## 6. Оставшиеся открытые противоречия и вопросы

1. **Неустановленная причина `D-8` (`UNRESOLVED`):** разница размера JS-бандла (`562.64 kB` vs `335.25 kB` в отчётах сборок) не диагностирована.
2. **Ожидание решения владельца `ROD-03` (`WAITING FOR EXPLICIT OWNER AUTHORIZATION`):** реализация `tests/propertyF_v1.test.ts` и прогон `15` мутаций (`PF1-MUT-01..15`).
3. **Замороженные исторические расхождения в нетронутых документах:**
   - В нетронутом `RELEASE_NOTES.md` (`v0.1.0`) и в исторической секции `CHANGELOG.md ## [0.1.0]` отражён прежний срез `13` тестов и утверждение об удалении `public/assets/aistudio/`; в `docs/REPOSITORY_STRUCTURE.md` и `docs/DEVELOPMENT_ROADMAP.md` отсутствует история после `v0.1.0`. Они намеренно оставлены нетронутыми как исторические артефакты и компенсированы актуальными записями в `README.md`, `CHANGELOG.md [Unreleased]` и `OMR_DOCUMENTATION_INVENTORY.md`.
4. **Открытые дефекты кода `D-1`–`D-5` и контрактные вопросы:** ждут отдельного планирования `Phase 2.4 / Contract 02 v3` (`AUD-C01` по `Face2D.vertexIds`, `CAPABILITY_GAP` / `NOT_APPLICABLE`, масштаб `D-2`, разделение ошибок `D-3`, центрирование `D-1`, независимость `areaEpsilon` `D-4`).
