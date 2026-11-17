# Passport: `Property F Test Layer v1` (`PROPERTY_F_TEST_LAYER_V1.md`)

**Идентификатор артефакта:** `Property F Test Layer v1` (Passport v1.2 — Audit Findings Corrected)  
**Происхождение:** **Specification-Based Reimplementation in AI Studio (Вариант B)** `[P]`.  
**Отказ от ложной атрибуции:** Данный тестовый слой является **самостоятельной разработкой** по спецификациям AI Studio и коду `src/core/*`. Он **НЕ является** копией или производной версией `tests/metamorphic.test.ts` из внешней ветки `candidate/phase-2-3-3-rework` (Claude) `[E]`. Метрики внешней ветки (`47` тестов, `16/17` мутаций) к этому слою **не применяются**.

---

## 1. Назначение
`Property F Test Layer v1` представляет собой отдельный эпистемический слой проверки геометрических утверждений (**Property F: Orientation Reversal Under Reflection**) поверх неизменного движка `L2`, контрактного верификатора `L7` и побайтово замороженной базы из **36** действующих тестов (`19 contract02 + 17 metamorphic`) `[S][P]`.

## 2. Математическая модель и политики допусков
1. **Теорема счёта ориентированной площади:** Для простого многоугольника $F = (p_0, \dots, p_{k-1})$ ($k \ge 3$) при отражении $H \in O(2), \det(H) = -1$:
   $$A(H(F)) = -A(F) \quad \text{и} \quad |A(H(F))| = |A(F)|.$$
2. **Трансляционно-устойчивый расчёт площади оракула:**
   $$A_{\text{centered}}(F) = \frac{1}{2}\sum_{i=0}^{k-1} \big((x_i-x_0)(y_{i+1}-y_0) - (x_{i+1}-x_0)(y_i-y_0)\big).$$
3. **Критерий неизменности `ALL_FIXED` (`AUD-A02`):**
   $$\max_i \|p_i^{S_1} - p_i^{S_0}\|_2 \le \tau_{\text{coord}} = 10^{-12} \implies \text{FIXED\_UNCHANGED}, \quad \text{иначе} \implies \text{FIXED\_CHANGED}.$$
   Площадь грани не участвует в принятии решения по `ALL_FIXED` (сохраняется только в диагностике Level 3).
4. **Две независимые политики допусков (`OD-02`, `AUD-D01`):**
   - **Политика тестового оракула:** $\tau_{\text{coord}} = 10^{-12}$ (евклидова норма), масштабируемый допуск площади $\tau_{\text{area}}(A_0) = 10^{-12}\cdot\max(1,|A_0|)$, вырожденность $|A_0| \le 10^{-12}$.
   - **Контрактная политика `L7`:** `epsilon = 1e-7`, абсолютный `areaEpsilon = 1e-7`, `degenerateAreaEpsilon = 1e-12`.
   - Полоса расхождения $(10^{-12}\cdot\max(1,|A_0|),\; 10^{-7}]$ действует в области $|A_0| \le 10^5$ (при $|A_0| > 10^5$ абсолютный `L7.areaEpsilon` становится строже масштабируемого допуска оракула).

## 3. Шестиуровневая архитектура (`Level 0 — Level 5`)
- **Level 0 — `Input Integrity Guard`:** разделён на **0A** (граф-уровень: уникальность ID вершин в `source`/`result`, непересечение `movingIds ∩ fixedIds = ∅`, отсутствие пропавших вершин в `result`) и **0B** (грань-уровень: непустота `vertexIds`, существование вершин, локальный запрет повторов `OD-01C`).
- **Level 1 — `PartitionClass`:** `'ALL_MOVING' | 'ALL_FIXED' | 'MIXED'` строго по `VertexId`.
- **Level 2 — `GeometryDegeneracy`:** `'NON_DEGENERATE' | 'DEGENERATE'` строго по $S_0$ (`k < 3 || |A_0| <= 1e-12`).
- **Level 3 — `FaceGeometricObservation`:** чистые метрики $S_0 \to S_1$; `postReflectionCollapse` использует статус Level 2 без отдельной зашитой константы; `withinOracleFixedCoordTol` проверяет только евклидовы координаты.
- **Level 4 — `PropertyApplicability`:** приоритет `MIXED` $\to$ `ALL_FIXED` $\to$ `ALL_MOVING + DEGENERATE` $\to$ `ALL_MOVING + NON_DEGENERATE`.
- **Level 5 — `PropertyOutcome`:** `HOLDS | VIOLATION | FIXED_UNCHANGED | FIXED_CHANGED | MIXED_NOT_APPLICABLE | DEGENERATE_NOT_EVALUATED`.

## 4. Границы контракта `Face2D` / `GeometryState` (`AUD-C01`)
Действующие типы `Face2D` (`src/core/types.ts:29-32`) и валидация `L2`/`L7` не запрещают замыкающий повтор первой вершины (`['A','B','C','A']`) и не проверяют пустоту `face.vertexIds` (`L7:852` делает `continue`). Запрет повторов и пустой грани на Level 0 является **строгим локальным предусловием `Property F Test Layer v1`** (`OD-01C`, `OD-01D`), а стандартизация формата `Face2D.vertexIds` вынесена в открытый вопрос **Contract 02 v3 / Phase 2.4**.

## 5. Источники спецификации и матрица тестов
- Контракт и жизненный цикл Characterization Tests: `PHASE_2_3_3_REIMPLEMENTATION_SPEC.md`.
- Матрица тестов (8 категорий, включая 15 мутаций в 5 классах): `PHASE_2_3_3_TEST_MATRIX_V2.md`.
- Реестр решений и остаточных ворот: `PHASE_2_3_3_OWNER_DECISIONS.md`.
- Аудит и таблица закрытия замечаний: `PHASE_2_3_3_PRE_IMPLEMENTATION_AUDIT.md`, `PHASE_2_3_3_AUDIT_FINDINGS_RESOLUTION.md`.

## 6. Ограничения независимости оракула
Независимость оракула — **архитектурная (программная изоляция)**, но не математическая (используется та же плоская 2D-модель Гаусса, что и в `L7`). Мутационное тестирование (15 мутаций) спроектировано, но **ещё не выполнялось**.

## 7. Каталог известных дефектов (`D-1` — `D-8`)
- **В контуре Property F Characterization:** `D-1` (нецентрированная площадь `L7`), `D-2` (абсолютный порог `1e-12`), `D-4` (наследование `areaEpsilon ?? epsilon` в `L7:59`), `D-5` (вакуумный `L7 PASS` при 0 невырожденных moving-граней), `D-7` (допускная полоса `OD-02`).
- **Исключены из Property F в отдельные технические исследования (`AUD-E01`):** `D-3` (переполнение `normSq` в `L2`), `D-8` (размер JS-бандла) и `D-6` (отдельная архивация `public/assets/aistudio/` по `OD-05`).
