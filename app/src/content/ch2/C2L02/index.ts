import type { LevelDef } from '@/types/content';
import { lesson } from './lesson';
import LatencyRace from './minigames/LatencyRace';
import { cards, quiz } from './quiz';
import { labConfig, labTasks, missionConfig, missionHints } from './sim';
import { debrief, incident, missionBrief } from './story';

const level: LevelDef = {
  id: 'C2L02',
  chapter: 2,
  number: 2,
  title: 'Need for Speed',
  subtitle: 'Latency numbers: ns, µs, ms and five conclusions',
  users: 10_000_000,
  pages: [35, 37],
  badge: {
    id: 'speed-reader',
    name: 'Speed Reader',
    description: 'Knows a disk seek from a memory reference and moved hot reads from disk to memory.',
    icon: 'Timer',
  },
  incident,
  lesson,
  lab: {
    intro: 'Feed reads can come from memory (cache) or from the database disk. Squeeze the cache and feel the difference in p95.',
    config: labConfig,
    tasks: labTasks,
  },
  miniGames: [
    {
      id: 'latency-race',
      title: 'Latency Race',
      intro: 'Drop eight operations onto a log-scale track, from L1 cache to a trip across the Atlantic. Then watch the photo finish.',
      Component: LatencyRace,
    },
  ],
  mission: { brief: missionBrief, config: missionConfig, hints: missionHints },
  quiz,
  cards,
  debrief,
};

export default level;
