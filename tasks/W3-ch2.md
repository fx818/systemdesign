Repo: /home/imart/Desktop/Ideas/systemdesign (app in app/). FIRST read AGENTS.md, GAME_DESIGN.md,
app/src/types/content.ts (shared contract — do not edit; ask in NOTES/contract-requests.md), app/src/content/chapters.ts,
app/src/content/registry.ts, and NOTES/*.md for what exists. The app is complete for Chapter 1 (13 levels, sim engine
@/sim, quiz engine @/quiz, lesson player @/player, game store @/game, scenekit @/scenekit). Other agents work in
parallel — ONLY touch the paths you own (listed below). Never run dev/watch servers in the foreground.
Verify: `cd app && npm run typecheck && npm test && npm run build` (run vitest with --clearCache first if levels seem
missing). Do not git commit. Write NOTES/W3-ch2.md (what you built, how to use, gaps) when done.

# W3-ch2 — Chapter 2: Back-of-the-Envelope Estimation (Claude, gamification lead)
Owns: app/src/content/ch2/** only.
Source: reference/ch2.txt (book pages 34-41). Read it fully. Study app/src/content/ch1/L01 and L06 (reference quality),
app/src/scenekit/README.md, app/src/content/ch1/validate.ts (reuse validateLevel in your own ch2/validate.test.ts).

Story: PixelPost has 10M users after Chapter 1. Maya is pitching investors; numbers must be right. Ravi teaches
"napkin math". A new rival character is optional. Same PixelPost cast & tone.

Build 4 levels (LevelDef with `chapter: 2`, ids C2L01..C2L04, `number` 1..4; folder app/src/content/ch2/C2L0X/):
- C2L01 "Powers of Two": bits/bytes, ASCII = 1 byte, KB/MB/GB/TB/PB as powers of 2 (2^10..2^50).
  Mini-game "Unit Ladder": order/convert units under time pressure.
- C2L02 "Need for Speed": latency numbers (L1 cache ~ns, memory ~100ns, SSD/disk ms, network round trip across
  regions ~150ms), ns/µs/ms conversions, the 5 conclusions (memory fast/disk slow, avoid disk seeks, compression is
  fast, compress before sending, cross-region takes time). Mini-game "Latency Race": drag operations onto a log-scale
  track from fastest to slowest; a second "If 1 ns were 1 second" scaled-time visual in the Scene.
- C2L03 "Count the Nines": availability %, SLA, cloud SLAs ≥ 99.9%, nines -> downtime per day/week/month/year
  (99% 14.4 min/day..; compute exactly). Mini-game "Downtime Budget": match nines to downtime; then a scenario
  "Maya promised 99.99% — the deploy took 9 minutes this month: breached?".
- C2L04 "Napkin Math (Boss)": the Twitter-style estimation reframed as PixelPost: MAU, DAU %, posts/day, media %,
  retention -> QPS, peak QPS (2x), media storage per day, 5-year storage. Tips: round & approximate, write assumptions,
  label units, commonly asked estimates (QPS, peak, storage, cache, servers). Mini-game "Estimation Workbench":
  a guided step-by-step calculator where the player fills each derived number (numeric with tolerance), with
  "round it!" bonus for good approximations; final answer within 2x earns full score.
Each level: incident + debrief dialogue, a 120-180s deterministic Scene (scenekit), captions, chapters, hotspots,
2 checkpoints, 6-8 quiz questions (numeric-heavy: use `numeric` with tolerance, plus order/bins/mcq), 4-5 cards, badge.
Lab & mission are REQUIRED by the contract: make them estimation-driven with the sim — e.g. "your estimate says peak
QPS is ~X: provision enough web servers (each ~1000 rps per @/sim COMPONENTS) within budget" — read app/src/sim
COMPONENTS and the playability approach in app/src/content/ch1/playability.test.ts; write ch2/playability.test.ts
proving each mission is winnable (good plan passes, untouched start fails).
Do the work yourself sequentially (no sub-agents) to save usage limits. Finish & test each level before the next.
