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
