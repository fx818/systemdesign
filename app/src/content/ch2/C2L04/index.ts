import type { LevelDef } from '@/types/content';
import { lesson } from './lesson';
import EstimationWorkbench from './minigames/EstimationWorkbench';
import { cards, quiz } from './quiz';
import { labConfig, labTasks, missionConfig, missionHints } from './sim';
import { debrief, incident, missionBrief } from './story';

const level: LevelDef = {
  id: 'C2L04',
  chapter: 2,
  number: 4,
  title: 'Napkin Math',
  subtitle: 'BOSS: estimate QPS, peak, servers and 5-year storage',
  users: 10_000_000,
  pages: [38, 40],
  boss: true,
  badge: {
    id: 'napkin-master',
    name: 'Napkin Master',
    description: 'Estimated PixelPost\'s QPS, peak, servers and 5-year storage on a napkin, then provisioned exactly enough to survive the peak.',
    icon: 'Calculator',
  },
  incident,
  lesson,
  lab: {
    intro: 'Your napkin says ~2,900 QPS average and ~5,800 at peak. Slide traffic and servers to test the estimate against the simulator.',
    config: labConfig,
    tasks: labTasks,
  },
  miniGames: [
    {
      id: 'estimation-workbench',
      title: 'Estimation Workbench',
      intro: 'Fill in the napkin step by step: DAU, QPS, peak, servers and storage. Round numbers earn a bonus; a final answer within 2× earns full marks.',
      Component: EstimationWorkbench,
    },
  ],
  mission: { brief: missionBrief, config: missionConfig, hints: missionHints },
  quiz,
  cards,
  debrief,
};

export default level;
