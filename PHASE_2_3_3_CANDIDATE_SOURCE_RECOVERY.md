# Phase 2.3.3 Candidate Source Recovery (`PHASE_2_3_3_CANDIDATE_SOURCE_RECOVERY.md`)

**Назначение:** форензический аудит всех доступных файлов на предмет наличия полного кода, фрагментов, диффов или патчей кандидатной ветки `candidate/phase-2-3-3-rework` (47 тестов) и `L7_CENTERED_AREA_PROPOSAL.patch` `[E][S][D]`.  
**Жёсткое правило маркировки:** разделены `[ORIGINAL]`, `[EXTRACTED]`, `[RECONSTRUCTED]`, `[UNAVAILABLE]`. Никакая реконструкция не выдаётся за оригинал.

---

## 1. Итог поиска по всему рабочему дереву и архиву

Прямой проверкой ФС (`find`, `ls`, `grep`, `sha256sum`) установлено `[E]`:

| Искомый артефакт | Наличие в AI Studio | Классификация | Примечание |
| :--- | :---: | :---: | :--- |
| Полный `tests/metamorphic.test.ts` ветки `candidate/phase-2-3-3-rework` (28 тестов / 47 всего) | **Отсутствует** | **`[UNAVAILABLE]`** | Единственный `.ts` файл в `tests/` — базовая 17-тестовая версия (`sha256: 284ba2c390e4e942c8755a831ff86586a9629066be1803859fa9daba68d587d8`) `[E]` |
| Внешний патч `L7_CENTERED_AREA_PROPOSAL.patch` | **Отсутствует** | **`[UNAVAILABLE]`** | Упомянут в `OMR_REPOSITORY_AUDIT_4b3449e1.md` §5 и `OMR_NEXT_PHASE_PROPOSAL_afad1181.md` §2.1, но не вложен `[D]` |
| Версия на 42 теста (`PHASE_2_3_STEP_3_REPORT_4f009db9.md`) — файл `.ts` | **Отсутствует** | **`[UNAVAILABLE]`** | Есть только сам отчёт (`.md`), не `.ts` `[E]` |
| Версия на 44 теста (`PHASE_2_3_STEP_3_REPORT__1__23215e72.md`) — файл `.ts` | **Отсутствует** | **`[UNAVAILABLE]`** | Есть только отчёт (`.md`), не `.ts` (`__3__` и `__4__` — побайтовые дубликаты) `[E]` |
| Базовые файлы ядра `src/core/*` и `tests/contract02.test.ts` | **Присутствуют** | **`[ORIGINAL]`** | Побайтово соответствуют базе `4aea9f4` согласно внешним аудитам (`[D]`); SHA-256 зафиксированы локально `[E]` |
| Базовый `tests/metamorphic.test.ts` (17 тестов: 13 A–E + 4 базовых Property F) | **Присутствует** | **`[ORIGINAL]`** (для базы `36`) | Строки `1–1372` (A–E) полностью совпадают с сохраняемой частью кандидата согласно `OMR_REPOSITORY_AUDIT_4b3449e1.md` §4 `[S][D]` |
| Исторические ZIP-архивы (`Origami-mathematical-reasoning-main*.zip`, `files*.zip`) | **Отсутствуют** | **`[UNAVAILABLE]`** | Удалены из `public/assets/aistudio/` до предыдущей сессии `[E]` |
| `public/assets/aistudio/Metamorphic_Tests_9c216e6d.pdf` (2 стр.) | **Присутствует** | **`[EXTRACTED]`** (из отклонённого черновика) | **НЕ является** кодом из `candidate/phase-2-3-3-rework`! Это ранний отклонённый черновик на `vitest` `[S][D]` |
| `public/assets/aistudio/Phase_2.3.3_Report_aa0f7cc4.pdf` (1 стр.) | **Присутствует** | **`[EXTRACTED]`** (текстовый отчёт) | Сводный PDF-отчёт о R1–R7 (без числа тестов и без исходного `.ts` кода) `[S]` |

---

## 2. Извлечённые фрагменты и их происхождение

### 2.1. Дословно извлечённый код из `public/assets/aistudio/Metamorphic_Tests_9c216e6d.pdf` (стр. 1–2) `[EXTRACTED]`

**Статус и происхождение:** дословный фрагмент ранней **непринятой** подачи Gemini (использована `vitest`, которой нет в `package.json`; импортирован несуществующий экспорт `computeSignedArea` из `l2GeometryEngine.ts`; эвристика `1e-9` по смещению вместо `movingVertexIds`/`fixedVertexIds`; сопоставление `face.id` со списком `movingIds`; перезапись всего `metamorphic.test.ts`). **К интеграции НЕПРИГОДЕН**, приведён исключительно для форензической полноты и подтверждения причин отклонения (`PHASE_2_3_STEP_3_REPORT` / переписка) `[S][D]`:

```ts
// [EXTRACTED — НЕПРИНЯТЫЙ ЧЕРНОВИК из Metamorphic_Tests_9c216e6d.pdf, стр. 1-2]
// НЕ СОВМЕСТИМ с проектом (vitest, несуществующий экспорт L2, эвристика 1e-9, смешение faceId и vertexId)
import { describe, it, expect } from 'vitest';
import { computeSignedArea } from '../src/core/l2GeometryEngine';
import { DEFAULT_VERIFIER_TOLERANCES } from '../src/core/l7IndependentVerifier';

export type PropertyFClassification =
  | 'HOLDS'
  | 'VIOLATION'
  | 'FIXED_UNCHANGED'
  | 'FIXED_CHANGED'
  | 'MIXED_NOT_APPLICABLE'
  | 'DEGENERATE_NOT_EVALUATED';

export interface FaceGeometry { id: string; vertices: { x: number; y: number }[]; }

export function classifyPropertyF(
  originalFaces: FaceGeometry[],
  transformedFaces: FaceGeometry[],
  movingIds: string[],
  fixedIds: string[],
  tolerance: number = DEFAULT_VERIFIER_TOLERANCES.degenerateAreaEpsilon,
  areaEpsilon: number = 1e-7
): Map<string, PropertyFClassification> {
  // Ключевые дефекты этого черновика:
  // 1) movingIds.includes(id) проверял FaceID вместо VertexID;
  // 2) movedCount по порогу > 1e-9 угадывал смешанность по движению вместо явного разбиения;
  // 3) areaEpsilon = 1e-7 вместо строгой тестовой шкалы 1e-12*max(1,|A|);
  // 4) fixed-ветка не проверяла неизменность координат вершин;
  // 5) ни один тест не вызывал reflectAcrossLine и L7 verifyResult.
```
В PDF также присутствуют ровно 4 теста `it(...)` (`'should classify degenerate faces correctly at boundary tolerance 1e-12'`, `'should verify Property F across standard reflection scenarios (F1, F2, F3)'`, `'NC-F1: sign-tampering control with rotation vs reflection'`, `'NC-F3: non-trivial degenerate reflection away from axis'`, `'NC-F2: mixed face classification and numerical demonstration of false violation'` — фактически 5 `it` на 2 страницах) `[EXTRACTED]`.

### 2.2. Действующий код текущей базы в AI Studio (`tests/metamorphic.test.ts`, строки 1–1720) `[ORIGINAL]`

1. **Строки `1–1372` (13 тестов `Properties A–E` + хелперы):** `[ORIGINAL]` — согласно `OMR_REPOSITORY_AUDIT_4b3449e1.md` §4 сохраняются **без изменений** и в кандидате `47` `[S][D]`. Ключевые хелперы: `makeSubdividedSquare`, `makeAsymmetricPolygonMesh`, `expectedReflection` (строка 928), `checkPairwiseDistances`, `buildAxisScenarios`, `liesExactlyOnAxis`, `runVerifiedReflection`, `assertTopologyPreserved` `[S]`.
2. **Строки `1374–1718` (4 базовых теста Property F):** `[ORIGINAL]` для базы `36` (`PHASE_2_3_STEP_3_REPORT.md` `[S]`). Содержит:
   - `computeSignedArea(faceVertexIds, state)` (строки 1383–1403, **нецентрированная** формула шнуровки);
   - `DEGENERATE_AREA_THRESHOLD = 1e-12` (строка 1405);
   - `isFaceDegenerate` (строка 1411, оператор `<`!);
   - `faceAreaTolerance(area) = 1e-12 * Math.max(1, Math.abs(area))` (строка 1416);
   - 4 тестовых блока `test(...)` на строках `1419`, `1487`, `1550`, `1614` (`[S]`).

### 2.3. Что существует ТОЛЬКО как `[DESCRIPTION]` (нет в виде `.ts` кода в AI Studio)

Для всех 15 тестов кандидатной версии (`candidate/phase-2-3-3-rework`) имеются **только текстовые описания** в `PHASE_2_3_STEP_3_REPORT__2__8a9ce0cb.md` (`R1–R7`, §6), `OMR_TEST_COVERAGE_MAP_22b2c738.md` (§1, §3, §4) и `OMR_REPOSITORY_AUDIT_4b3449e1.md` (§2–§5), а именно `[D]`:
- реализация **сдвигоустойчивого** `computeSignedArea` в тесте (способ центрирования — по `pts[0]` или центроиду — не указан в коде теста; по `pts[0]` описан только патч L7 `D-1` `[D][H]`);
- точная сигнатура и тело кандидатного `classifyPropertyF` (включая точное разделение `moving`/`fixed` по `VertexID` внутри `face.vertexIds`, а не по `face.id`, как ошибочно было в PDF `[D]`);
- точные координаты граничного треугольника `|A| === 1e-12` в `R1` (например, основание `2` и высота `1e-12` или аналогичные диадические числа `[H]`);
- точные координаты невыпуклого 5-угольника в `Property F (polygon coverage)` `[D]`;
- точные параметры фикстур `Numerical limitation D-1` (смещения `1e8`, `1e9`) и `D-2` (катеты `< ~1.41e-6`) `[D]`;
- точное разбиение на 15 `test(...)` вызовов (в `OMR_TEST_COVERAGE_MAP_22b2c738.md` перечислено ~13–14 заголовков/групп, включая пометки `×2`) `[D][H]`.

---

## 3. Можно ли собрать доказательно подтверждённый перечень изменений без восстановления самого файла?

**ДА — на уровне перечня требований, контрактов и семантики, НЕТ — на уровне точного побайтового исходного кода (`git diff`) `[E][D]`:**
1. **Что доказательно устанавливается без файла:**
   - перечень затрагиваемых файлов кандидата (`tests/metamorphic.test.ts`, отчёты; ноль изменений в `src/core/*`, `tests/contract02.test.ts`, `package*.json`) `[D][S]`;
   - сохранение 19 контрактных + 13 метаморфных тестов (`32` общих теста) `[S][D]`;
   - замена ровно 4 базовых блоков Property F (`1419–1718`) на `15` новых/переработанных тестовых блоков `[S][D]`;
   - точный перечень из **6** исходов классификатора, согласование порога вырожденности (`<= 1e-12`) и перечень покрытых дефектов (`D-5`, `D-7`) и характеризованных ограничений (`D-1`, `D-2`, вакуумный `L7 PASS`) `[D]`.
2. **Почему нельзя выдавать реконструкцию за оригинал и нельзя просто перенести `diff`:**
   - отсутствует побайтовый `tests/metamorphic.test.ts` ветки `candidate/phase-2-3-3-rework`, поэтому невозможно провести верификационный `npm test` (ожидаемый 47/47) именно **на коде кандидата**, невозможно проверить 17 мутаций на реальном файле и невозможно доказать построчное 100% покрытие утверждений из удаляемых 4 блоков базы `36` `[E][D]`.
   - Кроме того, **применение патча `D-1` (`L7_CENTERED_AREA_PROPOSAL.patch`) вообще запрещено** до Phase 2.4 и без исходника самого патча / решения владельца `[D][P]`.
