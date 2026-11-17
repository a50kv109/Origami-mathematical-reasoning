# OMR — Reasoning Loop Control Specification (`OMR_REASONING_LOOP_CONTROL_SPECIFICATION.md`)

**Версия:** Interface Contract Audit v1.0 (проектная спецификация управления возвратами рассуждений; программный код и `L1–L7` **не изменялись**).  
**Цель (Задача 5):** Формализовать механизмы предотвращения циклического рассуждения и повторного перебора эквивалентных/опровергнутых гипотез: `BRANCH_IDENTITY`, `REJECTION_RECORD`, `REOPEN_CONDITION`, `RETURN_DEPTH`, `LOOP_DETECTION`.

**Обозначения статуса:** `EXISTING` | `DERIVED` | `PROPOSED` | `UNRESOLVED`.

---

## 1. Аудит исходного состояния в `OMR_REASONING_FLOW_PROPOSAL.md`

В `OMR_REASONING_FLOW_PROPOSAL.md` (§3, Ситуация 5) уже сформулированы 5 защитных принципов:
- `No-Reopen Rule` (`DERIVED` основа для `REJECTION_RECORD` + `REOPEN_CONDITION`);
- ограниченный бюджет гипотез (макро-классы вместо $N!$ перестановок);
- немедленный стоп при критическом `UNKNOWN`;
- `Max Backtrack Depth = 1` (`EXISTING` в Flow Proposal);
- запрет использовать `L2` как переборщик гипотез.

**Выявленный пробел (замечание владельца §2.B):** одного счётчика глубины `Max Backtrack Depth = 1` недостаточно — без уникальной идентичности ветки (`BRANCH_IDENTITY`), протокола причины отказа (`REJECTION_RECORD`) и формального условия переоткрытия (`REOPEN_CONDITION`) агент может:
1. перебирать геометрически эквивалентные перестановки под видом «новой ветки»;
2. бесконечно переключаться между двумя способами соединения (`M4a ↔ M4b`);
3. терять историю того, какие гипотезы уже проверены при появлении новых данных от пользователя.

---

## 2. Формальная спецификация пяти механизмов контроля

### 2.1. `BRANCH_IDENTITY` *(Статус: `PROPOSED`)*
Каждая исследуемая конструктивная ветка получает уникальную структурированную идентичность, не сводимую к одному названию макро-режима (`Single-Piece` / `Modular` / `Hybrid`):

```text
BranchIdentity := {
  branchId:                  string,          // Уникальный ID экземпляра ветки в сессии
  generation:                number,          // Номер попытки (0 — первичная, >=1 — после легального Reopen)
  canonicalSignature:        CanonicalBranchSignature
}

CanonicalBranchSignature := {
  constructionMode:          'SINGLE_PIECE' | 'MODULAR' | 'HYBRID' | 'MULTI_PART_ENCLOSURE',
  partitionEquivalenceClass: string,          // Каноническое описание разбиения на COMPONENTS (инвариантное к нумерации C1..Ck)
  jointMethodProfile:        string,          // Каноническая карта JointClass -> JOINING_METHOD (или 'UNKNOWN')
  sequenceEquivalenceClass:  string | 'UNKNOWN' // Класс частичного порядка сборки (напр. порядок замыкания полости)
}
```

- **Ключевое свойство:** два геометрически одинаковых варианта оболочки (`M4`), у которых различается `jointMethodProfile` (`POCKET_FLAP` vs `ADHESIVE`), имеют **разные `canonicalSignature`** (это разные конструктивные решения). Напротив, простая перенумерация одинаковых модулей (`C1 ↔ C2`) даёт **ту же самую `canonicalSignature`**.

### 2.2. `REJECTION_RECORD` *(Статус: `DERIVED` от `REFUTED_BY_PHYSICS` + `PROPOSED` схема)*
Опровергнутая ветка никогда не удаляется бесследно — для неё создаётся неизменяемая запись отклонения:

```text
RejectionRecord := {
  rejectionId:               string,
  branchId:                  string,
  canonicalSignature:        CanonicalBranchSignature,
  rejectedAtStage:           'HYPOTHESES' | 'DECOMPOSITION' | 'JOINTS' | 'MATH_L7' | 'PHYSICS_PWRP' | 'ASSEMBLY_PLAN',
  rejectingSubsystem:        'MCAR' | 'OMR_L7' | 'PWRP',
  violatedConstraintIds:     string[],        // Напр.: ['PWRP-12', 'PWRP-04'] или ['MCAR-CLOSURE'] или ['L7-AXIOM']
  rejectionReason:           string,          // Чёткая формулировка физического/конструктивного/математического отказа
  evidenceSnapshotHash:      string,          // Фиксация набора входных фактов, при которых получен отказ
  preservedValidSubResults:  string[],        // Ссылки на L7 PASS подкомпонентов, которые НЕ аннулируются (Задача 4)
  reopenConditions:          ReopenCondition[]
}
```

### 2.3. `REOPEN_CONDITION` *(Статус: `PROPOSED`)*
Отклонённая запись может быть рассмотрена повторно **только** при выполнении хотя бы одного явно заданного предиката из привязанного к `RejectionRecord` списка `reopenConditions`:

| Код `ReopenCondition` | При каких отказах выставляется | Какое новое доказательство требуется для переоткрытия |
| :--- | :--- | :--- |
| `NEW_MATERIAL_SPEC` | Отказ по `PWRP-01 / 02 / 06 / 13 / 14` | Пользователь передал иной материал или подтверждённые пределы ($\varepsilon_{\max}, R_{\min}, E$, прочность адгезии). |
| `NEW_JOINT_OR_ACCESS_SPEC` | Отказ по `MCAR` / `PWRP-08 / 09` (закрытие доступа, неизвестный шов) | Изменён `JOINING_METHOD` (напр. внутренний шов $\to$ внешний клип), добавлено тех. окно или инструмент. |
| `RELAXED_EXECUTION_PARAMS` | Отказ по `PWRP-03 / 07 / 09` | Изменены целевые зазоры, допуски изготовления $\tau_{\text{fabrication}}$ или толщина заготовки. |
| `CONSTRUCTIVE_GOAL_CHANGE` | Отказ по `C_MCAR = CONSTRUCTIVELY_INFEASIBLE` | Пользователь снял жёсткое ограничение («разрешено делить на модули» / «разрешён крепёж»). |
| `NEVER_UNDER_FIXED_FACTS` | Чисто топологическое противоречие при фиксированных входных данных | При неизменном `evidenceSnapshotHash` переоткрытие запрещено навсегда. |

### 2.4. `RETURN_DEPTH` *(Статус: `EXISTING` как идея `Max Backtrack Depth` + `PROPOSED` раздельная счётная модель)*
Чтобы отличать локальную корректировку способа соединения от глобальной смены гипотезы происхождения, один счётчик заменяется парой ограниченных счётчиков:

```text
ReturnDepthCounters := {
  modeSwitchBacktracks:      number,   // Возвраты на этап [2] CONSTRUCTION HYPOTHESES (Single <-> Modular <-> Hybrid)
  maxModeSwitchBacktracks:   1,        // PROPOSED: не более 1 смены макро-режима без запроса пользователю
  jointRevisionBacktracks:   number,   // Возвраты на этап [4] JOINT IDENTIFICATION (смена шва/доступа внутри режима)
  maxJointRevisionBacktracks: 2        // PROPOSED: до 2 уточнений типа шва (напр. клей -> внешний замок)
}
```

*Ограничение:* пока пользователь не снял ограничение или не ответил на запрос `UNKNOWN`, возврат сверх лимита **запрещён** — агент обязан завершить цикл с честным статусом (`PHYSICALLY_INFEASIBLE` или `INSUFFICIENT_PHYSICAL_CONTEXT`).

### 2.5. `LOOP_DETECTION` *(Статус: `DERIVED` + `PROPOSED`)*
Детектор зацикливания работает непрерывно на каждом переходе между этапами `[2]–[7]` по трём критериям:

1. **Повтор канонической подписи (`Duplicate Signature Check`):**
   Если вновь сформированная ветка имеет `canonicalSignature ∈ RejectedSignatures` и `currentEvidenceHash == rejectionRecord.evidenceSnapshotHash`, переход **блокируется немедленно** до входа в `L2` и `PWRP`.
2. **Осцилляция состояний перехода (`State-Ping-Pong Detection`):**
   Фиксируется кортеж перехода `TransitionKey = (stageId, branchSignature, activeConstraintSet)`. Повторное посещение того же `TransitionKey` в рамках одного цикла рассуждения при неизменном контексте немедленно прерывает возврат.
3. **Зацикливание однолистового поиска (`Single-Sheet Spin Guard` — `EXISTING` в `MCAR`):**
   Если на этапе `[5]` (`MATHEMATICAL MODEL`) поиск единой последовательности отражений одного листа не даёт сходимости при обнаруженных признаках швов, разрывов граней или замкнутых оболочек, однолистовой поиск принудительно останавливается с передачей в `HYPOTHESIS_SET` (`Modular / Hybrid / AMBIGUOUS`).

---

## 3. Матрица различения трёх ситуаций с гипотезами (Задача 5)

Как система различает (а) **новую гипотезу**, (б) **повторную гипотезу** и (в) **ранее опровергнутую гипотезу с новыми доказательствами**:

| Ситуация | Условие проверки (`BRANCH_IDENTITY` + `REJECTION_RECORD` + `REOPEN_CONDITION`) | Действие системы управления циклом | Итоговый статус |
| :--- | :--- | :--- | :--- |
| **1. Новая гипотеза** | `candidate.canonicalSignature` **отсутствует** в списке отклонённых и активных веток текущей сессии (`VisitedBranches`). | Разрешено создание нового `branchId` (`generation = 0`) и запуск анализа `[3]–[7]` в пределах `ReturnDepthCounters`. | `PROPOSED` |
| **2. Повторная (эквивалентная) гипотеза** | `candidate.canonicalSignature` **совпадает** с уже существующей в `RejectionRecord` (включая перестановку одинаковых модулей `C1 ↔ C2`) **и** `evidenceSnapshotHash` не изменился (ни один `ReopenCondition` не выполнен). | **Немедленная блокировка** детектором `LOOP_DETECTION`; повторный анализ в `L2`/`PWRP` не запускается; возвращается ссылка на существующий `RejectionRecord`. | `PROPOSED` |
| **3. Ранее опровергнутая гипотеза с новыми доказательствами** | `candidate.canonicalSignature` **совпадает** с `RejectionRecord`, **НО** поступило новое внешнее свидетельство (`newEvidenceDelta`), которое **формально удовлетворяет хотя бы одному `reopenCondition`** данного отказа (`evidenceSnapshotHash' ≠ evidenceSnapshotHash`). | Легальное переоткрытие: создаётся **новая генерация ветки** (`generation = prev + 1`, ссылка `reopenedFromRejectionId`), старый `RejectionRecord` сохраняется в журнале истории без удаления; счётчики `ReturnDepth` сбрасываются для нового цикла доказательств. | `PROPOSED` |

---

## 4. Открытые вопросы контроля циклов (`UNRESOLVED`)

1. **`LC-U01` (Каноническая нормализация `partitionEquivalenceClass` для произвольной 3D-формы):** до реализации `L1` и 3D-графа не определён формальный алгоритм сравнения изоморфизма разбиений (на уровне `AI Skill` допустимо сравнивать по типу разбиения, числу/типу модулей и топологическому классу швов).
2. **`LC-U02` (Точный порог `maxJointRevisionBacktracks` и таймаут поиска):** конкретные численные лимиты (`1` / `2`) предложены как инженерная эвристика (`PROPOSED`), а не доказанный оптимум.
