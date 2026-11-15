# Release Notes — Origami Mathematical Reasoning (OMR) `v0.1.0`

**Дата релиза:** 2026-11-15  
**Кодовое название:** *Verified 2D Reflection Prototype (Phase 2.1)*  
**Репозиторий:** <https://github.com/a50kv109/Origami-mathematical-reasoning>  
**Лицензия:** Apache-2.0 ([`LICENSE`](./LICENSE))

---

## Что входит в `v0.1.0`

Релиз `0.1.0` фиксирует завершённое минимальное 2D-ядро контракта **Contract 02 v2 (`L2 ↔ L7`)** с чистой сборкой, лицензионным оформлением и документацией:

1. **Контракты и типы (`src/core/types.ts`):**
   - `GeometryState` (`stateId`, `version`, вершины, рёбра, грани в IEEE-754 без округления);
   - `LineNormalParams` (`nx * x + ny * y = c`);
   - `ReflectionWitness`, `TraceEntry`, `VerificationClaim`, `VerificationVerdict`, `VerifierTolerances`.
2. **Вычислитель L2 (`src/core/l2GeometryEngine.ts`):**
   - `createInitialGeometryState` и `reflectAcrossLine` с ортогональной проекцией `p' = p - 2 * ((n·p - c) / (n·n)) * n`;
   - поддержка частичного отражения (`movingVertexIds` / `fixedVertexIds`);
   - генерация `ReflectionWitness` и `TraceEntry`;
   - валидация входов через `L2EngineError` (`INVALID_COORDINATE`, `DEGENERATE_NORMAL`, `UNKNOWN_VERTEX_ID`, `DUPLICATE_VERTEX_ID`).
3. **Иммутабельный журнал `TRACE` (`src/core/trace.ts`):**
   - `deepFreeze`, `cloneGeometryState`, `cloneReflectionWitness`, `createTraceEntry`, `appendTraceEntry`.
4. **Независимый верификатор L7 (`src/core/l7IndependentVerifier.ts`):**
   - строгая изоляция (ноль рантайм-импортов из `L2` и `TRACE`, без повторного запуска формулы отражения или 3×3 матриц);
   - `verifyResult` и `verifyProcess` в 4 этапа (Stage A–D: допустимость IEEE-754 и `||n|| > 1e-12`, трёхсторонняя привязка свидетельства и игнорирование `claimedResiduals`, масштаб-инвариантные аксиомы `r_mid` и `r_perp`, scope-aware изометрия длин/площадей и инверсия ориентации);
   - вердикты `PASS | FAIL | UNDETERMINED` с допусками `DEFAULT_VERIFIER_TOLERANCES` (`epsilon = 1e-7`, `areaEpsilon = 1e-7`, `zeroNormalEpsilon = 1e-12`, `degenerateAreaEpsilon = 1e-12`).
5. **Автотесты (`tests/contract02.test.ts`):**
   - **13/13** проходящих тестов (позитивные сценарии, контрпримеры, инвариантность масштаба `1e6`, частичное отражение, вырожденные входы, разрывы `TRACE`, глубокая заморозка и статическая проверка изоляции `L7`).
6. **Веб-демонстрация и документация:**
   - интерактивный стенд `VerificationWorkbench` и обновлённый паспорт проекта (`src/App.tsx`, `src/data/passportData.ts`);
   - синхронизированная документация `README.md`, `docs/*`, `CHANGELOG.md`, `CONTRIBUTING.md`.

---

## Что НЕ входит в `v0.1.0`

OMR `v0.1.0` **не является** полноценной системой физического складывания оригами. Вне рамок этого релиза остаются:

- **L1 Topology:** `FACE_SUBDIVISION`, `MATERIAL_CUT`, Construction DAG и разделение `portableId != localId` (запланировано на Phase 3).
- **L3 Layer Order:** комбинаторное разрешение Z-порядка перекрывающихся слоёв.
- **L4 Kinematics:** 3D-складывание, двугранные углы, непрерывные траектории `γ(t)` и проверка столкновений.
- **L5 Curved Folding** и **L6 Optimization**.
- **Вердикт `CAPABILITY_GAP`** в `src/core/types.ts`.
- **Криптографическая привязка `TRACE`** (JCS RFC 8785 + SHA-256).
- **Точная / интервальная арифметика (`BigInt`)** для произвольно больших смещений $|c| \gg 10^{10}$.
- **Адаптеры внешних программ** (`Ori Studio`, `Oriedita`, `Rabbit Ear`, `OrigamiSimulator`) и переносимый **AI Reasoning Skill**.

---

## Известные ограничения и открытые риски

1. **Отсутствие `OperationRequest` в `VerificationClaim`:** верификатор проверяет согласованность оси между `claim.parameters.line` и `witness.axis`, но при одновременной согласованной подмене оси в обоих местах не имеет независимого доверенного запроса на операцию для её обнаружения. Введение `OperationRequest` запланировано на Phase 2.2.
2. **Граничная проверка `stepIndex: NaN` в `verifyProcess`:** сравнение `entry.stepIndex <= prev.stepIndex` не отклоняет `NaN` в качестве ошибки порядка шагов; явная проверка `Number.isFinite(entry.stepIndex)` отложена на Phase 2.2.
3. **Нестрогий режим `tsconfig.json`:** `"strict": true` и очистка предупреждения Vite о `__dirname` отложены на этап инженерной полировки после `v0.1.0`.
4. **Исторические отчёты в корне:** файлы `ACCEPTANCE_AUDIT_V1.md` и `PHASE_2_IMPLEMENTATION_REPORT.md` сохранены для истории и **перекрыты** реализацией Phase 2.1 (`PHASE_2_1_IMPLEMENTATION_REPORT.md`) и материалами выпуска `v0.1.0`.
