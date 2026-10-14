import type { LevelDef } from '@/types/content';
import { lesson } from './lesson';
import SqlOrNoSql from './minigames/SqlOrNoSql';
import { cards, quiz } from './quiz';
import { labConfig, labTasks, missionConfig, missionHints } from './sim';
import { debrief, incident, missionBrief } from './story';

const level: LevelDef = {
  id: 'L02',
  number: 2,
  title: 'Split the Tiers',
  subtitle: 'Web tier vs data tier, SQL vs NoSQL',
  users: 1000,
  pages: [7, 8],
  badge: {
    id: 'data-whisperer',
    name: 'Data Whisperer',
    description: 'Split the web tier from the data tier and picked the right database for every PixelPost feature.',
    icon: 'Database',
  },
  incident,
  lesson,
  lab: {
    intro: 'The web tier and the data tier now live on separate machines. Overload one, kill the other, and watch each tier behave on its own.',
    config: labConfig,
    tasks: labTasks,
  },
  miniGames: [
    {
      id: 'sql-or-nosql',
      title: 'SQL or NoSQL?',
      intro: 'Swipe PixelPost features into SQL or NoSQL, then name the NoSQL family for bonus points.',
      Component: SqlOrNoSql,
    },
  ],
  mission: { brief: missionBrief, config: missionConfig, hints: missionHints },
  quiz,
  cards,
  debrief,
};

export default level;
