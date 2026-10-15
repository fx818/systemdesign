Repo: /home/imart/Desktop/Ideas/systemdesign (app in app/). Read AGENTS.md, app/src/types/content.ts and ALL NOTES/*.md
(especially W3-*.md) first.

# Task W3-review — review & test everything added in wave 3, fix issues

Wave 3 added: multi-chapter support (chapters.ts, registry globs, unlock rules), Chapter 2 (app/src/content/ch2,
4 levels), Chapter 3 (app/src/content/ch3, 4 levels), practice modes (app/src/practice, screens/practice:
/interview /sandbox /puzzle /survival, achievements), MP4 export (scripts/render, VideosScreen), PWA/platform
(icons, manualChunks, capacitor android).

IMPORTANT: a long MP4 render job is running right now writing to app/public/videos and using a vite preview on its own
port. Do NOT delete/modify app/public/videos, do not kill other node/vite/chrome processes, use a different port
(4190) for your own preview. Keep memory use modest (vitest --maxWorkers=2).

1. `cd app && npx vitest --clearCache && npm run typecheck && npm test -- --maxWorkers=2 && npm run build` — fix all.
2. Content review of ch2 + ch3: accuracy vs reference/ch2.txt and reference/ch3.txt (numbers: powers of two, latency
   values, nines/downtime table — compute and check; the Twitter-style estimate arithmetic; the 4-step framework,
   time allocations, dos/don'ts). Fix factual errors in the level data. Check quiz answers are actually correct.
3. Cross-chapter flow in a real browser (Playwright, system Chrome, port 4190): fresh profile -> finish C1 boss via
   seeded progress -> Chapter 2 unlocks; C2 boss -> Chapter 3 unlocks; C3L04 -> Interview Mode unlocks. Play one ch2
   level (C2L04 Estimation Workbench + mission) and one ch3 level (C3L01 Clarify! mini-game + quiz) end to end.
   Load every route of every ch2/ch3 level without console errors. Add these to app/e2e/ (chapters.spec.ts).
4. Run the full e2e suite (`npm run e2e`) — fix failures (it may need its port changed if 4173 is busy; the user's
   preview server may be on 4173 — do not kill it; configure playwright to use 4190).
5. Lint pass for leftover temp files (*.tmp.*, tmpcheck, stray screenshots) across app/src and remove them.
6. Write NOTES/W3-review.md: issues (severity, file, fix), test counts, remaining decisions. Do not git commit.
