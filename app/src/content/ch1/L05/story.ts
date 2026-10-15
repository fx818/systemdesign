import type { DialogueLine } from '@/types/content';

export const incident: DialogueLine[] = [
  { who: 'pager', text: 'BZZZZZT! db-1 not responding. 100% of requests failing. BZZZZZZT!', mood: 'panic' },
  { who: 'player', text: 'Both web servers are fine. The load balancer is fine. But every page needs the database.', mood: 'worried' },
  { who: 'maya', text: 'Wait. Is that the box with ALL the photos? Every cat, every wedding, every sunset?', mood: 'panic' },
  { who: 'ravi', text: 'It came back after a reboot. This time.', mood: 'worried' },
  { who: 'maya', text: '"This time"?! 100,000 people trust us with their photos and we have ONE copy?', mood: 'panic' },
  { who: 'ravi', text: 'We fixed the web tier with more servers. The data tier gets the same treatment: copies.', mood: 'neutral' },
  { who: 'ravi', text: 'It is called database replication. One master for writes, several replicas for reads.', mood: 'happy' },
  { who: 'pager', text: 'bzzt. I know where you keep your data now.', mood: 'neutral' },
];

export const missionBrief: DialogueLine[] = [
  { who: 'ravi', text: 'Mission: replicate the database and keep PixelPost answering through two database failures.' },
  { who: 'ravi', text: 'Add replicas, send reads to them, and keep writes on the master.' },
  { who: 'pager', text: 'At 30 seconds I am taking the master. At 60, a replica. Good luck.', mood: 'happy' },
  { who: 'player', text: 'Then I need a replica ready to be promoted, and one to spare.', mood: 'proud' },
];

export const debrief: DialogueLine[] = [
  { who: 'maya', text: 'The master died and... the app kept working? Did we lose anything?', mood: 'worried' },
  { who: 'ravi', text: 'A replica was promoted to master. Any writes it had not copied yet, recovery scripts patch up.', mood: 'proud' },
  { who: 'player', text: 'Writes go to the master, reads spread over replicas. Faster, safer, and always on.', mood: 'happy' },
  { who: 'maya', text: 'So even an earthquake would not wipe out our photos?', mood: 'happy' },
  { who: 'ravi', text: 'Not if the copies live in different places. That is the reliability win.', mood: 'happy' },
  { who: 'pager', text: 'BZZT. Fine. But have you seen how SLOW your feed is?', mood: 'neutral' },
  { who: 'ravi', text: 'It has a point. Every page load hits the database. Time to talk about caching.', mood: 'neutral' },
];
