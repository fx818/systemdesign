# W3-ch2: Chapter 2, Back-of-the-Envelope Estimation

All files are under `app/src/content/ch2/`. The registry picks the levels up automatically (`chapter: 2`, ids C2L01-C2L04).

## Levels
| id | title | pages | mini-game | mission (sim) | badge |
|---|---|---|---|---|---|
| C2L01 | Powers of Two | 34-35 | **Unit Ladder**: tap Bit to PB in order, then 8 timed conversions (12 s each) | Peak is 2^12 = 4,096 req/s. Four servers (rounding to 4,000) drop requests; five pass | Byte Sized |
| C2L02 | Need for Speed | 35-37 | **Latency Race**: place 8 operations on a 10-slot log track (1 ns to 1 s), photo finish with "if 1 ns = 1 s" | p95 < 40 ms: a cache (memory) passes; DB replicas (disk) cannot | Speed Reader |
| C2L03 | Count the Nines | 37-38 | **Downtime Budget**: match nines to downtime per day and per year, then 4 "breached?" SLA scenarios (Maya's 99.99% / 9-min deploy) | 99.9% SLA through a crash and a deploy: N+1 (4 servers) passes, 3 fails | Nine Lives |
| C2L04 (boss) | Napkin Math | 38-40 | **Estimation Workbench**: 7 numeric steps (DAU, post QPS, read QPS, peak, servers, TB/day, 5-year PB) with tolerance, a +0.1 "Round it!" bonus, and a final answer within 2× for full marks | Estimated peak 5,800 QPS: 6 web servers + 1 cache within budget. 5 servers, no cache, or replicas instead of a cache all fail | Napkin Master |

Each level has incident and debrief dialogue, a 156-176 s deterministic scene (scenekit only) with gap-free captions, 5-6 chapters, 4-5 hotspots,
2 checkpoints, 8 quiz questions (numeric-heavy, plus order, bins, multi, mcq, truefalse, all with page and explanation), 5 cards and a lab.
Story: PixelPost has 10M users; Maya pitches the Series A and each level answers one investor question. Ravi teaches napkin math and the Pager heckles.

## Shared pieces (`ch2/common/`)
- `numbers.ts`: canonical data. Table 2-1 powers, Dean's latency list, `downtimeSeconds` / `formatDuration` (reproduces Table 2-3:
  month = 30.44 days, year = 365.25 days), `humanScaled` (1 ns → 1 s), and the PixelPost boss assumptions and derived `BOSS` values.
- `board.ts`: `pixelBoard({ webs, cache, db })`, the users → LB → web pool → cache → DB board all ch2 sims start from.
- `ui.tsx`: `GameFrame`, `ResultCard`, `Feedback` (mini-game chrome).
- `validate.ts`: `validateCh2Level` wraps ch1's `validateLevel` and swaps in ch2 id and page rules.

## Tests (all passing: 7 files, ~60 tests)
- `ch2/validate.test.ts`: structure, content bar, scene determinism and no NaN, hotspot reachability, no hotspots in video mode.
- `ch2/playability.test.ts`: mirrors SimRunner rules. Each mission's plan wins with 2+ stars, ≤ 85% of budget and budget ≤ 1.25× cost;
  doing nothing loses; labs are healthy at rest and break when all web servers are killed; plus the "wrong estimate loses" checks listed above.
- One test file per mini-game (perfect run = score 1, mistakes cost points), plus `common/numbers.test.ts` against the book tables.

## Known gaps / notes
- **Breaks a ch1 test (not mine to edit):** `ch1/playability.test.ts` iterates every registry level, so it fails for all ch2 and ch3 levels.
  The fix is in `NOTES/contract-requests.md` (use `levelsInChapter(1)`). Running `npm test` shows 9 failures there; all ch2 files pass.
- `npm run typecheck` currently fails only on the ch3 agent's temporary `src/content/ch3/frames.tmp.test.ts`. ch2 is clean and `vite build` succeeds.
- `reference/ch2.txt` has no page markers or tables (they were images). Tables 2-1, 2-2 and 2-3 come from the standard published values
  (Table 2-3 is recomputed exactly). Per-question `page` values within 34-41 are best estimates.
- The latency numbers are Dean's 2010 list, which the book quotes. The book's Figure 2-1 (2020) is not reproduced.
- All ch2 levels use `users: 10_000_000` (the chapter is about estimation, not growth).
