// Topic 10 3D performance baseline: plays, holds and drags each stage's 3D view in headless Chrome and
// records how much work the page does (main-thread time, frame times, long tasks, and the app's own
// work counters from lib/perf.ts: model builds, mesh builds, projections, GPU uploads, renders, ticks).
// Also takes a screenshot of each held view, to compare pictures before and after a change.
//
//   node scripts/perf-topic10.mjs run [baseUrl=http://localhost:3100] [out=docs/perf/topic10-baseline]
//   node scripts/perf-topic10.mjs compare <dirA> <dirB>      (pixel differences between two runs' shots)
//
// Serve a production build (`next build && next start -p 3100`): dev mode renders twice and is slow.
// Headless Chrome may draw WebGL in software (the renderer string is recorded): compare runs with each
// other, not with a real tablet. Set CHROME to the browser binary if it is not in the usual place.
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const PORT = 9341;
const STAGES = ['bihotz-hodia', 'zirkulazio-goiztiarra', 'bihotz-atalak', 'bihotz-lakioa', 'atal-bulbarra', 'atal-bentrikularra', 'atal-aurikularra', 'zain-sinua', 'eskuineko-aurikula'];
/** Where in each stage the held views are taken (stage time); playing starts from there too. */
const AT = 0.55;
const VIEWPORTS = [
  { name: 'pc', w: 1440, h: 900, stages: STAGES },
  { name: 'tablet', w: 768, h: 1024, stages: ['zirkulazio-goiztiarra', 'bihotz-lakioa', 'eskuineko-aurikula'] },
];
const PLAY_MS = 3000;
const HOLD_MS = 3000;
const DRAG_MS = 1500;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const chrome =
  process.env.CHROME ??
  ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', '/usr/bin/google-chrome'].find((p) => existsSync(p));

/** Runs in the page before anything else: the counters on, long tasks and frame times collected. */
const PRELUDE = `
window.__perf = {};
window.__long = [];
try { new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__long.push(e.duration); }).observe({ type: 'longtask', buffered: true }); } catch {}
window.__frames = (ms) => new Promise((done) => {
  const d = []; let last = 0; const end = performance.now() + ms;
  const f = (now) => { if (last) d.push(now - last); last = now; if (now < end) requestAnimationFrame(f); else done(d); };
  requestAnimationFrame(f);
});
`;

async function launch(profile) {
  const proc = spawn(chrome, ['--headless=new', `--remote-debugging-port=${PORT}`, `--user-data-dir=${profile}`, '--no-first-run', '--no-default-browser-check', '--use-angle=d3d11', '--ignore-gpu-blocklist', '--window-size=1440,900', 'about:blank'], { stdio: 'ignore' });
  for (let i = 0; i < 50; i++) {
    try {
      const list = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
      const page = list.find((t) => t.type === 'page');
      if (page) return { proc, ws: page.webSocketDebuggerUrl };
    } catch {}
    await sleep(200);
  }
  proc.kill();
  throw new Error('Chrome did not start');
}

function cdp(url) {
  const ws = new WebSocket(url);
  let id = 0;
  const pending = new Map();
  const waiters = [];
  ws.onmessage = (m) => {
    const msg = JSON.parse(m.data);
    if (msg.id && pending.has(msg.id)) {
      const { ok, ko } = pending.get(msg.id);
      pending.delete(msg.id);
      if (msg.error) ko(new Error(msg.error.message));
      else ok(msg.result);
    } else if (msg.method) for (const w of [...waiters]) if (w.method === msg.method) { waiters.splice(waiters.indexOf(w), 1); w.ok(msg.params); }
  };
  const open = new Promise((r) => (ws.onopen = r));
  return {
    open,
    send: (method, params = {}) => new Promise((ok, ko) => { pending.set(++id, { ok, ko }); ws.send(JSON.stringify({ id, method, params })); }),
    once: (method, ms = 30000) => new Promise((ok, ko) => { const w = { method, ok }; waiters.push(w); setTimeout(() => ko(new Error(`timeout ${method}`)), ms); }),
    close: () => ws.close(),
  };
}

async function evaluate(c, expr) {
  const r = await c.send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true });
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.text + ' ' + (r.exceptionDetails.exception?.description ?? ''));
  return r.result.value;
}

async function metrics(c) {
  const { metrics: m } = await c.send('Performance.getMetrics');
  const o = Object.fromEntries(m.map((x) => [x.name, x.value]));
  return { task: o.TaskDuration, script: o.ScriptDuration, layout: o.LayoutDuration, style: o.RecalcStyleDuration };
}

const pct = (a, p) => {
  if (!a.length) return 0;
  const s = [...a].sort((x, y) => x - y);
  return +s[Math.min(s.length - 1, Math.floor(p * s.length))].toFixed(2);
};

/**
 * Measures `ms` of whatever the page is doing (after `act` starts it). Frame times are sampled with a rAF
 * loop, which itself makes the browser produce every frame: a held view is measured without it.
 */
async function measure(c, ms, act, sampleFrames = true) {
  await evaluate(c, 'window.__perf = {}; window.__long.length = 0; 0');
  const m0 = await metrics(c);
  const framesP = sampleFrames ? evaluate(c, `window.__frames(${ms})`) : sleep(ms).then(() => []);
  if (act) await act();
  const frames = await framesP;
  const m1 = await metrics(c);
  const counters = await evaluate(c, 'window.__perf');
  const long = await evaluate(c, 'window.__long');
  const sec = ms / 1000;
  return {
    mainThreadMsPerS: +(((m1.task - m0.task) * 1000) / sec).toFixed(1),
    scriptMsPerS: +(((m1.script - m0.script) * 1000) / sec).toFixed(1),
    styleLayoutMsPerS: +(((m1.style - m0.style + m1.layout - m0.layout) * 1000) / sec).toFixed(1),
    frameMs: { p50: pct(frames, 0.5), p95: pct(frames, 0.95), max: +Math.max(0, ...frames).toFixed(1), n: frames.length },
    longTasks: { n: long.length, totalMs: +long.reduce((s, x) => s + x, 0).toFixed(0) },
    perS: Object.fromEntries(Object.entries(counters).map(([k, v]) => [k, +(v / sec).toFixed(1)])),
  };
}

async function open(c, base, stage, play) {
  const url = `${base}/astea/10?etapa=${stage}&ikuspegia=3d&une=${AT}${play ? '&jolastu=1' : ''}`;
  await c.send('Page.navigate', { url });
  await c.once('Page.loadEventFired', 60000).catch(() => {});
  // The 3D picture is up (its shaders compiled, the first frame drawn).
  for (let i = 0; i < 150; i++) {
    if (await evaluate(c, `!!document.querySelector('.viewport-underlay canvas.is-ready')`)) return true;
    await sleep(100);
  }
  return false;
}

async function drag(c, w, h) {
  const x0 = w * 0.45;
  const y = h * 0.45;
  await c.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: x0, y, button: 'left', clickCount: 1 });
  const steps = 40;
  for (let i = 1; i <= steps; i++) {
    await c.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: x0 + i * 4, y: y + Math.sin(i / 6) * 10, button: 'left', buttons: 1 });
    await sleep(DRAG_MS / steps);
  }
  await c.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: x0 + steps * 4, y, button: 'left', clickCount: 1 });
}

async function run(base, out) {
  if (!chrome) throw new Error('Set CHROME to a Chrome/Edge binary');
  const outDir = resolve(out);
  mkdirSync(join(outDir, 'shots'), { recursive: true });
  const profile = join(tmpdir(), `perf-topic10-${process.pid}`);
  mkdirSync(profile, { recursive: true });
  const { proc, ws } = await launch(profile);
  const c = cdp(ws);
  await c.open;
  const result = { base, at: AT, date: new Date().toISOString(), renderer: '', runs: [] };
  try {
    await c.send('Page.enable');
    await c.send('Runtime.enable');
    await c.send('Performance.enable');
    await c.send('Page.addScriptToEvaluateOnNewDocument', { source: PRELUDE });
    for (const vp of VIEWPORTS) {
      await c.send('Emulation.setDeviceMetricsOverride', { width: vp.w, height: vp.h, deviceScaleFactor: 1, mobile: false });
      for (const stage of vp.stages) {
        const row = { viewport: vp.name, stage };
        process.stdout.write(`${vp.name} ${stage}: `);
        // Held: the step's picture, nothing happening.
        if (!(await open(c, base, stage, false))) {
          row.error = '3D never ready';
          result.runs.push(row);
          console.log('3D never ready');
          continue;
        }
        if (!result.renderer)
          result.renderer = await evaluate(c, `(() => { const g = document.createElement('canvas').getContext('webgl2'); const e = g && g.getExtension('WEBGL_debug_renderer_info'); return e ? g.getParameter(e.UNMASKED_RENDERER_WEBGL) : 'unknown'; })()`);
        await sleep(2500);
        row.hold = await measure(c, HOLD_MS, null, false);
        const shot = await c.send('Page.captureScreenshot', { format: 'png' });
        writeFileSync(join(outDir, 'shots', `${vp.name}-${stage}.png`), Buffer.from(shot.data, 'base64'));
        // Turned by the viewer.
        row.drag = await measure(c, DRAG_MS + 300, () => drag(c, vp.w, vp.h));
        // Played from the same point.
        if (await open(c, base, stage, true)) {
          await sleep(300);
          row.play = await measure(c, PLAY_MS);
        }
        result.runs.push(row);
        console.log(`hold ${row.hold.mainThreadMsPerS} ms/s, play ${row.play?.mainThreadMsPerS} ms/s`);
      }
    }
  } finally {
    c.close();
    proc.kill();
  }
  writeFileSync(join(outDir, 'results.json'), JSON.stringify(result, null, 2));
  console.log(`renderer: ${result.renderer}\nwrote ${join(outDir, 'results.json')}`);
}

/** Pixel differences between the shots of two runs (decoded and compared in the browser). */
async function compare(a, b) {
  const profile = join(tmpdir(), `perf-topic10-cmp-${process.pid}`);
  mkdirSync(profile, { recursive: true });
  const { proc, ws } = await launch(profile);
  const c = cdp(ws);
  await c.open;
  try {
    for (const f of readdirSync(join(a, 'shots')).filter((x) => x.endsWith('.png'))) {
      const pb = join(b, 'shots', f);
      if (!existsSync(pb)) {
        console.log(`${f}: missing in ${b}`);
        continue;
      }
      const da = readFileSync(join(a, 'shots', f)).toString('base64');
      const db = readFileSync(pb).toString('base64');
      const r = await evaluate(
        c,
        `(async () => {
          const load = (s) => new Promise((ok) => { const i = new Image(); i.onload = () => ok(i); i.src = 'data:image/png;base64,' + s; });
          const [x, y] = await Promise.all([load(${JSON.stringify(da)}), load(${JSON.stringify(db)})]);
          if (x.width !== y.width || x.height !== y.height) return { size: true };
          const px = (img) => { const cv = new OffscreenCanvas(img.width, img.height); const g = cv.getContext('2d'); g.drawImage(img, 0, 0); return g.getImageData(0, 0, img.width, img.height).data; };
          const p = px(x), q = px(y);
          let diff = 0, big = 0;
          for (let i = 0; i < p.length; i += 4) {
            const d = Math.max(Math.abs(p[i] - q[i]), Math.abs(p[i + 1] - q[i + 1]), Math.abs(p[i + 2] - q[i + 2]));
            if (d > 2) diff++;
            if (d > 40) big++;
          }
          return { diffPct: +(100 * diff / (p.length / 4)).toFixed(3), bigPct: +(100 * big / (p.length / 4)).toFixed(3) };
        })()`,
      );
      console.log(`${f}: ${JSON.stringify(r)}`);
    }
  } finally {
    c.close();
    proc.kill();
  }
}

const [cmd = 'run', ...args] = process.argv.slice(2);
if (cmd === 'compare') await compare(resolve(args[0]), resolve(args[1]));
else await run(args[0] ?? 'http://localhost:3100', args[1] ?? 'docs/perf/topic10-baseline');
