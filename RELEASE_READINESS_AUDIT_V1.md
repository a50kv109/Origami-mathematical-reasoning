# RELEASE_READINESS_AUDIT_V1.md — Аудит готовности репозитория OMR к релизу `v0.1.0`

**Дата аудита:** 2026-11-15  
**Объект аудита:** фактическое состояние рабочего пространства (`/app/applet`) — исходный код (`src/`, `tests/`), конфигурация сборки, документация (`docs/`, `*.md`), ассеты (`public/assets/aistudio/`).  
**Целевой релиз:** **OMR `v0.1.0` — Verified 2D Reflection Prototype**.  
**Ограничения этапа:** аудит выполнен строго в режиме чтения и диагностических проверок без изменения исходного кода, удаления файлов, установки зависимостей или перехода к Phase 2.2.

---

## Краткое резюме фактического состояния

Математическое ядро **Phase 2.1** (`L2 ↔ L7` для `REFLECTION_ACROSS_LINE` с `ReflectionWitness`, иммутабельным `TRACE` и аксиоматическим верификатором L7) **реализовано в `src/core/` и проходит все 13 автотестов (`npm test`) и проверку типов (`tsc --noEmit`)**. Однако сам репозиторий с точки зрения релизной инженерии, упаковки, документации и лицензионной чистоты содержит **критические блокеры (P0)** и в текущем виде не может быть опубликован на GitHub под тегом `v0.1.0`.

---

## 1. Проверка структуры репозитория

### 1.1. Фактическая инвентаризация дерева файлов

| Категория | Фактические пути | Объём / состав | Статус |
|---|---|---|---|
| **Математическое ядро (L2, L7, TRACE)** | `src/core/types.ts`, `src/core/trace.ts`, `src/core/l2GeometryEngine.ts`, `src/core/l7IndependentVerifier.ts` | 4 файла (в составе `src/`, всего `165 KB`) | Реализовано (Phase 2.1) |
| **Веб-демо и паспорт проекта** | `src/components/VerificationWorkbench.tsx`, `src/App.tsx`, `src/data/passportData.ts`, `src/main.tsx`, `src/index.css`, `index.html` | Рабочее React/Vite-приложение | Смешение Phase 2.1 (`VerificationWorkbench`) и текстов Stage 1 (`App.tsx`, `passportData.ts`) |
| **Автоматические тесты** | `tests/contract02.test.ts` | 1 файл (`23 KB`), 13 тестов на `node:test` + `tsx` | Реализовано, 13/13 PASS |
| **Проектная документация** | `docs/*.md` (9 файлов) | `57 KB` | Заморожена на Stage 1, отстала от кода Phase 2.1 |
| **Исторические отчёты и аудиты в корне** | `ACCEPTANCE_AUDIT_V1.md`, `PHASE_2_IMPLEMENTATION_REPORT.md`, `PHASE_2_1_IMPLEMENTATION_REPORT.md`, `RESEARCH_INTEGRATION_V1.md`, `ORI_STUDIO_INITIAL_AUDIT.md`, `ORI_STUDIO_GEOMETRY_ENGINE_REPORT.md` | 6 файлов в `/` | Рабочие отчёты сессий; часть устарела |
| **Ассеты Google AI Studio и сторонние архивы** | `public/assets/aistudio/` (9 файлов) | **87 MB** (2 zip-архива + 5 `.md` + 2 `.txt`) | **Блокер публикации и сборки** |
| **Конфигурация и окружение** | `package.json`, `bun.lock`, `tsconfig.json`, `vite.config.ts`, `.gitignore`, `.env.example`, `metadata.json` | Шаблон AI Studio + `tsx` | Требует очистки и `package-lock.json` |

### 1.2. Выявленные структурные проблемы

1. **Архивы сторонних проектов и временные файлы AI Studio (`public/assets/aistudio/`, 87 MB):**
   - `ori-studio-main__1__a9d35997.zip` (**53 MB**) — полный снимок репозитория `zacharyfmarion/ori-studio`.
   - `Origami-Geometry-Core-main_1194e531.zip` (**34 MB**) — полный снимок репозитория `PCRS Theory Lab` (включая вложенные `.aistudio/`, `geometry-reasoning-core/`, `skilla/`).
   - `gemini-code-1794739038676_e4874875.txt` (`8.6 KB`) и `gemini-code-1794739884357_8d3dffae.txt` (`6.5 KB`) — сырые текстовые постановки промптов для Gemini.
   - `OMR_L2-L7_304cf11c.md` (`15 KB`), `core_architecture_59238165.md`, `development_status_767d826b.md`, `modular_mathematical_identity_93d25c96.md`, `project_readme_a7536518.md` — исходные входные файлы с хэшированными именами AI Studio.
   - **Критическое следствие для сборки:** по умолчанию Vite (`publicDir: 'public'`) копирует содержимое `public/` в `dist/`. Тестовая сборка `vite build` дала `dist/` размером **87 MB** (при размере собственного JS/CSS бандла всего ~577 KB!).
2. **Дублирующиеся и устаревшие документы:**
   - Файлы `core_architecture_59238165.md`, `development_status_767d826b.md`, `modular_mathematical_identity_93d25c96.md`, `project_readme_a7536518.md` в `public/assets/aistudio/` дублируют и предшествуют документам в `docs/`.
   - В корне лежат два последовательно перекрытых отчёта: `ACCEPTANCE_AUDIT_V1.md` (аудит старого кода Stage 1 до Phase 2, описывающий уже удалённую функцию `reflectAcrossDiag` и `.toFixed(4)`) и `PHASE_2_IMPLEMENTATION_REPORT.md` (отчёт об удалённой 3×3 матрице `H` в L7, которую заменили аксиомами в Phase 2.1). Без явного переноса в `docs/archive/` или пометки `SUPERSEDED` они вводят читателя в заблуждение.
   - В `PHASE_2_1_IMPLEMENTATION_REPORT.md` указано «10 сценариев + проверки» и приведён лог 13 тестов, однако нигде нет актуального единого документа статуса `DEVELOPMENT_STATUS.md`.
3. **Неиспользуемые компоненты и зависимости:**
   - Прямой аудит `import` в `src/`, `tests/` и `vite.config.ts` показал, что реально используются только: `react`, `react-dom`, `lucide-react`, `tailwindcss`, `@tailwindcss/vite`, `@vitejs/plugin-react`, `vite`, `typescript`, `tsx`, `@types/node`, `@types/react`, `@types/react-dom`.
   - **Не используются ни в одном файле проекта:** `@google/genai`, `express`, `dotenv`, `motion`, `@types/express`, `autoprefixer`, `esbuild` (Tailwind v4 работает через `@tailwindcss/vite`, а `tsx` поставляется со своим вложенным `esbuild`).
   - `metadata.json` содержит шаблон AI Studio (`"name": "Remix Origami Geometry Core"`, `"majorCapabilities": ["MAJOR_CAPABILITY_SERVER_SIDE_GEMINI_API"]`), хотя серверного кода и вызовов Gemini API в приложении нет.
4. **Недостающие файлы для публичного GitHub-репозитория:**
   - **Корневой `README.md` полностью отсутствует** (в `/` нет даже заготовки AI Studio; есть только устаревший `docs/PROJECT_README.md`).
   - **`LICENSE`** (и `NOTICE`) в корне отсутствуют, несмотря на `SPDX-License-Identifier: Apache-2.0` в `src/core/*.ts` и `src/App.tsx`.
   - **`package-lock.json`** отсутствует (есть только `bun.lock`).
   - Отсутствуют `CHANGELOG.md`, `CONTRIBUTING.md`, `RELEASE_NOTES.md`, `DEVELOPMENT_STATUS.md`, а также CI-конфигурация (`.github/workflows/`).
5. **Несоответствия между документацией (`docs/`, UI) и фактическим кодом (`src/`, `tests/`):**
   - `docs/PROJECT_README.md`, `docs/ARCHITECTURE.md`, `docs/DEVELOPMENT_ROADMAP.md` утверждают, что проект находится на стадии Stage 1, а `Contract 02`, `L2` и `L7` ещё только планируются.
   - `docs/ARCHITECTURE.md` описывает параметры оси как `(point, direction)`, тогда как код реализует `LineNormalParams { nx, ny, c }` (`nx*x + ny*y = c`).
   - `docs/FIRST_PROTOTYPE_SPEC.md` содержит сразу **четыре прямых расхождения с кодом Phase 2.1**:
     1. Описывает `R = 2uu^T - I` и `FACE_SUBDIVISION` (в коде реализована нормальная проекция `p - 2((n·p - c)/(n·n))n`, а `FACE_SUBDIVISION` отсутствует — квадрат задаётся сразу подразделённым).
     2. Указывает допуски `ε_axis = 1e-9` и `ε_area = 1e-9`, тогда как `DEFAULT_VERIFIER_TOLERANCES` задаёт `epsilon: 1e-7`, `areaEpsilon: 1e-7`, `zeroNormalEpsilon: 1e-12`, `degenerateAreaEpsilon: 1e-12`.
     3. Утверждает, что L7 выполняет «пересчёт `p'_expected`», тогда как в Phase 2.1 L7 принципиально отказался от решателя в пользу аксиом `r_mid`, `r_perp` над `ReflectionWitness`.
     4. Описывает `T-04` как граничный контроль `CAPABILITY_GAP` (3D-угол / толщина), но в коде **`CAPABILITY_GAP` не реализован вообще** (вердикты только `PASS | FAIL | UNDETERMINED`), а кнопка `T-04` в `VerificationWorkbench.tsx` демонстрирует разрыв `TRACE`.
   - `docs/REPOSITORY_STRUCTURE.md` и `REPOSITORY_TREE` в `src/data/passportData.ts` описывают целевые папки `core/`, `layers/`, `contracts/`, `verifier/`, `adapters/`, `tests/negative-controls/`, которых фактически нет (код расположен в `src/core/` и `tests/contract02.test.ts`).
   - `src/App.tsx` и `src/data/passportData.ts` по-прежнему содержат тексты `Stage 1 Initiation`, `Stage 1 Audit & Design`, ссылки на «неинтегрированный архив PCRS» и только 3 отмеченных критерия зрелости из 8.

---

## 2. Проверка технической воспроизводимости

Фактическая проверка в текущей среде (`Node v22.23.2`, `npm 10.9.8`, установленные `node_modules`):

| Проверка | Команда | Фактический результат | Замечания для чистого клона GitHub |
|---|---|---|---|
| **Тесты** | `npm test` (`tsx --test tests/*.test.ts`) | **PASS (13/13 за ~402 ms)** | Работает при наличии `tsx` и Node ≥ 20/22. |
| **Проверка типов** | `npm run lint` (`tsc --noEmit`) | **PASS (0 ошибок)** | См. риск по `tsconfig.json` и `typescript ^7.0.2` ниже. |
| **Сборка** | `npx vite build --outDir /tmp/omr-build-check` | **PASS (735 ms), но `dist/` = 87 MB** | Из-за `public/assets/aistudio/` в прод-сборку попадает 87 MB архивов. |
| **Чистая установка `npm ci`** | *(не запускалась, проверка наличия lock-файла)* | **FAIL при попытке `npm ci`** | `package-lock.json` отсутствует (есть только `bun.lock`). |

Детали по конфигурационным файлам:
1. **`package.json`:**
   - `"name": "react-example"`, `"version": "0.0.0"` — не отражают продукт OMR `v0.1.0`; отсутствуют `description`, `license`, `repository`, `engines`.
   - `"clean": "rm -rf dist server.js"` — ссылается на несуществующий `server.js` и использует POSIX-команду `rm -rf`.
   - `"typescript": "^7.0.2"` (установлено в `bun.lock` как TypeScript 7.0.2 с нативными бинарниками `@typescript/typescript-*`): необходимо проверить воспроизводимость `npm install` в стандартном GitHub Actions runner или зафиксировать `package-lock.json` / `engines`.
   - В `dependencies` находятся runtime-неиспользуемые `@google/genai`, `express`, `dotenv`, `motion` (из-за чего `node_modules` занимает 191 MB).
2. **`tsconfig.json`:**
   - Не включён `"strict": true` (нет `strictNullChecks`, `noImplicitAny` и др. на уровне конфига).
   - `"types": ["vite/client"]` не перечисляет `"node"` (работает благодаря явным импортам `node:*`, но не защищено единым конфигом для браузера vs Node-тестов).
3. **`vite.config.ts`:**
   - Vite 8.3.8 выводит предупреждение: `__dirname` (`vite.config.ts:11:27`) несовместим с будущим `configLoader: 'native'` (рекомендуется `import.meta.dirname`).
   - Выводится предупреждение о размере бандла (`index-*.js` = `550.75 kB > 500 kB`).
4. **`.gitignore`:**
   - Исключает `node_modules/`, `build/`, `dist/`, `coverage/`, `.DS_Store`, `*.log`, `.env*`, `!.env.example`, но не исключает временные архивы (`*.zip`) и локальные каталоги отладки IDE (`.vscode/`, `.idea/`).
5. **`.env.example`:**
   - Содержит `GEMINI_API_KEY="MY_GEMINI_API_KEY"` и `APP_URL="MY_APP_URL"`. Ни одна переменная не используется в коде, что создаёт ложное требование настройки AI-ключей для запуска локального математического ядра.
6. **Минорный дефект граничной проверки (`src/core/l7IndependentVerifier.ts`):**
   - В `verifyProcess` строка `828`: `if (entry.stepIndex <= prev.stepIndex)` вернёт `false`, если `entry.stepIndex` равен `NaN` (нарушение строгого порядка пройдёт незамеченным, хотя `verifyResult` внутри проверит числа состояния/свидетельства).

**Вывод по воспроизводимости:** после чистого `git clone` с GitHub воспроизвести `npm ci` сейчас **невозможно** (нет `package-lock.json`); `npm install` сработает нестабильно/с избыточными зависимостями, а `npm run build` создаст 87-мегабайтный `dist/` со сторонними архивами.

---

## 3. Проверка документации для публичного релиза `v0.1.0`

| Требуемый документ | Текущее состояние | Расположение | Что требуется для `v0.1.0` |
|---|---|---|---|
| **`README.md`** | **Отсутствует в корне** (есть устаревший `docs/PROJECT_README.md`) | — | Создать корневой `README.md`: описание `OMR v0.1.0`, схема цикла `L2 → Witness → TRACE → L7`, быстрый старт (`install`, `test`, `lint`, `dev`, `build`), границы релиза, ссылка на `docs/`. |
| **`ARCHITECTURE.md`** | **Есть в `docs/ARCHITECTURE.md`, но устарел (Stage 1)** | `docs/ARCHITECTURE.md` | Обновить под фактический Contract 02 v2 (`LineNormalParams`, `ReflectionWitness`, аксиоматический L7 без решателя, фактическая структура `src/core/`), отделить реализованное от запланированного; решить, дублировать/переносить ли в корень. |
| **`DEVELOPMENT_ROADMAP.md`** | **Есть в `docs/DEVELOPMENT_ROADMAP.md`, но устарел (Stage 1)** | `docs/DEVELOPMENT_ROADMAP.md` | Зафиксировать завершение Phase 1–2.1 (`v0.1.0`) и чётко разметить Phase 2.2 / Phase 3+ как дальнейший план. |
| **`CHANGELOG.md`** | **Отсутствует** | — | Создать в формате Keep a Changelog с записью `[0.1.0]` и фактическим перечнем реализованных модулей и тестов. |
| **`LICENSE`** | **Отсутствует в корне** (SPDX `Apache-2.0` есть только в части `.ts`-файлов) | — | Добавить полный текст `Apache-2.0` в `/LICENSE` и выровнять SPDX-заголовки во всех файлах OMR. |
| **`CONTRIBUTING.md`** | **Отсутствует** | — | Создать правила контрибуции (обязательная изоляция `L7` от `L2`, Zero-Trust правило, требования к `npm test` и негативным тестам). |
| **`RELEASE_NOTES.md`** | **Отсутствует** | — | Подготовить релизную заметку для тега `v0.1.0` (состав, ограничения IEEE-754, известные открытые вопросы, ссылки на аудиты). |

Дополнительно необходимо обновить или пометить как архивные: `docs/FIRST_PROTOTYPE_SPEC.md`, `docs/REPOSITORY_STRUCTURE.md`, `ACCEPTANCE_AUDIT_V1.md`, `PHASE_2_IMPLEMENTATION_REPORT.md`.

---

## 4. Границы релиза `OMR v0.1.0`

### INCLUDED IN `v0.1.0` (подтверждено кодом и тестами)

- **Типизированные структуры контракта (`src/core/types.ts`):** `GeometryState` (с `stateId`, `version`, `vertices`, `edges`, `faces`), `LineNormalParams` (`nx * x + ny * y = c`), `ReflectionWitness`, `TraceEntry`, `VerificationClaim`, `VerificationVerdict`, `VerifierTolerances`.
- **Детерминированный вычислитель L2 (`src/core/l2GeometryEngine.ts`):** `createInitialGeometryState`, `reflectAcrossLine` (полная аффинная проекция в IEEE-754 без `.toFixed`), поддержка частичного отражения (`movingVertexIds` / `fixedVertexIds`), генерация `ReflectionWitness` и `TraceEntry`, `L2EngineError` (`INVALID_COORDINATE`, `DEGENERATE_NORMAL`, `UNKNOWN_VERTEX_ID`, `DUPLICATE_VERTEX_ID`).
- **Иммутабельный журнал `TRACE` (`src/core/trace.ts`):** `deepFreeze`, `cloneGeometryState`, `cloneReflectionWitness`, `createTraceEntry`, `appendTraceEntry`.
- **Независимый аксиоматический верификатор L7 (`src/core/l7IndependentVerifier.ts`):**
  - Нулевой импорт рантайма из `L2` и `TRACE` (проверено статическим тестом).
  - Режимы `verifyResult` и `verifyProcess`.
  - 4-этапный конвейер: Stage A (допустимость IEEE-754 и `||n|| > zeroNormalEpsilon`), Stage B (трёхсторонняя привязка `witness ↔ claim ↔ states`, сохранение ID, биекция пар, неподвижность `fixedVertexIds`, игнорирование `claimedResiduals`), Stage C (масштаб-инвариантные аксиомы `r_mid`, `r_perp`), Stage D (scope-aware инварианты длин, `|area|`, инверсия знака ориентированной площади на чисто движущихся гранях, исключение смешанных граней).
  - Трёхзначный вердикт: `PASS | FAIL | UNDETERMINED`.
- **Набор автоматических тестов (`tests/contract02.test.ts`):** **13/13 проходящих тестов** (эталон, контрпример `(2, 0)`, смещение `1e-2`, подмена `sourceState`, подмена оси, подмена разбиения `moving/fixed`, подделка `claimedResiduals = 0`, инвариантность к масштабу `1e6`, частичное отражение, вырожденные входы `||n||=0` / `NaN` / коллинеарная грань без маскировки реальных `FAIL`, разрыв привязки `stateId`/`version`, разрыв `TRACE` и границы `epsilon`, глубокая заморозка и изоляция L7).
- **Рабочий демонстрационный интерфейс (`src/components/VerificationWorkbench.tsx` + `src/App.tsx`):** интерактивный стенд `L2 → ReflectionWitness → TRACE → L7` с 3 пресетами осей и сценариями `T-01`..`T-04`, `DEG`. *(Примечание: описательная часть `App.tsx`/`passportData.ts` должна быть актуализирована под `v0.1.0` до публикации).*

### NOT INCLUDED IN `v0.1.0` (отсутствует в коде; не заявлять как реализованное)

- **L1 Topology (`FACE_SUBDIVISION`, `MATERIAL_CUT`, `Construction DAG`, `portableId != localId`).**
- **L3 Layer Order** (Z-порядок перекрытий).
- **L4 Kinematics** (непрерывные траектории `γ(t)`, 3D-складывание и проверка столкновений).
- **L5 Curved Folding** (криволинейные складки).
- **L6 Optimization** (поиск и ранжирование кандидатов).
- **Вердикт `CAPABILITY_GAP`** как runtime-ответ L2/L7 на 3D-углы, толщину листа или неподдерживаемые операции (в коде `types.ts` отсутствует).
- **Криптографическая защита `TRACE`** (JCS RFC 8785 + SHA-256 + W3C PROV).
- **Адаптивная / точная арифметика** (интервальные фильтры, `BigInt`/рациональные вычисления — всё ядро работает в IEEE-754 `f64`).
- **Интеграция с Ori Studio** и другими внешними инструментами (`Oriedita`, `Rabbit Ear`, `OrigamiSimulator`) — существуют только исследовательские аудиты.
- **Переносимый AI Reasoning Skill** и серверные LLM-агенты.

---

## 5. Проверка лицензионных и публикационных рисков

1. **Происхождение активного кода OMR (`src/`, `tests/`, `docs/`):**
   - Проверка содержимого архивов подтвердила, что `src/core/*.ts` и `tests/contract02.test.ts` **не скопированы** из `Origami-Geometry-Core-main` или `ori-studio-main`, а написаны заново для OMR.
   - В `src/core/{types.ts, trace.ts, l2GeometryEngine.ts, l7IndependentVerifier.ts}` и `src/App.tsx` проставлен заголовок `SPDX-License-Identifier: Apache-2.0`.
   - В `src/components/VerificationWorkbench.tsx`, `src/data/passportData.ts`, `src/main.tsx`, `tests/contract02.test.ts` заголовок SPDX сейчас отсутствует; корневой файл `LICENSE` также отсутствует.
2. **Критический риск `ori-studio-main__1__a9d35997.zip` (53 MB):**
   - Согласно `ori-studio-main/LICENSING.md` и корневому `Cargo.toml`, рабочее пространство Ori Studio лицензировано под **`GPL-2.0-or-later`** (прямой порт модели TreeMaker 5.0.1 и бандлинг ReferenceFinder), хотя отдельные крейты (например, `oristudio-geometry`) имеют `MIT OR Apache-2.0`.
   - Включение всего архива `ori-studio-main__1__a9d35997.zip` в публичный репозиторий под `Apache-2.0` (и его автоматическое копирование Vite в `dist/`) создаёт **прямой лицензионный конфликт и риск дистрибуции GPL-кода без выполнения требований GPL**. Архив необходимо **полностью удалить** из репозитория до публикации, сохранив в документации ссылки на `https://github.com/zacharyfmarion/ori-studio`, версию (`0.9.0`), лицензию и результаты аудитов.
3. **Риск `Origami-Geometry-Core-main_1194e531.zip` (34 MB):**
   - Лицензия в архиве — `MIT License` (`Copyright (c) 2026 PCRS Theory Lab`), однако архив содержит 429 файлов, включая внутренние файлы `.aistudio/` и три вложенных экспериментальных проекта. Хранить 34 MB стороннего zip-архива в `public/` экономически и архитектурно нецелесообразно — достаточно ссылки на `https://github.com/a50kv109/Origami-Geometry-Core` и отчёта анализа переиспользования.
4. **Риски публикации вспомогательных артефактов:**
   - `public/assets/aistudio/gemini-code-*.txt` — сырые промпты и внутренние задания сессий; не являются документацией продукта.
   - `metadata.json` и `.env.example` содержат упоминание серверного Gemini API и `GEMINI_API_KEY`, не соответствующие реальному клиентскому коду.

---

## 6. Последовательный план исправлений (P0 / P1 / P2)

### P0 — Обязательные блокирующие исправления (без них публикация невозможна)

| ID | Задача | Затрагиваемые файлы | Критерий приёмки |
|---|---|---|---|
| **P0-1** | **Удалить вложенные архивы и сырые артефакты AI Studio** | Удалить `public/assets/aistudio/` (или весь `public/assets/aistudio/*.zip`, `*.txt`, хэшированные `*.md`); при необходимости обновить ссылки в `src/data/passportData.ts:655` | В репозитории нет файлов `*.zip` и каталога `public/assets/aistudio/`; `vite build` даёт `dist/` размером `< 2 MB` (без 87 MB мусора). |
| **P0-2** | **Юридическое и лицензионное оформление** | Создать `/LICENSE` (`Apache-2.0`), при необходимости `/NOTICE`; добавить `SPDX-License-Identifier: Apache-2.0` в `src/components/VerificationWorkbench.tsx`, `src/data/passportData.ts`, `src/main.tsx`, `tests/contract02.test.ts` | В корне присутствует валидный `LICENSE` (`Apache-2.0`), все файлы в `src/` и `tests/` имеют единый SPDX-заголовок. |
| **P0-3** | **Очистка метаданных пакета и окружения** | `package.json` (`name`, `version: "0.1.0"`, `license: "Apache-2.0"`, `description`, удаление 7 неиспользуемых зависимостей); пересмотр/удаление `.env.example` и обновление `metadata.json` | В `package.json` нет неиспользуемых пакетов (`@google/genai`, `express`, `dotenv`, `motion`, `@types/express`, `autoprefixer`, `esbuild`) и имени `react-example`; `.env.example` не требует несуществующий `GEMINI_API_KEY`. |
| **P0-4** | **Воспроизводимый lock-файл и чистая установка** | Генерация актуального `package-lock.json` (или явная фиксация `bun.lock` + `packageManager`/`engines`, но для стандартного GitHub Node CI требуется `package-lock.json`) | На чистом клоне `npm ci && npm test && npm run lint && npm run build` завершаются с кодом `0` (13/13+ тестов PASS). |
| **P0-5** | **Создать корневой `README.md` и синхронизировать документацию/UI с фактическим кодом Phase 2.1** | Создать `/README.md`; обновить `docs/PROJECT_README.md`, `docs/ARCHITECTURE.md`, `docs/FIRST_PROTOTYPE_SPEC.md`, `docs/DEVELOPMENT_ROADMAP.md`, `docs/REPOSITORY_STRUCTURE.md`; актуализировать `index.html`, `src/App.tsx`, `src/data/passportData.ts`; перенести/пометить исторические отчёты (`ACCEPTANCE_AUDIT_V1.md`, `PHASE_2_IMPLEMENTATION_REPORT.md`) | Документация и UI точно описывают `v0.1.0` (`LineNormalParams`, `ReflectionWitness`, аксиомы `r_mid`/`r_perp`, допуски `1e-7`/`1e-12`, вердикты `PASS/FAIL/UNDETERMINED`, реальное расположение `src/core/` и `tests/contract02.test.ts`, явные границы `NOT INCLUDED`). |

### P1 — Необходимые задачи для качественного публичного релиза

| ID | Задача | Затрагиваемые файлы | Критерий приёмки |
|---|---|---|---|
| **P1-1** | **Добавить недостающие релизные документы** | Создать `/CHANGELOG.md`, `/CONTRIBUTING.md`, `/RELEASE_NOTES.md`, при необходимости `/DEVELOPMENT_STATUS.md` | Каждый документ заполнен фактическими данными по `v0.1.0`, без заглушек и вымышленных модулей. |
| **P1-2** | **Усилить TypeScript-конфигурацию и убрать предупреждения Vite** | `tsconfig.json` (включить `"strict": true`, настроить `types` или отдельный `tsconfig.test.json`), `vite.config.ts` (`import.meta.dirname` вместо `__dirname`), `package.json` (`"clean"` без несуществующего `server.js`) | `tsc --noEmit` проходит со `"strict": true` без ошибок; `vite build` не выдаёт предупреждений о `__dirname`. |
| **P1-3** | **Устранить пограничные пробелы в L7 и добавить недостающие негативные/многошаговые тесты** | `src/core/l7IndependentVerifier.ts` (проверка `Number.isFinite(entry.stepIndex)` в `verifyProcess`), `tests/contract02.test.ts` (добавить: тест валидной 2-шаговой цепочки `S₀ → S₁ → S₂` и инволюции `R_L(R_L(S))`; тест с `stepIndex: NaN`; тест битой ссылки `EdgeID`/`FaceID` на несуществующий `VertexID`; тест на отказ при попытке мутации `resultingState`/`witness`) | Все старые и новые тесты проходят в `npm test`; устранена лазейка `NaN <= prev.stepIndex`. |
| **P1-4** | **Настроить GitHub Actions CI и `.gitignore`** | Создать `.github/workflows/ci.yml` (`npm ci`, `npm test`, `npm run lint`, `npm run build`); дополнить `.gitignore` правилами для `*.zip`, `.vscode/`, `.idea/` | Автоматический workflow зелёный на clean checkout; локальные архивы/IDE-файлы игнорируются Git. |

### P2 — Улучшения, которые можно отложить на `v0.1.1+` / Phase 2.2

| ID | Задача | Затрагиваемые файлы | Критерий приёмки |
|---|---|---|---|
| **P2-1** | Оптимизация размера клиентского бандла (code-splitting `VerificationWorkbench` или паспортной части) | `vite.config.ts`, `src/App.tsx` | Устранено предупреждение Vite о чанке `> 500 kB`. |
| **P2-2** | Формальное введение `CAPABILITY_GAP` (для 3D / толщины листа), отдельный набор метаморфных тестов (`tests/metamorphic.test.ts`) и последующие фазы (`Contract 01 L1↔L2`, JCS+SHA-256 `TRACE`, эксперимент сравнения с `oristudio-geometry`) | `src/core/*`, `tests/*` | Оформлено отдельным milestone после тега `v0.1.0`. |

---

## Итоговое заключение

**NOT READY — CRITICAL ISSUES FOUND**

**Обоснование:** Вычислительное ядро и верификатор (`src/core/*` + `tests/contract02.test.ts`: 13/13 PASS, `tsc --noEmit`: 0 ошибок) функционально соответствуют цели `v0.1.0`, однако публикация текущего дерева на GitHub **заблокирована пятью критическими проблемами (P0)**: наличием 87 MB сторонних архивов и дампов AI Studio в `public/assets/aistudio/` (включая `GPL-2.0-or-later` архив `ori-studio`, копируемый в `dist/`), отсутствием корневого `README.md` и файла `LICENSE`, отсутствием `package-lock.json` и загрязнённым `package.json` (`react-example`, 7 неиспользуемых зависимостей), а также прямыми расхождениями между документацией `docs/` + UI `src/App.tsx` (остающимися на Stage 1 / прежней спецификации) и реальным кодом Phase 2.1.
