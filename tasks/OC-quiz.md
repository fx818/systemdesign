Repo: /home/imart/Desktop/Ideas/systemdesign (app code in app/). FIRST read AGENTS.md, GAME_DESIGN.md
and app/src/types/content.ts (the shared contract — do not edit it). Only touch the directories you own.
Verify with `cd app && npm run typecheck && npm test` (never run dev/watch servers in foreground).
Finish by writing NOTES/OC-quiz.md (what you built, exports, known gaps). Do not git commit.

# Task OC-quiz — Quiz engine ("Interview round")

`src/quiz/` exporting from `src/quiz/index.ts`:
- `<QuestionView question onAnswer(correct: boolean)/>` renders ANY QuizQuestion kind from the contract:
  mcq, multi (pick all), order (drag to reorder with @dnd-kit/sortable; shuffle deterministically by question id),
  truefalse, bins (drag chips into bins), numeric (input + unit + tolerance), spot (render the ArchGraph as a simple SVG
  with clickable nodes — implement a small local `MiniDiagram` in src/quiz so you don't depend on @/sim), label
  (drag labels onto nodes in MiniDiagram).
  After submit: correct/incorrect feedback animation (shake / glow), show `explanation` and "Book p. N", Continue button.
  Keyboard accessible (1-4 keys for options, Enter to submit).
- `<QuizRunner questions onFinish({correct,total,xp, perQuestion})/>`: Ravi-the-interviewer framing (header with
  his avatar + speech bubble: "Next question..."), progress dots, combo multiplier (3 correct in a row -> x1.5 XP,
  5 -> x2, shown as flame), hearts (3; wrong answer loses one; out of hearts -> can still finish but no 3 stars),
  per-question XP (default 10), end screen with score, accuracy, max combo, review of wrong answers.
- Pure grading function `grade(question, response) => boolean` in `src/quiz/grade.ts` with vitest tests for every kind.
- Tests for QuestionView (mcq + order at least) with Testing Library.
Style: dark neon, big tappable answers, mobile friendly.
