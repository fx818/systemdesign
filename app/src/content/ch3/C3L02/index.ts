import type { LevelDef } from '@/types/content';
import { lesson } from './lesson';
import Blueprint from './minigames/Blueprint';
import { cards, quiz } from './quiz';
import { labConfig, labTasks, missionConfig } from './sim';
import { debrief, incident, missionBrief, missionHints } from './story';

const level: LevelDef = {
  id: 'C3L02',
  chapter: 3,
  number: 2,
  title: 'Blueprint',
  subtitle: 'Step 2: propose a high-level design and get buy-in',
  users: 10_000_000,
  pages: [44, 46],
  badge: {
    id: 'architect-of-agreement',
    name: 'Buy-in Builder',
    description: 'Sketched the news feed blueprint, checked it against the scale and got the interviewer to agree.',
    icon: 'LayoutTemplate',
  },
  incident,
  lesson,
  lab: {
    intro: 'The agreed blueprint is wired into the simulator. Use the napkin-math knobs: does it fit ~1,200 QPS? What about the 2x peak?',
    config: labConfig,
    tasks: labTasks,
  },
  miniGames: [
    {
      id: 'blueprint',
      title: 'Blueprint',
      intro: 'Draw the feed publishing diagram from boxes (watch out for over-engineered decoys), then order the publishing and feed building flows.',
      Component: Blueprint,
    },
  ],
  mission: { brief: missionBrief, config: missionConfig, hints: missionHints },
  quiz,
  cards,
  debrief,
};

export default level;
