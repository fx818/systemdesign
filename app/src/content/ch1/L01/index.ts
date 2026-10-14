import type { LevelDef } from '@/types/content';
import { lesson } from './lesson';
import PacketJourney from './minigames/PacketJourney';
import { cards, quiz } from './quiz';
import { labConfig, labTasks, missionConfig, missionHints } from './sim';
import { debrief, incident, missionBrief } from './story';

const level: LevelDef = {
  id: 'L01',
  number: 1,
  title: 'Hello, World',
  subtitle: 'One server, one user, one request',
  users: 1,
  pages: [5, 7],
  badge: {
    id: 'first-request',
    name: 'First Request',
    description: 'Followed a request from DNS lookup to JSON response and shipped PixelPost\'s first server.',
    icon: 'Send',
  },
  incident,
  lesson,
  lab: {
    intro: 'Your single server is live. Push traffic until it melts, then pull the plug and see what "one box" really means.',
    config: labConfig,
    tasks: labTasks,
  },
  miniGames: [
    {
      id: 'packet-journey',
      title: 'Packet Journey',
      intro: 'Guide a request through DNS, the IP address, HTTP and the response, against the clock.',
      Component: PacketJourney,
    },
  ],
  mission: { brief: missionBrief, config: missionConfig, hints: missionHints },
  quiz,
  cards,
  debrief,
};

export default level;
