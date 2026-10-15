Repo: /home/imart/Desktop/Ideas/systemdesign (app in app/). FIRST read AGENTS.md, GAME_DESIGN.md,
app/src/types/content.ts (shared contract — do not edit; ask in NOTES/contract-requests.md), app/src/content/chapters.ts,
app/src/content/registry.ts, and NOTES/*.md for what exists. The app is complete for Chapter 1 (13 levels, sim engine
@/sim, quiz engine @/quiz, lesson player @/player, game store @/game, scenekit @/scenekit). Other agents work in
parallel — ONLY touch the paths you own (listed below). Never run dev/watch servers in the foreground.
Verify: `cd app && npm run typecheck && npm test && npm run build` (run vitest with --clearCache first if levels seem
missing). Do not git commit. Write NOTES/W3-ch3.md (what you built, how to use, gaps) when done.

# W3-ch3 — Chapter 3: The Interview Framework (Claude, gamification lead)
Owns: app/src/content/ch3/** only.
Source: reference/ch3.txt (book pages 42-50). Read it fully. Study app/src/content/ch1/L01 (reference quality),
app/src/scenekit/README.md, app/src/content/ch1/validate.ts (reuse validateLevel in ch3/validate.test.ts).

Story: Ravi is now coaching the player for a real system design interview at a big tech company; Maya does mock
interviews playing the "vague interviewer". Build 4 levels (`chapter: 3`, ids C3L01..C3L04, folders app/src/content/ch3/):
- C3L01 "Ask Before You Build" — Step 1 understand the problem & establish design scope: what interviewers look for
  (collaboration, working under pressure, resolving ambiguity, asking good questions), red flags (over-engineering,
  narrow-mindedness, stubbornness), don't jump into a solution, the clarifying questions list, the news-feed example
  dialogue. Mini-game "Clarify!": a chat with a vague interviewer; pick good clarifying questions vs. premature
  solutioning; score on asking the right ones in a limited number of turns.
- C3L02 "Blueprint" — Step 2 high-level design & buy-in: blueprint, collaborate, box diagrams, back-of-the-envelope
  check, walk through use cases, API endpoints/schema when relevant; news feed publishing vs feed building flows.
  Mini-game: assemble the news-feed high-level diagram from boxes (drag/connect) and order the two flows.
- C3L03 "Dig Deep" — Step 3 design deep dive: prioritise components, time management, avoid unnecessary details
  (EdgeRank example), deep-dive examples (feed publishing, retrieval).
  Mini-game "Time Boss": allocate your 45 minutes across steps (3-10 / 10-15 / 10-25 / 3-5 min) and pick which deep
  dives matter for a given prompt.
- C3L04 "Land the Plane" — Step 4 wrap up: bottlenecks, recap, error cases, operation issues, next scale curve,
  refinements; Dos and Don'ts lists; time allocation. Mini-game "Do or Don't": rapid card sort of the dos/don'ts.
  This level's debrief should hand off to Interview Mode (route `/interview`, built by another agent): end the
  debrief with Ravi saying Interview Mode is unlocked.
Each level: incident + debrief dialogue, 120-180s deterministic Scene, captions, chapters, hotspots, 2 checkpoints,
6-8 quiz questions (order/bins/mcq/multi/truefalse), 4-5 cards, badge. Lab & mission are REQUIRED by the contract:
make them framework-driven with the sim (e.g. C3L02 mission: build the news-feed high level design within budget so it
meets the stated scale; C3L03: deep-dive fix the bottleneck the interviewer points out). Write ch3/playability.test.ts
proving each mission is winnable. Do the work yourself sequentially (no sub-agents). Finish & test each before the next.
