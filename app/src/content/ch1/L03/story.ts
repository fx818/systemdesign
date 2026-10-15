import type { DialogueLine } from '@/types/content';

export const incident: DialogueLine[] = [
  { who: 'pager', text: 'BZZT! web-1 CPU 98%. Response time climbing. BZZZT!', mood: 'panic' },
  { who: 'maya', text: 'The local TV story aired. We just hit 10,000 users!', mood: 'happy' },
  { who: 'player', text: 'And our one web server is about to melt.', mood: 'worried' },
  { who: 'maya', text: "Easy. Just buy a bigger server! The biggest one. I'll put it on my card.", mood: 'happy' },
  { who: 'ravi', text: 'That works... for a while. Bigger boxes have a ceiling, and a bigger box still dies alone.', mood: 'neutral' },
  { who: 'player', text: 'So do we buy a bigger server, or more servers?', mood: 'neutral' },
  { who: 'ravi', text: 'Scale up or scale out. Let me show you both, and where each one hits a wall.', mood: 'happy' },
  { who: 'pager', text: 'bzzt. 99%. Tick tock.', mood: 'neutral' },
];

export const missionBrief: DialogueLine[] = [
  { who: 'ravi', text: 'Mission: PixelPost is back on TV tonight, prime time this time. Survive the spike.' },
  { who: 'ravi', text: 'You have one web server and a limited budget. Add capacity before the segment airs.' },
  { who: 'maya', text: 'The producer says the segment is "huge". I do not know what that means in requests per second.', mood: 'worried' },
  { who: 'player', text: 'Let me guess: more than one box can handle.', mood: 'neutral' },
];

export const debrief: DialogueLine[] = [
  { who: 'maya', text: 'We survived prime time! My mom saw us on TV AND the app worked.', mood: 'happy' },
  { who: 'ravi', text: 'Scale up is simple, so it is great while traffic is low. But it has a hard limit and no failover.', mood: 'proud' },
  { who: 'player', text: 'Scale out has no single ceiling, and one dead server does not take the whole site down.', mood: 'happy' },
  { who: 'ravi', text: 'Right. That is why large apps prefer horizontal scaling.', mood: 'happy' },
  { who: 'player', text: 'Although... users still connect straight to one server IP. If that one dies, they are stuck.', mood: 'worried' },
  { who: 'ravi', text: 'Good catch. We need a traffic cop in front of the servers. Next up: the load balancer.', mood: 'neutral' },
  { who: 'pager', text: 'BZZT... nothing. I hate it when you plan ahead.', mood: 'neutral' },
];
