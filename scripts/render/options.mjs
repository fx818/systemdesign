import { resolve } from 'node:path';

export const usage = `Usage: node scripts/render/render.mjs [options]
  --levels L01,L02|all   Lessons to export (default: all, across all chapters)
  --fps 24              Integer frames per second, 1–60 (default: 24)
  --captions            Burn lesson captions into each frame
  --out PATH            Output directory (default: app/public/videos)
  --url URL             Use an existing app server instead of starting preview
  --short SECONDS       Export only the first N seconds, for a smoke test
  --help                Show this help

Run npm --prefix app run build first. Requires system Chrome and ffmpeg on PATH.`;

export function parseOptions(args, root) {
  const options = { levels: 'all', fps: 24, captions: false, out: resolve(root, 'app/public/videos') };
  for (let i = 0; i < args.length; i++) {
    const key = args[i];
    if (key === '--captions') { options.captions = true; continue; }
    if (key === '--help' || key === '-h') { options.help = true; continue; }
    if (!['--levels', '--fps', '--out', '--url', '--short'].includes(key)) throw new Error(`Unknown option: ${key}`);
    const value = args[++i];
    if (!value || value.startsWith('--')) throw new Error(`Missing value for ${key}`);
    if (key === '--levels') options.levels = value;
    if (key === '--fps') options.fps = Number(value);
    if (key === '--out') options.out = resolve(value);
    if (key === '--short') options.short = Number(value);
    if (key === '--url') {
      const url = new URL(value);
      if (!['http:', 'https:'].includes(url.protocol)) throw new Error('--url must use http or https');
      options.url = url.href.replace(/\/$/, '');
    }
  }
  if (!Number.isInteger(options.fps) || options.fps < 1 || options.fps > 60) throw new Error('--fps must be an integer from 1 to 60');
  if (options.short !== undefined && (!Number.isFinite(options.short) || options.short <= 0)) throw new Error('--short must be a positive number of seconds');
  if (options.levels !== 'all' && !/^[\w-]+(?:,[\w-]+)*$/.test(options.levels)) throw new Error('--levels must be all or a comma-separated list of level IDs');
  return options;
}

export function selectLevels(catalog, requested) {
  if (!catalog.length) throw new Error('No lessons found. Build the app and check /videos.');
  for (const level of catalog) {
    if (!/^[\w-]+$/.test(level.id) || !level.title || !Number.isFinite(level.duration) || level.duration <= 0) {
      throw new Error(`Invalid lesson metadata: ${JSON.stringify(level)}`);
    }
  }
  if (new Set(catalog.map((level) => level.id)).size !== catalog.length) throw new Error('Duplicate lesson IDs in catalog');
  if (requested === 'all') return catalog;
  return [...new Set(requested.split(','))].map((id) => {
    const level = catalog.find((entry) => entry.id === id);
    if (!level) throw new Error(`Unknown level ${id}. Available: ${catalog.map((entry) => entry.id).join(', ')}`);
    return level;
  });
}
