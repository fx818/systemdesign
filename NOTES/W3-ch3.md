# W3-ch3: Chapter 3 "The Interview Framework"

All work is in `app/src/content/ch3/**`. Nothing else was touched and nothing was committed.

## What I built
Four levels (`chapter: 3`, ids C3L01-C3L04, number 1-4), auto-discovered by `registry.ts`. Story: Ravi coaches the player for a real interview, and Maya plays the vague interviewer.

| Level | Pages | Scene | Mini-game | Mission (sim) | Badge |
|---|---|---|---|---|---|
| C3L01 Ask Before You Build | 42-44 | 168 s. Schedule dread; signals (collaboration, pressure, ambiguity, good questions); red flags (an over-engineering tower with a compounding-cost meter, narrow-mindedness, stubbornness); Jimmy and the tiger; the 4 starter questions; written assumptions; the news-feed Q&A, which turns into sticky-note requirements | **Clarify!** (`minigames/Clarify.tsx`). Chat with a vague interviewer over 2 prompts (news feed with 6 requirements in 8 turns; photo app with 4 in 6 turns). Each turn offers a good question, a premature solution (red flag, -15%) or filler (wasted turn). It includes a "you decide" moment where the assumption only counts if you write it down | Build exactly the clarified scope: web + mobile, 600 rps, separate DB. Budget 490, so a load balancer or other over-engineering doesn't fit | The Clarifier (`MessageCircleQuestion`) |
| C3L02 Blueprint | 44-46 | 174 s. Propose/feedback/refine loop and buy-in; box diagram (clients, APIs/web, DB, cache, CDN, queue, workers); envelope napkin math (10M DAU x 10 views / 86,400 ≈ 1,157 QPS, peak ≈ 2,314); use case and edge case; when API endpoints and schema belong; feed publishing (Fig 3-1) and feed building (Fig 3-2), simplified, with animated packets | **Blueprint**. Part 1: place 8 boxes on the feed-publishing whiteboard; the tray has decoys (EdgeRank ML ranker, blockchain…). Part 2: order the publishing and building flows from a mixed deck | Build the news-feed high-level design from scratch: LB, 4 web servers, cache, DB, queue, 4 workers. Traffic peaks at 2,500 rps, fan-out at 150 jobs/s, and a web server is killed. Budget 1650 | Buy-in Builder (`LayoutTemplate`) |
| C3L03 Dig Deep | 46-48 | 170 s. The 4 step-3 objectives; prioritising with the interviewer; reading the interviewer (stay high level, senior/perf, components); URL shortener hash function and chat latency / presence; EdgeRank rabbit hole as the clock races; deep dives into publishing (queue + fan-out workers into 5,000 feed caches) and retrieval (feed cache IDs, then post/user caches, then CDN), both labelled as a "simplified preview" | **Time Boss**. Split 45 minutes with 4 sliders, graded against 3-10/10-15/10-25/3-5. Then spend your step-3 minutes on the deep-dive topics that matter for 3 prompts (URL shortener, chat, news feed); rabbit holes cost points | The interviewer points at 2 bottlenecks: the post DB on feed reads and the fan-out storm at 180 jobs/s. Fix exactly those (cache + 2 workers). More web servers don't help. Budget 1500 | Deep Diver (`Pickaxe`) |
| C3L04 Land the Plane | 48-50 | 172 s. Landing intro; "my design is perfect" ✕; the 6 wrap-up directions (bottlenecks, recap, error cases, operations, next scale curve, refinements); dos and don'ts columns; 45-minute split with a sweeping clock; ends with an **Interview Mode UNLOCKED** card and Ravi | **Do or Don't?** Rapid sort of 18 habit cards, 7 s each (a timeout counts as a miss), with arrow keys or buttons, a combo counter and a reason for each answer | Wrap-up questions live: a web server dies, traffic doubles (the next scale curve), then the primary DB dies. You need 3 more web servers, a replica, and metrics/logging for operations. Budget 1650 | Interview Ready (`PlaneLanding`) |

Each level has incident and debrief dialogue, a mission brief and 3 hints, a lab (framework-driven knobs, healthy at start, plus 5 tasks), 5 chapters per lesson, gap-free captions of 7 s or less, 5 hotspots, 2 checkpoints, 8 quiz questions (5-7 kinds each, including spot, label and numeric), 5 cards and a badge.
**The C3L04 debrief ends with Ravi: "Interview Mode is now unlocked…"**, which hands off to `/interview` (owned by W3-practice).

Shared files: `ch3/framework.ts` (STEPS with time ranges, the news-feed Q&A, starter questions, DOS/DONTS) and `ch3/kit.tsx` (deterministic scene helpers: `FrameworkRail`, `ChatBubble`, `InterviewClock`, `Whiteboard`, `StickyNote`, `CheckRow`, `Box`).

## Tests
- `ch3/validate.test.ts`: reuses `ch1/validate.ts#validateLevel` and filters out its 3 chapter-1-only rules (L01 id format, pages 5-33), replacing them with ch3 rules (C3L0N ids, chapter 3, pages 42-50). Also checks the content bar, scene determinism, NaN, hotspot reachability and video mode.
- `ch3/playability.test.ts`: explicit legal plans using the real runner rules (100 ms ticks, recent window, 3 s breach, 3 lives). Each mission passes at ≤85% of budget with ≥2 stars, and an untouched start loses. Each lab is healthy, and killing its web tier breaks it. Level-specific negatives: missing mobile wire, no separate DB, LB over budget, no spare web server, no cache, no queue, only one of the two deep-dive fixes, the "wrong component" fix, no replica (data loss), no extra web servers for the scale curve.
- Mini-game tests play each game perfectly to a score of 1 and check scoring and determinism, plus the decoy and timeout paths.
- `npm run typecheck` passes and `npm run build` passes. `npm test`: everything in ch3 passes (67 tests). **9 failures, all in `src/content/ch1/playability.test.ts`** (not mine; see below).

## Needs the orchestrator
`src/content/ch1/playability.test.ts` iterates over **every** registry level and asserts the list equals `[1..13]`, so it now fails for C2L* and C3L* levels. Its `solution()` has no case for them, so it tests their untouched start as the "hinted" plan. Suggested one-line fix (in the orchestrator/Codex-owned file):
`const levels = allLevels.filter((l) => chapterOf(l) === 1);` (import `chapterOf` from `@/content/registry`). Chapter 2 and 3 have their own playability suites.

## Known gaps
- The detailed deep-dive designs (fan-out workers, feed/post/user caches, CDN) come from the book's later news-feed chapter, which ch3 only references. They are labelled "simplified preview".
- Napkin math uses our own assumption (10 feed views per user per day), which is stated as an assumption in the scene and hotspot.
- The C3L04 DB failover costs one life while the replica is promoted (the engine's 3 s promotion delay). The test asserts at least 2 lives remain.
- Structural requirements (e.g. "metrics/logging for operations" in C3L04) are hinted but can't be enforced through `SimGoals`.
- oxlint shows only warnings (only-export-components because Scene files export `T`, and the same immutability warnings as ch1).
