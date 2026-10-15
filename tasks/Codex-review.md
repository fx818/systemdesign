Repo: /home/imart/Desktop/Ideas/systemdesign (app in app/). Read AGENTS.md, GAME_DESIGN.md, app/src/types/content.ts
and every NOTES/*.md (agent reports) first.

# Task Codex-review — review, test, fix integration, verify in a real browser

You are the reviewer/tester. Other agents (OpenCode: shell, sim, quiz; Claude: scenekit + levels) built the code.
1. Run `cd app && npm run typecheck && npm test && npm run build`. Fix all errors. Prefer minimal fixes in the
   owning module; you may edit any file EXCEPT do not weaken tests or the contract (app/src/types/content.ts).
2. Integration review: verify the public APIs in AGENTS.md exist and are actually wired:
   routes -> LessonPlayer uses lesson.Scene + captions + hotspots + checkpoints (QuestionView from @/quiz);
   quiz route uses QuizRunner; lab/mission routes use SimRunner from @/sim with level configs; mini-games render;
   debrief awards XP/stars/badge via useGame; unlock rules; home map + level path; /render/:id for video export.
   Remove leftover fallbacks/placeholders once real modules exist (e.g. player/QuestionViewFallback if @/quiz exists).
3. Sim sanity: for every level, check its lab & mission configs are WINNABLE and LOSABLE with the real engine:
   write `app/src/content/ch1/playability.test.ts` that, for each level's mission, builds a sensible "good" graph
   (start graph + palette components needed) and asserts it passes goals, and that the bare start graph fails
   (where the mission requires building). Retune level sim numbers (rps, budget, goals) if needed — keep the story intent.
4. Browser E2E: start `npm run build && npx vite preview --port 4173` in the background, then use Playwright
   (install `@playwright/test` as devDependency and use the system Chrome at /usr/bin/google-chrome via
   `channel: 'chrome'`) to write `app/e2e/smoke.spec.ts` that: loads home, opens L01, plays through incident,
   scrubs the lesson, answers a checkpoint, opens lab, plays a mini-game step, runs the mission, completes the quiz,
   sees debrief with XP; checks no console errors on every level's hub/lesson/lab/mission/quiz route. Add script
   `"e2e": "playwright test"`. Kill the preview server at the end.
5. Report: write NOTES/Codex-review.md with: issues found (severity, file, fix applied), test counts,
   remaining issues needing a decision. Do not git commit.
