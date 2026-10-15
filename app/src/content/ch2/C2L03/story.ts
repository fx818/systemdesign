import type { DialogueLine } from '@/types/content';

export const incident: DialogueLine[] = [
  { who: 'maya', text: 'Investor question three: "What uptime do you guarantee your business customers?"', mood: 'neutral' },
  { who: 'maya', text: 'I said "a lot of nines". She wrote something down and did not smile.', mood: 'worried' },
  { who: 'pager', text: 'BZZT. Fun fact: last month a deploy took the site down for nine minutes.', mood: 'happy' },
  { who: 'player', text: 'Nine minutes out of a whole month? That is basically 100%... right?', mood: 'neutral' },
  { who: 'ravi', text: 'Depends how many nines you promised. Each extra nine shrinks your budget tenfold.', mood: 'neutral' },
  { who: 'ravi', text: 'Let us turn "a lot of nines" into minutes and seconds.', mood: 'happy' },
];

export const missionBrief: DialogueLine[] = [
  { who: 'maya', text: 'Our enterprise SLA says 99.9%. Today a server is going to crash, and we also have a deploy.', mood: 'worried' },
  { who: 'ravi', text: 'Three servers carry the load with nothing to spare. Lose one and a third of the requests have nowhere to go.' },
  { who: 'ravi', text: 'Estimate first: traffic ÷ capacity per server, then add one spare (N + 1) so a failure costs nothing.' },
  { who: 'pager', text: 'Error budget for this round: 0.1% of 80 seconds. That is 0.08 seconds. Good luck. Bzzt.', mood: 'happy' },
];

export const debrief: DialogueLine[] = [
  { who: 'maya', text: 'A server crashed AND we deployed, and the uptime meter never dipped. I could cry.', mood: 'happy' },
  { who: 'player', text: 'N + 1: 2,500 requests per second needs three servers, so we run four. One can always be missing.', mood: 'proud' },
  { who: 'ravi', text: 'And now you can price your promise: 99.9% is 8.77 hours a year, 99.99% only 52.6 minutes.', mood: 'proud' },
  { who: 'maya', text: 'I will promise 99.9% in the contract and aim for 99.99% inside the team.', mood: 'happy' },
  { who: 'ravi', text: 'Spoken like a CEO. Now the final investor question: the big estimate.', mood: 'neutral' },
  { who: 'pager', text: 'BZZT. QPS, peak QPS, storage for five years. No calculators. Bzzzt.', mood: 'happy' },
];
