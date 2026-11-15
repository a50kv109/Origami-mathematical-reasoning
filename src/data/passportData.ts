/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface EpistemicPillar {
  index: string;
  title: string;
  subtitle: string;
  points: string[];
}

export interface CoreConcept {
  term: string;
  role: string;
  description: string;
}

export interface SystemContour {
  code: string;
  title: string;
  role: string;
  boundary: string;
}

export interface LayerDetail {
  code: string;
  name: string;
  space: string;
  purpose: string;
  responsibilities: string[];
  operations: string[];
  constraint?: string;
  maturity: string;
  devNote: string;
}

export interface ContractSpec {
  id: string;
  pair: string;
  subject: string;
  targetScenario: string;
  topics: string[];
  status: string;
}

export interface ToolAdapterSpec {
  name: string;
  stack: string;
  confirmed: string;
  unverifiedApi: string;
  role: string;
}

export type SourceCategory =
  | 'Simulators & Datasets'
  | 'Stands & Verifiers'
  | 'Literature (PDF)'
  | 'Specs & Reports';

export interface SourceEntry {
  id: number;
  title: string;
  author: string;
  year: string;
  category: SourceCategory;
  layers: string[];
  summary: string;
  reference: string;
  isTop14: boolean;
  top14Rank?: number;
}

export interface ReuseItem {
  module: string;
  origin: string;
  status: 'REUSE' | 'ADOPT' | 'GAP';
  detail: string;
}

export interface IdentityClass {
  code: string;
  title: string;
  portability: string;
  examples: string[];
  note: string;
}

export interface RoadmapPhase {
  phase: string;
  title: string;
  description: string;
  status: 'Завершено концептуально' | 'В работе' | 'Запланировано';
}

export interface StageOneDoc {
  filename: string;
  title: string;
  scope: string;
  keyTakeaways: string[];
}

export const SYSTEM_CONTOURS: SystemContour[] = [
  {
    code: 'A',
    title: 'Origami Reasoning Core',
    role: 'Математическое ядро (L1–L7, STATE, TRANSFORMATION, TRACE, VERIFICATION)',
    boundary: 'Не дублирует графический редактор и рендер; отвечает за модель, операции и доказательную проверку.',
  },
  {
    code: 'B',
    title: 'Origami Design Tools',
    role: 'Внешние программы (Ori Studio, Oriedita, Rabbit Ear, OrigamiSimulator)',
    boundary: 'Подключаются строго через Tool Integration Layer; результаты возвращаются на Zero-Trust проверку в L7.',
  },
  {
    code: 'C',
    title: 'AI Agent Reasoning Skill',
    role: 'Связующий интерфейс между естественным языком, ядром и адаптерами',
    boundary: 'Предлагает план операций, но не имеет права самостоятельно объявлять результат доказанным.',
  },
];

export const EPISTEMIC_PILLARS: EpistemicPillar[] = [
  {
    index: '01',
    title: 'Что задумано',
    subtitle: 'Назначение и концепция',
    points: [
      'Самостоятельная система математического и инженерного рассуждения, подключаемая к внешним инструментам оригами.',
      'Принцип Goal-Oriented Mathematical Verification: разные последовательности допустимы при выполнении требований и инвариантов.',
      'Переносимая математическая компетенция: оригами как полигон перехода 2D → 3D с последующим переносом в CAD и листовой металл.',
    ],
  },
  {
    index: '02',
    title: 'Что спроектировано',
    subtitle: 'Ядро, слои и интеграция',
    points: [
      'Семь изолированных уровней L1–L7 без слияния характеристик объекта в единый монолитный кортеж.',
      'Пять абстракций: STATE, TRANSFORMATION, TRACE, RESULT VERIFICATION и PROCESS VERIFICATION.',
      'Tool Integration Layer (разделение канонического состояния ядра и адаптеров внешних инструментов) и 9 документов Stage 1.',
    ],
  },
  {
    index: '03',
    title: 'Что реализовано и проверено',
    subtitle: 'Подтверждено в аудите PCRS',
    points: [
      'В архиве Origami-Geometry-Core (PCRS) подтверждены 2D-ядро отражений src/core/reflection.ts и независимый верификатор independentVerifier.ts.',
      'Реализованы тесты последовательностей (seq001–003), коды ошибок (включая CAPABILITY_GAP) и допуски для области L ≤ 2.',
      'Слои L3–L6, контракт L1 ↔ L2, адаптеры внешних программ и AI Skill ещё не интегрированы в единый вычислительный контур.',
    ],
  },
];

export const CORE_CONCEPTS: CoreConcept[] = [
  {
    term: 'STATE',
    role: 'Типизированное состояние',
    description:
      'Снимок структуры, топологии и геометрических свойств объекта на определённом этапе построения.',
  },
  {
    term: 'TRANSFORMATION',
    role: 'Математическая операция',
    description:
      'Детерминированный оператор, переводящий объект из одного допустимого состояния в другое (REFLECTION, FACE_SUBDIVISION).',
  },
  {
    term: 'TRACE',
    role: 'История построения',
    description:
      'Воспроизводимая последовательность операций, промежуточных состояний и происхождения каждого изменения.',
  },
  {
    term: 'RESULT VERIFICATION',
    role: 'Проверка конечного состояния',
    description:
      'Независимая оценка итогового объекта на соответствие требованиям, не требующая обязательной привязки к TRACE.',
  },
  {
    term: 'PROCESS VERIFICATION',
    role: 'Проверка процесса',
    description:
      'Последовательная проверка математической корректности каждого перехода Sᵢ → Sᵢ₊₁ по журналу TRACE.',
  },
];

export const ARCHITECTURE_LAYERS: LayerDetail[] = [
  {
    code: 'L1',
    name: 'Topological Layer',
    space: 'Дискретные графы',
    purpose: 'Описание структурной организации и связности объекта.',
    responsibilities: [
      'Управление идентификаторами VertexID, EdgeID, FaceID',
      'Графы смежности, связность и границы граней',
      'Структурное подразделение и топологическая допустимость',
    ],
    operations: ['FACE_SUBDIVISION', 'MATERIAL_CUT', 'BIND_IDS'],
    constraint:
      'Принимает геометрические предложения от L2, но утверждает топологическую корректность самостоятельно (опора на PGS-2D).',
    maturity: 'Проектирование',
    devNote:
      'Концепция контракта L1 ↔ L2 прошла аудит; требуется формальная схема и тесты.',
  },
  {
    code: 'L2',
    name: 'Geometric Layer',
    space: 'Координатное пространство ℝ², ℝ³',
    purpose: 'Детерминированное математическое представление в координатах.',
    responsibilities: [
      'Координаты вершин, расстояния, углы и площади',
      'Вычисление пересечений и геометрических предложений',
      'Привязка координат к топологическим идентификаторам',
    ],
    operations: ['BIND_GEOMETRY', 'REFLECTION', 'INTERSECT'],
    constraint:
      'Базовый проверочный сценарий: аффинное отражение треугольной грани квадрата относительно прямой x + y = 1.',
    maturity: 'Проектирование (2D-прототип в PCRS)',
    devNote:
      'В PCRS реализован src/core/reflection.ts (Float64, L ≤ 2). Требуется согласование с BigInt (GIEM / Fedorov).',
  },
  {
    code: 'L3',
    name: 'Layer Order Layer',
    space: 'Комбинаторика перекрытий',
    purpose: 'Описание пространственного Z-порядка перекрывающихся областей.',
    responsibilities: [
      'Области перекрытия и идентичность материальных слоёв',
      'Локальный порядок выше/ниже и согласование отношений',
      'Связь порядка слоёв с ориентацией складки',
    ],
    operations: ['LAYER_ORDER_RESOLUTION'],
    constraint:
      'Порядок слоёв нельзя выводить только из 2D-отражения — требуются сведения о конфигурации и направлении сгиба.',
    maturity: 'Концепция',
    devNote:
      'Референсы для Phase 5: oristudio-layer-order и Flat-Folder; формальная модель в OMR не завершена.',
  },
  {
    code: 'L4',
    name: 'Kinematic Layer',
    space: 'Непрерывные траектории γ(t)',
    purpose: 'Моделирование пространственного движения твёрдых панелей при сгибе.',
    responsibilities: [
      'Оси сгиба, двугранные углы и степени свободы',
      'Непрерывные траектории γ(t), t ∈ [0, 1]',
      'Кинематические ограничения и ветвления решений',
    ],
    operations: ['FOLD_KINEMATIC'],
    constraint:
      'Открытая проблема: строгая проверка отсутствия пространственных столкновений на всей непрерывной траектории.',
    maturity: 'Концепция',
    devNote:
      'Отложено до завершения 2D-прототипа L2 ↔ L7. Задел 3D-вершин есть в 3D-Geometry-Reasoning-Stand-v2.',
  },
  {
    code: 'L5',
    name: 'Curved Folding Layer',
    space: 'Деформируемые поверхности',
    purpose: 'Работа с криволинейными складками, не сводимыми к плоским граням.',
    responsibilities: [
      'Геометрия криволинейных складок и локальных деформаций',
      'Триангуляция и методы поверхностной аппроксимации',
      'Взаимодействие с кинематическими ограничениями L4',
    ],
    operations: ['CURVED_APPROXIMATION', 'TRIANGULATE'],
    maturity: 'Исследовательская постановка',
    devNote:
      'Ориентиры на Phase 7: Ruling-aware Triangulation (OrigamiSimulator) и ikgraf.pdf.',
  },
  {
    code: 'L6',
    name: 'Optimization Layer',
    space: 'Эвристический поиск',
    purpose: 'Поиск, генерация и ранжирование альтернативных последовательностей.',
    responsibilities: [
      'Генерация кандидатов и оценка альтернативных конфигураций',
      'Критерии: число сгибов, симметрия, отклонения, расход материала',
      'Эвристики Fe3uni: SoftThresholdPenalty, 1DStateMatcher, SystemHealthIndex',
    ],
    operations: ['SEARCH_CANDIDATES', 'RANK_SEQUENCES'],
    constraint:
      'Оптимизационный балл не является доказательством корректности; метрика StructuralDensity исключена при нулевой толщине.',
    maturity: 'Исследовательская база',
    devNote:
      'Интегрированный оптимизатор отсутствует (запланирован на Phase 6).',
  },
  {
    code: 'L7',
    name: 'Independent Verification Layer',
    space: 'Zero-Trust проверка',
    purpose: 'Независимый пересчёт операций и доказательная оценка результата.',
    responsibilities: [
      'Проверка геометрических инвариантов и топологических предикатов',
      'Независимый пересчёт преобразований без общего кода с генератором',
      'Вердикты PASS / FAIL / UNDETERMINED и семантический отказ CAPABILITY_GAP',
    ],
    operations: ['VERIFY_REFLECTION', 'VERIFY_TRACE', 'CHECK_INVARIANTS'],
    constraint:
      'Совпадение двух реализаций на одном алгоритме не считается независимой проверкой.',
    maturity: 'Проектирование (2D-прототип в PCRS)',
    devNote:
      'Первый приоритет Phase 2 — Contract 02 (L2 ↔ L7) для оператора REFLECTION.',
  },
];

export const CONTRACTS: ContractSpec[] = [
  {
    id: 'Contract 01',
    pair: 'L1 ↔ L2',
    subject: 'Topology ↔ Geometry',
    targetScenario: 'Топологическое подразделение грани',
    topics: [
      'Идентификаторы VertexID / EdgeID / FaceID (portableId != localId)',
      'Разделение границ граней и диагоналей сгиба (PGS-2D)',
      'Версионирование состояний и FACE_SUBDIVISION',
    ],
    status: 'Концепция прошла аудит · Требуется формальная схема (Phase 3)',
  },
  {
    id: 'Contract 02',
    pair: 'L2 ↔ L7',
    subject: 'Geometry ↔ Independent Verification',
    targetScenario: '2D Affine Reflection (x + y = 1)',
    topics: [
      'Входные координаты, ось отражения и матрица R = 2uuᵀ - I',
      'Автономный пересчёт площади (Shoelace) и инвариантов длин',
      'Вердикты PASS / FAIL / UNDETERMINED / CAPABILITY_GAP',
    ],
    status: 'Следующий приоритет · В разработке (Phase 2)',
  },
];

export const SUBSEQUENT_CONTRACTS = [
  'L2 ↔ L3 · Geometry / Layer Order',
  'L3 ↔ L4 · Layer Order / Kinematics',
  'L4 ↔ L7 · Kinematic Verification',
  'L5 ↔ L6 · Curved Folding / Optimization',
  'L6 ↔ L7 · Candidate Evaluation / Verification',
];

export const TOOL_ADAPTERS: ToolAdapterSpec[] = [
  {
    name: 'Ori Studio',
    stack: 'Rust / WASM (oristudio-cp, oristudio-fold, oristudio-layer-order)',
    confirmed: 'Модульное разделение крейтов для развёртки, плоских/составных сгибов и порядка слоёв.',
    unverifiedApi: 'Требуется проверка наличия стабильного headless JS/WASM-контракта вызова без GUI.',
    role: 'Архитектурный референс L1–L4 и расчёт Z-порядка',
  },
  {
    name: 'Oriedita',
    stack: 'Java (.ori, .cp, .fold, FoldLineSet)',
    confirmed: 'Проверка локальной плоской складываемости вершин по расширенной теореме Кавасаки/Фушими.',
    unverifiedApi: 'Требуется проверка CLI/пакетного режима запуска вне графического окна.',
    role: 'Внешний валидатор плоских развёрток',
  },
  {
    name: 'Rabbit Ear',
    stack: 'JS / TS, формат FOLD, fold-validator',
    confirmed: 'Нативная среда JS/TS, графовый формат FOLD и валидатор целостности графа сгибов.',
    unverifiedApi: 'Требуется согласование индексов FOLD с каноническими portableId ядра OMR.',
    role: 'Обменный графовый формат FOLD и проверка графов',
  },
  {
    name: 'OrigamiSimulator',
    stack: 'JS / WebGL (фрагментные шейдеры)',
    confirmed: 'Непрерывная 3D GPU-симуляция складывания и Ruling-aware Triangulation криволинейных складок.',
    unverifiedApi: 'Требуется проверка headless-выгрузки 3D-координат без интерактивного WebGL-канваса.',
    role: 'Визуальная и приближённая 3D-симуляция (не доказательство)',
  },
];

export const SOURCES_29: SourceEntry[] = [
  {
    id: 1,
    title: 'Ori Studio',
    author: 'Zachary Marion',
    year: '2026',
    category: 'Simulators & Datasets',
    layers: ['L1', 'L2', 'L3', 'L4', 'L6'],
    summary: 'Rust/WASM-архитектура: oristudio-cp, oristudio-fold, oristudio-layer-order, oristudio-geometry и 3D-проверка вершин.',
    reference: 'https://github.com/zacharyfmarion/ori-studio',
    isTop14: true,
    top14Rank: 12,
  },
  {
    id: 2,
    title: 'OrigamiSimulator',
    author: 'Amanda Ghassaei и соавт.',
    year: '2020–2026',
    category: 'Simulators & Datasets',
    layers: ['L4', 'L5'],
    summary: 'Непрерывная 3D GPU-симуляция (WebGL), расчёт внутреннего натяжения и Ruling-aware Triangulation.',
    reference: 'https://github.com/amandaghassaei/OrigamiSimulator',
    isTop14: true,
    top14Rank: 13,
  },
  {
    id: 3,
    title: 'Oriedita',
    author: 'Сообщество Oriedita',
    year: '2026 (v1.1.3)',
    category: 'Simulators & Datasets',
    layers: ['L1', 'L2', 'L7'],
    summary: 'Построение развёрток (.ori/.cp/.fold) и проверка плоской складываемости вершин (FoldLineSet).',
    reference: 'https://github.com/oriedita/oriedita',
    isTop14: false,
  },
  {
    id: 4,
    title: 'TreeMaker 5.1.2',
    author: 'Robert J. Lang, Vish Vishvanath',
    year: '2026',
    category: 'Simulators & Datasets',
    layers: ['L2', 'L6'],
    summary: 'Синтез crease patterns по 1D-дереву методом circle/river packing — референс для оптимизации L6.',
    reference: 'https://github.com/vishvish/treemaker',
    isTop14: false,
  },
  {
    id: 5,
    title: 'Rabbit Ear',
    author: 'Rabbit Ear (robbykraft)',
    year: '2025–2026',
    category: 'Simulators & Datasets',
    layers: ['L1', 'L2', 'L7'],
    summary: 'JS/TS-библиотека графового формата FOLD и валидатор целостности графа сгибов fold-validator.',
    reference: 'https://github.com/rabbit-ear',
    isTop14: false,
  },
  {
    id: 6,
    title: 'Origami Crease Pattern Dataset',
    author: 'N. Hochuli, T. Stankovic (ETH Zurich)',
    year: '2025',
    category: 'Simulators & Datasets',
    layers: ['L1', 'L4', 'L6', 'L7'],
    summary: 'Корпус из 8 млн жёстко складываемых 1-DOF развёрток (до 23 вершин) для бенчмарков и тестов.',
    reference: 'https://doi.org/10.3929/ethz-b-000743348',
    isTop14: true,
    top14Rank: 14,
  },
  {
    id: 7,
    title: 'Awesome-origami',
    author: 'G. Oolbekkink, M.-T. Tsai, A. Karnik',
    year: '2025–2026',
    category: 'Simulators & Datasets',
    layers: ['L2', 'L3', 'L6'],
    summary: 'Указатель на библиотеки и солверы: Flat-Folder (L3), FOLD, ReferenceFinder, BP Studio.',
    reference: 'https://github.com/oriedita/awesome-origami',
    isTop14: false,
  },
  {
    id: 8,
    title: 'Origami-Geometry-Core / PCRS',
    author: 'А. А. Арцыбашев (a50kv109)',
    year: '2026',
    category: 'Stands & Verifiers',
    layers: ['L1', 'L2', 'L7'],
    summary: 'База pcrs-theory: замороженное 2D-ядро reflection.ts, independentVerifier.ts и тесты seq001–003.',
    reference: 'https://github.com/a50kv109/Origami-Geometry-Core',
    isTop14: true,
    top14Rank: 5,
  },
  {
    id: 9,
    title: 'Geometry-Reasoning-Core',
    author: 'А. А. Арцыбашев (a50kv109)',
    year: '2026',
    category: 'Stands & Verifiers',
    layers: ['L1', 'L2', 'L7'],
    summary: 'TypeScript-ядро с разделением src/core/ и изолированного src/verifier/independentVerifier.ts.',
    reference: 'https://github.com/a50kv109/Geometry-Reasoning-Core',
    isTop14: true,
    top14Rank: 6,
  },
  {
    id: 10,
    title: 'AI Geometry Skill (-ai-geometry-skill-2)',
    author: 'А. А. Арцыбашев (a50kv109)',
    year: '2026',
    category: 'Stands & Verifiers',
    layers: ['L2', 'L6', 'L7'],
    summary: 'HeadlessGeometrySession, аналитические пересечения (rootIndex), GIEM v0.1 (BigInt) и FourierV2.',
    reference: 'https://github.com/a50kv109/-ai-geometry-skill-2',
    isTop14: true,
    top14Rank: 7,
  },
  {
    id: 11,
    title: 'Portable-Geometric-State-2D (PGS-2D)',
    author: 'А. А. Арцыбашев (a50kv109)',
    year: '2026',
    category: 'Stands & Verifiers',
    layers: ['L1', 'L2', 'L7'],
    summary: 'Стандарт Polygon(n), portableId != localId, Construction DAG и разделение структурной/математической валидации.',
    reference: 'https://github.com/a50kv109/Portable-Geometric-State-2D',
    isTop14: true,
    top14Rank: 8,
  },
  {
    id: 12,
    title: '3D-Geometry-Reasoning-Stand / v2',
    author: 'А. А. Арцыбашев (a50kv109)',
    year: '2026',
    category: 'Stands & Verifiers',
    layers: ['L1', 'L2', 'L4', 'L7'],
    summary: '3D-модель (тетраэдр на S²), сферические конусы инцидентных рёбер (LSM/LVG) и монотонные переходы t₁ > t₀.',
    reference: 'https://github.com/a50kv109/geometry-reasoning-stand-3d-v2',
    isTop14: true,
    top14Rank: 9,
  },
  {
    id: 13,
    title: 'Fedorov-Symmetry-Stand-V2',
    author: 'А. А. Арцыбашев (a50kv109)',
    year: '2026',
    category: 'Stands & Verifiers',
    layers: ['L1', 'L2', 'L7'],
    summary: 'Рациональная линейная алгебра на BigInt (STL V1), контроль хиральности и верификатор Gatekeeper GK-01..09.',
    reference: 'https://github.com/a50kv109/Fedorov-Symmetry-Stand-V2-Research-Lab.',
    isTop14: false,
  },
  {
    id: 14,
    title: 'SOL-Triad-Engine / v2',
    author: 'А. А. Арцыбашев (a50kv109)',
    year: '2026',
    category: 'Stands & Verifiers',
    layers: ['L7'],
    summary: 'Ядро проверки переходов состояний по триаде SOURCE — CONSTRAINT — DISSIPATE (шаблон Process Verification).',
    reference: 'https://github.com/a50kv109/SOL-Triad-Engine-v2',
    isTop14: true,
    top14Rank: 10,
  },
  {
    id: 15,
    title: 'Fe3uni-Harmonic-Analytics-v3.0',
    author: 'А. А. Арцыбашев (a50kv109)',
    year: '2026',
    category: 'Stands & Verifiers',
    layers: ['L6'],
    summary: 'Примитивы SoftThresholdPenalty, 1DStateMatcher и SystemHealthIndex для запланированного слоя L6.',
    reference: 'https://github.com/a50kv109/Fe3uni-Harmonic-Analytics-v3.0',
    isTop14: true,
    top14Rank: 11,
  },
  {
    id: 16,
    title: 'dpco-v3 и dpco-skill',
    author: 'А. А. Арцыбашев (a50kv109)',
    year: '2026',
    category: 'Stands & Verifiers',
    layers: ['L2', 'L7'],
    summary: 'Оркестратор дискретной 2D-геометрии (Admission → Executor → IndependentVerifier → Ledger).',
    reference: 'https://github.com/a50kv109/dpco-v3',
    isTop14: false,
  },
  {
    id: 17,
    title: 'Quadrilateral-in-circle-stand (CQNS-001)',
    author: 'А. А. Арцыбашев (a50kv109)',
    year: '2026',
    category: 'Stands & Verifiers',
    layers: ['L1', 'L2', 'L7'],
    summary: 'Эталон изоляции GeometryCore, TopologyGuard и CheckpointBuffer по принципу «Agent may be wrong. The stand must not».',
    reference: 'https://github.com/a50kv109/Quadrilateral-in-circle-stand.',
    isTop14: false,
  },
  {
    id: 18,
    title: 'vsam и belov-fiber-sdk',
    author: 'А. А. Арцыбашев (a50kv109)',
    year: '2026',
    category: 'Stands & Verifiers',
    layers: ['L7'],
    summary: 'Стандарты воспроизводимости: криптографически подписанный Passport/Trace и хеш-цепочки Log Replay.',
    reference: 'https://github.com/a50kv109/vsam',
    isTop14: false,
  },
  {
    id: 19,
    title: 'Modenov-Problems-In-Geometry-Mir-1981.pdf',
    author: 'П. С. Моденов',
    year: '1981',
    category: 'Literature (PDF)',
    layers: ['L2'],
    summary: 'Векторная алгебра 2D/3D, комплексные аффиксы, изометрии, ортогональные проекции и определители Грама.',
    reference: 'Локальный PDF-файл в библиотеке блокнота',
    isTop14: false,
  },
  {
    id: 20,
    title: 'ikgraf.pdf (Інженерна та комп’ютерна графіка)',
    author: 'В. Є. Михайленко и др.',
    year: '2000',
    category: 'Literature (PDF)',
    layers: ['L2', 'L5'],
    summary: 'Развёртки многогранников, линейчатые и криволинейные поверхности, параметрическое моделирование.',
    reference: 'Локальный PDF-файл в библиотеке блокнота',
    isTop14: false,
  },
  {
    id: 21,
    title: 'Twist Origami 1.pdf',
    author: 'Сюдзо Фудзимото',
    year: '1978',
    category: 'Literature (PDF)',
    layers: ['L1', 'L2'],
    summary: 'Построения правильных многоугольников, деление отрезков на n частей и twist-тесселяции.',
    reference: 'Локальный PDF-файл в библиотеке блокнота',
    isTop14: false,
  },
  {
    id: 22,
    title: 'Twist Origami 3.pdf',
    author: 'Сюдзо Фудзимото',
    year: '2007 (репринт)',
    category: 'Literature (PDF)',
    layers: ['L1', 'L2', 'L4'],
    summary: 'Замкнутые цилиндрические и каркасные многогранники с расчётными двугранными углами — тесты 3D-замыкания.',
    reference: 'Локальный PDF-файл в библиотеке блокнота',
    isTop14: false,
  },
  {
    id: 23,
    title: 'Solid Origami.pdf',
    author: 'С. Фудзимото, Н. Фудзимура',
    year: '1976',
    category: 'Literature (PDF)',
    layers: ['L1', 'L2', 'L7'],
    summary: 'Объёмные многогранники из одного листа и формула итеративного деления √((n-m)/(n+m)) для тестов L2/L7.',
    reference: 'Локальный PDF-файл в библиотеке блокнота',
    isTop14: false,
  },
  {
    id: 24,
    title: 'GEOMETRY EDUCATIONAL KERNEL HANDOFF.pdf',
    author: 'Спецификация проекта (v1.0)',
    year: '2026',
    category: 'Literature (PDF)',
    layers: ['L2', 'L7'],
    summary: 'Паттерн интеграции ядра DISCOVER → CHECK → SELECT → EXECUTE → TRACE в Google AI Studio с границей от LLM.',
    reference: 'Локальный PDF-файл в библиотеке блокнота',
    isTop14: true,
    top14Rank: 2,
  },
  {
    id: 25,
    title: 'Базовый пакет проекта (4 MD-файла)',
    author: 'Команда OMR',
    year: '2026',
    category: 'Specs & Reports',
    layers: ['L1', 'L2', 'L3', 'L4', 'L5', 'L6', 'L7'],
    summary: 'core_architecture.md, project_readme.md, development_status.md, modular_mathematical_identity.md.',
    reference: 'Документы в каталоге /docs/',
    isTop14: true,
    top14Rank: 1,
  },
  {
    id: 26,
    title: 'Анализ оригами оптимизации (RESEARCH REPORT 02–04)',
    author: 'Сессия исследования и Gemini',
    year: '2026',
    category: 'Specs & Reports',
    layers: ['L1', 'L2', 'L3', 'L4', 'L5', 'L6', 'L7'],
    summary: 'Обоснование отказа от монолитного кортежа S в пользу L1–L7, разграничение инвариантов и траекторий γ(t).',
    reference: 'Чат-отчёт в библиотеке блокнота',
    isTop14: true,
    top14Rank: 3,
  },
  {
    id: 27,
    title: 'Анализ модели оригами',
    author: 'Сессия исследования и Gemini',
    year: '2026',
    category: 'Specs & Reports',
    layers: ['L1', 'L2', 'L3', 'L6', 'L7'],
    summary: 'Эталон 2D-отражения в однородных координатах, интерфейс L2 → L3 и аудит метрик Fe3uni.',
    reference: 'Чат-отчёт в библиотеке блокнота',
    isTop14: true,
    top14Rank: 4,
  },
  {
    id: 28,
    title: 'Самоаудит контекста и архитектурных решений',
    author: 'Сессия исследования и Gemini',
    year: '2026',
    category: 'Specs & Reports',
    layers: ['L1', 'L2', 'L4', 'L7'],
    summary: 'Эксперимент PAT-30 (2D Panels → Fold → 3D Closure), протокол REASON OUTSIDE. VERIFY INSIDE.',
    reference: 'Чат-отчёт в библиотеке блокнота',
    isTop14: false,
  },
  {
    id: 29,
    title: 'Ori Studio Multilingual Origami Research',
    author: 'Сессия исследования и Gemini',
    year: '2026',
    category: 'Specs & Reports',
    layers: ['L1', 'L2', 'L3'],
    summary: 'Формальное разделение физического действия и сдвига слоёв (Reverse, Squash, Rabbit Ear, Pleat, Sink).',
    reference: 'Чат-отчёт в библиотеке блокнота',
    isTop14: false,
  },
];

export const REUSE_AUDIT_ITEMS: ReuseItem[] = [
  {
    module: 'src/core/reflection.ts',
    origin: 'Origami-Geometry-Core (PCRS)',
    status: 'REUSE',
    detail: 'Подтверждённое в архиве чистое 2D-ядро (R = 2uuᵀ - I, Float64, проверка NaN/Infinity). Готово к адаптации в L2.',
  },
  {
    module: 'src/verifier/independentVerifier.ts',
    origin: 'Origami-Geometry-Core (PCRS)',
    status: 'REUSE',
    detail: 'Автономный верификатор (собственная формула Гаусса, коды CAPABILITY_GAP). Ограничение: допуски калиброваны для L ≤ 2.',
  },
  {
    module: 'PGS-2D (Polygon(n) + Construction DAG)',
    origin: 'Portable-Geometric-State-2D',
    status: 'ADOPT',
    detail: 'Целевая контрактная основа для Contract 01 (L1 ↔ L2): разделение границ граней, диагоналей и portableId != localId.',
  },
  {
    module: 'Согласование Float64 vs BigInt (GIEM / STL V1)',
    origin: 'Аудит PCRS vs AI Geometry Skill',
    status: 'GAP',
    detail: 'PCRS использует Float64 с допусками 1e-7/1e-9, а GIEM — точную рациональную арифметику. Требует унификации в Contract 02.',
  },
  {
    module: 'Единый формат TRACE и порядок слоёв L3',
    origin: 'Сквозной аудит L1–L7',
    status: 'GAP',
    detail: 'В PCRS отсутствует формализация перекрытия слоёв (Z-order) и единый переносимый журнал TRACE между слоями.',
  },
];

export const IDENTITY_CLASSES: IdentityClass[] = [
  {
    code: 'Class I',
    title: 'Переносимые математические модули',
    portability: 'Без изменений между доменами',
    examples: [
      'Аффинные и ортогональные отражения',
      'Евклидовы расстояния, углы и площади',
      'Пересечения линия–полигон и топологические инварианты',
    ],
    note: 'Строгая математика, не зависящая от физических свойств материала.',
  },
  {
    code: 'Class II',
    title: 'Адаптируемые предметные модули',
    portability: 'С предметными коэффициентами',
    examples: [
      'Подразделение поверхностей и локальный порядок наложения',
      'Гибка: нулевая ширина в оригами vs K-factor в листовом металле',
      'Кинематические ограничения, контакт и сборка',
    ],
    note: 'Математическая основа сохраняется при явной параметризации области.',
  },
  {
    code: 'Class III',
    title: 'Специфические физические модули',
    portability: 'Непереносимые',
    examples: [
      'Упругость и мятие бумаги (curved folding relaxation)',
      'Пластическая деформация и пружинение металла (springback)',
      'Толщина материала, радиус гибки и сопротивление на разрыв',
    ],
    note: 'Агент обязан отличать математическую теорему (Class I) от физической аппроксимации (Class III).',
  },
];

export const ROADMAP_PHASES: RoadmapPhase[] = [
  {
    phase: 'Phase 01',
    title: 'Mathematical Foundation',
    description: 'Формализация базовых операций, состояний STATE / TRACE, разделения контуров и аудита источников.',
    status: 'Завершено концептуально',
  },
  {
    phase: 'Phase 02',
    title: 'L2 ↔ L7 · Contract 02',
    description: 'Разработка Contract 02 и независимого верификатора для оператора REFLECTION (на базе PCRS).',
    status: 'В работе',
  },
  {
    phase: 'Phase 03',
    title: 'L1 ↔ L2 · Contract 01',
    description: 'Завершение контракта топологии и геометрии (PGS-2D), формализация FACE_SUBDIVISION.',
    status: 'Запланировано',
  },
  {
    phase: 'Phase 04',
    title: 'Integrated 2D MVP',
    description: 'Сквозной цикл: Квадрат → Подразделение → Отражение → TRACE → Независимая проверка → Принятие.',
    status: 'Запланировано',
  },
  {
    phase: 'Phase 05',
    title: 'L3 / L4 · Order & Kinematics',
    description: 'Внедрение локального Z-порядка (L3) и кинематических траекторий γ(t) (L4).',
    status: 'Запланировано',
  },
  {
    phase: 'Phase 06',
    title: 'L6 · Optimization',
    description: 'Подключение поиска и ранжирования кандидатов с обязательной пост-верификацией в L7.',
    status: 'Запланировано',
  },
  {
    phase: 'Phase 07',
    title: 'L5 · Curved Folding',
    description: 'Исследование криволинейных складок, триангуляции и расширенных моделей поверхностей.',
    status: 'Запланировано',
  },
  {
    phase: 'Phase 08',
    title: 'AI Skill & Tool Adapters',
    description: 'Оформление верифицированного reasoning-skill и подключение проверенных адаптеров внешних программ.',
    status: 'Запланировано',
  },
];

export const SUCCESS_CRITERIA: string[] = [
  'Получить семантическое описание геометрического объекта.',
  'Сформировать корректное типизированное математическое представление.',
  'Выбрать допустимую операцию с проверкой условий применимости.',
  'Выполнить преобразование с обновлением состояния.',
  'Сохранить воспроизводимую историю построения (TRACE).',
  'Независимо пересчитать результат в слое L7 без доверия генератору.',
  'Выявить математическую ошибку, включая ошибки собственного генератора.',
  'Обосновать принятие или отклонение итогового объекта.',
];

export const STAGE_ONE_DOCS: StageOneDoc[] = [
  {
    filename: 'docs/PROJECT_README.md',
    title: 'PROJECT_README.md',
    scope: 'Назначение OMR, три разделённых контура (Ядро / Инструменты / Навык ИИ) и главный принцип Goal-Oriented Verification.',
    keyTakeaways: [
      'OMR — система математического рассуждения, а не графический редактор.',
      'Чёткий поток: Natural Language → Core Model → Tool Adapter → Result → L7 Verification.',
    ],
  },
  {
    filename: 'docs/ARCHITECTURE.md',
    title: 'ARCHITECTURE.md',
    scope: 'Семислойная модель L1–L7, пять фундаментальных понятий и контракты L1 ↔ L2 и L2 ↔ L7.',
    keyTakeaways: [
      'Запрещено сливать состояния в единый монолитный кортеж S = (G, A, X, L, K).',
      'AI Skill никогда не выносит вердикт PASS самостоятельно.',
    ],
  },
  {
    filename: 'docs/RESEARCH_BASE.md',
    title: 'RESEARCH_BASE.md',
    scope: 'Эпистемическая дисциплина: 5 статусов утверждений, запрет подмены доказательств симуляцией или скорингом.',
    keyTakeaways: [
      'Симуляция ≠ доказательство; оптимизационный балл ≠ корректность.',
      'Каждое математическое утверждение сопровождается тестом и контрпримером.',
    ],
  },
  {
    filename: 'docs/SOURCE_REGISTRY.md',
    title: 'SOURCE_REGISTRY.md',
    scope: 'Полный реестр 29 релевантных источников (из 58 в библиотеке) и приоритетный список Top-14.',
    keyTakeaways: [
      'Разделены на 4 группы: симуляторы/датасеты, стенды/верификаторы, PDF-литература, отчёты.',
      'Вспомогательные 29 источников (CLSPB, каталоги диаграмм) выведены за пределы ядра.',
    ],
  },
  {
    filename: 'docs/REUSE_AND_GAP_ANALYSIS.md',
    title: 'REUSE_AND_GAP_ANALYSIS.md',
    scope: 'Фактический аудит архива Origami-Geometry-Core (PCRS), кандидатов из PGS-2D / GIEM / SOL-Triad и ключевых пробелов.',
    keyTakeaways: [
      'Подтверждены reflection.ts и independentVerifier.ts в PCRS для 2D при L ≤ 2.',
      'Зафиксирован разрыв Float64 vs BigInt и отсутствие формализованного L3.',
    ],
  },
  {
    filename: 'docs/TOOL_INTEGRATION_ARCHITECTURE.md',
    title: 'TOOL_INTEGRATION_ARCHITECTURE.md',
    scope: 'Архитектура ToolAdapter для Ori Studio, Oriedita, Rabbit Ear и OrigamiSimulator без домысливания API.',
    keyTakeaways: [
      'Для каждого инструмента явно отделено подтверждённое от требующего проверки.',
      'Любой внешний результат помечается unverified до проверки в L7.',
    ],
  },
  {
    filename: 'docs/REPOSITORY_STRUCTURE.md',
    title: 'REPOSITORY_STRUCTURE.md',
    scope: 'Уточнённая структура репозитория origami-mathematical-reasoning с разделением docs, research, core, layers, verifier, adapters.',
    keyTakeaways: [
      'verifier/ строго изолирован от layers/L2_geometry/.',
      'Выделена папка tests/negative-controls/ для проверки отказа при ошибках генератора.',
    ],
  },
  {
    filename: 'docs/DEVELOPMENT_ROADMAP.md',
    title: 'DEVELOPMENT_ROADMAP.md',
    scope: 'Этапы Phase 1–8 и 8 критериев базовой инженерной зрелости.',
    keyTakeaways: [
      'Приоритет Phase 2 — сквозная связка L2 ↔ L7 для 2D REFLECTION.',
      'Переход к 3D-кинематике заблокирован до стабилизации 2D-прототипа.',
    ],
  },
  {
    filename: 'docs/FIRST_PROTOTYPE_SPEC.md',
    title: 'FIRST_PROTOTYPE_SPEC.md',
    scope: 'Формальная спецификация первого 2D-прототипа: единичный квадрат, FACE_SUBDIVISION и REFLECTION по x + y = 1.',
    keyTakeaways: [
      '5 независимых проверок в L7 и 4 обязательных тест-кейса (T-01 .. T-04).',
      'Явный возврат CAPABILITY_GAP при запросах с 3D-углом или толщиной листа.',
    ],
  },
];

export const REPOSITORY_TREE = `origami-mathematical-reasoning/
├── README.md
├── ARCHITECTURE.md
├── DEVELOPMENT_STATUS.md
├── docs/              (concept · architecture · contracts · tool-integration)
├── sources/           (SOURCE_REGISTRY.md · REUSE_AND_GAP_ANALYSIS.md)
├── research/          (RESEARCH_BASE.md · OPEN_QUESTIONS.md · reports/)
├── core/              (state · transformations · trace · errors)
├── layers/            (L1_topology ... L6_optimization)
├── contracts/         (машинно-проверяемые схемы L1↔L2, L2↔L7)
├── verifier/          (L7: result/ · process/ · tolerances/)
├── adapters/          (common · rabbit-ear · ori-studio · oriedita · origami-simulator)
├── reasoning-skill/   (инструкции и интерфейс агента)
├── datasets/          (ETH 1-DOF · задачи Фудзимото)
├── experiments/       (square_reflection MVP)
├── tests/             (mathematical · negative-controls · integration · regression)
└── roadmap/           (Phase 1–8 gates)`;
