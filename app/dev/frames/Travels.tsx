'use client';

import { Defs } from '@/components/kit/Defs';
import { SceneContext, type SceneContextValue } from '@/components/kit/context';
import { isSpace, partsOf, nameOf, weeks } from '@/content/registry';
import { ViewTravel, travelPlan } from '@/components/shell/ViewTravel';
import type { StageDef, ViewDef } from '@/lib/sim/types';

const noop = () => {};

interface Hop {
  a: { st: StageDef; v: ViewDef; t: number };
  b: { st: StageDef; v: ViewDef; t: number };
}

/** Every view change playback makes in a week (within a stage and from one stage to the next). */
function hops(stages: StageDef[]): Hop[] {
  const out: Hop[] = [];
  let prev: { st: StageDef; v: ViewDef; t: number } | null = null;
  for (const st of stages) {
    let v = st.views[0];
    st.beats.forEach((b, k) => {
      if (b.view) v = st.views.find((x) => x.id === b.view) ?? v;
      const t = b.at + 0.001;
      if (prev && prev.v !== v) out.push({ a: prev, b: { st, v, t } });
      const end = st.beats[k + 1]?.at ?? 1;
      prev = { st, v, t: end - 0.01 };
    });
  }
  return out;
}

/** ?travel=1&w=7[&h=2]&p=0,0.2,0.45,0.7,1 — still frames of the camera move for each view change of the week. */
export function Travels({ q }: { q: URLSearchParams }) {
  const w = weeks.find((x) => x.week === Number(q.get('w') ?? 7)) ?? weeks[0];
  const ps = (q.get('p') ?? '0.15,0.45,0.75,0.92').split(',').map(Number);
  const only = q.get('h');
  const list = hops(w.stages);
  return (
    <div
      style={{
        background: '#0a0a0b',
        color: '#eee',
        padding: 8,
        fontFamily: 'system-ui',
      }}
    >
      <style>{'.kimu-root,.kimu-fab,[class*="kimu"],nextjs-portal{display:none!important}'}</style>
      {list.map((h, i) => {
        if (only !== null && Number(only) !== i) return null;
        const dayA = (h.a.st.dayRange[0] + h.a.st.dayRange[1]) / 2;
        const dayB = (h.b.st.dayRange[0] + h.b.st.dayRange[1]) / 2;
        const plan = travelPlan(w.week, dayB, h.a.v, h.b.v, dayA);
        const ctx = (st: StageDef, t: number, v: ViewDef): SceneContextValue => ({
          selected: null,
          hovered: null,
          focus: st.beats.findLast((b) => b.at <= t)?.focus ?? [],
          dimContext: !v.ownFocus,
          showLabels: true,
          quiz: false,
          quizFlash: null,
          nameOf,
          isSpace,
          partsOf,
          onSelect: noop,
          onHover: noop,
        });
        const A = h.a.v.scene;
        const B = h.b.v.scene;
        return (
          <section key={i} style={{ marginBottom: 14 }}>
            <h2 style={{ fontSize: 14, margin: '4px 0' }}>
              #{i} {h.a.st.id}/{h.a.v.id} → {h.b.st.id}/{h.b.v.id} {plan ? '' : '— (no travel)'}
            </h2>
            {plan && (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: `repeat(${q.get('cols') ?? 2}, 1fr)`,
                  gap: 6,
                }}
              >
                {ps.map((p) => (
                  <figure
                    key={p}
                    style={{
                      margin: 0,
                      background: '#000',
                      position: 'relative',
                    }}
                  >
                    <svg viewBox="0 0 1000 640" style={{ width: '100%', display: 'block' }} className="viewport-svg">
                      <Defs />
                      <ViewTravel
                        plan={plan}
                        progress={p}
                        onDone={noop}
                        old={
                          <SceneContext.Provider value={ctx(h.a.st, h.a.t, h.a.v)}>
                            <A t={h.a.t} reduced />
                          </SceneContext.Provider>
                        }
                      >
                        <SceneContext.Provider value={ctx(h.b.st, h.b.t, h.b.v)}>
                          <B t={h.b.t} reduced />
                        </SceneContext.Provider>
                      </ViewTravel>
                    </svg>
                    <figcaption
                      style={{
                        position: 'absolute',
                        left: 4,
                        top: 2,
                        fontSize: 11,
                        background: '#000a',
                        padding: '0 4px',
                      }}
                    >
                      p={p}
                    </figcaption>
                  </figure>
                ))}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}
