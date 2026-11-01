import type { BoardItem, Lesson, Line } from '@/lib/klasea/types';

/**
 * Topic 10's class: the core of the notes (content/klasea/importance/w10.ts), said over the existing
 * stages, views and camera moves. Every line cites the sentences it rests on; tests/klasea.test.ts holds
 * each line to them (numbers, directions, names, the frames it is said over). Plan: docs/klasea-plan.md §4.
 */

const n = (...ids: string[]) => ids.map((id) => `w10/${id}`);

/** A line said at stage time `at`, lighting `focus`. */
const L = (at: number, say: string, notes: string[], focus: string[] = [], more: Partial<Line> = {}): Line => ({ at, say, notes, focus, ...more });

const TABLE: BoardItem = {
  id: 'taula',
  kind: 'table',
  head: ['Bihotz lakioaren atala', 'Zer bihurtzen da'],
  rows: [
    { id: 'tz-hurbileko', cells: ['Bulboaren hurbileko atala', 'Eskuineko bentrikuluaren atal trabekulatua'], notes: n('3.1/p4/s1'), structures: ['bulboaren-hurbileko-atala', 'hasierako-eskuineko-bentrikulua'] },
    { id: 'tz-konoa', cells: ['Arteria konoa', 'Bi bentrikuluen infundibuluak (atal lisoak)'], notes: n('3.1/p5/s1'), structures: ['arteria-konoa', 'infundibuluak'] },
    { id: 'tz-enborra', cells: ['Enbor arteriosoa', 'Birika enborraren eta aortaren sustraiak'], notes: n('3.1/p6/s2'), structures: ['enbor-arteriosoa', 'aortaren-sustraiak'] },
    { id: 'tz-bentrikularra', cells: ['Atal bentrikularra', 'Ezkerreko bentrikuluaren atal trabekulatua'], notes: n('3.2/p5/s1'), structures: ['atal-bentrikularra', 'hasierako-ezkerreko-bentrikulua'] },
    { id: 'tz-aurikularra', cells: ['Atal aurikularra (hasierako eskuineko aurikula)', 'Eskuineko aurikularen atal trabekulatua eta belarritxoa'], notes: n('3.4/p13/s7'), structures: ['atal-aurikularra', 'atal-trabekulatua'] },
    { id: 'tz-eskuin-luzapena', cells: ['Zain sinuaren eskuineko luzapena', 'Eskuineko aurikularen atzeko atal lisoa'], notes: n('3.4/p14/s1', '3.4/p20/s1'), structures: ['eskuineko-sinu-luzapena', 'atal-lisoa'] },
    { id: 'tz-ezker-luzapena', cells: ['Zain sinuaren ezkerreko luzapena', 'Sinu koronarioa eta ezkerreko aurikularen zain laprana'], notes: n('3.4/p7/s1'), structures: ['ezkerreko-sinu-luzapena', 'sinu-koronarioa'] },
    { id: 'tz-eskuin-balbula', cells: ['Eskuineko zain balbula', 'Beheko kabaren eta sinu koronarioaren balbulak'], notes: n('3.4/p10/s3'), structures: ['eskuineko-zain-balbula', 'beheko-kabaren-balbula'] },
    { id: 'tz-ezker-balbula', cells: ['Ezkerreko zain balbula', 'Septum secundumarekin fusionatzen da'], notes: n('3.4/p11/s1'), structures: ['ezkerreko-zain-balbula', 'septum-secundum'] },
  ],
};

export const LESSON_W10: Lesson = {
  week: 10,
  title: 'Zirkulazio aparatua',
  goals: [
    'Bihotza nondik datorren eta nola bihurtzen den hodi bakar',
    'Lehen zirkulazioa: zainak, arteriak eta odolaren bidea',
    'Bihotz hodiaren atalak eta lakioa',
    'Atal bakoitzetik zer sortzen den: eratorrien taula',
  ],
  chunks: [
    {
      id: 'gaur',
      title: 'Gaur',
      stage: 'eskualde-kardiogenikoa',
      lines: [
        L(0, 'Kaixo! Gaurko klasean bihotza nola sortzen den eta lehen zirkulazioa ikasiko ditugu.', n('1/p3/s1'), [], { plain: 'Gaurko gaia: bihotza nola sortzen den, eta odolak egiten duen lehen bidea.' }),
        // The road map, from the notes' own contents: where the heart forms, the loop, and what each part gives.
        L(0, 'Bidea: lehenik eskualde kardiogenikoa; gero bihotz lakioa; azkenik, lakioaren atal bakoitzetik sortzen diren egiturak.', n('1/p3/s1', '2/p10/s1', '3.1/p4/s1'), [], { tone: 'summary', plain: 'Hiru pausotan: bihotza non sortzen den, nola tolesten den lakio bat eginez, eta lakioaren atal bakoitzetik zer sortzen den.' }),
        L(0, '3. astean, enbrioia ezin da jada difusioaren bidez elikatu. Horregatik, bere zirkulazio-sistema garatzen du.', n('1/p3/s1'), [], {
          tone: 'why',
          writes: 'b-zergatik',
          plain: 'Enbrioia handitu egin da: difusioa ez da nahikoa, eta odol hodiak eta bihotza behar ditu.',
        }),
      ],
      board: [{ id: 'b-zergatik', kind: 'line', text: '3. astetik aurrera: difusioa ez da nahikoa, zirkulazio-sistema propioa', notes: n('1/p3/s1'), key: true }],
      checks: [
        {
          kind: 'predict',
          after: 0,
          q: 'Zer uste duzu: zergatik behar du enbrioiak bere zirkulazio-sistema 3. astetik aurrera?',
          options: ['Jada ezin delako difusioaren bidez elikatu', 'Bitelo zakua desagertzen delako', 'Karena oraindik ez dagoelako'],
          answer: 0,
          why: ['Bai: difusioa ez da nahikoa, eta bere zirkulazio-sistema garatzen du.', 'Ez: apunteek ez dute hori esaten; arrazoia elikadura da.', 'Ez: arrazoia da difusioa ez dela nahikoa.'],
          notes: n('1/p3/s1'),
        },
      ],
    },

    {
      id: 'nondik',
      title: 'Nondik dator bihotza?',
      stage: 'eskualde-kardiogenikoa',
      lines: [
        L(0.32, 'Lerro primitiboaren alde zefalikotik zelulak migratzen dira, eta ferra forman zelula multzoak sortzen dituzte: odol irlatxoak.', n('1/p4/s1', '1/p4/s2', '1/p4/s3'), ['lerro-primitiboa', 'odol-irlatxoak'], { plain: 'Lerro primitiboaren buru aldetik zelula batzuk ateratzen dira, eta ferra itxurako multzoak egiten dituzte: odol irlatxoak.' }),
        L(0.48, 'Zeharkako mozketan ikusten da non dauden: alboko mesodermoaren errai orrian.', n('1/p4/s1', '1/p4/s3'), ['odol-irlatxoak', 'errai-orria'], { tone: 'emphasis', writes: 'b-irlatxoak', plain: 'Mozketa honetan ikusten da: irlatxoak errai orrian daude, alboko mesodermoaren barruko geruzan.' }),
        L(0.62, 'Irlatxoetatik odol hodiak garatzen dira: ferra formako sare bat osatzen dute, eta fusionatzean, ferra formako tutu bat.', n('1/p4/s4', '1/p4/s5', '1/p4/s6'), ['ferra-formako-plexua'], { plain: 'Irlatxo horiek odol hodi bihurtzen dira; elkartzean, ferra itxurako hodi bakar bat egiten dute.' }),
        L(0.765, 'Tutu horretan bi atal daude: erdian plaka kardiogenikoa, eta alboetan endokardio hodiak.', n('1/p5/s1', '1/p6/s1', '1/p7/s1'), ['plaka-kardiogenikoa', 'bihotz-hodiak'], {
          tone: 'emphasis',
          writes: 'b-plaka',
          plain: 'Ferra bera da, bi izenekin: erdiko atala plaka kardiogenikoa da, eta alboetako besoak endokardio hodiak.',
        }),
        L(0.795, 'Kontuz: plaka kardiogenikoa plaka neuralaren alde zefalikoan dago, mintz bukofaringeoaren alde bentralean.', n('1/p6/s1'), ['plaka-kardiogenikoa', 'plaka-neurala', 'mintz-bukofaringeoa'], { tone: 'caution', plain: 'Kontuz: plaka kardiogenikoa plaka neuralaren buruko aldean dago, eta mintz bukofaringeoaren aurrean.' }),
        L(0.86, 'Notokordaren bi alboetan bi aorta dortsal agertzen dira, hasieratik endokardio hodiekin kontaktuan.', n('1/p8/s1', '1/p8/s2', '1/p8/s3'), ['aorta-dortsalak', 'notokorda'], { tone: 'emphasis', writes: 'b-aortak', plain: 'Notokordaren bi aldeetan bi aorta dortsal sortzen dira, eta hasieratik hodiekin ukitzen dira.' }),
      ],
      board: [
        { id: 'b-irlatxoak', kind: 'line', text: 'Odol irlatxoak: alboko mesodermoaren errai orrian, ferra forman', notes: n('1/p4/s1', '1/p4/s2', '1/p4/s3') },
        { id: 'b-plaka', kind: 'line', text: 'Ferra formako tutua: erdian plaka kardiogenikoa, alboetan endokardio hodiak', notes: n('1/p6/s1', '1/p7/s1'), key: true },
        { id: 'b-aortak', kind: 'line', text: 'Aorta dortsalak: notokordaren alboetan, hasieratik endokardio hodiekin kontaktuan', notes: n('1/p8/s1', '1/p8/s3') },
      ],
      checks: [{ kind: 'pool', id: 'w10-q-plaka' }],
    },

    {
      id: 'tolespenak',
      title: 'Tolespenek hodi bakarra egiten dute',
      stage: 'bihotz-hodia',
      lines: [
        L(0, 'Hasieran diskoa laua da oraindik. 3. aste bukaeran bi tolespen egiten ditu: zefalokaudala eta zeharkakoa.', n('1/p8/s4', '1/p8/s5'), [], { plain: 'Disko laua tolestu egingo da, bi norabidetan: luzetara eta zeharka.' }),
        L(0.1, 'Lehenik, tolespen zefalokaudala: nerbio sistema luzetara hazten da, eta horregatik plaka kardiogenikoa alde kaudalera doa.', n('1/p9/s1'), ['plaka-kardiogenikoa'], { tone: 'why', plain: 'Garuna eta muina asko hazten dira luzetara; horregatik bihotzaren plaka beherago geratzen da.' }),
        L(0.1, 'Hasieran lepo mailan dago, perikardio barrunbean; azkenean torax barrunbera iristen da, garun xixkuen eta mintz bukofaringeoaren alde kaudalean.', n('1/p9/s2', '1/p9/s3'), ['plaka-kardiogenikoa', 'perikardio-barrunbea', 'garun-xixkuak', 'mintz-bukofaringeoa'], {
          tone: 'emphasis',
          writes: 'b-zefalokaudala',
          hold: 1.5,
          plain: 'Nerbio sistema hazten denean, plaka kardiogenikoa beherago geratzen da: lepotik toraxera.',
        }),
        L(0.35, 'Bigarrena, zeharkako tolespena: somitak hazten dira, eta ezkerreko eta eskuineko endokardio hodiak fusionatzen dira: hodi bakarra.', n('1/p10/s1', '1/p10/s2'), ['bihotz-hodiak'], { tone: 'emphasis', writes: 'b-zeharkakoa', plain: 'Gero gorputza zeharka tolesten da: ezkerreko eta eskuineko hodiak elkartu, eta hodi bakarra geratzen da.' }),
        L(0.47, 'Hodiaren inguruan errai orria kokatzen da, eta hortik orri epimiokardikoa sortzen da.', n('1/p11/s1'), ['errai-orria', 'orri-epimiokardikoa'], { plain: 'Hodiaren inguruan errai orria jartzen da, eta hortik hodiaren kanpoko geruzak sortzen dira.' }),
        L(0.59, 'Hala, hiru geruza bereizten dira: barrutik endokardioa, tartean miokardioa, muskularra, eta kanpoan epikardioa edo errai perikardioa.', n('1/p12/s1', '1/p13/s1', '1/p14/s3', '1/p15/s1', '1/p16/s1', '1/p17/s1'), ['endokardioa', 'miokardioa', 'epikardioa'], { tone: 'emphasis', writes: 'b-geruzak', plain: 'Hiru geruza: barruan endokardioa, gero miokardioa, hau da, muskulua, eta kanpoan epikardioa.' }),
        L(0.73, 'Hodia atzeko paretari lotuta dago, mesokardio dortsalaren bidez; lotura hori desagertzean, perikardioaren zeharkako sinua geratzen da.', n('1/p18/s1', '1/p18/s2'), ['mesokardio-dortsala', 'perikardioaren-zeharkako-sinua'], { writes: 'b-sinua', plain: 'Hodia atzeko paretari zintzilik dago, mesokardio dortsalaren bidez; hori galtzean tarte bat geratzen da: perikardioaren zeharkako sinua.' }),
        L(0.9, 'Tolespenagatik, atzekaldeko aorta dortsalen alde zefalikoak gero eta aurrerago kokatzen dira, eta lehen arku aortikoen bidez bihotz hodiarekin lotzen dira.', n('1/p19/s2', '1/p21/s2', '1/p21/s1', '1/p21/s4', '1/p21/s5'), ['aorta-dortsalak', 'aorta-arkuak', 'bihotz-hodia'], { tone: 'emphasis', writes: 'b-arkuak', plain: 'Tolestean, aorten muturrak aurrerago geratzen dira, eta lehen aorta arkuek bihotz hodiarekin lotzen dituzte.' }),
      ],
      board: [
        { id: 'b-zefalokaudala', kind: 'line', text: 'Tolespen zefalokaudala: plaka kardiogenikoa lepo mailatik torax barrunbera', notes: n('1/p9/s1', '1/p9/s2', '1/p9/s3'), key: true },
        { id: 'b-zeharkakoa', kind: 'line', text: 'Zeharkako tolespena: bi endokardio hodiak fusionatzen dira, hodi bakarra', notes: n('1/p10/s1', '1/p10/s2'), key: true },
        { id: 'b-geruzak', kind: 'line', text: '3 geruza: endokardioa (barrukoa), miokardioa (muskularra), epikardioa (kanpokoa)', notes: n('1/p14/s3', '1/p15/s1', '1/p16/s1', '1/p17/s1') },
        { id: 'b-sinua', kind: 'line', text: 'Mesokardio dortsala desagertzen da: perikardioaren zeharkako sinua', notes: n('1/p18/s1', '1/p18/s2') },
        { id: 'b-arkuak', kind: 'line', text: 'Lehen arku aortikoak: aorta dortsalak bihotz hodiaren alde zefalikoarekin lotzen dituzte (2 arku)', notes: n('1/p21/s1', '1/p21/s2', '1/p21/s4', '1/p21/s5') },
      ],
      checks: [{ kind: 'zer-da-hau', after: 5, structure: 'miokardioa', options: ['Miokardioa', 'Endokardioa', 'Epikardioa', 'Bihotz gelatina'], notes: n('1/p16/s1') }],
    },

    {
      id: 'zirkulazioa',
      title: 'Lehen zirkulazioa',
      stage: 'zirkulazio-goiztiarra',
      lines: [
        L(0, 'Orain, bihotzera iristen den eta handik irteten den odola. Hasieran hodia nahiko zuzena da, eta bi mutur ditu.', n('1/p22/s1'), ['arteria-muturra', 'zain-muturra'], { plain: 'Orain odolaren bidea: hodiak bi mutur ditu, bata odola sartzeko eta bestea irteteko.' }),
        L(0.08, 'Beheko muturra zain muturra da: hara hiru zain mota iristen dira, bikoteka: zilborrekoak, bitelinoak eta kardinal komunak.', n('1/p23/s1', '1/p23/s2'), ['zain-muturra', 'zilbor-zainak', 'bitelo-zainak', 'bena-kardinal-komuna'], { plain: 'Beheko muturrera hiru zain bikote iristen dira: zilborrekoak, bitelinoak eta kardinal komunak.' }),
        L(0.19, 'Goiko muturra arteria muturra da: odola arteria bulboaren urrutiko atalatik, aorta zakutik, arku aortikoetara eta aorta dortsaletara irteten da.', n('1/p24/s1', '1/p24/s2', '1/p25/s1'), ['arteria-muturra', 'atal-bulbarra', 'aorta-zakua', 'aorta-arkuak', 'aorta-dortsalak'], { plain: 'Goiko muturretik odola irteten da: bulbotik aorta zakura, gero aorta arkuetara eta aorta dortsaletara.' }),
        L(0.3, 'Kontuan hartu: arteriak bihotzetik irteten diren odol hodiak dira; zainek, aldiz, odola bihotzera eramaten dute.', n('1/p26/s1', '1/p26/s2'), ['aorta-arkuak', 'aorta-dortsalak', 'zilbor-zainak', 'bitelo-zainak'], { cues: { 'aorta-arkuak': 'arteriak', 'aorta-dortsalak': 'arteriak' }, tone: 'emphasis', writes: 'b-arteria-zaina', plain: 'Gogoratzeko erraza: arteriak bihotzetik irteten dira; zainak bihotzera sartzen dira.' }),
        L(0.3, 'Biek eraman dezakete odol oxigenatua edo oxigeno gabea. Adibidez, zilborreko zainek odol oxigenatua dakarte.', n('1/p26/s3', '1/p23/s2'), ['zilbor-zainak'], {
          tone: 'caution',
          plain: 'Arteria edo zaina izatea norabideak erabakitzen du, ez oxigenoak: bihotzetik irten ala bihotzera etorri.',
        }),
        L(0.38, 'Garai honetan hiru zain bikote iristen dira zain sinuetara: eskuinekoak eta ezkerrekoak.', n('1/p26/s4', '1/p26/s5', '1/p26/s6', '1/p26/s7'), ['zain-sinua']),
        L(0.38, 'Kardinal komunek enbrioiaren alde zefalikoko eta behe aldeko odola biltzen dute; beraz, bihotzera iristen den odol hori oxigeno gutxikoa da.', n('1/p27/s1', '1/p27/s3'), ['bena-kardinal-komuna', 'zain-sinua'], { cues: { 'zain-sinua': 'bihotzera iristen' }, tone: 'why', writes: 'zt-kardinal', plain: 'Kardinal komunek enbrioiaren gorputzeko odola biltzen dute; horregatik dakarte oxigeno gutxiko odola.' }),
        L(0.48, 'Zain bitelinoek ere oxigeno gutxiko odola dakarte, bitelo zakutik hodiaren beheko ataleraino.', n('1/p23/s2', '1/p28/s1', '1/p28/s2'), ['bitelo-zainak', 'bitelo-zaku-sekundarioa'], { writes: 'zt-bitelo', plain: 'Zain bitelinoek bitelo zakuko odola dakarte, hau ere oxigeno gutxirekin.' }),
        L(0.57, 'Zilborreko zainak, berriz, karenatik datoz; horregatik, odol oxigenatua dute.', n('1/p29/s1'), ['zilbor-zainak', 'karena'], { tone: 'why', writes: 'zt-zilbor', plain: 'Zilborreko zainek, berriz, karenako odola dakarte: oxigenoz betea.' }),
        L(0.74, 'Arku aortikoek odol oxigenatua burura eta aorta dortsaletara daramate; aorta dortsalek, gorputzeko beste atal guztietara.', n('1/p31/s1', '1/p32/s1'), ['aorta-arkuak', 'aorta-dortsalak'], { plain: 'Aorta arkuek odola burura eramaten dute, eta aorta dortsalek gorputz osora.' }),
        L(0.83, 'Azkenik, bitelo arteriek eta zilborreko arteriek oxigenorik gabeko odola karenara eramaten dute, oxigenoa eta makromolekulak har ditzan.', n('1/p33/s1'), ['bitelo-arteriak', 'zilbor-arteriak', 'karena'], { tone: 'why', plain: 'Bitelo eta zilborreko arteriek oxigenorik gabeko odola karenara itzultzen dute, berriz oxigenatzeko.' }),
        L(0.87, 'Zain eta arteria hauek bikoitiak dira, eta zainen odola bihotzean nahasten da, atrio primitiboan.', n('1/p34/s1', '1/p34/s2'), ['atal-aurikularra'], { tone: 'emphasis', plain: 'Zain guztien odola bihotzaren sarreran elkartu eta nahasten da, atal aurikularrean.' }),
        L(0.94, 'Zertarako hainbeste hodi? Honela, odola gorputzaren atal guztietara heltzen da.', n('1/p34/s3'), [], { tone: 'why', plain: 'Arteria eta zain horiei esker, odola gorputzaren atal guztietara iristen da.' }),
      ],
      board: [
        { id: 'b-arteria-zaina', kind: 'line', text: 'Arteria: bihotzetik irten. Zaina: bihotzera. Biek eraman dezakete odol oxigenatua edo oxigeno gabea', notes: n('1/p26/s1', '1/p26/s2', '1/p26/s3'), key: true },
        {
          id: 'zain-taula',
          kind: 'table',
          head: ['Zainak (bikoteka)', 'Nondik', 'Odola'],
          rows: [
            { id: 'zt-zilbor', cells: ['Zilborreko zainak', 'Karenatik', 'Oxigenatua'], notes: n('1/p23/s2', '1/p29/s1'), structures: ['zilbor-zainak', 'karena'] },
            { id: 'zt-bitelo', cells: ['Zain bitelinoak', 'Bitelo zakutik', 'Oxigeno gutxikoa'], notes: n('1/p23/s2', '1/p28/s1'), structures: ['bitelo-zainak', 'bitelo-zaku-sekundarioa'] },
            { id: 'zt-kardinal', cells: ['Kardinal komunak', 'Aurreko eta atzeko kardinaletatik', 'Oxigeno gutxikoa'], notes: n('1/p23/s2', '1/p27/s3'), structures: ['bena-kardinal-komuna', 'aurreko-zain-kardinalak', 'atzeko-zain-kardinalak'] },
          ],
        },
      ],
      checks: [
        {
          kind: 'contrast',
          id: 'klasea:10/zilbor-bitelo',
          concept: 'zilbor-zainak',
          after: 7,
          q: 'Zilborreko zainak eta zain bitelinoak: zein da haien arteko aldea?',
          options: [
            'Zilborrekoak karenatik datoz, odol oxigenatuarekin; bitelinoak bitelo zakutik, oxigeno gutxirekin',
            'Bitelinoak karenatik datoz, odol oxigenatuarekin; zilborrekoak bitelo zakutik, oxigeno gutxirekin',
            'Biak karenatik datoz, baina zilborrekoek oxigeno gutxiago dakarte',
            'Biak bitelo zakutik datoz, odol oxigenatuarekin',
          ],
          answer: 0,
          why: [
            'Bai: karenatik oxigenatua, bitelo zakutik oxigeno gutxikoa.',
            'Ez: alderantziz da. Zilborrekoak karenatik datoz, oxigenatuak.',
            'Ez: bitelinoak bitelo zakutik datoz; zilborrekoek dakarte odol oxigenatua.',
            'Ez: zilborrekoak karenatik datoz, eta bitelinoen odolak oxigeno gutxi du.',
          ],
          notes: n('1/p23/s2', '1/p28/s1', '1/p29/s1'),
        },
        {
          kind: 'order',
          id: 'klasea:10/irteera',
          after: 9,
          q: 'Ordenatu odolaren irteera bidea, bihotzetik gorputzetik kanpora arte.',
          items: [
            { label: 'Aorta zakua', structure: 'aorta-zakua' },
            { label: 'Arku aortikoak', structure: 'aorta-arkuak' },
            { label: 'Aorta dortsalak', structure: 'aorta-dortsalak' },
            { label: 'Bitelo eta zilborreko arteriak', structure: 'zilbor-arteriak' },
          ],
          notes: n('1/p24/s1', '1/p25/s1', '1/p31/s1', '1/p32/s1', '1/p33/s1'),
        },
      ],
    },

    {
      id: 'atalak',
      title: 'Hodiaren atalak',
      stage: 'bihotz-atalak',
      lines: [
        L(0, 'Gogoratu: goiko muturra arteria muturra da, eta beheko muturra zain muturra; hodi osoa perikardio barrunbean dago.', n('2/p3/s1', '2/p3/s2'), ['arteria-muturra', 'zain-muturra', 'perikardio-barrunbea'], { tone: 'recall', plain: 'Gogoratu: goiko muturretik odola irteten da, behekotik sartzen da, eta hodi osoa perikardio barrunbean dago.' }),
        L(0.13, '21. egunean, bihotz hodian estuguneak eta zabalkuntzak agertzen dira, eta atal desberdinak eratzen dira goitik behera.', n('2/p3/s3'), ['bihotz-hodia'], { tone: 'emphasis', writes: 'b-21', plain: '21. egunean hodia ez da berdina: zati estuagoak eta zabalagoak agertzen dira.' }),
        L(0.27, 'Goiko atala atal bulbarra da, arteria bulboa; haren muturrean aorta zakua dago.', n('2/p4/s1', '2/p4/s4'), ['atal-bulbarra', 'aorta-zakua'], { plain: 'Goiko zatia atal bulbarra da, eta haren puntan aorta zakua dago.' }),
        L(0.4, 'Ondoren atal bentrikularra eta atal aurikularra datoz. Fusioa zefalikotik kaudalera doanez, atal aurikularra oraindik bikoitza da.', n('2/p3/s4', '2/p5/s1', '2/p6/s1', '2/p6/s3'), ['atal-bentrikularra', 'atal-aurikularra'], { tone: 'why', plain: 'Gero atal bentrikularra eta atal aurikularra. Hodiak goitik behera elkartzen direnez, atal aurikularra oraindik bikoitza da.' }),
        L(0.53, 'Azkena, zain sinuak: bilateralak eta bikoitzak. Enbrioiaren ezker eta eskuineko zainak bertan amaitzen dira.', n('2/p7/s1', '2/p7/s2'), ['zain-sinua', 'zilbor-zainak', 'bitelo-zainak', 'bena-kardinal-komuna'], { cues: { 'bena-kardinal-komuna': 'eskuineko zainak', 'zilbor-zainak': 'eskuineko zainak', 'bitelo-zainak': 'eskuineko zainak' }, plain: 'Azkena, zain sinuak, bat alde bakoitzean: hara iristen dira enbrioiaren zain guztiak.' }),
        L(0.66, 'Atal bulbarra eta atal bentrikularra perikardio barrunbean daude; atal aurikularrak eta zain sinuak, kanpoan, septum transversumean.', n('2/p8/s1', '2/p8/s2'), ['atal-bulbarra', 'atal-bentrikularra', 'perikardio-barrunbea', 'atal-aurikularra', 'zain-sinua', 'septum-transversum'], {
          tone: 'emphasis',
          writes: 'b-non',
          plain: 'Atal bulbarra eta atal bentrikularra barrunbearen barruan daude; atal aurikularrak eta zain sinuak, kanpoan, septum transversumean.',
        }),
        L(0.66, 'Kontuz izenekin: esan odol hodiaren atal aurikularra eta atal bentrikularra, ez aurikula edo bentrikulua bakarrik.', n('2/p8/s1'), ['atal-aurikularra', 'atal-bentrikularra'], { tone: 'caution', plain: 'Kontuz: atal aurikularra eta atal bentrikularra hodiaren zatiak dira, ez oraindik benetako aurikula eta bentrikuluak.' }),
        L(0.8, 'Odolaren bidea, beraz: zainak, zain sinuak, atal aurikularra, atal bentrikularra eta atal bulbarra.', n('2/p8/s4'), ['zain-sinua', 'atal-aurikularra', 'atal-bentrikularra', 'atal-bulbarra'], { tone: 'emphasis', writes: 'b-bidea', hold: 1.5, plain: 'Odolaren bidea: zain sinua, gero atal aurikularra, atal bentrikularra eta azkenik atal bulbarra.' }),
      ],
      board: [
        { id: 'b-21', kind: 'line', text: '21. eguna: estuguneak eta zabalkuntzak; atalak goitik behera', notes: n('2/p3/s3') },
        { id: 'b-non', kind: 'line', text: 'Perikardio barrunbean: atal bulbarra eta bentrikularra. Septum transversumean: aurikulak eta zain sinuak', notes: n('2/p8/s1', '2/p8/s2'), key: true },
        { id: 'b-bidea', kind: 'line', text: 'Odolaren bidea: zainak, zain sinuak, atal aurikularra, atal bentrikularra, atal bulbarra', notes: n('2/p8/s4'), key: true },
      ],
      checks: [
        {
          kind: 'order',
          id: 'klasea:10/bidea',
          q: 'Ordenatu odolaren bidea bihotz hodian, sartzen denetik irteten den arte.',
          items: [
            { label: 'Zain sinua', structure: 'zain-sinua' },
            { label: 'Atal aurikularra', structure: 'atal-aurikularra' },
            { label: 'Atal bentrikularra', structure: 'atal-bentrikularra' },
            { label: 'Atal bulbarra', structure: 'atal-bulbarra' },
          ],
          notes: n('2/p8/s4'),
        },
      ],
    },

    {
      id: 'lakioa',
      title: 'Lakioa',
      stage: 'bihotz-lakioa',
      lines: [
        L(0, '23. egunean, bihotz hodi luze eta zuzena tolesten hasten da: lakio bat sortuko du.', n('2/p9/s1'), ['bihotz-hodia'], { plain: '23. egunean hodi zuzena tolesten hasten da, eta lakio bat egiten du.' }),
        L(0.12, 'Alde zefalikoa, arteria bulboa, aurrera, behera eta eskuinera abiatzen da.', n('2/p10/s1'), ['atal-bulbarra'], { tone: 'emphasis', writes: 'b-lakio-goi', hold: 1, plain: 'Hodiaren goiko aldea, bulboa, aurrera, behera eta eskuinera doa.' }),
        L(0.26, 'Alde kaudala, zain sinua eta aurikula, kontrakoa: atzera, gora eta ezkerrera.', n('2/p10/s1', '2/p11/s1'), ['atal-aurikularra', 'zain-sinua'], {
          tone: 'emphasis',
          writes: 'b-lakio-behe',
          plain: 'Hodiaren goiko aldea aurrera eta behera doa; behekoa, atzera eta gora: bata bestearen kontra.',
        }),
        L(0.4, 'Atalez atal: atal bulbobentrikularra aurrera, behera eta eskuinera; atal bentrikularra, ezkerrera.', n('2/p13/s1', '2/p14/s1'), ['atal-bulbobentrikularra', 'atal-bentrikularra'], { plain: 'Hau da: atal bulbobentrikularra aurrera, behera eta eskuinera; atal bentrikularra, ezkerrera.' }),
        L(0.4, 'Atal aurikularrak kontrakoa: ezkerrera, atzera eta gora. Bulboaren goi atzekaldean geratzen dira, zain sinuekin.', n('2/p15/s1', '2/p16/s1'), ['atal-aurikularra', 'zain-sinua', 'atal-bulbarra'], { tone: 'emphasis', plain: 'Atal aurikularrak alderantziz doaz: ezkerrera, atzera eta gora, bulboaren gainean eta atzean geratu arte.' }),
        L(0.58, 'Tolestu ahala, bikoitzak diren egiturak fusionatzen dira, eta egitura komunak bilakatzen dira: bihotz lakioa.', n('2/p17/s1', '2/p17/s2'), ['atal-aurikularra', 'zain-sinua', 'bihotz-lakioa'], { cues: { 'zain-sinua': 'bikoitzak diren', 'atal-aurikularra': 'bikoitzak diren' }, plain: 'Tolestean, bikoitzak ziren zatiak elkartzen dira: hala sortzen da bihotz lakioa.' }),
        L(0.7, 'Kontuan hartu: bihotza aurretik begiratzen dugu, beraz eskuma eta ezkerra alderantziz daude.', n('2/p17/s4'), ['atal-bulbarra'], { cues: { 'atal-bulbarra': 'eskuma' },
          tone: 'caution',
          writes: 'b-aurretik',
          hold: 2,
          plain: 'Enbrioiaren eskuina zure ezkerrean dago: bulboa eskuinera doa, baina pantailan ezkerrera.',
        }),
        L(0.8, '28. egunean, atal bulbarra lakioaren aurre eskuinaldean dago, eta atal bentrikularra ezkerrean.', n('2/p18/s1', '2/p18/s2'), ['atal-bulbarra', 'atal-bentrikularra'], { plain: '28. egunean, atal bulbarra aurrean eta eskuinean dago, eta atal bentrikularra ezkerrean.' }),
        L(0.8, 'Atal bentrikularra goi atzekaldeko atal aurikularrarekin jarraia da, erreten aurikulubentrikularraren bidez.', n('2/p18/s2'), ['atal-bentrikularra', 'erreten-aurikulubentrikularra', 'atal-aurikularra'], { plain: 'Atal bentrikularra goian eta atzean dagoen atal aurikularrarekin lotuta dago, erreten aurikulubentrikularraren bidez.' }),
        L(0.8, 'Atal aurikularra, berriz, atzealdeko zain sinuarekin komunikatuta jarraitzen du.', n('2/p19/s2'), ['atal-aurikularra', 'zain-sinua'], { tone: 'emphasis', writes: 'b-28', plain: 'Atal aurikularra atzean dagoen zain sinuarekin lotuta geratzen da.' }),
        L(0.92, 'Begiratu orain bihotza aurretik ikusita: hasierako hodi zuzena eta lakioa, bata bestearen gainean.', n('2/p20/s1'), ['bihotz-lakioa'], { hold: 2, plain: 'Begiratu: hasierako hodi zuzena eta lakioa, bata bestearen gainean, aurretik ikusita.' }),
      ],
      board: [
        { id: 'b-lakio-goi', kind: 'line', text: 'Alde zefalikoa (bulboa): aurrera, behera, eskuinera', notes: n('2/p10/s1'), key: true },
        { id: 'b-lakio-behe', kind: 'line', text: 'Alde kaudala (zain sinua, aurikula): atzera, gora, ezkerrera', notes: n('2/p11/s1'), key: true },
        { id: 'b-aurretik', kind: 'line', text: 'Aurretik ikusita: eskuma eta ezkerra alderantziz', notes: n('2/p17/s4'), key: true },
        { id: 'b-28', kind: 'line', text: '28. eguna: bulbarra aurre-eskuinean, bentrikularra ezkerrean, aurikularra goi-atzean, zain sinua atzean', notes: n('2/p18/s1', '2/p18/s2', '2/p19/s2') },
      ],
      checks: [
        {
          kind: 'predict',
          after: 0,
          q: 'Zer uste duzu: tolestean, nora mugituko da hodiaren goiko muturra, arteria bulboa?',
          options: ['Aurrera, behera eta eskuinera', 'Atzera, gora eta ezkerrera', 'Ez da mugituko; beheko muturra bakarrik mugitzen da'],
          answer: 0,
          why: [
            'Bai: alde zefalikoa aurrera, behera eta eskuinera doa.',
            'Ez: hori beheko muturrak egiten du, kontrako mugimendua.',
            'Ez: bi muturrak mugitzen dira, kontrako noranzkoetan.',
          ],
          notes: n('2/p10/s1', '2/p11/s1'),
        },
        { kind: 'pool', id: 'mikro:10/bihotz-lakioa:6' },
      ],
    },

    {
      id: 'bulbarra',
      title: 'Atal bulbarra',
      stage: 'atal-bulbarra',
      lines: [
        L(0, 'Arteria bulboaren urrutiko zatia aorta zakua da; hortik, odola aorta arkuen bidez atzekaldeko aorta dortsaletara heltzen da.', n('3.1/p3/s1'), ['aorta-zakua', 'atal-bulbarra', 'aorta-arkuak', 'aorta-dortsalak'], { plain: 'Bulboaren puntan aorta zakua dago; hortik odola aorta arkuetatik aorta dortsaletara doa.' }),
        L(0.18, 'Arteria bulboan hiru azpiatal bereizten dira: hurbileko atala, arteria konoa eta enbor arteriosoa.', n('3.1/p3/s3'), ['atal-bulbarra', 'bulboaren-hurbileko-atala', 'arteria-konoa', 'enbor-arteriosoa'], { tone: 'emphasis', plain: 'Bulboak hiru zati ditu: hurbileko atala, arteria konoa eta enbor arteriosoa.' }),
        L(0.38, 'Hurbileko atala zabalena da, eta bere paretako muskulu trenkadetatik eskuineko bentrikuluaren atal trabekulatua sortzen da.', n('3.1/p4/s1'), ['bulboaren-hurbileko-atala', 'muskulu-trenkadak', 'hasierako-eskuineko-bentrikulua'], { tone: 'emphasis', writes: 'tz-hurbileko', plain: 'Lehen zatiko muskuluetatik eskuineko bentrikuluaren zati zimurtsua sortzen da.' }),
        L(0.38, 'Hori izango da eskuineko bentrikuluaren atalik garrantzitsuena, baina ez bakarra.', n('3.1/p4/s1'), ['hasierako-eskuineko-bentrikulua'], { plain: 'Eskuineko bentrikuluaren zatirik handiena hortik dator, baina ez osoa.' }),
        L(0.38, 'Kontuz: eskuineko bentrikulu primitiboa atal bulbarretik dator, ez atal bentrikularretik.', n('3.1/p4/s1'), ['hasierako-eskuineko-bentrikulua', 'bulboaren-hurbileko-atala', 'atal-bulbarra'], { cues: { 'bulboaren-hurbileko-atala': 'atal bulbarretik' }, tone: 'caution', plain: 'Kontuz: eskuineko bentrikulua atal bulbarretik dator, ez atal bentrikularretik.' }),
        L(0.56, 'Erdiko atala, arteria konoa, trenkada batek bitan banatzen du: bi bentrikuluen atal lisoak dira, infundibuluak.', n('3.1/p5/s1'), ['arteria-konoa', 'infundibuluak'], { tone: 'emphasis', writes: 'tz-konoa', plain: 'Erdiko zatia, konoa, bitan banatzen da: bi bentrikuluen irteera leunak, infundibuluak.' }),
        L(0.72, 'Urruneko atala, enbor arteriosoa, ere trenkadatu egiten da: hortik birika enborraren eta aortaren sustraiak sortzen dira.', n('3.1/p6/s1', '3.1/p6/s2'), ['enbor-arteriosoa', 'birika-enborraren-sustraiak', 'aortaren-sustraiak'], { tone: 'emphasis', writes: 'tz-enborra', plain: 'Azken zatia, enborra, ere bitan banatzen da: hortik birika enborraren sustraiak eta aortaren sustraiak.' }),
        L(0.9, 'Laburbilduz: hurbileko atala, eskuineko bentrikulua; konoa, infundibuluak; enborra, sustraiak.', n('3.1/p4/s1', '3.1/p5/s1', '3.1/p6/s2'), ['bulboaren-hurbileko-atala', 'hasierako-eskuineko-bentrikulua', 'arteria-konoa', 'infundibuluak', 'enbor-arteriosoa', 'aortaren-sustraiak', 'birika-enborraren-sustraiak'], { cues: { 'birika-enborraren-sustraiak': 'sustraiak' }, tone: 'summary', plain: 'Hiru zati, hiru emaitza: lehenengotik eskuineko bentrikulua, konotik infundibuluak, enborretik sustraiak.' }),
      ],
      board: [TABLE],
      checks: [
        {
          kind: 'contrast',
          id: 'klasea:10/kono-enbor',
          concept: 'arteria-konoa',
          q: 'Arteria konoa eta enbor arteriosoa: zer sortzen da bakoitzetik?',
          options: [
            'Konotik bi infundibuluak (atal lisoak); enbor arteriosotik birika enborraren eta aortaren sustraiak',
            'Konotik birika enborraren eta aortaren sustraiak; enbor arteriosotik infundibuluak',
            'Konotik eskuineko bentrikuluaren atal trabekulatua; enbor arteriosotik infundibuluak',
            'Biek infundibuluak sortzen dituzte',
          ],
          answer: 0,
          why: [
            'Bai: erdiko atalak atal lisoak ematen ditu; urrunekoak, arteria handien sustraiak.',
            'Ez: alderantziz da. Sustraiak enbor arteriosotik datoz.',
            'Ez: atal trabekulatua bulboaren hurbileko ataletik dator.',
            'Ez: infundibuluak konotik bakarrik datoz.',
          ],
          notes: n('3.1/p4/s1', '3.1/p5/s1', '3.1/p6/s2'),
        },
      ],
    },

    {
      id: 'bentrikuluak-aurikulak',
      title: 'Bentrikuluak eta aurikulak',
      stage: 'atal-bentrikularra',
      lines: [
        L(0, 'Atal bentrikularraren paretan ere muskulu trenkadak sortzen dira: hortik ezkerreko bentrikuluaren atal trabekulatua, hasierako ezkerreko bentrikulua.', n('3.2/p3/s1', '3.2/p5/s1'), ['hasierako-ezkerreko-bentrikulua', 'muskulu-trenkadak'], { tone: 'emphasis', writes: 'tz-bentrikularra', plain: 'Atal bentrikularreko muskuluetatik ezkerreko bentrikuluaren zati zimurtsua sortzen da.' }),
        L(0.36, 'Beraz, bi hasierako bentrikuluak jatorri desberdinekoak dira: hasierako eskuineko bentrikulua bulbotik, ezkerrekoa atal bentrikularretik.', n('3.2/p4/s1'), ['hasierako-eskuineko-bentrikulua', 'hasierako-ezkerreko-bentrikulua'], {
          tone: 'emphasis',
          plain: 'Eskuineko bentrikuluaren atal trabekulatua bulboaren hurbileko ataletik dator; ezkerrekoarena, atal bentrikularretik.',
        }),
        L(0.36, 'Bi bentrikulu horiek bentrikulu arteko zulo primarioaren bidez komunikatuta daude.', n('3.2/p4/s1'), ['bentrikulu-arteko-zulo-primarioa'], { writes: 'b-zuloa', plain: 'Bi bentrikulu horiek zulo baten bidez lotuta daude: bentrikulu arteko zulo primarioa.' }),
        L(0.66, 'Atal bentrikularra goi atzekaldeko atal aurikular komunarekin komunikatuta dago, erreten aurikulubentrikularraren bidez.', n('3.2/p6/s1'), ['atal-bentrikularra', 'atal-aurikularra', 'erreten-aurikulubentrikularra'], { plain: 'Atal bentrikularra goian eta atzean dagoen atal aurikularrarekin lotuta dago, erreten aurikulubentrikularraren bidez.' }),
        L(0, 'Lakioa eratzean, enbor arteriosoa barrunbe perikardikoaren eskuinean dago; gero, erdira mugitzen da.', n('3.3/p3/s1'), ['enbor-arteriosoa', 'perikardio-barrunbea'], { stage: 'atal-aurikularra', plain: 'Lakioa egitean enbor arteriosoa eskuinean dago; gero erdira mugitzen da.' }),
        L(0.26, 'Aldi berean, aurikula komunean bi alboko zabalkuntza agertzen dira: hasierako eskuineko eta ezkerreko aurikulak.', n('3.3/p3/s1', '3.3/p3/s2'), ['atal-aurikularra', 'hasierako-eskuineko-aurikula', 'hasierako-ezkerreko-aurikula'], {
          tone: 'emphasis',
          writes: 'b-aurikulak',
          plain: 'Enborra erdira doan bitartean, aurikula komuna bi aldeetara zabaltzen da: eskuinera eta ezkerrera.',
        }),
        L(0.5, 'Orain atalak plano ezberdinetan daude: bentrikuluak aurre eskuinaldean, aurikulak goi atzekaldean.', n('3.3/p4/s1'), ['atal-bentrikularra', 'atal-aurikularra'], { cues: { 'atal-bentrikularra': 'bentrikuluak' }, tone: 'emphasis', writes: 'b-planoak', hold: 1.5, plain: 'Orain atalak ez daude lerro berean: bentrikuluak aurrean eta eskuinean, aurikulak goian eta atzean.' }),
        L(0.74, 'Gogoratu: atzekaldean, aurikulak zain sinuarekin komunikatuta daude, eta hortaz zain guztiekin.', n('3.3/p4/s2'), ['atal-aurikularra', 'zain-sinua'], { tone: 'recall', plain: 'Atzean, aurikulak zain sinura irekita daude: horregatik iristen da hara zain guztien odola.' }),
      ],
      board: [
        { id: 'b-zuloa', kind: 'line', text: 'Bi bentrikulu primitiboak: bentrikulu arteko zulo primarioaren bidez komunikatuta', notes: n('3.2/p4/s1') },
        { id: 'b-aurikulak', kind: 'line', text: 'Enbor arteriosoa erdira; aurikula komunean bi zabalkuntza: hasierako eskuineko eta ezkerreko aurikulak', notes: n('3.3/p3/s1', '3.3/p3/s2') },
        { id: 'b-planoak', kind: 'line', text: 'Bentrikuluak aurre-eskuinaldean, aurikulak goi-atzekaldean', notes: n('3.3/p4/s1'), key: true },
      ],
      checks: [
        {
          kind: 'contrast',
          id: 'klasea:10/trabekulatuak',
          concept: 'hasierako-eskuineko-bentrikulua',
          after: 1,
          q: 'Bi bentrikuluen atal trabekulatuak: nondik dator bakoitza?',
          options: [
            'Eskuinekoa bulboaren hurbileko ataletik; ezkerrekoa atal bentrikularretik',
            'Eskuinekoa atal bentrikularretik; ezkerrekoa bulboaren hurbileko ataletik',
            'Biak atal bentrikularretik',
            'Biak arteria konotik',
          ],
          answer: 0,
          why: [
            'Bai: jatorri desberdinak dituzte.',
            'Ez: alderantziz da.',
            'Ez: eskuinekoa bulboaren hurbileko ataletik dator.',
            'Ez: konotik atal lisoak (infundibuluak) datoz, ez trabekulatuak.',
          ],
          notes: n('3.1/p4/s1', '3.2/p4/s1', '3.2/p5/s1'),
        },
        { kind: 'zer-da-hau', structure: 'atal-bentrikularra', options: ['Atal bentrikularra', 'Atal aurikularra', 'Atal bulbarra', 'Zain sinua'], notes: n('3.3/p4/s1') },
      ],
    },

    {
      id: 'zain-sinua',
      title: 'Zain sinua',
      stage: 'zain-sinua',
      lines: [
        L(0, 'Kontuz! Hau atzetik ikusita dago: hemen eskuina eta ezkerra ez dira alderantzizkatu behar.', n('3.4/p3/s1', '3.4/p4/s1'), ['eskuineko-sinu-luzapena', 'ezkerreko-sinu-luzapena'], { cues: { 'eskuineko-sinu-luzapena': 'eskuina', 'ezkerreko-sinu-luzapena': 'ezkerra' },
          tone: 'caution',
          writes: 'b-atzetik',
          hold: 1,
          plain: 'Orain bihotzaren atzean gaude: enbrioiaren eskuina zure eskuinean dago, eta ezkerra zure ezkerrean.',
        }),
        L(0, '4. astean, zain sinuan zeharkako atala eta ezkerreko eta eskuineko luzapenak bereizten dira.', n('3.4/p4/s2'), ['zain-sinua', 'zain-sinuaren-zeharkako-atala', 'eskuineko-sinu-luzapena', 'ezkerreko-sinu-luzapena'], { plain: 'Laugarren astean zain sinuak hiru zati ditu: zeharkako atala eta bi luzapen, eskuinekoa eta ezkerrekoa.' }),
        L(0, 'Luzapen bakoitzean enbrioiaren alde horretako 3 zainak bukatzen dira: bitelinoa, zilborrekoa eta kardinala.', n('3.4/p4/s3'), ['bitelo-zainak', 'zilbor-zainak', 'bena-kardinal-komuna'], { plain: 'Luzapen bakoitzera alde horretako 3 zainak iristen dira.' }),
        L(0.16, 'Hortik odola zain sinura heltzen da, eta zulo sinoaurikularretik atal aurikularrera pasatzen da; hasieran zulo hori oso zabala da.', n('3.4/p4/s3', '3.4/p4/s6'), ['zain-sinua', 'zulo-sinoaurikularra'], { plain: 'Zain sinutik odola zulo handi batetik pasatzen da atal aurikularrera: zulo sinoaurikularra.' }),
        L(0.16, 'Hara zilborreko odol oxigenatua eta bitelinoen oxigeno gutxikoa iristen dira; beraz, odola nahasten da.', n('3.4/p5/s2', '3.4/p5/s3'), ['zulo-sinoaurikularra'], { tone: 'why', plain: 'Odol oxigenatua eta oxigeno gutxikoa leku berean elkartzen dira, beraz nahastu egiten dira.' }),
        L(0.38, 'Garapenean anastomosiak agertzen dira: ezkerreko zainetako odola eskuineko zainetara desbideratzen da.', n('3.4/p4/s5', '3.4/p6/s2'), ['anastomosiak'], { plain: 'Zainen artean zubiak sortzen dira, anastomosiak: ezkerreko odola eskuineko zainetara pasatzen da.' }),
        L(0.38, 'Kontuz: 4. asterako, zilborrekoetatik eskuinekoa desagertzen da, eta bitelinoetatik, ezkerrekoa.', n('3.4/p4/s5'), ['eskuineko-zilbor-zaina', 'ezkerreko-zain-bitelinoa'], { cues: { 'eskuineko-zilbor-zaina': 'eskuinekoa', 'ezkerreko-zain-bitelinoa': 'ezkerrekoa' }, tone: 'caution', plain: 'Kontuz: 4. asterako, eskuineko zilborreko zaina eta ezkerreko zain bitelinoa desagertzen dira.' }),
        L(0.38, 'Beranduago, gutxi gorabehera 10. astean, ezkerreko kardinal komuna ere desagertzen da.', n('3.4/p4/s5'), ['ezkerreko-kardinal-komuna'], { writes: 'b-ixten', plain: 'Geroago, 10. aste inguruan, ezkerreko kardinal komuna ere desagertzen da.' }),
        L(0.38, 'Horregatik, zain odol ia guztia eskuineko luzapenera iristen da, eta ezkerreko luzapena poliki-poliki txikitzen da.', n('3.4/p6/s3', '3.4/p6/s4'), ['eskuineko-sinu-luzapena', 'ezkerreko-sinu-luzapena'], { tone: 'why', plain: 'Ondorioz, odol gehiena eskuineko luzapenera doa, eta ezkerrekoa txikitzen joaten da.' }),
        L(0.52, 'Ezkerreko luzapenetik bi zain egitura bakarrik sortzen dira: sinu koronarioa eta ezkerreko aurikularen zain laprana.', n('3.4/p7/s1'), ['ezkerreko-sinu-luzapena', 'sinu-koronarioa', 'ezkerreko-aurikularen-zain-laprana'], { tone: 'emphasis', writes: 'tz-ezker-luzapena', plain: 'Ezkerreko luzapenetik bi gauza bakarrik geratzen dira: sinu koronarioa eta ezkerreko aurikularen zain laprana.' }),
        L(0.86, 'Eskuineko luzapena, aldiz, handitu egiten da, eta zulo sinoaurikularra eskuinera mugitzen da, hasierako eskuineko aurikulara.', n('3.4/p8/s1', '3.4/p8/s2', '3.4/p8/s3'), ['eskuineko-sinu-luzapena', 'zulo-sinoaurikularra', 'hasierako-eskuineko-aurikula'], { view: '3d', plain: 'Eskuineko luzapena hazi egiten da, eta zuloa eskuinera mugitzen da, hasierako eskuineko aurikulara.' }),
      ],
      board: [
        { id: 'b-atzetik', kind: 'line', text: 'Atzetik ikusita: eskuina eta ezkerra ez dira alderantzizkatzen', notes: n('3.4/p3/s1', '3.4/p4/s1'), key: true },
        { id: 'b-ixten', kind: 'line', text: '4. asterako ixten dira eskuineko zilborreko zaina eta ezkerreko zain bitelinoa; 10. aste inguruan, ezkerreko kardinal komuna', notes: n('3.4/p4/s5') },
      ],
      checks: [
        {
          kind: 'contrast',
          id: 'klasea:10/aurretik-atzetik',
          concept: 'zain-sinua',
          after: 0,
          q: 'Aurretik eta atzetik ikusita: zer gertatzen da eskuinarekin eta ezkerrarekin?',
          options: [
            'Aurretik ikusita alderantziz daude; atzetik ikusita, ez',
            'Atzetik ikusita alderantziz daude; aurretik ikusita, ez',
            'Bietan alderantziz daude',
            'Ez dira inoiz alderantzizkatzen',
          ],
          answer: 0,
          why: [
            'Bai: aurretik begiratzean enbrioiaren eskuina zure ezkerrean dago; atzetik, zure eskuinean.',
            'Ez: alderantziz da.',
            'Ez: atzetik ikusita ez dira alderantzizkatzen.',
            'Ez: aurretik ikusita alderantziz daude.',
          ],
          notes: n('2/p17/s4', '3.4/p3/s1', '3.4/p4/s1'),
        },
        {
          kind: 'predict',
          after: 4,
          q: 'Zer uste duzu: ezkerreko zainak ixten direnean, zer gertatuko zaio zain sinuaren ezkerreko luzapenari?',
          options: ['Txikitu egingo da, garrantzia galduz', 'Handitu egingo da, odol gehiago jasoz', 'Ez da aldatuko'],
          answer: 0,
          why: ['Bai: odola eskuinera desbideratzen da, eta ezkerreko luzapenak garrantzia galtzen du.', 'Ez: eskuinekoa da handitzen dena.', 'Ez: txikitu egiten da.'],
          notes: n('3.4/p6/s4'),
        },
        {
          kind: 'contrast',
          id: 'klasea:10/luzapenak',
          concept: 'ezkerreko-sinu-luzapena',
          q: 'Zain sinuaren bi luzapenak: zer gertatzen zaio bakoitzari?',
          options: [
            'Ezkerrekoa txikitu eta sinu koronarioa eta zain laprana ematen ditu; eskuinekoa handitu egiten da',
            'Eskuinekoa txikitu eta sinu koronarioa ematen du; ezkerrekoa handitu egiten da',
            'Biak berdin handitzen dira',
            'Biak desagertu egiten dira',
          ],
          answer: 0,
          why: [
            'Bai: odola eskuinera desbideratzen da.',
            'Ez: alderantziz da.',
            'Ez: ezkerrekoak garrantzia galtzen du.',
            'Ez: ezkerrekotik sinu koronarioa geratzen da, eta eskuinekoa handitzen da.',
          ],
          notes: n('3.4/p6/s4', '3.4/p7/s1', '3.4/p8/s2'),
        },
      ],
    },

    {
      id: 'eskuineko-aurikula',
      title: 'Eskuineko aurikula',
      stage: 'eskuineko-aurikula',
      lines: [
        L(0, 'Eskuin atzeko aurikularen pareta zain sinuarekin komunikatuta dago: hori da zulo sinoaurikularra.', n('3.4/p10/s1', '3.4/p10/s2'), ['zulo-sinoaurikularra'], { plain: 'Aurikula honen atzeko horman zulo bat dago, zain sinura irekitzen dena: zulo sinoaurikularra.' }),
        L(0.13, 'Zuloaren ertzeko eskuineko eta ezkerreko zain balbulak goikaldean fusionatzen dira, eta trenkada bat sortzen dute: septum spuriuma.', n('3.4/p10/s3', '3.4/p10/s4'), ['eskuineko-zain-balbula', 'ezkerreko-zain-balbula', 'septum-spurium'], { tone: 'emphasis', plain: 'Zuloaren bi ertzetan bi balbula daude; goian elkartzen dira eta horma txiki bat egiten dute: septum spuriuma.' }),
        L(0.22, 'Gero, septum spuriuma eta ezkerreko zain balbula septum secundumarekin fusionatzen dira: aurikula arteko trenkadaren osagai bihurtzen dira.', n('3.4/p11/s1', '3.4/p11/s2'), ['septum-spurium', 'ezkerreko-zain-balbula', 'septum-secundum'], { writes: 'tz-ezker-balbula', plain: 'Gero horma hori eta ezkerreko balbula septum secundumarekin elkartzen dira, aurikulen arteko horman.' }),
        L(0.37, 'Eskuineko zain balbula goian desagertzen da; behean bitan banatzen da: beheko kabaren balbula eta sinu koronarioaren balbula.', n('3.4/p10/s3', '3.4/p16/s3', '3.4/p17/s1', '3.4/p18/s1'), ['eskuineko-zain-balbula', 'beheko-kabaren-balbula', 'sinu-koronarioaren-balbula'], { tone: 'emphasis', writes: 'tz-eskuin-balbula', plain: 'Eskuineko balbula goian galtzen da; behean bi balbula txiki uzten ditu: beheko kabaren balbula eta sinu koronarioaren balbula.' }),
        L(0.53, 'Bitartean, atzean zegoen sinua aurikularen atzeko paretan inkorporatzen da: horrela sortzen da behin betiko eskuineko aurikula.', n('3.4/p12/s1', '3.4/p12/s2'), ['atal-lisoa', 'eskuineko-aurikula'], { plain: 'Atzean zegoen sinua aurikularen atzeko hormaren parte bihurtzen da. Hortik dator behin betiko eskuineko aurikula.' }),
        L(0.58, 'Atzeko atal lisoa zain sinuaren eskuineko luzapenetik dator: bertan bukatzen dira goiko eta beheko bena kabak, eta sinu koronarioa.', n('3.4/p13/s2', '3.4/p13/s5', '3.4/p13/s6', '3.4/p21/s1'), ['atal-lisoa', 'goiko-kaba-zaina', 'beheko-kaba-zaina', 'sinu-koronarioa'], { tone: 'emphasis', writes: 'tz-eskuin-luzapena', plain: 'Atzeko zati leuna zain sinutik dator: hara iristen dira bi bena kabak eta sinu koronarioa.' }),
        L(0.7, 'Gainerakoa atal trabekulatua da: hasierako eskuineko aurikulatik dator, belarritxoa barne, eta muskulu pektinio finak ditu.', n('3.4/p13/s7'), ['atal-trabekulatua', 'belarritxoa', 'muskulu-pektinioak'], { tone: 'emphasis', writes: 'tz-aurikularra', plain: 'Beste zatiak muskulu finak ditu, zimurtsua da, eta belarritxoa barne hartzen du.' }),
        L(0.7, 'Beraz, eskuineko aurikulak bi atal guztiz desberdin ditu: atzeko atal lisoa eta atal trabekulatua.', n('3.4/p14/s1'), ['eskuineko-aurikula', 'atal-lisoa', 'atal-trabekulatua'], { tone: 'summary', plain: 'Eskuineko aurikulak bi zati oso desberdin ditu: bata leuna, bestea zimurtsua.' }),
        L(0.8, 'Bi atalen artean gandor terminala dago, eta haren goiko aldean nodulu sinusala: bihotzaren markapasoa.', n('3.4/p15/s1'), ['gandor-terminala', 'nodulu-sinusala'], { tone: 'emphasis', writes: 'b-gandor', plain: 'Bi zatien arteko mugan gandor terminala dago, eta haren goian nodulu sinusala, bihotzaren taupada hasten duena.' }),
      ],
      board: [
        { id: 'b-gandor', kind: 'line', text: 'Gandor terminala: atal lisoaren eta trabekulatuaren artean; goian nodulu sinusala (markapasoa)', notes: n('3.4/p15/s1') },
      ],
      checks: [
        {
          kind: 'contrast',
          id: 'klasea:10/liso-trabekulatu',
          concept: 'atal-lisoa',
          after: 6,
          q: 'Eskuineko aurikularen bi atalak: nondik dator bakoitza?',
          options: [
            'Atal lisoa zain sinuaren eskuineko luzapenetik; atal trabekulatua hasierako eskuineko aurikulatik',
            'Atal lisoa hasierako eskuineko aurikulatik; atal trabekulatua zain sinuaren eskuineko luzapenetik',
            'Biak zain sinutik',
            'Atal lisoa ezkerreko luzapenetik; atal trabekulatua bulbotik',
          ],
          answer: 0,
          why: [
            'Bai: zain sinutik pareta lisoa, atal aurikularretik trabekulatua.',
            'Ez: alderantziz da.',
            'Ez: atal trabekulatua hasierako eskuineko aurikulatik dator.',
            'Ez: ezkerreko luzapenetik sinu koronarioa dator.',
          ],
          notes: n('3.4/p7/s1', '3.4/p13/s7', '3.4/p14/s1'),
        },
        { kind: 'pool', id: 'w10-q-spurium' },
      ],
    },

    {
      id: 'amaiera',
      title: 'Osatu taula',
      stage: 'eskuineko-aurikula',
      lines: [
        L(0.9, 'Azken zatia: taula osatu oroimenetik, eta gero zenbait galdera, gai osoko zatiak nahastuta.', n('3.4/p14/s1'), [], { tone: 'summary', plain: 'Orain zu: bete taula buruz, eta erantzun galdera batzuei.' }),
      ],
      checks: [
        { kind: 'fill', id: 'klasea:10/taula', table: 'taula', blanks: ['tz-hurbileko', 'tz-konoa', 'tz-enborra', 'tz-bentrikularra', 'tz-eskuin-luzapena', 'tz-ezker-luzapena'] },
        { kind: 'pool', id: 'w10-q-zilbor-zainak' },
        { kind: 'pool', id: 'w10-q-eskuineko-bentrikulua' },
        { kind: 'pool', id: 'w10-q-desagertzen' },
      ],
    },
  ],
};
