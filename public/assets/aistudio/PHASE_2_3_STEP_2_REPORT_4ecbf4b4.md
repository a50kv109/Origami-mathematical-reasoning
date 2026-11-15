# PHASE 2.3.2 REPORT — Metamorphic Tests: Distance Invariance & Fixed Points

Baseline: commit `b1fe5a3` (Phase 2.3.1, 24 tests).
Scope: test-only. Modified `tests/metamorphic.test.ts`; created this report.
Not touched: `src/core/*`, `tests/contract02.test.ts`, `package.json`, `package-lock.json`, historical reports. No dependencies added.

## 1. Execution results (actual)

| Command | Result |
|---|---|
| `npm test` | `# tests 32`, `# pass 32`, `# fail 0`, `# cancelled 0`, `# skipped 0` |
| `npm run lint` (`tsc --noEmit`) | no output, exit 0 |
| `npm run build` (`vite build`) | `✓ 1666 modules transformed`, `✓ built in 470ms` |
| `git status --short` | ` M tests/metamorphic.test.ts` (only tracked change besides this new report) |

Tests 1–24 are the pre-existing suite, unchanged and still passing. Tests 25–32 are new and were discovered automatically by `tsx --test tests/*.test.ts`.

## 2. New tests

| # | Test | Verifies |
|---|---|---|
| 25 | Property D, full reflection | All unordered pairs (n(n-1)/2, count asserted) on 4 case/axis combinations over 2 geometries (subdivided square, asymmetric mesh); IDs/edges/faces unchanged; non-adjacent pairs present; L7 PASS, `lengthsPreserved`, `maxLengthError <= epsilon` |
| 26 | Property D, partial reflection | Distances preserved within the moving set and within the fixed set. Moving-fixed pairs are deliberately not asserted (not an isometry of the whole set) |
| 27 | Property E, fixed points | 4 scenarios, 3 distinct axes: single on-axis point; multiple on-axis points (diagonal and oblique axes); on-axis vertices listed as moving. Checks unchanged coordinates and IDs, `witness`/`trace` fixed/moving partition, L7 PASS, off-axis vertices against an independent unit-normal reflection formula |
| 28 | Property E, contract | A vertex 1e-9 from the axis is reflected (to 2 − 1e-9), not snapped and not auto-classified as fixed |
| 29 | Negative D | Perturbed reflected coordinate: detected by the pairwise checker (only pairs involving the corrupted vertex), and L7 returns FAIL both for state-only corruption and for state+witness consistent corruption (`axiomsSatisfied=false`) |
| 30 | Negative E (fixed) | Fixed on-axis vertex displaced by 1e-3: L7 FAIL, `fixedVerticesUnchanged=false`, `maxFixedDisplacement > epsilon`; `verifyProcess` also FAIL |
| 31 | Negative E (moving) | On-axis vertex listed as moving but displaced: FAIL, including with a consistently forged witness (`axiomsSatisfied=false`) |
| 32 | Negative forged residuals | Corrupted geometry + `claimedResiduals = 0` still FAIL with recomputed residuals above epsilon; correct geometry + `claimedResiduals = 1e6` still PASS with residuals identical to the honest run |

## 3. Numerical policy

- Coordinate comparison: `METAMORPHIC_COORD_TOLERANCE = 1e-12` (existing, absolute).
- Distance comparison: `1e-12 * max(1, d_before)` (new, documented in code). Scaled by distance because a distance combines two coordinate errors through `hypot`.
- L7 verdict assertions use `DEFAULT_VERIFIER_TOLERANCES.epsilon = 1e-7`.
- No global tolerance was changed. Scenario coordinates are dyadic rationals so that on-axis membership is exact (`n·p === c`, no epsilon) and L2's zero-offset path returns the point bit-exactly.

## 4. Findings and limits

1. **Fixed-vertex classification is an explicit partition, not geometric.** L2 and the `OperationRequest` take `fixedVertexIds` as given; nothing snaps near-axis points. Test 28 pins this behavior.
2. **L7 does not check that a "fixed" vertex lies on the axis.** It checks that fixed vertices are *unchanged*. The negative control "claimed on axis but moved away" is therefore rejected as a fixed-vertex displacement (and, for moving vertices, via axiom residuals), not via an axis-membership predicate. If axis membership of fixed vertices should be enforced, that is a contract decision for a later phase; this task did not change L7.
3. Partial-reflection distance invariance is only asserted within the moving set and within the fixed set.
4. Everything above is verified on a finite set of deterministic cases within IEEE-754 double precision. It is not a proof of the properties beyond the tested numerical domain.

## 5. Verdict

**ACCEPTED** (within the tested numerical domain). All acceptance criteria met: pairwise distance invariance verified; fixed-point behavior verified through L2 and L7; negative controls detect corruption; all 24 prior tests pass; TypeScript strict passes; production build passes.
