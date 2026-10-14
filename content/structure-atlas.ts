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

// 7. gaia: gorputzaren barrunbeak eta diafragma.
const topic7 = 'content/weeks/week7-structures.ts';
relation('enbrioi-barruko-zeloma', 'hasierako-perikardio-barrunbea', 'transformation', `${topic7}#septum-transversum.fate`, 'Septum transversumaren gainean.');
relation('hasierako-perikardio-barrunbea', 'pleura-barrunbea', 'transformation', `${topic7}#hasierako-perikardio-barrunbea.fate`);
relation('hasierako-perikardio-barrunbea', 'perikardio-barrunbea', 'transformation', `${topic7}#hasierako-perikardio-barrunbea.fate`);
relation('paretako-orria', 'paretako-peritoneoa', 'origin', `${topic7}#paretako-peritoneoa.origin`);
relation('errai-orria', 'errai-peritoneoa', 'origin', `${topic7}#errai-peritoneoa.origin`);
relation('errai-orria', 'errai-pleura', 'origin', `${topic7}#errai-pleura.origin`, 'Birika hastapenek bultzatuta.');
relation('paretako-orria', 'perikardio-serosoa', 'origin', `${topic7}#perikardio-serosoa.origin`, 'Somatopleura.');
relation('mintz-pleuroperikardikoak', 'perikardio-fibrosoa', 'origin', `${topic7}#perikardio-fibrosoa.origin`, 'Mintzen erdiko mesenkimatik.');
relation('arnas-hastapena', 'hodi-laringotrakeala', 'development', `${topic7}#hodi-laringotrakeala.origin`);
relation('hodi-laringotrakeala', 'birika-hastapenak', 'development', `${topic7}#hodi-laringotrakeala.fate`, 'Erpinetik bi hastapen.');
relation('birika-hastapenak', 'birikak', 'transformation', `${topic7}#birikak.origin`);
relation('mioblastoak', 'miozitoak', 'transformation', `${topic7}#miozitoak.origin`);
relation('lepoko-nerbio-espinalak', 'nerbio-frenikoa', 'composition', `${topic7}#lepoko-nerbio-espinalak.fate`, 'C3, C4 eta C5.');
relation('septum-transversum', 'zentro-tendinosoa', 'origin', `${topic7}#zentro-tendinosoa.origin`);
relation('hestegorri-inguruko-mesenkima', 'gerriko-atala', 'origin', `${topic7}#gerriko-atala.origin`);
for (const id of ['septum-transversum', 'mintz-pleuroperitonealak', 'hestegorri-inguruko-mesenkima', 'gorputz-paretako-mesodermoa'])
  relation(id, 'diafragma', 'composition', `${topic7}#diafragma.origin`);

// 8. gaia: hezur sistema.
const topic8 = 'content/weeks/week8-structures.ts';
relation('esklerotoma', 'mesenkima', 'transformation', `${topic8}#mesenkima.origin`);
relation('mesenkima', 'fibroblastoak', 'origin', `${topic8}#fibroblastoak.origin`);
relation('mesenkima', 'kondroblastoak', 'origin', `${topic8}#kondroblastoak.origin`);
relation('mesenkima', 'osteoblastoak', 'origin', `${topic8}#osteoblastoak.origin`);
relation('kondroblastoak', 'kartilago-eredua', 'origin', `${topic8}#kartilago-eredua.origin`);
relation('kartilago-eredua', 'hezurtzapen-zentroak', 'development', `${topic8}#kartilago-eredua.fate`);
relation('esklerotoma-okzipitalak', 'kartilago-parakordalak', 'origin', `${topic8}#kartilago-parakordalak.origin`);
relation('kartilago-parakordalak', 'okzipitalaren-oinaldea', 'origin', `${topic8}#okzipitalaren-oinaldea.origin`);
relation('hipofisi-kartilagoak', 'esfenoidesaren-gorputza', 'origin', `${topic8}#esfenoidesaren-gorputza.origin`);
relation('trenkada-kranialak', 'etmoidesa', 'origin', `${topic8}#etmoidesa.origin`);
relation('kapsula-periotikoa', 'harkaitza', 'origin', `${topic8}#harkaitza.origin`);
relation('hego-tenporala', 'esfenoidesaren-hego-handia', 'origin', `${topic8}#esfenoidesaren-hego-handia.origin`);
relation('begizulo-hegoa', 'esfenoidesaren-hego-txikia', 'origin', `${topic8}#esfenoidesaren-hego-txikia.origin`);
relation('barra-pterigopalatino-karratua', 'ingudea', 'origin', `${topic8}#ingudea.origin`);
relation('meckel-kartilagoa', 'mailua', 'origin', `${topic8}#mailua.origin`);
relation('meckel-kartilagoa', 'beheko-maxilarra', 'development', `${topic8}#meckel-kartilagoa.fate`);
relation('reichert-kartilagoa', 'ointokia', 'origin', `${topic8}#ointokia.origin`);
relation('reichert-kartilagoa', 'apofisi-estiloidea', 'origin', `${topic8}#apofisi-estiloidea.origin`);
relation('prozesu-maxilarra', 'goiko-maxilarra', 'origin', `${topic8}#goiko-maxilarra.origin`);
relation('prozesu-maxilarra', 'hezur-malarra', 'origin', `${topic8}#hezur-malarra.origin`);
relation('prozesu-maxilarra', 'tenporalaren-ezkata', 'origin', `${topic8}#tenporalaren-ezkata.origin`);
relation('barail-prozesua', 'meckel-kartilagoa', 'origin', `${topic8}#meckel-kartilagoa.origin`);
relation('hioide-arkua', 'reichert-kartilagoa', 'origin', `${topic8}#reichert-kartilagoa.origin`);
relation('notokorda', 'gune-pulposoa', 'origin', `${topic8}#gune-pulposoa.origin`);
relation('esklerotoma-segmentuak', 'orno-gorputza', 'origin', `${topic8}#orno-gorputza.origin`);
relation('segmentu-arteko-mesenkima', 'ornoarteko-diskoa', 'origin', `${topic8}#ornoarteko-diskoa.origin`);
relation('gune-pulposoa', 'ornoarteko-diskoa', 'composition', `${topic8}#ornoarteko-diskoa.origin`);
relation('eraztun-fibrosoa', 'ornoarteko-diskoa', 'composition', `${topic8}#ornoarteko-diskoa.origin`);
relation('esklerotoma', 'saihets-hezurra', 'origin', `${topic8}#saihets-hezurra.origin`);
relation('esklerotoma', 'saihets-kartilagoa', 'origin', `${topic8}#saihets-kartilagoa.origin`);
relation('paretako-orria', 'esternoi-barrak', 'origin', `${topic8}#esternoi-barrak.origin`);
relation('esternoi-barrak', 'esternoia', 'origin', `${topic8}#esternoi-barrak.fate`);
relation('kirtena', 'esternoia', 'composition', `${topic8}#kirtena.fate`);

// 9. gaia: muskulu sistema.
const topic9 = 'content/weeks/week9-structures.ts';
relation('errai-orria', 'muskulu-leuna', 'origin', `${topic9}#muskulu-leuna.origin`, 'Orokorrean; salbuespenak: ektodermoa eta aortaren pareta.');
relation('errai-orria', 'miokardioa', 'origin', `${topic9}#miokardioa.origin`, 'Bi bihotz hodien inguruan.');
relation('mioblastoak', 'zuntz-muskularrak', 'origin', `${topic9}#zuntz-muskularrak.origin`, 'Mioblastoak fusionatuta.');
relation('miokardioa', 'eroapen-sistema', 'development', `${topic9}#miokardioa.fate`, 'Zuntz muskular oso espezializatuak, ez nerbioak.');
relation('esternoiaren-gorputza', 'esternoia', 'composition', `${topic8}#esternoiaren-gorputza.fate`);
relation('apofisi-xifoidea', 'esternoia', 'composition', `${topic8}#apofisi-xifoidea.fate`);
relation('paretako-orria', 'gorputz-adarren-mesenkima', 'origin', `${topic8}#gorputz-adarren-mesenkima.origin`);
relation('gorputz-adarren-mesenkima', 'humeroa', 'origin', `${topic8}#humeroa.origin`);
relation('gorputz-adarren-mesenkima', 'erradioa', 'origin', `${topic8}#erradioa.origin`);
relation('gorputz-adarren-mesenkima', 'ulna', 'origin', `${topic8}#ulna.origin`);
relation('gorputz-adarren-mesenkima', 'femurra', 'origin', `${topic8}#femurra.origin`);
relation('gorputz-adarren-mesenkima', 'tibia', 'origin', `${topic8}#tibia.origin`);
relation('gorputz-adarren-mesenkima', 'peroneoa', 'origin', `${topic8}#peroneoa.origin`);

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
