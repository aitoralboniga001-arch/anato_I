'use client';

import { useEffect, useState } from 'react';
import { Defs } from '@/components/kit/Defs';
import { SceneContext, type SceneContextValue } from '@/components/kit/context';
import { isSpace, partsOf, nameOf, weeks } from '@/content/registry';
import { Audit } from './Audit';
import { Travels } from './Travels';

const noop = () => {};

/** ?w=3&s=0&v=sagitala&mode=done|mid|both&cols=3&k=2 */
export function Frames() {
  const [q, setQ] = useState<URLSearchParams | null>(null);
  useEffect(() => {
    // A timer, not a frame callback: hidden panes (batch audits) throttle animation frames.
    const id = setTimeout(() => setQ(new URLSearchParams(window.location.search)), 0);
    // The hover and arrow probes (public/dev-probes.js) need to know which structures are wholes of other parts.
    Object.assign(window, { __partsOf: partsOf, __isSpace: isSpace });
    const s = document.createElement('script');
    s.src = '/dev-probes.js';
    document.head.appendChild(s);
    return () => {
      clearTimeout(id);
      s.remove();
    };
  }, []);
  if (!q) return null;
  if (q.get('audit')) return <Audit q={q} />;
  if (q.get('travel')) return <Travels q={q} />;
  if (q.get('index'))
    return (
      <pre id="index" style={{ color: '#ddd', fontSize: 12 }}>
        {weeks
          .flatMap((wk) => wk.stages.map((s, i) => `W${wk.week} s${i} ${s.id} beats=${s.beats.length} dur=${s.duration} views=${s.views.map((v) => v.id + (v.ownFocus ? '*' : '')).join(',')}`))
          .join('\n')}
      </pre>
    );
  const w =weeks.find((x) => x.week === Number(q.get('w') ?? 1)) ?? weeks[0];
  const sIdx = q.get('s');
  const vId = q.get('v');
  const kOnly = q.get('k');
  const mode = q.get('mode') ?? 'done';
  const cols = Number(q.get('cols') ?? 3);
  const labels = q.get('labels') !== '0';
  const ts = q.get('t')?.split(',').map(Number);
  const stages = sIdx !== null ? [w.stages[Number(sIdx)]] : w.stages;
  return (
    <div style={{ background: '#0a0a0b', color: '#eee', padding: 8, fontFamily: 'system-ui' }}>
      <style>{'.kimu-root,.kimu-fab,[class*="kimu"],nextjs-portal{display:none!important}'}</style>
      {stages.map((st) =>
        st.views
          .filter((v) => !vId || v.id === vId)
          .map((v) => {
            const Scene = v.scene;
            const frames: { t: number; k: number; tag: string }[] = [];
            if (ts) ts.forEach((t) => frames.push({ t, k: st.beats.findLastIndex((b) => b.at <= t), tag: `t=${t}` }));
            else
              st.beats.forEach((b, k) => {
                if (kOnly !== null && Number(kOnly) !== k) return;
                const end = st.beats[k + 1]?.at ?? 1;
                const done = k + 1 < st.beats.length ? end - Math.min(0.035, (end - b.at) * 0.25) - 1e-4 : 1;
                if (mode !== 'done') frames.push({ t: b.at + (done - b.at) * 0.45, k, tag: `${k + 1}·mid` });
                if (mode !== 'mid') frames.push({ t: done, k, tag: `${k + 1}·done` });
              });
            return (
              <section key={`${st.id}/${v.id}`} style={{ marginBottom: 14 }}>
                <h2 style={{ fontSize: 14, margin: '4px 0' }}>
                  {w.week} · {st.id} · {v.id} <span style={{ opacity: 0.6 }}>({v.label})</span>
                </h2>
                <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 6 }}>
                  {frames.map((f) => {
                    const beat = st.beats[Math.max(0, f.k)];
                    const ctx: SceneContextValue = {
                      selected: null,
                      hovered: null,
                      focus: beat?.focus ?? [],
                      dimContext: !v.ownFocus,
                      showLabels: labels,
                      quiz: false,
                      quizFlash: null,
                      nameOf,
                      isSpace,
                      partsOf,
                      onSelect: noop,
                      onHover: noop,
                    };
                    return (
                      <figure key={f.tag} style={{ margin: 0, background: '#000', position: 'relative' }}>
                        <svg viewBox="0 0 1000 640" style={{ width: '100%', display: 'block' }} className="viewport-svg">
                          <Defs />
                          <SceneContext.Provider value={ctx}>
                            <Scene t={f.t} reduced />
                          </SceneContext.Provider>
                        </svg>
                        <figcaption style={{ position: 'absolute', left: 4, top: 2, fontSize: 11, background: '#000a', padding: '0 4px' }}>
                          {f.tag} t={f.t.toFixed(3)}
                        </figcaption>
                      </figure>
                    );
                  })}
                </div>
              </section>
            );
          }),
      )}
    </div>
  );
}
