Repo: /home/imart/Desktop/Ideas/systemdesign (app in app/). Read AGENTS.md and tasks/OC-quiz.md, tasks/OC-shell.md.

# Task Codex-fix — finish quiz + shell (previous OpenCode agents stalled)

1. app/src/quiz: 5 failing tests (grade.test.ts: kind-mismatched truefalse, multi exact set, spot set equality,
   isComplete before interaction; QuestionView.test.tsx: keyboard sorting for order). Decide whether the test or
   the implementation is wrong per the spec in tasks/OC-quiz.md and fix the implementation (only fix a test if it
   contradicts the spec). Check QuizRunner is complete (combo, hearts, end screen, wrong-answer review) and that
   app/src/quiz/index.ts exports QuestionView, QuizRunner, grade.
2. Shell: check tasks/OC-shell.md against app/src/{App.tsx,main.tsx,screens,player,game,components}. Finish anything
   missing (routes for all screens incl. /render/:levelId, debrief confetti + badge modal, profile, review/flashback,
   videos). Remove app/src/player/QuestionViewFallback.tsx and use @/quiz directly now that it exists.
   Do NOT touch app/src/sim/** (another agent is building it right now); the Lab/Mission screens may not compile
   until it lands — that's fine.
3. `cd app && npx vitest --clearCache; npm test` must pass for everything outside src/sim. Write NOTES/Codex-fix.md.
   Do not git commit.
