# ORI STUDIO — COMPUTATIONAL MODULE INSPECTION
## Stage 2: Geometry Engine (`oristudio-geometry`)

**Объект исследования:** крейт `oristudio-geometry` (`crates/oristudio-geometry/` в снимке `public/assets/aistudio/ori-studio-main__1__a9d35997.zip`, версия workspace `0.9.0`).  
**Контекст:** оценка вычислительного геометрического ядра Ori Studio и его сопоставление с математическим ядром **Origami Mathematical Reasoning (OMR: L1–L7)** без изменения исходного кода, установки зависимостей, сборки проекта или создания адаптеров.

**Легенда эпистемического статуса:**
- **VERIFIED** — прямо подтверждено прочитанным исходным кодом, манифестом `Cargo.toml` и документацией внутри `crates/oristudio-geometry` (а также кодом OMR в `/src/core/` и `/tests/contract02.test.ts`).
- **INFERRED** — обоснованный инженерный вывод из подтверждённых сигнатур, типов и границ крейтов.
- **UNKNOWN** — не проверялось и не подтверждено в рамках инспекции (например, поведение при реальном запуске `cargo test` в текущей среде, так как сборка и тесты запрещены).

---

## Общие сведения о модуле (`VERIFIED`)

- **Крейт:** `oristudio-geometry` (`edition = "2024"`, `version = "0.9.0"`, `publish = false` унаследованы от корневого `Cargo.toml`).
- **Лицензия:** `MIT OR Apache-2.0`; в `Cargo.toml` явно зафиксировано: *"No dependency edge reaches the TreeMaker port"* (отсутствует зависимость от GPL-кода `treemaker-core`).
- **Зависимости:**
  - `[dependencies]`: `serde`, `thiserror`.
  - `[dev-dependencies]`: `serde_json`.
  - Зависимости от DOM, UI, `wasm-bindgen`, `nalgebra` или сторонних решателей отсутствуют.
- **Базовая система координат (`lib.rs`, `README.md`, `frame.rs`):** единичная прямоугольная система листа (*unit sheet frame*) — **y-up**, начало координат `(0, 0)` в левом нижнем углу, длинная сторона листа равна `1.0`. Модуль `frame` связывает её с y-down модельной системой Oriedita (по умолчанию `[-200, 200] × [-200, 200]`).
- **Внутренняя модульная структура (`src/`):** 10 модулей — `tol`, `error`, `paper`, `line`, `pointgrid`, `frame`, `sheet`, `outline`, `construct`, `convex`, плюс корень `lib.rs`. Внешних подкаталогов `tests/`, `examples/`, `benches/`, `src/bin/` внутри `crates/oristudio-geometry/` нет.

---

## Задача 1. Изучение интерфейса `oristudio-geometry`

### 1.1. Реэкспорты на уровне корня крейта (`src/lib.rs`, `VERIFIED`)

Крейт открывает все 10 модулей как `pub mod`, а также реэкспортирует в корень (`oristudio_geometry::*`):
- `construct::{Certificate, Construction, Pt, Root}`
- `error::GeometryError`
- `frame::{Frame, FrameAffines, RfRect}`
- `line::{Line, LineIndex}`
- `outline::RefusalReason`
- `paper::Paper`
- `pointgrid::PointGrid`
- `sheet::{CornerName, EdgeSide, Sheet}`
- `tol::{SNAP_RADIUS, TOL}`

*(Примечание: модули `convex` и остальные типы/функции `outline` доступны по пути `oristudio_geometry::convex::*` и `oristudio_geometry::outline::*`.)*

---

### 1.2. Публичные типы, функции, операции и сигнатуры по модулям (`VERIFIED`)

#### A. `tol` — численные допуски
- `pub const TOL: f64 = 1e-6` — единый базовый допуск в единицах единичного листа (для позиций/расстояний) и в радианах (для направлений/углов). Выведен из `ORIEDITA_EPSILON_POINT / ORIEDITA_PAPER_SIDE = 6.25e-7` с округлением вверх до `1e-6`.
- `pub const SNAP_RADIUS: f64 = 2e-3` — допуск приёма почти-прямоугольной границы и привязки к решётке (проверяется compile-time assert: `SNAP_RADIUS / TOL >= 1000.0`).
- `pub const ORIEDITA_EPSILON_POINT: f64 = 0.01 * 0.025` (`2.5e-4`).
- `pub const ORIEDITA_PAPER_SIDE: f64 = 400.0`.
- `pub const ORIEDITA_DEFAULT_PAPER: [f64; 4] = [-200.0, -200.0, 200.0, 200.0]`.

#### B. `error` — ошибки фрейма
- `pub enum GeometryError`:
  - `DegenerateFrame { reason: &'static str }`
  - `InvalidRect`

#### C. `paper` — абстракция листа / складной фигуры
- `pub trait Paper`:
  - `fn contains(&self, p: [f64; 2], pad: f64) -> bool` — лежит ли точка в листе с отступом `pad`.
  - `fn intervals(&self, line: &Line) -> impl Iterator<Item = (f64, f64)>` — упорядоченные отрезки параметров `t` (по `Line::point_at`), где прямая пересекает лист (поддерживает и многокомпонентные/невыпуклые силуэты).
  - `fn crosses(&self, line: &Line) -> bool` — имеет ли прямая невырожденное пересечение с листом (реализация по умолчанию: существует интервал `(a, b)` с `b - a > TOL`).

#### D. `line` — бесконечные прямые, отражение и tolerance-aware индекс
- `pub struct Line { pub n: [f64; 2], pub d: f64 }` (`#[derive(Debug, Clone, Copy, PartialEq, Serialize, Deserialize)]`):
  - Представляет прямую `n · p = d` с единичной нормалью `|n| = 1` и канонизацией знака (`n[0] > 0` либо `n[0] == 0 && n[1] > 0`, с устранением `-0.0`).
  - Конструкторы:
    - `Line::new(n: [f64; 2], d: f64) -> Option<Line>` — нормализует `n` и `d`; возвращает `None`, если `len.is_nan() || len < TOL`.
    - `Line::from_points(p: [f64; 2], q: [f64; 2]) -> Option<Line>` — `None`, если расстояние `< TOL`.
    - `Line::from_point_direction(p: [f64; 2], dir: [f64; 2]) -> Option<Line>` — `None`, если `|dir| < TOL`.
    - `Line::perpendicular_bisector(p: [f64; 2], q: [f64; 2]) -> Option<Line>` — серединный перпендикуляр; `None`, если `|q - p| < TOL`.
  - Метрики и параметризация:
    - `signed_distance(&self, p: [f64; 2]) -> f64` (`n · p - d`).
    - `distance_to_point(&self, p: [f64; 2]) -> f64`.
    - `parameter_of(&self, p: [f64; 2]) -> f64`, `parameter(&self, p: [f64; 2]) -> f64`.
    - `point_at(&self, t: f64) -> [f64; 2]`, `foot(&self) -> [f64; 2]`, `direction(&self) -> [f64; 2]`.
    - `normal_angle(&self) -> f64`, `cross(&self, other: &Line) -> f64`, `dot(&self, other: &Line) -> f64`.
  - Геометрические операции:
    - `project_point(&self, p: [f64; 2]) -> [f64; 2]` — ортогональная проекция на прямую.
    - **`reflect_point(&self, p: [f64; 2]) -> [f64; 2]`** — зеркальное отражение точки: `[p[0] - 2.0 * s * self.n[0], p[1] - 2.0 * s * self.n[1]]`, где `s = self.signed_distance(p)`.
    - **`reflect_line(&self, other: &Line) -> Option<Line>`** — зеркальное отражение бесконечной прямой `other` относительно `self` (отражает точки `other.point_at(0.0)` и `other.point_at(1.0)` и строит `Line::from_points`).
    - `intersect(&self, other: &Line) -> Option<[f64; 2]>` — точка пересечения; `None`, если `|self.cross(other)| < TOL`.
  - Сравнения и хэширование:
    - `is_parallel_within(&self, other: &Line, tol: f64) -> bool`.
    - `approx_eq_within(&self, other: &Line, tol: f64) -> bool` (с отождествлением `(n, d) ~ (-n, -d)` через знак `self.dot(other)`).
    - `approx_eq(&self, other: &Line) -> bool` (при `TOL`).
    - `folded_angle_offset(&self) -> (f64, f64)`, `key(&self) -> u64`.
- `pub struct LineIndex`:
  - `new(tol: f64) -> Self`, `find(&self, line: &Line) -> Option<usize>`, `insert(&mut self, line: Line) -> (usize, bool)`, `get(&self, id: usize) -> &Line`, `lines(&self) -> &[Line]`, `len(&self) -> usize`, `is_empty(&self) -> bool`.
  - Хранит прямые в пространственной хэш-сетке по `(θ, d)` с шириной ячейки не менее `4 * tol` и зондированием соседних бакетов с циклическим переходом по углу `θ ∈ [0, π)`.

#### E. `pointgrid` — пространственный индекс точек
- `pub struct CellHasher(u64)` (реализует `std::hash::Hasher` для пар `(i64, i64)`).
- `pub struct PointGrid`:
  - `new(cell: f64) -> Self`, `cell(&self) -> f64`.
  - `insert(&mut self, p: [f64; 2]) -> usize`.
  - `within(&self, p: [f64; 2], radius: f64) -> Vec<usize>`, `within_into(&self, p: [f64; 2], radius: f64, hits: &mut Vec<(f64, usize)>)`.
  - `any_within(&self, p: [f64; 2], radius: f64) -> bool`, `nearest_within(&self, p: [f64; 2], radius: f64) -> Option<usize>`.
  - `find_or_insert(&mut self, p: [f64; 2], radius: f64) -> (usize, bool)`.
  - `point(&self, id: usize) -> [f64; 2]`, `len(&self) -> usize`, `is_empty(&self) -> bool`, `points(&self) -> &[[f64; 2]]`.

#### F. `frame` — прямоугольная система отсчёта листа и аффинные переходы
- `pub struct RfRect { pub width: f64, pub height: f64 }`
- `pub type Affine = [f64; 6]` (строчно-упакованная 2D аффинная матрица `[a, b, c, d, tx, ty]`)
- `pub struct FrameAffines { pub model_to_unit: Affine, pub unit_to_model: Affine, pub model_to_rf: Affine, pub rf_to_model: Affine }`
- `pub struct Frame { pub origin: [f64; 2], pub x_axis: [f64; 2], pub y_axis: [f64; 2], pub width: f64, pub height: f64 }`:
  - `Frame::new(origin, x_axis, width, height) -> Result<Frame, GeometryError>`
  - `Frame::with_axes(origin, x_axis, y_axis, width, height) -> Result<Frame, GeometryError>`
  - `Frame::axis_aligned(rect: [f64; 4]) -> Result<Frame, GeometryError>`
  - `longer(&self) -> f64`, `rf_rect(&self) -> RfRect`, `rotation_radians(&self) -> f64`
  - `model_to_sheet(&self, p: [f64; 2]) -> [f64; 2]`, `model_to_unit(&self, p: [f64; 2]) -> [f64; 2]`, `unit_to_model(&self, u: [f64; 2]) -> [f64; 2]`, `model_to_rf(&self, p: [f64; 2]) -> [f64; 2]`, `rf_to_model(&self, p: [f64; 2]) -> [f64; 2]`
  - `affines(&self) -> FrameAffines`
  - `unit_contains(&self, u: [f64; 2], pad: f64) -> bool`, `contains_model(&self, p: [f64; 2], pad: f64) -> bool`
  - `edge_lines(&self) -> [Line; 4]`, `is_edge_line(&self, line: &Line) -> bool`
- Свободная функция: `pub fn apply_affine(m: &Affine, p: [f64; 2]) -> [f64; 2]`.

#### G. `sheet` — единичный прямоугольник (реализация `Paper`)
- `pub struct Sheet { pub width: f64, pub height: f64 }` (реализует `Paper`).
- `pub enum EdgeSide { Left, Right, Bottom, Top }`, константа `Sheet::EDGE_SIDES: [EdgeSide; 4]`.
- `pub enum CornerName { Sw, Se, Nw, Ne }`, константа `Sheet::CORNER_NAMES: [CornerName; 4]`.
- Методы `Sheet`: `unit_square() -> Sheet`, `from_frame(frame: &Frame) -> Sheet`, `new(width: f64, height: f64) -> Option<Sheet>`, `contains(&self, p: [f64; 2], pad: f64) -> bool`, `edges(&self) -> [Line; 4]`, `corners(&self) -> [[f64; 2]; 4]`, `edge_of(&self, line: &Line) -> Option<EdgeSide>`, `corner_of(&self, p: [f64; 2]) -> Option<CornerName>`, `on_boundary(&self, p: [f64; 2]) -> bool`, `clip_parameters(&self, line: &Line) -> Option<(f64, f64)>`, `clip(&self, line: &Line) -> Option<([f64; 2], [f64; 2])>`, `crosses(&self, line: &Line) -> bool`, `flap_aspects(&self, line: &Line) -> Option<[f64; 2]>`.

#### H. `outline` — восстановление прямоугольной рамки из граничных отрезков
- `pub enum RefusalReason { NonRectangular { vertices }, OpenOutline { vertices }, NonSimpleOutline { vertices }, DegenerateOutline { vertices } }` + метод `vertices(&self) -> &[[f64; 2]]`.
- `pub struct RectSheet { pub frame: Frame, pub residual: f64 }`.
- `pub struct BorderLoop { pub vertices: Vec<[f64; 2]>, pub corners: Vec<[f64; 2]>, pub border_segment_indices: Vec<u32>, pub closed: bool, pub sheet: Result<RectSheet, RefusalReason> }`.
- `pub struct OutlineResult { pub loops: Vec<BorderLoop>, pub degenerate_segments: Vec<u32> }`.
- Публичные функции:
  - `detect_border_loops(segments: &[[f64; 4]], border_indices: &[u32], canvas_scale: f64) -> OutlineResult`
  - `simplify_corners(vertices: &[[f64; 2]], min_deviation: f64) -> Vec<[f64; 2]>`
  - `rectangle_frame(corners: &[[f64; 2]], min_side: f64) -> Result<RectSheet, RefusalReason>`
  - `point_in_polygon(p: [f64; 2], polygon: &[[f64; 2]]) -> bool`

#### I. `construct` — семь аксиом Хузиты–Джастина (`O1..O7`) и сертификация
- `pub type Pt = [f64; 2]`
- `pub enum Construction`:
  - `O1 { p: Pt, q: Pt }`
  - `O2 { p: Pt, q: Pt }`
  - `O3 { m1: Line, m2: Line }`
  - `O4 { p: Pt, m: Line }`
  - `O5 { pivot: Pt, p: Pt, m1: Line }`
  - `O6 { p1: Pt, m1: Line, p2: Pt, m2: Line }`
  - `O7 { p: Pt, m1: Line, m2: Line }`
- `pub struct Root { pub line: Line, pub root: u8 }`
- `pub struct Certificate { pub root: u8, pub err: f64, pub line: Line }`
- Методы `Construction`:
  - `axiom(&self) -> u8` (`1..=7`)
  - `lines<P: Paper>(&self, paper: &P) -> Vec<Root>` — все валидные сгибы на `paper` с проверкой попадания переносимых точек/отрезков на лист и пересечения с листом.
  - `nearest_root<P: Paper>(&self, paper: &P, target: &Line) -> Option<Certificate>` — ближайший корень без порога по `TOL` (для replay).
  - `certify<P: Paper>(&self, paper: &P, target: &Line) -> Option<Certificate>` — сертификация воспроизведения `target` с фильтром `cert.err <= TOL`.
- Свободные функции:
  - `line_residual(a: &Line, b: &Line) -> f64` (`max(|a × b|, |a.d - s * b.d|)`)
  - `real_roots(c: [f64; 4]) -> Vec<f64>` (решение линейного/квадратного/кубического уравнения для `O6`).

#### J. `convex` — примитивы выпуклых многоугольников
*(Внутренний алиас `type Point = [f64; 2]`; ожидание CCW-кольца без замыкающего дубля первой точки).*
- `pub const MIN_EDGE: f64 = TOL * 1e-2` (`1e-8`) — порог отбрасывания сверхкоротких рёбер при вычислении нормалей и слиянии вершин.
- Структуры:
  - `pub struct HalfPlane` (методы: `new(normal: Point, offset: f64) -> Option<HalfPlane>`, `left_of(a: Point, b: Point) -> Option<HalfPlane>`, `normal(&self) -> Point`, `offset(&self) -> f64`, `signed_distance(&self, p: Point) -> f64`, `complement(&self) -> HalfPlane`).
  - `pub struct Split { pub inside: Vec<Point>, pub outside: Vec<Point> }`.
  - `pub struct Carve { pub inside: Vec<Point>, pub outside: Vec<Vec<Point>> }`.
- Свободные функции:
  - `signed_area(poly: &[Point]) -> f64`
  - `normalize(poly: &[Point]) -> Vec<Point>`
  - `is_convex(poly: &[Point], tol: f64) -> bool`
  - `bounding_box(points: &[Point]) -> [f64; 4]`
  - `boxes_overlap(a: &[f64; 4], b: &[f64; 4], margin: f64) -> bool`
  - `centroid(poly: &[Point]) -> Option<Point>`
  - `split(poly: &[Point], plane: &HalfPlane, eps: f64) -> Split`
  - `clip(subject: &[Point], window: &[Point]) -> Vec<Point>`
  - `carve(subject: &[Point], window: &[Point], sliver: f64) -> Option<Carve>`
  - `penetration(p: &[Point], q: &[Point]) -> f64`, `edge_planes(poly: &[Point]) -> Vec<HalfPlane>`, `reach(planes: &[HalfPlane], points: &[Point]) -> f64`, `penetration_with_planes(p: &[Point], p_planes: &[HalfPlane], q: &[Point], q_planes: &[HalfPlane]) -> f64`
  - `overlaps_with_planes(p: &[Point], p_planes: &[HalfPlane], q: &[Point], q_planes: &[HalfPlane]) -> bool`, `overlaps(p: &[Point], q: &[Point]) -> bool`
  - `width(poly: &[Point]) -> f64`
  - `contains_point(poly: &[Point], p: Point, margin: f64) -> bool`
  - `segment_length_inside(a: Point, b: Point, poly: &[Point], margin: f64) -> f64`

---

### 1.3. Система численных допусков (`VERIFIED`)

| Константа / параметр | Значение / тип | Где используется |
|---|---|---|
| `TOL` | `1e-6` (`f64`) | Единый допуск на расстояния (в единицах единичного листа) и углы/нормали (в радианах): отсечение вырожденных прямых (`Line::new`, `from_points`, `intersect`), `Line::approx_eq`, `Paper::crosses`, фильтрация аксиом `O1..O7` и `Construction::certify`, `overlaps` (`penetration > TOL`), определение сторон/углов `Sheet`, chaining в `detect_border_loops` (`TOL * canvas_scale`). |
| `SNAP_RADIUS` | `2e-3` (`f64`) | Допуск принятия почти-прямоугольного контура в `outline::rectangle_frame` (`residual < SNAP_RADIUS`). |
| `MIN_EDGE` | `TOL * 1e-2` (`1e-8`) | В `convex.rs`: пропуск сверхкоротких рёбер, направление которых искажено `f64`-округлением; слияние близких вершин в `normalize`. |
| Локальные параметры допусков | `tol`, `eps`, `margin`, `sliver`, `radius` (`f64`) | Явно передаются в `LineIndex::new(tol)`, `Line::approx_eq_within(..., tol)`, `is_parallel_within(..., tol)`, `PointGrid::within(..., radius)`, `convex::split(..., eps)`, `convex::carve(..., sliver)`, `convex::is_convex(..., tol)`, `convex::contains_point(..., margin)`, `convex::segment_length_inside(..., margin)`. |

**Архитектурный контраст (`VERIFIED`):** `oristudio-geometry` работает строго в IEEE-754 `f64` с явными масштабно-фиксированными допусками вокруг **единичного листа** (`TOL = 1e-6`). При обработке вырожденной геометрии (например, `|n| < TOL` в `Line::new` или параллельность `|det| < TOL` в `Line::intersect`) функции возвращают `None` (либо `Err(GeometryError)` / `Err(RefusalReason)`).

---

### 1.4. Существующие тесты (`VERIFIED`)

Внутри `crates/oristudio-geometry/` нет внешней директории `tests/` — все тесты реализованы как встроенные модули `#[cfg(test)] mod tests` в исходных файлах. Всего обнаружено **65 unit-тестов**:
- `tol.rs` (**1**): проверка вывода `TOL` из `ORIEDITA_EPSILON_POINT / ORIEDITA_PAPER_SIDE`.
- `line.rs` (**12**): канонизация знака, швы при `nx ≈ 0` и `ny ≈ 0`, эквивалентность `(n, d) ~ (-n, -d)`, параллельные смещения, `intersection_and_reflection`, `reflect_line_and_perpendicular_bisector`, параметризация, вырожденные входы, дедупликация в `LineIndex` через швы и границы бакетов.
- `pointgrid.rs` (**5**): поиск через границы ячеек, дедупликация по радиусу, переполнение `i64` при экстремальных координатах (`1e16`), радиус меньше размера ячейки.
- `frame.rs` (**4**): переворот оси `y`, согласованность `affines` с прямыми методами, граничные прямые единичного прямоугольника, вырожденные фреймы.
- `sheet.rs` (**4**): `clip_and_crosses`, рёбра/углы/имена, `flap_aspects`, реализация `Paper`.
- `outline.rs` (**9**): сборка разбитого квадрата, фильтрация мелких отклонений границы, сохранение настоящих углов и разворотов на 180°, отказ для незамкнутых/T-образных контуров и параллелограммов, расчёт `residual`, повёрнутый лист, `point_in_polygon`.
- `construct.rs` (**12**): детерминированное случайное восстановление `O1..O7` (в т.ч. `O3`, `O5`, `O6` кубический решатель, `O7`), фильтры попадания на `Paper`, `nearest_root` vs `certify`.
- `convex.rs` (**18**): `signed_area`, `normalize`, `is_convex`, `centroid`, `HalfPlane::left_of`, `split` (включая проход через вершины и негенерацию микрорёбер), `clip`, `carve`, `penetration`, игнорирование рёбер `< MIN_EDGE`, `width`, `contains_point`, `segment_length_inside`, рандомизированная перекрёстная проверка `clip`/`split`/`penetration`.

---

## Задача 2. Возможность внешнего вызова

| Способ вызова | Доступность (`VERIFIED`) | Подтверждённые факты из исходного кода |
|---|---|---|
| **Из другого Rust-крейта** | **Да** | Обычный библиотечный крейт (`src/lib.rs`, `MIT OR Apache-2.0`). Уже подключается через `{ path = "../oristudio-geometry" }` в `oristudio-precrease`, `oristudio-layer-order`, `oristudio-layer-spread`, `oristudio-fold`, `oristudio-fold-wasm`, `oracle-tests`. Поскольку в корневом `Cargo.toml` задано `publish = false`, с crates.io не устанавливается — только через `path` или `git`. |
| **Напрямую из JavaScript / TypeScript** | **Нет** | Внутри `crates/oristudio-geometry` нет JS/TS-кода, N-API, C-FFI (`extern "C"`) или node-привязок. |
| **Через WASM** | **Напрямую — Нет; косвенно — крайне ограниченно** | У `oristudio-geometry` **нет** собственного `*-wasm` крейта и зависимости от `wasm-bindgen`. Косвенно: (1) `oristudio-precrease-wasm` экспортирует в JS только обёртки вокруг `tol`/`frame`/`outline` (`precrease_tolerances`, `sheet_frames`, `outline_components`, `sheet_component`, `model_to_rf`, `rf_to_model`); (2) `oristudio-fold-wasm` использует `oristudio_geometry::Line` внутри wire-формата команд сгибания (`FoldEngine`), но **не экспортирует** `Line::reflect_point`, `Line::reflect_line`, `Line::intersect`, `Construction` или `convex::*` как отдельные WASM-функции. |
| **Через CLI или тестовый harness** | **Собственного CLI нет; есть `cargo test`** | Внутри `oristudio-geometry` нет `src/bin/`, `examples/` или CLI. Крейт `treemaker-cli` от `oristudio-geometry` не зависит (`INFERRED` по отсутствию зависимости, не просматривался отдельно). Единственный готовый harness в самом крейте — встроенные unit-тесты `cargo test -p oristudio-geometry` (плюс кросс-крейтовый тест-пакет `oracle-tests`). |

---

## Задача 3. Сопоставление `oristudio-geometry` с OMR

### 3.1. Таблица сопоставления возможностей

| Возможность Ori Studio (`oristudio-geometry`) | Возможный аналог в OMR | Совместимость |
|---|---|---|
| `Line { n, d }` с канонизацией `\|n\| = 1`, знаком `n` и отсечением `\|n\| < TOL` (`1e-6`) | `LineNormalParams { nx, ny, c }` в `L2`/`L7` (`nx*x + ny*y = c`), без нормализации, с порогом `zeroNormalEpsilon = 1e-12` | **Частичная (`VERIFIED`):** математическая модель прямой эквивалентна (`c ≡ d` при `\|n\| = 1`), но различаются правила нормализации и пороги допустимости (`1e-6` vs `1e-12`). |
| `Line::reflect_point(&self, p: [f64; 2]) -> [f64; 2]` | Базовая формула расчёта координат одной вершины внутри `L2::reflectAcrossLine` | **Высокая на уровне формулы одной точки (`VERIFIED`):** идентичная проекционная формула `p - 2*s*n` в IEEE-754 `f64` без округления; отличается только тем, что `Line` заранее нормализует `n`, а `L2` делит на `n·n`. |
| `Line::reflect_line(&self, other: &Line) -> Option<Line>` | Прямого аналога в текущем `L2` (`/src/core/l2GeometryEngine.ts`) нет | **Нет прямого аналога в OMR (`VERIFIED`):** OMR `L2` на текущем этапе отражает только подмножество вершин `GeometryState`, а не объект прямой. |
| Отражение геометрического объекта / состояния (`GeometryState`: вершины, рёбра, грани, `movingVertexIds` / `fixedVertexIds`) | `L2::reflectAcrossLine` (Контракт 02) | **Отсутствует в `oristudio-geometry` (`VERIFIED`):** крейт не содержит ни структуры графа/состояния, ни операции отражения полигона/набора вершин с разделением на движущиеся и неподвижные. |
| Выпуск сертификата/свидетеля отражения (`ReflectionWitness`, `TraceEntry`) и независимая Zero-Trust верификация (`L7`) | `ReflectionWitness`, `TraceEntry` и `l7IndependentVerifier.ts` (`verifyResult`, `verifyProcess`) | **Отсутствует в `oristudio-geometry` (`VERIFIED`):** у `Line::reflect_point` нет ни `Witness`, ни `Trace`; `construct::Certificate` сертифицирует только близость построенной прямой к целевой (`line_residual <= TOL`), а не изометрию/инверсию ориентации после сгиба. |
| `Line::intersect`, `project_point`, `signed_distance`, `perpendicular_bisector` | Планируемые базовые операции L2 (`INTERSECT`, проекции, расстояния из спецификаций L1–L7; в текущем коде `l2GeometryEngine.ts` не реализованы) | **Концептуально совместимы (`INFERRED`):** могут служить прямым референсным оракулом для будущих L2-операций, кроме расхождения по порогам (`TOL = 1e-6`). |
| `Construction` (`O1..O7`) и `Paper` (`lines`, `nearest_root`, `certify`) | Будущий слой L1/L2 (трансляция аксиом Хузиты–Джастина в геометрические шаги) | **Потенциально высокая как референс-оракул (`INFERRED`):** в текущем OMR L2 реализована только `REFLECTION_ACROSS_LINE`; `O1..O7` из `construct.rs` покрывают более высокий уровень построения складок на листе. |
| `convex::{signed_area, split, clip, carve, overlaps, width, contains_point}` | В `L7` реализован только `computeSignedArea` (формула шнурования Гаусса); разделение граней `L1↔L2` в текущем TS-коде не реализовано | **Частичная (`VERIFIED` для `signed_area`, `INFERRED` для остального):** `convex::signed_area` совпадает с `computeSignedArea` в `L7` (оба возвращают `> 0` для CCW), остальные полигональные операции в текущем коде OMR отсутствуют. |
| `TOL = 1e-6` внутри геометрического ядра | Разделение ответственности OMR: `GeometryState` без допусков; допуск `epsilon = 1e-7` (или `1e-12` в тестах) задаётся на стороне `L7` | **Концептуальное расхождение (`VERIFIED`):** `oristudio-geometry` вшивает `TOL = 1e-6` прямо в конструкторы и предикаты, тогда как OMR выносит допуски в независимый верификатор `L7` (`types.ts`, стр. 37). |

### 3.2. Явная проверка: отражение точки и геометрических объектов относительно прямой (`VERIFIED`)

1. **Отражение точки относительно прямой — ПРИСУТСТВУЕТ:**
   - Метод `oristudio_geometry::Line::reflect_point(&self, p: [f64; 2]) -> [f64; 2]` (`src/line.rs:92–95`).
   - Вычисление: `s = self.n[0] * p[0] + self.n[1] * p[1] - self.d`, затем `[p[0] - 2.0 * s * self.n[0], p[1] - 2.0 * s * self.n[1]]` (где `self.n` предварительно нормализована в `Line::new` с точностью до `f64`).
2. **Отражение бесконечной прямой относительно прямой — ПРИСУТСТВУЕТ:**
   - Метод `oristudio_geometry::Line::reflect_line(&self, other: &Line) -> Option<Line>` (`src/line.rs:138–142`).
3. **Отражение геометрических объектов (многоугольников, отрезков с идентификаторами, графов `Vertex/Edge/Face`, состояний) — ОТСУТСТВУЕТ:**
   - В `oristudio-geometry` (включая `convex`, `sheet`, `frame`, `outline`) **нет** функции отражения многоугольника (`convex::reflect` отсутствует), отрезка или набора связанных вершин/рёбер/граней.
   - Внешняя программа при использовании `oristudio-geometry` обязана самостоятельно обходить вершины, разделять движущиеся и неподвижные вершины, отслеживать `VertexId`/`EdgeId`/`FaceId` и строить/проверять свидетельства (`Witness`). *(Многошаговое складывание граней и графов реализовано на более высоком уровне в других крейтах Ori Studio, в частности `oristudio-fold`, которые не входят в рамки данного этапа.)*

---

## Задача 4. Предложение минимального эксперимента (без запуска)

Цель эксперимента — проверить побитовую/численную согласованность базового оператора отражения точки (`Line::reflect_point` в `oristudio-geometry` vs `reflectAcrossLine` в OMR `L2`) и совместимость результата с независимым Zero-Trust верификатором OMR `L7` (`verifyResult`), а также зафиксировать границу расхождения контрактов допустимости входных осей.

### 4.1. Сценарий эксперимента

- **Исходная геометрия (из `tests/contract02.test.ts`):**
  1. Набор А (`makeUnitSquareTriangleState`): треугольник с вершинами `V3 = (0, 1)`, `V2 = (1, 1)`, `V1 = (1, 0)` и дополнительная внерешётчатая тестовая точка `P_irr = (0.3, 0.7)` (чтобы исключить «везение» на точных двоичных дробях).
  2. Набор Б (проверка контракта на почти нулевой нормали): точка `V2 = (1, 1)`.
- **Заданная геометрическая операция (`REFLECTION_ACROSS_LINE`):**
  1. **Кейс 1 (диагональ единичного квадрата `x + y = 1`):**
     - Ori Studio: `Line::new([1.0, 1.0], 1.0)` → `reflect_point` для `V3, V2, V1, P_irr`.
     - OMR `L2`: `reflectAcrossLine` с `line: { nx: 1, ny: 1, c: 1 }`, `movingVertexIds: ['V3', 'V2', 'V1']` (и отдельный прогон для `P_irr`).
  2. **Кейс 2 (неединичная неортогональная ось `3x - 4y = 5` и её масштабирование `× 1e6`):**
     - Ori Studio: `Line::new([3.0, -4.0], 5.0)` и `Line::new([3e6, -4e6], 5e6)` → `reflect_point`.
     - OMR `L2`: `reflectAcrossLine` с `{ nx: 3, ny: -4, c: 5 }` и `{ nx: 3e6, ny: -4e6, c: 5e6 }`.
  3. **Кейс 3 (граница вырожденной нормали `||n|| = sqrt(2) * 1e-9`):**
     - Ori Studio: `Line::new([1e-9, 1e-9], 0.0)`.
     - OMR `L2`: `reflectAcrossLine` с `{ nx: 1e-9, ny: 1e-9, c: 0 }`.
- **Результат вычисления:**
  - Из Ori Studio извлекаются сырые IEEE-754 `f64` координаты `[x', y']` (либо `None` при отказе `Line::new`).
  - Из OMR `L2` извлекаются `resultingState.vertices[i].position` (либо ошибка `L2EngineError`) и `witness`.
- **Способ сравнения результатов:**
  1. Прямое численное сравнение пар `(x_ori, y_ori)` и `(x_omr, y_omr)` в `f64`: вычисление `Δx = |x_ori - x_omr|`, `Δy = |y_ori - y_omr|`, `max(||p'_ori - p'_omr||_2)`.
  2. Перекрёстная верификация в OMR `L7`: подстановка координат из `oristudio-geometry` в структуру `GeometryState` и `ReflectionWitness` (с исходными ненормализованными параметрами прямой и пересобранной топологией) и вызов `verifyResult(claim, { epsilon: 1e-12 })` и с порогом по умолчанию `{ epsilon: 1e-7 }`.
- **Критерии обнаружения расхождений:**
  1. В Кейсах 1 и 2: любое расхождение `max(Δx, Δy) > 1e-12` (или отказ `L7::verifyResult` при `epsilon = 1e-12`) означает существенное отличие вычислений; ожидаемая разница в последних ULP (`~1e-15..1e-16`) из-за порядка операций (`n/||n||` до проекции у Ori Studio против деления на `n·n` без извлечения корня у OMR `L2`) фиксируется отдельно.
  2. В Кейсе 3: ожидаемое расхождение **поведения контракта** — `oristudio-geometry` вернёт `None` (так как `||n|| < TOL = 1e-6`), тогда как OMR `L2` выполнит отражение (так как `||n|| > zeroNormalEpsilon = 1e-12`). Это позволит экспериментально подтвердить границу несовместимости допусков перед проектированием адаптера.

---

## Минимальный технический шаг для первого реального эксперимента (`INFERRED`)

Чтобы выполнить описанный эксперимент без изменения `oristudio-geometry` и без сборки всего `ori-studio`, минимальный технический шаг следующий:

1. **Распаковать/подключить только срез `crates/oristudio-geometry`** во временный изолированный каталог (вне исходников проекта) и создать рядом **однофайловую Rust-утилиту (или Cargo-пакет с `path`-зависимостью на `oristudio-geometry` и `serde_json` с фичей `float_roundtrip`)**, которая читает JSON со входом `{ "line": [nx, ny, c], "points": [[x, y], ...] }`, вызывает `Line::new([nx, ny], c)` и `line.reflect_point(p)`, и печатает в `stdout` JSON с результатом в полной точности `f64` (или `null`, если `Line::new` вернул `None`).
2. Запускать эту утилиту как дочерний процесс из тестового скрипта OMR (`tests/` или временного runner на `tsx`/`node:test`), сравнивая её `stdout` с `reflectAcrossLine` и передавая результат в `verifyResult` из `src/core/l7IndependentVerifier.ts`.

*(Примечание `UNKNOWN`: наличие установленных `rustc`/`cargo` и доступность локального кэша крейтов `serde`/`thiserror` для автономной компиляции `oristudio-geometry` в текущем окружении не проверялись.)*
