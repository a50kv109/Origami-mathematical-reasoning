# Origami Mathematical Reasoning (OMR)

**Версия:** `0.1.0` (**Phase 2.1 — Verified 2D Reflection Prototype**)  
**Репозиторий:** <https://github.com/a50kv109/Origami-mathematical-reasoning>  
**Лицензия:** [Apache License 2.0](./LICENSE)

**Origami Mathematical Reasoning (OMR)** — исследовательско-инженерное математическое ядро на TypeScript для формального представления геометрических состояний, воспроизводимого журналирования преобразований (`TRACE`) и **независимой Zero-Trust верификации** в парадигме *Certifying Algorithms*.

> **Важная граница релиза `v0.1.0`:** OMR **не является** полноценной системой физического складывания оригами, 3D-симулятором или графическим редактором. В текущей версии `0.1.0` реализован только проверяемый 2D-контур `L2 → ReflectionWitness → TRACE → L7` для операции отражения относительно прямой (`REFLECTION_ACROSS_LINE`).

---

## 1. Назначение OMR

Цель проекта — отделить математическую доказательность от планирования операций ИИ-агентами и от внешних CAD/оригами-инструментов:

- математический генератор (**L2**) выполняет вычисления и выпускает проверяемое свидетельство перехода (`ReflectionWitness`);
- журнал переходов (**TRACE**) фиксирует глубоко замороженную цепочку состояний `S₀ → S₁ → …`;
- независимый верификатор (**L7**) проверяет результат и процесс по математическим аксиомам **без доверия генератору** и без повторного запуска его решателя.

Долгосрочно проект развивается как переносимая математическая основа для геометрического рассуждения в задачах перехода `2D → 3D` (развёртки, листовые конструкции, сборка панелей).

---

## 2. Текущие возможности (`v0.1.0`)

Реализовано и подтверждено автотестами (`13/13` в `tests/contract02.test.ts`):

- **Типизированные контракты (`src/core/types.ts`):** `GeometryState` (с `stateId`, `version`, `vertices`, `edges`, `faces`), `LineNormalParams`, `ReflectionWitness`, `TraceEntry`, `VerificationClaim`, `VerificationVerdict`, `VerifierTolerances`.
- **Детерминированный генератор 2D-отражений (`src/core/l2GeometryEngine.ts`):** вычисление `REFLECTION_ACROSS_LINE` в двойной точности IEEE-754 (без округления `.toFixed`) с поддержкой частичного отражения подмножества вершин и выпуском `ReflectionWitness`.
- **Иммутабельный журнал `TRACE` (`src/core/trace.ts`):** глубокое клонирование и заморозка (`deepFreeze`) состояний, свидетельств и записей переходов.
- **Аксиоматический верификатор `L7` (`src/core/l7IndependentVerifier.ts`):** 4-этапная Zero-Trust проверка (`verifyResult` и `verifyProcess`) с нулевым рантайм-импортом из `L2` и `TRACE`.
- **Интерактивный веб-стенд (`src/components/VerificationWorkbench.tsx` + `src/App.tsx`):** клиентская визуализация `L2 ↔ L7`, пресетов осей, сценариев искажений и журнала `TRACE` вместе с паспортом архитектуры.

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

В `v0.1.0` слой `L2` реализует две основные функции и типизированные ошибки `L2EngineError`:

- `createInitialGeometryState(input)` — формирует и глубоко замораживает начальный снимок `GeometryState` с проверкой конечности `version` и координат, а также уникальности `VertexID`.
- `reflectAcrossLine(input)` — выполняет 2D-отражение вершин из `movingVertexIds` относительно прямой в нормальной форме `LineNormalParams`:
  $$n_x x + n_y y = c$$
  по формуле ортогональной проекции в IEEE-754 `f64`:
  $$p' = p - 2 \frac{n \cdot p - c}{n \cdot n} n$$
  - Все `VertexID`, `EdgeID` и `FaceID` сохраняются.
  - Вершины вне `movingVertexIds` (формирующие `fixedVertexIds`) копируются без изменений.
  - Проверенная обработка вырожденных и некорректных входов: `INVALID_COORDINATE`, `DEGENERATE_NORMAL` (`||n|| <= 1e-12` по умолчанию), `UNKNOWN_VERTEX_ID`, `DUPLICATE_VERTEX_ID`.

---

## 5. Контракт `ReflectionWitness` (`src/core/types.ts`)

`reflectAcrossLine` формирует глубоко замороженный `ReflectionWitness`, связывающий исходное состояние, целевое состояние и преобразование:

- идентификаторы и версии: `witnessId`, `operationId`, `operation: 'REFLECTION_ACROSS_LINE'`, `sourceStateId`, `sourceStateVersion`, `targetStateId`, `targetStateVersion`;
- параметры оси: `axis: { n: { nx, ny }, c }`;
- разбиение вершин: `movingVertexIds`, `fixedVertexIds`;
- пары соответствия: `vertexPairs: [{ vertexId, p, pPrime }]`;
- необязательные диагностические невязки генератора `claimedResiduals?: { maxMidpointError, maxCollinearityError }` — **строго игнорируются в `L7`** согласно Zero-Trust.

---

## 6. Журнал переходов `TRACE` (`src/core/trace.ts`)

`TRACE` представляет собой массив неизменяемых записей `TraceEntry` (`stepIndex`, `operationId`, `sourceStateVersion`, `targetStateVersion`, `sourceState`, `resultingState`, `parameters`, `witness`, `precision`, `provenance`, `timestamp`):

- `deepFreeze(value)` — рекурсивная заморозка (`Object.freeze`) состояний и свидетельств;
- `cloneGeometryState(state)` и `cloneReflectionWitness(witness)` — иммутабельное глубокое копирование с сохранением точных значений IEEE-754;
- `createTraceEntry(input)` и `appendTraceEntry(trace, entry)` — построение и пошаговое наращивание замороженного журнала.

---

## 7. Независимая проверка L7 (`src/core/l7IndependentVerifier.ts`)

Модуль `L7` **не импортирует** ни одной функции или структуры среды выполнения из `L2` и `TRACE` (разрешены только чистые типы `import type ... from './types'`, что проверяется статическим тестом). Вместо повторного вычисления координат решателем `L7` проверяет `VerificationClaim` и `TraceEntry[]` в четыре этапа:

1. **Stage A (Допустимость входа):** проверка конечности всех IEEE-754 чисел и невырожденности нормали `||n|| > zeroNormalEpsilon` (`1e-12`). При нарушении возвращается `UNDETERMINED`.
2. **Stage B (Трёхсторонняя привязка `witness ↔ claim ↔ states`):** согласованность `stateId`/`version`, совпадение оси в `claim` и `witness`, сохранение всех `VertexID`/`EdgeID`/`FaceID`, дизъюнктное разбиение `movingVertexIds` / `fixedVertexIds`, биекция `witness.vertexPairs`, неподвижность `fixedVertexIds`. Поле `witness.claimedResiduals` полностью игнорируется.
3. **Stage C (Масштаб-инвариантные аксиомы отражения):**
   $$r_{\text{mid}} = \frac{|n \cdot (p + p') - 2c|}{2\|n\|} \le \varepsilon, \qquad r_{\text{perp}} = \frac{|(p' - p) \times n|}{\|n\|} \le \varepsilon$$
   где $\|n\| = \operatorname{hypot}(n_x, n_y)$. По точному тождеству $\|p' - p'_{\text{exact}}\|_2 = \sqrt{4\,r_{\text{mid}}^2 + r_{\text{perp}}^2}$ выполнение аксиом гарантирует корректность отражения без пересчёта формулы `L2`.
4. **Stage D (Инварианты области действия):** сохранение длин всех рёбер и хорд и модуля площади $|S|$ (формула Гаусса / Shoelace) на чисто движущихся и чисто фиксированных элементах, а также строгая инверсия знака ориентированной площади на невырожденных чисто движущихся гранях (`|S| > degenerateAreaEpsilon`). Смешанные грани/рёбра (между `moving` и `fixed`) исключаются из проверки жёсткости.

Допуски по умолчанию (`DEFAULT_VERIFIER_TOLERANCES`):
- `epsilon = 1e-7`
- `areaEpsilon = 1e-7`
- `zeroNormalEpsilon = 1e-12`
- `degenerateAreaEpsilon = 1e-12`

Режимы и вердикты: `verifyResult(claim, overrides?)` и `verifyProcess(trace, overrides?)` возвращают `VerificationVerdict` со статусом **`PASS | FAIL | UNDETERMINED`**.

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
# Автоматические тесты (Contract 02 v2, 13 сценариев на node:test + tsx)
npm test

# Проверка типов TypeScript (tsc --noEmit)
npm run lint

# Сборка клиентского стенда (Vite -> dist/)
npm run build

# Локальный dev-сервер стенда на http://localhost:3000
npm run dev

# Очистка артефактов сборки (dist/)
npm run clean
```

---

## 9. Ограничения версии `0.1.0`

1. **Узкая предметная область:** реализована только плоская 2D-операция `REFLECTION_ACROSS_LINE` на заранее заданном графе `GeometryState`. Операции `FACE_SUBDIVISION` (L1), Z-порядок слоёв (L3), 3D-кинематика (L4), криволинейные сгибы (L5) и оптимизация (L6) в коде отсутствуют.
2. **Отсутствие `OperationRequest` (архитектурный риск):** `VerificationClaim` содержит параметры `claim.parameters` и `witness`, но не отдельный доверенный `OperationRequest` от внешнего постановщика задачи. Согласованная подмена оси одновременно в `claim.parameters` и `witness` не может быть обнаружена внутри `verifyResult` без внешнего эталона.
3. **Вердикт `CAPABILITY_GAP` пока не реализован:** `VerificationStatus` в `src/core/types.ts` ограничен значениями `'PASS' | 'FAIL' | 'UNDETERMINED'`.
4. **Арифметика IEEE-754 `f64`:** при экстремальных масштабах сдвига ($|c| \gg 10^{10}$) или длинных цепочках отражений возможно сокращение мантиссы; точная/интервальная арифметика (`BigInt`) запланирована на следующие фазы.
5. **Отсутствие криптографической привязки `TRACE`:** целостность `TRACE` проверяется структурно в памяти без канонизации JCS (RFC 8785) и хеш-цепочек SHA-256.
6. **Граничный случай `stepIndex: NaN` в `verifyProcess`:** в `src/core/l7IndependentVerifier.ts` (`entry.stepIndex <= prev.stepIndex`) значение `NaN` не перехватывается сравнением порядка (устранение отложено на Phase 2.2).
7. **Пакетный режим:** `package.json` помечен `"private": true`; актуальным lock-файлом для воспроизводимой установки является `package-lock.json` (`bun.lock` сохранён в корне с раннего этапа и не используется в CI/npm-потоке).

---

## 10. Roadmap

| Фаза | Область | Статус |
| :--- | :--- | :--- |
| **Phase 1** | Архитектура `L1–L7`, эпистемическая дисциплина и аудит источников | Завершено |
| **Phase 2.1** | `Contract 02 v2` (`L2 ↔ L7`, `ReflectionWitness`, аксиоматический L7) | **Реализовано (`v0.1.0`)** |
| **Phase 2.2** | `OperationRequest`, строгая проверка `stepIndex`, `tsconfig` `"strict": true`, `CAPABILITY_GAP` | Запланировано |
| **Phase 3** | `Contract 01` (`L1 ↔ L2`, `FACE_SUBDIVISION`, `portableId != localId`) | Запланировано |
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

## 11. Лицензия

Исходный код и документация OMR распространяются под лицензией **Apache License 2.0**. Полный текст приведён в файле [`LICENSE`](./LICENSE).
