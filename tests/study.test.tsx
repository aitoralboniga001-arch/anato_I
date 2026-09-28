import { describe, expect, it } from 'vitest';
import { LIFE, MILESTONES, lifeOf, presenceAt } from '@/content/chronology';
import { generated } from '@/content/generate';
import { ancestry, layerOf, lineageIds } from '@/content/lineage';
import { structures, weeks } from '@/content/registry';
import { COMPETENCES, POOL } from '@/content/pool';
import { competenceLevel } from '@/components/shell/answers';
import { dirAt } from '@/components/shell/ImageLab';
import { needsBridge, type ViewSnap } from '@/components/shell/ViewBridge';

describe('chronology', () => {
  it('only dates structures that exist', () => {
    const missing = [...Object.keys(LIFE), ...MILESTONES.flatMap((m) => m.makes ?? []), ...Object.values(LIFE).flatMap((l) => l.becomes ?? [])].filter((id) => !structures.has(id));
    expect(missing).toEqual([]);
  });

  it('has consistent spans and links milestones to real stages', () => {
    for (const [id, l] of Object.entries(LIFE)) {
      if (l.to !== undefined) expect(l.to, id).toBeGreaterThanOrEqual(l.from);
    }
    for (const m of MILESTONES) {
      const w = weeks.find((x) => x.week === m.week);
      expect(w?.stages.some((s) => s.id === m.stage), `${m.week}/${m.stage}`).toBe(true);
    }
  });

  it('answers the exam dates the course asks for', () => {
    // Previous exams: fertilisation day 0, blastocyst without zona pellucida on day 6, notochord not
    // in week 2, neuropores ~25/~28, end of the embryonic period in week 8.
    expect(presenceAt('mintz-peluzidoa', 6)).toBe('desagertua');
    expect(presenceAt('notokorda', 13)).toBe('oraindik-ez');
    expect(LIFE['neuroporo-kraneala'].to).toBe(25);
    expect(LIFE['neuroporo-kaudala'].to).toBe(28);
    expect(LIFE['somitak'].from).toBe(20);
    expect(lifeOf('umetoki-tronpa')).toBeNull();
  });
});

describe('lineage', () => {
  it('only names structures that exist', () => {
    expect(lineageIds().filter((id) => !structures.has(id))).toEqual([]);
  });

  it('traces derivatives to the right germ layer', () => {
    expect(layerOf('giltzurrun-gaineko-muina')).toBe('ektodermoa');
    expect(layerOf('ornomuina')).toBe('ektodermoa');
    expect(layerOf('somitak')).toBe('mesodermo-intraenbrionarioa');
    expect(layerOf('faringe-poltsak')).toBe('endodermoa');
    expect(ancestry('ektodermoa').map((c) => c.id)).toContain('epiblastoa');
  });
});

describe('generated questions', () => {
  it('are well formed with one answer and feedback for every option', () => {
    const ids = new Set<string>();
    for (const q of generated) {
      expect(ids.has(q.id), q.id).toBe(false);
      ids.add(q.id);
      expect(q.options.length, q.id).toBeGreaterThanOrEqual(3);
      expect(new Set(q.options).size, q.id).toBe(q.options.length);
      expect(q.answer, q.id).toBeGreaterThanOrEqual(0);
      expect(q.why.length, q.id).toBe(q.options.length);
    }
    expect(generated.length).toBeGreaterThan(150);
  });

  it('never asks "what is absent" with a present answer', () => {
    for (const q of generated.filter((g) => g.skill === 'presentzia')) {
      const day = Number(q.question.match(/(\d+)\. egunean/)![1]);
      const idOf = (name: string) => [...structures.values()].find((s) => s.name === name)!.id;
      const answer = LIFE[idOf(q.options[q.answer])];
      expect(answer.from > day || (answer.to !== undefined && answer.to < day), q.id).toBe(true);
      q.options.forEach((o, k) => {
        if (k === q.answer) return;
        const l = LIFE[idOf(o)];
        expect(l.from <= day && (l.to === undefined || l.to >= day), `${q.id}: ${o}`).toBe(true);
      });
    }
  });
});

describe('question pool', () => {
  it('tags every question with a competence, and most with a concept that exists', () => {
    const ids = new Set<string>();
    for (const q of POOL) {
      expect(ids.has(q.id), `duplicate id ${q.id}`).toBe(false);
      ids.add(q.id);
      expect(COMPETENCES.some((c) => c.id === q.comp), q.id).toBe(true);
      if (q.concept) expect(structures.has(q.concept), `${q.id}: ${q.concept}`).toBe(true);
      expect(q.answer, q.id).toBeGreaterThanOrEqual(0);
      expect(q.answer, q.id).toBeLessThan(q.options.length);
    }
    expect(POOL.filter((q) => q.concept).length / POOL.length).toBeGreaterThan(0.9);
  });

  it('includes every micro-question under the id the guided dock records', () => {
    for (const w of weeks)
      for (const st of w.stages)
        st.beats.forEach((b, k) => {
          if (b.ask) expect(POOL.some((q) => q.id === `mikro:${w.week}/${st.id}:${k}`), `${st.id}:${k}`).toBe(true);
        });
  });

  it('never repeats the same generated question with the same options', () => {
    const seen = new Set<string>();
    for (const g of generated) {
      const sig = `${g.question}|${[...g.options].sort().join('|')}`;
      expect(seen.has(sig), g.id).toBe(false);
      seen.add(sig);
    }
  });

  it('keeps day answers and distractors in one unit (days vs weeks)', () => {
    for (const g of generated.filter((x) => x.skill === 'kronologia')) {
      const weeksLike = g.options.map((o) => /astea/.test(o));
      expect(new Set(weeksLike).size, g.id).toBe(1);
    }
  });
});

describe('competence mastery', () => {
  const at = (d: number) => d * 86_400_000 + 1000;
  it('is not reached by two right answers in a row', () => {
    const a = { q1: { streak: 2, right: 2, wrong: 0, due: 0, hist: [[at(1), 1], [at(1) + 5, 1]] as [number, 0 | 1][] } };
    expect(competenceLevel(a, ['q1', 'q2'])).toBe('sendotzen');
  });
  it('needs three right, two questions and two days', () => {
    const sameDay = { q1: { streak: 2, right: 2, wrong: 0, due: 0, hist: [[at(1), 1], [at(1) + 5, 1]] as [number, 0 | 1][] }, q2: { streak: 1, right: 1, wrong: 0, due: 0, hist: [[at(1) + 9, 1]] as [number, 0 | 1][] } };
    expect(competenceLevel(sameDay, ['q1', 'q2'])).toBe('sendotzen');
    const spaced = { ...sameDay, q2: { streak: 1, right: 1, wrong: 0, due: 0, hist: [[at(3), 1]] as [number, 0 | 1][] } };
    expect(competenceLevel(spaced, ['q1', 'q2'])).toBe('menderatuta');
    const slip = { ...spaced, q1: { ...spaced.q1, hist: [...spaced.q1.hist, [at(4), 0]] as [number, 0 | 1][] } };
    expect(competenceLevel(slip, ['q1', 'q2'])).toBe('lantzen');
  });
});

describe('image lab orientation', () => {
  const o = { top: 'Dortsala (amniosa)', bottom: 'Bentrala', left: 'Kraneala', right: 'Kaudala' };
  it('follows the figure when it is turned clockwise', () => {
    expect(dirAt(o, 'top', 0, false)).toBe('Dortsala');
    expect(dirAt(o, 'top', 90, false)).toBe('Kraneala');
    expect(dirAt(o, 'top', 180, false)).toBe('Bentrala');
    expect(dirAt(o, 'top', 270, false)).toBe('Kaudala');
    expect(dirAt(o, 'right', 90, false)).toBe('Dortsala');
  });
  it('swaps left and right in a mirror, and infers an edge from its opposite', () => {
    expect(dirAt(o, 'left', 0, true)).toBe('Kaudala');
    expect(dirAt(o, 'top', 90, true)).toBe('Kaudala');
    expect(dirAt({ top: 'Kraneala' }, 'bottom', 0, false)).toBe('Kaudala');
    expect(dirAt({ top: 'Endometrioa' }, 'top', 0, false)).toBeNull();
  });
});

describe('definition and location questions', () => {
  it('never show the answer inside the question', () => {
    for (const g of generated.filter((x) => x.skill === 'definizioa')) {
      const name = g.options[g.answer].toLowerCase().replace(/(ak|a)$/, '');
      expect(g.question.toLowerCase().includes(name), g.id).toBe(false);
    }
  });
  it('offer four different places', () => {
    for (const g of generated.filter((x) => x.skill === 'kokapena')) expect(new Set(g.options).size, g.id).toBe(4);
  });
});

describe('view bridge', () => {
  const snap = (week: number, day: number, plane: ViewSnap['plane']): ViewSnap => ({ key: `${week}/${plane}`, week, stageTitle: '', label: '', plane, day });
  it('explains a change of cut or of object, not a zoom or a diagram', () => {
    expect(needsBridge(snap(3, 16, 'sagitala'), snap(3, 16, 'zeharkakoa'))).toBe(true);
    expect(needsBridge(snap(2, 13, 'sagitala'), snap(3, 15, 'sagitala'))).toBe(true);
    expect(needsBridge(snap(3, 16, 'sagitala'), snap(3, 16, 'xehetasuna'))).toBe(false);
    expect(needsBridge(snap(3, 16, 'sagitala'), snap(3, 16, 'sagitala'))).toBe(false);
    expect(needsBridge(snap(4, 25, 'zeharkakoa'), snap(4, 25, 'eskema'))).toBe(false);
  });

  it('only switches a step to a view its stage has', () => {
    const bad = weeks.flatMap((w) => w.stages.flatMap((s) => s.beats.filter((b) => b.view && !s.views.some((v) => v.id === b.view)).map((b) => `${w.week}/${s.id}@${b.at}`)));
    expect(bad).toEqual([]);
  });
});
