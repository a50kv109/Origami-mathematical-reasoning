# OMR — Architecture Open Questions Register (`OMR_ARCHITECTURE_OPEN_QUESTIONS.md`)

**Версия:** Architecture Evolution Package v1.0 (Phase G)  
**Принцип:** Все нерешённые вопросы переносятся точно по источникам без додумывания готовых ответов. Каждому вопросу сохранён статус `UNRESOLVED` (или открытый исследовательский статус `[O]`).

---

## 1. Открытые вопросы эпистемического вектора и интерфейсов (`EV-*`, `LC-*`, `IC-*`)

| ID / Тема | Формулировка вопроса | Источник | Статус |
| :- | :--- | :--- | :- |
| **`EV-U01`** | Унификация значения `M_OMR` для наблюдаемой 3D-формы без 2D-трассы `L2`: свести ли `OBSERVED_ONLY` (упомянуто в `Audit v1.0 §5`) к `UNDETERMINED` / `NOT_APPLICABLE` или выделить формально отдельно? | `OMR_CROSS_ARCHITECTURE_AUDIT.md` (§5), `OMR_EPISTEMIC_VECTOR_SPECIFICATION.md` (§1, §7) | `UNRESOLVED` |
| **`EV-U02`** | Является ли `Multi-Part Enclosure` (парадигма `D` в `MCAR`) самостоятельным значением оси `C_MCAR` (`VERIFIED_MULTI_PART_ENCLOSURE`) или структурным подтипом внутри `VERIFIED_MODULAR` / `VERIFIED_HYBRID`? | `MCAR_RESEARCH_REPORT.md` (§2), `OMR_EPISTEMIC_VECTOR_SPECIFICATION.md` (§2.2, §7) | `UNRESOLVED` |
| **`EV-U03`** | Как согласовать удаление или переклассификацию легаси-статуса `MATHEMATICALLY_VALID` из 5-элементного перечня `PWRP-10`, чтобы не дублировать ось `M_OMR`? | `PWRP_V1_1_PATTERN_CATALOG.md` (`PWRP-10`), `OMR_EPISTEMIC_VECTOR_SPECIFICATION.md` (§2.3, §7) | `UNRESOLVED` |
| **`OQ-MCP-MATRIX`** | Требуется формальная проверка и утверждение полной матрицы допустимых и запрещённых комбинаций `(M_OMR, C_MCAR, P_PWRP-10)` (вкл. правила агрегирования `BranchVerdicts` при частичном опровержении гипотез). | `OMR_EPISTEMIC_VECTOR_SPECIFICATION.md` (§3), `OMR_INTERFACE_CONTRACT_AUDIT.md` (§6) | `UNRESOLVED` |
| **`OQ-UNKNOWN-SEM`** | Требуется точная формализация двухуровневой семантики `UNKNOWN` (на уровне отдельных полей `MCAR` / паспортов материалов vs на уровне компонент вектора `M/C/P`) и правил наследования `UNKNOWN` при композиции подсборок. | `MCAR_PATTERN_PASSPORT.md` (§5), `OMR_EPISTEMIC_VECTOR_SPECIFICATION.md` (§4) | `UNRESOLVED` |
| **`LC-U01`** | Каким должен быть формальный алгоритм канонизации `partitionEquivalenceClass` для произвольной 3D-формы до появления графа `L1` и 3D-геометрии? | `OMR_REASONING_LOOP_CONTROL_SPECIFICATION.md` (§2.1, §4) | `UNRESOLVED` |
| **`LC-U02`** | Каковы обоснованные границы счётчиков `RETURN_DEPTH` (`maxModeSwitchBacktracks`, `maxJointRevisionBacktracks`) и критерии остановки многошагового пересмотра гипотез? | `OMR_REASONING_LOOP_CONTROL_SPECIFICATION.md` (§2.4, §4) | `UNRESOLVED` |
| **`OQ-HYP-ID`** | Формальная идентификация конструктивных гипотез и **строгое разделение `STRUCTURAL_SIGNATURE` (состав компонентов и топология их связей) и `CONFIGURATION_SIGNATURE` (конкретные параметры швов, `JOINING_METHOD`, порядок сборки, допуски)** в `BRANCH_IDENTITY` пока не определены. | Задание консолидации (`Phase G`), развитие `BRANCH_IDENTITY` в `OMR_REASONING_LOOP_CONTROL_SPECIFICATION.md` | `UNRESOLVED` |
| **`OQ-L7-SCOPE`** | Каковы точные границы применимости сохранённых математических результатов `L7` (`preservedValidSubResults`) при *частичном* изменении 2D/3D геометрии компонента во время пересмотра гипотезы (например, добавлении клапана на границу уже проверенной панели)? | `OMR_INTERFACE_CONTRACT_AUDIT.md` (§4.2, §6) | `UNRESOLVED` |
| **`OQ-ACCUM-COMP`** | Разделение `LAYER_ACCUMULATION` и `MODULE_TOLERANCE_ACCUMULATION` предложено на уровне схемы `AccumulationRecord`, но формальная модель их совместной композиции в `HYBRID_STACK` (без произвольных числовых порогов) не определена. | `OMR_INTERFACE_CONTRACT_AUDIT.md` (§5, §6) | `UNRESOLVED` |
| **`OQ-EXCHANGE-SCHEMAS`** | Точные формальные схемы (структуры/контракты) обмена данными между будущими подсистемами `MCAR ↔ OMR ↔ PWRP` требуют отдельного проектирования и валидации на примерах до любой кодовой реализации. | `OMR_INTERFACE_CONTRACT_AUDIT.md` (§2–4, §7) | `UNRESOLVED` |

---

## 2. Открытые вопросы конструктивного рассуждения (`MCAR-O01` — `MCAR-O06`)

Перенесены из `MCAR_RESEARCH_REPORT.md` (§7):
- **`MCAR-O01`:** Граница между однолистовым киригами с самозацеплением (*tab-and-slot*) и модульной сборкой (`Self-Joining Single-Piece`). (`UNRESOLVED`)
- **`MCAR-O02`:** Представление мультикомпонентных сборок (`ComponentId`, `JointId`) на уровне будущего топологического слоя `L1` (Phase 3) без нарушения чистоты 2D `GeometryState` и запрета монолитного кортежа (`docs/ARCHITECTURE.md §1`). (`UNRESOLVED`)
- **`MCAR-O03`:** Оценка жёсткости и устойчивости *частично собранной* модульной конструкции на промежуточных шагах `ASSEMBLY_SEQUENCE`. (`UNRESOLVED`)
- **`MCAR-O04`:** Минимальные наблюдаемые признаки, позволяющие при слепом осмотре достоверно сужать `HYPOTHESIS_SET` без разрушения объекта. (`UNRESOLVED`)
- **`MCAR-O05`:** Моделирование временной деградации небумажных соединительных материалов (высыхание клея, ползучесть ленты) в увязке с `PWRP-13/14`. (`UNRESOLVED`)
- **`MCAR-O06`:** Необходимость композитного манифеста сборки поверх `.fold` в будущем `Tool Integration Layer`. (`UNRESOLVED`)

---

## 3. Открытые вопросы физического рассуждения (`PWRP-O01` — `PWRP-O13`)

Перенесены из `PWRP_OPEN_QUESTIONS.md` и `PWRP_V1_1_CHANGELOG.md` (§3):
- **`PWRP-O01..O04` (Физика материала и слоёв):** эффективная сжимаемая толщина пакета $T_{\text{eff}}(n, t, F_{\text{press}})$; граница пластического шарнира vs гладкой дуги; переход между проскальзыванием $\sim n$ и монолитом $\sim n^3$; топологические запреты ненулевой толщины в многовершинных узлах степени $\ge 4$. (`UNRESOLVED`)
- **`PWRP-O05..O06` (Метрология):** композиция $\tau_{\text{material}}$ и $\tau_{\text{fabrication}}$ вдоль трассы; протоколы калибровки материалов без универсальных «магических констант». (`UNRESOLVED`)
- **`PWRP-O07..O10` (Интеграция и `L3`):** граница между качественным `AI Skill` и формальным физическим решателем; достаточность скаляра $n(x)$ vs полного Z-графа из `L3`; сохранность $\tau_{\text{geometry}}$ в `Phase 2.3.3/2.4`. *(Примечание: `PWRP-O09` о равновесии/устойчивости проработан предложением `PWRP-11/12` в `v1.1`, но канонизация `v1.1` не завершена.)* (`UNRESOLVED`)
- **`PWRP-O11..O13` (Эволюция `v1.1`):** статус `PWRP-05` за пределами изгибных систем (3D ЧПУ-галтели); расчётные интерфейсы 4 субмеханизмов `PWRP-13`; формализация направленных причинных цепочек (*Physical Causal Pattern Network*). (`UNRESOLVED`)

---

## 4. Открытые вопросы математического ядра и смежных треков (`OMR Core` и `Phase 2.3.3`)

- **`R-01 / OMR Core` (`README.md`, `docs/ARCHITECTURE.md`):** формализация `CAPABILITY_GAP` в `VerificationStatus`, реализация `Contract 01 (L1 ↔ L2)`, интервальной / `BigInt`-арифметики (`Phase 2.4`), криптографической привязки `TRACE` (`JCS + SHA-256`) и `L3–L6`. (`UNRESOLVED`)
- **`R-02 / Phase 2.3.3` (`PHASE_2_3_3_AUDIT_FINDINGS_RESOLUTION.md`):** ожидание явного разрешения владельца `ROD-03` на реализацию `tests/propertyF_v1.test.ts`; стандартизация `Face2D.vertexIds` (`AUD-C01`) для Contract 02 v3; вынесенные технические расследования `D-3` (`normSq = Infinity` в `L2`), `D-8` (размер JS-бандла) и `OD-05` (`public/assets/aistudio/`). (`UNRESOLVED`)
- **`R-05 / Концептуальная перспектива`:** допустимость и границы переноса трёхосевой схемы (Происхождение $\to$ Поведение $\to$ Корректность) в формализм `SOL` (`OBJECT`, `RELATION`, `CONSTRAINT`, `STATE`) и вопрос о систематизации базовых способов инженерного мышления. (`UNRESOLVED` / исследовательская гипотеза)
