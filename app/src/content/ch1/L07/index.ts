import type { LevelDef } from '@/types/content';
import { lesson } from './lesson';
import CdnFlowOrder from './minigames/CdnFlowOrder';
import CdnOrNot from './minigames/CdnOrNot';
import { cards, quiz } from './quiz';
import { labConfig, labTasks, missionConfig, missionHints } from './sim';
import { debrief, incident, missionBrief } from './story';

const level: LevelDef = {
  id: 'L07',
  number: 7,
  title: 'Closer to Home',
  subtitle: 'Content delivery networks',
  users: 500_000,
  pages: [17, 20],
  badge: {
    id: 'edge-lord',
    name: 'Edge Lord',
    description: 'Put PixelPost\'s static files on CDN edges worldwide and kept the site up through a CDN outage.',
    icon: 'Globe',
  },
  incident,
  lesson,
  lab: {
    intro: 'Users in Europe and Asia are waiting on photos from San Francisco. Toggle the CDN, play with the TTL and pull the plug on the CDN to see the origin fallback.',
    config: labConfig,
    tasks: labTasks,
  },
  miniGames: [
    {
      id: 'cdn-flow-order',
      title: 'Order the CDN flow',
      intro: 'Six shuffled steps of the CDN workflow. Rebuild the flow, then watch the packets replay it.',
      Component: CdnFlowOrder,
    },
    {
      id: 'cdn-or-not',
      title: 'CDN or Not?',
      intro: 'Decide which files deserve a spot on the CDN without blowing the monthly bill.',
      Component: CdnOrNot,
    },
  ],
  mission: { brief: missionBrief, config: missionConfig, hints: missionHints },
  quiz,
  cards,
  debrief,
};

export default level;
