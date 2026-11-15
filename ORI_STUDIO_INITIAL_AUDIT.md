# ORI STUDIO — INITIAL PROJECT ORIENTATION & DOCUMENTATION AUDIT

**Объект исследования:** `zacharyfmarion/ori-studio` (снимок репозитория в `public/assets/aistudio/ori-studio-main__1__a9d35997.zip`, версия workspace `0.9.0`).  
**Контекст:** Первичная архитектурная разведка для проекта **Origami Mathematical Reasoning (OMR, слои L1–L7)** без изменения кода, запуска сборки или реализации интеграции.

**Легенда эпистемического статуса утверждений:**
- **VERIFIED** — прямо подтверждено прочитанным исходным кодом, манифестами или документацией репозитория `ori-studio`.
- **INFERRED** — обоснованный инженерный вывод на основе подтверждённых структур данных, зависимостей и границ модулей.
- **UNKNOWN** — не установлено в рамках данного аудита (требует отдельной проверки кода, сборки или экспериментального запуска).

---

## 1. Project Overview

- **VERIFIED:** **Ori Studio** — кроссплатформенная среда (веб + desktop через Tauri v2) для проектирования, анализа, пошагового складывания, 3D-симуляции и диаграммирования оригами (`README.md`, `Cargo.toml`).
- **VERIFIED:** Позиционируется не как «один алгоритм с нуля», а как модульная платформа на Rust/WASM и TypeScript, объединяющая несколько предметных рабочих пространств (*workspaces*):
  1. **Edit (Crease Pattern)** — редактирование развёрток (CP), диагностика плоской/пространственной складываемости и расчёт сложенных форм (порт Oriedita + собственные 3D-расширения Ori Studio).
  2. **TreeMaker & Box Pleating** — синтез развёрток из метрических деревьев (порт TreeMaker 5.0.1 и Box Pleating Studio) и поиск 22.5°-паттернов через внешний сервис ExplOri (`225.designorigami.net`).
  3. **References (Precrease Planner)** — поиск и планирование последовательности базовых складок по аксиомам Хузиты–Джастина (порт C++ ReferenceFinder через Emscripten WASM + оригинальный планировщик `oristudio-precrease`).
  4. **Fold** — пошаговое складывание плоского листа «как руками» (простые сгибы, частичные предсгибы, составные операции: *reverse*, *crimp*, *tuck*, *squash*, *petal*, *rabbit-ear*, *swivel*, *open/closed sink*, *unsink*) с отслеживанием порядка слоёв (`oristudio-fold` + `oristudio-layer-order`).
  5. **Simulate** — физически-ориентированная 3D-симуляция на основе динамического солвера Origami Simulator (`packages/origami-simulator`).
  6. **Diagram** — вёрстка пошаговых инструкций и экспорт в печатный PDF (`oristudio-pdf`) и векторные/растровые наборы, включая импорт из Defox / Step-Folder.
  7. **Detect CP from Image** (beta) — восстановление точного векторного CP из изображения (нейросетевой детектор ONNX + геометрический/комбинаторный компилятор `oristudio-cp-detect` и `oristudio-cp-compiler`).
- **VERIFIED:** Лицензия всего рабочего пространства в корневом `Cargo.toml` — `GPL-2.0-or-later` (из-за прямого порта GPL-кода TreeMaker 5.0.1 и бандлинга ReferenceFinder). При этом многие новые и портированные из MIT-проектов крейты имеют пермиссивные лицензии на уровне своих `Cargo.toml` (`MIT` или `MIT OR Apache-2.0`, подробнее в `LICENSING.md`).

---

## 2. Repository Structure

- **VERIFIED:** Монорепозиторий объединяет Cargo workspace (26 участников в `Cargo.toml`: 25 крейтов в `crates/` + `apps/tauri/src-tauri`) и npm workspaces (5 пакетов в `package.json`).

Основные каталоги (VERIFIED по дереву архива и манифестам):
- `crates/` — вычислительные ядра и WASM/CLI-обёртки на Rust:
  - Геометрия и пошаговое складывание: `oristudio-geometry`, `oristudio-layer-order`, `oristudio-fold`, `oristudio-fold-wasm`, `oristudio-precrease`, `oristudio-precrease-wasm`.
  - Редактор CP, диагностика и 3D/flat folding: `oristudio-cp`, `oristudio-cp-wasm`.
  - Восстановление и компиляция CP: `oristudio-cp-compiler`, `oristudio-cp-detect`, `oristudio-cp-detect-wasm`, `oristudio-cp-eval`, `oristudio-cp-detect-inspector`.
  - TreeMaker / FOLD / Flat-Folder: `treemaker-core`, `treemaker-cli`, `treemaker-wasm`, `treemaker-fold`, `treemaker-flatfold`.
  - Box Pleating Studio: `oristudio-bp`, `oristudio-bp-wasm`.
  - Визуализация и экспорт диаграмм: `oristudio-layer-spread`, `oristudio-layer-spread-wasm`, `oristudio-pdf`, `oristudio-pdf-wasm`.
  - Интеграционные/оракульные тесты: `oracle-tests`.
- `packages/` — TypeScript-пакеты:
  - `origami-simulator` (`@treemaker/origami-simulator`) — CPU/WebGL2-порт Origami Simulator.
  - `layer-spread` (`@oristudio/layer-spread`) — проекция и видимость слоёв для разнесения (affine layer spreading).
- `apps/`:
  - `web` (`@treemaker/web`) — общий React/Vite фронтенд и Web Workers (`apps/web/src/workers/`).
  - `tauri` (`@treemaker/tauri`, Rust crate `ori-studio`) — desktop-оболочка на Tauri v2 с нативными командами CP-движка и ONNX Runtime.
  - `cp-detect-architecture-inspector` — локальный UI-инспектор конвейера распознавания CP.
- `third_party/` — замороженные снимки внешних апстримов (`oriedita`, `box-pleating-studio`, `flat-folder`, `reference-finder`, `step-folder`, а также `treemaker-5.0.1` согласно `ROADMAP.md` и `upstream-sync.json`).
- `tools/` — тестовые оракулы и кросс-чеки к апстримам (`oracle`, `oriedita-oracle`, `bp-studio-oracle`, `flat-folder-oracle`, `reference-finder-oracle`, `precrease-rf-crosscheck`, `step-folder-oracle`).
- `tests/`, `scripts/`, `docs/`, `research/`, `implementation-plans/` — фикстуры (включая FOLD, CP, BP Studio, layer-order), сборочные/проверочные скрипты, пользовательская документация, исследовательские заметки и архив планов реализации.

---

## 3. Technology Stack

- **VERIFIED:**
  - **Ядро и алгоритмы:** Rust (edition `2024`, toolchain зафиксирован в `rust-toolchain.toml` на `1.96.1`, target `wasm32-unknown-unknown`).
  - **Математика и оптимизация в Rust:** `nalgebra` `0.34.2`, `levenberg-marquardt` `0.15.0`, `slsqp` `1.0.1`, `slsqp-rssl` `0.1.0`, `rayon` `1.10` (опциональный параллелизм на desktop).
  - **Сериализация и WASM-мост:** `serde`, `serde_json` (с обязательной фичей `float_roundtrip` для битовой точности `f64` между JS и Rust), `wasm-bindgen` `0.2`, `serde-wasm-bindgen` `0.6`, `wasm-pack`.
  - **C++ → WASM (без переписывания на Rust):** `third_party/reference-finder` компилируется через Emscripten (`scripts/build-reference-finder.mjs`, пин версии в `scripts/reference-finder-emsdk.json`).
  - **Фронтенд и TypeScript-пакеты:** TypeScript `~5.9.3`, React `19.2.0`, Vite `7.3.1`, Zustand `5.0.11`, Comlink `4.4.2` (RPC к Web Workers), `regl` `2.1.1` / WebGL2, `earcut` `3.2.3`, `onnxruntime-web` `1.26.0`, Vitest `4.0.18`, Playwright `1.60.0`.
  - **Desktop:** Tauri v2 (`tauri = "2"`), `ort = "=2.0.0-rc.13"` (ONNX Runtime для macOS arm64 CoreML и Windows).
  - **Генерация PDF:** `krilla` / `krilla-svg` / `usvg` в `oristudio-pdf` + `harfbuzzjs` на фронтенде.
  - **Арифметика:** В исследованных геометрических ядрах (`oristudio-geometry`, `oristudio-fold`, `oristudio-layer-order`, `oristudio-cp`, `treemaker-flatfold`) используется `f64` с явными допусками (`TOL`, `Epsilon::POINT`). Exact `BigInt`/рациональная арифметика как основной вычислительный бэкенд в `oristudio-geometry`/`oristudio-fold` отсутствует (**VERIFIED** для `oristudio-geometry` и `oristudio-fold`; note: в `oristudio-bp/src/math/rational.rs` есть рациональный тип для BP-сетки).

---

## 4. Main Architectural Components

Архитектура Ori Studio чётко разделена на **независимые от UI вычислительные ядра** (headless crates/packages), **мосты выполнения** (WASM/Workers, Tauri native commands, CLI) и **UI-оболочку** (`apps/web`):

1. **Базовая геометрия и допуски (`oristudio-geometry`) — VERIFIED**
   - Единая геометрия без привязки к UI и без зависимости от GPL-кода TreeMaker (`MIT OR Apache-2.0`).
   - Используется в `oristudio-precrease`, `oristudio-layer-order`, `oristudio-fold`, `oristudio-layer-spread`.

2. **Топология/порядок слоёв и Flat-Folder (`oristudio-layer-order`, `treemaker-fold`, `treemaker-flatfold`) — VERIFIED**
   - `treemaker-fold` (`MIT OR Apache-2.0`): структуры данных формата FOLD, триангуляция, смежность рёбер/граней.
   - `oristudio-layer-order` (`MIT OR Apache-2.0`): модель плоского сложенного представления (`FoldedView`), инкрементальное наложение ячеек (`Overlay`), генерация ограничений (*taco-taco*, *taco-tortilla*, *tortilla-tortilla*) и независимый проверщик (`check`, `check_problem`).
   - `treemaker-flatfold` (`MIT OR Apache-2.0`): порт солвера Flat-Folder (нормализация FOLD, проецирование, поиск и доопределение порядка слоёв `solve_flat_fold` / `complete_layer_order`).

3. **Движок пошагового складывания (`oristudio-fold` + `oristudio-fold-wasm`) — VERIFIED**
   - Иммутабельная модель состояния плоского сложенного листа (`State`), единственный валидирующий конструктор (`State::make` / `gate.rs`), простые и составные сгибы, пересчёт изометрий, экспорт в FOLD с матрицами граней.
   - Полностью отделён от UI; в браузере оборачивается через `FoldEngine` (`oristudio-fold-wasm`) в `foldSequenceWorker.ts`.

4. **Редактор CP, плоская и 3D-верификация (`oristudio-cp` + `oristudio-cp-wasm`) — VERIFIED**
   - Независимая от UI сессионная модель `CpSession` с ареной дескрипторов (`u32` handles).
   - Идентичное поведение в вебе (`oristudio-cp-wasm` в `oristudioCpWorker.ts`) и на desktop (`apps/tauri/src-tauri/src/cp_engine.rs` вызывает тот же `CpSession` за `Mutex` в `spawn_blocking`).
   - Содержит как порт 2D-редактора и плоского фолдера Oriedita (`folding`), так и собственные 3D-модули Ori Studio (`folding3d`, `checks_spatial`, `solve_fold_angles`, `solve_k`).

5. **Планировщик предсгибов и ReferenceFinder (`oristudio-precrease`, `third_party/reference-finder`) — VERIFIED**
   - `oristudio-precrease` анализирует CP, выделяет прямоугольные рамки, оценивает точность решётки и строит последовательности Huzita–Justin с бюджетом времени.
   - C++ ядро `ReferenceFinder` работает как изолированный чёрный ящик в `referenceFinderWorker.ts` через протокол `stdin/stdout` (числа на вход, JSON-строки на выход).

6. **Синтез из деревьев и Box Pleating (`treemaker-core`, `treemaker-cli`, `treemaker-wasm`, `oristudio-bp`, `oristudio-bp-wasm`) — VERIFIED**
   - Полностью headless-движки для `.tmd/.tmd4/.tmd5` (ALM-оптимизация и построение CP) и `.bps/.bpz` (SLSQP-оптимизация и генерация BP-развёрток).

7. **Компиляция и распознавание CP (`oristudio-cp-compiler`, `oristudio-cp-detect`, `oristudio-cp-eval`) — VERIFIED**
   - Построение и уточнение графа CP из кандидатных сегментов (`exactize_fold`, `solve_exact`), оценка метрик топологии.

8. **Симуляция и визуализация (`packages/origami-simulator`, `packages/layer-spread`, `oristudio-layer-spread`, `oristudio-pdf`, `apps/web`) — VERIFIED**
   - `packages/origami-simulator` не зависит от React/Tauri и имеет CPU-реализацию `ReferenceSolver` (работает в Node.js) и WebGL2-солвер `WebglSolver`.
   - `oristudio-layer-spread` (QP-расчёт высот для разнесения слоёв) и `oristudio-pdf` (рендер SVG-страниц в PDF) — сугубо презентационные/диаграммные модули без влияния на логику фолдинга.

**Какие компоненты работают полностью независимо от GUI (VERIFIED):**
Все 25 крейтов в `crates/` (кроме `oristudio-cp-detect-inspector`, имеющего локальный HTTP-сервер для отладки) и оба TS-пакета в `packages/` (`origami-simulator` в режиме `ReferenceSolver`, `layer-spread`) спроектированы как headless-библиотеки без зависимостей от DOM/React/Tauri. Для `treemaker-core`/`treemaker-flatfold`/`oristudio-cp-compiler` есть готовый нативный CLI (`treemaker-cli`).

---

## 5. Geometry Capabilities

- **VERIFIED (`oristudio-geometry`):**
  - Единая политика допусков (`tol.rs`): `TOL = 1e-6` (в единицах нормализованного единичного листа и радианах, выведено из Oriedita `Epsilon::POINT = 2.5e-4` на листе `400×400` с округлением вверх), `SNAP_RADIUS = 2e-3`.
  - Канонические бесконечные прямые `n · p = d` с отождествлением `(n, d) ~ (-n, -d)` и tolerance-aware индексами `LineIndex` и `PointGrid`.
  - Определение границ листа и систем координат (`frame`, `sheet`, `outline`): преобразования между y-down пространством Oriedita (`[-200..200]`), единичным y-up листом (`Sheet`) и прямоугольником ReferenceFinder (`RfRect`).
  - Семь аксиом Хузиты–Джастина `O1..O7` (`construct.rs`) над абстракцией `Paper`, включая аналитический/численный кубический решатель для `O6` (полировка методом Ньютона и повторная проверка остатков по обоим ограничениям на уровне `TOL`), выдачу `Certificate { root, err, line }` и индексацию корней для воспроизведения.
  - Примитивы выпуклых многоугольников (`convex.rs`): ориентация, отсечение полуплоскостью, разбиение, пересечение/площадь перекрытия.

- **VERIFIED (`oristudio-cp`):**
  - Классические 2D-конструкции и манипуляции Oriedita (`geometry/`, `operations/`): отрезки, окружности, пересечения, симметрии, биссектрисы, делители, трансформация выделений, закреплённые вершины (`pinned_points`), объединение непересекающихся листов (`append_disjoint`).
  - **Диагностика плоской складываемости (`checks.rs`):** локальные проверки вершин (число сгибов, теорема Кавасаки / сумма углов, теорема Маэкавы, условие Big-Little-Big), причём реализованы два арифметических режима (`CamvAngleArithmetic::Refined` по умолчанию — инвариантный к поворотам/отражениям в `f64`, и `OrieditaExact` для побитового паритета с Java-оракулом).
  - **Обобщённая 3D-проверка вершин (`checks_spatial.rs`, `solve_fold_angles.rs`, `solve_k.rs`):** для сгибов с произвольным углом `rho ∈ [-180°, 180°]` используется кватернионное замыкание вокруг вершины `q_n * ... * q_1 = [1, 0, 0, 0]` (измерение невязки именно от `+1`, а не `|w|`, чтобы отлавливать нарушения Маэкавы при `rho = ±180°`), с разделением на `Flat` и `Spatial` по каждой вершине, а также явным выделением неопределённых случаев `Indeterminate::{UnassignedCrease, UnsplitJunction}`.
  - **3D-размещение граней (`folding3d/placement.rs`, `admit.rs`):** обход остовного дерева дуального графа и композиция жёстких 3D-поворотов по углам складок; проверка петель (`LoopGap`), 3D-самопересечений (link verdict) и внутренних разрезов; строгое разделение «сырые невязки наружу — единый вердикт внутри `admit`».

- **VERIFIED (`oristudio-cp-compiler`):**
  - Операция `exactize_fold` / `solve_exact` (`fold_exactize.rs`, `exact_solve.rs`) для геометрического/комбинаторного выравнивания и уточнения неточного CP (в том числе по решётке, с `levenberg-marquardt` и диагностикой `TopologyDiagnostics`).

- **INFERRED:** Несмотря на богатый набор 2D и 3D-геометрических примитивов, вся геометрия в `oristudio-geometry`, `oristudio-fold` и `oristudio-cp` опирается на `f64` с фиксированными эпсилонами (`1e-6` в нормализованном листе или `Epsilon` Oriedita). Для произвольно глубоких цепочек сгибов без привязки к решётке численный дрейф не исключается полностью и лишь отсекается жёстким порогом `TOL` / `μ = 1e-3`.

---

## 6. Folding and Layer Order Capabilities

Ori Studio содержит **три разных механизма складывания**, с чётко различными математическими моделями и областями применимости:

### A. Пошаговый плоский движок (`oristudio-fold` + `oristudio-layer-order`) — VERIFIED
- **Область:** строго **плоское складывание** (`2D` на листе + дискретный Z-порядок) выпуклого листа (квадрат, прямоугольник, правильный или произвольный выпуклый многоугольник).
- **Модель состояния (`StateParts`):** вершины листа, рёбра-сгибы (`B | M | V | F` с памятью предыдущего направления для `F` и номером шага), выпуклые грани с родословной (*lineage*), корневая грань `root` и её изометрия, полный `LayerOrder` (`above(f, g)` для каждой перекрывающейся пары граней в абсолютном +z системы модели), `View` (поворот/переворот без изменения сгибов) и частичные метки `CreaseMark`.
- **Gate-валидатор (`State::make` / `state/gate.rs`):** единственный конструктор `State`, выполняющий 7-этапную проверку:
  1. Структурная целостность и лимит числа граней (`MAX_FACES`).
  2. Выпуклость и CCW-обход граней, покрытие площади исходного листа без дыр и наложений, корректность `CreaseMark`.
  3. Вывод изометрий от `root` (жёсткие движения) и сходимость вершин в одну точку в пределах `TOL`.
  4. Согласованность шарниров (*hinge consistency*): сложенный сгиб соединяет грани разной ориентации (`det`), плоский — одинаковой.
  5. Корректность сложенного образа (`FoldedView`) с учётом сторон сгибов.
  6. Построение `ConstraintProblem` (с лимитом `MAX_STACKED_TRIPLES`).
  7. Полная проверка `LayerOrder` через `oristudio_layer_order::check_problem`: отсутствие пропущенных/неопределённых/лишних пар, отсутствие циклов внутри ячеек, выполнение всех ограничений **Taco-Taco**, **Taco-Tortilla**, **Tortilla-Tortilla**, соответствие букв `M/V` порядку слоёв.
- **Поддерживаемые операции (`Op`):**
  - Простые сгибы (`Valley`, `Mountain`), предсгиб (`Precrease` — полный или частичный/pinch), `Unfold`, `Refold`, `Turn`, `Rotate`, `CpJump` (импорт CP как шага).
  - Поиск замыкания движущегося множества (через пересекающие сгибы и перекрывающиеся слои).
  - Составные сгибы через единый конвейер (`compound::pieces`): `InsideReverse`, `OutsideReverse`, `Crimp`, `Tuck`, `Squash`, `Petal`, `RabbitEar`, `Swivel`, `OpenSink`, `ClosedSink`, `Unsink`.
  - Работа с неоднозначностями: при наличии нескольких валидных порядков слоёв движок возвращает список вариантов/свидетелей (`WitnessOrder` — пары граней, идентифицируемые точками внутри граней в координатах листа) или отказ (`FoldRefusal`) с кодом причины и возможными автофиксами (`Fix`), никогда молча не «додумывая» невалидное состояние.
  - Переиспользование солвера Flat-Folder (`treemaker-flatfold::complete_layer_order`) только для доопределения порядка затронутых ячеек (`complete_around`) с возможностью ограничения по числу узлов или времени (`BudgetLimit` / `Deadline`).

### B. Полноразвёрточный солвер CP (`oristudio-cp` + `treemaker-flatfold`) — VERIFIED
- **Плоское складывание CP (`oristudio-cp::folding`):** порт солвера Oriedita (`FoldingEstimateSession`), строит граф граней, субграни (`SubFace`), вычисляет плоскую форму, перечисляет допустимые порядки слоёв (`fold_another`, `fold_to_case`), поддерживает передачу ручных отношений слоёв (`folded_figure_fold_with_order`) и интерактивную сессию ограничений в `oristudio-fold::steer` (`layer_open`, `layer_commit`, `layer_explain`, итератор решений).
- **3D-складывание CP (`oristudio-cp::folding3d`):** размещает грани в 3D жёсткими поворотами по заданным углам складок, группирует компланарные грани в плоскости (`PlaneIndex`), выявляет пересечения/столкновения и внутри каждой компланарной стопки строит 3D-ограничения и перечисляет допустимые порядки слоёв (`Fold3dOrderEnumerator`), включая сцепления между плоскостями (`Coupling`).

### C. Непрерывная физическая симуляция (`packages/origami-simulator`) — VERIFIED
- Динамическая масс-пружинная модель на триангулированной сетке (демпфирование, угловые силы складок, жёсткость граней). Не доказывает геометрическую истинность и не решает комбинаторику Z-порядка как таковую, а численно интегрирует траекторию к равновесию.

---

## 7. External Interface Opportunities

На данный момент в Ori Studio **нет внешнего сетевого RPC/REST/gRPC API для сторонних систем** (**VERIFIED** — за исключением внутреннего отладочного сервера `oristudio-cp-detect-inspector` и клиентского прокси к ExplOri). Однако существует несколько чётких точек потенциального программного доступа:

| Потенциальная функция / возможность | Модуль / Крейт | Обнаруженный интерфейс вызова | Степень подтверждения |
| :--- | :--- | :--- | :--- |
| Конструирование Huzita–Justin `O1..O7`, линии, `PointGrid`, отсечение выпуклых полигонов, `Frame`/`Sheet` | `oristudio-geometry` | Rust library API (`Construction::construct`, `Paper`, `LineIndex`, `convex::*`) | **VERIFIED** (исходный код) |
| Пошаговое плоское складывание (`sheet`, `apply`, `analyse`, `return_to`), импорт CP в шаг, составные сгибы | `oristudio-fold` / `oristudio-fold-wasm` | Rust API (`State::make`, `PlainFold`, `compound::*`) и WASM-класс `FoldEngine` (принимает/отдаёт JSON-совместимые `JsValue`, работает в Node/браузере) | **VERIFIED** (исходный код `crates/oristudio-fold-wasm/src/*.rs`) |
| Экспорт полной последовательности шагов в многофреймовый FOLD с матрицами трансформаций и `faceOrders` | `oristudio-fold` (`kernel` feature) | `export_fold_sequence_json` (Rust) и `FoldEngine::export_fold` (WASM) | **VERIFIED** (исходный код `fold_file.rs`) |
| Построение `ConstraintProblem` и независимая проверка порядка слоёв (`check`, `check_problem`) | `oristudio-layer-order` | Rust library API (`Overlay`, `ConstraintProblem::build_within`, `check_problem`) | **VERIFIED** (исходный код) |
| Решение плоской складываемости и порядка слоёв по FOLD JSON | `treemaker-flatfold`, `treemaker-wasm`, `treemaker-cli` | Rust: `solve_flat_fold`, `complete_layer_order`; WASM: `flat_fold_artifacts(fold_json, options)`; CLI: `treemaker flatfold <file>` | **VERIFIED** (исходный код) |
| Парсинг/запись `.cp`, `.ori`, `.orh`, `.fold`, `.dxf`, выполнение команд редактирования CP, 2D/3D-фолдинг CP | `oristudio-cp` / `oristudio-cp-wasm` / `apps/tauri` | Rust `CpSession` (`CP_ENGINE_COMMANDS`: 51 метод); WASM-функции `load_fold`, `execute_cp_command`, `folded_figure_fold`, `folded_figure_fold_3d`, `export_fold_file` и др. | **VERIFIED** (исходный код `session.rs`, `oristudio-cp-wasm/src/lib.rs`) |
| 2D-диагностика (Kawasaki/Maekawa/BLB) и 3D-кватернионное замыкание вершин | `oristudio-cp` (`checks`, `checks_spatial`) | Rust API (`dispatched_camv`, `camv_check`); через WASM — в составе команд `Check1..Check4` / `folded_figure_fold_3d` (прямой отдельный WASM-метод только для `checks_spatial` не обнаружен) | **VERIFIED** (Rust) / **INFERRED** (доступ через WASM-команды) |
| «Экзектация» (выравнивание/ремонт) FOLD-графа | `oristudio-cp-compiler`, `oristudio-cp-wasm` | Rust: `exactize_fold_json`; WASM: `exactize_fold(fold_json, timeout_seconds)` | **VERIFIED** (исходный код) |
| Анализ предсгибов, разметка листа и поиск последовательности по Huzita–Justin | `oristudio-precrease`, `oristudio-precrease-wasm` | Rust API + WASM-класс `PrecreasePlanner` (`close`, `sequence`, `stuck_search`, `fold`) | **VERIFIED** (исходный код) |
| TreeMaker-оптимизация и генерация CP из дерева | `treemaker-core`, `treemaker-cli`, `treemaker-wasm` | CLI (`inspect`, `check`, `optimize`, `build-cp`, `export-v4`, `flatfold`, `corpus`), Rust `Tree`, WASM (`load_tmd`, `optimize_*`, `build_crease_pattern`, `export_fold`) | **VERIFIED** (исходный код) |
| Headless CPU 3D-симуляция FOLD-документа | `@treemaker/origami-simulator` | TS API `ReferenceSolver`, `prepareFoldModel`, `createOrigamiSimulator` (подтверждено использование в Node-тестах и golden traces) | **VERIFIED** (исходный код и `PORTING.md`) |
| Стабильный пакетный запуск Rust/WASM-артефактов из Node.js без пересборки | Прекомпилированные WASM-пакеты в npm/crates.io | **НЕ ПОДТВЕРЖДЕНО:** крейты имеют `publish = false`, а `apps/web/src/generated/*-wasm` находятся в `.gitignore` и собираются скриптами `wasm-pack --target web` | **VERIFIED** (ограничение из `Cargo.toml`, `RELEASE.md`, `apps/web/package.json`) |
| Универсальный единый CLI для `oristudio-fold` и `oristudio-cp` | — | Отдельного CLI-бинарника для `oristudio-fold` или `oristudio-cp` не обнаружено (есть только `examples/` и `treemaker-cli`) | **VERIFIED** (по дереву `crates/*/Cargo.toml`) |

---

## 8. Documentation Audit

### Хорошо документировано (VERIFIED)
- **Внутрикодовая документация и архитектурные решения:** Модульные заголовки (`//!`) и `README.md` ключевых крейтов (`oristudio-fold`, `oristudio-layer-order`, `oristudio-geometry`, `oristudio-precrease`, `oristudio-cp/src/folding3d.rs`, `oristudio-cp/src/checks_spatial.rs`) исключительно подробны: в них зафиксированы системы координат, инварианты, причины выбора допусков, известные краевые случаи и ссылки на планы/исследования.
- **Происхождение, паритет и лицензирование:** `PORTING.md`, `LICENSING.md` и `upstream-sync.json` детально описывают все заимствования, отличия от апстримов, оракулы и лицензионные нюансы.
- **Инструменты-оракулы:** В `tools/*/README.md` подробно задокументированы правила паритетного тестирования против Java/C++/JS/TS-оригиналов.

### Требует дополнительного изучения (VERIFIED / UNKNOWN)
- Формат и полнота внутренней документации в `implementation-plans/` и `research/` (более 100 файлов, детальный аудит каждого плана не проводился — **UNKNOWN** степень их актуальности относительно последнего коммита).
- Поведение `oristudio-fold` на сложных непрямоугольных выпуклых листах и при глубокой вложенности `compound::reverse`/`sink` на границах бюджетов (`BudgetLimit`, `Deadline`) — требует прогона тестов/примеров (**UNKNOWN** практическая стабильность без запуска).
- Детали внутреннего контракта `oristudio-cp-compiler` (какие именно ограничения поддерживает `exactize_fold`, кроме углов/длины/плоской складываемости).

### Выявленные расхождения между документацией и фактическим состоянием (VERIFIED)
1. **Публикация крейтов в `README.md` vs `Cargo.toml` / `RELEASE.md`:**
   - В разделе *Getting Started* корневого `README.md` приведены команды `cargo add treemaker-core`, `cargo install treemaker-cli` и зависимость `treemaker-wasm = "0.1"`.
   - Фактически в корневом `Cargo.toml` установлено `publish = false`, а в `RELEASE.md#crates` прямо сказано: *«The engine crates are not published... Only `treemaker-core` was ever on crates.io, at `0.1.0`»*.
2. **Неполный список крейтов и пакетов в `README.md`:**
   - В `README.md` в перечне workspace-крейтов и npm-пакетов отсутствуют реально существующие и активно используемые модули: `oristudio-precrease`, `oristudio-precrease-wasm`, `oristudio-layer-spread`, `oristudio-layer-spread-wasm`, `oristudio-pdf`, `oristudio-pdf-wasm`, `oracle-tests`, а также npm-пакет `packages/layer-spread` (`@oristudio/layer-spread`).
3. **Устаревшие заголовки в `oristudio-cp`, `oristudio-cp-compiler` и `oristudio-cp-detect`:**
   - `crates/oristudio-cp/README.md` описывает крейт как *«planned ... starts with a deliberately conservative contract»* со ссылкой на *«Stage 1»* в `lib.rs`, хотя фактически реализованы десятки этапов операций (`OperationStatus::OracleTested`), форматы `.ori/.cp/.fold/.orh/.dxf/.obj`, а также нативные 3D-пайплайны (`folding3d`, `checks_spatial`). При этом ~14 унаследованных команд (например, `io::fold::import_folded_frames`, `folding::modify_calculated_shape`) действительно остаются `Unsupported` или `OutOfScopeUi`.
   - Аналогично в `oristudio-cp-compiler/src/lib.rs` заголовок говорит про *«Phase 2 ... no-op compile path»*, тогда как в крейте уже реализованы `exact_solve`, `fold_exactize`, `candidate_graph`, `arrangement_v2`.
   - В `oristudio-cp-detect/src/lib.rs` заголовок обещает реализацию детекции «в будущих фазах», хотя модули `rectify`, `refinement`, `candidate_generation`, `compiler_decode_v2` и `native_inference` уже присутствуют.
4. **Исторический нейминг пакетной структуры:**
   - В `package.json` и `apps/*/package.json` workspace именуется `treemaker-rs-workspace`, `@treemaker/web`, `@treemaker/tauri`, `@treemaker/origami-simulator`, хотя сам продукт называется Ori Studio и давно вышел за рамки TreeMaker.

### Открытые технические вопросы (UNKNOWN)
- Насколько быстро и надёжно собираются WASM-таргеты (`wasm-pack --target nodejs` или `--target bundler`) из `oristudio-fold-wasm` и `oristudio-cp-wasm` в изолированной среде без веб-ассетов `apps/web`.
- Как `oristudio-fold` и `oristudio-cp` ведут себя по скорости и объёму возвращаемых структур на типовых многошаговых сценариях OMR за пределами уже задокументированных бенчмарков.
- Точный юридический статус лицензии `third_party/reference-finder` (`GPL-2.0-only` vs `GPL-2.0-or-later`, зафиксировано как открытый вопрос в `LICENSING.md`).

---

## 9. Potential Compatibility with OMR

Сопоставление возможностей Ori Studio с архитектурой **Origami Mathematical Reasoning (L1–L7)** и `TOOL_INTEGRATION_ARCHITECTURE.md`:

| Аспект OMR | Что есть в Ori Studio | Потенциальные точки взаимодействия | Выявленные ограничения / несовпадения |
| :--- | :--- | :--- | :--- |
| **Геометрические операции (L2)** | `oristudio-geometry` (`O1..O7`, `Line`, `convex`, `Frame`), `oristudio-cp` (2D-конструкции + 3D-размещение и `checks_spatial`) | Использование `oristudio-fold` / `oristudio-cp` как внешнего вычислительного стенда для сравнения координат и проверки 3D-замыканий вершин (`checks_spatial`) | **VERIFIED:** Ori Studio работает исключительно в `f64` с `TOL = 1e-6` (`Unit Sheet`). В OMR (см. `REUSE_AND_GAP_ANALYSIS.md`) обсуждается точная рациональная арифметика `BigInt` (`GIEM`/`STL V1`) для устранения дрейфа. Прямого паритета точности нет (**INFERRED**). |
| **Последовательности сгибаний (L1–L4, Trace)** | `oristudio-fold` поддерживает дерево/историю шагов (`step`, `return_to`, линейный путь в `fold_file`, `marks`, `witness`), охватывая простые и составные сгибы | Экспорт/воспроизведение последовательностей сгибов (`PlainFold`, `Reverse`, `Crimp`, `Tuck`, `Squash`, `Petal`, `RabbitEar`, `Swivel`, `Sink`) для тестирования планировщиков и `Process Verification` в OMR | **VERIFIED:** Откат (`return_to`) в `oristudio-fold` — это возврат по истории с сохранением физических следов сгибов; в `oristudio-fold` лист **обязан быть выпуклым** на каждом шаге (невыпуклые исходные листы и разрезы `C` в `oristudio-fold` не поддерживаются). |
| **Состояния конструкции (`State`)** | `oristudio-fold::StateParts` строго типизировано (лист, вершины, сгибы, выпуклые грани с lineage, корневая изометрия, `LayerOrder`, `View`, `CreaseMark`). `oristudio-cp` хранит `CreasePatternDocument` и снимок/рендер сложенной формы | Хорошая структурная совместимость: `oristudio-fold` уже разделяет топологию графа, геометрию листа/образа и комбинаторику слоёв (`LayerOrder`), что близко к запрету монолитного кортежа в OMR (`ARCHITECTURE.md`) | **VERIFIED:** В `oristudio-cp` и `oristudio-fold` **разные системы координат**! `oristudio-cp` использует y-down модельное пространство Oriedita (`[-200..200]`, грани по часовой стрелке), а `oristudio-fold` — единичный y-up лист (грани против часовой стрелки). Любой адаптер обязан учитывать `KernelFrame` (`fold_file.rs`). |
| **Порядок слоёв (L3)** | `oristudio-layer-order` (ячейки, `taco-taco`, `taco-tortilla`, `tortilla-tortilla`, циклы) + `treemaker-flatfold` + `folding3d::order` | **Высокая ценность для OMR L3:** `oristudio-layer-order` уже реализует формальную модель и проверщик L3, которого в OMR пока нет (`REUSE_AND_GAP_ANALYSIS.md`: «отсутствие формализованного L3»). | **VERIFIED:** Имеются жёсткие лимиты (`MAX_FACES`, `MAX_STACKED_TRIPLES`) и эвристики времени (`Deadline`), при превышении которых возвращается отказ/неполное перечисление. Для бесконечных/очень глубоких стопок (> лимитов) солвер отказывает. |
| **Проверка результатов (L7)** | `oristudio-fold` (`State::make` / `gate.rs`), `oristudio-layer-order::check`, `oristudio-cp` (`checks`, `checks_spatial`), `folding3d::admit` | Может служить **внешним перекрёстным оракулом (reference oracle)** для Zero-Trust сверки в OMR L7 (особенно по L3 и 3D-вершинам) | **VERIFIED:** Согласно принципу OMR (`TOOL_INTEGRATION_ARCHITECTURE.md`), результат Ori Studio сам по себе **не является доказательством** и при импорте должен помечаться `unverified: true` с независимым пересчётом инвариантов в L7 (с учётом расхождения допусков `1e-6` в Ori Studio против `1e-7`/`1e-9` в PCRS). |
| **Обмен данными** | Стандартный формат **FOLD** (`treemaker-fold`, `oristudio-fold::fold_file`, `oristudio-cp::io::fold`), `.cp`, `.ori`, `.tmd5`, JSON через WASM/Serde | Формат **FOLD JSON** (с расширениями `oristudio:faces_matrix`, `oristudio:fold-step`, `faceOrders`) является естественной общей шиной обмена | **VERIFIED:** Нужна аккуратная схема сопоставления идентификаторов: в `FOLD` используются позиционные индексы массивов (`vertices`, `edges`, `faces`), тогда как OMR требует устойчивые `portableId != localId` (`Contract 01`). В `oristudio-fold` у граней/рёбер есть `FaceId`/`EdgeId` внутри состояния, но при экспорте в `FOLD` нужна проекция на индексы + `lineage`/`witness` по координатам листа. |

---

## 10. Limitations and Open Questions

1. **Отсутствие готового внешнего IPC/CLI-интерфейса для нужных подсистем (VERIFIED):**
   - `treemaker-cli` покрывает только TreeMaker-модели, `flatfold` и `corpus`. Ни `oristudio-fold`, ни `oristudio-cp`, ни `oristudio-layer-order` не имеют готового CLI или JSON-RPC демона «из коробки». Внешний вызов возможен либо как Rust-зависимость по `path`/`git`, либо через самостоятельную сборку WASM-пакетов под Node.js (`wasm-pack --target nodejs`, тогда как в `apps/web/package.json` настроен `--target web`).
2. **Геометрические и топологические ограничения движков (VERIFIED):**
   - `oristudio-fold`: только **выпуклые** листы; нет нежёстких/криволинейных сгибов (L5 в OMR отсутствует в `oristudio-fold`, а в `packages/origami-simulator` прямо зафиксировано *«Not ported at all: ... the curved-folding path»*); нет разрезов (`C` игнорируется симулятором, внутренние разрезы отказываются в `folding3d::admit`); `oristudio-fold` описывает только дискретные плоские состояния (без непрерывных кинематических траекторий `γ(t)` без столкновений — L4 OMR).
   - `oristudio-layer-order`: при превышении `MAX_FACES` / `MAX_STACKED_TRIPLES` или `Deadline` поиск обрывается/отказывает.
   - `oristudio-cp`: около 14 команд из Oriedita всё ещё возвращают `UnsupportedOperation` (в т.ч. `io::fold::import_folded_frames`, `io::fold::export_folded_frames` в `oristudio-cp`, хотя в `oristudio-fold` и `folding3d` экспорт folded frames реализован отдельно).
3. **Численная модель `f64` против `BigInt` (VERIFIED / INFERRED):**
   - В Ori Studio нет точной алгебраической/рациональной арифметики для общих углов (`22.5°`, `O6` кубика и т.д.). При интеграции с OMR понадобится строгий протокол согласования допусков (`TOL = 1e-6` против `1e-7`/`1e-9` и будущей `BigInt`-арифметики L7).
4. **Лицензионный вопрос (VERIFIED):**
   - Если использовать только пермиссивные крейты (`oristudio-geometry`, `oristudio-layer-order`, `oristudio-fold`, `oristudio-cp`, `treemaker-fold`, `treemaker-flatfold`), их собственные манифесты декларируют `MIT OR Apache-2.0`. Однако запуск полного workspace или включение `treemaker-core` / `reference-finder` переводит сборку под `GPL-2.0-or-later` (с открытым вопросом по `GPL-2.0-only` для форка `reference-finder`).
5. **Открытые вопросы для следующего этапа (UNKNOWN):**
   - Точные числовые значения констант `MAX_FACES` и `MAX_STACKED_TRIPLES` в `oristudio-layer-order` и поведение производительности/памяти при передаче через Node.js WASM-мост.
   - Насколько полно `oristudio-fold::fold_file` сохраняет все данные, необходимые для однозначного восстановления `State` и `TRACE` на стороне OMR L7 (например, частичные сгибы и историю откатов).
   - Готовность headless-вызова `oristudio-fold-wasm` и `oristudio-cp-wasm` в Node.js без браузерного окружения (например, отсутствие `performance.now()` или нюансы `wasm-bindgen` под `--target nodejs`).

---

## 11. Recommended Next Research Step

Провести **изолированный исследовательский spike (без изменения архитектуры OMR)** с фокусом на два самых ценных для OMR безголовых (headless) компонента Ori Studio:

1. **Проверить локальную компиляцию и Node/Rust-запуск `oristudio-fold` + `oristudio-layer-order`** (на уровне нативных `cargo test` / `examples` или минимального стендового запуска `wasm-pack --target nodejs` в отдельной временной песочнице, не затрагивающей основной репозиторий):
   - зафиксировать точные схемы входных/выходных JSON-структур (`Op`, `StateParts`, `FoldScene`, `oristudio-fold` FOLD-экспорт с `oristudio:faces_matrix` и `faceOrders`, структуру `FoldRefusal`);
   - проверить границы применимости (`MAX_FACES`, `MAX_STACKED_TRIPLES`, поведение на `TOL = 1e-6`).
2. **Отобрать 5–10 эталонных сценариев** (включая простые сгибы из `tests/contract02.test.ts` OMR, а также `Reverse`, `Squash`, `Crimp`, `Tuck` из фикстур `ori-studio-main/tests/fixtures/fold-examples/`) и сравнить представления состояний и вердикты `oristudio-layer-order::check` / `State::make` с требованиями `Contract 01`, `Contract 02` и будущего `L2 ↔ L3` в OMR.

---

## Заключение: стоит ли использовать Ori Studio как независимую экспериментальную среду для OMR?

**Да, стоит — в роли строго изолированного внешнего исследовательского стенда и эталонного оракула (reference oracle), но не как замены собственного ядра OMR.**

На это есть три объективных основания:
1. **Готовая, хорошо проверенная реализация пробелов OMR (VERIFIED):** В Ori Studio уже существуют модульные headless-крейты на `MIT OR Apache-2.0` (`oristudio-geometry`, `oristudio-layer-order`, `oristudio-fold`, `oristudio-cp`), которые закрывают именно те области, которые в OMR пока находятся на этапе концепции или проектирования — прежде всего **L3 (порядок слоёв: ячейки, ограничения taco/tortilla, инкрементальный checker)**, **составные сгибы** и **3D-замыкание вершин на кватернионах**.
2. **Высокая инженерная дисциплина разделения ответственности (VERIFIED):** Движки Ori Studio отделены от React/Tauri GUI, имеют единые контракты ошибок/отказов (`refusal` ≠ исключение) и подкреплены корпусами оракульных тестов против Oriedita, Flat-Folder, TreeMaker, BP Studio и ReferenceFinder.
3. **Почему Ori Studio не может заменить ядро OMR (VERIFIED / INFERRED):** Ori Studio целиком работает в `f64` с фиксированными эпсилонами (`TOL = 1e-6`), не покрывает точную рациональную/символьную верификацию (`BigInt`), не решает непрерывную бесстолкновительную 3D-кинематику (L4) и криволинейное складывание (L5). Поэтому оптимальная роль Ori Studio — **независимая экспериментальная песочница и внешний генератор/сверщик состояний за Zero-Trust границей L7**.
