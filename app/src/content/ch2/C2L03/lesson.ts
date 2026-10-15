import type { Caption, Checkpoint, Hotspot, LessonDef } from '@/types/content';
import Scene, { T } from './Scene';

const c = (start: number, end: number, text: string): Caption => ({ start, end, text });

export const captions: Caption[] = [
  c(0, 4, 'Level 3: an investor asks what uptime PixelPost guarantees.'),
  c(4, 9, 'Maya answered "a lot of nines". Investors want an exact number.'),
  c(9, 14, 'And every number of nines means a very specific amount of allowed downtime.'),
  c(14, 18, 'Let us count them properly.'),
  c(18, 23, 'High availability is the ability of a system to be continuously operational...'),
  c(23, 27, '...for a desirably long period of time.'),
  c(27, 32, 'It is measured as a percentage. 100% means a service with zero downtime.'),
  c(32, 37, 'Here is a month of PixelPost. Three bad days drag the number down fast.'),
  c(37, 41, 'Most services fall between 99% and 100%.'),
  c(41, 44, 'All the interesting differences hide in that last sliver.'),
  c(44, 49, 'Next term: the service level agreement, or SLA.'),
  c(49, 54, 'It is an agreement between you, the service provider, and your customer.'),
  c(54, 58, 'It formally defines the level of uptime your service will deliver.'),
  c(58, 63, 'Cloud providers like Amazon, Google and Microsoft set their SLAs at 99.9% or above.'),
  c(63, 70, 'Uptime is traditionally measured in nines. The more nines, the better.'),
  c(70, 74, 'Here is how the number of nines maps to expected downtime.'),
  c(74, 79, '99%: about 14.4 minutes a day, 7.31 hours a month, 3.65 days a year.'),
  c(79, 84, '99.9%, three nines: 1.44 minutes a day, about 8.77 hours a year.'),
  c(84, 89, '99.99%, four nines: 8.64 seconds a day, 4.38 minutes a month, 52.6 minutes a year.'),
  c(89, 94, '99.999%, five nines: 864 milliseconds a day, about 5.26 minutes a year.'),
  c(94, 100, '99.9999%, six nines: 86.4 milliseconds a day, about 31.6 seconds a year.'),
  c(100, 106, 'Each extra nine cuts the allowed downtime by ten.'),
  c(106, 112, 'More nines are better, but much harder to deliver.'),
  c(112, 117, 'You do not need to memorise the table. You can compute it.'),
  c(117, 122, 'Downtime equals 100% minus the availability, times the period.'),
  c(122, 127, 'For 99.9% per day: 0.1% of 86,400 seconds is 86.4 seconds.'),
  c(127, 131, 'That is about 1.44 minutes per day. Your daily error budget.'),
  c(131, 136, 'Every outage, every slow deploy, burns sand from that hourglass.'),
  c(136, 141, 'Now the real question. Maya promised 99.99% per month.'),
  c(141, 145, 'A month is about 30.44 days, so the budget is about 4.38 minutes.'),
  c(145, 149, 'This month, a deploy took the site down...'),
  c(149, 154, '...for nine whole minutes. The bar shoots past the budget.'),
  c(154, 158, 'Breached. Nine minutes is more than twice what four nines allows.'),
  c(158, 163, 'To keep a promise like that: rolling deploys, spare servers, automatic failover.'),
  c(163, 168, 'Next: the boss. Put it all together in a full napkin estimate.'),
];

export const hotspots: Hotspot[] = [
  { id: 'availability', title: 'High availability', body: 'The ability of a system to be continuously operational for a desirably long period of time, measured as a percentage. 100% means zero downtime; most services fall between 99% and 100%.' },
  { id: 'sla', title: 'Service level agreement', body: 'An agreement between the service provider and the customer that formally defines the level of uptime the service will deliver. Amazon, Google and Microsoft set theirs at 99.9% or above.' },
  { id: 'nines', title: 'Table 2-3: the nines', body: '99%: 14.4 min/day, 3.65 days/year. 99.9%: 1.44 min/day, 8.77 h/year. 99.99%: 8.64 s/day, 52.6 min/year. 99.999%: 864 ms/day, 5.26 min/year. 99.9999%: 86.4 ms/day, 31.6 s/year.' },
  { id: 'formula', title: 'Downtime formula', body: 'Allowed downtime = (100% − availability) × period. Day = 86,400 s, week = 604,800 s, month ≈ 30.44 days, year ≈ 365.25 days.' },
];

export const checkpoints: Checkpoint[] = [
  {
    at: T.table - 2,
    question: {
      id: 'C2L03-cp1',
      kind: 'mcq',
      prompt: 'Where do cloud providers such as Amazon, Google and Microsoft set their SLAs?',
      options: ['Around 90%', 'Around 99%', 'At 99.9% or above', 'At exactly 100%'],
      answer: 2,
      explanation: 'The big cloud providers set their SLAs at 99.9% or above.',
      page: 38,
    },
  },
  {
    at: T.scenario - 2,
    question: {
      id: 'C2L03-cp2',
      kind: 'numeric',
      prompt: '99.9% availability allows how many minutes of downtime per day?',
      answer: 1.44,
      tolerance: 0.05,
      unit: 'min',
      explanation: '0.1% × 86,400 s = 86.4 s ≈ 1.44 minutes per day.',
      page: 38,
    },
  },
];

export const lesson: LessonDef = {
  duration: T.end,
  chapters: [
    { at: T.intro, title: '"A lot of nines"' },
    { at: T.avail, title: 'High availability' },
    { at: T.sla, title: 'SLA' },
    { at: T.table, title: 'The nines table' },
    { at: T.formula, title: 'Compute it' },
    { at: T.scenario, title: 'Breached?' },
  ],
  captions,
  hotspots,
  checkpoints,
  Scene,
};
