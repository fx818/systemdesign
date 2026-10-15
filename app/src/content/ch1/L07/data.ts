/** Shared literals for Level 7 (CDN): keep scene, quiz and mini-games consistent. */

/** The book's sample CDN URLs (p. 18), adapted to PixelPost. */
export const CDN_URL = 'pixelpost.cloudfront.net/image.png';
export const AKAMAI_URL = 'pixelpost.akamai.com/image-manager/img/logo.jpg';

/** The 6-step CDN workflow (Figure 1-10, p. 18-19), in our own words. */
export const CDN_STEPS = [
  'User A requests image.png using a URL on the CDN provider\'s domain',
  'Cache miss: the CDN server fetches image.png from the origin (web server or S3)',
  'The origin returns image.png, with an optional TTL header saying how long to cache it',
  'The CDN caches image.png and returns it to User A',
  'User B requests the same image.png',
  'The CDN returns image.png from its cache, as long as the TTL has not expired',
] as const;

/** Short labels for the step rail. */
export const CDN_STEP_SHORT = ['1 · A asks', '2 · Miss → origin', '3 · Origin + TTL', '4 · Cache + reply', '5 · B asks', '6 · Hit!'] as const;

export type AssetVerdict = 'cdn' | 'origin';
export interface Asset {
  id: string;
  name: string;
  detail: string;
  /** Monthly CDN bill if it goes on the CDN (credits). */
  cost: number;
  /** Speed-up for users worldwide if it goes on the CDN (0..40). */
  benefit: number;
  answer: AssetVerdict;
  why: string;
}

/** Deck for the "CDN or Not?" mini-game. */
export const ASSETS: Asset[] = [
  {
    id: 'logo', name: 'PixelPost logo', detail: 'logo.svg · on every page', cost: 4, benefit: 30, answer: 'cdn',
    why: 'Static, tiny and requested on every single page view: the textbook CDN asset.',
  },
  {
    id: 'avatar', name: 'User avatars', detail: 'avatars/*.jpg · shown in every feed', cost: 8, benefit: 35, answer: 'cdn',
    why: 'Static images fetched constantly by users all over the world. Serving them from a nearby edge saves seconds.',
  },
  {
    id: 'video', name: '4K launch video', detail: 'launch-2026.mp4 · watched once, by the team', cost: 45, benefit: 0, answer: 'origin',
    why: 'Huge and almost never viewed. You pay the CDN for data transfer, and caching an infrequently used asset brings no real benefit.',
  },
  {
    id: 'css', name: 'CSS bundle', detail: 'app.3f9c.css · every page load', cost: 4, benefit: 30, answer: 'cdn',
    why: 'CSS and JavaScript bundles are static files every visitor needs: perfect for the CDN.',
  },
  {
    id: 'api', name: 'API JSON', detail: 'GET /feed · different for every user', cost: 20, benefit: 0, answer: 'origin',
    why: 'This is dynamic, per-user data. The book only uses the CDN for static content; dynamic content caching is out of scope.',
  },
  {
    id: 'pdf', name: '2015 press kit PDF', detail: 'press-2015.pdf · 2 downloads a year', cost: 15, benefit: 0, answer: 'origin',
    why: 'Rarely used. Keeping it on the CDN costs money without speeding anybody up, so leave it on the origin.',
  },
];
