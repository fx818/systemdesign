Repo: /home/imart/Desktop/Ideas/systemdesign (app in app/). FIRST read AGENTS.md, GAME_DESIGN.md,
app/src/types/content.ts (shared contract — do not edit; ask in NOTES/contract-requests.md), app/src/content/chapters.ts,
app/src/content/registry.ts, and NOTES/*.md for what exists. The app is complete for Chapter 1 (13 levels, sim engine
@/sim, quiz engine @/quiz, lesson player @/player, game store @/game, scenekit @/scenekit). Other agents work in
parallel — ONLY touch the paths you own (listed below). Never run dev/watch servers in the foreground.
Verify: `cd app && npm run typecheck && npm test && npm run build` (run vitest with --clearCache first if levels seem
missing). Do not git commit. Write NOTES/W3-platform.md (what you built, how to use, gaps) when done.

# W3-platform — PWA icons, code splitting, Android wrapper (OpenCode)
Owns: app/public/icons/**, app/public/favicon.svg, app/vite.config.ts (PWA + build sections only), app/index.html,
app/capacitor.config.ts, app/android/** (generated), docs/PLATFORM.md. Do NOT touch src/ except
app/src/main.tsx if strictly needed for SW registration.
1. App icon: design an SVG icon (dark slate rounded square, neon cyan server stack + violet growth arrow, "SD").
   Generate PNGs 192, 512, maskable 512, apple-touch 180 from it (use `npx -y @resvg/resvg-js-cli` or sharp; if
   unavailable use Chrome headless screenshot). Wire into VitePWA manifest (icons, maskable, theme colors,
   description, categories ['education','games']) and index.html (apple-touch-icon, theme-color, description).
   Workbox: precache app shell; runtimeCaching for /videos/*.mp4 with CacheFirst + range requests.
2. Code splitting: the main bundle is 1.9 MB. Make each level load lazily — but registry.ts uses eager glob and is
   orchestrator-owned: instead configure Rollup/rolldown manualChunks in vite.config.ts to split vendor
   (react, framer-motion, dnd-kit, lucide) and per-chapter content (`src/content/ch1/**` -> 'ch1', etc.) and sim/quiz.
   Report before/after sizes. Keep `npm run build` green.
3. Android: add Capacitor (`@capacitor/core @capacitor/cli @capacitor/android`), capacitor.config.ts (appId
   com.sdquest.app, webDir dist), run `npx cap add android` ONLY if the Android SDK/Java is present (check
   `which java`, `$ANDROID_HOME`); if not, just add config + docs/PLATFORM.md with exact steps to build the APK.
4. Verify with `npm run build` and that dist/manifest.webmanifest lists the icons.
