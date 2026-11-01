import type { BoardItem, Lesson, Line } from '@/lib/klasea/types';

/**
 * Topic 7's class: the core of the notes (content/klasea/importance/w7.ts), said over the existing
 * stages and views, from the folding disc and its coelom to the adult diaphragm. Every line cites the
 * sentences it rests on; tests/klasea.test.ts holds each line to them (numbers, directions, names, the
 * frames it is said over). Plan: docs/klasea-plan.md §4.
 */

const n = (...ids: string[]) => ids.map((id) => `w7/${id}`);

/** A line said at stage time `at`, lighting `focus`. */
const L = (at: number, say: string, notes: string[], focus: string[] = [], more: Partial<Line> = {}): Line => ({ at, say, notes, focus, ...more });

/** The four parts of the diaphragm and what each gives (notes 3.1 p3–p8). */
const TABLE: BoardItem = {
  id: 'taula',
  kind: 'table',
  head: ['Osagaia', 'Diafragman'],
  rows: [
    {
      id: 'tz-septum',
      cells: ['Septum transversuma', 'Zentro tendinosoa'],
      notes: n('3.1/p8/s1'),
      structures: ['zentro-tendinosoa'],
    },
    {
      id: 'tz-mintzak',
      cells: ['Mintz pleuroperitonealak', 'Pleura eta peritoneo barrunbeen arteko komunikazioa ixten dute'],
      notes: n('3.1/p4/s1'),
      structures: [],
    },
    {
      id: 'tz-mesenkima',
      cells: ['Hestegorri inguruko mesenkima', 'Gerriko atala'],
      notes: n('3.1/p5/s1', '3.1/p5/s2'),
      structures: ['gerriko-atala', 'diafragmaren-zutabeak'],
    },
    {
      id: 'tz-paraxiala',
      cells: ['Gorputzeko mesodermo paraxiala', 'Alde periferikoko atal muskularra'],
      notes: n('3.1/p6/s1'),
      structures: ['diafragmaren-alde-periferikoa'],
    },
  ],
};

export const LESSON_W7: Lesson = {
  week: 7,
  title: 'Gorputzaren barrunbeak eta diafragma',
  goals: [
    'Zeloma: nondik dator eta nola ixten da',
    'Septum transversuma: bi barrunbe',
    'Peritoneo barrunbea eta mesenterio dortsala',
    'Pleura eta perikardio barrunbeak',
    'Diafragma: osagaiak eta heldua',
  ],
  chunks: [
    {
      id: 'gaur',
      title: 'Gaur',
      stage: 'zeloma',
      lines: [
        L(0, 'Kaixo! Gaur gorputzaren barrunbeak ikasiko ditugu: nondik datozen, nola banatzen diren, eta diafragma nola sortzen den.', n('1/p3/s1'), [], {
          plain: 'Gaurko gaia: gorputzaren barruko hutsuneak. Nondik datozen, nola zatitzen diren, eta diafragma nola sortzen den.',
        }),
        L(0, '3. astearen bukaeran enbrioia disko laua da, eta tolestu egiten da.', n('1/p3/s1'), [], { tone: 'recall', plain: '3. astearen bukaeran enbrioia disko lau bat da. Orduan tolesten hasten da, paper bat bezala.' }),
        L(0, 'Tolespen horiei esker sortzen dira enbrioiaren atzeko, aurreko eta alboko paretak.', n('1/p3/s1'), [], {
          tone: 'why',
          writes: 'b-tolespena',
          plain: 'Tolestean, diskoak gorputz baten paretak eratzen ditu: atzekoa, aurrekoa eta alboetakoak.',
        }),
        L(0, 'Enbrioi barruko mesodermoak hiru atal ditu: mesodermo paraxiala, bitarteko mesodermoa eta alboko mesodermoa.', n('1/p4/s1'), ['somitak', 'bitarteko-mesodermoa', 'alboko-mesodermoa'], {
          tone: 'recall',
          plain: 'Mesodermoak hiru zati ditu: paraxiala, somitak sortzen dituena, bitarteko mesodermoa eta alboko mesodermoa.',
        }),
      ],
      board: [
        {
          id: 'b-tolespena',
          kind: 'line',
          text: 'Tolespenak (3. astearen bukaera): atzeko, aurreko eta alboko paretak',
          notes: n('1/p3/s1'),
          key: true,
        },
      ],
      checks: [
        {
          kind: 'predict',
          q: 'Zer uste duzu: tolestu ondoren, zer geratuko da enbrioiaren barruan?',
          options: ['Barrunbe itxi bat', 'Ezer ez: ehun trinkoa bakarrik', 'Amnios barrunbea'],
          answer: 0,
          why: ['Bai: zeloma gorputz barruan itxita geratzen da.', 'Ez: barruan hutsune bat geratzen da, zeloma.', 'Ez: amnios barrunbea enbrioitik kanpo dago.'],
          notes: n('1/p5/s1'),
        },
      ],
    },

    {
      id: 'orriak',
      title: 'Bi orri eta zeloma',
      stage: 'zeloma',
      lines: [
        L(0.18, 'Alboko mesodermotik bi orri bereizten dira: paretako orria, edo somatopleura, eta errai orria, edo esplaknopleura.', n('1/p4/s2'), [
          'alboko-mesodermoa',
          'paretako-orria',
          'errai-orria',
        ], { tone: 'emphasis', writes: 'b-orriak', plain: 'Alboko mesodermoa bitan zatitzen da. Kanpoko orria paretako orria da; barnekoa, errai orria.' }),
        L(0.18, 'Bi orri horien artean geratzen den espazioari enbrioi barruko zeloma deritzogu.', n('1/p4/s3'), ['enbrioi-barruko-zeloma'], {
          plain: 'Bi orrien artean hutsune bat geratzen da. Hutsune hori da enbrioi barruko zeloma.',
        }),
        L(0.18, 'Beraz, zeloma ez da ehun bat: hutsune bat da, bi orri horiek mugatzen dutena.', n('1/p4/s3'), [], {
          tone: 'why',
          plain: 'Kontuz: zeloma ez da ehuna. Bi orrien arteko tartea da, poltsa baten barrualdea bezala.',
        }),
        L(0.36, 'Hasieran zeloma hori jarraia da enbrioi kanpoko zelomarekin, hau da, korion barrunbearekin.', n('1/p4/s4'), ['enbrioi-barruko-zeloma', 'korion-barrunbea'], {
          writes: 'b-jarraia',
          hold: 4,
          plain: 'Hasieran zeloma ez dago itxita: ertzetan zabalik dago, eta korion barrunbearekin bat egiten du.',
        }),
      ],
      board: [
        {
          id: 'b-orriak',
          kind: 'line',
          text: 'Alboko mesodermoa: paretako orria (somatopleura) eta errai orria (esplaknopleura); tartean, zeloma',
          notes: n('1/p4/s2', '1/p4/s3'),
          key: true,
        },
        {
          id: 'b-jarraia',
          kind: 'line',
          text: 'Hasieran zeloma jarraia da korion barrunbearekin (enbrioi kanpoko zeloma)',
          notes: n('1/p4/s4'),
        },
      ],
      checks: [
        { kind: 'pool', id: 'mikro:7/zeloma:1', after: 2 },
        {
          kind: 'contrast',
          id: 'klasea:7/orriak',
          concept: 'errai-orria',
          q: 'Somatopleura eta esplaknopleura: zein da zein?',
          options: ['Somatopleura paretako orria da; esplaknopleura, errai orria', 'Somatopleura errai orria da; esplaknopleura, paretako orria', 'Biak paretako orriak dira'],
          answer: 0,
          why: ['Bai: somatopleura gorputzaren paretarekin doa; esplaknopleura erraiekin.', 'Ez: alderantziz da.', 'Ez: bat paretako orria da eta bestea errai orria.'],
          notes: n('1/p4/s2'),
        },
      ],
    },

    {
      id: 'tolespenak',
      title: 'Zeloma ixten da',
      stage: 'zeloma',
      lines: [
        L(0.52, 'Diskoak bi tolespen mota egiten ditu. Zeharkako tolespenean alboko ertzak aurrerantz eta erdikalderantz mugitzen dira.', n('1/p4/s5'), ['tolestura-laterala'], {
          tone: 'emphasis',
          writes: 'b-bi-tolespen',
          hold: 4,
          plain: 'Lehen tolespena zeharkakoa da: diskoaren bi ertzak aurrera eta erdirantz okertzen dira.',
        }),
        L(0.7, 'Tolespen hauen ondorioz, enbrioi barruko zeloma gorputzaren barnealdean geratzen da.', n('1/p5/s1'), ['enbrioi-barruko-zeloma'], {
          tone: 'emphasis',
          writes: 'b-itxita',
          plain: 'Tolestu ondoren, zeloma gorputzaren barruan itxita geratzen da, poltsa baten barruan bezala.',
        }),
        L(0.7, 'Eta enbrioi kanpoko zelomatik guztiz isolatuta geratzen da.', n('1/p5/s1'), ['korion-barrunbea'], {
          plain: 'Korion barrunbearekin zuen lotura galtzen du: orain bi barrunbeak bereizita daude.',
        }),
        L(0.86, 'Albotik ikusita, beste tolespena: zefalokaudalean alde zefalikoa eta alde kaudala aurrerantz abiatzen dira.', n('1/p4/s5'), [], {
          plain: 'Albotik begiratuta beste tolespena ikusten da: buruaren muturra eta isatsaren muturra aurrera okertzen dira.',
          hold: 3,
        }),
        L(0.93, 'Sortutako zeloma gorputzaren barnean hedatzen da, geroko toraxetik abdomenera.', n('1/p5/s2'), ['enbrioi-barruko-zeloma'], {
          tone: 'emphasis',
          writes: 'b-bakarra',
          plain: 'Zeloma hori barrunbe bakarra da, luzea: gero toraxa izango denetik abdomenera iristen da.',
        }),
      ],
      board: [
        {
          id: 'b-bi-tolespen',
          kind: 'line',
          text: 'Bi tolespen: zeharkakoa (ertzak aurrera eta erdirantz) eta zefalokaudala',
          notes: n('1/p4/s5'),
        },
        {
          id: 'b-itxita',
          kind: 'line',
          text: 'Tolestu ondoren: zeloma gorputz barruan, korion barrunbetik isolatuta',
          notes: n('1/p5/s1'),
          key: true,
        },
        {
          id: 'b-bakarra',
          kind: 'line',
          text: 'Zeloma: barrunbe bakarra, geroko toraxetik abdomenera',
          notes: n('1/p5/s2'),
        },
      ],
      checks: [
        { kind: 'pool', id: 'mikro:7/zeloma:4', after: 1 },
        {
          kind: 'contrast',
          id: 'klasea:7/zeloma-lehen-gero',
          concept: 'enbrioi-barruko-zeloma',
          after: 4,
          q: 'Zeloma hasieran eta tolestu ondoren: nolakoa da?',
          options: ['Hasieran korion barrunbearekin jarraia; ondoren gorputz barruan isolatuta', 'Hasieran isolatuta; ondoren korion barrunbearekin jarraia', 'Beti korion barrunbearekin jarraia'],
          answer: 0,
          why: ['Bai: tolespenek ertzak ixten dituzte, eta zeloma barruan geratzen da.', 'Ez: alderantziz da.', 'Ez: tolespenen ondoren isolatuta geratzen da.'],
          notes: n('1/p4/s4', '1/p5/s1'),
        },
      ],
    },

    {
      id: 'septum',
      title: 'Septum transversuma',
      stage: 'septum-transversum',
      lines: [
        L(0, 'Zeloma barrunbe bakarra da, toraxetik abdomenera. Orain bitan banatuko da.', n('1/p5/s2'), ['enbrioi-barruko-zeloma'], {
          tone: 'recall',
          plain: 'Gogoratu: zeloma hutsune luze bakarra da. Orain horma batek bitan zatituko du.',
        }),
        L(0.14, '4. astean, lepo mailan, trenkada horizontal bat garatzen da: septum transversuma.', n('2/p3/s1'), ['septum-transversum'], {
          tone: 'emphasis',
          plain: '4. astean horma lau bat sortzen da, etzanda, lepoaren parean. Horma horri septum transversuma deitzen zaio.',
        }),
        L(0.14, '3., 4. eta 5. lepo somiten mailan agertzen da: C3, C4 eta C5. Oso altu.', n('2/p3/s1', '2/p4/s1'), ['septum-transversum', 'somitak'], {
          tone: 'emphasis',
          writes: 'b-septum',
          plain: 'Lepoko hirugarren, laugarren eta bosgarren somiten parean agertzen da. Oso altu, beraz.',
        }),
        L(0.3, 'Septum horrek zeloma bitan banatzen du. Goiko atala, septumaren gainean, hasierako perikardio barrunbea da.', n('2/p7/s1'), [
          'septum-transversum',
          'hasierako-perikardio-barrunbea',
        ], { tone: 'emphasis', plain: 'Horma horrek zeloma bitan zatitzen du. Goiko zatia hasierako perikardio barrunbea da.' }),
        L(0.3, 'Septumaren azpian geratzen den atala, berriz, peritoneo barrunbea da.', n('2/p9/s1'), ['peritoneo-barrunbea'], {
          tone: 'emphasis',
          writes: 'b-bi-barrunbe',
          plain: 'Hormaren azpian geratzen den zatia, berriz, peritoneo barrunbea da.',
        }),
      ],
      board: [
        {
          id: 'b-septum',
          kind: 'line',
          text: 'Septum transversuma: 4. astea, C3–C5 (lepo mailan)',
          notes: n('2/p3/s1', '2/p4/s1'),
          key: true,
        },
        {
          id: 'b-bi-barrunbe',
          kind: 'line',
          text: 'Gainean hasierako perikardio barrunbea; azpian peritoneo barrunbea',
          notes: n('2/p7/s1', '2/p9/s1'),
          key: true,
        },
      ],
      checks: [
        { kind: 'pool', id: 'mikro:7/septum-transversum:1', after: 2 },
        {
          kind: 'contrast',
          id: 'klasea:7/goiko-beheko',
          concept: 'hasierako-perikardio-barrunbea',
          q: 'Septum transversumaren goiko eta beheko atalak: zein da bakoitza?',
          options: ['Goian hasierako perikardio barrunbea; behean peritoneo barrunbea', 'Goian peritoneo barrunbea; behean hasierako perikardio barrunbea', 'Bietan peritoneo barrunbea'],
          answer: 0,
          why: ['Bai: goiko atalak torax osoa betetzen du; azpikoa peritoneo barrunbea da.', 'Ez: alderantziz da.', 'Ez: goiko atala hasierako perikardio barrunbea da.'],
          notes: n('2/p7/s1', '2/p9/s1'),
        },
      ],
    },

    {
      id: 'erretenak',
      title: 'Septuma ez da osoa',
      stage: 'septum-transversum',
      lines: [
        L(0.58, 'Mesodermoz osatutako trenkada hori gorputzaren aurreko eta alboko paretetan finkatzen da.', n('2/p6/s1'), ['septum-transversum'], {
          plain: 'Horma hori gorputzaren paretei itsasten zaie: aurrekoari eta alboetakoei.',
        }),
        L(0.58, 'Atzekaldetik, berriz, aurreko hestearen inguruko mesenkimari finkatzen zaio: gero hestegorria izango dena.', n('2/p6/s1'), ['hestegorri-inguruko-mesenkima'], {
          writes: 'b-finkatu',
          plain: 'Atzean ez dago gorputzaren paretari lotuta: hestegorri inguruko mesenkimari lotzen zaio.',
        }),
        L(0.78, 'Baina banaketa ez da osoa: septumaren atze alboko aldeetan bi kanal geratzen dira irekita.', n('2/p10/s1'), ['erreten-perikardioperitonealak'], {
          tone: 'emphasis',
          plain: 'Horma ez da guztiz ixten. Atzean, bi alboetan, bi kanal geratzen dira zabalik.',
        }),
        L(0.78, 'Kanal horiei erreten perikardioperitonealak deitzen zaie, eta goiko eta beheko atalak komunikatzen dituzte.', n('2/p10/s1'), ['erreten-perikardioperitonealak'], {
          writes: 'b-erretenak',
          plain: 'Bi kanal horiek erreten perikardioperitonealak dira: goiko barrunbetik behekora pasatzeko bideak.',
        }),
        L(0.78, 'Behin-behineko egiturak dira: gero itxi egingo dira.', n('2/p10/s1'), [], { tone: 'caution', plain: 'Ez dira betiko: gero itxiko dira, eta bi barrunbeak guztiz bereiziko dira.' }),
      ],
      board: [
        {
          id: 'b-finkatu',
          kind: 'line',
          text: 'Septuma finkatuta: aurrean eta alboetan gorputz paretari; atzean hestegorri inguruko mesenkimari',
          notes: n('2/p6/s1'),
        },
        {
          id: 'b-erretenak',
          kind: 'line',
          text: 'Erreten perikardioperitonealak: atze-alboko bi kanal, goiko eta beheko atalak komunikatzen',
          notes: n('2/p10/s1'),
          key: true,
        },
      ],
      checks: [
        {
          kind: 'contrast',
          id: 'klasea:7/septum-finkatu',
          concept: 'septum-transversum',
          after: 1,
          q: 'Septuma non finkatzen da aurrean eta atzean?',
          options: ['Aurrean gorputzaren paretan; atzean hestegorri inguruko mesenkiman', 'Aurrean hestegorri inguruko mesenkiman; atzean gorputzaren paretan', 'Bietan gorputzaren paretan'],
          answer: 0,
          why: ['Bai: aurrean eta alboetan pareta; atzean hestearen inguruko mesenkima.', 'Ez: alderantziz da.', 'Ez: atzean mesenkimari finkatzen zaio.'],
          notes: n('2/p6/s1'),
        },
        { kind: 'pool', id: 'mikro:7/septum-transversum:4' },
      ],
    },

    {
      id: 'mesenterioa',
      title: 'Mesenterio dortsala',
      stage: 'peritoneo-barrunbea',
      lines: [
        L(0.07, 'Goazen apunteetako irudira. Hestea alde zefalikotik kaudalera hedatzen da.', n('2.1/p3/s1'), ['erdiko-hestea'], {
          plain: 'Begiratu apunteetako irudia. Hestea hodi luze bat da, buruaren aldetik isatsaren aldera doana.',
        }),
        L(0.07, 'Alboko mesodermoaren errai orriak hestea inguratzen du.', n('2.1/p3/s1'), ['errai-orria'], {
          tone: 'emphasis',
          plain: 'Zelomaren barneko orriak, errai orriak, hestea biltzen du, azal batek bezala.',
        }),
        L(0.07, 'Hestea gorputzaren atzeko aldeari lotuta mantentzen da, mesenkimazko lotura zabal baten bitartez.', n('2.1/p3/s2'), [], {
          plain: 'Hestea ez dago libre: lotura zabal batek atzeko paretari eusten dio.',
        }),
        L(0.15, 'Barrunbe horretan, gorputzaren paretaren eta errai orriaren artean, bi orriko atzeko lotura bat agertzen da.', n('2.1/p4/s1'), [
          'errai-orria',
          'mesenterio-dortsala',
        ], { plain: 'Barrunbe horretan, paretaren eta hestearen artean, lotura hori bi orriz osatuta dago.' }),
        L(0.15, 'Lotura horri mesenterio dortsala edo atzeko mesenterioa deritzo.', n('2.1/p4/s1'), ['mesenterio-dortsala'], {
          tone: 'emphasis',
          writes: 'b-mesenterioa',
          plain: 'Lotura horrek bi izen ditu: mesenterio dortsala eta atzeko mesenterioa. Biak gauza bera dira.',
        }),
        L(0.2904, 'Barrunbearen pareta estaltzen duen orria paretako peritoneoa da; hestearen ingurukoa, errai peritoneoa.', n('2.1/p6/s1'), [
          'paretako-peritoneoa',
          'errai-peritoneoa',
        ], { tone: 'emphasis', writes: 'b-peritoneoa', plain: 'Bi orri daude: hormari itsatsita paretako peritoneoa, eta hesteari itsatsita errai peritoneoa.' }),
        L(0.2904, 'Eta bi orri horien arteko lotura, lehen ikusitako mesenterio dortsala da.', n('2.1/p6/s2'), ['mesenterio-dortsala'], {
          plain: 'Bi orri horiek mesenterioan elkartzen dira: hormatik hesteraino doan zubia da.',
        }),
      ],
      board: [
        {
          id: 'b-mesenterioa',
          kind: 'line',
          text: 'Mesenterio dortsala = atzeko mesenterioa: bi orriko lotura, paretaren eta errai orriaren artean',
          notes: n('2.1/p4/s1'),
          key: true,
        },
        {
          id: 'b-peritoneoa',
          kind: 'line',
          text: 'Paretako peritoneoa: barrunbearen pareta. Errai peritoneoa: hestearen ingurua',
          notes: n('2.1/p6/s1'),
        },
      ],
      checks: [
        { kind: 'pool', id: 'mikro:7/peritoneo-barrunbea:1', after: 4 },
        {
          kind: 'contrast',
          id: 'klasea:7/peritoneo-orriak',
          concept: 'errai-peritoneoa',
          q: 'Paretako peritoneoa eta errai peritoneoa: zer estaltzen du bakoitzak?',
          options: ['Paretakoak barrunbearen pareta; erraiak hestea', 'Paretakoak hestea; erraiak barrunbearen pareta', 'Biek hestea'],
          answer: 0,
          why: ['Bai: paretakoa hormari itsatsita dago; erraia hesteari.', 'Ez: alderantziz da.', 'Ez: paretakoak barrunbearen pareta estaltzen du.'],
          notes: n('2.1/p6/s1'),
        },
      ],
    },

    {
      id: 'organoak',
      title: 'Barruan, kanpoan, atzean',
      stage: 'peritoneo-barrunbea',
      lines: [
        L(0.4224, 'Barrunbe horretan kokatuko dira aurreko hestearen urrutiko atala, erdiko hestea eta atzeko hestearen parterik garrantzitsuena.', n('2.1/p7/s1'), ['erdiko-hestea'], {
          plain: 'Barrunbe horretan hesteko zati gehienak egongo dira: aurreko hestearen azken zatia, erdiko hestea eta atzeko hestearen zati handi bat.',
        }),
        L(0.4224, 'Hasieran, egitura horiek errai peritoneoz inguratuta daude. Beraz, peritoneo barruko egiturak deitzen zaie.', n('2.1/p8/s1', '2.1/p8/s2', '2.1/p10/s1'), [
          'errai-peritoneoa',
          'peritoneo-barruko-egiturak',
        ], { tone: 'emphasis', writes: 'b-barrukoak', plain: 'Hestetik sortutako organo horiek errai peritoneoak biltzen ditu, barrunbe barruan. Horregatik peritoneo barrukoak dira.' }),
        L(0.5456, 'Peritoneo kanpoko egiturak, berriz, barrunbe horretan ez dauden organoak dira.', n('2.1/p11/s1'), ['peritoneo-kanpoko-egiturak'], {
          plain: 'Beste organo batzuk ez daude barrunbe horren barruan: peritoneo kanpokoak dira.',
        }),
        L(0.5456, 'Adibidez, giltzurrunak: bitarteko mesodermotik garatzen dira, barrunbearen atzeko aldean.', n('2.1/p11/s2'), ['giltzurruna'], {
          tone: 'emphasis',
          plain: 'Adibide bat: giltzurrunak. Bitarteko mesodermotik sortzen dira, barrunbearen atzean, eta ez dira barrura sartzen.',
        }),
        L(0.5456, 'Abdomeneko aorta ere bai: diafragma zeharkatzen du, baina barrunbearen atzean geratzen da. Beheko kaba zaina, berdin.', n('2.1/p11/s3', '2.1/p11/s4'), [
          'aorta',
          'beheko-kaba-zaina',
        ], { writes: 'b-kanpokoak', plain: 'Aorta ere kanpoan dago: toraxetik jaitsi eta barrunbearen atzean geratzen da. Beheko kaba zaina ere bai.' }),
        L(0.6688, 'Beste organo batzuk hasieran peritoneo barrukoak dira, baina garapenean posizioz aldatzen dira.', n('2.1/p12/s1'), ['peritoneo-barruko-egiturak'], {
          plain: 'Beste organo batzuk hasieran barruan daude, baina gero tokiz mugitzen dira.',
        }),
        L(0.6688, 'Posizio aldaketa horregatik, atzeko mesenterioa atzekaldeko paretako peritoneoarekin fusionatzen da: peritoneo atzeko egiturak bihurtzen dira.', n('2.1/p12/s2'), [
          'mesenterio-dortsala',
          'paretako-peritoneoa',
          'peritoneo-atzeko-egiturak',
        ], { tone: 'emphasis', writes: 'b-atzekoak', plain: 'Organo horien mesenterioa atzeko hormari itsasten zaio, eta organoa atzean geratzen da itsatsita.' }),
        L(0.792, 'Beraz, peritoneo barrunbeak ez du abdomeneko barrunbe osoa okupatzen.', n('2.1/p13/s1'), ['peritoneo-barrunbea'], {
          tone: 'emphasis',
          writes: 'b-ez-osoa',
          plain: 'Ondorioz, peritoneo barrunbeak ez du abdomen osoa betetzen: zati bat bakarrik hartzen du.',
        }),
        L(0.792, 'Goiko atalarekin berdin gertatzen da: hasierako perikardio barrunbeak ez du torax barrunbe osoa okupatzen.', n('2/p8/s1'), [], {
          plain: 'Goian ere berdin: hasierako perikardio barrunbeak ez du torax osoa betetzen.',
        }),
        L(0.792, 'Organo batzuk peritoneo kanpokoak dira, eta beste batzuk peritoneo atzekoak: duodenoa, goranzko kolona eta beheranzko kolona.', n('2.1/p13/s1'), [
          'peritoneo-kanpoko-egiturak',
          'peritoneo-atzeko-egiturak',
          'goranzko-kolona',
          'beheranzko-kolona',
        ], { plain: 'Batzuk kanpoan daude, eta beste batzuk atzean itsatsita: adibidez duodenoa, goranzko kolona eta beheranzko kolona.' }),
      ],
      board: [
        {
          id: 'b-barrukoak',
          kind: 'line',
          text: 'Peritoneo barrukoak: hestetik sortuak, errai peritoneoz inguratuak',
          notes: n('2.1/p8/s1', '2.1/p10/s1'),
        },
        {
          id: 'b-kanpokoak',
          kind: 'line',
          text: 'Peritoneo kanpokoak: giltzurrunak, aorta, beheko kaba (barrunbearen atzean)',
          notes: n('2.1/p11/s2', '2.1/p11/s3', '2.1/p11/s4'),
          key: true,
        },
        {
          id: 'b-atzekoak',
          kind: 'line',
          text: 'Peritoneo atzekoak: mesenterioa atzeko paretako peritoneoarekin fusionatua',
          notes: n('2.1/p12/s2'),
          key: true,
        },
        {
          id: 'b-ez-osoa',
          kind: 'line',
          text: 'Peritoneo barrunbeak ez du abdomen osoa betetzen',
          notes: n('2.1/p13/s1'),
        },
      ],
      checks: [
        {
          kind: 'contrast',
          id: 'klasea:7/kanpoko-atzeko',
          concept: 'peritoneo-atzeko-egiturak',
          after: 6,
          q: 'Peritoneo kanpokoak eta peritoneo atzekoak: zein egon zen hasieran barrunbearen barruan?',
          options: ['Atzekoak bai, mesenterioz lotuta; kanpokoak ez', 'Kanpokoak bai; atzekoak ez', 'Biak', 'Bat ere ez'],
          answer: 0,
          why: [
            'Bai: atzekoak barrukoak ziren, eta haien mesenterioa atzeko paretari fusionatu zaio.',
            'Ez: alderantziz da.',
            'Ez: kanpokoak ez daude barrunbean.',
            'Ez: atzekoak hasieran barrukoak ziren.',
          ],
          notes: n('2.1/p11/s1', '2.1/p12/s1', '2.1/p12/s2'),
        },
        { kind: 'pool', id: 'w7-q-peritoneo-ez-osoa' },
      ],
    },

    {
      id: 'pleura',
      title: 'Toraxean: birika hastapenak',
      stage: 'pleura-perikardioa',
      lines: [
        L(0, 'Orain toraxera. Enbrioi barruko zelomaren atzealdean aurreko hestea dago.', n('2.2/p6/s1'), ['aurreko-hestea'], {
          plain: 'Toraxera goaz. Zelomaren atzean hodi bat dago: aurreko hestea.',
        }),
        L(0, 'Aurreko hestearen aurreko paretatik arnas aparatuaren hastapena agertzen da: ebaginazio endodermiko bat.', n('2.2/p6/s2'), ['aurreko-hestea', 'arnas-hastapena'], {
          tone: 'emphasis',
          writes: 'b-arnas',
          plain: 'Aurreko hestearen aurreko hormatik poltsa txiki bat ateratzen da: arnas hastapena.',
        }),
        L(0, 'Hastapen hori luzatzen da: hurbileko atala hodi laringotrakeala da, eta muturretik bi birika hastapen sortzen dira.', n('2.2/p6/s3'), [
          'hodi-laringotrakeala',
          'birika-hastapenak',
        ], { plain: 'Poltsa hori luzatu egiten da: hasierako zatia hodi laringotrakeala da, eta muturrean bi birika hastapen sortzen dira.' }),
        L(0.14, 'Hasierako perikardio barrunbeak torax barrunbe osoa okupatzen du. Hortik hiru barrunbe sortuko dira.', n('2.2/p3/s1'), ['hasierako-perikardio-barrunbea'], {
          tone: 'emphasis',
          plain: 'Hasierako perikardio barrunbeak toraxa osorik betetzen du. Garapenean hiru barrunbe bihurtuko da.',
        }),
        L(0.24, 'Birika hastapenak behera, eskuinera eta aurrera hazten dira.', n('2.2/p7/s1'), ['birika-hastapenak'], {
          plain: 'Birika hastapenak hazi egiten dira: behera, eskuinera eta aurrera.',
        }),
        L(0.24, 'Hazkuntza horregatik, atzeko aldetik errai orria bultzatzen dute, eta poliki-poliki barrunbean sartzen dira.', n('2.2/p7/s2'), ['birika-hastapenak', 'errai-orria'], {
          tone: 'emphasis',
          writes: 'b-pleura-hasi',
          plain: 'Hazten diren heinean, zelomaren errai orria bultzatzen dute, eta barrunbe barrura sartzen dira, orri horrekin estalita.',
        }),
        L(0.24, 'Hasierako perikardio barrunbearen atze alboko aldeak okupatzen hasten dira.', n('2.2/p7/s2'), ['hasierako-perikardio-barrunbea'], {
          plain: 'Barrunbe horren atzeko eta alboetako zatiak betetzen hasten dira.',
        }),
      ],
      board: [
        {
          id: 'b-arnas',
          kind: 'line',
          text: 'Arnas hastapena: aurreko hestearen aurreko paretatik (ebaginazio endodermikoa)',
          notes: n('2.2/p6/s2'),
          key: true,
        },
        {
          id: 'b-pleura-hasi',
          kind: 'line',
          text: 'Birika hastapenek errai orria bultzatzen dute atzetik, eta barrunbean sartzen dira',
          notes: n('2.2/p7/s2'),
        },
      ],
      checks: [
        { kind: 'pool', id: 'mikro:7/pleura-perikardioa:0', after: 2 },
        {
          kind: 'contrast',
          id: 'klasea:7/arnas-birika',
          concept: 'birika-hastapenak',
          q: 'Arnas hastapena eta birika hastapenak: nondik sortzen da bakoitza?',
          options: ['Arnas hastapena aurreko hestetik; birika hastapenak haren muturretik', 'Birika hastapenak aurreko hestetik; arnas hastapena haien muturretik', 'Biak zelomaren errai orritik'],
          answer: 0,
          why: ['Bai: hastapena luzatu egiten da, eta muturrean bi birika hastapen sortzen dira.', 'Ez: alderantziz da.', 'Ez: endodermotik sortzen dira, hestetik.'],
          notes: n('2.2/p6/s2', '2.2/p6/s3'),
        },
      ],
    },

    {
      id: 'mintzak',
      title: 'Pleurak eta perikardioa',
      stage: 'pleura-perikardioa',
      lines: [
        L(0.36, 'Gorputzaren alboko aldeetatik bi mintz agertzen dira: mintz pleuroperikardikoak.', n('2.2/p8/s1'), ['mintz-pleuroperikardikoak'], {
          plain: 'Gorputzaren bi alboetatik horma mehe bana hazten da: mintz pleuroperikardikoak.',
        }),
        L(0.36, 'Mintz bakoitzak hiru geruza ditu: erdian gorputz paretako mesenkima, eta inguruan paretako orritik sortutako bi geruza.', n('2.2/p8/s2'), ['mintz-pleuroperikardikoak'], {
          writes: 'b-geruzak',
          plain: 'Mintz bakoitza hiru geruzaz egina dago: erdian paretako mesenkima, eta bi aldeetan zelomaren paretako orria.',
        }),
        L(0.48, '5. astean, bi mintzak erdialderuntz abiatzen dira, eta haien erpinak fusionatzen dira.', n('2.2/p9/s1'), ['mintz-pleuroperikardikoak'], {
          tone: 'emphasis',
          plain: '5. astean bi mintzak erdirantz hazten dira, eta muturrak elkartzean bat egiten dute.',
        }),
        L(0.48, 'Era berean, hestegorri inguruko mesenkimarekin fusionatzen dira.', n('2.2/p9/s1'), ['hestegorri-inguruko-mesenkima'], {
          writes: 'b-pleuroperikardikoak',
          plain: 'Hestegorri inguruko mesenkimarekin ere bat egiten dute.',
        }),
        L(0.48, 'Horrela, hasierako perikardio barrunbetik bi pleura barrunbe sortzen dira, toraxaren alboetan.', n('2.2/p3/s1', '2.2/p4/s1'), [
          'hasierako-perikardio-barrunbea',
          'pleura-barrunbea',
        ], { plain: 'Horrela, hasierako barrunbe bakarretik bi pleura barrunbe sortzen dira, bat alde bakoitzean.' }),
        L(0.48, 'Eta erdian, aurrean, behin betiko perikardio barrunbea: bihotza kokatuko den tokia.', n('2.2/p5/s1'), ['perikardio-barrunbea', 'bihotza'], {
          tone: 'emphasis',
          writes: 'b-hiru',
          plain: 'Erdian eta aurrean, bihotzaren inguruan, perikardio barrunbea geratzen da.',
        }),
        L(0.72, 'Barrunbe bakoitzean bi orri bereizten dira: pleuran, paretako pleura eta errai pleura.', n('2.2/p12/s1'), [
          'pleura-barrunbea',
          'paretako-pleura',
          'errai-pleura',
        ], { plain: 'Barrunbe bakoitzak bi orri ditu: bata hormari itsatsita, paretako pleura, eta bestea organoari, errai pleura.' }),
        L(0.72, 'Errai pleura birikarekin kontaktuan dago, erreflejatu egiten da, eta paretako pleurarekin jarraitzen du.', n('2.2/p13/s2'), ['errai-pleura', 'birikak', 'paretako-pleura'], {
          writes: 'b-pleura-orriak',
          plain: 'Errai pleurak birika estaltzen du; gero bueltatu egiten da, eta paretako pleura bihurtzen da. Orri bera da.',
        }),
        L(0.72, 'Pleura barrunbeak atze alboko aldeetan kokatzen dira; perikardio barrunbea erdikaldean.', n('2.2/p13/s1', '2.2/p16/s1'), ['pleura-barrunbea', 'perikardio-barrunbea'], {
          plain: 'Pleura barrunbeak atzean eta alboetan daude; perikardio barrunbea erdian geratzen da.',
        }),
        L(0.86, 'Errai perikardioa bihotzarekin kontaktuan dago, eta erreflejatu eta paretako perikardioarekin jarraitzen du.', n('2.2/p16/s2'), ['errai-perikardioa', 'paretako-perikardioa', 'bihotza'], {
          plain: 'Bihotzaren gaineko orria errai perikardioa da; tolestu egiten da, eta barrunbearen pareta estaltzen du: paretako perikardioa.',
        }),
        L(0.93, 'Bi barrunbe hauek espazio birtualak dira: orriak bata bestearen ondoan daude, tarterik gabe.', n('2.2/p17/s1'), ['pleura-barrunbea', 'perikardio-barrunbea'], {
          plain: 'Barrunbe hauek ia ez dute barrualderik: bi orriak elkar ukitzen dute.',
        }),
        L(0.93, 'Egoera patologikoetan bakarrik bihurtzen dira espazio erreal: adibidez, pleura barrunbean airea edo odola sartzen denean.', n('2.2/p17/s2'), ['pleura-barrunbea'], {
          tone: 'caution',
          writes: 'b-birtualak',
          plain: 'Gaixotasunetan bakarrik irekitzen da benetako hutsune bat, adibidez airea edo odola sartzen bada.',
        }),
      ],
      board: [
        {
          id: 'b-geruzak',
          kind: 'line',
          text: 'Mintz pleuroperikardikoak: erdian gorputz paretako mesenkima; inguruan paretako orritik bi geruza',
          notes: n('2.2/p8/s2'),
          key: true,
        },
        {
          id: 'b-pleuroperikardikoak',
          kind: 'line',
          text: 'Mintz pleuroperikardikoak: 5. astean fusionatzen dira, elkarren artean eta hestegorri inguruko mesenkimarekin',
          notes: n('2.2/p9/s1'),
          key: true,
        },
        {
          id: 'b-hiru',
          kind: 'line',
          text: 'Hasierako perikardio barrunbetik: bi pleura barrunbe (alboetan) eta perikardio barrunbea (aurrean, erdian)',
          notes: n('2.2/p3/s1', '2.2/p4/s1', '2.2/p5/s1'),
          key: true,
        },
        {
          id: 'b-pleura-orriak',
          kind: 'line',
          text: 'Errai pleura birikarekin kontaktuan; paretako pleurarekin jarraia',
          notes: n('2.2/p13/s2'),
        },
        {
          id: 'b-birtualak',
          kind: 'line',
          text: 'Espazio birtualak; errealak egoera patologikoetan bakarrik',
          notes: n('2.2/p17/s2'),
        },
      ],
      checks: [
        {
          kind: 'contrast',
          id: 'klasea:7/mintz-geruzak',
          concept: 'mintz-pleuroperikardikoak',
          after: 1,
          q: 'Mintz pleuroperikardikoak: zer dago erdian eta zer inguruan?',
          options: ['Erdian gorputz paretako mesenkima; inguruan paretako orritik bi geruza', 'Erdian paretako orria; inguruan mesenkimazko bi geruza', 'Hiru geruzak errai orritik'],
          answer: 0,
          why: ['Bai: mesenkima erdian, eta paretako orriak inguratzen du.', 'Ez: alderantziz da.', 'Ez: paretako orritik datoz, ez errai orritik.'],
          notes: n('2.2/p8/s2'),
        },
        { kind: 'pool', id: 'mikro:7/pleura-perikardioa:4', after: 3 },
        { kind: 'pool', id: 'mikro:7/pleura-perikardioa:8' },
      ],
    },

    {
      id: 'diafragma',
      title: 'Diafragma: lepotik behera',
      stage: 'diafragma-eraketa',
      lines: [
        L(0, 'Orain diafragma: torax eta abdomenaren artean dagoen trenkada muskulu aponeurotikoa.', n('3/p3/s1'), [], {
          plain: 'Diafragma toraxa eta abdomena bereizten dituen horma da: muskulua du, eta tendoi zati bat ere bai.',
        }),
        L(0, 'Bere osagaietako bat septum transversuma da.', n('3/p3/s3'), ['septum-transversum'], {
          plain: 'Diafragma zenbait zatiren batura da, eta horietako bat septum transversuma da.',
        }),
        L(0.1204, 'Septuma C3, C4 eta C5 mailetan agertzen da, oso altu, eta bere mesodermotik mesenkima sortzen da.', n('3/p3/s4'), ['septum-transversum'], {
          plain: 'Gogoratu: septuma lepoan sortzen da, oso altu. Bere ehunetik zelula berriak sortzen dira.',
        }),
        L(0.1204, 'Mesenkima horretan mioblastoak bereizten dira, eta gero miozitoak bihurtzen dira: zelula muskularrak.', n('3/p4/s1', '3/p4/s2'), ['mioblastoak', 'miozitoak'], {
          plain: 'Ehun horretan muskulu zelulen aitzindariak agertzen dira, mioblastoak. Gero muskulu zelula bihurtzen dira: miozitoak.',
        }),
        L(0.258, 'Garai horretan, lepo mailan, zelula muskular horietara nerbio zuntzak iristen dira, inerbatzeko.', n('3/p4/s3'), ['lepoko-nerbio-espinalak'], {
          plain: 'Lepoan dauden bitartean, muskulu zelula horiei nerbioak iristen zaizkie.',
        }),
        L(0.258, 'Zuntz horiek 3., 4. eta 5. lepoko nerbio espinalen aurreko adarretatik datoz.', n('3/p4/s5'), ['lepoko-nerbio-espinalak'], {
          tone: 'emphasis',
          plain: 'Nerbio horiek lepoko hirugarren, laugarren eta bosgarren nerbio espinaletatik datoz.',
        }),
        L(0.258, 'Zuntz horiek elkartzean nerbio frenikoak osatzen dituzte.', n('3/p4/s5', '3/p4/s6'), ['nerbio-frenikoa'], {
          tone: 'emphasis',
          writes: 'b-frenikoa',
          plain: 'Nerbio horiek batzen direnean nerbio frenikoa sortzen da. Horregatik du diafragmak lepoko nerbioa.',
        }),
        L(0.3956, 'Enbrioia atzetik gehiago hazten da aurretik baino, bizkarrezurragatik. Horregatik septuma jaisten hasten da.', n('3/p5/s1'), ['septum-transversum'], {
          tone: 'why',
          plain: 'Bizkarra azkarrago hazten da sabela baino. Ondorioz, septuma lepotik jaisten hasten da.',
        }),
        L(0.3956, '5. astearen bukaerarako, septumaren aurreko aldea 7. torax mailan dago, eta atzeko aldea 12. torax mailan.', n('3/p5/s2'), ['septum-transversum'], {
          tone: 'emphasis',
          writes: 'b-jaitsiera',
          plain: '5. astearen bukaeran, septumaren aurrealdea 7. torax mailan dago; atzealdea beherago, 12. torax mailan.',
        }),
        L(0.3956, 'Jaitsierarekin batera, nerbio frenikoak luzatu egiten dira septumera iristeko.', n('3/p5/s3'), ['nerbio-frenikoa'], {
          tone: 'why',
          plain: 'Septuma jaistean, nerbio frenikoak berarekin doaz eta luzatu egiten dira.',
        }),
      ],
      board: [
        {
          id: 'b-frenikoa',
          kind: 'line',
          text: 'Nerbio frenikoa: C3, C4 eta C5 (septuma lepo mailan sortzen delako)',
          notes: n('3/p4/s5', '3/p4/s6'),
          key: true,
        },
        {
          id: 'b-jaitsiera',
          kind: 'line',
          text: 'Jaitsiera (5. astearen bukaera): aurrea T7, atzea T12',
          notes: n('3/p5/s2'),
          key: true,
        },
      ],
      checks: [
        { kind: 'pool', id: 'mikro:7/diafragma-eraketa:2', after: 6 },
        {
          kind: 'contrast',
          id: 'klasea:7/aurrea-atzea',
          concept: 'septum-transversum',
          q: 'Jaitsi ondoren, septumaren aurreko eta atzeko aldeak: zein mailatan daude?',
          options: ['Aurrea 7. torax mailan; atzea 12. torax mailan', 'Aurrea 12. torax mailan; atzea 7. torax mailan', 'Biak 7. torax mailan'],
          answer: 0,
          why: ['Bai: atzetik gehiago hazten da, eta atzea askoz beherago geratzen da.', 'Ez: alderantziz da.', 'Ez: atzea askoz beherago dago.'],
          notes: n('3/p5/s2'),
        },
      ],
    },

    {
      id: 'osagaiak',
      title: 'Erretenak ixten dira',
      stage: 'diafragma-eraketa',
      lines: [
        L(0.5332, '4. astean, goiko eta beheko barrunbeak komunikatuta daude, erreten perikardioperitonealen bidez, alde dortsalean.', n('3/p6/s1'), ['erreten-perikardioperitonealak'], {
          plain: 'Oraindik bi barrunbeak lotuta daude atzealdean, bi erretenen bidez.',
        }),
        L(0.6364, '5. astean, gorputzaren atze alboko paretetatik mintz pleuroperitonealak agertzen dira.', n('3/p7/s1'), ['mintz-pleuroperitonealak'], {
          plain: '5. astean, gorputzaren hormatik, atzean eta alboetan, beste bi mintz hazten dira: mintz pleuroperitonealak.',
        }),
        L(0.6364, 'Hazi ahala, hestegorri inguruko mesenkimarekin eta septumaren atzeko ertzarekin fusionatzen dira.', n('3/p7/s2'), [
          'mintz-pleuroperitonealak',
          'hestegorri-inguruko-mesenkima',
          'septum-transversum',
        ], { plain: 'Mintz horiek hazi eta atzeko mesenkimarekin eta septumarekin bat egiten dute.' }),
        L(0.6364, 'Horrela, erreten perikardioperitonealak itxita geratzen dira, eta bi barrunbeen arteko komunikazioa galtzen da.', n('3/p7/s2'), ['erreten-perikardioperitonealak'], {
          tone: 'emphasis',
          writes: 'b-pleuroperitonealak',
          plain: 'Horrela bi erretenak ixten dira, eta bi barrunbeak guztiz bereizita geratzen dira.',
        }),
        L(0.79, 'Beraz, diafragmak lau osagai ditu. Lehena, septum transversuma: bertako miozitoak mintz pleuroperitonealetara migratzen dute.', n('3.1/p3/s1'), [
          'septum-transversum',
          'miozitoak',
          'mintz-pleuroperitonealak',
        ], { plain: 'Diafragma lau zatiz egina dago. Lehena septuma da: bere muskulu zelulak mintzetara mugitzen dira.' }),
        L(0.79, 'Bigarrena, mintz pleuroperitonealak: pleuren eta peritoneoaren arteko komunikazioa ixten dute.', n('3.1/p4/s1', '3.1/p4/s2'), ['mintz-pleuroperitonealak'], {
          writes: 'tz-mintzak',
          plain: 'Bigarrena, mintz pleuroperitonealak: bi erretenak ixten dituzte.',
        }),
        L(0.79, 'Hirugarrena, hestegorri inguruko mesenkimatik sortutako zuntz muskularrak: hortik gerriko atala garatuko da.', n('3.1/p5/s1', '3.1/p5/s2'), ['hestegorri-inguruko-mesenkima'], {
          writes: 'tz-mesenkima',
          plain: 'Hirugarrena, hestegorri inguruko mesenkima: gerriko atala emango du.',
        }),
        L(0.79, 'Laugarrena, alde periferikoko atal muskularra, gorputzeko mesodermo paraxialetik sortua.', n('3.1/p6/s1'), ['gorputz-paretako-mesodermoa'], {
          writes: 'tz-paraxiala',
          plain: 'Laugarrena, ertzeko muskulua: gorputzeko mesodermo paraxialetik dator.',
        }),
      ],
      board: [
        {
          id: 'b-pleuroperitonealak',
          kind: 'line',
          text: 'Mintz pleuroperitonealak (5. astean agertu): 7. astean erretenak ixten dituzte',
          notes: n('3/p7/s1', '3/p7/s2'),
          key: true,
        },
        TABLE,
      ],
      checks: [
        { kind: 'pool', id: 'mikro:7/diafragma-eraketa:5', after: 3 },
        {
          kind: 'contrast',
          id: 'klasea:7/bi-mintzak',
          concept: 'mintz-pleuroperitonealak',
          q: 'Mintz pleuroperikardikoak eta mintz pleuroperitonealak: zein bi barrunbe bereizten ditu bakoitzak?',
          options: [
            'Pleuroperikardikoak pleura eta perikardioa; pleuroperitonealak pleura eta peritoneoa',
            'Pleuroperikardikoak pleura eta peritoneoa; pleuroperitonealak pleura eta perikardioa',
            'Biek perikardioa eta peritoneoa',
          ],
          answer: 0,
          why: ['Bai: mintzaren izenak esaten du zein bi barrunbe bereizten dituen.', 'Ez: alderantziz da.', 'Ez: mintz bakoitzak pleura bat bereizten du.'],
          notes: n('2.2/p9/s3', '3.1/p4/s1'),
        },
      ],
    },

    {
      id: 'heldua',
      title: 'Diafragma heldua',
      stage: 'diafragma-heldua',
      lines: [
        L(0, 'Helduan, septum transversumetik erdiko atal tendinosoa garatzen da: zentro tendinosoa.', n('3.1/p8/s1'), ['zentro-tendinosoa'], {
          tone: 'emphasis',
          writes: 'tz-septum',
          plain: 'Erdiko zati tendinosoa, zentro tendinosoa, septum transversumetik dator.',
        }),
        L(0, 'Zentro tendinosoan hiru hosto bereizten dira: eskuinekoa, erdikoa eta ezkerrekoa.', n('3.1/p8/s3'), ['zentro-tendinosoa'], {
          plain: 'Zentro tendinosoak hiru zati ditu, hostoak: eskuinekoa, erdikoa eta ezkerrekoa.',
        }),
        L(0.1493, 'Inguruko zuntzetan, bularrezur atala bularrezurrean insertatzen da, eta saihets-hezur atala saihets hezurretan.', n('3.1/p8/s4', '3.1/p9/s1', '3.1/p10/s1'), [
          'bularrezur-atala',
          'saihets-hezur-atala',
        ], { plain: 'Muskulu zatien izenak esaten du non lotzen diren: bularrezur atala bularrezurrean, saihets-hezur atala saihetsetan.' }),
        L(0.2987, 'Gerriko atalean bi zutabe bereizten dira.', n('3.1/p11/s1', '3.1/p11/s2'), ['gerriko-atala', 'diafragmaren-zutabeak'], {
          plain: 'Gerriko atala bi zutabetan amaitzen da, ornoetara lotuta.',
        }),
        L(0.2987, 'Eskuineko zutabea hasierako hiru gerri-ornoetan insertatzen da; ezkerrekoa, lehenengo bietan.', n('3.1/p11/s2'), ['diafragmaren-zutabeak'], {
          tone: 'emphasis',
          writes: 'b-zutabeak',
          plain: 'Eskuineko zutabea hiru gerri-ornotan lotzen da; ezkerrekoa, bitan bakarrik.',
        }),
        L(0.2987, 'Bi zutabe horien artean erdiko lotailu arkutua kokatzen da.', n('3.1/p12/s3'), ['erdiko-lotailu-arkutua'], {
          plain: 'Bi zutabeen artean zubi moduko lotailu bat dago: erdiko lotailu arkutua.',
        }),
        L(0.2987, 'Irudi hau mozketa frontala da, aurretik ikusita: abdomeneko aurreko pareta eta organo guztiak kendu dira.', n('3.1/p13/s2'), [], {
          plain: 'Hau aurretik begiratzen dugu, sabelaren horma eta barruko organoak kenduta.',
        }),
        L(0.448, 'Hainbat egiturak zeharkatzen dute. Toraxeko aorta aortaren hiatotik sartzen da abdomenera, erdiko lotailu arkutua zeharkatuz.', n('3.1/p18/s1', '3.1/p19/s1'), [
          'aorta',
          'aortaren-hiatoa',
          'erdiko-lotailu-arkutua',
        ], { plain: 'Zulo batzuetatik egiturak pasatzen dira. Aorta aortaren hiatotik pasatzen da, erdiko lotailu arkutuaren ondotik.' }),
        L(0.448, 'Beheko kaba zaina, abdomeneko zain garrantzitsuena, zentro tendinosoa zeharkatzen du, erdiko eta eskuineko hostoen artean.', n('3.1/p20/s1', '3.1/p20/s2', '3.1/p8/s3'), [
          'beheko-kaba-zaina',
          'zentro-tendinosoa',
          'beheko-kabaren-zuloa',
        ], { tone: 'emphasis', writes: 'b-zuloak', plain: 'Beheko kaba zaina tendoiaren erdiko eta eskuineko hostoen artetik igotzen da, eta eskuineko aurikulara iristen da.' }),
        L(0.448, 'Hestegorria toraxetik jaisten da, hestegorriaren hiatotik pasatzen da, eta abdomeneko hestegorria bihurtzen da.', n('3.1/p21/s1'), ['hestegorria', 'hestegorriaren-hiatoa'], {
          plain: 'Hestegorria toraxetik dator, bere zulotik pasatzen da, hestegorriaren hiatotik, eta abdomenean jarraitzen du.',
        }),
        L(0.448, 'Beste batzuk ere pasatzen dira: nerbio begetatiboak eta toraxeko nerbio esplaknikoak, besteak beste.', n('3.1/p18/s1'), [], {
          plain: 'Nerbio batzuk ere pasatzen dira: nerbio begetatiboak eta toraxeko nerbio esplaknikoak.',
        }),
        L(0.5787, 'Laburpena: diafragmaren zuntz muskularrak aurretik askoz gorago insertatzen dira atzetik baino.', n('3.1/p15/s1'), ['diafragma', 'bularrezur-atala', 'gerriko-atala'], {
          tone: 'emphasis',
          writes: 'b-makurdura',
          plain: 'Diafragma aurrean altu lotzen da, bularrezurrean; atzean, berriz, askoz beherago, gerri-ornoetan.',
        }),
      ],
      board: [
        {
          id: 'b-zutabeak',
          kind: 'line',
          text: 'Zutabeak: eskuinekoa hasierako 3 gerri-ornoetan; ezkerrekoa lehenengo 2etan; tartean erdiko lotailu arkutua',
          notes: n('3.1/p11/s2', '3.1/p12/s2', '3.1/p12/s3'),
          key: true,
        },
        {
          id: 'b-zuloak',
          kind: 'line',
          text: 'Aorta: aortaren hiatoa. Beheko kaba: zentro tendinosoa (erdiko eta eskuineko hostoen artean)',
          notes: n('3.1/p19/s1', '3.1/p20/s2', '3.1/p8/s3'),
          key: true,
        },
        {
          id: 'b-makurdura',
          kind: 'line',
          text: 'Aurrean gorago (bularrezurra), atzean beherago (gerri-ornoak)',
          notes: n('3.1/p15/s1'),
        },
      ],
      checks: [
        { kind: 'pool', id: 'mikro:7/diafragma-heldua:2', after: 4 },
        {
          kind: 'contrast',
          id: 'klasea:7/aorta-kaba',
          concept: 'beheko-kaba-zaina',
          after: 9,
          q: 'Aorta eta beheko kaba zaina: non zeharkatzen dute bakoitzak?',
          options: ['Aorta aortaren hiatotik; beheko kaba zentro tendinosoan', 'Aorta zentro tendinosoan; beheko kaba aortaren hiatotik', 'Biak hestegorriaren hiatotik'],
          answer: 0,
          why: ['Bai: aorta zutabeen artean, erdiko lotailu arkutuarekin; kaba tendoian.', 'Ez: alderantziz da.', 'Ez: hestegorriak bere hiatoa du.'],
          notes: n('3.1/p19/s1', '3.1/p20/s2', '3.1/p8/s3'),
        },
      ],
    },

    {
      id: 'amaiera',
      title: 'Osatu taula',
      stage: 'diafragma-heldua',
      lines: [
        L(0.84, 'Laburbilduz: septum transversumarekin zeloma bi zatitan banatzen da, goikoa eta behekoa.', n('4/p3/s1'), [], {
          tone: 'summary',
          plain: 'Gogoratu: septumak zeloma bitan zatitzen du, goiko zatia eta beheko zatia.',
        }),
        L(0.92, 'Goikoan bi pleura barrunbe eta perikardio barrunbe bat sortzen dira; behekoa peritoneo barrunbea da.', n('4/p5/s1', '4/p3/s1'), [
          'pleura-barrunbea',
          'perikardio-barrunbea',
          'peritoneo-barrunbea',
        ], { tone: 'summary', plain: 'Goikotik hiru barrunbe: bi pleura barrunbe eta perikardio barrunbea. Behekoa peritoneo barrunbea da.' }),
        L(0.92, 'Hestetik sortutako atalak hasieran peritoneo barrukoak dira, baina batzuk peritoneo kanpokoak bihurtzen dira, atzekaldean.', n('4/p4/s1'), [], {
          tone: 'summary',
          plain: 'Hesteko organoak hasieran barruan daude; batzuk gero atzera mugitzen dira eta atzeko hormari itsasten zaizkio.',
        }),
        L(0.92, 'Eta pleura barrunbeak espazio birtualak dira: egoera patologikoetan bakarrik bihurtzen dira errealak.', n('4/p5/s2'), ['pleura-barrunbea'], {
          tone: 'summary',
          plain: 'Pleura barrunbeek ez dute benetako hutsunerik; gaixotasunetan bakarrik irekitzen dira.',
        }),
        L(0.92, 'Orain zure txanda: osatu diafragmaren taula oroimenetik, eta gero galdera batzuk.', n('3.1/p8/s1'), ['diafragma'], {
          tone: 'summary',
          plain: 'Orain zu: bete taula buruz, eta gero erantzun galdera batzuei, gai osoari buruz.',
        }),
      ],
      checks: [
        { kind: 'fill', id: 'klasea:7/taula', table: 'taula', blanks: ['tz-septum', 'tz-mintzak', 'tz-mesenkima', 'tz-paraxiala'] },
        { kind: 'pool', id: 'w7-q-barrunbe-kopurua' },
      ],
    },
  ],
};
