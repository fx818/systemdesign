/** Central game state: zustand store persisted to localStorage. */
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { CardState } from './srs';
import { newCard, reviewCardState } from './srs';
import type { Streak } from './streak';
import { nextStreak, todayKey } from './streak';

export type StepId = 'incident' | 'lesson' | 'lab' | 'minigame' | 'mission' | 'quiz' | 'debrief';

export const LEVEL_STEPS: readonly StepId[] = ['incident', 'lesson', 'lab', 'minigame', 'mission', 'quiz', 'debrief'];

export interface LevelProgress {
  stars: number; // 0..3
  bestQuiz: number; // best interview score, 0..1
  completedSteps: StepId[];
}

export interface MissionResultSummary {
  goalsMet: boolean;
  withinBudget: boolean;
}

export const STARTING_LIVES = 3;
export const STARTING_CREDITS = 0;

export interface GameState {
  xp: number;
  progress: Record<string, LevelProgress>;
  /** badge id -> timestamp (ms epoch) when earned. */
  badges: Record<string, number>;
  streak: Streak;
  /** level id -> hints used on that level. */
  hintsUsed: Record<string, number>;
  lives: number;
  credits: number;
  /** SRS takeaway cards, keyed by card id. */
  cards: Record<string, CardState>;
  /** level id -> latest mission outcome (feeds the debrief stars). */
  missionResults: Record<string, MissionResultSummary>;
  /** local date key -> flashback reviews done that day. */
  flashbackLog: Record<string, number>;

  /* ------------------------------- actions ------------------------------- */
  addXp: (amount: number) => void;
  completeStep: (levelId: string, step: StepId) => void;
  setStars: (levelId: string, stars: number) => void;
  awardBadge: (badgeId: string) => void;
  reviewCard: (cardId: string, correct: boolean) => void;
  resetProgress: () => void;

  /* ------------------------- supporting actions -------------------------- */
  recordQuizResult: (levelId: string, score01: number) => void;
  recordMissionResult: (levelId: string, result: MissionResultSummary) => void;
  useHint: (levelId: string) => void;
  ingestCards: (levelId: string, cards: readonly { front: string; back: string }[]) => void;
  loseLife: () => void;
  resetLives: () => void;
  setCredits: (credits: number) => void;
  spendCredits: (credits: number) => void;
}

const emptyLevelProgress = (): LevelProgress => ({ stars: 0, bestQuiz: 0, completedSteps: [] });

const initialState = () => ({
  xp: 0,
  progress: {} as Record<string, LevelProgress>,
  badges: {} as Record<string, number>,
  streak: { count: 0, lastDate: null } as Streak,
  hintsUsed: {} as Record<string, number>,
  lives: STARTING_LIVES,
  credits: STARTING_CREDITS,
  cards: {} as Record<string, CardState>,
  missionResults: {} as Record<string, MissionResultSummary>,
  flashbackLog: {} as Record<string, number>,
});

export const useGame = create<GameState>()(
  persist(
    (set, get) => ({
      ...initialState(),

      addXp: (amount) =>
        set((s) => ({
          xp: Math.max(0, s.xp + Math.round(amount)),
          streak: nextStreak(s.streak, todayKey()),
        })),

      completeStep: (levelId, step) =>
        set((s) => {
          const lp = s.progress[levelId] ?? emptyLevelProgress();
          if (lp.completedSteps.includes(step)) return {};
          return {
            progress: {
              ...s.progress,
              [levelId]: { ...lp, completedSteps: [...lp.completedSteps, step] },
            },
          };
        }),

      setStars: (levelId, stars) =>
        set((s) => {
          const lp = s.progress[levelId] ?? emptyLevelProgress();
          const clamped = Math.max(0, Math.min(3, Math.round(stars)));
          if (clamped <= lp.stars) return {};
          return { progress: { ...s.progress, [levelId]: { ...lp, stars: clamped } } };
        }),

      awardBadge: (badgeId) =>
        set((s) => (s.badges[badgeId] !== undefined ? {} : { badges: { ...s.badges, [badgeId]: Date.now() } })),

      reviewCard: (cardId, correct) =>
        set((s) => {
          const card = s.cards[cardId];
          if (!card) return {};
          const today = todayKey();
          return {
            cards: { ...s.cards, [cardId]: reviewCardState(card, correct, today) },
            streak: nextStreak(s.streak, today),
            flashbackLog: { ...s.flashbackLog, [today]: (s.flashbackLog[today] ?? 0) + 1 },
          };
        }),

      resetProgress: () => set(initialState()),

      recordQuizResult: (levelId, score01) =>
        set((s) => {
          const lp = s.progress[levelId] ?? emptyLevelProgress();
          const clamped = Math.max(0, Math.min(1, score01));
          return {
            progress: { ...s.progress, [levelId]: { ...lp, bestQuiz: Math.max(lp.bestQuiz, clamped) } },
          };
        }),

      recordMissionResult: (levelId, result) =>
        set((s) => ({ missionResults: { ...s.missionResults, [levelId]: result } })),

      useHint: (levelId) => set((s) => ({ hintsUsed: { ...s.hintsUsed, [levelId]: (s.hintsUsed[levelId] ?? 0) + 1 } })),

      ingestCards: (levelId, cards) =>
        set((s) => {
          const today = todayKey();
          const additions: Record<string, CardState> = {};
          cards.forEach((c, i) => {
            const id = `${levelId}#${i}`;
            if (!s.cards[id]) additions[id] = newCard(id, c.front, c.back, today);
          });
          return Object.keys(additions).length > 0 ? { cards: { ...s.cards, ...additions } } : {};
        }),

      loseLife: () => set((s) => ({ lives: Math.max(0, s.lives - 1) })),
      resetLives: () => set({ lives: STARTING_LIVES }),
      setCredits: (credits) => set({ credits }),
      spendCredits: (credits) => set((s) => ({ credits: s.credits - credits })),
    }),
    {
      name: 'sdq:game',
      version: 1,
      storage: createJSONStorage(() => localStorage),
    },
  ),
);

/* ------------------------------ selectors -------------------------------- */
export const selectLevelProgress = (levelId: string) => (s: GameState) =>
  s.progress[levelId] ?? emptyLevelProgress();
export const selectHintsUsed = (levelId: string) => (s: GameState) => s.hintsUsed[levelId] ?? 0;
export const getGameState = () => useGame.getState();
