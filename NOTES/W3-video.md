# W3-video — MP4 export pipeline

Completed `tasks/W3-video.md`. No commits made. The shared content contract was not edited.

## Built / public interfaces

- `scripts/render/render.mjs`: system Chrome via existing `@playwright/test`; owns a Vite preview on a free localhost port or accepts `--url`. Supports `--levels L01,L02|all`, `--fps`, `--captions`, `--out`, `--short`, and `--help`.
- Discovers every built lesson across chapters through VideosScreen's `data-video-level/title/duration` attributes. Captures 1280×720 frames after `__setLessonTime(i/fps)` and two requestAnimationFrames. Playwright's CDP fast lossless PNG capture gives the same decoded pixels as `page.screenshot` (verified by decoded-frame MD5), with substantially faster compression.
- One lesson/frame at a time; waits for each ffmpeg stdin write, with two x264 threads. H.264/yuv420p, CRF 20, veryfast, faststart. Progress includes frame counts, capture rate, ETA. Cleanup covers failure/interruption; partial files stay temporary. Per-lesson MP4 and 25%-duration JPG; atomic manifest updates merge subset exports with existing entries.
- `VideosScreen` export preserved. `/videos` groups all registry levels by chapter, shows posters/placeholders and duration, retains animated watch links, and offers inline playback/downloads when `/videos/manifest.json` contains an export. Missing/404/HTML-fallback manifests are harmless; malformed manifests show a status message. Unexported lessons show their generation command.
- Added `app/package.json` script `render:videos`; ignored generated MP4s, posters, manifests and temporary files via `app/public/videos/` in `.gitignore`. Other package/dependency changes in the workspace belong to concurrent agents.
- Usage and implementation notes: `scripts/render/README.md`. Tests: `scripts/render/render.test.mjs`; CLI parsing/catalog helpers are internal exports in `options.mjs`.

## Generated and verified

| Export | Duration | Frames / fps | Dimensions | Bytes |
| --- | --- | --- | --- | --- |
| L01 smoke (`/tmp/quest-video-smoke`) | 6 s | 72 / 12 | 1280×720 | 266569 |
| `app/public/videos/L01.mp4` | 180 s | 4320 / 24 | 1280×720 | 11216276 |
| `app/public/videos/L02.mp4` | 185 s | 4440 / 24 | 1280×720 | 11867212 |

Both full exports have burned-in captions, 1280×720 JPG posters, and matching manifest metadata. Verified H.264/yuv420p and exact durations/frame counts with ffprobe. Only L01/L02 were fully rendered; `--levels all` was tested end to end with a two-lesson, cross-chapter HTTP fixture.

## Validation

- `npm run typecheck`: passed (also independently checked VideosScreen and its production imports under the strict app settings).
- `npx vitest --clearCache` then `npm test -- --maxWorkers=2`: **570 tests passed in 65 files**. Earlier failures from concurrent work were resolved before this final run.
- `npm run build`: passed, including PWA generation; large chapter-1 chunk advisory remains.
- `node --test ../scripts/render/render.test.mjs` from app/: **3 tests passed**, including real Chrome/ffmpeg two-lesson `all` export, subset merging, ffprobe assertions, unknown IDs, and SIGINT cleanup preserving the previous manifest.
- Chrome: missing/404, HTML fallback, malformed and valid manifests; actual inline playback/download; mobile overflow; no page runtime errors. After rebuilding, verified the actual full MP4s play, seek near their ends, and download from production preview. All **21 current lessons / 3 chapters** appear correctly.
- Targeted oxlint and `git diff --check`: passed. Confirmed generated artifacts are ignored, temporary exports are gone, and the exporter's owned preview port is closed.

## How to use / limits

From app/: `npm run render:videos` builds and exports all currently registered lessons. For a subset: `node ../scripts/render/render.mjs --levels L01,L02 --fps 24 --captions` after building. For smoke tests, use `--short 6 --fps 12 --out /tmp/quest-video-smoke` so full exports are preserved.

Rebuild after rendering before deploying/serving `dist`, to copy `public/videos` into the built site (done for these exports). New content also requires a build before catalog discovery. Videos are silent; captions are optional and burned in. Do not run multiple exporters into the same output directory. No remaining video-pipeline blockers.
