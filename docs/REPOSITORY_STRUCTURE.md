# Repository Structure — Структура репозитория `origami-mathematical-reasoning`

Уточнённая модульная структура накопительного исследовательско-инженерного репозитория, исключающая смешивание концепций, спецификаций, вычислительного кода, тестов и результатов экспериментов.

---

## Дерево каталогов

```text
origami-mathematical-reasoning/
├── README.md                          # Навигатор проекта и статус зрелости
├── ARCHITECTURE.md                    # Сводная архитектура L1–L7 и границы контуров
├── DEVELOPMENT_STATUS.md              # Актуальная карта зрелости (не процент кода)
│
├── docs/                              # Зафиксированные спецификации и аудиты
│   ├── concept/                       # Идеология, Goal-Oriented Verification, Modular Identity
│   ├── architecture/                  # Модели STATE, TRANSFORMATION, TRACE, Verification
│   ├── contracts/                     # Формальные контракты (CONTRACT_01_L1_L2, CONTRACT_02_L2_L7)
│   └── tool-integration/              # Архитектура адаптеров внешних программ
│
├── sources/                           # Реестр источников (29/58) и аудиты заимствований
│   ├── SOURCE_REGISTRY.md             # Полный каталог литературы, стендов и симуляторов
│   ├── REUSE_AND_GAP_ANALYSIS.md      # Аудит PCRS, PGS-2D, GIEM, Fedorov, SOL-Triad
│   └── bibliometrics/                 # Ссылки на PDF и DOI датасетов
│
├── research/                          # Математические исследования и открытые вопросы
│   ├── RESEARCH_BASE.md               # Дисциплина доказательств и допуски
│   ├── OPEN_QUESTIONS.md              # Float64 vs BigInt, коллизии γ(t), порядок слоёв L3
│   └── reports/                       # Research Report 01–04, заметки по PAT-30
│
├── core/                              # Независимые от слоя базовые примитивы
│   ├── state/                         # Типизированное CanonicalGeometryState (Object.freeze)
│   ├── transformations/               # Базовые интерфейсы TRANSFORMATION и предусловия
│   ├── trace/                         # Схема журнала TRACE и сериализация переходов
│   └── errors/                        # Семантические коды (CAPABILITY_GAP, INVALID_INPUT)
│
├── layers/                            # Изолированные вычислительные уровни (L1–L7)
│   ├── L1_topology/                   # Графы смежности, VertexID/EdgeID/FaceID, FACE_SUBDIVISION
│   ├── L2_geometry/                   # Евклидова геометрия, REFLECTION, BIND_GEOMETRY
│   ├── L3_layer_order/                # [CONCEPT] Разрешение Z-порядка перекрытий
│   ├── L4_kinematics/                 # [CONCEPT] Непрерывные траектории γ(t)
│   ├── L5_curved_folding/             # [RESEARCH] Криволинейные складки
│   └── L6_optimization/               # [RESEARCH] Эвристический поиск и ранжирование
│
├── contracts/                         # Машинно-проверяемые JSON/TS схемы контрактов Lᵢ ↔ Lⱼ
│
├── verifier/                          # L7 — Изолированный Zero-Trust верификатор (без общих утилит с L2!)
│   ├── result/                        # Result Verification (инварианты конечного состояния)
│   ├── process/                       # Process Verification (проверка переходов TRACE)
│   └── tolerances/                    # Калиброванные границы допусков (L ≤ 2 и т.д.)
│
├── adapters/                          # Tool Integration Layer (без предположений о несуществующих API)
│   ├── common/                        # Единый контракт ToolAdapter и FOLD-маппинг
│   ├── rabbit-ear/                    # Планируемый адаптер FOLD / fold-validator
│   ├── ori-studio/                    # Исследование WASM/Rust-интерфейса
│   ├── oriedita/                      # Исследование CLI/экспорта .ori/.cp
│   └── origami-simulator/             # Исследование headless-выгрузки 3D
│
├── reasoning-skill/                   # Интерфейс и правила работы AI-агента (без права выносить PASS)
│
├── datasets/                          # Эталонные тесты (выборки ETH Crease Pattern, задачи Фудзимото)
├── experiments/                       # Воспроизводимые протоколы (вкл. square_reflection MVP)
├── tests/                             # Автоматические наборы проверок
│   ├── mathematical/                  # Инварианты и аналитические тождества
│   ├── negative-controls/             # Намеренные ошибки генератора (проверка обнаружения FAIL)
│   ├── integration/                   # Тесты контрактов L1 ↔ L2 и L2 ↔ L7
│   └── regression/                    # Регрессионные сценарии (перенос из PCRS seq001–003)
│
└── roadmap/                           # Планы фаз и критерии перехода между этапами
```

---

## Ключевые правила структуры

1. **`verifier/` изолирован от `layers/L2_geometry/`:** верификатор реализует собственные метрики (площадь по Гауссу, расстояния, проверку оси) во избежание общих багов с генератором.
2. **`research/` и `docs/` отделены от `core/` и `layers/`:** гипотезы и открытые вопросы не смешиваются с работающим кодом.
3. **`tests/negative-controls/` обязательны:** каждый новый оператор принимается только при наличии теста, в котором искусственно искажённый вывод генератора гарантированно получает вердикт `FAIL`.
