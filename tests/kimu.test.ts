import { afterEach, describe, expect, it, vi } from 'vitest';
import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { parseAnswer } from '@/lib/kimu/groq';
import { offlineReply } from '@/lib/kimu/offline';
import { allPassages, intentOf, searchNotes } from '@/lib/kimu/notes';
import { buildMessages } from '@/lib/kimu/prompt';
import { CONFIDENT, search, toTarget } from '@/lib/kimu/search';
import { detectLang, fold } from '@/lib/kimu/text';
import { pickPractice, practiceScope, wantsPractice } from '@/lib/kimu/practice';
import type { KimuAsk, KimuModelReply } from '@/lib/kimu/types';
import { FORMATIONS, formationFrame, formationOf } from '@/content/formation';
import { POOL } from '@/content/pool';
import { getWeek } from '@/content/registry';
import { blockText, expandNotes, notesOf, sentence } from '@/content/notes-text';
import { askKimu, grounded, retrievalQuestion } from '@/lib/kimu/engine';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

const first = (q: string) => search(q, 4)[0];
const nokey = () => vi.fn(async (_url: string, _init?: RequestInit) => Response.json({ ok: false, reason: 'nokey' }));
const sentBody = (f: ReturnType<typeof nokey>, i = 0) => JSON.parse(f.mock.calls[i][1]!.body as string) as KimuAsk;
/** Every word of the original notes of a topic, folded, to check that a quote is verbatim. */
const notesText = (week: number) => notesOf(week).map(blockText).join(' ').replace(/[​-‍﻿]/g, '').replace(/\s+/g, ' ');

describe('Kimu search: finds where the simulator explains something', () => {
  it('reconciles Spanish and Basque spellings', () => {
    expect(fold('Notocorda')).toBe(fold('Notokorda'));
    expect(fold('gastrulazioa').startsWith(fold('gastrulación').slice(0, -1))).toBe(true);
    expect(fold('vitelino')).toBe(fold('bitelino'));
  });

  it.each([
    ['cuándo se forma la notocorda', 3, 'notokorda'],
    ['noiz sortzen da notokorda?', 3, 'notokorda'],
    ['notochord', 3, 'notokorda'],
    ['somitas', 4, 'somitak'],
    ['when does the primitive streak appear', 3, 'gastrulazioa'],
    ['gastrulación', 3, 'gastrulazioa'],
    ['cierre del tubo neural', 4, 'neurulazioa'],
    ['cordón umbilical', 6, 'zilbor-hestea'],
  ])('%s → week %i, stage %s', (question, week, stage) => {
    const hits = search(question, 4);
    expect(hits.some((h) => h.doc.week === week && h.doc.stage === stage), hits.map((h) => `${h.doc.week}/${h.doc.stage}`).join(' ')).toBe(true);
    expect(hits[0].score).toBeGreaterThan(CONFIDENT);
  });

  it('plays the reviewed notochord formation, rather than guessing the stage start', () => {
    const h = first('cuándo se forma la notocorda');
    expect(toTarget(h, 'c1')).toMatchObject({ kind: 'structure', week: 3, stage: 'notokorda', at: .59, structure: 'notokorda', formation: 'notokorda', view: 'zelulak' });
  });

  it('finds nothing for chit-chat, so Kimu does not point at random places', () => {
    expect(search('hola qué tal', 4)).toEqual([]);
    expect(search('receta de paella', 4)).toEqual([]);
  });

  it('gives every hit a place that exists in the simulator', () => {
    for (const q of ['notocorda', 'blastocisto', 'ectodermo', 'somitas', 'trofoblasto']) {
      for (const h of search(q, 4)) {
        expect(h.doc.at).toBeGreaterThanOrEqual(0);
        expect(h.doc.at).toBeLessThanOrEqual(1);
        expect(h.doc.where).toMatch(/^\d+\. gaia/);
      }
    }
  });
});

describe('Reviewed formation destinations', () => {
  it.each([
    ['heuserren mintza', 'heuser-mintza', 2, 'eguna-9', 'heuser'],
    ['desidua erreakzioa', 'desidua-erreakzioa', 2, 'eguna-11-12', 'desidua'],
    ['somatopleura', 'paretako-orria', 4, 'mesodermoa-banatzen', 'zeharkakoa'],
    ['somatopleura kanpokoa', 'somatopleura-kanpokoa', 2, 'eguna-11-12', 'mesodermoa'],
  ])('%s goes to its explanation in the correct view', (q, structure, week, stage, view) => {
    expect(toTarget(first(q), 'c1')).toMatchObject({ structure, week, stage, view });
  });
  it.each(FORMATIONS.map(f => [f.structure, f] as const))('%s has a real view, narrative focus and original passage', (id, f) => {
    expect(formationOf(id)).toEqual(f);
    const stage = getWeek(f.week)!.stages.find(s => s.id === f.stage)!;
    expect(stage.beats[f.beat].focus).toContain(id);
    expect(f.start).toBeGreaterThanOrEqual(0);
    expect(f.end).toBeGreaterThan(f.start);
    expect(f.end).toBeLessThanOrEqual(1);
    const refs = expandNotes(stage.beats[f.beat].notes);
    expect(refs.length).toBeGreaterThan(0);
    expect(refs.every(id => !!sentence(id))).toBe(true);
    const scene = stage.views.find(v => v.id === f.view)!.scene;
    const drawing = renderToStaticMarkup(createElement('svg', null, createElement(scene, { t: f.end, reduced: true })));
    expect(drawing.includes(`data-part="${id}"`) || drawing.includes(`data-label="${id}"`)).toBe(true);
    for (const part of f.highlight ?? [id]) {
      expect(drawing.includes(`data-part="${part}"`) || drawing.includes(`data-label="${part}"`)).toBe(true);
    }
    expect(formationFrame(f, f.start, 10_000, 2)).toBe(f.end);
    expect(formationFrame(f, f.end, 1, 1)).toBe(f.end);
  });

  it('only labels reviewed clips as formations; a location question lands on the completed structure', () => {
    expect(first('¿Cómo se forma el tubo neural?').doc.formation).toBe('hodi-neurala');
    expect(first('Non dago notokorda?').doc).toMatchObject({ at: formationOf('notokorda')!.end, action: 'explanation' });
    expect(first('¿Cómo se forma el endometrio?').doc.formation).toBeUndefined();
    expect(first('¿Cómo se forma el endometrio?').doc.facts).toContain('Do not promise');
    expect(formationOf('unknown')).toBeUndefined();
    expect(new Set(FORMATIONS.map(f => f.structure)).size).toBe(FORMATIONS.length);
  });

  it('keeps short clips readable and cannot overshoot, even at higher playback speeds', () => {
    const f = formationOf('gandor-neurala')!;
    expect(formationFrame(f, f.start, 1, 1)).toBeLessThan(f.end);
    expect(formationFrame(f, f.start, 4, 1)).toBeLessThan(f.end);
    expect(formationFrame(f, f.start, 0, 1)).toBe(f.start);
  });
});

describe('Kimu grounding: answers come from the original notes', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('indexes every topic of the registry, verbatim, with its section', () => {
    const weeks = new Set(allPassages().map((p) => p.week));
    for (let w = 1; w <= 9; w++) expect(weeks.has(w)).toBe(true);
    for (const p of allPassages().slice(0, 400)) {
      expect(p.sentences.every((s) => !!sentence(s.id))).toBe(true);
    }
  });

  it('lists the four parts that form the diaphragm, verbatim, citing 7. gaia · 3.1', async () => {
    vi.stubGlobal('fetch', nokey());
    const r = await askKimu('Zein egiturek osatzen dute diafragma?', [], null);
    expect(r.source).toBe('offline');
    for (const part of ['Septum Transversuma', 'Mintz pleuroperitonealak', 'Hestegorri inguruko mesenkimatik sortutako zuntz muskularrak', 'Diafragmaren alde periferikoko atal muskularra']) expect(r.reply).toContain(part);
    expect(r.reply).not.toContain('aorta');
    expect(r.sources[0].ref).toMatch(/^7\. gaia · 3\.1 /);
    expect(r.sources[0].open).toMatchObject({ week: 7, notes: true });
  });

  it.each([
    ['Noiz ixten da hodi neurala?', 4, /25\. egunerako/],
    ['Zergatik jaisten da septum transversuma?', 7, /hazkuntzarengatik/],
    ['Zer da hodi neuroenterikoa?', 3, /amnios-barrunbea eta bitelo zakua/],
    ['Non habiratzen da blastozistoa?', 1, /atzeko paretan/],
    // From the stage where it forms (neurulation), not the somites sentence that only places them beside it.
    ['Nola eratzen da hodi neurala?', 4, /plaka neuraletik/],
  ])('%s → the notes sentence of topic %i', async (q, week, text) => {
    vi.stubGlobal('fetch', nokey());
    const r = await askKimu(q, [], null);
    expect(r.reply).toMatch(text);
    expect(r.sources[0].week).toBe(week);
    // The body is the notes' own words: every piece of it is in the original notes of that topic.
    const notes = notesText(week);
    for (const piece of r.reply.replace(/\*\*/g, '').replace(/\s*\([^)]*kronologia[^)]*\)\s*$/, '').split(/; |: | … /)) expect(notes).toContain(piece.replace(/\.$/, '').trim());
  });

  it('keeps a quote under the answer short and verbatim', async () => {
    for (const q of ['Zer da karena?', 'Nondik dator notokorda?', 'Zertan bihurtzen da esklerotoma?']) {
      vi.stubGlobal('fetch', nokey());
      const r = await askKimu(q, [], null);
      for (const s of r.sources.filter((x) => x.quote)) {
        expect(s.quote.length).toBeLessThanOrEqual(300);
        const notes = notesText(s.week);
        for (const piece of s.quote.split(/ · |…|: /).map((x) => x.trim()).filter((x) => x.length > 8)) expect(notes, piece).toContain(piece);
      }
    }
  });

  it('declines what the notes do not cover, without asking the model or pointing anywhere', async () => {
    for (const q of ['receta de paella', 'Nork irabazi zuen futbol partida?', 'what is the capital of France']) {
      const f = nokey();
      vi.stubGlobal('fetch', f);
      const r = await askKimu(q, [], null);
      expect(r.targets).toEqual([]);
      // The same plain answer as any question the notes do not cover: what they lack, and where to look.
      expect(r.reply).toMatch(/^Apunteek ez dute|^Los apuntes no|^The notes (do not|say nothing)/);
      expect(r.sources.length).toBeLessThanOrEqual(1);
      expect(f).not.toHaveBeenCalled();
    }
  });

  it('cites only the passages it was given, and shows the notes it rests on', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => Response.json({ ok: true, reply: 'Diafragma lau ataletatik sortzen da.', cite: ['n1', 'n7'], go: ['c1', 'c9'], followups: [] })));
    const r = await askKimu('Zein egiturek osatzen dute diafragma?', [], null);
    expect(r.source).toBe('ai');
    expect(r.sources.length).toBe(1);
    expect(r.sources[0].ref).toMatch(/^7\. gaia · 3\.1 /);
    expect(r.sources[0].quote).toContain('Septum Transversuma');
    expect(r.targets.some((t) => t.id === 'c9')).toBe(false);
  });

  it('falls back to the notes when the model states a number the notes do not', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => Response.json({ ok: true, reply: 'Hodi neurala 31. egunean ixten da.', cite: ['n1'], go: [], followups: [] })));
    const r = await askKimu('Noiz ixten da hodi neurala?', [], null);
    expect(r.source).toBe('offline');
    expect(r.reply).toMatch(/25\. egunerako/);
    const ask = { question: 'q', history: [], notes: ['(4. gaia · 2) 25. egunerako ixten da'], places: [], here: null, lang: 'eu' as const };
    expect(grounded('**Hodi neurala** 25. egunerako ixten da [n1].', ask)).toBe(true);
    expect(grounded('28. egunean ixten da.', ask)).toBe(false);
  });

  it('falls back to the notes when the model is too slow', async () => {
    vi.stubGlobal('fetch', vi.fn((_u: string, init: RequestInit) => new Promise((_, reject) => init.signal?.addEventListener('abort', () => reject(new Error('abort'))))));
    const r = await askKimu('Zer da hodi neuroenterikoa?', [], null, { timeoutMs: 50 });
    expect(r.source).toBe('offline');
    expect(r.reply).toMatch(/hodi neuroenterikoa/);
  });
});

describe('Kimu context: the topic, step, view and structure on screen', () => {
  afterEach(() => vi.unstubAllGlobals());
  const history = [{ role: 'user' as const, text: '¿Cómo se forma la notocorda?' }, { role: 'kimu' as const, text: 'Notokorda…' }];

  it('retrieves the previous structure for an unnamed follow-up', () => {
    const q = retrievalQuestion('¿Y de dónde viene?', history, null);
    expect(q).toContain('Notocorda');
    expect(first(q).doc.structure).toBe('notokorda');
    expect(retrievalQuestion('Nondik dator?', history, null)).toContain('Notocorda');
  });

  it('uses the currently highlighted structure for this, while respecting an explicitly named topic', () => {
    const here = { week: 4, stage: 'neurulazioa', beat: 3, structure: 'hodi-neurala' };
    expect(first(retrievalQuestion('¿Qué es esto?', history, here)).doc.structure).toBe('hodi-neurala');
    expect(retrievalQuestion('¿Y cómo se forma la notocorda?', history, here)).toBe('¿Y cómo se forma la notocorda?');
  });

  it('explains the step on screen with that step\'s own notes sentences', async () => {
    const stage = getWeek(7)!.stages.find((s) => s.id === 'diafragma-eraketa')!;
    const beat = stage.beats.findIndex((b) => expandNotes(b.notes).length > 0);
    const f = nokey();
    vi.stubGlobal('fetch', f);
    const r = await askKimu('Azaldu urrats hau', [], { week: 7, stage: stage.id, beat, view: stage.views[0].id });
    const ids = new Set(expandNotes(stage.beats[beat].notes));
    const said = [...ids].map((id) => sentence(id)!.parts.map((p) => p.text).join('').replace(/\s+/g, ' ').trim()).filter((t) => t.length > 12);
    expect(said.some((t) => r.reply.replace(/\*\*/g, '').includes(t.slice(0, 40)))).toBe(true);
    expect(r.sources[0].week).toBe(7);
    // The model hears where the student is: topic, stage and view.
    const here = sentBody(f).here!;
    expect(here.title).toContain('7. gaia');
    expect(here.title).toContain(stage.title);
    expect(here.title).toContain(stage.views[0].label);
  });

  it('prefers the topic on screen when a word is used in several topics', () => {
    const at7 = searchNotes('mesenkima', { week: 7 })[0];
    const at8 = searchNotes('mesenkima', { week: 8 })[0];
    expect(at7.passage.week).toBe(7);
    expect(at8.passage.week).toBe(8);
  });

  it('keeps the reviewed formation as primary even if the model cites a different place', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => Response.json({ ok: true, reply: 'Hara!', cite: [], go: ['c2', 'c9'], followups: [] })));
    const result = await askKimu('¿Cómo se forma la notocorda?', [], null);
    expect(result.targets[0]).toMatchObject({ id: 'c1', formation: 'notokorda', at: .59 });
    expect(result.targets.some(t => t.id === 'c9')).toBe(false);
  });

  it('uses contextual evidence and the same destinations without a model', async () => {
    const f = nokey();
    vi.stubGlobal('fetch', f);
    const result = await askKimu('¿Y de dónde viene?', history, null);
    expect(result.targets[0].structure).toBe('notokorda');
    expect(sentBody(f).places[0]).toContain('Jatorria');
    expect(result.lineage).toMatchObject({ kind: 'from' });
    expect(result.lineage!.names.at(-1)).toBe('Notokorda');
  });
});

describe('Kimu practice: only the reviewed pool', () => {
  afterEach(() => vi.unstubAllGlobals());
  /** The ids content/generate.ts filters out after its hand review, read from the source itself. */
  const filtered = (() => {
    const src = readFileSync(join(process.cwd(), 'content/generate.ts'), 'utf8');
    const block = /const LEFT_OUT = new Set\(\[([\s\S]*?)\]\)/.exec(src)?.[1] ?? '';
    return new Set([...block.matchAll(/'([^']+)'/g)].map((m) => m[1]));
  })();

  it('recognises a request to practise', () => {
    for (const q of ['Galdetu niri', 'galdetu niri somitei buruz', 'pregúntame sobre la notocorda', 'quiz me']) expect(wantsPractice(q)).toBe(true);
    expect(wantsPractice('Zer da notokorda?')).toBe(false);
  });

  it('never lets a filtered item reach practice, in any scope', () => {
    expect(filtered.size).toBeGreaterThan(20);
    const ids = new Set(practiceScope(null).flat().map((q) => q.id));
    for (const w of [1, 4, 7, 9]) for (const q of practiceScope({ week: w, stage: getWeek(w)!.stages[0].id, beat: 0 }).flat()) ids.add(q.id);
    for (const id of ids) expect(filtered.has(id), id).toBe(false);
    const pool = new Set(POOL.map((q) => q.id));
    for (const id of ids) expect(pool.has(id)).toBe(true);
    // …and the notes index holds only the notes.
    for (const p of allPassages()) expect(filtered.has(p.id)).toBe(false);
  });

  it('asks about the named structure, due questions first, from the pool', async () => {
    const somite = POOL.filter((q) => q.concept === 'somitak');
    expect(somite.length).toBeGreaterThan(0);
    const due = somite[somite.length - 1];
    const picked = pickPractice(null, { [due.id]: { streak: 0, right: 0, wrong: 1, due: 0 } }, 'somitak');
    expect(picked[0].id).toBe(due.id);
    vi.stubGlobal('fetch', nokey());
    const r = await askKimu('Galdetu niri somitei buruz', [], null, { answers: {} });
    expect(r.practice!.length).toBe(3);
    expect(r.practice!.every((q) => POOL.some((p) => p.id === q.id && p.question === q.question))).toBe(true);
    expect(r.practice!.some((q) => q.concept === 'somitak')).toBe(true);
  });

  it('practises the step on screen when no structure is named', () => {
    const picked = pickPractice({ week: 7, stage: 'septum-transversum', beat: 0 }, {});
    expect(picked.length).toBe(3);
    expect(picked.every((q) => q.week === 7)).toBe(true);
  });
});

describe('Kimu language and offline voice', () => {
  const ev = (question: string, lang: 'eu' | 'es' | 'en') => ({ question, lang, intent: intentOf(question), notes: searchNotes(question), places: search(question, 3) });

  it('detects the language of the question', () => {
    expect(detectLang('cuándo se forma la notocorda')).toBe('es');
    expect(detectLang('noiz sortzen da notokorda?')).toBe('eu');
    expect(detectLang('when does the notochord form')).toBe('en');
    expect(detectLang('somitas')).toBe('eu');
  });

  it('answers from the notes alone, saying so in the student language, with places to go', () => {
    const r = offlineReply(ev('cuándo se forma la notocorda', 'es'));
    expect(r.source).toBe('offline');
    expect(r.reply).toMatch(/^En los apuntes \(en euskera\)/);
    expect(r.sources[0].ref).toMatch(/^3\. gaia · 2 Notokordaren eraketa/);
    expect(r.targets[0]).toMatchObject({ week: 3, stage: 'notokorda' });
  });

  it('greets back, and suggests real topics when nothing matches', () => {
    expect(offlineReply({ ...ev('kaixo', 'eu'), notes: [], places: [] }).reply).toMatch(/Kimu naiz/);
    const r = offlineReply({ ...ev('receta de paella', 'es'), notes: [], places: [] });
    expect(r.targets).toEqual([]);
    expect(r.followups.length).toBeGreaterThan(0);
    expect(r.followups[0]).toMatch(/^¿Cuándo se forma la notocorda\?$/);
    expect(r.mood).toBe('curious');
  });

  it('words follow-ups as a Basque speaker would', async () => {
    vi.stubGlobal('fetch', nokey());
    expect((await askKimu('Zer dira somitak?', [], null)).followups).toContain('Nondik datoz somitak?');
    expect((await askKimu('Zer da notokorda?', [], null)).followups).toContain('Nondik dator notokorda?');
    vi.unstubAllGlobals();
  });
});

describe('Kimu model contract', () => {
  it('reads the model JSON, tolerating thinking and prose around it', () => {
    const raw = '<think>hmm</think>Here: {"reply":"Kaixo! **Notokorda**","cite":["n1"],"go":["c1","c2","c3"],"followups":["Zer da?"]}';
    expect(parseAnswer(raw)).toEqual({ reply: 'Kaixo! **Notokorda**', cite: ['n1'], go: ['c1', 'c2'], followups: ['Zer da?'] });
  });

  it('falls back to a plain-text reply', () => {
    expect(parseAnswer('Kaixo, ni Kimu naiz')).toMatchObject({ reply: 'Kaixo, ni Kimu naiz', cite: [], go: [] });
    expect(parseAnswer('   ')).toBeNull();
  });

  it('sends the model only the numbered notes, the places, the last turns and the question', () => {
    const ask: KimuAsk = {
      question: 'cuándo se forma la notocorda',
      history: Array.from({ length: 8 }, (_, i) => ({ role: i % 2 ? ('kimu' as const) : ('user' as const), text: `t${i}` })),
      notes: ['A', 'B'],
      places: ['P'],
      here: { title: '3. gaia · Notokordaren eraketa', step: 'urratsa', picked: '' },
      lang: 'es',
    };
    const m = buildMessages(ask);
    expect(m[0].role).toBe('system');
    expect(m).toHaveLength(1 + 4 + 1);
    expect(m.at(-1)?.content).toContain('[n1] A\n[n2] B');
    expect(m.at(-1)?.content).toContain('[c1] P');
    expect(m.at(-1)?.content).toContain('HERE');
    expect(m[0].content).toMatch(/only source of truth/);
    expect(JSON.stringify(m).length).toBeLessThan(4200);
  });

  it('keeps out of its prompts, copy and code the subjects the atlas leaves out (checked by hash)', () => {
    // Folded words, or word beginnings, hashed (sha256, first 16 hex): the test names nothing itself.
    const WORDS = new Set(['5e89e9d8544af15b', 'd6bd4331946ce8fa']);
    const STEMS = new Map([[6, '5c42a78013c4f3cd'], [5, 'ea13cfbbffdcaaba'], [7, 'ebe897f0633a50be'], [8, '3060a9a1663d7212']]);
    const h = (w: string) => createHash('sha256').update(w).digest('hex').slice(0, 16);
    const files = (dir: string): string[] => readdirSync(dir).flatMap((f) => (statSync(join(dir, f)).isDirectory() ? files(join(dir, f)) : [join(dir, f)]));
    const sources = ['lib/kimu', 'components/kimu', 'app/api/kimu'].flatMap((d) => files(join(process.cwd(), d))).filter((f) => /\.(ts|tsx|css)$/.test(f) && !f.includes('__probe'));
    expect(sources.length).toBeGreaterThan(8);
    for (const f of sources) {
      const words = readFileSync(f, 'utf8').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').split(/[^a-z]+/);
      for (const w of words) {
        expect(WORDS.has(h(w)), f).toBe(false);
        for (const [n, hash] of STEMS) expect(w.length >= n && h(w.slice(0, n)) === hash, f).toBe(false);
      }
    }
  });
});

describe('Kimu route', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  const post = async (body: unknown) => {
    const { POST } = await import('@/app/api/kimu/route');
    const res = await POST(new Request('http://x/api/kimu', { method: 'POST', body: JSON.stringify(body), headers: { 'x-forwarded-for': '9.9.9.9' } }));
    return { status: res.status, json: (await res.json()) as KimuModelReply };
  };
  const ask = { question: 'Noiz sortzen da notokorda?', history: [], notes: ['(3. gaia · 2) Notokorda…'], places: ['Notokorda: …'], here: null, lang: 'eu' };

  it('says "no key" (so the browser answers from the notes) when Groq is not configured', async () => {
    vi.stubEnv('GROQ_API_KEY', '');
    expect((await post(ask)).json).toEqual({ ok: false, reason: 'nokey' });
  });

  it('rejects malformed requests', async () => {
    vi.stubEnv('GROQ_API_KEY', 'k');
    expect((await post({ question: 1 })).status).toBe(400);
    expect((await post({ question: ' ' })).status).toBe(400);
  });

  it('never asks the model without evidence from the notes', async () => {
    vi.stubEnv('GROQ_API_KEY', 'test-key');
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    expect((await post({ ...ask, notes: [], places: [] })).json).toEqual({ ok: false, reason: 'error' });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('asks Qwen 3.8 on Groq in instruct mode and returns its reply with its citations', async () => {
    vi.stubEnv('GROQ_API_KEY', 'test-key');
    const fetchMock = vi.fn(async () => Response.json({ choices: [{ message: { content: '{"reply":"Hara!","cite":["n1"],"go":["c1"],"followups":[]}' } }] }));
    vi.stubGlobal('fetch', fetchMock);
    const { json } = await post(ask);
    expect(json).toEqual({ ok: true, reply: 'Hara!', cite: ['n1'], go: ['c1'], followups: [] });
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe('https://api.groq.com/openai/v1/chat/completions');
    expect((init.headers as Record<string, string>).Authorization).toBe('Bearer test-key');
    const sent = JSON.parse(init.body as string);
    expect(sent).toMatchObject({ model: 'qwen/qwen3.8-27b', reasoning_effort: 'none' });
    expect(sent.max_tokens).toBeLessThanOrEqual(400);
    expect(sent.messages.at(-1).content).toContain('[n1] (3. gaia · 2) Notokorda');
  });

  it('retries once in plain mode when structured output is rejected, then gives up quietly on errors', async () => {
    vi.stubEnv('GROQ_API_KEY', 'test-key');
    const calls: number[] = [];
    vi.stubGlobal(
      'fetch',
      vi.fn(async (_u: string, init: RequestInit) => {
        const body = JSON.parse(init.body as string);
        calls.push(body.response_format ? 1 : 0);
        return body.response_format ? new Response('{}', { status: 400 }) : Response.json({ choices: [{ message: { content: '{"reply":"Bai","cite":[],"go":[],"followups":[]}' } }] });
      }),
    );
    expect((await post({ ...ask, question: 'Zer da hau?' })).json).toMatchObject({ ok: true, reply: 'Bai' });
    expect(calls).toEqual([1, 0]);

    vi.stubGlobal('fetch', vi.fn(async () => new Response('{}', { status: 429 })));
    expect((await post({ ...ask, question: 'Beste galdera bat' })).json).toEqual({ ok: false, reason: 'error' });
  });
});
