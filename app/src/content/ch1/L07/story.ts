import type { DialogueLine } from '@/types/content';

export const incident: DialogueLine[] = [
  { who: 'narrator', text: 'PixelPost HQ, 7:02 AM. The office smells of cold brew and fresh growth charts.' },
  { who: 'maya', text: 'We hit the front page in London AND Mumbai overnight! 500,000 users by Friday!', mood: 'happy' },
  { who: 'pager', text: 'BZZT! Europe: image load time 6.1 s. Asia: 6.4 s. Users are bouncing. BZZT!', mood: 'panic' },
  { who: 'maya', text: 'Six seconds?! That\'s a whole coffee order! What happened to our cache?', mood: 'panic' },
  { who: 'player', text: 'The cache is fine. Every photo still travels from our one server in San Francisco.', mood: 'worried' },
  { who: 'ravi', text: 'Exactly. Your data is fast, but the speed of light is not on your side. London is 8,600 km away.', mood: 'neutral' },
  { who: 'ravi', text: 'If we can\'t move the users closer to the server, we move copies of the files closer to the users.', mood: 'happy' },
  { who: 'maya', text: 'Copies... everywhere? Is that expensive? Tell me it\'s not expensive.', mood: 'worried' },
  { who: 'ravi', text: 'Only if you do it carelessly. Let me show you a CDN.', mood: 'proud' },
];

export const missionBrief: DialogueLine[] = [
  { who: 'ravi', text: 'Mission: get global load times under the target by putting a CDN in front of PixelPost\'s static files.' },
  { who: 'ravi', text: 'Watch the credits: you pay the CDN for every byte in and out.' },
  { who: 'pager', text: 'bzzt... I hear your CDN vendor has a little wobble scheduled around the 50-second mark.', mood: 'neutral' },
  { who: 'maya', text: 'If the CDN dies, the site must NOT die with it. Investors are watching from Berlin.', mood: 'worried' },
  { who: 'player', text: 'Edges near the users, origin as the safety net. On it.', mood: 'proud' },
];

export const debrief: DialogueLine[] = [
  { who: 'maya', text: 'London: 0.4 seconds. Mumbai: 0.5. The Berlin investors sent a thumbs-up emoji!', mood: 'happy' },
  { who: 'ravi', text: 'Static files now come from the CDN edge closest to each user. Distance was the bottleneck.', mood: 'proud' },
  { who: 'player', text: 'And on a miss, the edge fetches from the origin once, caches it until the TTL runs out, and serves everyone else.', mood: 'happy' },
  { who: 'ravi', text: 'Plus a fallback to the origin when the CDN hiccups, and ?v=2 when you need a fresh copy right now.', mood: 'neutral' },
  { who: 'maya', text: 'And I deleted the 2015 press kit from the CDN. Saving money is my love language.', mood: 'proud' },
  { who: 'pager', text: 'bzzt... Enjoy it. Someone just added a third web server.', mood: 'neutral' },
  { who: 'ravi', text: 'Hm. If our servers still remember who is logged in, that could get interesting. Next level.', mood: 'worried' },
];
