/**
 * Runtime bridge to `@/quiz` (owned by OC-quiz). We prefer the real module but
 * fall back to local renderers while it does not exist: the dynamic import is
 * wrapped in try/catch so the app keeps working either way.
 */
import { useEffect, useState, type ComponentType } from 'react';
import type { QuizQuestion } from '@/types/content';

export interface QuestionViewProps {
  question: QuizQuestion;
  onAnswer: (correct: boolean) => void;
}

export interface QuizResult {
  correct: number;
  total: number;
  xp: number;
}

export interface QuizRunnerProps {
  questions: QuizQuestion[];
  onFinish: (result: QuizResult) => void;
}

export interface QuizModule {
  QuestionView: ComponentType<QuestionViewProps>;
  QuizRunner: ComponentType<QuizRunnerProps>;
}

let cache: QuizModule | null | undefined;

export async function loadQuizModule(): Promise<QuizModule | null> {
  if (cache !== undefined) return cache;
  try {
    const m = (await import('@/quiz')) as Record<string, unknown>;
    if (typeof m.QuestionView !== 'function' && typeof m.QuestionView !== 'object') throw new Error('no QuestionView');
    cache = {
      QuestionView: m.QuestionView as ComponentType<QuestionViewProps>,
      QuizRunner: m.QuizRunner as ComponentType<QuizRunnerProps>,
    };
  } catch {
    cache = null;
  }
  return cache;
}

/** undefined = still loading, null = unavailable (use fallback). */
export function useQuizModule(): QuizModule | null | undefined {
  const [mod, setMod] = useState<QuizModule | null | undefined>(cache);
  useEffect(() => {
    let alive = true;
    void loadQuizModule().then((m) => {
      if (alive) setMod(m);
    });
    return () => {
      alive = false;
    };
  }, []);
  return mod;
}
