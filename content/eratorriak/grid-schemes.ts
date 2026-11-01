/**
 * Eskema integratuak: one grid per notes section that puts origin, place, structure and nerve (or artery
 * piece) side by side, so a whole row reads as one path. Written from the notes prose (content/notes-text
 * w9 and w12 §2.4–2.7); `section` names the notes heading the grid stands for. Checked by tests/grid-schemes.test.ts.
 */

/** Colour family of a column or a single cell. */
export type Tone = 'jatorria' | 'kokapena' | 'begia' | 'arkua' | 'mihia' | 'muskulua' | 'nerbioa' | 'arteria' | 'aldaketa' | 'ondorioa' | 'neutral';

export interface GridColumn {
  label: string;
  tone: Tone;
  /** Relative width (fr); 1 by default. */
  w?: number;
}

export interface GridCell {
  text: string;
  note?: string;
  /** Rows this cell covers, downwards (the rows below hold `null` in this column). */
  span?: number;
  /** Columns this cell covers, rightwards (the next cells in this row are `null`): the same on both sides. */
  cols?: number;
  /** Overrides the column's colour (eye / arch / tongue places). */
  tone?: Tone;
  /** It disappears: drawn muted and struck. */
  gone?: boolean;
  /** A real displacement (migrates / moves up). */
  move?: boolean;
}

export interface GridRow {
  /** One entry per column; `null` where a cell above spans into this row. */
  cells: (GridCell | null)[];
  /** Filter keys this row belongs to. */
  tags?: string[];
}

export interface GridScheme {
  id: string;
  week: number;
  /** Notes section(s) this grid stands for. */
  section: string;
  title: string;
  lead?: string;
  /** Simulator stage that shows it. */
  stage?: string;
  /** Read left to right as a path (arrows between columns); otherwise a comparison table. */
  path: boolean;
  columns: GridColumn[];
  rows: GridRow[];
  /** Row filters: show only the rows with this tag. */
  filters?: { tag: string; label: string; tone?: Tone }[];
  /** Short traps, from the notes. */
  pitfalls?: string[];
  links?: { href: string; label: string }[];
  /** Notes mark the section as not required. */
  optional?: boolean;
}

const c = (text: string, extra?: Omit<GridCell, 'text'>): GridCell => ({ text, ...extra });
const r = (cells: (GridCell | string | null)[], tags?: string[]): GridRow => ({ cells: cells.map((x) => (typeof x === 'string' ? c(x) : x)), tags });

export const GRID_SCHEMES: GridScheme[] = [
  // ——— 9. gaia: muskulu-sistema ———
  {
    id: 'muskulu-motak',
    week: 9,
    section: '1 · 3 · 4',
    title: 'Hiru muskulu motak: jatorria, kokapena eta inerbazioa',
    lead: 'Ia muskulu guztiak mesodermotik datoz; salbuespen gutxi batzuk ektodermotik.',
    stage: 'muskulu-motak',
    path: false,
    columns: [
      { label: 'Mota', tone: 'muskulua', w: 0.9 },
      { label: 'Jatorria', tone: 'jatorria', w: 1.2 },
      { label: 'Non dago', tone: 'kokapena', w: 1.2 },
      { label: 'Inerbazioa', tone: 'nerbioa', w: 1.1 },
      { label: 'Berezitasuna', tone: 'neutral', w: 1.3 },
    ],
    rows: [
      r([c('Ildaskatua', { note: 'borondatezkoa' }), c('Mesodermo paraxiala', { note: 'somitomeroak eta somitak' }), c('Mugimendua: burua, lepoa, enborra, gorputz-adarrak'), c('Nerbio kranealak (burua, lepoa)', { note: 'enborra eta adarrak: nerbio espinalak' }), c('Mioblastoak fusionatu → zuntz luze nukleo ugarikoak', { note: 'ildaskak 3. hilabetearen bukaeran' })]),
      r([c('Leuna', { note: 'lisoa' }), c('Alboko mesodermoaren errai-orria', { note: 'hestearen eta haren eratorrien inguruan' }), c('Erraiak eta odol-hodien pareta', { note: 'bihotza izan ezik' }), c('Begetatiboa', { note: 'sinpatikoa + parasinpatikoa' }), c('Aortaren eta haren adarren paretakoa: paretako orria + gandor neurala', { note: 'gaur egun hala uste da' })]),
      r([c('Miokardioa', { note: 'bihotzeko muskulua' }), c('Errai-orria, bi bihotz-hodien inguruan'), c('Bihotz-paretaren tarteko geruza'), c('Barnekoa: eroapen-sistema', { note: 'kanpokoa: begetatiboa, erregulatzeko' }), c('Ildaskatua, baina mioblastoak EZ dira fusionatzen', { note: 'disko interkalarrez lotuta' })]),
      r([c('Salbuespenak', { note: 'ez mesodermikoak' }), c('Ektodermoa'), c('Begi-niniko estutzailea eta zabaltzailea · titi-guruinetako zelula mioepitelialak · izerdi-guruinetako muskulu lisoak'), c('Begetatiboa'), c('Muskulu leunak dira, ez begia mugitzen dutenak')]),
    ],
    pitfalls: [
      'Begi-niniko muskuluak (ektodermoa) ≠ begia mugitzen duten kanpoko muskuluak (somitomeroak, mesodermoa).',
      'Abdomeneko, gorputz-adarretako eta faringe-arkuetako muskuluak mesodermikoak dira (mesodermo paraxiala).',
      'Leuna eta miokardioa errai-orritik; ildaskatuak mesodermo paraxialetik.',
    ],
  },
  {
    id: 'buruko-muskuluak',
    week: 9,
    section: '2.1 · 2.1.1–2.1.3',
    title: 'Buru eta lepoa: jatorria → kokapena → muskuluak → nerbioa',
    lead: 'Errenkada bakoitza bide bat da. Arku bakoitzak bere gara-nerbioa du; begiaren muskuluak arkurik gabe, III, IV eta VI nerbioekin.',
    stage: 'somitomeroak-burua',
    path: true,
    columns: [
      { label: 'Mesodermo paraxiala', tone: 'jatorria', w: 0.95 },
      { label: 'Zatia', tone: 'jatorria', w: 0.85 },
      { label: 'Non kokatzen da', tone: 'kokapena', w: 0.9 },
      { label: 'Muskuluak', tone: 'muskulua', w: 1.35 },
      { label: 'Gara-nerbioa', tone: 'nerbioa', w: 1.1 },
    ],
    rows: [
      r([c('Somitomeroak', { span: 6, note: '7 bikote · segmentazio osatugabea' }), '1.–2. somitomeroak', c('Begiaren inguruan', { tone: 'begia' }), c('Goiko, beheko eta erdiko muskulu zuzenak', { note: '+ beheko laprana' }), c('III · begi-eragilea', { note: 'okulomotorea' })], ['begia']),
      r([null, '3. somitomeroa', c('Begiaren inguruan', { tone: 'begia' }), 'Goiko laprana', c('IV · troklearra', { note: 'troklea-nerbioa, patetikoa' })], ['begia']),
      r([null, '4. somitomeroa', c('1. faringe-arkua', { tone: 'arkua' }), c('Murtxikatzaileak', { note: 'barailaren jasotzaileak: lokia, maseterra, pterigoideoak' }), c('V · trigeminoa', { note: 'barail-adarra (V3)' })], ['arkua']),
      r([null, '5. somitomeroa', c('Begiaren inguruan', { tone: 'begia' }), 'Alboko zuzena', c('VI · aldentzailea', { note: 'abduzentea' })], ['begia']),
      r([null, '6. somitomeroa', c('2. faringe-arkua', { tone: 'arkua' }), c('Aurpegiko muskulu mimikoak', { note: '+ barailaren jeistaileak (depresoreak)' }), c('VII · aurpegi-nerbioa', { note: 'faziala' })], ['arkua']),
      r([null, '7. somitomeroa', c('3. faringe-arkua', { tone: 'arkua' }), 'Estilofaringeoa', c('IX · glosofaringeoa', { note: 'mihi-eztarrikoa' })], ['arkua']),
      r([c('Somita okzipitalak', { span: 3, note: '5 bikote; lehena goiz desagertzen da → 4' }), c('1.–2. somita okzipitalak', { span: 2 }), c('4. faringe-arkua', { tone: 'arkua' }), c('Krikotiroideoa · faringeko hertsatzaileak'), c('X · bagoa', { note: 'goiko n. laringeoa (kanpoko adarra) · faringeko adarrak' })], ['arkua']),
      r([null, null, c('6. faringe-arkua', { tone: 'arkua' }), c('Laringeko muskulu intrintsekoak', { note: 'krikotiroideoa izan ezik' }), c('X · bagoa', { note: 'n. laringeo atzerakaria' })], ['arkua']),
      r([null, '2.–5. somita okzipitalak', c('Mihia', { tone: 'mihia', note: 'arkurik gabe' }), c('Mihiko muskulu guztiak', { note: 'denak ildaskatuak' }), c('XII · hipoglosoa', { note: 'zuntz motoreak soilik' })], ['mihia']),
    ],
    filters: [
      { tag: 'begia', label: 'Begia', tone: 'begia' },
      { tag: 'arkua', label: 'Faringe-arkuak', tone: 'arkua' },
      { tag: 'mihia', label: 'Mihia', tone: 'mihia' },
    ],
    pitfalls: [
      'Begia mugitzen dute III, IV eta VI nerbioek bakarrik. V1 (oftalmikoa) sentsitiboa da: ez du begiaren muskulurik mugitzen.',
      'Arkuak eta nerbioak: 1 → V · 2 → VII · 3 → IX · 4 eta 6 → X. 5. arkua ez da garatzen.',
      'III nerbioa ez dago arku batekin lotuta: begiaren inguruko 1.–2. somitomeroak dira.',
      'Nerbio batek zuntz mota bat baino gehiago izan dezake (V: sentsorialak eta motoreak; X: sentsorialak ere bai). XII motorea soilik.',
      'Buruan muskuluen ehun konektibozko patroia gandor neuralak egiten du.',
    ],
    links: [
      { href: '/eratorriak#a12-eskemak', label: 'X nerbioaren atzerakaria arterien azpitik: 12. gaia, 2.4' },
      { href: '/eratorriak#arku-sistemak', label: 'Arku bakoitzaren hezurrak, arteriak eta poltsak' },
    ],
  },
  {
    id: 'somita-domeinuak',
    week: 9,
    section: '2.2',
    title: 'Somitatik bi domeinuetara: nork zer sortzen duen',
    lead: 'Somitaren alboko mugak bi domeinu bereizten ditu: barruan primaxiala (somitak), kanpoan abaxiala (paretako orria eta bertara iritsitako somita-zelulak).',
    stage: 'somitaren-paretak',
    path: true,
    columns: [
      { label: 'Somitaren pareta', tone: 'jatorria', w: 0.95 },
      { label: 'Zelulak', tone: 'jatorria', w: 1.05 },
      { label: 'Zer egiten dute', tone: 'aldaketa', w: 1 },
      { label: 'Helmuga', tone: 'kokapena', w: 1.05 },
      { label: 'Eratorriak', tone: 'muskulua', w: 1.25 },
    ],
    rows: [
      r([c('Atzeko pareta', { span: 3, note: 'dermomiotoma' }), 'Erdiko zelulak', 'Lekuan geratu', 'Dermatoma', c('Larruazaleko dermisa')]),
      r([null, c('Ertzetako zelulak', { note: 'atze-erdikoak + aurre-albokoak' }), c('Bentralera migratu', { move: true }), c('Miotoma', { note: 'domeinu primaxiala' }), c('Bizkarreko muskuluak · eskapula ingurukoak · saihets artekoak')]),
      r([null, 'Aurre-alboko zelula batzuk', c('Alboko muga gurutzatu', { move: true }), c('Paretako orria', { note: 'domeinu abaxiala' }), c('Gorputz-paretako eta gorputz-adarretako muskuluak')]),
      r([c('Aurreko eta erdiko paretak', { span: 2 }), 'Esklerotoma', c('Erdira migratu', { move: true, note: 'hodi neurala eta notokorda inguratu' }), 'Ardatza', 'Ornoak']),
      r([null, 'Esklerotoma batzuk', c('Alboko muga gurutzatu', { move: true }), 'Paretako orria', 'Saihets-kartilagoak']),
    ],
    pitfalls: [
      'Muskulu-zelulak beti somitetatik datoz; paretako orriak ehun konektibozko patroia ematen du gorputzean.',
      'Mioblastoak fusionatu → nukleo ugariko zuntzak (ildaskatua). Bihotzean ez dira fusionatzen.',
    ],
  },
  {
    id: 'domeinua-inerbazioa',
    week: 9,
    section: '2.2.1 · 2.2.2',
    title: 'Jatorria (domeinua) ≠ inerbazioa (nerbio espinalaren adarra)',
    lead: 'Bizkarreko muskulu sakonak bakarrik atzeko adarrarekin (epaxialak); gainerako guztiak aurreko adarrarekin (hipaxialak), domeinua edozein dela ere.',
    stage: 'domeinuak',
    path: false,
    columns: [
      { label: 'Eskualdea', tone: 'kokapena', w: 0.8 },
      { label: 'Muskuluak', tone: 'muskulua', w: 1.6 },
      { label: 'Domeinua (jatorria)', tone: 'jatorria', w: 0.95 },
      { label: 'Adarra (inerbazioa)', tone: 'nerbioa', w: 1 },
      { label: 'Izena', tone: 'neutral', w: 0.7 },
    ],
    rows: [
      r([c('Bizkarraren sakontasuna'), c('Bizkarrezurreko zutitzaileak', { note: 'muskulu autoktonoak, hedatzaileak' }), c('Primaxiala', { note: 'miotomatik' }), c('Atzeko adarra'), c('Epaxialak')], ['primaxiala']),
      r([c('Bizkarra, azalean'), c('Erronboideak · eskapularen jasotzailea · bizkarraldeko zabala', { note: 'goiko adarraren hurbilekoak; bizkarrera migratzen dute', move: true }), 'Primaxiala', c('Aurreko adarra', { span: 5, note: 'ia muskulu ildaskatu guztiak' }), c('Hipaxialak', { span: 5 })], ['primaxiala']),
      r([c('Lepoa', { span: 2 }), 'Eskalenoak · genihioideoak · ornoaurrekoak', 'Primaxiala', null, null], ['primaxiala']),
      r([null, 'Hioide azpikoak', 'Abaxiala', null, null], ['abaxiala']),
      r([c('Toraxa eta abdomena', { span: 2 }), c('Saihets artekoak', { note: 'inerbazio metamerikoa (segmentarioa)' }), 'Primaxiala', null, null], ['primaxiala']),
      r([null, c('Pektoralak · bularrezur giharra · abdomeneko gehienak · azpil-diafragma', { note: 'kanpoko eta barruko laprana, zeharkakoa' }), 'Abaxiala', null, null], ['abaxiala']),
      r([c('Gorputz-adarrak'), c('Berezko muskulu guztiak', { note: 'goikoa: urrutikoak · behekoa: ez dago hain argi' }), 'Abaxiala', c('Aurreko adarrak → nerbio-sareak', { note: 'goikoa: erradiala, ertaina, kubitala · behekoa: femorala, ziatikoa, bultzatzailea' }), c('Hipaxialak')], ['abaxiala']),
    ],
    filters: [
      { tag: 'primaxiala', label: 'Primaxiala', tone: 'jatorria' },
      { tag: 'abaxiala', label: 'Abaxiala', tone: 'kokapena' },
    ],
    pitfalls: [
      'Inerbazioak ez du jatorriarekin zerikusirik: aurreko adarrak domeinu primaxialeko zein abaxialeko muskuluak inerbatzen ditu.',
      'Ez nahastu nerbio espinalaren aurreko eta atzeko adarrak (primarioak) ornomuinaren aurreko eta atzeko sustraiekin.',
      'Gorputz-adarretan: behekoan tolestatzailea aurrean eta hedatzailea atzean; goikoan alderantziz.',
      'Buru eta lepoko muskulu batzuek nerbio kranealak dituzte, ez espinalak (aurreko eskema).',
    ],
  },
  {
    id: 'miokardioa-eroapena',
    week: 9,
    section: '4',
    title: 'Bihotzeko muskulua: eroapen-sistema, kinadaren bidean',
    lead: 'Zuntz muskular oso espezializatuak, ez nerbio-ehuna: kinada sortu eta zelula muskularretara eramaten dute.',
    stage: 'bihotz-muskulua',
    path: true,
    columns: [
      { label: 'Sortu', tone: 'muskulua' },
      { label: 'Aurikulan zehar', tone: 'muskulua' },
      { label: 'Atzeratu', tone: 'muskulua' },
      { label: 'Bentrikuluetara', tone: 'muskulua' },
      { label: 'Paretara', tone: 'muskulua' },
    ],
    rows: [
      r([c('Nodulu sinusala', { note: 'eskuineko aurikula · markapasoa' }), c('Noduluen arteko traktuak'), c('Nodulu aurikulobentrikularra', { note: 'aurikularen behealdean' }), c('His faszikulua', { note: 'eskuineko eta ezkerreko adarrak' }), c('Purkinje sarea', { note: 'endokardio azpian' })]),
    ],
    pitfalls: [
      'Barneko inerbazioa = eroapen-sistema. Kanpokoa = begetatiboa (sinpatikoa + parasinpatikoa), erregulatzeko soilik.',
      'Miokardioa errai-orritik (bihotz-hodien inguruan); ildaskatua da baina mioblastoak ez dira fusionatzen.',
    ],
  },

  // ——— 12. gaia: arteriak, 2.4–2.7 ———
  {
    id: 'beste-aldaketak',
    week: 12,
    section: '2.4',
    title: 'Lau aldaketa gehiago: zer desagertzen, zer luzatzen, zer mugitzen den',
    lead: 'Arkuen aldaketez gain, lau gertaera hauek ematen diote arteria helduen forma behin betikoa.',
    stage: 'beste-aldaketak',
    path: true,
    columns: [
      { label: 'Egitura', tone: 'arteria', w: 1 },
      { label: 'Non', tone: 'kokapena', w: 1.25 },
      { label: 'Zer gertatzen da', tone: 'aldaketa', w: 0.8 },
      { label: 'Ondorioa', tone: 'ondorioa', w: 1.6 },
    ],
    rows: [
      r([c('1 · Hodi karotideoak'), c('Aorta dortsalak, III. eta IV. arkuen artean', { note: 'bi aldeetan' }), c('Desagertu', { gone: true }), c('Karotidak (3. arkua) aparte geratzen dira 4. arkuaren eratorrietatik', { note: 'aorta dortsalaren goiko zatia → barneko karotidaren urrutikoa' })]),
      r([c('2 · Eskuineko aorta dortsalaren zati bat'), c('Eskuineko 7. lepoko segmentu arteko arteriaren eta aorta dortsal komunaren artean'), c('Desagertu', { gone: true }), c('Beheranzko aorta ezkerreko aorta dortsaletik bakarrik', { note: 'eskuineko aorta dortsalaren gainerakoa → eskuineko subklabioaren bitarteko zatia' })]),
      r([c('3 · Bihotza'), c('Lepotik torax-barrunbeko perikardiora', { note: 'enbrioiaren tolespenak' }), c('Jaitsi', { move: true }), c('Karotida komunak eta arteria brakiozefalikoa asko luzatzen dira')]),
      r([c('4 · Ezkerreko subklabioaren jatorria'), c('Ezkerreko 7. lepoko segmentu arteko arteria', { note: 'hasieran beheranzko aortatik' }), c('Gora mugitu', { move: true }), c('Aortaren makotik zuzenean irteten da, ezkerreko karotida komunetik gertu')]),
    ],
    pitfalls: [
      'Ezkerreko subklabioa ez dator 4. arkutik: 7. segmentu arteko arteria da, eta gora mugitzen da.',
      'Eskuineko 4. arkua → eskuineko subklabioaren hasiera. Ezkerreko 4. arkua → makoaren urrutiko zatia.',
      'Beheranzko aorta = ezkerreko aorta dortsala (T4tik behera bi aorta dortsalak fusionatuta).',
    ],
  },
  {
    id: 'nerbio-atzerakariak-alderaketa',
    week: 12,
    section: '2.4',
    title: 'Nerbio laringeo atzerakariak: zergatik dago eskuinekoa gorago',
    lead: 'Biak X bagotik irten eta 6. arkuaren azpitik pasatzen dira. Arterien aldaketek erabakitzen dute non geratzen den bakoitza.',
    stage: 'nerbio-atzerakariak',
    path: false,
    columns: [
      { label: 'Urratsa', tone: 'neutral', w: 0.75 },
      { label: 'Eskuinean', tone: 'nerbioa', w: 1.1 },
      { label: 'Ezkerrean', tone: 'nerbioa', w: 1.1 },
    ],
    rows: [
      r(['Nerbioa', c('X bagoa → eskuineko n. laringeo atzerakaria'), 'X bagoa → ezkerreko n. laringeo atzerakaria']),
      r(['Hasieran', c('6. arkuaren azpitik', { cols: 2, note: 'bi aldeetan berdin' }), null]),
      r(['6. arkuaren urrutiko zatia', c('Desagertu', { gone: true }), c('Mantendu → hodi arteriosoa')]),
      r(['5. arkua', c('Ez da garatzen', { gone: true, cols: 2 }), null]),
      r(['Ondorioz', c('Gora igotzen da, hurrengo arkura (4.a)', { move: true }), 'Behean geratzen da']),
      r(['Helduan inguratzen du', c('Eskuineko subklabioaren hasierako zatia', { note: 'eskuineko 4. arkua' }), c('Lotailu arteriosoa', { note: 'hodi arteriosoa jaio ondoren · makoaren azpian' })]),
      r(['Gero', c('Arteriaren azpitik bira egin eta laringerantz igo', { move: true, cols: 2 }), null]),
      r(['Inerbatzen du', c('Laringeko muskulu intrintsekoak, krikotiroideoa izan ezik', { cols: 2, note: '6. arkuko muskuluak' }), null]),
    ],
    pitfalls: [
      'Goiko n. laringeoa (4. arkua) → krikotiroideoa. Atzerakaria (6. arkua) → laringeko gainerako muskulu intrintsekoak. Biak X bagoaren adarrak.',
      '«Atzerakaria» deitzen da: behera jaitsi, arteria baten azpitik bira egin eta laringerantz gora itzultzen delako.',
    ],
    links: [{ href: '/eratorriak#a9-eskemak', label: 'Arku bakoitzaren muskuluak eta nerbioak: 9. gaia' }],
  },
  {
    id: 'arteria-helduak',
    week: 12,
    section: '2.2–2.4 (laburpena)',
    title: 'Arteria helduak: zati bakoitza nondik dator',
    lead: 'Apunteen 2.4ko amaierako laburpena, zatika. Hautatu jatorri bat haren eratorri guztiak ikusteko.',
    stage: 'aorta-heldua',
    path: false,
    columns: [
      { label: 'Taldea', tone: 'neutral', w: 0.75 },
      { label: 'Arteria heldua', tone: 'arteria', w: 1.15 },
      { label: 'Jatorri enbrionarioa', tone: 'jatorria', w: 1.5 },
    ],
    rows: [
      r([c('Aorta', { span: 4 }), 'Goranzko aorta', 'Enbor arteriosoa (trenkadatua) + aorta-zakua'], ['enbor']),
      r([null, 'Makoa: hasierako zatia', 'Aorta-zakuaren ezkerreko luzapena (lodiagoa)'], ['enbor']),
      r([null, c('Makoa: urrutiko zatia', { note: 'ezkerreko karotida komunaren eta ezkerreko subklabioaren artean' }), 'Ezkerreko 4. arkua'], ['4']),
      r([null, 'Beheranzko aorta', c('Ezkerreko aorta dortsala', { note: 'T4tik behera bi aorta dortsalak fusionatuta' })], ['dortsala']),
      r([c('Makoaren adarrak', { span: 5, note: 'eskuinetik ezkerrera' }), 'Enbor brakiozefalikoa', c('Aorta-zakuaren eskuineko luzapena (estuagoa)', { note: 'bakarra da: ez dago eskuinekoa / ezkerrekoa' })], ['enbor']),
      r([null, c('Eskuineko karotida komuna', { note: 'enbor brakiozefalikotik' }), 'Eskuineko 3. arkua'], ['3']),
      r([null, c('Eskuineko subklabioa', { note: 'enbor brakiozefalikotik' }), c('Hiru zati: eskuineko 4. arkua (hurbilekoa) + eskuineko aorta dortsala (bitartekoa) + eskuineko 7. segmentu arteko arteria (urrutikoa)')], ['4', 'dortsala', '7']),
      r([null, 'Ezkerreko karotida komuna', 'Ezkerreko 3. arkua'], ['3']),
      r([null, 'Ezkerreko subklabioa', c('Ezkerreko 7. lepoko segmentu arteko arteria', { note: 'gora mugitzen da makora', move: true })], ['7']),
      r([c('Karotidak', { span: 2 }), 'Barneko karotida', c('Hurbilekoa: 3. arkua · urrutikoa: aorta dortsala', { note: '3. arkuaren gainetik' })], ['3', 'dortsala']),
      r([null, 'Kanpoko karotida', 'Karotida komunaren kimua'], ['3']),
      r([c('Birika', { span: 4 }), 'Birika-enborra', 'Enbor arteriosoa (trenkadatua)'], ['enbor']),
      r([null, 'Eskuineko birika-arteria', c('Eskuineko 6. arkuaren hurbilekoa + hasierako birika-arteria', { note: 'urrutikoa desagertzen da' })], ['6']),
      r([null, 'Ezkerreko birika-arteria', 'Ezkerreko 6. arkuaren hurbilekoa + hasierako birika-arteria'], ['6']),
      r([null, c('Hodi arteriosoa → lotailu arteriosoa', { note: 'jaio ondoren' }), 'Ezkerreko 6. arkuaren urrutikoa'], ['6']),
      r([c('Hondarrak', { span: 3 }), 'Arteria maxilarra', '1. arkua'], ['1-2']),
      r([null, 'Hioide azpiko eta ointokiko arteriak', '2. arkua'], ['1-2']),
      r([null, c('Ezer ez', { gone: true }), c('5. arkua', { gone: true })], ['1-2']),
    ],
    filters: [
      { tag: '1-2', label: '1., 2. eta 5. arkuak' },
      { tag: '3', label: '3. arkua' },
      { tag: '4', label: '4. arkua' },
      { tag: '6', label: '6. arkua' },
      { tag: 'enbor', label: 'Enbor arteriosoa / aorta-zakua' },
      { tag: 'dortsala', label: 'Aorta dortsalak' },
      { tag: '7', label: '7. segmentu artekoa' },
    ],
    pitfalls: [
      'Eskuinean enbor komun bat (brakiozefalikoa); ezkerrean karotida komuna eta subklabioa makotik zuzenean.',
      'Eskuineko subklabioak hiru jatorri ditu; ezkerrekoak bakarra (7. segmentu artekoa).',
    ],
  },
  {
    id: 'beheranzko-aorta-adarrak',
    week: 12,
    section: '2.5',
    title: 'Beheranzko aorta: hiru adar-multzo, hiru paretatik',
    lead: 'Aurreko paretatik heste-eratorrietara, alboetatik abdomeneko erraietara, atze-alboetatik somiten artera (maila guztietan, bi aldeetan).',
    stage: 'adar-bentralak',
    path: true,
    columns: [
      { label: 'Adar-multzoa', tone: 'arteria', w: 1 },
      { label: 'Aortaren pareta', tone: 'kokapena', w: 0.7 },
      { label: 'Maila', tone: 'kokapena', w: 0.6 },
      { label: 'Arteriak', tone: 'arteria', w: 1.35 },
      { label: 'Irrigatzen du', tone: 'ondorioa', w: 1.15 },
    ],
    rows: [
      r([c('Aurreko errai-adarrak', { span: 4, note: 'bentralak · hasieran bitelo-arteriak' }), c('Aurrekoa', { span: 4 }), 'Toraxa', '5 bikote', 'Hestegorria'], ['aurrekoak']),
      r([null, null, c('Abdomena', { span: 3 }), 'Enbor zeliakoa', c('Aurreko hestea', { note: '+ gibela, area, barea' })], ['aurrekoak']),
      r([null, null, null, 'Goiko arteria mesenterikoa', c('Bitarteko hestea', { note: 'duodeno distala eta hesteen bi heren' })], ['aurrekoak']),
      r([null, null, null, 'Beheko arteria mesenterikoa', c('Atzeko hestea', { note: 'azken herena' })], ['aurrekoak']),
      r([c('Alboko errai-adarrak', { span: 4 }), c('Albokoa', { span: 4 }), c('Abdomena', { span: 4 }), c('Erdiko giltzurrun-gaineko arteriak', { note: 'adrenalak' }), 'Giltzurrun-gaineko guruinak'], ['albokoak']),
      r([null, null, null, 'Giltzurrun-arteriak', 'Giltzurrunak'], ['albokoak']),
      r([null, null, null, c('Arteria gonadalak', { note: 'barrabiletakoak luzeagoak, beherago daudelako' }), 'Obulutegiak / barrabilak'], ['albokoak']),
      r([null, null, null, 'Beheko diafragma-arteriak', 'Diafragmaren beheko aurpegia'], ['albokoak']),
      r([c('Atze-alboko adarrak', { span: 4, note: 'segmentu artekoak: somiten artean · bikoitiak · maila guztietan' }), c('Atze-albokoa', { span: 4 }), 'Lepoa', c('Subklabioak (7. maila) · luzetarako anastomosiak →', { note: 'orno-arteriak, lepoko sakonak, goranzkoa, titikoak, epigastrikoak' }), c('Bizkarreko muskuluak, orno-muina, larruazala', { span: 4 })], ['atzekoak']),
      r([null, null, 'Toraxa', 'Saihets arteko arteriak', null], ['atzekoak']),
      r([null, null, 'Gerria', c('Arteria lunbarrak', { note: 'gerriko V.etik: iliako primitiboak' }), null], ['atzekoak']),
      r([null, null, 'Sakroa', 'Alboko arteria sakroak', null], ['atzekoak']),
    ],
    filters: [
      { tag: 'aurrekoak', label: 'Aurrekoak' },
      { tag: 'albokoak', label: 'Albokoak' },
      { tag: 'atzekoak', label: 'Atze-albokoak' },
    ],
    pitfalls: [
      'Hiru heste-atal, hiru arteria: zeliakoa → aurreko hestea · goiko mesenterikoa → bitartekoa · beheko mesenterikoa → atzekoa.',
      'Anastomosia = hodien arteko konexioa. Lepoan segmentu arteko batzuek aortarekiko lotura galtzen dute → orno-arteria eta besteak.',
      'Ez ahaztu: 7. mailako segmentu arteko arteriek subklabioak eratzen dituzte (2.3–2.4).',
    ],
  },
  {
    id: 'zilbor-iliakoak',
    week: 12,
    section: '2.6',
    title: 'Zilborreko arteriak eta iliakoak: bigarren konexioa eta jaiotza',
    lead: 'Zilborreko arteriek aortarekiko lotura galtzen dute eta barneko iliakoari lotzen zaizkio; jaio ondoren ixten dira.',
    stage: 'zilbor-iliakoak',
    path: true,
    columns: [
      { label: 'Hasieran', tone: 'jatorria', w: 1.15 },
      { label: 'Garapenean', tone: 'aldaketa', w: 1.1 },
      { label: 'Helduan', tone: 'arteria', w: 1.25 },
      { label: 'Irrigatzen du', tone: 'ondorioa', w: 1.1 },
    ],
    rows: [
      r([c('Zilborreko arteriak', { span: 2, note: 'aorta dortsalaren aurreko paretatik, sakro mailan → karenara odol desoxigenatua' }), c('Aortarekiko lotura galdu → barneko iliakoari lotu', { span: 2, note: 'bigarren konexioa', move: true }), c('Hurbileko zatia → goiko gernu-maskuriaren arteria'), 'Gernu-maskuria']),
      r([null, null, c('Urrutiko zatia → erdialdeko zilbor-lotailuak', { note: 'jaio ondoren itxi', gone: true }), c('—')]),
      r([c('Gerriko V. segmentu arteko arteria', { span: 2 }), c('Arteria iliako primitiboak', { span: 2, note: 'ezkerrean eta eskuinean' }), c('Kanpoko iliakoa → arteria femorala', { note: 'iztai-lotailuaren azpitik' }), c('Beheko gorputz-adarra', { note: 'ipurmasaila izan ezik' })]),
      r([null, null, 'Barneko iliakoa', c('Pelbiseko organoak eta ipurmasaila', { note: 'gernu-maskuria, umetokia, bagina' })]),
    ],
    pitfalls: [
      'Helduan zilborreko arteriak barneko iliakotik irteten dira, ez aortatik.',
      'Arteria femorala = kanpoko iliakoaren jarraipena iztai-lotailuaren azpitik.',
    ],
  },
  {
    id: 'gorputz-adarren-arteriak',
    week: 12,
    section: '2.7',
    title: 'Gorputz-adarrak: ardatz-arteria konektatu egiten da, ez da eratortzen',
    lead: 'Apunteen arabera atal hau ez da xehetasunez jakin beharra; gogoratu konexioa.',
    stage: 'gorputz-adarrak',
    path: true,
    optional: true,
    columns: [
      { label: 'Gorputz-adarra', tone: 'kokapena', w: 0.8 },
      { label: 'Ardatz-arteriatik', tone: 'arteria', w: 1.3 },
      { label: 'Konektatzen da', tone: 'aldaketa', w: 0.9 },
      { label: 'Gehienak nondik', tone: 'jatorria', w: 1 },
    ],
    rows: [
      r(['Goikoa', 'Brakiala · hezur artekoa · eskuaurreko arku sakona · kubitala · erradiala', 'Subklabioarekin', c('Ardatz-arteriatik', { note: 'subklabiotik ez: konektatu bakarrik' })]),
      r(['Behekoa', 'Ziatikoa · popliteoa · peroneoaren zati bat', c('Iliakoarekin', { note: '2.7.2ko testuak barnekoa dio; amaierako laburpenak kanpokoa' }), c('Arteria femoraletik', { note: 'kanpoko iliakoaren jarraipena' })]),
    ],
  },
];

export const gridSchemesFor = (week: number) => GRID_SCHEMES.filter((s) => s.week === week);
