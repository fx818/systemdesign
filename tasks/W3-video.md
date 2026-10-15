Repo: /home/imart/Desktop/Ideas/systemdesign (app in app/). FIRST read AGENTS.md, GAME_DESIGN.md,
app/src/types/content.ts (shared contract — do not edit; ask in NOTES/contract-requests.md), app/src/content/chapters.ts,
app/src/content/registry.ts, and NOTES/*.md for what exists. The app is complete for Chapter 1 (13 levels, sim engine
@/sim, quiz engine @/quiz, lesson player @/player, game store @/game, scenekit @/scenekit). Other agents work in
parallel — ONLY touch the paths you own (listed below). Never run dev/watch servers in the foreground.
Verify: `cd app && npm run typecheck && npm test && npm run build` (run vitest with --clearCache first if levels seem
missing). Do not git commit. Write NOTES/W3-video.md (what you built, how to use, gaps) when done.

# W3-video — MP4 export pipeline (Codex)
Owns: scripts/render/**, app/src/screens/VideosScreen.tsx, app/public/videos/** (generated), package.json script entries.

The route `/render/:levelId?capture=1&captions=1` renders a lesson frame at 1280x720 and exposes
`window.__setLessonTime(t)` (see app/src/player/RenderScene.tsx). Scenes are pure functions of time.
1. `scripts/render/render.mjs` (Node, uses `playwright` already installed as @playwright/test with system Chrome
   `channel: 'chrome'`): starts `vite preview` on a free port (or uses --url), for each requested level:
   sets viewport 1280x720, loads the capture route, for frame i in 0..duration*fps: `__setLessonTime(i/fps)`,
   waits for 2 requestAnimationFrames, screenshots the canvas (png, clip 1280x720), pipes frames into ffmpeg
   (`ffmpeg -f image2pipe -framerate FPS -i - -c:v libx264 -pix_fmt yuv420p -crf 20 -preset veryfast`).
   CLI: `node scripts/render/render.mjs --levels L01,L02|all --fps 24 --captions --out app/public/videos`.
   Also emit a poster jpg (frame at 25% duration) and `app/public/videos/manifest.json`
   [{id, title, file, poster, duration, sizeBytes, renderedAt}]. Print progress (frame n/N, ETA).
   Memory is tight (~3GB free): render ONE level at a time, stream frames (never hold all in memory).
   Optional `--short <seconds>` renders only the first N seconds (use for testing).
2. Add npm scripts in app/package.json: `"render:videos": "npm run build && node ../scripts/render/render.mjs --levels all --fps 24 --captions"`.
3. VideosScreen: list every level (all chapters, grouped by chapter) with: poster, duration, "Watch animated" (opens
   /render/:id), and if the manifest has it, an inline <video controls> player + "Download MP4" button; otherwise show
   the command to generate it. Load manifest via fetch('/videos/manifest.json') (handle 404 gracefully).
4. Test: render L01 with --short 6 --fps 12 to verify the pipeline end to end; check the mp4 with ffprobe
   (duration, 1280x720). Then render the FULL L01 and L02 at 24fps (one at a time). Do NOT render all 13 (the
   orchestrator will run that later); just make sure `--levels all` works on 2 levels.
5. Add `app/public/videos/*.mp4` to .gitignore (keep manifest.json and posters out too — generated).
