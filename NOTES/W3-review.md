# W3-review

Completed the Wave 3 review task without committing. The shared content contract and `app/public/videos/` were not edited. Existing preview/render processes were left running; all browser checks use system Chrome on the separately owned port 4190.

## Issues and fixes

| Severity | File(s) | Finding and fix |
| --- | --- | --- |
| High | `app/src/App.tsx` | The animated layout rendered a live `Outlet` inside its outgoing route frame. Navigation could mount the next screen twice and erase input entered during the transition. Reproduced with C2L04's first workbench answer. Capture the route element with `useOutlet()` so each animation retains its own screen. The complete browser walkthrough now preserves the first answer without sleeps or forced clicks. |
| Medium | `app/src/content/ch2/C2L01/{Scene.tsx,lesson.ts,quiz.ts}` | Text generalized the ASCII storage rule to all plain text, and described bandwidth as always being in bytes. State the ASCII assumption, distinguish bits/s from bytes, and keep the scene, captions, hotspot and review card consistent. Quiz answer keys were already correct. |
| Medium | `app/src/content/ch2/C2L02/lesson.ts` | A caption claimed compression of an entire 1 MB payload into 300 KB took microseconds, although the quoted benchmark measures 1 KB. Remove that unsupported timing and explicitly date the benchmark to 2010. |
| Low | `app/src/content/ch2/C2L04/{Scene.tsx,lesson.ts}` | 10,000,000 / 86,400 = 115.7407..., so 116 is rounded, not exact. Correct both the scene and caption. |
| Medium | `app/android/app/src/androidTest/java/com/getcapacitor/myapp/ExampleInstrumentedTest.java` | The generated device test expected `com.getcapacitor.app`, which disagrees with the configured `com.sdquest.app` application ID. Correct the assertion. Native execution is limited by the missing Java/Android environment, below. |
| Medium | `app/e2e/practice.spec.ts` | Oxlint mistook the Playwright callback named `use` for a React hook and failed lint. Rename it `runFixture`; use the same convention in new fixtures. |
| Low | `app/playwright.config.ts`, `app/tsconfig.node.json` | Move both Playwright URLs and its owned preview command from the occupied port 4173 to 4190. Resolve the repository alias in the strict Node/E2E TypeScript project, including explicit TS extension candidates under NodeNext, so browser tests can import real chapter quiz data. |

No simulator budgets, answer keys, unlock rules or public exports required changes. The Chapter 1 playability suite was already scoped to Chapter 1 at the start of this review.

## Content audit

Read both chapter reference texts and reviewed all eight lessons, quizzes, checkpoints, cards and mini-game data. The 64 quiz answers are correct. Chapter 3's four framework steps, news-feed requirements (10M DAU, 5,000 friends, both platforms, media and reverse chronology), eight dos, six don'ts, and time ranges (3–10 / 10–15 / 10–25 / 3–5 minutes) agree with the reference. The detailed feed diagrams are explicitly presented as simplified previews.

Recomputed the powers and unit conversions, latency conversions/human-scale comparisons, all 20 cells of the nines table, and both worked estimates. The reference text extraction omits the table images; the app retains the book's historical 2010 latency values rather than presenting them as current hardware measurements. Availability periods are 30.44 days/month and 365.25 days/year; storage exercises explicitly use the book's 365-day retention arithmetic and approximate unit conversions.

| Availability | Daily downtime | Weekly downtime | Monthly downtime | Yearly downtime |
| --- | --- | --- | --- | --- |
| 99% | 864 s | 6,048 s | 26,300.16 s | 315,576 s |
| 99.9% | 86.4 s | 604.8 s | 2,630.016 s | 31,557.6 s |
| 99.99% | 8.64 s | 60.48 s | 263.0016 s | 3,155.76 s |
| 99.999% | 0.864 s | 6.048 s | 26.30016 s | 315.576 s |
| 99.9999% | 0.0864 s | 0.6048 s | 2.630016 s | 31.5576 s |

Twitter exercise: 150M DAU, 3,472.22 average post QPS (~3,500), ~7,000 peak, 30 TB/day, 54.75 PB over five years (~55). PixelPost: 5M DAU, 115.74 post QPS, 2,893.52 read QPS, 5,787.04 peak read QPS, six servers, 8 TB/day and 14.6 PB over five years. These agree with the authored answer tolerances.

## Browser coverage added

`app/e2e/chapters.spec.ts` adds 12 tests:

- Fresh profile/direct-link gates; seed completed prerequisites and successful boss results, then claim the actual L13/C2L04 debrief rewards to open Chapters 2/3 and follow their next-level CTAs.
- Claim C3L04 with no L13 completion to independently verify the Interview Mode alternative, including reload persistence.
- Every new level's hub, incident, lesson, lab, mini-game, mission, quiz, debrief and standalone render: 72 route visits across all eight levels, with console/runtime error assertions.
- Complete C2L04 and C3L01 from incident through reward: scrub their real lessons to completion, explore labs, play every workbench/clarification round, write the assumption, construct legal mission graphs in the editor, survive the real traffic timelines, answer all eight quiz questions correctly (including keyboard sorting/bins), claim three stars/badges, and verify persisted XP and next-level access.

`app/e2e/platform.spec.ts` adds two tests for manifest/icon dimensions and purpose, offline lesson and lazy sandbox loading through the installed service worker, and all 21 lessons grouped across three video chapters with HTML-fallback/malformed/valid video manifests. Video fixtures are intercepted in the browser; no generated MP4s or manifests are changed.

## Validation

- `npx vitest --clearCache` and `npm test -- --maxWorkers=2`: **570 passed in 65 files**, including all chapter validators, deterministic scenes, mini-games, simulator playability, practice modes and shell integrations. Repeated after the route/content fixes.
- `npm run typecheck`: passed with strict checking of application and browser tests.
- `npm run build`: passed through Playwright's configured production-build command, including PWA generation; existing bundle-size advisory only.
- `node --test ../scripts/render/render.test.mjs`: **3 passed**, including actual Chrome/ffmpeg capture, ffprobe metadata, subset manifest merging and owned-child interruption cleanup, all in temporary output directories.
- `npm run lint`: passed, **zero errors**, 127 existing warnings. `git diff --check`: passed; shared content contract unchanged.
- `npm run e2e`: **44 Chrome tests passed in 4.7 minutes**, with zero browser console/runtime errors. An earlier foreground invocation received SIGTERM before finishing; the complete rerun used a detached, tracked runner and returned exit status 0. Playwright's final report has `status: passed` and no failed tests.
- Preview cleanup: port **4190 is closed** after the suite; the user's existing **4173** preview is still running. No unrelated processes were stopped. The review also visually checked the edited ASCII scene in Chrome; screenshots stayed under `/tmp`.

## Remaining decisions / limits

- No pending product decision or shared-contract request is needed for these fixes. Interview Mode intentionally retains both unlock alternatives (L13 or C3L04), as implemented by W3-practice.
- Full Android compilation/device instrumentation could not run: `java` is not installed and no emulator was used. Capacitor config, Java package, Gradle application ID and manifest were reviewed; the incorrect generated assertion was fixed.
- Existing oxlint warnings (127: refresh exports, effect state, and purity warnings in mini-games/reward UI) and Vite's large Chapter 1 chunk advisory remain. Lint has zero errors. Deterministic lesson tests pass; these warnings do not change the shared contract.
- The active exporter may have loaded an earlier build. Regenerate C2L01, C2L02 and C2L04 after the current render finishes to guarantee the reviewed captions/scenes are in their MP4s. This review did not alter the running job or its output.
- No temporary source files (`*.tmp.*`, `tmpcheck`, stray screenshots) were present under `app/src`; the legitimate `src/assets/hero.png` was retained. Browser failure artifacts use the normal ignored `app/test-results/` directory.
