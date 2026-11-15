# Baseline Integrity Check Report (`BASELINE_INTEGRITY_CHECK_REPORT.md`)

**Этап:** Baseline Integrity Check (Verify actual project state after Phase 2.3.2 recovery)  
**Статус рабочей среды AI Studio:** **CONFIRMED — 32/32 (19 + 13), каноническая версия действительно активна на диске**  
**Дата проверки:** 2026-11-15 (12:47 UTC / 04:47 PST)  
**Режим выполнения:** строго read-only относительно существующих файлов проекта (изменений в коде, тестах, отчётах и конфигурации не вносилось; создан только настоящий отчёт `BASELINE_INTEGRITY_CHECK_REPORT.md`; Phase 2.3.3 не запускался).

---

## 1. Проверка текущего `tests/metamorphic.test.ts`

- **Путь:** `/app/applet/tests/metamorphic.test.ts`
- **Размер и время модификации:** `47 657` байт, `2026-11-15 12:44:27 UTC`
- **Количество строк (`wc -l`):** **`1366`** (`view_file` показывает 1367-ю пустую строку после завершающего `\n`)
- **Количество тестовых блоков `test(...)`:** **`13`**:
  - строки `261`, `428`, `561`, `703`, `791` — 5 тестов Phase 2.3.1 (Properties A, B, C + 2 негативных контроля);
  - строки `982`, `1031`, `1158`, `1223`, `1251`, `1286`, `1307`, `1328` — 8 тестов Phase 2.3.2 (Property D full/partial, Property E fixed points + no-snap contract, 4 негативных контроля).
- **Наличие `expectedReflection`:** **ДА** — объявлена на строке `928` (`function expectedReflection(p: Point2D, line: LineNormalParams): Point2D`), вызывается на строке `1212`.
- **Наличие `computeExpectedReflectionPoint`:** **НЕТ** (`0` совпадений).

---

## 2. Проверка текущего `PHASE_2_3_STEP_2_REPORT.md`

- **Путь:** `/app/applet/PHASE_2_3_STEP_2_REPORT.md`
- **Размер и время модификации:** `4 511` байт, `47` строк, `2026-11-15 12:44:27 UTC`
- **Зафиксированный результат:** `# PHASE 2.3.2 REPORT — Metamorphic Tests: Distance Invariance & Fixed Points`, раздел `1. Execution results`: **`# tests 32`, `# pass 32`, `# fail 0`**, таблица новых тестов `#25–#32`, вердикт `ACCEPTED`.

---

## 3. Проверка всех копий файлов в проекте и реально подключаемых файлов

### 3.1. Какие файлы реально запускает `npm test`
Согласно `package.json`:
```json
"test": "tsx --test tests/*.test.ts"
```
Скрипт `npm test` сканирует **только** маску `tests/*.test.ts` в корне проекта:
1. `tests/contract02.test.ts` (**19** тестов)
2. `tests/metamorphic.test.ts` (**13** тестов)

### 3.2. Поиск всех копий `metamorphic*`, `PHASE_2_3_STEP_2*` и `*.zip` в `/app/applet`
- **Активное дерево исходников и тестов (`src/`, `tests/`, корень `/`):**
  - ровно один `tests/metamorphic.test.ts` (канонический, `47 657` байт, 13 тестов);
  - ровно один `PHASE_2_3_STEP_2_REPORT.md` (канонический, `4 511` байт, 32/32).
- **Каталог загруженных вложений AI Studio `public/assets/aistudio/` (и его build-копия `dist/assets/aistudio/`):**
  - `public/assets/aistudio/files_196f72f3.zip` (`12:33:23 UTC`, `12 648` байт) — канонический архив с 32/32;
  - `public/assets/aistudio/PHASE_2_3_STEP_2_REPORT_4ecbf4b4.md` (`12:33:23 UTC`, `4 511` байт) — канонический отчёт 32/32;
  - `public/assets/aistudio/Origami-mathematical-reasoning-main__5__442446c1.zip` (`12:43:39 UTC`, `244 648` байт) — архив `Origami-mathematical-reasoning-main (5).zip`, содержащий внутри файлы с временной меткой **`2026-11-15 12:36 UTC`** (`tests/metamorphic.test.ts` = `50 387` байт / 1529 строк, `PHASE_2_3_STEP_2_REPORT.md` = `12 862` байта / 30/30).

Архивы и файлы в `public/assets/aistudio/` и `dist/assets/aistudio/` **не участвуют** в `npm test` и `tsc --noEmit`.

---

## 4. Фактические результаты выполнения команд (прямо сейчас)

- **`npm test` (`tsx --test tests/*.test.ts`):**
  - `tests/contract02.test.ts`: **19** тестов (`19 pass, 0 fail`)
  - `tests/metamorphic.test.ts`: **13** тестов (`13 pass, 0 fail`)
  - Общий итог: **`# tests 32`**, **`# pass 32`**, **`# fail 0`**, **`# cancelled 0`**, **`# skipped 0`** (`duration_ms 636.10687`).
- **`npm run lint` (`tsc --noEmit`):**
  - Код возврата `0`, ошибок нет.
- **`npm run build` (`vite build`):**
  - Код возврата `0`, `✓ 1666 modules transformed`, `✓ built in 701ms`.

---

## 5. Объяснение расхождения с архивом `Origami-mathematical-reasoning-main (5).zip`

По меткам времени в файловой системе и внутри самого архива установлена точная причина расхождения:

1. Файлы внутри `Origami-mathematical-reasoning-main__5__442446c1.zip` имеют временную метку **`2026-11-15 12:36 UTC`** (`04:36 PST`) — это снимок проекта, выгруженный сразу после предыдущего шага (до синхронизации канонической базы, на момент которого в рабочей копии была версия с 30 тестами и `computeExpectedReflectionPoint`).
2. Синхронизация канонической базы (`CANONICAL BASELINE RECOVERY`) была выполнена в **`12:44:27 UTC`** (`04:44:27 PST`), то есть **на 8 минут позже** времени создания архива `(5).zip`.
3. Таким образом, **текущая живая рабочая среда Google AI Studio действительно содержит каноническую версию `32/32` (`19 + 13`, `expectedReflection`, 1366 строк)**, а расхождение вызвано тем, что проверялся более ранний экспорт `(5).zip`, сформированный в `12:36 UTC` (до восстановления).

---

## 6. Как получить актуальный экспорт проекта

Чтобы получить архив, гарантированно совпадающий с текущей рабочей средой `32/32`:

1. Дождаться завершения текущего ответа агента (чтобы состояние контейнера и файловой системы AI Studio было зафиксировано после записи этого отчёта).
2. Выполнить в интерфейсе Google AI Studio **свежий Download / Export App** (получив новый архив, например `(6).zip`, не используя повторно `(5).zip` от `12:36 UTC`) или выполнить новый Push в GitHub.
3. Признаки того, что выгружен именно актуальный экспорт:
   - в корне нового ZIP присутствуют `CANONICAL_BASELINE_RECOVERY_REPORT.md` и `BASELINE_INTEGRITY_CHECK_REPORT.md`;
   - `tests/metamorphic.test.ts` имеет размер **47 657 байт** (`1366` строк) и содержит `function expectedReflection` (и не содержит `computeExpectedReflectionPoint`);
   - `PHASE_2_3_STEP_2_REPORT.md` имеет размер **4 511 байт** и фиксирует `# tests 32`.
   - *(Опциональное примечание для чистоты будущего экспорта: в `public/assets/aistudio/` сейчас лежат вложения чата `files_196f72f3.zip`, `PHASE_2_3_STEP_2_REPORT_4ecbf4b4.md` и `Origami-mathematical-reasoning-main__5__442446c1.zip`; они не удалялись ввиду строгого запрета на изменения, но при необходимости их можно будет отдельно убрать перед релизом, чтобы не дублировать старые архивы в `dist/`.)*

---

**Итог:** живая рабочая среда AI Studio подтверждена на **`32/32` (`19 + 13`)**. Изменения не вносились, **Phase 2.3.3 не запускался**. Ожидаю дальнейших указаний.
