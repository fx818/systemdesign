import type { LevelDef } from '@/types/content';
import { lesson } from './lesson';
import DowntimeBudget from './minigames/DowntimeBudget';
import { cards, quiz } from './quiz';
import { labConfig, labTasks, missionConfig, missionHints } from './sim';
import { debrief, incident, missionBrief } from './story';

const level: LevelDef = {
  id: 'C2L03',
  chapter: 2,
  number: 3,
  title: 'Count the Nines',
  subtitle: 'Availability, SLAs and downtime budgets',
  users: 10_000_000,
  pages: [37, 38],
  badge: {
    id: 'nine-lives',
    name: 'Nine Lives',
    description: 'Turned nines into minutes and kept a 99.9% SLA through a crash and a deploy with N + 1 servers.',
    icon: 'ShieldCheck',
  },
  incident,
  lesson,
  lab: {
    intro: 'Uptime is the share of requests you serve. Kill servers, push traffic and find how much spare capacity an SLA really needs.',
    config: labConfig,
    tasks: labTasks,
  },
  miniGames: [
    {
      id: 'downtime-budget',
      title: 'Downtime Budget',
      intro: 'Match each number of nines to its allowed downtime per day and per year, then judge four real SLA scenarios: breached or not?',
      Component: DowntimeBudget,
    },
  ],
  mission: { brief: missionBrief, config: missionConfig, hints: missionHints },
  quiz,
  cards,
  debrief,
};

export default level;
