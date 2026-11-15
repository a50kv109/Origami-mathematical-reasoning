# Source Registry — Каталог источников (29 релевантных из 58)

Из 58 источников библиотеки блокнота выделены **29 непосредственно полезных** источников для разработки ядра **OMR (L1–L7)**. Оставшиеся 29 источников относятся к лингвистической оценке (`CLSPB_*`, `AAM-Language-*`), извлечению документов или каталогам диаграмм и отнесены во вспомогательный фонд.

---

## I. Вычислительное оригами, симуляторы и датасеты (L1–L6)

| # | Источник | Автор / Год | Слои | Роль в OMR | Ссылка |
| :-: | :--- | :--- | :--- | :--- | :--- |
| 1 | **Ori Studio** | Zachary Marion (`zacharyfmarion`), 2026 (`0.9.0`) | L1–L4, L6 | Ориентир архитектуры крейтов (`oristudio-cp`, `oristudio-fold`, `oristudio-layer-order`, `oristudio-geometry`) и 3D-проверки вершин | `github.com/zacharyfmarion/ori-studio` |
| 2 | **OrigamiSimulator** | Amanda Ghassaei и соавт., 2020–2026 | L4, L5 | Референс непрерывной 3D GPU-симуляции и Ruling-aware Triangulation криволинейных складок | `github.com/amandaghassaei/OrigamiSimulator` |
| 3 | **Oriedita** | Сообщество Oriedita (`v1.1.3`), 2026 | L1, L2, L7 | Алгоритмы `.ori`/`.cp`/`.fold` и проверка локальной плоской складываемости (`FoldLineSet`) | `github.com/oriedita/oriedita` |
| 4 | **TreeMaker 5.1.2** | R. Lang, V. Vishvanath, 2026 | L2, L6 | Синтез crease patterns из 1D-дерева (circle/river packing) — ориентир для L6 | `github.com/vishvish/treemaker` |
| 5 | **Rabbit Ear** | Организация Rabbit Ear (`robbykraft`), 2025–2026 | L1, L2, L7 | JS/TS-библиотека графового формата FOLD и валидатор `fold-validator` | `github.com/rabbit-ear` |
| 6 | **Origami Crease Pattern Dataset** | N. Hochuli, T. Stankovic (ETH Zurich), 2025 | L1, L4, L6, L7 | 8 млн жёстко складываемых 1-DOF развёрток (до 23 вершин) для бенчмарков | `doi.org/10.3929/ethz-b-000743348` |
| 7 | **Awesome-origami** | G. Oolbekkink, M.-T. Tsai, A. Karnik, 2025–2026 | L2, L3, L6 | Указатель солверов (`Flat-Folder` для L3, `ReferenceFinder`, `BP Studio`) | `github.com/oriedita/awesome-origami` |

## II. Исследовательские стенды, математические ядра и верификаторы

| # | Источник | Автор / Год | Слои | Роль в OMR |
| :-: | :--- | :--- | :--- | :--- |
| 8 | **Origami-Geometry-Core / PCRS** | А. А. Арцыбашев (`a50kv109`), 2026 | L1, L2, L7 | База `pcrs-theory`: замороженное 2D-ядро `reflection.ts` и `independentVerifier.ts` |
| 9 | **Geometry-Reasoning-Core** | А. А. Арцыбашев (`a50kv109`), 2026 | L1, L2, L7 | TypeScript-разделение `src/core/` и изолированного `independentVerifier.ts` |
| 10 | **AI Geometry Skill (`-ai-geometry-skill-2`)** | А. А. Арцыбашев (`a50kv109`), 2026 | L2, L6, L7 | `HeadlessGeometrySession`, аналитические пересечения (`rootIndex`), `GIEM v0.1` (`BigInt`), `FourierV2` |
| 11 | **Portable-Geometric-State-2D (PGS-2D)** | А. А. Арцыбашев (`a50kv109`), 2026 | L1, L2, L7 | Контракт `Polygon(n)`, `portableId != localId`, Construction DAG, адаптер Blender |
| 12 | **3D-Geometry-Reasoning-Stand / v2** | А. А. Арцыбашев (`a50kv109`), 2026 | L1, L2, L4, L7 | Каноническое 3D-состояние, сферические конусы вершин (LSM/LVG), переходы `t₁ > t₀` |
| 13 | **Fedorov-Symmetry-Stand-V2** | А. А. Арцыбашев (`a50kv109`), 2026 | L1, L2, L7 | Рациональные матрицы `BigInt` (`STL V1`), проверка хиральности, Gatekeeper `GK-01..09` |
| 14 | **SOL-Triad-Engine / v2** | А. А. Арцыбашев (`a50kv109`), 2026 | L7 | Шаблон `Process Verification` по триаде `SOURCE — CONSTRAINT — DISSIPATE` |
| 15 | **Fe3uni-Harmonic-Analytics-v3.0** | А. А. Арцыбашев (`a50kv109`), 2026 | L6 | Эвристики `SoftThresholdPenalty`, `1DStateMatcher`, `SystemHealthIndex` |
| 16 | **dpco-v3 / dpco-skill** | А. А. Арцыбашев (`a50kv109`), 2026 | L2, L7 | Оркестратор `Admission → Executor → IndependentVerifier → Ledger` |
| 17 | **Quadrilateral-in-circle-stand** | А. А. Арцыбашев (`a50kv109`), 2026 | L1, L2, L7 | Изоляция `GeometryCore`, `TopologyGuard`, `CheckpointBuffer` («Agent may be wrong. The stand must not») |
| 18 | **vsam / belov-fiber-sdk** | А. А. Арцыбашев (`a50kv109`), 2026 | L7 | Воспроизводимость: подписанные `Passport` и `Trace`, хеш-цепочки и `Log Replay` |

## III. Математические учебники и литература по оригами (PDF)

| # | Источник | Автор / Год | Слои | Роль в OMR |
| :-: | :--- | :--- | :--- | :--- |
| 19 | `Modenov-Problems-In-Geometry-Mir-1981.pdf` | П. С. Моденов, 1981 | L2 | Векторная алгебра 2D/3D, изометрии, ортогональные проекции, определители Грама |
| 20 | `ikgraf.pdf` | В. Є. Михайленко и др., 2000 | L2, L5 | Развёртки многогранников, линейчатые и криволинейные поверхности |
| 21 | `Twist Origami 1.pdf` | Сюдзо Фудзимото, 1978 | L1, L2 | Построения многоугольников, деление отрезков на `n` частей, twist-тесселяции |
| 22 | `Twist Origami 3.pdf` | Сюдзо Фудзимото, 2007 | L1, L2, L4 | Замкнутые многогранники, каркасные структуры и 3D-замыкания |
| 23 | `Solid Origami.pdf` | С. Фудзимото, Н. Фудзимура, 1976 | L1, L2, L7 | Объёмные решётки, аналитическая формула деления `√((n-m)/(n+m))` |
| 24 | `GEOMETRY EDUCATIONAL KERNEL HANDOFF.pdf` | Внутренняя спецификация (`v1.0`), 2026 | L2, L7 | Паттерн `DISCOVER → CHECK → SELECT → EXECUTE → TRACE` для Google AI Studio |

## IV. Архитектурные спецификации и отчёты проекта

| # | Источник | Слои | Роль в OMR |
| :-: | :--- | :--- | :--- |
| 25 | Базовый пакет (`ARCHITECTURE.md`, `PROJECT_README.md`, `DEVELOPMENT_ROADMAP.md`, `MODULAR_MATHEMATICAL_IDENTITY.md`, `RESEARCH_L2_L7_SOURCES.md`) | L1–L7 | Каноническая спецификация архитектуры, модульной идентичности и дорожной карты Phase 1–8 |
| 26 | `Анализ оригами оптимизации` (`RESEARCH REPORT 02–04`) | L1–L7 | Обоснование отказа от монолитного состояния в пользу L1–L7 и непрерывных траекторий `γ(t)` |
| 27 | `Анализ модели оригами` | L1–L3, L6, L7 | Эталон 2D-отражения в однородных координатах, интерфейс `L2 → L3`, аудит `Fe3uni` |
| 28 | `Самоаудит контекста и архитектурных решений` | L1, L2, L4, L7 | Эксперимент `PAT-30`, протокол `REASON OUTSIDE. VERIFY INSIDE`, тесты простых моделей |
| 29 | `Ori Studio Multilingual Origami Research` | L1–L3 | Разделение физического действия и структурного сдвига слоёв (`Reverse`, `Squash`, `Rabbit Ear`, `Sink`) |

---

## Происхождение и лицензии архивированных внешних материалов (не включаются в поставку OMR)

Два крупных сторонних снимка, использовавшихся на этапе исследования и аудита, исключены из публикуемого репозитория OMR и сохранены только в виде ссылок, версий, лицензий и итогов аудита:

- **Ori Studio (`zacharyfmarion/ori-studio`, версия workspace `0.9.0`):**
  - Репозиторий: `https://github.com/zacharyfmarion/ori-studio`
  - Лицензирование: корневой Rust workspace лицензирован под **`GPL-2.0-or-later`** (производная работа от TreeMaker 5.0.1 и ReferenceFinder; см. `LICENSING.md` апстрима), при этом отдельные независимые крейты (включая `oristudio-geometry`, `oristudio-layer-order`, `oristudio-fold`) имеют `MIT OR Apache-2.0`.
  - Результаты аудитов OMR: `ORI_STUDIO_INITIAL_AUDIT.md`, `ORI_STUDIO_GEOMETRY_ENGINE_REPORT.md`.
- **Origami-Geometry-Core / PCRS (`a50kv109/Origami-Geometry-Core`, снимок 2026 г.):**
  - Репозиторий: `https://github.com/a50kv109/Origami-Geometry-Core`
  - Лицензирование: **`MIT License`** (`Copyright (c) 2026 PCRS Theory Lab`; вложенные экспериментальные подпроекты `geometry-reasoning-core` и `skilla` также под `MIT License`).
  - Результаты аудита переиспользования: `docs/REUSE_AND_GAP_ANALYSIS.md`.

---

## Top-14 приоритетных источников для разработки ядра

1. Базовый пакет (`ARCHITECTURE.md`, `MODULAR_MATHEMATICAL_IDENTITY.md`, `RESEARCH_L2_L7_SOURCES.md` и сопутствующие `.md`).
2. `GEOMETRY EDUCATIONAL KERNEL HANDOFF.pdf`.
3. `Анализ оригами оптимизации`.
4. `Анализ модели оригами`.
5. `Origami-Geometry-Core` / `PCRS`.
6. `Geometry-Reasoning-Core`.
7. `AI Geometry Skill (-ai-geometry-skill-2)`.
8. `Portable-Geometric-State-2D (PGS-2D)`.
9. `geometry-reasoning-stand-3d-v2`.
10. `SOL-Triad-Engine-v2`.
11. `Fe3uni-Harmonic-Analytics-v3.0`.
12. `zacharyfmarion/ori-studio`.
13. `amandaghassaei/OrigamiSimulator`.
14. `Origami Crease Pattern Dataset` (+ `oriedita` и `Modenov` для 2D-плоской складываемости).
