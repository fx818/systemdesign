# AGENTS.md — rules for every coding agent on this repo

Project: System Design Quest — a gamified, animated web app (PWA) teaching
Chapter 1 of "System Design Interview" ("Scale From Zero To Millions Of Users").
Read GAME_DESIGN.md (story, level loop, 13 levels) before doing anything.
Source text of the chapter: reference/ch1.txt (book pages 5-33).

## Stack
React 19 + TypeScript + Vite 8 + Tailwind v4 + framer-motion + zustand +
react-router-dom 7 + @dnd-kit + lucide-react. Tests: vitest + Testing Library.
Import alias: `@/` = `app/src/`. All commands run in `app/`.

## THE CONTRACT
`app/src/types/content.ts` is the single shared contract. DO NOT edit it.
If you truly need a change, write it in `NOTES/contract-requests.md` and work around it.

## Ownership — only touch your own directories
| Owner | Directories |
|---|---|
| OC-shell (OpenCode) | src/main.tsx, src/App.tsx, src/app/**, src/game/**, src/screens/** (except lab/mission), src/components/ui/**, src/player/** |
| OC-sim (OpenCode)   | src/sim/**, src/screens/lab/**, src/screens/mission/** |
| OC-quiz (OpenCode)  | src/quiz/** |
| Claude-kit          | src/scenekit/** |
| Claude-levels       | src/content/ch1/LXX/** (one folder per level, own batch only) |
| Orchestrator        | src/types/**, src/content/registry.ts, configs, docs |

## Public APIs other teams rely on (implement exactly these exports)
- `@/sim`      : `simulate(config, graph, tSec, knobs?) => SimState` (pure, deterministic),
                 `COMPONENTS: Record<ComponentKind, ComponentSpec>`,
                 `<ArchCanvas graph state? editable onChange/>`, `<SimRunner config mode="lab"|"mission" onFinish(result)/>`
- `@/quiz`     : `<QuizRunner questions onFinish({correct,total,xp})/>`, `<QuestionView question onAnswer(correct)/>`
- `@/player`   : `<LessonPlayer lesson onComplete/>` (play/pause/scrub, speed, captions, chapters, hotspots, checkpoints)
- `@/game`     : zustand store `useGame` (xp, rank, stars per level, badges, streak, unlocked, cards SRS)
- `@/scenekit` : SVG building blocks for lesson scenes (see src/scenekit/README.md)
- `@/content/registry` : `levels`, `getLevel(id)`

## Rules
- TypeScript strict, no `any` unless unavoidable. `npm run typecheck` and `npm test` must pass for your files.
- Lesson scenes must be DETERMINISTIC functions of `time` (no setInterval, no Math.random without a seed,
  no framer-motion autoplay inside scenes). Use scenekit helpers (`tween`, `between`, `ease`).
  This is what makes them scrubbable and exportable to MP4.
- Content in our own words, accurate to reference/ch1.txt. Each quiz question has an explanation and `page`.
- Visual style: dark (slate-950 bg), neon accents (cyan #22d3ee, violet #a78bfa, emerald #34d399, amber #fbbf24, rose #fb7185),
  rounded-2xl cards, generous motion, playful but clean.
- Never run `npm run dev` / watch mode in the foreground. Use `npm test`, `npm run typecheck`, `npm run build`.
- Do not `git commit`; the orchestrator commits after review.
- When done, write a short report to `NOTES/<your-agent-id>.md`: what you built, public exports, known gaps.
