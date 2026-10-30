/**
 * Migrazioak eta bilakaerak: for topics 7 onwards, where each structure comes from, where it moves and
 * what it ends up as, drawn on the Eratorriak page as left-to-right schemes. Every flow follows the notes
 * (prose over tables) and the structures' own origin/fate fields; ids are checked by tests/migrations.test.ts.
 */
import { descendantsOf } from './lineage';

/** One box of a scheme: a structure id (or a plain label when the notes name no structure). */
export interface MNode {
  id?: string;
  label?: string;
  /** Short qualifier under the name ("eskuinekoa", "C3–C5"). */
  note?: string;
  /** What happens on the incoming arrow ("fusionatu", "jaiotzean itxi"). */
  via?: string;
  /** The incoming arrow is a real displacement: cells migrate or the structure moves (drawn dashed). */
  move?: boolean;
  /** It disappears: drawn muted and nothing follows it. */
  gone?: boolean;
  kids?: MNode[];
}

export interface Flow {
  id: string;
  title: string;
  /** One line from the notes that says what the scheme shows. */
  lead?: string;
  /** Stage of the topic where the simulator shows it. */
  stage: string;
  /** Trees drawn one under the other; with `join`, chains that converge into it. */
  roots: MNode[];
  join?: MNode;
  /** Process on the converging arrow. */
  joinVia?: string;
}

export interface MigrationTopic {
  week: number;
  short: string;
  flows: Flow[];
}

const n = (id: string, kids?: MNode[], extra?: Omit<MNode, 'id' | 'kids'>): MNode => ({ id, kids, ...extra });
const l = (label: string, kids?: MNode[], extra?: Omit<MNode, 'label' | 'kids'>): MNode => ({ label, kids, ...extra });

export const MIGRATIONS: MigrationTopic[] = [
  {
    week: 7,
    short: 'Barrunbeak',
    flows: [
      {
        id: 'zeloma-banatu',
        title: 'Enbrioi barruko zeloma: bat → lau barrunbe',
        lead: 'Septum transversumak zeloma bitan banatzen du; goiko atala gero pleura eta perikardio barrunbeetan banatzen da.',
        stage: 'septum-transversum',
        roots: [
          n('enbrioi-barruko-zeloma', [
            n('hasierako-perikardio-barrunbea', [
              n('pleura-barrunbea', undefined, { via: 'birika hastapenak sartu', note: 'atze-alboetan, bi' }),
              n('perikardio-barrunbea', undefined, { via: 'mintz pleuroperikardikoak', note: 'aurre erdian' }),
            ], { via: 'septum transversuma', note: 'goian' }),
            n('erreten-perikardioperitonealak', [l('Itxita', undefined, { via: 'mintz pleuroperitonealak', gone: true, note: '5. astea' })], { via: 'atze-alboetan' }),
            n('peritoneo-barrunbea', undefined, { via: 'septum transversuma', note: 'behean' }),
          ]),
        ],
      },
      {
        id: 'septum-jaitsi',
        title: 'Septum transversuma eta nerbio frenikoak jaisten dira',
        lead: 'Lepo mailan sortzen da; enbrioiaren hazkuntzarekin jaitsi egiten da eta nerbio frenikoak harekin luzatzen dira.',
        stage: 'diafragma-eraketa',
        roots: [
          n('septum-transversum', [l('T6 aurrean · T12 atzean', undefined, { via: 'jaitsi', move: true, note: '5. astearen bukaera' })], { note: 'C3–C5 maila, 4. astea' }),
          n('lepoko-nerbio-espinalak', [n('nerbio-frenikoa', [l('Septum transversumera iritsi', undefined, { via: 'luzatu', move: true })], { via: 'zuntzak elkartu' })], { note: 'aurreko adarrak' }),
        ],
      },
      {
        id: 'miozitoak-migratu',
        title: 'Septum transversumeko miozitoak migratzen dira',
        lead: 'Lepo mailan bereizitako miozitoek mintz pleuroperitonealetara migratzen dute, bertan zelula muskularrak sortzeko.',
        stage: 'diafragma-eraketa',
        roots: [
          n('septum-transversum', [n('mioblastoak', [n('miozitoak', [n('mintz-pleuroperitonealak', undefined, { via: 'migratu', move: true, note: 'zelula muskularrak' })])], { via: 'mesenkima' })]),
        ],
      },
      {
        id: 'diafragma',
        title: 'Diafragma: lau iturri, organo bat',
        lead: 'Lau osagaiak fusionatzen dira; bakoitzak diafragmaren atal jakin bat ematen du.',
        stage: 'diafragma-heldua',
        roots: [
          n('septum-transversum', [n('zentro-tendinosoa')]),
          n('mintz-pleuroperitonealak', undefined, { note: 'erreten perikardioperitonealak ixten' }),
          n('hestegorri-inguruko-mesenkima', [n('gerriko-atala', undefined, { note: 'bi zutabe' })]),
          n('gorputz-paretako-mesodermoa', [n('diafragmaren-alde-periferikoa')], { note: 'mesodermo paraxiala' }),
        ],
        join: n('diafragma'),
        joinVia: 'fusionatu',
      },
      {
        id: 'pleura-perikardio-orriak',
        title: 'Serosen orriak: paretakoa eta errai orria',
        lead: 'Barrunbe bakoitzean paretako orri bat eta errai orri bat bereizten dira; perikardio fibrosoa mintz pleuroperikardikoetatik dator.',
        stage: 'pleura-perikardioa',
        roots: [
          n('paretako-orria', [n('paretako-peritoneoa'), n('paretako-pleura'), n('perikardio-serosoa')], { note: 'somatopleura' }),
          n('errai-orria', [n('errai-peritoneoa'), n('errai-pleura', undefined, { via: 'birika hastapenek bultzatu', move: true })], { note: 'esplaknopleura' }),
          n('mintz-pleuroperikardikoak', [n('perikardio-fibrosoa', undefined, { via: 'erdiko mesenkima' })], { note: 'erdialdera abiatu, fusionatu' }),
        ],
      },
      {
        id: 'arnas-hastapena',
        title: 'Aurreko hestetik birikak',
        lead: 'Arnas hastapena aurreko hestearen aurreko paretatik ebaginatzen da; birika hastapenek hazten direnean pleura barrunbeak eratzen dituzte.',
        stage: 'pleura-perikardioa',
        roots: [
          n('aurreko-hestea', [n('arnas-hastapena', [n('hodi-laringotrakeala', [n('birika-hastapenak', [n('birikak')], { via: 'erpinetik' })])], { via: 'aurreko paretan ebaginatu' })]),
        ],
      },
      {
        id: 'peritoneo-atzeko',
        title: 'Peritoneo barrukotik peritoneo atzekora',
        lead: 'Posizioz aldatzean mesenterio dortsala atzeko paretako peritoneoarekin fusionatzen da.',
        stage: 'peritoneo-barrunbea',
        roots: [
          n('peritoneo-barruko-egiturak', [
            n('peritoneo-atzeko-egiturak', [n('duodenoa'), n('goranzko-kolona'), n('beheranzko-kolona')], { via: 'posizioz aldatu, fusionatu', move: true }),
          ]),
        ],
      },
    ],
  },
  {
    week: 8,
    short: 'Hezurrak',
    flows: [
      {
        id: 'mesenkima-iturriak',
        title: 'Mesenkimaren hiru iturriak',
        lead: 'Hezurrak sortzen dituen mesenkima hiru tokitatik dator; hortik ehun konektiboa, kartilagoa eta hezurra.',
        stage: 'jatorriak',
        roots: [
          n('esklerotoma', undefined, { note: 'mesodermo paraxiala' }),
          n('paretako-orria', undefined, { note: 'alboko mesodermoa' }),
          n('gandor-neurala', undefined, { note: 'zelula ektodermikoak' }),
        ],
        join: n('mesenkima', [n('fibroblastoak'), n('kondroblastoak', [n('kondrozitoak')]), n('osteoblastoak')]),
      },
      {
        id: 'hezurtzapen-motak',
        title: 'Bi hezurtzapen bide',
        lead: 'Mintzezkoan mesenkima zuzenean hezurtzen da; endokondralean lehenik kartilagozko eredua sortzen da.',
        stage: 'hezurtzapena',
        roots: [
          n('mesenkima', [
            n('osteoblastoak', [n('hezur-espikulak', [l('Hezur lauak', undefined, { note: 'buru-ganga' })], { via: 'elkartu, hedatu' })], { via: 'mintzezko hezurtzapena' }),
            n('kondroblastoak', [
              n('kartilago-eredua', [
                n('diafisia', undefined, { via: 'zentro primarioa', note: '12. astea' }),
                n('epifisiak', undefined, { via: 'zentro sekundarioak', note: 'jaio ondoren' }),
              ]),
            ], { via: 'hezurtzapen endokondrala' }),
          ]),
        ],
      },
      {
        id: 'gandor-neurokraneoa',
        title: 'Gandor neurala → neurokraneoaren aurrealdea',
        lead: 'Neurokraneoaren aurrealdeko hezurrak eta kartilagoak gandor neuraleko mesenkimatik datoz.',
        stage: 'kondrokraneoa',
        roots: [
          n('gandor-neurala', [
            n('hezur-frontala', undefined, { via: 'mintzezko hezurtzapena' }),
            n('hipofisi-kartilagoak', [n('esfenoidesaren-gorputza')]),
            n('trenkada-kranialak', [n('etmoidesa')]),
            n('hego-tenporala', [n('esfenoidesaren-hego-handia')]),
            n('begizulo-hegoa', [n('esfenoidesaren-hego-txikia')]),
          ]),
        ],
      },
      {
        id: 'gandor-errai-kraneoa',
        title: 'Gandor neurala → errai kraneoa (faringe arkuak)',
        lead: 'Lehen bi arkuetako mesenkima gandor neuraleko zelulek eratzen dute, ez mesodermoak.',
        stage: 'errai-kraneoa',
        roots: [
          n('gandor-neurala', [
            n('prozesu-maxilarra', [
              n('barra-pterigopalatino-karratua', [n('ingudea')]),
              n('goiko-maxilarra', undefined, { via: 'barraren inguruko mesenkima' }),
              n('hezur-malarra', undefined, { via: 'barraren inguruko mesenkima' }),
              n('tenporalaren-ezkata', undefined, { via: 'barraren inguruko mesenkima' }),
            ], { via: '1. arkua' }),
            n('barail-prozesua', [n('meckel-kartilagoa', [n('mailua')]), n('beheko-maxilarra', undefined, { via: 'Meckelen inguruko mesenkima' })], { via: '1. arkua' }),
            n('hioide-arkua', [n('reichert-kartilagoa', [n('ointokia'), n('apofisi-estiloidea')]), n('hioidesa', undefined, { note: 'ondorengo arkuarekin' })], { via: '2. arkua' }),
          ]),
        ],
      },
      {
        id: 'paraxiala-burezurra',
        title: 'Mesodermo paraxiala → neurokraneoaren atzealdea',
        lead: 'Atzealdeko hezurrak eta kartilagoak mesodermo paraxialetik datoz.',
        stage: 'kondrokraneoa',
        roots: [
          n('mesodermo-paraxiala', [
            n('hezur-parietala', undefined, { via: 'mintzezko hezurtzapena' }),
            n('okzipitalaren-ezkata', undefined, { via: 'mintzezko hezurtzapena' }),
            n('kapsula-periotikoa', [n('harkaitza')]),
          ]),
        ],
      },
      {
        id: 'okzipital-oinaldea',
        title: 'Okzipitalaren oinaldea: bi iturri',
        stage: 'kondrokraneoa',
        roots: [n('esklerotoma-okzipitalak'), n('kartilago-parakordalak', undefined, { note: '3 somita okzipital + 1. lepokoa' })],
        join: n('okzipitalaren-oinaldea'),
        joinVia: 'fusionatu',
      },
      {
        id: 'esklerotoma-ornoak',
        title: 'Esklerotoma → ornoak eta diskoak',
        lead: 'Esklerotoma zelulak erdialdera migratzen dute hodi neurala eta notokorda inguratzeko; birsegmentazioaren ondoren ornoak sortzen dira.',
        stage: 'bizkarrezurra',
        roots: [
          n('esklerotoma', [
            n('mesenkima-zutabea', [
              n('esklerotoma-segmentuak', [n('orno-gorputza', undefined, { via: 'birsegmentazioa', note: 'bi segmenturen erdietatik' })]),
              n('segmentu-arteko-mesenkima', [n('ornoarteko-diskoa', [n('eraztun-fibrosoa')])]),
            ], { via: 'erdialdera migratu', move: true }),
          ]),
          n('notokorda', [
            l('Orno gorputzen mailan', undefined, { via: 'endekatu', gone: true }),
            n('gune-pulposoa', undefined, { via: 'diskoaren mailan' }),
          ]),
        ],
      },
      {
        id: 'esklerotoma-saihetsak',
        title: 'Esklerotoma → saihetsak',
        lead: 'Esklerotoma zelula batzuek alboetara migratzen dute, somitaren alboko muga gurutzatu eta paretako orriraino iristen dira.',
        stage: 'saihetsak',
        roots: [
          n('esklerotoma', [
            l('Paretako orrian', [n('saihets-hezurra'), n('saihets-kartilagoa')], { via: 'alboko muga gurutzatu', move: true }),
          ]),
        ],
      },
      {
        id: 'paretako-orria-hezurrak',
        title: 'Paretako orria → gorputz-adarrak, pelbisa eta esternoia',
        lead: 'Gorputz-adarretako hezurrak alboko mesodermoaren paretako orriko mesenkimatik sortzen dira, hezurtzapen endokondralaren bidez.',
        stage: 'gorputz-adarrak',
        roots: [
          n('paretako-orria', [
            n('gorputz-adarren-mesenkima', [
              l('Goiko gorputz-adarra', [n('humeroa'), n('erradioa'), n('ulna'), n('eskuko-kartilagoak')]),
              l('Beheko gorputz-adarra', [n('femurra'), n('tibia'), n('peroneoa'), n('tartsoaren-kartilagoak'), n('metatartsoaren-kartilagoak')]),
              n('gerriko-hezurrak', [n('iliona'), n('iskiona'), n('pubisa')]),
            ]),
            n('esternoi-barrak', [n('kirtena'), n('esternoiaren-gorputza'), n('apofisi-xifoidea')].map((k) => ({ ...k, via: 'fusionatu' }))),
          ]),
        ],
      },
    ],
  },
  {
    week: 9,
    short: 'Muskuluak',
    flows: [
      {
        id: 'muskulu-motak',
        title: 'Hiru muskulu moten jatorria',
        lead: 'Ildaskatuak mesodermo paraxialetik; leuna eta miokardioa errai orritik; salbuespen batzuk ektodermotik.',
        stage: 'muskulu-motak',
        roots: [
          n('mesodermo-paraxiala', [n('muskulu-ildaskatuak')]),
          n('errai-orria', [n('muskulu-leuna'), n('miokardioa')]),
          n('ektodermoa', [n('begi-niniko-muskuluak'), n('zelula-mioepitelialak'), n('izerdi-guruinak')], { note: 'salbuespenak' }),
        ],
      },
      {
        id: 'somitomeroak',
        title: 'Somitomeroak → begiko eta arkuetako muskuluak',
        lead: 'Somitomeroen mesodermoa begien inguruan eta faringe arkuetan kokatzen da; arku bakoitzean muskulu jakin batzuk sortzen dira.',
        stage: 'somitomeroak-burua',
        roots: [
          n('somitomeroak', [
            l('1.–2. somitomeroak', [n('begi-goiko-zuzena'), n('begi-beheko-zuzena'), n('begi-erdiko-zuzena'), n('begi-beheko-laprana')]),
            l('3. somitomeroa', [n('begi-goiko-laprana')]),
            l('4. somitomeroa', [n('muskulu-murtsikatzaileak', [n('loki-muskulua'), n('maseter-muskulua'), n('muskulu-pterigoideoak')], { via: '1. arkua · V' })]),
            l('5. somitomeroa', [n('begi-alboko-zuzena')]),
            l('6. somitomeroa', [n('muskulu-mimikoak', undefined, { via: '2. arkua · VII' }), n('barailaren-muskulu-jeistaileak', undefined, { via: '2. arkua · VII' })]),
            l('7. somitomeroa', [n('muskulu-estilofaringeoa', undefined, { via: '3. arkua · IX' })]),
          ]),
        ],
      },
      {
        id: 'somita-okzipitalak',
        title: 'Somita okzipitalak → laringea eta mihia',
        stage: 'okzipitalak',
        roots: [
          n('somita-okzipitalak', [
            l('1.–2. somitak', [n('laringearen-muskuluak', undefined, { via: '4. eta 6. arkuak · X' })]),
            l('2.–5. somitak', [n('mihiaren-muskuluak', undefined, { via: 'XII' })]),
          ]),
        ],
      },
      {
        id: 'ehun-konektiboa',
        title: 'Ehun konektibozko patroiak: bi iturri',
        lead: 'Muskuluen kokapena ehun konektiboak zehazten du: buruan gandor neuralak, gorputzean paretako orriak.',
        stage: 'ehun-konektiboa',
        roots: [n('gandor-neurala', undefined, { note: 'buruan' }), n('paretako-orria', undefined, { note: 'gorputz paretak, gorputz-adarrak' })],
        join: n('ehun-konektibozko-patroiak'),
      },
      {
        id: 'somita-muskulu-migrazioa',
        title: 'Somita → miotoma eta gorputz paretako muskuluak',
        lead: 'Atzeko paretako ertzetako zelulak bentralera migratzen dute miotoma osatzeko; aurre-alboko batzuek somitaren alboko muga gurutzatzen dute.',
        stage: 'somitaren-paretak',
        roots: [
          n('somitak', [
            n('somitaren-atzeko-pareta', [
              n('dermatoma', undefined, { via: 'erdiko zelulak' }),
              n('muskulu-zelula-atze-erdialdekoak', [n('miotoma', undefined, { via: 'bentralera migratu', move: true })]),
              n('aurre-alboko-muskulu-zelulak', [
                n('miotoma', undefined, { via: 'bentralera migratu', move: true }),
                n('gorputz-paretako-muskuluak', undefined, { via: 'alboko muga gurutzatu', move: true }),
                l('Gorputz-adarretako muskuluak', undefined, { via: 'alboko muga gurutzatu', move: true }),
              ]),
            ]),
            n('somitaren-erdialdeko-pareta', [n('esklerotoma')]),
            n('somitaren-aurreko-pareta', [n('esklerotoma')]),
          ]),
        ],
      },
      {
        id: 'domeinu-primaxiala',
        title: 'Domeinu primaxiala',
        lead: 'Bizkarreko muskulu sakonak miotomatik; erronboideak, eskapularen jasotzailea eta bizkarraldeko zabala migratu eta bizkarrean kokatzen dira.',
        stage: 'domeinuak',
        roots: [
          n('domeinu-primaxiala', [
            n('bizkarreko-muskulu-sakonak', undefined, { note: 'epaxialak' }),
            n('saihets-arteko-muskuluak'),
            n('muskulu-eskalenoak'),
            n('muskulu-genihioideoak'),
            n('muskulu-prebertebralak'),
            n('erronboideak', undefined, { via: 'bizkarrera migratu', move: true }),
            n('eskapularen-jasotzailea', undefined, { via: 'bizkarrera migratu', move: true }),
            n('bizkarreko-zabala', undefined, { via: 'bizkarrera migratu', move: true }),
          ]),
        ],
      },
      {
        id: 'domeinu-abaxiala',
        title: 'Domeinu abaxiala',
        stage: 'domeinuak',
        roots: [
          n('domeinu-abaxiala', [
            n('hioide-azpiko-muskuluak'),
            n('muskulu-pektoralak'),
            n('bularrezur-giharra'),
            n('abdomeneko-muskuluak', [n('abdomen-kanpoko-laprana'), n('abdomen-barruko-laprana'), n('abdomen-zeharkakoa')]),
            n('azpil-diafragma'),
            n('urrutiko-muskuluak'),
            n('beheko-adarreko-muskuluak'),
          ]),
        ],
      },
      {
        id: 'miokardioa',
        title: 'Errai orria → miokardioa eta eroapen sistema',
        stage: 'bihotz-muskulua',
        roots: [
          n('errai-orria', [
            n('miokardioa', [
              n('eroapen-sistema', [n('nodulu-sinusala'), n('noduluen-arteko-traktuak'), n('nodulu-aurikobentrikularra'), n('his-faszikulua'), n('purkinje-sarea')]),
            ], { via: 'endokardioaren inguruan' }),
          ]),
        ],
      },
    ],
  },
  {
    week: 10,
    short: 'Bihotz hodia',
    flows: [
      {
        id: 'eskualde-kardiogenikoa',
        title: 'Zelula epiblastikoetatik bihotz hodira',
        lead: 'Lerro primitiboaren alde zefalikoko zelulek migratu eta errai orrian odol irlatxoak osatzen dituzte; ferra formako sareko hodiak fusionatzen dira.',
        stage: 'eskualde-kardiogenikoa',
        roots: [
          l('Zelula epiblastikoak', [
            n('odol-irlatxoak', [
              n('ferra-formako-plexua', [
                n('plaka-kardiogenikoa', undefined, { note: 'erdian' }),
                l('Endokardio hodiak', [n('bihotz-hodia', undefined, { via: 'zeharkako tolespena: fusionatu', move: true })], { note: 'alboetan' }),
              ], { via: 'hodiak fusionatu' }),
            ], { via: 'errai orrira migratu', move: true }),
          ], { note: 'lerro primitiboaren alde zefalikoa' }),
        ],
      },
      {
        id: 'bihotza-jaitsi',
        title: 'Bihotza lepotik toraxera jaisten da',
        lead: 'Tolespen zefalokaudalarekin plaka kardiogenikoa alde kaudalera abiatzen da, garun xixkuak hazten diren heinean.',
        stage: 'bihotz-hodia',
        roots: [
          n('plaka-kardiogenikoa', [
            l('Torax barrunbea', undefined, { via: 'tolespen zefalokaudala', move: true, note: 'mintz bukofaringeoaren kaudalean' }),
          ], { note: 'lepo maila' }),
        ],
      },
      {
        id: 'bihotz-geruzak',
        title: 'Bihotzaren hiru geruzak',
        lead: 'Errai orritik orri epimiokardikoa; miokardioak gelatina jariatzen du eta endokardio zelula batzuek hara migratzen dute.',
        stage: 'bihotz-hodia',
        roots: [
          n('errai-orria', [n('orri-epimiokardikoa', [n('miokardioa', [n('bihotz-gelatina', undefined, { via: 'jariatu' })]), n('epikardioa')])]),
          l('Endokardio hodia', [n('endokardioa', undefined, { via: 'gelatinara migratu', move: true })]),
        ],
      },
      {
        id: 'mesokardioa',
        title: 'Mesokardio dortsala desagertzen da',
        stage: 'bihotz-hodia',
        roots: [n('mesokardio-dortsala', [n('perikardioaren-zeharkako-sinua', undefined, { via: 'desagertu; haren lekuan' })])],
      },
      {
        id: 'lakio-mugimenduak',
        title: 'Tolespena: bihotz hodia → bihotz lakioa',
        lead: '23.–28. egunetan alde zefalikoa eta kaudala kontrako noranzkoetan mugitzen dira.',
        stage: 'bihotz-lakioa',
        roots: [
          n('atal-bulbarra', [l('Aurrera, behera, eskuinera', undefined, { via: 'mugitu', move: true })]),
          n('atal-bentrikularra', [l('Ezkerrera', undefined, { via: 'mugitu', move: true })]),
          n('atal-aurikularra', [l('Atzera, gora, ezkerrera', undefined, { via: 'mugitu', move: true, note: 'bulboaren goi-atzean' })], { note: 'zain sinuarekin' }),
        ],
      },
      {
        id: 'lakio-atalak',
        title: 'Bihotz lakioaren atalak → bihotz helduaren atalak',
        lead: 'Atal bakoitzetik bihotzaren barrunbeen azpiatal bat sortzen da.',
        stage: 'bihotz-atalak',
        roots: [
          n('bihotz-lakioa', [
            n('atal-bulbarra', [
              n('bulboaren-hurbileko-atala', [n('hasierako-eskuineko-bentrikulua', undefined, { note: 'atal trabekulatua' })]),
              n('arteria-konoa', [n('infundibuluak', undefined, { note: 'atal lisoak' })]),
              n('enbor-arteriosoa', [n('birika-enborraren-sustraiak'), n('aortaren-sustraiak')]),
            ]),
            n('atal-bentrikularra', [n('hasierako-ezkerreko-bentrikulua', undefined, { note: 'atal trabekulatua' })]),
            n('atal-aurikularra', [n('hasierako-eskuineko-aurikula', [n('belarritxoa')]), n('hasierako-ezkerreko-aurikula')]),
            n('zain-sinua', [
              n('eskuineko-sinu-luzapena', [n('atal-lisoa', undefined, { via: 'eskuineko aurikulan inkorporatu', move: true })]),
              n('ezkerreko-sinu-luzapena', [n('sinu-koronarioa'), n('ezkerreko-aurikularen-zain-laprana')]),
            ]),
          ]),
        ],
      },
      {
        id: 'zain-balbulak',
        title: 'Zain balbulak',
        stage: 'eskuineko-aurikula',
        roots: [
          n('eskuineko-zain-balbula', [
            l('Goiko aldea', undefined, { via: 'desagertu', gone: true }),
            n('beheko-kabaren-balbula', undefined, { via: 'beheko aldea' }),
            n('sinu-koronarioaren-balbula', undefined, { via: 'beheko aldea' }),
          ]),
        ],
      },
      {
        id: 'septum-secundum-fusioa',
        title: 'Septum secundumarekin fusionatzen direnak',
        stage: 'eskuineko-aurikula',
        roots: [n('ezkerreko-zain-balbula'), n('septum-spurium')],
        join: n('septum-secundum'),
        joinVia: 'fusionatu',
      },
    ],
  },
  {
    week: 11,
    short: 'Bihotz trenkadak',
    flows: [
      {
        id: 'aurikula-arteko-trenkada',
        title: 'Aurikula komuna → bi trenkada, bi zulo',
        lead: 'Bi trenkadek aurikula arteko trenkada osatzen dute; odolak zulo obaletik eta ostium secundumetik igarotzen jarraitzen du jaiotza arte.',
        stage: 'zulo-obala',
        roots: [
          n('aurikula-komuna', [
            n('septum-primum', [
              n('ostium-primuma', [l('Itxita', undefined, { via: 'kuxinen luzapenek', gone: true })], { via: 'behean' }),
              n('ostium-secunduma', undefined, { via: 'goian zulatu' }),
              n('zulo-obalaren-balbula', undefined, { via: 'beheko atala' }),
            ], { via: 'sabaitik, 4. astea' }),
            n('septum-secundum', [n('zulo-obala', undefined, { via: 'beheko aldean' })], { via: 'eskuinaldean' }),
          ]),
        ],
      },
      {
        id: 'eskuineko-aurikula',
        title: 'Eskuineko aurikula: bi jatorri',
        lead: 'Atzeko pareta lisoa zain sinutik; aurreko pareta trabekulatua atal aurikularretik. Bien artean gandor terminala.',
        stage: 'aurikulen-paretak',
        roots: [
          n('zain-sinua', [n('eskuineko-sinu-luzapena', [n('atal-lisoa', undefined, { via: 'inkorporatu', move: true })])]),
          n('atal-aurikularra', [n('hasierako-eskuineko-aurikula', [n('atal-trabekulatua', undefined, { note: 'belarritxoa' })])]),
        ],
        join: n('eskuineko-aurikula'),
      },
      {
        id: 'ezkerreko-aurikula',
        title: 'Ezkerreko aurikula: bi jatorri',
        lead: 'Atzeko paretatik hasierako birika zaina ebaginatzen da; haren 4 adarrek atal lisoa osatzen dute.',
        stage: 'aurikulen-paretak',
        roots: [
          l('Atzeko pareta', [
            n('birika-zain-primitiboa', [n('birika-zainak', [n('ezkerreko-aurikularen-atal-lisoa')], { via: '4 adar, birika hastapenetara' })], { via: 'ebaginatu' }),
          ]),
          n('atal-aurikularra', [n('hasierako-ezkerreko-aurikula', [n('ezkerreko-aurikularen-atal-trabekulatua')])]),
        ],
        join: n('ezkerreko-aurikula-jaiotakoan'),
      },
      {
        id: 'erreten-ab',
        title: 'Erreten aurikulubentrikularra → bi zulo eta balbulak',
        lead: 'Goiko eta beheko kuxinak fusionatu eta erretena bitan banatzen dute; kuxinen mesenkimatik balbulak.',
        stage: 'balbula-ab',
        roots: [
          n('erreten-aurikulubentrikularra', [
            n('kuxin-aurikulubentrikularrak', [
              n('zulo-aurikulubentrikularrak', [
                n('eskuineko-zulo-ab', [n('balbula-trikuspidea', undefined, { via: 'mesenkima goraguneak' })]),
                n('ezkerreko-zulo-ab', [n('balbula-mitrala', undefined, { via: 'mesenkima goraguneak' })]),
              ], { via: 'goikoa + behekoa fusionatu' }),
              n('ostium-primuma', [l('Itxita', undefined, { gone: true })], { via: 'luzapenak' }),
            ], { via: '4 kuxin' }),
          ]),
          l('Zuntz muskularrak', [n('soka-tendinosoak', undefined, { via: 'fibrotsu bihurtu' })]),
        ],
      },
      {
        id: 'bentrikulu-arteko-trenkada',
        title: 'Bentrikulu arteko trenkada: bi atal',
        lead: 'Trenkada muskularra ez da osoa; arteria konoaren trenkadaren beheko ataltxoak (mintzezkoa) ixten du.',
        stage: 'bentrikulu-arteko-trenkada',
        roots: [
          l('Bentrikuluen barruko paretak', [n('trenkada-muskularra', undefined, { via: 'hazi, hurbildu' })], { note: 'miokardioa' }),
          n('konoaren-trenkada', [n('mintzezko-trenkada', undefined, { via: 'beheko ataltxoa' })], { note: '+ beheko kuxina' }),
        ],
        join: n('bentrikulu-arteko-trenkada'),
        joinVia: 'fusionatu',
      },
      {
        id: 'atal-bulbarra-trenkadak',
        title: 'Atal bulbarra → infundibuluak, birika arteria eta aorta',
        lead: 'Konoaren trenkada laprana da; enbor arteriosoarena kiribila. Biak jarraiak dira.',
        stage: 'enbor-arteriosoa',
        roots: [
          n('arteria-konoa', [
            n('konoaren-gandorrak', [n('konoaren-trenkada', [n('eskuineko-infundibulua'), n('ezkerreko-infundibulua')], { via: 'fusionatu' })]),
          ]),
          n('enbor-arteriosoa', [
            n('enborraren-gandorrak', [n('trenkada-aortikopulmonarra', [n('birika-arteria'), n('goranzko-aorta')], { via: 'kiribil' })]),
          ]),
        ],
      },
      {
        id: 'eskuineko-bentrikulua',
        title: 'Bentrikulu bakoitza: bi jatorri',
        lead: 'Atal trabekulatuak hasierako bentrikuluetatik; atal lisoak (infundibuluak) arteria konotik.',
        stage: 'jatorriak',
        roots: [
          n('bulboaren-hurbileko-atala', [n('hasierako-eskuineko-bentrikulua', undefined, { note: 'atal trabekulatua' })]),
          n('arteria-konoa', [n('eskuineko-infundibulua', undefined, { note: 'atal lisoa' })]),
        ],
        join: n('eskuineko-bentrikulua'),
      },
      {
        id: 'ezkerreko-bentrikulua',
        title: 'Ezkerreko bentrikulua: bi jatorri',
        stage: 'jatorriak',
        roots: [
          n('atal-bentrikularra', [n('hasierako-ezkerreko-bentrikulua', undefined, { note: 'atal trabekulatua' })]),
          n('arteria-konoa', [n('ezkerreko-infundibulua', undefined, { note: 'atal lisoa' })]),
        ],
        join: n('ezkerreko-bentrikulua'),
      },
      {
        id: 'balbula-semilunarrak',
        title: 'Endokardio kuxinak → balbula semilunarrak',
        stage: 'balbula-semilunarrak',
        roots: [
          n('endokardio-kuxinak', [
            n('balbula-semilunarrak', [n('aorta-balbula', [n('arteria-koronarioak', undefined, { via: 'alboko balben sinuetatik' })]), n('birika-balbula')], { via: 'hiru gandor, goian zulatu' }),
          ]),
        ],
      },
    ],
  },
  {
    week: 12,
    short: 'Arteriak',
    flows: [
      {
        id: 'aorta-arkuak',
        title: 'Sei aorta arkuak → arteria helduak',
        lead: 'Arku bakoitzak bere eratorriak ditu; bosgarrena guztiz desagertzen da.',
        stage: 'beste-aldaketak',
        roots: [
          n('aorta-arkuak', [
            n('lehen-aorta-arkua', [n('arteria-maxilarra', undefined, { via: 'hondarra' })]),
            n('bigarren-aorta-arkua', [n('hioide-arteria', undefined, { via: 'hondarra' }), n('ointokiko-arteria', undefined, { via: 'hondarra' })]),
            n('hirugarren-aorta-arkua', [n('karotida-komuna'), n('barneko-karotida', undefined, { note: 'hurbileko zatia' })]),
            n('laugarren-aorta-arkua', [
              n('makoaren-urrutiko-atala', undefined, { via: 'ezkerrekoa' }),
              n('eskuineko-subklabioa', undefined, { via: 'eskuinekoa', note: 'hurbileko atala' }),
            ]),
            n('bostgarren-aorta-arkua', [l('Ez du ezer sortzen', undefined, { via: 'desagertu', gone: true })]),
            n('seigarren-aorta-arkua', [
              n('ezkerreko-birika-arteria', undefined, { via: 'ezk. hurbilekoa' }),
              n('hodi-arteriosoa', [n('lotailu-arteriosoa', undefined, { via: 'jaio ondoren' })], { via: 'ezk. urrutikoa' }),
              n('eskuineko-birika-arteria', undefined, { via: 'esk. hurbilekoa' }),
              l('Eskuineko urrutikoa', undefined, { via: 'desagertu', gone: true }),
            ]),
          ]),
        ],
      },
      {
        id: 'aorta-zakua',
        title: 'Aorta zakua → goranzko aorta, makoa eta enbor brakiozefalikoa',
        stage: 'aorta-heldua',
        roots: [
          n('aorta-zakua', [
            n('goranzko-aorta', undefined, { note: '+ enbor arteriosoa' }),
            n('enbor-brakiozefalikoa', undefined, { via: 'eskuineko luzapena' }),
            n('aortaren-makoa', undefined, { via: 'ezkerreko luzapena', note: 'hasierako zatia' }),
          ]),
          n('aorta-dortsalak', [n('beheranzko-aorta', undefined, { via: 'ezkerrekoa; T4tik behera fusionatuta' })]),
        ],
      },
      {
        id: 'makoa',
        title: 'Aortaren makoa: bi zati',
        stage: 'laugarren-arkua',
        roots: [n('aorta-zakua', undefined, { note: 'ezkerreko luzapena' }), n('laugarren-aorta-arkua', [n('makoaren-urrutiko-atala')], { note: 'ezkerrekoa' })],
        join: n('aortaren-makoa'),
      },
      {
        id: 'eskuineko-subklabioa',
        title: 'Eskuineko subklabioa: hiru zati',
        lead: 'Ezkerrekoa, aldiz, ezkerreko 7. segmentu arteko arteria osoa da.',
        stage: 'laugarren-arkua',
        roots: [
          n('laugarren-aorta-arkua', undefined, { note: 'eskuinekoa' }),
          n('aorta-dortsalak', undefined, { note: 'eskuinekoa' }),
          n('zazpigarren-segmentu-arteko-arteria', undefined, { note: 'eskuinekoa' }),
        ],
        join: n('eskuineko-subklabioa'),
      },
      {
        id: 'barneko-karotida',
        title: 'Barneko karotida: bi zati',
        lead: 'Hodi karotideoak desagertzen dira: horregatik karotidak eta makoa ez daude aorta dortsalaren bidez lotuta.',
        stage: 'hirugarren-arkua',
        roots: [
          n('hirugarren-aorta-arkua', undefined, { note: 'hurbileko zatia' }),
          n('aorta-dortsalak', undefined, { note: '3. arkuaren gainetik' }),
        ],
        join: n('barneko-karotida'),
      },
      {
        id: 'nerbio-atzerakariak',
        title: 'Nerbio laringeo atzerakariak arkuekin gora',
        lead: 'Arkuen aldaketen ondorioz, eskuinekoa 4. arkura igotzen da (5.a ez da garatzen eta 6.aren urrutikoa desagertzen da); ezkerrekoa 6. arkuaren azpian geratzen da.',
        stage: 'nerbio-atzerakariak',
        roots: [
          n('nerbio-bagoa', [
            n('eskuineko-nerbio-atzerakaria', [n('eskuineko-subklabioa', undefined, { via: 'gora igo, inguratu', move: true })]),
            n('ezkerreko-nerbio-atzerakaria', [n('lotailu-arteriosoa', undefined, { via: 'inguratu', note: 'hodi arteriosoa' })]),
          ]),
        ],
      },
      {
        id: 'bitelo-arteriak',
        title: 'Bitelo arteriak → aurreko errai adarrak',
        stage: 'adar-bentralak',
        roots: [n('bitelo-arteriak', [n('hestegorriko-arteriak'), n('enbor-zeliakoa'), n('goiko-arteria-mesenterikoa'), n('beheko-arteria-mesenterikoa')])],
      },
      {
        id: 'segmentu-arteko-arteriak',
        title: 'Segmentu arteko arteriak maila bakoitzean',
        stage: 'alboko-adarrak',
        roots: [
          n('segmentu-arteko-arteriak', [
            n('orno-arteria', undefined, { via: 'lepoa: luzetarako anastomosiak' }),
            n('zazpigarren-segmentu-arteko-arteria', [n('ezkerreko-subklabioa', undefined, { via: 'ezkerrekoa' })], { via: 'lepoa, 7. maila' }),
            n('saihets-arteko-arteriak', undefined, { via: 'toraxa' }),
            n('arteria-lunbarrak', undefined, { via: 'gerria' }),
            n('arteria-iliako-primitiboak', undefined, { via: 'gerriko V.a' }),
            n('alboko-arteria-sakroak', undefined, { via: 'sakroa' }),
          ]),
        ],
      },
      {
        id: 'zilbor-iliakoak',
        title: 'Zilborreko arteriak eta iliakoak',
        lead: 'Zilborreko arteriek aortarekin duten kontaktua galtzen dute barneko arteria iliakoekin kontaktatzeko.',
        stage: 'zilbor-iliakoak',
        roots: [
          n('arteria-iliako-primitiboak', [n('kanpoko-arteria-iliakoa', [n('arteria-femorala')]), n('barneko-arteria-iliakoa')]),
          n('zilbor-arteriak', [
            n('goiko-gernu-maskuri-arteria', undefined, { via: 'hurbileko atala' }),
            n('erdialdeko-zilbor-lotailua', undefined, { via: 'urrutiko atala: fibrosia' }),
          ]),
        ],
      },
      {
        id: 'ardatz-arteria',
        title: 'Ardatz arteria → gorputz adarren arteriak',
        stage: 'gorputz-adarrak',
        roots: [
          n('ardatz-arteria', [
            l('Goiko gorputz adarra', [n('arteria-brakiala'), n('hezur-arteko-arteria'), n('eskuaurreko-arku-sakona'), n('arteria-kubitala'), n('arteria-erradiala')]),
            l('Beheko gorputz adarra', [n('arteria-ziatikoa'), n('arteria-popliteoa'), n('arteria-peroneoa')]),
          ], { note: 'gorputz adarraren mesodermoa' }),
        ],
      },
    ],
  },
  {
    week: 13,
    short: 'Zainak',
    flows: [
      {
        id: 'zain-bitelinoak',
        title: 'Zain bitelinoak → porta zaina eta beheko kabaren gibel segmentua',
        lead: 'Duodenoaren inguruan plexua, gibelean sinusoideak; azken atalak hodi hepatokardiakoak dira.',
        stage: 'bitelinoak',
        roots: [
          n('bitelo-zainak', [
            n('zain-plexu-periduodenala', [
              n('porta-zaina', undefined, { via: 'eskuinekoa' }),
              n('goiko-zain-mesenterikoa', undefined, { via: 'eskuinekoa' }),
              n('zain-esplenikoa', undefined, { via: 'anastomosia' }),
            ], { via: 'duodenoaren inguruan' }),
            n('gibeleko-sinusoideak', undefined, { via: 'gibelean sartu' }),
            n('hodi-hepatokardiakoak', [
              n('eskuineko-hodi-hepatokardiakoa', [n('kabaren-gibel-segmentua')]),
              n('ezkerreko-hodi-hepatokardiakoa', [l('Desagertu', undefined, { gone: true })]),
            ], { via: 'azken atalak' }),
          ]),
        ],
      },
      {
        id: 'zilbor-zainak',
        title: 'Zilborreko zainak → hodi benosoa eta lotailuak',
        lead: 'Eskuinekoa osorik desagertzen da; ezkerrekoak hodi benosoa sortzen du gibelaren azalean.',
        stage: 'zilbor-zainak',
        roots: [
          n('zilbor-zainak', [
            n('eskuineko-zilbor-zaina', [l('Osorik desagertu', undefined, { gone: true })]),
            n('ezkerreko-zilbor-zaina', [
              n('hodi-benosoa', [n('gibeleko-lotailu-benosoa', undefined, { via: 'jaiotzean itxi' })], { via: 'esk. hodi hepatokardiakoarekin' }),
              n('gibeleko-lotailu-borobila', undefined, { via: 'jaiotzean itxi' }),
            ], { note: 'hurbileko ataltxoa desagertu' }),
          ]),
        ],
      },
      {
        id: 'beheko-kaba',
        title: 'Beheko kaba zaina: hiru segmentu',
        lead: 'Hiru jatorri, eskuinekoak denak, fusionatuz behin-betiko bena kaba.',
        stage: 'beheko-kaba',
        roots: [
          n('eskuineko-hodi-hepatokardiakoa', [n('kabaren-gibel-segmentua')]),
          n('kardinal-azpiko-zainak', [n('kabaren-giltzurrun-segmentua')], { note: 'eskuinekoa' }),
          n('zain-sakrokardinalak', [n('kabaren-segmentu-sakrokardinala')], { note: 'eskuineko hurbilekoa' }),
        ],
        join: n('beheko-kaba-zaina'),
        joinVia: 'fusionatu',
      },
      {
        id: 'anastomosiak',
        title: 'Anastomosiak: ezkerreko odola eskuinera',
        lead: 'Zain sistemaren garapenean ezkerreko zainetako odola eskuinekoetara pasatzen da.',
        stage: 'beheko-kaba',
        roots: [
          n('kardinal-azpiko-zainak', [
            n('ezkerreko-giltzurrun-zaina', undefined, { via: 'anastomosia' }),
            n('ezkerreko-zain-gonadala', undefined, { via: 'ezk. urrutiko atala' }),
            l('Ezkerreko hurbileko atala', undefined, { via: 'desagertu', gone: true }),
          ]),
          n('zain-sakrokardinalak', [
            n('ezkerreko-zain-iliako-primitiboa', undefined, { via: 'anastomosia, ezk. urrutikoa' }),
            n('eskuineko-zain-iliako-primitiboa', undefined, { via: 'esk. urrutikoa' }),
          ]),
        ],
      },
      {
        id: 'azigos',
        title: 'Azigos sistema',
        lead: 'Atzeko kardinalen lana kardinal gaineko zainek hartzen dute.',
        stage: 'azigos',
        roots: [
          n('kardinal-gaineko-zainak', undefined, { note: 'eskuinekoa' }),
          n('atzeko-zain-kardinalak', undefined, { note: 'esk. hurbileko atala' }),
        ],
        join: n('azigos-zaina'),
      },
      {
        id: 'hemiazigos',
        title: 'Ezkerreko kardinal gainekoa → hemiazigosak',
        stage: 'azigos',
        roots: [
          n('kardinal-gaineko-zainak', [
            n('hemiazigos-zaina', [n('azigos-zaina', undefined, { via: 'anastomosia' })], { note: '9.–11. espazioak' }),
            n('hemiazigos-laguntzailea', [n('azigos-zaina', undefined, { via: 'anastomosia' })], { note: '4.–8. espazioak' }),
          ], { note: 'ezkerrekoa' }),
        ],
      },
      {
        id: 'goiko-kaba',
        title: 'Goiko kaba zaina: bi zati',
        stage: 'goiko-kaba',
        roots: [
          n('aurreko-zain-kardinalak', [n('goiko-kabaren-hasierako-atala')], { note: 'eskuineko hurbilekoa' }),
          n('bena-kardinal-komuna', [n('goiko-kabaren-bukaerako-atala')], { note: 'eskuinekoa' }),
        ],
        join: n('goiko-kaba-zaina'),
      },
      {
        id: 'aurreko-kardinalak',
        title: 'Aurreko kardinalak → brakiozefalikoak eta jugularrak',
        stage: 'goiko-kaba',
        roots: [
          n('aurreko-zain-kardinalak', [
            n('aurreko-kardinalen-anastomosia', [n('ezkerreko-zain-brakiozefalikoa')]),
            n('eskuineko-zain-brakiozefalikoa'),
            n('barneko-jugularrak', undefined, { via: 'urrutiko atalak' }),
          ]),
        ],
      },
      {
        id: 'zain-sinu-ezkerra',
        title: 'Zain sinuaren ezkerreko luzapena',
        lead: 'Anastomosien ondorioz garrantzia galtzen du, baina ez da guztiz desagertzen.',
        stage: 'sinu-koronarioa',
        roots: [n('ezkerreko-sinu-luzapena', [n('sinu-koronarioa'), n('ezkerreko-aurikularen-zain-laprana')])],
      },
      {
        id: 'jaiotza',
        title: 'Jaiotzean ixten diren bideak',
        lead: 'Birika zirkulazioa hastean zilbor hodiak, hodi benosoa, hodi arteriosoa eta zulo obala ixten dira.',
        stage: 'jaiotza',
        roots: [
          n('zilbor-arteriak', [
            n('erdialdeko-zilbor-lotailua', undefined, { via: 'urrutikoa: fibrosia' }),
            n('goiko-gernu-maskuri-arteria', undefined, { via: 'hurbilekoa: zabalik' }),
          ], { note: '2–3 minutu' }),
          n('ezkerreko-zilbor-zaina', [n('gibeleko-lotailu-borobila', undefined, { via: 'itxi' })]),
          n('hodi-benosoa', [n('gibeleko-lotailu-benosoa', undefined, { via: 'itxi' })]),
          n('hodi-arteriosoa', [n('lotailu-arteriosoa', undefined, { via: 'itxi', note: '2–3 hilabete' })]),
          n('zulo-obala', [l('Itxita', undefined, { via: 'septumak fusionatu', note: '~1 urte; %20 ez osoa' })]),
        ],
      },
      {
        id: 'linfa',
        title: 'Linfa sistema',
        lead: 'Linfa zakuak eta hodiak errai orritik; linfa guztia kiloren zisternara eta hodi toraxikora.',
        stage: 'linfa',
        roots: [
          n('errai-orria', [
            n('linfa-zaku-yugularrak'),
            n('peritoneo-atzeko-linfa-zakua'),
            n('atzeko-linfa-zakuak'),
            n('kiloren-zisterna', [
              n('hodi-toraxikoa', [n('lotura-yugulosubklabikoa', undefined, { via: 'ezkerrean ireki' })], { via: 'bi → bat' }),
            ]),
          ]),
        ],
      },
    ],
  },
];

/** Origins worth following across topics; each also matches what its lineage descends into. */
export const SOURCES: { id: string; also?: string[] }[] = [
  { id: 'gandor-neurala' },
  { id: 'mesodermo-paraxiala' },
  { id: 'paretako-orria' },
  { id: 'errai-orria' },
  { id: 'septum-transversum' },
  { id: 'endokardio-kuxinak', also: ['kuxin-aurikulubentrikularrak', 'konoaren-gandorrak', 'enborraren-gandorrak'] },
  { id: 'aorta-arkuak', also: ['lehen-aorta-arkua', 'bigarren-aorta-arkua', 'hirugarren-aorta-arkua', 'laugarren-aorta-arkua', 'bostgarren-aorta-arkua', 'seigarren-aorta-arkua'] },
  { id: 'zain-sinua', also: ['eskuineko-sinu-luzapena', 'ezkerreko-sinu-luzapena'] },
];

/** Every id a source lights: itself, its listed relatives and everything the lineage tree derives from it. */
export function sourceIds(id: string): Set<string> {
  const s = SOURCES.find((x) => x.id === id);
  return new Set([id, ...(s?.also ?? []), ...descendantsOf(id)]);
}

/** Every structure id drawn in a flow. */
export function flowIds(f: Flow): string[] {
  const out: string[] = [];
  const walk = (m: MNode) => {
    if (m.id) out.push(m.id);
    m.kids?.forEach(walk);
  };
  f.roots.forEach(walk);
  if (f.join) walk(f.join);
  return out;
}

/** Every id used anywhere (tests check they exist). */
export const migrationIds = () => [...new Set(MIGRATIONS.flatMap((t) => t.flows.flatMap(flowIds)).concat(SOURCES.flatMap((s) => [s.id, ...(s.also ?? [])])))];
