import type { LevelDef } from '@/types/content';
import { lesson } from './lesson';
import WorkerShift from './minigames/WorkerShift';
import { cards, quiz } from './quiz';
import { labConfig, labTasks, missionConfig, missionHints } from './sim';
import { debrief, incident, missionBrief } from './story';

const level: LevelDef = {
  id: 'L10',
  number: 10,
  title: 'Take a Number',
  subtitle: 'Message queues and async workers',
  users: 3_000_000,
  pages: [25, 26],
  badge: {
    id: 'queue-master',
    name: 'Queue Master',
    description: 'Decoupled photo processing with a message queue and scaled the workers through a filter frenzy.',
    icon: 'ListOrdered',
  },
  incident,
  lesson,
  lab: {
    intro: 'Web servers publish photo jobs, workers consume them. Starve the workers, kill the consumers, kill the producers, and watch the queue soak it all up.',
    config: labConfig,
    tasks: labTasks,
  },
  miniGames: [
    {
      id: 'worker-shift',
      title: 'Worker Shift Manager',
      intro: '60 seconds of bursty uploads. Add and remove workers to keep the queue under the red line without wasting credits.',
      Component: WorkerShift,
    },
  ],
  mission: { brief: missionBrief, config: missionConfig, hints: missionHints },
  quiz,
  cards,
  debrief,
};

export default level;
