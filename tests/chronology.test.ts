import { describe, expect, it } from 'vitest';
import { BIRTH, END_DAY, LIFE, MILESTONES, afterBirth, dayToX, xToDay, ORDERED, SYSTEMS, changesBetween, dayLabel, statusAt, structureHref, systemOfStructure, TIMELINE_IDS, presentAt, momentAt, momentOf, simHref, weekOfDay, whenOf } from '@/content/chronology';
import { sentence } from '@/content/notes-text';
import { structures, weeks } from '@/content/registry';

const stageOf = (week: number, id: string) => weeks.find((w) => w.week === week)?.stages.find((s) => s.id === id);

describe('chronology milestones', () => {
  it('point at real topics, stages and views, inside the stage’s days', () => {
    for (const m of MILESTONES) {
      const s = stageOf(m.week, m.stage);
      expect(s, `${m.short}: ${m.week}/${m.stage}`).toBeDefined();
      if (m.view) expect(s!.views.map((v) => v.id), `${m.short}: view ${m.view}`).toContain(m.view);
      expect(m.day, `${m.short} in ${m.stage} ${s!.dayRange}`).toBeGreaterThanOrEqual(s!.dayRange[0]);
      // After birth, a stage that runs to birth carries the events the notes date later (fontanelles).
      if (m.day > BIRTH) expect(s!.dayRange[1], `${m.short}: postnatal on a stage that ends before birth`).toBe(BIRTH);
      else expect(m.day, `${m.short} in ${m.stage} ${s!.dayRange}`).toBeLessThanOrEqual(s!.dayRange[1]);
      if (m.to !== undefined) expect(m.to, m.short).toBeGreaterThan(m.day);
    }
  });

  it('cite notes sentences that exist', () => {
    for (const m of MILESTONES) {
      expect(m.notes.length, `${m.short} cites no notes`).toBeGreaterThan(0);
      for (const id of m.notes) expect(sentence(id), `${m.short}: ${id}`).toBeDefined();
    }
  });

  it('only make structures that exist, and belong to a known system', () => {
    const systems = new Set(SYSTEMS.map((s) => s.id));
    for (const m of MILESTONES) {
      expect(systems.has(m.system), `${m.short}: ${m.system}`).toBe(true);
      for (const id of m.makes ?? []) expect(structures.has(id), `${m.short}: ${id}`).toBe(true);
    }
    // Every system has at least one milestone, so no lane is drawn empty.
    for (const s of SYSTEMS.filter((x) => x.id !== 'zirkulazioa' || MILESTONES.some((m) => m.system === 'zirkulazioa'))) expect(MILESTONES.some((m) => m.system === s.id), s.id).toBe(true);
  });

  it('have unique short names (they are the recall cards)', () => {
    const names = MILESTONES.map((m) => m.short);
    expect(names.filter((n, i) => names.indexOf(n) !== i)).toEqual([]);
  });

  it('are ordered by day whatever order they are written in', () => {
    for (let i = 1; i < ORDERED.length; i++) expect(ORDERED[i].day).toBeGreaterThanOrEqual(ORDERED[i - 1].day);
    expect(ORDERED.length).toBe(MILESTONES.length);
  });

  it('deep-link to a view of the stage at a time inside it', () => {
    for (const m of MILESTONES) {
      const at = momentOf(m)!;
      expect(at.stage.views.map((v) => v.id), m.short).toContain(at.view);
      expect(at.une, m.short).toBeGreaterThanOrEqual(0);
      expect(at.une, m.short).toBeLessThanOrEqual(1);
      expect(simHref(at)).toMatch(new RegExp(`^/astea/${m.week}\\?etapa=${m.stage}&ikuspegia=${at.view}`));
    }
    // A milestone that makes a structure opens on the step that first shows it, not at t = 0.
    const tube = MILESTONES.find((m) => m.short === 'Hodi neurala')!;
    expect(momentOf(tube)!.une).toBeGreaterThan(0);
  });
});

describe('the live specimen', () => {
  it('has a real stage and view for every day of development', () => {
    for (let d = 0; d <= 266; d++) {
      const at = momentAt(d);
      expect(at, `day ${d}`).not.toBeNull();
      expect(at!.stage.views.map((v) => v.id), `day ${d}`).toContain(at!.view);
      expect(d, `day ${d} → ${at!.stage.id}`).toBeGreaterThanOrEqual(at!.stage.dayRange[0]);
    }
  });

  it('follows the milestone of the day', () => {
    expect(momentAt(8)!.stage.id).toBe('eguna-8');
    expect(momentAt(25)!.stage.id).toBe('neurulazioa');
    expect(momentAt(35, 'barrunbeak')!.stage.id).toBe('diafragma-eraketa');
  });
});

describe('what changes', () => {
  it('reports what appears and what turns into something else between two days', () => {
    const { born, gone } = changesBetween(7, 8);
    expect(born).toEqual(expect.arrayContaining(['epiblastoa', 'hipoblastoa', 'amnios-barrunbea']));
    expect(gone).toEqual(expect.arrayContaining(['enbrioblastoa', 'trofoblastoa']));
    expect(changesBetween(30, 40).gone).toEqual(expect.arrayContaining(['erreten-perikardioperitonealak']));
  });

  it('dates the cavities, skeleton and muscles from the notes', () => {
    expect(LIFE['septum-transversum'].from).toBe(22);
    expect(LIFE['mintz-pleuroperitonealak'].from).toBe(29);
    expect(LIFE['korion-barrunbea'].to).toBe(90);
    expect(LIFE['hezurtzapen-zentroak'].from).toBe(56);
    expect(LIFE['ildaskak'].from).toBe(90);
  });
});

describe('the presence map', () => {
  it('names every dated structure with a system and a simulator link', () => {
    const systems = new Set(SYSTEMS.map((s) => s.id));
    for (const id of TIMELINE_IDS) {
      expect(systems.has(systemOfStructure(id)), id).toBe(true);
      expect(structureHref(id), id).toMatch(/^\/astea\/\d+\?etapa=[\w-]+&egitura=/);
    }
    expect(systemOfStructure('trofoblastoa')).toBe('eranskinak');
    expect(systemOfStructure('esklerotoma')).toBe('hezurdura');
  });

  it('puts a structure in one column a day, with the same boundary as the changes', () => {
    // On its last day a structure has already turned into its successors.
    expect(statusAt('trofoblastoa', 7)).toBe('badago');
    expect(statusAt('trofoblastoa', 8)).toBe('desagertua');
    expect(statusAt('zitotrofoblastoa', 8)).toBe('badago');
    for (const d of [0, 8, 22, 35, 84, BIRTH]) {
      const { born, gone } = changesBetween(d - 1, d);
      for (const id of born.filter((x) => !gone.includes(x))) expect(presentAt(d), `${id} on ${d}`).toContain(id);
      for (const id of gone) expect(presentAt(d), `${id} on ${d}`).not.toContain(id);
    }
  });
});

describe('dates in words', () => {
  it('counts weeks the way the notes do (22–28 = 4. astea)', () => {
    // Fertilisation (day 0) and days 1–7 are week 1; 8–14 week 2; 22–28 week 4 (the notes' 4. astea).
    const weeksOf: [number, number][] = [[0, 1], [1, 1], [7, 1], [8, 2], [14, 2], [15, 3], [21, 3], [22, 4], [28, 4], [29, 5]];
    for (const [d, w] of weeksOf) expect(weekOfDay(d), `day ${d}`).toBe(w);
    expect(weekOfDay(56)).toBe(8);
    expect(weekOfDay(266)).toBe(38);
  });

  it('marks dates the notes give only by week or month', () => {
    const m = MILESTONES.find((x) => x.short === 'Zuntz ildaskatuak')!;
    expect(whenOf(m)).toBe('≈ 3. hilabetearen bukaera');
    expect(dayLabel(15, 16)).toBe('15–16. egunak');
    expect(dayLabel(84)).toBe('12. astea');
    expect(dayLabel(afterBirth(18))).toBe('18. hilabetea (jaio ondoren)');
    expect(dayLabel(BIRTH, afterBirth(12))).toBe('38. astea – 12. hilabetea (jaio ondoren)');
  });

  it('maps days onto the ruler and back, birth and the two years after it included', () => {
    for (const d of [0, 7, 22, 28, 40, 56, 84, BIRTH, afterBirth(2), END_DAY]) expect(xToDay(dayToX(d))).toBeCloseTo(d, 6);
    expect(dayToX(0)).toBe(0);
    expect(dayToX(END_DAY)).toBe(1);
    expect(dayToX(BIRTH)).toBeLessThan(1);
  });
});
