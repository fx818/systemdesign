/** Shared literals for Level 8 (stateless web tier): scene, quiz and mini-game. */

export type UserId = 'A' | 'B' | 'C';
export type ServerId = 1 | 2 | 3 | 4;

export const USER_COLOR: Record<UserId, string> = { A: '#22d3ee', B: '#a78bfa', C: '#fbbf24' };

/** Figure 1-12: in the stateful setup each user's session lives on "their" server. */
export const HOME_SERVER: Record<UserId, ServerId> = { A: 1, B: 2, C: 3 };

export interface Step {
  /** Optional world event shown before the request. */
  event?: { kind: 'crash' | 'add'; server: ServerId; text: string };
  user: UserId;
  server: ServerId;
}
export interface Round {
  id: 'stateful' | 'stateless';
  title: string;
  intro: string;
  /** Seconds per decision. */
  limit: number;
  steps: Step[];
}

export const ROUNDS: Round[] = [
  {
    id: 'stateful',
    title: 'Round 1 · Stateful servers',
    intro: 'Each server keeps its own users\' sessions in memory. The load balancer just spreads requests around. Will each request be authenticated?',
    limit: 7,
    steps: [
      { user: 'A', server: 1 },
      { user: 'A', server: 2 },
      { user: 'B', server: 2 },
      { user: 'C', server: 1 },
      { user: 'C', server: 3 },
      { event: { kind: 'crash', server: 2, text: 'Server 2 crashes! Its memory is gone.' }, user: 'B', server: 3 },
      { event: { kind: 'add', server: 4, text: 'Server 4 joins the pool (empty memory).' }, user: 'A', server: 4 },
      { user: 'A', server: 1 },
    ],
  },
  {
    id: 'stateless',
    title: 'Round 2 · Shared session store',
    intro: 'Sessions now live in a shared NoSQL store. Every server fetches state from it. Same chaos, faster clock.',
    limit: 4,
    steps: [
      { user: 'A', server: 2 },
      { user: 'B', server: 3 },
      { event: { kind: 'crash', server: 1, text: 'Server 1 crashes!' }, user: 'A', server: 3 },
      { event: { kind: 'add', server: 4, text: 'Autoscaling adds server 4.' }, user: 'C', server: 4 },
      { user: 'B', server: 4 },
      { user: 'C', server: 2 },
    ],
  },
];

/** Does this request authenticate? Stateful: only on the home server, and only if it never crashed. */
export function requestSucceeds(round: Round['id'], step: Step, crashed: ServerId[]): boolean {
  if (crashed.includes(step.server)) return false; // never routed in practice, kept for safety
  if (round === 'stateless') return true;
  const home = HOME_SERVER[step.user];
  return step.server === home && !crashed.includes(home);
}

/** Crashed servers after applying events up to and including step i. */
export function crashedUntil(round: Round, i: number): ServerId[] {
  return round.steps.slice(0, i + 1).flatMap((s) => (s.event?.kind === 'crash' ? [s.event.server] : []));
}
