# Changelog

Все значимые изменения проекта **Origami Mathematical Reasoning (OMR)** фиксируются в этом файле.  
Формат основан на [Keep a Changelog](https://keepachangelog.com/ru/1.1.0/), версионирование следует [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Documentation
- Выполнена консолидация документации `OMR Architecture Evolution Package v1.0` без изменения исходного кода, тестов, `Contract 02`, `Property F` и слоёв `L1–L7`: добавлены `OMR_DOCUMENTATION_INVENTORY.md`, `PROJECT_ARCHITECTURE_STATUS.md`, `OMR_ARCHITECTURE_EVOLUTION.md`, `OMR_ARCHITECTURE_MAP.md`, `OMR_ARCHITECTURE_DECISION_RECORD.md`, `OMR_RESEARCH_REGISTER.md`, `OMR_ARCHITECTURE_OPEN_QUESTIONS.md`, `OMR_DOCUMENTATION_CONSOLIDATION_REPORT.md`.
- Зафиксирован исследовательский трек **`OMR — Integrated Engineering Reasoning Architecture`**, связывающий `OMR L1–L7`, `CRP-01 / MCAR` и `PWRP v1.1` с сохранением разделения реализованных, документированных, предложенных и нерешённых положений.

## [0.1.0] - 2026-11-15

Первый зафиксированный инженерный релиз: **Verified 2D Reflection Prototype (Phase 2.1)**.

### Added
- Типизированные структуры контракта `Contract 02 v2` (`src/core/types.ts`): `GeometryState`, `LineNormalParams`, `ReflectionWitness`, `TraceEntry`, `VerificationClaim`, `VerificationVerdict`, `VerifierTolerances`.
- Детерминированный вычислитель 2D-отражений `L2` (`src/core/l2GeometryEngine.ts`): `createInitialGeometryState`, `reflectAcrossLine` по формуле ортогональной проекции в IEEE-754 без `.toFixed()`, частичное отражение по `movingVertexIds`, выпуск `ReflectionWitness` и `L2EngineError`.
- Иммутабельный журнал переходов `TRACE` (`src/core/trace.ts`): `deepFreeze`, `cloneGeometryState`, `cloneReflectionWitness`, `createTraceEntry`, `appendTraceEntry`.
- Независимый аксиоматический верификатор `L7` (`src/core/l7IndependentVerifier.ts`): `verifyResult`, `verifyProcess`, 4-этапная Zero-Trust проверка (`r_mid`, `r_perp`, scope-aware длины/площадь/ориентация) с нулевым рантайм-импортом из `L2` и `TRACE`.
- Автоматический набор тестов `tests/contract02.test.ts`: 13 сценариев (позитивные, негативные контроли, инвариантность к масштабу, частичное отражение, вырожденные входы, разрывы `TRACE`, глубокая заморозка и статическая изоляция `L7`).
- Интерактивный веб-стенд `src/components/VerificationWorkbench.tsx` и паспорт проекта `src/App.tsx`.
- Корневая документация и лицензирование: `README.md`, `LICENSE` (`Apache-2.0`), `CHANGELOG.md`, `CONTRIBUTING.md`, `RELEASE_NOTES.md`, а также пакет документации `docs/`.
- Воспроизводимый `package-lock.json` для `npm ci`.

### Changed
- Выровнены метаданные проекта (`package.json` → `origami-mathematical-reasoning@0.1.0`, `Apache-2.0`; `metadata.json` → `Origami Mathematical Reasoning (OMR)`).
- Актуализированы документы `docs/` и интерфейс паспорта (`index.html`, `src/App.tsx`, `src/data/passportData.ts`) в соответствии с фактическим кодом Phase 2.1.
- Перенесены уникальные исследовательские материалы из ранних заметок AI Studio в `docs/RESEARCH_L2_L7_SOURCES.md` и `docs/MODULAR_MATHEMATICAL_IDENTITY.md`.

### Removed
- Удалён каталог `public/assets/aistudio/` (~88 MB сторонних zip-архивов `ori-studio` и `Origami-Geometry-Core`, сырых промптов `.txt` и дубликатов `.md`).
- Удалены 7 неиспользуемых пакетов из `package.json` (`@google/genai`, `express`, `dotenv`, `motion`, `@types/express`, `autoprefixer`, `esbuild`) и ложные требования `GEMINI_API_KEY` из `.env.example` / `metadata.json`.
