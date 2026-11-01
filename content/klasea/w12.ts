import type { BoardItem, Lesson, Line } from '@/lib/klasea/types';

/**
 * Topic 12's class: the core of the notes (content/klasea/importance/w12.ts), said over the existing
 * stages, 3D views and camera moves, from the embryo's circulation to the arteries of the limbs. Every line
 * cites the sentences it rests on; tests/klasea.test.ts holds each line to them (numbers, directions,
 * names, the frames it is said over). Plan: docs/klasea-plan.md §4.
 */

const n = (...ids: string[]) => ids.map((id) => `w12/${id}`);

/** A line said at stage time `at`, lighting `focus`. */
const L = (at: number, say: string, notes: string[], focus: string[] = [], more: Partial<Line> = {}): Line => ({ at, say, notes, focus, ...more });

/** What each aortic arch becomes (notes 2.1, 2.3.1, 2.3.2, 2.3.4): the topic's one table. */
const TABLE: BoardItem = {
  id: 'taula',
  kind: 'table',
  head: ['Arkua', 'Zer sortzen du'],
  rows: [
    { id: 'tz-1', cells: ['Lehena', 'Arteria maxilarrak'], notes: n('2.1/p5/s2'), structures: ['lehen-aorta-arkua', 'arteria-maxilarra'] },
    { id: 'tz-2', cells: ['Bigarrena', 'Hioide arteria eta ointokiko arteria'], notes: n('2.1/p6/s2'), structures: ['bigarren-aorta-arkua', 'hioide-arteria'] },
    {
      id: 'tz-3',
      cells: ['Hirugarrena', 'Karotida komuna eta barneko karotidaren hurbileko zatia'],
      notes: n('2.3.2/p4/s1'),
      structures: ['hirugarren-aorta-arkua', 'karotida-komuna'],
    },
    {
      id: 'tz-4l',
      cells: ['Laugarrena, ezkerrean', 'Aorta makoaren urrutiko atala'],
      notes: n('2.3.2/p9/s1'),
      structures: ['laugarren-aorta-arkua', 'makoaren-urrutiko-atala'],
    },
    {
      id: 'tz-4r',
      cells: ['Laugarrena, eskuinean', 'Eskuineko subklabioaren hasierako atala'],
      notes: n('2.3.2/p11/s1'),
      structures: ['laugarren-aorta-arkua', 'eskuineko-subklabioa'],
    },
    {
      id: 'tz-6l',
      cells: ['Seigarrena, ezkerrean', 'Ezkerreko birika arteria eta hodi arteriosoa'],
      notes: n('2.3.4/p5/s1', '2.3.4/p6/s1'),
      structures: ['seigarren-aorta-arkua', 'hodi-arteriosoa'],
    },
    {
      id: 'tz-6r',
      cells: ['Seigarrena, eskuinean', 'Eskuineko birika arteria; urrutiko atala desagertzen da'],
      notes: n('2.3.4/p7/s1', '2.3.4/p8/s1'),
      structures: ['seigarren-aorta-arkua', 'eskuineko-birika-arteria'],
    },
  ],
};

export const LESSON_W12: Lesson = {
  week: 12,
  title: 'Arteria sistema',
  goals: [
    'Aorta arkuak: sei bikote, eta zer sortzen duen bakoitzak',
    'Aorta heldua: zergatik dira desberdinak eskuinean eta ezkerrean',
    'Nerbio laringeo atzerakariak: zergatik doaz bide desberdinetatik',
    'Beheranzko aortaren hiru adar taldeak',
    'Zilborreko arteriak, arteria iliakoak eta gorputz adarren arteriak',
  ],
  chunks: [
    {
      id: 'gaur',
      title: 'Gaur',
      stage: 'sarrera',
      lines: [
        L(0.12, 'Kaixo! Gaur arteria sistemaren garapena ikasiko dugu.', n('1/p4/s1'), [], { plain: 'Gaurko gaia: arteriak nola sortzen eta aldatzen diren enbrioian.' }),
        L(0.12, 'Arteria bat bihotzetik gorputzeko beste ataletara odola eramaten duen odol hodia da.', n('1/p4/s1'), [], {
          tone: 'emphasis',
          writes: 'b-arteria',
          plain: 'Arteria: bihotzetik ateratzen den hodia. Odola bihotzetik gorputz osora eramaten du.',
        }),
        L(0.28, 'Bihotz lakioaren alde bulbarraren urrutiko atalari arteria enborra deritzo.', n('1/p4/s3'), ['bihotz-lakioa', 'enbor-arteriosoa'], {
          plain: 'Bihotz lakioaren irteerako zatiari, arteriak sortzen diren tokiari, arteria enborra deitzen zaio.',
        }),
        L(0.28, 'Handik garatuko dira gure arteria garrantzitsuenak: birika enborra eta aorta.', n('1/p4/s3'), ['enbor-arteriosoa'], {
          tone: 'emphasis',
          writes: 'b-enborra',
          plain: 'Enbor horretatik sortuko dira bi arteria handienak: birika enborra eta aorta.',
        }),
        L(0.635, 'Zilborreko zainek karenatik odol oxigenatua dakarte.', n('1/p4/s5'), ['zilbor-zainak'], { plain: 'Zilborreko zainek karenatik datorren odola dakarte, oxigenoz betea.' }),
        L(0.635, 'Bitelo zainak eta kardinal zainak, berriz, oxigeno gutxiko odola dakarte.', n('1/p4/s5'), ['bitelo-zainak'], {
          plain: 'Bitelo zainak eta kardinal zainak, aldiz, oxigeno gutxiko odola dakarte.',
        }),
        L(0.635, 'Beraz, bihotz lakioan bi odolak nahasten dira.', n('1/p4/s6'), ['bihotz-lakioa'], {
          tone: 'emphasis',
          writes: 'b-odola',
          plain: 'Zain guztiak bihotz lakiora iristen dira, eta han odol oxigenatua eta oxigeno gutxikoa nahasten dira.',
        }),
        L(0.96, '5. astean, lepoan, 6 faringe arku bikote agertzen dira. Bakoitzak bere arteria du: aorta arkua.', n('1/p5/s1', '1/p5/s2'), ['faringe-arkuak', 'aorta-arkuak'], {
          tone: 'emphasis',
          writes: 'b-arkua',
          plain: 'Lepoan sei koskor bikote sortzen dira, faringe arkuak. Arku bakoitzak bere arteria izango du: aorta arkua.',
        }),
      ],
      board: [
        { id: 'b-arteria', kind: 'line', text: 'Arteria: bihotzetik gorputzeko beste ataletara odola eramaten duen odol hodia', notes: n('1/p4/s1') },
        { id: 'b-enborra', kind: 'line', text: 'Arteria enborra (alde bulbarraren urrutiko atala): birika enborra eta aorta', notes: n('1/p4/s3'), key: true },
        { id: 'b-odola', kind: 'line', text: 'Zilborreko zainak: odol oxigenatua. Bitelo eta kardinal zainak: oxigeno gutxi. Bihotz lakioan nahasten dira', notes: n('1/p4/s5', '1/p4/s6') },
        { id: 'b-arkua', kind: 'line', text: 'Faringe arku bakoitzak bere arteria: aorta arkua (6 bikote)', notes: n('1/p5/s1', '1/p5/s2'), key: true },
      ],
      checks: [
        {
          kind: 'predict',
          after: 1,
          q: 'Zer uste duzu: enbrioian, nondik ateratzen dira arteria handiak?',
          options: ['Bihotz lakioaren alde bulbarretik', 'Zain sinutik', 'Karenatik'],
          answer: 0,
          why: ['Bai: alde bulbarraren urrutiko atala, arteria enborra, da arteria handien jatorria.', 'Ez: zain sinura zainak iristen dira.', 'Ez: karenatik zilborreko zainak datoz, bihotzera.'],
          notes: n('1/p4/s3'),
        },
        { kind: 'pool', id: 'mikro:12/sarrera:3' },
      ],
    },

    {
      id: 'sistema',
      title: 'Arku sistema',
      stage: 'arku-sistema',
      lines: [
        L(0.1275, 'Enbor arteriosoaren urrutiko atalari aorta zakua deritzo.', n('2/p4/s1'), ['enbor-arteriosoa', 'aorta-zakua'], {
          plain: 'Arteria enborraren muturrari aorta zakua deitzen zaio: hortik aterako dira arteriak.',
        }),
        L(0.2975, 'Bi aorta dortsal daude, eskuinekoa eta ezkerrekoa, enbrioiaren atzealdean.', n('2/p4/s1'), ['aorta-dortsalak'], {
          plain: 'Enbrioiaren bizkarraldean bi aorta luze daude, bat alde bakoitzean: aorta dortsalak.',
        }),
        L(0.535, 'Aorta zakuaren luzapenak eta aorta dortsalak lotzen dituzten hodiei aorta arkuak deritze: sei bikote, bata bestearen ondoren.', n('2/p4/s2', '2/p4/s3'), ['aorta-zakua', 'aorta-dortsalak', 'aorta-arkuak'], {
          tone: 'emphasis',
          writes: 'b-arkuak',
          plain: 'Aorta arkuak zubiak dira, aorta zakuaren eta aorta dortsalen artean. Sei bikote sortzen dira, ez denak batera.',
        }),
        L(0.765, 'Gero, bi aorta dortsalak T4 mailatik behera fusionatzen dira, eta aorta dortsal bakarra sortzen da.', n('2/p5/s1'), ['aorta-dortsalak'], {
          tone: 'emphasis',
          writes: 'b-fusioa',
          plain: 'Toraxeko laugarren ornoaren mailatik behera, bi aorta dortsalak bat egiten dute: aorta bakarra geratzen da.',
        }),
        L(0.955, 'Gainetik, alde zefalikoan, bi aorta dortsalak bananduta geratzen dira.', n('2/p5/s2'), ['aorta-dortsalak'], { plain: 'Goialdean, buruaren aldean, bi aortak bananduta jarraitzen dute.' }),
      ],
      board: [
        { id: 'b-arkuak', kind: 'line', text: 'Aorta arkuak: aorta zakuaren luzapenen eta aorta dortsalen arteko loturak; 6 bikote, banan-banan', notes: n('2/p4/s2', '2/p4/s3'), key: true },
        { id: 'b-fusioa', kind: 'line', text: 'Bi aorta dortsalak T4tik behera fusionatzen dira: aorta dortsal bakarra', notes: n('2/p5/s1') },
      ],
      checks: [
        {
          kind: 'contrast',
          id: 'klasea:12/arkuak-dortsalak',
          concept: 'aorta-arkuak',
          q: 'Aorta arkuak eta aorta dortsalak: zein da zein?',
          options: [
            'Arkuek aorta zakua eta aorta dortsalak lotzen dituzte; dortsalak T4tik behera fusionatzen dira',
            'Dortsalek aorta zakua eta arkuak lotzen dituzte; arkuak T4tik behera fusionatzen dira',
            'Arkuak eta aorta dortsalak gauza bera dira',
            'Arkuak fusionatzen dira; aorta dortsalak beti bananduta daude',
          ],
          answer: 0,
          why: [
            'Bai: arkuak zubiak dira; bi aorta dortsalak T4tik behera bat egiten dute.',
            'Ez: alderantziz da.',
            'Ez: arkuak zakuaren eta aorta dortsalen arteko loturak dira.',
            'Ez: aorta dortsalak dira T4tik behera fusionatzen direnak.',
          ],
          notes: n('2/p4/s2', '2/p4/s3', '2/p5/s1'),
        },
        { kind: 'pool', id: 'w12-q-fusioa' },
      ],
    },

    {
      id: 'eguna-27',
      title: '27. eguna',
      stage: 'eguna-27',
      lines: [
        L(0.1125, '27. egunean, faringe arkuekin batera, aorta arkuak sortzen dira, banan-banan.', n('2.1/p3/s1', '2.1/p4/s1'), ['faringe-arkuak', 'aorta-arkuak'], {
          plain: '27. egunean, lepoko faringe arku bakoitzarekin batera, bere aorta arkua agertzen da.',
        }),
        L(0.2625, 'Lehen aorta arkua ia osorik desagertzen da; geratzen den zatitik arteria maxilarrak garatzen dira.', n('2.1/p5/s1', '2.1/p5/s2'), ['lehen-aorta-arkua', 'arteria-maxilarra'], {
          writes: 'tz-1',
          plain: 'Lehen arkua ia osorik galtzen da. Gelditzen den zati txikitik arteria maxilarrak sortzen dira.',
        }),
        L(0.42, 'Bigarren aorta arkuan gauza bera: zati handiena desagertzen da, eta hondarretik hioide arteria eta ointokiko arteria sortzen dira.', n('2.1/p6/s1', '2.1/p6/s2'), ['bigarren-aorta-arkua', 'hioide-arteria', 'ointokiko-arteria'], {
          writes: 'tz-2',
          plain: 'Bigarren arkuarekin berdin: ia dena galtzen da. Geratzen denetik bi arteria txiki: hioide arteria eta ointokiko arteria.',
        }),
        L(0.58, 'Hirugarren aorta arkuak, berriz, handi bihurtzen dira, eta laugarrenak agertzen hasten dira.', n('2.1/p7/s1', '2.1/p8/s1'), ['hirugarren-aorta-arkua', 'laugarren-aorta-arkua'], {
          plain: 'Hirugarren arkuak hazi eta handiak egiten dira. Laugarren arkuak ere orduan sortzen dira.',
        }),
        L(0.67, 'Bostgarrena ez da guztiz garatzen, eta laster desagertzen da.', n('2.1/p9/s1'), ['bostgarren-aorta-arkua'], { plain: 'Bostgarren arkua ia ez da sortzen: oso gutxi irauten du.' }),
        L(0.945, 'Seigarrena ere garatzen hasten da, eta adartxo batzuk ditu: hasierako birika arteriak.', n('2.1/p10/s1', '2.1/p10/s2'), ['seigarren-aorta-arkua', 'hasierako-birika-arteriak'], {
          tone: 'emphasis',
          plain: 'Seigarren arkua ere sortzen da. Bertatik adar txiki batzuk ateratzen dira, birikara doazenak: hasierako birika arteriak.',
        }),
      ],
      board: [TABLE],
      checks: [
        {
          kind: 'contrast',
          id: 'klasea:12/lehen-bigarren',
          concept: 'arteria-maxilarra',
          q: 'Lehen eta bigarren aorta arkuen hondarrak: zer sortzen du bakoitzak?',
          options: [
            'Lehenak arteria maxilarrak; bigarrenak hioide arteria eta ointokiko arteria',
            'Lehenak hioide arteria eta ointokiko arteria; bigarrenak arteria maxilarrak',
            'Biek arteria maxilarrak',
            'Biek ez dute ezer sortzen',
          ],
          answer: 0,
          why: [
            'Bai: lehenaren hondarretik maxilarrak; bigarrenaren hondarretik hioide eta ointokiko arteriak.',
            'Ez: alderantziz da.',
            'Ez: bigarrenetik hioide eta ointokiko arteriak datoz.',
            'Ez: bostgarrena da ezer sortzen ez duena.',
          ],
          notes: n('2.1/p5/s2', '2.1/p6/s2'),
        },
        { kind: 'pool', id: 'mikro:12/eguna-27:5' },
      ],
    },

    {
      id: 'eguna-29',
      title: '29. eguna',
      stage: 'eguna-29',
      lines: [
        L(0.1125, '29. egunean, lehen eta bigarren aorta arkuak guztiz desagertu dira; haien arteriak bakarrik geratzen dira.', n('2.2.1/p3/s1', '2.2.1/p4/s1', '2.2.1/p5/s1'), ['arteria-maxilarra', 'hioide-arteria', 'ointokiko-arteria'], {
          plain: '29. egunean lehen bi arkuak galdu dira. Geratzen dira arteria maxilarrak, hioide arteria eta ointokiko arteria.',
        }),
        L(0.2775, 'Hirugarren eta laugarren aorta arkuak handitzen dira.', n('2.2.1/p6/s1'), ['hirugarren-aorta-arkua', 'laugarren-aorta-arkua'], {
          plain: 'Hirugarren arkuak eta laugarren arkuak hazi egiten dira: lodiago bihurtzen dira.',
        }),
        L(0.455, 'Trenkada bat sortzean, enbor bakarretik bi arteria bereizten dira: goranzko aorta eta birika enborra.', n('2.2.1/p8/s2'), ['goranzko-aorta', 'birika-arteria'], {
          tone: 'emphasis',
          plain: 'Arteria enbor bakarraren barruan horma bat hazten da, eta bi hodi geratzen dira: goranzko aorta eta birika enborra.',
        }),
        L(0.455, 'Seigarren arkua birika enborrarekin lotzen da.', n('2.2.1/p8/s1'), ['seigarren-aorta-arkua', 'birika-arteria'], { plain: 'Seigarren arkua birika enborrera iristen da, eta harekin lotzen da.' }),
        L(0.62, 'Aorta zakua goranzko aorta bihurtzen da, eta haren bi luzapenetatik arteria berriak sortzen dira, ez simetrikoki.', n('2.2.2/p3/s1'), ['aorta-zakua', 'goranzko-aorta'], {
          plain: 'Aorta zakua goranzko aortaren parte bihurtzen da. Haren bi luzapenek arteria desberdinak emango dituzte.',
        }),
        L(0.7875, 'Ezkerreko luzapena, lodiagoa, aortaren makoaren hasierako zatia bihurtzen da.', n('2.2.2/p5/s1', '2.2.2/p7/s1'), ['aortaren-makoa'], {
          tone: 'emphasis',
          plain: 'Ezkerreko luzapena lodiagoa da: hortik aortaren makoaren lehen zatia sortzen da.',
        }),
        L(0.9575, 'Eskuineko luzapena, estuagoa, arteria brakiozefalikoa bihurtzen da: hortik eskuineko karotida komuna eta eskuineko subklabioa.', n('2.2.2/p6/s1', '2.2.2/p8/s1', '2.2.2/p8/s2'), ['enbor-brakiozefalikoa'], {
          tone: 'emphasis',
          writes: 'b-luzapenak',
          plain: 'Eskuineko luzapena meheagoa da: arteria brakiozefalikoa ematen du, eta hortik eskuineko karotida eta subklabioa ateratzen dira.',
        }),
      ],
      board: [
        {
          id: 'b-luzapenak',
          kind: 'line',
          text: 'Ezkerreko luzapena (lodiagoa): aorta makoaren hasierako zatia. Eskuinekoa (estuagoa): arteria brakiozefalikoa',
          notes: n('2.2.2/p7/s1', '2.2.2/p8/s1'),
          key: true,
        },
      ],
      checks: [
        {
          kind: 'contrast',
          id: 'klasea:12/luzapenak',
          concept: 'enbor-brakiozefalikoa',
          q: 'Aorta zakuaren bi luzapenak: zer ematen du bakoitzak?',
          options: [
            'Ezkerrekoak aorta makoaren hasiera; eskuinekoak arteria brakiozefalikoa',
            'Ezkerrekoak arteria brakiozefalikoa; eskuinekoak aorta makoaren hasiera',
            'Biek arteria brakiozefaliko bana',
            'Biek aorta makoa',
          ],
          answer: 0,
          why: [
            'Bai: ezkerrekoa, lodiagoa, makoa da; eskuinekoa, estuagoa, arteria brakiozefalikoa.',
            'Ez: alderantziz da.',
            'Ez: arteria brakiozefaliko bakarra dago, eskuinean.',
            'Ez: eskuinekoak arteria brakiozefalikoa ematen du.',
          ],
          notes: n('2.2.2/p7/s1', '2.2.2/p8/s1'),
        },
      ],
    },

    {
      id: 'karotidak',
      title: 'Hirugarren arkua',
      stage: 'hirugarren-arkua',
      lines: [
        L(0.1125, 'Lehenengo arkuak eta bigarrenak 28. egunaren inguruan agertzen dira, eta laster desagertzen dira.', n('2.3.1/p3/s1'), ['lehen-aorta-arkua'], {
          plain: 'Lehen bi arkuak goiz agertzen dira, 28. egunaren inguruan, eta gutxira galtzen dira.',
        }),
        L(0.42, 'Hirugarren arkuak bi aldeetan batera eta berdin garatzen dira.', n('2.3.2/p3/s1', '2.3.2/p3/s2'), ['hirugarren-aorta-arkua'], {
          tone: 'emphasis',
          plain: 'Hirugarren arkuetan bi aldeak berdinak dira: eskuinekoa eta ezkerrekoa berdin aldatzen dira.',
        }),
        L(0.595, 'Hirugarren arkuetatik karotida komunak sortzen dira, eta haietatik barneko karotiden hurbileko zatia.', n('2.3.2/p4/s1'), ['hirugarren-aorta-arkua', 'karotida-komuna', 'barneko-karotida'], {
          tone: 'emphasis',
          writes: 'tz-3',
          plain: 'Hirugarren arkutik karotida komuna ateratzen da, eta barneko karotidaren hasiera ere bai.',
        }),
        L(0.775, 'Barneko karotidaren urrutiko zatia, berriz, aorta dortsalaren alde kranealetik dator.', n('2.3.2/p5/s1'), ['barneko-karotida', 'aorta-dortsalak'], {
          plain: 'Barneko karotidaren azken zatia aorta dortsalaren goiko zatitik dator.',
        }),
        L(0.955, 'Kanpoko karotida karotida komunaren kimu gisa sortzen da.', n('2.3.2/p6/s1'), ['kanpoko-karotida', 'karotida-komuna'], {
          plain: 'Kanpoko karotida karotida komunetik ateratzen den adar berri bat da, kimu bat bezala.',
        }),
      ],
      checks: [
        {
          kind: 'contrast',
          id: 'klasea:12/karotidak',
          concept: 'barneko-karotida',
          q: 'Barneko karotida: nondik dator haren hurbileko zatia, eta nondik urrutikoa?',
          options: [
            'Hurbilekoa hirugarren arkutik; urrutikoa aorta dortsaletik',
            'Hurbilekoa aorta dortsaletik; urrutikoa hirugarren arkutik',
            'Biak hirugarren arkutik',
            'Biak karotida komunaren kimutik',
          ],
          answer: 0,
          why: [
            'Bai: karotida komunetik hurbileko zatia; aorta dortsaletik urrutikoa.',
            'Ez: alderantziz da.',
            'Ez: urrutiko zatia aorta dortsaletik dator.',
            'Ez: kimua kanpoko karotida da.',
          ],
          notes: n('2.3.2/p4/s1', '2.3.2/p5/s1'),
        },
        { kind: 'pool', id: 'w12-q-karotidak' },
      ],
    },

    {
      id: 'laugarrena',
      title: 'Laugarren arkua',
      stage: 'laugarren-arkua',
      lines: [
        L(0.105, 'Laugarren arkuetan, aldiz, ezkerrekoak eta eskuinekoak garapen desberdina dute.', n('2.3.2/p8/s1', '2.3.2/p14/s1'), ['laugarren-aorta-arkua'], {
          tone: 'emphasis',
          plain: 'Laugarren arkuetan bi aldeak ez dira berdin aldatzen: bakoitzak gauza desberdina ematen du.',
        }),
        L(0.26, 'Ezkerrean, laugarren arkua aorta makoaren urrutiko atala bihurtzen da: karotida komunaren eta subklabioaren artekoa.', n('2.3.2/p9/s1', '2.3.2/p15/s1'), ['laugarren-aorta-arkua', 'makoaren-urrutiko-atala', 'karotida-komuna'], {
          writes: 'tz-4l',
          plain: 'Ezkerreko laugarren arkua aortaren makoaren zati bat bihurtzen da: karotida komunaren eta subklabioaren arteko tartea.',
        }),
        L(0.435, 'Ezkerreko subklabioa ezkerreko zazpigarren segmentu arteko arteriatik sortzen da.', n('2.3.2/p10/s1'), ['ezkerreko-subklabioa'], {
          plain: 'Ezkerreko subklabioa ez dator arku batetik: zazpigarren segmentu arteko arteriatik dator.',
        }),
        L(0.435, 'Garapenean askoz gorago kokatzen da, ezkerreko karotidatik gertu.', n('2.3.2/p10/s1'), ['ezkerreko-subklabioa'], {
          writes: 'b-ezk-subklabioa',
          plain: 'Gero mugitu egiten da, eta askoz gorago geratzen da, karotidaren ondoan.',
        }),
        L(0.6, 'Eskuinean, laugarren arkuak eskuineko subklabioaren hasierako zatia ematen du.', n('2.3.2/p11/s1', '2.3.2/p17/s1'), ['laugarren-aorta-arkua', 'eskuineko-subklabioa'], {
          tone: 'emphasis',
          writes: 'tz-4r',
          plain: 'Eskuineko laugarren arkuak, aldiz, eskuineko subklabioaren lehen zatia baino ez du ematen.',
        }),
        L(0.775, 'Haren bitarteko zatia eskuineko aorta dortsaletik dator, eta urrutikoa eskuineko zazpigarren segmentu arteko arteriatik.', n('2.3.2/p12/s1', '2.3.2/p13/s1', '2.3.2/p17/s2'), ['eskuineko-subklabioa', 'aorta-dortsalak', 'zazpigarren-segmentu-arteko-arteria'], {
          tone: 'emphasis',
          writes: 'b-esk-subklabioa',
          plain: 'Bitarteko zatia eskuineko aorta dortsala da, eta azkena zazpigarren segmentu arteko arteria.',
        }),
        L(0.86, 'Bostgarren arkuak, gogoratu, agertu eta ia berehala desagertzen dira: ez dute ezer sortzen.', n('2.2.1/p7/s1', '2.3.3/p3/s1'), ['bostgarren-aorta-arkua'], {
          tone: 'recall',
          plain: 'Bostgarren arkua ia ez da sortzen, eta ez du arteriarik uzten.',
        }),
      ],
      board: [
        {
          id: 'b-ezk-subklabioa',
          kind: 'line',
          text: 'Ezkerreko subklabioa: ezkerreko zazpigarren segmentu arteko arteriatik; gero gorago, karotidatik gertu',
          notes: n('2.3.2/p10/s1'),
        },
        {
          id: 'b-esk-subklabioa',
          kind: 'line',
          text: 'Eskuineko subklabioa: hasiera laugarren arkutik; bitartekoa eskuineko aorta dortsaletik; urrutikoa eskuineko zazpigarren segmentu arteko arteriatik',
          notes: n('2.3.2/p11/s1', '2.3.2/p12/s1', '2.3.2/p13/s1'),
          key: true,
        },
      ],
      checks: [
        { kind: 'pool', id: 'w12-q-ezk-subklabioa', after: 3 },
        {
          kind: 'contrast',
          id: 'klasea:12/laugarrena',
          concept: 'laugarren-aorta-arkua',
          q: 'Laugarren arkua: zer ematen du alde bakoitzean?',
          options: [
            'Ezkerrean aorta makoaren urrutiko atala; eskuinean eskuineko subklabioaren hasiera',
            'Ezkerrean eskuineko subklabioaren hasiera; eskuinean aorta makoaren urrutiko atala',
            'Bi aldeetan aorta makoa',
            'Bi aldeetan subklabio osoa',
          ],
          answer: 0,
          why: [
            'Bai: ezkerrekoa makoaren urrutiko atala da; eskuinekoa subklabioaren hasiera.',
            'Ez: alderantziz da.',
            'Ez: makoa ezkerrean bakarrik.',
            'Ez: subklabioaren hasiera bakarrik, eskuinean.',
          ],
          notes: n('2.3.2/p11/s1', '2.3.2/p9/s1'),
        },
      ],
    },

    {
      id: 'seigarrena',
      title: 'Seigarren arkua',
      stage: 'seigarren-arkua',
      lines: [
        L(0.165, 'Seigarren arkuetan ere ezkerrekoak eta eskuinekoak garapen desberdina dute.', n('2.3.4/p3/s1'), ['seigarren-aorta-arkua'], {
          plain: 'Seigarren arkuan ere ezkerreko eta eskuineko arkuak ez dira berdin aldatzen.',
        }),
        L(0.4, 'Ezkerrean, arkuaren hurbileko zatitik eta hasierako birika arteriatik ezkerreko birika arteria sortzen da.', n('2.3.4/p5/s1', '2.3.4/p9/s1'), ['ezkerreko-birika-arteria', 'hasierako-birika-arteriak'], {
          plain: 'Ezkerreko arkuaren lehen zatia, bere adartxoarekin batera, ezkerreko birika arteria bihurtzen da.',
        }),
        L(0.64, 'Urrutiko zatitik hodi arteriosoa sortzen da: ezkerreko birika arteria aortarekin lotzen du.', n('2.3.4/p6/s1', '2.3.4/p9/s2'), ['hodi-arteriosoa', 'ezkerreko-birika-arteria'], {
          tone: 'emphasis',
          writes: 'tz-6l',
          plain: 'Arkuaren azken zatia hodi arteriosoa bihurtzen da: ezkerreko birika arteria eta aorta lotzen ditu.',
        }),
        L(0.925, 'Eskuinean, arkuaren urrutiko zatia desagertzen da, eta hurbilekotik eskuineko birika arteria sortzen da.', n('2.3.4/p7/s1', '2.3.4/p8/s1', '2.3.4/p10/s1'), ['eskuineko-birika-arteria'], {
          tone: 'emphasis',
          writes: 'tz-6r',
          plain: 'Eskuineko arkuaren azken zatia galdu egiten da; lehen zatia eskuineko birika arteria bihurtzen da.',
        }),
      ],
      checks: [
        {
          kind: 'predict',
          after: 0,
          q: 'Zer uste duzu: ezkerreko seigarren arkuak zer emango du?',
          options: ['Ezkerreko birika arteria eta hodi arteriosoa', 'Aorta makoa', 'Ezkerreko subklabioa'],
          answer: 0,
          why: ['Bai: hurbileko zatitik birika arteria; urrutikotik hodi arteriosoa.', 'Ez: makoaren urrutiko atala laugarren arkutik dator.', 'Ez: hura zazpigarren segmentu arteko arteriatik dator.'],
          notes: n('2.3.4/p5/s1', '2.3.4/p6/s1'),
        },
        {
          kind: 'contrast',
          id: 'klasea:12/seigarrena',
          concept: 'hodi-arteriosoa',
          q: 'Seigarren arkuaren urrutiko zatia: zer gertatzen zaio alde bakoitzean?',
          options: ['Ezkerrean hodi arteriosoa da; eskuinean desagertzen da', 'Eskuinean hodi arteriosoa da; ezkerrean desagertzen da', 'Bi aldeetan hodi arteriosoa da', 'Bi aldeetan birika arteria da'],
          answer: 0,
          why: [
            'Bai: ezkerrean hodi arteriosoa; eskuinean urrutiko zatia galtzen da.',
            'Ez: alderantziz da.',
            'Ez: eskuinean desagertzen da.',
            'Ez: birika arteriak hurbileko zatitik datoz.',
          ],
          notes: n('2.3.4/p6/s1', '2.3.4/p7/s1', '2.3.4/p9/s2', '2.3.4/p10/s1'),
        },
      ],
    },

    {
      id: 'aldaketak',
      title: 'Beste aldaketak',
      stage: 'beste-aldaketak',
      lines: [
        L(0.09, 'Arkuez gain, arteria sisteman beste aldaketa batzuk ere gertatzen dira. Lau ikusiko ditugu.', n('2.4/p3/s1'), [], { plain: 'Arkuez gain, beste lau aldaketa garrantzitsu daude. Banan-banan ikusiko ditugu.' }),
        L(0.18, 'Lehena: hirugarren eta laugarren arkuen arteko tarteak desagertzen dira: hodi karotideoak.', n('2.4/p4/s1'), ['hodi-karotideoa'], {
          cues: { 'hodi-karotideoa': 'hirugarren eta laugarren arkuen' },
          plain: 'Hirugarren eta laugarren arkuen artean dagoen hodi zatia galdu egiten da. Zati horiei hodi karotideoak deitzen zaie.',
        }),
        L(0.4, 'Bigarrena: eskuineko aorta dortsalaren zati bat ere desagertzen da, zazpigarren segmentu arteko arteriaren azpian.', n('2.4/p5/s1', '2.4/p5/s2'), ['aorta-dortsalak'], {
          plain: 'Eskuineko aorta dortsala moztu egiten da, zazpigarren segmentu arteko arteriaren azpian.',
        }),
        L(0.4, 'Ondorioz, ezkerreko aorta dortsala bakarrik geratzen da: beheranzko aorta ezkerreko aorta dortsaletik sortzen da.', n('2.4/p5/s2', '2.4/p5/s3'), ['aorta-dortsalak', 'beheranzko-aorta'], {
          tone: 'emphasis',
          writes: 'b-beheranzkoa',
          plain: 'Ezkerreko aorta dortsalak bakarrik jarraitzen du, eta hura da beheranzko aorta.',
        }),
        L(0.62, 'Hirugarrena: bihotz hodia lepotik toraxera jaisten da; horregatik, karotida komunak eta arteria brakiozefalikoa asko luzatzen dira.', n('2.4/p6/s1', '2.4/p6/s2'), ['karotida-komuna', 'enbor-brakiozefalikoa'], {
          tone: 'why',
          plain: 'Bihotz hodia lepotik bularrera jaisten da. Horregatik, karotida komunak eta arteria brakiozefalikoa luzatu egin behar dira.',
        }),
        L(0.815, 'Laugarrena: lepoa eratzean, ezkerreko subklabioak bere jatorria galtzen du, gorago kokatzen da, eta aortatik zuzenean irteten da.', n('2.4/p7/s1'), ['ezkerreko-subklabioa'], {
          plain: 'Lepoa luzatzean, ezkerreko subklabioa gora mugitzen da, eta azkenean aortatik bertatik ateratzen da.',
        }),
      ],
      board: [{ id: 'b-beheranzkoa', kind: 'line', text: 'Beheranzko aorta: ezkerreko aorta dortsaletik', notes: n('2.4/p5/s3'), key: true }],
      checks: [
        { kind: 'pool', id: 'mikro:12/beste-aldaketak:3', after: 4 },
        {
          kind: 'contrast',
          id: 'klasea:12/desagertzen',
          concept: 'hodi-karotideoa',
          q: 'Bi zati desagertzen dira: zein dira?',
          options: [
            'Hodi karotideoak eta eskuineko aorta dortsalaren zati bat',
            'Hodi karotideoak eta ezkerreko aorta dortsalaren zati bat',
            'Eskuineko eta ezkerreko aorta dortsalak osorik',
            'Hodi arteriosoa eta hodi karotideoak',
          ],
          answer: 0,
          why: [
            'Bai: hirugarren eta laugarren arkuen arteko tarteak, eta eskuineko aorta dortsalaren zati bat.',
            'Ez: ezkerrekoa geratzen da, beheranzko aorta da.',
            'Ez: ezkerrekoak jarraitzen du.',
            'Ez: hodi arteriosoa jaio arte irekita dago.',
          ],
          notes: n('2.4/p4/s1', '2.4/p5/s1'),
        },
      ],
    },

    {
      id: 'nerbioak',
      title: 'Nerbio atzerakariak',
      stage: 'nerbio-atzerakariak',
      lines: [
        L(0.0975, 'Gogoratu: laugarren eta seigarren arkuei lotutako garezur nerbioa nerbio bagoa da, hamargarren bikotea.', n('2.4/p8/s1'), ['nerbio-bagoa', 'laugarren-aorta-arkua', 'seigarren-aorta-arkua'], {
          tone: 'recall',
          plain: 'Arku horien nerbioa nerbio bagoa da, hamargarren garezur nerbioa.',
        }),
        L(0.235, 'Bagoaren adarrek laringeko muskuluak inerbatzen dituzte: goiko nerbio laringeoa eta nerbio laringeo atzerakaria.', n('2.4/p8/s5'), ['goiko-nerbio-laringeoa', 'nerbio-laringeo-atzerakaria', 'laringea'], {
          tone: 'emphasis',
          plain: 'Bagotik bi adar ateratzen dira laringerantz: goiko nerbio laringeoa eta nerbio laringeo atzerakaria.',
        }),
        L(0.235, 'Atzerakaria deitzen zaio, irten ondoren goruntz itzultzen delako, laringerantz.', n('2.4/p8/s5'), ['nerbio-laringeo-atzerakaria', 'laringea'], {
          plain: 'Izena hortik dator: nerbioa jaitsi egiten da, eta gero goruntz itzultzen da laringera.',
        }),
        L(0.3675, 'Arterien aldaketengatik, bi atzerakariek kokapen desberdina dute.', n('2.4/p9/s1'), ['eskuineko-nerbio-atzerakaria', 'ezkerreko-nerbio-atzerakaria'], {
          plain: 'Arteriak aldatu direnez, eskuineko eta ezkerreko nerbioak ez daude leku berean.',
        }),
        L(0.5125, 'Ezkerrean, atzerakariak seigarren arkuaren urrutiko zatia inguratzen du: hodi arteriosoa.', n('2.4/p10/s1'), ['ezkerreko-nerbio-atzerakaria', 'seigarren-aorta-arkua', 'hodi-arteriosoa'], {
          tone: 'emphasis',
          plain: 'Ezkerreko nerbioak hodi arteriosoaren azpitik egiten du buelta.',
        }),
        L(0.6775, 'Eskuinean, seigarren arkuaren urrutiko zatia desagertzen da, eta bostgarrena ez da inoiz garatzen.', n('2.4/p11/s2', '2.3.4/p10/s1'), ['seigarren-aorta-arkua'], {
          tone: 'recall',
          plain: 'Eskuinean seigarren arkuaren azken zatia galtzen da, eta bostgarrena ez da sortzen.',
        }),
        L(0.6775, 'Horregatik, eskuineko atzerakaria gorago igotzen da, laugarren arkutik sortutako eskuineko subklabioa inguratu arte.', n('2.4/p11/s1', '2.4/p13/s1'), ['eskuineko-nerbio-atzerakaria', 'laugarren-aorta-arkua', 'eskuineko-subklabioa'], {
          tone: 'emphasis',
          plain: 'Eskuineko nerbioa gora mugitzen da, eta eskuineko subklabioaren azpitik egiten du buelta.',
        }),
        L(0.825, 'Hodi arteriosoak, gogoratu, ezkerreko birika arteria eta aorta lotzen ditu.', n('2.4/p14/s1'), ['hodi-arteriosoa'], { plain: 'Hodi arteriosoa zubi bat da, ezkerreko birika arteriaren eta aortaren artean.' }),
        L(0.965, 'Jaio ondoren, hodi arteriosoa lotailu bihurtzen da: lotailu arteriosoa. Ezkerreko atzerakariak hura inguratzen du.', n('2.4/p14/s3', '2.4/p14/s4'), ['hodi-arteriosoa', 'lotailu-arteriosoa', 'ezkerreko-nerbio-atzerakaria'], {
          tone: 'emphasis',
          writes: 'b-nerbioak',
          plain: 'Jaio ondoren hodia itxi eta lokarri bat geratzen da, lotailu arteriosoa. Ezkerreko nerbioak hari ematen dio buelta.',
        }),
      ],
      board: [
        {
          id: 'b-nerbioak',
          kind: 'line',
          text: 'Ezkerreko atzerakaria: hodi arteriosoaren azpitik (gero lotailu arteriosoa). Eskuinekoa: eskuineko subklabioaren azpitik',
          notes: n('2.4/p10/s1', '2.4/p13/s1', '2.4/p14/s4'),
          key: true,
        },
      ],
      checks: [
        { kind: 'pool', id: 'mikro:12/nerbio-atzerakariak:4', after: 6 },
        {
          kind: 'contrast',
          id: 'klasea:12/atzerakariak',
          concept: 'ezkerreko-nerbio-atzerakaria',
          q: 'Nerbio laringeo atzerakariak: zer inguratzen du bakoitzak helduan?',
          options: [
            'Ezkerrekoak lotailu arteriosoa; eskuinekoak eskuineko subklabioa',
            'Ezkerrekoak eskuineko subklabioa; eskuinekoak lotailu arteriosoa',
            'Biek aorta makoa',
            'Biek lotailu arteriosoa',
          ],
          answer: 0,
          why: [
            'Bai: ezkerrean hodi arteriosoa, gero lotailua; eskuinean laugarren arkuko subklabioa.',
            'Ez: alderantziz da.',
            'Ez: ezkerrekoak lotailu arteriosoa inguratzen du.',
            'Ez: eskuinean ez dago hodi arteriosorik.',
          ],
          notes: n('2.4/p13/s1', '2.4/p14/s4'),
        },
      ],
    },

    {
      id: 'heldua',
      title: 'Aorta heldua',
      stage: 'aorta-heldua',
      lines: [
        L(0.075, 'Ikus dezagun emaitza: ezkerreko bentrikulutik irteten den aorta, eta haren adarrak, desberdinak eskuinean eta ezkerrean.', n('2.4/p16/s1', '2.3.4/p11/s1'), ['aorta'], {
          plain: 'Hau da azken emaitza: aorta, eta bertatik ateratzen diren arteriak. Eskuinean eta ezkerrean ez dira berdinak.',
        }),
        L(0.19, 'Goranzko aorta, hurbileko zatia, enbor arteriosotik dator.', n('2.4/p16/s2'), ['goranzko-aorta'], { plain: 'Aortaren lehen zatia, gorantz doana, enbor arteriosotik sortzen da: goranzko aorta.' }),
        L(0.31, 'Aortaren makoaren hasierako zatia aorta zakuaren ezkerreko luzapenetik dator.', n('2.4/p16/s3'), ['aortaren-makoa'], {
          plain: 'Makoa aortaren kurba da. Haren hasiera aorta zakuaren ezkerreko luzapenetik dator.',
        }),
        L(0.445, 'Gero beheranzko aorta dator: toraxetik jaisten da, diafragma zeharkatu, eta abdomenera sartzen da.', n('2.4/p16/s7', '2.4/p16/s8', '2.4/p16/s9'), ['beheranzko-aorta'], {
          writes: 'b-aorta',
          plain: 'Makoaren ondoren aorta behera doa: bularra, diafragma eta sabela zeharkatzen ditu.',
        }),
        L(0.585, 'Makotik ateratzen den lehen adarra arteria brakiozefalikoa da: hortik eskuineko subklabioa eta eskuineko karotida komuna.', n('2.3.4/p11/s4'), ['enbor-brakiozefalikoa', 'eskuineko-subklabioa', 'karotida-komuna'], {
          plain: 'Makoaren lehen adarra arteria brakiozefalikoa da, eta bitan banatzen da: eskuineko subklabioa eta eskuineko karotida komuna.',
        }),
        L(0.585, 'Kontuz: arteria brakiozefaliko bakarra dago, eskuinean. Ez esan eskuineko edo ezkerreko arteria brakiozefalikoa.', n('2.3.4/p11/s7'), ['enbor-brakiozefalikoa'], {
          tone: 'caution',
          writes: 'b-bakarra',
          plain: 'Arteria brakiozefalikoa bat bakarrik da, eta eskuinean dago. Ezkerrean ez dago halakorik.',
        }),
        L(0.725, 'Ezkerrean, berriz, ezkerreko karotida komuna eta ezkerreko subklabioa makotik zuzenean ateratzen dira, enbor komunik gabe.', n('2.4/p16/s5', '2.4/p16/s6'), ['karotida-komuna', 'ezkerreko-subklabioa'], {
          tone: 'emphasis',
          writes: 'b-makoa',
          plain: 'Ezkerreko karotida eta ezkerreko subklabioa bakoitza bere aldetik ateratzen da makotik.',
        }),
        L(0.8, 'Birika arteriak, berriz, bi adar ditu: eskumako eta ezkerreko birika arteriak.', n('2.4/p17/s1'), ['birika-arteria', 'eskuineko-birika-arteria', 'ezkerreko-birika-arteria'], {
          plain: 'Birika arteria bitan banatzen da: bat birika bakoitzera.',
        }),
      ],
      board: [
        {
          id: 'b-aorta',
          kind: 'line',
          text: 'Aorta: goranzkoa enbor arteriosotik; makoaren hasiera ezkerreko luzapenetik; urrutiko atala ezkerreko 4. arkutik',
          notes: n('2.4/p16/s2', '2.4/p16/s3', '2.4/p16/s8'),
        },
        { id: 'b-bakarra', kind: 'line', text: 'Arteria brakiozefalikoa: bakarra, eskuinean (eskuineko karotida komuna eta eskuineko subklabioa)', notes: n('2.3.4/p11/s7'), key: true },
        { id: 'b-makoa', kind: 'line', text: 'Ezkerrean: karotida komuna eta subklabioa makotik zuzenean, enbor komunik gabe', notes: n('2.4/p16/s5', '2.4/p16/s6') },
      ],
      checks: [
        { kind: 'pool', id: 'mikro:12/aorta-heldua:5' },
        {
          kind: 'contrast',
          id: 'klasea:12/brakiozefalikoa',
          concept: 'enbor-brakiozefalikoa',
          q: 'Aortaren makoaren adarrak: zein da zuzena?',
          options: [
            'Eskuinean arteria brakiozefaliko bat; ezkerrean karotida eta subklabioa bereizita',
            'Bi arteria brakiozefaliko, bat alde bakoitzean',
            'Ezkerrean arteria brakiozefaliko bat; eskuinean bereizita',
            'Lau adar bereizi, enbor komunik gabe',
          ],
          answer: 0,
          why: [
            'Bai: brakiozefalikoa bakarra da, eskuinean; ezkerrean bi adar makotik zuzenean.',
            'Ez: bakarra dago.',
            'Ez: eskuinean dago.',
            'Ez: eskuineko bi arteriek enbor komun bat dute.',
          ],
          notes: n('2.3.4/p11/s7', '2.4/p16/s5'),
        },
      ],
    },

    {
      id: 'aurrekoak',
      title: 'Aurreko errai adarrak',
      stage: 'adar-bentralak',
      lines: [
        L(0.12, 'Orain, abdomenera goaz. Bi aorta dortsalak fusionatuta daude: aorta bakarra.', n('2.5/p3/s1'), ['aorta-dortsalak'], {
          plain: 'Toraxetik sabelera jaitsiko gara. Han aorta bakarra dago, bi aorta dortsalen fusioz.',
        }),
        L(0.455, 'Hasieran aurreko adarrak bitelo arteriak dira. Bitelo zakua endekatzean, haiek ere bai, eta beste arteria batzuk sortzen dira.', n('2.5.1/p3/s1', '2.5.1/p3/s2'), ['bitelo-arteriak', 'bitelo-zaku-sekundarioa'], {
          plain: 'Lehenengo, bitelo zakura doazen arteriak daude. Zakua txikitzean, arteria horiek ere aldatu egiten dira.',
        }),
        L(0.62, 'Beheranzko aortatik hiru adar talde ateratzen dira: aurreko errai adarrak, alboko errai adarrak eta atze alboko adarrak.', n('2.5/p3/s3', '2.5/p4/s1', '2.5/p5/s1', '2.5/p6/s1'), ['beheranzko-aorta', 'aurreko-errai-adarrak', 'alboko-errai-adarrak', 'segmentu-arteko-arteriak'], {
          tone: 'emphasis',
          writes: 'b-taldeak',
          plain: 'Hiru adar mota: hestera doazenak, abdomeneko organoetara doazenak, eta bizkarraldera doazenak, maila guztietan.',
        }),
        L(0.78, 'Torax mailan, toraxeko aortaren aurreko paretatik bost arteria bikote ateratzen dira hestegorrira.', n('2.5.1/p4/s1'), ['hestegorriko-arteriak', 'hestegorria'], {
          plain: 'Bularrean, bost arteria pare ateratzen dira aortatik hestegorrira.',
        }),
        L(0.955, 'Abdomenean hiru arteria daude, hesteko hiru zatientzat: enbor zeliakoa, goiko arteria mesenterikoa eta beheko arteria mesenterikoa.', n('2.5.1/p5/s1'), ['enbor-zeliakoa', 'goiko-arteria-mesenterikoa', 'beheko-arteria-mesenterikoa'], {
          plain: 'Sabelean hiru arteria daude, bakoitza hestearen zati batentzat.',
        }),
        L(0.955, 'Enbor zeliakoa aurreko hestearen arteria da, eta barea eta gibela irrigatzen ditu.', n('2.5.1/p6/s1', '2.5.1/p6/s2'), ['enbor-zeliakoa', 'aurreko-hestea'], {
          plain: 'Enbor zeliakoak hestearen lehen zatia elikatzen du, aurreko hestea: barea eta gibela.',
        }),
        L(0.955, 'Goiko mesenterikoa bitarteko hestearena da; beheko mesenterikoa, atzeko hestearena.', n('2.5.1/p7/s1', '2.5.1/p8/s1'), ['goiko-arteria-mesenterikoa', 'erdiko-hestea', 'beheko-arteria-mesenterikoa', 'atzeko-hestea'], {
          tone: 'emphasis',
          writes: 'b-hesteak',
          plain: 'Goiko arteria mesenterikoa erdiko hesterako da, eta beheko arteria mesenterikoa azken zatirako, atzeko hesterako.',
        }),
      ],
      board: [
        {
          id: 'b-taldeak',
          kind: 'line',
          text: 'Beheranzko aortaren adarrak: aurreko errai adarrak (hestera), alboko errai adarrak (abdomenean), atze alboko adarrak (maila guztietan)',
          notes: n('2.5/p4/s1', '2.5/p5/s1', '2.5/p6/s1', '2.5/p6/s2'),
          key: true,
        },
        {
          id: 'b-hesteak',
          kind: 'line',
          text: 'Enbor zeliakoa: aurreko hestea. Goiko mesenterikoa: bitarteko hestea. Beheko mesenterikoa: atzeko hestea',
          notes: n('2.5.1/p6/s2', '2.5.1/p7/s1', '2.5.1/p8/s1'),
          key: true,
        },
      ],
      checks: [
        { kind: 'pool', id: 'mikro:12/adar-bentralak:3', after: 2 },
        {
          kind: 'contrast',
          id: 'klasea:12/mesenterikoak',
          concept: 'goiko-arteria-mesenterikoa',
          q: 'Goiko eta beheko arteria mesenterikoak: zein hesterena da bakoitza?',
          options: [
            'Goikoa bitarteko hestearena; behekoa atzeko hestearena',
            'Goikoa atzeko hestearena; behekoa bitarteko hestearena',
            'Goikoa aurreko hestearena; behekoa bitarteko hestearena',
            'Biak bitarteko hestearenak',
          ],
          answer: 0,
          why: [
            'Bai: goikoa bitarteko hestearena; behekoa atzeko hestearena.',
            'Ez: alderantziz da.',
            'Ez: aurreko hestearena enbor zeliakoa da.',
            'Ez: behekoa atzeko hestearena da.',
          ],
          notes: n('2.5.1/p6/s2', '2.5.1/p7/s1', '2.5.1/p8/s1'),
        },
      ],
    },

    {
      id: 'albokoak',
      title: 'Alboko eta atze alboko adarrak',
      stage: 'alboko-adarrak',
      lines: [
        L(0.0975, 'Alboko errai adarrak abdomenean daude. Asko dira, baina hiru ikasiko ditugu.', n('2.5.2/p3/s1'), ['alboko-errai-adarrak'], {
          plain: 'Alboko errai adarrak sabeleko organoetara doaz. Hiru ezagutu behar ditugu.',
        }),
        L(0.2275, 'Giltzurrun gaineko arteriak, arteria adrenalak, giltzurrun gaineko guruinetara doaz; giltzurrun arteriak, giltzurrunetara.', n('2.5.2/p4/s1', '2.5.2/p5/s1'), ['giltzurrun-gaineko-arteriak', 'giltzurrun-gaineko-guruinak', 'giltzurrun-arteriak', 'giltzurruna'], {
          plain: 'Bi arteria giltzurrunetarako: giltzurrun gaineko arteriak guruinetara, eta giltzurrun arteriak giltzurrunetara.',
        }),
        L(0.365, 'Hirugarrena arteria gonadalak dira: obulutegietara edo barrabiletara doaz.', n('2.5.2/p6/s1'), ['arteria-gonadalak', 'gonadak'], {
          writes: 'b-alboko',
          plain: 'Hirugarrena, arteria gonadalak, gonadetara doaz: obulutegiak edo barrabilak.',
        }),
        L(0.38, 'Apunteek beste bat ere aipatzen dute: beheko diafragma arteriak, diafragmaren beheko aurpegirako.', n('2.5.2/p7/s1'), [], {
          plain: 'Apunteetan laugarren bat ere badago: diafragmaren azpiko aldera doazen arteriak.',
        }),
        L(0.52, 'Segmentu arteko arteriak maila guztietan daude, eta bizkarraldeko muskuluak, orno muina eta larruazala irrigatzen dituzte.', n('2.5.3/p3/s1'), ['segmentu-arteko-arteriak'], {
          plain: 'Atzeko adar hauek leku guztietan daude: bizkarreko muskuluak, bizkarrezur muina eta azala elikatzen dituzte.',
        }),
        L(0.695, 'Lepoan, segmentu arteko arteriak luzetarako anastomosien bidez lotzen dira, eta aortarekiko lotura galtzen dute.', n('2.5.3/p4/s2'), ['segmentu-arteko-arteriak', 'luzetarako-anastomosiak'], {
          plain: 'Lepoan arteria horiek elkarren artean lotzen dira, kate luze bat eginez, eta aortatik askatzen dira.',
        }),
        L(0.695, 'Horrela sortzen dira orno arteriak eta lepoko beste arteria batzuk.', n('2.5.3/p4/s3'), ['orno-arteria'], {
          tone: 'emphasis',
          writes: 'b-lepoa',
          plain: 'Kate horretatik orno arteriak eta lepoko beste arteria batzuk sortzen dira.',
        }),
        L(0.845, 'Toraxean saihets arteko arteriak dira; gerrian, arteria lunbarrak; eta sakroan, alboko arteria sakroak.', n('2.5.3/p5/s1', '2.5.3/p6/s1', '2.5.3/p7/s1'), ['saihets-arteko-arteriak', 'arteria-lunbarrak', 'alboko-arteria-sakroak'], {
          tone: 'emphasis',
          writes: 'b-mailak',
          plain: 'Bularrean saihetsen artean doaz; gerrian, arteria lunbarrak dira; sakroan, alboko arteria sakroak.',
        }),
        L(0.9, 'Lepoan, gainera, arteria horiek arteria subklabioen eraketan parte hartzen dute.', n('2.5.3/p4/s1'), ['ezkerreko-subklabioa'], {
          plain: 'Lepoan arteria horiek besoetara doazen arteria subklabioak eratzen laguntzen dute.',
        }),
      ],
      board: [
        {
          id: 'b-alboko',
          kind: 'line',
          text: 'Alboko errai adarrak: giltzurrun gaineko arteriak (adrenalak), giltzurrun arteriak, arteria gonadalak',
          notes: n('2.5.2/p4/s1', '2.5.2/p5/s1', '2.5.2/p6/s1'),
          key: true,
        },
        { id: 'b-lepoa', kind: 'line', text: 'Lepoan: luzetarako anastomosiak, aortarekiko lotura galdu: orno arteriak', notes: n('2.5.3/p4/s2', '2.5.3/p4/s3') },
        { id: 'b-mailak', kind: 'line', text: 'Segmentu arteko arteriak: toraxean saihets artekoak, gerrian lunbarrak, sakroan alboko sakroak', notes: n('2.5.3/p5/s1', '2.5.3/p6/s1', '2.5.3/p7/s1') },
      ],
      checks: [
        { kind: 'pool', id: 'mikro:12/alboko-adarrak:4', after: 5 },
        {
          kind: 'contrast',
          id: 'klasea:12/alboko-atze',
          concept: 'segmentu-arteko-arteriak',
          q: 'Alboko errai adarrak eta atze alboko adarrak: zein da zein?',
          options: [
            'Albokoak abdomenean; atze albokoak maila guztietan',
            'Albokoak maila guztietan; atze albokoak abdomenean bakarrik',
            'Biak abdomenean bakarrik',
            'Biak hestera doaz',
          ],
          answer: 0,
          why: [
            'Bai: alboko errai adarrak abdomenean; segmentu arteko arteriak maila guztietan.',
            'Ez: alderantziz da.',
            'Ez: atze albokoak maila guztietan daude.',
            'Ez: hestera aurreko errai adarrak doaz.',
          ],
          notes: n('2.5/p5/s1', '2.5/p6/s1', '2.5/p6/s2'),
        },
      ],
    },

    {
      id: 'iliakoak',
      title: 'Zilborreko eta iliako arteriak',
      stage: 'zilbor-iliakoak',
      lines: [
        L(0.1275, 'Aorta dortsalaren urrutiko zatitik, sakro mailan, zilborreko arteriak ateratzen dira, karenara.', n('2.6/p3/s1'), ['zilbor-arteriak', 'beheranzko-aorta'], {
          plain: 'Aortaren azken zatitik zilborreko arteriak ateratzen dira, eta odola karenara daramate.',
        }),
        L(0.3125, 'Gerriko bostgarren segmentu arteko arteriatik arteria iliako primitiboak sortzen dira, bi aldeetan.', n('2.6/p3/s5'), ['arteria-iliako-primitiboak'], {
          tone: 'emphasis',
          writes: 'b-iliakoak',
          plain: 'Arteria iliako primitiboak ez datoz zuzenean aortatik: gerriko bostgarren segmentu arteko arteriatik datoz.',
        }),
        L(0.51, 'Kanpoko arteria iliakoa luzatu egiten da, eta iztai lotailuaren azpitik arteria femorala deitzen da.', n('2.6/p4/s1'), ['kanpoko-arteria-iliakoa', 'arteria-femorala'], {
          plain: 'Kanpoko iliakoa hankara doa; iztaia pasatu ondoren, arteria femorala deitzen zaio.',
        }),
        L(0.725, 'Zilborreko arteriek aortarekiko lotura galtzen dute, eta barneko arteria iliakoarekin lotzen dira.', n('2.6/p3/s3', '2.6/p5/s1'), ['zilbor-arteriak', 'barneko-arteria-iliakoa'], {
          tone: 'emphasis',
          plain: 'Zilborreko arteriak aortatik askatu, eta barneko arteria iliakoari lotzen zaizkio.',
        }),
        L(0.725, 'Barneko iliakoaren adarrek pelbiseko organoak eta ipurmasailak irrigatzen dituzte.', n('2.6/p5/s3'), ['barneko-arteria-iliakoa'], { plain: 'Barneko iliakoak pelbiseko organoak eta ipurmasailak elikatzen ditu.' }),
        L(0.945, 'Jaio ondoren, zilborreko arteriak itxi egiten dira, eta haien urrutiko zatitik erdialdeko zilbor lotailuak sortzen dira.', n('2.6/p6/s1'), ['zilbor-arteriak', 'erdialdeko-zilbor-lotailua'], {
          tone: 'emphasis',
          writes: 'b-lotailuak',
          plain: 'Jaio ondoren zilborreko arteriak ixten dira: azken zatia lokarri bihurtzen da, erdialdeko zilbor lotailua.',
        }),
        L(0.945, 'Hurbileko zatitik, berriz, goiko gernu maskuriaren arteria geratzen da.', n('2.6/p8/s1'), ['goiko-gernu-maskuri-arteria'], {
          plain: 'Lehen zatia, aldiz, arteria bat da oraindik: goiko gernu maskuriaren arteria.',
        }),
      ],
      board: [
        { id: 'b-iliakoak', kind: 'line', text: 'Arteria iliako primitiboak: gerriko V. segmentu arteko arteriatik', notes: n('2.6/p3/s5'), key: true },
        {
          id: 'b-lotailuak',
          kind: 'line',
          text: 'Jaio ondoren: zilborreko arterien urrutiko zatia erdialdeko zilbor lotailuak; hurbilekoa goiko gernu maskuriaren arteria',
          notes: n('2.6/p6/s1', '2.6/p8/s1'),
        },
      ],
      checks: [
        { kind: 'pool', id: 'mikro:12/zilbor-iliakoak:3', after: 4 },
        {
          kind: 'contrast',
          id: 'klasea:12/iliakoak',
          concept: 'barneko-arteria-iliakoa',
          q: 'Kanpoko eta barneko arteria iliakoak: zein da zein?',
          options: [
            'Kanpokoa arteria femorala bihurtzen da; barnekoari zilborreko arteriak lotzen zaizkio',
            'Barnekoa arteria femorala bihurtzen da; kanpokoari zilborreko arteriak lotzen zaizkio',
            'Biak arteria femorala bihurtzen dira',
            'Biak zilborreko arteriei lotzen zaizkie',
          ],
          answer: 0,
          why: [
            'Bai: kanpokoa iztaitik behera femorala da; barnekoari zilborreko arteriak lotzen zaizkio.',
            'Ez: alderantziz da.',
            'Ez: barnekoak pelbisa eta ipurmasailak irrigatzen ditu.',
            'Ez: barnekoari bakarrik.',
          ],
          notes: n('2.6/p4/s1', '2.6/p5/s1'),
        },
      ],
    },

    {
      id: 'gorputz-adarrak',
      title: 'Gorputz adarrak',
      stage: 'gorputz-adarrak',
      lines: [
        L(0.0975, 'Gorputz adarren hastapen guztietan, mesodermotik, hasierako ardatz arteria bat garatzen da.', n('2.7/p3/s1'), ['ardatz-arteria'], {
          plain: 'Beso eta hanka bakoitzean arteria nagusi bat sortzen da lehenik: ardatz arteria.',
        }),
        L(0.5225, 'Besoan, arteria guztiak ardatz arteria horretatik sortzen dira: brakiala, hezur artekoa, arku sakona, kubitala eta erradiala.', n('2.7.1/p4/s2'), ['ardatz-arteria', 'arteria-brakiala', 'hezur-arteko-arteria', 'eskuaurreko-arku-sakona', 'arteria-kubitala', 'arteria-erradiala'], {
          tone: 'emphasis',
          plain: 'Besoko arteria guztiak ardatz arteria horretatik datoz, bat bera ere ez beste nonbaitetik.',
        }),
        L(0.68, 'Subklabioak besoko sistemara lotzen dira, baina besoko arteriak ez datoz subklabioetatik.', n('2.7.1/p4/s4'), ['ezkerreko-subklabioa'], {
          tone: 'caution',
          writes: 'b-besoa',
          plain: 'Kontuz: subklabioa besoko arteriekin lotzen da, baina ez da haien jatorria.',
        }),
        L(0.965, 'Hankan, ardatz arteria barneko arteria iliakoarekin bakarrik lotzen da, eta hortik arteria gutxi sortzen dira.', n('2.7.2/p3/s3'), ['ardatz-arteria', 'barneko-arteria-iliakoa'], {
          plain: 'Hankan ezberdina da: ardatz arteria barneko arteria iliakoari lotzen zaio, eta arteria gutxi ematen ditu.',
        }),
        L(0.965, 'Arteria ziatikoa, popliteoa eta peroneoaren zati bat. Gehienak arteria femoraletik datoz.', n('2.7.2/p3/s3', '2.7.2/p3/s4'), ['ardatz-arteria', 'arteria-ziatikoa', 'arteria-popliteoa', 'arteria-peroneoa', 'arteria-femorala'], {
          tone: 'emphasis',
          writes: 'b-hanka',
          plain: 'Ardatz arteriatik ziatikoa, popliteoa eta peroneoaren zati bat; beste guztiak femoraletik.',
        }),
      ],
      board: [
        { id: 'b-besoa', kind: 'line', text: 'Besoko arteriak: ardatz arteriatik; subklabioak konektatu bakarrik egiten dira', notes: n('2.7.1/p4/s2', '2.7.1/p4/s4'), key: true },
        {
          id: 'b-hanka',
          kind: 'line',
          text: 'Hankan: ardatz arteria barneko iliakoarekin (ziatikoa, popliteoa, peroneoaren zati bat); gehienak femoraletik',
          notes: n('2.7.2/p3/s3', '2.7.2/p3/s4'),
          key: true,
        },
      ],
      checks: [
        { kind: 'pool', id: 'mikro:12/gorputz-adarrak:4', after: 2 },
        {
          kind: 'contrast',
          id: 'klasea:12/besoa-hanka',
          concept: 'ardatz-arteria',
          q: 'Ardatz arteria: zer gertatzen da besoan eta hankan?',
          options: [
            'Besoan arteria guztiak ardatzetik; hankan gehienak femoraletik',
            'Besoan gehienak subklabiotik; hankan guztiak ardatzetik',
            'Bietan arteria guztiak ardatzetik',
            'Bietan gehienak femoraletik',
          ],
          answer: 0,
          why: [
            'Bai: besoan dena ardatzetik; hankan ardatzetik gutxi, gehienak femoraletik.',
            'Ez: subklabioak lotu bakarrik egiten dira; hankan gehienak femoraletik.',
            'Ez: hankan gehienak femoraletik datoz.',
            'Ez: besoan ardatzetik datoz.',
          ],
          notes: n('2.7.1/p4/s2', '2.7.2/p3/s3', '2.7.2/p3/s4'),
        },
      ],
    },

    {
      id: 'amaiera',
      title: 'Osatu taula',
      stage: 'gorputz-adarrak',
      lines: [L(0.965, 'Azken zatia: bete taula oroimenetik, arku bakoitza eta zer sortzen duen. Gero, galdera bat.', n('2/p4/s3'), [], { tone: 'summary', plain: 'Orain zure txanda: bete taula buruz, eta gero galdera bat.' })],
      checks: [
        { kind: 'fill', id: 'klasea:12/taula', table: 'taula', blanks: ['tz-1', 'tz-2', 'tz-3', 'tz-4l', 'tz-4r', 'tz-6l', 'tz-6r'] },
        { kind: 'pool', id: 'w12-q-hodi-arteriosoa' },
      ],
    },
  ],
};
