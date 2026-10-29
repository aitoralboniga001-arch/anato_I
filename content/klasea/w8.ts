import type { BoardItem, Lesson, Line } from '@/lib/klasea/types';

/**
 * Topic 8's class: the core of the notes (content/klasea/importance/w8.ts), said over the existing
 * stages and views, from the three origins of bone to the ribs and the sternum. Every line cites the
 * sentences it rests on; tests/klasea.test.ts holds each line to them (numbers, directions, names, the
 * frames it is said over). Plan: docs/klasea-plan.md §4.
 */

const n = (...ids: string[]) => ids.map((id) => `w8/${id}`);

/** A line said at stage time `at`, lighting `focus`. */
const L = (at: number, say: string, notes: string[], focus: string[] = [], more: Partial<Line> = {}): Line => ({ at, say, notes, focus, ...more });

/** The three cartilages of the face, the ossicle each gives and the bones of the mesenchyme around it (notes 3.2 p6–p9). */
const TABLE: BoardItem = {
  id: 'taula',
  kind: 'table',
  head: ['Kartilagoa', 'Hezurtxoa', 'Inguruko mesenkimatik'],
  rows: [
    { id: 'tz-meckel', cells: ['Meckel kartilagoa (barail prozesua)', 'Mailua', 'Beheko maxilarra'], notes: n('3.2/p12/s2', '3.2/p14/s1'), structures: ['meckel-kartilagoa', 'mailua', 'beheko-maxilarra'] },
    {
      id: 'tz-barra',
      cells: ['Barra pterigopalatino karratua (prozesu maxilarra)', 'Ingudea', 'Goiko maxilarra, hezur malarrak, tenporalaren ezkata'],
      notes: n('3.2/p6/s2', '3.2/p10/s1'),
      structures: ['barra-pterigopalatino-karratua', 'ingudea', 'goiko-maxilarra', 'hezur-malarra', 'tenporalaren-ezkata'],
    },
    { id: 'tz-reichert', cells: ['Reichert kartilagoa (barail prozesua eta bigarren arkua)', 'Ointokia', '–'], notes: n('3.2/p15/s1'), structures: ['reichert-kartilagoa', 'ointokia'] },
  ],
};

export const LESSON_W8: Lesson = {
  week: 8,
  title: 'Eskeleto sistema',
  goals: [
    'Hezurren hiru jatorriak',
    'Bi hezurtzapen motak: mintzezkoa eta endokondrala',
    'Burezurra: buru-ganga, kondrokraneoa eta errai kraneoa',
    'Gorputz-adarrak eta hezur luzeak',
    'Ornoak, bizkarrezurra eta saihetsak',
  ],
  chunks: [
    {
      id: 'gaur',
      title: 'Gaur',
      stage: 'jatorriak',
      lines: [
        L(0, 'Kaixo! Gaur hezurrak ikasiko ditugu: nondik sortzen diren eta nola hezurtzen diren.', n('1/p2/s1'), [], {
          plain: 'Gaurko gaia: hezurrak. Nondik datozen, eta nola bihurtzen diren hezur.',
        }),
        L(0, 'Gure hezurrak hiru jatorritatik sortzen dira: mesodermo paraxialetik, alboko mesodermoaren paretako orritik eta gandor neuraletik.', n('1/p2/s1'), ['mesodermo-paraxiala', 'paretako-orria', 'gandor-neurala'], {
          tone: 'emphasis',
          writes: 'b-hiru',
          plain: 'Hiru iturri daude: mesodermo paraxiala, paretako orria eta gandor neurala.',
        }),
        L(0, 'Kontuz: gandor neuraleko zelulak jatorriz ektodermikoak dira.', n('1/p2/s1'), ['gandor-neurala'], {
          tone: 'caution',
          plain: 'Kontuz: gandor neuraleko zelulak ektodermotik datoz, ez mesodermotik.',
        }),
        L(0.12, 'Garapenean mesodermo paraxiala segmentatu egiten da.', n('1/p5/s1'), ['mesodermo-paraxiala'], {
          plain: 'Mesodermo paraxiala zatitan banatzen da.',
        }),
        L(0.12, 'Alde zefalikoan somitomeroak agertzen dira; alde okzipitaletik behera, berriz, somitak.', n('1/p5/s2', '1/p5/s3'), ['somitomeroak', 'somitak'], {
          writes: 'b-segmentuak',
          plain: 'Buruan somitomeroak sortzen dira; garondotik behera, somitak.',
        }),
        L(0.31, 'Somitetan bi zelula multzo bereizten dira: esklerotoma, aurrealdeko eta erdialdeko paretatik, eta dermomiotoma, atzealdekotik.', n('1/p5/s4'), ['esklerotoma', 'dermatomiotoma'], {
          plain: 'Somita bakoitzean bi talde: esklerotoma aurrean eta erdian, dermomiotoma atzean.',
        }),
      ],
      board: [
        { id: 'b-hiru', kind: 'line', text: 'Hezurren hiru jatorri: mesodermo paraxiala, paretako orria eta gandor neurala (ektodermikoa)', notes: n('1/p2/s1'), key: true },
        { id: 'b-segmentuak', kind: 'line', text: 'Alde zefalikoan somitomeroak; okzipitaletik behera somitak', notes: n('1/p5/s2', '1/p5/s3') },
      ],
      checks: [
        {
          kind: 'predict',
          q: 'Zer uste duzu: hezur guztiak mesodermotik sortzen dira?',
          options: ['Ez: batzuk gandor neuraletik datoz, ektodermotik', 'Bai, denak mesodermotik', 'Ez: batzuk endodermotik datoz'],
          answer: 0,
          why: ['Bai: gandor neuraleko zelulak ektodermikoak dira, eta hezurrak ere sortzen dituzte.', 'Ez: gandor neuralak ere hezurrak sortzen ditu.', 'Ez: endodermoak ez du hezurrik sortzen.'],
          notes: n('1/p2/s1'),
          after: 1,
        },
      ],
    },

    {
      id: 'jatorriak',
      title: 'Hiru jatorriak',
      stage: 'jatorriak',
      lines: [
        L(0.4, 'Esklerotomako zelulak mesenkima bihurtzen dira: zelula mugikorrak, migratu egiten dutenak.', n('1/p6/s1', '1/p6/s2'), ['esklerotoma', 'mesenkima'], {
          plain: 'Esklerotomako zelulak mesenkima bihurtzen dira, eta mugitu egiten dira.',
        }),
        L(0.54, 'Lehen bidea: erdialdera migratu, eta bizkarrezurreko ornoak eta saihetsak eratu.', n('1/p6/s3', '1/p7/s1'), ['ornoak', 'saihetsak'], {
          tone: 'emphasis',
          writes: 'b-esklerotoma',
          plain: 'Batzuk erdialdera doaz, eta ornoak eta saihetsak egiten dituzte.',
        }),
        L(0.66, 'Bigarren bidea: hezurra eratzen duten zelulak sortu, fibroblastoak, kondroblastoak eta osteoblastoak.', n('1/p8/s1'), ['fibroblastoak', 'kondroblastoak', 'osteoblastoak'], {
          plain: 'Beste batzuk hezurra egiten duten zelula bihurtzen dira: fibroblastoak, kondroblastoak eta osteoblastoak.',
        }),
        L(0.78, 'Alboko mesodermoaren paretako orritik ere mesenkima sortzen da.', n('1/p10/s1'), ['paretako-orria', 'mesenkima'], {
          plain: 'Paretako orriak ere mesenkima egiten du.',
        }),
        L(0.78, 'Hortik goiko eta beheko gorputz-adarretako hezurrak, esternoia eta gerrialdeko hezurrak sortzen dira.', n('1/p11/s1', '1/p12/s1', '1/p13/s1'), [
          'gorputz-adarretako-hezurrak',
          'esternoia',
          'gerriko-hezurrak',
        ], { writes: 'b-paretakoa', plain: 'Hortik datoz besoetako eta hanketako hezurrak, esternoia eta gerrialdeko hezurrak.' }),
        L(0.9, 'Hirugarren jatorria: alde zefalikoko gandor neuraleko zelula batzuek ere hezurrak eratzen dituzte.', n('1/p15/s1'), ['gandor-neurala'], {
          plain: 'Hirugarrena: buruko gandor neuraleko zelula batzuek ere hezurrak egiten dituzte.',
        }),
        L(0.9, 'Buruaren aldera migratzen dute eta mesenkima eratzen dute: hortik aurpegiko eta neurokraneoko hezurrak.', n('1/p15/s2', '1/p15/s3'), ['mesenkima', 'buru-aurpegi-hezurrak'], {
          writes: 'b-gandorra',
          plain: 'Burura doaz, mesenkima egiten dute, eta hortik aurpegiko eta neurokraneoko hezurrak sortzen dira.',
        }),
      ],
      board: [
        { id: 'b-esklerotoma', kind: 'line', text: 'Esklerotoma: mesenkima. Erdialdera migratu: ornoak eta saihetsak', notes: n('1/p6/s1', '1/p7/s1'), key: true },
        { id: 'b-paretakoa', kind: 'line', text: 'Paretako orria: gorputz-adarretako hezurrak, esternoia, gerrialdeko hezurrak', notes: n('1/p10/s1', '1/p11/s1', '1/p12/s1', '1/p13/s1'), key: true },
        { id: 'b-gandorra', kind: 'line', text: 'Gandor neurala: aurpegiko eta neurokraneoko hezurrak', notes: n('1/p15/s1', '1/p15/s3'), key: true },
      ],
      checks: [
        {
          kind: 'contrast',
          id: 'klasea:8/ornoak-esternoia',
          concept: 'esternoia',
          q: 'Ornoak eta esternoia: nondik sortzen da bakoitza?',
          options: ['Ornoak esklerotomatik; esternoia paretako orritik', 'Biak esklerotomatik', 'Ornoak paretako orritik; esternoia esklerotomatik'],
          answer: 0,
          why: [
            'Bai: esklerotoma erdialdera doa ornoak egiteko; esternoia paretako orriko mesenkimatik dator.',
            'Ez: esternoia paretako orritik dator.',
            'Ez: alderantziz da.',
          ],
          notes: n('1/p7/s1', '1/p10/s1', '1/p12/s1'),
        },
        { kind: 'pool', id: 'w8-q-jatorriak' },
      ],
    },

    {
      id: 'hezurtzapena',
      title: 'Bi hezurtzapen mota',
      stage: 'hezurtzapena',
      lines: [
        L(0, 'Orokorrean bi hezurtzapen mota daude, mintzezkoa eta endokondrala, eta bien abiapuntua mesenkima da.', n('2/p2/s1'), ['mesenkima'], {
          tone: 'emphasis',
          plain: 'Hezurra bi modutara egiten da, mintzezkoa eta endokondrala, eta biak mesenkimatik hasten dira.',
        }),
        L(0.2, 'Mintzezkoan, mesenkimatik hezurren mintzezko ereduak sortzen dira, eta zuzenean hezurtzapen zentroak agertzen dira.', n('2/p2/s1'), ['mesenkima', 'hezurtzapen-zentroak', 'osteoblastoak'], {
          plain: 'Lehenengoan, mesenkimazko mintz bat bera hezurtzen da, zentro batzuetatik hasita.',
        }),
        L(0.32, 'Beraz, mintzezko eredu hori zuzenean hezurtzen da, kartilagorik gabe.', n('2/p2/s1'), ['hezur-espikulak'], {
          plain: 'Mintza bera bihurtzen da hezur, zuzenean, kartilagorik gabe.',
        }),
        L(0.54, 'Endokondralean, berriz, mesenkimatik kartilago hialinozko ereduak sortzen dira lehenik.', n('2/p3/s1'), ['mesenkima', 'kartilago-eredua'], {
          plain: 'Bigarrenean, mesenkimatik lehenik kartilagozko eredu bat egiten da.',
        }),
        L(0.54, 'Kondroblastoek sortzen dituzte eredu horiek, eta hasieran kartilaginotsuak dira.', n('2/p3/s2'), ['kondroblastoak', 'kartilago-eredua'], {
          plain: 'Kondroblastoek egiten dute eredua, eta hasieran kartilagoa da.',
        }),
        L(0.64, 'Bigarren fase batean, hezurtzapen zentroei esker, kartilago eredu horiek hezurtzen dira.', n('2/p3/s2'), ['hezurtzapen-zentroak', 'kartilago-eredua'], {
          writes: 'b-bi-motak',
          plain: 'Gero, zentro batzuetatik hasita, kartilagoa hezurrak ordezkatzen du.',
        }),
        L(0.8, 'Laburbilduz: mintzezkoan mesenkima zuzenean hezurtzen da; endokondralean, lehenik kartilagoa, gero hezurra.', n('2/p2/s1', '2/p3/s1'), ['mesenkima'], {
          tone: 'summary',
          plain: 'Gogoratu: mintzezkoan zuzenean hezurra; endokondralean, kartilagoa lehenik eta hezurra gero.',
        }),
      ],
      board: [
        {
          id: 'b-bi-motak',
          kind: 'line',
          text: 'Mintzezkoa: mesenkimazko eredua zuzenean hezurtzen da. Endokondrala: kartilago hialinozko eredua, gero hezurra',
          notes: n('2/p2/s1', '2/p3/s1', '2/p3/s2'),
          key: true,
        },
      ],
      checks: [
        {
          kind: 'contrast',
          id: 'klasea:8/hezurtzapen-motak',
          concept: 'kartilago-eredua',
          q: 'Mintzezko hezurtzapena eta endokondrala: zertan dira desberdinak?',
          options: [
            'Mintzezkoan mesenkima zuzenean hezurtzen da; endokondralean lehenik kartilago eredua sortzen da',
            'Mintzezkoan lehenik kartilagoa; endokondralean zuzenean hezurra',
            'Bietan kartilago eredua sortzen da lehenik',
          ],
          answer: 0,
          why: ['Bai: endokondralean kondroblastoek kartilago eredua egiten dute, eta gero hezurtzen da.', 'Ez: alderantziz da.', 'Ez: mintzezkoan ez dago kartilagorik.'],
          notes: n('2/p2/s1', '2/p3/s1'),
        },
      ],
    },

    {
      id: 'buruganga',
      title: 'Buru-ganga',
      stage: 'buru-ganga',
      lines: [
        L(0, 'Burezurreko hezurrak bi zati nagusitan banatzen dira: neurokraneoa eta errai kraneoa.', n('3/p2/s1', '3/p3/s1', '3/p4/s1'), ['neurokraneoa', 'errai-kraneoa'], {
          tone: 'emphasis',
          writes: 'b-burezurra',
          plain: 'Burezurrak bi zati ditu: neurokraneoa eta errai kraneoa.',
        }),
        L(0, 'Neurokraneoa entzefaloaren inguruko hezurrak dira; errai kraneoa, aurpegiaren eskeletoa.', n('3/p3/s1', '3/p3/s2', '3/p4/s1'), ['neurokraneoa', 'errai-kraneoa'], {
          plain: 'Neurokraneoak burmuina babesten du; errai kraneoa aurpegiaren hezurdura da.',
        }),
        L(0.14, 'Gangako hezurrak entzefaloaren goikaldeko eta alboko mesenkimatik sortzen dira.', n('3.1.1/p2/s1'), [], {
          plain: 'Gangako hezurrak burmuinaren gainean eta alboetan dagoen mesenkimatik datoz.',
        }),
        L(0.14, 'Mintzezko hezurtzapena du: zuzenean hezurtzen da, eta hezur lauak eta zapalak dira.', n('3.1.1/p2/s2'), ['hezurtzapen-zentroak', 'hezur-espikulak'], {
          plain: 'Zuzenean bihurtzen da hezur, kartilagorik gabe; hezur lauak dira.',
        }),
        L(0.28, 'Hezur hauek dira: bi hezur frontal, bi hezur parietal eta hezur okzipitalaren ezkata.', n('3.1.1/p3/s1', '3.1.1/p4/s1', '3.1.1/p5/s1'), [
          'hezur-frontala',
          'hezur-parietala',
          'okzipitalaren-ezkata',
        ], { writes: 'b-buruganga', plain: 'Kopetako bi hezur, paretako bi hezur eta garondoko okzipitalaren ezkata.' }),
        L(0.42, 'Joskurak bi hezur lauren arteko ehun konektibozko ildo estuak dira.', n('3.1.1/p8/s1', '3.1.1/p9/s1'), ['joskurak'], {
          tone: 'emphasis',
          plain: 'Joskura bat bi hezurren arteko marra estu bat da, ehun konektibozkoa.',
        }),
        L(0.56, 'Fontanelak, berriz, ildo zabalagoak dira, bi hezur baino gehiago elkartzen diren lekuetan.', n('3.1.1/p10/s1'), ['fontanelak'], {
          writes: 'b-joskurak',
          plain: 'Fontanela bat leku zabalago bat da, hiru hezur edo gehiago elkartzen diren tokian.',
        }),
        L(0.56, 'Aurreko fontanela edo bregma bi frontal eta bi parietalen artean dago, eta 18. hilabetean ixten da.', n('3.1.1/p12/s1'), ['aurreko-fontanela'], {
          plain: 'Bregma kopetako eta paretako hezurren artean dago, eta 18. hilabetean ixten da.',
        }),
        L(0.56, 'Atzeko fontanela edo lambda bi parietalen eta okzipitalaren ezkataren artean dago.', n('3.1.1/p12/s1'), ['atzeko-fontanela', 'okzipitalaren-ezkata'], {
          plain: 'Lambda paretako hezurren eta garondoko okzipitalaren ezkataren artean dago.',
        }),
        L(0.56, 'Hau lehenago ixten da: lehen edo bigarren hilabetean.', n('3.1.1/p12/s1'), ['atzeko-fontanela'], {
          writes: 'b-fontanelak',
          plain: 'Lambda askoz lehenago ixten da, bizitzako lehen hilabeteetan.',
        }),
        L(0.68, 'Albotik, beste bi fontanela: aurre-albokoa edo esfenoidala, eta atze-albokoa edo tenporala.', n('3.1.1/p13/s1', '3.1.1/p13/s2'), [
          'fontanela-esfenoidala',
          'fontanela-mastoidea',
        ], { plain: 'Alboetan beste bi daude: aurrekoa, esfenoidala, eta atzekoa, tenporala. Bi aldeetan daude.' }),
        L(0.8, 'Joskurek eta fontanelek entzefaloari hazten uzten diote; erditzean, gainera, hezur plakak gainjarri egiten dira.', n('3.1.1/p14/s1', '3.1.1/p14/s2'), ['joskurak', 'fontanelak'], {
          tone: 'why',
          plain: 'Hezurren arteko tarte hauei esker burmuina hazi daiteke, eta erditzean buruak tokia egiten du.',
        }),
      ],
      board: [
        { id: 'b-burezurra', kind: 'line', text: 'Burezurra: neurokraneoa (buru-ganga eta kondrokraneoa) eta errai kraneoa (aurpegia)', notes: n('3/p2/s1', '3/p3/s1', '3/p3/s3', '3/p3/s4', '3/p4/s1'), key: true },
        { id: 'b-buruganga', kind: 'line', text: 'Buru-ganga, mintzezkoa: 2 frontal, 2 parietal, okzipitalaren ezkata', notes: n('3.1.1/p2/s2', '3.1.1/p3/s1', '3.1.1/p4/s1', '3.1.1/p5/s1'), key: true },
        { id: 'b-joskurak', kind: 'line', text: 'Joskurak: ildo estuak. Fontanelak: ildo zabalak, bi hezur baino gehiagoren artean', notes: n('3.1.1/p9/s1', '3.1.1/p10/s1') },
        { id: 'b-fontanelak', kind: 'line', text: 'Bregma: 18. hilabetean ixten da. Lambda: 1.–2. hilabetean', notes: n('3.1.1/p12/s1'), key: true },
      ],
      checks: [
        { kind: 'pool', id: 'w8-q-joskura-fontanela', after: 6 },
        {
          kind: 'contrast',
          id: 'klasea:8/fontanelen-itxiera',
          concept: 'aurreko-fontanela',
          q: 'Bregma eta lambda: zein ixten da lehenago?',
          options: ['Lambda, lehen edo bigarren hilabetean; bregma 18. hilabetean', 'Bregma lehenago; lambda 18. hilabetean', 'Biak batera, jaiotzean'],
          answer: 0,
          why: ['Bai: lambda lehen hilabeteetan ixten da, bregma askoz beranduago.', 'Ez: alderantziz da.', 'Ez: jaiotzean biak zabalik daude.'],
          notes: n('3.1.1/p12/s1'),
        },
      ],
    },

    {
      id: 'kondrokraneoa',
      title: 'Kondrokraneoa',
      stage: 'kondrokraneoa',
      lines: [
        L(0, 'Kondrokraneoa neurokraneoaren oinaldean dago: kutxaren zorua da.', n('3.1.2/p2/s1'), ['kondrokraneoa'], {
          plain: 'Kondrokraneoa burezurraren zorua da, burmuinaren azpian.',
        }),
        L(0, 'Hezurtzapen endokondralaren bidez sortzen da: mesenkimatik kartilagoa, eta kartilagotik hezurra.', n('3.1.2/p2/s2'), ['kondrokraneoa'], {
          tone: 'emphasis',
          writes: 'b-kondro',
          plain: 'Hemen lehenik kartilagoa egiten da, eta gero kartilago hori hezur bihurtzen da.',
        }),
        L(0.235, 'Atzealdean kartilago parakordalak daude, bat eskuinean eta bestea ezkerrean.', n('3.1.2/p5/s3', '3.1.2/p5/s4'), ['kartilago-parakordalak'], {
          plain: 'Atzean bi kartilago parakordal daude, eskuinekoa eta ezkerrekoa.',
        }),
        L(0.235, 'Hiru somita okzipitalen eta lehen lepoko somitaren esklerotometatik sortzen dira.', n('3.1.2/p5/s3'), ['kartilago-parakordalak'], {
          plain: 'Garondoko hiru somitetatik eta lepoko lehenengotik datoz.',
        }),
        L(0.26, 'Haietatik hezur okzipitalaren oinaldea eratzen da, lamina basilarra.', n('3.1.2/p5/s5'), ['okzipitalaren-oinaldea'], {
          plain: 'Hortik okzipitalaren oinaldea egiten da.',
        }),
        L(0.26, 'Kontuz: okzipitalak bi atal ditu. Ezkata mintzezkoa da; oinaldea, berriz, endokondrala.', n('3.1.2/p5/s6'), ['okzipitalaren-ezkata', 'okzipitalaren-oinaldea'], {
          tone: 'caution',
          plain: 'Kontuz: okzipitalaren ezkata zuzenean hezurtzen da, eta oinaldea kartilagotik.',
        }),
        L(0.36, 'Haien aurrean hipofisi kartilagoak daude: hortik esfenoides hezurraren gorputza.', n('3.1.2/p5/s8', '3.1.2/p5/s9'), ['hipofisi-kartilagoak', 'esfenoidesaren-gorputza'], {
          plain: 'Aurrerago hipofisi kartilagoak: hortik esfenoidesaren gorputza egiten da.',
        }),
        L(0.36, 'Gorputz horren goiko aurpegian hipofisi hoditxoa dago, hipofisi guruina hartuko duena.', n('3.1.2/p5/s10'), ['hipofisi-hobitxoa', 'hipofisi-guruina'], {
          plain: 'Haren gainean zulo txiki bat dago, hipofisi hoditxoa, eta hor egongo da hipofisi guruina.',
        }),
        L(0.46, 'Aurrerago trenkada kranialak daude: hauetatik etmoides hezurra sortzen da.', n('3.1.2/p5/s12', '3.1.2/p5/s13'), ['trenkada-kranialak', 'etmoidesa'], {
          writes: 'b-erdikoa',
          plain: 'Aurrealdean trenkada kranialak: hortik etmoides hezurra.',
        }),
        L(0.59, 'Alboetan beste bi plaka daude. Atzealdean kapsula periotikoa: tenporalaren harkaitza eta atal mastoideoa.', n('3.1.2/p6/s1'), ['kapsula-periotikoa', 'harkaitza'], {
          plain: 'Alboetako plaketan, atzean, kapsula periotikoa: hortik tenporalaren harkaitza.',
        }),
        L(0.59, 'Harkaitzean barneko belarria kokatuko da.', n('3.1.2/p6/s1'), ['harkaitza', 'barne-belarria'], {
          plain: 'Harkaitzaren barruan egongo da barneko belarria.',
        }),
        L(0.7, 'Aurrerago hego tenporala: esfenoidesaren hego handia. Haren aurrean begizulo hegoa: hego txikiak.', n('3.1.2/p6/s2', '3.1.2/p6/s3'), [
          'hego-tenporala',
          'esfenoidesaren-hego-handia',
          'begizulo-hegoa',
          'esfenoidesaren-hego-txikia',
        ], { writes: 'b-alboak', plain: 'Hego tenporaletik esfenoidesaren hego handia; begizulo hegotik, hego txikiak.' }),
        L(0.87, 'Plaka horiek fusionatzean, oinaldean zuloak geratzen dira, eta haietatik 12 bikote nerbio kraneal pasatzen dira.', n('3.1.2/p8/s1', '3.1.2/p8/s2', '3.1.2/p8/s4'), [
          'burezurreko-zuloak',
          'nerbio-kranialak',
        ], { plain: 'Zatiak elkartzean zuloak gelditzen dira: hortik ateratzen dira 12 nerbio kraneal bikoteak.' }),
      ],
      board: [
        { id: 'b-kondro', kind: 'line', text: 'Kondrokraneoa: oinaldea, endokondrala (mesenkima, kartilagoa, hezurra)', notes: n('3.1.2/p2/s1', '3.1.2/p2/s2'), key: true },
        {
          id: 'b-erdikoa',
          kind: 'line',
          text: 'Erdiko plaka, atzetik aurrera: parakordalak (okzipitalaren oinaldea), hipofisi kartilagoak (esfenoidesaren gorputza), trenkadak (etmoidesa)',
          notes: n('3.1.2/p5/s1', '3.1.2/p5/s5', '3.1.2/p5/s9', '3.1.2/p5/s13'),
          key: true,
        },
        {
          id: 'b-alboak',
          kind: 'line',
          text: 'Alboko plakak: kapsula periotikoa (harkaitza), hego tenporala (hego handia), begizulo hegoa (hego txikia)',
          notes: n('3.1.2/p6/s1', '3.1.2/p6/s2', '3.1.2/p6/s3'),
          key: true,
        },
      ],
      checks: [
        {
          kind: 'contrast',
          id: 'klasea:8/okzipitala',
          concept: 'okzipitalaren-oinaldea',
          q: 'Okzipitalaren ezkata eta oinaldea: nola hezurtzen da bakoitza?',
          options: ['Ezkata mintzezkoa; oinaldea endokondrala', 'Ezkata endokondrala; oinaldea mintzezkoa', 'Biak endokondralak, kondrokraneoan'],
          answer: 0,
          why: ['Bai: ezkata buru-gangakoa da; oinaldea kartilago parakordaletatik dator.', 'Ez: alderantziz da.', 'Ez: ezkata buru-gangakoa da, mintzezkoa.'],
          notes: n('3.1.2/p5/s6'),
          after: 5,
        },
        { kind: 'pool', id: 'w8-q-kondrokraneoa-esfenoidea' },
      ],
    },

    {
      id: 'arkuak',
      title: 'Faringe arkuetako kartilagoak',
      stage: 'errai-kraneoa',
      lines: [
        L(0, 'Errai kraneoa aurpegiko hezurrak dira.', n('3.2/p2/s1'), [], {
          plain: 'Errai kraneoa aurpegiaren hezurdura da.',
        }),
        L(0, 'Lepo mailaren bi aldeetan faringe arkuak agertzen dira: mesenkimazko goraguneak.', n('3.2/p3/s1', '3.2/p3/s2'), ['faringe-arkuak'], {
          plain: 'Lepoaren bi aldeetan koskor batzuk sortzen dira: faringe arkuak.',
        }),
        L(0, 'Haietara gandor neuraleko zelulak iristen dira, eta haien mesenkimatik aurpegiko hezurrak garatzen dira, ez mesodermotik.', n('3.2/p3/s4'), ['gandor-neurala', 'faringe-arkuak'], {
          tone: 'emphasis',
          writes: 'b-aurpegia',
          plain: 'Arku horietara gandor neuraleko zelulak heltzen dira, eta haiek egiten dituzte aurpegiko hezurrak.',
        }),
        L(0.09, 'Errai kraneoko hezurrak lehen bi arkuetatik sortzen dira.', n('3.2/p4/s1'), [], {
          plain: 'Aurpegiko hezurrak lehen bi arkuetatik datoz.',
        }),
        L(0.09, 'Lehen arkuak bi atal ditu: atal dortsala, prozesu maxilarra, eta atal bentrala, barail prozesua.', n('3.2/p5/s1', '3.2/p6/s1', '3.2/p12/s1'), ['prozesu-maxilarra', 'barail-prozesua'], {
          plain: 'Lehen arkua bitan banatzen da: prozesu maxilarra gainean eta barail prozesua azpian.',
        }),
        L(0.18, 'Prozesu maxilarrean, gandor neuraleko zelulek barra pterigopalatino karratua sortzen dute.', n('3.2/p6/s2'), [
          'prozesu-maxilarra',
          'barra-pterigopalatino-karratua',
          'gandor-neurala',
        ], { plain: 'Prozesu maxilarrean kartilago bat egiten da: barra pterigopalatino karratua.' }),
        L(0.27, 'Barail prozesuan, berriz, Meckel kartilagoa.', n('3.2/p12/s2'), ['barail-prozesua', 'meckel-kartilagoa'], {
          plain: 'Barail prozesuan beste kartilago bat: Meckel kartilagoa.',
        }),
        L(0.36, 'Barail prozesutik eta bigarren arkuaren mesenkimatik Reichert kartilagoa sortzen da.', n('3.2/p15/s1'), ['barail-prozesua', 'hioide-arkua', 'reichert-kartilagoa'], {
          writes: 'b-kartilagoak',
          plain: 'Hirugarren kartilagoa, Reichert kartilagoa, barail prozesutik eta bigarren arkutik dator.',
        }),
      ],
      board: [
        { id: 'b-aurpegia', kind: 'line', text: 'Aurpegiko hezurrak: faringe arkuetako gandor neuraletik, ez mesodermotik', notes: n('3.2/p3/s4'), key: true },
        { id: 'b-kartilagoak', kind: 'line', text: 'Prozesu maxilarra: barra pterigopalatino karratua. Barail prozesua: Meckel. Barail prozesua eta bigarren arkua: Reichert', notes: n('3.2/p6/s2', '3.2/p12/s2', '3.2/p15/s1'), key: true },
      ],
      checks: [
        {
          kind: 'contrast',
          id: 'klasea:8/meckel-reichert',
          concept: 'meckel-kartilagoa',
          q: 'Meckel eta Reichert kartilagoak: nondik sortzen da bakoitza?',
          options: [
            'Meckel barail prozesuan; Reichert barail prozesutik eta bigarren arkutik',
            'Meckel prozesu maxilarrean; Reichert lehen arkutik bakarrik',
            'Biak prozesu maxilarrean',
          ],
          answer: 0,
          why: ['Bai: Meckel barail prozesuan sortzen da; Reichertek bigarren arkuaren mesenkima ere badu.', 'Ez: prozesu maxilarrean barra pterigopalatino karratua sortzen da.', 'Ez: prozesu maxilarrean barra pterigopalatino karratua bakarrik.'],
          notes: n('3.2/p6/s2', '3.2/p12/s2', '3.2/p15/s1'),
        },
      ],
    },

    {
      id: 'aurpegia',
      title: 'Belarriko hezurtxoak eta aurpegia',
      stage: 'errai-kraneoa',
      lines: [
        L(0.49, 'Barra pterigopalatino karratutik bitarteko belarriko hezurtxo bat garatzen da: ingudea.', n('3.2/p6/s2'), ['barra-pterigopalatino-karratua', 'ingudea'], {
          plain: 'Barra pterigopalatino karratutik belarriko hezurtxo bat: ingudea.',
        }),
        L(0.49, 'Haren inguruko mesenkimatik goiko maxilarra, hezur malarrak eta tenporalaren ezkata sortzen dira.', n('3.2/p10/s1'), ['goiko-maxilarra', 'hezur-malarra', 'tenporalaren-ezkata'], {
          plain: 'Inguruan dagoen mesenkimatik goiko maxilarra, hezur malarrak eta tenporalaren ezkata.',
        }),
        L(0.49, 'Ezkata horretatik estiloide apofisia irteten da.', n('3.2/p11/s1'), ['tenporalaren-ezkata', 'apofisi-estiloidea'], {
          plain: 'Ezkata horretatik estiloide apofisia ateratzen da.',
        }),
        L(0.56, 'Meckel kartilagotik mailua garatzen da; haren inguruko mesenkimatik, beheko maxilarra edo baraila.', n('3.2/p12/s2', '3.2/p14/s1'), ['meckel-kartilagoa', 'mailua', 'beheko-maxilarra'], {
          tone: 'emphasis',
          plain: 'Meckel kartilagotik mailua; inguruko mesenkimatik, baraila.',
        }),
        L(0.68, 'Reichert kartilagotik hirugarren hezurtxoa: ointokia edo estriboa.', n('3.2/p15/s1'), ['reichert-kartilagoa', 'ointokia'], {
          plain: 'Reichert kartilagotik hirugarren hezurtxoa: ointokia.',
        }),
        L(0.74, 'Beraz, hiru hezurtxoak hiru kartilagotatik datoz: mailua Meckeletik, ingudea barratik eta ointokia Reichertetik.', n('3.2/p6/s2', '3.2/p12/s2', '3.2/p15/s1'), ['mailua', 'ingudea', 'ointokia'], {
          tone: 'emphasis',
          plain: 'Hiru hezurtxo, hiru kartilago: mailua Meckeletik, ingudea barratik, ointokia Reichertetik.',
        }),
        L(0.82, 'Jaiotzean aurpegia txikia da, bi arrazoirengatik.', n('3.2/p16/s1', '3.2/p16/s2'), [], {
          plain: 'Jaioberriaren aurpegia oso txikia da, bi arrazoirengatik.',
        }),
        L(0.865, 'Sudur alboko sinuak eta maxilarretako apofisi albeolarrak ez daude oraindik garatuta.', n('3.2/p17/s1', '3.2/p18/s1'), ['sinu-paranasalak', 'apofisi-albeolarrak', 'goiko-maxilarra'], {
          plain: 'Sudurraren ondoko aire hutsuneak eta hortzen hezurra ez daude oraindik eginda.',
        }),
        L(0.865, 'Apofisi albeolarretan hortzak txertatzen dira, eta hortzekin batera garatzen dira; horrela maxilarrak handitu egiten dira.', n('3.2/p18/s2'), [
          'apofisi-albeolarrak',
          'goiko-maxilarra',
          'beheko-maxilarra',
        ], { plain: 'Hortzak hazten diren heinean, haien hezurra ere hazten da, eta maxilarrak handitzen dira.' }),
        L(0.865, 'Sinuak eta apofisi albeolarrak garatzean, errai kraneoko hezurrak handitu egiten dira.', n('3.2/p19/s1'), ['sinu-paranasalak', 'apofisi-albeolarrak'], {
          tone: 'why',
          plain: 'Bi gauza horiek hazten direnean, aurpegia handitzen da.',
        }),
        L(0.92, 'Gogoratu: errai kraneoko hezur guztiak eta neurokraneoaren aurrealdekoak gandor neuraletik datoz.', n('3.2/p19/s1'), ['gandor-neurala', 'hezur-frontala'], {

          tone: 'emphasis',
          plain: 'Aurpegiko hezur guztiak eta burezurraren aurrealdekoak gandor neuraletik datoz.',
        }),
        L(0.92, 'Atzealdekoak, berriz, mesodermo paraxialetik. Kondrokraneoan berdin gertatzen da.', n('3.2/p19/s1', '3.2/p20/s2'), ['hezur-parietala', 'okzipitalaren-ezkata'], {
          writes: 'b-jatorria',
          plain: 'Atzealdekoak mesodermo paraxialetik. Burezurraren zoruan ere horrela da.',
        }),
      ],
      board: [
        { id: 'b-jatorria', kind: 'line', text: 'Errai kraneoa eta neurokraneoaren aurrealdea: gandor neurala. Atzealdea: mesodermo paraxiala', notes: n('3.2/p19/s1', '3.2/p20/s2'), key: true },
        TABLE,
      ],
      checks: [
        {
          kind: 'contrast',
          id: 'klasea:8/hezurtxoak',
          concept: 'ingudea',
          q: 'Mailua eta ingudea: zein kartilagotik dator bakoitza?',
          options: ['Mailua Meckel kartilagotik; ingudea barra pterigopalatino karratutik', 'Mailua barra pterigopalatino karratutik; ingudea Meckel kartilagotik', 'Biak Reichert kartilagotik'],
          answer: 0,
          why: ['Bai: Meckel barail prozesuan dago; barra, prozesu maxilarrean.', 'Ez: alderantziz da.', 'Ez: Reichert kartilagotik ointokia bakarrik.'],
          notes: n('3.2/p6/s2', '3.2/p12/s2'),
          after: 5,
        },
        { kind: 'pool', id: 'mikro:8/errai-kraneoa:10' },
      ],
    },

    {
      id: 'adarrak',
      title: 'Gorputz-adarrak',
      stage: 'gorputz-adarrak',
      lines: [
        L(0, 'Laugarren astean goiko eta beheko gorputz-adarrak garatzen hasten dira: hasieran zilindrikoak, gero luzatu egiten dira.', n('4/p3/s1'), [
          'goiko-gorputz-adarraren-hasikina',
          'beheko-gorputz-adarraren-hasikina',
        ], { plain: 'Laugarren astean besoak eta hankak hasten dira: lehenik hodi txikiak, gero luzeagoak.' }),
        L(0, 'Erdigunean pareta orriko zelula mesodermikoak daude, kanpotik ektodermoz estalita.', n('4/p3/s3'), ['gorputz-adarren-mesenkima'], {
          plain: 'Barruan pareta orriko mesodermoa dago; kanpoan, ektodermoa.',
        }),
        L(0.12, 'Hastapenen erpinean ektodermoa loditu egiten da: erpineko ektodermo ertza.', n('4/p3/s4'), ['erpineko-ektodermo-ertza'], {
          plain: 'Puntan ektodermoa lodiagoa egiten da: erpineko ektodermo ertza.',
        }),
        L(0.22, 'Seigarren astean esku eta oin plakak agertzen dira, eta lehen hertsadurak bi zati bereizten ditu.', n('4/p5/s2', '4/p5/s3'), ['esku-plaka', 'oin-plaka'], {
          plain: 'Seigarren astean puntak zapaldu egiten dira: esku eta oin plakak.',
        }),
        L(0.45, 'Esku plaketan lau ildo erradiatu agertzen dira, zelula batzuen apoptosiaren bidez.', n('4/p5/s6', '4/p5/s7'), ['esku-plaka', 'izpiarteko-ildoak', 'apoptosia'], {
          plain: 'Plaketan lau ildo agertzen dira, zelula batzuk programatuta hiltzen direlako.',
        }),
        L(0.45, 'Ildoen artean hatzetako izpiak gelditzen dira: hortik eskuetan hatzak, eta oinetan behatzak.', n('4/p5/s8', '4/p5/s9', '4/p5/s10'), ['hatzetako-izpiak'], {
          writes: 'b-hatzak',
          plain: 'Ildoen artean gelditzen dena hatz bihurtzen da, eskuetan eta oinetan.',
        }),
        L(0.56, 'Seigarren asterako lehen kartilagoak agertzen dira, gorputz-adarretako mesenkimatik.', n('4/p6/s1'), [
          'humeroa',
          'erradioa',
          'ulna',
          'eskuko-kartilagoak',
          'falangeak',
          'femurra',
          'tibia',
          'peroneoa',
          'tartsoaren-kartilagoak',
          'metatartsoaren-kartilagoak',
          'iliona',
          'iskiona',
          'pubisa',
        ], { plain: 'Seigarren asterako lehen kartilagoak ikusten dira: geroago hezur izango direnak.' }),
        L(0.56, 'Beraz, gorputz-adarretako hezurrak hezurtzapen endokondralez sortzen dira.', n('4/p6/s3'), [], {
          tone: 'emphasis',
          writes: 'b-adarrak',
          plain: 'Beraz, besoetako eta hanketako hezurrak kartilagotik egiten dira.',
        }),
        L(0.66, 'Zortzigarren asterako, kartilago horien erdiko ataletan hezurtzapen zentroak agertzen dira.', n('4/p8/s1'), ['hezurtzapen-zentroak'], {
          plain: 'Zortzigarren asterako, kartilagoen erdian hezurra egiten hasten da.',
        }),
        L(0.76, 'Zortzigarren astean gorputz-adarrek kontrako biraketak egiten dituzte.', n('4/p8/s2'), [], {
          plain: 'Zortzigarren astean besoek eta hankek kontrako aldera biratzen dute.',
        }),
        L(0.76, 'Goikoek laurogeita hamar gradu biratzen dute albora, kanpora.', n('4/p9/s1'), [], {
          plain: 'Besoek kanpora biratzen dute, angelu zuzen bat.',
        }),
        L(0.76, 'Ondorioz, aurreko aldean muskulu tolestatzaileak gelditzen dira, eta atzean eta alboetan hedatzaileak.', n('4/p9/s2', '4/p9/s3'), [
          'muskulu-tolestatzaileak',
          'muskulu-hedatzaileak',
        ], { writes: 'b-goikoak', plain: 'Besoan, tolesteko muskuluak aurrean gelditzen dira, eta luzatzekoak atzean.' }),
        L(0.88, 'Behekoek kontrako biraketa egiten dute: laurogeita hamar gradu erdialderantz, barrurantz.', n('4/p10/s1', '4/p10/s3'), [], {
          plain: 'Hankek alderantziz biratzen dute, barrurantz.',
        }),
        L(0.88, 'Horregatik hankan hedatzaileak aurrean daude, eta tolestatzaileak atzealdean.', n('4/p10/s3'), ['muskulu-hedatzaileak', 'muskulu-tolestatzaileak'], {
          tone: 'emphasis',
          writes: 'b-behekoak',
          plain: 'Hankan, luzatzeko muskuluak aurrean daude, eta tolestekoak atzean.',
        }),
      ],
      board: [
        { id: 'b-hatzak', kind: 'line', text: 'Plaketan 4 ildo erradiatu (apoptosia); tartean hatzetako izpiak', notes: n('4/p5/s6', '4/p5/s7', '4/p5/s8'), key: true },
        { id: 'b-adarrak', kind: 'line', text: '6. asterako kartilagoak: gorputz-adarretako hezurrak endokondralak', notes: n('4/p6/s1', '4/p6/s3'), key: true },
        { id: 'b-goikoak', kind: 'line', text: 'Goikoak 90° albora: tolestatzaileak aurrean, hedatzaileak atzean', notes: n('4/p9/s1', '4/p9/s2', '4/p9/s3'), key: true },
        { id: 'b-behekoak', kind: 'line', text: 'Behekoak 90° erdialdera: hedatzaileak aurrean, tolestatzaileak atzean', notes: n('4/p10/s3'), key: true },
      ],
      checks: [
        { kind: 'pool', id: 'mikro:8/gorputz-adarrak:4', after: 6 },
        {
          kind: 'contrast',
          id: 'klasea:8/biraketak',
          concept: 'muskulu-tolestatzaileak',
          q: 'Goiko eta beheko gorputz-adarrak: nora biratzen du bakoitzak?',
          options: ['Goikoak albora, kanpora; behekoak erdialdera, barrura', 'Goikoak erdialdera; behekoak albora', 'Biak albora, kanpora'],
          answer: 0,
          why: ['Bai: horregatik besoan tolestatzaileak aurrean daude, eta hankan hedatzaileak.', 'Ez: alderantziz da.', 'Ez: biraketak kontrakoak dira.'],
          notes: n('4/p9/s1', '4/p10/s3'),
        },
      ],
    },

    {
      id: 'hezurluzeak',
      title: 'Hezur luzeak',
      stage: 'hezur-luzeak',
      lines: [
        L(0, 'Hamabigarren asterako, hezur luze guztien erdiko atalean hezurtzapen zentro primarioak agertzen dira.', n('4/p12/s1'), ['hezurtzapen-zentroak'], {
          plain: 'Hamabigarren asterako, hezur luze bakoitzaren erdian hezurtzen hasten da.',
        }),
        L(0.14, 'Hezur luzeek bi atal dituzte: diafisia, erdiko gorputza, eta epifisiak, muturrak.', n('4/p12/s2', '4/p13/s1', '4/p14/s1'), ['diafisia', 'epifisiak'], {
          writes: 'b-atalak',
          plain: 'Hezur luzearen erdiko zatia diafisia da; bi muturrak, epifisiak.',
        }),
        L(0.26, 'Hasieran, zentro primarioak diafisia hezurtzen du, zentrotik ertzetaraino.', n('4/p16/s1'), ['diafisia'], {
          plain: 'Lehenik diafisia hezurtzen da, zentrotik muturretarantz.',
        }),
        L(0.26, 'Epifisiak, aldiz, kartilaginotsuak dira jaiotza arte.', n('4/p17/s1'), ['epifisiak'], {
          plain: 'Muturrak, epifisiak, kartilagoa dira jaio arte.',
        }),
        L(0.26, 'Beraz, jaiotzean diafisiak hezurtuta daude, eta epifisiak ez.', n('4/p18/s1'), ['diafisia', 'epifisiak'], {
          tone: 'emphasis',
          writes: 'b-jaiotza',
          plain: 'Jaiotzean diafisia hezurra da, baina muturrak ez.',
        }),
        L(0.42, 'Jaio ondoren, epifisietan hezurtzapen zentro sekundarioak agertzen dira.', n('4/p19/s1'), ['hezurtzapen-zentro-sekundarioak', 'epifisiak'], {
          plain: 'Jaio ondoren muturretan beste zentro batzuk agertzen dira, eta haiek ere hezurtzen dira.',
        }),
        L(0.56, 'Diafisiaren eta epifisiaren artean eskualde bat hezurtu gabe gelditzen da: hazkuntza plaka edo metafisia.', n('4/p20/s1'), ['hazkuntza-plaka', 'diafisia'], {
          plain: 'Diafisiaren eta muturraren artean marra bat gelditzen da hezurtu gabe: hazkuntza plaka.',
        }),
        L(0.56, 'Ez da hezurtzen, hezurra luzetara hazi dadin.', n('4/p20/s2'), ['hazkuntza-plaka'], {
          tone: 'why',
          writes: 'b-plaka',
          plain: 'Plaka horri esker hezurra luzatu egiten da.',
        }),
        L(0.72, 'Hazkuntza maximoa lortzean metafisia desagertu egiten da, eta diafisia epifisiekin fusionatzen da.', n('4/p20/s3'), ['hazkuntza-plaka', 'diafisia', 'epifisiak'], {
          plain: 'Hazten bukatzean plaka desagertzen da, eta hezurraren zatiak elkartu egiten dira.',
        }),
        L(0.84, 'Normalean bi hazkuntza plaka daude, bi muturretan: femurrean, adibidez.', n('4/p21/s1'), ['hazkuntza-plaka', 'femurra'], {
          plain: 'Gehienetan bi plaka daude, mutur bakoitzean bat, femurrean bezala.',
        }),
        L(0.84, 'Falangeetan, berriz, plaka bakarra dago: mutur bakarretik hazten dira.', n('4/p22/s1'), ['falangeak', 'hazkuntza-plaka'], {
          plain: 'Hatzetako hezurretan plaka bakarra dago.',
        }),
      ],
      board: [
        { id: 'b-atalak', kind: 'line', text: 'Hezur luzea: diafisia (erdiko gorputza) eta epifisiak (muturrak)', notes: n('4/p13/s1', '4/p14/s1'), key: true },
        { id: 'b-jaiotza', kind: 'line', text: 'Jaiotzean: diafisiak hezurtuta, epifisiak kartilaginotsuak', notes: n('4/p18/s1'), key: true },
        { id: 'b-plaka', kind: 'line', text: 'Hazkuntza plaka (metafisia): ez da hezurtzen, luzetarako hazkuntza', notes: n('4/p20/s1', '4/p20/s2'), key: true },
      ],
      checks: [
        {
          kind: 'contrast',
          id: 'klasea:8/zentroak',
          concept: 'hezurtzapen-zentro-sekundarioak',
          q: 'Zentro primarioak eta sekundarioak: non agertzen dira?',
          options: ['Primarioak diafisian, 12. asterako; sekundarioak epifisietan, jaio ondoren', 'Primarioak epifisietan; sekundarioak diafisian', 'Biak diafisian, 12. asterako'],
          answer: 0,
          why: ['Bai: jaiotzean diafisiak hezurtuta daude; epifisiak gero hezurtzen dira.', 'Ez: alderantziz da.', 'Ez: sekundarioak epifisietan agertzen dira.'],
          notes: n('4/p12/s1', '4/p19/s1'),
        },
        { kind: 'pool', id: 'w8-q-zentro-sekundarioak' },
      ],
    },

    {
      id: 'ornoa',
      title: 'Ornoaren atalak',
      stage: 'ornoa',
      lines: [
        L(0.06, 'Orno gorputza ornoaren aurreko atala da, bentralerantz kokatua.', n('5.1/p2/s1'), ['orno-gorputza'], {
          plain: 'Ornoaren aurreko zati lodia orno gorputza da.',
        }),
        L(0.14, 'Orno arkua, edo arku neurala, gorputzaren atze-alboko zatian dago.', n('5.1/p3/s1'), ['orno-arkua'], {
          plain: 'Orno arkua gorputzaren atzean eta alboetan dago.',
        }),
        L(0.26, 'Arkutik hainbat apofisi irteten dira. Alboetara, apofisi zeharrak.', n('5.1/p3/s2'), ['apofisi-zeharrak'], {
          plain: 'Arkutik zenbait punta ateratzen dira. Alboetara doazenak apofisi zeharrak dira.',
        }),
        L(0.36, 'Atzealdera, arantza apofisia: bizkarrean ikusten duguna.', n('5.1/p3/s2'), ['arantza-apofisia'], {
          plain: 'Atzera doana arantza apofisia da: bizkarrean ukitzen duguna.',
        }),
        L(0.46, 'Eta, azkenik, apofisi artikularrak.', n('5.1/p3/s2'), ['apofisi-artikularrak'], {
          writes: 'b-ornoa',
          plain: 'Azkenik, apofisi artikularrak, ornoak elkarrekin lotzeko.',
        }),
        L(0.56, 'Gorputzaren eta arkuaren artean zulo bat gelditzen da: orno zuloa.', n('5.3/p2/s1'), ['orno-zuloa'], {
          plain: 'Gorputzaren eta arkuaren artean zulo bat dago: orno zuloa.',
        }),
        L(0.66, 'Orno guztien zuloek hodi errakideoa eratzen dute, eta hor ornomuina kokatzen da.', n('5.3/p3/s1', '5.1/p4/s1'), ['hodi-errakideoa', 'ornomuina'], {
          tone: 'emphasis',
          writes: 'b-hodia',
          plain: 'Zulo guztiak bata bestearen gainean hodi bat dira, eta haren barruan ornomuina dago.',
        }),
        L(0.66, 'Ornomuinean, goitik behera, segmentuak daude: lepokoak, bizkarrekoak eta gerrikoak.', n('5.3/p3/s1'), ['ornomuina'], {
          plain: 'Ornomuina zatika dago: lepokoak, bizkarrekoak eta gerrikoak.',
        }),
        L(0.78, 'Segmentu bakoitzarekin nerbio espinal bikote bat erlazionatzen da.', n('5.3/p3/s1'), ['nerbio-espinalak'], {
          plain: 'Zati bakoitzetik bi nerbio espinal ateratzen dira, bat alde bakoitzera.',
        }),
        L(0.78, 'Nerbio horiek ornoarteko zuloetatik irteten dira, diskoen mailan.', n('5.3/p3/s2'), ['nerbio-espinalak', 'ornoarteko-zuloak'], {
          writes: 'b-nerbioak',
          plain: 'Nerbioak ornoen arteko zuloetatik ateratzen dira.',
        }),
      ],
      board: [
        {
          id: 'b-ornoa',
          kind: 'line',
          text: 'Ornoa: gorputza aurrean; arkua atze-alboan; apofisi zeharrak, arantza apofisia, apofisi artikularrak',
          notes: n('5.1/p2/s1', '5.1/p3/s1', '5.1/p3/s2'),
          key: true,
        },
        { id: 'b-hodia', kind: 'line', text: 'Orno zuloak: hodi errakideoa, ornomuina barruan', notes: n('5.3/p2/s1', '5.3/p3/s1'), key: true },
        { id: 'b-nerbioak', kind: 'line', text: 'Nerbio espinalak: ornoarteko zuloetatik', notes: n('5.3/p3/s2') },
      ],
      checks: [
        {
          kind: 'contrast',
          id: 'klasea:8/zuloak',
          concept: 'orno-zuloa',
          q: 'Orno zuloa eta ornoarteko zuloak: zer igarotzen da bakoitzetik?',
          options: [
            'Orno zuloetatik ornomuina, hodi errakideoan; ornoarteko zuloetatik nerbio espinalak',
            'Orno zuloetatik nerbio espinalak; ornoarteko zuloetatik ornomuina',
            'Bietatik ornomuina',
          ],
          answer: 0,
          why: ['Bai: orno zuloek hodi errakideoa egiten dute; nerbioak ornoen artetik ateratzen dira.', 'Ez: alderantziz da.', 'Ez: ornoarteko zuloetatik nerbioak ateratzen dira.'],
          notes: n('5.3/p3/s1', '5.3/p3/s2'),
        },
        { kind: 'pool', id: 'mikro:8/ornoa:1' },
      ],
    },

    {
      id: 'bizkarrezurra',
      title: 'Birsegmentazioa',
      stage: 'bizkarrezurra',
      lines: [
        L(0, 'Somitetako zelulak berdinak dira hasieran, baina gero miotoma, dermatoma eta esklerotoma bereizten dira.', n('5.2/p2/s1', '5.2/p2/s2'), ['somitak', 'miotoma', 'dermatoma', 'esklerotoma'], {
          plain: 'Somitako zelulak hasieran berdinak dira; gero hiru taldetan banatzen dira.',
        }),
        L(0.08, 'Laugarren astean esklerotomako zelulak erdialdera migratzen dute, hodi neurala eta notokorda inguratzeko.', n('5.2.1/p2/s1'), ['esklerotoma', 'hodi-neurala', 'notokorda'], {
          plain: 'Laugarren astean esklerotomako zelulak erdira doaz, hodi neurala eta notokorda inguratzera.',
        }),
        L(0.08, 'Hor mesenkima zutabea sortzen da, edo esklerotoma zutabea.', n('5.2.1/p2/s1'), ['mesenkima-zutabea'], {
          writes: 'b-zutabea',
          plain: 'Horrela mesenkima zutabea egiten da.',
        }),
        L(0.17, 'Zutabean segmentuak bereizten dira, eta haien artean segmentu arteko mesenkima.', n('5.2/p4/s2', '5.2.1/p2/s2'), ['esklerotoma-segmentuak', 'segmentu-arteko-mesenkima'], {
          plain: 'Zutabean zati trinkoak daude, eta haien artean segmentu arteko mesenkima.',
        }),
        L(0.35, 'Orain gertaera nagusia: birsegmentazioa. Segmentu bakoitza bi erditan banatzen da, goikoa eta behekoa.', n('5.2.1/p2/s5'), ['birsegmentazioa', 'esklerotoma-segmentuak'], {
          tone: 'emphasis',
          plain: 'Orain garrantzitsuena: birsegmentazioa. Segmentu bakoitza bitan zatitzen da, goiko erdia eta beheko erdia.',
        }),
        L(0.44, 'Segmentu baten beheko erdia azpiko segmentuaren goiko erdiarekin fusionatzen da.', n('5.2.1/p3/s1'), ['orno-gorputza'], {
          plain: 'Segmentu baten beheko erdia azpikoaren goiko erdiarekin elkartzen da.',
        }),
        L(0.44, 'Beraz, orno bakoitza bi segmentutatik sortzen da, eta horrela orno gorputzak eratzen dira.', n('5.2.1/p3/s2', '5.2.1/p3/s3'), ['orno-gorputza'], {
          writes: 'b-birsegmentazioa',
          plain: 'Horregatik orno bakoitza bi segmenturen zatiekin egiten da.',
        }),
        L(0.44, 'Horregatik esaten da ornoen jatorria intersegmentarioa dela.', n('5.2.1/p3/s5'), ['orno-gorputza', 'segmentu-arteko-mesenkima'], {
          tone: 'why',
          plain: 'Hori da jatorri intersegmentarioa: ornoa segmentuen artean sortzen da.',
        }),
        L(0.53, 'Erdien artean gelditzen diren zeluletatik ornoarteko diskoa eratzen da.', n('5.2.1/p7/s1'), ['ornoarteko-diskoa'], {
          plain: 'Bi erdien artean gelditzen diren zelulek ornoarteko diskoa egiten dute.',
        }),
        L(0.61, 'Notokorda orno gorputzetan desagertu egiten da, baina diskoetan ez: gune pulposoa sortzen du.', n('5.2.1/p7/s2', '5.2.1/p7/s3'), ['notokorda', 'gune-pulposoa', 'orno-gorputza'], {
          tone: 'emphasis',
          plain: 'Notokorda ornoetan galtzen da, baina diskoetan gelditzen da: gune pulposoa.',
        }),
        L(0.61, 'Haren inguruko mesenkimatik eraztun fibrosoa sortzen da.', n('5.2.1/p7/s4'), ['eraztun-fibrosoa'], {
          writes: 'b-diskoa',
          plain: 'Inguruan, eraztun fibrosoa.',
        }),
        L(0.7, 'Birsegmentazioaren ondorioz, miotomak orno batetik bestera hedatzen dira.', n('5.2.1/p9/s1', '5.2.1/p11/s2'), ['birsegmentazioa', 'miotoma'], {
          plain: 'Birsegmentazioaren ondorioz, muskulu bakoitzak bi orno lotzen ditu.',
        }),
        L(0.7, 'Zergatik? Muskuluek bizkarrezurra mugitu behar dutelako. Nerbio espinalekin gauza bera gertatzen da.', n('5.2.1/p11/s2', '5.2.1/p11/s1'), ['miotoma', 'nerbio-espinalak'], {
          tone: 'why',
          plain: 'Horrela muskuluek bizkarrezurra mugi dezakete. Nerbioekin ere berdin.',
        }),
        L(0.84, 'Bizkarrezurraren makurdurak: zifosia primarioa da, jaio aurrekoa, eta atzerantz ganbila.', n('5.2.1/p14/s1'), ['zifosia'], {
          plain: 'Lehen makurdura, zifosia, jaio aurretik dago, eta atzera irteten da.',
        }),
        L(0.84, 'Bi dira: bizkarrekoa eta sakroarena.', n('5.2.1/p14/s2'), ['zifosia'], {
          plain: 'Bizkarrean eta sakroan daude.',
        }),
        L(0.91, 'Lordosia sekundarioa da, jaio ondoren garatzen dena: burua altxatzean lepokoa, eta ibiltzean gerrikoa.', n('5.2.1/p15/s1', '5.2.1/p15/s2'), ['lordosia'], {
          writes: 'b-makurdurak',
          plain: 'Lordosia jaio ondoren dator: lepokoa burua altxatzean, gerrikoa ibiltzen hastean.',
        }),
      ],
      board: [
        { id: 'b-zutabea', kind: 'line', text: '4. astea: esklerotoma erdialdera, mesenkima zutabea', notes: n('5.2.1/p2/s1'), key: true },
        { id: 'b-birsegmentazioa', kind: 'line', text: 'Birsegmentazioa: beheko erdia eta azpikoaren goiko erdia, orno gorputza', notes: n('5.2.1/p2/s5', '5.2.1/p3/s1', '5.2.1/p3/s2'), key: true },
        { id: 'b-diskoa', kind: 'line', text: 'Diskoa: notokordatik gune pulposoa, inguruko mesenkimatik eraztun fibrosoa', notes: n('5.2.1/p7/s3', '5.2.1/p7/s4'), key: true },
        { id: 'b-makurdurak', kind: 'line', text: 'Zifosia: primarioa, jaio aurretik. Lordosia: sekundarioa, jaio ondoren', notes: n('5.2.1/p14/s1', '5.2.1/p15/s1'), key: true },
      ],
      checks: [
        { kind: 'pool', id: 'mikro:8/bizkarrezurra:4', after: 7 },
        {
          kind: 'contrast',
          id: 'klasea:8/gorputza-diskoa',
          concept: 'ornoarteko-diskoa',
          q: 'Orno gorputza eta ornoarteko diskoa: nondik sortzen da bakoitza?',
          options: [
            'Gorputza beheko erdi batetik eta azpikoaren goiko erditik; diskoa erdien arteko zeluletatik',
            'Gorputza segmentu oso batetik; diskoa segmentu arteko mesenkimatik',
            'Biak notokordatik',
          ],
          answer: 0,
          why: ['Bai: hori da birsegmentazioa.', 'Ez: orno bakoitza bi segmentutatik dator.', 'Ez: notokordatik gune pulposoa bakarrik.'],
          notes: n('5.2.1/p3/s1', '5.2.1/p7/s1'),
        },
        { kind: 'pool', id: 'w8-q-makurdurak' },
      ],
    },

    {
      id: 'saihetsak',
      title: 'Saihetsak eta esternoia',
      stage: 'saihetsak',
      lines: [
        L(0, 'Saihetsetan bi atal bereizten dira. Atzeko atala hezurrezkoa da, saihets hezurra; aurrekoa, saihets kartilagoa.', n('5.4/p2/s1', '5.4/p3/s1'), ['saihets-hezurra', 'saihets-kartilagoa'], {
          plain: 'Saihetsak bi zati ditu: atzean hezurra, aurrean kartilagoa.',
        }),
        L(0.14, 'Saihets hezurrak somiten esklerotomatik eratzen dira.', n('5.4/p4/s1'), ['saihets-hezurra', 'esklerotoma'], {

          plain: 'Saihets hezurrak esklerotomatik datoz.',
        }),
        L(0.14, 'Esklerotoma zelula batzuek alboetara migratzen dute, eta somitaren alboko muga gurutzatzen dute.', n('5.4/p4/s2'), ['esklerotoma', 'somitaren-alboko-muga'], {
          tone: 'emphasis',
          plain: 'Esklerotomako zelula batzuk alboetara doaz, eta somitaren alboko muga gainditzen dute.',
        }),
        L(0.28, 'Alboko mesodermoaren paretako orriraino iristen dira, eta bertan saihets hezurrak sortzen dira.', n('5.4/p4/s3', '5.4/p4/s4'), ['paretako-orria', 'saihets-hezurra'], {
          writes: 'b-saihets-hezurra',
          plain: 'Paretako orriraino heltzen dira, eta han saihets hezurrak egiten dituzte.',
        }),
        L(0.42, 'Aurreko atala, saihets kartilagoa, alboko mesodermoaren paretako orritik sortzen da zuzenean.', n('5.4/p5/s1', '5.4/p5/s2'), ['saihets-kartilagoa', 'paretako-orria'], {
          tone: 'caution',
          writes: 'b-saihets-kartilagoa',
          plain: 'Kontuz: saihets kartilagoa paretako orritik dator zuzenean.',
        }),
        L(0.56, 'Bularrezurrarekin antzekoa gertatzen da: paretako orritik kartilagoak agertzen dira goitik behera, eta elkarrekin fusionatzen dira.', n('5.4/p5/s3', '5.4/p5/s4'), [
          'esternoi-barrak',
          'paretako-orria',
        ], { plain: 'Bularrezurra ere paretako orritik dator: kartilago zatiak goitik behera agertu eta elkartu egiten dira.' }),
        L(0.76, 'Bularrezurrean hiru atal eratzen dira: kirtena, gorputza eta xifoide apofisia.', n('5.4/p5/s5'), ['kirtena', 'esternoiaren-gorputza', 'apofisi-xifoidea'], {
          writes: 'b-esternoia',
          plain: 'Bularrezurrak hiru zati ditu: kirtena, gorputza eta xifoide apofisia.',
        }),
      ],
      board: [
        { id: 'b-saihets-hezurra', kind: 'line', text: 'Saihets hezurra: esklerotomatik, somitaren alboko muga gurutzatuz', notes: n('5.4/p4/s1', '5.4/p4/s2'), key: true },
        { id: 'b-saihets-kartilagoa', kind: 'line', text: 'Saihets kartilagoa: paretako orritik zuzenean', notes: n('5.4/p5/s1', '5.4/p5/s2'), key: true },
        { id: 'b-esternoia', kind: 'line', text: 'Esternoia: paretako orria; kirtena, gorputza, xifoide apofisia', notes: n('5.4/p5/s3', '5.4/p5/s5'), key: true },
      ],
      checks: [
        {
          kind: 'contrast',
          id: 'klasea:8/saihetsa',
          concept: 'saihets-kartilagoa',
          q: 'Saihets hezurra eta saihets kartilagoa: nondik sortzen da bakoitza?',
          options: ['Hezurra esklerotomatik; kartilagoa paretako orritik', 'Biak esklerotomatik', 'Hezurra paretako orritik; kartilagoa esklerotomatik'],
          answer: 0,
          why: ['Bai: esklerotoma zelulak paretako orriraino doaz hezurra egiteko; kartilagoa paretako orritik dator zuzenean.', 'Ez: kartilagoa paretako orritik dator.', 'Ez: alderantziz da.'],
          notes: n('5.4/p4/s1', '5.4/p5/s2'),
        },
      ],
    },

    {
      id: 'amaiera',
      title: 'Osatu taula',
      stage: 'errai-kraneoa',
      lines: [
        L(0.92, 'Laburbilduz: hezurrak mesodermo paraxialetik, paretako orritik eta gandor neuraletik datoz.', n('1/p2/s1'), ['gandor-neurala'], {
          view: 'arkuak',
          tone: 'summary',
          plain: 'Gogoratu hiru iturriak: mesodermo paraxiala, paretako orria eta gandor neurala.',
        }),
        L(0.92, 'Buru-ganga mintzezkoa da; kondrokraneoa, gorputz-adarrak eta ornoak, endokondralak.', n('3.1.1/p2/s2', '3.1.2/p2/s2', '4/p6/s3'), [], {
          tone: 'summary',
          plain: 'Buru-ganga zuzenean hezurtzen da; burezurraren zorua, besoak, hankak eta ornoak, kartilagotik.',
        }),
        L(0.92, 'Orain zure txanda: osatu aurpegiko kartilagoen taula oroimenetik.', n('3.2/p6/s2', '3.2/p12/s2', '3.2/p15/s1'), [], {
          tone: 'summary',
          plain: 'Orain zu: bete taula buruz.',
        }),
      ],
      checks: [{ kind: 'fill', id: 'klasea:8/taula', table: 'taula', blanks: ['tz-meckel', 'tz-barra', 'tz-reichert'] }],
    },
  ],
};
