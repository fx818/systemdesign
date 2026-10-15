/** Public API of the game module (see AGENTS.md). */
export { useGame, getGameState, selectLevelProgress, selectHintsUsed } from './store';
export type { GameState, LevelProgress, MissionResultSummary, StepId } from './store';
export { LEVEL_STEPS, STARTING_LIVES, STARTING_CREDITS } from './store';

export { RANKS, rankForXp, rankProgress } from './ranks';
export type { Rank, RankProgress } from './ranks';

export { computeStars, QUIZ_PASS_SCORE } from './stars';
export type { StarInput } from './stars';

export { isLevelUnlocked, unlockedIds, nextLevel, completedCount, isDone, starsOf } from './unlocks';
export type { LevelLike, ProgressLike, ProgressMap } from './unlocks';

export { nextStreak, streakAlive, todayKey, dateKey, previousDayKey, addDays } from './streak';
export type { Streak } from './streak';

export { dueCards, pickFlashback, isDue, reviewCardState, newCard, FLASHBACK_SIZE, BOX_INTERVAL_DAYS } from './srs';
export type { CardState } from './srs';

export { ACHIEVEMENTS, earnedAchievements } from './achievements';
export type { AchievementId, PracticeEvent } from './achievements';
