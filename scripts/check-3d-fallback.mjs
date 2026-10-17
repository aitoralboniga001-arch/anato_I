// Production browser regression: bounded buffer on resize, real context loss, then a view switch.
// node scripts/check-3d-fallback.mjs http://localhost:3113 docs/perf/polish-batch6/fallback.json
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import assert from 'node:assert/strict';
import { launch, cdp, evaluate, sleep, PRELUDE } from './perf-topic10.mjs';
const [base = 'http://localhost:3113', dest = 'docs/perf/polish-batch6/fallback.json'] = process.argv.slice(2);
const profile = join(tmpdir(), `fallback-3d-${process.pid}`);
mkdirSync(profile, { recursive: true });
const { proc, ws } = await launch(profile);
const c = cdp(ws);
await c.open;
const result = { date: new Date().toISOString(), errors: [] };
c.on('Runtime.exceptionThrown', e => result.errors.push(e.exceptionDetails?.exception?.description ?? e.exceptionDetails?.text));
async function until(expr) {
  for (let i = 0; i < 200; i++) {
    if (await evaluate(c, expr)) return;
    await sleep(100);
  }
  throw new Error('Condition not met: ' + expr);
}
try {
  await c.send('Page.enable');
  await c.send('Runtime.enable');
  await c.send('Page.addScriptToEvaluateOnNewDocument', { source: PRELUDE });
  await c.send('Emulation.setDeviceMetricsOverride', { width: 1536, height: 960, deviceScaleFactor: 2, mobile: false });
  const loaded = c.once('Page.loadEventFired');
  await c.send('Page.navigate', { url: `${base}/astea/10?etapa=atal-bentrikularra&ikuspegia=3d&une=0.55` });
  await loaded;
  await until(`!!document.querySelector('.stage3d.is-gl')`);
  for (const [width, height] of [[2400, 1600], [1536, 960]]) {
    await c.send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 2, mobile: false });
    await sleep(1000);
    const info = await evaluate(c, 'window.__glInfo()');
    assert.ok(info.w * info.h <= 3200000, JSON.stringify(info));
    result[`${width}x${height}`] = info;
  }
  assert.ok(await evaluate(c, `(() => { const g = document.querySelector('.viewport-underlay canvas').getContext('webgl2'); const ext = g.getExtension('WEBGL_lose_context'); if (!ext) return false; ext.loseContext(); return true; })()`));
  await until(`!document.querySelector('.viewport-underlay canvas') && document.querySelectorAll('.stage3d-flat').length > 0`);
  result.lostContextFallback = true;
  // A view switch stays in this document, so the lost-context latch must survive remounting Stage3D.
  for (const label of ['Mozketa frontala', 'Bihotz lakioa 3D']) {
    assert.ok(await evaluate(c, `(() => { const b = [...document.querySelectorAll('button')].find(b => b.textContent.trim() === ${JSON.stringify(label)}); if (!b) return false; b.click(); return true; })()`), label);
    await sleep(1500);
  }
  await until(`!document.querySelector('.viewport-underlay canvas') && document.querySelectorAll('.stage3d-flat').length > 0`);
  result.viewSwitchFallback = true;
  result.flatParts = await evaluate(c, `document.querySelectorAll('.stage3d-flat').length`);
  assert.deepEqual(result.errors, []);
  mkdirSync(dirname(resolve(dest)), { recursive: true });
  writeFileSync(resolve(dest), JSON.stringify(result, null, 2));
  console.log(JSON.stringify(result));
} finally {
  c.close();
  proc.kill();
}
