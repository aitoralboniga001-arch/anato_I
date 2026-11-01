import type { BoardItem, Lesson, Line } from '@/lib/klasea/types';

/**
 * Topic 13's class: the core of the notes (content/klasea/importance/w13.ts), said over the existing
 * stages and their 3D views, from the three pairs of veins of week 5 to the venae cavae, the circulation
 * around birth and the lymphatic system. Every line cites the sentences it rests on; tests/klasea.test.ts
 * holds each line to them (numbers, directions, names, the frames it is said over). Plan: docs/klasea-plan.md §4.
 */

const n = (...ids: string[]) => ids.map((id) => `w13/${id}`);

/** A line said at stage time `at`, lighting `focus`. */
const L = (at: number, say: string, notes: string[], focus: string[] = [], more: Partial<Line> = {}): Line => ({ at, say, notes, focus, ...more });

/** Each adult vein and where it comes from (notes 2.1–3.2): the topic's one table. */
const TABLE: BoardItem = {
  id: 'taula',
  kind: 'table',
  head: ['Zain heldua', 'Jatorria'],
  rows: [
    { id: 'tz-porta', cells: ['Porta zaina', 'Eskuineko zain bitelinoa, duodenoaren inguruan'], notes: n('2.1.2/p3/s1'), structures: ['porta-zaina', 'eskuineko-zain-bitelinoa'] },
    { id: 'tz-gibel', cells: ['Beheko kabaren gibel segmentua', 'Eskuineko hodi hepatokardiakoa'], notes: n('2.1.1/p5/s4'), structures: ['kabaren-gibel-segmentua', 'eskuineko-hodi-hepatokardiakoa'] },
    { id: 'tz-azigos', cells: ['Azigos zaina', 'Eskuineko kardinal gaineko zaina eta eskuineko atzeko kardinalaren hurbileko atala'], notes: n('2.3.1/p5/s1'), structures: ['azigos-zaina', 'kardinal-gaineko-zainak'] },
    { id: 'tz-hemi', cells: ['Hemiazigosa eta hemiazigos laguntzailea', 'Ezkerreko kardinal gaineko zaina'], notes: n('2.3.1/p6/s1'), structures: ['hemiazigos-zaina', 'kardinal-gaineko-zainak'] },
    { id: 'tz-giltz', cells: ['Beheko kabaren giltzurrun segmentua', 'Eskuineko kardinal azpiko zaina'], notes: n('3.1/p8/s1'), structures: ['kabaren-giltzurrun-segmentua', 'kardinal-azpiko-zainak'] },
    { id: 'tz-ezk-giltz', cells: ['Ezkerreko giltzurrun zaina', 'Kardinal azpiko zainen anastomosia'], notes: n('3.1/p6/s1', '3.1/p6/s2'), structures: ['ezkerreko-giltzurrun-zaina', 'kardinal-azpiko-anastomosia'] },
    { id: 'tz-iliako', cells: ['Ezkerreko zain iliako primitiboa', 'Ezkerreko sakrokardinalaren urrutiko atala'], notes: n('3.1/p9/s2'), structures: ['ezkerreko-zain-iliako-primitiboa', 'zain-sakrokardinalak'] },
    { id: 'tz-sakro', cells: ['Beheko kabaren segmentu sakrokardinala', 'Eskuineko zain sakrokardinala'], notes: n('3.1/p13/s2'), structures: ['kabaren-segmentu-sakrokardinala', 'zain-sakrokardinalak'] },
    { id: 'tz-sinu', cells: ['Sinu koronarioa', 'Zain sinuaren ezkerreko luzapena'], notes: n('3.1/p15/s3'), structures: ['sinu-koronarioa', 'ezkerreko-sinu-luzapena'] },
    { id: 'tz-brakio', cells: ['Ezkerreko zain brakiozefalikoa', 'Aurreko kardinalen anastomosia'], notes: n('3.2/p4/s1', '3.2/p5/s1'), structures: ['ezkerreko-zain-brakiozefalikoa', 'aurreko-kardinalen-anastomosia'] },
    { id: 'tz-goiko', cells: ['Goiko kaba zaina', 'Eskuineko kardinal komuna eta eskuineko aurreko kardinalaren hurbileko atala'], notes: n('3.2/p10/s4'), structures: ['goiko-kaba-zaina', 'bena-kardinal-komuna'] },
  ],
};

export const LESSON_W13: Lesson = {
  week: 13,
  title: 'Zain sistema',
  goals: [
    'Zain sinura heltzen diren hiru zain bikoteak',
    'Porta zaina, hodi benosoa eta beheko kabaren atalak',
    'Kardinal sistemak: azigosa, kabak eta zain brakiozefalikoak',
    'Jaio aurreko zirkulazioa eta jaiotzako aldaketak',
    'Linfa sistema: zakuak eta hodi toraxikoa',
  ],
  chunks: [
    {
      id: 'gaur',
      title: 'Gaur',
      stage: 'sarrera',
      lines: [
        L(0.12, 'Kaixo! Gaur zain sistemaren garapena ikasiko dugu, jaiotzako zirkulazioa eta linfa sistema barne.', n('1/p3/s1'), [], { plain: 'Gaurko gaia: zainak nola sortzen eta aldatzen diren, jaiotzan zer gertatzen den, eta linfa sistema.' }),
        L(0.12, '5. astean, zain sinura hiru zain mota iristen dira, eta guztiak bikoitzak dira: eskumakoa eta ezkerrekoa.', n('1/p3/s1'), ['zain-sinua'], {
          tone: 'emphasis',
          writes: 'b-hiru',
          plain: 'Bihotzaren sarrerara, zain sinura, hiru zain mota heltzen dira, eta mota bakoitzetik bi daude.',
        }),
        L(0.3, 'Lehenak zain bitelinoak dira, bitelo zakutik datozenak. Hasieran bi dira.', n('1/p4/s1'), ['bitelo-zainak', 'bitelo-zaku-sekundarioa'], {
          plain: 'Lehen mota: zain bitelinoak. Bitelo zakuko odola dakarte, eta bi dira.',
        }),
        L(0.5, 'Bigarrenak zilborreko zainak dira: karenatik datorren odol oxigenatua dakarte.', n('1/p5/s1', '1/p5/s2'), ['zilbor-zainak'], {
          tone: 'emphasis',
          writes: 'b-zilbor',
          plain: 'Bigarren mota: zilborreko zainak. Haiek bakarrik dakarte oxigenoz betetako odola, karenatik.',
        }),
        L(0.7, 'Hirugarrenak kardinal komunak dira: aurreko eta atzeko kardinalak elkartuz sortzen dira.', n('1/p6/s1'), ['bena-kardinal-komuna'], {
          plain: 'Hirugarren mota: kardinal komunak. Buruko eta gorputzeko zainak elkartzen dira, eta kardinal komuna eratzen dute.',
        }),
        L(0.7, 'Kardinal zainek, berriz, oxigeno gutxiko odola dakarte.', n('1/p6/s3'), [], { plain: 'Kardinal zainetako odolak oxigeno gutxi du.' }),
        L(0.88, 'Beraz, hiru zain motak zain sinuaren luzapenetara heltzen dira, eta zain sinuan odola nahasten da.', n('1/p6/s4'), ['zain-sinua'], {
          writes: 'b-nahasi',
          plain: 'Hiru zain motak toki berera heltzen dira, eta han odolak nahasten dira.',
        }),
      ],
      board: [
        { id: 'b-hiru', kind: 'line', text: '5. astean zain sinura hiru zain mota, bikoitzak: bitelinoak, zilborrekoak eta kardinal komunak', notes: n('1/p3/s1'), key: true },
        { id: 'b-zilbor', kind: 'line', text: 'Zilborreko zainak: karenako odol oxigenatua', notes: n('1/p5/s2') },
        { id: 'b-nahasi', kind: 'line', text: 'Zain sinuan odola nahasten da', notes: n('1/p6/s4') },
      ],
      checks: [
        {
          kind: 'predict',
          after: 1,
          q: 'Zer uste duzu: hiru zain motetatik, zeinek dakar odol oxigenatua?',
          options: ['Zilborreko zainek', 'Zain bitelinoek', 'Kardinal zainek'],
          answer: 0,
          why: ['Bai: karenatik datoz, eta karenan oxigenatzen da odola.', 'Ez: bitelo zakuko odola dakarte.', 'Ez: kardinalek oxigeno gutxiko odola dakarte.'],
          notes: n('1/p5/s2', '1/p6/s3'),
        },
        { kind: 'pool', id: 'mikro:13/sarrera:2' },
      ],
    },

    {
      id: 'bitelinoak',
      title: 'Zain bitelinoak',
      stage: 'zain-nagusiak',
      lines: [
        L(0.2, 'Zain sinuak bi luzapen ditu, eskumakoa eta ezkerrekoa, eta hiru zain motak haietara iristen dira.', n('2/p3/s1'), ['zain-sinua', 'eskuineko-sinu-luzapena', 'ezkerreko-sinu-luzapena'], {
          plain: 'Zain sinuak bi beso ditu, bat alde bakoitzean, eta zain guztiak beso horietara heltzen dira.',
        }),
        L(0.5, 'Zainen artean anastomosiak sortzen dira: ezkerreko zainetako odola eskuinekoetara doa.', n('2/p3/s2'), ['anastomosiak'], {
          tone: 'emphasis',
          writes: 'b-anast',
          plain: 'Zainen artean zubiak sortzen dira, eta ezkerreko odola eskuinera pasatzen da.',
        }),
        L(0.85, 'Horregatik, zain sinuaren ezkerreko luzapenak gero eta garrantzi gutxiago du.', n('2/p3/s3'), ['ezkerreko-sinu-luzapena'], {
          plain: 'Ezkerreko besoak gero eta lan gutxiago egiten du.',
        }),
        L(0.08, 'Zain bitelinoek bitelo zakuko odola hartzen dute.', n('2.1.1/p3/s1'), ['bitelo-zainak', 'bitelo-zaku-sekundarioa'], { stage: 'bitelinoak', plain: 'Zain bitelinoek bitelo zakuko odola biltzen dute.' }),
        L(0.45, 'Gibelaren barruan adarkatzen dira, eta beste zain sare bat sortzen dute: gibeleko sinusoideak.', n('2.1.1/p4/s4'), ['gibela', 'gibeleko-sinusoideak'], {
          plain: 'Gibelaren barruan zatitu egiten dira, eta hodi txikien sare bat egiten dute.',
        }),
        L(0.55, 'Gibeleko odola hodi hepatokardiakoen bidez irteten da: gibeletik irteten diren azken atalak dira.', n('2.1.1/p5/s1', '2.1.1/p5/s3'), ['gibela', 'hodi-hepatokardiakoak'], {
          plain: 'Gibeletik bihotzera doazen azken zatiei hodi hepatokardiakoak deritze.',
        }),
        L(0.68, 'Garrantzitsua: eskuineko hodi hepatokardiakoa ez da galtzen; geroago, kaba zain baten zati bat izango da.', n('2.1.1/p5/s4'), ['eskuineko-hodi-hepatokardiakoa'], {
          tone: 'emphasis',
          writes: 'tz-gibel',
          plain: 'Eskuineko hodi hepatokardiakoa geratu egiten da, eta zain handi baten zati bihurtzen da.',
        }),
        L(0.8, 'Desagertzen dira ezkerreko zain bitelinoaren urrutiko eta hurbileko atalak, eta eskuinekoaren urrutiko atala.', n('2.1.1/p7/s2'), ['ezkerreko-zain-bitelinoa', 'eskuineko-zain-bitelinoa'], {
          plain: 'Ezkerreko bitelinoa ia osorik galtzen da, eta eskuinekoaren mutur urruna ere bai.',
        }),
        L(0.93, 'Geratzen den zatitik porta zaina sortzen da: abdomeneko erraien odola, batez ere zeliakoena, hara iristen da.', n('2.1.1/p7/s4'), ['porta-zaina'], {
          writes: 'tz-porta',
          plain: 'Geratzen den zatia porta zaina da. Sabeleko erraien odola biltzen du.',
        }),
      ],
      board: [{ id: 'b-anast', kind: 'line', text: 'Anastomosiak: ezkerreko zainetako odola eskuineko zainetara', notes: n('2/p3/s2'), key: true }, TABLE],
      checks: [
        {
          kind: 'contrast',
          id: 'klasea:13/hodi-hepatokardiakoak',
          concept: 'eskuineko-hodi-hepatokardiakoa',
          q: 'Bi hodi hepatokardiakoak: zer gertatzen zaie?',
          options: [
            'Ezkerrekoa desagertzen da; eskuinekoa beheko kabaren gibel atala da',
            'Eskuinekoa desagertzen da; ezkerrekoa beheko kabaren gibel atala da',
            'Biak geratzen dira',
            'Biak desagertzen dira',
          ],
          answer: 0,
          why: ['Bai: eskuinekoa geratzen da, beheko kabaren goiko zatia.', 'Ez: alderantziz da.', 'Ez: ezkerrekoa desagertzen da.', 'Ez: eskuinekoa geratzen da.'],
          notes: n('2.1.1/p5/s4', '2.1.1/p7/s2'),
        },
      ],
    },

    {
      id: 'porta',
      title: 'Porta zaina',
      stage: 'porta',
      lines: [
        L(0.1, 'Duodenoaren inguruan porta zaina sortzen da. Bi zain garrantzitsu irekitzen dira hara.', n('2.1.2/p3/s1'), ['duodenoa', 'porta-zaina'], {
          plain: 'Porta zaina duodenoaren inguruan eratzen da, eta bi zain handi heltzen zaizkio.',
        }),
        L(0.22, 'Lehena goiko zain mesenterikoa da, portaren eskuman. Hau ere eskuineko zain bitelinotik sortzen da.', n('2.1.2/p4/s1'), ['goiko-zain-mesenterikoa', 'eskuineko-zain-bitelinoa'], {
          plain: 'Lehen zaina goiko zain mesenterikoa da, eskuinaldean, eta eskuineko zain bitelinotik dator.',
        }),
        L(0.38, 'Bigarrena zain esplenikoa da: baretik dator, portaren ezkerrean dago, eta bi bitelinoen arteko lotura batetik sortzen da.', n('2.1.2/p5/s1'), ['zain-esplenikoa', 'barea'], {
          plain: 'Bigarrena zain esplenikoa da. Baretik dator, ezkerraldetik, eta bi bitelinoak lotzen dituen zubi batetik sortzen da.',
        }),
        L(0.55, 'Bi zain horiek elkartu egiten dira, eta porta zainera heltzen dira.', n('2.1.2/p6/s1'), ['porta-zaina'], { plain: 'Mesenterikoa eta esplenikoa elkartzen dira, eta porta zaina osatzen dute.' }),
        L(0.82, 'Portatik sartzen den odola sinusoideen saretik pasatzen da, eta eskuineko hodi hepatokardiakotik irteten da.', n('2.1.3/p4/s2'), ['gibeleko-sinusoideak', 'eskuineko-hodi-hepatokardiakoa'], {
          plain: 'Portako odolak hodi txikien sarea zeharkatzen du, eta eskuineko hodi hepatokardiakotik ateratzen da.',
        }),
        L(0.93, 'Bi hodietatik ezkerrekoa desagertzen da, eta eskuinekoa geratzen da.', n('2.1.3/p4/s1', '2.1.3/p5/s1'), ['eskuineko-hodi-hepatokardiakoa'], {
          tone: 'emphasis',
          plain: 'Ezkerrekoa galtzen da, eta eskuinekoa geratzen da.',
        }),
      ],
      checks: [
        {
          kind: 'contrast',
          id: 'klasea:13/mesenterikoa-esplenikoa',
          concept: 'zain-esplenikoa',
          q: 'Porta zainera heltzen diren bi zainak: non dago bakoitza?',
          options: [
            'Goiko zain mesenterikoa eskuman; zain esplenikoa ezkerrean, baretik',
            'Goiko zain mesenterikoa ezkerrean, baretik; zain esplenikoa eskuman',
            'Biak eskuman',
            'Biak baretik datoz',
          ],
          answer: 0,
          why: ['Bai: mesenterikoa portaren eskuman, esplenikoa ezkerrean.', 'Ez: alderantziz da.', 'Ez: esplenikoa ezkerrean dago.', 'Ez: esplenikoa bakarrik dator baretik.'],
          notes: n('2.1.2/p4/s1', '2.1.2/p5/s1'),
        },
        { kind: 'pool', id: 'w13-q-plexua' },
      ],
    },

    {
      id: 'zilbor',
      title: 'Zilborreko zainak',
      stage: 'zilbor-zainak',
      lines: [
        L(0.13, 'Hasieran, zilborreko zainak gibelaren bi aldeetatik pasatzen dira, zain sinuaren bi luzapenetara.', n('2.2/p3/s1'), ['zilbor-zainak', 'gibela'], {
          plain: 'Hasieran bi zilborreko zainak gibelaren alde banatik doaz, zain sinura.',
        }),
        L(0.45, 'Eskuineko zilborreko zaina osorik desagertzen da.', n('2.2/p5/s1'), ['eskuineko-zilbor-zaina'], { tone: 'emphasis', plain: 'Eskuineko zilborreko zaina erabat galtzen da.' }),
        L(0.75, 'Ezkerrekoaren hurbileko atala ere desagertzen da; urrutiko atalak lotura zuzena egiten du eskuineko hodi hepatokardiakoarekin.', n('2.2/p6/s1', '2.2/p6/s2'), ['eskuineko-hodi-hepatokardiakoa'], {
          plain: 'Ezkerrekoaren zati bat galtzen da, eta beste zatia eskuineko hodi hepatokardiakoarekin lotzen da zuzenean.',
        }),
        L(0.76, 'Lotura horri hodi benosoa deritzo.', n('2.2/p6/s2'), ['hodi-benosoa'], { tone: 'emphasis', writes: 'b-benosoa', plain: 'Lotura zuzen horrek hodi benosoa du izena.' }),
        L(0.78, 'Beraz, karenako odol oxigenatua ezkerreko zilborreko zainetik dator, eta hodi benosotik eskuineko hodi hepatokardiakora pasatzen da.', n('2.2/p7/s1', '2.2/p7/s2'), ['ezkerreko-zilbor-zaina', 'hodi-benosoa', 'eskuineko-hodi-hepatokardiakoa'], {
          plain: 'Karenako odol ona ezkerreko zilborreko zainetik dator, eta hodi benosotik pasatzen da.',
        }),
        L(0.9, 'Kontuz: hodi benosoa gibelaren azalean dago, ez barruan, irudietan dirudien arren.', n('2.2/p9/s1'), ['hodi-benosoa', 'gibela'], {
          tone: 'caution',
          plain: 'Kontuz: hodi benosoa gibelaren gainazalean dago, ez gibelaren barruan.',
        }),
      ],
      board: [{ id: 'b-benosoa', kind: 'line', text: 'Hodi benosoa: ezkerreko zilborreko zaina eta eskuineko hodi hepatokardiakoa lotzen ditu, gibelaren azalean', notes: n('2.2/p7/s2', '2.2/p9/s1'), key: true }],
      checks: [
        {
          kind: 'contrast',
          id: 'klasea:13/zilbor-zainak',
          concept: 'ezkerreko-zilbor-zaina',
          q: 'Bi zilborreko zainak: zer geratzen da?',
          options: [
            'Eskuinekoa osorik desagertzen da; ezkerrekoaren urrutiko atalak hodi benosoa sortzen du',
            'Ezkerrekoa osorik desagertzen da; eskuinekoaren urrutiko atalak hodi benosoa sortzen du',
            'Biak geratzen dira',
            'Biak osorik desagertzen dira',
          ],
          answer: 0,
          why: ['Bai: ezkerrekoak darama karenako odola, hodi benosotik.', 'Ez: alderantziz da.', 'Ez: eskuinekoa desagertzen da.', 'Ez: ezkerrekoaren urrutiko atala geratzen da.'],
          notes: n('2.2/p5/s1', '2.2/p6/s2'),
        },
        { kind: 'pool', id: 'mikro:13/zilbor-zainak:5' },
      ],
    },

    {
      id: 'kardinalak',
      title: 'Kardinal zainak',
      stage: 'kardinalak',
      lines: [
        L(0.06, 'Hasieran, 5. astera arte, bi zain kardinal mota daude: aurreko kardinalak eta atzeko kardinalak.', n('2.3/p3/s1'), ['aurreko-zain-kardinalak', 'atzeko-zain-kardinalak'], {
          plain: '5. astera arte, bi kardinal mota daude: buruko odola biltzen dutenak eta gorputzeko odola biltzen dutenak.',
        }),
        L(0.38, '5. eta 7. asteen artean, hiru zain sistema berri agertzen dira, bikoitzak. Lehena, kardinal azpiko zainak: giltzurrunetako odola.', n('2.3/p7/s2', '2.3/p7/s4'), ['kardinal-azpiko-zainak', 'giltzurruna'], {
          tone: 'emphasis',
          writes: 'b-hiru-sistema',
          plain: 'Gero hiru zain sistema berri sortzen dira. Lehenak, kardinal azpiko zainek, giltzurrunetako odola biltzen dute.',
        }),
        L(0.5, 'Bigarrena, zain sakrokardinalak: beheko gorputz adarretako odola hara heltzen da.', n('2.3/p7/s6'), ['zain-sakrokardinalak'], {
          plain: 'Bigarrenak, zain sakrokardinalek, hanketako odola biltzen dute.',
        }),
        L(0.72, 'Hirugarrena, kardinal gaineko zainak: gorputz paretako odola, saihets arteko zainen bidez.', n('2.3.1/p4/s1'), ['kardinal-gaineko-zainak', 'saihets-arteko-zainak'], {
          plain: 'Hirugarrenak, kardinal gaineko zainek, gorputz paretako odola biltzen dute, saihets arteko zainetatik.',
        }),
        L(0.85, 'Ondorioz, atzeko kardinalek egiten zuten lana kardinal gaineko zainek egiten dute orain.', n('2.3.1/p3/s4'), ['atzeko-zain-kardinalak', 'kardinal-gaineko-zainak'], {
          plain: 'Atzeko kardinalen lana kardinal gaineko zainek hartzen dute.',
        }),
        L(0.9, 'Sistema berri hauetatik eratuko dira gorputzeko zain garrantzitsuenak.', n('2.3/p7/s3'), ['kardinal-azpiko-zainak'], {
          tone: 'emphasis',
          plain: 'Hiru sistema hauetatik sortuko dira gorputzeko zain nagusiak.',
        }),
      ],
      board: [{ id: 'b-hiru-sistema', kind: 'line', text: '5.–7. asteak: kardinal azpikoak (giltzurrunak), sakrokardinalak (beheko gorputz adarrak), kardinal gainekoak (gorputz pareta)', notes: n('2.3/p7/s2', '2.3/p7/s6', '2.3.1/p4/s1'), key: true }],
      checks: [
        {
          kind: 'contrast',
          id: 'klasea:13/hiru-sistemak',
          concept: 'kardinal-azpiko-zainak',
          q: 'Hiru sistema berriak: zer odol biltzen du bakoitzak?',
          options: [
            'Azpikoek giltzurrunetakoa; sakrokardinalek beheko gorputz adarretakoa; gainekoek gorputz paretakoa',
            'Azpikoek gorputz paretakoa; sakrokardinalek giltzurrunetakoa; gainekoek beheko gorputz adarretakoa',
            'Hirurek giltzurrunetakoa',
            'Hirurek gorputz paretakoa',
          ],
          answer: 0,
          why: ['Bai.', 'Ez: nahastuta daude.', 'Ez: azpikoek bakarrik.', 'Ez: gainekoek bakarrik.'],
          notes: n('2.3/p7/s2', '2.3/p7/s6', '2.3.1/p4/s1'),
        },
        { kind: 'pool', id: 'w13-q-sistema-berriak' },
      ],
    },

    {
      id: 'azigos',
      title: 'Azigos sistema',
      stage: 'azigos',
      lines: [
        L(0.06, 'Eskuineko kardinal gaineko zaina eskuineko atzeko kardinalaren hurbileko atalarekin elkartzen da.', n('2.3.1/p5/s1'), ['kardinal-gaineko-zainak', 'atzeko-zain-kardinalak'], {
          plain: 'Eskuinean, kardinal gaineko zaina atzeko kardinalaren zati batekin lotzen da.',
        }),
        L(0.2, 'Bien artean azigos zaina eratzen dute.', n('2.3.1/p5/s1'), ['azigos-zaina'], { tone: 'emphasis', writes: 'tz-azigos', plain: 'Bi zati horiek elkartuta, zain berri bat: azigos zaina.' }),
        L(0.68, 'Ezkerreko kardinal gaineko zainetik bi enbor sortzen dira: behean hemiazigos zaina, eta goian hemiazigos laguntzailea.', n('2.3.1/p6/s1'), ['kardinal-gaineko-zainak', 'hemiazigos-zaina', 'hemiazigos-laguntzailea'], {
          writes: 'tz-hemi',
          plain: 'Ezkerreko kardinal gaineko zainak bi zain ematen ditu: hemiazigosa behean eta hemiazigos laguntzailea goian.',
        }),
        L(0.8, 'Hemiazigosak 9., 10. eta 11. saihets arteko espazioetako odola eramaten du azigos zainera.', n('2.3.1/p7/s1'), ['hemiazigos-zaina', 'azigos-zaina'], {
          plain: 'Hemiazigosak saihets tarteetako odola, 9.etik 11.era, azigos zainera darama.',
        }),
        L(0.92, 'Hemiazigos laguntzailea pixka bat gorago dago, eta 4.etik 8.era bitarteko espazioetako odola darama azigos zainera.', n('2.3.1/p8/s1', '2.3.1/p8/s2'), ['hemiazigos-laguntzailea', 'azigos-zaina'], {
          plain: 'Hemiazigos laguntzaileak goiko saihets tarteetako odola, 4.etik 8.era, azigos zainera darama.',
        }),
      ],
      checks: [
        { kind: 'zer-da-hau', structure: 'hemiazigos-laguntzailea', options: ['Hemiazigos laguntzailea', 'Hemiazigos zaina', 'Azigos zaina'], notes: n('2.3.1/p6/s1') },
        {
          kind: 'contrast',
          id: 'klasea:13/hemiazigos',
          concept: 'hemiazigos-zaina',
          q: 'Hemiazigos zaina eta hemiazigos laguntzailea: zein espaziotako odola?',
          options: ['Hemiazigosak 9.–11.ena; laguntzaileak 4.–8.ena', 'Hemiazigosak 4.–8.ena; laguntzaileak 9.–11.ena', 'Biek 9.–11.ena', 'Biek 4.–8.ena'],
          answer: 0,
          why: ['Bai: hemiazigosa behean, laguntzailea goian.', 'Ez: alderantziz da.', 'Ez: laguntzaileak 4.–8.ena.', 'Ez: hemiazigosak 9.–11.ena.'],
          notes: n('2.3.1/p7/s1', '2.3.1/p8/s2'),
        },
        { kind: 'pool', id: 'w13-q-azigos' },
      ],
    },

    {
      id: 'kabak',
      title: 'Kaba zainak',
      stage: 'kaba-zainak',
      lines: [
        L(0.12, 'Hiru zain sistema horietatik bi zain sistema nagusi sortzen dira, gure zainik garrantzitsuenak.', n('3/p3/s1', '3/p3/s2'), ['kardinal-gaineko-zainak', 'kardinal-azpiko-zainak', 'zain-sakrokardinalak'], {
          plain: 'Hiru sistema horietatik gorputzeko zain handienak sortzen dira.',
        }),
        L(0.6, 'Goiko kaba zaina atzeko pareta lisotik sartzen da, eta beheko kaba zaina behetik.', n('3/p5/s1'), ['goiko-kaba-zaina', 'atal-lisoa', 'beheko-kaba-zaina'], {
          plain: 'Bi kaba zainak bihotzera sartzen dira: goikoa atzeko horma lisotik, behekoa behetik.',
        }),
        L(0.85, 'Gogoratu prozesu garrantzitsuena: ezkerreko zainetako odola eskuineko zainetara pasatzen da, lotura hauen bidez.', n('3/p4/s1'), ['aurreko-kardinalen-anastomosia', 'kardinal-gaineko-anastomosia', 'kardinal-azpiko-anastomosia', 'sakrokardinal-anastomosia'], {
          tone: 'emphasis',
          plain: 'Gako nagusia: lotura horiei esker, ezkerreko odola eskuineko zainetara pasatzen da.',
        }),
        L(0.05, 'Beheko kaba zaina abdomenetik heltzen den zainik garrantzitsuena da, eta hainbat atal ditu.', n('3.1/p4/s1', '3.1/p3/s1'), ['beheko-kaba-zaina'], { stage: 'beheko-kaba', plain: 'Beheko kaba sabeleko zain nagusia da, eta zati batzuez osatuta dago.' }),
        L(0.15, 'Goiko segmentua gibel segmentua da.', n('3.1/p5/s1'), ['kabaren-gibel-segmentua'], { plain: 'Goiko zatiari gibel segmentua deritzo.' }),
        L(0.25, 'Kardinal azpiko zainen anastomosia agertzen da: ezkerreko odola eskuinera eramaten du.', n('3.1/p6/s1'), ['kardinal-azpiko-anastomosia', 'kardinal-azpiko-zainak'], {
          plain: 'Bi kardinal azpiko zainen artean zubi bat sortzen da, ezkerretik eskuinera.',
        }),
        L(0.35, 'Hortik ezkerreko giltzurrun zaina sortzen da, eta ezkerreko kardinal azpikoaren urrutiko ataletik, ezkerreko zain gonadala.', n('3.1/p6/s2', '3.1/p7/s1'), ['ezkerreko-giltzurrun-zaina', 'ezkerreko-zain-gonadala'], {
          writes: 'tz-ezk-giltz',
          plain: 'Zubi hori ezkerreko giltzurrun zaina da. Ezkerreko zain gonadala ere hortik sortzen da.',
        }),
        L(0.45, 'Eskuineko kardinal azpiko zainetik beheko kabaren giltzurrun segmentua sortzen da.', n('3.1/p8/s1'), ['kardinal-azpiko-zainak', 'kabaren-giltzurrun-segmentua'], {
          writes: 'tz-giltz',
          plain: 'Eskuineko kardinal azpiko zaina beheko kabaren giltzurrun segmentua bihurtzen da.',
        }),
        L(0.55, 'Zain sakrokardinalen anastomosia ere agertzen da.', n('3.1/p9/s1'), ['sakrokardinal-anastomosia', 'zain-sakrokardinalak'], { plain: 'Bi sakrokardinalen artean ere zubi bat sortzen da.' }),
        L(0.65, 'Ezkerreko sakrokardinalaren urrutiko ataletik ezkerreko zain iliako primitiboa sortzen da; eskuinekotik, eskuinekoa.', n('3.1/p9/s2', '3.1/p10/s1'), ['zain-sakrokardinalak', 'ezkerreko-zain-iliako-primitiboa', 'eskuineko-zain-iliako-primitiboa'], {
          writes: 'tz-iliako',
          plain: 'Sakrokardinal bakoitzaren mutur urruna iliako bat bihurtzen da, alde bakoitzean.',
        }),
        L(0.7, 'Eskuineko sakrokardinalaren hurbileko ataletik, berriz, kabaren segmentu sakrokardinala sortzen da.', n('3.1/p11/s1'), ['zain-sakrokardinalak', 'kabaren-segmentu-sakrokardinala'], {
          plain: 'Eskuineko sakrokardinalaren hasierako zatia kabaren azken zatia bihurtzen da.',
        }),
        L(0.85, 'Laburbilduz, beheko kabak hiru atal ditu: gibel segmentua, giltzurrun segmentua eta segmentu sakrokardinala.', n('3.1/p13/s2'), ['beheko-kaba-zaina', 'kabaren-gibel-segmentua', 'kabaren-giltzurrun-segmentua', 'kabaren-segmentu-sakrokardinala'], {
          tone: 'emphasis',
          writes: 'tz-sakro',
          plain: 'Beheko kaba hiru zatiz egina dago, hiru jatorritatik.',
        }),
      ],
      checks: [
        {
          kind: 'contrast',
          id: 'klasea:13/kaba-atalak',
          concept: 'kabaren-giltzurrun-segmentua',
          q: 'Beheko kabaren atalak: nondik dator bakoitza?',
          options: [
            'Gibel segmentua hodi hepatokardiakotik; giltzurrun segmentua kardinal azpikotik',
            'Gibel segmentua kardinal azpikotik; giltzurrun segmentua hodi hepatokardiakotik',
            'Biak sakrokardinaletatik',
            'Biak kardinal gaineko zainetatik',
          ],
          answer: 0,
          why: ['Bai.', 'Ez: alderantziz da.', 'Ez: sakrokardinaletatik beheko atala bakarrik.', 'Ez: kardinal gainekoetatik azigos sistema.'],
          notes: n('3.1/p13/s2'),
          after: 6,
        },
        { kind: 'pool', id: 'w13-q-ezkerreko-giltzurruna' },
      ],
    },

    {
      id: 'goiko',
      title: 'Sinu koronarioa eta goiko kaba',
      stage: 'sinu-koronarioa',
      lines: [
        L(0.2, 'Anastomosien ondorioz, ezkerreko luzapenak garrantzia galtzen du, eta odol osoa eskuineko luzapenera doa.', n('3.1/p15/s1'), ['ezkerreko-sinu-luzapena', 'eskuineko-sinu-luzapena'], {
          plain: 'Odol guztia eskuinera doanez, ezkerreko besoak garrantzia galtzen du.',
        }),
        L(0.55, 'Ezkerreko luzapenetik bi egitura geratzen dira: sinu koronarioa eta ezkerreko aurikularen zain laprana.', n('3.1/p15/s3'), ['ezkerreko-sinu-luzapena', 'sinu-koronarioa', 'ezkerreko-aurikularen-zain-laprana'], {
          tone: 'emphasis',
          writes: 'tz-sinu',
          plain: 'Ezkerreko beso horretatik sinu koronarioa geratzen da, eta zain txiki bat: ezkerreko aurikularen zain laprana.',
        }),
        L(0.18, 'Aurreko kardinalen anastomosia sortzen da, ezkerretik eskuinera.', n('3.2/p4/s1'), ['aurreko-kardinalen-anastomosia'], { stage: 'goiko-kaba', plain: 'Lepoan, bi aurreko kardinalen artean zubi bat sortzen da.' }),
        L(0.3, 'Hortik ezkerreko zain brakiozefalikoa sortzen da.', n('3.2/p5/s1'), ['ezkerreko-zain-brakiozefalikoa'], { tone: 'emphasis', writes: 'tz-brakio', plain: 'Zubi hori ezkerreko zain brakiozefalikoa da.' }),
        L(0.43, 'Hara bi zain iristen dira: ezkerreko barneko jugularra, buruaren ezkerretik, eta ezkerreko subklabioa, goiko gorputz adarretik.', n('3.2/p5/s2', '3.2/p6/s1', '3.2/p7/s1'), ['barneko-jugularrak', 'zain-subklabioak'], {
          plain: 'Hara heltzen dira buruko zaina, barneko jugularra, eta besoko zaina, subklabioa.',
        }),
        L(0.56, 'Eskuman, eskuineko zain brakiozefalikoa: eskuineko barruko jugularra eta eskuineko subklabioa.', n('3.2/p8/s1', '3.2/p9/s1', '3.2/p10/s1'), ['eskuineko-zain-brakiozefalikoa', 'barneko-jugularrak', 'zain-subklabioak'], {
          plain: 'Eskuinean, eskuineko zain brakiozefalikoa dago, jugularrarekin eta subklabioarekin.',
        }),
        L(0.68, 'Beraz, goiko kaba zaina eskuineko kardinal komunetik eta eskuineko aurreko kardinalaren hurbileko ataletik sortzen da.', n('3.2/p3/s1', '3.2/p10/s4'), ['goiko-kaba-zaina', 'bena-kardinal-komuna', 'aurreko-zain-kardinalak'], {
          tone: 'emphasis',
          writes: 'tz-goiko',
          plain: 'Goiko kaba bi zatiz egina dago: eskuineko kardinal komuna eta eskuineko aurreko kardinalaren zati bat.',
        }),
        L(0.92, 'Hasierako atala eskuineko aurreko kardinaletik dator, eta bukaerakoa eskuineko kardinal komunetik.', n('3.2/p11/s1', '3.2/p12/s1'), ['goiko-kaba-zaina', 'goiko-kabaren-hasierako-atala', 'goiko-kabaren-bukaerako-atala'], {
          plain: 'Goiko kabaren lehen zatia aurreko kardinaletik dator, eta azkena kardinal komunetik.',
        }),
      ],
      checks: [
        {
          kind: 'contrast',
          id: 'klasea:13/brakiozefalikoak',
          concept: 'ezkerreko-zain-brakiozefalikoa',
          q: 'Ezkerreko zain brakiozefalikoa: nondik dator?',
          options: ['Aurreko kardinalen anastomosiatik', 'Ezkerreko kardinal komunetik', 'Ezkerreko kardinal gaineko zainetik', 'Kardinal azpiko zainen anastomosiatik'],
          answer: 0,
          why: ['Bai: ezkerretik eskuinerako zubia da.', 'Ez: hori goiko kabaren bukaerako atala da, eskuinean.', 'Ez: hortik hemiazigosak.', 'Ez: hortik ezkerreko giltzurrun zaina.'],
          notes: n('3.2/p4/s1', '3.2/p5/s1'),
          after: 3,
        },
        { kind: 'pool', id: 'w13-q-sinu-koronarioa' },
      ],
    },

    {
      id: 'laburpena',
      title: 'Jakin beharrekoa',
      stage: 'laburpena',
      lines: [
        L(0.12, 'Jakin beharrekoa: goiko kaba zainara bi zain brakiozefalikoak eta azigos zaina iristen dira.', n('3.2/p13/s1', '3.2/p14/s1', '3.2/p14/s2'), ['goiko-kaba-zaina', 'zain-brakiozefalikoak', 'azigos-zaina'], {
          tone: 'emphasis',
          writes: 'b-goiko',
          plain: 'Goiko kabara hiru zain heltzen dira: bi brakiozefalikoak eta azigos zaina.',
        }),
        L(0.36, 'Beheko kaba zainara beheko gorputz adarretako odol guztia iristen da: iliakoetatik, portatik eta abdomeneko erraietatik.', n('3.2/p15/s1'), ['beheko-kaba-zaina', 'zain-iliako-primitiboak', 'porta-zaina'], {
          tone: 'emphasis',
          writes: 'b-beheko',
          plain: 'Beheko kabara hanketako eta sabeleko odola heltzen da.',
        }),
        L(0.6, 'Behin betiko beheko kabak hiru atal ditu: atal sakrokardinala, gibel atala eta giltzurrun atala.', n('3.2/p17/s1'), ['beheko-kaba-zaina', 'kabaren-segmentu-sakrokardinala', 'kabaren-gibel-segmentua', 'kabaren-giltzurrun-segmentua'], {
          plain: 'Beheko kaba hiru zatiz osatuta dago, hiru jatorritatik.',
        }),
      ],
      board: [
        { id: 'b-goiko', kind: 'line', text: 'Goiko kaba ← bi zain brakiozefalikoak + azigos zaina', notes: n('3.2/p14/s1', '3.2/p14/s2'), key: true },
        { id: 'b-beheko', kind: 'line', text: 'Beheko kaba ← beheko gorputz adarrak (iliakoak), porta, abdomeneko erraiak', notes: n('3.2/p15/s1'), key: true },
      ],
      checks: [
        {
          kind: 'contrast',
          id: 'klasea:13/goiko-beheko',
          concept: 'goiko-kaba-zaina',
          q: 'Goiko eta beheko kaba zainak: zer iristen da bakoitzera?',
          options: [
            'Goikora brakiozefalikoak eta azigosa; behekora iliakoak, porta eta abdomeneko erraiak',
            'Goikora iliakoak eta porta; behekora brakiozefalikoak eta azigosa',
            'Bietara brakiozefalikoak',
            'Azigosa behekora; brakiozefalikoak goikora',
          ],
          answer: 0,
          why: ['Bai.', 'Ez: alderantziz da.', 'Ez: goikora bakarrik.', 'Ez: azigosa goiko kabara heltzen da.'],
          notes: n('3.2/p14/s1', '3.2/p14/s2', '3.2/p15/s1'),
          after: 1,
        },
        { kind: 'fill', id: 'klasea:13/taula', table: 'taula', blanks: ['tz-giltz', 'tz-brakio', 'tz-azigos'] },
      ],
    },

    {
      id: 'fetua',
      title: 'Jaio aurreko zirkulazioa',
      stage: 'jaio-aurretik',
      lines: [
        L(0.05, 'Jaio baino lehen, karenako odol oxigenatua, %80koa, ezkerreko zilborreko zainetik itzultzen da.', n('4.1.1/p3/s1'), ['karena', 'ezkerreko-zilbor-zaina'], {
          tone: 'emphasis',
          writes: 'b-fetua1',
          plain: 'Fetuan, karenako odol ona ezkerreko zilborreko zainetik dator. Oso oxigenatuta dago.',
        }),
        L(0.2, 'Hodi benosoak zilborreko odol hori zuzenean beheko kaba zainara eramaten du.', n('4.1.1/p3/s1'), ['hodi-benosoa', 'beheko-kaba-zaina'], {
          plain: 'Hodi benosotik, odol hori beheko kabara pasatzen da.',
        }),
        L(0.3, 'Bena portatik datorren oxigeno gutxiko odolarekin ere nahasten da, eta oxigenoa jaisten da.', n('4.1.1/p3/s7', '4.1.1/p3/s8'), ['porta-zaina'], {
          plain: 'Han, portako odol txarrarekin nahasten da, eta oxigeno gutxiago geratzen da.',
        }),
        L(0.37, 'Odol nahastu hori eskuineko aurikulara iristen da, eta gehiena, ez osoa, zulo obaletik ezkerreko aurikulara pasatzen da.', n('4.1.1/p3/s9'), ['eskuineko-aurikula', 'zulo-obala', 'ezkerreko-aurikula-jaiotakoan'], {
          tone: 'emphasis',
          plain: 'Odola eskuineko aurikulara heltzen da, eta gehiena zulo obaletik ezkerrera pasatzen da.',
        }),
        L(0.72, 'Biriketan erresistentzia handia dago. Horregatik, odol gehiena hodi arteriosotik pasatzen da, eta ez biriketatik.', n('4.1.2/p3/s6', '4.1.2/p3/s7'), ['birikak', 'hodi-arteriosoa'], {
          tone: 'emphasis',
          writes: 'b-fetua2',
          plain: 'Fetuaren birikak itxita bezala daude. Odolak hodi arteriosotik egiten du ihes.',
        }),
        L(0.88, 'Zilborreko arterietako odolaren saturazioa askoz baxuagoa da, %58 ingurukoa, eta karenara itzultzen da oxigenatzeko.', n('4.1.2/p3/s10', '4.1.2/p3/s11'), ['zilbor-arteriak', 'karena'], {
          plain: 'Zilborreko arterietatik doan odolak oxigeno gutxiago du, eta karenara itzultzen da berriz kargatzeko.',
        }),
      ],
      board: [
        { id: 'b-fetua1', kind: 'line', text: 'Ezkerreko zilborreko zaina (%80) → hodi benosoa → beheko kaba → eskuineko aurikula → zulo obala → ezkerreko aurikula', notes: n('4.1.1/p3/s1', '4.1.1/p3/s9'), key: true },
        { id: 'b-fetua2', kind: 'line', text: 'Biriketan erresistentzia handia: odol gehiena hodi arteriosotik aortara', notes: n('4.1.2/p3/s6', '4.1.2/p3/s7') },
      ],
      checks: [
        {
          kind: 'contrast',
          id: 'klasea:13/saturazioak',
          concept: 'zilbor-arteriak',
          q: 'Zilborreko zaina eta zilborreko arteriak: zer saturazio?',
          options: ['Zainak %80 inguru; arteriek %58 inguru', 'Zainak %58 inguru; arteriek %80 inguru', 'Biek %80 inguru', 'Biek %58 inguru'],
          answer: 0,
          why: ['Bai: zainak karenako odola dakar.', 'Ez: alderantziz da.', 'Ez: arteriek askoz gutxiago.', 'Ez: zainak %80.'],
          notes: n('4.1.1/p3/s1', '4.1.2/p3/s10'),
        },
        { kind: 'pool', id: 'mikro:13/jaio-aurretik:4', after: 3 },
        { kind: 'pool', id: 'w13-q-hodi-arteriosoa' },
      ],
    },

    {
      id: 'jaiotza',
      title: 'Jaiotzako aldaketak',
      stage: 'jaiotza',
      lines: [
        L(0.05, 'Jaiotza momentuan birika zirkulazioa hasten da.', n('4.2/p3/s1'), ['birikak'], { tone: 'emphasis', plain: 'Jaiotzean, birikak lanean hasten dira.' }),
        L(0.25, 'Zilborreko arteriak ixten dira. Urrutiko atala zilborreko erdialdeko lotailuak bihurtzen da, fibrosiaren ondorioz.', n('4.2/p4/s1', '4.2/p5/s1'), ['zilbor-arteriak', 'erdialdeko-zilbor-lotailua'], {
          plain: 'Zilborreko arteriak itxi egiten dira. Mutur urruna lotailu bihurtzen da.',
        }),
        L(0.35, 'Hurbileko atala irekita geratzen da: goiko gernu maskuriaren arteriak, barneko arteria iliakoen zatiak.', n('4.2/p6/s1'), ['goiko-gernu-maskuri-arteria', 'barneko-arteria-iliakoa'], {
          writes: 'b-zilborart',
          plain: 'Hurbileko zatia irekita geratzen da, eta arteria izaten jarraitzen du.',
        }),
        L(0.45, 'Ezkerreko zilborreko zaina gibeleko lotailu borobila bihurtzen da.', n('4.2/p8/s1'), ['gibeleko-lotailu-borobila'], { plain: 'Zilborreko zaina lotailu bat bihurtzen da: gibeleko lotailu borobila.' }),
        L(0.55, 'Hodi benosoa gibeleko lotailu benosoa bihurtzen da.', n('4.2/p9/s1'), ['gibeleko-lotailu-benosoa'], { plain: 'Hodi benosoa ere lotailu bihurtzen da.' }),
        L(0.65, 'Hodi arteriosoa ere ixten da, hirugarren hilabeterako, eta lotailu arteriosoa bihurtzen da.', n('4.2/p10/s1'), ['lotailu-arteriosoa'], { plain: 'Hodi arteriosoa hilabete batzuk geroago ixten da, eta lotailu bihurtzen da.' }),
        L(0.67, 'Horrela, birika arteriaren eta aortaren arteko komunikazioa eteten da.', n('4.2/p10/s3'), ['birika-arteria'], { plain: 'Birika arteriaren eta aortaren arteko bidea mozten da.' }),
        L(0.75, 'Jaio ostean ezkerreko aurikularen presioa handitzen da, eta zulo obalaren balbula septum secundumaren aurka estutzen da.', n('4.2/p11/s1'), ['ezkerreko-aurikula-jaiotakoan', 'zulo-obalaren-balbula', 'septum-secundum'], {
          tone: 'emphasis',
          writes: 'b-fo',
          plain: 'Ezkerreko aurikulan presioa igotzen da, eta balbula itxi egiten da.',
        }),
        L(0.93, 'Hala ere, kasuen %20an komunikazioa iragazkor geratzen da: odol apur bat pasa daiteke.', n('4.2/p11/s4'), ['zulo-obala'], { plain: 'Bost pertsonatik batengan zulo txiki bat geratzen da.' }),
      ],
      board: [
        { id: 'b-zilborart', kind: 'line', text: 'Zilborreko arteriak: urrutikoa → erdialdeko zilbor lotailuak; hurbilekoa → goiko gernu maskuriaren arteriak', notes: n('4.2/p5/s1', '4.2/p6/s1'), key: true },
        { id: 'b-fo', kind: 'line', text: 'Ezkerreko aurikularen presioa ↑: zulo obalaren balbula septum secundumaren aurka; %20an iragazkor', notes: n('4.2/p11/s1', '4.2/p11/s4') },
      ],
      checks: [
        {
          kind: 'contrast',
          id: 'klasea:13/zilbor-arteria-atalak',
          concept: 'goiko-gernu-maskuri-arteria',
          q: 'Zilborreko arterien bi atalak: zer bihurtzen dira?',
          options: [
            'Urrutikoa erdialdeko zilbor lotailuak; hurbilekoa goiko gernu maskuriaren arteriak',
            'Urrutikoa goiko gernu maskuriaren arteriak; hurbilekoa erdialdeko zilbor lotailuak',
            'Biak lotailu bihurtzen dira',
            'Biak irekita geratzen dira',
          ],
          answer: 0,
          why: ['Bai.', 'Ez: alderantziz da.', 'Ez: hurbilekoa irekita geratzen da.', 'Ez: urrutikoa lotailu bihurtzen da.'],
          notes: n('4.2/p5/s1', '4.2/p6/s1'),
          after: 2,
        },
        { kind: 'pool', id: 'w13-q-lotailu-borobila' },
      ],
    },

    {
      id: 'heldua',
      title: 'Jaio osteko zirkulazioa',
      stage: 'jaio-ondoren',
      lines: [
        L(0.06, 'Jaio ondoren, zain odol guztia goiko eta beheko kaba zainen bidez eskuineko aurikulara iristen da.', n('4.3/p3/s1'), ['goiko-kaba-zaina', 'beheko-kaba-zaina', 'eskuineko-aurikula'], {
          plain: 'Gorputzeko zain odola bi kaba zainetatik eskuineko aurikulara heltzen da.',
        }),
        L(0.4, 'Biriketan oxigenatuta, odola lau birika zainetatik ezkerreko aurikulara itzultzen da, eta ezkerreko bentrikulura pasatzen da.', n('4.3/p3/s4'), ['birikak', 'birika-zainak', 'ezkerreko-aurikula-jaiotakoan', 'ezkerreko-bentrikulua'], {
          plain: 'Biriketako odol ona birika zainetatik ezkerreko bihotzera itzultzen da.',
        }),
        L(0.62, 'Aortaren irteeran balbula bat dago, hiru balboz osatua; alboko poltsatxoak Valsalvaren sinuak dira.', n('4.3/p4/s1'), ['aorta-balbula', 'valsalva-sinuak'], {
          tone: 'emphasis',
          writes: 'b-valsalva',
          plain: 'Aortaren hasieran hiru atal dituen balbula bat dago. Atal bakoitzaren ondoan poltsatxo bat dago: Valsalvaren sinuak.',
        }),
        L(0.72, 'Sinu horien paretetatik arteria koronarioak irteten dira; aorta makotik, arteria brakiozefalikoa eta ezkerreko karotida komuna.', n('4.3/p4/s2'), ['arteria-koronarioak', 'aortaren-makoa', 'enbor-brakiozefalikoa', 'karotida-komuna'], {
          plain: 'Sinu horietatik bihotzaren arteriak ateratzen dira. Aorta makotik, buruko eta besoko arteriak.',
        }),
      ],
      board: [{ id: 'b-valsalva', kind: 'line', text: 'Aortaren balbula: 3 balbo; Valsalvaren sinuak → arteria koronarioak', notes: n('4.3/p4/s1', '4.3/p4/s2') }],
      checks: [
        {
          kind: 'contrast',
          id: 'klasea:13/fetua-heldua',
          concept: 'zulo-obala',
          q: 'Fetuan eta jaio ondoren: nora doa beheko kabatik eskuineko aurikulara heltzen den odol gehiena?',
          options: ['Fetuan zulo obaletik ezkerreko aurikulara; jaio ondoren eskuineko bentrikulura', 'Fetuan eskuineko bentrikulura; jaio ondoren zulo obaletik ezkerreko aurikulara', 'Bietan eskuineko bentrikulura', 'Bietan zulo obaletik ezkerreko aurikulara'],
          answer: 0,
          why: ['Bai: jaiotzean zulo obala ixten da.', 'Ez: alderantziz da.', 'Ez: fetuan gehiena zulo obaletik doa.', 'Ez: jaio ondoren zulo obala itxita dago.'],
          notes: n('4.1.1/p3/s9', '4.3/p3/s2'),
        },
        { kind: 'pool', id: 'mikro:13/jaio-ondoren:4' },
      ],
    },

    {
      id: 'linfa',
      title: 'Linfa sistema',
      stage: 'linfa',
      lines: [
        L(0.06, 'Azkenik, linfa sistema: linfa zakuak eta linfa hodiak alboko mesodermoaren errai orritik garatzen dira.', n('5/p3/s1'), ['linfa-hodiak'], {
          plain: 'Linfa sistemaren zakuak eta hodiak mesodermoaren geruza batetik sortzen dira.',
        }),
        L(0.16, 'Buruko, lepoko, enborreko eta goiko gorputz adarretako linfa hodiak bi linfa zaku yugularretara iristen dira.', n('5/p4/s1', '5/p4/s2'), ['linfa-hodiak', 'linfa-zaku-yugularrak'], {
          plain: 'Gorputzaren goiko aldeko linfa lepoko bi zakuetara heltzen da.',
        }),
        L(0.35, 'Abdomenean, berriz, lau linfa zaku daude. Lehena, peritoneo atzeko linfa zakua, peritoneoaren atzekaldean.', n('5/p5/s1', '5/p6/s1'), ['peritoneo-atzeko-linfa-zakua'], {
          plain: 'Sabelean lau zaku daude. Lehena peritoneoaren atzean dago.',
        }),
        L(0.45, 'Kiloren zisterna, Pecquet zisterna ere deitua: abdomenean dago, eta garrantzitsuena da.', n('5/p7/s1'), ['kiloren-zisterna'], {
          tone: 'emphasis',
          writes: 'b-zisterna',
          plain: 'Bigarrena kiloren zisterna da, sabeleko zaku nagusia.',
        }),
        L(0.55, 'Eta bi atzeko linfa zaku, barneko eta kanpoko zain iliakoak batzen diren tokian.', n('5/p8/s1', '5/p9/s1'), ['atzeko-linfa-zakuak', 'kanpoko-zain-iliakoak', 'barneko-zain-iliakoak'], {
          plain: 'Azkenik, bi zaku pelbisean, zain iliakoak elkartzen diren tokian.',
        }),
        L(0.66, 'Linfa guztia kiloren zisternara doa, eta hortik bi hodi toraxiko igotzen dira.', n('5/p9/s1'), ['kiloren-zisterna', 'hodi-toraxikoa'], {
          plain: 'Zaku guztietako linfa zisternara biltzen da, eta hortik bi hodi igotzen dira.',
        }),
        L(0.75, 'Garapenean, bakarra mantentzen da: toraxeko linfa hodia.', n('5/p9/s2'), ['hodi-toraxikoa'], { plain: 'Bi hodi horietatik bat bakarrik geratzen da.' }),
        L(0.86, 'Hodi toraxikoak diafragma zeharkatzen du, mediastinotik igotzen da eta ezkerrerantz jotzen du, ezkerreko lotura yugulosubklabikoraino.', n('5/p10/s1'), ['hodi-toraxikoa', 'diafragma', 'lotura-yugulosubklabikoa'], {
          tone: 'emphasis',
          writes: 'b-toraxikoa',
          plain: 'Hodi toraxikoa diafragmatik igarotzen da, bularrean gora doa, eta ezkerreko lepoan zain odolera sartzen da.',
        }),
        L(0.95, 'Lotura hori ezkerreko zain yugularra eta ezkerreko subklabioa elkartzen diren puntua da.', n('5/p10/s2'), ['zain-subklabioak'], {
          plain: 'Puntu hori lepoko zaina eta besoko zaina elkartzen diren tokia da.',
        }),
      ],
      board: [
        { id: 'b-zisterna', kind: 'line', text: 'Kiloren (Pecquet) zisterna: abdomeneko linfa zakurik garrantzitsuena', notes: n('5/p7/s1') },
        { id: 'b-toraxikoa', kind: 'line', text: 'Hodi toraxikoa: kiloren zisterna → diafragma → mediastinoa → ezkerreko lotura yugulosubklabikoa', notes: n('5/p9/s1', '5/p10/s1'), key: true },
      ],
      checks: [
        {
          kind: 'contrast',
          id: 'klasea:13/hodi-toraxikoa',
          concept: 'hodi-toraxikoa',
          q: 'Hodi toraxikoa: non hasten eta non irekitzen da?',
          options: [
            'Kiloren zisternan hasi; ezkerreko lotura yugulosubklabikoan ireki',
            'Ezkerreko lotura yugulosubklabikoan hasi; kiloren zisternan ireki',
            'Linfa zaku yugularretan hasi; kiloren zisternan ireki',
            'Kiloren zisternan hasi; azigos zainean ireki',
          ],
          answer: 0,
          why: ['Bai.', 'Ez: alderantziz da.', 'Ez: zisternatik gora doa.', 'Ez: ezkerreko lotura yugulosubklabikoan irekitzen da.'],
          notes: n('5/p9/s1', '5/p10/s1'),
        },
        { kind: 'pool', id: 'mikro:13/linfa:0' },
      ],
    },

    {
      id: 'amaiera',
      title: 'Laburpena',
      stage: 'laburpena',
      lines: [
        L(0.7, 'Gogoratu: hiru zain bikote, eta anastomosien bidez ezkerreko odola eskuinera pasatzen da.', n('1/p3/s1', '3/p4/s1'), [], { tone: 'summary', plain: 'Laburpena: hiru zain mota, eta odola ezkerretik eskuinera.' }),
        L(0.7, 'Fetuan, odol oxigenatua zilborreko zainetik dator, eta zulo obaletik eta hodi arteriosotik ihes egiten du.', n('4.1.1/p3/s1', '4.1.1/p3/s9', '4.1.2/p3/s7'), [], {
          tone: 'summary',
          plain: 'Fetuan bi lasterbide daude, eta jaiotzean ixten dira.',
        }),
        L(0.7, 'Eta linfa guztia hodi toraxikotik ezkerreko lotura yugulosubklabikora itzultzen da.', n('5/p10/s1'), [], { tone: 'summary', plain: 'Linfa, azkenean, zain odolera itzultzen da.' }),
      ],
      checks: [
        { kind: 'pool', id: 'w13-q-gibel-segmentua' },
        { kind: 'pool', id: 'w13-q-zulo-obala' },
        { kind: 'pool', id: 'w13-q-hodi-toraxikoa' },
      ],
    },
  ],
};
