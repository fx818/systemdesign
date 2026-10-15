import { BOSS, PIXELPOST } from '../../common/numbers';

export interface WorkStep {
  id: string;
  label: string;
  /** What to compute, shown with the true values of earlier steps. */
  prompt: string;
  formula: string;
  answer: number;
  unit: string;
  /** Accepted band for full marks (relative), unless min/max are given. */
  tol?: number;
  min?: number;
  max?: number;
  /** Final answer: anything within 2× earns full marks. */
  final?: boolean;
}

const P = PIXELPOST;
export const STEPS: WorkStep[] = [
  { id: 'dau', label: 'Daily active users', prompt: `${P.mau / 1e6}M monthly users, ${P.dailyShare * 100}% use PixelPost daily.`, formula: 'MAU × daily %', answer: BOSS.dau, unit: 'users', tol: 0.1 },
  { id: 'postQps', label: 'Post QPS', prompt: `5M DAU × ${P.postsPerUser} posts per day, spread over a day.`, formula: 'DAU × posts ÷ 86,400 s', answer: BOSS.postQps, unit: 'posts/s', tol: 0.25 },
  { id: 'readQps', label: 'Read QPS', prompt: `5M DAU × ${P.viewsPerUser} photo views per day.`, formula: 'DAU × views ÷ 86,400 s', answer: BOSS.readQps, unit: 'reads/s', tol: 0.25 },
  { id: 'peak', label: 'Peak read QPS', prompt: 'Average ≈ 2,900 reads/s. Evenings are busier.', formula: '2 × QPS', answer: BOSS.peakReadQps, unit: 'reads/s', tol: 0.25 },
  { id: 'servers', label: 'Web servers at peak', prompt: 'Peak ≈ 5,800 reads/s. One web server handles ~1,000 requests/s.', formula: 'peak ÷ 1,000, rounded up', answer: BOSS.servers, unit: 'servers', min: 6, max: 8 },
  { id: 'perDay', label: 'Photo storage per day', prompt: `10M posts/day, ${P.photoShare * 100}% carry a ${P.photoMB} MB photo.`, formula: 'posts × photo % × 2 MB', answer: BOSS.storagePerDayTB, unit: 'TB/day', tol: 0.25 },
  { id: 'fiveYears', label: '5-year photo storage', prompt: '≈ 8 TB per day, kept for 5 years.', formula: 'TB/day × 365 × 5 ÷ 1,000', answer: BOSS.fiveYearPB, unit: 'PB', tol: 0.25, final: true },
];

/** "3,000" / "3000" / " 3 000 " -> 3000. NaN if not a number. */
export const parseEntry = (raw: string) => {
  const s = raw.replace(/[,\s_]/g, '');
  return s === '' ? Number.NaN : Number(s);
};

/** At most two significant digits ("100", "3000", "15", "0.5"): a well-rounded napkin number. */
export function isRound(v: number): boolean {
  if (!Number.isFinite(v) || v === 0) return false;
  const digits = Number(Math.abs(v).toPrecision(15)).toExponential().split('e')[0].replace('.', '').replace('-', '');
  return digits.replace(/0+$/, '').length <= 2;
}

export type Grade = 'exact' | 'close' | 'off';
export function grade(step: WorkStep, v: number): Grade {
  if (!Number.isFinite(v) || v <= 0) return 'off';
  const inBand = step.min !== undefined && step.max !== undefined
    ? v >= step.min && v <= step.max
    : Math.abs(v - step.answer) <= step.answer * (step.tol ?? 0.1);
  if (inBand) return 'exact';
  const ratio = v / step.answer;
  if (ratio >= 0.5 && ratio <= 2) return step.final ? 'exact' : 'close';
  return 'off';
}

export const ROUND_BONUS = 0.1;
export const stepPoints = (step: WorkStep, v: number) => {
  const g = grade(step, v);
  const base = g === 'exact' ? 1 : g === 'close' ? 0.5 : 0;
  return base + (g === 'exact' && isRound(v) ? ROUND_BONUS : 0);
};
export const workbenchScore = (entries: number[]) =>
  Math.round(Math.min(1, entries.reduce((s, v, i) => s + stepPoints(STEPS[i], v), 0) / STEPS.length) * 100) / 100;

/** Nicely formatted "true" value for feedback. */
export const pretty = (v: number) => (v >= 100 ? Math.round(v).toLocaleString('en-US') : String(Number(v.toPrecision(3))));
