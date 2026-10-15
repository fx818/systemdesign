import type { LevelDef } from '@/types/content';
import { lesson } from './lesson';
import WhosLoggedIn from './minigames/WhosLoggedIn';
import { cards, quiz } from './quiz';
import { labConfig, labTasks, missionConfig, missionHints } from './sim';
import { debrief, incident, missionBrief } from './story';

const level: LevelDef = {
  id: 'L08',
  number: 8,
  title: 'Forget Me Not',
  subtitle: 'A stateless web tier',
  users: 1_000_000,
  pages: [20, 23],
  badge: {
    id: 'stateless',
    name: 'Stateless',
    description: 'Moved session data out of the web tier and autoscaled through a traffic wave with zero logouts.',
    icon: 'KeyRound',
  },
  incident,
  lesson,
  lab: {
    intro: 'Three web servers, each keeping its own users\' sessions. Kill servers with sticky sessions on, then move the sessions into a shared store and try again.',
    config: labConfig,
    tasks: labTasks,
  },
  miniGames: [
    {
      id: 'whos-logged-in',
      title: "Who's Logged In?",
      intro: 'Requests bounce between servers. Predict which ones stay logged in: first with stateful servers, then with a shared session store.',
      Component: WhosLoggedIn,
    },
  ],
  mission: { brief: missionBrief, config: missionConfig, hints: missionHints },
  quiz,
  cards,
  debrief,
};

export default level;
