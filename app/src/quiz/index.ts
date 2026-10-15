/**
 * `@/quiz` — the interview-round engine.
 *
 * Public API used directly by the lesson player and interview screen:
 *   <QuestionView question onAnswer(correct)/>
 *   <QuizRunner questions onFinish({correct,total,xp,perQuestion,...})/>
 *   grade(question, response) => boolean   (pure, deterministic)
 */
export { QuestionView, type QuestionViewProps } from './QuestionView';
export { QuizRunner, type QuizRunnerProps } from './QuizRunner';
export { grade, isComplete, describeCorrect } from './grade';
export { MiniDiagram, NODE_DROPPABLE_PREFIX, type MiniDiagramProps, type MiniDiagramReveal } from './MiniDiagram';
export {
  type QuizResponse,
  type PerQuestionResult,
  type QuizResult,
  DEFAULT_QUESTION_XP,
  comboMultiplier,
} from './types';
export { raviLine } from './speech';
