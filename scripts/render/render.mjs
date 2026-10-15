#!/usr/bin/env node
import { spawn, spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { access, mkdir, readFile, rename, rm, stat, writeFile } from 'node:fs/promises';
import { createServer } from 'node:net';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';
import { setTimeout as delay } from 'node:timers/promises';
import { parseOptions, selectLevels, usage } from './options.mjs';

const root = fileURLToPath(new URL('../../', import.meta.url));
const app = resolve(root, 'app');
// Resolve the already-installed Playwright dependency from app/, not scripts/.
const require = createRequire(resolve(app, 'package.json'));
const clip = { x: 0, y: 0, width: 1280, height: 720 };
let browser;
let preview;
let encoder;
let interrupted = false;

async function stop(child) {
  if (!child || child.exitCode !== null || child.signalCode !== null) return;
  const closed = new Promise((done) => child.once('close', done));
  child.kill('SIGTERM');
  const timer = setTimeout(() => child.kill('SIGKILL'), 5000);
  try { await closed; } finally { clearTimeout(timer); }
}

function onSignal() {
  interrupted = true;
  encoder?.kill('SIGTERM');
  void browser?.close().catch(() => {});
}
process.on('SIGINT', onSignal);
process.on('SIGTERM', onSignal);

async function startPreview() {
  await access(resolve(app, 'dist/index.html')).catch(() => { throw new Error('Build missing. Run npm --prefix app run build first.'); });
  const port = await new Promise((done, reject) => {
    const server = createServer();
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      server.close((error) => error ? reject(error) : done(address.port));
    });
  });
  const url = `http://127.0.0.1:${port}`;
  let log = '';
  const viteBin = resolve(require.resolve('vite/package.json'), '../bin/vite.js');
  preview = spawn(process.execPath, [viteBin, 'preview', '--host', '127.0.0.1', '--port', String(port), '--strictPort'], {
    cwd: app, stdio: ['ignore', 'pipe', 'pipe'],
  });
  let spawnError;
  preview.on('error', (error) => { spawnError = error; });
  for (const stream of [preview.stdout, preview.stderr]) stream.on('data', (data) => { log = (log + data).slice(-8000); });
  for (let attempt = 0; attempt < 150; attempt++) {
    if (interrupted) throw new Error('Interrupted');
    if (spawnError || preview.exitCode !== null) throw new Error(`Preview failed: ${spawnError?.message ?? log}`);
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(1000) });
      await response.body?.cancel();
      if (response.ok) { console.log(`Preview: ${url}`); return url; }
    } catch { /* Wait for Vite to bind. */ }
    await delay(200);
  }
  throw new Error(`Preview did not start: ${log}`);
}

async function setTime(page, time) {
  await page.evaluate(async (t) => {
    window.__setLessonTime(t);
    await new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done)));
  }, time);
}

async function readManifest(out) {
  try {
    const entries = JSON.parse(await readFile(resolve(out, 'manifest.json'), 'utf8'));
    if (!Array.isArray(entries) || entries.some((entry) => !entry || typeof entry.id !== 'string')) throw new Error('Expected an array of video entries');
    return entries;
  } catch (error) {
    if (error.code === 'ENOENT') return [];
    throw new Error(`Cannot read existing manifest (left untouched): ${error.message}`);
  }
}

async function publishManifest(out, entries) {
  const temporary = resolve(out, `.manifest-${randomUUID()}.json`);
  try {
    await writeFile(temporary, `${JSON.stringify(entries, null, 2)}\n`);
    await rename(temporary, resolve(out, 'manifest.json'));
  } finally { await rm(temporary, { force: true }); }
}

async function renderLevel(page, captureSession, url, level, options) {
  const seconds = Math.min(level.duration, options.short ?? level.duration);
  // Frames sample [0, duration), avoiding an extra frame past the stated duration.
  const total = Math.ceil(seconds * options.fps);
  const duration = total / options.fps;
  const suffix = randomUUID();
  const temporaryVideo = resolve(options.out, `.${level.id}-${suffix}.mp4`);
  const temporaryPoster = resolve(options.out, `.${level.id}-${suffix}.jpg`);
  const file = `${level.id}.mp4`;
  const poster = `${level.id}.jpg`;
  let completed = false;
  let stderr = '';
  let encoderError;
  console.log(`\n${level.id}: ${level.title} — ${seconds}s at ${options.fps} fps (${total} frames)`);
  try {
    const route = `${url}/render/${encodeURIComponent(level.id)}?capture=1${options.captions ? '&captions=1' : ''}`;
    await page.goto(route, { waitUntil: 'networkidle' });
    await page.waitForFunction(() => typeof window.__setLessonTime === 'function' && document.querySelector('svg'));
    await page.evaluate(() => document.fonts.ready);
    await setTime(page, seconds * 0.25);
    await page.screenshot({ path: temporaryPoster, type: 'jpeg', quality: 90, clip });

    encoder = spawn('ffmpeg', [
      '-hide_banner', '-loglevel', 'error', '-y', '-f', 'image2pipe', '-framerate', String(options.fps),
      '-i', '-', '-an', '-c:v', 'libx264', '-threads', '2', '-pix_fmt', 'yuv420p', '-crf', '20',
      '-preset', 'veryfast', '-movflags', '+faststart', temporaryVideo,
    ], { stdio: ['pipe', 'ignore', 'pipe'] });
    const activeEncoder = encoder;
    activeEncoder.stderr.on('data', (data) => { stderr = (stderr + data).slice(-8000); });
    // Each frame's write callback is awaited: bounded buffering, including slow encoders.
    activeEncoder.stdin.on('error', () => {});
    const finished = new Promise((done) => {
      activeEncoder.once('error', (error) => { encoderError = error; done(false); });
      activeEncoder.once('close', (code) => {
        if (code !== 0) encoderError ??= new Error(`ffmpeg exited with ${code}: ${stderr}`);
        done(code === 0);
      });
    });
    const started = performance.now();
    let lastProgress = started;
    for (let frame = 0; frame < total; frame++) {
      if (interrupted) throw new Error('Interrupted');
      if (encoderError) throw encoderError;
      await setTime(page, frame / options.fps);
      // Chrome's fast lossless PNG path avoids expensive compression on every
      // frame. Decoded pixels match page.screenshot(); only PNG size differs.
      const { data } = await captureSession.send('Page.captureScreenshot', {
        format: 'png', clip: { ...clip, scale: 1 },
        captureBeyondViewport: false, optimizeForSpeed: true,
      });
      const png = Buffer.from(data, 'base64');
      await new Promise((done, reject) => activeEncoder.stdin.write(png, (error) => error ? reject(error) : done()));
      const now = performance.now();
      if (frame === 0 || frame + 1 === total || now - lastProgress >= 10_000) {
        const elapsed = (now - started) / 1000;
        const rate = (frame + 1) / elapsed;
        console.log(`${level.id} frame ${frame + 1}/${total} · ${rate.toFixed(1)} frames/s · ETA ${Math.ceil((total - frame - 1) / rate)}s`);
        lastProgress = now;
      }
    }
    activeEncoder.stdin.end();
    if (!await finished) throw encoderError ?? new Error(`Encoding failed: ${stderr}`);
    encoder = undefined;
    await rename(temporaryPoster, resolve(options.out, poster));
    await rename(temporaryVideo, resolve(options.out, file));
    completed = true;
    const { size: sizeBytes } = await stat(resolve(options.out, file));
    console.log(`${level.id} saved: ${(sizeBytes / 1024 / 1024).toFixed(1)} MB`);
    return { id: level.id, title: level.title, file, poster, duration, sizeBytes, renderedAt: new Date().toISOString() };
  } finally {
    if (!completed) await stop(encoder);
    encoder = undefined;
    await Promise.all([rm(temporaryVideo, { force: true }), rm(temporaryPoster, { force: true })]);
  }
}

async function main() {
  const options = parseOptions(process.argv.slice(2), root);
  if (options.help) { console.log(usage); return; }
  const ffmpeg = spawnSync('ffmpeg', ['-version'], { stdio: 'ignore' });
  if (ffmpeg.error || ffmpeg.status !== 0) throw new Error('ffmpeg is required on PATH');
  await mkdir(options.out, { recursive: true });
  let manifest = await readManifest(options.out);
  const url = options.url ?? await startPreview();
  const { chromium } = require('@playwright/test');
  browser = await chromium.launch({ channel: 'chrome', headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1, serviceWorkers: 'block' });
  const captureSession = await page.context().newCDPSession(page);
  let pageError;
  page.on('pageerror', (error) => { pageError = error; });
  await page.goto(`${url}/videos`, { waitUntil: 'networkidle' });
  const catalog = await page.locator('[data-video-level]').evaluateAll((elements) => elements.map((element) => ({
    id: element.getAttribute('data-video-level'), title: element.getAttribute('data-video-title'),
    duration: Number(element.getAttribute('data-video-duration')),
  })));
  if (pageError) throw pageError;
  const selected = selectLevels(catalog, options.levels);
  console.log(`Rendering ${selected.length} of ${catalog.length} lessons, sequentially → ${options.out}`);
  for (const level of selected) {
    if (interrupted) throw new Error('Interrupted');
    pageError = undefined;
    const entry = await renderLevel(page, captureSession, url, level, options);
    if (pageError) throw pageError;
    manifest = [...manifest.filter((existing) => existing.id !== entry.id), entry];
    manifest.sort((a, b) => catalog.findIndex((level) => level.id === a.id) - catalog.findIndex((level) => level.id === b.id));
    await publishManifest(options.out, manifest);
  }
  console.log(`\nDone. Manifest: ${resolve(options.out, 'manifest.json')}`);
}

try { await main(); }
catch (error) { console.error(`Render failed: ${error.message}`); process.exitCode = interrupted ? 130 : 1; }
finally {
  await stop(encoder);
  await browser?.close().catch(() => {});
  await stop(preview);
  process.off('SIGINT', onSignal);
  process.off('SIGTERM', onSignal);
}
