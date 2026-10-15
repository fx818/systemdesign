# W4-lazy — per-level content loading

Implemented generated metadata for all 21 levels and a lazy full-content registry. HQ, the architecture map, profile, Videos, Flashback and next-level navigation use metadata. Every level route uses the asynchronous shared LevelGate; standalone RenderScene loads asynchronously too. Existing practice screens use independent practice data and do not import full levels.

## Public exports and maintenance

- `@/content/registry`: `levelMetas`, `getLevelMeta(id)`, `levelsInChapter(chapter)`, `chapterOf(level)`, `loadLevel(id): Promise<LevelDef>`, `useLevel(id, enabled?): { level?, loading, error? }`, plus `LevelMeta` and `LevelState` types.
- `@/content/metadata`: `LevelMeta`, normalization/sorting helpers and `toLevelMeta` for generation and validation. Metadata contains identity, chapter/order, title/subtitle, user milestone, pages, badge/boss and lesson duration/section count. Review cards already persist their own text, so no cards or quizzes enter the startup catalog.
- `registry.eager.ts` retains `levels`, `getLevel`, and `levelsInChapter` for tests/validators/generation only. No application imports it.
- Regenerate catalog files from full definitions with `cd app && node scripts/generate-level-metadata.mjs`. The metadata validator checks every full level against its metadata and rejects missing/extra levels or drift.

Downloads are cached and deduplicated; route changes cannot display a previously selected level. Unlock checks happen before requesting content. Hubs preload the next level. Shared loading/error UI supports recovery by reloading the page: a browser check caught Chrome retaining failed dynamic imports, so retrying the same import alone was insufficient.

The HQ uses its existing static full Chapter 1 graph instead of reading the boss simulator config. Map progression is scoped to Chapter 1. Removed the per-chapter manual chunk rule and enabled the Vite build manifest to verify chunk boundaries.

## Initial JavaScript

Measured production output by recursively following **static** `imports` from `index.html` in `.vite/manifest.json`, summing file bytes and each file's Node `gzipSync` byte count. Dynamic imports, CSS, images, MP4s and service-worker registration/background cache traffic are excluded. Same build command/configuration apart from the requested implementation; baseline build enabled `--manifest` for measurement.

| Measurement | Before | After |
| --- | ---: | ---: |
| Initial JS, bytes | 2,184,166 | 1,356,268 |
| Initial JS, gzip bytes | 637,059 | 379,423 |
| Full-level dynamic entry chunks | 0 | 21 |

**Initial JavaScript saves 257,636 gzip bytes (40.44%).**

The original Chapter 1 chunk was 1,496,365 bytes / 423,381 gzip bytes. It is replaced by separate level chunks (roughly 10–19 kB gzip each, plus shared dependencies). Vendor regrouping retains common code in the initial graph, so subtracting the old chapter chunk alone would overstate the savings.

## Validation

- `npx vitest --clearCache`: passed.
- `npm run typecheck`: passed.
- `npm test -- --maxWorkers=2`: **596 tests passed in 67 files**, repeated from a clean cache after the final fix.
- `npm run build`: passed, with 21 full-level dynamic entries and no full-level entries in the initial static import graph.
- `npm run e2e`: **47 Chrome tests passed in 4.7 minutes**, including the new deferred-loading/recovery checks and existing offline, chapter, practice, mobile and capture coverage.
- `npm run lint`: zero errors, 127 existing warnings; `git diff --check`: passed.

New tests cover metadata drift for all 21 levels, request deduplication/cache reuse, disabled/unknown levels, and route changes during a download. Production-browser checks cover catalogs/practice/locked routes loading zero level entries, the hub loading only its level and successor, delayed render readiness, and recovery from an aborted chunk download.

Additional exporter verification: `node --test ../scripts/render/render.test.mjs` passed all 3 tests, including real Chrome/ffmpeg capture in temporary output directories. The exporter itself needs no change: its existing wait for `window.__setLessonTime` plus an SVG remains valid because RenderScene now mounts the controlled scene only after loading. Videos retains all three `data-video-*` discovery attributes from metadata.

## Remaining limits

- The existing service worker still precaches JavaScript in the background to preserve offline availability, including unvisited lessons; level modules are imported/evaluated only when requested. Offline playback remains covered by the platform browser test.
- The large shared dependency chunk advisory remains; dynamic icon lookup still includes the existing Lucide catalog. All level definitions/scenes/mini-games are separate dynamic entries.
- The shared content contract, generated MP4s, and active render/preview processes were not edited or stopped. Browser tests use their own port 4190. No commit was created.
