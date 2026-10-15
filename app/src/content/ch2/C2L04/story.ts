import type { DialogueLine } from '@/types/content';

export const incident: DialogueLine[] = [
  { who: 'maya', text: 'Last question from the lead investor: "Walk me through your QPS and storage for the next five years."', mood: 'worried' },
  { who: 'maya', text: 'She said she asks this in every engineering interview she runs. Live. On the whiteboard.', mood: 'panic' },
  { who: 'pager', text: 'BZZT. Five minutes. Tick tock.', mood: 'happy' },
  { who: 'player', text: 'We know powers of two, latency numbers and the nines. Now we put them together.', mood: 'neutral' },
  { who: 'ravi', text: 'Same recipe as the famous Twitter example: assumptions, daily users, QPS, peak QPS, storage.', mood: 'neutral' },
  { who: 'ravi', text: 'Round everything. Label every unit. Nobody expects decimals.', mood: 'happy' },
  { who: 'maya', text: 'Okay. Napkin, pen. Let\'s go.', mood: 'proud' },
];

export const missionBrief: DialogueLine[] = [
  { who: 'maya', text: 'The investors want to see it live: tonight\'s traffic will hit your estimated peak.', mood: 'worried' },
  { who: 'ravi', text: 'Your napkin said ~2,900 read QPS on average and ~5,800 at peak. One web server handles ~1,000.' },
  { who: 'ravi', text: 'And the database: one primary handles ~800 requests per second. Reads at peak are far more than that.' },
  { who: 'player', text: 'So: enough web servers for the peak, and something cheap that soaks up the reads.', mood: 'proud' },
  { who: 'pager', text: 'Budget is tight. Overbuild and the investors see the bill. Underbuild and they see errors. Bzzt.', mood: 'happy' },
];

export const debrief: DialogueLine[] = [
  { who: 'maya', text: 'TERM SHEET SIGNED! She said our napkin was "the best estimate she has seen from a startup this year".', mood: 'happy' },
  { who: 'ravi', text: '~2,900 QPS, ~5,800 at peak, 6 servers, a cache for the reads, 8 TB a day, about 15 PB in five years.', mood: 'proud' },
  { who: 'player', text: 'And every number traced back to a written assumption with a unit next to it.', mood: 'proud' },
  { who: 'ravi', text: 'That is back-of-the-envelope estimation: thought experiments plus common numbers, to pick a design that fits.', mood: 'neutral' },
  { who: 'maya', text: 'Next investor round, I want you doing this in the actual interview room.', mood: 'happy' },
  { who: 'pager', text: 'BZZT. Interview rooms. Now THAT is my favourite kind of incident.', mood: 'happy' },
];
