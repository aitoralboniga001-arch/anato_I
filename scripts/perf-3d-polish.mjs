// Sequential, bounded survey of all 13 3D views. Production server required.
// node scripts/perf-3d-polish.mjs http://localhost:3111 docs/perf/polish-batch6
// FILTER=atal-bentrikularra (or any route substring) limits a diagnostic rerun.
// No GPU blocklist bypass. Only 3 x 8 held draws, with cooling gaps between views.
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { launch, cdp, evaluate, measure, sleep, PRELUDE } from './perf-topic10.mjs';

const [base = 'http://localhost:3111', dest = 'docs/perf/polish-batch6'] = process.argv.slice(2);
const out = resolve(dest);
const width = Number(process.env.WIDTH ?? 1536);
const height = Number(process.env.HEIGHT ?? 960);
const reduced = process.env.REDUCED === '1';
mkdirSync(join(out, 'shots'), { recursive: true });
const views = [
  [7, 'diafragma-eraketa', 'kupula'],
  [8, 'buru-ganga', 'kupula'],
  [8, 'gorputz-adarrak', 'biraketa'],
  [9, 'domeinuak', 'domeinuak-3d'],
  ...['bihotz-hodia', 'zirkulazio-goiztiarra', 'bihotz-atalak', 'bihotz-lakioa', 'atal-bulbarra', 'atal-bentrikularra', 'atal-aurikularra', 'zain-sinua', 'eskuineko-aurikula'].map(s => [10, s, '3d']),
].filter(v => !process.env.FILTER || process.env.FILTER.split(',').some(f => v.join('/').includes(f)));
const profile = join(tmpdir(), `polish-3d-${process.pid}`);
mkdirSync(profile, { recursive: true });
const { proc, ws } = await launch(profile);
const c = cdp(ws);
await c.open;
const result = { date: new Date().toISOString(), base, width, height, dpr: 2, reduced, gpuSamples: 'median of 3 x 8 draws (CPU submission + GPU completion)', runs: [] };
const errors = [];
c.on('Runtime.exceptionThrown', e => errors.push(e.exceptionDetails?.exception?.description ?? e.exceptionDetails?.text ?? 'runtime error'));
try {
  await c.send('Page.enable');
  await c.send('Runtime.enable');
  await c.send('Performance.enable');
  await c.send('Page.addScriptToEvaluateOnNewDocument', { source: PRELUDE });
  await c.send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 2, mobile: false });
  if (reduced) await c.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
  async function open(v, play = false) {
    const [w, stage, view] = v;
    const loaded = c.once('Page.loadEventFired', 30000);
    await c.send('Page.navigate', { url: `${base}/astea/${w}?etapa=${stage}&ikuspegia=${view}&une=0.55${play ? '&jolastu=1' : ''}` });
    await loaded;
    for (let i = 0; i < 250; i++) {
      if (await evaluate(c, `!!document.querySelector('.viewport-underlay canvas.is-ready')`).catch(() => false)) return;
      await sleep(100);
    }
    throw new Error(`3D never ready: ${v}`);
  }
  async function shot(name) {
    const s = await c.send('Page.captureScreenshot', { format: 'png' });
    writeFileSync(join(out, 'shots', name + '.png'), Buffer.from(s.data, 'base64'));
  }
  for (const v of views) {
    const name = v.join('-');
    const row = { week: v[0], stage: v[1], view: v[2] };
    result.runs.push(row);
    try {
      await open(v);
      await sleep(1800);
      row.renderer = await evaluate(c, `(() => { const g = document.querySelector('.viewport-underlay canvas').getContext('webgl2'); const e = g.getExtension('WEBGL_debug_renderer_info'); return e ? g.getParameter(e.UNMASKED_RENDERER_WEBGL) : 'unknown'; })()`);
      if (/swiftshader|software|llvmpipe/i.test(row.renderer)) throw new Error('Hardware GPU unavailable: ' + row.renderer);
      row.info = await evaluate(c, 'window.__glInfo?.() ?? null');
      if (!process.env.SHOTS_ONLY) {
        row.hold = await measure(c, 1500, null, false);
        row.gpuMs = await evaluate(c, `(() => { const t = Array.from({length:3}, () => window.__glBench?.(8)).filter(x => x != null).sort((a,b) => a-b); return t.length ? +t[1].toFixed(3) : null; })()`);
      }
      await shot(name);
      // Same viewport and eight wheel ticks as the reported heart close-up.
      for (let i = 0; i < 8; i++) await c.send('Input.dispatchMouseEvent', { type: 'mouseWheel', x: width < 700 ? width * 0.45 : 680, y: width < 700 ? height * 0.45 : 500, deltaX: 0, deltaY: -100 });
      await sleep(700);
      await shot(name + '-zoom');
      if (!process.env.SHOTS_ONLY) {
        await open(v, true);
        await sleep(350);
        row.play = await measure(c, 2000);
      }
      if (process.env.PROFILE) {
        await c.send('Profiler.enable');
        await c.send('Profiler.start');
        await sleep(2000);
        const { profile } = await c.send('Profiler.stop');
        writeFileSync(join(out, name + '.cpuprofile'), JSON.stringify(profile));
      }
      console.log(`${name}: ${row.play?.mainThreadMsPerS ?? 'shots only'} ms/s, p95 ${row.play?.frameMs.p95}, GPU ${row.gpuMs}, triangles ${row.info?.triangles}`);
    } catch (e) {
      row.error = String(e);
      errors.push(row.error);
      console.error(name, row.error);
    }
    result.errors = errors;
    writeFileSync(join(out, 'results.json'), JSON.stringify(result, null, 2));
    await c.send('Page.navigate', { url: 'about:blank' });
    await sleep(1500);
  }
} finally {
  c.close();
  proc.kill();
}
if (errors.length) process.exitCode = 1;
