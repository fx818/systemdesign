import { test as base, expect, type Page } from '@playwright/test';

// Every page, including the walkthrough and render route, fails on console/runtime errors.
const test = base.extend<{ checkedPage: Page }>({
  checkedPage: async ({ page }, runFixture) => {
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    await runFixture(page);
    expect(errors, 'Browser console and runtime errors').toEqual([]);
  },
});

async function seedCompletedChapter(page: Page) {
  // Only route-matrix tests seed unlocks. The complete L01 walkthrough starts fresh.
  await page.addInitScript(() => {
    localStorage.setItem('sdq:game', JSON.stringify({ version: 1, state: {
      xp: 1000,
      progress: Object.fromEntries(Array.from({ length: 13 }, (_, i) => [`L${String(i + 1).padStart(2, '0')}`, { stars: 1, bestQuiz: 1, completedSteps: [] }])),
    } }));
  });
}
async function persisted(page: Page) {
  return page.evaluate(() => JSON.parse(localStorage.getItem('sdq:game') ?? '{}').state as {
    xp: number;
    progress: Record<string, { stars: number; completedSteps: string[] }>;
    badges: Record<string, number>;
    missionResults: Record<string, { goalsMet: boolean }>;
  });
}
async function checkAndContinue(page: Page) {
  await page.getByTestId('submit').click();
  await expect(page.getByText('Correct!', { exact: true })).toBeVisible();
  await page.getByTestId('continue').click();
}
async function sortFlow(page: Page) {
  const steps = [
    'The user types api.pixelpost.com and DNS is asked to resolve it',
    'DNS returns the IP address (15.125.23.214)',
    'The browser sends an HTTP request directly to the web server',
    'The web server responds with HTML or JSON',
  ];
  // Wait for dnd-kit's accessible announcements so each browser measurement
  // has settled before the next lift/move/drop (one position per drag).
  const announcement = page.locator('[id^="DndLiveRegion-"]');
  for (let desired = 0; desired < steps.length; desired++) {
    const row = page.getByRole('button', { name: steps[desired], exact: true });
    let current = Number((await row.getAttribute('data-testid'))!.replace('order-row-', ''));
    while (current > desired) {
      await row.focus();
      await page.keyboard.press('Space');
      await expect(announcement).toContainText(/Picked up draggable item|was moved over droppable area/);
      await page.evaluate(() => new Promise<number>(resolve => requestAnimationFrame(resolve)));
      const aboveText = await page.getByTestId(`order-row-${current - 1}`).textContent();
      const aboveId = steps.findIndex(text => aboveText?.includes(text));
      await page.keyboard.press('ArrowUp');
      await expect(announcement).toContainText(`was moved over droppable area item-${aboveId}.`);
      await page.keyboard.press('Space');
      await expect(announcement).toContainText('was dropped over droppable area');
      current--;
      await expect(page.getByTestId(`order-row-${current}`)).toContainText(steps[desired]);
    }
  }
}

async function answerL01Interview(page: Page) {
  await page.getByRole('button', { name: /A paid third-party DNS provider/ }).click();
  await checkAndContinue(page);
  await sortFlow(page); await checkAndContinue(page);
  await page.getByTestId('option-false').click(); await checkAndContinue(page);
  for (let i = 0; i < 6; i++) {
    await page.getByTestId(`chip-${i}`).click();
    const bin = page.getByTestId(`bin-${i < 3 ? 0 : 1}`);
    await bin.click({ position: { x: 8, y: 8 } });
    await expect(bin.getByTestId(`chip-${i}`)).toBeVisible();
  }
  await checkAndContinue(page);
  await page.getByRole('button', { name: 'Web app + DB + cache node', exact: true }).click();
  await checkAndContinue(page);
  for (const i of [0, 1, 2]) await page.getByTestId(`option-${i}`).click();
  await checkAndContinue(page);
  await page.getByRole('button', { name: /The user object with id 12, typically as JSON/ }).click();
  await checkAndContinue(page);
  for (const [label, node] of [['Web browser', 'Web browser'], ['Mobile app', 'Mobile app'], ['DNS', 'DNS'], ['Single server', 'Web app + DB + cache']]) {
    await page.getByTestId(`label-chip-${label}`).click();
    await page.getByRole('button', { name: `${node} node`, exact: true }).click();
  }
  await checkAndContinue(page);
  await expect(page.getByTestId('end-score')).toHaveText('8/8');
}

test('fresh player completes L01 from incident to earned XP, badge and L02 unlock', async ({ checkedPage: page }) => {
  test.setTimeout(120_000);
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Architecture map' })).toBeVisible();
  await page.getByRole('button', { name: /Hello, World/ }).click();
  await expect(page).toHaveURL(/\/level\/L01$/);
  await page.getByRole('button', { name: /^Incident/ }).click();
  await page.getByRole('button', { name: 'Reveal', exact: true }).click();
  await page.getByRole('button', { name: 'Next', exact: true }).click();
  await page.getByRole('button', { name: 'Skip', exact: true }).click();
  await expect(page).toHaveURL(/\/level\/L01\/lesson$/);

  await page.getByRole('button', { name: 'Pause', exact: true }).click();
  const seek = page.getByRole('slider', { name: 'Seek' });
  // Native range input keyboard support scrubs through the real React onChange.
  await seek.focus(); await page.keyboard.press('Home');
  for (let i = 0; i < 5; i++) await page.keyboard.press('ArrowRight');
  await expect(seek).toHaveValue('0.5');
  // Deep-link/export clock is a public player API; seek immediately before the checkpoint.
  await page.evaluate(() => window.__setLessonTime!(60.9));
  await page.getByRole('button', { name: 'Play', exact: true }).click();
  await expect(page.getByText('Ravi checks in')).toBeVisible();
  await page.getByRole('button', { name: /The IP address of the server/ }).click();
  await checkAndContinue(page);
  await page.getByRole('button', { name: 'Pause', exact: true }).click();
  // Verify chapter/hotspot and captions render from the authored scene.
  await page.getByRole('button', { name: 'Chapters', exact: true }).click();
  await page.locator('aside').getByRole('button', { name: /Ask the phone book/ }).click();
  await page.evaluate(() => window.__setLessonTime!(40));
  await expect(page.getByText('DNS is usually a paid service run by a third party, not hosted on our server.', { exact: true })).toBeVisible();
  await expect(page.locator('[data-hotspot="dns"]')).toBeVisible();
  await page.locator('[data-hotspot="dns"]').click();
  await expect(page.getByRole('heading', { name: 'Domain Name System' })).toBeVisible();
  await page.getByRole('button', { name: 'Close hotspot' }).click();
  await page.evaluate(() => window.__setLessonTime!(179.9));
  await page.getByRole('button', { name: 'Play', exact: true }).click();
  await expect.poll(async () => (await persisted(page)).progress.L01.completedSteps).toContain('lesson');
  await page.getByRole('button', { name: 'Continue to the lab' }).click();

  await expect(page.getByTestId('sim-runner')).toBeVisible();
  await page.getByRole('button', { name: 'Pause simulation' }).click();
  await page.getByRole('button', { name: 'Inject a failure' }).click();
  await page.getByRole('button', { name: /Kill Single server/ }).click();
  await expect(page.getByRole('button', { name: /Revive Single server/ })).toBeVisible();
  await page.getByRole('button', { name: /Revive Single server/ }).click();
  await page.getByRole('checkbox', { name: /Watch requests flow/ }).check();
  await page.getByRole('button', { name: 'Mark explored & back' }).click();
  await page.getByRole('button', { name: /^Mini-game/ }).click();
  await page.getByRole('button', { name: 'Start', exact: true }).click();
  for (let round = 0; round < 3; round++) {
    const client = round === 1 ? 'Mobile app' : 'Web browser';
    for (const name of ['DNS', client, 'Web server', client]) {
      await page.getByRole('button', { name, exact: true }).click();
      // Wait for the packet's authored 700ms journey, not a mocked finish callback.
      await page.waitForTimeout(780);
    }
    await expect(page.getByRole('heading', { name: 'Delivered!' })).toBeVisible();
    await page.getByRole('button', { name: round < 2 ? 'Next round' : 'See results', exact: true }).click();
  }
  await page.getByRole('button', { name: 'Finish', exact: true }).click();
  await page.getByRole('button', { name: 'Back to mission', exact: true }).click();
  await page.getByRole('button', { name: /^Mission/ }).click();
  await page.getByRole('button', { name: 'Skip', exact: true }).click();
  await page.getByRole('button', { name: 'Add Web server', exact: true }).click();
  const architecture = page.getByRole('group', { name: 'System architecture', exact: true });
  // Placement selects the new server. Cancel, then wire each client to it.
  await page.getByRole('button', { name: 'Cancel', exact: true }).click();
  for (const user of ['Web browser', 'Mobile app']) {
    await architecture.getByRole('button', { name: new RegExp(`^${user},`) }).press('Enter');
    await architecture.getByRole('button', { name: /^Web server 1,/ }).press('Enter');
  }
  await page.getByRole('button', { name: 'Go live', exact: true }).click();
  await page.getByRole('button', { name: '4×', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'PixelPost survived the launch!' })).toBeVisible({ timeout: 30_000 });
  await page.getByRole('button', { name: 'Claim reward & continue' }).click();
  await expect.poll(async () => (await persisted(page)).missionResults.L01.goalsMet).toBe(true);
  await page.getByRole('button', { name: 'Interview round', exact: true }).click();

  await answerL01Interview(page);
  await page.getByTestId('finish').click();
  await page.getByRole('button', { name: 'Continue to debrief' }).click();
  await page.getByRole('button', { name: 'Skip', exact: true }).click();
  await expect(page.getByRole('dialog')).toContainText('Badge unlocked');
  await page.getByRole('button', { name: 'Nice', exact: true }).click();
  await expect(page.getByText('Mission complete', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Next level: Split the Tiers' })).toBeVisible();
  const state = await persisted(page);
  expect(state.xp).toBeGreaterThan(300);
  expect(state.progress.L01.stars).toBe(3);
  expect(state.badges['first-request']).toBeGreaterThan(0);
  await page.reload();
  await expect(page.getByRole('button', { name: 'Next level: Split the Tiers' })).toBeVisible();
  expect((await persisted(page)).xp).toBe(state.xp);
});

for (let i = 1; i <= 13; i++) {
  const id = `L${String(i).padStart(2, '0')}`;
  test(`${id} hub, lesson, lab, mission and quiz load with real modules and no browser errors`, async ({ checkedPage: page }) => {
    await seedCompletedChapter(page);
    for (const route of ['', '/lesson', '/lab', '/mission', '/quiz']) {
      await page.goto(`/level/${id}${route}`);
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      await expect(page.getByText('Level locked', { exact: true })).toHaveCount(0);
      if (route === '/lab') await expect(page.getByTestId('sim-runner')).toBeVisible();
      if (route === '/mission') {
        await page.getByRole('button', { name: 'Skip', exact: true }).click();
        await expect(page.getByTestId('sim-runner')).toBeVisible();
        await expect(page.getByRole('button', { name: 'Go live' })).toBeVisible();
      }
      if (route === '/lesson') {
        await expect(page.getByRole('slider', { name: 'Seek' })).toBeVisible();
        await expect(page.locator('main svg').first()).toBeVisible();
      }
      if (route === '/quiz') await expect(page.getByTestId('question-prompt')).toBeVisible();
    }
  });
}

test('direct links enforce next-level and boss prerequisites', async ({ checkedPage: page }) => {
  for (const route of ['/level/L02/mission', '/level/L13/quiz']) {
    await page.goto(route);
    await expect(page.getByText('Level locked', { exact: true })).toBeVisible();
    await expect(page.getByTestId('sim-runner')).toHaveCount(0);
  }
});

test('video render is fixed size, deterministic and noninteractive', async ({ checkedPage: page }) => {
  await page.goto('/render/L13?t=80&capture=1');
  await expect(page.getByRole('navigation')).toHaveCount(0);
  const scene = page.locator('svg').first();
  await expect(scene).toBeVisible();
  const box = await scene.boundingBox();
  expect(box?.width).toBe(1280); expect(box?.height).toBe(720);
  const first = await scene.innerHTML();
  await page.evaluate(() => window.__setLessonTime!(80));
  await expect(scene).toHaveJSProperty('innerHTML', first);
  await expect(page.locator('[data-hotspot]')).toHaveCount(0);
});

test('mobile lab and lesson remain usable without page overflow', async ({ checkedPage: page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/level/L01/lab');
  await expect(page.getByTestId('sim-runner')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  await page.getByRole('button', { name: 'Pause simulation' }).click();
  await page.goto('/level/L01/lesson');
  await expect(page.getByRole('slider', { name: 'Seek' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
});


test('L01 interview supports every authored question kind in Chrome', async ({ checkedPage: page }) => {
  await page.goto('/level/L01/quiz');
  await answerL01Interview(page);
});

test('boss lab can place and name regions and fail a populated region', async ({ checkedPage: page }) => {
  await seedCompletedChapter(page);
  await page.goto('/level/L13/lab');
  await page.getByRole('button', { name: 'Pause simulation' }).click();
  await page.getByRole('button', { name: 'Add Data center', exact: true }).click();
  await page.getByRole('textbox', { name: 'Region name' }).fill('US-West');
  await page.getByRole('button', { name: 'Add Web server', exact: true }).click();
  await page.getByRole('button', { name: 'Cancel', exact: true }).click();
  const architecture = page.getByRole('group', { name: 'System architecture', exact: true });
  await architecture.getByRole('button', { name: /^US-West,/ }).press('Enter');
  await architecture.getByRole('button', { name: /^Web server 2,/ }).press('Enter');
  await page.getByRole('button', { name: 'Inject a failure' }).click();
  await page.getByRole('button', { name: /Kill US-West/ }).click();
  await expect(architecture.getByRole('button', { name: /^US-West, down/ })).toBeVisible();
  await expect(architecture.getByRole('button', { name: /^Web server 2, down/ })).toBeVisible();
});
