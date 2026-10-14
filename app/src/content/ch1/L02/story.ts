import type { DialogueLine } from '@/types/content';

export const incident: DialogueLine[] = [
  { who: 'pager', text: 'BZZT! BZZT! p95 latency 4.2 seconds. CPU 100%. BZZZZT!', mood: 'panic' },
  { who: 'maya', text: "Mom's book club joined. All 1,000 of them. And they upload a LOT of cat photos.", mood: 'worried' },
  { who: 'player', text: 'The server is pinned. Is it the web app or the database?', mood: 'worried' },
  { who: 'ravi', text: 'Both. They live on the same box, so every busy moment of one starves the other.', mood: 'neutral' },
  { who: 'maya', text: 'Can we just... buy a bigger box?', mood: 'worried' },
  { who: 'ravi', text: "Later, maybe. First, give each job its own home: a web tier and a data tier.", mood: 'happy' },
  { who: 'ravi', text: 'And while we move the database, let\'s pick the right kind of database too.', mood: 'neutral' },
  { who: 'pager', text: 'bzzt. You have until the book club\'s next meeting.', mood: 'neutral' },
];

export const missionBrief: DialogueLine[] = [
  { who: 'ravi', text: 'Mission: move the database off the web server and onto its own machine.' },
  { who: 'ravi', text: 'Place a database, connect the web server to it, and keep latency low while the book club piles in.' },
  { who: 'maya', text: 'Traffic will triple tonight. I may have posted about us on the neighbourhood forum.', mood: 'worried' },
  { who: 'player', text: 'Two tiers, coming up.', mood: 'proud' },
];

export const debrief: DialogueLine[] = [
  { who: 'maya', text: 'Pages load instantly again! The book club calls you "the wizard".', mood: 'happy' },
  { who: 'ravi', text: 'Web tier for traffic, data tier for data. Now each one scales on its own.', mood: 'proud' },
  { who: 'player', text: 'And relational is the default, unless we need super-low latency, unstructured data, plain serialization, or massive scale.', mood: 'happy' },
  { who: 'ravi', text: 'Exactly. Most teams pick relational, and for good reason.', mood: 'happy' },
  { who: 'pager', text: 'BZZT... I mean, all quiet. For now.', mood: 'neutral' },
  { who: 'maya', text: 'Uh, a local TV station wants to do a story on us. That is fine, right?', mood: 'worried' },
  { who: 'ravi', text: 'Ten thousand users? Then we need to talk about scaling up versus scaling out.', mood: 'neutral' },
];
