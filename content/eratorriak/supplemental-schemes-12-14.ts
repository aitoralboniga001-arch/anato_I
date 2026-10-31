import type { Flow, MigrationTopic, MNode } from '../migrations';
import { REFERENCE_TABLES } from './reference-tables';

/** Shared, source-backed relationships presented as trees as well as quick tables.
 * The incoming label distinguishes a relationship from a developmental derivative.
 * Sources remain on the owning reference rows rather than being copied here.
 */
const stageByTable: Record<string, string> = {
  'arku-aortikoak': 'beste-aldaketak',
  'arteria-konexioak': 'nerbio-atzerakariak',
  'faringe-poltsak': 'arku-sistema',
  'faringe-arkuak-eta-mintzak': 'arku-sistema',
  'aurpegia-eta-mihia': 'arku-sistema',
  'zain-sistemen-eratorriak': 'zain-nagusiak',
  'beheko-kabaren-atalak': 'beheko-kaba',
  'fetuaren-zirkulazioa': 'jaio-aurretik',
  'jaiotzako-aldaketak': 'jaiotza',
  'hesteen-eratorriak': 'heste-atalak',
  'heste-lakioa': 'heste-atalak',
  'mesogastrioen-eratorriak': 'mesenterioa',
  'poltsa-omentala': 'mesenterioa',
};

function relationships(week: number): Flow[] {
  return REFERENCE_TABLES.filter((table) => table.topic === week && stageByTable[table.id]).map((table) => ({
    id: `erlazioak-${table.id}`,
    title: table.title,
    lead: table.lead ?? `${table.originHeading} → ${table.derivativeHeading}. Geziaren «erlazioa» etiketak lotura anatomikoa adierazten du; ez beti egitura bat beste bihurtzea.`,
    stage: stageByTable[table.id],
    roots: table.rows.map((row) => ({
      label: row.origin,
      kids: [{ label: row.derivative, note: row.note, via: 'erlazioa' }],
    })),
  }));
}

const l = (label: string, kids?: MNode[], extra?: Omit<MNode, 'label' | 'kids'>): MNode => ({ label, kids, via: 'erlazioa', ...extra });

const digestiveProcesses: Flow[] = [
  {
    id: 'digestio-egituren-kokapena', title: 'Digestio-egiturak kokapenaren arabera bereiztu', stage: 'mesenterioa',
    roots: [
      l('Porta zaina', [l('Hesteetatik gibelera doan zaina', undefined, { via: 'ezaugarriak', note: 'Gibelaren atarian; lotailu hepatoduodenalean, arteria eta koledokoaren atzean' })]),
      l('Koledokoa', [l('Gibel-hodi komuna + hodi zistikoa', [l('Duodenora eramaten du behazuna', undefined, { note: 'Ez nahasi zain urdin batekin; behazun-maskuriarekin eta duodenoarekin jarraitasuna du' })])]),
      l('Enbor zeliakoa', [l('Abdomeneko aortaren aurreko adar laburra', undefined, { via: 'ezaugarriak', note: 'Ezkerreko gastrikoa, esplenikoa eta gibel-arteria komuna ematen ditu' })]),
      l('Lotailu esplenoerrenala', [l('Barea ↔ atzeko pareta / ezkerreko giltzurrun-eskualdea', undefined, { via: 'lotura', note: 'Bareko hodiak eta arearen buztana; gastrolienalak, aldiz, barea eta urdaila lotzen ditu' })]),
      l('Arearen hastapen dortsala', [l('Duodenoaren atzeko paretatik mesoduodeno dortsalean', undefined, { via: 'kokapena' })]),
      l('Arearen hastapen bentrala', [l('Behazun-hodiaren sarreratik hurbil, duodenoaren aurreko aldean', undefined, { via: 'kokapena' })]),
      l('Kloaka', [l('Atzeko hestearen amaierako barrunbea, alantoidearekin lotuta', [l('Aurrean sinu urogenitala; atzean kanal anorektala', undefined, { via: 'septum urorektalak banatu' })])]),
      l('Poltsa omentala', [l('Urdailaren atzean dagoen espazioa', undefined, { via: 'kokapena', note: 'Ezkerrean barea eta haren lotailuak; eskuinean Winslow zulotik barrunbe nagusira' })]),
    ],
  },
  {
    id: 'heste-hodiaren-eraketa', title: 'Tolespenak → heste-hodia eta haren pareta', stage: 'sarrera',
    lead: 'Endodermoak epitelioa ematen du; inguruko errai mesodermoak ehun konektiboa eta muskulu leuna. Barea mesodermikoa da.',
    roots: [
      l('Endodermoa eta bitelo-zakuaren zati bat', [l('Heste-hodia', [l('Digestio-hodiko epitelioa eta guruin-parenkima')], { via: 'zeharkako eta zefalokaudal tolespenak' })]),
      l('Errai mesodermoa', [l('Hestearen ehun konektiboa eta muskulu leuna')]),
      l('Mesogastrio dortsaleko mesenkima', [l('Barea', undefined, { note: 'Ez da heste-endodermoaren eratorria' })]),
    ],
  },
  {
    id: 'digestio-arterien-lurraldeak', title: 'Hiru heste-lurralde → hiru arteria', stage: 'zirkulazioa',
    roots: [
      l('Aurreko hestearen abdomeneko eratorriak', [l('Enbor zeliakoa', undefined, { via: 'irrigazioa' })]),
      l('Bitarteko hestearen eratorriak', [l('Goiko arteria mesenterikoa', undefined, { via: 'irrigazioa', note: 'Lakioaren biraketa-ardatza ere bada' })]),
      l('Atzeko hestearen eratorriak', [l('Beheko arteria mesenterikoa', undefined, { via: 'irrigazioa' })]),
    ],
  },
  {
    id: 'urdailaren-biraketa', title: 'Urdailaren bi biraketak eta mesogastrioak', stage: 'mesenterioa',
    lead: 'Urdailaren hazkundeak eta biraketek kurbadurak, aurpegiak eta poltsa omentala antolatzen dituzte.',
    roots: [
      l('Aurreko hesteko zabalkuntza', [l('Urdaila', [
        l('Ezkerreko pareta → aurreko aurpegia; eskuinekoa → atzeko aurpegia', undefined, { via: '90° luzetarako biraketa' }),
        l('Hasierako atzeko ertza → ezkerreko kurbadura handia; aurrekoa → eskuineko kurbadura txikia'),
        l('Piloroa gora eta eskuinera; kardia ezkerrera', undefined, { via: 'ardatz anteroposteriorreko biraketa' }),
      ])]),
      l('Mesogastrio dortsala', [l('Ezkerrera eta beherantz hedatzen da', [l('Urdailaren atzean poltsa omentala'), l('Epiploi handia', [l('Zeharkako kolonaren mesoarekin fusionatu', undefined, { via: 'atzeko geruzak' })])], { move: true })]),
      l('Mesogastrio bentrala', [l('Epiploi txikia eta lotailu faltziformea')]),
    ],
  },
  {
    id: 'lakioaren-ibilbidea', title: 'Heste-lakioa: irten, biratu, itzuli eta finkatu', stage: 'heste-atalak',
    lead: 'Aurretik ikusita biraketa erloju-orratzen aurkakoa da; adar kaudala ez da atzeko hestearen sinonimoa.',
    roots: [l('Bitarteko hestea', [l('Hasierako heste-lakioa', [
      l('Adar zefalikoa', [l('Duodeno distala, jejunoa eta ileonaren zati handiena')]),
      l('Adar kaudala', [l('Ileon distala, zekua, apendizea, goranzko kolona eta zeharkako kolonaren hurbileko 2/3ak')]),
      l('Hernia fisiologikoa', [l('90° biraketa', [l('Abdomenera itzulera, 10. aste inguruan', [l('Beste 180°: guztira 270°'), l('Jejuno proximala lehena; zekuaren hastapena azkena', [l('Zekua gibel azpitik eskuineko hobi iliakora jaisten da', undefined, { move: true })])], { move: true })])], { move: true }),
    ], { note: 'Goiko arteria mesenterikoaren inguruan' })])],
  },
  {
    id: 'gibel-area-garapena', title: 'Aurreko hestearen kimuak: gibela, behazuna eta area', stage: 'heste-atalak',
    lead: 'Gibelaren eta arearen parenkima endodermotik dator; inguruko mesenkimak ehun konektiboa ematen du.',
    roots: [
      l('Aurreko hestearen aurreko pareta', [l('Gibel-dibertikulua', [l('Septum transversumeko mesenkiman hazten da', [l('Gibel-parenkima eta gibel barruko behazun-bideak')], { move: true }), l('Behazun-maskuria eta hodi zistikoa')])]),
      l('Duodenoaren endodermoa', [l('Arearen hastapen dortsala'), l('Arearen hastapen bentrala', [l('Duodenoarekin atzerantz biratzen da', [l('Dortsalarekin fusionatu → area', undefined, { note: 'Bentrala: prozesu unzinatua eta buruaren beheko osagaia; dortsala: gainerakoa' })], { move: true })])]),
      l('Duodenoaren eta arearen hasierako mesoa', [l('Atzeko paretako peritoneoarekin fusionatu', [l('Bigarren mailako peritoneo atzeko kokapena', undefined, { note: 'Arearen buztana salbuespena izan daiteke' })])]),
    ],
  },
];

export const SUPPLEMENTAL_12_14: MigrationTopic[] = [
  { week: 12, short: 'Arteriak', flows: [...relationships(12), {
    id: 'ahosabaiaren-garapena', title: 'Ahosabai primarioa eta bi gandor palatinoak', stage: 'arku-sistema',
    lead: 'Sudur-prozesu medialek erdiko segmentua ematen dute; prozesu maxilarrek alboko bi gandorrak.',
    roots: [
      l('Sudur-prozesu medialak', [l('Segmentu intermaxilarra', [l('Filtruma'), l('Ahosabai primarioa', undefined, { note: 'Foramen intzisiboaren aurrean dagoen zati triangeluarra' })])]),
      l('Bi prozesu maxilarrak', [l('Bi gandor palatino', [l('Hasieran mihiaren alboetan bertikalak', [l('Mihiaren gainera horizontalki igotzen dira', [l('Erdian elkarrekin eta aurrean ahosabai primarioarekin fusionatu', [l('Ahosabai sekundarioa', undefined, { note: 'Foramen intzisiboaren atzeko ahosabai gogorra eta biguna' })])], { move: true })])])]),
      l('Enbor brakiozefalikoa', [l('Aorta-makoaren lehen adarra, eskuinean', [l('Eskuineko karotida komuna + eskuineko subklabioa', undefined, { via: 'bitan banatu' })], { via: 'kokapena' })]),
    ],
  }, {
    id: 'atzerakariaren-erlazio-heldua', title: 'Ezkerreko nerbio atzerakaria: hodi arteriosoa eta aorta-makoa', stage: 'nerbio-atzerakariak',
    lead: 'Enbrioiko aingura eta helduko topografia batera ulertu behar dira.',
    roots: [l('Ezkerreko nerbio laringeo atzerakaria', [l('Ezkerreko 6. arkuaren urrutiko atalaren azpian geratzen da', [l('Hodi arteriosoa → lotailu arteriosoa', [l('Helduan aorta-makoaren azpitik itzultzen da, lotailu arteriosoaren ondoan', undefined, { via: 'erlazio topografikoa' })])])])],
  }, {
    id: 'mihi-motorearen-jatorria', title: 'Mihiaren muskuluak eta nerbio motorra', stage: 'arku-sistema',
    roots: [l('Somita okzipitaletako mioblastoak', [l('Mihiaren muskulu gehienak', [l('XII · nerbio hipoglosoa', undefined, { via: 'inerbazio motorra' })], { move: true })]), l('Muskulu palatoglosoa', [l('X · bagoa, faringe-plexuaren bidez', undefined, { via: 'salbuespen motorra' })])],
  }] },
  { week: 13, short: 'Zainak', flows: relationships(13) },
  { week: 14, short: 'Digestioa', flows: [...digestiveProcesses, ...relationships(14)] },
];
