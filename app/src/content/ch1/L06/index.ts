import type { LevelDef } from '@/types/content';
import { lesson } from './lesson';
import Evict from './minigames/Evict';
import TtlGoldilocks from './minigames/TtlGoldilocks';
import { cards, quiz } from './quiz';
import { labConfig, labTasks, missionConfig, missionHints } from './sim';
import { debrief, incident, missionBrief } from './story';

const level: LevelDef = {
  id: 'L06',
  number: 6,
  title: 'Memory Lane',
  subtitle: 'Caching: read-through, TTL, consistency, eviction',
  users: 300000,
  pages: [14, 17],
  badge: {
    id: 'cache-money',
    name: 'Cache Money',
    description: 'Put a cache tier in front of the database, tuned its TTL and kept it from becoming a single point of failure.',
    icon: 'Zap',
  },
  incident,
  lesson,
  lab: {
    intro: 'A cache sits between the web servers and the database. Play with TTL, memory and eviction, then pull the plug on the cache.',
    config: labConfig,
    tasks: labTasks,
  },
  miniGames: [
    {
      id: 'evict',
      title: 'Evict!',
      intro: 'A 4-slot cache is full and a new key arrives. Predict who gets thrown out under LRU, then LFU, then FIFO.',
      Component: Evict,
    },
    {
      id: 'ttl-goldilocks',
      title: 'TTL Goldilocks',
      intro: 'Not too short, not too long. Pick the right expiry for five kinds of PixelPost data.',
      Component: TtlGoldilocks,
    },
  ],
  mission: { brief: missionBrief, config: missionConfig, hints: missionHints },
  quiz,
  cards,
  debrief,
};

export default level;
