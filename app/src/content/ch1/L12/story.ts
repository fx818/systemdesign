import type { DialogueLine } from '@/types/content';

export const incident: DialogueLine[] = [
  { who: 'pager', text: 'bzzt. db-master disk 95%. bzzt. 96%. Want me to keep counting?', mood: 'worried' },
  { who: 'maya', text: '8 million users! Every one of them uploads, comments and likes. Every. Single. Day.', mood: 'happy' },
  { who: 'player', text: 'And all of it lands on one master database. Can we just buy a bigger one?', mood: 'worried' },
  { who: 'ravi', text: 'You can buy very big ones. Some cloud database servers have 24 terabytes of RAM.', mood: 'neutral' },
  { who: 'maya', text: 'Twenty-four TERA... how much does that cost?', mood: 'panic' },
  { who: 'ravi', text: 'A lot. And it is still one box with a hard limit, and still a single point of failure.', mood: 'neutral' },
  { who: 'ravi', text: 'Time to split the data itself. One database becomes many shards.', mood: 'happy' },
  { who: 'pager', text: 'bzzt. 97%.', mood: 'panic' },
];

export const missionBrief: DialogueLine[] = [
  { who: 'ravi', text: 'Mission: the data tier must survive both growth and a celebrity.' },
  { who: 'ravi', text: 'Add shards so no single database carries everything, and be ready when one famous account melts its shard.' },
  { who: 'maya', text: "Psst. I may have convinced a pop star to post her tour photos on PixelPost. Around t=50.", mood: 'happy' },
  { who: 'player', text: 'One celebrity, one shard on fire. Got it. I will be ready.', mood: 'proud' },
];

export const debrief: DialogueLine[] = [
  { who: 'maya', text: 'The pop star posted, 3 million fans liked it, and nothing caught fire!', mood: 'happy' },
  { who: 'player', text: 'user_id % N spreads people out evenly, and the hot account got a shard all to itself.', mood: 'proud' },
  { who: 'ravi', text: 'Just remember the bill: resharding means moving data, and joins across shards are hard, so we denormalize.', mood: 'neutral' },
  { who: 'ravi', text: 'Pick the sharding key carefully. It is the most important decision in the whole strategy.', mood: 'happy' },
  { who: 'pager', text: 'bzzt. Disk usage 31%. ...I am bored.', mood: 'neutral' },
  { who: 'maya', text: 'Good, because I just bought a Super Bowl ad. Ten million users. Tonight.', mood: 'happy' },
  { who: 'ravi', text: '(long pause) ...Then everything we learned gets tested at once.', mood: 'worried' },
];
