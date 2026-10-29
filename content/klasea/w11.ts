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
    'Jatorriak: bihotz hodiaren atal bakoitza bihotz osoan',
  ],
  chunks: [
    {
      id: 'gaur',
      title: 'Gaur',
      stage: 'trenkadatze-mekanismoak',
      lines: [
        L(0, 'Kaixo! Gaur bihotzaren barrunbeak nola banatzen diren ikasiko dugu: trenkadak.', n('1/p3/s1'), [], { plain: 'Gaurko gaia: bihotzaren barruko hutsuneak hormekin nola banatzen diren. Horma horiei trenkada deitzen diegu.' }),
        L(0, 'Hasieran zuzena zen bihotz hodia tolestu egiten da, eta lakio bat sortzen da.', n('1/p3/s1'), [], { tone: 'recall', plain: 'Bihotza hasieran hodi zuzen bat da. Hodi hori bere buruaren gainean tolesten da, eta forma horri lakioa deitzen diogu.' }),
        // For a student starting from zero: the loop's parts, then what the septa are for.
        L(0, 'Lakioaren atalak: atal bulbarra, atal bentrikularra, atal aurikularra eta zain sinua.', n('1/p3/s2'), [
          'atal-bulbarra',
          'atal-bentrikularra',
          'atal-aurikularra',
          'zain-sinua',
        ], { plain: 'Hodi tolestuak zati batzuk ditu, bakoitza bere izenarekin: atal bulbarra, atal bentrikularra, atal aurikularra eta zain sinua.' }),
        L(0, 'Barrunbeetan trenkadak sortzen dira: hala eratzen dira aurikulak eta bentrikuluak.', n('1/p3/s4'), [], { tone: 'why', plain: 'Trenkada horma bat da: barrunbe bat bitan banatzen du. Horrela sortzen dira behin betiko aurikulak eta bentrikuluak.' }),
        L(0.11, 'Trenkadatzea 27. eta 37. egunen artean gertatzen da: 4. eta 5. asteetan, gutxi gorabehera.', n('1/p4/s1'), [], { tone: 'emphasis', writes: 'b-noiz', plain: 'Hau guztia oso azkar gertatzen da: 27. egunetik 37. egunera, hau da, 4. eta 5. asteetan.' }),
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
        L(0.22, 'Lehen mekanismoa: barrunbearen paretan goraguneak agertzen dira, endokardio kuxinak.', n('1/p5/s1'), ['endokardio-kuxinak'], { plain: 'Lehen modua: barrunbearen hormatik koskor bigun batzuk ateratzen dira. Koskor horiei endokardio kuxinak deitzen zaie.' }),
        L(0.22, 'Kuxinaren erdigunean zelula kanpoko matrizea dago, eta endokardioak estaltzen du.', n('1/p5/s2'), ['kuxinaren-matrizea', 'endokardioa'], { tone: 'emphasis', writes: 'b-kuxina', plain: 'Kuxin bakoitzaren barruan betegarri bat dago, zelula kanpoko matrizea, eta endokardioak azal batek bezala estaltzen du.' }),
        L(0.35, 'Aurkako paretan gauza bera gertatzen bada, bi kuxinak hazi eta hurbildu egiten dira, fusionatu arte: trenkada bat.', n('1/p5/s3'), ['endokardio-kuxinak'], {
          tone: 'emphasis',
          writes: 'b-mek1',
          plain: 'Parez pare dauden bi hormetan kuxin bana sortzen bada, biak hazten dira, elkar ukitzen dute eta bat egiten dute: horma osoa.',
        }),
        L(0.5, 'Beste batzuetan kuxin bakarra sortzen da, eta kontrako paretara iritsi arte luzatzen da.', n('1/p5/s4', '1/p5/s5'), ['endokardio-kuxinak'], { plain: 'Beste batzuetan kuxin bakarra dago: hazten eta hazten doa, beste hormara iritsi arte.' }),
        L(0.63, 'Bigarren mekanismoa bentrikuluetan ikusten da: hasieran bi hasierako bentrikulu daude, eskuinean eta ezkerrean.', n('1/p6/s1'), [
          'hasierako-eskuineko-bentrikulua',
          'hasierako-ezkerreko-bentrikulua',
        ], { plain: 'Bigarren modua bentrikuluetan ikusiko dugu. Hasieran bi bentrikulu txiki daude, bata eskuinean eta bestea ezkerrean.' }),
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
        L(0, 'Hasi gaitezen aurikulekin. Aurikulan bi alboko zabalkuntza daude, baina trenkada bat sortu behar da.', n('2.1/p3/s1'), ['hasierako-eskuineko-aurikula', 'hasierako-ezkerreko-aurikula'], { plain: 'Aurikula hasieran barrunbe bakarra da, bi aldeetara puztua. Bi aurikula izateko, horma bat behar da haien artean.' }),
        L(0.14, '4. astearen amaieran, sabaian, lehen trenkada sortzen da: septum primuma, endokardio goragune bat.', n('2.1/p3/s4'), ['septum-primum'], { tone: 'emphasis', writes: 'b-primum', plain: '4. astearen bukaeran, aurikularen sabaitik lehen horma hasten da hazten: septum primuma.' }),
        L(0.46, 'Erretenaren inguruan bi kuxin agertzen dira: bat goikoa, eta bestea behekoa.', n('2.1/p4/s1', '2.1/p3/s5'), ['kuxin-aurikulubentrikularrak'], { plain: 'Erretenaren inguruan, hau da, aurikulatik bentrikulura doan pasabidean, bi kuxin sortzen dira: goikoa eta behekoa.' }),
        L(0.58, 'Septum primumaren beheko aldean zulo bat geratzen da: ostium primuma. Hortik odola eskuinetik ezkerrera igarotzen da.', n('2.1/p4/s2'), ['septum-primum', 'ostium-primuma'], {
          tone: 'emphasis',
          writes: 'b-ostium1',
          plain: 'Septum primuma ez da behera osorik iristen: azpian zulo bat uzten du, ostium primuma. Odola zulo horretatik pasatzen da.',
        }),
        L(0.7, 'Itxi aurretik, septum primumaren goiko aldean beste zulo bat irekitzen da: ostium secunduma.', n('2.1/p4/s4'), ['septum-primum', 'ostium-secunduma'], { tone: 'emphasis', plain: 'Zulo hori itxi baino lehen, septum primumaren goialdean bigarren zulo bat zabaltzen da: ostium secunduma.' }),
        L(0.7, 'Horrela, odolak eskuineko aurikulatik ezkerrekora igarotzen jarraitzen du.', n('2.1/p4/s5'), [], { tone: 'why', plain: 'Horrela, bide bat itxi baino lehen beste bat irekitzen da, eta odola eskuineko aurikulatik ezkerrekora pasatzen da.' }),
        L(0.84, 'Ostium primuma, berriz, erretenaren kuxinetatik irteten diren luzapenek ixten dute.', n('2.1/p4/s3'), ['ostium-primuma', 'kuxin-aurikulubentrikularrak'], { writes: 'b-ostium2', plain: 'Lehen zuloa, ostium primuma, kuxinek ixten dute: luzapen batzuk ateratzen zaizkie, eta zuloa estaltzen dute.' }),
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
        L(0, 'Bitartean, atzean zegoen sinua eskuineko aurikularen atzeko paretara inkorporatzen da.', n('2.2/p3/s1'), [], { plain: 'Bitartean, atzean zegoen sinua eskuineko aurikulak bereganatzen du: haren atzeko hormaren parte bihurtzen da.' }),
        L(0.12, 'Orduan, septum primumaren eskuinean, sabaitik hasita, bigarren trenkada sortzen da: septum secunduma.', n('2.2/p3/s2'), ['septum-primum', 'septum-secundum'], {
          tone: 'emphasis',
          writes: 'b-secundum',
          plain: 'Orduan bigarren horma bat hasten da sabaitik hazten, septum primumaren eskuinean, haren ondoan: septum secunduma.',
        }),
        L(0.27, 'Hau ere behera hedatzen da, baina ez da osoa: beheko aldean zulo bat du, zulo obala.', n('2.2/p3/s4'), ['septum-secundum', 'zulo-obala'], { tone: 'emphasis', plain: 'Bigarren horma hau ere behera hazten da, baina ez da bukaeraraino iristen: behean zulo bat uzten du, zulo obala.' }),
        L(
          0.55,
          'Beraz, bi trenkada daude: septum primuma, goian ostium secundumarekin, eta haren eskuinean septum secunduma, behean zulo obalarekin.',
          n('2.2/p4/s1'),
          ['septum-primum', 'ostium-secunduma', 'septum-secundum', 'zulo-obala'],
          {
            tone: 'summary',
            writes: 'b-bi-trenkada',
            hold: 1.5,
            plain: 'Laburbilduz: bi horma daude, bakoitza zulo batekin. Septum primumak goian du zuloa, ostium secunduma; septum secundumak behean, zulo obala.',
          }),
        L(0.67, 'Jaio arte, odolak bide laprana egiten du: lehenik zulo obaletik, eta gero ostium secundumatik.', n('2.2/p5/s1'), ['zulo-obala', 'ostium-secunduma'], {
          tone: 'emphasis',
          writes: 'b-laprana',
          plain: 'Jaio arte, odolak zeharka egiten du bidea: lehenik behean dagoen zulo obaletik pasatzen da, eta gero goian dagoen ostium secundumatik.',
        }),
        L(0.82, 'Liburu batzuen arabera, septum primumaren goiko ataltxoa desagertzen da, eta beheko atala zulo obalaren balbula bihurtzen da.', n('2.2/p6/s1'), [
          'septum-primum',
          'zulo-obalaren-balbula',
        ], { plain: 'Liburu batzuek diotenez, septum primumaren goiko zatia desagertu egiten da, eta beheko zatia zulo obalaren balbula bihurtzen da.' }),
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
        L(0, 'Jaiotzean birika zirkulazioa eratzen da: odola biriketara doa oxigenatzera, eta ezkerreko aurikulara itzultzen da.', n('2.2/p7/s1'), ['ezkerreko-aurikula-jaiotakoan'], { plain: 'Jaiotzean birikak lanean hasten dira: odola biriketara doa oxigenoa hartzera, eta ezkerreko aurikulara itzultzen da.' }),
        L(0.27, 'Horregatik, ezkerreko aurikulara gero eta odol gehiago iristen da, eta bertako presioa handitzen da.', n('2.2/p7/s3'), ['ezkerreko-aurikula-jaiotakoan'], { tone: 'why', plain: 'Biriketatik odol asko itzultzen denez, ezkerreko aurikula betetzen da, eta bertako presioa igotzen da.' }),
        L(0.41, 'Presio horrek zulo obalaren balbula septum secundumaren aurka bultzatzen du.', n('2.2/p7/s4'), ['zulo-obalaren-balbula', 'septum-secundum'], { tone: 'emphasis', plain: 'Presio horrek zulo obalaren balbula septum secundumaren kontra estutzen du, eta zuloa estalita geratzen da.' }),
        L(0.55, 'Bi trenkadak fusionatzen hasten dira, eta komunikazioa ixten da: jaio ondoren eta lehen urtean zehar.', n('2.2/p7/s5'), ['zulo-obalaren-balbula', 'septum-secundum'], {
          tone: 'emphasis',
          writes: 'b-ixtea',
          plain: 'Denborarekin bi hormak itsatsi egiten dira eta bat egiten dute. Hori jaio ondoren hasten da, eta lehen urtean zehar jarraitzen du.',
        }),
        L(0.71, 'Kontuz: kasuen ehuneko hogeian fusioa ez da osoa, eta arraildura txiki bat geratzen da eskuinetik ezkerrera.', n('2.2/p7/s6'), ['zulo-obala'], { tone: 'caution', plain: 'Kontuz: bost haurretatik batean hormak ez dira guztiz itsasten, eta zirrikitu txiki bat irekita geratzen da eskuinetik ezkerrera.' }),
        L(0.85, 'Orduan, ezkerreko aurikulan odol oxigenatua eta zain odola nahasten dira: jaioberria urdinxka da, zianosia.', n('2.2/p7/s7', '2.2/p7/s8'), ['ezkerreko-aurikula-jaiotakoan'], {
          tone: 'why',
          writes: 'b-zianosia',
          plain: 'Orduan oxigeno askoko odola eta oxigeno gutxiko odola nahasten dira, eta jaioberriak kolore urdinxka hartzen du: zianosia.',
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
        L(0, 'Orain paretak. Aurikula komuna atzean dagoen zain sinuarekin komunikatuta dago, zulo baten bidez.', n('2.2/p8/s1'), ['zain-sinua'], { plain: 'Orain aurikulen hormak. Hasieran aurikula atzeko zain sinuarekin lotuta dago, zulo baten bidez.' }),
        L(0.12, 'Zain sinua eskuineko aurikularen atzeko paretara inkorporatzen da: atzeko pareta lisoa sortzen da.', n('2.2/p8/s2', '2.2/p9/s1'), ['zain-sinua', 'atal-lisoa'], { tone: 'emphasis', plain: 'Zain sinua eskuineko aurikulak bereganatzen du: haren atzeko horma bihurtzen da, eta horma hori leuna da, lisoa.' }),
        L(0.12, 'Bertan irekitzen dira goiko eta beheko kaba zainak, eta sinu koronarioa.', n('2.2/p9/s1'), ['goiko-kaba-zaina', 'beheko-kaba-zaina', 'sinu-koronarioa'], {
          writes: 'tz-esk-aurikula',
          plain: 'Horma leun horretara iristen dira zain handiak: goiko eta beheko kaba zainak, eta sinu koronarioa.',
        }),
        L(
          0.25,
          'Gainerako pareta atal aurikularretik dator: atal trabekulatua, belarritxoa, barrutik muskulu pektinioekin.',
          n('2.2/p10/s1', '2.2/p10/s2', '2.2/p10/s3'),
          ['atal-trabekulatua', 'belarritxoa', 'muskulu-pektinioak'],
          { tone: 'emphasis', plain: 'Gainerako horma desberdina da: barrutik zimurra, muskulu pektinio txikiekin. Atal trabekulatua da, eta belarritxoa osatzen du.' }),
        L(0.37, 'Bi atalen artean gandor terminala dago, eta haren goiko aldean nodulu sinusala.', n('2.2/p11/s1'), ['gandor-terminala', 'nodulu-sinusala'], { writes: 'b-gandor', plain: 'Bi horma moten muga gandor terminala da. Haren goiko aldean nodulu sinusala dago: bihotza uzkurtzeko seinaleak sortzen ditu.' }),
        L(0.5, 'Ezkerreko aurikulan, atzeko paretatik ebaginazio bat irteten da: hasierako birika zaina.', n('2.2/p13/s1', '2.2/p13/s2'), ['birika-zain-primitiboa'], { plain: 'Ezkerreko aurikulan, atzeko hormatik hodi bat ateratzen da: hasierako birika zaina.' }),
        L(0.62, 'Lau adar ematen ditu, eta birika hastapenetako zainekin kontaktatzen du.', n('2.2/p13/s3'), ['birika-zain-primitiboa', 'birika-hastapenak'], { plain: 'Hodi hori lau adarretan banatzen da, eta adar bakoitza birika hastapenetako zainekin lotzen da.' }),
        L(
          0.76,
          'Azkenean, lau birika zain inkorporatzen dira, bi birika bakoitzetik: ezkerreko aurikularen atal lisoa osatzen dute.',
          n('2.2/p13/s4'),
          ['birika-zainak', 'ezkerreko-aurikularen-atal-lisoa'],
          { tone: 'emphasis', writes: 'tz-ezk-aurikula', plain: 'Azkenean lau birika zain sartzen dira ezkerreko aurikulan, bi birika bakoitzetik, eta haren horma leuna osatzen dute.' }),
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
        L(0, 'Orain bentrikuluak. Erreten aurikulubentrikularra hodi bat da, plano frontalean, ez horizontalean.', n('3/p3/s1'), ['erreten-aurikulubentrikularra'], { plain: 'Orain bentrikuluak. Erretena aurikula eta bentrikulua lotzen dituen hodia da. Zutik dago, bekokiaren paraleloan, ez lurraren paraleloan.' }),
        L(0, 'Hasieran atal bentrikularra, hau da, hasierako ezkerreko bentrikulua, goi atzeko aurikula komunarekin komunikatzen du.', n('3/p5/s1', '3/p5/s2'), [
          'hasierako-ezkerreko-bentrikulua',
          'aurikula-komuna',
        ], { plain: 'Hasieran pasabide horrek hasierako ezkerreko bentrikulua bakarrik lotzen du aurikula komunarekin.' }),
        L(0.1, 'Hiru prozesu daude. Lehena: bi atalen arteko ertza, hasieran zorrotza, gero eta zapalagoa egiten da.', n('3/p6/s1'), ['ertz-bulbobentrikularra'], { plain: 'Hiru gauza gertatzen dira. Lehenengoa: bi atalen arteko ertza, hasieran zorrotza, apurka leundu eta zapaldu egiten da.' }),
        L(
          0.2,
          'Bigarrena: erretena eskuinerantz mugitzen da, eta bi hasierako bentrikuluak goian dagoen aurikularekin komunikatzen ditu.',
          n('3/p7/s1'),
          ['erreten-aurikulubentrikularra', 'hasierako-eskuineko-bentrikulua', 'hasierako-ezkerreko-bentrikulua'],
          { tone: 'emphasis', writes: 'b-eskuinera', plain: 'Bigarrena: erretena eskuinerantz lerratzen da. Horrela, bi bentrikuluek dute aurikularako bidea, ez ezkerrekoak bakarrik.' }),
        L(0.31, 'Kontuz: erretena plano frontalean dago, ez horizontalean.', n('3/p8/s2'), ['erreten-aurikulubentrikularra'], { tone: 'caution', plain: 'Gogoratu: erretena zutik dago, bekokiaren paraleloan; ez lurraren paraleloan.' }),
        L(0.41, 'Hirugarrena: erretenaren ertzetan lau kuxin sortzen dira: goikoa edo dortsala, behekoa eta bi alboetakoak.', n('3/p9/s1', '3/p9/s2'), [
          'goiko-kuxina',
          'beheko-kuxina',
          'alboko-kuxinak',
        ], { plain: 'Hirugarrena: erretenaren ertzetan lau kuxin hazten dira: bat goian, bat behean, eta bat alde bakoitzean.' }),
        L(
          0.52,
          'Goikoa eta behekoa hurbildu eta fusionatzen dira, eta erretena bi zulotan banatzen da: eskuineko eta ezkerreko zulo aurikulubentrikularrak.',
          n('3/p9/s2', '3/p9/s3', '3/p10/s1'),
          ['goiko-kuxina', 'beheko-kuxina', 'eskuineko-zulo-ab', 'ezkerreko-zulo-ab'],
          {
            tone: 'emphasis',
            writes: 'b-zuloak',
            plain: 'Goiko eta beheko kuxinak elkartu egiten dira, eta erretena bi zulotan geratzen da: eskuineko eta ezkerreko zulo aurikulubentrikularrak.',
          }),
        L(0.63, 'Zuloak plano frontalean daudelako, kuxin horiei goikoa eta behekoa deitzen zaie.', n('3/p10/s3'), ['zulo-aurikulubentrikularrak', 'goiko-kuxina', 'beheko-kuxina'], { tone: 'why', plain: 'Zuloak zutik daudenez, kuxin bat goian geratzen da eta bestea behean. Horregatik goikoa eta behekoa deitzen zaie.' }),
        L(
          0.74,
          'Atal bulbarrean azpiatalak bereizten dira: enbor arteriosoa, arteria konoa eta hurbileko atala, eskuineko bentrikuluaren jatorria.',
          n('3/p4/s1'),
          ['atal-bulbarra', 'enbor-arteriosoa', 'arteria-konoa', 'bulboaren-hurbileko-atala'],
          { tone: 'recall', plain: 'Atal bulbarra hiru zatitan bereizten da: enbor arteriosoa, arteria konoa eta hurbileko atala. Azken horretatik dator eskuineko bentrikulua.' }),
        L(
          0.74,
          'Albotik ikusita: atal bulbarra aurrean dago, aurrera, behera eta eskuinera abiatuta; atal bentrikularra haren ezkerrean.',
          n('3/p11/s1', '3/p12/s1', '3/p13/s1', '3/p14/s1'),
          ['atal-bulbarra', 'atal-bentrikularra'],
          { tone: 'emphasis', plain: 'Albotik begiratuta, atal bulbarra aurrealdean dago, eta aurrera, behera eta eskuinera doa. Atal bentrikularra haren ezkerrean dago.' }),
        L(0.74, 'Atal aurikularra eta zain sinua, berriz, atal bulbarraren atzean daude, eta jarraiak dira.', n('3/p15/s1'), ['atal-aurikularra', 'zain-sinua', 'atal-bulbarra'], { plain: 'Atal aurikularra eta zain sinua atal bulbarraren atzean daude, bata bestearen jarraian.' }),
        L(0.74, 'Kontuz: apunteek haien norabidea bi eratara idazten dute: gora, atzera eta ezkerrera, edo gora, aurrera eta atzera.', n('3/p11/s3', '3/p15/s1'), [], { tone: 'caution', plain: 'Apunteetan bi bertsio daude norabide horretarako. Biak ezagutu, eta eszenan ikusten duzuna gogoratu.' }),
        L(0.88, 'Bi hasierako bentrikuluen arteko komunikazioari bentrikulu arteko zulo primarioa deitzen zaio.', n('3/p16/s1'), ['bentrikulu-arteko-zulo-primarioa'], { writes: 'b-zulo-primarioa', plain: 'Bi bentrikulu txikien artean zulo bat dago, bata bestearekin lotzen dituena: bentrikulu arteko zulo primarioa.' }),
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
        L(0, 'Zulo horien inguruan mesenkima goraguneak sortzen dira, kuxinetatik: hortik balbula aurikulubentrikularrak.', n('3/p17/s1', '3/p17/s3'), ['balbula-aurikulubentrikularrak'], { plain: 'Bi zulo horien ertzetan ehun koskorrak hazten dira, kuxinetatik. Koskor horietatik sortzen dira balbula aurikulubentrikularrak.' }),
        L(
          0.15,
          'Eskuineko zuloan balbula trikuspidea dago, hiru balbarekin; ezkerrekoan, bikuspidea edo mitrala, bi balbarekin.',
          n('3/p18/s1', '3/p19/s1'),
          ['balbula-trikuspidea', 'balbula-mitrala'],
          { tone: 'emphasis', writes: 'b-ab-balbulak', plain: 'Eskuineko zuloan hiru balbako balbula dago, balbula trikuspidea. Ezkerrekoan bi balbakoa, bikuspidea edo mitrala.' }),
        L(0.31, 'Kontuan hartu: zuloetatik pasatzen den odolak goraguneen azalera bentrikularra zulatzen du, eta balbak mehetzen dira.', n('3/p20/s1'), ['balbula-trikuspidea', 'balbula-mitrala'], {
          tone: 'caution',
          plain: 'Odolak zuloetatik pasatzean koskorrak bentrikuluko aldetik husten ditu, eta balbak gero eta meheagoak egiten dira.',
        }),
        L(0.47, 'Balbak muskulu papilarrei lotuta geratzen dira, soka tendinosoen bidez: hasieran muskularrak, gero fibrotsuak.', n('3/p21/s1'), ['muskulu-papilarrak', 'soka-tendinosoak'], {
          tone: 'emphasis',
          writes: 'b-sokak',
          plain: 'Balbak ez daude libre: soka tendinosoek muskulu papilarrei lotzen dizkiete. Soka horiek hasieran muskuluak dira, gero zuntz gogorrak.',
        }),
        L(0.65, 'Muskulu papilarrak uzkurtzean, sokek balbak mugitzen dituzte: zuloa ireki edo itxi egiten da, odola pasa dadin.', n('3/p21/s3'), ['muskulu-papilarrak', 'soka-tendinosoak'], {
          tone: 'why',
          plain: 'Muskulu papilarrak uzkurtzean sokei tira egiten diete, eta balbak mugitzen dira: zuloa zabaldu edo itxi egiten da.',
        }),
        L(0.81, 'Hiru soka mota daude: lehen, bigarren eta hirugarren mailakoak, balbetan non insertatzen diren arabera.', n('3/p22/s1', '3/p22/s2'), ['soka-tendinosoak'], { plain: 'Sokak hiru motatakoak dira, balban non lotzen diren kontuan hartuta: lehen, bigarren eta hirugarren mailakoak.' }),
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
          plain: 'Gogoratu nondik datozen: eskuineko bentrikulua bulbotik, eta ezkerrekoa atal bentrikularretik.',
        }),
        L(0.17, 'Aurikulak bentrikuluen atzean daude; eta eskuineko bentrikulua ezkerrekoa baino pixka bat aurrerago.', n('4/p4/s1', '4/p4/s2'), ['hasierako-eskuineko-bentrikulua'], {
          tone: 'emphasis',
          writes: 'b-aurrerago',
          plain: 'Aurikulak bentrikuluen atzean daude. Eta bi bentrikuluetatik, eskuinekoa pixka bat aurrerago dago.',
        }),
        L(0.34, '4. astearen bukaeran, bentrikuluen paretetan muskulu trenkadak agertzen dira, eta muskulu papilarrak.', n('4/p5/s2'), ['muskulu-trenkadak', 'muskulu-papilarrak'], { plain: '4. astearen bukaeran, bentrikuluen hormetan muskulu sareak agertzen dira, muskulu trenkadak, eta muskulu papilarrak ere bai.' }),
        L(0.5, 'Bentrikuluak handitzen dira, eta haien barneko paretak hurbildu egiten dira: hortik trenkada muskularra.', n('4/p6/s1', '4/p6/s2'), ['trenkada-muskularra'], { tone: 'why', plain: 'Bentrikuluak puztu egiten dira, eta haien arteko hormak elkarrengana hurbiltzen dira: horrela sortzen da trenkada muskularra.' }),
        L(0.5, 'Trenkada hau ez da osoa: haren goiko aldetik, odola eskuineko bentrikulutik ezkerrekora pasa daiteke.', n('4/p6/s3'), ['trenkada-muskularra', 'bentrikulu-arteko-zulo-primarioa'], {
          tone: 'emphasis',
          writes: 'b-ez-osoa',
          plain: 'Horma muskular hau ez da goraino iristen: goian zulo bat geratzen da, eta odola eskuinetik ezkerrera pasa daiteke.',
        }),
        L(0.72, 'Arteria konoa trenkadatzean, bigarren trenkada bat agertzen da, ez muskularra: mintzezko trenkada.', n('4/p6/s4'), ['arteria-konoa', 'mintzezko-trenkada'], { tone: 'emphasis', plain: 'Arteria konoa banatzen denean, beste horma mehe bat agertzen da, ez muskularra: mintzezko trenkada.' }),
        L(
          0.72,
          'Beraz, trenkada horrek bi atal ditu: muskularra eta mintzezkoa; eta bentrikuluak guztiz banatuta geratzen dira.',
          n('4/p7/s1', '4/p6/s5'),
          ['trenkada-muskularra', 'mintzezko-trenkada'],
          { tone: 'summary', writes: 'b-bi-atal', plain: 'Beraz, bentrikuluen arteko horma bi zatiz egina dago, muskularra eta mintzezkoa. Biak elkartzean, bentrikuluak guztiz banatuta geratzen dira.' }),
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
        L(0, 'Orain irteerak. Atal bulbarrean kiribil formako trenkadak sortzen dira.', n('5/p3/s1'), ['atal-bulbarra'], { tone: 'emphasis', plain: 'Orain bihotzetik irteten diren hodiak. Atal bulbarrean horma bihurrituak sortzen dira, kiribil formakoak.' }),
        L(0, 'Bentrikuluetan bi atal bereizten dira: atal trabekulatua, muskuluekin, eta atal lisoa, arteriak irteteko.', n('5.1/p3/s1'), [], { plain: 'Bentrikulu bakoitzak bi zati ditu: bata zimurra, muskuluz betea, eta bestea leuna, arteriak hortik irteten direlako.' }),
        L(0.16, 'Arteria konoaren alboko paretetan bi endokardio kuxin agertzen dira: atze eskuinean eta aurre ezkerrean.', n('5.1/p5/s2'), ['arteria-konoa', 'konoaren-gandorrak'], {
          tone: 'emphasis',
          writes: 'b-kono-gandorrak',
          plain: 'Arteria konoaren hormetan bi kuxin hazten dira, bata atze eskuinean eta bestea aurre ezkerrean.',
        }),
        L(0.46, 'Bi gandorrak hazi eta fusionatzen dira: arteria konoa trenkadatu egiten da, eta trenkada laprana da.', n('5.1/p5/s3', '5.1/p5/s4'), ['arteria-konoa', 'konoaren-trenkada'], { plain: 'Bi kuxinak elkartu egiten dira, eta konoa bitan banatzen da. Horma hori zeharka dago, ez zuzen.' }),
        L(0.46, 'Kontuz: apunteen hurrengo esaldiak gandorren aldeak alderantziz idazten ditu; gogoratu atze eskuinean eta aurre ezkerrean.', n('5.1/p5/s2', '5.1/p5/s4'), [], { tone: 'caution', plain: 'Apunteetan esaldi batek aldeak alderantziz jartzen ditu. Zuk gogoratu: bata atze eskuinean, bestea aurre ezkerrean.' }),
        L(0.52, 'Trenkadaren aurre eskuinaldean eskuineko bentrikuluaren infundibulua geratzen da: hortik birika arteria irtengo da.', n('5.1/p5/s5'), ['eskuineko-infundibulua'], {
          tone: 'emphasis',
          plain: 'Hormaren aurre eskuineko aldean geratzen den hutsunea eskuineko infundibulua da: hortik aterako da birika arteria.',
        }),
        L(0.52, 'Atze ezkerrekoa ezkerreko bentrikuluaren infundibulua da: hortik aorta.', n('5.1/p5/s6'), ['ezkerreko-infundibulua'], { plain: 'Atze ezkerreko hutsunea ezkerreko infundibulua da: hortik aterako da aorta.' }),
        L(
          0.52,
          'Biak ez daude plano berean: eskuinekoa aurrerago eta eskuinerago dago. Beraz, bi arteriak ere ez.',
          n('5.1/p5/s7', '5.1/p5/s8'),
          ['eskuineko-infundibulua', 'ezkerreko-infundibulua'],
          { tone: 'emphasis', writes: 'b-infundibuluak', plain: 'Bi hutsune horiek ez daude maila berean: eskuinekoa askoz aurrerago eta eskuinerago dago. Horregatik, bi arteriak ere ez.' }),
        L(0.74, 'Konoaren trenkada behetik hazten da, eta trenkada muskularrarekin eta beheko kuxinarekin fusionatzen da: hori da mintzezko zatia.', n('5.1/p6/s1', '5.1/p6/s2'), [
          'konoaren-trenkada',
          'trenkada-muskularra',
          'beheko-kuxina',
          'mintzezko-trenkada',
        ], { plain: 'Konoaren horma beherantz hazten da, eta trenkada muskularrarekin eta beheko kuxinarekin elkartzen da. Hor sortzen da mintzezko zatia.' }),
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
        L(0, 'Orain enbor arteriosoa. Hemen ere trenkada bat sortzen da, eta enborra bitan banatzen du.', n('5.2/p3/s1', '5.2/p3/s2'), ['enbor-arteriosoa'], { plain: 'Orain enbor arteriosoa, bihotzetik irteten den hodi nagusia. Bere barruan ere horma bat hazten da, eta bi hodi bihurtzen da.' }),
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
        L(0.22, 'Kiribila denez, trenkadaren kokapena desberdina da enborraren maila bakoitzean.', n('5.2/p3/s8'), ['trenkada-aortikopulmonarra'], { tone: 'why', plain: 'Horma bihurrituta dagoenez, enborra maila desberdinetan mozten badugu, horma beste toki batean ikusiko dugu bakoitzean.' }),
        L(0.22, 'Hurbileko mailan, behean, trenkada zeharkakoa da: aurrean birika arteria dago, eta atzean aorta.', n('5.2/p4/s1', '5.2/p4/s2'), ['birika-arteria', 'aorta'], { tone: 'emphasis', plain: 'Behean, bihotzetik hurbil, horma zeharka dago: birika arteria aurrean geratzen da, eta aorta atzean.' }),
        L(0.35, 'Gorago, tarteko mailan, trenkada aurretik atzera doa: aorta eskuinean dago, eta birika arteria ezkerrean.', n('5.2/p5/s1'), ['aorta', 'birika-arteria'], { tone: 'emphasis', plain: 'Tartean, horma aurretik atzera doa: aorta eskuinean eta birika arteria ezkerrean, elkarren ondoan.' }),
        L(0.47, 'Urrutiko mailan, goian, berriro zeharkakoa da: orain aorta aurrean dago, eta birika arteria atzean.', n('5.2/p6/s1'), ['aorta', 'birika-arteria'], { tone: 'emphasis', plain: 'Goian, bihotzetik urrun, horma berriro zeharka dago, baina orain alderantziz: aorta aurrean eta birika arteria atzean.' }),
        L(0.47, 'Hala, trenkadak bi erretenetan banatzen du enborra, eta bi hodien kokapena aldatzen da mailaz maila.', n('5.2/p7/s2'), [], { hold: 1, plain: 'Horrela, enborra bi hodi bihurtzen da, eta maila bakoitzean bi hodien tokia aldatu egiten da.' }),
        L(0.59, 'Behean, trenkada kiribil hau konoaren trenkadarekin fusionatzen da: jarraiak dira.', n('5.2/p8/s1'), ['trenkada-aortikopulmonarra', 'konoaren-trenkada'], {
          tone: 'emphasis',
          writes: 'b-jarraiak',
          plain: 'Beheko muturrean, horma bihurritu hau konoaren hormarekin lotzen da: bat bera dira, jarraian.',
        }),
        L(0.59, 'Fusioaren ondorioz, bentrikuluen arteko mintzezko zatia sortzen da.', n('5.2/p8/s3'), ['mintzezko-trenkada'], { plain: 'Lotura horretatik sortzen da bentrikuluen arteko hormaren mintzezko zatia.' }),
        L(0.59, 'Beraz, birika arteria aurretik irteten da, eskuineko bentrikulutik; aorta, berriz, atzetik, ezkerrekotik.', n('5.2/p8/s4', '5.2/p8/s5'), ['birika-arteria'], { plain: 'Ondorioz, birika arteria eskuineko bentrikulutik ateratzen da, aurretik; eta aorta ezkerreko bentrikulutik, atzetik.' }),
        L(0.72, 'Bihotza apur bat biratuta dago: eskuineko bentrikulua ezkerrekoa baino aurrerago.', n('5.2/p9/s1'), [], { plain: 'Bihotza pixka bat biratuta dago, eta horregatik eskuineko bentrikulua ezkerrekoa baino aurrerago geratzen da.' }),
        L(0.72, 'Laburbilduz: behean birika arteria aortaren aurrean, tartean parean, eta goian aorta aurrean.', n('5.2/p9/s3'), ['birika-arteria', 'aorta'], {
          tone: 'summary',
          writes: 'b-mailak',
          hold: 1.5,
          plain: 'Gogoratzeko: behean birika arteria aurrean; tartean biak elkarren ondoan; goian aorta aurrean.',
        }),
        L(0.86, 'Eta paretak: bentrikuluen atal trabekulatuak hasierako bentrikuluetatik datoz, eta atal lisoak konotik.', n('5.2/p10/s2'), [], { tone: 'summary', writes: 'tz-bentrikuluak', plain: 'Eta bentrikuluen hormak: zati zimurrak hasierako bentrikuluetatik datoz, eta zati leunak konotik.' }),
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
        L(0.06, 'Bi arteria horien hasieran balbula semilunarrak agertzen dira, kuxinetatik: aorta balbula eta birika balbula.', n('5.2/p12/s1'), [
          'balbula-semilunarrak',
          'aorta-balbula',
          'birika-balbula',
        ], { plain: 'Bi arteria horiek hasten diren tokian balbula berriak sortzen dira, kuxinetatik: aorta balbula eta birika balbula.' }),
        L(0.1, 'Hiru gandor agertzen dira, eta haien goikaldean goraguneak, tuberkuluak. Gero goiko aldetik zulatzen dira.', n('5.2/p12/s6'), ['balbula-semilunarrak'], { plain: 'Lehenik hiru gandor agertzen dira, koskor txikiekin, tuberkuluak. Gero koskor horiek goitik zulatzen dira.' }),
        L(0.25, 'Horregatik balbak bereziak dira: enara kabiko forma dute, eta ahurrak dira, goitik zulatuta.', n('5.2/p12/s3'), ['aorta-balbula', 'birika-balbula'], {
          tone: 'emphasis',
          writes: 'b-enara',
          plain: 'Horregatik balba hauek poltsa txiki baten itxura dute, enara kabia bezala, eta goitik irekita daude.',
        }),
        L(0.5, 'Trikuspideak dira: aortan bi alboko balba eta atzeko bat; birika balbulan bi alboko eta aurreko bat.', n('5.2/p12/s2'), ['aorta-balbula', 'birika-balbula'], {
          tone: 'emphasis',
          writes: 'b-trikuspideak',
          plain: 'Balbula bakoitzak hiru balba ditu. Aortan bi alboetan eta bat atzean; birika balbulan bi alboetan eta bat aurrean.',
        }),
        L(0.73, 'Aorta balbularen eskuineko eta ezkerreko balben sinuetatik arteria koronarioak irteten dira: aortaren lehen adarrak.', n('5.2/p12/s4'), ['aorta-balbula', 'arteria-koronarioak'], {
          tone: 'emphasis',
          writes: 'b-koronarioak',
          plain: 'Aorta balbulako bi balbek, eskuinekoak eta ezkerrekoak, poltsatxo bana dute; hortik ateratzen dira arteria koronarioak, aortaren lehen adarrak.',
        }),
        L(0.73, 'Arteria koronarioek bihotzaren miokardioa irrigatzen dute.', n('5.2/p12/s5'), ['arteria-koronarioak'], { plain: 'Arteria koronarioek bihotzaren muskuluari, miokardioari, odola ematen diote.' }),
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
      id: 'jatorriak',
      title: 'Jatorriak',
      stage: 'jatorriak',
      lines: [
        L(0, 'Bukatzeko, galdera bat: atal bakoitza nondik dator? Bihotz osoa hodi zuzenera itzultzen da, atal bakoitza bere kolorez.', n('1/p3/s1', '1/p3/s2'), [], {
          tone: 'summary',
          plain: 'Amaitzeko: zati bakoitza nondik dator? Bihotz osoa berriro hodi zuzena bihurtzen da, eta zati bakoitza bere kolorearekin ikusiko dugu.',
        }),
        L(0.15, 'Hodia tolesten da: bulboa aurrera, behera eta eskuinera; atal aurikularra eta zain sinua gora, atzera eta ezkerrera.', n('3/p11/s1', '3/p11/s3'), ['atal-bulbarra', 'atal-aurikularra', 'zain-sinua'], {
          plain: 'Hodia tolestu egiten da: bulboa aurrera, behera eta eskuinera mugitzen da; atal aurikularra eta zain sinua, gora, atzera eta ezkerrera.',
        }),
        L(0.3, 'Kolore bakoitzak bere lekua gordetzen du. Eskuineko bentrikuluaren zati trabekulatua hurbileko ataletik dator, eta ezkerrekoarena atal bentrikularretik.', n('3/p8/s1'), ['hasierako-eskuineko-bentrikulua', 'hasierako-ezkerreko-bentrikulua', 'bulboaren-hurbileko-atala', 'atal-bentrikularra'], {
          tone: 'recall',
          writes: 'b-jatorriak',
          plain: 'Eskuineko bentrikuluaren zati muskuluz betea hurbileko zatitik dator; ezkerrekoarena, atal bentrikularretik.',
        }),
        L(0.46, 'Arteria konotik, berriz, bi bentrikuluen atal lisoak sortzen dira: infundibuluak, arteriak irteteko bideak.', n('5.1/p5/s1', '5.2/p10/s2'), ['arteria-konoa', 'eskuineko-infundibulua', 'ezkerreko-infundibulua'], {
          plain: 'Konotik bi bentrikuluen zati leunak sortzen dira, arteriak irteten diren tokiak: infundibuluak.',
        }),
        L(0.6, 'Eta enbor arteriosotik, trenkada kiribilaz banatuta, aorta eta birika enborra irteten dira: bi arteria handiak.', n('5.2/p10/s3'), ['enbor-arteriosoa', 'aorta', 'birika-arteria'], {
          plain: 'Enbor arteriosoa horma bihurritu batek bitan banatzen du: aorta eta birika enborra.',
        }),
      ],
      board: [
        {
          id: 'b-jatorriak',
          kind: 'line',
          text: 'Trabekulatuak: eskuinekoa hurbileko ataletik, ezkerrekoa atal bentrikularretik; lisoak konotik',
          notes: n('3/p8/s1', '5.1/p5/s1'),
          key: true,
        },
      ],
      checks: [
        {
          kind: 'contrast',
          id: 'klasea:11/jatorriak-bentrikuluak',
          concept: 'hasierako-eskuineko-bentrikulua',
          after: 2,
          q: 'Bentrikuluen zati trabekulatuak: nondik dator bakoitza?',
          options: ['Eskuinekoa hurbileko ataletik; ezkerrekoa atal bentrikularretik', 'Eskuinekoa atal bentrikularretik; ezkerrekoa hurbileko ataletik', 'Biak atal bentrikularretik', 'Biak arteria konotik'],
          answer: 0,
          why: ['Bai: hurbileko atala hasierako eskuineko bentrikulua da; atal bentrikularra, ezkerrekoa.', 'Ez: alderantziz da.', 'Ez: eskuinekoa bulboaren hurbileko ataletik dator.', 'Ez: konotik zati lisoak (infundibuluak) datoz.'],
          notes: n('3/p8/s1'),
        },
      ],
    },

    {
      id: 'amaiera',
      title: 'Osatu taula',
      stage: 'jatorriak',
      lines: [L(0.9, 'Azken zatia: osatu taula oroimenetik, eta gero galdera bat.', n('5.2/p10/s1'), [], { tone: 'summary', plain: 'Orain zure txanda: bete taula buruz, eta gero galdera bat.' })],
      checks: [
        {
          kind: 'fill',
          id: 'klasea:11/taula',
          table: 'taula',
          blanks: ['tz-esk-aurikula', 'tz-ezk-aurikula', 'tz-bentrikuluak'],
        },
        { kind: 'pool', id: 'w11-q-kuxin-ab' },
      ],
    },
  ],
};
