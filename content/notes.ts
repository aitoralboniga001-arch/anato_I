/**
 * The table of contents of each topic's notes (AURKIBIDEA), numbered and worded as in the notes, with
 * the stages that show each section. The simulator is organised around it so the student always
 * sees where a stage sits in the notes they study from; sections the simulation does not animate
 * are listed too, with the reason, so nothing seems to be missing.
 */

export interface NotesSection {
  /** Numbering exactly as in the notes: "2", "3.1", "3.2–3.3". */
  n: string;
  title: string;
  /** 0 = heading of the notes, 1 = sub-heading. */
  depth: 0 | 1;
  /** Stage ids, in the order they are played. */
  stages: string[];
  /** Sub-headings of the notes a stage also covers, for the tooltip. */
  covers?: string;
  /** Why the section has no stage. */
  note?: string;
}

export const NOTES: Record<number, NotesSection[]> = {
  1: [
    { n: '1', title: 'Anatomiako terminoak', depth: 0, stages: ['terminoak'], covers: '1.1 Planoak eta ardatzak · 1.2 Kokapen terminoak' },
    { n: '2', title: 'Sarrera', depth: 0, stages: [], note: 'Testua soilik: garapenaren garaiak (lehen bi asteak, enbrioi aroa, fetu aroa).' },
    { n: '3', title: 'Gametogenesia', depth: 0, stages: [], note: 'Gaitegitik kanpo.' },
    { n: '4', title: 'Lehenengo asteko prozesuak', depth: 0, stages: [] },
    { n: '4.1', title: 'Emakumearen ugal aparatua', depth: 1, stages: ['ibilbidea'] },
    { n: '4.2', title: 'Ernalkuntza', depth: 1, stages: ['ernalkuntza'] },
    { n: '4.3', title: 'Zigotoaren segmentazioa', depth: 1, stages: ['segmentazioa'] },
    { n: '4.4', title: 'Blastozistoaren eraketa', depth: 1, stages: ['blastozistoa'] },
    { n: '4.5', title: 'Blastozistoaren habiratze-prozesua', depth: 1, stages: ['habiratzea'], covers: '4.6 Blastozistoaren ezohiko habiratze lekuak' },
  ],
  2: [
    { n: '1', title: 'Garapenaren 8. eguna', depth: 0, stages: ['eguna-8'] },
    { n: '2', title: 'Garapenaren 9. eguna', depth: 0, stages: ['eguna-9'] },
    { n: '3', title: 'Garapenaren 11. eta 12. egunak', depth: 0, stages: ['eguna-11-12'] },
    { n: '4', title: 'Garapenaren 13. eguna', depth: 0, stages: ['eguna-13'] },
  ],
  3: [
    { n: '0', title: '2. astearen bukaerako egoera', depth: 0, stages: ['2-astearen-amaiera'] },
    { n: '1', title: 'Hiru orriko ernetze diskoaren eraketa', depth: 0, stages: ['gastrulazioa', 'mesodermoa-hedatzen'] },
    { n: '2', title: 'Notokordaren eraketa', depth: 0, stages: ['notokorda'] },
    { n: '3', title: 'Disko enbrionarioaren hazkuntza', depth: 0, stages: ['alantoidea-eta-hazkundea'], covers: 'Alantoidea (2. ataleko bukaeran) ere bai' },
    { n: '4', title: 'Trofoblastoaren ondorengo garapena', depth: 0, stages: ['biloxkak', 'zorro-zitotrofoblastikoa', 'zirkulazioa'] },
  ],
  4: [
    { n: '1', title: 'Sarrera', depth: 0, stages: ['tolespenak'], covers: 'Zeharkako eta zefalokaudal tolespenak' },
    { n: '2', title: 'Ektodermoaren eratorriak', depth: 0, stages: ['neurulazioa', 'burmuin-bexikulak', 'gandor-neurala'] },
    { n: '3', title: 'Mesodermoaren eratorriak', depth: 0, stages: ['mesodermoa-banatzen'] },
    { n: '3.1', title: 'Mesodermo paraxialean gertatutako aldaketak', depth: 1, stages: ['somitak', 'somitaren-bereizketa'] },
    {
      n: '3.2–3.3',
      title: 'Bitarteko eta alboko mesodermoan gertatutako aldaketak',
      depth: 1,
      stages: ['bitarteko-eta-alboko-mesodermoa'],
      covers: '3.2 Bitarteko mesodermoan · 3.3 Alboko mesodermoan',
    },
    { n: '4', title: 'Endodermo geruzaren eratorriak', depth: 0, stages: ['endodermoa'] },
  ],
  5: [
    { n: '1', title: 'Enbrioi aroan', depth: 0, stages: ['enbrioia-28-32', 'enbrioia-42-56', 'gorputz-adarrak'] },
    { n: '2', title: 'Umeki edo fetu aroan', depth: 0, stages: ['iraupena', 'buruaren-proportzioa'] },
    { n: '2.1', title: 'Hirugarren hilabetea', depth: 1, stages: ['hirugarren-hilabetea'] },
    { n: '2.2', title: 'Laugarren eta bosgarren hilabeteak', depth: 1, stages: ['laugarren-bosgarren'] },
    { n: '2.3', title: 'Garapenaren azken hilabeteak', depth: 1, stages: ['azken-hilabeteak'] },
  ],
  6: [
    { n: '1', title: 'Karena eta haren eratorria', depth: 0, stages: ['karena-muga'], covers: '1.1 Karenaren lau geruzak · 1.2 Biloxken egitura' },
    {
      n: '1.3–1.5',
      title: 'Biloxken aldaketak, karena muga eta zirkulazioa',
      depth: 1,
      stages: ['biloxka-askeak'],
      covers: '1.3 Hurrengo hilabeteetan biloxketan ematen diren aldaketak · 1.4 Karena mugan ematen diren aldaketak · 1.5 Enbrioi kanpoko sistema zirkulatorioa',
    },
    { n: '2', title: 'Trofoblastoan ematen diren aldaketak', depth: 0, stages: ['korion-hostotsua', 'kotiledoiak'] },
    { n: '3', title: 'Bukaerako karena edo karena aterminoa', depth: 0, stages: ['karena-aterminoa'], covers: '3.1 Karenaren zirkulazioa · 3.2 Karenaren funtzioak' },
    { n: '4', title: 'Zilbor-hestearen eraketa eta garapena', depth: 0, stages: ['zilbor-hestea'] },
    { n: '5', title: 'Likido amniotikoa', depth: 0, stages: ['likido-amniotikoa'] },
  ],
  7: [
    { n: '1', title: 'Garapenaren 3. astea', depth: 0, stages: ['zeloma'] },
    { n: '2', title: 'Septum Transversumaren eraketa', depth: 0, stages: ['septum-transversum'] },
    { n: '2.1', title: 'Peritoneo barrunbea', depth: 1, stages: ['peritoneo-barrunbea'] },
    { n: '2.2', title: 'Hasierako perikardio barrunbea (behin-betiko perikardio barrunbeak eta pleura barrunbeak)', depth: 1, stages: ['pleura-perikardioa'] },
    { n: '3', title: 'Diafragmaren eraketa', depth: 0, stages: ['diafragma-eraketa'] },
    { n: '3.1', title: 'Diafragmaren atalen eraketa', depth: 1, stages: ['diafragma-heldua'] },
    { n: '4', title: 'Gogoratu beharrekoa', depth: 0, stages: [], note: 'Laburpena: "Diafragmaren atalak" etaparen azken urratsean erakusten da.' },
    { n: '5', title: 'Gaiaren beste irudi batzuk', depth: 0, stages: [], note: 'Irudiak: simulazioaren ikuspegietan erabilita.' },
  ],
  8: [
    { n: '1', title: 'Hezur-sistema eta eratorriak', depth: 0, stages: ['jatorriak'] },
    { n: '2', title: 'Hezurtzapen motak', depth: 0, stages: ['hezurtzapena'] },
    { n: '3', title: 'Burezurra / Kraneoa', depth: 0, stages: [], note: 'Burezurra: neurokraneoa eta errai kraneoa azpiataletan erakusten dira.' },
    { n: '3.1', title: 'Neurokraneoa', depth: 1, stages: ['buru-ganga', 'kondrokraneoa'], covers: '3.1.1 Mintzezko zatia/buru-ganga · 3.1.2 Kondrokraneoa edo neurokraneo kartilaginotsua' },
    { n: '3.2', title: 'Errai kraneoa', depth: 1, stages: ['errai-kraneoa'] },
    { n: '4', title: 'Gorputz-adarretako hezurrak', depth: 0, stages: ['gorputz-adarrak', 'hezur-luzeak'] },
    { n: '5', title: 'Bizkarrezurraren eraketa', depth: 0, stages: [] },
    { n: '5.1', title: 'Ornoak', depth: 1, stages: ['ornoa'], covers: '5.3 Orno zuloa edo orno bertebrala' },
    { n: '5.2', title: 'Ornoak eta diskoak', depth: 1, stages: ['bizkarrezurra'], covers: '5.2.1 Mesenkima zutabearen garapena' },
    { n: '5.3', title: 'Orno zuloa edo orno bertebrala', depth: 1, stages: [], note: 'Orno zuloa: "Ornoa" etapan erakusten da.' },
    { n: '5.4', title: 'Bizkarrezurraren ornoekin lotuta dauden saihetsen eraketa', depth: 1, stages: ['saihetsak'] },
  ],
  9: [
    { n: '1', title: 'Sarrera', depth: 0, stages: ['muskulu-motak'] },
    { n: '2', title: 'Muskulu ildaskatuak (edo borondatezkoak)', depth: 0, stages: ['ildaskatuak'] },
    {
      n: '2.1',
      title: 'Buruko eta lepoko muskulu ildaskatuak',
      depth: 1,
      stages: ['somitomeroak-burua', 'okzipitalak', 'ehun-konektiboa'],
      covers: '2.1.1 Somitomeroak · 2.1.2 Somitak · 2.1.3 Inerbazioa · 2.1.4 Ehun konektibozko patroiak',
    },
    {
      n: '2.2',
      title: 'Bizkarreko, gorputz paretetako eta gorputz adarretako muskuluen jatorria',
      depth: 1,
      stages: ['somitaren-paretak', 'domeinuak', 'nerbio-espinala', 'epaxial-hipaxial'],
      covers: '2.2.1 Domeinuaren araberako sailkapena · 2.2.2 Inerbazioaren araberako sailkapena',
    },
    { n: '3', title: 'Muskulu leuna edo muskulu lisoa', depth: 0, stages: ['muskulu-lisoa'], covers: '3.1 Sistema baskularra' },
    { n: '4', title: 'Bihotzeko muskulua edo miokardioa', depth: 0, stages: ['bihotz-muskulua'] },
  ],
  10: [
    { n: '1', title: 'Eskualde kardiogenikoaren eraketa', depth: 0, stages: ['eskualde-kardiogenikoa', 'bihotz-hodia', 'zirkulazio-goiztiarra'] },
    { n: '2', title: 'Bihotz lakioaren eraketa', depth: 0, stages: ['bihotz-atalak', 'bihotz-lakioa'] },
    { n: '3', title: 'Bihotz lakioaren ataletatik sortzen diren egiturak', depth: 0, stages: [] },
    { n: '3.1', title: 'Bihotzaren atal bulbarretik', depth: 1, stages: ['atal-bulbarra'] },
    { n: '3.2', title: 'Atal bentrikularretik', depth: 1, stages: ['atal-bentrikularra'] },
    { n: '3.3', title: 'Atal aurikularretik', depth: 1, stages: ['atal-aurikularra'] },
    { n: '3.4', title: 'Atal zain-sinutik', depth: 1, stages: ['zain-sinua', 'eskuineko-aurikula'] },
  ],
  11: [
    { n: '1', title: 'Sarrera', depth: 0, stages: ['trenkadatze-mekanismoak'] },
    { n: '2', title: 'Aurikula komunaren trenkadak', depth: 0, stages: [] },
    { n: '2.1', title: 'Septum Primum-aren sorrera', depth: 1, stages: ['septum-primum'] },
    { n: '2.2', title: 'Septum secundum-aren sorrera', depth: 1, stages: ['zulo-obala', 'jaiotza', 'aurikulen-paretak'] },
    { n: '3', title: 'Erreten aurikulubentrikularraren trenkadak', depth: 0, stages: ['erreten-ab', 'balbula-ab'] },
    { n: '4', title: 'Bentrikuluaren trenkadak', depth: 0, stages: ['bentrikulu-arteko-trenkada'] },
    { n: '5', title: 'Atal bulbarraren trenkadatze prozesua', depth: 0, stages: [] },
    { n: '5.1', title: 'Arteria Konoaren trenkadak', depth: 1, stages: ['arteria-konoa'] },
    { n: '5.2', title: 'Enbor arteriosoaren trenkadak', depth: 1, stages: ['enbor-arteriosoa', 'balbula-semilunarrak', 'jatorriak'] },
  ],
  12: [
    { n: '1', title: 'Sarrera', depth: 0, stages: ['sarrera'] },
    { n: '2', title: 'Arku-sistemaren eraketa eta garapena', depth: 0, stages: ['arku-sistema'] },
    { n: '2.1', title: 'Garapenaren 27. eguna, 4mm-ko enbrioia', depth: 1, stages: ['eguna-27'] },
    { n: '2.2', title: 'Garapenaren 29. eguna, 10mm-ko enbrioia', depth: 1, stages: ['eguna-29'] },
    { n: '2.3', title: 'Arkuen garapena', depth: 1, stages: ['hirugarren-arkua', 'laugarren-arkua', 'seigarren-arkua'] },
    { n: '2.4', title: 'Beste aldaketak arteria arku-sisteman', depth: 1, stages: ['beste-aldaketak', 'nerbio-atzerakariak', 'aorta-heldua'] },
    { n: '2.5', title: 'Beheranzko aortaren garapena', depth: 1, stages: ['adar-bentralak', 'alboko-adarrak'] },
    { n: '2.6', title: 'Aortatik ateratzen diren adarrak', depth: 1, stages: ['zilbor-iliakoak'] },
    { n: '2.7', title: 'Goiko eta beheko gorputz adarren arteriak', depth: 1, stages: ['gorputz-adarrak'] },
  ],
  13: [
    { n: '1', title: 'Sarrera', depth: 0, stages: ['sarrera'] },
    { n: '2', title: 'Zain nagusien garapena', depth: 0, stages: ['zain-nagusiak'] },
    { n: '2.1', title: 'Zain bitelinoak / onfalomesenterikoak', depth: 1, stages: ['bitelinoak', 'porta'] },
    { n: '2.2', title: 'Zilborreko zainak', depth: 1, stages: ['zilbor-zainak'] },
    { n: '2.3', title: 'Kardinal zainak', depth: 1, stages: ['kardinalak', 'azigos'] },
    { n: '3', title: 'Kaba zainak (goiko eta behekoak)', depth: 0, stages: ['kaba-zainak'] },
    { n: '3.1', title: 'Beheko kaba zaina', depth: 1, stages: ['beheko-kaba', 'sinu-koronarioa'] },
    { n: '3.2', title: 'Goiko kaba zaina', depth: 1, stages: ['goiko-kaba', 'laburpena'] },
    { n: '4', title: 'Zirkulazio sistemak', depth: 0, stages: [] },
    { n: '4.1', title: 'Jaio aurreko zirkulazioa', depth: 1, stages: ['jaio-aurretik'] },
    { n: '4.2', title: 'Jaiotzaren momentuan ematen diren aldaketak', depth: 1, stages: ['jaiotza'] },
    { n: '4.3', title: 'Jaio osteko zirkulazioa', depth: 1, stages: ['jaio-ondoren'] },
    { n: '5', title: 'Linfa sistema', depth: 0, stages: ['linfa'] },
  ],
  // Topic 14 came in two PDFs: part 1 (1–3.6) and part 2 (4–5, the summary of the derivatives' places and the
  // respiratory system, which the notes do not number). Sections without stages are still being built.
  14: [
    { n: '1', title: 'Sarrera', depth: 0, stages: ['sarrera'] },
    { n: '2', title: 'Hesteen ezaugarriak', depth: 0, stages: [] },
    { n: '2.1', title: 'Hasierako hestearen atalak', depth: 1, stages: ['heste-atalak', 'arnas-hastapena'] },
    { n: '2.2', title: 'Hesteen zirkulazioa', depth: 1, stages: ['zirkulazioa'] },
    { n: '2.3', title: 'Mesenterioa', depth: 1, stages: ['mesenterioa'] },
    { n: '3', title: 'Aurreko hestearen atalak', depth: 0, stages: [] },
    { n: '3.1', title: 'Hestegorria', depth: 1, stages: ['hestegorria'] },
    { n: '3.2', title: 'Urdaila', depth: 1, stages: ['urdail-biraketak', 'poltsa-omentala', 'atzeko-mesogastrioa', 'aurreko-mesogastrioa'] },
    { n: '3.3', title: 'Duodenoa', depth: 1, stages: ['duodenoa'] },
    { n: '3.4', title: 'Gibela', depth: 1, stages: ['gibela', 'gibel-lotailuak'] },
    { n: '3.5', title: 'Behazun-xixkua', depth: 1, stages: ['behazun-xixkua'] },
    { n: '3.6', title: 'Area edo Pankreasa', depth: 1, stages: ['area', 'area-hodiak'] },
    { n: '4', title: 'Bitarteko hestea', depth: 0, stages: ['bitarteko-hestea'] },
    { n: '4.1', title: 'Bitarteko hesteko eratorriak', depth: 1, stages: ['heste-lakioa'] },
    { n: '4.2', title: 'Heste lakioen hernia fisiologikoa', depth: 1, stages: ['hernia-fisiologikoa'] },
    { n: '4.4', title: 'Peritoneo barrunbeko egiturak eta loturak', depth: 1, stages: ['peritoneo-egiturak'] },
    { n: '5', title: 'Atzeko hestea', depth: 0, stages: ['atzeko-hestea-eratorriak', 'kloaka'] },
    { n: '5.1', title: 'Hestearen irrigazioa', depth: 1, stages: ['irrigazioa'] },
    { n: '6', title: 'Eratorrien kokapena laburbilduta', depth: 0, stages: ['eratorrien-kokapena'] },
    { n: '0', title: 'Arnas aparatua', depth: 0, stages: ['arnas-zuhaitza', 'albeoloak'] },
  ],
};

/** The notes section a stage belongs to, and its parent heading when it is a sub-heading. */
export function sectionOf(week: number, stageId: string): { section: NotesSection; parent?: NotesSection } | null {
  const list = NOTES[week] ?? [];
  const i = list.findIndex((s) => s.stages.includes(stageId));
  if (i < 0) return null;
  const section = list[i];
  let parent: NotesSection | undefined;
  if (section.depth === 1) for (let k = i - 1; k >= 0; k--) if (list[k].depth === 0) { parent = list[k]; break; }
  return { section, parent };
}

/** "3.1 Mesodermo paraxialean…" — the heading as the notes write it. */
// A section numbered 0 (a recap before the first numbered section) is named by its title alone.
export const sectionLabel = (s: NotesSection) =>
  s.n === '0' ? s.title : `${s.n}. ${s.title}`.replace(/^(\d+\.\d+(?:–\d+\.\d+)?)\. /, '$1 ');
