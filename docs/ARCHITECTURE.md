# Architecture Specification — Origami Mathematical Reasoning (OMR)

**Версия документа:** `0.1.0` (актуализировано под реализацию **Phase 2.2 — Trusted `OperationRequest` & Contract 02 Hardening**)  
**Принцип:** Строгое отделение математического ядра (`Reasoning Core`) от инструментов проектирования (`Design Tools`) и контура рассуждений агента (`AI Skill`), а внутри ядра — изоляция независимого верификатора (`L7`) от генератора (`L2`) и отделимость доверенного запроса (`OperationRequest`) от утверждений генератора (`VerificationClaim` / `ReflectionWitness`).

---

## 1. Фундаментальные абстракции ядра

| Понятие | Назначение | Фактический статус в текущей кодовой базе |
| :--- | :--- | :--- |
| **STATE** | Типизированный иммутабельный снимок геометрии и топологии (`GeometryState` с `stateId`, `version`, `vertices`, `edges`, `faces`) | **Реализовано для 2D (`src/core/types.ts`)** в двойной точности IEEE-754 без округления. |
| **OPERATION REQUEST** | Отдельный доверенный иммутабельный запрос на операцию (`OperationRequest` с `operationRequestId`, `sourceStateId`, `sourceStateVersion`, `parameters`, `movingVertexIds`, `fixedVertexIds`, `requestProvenance`) | **Реализовано (`src/core/operationRequest.ts`, `deepFreeze`)** с разделением от `VerificationClaim` и `ReflectionWitness`. |
| **TRANSFORMATION** | Детерминированный математический оператор с проверкой предусловий, привязкой к `OperationRequest` и выпуском свидетельства | **Реализован `REFLECTION_ACROSS_LINE`** (`src/core/l2GeometryEngine.ts`) с выпуском `ReflectionWitness`. Прочие операторы (`FACE_SUBDIVISION`, `INTERSECT`, 3D) запланированы. |
| **TRACE** | Иммутабельный журнал переходов `TraceEntry[]` с глубоко замороженными состояниями, исходными запросами и свидетельствами | **Реализовано в памяти (`src/core/trace.ts`, `deepFreeze`)**. Криптографическая привязка (JCS RFC 8785 + SHA-256) и сквозная трассировка `L1–L6` запланированы. |
| **RESULT VERIFICATION** | Независимая Zero-Trust оценка одного перехода через `verifyResult(claim, request, overrides?)` | **Реализовано (`verifyResult` в `src/core/l7IndependentVerifier.ts`)**. |
| **PROCESS VERIFICATION** | Последовательная проверка цепочки переходов `Sᵢ → Sᵢ₊₁`, соответствия `OperationRequest[]`, конечности/монотонности `stepIndex` и структурной непрерывности в `TRACE` | **Реализовано (`verifyProcess` в `src/core/l7IndependentVerifier.ts`)**. |

Главное архитектурное ограничение: запрещено объединять все характеристики объекта в единый монолитный кортеж `S = (G, A, X, L, K)`. Каждый слой работает со своей проекцией состояния через строгий контракт.

---

## 2. Семислойная архитектура (L1–L7)

| Слой | Название | Пространство | Ключевые операции | Фактический статус |
| :--- | :--- | :--- | :--- | :--- |
| **L1** | Topological Layer | Дискретные графы (`VertexID`, `EdgeID`, `FaceID`) | `FACE_SUBDIVISION`, `MATERIAL_CUT` | **Проектирование (не реализовано):** запланировано в Phase 3 (`Contract 01`). |
| **L2** | Geometric Layer | Евклидово пространство `ℝ²`, `ℝ³` | `REFLECTION_ACROSS_LINE` *(реализовано)*; `BIND_GEOMETRY`, `INTERSECT` *(план)* | **Частично реализовано (`src/core/l2GeometryEngine.ts`):** 2D-отражение по `OperationRequest` с выпуском `ReflectionWitness`. |
| **L3** | Layer Order Layer | Комбинаторика перекрытий (Z-порядок) | `LAYER_ORDER_RESOLUTION` | **Концепция (не реализовано):** запланировано на Phase 5. |
| **L4** | Kinematic Layer | Непрерывные траектории `γ(t), t ∈ [0,1]` | `FOLD_KINEMATIC` | **Концепция (не реализовано):** запланировано на Phase 5. |
| **L5** | Curved Folding Layer | Криволинейные складки и поверхности | `CURVED_APPROXIMATION`, `TRIANGULATE` | **Исследовательская постановка:** Phase 7. |
| **L6** | Optimization Layer | Эвристический поиск и ранжирование | `SEARCH_CANDIDATES`, `RANK_SEQUENCES` | **Исследовательская база:** Phase 6. |
| **L7** | Independent Verification Layer | Доказательное Zero-Trust пространство | `verifyResult`, `verifyProcess` | **Реализовано для Contract 02 v2 (`src/core/l7IndependentVerifier.ts`)** с привязкой к `OperationRequest`. |

---

## 3. Межмодульные контракты

### Contract 01 — `L1 ↔ L2` (Topology ↔ Geometry) — *[ЗАПЛАНИРОВАНО, Phase 3]*
- **Предмет:** связь дискретных идентификаторов графа (`VertexID`, `EdgeID`, `FaceID`) с координатами в `ℝ²`, версионирование состояний и передача геометрических предложений для `FACE_SUBDIVISION`.
- **Целевое правило:** `L2` вычисляет геометрические точки пересечения, а `L1` проверяет топологическую допустимость и порождает новые идентификаторы (`portableId != localId`).
- **Статус:** не реализовано; исходные состояния для `L2` в текущем прототипе конструируются напрямую с уже заданными гранями и рёбрами.

### Contract 02 v2 — `L2 ↔ L7` (Geometry ↔ Independent Verification) — *[УСИЛЕНО В Phase 2.2]*
- **Парадигма:** *Certifying Algorithms + Trusted `OperationRequest`* — внешний постановщик формирует глубоко замороженный `OperationRequest`, генератор `L2` исполняет строго запрошенные параметры без подмены и выпускает `ReflectionWitness` с `operationRequestId`, а `L7` проверяет как математическую корректность, так и соответствие исходному запросу.
- **Представление прямой:** `LineNormalParams { nx, ny, c }` для уравнения $n_x x + n_y y = c$ (без домысливания нормализации на стороне входа).
- **Изоляция `L7`:** `src/core/l7IndependentVerifier.ts` не импортирует никаких рантайм-функций из `L2`, `TRACE` или `operationRequest` (только `import type` из `types.ts`) и не запускает повторно решатель или 3×3 матрицу отражения.
- **Проверка `L7`:** 4 последовательных этапа:
  1. Stage A: допустимость чисел IEEE-754 и `||n|| > zeroNormalEpsilon` в `request`, `claim`, `witness` и состояниях (`UNDETERMINED` при нарушении).
  2. Stage B: привязка к доверенному запросу (`requestBound`: совпадение `operationRequestId`, `operation`, `sourceStateId/Version`, оси и разбиения `movingVertexIds`/`fixedVertexIds` между `request`, `claim`, `witness` и `TRACE`) и трёхсторонняя привязка свидетельства (`witnessBound`) с игнорированием `claimedResiduals`.
  3. Stage C: проверка аксиом отражения $r_{\text{mid}}$ и $r_{\text{perp}}$ (инвариантных к масштабированию коэффициентов уравнения прямой $(n_x, n_y, c) \mapsto \alpha\,(n_x, n_y, c)$) относительно оси запроса и оси утверждения.
  4. Stage D: scope-aware инварианты длин, площадей и строгой инверсии ориентации на чисто движущихся и чисто фиксированных элементах.
- **Выходной вердикт `L7`:** `'PASS' | 'FAIL' | 'UNDETERMINED'`. *(Примечание: код ответа `CAPABILITY_GAP` запланирован на последующие фазы).*

### Последующие контракты (запланированы)
`L2 ↔ L3` (Geometry / Layer Order) · `L3 ↔ L4` (Layer Order / Kinematics) · `L4 ↔ L7` (Kinematic Verification) · `L5 ↔ L6` (Curved Folding / Optimization) · `L6 ↔ L7` (Candidate Evaluation / Verification).

---

## 4. Граница между Ядром, Навыком ИИ и Инструментами

1. **AI Skill** *(запланирован на Phase 8)* отвечает за перевод задачи с естественного языка в план операций, но **никогда** не выставляет вердикт `PASS`.
2. **Reasoning Core (`L1–L7`)** владеет каноническим состоянием (`GeometryState`), строит `TRACE` и выносит детерминированный вердикт в `L7`.
3. **Tool Integration Layer** *(спроектирован, не реализован в `v0.1.0`)* транслирует операции в форматы внешних программ (`.fold`, `.cp`, `.ori`) и возвращает результат обратно на проверку в `L7` по принципу Zero-Trust Import.
