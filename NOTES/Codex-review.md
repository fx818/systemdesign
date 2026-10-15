# Codex-review

Completed `tasks/Codex-review.md`, prioritizing playability. No commits. The shared content contract and component catalogue prices are unchanged. Pre-existing task-file changes were left intact.

## Issues found and fixes

| Severity | Files | Issue and applied fix |
| --- | --- | --- |
| Critical | `app/src/content/ch1/L01..L13/sim.ts` | Starting/required infrastructure exceeded budgets, and several later hinted builds also failed capacity or life checks. Retuned whole-board budgets, traffic, palettes, knobs and lab SLOs against the real engine. Every mission now has an affordable passing plan and a losing untouched start. |
| High | `L03/sim.ts`, `L04/sim.ts` | Web-scaling solutions overloaded the single database. Peak traffic now stays within its capacity; L03 still exceeds one web server's ceiling. L04's lab now demonstrates successful failover before asking the player to increase capacity. |
| High | `L06/sim.ts` | Cache could not repair insufficient web capacity. Preplaced four web servers and funded two caches; the scripted cache failure still requires redundancy and the hit-rate goal still requires caching. |
| High | `L08/sim.ts`, `L09/sim.ts` | Mobile requests bypassed the CDN, invalidating hinted scaling/failover solutions. Connected both clients; funded the autoscaling pool and surviving East capacity. L09's existing databases can be synchronized with a free replication wire. |
| High | `L10/sim.ts` | Web/database overload obscured the queue lesson; a virtual worker pool on one node disappeared entirely on its crash. Tuned traffic, made the lab healthy initially, and use five physical mission workers plus a third web server. One crash leaves sufficient consumers. |
| High | `L11/sim.ts` | Budget omitted the hinted tools/server/worker; all queue producers disappeared when web-3 died. Funded the build, connected all original servers to the queue/shared sessions, and added a queue bound and meaningful surge. |
| High | `L12/sim.ts`, `L13/sim.ts` | Hints assumed capacities/behaviors the engine does not implement. Added web headroom/cache controls; explain that an ordinary extra shard does not migrate a celebrity key. Boss hints stage replica promotion, regional failover, then connect preplaced shards before the celebrity wave. |
| High | `app/src/sim/ArchCanvas.tsx`, `engine.ts` | The boss's US-West event could silently miss editor-generated data-center IDs, and East split relied on IDs. Added editable region names and use labels for East ordering. NoSQL nodes can also be named Session store so L08's hinted alternative works. |
| High | `app/src/game/store.ts`, `screens/{simBridge,MissionScreen,DebriefScreen}.tsx` | Debrief discarded the simulator's earned star limit. Persist its optional star score and cap debrief rewards accordingly; older saves remain compatible. Added integration regression tests. |
| Medium | `app/src/screens/simBridge.tsx` | A stale “module not installed” placeholder swallowed real simulator failures. Removed it and the unsafe export cast; retain typed lazy loading of the actual simulator. |
| Medium | `L01/sim.ts`, `L10/sim.ts` | Initial slider values were off-step, so native inputs disagreed with engine defaults. Fixed steps and added a catalogue-wide check. |
| Medium | `app/tsconfig*.json` | Strict checking was absent despite the repository rule. Enabled it and included Playwright/config/E2E files in typechecking. |

## Verified mission plans

`app/src/content/ch1/playability.test.ts` contains explicit, legal builds using each palette, locked-node rules and visible knobs. It steps the full timeline at the runner's 100ms cadence, including recent uptime, three-second breaches, three lives and early defeat. Each plan reaches the end, meets the goals, stays below 85% of budget at peak spend and earns at least two simulator stars. Every unchanged mission start loses. Each lab has a healthy build and a chaos scenario that breaches its SLOs; sandbox completion remains available after exploration.

| Level | Tested peak cost | Budget | Passing plan |
| --- | ---: | ---: | --- |
| L01 | 110 | 130 | One web server wired to both clients |
| L02 | 410 | 500 | Separate relational database |
| L03 | 610 | 750 | Three web servers with client/data connections |
| L04 | 860 | 1050 | LB and four servers, surviving web-1's crash |
| L05 | 1410 | 1700 | Three replicas, promotion and subsequent replica failure |
| L06 | 1350 | 1600 | Four supplied servers and two connected caches |
| L07 | 1330 | 1600 | CDN plus third origin server, surviving CDN fallback |
| L08 | 1610 | 1900 | Shared session store and server target 5; NoSQL alternative also tested |
| L09 | 1910 | 2250 | Database replication wire and extra East web server |
| L10 | 1560 | 1850 | Third server, queue and five physical workers |
| L11 | 1830 | 2200 | Logs, metrics, CI, fourth server and second worker |
| L12 | 1570 | 1850 | Replace master with four shards, five web servers, cache size 50 |
| L13 | 4110 | 4900 | Named West/East regions, 3/4 servers, CDN/LB, sessions, redundant caches, primary/replica, four shards, queue/four workers and tools; attach shards at 110s |

Additional regressions cover insufficient cache redundancy, missing cross-region replication, uncached celebrity load, real boss-region failures, actual replica promotion before sharding, editor-generated IDs, named NoSQL sessions and native slider steps.

## Integration and browser coverage

Verified required exports, real lesson scenes/captions/hotspots/checkpoints using `@/quiz`, QuizRunner, level-configured SimRunner, mini-games, rewards, cards, badge/unlock flow, HQ map/path and the standalone `/render/:id` route. Existing quiz fallback files were already removed by Codex-fix.

Installed `@playwright/test`; added `npm run e2e`, `playwright.config.ts` and `app/e2e/smoke.spec.ts`. Uses system Chrome with `channel: 'chrome'`. Playwright builds and owns the background Vite preview on port 4173, then terminates it. All pages fail on browser console/runtime errors.

The fresh-state L01 walkthrough reveals/advances incident dialogue, scrubs the lesson, answers a real checkpoint, checks captions/chapters/hotspots, finishes the lesson, explores lab failures, completes all three Packet Journey rounds, places/wires/runs the mission, answers all eight interview questions, claims the badge/XP, verifies three stars/L02 unlock and checks reward persistence after reload. Other checks cover 65 routes across all levels, direct-link locks, deterministic 1280×720 video rendering, mobile overflow, all authored L01 quiz kinds (including real keyboard sorting), and placed/named region failures.

## Final validation

- `npm run typecheck`: passed with strict TypeScript, including E2E/config files.
- `npm test`: **383 tests passed in 44 files**, including **48 playability tests**.
- `npm run build`: passed; existing bundle-size advisory only.
- `npm run e2e`: **19 Chrome tests passed**, including the complete fresh-player journey and all 65 level routes; no browser console/runtime errors.
- Targeted oxlint: zero errors; seven existing debrief purity warnings.
- `git diff --check`: passed. Verified the content contract and component-price catalogue have no diff.
- Preview process cleanup verified: port 4173 is closed after the suite.

All required public exports remain available. `MissionResultSummary` has one backward-compatible optional `stars` field; the shared content contract is unchanged.

## Remaining decisions / limitations

- No remaining build, type, test or mission-playability blockers.
- Structural grading is not represented by the shared `SimGoals` contract: alternative architectures can meet numerical SLOs without every thematic component (for example L11's passive tools). Decide whether a future structural rubric is wanted. Tested hinted builds include the intended components; no contract change was made.
- The three-second primary promotion can consume a life under recent-window uptime rules; efficient L05 play still passes and earns two stars. Decide separately whether every intended failover should preserve all lives/permit three stars.
- The existing large-main-bundle advisory remains. Targeted oxlint has no errors; pre-existing debrief confetti/timestamp purity warnings remain outside deterministic lesson scenes.
