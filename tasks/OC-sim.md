Repo: /home/imart/Desktop/Ideas/systemdesign (app code in app/). FIRST read AGENTS.md, GAME_DESIGN.md
and app/src/types/content.ts (the shared contract — do not edit it). Only touch the directories you own.
Verify with `cd app && npm run typecheck && npm test` (never run dev/watch servers in foreground).
Finish by writing NOTES/OC-sim.md (what you built, exports, known gaps). Do not git commit.

# Task OC-sim — Architecture simulator, Lab and Mission screens

This is the core game engine used by every Lab, Mission and the Boss level. Read GAME_DESIGN.md section 6.

1. `src/sim/components.ts` — `COMPONENTS: Record<ComponentKind, ComponentSpec>` with sensible cost/capacity/latency
   (e.g. web 1000 rps 20ms cost 100; db 800 rps 15ms; cache 20000 rps 1ms; cdn huge capacity 5ms but only for static share;
   lb 50000 rps 1ms; queue absorbs bursts; worker processes jobs 50/s ...).
2. `src/sim/engine.ts` — PURE DETERMINISTIC `simulate(config, graph, tSec, knobs?) => SimState` plus a stepping API
   `createSim(config, graph) -> { step(dt), state, apply(event) }`. Model (simple but meaningful):
   - Traffic rps from events; split into static share (~60%, served by CDN if present & healthy, else web) and dynamic.
   - Dynamic: through LB (if present) to healthy web servers, else to the single web server; if no healthy web path -> errors.
   - Reads vs writes (90/10): reads hit cache first (hit rate from TTL/cacheSize knobs and eviction), misses go to
     replicas (or master if none), writes go to master. Master down -> promote replica after 3s (or outage if none).
   - Sticky sessions toggle: when a server dies, its share of users lose sessions (error spike) unless session-store present.
   - Data centers: regions with split %, region-down -> geoDNS failover to other DC (with latency penalty), data loss if
     no replication between DCs.
   - Queue: jobs/sec in, workers drain; queue length grows if under-provisioned; without queue, web latency balloons.
   - Shards: user data split by shard count; hotkey event concentrates share on one shard -> overload.
   - Each component: utilisation = load/capacity; latency grows sharply above 80% (queueing); >100% -> drops requests.
   - Metrics per tick: uptime (successful/total, cumulative), p95 latency estimate, cost (sum placed), cacheHitRate,
     queueLength, per-node load/health, and a list of human-readable alerts ("web-1 overloaded 134%").
   Thorough vitest tests: SPOF without LB causes outage on kill; LB + 2 web survives; replica promotion; cache cuts db load;
   CDN offloads static; sticky sessions break on kill; queue grows when workers < jobs; hotkey overloads a shard;
   determinism (same inputs -> same outputs).
3. `src/sim/ArchCanvas.tsx` — SVG (viewBox 0 0 1280 720) architecture diagram: nodes with icons (lucide) per kind,
   coloured health rings (green/amber/red/dead grey), load % bars, animated request dots flowing along edges at a rate
   proportional to traffic (dots computed from time, not random), edge labels. Editable mode: drag nodes from a palette
   (@dnd-kit), connect by clicking node A then node B, delete with a button, budget shown; locked nodes can't be removed.
   Also used read-only by `spot`/`label` quiz questions — export it cleanly.
4. `src/sim/SimRunner.tsx` — `<SimRunner config mode onFinish(result)/>`:
   - LAB mode: knobs panel (sliders/toggles/selects from config.knobs), "chaos" buttons (kill any node, spike traffic),
     live meters, task checklist passed in via props `tasks` (just shown), finish button.
   - MISSION mode: build phase (place components within budget, Ravi hint button costs XP via callback), then
     "Go live" -> run timeline of config.events over goals.durationSec (speed 1x/2x/4x), live meters with goal lines
     (uptime, p95, cost, queue, cache hit), event banners & character messages (event type 'message'), 3 lives (lose one each
     time a goal meter is in the red for 3+ s), result {passed, uptime, p95, cost, livesLeft, stars}.
     Stars: 1 = passed, 2 = passed & cost <= budget*0.85 or no life lost, 3 = both and no hints. Retry button.
   - Export index `src/sim/index.ts` with simulate, createSim, COMPONENTS, ArchCanvas, SimRunner, types.
5. `src/screens/lab/` and `src/screens/mission/` — thin page wrappers if useful (OC-shell routes import `@/sim`).
Make the canvas genuinely fun: pulses on overload, servers smoking/flashing when dead, a big "OUTAGE" banner, satisfying
"Recovered" animation. Performance: 60fps with ~30 nodes.
