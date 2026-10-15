import { readFileSync } from 'node:fs';
import { test, expect } from '@playwright/test';

test.use({ serviceWorkers: 'block' });

interface Chunk { file: string; imports?: string[]; isDynamicEntry?: boolean }
function builtCatalog() {
  const manifest = JSON.parse(readFileSync('dist/.vite/manifest.json', 'utf8')) as Record<string, Chunk>;
  const entries = Object.entries(manifest).filter(([key]) => /^src\/content\/ch\d+\/[^/]+\/index\.ts$/.test(key));
  return { manifest, entries, files: new Set(entries.map(([, chunk]) => `/${chunk.file}`)) };
}

test('catalog and practice screens load no full levels; hub preloads only its successor', async ({ page }) => {
  const { manifest, entries, files } = builtCatalog();
  expect(entries).toHaveLength(21);
  const initial = new Set<string>();
  function visit(key: string) {
    if (initial.has(key)) return;
    initial.add(key);
    for (const dependency of manifest[key].imports ?? []) visit(dependency);
  }
  visit('index.html');
  for (const [key, chunk] of entries) {
    expect(chunk.isDynamicEntry, key).toBe(true);
    expect(initial.has(key), `${key} in startup imports`).toBe(false);
  }
  const requested = new Set<string>();
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('request', request => {
    const path = new URL(request.url()).pathname;
    if (files.has(path)) requested.add(path);
  });
  for (const path of ['/', '/profile', '/review', '/videos', '/sandbox', '/level/L02/quiz']) {
    await page.goto(path);
    await expect(page.getByRole('navigation')).toBeVisible();
    if (path === '/videos') await expect(page.locator('[data-video-level]')).toHaveCount(21);
    if (path === '/sandbox') await expect(page.getByRole('heading', { name: 'Sandbox', exact: true })).toBeVisible();
    if (path === '/level/L02/quiz') await expect(page.getByText('Level locked', { exact: true })).toBeVisible();
    expect([...requested], path).toEqual([]);
  }
  await page.goto('/level/L01');
  await expect(page.getByRole('heading', { name: /Hello, World/ })).toBeVisible();
  const levelFile = (id: string) => `/${manifest[`src/content/ch1/${id}/index.ts`].file}`;
  await expect.poll(() => [...requested].sort()).toEqual([levelFile('L01'), levelFile('L02')].sort());
  await page.getByRole('button', { name: /Incident/ }).click();
  await expect(page.getByText('Incoming incident', { exact: true })).toBeVisible();
  expect([...requested].sort()).toEqual([levelFile('L01'), levelFile('L02')].sort());
  expect(errors).toEqual([]);
});

test('render capture control waits for the selected level download', async ({ page }) => {
  const { manifest } = builtCatalog();
  const chunk = manifest['src/content/ch3/C3L04/index.ts'].file;
  let release!: () => void;
  const ready = new Promise<void>(resolve => { release = resolve; });
  await page.route(`**/${chunk}`, async route => { await ready; await route.continue(); });
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/render/C3L04?capture=1&t=80&captions=1', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('status')).toContainText('Loading C3L04');
  expect(await page.evaluate(() => typeof window.__setLessonTime)).toBe('undefined');
  release();
  // Same readiness check as scripts/render/render.mjs.
  await page.waitForFunction(() => typeof window.__setLessonTime === 'function' && document.querySelector('svg'));
  await expect(page.getByTestId('render-caption')).toBeVisible();
  await page.evaluate(() => window.__setLessonTime!(60));
  await expect(page.locator('svg').first()).toBeVisible();
  expect(errors).toEqual([]);
});

test('a failed level download shows recovery UI', async ({ page }) => {
  const { manifest } = builtCatalog();
  const chunk = manifest['src/content/ch1/L01/index.ts'].file;
  await page.route(`**/${chunk}`, route => route.abort('internetdisconnected'));
  await page.goto('/level/L01/lesson');
  await expect(page.getByRole('alert')).toContainText('Level could not be loaded');
  await expect(page.getByRole('button', { name: 'Reload level' })).toBeVisible();
  await page.unroute(`**/${chunk}`);
  await page.getByRole('button', { name: 'Reload level' }).click();
  await expect(page.getByRole('slider', { name: 'Seek' })).toBeVisible();
});
