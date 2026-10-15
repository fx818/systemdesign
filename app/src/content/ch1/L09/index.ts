import type { LevelDef } from '@/types/content';
import { lesson } from './lesson';
import GeoDnsRouter from './minigames/GeoDnsRouter';
import { cards, quiz } from './quiz';
import { labConfig, labTasks, missionConfig, missionHints } from './sim';
import { debrief, incident, missionBrief } from './story';

const level: LevelDef = {
  id: 'L09',
  number: 9,
  title: 'Going Global',
  subtitle: 'Multiple data centers and geoDNS',
  users: 2_000_000,
  pages: [23, 25],
  badge: {
    id: 'globetrotter',
    name: 'Globetrotter',
    description: 'Ran PixelPost from two data centers and survived a full US-West outage without losing a single photo.',
    icon: 'Earth',
  },
  incident,
  lesson,
  lab: {
    intro: 'Two data centers behind geoDNS. Drag the traffic split, knock out a whole region, and see what happens with and without cross-DC replication.',
    config: labConfig,
    tasks: labTasks,
  },
  miniGames: [
    {
      id: 'geodns-router',
      title: 'GeoDNS Router',
      intro: 'Be the geoDNS: send each user to the nearest data center, then re-route everyone fast when a region goes dark.',
      Component: GeoDnsRouter,
    },
  ],
  mission: { brief: missionBrief, config: missionConfig, hints: missionHints },
  quiz,
  cards,
  debrief,
};

export default level;
