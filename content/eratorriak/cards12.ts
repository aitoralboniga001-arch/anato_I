/**
 * Topic 12 flashcards (Eratorriak page): one fact each, in the notes' words. Cards with `keys` show the
 * arch diagram on their back with those pieces lit, at `stage` (default: the adult pattern).
 */
export type CardTag = 'arkuak' | 'helduak' | 'desagertu' | 'nerbioak' | 'adarrak' | 'zilborra';

export interface Card {
  id: string;
  tag: CardTag;
  q: string;
  a: string;
  keys?: string[];
  stage?: number;
}

export const CARD_TAGS: { id: CardTag; label: string }[] = [
  { id: 'arkuak', label: 'Arkua → eratorria' },
  { id: 'helduak', label: 'Arteria heldua → jatorria' },
  { id: 'desagertu', label: 'Desagertzen direnak' },
  { id: 'nerbioak', label: 'Nerbio atzerakariak' },
  { id: 'adarrak', label: 'Beheranzko aortaren adarrak' },
  { id: 'zilborra', label: 'Zilborra eta iliakoak' },
];

export const CARDS12: Card[] = [
  // ——— arch → derivative ———
  { id: 'a1', tag: 'arkuak', q: 'Zer geratzen da 1. aorta arkutik?', a: 'Arteria maxilarra (ia arku osoa desagertzen da).', keys: ['a1dR', 'a1dL'] },
  { id: 'a2', tag: 'arkuak', q: 'Zer geratzen da 2. aorta arkutik?', a: 'Hioide azpiko arteria eta ointoki hezurraren arteria.', keys: ['a2dR', 'a2dL'] },
  { id: 'a3', tag: 'arkuak', q: 'Zer sortzen da 3. aorta arkuetatik?', a: 'Karotida komunak eta barneko karotiden hurbileko zatia (bi aldeetan berdin).', keys: ['a3ccR', 'a3ccL', 'a3icaR', 'a3icaL'] },
  { id: 'a4l', tag: 'arkuak', q: 'Ezkerreko 4. arkua → ?', a: 'Aortaren makoaren urrutiko atala (ezkerreko karotida komunaren eta ezkerreko subklabioaren artekoa).', keys: ['a4L'] },
  { id: 'a4r', tag: 'arkuak', q: 'Eskuineko 4. arkua → ?', a: 'Eskuineko subklabioaren hasierako (hurbileko) atala.', keys: ['a4R'] },
  { id: 'a5', tag: 'arkuak', q: 'Zer sortzen du 5. aorta arkuak?', a: 'Ezer ez: guztiz desagertzen da (askotan ez da agertu ere egiten).', keys: ['a5R', 'a5L'], stage: 1 },
  { id: 'a6l', tag: 'arkuak', q: 'Ezkerreko 6. arkua → ?', a: 'Hurbilekoa (+ hasierako birika arteria) → ezkerreko birika arteria. Urrutikoa → hodi arteriosoa (jaio ondoren lotailu arteriosoa).', keys: ['a6pL', 'pulmL', 'a6dL'] },
  { id: 'a6r', tag: 'arkuak', q: 'Eskuineko 6. arkua → ?', a: 'Hurbilekoa (+ hasierako birika arteria) → eskuineko birika arteria. Urrutikoa desagertzen da.', keys: ['a6pR', 'pulmR', 'a6dR'], stage: 4 },
  { id: 'sac', tag: 'arkuak', q: 'Aorta zakua → ?', a: 'Goranzko aorta. Haren luzapenetatik, era ez simetrikoan: ezkerrekoa (lodiagoa) → makoaren hasierako zatia; eskuinekoa (estuagoa) → enbor brakiozefalikoa.', keys: ['sac', 'hornR', 'hornL'] },
  { id: 'truncus', tag: 'arkuak', q: 'Enbor arteriosoa trenkadaz banatzean?', a: 'Goranzko aorta (aortaren hasierako zatia) eta birika enborra.', keys: ['asc-aorta', 'pulm-trunk'], stage: 2 },
  { id: 'dacran', tag: 'arkuak', q: 'Aorta dortsalaren alde kraneala (3. arkuaren gainetik) → ?', a: 'Barneko karotidaren urrutiko atala.', keys: ['daCranR', 'daCranL'] },
  { id: 'is7', tag: 'arkuak', q: '7. segmentu arteko arteriak → ?', a: 'Ezkerrekoa: ezkerreko subklabioa osoa. Eskuinekoa: eskuineko subklabioaren urrutiko atala.', keys: ['is7R', 'is7L'] },
  { id: 'fuse', tag: 'arkuak', q: 'Non fusionatzen dira bi aorta dortsalak?', a: 'T4tik behera: aorta dortsal bakarra. Alde zefalikoan banatuta jarraitzen dute.', keys: ['fused', 'daLowR', 'daLowL'], stage: 0 },
  { id: 'order', tag: 'arkuak', q: 'Agertzen al dira 6 arku bikoteak aldi berean?', a: 'Ez: kronologikoki garatzen dira, arku faringeoekin batera, zefalikotik kaudalera.', stage: 0 },

  // ——— adult artery → origin ———
  { id: 'rsub', tag: 'helduak', q: 'Eskuineko subklabioa: zein hiru zatitatik?', a: '1) Eskuineko 4. arkua (hurbilekoa) · 2) eskuineko aorta dortsala (bitartekoa) · 3) eskuineko 7. segmentu arteko arteria (urrutikoa).', keys: ['a4R', 'daMidR', 'is7R'] },
  { id: 'lsub', tag: 'helduak', q: 'Ezkerreko subklabioa: nondik?', a: 'Osoa ezkerreko 7. segmentu arteko arteriatik; garapenean gorago kokatzen da eta makotik irteten da (ezk. karotidatik gertu).', keys: ['is7L'] },
  { id: 'ica', tag: 'helduak', q: 'Barneko karotida: zein bi zatitatik?', a: 'Hurbilekoa 3. arkutik; urrutikoa aorta dortsaletik (3. arkuaren gainetik).', keys: ['a3icaR', 'a3icaL', 'daCranR', 'daCranL'] },
  { id: 'eca', tag: 'helduak', q: 'Kanpoko karotida: nondik?', a: 'Karotida komunaren kimu (ebaginazio) bat da.', keys: ['ecaR', 'ecaL'] },
  { id: 'arch', tag: 'helduak', q: 'Aortaren makoa: zein bi zatitatik?', a: 'Hasierakoa aorta zakuaren ezkerreko luzapenetik; urrutikoa ezkerreko 4. arkutik.', keys: ['hornL', 'a4L'] },
  { id: 'bct', tag: 'helduak', q: 'Enbor brakiozefalikoa: nondik? Zenbat daude?', a: 'Aorta zakuaren eskuineko luzapenetik. BAKARRA dago (eskuinean); hortik eskuineko karotida komuna eta eskuineko subklabioa.', keys: ['hornR'] },
  { id: 'desc', tag: 'helduak', q: 'Beheranzko aorta: nondik?', a: 'Ezkerreko aorta dortsaletik eta T4tik behera fusionatutako aorta dortsal bakarretik.', keys: ['daMidL', 'daLowL', 'fused'] },
  { id: 'pa', tag: 'helduak', q: 'Birika arteriak: nondik?', a: '6. arkuaren hurbileko atala + arku horretan garatutako hasierako birika arteria, alde bakoitzean.', keys: ['a6pR', 'a6pL', 'pulmR', 'pulmL'] },
  { id: 'da', tag: 'helduak', q: 'Hodi arteriosoa: nondik eta zertarako?', a: 'Ezkerreko 6. arkuaren urrutiko atala: ezkerreko birika arteria aortarekin lotzen du (birika arteriako odola aortara). Jaio ondoren lotailu arteriosoa.', keys: ['a6dL'] },
  { id: 'branches', tag: 'helduak', q: 'Aortaren makoaren hiru adarrak, ordenan?', a: '1) Enbor brakiozefalikoa · 2) ezkerreko karotida komuna · 3) ezkerreko subklabioa.', keys: ['hornR', 'a3ccL', 'is7L'] },

  // ——— what goes ———
  { id: 'duct', tag: 'desagertu', q: 'Zer dira hodi karotideoak eta zer gertatzen zaie?', a: 'III. eta IV. arkuen arteko aorta dortsalaren atalak; desagertzen dira (karotidak eta makoa ez daude aorta dortsalaren bidez lotuta).', keys: ['daDuctR', 'daDuctL'], stage: 4 },
  { id: 'rlow', tag: 'desagertu', q: 'Zein aorta dortsal atal desagertzen da, eta ondorioz?', a: 'Eskuineko 7. segmentu arteko arteriaren eta aorta dortsal komunaren artekoa: beheranzko aorta ezkerreko aorta dortsaletik eratzen da.', keys: ['daLowR'], stage: 4 },
  { id: 'r6', tag: 'desagertu', q: 'Seigarren arkuaren zein zati desagertzen da?', a: 'Eskuineko 6. arkuaren urrutiko atala.', keys: ['a6dR'], stage: 3 },
  { id: 'long', tag: 'desagertu', q: 'Zergatik luzatzen dira karotida komunak eta enbor brakiozefalikoa?', a: 'Bihotza lepo eskualdetik torax barrunbera jaisten delako (eta lepoa eratzen delako).', keys: ['hornR', 'a3ccR', 'a3ccL'], stage: 4 },

  // ——— recurrent laryngeal nerves ———
  { id: 'n0', tag: 'nerbioak', q: 'Zein nerbiotik sortzen dira nerbio laringeo atzerakariak?', a: 'Nerbio bagotik (X. bikote kraneala, IV. eta VI. arkuekin erlazionatua); laringeko muskuluak inerbatzen dituzte.' },
  { id: 'nr', tag: 'nerbioak', q: 'Eskuineko nerbio atzerakaria: zer inguratzen du helduan, eta zergatik?', a: 'Eskuineko subklabioaren hasierako atala (4. arkua): 5. arkua ez da garatzen eta eskuineko 6.aren urrutikoa desagertzen da, beraz gorago igotzen da.', keys: ['a4R'] },
  { id: 'nl', tag: 'nerbioak', q: 'Ezkerreko nerbio atzerakaria: zer inguratzen du?', a: 'Ezkerreko 6. arkuaren urrutiko atala: hodi arteriosoa, jaio ondoren lotailu arteriosoa.', keys: ['a6dL'] },

  // ——— descending aorta branches ———
  { id: 'b3', tag: 'adarrak', q: 'Beheranzko aortaren adarren hiru taldeak?', a: 'Aurreko errai adarrak (bentralak) · alboko errai adarrak · atze-alboko adarrak (segmentu artekoak).' },
  { id: 'bv0', tag: 'adarrak', q: 'Nondik datoz aurreko errai adarrak?', a: 'Bitelo arterietatik (bitelo plexuak); bitelo zakua endekatzean beste arteria batzuk sortzen dituzte.' },
  { id: 'bvt', tag: 'adarrak', q: 'Aurreko errai adarrak torax mailan?', a: '5 arteria bikote, hestegorria irrigatzeko.' },
  { id: 'bvc', tag: 'adarrak', q: 'Enbor zeliakoa: zer irrigatzen du?', a: 'Aurreko hestea (barea, area eta gibela).' },
  { id: 'bvs', tag: 'adarrak', q: 'Goiko arteria mesenterikoa: zer irrigatzen du?', a: 'Bitarteko hestearen eratorriak (duodeno distala eta hesteen bi heren).' },
  { id: 'bvi', tag: 'adarrak', q: 'Beheko arteria mesenterikoa: zer irrigatzen du?', a: 'Atzeko hestearen eratorriak (azken herena).' },
  { id: 'bl', tag: 'adarrak', q: 'Alboko errai arteriak (abdomenean)?', a: 'Erdiko giltzurrun gaineko (adrenalak), giltzurrun arteriak, arteria gonadalak (obulutegikoak / barrabiletakoak, luzeagoak) eta beheko diafragma arteriak.' },
  { id: 'bp', tag: 'adarrak', q: 'Segmentu arteko arteriak mailaka?', a: 'Lepoa: subklabioen eraketa + luzetarako anastomosiak (orno arteriak…) · toraxa: saihets artekoak · gerria: lunbarrak · sakroa: alboko sakroak.' },
  { id: 'bpn', tag: 'adarrak', q: 'Zergatik deitzen dira "segmentu arteko" arteriak?', a: 'Somiten artean kokatzen direlako; maila guztietan, atze-alboko paretatik.' },
  { id: 'ver', tag: 'adarrak', q: 'Nola sortzen dira orno arteriak?', a: 'Lepoko segmentu arteko arterien arteko luzetarako anastomosietatik, horietako batzuek aortarekin duten konexioa galtzean.' },

  // ——— umbilical and iliac ———
  { id: 'u0', tag: 'zilborra', q: 'Nondik irteten dira zilborreko arteriak hasieran, eta zer daramate?', a: 'Aorta dortsalaren urrutiko ataletik (sakro mailan); oxigeno gutxiko odola karenara.' },
  { id: 'u1', tag: 'zilborra', q: 'Zilborreko arteriek zein arteriarekin konektatzen dute gero?', a: 'Barneko arteria iliakoarekin (aortarekiko kontaktua galtzen dute).' },
  { id: 'u2', tag: 'zilborra', q: 'Arteria iliako primitiboak: nondik?', a: 'Gerriko V. segmentu arteko arteriatik; bi adar: kanpoko eta barneko arteria iliakoa.' },
  { id: 'u3', tag: 'zilborra', q: 'Kanpoko arteria iliakoa → ?', a: 'Iztai lotailu azpitik pasatu ondoren arteria femorala: beheko gorputz adarreko ia guztia irrigatzen du (ipurmasaila izan ezik).' },
  { id: 'u4', tag: 'zilborra', q: 'Zilborreko arteriak jaio ondoren?', a: 'Urrutiko atala → erdialdeko zilbor lotailua. Hurbilekoa → goiko gernu maskuriaren arteria (barneko iliakotik).' },
  { id: 'limb', tag: 'zilborra', q: 'Gorputz adarretako arteriak: jakin beharrekoa?', a: 'Ardatz arteriek bertaraino iritsitako arteria subklabioekin (goian) edo kanpoko arteria iliakoarekin (behean) kontaktatzen dute.' },
];
