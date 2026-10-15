import type { DialogueLine } from '@/types/content';

export const incident: DialogueLine[] = [
  { who: 'pager', text: 'BZZT. p95 latency 2.4 seconds. Database CPU 91%. Bzzzt.', mood: 'worried' },
  { who: 'maya', text: '300,000 users! But the reviews say "the feed takes forever to load". Ouch.', mood: 'worried' },
  { who: 'player', text: 'Every page load runs the same database queries again. The feed, the avatars, the like counts...', mood: 'worried' },
  { who: 'ravi', text: 'And 99% of the time the answer is exactly what it was a second ago.', mood: 'neutral' },
  { who: 'maya', text: 'So we keep asking the database questions it already answered? That sounds... wasteful.', mood: 'neutral' },
  { who: 'ravi', text: 'Very. Let us remember the answers in memory: a cache.', mood: 'happy' },
  { who: 'pager', text: 'bzzt. Memory is volatile, you know. Just like me.', mood: 'happy' },
];

export const missionBrief: DialogueLine[] = [
  { who: 'ravi', text: 'Mission: get p95 latency under 200 ms and take the pressure off the database.' },
  { who: 'ravi', text: 'Add a cache tier between the web servers and the database. Mind the budget.' },
  { who: 'pager', text: 'Oh, and a cache node might "accidentally" crash at 45 seconds.', mood: 'happy' },
  { who: 'player', text: 'One cache server would be a single point of failure. Noted.', mood: 'proud' },
];

export const debrief: DialogueLine[] = [
  { who: 'maya', text: 'The feed is instant! A reviewer called it "snappy". SNAPPY!', mood: 'happy' },
  { who: 'ravi', text: 'Read-through cache: check memory first, ask the database only on a miss.', mood: 'proud' },
  { who: 'player', text: 'And a sane TTL, a second cache server so it is not a single point of failure, and LRU eviction when memory fills up.', mood: 'happy' },
  { who: 'ravi', text: 'Plus: never keep important data only in the cache. Memory forgets on restart.', mood: 'neutral' },
  { who: 'maya', text: 'Bad news. Users in Europe say the photos themselves still load slowly.', mood: 'worried' },
  { who: 'ravi', text: 'That is distance, not the database. The images travel from our servers across the world.', mood: 'neutral' },
  { who: 'pager', text: 'BZZT. Bonjour from Paris. Still loading...', mood: 'happy' },
];
