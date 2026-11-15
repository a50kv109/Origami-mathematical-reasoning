# Repository Structure — Структура репозитория `Origami-mathematical-reasoning`

В этом документе чётко разделены **фактическая структура релиза `v0.1.0`** и **целевая модульная структура** для последующих фаз развития (`Phase 3+`).

---

## 1. Фактическая структура репозитория (`v0.1.0`)

```text
Origami-mathematical-reasoning/
├── README.md                              # Корневой обзор OMR v0.1.0, команды и границы релиза
├── LICENSE                                # Apache License 2.0
├── CHANGELOG.md                           # История изменений по версиям (Keep a Changelog)
├── CONTRIBUTING.md                        # Правила изоляции L7, лицензирования и тестирования
├── RELEASE_NOTES.md                       # Состав и ограничения релиза v0.1.0
├── package.json                           # Пакет origami-mathematical-reasoning@0.1.0 (private: true)
├── package-lock.json                      # Воспроизводимый lock-файл для npm ci
├── tsconfig.json                          # Конфигурация TypeScript
├── vite.config.ts                         # Конфигурация Vite + React + Tailwind v4
├── index.html                             # HTML-точка входа веб-стенда OMR v0.1.0
├── metadata.json                          # Метаданные проекта (Origami Mathematical Reasoning (OMR))
├── .env.example                           # Зафиксировано отсутствие обязательных API-ключей
├── .gitignore
│
├── src/
│   ├── core/                              # Математическое ядро Phase 2.1 (SPDX: Apache-2.0)
│   │   ├── types.ts                       # Чистые типы Contract 02 v2 (без рантайм-кода)
│   │   ├── trace.ts                       # Иммутабельный журнал TRACE и deepFreeze
│   │   ├── l2GeometryEngine.ts            # L2: 2D-отражение + выпуск ReflectionWitness
│   │   └── l7IndependentVerifier.ts       # L7: изолированный аксиоматический верификатор (r_mid, r_perp)
│   ├── components/
│   │   └── VerificationWorkbench.tsx      # Интерактивный стенд L2 → ReflectionWitness → TRACE → L7
│   ├── data/
│   │   └── passportData.ts                # Структурированные данные паспорта архитектуры и реестра
│   ├── App.tsx                            # Корневой интерфейс паспорта OMR и стенда
│   ├── main.tsx                           # Точка монтирования React
│   └── index.css                          # Глобальные стили Tailwind CSS v4
│
├── tests/
│   └── contract02.test.ts                 # 13 автотестов Contract 02 v2 (node:test + tsx)
│
├── docs/                                  # Актуальная проектная и исследовательская документация
│   ├── PROJECT_README.md
│   ├── ARCHITECTURE.md
│   ├── FIRST_PROTOTYPE_SPEC.md
│   ├── DEVELOPMENT_ROADMAP.md
│   ├── REPOSITORY_STRUCTURE.md
│   ├── TOOL_INTEGRATION_ARCHITECTURE.md
│   ├── RESEARCH_BASE.md
│   ├── SOURCE_REGISTRY.md
│   ├── REUSE_AND_GAP_ANALYSIS.md
│   ├── RESEARCH_L2_L7_SOURCES.md
│   └── MODULAR_MATHEMATICAL_IDENTITY.md
│
└── [Исторические отчёты и аудиты в корне]
    ├── PHASE_2_1_IMPLEMENTATION_REPORT.md # Реализация Phase 2.1 (актуальная основа кода v0.1.0)
    ├── RESEARCH_INTEGRATION_V1.md         # Отчёт об интеграции исследовательской базы
    ├── ORI_STUDIO_INITIAL_AUDIT.md        # Stage 1 аудит внешнего репозитория Ori Studio
    ├── ORI_STUDIO_GEOMETRY_ENGINE_REPORT.md # Stage 2 аудит крейта oristudio-geometry
    ├── RELEASE_READINESS_AUDIT_V1.md      # Аудит готовности к релизу v0.1.0
    ├── RELEASE_PREPARATION_TASK_A_REPORT.md # Отчёт по Task A (очистка и воспроизводимость)
    ├── RELEASE_PREPARATION_TASK_B_REPORT.md # Отчёт по Task B (документация и идентичность)
    ├── ACCEPTANCE_AUDIT_V1.md             # [SUPERSEDED] Аудит раннего прототипа до Phase 2.1
    └── PHASE_2_IMPLEMENTATION_REPORT.md   # [SUPERSEDED] Отчёт о 3×3 матрице, заменённой в Phase 2.1
```

---

## 2. Целевая архитектура модулей (запланировано на `Phase 3+`, не создано в `v0.1.0`)

По мере добавления слоёв `L1`, `L3–L6`, адаптеров внешних программ и `AI Skill` код из `src/core/` будет масштабироваться с сохранением следующих границ:

- **`layers/`** (`L1_topology/`, `L2_geometry/`, `L3_layer_order/`, `L4_kinematics/`, `L5_curved_folding/`, `L6_optimization/`) — изолированные вычислительные уровни, взаимодействующие только через типизированные контракты.
- **`contracts/`** — формальные схемы межмодульных контрактов (`Contract 01 L1↔L2`, `Contract 02 L2↔L7` и далее).
- **`verifier/`** (`L7`) — верификатор остаётся **строго изолированным от `L2` и прочих генераторов** (собственная реализация метрик, запрет общих решателей).
- **`adapters/`** (`common/`, `ori-studio/`, `oriedita/`, `rabbit-ear/`, `origami-simulator/`) — слой `Tool Integration Layer`, все внешние ответы которого проходят Zero-Trust проверку в `L7`.
- **`reasoning-skill/`** — переносимые инструкции и интерфейс ИИ-агента.
- **`tests/`** — обязательное наличие негативных контролей (`FAIL` при намеренных ошибках генератора) для каждого нового оператора.
