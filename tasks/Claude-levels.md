Repo: /home/imart/Desktop/Ideas/systemdesign (app code in app/). FIRST read AGENTS.md, GAME_DESIGN.md,
app/src/types/content.ts (contract — do not edit), app/src/scenekit/README.md (scene building blocks — USE THEM),
and the two finished reference levels app/src/content/ch1/L01 and L02 (match their quality, structure and conventions).
Also look at app/src/sim (COMPONENTS, knobs semantics) so lab/mission configs are meaningful for the engine.

# Task {agent} — build levels {levels}

For EACH level, read its brief in tasks/briefs/<LXX>.md and the matching part of reference/ch1.txt, then create
`app/src/content/ch1/<LXX>/` with index.ts (default export LevelDef), Scene.tsx, minigames/*.tsx and data files.
Requirements per level (same bar as L01/L02):
- incident + debrief dialogue, 6-10 lines, fun & character-driven (Maya CEO, Ravi mentor, the Pager).
- lesson: 120-200 s deterministic animated Scene (pure function of time; use scenekit), chapters, captions every 3-6 s
  covering EVERY point in the brief accurately (our own words), 3-5 hotspots, 2 checkpoints.
- lab (SimConfig + knobs + tasks), mission (SimConfig with timed events incl. character messages, goals, budget, 3 hints).
- the bespoke mini-games described in the brief: genuinely interactive and juicy (framer-motion ok inside mini-games),
  call onComplete(score 0..1).
- quiz: 8 questions (10 for the boss) using >= 5 different kinds incl. order/bins/spot/numeric where it fits;
  each with explanation + page.
- 4-5 cards, badge per brief, users milestone per brief.
Run `cd app && npm run typecheck && npm test` (the shared validator in src/content/ch1/validate.test.ts must pass for
your levels). Only touch your own level folders. Write NOTES/{agent}.md when done. Do not git commit.
