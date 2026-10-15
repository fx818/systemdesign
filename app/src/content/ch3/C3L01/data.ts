/** Shared literals for C3L01 (scene, quiz and mini-game). */
import { NEWS_FEED_QA } from '../framework';

/** Short requirement notes the candidate writes on the whiteboard (news feed example, p. 44). */
export const REQUIREMENT_NOTES: Record<string, string> = {
  platform: 'Web + mobile',
  features: 'Post + see friends’ feed',
  order: 'Reverse chronological',
  friends: 'Up to 5,000 friends',
  traffic: '10M DAU',
  media: 'Text, images, video',
};

export const QA = NEWS_FEED_QA;
