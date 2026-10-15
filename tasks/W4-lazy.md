Repo: /home/imart/Desktop/Ideas/systemdesign (app in app/). Read AGENTS.md, NOTES/W3-review.md, app/src/content/registry.ts.

# Task W4-lazy — per-level lazy loading (fix the 1.5 MB ch1 chunk)

Problem: app/src/content/registry.ts uses an eager import.meta.glob, so every level (scenes, mini-games, quiz data) of
every chapter is in the startup bundle (ch1 chunk ~1.5 MB / 425 kB gzip). Screens read `levels` / `getLevel`
synchronously: ArchitectureMap, ProfileScreen, VideosScreen, ReviewScreen, common.tsx, HomeScreen, DebriefScreen,
RenderScene, practice screens, plus tests.

Goal: startup loads only lightweight level METADATA; the full LevelDef (Scene, miniGames, quiz, sim configs...) loads
on demand when a level route opens. You are allowed to edit registry.ts and add a new file for metadata.
Suggested design (adapt if you find better):
- Each level folder gets a tiny `meta.ts` exporting `LevelMeta` (id, chapter, number, title, subtitle, users, pages,
  badge, boss, lesson duration, cards if Review needs them, and whatever the Home/Architecture map needs — e.g. the
  ch1 boss start graph for the map; consider a static map graph file instead). Generate these from the existing
  index.ts data with a script, and add a validator test asserting meta matches the full level (so they can't drift).
- registry.ts: `levelMetas` (eager glob of meta.ts), `levelsInChapter`, `chapterOf`, `getLevelMeta(id)`, and
  `loadLevel(id): Promise<LevelDef>` (lazy glob of index.ts) + a React hook `useLevel(id)` (suspense or
  {level, loading}) with a nice loading state. Keep `levels`/`getLevel` ONLY for tests (e.g. move eager access to a
  `registry.eager.ts` used by tests/validators) so tests keep working.
- Update all screens to use metadata where enough, and `useLevel` in level routes (hub, incident, lesson, lab,
  minigame, mission, quiz, debrief, render). Preload the next level's chunk on the hub.
- The MP4 exporter (scripts/render) discovers lessons via VideosScreen data attributes (data-video-level/title/duration):
  keep those working from metadata. RenderScene must still expose window.__setLessonTime only after the level loaded
  (the exporter waits for it — check scripts/render/render.mjs and keep compatible; add an explicit ready signal if
  needed, e.g. `window.__lessonReady = true`, and update the exporter to wait for it).
- Remove the manualChunks per-chapter rule in vite.config.ts if it prevents per-level chunks.
Constraints: a long MP4 render job may be running (writes app/public/videos, own preview port) — do not touch
app/public/videos or kill other processes; use port 4190 for previews (playwright config already does).
Verify: `npx vitest --clearCache && npm run typecheck && npm test -- --maxWorkers=2 && npm run build && npm run e2e`
all green. Report before/after initial JS (gzip) in NOTES/W4-lazy.md. Do not git commit.
