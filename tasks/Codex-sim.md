Repo: /home/imart/Desktop/Ideas/systemdesign (app in app/). Read AGENTS.md, GAME_DESIGN.md, app/src/types/content.ts,
tasks/OC-sim.md (the original spec) and NOTES/*.md first.

# Task Codex-sim — finish the simulator (the previous OpenCode agent stalled)

Already done and committed: app/src/sim/components.ts (COMPONENTS), app/src/sim/engine.ts (createSim, simulate,
~720 lines), app/src/sim/types.ts. NOT done: tests, ArchCanvas, SimRunner, index.ts.

1. Review engine.ts against tasks/OC-sim.md section 2; fix bugs; fix the tsc error at engine.ts:331.
   Make sure it handles everything levels use: read every app/src/content/ch1/L*/sim.ts and NOTES/Claude-levels-*.md
   ("notes for the sim team": region 'us-west' mapping to a datacenter node, CDN fallback = static goes back to web
   when CDN is down, replication link between DB nodes across DCs, servers knob used as autoscaling in L08, tool
   components like logging/metrics/ci in L11). Support them.
2. Write app/src/sim/engine.test.ts with the scenarios listed in tasks/OC-sim.md (SPOF, LB failover, replica promotion,
   cache, CDN, sticky sessions, queue, hotkey, determinism).
3. Build app/src/sim/ArchCanvas.tsx and app/src/sim/SimRunner.tsx per tasks/OC-sim.md sections 3-4 (lab + mission modes,
   build phase within budget, go-live timeline, meters with goal lines, event banners, character messages, 3 lives,
   stars, retry). Match the props that app/src/screens/LabScreen.tsx, MissionScreen.tsx and simBridge.tsx already
   expect (read them; adapt those screens minimally if needed). Reuse app/src/scenekit icons (KindIcon) for node visuals
   so the canvas matches the lessons. Make it look great and feel like a game.
4. app/src/sim/index.ts exporting simulate, createSim, COMPONENTS, ArchCanvas, SimRunner and types.
5. `cd app && npx vitest --clearCache; npm run typecheck && npm test && npm run build` must pass for src/sim and screens.
   Do not edit app/src/quiz/** (another agent is fixing it right now) or app/src/types/content.ts.
Write NOTES/Codex-sim.md. Do not git commit.
