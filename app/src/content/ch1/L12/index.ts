import type { LevelDef } from '@/types/content';
import { lesson } from './lesson';
import PickTheKey from './minigames/PickTheKey';
import ShardRouter from './minigames/ShardRouter';
import { cards, quiz } from './quiz';
import { labConfig, labTasks, missionConfig, missionHints } from './sim';
import { debrief, incident, missionBrief } from './story';

const level: LevelDef = {
  id: 'L12',
  number: 12,
  title: 'Divide and Conquer',
  subtitle: 'Database scaling and sharding',
  users: 8_000_000,
  pages: [28, 32],
  badge: {
    id: 'shard-lord',
    name: 'Shard Lord',
    description: 'Split PixelPost\'s data across shards, picked an even sharding key and tamed a celebrity hotspot.',
    icon: 'Layers',
  },
  incident,
  lesson,
  lab: {
    intro: 'Four shards behind the web tier. Change the shard count, unleash a celebrity post and see which shard melts.',
    config: labConfig,
    tasks: labTasks,
  },
  miniGames: [
    {
      id: 'shard-router',
      title: 'Shard Router',
      intro: 'User ids fly in. Compute user_id % N and drop each into the right shard, fast. Then the shards fill up and N changes...',
      Component: ShardRouter,
    },
    {
      id: 'pick-the-key',
      title: 'Pick the Key',
      intro: 'Three tables, four candidate sharding keys each. Pick the key that spreads data evenly and watch the histogram.',
      Component: PickTheKey,
    },
  ],
  mission: { brief: missionBrief, config: missionConfig, hints: missionHints },
  quiz,
  cards,
  debrief,
};

export default level;
