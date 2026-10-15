import { test as base, expect, type Page } from '@playwright/test';

const test = base.extend<{ checkedPage: Page }>({
  checkedPage: async ({ page }, runFixture) => {
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    await runFixture(page);
    expect(errors, 'Browser console/runtime errors').toEqual([]);
  },
});

test('PWA serves correctly sized icons and reopens a lesson offline', async ({ checkedPage: page, context }) => {
  await page.goto('/');
  const manifestResponse = await page.request.get('/manifest.webmanifest');
  expect(manifestResponse.ok()).toBe(true);
  const manifest = await manifestResponse.json() as {
    display: string; start_url: string;
    icons: { src: string; sizes: string; purpose: string }[];
  };
  expect(manifest.display).toBe('standalone');
  expect(manifest.start_url).toBe('/');
  expect(manifest.icons.some(icon => icon.purpose === 'maskable')).toBe(true);
  for (const icon of manifest.icons) {
    const response = await page.request.get(icon.src);
    expect(response.ok()).toBe(true);
    const png = await response.body();
    expect(png.subarray(1, 4).toString()).toBe('PNG');
    expect(`${png.readUInt32BE(16)}x${png.readUInt32BE(20)}`).toBe(icon.sizes);
  }
  await page.evaluate(async () => { await navigator.serviceWorker.ready; });
  await page.reload();
  await expect.poll(() => page.evaluate(() => navigator.serviceWorker.controller !== null)).toBe(true);
  await context.setOffline(true);
  try {
    await page.goto('/level/L01/lesson');
    await expect(page.getByRole('slider', { name: 'Seek' })).toBeVisible();
    await expect(page.locator('main svg').first()).toBeVisible();
    await page.goto('/sandbox');
    await expect(page.getByRole('heading', { name: 'Sandbox', exact: true })).toBeVisible();
    await expect(page.getByRole('group', { name: 'System architecture', exact: true })).toBeVisible();
  } finally {
    await context.setOffline(false);
  }
});

test('Videos groups all chapters and handles missing, malformed and available downloads', async ({ checkedPage: page }) => {
  // Some SPA hosts return HTML rather than a 404 for an absent manifest.
  await page.route('**/videos/manifest.json', route => route.fulfill({ contentType: 'text/html', body: '<html>SPA fallback</html>' }));
  await page.goto('/videos');
  await expect(page.locator('[data-video-level]')).toHaveCount(21);
  for (const chapter of [1, 2, 3]) await expect(page.locator(`#video-chapter-${chapter}`)).toBeVisible();
  await expect(page.getByRole('link', { name: 'Download MP4' })).toHaveCount(0);
  await page.route('**/videos/manifest.json', route => route.fulfill({ json: [{ id: 'broken' }] }));
  await page.reload();
  await expect(page.getByRole('status').filter({ hasText: 'Downloads could not be loaded.' })).toBeVisible();
  await page.route('**/videos/manifest.json', route => route.fulfill({ json: [{
    id: 'C2L04', title: 'Napkin Math', file: 'C2L04.mp4', poster: 'C2L04.jpg',
    duration: 176, sizeBytes: 1_000_000, renderedAt: '2026-10-15T00:00:00Z',
  }] }));
  await page.route('**/videos/C2L04.jpg', route => route.fulfill({ path: 'public/icons/icon-192.png', contentType: 'image/png' }));
  await page.reload();
  const lesson = page.locator('[data-video-level="C2L04"]');
  await expect(lesson.locator('video')).toHaveAttribute('src', '/videos/C2L04.mp4');
  await expect(lesson.getByRole('link', { name: 'Download MP4' })).toHaveAttribute('download', 'C2L04.mp4');
});
