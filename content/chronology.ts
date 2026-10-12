/**
 * Chronology: the single place that says WHEN things happen. Everything that answers "zein egunetan?",
 * "zer dago orain?" or "zer ez da X. astean gertatzen?" reads from here, so the timeline, the structure
 * passport and the generated questions can never disagree with each other.
 *
 * Days are days of development counted from fertilisation (the notes' "garapenaren X. eguna"), not
 * from the last menstrual period. Dates follow the notes; where the notes give a range, the value is
 * the start of it and the range is written in `note`. Every milestone cites the notes sentences it is
 * worded from (`notes`), and says when the notes give only the week, not the day (`approx`).
 */

import { weeks, structures } from './registry';
import type { StageDef } from '@/lib/sim/types';

export interface Period {
  id: string;
  name: string;
  /** For a band too narrow for the full name. */
  short?: string;
  from: number;
  to: number;
  /** How the course names it and which convention it follows. */
  note: string;
}

/**
 * The course's three periods (notes, topic 1 introduction): first two weeks, embryonic period = weeks 3–8,
 * fetal period = week 9 to birth. The notes' prose adds (topic 3) that today the embryonic period is
 * considered to begin at fertilisation; the bands keep the course's division and say so.
 */
export const PERIODS: Period[] = [
  { id: 'lehen-asteak', name: 'Lehen bi asteak', from: 0, to: 14, note: 'Ernalkuntzatik bi orriko diskora (1. eta 2. asteak).' },
  {
    id: 'enbrioi-aroa',
    name: 'Enbrioi-aroa',
    from: 15,
    to: 56,
    note: 'Gaien banaketa: 3. astetik 8. astearen bukaerara, organo-sistemen hastapenak. Gaur egun, ordea, enbrioi-aroa ernalkuntzan hasten dela jotzen da (3. gaia).',
  },
  { id: 'fetu-aroa', name: 'Fetu-aroa', from: 57, to: 266, note: '9. astetik jaiotzara: hazkundea eta heltzea.' },
  { id: 'jaio-ondoren', name: 'Jaio ondoren', short: 'Jaiota', from: 267, to: 996, note: 'Jaiotzaren ondoren amaitzen direnak (fontanelak, …), lehen bi urteetan.' },
];

/** Birth, in development days (38 weeks from fertilisation), and the end of the scale (two years after birth). */
export const BIRTH = 266;
export const END_DAY = 996;
const MONTH = 30.4;
/** The development day `months` months after birth (for events the notes date after birth). */
export const afterBirth = (months: number) => BIRTH + Math.round(months * MONTH);
/** Months after birth of a postnatal day (at least 1). */
const monthsAfter = (d: number) => Math.max(1, Math.round((d - BIRTH) / MONTH));

export const periodOf = (day: number) => PERIODS.find((p) => day <= p.to) ?? PERIODS[PERIODS.length - 1];

/**
 * The body systems the course follows through time: one lane each on the chronology. A new topic that
 * opens a new system adds one row here; the order is the lane order.
 */
export type SystemId = 'hasiera' | 'eranskinak' | 'nerbioa' | 'barrunbeak' | 'hezurdura' | 'muskuluak' | 'zirkulazioa' | 'kanpo-itxura';

export interface System {
  id: SystemId;
  name: string;
  /** What the lane holds, for its tooltip. */
  note: string;
}

export const SYSTEMS: System[] = [
  { id: 'hasiera', name: 'Enbrioia', note: 'Zigototik hiru orriko diskora: segmentazioa, habiratzea, gastrulazioa, notokorda, mesodermoa, somitak eta tolespenak.' },
  { id: 'eranskinak', name: 'Eranskinak', note: 'Trofoblastoa, lakuak, korion barrunbea, biloxkak eta karena.' },
  { id: 'nerbioa', name: 'Nerbio-sistema', note: 'Plaka neurala, hodi neurala eta neuroporoak.' },
  { id: 'barrunbeak', name: 'Barrunbeak', note: 'Septum transversuma, pleura, perikardio eta peritoneo barrunbeak, diafragma.' },
  { id: 'hezurdura', name: 'Hezurdura', note: 'Esklerotoma, kartilagoak, hezurtzapen zentroak eta gorputz-adarren hezurrak.' },
  { id: 'muskuluak', name: 'Muskuluak', note: 'Somiten bereizketa, miotoma eta zuntz ildaskatuak.' },
  { id: 'zirkulazioa', name: 'Zirkulazioa', note: 'Bihotza eta odol-hodiak.' },
  { id: 'kanpo-itxura', name: 'Kanpo-itxura', note: 'Gorputz-adarrak, enbrioi-aroaren bukaera eta fetua jaiotzara arte.' },
];

export const systemOf = (id: SystemId) => SYSTEMS.find((s) => s.id === id)!;

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
  /** The view to open it in (defaults to the view of the step playing at that moment). */
  view?: string;
  /** Priority: 'gakoa' = core date of the notes (or one others build on), 'oinarria' = needed to follow, 'xehetasuna' = detail. */
  weight: 'gakoa' | 'oinarria' | 'xehetasuna';
  /** Structures this milestone creates (used by "Zer dago orain?" to mark them as new). */
  makes?: string[];
  /** The body system it belongs to (its lane). */
  system: SystemId;
  /** Notes sentence ids (w<topic>/<section>/p<n>/s<n>) the date and the wording come from. */
  notes: string[];
  /** The notes give the week or the month, not the day: the date is shown with "≈". */
  approx?: boolean;
  /** How the notes write the date when days or weeks would misquote them ("4.–5. hilabeteak"). */
  label?: string;
}

export const MILESTONES: Milestone[] = [
  // 1. gaia
  { day: 0, short: 'Ernalkuntza', text: 'Ernalkuntza tronparen anpuluan: bi gameto haploideak fusionatu eta zigotoa sortzen da', week: 1, stage: 'ernalkuntza', weight: 'gakoa', system: 'hasiera', notes: ['w1/4.2/p3/s1', 'w1/4.2/p11/s7'], makes: ['zigotoa'] },
  { day: 1, to: 3, short: 'Segmentazioa', text: 'Segmentazioa: zigotoa mitosiz zatitzen da tronpan, mintz peluzidoaren barruan', week: 1, stage: 'segmentazioa', weight: 'oinarria', system: 'hasiera', notes: ['w1/4.3/p3/s1'], approx: true, makes: ['blastomeroak'] },
  { day: 3, short: 'Morula', text: 'Morula: 16 zelula inguru, masusta itxura, tronparen istmoan', week: 1, stage: 'segmentazioa', weight: 'oinarria', system: 'hasiera', notes: ['w1/4.3/p3/s4', 'w1/4.3/p3/s6'], makes: ['morula'] },
  { day: 4, to: 5, short: 'Blastozistoa', text: 'Morula umetokira sartzen da eta mintz peluzidoa galtzen du; blastozelea agertu eta blastozistoa eratzen da (enbrioblastoa eta trofoblastoa)', week: 1, stage: 'blastozistoa', weight: 'gakoa', system: 'hasiera', notes: ['w1/4.4/p3/s1', 'w1/4.4/p3/s2', 'w1/4.4/p3/s4'], makes: ['blastozistoa', 'enbrioblastoa', 'trofoblastoa', 'blastozelea'] },
  { day: 6, short: 'Habiratzea hasi', text: 'Habiratzea hasten da endometrioan, enbrioblastoaren ondoko trofoblastotik', week: 1, stage: 'habiratzea', weight: 'gakoa', system: 'hasiera', notes: ['w1/4.5/p3/s1', 'w1/4.5/p4/s5'] },
  // 2. gaia
  { day: 8, short: 'Bi orriko diskoa', text: 'Trofoblastoa → zitotrofoblastoa + sinzitiotrofoblastoa; enbrioblastoa → epiblastoa + hipoblastoa (bi orriko diskoa); amnios barrunbea', week: 2, stage: 'eguna-8', weight: 'gakoa', system: 'hasiera', notes: ['w2/1/p4/s1', 'w2/1/p10/s1', 'w2/1/p13/s1'], makes: ['zitotrofoblastoa', 'sinzitiotrofoblastoa', 'epiblastoa', 'hipoblastoa', 'bi-orriko-diskoa', 'amnios-barrunbea'] },
  { day: 9, short: 'Garai lakunarra', text: 'Garai lakunarra; Heuser-en mintza → hasierako bitelo zakua; fibrina-koagulua', week: 2, stage: 'eguna-9', weight: 'gakoa', system: 'eranskinak', notes: ['w2/2/p5/s3', 'w2/2/p6/s3', 'w2/2/p3/s2'], makes: ['lakuak', 'heuser-mintza', 'hasierako-bitelo-zakua', 'fibrina-koagulua'] },
  { day: 11, to: 12, short: 'Korion barrunbea', text: 'Sare lakunarra eta zirkulazio uteroplazentarioa; enbrioiz kanpoko mesodermoa → korion barrunbea', week: 2, stage: 'eguna-11-12', weight: 'gakoa', system: 'eranskinak', notes: ['w2/3/p6/s1', 'w2/3/p7/s2'], makes: ['sare-lakunarra', 'enbrioi-kanpoko-mesodermoa', 'korion-barrunbea', 'finkapen-pedikulua'] },
  { day: 13, short: 'Biloxka primarioak', text: 'Biloxka primarioak; bitelo zaku sekundarioa; blastozistoa guztiz habiratuta', week: 2, stage: 'eguna-13', weight: 'gakoa', system: 'eranskinak', notes: ['w2/4/p3/s1', 'w2/4/p4/s1', 'w2/4/p5/s2'], makes: ['biloxka-primarioa', 'bitelo-zaku-sekundarioa', 'korioia'] },
  // 3. gaia
  { day: 15, to: 16, short: 'Lerro primitiboa', text: 'Lerro primitiboa: gastrulazioa hasten da (hiru orriko diskoa)', week: 3, stage: 'gastrulazioa', weight: 'gakoa', system: 'hasiera', notes: ['w3/1/p3/s1', 'w3/1/p5/s1'], makes: ['lerro-primitiboa', 'nodo-primitiboa', 'endodermoa', 'mesodermo-intraenbrionarioa', 'ektodermoa'] },
  { day: 16, short: 'Alantoidea', text: 'Kloaka mintza agertzen da, eta egun berean alantoidea bitelo zakuaren atzeko paretatik', week: 3, stage: 'alantoidea-eta-hazkundea', weight: 'oinarria', system: 'hasiera', notes: ['w3/2/p12/s1'], makes: ['kloaka-mintza', 'alantoidea'] },
  { day: 16, to: 18, short: 'Notokorda', text: 'Notokorda: hobitxo primitibotik inbaginatutako zelulak → notokorda-plaka → notokorda', week: 3, stage: 'notokorda', weight: 'gakoa', system: 'hasiera', notes: ['w3/2/p8/s1', 'w3/2/p8/s2'], approx: true, makes: ['notokorda'] },
  { day: 17, short: 'Mesodermoaren banaketa', text: '17. egunean notokordaren ondoko mesodermoa ugaltzen da: paraxiala, bitartekoa eta albokoa', week: 4, stage: 'mesodermoa-banatzen', weight: 'gakoa', system: 'hasiera', notes: ['w4/3/p5/s1'], makes: ['mesodermo-paraxiala', 'bitarteko-mesodermoa', 'alboko-mesodermoa'] },
  { day: 18, short: 'Biloxka sekundarioak', text: '3. astearen erdian enbrioiz kanpoko mesodermoa biloxka primarioetan sartzen da → biloxka sekundarioak', week: 3, stage: 'biloxkak', weight: 'oinarria', system: 'eranskinak', notes: ['w3/4/p5/s1', 'w3/4/p5/s2'], approx: true, label: '3. astearen erdia', makes: ['biloxka-sekundarioa'] },
  { day: 19, to: 21, short: 'Biloxka tertziarioak', text: '3. astearen amaierarako biloxketan odol hodiak (biloxka tertziarioak) eta kanpoko zorro zitotrofoblastikoa', week: 3, stage: 'zorro-zitotrofoblastikoa', weight: 'oinarria', system: 'eranskinak', notes: ['w3/4/p6/s1', 'w3/4/p10/s1', 'w3/4/p11/s1'], makes: ['biloxka-tertziarioa', 'kanpoko-zorro-zitotrofoblastikoa'] },
  { day: 20, short: 'Lehen somita bikotea', text: 'Lehen somita bikotea (okzipitala) 20. egunean; egunero 3 bikote berri', week: 4, stage: 'somitak', weight: 'gakoa', system: 'hasiera', notes: ['w4/3.1/p4/s2'], makes: ['somitak'] },
  // 4. gaia
  { day: 22, short: 'Tolespenak', text: 'Zeharkako tolespena eta tolespen zefalokaudala aldi berean: disko laua gorputz zilindrikoa bihurtzen da', week: 4, stage: 'tolespenak', weight: 'gakoa', system: 'hasiera', notes: ['w7/1/p3/s1', 'w4/1/p4/s1', 'w4/1/p5/s1', 'w4/1/p6/s1'], approx: true, label: '3. astearen bukaera' },
  { day: 22, short: 'Hodi neurala', text: 'Neurulazioa: notokordak plaka neurala induzitzen du; tolesdura neuralak fusionatu → hodi neurala, eta ertzetako zelulak gandor neurala', week: 4, stage: 'neurulazioa', weight: 'gakoa', system: 'nerbioa', notes: ['w4/2/p3/s1', 'w4/2/p3/s3', 'w4/2/p3/s4', 'w4/2/p7/s1'], approx: true, label: '4. astea', makes: ['hodi-neurala', 'gandor-neurala', 'plaka-neurala'] },
  { day: 22, short: 'Bihotz-taupadak', text: '4. astean bihotza taupaka hasten da: enbrioiaren odola biloxka tertziarioetaraino iristen da', week: 3, stage: 'zirkulazioa', weight: 'oinarria', system: 'zirkulazioa', notes: ['w3/4/p8/s6'], approx: true, label: '4. astea' },
  { day: 22, short: 'Somiten bereizketa', text: '4. astearen hasieran somitetako zelulak bereizten hasten dira: esklerotoma eta dermatomiotoma (muskuluak)', week: 4, stage: 'somitaren-bereizketa', weight: 'oinarria', system: 'muskuluak', notes: ['w4/3.1/p14/s2'], approx: true, label: '4. astearen hasiera', makes: ['dermatomiotoma'] },
  { day: 22, short: 'Esklerotoma zutabea', text: '4. astean esklerotoma zelulak erdikaldera migratzen dira: hodi neurala eta notokorda inguratzen dituen mesenkima zutabea (bizkarrezurra)', week: 8, stage: 'bizkarrezurra', weight: 'oinarria', system: 'hezurdura', notes: ['w8/5.2.1/p2/s1'], approx: true, label: '4. astea', makes: ['esklerotoma'] },
  { day: 22, to: 28, short: 'Septum transversuma', text: 'Septum transversuma lepo mailan (C3–C5): zeloma hasierako perikardio barrunbean eta peritoneo barrunbean banatzen du (erreten perikardioperitonealak salbu)', week: 7, stage: 'septum-transversum', weight: 'gakoa', system: 'barrunbeak', notes: ['w7/2/p3/s1', 'w7/2/p5/s1', 'w7/2/p5/s2'], makes: ['septum-transversum', 'hasierako-perikardio-barrunbea', 'erreten-perikardioperitonealak'] },
  { day: 25, short: 'Neuroporo kraneala ixten', text: 'Neuroporo kraneala ixten da (25. egunerako)', week: 4, stage: 'neurulazioa', weight: 'gakoa', system: 'nerbioa', notes: ['w4/2/p5/s3'] },
  { day: 28, short: 'Neuroporo kaudala ixten', text: 'Neuroporo kaudala ixten da (28. egunerako); tolespenen ondoren enbrioia zilindrikoa', week: 4, stage: 'neurulazioa', weight: 'gakoa', system: 'nerbioa', notes: ['w4/2/p5/s3', 'w5/1/p13/s1'] },
  // 5. gaia
  { day: 28, short: '28 somita', text: '28. egunetik aurrera: 28 somita bikote inguru, faringe arkuak eta bihotz goragunea kanpotik ikusten dira', week: 5, stage: 'enbrioia-28-32', weight: 'oinarria', system: 'kanpo-itxura', notes: ['w5/1/p5/s1', 'w5/1/p7/s2'] },
  { day: 28, to: 32, short: 'Gorputz-adarren hasikinak', text: 'Gorputz-adarren hasikinak: goikoak lehenago, behekoak 2–3 egun beranduago. Hilabete 1en bukaeran hasikinak bakarrik, ez gorputz-adarrak', week: 5, stage: 'enbrioia-28-32', weight: 'gakoa', system: 'kanpo-itxura', notes: ['w5/1/p12/s1', 'w5/1/p12/s3'], makes: ['goiko-gorputz-adarraren-hasikina', 'beheko-gorputz-adarraren-hasikina'] },
  // 7. gaia
  { day: 29, to: 35, short: 'Mintz pleuroperikardikoak', text: '5. astean mintz pleuroperikardikoak erdialderantz doaz eta fusionatzen dira: pleura eta perikardio barrunbeak bereizten dira', week: 7, stage: 'pleura-perikardioa', weight: 'gakoa', system: 'barrunbeak', notes: ['w7/2.2/p7/s1', 'w7/2.2/p8/s1'], makes: ['mintz-pleuroperikardikoak', 'pleura-barrunbea', 'perikardio-barrunbea'] },
  { day: 29, to: 35, short: 'Mintz pleuroperitonealak', text: '5. astean mintz pleuroperitonealak atze-alboko paretetatik agertzen dira eta erreten perikardioperitonealak ixten dituzte', week: 7, stage: 'diafragma-eraketa', weight: 'gakoa', system: 'barrunbeak', notes: ['w7/3/p7/s2', 'w7/3.1/p4/s1'], makes: ['mintz-pleuroperitonealak'] },
  { day: 35, short: 'Azken somitak', text: 'Somitak 5. astearen bukaerara arte agertzen dira', week: 4, stage: 'somitak', weight: 'xehetasuna', system: 'hasiera', notes: ['w4/3.1/p4/s3'] },
  { day: 35, short: 'Septumaren jaitsiera', text: '5. astearen bukaerarako septum transversuma jaitsita: aurrea T6 mailan, atzea T12 mailan; nerbio frenikoa (C3–C5) luzatzen da', week: 7, stage: 'diafragma-eraketa', weight: 'gakoa', system: 'barrunbeak', notes: ['w7/3/p6/s2', 'w7/3/p5/s4'] },
  // 5. eta 8. gaiak
  { day: 42, short: 'Esku eta oin plakak', text: '6. astea: hasikinen muturrak lautu (esku eta oin plakak) eta lehen ertzadura agertzen da', week: 5, stage: 'enbrioia-42-56', weight: 'oinarria', system: 'kanpo-itxura', notes: ['w8/4/p6/s2', 'w5/1/p15/s1'] },
  { day: 42, short: 'Heste-lakioak kanpora', text: '6. astetik heste-lakioak zilbor-hestera irteten dira: zilbor ernia fisiologikoa', week: 6, stage: 'zilbor-hestea', weight: 'oinarria', system: 'kanpo-itxura', notes: ['w5/2.1/p6/s3'], approx: true, label: '6. astea', makes: ['heste-lakioak', 'zilbor-ernia-fisiologikoa'] },
  { day: 42, short: 'Lehen kartilagoak', text: '6. asterako gorputz-adarretako mesenkimatik lehen kartilagoak agertzen dira: hezur hauek endokondralak dira', week: 8, stage: 'gorputz-adarrak', weight: 'oinarria', system: 'hezurdura', notes: ['w8/4/p10/s1', 'w8/4/p10/s3'], approx: true, label: '6. astea', makes: ['kartilago-eredua'] },
  { day: 48, short: 'Bigarren ertzadura', text: '48. egunean bigarren ertzadura: gorputz-adarretan hiru segmentu bereizten dira', week: 5, stage: 'enbrioia-42-56', weight: 'xehetasuna', system: 'kanpo-itxura', notes: ['w5/1/p18/s1'] },
  { day: 50, to: 90, short: 'Korion hostotsua eta leuna', text: '2.–3. hilabeteetan biloxka tertziarioak adarkatzen dira; mutur anenbrionarioko biloxkak endekatu eta 3. hilabeterako desagertzen dira', week: 6, stage: 'korion-hostotsua', weight: 'oinarria', system: 'eranskinak', notes: ['w6/1.3/p3/s1', 'w6/2/p3/s7'], approx: true, label: '2.–3. hilabeteak', makes: ['korion-hostotsua', 'korion-leuna'] },
  { day: 56, short: 'Enbrioi-aroaren bukaera', text: 'Enbrioi-aroaren bukaera (8. astea): sistema guztietako organo eta ehunak agertuta', week: 5, stage: 'enbrioia-42-56', weight: 'gakoa', system: 'kanpo-itxura', notes: ['w4/1/p6/s2'] },
  { day: 56, short: 'Hezurtzapen zentroak', text: '8. asterako gorputz-adarretako kartilagoetan hezurtzapen zentroak agertzen dira', week: 8, stage: 'gorputz-adarrak', weight: 'gakoa', system: 'hezurdura', notes: ['w8/4/p12/s1'], makes: ['hezurtzapen-zentroak'] },
  { day: 56, short: 'Gorputz-adarren biraketa', text: '8. astean gorputz-adarrek kontrako biraketak egiten dituzte: goikoak 90° kanpora, behekoak 90° barrura', week: 8, stage: 'gorputz-adarrak', view: 'biraketa', weight: 'gakoa', system: 'hezurdura', notes: ['w8/4/p13/s1', 'w8/4/p14/s1', 'w8/4/p16/s2'] },
  // Fetu-aroa
  { day: 57, short: 'Fetu-aroaren hasiera', text: 'Fetu-aroa hasten da (9. astea): hazkundea eta heltzea', week: 5, stage: 'hirugarren-hilabetea', weight: 'gakoa', system: 'kanpo-itxura', notes: ['w1/2/p7/s1'] },
  { day: 77, short: 'Aurpegia', text: '11. astean fetuaren aurpegiak giza itxura hartzen du', week: 5, stage: 'hirugarren-hilabetea', weight: 'xehetasuna', system: 'kanpo-itxura', notes: ['w5/2.1/p3/s1'] },
  { day: 84, short: 'Hesteak abdomenera', text: '12. asterako heste-lakioak barrunbe abdominalera itzultzen dira', week: 5, stage: 'hirugarren-hilabetea', weight: 'oinarria', system: 'kanpo-itxura', notes: ['w5/2.1/p6/s4', 'w6/4/p13/s1'] },
  { day: 84, short: 'Kanpoko genitalak', text: '12. asterako kanpoko genitalak agerian daude: fetuaren sexua jakin daiteke', week: 5, stage: 'hirugarren-hilabetea', weight: 'xehetasuna', system: 'kanpo-itxura', notes: ['w5/2.1/p7/s1'] },
  { day: 84, short: 'Zentro primarioak', text: '12. asterako hezur luze guztien diafisietan hezurtzapen zentro primarioak agertu dira', week: 8, stage: 'hezur-luzeak', weight: 'gakoa', system: 'hezurdura', notes: ['w8/4/p18/s1'] },
  { day: 90, short: 'Korion barrunbea desagertzen', text: '3. hilabetetik aurrera amniosa korion plakarekin fusionatzen da eta korion barrunbea desagertzen da', week: 6, stage: 'korion-hostotsua', weight: 'oinarria', system: 'eranskinak', notes: ['w6/4/p11/s1'], approx: true, label: '3. hilabetea', makes: ['mintz-amniokorionikoa'] },
  { day: 90, short: 'Zuntz ildaskatuak', text: '3. hilabetearen bukaerarako zuntz muskularretan ildaskak agertzen dira: zuntz muskular ildaskatuak', week: 9, stage: 'ildaskatuak', weight: 'gakoa', system: 'muskuluak', notes: ['w9/2/p9/s2'], approx: true, label: '3. hilabetearen bukaera', makes: ['ildaskak'] },
  { day: 113, to: 140, short: 'Mugimenduak', text: '4.–5. hilabeteetan aktibitate muskularra handitzen da eta amak fetuaren mugimenduak antzematen ditu', week: 5, stage: 'laugarren-bosgarren', weight: 'xehetasuna', system: 'kanpo-itxura', notes: ['w5/2.2/p3/s5'], approx: true, label: '4.–5. hilabeteak' },
  { day: 266, short: 'Jaiotza', text: 'Jaiotza: 38 aste (266 egun) ernalkuntzatik, 40 aste azken hilekotik', week: 5, stage: 'iraupena', weight: 'gakoa', system: 'kanpo-itxura', notes: ['w5/2/p8/s1', 'w5/2/p7/s1'] },
  { day: 266, short: 'Diafisiak hezurtuta', text: 'Jaiotzean hezur luzeen diafisiak hezurtuta daude; epifisiak oraindik ez', week: 8, stage: 'hezur-luzeak', weight: 'xehetasuna', system: 'hezurdura', notes: ['w8/4/p24/s1'] },
  // Jaio ondoren
  { day: afterBirth(2), short: 'Atzeko fontanela ixten', text: 'Joskurak jaio ondoren zabalik geratzen dira entzefaloa hazteko: atzeko fontanela 2. hilabetean ixten da', week: 8, stage: 'buru-ganga', weight: 'oinarria', system: 'hezurdura', notes: ['w8/3.1.1/p21/s1'] },
  { day: afterBirth(18), short: 'Aurreko fontanela ixten', text: 'Aurreko fontanela beranduago ixten da: 18. hilabetera arte zabalik', week: 8, stage: 'buru-ganga', weight: 'oinarria', system: 'hezurdura', notes: ['w8/3.1.1/p21/s1', 'w9/intro/p5/s3'] },
  // 10. gaia
  { day: 18, to: 21, short: 'Odol irlatxoak', text: 'Lerro primitibotik migratutako zelula epiblastikoek errai orrian ferra formako odol irlatxoak sortzen dituzte; hodi bihurtu eta ferra formako tutua osatzen dute (erdian plaka kardiogenikoa, alboetan endokardio hodiak)', week: 10, stage: 'eskualde-kardiogenikoa', view: 'diskoa', weight: 'gakoa', system: 'zirkulazioa', notes: ['w10/1/p3/s1', 'w10/1/p4/s1', 'w10/1/p4/s3', 'w10/1/p4/s6', 'w10/1/p5/s1'], approx: true, label: '3. astea', makes: ['odol-irlatxoak', 'ferra-formako-plexua', 'plaka-kardiogenikoa', 'bihotz-hodiak'] },
  { day: 20, short: 'Aorta dortsalak', text: 'Notokordaren bi aldeetan, errai orriko zelula irlatxoetatik, bi aorta dortsal: hasieratik endokardio hodiekin kontaktuan', week: 10, stage: 'eskualde-kardiogenikoa', view: 'zeharkakoa', weight: 'oinarria', system: 'zirkulazioa', notes: ['w10/1/p8/s1', 'w10/1/p8/s2', 'w10/1/p8/s3'], approx: true, label: '3. astea', makes: ['aorta-dortsalak'] },
  { day: 21, short: 'Bihotz hodi bakarra', text: '3. aste bukaeran diskoa tolesten da: plaka kardiogenikoa toraxera jaisten da eta bi endokardio hodiak fusionatzen dira; bihotzaren hiru geruzak: endokardioa, miokardioa eta epikardioa', week: 10, stage: 'bihotz-hodia', view: 'zeharkakoa', weight: 'gakoa', system: 'zirkulazioa', notes: ['w10/1/p9/s2', 'w10/1/p10/s3', 'w10/1/p11/s2', 'w10/1/p14/s3'], approx: true, label: '3. aste bukaera', makes: ['endokardioa', 'miokardioa', 'epikardioa', 'bihotz-gelatina'] },
  // 11. gaia
  { day: 27, to: 37, short: 'Aurikulen trenkadatzea', text: 'Bihotzaren trenkadatze prozesua 27–37. egunen artean: bi hasierako aurikulen artean trenkada sagitala sortzen da (aurikula arteko trenkada)', week: 11, stage: 'septum-primum', weight: 'gakoa', system: 'zirkulazioa', notes: ['w11/1/p4/s1', 'w11/2.1/p3/s2', 'w11/2.1/p3/s3'], makes: ['aurikula-arteko-trenkada'] },
  { day: 28, short: 'Septum primuma', text: '4. astearen amaieran, aurikula komunaren sabaian, septum primuma: erreten aurikulubentrikularrerantz hazten da; azpian ostium primuma', week: 11, stage: 'septum-primum', weight: 'gakoa', system: 'zirkulazioa', notes: ['w11/2.1/p3/s4', 'w11/2.1/p3/s5', 'w11/2.1/p4/s2'], approx: true, label: '4. aste bukaera', makes: ['septum-primum', 'ostium-primuma'] },
  { day: BIRTH, to: afterBirth(12), short: 'Zulo obala ixten', text: 'Jaiotzean ezkerreko aurikulako presioak septum primuma septum secundumaren aurka bultzatzen du; jaio ondoren eta 1. urtean zehar fusionatzen dira. Kasuen %20an fusioa ez da osoa', week: 11, stage: 'jaiotza', weight: 'gakoa', system: 'zirkulazioa', notes: ['w11/2.2/p7/s5', 'w11/2.2/p7/s6'], approx: true, label: 'Jaiotza → 1. urtea' },
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
  morula: { from: 3, to: 4, becomes: ['blastozistoa'], note: '3. egunean 16 zelula inguru, istmoan; 4. egunean 32 inguru.' },
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
  'korion-barrunbea': { from: 12, to: 90, note: '3. hilabetetik aurrera amniosa korion plakarekin fusionatzen da eta korion barrunbea desagertzen da (6. gaia).' },
  'finkapen-pedikulua': { from: 12, to: 28, becomes: ['behin-betiko-zilbor-hestea'] },
  'biloxka-primarioa': { from: 13, to: 18, becomes: ['biloxka-sekundarioa'] },
  'bitelo-zaku-sekundarioa': { from: 13 },
  'kiste-exozelomikoak': { from: 13 },
  korioia: { from: 13 },
  // 3. astea
  'hiru-orriko-diskoa': { from: 15 },
  'lerro-primitiboa': { from: 15, to: 28, note: 'Alde kaudalean gastrulazioa 4. astearen bukaerara arte mantentzen da (3. gaia).' },
  'nodo-primitiboa': { from: 15, to: 28 },
  'hobitxo-primitiboa': { from: 15, to: 28 },
  ektodermoa: { from: 15 },
  endodermoa: { from: 15 },
  'mesodermo-intraenbrionarioa': { from: 15, to: 17, becomes: ['mesodermo-paraxiala', 'bitarteko-mesodermoa', 'alboko-mesodermoa'] },
  'kloaka-mintza': { from: 16 },
  'mintz-bukofaringeoa': { from: 16 },
  'plaka-prekordala': { from: 16 },
  'biloxka-sekundarioa': { from: 18, to: 21, becomes: ['biloxka-tertziarioa'], note: '3. astearen erdian.' },
  alantoidea: { from: 16 },
  'notokorda-plaka': { from: 17, to: 18, becomes: ['notokorda'] },
  'hodi-neuroenterikoa': { from: 17, to: 18, note: 'Iragankorra: amnios barrunbea eta bitelo zakua lotzen ditu notokorda osatu arte.' },
  notokorda: { from: 18, note: 'Helduan: disko ornoarteko nukleo pultposoa.' },
  'biloxka-tertziarioa': { from: 19 },
  'kanpoko-zorro-zitotrofoblastikoa': { from: 19 },
  // 4. astea
  'mesodermo-paraxiala': { from: 17, becomes: ['somitomeroak', 'somitak'] },
  'bitarteko-mesodermoa': { from: 17 },
  'alboko-mesodermoa': { from: 17, becomes: ['paretako-orria', 'errai-orria'] },
  'enbrioi-barruko-zeloma': { from: 18 },
  'plaka-neurala': { from: 21, to: 22, becomes: ['hodi-neurala'], note: 'Apunteek ez dute egunik ematen: 4. astean, hodi neurala baino lehen.' },
  somitomeroak: { from: 18 },
  somitak: { from: 20, note: 'Lehen bikotea 20. egunean; 5. astearen bukaerara arte agertzen dira.' },
  'tolesdura-neuralak': { from: 21, to: 28, becomes: ['hodi-neurala'] },
  'hodi-neurala': { from: 22, note: 'Alde zefalikotik alde kaudalera hedatzen da.' },
  'gandor-neurala': { from: 22 },
  'neuroporo-kraneala': { from: 22, to: 25, note: '25. egunerako ixten da.' },
  'neuroporo-kaudala': { from: 22, to: 28, note: '28. egunerako ixten da (kranealaren ondoren).' },
  'tolestura-kraneokaudala': { from: 22, to: 28 },
  'tolestura-laterala': { from: 22, to: 28 },
  'paretako-orria': { from: 22 },
  'errai-orria': { from: 22 },
  'aurreko-hestea': { from: 22 },
  'erdiko-hestea': { from: 22 },
  'atzeko-hestea': { from: 22 },
  esklerotoma: { from: 22 },
  dermatomiotoma: { from: 22, becomes: ['dermatoma', 'miotoma'] },
  'faringe-arkuak': { from: 22 },
  'hasierako-zilbor-eraztuna': { from: 28 },
  'goiko-gorputz-adarraren-hasikina': { from: 28, note: 'Hilabete 1en bukaeran hasikinak daude, ez gorputz-adarrak.' },
  'beheko-gorputz-adarraren-hasikina': { from: 30, note: 'Goikoak baino 2–3 egun beranduago.' },
  // Gorputzaren barrunbeak (7. gaia)
  'septum-transversum': { from: 22, becomes: ['zentro-tendinosoa'], note: '4. astean, C3–C5 mailan; diafragmaren zentro tendinosoa bihurtzen da.' },
  'hasierako-perikardio-barrunbea': { from: 22, to: 35, becomes: ['perikardio-barrunbea', 'pleura-barrunbea'], note: '5. astean mintz pleuroperikardikoek banatzen dute.' },
  'erreten-perikardioperitonealak': { from: 22, to: 35, note: '5. astean mintz pleuroperitonealek ixten dituzte.' },
  'mintz-pleuroperikardikoak': { from: 29, note: '5. astean erdialderantz doaz eta fusionatzen dira.' },
  'mintz-pleuroperitonealak': { from: 29, note: '5. astean atze-alboko paretetatik.' },
  'pleura-barrunbea': { from: 35 },
  'perikardio-barrunbea': { from: 35 },
  // Fetu-aroa, hezurrak eta muskuluak (5., 6., 8. eta 9. gaiak)
  'zilbor-ernia-fisiologikoa': { from: 42, to: 84, note: '6. astetik; 12. asterako itzultzen dira hesteak.' },
  'kartilago-eredua': { from: 42, note: '6. asterako, gorputz-adarretako mesenkimatik.' },
  'korion-leuna': { from: 50, note: '2.–3. hilabeteak: mutur anenbrionarioko biloxkak endekatu eta 3. hilabeterako desagertzen dira.' },
  'korion-hostotsua': { from: 50, note: '2.–3. hilabeteak.' },
  'hezurtzapen-zentroak': { from: 56, note: '8. asterako, gorputz-adarretako kartilagoetan.' },
  'mintz-amniokorionikoa': { from: 90, note: '3. hilabetetik aurrera.' },
  ildaskak: { from: 90, note: '3. hilabetearen bukaerarako.' },
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

/**
 * The day a structure stops existing as such: the day it turns into its successors (they are drawn on
 * that day instead of it), or the day after its last one when it simply disappears.
 */
const goneOn = (l: Life) => (l.to === undefined ? undefined : l.becomes?.length ? l.to : l.to + 1);

/** What changed after day `from`, up to and including day `to`: what appeared and what stopped existing as such. */
export function changesBetween(from: number, to: number) {
  const born = TIMELINE_IDS.filter((id) => LIFE[id].from > from && LIFE[id].from <= to);
  const gone = TIMELINE_IDS.filter((id) => {
    const g = goneOn(LIFE[id]);
    return g !== undefined && g > from && g <= to;
  }).sort((a, b) => (LIFE[b].to ?? 0) - (LIFE[a].to ?? 0));
  return { born, gone };
}

/** Where a dated structure stands on a day, with the same boundary as `changesBetween` (it turns into its successors on its last day). */
export type Status = 'oraindik-ez' | 'badago' | 'desagertua';
export function statusAt(id: string, day: number): Status {
  const l = LIFE[id];
  if (day < l.from) return 'oraindik-ez';
  const g = goneOn(l);
  return g !== undefined && g <= day ? 'desagertua' : 'badago';
}

/** The structures that exist on a day (appeared, not yet gone or turned into something else). */
export const presentAt = (day: number) => TIMELINE_IDS.filter((id) => statusAt(id, day) === 'badago');

/**
 * The body system a structure belongs to, derived: the appendages for extra-embryonic and maternal tissue;
 * else the system of the milestone that makes it; else the cavities for spaces; else the system most of
 * its topic's milestones belong to.
 */
const OUTSIDE = new Set(['enbrioi-kanpokoa', 'trofoblastoa', 'amarena']);
const structureSystem: Map<string, SystemId> = (() => {
  const out = new Map<string, SystemId>();
  for (const id of TIMELINE_IDS) if (OUTSIDE.has(structures.get(id)?.category ?? '')) out.set(id, 'eranskinak');
  for (const m of [...MILESTONES].sort((a, b) => a.day - b.day)) for (const id of m.makes ?? []) if (!out.has(id)) out.set(id, m.system);
  const ofTopic = new Map<number, SystemId>();
  for (const w of new Set(MILESTONES.map((m) => m.week))) {
    const count = new Map<SystemId, number>();
    for (const m of MILESTONES) if (m.week === w) count.set(m.system, (count.get(m.system) ?? 0) + 1);
    ofTopic.set(w, [...count].sort((a, b) => b[1] - a[1])[0][0]);
  }
  for (const id of TIMELINE_IDS) {
    if (out.has(id)) continue;
    const cat = structures.get(id)?.category;
    const topic = firstSeen.get(id)?.week;
    out.set(id, cat === 'barrunbea' ? 'barrunbeak' : ((topic && ofTopic.get(topic)) || 'hasiera'));
  }
  return out;
})();
export const systemOfStructure = (id: string): SystemId => structureSystem.get(id) ?? 'hasiera';

/** The simulator, open on the step that first shows a structure, with it selected. */
export function structureHref(id: string): string | null {
  const f = firstSeen.get(id);
  if (!f) return null;
  return `/astea/${f.week}?etapa=${f.stage}&egitura=${id}${f.at > 0 ? `&une=${Math.round(f.at * 1000) / 1000}` : ''}`;
}

type Unit = 'egun' | 'aste' | 'jaio';
const unitOf = (d: number): Unit => (d <= 56 ? 'egun' : d <= BIRTH ? 'aste' : 'jaio');
const numOf = (d: number) => (d <= 56 ? d : d <= BIRTH ? Math.ceil(d / 7) : monthsAfter(d));
const UNIT: Record<Unit, [string, string]> = { egun: ['. eguna', '. egunak'], aste: ['. astea', '. asteak'], jaio: ['. hilabetea (jaio ondoren)', '. hilabeteak (jaio ondoren)'] };

/** Readable date: "8. eguna", "15–16. egunak", "12. astea", "2. hilabetea (jaio ondoren)". */
export function dayLabel(from: number, to?: number): string {
  const u = unitOf(from);
  if (to === undefined || (unitOf(to) === u && numOf(to) === numOf(from))) return `${numOf(from)}${UNIT[u][0]}`;
  if (unitOf(to) === u) return `${numOf(from)}–${numOf(to)}${UNIT[u][1]}`;
  return `${dayLabel(from)} – ${dayLabel(to)}`;
}

/** A milestone's date as the notes write it, with "≈" when the notes give only the week or the month. */
export const whenOf = (m: Milestone) => `${m.approx ? '≈ ' : ''}${m.label ?? dayLabel(m.day, m.to)}`;

/**
 * Day → position (0..1) on a whole-development scale: the first month gets most of the room, weeks 5–8
 * the next fifth, the fetal period a fifth and the two years after birth a thin last band (7 %), as in the
 * notes' own emphasis.
 */
const SCALE: [number, number][] = [
  [0, 0],
  [28, 0.56],
  [56, 0.76],
  [BIRTH, 0.93],
  [END_DAY, 1],
];
const interp = (v: number, from: 0 | 1, to: 0 | 1) => {
  const c = Math.min(Math.max(v, SCALE[0][from]), SCALE[SCALE.length - 1][from]);
  for (let i = 1; i < SCALE.length; i++) {
    const [p, q] = [SCALE[i - 1], SCALE[i]];
    if (c <= q[from]) return p[to] + ((c - p[from]) / (q[from] - p[from])) * (q[to] - p[to]);
  }
  return SCALE[SCALE.length - 1][to];
};
export const dayToX = (d: number) => interp(d, 0, 1);
export const xToDay = (x: number) => interp(x, 1, 0);

/** Locative, for sentences: "8. egunean", "12. astean". */
export const dayIn = (d: number) => (d <= 56 ? `${d}. egunean` : d <= BIRTH ? `${Math.ceil(d / 7)}. astean` : `jaio ondorengo ${monthsAfter(d)}. hilabetean`);

/** A life span in words: "4–9. egunak", or "8. egunetik aurrera" while it lasts. */
export const spanLabel = (from: number, to?: number) =>
  to === undefined ? `${from <= 56 ? `${from}. egunetik` : from <= BIRTH ? `${Math.ceil(from / 7)}. astetik` : `jaio ondorengo ${monthsAfter(from)}. hilabetetik`} aurrera` : dayLabel(from, to);

/** Week of development (1-based) of a day: days 1–7 are week 1, 22–28 week 4 (the notes' "4. astea"); day 0 is week 1. */
export const weekOfDay = (day: number) => Math.min(38, Math.max(1, Math.ceil(day / 7)));

// ——— Into the simulator ———

/** Where in the simulator a moment is: topic, stage, view and the stage time (0..1). */
export interface SimMoment {
  week: number;
  stage: StageDef;
  view: string;
  une: number;
}

const stageById = (week: number, id: string) => weeks.find((w) => w.week === week)?.stages.find((s) => s.id === id);

/** The view of the step playing at stage time `t` (the last step at or before it that names one). */
function viewAt(stage: StageDef, t: number) {
  let v: string | undefined;
  for (const b of stage.beats) if (b.at <= t + 1e-6 && b.view) v = b.view;
  return v && stage.views.some((x) => x.id === v) ? v : stage.views[0].id;
}

/** Stage time of a day inside a stage's day range (a single-day stage reads best near its end). */
const uneOfDay = (stage: StageDef, day: number) => {
  const [a, b] = stage.dayRange;
  if (b <= a) return 0.85;
  return Math.min(1, Math.max(0, (day - a) / (b - a)));
};

/**
 * The simulator moment of a milestone: the step that first explains what it makes when that step is in
 * its stage (so a deep link lands where the process is shown), otherwise the day's place in the stage.
 */
export function momentOf(m: Milestone): SimMoment | null {
  const stage = stageById(m.week, m.stage);
  if (!stage) return null;
  // The first structure it names (its headline) that a step of this stage explains.
  const shown = (m.makes ?? []).map((id) => firstSeen.get(id)).find((f) => f && f.week === m.week && f.stage === m.stage && f.beat >= 0);
  const une = shown ? shown.at : uneOfDay(stage, m.day);
  const view = m.view && stage.views.some((v) => v.id === m.view) ? m.view : viewAt(stage, une);
  return { week: m.week, stage, view, une };
}

/** Deep link into the simulator at that stage, view and moment. */
export const simHref = (s: SimMoment) => {
  const une = Math.round(s.une * 1000) / 1000;
  return `/astea/${s.week}?etapa=${s.stage.id}&ikuspegia=${s.view}${une > 0 ? `&une=${une}` : ''}`;
};

/** Stages that only frame the whole course (terms, routes, the whole-pregnancy timeline), never a moment of it. */
const FRAMING = new Set(['terminoak', 'ibilbidea', 'iraupena']);

/** Milestones in order of day (the array is kept in that order; this is the guarantee). */
export const ORDERED = [...MILESTONES].sort((a, b) => a.day - b.day);

/** The milestone a day is "at": the last one on or before it (optionally within one system). */
export function milestoneAt(day: number, system?: SystemId | null) {
  let best: Milestone | null = null;
  for (const m of ORDERED) {
    if (system && m.system !== system) continue;
    if (m.day > day) break;
    // On a shared day the key date wins over a detail.
    if (!best || m.day > best.day || (m.day === best.day && rank(m) < rank(best))) best = m;
  }
  return best;
}
const rank = (m: Milestone) => (m.weight === 'gakoa' ? 0 : m.weight === 'oinarria' ? 1 : 2);

/** The next / previous key-date day (not details), for stepping through the sequence. */
export const nextKeyDay = (day: number, system?: SystemId | null) => ORDERED.find((m) => m.day > day && m.weight !== 'xehetasuna' && (!system || m.system === system))?.day ?? null;
export const prevKeyDay = (day: number, system?: SystemId | null) => [...ORDERED].reverse().find((m) => m.day < day && m.weight !== 'xehetasuna' && (!system || m.system === system))?.day ?? null;

/**
 * The simulator moment that shows a day: the stage of the milestone the day is at while the day is
 * still inside that stage, otherwise the narrowest stage that covers the day, at the day's place in it.
 */
export function momentAt(day: number, system?: SystemId | null): SimMoment | null {
  const m = milestoneAt(day, system);
  if (m) {
    const stage = stageById(m.week, m.stage);
    if (stage && !FRAMING.has(stage.id) && day >= stage.dayRange[0] && day <= Math.max(stage.dayRange[1], m.to ?? m.day)) {
      const une = m.day === day ? momentOf(m)!.une : Math.max(momentOf(m)!.une, uneOfDay(stage, day));
      return { week: m.week, stage, view: m.view && stage.views.some((v) => v.id === m.view) ? m.view : viewAt(stage, une), une };
    }
  }
  // The narrowest stage that covers the day; between two stages (day 10), the one just before it, at its end.
  let best: { week: number; stage: StageDef; gap: number } | null = null;
  for (const w of weeks)
    for (const s of w.stages) {
      if (FRAMING.has(s.id) || day < s.dayRange[0]) continue;
      if (s.views.every((v) => v.description === 'Prestatzen')) continue;
      const gap = Math.max(0, day - s.dayRange[1]);
      const span = s.dayRange[1] - s.dayRange[0];
      if (!best || gap < best.gap || (gap === best.gap && span < best.stage.dayRange[1] - best.stage.dayRange[0])) best = { week: w.week, stage: s, gap };
    }
  if (!best) return null;
  const une = best.gap ? 1 : uneOfDay(best.stage, day);
  return { week: best.week, stage: best.stage, view: viewAt(best.stage, une), une };
}
