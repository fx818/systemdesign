/** Shared literals for Level 9 (multiple data centers): scene, quiz and mini-game. */
import type { Pt } from '@/scenekit';

/** Stylised continents on a 1280x720 board. */
export const CONTINENTS = [
  'M90 200 L330 160 L420 210 L360 300 L300 330 L250 420 L180 380 L120 300 Z',
  'M300 440 L380 450 L360 560 L320 620 L300 540 Z',
  'M600 170 L720 150 L760 200 L700 260 L620 250 Z',
  'M620 290 L740 290 L760 400 L700 520 L650 450 L610 360 Z',
  'M760 150 L1120 140 L1180 240 L1080 330 L980 380 L880 360 L800 260 Z',
  'M1040 470 L1150 460 L1170 540 L1060 550 Z',
];

export type DcId = 'us-west' | 'us-east' | 'eu';
export interface Dc { id: DcId; name: string; pos: Pt }
export const DCS: Dc[] = [
  { id: 'us-west', name: 'US-West', pos: { x: 150, y: 270 } },
  { id: 'us-east', name: 'US-East', pos: { x: 360, y: 250 } },
  { id: 'eu', name: 'Europe', pos: { x: 680, y: 200 } },
];

export interface GeoUser { city: string; pos: Pt }
/** Users who pop up in the GeoDNS Router mini-game (round 1: all DCs up; round 2: US-West is dark). */
export const GEO_ROUNDS: { title: string; down: DcId[]; limit: number; users: GeoUser[] }[] = [
  {
    title: 'Round 1 · Route to the closest data center',
    down: [],
    limit: 4,
    users: [
      { city: 'Seattle', pos: { x: 135, y: 215 } },
      { city: 'New York', pos: { x: 385, y: 230 } },
      { city: 'London', pos: { x: 640, y: 195 } },
      { city: 'Los Angeles', pos: { x: 185, y: 330 } },
      { city: 'Chicago', pos: { x: 300, y: 235 } },
      { city: 'Lagos', pos: { x: 650, y: 400 } },
      { city: 'Denver', pos: { x: 225, y: 280 } },
      { city: 'Mumbai', pos: { x: 905, y: 350 } },
    ],
  },
  {
    title: 'Round 2 · US-West is offline! Re-route everyone',
    down: ['us-west'],
    limit: 2.5,
    users: [
      { city: 'San Francisco', pos: { x: 150, y: 300 } },
      { city: 'Seattle', pos: { x: 135, y: 215 } },
      { city: 'Miami', pos: { x: 390, y: 330 } },
      { city: 'Vancouver', pos: { x: 140, y: 190 } },
      { city: 'Paris', pos: { x: 660, y: 225 } },
      { city: 'Las Vegas', pos: { x: 200, y: 300 } },
    ],
  },
];

const dist = (a: Pt, b: Pt) => Math.hypot(a.x - b.x, a.y - b.y);

/** GeoDNS: the closest data center that is still healthy. */
export function nearestDc(p: Pt, down: DcId[] = []): DcId {
  const healthy = DCS.filter((d) => !down.includes(d.id));
  return healthy.reduce((best, d) => (dist(p, d.pos) < dist(p, best.pos) ? d : best), healthy[0]).id;
}
