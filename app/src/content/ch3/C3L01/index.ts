import type { LevelDef } from '@/types/content';
import { lesson } from './lesson';
import Clarify from './minigames/Clarify';
import { cards, quiz } from './quiz';
import { labConfig, labTasks, missionConfig } from './sim';
import { debrief, incident, missionBrief, missionHints } from './story';

const level: LevelDef = {
  id: 'C3L01',
  chapter: 3,
  number: 1,
  title: 'Ask Before You Build',
  subtitle: 'Step 1: understand the problem and establish design scope',
  users: 10_000_000,
  pages: [42, 44],
  badge: {
    id: 'clarifier',
    name: 'The Clarifier',
    description: 'Turned a vague prompt into written requirements before drawing a single box.',
    icon: 'MessageCircleQuestion',
  },
  incident,
  lesson,
  lab: {
    intro: 'Same small design, different answers. Slide the traffic to whatever the interviewer might say and watch the "right" design change.',
    config: labConfig,
    tasks: labTasks,
  },
  miniGames: [
    {
      id: 'clarify',
      title: 'Clarify!',
      intro: 'A vague interviewer, a limited number of turns. Ask the questions that reveal the requirements; don\'t jump into a solution.',
      Component: Clarify,
    },
  ],
  mission: { brief: missionBrief, config: missionConfig, hints: missionHints },
  quiz,
  cards,
  debrief,
};

export default level;
