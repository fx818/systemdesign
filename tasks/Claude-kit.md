Repo: /home/imart/Desktop/Ideas/systemdesign (app code in app/). FIRST read AGENTS.md, GAME_DESIGN.md
and app/src/types/content.ts (the shared contract — do not edit it). Only touch the directories you own.
Verify with `cd app && npm run typecheck && npm test` (never run dev/watch servers in foreground).
Finish by writing NOTES/Claude-kit.md (what you built, exports, known gaps). Do not git commit.

# Task Claude-kit — Scene kit + the two showcase levels (L01, L02)

You are the gamification & interactivity lead. You own `src/scenekit/**` and `src/content/ch1/L01/**`, `L02/**`.

PART A — `src/scenekit/` (all other level authors will build on this; make it excellent and documented):
- Timing helpers: `tween(time, start, end, from, to, ease?)`, `between(time, a, b)`, `progress(time,a,b)`, easings,
  `stagger(i, base, gap)`, `typewriter(text, time, start, cps)`, `pathPoint(points, t)` for moving packets along polylines.
- SVG primitives (viewBox 0 0 1280 720, dark neon style): `<Stage>` (bg grid + vignette), `<Node kind label x y state glow/>`
  using recognisable icons for every ComponentKind (server racks, DB cylinders, globe for DNS, phone/laptop clients,
  lightning cache, cloud CDN, queue boxes...), `<Link from to animated/>`, `<Packet along t color label/>`, `<Callout>`,
  `<Label>`, `<Counter value>` (user counter), `<StatusBadge>`, `<Explosion t>` / `<Smoke>` (failure fx), `<CheckMark>`,
  `<CodeBlock>` (JSON response), `<Character who mood x y>` (Maya/Ravi/Pager avatars), `<Hotspot id onClick>` wrapper
  (only interactive when props.interactive), `<Title>`.
  EVERYTHING must be a pure function of `time` (no internal state/effects/random) — required for scrubbing + MP4 export.
- `src/scenekit/README.md` documenting the API with a short example; and a `Gallery` export rendering all primitives.

PART B — Levels L01 "Hello, World" (1 user) and L02 "Split the Tiers" (1K users), each a folder
`src/content/ch1/L0X/` with `index.ts` (default export LevelDef) + `Scene.tsx` + `minigames/*.tsx` + data files.
Base the content strictly on reference/ch1.txt (pages ~5-8) written in our own words; follow GAME_DESIGN.md story
(PixelPost photo startup, Maya CEO, Ravi mentor, the Pager).
- incident + debrief dialogue: fun, short, character-driven (6-10 lines each).
- lesson: 120-200 s animated Scene with chapters, rich captions every 3-6 s, 3-5 hotspots, 2 checkpoints.
  L01: user types api.pixelpost.com -> DNS lookup -> IP 15.125.23.214 -> HTTP request -> server returns HTML (web) and
  JSON (mobile, show `GET /users/12` JSON) ; then traffic grows and the single box (web app + DB + cache) groans.
  L02: split into web tier and data tier; SQL tables & joins vs NoSQL 4 families (key-value, graph, column, document);
  when NoSQL fits (4 cases).
- lab: SimConfig + tasks (L01 single server: push rps until it melts; kill it -> site down; L02 separate db and see
  independent scaling).
- miniGames (1-2 each, bespoke, juicy): L01 "Packet Journey" — player routes a request by clicking the right hops in
  order under a timer; L02 "SQL or NoSQL?" — swipe/drag PixelPost features (user profiles w/ relations, likes counter,
  photo metadata, social graph, session blobs, payments...) into SQL/NoSQL with justification feedback.
- mission: SimConfig with events (traffic ramps, a message from Maya) + 3 hints.
- quiz: 8 questions each using at least 5 different kinds (incl. order, bins, spot).
- cards: 4-5 each. badge: per GAME_DESIGN.md.
If @/sim or @/quiz or @/player aren't there yet, you only need the TYPES from the contract — your level files must
typecheck on their own. Write a Vitest test that the level objects are valid (captions sorted, checkpoint times < duration,
quiz answers in range, etc.) in `src/content/ch1/validate.test.ts` (shared validator usable for all levels).
