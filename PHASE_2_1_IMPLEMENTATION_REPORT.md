# PHASE 2.1 — IMPLEMENTATION REPORT
## Certifying `ReflectionWitness` & Axiomatic `L7` Verifier (Inter-Module Contract 02 v2)

**Статус:** Реализовано и верифицировано (`npm test`: 13/13 PASS, `tsc --noEmit`: 0 ошибок, `vite build`: успешно).  
**Контракт:** `INTER-MODULE CONTRACT 02 (v2): L2 ↔ L7` (парадигма **Certifying Algorithms**).  
**Сохранённые артефакты:** `ACCEPTANCE_AUDIT_V1.md`, `PHASE_2_IMPLEMENTATION_REPORT.md`, `RESEARCH_INTEGRATION_V1.md` оставлены без изменений.

---

## 1. Перечень изменённых файлов

| Файл | Назначение изменений |
|---|---|
| `src/core/types.ts` | Добавлен `stateId` в `GeometryState`; определены `ReflectionWitness`, `ReflectionWitnessVertexPair`, `ReflectionWitnessClaimedResiduals`; поле `witness: ReflectionWitness` добавлено в `TraceEntry` и `VerificationClaim`; `VerificationResiduals` и `VerificationPredicates` переведены на аксиоматическую модель (`midpointError`, `collinearityError`, `witnessBound`, `axiomsSatisfied`). |
| `src/core/trace.ts` | Обновлён `cloneGeometryState` для сохранения `stateId`; добавлен `cloneReflectionWitness` с глубокой заморозкой (`deepFreeze`); `createTraceEntry` принимает и замораживает `witness: ReflectionWitness`. |
| `src/core/l2GeometryEngine.ts` | `createInitialGeometryState` генерирует/валидирует `stateId`; `reflectAcrossLine` выполняет полную аффинную проекцию $p' = p - 2\frac{n \cdot p - c}{n \cdot n}n$ в IEEE-754 без `.toFixed()`, формирует и возвращает глубоко замороженный `witness: ReflectionWitness` (включая точные пары `(p, p')` и необязательную диагностику `claimedResiduals`), а также записывает `witness` в `TraceEntry`. |
| `src/core/l7IndependentVerifier.ts` | Полностью удалена 3×3 однородная матрица отражения $H$ (`Matrix3x3`, `matMul3x3`, `applyHomogeneous3x3`, `buildHomogeneousReflectionMatrix`) и любой пересчёт координат решателем. Реализована 4-этапная аксиоматическая верификация `ReflectionWitness` (`verifyResult` и `verifyProcess`) при полном игнорировании `witness.claimedResiduals`. |
| `tests/contract02.test.ts` | Реализованы все 10 обязательных приёмочных сценариев Phase 2.1 + проверки дублей/пропусков ID, `NaN`/`Infinity`, граничных допусков $\varepsilon$, непрерывности `TRACE`, глубокой иммутабельности и статической изоляции L7. |
| `src/components/VerificationWorkbench.tsx` | UI-клиент обновлён для отображения `ReflectionWitness` (`witnessId`, привязка `stateId@version`, пары `(p → p')`, необязательные недоверенные `L2 claimedResiduals`) отдельно от независимо вычисленных L7 `midpointError`, `collinearityError`, метрик области действия и вердикта. |

---

## 2. Математическое обоснование независимости L7 (без повторения алгоритма L2)

В Phase 2 L7 строил 3×3 матрицу $H = T(p_0) R(\theta) S_y R(-\theta) T(-p_0)$ и фактически пересчитывал образ $p'_{\text{expected}} = H p$ (вторичный решатель). В Phase 2.1 L7 полностью отказался от вычисления образа $p'$ и перешёл к **прямой аксиоматической проверке свидетельства `ReflectionWitness`**.

### 2.1 Масштаб-инвариантные аксиомы отражения

Для каждой пары $(p, p')$ из `movingVertexIds` относительно прямой $n \cdot x = c$, $n = (n_x, n_y)$, $\|n\| = \sqrt{n_x^2 + n_y^2} > \varepsilon_{\text{zero}}$ (вычисляется через `Math.hypot(nx, ny)` для защиты от переполнения), L7 независимо вычисляет две нормированные невязки:

1. **Евклидово отклонение середины отрезка $[p, p']$ от оси отражения:**
   $$r_{\text{mid}}(p, p') = \frac{|n \cdot (p + p') - 2c|}{2\|n\|}$$
2. **Евклидово отклонение вектора смещения $(p' - p)$ от нормали $n$ (коллинеарность / ортогональность касательной):**
   $$r_{\text{perp}}(p, p') = \frac{|(p'_x - p_x)n_y - (p'_y - p_y)n_x|}{\|n\|}$$

### 2.2 Доказательство полноты (отсутствие потребности в решателе)

Разложим разность $p' - p'_{\text{exact}}$ в ортонормированном базисе $\{\hat{n}, \hat{t}\}$, где $\hat{n} = n / \|n\|$ и $\hat{t} = (-n_y, n_x) / \|n\|$. Поскольку $p'_{\text{exact}} = p - 2\left(\frac{n \cdot p - c}{\|n\|}\right)\hat{n}$:
- проекция ошибки на $\hat{n}$ равна $\frac{n \cdot (p + p') - 2c}{\|n\|} = \pm 2\,r_{\text{mid}}$;
- проекция ошибки на $\hat{t}$ равна $\frac{(p' - p) \cdot \hat{t}}{1} = \pm r_{\text{perp}}$.

Следовательно, выполняется точное геометрическое тождество:
$$\|p' - p'_{\text{exact}}\|_2 = \sqrt{4\,r_{\text{mid}}^2 + r_{\text{perp}}^2}$$

Таким образом, проверка $r_{\text{mid}} \le \varepsilon$ и $r_{\text{perp}} \le \varepsilon$ математически гарантирует $\|p' - p'_{\text{exact}}\|_2 \le \sqrt{5}\,\varepsilon$ **без повторного запуска проекционной формулы L2 или построения 3×3 матрицы**. Обе невязки инвариантны к одновременному масштабированию $(n, c) \mapsto (\alpha n, \alpha c)$ при $\alpha \neq 0$.

---

## 3. Четырёхэтапный конвейер верификации L7

1. **Этап A — Валидация допустимости входа (`UNDETERMINED`):**  
   Проверка конечности всех IEEE-754 чисел (`Number.isFinite`) в параметрах оси, версиях состояний, координатах вершин `sourceState`/`resultingState` и всех парах `witness.vertexPairs`, а также проверка $\|n\| > \varepsilon_{\text{zero}}$ (как для `claim.parameters.line`, так и для `witness.axis.n`). При `NaN`/`Infinity` или $\|n\| \le \varepsilon_{\text{zero}}$ возвращается `status: 'UNDETERMINED'`.
2. **Этап B — Трёхсторонняя привязка свидетельства (`FAIL` при нарушении):**  
   - Проверка `witness.sourceStateId === sourceState.stateId`, `witness.targetStateId === resultingState.stateId`, `sourceStateVersion`, `targetStateVersion` и строгого роста версии (`targetStateVersion > sourceStateVersion`, `sourceStateId !== resultingStateId`).
   - Проверка совпадения `witness.axis` и `claim.parameters.line`.
   - Проверка точного сохранения множества `VertexID`, `EdgeID`, `FaceID` без дубликатов и пропусков, а также строгого дизъюнктного разбиения всех вершин на `movingVertexIds` и `fixedVertexIds`.
   - Проверка биекции `witness.vertexPairs` на `movingVertexIds`, точного совпадения `pair.p` с `sourceState` и согласованности `pair.pPrime` с `resultingState` в пределах $\varepsilon$.
   - Проверка неподвижности всех вершин из `fixedVertexIds` ($\|p' - p\|_2 \le \varepsilon$).
   - **Zero-Trust:** поле `witness.claimedResiduals` полностью игнорируется.
3. **Этап C — Проверка аксиом отражения (`axiomsSatisfied`):**  
   Вычисление `midpointError` и `collinearityError` как максимумов $r_{\text{mid}}$ и $r_{\text{perp}}$ по состояниям и `witness.vertexPairs`.
4. **Этап D — Инварианты с учётом области действия (Scope-Aware):**  
   - **Чисто движущиеся элементы** (все вершины ребра/грани в `movingVertexIds`): проверка сохранения длин $|L' - L| \le \varepsilon$ (включая все попарные хорды граней), сохранения $|S|$ ($||S'| - |S|| \le \varepsilon_{\text{area}}$) и строгой инверсии знака ориентированной площади ($\operatorname{sign}(S') = -\operatorname{sign}(S)$ для невырожденных граней с $|S| > \varepsilon_{\text{degArea}}$). Если все чисто движущиеся грани имеют нулевую площадь и отсутствуют жёсткие ошибки (`anyHardFailure === false`), возвращается `UNDETERMINED`; ошибка на невырожденной грани никогда не маскируется.
   - **Чисто фиксированные элементы** (все вершины в `fixedVertexIds`): проверка сохранения длин и площади.
   - **Пограничные / смешанные рёбра и грани** (вершины разделены между `movingVertexIds` и `fixedVertexIds`): намеренно **не проверяются** на жёсткость, чтобы допускать корректное частичное отражение с изменением пограничных рёбер.
5. **`verifyProcess(trace)`:**  
   Для каждого шага $S_i \to S_{i+1}$ проверяет наличие `entry.witness`, совпадение `entry.operationId === entry.witness.operationId`, согласованность `stateId`/`version`, строгий рост `stepIndex`, структурную непрерывность `trace[i-1].resultingState === trace[i].sourceState` и запускает аксиоматический `verifyResult` со встроенным свидетельством.

---

## 4. Фактический лог тестов и сборочных проверок

### 4.1 `npm test` (`tsx --test tests/*.test.ts`)

```text
> react-example@0.0.0 test
> tsx --test tests/*.test.ts

TAP version 13
ok 1 - 1. Valid reflection with ReflectionWitness passes Result & Process verification
ok 2 - 2a. Corrupted result coordinate (2, 0) counterexample is rejected with FAIL by L7
ok 3 - 2b. Result coordinate shifted by 1e-2 is rejected with FAIL
ok 4 - 3. Tampered sourceState (mismatch between sourceState and witness) fails with witnessBound=false
ok 5 - 4. Tampered axis parameters (n or c) in witness or claim fails L7 verification
ok 6 - 5. Tampered movingVertexIds (reclassifying moving vertex as fixed or omitting vertex) fails L7
ok 7 - 6. Forged claimedResiduals=0 cannot fool L7 when coordinates are invalid
ok 8 - 7. Scale invariance of reflection axis: multiplying n and c by 1e6 passes cleanly
ok 9 - 8. Partial reflection allows boundary edge stretching while enforcing rigidity on purely moving & purely fixed subgraphs
ok 10 - 9. Degenerate inputs: ||n|| = 0 and NaN/Infinity return UNDETERMINED in L7 without masking real FAILs
ok 11 - 10. Broken link between witness and stateId / stateVersion returns FAIL
ok 12 - 11. TRACE discontinuity, duplicate IDs, tolerance boundaries, and IEEE-754 precision
ok 13 - 12. Deep immutability & L7 architectural isolation (no L2 imports, no 3x3 matrix solver)
1..13
# tests 13
# pass 13
# fail 0
```

### 4.2 TypeScript & Vite Build

- `tsc --noEmit` (`lint_applet`): **завершено успешно (0 ошибок)**.
- `vite build` (`compile_applet`): **сборка выполнена успешно**.

---

## 5. Ограничения и открытые вопросы для следующих фаз

1. **IEEE-754 в экстремальных масштабах (Phase 2.2+):** Нормированные аксиомы $r_{\text{mid}}$ и $r_{\text{perp}}$ инвариантны к масштабу $(n, c)$ и защищены от квадратичного переполнения через `Math.hypot`, но при композиции последовательных отражений и очень больших сдвигах ($|c| \gg 10^{10}$) возникает катастрофическое сокращение мантиссы; для таких режимов потребуется интервальная или точная рациональная арифметика (`BigInt`).
2. **Область видимости пограничных граней при частичном отражении:** В текущей модели смешанные грани (содержащие как движущиеся, так и фиксированные вершины) исключаются из проверок жёсткости и ориентации, что необходимо для частичных трансформаций с растяжением связок. Если в будущей фазе потребуется различать «жёсткое складывание вдоль реального сгиба на оси» (где фиксированные вершины лежат на оси сгиба $n \cdot x = c$) и «произвольное частичное отражение подграфа», стоит ввести явный тип `HingeConstraint` в контракте Phase 2.2/2.3.
3. **Криптографическая привязка `TRACE` (Phase 2.3):** Привязка `sourceStateId`/`targetStateId` и `witnessId` пока является структурной и работает в памяти; канонизация RFC 8785 (JCS) и хеш-цепочка SHA-256 запланированы в следующей фазе.
