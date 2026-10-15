/** Shared data for Level 3 (scene, quiz and mini-games). */

export type Strategy = 'up' | 'out';

/** Hardware tiers used by the lesson scene (scale up = climb this ladder). */
export const TIERS = [
  { name: 'Small', cpu: '2 vCPU', ram: '4 GB', cost: 40 },
  { name: 'Large', cpu: '8 vCPU', ram: '32 GB', cost: 160 },
  { name: 'X-Large', cpu: '32 vCPU', ram: '256 GB', cost: 700 },
  { name: 'Max', cpu: '128 vCPU', ram: '4 TB', cost: 3200 },
] as const;

export interface ScenarioCard {
  id: string;
  title: string;
  detail: string;
  answer: Strategy;
  why: string;
}

/** Scenario cards for the "Upgrade or Add?" mini-game. */
export const SCENARIOS: ScenarioCard[] = [
  {
    id: 'blog',
    title: 'Tiny team blog',
    detail: 'About 50 visitors a day. One developer. Traffic has been flat for a year.',
    answer: 'up',
    why: 'Low traffic is where scaling up shines: it is the simplest option. A slightly bigger box is all you need.',
  },
  {
    id: 'black-friday',
    title: 'Black Friday sale',
    detail: 'Traffic jumps to 20x normal for one weekend, then drops back.',
    answer: 'out',
    why: 'Huge swings need more machines in the pool, and a single box has a hard ceiling. Scale out.',
  },
  {
    id: 'redundancy',
    title: '"It must never go down"',
    detail: 'The payments page has to stay up even if a machine dies.',
    answer: 'out',
    why: 'Vertical scaling has no failover or redundancy: one server down means the whole site is down. Only more servers fix that.',
  },
  {
    id: 'max-tier',
    title: 'Already on the biggest box',
    detail: 'Your server is the largest instance the cloud sells, and it is at 95% CPU.',
    answer: 'out',
    why: 'That is the hard limit of vertical scaling. You cannot add unlimited CPU and memory to one server.',
  },
  {
    id: 'admin',
    title: 'Internal admin tool',
    detail: '10 staff use it in office hours. A short outage is no big deal.',
    answer: 'up',
    why: 'Low traffic and no need for redundancy: keep it simple and give the one server more power if it struggles.',
  },
  {
    id: 'demo',
    title: 'Prototype for Friday',
    detail: 'A demo for investors. The page feels slow on the cheapest VM.',
    answer: 'up',
    why: 'Simplicity wins for a small prototype. Bump the CPU/RAM and ship the demo.',
  },
  {
    id: 'global',
    title: 'Millions of users',
    detail: 'PixelPost is going global and growing every week.',
    answer: 'out',
    why: 'Horizontal scaling is preferred for large-scale applications because vertical scaling hits limits.',
  },
  {
    id: 'ram',
    title: 'Small app, low on memory',
    detail: 'A hobby app with steady traffic keeps running out of its 1 GB of RAM.',
    answer: 'up',
    why: 'Traffic is low and steady. Adding RAM to the one server is the simple, cheap fix.',
  },
];

/* --------------------------- Hardware Wall game --------------------------- */

/** Capacity (rps) of the main server at each upgrade tier. Tier 3 is the biggest box there is. */
export const WALL_TIER_CAPACITY = [500, 1000, 2000, 3000];
/** Cost (credits) to move from tier i to tier i+1. Gets steep fast. */
export const WALL_UPGRADE_COST = [80, 160, 320];
export const WALL_SERVER_COST = 100;
export const WALL_SERVER_CAPACITY = 1000;
export const WALL_BUDGET = 600;

export interface Wave {
  rps: number;
  label: string;
  /** The main server crashes during this wave. */
  crash?: boolean;
}

export const WAVES: Wave[] = [
  { rps: 400, label: 'A normal Tuesday' },
  { rps: 900, label: 'Local news mention' },
  { rps: 1800, label: 'Trending on social media' },
  { rps: 3500, label: 'Prime-time TV segment' },
  { rps: 1500, label: 'Server 1 dies mid-evening', crash: true },
];
