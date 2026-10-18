// Sequential lifecycle regressions on a production build; one hardware browser, no stress loop.
// node scripts/check-3d-resilience.mjs http://localhost:3121 docs/perf/renderer-audit/resilience.json
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import assert from 'node:assert/strict';
import { launch, cdp, evaluate, measure, sleep, PRELUDE } from './perf-topic10.mjs';
const [base = 'http://localhost:3121', dest = 'docs/perf/renderer-audit/resilience.json'] = process.argv.slice(2);
const profile = join(tmpdir(), `resilience-3d-${process.pid}`);
mkdirSync(profile, { recursive: true });
const { proc, ws } = await launch(profile);
const c = cdp(ws);
await c.open;
const result = { date: new Date().toISOString(), status: 'running', errors: [], twoDimensional: [] };
c.on('Runtime.exceptionThrown', e => result.errors.push(e.exceptionDetails?.exception?.description ?? e.exceptionDetails?.text));
const instrumentation = PRELUDE + `
window.__life = { contexts: 0, workers: 0, terminated: 0, maxPixels: 0, failures: 0 };
const nativeContext = HTMLCanvasElement.prototype.getContext;
HTMLCanvasElement.prototype.getContext = function(type, ...args) {
  if (/^webgl/.test(type)) { window.__life.contexts++; if (sessionStorage.getItem('test:deny-gl')) return null; }
  return nativeContext.call(this, type, ...args);
};
for (const dim of ['width', 'height']) {
  const descriptor = Object.getOwnPropertyDescriptor(HTMLCanvasElement.prototype, dim);
  Object.defineProperty(HTMLCanvasElement.prototype, dim, { ...descriptor, set(value) {
    descriptor.set.call(this, value);
    window.__life.maxPixels = Math.max(window.__life.maxPixels, this.width * this.height);
    if (this.width * this.height > 2000000) window.__life.failures++;
  }});
}
const NativeWorker = window.Worker;
window.Worker = class extends NativeWorker {
  constructor(...args) { super(...args); window.__life.workers++; }
  terminate() { window.__life.terminated++; super.terminate(); }
};
`;
async function until(expr, ms = 25000) {
  for (let i = 0; i < ms / 100; i++) {
    if (await evaluate(c, expr)) return;
    await sleep(100);
  }
  throw new Error('Condition not met: ' + expr);
}
async function open(route) {
  const loaded = c.once('Page.loadEventFired');
  await c.send('Page.navigate', { url: base + route });
  await loaded;
}
async function ready() { await until(`!!document.querySelector('.stage3d.is-gl')`); }
async function click(label) {
  assert.ok(await evaluate(c, `(() => { const b = [...document.querySelectorAll('button')].find(b => b.textContent.trim() === ${JSON.stringify(label)}); if (!b) return false; b.click(); return true; })()`), label);
}
async function flat() { await until(`!document.querySelector('.viewport-underlay canvas') && document.querySelectorAll('.stage3d-flat').length > 0`); }
try {
  await c.send('Page.enable'); await c.send('Runtime.enable'); await c.send('Performance.enable');
  await c.send('Page.addScriptToEvaluateOnNewDocument', { source: instrumentation });
  await c.send('Emulation.setDeviceMetricsOverride', { width: 1536, height: 960, deviceScaleFactor: 2, mobile: false });
  for (const week of [1, 7, 8, 9, 11]) {
    await open(`/astea/${week}`);
    await sleep(4500);
    const life = await evaluate(c, 'window.__life');
    assert.equal(life.contexts, 0, `2D topic ${week} created WebGL`);
    assert.equal(life.workers, 0, `2D topic ${week} built unused meshes`);
    result.twoDimensional.push({ week, ...life });
    console.log(`2D topic ${week}: no contexts or geometry workers`);
  }
  await open('/astea/9?etapa=domeinuak&ikuspegia=domeinuak-3d&une=0.55');
  await ready();
  await until('window.__life.workers > 0 && window.__life.workers === window.__life.terminated');
  result.workerReleased = await evaluate(c, 'window.__life');
  console.log('Lazy geometry worker released');
  const heart = '/astea/10?etapa=atal-bentrikularra&ikuspegia=3d&une=0.55';
  await open(heart); await ready(); await sleep(1600);
  result.buffers = [];
  for (const [width, height] of [[2400, 1600], [700, 1800], [2200, 700], [1536, 960]]) {
    await c.send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 2, mobile: false });
    await sleep(700);
    const info = await evaluate(c, 'window.__glInfo()');
    assert.ok(info.w * info.h <= 2000000, JSON.stringify(info));
    result.buffers.push({ width, height, ...info });
  }
  result.transientBuffers = await evaluate(c, 'window.__life');
  assert.equal(result.transientBuffers.failures, 0, 'An intermediate canvas allocation exceeded the limit');
  await sleep(800);
  result.held = await measure(c, 1200, null, false);
  assert.equal(result.held.perS.glRender ?? 0, 0, 'Still picture kept rendering');

  // Real IntersectionObserver event: move the viewport outside the browser's visible rectangle.
  await evaluate(c, `document.querySelector('.viewport-underlay').style.transform = 'translateX(-20000px)'`);
  await sleep(700);
  result.offscreen = await measure(c, 1000, null, false);
  assert.equal(result.offscreen.perS.glTick ?? 0, 0);
  await evaluate(c, `document.querySelector('.viewport-underlay').style.transform = ''`);
  await sleep(600);
  // Deterministic visibility event test (not a claim about physical tab-switch throttling).
  await evaluate(c, `window.__testHidden = false; Object.defineProperty(document, 'hidden', { configurable: true, get: () => window.__testHidden }); window.__testHidden = true; document.dispatchEvent(new Event('visibilitychange'));`);
  result.hidden = await measure(c, 1000, null, false);
  assert.equal(result.hidden.perS.glTick ?? 0, 0);
  await evaluate(c, `window.__testHidden = false; document.dispatchEvent(new Event('visibilitychange'));`);
  await sleep(700);

  await click('Mozketa frontala');
  await until(`!document.querySelector('.stage3d.is-gl')`);
  await sleep(900);
  result.parked = await evaluate(c, `({ canvas: !!document.querySelector('.viewport-underlay canvas'), info: window.__glInfo(), counters: window.__perf })`);
  assert.equal(result.parked.info.w * result.parked.info.h, 1);
  assert.ok(result.parked.info.geometries <= 2);
  await until(`!document.querySelector('.viewport-underlay canvas')`, 7000);
  result.disposedAfterPark = true;
  await click('Bihotz lakioa 3D'); await ready(); await sleep(800);
  result.reopened = await evaluate(c, 'window.__glInfo()');

  await open(heart + '&jolastu=1'); await ready(); await sleep(350);
  result.playing = await measure(c, 2000);
  assert.ok((result.playing.perS.glRender ?? 0) <= 31, 'GPU draw cap exceeded');

  assert.ok(await evaluate(c, `(() => { const g = document.querySelector('.viewport-underlay canvas').getContext('webgl2'); const ext = g.getExtension('WEBGL_lose_context'); if (!ext) return false; ext.loseContext(); return true; })()`));
  await flat(); result.lostContextFallback = true;
  for (const label of ['Mozketa frontala', 'Bihotz lakioa 3D']) { await click(label); await sleep(1100); }
  await flat(); result.viewSwitchFallback = true;
  await open(heart); await flat();
  result.reloadFallback = await evaluate(c, 'window.__life');
  assert.equal(result.reloadFallback.contexts, 0, 'Reload retried the failed GPU');

  // Separate session flag for a browser refusing context creation (e.g. a major performance caveat).
  await evaluate(c, `sessionStorage.removeItem('enbrioatlas:gpu-unavailable:v1'); sessionStorage.setItem('test:deny-gl', '1');`);
  await open(heart); await flat();
  result.creationFailure = await evaluate(c, 'window.__life');
  assert.ok(result.creationFailure.contexts > 0);
  await open(heart); await flat();
  result.creationFailureReload = await evaluate(c, 'window.__life');
  assert.equal(result.creationFailureReload.contexts, 0);
  assert.deepEqual(result.errors, []);
  result.status = 'passed';
  console.log(JSON.stringify(result));
} catch (error) {
  result.status = 'failed'; result.failure = String(error); throw error;
} finally {
  mkdirSync(dirname(resolve(dest)), { recursive: true });
  writeFileSync(resolve(dest), JSON.stringify(result, null, 2));
  c.close(); proc.kill();
}
