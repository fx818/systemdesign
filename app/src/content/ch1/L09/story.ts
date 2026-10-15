import type { DialogueLine } from '@/types/content';

export const incident: DialogueLine[] = [
  { who: 'narrator', text: 'Thursday, 4:40 AM. A thunderstorm parks itself over the West Coast.' },
  { who: 'maya', text: 'Good news first: PixelPost is #1 in twelve countries and we just passed 1.5 million users!', mood: 'happy' },
  { who: 'pager', text: 'BZZT! Power failure at the US-West data center. Every PixelPost server is dark. BZZZZT!', mood: 'panic' },
  { who: 'maya', text: 'Every server?! That\'s ALL of PixelPost! Our whole company lives in one building?', mood: 'panic' },
  { who: 'player', text: 'Load balancer, replicas, cache... all redundant. But all in the same data center.', mood: 'worried' },
  { who: 'ravi', text: 'Redundancy inside one building doesn\'t help when the building goes dark.', mood: 'neutral' },
  { who: 'ravi', text: 'We need a second data center far away, and a DNS clever enough to send users to the right one.', mood: 'neutral' },
  { who: 'maya', text: 'The storm is supposed to last an hour. Can we be global by breakfast?', mood: 'worried' },
  { who: 'ravi', text: 'By breakfast, no. By the end of this lesson, yes.', mood: 'happy' },
];

export const missionBrief: DialogueLine[] = [
  { who: 'ravi', text: 'Mission: run PixelPost from two data centers, US-East and US-West, with geoDNS splitting traffic.' },
  { who: 'pager', text: 'bzzt. Forecast says the storm hits US-West again at the 40-second mark. Full outage.', mood: 'neutral' },
  { who: 'ravi', text: 'Keep uptime at 99.5% or better, and when users fail over to US-East, their photos had better be there.', mood: 'neutral' },
  { who: 'maya', text: 'No lost photos. Not one. My cousin posts her lunch every day, and she WILL notice.', mood: 'worried' },
  { who: 'player', text: 'Two data centers, geo-routing, replicated data. Let\'s weather the storm.', mood: 'proud' },
];

export const debrief: DialogueLine[] = [
  { who: 'maya', text: 'US-West went dark and nobody noticed. My cousin\'s lunch photo was right there. I\'ve never been so happy to see a sandwich.', mood: 'happy' },
  { who: 'ravi', text: 'GeoDNS sent everyone to the healthy data center, and replication made sure their data was waiting.', mood: 'proud' },
  { who: 'player', text: 'Three challenges to remember: traffic redirection, data synchronization, and testing and deploying in every location.', mood: 'happy' },
  { who: 'ravi', text: 'Automated deployment tools keep both data centers running exactly the same version. No snowflakes.', mood: 'neutral' },
  { who: 'maya', text: 'Two million users! And the photo filters launch next week. Crop, sharpen, blur!', mood: 'happy' },
  { who: 'pager', text: 'bzzt... filters? On the web servers? Oh, I am going to enjoy this.', mood: 'neutral' },
  { who: 'ravi', text: 'Then we need to decouple. Next level: message queues.', mood: 'worried' },
];
