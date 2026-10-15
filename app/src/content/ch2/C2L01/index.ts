import type { LevelDef } from '@/types/content';
import { lesson } from './lesson';
import UnitLadder from './minigames/UnitLadder';
import { cards, quiz } from './quiz';
import { labConfig, labTasks, missionConfig, missionHints } from './sim';
import { debrief, incident, missionBrief } from './story';

const level: LevelDef = {
  id: 'C2L01',
  chapter: 2,
  number: 1,
  title: 'Powers of Two',
  subtitle: 'Bits, bytes, ASCII and the KB-to-PB ladder',
  users: 10_000_000,
  pages: [34, 35],
  badge: {
    id: 'byte-sized',
    name: 'Byte Sized',
    description: 'Climbed the unit ladder from bits to petabytes and sized a 2^12 req/s peak with headroom.',
    icon: 'Binary',
  },
  incident,
  lesson,
  lab: {
    intro: 'Traffic grows in powers of two. Slide it from 2^10 to 2^13 requests per second and size the web tier to match.',
    config: labConfig,
    tasks: labTasks,
  },
  miniGames: [
    {
      id: 'unit-ladder',
      title: 'Unit Ladder',
      intro: 'Put bits, bytes and KB to PB in order, then race the clock through eight unit conversions.',
      Component: UnitLadder,
    },
  ],
  mission: { brief: missionBrief, config: missionConfig, hints: missionHints },
  quiz,
  cards,
  debrief,
};

export default level;
