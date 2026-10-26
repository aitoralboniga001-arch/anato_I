'use client';

import Link from 'next/link';
import type { CSSProperties } from 'react';
import { KEY_IDS, POOL } from '@/content/pool';
import { weeks } from '@/content/registry';
import { competenceLevel, isDue, useAnswers } from './answers';
import { useVisitedAll } from './progress';

/**
 * The whole subject on one screen: one card per topic, each as a chain of steps that can be read in a
 * few seconds (the 20-second test); the sentence behind each chain is its tooltip.
 */
/** The topic count as a word (the heading must follow the registry, not a number typed once). */
const WORDS = ['Zero', 'Bat', 'Bi', 'Hiru', 'Lau', 'Bost', 'Sei', 'Zazpi', 'Zortzi', 'Bederatzi', 'Hamar', 'Hamaika', 'Hamabi'];
export const countWord = (n: number) => WORDS[n] ?? String(n);

/** Columns for the topic shelf and the map on wide screens: full rows whatever the count (9 → 3×3, 10 → 5×2), 4 when no count divides evenly. */
export const shelfCols = (n: number) => {
  if (n <= 4) return n;
  const empty = (c: number) => (c - (n % c)) % c;
  return [4, 3, 5].reduce((best, c) => (empty(c) < empty(best) ? c : best), 4);
};

type MapCard = { days: string; title: string; chain: string[]; idea: string; href: string };

/** Hand-written chains, by topic. A topic without one yet still gets its card, from the registry. */
const WRITTEN: MapCard[] = [
  {
    days: '0–6. egunak',
    title: 'Ernalkuntzatik habiratzera',
    chain: ['Ernalkuntza (anpulua)', 'Zigotoa → morula', 'Blastozistoa', 'Habiratzea (6. eg.)'],
    idea: 'Zigotoa tronpan zatitzen da (morula), umetokian blastozisto bihurtzen da eta 6. egunean habiratzen hasten da.',
    href: '/astea/1',
  },
  {
    days: '8–13. egunak',
    title: 'Bikoen astea',
    chain: ['Enbrioblastoa → epiblastoa + hipoblastoa', 'Amniosa + bitelo zakua', 'Trofoblastoa → zito + sinzitio', 'Lakuak → korion barrunbea', 'Biloxka primarioak'],
    idea: 'Dena bikoitza: bi orri, bi barrunbe eta bi trofoblasto; lakuek zirkulazio uteroplazentarioa hasten dute.',
    href: '/astea/2',
  },
  {
    days: '15–21. egunak',
    title: 'Hiruko astea',
    chain: ['Lerro primitiboa', 'Gastrulazioa → 3 orri', 'Notokorda (ardatza)', 'Biloxkak 1. → 2. → 3.'],
    idea: 'Gastrulazioa: epiblastotik hiru orri. Notokordak ardatza markatzen du. Biloxkak: 1. → 2. → 3.',
    href: '/astea/3',
  },
  {
    days: '17–28. egunak',
    title: 'Oinarriak eraikitzen',
    chain: ['Mesodermoa → paraxiala · tartekoa · albokoa', 'Somitak (20. eg.)', 'Plaka → hodi neurala (25/28)', 'Tolespenak → zilindroa'],
    idea: 'Mesodermoa hirutan banatzen da; somitak (20. eg.); plaka neurala → hodi neurala (25/28); tolespenek enbrioia zilindro bihurtzen dute.',
    href: '/astea/4',
  },
  {
    days: '5.–8. asteak',
    title: 'Kanpo-itxura',
    chain: ['Faringe arkuak + plakak', '1. hilabetea: hasikinak', '8. astea: eskuak, hatzak', 'Enbrioi-aroaren amaiera'],
    idea: 'Faringe arkuak eta plakak. Hilabete 1ean hasikinak besterik ez; 8. asterako eskuak eta hatzak. 8. astean bukatzen da enbrioi-aroa.',
    href: '/astea/5',
  },
  {
    days: '9. astea – jaiotza',
    title: 'Fetua eta karena',
    chain: ['Fetu-aroa: hazi eta heldu', 'Korion hostotsua + dezidua basala → karena', 'Zilbor-hestea', 'Likido amniotikoa'],
    idea: 'Fetu-aroa: hazkundea eta heltzea. Karena (korion hostotsua + dezidua basala), zilbor-hestea eta likido amniotikoa.',
    href: '/astea/6',
  },
  {
    days: '3.–6. asteak',
    title: 'Gorputzaren barrunbeak',
    chain: ['Zeloma (paretako + errai orria)', 'Septum transversuma (C3–C5)', 'Pleura · perikardio · peritoneo', 'Diafragma (4 osagai)'],
    idea: 'Zeloma tolespenekin gorputz barruan geratzen da; septumak bitan banatzen du; mintz pleuroperikardikoek eta pleuroperitonealek barrunbeak bereizten dituzte; diafragma lau osagaitik.',
    href: '/astea/7',
  },
  {
    days: '4.–12. asteak',
    title: 'Hezur sistema',
    chain: ['Mesenkima (3 jatorri)', 'Mintzezko / endokondrala', 'Burezurra · ornoak · saihetsak · adarrak', 'Zentro primarioak (12. astea)'],
    idea: 'Hezurrak hiru jatorritatik datoz (mesodermo paraxiala, paretako orria, gandor neurala); mesenkima zuzenean hezurtzen da (mintzezkoa) edo kartilago-eredua sortzen du (endokondrala); gorputz-adarretako hezur luzeetan zentro primarioak 12. astean.',
    href: '/astea/8',
  },
  {
    days: '4. astetik aurrera',
    title: 'Muskulu sistema',
    chain: ['Paraxiala · errai orria', 'Domeinu primaxiala / abaxiala', 'Adar primarioak: epaxial / hipaxial', 'Leuna · bihotzekoa: begetatiboa'],
    idea: 'Muskulu ildaskatuak mesodermo paraxialetik (somitomeroak, somitak) eta nerbio kranialek edo espinalek inerbatuta; leuna eta bihotzekoa errai orritik, inerbazio begetatiboarekin. Somitetatik bi domeinu: primaxiala eta abaxiala.',
    href: '/astea/9',
  },
  {
    days: '3.–10. asteak',
    title: 'Zirkulazio aparatua',
    chain: ['Eskualde kardiogenikoa', 'Tolespenak → bihotz hodi bakarra', 'Lehen zirkulazioa: zainak → bihotza → arteriak', 'Hodia tolestu → bihotz lakioa', 'Atalen eratorriak: bentrikuluak · aurikulak · arteria handiak'],
    idea: 'Eskualde kardiogenikotik bihotz hodia eta lehen zirkulazioa; hodia lakio bihurtzen da. Atal bulbarra, bentrikularra, aurikularra eta zain sinua bereizi, bakoitzaren eratorriak kokatzeko.',
    href: '/astea/10',
  },
  {
    days: '4.–5. asteak eta jaiotza',
    title: 'Zirkulazio-sistema (II)',
    chain: ['Kuxinak + pareta muskularrak → trenkadak', 'Aurikulak: bi septum, zulo obala', 'Erreten aurikulubentrikularra → bi zulo + balbulak', 'Bentrikuluak · konoa · enborra: bereizi eta lotu', 'Jaiotza: zulo obalaren itxiera'],
    idea: 'Bihotz lakioaren barrunbeak trenkadek banatzen dituzte; konoa eta enbor arteriosoa bereiztean, aorta ezkerreko bentrikuluarekin eta birika enborra eskuinekoarekin lotzen dira. Zulo obalak jaio arte komunikazioa mantentzen du; jaiotzean presio-aldaketak itxiera eragiten du.',
    href: '/astea/11',
  },
  {
    days: '4.–8. asteak eta jaiotza',
    title: 'Zirkulazio-sistema (III)',
    chain: ['Aorta zakua → arkuak → aorta dortsalak', 'Arkuen eratorriak: eskuina ≠ ezkerra', 'Nerbio atzerakariak: arterien inguruan', 'Beheranzko aorta → gorputzeko adarrak', 'Gorputz adarrak: ardatz arteriak'],
    idea: 'Arkuak sortu eta birmoldatu egiten dira: 3.etik karotidak; 4. eta 6. arkuen garapena desberdina da bi aldeetan. Horrek nerbio atzerakarien ibilbidea azaltzen du. Ondoren, beheranzko aortaren adarrak eta gorputz adarretako ardatz arteriak bereizi.',
    href: '/astea/12',
  },
];

const byHref = new Map(WRITTEN.map((m) => [m.href, m]));
const MAP: MapCard[] = weeks.map(
  (w) =>
    byHref.get(`/astea/${w.week}`) ?? {
      days: w.span?.long ?? `${w.dayRange[0]}–${w.dayRange[1]}. egunak`,
      title: w.title,
      chain: w.stages.slice(0, 4).map((s) => s.title),
      idea: w.subtitle,
      href: `/astea/${w.week}`,
    },
);

const questionIds = POOL.map((q) => q.id);
const competenceKeys = [...KEY_IDS.keys()];
const stageTotal = weeks.reduce((n, w) => n + w.stages.length, 0);

/** Home: the mental map of the subject, and the study route with the viewer's real progress. */
export function StudyMap() {
  const visited = useVisitedAll();
  const answers = useAnswers();
  const seen = weeks.reduce((n, w) => n + w.stages.filter((s) => visited[w.week]?.includes(s.id)).length, 0);
  const answered = questionIds.filter((id) => answers[id]).length;
  const mastered = competenceKeys.filter((k) => competenceLevel(answers, KEY_IDS.get(k) ?? []) === 'menderatuta').length;
  // eslint-disable-next-line react-hooks/purity -- a review date is compared with "now" on each render, on purpose
  const now = Date.now();
  const missed = questionIds.filter((id) => isDue(answers[id], now)).length;

  const route: { n: string; title: string; text: string; href: string; state: string }[] = [
    { n: '1', title: 'Ikusi prozesuak', text: 'Etapa bakoitza ikasteko moduan: aurrebista, urratsak eta egituren bira.', href: '/astea/1', state: `${seen}/${stageTotal} etapa` },
    { n: '2', title: 'Kokatu denboran', text: 'Kronologian: zer dagoen egun bakoitzean, zer den berria eta zer desagertu den.', href: '/kronologia', state: 'Zer dago orain?' },
    { n: '3', title: 'Lotu jatorriak', text: 'Leinuetan: ernetze orri bakoitzetik zer sortzen den.', href: '/leinuak', state: 'Nondik → zertan' },
    { n: '4', title: 'Irakurri irudiak', text: 'Irudi-laborategian: etiketarik gabe, zuri-beltzean eta biratuta.', href: '/irudiak', state: 'Seinalatu · gezia · orientazioa' },
    { n: '5', title: 'Praktikatu', text: 'Galderak simulagailuan: noiz, nondik, nola, non, zertan eta zergatik.', href: '/astea/1', state: `${answered}/${questionIds.length} erantzunda` },
    { n: '6', title: 'Menderatu', text: 'Gaitasun bat menderatuta dago azken 3 saiakerak ondo daudenean, galdera desberdinekin eta egun desberdinetan. Huts egindakoak «Errepasoa» moduan itzultzen dira.', href: '/astea/1', state: `${mastered}/${competenceKeys.length} gaitasun${missed ? ` · ${missed} errepasatzeko` : ''}` },
  ];

  const cols = shelfCols(MAP.length);
  return (
    <>
      <section id="mapa" className="land-section map">
        <header className="section-head" data-rv>
          <p className="kicker">Mapa · 20 segundotan</p>
          <h2>Gai osoa, begirada batean</h2>
          <p>{countWord(MAP.length)} gai, ordenan. Hau buruan izanda, xehetasun bakoitzak badu bere lekua.</p>
        </header>
        <ol className="map-row" style={{ '--cols': cols } as CSSProperties}>
          {MAP.map((m, k) => (
            <li key={m.title} className={(k + 1) % cols === 0 ? 'is-row-end' : undefined} data-rv style={{ '--d': `${(k % cols) * 80}ms` } as CSSProperties}>
              <Link href={m.href} className="map-card">
                <span className="map-n">{String(k + 1).padStart(2, '0')}</span>
                <span className="map-days">{m.days}</span>
                <b>{m.title}</b>
                <span className="map-chain" title={m.idea}>
                  {m.chain.map((x) => (
                    <i key={x}>{x}</i>
                  ))}
                </span>
              </Link>
            </li>
          ))}
        </ol>
      </section>

      <section id="ibilbidea" className="land-section route">
        <header className="section-head" data-rv>
          <p className="kicker">10/10 ibilbidea</p>
          <h2>Apunteetatik simulagailura</h2>
          <p>Ikusteak ez du esan nahi jakitea. Sei pauso, eta bakoitzean zure aurrerapena.</p>
        </header>
        <ol className="route-list">
          {route.map((r, k) => (
            <li key={r.n} data-rv style={{ '--d': `${k * 70}ms` } as CSSProperties}>
              <Link href={r.href} className="route-step">
                <span className="route-n">{r.n}</span>
                <span className="route-main">
                  <b>{r.title}</b>
                  <span>{r.text}</span>
                </span>
                <span className="route-state">{r.state}</span>
              </Link>
            </li>
          ))}
        </ol>
      </section>
    </>
  );
}
