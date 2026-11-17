# OMR Phase 2.4 — Repository Validation Report (`OMR_PHASE_2_4_REPOSITORY_VALIDATION.md`)

**Режим проверки:** `STRICT READ-ONLY REPOSITORY VALIDATION`  
**Полнота охвата:** Проверены все файлы `src/core/*`, оба тестовых файла `tests/*`, конфигурация сборки, структура дерева и вложение `PHASE_2_4_NUMERICAL_DOMAIN_RESEARCH.md` (`/public/assets/aistudio/Paste_November_17__2026_-_7_25PM_ab54face`).  
**Целостность:** Во время проверки **не изменялся и не удалялся ни один** исходный файл, тест, конфигурационный файл, lock-файл или исторический документ; сборка `dist/` не запускалась.

---

## 1. Verified Baseline (`[VERIFIED FACT]`, `[REPRODUCED]`)

- **Среда выполнения:** Node.js `v22.23.2`, установленные `node_modules` (`tsx`, `vite`, `tsc`, `esbuild`, `rolldown`).
- **Git и сборка:** Каталог `.git` **отсутствует** (`GIT_ABSENT`, внешний коммит `a3397d9` локально не верифицируем); каталог `dist/` **отсутствует** (`DIST_ABSENT=true`).
- **Состав каталогов:**
  - `src/core/`: 5 файлов (`types.ts`, `operationRequest.ts`, `trace.ts`, `l2GeometryEngine.ts`, `l7IndependentVerifier.ts`).
  - `tests/`: 2 файла (`contract02.test.ts` — `19` тестов, `metamorphic.test.ts` — `17` тестов; файл `tests/propertyF_v1.test.ts` отсутствует).
  - `public/assets/aistudio/`: `18` файлов (17 исторических материалов + 1 новое вложение Phase 2.4).
  - Корень проекта: `68` `.md`-файлов до создания документов Phase 2.4, плюс `package.json`, `package-lock.json`, `bun.lock`, `tsconfig.json`, `vite.config.ts`.
- **Прогон тестов в read-only режиме (`[REPRODUCED]`):**
  - `./node_modules/.bin/tsx --test tests/contract02.test.ts tests/metamorphic.test.ts` $\to$ **`36` passed, `0` failed, `0` skipped** (`~1.81 s`).
- **SHA-256 эталонного состояния (проверено на неизменность):**
  - `src/core/l2GeometryEngine.ts`: `0a06323947a436d85d6983c95849dd3e5a90d403e912a6f8eced7f511906abd4`
  - `src/core/l7IndependentVerifier.ts`: `fad116688fec4c084203fb863aaa2b55be958ed3b9391336cc971cbb098e7786`
  - `src/core/operationRequest.ts`: `9e5918ca7f58af33f438b8a37a2f266f62c927c17a315e6ea79b2ce4ef49272ca`
  - `src/core/trace.ts`: `edb8454a4ccccf6848a06f8e67309ad0543d2830569af41912cba93d981d37be`
  - `src/core/types.ts`: `438b7659f2318162ff96cbcc396bce753970a8aa4a33a8f45607d2475fa4680c`
  - `tests/contract02.test.ts`: `a474d079b07adbbd6ed60150770c86205399e7bc4e83705a29b9df7686a40672`
  - `tests/metamorphic.test.ts`: `284ba2c390e4e942c8755a831ff86586a9629066be1803859fa9daba68d587d8`
  - `package.json`: `9aec8b0a8aeccdc1d81f7e878dd393109e8762b5f3c644ececf21804423d5f88`
  - `package-lock.json`: `2efbc19485a8671091420bb92f83f7dcaf3ddf68282a8e7bfc2d54ec6a074c25`

---

## 2. File-by-File Findings (`[VERIFIED FACT]`)

| Файл | Строки | Верифицированные наблюдения |
| :--- | :--- | :--- |
| [src/core/types.ts](./src/core/types.ts) | 13–45, 136–179 | `Point2D` хранит `readonly x: number; readonly y: number` (`binary64`). `Face2D.vertexIds` допускает произвольное число вершин ($n \ge 3$). `VerifierTolerances` фиксирует 4 поля (`epsilon`, `areaEpsilon`, `zeroNormalEpsilon`, `degenerateAreaEpsilon`). `VerificationPredicates` содержит 9 `boolean`-флагов, включая `orientationInverted: boolean`. |
| [src/core/operationRequest.ts](./src/core/operationRequest.ts) | 18–146 | Фабрика доверенных `OperationRequest` (`REFLECTION_ACROSS_LINE`), глубоко замораживает параметры прямой и явное разбиение `movingVertexIds`/`fixedVertexIds` вне `L2`. |
| [src/core/trace.ts](./src/core/trace.ts) | 19–190 | Рекурсивный `deepFreeze` (`Object.freeze`) и неизменяемые клоны состояний, запросов, свидетельств (`ReflectionWitness`) и `TraceEntry`. Числовой логики не содержит. |
| [src/core/l2GeometryEngine.ts](./src/core/l2GeometryEngine.ts) | 38, 67–90, 310–336 | `L2_DEFAULT_ZERO_NORMAL_THRESHOLD = 1e-12`. В `validateLineParams` (строки 75–87): `norm = Math.hypot(...)`, `normSq = nx*nx + ny*ny`; при `!Number.isFinite(normSq)` (строка 80) бросает **`DEGENERATE_NORMAL`** с ложным текстом ``||n|| = ${norm} <= ${zeroNormalEps}``. В проекции (строки 311–316): `signedOffset = nx*p.x + ny*p.y - c; factor = (2*signedOffset)/normSq; p' = p - factor*n`. Проверка конечности `pPrime` отсутствует — при переполнении `nx*p.x` или `2*signedOffset` возвращает `±Infinity` без throw. |
| [src/core/l7IndependentVerifier.ts](./src/core/l7IndependentVerifier.ts) | 28–67, 81–90, 285–972, 980–1285 | **Изоляция (строки 28–44):** только `import type ... from './types'`. **`resolveTolerances` (строка 59):** `areaEpsilon: overrides?.areaEpsilon ?? epsilon` (реальный `D-4`). **`computeSignedArea` (строки 81–90):** нецентрированная Shoelace (`D-1`). **Stage A (345–417):** нечисловые или `norm <= zeroNormalEpsilon` или `!Number.isFinite(norm)` $\to$ `UNDETERMINED`. **Stage B (420–754):** строгая привязка request/claim/witness и неподвижность fixed-вершин. **Stage C (764–811):** невязки `r_mid`, `r_perp` без масштабирования `n*(p+p')` и `(p'-p)*n`. **Stage D (816–947):** `orientationInverted = true` по умолчанию (строка 847, `D-5`), `degenerateAreaEpsilon = 1e-12` (строка 896, `D-2`), `anyHardFailure` включает `(hasNonDegenerateMovingFace && !orientationInverted)` (строка 934). |
| [tests/contract02.test.ts](./tests/contract02.test.ts) | 1–1299 | `19` контрактных тестов, включая проверку архитектурной изоляции `L7` (тест #12), привязку `OperationRequest`, Zero-Trust игнор `claimedResiduals`, проверку `TRACE stepIndex`. |
| [tests/metamorphic.test.ts](./tests/metamorphic.test.ts) | 45, 1370–1721 | `17` метаморфных тестов (Properties A–F), используют `METAMORPHIC_COORD_TOLERANCE = 1e-12` (строка 45) и дублирующую копию `computeSignedArea` (`1383–1403`); включают 4 базовых теста `Property F`. |
| `package.json`, `tsconfig.json`, `vite.config.ts` | — | Стандартный Vite + React + TS конфиг; отсутствуют сторонние числовые библиотеки (`decimal.js`, `big.js` и т.п.). |

---

## 3. `D-1` – `D-8` Status Matrix (`[VERIFIED FACT]`, `[REPRODUCED]`, `[UNRESOLVED]`)

| ID | Описание (реконсилированное по живому коду) | Воспроизведено в песочнице? | Конкретный результат read-only зонда | Соответствие внешнему досье |
| :- | :--- | :--- | :--- | :--- |
| **`D-1`** | Нецентрированная Shoelace в `L7:81-90` | **Да `[REPRODUCED]`** | Треугольник `(s,s),(s+1,s),(s,s+1e-4)` ($S=5\cdot 10^{-5}$): при $s=10^6,10^8,10^9,10^{12}$ `L7` даёт `0` (`UNDETERMINED`); при $s=10^{10}$ даёт `-8192` / `+8192` и ложный **`PASS`**. | Частично: досье верно описало потерю точности, но ошибочно предложило голый `orient2d` для $n$-угольников. |
| **`D-2`** | Абсолютный порог `1e-12` в `L7:50,896` | **Да `[REPRODUCED]`** | Микро-треугольник с катетами $10^{-6}$ ($|S|=5\cdot 10^{-13}$) $\to$ `UNDETERMINED`; вытянутая игла $10^6 \times 10^{-10}$ ($|S|=5\cdot 10^{-5}, \rho=10^{-16}$) $\to$ `PASS`. | Согласовано; выбор $\eta_{\text{deg}}$ остаётся политикой (`ND-04`). |
| **`D-3`** | Переполнение/субнормальный андерфлоу `L2` (`75-87`, `310-316`) | **Да `[REPRODUCED]`** | `n=(1e160,1e160)` бросает `DEGENERATE_NORMAL` (`<= 1e-12`); `n=(1e-160,1e-160), eps0=0` искажает `p'` на $3.34\cdot 10^{-5}$ (`L7=FAIL`); `n=(1,1), p=(1e308,0)` и `n=(1e150,1e150), p=(1e160,0)` тихо возвращают `(-Infinity, -Infinity)` при конечном точном образе! | **Не согласовано:** досье ошиблось про `1e160` (реально бросает) и недооценило overflow проекции при больших `p`. |
| **`D-4`** | Сцепление `areaEpsilon ?? epsilon` в `L7:59` | **Да `[REPRODUCED]`** | `verifyResult(..., { epsilon: 10 })` возвращает **`PASS`** на искажении площади `0.5 -> -2.5` (`areaError=2`); `{ epsilon: 10, areaEpsilon: 1e-7 }` $\to$ `FAIL`. | **Не согласовано:** досье не увидело строку `L7:59` и описало другую задачу (связь с периметром). |
| **`D-5`** | Вакуумный `orientationInverted: true` (`L7:847`) + историческая изоляция | **Да `[REPRODUCED]`** | `faces: []` и 100% смешанная грань $\to$ `PASS` с `orientationInverted: true`; `{ epsilon: 10, areaEpsilon: 1e-7 }` изолирует `FAIL` исключительно по `orientationInverted: false`. | Досье не учло историю изоляции из Phase 2.3.3. |
| **`D-6`** | Документация и `public/assets/aistudio/` | Проверено (`[VERIFIED FACT]`) | Корневая документация реконсилирована (`68` файлов); в `public/assets/aistudio/` лежат `18` файлов вложений. | Данные досье по `a3397d9` устарели. |
| **`D-7`** | Пробелы тестов Property F и двухполитический зазор | Проверено (`[VERIFIED FACT]`) | `tests/metamorphic.test.ts:45` использует `1e-12`; расширенный слой `tests/propertyF_v1.test.ts` ждёт `ROD-03`. | Досье ошибочно считало, что тесты проверяют только `1e-7`. |
| **`D-8`** | Расхождение размера JS-бандла (`562.64 kB` vs `335.25 kB`) | Не запускалось (read-only) | `dist/` отсутствует; причина остаётся строго **`[UNRESOLVED]`**. | Догадка досье о UI-бандлинге не доказана. |

---

## 4. `NumericalDomain` Architecture Assessment (`[MATHEMATICAL DERIVATION]`, `[ENGINEERING PROPOSAL]`)

1. **Уровень 1 (Scale-Safe FP64 + точная/центрированная площадь):** Полностью обоснован и достаточен как ядро Phase 2.4 (`ldexp`/`2^k` нормализация, overflow-safe проекция Хаусхолдера, центрированная + точная диадическая/компенсированная площадь для любых $n \ge 3$, `orient2d` как быстрый треугольный фильтр).
2. **Уровень 2 (`Interval64` в JS):** Наивная реализация через `1 ± Number.EPSILON` **математически ненадёжна** на нуле, субнормалах и бесконечностях (нет аппаратных режимов направленного округления в ECMAScript). Корректное `Interval64` требует побитовых `nextUp`/`nextDown` через `DataView`/`BigUint64Array` и **не является пререквизитом** ни для `orient2d` Шевчука, ни для Phase 2.4 MVP (`ND-09`).
3. **Уровень 3 (`ExactRational`):** В текущем Phase 2.4 критически нужен **в изолированном тестовом оракуле** (`tests/`), но преждевременен внутри runtime `L2`/`L7`, пока `GeometryState` хранит `number` (`binary64`), так как каждый шаг цикла всё равно квантует координаты при записи состояния (`ND-08`, `ND-10`).

---

## 5. `L2` / `L7` Independence Assessment (`[VERIFIED FACT]`, `[ENGINEERING PROPOSAL]`)

- **Текущая независимость:** Полная модульная (`L7` импортирует только `import type` из `types.ts`) и алгоритмическая (`L2` — прямая проекция, `L7` — аксиоматические невязки + расстояния + площадь).
- **Риск при внедрении `src/core/numeric/`:** Общая библиотека геометрических формул создаёт риск **Common-Mode Failure**.
- **Требование к Phase 2.4:** Если вводится `src/core/numeric/`, туда выносятся только бессодержательные в геометрическом смысле IEEE-754 операции (`frexp`/`ldexp`, `twoProduct`, `exactDyadicArea2x`), а проекция `L2`, невязки `L7` и оракул в `tests/` остаются строго изолированными (`ND-02`).

---

## 6. Oracle Requirements Summary (`[ENGINEERING PROPOSAL]`)

Полная спецификация — в [OMR_PHASE_2_4_ORACLE_SPECIFICATION.md](./OMR_PHASE_2_4_ORACLE_SPECIFICATION.md):
- Оракул строго разделяет **4 Уровня Истины** (`A`: модель $\mathbb{R}$, `B`: точные $\mathbb{Q}$ над исходными рациональными входами, `C`: точные $\mathbb{D} \subset \mathbb{Q}$ над фактически квантованными `binary64` входами, `D`: выход `L2`/`L7`).
- Использует `DataView` декодер `binary64` $\to$ `BigRational` (`BigInt`), не импортирует код из `src/core/` и измеряет ошибку `L2` в ULP (D vs `round(C)`) отдельно от ошибки квантования входа (C vs B).

---

## 7. `Contract 02` & `TRACE` Compatibility (`[VERIFIED FACT]`)

- Изменения `D-1`, `D-3` и развязка `D-4` (`areaEpsilon ?? DEFAULT`) **полностью обратно совместимы** со схемами `GeometryState`, `OperationRequest`, `ReflectionWitness`, `TraceEntry` и `VerificationVerdict` в [src/core/types.ts](./src/core/types.ts).
- Замена `degenerateAreaEpsilon` на безразмерный критерий (`D-2`) меняет **семантику** поля `VerifierTolerances.degenerateAreaEpsilon` (или требует добавления нового поля — `ND-04`).
- Изменение `VerificationPredicates.orientationInverted` для устранения вакуумного `true` (`D-5`) **ломает `Contract 02 v2`**, если сменить тип `boolean`, либо требует согласования поля применимости / `Contract 02 v3` (`ND-07`).

---

## 8. Open Questions & Owner Decisions

Все открытые вопросы и решения владельца структурированы в [OMR_PHASE_2_4_NUMERICAL_DECISIONS.md](./OMR_PHASE_2_4_NUMERICAL_DECISIONS.md) (`ND-01` – `ND-11`). Ключевые:
- `ND-01 / ND-09 / ND-10`: Утверждение минимального контура Phase 2.4 (без обязательного `Interval64` и runtime `ExactRational`).
- `ND-02`: Граница изоляции `src/core/numeric/` между `L2` и `L7`.
- `ND-04`: Выбор метрики вырожденности ($\rho = 2|S|/D^2$ vs $2|S|/P^2$) и порога $\eta_{\text{deg}}$.
- `ND-05`: Политика переполнения проекции `L2` при представимом и непредставимом образе.
- `ND-06`: Независимость допусков (`D-4`) + политика периметро-зависимого допуска площади.
- `ND-07`: Политика `D-5` в пределах `Contract 02 v2` vs `v3`.
- `ND-11`: Порядок выполнения относительно `ROD-03` (`Phase 2.3.3`).

---

## 9. Readiness Verdict

- **Готовность к архитектурному обзору, принятию решений владельцем и планированию Phase 2.4:** **`READY FOR ARCHITECTURAL REVIEW & OWNER DECISION SIGN-OFF`** — репозиторий полностью проинспектирован, расхождения внешнего досье выявлены, дефекты `D-1..D-5` воспроизведены, спецификация оракула и реестр решений подготовлены.
- **Готовность к немедленному изменению кода (`src/core/*`, `tests/*`):** **`NOT READY FOR IMPLEMENTATION`** — реализация Phase 2.4 **заблокирована** до явного утверждения решений `ND-01`–`ND-11`, согласования последовательности с `ROD-03` (`Phase 2.3.3`) и отдельной авторизации владельца на изменение математического ядра. В ходе данной валидации ни один файл кода, тестов или конфигурации не модифицировался.
