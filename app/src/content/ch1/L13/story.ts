import type { DialogueLine } from '@/types/content';

export const incident: DialogueLine[] = [
  { who: 'maya', text: 'Okay, everyone sit down. Our ad airs during the Super Bowl. Tonight.', mood: 'happy' },
  { who: 'player', text: 'The Super Bowl. As in a hundred million people watching?', mood: 'worried' },
  { who: 'maya', text: 'Marketing says ten million of them will download PixelPost before halftime.', mood: 'proud' },
  { who: 'pager', text: 'bzzt... bzzt... I have been waiting for this night my whole life.', mood: 'happy' },
  { who: 'ravi', text: "Here is the twist: we rebuild from a blank canvas. A fresh region, no shortcuts.", mood: 'neutral' },
  { who: 'ravi', text: 'Load balancers, replicas, caches, CDN, sessions, data centers, queues, shards, monitoring. Everything you learned. One shot.', mood: 'neutral' },
  { who: 'player', text: 'No pressure, then.', mood: 'worried' },
  { who: 'ravi', text: 'All the pressure. But you have done every piece of this before.', mood: 'proud' },
  { who: 'pager', text: 'Kickoff in three hours. BZZZZT!', mood: 'panic' },
];

export const missionBrief: DialogueLine[] = [
  { who: 'ravi', text: 'Boss mission: build PixelPost from an empty canvas, within budget.' },
  { who: 'ravi', text: 'Then survive the night: a traffic spike, a web crash, a cache crash, the master DB dying, a whole US-West outage, a celebrity post and a photo-filter burst.' },
  { who: 'maya', text: 'And please, no outage on live TV.', mood: 'worried' },
  { who: 'pager', text: 'I have prepared seven surprises. You will love them. bzzt.', mood: 'happy' },
  { who: 'player', text: 'Redundancy at every tier. Let\'s go.', mood: 'proud' },
];

export const debrief: DialogueLine[] = [
  { who: 'maya', text: 'TEN MILLION USERS. We were trending above the halftime show!', mood: 'happy' },
  { who: 'pager', text: 'bzzt... seven surprises... and you shrugged off every one...', mood: 'worried' },
  { who: 'player', text: 'Stateless web tier, redundancy everywhere, caches, CDN, two data centers, shards, queues and dashboards.', mood: 'proud' },
  { who: 'ravi', text: 'That is the whole chapter, in one system. And remember: scaling is iterative. Next you will split it into even smaller services.', mood: 'proud' },
  { who: 'ravi', text: "Welcome to Principal Architect. I'm going to need a new job.", mood: 'happy' },
  { who: 'maya', text: 'Wait. A hundred million users next year. Ravi, start the interview mode.', mood: 'happy' },
  { who: 'pager', text: '...bzzt. Rematch. Some day.', mood: 'neutral' },
];
