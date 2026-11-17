# OMR Phase 3.0 — Agent Integration Layer (AIL): Architectural Specification

**Статус документа:** `ARCHITECTURAL DESIGN & INTERFACE SPECIFICATION — PROPOSED`  
**Режим выполнения:** `STRICT DOCUMENTATION-ONLY MODE` (исходный код `src/**`, тесты `tests/**`, конфигурации, контракты ядра и ранее созданные отчёты **не изменялись**).  
**Статус решения по `ROD-03`:** **`WAITING FOR EXPLICIT OWNER AUTHORIZATION`**.  
**Главный архитектурный девиз:**  
> *"ONE CANONICAL MATHEMATICAL CORE — MANY INDEPENDENT AGENTS — MANY EXTERNAL TOOLS — ONE INDEPENDENT VERIFICATION MODEL."*  
> *"OMR SHOULD BE A TOOL-AGNOSTIC MATHEMATICAL SERVICE, NOT AN AGENT-SPECIFIC PLUGIN."*

---

## 1. Назначение и миссия Agent Integration Layer (AIL)

### 1.1 Проблема изоляции математического ядра
Исторически математическое ядро OMR (`src/core/*`, Phase 2.1–2.2) было спроектировано как локальная, строго типизированная TypeScript-библиотека с закрытым модульным контрактом `Contract 02 v2`. Однако реальные прикладные сценарии требуют взаимодействия с внешними интеллектуальными агентами (Google Gemini, OpenAI GPT, Anthropic Claude, локальные LLM, специализированные системы символьных рассуждений SOL, решатели ограничений) и сторонними геометрическими программами/симуляторами оригами.

Прямое подключение агентов к внутренним функциям `reflectAcrossLine` или `verifyResult` создает недопустимые архитектурные риски:
1. **Смешение ролей:** Агент может попытаться передать свои вычисленные координаты в обход строгой фабрики `OperationRequest` или объявить результат доказанным на основе собственной уверенности (`Producer claim ≠ Receiver truth`).
2. **Зависимость от вендора:** Привязка ядра к форматам конкретного LLM-провайдера (Gemini Tools, OpenAI Function Calling, Claude Tool Use) превратит OMR в узкоспециализированный плагин вместо независимого сервиса.
3. **Нарушение Zero-Trust верификации:** Недоверенные внешние симуляторы или агенты могут имитировать `ReflectionWitness`, маскируя численные дефекты.

### 1.2 Миссия AIL
**OMR Agent Integration Layer (AIL)** — это внешний сервисно-интеграционный шлюз, который:
- Предоставляет интеллектуальным агентам стандартизированный, независимый от вендора интерфейс взаимодействия с OMR.
- Формирует прозрачный каталог фактических возможностей и ограничений ядра (`Capability Discovery`).
- Нормализует запросы агентов в канонические иммутабельные структуры `OperationRequest`.
- Маршрутизирует исполнение в вычислитель `L2` и организует независимую перепроверку в верификаторе `L7`.
- Возвращает агенту разделенный, эпистемически честный результат: раздельно статус исполнения, математический образ, вердикт независимой проверки, журнал `TRACE` и ограничения точности.
- Обеспечивает безопасное подключение сторонних геометрических программ через выделенный адаптер внешних инструментов (`External Tool Adapter`).

---

## 2. Анализ существующей кодовой базы: фактический статус (`Phase 3.0 Baseline`)

Перед проектированием проведен аудит фактического кода (`src/core/*`) и архитектурных реестров:

| Компонент OMR | Фактический статус реализации | Что реально доступно в репозитории |
| :--- | :--- | :--- |
| **`Contract 02 v2 Types`** | **`IMPLEMENTED`** | `src/core/types.ts`: `Point2D`, `Vertex2D`, `Edge2D`, `Face2D`, `GeometryState`, `LineNormalParams`, `ReflectionParameters`, `OperationRequest`, `ReflectionWitness`, `TraceEntry`, `VerifierTolerances`, `VerificationClaim`, `VerificationVerdict`. Координаты в `binary64`. |
| **`OperationRequest Factory`** | **`IMPLEMENTED`** | `src/core/operationRequest.ts`: `createOperationRequest`, `cloneOperationRequest`. Глубокая заморозка `deepFreeze`, дизъюнктность `moving/fixed`, привязка к `sourceStateId@vX`. |
| **`L2 Geometry Engine`** | **`IMPLEMENTED` (2D Only)** | `src/core/l2GeometryEngine.ts`: единственная операция `REFLECTION_ACROSS_LINE` (`reflectAcrossLine`). Выпуск `resultingState`, `witness`, `traceEntry`. Документирован численный дефект `D-3`. |
| **`TRACE Journal`** | **`IMPLEMENTED`** | `src/core/trace.ts`: иммутабельный журнал переходов в памяти процесса (`createTraceEntry`, `deepFreeze`). Без криптографической JCS/SHA-256 канонизации. |
| **`L7 Independent Verifier`** | **`IMPLEMENTED`** | `src/core/l7IndependentVerifier.ts`: `verifyResult` (пошаговая проверка), `verifyProcess` (проверка непрерывности трассы). Вердикты `PASS | FAIL | UNDETERMINED`. Документированы дефекты `D-1, D-2, D-4, D-5, D-7`. |
| **`Process-Level Global Verification`**| **`PROPOSED`** | Описано в `OMR_PROCESS_VERIFICATION_ARCHITECTURE.md`. В коде `verifyProcess` пока агрегирует только смежные шаги через `Math.max` и `&&`. |
| **`Candidate B Numerical Domain`** | **`PROPOSED`** | Специфицировано в `OMR_PHASE_2_4_NUMERICAL_HARDENING_REQUIREMENTS.md`. В коде ядра не реализовано. |
| **`Agent Integration Interface (AIL)`**| **`NOT IMPLEMENTED`** | Универсальный агентский API, REST, MCP, SDK отсутствуют. Предметом настоящей спецификации является их проектирование. |
| **`3D Folding / Layer Ordering / L1`** | **`OUT OF SCOPE`** | Слои `L1`, `L3–L6`, многолистовая сборка (`MCAR`), физика (`PWRP`) находятся за рамками текущего 2D-ядра. |

---

## 3. Компонентная структура AIL

Архитектура AIL разделена на семь слабосвязанных модулей, функционирующих по принципу однонаправленного потока ответственности:

```text
 ┌─────────────────────────────────────────────────────────────────────────────────────────┐
 │                                   AI AGENTS & CLIENTS                                   │
 │       [Google Gemini]      [OpenAI GPT]      [Anthropic Claude]      [Local / SOL]      │
 └─────────────────┬───────────────────┬─────────────────┬────────────────────┬────────────┘
                   │                   │                 │                    │
                   ▼                   ▼                 ▼                    ▼
 ┌─────────────────────────────────────────────────────────────────────────────────────────┐
 │                      ADAPTER INGRESS LAYER (Протокольные шлюзы)                         │
 │   ┌───────────────────────┐   ┌───────────────────────┐   ┌─────────────────────────┐   │
 │   │   TypeScript SDK      │   │   REST API Gateway    │   │       MCP Server        │   │
 │   │   (Local in-process)  │   │   (Remote HTTP/JSON)  │   │   (Model Context Proto) │   │
 │   └───────────┬───────────┘   └───────────┬───────────┘   └────────────┬────────────┘   │
 └───────────────┼───────────────────────────┼────────────────────────────┼────────────────┘
                 │                           │                            │
                 ▼                           ▼                            ▼
 ┌─────────────────────────────────────────────────────────────────────────────────────────┐
 │                   AIL CORE: CANONICAL AGENT INTEGRATION LAYER (Шлюз ядра)               │
 │                                                                                         │
 │  1. Ingress & Auth Guard: валидация requestId, agentId, rate-limits, envelope           │
 │  2. Capability Registry: каталог поддерживаемых операций, ограничений и допусков        │
 │  3. Request Canonicalizer: нормализация внешнего JSON -> CreateOperationRequestInput     │
 │  4. Core Dispatcher: безопасный вызов L2 Geometry Engine                                │
 │  5. Verification Coordinator: независимый вызов L7 (Zero-Trust перепроверка)             │
 │  6. External Tool Dispatcher: безопасный мост к внешним симуляторам (Tool Adapter)      │
 │  7. Result Synthesizer: сборка канонического AilResponse (Status + Math + Verifier)     │
 └───────────────────────────────────────────┬─────────────────────────────────────────────┘
                                             │
                                             ▼
 ┌─────────────────────────────────────────────────────────────────────────────────────────┐
 │                              OMR MATHEMATICAL CORE (Ядро)                               │
 │                                                                                         │
 │      ┌───────────────────────────────────────────────────────────────────────────┐      │
 │      │ `createOperationRequest` (Authoritative Frozen Task Contract)             │      │
 │      └─────────────────────┬───────────────────────────────┬─────────────────────┘      │
 │                            │                               │                            │
 │                            ▼                               ▼                            │
 │      ┌───────────────────────────────────────────┐   ┌───────────────────────────┐      │
 │      │ `reflectAcrossLine` (L2 Generator Engine) │   │ `verifyResult` / `Process`│      │
 │      │  • Computes p' via normal projection      │   │ (L7 Independent Verifier) │      │
 │      │  • Emits GeometryState, Witness, TRACE    │   │  • Zero-Trust residuals   │      │
 │      └─────────────────────┬─────────────────────┘   │  • Contract 02 v2 verdict │      │
 │                            │                         └─────────────▲─────────────┘      │
 │                            ▼                                       │                    │
 │      ┌───────────────────────────────────────────┐                 │                    │
 │      │ `TRACE Journal` (Immutable state history) ├─────────────────┘                    │
 │      └───────────────────────────────────────────┘                                      │
 └─────────────────────────────────────────────────────────────────────────────────────────┘
```

### 3.1 Описание компонентов AIL Core
1. **`Ingress & Auth Guard`:** Проверяет формат заголовка запроса, уникальность `requestId`, идентификатор `agentId`, защищает от повторных атак (replay attack) и контролирует лимиты сложности (максимальное число вершин $N_{\max}$, допустимый диапазон координат).
2. **`Capability Registry`:** Централизованный реестр, динамически возвращающий агенту точный список поддерживаемых возможностей (операция `REFLECTION_ACROSS_LINE`, контракт `CONTRACT_02_V2`, формат координат `IEEE-754 binary64`, отсутствие 3D-сгибов).
3. **`Request Canonicalizer`:** Преобразует внешний агентский JSON-запрос в строго валидированный `CreateOperationRequestInput`, проверяет наличие вершин в `sourceState`, формирует дизъюнктные множества `movingVertexIds` / `fixedVertexIds` и вызывает штатную фабрику `createOperationRequest`.
4. **`Core Dispatcher`:** Исполняет операцию в ядре `L2` (`reflectAcrossLine`), передавая замороженный `OperationRequest` и входной `GeometryState`. Перехватывает ошибки `L2EngineError` и формирует структурированный отказ без падения сервиса.
5. **`Verification Coordinator`:** Немедленно после получения результата от `L2` (или от стороннего инструмента) формирует `VerificationClaim` и передает его в верификатор `L7` (`verifyResult` или `verifyProcess`). Гарантирует, что ни один результат не вернется агенту без независимого вердикта.
6. **`External Tool Dispatcher`:** При запросе делегирования сторонней программе (например, симулятору оригами) транслирует геометрию во внешний формат, получает расчетные координаты, но помечает их как **`UNTRUSTED_EXTERNAL_CLAIM`** и принудительно направляет в `L7`.
7. **`Result Synthesizer`:** Формирует итоговый конверт `AilResponse`, четко разграничивая статус выполнения операции (`executionStatus`), математические координаты (`mathematicalResult`), статус независимой верификации (`verificationVerdict`), свидетельство (`witness`) и эпистемические ограничения (`limitations`).

---

## 4. Потоки данных (Data Flows)

### 4.1 Стандартный поток исполнения и верификации (Standard Execution Flow)

```text
AI Agent             AIL Gateway            OperationRequest            L2 Engine           L7 Verifier
   │                      │                         │                       │                    │
   │── SubmitOperation ──►│                         │                       │                    │
   │   (AilRequest)       │── Validate & Canon ────►│                       │                    │
   │                      │   (sourceState, line)   │── freeze & return ───►│                    │
   │                      │                         │   (OperationRequest)  │                    │
   │                      │── ExecuteRequest ──────────────────────────────►│                    │
   │                      │                         │                       │── Compute p' ──┐   │
   │                      │                         │                       │   Generate Wit │   │
   │                      │                         │                       │◄── Return ─────┘   │
   │                      │                         │                       │   (State, Witness) │
   │                      │◄── Output (State, Witness, Trace) ──────────────┘                    │
   │                      │                                                                      │
   │                      │── Coordinate Independent Verification ──────────────────────────────►│
   │                      │   (Claim: source, result, line; Request: trusted OperationRequest)   │
   │                      │                                                                      │── Recalculate
   │                      │                                                                      │   Axioms, Area,
   │                      │                                                                      │   Lengths, IDs
   │                      │◄── VerificationVerdict (PASS | FAIL | UNDETERMINED) ─────────────────│
   │                      │                                                                      │
   │                      │── Synthesize Canonical AilResponse ──┐
   │                      │   (Execution + Verification + Audit) │
   │                      │◄─────────────────────────────────────┘
   │◄── AilResponse ──────│
   │    (Complete Envelope)
```

### 4.2 Поток опроса возможностей (Capability Discovery Flow)
1. Агент отправляет `GetCapabilitiesRequest`.
2. AIL опрашивает реестр `CapabilityRegistry`.
3. Реестр возвращает актуальное состояние ядра:
   - `implementedOperations: ["REFLECTION_ACROSS_LINE"]`
   - `unsupportedOperations: ["FOLD_3D", "FACE_SUBDIVISION", "CURVED_CREASE"]`
   - `verificationContract: "CONTRACT_02_V2"`
   - `precisionModel: "IEEE_754_BINARY64"`
   - `knownLimitations: ["D-1 uncentered Shoelace at large offsets", "D-2 absolute 1e-12 threshold"]`
4. Агент адаптирует свои рассуждения под реальные возможности ядра еще до генерации геометрической задачи.

---

## 5. Границы ответственности и изоляции (Separation of Concerns)

| Граница разделения | Компонент A | Компонент B | Правило архитектурного разделения |
| :--- | :--- | :--- | :--- |
| **`AIL ↔ L2`** | `AIL Core` | `L2 Geometry Engine` | AIL **никогда** не вычисляет координаты отражения самостоятельно. AIL только формирует `OperationRequest` и передает его в `reflectAcrossLine`. |
| **`AIL ↔ L7`** | `AIL Core` | `L7 Independent Verifier` | AIL **никогда** не выносит вердикт о математической корректности. Статус верификации формируется исключительно функцией `verifyResult` (или `verifyProcess`). |
| **`AIL ↔ AI Agent`** | `AIL Core` | `External AI Agent` | Агент не имеет прямого доступа к внутренним модулям ядра (`src/core/*`). Агент не может передать «готовый результат проверки» и потребовать его признания (`Producer claim ≠ Receiver truth`). |
| **`AIL ↔ Tool Adapter`**| `AIL Core` | `External Geometry Tool` | Результаты внешних геометрических программ (симуляторов) принимаются как **недоверенные расчетные гипотезы** (`UNTRUSTED_EXTERNAL_CLAIM`) и всегда подлежат проверке в `L7`. |

---

## 6. Многоагентные сценарии взаимодействия (Multi-Agent Workflows)

AIL проектируется как многопользовательский сервис, поддерживающий одновременную работу нескольких разнородных агентов в рамках единого пайплайна:

### Сценарий: Коллаборативное геометрическое проектирование
1. **Agent 1 (Планировщик — Google Gemini):**
   - Запрашивает возможности OMR через `omr_get_capabilities`.
   - Формирует задачу: «Сложить квадрат пополам вдоль диагонали $x - y = 0$».
   - Передает `AilRequest` в AIL с метаданными `agentId: "gemini-2.0-pro"`, `intent: "DIAGONAL_FOLD"`.
2. **OMR Core & L7:**
   - AIL выполняет операцию в `L2` и верифицирует в `L7`.
   - Получен вердикт: `status: "PASS"`, `areaPreserved: true`, `orientationInverted: true`.
3. **Agent 2 (Аудитор конструкций — Anthropic Claude):**
   - Получает сгенерированный `AilResponse` с ссылкой на `TRACE`.
   - Проверяет по `TRACE`, не возникло ли паразитных самопересечений или деформаций формы.
4. **Agent 3 (Физический верификатор — специализированный PWRP-агент):**
   - Анализирует шаг на предмет физической толщины бумаги ($T > 0$) и радиуса сгиба $R_{\min}$.
   - Выносит физический вердикт в рамках концепции вектора `(M_OMR, C_MCAR, P_PWRP-10)`.

**Критическое правило против сговора агентов (Collusion Prevention):**  
Согласие нескольких агентов между собой (например, если и Gemini, и Claude посчитали результат верным) **НЕ является математическим доказательством**. Единственным математическим арбитром корректности в системе остается аксиоматический верификатор `L7`.
