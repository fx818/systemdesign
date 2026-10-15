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
3. Sim sanity (CRITICAL — see the "Content tuning needed" table in NOTES/Codex-sim.md: L02, L03, L04, L05, L06, L07, L11
   missions are currently UNWINNABLE because budgets are below start/required cost). For every level, make lab & mission
   configs WINNABLE and LOSABLE with the real engine. Prefer retuning level data (budget, rps, goals, palette, knobs) in
   app/src/content/ch1/LXX/sim.ts over changing COMPONENTS prices; the budget should be the cost of an efficient
   solution + ~15% slack so the 2-star "<=85% spend" is reachable. Keep each level's teaching intent (e.g. L03 must
   show vertical scaling hitting a ceiling; L06 needs enough web capacity so the cache is what fixes latency).
   Also check every hint is actually affordable and leads to a win. Write
   `app/src/content/ch1/playability.test.ts` that, for each level's mission, builds a sensible "good" graph
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
