import type { DialogueLine } from '@/types/content';

export const incident: DialogueLine[] = [
  { who: 'narrator', text: 'Tuesday, 9:15 PM. Twenty minutes after server 3 joined the web tier.' },
  { who: 'maya', text: 'I\'ve been logged out four times while writing ONE caption. Is this a feature?', mood: 'worried' },
  { who: 'pager', text: 'BZZT! 2,318 "please log in again" pages in the last minute. Support inbox on fire. BZZT!', mood: 'panic' },
  { who: 'player', text: 'All servers are healthy, though. CPU is fine, latency is fine...', mood: 'worried' },
  { who: 'ravi', text: 'Where does a server keep the fact that Maya is logged in?', mood: 'neutral' },
  { who: 'player', text: 'In... its own memory. Oh. So when the load balancer sends her to server 3...', mood: 'worried' },
  { who: 'ravi', text: 'Server 3 has never heard of her. Your web tier is stateful. Each server remembers its own users.', mood: 'neutral' },
  { who: 'maya', text: 'Can\'t the servers just... share their notes?', mood: 'worried' },
  { who: 'ravi', text: 'That is exactly the fix. Let\'s move the state out of the web tier.', mood: 'happy' },
];

export const missionBrief: DialogueLine[] = [
  { who: 'ravi', text: 'Mission: zero logouts. Move sessions out of the web servers into a shared store.' },
  { who: 'ravi', text: 'Then survive tonight\'s traffic wave and a server crash. Any server must be able to serve any user.' },
  { who: 'maya', text: 'Influencer livestream at 9. Traffic will spike, then crash back down after she logs off.', mood: 'worried' },
  { who: 'pager', text: 'bzzt. And I may unplug a web server for fun. Mid-stream.', mood: 'neutral' },
  { who: 'player', text: 'Stateless servers, shared sessions, scale on demand. Let\'s go.', mood: 'proud' },
];

export const debrief: DialogueLine[] = [
  { who: 'maya', text: 'Not one logout all night. I wrote a caption with FOUR hashtags in peace.', mood: 'happy' },
  { who: 'ravi', text: 'Sessions live in a shared NoSQL store now. The web servers forgot everything, and that is the point.', mood: 'proud' },
  { who: 'player', text: 'No sticky sessions to babysit. Any server can take any request, so killing one doesn\'t log anybody out.', mood: 'happy' },
  { who: 'ravi', text: 'And because servers are interchangeable, autoscaling can add and remove them with the traffic.', mood: 'neutral' },
  { who: 'maya', text: 'The cloud bill shrank at 3 AM by itself. I love autoscaling. I want to marry autoscaling.', mood: 'happy' },
  { who: 'pager', text: 'bzzt... Congrats on one million users. Shame they\'re all over the planet now.', mood: 'neutral' },
  { who: 'ravi', text: 'The Pager has a point. One data center will not be enough for long.', mood: 'worried' },
];
