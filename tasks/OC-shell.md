Repo: /home/imart/Desktop/Ideas/systemdesign (app code in app/). FIRST read AGENTS.md, GAME_DESIGN.md
and app/src/types/content.ts (the shared contract — do not edit it). Only touch the directories you own.
Verify with `cd app && npm run typecheck && npm test` (never run dev/watch servers in foreground).
Finish by writing NOTES/OC-shell.md (what you built, exports, known gaps). Do not git commit.

# Task OC-shell — App shell, game state, lesson player, screens

Build the whole app frame so a level defined as data is fully playable end to end.

1. `src/game/` — zustand store `useGame` persisted to localStorage (zustand/middleware persist):
   xp, rank (Intern 0, Junior 300, Engineer 900, Senior 1800, Staff 3000, Principal 4500 XP),
   per-level progress {stars 0-3, bestQuiz, completedSteps: ('incident'|'lesson'|'lab'|'minigame'|'mission'|'quiz'|'debrief')[]},
   badges (earned ids + timestamp), streak (daily, by local date), unlocked levels (L01 open; next unlocks at >=1 star;
   boss L13 needs L01-L12 done), hintsUsed, lives, credits.
   SRS cards: Leitner boxes 1-5 from each completed level's `cards`; `dueCards(today)`; daily "Flashback" (5 cards).
   Actions: addXp, completeStep, setStars, awardBadge, reviewCard(id, correct), resetProgress.
   Pure helpers (rank from xp, star calc, unlock rules, streak update) in separate files WITH vitest tests.
2. `src/player/` — `<LessonPlayer lesson onComplete/>`: renders `lesson.Scene` with `time` driven by
   requestAnimationFrame; play/pause (space), scrub bar with chapter markers, 0.5x/1x/1.5x/2x, captions overlay
   (from lesson.captions by time), chapter list, hotspot drawer (Scene calls onHotspot(id) -> show lesson.hotspots
   entry), checkpoints: auto-pause at checkpoint.at and show the question using `QuestionView` from `@/quiz`
   (if `@/quiz` not yet present, create a tiny local fallback MCQ renderer behind the same props, but prefer the import).
   Scene is rendered in a 16:9 responsive box; pass width=1280 height=720. Expose `?t=12.5` URL param for deep-linking
   and `window.__setLessonTime(t)` for video rendering. Also a `/render/:levelId` route that renders ONLY the scene
   full-screen at 1280x720 with interactive=false and time from `window.__setLessonTime` (used by MP4 export).
3. `src/screens/` + `src/App.tsx` + `src/main.tsx` (react-router):
   - `/` Home "PixelPost HQ": user counter (formatted 1 -> 10M, animated), rank + XP bar, streak flame,
     daily Flashback button, the ARCHITECTURE MAP (the boss-level full graph drawn with nodes revealed as levels
     complete; locked nodes shown as dim silhouettes; click -> level), and the level path (13 nodes, Duolingo-style
     winding path, stars, lock icons, boss node special).
   - `/level/:id` Level hub: shows the 6-step mission loop as a stepper (Incident, Briefing, Lab, Mini-game(s),
     Mission, Interview, Debrief) with step states; each step opens its route.
   - `/level/:id/incident` and `/debrief`: visual-novel dialogue component `<Dialogue lines onDone/>` with character
     portraits (stylised avatar circles w/ initials + mood colour: Maya CEO violet, Ravi mentor cyan, Pager rose with
     shake animation, Player emerald), typewriter text, click/space to advance, skip button.
   - `/level/:id/lesson` -> LessonPlayer. `/level/:id/quiz` -> QuizRunner from `@/quiz` (Ravi's "Interview round" framing).
   - `/level/:id/minigame/:mg` renders MiniGameDef.Component.
   - `/level/:id/lab` and `/mission` render `<SimRunner/>` from `@/sim` (owned by OC-sim; if missing at runtime,
     render a placeholder; import lazily with React.lazy so typecheck works once it lands — coordinate by import path
     `@/sim`).
   - Debrief: stars calculation (mission result + quiz + hints), XP count-up, badge unlock modal with confetti
     (framer-motion particles, no extra deps), new map node reveal, "Next level" CTA.
   - `/profile`: rank, badges grid (locked/unlocked), stats. `/review`: Flashback flashcards (flip, I knew it / I didn't).
   - `/videos`: list of levels with link to `/render/:id` and a note about MP4 export.
4. `src/components/ui/` — Button, Card, ProgressBar, Modal, Toast (XP gained +50 popups), StarRow, Badge, Icon
   (resolve lucide icon by name string).
Make it look polished and game-like: dark neon style from AGENTS.md, smooth framer-motion transitions between routes,
sound-free. Mobile responsive (it's a PWA). Keep the app working with ZERO levels present (registry may be empty)
and with levels present.
