# W3-practice

Implemented chapter support first: chapter-scoped prerequisites/bosses and chapter transitions, a chapter selector with progress/availability, and the Chapter-1-only architecture map. Profile labels and Flashback cards include chapter context. The concurrently owned VideosScreen now groups chapters (its video agent owns that final implementation).

Built all four practice routes, HQ cards, navigation, persisted statistics and hidden achievement toasts:

- `/interview`: eight prompts, 45-minute deadline, scored clarification/requirements, DAU/QPS/peak/storage estimates (20% tolerance), real ArchCanvas and SimRunner mission submission, structural rubric, bottleneck choice, three graded follow-ups, wrap-up and hiring/XP results. Either L13 or C3L04 opens it. Failed SLOs cap at No Hire; incomplete topology caps at Lean Hire. Optional Anthropic follow-up uses the exact requested model/headers, only when a browser key is configured on Profile; errors use scripted questions.
- `/sandbox`: unlimited workspace with every component, JSON import/download, safe Mermaid export/copy, actual SVG-to-canvas PNG download, and a SimRunner lab copy with all eleven knobs and chaos controls.
- `/puzzle`: local-date seeded daily variants (LB SPOF, missing cache, sticky sessions, region outage), topology move limits/budget, structural repair checklist and real chaos mission; daily XP is idempotent, with puzzle streak and share text.
- `/survival`: budgeted editor/live upgrades, deterministic seeded failures with recovery, doubling traffic every 30 seconds, sustained-breach defeat, elapsed score and saved personal best, including navigation away.
- All eight requested hidden achievements: unique lab kills, boss uptime, mission spend, actual quiz max combo, night play, five three-star levels, puzzle streak and survival milestone. Existing store methods/API remain compatible.

Public reusable helpers live in `@/practice`: `gradeArchitecture`, graph reachability, date puzzle/PRNG/move/share helpers, Mermaid/JSON/PNG export helpers, prompt/estimate/session grading helpers, interview access and survival runtime/config. Added `ACHIEVEMENTS`, `earnedAchievements` and typed practice events to `@/game` without changing the shared content contract.

Minimal screen integration includes Profile/Review chapter context and Profile settings/stats, plus Lab/Mission/Quiz achievement triggers. The simulator and quiz engines are untouched. The lab wrapper observes user-issued chaos commands because SimRunner has no chaos callback. Submitted interview/puzzle graphs are frozen during testing so topology and numerical results refer to the same design. Sandbox runs are clearly labeled disposable copies; exports refer to the workspace, since SimRunner does not expose its internally edited graph.

Validation:
- `npm run typecheck`: passed with strict TypeScript.
- `npm run build`: passed, including PWA generation and the parallel chapter/platform changes. Vite retains the existing large Chapter 1 chunk advisory; practice screens are separate lazy chunks.
- Focused practice/game/shell tests: **125 passed in 15 files**, including all four legal puzzle repairs, all eight passing interview designs and a legal 180-second survival design.
- Chrome practice suite: **11 passed**. Covers every route, both interview unlock alternatives, all four interview phases and persisted grade, the 45-minute timeout, PNG/JSON/Mermaid export and JSON import, five-node chaos/achievement/toast persistence, a completed daily puzzle/one-time reward/reload/share, chapter selection and 390px layouts. No console/runtime errors.
- Targeted oxlint: no errors or warnings. `git diff --check`: passed. Shared content contract unchanged; no commits made. Preview port 4183 confirmed closed after browser checks.
- Full repository suite: `npm test -- --maxWorkers=2` — **570 tests passed in 65 files**, after the owner scoped the Chapter 1 playability test to its chapter. Worker count was limited while the parallel agents were also validating.

Optional AI request details were checked against the [Anthropic API overview](https://platform.claude.com/docs/en/api/overview). No real key or paid request was used; request/response/fallback handling is tested with mocked fetch.

The temporary Chapter 3 frame helper was removed by its owner before final typecheck/build. The Chapter 1 test integration fix also belongs to its owner. Neither file was edited by W3-practice.
