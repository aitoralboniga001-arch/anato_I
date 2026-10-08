/**
 * Chronology: the single place that says WHEN things happen. Everything that answers "zein egunetan?",
 * "zer dago orain?" or "zer ez da X. astean gertatzen?" reads from here, so the timeline, the structure
 * passport and the generated questions can never disagree with each other.
 *
 * Days are days of development counted from fertilisation (the notes' "garapenaren X. eguna"), not
 * from the last menstrual period. Dates follow the notes; where the notes give a range, the value is
 * the start of it and the range is written in `note`.
 */

import { weeks, structures } from './registry';

export interface Period {
  id: string;
  name: string;
  from: number;
  to: number;
  /** How the course names it and which convention it follows. */
  note: string;
}

/** The course convention (notes, topic 1 and 4): embryonic period = weeks 3–8, fetal period = week 9 to birth. */
export const PERIODS: Period[] = [
  { id: 'lehen-asteak', name: 'Lehen bi asteak', from: 0, to: 14, note: 'Ernalkuntzatik bi orriko diskora (1. eta 2. asteak).' },
  { id: 'enbrioi-aroa', name: 'Enbrioi-aroa', from: 15, to: 56, note: 'Apunteen konbentzioa: 3. astetik 8. astearen bukaerara. Organo-sistemen hastapenak.' },
  { id: 'fetu-aroa', name: 'Fetu-aroa', from: 57, to: 266, note: '9. astetik jaiotzara: hazkundea eta heltzea.' },
];

export const periodOf = (day: number) => PERIODS.find((p) => day <= p.to) ?? PERIODS[PERIODS.length - 1];

/** Topic (gaia) → stage lookups are by id so milestones can deep-link into the simulator. */
export interface Milestone {
  day: number;
  /** Optional end of the window (for "15–16. egunak"). */
  to?: number;
  text: string;
  /** Two or three words, for orderings and compact lists. */
  short: string;
  /** Topic number and stage id that shows it. */
  week: number;
  stage: string;
  /** Priority: 'gakoa' = core date of the notes (or one others build on), 'oinarria' = needed to follow, 'xehetasuna' = detail. */
  weight: 'gakoa' | 'oinarria' | 'xehetasuna';
  /** Structures this milestone creates (used by "Zer dago orain?" to mark them as new). */
  makes?: string[];
}

export const MILESTONES: Milestone[] = [
  { day: 0, short: 'Ernalkuntza', text: 'Ernalkuntza tronparen anpuluan; obozitoak II. meiosia bukatzen du', week: 1, stage: 'ernalkuntza', weight: 'gakoa', makes: ['zigotoa'] },
  { day: 1, to: 3, short: 'Segmentazioa', text: 'Segmentazioa: blastomeroak, mintz peluzidoaren barruan', week: 1, stage: 'segmentazioa', weight: 'oinarria', makes: ['blastomeroak'] },
  { day: 3, short: 'Morula', text: 'Morula (12–16 zelula) umetokira iristen da', week: 1, stage: 'segmentazioa', weight: 'oinarria', makes: ['morula'] },
  { day: 4, to: 5, short: 'Blastozistoa', text: 'Blastozistoa: enbrioblastoa, trofoblastoa eta blastozelea; mintz peluzidoa desagertzen da', week: 1, stage: 'blastozistoa', weight: 'gakoa', makes: ['blastozistoa', 'enbrioblastoa', 'trofoblastoa', 'blastozelea'] },
  { day: 6, short: 'Habiratzea hasi', text: 'Habiratzea hasten da (mutur enbrionarioa, endometrioan)', week: 1, stage: 'habiratzea', weight: 'gakoa' },
  { day: 8, short: 'Bi orriko diskoa', text: 'Trofoblastoa → zitotrofoblastoa + sinzitiotrofoblastoa; enbrioblastoa → epiblastoa + hipoblastoa (bi orriko diskoa); amnios barrunbea', week: 2, stage: 'eguna-8', weight: 'gakoa', makes: ['zitotrofoblastoa', 'sinzitiotrofoblastoa', 'epiblastoa', 'hipoblastoa', 'bi-orriko-diskoa', 'amnios-barrunbea'] },
  { day: 9, short: 'Garai lakunarra', text: 'Garai lakunarra; Heuser mintza → hasierako bitelo zakua; fibrina-koagulua', week: 2, stage: 'eguna-9', weight: 'gakoa', makes: ['lakuak', 'heuser-mintza', 'hasierako-bitelo-zakua', 'fibrina-koagulua'] },
  { day: 11, to: 12, short: 'Korion barrunbea', text: 'Sare lakunarra eta zirkulazio uteroplazentarioa; enbrioiz kanpoko mesodermoa → korion barrunbea', week: 2, stage: 'eguna-11-12', weight: 'gakoa', makes: ['sare-lakunarra', 'enbrioi-kanpoko-mesodermoa', 'korion-barrunbea', 'finkapen-pedikulua'] },
  { day: 13, short: 'Biloxka primarioak', text: 'Biloxka primarioak; bitelo zaku sekundarioa; blastozistoa guztiz habiratuta', week: 2, stage: 'eguna-13', weight: 'gakoa', makes: ['biloxka-primarioa', 'bitelo-zaku-sekundarioa', 'korioia'] },
  { day: 15, to: 16, short: 'Lerro primitiboa', text: 'Lerro primitiboa: gastrulazioa hasten da (hiru orriko diskoa)', week: 3, stage: 'gastrulazioa', weight: 'gakoa', makes: ['lerro-primitiboa', 'nodo-primitiboa', 'endodermoa', 'mesodermo-intraenbrionarioa', 'ektodermoa'] },
  { day: 16, short: 'Biloxka sekundarioak', text: 'Biloxka sekundarioak (mesodermo ardatza); kloaka mintza; alantoidea', week: 3, stage: 'biloxkak', weight: 'oinarria', makes: ['biloxka-sekundarioa', 'kloaka-mintza', 'alantoidea'] },
  { day: 16, to: 18, short: 'Notokorda', text: 'Notokorda: prozesu notokordala → plaka → notokorda behin betikoa', week: 3, stage: 'notokorda', weight: 'gakoa', makes: ['notokorda'] },
  { day: 17, short: 'Mesodermoaren banaketa', text: 'Mesodermoa banatzen da: paraxiala, bitartekoa eta albokoa', week: 4, stage: 'mesodermoa-banatzen', weight: 'gakoa', makes: ['mesodermo-paraxiala', 'bitarteko-mesodermoa', 'alboko-mesodermoa'] },
  { day: 18, short: 'Plaka neurala', text: 'Notokordak ektodermoa induzitzen du → plaka neurala', week: 4, stage: 'neurulazioa', weight: 'gakoa', makes: ['plaka-neurala'] },
  { day: 19, to: 21, short: 'Biloxka tertziarioak', text: 'Biloxka tertziarioak (kapilarrak) eta kanpoko zorro zitotrofoblastikoa', week: 3, stage: 'zorro-zitotrofoblastikoa', weight: 'oinarria', makes: ['biloxka-tertziarioa', 'kanpoko-zorro-zitotrofoblastikoa'] },
  { day: 20, short: 'Lehen somita bikotea', text: 'Lehenengo somita bikotea (okzipitala)', week: 4, stage: 'somitak', weight: 'gakoa', makes: ['somitak'] },
  { day: 22, short: 'Bihotz-taupadak', text: '4. astean bihotza taupaka hasten da: enbrioi barruko eta kanpoko zirkulazioa funtzionala', week: 3, stage: 'zirkulazioa', weight: 'oinarria' },
  { day: 22, short: 'Hodi neurala ixten hasi', text: 'Tolesdura neuralak elkartzen hasten dira → hodi neurala; gandor neurala; tolespenak hasten dira', week: 4, stage: 'neurulazioa', weight: 'gakoa', makes: ['hodi-neurala', 'gandor-neurala'] },
  { day: 22, to: 28, short: 'Septum transversuma', text: 'Septum transversuma lepo mailan (C3–C5): zeloma hasierako perikardio barrunbean eta peritoneo barrunbean banatzen du (erreten perikardioperitonealak salbu)', week: 7, stage: 'septum-transversum', weight: 'gakoa', makes: ['septum-transversum', 'hasierako-perikardio-barrunbea', 'erreten-perikardioperitonealak'] },
  { day: 25, short: 'Neuroporo kranealaren itxiera', text: 'Neuroporo kraneala ixten da', week: 4, stage: 'neurulazioa', weight: 'gakoa' },
  { day: 28, short: 'Neuroporo kaudalaren itxiera', text: 'Neuroporo kaudala ixten da; tolespenen ondoren enbrioia zilindrikoa', week: 4, stage: 'neurulazioa', weight: 'gakoa' },
  { day: 28, to: 32, short: 'Gorputz-adarren hasikinak', text: 'Gorputz-adarren hasikinak (goikoak lehenago, behekoak 2–3 egun beranduago): hilabete 1en bukaeran hasikinak bakarrik, ez gorputz-adarrak', week: 5, stage: 'enbrioia-28-32', weight: 'gakoa', makes: ['goiko-gorputz-adarraren-hasikina', 'beheko-gorputz-adarraren-hasikina'] },
  { day: 29, to: 35, short: 'Mintz pleuroperikardikoak eta pleuroperitonealak', text: '5. astea: mintz pleuroperikardikoak fusionatzen dira (pleura eta perikardio barrunbeak) eta mintz pleuroperitonealek erreten perikardioperitonealak ixten dituzte', week: 7, stage: 'pleura-perikardioa', weight: 'gakoa', makes: ['mintz-pleuroperikardikoak', 'mintz-pleuroperitonealak', 'pleura-barrunbea', 'perikardio-barrunbea'] },
  { day: 35, short: 'Azken somitak', text: 'Somiten agerpena bukatzen da (42–44 bikote, 5. astearen bukaera)', week: 4, stage: 'somitak', weight: 'xehetasuna' },
  { day: 35, short: 'Septumaren jaitsiera', text: '5. astearen bukaera: septum transversuma jaitsita (aurrea T6, atzea T12); nerbio frenikoa (C3–C5) luzatzen da', week: 7, stage: 'diafragma-eraketa', weight: 'gakoa' },
  { day: 42, short: 'Lehen kartilagoak', text: '6. astea: gorputz-adarretako mesenkimatik lehen kartilagoak agertzen dira (geroago hezurrak izango direnak)', week: 8, stage: 'gorputz-adarrak', weight: 'oinarria', makes: ['kartilago-eredua'] },
  { day: 56, short: 'Enbrioi-aroaren bukaera', text: 'Enbrioi-aroaren bukaera (8. astea): organo-sistema guztien hastapenak', week: 5, stage: 'enbrioia-42-56', weight: 'gakoa' },
  { day: 56, short: 'Hezurtzapen zentroak', text: '8. astea: hezurtzapen zentroak gorputz-adarretako kartilagoetan agertzen dira eta gorputz-adarrek biratu egiten dute', week: 8, stage: 'gorputz-adarrak', weight: 'gakoa', makes: ['hezurtzapen-zentroak'] },
  { day: 57, short: 'Fetu-aroaren hasiera', text: 'Fetu-aroa hasten da (9. astea): hazkundea eta heltzea', week: 5, stage: 'hirugarren-hilabetea', weight: 'gakoa' },
  { day: 84, short: 'Hesteak abdomenera itzuli', text: 'Heste-lakioak barrunbe abdominalera itzultzen dira (12. astea inguru)', week: 5, stage: 'hirugarren-hilabetea', weight: 'oinarria' },
  { day: 84, short: 'Zentro primarioak', text: '12. astea: hezur luze guztien diafisietan hezurtzapen zentro primarioak agertzen dira', week: 8, stage: 'hezur-luzeak', weight: 'gakoa' },
  { day: 266, short: 'Jaiotza', text: 'Jaiotza: 38 aste ernalkuntzatik (280 egun azken hilekotik)', week: 5, stage: 'iraupena', weight: 'gakoa' },
];

/**
 * Life span of the structures whose timing the notes stress. `from`/`to` are development days;
 * `to` is omitted while the structure persists (or becomes something else, see `becomes`).
 * Structures not listed here fall back to the stage that first shows them (see `lifeOf`).
 */
export interface Life {
  from: number;
  to?: number;
  /** When it stops existing as such, what it turns into (structure ids). */
  becomes?: string[];
  /** How the notes phrase the date, when it is a range or a convention. */
  note?: string;
}

export const LIFE: Record<string, Life> = {
  // 1. astea
  'obozito-sekundarioa': { from: 0, to: 0, becomes: ['obulua'], note: 'II. meiosia ernalkuntzan bukatzen da.' },
  zigotoa: { from: 0, to: 1, becomes: ['blastomeroak'] },
  blastomeroak: { from: 1, to: 3, becomes: ['morula'] },
  morula: { from: 3, to: 4, becomes: ['blastozistoa'], note: '3. egunean 12–16 zelula, istmoan.' },
  'mintz-peluzidoa': { from: 0, to: 4, note: 'Morula umetokian sartzean (4–5. egunak) galtzen da; 6. eguneko blastozistoak ez dauka.' },
  blastozistoa: { from: 4, to: 14, note: 'Apunteek 13. eguneraino deitzen diote blastozistoa.' },
  blastozelea: { from: 4, to: 9, becomes: ['hasierako-bitelo-zakua'], note: 'Heuser mintzak estaltzen du 9. egunean.' },
  enbrioblastoa: { from: 4, to: 8, becomes: ['epiblastoa', 'hipoblastoa'] },
  trofoblastoa: { from: 4, to: 8, becomes: ['zitotrofoblastoa', 'sinzitiotrofoblastoa'] },
  // 2. astea
  zitotrofoblastoa: { from: 8 },
  sinzitiotrofoblastoa: { from: 8 },
  epiblastoa: { from: 8, to: 16, becomes: ['ektodermoa', 'mesodermo-intraenbrionarioa', 'endodermoa'], note: 'Gastrulazioan epiblastoak sortzen ditu hiru orriak.' },
  hipoblastoa: { from: 8, to: 16, becomes: ['endodermoa'], note: 'Endoderma behin betikoak ordezkatzen du gastrulazioan.' },
  'bi-orriko-diskoa': { from: 8, to: 15, becomes: ['hiru-orriko-diskoa'] },
  'amnios-barrunbea': { from: 8 },
  lakuak: { from: 9, to: 11, becomes: ['sare-lakunarra'] },
  'heuser-mintza': { from: 9, to: 13, becomes: ['bitelo-zaku-sekundarioa'] },
  'hasierako-bitelo-zakua': { from: 9, to: 13, becomes: ['bitelo-zaku-sekundarioa', 'kiste-exozelomikoak'] },
  'fibrina-koagulua': { from: 9, to: 13 },
  'sare-lakunarra': { from: 11 },
  'enbrioi-kanpoko-mesodermoa': { from: 11 },
  'korion-barrunbea': { from: 12, to: 90, note: 'Amniosa hazi ahala desagertzen da: amniosa eta korion leuna fusionatzen dira (mintz amniokorionikoa). Apunteek ez dute data ematen; Langman: 3. hilabetearen bukaera inguru.' },
  'finkapen-pedikulua': { from: 12, to: 28, becomes: ['behin-betiko-zilbor-hestea'] },
  'biloxka-primarioa': { from: 13, to: 16, becomes: ['biloxka-sekundarioa'] },
  'bitelo-zaku-sekundarioa': { from: 13 },
  'kiste-exozelomikoak': { from: 13 },
  korioia: { from: 13 },
  // 3. astea
  'hiru-orriko-diskoa': { from: 15 },
  'lerro-primitiboa': { from: 15, to: 28, note: 'Apunteek ez dute amaiera-datarik ematen; Langman: atzeratu eta 4. astearen bukaeran desagertzen da.' },
  'nodo-primitiboa': { from: 15, to: 28 },
  'hobitxo-primitiboa': { from: 15, to: 28 },
  ektodermoa: { from: 15 },
  endodermoa: { from: 15 },
  'mesodermo-intraenbrionarioa': { from: 15, to: 17, becomes: ['mesodermo-paraxiala', 'bitarteko-mesodermoa', 'alboko-mesodermoa'] },
  'kloaka-mintza': { from: 16 },
  'mintz-bukofaringeoa': { from: 16 },
  'plaka-prekordala': { from: 16 },
  'biloxka-sekundarioa': { from: 16, to: 21, becomes: ['biloxka-tertziarioa'] },
  alantoidea: { from: 16 },
  'notokorda-plaka': { from: 17, to: 18, becomes: ['notokorda'] },
  'hodi-neuroenterikoa': { from: 17, to: 18, note: 'Iragankorra: amnios barrunbea eta bitelo zakua lotzen ditu une batez.' },
  notokorda: { from: 18, note: 'Helduan: disko ornoarteko nukleo pultposoa.' },
  'biloxka-tertziarioa': { from: 19 },
  'kanpoko-zorro-zitotrofoblastikoa': { from: 19 },
  // 4. astea
  'mesodermo-paraxiala': { from: 17, becomes: ['somitomeroak', 'somitak'] },
  'bitarteko-mesodermoa': { from: 17 },
  'alboko-mesodermoa': { from: 17, becomes: ['paretako-orria', 'errai-orria'] },
  'enbrioi-barruko-zeloma': { from: 18 },
  'plaka-neurala': { from: 18, to: 22, becomes: ['hodi-neurala'] },
  somitomeroak: { from: 18 },
  somitak: { from: 20, note: 'Lehen bikotea 20. egunean; 5. astearen bukaerara arte agertzen dira (42–44 bikote).' },
  'tolesdura-neuralak': { from: 21, to: 28, becomes: ['hodi-neurala'] },
  'hodi-neurala': { from: 22, note: 'Lepoaldean hasten da ixten eta bi norabideetan jarraitzen du.' },
  'gandor-neurala': { from: 22 },
  'neuroporo-kraneala': { from: 22, to: 25, note: '~25. egunean ixten da.' },
  'neuroporo-kaudala': { from: 22, to: 28, note: '~28. egunean ixten da (kranealaren ondoren).' },
  'tolestura-kraneokaudala': { from: 22, to: 28 },
  'tolestura-laterala': { from: 22, to: 28 },
  'paretako-orria': { from: 22 },
  'errai-orria': { from: 22 },
  'aurreko-hestea': { from: 22 },
  'erdiko-hestea': { from: 22 },
  'atzeko-hestea': { from: 22 },
  esklerotoma: { from: 22 },
  'dermatomiotoma': { from: 22, becomes: ['dermatoma', 'miotoma'] },
  'faringe-arkuak': { from: 22 },
  'hasierako-zilbor-eraztuna': { from: 28 },
  'goiko-gorputz-adarraren-hasikina': { from: 28, note: 'Hilabete 1en bukaeran hasikinak daude, ez gorputz-adarrak.' },
  'beheko-gorputz-adarraren-hasikina': { from: 30, note: 'Goikoak baino 2–3 egun beranduago.' },
  // Fetu-aroa
  'zilbor-ernia-fisiologikoa': { from: 42, to: 84, note: '6. astetik; 12. astearen inguruan itzultzen dira hesteak.' },
  'korion-leuna': { from: 50, note: '2.–3. hilabeteak: mutur anenbrionarioko biloxkak endekatu eta 3. hilabetean desagertzen dira.' },
  'korion-hostotsua': { from: 50, note: '2.–3. hilabeteak.' },
  'mintz-amniokorionikoa': { from: 84 },
};

/** Where a structure is first shown forming: the first step that focuses on it. */
export interface FirstSeen {
  day: number;
  week: number;
  stage: string;
  /** Step index and its start time within the stage; -1 when only listed, never focused. */
  beat: number;
  at: number;
  text?: string;
}

// In reading order (the order a student meets it). A focused step explains how the structure forms,
// so it wins over a stage that merely lists it.
const firstSeen: Map<string, FirstSeen> = (() => {
  const focused = new Map<string, FirstSeen>();
  const listed = new Map<string, FirstSeen>();
  for (const w of weeks)
    for (const s of w.stages) {
      const span = s.dayRange[1] - s.dayRange[0];
      s.beats.forEach((b, k) => {
        for (const id of [...(b.focus ?? []), ...(b.tour ?? [])]) {
          const day = Math.round((s.dayRange[0] + span * b.at) * 10) / 10;
          if (!focused.has(id)) focused.set(id, { day, week: w.week, stage: s.id, beat: k, at: b.at, text: b.text });
        }
      });
      for (const id of s.structures) if (!listed.has(id)) listed.set(id, { day: s.dayRange[0], week: w.week, stage: s.id, beat: -1, at: 0 });
    }
  for (const [id, f] of listed) if (!focused.has(id)) focused.set(id, f);
  return focused;
})();

/** The step that first shows a structure (the "Nola sortzen da?" answer and the time-machine target). */
export const firstSeenOf = (id: string) => firstSeen.get(id) ?? null;

/** Categories whose "when" is a real developmental date (maternal anatomy and axes are always there). */
const TIMED = new Set(['ektodermoa', 'mesodermoa', 'endodermoa', 'enbrioi-kanpokoa', 'trofoblastoa', 'enbrioblastoa', 'barrunbea', 'gametoa', 'anatomia']);

/** The life span of a structure, or null when timing does not apply (maternal organs, axes, processes). */
export function lifeOf(id: string): (Life & { exact: boolean }) | null {
  if (LIFE[id]) return { ...LIFE[id], exact: true };
  const s = structures.get(id);
  const f = firstSeen.get(id);
  if (!s || !f || !TIMED.has(s.category)) return null;
  return { from: Math.floor(f.day), exact: false };
}

export type Presence = 'berria' | 'badago' | 'desagertua' | 'oraindik-ez';

/** Where a structure stands on a given day. "Berria" = appeared in the last `fresh` days. */
export function presenceAt(id: string, day: number, fresh = 2): Presence | null {
  const l = lifeOf(id);
  if (!l) return null;
  if (day < l.from) return 'oraindik-ez';
  if (l.to !== undefined && day > l.to) return 'desagertua';
  return day - l.from < fresh ? 'berria' : 'badago';
}

/** The structures with a curated life span, ordered by first day: the backbone of "Zer dago orain?". */
export const TIMELINE_IDS = Object.keys(LIFE)
  .filter((id) => structures.has(id))
  .sort((a, b) => LIFE[a].from - LIFE[b].from);

/** Readable date: "8. eguna", "15–16. egunak", "12. astea". */
export function dayLabel(from: number, to?: number) {
  const one = (d: number) => (d <= 56 ? `${d}` : `${Math.ceil(d / 7)}`);
  const unit = (d: number, many: boolean) => (d <= 56 ? (many ? '. egunak' : '. eguna') : many ? '. asteak' : '. astea');
  if (to === undefined || to === from) return `${one(from)}${unit(from, false)}`;
  if ((from <= 56) === (to <= 56)) return `${one(from)}–${one(to)}${unit(to, true)}`;
  return `${one(from)}${unit(from, false)} – ${one(to)}${unit(to, false)}`;
}

/**
 * Day → position (0..1) on a whole-development scale: the first month gets most of the room (0–0.6),
 * weeks 5–8 the next fifth and the fetal period the last fifth, as in the notes' own emphasis.
 */
export const dayToX = (d: number) => (d <= 28 ? (d / 28) * 0.6 : d <= 56 ? 0.6 + ((d - 28) / 28) * 0.2 : 0.8 + ((Math.min(d, 266) - 56) / 210) * 0.2);
export const xToDay = (x: number) => (x <= 0.6 ? (x / 0.6) * 28 : x <= 0.8 ? 28 + ((x - 0.6) / 0.2) * 28 : 56 + ((Math.min(x, 1) - 0.8) / 0.2) * 210);

/** Locative, for sentences: "8. egunean", "12. astean". */
export const dayIn = (d: number) => (d <= 56 ? `${d}. egunean` : `${Math.ceil(d / 7)}. astean`);

/** A life span in words: "4–9. egunak", or "8. egunetik aurrera" while it lasts. */
export const spanLabel = (from: number, to?: number) => (to === undefined ? `${from <= 56 ? `${from}. egunetik` : `${Math.ceil(from / 7)}. astetik`} aurrera` : dayLabel(from, to));

/** Week of development (1-based) of a day. */
export const weekOfDay = (day: number) => Math.min(38, Math.floor(day / 7) + 1);
