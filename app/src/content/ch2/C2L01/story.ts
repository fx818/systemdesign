import type { DialogueLine } from '@/types/content';

export const incident: DialogueLine[] = [
  { who: 'maya', text: 'Ten million users! I am pitching our Series A to investors at 3 pm.', mood: 'happy' },
  { who: 'maya', text: 'One of them emailed a question: "How much storage do you need for the next five years?"', mood: 'worried' },
  { who: 'player', text: 'Uh... a lot? I could build a spreadsheet by tomorrow.', mood: 'worried' },
  { who: 'pager', text: 'BZZT. Tomorrow is not 3 pm. Bzzzt.', mood: 'happy' },
  { who: 'ravi', text: 'No spreadsheet. A good engineer answers on the back of a napkin, in five minutes.', mood: 'neutral' },
  { who: 'ravi', text: 'But napkin math only works if your units are solid. Bits, bytes, and powers of two.', mood: 'neutral' },
  { who: 'maya', text: 'Teach me fast. I have to say these numbers out loud without blinking.', mood: 'worried' },
];

export const missionBrief: DialogueLine[] = [
  { who: 'maya', text: 'My slide says we handle "2^12 requests per second at peak". The demo goes live during the pitch.', mood: 'worried' },
  { who: 'ravi', text: '2^10 is about 1,000, and each web server handles about 1,000 requests per second. So 2^12 is about...?' },
  { who: 'player', text: 'Four thousand. So four servers?', mood: 'neutral' },
  { who: 'ravi', text: 'Careful. 2^12 is exactly 4,096. Approximate for the estimate, then leave headroom for the real thing.', mood: 'happy' },
  { who: 'pager', text: 'Peak arrives at 35 seconds. I will be watching. Bzzt.', mood: 'happy' },
];

export const debrief: DialogueLine[] = [
  { who: 'maya', text: 'The investor asked "how much per day?" and I said "about 20 terabytes" before she finished the sentence!', mood: 'happy' },
  { who: 'ravi', text: 'Because you knew the ladder: byte, KB, MB, GB, TB, PB. Each rung about a thousand.', mood: 'proud' },
  { who: 'player', text: '2^10 is roughly 10^3. One ASCII character is one byte. A byte is eight bits.', mood: 'proud' },
  { who: 'ravi', text: 'And you labeled every unit. Half of all estimation mistakes are a missing "MB".', mood: 'neutral' },
  { who: 'maya', text: 'Next question from them: "Why is the app fast in the US but slow in Europe?"', mood: 'worried' },
  { who: 'ravi', text: 'That one is about time, not size. Latency numbers. Grab a coffee.', mood: 'happy' },
];
