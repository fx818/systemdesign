import type { LevelDef } from '@/types/content';
import { lesson } from './lesson';
import HardwareWall from './minigames/HardwareWall';
import UpgradeOrAdd from './minigames/UpgradeOrAdd';
import { cards, quiz } from './quiz';
import { labConfig, labTasks, missionConfig, missionHints } from './sim';
import { debrief, incident, missionBrief } from './story';

const level: LevelDef = {
  id: 'L03',
  number: 3,
  title: 'Bigger or More?',
  subtitle: 'Vertical vs horizontal scaling',
  users: 10000,
  pages: [8, 9],
  badge: {
    id: 'scale-thinker',
    name: 'Scale Thinker',
    description: 'Knows when to buy a bigger box, when to add more boxes, and why one box is never enough at scale.',
    icon: 'Scaling',
  },
  incident,
  lesson,
  lab: {
    intro: 'One web server, a traffic slider and a kill switch. Find the ceiling, cause an outage, then add servers and see what changes (and what does not).',
    config: labConfig,
    tasks: labTasks,
  },
  miniGames: [
    {
      id: 'upgrade-or-add',
      title: 'Upgrade or Add?',
      intro: 'Eight rapid-fire situations. Scale up or scale out? Beat the clock and keep your streak alive.',
      Component: UpgradeOrAdd,
    },
    {
      id: 'hardware-wall',
      title: 'Hardware Wall',
      intro: 'Five traffic waves, 600 credits. Upgrade the one server or add more servers, then see who survives the crash in wave 5.',
      Component: HardwareWall,
    },
  ],
  mission: { brief: missionBrief, config: missionConfig, hints: missionHints },
  quiz,
  cards,
  debrief,
};

export default level;
