'use client';

import { useEffect, useRef, useState } from 'react';
import { Defs } from '@/components/kit/Defs';
import { SceneContext, type SceneContextValue } from '@/components/kit/context';
import { isSpace, partsOf, nameOf, weeks } from '@/content/registry';
import type { StageDef } from '@/lib/sim/types';

const noop = () => {};
const RW = 200;
const RH = 128;

/**
 * Silent test: with no labels and no narration, does the picture itself change during each step?
 * Each step is drawn at its start and at its end (in the view playback shows it in) and the two are
 * compared pixel by pixel. Highlights are CSS, so they do not count: only what is drawn moves.
 * ?silent=1&w=7 (one topic at a time).
 */
function steps(st: StageDef) {
  let view = st.views[0].id;
  return st.beats.map((b, k) => {
    if (b.view && st.views.some((v) => v.id === b.view)) view = b.view;
    const end = st.beats[k + 1]?.at ?? 1;
    const t1 = k + 1 < st.beats.length ? end - Math.min(0.035, (end - b.at) * 0.25) - 1e-4 : 1;
    return { k, t0: b.at + 1e-4, t1, view, idea: b.idea ?? b.text.split('. ')[0] };
  });
}

async function raster(svg: SVGSVGElement): Promise<Float32Array> {
  const clone = svg.cloneNode(true) as SVGSVGElement;
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  clone.setAttribute('width', String(RW));
  clone.setAttribute('height', String(RH));
  const url = URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(clone)], { type: 'image/svg+xml' }));
  const img = new Image();
  img.src = url;
  await img.decode();
  const c = document.createElement('canvas');
  c.width = RW;
  c.height = RH;
  const g = c.getContext('2d', { willReadFrequently: true })!;
  g.fillStyle = '#000';
  g.fillRect(0, 0, RW, RH);
  g.drawImage(img, 0, 0, RW, RH);
  URL.revokeObjectURL(url);
  const d = g.getImageData(0, 0, RW, RH).data;
  const out = new Float32Array(RW * RH * 3);
  for (let i = 0, j = 0; i < d.length; i += 4) {
    out[j++] = d[i] / 255;
    out[j++] = d[i + 1] / 255;
    out[j++] = d[i + 2] / 255;
  }
  return out;
}

/** Mean colour change (0..1) and the share of the frame that changed visibly. */
function diff(a: Float32Array, b: Float32Array) {
  let sum = 0;
  let changed = 0;
  for (let i = 0; i < a.length; i += 3) {
    const d = (Math.abs(a[i] - b[i]) + Math.abs(a[i + 1] - b[i + 1]) + Math.abs(a[i + 2] - b[i + 2])) / 3;
    sum += d;
    if (d > 0.06) changed++;
  }
  return { mean: sum / (a.length / 3), area: changed / (a.length / 3) };
}

interface Row {
  key: string;
  stage: string;
  k: number;
  view: string;
  idea: string;
  area: number;
  mean: number;
}

export function Silent({ q }: { q: URLSearchParams }) {
  const w = weeks.find((x) => x.week === Number(q.get('w') ?? 7)) ?? weeks[0];
  const host = useRef<HTMLDivElement>(null);
  const [rows, setRows] = useState<Row[] | null>(null);
  const ctx: SceneContextValue = {
    selected: null,
    hovered: null,
    focus: [],
    showLabels: false,
    quiz: false,
    quizFlash: null,
    nameOf,
    isSpace,
    partsOf,
    onSelect: noop,
    onHover: noop,
  };
  const all = w.stages.flatMap((st) => steps(st).map((s) => ({ st, s, View: st.views.find((v) => v.id === s.view)!.scene })));

  useEffect(() => {
    let live = true;
    const id = setTimeout(async () => {
      const out: Row[] = [];
      for (const fig of host.current?.querySelectorAll<HTMLElement>('figure[data-key]') ?? []) {
        const [a, b] = fig.querySelectorAll('svg');
        const r = diff(await raster(a), await raster(b));
        out.push({ key: fig.dataset.key!, stage: fig.dataset.stage!, k: Number(fig.dataset.k), view: fig.dataset.view!, idea: fig.dataset.idea!, ...r });
      }
      if (live) setRows(out);
    }, 300);
    return () => {
      live = false;
      clearTimeout(id);
    };
  }, []);

  const byKey = new Map(rows?.map((r) => [r.key, r]));
  return (
    <div style={{ background: '#0a0a0b', color: '#eee', padding: 8, fontFamily: 'system-ui', fontSize: 12 }}>
      <pre id="silent">
        {rows
          ? rows.map((r) => `${r.area < 0.02 ? '!!' : r.area < 0.05 ? '! ' : '  '} ${r.stage} #${r.k + 1} [${r.view}] area=${(r.area * 100).toFixed(1)}% mean=${(r.mean * 100).toFixed(2)} · ${r.idea}`).join('\n')
          : 'measuring…'}
      </pre>
      <div ref={host} style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 6 }}>
        {all.map(({ st, s, View }) => {
          const key = `${st.id}/${s.k}`;
          const r = byKey.get(key);
          return (
            <figure key={key} data-key={key} data-stage={st.id} data-k={s.k} data-view={s.view} data-idea={s.idea} style={{ margin: 0, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, background: '#000', position: 'relative' }}>
              {[s.t0, s.t1].map((t) => (
                <svg key={t} viewBox="0 0 1000 640" style={{ width: '100%', display: 'block' }} className="viewport-svg">
                  <Defs />
                  <SceneContext.Provider value={ctx}>
                    <View t={t} reduced />
                  </SceneContext.Provider>
                </svg>
              ))}
              <figcaption style={{ position: 'absolute', left: 4, top: 2, background: '#000c', padding: '0 4px' }}>
                {st.id} #{s.k + 1} [{s.view}] {r ? `${(r.area * 100).toFixed(1)}%` : ''}
              </figcaption>
            </figure>
          );
        })}
      </div>
    </div>
  );
}
