import type { LevelDef } from '@/types/content';
import { lesson } from './lesson';
import DoOrDont from './minigames/DoOrDont';
import { cards, quiz } from './quiz';
import { labConfig, labTasks, missionConfig } from './sim';
import { debrief, incident, missionBrief, missionHints } from './story';

const level: LevelDef = {
  id: 'C3L04',
  chapter: 3,
  number: 4,
  title: 'Land the Plane',
  subtitle: 'Step 4: wrap up, dos and don\'ts, and the 45-minute split',
  users: 10_000_000,
  pages: [48, 50],
  badge: {
    id: 'interview-ready',
    name: 'Interview Ready',
    description: 'Wrapped up like a pro: named the bottlenecks, survived the error cases and unlocked Interview Mode.',
    icon: 'PlaneLanding',
  },
  incident,
  lesson,
  lab: {
    intro: 'A solid design, ready for wrap-up questions. Kill components, push the next scale curve, and find the weak spots before the interviewer does.',
    config: labConfig,
    tasks: labTasks,
  },
  miniGames: [
    {
      id: 'do-or-dont',
      title: 'Do or Don\'t?',
      intro: 'A rapid card sort of interview habits from the book\'s dos and don\'ts. Seven seconds per card.',
      Component: DoOrDont,
    },
  ],
  mission: { brief: missionBrief, config: missionConfig, hints: missionHints },
  quiz,
  cards,
  debrief,
};

export default level;
