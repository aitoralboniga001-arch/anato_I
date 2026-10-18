// Production-only 30/40 comparison. One hardware browser, alternating targets, bounded samples.
// node scripts/compare-topic10-fps.mjs http://localhost:3123 docs/perf/topic10-fps
import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { launch, cdp, evaluate, sleep, PRELUDE } from './perf-topic10.mjs';

const [base = 'http://localhost:3123', dest = 'docs/perf/topic10-fps'] = process.argv.slice(2);
const out = resolve(dest); mkdirSync(join(out, 'shots'), { recursive: true });
const ms = Number(process.env.SAMPLE_MS ?? 3000);
assert.ok(ms >= 1500 && ms <= 5000, 'Samples must remain bounded');
const cases = [
  { stage: 'zain-sinua', at: 0.45, name: 'closing-veins' },
  { stage: 'bihotz-lakioa', at: 0.30, name: 'looping' },
  { stage: 'eskuineko-aurikula', at: 0.12, name: 'atrium-valves' },
  { stage: 'atal-bentrikularra', at: 0.80, name: 'ventricular-flow' },
  ...['bihotz-hodia', 'zirkulazio-goiztiarra', 'bihotz-atalak', 'bihotz-lakioa', 'atal-bulbarra', 'atal-bentrikularra', 'atal-aurikularra', 'zain-sinua', 'eskuineko-aurikula'].map(stage => ({ stage, at: 0.55, name: stage })),
].filter(row => !process.env.FILTER || process.env.FILTER.split(',').some(f => row.name.includes(f)));
const result = { date: new Date().toISOString(), base, viewport: { width: 1536, height: 960, dpr: 2 }, sampleMs: ms,
  order: [30, 40, 40, 30], note: 'Both diagnostic targets use deadline-preserving pacing. Normal production default remains unchanged at 30.',
  gpuMetric: 'Median 3 x 8 held draws: CPU submission + completion/readback, not hardware GPU time or utilization.',
  runs: [], classes: [], errors: [], status: 'running' };
const profile = join(tmpdir(), `topic10-fps-${process.pid}`); mkdirSync(profile, { recursive: true });
const { proc, ws } = await launch(profile); const c = cdp(ws); await c.open;
c.on('Runtime.exceptionThrown', e => result.errors.push(e.exceptionDetails?.exception?.description ?? e.exceptionDetails?.text));
const save = () => writeFileSync(join(out, 'results.json'), JSON.stringify(result, null, 2));
async function until(expr) {
  for (let i = 0; i < 250; i++) { if (await evaluate(c, expr)) return; await sleep(100); }
  throw new Error('Condition not met: ' + expr);
}
async function open(row, fps, play = false, classMode = false) {
  const loaded = c.once('Page.loadEventFired');
  await c.send('Page.navigate', { url: `${base}/astea/10?etapa=${row.stage}&ikuspegia=3d&une=${row.at}&perfFps=${fps}${play ? '&jolastu=1' : ''}${classMode ? '&klasea=atalak' : ''}` });
  await loaded; await until(`!!document.querySelector('.viewport-underlay canvas.is-ready')`);
  assert.equal(await evaluate(c, 'window.__topic10Fps'), fps);
}
async function metrics() {
  const r = await c.send('Performance.getMetrics'); return Object.fromEntries(r.metrics.map(m => [m.name, m.value]));
}
function intervals(times = []) {
  const gaps = times.slice(1).map((t, i) => t - times[i]), sorted = [...gaps].sort((a, b) => a - b);
  const pct = p => sorted.length ? +sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * p))].toFixed(2) : 0;
  return { n: gaps.length, mean: gaps.length ? +(gaps.reduce((a, b) => a + b, 0) / gaps.length).toFixed(2) : 0,
    p50: pct(0.5), p95: pct(0.95), max: pct(1), under22ms: gaps.filter(x => x < 22).length,
    from22to42ms: gaps.filter(x => x >= 22 && x <= 42).length, over42ms: gaps.filter(x => x > 42).length };
}
async function sample(duration = ms, raf = true) {
  const before = await metrics();
  await evaluate(c, `(() => {
    window.__perfTimes = { glRender: [], simFrame: [], glideFrame: [] }; window.__long.length = 0;
    window.__perf = new Proxy({}, { set(target, name, value) {
      const times = window.__perfTimes[name]; if (times && times.length < 1024) times.push(performance.now());
      target[name] = value; return true;
    } });
    window.__sampleStart = performance.now();
    window.__headStart = parseFloat(document.querySelector('.scrub-head')?.style.left ?? 'NaN') / 100;
  })()`);
  const pageGaps = raf ? await evaluate(c, `window.__frames(${duration})`) : (await sleep(duration), []);
  const end = await evaluate(c, `({ elapsedMs: performance.now() - window.__sampleStart, counters: { ...window.__perf },
    times: window.__perfTimes, long: window.__long, from: window.__headStart,
    to: parseFloat(document.querySelector('.scrub-head')?.style.left ?? 'NaN') / 100 })`);
  const after = await metrics(), seconds = end.elapsedMs / 1000;
  const pageTimes = [0]; for (const gap of pageGaps) pageTimes.push(pageTimes.at(-1) + gap);
  return { mainThreadMsPerS: +((after.TaskDuration - before.TaskDuration) * 1000 / seconds).toFixed(1),
    scriptMsPerS: +((after.ScriptDuration - before.ScriptDuration) * 1000 / seconds).toFixed(1),
    styleLayoutMsPerS: +((after.LayoutDuration - before.LayoutDuration + after.RecalcStyleDuration - before.RecalcStyleDuration) * 1000 / seconds).toFixed(1),
    elapsedMs: +end.elapsedMs.toFixed(1), timeline: { from: end.from, to: end.to },
    perS: Object.fromEntries(Object.entries(end.counters).map(([name, n]) => [name, +(n / seconds).toFixed(2)])),
    drawIntervals: intervals(end.times.glRender), poseIntervals: intervals(end.times.simFrame), glideIntervals: intervals(end.times.glideFrame),
    pageRafIntervals: intervals(pageTimes), longTasks: { n: end.long.length, totalMs: +end.long.reduce((a, b) => a + b, 0).toFixed(1) },
    // Retain bounded timestamps to distinguish presentation submissions from the independent page RAF.
    submissionTimes: end.times };
}
async function cool() { await c.send('Page.navigate', { url: 'about:blank' }); await sleep(1500); }
try {
  await c.send('Page.enable'); await c.send('Runtime.enable'); await c.send('Performance.enable');
  await c.send('Page.addScriptToEvaluateOnNewDocument', { source: PRELUDE + `
    window.__topic10Fps = Number(new URL(location.href).searchParams.get('perfFps'));
    if (location.pathname.startsWith('/astea/')) { localStorage.setItem('enbrioatlas:asks','0'); localStorage.setItem('enbrioatlas:fsAsk','0'); }
    Object.defineProperty(window, 'speechSynthesis', { configurable: true, value: undefined });
  ` });
  await c.send('Emulation.setDeviceMetricsOverride', { width: 1536, height: 960, deviceScaleFactor: 2, mobile: false });
  for (const row of cases) for (const [i, fps] of result.order.entries()) {
    const run = { ...row, fps, orderIndex: i }; result.runs.push(run);
    if (i < 2) {
      await open(row, fps); await sleep(1800);
      run.renderer = await evaluate(c, `(() => { const g = document.querySelector('.viewport-underlay canvas').getContext('webgl2'); const e = g.getExtension('WEBGL_debug_renderer_info'); return e ? g.getParameter(e.UNMASKED_RENDERER_WEBGL) : 'unknown'; })()`);
      assert.ok(!/unknown|swiftshader|software|llvmpipe/i.test(run.renderer), 'Hardware GPU unavailable: ' + run.renderer);
      run.info = await evaluate(c, 'window.__glInfo()'); assert.ok(run.info.w * run.info.h <= 2000000);
      run.hold = await sample(650, false); assert.equal(run.hold.perS.glRender ?? 0, 0, 'Held picture kept drawing');
      run.gpuMs = await evaluate(c, `(() => { const samples = [window.__glBench(8), window.__glBench(8), window.__glBench(8)].sort((a,b) => a-b); return +samples[1].toFixed(3); })()`);
      const shot = await c.send('Page.captureScreenshot', { format: 'png' });
      mkdirSync(join(out, String(fps), 'shots'), { recursive: true });
      writeFileSync(join(out, String(fps), 'shots', `${row.name}.png`), Buffer.from(shot.data, 'base64'));
    }
    await open(row, fps, true); await sleep(350);
    run.play = await sample();
    assert.ok((run.play.perS.simFrame ?? 0) <= fps + 2, 'Pose budget exceeded');
    assert.ok((run.play.perS.glRender ?? 0) <= fps + 2, 'Draw budget exceeded');
    console.log(`${row.name} ${fps} #${i}: CPU ${run.play.mainThreadMsPerS}, pose ${run.play.perS.simFrame ?? 0}, draw ${run.play.perS.glRender ?? 0}, draw interval ${run.play.drawIntervals.mean}ms`);
    save(); await cool();
  }
  if (!process.env.FILTER) {
    await open({ stage: 'zain-sinua', at: 0.45 }, 0, true); await sleep(350);
    result.default30Control = await sample(); save(); await cool();
  }
  if (!process.env.FILTER) for (const fps of [30, 40]) {
    const row = { fps }; result.classes.push(row);
    await open({ stage: 'bihotz-atalak', at: 0.3 }, fps, false, true);
    assert.ok(await evaluate(c, `(() => { const b = [...document.querySelectorAll('button')].find(b => b.textContent.trim().startsWith('Klasea hemendik')); if (!b) return false; b.click(); return true; })()`));
    await until('(window.__perf.glideFrame ?? 0) > 2'); row.motion = await sample(1500);
    assert.ok(row.motion.perS.glideFrame > 0 && row.motion.perS.glideFrame <= fps + 2, 'Class did not advance within its budget');
    row.reachedCadence = row.motion.perS.glideFrame > fps - 4;
    assert.ok(await evaluate(c, `(() => { const b = document.querySelector('section[aria-label="Klasea"] button[aria-label="Pausatu"]'); if (!b) return false; b.click(); return true; })()`));
    await sleep(900); row.paused = await sample(1000, false);
    assert.equal(row.paused.perS.glideFrame ?? 0, 0); assert.equal(row.paused.perS.glRender ?? 0, 0);
    save(); await cool();
  }
  if (!process.env.FILTER) {
    await open({ stage: 'zain-sinua', at: 0.45 }, 40, true); await sleep(350);
    await evaluate(c, `Object.defineProperty(document, 'hidden', { configurable: true, value: true }); document.dispatchEvent(new Event('visibilitychange'));`);
    await sleep(100); result.hidden40 = await sample(1000, false);
    assert.equal(result.hidden40.perS.simFrame ?? 0, 0); assert.equal(result.hidden40.perS.glTick ?? 0, 0);
    await evaluate(c, `Object.defineProperty(document, 'hidden', { configurable: true, value: false }); document.dispatchEvent(new Event('visibilitychange'));`);
    await sleep(350); result.resumed40 = await sample(1500);
    assert.ok(result.resumed40.perS.simFrame > 0 && result.resumed40.perS.simFrame <= 42);
    assert.ok(await evaluate(c, `(() => { const g = document.querySelector('.viewport-underlay canvas').getContext('webgl2'); const e = g.getExtension('WEBGL_lose_context'); if (!e) return false; e.loseContext(); return true; })()`));
    await until(`!document.querySelector('.viewport-underlay canvas') && !!document.querySelector('.stage3d-flat')`);
    result.lostContext40 = true;
    const loaded = c.once('Page.loadEventFired'); await c.send('Page.reload'); await loaded;
    await until(`!document.querySelector('.viewport-underlay canvas') && !!document.querySelector('.stage3d-flat')`);
    result.reloadFallback40 = true;
  }
  assert.deepEqual(result.errors, []); result.status = 'passed'; save();
} catch (e) { result.status = 'failed'; result.failure = String(e); save(); throw e; }
finally { c.close(); proc.kill(); }
