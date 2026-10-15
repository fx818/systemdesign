# System Design Quest: Plan (Chapter 1 pilot)

Source: "System Design Interview Vol 2" PDF, pages 5-33,
"Chapter 1: Scale From Zero To Millions Of Users" (~4.8k words, 27 figures)

## Environment check (done)
- claude 2.1.300   -> works (claude -p smoke test OK)
- codex 0.162.1    -> works (gpt-6-astra; needs `--sandbox danger-full-access` + stdin </dev/null from Hermes)
- opencode 1.18.34 -> works (default model glm-5.3-flash, OpenCode + OpenCode Go auth)
- node 26, npm, python3, pdftotext, pdfimages -> all present
- No git repo yet (codex needs one; will `git init`)

## Chapter 1 -> 13 levels
 1. Single server setup (DNS, request flow, web vs mobile traffic)
 2. Database tier (separating tiers, SQL vs NoSQL)
 3. Vertical vs horizontal scaling
 4. Load balancer (private IPs, failover)
 5. Database replication (master/slave, failover)
 6. Cache (read-through, expiry, consistency, eviction, SPOF)
 7. CDN (static assets, TTL, cost, fallback, invalidation)
 8. Stateless web tier (stateful vs stateless, sticky sessions, shared session store)
 9. Data centers (geoDNS, failover, data sync)
10. Message queue (producer/consumer, decoupling)
11. Logging, metrics, automation
12. Database scaling (vertical, sharding, sharding key, resharding, celebrity problem, joins)
13. Boss level: "Millions of users" (full architecture recap + summary checklist)

## Game design
Full design (story, missions, quizzes, all 13 levels): see GAME_DESIGN.md

## Per-level content
- Animated lesson: scripted scenes (SVG + Framer Motion), step-by-step, with
  captions, play/pause/scrub, "what breaks here" moments (e.g. server dies, traffic spikes)
- Interactive sandbox: tweak users/traffic and watch the system behave
- Challenge: quiz (MCQ, ordering, "spot the bottleneck"), drag-and-drop architecture builder
- Rewards: XP, badges, streaks, unlock next level; architecture map grows as you progress

Core game loop: user count climbs from 1 -> 10M; at each threshold the system
starts failing in the animation and the player must add the right component (the
next level) to fix it.

## Decisions (confirmed)
- Web app (PWA) first, mobile wrap later (Capacitor)
- Animations: interactive in-browser AND rendered MP4, from the same source
- Captions only, no narration yet
- Personal study use

## Stack
Vite + React + TypeScript + Tailwind, progress in localStorage, PWA.
Animations are written once as Remotion compositions (React/SVG, frame-based):
- In the app: @remotion/player -> scrubbable, pausable, with clickable overlays
- Offline: `npx remotion render` -> MP4 per level (ffmpeg + Chrome already installed)
For now: scenes are plain React components, written by Claude Code in the
project. Every scene stays a single self-contained file (artifact-compatible),
so artifacts can be swapped in later without changing the app.

## TODO: Claude artifact integration
- [ ] Check whether Claude Code (CLI 2.1.300) can create/publish artifacts
      directly from here; if yes, use it to generate the scenes
- [ ] Manual route: user exports artifacts from claude.ai and saves them in
      `artifacts/ch1/` (one file per scene, named like `L04-load-balancer.tsx`)
- [ ] Loader that picks up any file in `artifacts/ch1/` and uses it in place of
      the matching React scene in the app
- [ ] Render artifacts to MP4 too (same Remotion / headless Chrome + ffmpeg pipeline)

## Resource limit
14 GB RAM, ~2 GB free right now. Cap at 2-3 coding agents running at once and
render MP4s one at a time.

## Delegation
- Hermes/Claude (orchestrator): extract chapter, write the curriculum spec
  (content/ch1/*.json: scripts, scenes, key points, quizzes), review & merge
- Claude Code: animated lesson scenes (self-contained React files, artifact-compatible), 1 level per task, in parallel
- Codex: app shell, routing, scene player, gamification engine
  (XP/levels/badges/streaks), quiz engine, drag-drop builder, tests
- OpenCode: question bank expansion, content/fact checking against the source,
  lint/a11y/QA passes

## Milestones
M0 scaffold + content spec -> M1 engine + 2 levels end-to-end -> M2 the other 11 levels
-> M3 boss level, polish, QA

## Note
The book is copyrighted. Fine for personal study; if this gets published,
lessons should use our own wording and redrawn diagrams, not copied text or figures.

## Wave 3 (in progress)
- W3-video (Codex): MP4 export pipeline (scripts/render), Videos screen with player + download
- W3-ch2 (Claude): Chapter 2 Back-of-the-envelope estimation, 4 levels (C2L01-C2L04)
- W3-ch3 (Claude): Chapter 3 Interview framework, 4 levels (C3L01-C3L04)
- W3-practice (Codex): chapter support in shell, Interview Mode (+ optional AI interviewer),
  Sandbox with PNG/Mermaid/JSON export, Daily Puzzle, Survival, hidden achievements
- W3-platform (OpenCode): PWA icons, code splitting, Capacitor/Android
Next: Codex review of wave 3; Chapters 4-6 (rate limiter, consistent hashing, KV store); Claude artifact TODO
