import { DAY_S, MONTH_S, NINES, WEEK_S, YEAR_S, downtimeSeconds, formatDuration } from '../../common/numbers';

export interface MatchRound { id: string; title: string; period: number; nines: number[]; durations: string[] /* fixed scramble */ }
const label = (n: number, period: number) => formatDuration(downtimeSeconds(n, period));
const scramble = [2, 4, 0, 3, 1];
const round = (id: string, title: string, period: number): MatchRound => ({
  id, title, period, nines: [...NINES], durations: scramble.map((i) => label(NINES[i], period)),
});
export const MATCH_ROUNDS: MatchRound[] = [round('day', 'Downtime per day', DAY_S), round('year', 'Downtime per year', YEAR_S)];
export const answerFor = (r: MatchRound, nine: number) => label(nine, r.period);

export interface Scenario { id: string; text: string; sla: number; period: number; periodName: string; outageMin: number }
export const SCENARIOS: Scenario[] = [
  { id: 'maya', text: 'Maya promised 99.99% per month. A deploy took the site down for 9 minutes this month.', sla: 99.99, period: MONTH_S, periodName: 'month', outageMin: 9 },
  { id: 'two', text: 'SLA 99.9% per month. Two outages this month: 20 minutes and 15 minutes.', sla: 99.9, period: MONTH_S, periodName: 'month', outageMin: 35 },
  { id: 'five', text: 'SLA 99.999% per year. One 6-minute outage in March.', sla: 99.999, period: YEAR_S, periodName: 'year', outageMin: 6 },
  { id: 'week', text: 'SLA 99% per week. A 1-hour database migration on Sunday.', sla: 99, period: WEEK_S, periodName: 'week', outageMin: 60 },
];
export const budgetMin = (s: Scenario) => downtimeSeconds(s.sla, s.period) / 60;
export const breached = (s: Scenario) => s.outageMin > budgetMin(s);

export const TOTAL_POINTS = MATCH_ROUNDS.reduce((n, r) => n + r.nines.length, 0) + SCENARIOS.length;
export const downtimeScore = (firstTryMatches: number, scenariosRight: number) => Math.round(((firstTryMatches + scenariosRight) / TOTAL_POINTS) * 100) / 100;
