# PHASE_2_IMPLEMENTATION_REPORT.md — Отчёт о реализации детерминированного ядра L2 ↔ L7 (Contract 02)

**Дата:** 2026-11-15  
**Статус документа `ACCEPTANCE_AUDIT_V1.md`:** сохранён без изменений.  
**Область реализации:** исключительно Contract 02 (`L2 ↔ L7`) для 2D-операции `REFLECTION_ACROSS_LINE` и структурированный журнал `TRACE` (слои `L3–L6` и 3D-кинематика не затрагивались).

---

## 1. Перечень созданных и обновлённых файлов

| Файл | Назначение |
| :--- | :--- |
| `src/core/types.ts` | Строгие типы контракта (`GeometryState`, `LineNormalParams`, `TraceEntry`, `VerifierTolerances`, `VerificationClaim`, `VerificationVerdict`). Содержит только TypeScript-типы без вычислительной логики. |
| `src/core/trace.ts` | Иммутабельное хранилище переходов (`deepFreeze`, `cloneGeometryState`, `createTraceEntry`, `appendTraceEntry`). Предотвращает мутации снимков `sourceState` и `resultingState`. |
| `src/core/l2GeometryEngine.ts` | Вычислительный модуль L2 (`createInitialGeometryState`, `reflectAcrossLine`, `L2EngineError`). |
| `src/core/l7IndependentVerifier.ts` | Полностью изолированный верификатор L7 (`verifyResult`, `verifyProcess`, `DEFAULT_VERIFIER_TOLERANCES`). Импортирует исключительно типы из `./types` (ноль импортов из L2 или `trace`). |
| `tests/contract02.test.ts` | Автоматизированный тестовый набор из 10 проверок на `node:test` + `tsx`. |
| `src/components/VerificationWorkbench.tsx` | Переработан как чистый UI-клиент к модулям `l2GeometryEngine`, `trace` и `l7IndependentVerifier` (удалены встроенная математика и хардкод вердиктов по ID кнопок). |
| `package.json` | Добавлен скрипт `"test": "tsx --test tests/*.test.ts"`. |

---

## 2. Описание алгоритмов L2 и L7 (защита от ошибки общего отказа)

### L2 — Geometry Engine (`src/core/l2GeometryEngine.ts`)
- Входные координаты хранятся в двойной точности IEEE-754 (`number`) без какого-либо округления (`.toFixed` в ядре не используется).
- Пороги точности (`epsilon`) не зашиваются в `GeometryState`.
- Для прямой $n_x x + n_y y = c$ проверяется конечность чисел и невырожденность нормали ($\|n\| > 10^{-12}$, иначе выбрасывается `L2EngineError('DEGENERATE_NORMAL')`).
- Подвижные вершины (`movingVertexIds`) преобразуются по полной аффинной формуле нормальной проекции:
  $$p' = p - 2 \frac{n \cdot p - c}{n \cdot n} n$$
- Остальные вершины (`fixedVertexIds`) копируются без изменений; `VertexID`, `EdgeID` и `FaceID` сохраняются, версия состояния увеличивается (`version + 1`), формируется замороженная запись `TraceEntry`.

### L7 — Independent Verifier (`src/core/l7IndependentVerifier.ts`)
Во избежание ошибки общего отказа (Common-Mode Risk) L7 не использует ни код L2, ни векторную проекцию нормали, а строит **независимую однородную матрицу отражения $H$ размера $3 \times 3$**:
$$H = T(p_0) \cdot R(\theta) \cdot S_y \cdot R(-\theta) \cdot T(-p_0)$$
где $p_0 = \frac{c}{\|n\|^2}(n_x, n_y)$ — ближайшая к началу координат точка прямой, а $u = (-n_y/\|n\|, n_x/\|n\|)$ — единичный направляющий вектор оси.

Автономно вычисляемые невязки (`residuals`) и предикаты (`predicates`):
1. `coordinatesMatch` (`maxCoordinateError <= epsilon`): сверка заявленных координат `movingVertexIds` с $H \cdot [x, y, 1]^T$.
2. `fixedVerticesUnchanged` (`maxFixedDisplacement <= epsilon`): контроль полной неподвижности `fixedVertexIds`.
3. `idsPreserved`: целостность множеств `VertexID`, `EdgeID`, `FaceID` и разбиения `moving`/`fixed`.
4. `lengthsPreserved` (`maxLengthError <= epsilon`): инвариантность длин всех рёбер и всех попарных расстояний внутри граней (устраняет баг `(2, 0)` из аудита V1).
5. `areaPreserved` и `orientationInverted` (`areaError <= areaEpsilon`): автономная формула Гаусса (Shoelace) и проверка смены знака ориентированной площади $\operatorname{sign}(A'_{signed}) = -\operatorname{sign}(A_{signed})$ на невырожденных подвижных гранях.
6. `axisConditionSatisfied` (`axisMidpointError`, `axisOrthogonalityError <= epsilon`): проверка, что середина $\frac{p + p'}{2}$ лежит на прямой $n \cdot x = c$, а вектор смещения $(p' - p)$ коллинеарен $n$.

Режимы и вердикты:
- `verifyResult(claim, tolerances)` — проверка конечного состояния без обязательного наличия `TRACE`.
- `verifyProcess(trace, tolerances)` — независимая перепроверка каждого перехода $S_i \to S_{i+1}$, монотонности `stepIndex` и версий, а также структурной непрерывности (`trace[i].resultingState === trace[i+1].sourceState`).
- `UNDETERMINED` возвращается строго при вырожденной нормали ($\|n\| \le \varepsilon_{zero}$), нулевой площади подвижных граней или пустом `TRACE` в режиме `verifyProcess`.

---

## 3. Перечень автоматических тестов (`tests/contract02.test.ts`)

1. `T-01`: корректное отражение треугольника относительно `x + y = 1` → `PASS` в `verifyResult` и `verifyProcess`.
2. `T-02a`: подмена координаты на `(2, 0)` (контрпример из `ACCEPTANCE_AUDIT_V1.md`) → `FAIL` по координатам, длинам, ориентации и условию оси.
3. `T-02b`: сдвиг координаты на `1e-2` → `FAIL`.
4. `T-03`: подмена параметра оси `c` после выполнения операции → `FAIL` при проверке L7.
5. `T-04`: разрыв промежуточного состояния в `TRACE` → `FAIL` в `verifyProcess` (`traceContinuous === false`), при этом `verifyResult` на корректном финальном шаге возвращает `PASS`.
6. Отражение относительно произвольной наклонной и смещённой прямой `3x - 4y = 5` (включая иррациональные/непериодические координаты без округления) → `PASS` с точностью `< 1e-13`.
7. Частичное отражение (подразделённый квадрат: `V2` в `movingVertexIds`, `V0/V1/V3` в `fixedVertexIds`) → `PASS`, а при сдвиге фиксированной вершины на `1e-3` → `FAIL`.
8. Вырожденные входные данные: `||n|| = 0` (`L2EngineError('DEGENERATE_NORMAL')` в L2, `UNDETERMINED` в L7), коллинеарный треугольник нулевой площади (`UNDETERMINED`), пустой `TRACE` (`UNDETERMINED`).
9. Граничные тесты точности при `epsilon = 1e-7`: возмущение `5e-8` → `PASS`, возмущение `5e-7` → `FAIL`.
10. Иммутабельность `TRACE` (`Object.isFrozen`) и проверка изоляции исходного кода `l7IndependentVerifier.ts` (отсутствие импортов `l2GeometryEngine` и `trace`).

---

## 4. Фактический лог выполнения тестов, линтинга и сборки

### `npm test` (`tsx --test tests/*.test.ts`)
```text
TAP version 13
# Subtest: T-01: Correct reflection of triangle across x + y = 1 passes Result & Process verification
ok 1 - T-01: Correct reflection of triangle across x + y = 1 passes Result & Process verification
# Subtest: T-02a: Corrupted coordinate (2, 0) counterexample is rejected with FAIL by L7
ok 2 - T-02a: Corrupted coordinate (2, 0) counterexample is rejected with FAIL by L7
# Subtest: T-02b: Coordinate shifted by 1e-2 is rejected with FAIL
ok 3 - T-02b: Coordinate shifted by 1e-2 is rejected with FAIL
# Subtest: T-03: Post-operation tampering of axis parameters (n or c) fails L7 verification
ok 4 - T-03: Post-operation tampering of axis parameters (n or c) fails L7 verification
# Subtest: T-04: Sequence/state discontinuity in TRACE fails verifyProcess while valid final claim passes verifyResult
ok 5 - T-04: Sequence/state discontinuity in TRACE fails verifyProcess while valid final claim passes verifyResult
# Subtest: Arbitrary oblique shifted line (3x - 4y = 5): L2 & L7 agree analytically to IEEE-754 precision
ok 6 - Arbitrary oblique shifted line (3x - 4y = 5): L2 & L7 agree analytically to IEEE-754 precision
# Subtest: Partial reflection: movingVertexIds reflect while fixedVertexIds remain stationary
ok 7 - Partial reflection: movingVertexIds reflect while fixedVertexIds remain stationary
# Subtest: Degenerate inputs return explicit error in L2 and UNDETERMINED in L7
ok 8 - Degenerate inputs return explicit error in L2 and UNDETERMINED in L7
# Subtest: Numerical tolerance boundary: perturbation inside epsilon passes, outside fails
ok 9 - Numerical tolerance boundary: perturbation inside epsilon passes, outside fails
# Subtest: TRACE immutability & L7 architectural isolation from L2/TRACE
ok 10 - TRACE immutability & L7 architectural isolation from L2/TRACE
1..10
# tests 10
# pass 10
# fail 0
```

### `npm run lint` (`tsc --noEmit`) и `npm run build` (`vite build`)
- `tsc --noEmit`: завершился с кодом `0`, ошибок типизации нет.
- `vite build`: сборка клиента завершена успешно.
