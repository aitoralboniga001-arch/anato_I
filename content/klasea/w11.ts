import type { BoardItem, Lesson, Line } from '@/lib/klasea/types';

/**
 * Topic 11's class: the core of the notes (content/klasea/importance/w11.ts), said over the existing
 * stages, 3D views and camera moves, from the two ways a septum forms to the coronary arteries. Every line
 * cites the sentences it rests on; tests/klasea.test.ts holds each line to them (numbers, directions,
 * names, the frames it is said over). Plan: docs/klasea-plan.md §4.
 */

const n = (...ids: string[]) => ids.map((id) => `w11/${id}`);

/** A line said at stage time `at`, lighting `focus`. */
const L = (at: number, say: string, notes: string[], focus: string[] = [], more: Partial<Line> = {}): Line => ({ at, say, notes, focus, ...more });

/** The two parts of each chamber's wall and where each comes from (notes 2.2 p9–p13, 5.2 p10). */
const TABLE: BoardItem = {
  id: 'taula',
  kind: 'table',
  head: ['Barrunbea', 'Atal lisoa', 'Atal trabekulatua'],
  rows: [
    {
      id: 'tz-esk-aurikula',
      cells: ['Eskuineko aurikula', 'Zain sinutik', 'Atal aurikularretik'],
      notes: n('2.2/p9/s1', '2.2/p10/s1'),
      structures: ['atal-lisoa', 'atal-trabekulatua'],
    },
    {
      id: 'tz-ezk-aurikula',
      cells: ['Ezkerreko aurikula', 'Lau birika zainetatik', 'Atal aurikularraren ezkerreko zabalkuntzatik'],
      notes: n('2.2/p13/s4', '2.2/p13/s5'),
      structures: ['ezkerreko-aurikularen-atal-lisoa', 'ezkerreko-aurikularen-atal-trabekulatua'],
    },
    {
      id: 'tz-bentrikuluak',
      cells: ['Bentrikuluak', 'Arteria konotik: infundibuluak', 'Hasierako bentrikuluetatik'],
      notes: n('5.2/p10/s2'),
      structures: ['infundibuluak', 'hasierako-eskuineko-bentrikulua'],
    },
  ],
};

export const LESSON_W11: Lesson = {
  week: 11,
  title: 'Bihotzaren trenkadak',
  goals: [
    'Trenkada bat sortzeko bi mekanismoak',
    'Aurikulak: bi trenkada, bi zulo, eta jaiotzean itxiera',
    'Erretena, balbulak eta bentrikuluen trenkada',
    'Konoa eta enbor arteriosoa: trenkada kiribila eta arteria handiak',
  ],
  chunks: [
    {
      id: 'gaur',
      title: 'Gaur',
      stage: 'trenkadatze-mekanismoak',
      lines: [
        L(0, 'Kaixo! Gaur bihotzaren barrunbeak nola banatzen diren ikasiko dugu: trenkadak.', n('1/p3/s1')),
        L(0, 'Hasieran zuzena zen bihotz hodia tolestu egiten da, eta lakio bat sortzen da.', n('1/p3/s1'), [], { tone: 'recall' }),
        L(0.11, 'Trenkadatzea 27. eta 37. egunen artean gertatzen da: 4. eta 5. asteetan, gutxi gorabehera.', n('1/p4/s1'), [], { tone: 'emphasis', writes: 'b-noiz' }),
      ],
      board: [
        {
          id: 'b-noiz',
          kind: 'line',
          text: 'Trenkadatzea: 27–37. egunak (4.–5. asteak)',
          notes: n('1/p4/s1'),
          key: true,
        },
      ],
      checks: [
        {
          kind: 'predict',
          q: 'Zer uste duzu: nola bana daiteke barrunbe bat bitan?',
          options: ['Paretatik hazten den trenkada batekin', 'Barrunbea bitan hautsiz', 'Hodi berri bat sortuz'],
          answer: 0,
          why: ['Bai: paretetatik trenkadak hazten dira, eta bi modutan.', 'Ez: paretetatik hazten den trenkada batek banatzen du.', 'Ez: barrunbe beraren barruan trenkada bat hazten da.'],
          notes: n('1/p4/s2'),
        },
      ],
    },

    {
      id: 'mekanismoak',
      title: 'Bi mekanismoak',
      stage: 'trenkadatze-mekanismoak',
      lines: [
        L(0.22, 'Lehen mekanismoa: barrunbearen paretan goraguneak agertzen dira, endokardio kuxinak.', n('1/p5/s1'), ['endokardio-kuxinak']),
        L(0.22, 'Kuxinaren erdigunean zelula kanpoko matrizea dago, eta endokardioak estaltzen du.', n('1/p5/s2'), ['kuxinaren-matrizea', 'endokardioa'], { tone: 'emphasis', writes: 'b-kuxina' }),
        L(0.35, 'Aurkako paretan gauza bera gertatzen bada, bi kuxinak hazi eta hurbildu egiten dira, fusionatu arte: trenkada bat.', n('1/p5/s3'), ['endokardio-kuxinak'], {
          tone: 'emphasis',
          writes: 'b-mek1',
        }),
        L(0.5, 'Beste batzuetan kuxin bakarra sortzen da, eta kontrako paretara iritsi arte luzatzen da.', n('1/p5/s4', '1/p5/s5'), ['endokardio-kuxinak']),
        L(0.63, 'Bigarren mekanismoa bentrikuluetan ikusten da: hasieran bi hasierako bentrikulu daude, eskuinean eta ezkerrean.', n('1/p6/s1'), [
          'hasierako-eskuineko-bentrikulua',
          'hasierako-ezkerreko-bentrikulua',
        ]),
        L(0.75, 'Barneko bi pareta muskularrak hazi eta fusionatzen dira: trenkada muskularra. Baina ez da osoa.', n('1/p6/s2'), ['trenkada-muskularra'], {
          tone: 'emphasis',
          writes: 'b-mek2',
          plain: 'Bi pareta elkarrengana hazten dira eta ukitzean bat egiten dute, baina barrunbea ez da guztiz banatzen.',
        }),
      ],
      board: [
        {
          id: 'b-kuxina',
          kind: 'line',
          text: 'Endokardio kuxina: erdian zelula kanpoko matrizea, endokardioz estalia',
          notes: n('1/p5/s2'),
          key: true,
        },
        {
          id: 'b-mek1',
          kind: 'line',
          text: 'Lehen mekanismoa: kuxinak hazi eta fusionatu, trenkada osoa',
          notes: n('1/p5/s3', '1/p5/s5'),
        },
        {
          id: 'b-mek2',
          kind: 'line',
          text: 'Bigarren mekanismoa (bentrikuluak): bi pareta muskular fusionatu, trenkada ez osoa',
          notes: n('1/p6/s1', '1/p6/s2'),
          key: true,
        },
      ],
      checks: [
        { kind: 'pool', id: 'mikro:11/trenkadatze-mekanismoak:2', after: 1 },
        {
          kind: 'contrast',
          id: 'klasea:11/mekanismoak',
          concept: 'trenkada-muskularra',
          q: 'Bi mekanismoak: zein da haien arteko aldea?',
          options: [
            'Kuxinek trenkada osoa egiten dute; bi pareta muskularrek, ez osoa',
            'Pareta muskularrek trenkada osoa egiten dute; kuxinek, ez osoa',
            'Biek trenkada osoa egiten dute',
            'Biek trenkada ez osoa egiten dute',
          ],
          answer: 0,
          why: [
            'Bai: kuxinak fusionatu edo kontrako paretaraino luzatzen dira; pareta muskularrek ez dute guztiz banatzen.',
            'Ez: alderantziz da.',
            'Ez: trenkada muskularra ez da osoa.',
            'Ez: kuxinek trenkada osoa egiten dute.',
          ],
          notes: n('1/p5/s3', '1/p5/s5', '1/p6/s2'),
        },
      ],
    },

    {
      id: 'septum-primum',
      title: 'Septum primuma',
      stage: 'septum-primum',
      lines: [
        L(0, 'Hasi gaitezen aurikulekin. Aurikulan bi alboko zabalkuntza daude, baina trenkada bat sortu behar da.', n('2.1/p3/s1'), ['hasierako-eskuineko-aurikula', 'hasierako-ezkerreko-aurikula']),
        L(0.14, '4. astearen amaieran, sabaian, lehen trenkada sortzen da: septum primuma, endokardio goragune bat.', n('2.1/p3/s4'), ['septum-primum'], { tone: 'emphasis', writes: 'b-primum' }),
        L(0.46, 'Erretenaren inguruan bi kuxin agertzen dira: bat goikoa, eta bestea behekoa.', n('2.1/p4/s1'), ['kuxin-aurikulubentrikularrak']),
        L(0.58, 'Septum primumaren beheko aldean zulo bat geratzen da: ostium primuma. Hortik odola eskuinetik ezkerrera igarotzen da.', n('2.1/p4/s2'), ['septum-primum', 'ostium-primuma'], {
          tone: 'emphasis',
          writes: 'b-ostium1',
        }),
        L(0.7, 'Itxi aurretik, septum primumaren goiko aldean beste zulo bat irekitzen da: ostium secunduma.', n('2.1/p4/s4'), ['septum-primum', 'ostium-secunduma'], { tone: 'emphasis' }),
        L(0.7, 'Horrela, odolak eskuineko aurikulatik ezkerrekora igarotzen jarraitzen du.', n('2.1/p4/s5'), [], { tone: 'why' }),
        L(0.84, 'Ostium primuma, berriz, erretenaren kuxinetatik irteten diren luzapenek ixten dute.', n('2.1/p4/s3'), ['ostium-primuma', 'kuxin-aurikulubentrikularrak'], { writes: 'b-ostium2' }),
      ],
      board: [
        {
          id: 'b-primum',
          kind: 'line',
          text: 'Septum primuma: 4. aste amaieran, aurikula komunaren sabaian',
          notes: n('2.1/p3/s4'),
        },
        {
          id: 'b-ostium1',
          kind: 'line',
          text: 'Ostium primuma: septum primumaren beheko aldean, kuxinen ondoan',
          notes: n('2.1/p4/s2'),
          key: true,
        },
        {
          id: 'b-ostium2',
          kind: 'line',
          text: 'Ostium primuma kuxinen luzapenek ixten dute; aurretik, goian, ostium secunduma irekitzen da',
          notes: n('2.1/p4/s3', '2.1/p4/s4'),
        },
      ],
      checks: [
        { kind: 'pool', id: 'mikro:11/septum-primum:4', after: 3 },
        {
          kind: 'contrast',
          id: 'klasea:11/ostiumak',
          concept: 'ostium-primuma',
          q: 'Ostium primuma eta ostium secunduma: non dago bakoitza?',
          options: ['Primuma septum primumaren beheko aldean; secunduma goiko aldean', 'Primuma goiko aldean; secunduma beheko aldean', 'Biak septum secundumean', 'Biak beheko aldean'],
          answer: 0,
          why: ['Bai: primuma behean, kuxinen ondoan; secunduma goian, primuma itxi aurretik.', 'Ez: alderantziz da.', 'Ez: biak septum primumean daude.', 'Ez: secunduma goiko aldean irekitzen da.'],
          notes: n('2.1/p4/s2', '2.1/p4/s4'),
        },
      ],
    },

    {
      id: 'zulo-obala',
      title: 'Septum secunduma eta zulo obala',
      stage: 'zulo-obala',
      lines: [
        L(0, 'Bitartean, atzean zegoen sinua eskuineko aurikularen atzeko paretara inkorporatzen da.', n('2.2/p3/s1')),
        L(0.12, 'Orduan, septum primumaren eskuinean, sabaitik hasita, bigarren trenkada sortzen da: septum secunduma.', n('2.2/p3/s2'), ['septum-primum', 'septum-secundum'], {
          tone: 'emphasis',
          writes: 'b-secundum',
        }),
        L(0.27, 'Hau ere behera hedatzen da, baina ez da osoa: beheko aldean zulo bat du, zulo obala.', n('2.2/p3/s4'), ['septum-secundum', 'zulo-obala'], { tone: 'emphasis' }),
        L(
          0.55,
          'Beraz, bi trenkada daude: septum primuma, goian ostium secundumarekin, eta haren eskuinean septum secunduma, behean zulo obalarekin.',
          n('2.2/p4/s1'),
          ['septum-primum', 'ostium-secunduma', 'septum-secundum', 'zulo-obala'],
          {
            tone: 'summary',
            writes: 'b-bi-trenkada',
            hold: 1.5,
          },
        ),
        L(0.67, 'Jaio arte, odolak bide laprana egiten du: lehenik zulo obaletik, eta gero ostium secundumatik.', n('2.2/p5/s1'), ['zulo-obala', 'ostium-secunduma'], {
          tone: 'emphasis',
          writes: 'b-laprana',
        }),
        L(0.82, 'Liburu batzuen arabera, septum primumaren goiko ataltxoa desagertzen da, eta beheko atala zulo obalaren balbula bihurtzen da.', n('2.2/p6/s1'), [
          'septum-primum',
          'zulo-obalaren-balbula',
        ]),
      ],
      board: [
        {
          id: 'b-secundum',
          kind: 'line',
          text: 'Septum secunduma: septum primumaren eskuinean, sabaitik',
          notes: n('2.2/p3/s2'),
        },
        {
          id: 'b-bi-trenkada',
          kind: 'line',
          text: 'Septum primuma (goian ostium secunduma) eta septum secunduma (behean zulo obala)',
          notes: n('2.2/p4/s1'),
          key: true,
        },
        {
          id: 'b-laprana',
          kind: 'line',
          text: 'Jaio arte: zulo obala, gero ostium secunduma (bide laprana)',
          notes: n('2.2/p5/s1'),
          key: true,
        },
      ],
      checks: [
        {
          kind: 'order',
          id: 'klasea:11/bide-laprana',
          after: 4,
          q: 'Ordenatu odolaren bidea jaio arte, eskuineko aurikulatik ezkerrekora.',
          items: [
            {
              label: 'Hasierako eskuineko aurikula',
              structure: 'hasierako-eskuineko-aurikula',
            },
            { label: 'Zulo obala', structure: 'zulo-obala' },
            { label: 'Ostium secunduma', structure: 'ostium-secunduma' },
            {
              label: 'Hasierako ezkerreko aurikula',
              structure: 'hasierako-ezkerreko-aurikula',
            },
          ],
          notes: n('2.2/p5/s1'),
        },
      ],
    },

    {
      id: 'jaiotza',
      title: 'Jaiotzean',
      stage: 'jaiotza',
      lines: [
        L(0, 'Jaiotzean birika zirkulazioa eratzen da: odola biriketara doa oxigenatzera, eta ezkerreko aurikulara itzultzen da.', n('2.2/p7/s1'), ['ezkerreko-aurikula-jaiotakoan']),
        L(0.27, 'Horregatik, ezkerreko aurikulara gero eta odol gehiago iristen da, eta bertako presioa handitzen da.', n('2.2/p7/s3'), ['ezkerreko-aurikula-jaiotakoan'], { tone: 'why' }),
        L(0.41, 'Presio horrek zulo obalaren balbula septum secundumaren aurka bultzatzen du.', n('2.2/p7/s4'), ['zulo-obalaren-balbula', 'septum-secundum'], { tone: 'emphasis' }),
        L(0.55, 'Bi trenkadak fusionatzen hasten dira, eta komunikazioa ixten da: jaio ondoren eta lehen urtean zehar.', n('2.2/p7/s5'), ['zulo-obalaren-balbula', 'septum-secundum'], {
          tone: 'emphasis',
          writes: 'b-ixtea',
        }),
        L(0.71, 'Kontuz: kasuen ehuneko hogeian fusioa ez da osoa, eta arraildura txiki bat geratzen da eskuinetik ezkerrera.', n('2.2/p7/s6'), ['zulo-obala'], { tone: 'caution' }),
        L(0.85, 'Orduan, ezkerreko aurikulan odol oxigenatua eta zain odola nahasten dira: jaioberria urdinxka da, zianosia.', n('2.2/p7/s7', '2.2/p7/s8'), ['ezkerreko-aurikula-jaiotakoan'], {
          tone: 'why',
          writes: 'b-zianosia',
        }),
      ],
      board: [
        {
          id: 'b-ixtea',
          kind: 'line',
          text: 'Jaiotzean presioak balbula septum secundumaren aurka; fusioa jaio ondoren eta lehen urtean',
          notes: n('2.2/p7/s4', '2.2/p7/s5'),
          key: true,
        },
        {
          id: 'b-zianosia',
          kind: 'line',
          text: 'Kasuen %20an fusioa ez da osoa: odola nahasten da, zianosia',
          notes: n('2.2/p7/s6', '2.2/p7/s8'),
        },
      ],
      checks: [
        {
          kind: 'predict',
          after: 0,
          q: 'Zer uste duzu: jaiotzean, zer gertatuko zaio ezkerreko aurikulako presioari?',
          options: ['Handitu egingo da', 'Jaitsi egingo da', 'Ez da aldatuko'],
          answer: 0,
          why: ['Bai: biriketatik odol gehiago iristen da, eta presioa handitzen da.', 'Ez: odol gehiago iristen da, beraz handitu egiten da.', 'Ez: odol gehiago iristen denez, handitu egiten da.'],
          notes: n('2.2/p7/s3'),
        },
        { kind: 'pool', id: 'mikro:11/jaiotza:3', after: 3 },
      ],
    },

    {
      id: 'paretak',
      title: 'Aurikulen paretak',
      stage: 'aurikulen-paretak',
      lines: [
        L(0, 'Orain paretak. Aurikula komuna atzean dagoen zain sinuarekin komunikatuta dago, zulo baten bidez.', n('2.2/p8/s1'), ['zain-sinua']),
        L(0.12, 'Zain sinua eskuineko aurikularen atzeko paretara inkorporatzen da: atzeko pareta lisoa sortzen da.', n('2.2/p8/s2', '2.2/p9/s1'), ['zain-sinua', 'atal-lisoa'], { tone: 'emphasis' }),
        L(0.12, 'Bertan irekitzen dira goiko eta beheko kaba zainak, eta sinu koronarioa.', n('2.2/p9/s1'), ['goiko-kaba-zaina', 'beheko-kaba-zaina', 'sinu-koronarioa'], {
          writes: 'tz-esk-aurikula',
        }),
        L(
          0.25,
          'Gainerako pareta atal aurikularretik dator: atal trabekulatua, belarritxoa, barrutik muskulu pektinioekin.',
          n('2.2/p10/s1', '2.2/p10/s2', '2.2/p10/s3'),
          ['atal-trabekulatua', 'belarritxoa', 'muskulu-pektinioak'],
          { tone: 'emphasis' },
        ),
        L(0.37, 'Bi atalen artean gandor terminala dago, eta haren goiko aldean nodulu sinusala.', n('2.2/p11/s1'), ['gandor-terminala', 'nodulu-sinusala'], { writes: 'b-gandor' }),
        L(0.5, 'Ezkerreko aurikulan, atzeko paretatik ebaginazio bat irteten da: hasierako birika zaina.', n('2.2/p13/s1', '2.2/p13/s2'), ['birika-zain-primitiboa']),
        L(0.62, 'Lau adar ematen ditu, eta birika hastapenetako zainekin kontaktatzen du.', n('2.2/p13/s3'), ['birika-zain-primitiboa', 'birika-hastapenak']),
        L(
          0.76,
          'Azkenean, lau birika zain inkorporatzen dira, bi birika bakoitzetik: ezkerreko aurikularen atal lisoa osatzen dute.',
          n('2.2/p13/s4'),
          ['birika-zainak', 'ezkerreko-aurikularen-atal-lisoa'],
          { tone: 'emphasis', writes: 'tz-ezk-aurikula' },
        ),
      ],
      board: [
        TABLE,
        {
          id: 'b-gandor',
          kind: 'line',
          text: 'Gandor terminala: atal lisoaren eta trabekulatuaren artean; goian nodulu sinusala',
          notes: n('2.2/p11/s1'),
        },
      ],
      checks: [
        { kind: 'pool', id: 'mikro:11/aurikulen-paretak:2', after: 3 },
        {
          kind: 'contrast',
          id: 'klasea:11/atal-lisoak',
          concept: 'atal-lisoa',
          q: 'Bi aurikulen atzeko pareta lisoa: nondik dator bakoitza?',
          options: ['Eskuinekoa zain sinutik; ezkerrekoa inkorporatutako birika zainetatik', 'Eskuinekoa birika zainetatik; ezkerrekoa zain sinutik', 'Biak zain sinutik', 'Biak atal aurikularretik'],
          answer: 0,
          why: ['Bai: jatorri desberdinak dituzte.', 'Ez: alderantziz da.', 'Ez: ezkerrekoa lau birika zainek osatzen dute.', 'Ez: atal aurikularretik atal trabekulatuak datoz.'],
          notes: n('2.2/p9/s1', '2.2/p13/s4'),
        },
      ],
    },

    {
      id: 'erretena',
      title: 'Erreten aurikulubentrikularra',
      stage: 'erreten-ab',
      lines: [
        L(0, 'Orain bentrikuluak. Erreten aurikulubentrikularra hodi bat da, plano frontalean, ez horizontalean.', n('3/p3/s1'), ['erreten-aurikulubentrikularra']),
        L(0, 'Hasieran atal bentrikularra, hau da, hasierako ezkerreko bentrikulua, goi atzeko aurikula komunarekin komunikatzen du.', n('3/p5/s1', '3/p5/s2'), [
          'hasierako-ezkerreko-bentrikulua',
          'aurikula-komuna',
        ]),
        L(0.1, 'Hiru prozesu daude. Lehena: bi atalen arteko ertza, hasieran zorrotza, gero eta zapalagoa egiten da.', n('3/p6/s1'), ['ertz-bulbobentrikularra']),
        L(
          0.2,
          'Bigarrena: erretena eskuinerantz mugitzen da, eta bi hasierako bentrikuluak goian dagoen aurikularekin komunikatzen ditu.',
          n('3/p7/s1'),
          ['erreten-aurikulubentrikularra', 'hasierako-eskuineko-bentrikulua', 'hasierako-ezkerreko-bentrikulua'],
          { tone: 'emphasis', writes: 'b-eskuinera' },
        ),
        L(0.31, 'Kontuz: erretena plano frontalean dago, ez horizontalean.', n('3/p8/s2'), ['erreten-aurikulubentrikularra'], { tone: 'caution' }),
        L(0.41, 'Hirugarrena: erretenaren ertzetan lau kuxin sortzen dira: goikoa edo dortsala, behekoa eta bi alboetakoak.', n('3/p9/s1', '3/p9/s2'), [
          'goiko-kuxina',
          'beheko-kuxina',
          'alboko-kuxinak',
        ]),
        L(
          0.52,
          'Goikoa eta behekoa hurbildu eta fusionatzen dira, eta erretena bi zulotan banatzen da: eskuineko eta ezkerreko zulo aurikulubentrikularrak.',
          n('3/p9/s2', '3/p9/s3', '3/p10/s1'),
          ['goiko-kuxina', 'beheko-kuxina', 'eskuineko-zulo-ab', 'ezkerreko-zulo-ab'],
          {
            tone: 'emphasis',
            writes: 'b-zuloak',
          },
        ),
        L(0.63, 'Zuloak plano frontalean daudelako, kuxin horiei goikoa eta behekoa deitzen zaie.', n('3/p10/s3'), ['zulo-aurikulubentrikularrak', 'goiko-kuxina', 'beheko-kuxina'], { tone: 'why' }),
        L(
          0.74,
          'Atal bulbarrean azpiatalak bereizten dira: enbor arteriosoa, arteria konoa eta hurbileko atala, eskuineko bentrikuluaren jatorria.',
          n('3/p4/s1'),
          ['atal-bulbarra', 'enbor-arteriosoa', 'arteria-konoa', 'bulboaren-hurbileko-atala'],
          { tone: 'recall' },
        ),
        L(
          0.74,
          'Albotik ikusita: atal bulbarra aurrean dago, aurrera, behera eta eskuinera abiatuta; atal bentrikularra haren ezkerrean.',
          n('3/p11/s1', '3/p12/s1', '3/p13/s1', '3/p14/s1'),
          ['atal-bulbarra', 'atal-bentrikularra'],
          { tone: 'emphasis' },
        ),
        L(0.74, 'Atal aurikularra eta zain sinua, berriz, atal bulbarraren atzean daude, eta jarraiak dira.', n('3/p15/s1'), ['atal-aurikularra', 'zain-sinua', 'atal-bulbarra']),
        L(0.74, 'Kontuz: apunteek haien norabidea bi eratara idazten dute: gora, atzera eta ezkerrera, edo gora, aurrera eta atzera.', n('3/p11/s3', '3/p15/s1'), [], { tone: 'caution' }),
        L(0.88, 'Bi hasierako bentrikuluen arteko komunikazioari bentrikulu arteko zulo primarioa deitzen zaio.', n('3/p16/s1'), ['bentrikulu-arteko-zulo-primarioa'], { writes: 'b-zulo-primarioa' }),
      ],
      board: [
        {
          id: 'b-eskuinera',
          kind: 'line',
          text: 'Erretena eskuinerantz: bi bentrikuluak aurikularekin komunikatuta',
          notes: n('3/p7/s1'),
        },
        {
          id: 'b-zuloak',
          kind: 'line',
          text: '4 kuxin; goikoa eta behekoa fusionatu: eskuineko eta ezkerreko zulo aurikulubentrikularrak (plano frontalean)',
          notes: n('3/p9/s1', '3/p9/s3', '3/p10/s1', '3/p10/s3'),
          key: true,
        },
        {
          id: 'b-zulo-primarioa',
          kind: 'line',
          text: 'Bentrikulu arteko zulo primarioa: bi hasierako bentrikuluen arteko komunikazioa',
          notes: n('3/p16/s1'),
        },
      ],
      checks: [
        { kind: 'pool', id: 'mikro:11/erreten-ab:2', after: 3 },
        {
          kind: 'contrast',
          id: 'klasea:11/zulo-ab',
          concept: 'zulo-aurikulubentrikularrak',
          q: 'Eskuineko eta ezkerreko zulo aurikulubentrikularrak: zer komunikatzen du bakoitzak?',
          options: [
            'Eskuinekoak eskuineko aurikula eta bentrikulua; ezkerrekoak ezkerrekoak',
            'Eskuinekoak eskuineko aurikula eta ezkerreko bentrikulua',
            'Biek aurikula biak bentrikulu bakarrarekin',
            'Bi bentrikuluak elkarren artean',
          ],
          answer: 0,
          why: [
            'Bai: aurikula bakoitza bere bentrikuluarekin.',
            'Ez: aurikula bakoitza alde bereko bentrikuluarekin komunikatzen da.',
            'Ez: zulo bakoitzak aurikula bat eta bentrikulu bat komunikatzen ditu.',
            'Ez: hori bentrikulu arteko zulo primarioa da.',
          ],
          notes: n('3/p10/s2', '3/p16/s1'),
        },
      ],
    },

    {
      id: 'balbulak',
      title: 'Balbula aurikulubentrikularrak',
      stage: 'balbula-ab',
      lines: [
        L(0, 'Zulo horien inguruan mesenkima goraguneak sortzen dira, kuxinetatik: hortik balbula aurikulubentrikularrak.', n('3/p17/s1', '3/p17/s3'), ['balbula-aurikulubentrikularrak']),
        L(
          0.15,
          'Eskuineko zuloan balbula trikuspidea dago, hiru balbarekin; ezkerrekoan, bikuspidea edo mitrala, bi balbarekin.',
          n('3/p18/s1', '3/p19/s1'),
          ['balbula-trikuspidea', 'balbula-mitrala'],
          { tone: 'emphasis', writes: 'b-ab-balbulak' },
        ),
        L(0.31, 'Kontuan hartu: zuloetatik pasatzen den odolak goraguneen azalera bentrikularra zulatzen du, eta balbak mehetzen dira.', n('3/p20/s1'), ['balbula-trikuspidea', 'balbula-mitrala'], {
          tone: 'caution',
        }),
        L(0.47, 'Balbak muskulu papilarrei lotuta geratzen dira, soka tendinosoen bidez: hasieran muskularrak, gero fibrotsuak.', n('3/p21/s1'), ['muskulu-papilarrak', 'soka-tendinosoak'], {
          tone: 'emphasis',
          writes: 'b-sokak',
        }),
        L(0.65, 'Muskulu papilarrak uzkurtzean, sokek balbak mugitzen dituzte: zuloa ireki edo itxi egiten da, odola pasa dadin.', n('3/p21/s3'), ['muskulu-papilarrak', 'soka-tendinosoak'], {
          tone: 'why',
        }),
        L(0.81, 'Hiru soka mota daude: lehen, bigarren eta hirugarren mailakoak, balbetan non insertatzen diren arabera.', n('3/p22/s1', '3/p22/s2'), ['soka-tendinosoak']),
      ],
      board: [
        {
          id: 'b-ab-balbulak',
          kind: 'line',
          text: 'Eskuinean trikuspidea (hiru balba); ezkerrean bikuspidea edo mitrala (bi balba)',
          notes: n('3/p18/s1', '3/p19/s1'),
          key: true,
        },
        {
          id: 'b-sokak',
          kind: 'line',
          text: 'Soka tendinosoak: balbetatik muskulu papilarretara; hasieran muskularrak, gero fibrotsuak',
          notes: n('3/p21/s1'),
        },
      ],
      checks: [
        {
          kind: 'contrast',
          id: 'klasea:11/trikuspide-mitral',
          concept: 'balbula-mitrala',
          after: 1,
          q: 'Bi zulo aurikulubentrikularren balbulak: zein dago bakoitzean?',
          options: ['Eskuinean trikuspidea, hiru balbarekin; ezkerrean mitrala, birekin', 'Eskuinean mitrala, birekin; ezkerrean trikuspidea, hirurekin', 'Bietan trikuspidea', 'Bietan mitrala'],
          answer: 0,
          why: ['Bai: eskuinean hiru balba, ezkerrean bi.', 'Ez: alderantziz da.', 'Ez: ezkerrekoak bi balba ditu, mitrala.', 'Ez: eskuinekoak hiru balba ditu, trikuspidea.'],
          notes: n('3/p18/s1', '3/p19/s1'),
        },
        { kind: 'pool', id: 'mikro:11/balbula-ab:3' },
      ],
    },

    {
      id: 'bentrikuluak',
      title: 'Bentrikuluen trenkada',
      stage: 'bentrikulu-arteko-trenkada',
      lines: [
        L(0, 'Gogoratu: hasierako eskuineko bentrikulua bulbotik dator, eta ezkerrekoa atal bentrikularretik.', n('4/p3/s1'), ['hasierako-eskuineko-bentrikulua', 'hasierako-ezkerreko-bentrikulua'], {
          tone: 'recall',
        }),
        L(0.17, 'Aurikulak bentrikuluen atzean daude; eta eskuineko bentrikulua ezkerrekoa baino pixka bat aurrerago.', n('4/p4/s1', '4/p4/s2'), ['hasierako-eskuineko-bentrikulua'], {
          tone: 'emphasis',
          writes: 'b-aurrerago',
        }),
        L(0.34, '4. astearen bukaeran, bentrikuluen paretetan muskulu trenkadak agertzen dira, eta muskulu papilarrak.', n('4/p5/s2'), ['muskulu-trenkadak', 'muskulu-papilarrak']),
        L(0.5, 'Bentrikuluak handitzen dira, eta haien barneko paretak hurbildu egiten dira: hortik trenkada muskularra.', n('4/p6/s1', '4/p6/s2'), ['trenkada-muskularra'], { tone: 'why' }),
        L(0.5, 'Trenkada hau ez da osoa: haren goiko aldetik, odola eskuineko bentrikulutik ezkerrekora pasa daiteke.', n('4/p6/s3'), ['trenkada-muskularra', 'bentrikulu-arteko-zulo-primarioa'], {
          tone: 'emphasis',
          writes: 'b-ez-osoa',
        }),
        L(0.72, 'Arteria konoa trenkadatzean, bigarren trenkada bat agertzen da, ez muskularra: mintzezko trenkada.', n('4/p6/s4'), ['arteria-konoa', 'mintzezko-trenkada'], { tone: 'emphasis' }),
        L(
          0.72,
          'Beraz, trenkada horrek bi atal ditu: muskularra eta mintzezkoa; eta bentrikuluak guztiz banatuta geratzen dira.',
          n('4/p7/s1', '4/p6/s5'),
          ['trenkada-muskularra', 'mintzezko-trenkada'],
          { tone: 'summary', writes: 'b-bi-atal' },
        ),
      ],
      board: [
        {
          id: 'b-aurrerago',
          kind: 'line',
          text: 'Aurikulak bentrikuluen atzean; eskuineko bentrikulua pixka bat aurrerago',
          notes: n('4/p4/s1', '4/p4/s2'),
        },
        {
          id: 'b-ez-osoa',
          kind: 'line',
          text: 'Trenkada muskularra ez da osoa: goitik odola eskuinetik ezkerrera',
          notes: n('4/p6/s3'),
          key: true,
        },
        {
          id: 'b-bi-atal',
          kind: 'line',
          text: 'Bentrikulu arteko trenkada: zati muskularra eta mintzezkoa',
          notes: n('4/p7/s1'),
          key: true,
        },
      ],
      checks: [
        { kind: 'pool', id: 'mikro:11/bentrikulu-arteko-trenkada:3', after: 4 },
        {
          kind: 'contrast',
          id: 'klasea:11/muskular-mintzezko',
          concept: 'mintzezko-trenkada',
          q: 'Bentrikulu arteko trenkadaren bi atalak: nondik dator bakoitza?',
          options: [
            'Muskularra barneko paretak hurbilduta; mintzezkoa arteria konoaren trenkadaren beheko aldetik',
            'Muskularra arteria konoaren trenkadatik; mintzezkoa barneko paretetatik',
            'Biak endokardio kuxinetatik',
            'Biak barneko pareta muskularretatik',
          ],
          answer: 0,
          why: [
            'Bai: zati muskularra paretetatik, mintzezkoa konoaren trenkadatik.',
            'Ez: alderantziz da.',
            'Ez: zati muskularra barneko paretetatik dator.',
            'Ez: mintzezkoa ez da muskularra; konoaren trenkadatik dator.',
          ],
          notes: n('4/p6/s2', '4/p6/s4'),
        },
      ],
    },

    {
      id: 'konoa',
      title: 'Arteria konoa',
      stage: 'arteria-konoa',
      lines: [
        L(0, 'Orain irteerak. Atal bulbarrean kiribil formako trenkadak sortzen dira.', n('5/p3/s1'), ['atal-bulbarra'], { tone: 'emphasis' }),
        L(0, 'Bentrikuluetan bi atal bereizten dira: atal trabekulatua, muskuluekin, eta atal lisoa, arteriak irteteko.', n('5.1/p3/s1')),
        L(0.16, 'Arteria konoaren alboko paretetan bi endokardio kuxin agertzen dira: atze eskuinean eta aurre ezkerrean.', n('5.1/p5/s2'), ['arteria-konoa', 'konoaren-gandorrak'], {
          tone: 'emphasis',
          writes: 'b-kono-gandorrak',
        }),
        L(0.34, 'Bi gandorrak hazi eta fusionatzen dira: arteria konoa trenkadatu egiten da, eta trenkada laprana da.', n('5.1/p5/s3', '5.1/p5/s4'), ['arteria-konoa', 'konoaren-trenkada']),
        L(0.34, 'Kontuz: apunteen hurrengo esaldiak gandorren aldeak alderantziz idazten ditu; gogoratu atze eskuinean eta aurre ezkerrean.', n('5.1/p5/s2', '5.1/p5/s4'), [], { tone: 'caution' }),
        L(0.52, 'Trenkadaren aurre eskuinaldean eskuineko bentrikuluaren infundibulua geratzen da: hortik birika arteria irtengo da.', n('5.1/p5/s5'), ['eskuineko-infundibulua'], {
          tone: 'emphasis',
        }),
        L(0.52, 'Atze ezkerrekoa ezkerreko bentrikuluaren infundibulua da: hortik aorta.', n('5.1/p5/s6'), ['ezkerreko-infundibulua']),
        L(
          0.52,
          'Biak ez daude plano berean: eskuinekoa askoz aurrerago eta eskuinerago dago. Beraz, birika arteria eta aorta ere ez.',
          n('5.1/p5/s7', '5.1/p5/s8'),
          ['eskuineko-infundibulua', 'ezkerreko-infundibulua'],
          { tone: 'emphasis', writes: 'b-infundibuluak' },
        ),
        L(0.74, 'Konoaren trenkada behetik hazten da, eta trenkada muskularrarekin eta beheko kuxinarekin fusionatzen da: hori da mintzezko zatia.', n('5.1/p6/s1', '5.1/p6/s2'), [
          'konoaren-trenkada',
          'trenkada-muskularra',
          'beheko-kuxina',
          'mintzezko-trenkada',
        ]),
      ],
      board: [
        {
          id: 'b-kono-gandorrak',
          kind: 'line',
          text: 'Konoan bi gandor: atze-eskuinean eta aurre-ezkerrean; fusionatu, trenkada laprana',
          notes: n('5.1/p5/s2', '5.1/p5/s3'),
          key: true,
        },
        {
          id: 'b-infundibuluak',
          kind: 'line',
          text: 'Aurre-eskuinean eskuineko infundibulua (birika arteria); atze-ezkerrean ezkerrekoa (aorta)',
          notes: n('5.1/p5/s5', '5.1/p5/s6'),
          key: true,
        },
      ],
      checks: [
        { kind: 'pool', id: 'mikro:11/arteria-konoa:3', after: 5 },
        {
          kind: 'contrast',
          id: 'klasea:11/infundibuluak',
          concept: 'eskuineko-infundibulua',
          q: 'Bi infundibuluak: non dago bakoitza, eta zer irteten da hortik?',
          options: [
            'Eskuinekoa aurre-eskuinean, birika arteria; ezkerrekoa atze-ezkerrean, aorta',
            'Eskuinekoa atze-ezkerrean, aorta; ezkerrekoa aurre-eskuinean, birika arteria',
            'Biak plano berean, aurrean',
            'Eskuinekoa aurre-eskuinean, aorta; ezkerrekoa atze-ezkerrean, birika arteria',
          ],
          answer: 0,
          why: [
            'Bai: eskuinekoa aurrerago eta eskuinerago dago, eta hortik birika arteria irteten da.',
            'Ez: alderantziz da.',
            'Ez: ez daude plano berean.',
            'Ez: eskuineko infundibulutik birika arteria irteten da.',
          ],
          notes: n('5.1/p5/s5', '5.1/p5/s6', '5.1/p5/s7'),
        },
      ],
    },

    {
      id: 'enborra',
      title: 'Enbor arteriosoa',
      stage: 'enbor-arteriosoa',
      lines: [
        L(0, 'Orain enbor arteriosoa. Hemen ere trenkada bat sortzen da, eta enborra bitan banatzen du.', n('5.2/p3/s1', '5.2/p3/s2'), ['enbor-arteriosoa']),
        L(
          0.1,
          'Bi gandor hurbildu eta hazi egiten dira; baina toki desberdinetan finkatzen direnez, trenkada kiribila da.',
          n('5.2/p3/s5', '5.2/p3/s6'),
          ['enborraren-gandorrak', 'trenkada-aortikopulmonarra'],
          {
            tone: 'emphasis',
            writes: 'b-kiribila',
            plain: 'Gandorrak hormaren inguruan biratzen dira; horregatik trenkadak ere biratzen du.',
          },
        ),
        L(0.22, 'Kiribila denez, trenkadaren kokapena desberdina da enborraren maila bakoitzean.', n('5.2/p3/s8'), ['trenkada-aortikopulmonarra'], { tone: 'why' }),
        L(0.22, 'Hurbileko mailan, behean, trenkada zeharkakoa da: aurrean birika arteria dago, eta atzean aorta.', n('5.2/p4/s1', '5.2/p4/s2'), ['birika-arteria', 'aorta'], { tone: 'emphasis' }),
        L(0.35, 'Gorago, tarteko mailan, trenkada aurretik atzera doa: aorta eskuinean dago, eta birika arteria ezkerrean.', n('5.2/p5/s1'), ['aorta', 'birika-arteria'], { tone: 'emphasis' }),
        L(0.47, 'Urrutiko mailan, goian, berriro zeharkakoa da: orain aorta aurrean dago, eta birika arteria atzean.', n('5.2/p6/s1'), ['aorta', 'birika-arteria'], { tone: 'emphasis' }),
        L(0.47, 'Hala, trenkadak bi erretenetan banatzen du enborra, eta bi hodien kokapena aldatzen da mailaz maila.', n('5.2/p7/s2'), [], { hold: 1 }),
        L(0.59, 'Behean, trenkada kiribil hau konoaren trenkadarekin fusionatzen da: jarraiak dira.', n('5.2/p8/s1'), ['trenkada-aortikopulmonarra', 'konoaren-trenkada'], {
          tone: 'emphasis',
          writes: 'b-jarraiak',
        }),
        L(0.59, 'Fusioaren ondorioz, bentrikuluen arteko mintzezko zatia sortzen da.', n('5.2/p8/s3'), ['mintzezko-trenkada']),
        L(0.59, 'Beraz, birika arteria aurretik irteten da, eskuineko bentrikulutik; aorta, berriz, atzetik, ezkerrekotik.', n('5.2/p8/s4', '5.2/p8/s5'), ['birika-arteria']),
        L(0.72, 'Bihotza apur bat biratuta dago: eskuineko bentrikulua ezkerrekoa baino aurrerago.', n('5.2/p9/s1')),
        L(0.72, 'Laburbilduz: behean birika arteria aortaren aurrean, tartean parean, eta goian aorta aurrean.', n('5.2/p9/s3'), ['birika-arteria', 'aorta'], {
          tone: 'summary',
          writes: 'b-mailak',
          hold: 1.5,
        }),
        L(0.86, 'Eta paretak: bentrikuluen atal trabekulatuak hasierako bentrikuluetatik datoz, eta atal lisoak konotik.', n('5.2/p10/s2'), [], { tone: 'summary', writes: 'tz-bentrikuluak' }),
      ],
      board: [
        {
          id: 'b-kiribila',
          kind: 'line',
          text: 'Enborraren bi gandor: trenkada aortiko-pulmonar kiribila',
          notes: n('5.2/p3/s5'),
        },
        {
          id: 'b-mailak',
          kind: 'line',
          text: 'Hurbilean birika arteria aurrean · tartean aorta eskuinean · urrutian aorta aurrean',
          notes: n('5.2/p4/s1', '5.2/p5/s1', '5.2/p6/s1', '5.2/p9/s3'),
          key: true,
        },
        {
          id: 'b-jarraiak',
          kind: 'line',
          text: 'Trenkada kiribila konoaren trenkadarekin jarraia; fusioz mintzezko zatia',
          notes: n('5.2/p8/s1', '5.2/p8/s3'),
        },
      ],
      checks: [
        {
          kind: 'predict',
          after: 1,
          q: 'Zer uste duzu: trenkada kiribila bada, aorta beti alde berean egongo da?',
          options: ['Ez: mailaren arabera tokiz aldatzen da', 'Bai, beti atzean', 'Bai, beti eskuinean'],
          answer: 0,
          why: ['Bai: maila bakoitzean beste toki batean dago.', 'Ez: hurbilean atzean dago, baina goian aurrean.', 'Ez: tartean bakarrik dago eskuinean.'],
          notes: n('5.2/p4/s1', '5.2/p5/s1', '5.2/p7/s2'),
        },
        { kind: 'pool', id: 'mikro:11/enbor-arteriosoa:3', after: 4 },
        {
          kind: 'contrast',
          id: 'klasea:11/hurbil-urrun',
          concept: 'trenkada-aortikopulmonarra',
          after: 6,
          q: 'Enborraren hurbileko eta urrutiko mailak: zein dago aurrean bakoitzean?',
          options: ['Hurbilean birika arteria; urrutian aorta', 'Hurbilean aorta; urrutian birika arteria', 'Bietan aorta', 'Bietan birika arteria'],
          answer: 0,
          why: ['Bai: trenkada biratzen da, eta hodiak tokiz aldatzen dira.', 'Ez: alderantziz da.', 'Ez: hurbilean birika arteria dago aurrean.', 'Ez: urrutian aorta dago aurrean.'],
          notes: n('5.2/p4/s1', '5.2/p6/s1'),
        },
      ],
    },

    {
      id: 'semilunarrak',
      title: 'Balbula semilunarrak',
      stage: 'balbula-semilunarrak',
      lines: [
        L(0, 'Bi arteria horien hasieran balbula semilunarrak agertzen dira, kuxinetatik: aorta balbula eta birika balbula.', n('5.2/p12/s1'), [
          'balbula-semilunarrak',
          'aorta-balbula',
          'birika-balbula',
        ]),
        L(0.1, 'Hiru gandor agertzen dira, eta haien goikaldean goraguneak, tuberkuluak. Gero goiko aldetik zulatzen dira.', n('5.2/p12/s6'), ['balbula-semilunarrak']),
        L(0.25, 'Horregatik balbak bereziak dira: enara kabiko forma dute, eta ahurrak dira, goitik zulatuta.', n('5.2/p12/s3'), ['aorta-balbula', 'birika-balbula'], {
          tone: 'emphasis',
          writes: 'b-enara',
        }),
        L(0.5, 'Trikuspideak dira: aortan bi alboko balba eta atzeko bat; birika balbulan bi alboko eta aurreko bat.', n('5.2/p12/s2'), ['aorta-balbula', 'birika-balbula'], {
          tone: 'emphasis',
          writes: 'b-trikuspideak',
        }),
        L(0.73, 'Aorta balbularen eskuineko eta ezkerreko balben sinuetatik arteria koronarioak irteten dira: aortaren lehen adarrak.', n('5.2/p12/s4'), ['aorta-balbula', 'arteria-koronarioak'], {
          tone: 'emphasis',
          writes: 'b-koronarioak',
        }),
        L(0.73, 'Arteria koronarioek bihotzaren miokardioa irrigatzen dute.', n('5.2/p12/s5'), ['arteria-koronarioak']),
      ],
      board: [
        {
          id: 'b-enara',
          kind: 'line',
          text: 'Balba semilunarrak: enara kabiko forma, ahurrak (goitik zulatuta)',
          notes: n('5.2/p12/s3'),
        },
        {
          id: 'b-trikuspideak',
          kind: 'line',
          text: 'Aorta: bi alboko eta atzeko bat. Birika: bi alboko eta aurreko bat',
          notes: n('5.2/p12/s2'),
          key: true,
        },
        {
          id: 'b-koronarioak',
          kind: 'line',
          text: 'Koronarioak: aorta balbularen eskuineko eta ezkerreko sinuetatik; aortaren lehen adarrak',
          notes: n('5.2/p12/s4'),
          key: true,
        },
      ],
      checks: [
        {
          kind: 'contrast',
          id: 'klasea:11/aorta-birika-balbula',
          concept: 'aorta-balbula',
          after: 3,
          q: 'Aorta balbula eta birika balbula: zein da bakoitzaren alboko ez den balba?',
          options: ['Aortan atzekoa; birika balbulan aurrekoa', 'Aortan aurrekoa; birika balbulan atzekoa', 'Bietan atzekoa', 'Bietan aurrekoa'],
          answer: 0,
          why: ['Bai: aortan bi alboko eta atzeko bat; birikan bi alboko eta aurreko bat.', 'Ez: alderantziz da.', 'Ez: birika balbulan aurrekoa da.', 'Ez: aortan atzekoa da.'],
          notes: n('5.2/p12/s2'),
        },
        { kind: 'pool', id: 'w11-q-koronarioak' },
      ],
    },

    {
      id: 'amaiera',
      title: 'Osatu taula',
      stage: 'balbula-semilunarrak',
      lines: [L(0.9, 'Azken zatia: taula osatu oroimenetik, eta gero zenbait galdera, gai osoko zatiak nahastuta.', n('5.2/p10/s1'), [], { tone: 'summary' })],
      checks: [
        {
          kind: 'fill',
          id: 'klasea:11/taula',
          table: 'taula',
          blanks: ['tz-esk-aurikula', 'tz-ezk-aurikula', 'tz-bentrikuluak'],
        },
        { kind: 'pool', id: 'w11-q-kuxin-ab' },
        { kind: 'pool', id: 'w11-q-aorta-infundibulua' },
      ],
    },
  ],
};
