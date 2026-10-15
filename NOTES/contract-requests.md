
## W3-ch2 (2026-10-15): ch1 playability test must be scoped to chapter 1
`app/src/content/ch1/playability.test.ts` imports `levels` from the registry, which now also holds the ch2/ch3 levels.
It fails for every non-ch1 level ("discovers exactly the complete chapter" plus "hinted solution survives" for C2L01-C2L04 and C3L01-C3L04).
Suggested one-line fix (owner: Codex-review / orchestrator):
`import { levelsInChapter } from '@/content/registry'; const levels = levelsInChapter(1);` in place of the `levels` import.
Ch2's own missions are covered by `src/content/ch2/playability.test.ts`.

Also: `validateLevel` in `ch1/validate.ts` hard-codes `L01`-style ids and pages 5-33. Ch2 wraps it (`ch2/validate.ts`) and drops those
three checks. A chapter-aware validator under `src/content/` could be shared by every chapter.
