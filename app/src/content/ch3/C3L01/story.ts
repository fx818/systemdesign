import type { DialogueLine } from '@/types/content';

export const incident: DialogueLine[] = [
  { who: 'narrator', text: 'PixelPost survived launch night. A few months later, an email lands from a very big tech company.' },
  { who: 'pager', text: 'BZZT! Calendar invite: on-site interview in 7 days. Session 4: SYSTEM DESIGN.', mood: 'panic' },
  { who: 'player', text: 'I scaled PixelPost to 10 million users... but in 45 minutes, on a whiteboard, with a stranger watching?', mood: 'worried' },
  { who: 'ravi', text: 'I have run hundreds of these interviews. I\'ll coach you. We use a simple 4-step framework.', mood: 'happy' },
  { who: 'maya', text: 'And I\'ll play the interviewer. The vague kind. You will hate me a little.', mood: 'happy' },
  { who: 'maya', text: 'Ready? "Design a news feed." Go.', mood: 'neutral' },
  { who: 'player', text: 'Easy! Kafka, a sharded database, an ML ranker, ten caches...', mood: 'proud' },
  { who: 'ravi', text: 'Stop. You just designed a system for requirements nobody gave you. Step 1: ask before you build.', mood: 'worried' },
];

export const missionBrief: DialogueLine[] = [
  { who: 'maya', text: 'Mock round. Prompt: a photo-sharing app for our design-club pilot.', mood: 'neutral' },
  { who: 'player', text: 'Which platforms? What peak traffic? Where does the data live?', mood: 'neutral' },
  { who: 'maya', text: 'Web and mobile. Peak around 600 requests per second. Keep the data in its own database.', mood: 'happy' },
  { who: 'ravi', text: 'Build exactly that. Every unrequested box costs credits, and over-engineering is a red flag.', mood: 'neutral' },
];

export const missionHints = [
  'Requirement 1: web AND mobile. Wire both the browser and the mobile app to your web server.',
  'Requirement 3: data in its own database. A web server that also hosts the data only gets half its capacity, and 600 rps needs more than that.',
  'One web server plus one database meets the requirements. A load balancer, CDN or queue was never asked for, and the budget will not cover it.',
];

export const debrief: DialogueLine[] = [
  { who: 'maya', text: 'Hmm. You asked before you built. I\'m annoyed I couldn\'t trip you up.', mood: 'happy' },
  { who: 'ravi', text: 'Features, users, growth, tech stack. Write the answers down, and your assumptions too.', mood: 'proud' },
  { who: 'player', text: 'And no Kafka unless someone actually needs Kafka.', mood: 'happy' },
  { who: 'ravi', text: 'Exactly. Over-engineering is a red flag, and so is stubbornness. Stay curious, stay flexible.', mood: 'neutral' },
  { who: 'maya', text: 'Next round I\'ll want to SEE the design. Boxes, arrows, the works.', mood: 'neutral' },
  { who: 'ravi', text: 'Step 2: the blueprint. Bring a marker.', mood: 'happy' },
];
