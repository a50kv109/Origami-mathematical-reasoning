# OMR Phase 3.0 — Agent Protocol Specification: Canonical Contract & Schemas

**Статус документа:** `CANONICAL PROTOCOL SPECIFICATION — PROPOSED`  
**Режим выполнения:** `STRICT DOCUMENTATION-ONLY MODE` (исходный код `src/**`, тесты `tests/**`, контракты ядра не изменялись).  
**Статус решения по `ROD-03`:** **`WAITING FOR EXPLICIT OWNER AUTHORIZATION`**.  
**Основание:** Спецификация универсального JSON-протокола обмена данными между интеллектуальными агентами и сервисом OMR через Agent Integration Layer (AIL).

---

## 1. Общие принципы протокола

1. **Строгое версионирование:** Каждый запрос и ответ содержит идентификатор протокола `protocolVersion: "3.0.0"`.
2. **Идемпотентность:** Запросы с одинаковым `requestId` от одного `agentId` гарантируют одинаковый результат без повторного создания новых записей в `TRACE`.
3. **Разделение трех событий:**
   - **`REQUEST_ACCEPTED`** — запрос синтаксически валиден, агент авторизован, геометрия принята к исполнению.
   - **`OPERATION_EXECUTED`** — геометрический движок `L2` рассчитал преобразование и сформировал `GeometryState` + `Witness`.
   - **`RESULT_VERIFIED`** — независимый верификатор `L7` аксиоматически проверил результат и вынес вердикт `Contract 02 v2`.
4. **Недопустимость подмены верификации:** Поле `verificationVerdict` формируется исключительно верификатором `L7` и не может быть переопределено утверждением агента (`Producer claim ≠ Receiver truth`).

---

## 2. Capability Discovery (`GET_CAPABILITIES`)

Механизм позволяет агенту выяснить возможности OMR до начала формирования геометрических задач.

### 2.1 Запрос Capabilities
```json
{
  "protocolVersion": "3.0.0",
  "requestId": "req-cap-20261117-001",
  "agentId": "gemini-2.0-pro",
  "messageType": "GET_CAPABILITIES"
}
```

### 2.2 Канонический ответ Capabilities
```json
{
  "protocolVersion": "3.0.0",
  "responseId": "resp-cap-20261117-001",
  "inResponseTo": "req-cap-20261117-001",
  "engine": {
    "name": "Origami Mathematical Reasoning (OMR)",
    "coreVersion": "0.1.0",
    "ailProtocolVersion": "3.0.0",
    "mathematicalModel": "2D Affine Reflection Geometry",
    "precisionModel": "IEEE_754_BINARY64"
  },
  "capabilities": {
    "implementedOperations": [
      {
        "operation": "REFLECTION_ACROSS_LINE",
        "description": "2D affine reflection across line nx*x + ny*y = c via normal projection",
        "stateRequirements": "Immutable 2D GeometryState with vertices, edges, faces",
        "parameterSchema": {
          "line": { "nx": "number", "ny": "number", "c": "number" },
          "movingVertexIds": "string[]",
          "fixedVertexIds": "string[] (optional, derived if omitted)"
        }
      }
    ],
    "implementedVerifications": [
      {
        "contract": "CONTRACT_02_V2",
        "verifier": "L7 Axiomatic Zero-Trust Verifier",
        "modes": ["RESULT_VERIFICATION", "PROCESS_VERIFICATION"],
        "stages": [
          "Stage A: Numeric admissibility & zero normal check",
          "Stage B: Trusted OperationRequest binding & Witness binding",
          "Stage C: Scale-invariant midpoint and orthogonality axioms",
          "Stage D: Scope-aware isometry and signed area inversion"
        ]
      }
    ],
    "unsupportedOperations": [
      "FOLD_3D",
      "FACE_SUBDIVISION",
      "CURVED_CREASE",
      "CONE_FOLDING",
      "LAYER_ORDERING_Z"
    ],
    "knownLimitations": [
      {
        "id": "D-1",
        "nature": "Uncentered Shoelace area formula loses precision at coordinates >= 1e6; false FAIL at 25m offset",
        "status": "Documented in Phase 2.4/2.5; Candidate B resolution pending"
      },
      {
        "id": "D-2",
        "nature": "Absolute 1e-12 degeneracy threshold rejects micro-triangles and accepts needle polygons",
        "status": "Documented; dimension-free ratio pending"
      },
      {
        "id": "D-3",
        "nature": "Normal norm squared overflow in L2 on norm >= 1e155",
        "status": "Documented; exponent scaling pending"
      },
      {
        "id": "D-4",
        "nature": "Uncoupled tolerances; areaEpsilon inherits epsilon in resolveTolerances",
        "status": "Documented; decoupling pending"
      },
      {
        "id": "D-5",
        "nature": "Vacuous PASS with orientationInverted=true when 0 purely moving faces exist",
        "status": "Documented; NOT_APPLICABLE status pending in Contract 02 v3"
      }
    ],
    "recommendedEnvelope": {
      "coordinateMagnitudeMax": 10000.0,
      "coordinateUnits": "mm",
      "maxVerticesPerOperation": 500,
      "recommendedTolerance": 1e-7
    }
  }
}
```

---

## 3. Canonical Request Contract (`SUBMIT_OPERATION`)

### 3.1 Спецификация полей запроса
| Поле | Тип | Обязательность | Назначение |
| :--- | :--- | :--- | :--- |
| `protocolVersion` | `string` | Обязательно | Версия протокола AIL (напр. `"3.0.0"`). |
| `requestId` | `string` | Обязательно | Уникальный UUID или строковый ID запроса агента. |
| `agentId` | `string` | Обязательно | Идентификатор агента (`"gemini-2.0-pro"`, `"claude-3-7-sonnet"`, `"local-worker-1"`). |
| `operation` | `string` | Обязательно | Тип операции (`"REFLECTION_ACROSS_LINE"`). |
| `sourceState` | `GeometryState` | Обязательно | Полный исходный снимок геометрии в формате `src/core/types.ts`. |
| `parameters` | `object` | Обязательно | Параметры операции (`line`, `movingVertexIds`, `fixedVertexIds`). |
| `requestedVerification`| `object` | Опционально | Настройки верификации: режим (`"RESULT"` или `"PROCESS"`), переопределения допусков. |
| `provenance` | `string` | Опционально | Описание источника задачи (`"SOL_PLANNER_STEP_3"`, `"USER_PROMPT_FOLD_HALF"`). |
| `metadata` | `object` | Опционально | Произвольные контекстные метаданные агента (не передаются в ядро математики). |

### 3.2 Пример валидного запроса на операцию `REFLECTION_ACROSS_LINE`
*(Согласовано с `src/core/types.ts:39-77` и `src/core/operationRequest.ts`)*

```json
{
  "protocolVersion": "3.0.0",
  "requestId": "req-20261117-gemini-0042",
  "agentId": "gemini-2.0-pro",
  "operation": "REFLECTION_ACROSS_LINE",
  "provenance": "AGENT_STEP_DIAGONAL_FOLD",
  "sourceState": {
    "stateId": "sheet-square-v0",
    "version": 0,
    "vertices": [
      { "id": "V0", "position": { "x": 0.0, "y": 0.0 } },
      { "id": "V1", "position": { "x": 100.0, "y": 0.0 } },
      { "id": "V2", "position": { "x": 100.0, "y": 100.0 } },
      { "id": "V3", "position": { "x": 0.0, "y": 100.0 } }
    ],
    "edges": [
      { "id": "E01", "startVertexId": "V0", "endVertexId": "V1" },
      { "id": "E12", "startVertexId": "V1", "endVertexId": "V2" },
      { "id": "E23", "startVertexId": "V2", "endVertexId": "V3" },
      { "id": "E30", "startVertexId": "V3", "endVertexId": "V0" },
      { "id": "E02", "startVertexId": "V0", "endVertexId": "V2" }
    ],
    "faces": [
      { "id": "F_LOWER", "vertexIds": ["V0", "V1", "V2"] },
      { "id": "F_UPPER", "vertexIds": ["V0", "V2", "V3"] }
    ]
  },
  "parameters": {
    "line": {
      "nx": 1.0,
      "ny": -1.0,
      "c": 0.0
    },
    "movingVertexIds": ["V1"],
    "fixedVertexIds": ["V0", "V2", "V3"]
  },
  "requestedVerification": {
    "enableL7Verification": true,
    "mode": "RESULT_VERIFICATION",
    "tolerances": {
      "epsilon": 1e-7,
      "areaEpsilon": 1e-7
    }
  },
  "metadata": {
    "intent": "Fold lower corner V1 across diagonal V0-V2 onto upper corner V3",
    "conversationId": "session-xyz-987"
  }
}
```

---

## 4. Execution & Verification Contract

AIL разделяет внешний сервисный статус (`ServiceStatus`) и внутренний вердикт верификатора `L7` (`VerificationStatus`), гарантируя неразрушающую совместимость с `Contract 02 v2`.

### 4.1 Статусная модель внешнего слоя AIL (`ServiceStatus`)
1. **`ACCEPTED`** — запрос принят, нормализован, прошел предварительную валидацию.
2. **`REJECTED`** — запрос отклонен на входе (синтаксическая ошибка, неизвестный `VertexId`, дегенеративные параметры, неподдерживаемая операция).
3. **`EXECUTED`** — операция успешно завершена движком `L2`, координаты рассчитаны.
4. **`FAILED`** — операция завершилась фатальной ошибкой движка (`L2EngineError`), либо обнаружено расхождение состояния.
5. **`VERIFIED`** — результат операции независимо проверен верификатором `L7` со статусом `PASS`.
6. **`VIOLATED`** — верификатор `L7` зафиксировал математическое нарушение (ошибка длин, невязка аксиомы, несовпадение площади) со статусом `FAIL`.
7. **`INDETERMINATE`** — верификатор `L7` вернул `UNDETERMINED` (вырожденная грань, невозможность определить ориентацию, исчерпание разрядности).
8. **`NOT_APPLICABLE`** — свойство или верификация не применимы к данной конфигурации граней.

### 4.2 Сопоставление внешних статусов AIL и внутреннего Contract 02 v2

| Исходный результат `L2` | Внутренний вердикт `L7` (`Contract 02 v2`) | Итоговый статус AIL (`ServiceStatus`) | Описание для агента |
| :--- | :--- | :--- | :--- |
| Успех (`resultingState`) | `status: "PASS"` | **`VERIFIED`** | Операция выполнена и математически сертифицирована. |
| Успех (`resultingState`) | `status: "FAIL"` | **`VIOLATED`** | Координаты рассчитаны, но независимая проверка выявила искажения. |
| Успех (`resultingState`) | `status: "UNDETERMINED"`| **`INDETERMINATE`** | Координаты рассчитаны, но достоверность не может быть доказана. |
| Ошибка `L2EngineError` | Не запускался | **`FAILED`** | Ошибка геометрического движка (напр. выход за `MAX_VALUE`). |
| Ошибка валидации AIL | Не запускался | **`REJECTED`** | Некорректный запрос (неверный формат, пустой массив вершин). |

---

## 5. Result Contract: Канонические примеры ответов

### 5.1 Пример 1: Успешное выполнение и верификация (`VERIFIED` / `PASS`)

```json
{
  "protocolVersion": "3.0.0",
  "responseId": "resp-20261117-0042",
  "inResponseTo": "req-20261117-gemini-0042",
  "timestamp": "2026-11-17T11:05:00.123Z",
  "execution": {
    "status": "EXECUTED",
    "engine": "OMR_L2_CERTIFYING_GEOMETRY_ENGINE_V2",
    "operationId": "op-reflect-step-001",
    "operationRequestId": "req-reflect-v0-0001"
  },
  "mathematicalResult": {
    "resultingState": {
      "stateId": "state-v1",
      "version": 1,
      "vertices": [
        { "id": "V0", "position": { "x": 0.0, "y": 0.0 } },
        { "id": "V1", "position": { "x": 0.0, "y": 100.0 } },
        { "id": "V2", "position": { "x": 100.0, "y": 100.0 } },
        { "id": "V3", "position": { "x": 0.0, "y": 100.0 } }
      ],
      "edges": [
        { "id": "E01", "startVertexId": "V0", "endVertexId": "V1" },
        { "id": "E12", "startVertexId": "V1", "endVertexId": "V2" },
        { "id": "E23", "startVertexId": "V2", "endVertexId": "V3" },
        { "id": "E30", "startVertexId": "V3", "endVertexId": "V0" },
        { "id": "E02", "startVertexId": "V0", "endVertexId": "V2" }
      ],
      "faces": [
        { "id": "F_LOWER", "vertexIds": ["V0", "V1", "V2"] },
        { "id": "F_UPPER", "vertexIds": ["V0", "V2", "V3"] }
      ]
    }
  },
  "verification": {
    "serviceStatus": "VERIFIED",
    "contract": "CONTRACT_02_V2",
    "verdict": {
      "status": "PASS",
      "mode": "RESULT_VERIFICATION",
      "residuals": {
        "midpointError": 0.0,
        "collinearityError": 0.0,
        "maxFixedDisplacement": 0.0,
        "maxLengthError": 0.0,
        "areaError": 0.0
      },
      "predicates": {
        "requestBound": true,
        "witnessBound": true,
        "axiomsSatisfied": true,
        "lengthsPreserved": true,
        "areaPreserved": true,
        "orientationInverted": true,
        "fixedVerticesUnchanged": true,
        "idsPreserved": true,
        "traceContinuous": true
      },
      "diagnostics": []
    }
  },
  "witness": {
    "witnessId": "witness-op-reflect-step-001",
    "operationRequestId": "req-reflect-v0-0001",
    "axis": {
      "n": { "nx": 1.0, "ny": -1.0 },
      "c": 0.0
    },
    "movingVertexIds": ["V1"],
    "fixedVertexIds": ["V0", "V2", "V3"],
    "vertexPairs": [
      {
        "vertexId": "V1",
        "p": { "x": 100.0, "y": 0.0 },
        "pPrime": { "x": 0.0, "y": 100.0 }
      }
    ]
  },
  "traceReference": {
    "operationId": "op-reflect-step-001",
    "stepIndex": 1,
    "provenance": "OMR_L2_CERTIFYING_GEOMETRY_ENGINE_V2"
  },
  "epistemicSummary": {
    "classification": "NUMERICALLY_VERIFIED_ISOMETRY",
    "statement": "Operation satisfies scale-normalized reflection axioms and preserves rigid metrics within epsilon=1e-7.",
    "warning": "Numerical verification in IEEE-754 binary64 does not constitute a formal constructive proof in Q."
  }
}
```

### 5.2 Пример 2: Выполнение с неопределенностью (`INDETERMINATE` / `UNDETERMINED`)
*(Возникает, когда грань вырождена в прямую линию, и ориентацию невозможно установить)*

```json
{
  "protocolVersion": "3.0.0",
  "responseId": "resp-20261117-0043",
  "inResponseTo": "req-20261117-gemini-0043",
  "execution": {
    "status": "EXECUTED",
    "engine": "OMR_L2_CERTIFYING_GEOMETRY_ENGINE_V2"
  },
  "mathematicalResult": {
    "resultingState": { "stateId": "collinear-v1", "version": 1 }
  },
  "verification": {
    "serviceStatus": "INDETERMINATE",
    "contract": "CONTRACT_02_V2",
    "verdict": {
      "status": "UNDETERMINED",
      "mode": "RESULT_VERIFICATION",
      "predicates": {
        "axiomsSatisfied": true,
        "lengthsPreserved": true,
        "areaPreserved": true,
        "orientationInverted": false
      },
      "diagnostics": [
        "UNDETERMINED: purely moving face has zero area (collinear vertices); orientation inversion cannot be established"
      ]
    }
  },
  "epistemicSummary": {
    "classification": "INDETERMINATE_TOPOLOGY",
    "statement": "Geometric reflection succeeded, but orientation inversion cannot be verified due to collinear face vertices."
  }
}
```

### 5.3 Пример 3: Отклонение некорректного запроса (`REJECTED`)

```json
{
  "protocolVersion": "3.0.0",
  "responseId": "resp-20261117-err-01",
  "inResponseTo": "req-20261117-gpt-0099",
  "execution": {
    "status": "REJECTED"
  },
  "error": {
    "code": "VALIDATION_FAILED",
    "category": "INPUT_ADMISSIBILITY_ERROR",
    "message": "movingVertexIds contains ID 'V99' which is not present in sourceState.vertices",
    "details": {
      "unknownVertexId": "V99",
      "availableVertices": ["V0", "V1", "V2", "V3"]
    }
  }
}
```

### 5.4 Пример 4: Неподдерживаемая операция (`UNSUPPORTED_OPERATION`)

```json
{
  "protocolVersion": "3.0.0",
  "responseId": "resp-20261117-err-02",
  "inResponseTo": "req-20261117-claude-055",
  "execution": {
    "status": "REJECTED"
  },
  "error": {
    "code": "OPERATION_NOT_IMPLEMENTED",
    "category": "CAPABILITY_GAP",
    "message": "Operation 'FOLD_3D_ROTATION' is not supported by OMR v0.1.0.",
    "supportedOperations": ["REFLECTION_ACROSS_LINE"],
    "roadmapReference": "OMR Phase 4+ (3D Spatial Folding)"
  }
}
```

### 5.5 Пример 5: Ошибка стороннего инструмента (`EXTERNAL_TOOL_ERROR`)
*(Сторонний симулятор вернул координаты, которые нарушили аксиомы отражения при проверке в L7)*

```json
{
  "protocolVersion": "3.0.0",
  "responseId": "resp-20261117-ext-01",
  "inResponseTo": "req-20261117-local-012",
  "execution": {
    "status": "EXECUTED",
    "engine": "EXTERNAL_TOOL_ADAPTER: OrigamiSimulator3D",
    "disclaimer": "Calculations produced by external tool are treated as UNTRUSTED_EXTERNAL_CLAIM"
  },
  "verification": {
    "serviceStatus": "VIOLATED",
    "contract": "CONTRACT_02_V2",
    "verdict": {
      "status": "FAIL",
      "mode": "RESULT_VERIFICATION",
      "residuals": {
        "midpointError": 0.0452,
        "maxLengthError": 0.0210
      },
      "diagnostics": [
        "AXIOM_RESIDUAL_VIOLATION: midpointError=0.0452 > epsilon=1e-7",
        "ISOMETRY_VIOLATION: maxLengthError=0.0210 > epsilon=1e-7"
      ]
    }
  },
  "error": {
    "code": "EXTERNAL_RESULT_VERIFICATION_FAILED",
    "category": "INDEPENDENT_VERIFICATION_REJECTION",
    "message": "Coordinates produced by external tool violated reflection isometry in L7.",
    "producerClaim": "Tool claimed successful fold",
    "receiverTruth": "L7 rejected geometry: midpointError=0.0452"
  }
}
```

---

## 6. Канонические ошибки протокола (Error Contract)

| Код ошибки | Категория | Описание |
| :--- | :--- | :--- |
| `INVALID_PROTOCOL_VERSION` | `PROTOCOL_ERROR` | Несовместимая или неуказанная версия протокола (`protocolVersion`). |
| `VALIDATION_FAILED` | `SCHEMA_ERROR` | Ошибка структуры JSON, отсутствие обязательных полей, нечисловые координаты. |
| `UNKNOWN_VERTEX_ID` | `GEOMETRY_ERROR` | В `movingVertexIds` или `fixedVertexIds` указана вершина, отсутствующая в `sourceState`. |
| `OVERLAPPING_PARTITION` | `GEOMETRY_ERROR` | Вершина одновременно указана и в `movingVertexIds`, и в `fixedVertexIds`. |
| `DEGENERATE_LINE_NORMAL` | `GEOMETRY_ERROR` | Вектор нормали $(n_x, n_y)$ имеет длину $\le \text{zeroNormalEpsilon}$ (`1e-12`). |
| `COORDINATE_OVERFLOW` | `NUMERICAL_ERROR` | Истинный образ вершины превышает диапазон представимости `Number.MAX_VALUE`. |
| `OPERATION_NOT_IMPLEMENTED`| `CAPABILITY_GAP` | Запрошена операция, отсутствующая в `implementedOperations`. |
| `STATE_VERSION_MISMATCH` | `CONCURRENCY_ERROR` | Запрос опирается на устаревшую версию `sourceState.version`. |
| `EXTERNAL_TOOL_TIMEOUT` | `TOOL_ERROR` | Сторонний симулятор не ответил в течение установленного таймаута. |
| `VERIFICATION_FAILED` | `VERIFICATION_ERROR` | Результат операции отвергнут независимым верификатором `L7`. |
