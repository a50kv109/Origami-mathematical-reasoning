# Исследовательский отчёт: Научные и инженерные источники для укрепления L2 ↔ L7 и подготовки к композиции преобразований в Origami Mathematical Reasoning (OMR)

*(Перенесено из исследовательских материалов этапа Stage 1/2 при очистке `public/assets/aistudio/OMR_L2-L7_304cf11c.md`.)*

Настоящий отчёт дополняет внутреннюю базу знаний проекта OMR (**13 внешними научными и инженерными источниками**), распределёнными по восьми открытым задачам проекта: независимости L7, численной устойчивости IEEE-754, инвариантам при частичных преобразованиях, защите `TRACE`, композиции операций, `Construction DAG`, переходу к кинематике и адаптерам к внешним программам.

---

## 🔬 Точная вычислительная геометрия и устойчивость IEEE-754 (4)

| # | Название | Источник / Авторы | Дата |
|---|---------|-------------------|------|
| 1 | [Adaptive Precision Floating-Point Arithmetic and Fast Robust Geometric Predicates](https://people.eecs.berkeley.edu/~jrs/papers/robustr.pdf) | Jonathan Richard Shewchuk (*Discrete & Computational Geometry*) | 1997 |
| 2 | [Indirect predicates for geometric constructions](https://arxiv.org/html/2105.09772v2) | Marco Attene (*arXiv:2105.09772v2*) | 2025 |
| 3 | [Recent Progress in Exact Geometric Computation](https://cs.nyu.edu/exact/doc/dimacs.pdf) | Chen Li, Sylvain Pion, Chee K. Yap (NYU / INRIA) | 2004 |
| 4 | [CGAL 6.2.1 — Number Types & Lazy Exact Evaluation Manual](https://doc.cgal.org/latest/Number_types/index.html) | CGAL Project | 2026 |

**(1) Adaptive Precision Floating-Point Arithmetic (Shewchuk, 1997):** Классическая работа, вводящая неперекрывающиеся разложения чисел с плавающей точкой (*floating-point expansions*) и адаптивные предикаты (`orient2d`, `incircle`), которые сначала оцениваются в обычном IEEE-754 и автоматически доращивают точность лишь вблизи вырожденных случаев. Решает проблему потери знака ориентированной площади и коллинеарности без тотального перехода на медленную длинную арифметику.

**(2) Indirect predicates for geometric constructions (Attene, 2025):** Прямой ответ на проблему **композиции последовательных геометрических операций**. Вместо передачи в следующий шаг округлённых IEEE-754 координат промежуточной точки (пересечения, отражения), промежуточная точка хранится в неявной форме как дробь многочленов $(\lambda_x / d, \lambda_y / d)$ от исходных явных координат, а предикаты вычисляются через 3-ступенчатый каскад: полустатический фильтр FP → динамический фильтр на **интервальной арифметике** → точные FP-разложения.

**(3) Recent Progress in Exact Geometric Computation (Li, Pion, Yap, 2004):** Обзор парадигмы Exact Geometric Computation (EGC), разграничивающей численные фильтры, конструктивные границы нуля (*constructive zero bounds*) и ленивую точную оценку выражений. Показывает, почему геометрические предикаты (комбинаторика и ориентация) должны быть точными, даже если внешние конструкции визуализируются в IEEE-754.

**(4) CGAL Number Types User Manual:** Промышленный эталон выбора числовых типов: чёткое разделение `Exact_predicates_inexact_constructions` (EPICK) и `Exact_predicates_exact_constructions` (EPEC / `Lazy_exact_nt`), где для каждого вычисления строится DAG-история операций с интервальной оценкой и точным пересчётом при попадании нуля в интервал. Для TypeScript-ядра OMR это готовый архитектурный образец для перехода от простого `number` к паре `(interval, exactRationalBigInt)` (аналогично модулю `STL V1` на `BigInt`, уже имеющемуся в экосистеме проектов `a50kv109`).

---

## 🛡️ Независимость верификатора L7 и проверка инвариантов (2)

| # | Название | Источник / Авторы | Дата |
|---|---------|-------------------|------|
| 5 | [Certifying Algorithms](https://people.mpi-inf.mpg.de/~mehlhorn/ftp/CertifyingAlgorithms.pdf) | Ross M. McConnell, Kurt Mehlhorn, Stefan Näher, Pascal Schweitzer (*Computer Science Review*) | 2011 |
| 6 | [A Survey on Metamorphic Testing](https://eprints.whiterose.ac.uk/id/eprint/110335/1/segura16-tse.pdf) | Sergio Segura, Gordon Fraser, Ana B. Sanchez, Antonio Ruiz-Cortés (*IEEE TSE*) | 2016 |

**(5) Certifying Algorithms (Mehlhorn et al., 2011):** Обосновывает фундаментальный способ устранения ошибки общего отказа (*common-mode risk*) между L2 и L7. Вместо дублирования сложного вычислительного алгоритма в проверяющем модуле, генератор (L2) выдаёт вместе с результатом математическое свидетельство (*witness/certificate*), а независимый верификатор (L7) реализует **принципиально более простой чекер** (например, проверку геометрических аксиом: ортогональности вектора смещения $p' - p$ нормали оси, принадлежности середины $(p + p')/2$ прямой, сохранения длин и инверсии знака определителя, а не повторение вычисления отражения той же формулой).

**(6) A Survey on Metamorphic Testing (Segura et al., 2016):** Методология проверки вычислительных систем без полного оракула через **метаморфные отношения** (Metamorphic Relations). Критически полезна для тестирования **композиции и частичных преобразований**: например, повторное отражение $R_L \circ R_L(S) = S$ (инволюция), эквивариантность к глобальному сдвигу/повороту системы координат, неизменность подмножества `fixedVertexIds` и инвариантность относительных углов внутри подвижной грани при её переносе.

---

## 🔗 Защита TRACE, канонизация и Construction DAG (3)

| # | Название | Источник / Авторы | Дата |
|---|---------|-------------------|------|
| 7 | [RFC 8785: JSON Canonicalization Scheme (JCS)](https://www.hjp.at/doc/rfc/rfc8785.pdf) | A. Rundgren, B. Jordan, S. Erdtman (IETF) | 2020 |
| 8 | [Tamper-Evident Audit Logs: Hash Chains, Merkle Trees, and External Anchoring](https://zatona.dev/blog/tamper-evident-audit-logs) | Dmitrii Zatona (Engineering Blog) | 2026 |
| 9 | [The PROV-JSON Serialization (W3C PROV Data Model)](https://www.w3.org/Submission/prov-json/) | Trung Dong Huynh et al. (W3C Member Submission) | 2013 |

**(7) RFC 8785: JSON Canonicalization Scheme (JCS):** Стандарт детерминированной сериализации JSON (сортировка ключей, исключение пробелов, единое представление IEEE-754 чисел по правилам ECMAScript), без которого криптографический хеш состояния `GeometryState` или записи `TRACE` будет расходиться на разных движках/сериализаторах.

**(8) Tamper-Evident Audit Logs (Zatona, 2026):** Практическое руководство по защите `TRACE` от подмены, объединяющее хеш-цепочки ($H_n = \mathrm{SHA\text{-}256}(\text{domain} \parallel H_{n-1} \parallel \text{len} \parallel \text{JCS\_bytes})$), монотонные индексы последовательности (вместо ненадёжных timestamp) и **важное ограничение**: локальная хеш-цепочка без внешней подписи или фиксации чекпоинта защищает от случайной порчи, но её хвост может быть перегенерирован владельцем данных. Для подлинной защиты в L2 ↔ L7 требуется разделение ключа/подписи или независимая фиксация `sourceStateHash` до выполнения операции.

**(9) W3C PROV-JSON Serialization:** Готовая онтология для объединения `TRACE` и `Construction DAG`: разделение сущностей (`entity` — конкретные версии вершин/граней), действий (`activity` — операции `REFLECTION`, `FACE_SUBDIVISION`), отношений порождения (`wasGeneratedBy`), использования (`used`) и вывода (`wasDerivedFrom`). Позволяет строго моделировать зависимости при композиции шагов, когда одни вершины являются производными от пересечений или предыдущих отражений.

---

## 📐 Стандарты оригами, адаптеры и переход к 3D-кинематике (4)

| # | Название | Источник / Авторы | Дата |
|---|---------|-------------------|------|
| 10 | [FOLD: Flexible Origami List Datastructure](https://github.com/edemaine/fold) | Erik Demaine, Jason Ku, Robert Lang (MIT / GitHub) | 2016–2026 |
| 11 | [Geometric Folding Algorithms: Linkages, Origami, Polyhedra](https://gfalop.org/) | Erik D. Demaine, Joseph O'Rourke (Cambridge University Press) | 2007 |
| 12 | [Rigid Foldability is NP-Hard](https://erikdemaine.org/papers/RigidOrigamiHard_JoCG/paper.pdf) | H. Akitaya, E. Demaine, T. Horiyama, T. Hull, J. Ku, T. Tachi | 2016 |
| 13 | [Origamizer: A Practical Algorithm for Folding Any Polyhedron](https://origami.c.u-tokyo.ac.jp/~tachi/cg/DemaineTachiOrigamizerSoCG2017.pdf) | Erik D. Demaine, Tomohiro Tachi (*SoCG 2017*) | 2017 |

**(10) FOLD File Format & API (`edemaine/fold`):** Де-факто отраслевой стандарт обмена данными между внешними программами оригами (Ori Studio, Origami Simulator, Oriedita, Freeform Origami, Rabbit Ear, ORIPA). Включает графовые массивы вершин/рёбер/граней, назначения M/V, частичный порядок слоёв (`faceOrders`) и поддержку многокадровых последовательностей (`frames`). Это естественный целевой формат для будущего адаптера OMR по образцу контракта `PGS-2D`.

**(11) Geometric Folding Algorithms (Demaine & O'Rourke, 2007):** Фундаментальная монография по алгоритмическим основам оригами: изометрические отображения, условия плоской складываемости (Кавасаки, Маекава, локальное и глобальное перекрытие слоёв) и переход к жёстким шарнирным механизмам.

**(12) Rigid Foldability is NP-Hard (Akitaya et al.):** Доказывает алгоритмическую сложность перехода от 2D-геометрии к реальной 3D-кинематике жёстких панелей (и объясняет, почему в OMR L7 обязан проверять траекторию $\gamma(t)$ отдельно от конечного 2D-состояния).

**(13) Origamizer (Demaine & Tachi, 2017):** Практический алгоритм построения водонепроницаемых (*watertight*) 3D-развёрток с сохранением выпуклых граней и использованием «tucking molecules», задающий ориентир для композиции сложных сгибов при переходе к слоям L3–L4.

---

## 🧭 Карта соответствия: ключевые темы по задачам OMR

1. **Проблема L2 ↔ L7 (Common-mode risk):** Принцип **Certifying Algorithms** (проверка простых свидетельств и геометрических аксиом в L7 вместо пересчёта той же формулой) + **Метаморфные отношения** (инволюция, эквивариантность).
2. **Устойчивость IEEE-754 и композиция операций:** **Indirect Predicates** (Attene) + **EGC / Ленивая точная арифметика** (CGAL, Shewchuk) — хранить промежуточные конструкции символически/как дроби полиномов и применять 3-ступенчатый фильтр (FP → интервалы → `BigInt`/разложения).
3. **Защита `TRACE` и `Construction DAG`:** Связка **RFC 8785 (JCS)** + **SHA-256 хеш-цепочка с раздельными доменами и монотонным счётчиком** (Zatona) + графовая модель **W3C PROV-JSON**.
4. **Адаптеры и кинематика:** **FOLD** как канонический транспортный формат поверх графа L1–L3 и теоретические границы жёсткой кинематики из **Demaine & O'Rourke / Akitaya et al.**

---

*Исследование выполнено 15 ноября 2026 г.*
