// Production check: real-time 30 Hz playback, reading holds, camera wake/settle and SPA disposal.
import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { launch, cdp, evaluate, measure, sleep, PRELUDE } from './perf-topic10.mjs';
const [base = 'http://localhost:3121', dest = 'docs/perf/renderer-audit/playback.json'] = process.argv.slice(2);
const profile = join(tmpdir(), `playback-3d-${process.pid}`);
mkdirSync(profile, { recursive: true });
const { proc, ws } = await launch(profile);
const c = cdp(ws); await c.open;
const result = { date: new Date().toISOString(), status: 'running', errors: [] };
c.on('Runtime.exceptionThrown', e => result.errors.push(e.exceptionDetails?.exception?.description ?? e.exceptionDetails?.text));
async function until(expr) {
  for (let i = 0; i < 200; i++) { if (await evaluate(c, expr)) return; await sleep(100); }
  throw new Error('Condition not met: ' + expr);
}
async function open(at) {
  const loaded = c.once('Page.loadEventFired');
  await c.send('Page.navigate', { url: `${base}/astea/8?etapa=buru-ganga&ikuspegia=kupula&une=${at}&jolastu=1` });
  await loaded; await until(`!!document.querySelector('.stage3d.is-gl')`); await sleep(600);
}
const head = () => evaluate(c, `({ t: parseFloat(document.querySelector('.scrub-head').style.left) / 100, now: performance.now() })`);
try {
  await c.send('Page.enable'); await c.send('Runtime.enable'); await c.send('Performance.enable');
  await c.send('Page.addScriptToEvaluateOnNewDocument', { source: PRELUDE + `localStorage.setItem('enbrioatlas:asks','0'); localStorage.setItem('enbrioatlas:fsAsk','0'); Object.defineProperty(window, 'speechSynthesis', { configurable: true, value: undefined });` });
  await c.send('Emulation.setDeviceMetricsOverride', { width: 1536, height: 960, deviceScaleFactor: 2, mobile: false });
  await open(0.45);
  const from = await head(); await sleep(2000); const to = await head();
  // duration 36 s, NORMAL_RATE 0.8, GUIDED_RATE 0.4: capped sampling must not slow stage time.
  result.clock = { from, to, expectedDelta: (to.now - from.now) / 1000 * 0.8 * 0.4 / 36 };
  assert.ok(Math.abs((to.t - from.t) - result.clock.expectedDelta) < 0.002);
  await evaluate(c, `window.__testHidden = true; Object.defineProperty(document, 'hidden', { configurable: true, get: () => window.__testHidden }); document.dispatchEvent(new Event('visibilitychange'));`);
  await sleep(100); const hiddenFrom = await head();
  result.hidden = await measure(c, 2000, null, false);
  const hiddenTo = await head();
  assert.equal(hiddenTo.t, hiddenFrom.t);
  assert.equal(result.hidden.perS.simFrame ?? 0, 0);
  assert.equal(result.hidden.perS.glTick ?? 0, 0);
  await evaluate(c, `window.__testHidden = false; document.dispatchEvent(new Event('visibilitychange'));`);
  await sleep(220); const resumed = await head();
  assert.ok(resumed.t > hiddenTo.t && resumed.t - hiddenTo.t < 0.005);
  result.resume = { hiddenFrom, hiddenTo, resumed };

  // This beat completes at .56 - .035 - .0001 = .5249; it remains a manual reading hold.
  await open(0.5249);
  await until(`!!document.querySelector('.cap-next.is-wait')`); await sleep(1000);
  const holdFrom = await head(); result.readingHold = await measure(c, 1500, null, false); const holdTo = await head();
  assert.equal(holdTo.t, holdFrom.t);
  assert.equal(result.readingHold.perS.simFrame ?? 0, 0);
  assert.equal(result.readingHold.perS.glRender ?? 0, 0);
  result.readingPosition = holdTo.t;

  result.turn = await measure(c, 1000, async () => {
    assert.ok(await evaluate(c, `(() => { const b = document.querySelector('.look-keys button:not([aria-pressed="true"])') ?? document.querySelector('.orbit-controls .orbit-right'); if (!b) return false; b.click(); return true; })()`));
  });
  assert.ok(result.turn.perS.glRender > 1 && result.turn.perS.glRender <= 31);
  await sleep(800); result.turnSettled = await measure(c, 1000, null, false);
  assert.equal(result.turnSettled.perS.glRender ?? 0, 0);

  await evaluate(c, `window.__oldCanvas = document.querySelector('.viewport-underlay canvas')`);
  await evaluate(c, `document.querySelector('.tsw-btn').click()`);
  await until(`!!document.querySelector('a[href="/astea/9"]')`);
  assert.ok(await evaluate(c, `(() => { const link = document.querySelector('a[href="/astea/9"]'); if (!link) return false; link.click(); return true; })()`));
  await until(`location.pathname === '/astea/9' && !window.__oldCanvas.isConnected`);
  await sleep(300);
  result.detached = await evaluate(c, `({ connected: window.__oldCanvas.isConnected, lost: window.__oldCanvas.getContext('webgl2').isContextLost(), underlayCanvases: document.querySelectorAll('.viewport-underlay canvas').length })`);
  assert.equal(result.detached.lost, true, 'Detached route retained a live GPU context');
  assert.equal(result.detached.underlayCanvases, 0);
  await evaluate(c, 'window.__oldCanvas = null');

  // The default topic 10 class owns a different pose-glide loop. Exercise its real UI, using the
  // supported timer/subtitle fallback so a diagnostic browser does not speak aloud.
  const loaded = c.once('Page.loadEventFired');
  await c.send('Page.navigate', { url: `${base}/astea/10?etapa=bihotz-atalak&ikuspegia=3d&une=0.3&klasea=atalak` });
  await loaded; await until(`!!document.querySelector('.stage3d.is-gl')`);
  assert.ok(await evaluate(c, `(() => { const b = [...document.querySelectorAll('button')].find(b => b.textContent.trim().startsWith('Klasea hemendik')); if (!b) return false; b.click(); return true; })()`));
  await until('(window.__perf.glideFrame ?? 0) > 2');
  result.classMotion = await measure(c, 1500);
  assert.ok(result.classMotion.perS.glideFrame > 0 && result.classMotion.perS.glideFrame <= 31);
  assert.ok(await evaluate(c, `(() => { const b = document.querySelector('section[aria-label="Klasea"] button[aria-label="Pausatu"]'); if (!b) return false; b.click(); return true; })()`));
  await sleep(1000); result.classPaused = await measure(c, 1200, null, false);
  assert.equal(result.classPaused.perS.glideFrame ?? 0, 0);
  assert.equal(result.classPaused.perS.glRender ?? 0, 0);
  result.classVoice = 'timer/subtitle fallback';
  assert.deepEqual(result.errors, []);
  result.status = 'passed'; console.log(JSON.stringify(result));
} catch (error) { result.status = 'failed'; result.failure = String(error); throw error; }
finally {
  mkdirSync(dirname(resolve(dest)), { recursive: true }); writeFileSync(resolve(dest), JSON.stringify(result, null, 2));
  c.close(); proc.kill();
}
