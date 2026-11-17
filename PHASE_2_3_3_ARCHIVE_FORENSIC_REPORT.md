# Phase 2.3.3 Archive Forensic Report (`PHASE_2_3_3_ARCHIVE_FORENSIC_REPORT.md`)

**Статус исследования:** завершено (режим строгого чтения; исходный код `src/*`, тесты `tests/*`, конфигурация, зависимости, существующие отчёты, `public/*`, `dist/` и GitHub не изменялись) `[E]`.  
**Объект:** полная архивно-форензическая реконструкция истории Phase 2.3 → Phase 2.3.3, числовых допусков, дефектов `D-1`–`D-8`, противоречий между источниками и готовности к завершению Phase 2.3.3 `[E][S][D]`.

**Эпистемическая маркировка:**
- `[E]` — проверено экспериментально в текущей среде AI Studio;
- `[S]` — подтверждено непосредственным чтением исходного кода / локальных файлов;
- `[D]` — содержится во внешнем документе / вложенном аудите;
- `[M]` — математически обосновано;
- `[H]` — гипотеза;
- `[P]` — предложение;
- `[ORIGINAL]` / `[EXTRACTED]` / `[RECONSTRUCTED]` / `[UNAVAILABLE]` — статус исходных материалов.

---

## 1. Общее состояние источников (аудит вложений и целостности)

Перед реконструкцией проверены контрольные суммы всех 17 файлов в `public/assets/aistudio/` (`sha256sum public/assets/aistudio/*` `[E]`). Установлено, что **7 повторно приложенных файлов являются побайтовыми дубликатами** ранее загруженных копий:

| Базовый файл в `public/assets/aistudio/` | Идентичный дубликат | SHA-256 `[E]` |
| :--- | :--- | :--- |
| `PHASE_2_3_STEP_3_REPORT__1__23215e72.md` | `__3__23215e72.md`, `__4__23215e72.md` | `23215e7234b20af088eef19149e98f2c75e6c872e6f63d314b7145d994e738a9` |
| `PHASE_2_3_STEP_3_REPORT__2__8a9ce0cb.md` | `__5__8a9ce0cb.md` | `8a9ce0cbbb06a78fc4f6b660511380515b2eeed7350c44a0b8f9ec9a2e1cbce2` |
| `OMR_REPOSITORY_AUDIT_4b3449e1.md` | `OMR_REPOSITORY_AUDIT__1__4b3449e1.md` | `4b3449e1078a7e814dbb3048012381378767ab3c794790a3fbeacaeaee267993` |
| `OMR_ARCHITECTURE_REVIEW_4bc5cde4.md` | `OMR_ARCHITECTURE_REVIEW__1__4bc5cde4.md` | `4bc5cde4e684b6c776e216a58f3aea3335546d61487eeffcda98b35155c218e9` |
| `OMR_TEST_COVERAGE_MAP_22b2c738.md` | `OMR_TEST_COVERAGE_MAP__1__22b2c738.md` | `22b2c73856c71d05e21801e071d7cba4c7357bb4592f5a71c91fb2e30d2f79bd` |
| `OMR_NEXT_PHASE_PROPOSAL_afad1181.md` | `OMR_NEXT_PHASE_PROPOSAL__1__afad1181.md` | `afad1181650eb8ef0f04254ee7e46998c8000d4f83c9977751cc435c0479ebf4` |

Уникальных внешних вложений в `public/assets/aistudio/` ровно **10**: 8 `.md` (включая `PHASE_2_3_STEP_3_REPORT_4f009db9.md` и `OMR___PHASE_2.3.3_INDEPENDENT_REVIEW_AND_COMPLETION_PLAN_179f042c.md`) и 2 `.pdf` (`Metamorphic_Tests_9c216e6d.pdf`, `Phase_2.3.3_Report_aa0f7cc4.pdf`) `[E]`.

---

## 2. Хронология разработки (строго по документальным свидетельствам)

*Правило датировки:* приведены только даты/метки времени, явно указанные внутри самих документов; в документах без даты указано `Дата не указана` (временные метки ФС контейнера при загрузке не трактуются как даты создания отчётов).

| № | Этап | Документ(ы) | Дата в документе | Состояние и тесты | Внесённые изменения | Обнаруженные проблемы | Последующие решения | Теги |
| :- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **1** | **Ядро Phase 2.1 – 2.2** | `CHANGELOG.md`, `PHASE_2_1_IMPLEMENTATION_REPORT.md`, `PHASE_2_2_IMPLEMENTATION_REPORT.md` | `2026-11-15` (`CHANGELOG.md:6`, `PHASE_2_2...:5`) | Релиз `0.1.0`; Phase 2.1: **13** тестов (`contract02`); Phase 2.2: **19** тестов (`contract02`) | Внедрены `types.ts`, `operationRequest.ts`, `trace.ts`, `l2GeometryEngine.ts`, аксиоматический `l7IndependentVerifier.ts` (включая `Stage D` с `computeSignedArea` и `orientationInverted`), `"strict": true` | Ограничения IEEE-754 на экстремальных сдвигах, отсутствие `L1`/`CAPABILITY_GAP`/JCS-SHA-256 | Планирование метаморфного тестирования Phase 2.3 | `[S]` |
| **2** | **План Phase 2.3** | `PHASE_2_3_METAMORPHIC_TEST_PLAN.md` | Дата не указана | Документ проектирования (19 тестов в базе) | Определены Properties `A–G`, домены `D1–D6`, стратегия допусков, негативные контроли `NC-1..NC-7` | Выявлены границы ядра: `normSq` overflow в L2 (`§8.1.1`), потеря точности при сдвиге (`§8.1.2`), абсолютный порог `1e-12` (`§8.1.3`), наследование `areaEpsilon` от `epsilon` (`§4.3`, строка 107) | Поэтапная реализация 2.3.1 → 2.3.2 → 2.3.3 без правки `src/core/*` | `[S]` |
| **3** | **Phase 2.3.1 (Step 1)** | `PHASE_2_3_STEP_1_REPORT.md` | `2026-11-15` (строка 5) | **24/24** (`19` `contract02` + `5` `metamorphic`) | Создан `tests/metamorphic.test.ts` (Properties `A–C` + 2 NC) | Не покрыты `D`, `E`, `F`, домены `D3–D6` (`§6`); JS-бандл зафиксирован как `562.64 kB` (`§5`) | Переход к Phase 2.3.2 (`D`, `E`) | `[S]` |
| **4** | **Phase 2.3.2 и рассинхрон (30 vs 32)** | `PHASE_2_3_STEP_2_REPORT.md`, `CANONICAL_BASELINE_RECOVERY_REPORT.md`, `BASELINE_INTEGRITY_CHECK_REPORT.md` | `2026-11-15` (снимки `12:33:23`, `12:36`, `12:44:27`, `12:47 UTC`) | Параллельная копия: **30/30** (`11` метаморфных, `1529` строк, `computeExpectedReflectionPoint`). Каноническая: **32/32** (`13` метаморфных, `1366` строк, `expectedReflection`, коммит `b1fe5a3`) | Каноническая версия восстановлена из `files_196f72f3.zip` (`32/32`) с побайтовой заменой без слияния | Ранний экспорт `(5).zip` (`12:36 UTC`) создал путаницу из-за более позднего восстановления (`12:44:27 UTC`); в `public/assets/aistudio/` оставались архивы | Подтверждён чистый базис `32/32` перед стартом Phase 2.3.3 | `[S]` |
| **5** | **Первые тесты Property F (отклонённый черновик vs Remediation Pass)** | `Metamorphic_Tests_9c216e6d.pdf`, `Phase_2.3.3_Report_aa0f7cc4.pdf`; `PHASE_2_3_STEP_3_REPORT.md` | PDF: Дата не указана; `PHASE_2_3_STEP_3_REPORT.md`: `2026-11-15` (строка 6) | PDF-подача: несовместимая `vitest`-версия. Текущая среда AI Studio: **36/36** (`19 + 17`), `PHASE_2_3_STEP_3_REPORT.md` | В AI Studio добавлены 4 теста Property F (`F1`, `F2`, `F3`, `NC` + поворот D vs F) и удалён `PHASE_2_3_STEP_2_REPORT_4ecbf4b4.md` из `public/assets/aistudio/` | В PDF: `vitest`, нерабочий импорт `computeSignedArea` из `L2`, эвристика `1e-9` вместо `movingIds/fixedIds`. В `36`-тестовой базе AI Studio: `NC-F1`/`NC-F2` не закрыты классификатором, `NC-F3` на оси и без L7, `< 1e-12` vs `<= 1e-12` в L7, бандл `562.64 kB` | Проведён независимый аудит Claude (`36`-тестового архива / `4aea9f4`) | `[S][D]` |
| **6** | **Независимый аудит (R1–R7)** | `OMR___PHASE_2.3.3_INDEPENDENT_REVIEW_AND_COMPLETION_PLAN_179f042c.md` | Дата не указана | Проверено **36/36** (архив сравнён с `b1fe5a3`); бандл у рецензента: `335.25 kB` | Найдено, что `L7` Stage D уже реализует `orientationInverted` и `UNDETERMINED`, но тесты этого не проверяют | Перечислены `D1–D5` + `R1`, сформулированы требования `R1–R7` и чек-лист §9; ошибочно сочтено, что `orientationInverted` нельзя изолировать | Вердикт **`CONDITIONALLY ACCEPTED`**; даны правки `R1–R7` | `[D]` |
| **7** | **Итерации правок кандидата: `42` → `44` → `47` тестов** | `PHASE_2_3_STEP_3_REPORT_4f009db9.md` (42), `__1__23215e72.md` (44), `__2__8a9ce0cb.md` (47) | Дата не указана | `42/42` (`23` метаморф.) → `44/44` (`25` метаморф.) → **`47/47`** (`28` метаморф.) на ветке `candidate/phase-2-3-3-rework` от `4aea9f4` | Внедрён `classifyPropertyF` (6 исходов), `R1–R7`, далее закрыты `FIXED_CHANGED` (перенос), допускной край (`1e-14/1e-9/1e-5`), согласованная подделка, `D-1`/`D-2` характеризация, невыпуклый 5-угольник; проведено **17** мутаций (`16/17`) | В версиях 42 и 44 оставалась неверная тезисная строка о неизолируемости `orientationInverted` (`D-5`); только в версии **47** показана изоляция через `overrides={epsilon:10, areaEpsilon:1e-7}` | Кандидат (`47`) в GitHub **не пушился** и в AI Studio отсутствует | `[D][E]` |
| **8** | **Систематизация `D-1`–`D-8` и подготовка Phase 2.4** | `OMR_REPOSITORY_AUDIT_4b3449e1.md`, `OMR_ARCHITECTURE_REVIEW_4bc5cde4.md`, `OMR_TEST_COVERAGE_MAP_22b2c738.md`, `OMR_NEXT_PHASE_PROPOSAL_afad1181.md` | Дата не указана | Зафиксирована база `4aea9f4` (`36`) vs кандидат (`47`) | Вне репозитория подготовлен `L7_CENTERED_AREA_PROPOSAL.patch` (для `D-1`: 46/47 с падением характеризационного D-1) и предложение Phase 2.4 «Numerical Domain Hardening» | Открыты `D-1` (сырой shoelace в L7), `D-2` (абсолютный `1e-12`), `D-3` (`normSq` overflow текст), `D-4` (`areaEpsilon ?? epsilon`), `D-6` (`README`), `D-8` (`562.64` vs `335.25 kB`), вакуумный PASS смешанных граней | В AI Studio проведены инвентаризация, интеграционный анализ и выпущен манифест (`36/36`) `[E][S]` | `[D][E][S]` |

---

## 3. Согласование численных допусков (история и использование)

Сводная реконструкция значений `1e-12`, `1e-7`, `epsilon`, `areaEpsilon`, `degenerateAreaEpsilon` по коду (`[S]`) и документам (`[D]`):

| Символ / значение | Происхождение (`PHASE_2_3_METAMORPHIC_TEST_PLAN.md`, код) | Где и как используется сейчас | Расхождения и статус |
| :--- | :--- | :--- | :--- |
| **`epsilon = 1e-7`** | `DEFAULT_VERIFIER_TOLERANCES.epsilon` (`src/core/l7IndependentVerifier.ts:47`) `[S]` | `L7 Stage B/C/D`: аксиомы $r_{\text{mid}}, r_{\text{perp}}$, смещение `fixedVerticesUnchanged`, привязка `witness` (`pPrime`), длины рёбер и хорд `lengthsPreserved` (`l7IndependentVerifier.ts:805, 912`) `[S]` | Базовый линейный допуск контракта L7; единое значение с Phase 2.1 `[S]` |
| **`areaEpsilon = 1e-7`** | `DEFAULT_VERIFIER_TOLERANCES.areaEpsilon` (`l7IndependentVerifier.ts:48`) `[S]` | `L7 Stage D`: инверсия ориентированной площади `|signed1 + signed0| <= tol.areaEpsilon` (стр. 902) и сохранение модуля `areaError <= tol.areaEpsilon` (стр. 919) `[S]`. В PDF-черновике `Metamorphic_Tests_9c216e6d.pdf` был зашит параметром классификатора (`areaEpsilon = 1e-7`) `[EXTRACTED]` | **Расхождение 1 (тест vs L7):** в AI Studio (`metamorphic.test.ts:1416`) и кандидате (`[D]`) допуск площади теста = `1e-12 * max(1, |area|)` (в ~10⁵ раз строже L7 `1e-7`). **Расхождение 2 (`D-4`):** в `resolveTolerances` (`l7IndependentVerifier.ts:59`) написано `overrides?.areaEpsilon ?? epsilon` — при переопределении одного `epsilon` молча меняется и `areaEpsilon` `[S]`. |
| **`1e-12` (`METAMORPHIC_COORD_TOLERANCE` и тест-площадь)** | `PHASE_2_3_STEP_1_REPORT.md:45` (`1e-12` для умеренных координат D1/D2) `[S]` | `tests/metamorphic.test.ts:45` (`METAMORPHIC_COORD_TOLERANCE = 1e-12` для координат), стр. 1416 (`faceAreaTolerance = 1e-12 * max(1, |area|)`), Step 2 (`1e-12 * max(1, d_before)` для расстояний) `[S]` | В кандидате сохранена шкала `1e-12 * max(1, |A|)` и явно зафиксирована на краях `1e-14` (`HOLDS`) / `1e-9` (`VIOLATION` в тесте, `PASS` в L7) / `1e-5` (`FAIL` в обоих) `[D]` |
| **`degenerateAreaEpsilon = 1e-12`** | `DEFAULT_VERIFIER_TOLERANCES.degenerateAreaEpsilon` (`l7IndependentVerifier.ts:50`) и `DEGENERATE_AREA_THRESHOLD = 1e-12` (`tests/metamorphic.test.ts:1405`) `[S]` | `L7 Stage D` (стр. 896): `Math.abs(signed0) <= tol.degenerateAreaEpsilon` (для чисто движущихся граней → `UNDETERMINED` если нет невырожденных). В текущей базе AI Studio (`metamorphic.test.ts:1411`): `Math.abs(...) < 1e-12`. В кандидате (`[D]`): `<= DEFAULT_VERIFIER_TOLERANCES.degenerateAreaEpsilon`. | **Расхождение 1 (`<` vs `<=`):** в текущей базе AI Studio `1e-12` ровно не считается вырожденным в тесте (`<`), но считается в `L7` (`<=`) `[S]`; исправлено в кандидате (`[D]`). **Расхождение 2 (`D-2`):** абсолютный порог `1e-12` ложно относит невырожденный микротреугольник с катетами `< ~1.41e-6` к вырожденным и не учитывает линейный размер `L` (`c * L²`) `[S][M][D]`. |
| **Внешние предложения** | `PHASE_2_3_METAMORPHIC_TEST_PLAN.md` §4 (`τ_coord`, `τ_rel`, адаптивный `toleranceOverrides` для D3/D4); `OMR_NEXT_PHASE_PROPOSAL_afad1181.md` §3 `[S][D]` | В `OMR_NEXT_PHASE_PROPOSAL` предложены 3 варианта для `D-2`: (a) оставить `1e-12` с документированием границы $\gtrsim 1.5\cdot 10^{-6}$; (b) `|A| <= c * L²` ($c \sim 10^{-9}..10^{-6}$); (c) `max(c * L², k * ε_mach * Σ|члены|)` `[D]` | На Phase 2.3.3 **новые допуски не назначаются**; выбор `c` отложен на эксперимент `D6` в Phase 2.4 `[D][P]` |

---

## 4. Карточки дефектов `D-1` — `D-8`

### D-1 — Нецентрированная формула Гаусса в L7 (ложные отказы при больших сдвигах)
- **Описание:** `computeSignedArea` в `L7` вычисляет $\frac{1}{2}\sum(x_i y_{i+1} - x_{i+1} y_i)$ от `(0,0)`. При смещении ~`1e8` верное отражение (при точном расчёте `L2`) даёт в `L7` ложный `FAIL` (`areaPreserved=false`), при `1e9` — `UNDETERMINED` `[S][M][D]`.
- **Первый известный источник:** общий риск больших переносов упомянут в `PHASE_2_3_METAMORPHIC_TEST_PLAN.md` §3 (`D5`) и §4 `[S]`; как конкретный баг `L7` зафиксирован в `OMR_REPOSITORY_AUDIT_4b3449e1.md` §2 (`D-1`) `[D]`.
- **Подтверждающие материалы:** `src/core/l7IndependentVerifier.ts:81-90` `[S]`, `OMR_ARCHITECTURE_REVIEW_4bc5cde4.md` §7.1 `[D]`, `OMR_NEXT_PHASE_PROPOSAL_afad1181.md` §2 `[D]`.
- **Затронутый модуль:** `src/core/l7IndependentVerifier.ts` (и текущая копия `computeSignedArea` в `tests/metamorphic.test.ts:1383-1403`) `[S]`.
- **Степень доказанности:** `[S][M]` (код не центрирован; математически ошибка $\sim \varepsilon_{\text{mach}}\cdot S^2$ доказана); `[D]` (конкретные пороги `1e8`/`1e9` на данном тесте замерены во внешнем аудите, локально не запускались).
- **Предлагаемое решение:** внешний патч `L7_CENTERED_AREA_PROPOSAL.patch` (центрирование относительно `points[0]`; 10 строк, в репозитории отсутствует `[E][D]`).
- **Тестовый сценарий:** `Numerical limitation D-1 (characterization)` (только в кандидатной ветке 47 тестов, закрепляет *текущее ошибочное* поведение `L7` и упадёт при применении патча `[D]`).
- **Открытые вопросы:** даже центрирование не спасёт полигон, чей размер сравним с `ULP` смещения (`double`) `[M]`; решение о правке ядра перенесено в Phase 2.4.

### D-2 — Абсолютный порог вырожденности `degenerateAreaEpsilon = 1e-12`
- **Описание:** `Math.abs(signed0) <= 1e-12` игнорирует линейный размер грани: реальный микротреугольник с катетами `< ~1.41e-6` получает `UNDETERMINED` («collinear vertices»), а длинная вытянутая грань может проскочить `[S][M][D]`.
- **Первый известный источник:** `PHASE_2_3_METAMORPHIC_TEST_PLAN.md` §3 (`D4`) и §8.1.3 `[S]`; как `D-2` оформлен в `OMR_REPOSITORY_AUDIT_4b3449e1.md` `[D]`.
- **Подтверждающие материалы:** `src/core/l7IndependentVerifier.ts:50, 896` `[S]`, `OMR___PHASE_2.3.3_INDEPENDENT_REVIEW...md` §6 `R1` `[D]`, `OMR_NEXT_PHASE_PROPOSAL_afad1181.md` §3 `[D]`.
- **Затронутый модуль:** `src/core/l7IndependentVerifier.ts` (и тесты Property F) `[S]`.
- **Степень доказанности:** `[S][M]`; `[D]` (тест `Numerical limitation D-2` в кандидате).
- **Предлагаемое решение:** 3 варианта в `OMR_NEXT_PHASE_PROPOSAL` §3 (a: оставить + задокументировать; b: $|A| \le c L^2$; c: $b$ + оценка шума шнуровки) `[D]`.
- **Тестовый сценарий:** `Numerical limitation D-2` в кандидате (`47`) + `Property F classifier (R1)` `[D]`. В базе `36` — отсутствует `[E][S]`.
- **Открытые вопросы:** обоснованный выбор коэффициента `c` (требует эксперимента `D6` на масштабах и aspect ratio `~1e4`) `[D]`.

### D-3 — Вводящее в заблуждение сообщение `DEGENERATE_NORMAL` при переполнении `normSq`
- **Описание:** в `src/core/l2GeometryEngine.ts:75-87` при `||n|| ≈ 1e155` значение `norm` конечно, но `normSq = nx*nx + ny*ny` переполняется в `Infinity`; `L2` бросает `DEGENERATE_NORMAL` с текстом `||n|| = 1e+155 <= 1e-12` `[S][D]`.
- **Первый известный источник:** `PHASE_2_3_METAMORPHIC_TEST_PLAN.md` §8.1.1 (`1.34e154`) `[S]`; код дефекта `D-3` в `OMR_REPOSITORY_AUDIT_4b3449e1.md` `[D]`.
- **Подтверждающие материалы:** `src/core/l2GeometryEngine.ts:75-87` `[S]`.
- **Затронутый модуль:** `src/core/l2GeometryEngine.ts` `[S]`.
- **Степень доказанности:** `[S]` (прямо видно в коде) + `[D]` (запуск в аудите).
- **Предлагаемое решение:** разделить ветки диагностики в `validateLineParams` (overflow `normSq` vs малая норма `||n|| <= zeroNormalEps`) в Phase 2.4 `[D][P]`.
- **Тестовый сценарий:** в текущих `36` и в кандидатских `47` тестах отдельного теста на текст ошибки `1e155` нет (`[S][D]`).
- **Открытые вопросы:** следует ли переходить на масштабирование через `norm` для избежания overflow `normSq`, или достаточно честного сообщения об ошибке `[P]`.

### D-4 — Неявное наследование `areaEpsilon` от `overrides.epsilon` в `resolveTolerances`
- **Описание:** `areaEpsilon: overrides?.areaEpsilon ?? epsilon` (`src/core/l7IndependentVerifier.ts:59`) при передаче только `epsilon` молча изменяет `areaEpsilon` вместо сохранения `DEFAULT_VERIFIER_TOLERANCES.areaEpsilon` (`1e-7`) `[S]`.
- **Первый известный источник:** `PHASE_2_3_METAMORPHIC_TEST_PLAN.md` §4.3 (строка 107: предупреждение передавать `areaEpsilon` явно) `[S]`; как `D-4` — в `OMR_REPOSITORY_AUDIT_4b3449e1.md` `[D]`.
- **Подтверждающие материалы:** `src/core/l7IndependentVerifier.ts:53-67` `[S]`, `OMR_ARCHITECTURE_REVIEW_4bc5cde4.md` §5 `[D]`.
- **Затронутый модуль:** `src/core/l7IndependentVerifier.ts` `[S]`.
- **Степень доказанности:** `[S]` (подтверждено кодом).
- **Предлагаемое решение:** заменить `?? epsilon` на `?? DEFAULT_VERIFIER_TOLERANCES.areaEpsilon` в Phase 2.4 `[P]`.
- **Тестовый сценарий:** косвенно проявляется в тесте изоляции `NC-F1` (где `areaEpsilon: 1e-7` приходится передавать явно при `epsilon: 10`), отдельного unit-теста на `D-4` пока нет `[D]`.
- **Открытые вопросы:** проверка, не рассчитывает ли какой-либо внешний вызов на старое сцепление параметров `[H]`.

### D-5 — Ошибочное утверждение о невозможности изоляции `L7.orientationInverted` (**ПЕРЕОСМЫСЛЕНО / ИСПРАВЛЕНО В ОТЧЁТАХ `[D]`, ПРОГРЕСС ТЕСТА В БАЗЕ НЕ ПРИМЕНЁН `[S]`**)
- **Описание:** в ранних отчётах утверждалось, что `orientationInverted` нельзя изолированно уронить через публичное API `verifyResult` (мешает `axiomsSatisfied=false` в Stage C). Позднее доказано, что передача `overrides: { epsilon: 10, areaEpsilon: 1e-7 }` пропускает Stage C и длины, оставляя `orientationInverted = false` единственной причиной `FAIL` `[S][D]`.
- **Первый известный источник:** ошибочный тезис в `OMR___PHASE_2.3.3_INDEPENDENT_REVIEW...md` §5, §7 R3, а также в отчётах на 42 (`_4f009db9.md`) и 44 (`__1__23215e72.md`) теста `[D]`.
- **Подтверждающие материалы:** исправлено в `__2__8a9ce0cb.md` R3, `OMR_REPOSITORY_AUDIT_4b3449e1.md` (`D-5`), `OMR_ARCHITECTURE_REVIEW_4bc5cde4.md` §3; механизм подтверждён в `src/core/l7IndependentVerifier.ts:805, 902, 926-934` `[S][D]`.
- **Затронутый модуль:** тестовый слой (`tests/metamorphic.test.ts`); в `L7` сохраняется сопутствующая проблема **вакуумного `orientationInverted=true`** для полностью смешанных граней (`l7IndependentVerifier.ts:847`) `[S]`.
- **Степень доказанности:** `[S]` (по коду L7) + `[D]` (тест только в 47-тестовой ветке, в AI Studio отсутствует `[E]`).
- **Открытые вопросы:** нужен ли в L7 статус `NOT_APPLICABLE` (контрактное решение Phase 2.4+) `[P]`.

### D-6 — Рассинхронизация документации и замусоренность корня / `public/assets/aistudio/`
- **Описание:** `README.md` (`Phase 2.2`, `19/19`) и `docs/REPOSITORY_STRUCTURE.md` (`13` тестов, без `operationRequest.ts`) отстают от кода (`Phase 2.3.3`, `36/36`), в корне >20 `.md`-отчётов, а в `public/assets/aistudio/` лежат 17 файлов вложений `[E][S]`.
- **Первый известный источник:** `BASELINE_INTEGRITY_CHECK_REPORT.md` §6 (`public/`), `OMR_REPOSITORY_AUDIT_4b3449e1.md` (`D-6`) `[S][D]`.
- **Подтверждающие материалы:** прямое чтение `README.md`, `docs/REPOSITORY_STRUCTURE.md`, `ls` `[E][S]`.
- **Затронутый модуль:** документация, `public/assets/aistudio/`.
- **Степень доказанности:** `[E][S]`.
- **Предлагаемое решение:** актуализация `README`/`REPOSITORY_STRUCTURE` и архивирование отчётов/вложений вне `public/` строго после завершения 2.3.3 `[P]`.

### D-7 — Дефекты первоначальных тестов Property F в `36`-тестовой базе (**ЗАКРЫТО ТОЛЬКО В КАНДИДАТЕ 47 `[D]`, ОТКРЫТО В AI STUDIO `[S]`**)
- **Описание:** в базовых 4 тестах Property F (`tests/metamorphic.test.ts:1419-1718`) отсутствовали вызовы `L7` на вырожденных/смешанных гранях, покрытие `FIXED_CHANGED`, проверка допусков и формальный классификатор (`D-7`) `[S][D]`.
- **Первый известный источник:** `OMR___PHASE_2.3.3_INDEPENDENT_REVIEW...md` §4–§6; сведено в `D-7` в `OMR_REPOSITORY_AUDIT_4b3449e1.md` `[D]`.
- **Степень доказанности:** `[S]` (пробелы подтверждены в текущем `tests/metamorphic.test.ts` в AI Studio); исправление в ветке `candidate/phase-2-3-3-rework` известно только `[D]`.
- **Открытые вопросы:** перенос 47-тестовой ветки в AI Studio требует получения исходного `.ts`-файла `[E]`.

### D-8 — Необъяснённое расхождение размера JS-бандла (`562.64 kB` vs `335.25 kB`)
- **Описание:** во всех сборках AI Studio зафиксировано `562.64 kB` (`PHASE_2_3_STEP_1_REPORT.md`, `CANONICAL_BASELINE_RECOVERY_REPORT.md`, `PHASE_2_3_STEP_3_REPORT.md`), тогда как у Claude на тех же мажорных/lock-версиях (`vite 8.3.8`, `react 19.3.1`, `tailwindcss 4.3.5`, `typescript 7.0.2`) во всех трёх способах сборки получено `335.25 kB` `[S][D]`. Причина до сих пор не установлена `[D][H]`.
- **Первый известный источник:** `OMR___PHASE_2.3.3_INDEPENDENT_REVIEW...md` §6 (`D5`), детально проверено в `PHASE_2_3_STEP_3_REPORT_4f009db9.md` §4 и `OMR_REPOSITORY_AUDIT_4b3449e1.md` §6 (`D-8`) `[D]`.
- **Подтверждающие материалы:** локальные отчёты `[S]` + внешние проверки `[D]`. (Фактический `dist/` сейчас в AI Studio отсутствует `[E]`, т.к. сборка в read-only аудите не запускалась).
- **Степень доказанности:** `[S][D]` (сами числа зафиксированы в отчётах обеих сред); причина — `[H]` (не разрешено).
- **Открытые вопросы:** связано ли расхождение с минорными/патч-версиями внутри `node_modules` в контейнере AI Studio (например, `vite 8.3.8` / Rolldown minifier), с конфигурацией плагинов/источников или с содержимым дерева файлов в среде AI Studio `[H]`.

---

## 5. Сводный ответ на ключевые вопросы раздела 9 (детализация — в остальных 4 документах)

1. **Что можно восстановить достоверно:** архитектуру, контракты `src/core/*`, полную спецификацию 6 исходов Property F, хронологию, допуски, список 17 мутаций (текстовый состав) и все 4 PDF/базовые сниппеты (разграничивая `[ORIGINAL]`, `[EXTRACTED]`, `[DESCRIPTION]`) `[S][D]`.
2. **Что можно перенести без оригинального кандидатного файла:** только документальные выводы и манифесты; перенос *кода* кандидата из отчётов без оригинала запрещён и эпистемически небезопасен (точные фикстуры границы `1e-12`, невыпуклого 5-угольника, сдвигоустойчивой площади и 17 мутаций в полном теле вложениями не приложены) `[E][D]`.
3. **Завершение Phase 2.3.3 без изменения `src/core/*`:** **ДА `[S]`** — подтверждено прямым чтением `types.ts`, `operationRequest.ts`, `trace.ts`, `l2GeometryEngine.ts`, `l7IndependentVerifier.ts`.
4. **Итоговая рекомендация:** **`REQUEST ORIGINAL SOURCE`** `[P]` (обоснование — в `PHASE_2_3_3_FINALIZATION_OPTIONS.md`).
