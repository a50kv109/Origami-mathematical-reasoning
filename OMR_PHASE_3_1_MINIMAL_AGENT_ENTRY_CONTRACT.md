# OMR Phase 3.1 — Minimal Agent Entry Contract

**Статус документа:** `CANONICAL ENTRY SPECIFICATION — PROPOSED FOR STAGE 1`  
**Режим выполнения:** `STRICT DOCUMENTATION-ONLY MODE` (исходный код `src/**`, тесты `tests/**`, конфиги, Contract 02 v2 и TRACE **не изменялись**).  
**Статус решения по `ROD-03`:** **`WAITING FOR EXPLICIT OWNER AUTHORIZATION`**.  
**Главный архитектурный принцип:**  
> *"THE CORE MUST BE INDEPENDENTLY USABLE BEFORE IT BECOMES UNIVERSALLY INTEGRATED."*  
> *"Минимальный контракт входа не строит сложной сетевой инфраструктуры. Он задает строгий, проверяемый и не зависящий от вендора договор взаимодействия между внешним агентом (или независимым исследователем) и существующим математическим ядром OMR."*

---

## 1. Концепция и цель минимального контракта входа

OMR на текущем этапе разработки (релиз `v0.1.0`) содержит детерминированное математическое ядро, реализующее единственную 2D-операцию `REFLECTION_ACROSS_LINE` в слое `L2` и независимый аксиоматический верификатор `L7` (`Contract 02 v2`).

Цель **Minimal Agent Entry Contract (MAEC)** — предоставить внешнему агенту (Gemini, Claude, GPT, локальной модели) или независимому разработчику на GitHub четкий, однозначный и самодостаточный способ:
1. Узнать, что ядро умеет делать **сейчас**, а чего делать **не умеет** (`DISCOVER`).
2. Понять точный формат входных геометрических данных (`DESCRIBE`).
3. Сформировать и отправить математически строгое задание (`SUBMIT`).
4. Запустить штатный расчет без прямого ковыряния во внутренних модулях (`EXECUTE`).
5. Получить результат независимой математической сертификации `L7` (`VERIFY`).
6. Получить проверенную геометрию, трассировку и честный отчет об ограничениях (`RECEIVE`).

**Граница:** Контракт не добавляет в OMR новых геометрических алгоритмов, не меняет типы `src/core/types.ts` и не подменяет Zero-Trust верификацию.

---

## 2. Шестистадийный жизненный цикл взаимодействия (Interaction Lifecycle)

```text
  EXTERNAL PARTICIPANT (AI Agent / Independent Developer)
       │
       │  1. DISCOVER ("What can OMR do today?")
       ├────────────────────────────────────────────────────────► OMR Capability Registry
       │◄──────────────────────────────────────────────────────── Capabilities Manifest
       │
       │  2. DESCRIBE ("What input structures are required?")
       ├────────────────────────────────────────────────────────► Canonical Input Schema
       │◄──────────────────────────────────────────────────────── Schema & Constraints
       │
       │  3. SUBMIT ("Here is my formal geometric task")
       ├───────────────────────────────┐
       │                               ▼
       │                     [Minimal Entry Facade]
       │                               │
       │                               │ 4. EXECUTE (L2 reflectAcrossLine)
       │                               ├────────────────────────► L2 Geometry Engine
       │                               │◄──────────────────────── ResultingState + Witness
       │                               │
       │                               │ 5. VERIFY (L7 verifyResult)
       │                               ├────────────────────────► L7 Zero-Trust Verifier
       │                               │◄──────────────────────── VerificationVerdict
       │                               │
       │  6. RECEIVE ("Inspect outcome, TRACE, and verdict")
       │◄──────────────────────────────┘
```

### Стадии жизненного цикла:
1. **`DISCOVER`:** Агент опрашивает декларацию возможностей и ограничений. Агент узнает: операция только `REFLECTION_ACROSS_LINE`, размерность строго 2D, координаты в `IEEE-754 binary64`, 3D-сгибы отсутствуют.
2. **`DESCRIBE`:** Агент изучает схему входных данных: как описать `GeometryState` (вершины, ребра, грани) и параметры линии отражения $n_x x + n_y y = c$.
3. **`SUBMIT`:** Агент формирует канонический JSON-запрос `MinimalAgentRequest`. Фасад проверяет вход, нормализует множества `moving/fixed` и создает авторизованный замороженный `OperationRequest`.
4. **`EXECUTE`:** Фасад передает задачу в `L2 reflectAcrossLine`. Вычисляется образ $p'$ для движущихся вершин, формируются `resultingState`, `witness` и `traceEntry`.
5. **`VERIFY`:** Фасад формирует `VerificationClaim` и передает его в `L7 verifyResult` вместе с доверенным `OperationRequest`. `L7` независимо перепроверяет середины, перпендикуляры, длины, площади и ориентацию.
6. **`RECEIVE`:** Агент получает канонический ответ `MinimalAgentResponse`, где статус исполнения (`EXECUTED`), математические координаты и вердикт проверки (`VERIFIED / VIOLATED / INDETERMINATE`) строго разделены.

---

## 3. Канонический контракт запроса (`MinimalAgentRequest`)

### 3.1 Классификация полей запроса: `EXISTING` / `DERIVED` / `PROPOSED`

| Поле в запросе | Тип данных | Классификация | Источник в коде / Правило формирования |
| :--- | :--- | :--- | :--- |
| **`protocolVersion`** | `string` | **`PROPOSED`** | `"0.1.0"` — версия контракта входа; отсутствует во внутреннем ядре. |
| **`requestId`** | `string` | **`DERIVED`** | Мапится в `operationRequestId` в `OperationRequest` (`types.ts:68`, `operationRequest.ts:74`). Если не передан агентом, генерируется автоматически. |
| **`agentId`** | `string` | **`PROPOSED`** | Идентификатор вызывающего агента (напр. `"gemini-2.0-pro"`, `"auditor-local"`). Передается в поле аудита `requestProvenance`. |
| **`operation`** | `string` | **`EXISTING`** | Строго `"REFLECTION_ACROSS_LINE"` (`types.ts:69`, `operationRequest.ts:68`). Другие типы немедленно отклоняются. |
| **`sourceState`** | `object` | **`EXISTING`** | Полный снимок `GeometryState` (`types.ts:39-45`): `stateId`, `version`, `vertices`, `edges`, `faces`. |
| **`sourceState.vertices`**| `array` | **`EXISTING`** | Массив `Vertex2D { id, position: { x, y } }` (`types.ts:18-21`). Числа `IEEE-754`. |
| **`sourceState.edges`** | `array` | **`EXISTING`** | Массив `Edge2D { id, startVertexId, endVertexId }` (`types.ts:23-27`). |
| **`sourceState.faces`** | `array` | **`EXISTING`** | Массив `Face2D { id, vertexIds: string[] }` (`types.ts:29-32`). |
| **`parameters.line`** | `object` | **`EXISTING`** | Уравнение прямой `LineNormalParams { nx, ny, c }` (`types.ts:50-54`). |
| **`parameters.movingVertexIds`**| `string[]` | **`EXISTING`** | Список идентификаторов трансформируемых вершин (`types.ts:58`). |
| **`parameters.fixedVertexIds`** | `string[]` | **`DERIVED`** | Список фиксированных вершин (`types.ts:59`). Если агентом не передан, фасад выводит его как $V_{\text{all}} \setminus V_{\text{moving}}$ (`operationRequest.ts:89-94`). |
| **`verification.requested`** | `boolean` | **`PROPOSED`** | Флаг необходимости запуска `L7 verifyResult` (по умолчанию `true`). |
| **`verification.tolerances`** | `object` | **`DERIVED`** | Опциональные переопределения `Partial<VerifierTolerances>` (`types.ts:136-141`). |
| **`provenance`** | `string` | **`DERIVED`** | Мапится в `OperationRequest.requestProvenance` (`types.ts:75`). |

### 3.2 Минимальная JSON-схема запроса (TypeScript Interface)

```typescript
export interface MinimalAgentRequest {
  // PROPOSED
  readonly protocolVersion: '0.1.0';
  readonly requestId?: string;
  readonly agentId?: string;

  // EXISTING
  readonly operation: 'REFLECTION_ACROSS_LINE';
  readonly sourceState: GeometryState;
  readonly parameters: {
    readonly line: LineNormalParams;
    readonly movingVertexIds: readonly VertexId[];
    // DERIVED: если опущен, автоматически вычисляется как разность вершин
    readonly fixedVertexIds?: readonly VertexId[];
  };

  // PROPOSED / DERIVED
  readonly verification?: {
    readonly requested?: boolean; // default true
    readonly tolerances?: Partial<VerifierTolerances>;
  };
  readonly provenance?: string;
}
```

---

## 4. Канонический контракт ответа (`MinimalAgentResponse`)

### 4.1 Классификация полей ответа: `EXISTING` / `DERIVED` / `PROPOSED`

| Поле в ответе | Тип данных | Классификация | Источник в коде / Правило формирования |
| :--- | :--- | :--- | :--- |
| **`protocolVersion`** | `string` | **`PROPOSED`** | `"0.1.0"`. |
| **`responseId`** | `string` | **`PROPOSED`** | Уникальный ID ответа фасада. |
| **`inResponseTo`** | `string` | **`DERIVED`** | Возвращает переданный `requestId`. |
| **`execution.status`** | `string` | **`PROPOSED`** | Статус фазы расчета: `"EXECUTED"` (L2 завершил расчет) или `"REJECTED"` / `"FAILED"`. |
| **`execution.error`** | `object` | **`DERIVED`** | Структура ошибки при сбое (код ошибки из `L2ErrorCode` или `OperationRequestError`). |
| **`result.resultingState`** | `GeometryState` | **`EXISTING`** | Рассчитанный снимок геометрии из `ReflectAcrossLineOutput.resultingState` (`l2GeometryEngine.ts:399`). |
| **`result.witness`** | `ReflectionWitness`| **`EXISTING`** | Сертификационное свидетельство операции (`types.ts:97-117`). |
| **`trace.entry`** | `TraceEntry` | **`EXISTING`** | Полная запись перехода для аудита (`types.ts:119-134`). |
| **`verification.status`** | `string` | **`PROPOSED`** | Сервисный статус: `"VERIFIED"`, `"VIOLATED"`, `"INDETERMINATE"`, `"NOT_APPLICABLE"` или `"SKIPPED"`. |
| **`verification.verdict`** | `VerificationVerdict`| **`EXISTING`** | Точный неизмененный вердикт `L7 verifyResult` (`types.ts:173-179`): `status: "PASS" | "FAIL" | "UNDETERMINED"`, `residuals`, `predicates`, `diagnostics`. |
| **`limitations`** | `string[]` | **`PROPOSED`** | Документированные численные предупреждения (напр. близость к пороговым дефектам `D-1`, `D-2`). |

### 4.2 Минимальная JSON-схема ответа (TypeScript Interface)

```typescript
export interface MinimalAgentResponse {
  // PROPOSED
  readonly protocolVersion: '0.1.0';
  readonly responseId: string;
  readonly inResponseTo: string;

  // Execution Phase (PROPOSED wrapper around EXISTING L2)
  readonly execution: {
    readonly status: 'EXECUTED' | 'REJECTED' | 'FAILED';
    readonly operationId?: string;
    readonly error?: {
      readonly code: string;
      readonly message: string;
    };
  };

  // Mathematical Result (EXISTING)
  readonly result?: {
    readonly resultingState: GeometryState;
    readonly witness: ReflectionWitness;
  };

  // Trace Journal Reference (EXISTING)
  readonly trace?: {
    readonly stepIndex: number;
    readonly entry: TraceEntry;
  };

  // Independent Verification (PROPOSED wrapper + EXISTING L7 verdict)
  readonly verification?: {
    readonly serviceStatus: 'VERIFIED' | 'VIOLATED' | 'INDETERMINATE' | 'NOT_APPLICABLE' | 'SKIPPED';
    readonly verdict: VerificationVerdict; // Strict Contract 02 v2
  };

  // Epistemic Integrity Disclaimers (PROPOSED)
  readonly limitations?: readonly string[];
}
```

---

## 5. Правила валидации, идемпотентности, сериализации и изоляции

1. **Защита от потери типов в JSON-сериализации:**
   - Координаты $x, y$ и коэффициенты прямой $n_x, n_y, c$ обязаны быть конечными числами (`Number.isFinite`). Если агент передает `null`, `"100.0"`, `NaN` или `Infinity`, запрос **немедленно отклоняется** на этапе валидации до передачи в ядро (`status: "REJECTED"`).
2. **Изоляция и глубокая заморозка (`deepFreeze`):**
   - Все структуры, попадающие в ядро, проходят глубокую заморозку через `deepFreeze` (`src/core/trace.ts:19-37`). Любая попытка внешнего агента мутировать `GeometryState` в памяти блокируется рантаймом JavaScript (`TypeError` в strict mode).
3. **Разграничение `requestBound` и `witnessBound`:**
   - Верификатор `L7` независимо удостоверяется, что `resultingState` соответствует именно переданному `OperationRequest`, а не произвольно подсунутому свидетельству (стадия B, `l7IndependentVerifier.ts:440-480`).
4. **Разделение Успеха Исполнения и Успеха Верификации:**
   - `execution.status === "EXECUTED"` означает лишь то, что `L2` смог завершить математический расчет координат.
   - Это **не означает**, что результат верен.
   - Корректность подтверждается **исключительно** значением `verification.serviceStatus === "VERIFIED"` (`verdict.status === "PASS"`).

---

## 6. Что делать, если запрос некорректен или не поддерживается?

| Ситуация | Реакция ядра / фасада | Код ответа | Поведение верификатора L7 |
| :--- | :--- | :--- | :--- |
| Запрошена неизвестная операция (напр. `FOLD_3D`) | Отклонение на входе | `REJECTED: UNSUPPORTED_OPERATION` | `L7` не запускается. |
| `VertexId` отсутствует в `sourceState` | Ошибка фабрики `OperationRequest` | `REJECTED: UNKNOWN_VERTEX_ID` | `L7` не запускается. |
| Длина нормали $\|n\| \le 10^{-12}$ | Ошибка валидатора `L2` | `FAILED: DEGENERATE_NORMAL` | `L7` не запускается. |
| Истинный образ превысил `MAX_VALUE` | Ошибка движка `L2` | `FAILED: COORDINATE_OVERFLOW` | `L7` не запускается. |
| Движущаяся грань выродилась в отрезок | Расчет успешен, проверка неполна | `EXECUTED` + `INDETERMINATE` | `L7` возвращает `UNDETERMINED`. |
| Искажение метрик / фальсификация Witness | Расчет выполнен, проверка провалена | `EXECUTED` + `VIOLATED` | `L7` возвращает `FAIL`. |
