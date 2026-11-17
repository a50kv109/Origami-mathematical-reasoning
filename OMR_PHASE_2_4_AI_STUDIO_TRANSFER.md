# OMR Phase 2.4 — AI Studio Transfer Package (`OMR_PHASE_2_4_AI_STUDIO_TRANSFER.md`)

**Статус:** `TRANSFER & ARCHITECTURE SPECIFICATION — STRICT READ-ONLY`  
**Структура:** Строго по разделам `A`–`H` пакета переноса инженерных знаний Phase 2.4 (`OMR PHASE 2.4 — ENGINEERING INSIGHT EXTRACTION & TRANSFER PACKAGE`).  
**Связанные документы:** [OMR_PHASE_2_4_CRITICAL_AUDIT.md](./OMR_PHASE_2_4_CRITICAL_AUDIT.md), [OMR_PHASE_2_4_NUMERICAL_DECISIONS.md](./OMR_PHASE_2_4_NUMERICAL_DECISIONS.md), [OMR_PHASE_2_4_ORACLE_SPECIFICATION.md](./OMR_PHASE_2_4_ORACLE_SPECIFICATION.md), [OMR_PHASE_2_4_IMPLEMENTATION_READINESS.md](./OMR_PHASE_2_4_IMPLEMENTATION_READINESS.md), [OMR_PHASE_2_4_REPOSITORY_VALIDATION.md](./OMR_PHASE_2_4_REPOSITORY_VALIDATION.md).

---

## A. Project Context (`[VERIFIED FACT]`)

1. **Архитектура OMR (`L1–L7`):** Многоуровневая система детерминированных геометрических рассуждений. На текущем этапе (`v0.1.0` / `Contract 02 v2`) в исходном коде реализованы:
   - **`L2` ([src/core/l2GeometryEngine.ts](./src/core/l2GeometryEngine.ts)):** Детерминированный 2D-решатель `REFLECTION_ACROSS_LINE` через нормальную проекцию Хаусхолдера, выпускающий глубоко замороженные (`deepFreeze`) `GeometryState`, `ReflectionWitness` и `TraceEntry`.
   - **`L7` ([src/core/l7IndependentVerifier.ts](./src/core/l7IndependentVerifier.ts)):** Независимый Zero-Trust аксиоматический верификатор (`verifyResult` в 4 стадиях `A–D` и `verifyProcess`), импортирующий **только типы** из [src/core/types.ts](./src/core/types.ts).
   - **Контрактная прослойка:** [src/core/operationRequest.ts](./src/core/operationRequest.ts) (доверенные `OperationRequest`), [src/core/trace.ts](./src/core/trace.ts) (неизменяемый журнал `TRACE`), [src/core/types.ts](./src/core/types.ts).
2. **Граница фаз:**
   - **Phase 2.3.3 (`ROD-03`)**: Тестовый слой `Property F` поверх **неизменного** математического ядра (`src/core/*`); 4 базовых теста находятся в [tests/metamorphic.test.ts](./tests/metamorphic.test.ts), полный 6-уровневый классификатор ожидает явного разрешения `ROD-03`.
   - **Phase 2.4 (`Numerical Domain Hardening`)**: Устранение численных ограничений и дефектов `D-1..D-5` в арифметике `L2`/`L7` и создание независимого числового тестового оракула — **строго после утверждения решений `ND-01..ND-11` и без смешивания с `ROD-03`**.

---

## B. Verified Baseline (`[VERIFIED FACT]`, `[REPRODUCED]`)

1. **Инвентарь среды AI Studio (проверено локально):**
   - Node.js: `v22.23.2`; `node_modules` установлены (`tsx`, `vite`, `tsc`, `esbuild`, `rolldown`).
   - `.git`: отсутствует (`GIT_ABSENT` — хэш внешнего коммита `a3397d9` в этой песочнице не верифицируем).
   - `dist/`: отсутствует (`DIST_ABSENT=true`).
   - `public/assets/aistudio/`: `18` файлов (17 исторических материалов + вложение отчёта Phase 2.4).
   - Корневые `.md`-документы до добавления пакета Phase 2.4: `68` файлов (выверены в `DOCUMENTATION_RECONCILIATION_REPORT.md`).
   - `tests/`: ровно 2 файла (`tests/contract02.test.ts` — `19` тестов, `tests/metamorphic.test.ts` — `17` тестов).
2. **Прогон существующих тестов (`[REPRODUCED]`):**
   - Команда `./node_modules/.bin/tsx --test tests/contract02.test.ts tests/metamorphic.test.ts` завершается `36/36 PASS`, `0 FAIL`, `0 SKIP` (~`1.81 s`).
3. **Базовые контрольные суммы SHA-256 неизменённых файлов (`[VERIFIED FACT]`):**
   - `src/core/l2GeometryEngine.ts`: `0a06323947a436d85d6983c95849dd3e5a90d403e912a6f8eced7f511906abd4`
   - `src/core/l7IndependentVerifier.ts`: `fad116688fec4c084203fb863aaa2b55be958ed3b9391336cc971cbb098e7786`
   - `src/core/operationRequest.ts`: `9e5918ca7f58af33f438b8a37a2f266f62c927c17a315e6ea79b2ce4ef49272ca`
   - `src/core/trace.ts`: `edb8454a4ccccf6848a06f8e67309ad0543d2830569af41912cba93d981d37be`
   - `src/core/types.ts`: `438b7659f2318162ff96cbcc396bce753970a8aa4a33a8f45607d2475fa4680c`
   - `tests/contract02.test.ts`: `a474d079b07adbbd6ed60150770c86205399e7bc4e83705a29b9df7686a40672`
   - `tests/metamorphic.test.ts`: `284ba2c390e4e942c8755a831ff86586a9629066be1803859fa9daba68d587d8`
   - `package.json`: `9aec8b0a8aeccdc1d81f7e878dd393109e8762b5f3c644ececf21804423d587d8`
   - `package-lock.json`: `2efbc19485a8671091420bb92f83f7dcaf3ddf68282a8e7bfc2d54ec6a074c25`

---

## C. Numerical Defect Register (`D-1` – `D-8`)

| ID | Затронутый модуль и строки | Верифицированное состояние в AI Studio | Статус воспроизведения | Коррекция к внешнему досье |
| :- | :--- | :--- | :--- | :--- |
| **`D-1`** | [l7IndependentVerifier.ts:81-90](./src/core/l7IndependentVerifier.ts#L81-L90) | Нецентрированная Shoelace `computeSignedArea` теряет значащие биты при переносе $(s,s)$. | **`[REPRODUCED]`**: на треугольнике $(0,0),(1,0),(0,10^{-4})$ ($S=5\cdot 10^{-5}$) при $s\in[10^6,10^9,10^{12}]$ даёт $0$ (`UNDETERMINED`), при $s=10^{10}$ даёт `-8192` и ложный **`PASS`**! | Нельзя заменять на голый `orient2d` для $n \ge 4$ (нужна центрированная/точная сумма для $n$-угольников). |
| **`D-2`** | [l7IndependentVerifier.ts:50, 896](./src/core/l7IndependentVerifier.ts#L50) | Абсолютный порог `degenerateAreaEpsilon = 1e-12` смешивает масштаб и форму. | **`[REPRODUCED]`**: идеальный микротреугольник с катетом $10^{-6}$ ($|S|=5\cdot 10^{-13}$) получает `UNDETERMINED`; игла $10^6\times 10^{-10}$ ($|S|=5\cdot 10^{-5}, \rho=10^{-16}$) получает `PASS`. | Порог $\eta_{\text{deg}}$ — предмет политики (`ND-04`), не универсальная константа. |
| **`D-3`** | [l2GeometryEngine.ts:75-87, 310-316](./src/core/l2GeometryEngine.ts#L75-L87) | (1) `normSq` overflow бросает `DEGENERATE_NORMAL` с неверным текстом; (2) subnormal `normSq` теряет точность; (3) `nx*p.x` и `2*signedOffset` переполняются в `-Infinity` без throw при конечном истинном образе. | **`[REPRODUCED]`**: `n=(1e160,1e160)` бросает `DEGENERATE_NORMAL`; `n=(1e-160,1e-160), eps0=0` даёт ошибку $3.34\cdot 10^{-5}$ (`L7=FAIL`); `n=(1,1), p=(1e308,0)` и `n=(1e150,1e150), p=(1e160,0)` возвращают `(-Infinity,-Infinity)`. | Досье ошибочно утверждало, что `n=1e160` не бросает; а одного лишь `ldexp(n)` недостаточно при больших `p`. |
| **`D-4`** | [l7IndependentVerifier.ts:53-67](./src/core/l7IndependentVerifier.ts#L53-L67) (строка 59) | `areaEpsilon: overrides?.areaEpsilon ?? epsilon` тихо перезаписывает `areaEpsilon` при передаче только `epsilon`. | **`[REPRODUCED]`**: `verifyResult(..., { epsilon: 10 })` возвращает **`PASS`** при подмене площади `0.5 -> -2.5` (`areaError = 2`). | Досье не заметило строку 59 и спутало реальный `D-4` с периметро-зависимым допуском площади. |
| **`D-5`** | [l7IndependentVerifier.ts:847, 934, 945-947](./src/core/l7IndependentVerifier.ts#L847) | (1) Вакуумный `PASS` с `orientationInverted: true` при 0 чисто движущихся граней; (2) историческая изоляция `orientationInverted` достижима через `{ epsilon: 10, areaEpsilon: 1e-7 }`. | **`[REPRODUCED]`**: подтверждены оба кейса (`faces:[]`, all-mixed `PASS` и изолированный `FAIL`). | Требует решения `ND-07` без поломки `Contract 02 v2`. |
| **`D-6`** | Документация и `public/assets/aistudio/` | Корневые документы уже реконсилированы (`68` файлов до Phase 2.4); `18` файлов вложений сохранены по `ROD-02`/`OD-05`. | **`[VERIFIED FACT]`** | Замечания досье по `a3397d9` устарели. |
| **`D-7`** | [tests/metamorphic.test.ts:45, 1419-1718](./tests/metamorphic.test.ts#L45) | `tests/metamorphic.test.ts` проверяет `1e-12`; пробелы базовых 4 тестов Property F закрываются спецификацией `ROD-03` (`tests/propertyF_v1.test.ts` пока отсутствует). | **`[VERIFIED FACT]`** | Досье ошибочно считало, что тесты используют только `1e-7`. |
| **`D-8`** | Размер JS-бандла (`562.64 kB` vs `335.25 kB`) | Расхождение зафиксировано в исторических отчётах; `dist/` отсутствует. | **`[UNRESOLVED]`** | Причина досье (UI-бандлинг) не подтверждена; статус остаётся `UNRESOLVED`. |

---

## D. Architecture Proposal (`[ENGINEERING PROPOSAL]`)

1. **Минимальный рекомендуемый контур Phase 2.4 (вместо избыточного стека в runtime):**
   - **Уровень 1 в `src/core/` (Scale-Safe FP64 + точная площадь):**
     - В `L2`: двоичное масштабирование (`2^k`) параметров прямой `(nx, ny, c)` + overflow-safe шаг проекции Хаусхолдера + проверка конечности итоговых координат (см. `ND-05`).
     - В `L7`: развязка `resolveTolerances` (`D-4`), масштабная безопасность Stage C (`r_mid`, `r_perp`), центрированная + компенсированная/диадически-точная `computeSignedArea` для любых $n$-угольников (`D-1`), безразмерный критерий вырожденности по решению `ND-04` (`D-2`), согласованная семантика `D-5` (`ND-07`).
   - **Независимый оракул в `tests/` (Уровни Истины B и C):**
     - `BigRational` (`BigInt`) + точный IEEE-754 декодер (`DataView`), без импорта кода из `src/core/`.
   - **Отложено в Phase 2.5+:**
     - `Interval64` (допускается только через битовые `nextUp`/`nextDown`, не через `1 ± EPSILON`).
     - `ExactRational` внутри рабочего цикла `L2`/`L7` (имеет смысл только вместе с `ExactGeometryState` в `Contract 02 v3`).
2. **Жёсткая анти-Common-Mode граница:** `L2` и `L7` сохраняют различные математические модели (проекция vs аксиомы + изометрия + площадь); общий код ограничивается строго низкоуровневыми IEEE-754 примитивами либо дублируется независимо.

---

## E. Required Repository Inspection (Статус выполнения)

| Пункт инспекции | Результат | Подтверждение |
| :--- | :--- | :--- |
| Проверка SHA-256 и неизменности `src/core/*`, `tests/*`, конфигов | **Выполнено (идентичны базовым)** | Раздел B и Раздел 1 [OMR_PHASE_2_4_REPOSITORY_VALIDATION.md](./OMR_PHASE_2_4_REPOSITORY_VALIDATION.md) |
| Построчный аудит `l2GeometryEngine.ts` (404 строки), `l7IndependentVerifier.ts` (1286 строк), `types.ts`, `operationRequest.ts`, `trace.ts` | **Выполнено (100%)** | Раздел 2 [OMR_PHASE_2_4_REPOSITORY_VALIDATION.md](./OMR_PHASE_2_4_REPOSITORY_VALIDATION.md) |
| Прогон 36 тестов без модификации файлов | **Выполнено (`36/36 PASS`)** | Вывод `./node_modules/.bin/tsx --test` |
| Read-only воспроизведение `D-1..D-5` в памяти | **Выполнено (`5/5` воспроизведены)** | Read-only `tsx -e` зонд |
| Проверка `.git`, `dist/`, `node_modules`, `public/assets/aistudio/` | **Выполнено** | `.git` отсутствует, `dist/` отсутствует, `18` файлов в `public/assets/aistudio/` |
| Диагностика `D-8` (сборка `vite build`) | **Не выполнялась (read-only запрет записи в `dist/`)** | Статус `UNRESOLVED` |

---

## F. Verification Tasks (Для выполнения ПОСЛЕ авторизации Phase 2.4)

1. Реализовать изолированный тестовый оракул Уровней B и C в `tests/` по [OMR_PHASE_2_4_ORACLE_SPECIFICATION.md](./OMR_PHASE_2_4_ORACLE_SPECIFICATION.md) (блоки `O-1`–`O-7`).
2. Зафиксировать регрессию всех `36` существующих тестов (`tests/contract02.test.ts` + `tests/metamorphic.test.ts`) без ломающих изменений публичного API (кроме явно утверждённых в `ND-04`/`ND-07`).
3. Подтвердить прохождение тестов `D-1` (сдвиг $10^6..10^{12}$ + невыпуклые $n$-угольники), `D-2` (микротреугольник $10^{-6}$ vs игла $10^6\times 10^{-10}$), `D-3` (`1e±160`, `(1e308, 0)`), `D-4` (`{ epsilon: 10 }`), `D-5` и 1000-шаговых цепочек против Уровня C и Уровня B.
4. Перепроверить правило архитектурной изоляции `L7` (нулевые runtime-импорты из `L2`/`TRACE`/`OperationRequest` и отсутствие общих геометрических решателей между `L2` и `L7`).

---

## G. Decision Register

Полный реестр из 11 решений (`ND-01` – `ND-11`) с вариантами и влиянием на `Contract 02` зафиксирован в [OMR_PHASE_2_4_NUMERICAL_DECISIONS.md](./OMR_PHASE_2_4_NUMERICAL_DECISIONS.md). Ключевые блокирующие вопросы для владельца:
- `ND-01 / ND-09 / ND-10`: Утвердить минимальный объём Phase 2.4 (`Scale-Safe FP64` + точная площадь/предикат в ядре, `ExactRational` только в оракуле; `Interval64` и `ExactGeometryState` в Phase 2.5+).
- `ND-04`: Выбрать безразмерный критерий вырожденности и политику $\eta_{\text{deg}}$.
- `ND-05`: Утвердить overflow-safe проекцию `L2` и `throw INVALID_COORDINATE` при математическом выходе за `MAX_VALUE`.
- `ND-06`: Утвердить развязку `D-4` (обязательно) и целевую модель площадного допуска с учётом периметра.
- `ND-07`: Определить контрактную политику для вакуумного `orientationInverted` (`D-5`).

---

## H. Implementation Readiness

- **Для планирования и принятия решений:** **ГОТОВО (`READY FOR OWNER REVIEW & DECISION SIGN-OFF`)**.
- **Для начала написания кода Phase 2.4:** **НЕ ГОТОВО (`BLOCKED ON OWNER DECISIONS ND-01..ND-11 & AUTHORIZATION`)**. Подробные гейты и критерии допуска приведены в [OMR_PHASE_2_4_IMPLEMENTATION_READINESS.md](./OMR_PHASE_2_4_IMPLEMENTATION_READINESS.md) и разделе 9 [OMR_PHASE_2_4_REPOSITORY_VALIDATION.md](./OMR_PHASE_2_4_REPOSITORY_VALIDATION.md).
