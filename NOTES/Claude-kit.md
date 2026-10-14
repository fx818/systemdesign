# Claude-kit report

## Built
### Part A: `src/scenekit/` (`@/scenekit`)
Deterministic SVG kit: every export is a pure function of its props and `time`. API docs and an example are in `src/scenekit/README.md`.
- `time.ts`: `progress, tween, between, fadeWindow, stagger, typewriter, pathPoint, cueIndex, pulse, shake, hash, rng, clamp, lerp, ease.*, formatCount, withCommas`
- `theme.ts`: `C` (neon palette), `KIND_COLOR`, `KIND_LABEL`, `FONT`, `MONO`
- Primitives: `Stage` (+`StageDefs`, shared glow filters), `Node` (icons for all 19 ComponentKinds; states idle/active/busy/overloaded/down/ghost),
  `KindIcon`, `Link` (+`linkPath`, `insetSegment`), `Packet`, `Callout`, `Label`, `Title`, `Counter`, `StatusBadge`, `CodeBlock` (JSON highlighting + typewriter),
  `Character` (Maya/Ravi/Pager/player/narrator, 5 moods, blink, talk, speech bubble), `Hotspot` (badge, keyboard accessible, `data-hotspot`, inert when `interactive=false`),
  `Explosion`, `Smoke`, `CheckMark`, `CrossMark`, `Sparkles`, `Appear`, `Panel`, `Meter`, `BrowserWindow`, `DataTable`, `Chip`, `wrapText`
- `Gallery` (`page="nodes"|"fx"`, `time`) renders every primitive.
- Tests: `scenekit.test.tsx` (helpers, plus Gallery determinism via renderToStaticMarkup).

### Part B: levels
- `src/content/ch1/L01/` "Hello, World": 180 s scene (single server, then DNS lookup, IP 15.125.23.214, HTTP, HTML; web vs mobile with Java/Python and HTML/JS;
  GET /users/12 JSON; growth to 1,000 users until the CPU melts). 37 captions, 5 chapters, 5 hotspots, 2 checkpoints (mcq, order). Lab (rps slider, kill),
  mission (place the first web server, 3 hints), 8-question quiz (mcq, order, truefalse, bins, spot, multi, label), 5 cards, badge `first-request` (icon `Send`).
  Mini-game **Packet Journey** (`minigames/PacketJourney.tsx`): 3 timed rounds (browser/HTML, mobile/JSON, speed run). Click hops in order; wrong hops cost 2 s and explain why.
- `src/content/ch1/L02/` "Split the Tiers": 185 s scene (one CPU and two jobs, then the split into web tier and data tier with independent scaling; SQL tables and an animated JOIN;
  the 4 NoSQL families with mini-illustrations; "joins generally not supported"; the 4 cases where NoSQL fits). 36 captions, 5 chapters, 5 hotspots, 2 checkpoints.
  Lab (rps + servers knobs), mission (add a DB, 3 hints), 8-question quiz (mcq, bins, multi, truefalse, order, spot), 5 cards, badge `data-whisperer` (icon `Database`).
  Mini-game **SQL or NoSQL?** (`minigames/SqlOrNoSql.tsx`): 9 PixelPost feature cards. Drag/swipe or use arrow keys or the bins; a combo counter;
  correct NoSQL picks unlock a bonus "which family?" question; each answer gets a justification. Score = (correct + ½·family) / max.
- Each level: `index.ts` (default LevelDef), `Scene.tsx` (default scene + exported cue times `T`), `lesson.ts`, `story.ts`, `sim.ts`, `quiz.ts` (quiz + cards), `data.ts`, `minigames/*`.

### Shared validator
- `src/content/ch1/validate.ts`: `validateLevel`, `validateQuestion`, `validateSim`, `validateGraph`, `COMPONENT_KINDS`.
- `src/content/ch1/validate.test.ts` auto-discovers **all** `ch1/L*/index.ts` and checks structure (captions sorted and non-overlapping, chapters, checkpoints < duration,
  answers in range, spot/label ids exist in the diagram, sim graphs/events/knobs, quiz 6-10, cards 3-5). It also renders each Scene at several times twice
  (determinism, no NaN/undefined), checks every declared hotspot appears in the scene and no undeclared one does, and checks that video mode has no hotspot UI.
  L01/L02 get an extra "showcase" bar (duration 120-200, captions <= 7 s with no holes, 6-10 dialogue lines, 8 questions with >= 5 kinds incl. order, bins and spot).
- Mini-game tests: `L01/minigames/PacketJourney.test.tsx`, `L02/minigames/SqlOrNoSql.test.tsx` (the latter plays the whole deck, with framer-motion animations skipped).

## Verification
`npm test`: all 76 tests pass (10 files). `npm run typecheck`: no errors in my files. The 4 remaining errors are in OC-shell files
(components/ui/Button.tsx, game/store.ts, player/QuestionViewFallback.tsx, screens/HomeScreen.tsx).
I also checked the scenes visually by rendering frames to PNG with headless Chrome, and the mini-games with Playwright in a temporary harness (since deleted).

## Notes for other teams
- Scenes expect the player to overlay captions at the bottom, so I kept the important visuals above y ≈ 640.
- `Hotspot` uses `active` to hide its badge while the target is off screen. Hotspot ids map 1:1 to `lesson.hotspots`.
- Sim configs assume OC-sim's capacities (web ≈ 1000 rps). L01 mission: budget 150 (one web server ≈ 100). L02 mission: budget 400.
  Retune the rps/budget numbers if COMPONENTS changes.
- Mini-games use performance.now/rAF (fine: only lesson scenes must be deterministic).

## Known gaps
- oxlint reports only warnings (react-refresh "only-export-components" because Scene files export `T`; set-state-in-effect in the Packet Journey game loop).
- PacketJourney removes the SVG focus outline on its nodes. Keyboard play works (Tab + Enter), but there is no visible focus indicator yet.
- Not checked inside the real LessonPlayer/SimRunner yet, because those were still being built by OC-shell and OC-sim.
