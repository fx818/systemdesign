import type { LevelDef } from '@/types/content';
import { lesson } from './lesson';
import QueryRouter from './minigames/QueryRouter';
import { cards, quiz } from './quiz';
import { labConfig, labTasks, missionConfig, missionHints } from './sim';
import { debrief, incident, missionBrief } from './story';

const level: LevelDef = {
  id: 'L05',
  number: 5,
  title: 'Copy That',
  subtitle: 'Database replication: master, replicas, failover',
  users: 100000,
  pages: [11, 14],
  badge: {
    id: 'replicator',
    name: 'Replicator',
    description: 'Replicated the database, routed every query to the right copy and survived losing the master.',
    icon: 'DatabaseBackup',
  },
  incident,
  lesson,
  lab: {
    intro: 'A master with two read replicas. Change the replica count, kill replicas, then kill the master and watch a replica get promoted.',
    config: labConfig,
    tasks: labTasks,
  },
  miniGames: [
    {
      id: 'query-router',
      title: 'Query Router',
      intro: 'SQL statements are flying in. Writes to the primary, reads to the replicas. Get it wrong and things break.',
      Component: QueryRouter,
    },
  ],
  mission: { brief: missionBrief, config: missionConfig, hints: missionHints },
  quiz,
  cards,
  debrief,
};

export default level;
