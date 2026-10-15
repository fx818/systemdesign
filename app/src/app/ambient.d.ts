/**
 * Ambient module declarations bridging modules owned by other agents that may
 * not have landed yet at typecheck time. When the real modules appear under
 * src/ (resolved via the `@/` paths alias), TypeScript prefers the real files
 * and these declarations are ignored. Consumers in this repo cast the imports
 * to the contract shapes documented in AGENTS.md.
 */
declare module '@/sim' {
  const simulate: unknown;
  const COMPONENTS: unknown;
  const ArchCanvas: unknown;
  const SimRunner: unknown;
  export { simulate, COMPONENTS, ArchCanvas, SimRunner };
}

declare module '@/quiz' {
  const QuizRunner: unknown;
  const QuestionView: unknown;
  export { QuizRunner, QuestionView };
}

interface Window {
  /** Deep-link / video-render hook: seek the active lesson scene to `t` seconds. */
  __setLessonTime?: (t: number) => void;
}
