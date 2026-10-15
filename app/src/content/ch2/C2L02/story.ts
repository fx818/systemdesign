import type { DialogueLine } from '@/types/content';

export const incident: DialogueLine[] = [
  { who: 'pager', text: 'BZZT. Feed p95 in Europe: 900 ms. Feed p95 in California: 80 ms. Bzzt?', mood: 'worried' },
  { who: 'maya', text: 'An investor from Amsterdam opened the app during the call. She said, and I quote, "it loads like 2009".', mood: 'panic' },
  { who: 'player', text: 'Same code, same servers... why would it be ten times slower over there?', mood: 'worried' },
  { who: 'ravi', text: 'Because the servers are in California. Light takes time to cross an ocean, and every page makes several trips.', mood: 'neutral' },
  { who: 'ravi', text: 'And our database reads hit the disk on every feed load. Disk is slow too. Very slow.', mood: 'neutral' },
  { who: 'maya', text: 'How slow is "very slow"? I need a number, not an adjective.', mood: 'worried' },
  { who: 'ravi', text: 'Then let us learn the numbers every programmer should know.', mood: 'happy' },
];

export const missionBrief: DialogueLine[] = [
  { who: 'ravi', text: 'The feed reads hit the database disk every time. Goal: p95 under 40 ms while traffic climbs to 3,000 requests per second.' },
  { who: 'player', text: 'More database replicas would spread the load...', mood: 'neutral' },
  { who: 'ravi', text: 'Spread it, yes. But each read still pays the disk price. What is faster than disk?', mood: 'happy' },
  { who: 'pager', text: 'Hint: rhymes with "memory". Bzzt.', mood: 'happy' },
];

export const debrief: DialogueLine[] = [
  { who: 'maya', text: 'The Amsterdam investor says the feed is "instant now". What changed?', mood: 'happy' },
  { who: 'player', text: 'Most reads come from memory instead of disk. A memory reference is ~100 ns; a disk seek is ~10 ms.', mood: 'proud' },
  { who: 'ravi', text: 'A hundred thousand times apart. And we gzip photos and JSON before they cross the ocean.', mood: 'proud' },
  { who: 'ravi', text: 'The 150 ms round trip itself stays. Physics does not negotiate. Only fewer trips and fewer bytes help.', mood: 'neutral' },
  { who: 'maya', text: 'New investor question: "What uptime do you guarantee?" I said "a lot of nines". Was that okay?', mood: 'worried' },
  { who: 'pager', text: 'BZZT. Define "a lot". In minutes, please.', mood: 'happy' },
];
