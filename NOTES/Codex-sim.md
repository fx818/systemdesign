# Codex-sim — simulator handoff

Implemented the simulator engine, architecture editor and game runner. No commits made by this agent. The shared content contract and quiz files were not edited.

- `app/src/sim/engine.ts`: deterministic `simulate` and stepping `createSim`. Fixed event boundaries and large steps; real graph reachability and LB failure; read/write capacity accounting; replication-link discovery and repeatable promotion; cache size/TTL/eviction and cache fallback; CDN static offload/TTL/origin fallback; sticky-session failure/scaling; region IDs, East split, cross-DC ownership/replication/failover/data loss; queued jobs and connected workers; sharding/hot keys; passive observability tools. Live graph and knob edits preserve elapsed time and totals. Virtual pools scale up/down, retain failures, and count toward cost.
- `ArchCanvas.tsx`: shared scenekit icons and nodes, deterministic traffic dots, health/load rings, smoke and outage banner. Pointer/keyboard palette placement, dragging, directed wiring, wire deletion, disconnection, locked-node deletion protection, budget checks, quiz selection callbacks. Narrow screens scroll the board without overflowing the page.
- `SimRunner.tsx`: lab controls, chaos/revive, task checklist, telemetry/history, build phase, live editing, speed/pause, event/character banners, three lives (one per sustained 3s breach), scoring, hints through XP callback, result screen, reward claim and retry. Run results are delivered once when the player claims/saves the result; failed runs can be retried before saving. Labs finish on the exploration button.
- Minimal screen/bridge integration: lab tasks passed through; mission hint/life/retry callbacks connect to the existing game store. These screen changes were also included in the concurrently completed Codex-fix shell handoff.

## Public exports (`@/sim`)
`simulate`, `createSim`, `initialKnobs`, `COMPONENTS`, `graphCost`, `ArchCanvas`, `SimRunner`; `Sim`, `SimMessage`, `ArchCanvasProps`, `SimRunnerProps`, and all sim types (`SimState`, `SimResult`, `NodeState`, `Health`, `EdgeFlow`, `KnobValues`, `KnobId`). `createSim` exposes `step`, `state`, `apply`, `setKnobs`, `setGraph`, `drainEvents`, `messages`, and `time`.

`SimResult` includes the original `passed/uptime/p95/cost/livesLeft/stars` and shell-compatible `goalsMet/withinBudget/xp`. Optional runner props: `tasks`, `hints`, `hintsUsed`, `onHint`, `onLifeLost`, `onRetry`. Optional read-only canvas selection props: `onNodeClick`, `selectedNodeIds`.

Kind-targeted kill events take down **one** healthy node in deterministic graph order; ID targets select exactly that node. A `db-replica` kind kill prefers a read replica over the promoted primary. This matches the authored "one server/cache/worker crashes" waves and permits redundancy to work. Kind-targeted revives revive that kind. Datacenter IDs and labels both work for region events; reviving the DC restores its region.

Stars follow OC-sim's detailed brief: one for passing; two if within budget and either spending ≤85% or keeping every life; three require both, plus no hints. The shell's final level stars additionally depend on the interview, as implemented by its own team.

## Validation
Final required sequence passed: `npx vitest --clearCache`, `npm run typecheck`, `npm test` (43 files / 331 tests), and `npm run build`. `npx oxlint --deny-warnings src/sim` and `git diff --check` also pass.

41 simulator tests across engine, canvas, runner and scoring. Engine tests include all requested scenarios plus every authored lab/mission timeline, exact event boundaries, zero worker/replica/cache knobs, virtual-pool cost, cross-DC replication, cache eviction casing, and live editing. Runner tests exercise timed completion, result claims, lives, pause/speed, hints, budget checks, chaos/recovery and retry. Canvas tests cover keyboard edits, locked nodes, quiz selection, budget protection and deterministic SVG output.

Browser checks in headless Chrome: desktop L09 lab, region-down, actual palette drag/drop, L01 mission placement/wiring/go-live, speed, mobile layout, complete L01 mission and shell reward persistence. No browser errors. Screenshots were inspected at `/tmp/codex-sim-lab-desktop.png`, `/tmp/codex-sim-mission-desktop.png`, `/tmp/codex-sim-mobile.png` (temporary verification artifacts).

## Content tuning needed (outside this agent's ownership)
The existing catalogue prices were preserved. Some authored missions are impossible with their current data; the simulator exposes the constraints instead of silently increasing the budget/capacity:

| Level | Start cost | Locked cost | Budget |
| --- | ---: | ---: | ---: |
| L03 | 410 | 410 | 300 |
| L05 | 660 | 660 | 400 |
| L06 | 910 | 910 | 450 |

Other concrete tuning conflicts:
- L02 starts at 110 credits; adding its requested 300-credit relational DB costs 410, above its 400 budget.
- L04's hinted LB plus three extra web servers costs 860 in total, above 600 (its locked DB+DNS alone cost 310).
- L05's hinted three replicas cost 750 in addition to its 660-credit starting board, rather than fitting 400.
- L06 reaches 3,200 rps through two 1,000-rps web servers with no web palette or server knob. A read-through cache reduces DB work, not web requests, so this needs more web capacity as well as a corrected budget.
- L07 starts at 1,030; its hinted CDN + extra origin server totals 1,330 against 1,100. The hints for several later levels similarly need a capacity/cost playability pass.
- L11's 1,550 starting cost leaves 150 of 1,700: logging + metrics + CI use 100, leaving no room for its hinted additional 100-credit server (total 1,750).

The simulator is a teaching model: virtual scale knobs represent several servers with one visible node; p95 is an estimate; hot-key effects last 20s or until replaced; logging/metrics/CI are observable tooling, not capacity bonuses. The production build retains the app's large-main-chunk advisory.
