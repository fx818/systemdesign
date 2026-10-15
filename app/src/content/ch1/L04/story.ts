import type { DialogueLine } from '@/types/content';

export const incident: DialogueLine[] = [
  { who: 'maya', text: 'National TV! We were on NATIONAL TV! The host held up her phone and said "PixelPost"!', mood: 'happy' },
  { who: 'pager', text: 'BZZZZT! 50,000 users. web-1 at 140%. Requests timing out. BZZZZZT!', mood: 'panic' },
  { who: 'player', text: 'We have two servers now, but everyone is hitting web-1. web-2 is just... sitting there.', mood: 'worried' },
  { who: 'ravi', text: 'Because DNS hands everyone web-1\'s IP. Users talk to it directly, so web-2 never gets a request.', mood: 'neutral' },
  { who: 'maya', text: 'Can we tell half the users to use the other server? Like, by email?', mood: 'worried' },
  { who: 'ravi', text: 'Ha. No. We put a traffic cop in front of the servers and let it decide: a load balancer.', mood: 'happy' },
  { who: 'pager', text: 'bzzt. web-1 is making a noise I do not like.', mood: 'panic' },
];

export const missionBrief: DialogueLine[] = [
  { who: 'ravi', text: 'Mission: hold 99.9% uptime through the launch surge.' },
  { who: 'ravi', text: 'Put a load balancer in front, give it a pool of web servers, and point the clients at the load balancer.' },
  { who: 'pager', text: 'Psst. Something in that pool is going to die around the 40-second mark. Just saying.', mood: 'neutral' },
  { who: 'player', text: 'Then the pool had better have a spare.', mood: 'proud' },
];

export const debrief: DialogueLine[] = [
  { who: 'maya', text: 'A server literally died during the surge and nobody noticed. Is that... normal now?', mood: 'happy' },
  { who: 'ravi', text: 'That is failover. The load balancer stopped sending traffic to the dead server and the others took over.', mood: 'proud' },
  { who: 'player', text: 'And users only see the load balancer\'s public IP. The web servers hide behind private IPs.', mood: 'happy' },
  { who: 'ravi', text: 'Better security, and when traffic grows we just add servers to the pool.', mood: 'happy' },
  { who: 'pager', text: 'BZZT? ...no? Fine. I will find another weak spot.', mood: 'neutral' },
  { who: 'ravi', text: 'It will. The web tier looks good, but we still have exactly one database.', mood: 'worried' },
  { who: 'maya', text: 'One database holding ALL our photos? Please tell me there is a plan for that.', mood: 'worried' },
];
