import type { LevelDef } from '@/types/content';
import { lesson } from './lesson';
import TrafficCop from './minigames/TrafficCop';
import { cards, quiz } from './quiz';
import { labConfig, labTasks, missionConfig, missionHints } from './sim';
import { debrief, incident, missionBrief } from './story';

const level: LevelDef = {
  id: 'L04',
  number: 4,
  title: 'Traffic Cop',
  subtitle: 'Load balancers, public vs private IPs, failover',
  users: 50000,
  pages: [9, 11],
  badge: {
    id: 'load-balanced',
    name: 'Load Balanced',
    description: 'Put a load balancer in front of the web tier and kept PixelPost online while a server died mid-surge.',
    icon: 'Split',
  },
  incident,
  lesson,
  lab: {
    intro: 'A load balancer with two web servers behind it. Kill servers, crank the traffic and grow the pool, and watch the load balancer reroute every request.',
    config: labConfig,
    tasks: labTasks,
  },
  miniGames: [
    {
      id: 'traffic-cop',
      title: 'Traffic Cop',
      intro: 'Be the load balancer: send every request to a healthy server before it times out. Servers will crash mid-shift.',
      Component: TrafficCop,
    },
  ],
  mission: { brief: missionBrief, config: missionConfig, hints: missionHints },
  quiz,
  cards,
  debrief,
};

export default level;
