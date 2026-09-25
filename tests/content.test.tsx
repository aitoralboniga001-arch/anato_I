import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { SceneContext, type SceneContextValue } from '@/components/kit/context';
import { structures, weeks } from '@/content/registry';

const ctx: SceneContextValue = {
  selected: null,
  hovered: null,
  focus: [],
  showLabels: true,
  quiz: false,
  quizFlash: null,
  nameOf: (id) => structures.get(id)?.name ?? `??${id}`,
  onSelect: () => {},
  onHover: () => {},
};

const SAMPLES = [0, 0.1, 0.25, 0.4, 0.5, 0.6, 0.75, 0.9, 1];

describe('structure registry', () => {
  it('has no duplicate ids across weeks (each id is owned by one week)', () => {
    const seen = new Map<string, number>();
    const dups: string[] = [];
    for (const w of weeks)
      for (const s of w.structures) {
        if (seen.has(s.id)) dups.push(`${s.id} (${seen.get(s.id)}. astea eta ${w.week}. astea)`);
        else seen.set(s.id, w.week);
      }
    expect(dups).toEqual([]);
  });

  it('related ids exist', () => {
    const missing: string[] = [];
    for (const s of structures.values()) for (const r of s.related ?? []) if (!structures.has(r)) missing.push(`${s.id} → ${r}`);
    expect(missing).toEqual([]);
  });
});

for (const w of weeks) {
  describe(`${w.week}. astea`, () => {
    it('stages reference known structures and have ordered beats', () => {
      const missing: string[] = [];
      for (const st of w.stages) {
        for (const id of st.structures) if (!structures.has(id)) missing.push(`${st.id}.structures: ${id}`);
        for (const b of st.beats) for (const id of [...(b.focus ?? []), ...(b.tour ?? [])]) if (!structures.has(id)) missing.push(`${st.id}.beat@${b.at}: ${id}`);
        const ats = st.beats.map((b) => b.at);
        expect(ats, `${st.id} beats sorted`).toEqual([...ats].sort((a, b) => a - b));
        expect(st.beats[0]?.at, `${st.id} first beat at 0`).toBe(0);
        expect(st.views.length, `${st.id} has views`).toBeGreaterThan(0);
      }
      expect(missing).toEqual([]);
    });

    it('quiz answers are valid', () => {
      for (const q of w.quiz) {
        expect(q.answer, q.id).toBeGreaterThanOrEqual(0);
        expect(q.answer, q.id).toBeLessThan(q.options.length);
        if (q.stageId) expect(w.stages.some((s) => s.id === q.stageId), `${q.id} stageId`).toBe(true);
      }
    });

    for (const st of w.stages)
      for (const v of st.views)
        it(`${st.id} / ${v.id} renders at every t with only known ids`, () => {
          const Scene = v.scene;
          const unknown = new Set<string>();
          for (const t of SAMPLES) {
            const html = renderToStaticMarkup(
              <SceneContext.Provider value={ctx}>
                <svg viewBox="0 0 1000 640">
                  <Scene t={t} reduced={false} />
                </svg>
              </SceneContext.Provider>,
            );
            expect(html, `t=${t}`).not.toMatch(/NaN|undefined|Infinity/);
            for (const m of html.matchAll(/data-(?:part|label)="([^"]+)"/g)) if (!structures.has(m[1])) unknown.add(m[1]);
          }
          expect([...unknown]).toEqual([]);
        });
  });
}
