import type { DialogueLine } from '@/types/content';

export const incident: DialogueLine[] = [
  { who: 'narrator', text: 'Final mock interview. Minute 41. The deep dive went well. Then Maya puts the marker down.' },
  { who: 'maya', text: 'We have a few minutes. Anything else you\'d like to discuss?', mood: 'neutral' },
  { who: 'player', text: 'Nope! I think the design is perfect.', mood: 'proud' },
  { who: 'pager', text: 'BZZT! Red flag raised. Final impression: overconfident.', mood: 'panic' },
  { who: 'ravi', text: 'Ouch. The last five minutes are where you leave the impression the interviewer writes down.', mood: 'worried' },
  { who: 'ravi', text: 'Bottlenecks, recap, error cases, operations, the next scale curve. Land the plane, don\'t crash it.', mood: 'neutral' },
];

export const missionBrief: DialogueLine[] = [
  { who: 'maya', text: 'Wrap-up questions, live. What if a server dies? What if the database dies? What about 2x traffic?', mood: 'neutral' },
  { who: 'maya', text: 'Your design today: load balancer, 2 web servers, a cache, one primary database. It serves 1,500 requests/sec.', mood: 'neutral' },
  { who: 'ravi', text: 'Error cases and the next scale curve, in the simulator. Monitoring will help you talk about operations.', mood: 'neutral' },
  { who: 'player', text: 'No "it\'s perfect" this time. Let\'s find the weak spots before she does.', mood: 'proud' },
];

export const missionHints = [
  'Error case 1: a web server crashes at 30 s, then traffic doubles to 3,000 at 50 s. You need 4 healthy web servers then, so 5 in total (add 3, wire each from the load balancer to the cache and the database).',
  'Error case 2: the primary database dies at 70 s. Without a replica the data is gone. Add a DB replica and wire the database to it, so it can be promoted.',
  'Operation issues: add metrics and logging and wire the web servers to them. They do not add capacity, but you can\'t discuss monitoring without them.',
];

export const debrief: DialogueLine[] = [
  { who: 'maya', text: 'You named the weak spots before I did, recapped the design, and asked what I thought. Strong hire.', mood: 'happy' },
  { who: 'ravi', text: 'That\'s the framework: understand the scope, propose a blueprint and get buy-in, dive deep, wrap up.', mood: 'proud' },
  { who: 'player', text: 'Ask before I build, design with the interviewer, skip the rabbit holes, never say "perfect".', mood: 'happy' },
  { who: 'ravi', text: 'And watch the clock: roughly 3-10, 10-15, 10-25 and 3-5 minutes.', mood: 'neutral' },
  { who: 'maya', text: 'Mock interviews are over. Time for the real thing.', mood: 'happy' },
  { who: 'ravi', text: 'Interview Mode is now unlocked. Real prompts, a 45-minute clock, all four steps. Go show them.', mood: 'proud' },
];
