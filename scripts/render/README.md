# Lesson MP4 export

Requires the existing `app/node_modules` install, system Google Chrome (Playwright
`channel: 'chrome'`), and `ffmpeg` on PATH. `ffprobe` is used for verification.
No extra npm dependencies are needed. Run these commands from the repository root:

```sh
npm --prefix app run build
node scripts/render/render.mjs --levels L01,L02 --fps 24 --captions
```

Or export every lesson in every chapter:

```sh
npm --prefix app run render:videos
```

`--levels all` uses the current **built** catalog, including newly added chapters;
rebuild after adding content. The script starts Vite preview on a free localhost
port, launches one Chrome page at 1280×720, then stops both on completion or error.
It reads `data-video-level`, `data-video-title`, and `data-video-duration` from the
Videos page, which uses the same registry as the app. No source-file parsing or
fixed list of lesson IDs is involved.

```sh
# Six-second pipeline check, without overwriting full exports:
node scripts/render/render.mjs --levels L01 --short 6 --fps 12 --captions --out /tmp/quest-video-smoke

# Reuse a server (omit --url to let the script own its preview):
node scripts/render/render.mjs --levels L01 --url http://127.0.0.1:4173 --captions

# Detailed options:
node scripts/render/render.mjs --help

# CLI validation and real two-lesson --levels all integration check:
node --test scripts/render/render.test.mjs

ffprobe -v error -select_streams v:0 -show_entries stream=width,height,codec_name,pix_fmt,r_frame_rate:format=duration,size -of json app/public/videos/L01.mp4
```

Each level emits `<ID>.mp4` (H.264, yuv420p, CRF 20, veryfast, faststart) and a
`<ID>.jpg` poster sampled at 25% of the exported segment. Frames sample `i/fps`
for `i = 0 .. ceil(duration*fps)-1`, each after two animation frames. This avoids
an extra frame beyond the lesson; fractional durations round up to a frame.
Captions are optional and burned in; there is no audio track. Screenshots use
Playwright's Chrome DevTools session with `optimizeForSpeed: true`: the same
lossless PNG pixels as `page.screenshot`, with faster compression and larger
temporary buffers. The buffers are streamed, never collected across frames.

Only one level and one screenshot buffer are processed at a time. Each PNG write
waits for ffmpeg's stdin callback, respecting backpressure; x264 uses two threads.
Progress includes completed frames, capture rate, and estimated seconds remaining.
Temporary files are removed on failure/interruption. Existing exports remain until
encoding succeeds. Do not run multiple exporters into the same output directory.
The integration test also interrupts an active export and checks that the old
manifest survives and temporary files are removed.

`--out` defaults to `app/public/videos`, independent of the working directory.
An explicit relative `--out` is relative to the current working directory. A custom
output directory gets its own manifest. The manifest is an array of
`{id,title,file,poster,duration,sizeBytes,renderedAt}`; `file` and `poster` are
filenames relative to that directory, and `duration` is the exported duration in
seconds (so a short smoke export is accurately identified). Subset runs merge
entries into the existing manifest and publish it atomically after each level.
A short export into the same directory replaces that level's full export.

`/videos` fetches `/videos/manifest.json` and shows inline players/downloads for
exported lessons. Missing manifests (including SPA HTML fallbacks) are harmless;
all lessons retain their animated watch links and generation commands. Built static
sites must be rebuilt **after rendering** to copy videos from `app/public/videos`
into `app/dist/videos` before deployment. Preview serves the last build, so use that
rebuild to inspect new downloads there as well. Generated videos, posters, manifests,
and temporary files under `app/public/videos/` are ignored by Git.
