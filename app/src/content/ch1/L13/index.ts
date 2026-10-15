import type { LevelDef } from '@/types/content';
import { lesson } from './lesson';
import ChecklistRecall from './minigames/ChecklistRecall';
import SpotEverySpof from './minigames/SpotEverySpof';
import { cards, quiz } from './quiz';
import { labConfig, labTasks, missionConfig, missionHints } from './sim';
import { debrief, incident, missionBrief } from './story';

const level: LevelDef = {
  id: 'L13',
  number: 13,
  title: 'Launch Night',
  subtitle: 'Boss level: everything, all at once',
  users: 10_000_000,
  pages: [5, 33],
  boss: true,
  badge: {
    id: 'principal-architect',
    name: 'Principal Architect',
    description: 'Built PixelPost from an empty canvas and kept it up through all seven launch-night waves for 10 million users.',
    icon: 'Crown',
  },
  incident,
  lesson,
  lab: {
    intro: 'The architect playground: every component, every knob, no wrong answers. Rebuild Figure 1-23, then break it until nothing is a single point of failure.',
    config: labConfig,
    tasks: labTasks,
  },
  miniGames: [
    {
      id: 'checklist-recall',
      title: 'Checklist Recall',
      intro: 'Type the chapter\'s 8 scaling rules from memory. Stuck? Pick them from a list, but watch out for traps.',
      Component: ChecklistRecall,
    },
    {
      id: 'spot-every-spof',
      title: 'Spot every SPOF',
      intro: 'A flawed PixelPost design. Find every part whose failure alone would take the whole site down.',
      Component: SpotEverySpof,
    },
  ],
  mission: { brief: missionBrief, config: missionConfig, hints: missionHints },
  quiz,
  cards,
  debrief,
};

export default level;
