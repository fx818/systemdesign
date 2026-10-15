import type { ProgressMap } from '@/game';
export const interviewUnlocked = (progress: ProgressMap) => (progress.L13?.stars ?? 0) >= 1 || (progress.C3L04?.stars ?? 0) >= 1;
