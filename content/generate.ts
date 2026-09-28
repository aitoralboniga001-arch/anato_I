/**
 * Exam questions generated from the canonical data (chronology + lineage), so a date or a lineage
 * is written once and every question about it agrees. Each option carries its own feedback: a wrong
 * answer is explained by what that option actually is, which is the conceptual error to fix.
 *
 * Every generator guarantees a single correct answer by construction (margins around dates, options
 * from disjoint branches), which is what the pack's quarantine list (QH01…) warns about.
 */
import { LIFE, MILESTONES, dayIn, dayLabel, firstSeenOf, spanLabel } from './chronology';
import { LAYERS, ancestry, childrenOf, descendantsOf, layerOf, lineageIds, type LNode } from './lineage';
import { nameOf, structures } from './registry';

/** The exam skill a question trains (the brief's competences). */
export type Skill = 'kronologia' | 'presentzia' | 'ordena' | 'jatorria' | 'eratorria' | 'definizioa' | 'kokapena';

export const skillLabel: Record<Skill, string> = {
  kronologia: 'Zein egunetan?',
  presentzia: 'Zer EZ dago?',
  ordena: 'Ordena',
  jatorria: 'Nondik dator?',
  eratorria: 'Zer sortzen du?',
  definizioa: 'Zer da?',
  kokapena: 'Non dago?',
};

export interface GenQuestion {
  id: string;
  skill: Skill;
  question: string;
  options: string[];
  answer: number;
  /** Why each option is right or wrong, aligned with `options`. */
  why: string[];
  /** One-line takeaway shown after answering. */
  explanation: string;
  /** The structure the question is about (for competence tracking), when there is one. */
  concept?: string;
  /** Topic (gaia) the question belongs to and the stage to review it in. */
  week: number;
  stageId?: string;
}

// ——— Deterministic helpers (questions must be stable so progress can be stored by id) ———

const hash = (s: string) => {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return (h >>> 0) / 4294967296;
};

/** Shuffle options with a seed; returns the options and the new index of the answer. */
function place(id: string, right: { text: string; why: string }, wrong: { text: string; why: string }[]) {
  const all = [{ ...right, ok: true }, ...wrong.map((w) => ({ ...w, ok: false }))]
    .map((o, i) => ({ o, k: hash(`${id}:${i}:${o.text}`) }))
    .sort((a, b) => a.k - b.k)
    .map((x) => x.o);
  return { options: all.map((o) => o.text), why: all.map((o) => o.why), answer: all.findIndex((o) => o.ok) };
}

const pick = <T,>(id: string, list: T[], n: number) =>
  list
    .map((x, i) => ({ x, k: hash(`${id}#${i}`) }))
    .sort((a, b) => a.k - b.k)
    .slice(0, n)
    .map((v) => v.x);

const weekOf = (id: string) => firstSeenOf(id)?.week ?? 1;

// ——— Natural Basque for names inside a sentence ———
/** Proper names keep their capital ("Heuser-en mintza", "Schwann zelulak"); the rest are lower-cased mid-sentence. */
const lc = (n: string) => (/^(Heuser|Schwann|Wharton|Rh\b|C\b|[A-Z]\d)/.test(n) ? n : n.charAt(0).toLowerCase() + n.slice(1));
/** Basque absolutive plural ends in -ak ("somitak", "faringe arkuak"): the verb agrees with it. */
const plural = (n: string) => /ak$/.test(n);
const nm = (id: string) => lc(nameOf(id));
/** "da"/"dira", "dator"/"datoz"… for the structure's number. */
const verb = (id: string, sg: string, pl: string) => (plural(nameOf(id)) ? pl : sg);
const isProcess = (id: string) => structures.get(id)?.category === 'prozesua';
const stageOf = (id: string) => firstSeenOf(id)?.stage;

/** Structures with curated dates that exist in the registry. */
const dated = Object.entries(LIFE).filter(([id]) => structures.has(id));

// ——— 1. Zein egunetan agertzen da X? ———

function whenQuestions(): GenQuestion[] {
  const out: GenQuestion[] = [];
  for (const [id, l] of dated) {
    if (l.from === 0) continue;
    // Distractors: other dated structures whose first day differs by ≥ 2 days (no near-ties).
    // …in the same unit as the answer (days up to day 56, weeks after), so the format gives nothing away.
    const late = l.from > 56;
    const others = dated.filter(([o, ol]) => o !== id && Math.abs(ol.from - l.from) >= (late ? 14 : 2) && ol.from > 56 === late && ol.from <= Math.max(60, l.from * 2));
    const byDay = new Map<number, string>();
    for (const [o, ol] of others) if (!byDay.has(ol.from)) byDay.set(ol.from, o);
    const days = pick(`noiz-${id}`, [...byDay.keys()].sort((a, b) => Math.abs(a - l.from) - Math.abs(b - l.from)).slice(0, 6), 3);
    if (days.length < 3) continue;
    const qid = `noiz-${id}`;
    const p = place(
      qid,
      { text: dayLabel(l.from), why: `Bai: ${nameOf(id)} ${dayIn(l.from)} agertzen da.${l.note ? ` ${l.note}` : ''}` },
      days.map((d) => ({ text: dayLabel(d), why: `${dayIn(d)} ${nameOf(byDay.get(d)!)} agertzen da, ez ${nameOf(id)}.` })),
    );
    out.push({ id: qid, skill: 'kronologia', concept: id, question: isProcess(id) ? `Noiz hasten da ${nm(id)}?` : `Noiz agertzen ${verb(id, 'da', 'dira')} lehen aldiz ${nm(id)}?`, ...p, explanation: `${nameOf(id)}: ${spanLabel(l.from, l.to)}.`, week: weekOf(id), stageId: stageOf(id) });
  }
  return out;
}

// ——— 2. Zer EZ dago N. egunean? ———

const clearlyIn = (l: (typeof LIFE)[string], d: number) => l.from <= d - 1 && (l.to === undefined || l.to >= d + 1);
const clearlyOut = (l: (typeof LIFE)[string], d: number) => l.from >= d + 2 || (l.to !== undefined && l.to <= d - 2);

function absentQuestions(): GenQuestion[] {
  const out: GenQuestion[] = [];
  const days = [...new Set(MILESTONES.filter((m) => m.day >= 6 && m.day <= 35).map((m) => m.day))];
  for (const d of days) {
    const present = dated.filter(([, l]) => clearlyIn(l, d));
    // Absent but close in time (just gone or about to appear): those are the tempting ones.
    const absent = dated.filter(([, l]) => clearlyOut(l, d) && (l.from > d ? l.from - d <= 10 : d - l.to! <= 8));
    if (present.length < 3 || !absent.length) continue;
    for (let v = 0; v < 2; v++) {
      const qid = `ez-${d}-${v}`;
      const [aid, al] = pick(qid, absent, 1)[0];
      const ins = pick(`${qid}-in`, present, 3);
      const whyOut = al.from > d ? `${nameOf(aid)} geroago agertzen da, ${dayIn(al.from)}.` : `${nameOf(aid)} jada ez dago: ${dayIn(al.to!)} desagertu edo bihurtu zen${al.becomes?.length ? ` (→ ${al.becomes.map(nameOf).join(', ')})` : ''}.`;
      const p = place(
        qid,
        { text: nameOf(aid), why: `Hau da: ${whyOut}` },
        ins.map(([i, l]) => ({ text: nameOf(i), why: `${nameOf(i)} badago ${dayIn(d)} (${spanLabel(l.from, l.to)}).` })),
      );
      const week = MILESTONES.find((m) => m.day === d)!.week;
      out.push({ id: qid, skill: 'presentzia', concept: aid, question: `Zer EZ dago garapenaren ${dayIn(d)}?`, ...p, explanation: whyOut, week, stageId: MILESTONES.find((m) => m.day === d)!.stage });
    }
  }
  return out;
}

// ——— 3. Ordena kronologikoa ———

function orderQuestions(): GenQuestion[] {
  const out: GenQuestion[] = [];
  const keys = MILESTONES.filter((m) => m.weight !== 'xehetasuna' && m.day <= 56);
  const seenSets = new Set<string>();
  for (let v = 0; v < 12; v++) {
    const qid = `ordena-${v}`;
    // Four milestones at least 2 days apart, in order.
    const chosen: typeof keys = [];
    for (const m of pick(qid, keys, keys.length)) if (chosen.every((c) => Math.abs(c.day - m.day) >= 2) && chosen.length < 4) chosen.push(m);
    if (chosen.length < 4) continue;
    chosen.sort((a, b) => a.day - b.day);
    const sig = chosen.map((m) => m.short).join('|');
    if (seenSets.has(sig)) continue;
    seenSets.add(sig);
    const labels = chosen.map((m) => m.short);
    const right = labels.join(' → ');
    const swaps = [
      [labels[1], labels[0], labels[2], labels[3]],
      [labels[0], labels[2], labels[1], labels[3]],
      [labels[0], labels[1], labels[3], labels[2]],
      [labels[3], labels[1], labels[2], labels[0]],
    ].map((l) => l.join(' → '));
    const wrong = pick(`${qid}-w`, swaps, 3);
    const dated4 = chosen.map((m) => `${m.short} (${dayLabel(m.day, m.to)})`).join(' → ');
    const p = place(qid, { text: right, why: `Bai: ${dated4}.` }, wrong.map((w) => ({ text: w, why: `Ez: ordena zuzena ${dated4} da.` })));
    out.push({ id: qid, skill: 'ordena', question: 'Zein da ordena kronologiko zuzena?', ...p, explanation: dated4, week: chosen[chosen.length - 1].week, stageId: chosen[chosen.length - 1].stage });
  }
  return out;
}

// ——— 4. Zein ernetze orritatik dator X? ———

const LAYER_NAMES = LAYERS.map((l) => l.id);
/** Tempting wrong origins: the early tissues students confuse with the germ layers. */
const DECOYS = ['hipoblastoa', 'trofoblastoa', 'enbrioi-kanpoko-mesodermoa'];

const descendants = (node: LNode): string[] => (node.kids ?? []).flatMap((k) => [...(k.id ? [k.id] : []), ...descendants(k)]);

function layerQuestions(): GenQuestion[] {
  const out: GenQuestion[] = [];
  for (const l of LAYERS) {
    const ids = l.kids.flatMap((k) => [...(k.id ? [k.id] : []), ...descendants(k)]).filter((id) => structures.has(id) && ancestry(id).length >= 3);
    for (const id of ids) {
      const qid = `orria-${id}`;
      const layer = layerOf(id)!;
      const decoy = pick(qid, DECOYS.filter((d) => structures.has(d)), 1);
      const example = (other: string) => {
        const node = LAYERS.find((x) => x.id === other);
        const kid = node ? pick(`${qid}-${other}`, descendants({ kids: node.kids }).filter((k) => structures.has(k)), 1)[0] : undefined;
        return kid ? ` (${nameOf(other)} orritik datoz, adibidez, ${nameOf(kid).toLowerCase()})` : '';
      };
      const via = ancestry(id)
        .slice(ancestry(id).findIndex((c) => c.id === layer))
        .map((c) => nameOf(c.id))
        .join(' → ');
      const p = place(
        qid,
        { text: nameOf(layer), why: `Bai: ${via}.` },
        [
          ...LAYER_NAMES.filter((o) => o !== layer).map((o) => ({ text: nameOf(o), why: `Ez${example(o)}. ${nameOf(id)}: ${via}.` })),
          ...decoy.map((d) => ({ text: nameOf(d), why: `${nameOf(d)} ez da ernetze orri bat: ${structures.get(d)!.definition}` })),
        ],
      );
      out.push({ id: qid, skill: 'jatorria', concept: id, question: `Zein ernetze orritatik ${verb(id, 'dator', 'datoz')} ${nm(id)}?`, ...p, explanation: via, week: weekOf(id), stageId: stageOf(id) });
    }
  }
  return out;
}

// ——— 5. Zer EZ da X-ren eratorria? (intruder) ———

function derivativeQuestions(): GenQuestion[] {
  const out: GenQuestion[] = [];
  const all = lineageIds().filter((id) => structures.has(id));
  for (const id of all) {
    // Somitomeres: only the caudal ones become somites (notes 3.1), so "not a derivative" is ambiguous.
    if (id === 'somitomeroak') continue;
    const mine = descendantsOf(id);
    // Only structures with a handful of derivatives: "what does the zygote give?" is not a question.
    if (mine.length < 3 || mine.length > 30) continue;
    const chain = ancestry(id).map((c) => c.id);
    const unrelated = (d: string) => d !== id && !mine.includes(d) && !chain.includes(d);
    // Intruder: from the CLOSEST other branch (a sibling's derivatives, then a cousin's…), so the
    // wrong option is a real confusion and not an absurd one.
    let near: string[] = [];
    for (let up = chain.length - 2; up >= 0 && !near.length; up--) near = descendantsOf(chain[up]).filter(unrelated);
    // …and among those, the shallowest (a sister tissue, not a distant organ of the other branch).
    const depth = (d: string) => ancestry(d).length;
    const minDepth = Math.min(...near.map(depth));
    near = near.filter((d) => depth(d) <= minDepth + 1);
    const pool = near.length ? near : all.filter(unrelated);
    if (!pool.length) continue;
    const qid = `eratorri-${id}`;
    const intruder = pick(qid, pool, 1)[0];
    const ins = pick(`${qid}-in`, mine, 3);
    const path = (d: string) => {
      const c = ancestry(d).map((x) => x.id);
      return c.slice(c.indexOf(id)).map(nameOf).join(' → ');
    };
    const ic = ancestry(intruder).map((x) => x.id);
    const p = place(
      qid,
      { text: nameOf(intruder), why: `Hau da: ${ic.slice(-3).map(nameOf).join(' → ')}; ez dator «${nameOf(id)}» egituratik.` },
      ins.map((d) => ({ text: nameOf(d), why: `Eratorria da: ${path(d)}.` })),
    );
    out.push({ id: qid, skill: 'eratorria', concept: id, question: `Hauetako zein EZ da ${nm(id)} egituraren eratorria?`, ...p, explanation: `${nameOf(id)} → ${mine.slice(0, 6).map(nameOf).join(', ')}${mine.length > 6 ? '…' : ''}.`, week: weekOf(id), stageId: stageOf(id) });
  }
  return out;
}

// ——— 6. Nondik dator X zuzenean? ———

function parentQuestions(): GenQuestion[] {
  const out: GenQuestion[] = [];
  for (const id of structures.keys()) {
    const chain = ancestry(id);
    if (chain.length < 3) continue;
    const parent = chain[chain.length - 2].id;
    const grand = chain[chain.length - 3].id;
    // Distractors: the parent's siblings and cousins (same generation), never an ancestor.
    const siblings = childrenOf(grand).filter((s) => s !== parent);
    const uncles = chain.length >= 4 ? childrenOf(chain[chain.length - 4].id).flatMap((u) => childrenOf(u)).filter((s) => s !== parent) : [];
    const pool = [...new Set([...siblings, ...uncles])].filter((s) => !chain.some((c) => c.id === s) && s !== id);
    if (pool.length < 2) continue;
    const qid = `nondik-${id}`;
    const wrong = pick(qid, pool, 3);
    const p = place(
      qid,
      { text: nameOf(parent), why: `Bai: ${nameOf(parent)} → ${nameOf(id)}${chain[chain.length - 1].via ? ` (${chain[chain.length - 1].via})` : ''}.` },
      wrong.map((w) => ({ text: nameOf(w), why: childrenOf(w).length ? `Ez: ${nameOf(w)} → ${childrenOf(w).map(nameOf).join(', ')}.` : `Ez: ${nameOf(w)}. ${structures.get(w)!.definition}` })),
    );
    out.push({ id: qid, skill: 'jatorria', concept: id, question: `Zuzenean nondik ${verb(id, 'sortzen da', 'sortzen dira')} ${nm(id)}?`, ...p, explanation: chain.slice(-4).map((c) => nameOf(c.id)).join(' → '), week: weekOf(id), stageId: stageOf(id) });
  }
  return out;
}

// ——— 7. Zer da hau? (the notes' definition, with the name hidden) ———

// A sentence ends at . ! ? — not after a number ("3.") or a Roman numeral ("I. meiosia").
export const firstSentence = (t: string) => t.match(/^.+?(?<!\d)(?<![\s(][IVX]{1,4})[.!?](?=\s|$)/)?.[0] ?? t;
/** Word-initial stems of a structure's names (Basque adds endings: "trofoblasto-tik"). */
const stemsOf = (id: string) => {
  const s = structures.get(id)!;
  return [s.name, ...(s.aka ?? [])].map((n) => n.toLowerCase().replace(/(ak|a)$/, '')).filter((n) => n.length >= 3);
};
const escape = (t: string) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const mentions = (text: string, id: string) => stemsOf(id).some((n) => new RegExp(`(^|[^a-zñ])${escape(n)}`, 'i').test(text));
/** Hide every mention of the structure's names (the whole inflected word). */
const mask = (text: string, id: string) => stemsOf(id).reduce((t, n) => t.replace(new RegExp(`(^|[^a-zñA-ZÑ])${escape(n)}[a-zñ-]*`, 'gi'), '$1___'), text);

/** Same topic first, then the same kind of thing: the options must be real rivals. */
function rivals(id: string, ok: (o: string) => boolean) {
  const s = structures.get(id)!;
  const w = weekOf(id);
  const all = [...structures.keys()].filter((o) => o !== id && ok(o));
  const same = (o: string) => structures.get(o)!.category === s.category;
  const close = all.filter((o) => same(o) && weekOf(o) === w);
  const kin = all.filter((o) => same(o) && Math.abs(weekOf(o) - w) === 1);
  const near = all.filter((o) => weekOf(o) === w && !same(o));
  return [...pick(`${id}:c`, close, 3), ...pick(`${id}:k`, kin, 3), ...pick(`${id}:n`, near, 3)];
}

function definitionQuestions(): GenQuestion[] {
  const out: GenQuestion[] = [];
  for (const [id, s] of structures) {
    const def = firstSentence(s.definition ?? '');
    const text = mask(def, id);
    // Too short to recognise, or the name still shows through.
    if (text.replace(/___/g, '').trim().length < 45 || mentions(text, id) || text.startsWith('Ikus')) continue;
    // Structures named in the definition are part of it, so they cannot be the rival answer.
    const pool = rivals(id, (o) => !mentions(text, o) && !mentions(firstSentence(structures.get(o)!.definition ?? ''), id) && structures.get(o)!.name !== s.name);
    const wrong = [...new Set(pool)].slice(0, 3);
    if (wrong.length < 3) continue;
    const qid = `zer-${id}`;
    const p = place(
      qid,
      { text: s.name, why: `Bai: ${s.name}. ${def}` },
      wrong.map((w) => ({ text: nameOf(w), why: `Ez: ${nameOf(w)} — ${firstSentence(structures.get(w)!.definition)}` })),
    );
    out.push({ id: qid, skill: 'definizioa', concept: id, question: `Zer da hau? «${text}»`, ...p, explanation: `${s.name}: ${def}`, week: weekOf(id), stageId: stageOf(id) });
  }
  return out;
}

// ——— 8. Non dago X? ———

function locationQuestions(): GenQuestion[] {
  const out: GenQuestion[] = [];
  // A list of parts ("Atalak: …") is not a place.
  const located = [...structures.values()].filter((s) => (s.location ?? '').length >= 18 && !/^atalak/i.test(s.location!));
  const words = (t: string) => new Set((t.toLowerCase().match(/[a-zñ]{5,}/g) ?? []).map((w) => w.slice(0, 6)));
  /** Two places that share most of their words would both be right: never offer them together. */
  const alike = (a: string, b: string) => {
    const A = words(a);
    const B = words(b);
    const both = [...A].filter((w) => B.has(w)).length;
    return both / Math.max(1, Math.min(A.size, B.size)) >= 0.5;
  };
  const related = (a: string, b: string) => !!structures.get(a)!.related?.includes(b) || !!structures.get(b)!.related?.includes(a);
  for (const s of located) {
    const where = s.location!;
    // Rival places from the same topic that do not name this structure and do not read the same.
    const pool = rivals(s.id, (o) => {
      const l = structures.get(o)!.location ?? '';
      return l.length >= 18 && !/^atalak/i.test(l) && !mentions(l, s.id) && !alike(l, where) && !related(o, s.id);
    });
    // …nor two rivals that read alike (the answer must be the only fit).
    const wrong: string[] = [];
    for (const o of new Set(pool)) if (wrong.length < 3 && !wrong.some((w) => alike(structures.get(w)!.location!, structures.get(o)!.location!))) wrong.push(o);
    if (wrong.length < 3) continue;
    const qid = `non-${s.id}`;
    const p = place(
      qid,
      { text: where, why: `Bai: ${s.name} — ${where}` },
      wrong.map((w) => ({ text: structures.get(w)!.location!, why: `Ez: hori ${nameOf(w)} da.` })),
    );
    out.push({ id: qid, skill: 'kokapena', concept: s.id, question: isProcess(s.id) ? `Non gertatzen da ${nm(s.id)}?` : `Non ${verb(s.id, 'dago', 'daude')} ${nm(s.id)}?`, ...p, explanation: `${s.name}: ${where}`, week: weekOf(s.id), stageId: stageOf(s.id) });
  }
  return out;
}

/** All generated questions, built once. */
export const generated: GenQuestion[] = [
  ...whenQuestions(),
  ...absentQuestions(),
  ...orderQuestions(),
  ...layerQuestions(),
  ...derivativeQuestions(),
  ...parentQuestions(),
  ...definitionQuestions(),
  ...locationQuestions(),
];
