import { appearances, structures, weeks } from './registry';
import { formationOf } from './formation';
import { EARLY, LAYERS, type LNode } from './lineage';

/** Directed course relationships. Composition is part → whole, not cell ancestry. */
export interface AtlasRelation {
  from: string;
  to: string;
  kind: 'origin' | 'transformation' | 'composition' | 'development';
  note?: string;
  /** Course file containing the evidence, with the record/field when available. */
  source: string;
}

const manual: AtlasRelation[] = [];
function relation(from: string, to: string, kind: AtlasRelation['kind'], source: string, note?: string) {
  manual.push({ from, to, kind, source, note });
}
const topic5 = 'content/weeks/week5-structures.ts';
const topic6 = 'content/weeks/week6-structures.ts';

// Explicit relationships omitted by the old lineage drawing. Secondary brain
// vesicles have no catalog records, so they cannot be invented as atlas nodes.
relation('plaka-neurala', 'ildo-neurala', 'development', 'content/weeks/week4.ts#ildo-neurala.origin', 'Plaka tolestean erdiko ildoa agertzen da.');
for (const id of ['gongoil-sinpatikoak', 'gongoil-parasinpatikoak', 'buru-lepo-dermisa', 'meningeak-kraneal', 'bihotz-trenkada-tronkokonala', 'aurpegi-hodi-muskulu-leuna'])
  relation('gandor-neurala', id, 'origin', `content/weeks/week4.ts#${id}.origin`);
relation('gandor-neurala', 'glia-zelulak', 'origin', 'content/weeks/week4.ts#glia-zelulak.origin', 'Zati bat: glia periferikoa.');
relation('hodi-neurala', 'glia-zelulak', 'origin', 'content/weeks/week4.ts#glia-zelulak.origin', 'Erdiko nerbio sistemako glia gehiena.');
relation('mesodermo-intraenbrionarioa', 'aorta-dortsalak', 'origin', 'content/weeks/week4b.ts#aorta-dortsalak.origin', 'Mesodermoko angioblastoak.');
relation('errai-orria', 'mesenterio-dortsala', 'origin', 'content/weeks/week4b.ts#mesenterio-dortsala.origin');

// Explicit origins and morphological development in topic 5. No links are inferred
// from related[] or text matching: an eye, for example, is not derived wholly from a lens placode.
for (const id of ['kristalinoaren-plaka', 'entzumen-plaka', 'sudur-plaka'])
  relation('azaleko-ektodermoa', id, 'origin', `${topic5}#${id}.origin`);
relation('kristalinoaren-plaka', 'kristalinoaren-hobitxoa', 'transformation', `${topic5}#kristalinoaren-hobitxoa.origin`, 'Kristalinoaren plaka inbaginatzen da.');
relation('sudur-plaka', 'sudur-hobia', 'transformation', `${topic5}#sudur-hobia.origin`);
relation('sudur-hobia', 'sudurra', 'development', `${topic5}#sudurra.origin`);
relation('belarriaren-goraguneak', 'belarriaren-pabiloia', 'development', `${topic5}#belarriaren-pabiloia.origin`);
relation('bitarteko-mesodermoa', 'mesonefros-gandorra', 'origin', `${topic5}#mesonefros-gandorra.origin`);
relation('finkapen-pedikulua', 'zilborrestea', 'development', `${topic5}#zilborrestea.origin`);
relation('erdiko-hestea', 'heste-lakioak', 'development', `${topic5}#heste-lakioak.origin`);
for (const id of ['besoa', 'besaurrea', 'eskua'])
  relation('goiko-gorputz-adarraren-hasikina', id, 'development', `${topic5}#goiko-gorputz-adarraren-hasikina.fate`);
for (const id of ['izterra', 'berna', 'oina'])
  relation('beheko-gorputz-adarraren-hasikina', id, 'development', `${topic5}#beheko-gorputz-adarraren-hasikina.fate`);
relation('goiko-gorputz-adarraren-hasikina', 'esku-plaka', 'development', `${topic5}#esku-plaka.definition`, 'Hasikinaren zati distala lautzen da.');
relation('beheko-gorputz-adarraren-hasikina', 'oin-plaka', 'development', `${topic5}#oin-plaka.definition`, 'Hasikinaren zati distala lautzen da.');
relation('esku-plaka', 'eskua', 'development', `${topic5}#eskua.origin`);
relation('oin-plaka', 'oina', 'development', `${topic5}#oina.origin`);
for (const id of ['esku-plaka', 'oin-plaka'])
  relation(id, 'hatzetako-izpiak', 'development', `${topic5}#hatzetako-izpiak.definition`, 'Plakaren urruneko aldean agertzen dira.');
relation('hatzetako-izpiak', 'atzamarrak', 'development', `${topic5}#atzamarrak.origin`, 'Esku plakako izpiak.');
relation('hatzetako-izpiak', 'behatzak', 'development', `${topic5}#behatzak.origin`, 'Oin plakako izpiak.');

// Topic 6 keeps fetal and maternal components as separate inputs to a composite organ.
relation('korion-hostotsua', 'karena', 'composition', `${topic6}#karena.origin`, 'Fetuaren atala.');
relation('dezidua-basala', 'karena', 'composition', `${topic6}#karena.origin`, 'Amaren atala.');
relation('korion-hostotsua', 'karenaren-fetu-atala', 'development', `${topic6}#karenaren-fetu-atala.definition`, 'Egitura bera: korion hostotsua karenaren fetu-osagaia da, ez beste osagai bat.');
relation('dezidua-basala', 'karenaren-ama-atala', 'development', `${topic6}#karenaren-ama-atala.definition`, 'Egitura bera: dezidua basala karenaren ama-osagaia da, ez beste osagai bat.');
relation('trofoblastoa', 'karenaren-fetu-atala', 'origin', `${topic6}#karenaren-fetu-atala.definition`);
relation('enbrioi-kanpoko-mesodermoa', 'karenaren-fetu-atala', 'origin', `${topic6}#karenaren-fetu-atala.definition`);
relation('enbrioi-kanpoko-mesodermoa', 'ehun-konektiboa', 'origin', `${topic6}#ehun-konektiboa.definition`);
for (const id of ['endotelioa', 'ehun-konektiboa', 'zitotrofoblastoa', 'sinzitiotrofoblastoa'])
  relation(id, 'karena-muga', 'composition', `${topic6}#endotelioa.definition`, 'Hasierako lau geruzako karena muga; biloxka askeetan mehetzen da.');
relation('amniosa', 'mintz-amniokorionikoa', 'composition', `${topic6}#mintz-amniokorionikoa.definition`, 'Amnios pareta eta korion leuna fusionatzen dira.');
relation('korion-leuna', 'mintz-amniokorionikoa', 'composition', `${topic6}#mintz-amniokorionikoa.definition`, 'Amnios pareta eta korion leuna fusionatzen dira.');
relation('deziduaren-orria', 'dezidua-basala', 'composition', `${topic6}#deziduaren-orria.definition`, 'Dezidua basalaren geruza zentral eta funtzionala.');
relation('deziduaren-orria', 'deziduaren-trenkadak', 'development', `${topic6}#deziduaren-trenkadak.definition`);
relation('deziduaren-trenkadak', 'kotiledoiak', 'development', `${topic6}#kotiledoiak.definition`, 'Trenkadek karena konpartimendutan banatzen dute; ez da zelula-leinua.');
relation('hasierako-zilbor-hestea', 'behin-betiko-zilbor-hestea', 'transformation', `${topic6}#behin-betiko-zilbor-hestea.origin`, 'Hodiak eta lakioak desagertu edo itzultzen dira; bi arteria eta zain bat geratzen dira.');
relation('finkapen-pedikulua', 'wharton-gelatina', 'origin', `${topic6}#wharton-gelatina.definition`, 'Finkapen pedikuluaren enbrioi kanpoko mesodermotik.');
relation('wharton-gelatina', 'behin-betiko-zilbor-hestea', 'composition', `${topic6}#behin-betiko-zilbor-hestea.definition`);
relation('zilbor-hodiak', 'behin-betiko-zilbor-hestea', 'composition', `${topic6}#behin-betiko-zilbor-hestea.definition`, 'Bi arteria eta zain bat.');

/** Reuse the existing learning trees without upgrading their edges to cell ancestry. */
const legacy: AtlasRelation[] = [];
function walk(node: LNode) {
  for (const child of node.kids ?? []) {
    if (node.id && child.id) legacy.push({
      from: node.id, to: child.id, kind: 'development', source: 'content/lineage.ts',
      note: [child.via, child.note, 'Leinuetako garapen lotura; ez du berez zelula-jatorria adierazten.'].filter(Boolean).join(' '),
    });
    walk(child);
  }
}
walk(EARLY);
for (const layer of LAYERS) {
  relation('epiblastoa', layer.id, 'origin', `content/weeks/week3.ts#${layer.id}.origin`, 'Gastrulazioa.');
  walk({ id: layer.id, kids: layer.kids });
}

export const atlasRelations: AtlasRelation[] = [...legacy, ...manual].filter(
  r => structures.has(r.from) && structures.has(r.to),
);

export const atlasOrigins = (id: string): AtlasRelation[] => atlasRelations.filter(r => r.to === id);
export const atlasDerivatives = (id: string): AtlasRelation[] => atlasRelations.filter(r => r.from === id);

/** Include definition ownership even when a course record has no illustrated appearance. */
export function atlasTopics(id: string): number[] {
  if (!structures.has(id)) return [];
  return [...new Set([
    ...weeks.filter(w => w.structures.some(s => s.id === id)).map(w => w.week),
    ...(appearances.get(id) ?? []).map(a => a.week.week),
  ])].sort((a, b) => a - b);
}

/** Reviewed formation movie, otherwise an actual scene with the selected structure. */
export function atlasHref(id: string): string | null {
  if (!structures.has(id)) return null;
  const formation = formationOf(id);
  if (formation) return `/astea/${formation.week}?${new URLSearchParams({ etapa: formation.stage, ikuspegia: formation.view, eraketa: id })}`;
  const appearance = appearances.get(id)?.find(a => a.stage.views.length > 0);
  if (!appearance) return null;
  const { week, stage } = appearance;
  const focusView = stage.beats.find(b => b.focus?.includes(id) && stage.views.some(v => v.id === b.view))?.view;
  return `/astea/${week.week}?${new URLSearchParams({ etapa: stage.id, ikuspegia: focusView ?? stage.views[0].id, egitura: id })}`;
}

/**
 * The main way back to the start: root → … → id, one recorded relation per step. Where a structure
 * has several sources, ancestry (origin, transformation, development) wins over composition, then
 * the first recorded one; the course's own order decides.
 */
export function atlasPath(id: string): string[] {
  if (!structures.has(id)) return [];
  const rank = (r: AtlasRelation) => (r.kind === 'composition' ? 1 : 0);
  const path = [id];
  for (let at = id; ; ) {
    const up = atlasOrigins(at).filter(r => !path.includes(r.from)).sort((a, b) => rank(a) - rank(b))[0];
    if (!up) break;
    path.unshift(up.from);
    at = up.from;
  }
  return path;
}

/** A "don't confuse" warning from the notes, and the structures it sets against each other. */
export interface AtlasConfusion {
  text: string;
  ids: string[];
  /** Where the warning is written: a structure's card or a stage. */
  where: string;
}

const plain = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('eu').replace(/[-–]/g, ' ').replace(/\s+/g, ' ');
/** Confusing two things, not blood mixing ("ez dira nahasten", "nahastu gabe"). */
const CONFUSE = /\bez nahastu\b|\bnahastea\b|nahaste ohiko|nahastu behar/;
const keysOf = [...structures.values()].map(s => ({
  id: s.id,
  // Names without the Basque article (-a), so "zitotrofoblastoarekin" still names zitotrofoblastoa.
  keys: [s.name, ...(s.aka ?? [])].map(n => plain(n).replace(/\(.*?\)/g, '').trim().replace(/a$/, '')).filter(k => k.length >= 6),
}));

/** Structures a sentence names, in reading order; a name inside a longer one ("mesodermo" in "enbrioi barruko mesodermo") does not count. */
export function namedIn(text: string): string[] {
  const t = plain(text);
  const hits: { id: string; at: number; end: number }[] = [];
  for (const { id, keys } of keysOf)
    for (const k of keys) {
      const re = new RegExp(`(^|[^a-z])${k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'g');
      for (let m; (m = re.exec(t)); ) hits.push({ id, at: m.index + m[1].length, end: m.index + m[0].length });
    }
  const kept = hits.filter(h => !hits.some(o => o !== h && o.at <= h.at && o.end >= h.end && o.end - o.at > h.end - h.at));
  return [...new Set(kept.sort((a, b) => a.at - b.at).map(h => h.id))];
}

/**
 * Structures the warning sets against each other: those named in the clause that says "ez nahastu"
 * (asides in brackets and the explanation after a colon left out), plus the subject it is about.
 */
function confused(text: string, subject: string[]) {
  const clauses = text.replace(/\(.*?\)/g, '').split(/[.;:]/).filter(c => CONFUSE.test(plain(c)));
  // "…: ez nahastu geruza bakoitzaren jatorria" names nothing itself: it warns about the statement before it.
  const named = clauses.flatMap(namedIn).length ? clauses.flatMap(namedIn) : namedIn(text.replace(/\(.*?\)/g, ''));
  // A clause naming only the other one ("Ez nahastu korion barrunbearekin") is about the text's first-named structure.
  return [...subject, ...named, ...(subject.length + new Set(named).size < 2 ? namedIn(text).slice(0, 1) : [])];
}

const confusions: AtlasConfusion[] = (() => {
  const out: AtlasConfusion[] = [];
  const add = (text: string, ids: string[], where: string) => {
    const unique = [...new Set(ids)];
    if (unique.length >= 2 && !out.some(c => c.text === text)) out.push({ text, ids: unique, where });
  };
  for (const s of structures.values()) if (s.caution && CONFUSE.test(plain(s.caution))) add(s.caution, confused(s.caution, [s.id]), s.name);
  for (const w of weeks)
    for (const st of w.stages) {
      const where = `${w.week}. gaia · ${st.title}`;
      for (const b of st.beats)
        if (b.caution && CONFUSE.test(plain(b.caution))) add(b.caution, confused(b.caution, b.focus?.length === 1 ? b.focus : []), where);
      for (const text of [...(st.cautions ?? []), ...st.keyPoints]) if (CONFUSE.test(plain(text))) add(text, confused(text, []), where);
    }
  return out;
})();

/** The notes' "ez nahastu" warnings that involve this structure and at least one other. */
export const atlasConfusions = (id: string): AtlasConfusion[] => confusions.filter(c => c.ids.includes(id));

/** The structure an answer option *is* (its name, maybe with a case ending: "Esklerotomatik"), else null. */
export function structureNamed(option: string): string | null {
  const t = plain(option).replace(/[.]/g, '').trim();
  for (const { id, keys } of keysOf) if (keys.some(k => t.startsWith(k) && t.length - k.length <= 6 && !t.slice(k.length).includes(' '))) return id;
  return null;
}
