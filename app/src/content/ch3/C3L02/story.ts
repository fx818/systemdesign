import type { DialogueLine } from '@/types/content';

export const incident: DialogueLine[] = [
  { who: 'narrator', text: 'Mock interview #2. Ravi\'s living room. The whiteboard is suspiciously clean.' },
  { who: 'maya', text: 'News feed, 10 million DAU, web and mobile, posts with photos and videos. Scope agreed?', mood: 'neutral' },
  { who: 'player', text: 'Agreed! Okay... *stares at the whiteboard in total silence for four minutes*', mood: 'worried' },
  { who: 'pager', text: 'BZZT! Silence detected. Interviewer has no signal. Confidence dropping...', mood: 'panic' },
  { who: 'ravi', text: 'Don\'t think in silence. Sketch a blueprint, say what you\'re thinking, ask her opinion.', mood: 'neutral' },
  { who: 'maya', text: 'I\'m not your enemy. I\'m your future teammate. Use me.', mood: 'happy' },
  { who: 'ravi', text: 'Step 2: propose a high-level design and get buy-in. Boxes, arrows, a quick scale check.', mood: 'happy' },
];

export const missionBrief: DialogueLine[] = [
  { who: 'maya', text: 'Your blueprint goes live in the simulator. Feed traffic will climb to 2,500 requests per second.', mood: 'neutral' },
  { who: 'maya', text: 'Every post also creates fan-out jobs, up to 150 per second. And I might unplug a server, just to see.', mood: 'happy' },
  { who: 'ravi', text: 'Napkin math first: how many web servers for 2,500 rps if one handles about 1,000? Keep spare capacity.', mood: 'neutral' },
  { who: 'player', text: 'Load balancer, web tier, cache and database, and a queue with workers for the fan-out.', mood: 'proud' },
];

export const missionHints = [
  'Put a load balancer in front, wire both clients to it, and plan for 4 web servers: 2,500 rps needs 3, plus one spare for the crash.',
  'A single database can take about 800 rps. Without a cache in front of it, the feed reads will overwhelm it. Wire the web servers to a cache and to the database.',
  'Fan-out is slow work: send it to a message queue (wire every web server to it) and add workers. Each one drains about 50 jobs per second, so 150 jobs per second needs at least 3, better 4.',
];

export const debrief: DialogueLine[] = [
  { who: 'maya', text: 'You talked me through every box, and you changed the sketch when I pushed back. Buy-in granted.', mood: 'happy' },
  { who: 'ravi', text: 'Blueprint, feedback, box diagram, napkin math, use cases. That\'s step 2.', mood: 'proud' },
  { who: 'player', text: 'And the two flows: publishing writes the post and fans it out; building aggregates friends\' posts.', mood: 'happy' },
  { who: 'ravi', text: 'You\'ll need those flows next. Once the interviewer is happy, she picks where to dig.', mood: 'neutral' },
  { who: 'maya', text: 'Next round I won\'t be so nice. Tell me how fan-out handles a user with 5,000 friends.', mood: 'neutral' },
  { who: 'pager', text: 'bzzt... deep dive incoming.', mood: 'neutral' },
];
