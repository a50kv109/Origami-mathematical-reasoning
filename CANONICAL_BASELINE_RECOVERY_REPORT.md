# Canonical Baseline Recovery Report (`CANONICAL_BASELINE_RECOVERY_REPORT.md`)

**Этап:** Canonical Baseline Recovery (Synchronization before Phase 2.3.3)  
**Статус:** **SYNCHRONIZED & VERIFIED (32/32 тестов PASS)**  
**Дата отчёта:** 2026-11-15  
**Источник канонической базы:** архив `public/assets/aistudio/files_196f72f3.zip` (содержит `metamorphic.test.ts` — 47 657 байт, 1366 строк и `PHASE_2_3_STEP_2_REPORT.md` — 4 511 байт, 47 строк).

---

## 1. Зафиксированные различия до синхронизации

При сравнении файлов из архива с предыдущей локальной копией зафиксированы следующие расхождения:

| Файл | Предыдущая рабочая копия | Каноническая версия из архива |
| --- | --- | --- |
| `tests/metamorphic.test.ts` | 1529 строк, **11 тестов** (5 в Step 1 + 6 в Step 2), вспомогательные функции `computeExpectedReflectionPoint`, `assertSubsetPairwiseDistancesPreserved`, объединённые негативные контроли | 1366 строк, **13 тестов** (5 в Step 1 + 8 в Step 2), независимая функция **`expectedReflection`**, `checkPairwiseDistances`, `buildAxisScenarios`, `liesExactlyOnAxis`, `runVerifiedReflection`, 4 раздельных негативных контроля Step 2 |
| `PHASE_2_3_STEP_2_REPORT.md` | 94 строки, отчёт о 30/30 тестах | 47 строк, канонический отчёт о **32/32 тестах** (`#25–#32`) |

Две реализации **не объединялись**: выполнена побайтовая замена обоих файлов на канонические версии из архива (проверено через `cmp -s`).

---

## 2. Заменённые и нетронутые файлы

- **Заменены канонической версией из архива:**
  1. `tests/metamorphic.test.ts`
  2. `PHASE_2_3_STEP_2_REPORT.md`
- **Создан:**
  3. `CANONICAL_BASELINE_RECOVERY_REPORT.md` (настоящий отчёт)
- **Не изменялись:**
  - `src/core/*`
  - `tests/contract02.test.ts`
  - `package.json`, `package-lock.json`
  - архитектура L2 и L7
  - Phase 2.3.3 (Property F) не начинался, новые тесты не добавлялись.

---

## 3. Подтверждение структуры тестов и свойств A–E

- **`tests/contract02.test.ts`:** **19 тестов** (19 pass, 0 fail).
- **`tests/metamorphic.test.ts`:** **13 тестов** (13 pass, 0 fail), включая:
  - **Property A — Reflection Involution:** тест №20 (`Property A (Involution): R_L(R_L(P)) restores full geometry, IDs, topology, and passes L7`);
  - **Property B — Axis Coefficient Scaling:** тест №21 (`Property B (Axis Coefficient Scaling): R_(n,c)(P) = R_(alpha*n, alpha*c)(P) across admissible alpha`);
  - **Property C — Translation Equivariance:** тест №22 (`Property C (Translation Equivariance): T_v(R_L(P)) = R_(T_v(L))(T_v(P)) with L7 verification`);
  - **Step 1 Negative Controls:** тесты №23–24;
  - **Property D — Pairwise Distance Invariance:** тест №25 (full reflection) и тест №26 (partial reflection — moving/fixed subsets);
  - **Property E — Fixed Points on Axis:** тест №27 (4 scenarios, 3 distinct axes, использует функцию **`expectedReflection`** на строке 928) и тест №28 (`Contract: a vertex merely near the axis is NOT snapped or auto-classified as fixed`);
  - **Step 2 Negative Controls:** тесты №29 (`Negative Control (D)`), №30 (`Negative Control (E)` fixed), №31 (`Negative Control (E)` moving), №32 (`Negative Control (forged claimedResiduals)`).
- **Итого:** **32 теста** (`19 + 13`).

---

## 4. Фактические результаты проверки (`npm test`, `npm run lint`, `npm run build`)

- **`npm test` (`tsx --test tests/*.test.ts`):**
  - `# tests 32` / `# pass 32` / `# fail 0` / `# cancelled 0` / `# skipped 0` (`duration_ms 800.895164`).
- **`npm run lint` (`tsc --noEmit` со `"strict": true`):**
  - Код возврата `0`, ошибок нет.
- **`npm run build` (`vite build`):**
  - Код возврата `0`, `✓ 1666 modules transformed`, `✓ built in 680ms` (`dist/index.html 1.62 kB`, `dist/assets/index-rgXMFcwF.css 25.03 kB`, `dist/assets/index-QUwyWl3L.js 562.64 kB`).

---

## 5. Перечень оставшихся расхождений и примечаний

1. **Расхождения по коду ядра, тестам A–E и отчёту Step 2:** **отсутствуют.** Оба восстановленных файла (`tests/metamorphic.test.ts` и `PHASE_2_3_STEP_2_REPORT.md`) побайтово совпадают с каноническим архивом, функция `expectedReflection` присутствует, все `32/32` теста, `lint` и `build` проходят.
2. **Среда без `.git`:** в корневой директории рабочей среды отсутствует каталог `.git`, поэтому история коммитов (в частности упоминаемый в каноническом отчёте `commit b1fe5a3`) в данной песочнице недоступна.
3. **Загруженные файлы в `public/assets/aistudio/`:** архив `files_196f72f3.zip` и прочие загруженные в рамках AI Studio вложения в `public/assets/aistudio/` оставлены без изменений согласно запрету трогать сторонние/неуказанные файлы.

---

**Следующий шаг:** ожидание отдельного разрешения на старт **Phase 2.3.3 — Property F (Orientation Reversal Under Reflection)**.
