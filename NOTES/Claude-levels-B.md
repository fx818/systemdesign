# Claude-levels-B: L07–L10

## What I built
Four complete levels in `app/src/content/ch1/L07..L10/`, same file layout as L01/L02
(`index.ts`, `Scene.tsx` with exported `T`, `lesson.ts`, `story.ts`, `sim.ts`, `quiz.ts`, `data.ts`, `minigames/*`).

| Level | Users | Pages | Lesson | Hotspots | Mini-games | Badge |
|---|---|---|---|---|---|---|
| L07 Closer to Home (CDN) | 500K | 17-20 | 176 s, 6 chapters: world map + load times, CDN definition and static vs dynamic, closest-edge example (SF/LA/Europe), 6-step workflow with TTL header and countdown, 4 considerations, Fig 1-11 | origin, cdn-edge, ttl, fallback, versioning | **Order the CDN flow** (click-to-place 6 steps, then an animated packet replay) · **CDN or Not?** (6 assets, CDN bill and speed-up meters, budget) | Edge Lord |
| L08 Forget Me Not (stateless) | 1M | 20-23 | 172 s: random logouts, Fig 1-12 stateful, sticky sessions + downsides (server 4 gets no sessions, server 2 dies), sessions fly into a shared NoSQL store, Fig 1-14, autoscaling 2→5→2 | session, sticky, shared-store, autoscale | **Who's Logged In?** (timed predictions: stateful round with crash and new server, then stateless round) | Stateless |
| L09 Going Global (data centers) | 2M | 23-25 | 166 s: storm takes out the only DC, Fig 1-15 geoDNS with live x% / (100−x)% split, Fig 1-16 failover to 100%, 3 challenges (redirection, data sync with/without replication + Netflix, test and automated deploy), queue teaser | geodns, failover, replication, deploy | **GeoDNS Router** (click the nearest DC on a world map; round 2: US-West dark, faster clock) | Globetrotter |
| L10 Take a Number (message queue) | 3M | 25-26 | 162 s: synchronous filters choke the web tier, Fig 1-17 producer/queue/consumer, decoupling (consumer down, then producer down), Fig 1-18 async photo jobs, workers scale with queue size | queue, decoupling, workers, scale | **Worker Shift Manager** (60 s of bursty arrivals; +/- workers; red line, sparkline, credit burn; score = SLA × cost efficiency) | Queue Master |

Each level has 9-line incident/debrief dialogues, a 4-5 line mission brief, captions every 3-6 s with no gaps,
2 checkpoints, 8 quiz questions (≥5 kinds incl. order, bins and spot; numeric/label where they fit), 4-5 cards,
lab config + 5 tasks, a mission config with timed events, character messages and goals, and 3 hints.
Mini-game logic is exported as pure functions and unit-tested (`minigames/*.test.tsx`), plus a play-through render test per game.

Checks: `npx tsc -b` reports no errors in my folders; `npx vitest run src/content/ch1` passes,
including the shared validator for all 13 levels. My levels also pass the stricter L01/L02 "showcase bar"
(checked ad hoc). I also eyeballed every scene by rendering frames to PNG.

## Sim-config conventions the engine should know about (please check, OC-sim)
- **L07**: knob `cdn` (toggle) turns the CDN on and off, and `ttl` is the CDN TTL. The mission kills the node `cdn` at 50 s and revives it at 70 s; CDN fallback = "static share goes back to the web tier", which matches the engine brief.
- **L08**: knob `sticky` (toggle, starts on). Session store via palette `session-store` / `nosql`. There is **no `autoscale` knob id** in the contract, so autoscaling is approximated with the `servers` slider in both lab and mission.
- **L09**: region names = datacenter **node ids** `us-west` / `us-east`; `region-down` uses `region: 'us-west'`. `split` = % to US-East. There is **no "replication" knob id**, so the lab uses `replicas` (0 = no cross-DC replication) and the mission expects a `db-w → db-e` replication edge or a `db-replica`. The engine needs to decide how it detects cross-DC replication.
- **L10**: `jobs` events plus the `workers` knob; the mission has `maxQueue: 400` and kills/revives target kind `worker`.

## Known gaps
- The contract has no knob ids for autoscale, CDN fallback or cross-DC replication (see above). Workarounds are in place; I did not write a contract request because I'm only allowed to touch my own folders. The orchestrator may want one.
- The "Order the CDN flow" mini-game uses click-to-place rather than @dnd-kit dragging (simpler and keyboard accessible).
- Mission budgets and rps values are guesses until `src/sim/components.ts` costs are final; please tune them after the engine lands.
- Heads-up for everyone: `node_modules/.vitest-cache` (fs module cache) had a stale copy of `validate.test.ts` whose `import.meta.glob` only saw L01/L02, so new levels were silently **not validated**. `npx vitest --clearCache` fixes it.
