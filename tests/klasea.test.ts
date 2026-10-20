import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { expandNotes, sentence, sentenceText } from '@/content/notes-text';
import { POOL } from '@/content/pool';
import { getWeek, nameOf, partsOf, structures } from '@/content/registry';
import { IMPORTANCE_W7 } from '@/content/klasea/importance/w7';
import { IMPORTANCE_W9 } from '@/content/klasea/importance/w9';
import { IMPORTANCE_W10 } from '@/content/klasea/importance/w10';
import { IMPORTANCE_W11 } from '@/content/klasea/importance/w11';
import { LESSONS } from '@/content/klasea';
import { computeImportance, type Importance } from '@/lib/klasea/importance';
import { stepsOf } from '@/lib/klasea/engine';
import { respellWord, spokenText } from '@/lib/klasea/speak-eu';
import { speakSeconds } from '@/lib/klasea/voice';
import type { BoardTable, Check, Lesson, Line } from '@/lib/klasea/types';
import type { StageDef } from '@/lib/sim/types';

/**
 * The class needs no human review because it cannot drift from the notes: every line is held here to the
 * sentences it cites (numbers, directions, names), to the frames it is said over, and to the core it
 * must cover. Plan: docs/klasea-plan.md §5–6.
 */

// ———————————————————————————— names ————————————————————————————

/** A structure's names as they are said (case, brackets and the final article aside), longest first. */
const stem = (n: string) => n.toLowerCase().replace(/\s*\([^)]*\)/g, '').replace(/[()]/g, '').replace(/a$/, '').trim();
/** Every structure's said names, compiled once. */
const NAMES = [...structures.values()].flatMap((s) =>
  [s.name, ...(s.aka ?? [])]
    .map(stem)
    .filter((n) => n.length > 4)
    // Names are plain words (letters, spaces, hyphens, dots): escaped anyway.
    .map((n) => ({ id: s.id, re: new RegExp(`(?<!\\p{L})${n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'gu') })),
);

function namesSaid(text: string, ids: readonly string[]): { span: string; ids: string[] }[] {
  const said = text.toLowerCase();
  // Every structure takes its span (a longer name from another stage wins), then only these ids are kept.
  const spans = NAMES.flatMap(({ id, re }) => [...said.matchAll(re)].map((m) => ({ id, a: m.index!, b: m.index! + m[0].length }))).sort((p, q) => q.b - q.a - (p.b - p.a));
  const taken: { a: number; b: number; ids: string[] }[] = [];
  for (const sp of spans) {
    const same = taken.find((q) => q.a === sp.a && q.b === sp.b);
    if (same) {
      if (!same.ids.includes(sp.id)) same.ids.push(sp.id);
      continue;
    }
    if (taken.some((q) => sp.a < q.b && sp.b > q.a)) continue;
    taken.push({ a: sp.a, b: sp.b, ids: [sp.id] });
  }
  const keep = new Set(ids);
  return taken.map((t) => ({ span: said.slice(t.a, t.b), ids: t.ids.filter((id) => keep.has(id)) })).filter((t) => t.ids.length);
}

/** The text with the stage's structure names blanked (a name's own "dortsal" or "eskuineko" is not a direction). */
const withoutNames = (text: string, ids: readonly string[]) => {
  let out = text.toLowerCase();
  for (const { span } of namesSaid(text, ids)) out = out.replace(span, ' ');
  return out;
};

// ———————————————————————————— numbers and directions ————————————————————————————

const digits = (text: string) => new Set(text.match(/\d+/g) ?? []);

/** Direction stems in equivalence classes (§6 G3): a class said must be in the cited sentences. */
const DIRECTIONS: [string, RegExp][] = [
  ['eskuin', /^(eskuin|eskum|eskub)/],
  ['ezker', /^ezker/],
  ['goi', /^(zefal|kraneal|goi|gora)/],
  ['behe', /^(kaudal|behe)/],
  ['aurre', /^(aurre|bentral)/],
  ['atze', /^(atze|dortsal)/],
  ['erdi', /^(erdi|medial)/],
  ['albo', /^(albo|later)/],
];
const directions = (text: string) =>
  new Set(
    (text.toLowerCase().match(/\p{L}+/gu) ?? [])
      .filter((w) => w !== 'gorabehera')
      .flatMap((w) => DIRECTIONS.filter(([, re]) => re.test(w)).map(([k]) => k)),
  );

/** Every word with an x the class says, and how it sounds: /ks/ (kept) or Basque /ʃ/ (respelled). */
const X_WORDS: Record<string, 'ks' | 'basque'> = {
  kaixo: 'basque',
  xixkuak: 'basque',
  plexuaren: 'ks',
  oxigenoak: 'ks',
  xixkuen: 'basque',
  toraxera: 'ks',
  torax: 'ks',
  oxigenatua: 'ks',
  oxigenatuarekin: 'ks',
  oxigeno: 'ks',
  oxigenoa: 'ks',
  oxigenorik: 'ks',
  toraxeko: 'ks',
  kuxin: 'basque',
  kuxinak: 'basque',
  kuxinaren: 'basque',
  kuxinetatik: 'basque',
  kuxinarekin: 'basque',
  kuxinek: 'basque',
  ixten: 'basque',
  oxigenatzera: 'ks',
  urdinxka: 'basque',
  pixka: 'basque',
  toraxetik: 'ks',
  toraxa: 'ks',
  toraxaren: 'ks',
  paraxiala: 'ks',
  paraxialetik: 'ks',
  gaixotasunetan: 'basque',
  toraxean: 'ks',
  primaxiala: 'ks',
  primaxialak: 'ks',
  primaxialetik: 'ks',
  abaxiala: 'ks',
  abaxialak: 'ks',
  abaxialetik: 'ks',
  epaxialak: 'ks',
  hipaxialak: 'ks',
  axoiak: 'ks',
};

// ———————————————————————————— each topic's class ————————————————————————————

interface Topic {
  week: number;
  importance: Record<string, Importance>;
  /** Sentences a student needs in order to understand the topic, whatever the rules say. */
  pinned: string[];
  /** Contrast checks from this chunk on, at least one per chunk. */
  contrastFrom: string;
  /**
   * Lit by a line though no step of the stage had lit or toured it by then: drawn and named in that view
   * anyway. `chunk#line/id` → where it is drawn.
   */
  shown: Record<string, string>;
  /** One part under two names: saying one is lighting the other. id → the ids that are the same part. */
  same: Record<string, string[]>;
  /** The scene function that draws the board's derivatives table, when there is one. */
  table?: { file: string; fn: string };
}

const TOPICS: Topic[] = [
  {
    week: 7,
    importance: IMPORTANCE_W7,
    pinned: ['1/p4/s2', '1/p4/s6', '2/p3/s1', '2/p5/s1', '2/p5/s3', '2.1/p3/s4', '2.1/p11/s2', '2.2/p3/s1', '2.2/p8/s1', '2.2/p14/s1', '3/p5/s3', '3/p6/s2', '3/p7/s4', '3.1/p8/s1'],
    contrastFrom: 'orriak',
    shown: {},
    same: {},
  },
  {
    week: 9,
    importance: IMPORTANCE_W9,
    pinned: ['1/p3/s1', '2/p3/s1', '2.1.1/p4/s3', '2.1.2/p6/s1', '2.2/p10/s2', '2.2.1/p5/s3', '2.2.1/p6/s1', '2.2.2/p21/s1', '2.2.2/p22/s1', '2.2.2/p28/s1', '3/p3/s5', '4/p3/s1'],
    contrastFrom: 'ildaskatuak',
    shown: {},
    same: {},
  },
  {
    week: 10,
    importance: IMPORTANCE_W10,
    pinned: ['1/p3/s1', '1/p26/s1', '1/p26/s2', '1/p26/s3', '1/p33/s1', '1/p34/s1', '1/p35/s1', '2/p9/s1', '2/p9/s2', '2/p20/s4', '3.3/p3/s1', '3.3/p3/s2', '3.4/p4/s2'],
    contrastFrom: 'bulbarra',
    shown: { 'zirkulazioa#2/aorta-dortsalak': 'Circulation3D: aorta dortsalak izendatuta hasieratik (aorta-dortsalak1 callout)' },
    // 3.2/p5/s1: "atal bentrikularreko paretan, hasierako ezkerreko bentrikulua ere deitua"; the frontal cut draws it under that name.
    same: { 'atal-bentrikularra': ['hasierako-ezkerreko-bentrikulua'] },
    table: { file: 'components/scenes/week10/RightAtrium.tsx', fn: 'AtriumTable' },
  },
  {
    week: 11,
    importance: IMPORTANCE_W11,
    pinned: ['1/p5/s2', '1/p6/s2', '2.2/p5/s1', '2.2/p7/s4', '3/p18/s1', '3/p19/s1', '4/p6/s3', '5.1/p5/s5', '5.2/p9/s3', '5.2/p12/s4'],
    contrastFrom: 'erretena',
    shown: {},
    // 3/p5/s1–s2: the ventricular part is the early left ventricle; topic 11's cuts draw it under that name.
    same: { 'atal-bentrikularra': ['hasierako-ezkerreko-bentrikulua'] },
  },
];

for (const topic of TOPICS)
  describe(`topic ${topic.week}`, () => {
    const lesson = LESSONS[topic.week];
    const week = getWeek(topic.week)!;
    const SHOWN = topic.shown;
    const SAME = topic.same;
    const stageOf = (id: string) => week.stages.find((s) => s.id === id)!;
    const textOf = (id: string) => sentenceText(sentence(id)!);

    /** Each line with the stage and stage time it is said at (lines inherit both, as the engine does). */
    interface Placed {
      chunk: string;
      index: number;
      line: Line;
      stage: StageDef;
      at: number;
      /** The step of the stage at `at`. */
      beat: number;
    }

    const placed: Placed[] = lesson.chunks.flatMap((c) => {
      let stage = c.stage;
      let at = 0;
      return c.lines.map((line, index) => {
        if (line.stage && line.stage !== stage) [stage, at] = [line.stage, 0];
        if (line.at !== undefined) at = line.at;
        const st = stageOf(stage);
        const beat = st ? st.beats.findLastIndex((b) => b.at <= at + 1e-9) : -1;
        return { chunk: c.id, index, line, stage: st, at, beat };
      });
    });
    const where = (p: Placed) => `${p.chunk}#${p.index}`;

    const checks: { chunk: string; check: Check; after?: Placed }[] = lesson.chunks.flatMap((c) =>
      (c.checks ?? []).map((check) => {
        const lines = placed.filter((p) => p.chunk === c.id);
        return { chunk: c.id, check, after: lines[Math.min(check.after ?? lines.length - 1, lines.length - 1)] };
      }),
    );

    const boardItems = lesson.chunks.flatMap((c) => c.board ?? []);
    const boardRows = boardItems.flatMap((b) => (b.kind === 'table' ? b.rows.map((r) => ({ id: r.id, text: r.cells.join(' '), notes: r.notes })) : [{ id: b.id, text: b.text, notes: b.notes }]));

    const citedText = (ids: string[]) => ids.map(textOf).join(' ');
    const beatNotes = (st: StageDef, upTo: number) => new Set(st.beats.slice(0, upTo + 1).flatMap((b) => expandNotes(b.notes)));
    const allWeekNotes = new Set(week.stages.flatMap((s) => s.beats.flatMap((b) => expandNotes(b.notes))));


    // ———————————————————————————— what the scene shows ————————————————————————————

    /** Shown by the stage by step k: lit or toured by it or an earlier step (a whole counts for its parts and back). */
    function shownBy(st: StageDef, k: number): Set<string> {
      const ids = new Set(st.beats.slice(0, k + 1).flatMap((b) => [...(b.focus ?? []), ...(b.tour ?? [])]));
      for (const id of [...ids]) for (const p of partsOf(id)) ids.add(p);
      return ids;
    }
    const isShown = (st: StageDef, k: number, id: string) => {
      const ids = shownBy(st, k);
      return ids.has(id) || partsOf(id).some((p) => ids.has(p));
    };



    describe('class: the core of the notes', () => {
      it('the checked-in importance is what the rules compute', () => {
        const computed = Object.fromEntries([...computeImportance(week)].map(([id, v]) => [id, v]));
        expect(topic.importance).toEqual(computed);
      });

      it(`keeps the sentences a student needs in order to understand topic ${topic.week}`, () => {
        expect(topic.pinned.filter((id) => topic.importance[`w${topic.week}/${id}`]?.tier !== 'funtsezkoa')).toEqual([]);
      });

      it('the core is at most 60 % of the prose and every stage has some', () => {
        const all = Object.entries(topic.importance);
        const core = all.filter(([, v]) => v.tier === 'funtsezkoa');
        expect(core.length / all.length).toBeLessThanOrEqual(0.6);
        for (const st of week.stages) {
          const cited = new Set(st.beats.flatMap((b) => expandNotes(b.notes)));
          expect([st.id, core.some(([id]) => cited.has(id))]).toEqual([st.id, true]);
        }
      });

      it('every core sentence is said by a line', () => {
        const said = new Set(placed.flatMap((p) => p.line.notes));
        const missing = Object.entries(topic.importance).filter(([id, v]) => v.tier === 'funtsezkoa' && !said.has(id)).map(([id]) => id);
        expect(missing).toEqual([]);
      });
    });

    describe('class: grounded in the notes', () => {
      it('every line, board item and check cites sentences that exist', () => {
        const bad: string[] = [];
        const need = (what: string, ids: string[] | undefined) => {
          if (!ids?.length) bad.push(`${what}: no notes`);
          for (const id of ids ?? []) if (!sentence(id)) bad.push(`${what}: ${id}`);
        };
        for (const p of placed) need(where(p), p.line.notes);
        for (const b of boardRows) need(b.id, b.notes);
        for (const { chunk, check } of checks) if ('notes' in check) need(`${chunk}/${check.kind}`, check.notes);
        expect(bad).toEqual([]);
      });

      it('G1: a line cites what its frames have shown (recaps may cite any step)', () => {
        const bad: string[] = [];
        for (const p of placed) {
          const ok = p.line.tone === 'recall' || p.line.tone === 'summary' ? allWeekNotes : beatNotes(p.stage, p.beat);
          for (const id of p.line.notes) if (!ok.has(id)) bad.push(`${where(p)} [${p.stage.id} t=${p.at}]: ${id}`);
        }
        expect(bad).toEqual([]);
      });

      it('says no number its sentences do not say', () => {
        const bad: string[] = [];
        const test = (what: string, text: string, notes: string[]) => {
          const have = digits(citedText(notes));
          for (const d of digits(text)) if (!have.has(d)) bad.push(`${what}: ${d}`);
        };
        for (const p of placed) {
          test(where(p), p.line.say, p.line.notes);
          if (p.line.plain) test(`${where(p)} (plain)`, p.line.plain, p.line.notes);
        }
        for (const b of boardRows) test(b.id, b.text, b.notes);
        for (const { chunk, check } of checks)
          if ('q' in check && 'notes' in check) test(`${chunk}/${check.kind}`, [check.q, ...('options' in check ? check.options : [])].join(' '), check.notes);
        expect(bad).toEqual([]);
      });

      it('G3: says no direction its sentences (or the step\'s FUNTSEZKOA) do not say', () => {
        const bad: string[] = [];
        const exams = (ids: string[]) => week.stages.flatMap((s) => s.beats.filter((b) => b.exam && expandNotes(b.notes).some((id) => ids.includes(id))).map((b) => b.exam!));
        const test = (what: string, text: string, notes: string[], names: readonly string[]) => {
          const have = directions([citedText(notes), ...exams(notes)].join(' '));
          for (const d of directions(withoutNames(text, names))) if (!have.has(d)) bad.push(`${what}: ${d}`);
        };
        for (const p of placed) {
          test(where(p), p.line.say, p.line.notes, p.stage.structures);
          if (p.line.plain) test(`${where(p)} (plain)`, p.line.plain, p.line.notes, p.stage.structures);
        }
        for (const b of boardRows) test(b.id, b.text, b.notes, [...structures.keys()]);
        for (const { chunk, check, after } of checks)
          if ('q' in check && 'notes' in check)
            test(`${chunk}/${check.kind}`, [check.q, ...('options' in check ? check.options : [])].join(' '), check.notes, after?.stage.structures ?? []);
        expect(bad).toEqual([]);
      });
    });

    describe('class: names and what lights up', () => {
      it('lights every structure it names, and only the stage\'s', () => {
        const bad: string[] = [];
        for (const p of placed) {
          const focus = p.line.focus ?? [];
          for (const id of focus) if (!p.stage.structures.includes(id)) bad.push(`${where(p)}: ${id} is not in ${p.stage.id}`);
          for (const text of [p.line.say, p.line.plain ?? '']) for (const n of namesSaid(text, p.stage.structures)) if (!n.ids.some((id) => focus.includes(id) || (SAME[id] ?? []).some((s) => focus.includes(s)))) bad.push(`${where(p)}: says "${n.span}" (${n.ids.join('/')}) without lighting it`);
        }
        expect(bad).toEqual([]);
      });

      it('G2: lights only what the fact is about', () => {
        const bad: string[] = [];
        for (const p of placed) {
          const cited = new Set(p.line.notes);
          const fromSteps = p.stage.beats.filter((b) => expandNotes(b.notes).some((id) => cited.has(id))).flatMap((b) => [...(b.focus ?? []), ...(b.tour ?? [])]);
          const named = new Set(namesSaid(`${p.line.say} ${p.line.plain ?? ''} ${citedText(p.line.notes)}`, p.stage.structures).flatMap((n) => [...n.ids, ...n.ids.flatMap((id) => SAME[id] ?? [])]));
          for (const id of p.line.focus ?? []) if (!named.has(id) && !fromSteps.includes(id)) bad.push(`${where(p)}: ${id}`);
        }
        expect(bad).toEqual([]);
      });

      it('G4: what a line lights, the scene has drawn and named by then', () => {
        const bad: string[] = [];
        for (const p of placed) for (const id of p.line.focus ?? []) if (!isShown(p.stage, p.beat, id) && !SHOWN[`${where(p)}/${id}`]) bad.push(`${where(p)} [${p.stage.id} t=${p.at}]: ${id}`);
        for (const { chunk, check, after } of checks)
          if (check.kind === 'zer-da-hau' && after && !isShown(after.stage, after.beat, check.structure)) bad.push(`${chunk}/zer-da-hau: ${check.structure}`);
        expect(bad).toEqual([]);
      });
    });

    describe('class: the scene', () => {
      it('every stage, view and time exists', () => {
        const bad: string[] = [];
        for (const c of lesson.chunks) if (!stageOf(c.stage)) bad.push(`${c.id}: ${c.stage}`);
        for (const p of placed) {
          if (!p.stage) {
            bad.push(`${where(p)}: no stage`);
            continue;
          }
          if (p.line.view && !p.stage.views.some((v) => v.id === p.line.view)) bad.push(`${where(p)}: view ${p.line.view}`);
          if (p.at < 0 || p.at > 1 || p.beat < 0) bad.push(`${where(p)}: at ${p.at}`);
        }
        expect(bad).toEqual([]);
      });

      it('the board is written once per item, by a line, after it is said', () => {
        const writes = placed.flatMap((p) => (p.line.writes ? [p.line.writes] : []));
        const ids = boardRows.map((b) => b.id);
        expect(writes.filter((w) => !ids.includes(w))).toEqual([]);
        expect(writes.length).toBe(new Set(writes).size);
        const table = boardItems.find((b): b is BoardTable => b.id === 'taula' && b.kind === 'table')!;
        expect(ids.filter((id) => !writes.includes(id) && !table.rows.some((r) => r.id === id) && id !== 'taula')).toEqual([]);
      });

      it.runIf(!!topic.table)('the derivatives table lists the same parts and fates as the drawn one', () => {
        const src = readFileSync(topic.table!.file, 'utf8');
        const body = new RegExp(`function ${topic.table!.fn}[\\s\\S]*?\\r?\\n}\\r?\\n`).exec(src)![0];
        const drawn = [...body.matchAll(/cells: \[\{ id: '([^']+)'[^}]*\}, \{ id: '([^']+)'/g)].map((m) => [m[1], m[2]]);
        const table = boardItems.find((b): b is BoardTable => b.id === 'taula' && b.kind === 'table')!;
        expect(table.rows.map((r) => r.structures)).toEqual(drawn);
      });
    });

    describe('class: checks', () => {
      const leftOut = (() => {
        const src = readFileSync('content/generate.ts', 'utf8');
        const block = /const LEFT_OUT = new Set\(\[([\s\S]*?)\]\)/.exec(src)?.[1] ?? '';
        return new Set([...block.matchAll(/'([^']+)'/g)].map((m) => m[1]));
      })();

      it(`pool questions exist, are topic ${topic.week}'s and are not left out`, () => {
        const bad: string[] = [];
        for (const { chunk, check } of checks) {
          if (check.kind !== 'pool') continue;
          const q = POOL.find((x) => x.id === check.id);
          if (!q) bad.push(`${chunk}: ${check.id} missing`);
          else if (q.week !== topic.week) bad.push(`${chunk}: ${check.id} is week ${q.week}`);
          if (leftOut.has(check.id)) bad.push(`${chunk}: ${check.id} left out`);
        }
        const ids = checks.flatMap(({ check }) => (check.kind === 'pool' ? [check.id] : []));
        expect(ids.length).toBe(new Set(ids).size);
        expect(bad).toEqual([]);
      });

      it('class checks are well formed', () => {
        const bad: string[] = [];
        for (const { chunk, check, after } of checks) {
          const what = `${chunk}/${check.kind}`;
          if (check.kind === 'predict' || check.kind === 'contrast') {
            if (check.why.length !== check.options.length) bad.push(`${what}: one why per option`);
            if (check.answer < 0 || check.answer >= check.options.length) bad.push(`${what}: answer`);
            if (new Set(check.options).size !== check.options.length) bad.push(`${what}: repeated option`);
          }
          if (check.kind === 'contrast' && !POOL.some((q) => q.id === check.id && q.source === 'klasea')) bad.push(`${what}: ${check.id} not in the pool`);
          if (check.kind === 'zer-da-hau') {
            if (!check.options.includes(nameOf(check.structure))) bad.push(`${what}: options lack ${nameOf(check.structure)}`);
            if (after && !after.stage.structures.includes(check.structure)) bad.push(`${what}: ${check.structure} not in ${after.stage.id}`);
          }
          if (check.kind === 'order') for (const it of check.items) if (after && !after.stage.structures.includes(it.structure)) bad.push(`${what}: ${it.structure} not in ${after.stage.id}`);
          if (check.kind === 'fill') {
            const t = boardItems.find((b) => b.id === check.table);
            if (t?.kind !== 'table') bad.push(`${what}: no table ${check.table}`);
            else for (const id of check.blanks) if (!t.rows.some((r) => r.id === id)) bad.push(`${what}: no row ${id}`);
          }
        }
        expect(bad).toEqual([]);
      });

      it(`contrast checks set two look-alikes against each other, from chunk ${topic.contrastFrom} on at least one per chunk`, () => {
        const from = lesson.chunks.findIndex((c) => c.id === topic.contrastFrom);
        const without = lesson.chunks.slice(from, -1).filter((c) => !(c.checks ?? []).some((k) => k.kind === 'contrast'));
        expect(without.map((c) => c.id)).toEqual([]);
      });
    });

    describe('class: wording and timing', () => {
      it('lines are short, plain to say and never exam wording', () => {
        const bad: string[] = [];
        for (const p of placed)
          for (const text of [p.line.say, p.line.plain ?? '']) {
            const words = text.split(/\s+/).filter(Boolean).length;
            if (words > 22) bad.push(`${where(p)}: ${words} words`);
            if (/[→←↔~≈₂()[\]{}<>*#=+/]/.test(text)) bad.push(`${where(p)}: symbol in "${text}"`);
            if (/azterket|ariketa/i.test(text)) bad.push(`${where(p)}: exam wording`);
          }
        expect(bad).toEqual([]);
      });

      /** Seconds at 1×: the move, the speech, writing to the board, the hold; a check as long as answering it. */
      const lineSeconds = (l: Line) => 0.8 + speakSeconds(l.say) + (l.writes ? 0.8 : 0) + (l.hold ?? 0);
      const checkSeconds = (k: Check) => (k.kind === 'fill' ? 60 : k.kind === 'order' ? 25 : 15);

      it('each chunk lasts 60–240 s and the class 12–20 min (short: the core, not every detail)', () => {
        const times = lesson.chunks.map((c) => c.lines.reduce((s, l) => s + lineSeconds(l), 0) + (c.checks ?? []).reduce((s, k) => s + checkSeconds(k), 0));
        const bad = lesson.chunks.flatMap((c, i) => (i > 0 && i < lesson.chunks.length - 1 && (times[i] < 60 || times[i] > 240) ? [`${c.id}: ${times[i].toFixed(0)} s`] : []));
        expect(bad).toEqual([]);
        const total = times.reduce((a, b) => a + b, 0);
        expect(total).toBeGreaterThan(12 * 60);
        expect(total).toBeLessThan(20 * 60);
      });

      it('the student does something at least every 120 s', () => {
        let since = 0;
        const bad: string[] = [];
        for (const s of stepsOf(lesson as Lesson)) {
          const c = lesson.chunks[s.chunk];
          if (s.kind === 'check') {
            since = 0;
            continue;
          }
          since += lineSeconds(c.lines[s.line]);
          if (since > 120) bad.push(`${c.id}#${s.line}: ${since.toFixed(0)} s`);
        }
        expect(bad).toEqual([]);
      });
    });

    describe('class: the voice', () => {
      const words = [...new Set(placed.flatMap((p) => `${p.line.say} ${p.line.plain ?? ''}`.toLowerCase().match(/\p{L}+/gu) ?? []))];

      it('every x word is classified, and the respelling follows it', () => {
        const bad: string[] = [];
        // tx is always /tʃ/: only a lone x can be either.
        for (const w of words.filter((w) => /(?<!t)x/.test(w))) {
          const kind = X_WORDS[w];
          if (!kind) bad.push(`${w}: not classified`);
          else if (respellWord(w, false).includes('x') !== (kind === 'ks')) bad.push(`${w}: respelled ${respellWord(w, false)}`);
        }
        expect(bad).toEqual([]);
      });

      it('a Spanish voice gets no Basque-only letters (z, tz, tx, soft g)', () => {
        const bad = placed.flatMap((p) => {
          const said = spokenText(p.line.say, 'es', false);
          return /z|tx|g[ei]/.test(said.replace(/\b(septum|secundum|spurium|transversum|primum)\w*/g, '')) ? [`${where(p)}: ${said}`] : [];
        });
        expect(bad).toEqual([]);
      });
    });
  });
