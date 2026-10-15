/** Central game state: zustand store persisted to localStorage. */
import { earnedAchievements, type PracticeEvent } from './achievements';
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
  /** Simulator score, including efficiency and lives. Optional for older saves. */
  stars?: number;
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
  /** Latest interview, including hearts needed for three-star eligibility. */
  quizResults: Record<string, { score: number; heartsLeft: number }>;
  miniGameResults: Record<string, Record<string, number>>;
  /** local date key -> flashback reviews done that day. */
  flashbackLog: Record<string, number>;

  achievements: Record<string, number>;
  practice: {
    survivalBest: number;
    puzzleStreak: Streak;
    puzzles: Record<string, number>;
    interviews: number;
    bestInterview: number;
    rewards: Record<string, boolean>;
  };
  recordPracticeEvent: (event: PracticeEvent) => void;
  finishPuzzle: (date: string, moves: number) => void;
  finishSurvival: (seconds: number) => void;
  finishInterview: (sessionId: string, score: number, xp: number) => void;

  /* ------------------------------- actions ------------------------------- */
  addXp: (amount: number) => void;
  completeStep: (levelId: string, step: StepId) => void;
  setStars: (levelId: string, stars: number) => void;
  awardBadge: (badgeId: string) => void;
  reviewCard: (cardId: string, correct: boolean) => void;
  resetProgress: () => void;

  /* ------------------------- supporting actions -------------------------- */
  recordQuizResult: (levelId: string, score01: number, heartsLeft?: number) => void;
  recordMiniGameResult: (levelId: string, gameId: string, score: number) => void;
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
  achievements: {} as Record<string, number>,
  practice: { survivalBest: 0, puzzleStreak: { count: 0, lastDate: null }, puzzles: {}, interviews: 0, bestInterview: 0, rewards: {} } as GameState['practice'],
  progress: {} as Record<string, LevelProgress>,
  badges: {} as Record<string, number>,
  streak: { count: 0, lastDate: null } as Streak,
  hintsUsed: {} as Record<string, number>,
  lives: STARTING_LIVES,
  credits: STARTING_CREDITS,
  cards: {} as Record<string, CardState>,
  missionResults: {} as Record<string, MissionResultSummary>,
  quizResults: {} as GameState['quizResults'],
  miniGameResults: {} as GameState['miniGameResults'],
  flashbackLog: {} as Record<string, number>,
});

export const useGame = create<GameState>()(
  persist(
    (set, get) => ({
      ...initialState(),

      recordPracticeEvent: (event) => set(s => {
        const eligible = [...earnedAchievements(event, s.progress), ...earnedAchievements({ type: 'activity', hour: new Date().getHours() }, s.progress)];
        const additions = Object.fromEntries(eligible.filter(id => s.achievements[id] === undefined).map(id => [id, Date.now()]));
        return Object.keys(additions).length ? { achievements: { ...s.achievements, ...additions } } : {};
      }),
      finishPuzzle: (date, moves) => {
        if (date !== todayKey() || !Number.isInteger(moves) || moves < 0 || get().practice.puzzles[date] !== undefined) return;
        set(s => ({ practice: { ...s.practice, puzzles: { ...s.practice.puzzles, [date]: moves }, puzzleStreak: nextStreak(s.practice.puzzleStreak, date) } }));
        get().addXp(100);
        get().recordPracticeEvent({ type: 'puzzle', streak: get().practice.puzzleStreak.count });
      },
      finishSurvival: (seconds) => {
        if (!Number.isFinite(seconds) || seconds < 0) return;
        set(s => ({ practice: { ...s.practice, survivalBest: Math.max(s.practice.survivalBest, seconds) } }));
        get().recordPracticeEvent({ type: 'survival', seconds });
      },
      finishInterview: (sessionId, score, xp) => {
        if (get().practice.rewards[sessionId] || !Number.isFinite(score) || !Number.isFinite(xp)) return;
        set(s => ({ practice: { ...s.practice, interviews: s.practice.interviews + 1, bestInterview: Math.max(s.practice.bestInterview, Math.min(100, Math.max(0, score))), rewards: { ...s.practice.rewards, [sessionId]: true } } }));
        get().addXp(Math.max(0, xp));
      },

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

      setStars: (levelId, stars) => {
        set((s) => {
          const lp = s.progress[levelId] ?? emptyLevelProgress();
          const clamped = Math.max(0, Math.min(3, Math.round(stars)));
          if (clamped <= lp.stars) return {};
          return { progress: { ...s.progress, [levelId]: { ...lp, stars: clamped } } };
        });
        get().recordPracticeEvent({ type: 'stars' });
      },

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

      recordQuizResult: (levelId, score01, heartsLeft = 3) =>
        set((s) => {
          const lp = s.progress[levelId] ?? emptyLevelProgress();
          const clamped = Math.max(0, Math.min(1, score01));
          return {
            progress: { ...s.progress, [levelId]: { ...lp, bestQuiz: Math.max(lp.bestQuiz, clamped) } },
            quizResults: { ...s.quizResults, [levelId]: { score: clamped, heartsLeft: Math.max(0, Math.min(3, heartsLeft)) } },
          };
        }),

      recordMiniGameResult: (levelId, gameId, score) =>
        set((s) => ({ miniGameResults: {
          ...s.miniGameResults,
          [levelId]: { ...s.miniGameResults[levelId], [gameId]: Math.max(0, Math.min(1, score)) },
        } })),

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
const EMPTY_LEVEL_PROGRESS = emptyLevelProgress();
export const selectLevelProgress = (levelId: string) => (s: GameState) =>
  s.progress[levelId] ?? EMPTY_LEVEL_PROGRESS;
export const selectHintsUsed = (levelId: string) => (s: GameState) => s.hintsUsed[levelId] ?? 0;
export const getGameState = () => useGame.getState();
