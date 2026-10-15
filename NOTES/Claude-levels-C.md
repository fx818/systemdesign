# Claude-levels-C: L11, L12, L13 (boss)

All three levels are in `app/src/content/ch1/L11..L13/` and follow the L01/L02 structure:
`index.ts` (default `LevelDef`), `Scene.tsx` (exports `T`), `lesson.ts`, `story.ts`, `sim.ts`, `quiz.ts`, `data.ts`,
`minigames/*.tsx` (each with a test), and a `level.test.ts` that applies the showcase content bar to that level.

## L11: Eyes on the System (5M users, pp. 26-28, badge `detective`)
- Lesson: 176 s across 6 chapters (3 AM page → nice-to-have vs essential → logging → metrics → automation/CI → Figure 1-19), 36 captions, 4 hotspots (`central-logs`, `metric-types`, `ci`, `tools`), 2 checkpoints.
- Mini-games: **Incident Detective**, with searchable central logs, host-metric charts, dashboards, an evidence board and 4 suspects. The root cause is a full disk on web-3. Also **Metric Sorter**, a timed sort into host, aggregated and business with combos and keys 1-3.
- Lab and mission: the Figure 1-19 system with logging, metrics and ci in the palette. In the deploy-day mission a bad release kills web-2, there is a traffic launch, and a full disk kills web-3.
- Quiz: 8 questions across 7 kinds (truefalse, bins, order, mcq, spot, multi, label, numeric). 5 cards.

## L12: Divide and Conquer (8M users, pp. 28-32, badge `shard-lord`)
- Lesson: 190 s across 8 chapters (vertical scaling: RDS 24 TB and Stack Overflow 2013 → drawbacks → sharding with user_id % 4 → sharding key and an even-distribution histogram → resharding and shard exhaustion → celebrity hotspot with dedicated and further-split shards → joins and de-normalization → Figure 1-23). 5 hotspots, 2 checkpoints.
- Mini-games: **Shard Router**, where you route ids with % 4 under a timer, then the shards fill up, N becomes 5 and the same ids must move. Also **Pick the Key**, with 3 scenarios × 4 keys, a live histogram and a hot-shard 🔥.
- Lab: a 4-shard setup with knobs for shards, rps and cacheSize, plus hotkey events. Mission: start from a single 95%-full master; a celebrity post (hotkey 0.6) arrives at t=50.
- Quiz: 8 questions across 7 kinds, including a numeric one (1003 % 4) and a spot question on which shard melts (17/25/33 % 4). 5 cards.

## L13: BOSS Launch Night (10M users, pages [5, 33], `boss: true`, badge `principal-architect`)
- I kept and reused the earlier partial `data.ts` (CHECKLIST, DISTRACTORS, SPOF_*).
- Lesson: 176 s. It rebuilds the architecture one piece at a time, L1 through L12, with a level chip for each step. Then comes a stress test (traffic spike plus a web-1 crash that the system absorbs). Next the 8-rule checklist: the diagram shrinks to the right and each rule lights up its components. It ends on the "iterative process / smaller services" outro. 4 hotspots, 2 checkpoints.
- Mini-games: **Checklist Recall**. You first type the rules from memory (keyword match, full points). A pick round with traps follows (½ point per rule, −¼ per trap). Also **Spot every SPOF**, a clickable flawed design. Its answers are the single LB, the single cache, the DB with no replica, and the data center itself.
- Lab: an architect playground with every component and all 11 knobs.
- Mission: an **empty canvas** (only the locked client and mobile nodes), budget 3200, 180 s. The seven waves are a spike, a web kill, a cache kill, a db kill, a `region-down 'us-west'`, a hotkey, and a jobs burst. Each wave is announced by a message and some are followed by revives.
- Quiz: **10** questions across 8 kinds, mixing the whole chapter. 4 cards.

## Verification
- `npm test`: everything under `src/content/ch1` passes (80 tests: the shared validator, determinism and hotspot checks, the per-level bar, and the mini-game play-throughs). 5 tests fail elsewhere, all in `src/quiz` (OC-quiz's work in progress).
- `npm run typecheck`: no errors in my folders. The one remaining error is in `src/components/ui/Button.tsx` (OC-shell).
- I checked the scenes visually with headless-Chrome screenshots at about 15 timestamps per level and fixed the overlaps I found.

## Known gaps / assumptions
- The sim engine was not built yet (only `src/sim/types.ts` existed), so I could not run the lab and mission configs. Budgets assume **cost counts the pre-placed nodes too** (L11 1700, L12 1800, L13 3200), so they are generous. Please re-tune them once `COMPONENTS` costs exist.
- L13 `region-down` uses the region id `'us-west'`. The engine needs to map a datacenter node or region to this name.
- L12 brief wants a "sharding key select" knob in the lab, but the `Knob['id']` union has no matching id. Pick the Key covers it instead. A future `shardKey` knob id would need a contract change, and I have not filed one.
- L11's lab "toggles" for logging, metrics and CI are palette nodes (`logging`/`metrics`/`ci`) rather than knobs, for the same reason.
- oxlint reports only the same `only-export-components` warnings that L01/L02 have (the `T` and score-helper exports).
