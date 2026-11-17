# Origami Mathematical Reasoning (OMR)

**Версия:** `0.1.0` (**Phase 2.2 — Trusted `OperationRequest` & Contract 02 Hardening**)  
**Репозиторий:** <https://github.com/a50kv109/Origami-mathematical-reasoning>  
**Лицензия:** [Apache License 2.0](./LICENSE)

**Origami Mathematical Reasoning (OMR)** — исследовательско-инженерное математическое ядро на TypeScript для формального представления геометрических состояний, воспроизводимого журналирования преобразований (`TRACE`) и **независимой Zero-Trust верификации** в парадигме *Certifying Algorithms*.

> **Важная граница текущего релиза:** OMR **не является** полноценной системой физического складывания оригами, 3D-симулятором или графическим редактором. В текущей кодовой базе реализован только проверяемый 2D-контур `OperationRequest → L2 → ReflectionWitness → TRACE → L7` для операции отражения относительно прямой (`REFLECTION_ACROSS_LINE`).

---

## 1. Назначение OMR

Цель проекта — отделить математическую доказательность от планирования операций ИИ-агентами и от внешних CAD/оригами-инструментов:

- постановщик задачи формирует отдельный доверенный запрос (**`OperationRequest`**);
- математический генератор (**L2**) выполняет вычисления строго по запросу и выпускает проверяемое свидетельство перехода (`ReflectionWitness`);
- журнал переходов (**TRACE**) фиксирует глубоко замороженную цепочку состояний `S₀ → S₁ → …` вместе с запросами и свидетельствами;
- независимый верификатор (**L7**) проверяет результат, процесс и строгое соответствие исходному `OperationRequest` по математическим аксиомам **без доверия генератору** и без повторного запуска его решателя.

Долгосрочно проект развивается как переносимая математическая основа для геометрического рассуждения в задачах перехода `2D → 3D` (развёртки, листовые конструкции, сборка панелей).

---

## 2. Текущие возможности (Phase 2.2)

Реализовано и подтверждено автотестами (`19/19` в `tests/contract02.test.ts`):

- **Типизированные контракты (`src/core/types.ts`):** `GeometryState` (с `stateId`, `version`, `vertices`, `edges`, `faces`), `LineNormalParams`, `OperationRequest`, `ReflectionWitness`, `TraceEntry`, `VerificationClaim`, `VerificationVerdict` (с предикатом `requestBound`), `VerifierTolerances`.
- **Доверенный запрос операции (`src/core/operationRequest.ts`):** фабрика `createOperationRequest` с глубокой заморозкой (`deepFreeze`), привязкой к `sourceStateId`/`sourceStateVersion` и явным разбиением `movingVertexIds`/`fixedVertexIds`.
- **Детерминированный генератор 2D-отражений (`src/core/l2GeometryEngine.ts`):** вычисление `REFLECTION_ACROSS_LINE` строго по `OperationRequest` в двойной точности IEEE-754 (без округления `.toFixed`) с проверкой `REQUEST_STATE_MISMATCH` и выпуском `ReflectionWitness`.
- **Иммутабельный журнал `TRACE` (`src/core/trace.ts`):** глубокое клонирование и заморозка (`deepFreeze`) состояний, запросов `OperationRequest`, свидетельств и записей переходов.
- **Аксиоматический верификатор `L7` (`src/core/l7IndependentVerifier.ts`):** 4-этапная Zero-Trust проверка `verifyResult(claim, request, overrides?)` и `verifyProcess(trace, trustedRequests, overrides?)` с нулевым рантайм-импортом из `L2`, `TRACE` и `operationRequest`, а также со строгой проверкой `Number.isFinite(stepIndex)` и устойчивостью к согласованной подмене `claim + witness + geometry`.
- **Интерактивный веб-стенд (`src/components/VerificationWorkbench.tsx` + `src/App.tsx`):** клиентская визуализация `OperationRequest → L2 ↔ L7`, пресетов осей, сценариев искажений и журнала `TRACE` вместе с паспортом архитектуры.

---

## 3. Архитектура L1–L7

Проект спроектирован как семь изолированных логических уровней без слияния всех свойств объекта в единый монолитный кортеж:

| Слой | Назначение | Статус в `v0.1.0` |
| :--- | :--- | :--- |
| **L1 — Topological Layer** | Графы смежности (`VertexID`, `EdgeID`, `FaceID`), `FACE_SUBDIVISION`, `MATERIAL_CUT` | Спроектировано (не реализовано; Phase 3) |
| **L2 — Geometric Layer** | Координатное пространство `ℝ²`, детерминированные преобразования | **Частично реализовано:** 2D `REFLECTION_ACROSS_LINE` (`src/core/l2GeometryEngine.ts`) |
| **L3 — Layer Order Layer** | Комбинаторика перекрытий и Z-порядок слоёв | Концепция (не реализовано; Phase 5) |
| **L4 — Kinematic Layer** | Непрерывные траектории `γ(t)`, 3D-углы и коллизии | Концепция (не реализовано; Phase 5) |
| **L5 — Curved Folding Layer** | Криволинейные складки и поверхностные приближения | Исследовательская постановка (Phase 7) |
| **L6 — Optimization Layer** | Поиск и ранжирование альтернативных последовательностей | Исследовательская база (Phase 6) |
| **L7 — Independent Verification Layer** | Zero-Trust проверка результата и процесса без общего кода с генератором | **Реализовано для Contract 02 v2** (`src/core/l7IndependentVerifier.ts`) |

---

## 4. Реализованная область L2 (`src/core/l2GeometryEngine.ts`)

Слой `L2` реализует две основные функции и типизированные ошибки `L2EngineError`:

- `createInitialGeometryState(input)` — формирует и глубоко замораживает начальный снимок `GeometryState` с проверкой конечности `version` и координат, а также уникальности `VertexID`.
- `reflectAcrossLine({ request, sourceState, ... })` — проверяет валидность и привязку `OperationRequest` к `sourceState` (`INVALID_OPERATION_REQUEST`, `REQUEST_STATE_MISMATCH`) и выполняет 2D-отражение вершин из `request.movingVertexIds` относительно прямой в нормальной форме `LineNormalParams`:
  $$n_x x + n_y y = c$$
  по формуле ортогональной проекции в IEEE-754 `f64`:
  $$p' = p - 2 \frac{n \cdot p - c}{n \cdot n} n$$
  - Все `VertexID`, `EdgeID` и `FaceID` сохраняются.
  - Вершины вне `movingVertexIds` (формирующие `fixedVertexIds`) копируются без изменений.
  - Проверенная обработка вырожденных и некорректных входов: `INVALID_COORDINATE`, `DEGENERATE_NORMAL` (`||n|| <= 1e-12` по умолчанию), `UNKNOWN_VERTEX_ID`, `DUPLICATE_VERTEX_ID`, `INVALID_OPERATION_REQUEST`, `REQUEST_STATE_MISMATCH`.

---

## 5. Контракт `OperationRequest` и `ReflectionWitness` (`src/core/types.ts`, `src/core/operationRequest.ts`)

`createOperationRequest` создаёт глубоко замороженный `OperationRequest` (`operationRequestId`, `operation`, `sourceStateId`, `sourceStateVersion`, `parameters`, `movingVertexIds`, `fixedVertexIds`, `requestProvenance`), отдельный от `VerificationClaim` и `ReflectionWitness`.

`reflectAcrossLine` формирует глубоко замороженный `ReflectionWitness`, связывающий исходный запрос, исходное состояние, целевое состояние и преобразование:

- идентификаторы и версии: `witnessId`, `operationId`, `operationRequestId`, `operation: 'REFLECTION_ACROSS_LINE'`, `sourceStateId`, `sourceStateVersion`, `targetStateId`, `targetStateVersion`;
- параметры оси: `axis: { n: { nx, ny }, c }`;
- разбиение вершин: `movingVertexIds`, `fixedVertexIds`;
- пары соответствия: `vertexPairs: [{ vertexId, p, pPrime }]`;
- необязательные диагностические невязки генератора `claimedResiduals?: { maxMidpointError, maxCollinearityError }` — **строго игнорируются в `L7`** согласно Zero-Trust.

---

## 6. Журнал переходов `TRACE` (`src/core/trace.ts`)

`TRACE` представляет собой массив неизменяемых записей `TraceEntry` (`stepIndex`, `operationId`, `operationRequestId`, `sourceStateVersion`, `targetStateVersion`, `sourceState`, `resultingState`, `parameters`, `request`, `witness`, `precision`, `provenance`, `timestamp`):

- `deepFreeze(value)` — рекурсивная заморозка (`Object.freeze`) состояний, запросов и свидетельств;
- `cloneGeometryState(state)`, `cloneOperationRequestSnapshot(request)` и `cloneReflectionWitness(witness)` — иммутабельное глубокое копирование с сохранением точных значений IEEE-754;
- `createTraceEntry(input)` и `appendTraceEntry(trace, entry)` — построение и пошаговое наращивание замороженного журнала.

---

## 7. Независимая проверка L7 (`src/core/l7IndependentVerifier.ts`)

Модуль `L7` **не импортирует** ни одной функции или структуры среды выполнения из `L2`, `TRACE` или `operationRequest` (разрешены только чистые типы `import type ... from './types'`, что проверяется статическим тестом). Вместо повторного вычисления координат решателем `L7` проверяет `VerificationClaim` и `TraceEntry[]` относительно доверенного `OperationRequest` в четыре этапа:

1. **Stage A (Допустимость входа):** проверка конечности всех IEEE-754 чисел (включая `request`, `claim`, `witness` и состояния) и невырожденности нормали `||n|| > zeroNormalEpsilon` (`1e-12`). При нарушении возвращается `UNDETERMINED`.
2. **Stage B (Привязка к `OperationRequest` и свидетельство `witness ↔ claim ↔ states`):** проверка `requestBound` (идентификатор запроса, `requestProvenance`, тип операции, `sourceStateId`/`version`, ось, разбиение `movingVertexIds`/`fixedVertexIds` во всех структурах) и `witnessBound` (биекция `witness.vertexPairs`, неподвижность `fixedVertexIds`, сохранение `VertexID`/`EdgeID`/`FaceID`). Поле `witness.claimedResiduals` полностью игнорируется.
3. **Stage C (Аксиомы отражения, инвариантные к масштабу коэффициентов уравнения прямой):**
   $$r_{\text{mid}} = \frac{|n \cdot (p + p') - 2c|}{2\|n\|} \le \varepsilon, \qquad r_{\text{perp}} = \frac{|(p' - p) \times n|}{\|n\|} \le \varepsilon$$
   где $\|n\| = \operatorname{hypot}(n_x, n_y)$. Аксиомы вычисляются относительно оси `request` и оси `claim`; нормировка на $\|n\|$ обеспечивает инвариантность именно к масштабированию коэффициентов $(n_x, n_y, c) \mapsto \alpha\,(n_x, n_y, c)$. По точному тождеству $\|p' - p'_{\text{exact}}\|_2 = \sqrt{4\,r_{\text{mid}}^2 + r_{\text{perp}}^2}$ выполнение аксиом гарантирует корректность отражения без пересчёта формулы `L2`.
4. **Stage D (Инварианты области действия):** сохранение длин всех рёбер и хорд и модуля площади $|S|$ (формула Гаусса / Shoelace) на чисто движущихся и чисто фиксированных элементах, а также строгая инверсия знака ориентированной площади на невырожденных чисто движущихся гранях (`|S| > degenerateAreaEpsilon`). Смешанные грани/рёбра (между `moving` и `fixed`) исключаются из проверки жёсткости.

Допуски по умолчанию (`DEFAULT_VERIFIER_TOLERANCES`):
- `epsilon = 1e-7`
- `areaEpsilon = 1e-7`
- `zeroNormalEpsilon = 1e-12`
- `degenerateAreaEpsilon = 1e-12`

Режимы и вердикты: `verifyResult(claim, request, overrides?)` и `verifyProcess(trace, trustedRequests, overrides?)` возвращают `VerificationVerdict` со статусом **`PASS | FAIL | UNDETERMINED`**. В `verifyProcess` дополнительно проверяются конечность и целочисленность `stepIndex` (`Number.isFinite`, `Number.isInteger`, `stepIndex >= 0`), строгая монотонность `stepIndex`, уникальность `operationRequestId` и непрерывность состояний и запросов между шагами.

---

## 8. Установка и запуск

Требуется **Node.js** (рекомендуется `20+` / `22+`) и **npm**. Внешние API-ключи и переменные окружения не требуются.

```bash
git clone https://github.com/a50kv109/Origami-mathematical-reasoning.git
cd Origami-mathematical-reasoning
npm ci
```

### Основные команды

```bash
# Автоматические тесты (Contract 02 v2, 19 сценариев на node:test + tsx)
npm test

# Проверка типов TypeScript (tsc --noEmit при "strict": true)
npm run lint

# Сборка клиентского стенда (Vite -> dist/)
npm run build

# Локальный dev-сервер стенда на http://localhost:3000
npm run dev

# Очистка артефактов сборки (dist/)
npm run clean
```

---

## 9. Текущие ограничения

1. **Узкая предметная область:** реализована только плоская 2D-операция `REFLECTION_ACROSS_LINE` на заранее заданном графе `GeometryState`. Операции `FACE_SUBDIVISION` (L1), Z-порядок слоёв (L3), 3D-кинематика (L4), криволинейные сгибы (L5) и оптимизация (L6) в коде отсутствуют.
2. **Вердикт `CAPABILITY_GAP` пока не реализован:** `VerificationStatus` в `src/core/types.ts` ограничен значениями `'PASS' | 'FAIL' | 'UNDETERMINED'`.
3. **Арифметика IEEE-754 `f64`:** при экстремальных масштабах координат или длинных цепочках отражений возможно сокращение мантиссы; точная/интервальная арифметика (`BigInt`) запланирована на следующие фазы.
4. **Отсутствие криптографической привязки `TRACE`:** целостность `TRACE` и соответствие `OperationRequest` проверяются структурно в памяти без канонизации JCS (RFC 8785), подписей и хеш-цепочек SHA-256.
5. **Пакетный режим:** `package.json` помечен `"private": true`; актуальным lock-файлом для воспроизводимой установки является `package-lock.json` (`bun.lock` сохранён в корне с раннего этапа и не используется в CI/npm-потоке).

---

## 10. Roadmap

| Фаза | Область | Статус |
| :--- | :--- | :--- |
| **Phase 1** | Архитектура `L1–L7`, эпистемическая дисциплина и аудит источников | Завершено |
| **Phase 2.1** | `Contract 02 v2` (`L2 ↔ L7`, `ReflectionWitness`, аксиоматический L7) | **Реализовано (`v0.1.0`)** |
| **Phase 2.2** | `OperationRequest`, привязка `requestBound`, строгая проверка `stepIndex`, `"strict": true` в `tsconfig.json`, ESM `vite.config.ts`, 19 автотестов | **Реализовано (`CAPABILITY_GAP` отложен)** |
| **Phase 3** | `Contract 01` (`L1 ↔ L2`, `FACE_SUBDIVISION`, `portableId != localId`), формализация `CAPABILITY_GAP` | Запланировано |
| **Phase 4** | Сквозной 2D MVP (`Квадрат → Подразделение → Отражение → TRACE → L7`) | Запланировано |
| **Phase 5–7** | Слой `L3` (порядок слоёв), `L4` (3D-кинематика), `L6` (оптимизация), `L5` (криволинейные складки) | Запланировано |
| **Phase 8** | Переносимый AI Reasoning Skill и проверенные адаптеры (`ToolAdapter`) | Запланировано |

Подробная документация размещена в каталоге [`docs/`](./docs/):
- [`docs/PROJECT_README.md`](./docs/PROJECT_README.md) — обзор контуров и целей;
- [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) — семислойная модель `L1–L7` и контракты;
- [`docs/FIRST_PROTOTYPE_SPEC.md`](./docs/FIRST_PROTOTYPE_SPEC.md) — спецификация прототипа `L2 ↔ L7`;
- [`docs/DEVELOPMENT_ROADMAP.md`](./docs/DEVELOPMENT_ROADMAP.md) — этапы развития;
- [`docs/REPOSITORY_STRUCTURE.md`](./docs/REPOSITORY_STRUCTURE.md) — фактическая и целевая структура репозитория;
- [`docs/TOOL_INTEGRATION_ARCHITECTURE.md`](./docs/TOOL_INTEGRATION_ARCHITECTURE.md) — архитектура будущих адаптеров.

Исторические отчёты сессий и аудитов в корне репозитория (`ACCEPTANCE_AUDIT_V1.md`, `PHASE_2_IMPLEMENTATION_REPORT.md`, `PHASE_2_1_IMPLEMENTATION_REPORT.md`, `RESEARCH_INTEGRATION_V1.md`, `ORI_STUDIO_INITIAL_AUDIT.md`, `ORI_STUDIO_GEOMETRY_ENGINE_REPORT.md`, `RELEASE_READINESS_AUDIT_V1.md`, `RELEASE_PREPARATION_TASK_A_REPORT.md`) сохранены как архив разработки; при этом `ACCEPTANCE_AUDIT_V1.md` и `PHASE_2_IMPLEMENTATION_REPORT.md` **перекрыты** реализацией Phase 2.1.

---

## 10a. Архитектурное развитие и исследовательские пакеты (`Architecture Evolution Package v1.0`)

Наряду с реализацией 2D-ядра (`v0.1.0`, Phase 2.2) и инженерным пакетом верификации `Property F` (`Phase 2.3.3`) в проекте оформлено самостоятельное исследовательское направление **`OMR — Integrated Engineering Reasoning Architecture`** (без изменения кода `src/core/*`, `L1–L7`, `Contract 02` и `Property F`):

- [`PROJECT_ARCHITECTURE_STATUS.md`](./PROJECT_ARCHITECTURE_STATUS.md) — объективное разделение состояния проекта (`Implemented` / `Documented` / `Proposed` / `Unresolved`);
- [`OMR_ARCHITECTURE_EVOLUTION.md`](./OMR_ARCHITECTURE_EVOLUTION.md) — хронология перехода от математического ядра к конструктивному (`CRP-01 / MCAR`) и физическому (`PWRP v1.1`) рассуждениям;
- [`OMR_ARCHITECTURE_MAP.md`](./OMR_ARCHITECTURE_MAP.md) — карта трёх областей знания (`L1–L7`, `CRP-01 / MCAR`, `PWRP v1.1`) и исследовательской координации;
- [`OMR_ARCHITECTURE_DECISION_RECORD.md`](./OMR_ARCHITECTURE_DECISION_RECORD.md) — реестр архитектурных решений и предложений с разграничением статусов;
- [`OMR_RESEARCH_REGISTER.md`](./OMR_RESEARCH_REGISTER.md) и [`OMR_ARCHITECTURE_OPEN_QUESTIONS.md`](./OMR_ARCHITECTURE_OPEN_QUESTIONS.md) — реестр направлений `R-01..R-08` и нерешённых вопросов;
- [`OMR_DOCUMENTATION_INVENTORY.md`](./OMR_DOCUMENTATION_INVENTORY.md) — инвентаризация всех документов проекта.

---

## 11. Лицензия

Исходный код и документация OMR распространяются под лицензией **Apache License 2.0**. Полный текст приведён в файле [`LICENSE`](./LICENSE).
