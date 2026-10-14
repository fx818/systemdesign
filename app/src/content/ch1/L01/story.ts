import type { DialogueLine } from '@/types/content';

export const incident: DialogueLine[] = [
  { who: 'narrator', text: 'PixelPost HQ, a.k.a. Maya\'s kitchen table. 11:58 PM, the night before launch.' },
  { who: 'maya', text: 'Launch is at midnight! Our very first user is ready to sign up.', mood: 'happy' },
  { who: 'player', text: 'Uh, Maya... who is our first user?' },
  { who: 'maya', text: 'My mom. Be gentle, she rates everything on the App Store.', mood: 'proud' },
  { who: 'pager', text: 'BZZT! api.pixelpost.com: no server found. Your first user sees a blank page.', mood: 'panic' },
  { who: 'maya', text: 'A BLANK PAGE?! Mom will give us one star!', mood: 'panic' },
  { who: 'ravi', text: 'Deep breath. We have no server yet, so there is nothing to answer her.', mood: 'neutral' },
  { who: 'ravi', text: 'Let me show you what really happens when she types our address. Then we ship one box.', mood: 'happy' },
];

export const missionBrief: DialogueLine[] = [
  { who: 'ravi', text: 'Your mission: put PixelPost on the internet. One web server will do for now.' },
  { who: 'ravi', text: 'Drop a web server on the board, then connect the browser and the mobile app to it.' },
  { who: 'maya', text: 'Mom is online in 60 seconds. And she told her book club...', mood: 'worried' },
  { who: 'player', text: 'One server, coming right up.', mood: 'proud' },
];

export const debrief: DialogueLine[] = [
  { who: 'maya', text: 'Mom uploaded a photo of her cat! Five stars! FIVE!', mood: 'happy' },
  { who: 'ravi', text: 'You traced a whole request: DNS lookup, IP address, HTTP request, HTML or JSON back.', mood: 'proud' },
  { who: 'player', text: 'And one box runs everything: web app, database, cache.', mood: 'happy' },
  { who: 'ravi', text: 'Right. Simple, cheap and perfect for day one.', mood: 'neutral' },
  { who: 'ravi', text: 'But all of it sharing one CPU will not last.', mood: 'worried' },
  { who: 'pager', text: 'bzzt... I\'ll be back.', mood: 'neutral' },
  { who: 'maya', text: 'Her book club has 1,000 members. They all want accounts. Tomorrow.', mood: 'proud' },
];
