import type { LevelDef } from '@/types/content';
import { lesson } from './lesson';
import TimeBoss from './minigames/TimeBoss';
import { cards, quiz } from './quiz';
import { labConfig, labTasks, missionConfig } from './sim';
import { debrief, incident, missionBrief, missionHints } from './story';

const level: LevelDef = {
  id: 'C3L03',
  chapter: 3,
  number: 3,
  title: 'Dig Deep',
  subtitle: 'Step 3: design deep dive',
  users: 10_000_000,
  pages: [46, 48],
  badge: {
    id: 'deep-diver',
    name: 'Deep Diver',
    description: 'Prioritized the components that mattered, skipped the rabbit holes, and fixed the bottlenecks the interviewer pointed at.',
    icon: 'Pickaxe',
  },
  incident,
  lesson,
  lab: {
    intro: 'The full news feed design with deep-dive knobs: feed cache for retrieval, fan-out workers for publishing. Break each one, then fix it.',
    config: labConfig,
    tasks: labTasks,
  },
  miniGames: [
    {
      id: 'time-boss',
      title: 'Time Boss',
      intro: 'Split a 45-minute interview across the four steps, then spend your deep-dive minutes on the topics that matter for each prompt.',
      Component: TimeBoss,
    },
  ],
  mission: { brief: missionBrief, config: missionConfig, hints: missionHints },
  quiz,
  cards,
  debrief,
};

export default level;
