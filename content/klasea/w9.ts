import type { BoardItem, Lesson, Line } from '@/lib/klasea/types';

/**
 * Topic 9's class: the core of the notes (content/klasea/importance/w9.ts), said over the existing
 * stages and views, from the three kinds of muscle to the heart's conduction system. Every line cites
 * the sentences it rests on; tests/klasea.test.ts holds each line to them (numbers, directions, names,
 * the frames it is said over). Plan: docs/klasea-plan.md §4.
 */

const n = (...ids: string[]) => ids.map((id) => `w9/${id}`);

/** A line said at stage time `at`, lighting `focus`. */
const L = (at: number, say: string, notes: string[], focus: string[] = [], more: Partial<Line> = {}): Line => ({ at, say, notes, focus, ...more });

/** Where each head muscle comes from and its cranial nerve (notes 2.1.1 p3–p5, 2.1.2 p4–p5). */
const TABLE: BoardItem = {
  id: 'taula',
  kind: 'table',
  head: ['Jatorria', 'Nerbio kraneala'],
  rows: [
    { id: 'tz-1-2', cells: ['1. eta 2. somitomeroak', 'III: nerbio begi eragilea'], notes: n('2.1.1/p4/s3'), structures: ['begiaren-kanpoko-muskuluak'] },
    { id: 'tz-3', cells: ['3. somitomeroa', 'IV: troklea nerbioa'], notes: n('2.1.1/p4/s3'), structures: ['begi-goiko-laprana'] },
    { id: 'tz-4', cells: ['4. somitomeroa (1. arkua)', 'V: trigeminoa'], notes: n('2.1.1/p5/s2', '2.1.1/p5/s3'), structures: ['muskulu-murtsikatzaileak'] },
    { id: 'tz-5', cells: ['5. somitomeroa', 'VI: nerbio aldentzailea'], notes: n('2.1.1/p4/s3'), structures: ['begi-alboko-zuzena'] },
    { id: 'tz-6', cells: ['6. somitomeroa (2. arkua)', 'VII: aurpegi nerbioa'], notes: n('2.1.1/p5/s4', '2.1.1/p5/s5'), structures: ['muskulu-mimikoak'] },
    { id: 'tz-7', cells: ['7. somitomeroa (3. arkua)', 'IX: glosofaringeoa'], notes: n('2.1.1/p5/s6', '2.1.1/p5/s7'), structures: ['muskulu-estilofaringeoa'] },
    { id: 'tz-ok-1-2', cells: ['1. eta 2. somita okzipitalak (4. eta 6. arkuak)', 'X: bagoa'], notes: n('2.1.2/p4/s1', '2.1.2/p4/s2'), structures: ['laringearen-muskuluak'] },
    { id: 'tz-ok-2-5', cells: ['2.–5. somita okzipitalak', 'XII: hipoglosoa'], notes: n('2.1.2/p5/s1', '2.1.2/p5/s2'), structures: ['mihiaren-muskuluak'] },
  ],
};

export const LESSON_W9: Lesson = {
  week: 9,
  title: 'Muskulu sistema',
  goals: [
    'Hiru muskulu mota eta haien jatorria',
    'Buruko muskuluak: somitomeroak, somita okzipitalak eta nerbio kranialak',
    'Somitatik muskulura: miotoma eta bi domeinuak',
    'Nerbio espinala: epaxialak eta hipaxialak',
    'Muskulu leuna eta bihotzeko muskulua',
  ],
  chunks: [
    {
      id: 'gaur',
      title: 'Gaur',
      stage: 'muskulu-motak',
      lines: [
        L(0, 'Kaixo! Gaur muskuluak ikasiko ditugu: nondik sortzen diren eta zein nerbiok inerbatzen dituen.', n('1/p3/s1'), [], {
          plain: 'Gaurko gaia: muskuluak. Nondik datozen, eta zein nerbiok mugiarazten dituen.',
        }),
        L(0, 'Gure gorputzeko gihar guztiak mesodermotik sortzen dira, ernetze orri horretatik.', n('1/p3/s1'), ['somitak', 'paretako-orria', 'errai-orria'], {
          tone: 'emphasis',
          writes: 'b-mesodermoa',
          plain: 'Muskulu guztiak mesodermotik datoz. Mozketa honetan haren hiru iturriak ikusten dira.',
        }),
        L(0, 'Hiru muskulu mota bereizten dira: ildaskatuak, leunak eta bihotzekoa.', n('1/p4/s1'), [], {
          plain: 'Hiru mota ikasiko ditugu: ildaskatuak, leunak eta bihotzekoa.',
        }),
        L(0.12, 'Muskulu ildaskatuak, edo borondatezkoak, lokomozio sistemarekin eta mugimenduarekin erlazionatuta daude.', n('1/p5/s1'), ['muskulu-ildaskatuak'], {
          plain: 'Muskulu ildaskatuak nahi dugunean mugitzen ditugu: ibiltzeko eta mugitzeko dira.',
        }),
        L(0.64, 'Muskulu leunak erraiekin doaz: hestearen inguruko alboko mesodermoaren errai orritik sortzen dira.', n('1/p6/s1'), ['muskulu-leuna', 'errai-orria'], {
          plain: 'Muskulu leunak erraietan daude, eta hestearen inguruko errai orritik datoz.',
        }),
        L(0.64, 'Miokardioa, bihotzeko muskulua, bihotz hodiaren inguruko errai orritik sortzen da.', n('1/p7/s1'), ['miokardioa', 'errai-orria'], {
          writes: 'b-hiru-mota',
          plain: 'Bihotzeko muskulua, miokardioa, bihotz hodiaren inguruko errai orritik dator.',
        }),
        L(0.82, 'Salbuespenak badira: errai batzuetako gihar batzuk ektodermotik sortzen dira.', n('1/p3/s2'), [], {
          tone: 'caution',
          plain: 'Kontuz, salbuespen batzuk daude: muskulu gutxi batzuk ektodermotik datoz.',
        }),
        L(0.82, 'Adibidez, begi-niniko muskuluak, zelula mioepitelialak eta izerdi guruinetako muskulu lisoak.', n('1/p3/s2'), ['begi-niniko-muskuluak', 'zelula-mioepitelialak', 'izerdi-guruinak'], {
          plain: 'Hauek dira: begi-niniko muskuluak, titiko zelula mioepitelialak eta izerdi guruinetako muskulu lisoak.',
        }),
      ],
      board: [
        { id: 'b-mesodermoa', kind: 'line', text: 'Gihar guztiak mesodermotik (salbuespen batzuk ektodermotik)', notes: n('1/p3/s1', '1/p3/s2'), key: true },
        { id: 'b-hiru-mota', kind: 'line', text: 'Ildaskatuak: mugimendua. Leunak: erraiak, errai orritik. Miokardioa: bihotz hodiaren inguruko errai orritik', notes: n('1/p5/s1', '1/p6/s1', '1/p7/s1'), key: true },
      ],
      checks: [
        {
          kind: 'predict',
          q: 'Zer uste duzu: zein ernetze orritatik datoz gihar gehienak?',
          options: ['Mesodermotik', 'Ektodermotik', 'Endodermotik'],
          answer: 0,
          why: ['Bai: gihar guztiak, salbuespen gutxi batzuk kenduta, mesodermotik datoz.', 'Ez: ektodermotik salbuespen gutxi batzuk bakarrik.', 'Ez: endodermoak hestearen barruko geruza ematen du, ez muskulua.'],
          notes: n('1/p3/s1'),
          after: 2,
        },
      ],
    },

    {
      id: 'ildaskatuak',
      title: 'Somitomeroak eta somitak',
      stage: 'ildaskatuak',
      lines: [
        L(0, 'Muskulu ildaskatu guztiak mesodermo paraxialetik sortzen dira.', n('2/p3/s1'), ['mesodermo-paraxiala'], {
          tone: 'emphasis',
          writes: 'b-paraxiala',
          plain: 'Muskulu ildaskatu guztiak hodi neuralaren bi aldeetako banda batetik datoz: mesodermo paraxialetik.',
        }),
        L(0.08, 'Alde zefalikoan mesodermo hori segmentatu egiten da, baina ez osorik: somitomeroak agertzen dira, paretarik gabe.', n('2/p3/s2'), ['somitomeroak'], {
          plain: 'Buruan zatiketa ez da osoa: somitomeroak sortzen dira, paretarik gabeko pilak.',
        }),
        L(0.17, 'Alde okzipitaletik behera, berriz, zatiketa osoa da, eta somitak agertzen dira.', n('2/p3/s3'), ['somitak', 'somita-okzipitalak'], {
          writes: 'b-zatiketa',
          plain: 'Hortik behera zatiketa osoa da: somitak sortzen dira, eta lehenengoak somita okzipitalak dira.',
        }),
        L(0.26, 'Buruko muskulu ildaskatuak batez ere somitomeroetatik sortzen dira, baita somita okzipitaletatik ere.', n('2/p4/s1'), ['somitomeroak', 'somita-okzipitalak'], {
          plain: 'Buruko muskulu gehienak somitomeroetatik datoz; batzuk, somita okzipitaletatik.',
        }),
        L(0.36, 'Gainerako gorputzeko muskulu ildaskatuak, berriz, somitetatik sortzen dira.', n('2/p5/s1'), ['somitak', 'miotoma'], {
          tone: 'emphasis',
          plain: 'Gorputzeko beste muskulu ildaskatu guztiak somitetatik datoz, haien miotometatik.',
        }),
      ],
      board: [
        { id: 'b-paraxiala', kind: 'line', text: 'Muskulu ildaskatu guztiak: mesodermo paraxiala', notes: n('2/p3/s1'), key: true },
        { id: 'b-zatiketa', kind: 'line', text: 'Buruan somitomeroak (zatiketa ez osoa); okzipitaletik behera somitak (zatiketa osoa)', notes: n('2/p3/s2', '2/p3/s3'), key: true },
      ],
      checks: [
        {
          kind: 'contrast',
          id: 'klasea:9/somitomeroak',
          concept: 'somitomeroak',
          q: 'Somitomeroak eta somitak: zertan dira desberdinak?',
          options: [
            'Somitomeroak buruan, zatiketa ez osoarekin; somitak okzipitaletik behera, zatiketa osoarekin',
            'Somitomeroak gorputzean; somitak buruan bakarrik',
            'Berdinak dira: bietan paretak bereizten dira',
          ],
          answer: 0,
          why: ['Bai: buruan ez da zatiketa osoa gertatzen, eta somitomeroek ez dute paretarik.', 'Ez: alderantziz da.', 'Ez: somitomeroek ez dute paretarik.'],
          notes: n('2/p3/s2', '2/p3/s3'),
        },
        { kind: 'pool', id: 'w9-q-ildaskatu-jatorria' },
      ],
    },

    {
      id: 'begia',
      title: 'Begiaren muskuluak',
      stage: 'somitomeroak-burua',
      lines: [
        L(0, 'Buruko eta lepoko muskulu ildaskatuak bi tokitan sortzen dira: begiaren inguruan eta faringe arkuak deituriko egituretan.', n('2.1/p3/s1'), ['begia', 'faringe-arkuak'], {
          plain: 'Buruko muskuluak bi lekutan sortzen dira: begiaren inguruan, eta faringe arkuak deitzen ditugun egituretan.',
        }),
        L(0.1, 'Guztira 7 somitomero daude, egitura bikoitzak.', n('2.1.1/p3/s1'), ['somitomeroak'], {
          plain: 'Zazpi somitomero daude, eta bikoitzak dira, bikoteak.',
        }),
        L(0.1, 'Begia mugitzeko muskuluak 1., 2., 3. eta 5. somitomeroetatik sortzen dira.', n('2.1.1/p3/s1'), ['begiaren-kanpoko-muskuluak'], {
          tone: 'emphasis',
          writes: 'b-begia',
          plain: 'Begiaren muskuluak lau somitomerotatik datoz: lehena, bigarrena, hirugarrena eta bosgarrena.',
        }),
        L(0.2, '1. eta 2. somitomeroetatik goiko, beheko eta erdialdeko muskulu zuzenak eta beheko muskulu laprana sortzen dira.', n('2.1.1/p3/s2'), [
          'begi-goiko-zuzena',
          'begi-beheko-zuzena',
          'begi-erdiko-zuzena',
          'begi-beheko-laprana',
        ], { plain: 'Lehen bi somitomeroetatik lau muskulu: goiko, beheko eta erdialdeko zuzenak, eta beheko muskulu laprana.' }),
        L(0.38, '3. somitomerotik goiko muskulu laprana sortzen da, eta 5.etik alboko muskulu zuzena.', n('2.1.1/p3/s3', '2.1.1/p3/s4'), ['begi-goiko-laprana', 'begi-alboko-zuzena'], {
          plain: 'Hirugarren somitomerotik goiko muskulu laprana; bosgarrenetik alboko muskulu zuzena.',
        }),
        L(0.46, 'Muskulu horiek hiru nerbio kranialek inerbatzen dituzte.', n('2.1.1/p4/s1'), [], {
          plain: 'Hiru nerbio kranial arduratzen dira begiaren muskuluez.',
        }),
        L(0.46, 'Hirugarrenak, nerbio begi eragileak, 1. eta 2. somitomeroetatik sortutakoak inerbatzen ditu.', n('2.1.1/p4/s3'), ['nerbio-begi-eragilea'], {
          tone: 'emphasis',
          writes: 'b-begi-nerbioak',
          plain: 'Hirugarren nerbioa, begi eragilea, lehen bi somitomeroetatik sortutako lau muskuluetara doa.',
        }),
        L(0.46, 'Laugarrenak, troklea nerbioak, 3.etik sortutakoa; eta seigarrenak, nerbio aldentzaileak, 5.etik sortutakoa.', n('2.1.1/p4/s3'), ['nerbio-troklearra', 'nerbio-aldentzailea'], {
          plain: 'Laugarrena, troklea nerbioa, goiko laprana; seigarrena, nerbio aldentzailea, alboko zuzena.',
        }),
      ],
      board: [
        { id: 'b-begia', kind: 'line', text: 'Begiaren muskuluak: 1., 2., 3. eta 5. somitomeroetatik', notes: n('2.1.1/p3/s1'), key: true },
        { id: 'b-begi-nerbioak', kind: 'line', text: '1.–2. somitomeroak: III. 3.a: IV. 5.a: VI', notes: n('2.1.1/p4/s3'), key: true },
      ],
      checks: [
        {
          kind: 'contrast',
          id: 'klasea:9/begi-nerbioak',
          concept: 'begi-goiko-laprana',
          q: 'Goiko muskulu laprana eta alboko muskulu zuzena: zein nerbiok inerbatzen du bakoitza?',
          options: ['Laprana troklea nerbioak; alboko zuzena nerbio aldentzaileak', 'Laprana nerbio aldentzaileak; alboko zuzena troklea nerbioak', 'Biak nerbio begi eragileak'],
          answer: 0,
          why: [
            'Bai: laprana 3. somitomerotik dator, laugarren nerbioa; alboko zuzena 5.etik, seigarrena.',
            'Ez: alderantziz da.',
            'Ez: begi eragileak 1. eta 2. somitomeroetako lau muskuluak bakarrik inerbatzen ditu.',
          ],
          notes: n('2.1.1/p3/s3', '2.1.1/p3/s4', '2.1.1/p4/s3'),
        },
      ],
    },

    {
      id: 'arkuak',
      title: 'Faringe arkuetako muskuluak',
      stage: 'somitomeroak-burua',
      lines: [
        L(0.56, 'Beste somitomero batzuetako mesodermoak lepo mailan faringe arkuak sortzen ditu.', n('2.1.1/p5/s1'), [
          'faringe-arkuak',
          'lehen-faringe-arkua',
          'hioide-arkua',
          'hirugarren-faringe-arkua',
        ], { plain: 'Beste somitomero batzuk lepora doaz, eta han faringe arkuak sortzen dituzte, muskuluak egiteko.' }),
        L(0.66, '4. somitomeroa 1. faringe arkuan kokatzen da, eta hortik muskulu murtsikatzaileak sortzen dira, barailaren jasotzaileak.', n('2.1.1/p5/s2'), [
          'lehen-faringe-arkua',
          'muskulu-murtsikatzaileak',
        ], { writes: 'b-arkuak', plain: 'Laugarren somitomeroa 1. faringe arkura doa: hortik murtsikatzeko muskuluak, barailaren jasotzaileak.' }),
        L(0.66, 'Nerbio trigeminoak inerbatzen ditu, bosgarren bikote kranialak.', n('2.1.1/p5/s3'), ['nerbio-trigeminoa'], {
          plain: 'Horien nerbioa bosgarrena da: trigeminoa.',
        }),
        L(0.76, '6. somitomeroa 2. arkuan kokatzen da: hortik muskulu mimikoak, keinuak egiteko, eta barailaren jeistaileak.', n('2.1.1/p5/s4'), [
          'hioide-arkua',
          'muskulu-mimikoak',
          'barailaren-muskulu-jeistaileak',
        ], { plain: 'Seigarren somitomeroa bigarren arkura doa: hortik aurpegiko keinuen muskuluak eta barailaren jeistaileak.' }),
        L(0.76, 'Haren nerbioa aurpegi nerbioa da, zazpigarrena.', n('2.1.1/p5/s5'), ['aurpegi-nerbioa'], {
          plain: 'Bigarren arkuaren nerbioa aurpegi nerbioa da, zazpigarrena.',
        }),
        L(0.86, '7. somitomeroa 3. arkuan kokatzen da, eta hortik muskulu estilofaringeoa sortzen da.', n('2.1.1/p5/s6'), ['hirugarren-faringe-arkua', 'muskulu-estilofaringeoa'], {
          plain: 'Zazpigarren somitomeroa hirugarren arkura doa: hortik muskulu estilofaringeoa.',
        }),
        L(0.86, 'Haren nerbioa bederatzigarrena da: nerbio glosofaringeoa.', n('2.1.1/p5/s7'), ['nerbio-glosofaringeoa'], {
          plain: 'Hirugarren arkuaren nerbioa bederatzigarrena da, glosofaringeoa.',
        }),
      ],
      board: [
        { id: 'b-arkuak', kind: 'line', text: '4. somitomeroa: 1. arkua, murtsikatzaileak (V). 6.a: 2. arkua, mimikoak (VII). 7.a: 3. arkua, estilofaringeoa (IX)', notes: n('2.1.1/p5/s2', '2.1.1/p5/s4', '2.1.1/p5/s6'), key: true },
      ],
      checks: [
        {
          kind: 'contrast',
          id: 'klasea:9/arkuak',
          concept: 'muskulu-murtsikatzaileak',
          q: '1. arkua eta 2. arkua: zein muskulu sortzen da bakoitzean?',
          options: ['1.ean murtsikatzaileak; 2.ean muskulu mimikoak', '1.ean muskulu mimikoak; 2.ean murtsikatzaileak', 'Bietan mihiaren muskuluak'],
          answer: 0,
          why: [
            'Bai: 4. somitomeroa 1. arkuan, murtsikatzaileak; 6.a 2. arkuan, mimikoak.',
            'Ez: alderantziz da.',
            'Ez: mihiaren muskuluak somita okzipitaletatik datoz.',
          ],
          notes: n('2.1.1/p5/s2', '2.1.1/p5/s4'),
        },
        { kind: 'pool', id: 'mikro:9/somitomeroak-burua:9' },
      ],
    },

    {
      id: 'okzipitalak',
      title: 'Somita okzipitalak',
      stage: 'okzipitalak',
      lines: [
        L(0, 'Somita okzipitalak hasieran 5 bikote dira, baina lehenengoa oso goiz desagertzen da: 4 geratzen dira.', n('2.1.2/p3/s1'), ['somita-okzipitalak'], {
          plain: 'Hasieran bost bikote somita okzipital daude; lehena laster galtzen da, eta lau geratzen dira.',
        }),
        L(0, 'Haien mesodermoak mihiko muskuluen eraketan ere parte hartzen du.', n('2.1/p3/s3'), ['somita-okzipitalak'], {
          plain: 'Somita horiek mihiko muskuluak egiten ere laguntzen dute.',
        }),
        L(0.1, '1. eta 2. somita okzipitaletatik 4. eta 6. faringe arkuak sortzen dira, eta horietan laringearen muskulu ildaskatuak.', n('2.1.2/p4/s1'), [
          'laugarren-seigarren-arkuak',
          'laringearen-muskuluak',
          'somita-okzipitalak',
        ], { plain: 'Lehen bi somita okzipitaletatik laugarren eta seigarren arkuak sortzen dira; hor, laringearen muskuluak.' }),
        L(0.1, 'Nerbio bagoak inerbatzen ditu, hamargarren bikote kranialak.', n('2.1.2/p4/s2'), ['nerbio-bagoa'], {
          plain: 'Laringearen muskuluen nerbioa bagoa da, hamargarrena.',
        }),
        L(0.2, 'Azken somita okzipitaletatik, 2.etik 5.era, mihiaren muskulu guztiak sortzen dira, denak ildaskatuak.', n('2.1.2/p5/s1'), ['somita-okzipitalak', 'mihiaren-muskuluak'], {
          writes: 'b-okzipitalak',
          plain: 'Azken somita okzipitaletatik mihiko muskulu guztiak sortzen dira, eta denak ildaskatuak dira.',
        }),
        L(0.2, 'Nerbio hipoglosoak inerbatzen ditu, 12. bikote kranialak, eta zuntz motoreak bakarrik ditu.', n('2.1.2/p5/s2'), ['nerbio-hipoglosoa'], {
          plain: 'Mihiko muskuluen nerbioa hipoglosoa da, hamabigarrena; zuntz motoreak bakarrik ditu.',
        }),
        L(0.3, 'Beraz, buruko muskulu ildaskatu guztiak nerbio kranialek inerbatzen dituzte.', n('2.1.2/p6/s1'), ['nerbio-kranialak'], {
          tone: 'emphasis',
          writes: 'b-kranialak',
          plain: 'Laburbilduz: buruko muskulu ildaskatu guztiak nerbio kranialek mugitzen dituzte.',
        }),
      ],
      board: [
        { id: 'b-okzipitalak', kind: 'line', text: 'Somita okzipitalak 1–2: 4. eta 6. arkuak, laringea (X). 2–5: mihia (XII)', notes: n('2.1.2/p4/s1', '2.1.2/p5/s1'), key: true },
        { id: 'b-kranialak', kind: 'line', text: 'Buruko muskulu ildaskatu guztiak: nerbio kranialak', notes: n('2.1.2/p6/s1'), key: true },
      ],
      checks: [
        {
          kind: 'contrast',
          id: 'klasea:9/bagoa-hipoglosoa',
          concept: 'nerbio-hipoglosoa',
          q: 'Laringearen muskuluak eta mihiaren muskuluak: zein nerbiok inerbatzen ditu bakoitza?',
          options: ['Laringekoak bagoak; mihikoak hipoglosoak', 'Laringekoak hipoglosoak; mihikoak bagoak', 'Biak aurpegi nerbioak'],
          answer: 0,
          why: ['Bai: laringea 4. eta 6. arkuetan, bagoa; mihia azken somita okzipitaletatik, hipoglosoa.', 'Ez: alderantziz da.', 'Ez: aurpegi nerbioa 2. arkuarena da.'],
          notes: n('2.1.2/p4/s2', '2.1.2/p5/s2'),
        },
      ],
    },

    {
      id: 'kranialak',
      title: 'Nerbio kranialen taula',
      stage: 'okzipitalak',
      lines: [
        L(0.68, 'Guztira 12 nerbio kraneal daude, baina guztiek ez dituzte zuntz motoreak.', n('2.1.3/p6/s1', '2.1.3/p6/s2'), ['nerbio-kranialak'], {
          writes: 'b-hamabi',
          plain: 'Hamabi nerbio kraneal ditugu; batzuek bakarrik dituzte muskuluetara doazen zuntzak.',
        }),
        L(0.68, 'Faringe arku bakoitzarekin nerbio kraneal bat konektatzen da.', n('2.1.3/p6/s3'), ['nerbio-kranialak'], {
          plain: 'Arku bakoitzak bere nerbio kraneala du.',
        }),
        L(0.74, 'Taulan aurreko guztia laburtzen da: muskuluen izena, jatorria eta inerbazioa.', n('2.1.3/p7/s1'), ['begiaren-kanpoko-muskuluak', 'muskulu-murtsikatzaileak'], {
          plain: 'Taula honek dena batzen du: zein muskulu, nondik datorren eta zein nerbiok mugitzen duen.',
        }),
        L(0.74, 'Ez da beharrezkoa muskulu guztien izenak ikastea.', n('2.1.3/p7/s2'), [], {
          tone: 'caution',
          plain: 'Lasai: ez dituzu muskulu guztien izenak buruz ikasi behar.',
        }),
        L(0.84, '1. eta 2. somita okzipitalak 4. eta 6. faringe arkuetan garatzen dira.', n('2.1.4/p20/s1'), ['somita-okzipitalak', 'laringearen-muskuluak'], {
          plain: 'Lehen bi somita okzipitalak laugarren eta seigarren arkuetan garatzen dira.',
        }),
        L(0.92, 'Nerbio batek mota askotako zuntzak izan ditzake; hipoglosoak, aldiz, zuntz motoreak bakarrik ditu.', n('2.1/p5/s1', '2.1/p5/s3'), ['nerbio-hipoglosoa'], {
          plain: 'Nerbio askok zuntz mota asko dituzte; hipoglosoak, ordea, motoreak bakarrik.',
        }),
      ],
      board: [{ id: 'b-hamabi', kind: 'line', text: '12 nerbio kraneal; ez guztiek zuntz motoreak', notes: n('2.1.3/p6/s1', '2.1.3/p6/s2') }, TABLE],
      checks: [
        {
          kind: 'contrast',
          id: 'klasea:9/zuntzak',
          concept: 'nerbio-hipoglosoa',
          q: 'Hipoglosoa eta trigeminoa: zer zuntz dituzte?',
          options: ['Hipoglosoak motoreak bakarrik; trigeminoak mota askotakoak', 'Hipoglosoak mota askotakoak; trigeminoak motoreak bakarrik', 'Biek sentsorialak bakarrik'],
          answer: 0,
          why: ['Bai: trigeminoaren adarretan zuntz sentsorialak, motoreak eta begetatiboak daude.', 'Ez: alderantziz da.', 'Ez: biek dituzte zuntz motoreak.'],
          notes: n('2.1/p5/s2', '2.1/p5/s3'),
        },
        { kind: 'pool', id: 'mikro:9/okzipitalak:11' },
      ],
    },

    {
      id: 'patroiak',
      title: 'Ehun konektibozko patroiak',
      stage: 'ehun-konektiboa',
      lines: [
        L(0, 'Eskualde guztietako muskuluak garatzeko ehun konektibozko patroiak behar dira.', n('2.1.4/p24/s1'), ['ehun-konektibozko-patroiak'], {
          tone: 'emphasis',
          writes: 'b-patroiak',
          plain: 'Muskulu batek euskarri bat behar du hazteko: ehun konektibozko patroia.',
        }),
        L(0, 'Patroi horietara mioblastoak iristen dira, eta poliki-poliki muskulu bihurtzen dira.', n('2.1.4/p24/s2'), ['mioblastoak'], {
          plain: 'Muskulu zelula gazteak, mioblastoak, patroira sartzen dira eta han muskulu bihurtzen dira.',
        }),
        L(0.12, 'Buruan, patroiak gandor neuraleko zelulek osatzen dituzte.', n('2.1.4/p25/s1'), ['gandor-neurala'], {
          plain: 'Buruko patroiak gandor neuraletik datoz.',
        }),
        L(0.24, 'Lepoan, somitaren mesodermo zelulek.', n('2.1.4/p25/s2'), ['somitak'], {
          plain: 'Lepokoak somitetatik datoz.',
        }),
        L(0.36, 'Gorputzaren paretetan eta gorputz-adarretan, alboko mesodermoaren paretako orriko zelulek.', n('2.1.4/p26/s1'), ['paretako-orria', 'gorputz-adarren-mesenkima'], {
          plain: 'Paretetako eta gorputz-adarretako patroiak paretako orritik datoz.',
        }),
        L(0.6, 'Mioblastoak elkarren artean fusionatzen dira, eta nukleo ugariko zuntzak osatzen dituzte.', n('2.1.4/p27/s1'), ['mioblastoak', 'zuntz-muskularrak'], {
          writes: 'b-fusioa',
          plain: 'Mioblastoak elkartu egiten dira, eta zuntz luze bat sortzen da, nukleo askorekin.',
        }),
        L(0.6, 'Zuntz horiek ildaskatuak dira. Gogoratu: ildaskatu, mugimendu.', n('2.1.4/p27/s2', '2.1.4/p28/s1'), ['zuntz-muskularrak'], {
          plain: 'Zuntz horiek ildaskatuak dira, eta ildaskatuak mugimenduarekin lotzen dira.',
        }),
        L(0.72, 'Gorputz-adarrek biratu ondoren, tolestatzaileak eta hedatzaileak alderantziz kokatzen dira goiko eta beheko adarretan.', n('2.1.3/p5/s3'), [
          'muskulu-tolestatzaileak',
          'muskulu-hedatzaileak',
        ], { plain: 'Biraketaren ondoren, goiko eta beheko adarretan tolestatzaileen eta hedatzaileen aldeak alderantzizkoak dira.' }),
      ],
      board: [
        { id: 'b-patroiak', kind: 'line', text: 'Patroiak: buruan gandor neurala; lepoan somitak; paretetan eta gorputz-adarretan paretako orria', notes: n('2.1.4/p25/s1', '2.1.4/p25/s2', '2.1.4/p26/s1'), key: true },
        { id: 'b-fusioa', kind: 'line', text: 'Mioblastoak fusionatu: nukleo ugariko zuntzak', notes: n('2.1.4/p27/s1') },
      ],
      checks: [
        {
          kind: 'contrast',
          id: 'klasea:9/patroiak',
          concept: 'ehun-konektibozko-patroiak',
          q: 'Buruko eta gorputz-adarretako muskuluen patroiak: nork osatzen ditu bakoitza?',
          options: ['Buruan gandor neuralak; gorputz-adarretan paretako orriak', 'Buruan paretako orriak; gorputz-adarretan gandor neuralak', 'Bietan somitek'],
          answer: 0,
          why: ['Bai: buruko patroia gandor neuralekoa da; gorputz-adarretakoa, paretako orrikoa.', 'Ez: alderantziz da.', 'Ez: somitek lepoko patroia osatzen dute.'],
          notes: n('2.1.4/p25/s1', '2.1.4/p26/s1'),
        },
      ],
    },

    {
      id: 'paretak',
      title: 'Somitaren paretak',
      stage: 'somitaren-paretak',
      lines: [
        L(0, 'Enbriologia orokorreko birpasoa: hasieran muskulu horiek guztiak somitetatik sortzen dira.', n('2.2/p3/s1', '2.2/p4/s1'), ['somitak'], {
          tone: 'recall',
          plain: 'Gogora dezagun enbriologia orokorra: muskulu horiek guztiak somitetatik datoz.',
        }),
        L(0.1, 'Somitan hiru pareta bereizten dira: atzekoa edo dortsala, erdialdekoa edo mediala, eta aurrekoa.', n('2.2/p5/s1'), [
          'somitaren-atzeko-pareta',
          'somitaren-erdialdeko-pareta',
          'somitaren-aurreko-pareta',
          'somitak',
        ], { plain: 'Somitak hiru pareta ditu: atzekoa, erdialdekoa eta aurrekoa.' }),
        L(0.2, 'Erdialdeko eta aurreko paretetako zelulak esklerotoma bihurtzen dira.', n('2.2/p6/s1'), ['esklerotoma', 'somitaren-aurreko-pareta'], {
          plain: 'Erdialdeko eta aurreko paretek esklerotoma osatzen dute.',
        }),
        L(0.2, 'Esklerotoma zelulak erdikaldera migratzen dute, hodi neurala eta notokorda inguratzeko; hortik bizkarrezurra sortuko da.', n('2.2/p6/s3', '2.2/p6/s4'), [
          'esklerotoma',
          'hodi-neurala',
          'notokorda',
        ], { writes: 'b-esklerotoma', plain: 'Esklerotoma hodi neuralaren eta notokordaren inguruan biltzen da, eta hortik bizkarrezurra sortzen da.' }),
        L(0.32, 'Esklerotomako zelula batzuek, ordea, albora migratzen dute, eta somitaren alboko muga igarotzen dute.', n('2.2/p6/s5'), ['somitaren-alboko-muga', 'esklerotoma'], {
          plain: 'Esklerotomako zelula batzuk albora irteten dira, somitaren alboko mugatik haratago.',
        }),
        L(0.32, 'Horietatik sortzen dira, adibidez, gorputzaren aurrealdeko saihets kartilagoak.', n('2.2/p6/s6'), ['saihets-kartilagoa'], {
          plain: 'Zelula horietatik saihets kartilagoak sortzen dira, gorputzaren aurrealdean.',
        }),
        L(0.52, 'Atzeko paretan, erdiko zelulek dermatoma osatzen dute; ertzetakoak muskulu zelulen aintzindariak dira.', n('2.2/p9/s1', '2.2/p9/s2'), [
          'somitaren-atzeko-pareta',
          'dermatoma',
          'muskulu-zelula-atze-erdialdekoak',
          'aurre-alboko-muskulu-zelulak',
        ], { plain: 'Atzeko paretaren erdian dermatoma dago; ertzetan, muskulu bihurtuko diren zelulak.' }),
        L(0.64, 'Muskulu zelula horiek dermatomaren alde bentralean miotoma osatzen dute.', n('2.2/p10/s1'), ['dermatoma', 'miotoma'], {
          plain: 'Zelula horiek dermatomaren aurrean biltzen dira, eta miotoma osatzen dute.',
        }),
        L(0.64, 'Miotomatik bizkarreko muskulu ildaskatuak, eskapula ingurukoak eta saihets artekoak sortzen dira.', n('2.2/p10/s2'), ['miotoma'], {
          tone: 'emphasis',
          writes: 'b-miotoma',
          plain: 'Miotomatik bizkarreko muskuluak, eskapula ingurukoak eta saihets artekoak datoz.',
        }),
        L(0.76, 'Aurre-alboko zelula batzuek, berriz, alboko muga gurutzatu eta paretako orrira heltzen dira.', n('2.2/p11/s1'), ['aurre-alboko-muskulu-zelulak', 'paretako-orria'], {
          plain: 'Beste zelula batzuk mugaz haratago joaten dira, alboko mesodermoaren paretako orrira.',
        }),
        L(0.76, 'Hortik gorputz paretako eta gorputz-adarretako muskulu ildaskatuak sortzen dira.', n('2.2/p11/s1'), ['paretako-orria'], {
          plain: 'Han gorputz paretako eta gorputz-adarretako muskuluak egiten dituzte.',
        }),
      ],
      board: [
        { id: 'b-esklerotoma', kind: 'line', text: 'Erdialdeko eta aurreko paretak: esklerotoma, ornoak', notes: n('2.2/p6/s1', '2.2/p6/s4'), key: true },
        { id: 'b-miotoma', kind: 'line', text: 'Miotoma: bizkarreko muskuluak, eskapula ingurukoak, saihets artekoak', notes: n('2.2/p10/s2'), key: true },
      ],
      checks: [
        {
          kind: 'contrast',
          id: 'klasea:9/esklerotoma-miotoma',
          concept: 'miotoma',
          after: 7,
          q: 'Esklerotoma eta miotoma: zer sortzen du bakoitzak?',
          options: ['Esklerotomak hezurrak eta ornoak; miotomak muskuluak', 'Esklerotomak muskuluak; miotomak hezurrak', 'Biek larruazala'],
          answer: 0,
          why: ['Bai: esklerotoma hodi neuralaren inguruan biltzen da; miotomak muskulu ildaskatuak ematen ditu.', 'Ez: alderantziz da.', 'Ez: hori dermatomari dagokio.'],
          notes: n('2.2/p6/s2', '2.2/p6/s4', '2.2/p10/s2'),
        },
      ],
    },

    {
      id: 'domeinuak',
      title: 'Bi domeinuak',
      stage: 'domeinuak',
      lines: [
        L(0, 'Somitetako zelula batzuk alboko mesodermoaren paretako orrira migratzen dute.', n('2.2.1/p3/s1'), ['aurre-alboko-muskulu-zelulak', 'paretako-orria'], {
          plain: 'Somitetako zelula batzuk paretako orrira joaten dira.',
        }),
        L(0.1, 'Somitaren alboko mugak mesodermoa bi domeinutan banatzen du.', n('2.2.1/p4/s1'), ['somitaren-alboko-muga'], {
          plain: 'Marra berde honek, somitaren alboko mugak, mesodermoa bi eremutan zatitzen du.',
        }),
        L(0.2, 'Domeinu primaxiala hodi neuralaren aldamenean dago, erdialdean, eta bertan daude somitak.', n('2.2.1/p5/s1', '2.2.1/p5/s2'), ['domeinu-primaxiala', 'hodi-neurala', 'somitak'], {
          plain: 'Domeinu primaxiala hodi neuralaren ondoan dago, erdialdean: somitena da.',
        }),
        L(0.2, 'Domeinu horretatik bizkarreko muskuluak sortzen dira.', n('2.2.1/p5/s3'), ['domeinu-primaxiala'], {
          tone: 'emphasis',
          writes: 'b-primaxiala',
          plain: 'Domeinu primaxialetik bizkarreko muskuluak datoz.',
        }),
        L(0.32, 'Domeinu abaxiala, berriz, paretako orriko zelulek eta bertara iritsitako somita-zelulek osatzen dute.', n('2.2.1/p6/s1'), [
          'domeinu-abaxiala',
          'paretako-orria',
          'aurre-alboko-muskulu-zelulak',
        ], { plain: 'Domeinu abaxiala paretako orria da, gehi bertara iritsitako somitetako zelulak.' }),
        L(0.32, 'Hortik sortzen dira goiko eta beheko gorputz-adarretako muskulu guztiak.', n('2.2.1/p6/s2'), ['domeinu-abaxiala'], {
          tone: 'emphasis',
          writes: 'b-abaxiala',
          plain: 'Domeinu abaxialetik goiko eta beheko gorputz-adarretako muskulu guztiak datoz.',
        }),
        L(0.44, 'Lepoan, toraxean eta goiko gorputz-adarrean, muskulu batzuk primaxialak dira, eta beste batzuk abaxialak.', n('2.2.1/p8/s3'), ['domeinu-primaxiala'], {
          plain: 'Lepoan, toraxean eta goiko gorputz-adarrean bi domeinuetako muskuluak nahasten dira.',
        }),
      ],
      board: [
        { id: 'b-primaxiala', kind: 'line', text: 'Domeinu primaxiala: hodi neuralaren ondoan (somitak); bizkarreko muskuluak', notes: n('2.2.1/p5/s1', '2.2.1/p5/s3'), key: true },
        { id: 'b-abaxiala', kind: 'line', text: 'Domeinu abaxiala: paretako orria eta iritsitako somita-zelulak; gorputz-adarretako muskulu guztiak', notes: n('2.2.1/p6/s1', '2.2.1/p6/s2'), key: true },
      ],
      checks: [
        {
          kind: 'contrast',
          id: 'klasea:9/domeinuak',
          concept: 'domeinu-abaxiala',
          q: 'Domeinu primaxiala eta abaxiala: zein muskulu sortzen da bakoitzetik?',
          options: ['Primaxialetik bizkarrekoak; abaxialetik gorputz-adarretakoak', 'Primaxialetik gorputz-adarretakoak; abaxialetik bizkarrekoak', 'Bietatik buruko muskuluak'],
          answer: 0,
          why: ['Bai: primaxiala somitena da, bizkarrekoa; abaxiala paretako orrikoa, gorputz-adarretakoa.', 'Ez: alderantziz da.', 'Ez: buruko muskuluak somitomeroetatik eta somita okzipitaletatik datoz.'],
          notes: n('2.2.1/p5/s3', '2.2.1/p6/s2'),
        },
        { kind: 'pool', id: 'w9-q-domeinu-abaxiala' },
      ],
    },

    {
      id: 'ornomuina',
      title: 'Ornomuina',
      stage: 'nerbio-espinala',
      lines: [
        L(0, 'Bizkarrezurra ornoz osatuta dago; atzean, orno arkuak orno zuloa mugatzen du.', n('2.2.2/p3/s1', '2.2.2/p3/s2'), ['orno-arkua', 'orno-zuloa'], {
          plain: 'Bizkarrezurra orno askoren pila da; orno bakoitzaren atzean zulo bat dago, orno zuloa.',
        }),
        L(0.08, 'Orno guztiek hodi errakideoa osatzen dute, eta bertan ornomuina kokatzen da.', n('2.2.2/p3/s3'), ['hodi-errakideoa', 'ornomuina'], {
          plain: 'Ornoen zuloek hodi bat egiten dute, hodi errakideoa, eta barruan ornomuina dago.',
        }),
        L(0.14, 'Ornomuinaren segmentu bakoitzarekin nerbio espinal pare bat erlazionatzen da, ezkerrekoa eta eskuinekoa.', n('2.2.2/p4/s1'), ['ornomuina', 'ornomuin-segmentuak', 'nerbio-espinalak'], {
          writes: 'b-pareak',
          plain: 'Ornomuinaren zati bakoitzetik bi nerbio espinal irteten dira, ezkerrekoa eta eskuinekoa.',
        }),
        L(0.2, 'Zeharkako mozketan, gai grisak H itxura du: hor neuronen somak kokatzen dira.', n('2.2.2/p5/s1', '2.2.2/p5/s2'), ['gai-grisa'], {
          plain: 'Zeharka ebakita, gai grisa tximeleta baten antzekoa da; hor daude neuronen gorputzak.',
        }),
        L(0.28, 'Aurreko adarretan neurona motoreak daude.', n('2.2.2/p6/s1', '2.2.2/p6/s2'), ['aurreko-adarra', 'neurona-motoreak'], {
          tone: 'emphasis',
          writes: 'b-gai-grisa',
          plain: 'Aurreko adarretan muskuluak mugiarazten dituzten neuronak daude: neurona motoreak.',
        }),
        L(0.36, 'Atzeko adarretan, neurona sentsorialak.', n('2.2.2/p7/s1', '2.2.2/p7/s2'), ['atzeko-adarra', 'neurona-sentsorialak'], {
          plain: 'Atzeko adarretan sentsazioak jasotzen dituztenak: neurona sentsorialak.',
        }),
        L(0.44, 'Alboko adarretan, ez beti, neurona begetatiboak; eta erdian, enimo hodia.', n('2.2.2/p8/s1'), ['alboko-adarra', 'neurona-begetatiboak', 'enimo-hodia'], {
          plain: 'Batzuetan alboko adarrak ere badaude, neurona begetatiboekin; erdian, enimo hodia.',
        }),
        L(0.52, 'Gai grisaren kanpoan gai zuria dago, hiru kordoirekin: atzekoa, albokoa eta aurrekoa.', n('2.2.2/p8/s2', '2.2.2/p8/s3'), ['gai-zuria', 'gai-grisa', 'atzeko-kordoia', 'alboko-kordoia', 'aurreko-kordoia'], {
          plain: 'Gai grisaren inguruan gai zuria dago; hor informazioa gora eta behera doa, traktuetan.',
        }),
      ],
      board: [
        { id: 'b-pareak', kind: 'line', text: 'Ornomuinaren segmentu bakoitzean nerbio espinal pare bat (ezkerrekoa eta eskuinekoa)', notes: n('2.2.2/p4/s1') },
        { id: 'b-gai-grisa', kind: 'line', text: 'Gai grisa: aurreko adarrak motoreak; atzekoak sentsorialak; albokoak begetatiboak', notes: n('2.2.2/p6/s2', '2.2.2/p7/s2', '2.2.2/p8/s1'), key: true },
      ],
      checks: [
        {
          kind: 'contrast',
          id: 'klasea:9/gai-grisa',
          concept: 'neurona-motoreak',
          q: 'Gai grisaren aurreko eta atzeko adarrak: zein neurona dago bakoitzean?',
          options: ['Aurrekoetan motoreak; atzekoetan sentsorialak', 'Aurrekoetan sentsorialak; atzekoetan motoreak', 'Bietan begetatiboak bakarrik'],
          answer: 0,
          why: ['Bai: motoreak aurrekaldean, sentsorialak atzekaldean.', 'Ez: alderantziz da.', 'Ez: begetatiboak alboko adarretan daude, ez beti.'],
          notes: n('2.2.2/p6/s1', '2.2.2/p6/s2', '2.2.2/p7/s1', '2.2.2/p7/s2'),
        },
      ],
    },

    {
      id: 'sustraiak',
      title: 'Sustraiak eta nerbio espinala',
      stage: 'nerbio-espinala',
      lines: [
        L(0.62, 'Neurona motoreen axoiak aurreko sustraitik pasatzen dira, eta nerbio espinalaren enborrean kokatzen dira.', n('2.2.2/p9/s3'), [
          'axoi-motoreak',
          'aurreko-sustraia',
          'nerbio-espinalak',
          'neurona-motoreak',
        ], { plain: 'Neurona motoreen hariak aurreko sustraitik irten, eta nerbio espinalera sartzen dira.' }),
        L(0.62, 'Beraz, informazio motorea ornomuinetik alde periferikora doa, muskulu ildaskatuetara.', n('2.2.2/p9/s4'), ['ornomuina', 'muskulu-ildaskatuak'], {
          tone: 'emphasis',
          writes: 'b-motorea',
          plain: 'Agindua ornomuinetik muskuluetara doa, kanpora.',
        }),
        L(0.76, 'Nerbio espinala aurreko eta atzeko sustraiak batzean sortzen da.', n('2.2.2/p10/s1'), ['aurreko-sustraia', 'atzeko-sustraia', 'nerbio-espinalak'], {
          plain: 'Bi sustraiak, aurrekoa eta atzekoa, elkartu egiten dira, eta nerbio espinala osatzen dute.',
        }),
        L(0.76, 'Horregatik, zuntz motoreez gain, zuntz sentsorialak ere baditu.', n('2.2.2/p10/s1'), ['nerbio-espinalak'], {
          plain: 'Beraz, nerbio espinalak bi zuntz mota ditu: motoreak eta sentsorialak.',
        }),
        L(0.86, 'Atzeko sustraian beti gongoil bat dago: gongoil errakideoa.', n('2.2.2/p11/s1'), ['atzeko-sustraia', 'gongoil-errakideoak'], {
          plain: 'Atzeko sustraian lodigune bat dago, gongoil errakideoa.',
        }),
        L(0.86, 'Haren neuronek bi luzapen dituzte: zentripetoa, ornomuinera, eta zentrifugoa, alde periferikora.', n('2.2.2/p11/s2'), [
          'luzapen-zentripetoa',
          'luzapen-zentrifugoa',
          'ornomuina',
        ], { writes: 'b-luzapenak', plain: 'Gongoileko neuronek bi hari dituzte: bata ornomuinera doa, zentripetoa; bestea kanpora, zentrifugoa.' }),
      ],
      board: [
        { id: 'b-motorea', kind: 'line', text: 'Axoi motoreak: aurreko sustraia, nerbio espinala, muskulu ildaskatuak', notes: n('2.2.2/p9/s3', '2.2.2/p9/s4'), key: true },
        { id: 'b-luzapenak', kind: 'line', text: 'Gongoil errakideoa (atzeko sustraia): luzapen zentripetoa ornomuinera, zentrifugoa periferiara', notes: n('2.2.2/p11/s1', '2.2.2/p11/s2'), key: true },
      ],
      checks: [
        {
          kind: 'contrast',
          id: 'klasea:9/luzapenak',
          concept: 'gongoil-errakideoak',
          q: 'Luzapen zentripetoa eta zentrifugoa: nora doa bakoitza?',
          options: ['Zentripetoa ornomuinera; zentrifugoa alde periferikora', 'Zentripetoa alde periferikora; zentrifugoa ornomuinera', 'Biak muskuluetara'],
          answer: 0,
          why: ['Bai: zentripetoa erdirantz, ornomuinera; zentrifugoa kanpora.', 'Ez: alderantziz da.', 'Ez: gongoileko neuronak sentsorialak dira.'],
          notes: n('2.2.2/p11/s2'),
        },
        { kind: 'pool', id: 'w9-q-erroak' },
      ],
    },

    {
      id: 'adarrak',
      title: 'Epaxialak eta hipaxialak',
      stage: 'epaxial-hipaxial',
      lines: [
        L(0, 'Nerbio espinalaren enborretik bi adar nagusi sortzen dira: aurreko adar primarioa eta atzeko adar primarioa.', n('2.2.2/p12/s1'), [
          'aurreko-adar-primarioa',
          'atzeko-adar-primarioa',
        ], { plain: 'Nerbio espinala bitan banatzen da: aurreko adar primarioa eta atzeko adar primarioa.' }),
        L(0, 'Bietan zuntz sentsorialak eta mugimendukoak daude.', n('2.2.2/p12/s2'), [], {
          plain: 'Bi adarrek dituzte bi zuntz motak.',
        }),
        L(0.14, 'Kontuz: ez nahastu adar primario hauek gai grisaren adarrekin, ezta sustraiekin ere.', n('2.2.2/p13/s1'), [
          'aurreko-adar-primarioa',
          'atzeko-adar-primarioa',
          'aurreko-adarra',
          'atzeko-adarra',
        ], { tone: 'caution', plain: 'Kontuz: hiru adar mota daude izen antzekoekin. Hauek nerbioaren adarrak dira, ez gai grisarenak.' }),
        L(0.26, 'Muskuluen inerbazioak ez du zerikusirik haien jatorriarekin.', n('2.2.2/p13/s2'), [], {
          tone: 'emphasis',
          writes: 'b-jatorria',
          plain: 'Garrantzitsua: muskulu baten jatorriak ez du esaten zein nerbiok mugitzen duen.',
        }),
        L(0.26, 'Gauza bat da muskuluaren jatorria; beste bat, zein adarrek inerbatzen duen.', n('2.2.2/p13/s3'), ['saihets-arteko-muskuluak', 'abdomeneko-muskuluak'], {
          plain: 'Adibidez, saihets artekoak eta abdomenekoak domeinu desberdinetakoak dira, baina adar berak inerbatzen ditu.',
        }),
        L(0.38, 'Aurreko adar primarioak ia muskulu ildaskatu guztiak inerbatzen ditu: gorputz paretakoak eta gorputz-adarretakoak.', n('2.2.2/p15/s1', '2.2.2/p16/s1', '2.2.2/p18/s1'), [
          'aurreko-adar-primarioa',
          'gorputz-paretako-muskuluak',
        ], { plain: 'Aurreko adar primarioak muskulu gehienak hartzen ditu: paretakoak eta gorputz-adarretakoak.' }),
        L(0.38, 'Baita bizkarraren muskulu autoktonoen azalean daudenak ere.', n('2.2.2/p17/s1'), [], {
          plain: 'Baita bizkarreko muskulu sakonen gainean daudenak ere.',
        }),
        L(0.5, 'Inerbazioaren arabera, bizkarrezurreko muskulu sakonak muskulu epaxialak dira, eta atzeko adar primarioak inerbatzen ditu.', n('2.2.2/p20/s1', '2.2.2/p21/s1', '2.2.2/p21/s2'), [
          'muskulu-epaxialak',
          'atzeko-adar-primarioa',
          'bizkarreko-muskulu-sakonak',
        ], { tone: 'emphasis', writes: 'b-epaxialak', plain: 'Bizkarreko muskulu sakonak epaxialak dira: atzeko adar primarioak mugitzen ditu.' }),
        L(0.5, 'Gainerako muskulu ildaskatu guztiak hipaxialak dira, eta aurreko adar primarioak inerbatzen ditu.', n('2.2.2/p22/s1', '2.2.2/p22/s2'), [
          'muskulu-hipaxialak',
          'aurreko-adar-primarioa',
        ], { plain: 'Beste guztiak hipaxialak dira: aurreko adar primarioak mugitzen ditu.' }),
      ],
      board: [
        { id: 'b-jatorria', kind: 'line', text: 'Inerbazioak ez du zerikusirik jatorriarekin', notes: n('2.2.2/p13/s2'), key: true },
        { id: 'b-epaxialak', kind: 'line', text: 'Epaxialak (bizkarreko muskulu sakonak): atzeko adar primarioa. Hipaxialak (gainerakoak): aurreko adar primarioa', notes: n('2.2.2/p21/s1', '2.2.2/p21/s2', '2.2.2/p22/s1', '2.2.2/p22/s2'), key: true },
      ],
      checks: [
        {
          kind: 'contrast',
          id: 'klasea:9/epaxial-hipaxial',
          concept: 'muskulu-epaxialak',
          q: 'Muskulu epaxialak eta hipaxialak: zein adarrek inerbatzen ditu bakoitza?',
          options: ['Epaxialak atzeko adar primarioak; hipaxialak aurrekoak', 'Epaxialak aurreko adar primarioak; hipaxialak atzekoak', 'Biak nerbio kranialek'],
          answer: 0,
          why: ['Bai: bizkarreko muskulu sakonak atzeko adarrarenak dira; beste guztiak, aurrekoarenak.', 'Ez: alderantziz da.', 'Ez: nerbio kranialak buruko muskuluenak dira.'],
          notes: n('2.2.2/p21/s1', '2.2.2/p21/s2', '2.2.2/p22/s1', '2.2.2/p22/s2'),
        },
      ],
    },

    {
      id: 'sareak',
      title: 'Segmentuak eta sareak',
      stage: 'epaxial-hipaxial',
      lines: [
        L(0.7, 'Toraxean, saihets arteko muskuluen inerbazioa metamerikoa da, edo segmentarioa.', n('2.2.2/p26/s2'), ['saihets-arteko-nerbioak'], {
          plain: 'Toraxean, segmentu bakoitzak bere saihets arteko nerbioa du.',
        }),
        L(0.8, 'Gorputz-adarretan, aldiz, maila desberdinetako zuntzek nerbio sareak osatzen dituzte.', n('2.2.2/p26/s3'), ['nerbio-sareak'], {
          writes: 'b-sareak',
          plain: 'Gorputz-adarretan, ordea, hainbat mailatako zuntzak nahasten dira: nerbio sareak sortzen dira.',
        }),
        L(0.8, 'Sare horietatik nerbio jakin batzuk irteten dira.', n('2.2.2/p26/s3'), ['nerbio-sareak'], {
          plain: 'Eta sareetatik nerbio izendun batzuk ateratzen dira.',
        }),
        L(0.88, 'Beheko gorputz-adarrean, adibidez, nerbio femorala eta ziatikoa; goikoan, erradiala, ertaina eta kubitala.', n('2.2.2/p27/s1', '2.2.2/p28/s1'), [
          'nerbio-femorala',
          'nerbio-ziatikoa',
          'nerbio-erradiala',
          'nerbio-ertaina',
          'nerbio-kubitala',
        ], { plain: 'Hankan, nerbio femorala eta ziatikoa; besoan, nerbio erradiala, ertaina eta kubitala.' }),
        L(0.88, 'Nerbio espinalek gorputzeko muskulu guztiak inerbatzen dituzte, burukoak izan ezik.', n('2.2.2/p28/s1'), [], {
          tone: 'emphasis',
          writes: 'b-espinalak',
          plain: 'Nerbio espinalek gorputzeko muskulu guztiak mugitzen dituzte, buruko muskuluak izan ezik.',
        }),
      ],
      board: [
        { id: 'b-sareak', kind: 'line', text: 'Saihets artekoak: metamerikoak. Gorputz-adarrak: nerbio sareak', notes: n('2.2.2/p26/s2', '2.2.2/p26/s3'), key: true },
        { id: 'b-espinalak', kind: 'line', text: 'Nerbio espinalak: muskulu guztiak, burukoak izan ezik', notes: n('2.2.2/p28/s1'), key: true },
      ],
      checks: [
        {
          kind: 'contrast',
          id: 'klasea:9/sareak',
          concept: 'nerbio-sareak',
          q: 'Saihets arteko muskuluak eta gorputz-adarretako muskuluak: nola iristen zaie inerbazioa?',
          options: ['Saihets artekoei segmentuka; gorputz-adarretakoei nerbio sareetatik', 'Saihets artekoei sareetatik; gorputz-adarretakoei segmentuka', 'Biei nerbio kranialetatik'],
          answer: 0,
          why: ['Bai: toraxean erlazioa metamerikoa da; gorputz-adarretan zuntzak sareetan nahasten dira.', 'Ez: alderantziz da.', 'Ez: nerbio kranialak buruko muskuluenak dira.'],
          notes: n('2.2.2/p26/s2', '2.2.2/p26/s3'),
        },
        { kind: 'pool', id: 'w9-q-sareak' },
      ],
    },

    {
      id: 'leuna',
      title: 'Muskulu leuna',
      stage: 'muskulu-lisoa',
      lines: [
        L(0, 'Muskulu leunak erraiekin erlazionatutako muskuluak dira.', n('3/p3/s1'), ['muskulu-leuna'], {
          plain: 'Muskulu leuna erraietan dago.',
        }),
        L(0, 'Orokorrean, heste eta heste-eratorrien inguruko alboko mesodermoaren errai orritik sortzen da.', n('3/p3/s5'), ['muskulu-leuna', 'errai-orria'], {
          tone: 'emphasis',
          writes: 'b-leuna',
          plain: 'Gehienetan, hestearen eta haren eratorrien inguruko errai orritik dator.',
        }),
        L(0.28, 'Haren inerbazioa begetatiboa da, sinpatikoa eta parasinpatikoa: ez kraniala, ez espinala.', n('3/p5/s1', '3/p5/s2'), ['nerbio-sistema-begetatiboa', 'muskulu-leuna'], {
          plain: 'Muskulu leuna nerbio sistema begetatiboak kontrolatzen du, ez guk nahita.',
        }),
        L(0.42, 'Diskoaren tolespenengatik endodermoa barneratzen da, eta hestea sortzen da.', n('3/p6/s1'), [], {
          tone: 'recall',
          plain: 'Gogoratu: diskoa tolestean endodermoa barrura sartzen da eta hestea egiten du.',
        }),
        L(0.42, 'Hestea mintz bukofaringeotik kloaka mintzeraino hedatzen da: aurreko, bitarteko eta atzeko hestea.', n('3/p6/s2'), [
          'mintz-bukofaringeoa',
          'kloaka-mintza',
          'aurreko-hestea',
          'erdiko-hestea',
          'atzeko-hestea',
        ], { plain: 'Hestea mintz bukofaringeotik kloaka mintzera doa, hiru zatitan: aurreko hestea, bitartekoa eta atzeko hestea.' }),
        L(0.72, 'Aorta bihotzaren ezkerreko bentrikulutik irteten da, eta gorputzeko arteriarik garrantzitsuena da.', n('3/p8/s2'), ['aorta-dortsalak'], {
          plain: 'Aorta gorputzeko arteria nagusia da, eta bihotzaren ezkerreko bentrikulutik irteten da.',
        }),
        L(0.72, 'Aortaren eta haren adarren muskulu leuna, ordea, paretako orritik eta gandor neuraletik sortzen dela uste da.', n('3/p8/s4'), [
          'muskulu-leuna',
          'paretako-orria',
          'gandor-neurala',
          'errai-orria',
        ], { tone: 'caution', writes: 'b-aorta', plain: 'Kontuz: aortaren muskulu leuna ez dator errai orritik, paretako orritik eta gandor neuraletik baizik.' }),
      ],
      board: [
        { id: 'b-leuna', kind: 'line', text: 'Muskulu leuna: erraiak; hestearen inguruko errai orritik; inerbazio begetatiboa', notes: n('3/p3/s5', '3/p5/s2'), key: true },
        { id: 'b-aorta', kind: 'line', text: 'Aortaren muskulu leuna: paretako orritik eta gandor neuraletik', notes: n('3/p8/s4'), key: true },
      ],
      checks: [
        {
          kind: 'contrast',
          id: 'klasea:9/leuna-jatorria',
          concept: 'muskulu-leuna',
          q: 'Hestearen paretako muskulu leuna eta aortarena: nondik dator bakoitza?',
          options: ['Hestearena errai orritik; aortarena paretako orritik eta gandor neuraletik', 'Hestearena paretako orritik; aortarena errai orritik', 'Biak somitetatik'],
          answer: 0,
          why: ['Bai: aorta da salbuespena.', 'Ez: alderantziz da.', 'Ez: somitetatik muskulu ildaskatuak datoz.'],
          notes: n('3/p3/s5', '3/p8/s4'),
        },
      ],
    },

    {
      id: 'bihotza',
      title: 'Bihotzeko muskulua',
      stage: 'bihotz-muskulua',
      lines: [
        L(0, 'Bihotzeko muskulua bi bihotz hodien inguruko alboko mesodermoaren errai orritik sortzen da.', n('4/p3/s1'), ['bihotz-hodiak', 'errai-orria', 'miokardioa'], {
          plain: 'Bihotzeko muskulua bi bihotz hodien inguruko errai orritik dator.',
        }),
        L(0, 'Errai orri horretatik bihotzaren tarteko geruza garatzen da: miokardioa.', n('4/p3/s2'), ['errai-orria', 'miokardioa'], {
          plain: 'Hortik bihotzaren tarteko geruza sortzen da: miokardioa.',
        }),
        L(0.14, 'Bihotzeko mioblastoak ez dira fusionatzen: disko interkalarren bidez lotzen dira.', n('4/p3/s6'), ['miokardioa', 'disko-interkalarrak'], {
          tone: 'emphasis',
          writes: 'b-diskoak',
          plain: 'Bihotzeko zelulak ez dira elkartzen zuntz bakar batean: lotura bereziek, disko interkalarrek, lotzen dituzte.',
        }),
        L(0.46, 'Eskuineko aurikulan nodulu sinusala dago, markapasoa; haren beheko aldean, nodulu aurikobentrikularra.', n('4/p6/s1'), [
          'eskuineko-aurikula',
          'nodulu-sinusala',
          'nodulu-aurikobentrikularra',
        ], { plain: 'Eskuineko aurikulan nodulu sinusala dago, bihotzaren markapasoa; beherago, nodulu aurikobentrikularra.' }),
        L(0.6, 'Hortik His faszikulua ateratzen da, bi adarrekin, eta endokardio azpian Purkinje sarea eratzen du.', n('4/p6/s2'), [
          'his-faszikulua',
          'purkinje-sarea',
          'endokardioa',
        ], { writes: 'b-eroapena', plain: 'Gero His faszikulua bitan banatzen da, eta endokardio azpian Purkinje sarea egiten du.' }),
        L(0.74, 'Noduluak ez dira nerbio sistemaren parte: zuntz muskular oso espezializatuak dira.', n('4/p5/s1'), ['nodulu-sinusala', 'nodulu-aurikobentrikularra', 'eroapen-sistema'], {
          tone: 'caution',
          writes: 'b-noduluak',
          plain: 'Kontuz: noduluak ez dira nerbioak; muskulu zuntz bereziak dira.',
        }),
        L(0.74, 'Hau da bihotzak daukan barneko inerbazioa.', n('4/p5/s3'), ['eroapen-sistema'], {
          plain: 'Hori da bihotzaren barneko kontrola.',
        }),
        L(0.84, 'Horrez gain, bihotzak kanpoko inerbazioa du: nerbio sistema begetatiboa.', n('4/p5/s4'), ['nerbio-sistema-begetatiboa'], {
          plain: 'Gainera, nerbio sistema begetatiboak ere kontrolatzen du bihotza, kanpotik.',
        }),
        L(0.92, 'Gogoratu: erraien eta bihotzaren inerbazioa begetatiboa da; muskulu ildaskatuena, kraniala edo espinala.', n('4/p8/s1', '2.1.2/p6/s1', '2.2.2/p28/s1'), [
          'muskulu-ildaskatuak',
          'muskulu-leuna',
          'miokardioa',
          'nerbio-sistema-begetatiboa',
        ], { tone: 'recall', plain: 'Erraiak eta bihotza nerbio begetatiboek kontrolatzen dituzte; ildaskatuak, nerbio kranialek edo espinalek.' }),
      ],
      board: [
        { id: 'b-diskoak', kind: 'line', text: 'Miokardioa: mioblastoak ez dira fusionatzen; disko interkalarrak', notes: n('4/p3/s6'), key: true },
        { id: 'b-eroapena', kind: 'line', text: 'Nodulu sinusala, nodulu aurikobentrikularra, His faszikulua, Purkinje sarea', notes: n('4/p6/s1', '4/p6/s2'), key: true },
        { id: 'b-noduluak', kind: 'line', text: 'Noduluak: zuntz muskular espezializatuak (barneko inerbazioa). Kanpokoa: nerbio sistema begetatiboa', notes: n('4/p5/s1', '4/p5/s3', '4/p5/s4'), key: true },
      ],
      checks: [
        { kind: 'pool', id: 'w9-q-eroapen-ordena', after: 4 },
        {
          kind: 'contrast',
          id: 'klasea:9/bihotz-inerbazioa',
          concept: 'eroapen-sistema',
          q: 'Bihotzaren barneko eta kanpoko inerbazioa: zer da bakoitza?',
          options: ['Barnekoa eroapen sistema; kanpokoa nerbio sistema begetatiboa', 'Barnekoa nerbio sistema begetatiboa; kanpokoa eroapen sistema', 'Biak nerbio espinalak'],
          answer: 0,
          why: ['Bai: noduluak zuntz muskularrak dira; kanpotik nerbio sistema begetatiboa iristen da.', 'Ez: alderantziz da.', 'Ez: nerbio espinalak muskulu ildaskatuenak dira.'],
          notes: n('4/p5/s1', '4/p5/s3', '4/p5/s4'),
        },
      ],
    },

    {
      id: 'amaiera',
      title: 'Osatu taula',
      stage: 'okzipitalak',
      lines: [
        L(0.84, 'Laburbilduz: muskulu ildaskatuak mesodermo paraxialetik datoz; leunak eta miokardioa, errai orritik.', n('2/p3/s1', '1/p6/s1', '1/p7/s1'), [], {
          tone: 'summary',
          plain: 'Gogoratu: ildaskatuak mesodermo paraxialetik; leunak eta bihotzekoa, errai orritik.',
        }),
        L(0.84, 'Buruko muskuluak nerbio kranialek inerbatzen dituzte; gainerakoak, nerbio espinalek.', n('2.1.2/p6/s1', '2.2.2/p28/s1'), ['nerbio-kranialak'], {
          tone: 'summary',
          plain: 'Buruko muskuluak nerbio kranialek mugitzen dituzte; beste guztiak, nerbio espinalek.',
        }),
        L(0.84, 'Leunak eta bihotza, berriz, nerbio sistema begetatiboak.', n('3/p5/s2', '4/p5/s4'), [], {
          tone: 'summary',
          plain: 'Erraiak eta bihotza, nerbio sistema begetatiboak.',
        }),
        L(0.84, 'Orain zure txanda: osatu buruko muskuluen taula oroimenetik, eta gero galdera bat.', n('2.1.4/p20/s1'), [], {
          tone: 'summary',
          plain: 'Orain zu: bete taula buruz, eta gero erantzun galdera bati.',
        }),
      ],
      checks: [
        { kind: 'fill', id: 'klasea:9/taula', table: 'taula', blanks: ['tz-1-2', 'tz-3', 'tz-4', 'tz-5', 'tz-6', 'tz-7', 'tz-ok-1-2', 'tz-ok-2-5'] },
        { kind: 'pool', id: 'w9-q-inerbazioa' },
      ],
    },
  ],
};
