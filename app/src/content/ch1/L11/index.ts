import type { LevelDef } from '@/types/content';
import { lesson } from './lesson';
import IncidentDetective from './minigames/IncidentDetective';
import MetricSorter from './minigames/MetricSorter';
import { cards, quiz } from './quiz';
import { labConfig, labTasks, missionConfig, missionHints } from './sim';
import { debrief, incident, missionBrief } from './story';

const level: LevelDef = {
  id: 'L11',
  number: 11,
  title: 'Eyes on the System',
  subtitle: 'Logging, metrics and automation',
  users: 5_000_000,
  pages: [26, 28],
  badge: {
    id: 'detective',
    name: 'Detective',
    description: 'Cracked a 3 AM outage with central logs and dashboards, and let CI catch the bad release.',
    icon: 'Search',
  },
  incident,
  lesson,
  lab: {
    intro: 'PixelPost at 5 million users, one data center shown. Break things, then add logging, metrics and CI and see how much faster you would notice.',
    config: labConfig,
    tasks: labTasks,
  },
  miniGames: [
    {
      id: 'incident-detective',
      title: 'Incident Detective',
      intro: 'A mystery outage at 3 AM. Search the central logs, read host metrics and dashboards, pin your evidence and name the root cause.',
      Component: IncidentDetective,
    },
    {
      id: 'metric-sorter',
      title: 'Metric Sorter',
      intro: 'Metrics stream in fast. Sort each one: host level, aggregated level or key business.',
      Component: MetricSorter,
    },
  ],
  mission: { brief: missionBrief, config: missionConfig, hints: missionHints },
  quiz,
  cards,
  debrief,
};

export default level;
