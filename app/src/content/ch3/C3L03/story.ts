import type { DialogueLine } from '@/types/content';

export const incident: DialogueLine[] = [
  { who: 'narrator', text: 'Mock interview #3. Minute 24. The blueprint is on the board and Maya is nodding.' },
  { who: 'maya', text: 'Good. Now go deeper. Pick something.', mood: 'neutral' },
  { who: 'player', text: 'Let me explain EdgeRank! Affinity times weight times decay, and the decay function is...', mood: 'happy' },
  { who: 'pager', text: 'BZZT! Minute 39. Six minutes left. Feed publishing and retrieval: not discussed.', mood: 'panic' },
  { who: 'maya', text: 'That was... a lot of formula. I still don\'t know if your design survives a celebrity posting.', mood: 'worried' },
  { who: 'ravi', text: 'Step 3 is a deep dive, not a rabbit hole. Prioritize the components with the interviewer, then dig where it shows design skill.', mood: 'neutral' },
  { who: 'ravi', text: 'And watch the clock. It doesn\'t stop because you\'re having fun.', mood: 'happy' },
];

export const missionBrief: DialogueLine[] = [
  { who: 'maya', text: 'Here is your agreed blueprint, running live. I\'ll point at what bothers me. You fix exactly that.', mood: 'neutral' },
  { who: 'maya', text: 'First: feed retrieval. The post database is taking every feed read.', mood: 'worried' },
  { who: 'maya', text: 'Then: publishing. Wait until a user with 5,000 friends posts.', mood: 'neutral' },
  { who: 'ravi', text: 'Your budget only covers the deep dives that matter. Adding random boxes won\'t fix a bottleneck.', mood: 'neutral' },
];

export const missionHints = [
  'Retrieval deep dive: put a cache between the web servers and the post DB. Wire every web server to the cache, and the cache to the DB.',
  'Publishing deep dive: fan-out jobs jump to 180 per second at 40 s. Each worker drains ~50/s and you have 2. Add 2 more workers and wire the queue to them.',
  'More web servers will not help: the web tier is fine. Spend credits on the two bottlenecks Maya pointed at.',
];

export const debrief: DialogueLine[] = [
  { who: 'maya', text: 'A cache for retrieval, more fan-out workers for publishing. You fixed exactly what I pointed at.', mood: 'happy' },
  { who: 'ravi', text: 'Prioritize with the interviewer, dig into the critical components first, skip the trivia.', mood: 'proud' },
  { who: 'player', text: 'And no EdgeRank lectures. Signals, not minutiae.', mood: 'happy' },
  { who: 'ravi', text: 'The rough split: 3-10 minutes to clarify, 10-15 for the blueprint, 10-25 for the deep dive.', mood: 'neutral' },
  { who: 'maya', text: 'Which leaves a few minutes at the end. Don\'t waste those either.', mood: 'neutral' },
  { who: 'pager', text: 'bzzt... five minutes remaining.', mood: 'neutral' },
];
