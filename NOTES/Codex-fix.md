# Codex-fix completion report

Completed `tasks/Codex-fix.md`. No commits made. The shared contract and `app/src/sim/**` were not edited; concurrent simulator and lab-wrapper changes belong to Codex-sim.

## Built and fixed

- Fixed quiz set equality for multi/spot answers and sortable-row measurement. Corrected two contradictory true/false test assertions, and changed the sorting test to send awaited keyboard events from the focused row rather than directly to window.
- Verified combos (third answer ×1.5, fifth ×2), hearts, continued play at zero hearts, results, accuracy, max combo, wrong-answer review, explanations/pages, and one-time finish callbacks. Added interaction coverage for every question kind; finished keyboard bin placement, drag visuals, and return-to-pool drop targets.
- Removed `QuestionViewFallback.tsx`, the temporary quiz bridge, and obsolete ambient module declarations. Lesson checkpoints and interview screens now import `@/quiz` directly.
- Audited all required routes, profile badges/stats, videos, empty-registry behavior, and the standalone noninteractive 1280×720 render route.
- Fixed debrief rewards for empty dialogue, duplicate awards, successful retries, absent mission/quiz results, and lost-heart eligibility. Debrief includes animated XP, badge/confetti, the revealed architecture map, and an unlocked-next-level CTA.
- Fixed HQ's full architecture map when the boss starts with only users; wired XP toasts. Enforced direct-link locks and all twelve boss prerequisites, and tracked completion of every mini-game.
- Fixed Flashback skipping cards as due dates changed: sessions now keep a stable queue and a five-review daily allowance while preserving persisted Leitner scheduling/streaks.
- Fixed checkpoint sorting, deep links, checkpoints at zero/end, keyboard interference, mobile overlay scrolling, and deterministic external frame control. Render routes clamp time and support `?t=`.
- Integrated simulator results, life-loss/retry callbacks, hint counts, and final remaining credits without changing simulator code. Empty dialogue remains continuable.

## Public exports

- `@/quiz`: `QuestionView`, `QuizRunner`, `grade`, existing helpers/types.
- `@/player`: `LessonPlayer`, `LessonPlayerProps`, `RenderScene`.
- `@/game`: existing API preserved; added `recordMiniGameResult`, latest quiz score/hearts, and optional `heartsLeft` for quiz recording/star calculation.

## Validation and known gaps

- `npx vitest --clearCache` followed by `npm test`: **318 tests passed in 40 files**, including the concurrent simulator tests.
- `npm run typecheck`: passed.
- `npm run build`: passed after the simulator entry point landed.
- `git diff --check`: passed.
- No remaining quiz/shell blockers. Vite reports a large main bundle warning; bundle optimization remains outside this fix task. Shell integration tests isolate the simulator bridge; browser-level simulator validation belongs to Codex-sim.
