import type { ViewGuide, WeekDef } from '@/lib/sim/types';

/**
 * "Irudia ulertu" reading aids for every view of topics 10–12 (the circulatory system), keyed
 * `stage/view`. Each is worded from the notes (w10–w12) and the view's own description: where you
 * stand and which side is which, one thing to watch, how to read the colours, and one question.
 * In a front view the embryo's right is on the viewer's left; the notes' venous sinus figure is seen
 * from behind, so there it is not swapped (w10/3.4/p4/s2).
 */
const FRONT = 'Aurretik ikusita, enbrioiaren eskuina zure ezkerrean dago.';
const TOP = 'Goitik ikusita, aurrea behean dago, eta enbrioiaren eskuina zure ezkerrean.';

export const guides10: Record<string, ViewGuide> = {
  'eskualde-kardiogenikoa/diskoa': {
    orientation: 'Enbrioi-diskoa goitik ikusten ari zara, amniosa kenduta: kraneala goian, kaudala behean. Bizkarretik begiratzen duzunez, enbrioiaren ezkerra zure ezkerrean dago.',
    observe: 'Jarraitu lerro primitiboaren alde zefalikotik ateratzen diren zelulei: plaka neuralaren aurrean eta alboetan ferra forma bat marrazten dute.',
    meaning: 'Ektodermoa gardena da, azpikoa ikusteko. Ferra forma alboko mesodermoaren errai orrian dago, ez ektodermoan.',
    question: 'Ferra formako tutuan, zein da erdiko atala, eta zein alboetakoak?',
    answer: 'Erdian plaka kardiogenikoa, plaka neuralaren alde zefalikoan; alboetan endokardio hodiak.',
  },
  'eskualde-kardiogenikoa/zeharkakoa': {
    orientation: 'Disko lauaren zeharkako mozketa: dortsala goian, bentrala behean. Erdian notokorda; bi alboetan alboko mesodermoa, bi orritan banatuta.',
    observe: 'Begiratu zelomaren azpiko orriari, errai orriari: hor daude odol irlatxoak eta endokardio hodiak. Notokordaren bi alboetan, aorta dortsalak.',
    meaning: 'Diskoa oraindik laua da, tolespenak ez dira hasi. Horregatik daude bi endokardio hodiak elkarrengandik urrun.',
    question: 'Zein orritan sortzen dira odol irlatxoak, eta zer garatzen da haietatik?',
    answer: 'Alboko mesodermoaren errai orrian. Haietatik odoleko zelulak eta odol hodiak garatzen dira.',
  },
  'bihotz-hodia/zeharkakoa': {
    orientation: 'Enbrioiaren zeharkako mozketa bihotzaren mailan: dortsala goian, bentrala behean. Urratsez urrats, disko laua tolestu eta gorputz itxi bihurtzen da.',
    observe: 'Jarraitu bi endokardio hodiei: zeharkako tolespenak erdirantz hurbiltzen ditu, eta fusionatu egiten dira, hodi bakarra sortuz.',
    meaning: 'Geruza bakoitza bere kolorean dago. Barrutik kanpora: endokardioa, bihotz gelatina, miokardioa eta epikardioa.',
    question: 'Zerk eragiten du zeharkako tolespena, eta zer gertatzen zaie endokardio hodiei?',
    answer: 'Somiten hazkuntzak. Endokardio hodiak hurbildu eta fusionatu egiten dira: endokardio hodi bakarra sortzen da.',
  },
  'bihotz-hodia/sagitala': {
    orientation: 'Erdiko mozketa sagitala, 4. gaiko marrazkia bezala: kraneala ezkerrean, kaudala eskuinean, dortsala goian.',
    observe: 'Jarraitu plaka kardiogenikoari tolespen zefalokaudalean: buruaren aurretik abiatzen da, eta lepotik toraxera jaisten da.',
    meaning: 'Nerbio sistema luzetara hazten denez, burua tolestu egiten da eta bihotza haren azpian geratzen da. Mintz bukofaringeoa erreferentzia ona da.',
    question: 'Tolespenaren ondoren, non geratzen da plaka kardiogenikoa?',
    answer: 'Torax barrunbean, entzefalo xixkuen eta mintz bukofaringeoaren alde kaudalean.',
  },
  'bihotz-hodia/3d': {
    orientation: `Bihotz hodia 3D ereduan, kraneala goian. ${FRONT} Arrastatu biratzeko.`,
    observe: 'Begiratu bi endokardio hodiei: goitik behera fusionatzen dira. Atzean, bi aorta dortsalak goitik behera doaz.',
    meaning: 'Hau apunteetako mozketa frontala da, baina biratu daiteke: albotik ikusten da aortak hodiaren atzean daudela.',
    question: 'Zein norabidetan fusionatzen dira endokardio hodiak?',
    answer: 'Alde zefalikoan hasi eta alde kaudalera arte, bihotz hodi bakarra sortzeko.',
  },
  'zirkulazio-goiztiarra/alboa': {
    orientation: '4. asteko enbrioia ezkerreko aldetik, gorputza gardena: kraneala goian, aurrea ezkerrean, bizkarra eskuinean. Bikote bakoitzeko urruneko hodia ahulago dago, atzean.',
    observe: 'Jarraitu koloreei: gorria odol oxigenatua da, urdina oxigeno gutxikoa. Zilborreko zainak karenatik gorri datoz; bitelinoak eta kardinalak, urdin.',
    meaning: 'Koloreak odolaren oxigenoa erakusten du, ez hodi mota. Zilborreko zainak zainak dira eta gorriak; zilborreko arteriak arteriak dira eta urdinak.',
    question: 'Zergatik dute zilborreko zainek odol oxigenatua?',
    answer: 'Karenatik datozelako: han hartzen ditu odolak oxigenoa eta makromolekulak.',
  },
  'zirkulazio-goiztiarra/3d': {
    orientation: `Bihotz hodia eta haren hodiak 3D ereduan, kraneala goian. ${FRONT} Alboko ikuspegian ezkutatzen diren bi aldeetako hodiak hemen ikusten dira.`,
    observe: 'Behean, zain muturrera, bi aldeetako hiru zain bikoteak iristen dira. Goian, arteria muturretik, arku aortikoak aorta dortsaletara doaz.',
    meaning: 'Zainak eta arteriak bikoitiak dira, ezker eta eskuin. Bi aldeetako zainen odola bihotzean nahasten da, atrio primitiboan.',
    question: 'Zein dira zain muturrera iristen diren hiru zain bikoteak?',
    answer: 'Zilborreko zainak, zain bitelinoak eta zain kardinal komunak.',
  },
  'bihotz-atalak/3d': {
    orientation: `Bihotz hodia 3D ereduan, kraneala goian. ${FRONT} Perikardio barrunbea gardena da; azpian septum transversuma, atzean aurreko hestea eta aorta dortsalak.`,
    observe: 'Irakurri hodia goitik behera, kolore bakoitza atal bat: atal bulbarra, atal bentrikularra, atal aurikularra eta zain sinua.',
    meaning: 'Kolore hauek 10. eta 11. gaietan berdinak dira: bulboa berdea, bentrikulua urdin-berdea, aurikula laranja, zain sinua morea. Jarraitu haiei lakioan eta trenkadetan.',
    question: 'Zein ordenatan igarotzen da odola bihotz hodiaren ataletatik?',
    answer: 'Zainak, zain sinuak, atal aurikularra, atal bentrikularra eta atal bulbarra: zain muturretik arteria muturrera.',
  },
  'bihotz-lakioa/3d': {
    orientation: `Bihotz hodia 3D ereduan; kamerak mugimendu bakoitza bere aldetik erakusten du. ${FRONT} Zuri gardena: hasierako hodi zuzena.`,
    observe: 'Konparatu koloretako lakioa hodi zuriarekin: bulboa aurrera, behera eta eskuinera doa; aurikula eta zain sinua atzera, gora eta ezkerrera.',
    meaning: 'Hodi zuria erreferentzia da: atal bakoitza nondik abiatu den erakusten du. Aurrera eta atzera albotik ikusten dira ondoen.',
    question: 'Lakioa amaitzean, non geratzen dira atal bulbarra eta atal aurikularra?',
    answer: 'Atal bulbarra aurre-eskuinaldean; atal aurikularra goi-atzekaldean. Atal bentrikularra ezkerrean geratzen da.',
  },
  'atal-bulbarra/3d': {
    orientation: 'Bihotz lakioa 3D ereduan, aurretik eta eskuinetik, kraneala goian. Goian aorta zakua; bi aldeetan arku aortikoak, atzeko aorta dortsaletara.',
    observe: 'Irakurri bulboa behetik gora: hurbileko atala, arteria konoa eta enbor arteriosoa, bakoitza bere kolorean. Pareta gardenaren barruan, bakoitzetik sortzen dena.',
    meaning: 'Barruko formak etorkizuna dira: hurbileko atalean muskulu trenkadak, konoan bi infundibulu, enborrean bi sustrai. Urdina birika aldea da, gorria aorta aldea.',
    question: 'Zer sortzen da arteria konotik?',
    answer: 'Bi bentrikuluen atal lisoak edo infundibuluak: eskuinekotik birika arteria irtengo da, ezkerrekotik aorta.',
  },
  'atal-bulbarra/eratorriak': {
    orientation: 'Laburpen laua, ez mozketa bat: arteria bulboa zutik, aorta zakua goian.',
    observe: 'Azpiatal bakoitzaren ondoan, hartatik sortzen dena: muskulu trenkadak, trenkadak banatutako bi espazioak (zeharkako mozketan) eta sustraiak.',
    meaning: '3D ereduaren informazio bera da, lau eta zutik, gogoratzeko errazago.',
    question: 'Bulboaren zein azpiataletik sortzen da eskuineko bentrikuluaren atal trabekulatua?',
    answer: 'Hurbileko ataletik, zabalenetik: haren paretan muskulu trenkadak agertzen dira.',
  },
  'atal-bentrikularra/frontala': {
    orientation: `Bihotzaren mozketa frontala, kraneala goian. ${FRONT} Goian aurikula komuna, behean bi hasierako bentrikuluak.`,
    observe: 'Bilatu erreten aurikulubentrikularra: ezkerreko bentrikuluaren gainean dago. Gero bilatu bi bentrikuluen arteko zuloa.',
    meaning: 'Bi bentrikuluek jatorri desberdina dute: eskuinekoa bulboaren hurbileko ataletik (berdea), ezkerrekoa atal bentrikularretik (urdin-berdea).',
    question: 'Nola daude komunikatuta bi hasierako bentrikuluak?',
    answer: 'Bentrikulu arteko zulo primarioaren bitartez.',
  },
  'atal-bentrikularra/3d': {
    orientation: `Bihotz lakioa 3D ereduan: bentrikuluak aurrean, atal aurikularra goi-atzekaldean. ${FRONT}`,
    observe: 'Biratu eta begiratu albotik: erreten aurikulubentrikularrak atzeko aurikula aurreko atal bentrikularrarekin lotzen du.',
    meaning: 'Kolore berak 11. gaian jarraitzen du: eskuineko bentrikulua berdea izango da (bulbotik), ezkerrekoa urdin-berdea (atal bentrikularretik).',
    question: 'Zerk komunikatzen du atal bentrikularra atal aurikularrarekin?',
    answer: 'Erreten (hodi) aurikulubentrikularrak. Atal aurikularra goi-atzekaldean geratu da.',
  },
  'atal-aurikularra/3d': {
    orientation: 'Bihotz lakioa 3D ereduan; kamera aurretik, eskuinetik eta atzetik doa. Perikardio barrunbea gardena da.',
    observe: 'Jarraitu enbor arteriosoari: eskuinetik erdira mugitzen da, eta aldi berean aurikula komunean bi alboko zabalkuntza agertzen dira.',
    meaning: 'Bihotzaren atalak plano desberdinetan daude: bentrikuluak aurre-eskuinaldean, aurikulak goi-atzekaldean. Horregatik biratzen da kamera.',
    question: 'Zein dira aurikula komunaren bi alboko zabalkuntzak?',
    answer: 'Hasierako eskuineko aurikula eta hasierako ezkerreko aurikula.',
  },
  'atal-aurikularra/frontala': {
    orientation: `Bihotzaren mozketa frontala, kraneala goian. ${FRONT}`,
    observe: 'Begiratu aurikula komunari: bi alboko zabalkuntza ditu, baina oraindik ez dago trenkadarik haien artean.',
    meaning: 'Bi zabalkuntzak ez dira oraindik bi aurikula: trenkadak sortu behar dira, 11. gaian.',
    question: 'Zerekin daude komunikatuta aurikulak atzekaldean?',
    answer: 'Zain sinuarekin, eta haren bidez zain guztiekin.',
  },
  'zain-sinua/3d': {
    orientation: 'KONTUZ: bihotza ATZETIK ikusten duzu, apunteetako irudian bezala. Beraz, enbrioiaren eskuina zure eskuinean dago: ez dira alderantzikatu behar.',
    observe: 'Begiratu zain sinuari (morea): zeharkako atala eta bi luzapen. Luzapen bakoitzean hiru zain bukatzen dira. Gero ikusi ezkerreko zainak ixten.',
    meaning: 'Ezkerreko odola anastomosien bidez eskuinera desbideratzen da. Horregatik eskuineko luzapena handitzen da, eta ezkerrekoa txikitzen.',
    question: 'Zain sinuaren ezkerreko luzapenetik, zer bi egitura geratzen dira?',
    answer: 'Sinu koronarioa eta ezkerreko aurikularen zain laprana.',
  },
  'zain-sinua/frontala': {
    orientation: `Aurreko mozketa: aurikula komuna aurretik, kraneala goian. 3D ikuspegian ez bezala, hemen enbrioiaren eskuina zure ezkerrean dago.`,
    observe: 'Atzeko paretako zulotik zain sinua ikusten da. Jarraitu zuloari: eskuinerantz mugitzen da, hasierako eskuineko aurikularantz.',
    meaning: 'Bi irudiek gauza bera erakusten dute, bi aldetatik. Ezker eta eskuin beti enbrioiarenak dira, ez pantailarenak.',
    question: 'Nola deitzen da zain sinuaren eta aurikularen arteko zuloa?',
    answer: 'Zulo sinoaurikularra. Hasieran oso zabala da, eta gero eskuinerantz mugitzen da.',
  },
  'eskuineko-aurikula/3d': {
    orientation: 'Eskuineko aurikula aurretik irekita: atzeko pareta duzu aurrean. Aurikula arteko trenkada enbrioiaren ezkerrean dago, hau da, zure eskuinean.',
    observe: 'Jarraitu koloreei: morea zain sinutik dator (atal lisoa); laranja, atal aurikularretik (atal trabekulatua eta belarritxoa).',
    meaning: 'Bi kolore, bi jatorri. Haien muga gandor terminala da, eta haren goiko aldean dago nodulu sinusala.',
    question: 'Zein zain irekitzen dira atal lisoan?',
    answer: 'Goiko bena kaba, beheko bena kaba eta sinu koronarioa.',
  },
  'eskuineko-aurikula/barrutik': {
    orientation: `Eskema laua: eskuineko aurikula aurretik irekita, kraneala goian. ${FRONT} Aurikula arteko trenkada eskuinean dago.`,
    observe: 'Bilatu bi zain balbulak zulo sinoaurikularraren ertzetan, eta jarraitu zer egitura sortzen diren haietatik.',
    meaning: 'Kolore kode bera 3D ereduan: morea zain sinutik, laranja atal aurikularretik.',
    question: 'Zer gertatzen zaio eskuineko zain balbulari?',
    answer: 'Goiko aldean desagertu egiten da; beheko aldetik beheko bena kabaren balbula eta sinu koronarioaren balbula sortzen dira.',
  },
  'eskuineko-aurikula/trenkada': {
    orientation: 'Aurikula arteko trenkada eskuineko aurikularen barrutik, 11. gaian bezala: trenkada irudiaren planoan dago.',
    observe: 'Begiratu septum spuriumari eta ezkerreko zain balbulari: septum secundumarekin fusionatzen dira.',
    meaning: 'Horregatik dira bi egitura horiek aurikula arteko trenkadaren osagai.',
    question: 'Zerekin fusionatzen dira septum spuriuma eta ezkerreko zain balbula?',
    answer: 'Septum secundumarekin, bi aurikulen artean garatzen ari den trenkadarekin.',
  },
  'eskuineko-aurikula/frontala': {
    orientation: `Bihotzaren mozketa frontala, kraneala goian. ${FRONT}`,
    observe: 'Jarraitu moreari: zain sinutik datorren atal lisoa eskuineko aurikularen atzeko eta alboko paretan hazten da.',
    meaning: 'Atal lisoa handitzen da, eta ia atzeko pareta osoa sortzen du. Gainerako pareta atal trabekulatua da.',
    question: 'Nondik dator eskuineko aurikularen atal trabekulatua?',
    answer: 'Bihotz lakioaren atal aurikularretik, hasierako eskuineko aurikulatik.',
  },
};

const ATRIA_3D: ViewGuide = {
  orientation: `Bi aurikulak aurretik irekita, kraneala goian. ${FRONT} Kamerak urrats bakoitzean biratzen du: aurretik, trenkadak bi lerro dira; eskuineko aurikulatik, aurrez aurre ikusten dira.`,
  observe: 'Jarraitu odol zelulei: eskuineko aurikulatik ezkerrekora, zuloetatik igarotzen dira. Zulo bat ixten denean, beste bat irekita dago.',
  meaning: 'Septum primuma boli kolorekoa da, septum secunduma arrosa, endokardio kuxinak berde argiak. Zain sinutik datorrena morea da.',
  question: 'Ostium primuma itxi aurretik, zer zulo agertzen da, eta zertarako?',
  answer: 'Ostium secunduma, septum primumaren goiko aldean: haren bidez igarotzen da eskuineko aurikulako odola ezkerrekora.',
};

const ATRIA_FRONT: ViewGuide = {
  orientation: `Bihotzaren mozketa frontala, kraneala goian. ${FRONT} Goian aurikulak, erdian erreten aurikulubentrikularra, behean bentrikuluak.`,
  observe: 'Hemen trenkadak lerroak dira. Jarraitu odolaren bideari, eskuineko aurikulatik ezkerrekora.',
  meaning: 'Apunteetako irudia da. Zuloen forma ikusteko, ireki «Eskuineko aurikulatik» ikuspegia.',
  question: 'Nondik nora hazten da septum primuma?',
  answer: 'Aurikula komunaren sabaitik behera, erreten aurikulubentrikularrerantz. Haren beheko aldean ostium primuma geratzen da.',
};

const ATRIA_RIGHT: ViewGuide = {
  orientation: 'Aurikula arteko trenkada eskuineko aurikularen barrutik: trenkada irudiaren planoan dago. Ezkerrean atzekoa, eskuinean aurrekoa; kraneala goian.',
  observe: 'Zulo bakoitzaren atzean ezkerreko aurikula ilun ikusten da. Konparatu zuloen kokapena: bata goian, bestea behean.',
  meaning: 'Zuloak ez daude parez pare. Horregatik da laprana odolaren bidea.',
  question: 'Zergatik da laprana odolaren bidea jaio arte?',
  answer: 'Odola lehenik zulo obaletik igarotzen da (septum secundumaren beheko aldean), eta gero ostium secundumetik (septum primumaren goiko aldean).',
};

const both = (observe: string, question: string, answer: string): ViewGuide => ({
  orientation: `Une bera bi aldetatik. Ezkerrean mozketa frontala: ${FRONT.charAt(0).toLowerCase()}${FRONT.slice(1)} Eskuinean trenkada, eskuineko aurikularen barrutik.`,
  observe,
  meaning: 'Ez dira bi une: urrats beraren bi ikuspegi dira. Frontalean odolaren bidea ikusten da; eskuinetik, trenkaden eta zuloen forma.',
  question,
  answer,
});

export const guides11: Record<string, ViewGuide> = {
  'trenkadatze-mekanismoak/3d': {
    orientation: `Hasieran 10. gaiko bihotz lakioa; gero hiru barrunbe txiki, aurretik irekita. ${FRONT}`,
    observe: 'Konparatu barrunbeak: ezkerreko bietan endokardio kuxinak hazten dira (bi, edo bakarra); eskuinekoan, bi pareta muskular.',
    meaning: 'Barrunbe txikiak eskemak dira, ez bihotzaren atal jakin bat. Odol zelulek irekita geratzen den bidea hartzen dute.',
    question: 'Zertan dira desberdinak bi mekanismoak?',
    answer: 'Lehenengoan endokardio kuxinak hazi eta fusionatzen dira. Bigarrenean bi pareta muskular hazi eta fusionatzen dira, baina trenkada ez da osoa.',
  },
  'septum-primum/3d': ATRIA_3D,
  'septum-primum/biak': both(
    'Bilatu zulo bera bi irudietan: frontalean lerroaren eten bat da; eskuinetik, zulo bat trenkadan.',
    'Zerk ixten du ostium primuma?',
    'Erreteneko endokardio kuxinetatik irteten diren luzapenek.',
  ),
  'septum-primum/frontala': ATRIA_FRONT,
  'septum-primum/eskuinetik': ATRIA_RIGHT,
  'zulo-obala/3d': ATRIA_3D,
  'zulo-obala/biak': both(
    'Ezkerrean odolaren ibilbide laprana; eskuinean zulo obala septum secundumean, eta ostium secunduma haren atzean.',
    'Non dago septum secunduma, septum primumarekiko?',
    'Haren eskuinaldean. Aurikularen sabaitik hazten da, eta beheko aldean zulo obala du.',
  ),
  'zulo-obala/frontala': ATRIA_FRONT,
  'zulo-obala/eskuinetik': ATRIA_RIGHT,
  'jaiotza/3d': ATRIA_3D,
  'jaiotza/biak': both(
    'Ezkerrean, balbula septum secundumaren aurka; eskuinean, lupa bi trenkadetan.',
    'Zer gertatzen da bi trenkaden fusioa osoa ez bada?',
    'Arraildura txiki bat geratzen da (kasuen %20an), eta eskuineko aurikulatik ezkerrekora pasua mantentzen da.',
  ),
  'jaiotza/frontala': ATRIA_FRONT,
  'jaiotza/eskuinetik': ATRIA_RIGHT,
  'aurikulen-paretak/3d': {
    orientation: `Bi aurikulak aurretik irekita. ${FRONT} Kamerak pareta bakoitzera biratzen du.`,
    observe: 'Eskuineko aurikulan, atzeko pareta lisoa (morea) eta alboko pareta trabekulatua (laranja). Ezkerrekoan, atzeko pareta gardena, eta atzean birika zainak.',
    meaning: 'Bi aurikuletan eredu bera: atal lisoan zainak irekitzen dira; atal trabekulatua, muskulu pektinioekin, atal aurikularretik dator.',
    question: 'Nondik dator ezkerreko aurikularen atal lisoa?',
    answer: 'Birika zain primitibotik: adarkatu egiten da, eta lau birika zain iristen dira atzeko paretara.',
  },
  'erreten-ab/3d': {
    orientation: `Bi hasierako bentrikuluak aurretik irekita. ${FRONT} Eskuinekoa berdea da, ezkerrekoa urdin-berdea: 10. gaiko jatorrien koloreak.`,
    observe: 'Kamerak albotik begiratzen du, plano frontal urdin batekin: erretena aurrera begira dago, ez gora. Gero, goiko eta beheko kuxinak hurbiltzen dira.',
    meaning: 'Aurikulak bentrikuluen atzean daude, ez gainean. Horregatik dira kuxinak goikoa eta behekoa, eta ez aurrekoa eta atzekoa.',
    question: 'Zein bi zulo sortzen dira erretenean, eta zer komunikatzen dute?',
    answer: 'Ezkerreko eta eskuineko zulo aurikulubentrikularrak: aurikula bakoitza bere bentrikuluarekin.',
  },
  'balbula-ab/3d': {
    orientation: `Bi bentrikuluak aurretik irekita. ${FRONT} Atzeko paretan, bi zulo aurikulubentrikularrak.`,
    observe: 'Jarraitu balbei: bentrikuluetara zintzilik daude, eta soka tendinosoek hondoko muskulu papilarrekin lotzen dituzte.',
    meaning: 'Balbak mesenkima goraguneetatik sortzen dira. Odolak haien azalera bentrikularra zulatzen du, eta meheago bihurtzen dira.',
    question: 'Zenbat balba ditu balbula bakoitzak?',
    answer: 'Trikuspideak, eskuinekoak, hiru; bikuspideak edo mitralak, ezkerrekoak, bi.',
  },
  'bentrikulu-arteko-trenkada/3d': {
    orientation: `Bi bentrikuluak aurretik irekita. ${FRONT} Gero eskuineko bentrikulutik begiratzen da, haren pareta gardena dela.`,
    observe: 'Trenkada muskularra hondotik hazten da, baina goian zulo bat uzten du. Begiratu zerk ixten duen.',
    meaning: 'Trenkadaren bi aurpegiak bentrikulu bakoitzaren kolorean daude: berdea eskuinean, urdin-berdea ezkerrean.',
    question: 'Zein bi atal ditu bentrikulu arteko trenkadak?',
    answer: 'Muskularra, bentrikuluen barruko paretetatik, eta mintzezkoa, arteria konoaren trenkadaren beheko aldetik.',
  },
  'arteria-konoa/3d': {
    orientation: `Arteria konoa bentrikuluen sabaian, goian zeharka moztuta. ${TOP}`,
    observe: 'Barruan bi gandor hazten dira, atze-eskuinean eta aurre-ezkerrean. Fusionatzean, trenkada laprana sortzen dute.',
    meaning: 'Odol zelulek erakusten dute nora doan espazio bakoitza: aurre-eskuinekoa eskuineko bentrikuluaren infundibulua da, atze-ezkerrekoa ezkerrekoarena.',
    question: 'Zein arteria irtengo da infundibulu bakoitzetik?',
    answer: 'Eskuineko bentrikuluaren infundibulutik birika arteria; ezkerrekoaren infundibulutik aorta.',
  },
  'enbor-arteriosoa/3d': {
    orientation: `Enbor arteriosoa arteria konoaren gainean. Zeharkako mozketak goitik ikusten dira: ${TOP.charAt(0).toLowerCase()}${TOP.slice(1)}`,
    observe: 'Konparatu hiru mozketak, behetik gora: behean birika arteria aurrean; erdian parez pare; goian aorta aurrean.',
    meaning: 'Gorria aortaren bidea da, urdina birika arteriarena. Trenkada kiribila denez, haien kokapena aldatzen da mailaz maila.',
    question: 'Enbor arteriosoaren tarteko mailan, non dago aorta?',
    answer: 'Eskuinaldean, birika arteriaren parean; birika arteria ezkerraldean dago.',
  },
  'balbula-semilunarrak/3d': {
    orientation: `Aorta eta birika arteria zeharka moztuta. ${TOP}`,
    observe: 'Hodi bakoitzean hiru goragune hazten dira, eta goitik zulatzen dira: hiru balba ahur.',
    meaning: 'Balba bakoitza enara kabi bat bezalakoa da, goitik irekia. Aortaren alboko bi balben sinuetatik irteten dira arteria koronarioak.',
    question: 'Zein balba ditu aorta balbulak, eta zein birika balbulak?',
    answer: 'Aortan, bi alboko eta atzeko bat; birika balbulan, bi alboko eta aurreko bat.',
  },
  'jatorriak/3d': {
    orientation: `${FRONT} Aurikulen urratsean atzetik ikusten da: orduan eskuina zure eskuinean dago.`,
    observe: 'Hodia, lakioa eta bihotza leku berean daude: begiratu kolore bakoitza non geratzen den bihotz osoan.',
    meaning: 'Kolorea jatorria da, ez funtzioa: berdea hurbileko atala, urdin-berdea atal bentrikularra, lima konoa, marfila enborra, laranja atal aurikularra, morea zain sinua.',
    question: 'Zein ataletik datoz eskuineko bentrikuluaren bi atalak, trabekulatua eta lisoa?',
    answer: 'Trabekulatua bulboaren hurbileko ataletik; lisoa (infundibulua) arteria konotik.',
  },
};

/** Topic 12 (the arteries): the arch models are seen from the front, the embryo from its left. */
const ARCH_FRONT = 'Aurretik ikusita, enbrioiaren ezkerra zure eskuinean dago. Arrastatu biratzeko.';
const SIDE = 'Enbrioia ezkerretik, gorputza gardena: burua goian, bizkarra zure ezkerrean. Arrastatu biratzeko.';
const BODY_FRONT = 'Aurretik ikusita, gorputzaren ezkerra zure eskuinean dago. Arrastatu biratzeko.';

export const guides12: Record<string, ViewGuide> = {
  'sarrera/3d': {
    orientation: `5. asteko enbrioia. ${SIDE}`,
    observe: 'Jarraitu odolari: bihotz lakiotik arteria enborrera, aorta arkuetatik aorta dortsaletara, eta handik zilborreko eta bitelo arterietara.',
    meaning: 'Koloreak odolaren oxigenoa erakusten du, ez hodi mota. Zain guztien odola bihotz lakioan nahasten da.',
    question: 'Zein zainek dakarte odol oxigenatua bihotzera?',
    answer: 'Zilborreko zainek, karenatik. Bitelo eta kardinal zainek oxigeno gutxiko odola dakarte.',
  },
  'arku-sistema/3d': {
    orientation: `Aorta zakua, aorta arkuak eta bi aorta dortsalak, kraneala goian. ${ARCH_FRONT}`,
    observe: 'Jarraitu arkuei: aorta zakutik bi alboetara ateratzen dira, eta atzean aorta dortsaletara iristen dira, bikotez bikote.',
    meaning: 'Kolore bakoitza jatorri bat da: zakua, arku bakoitza eta aorta dortsalak. Kolore berak hurrengo urratsetan eta heldutan jarraitzen du.',
    question: 'Non fusionatzen dira bi aorta dortsalak?',
    answer: 'T4 mailatik behera: aorta dortsal bakarra sortzen da. Gainetik bananduta jarraitzen dute.',
  },
  'eguna-27/3d': {
    orientation: `Aorta arkuak 27. egunean, 4 mm-ko enbrioian. ${ARCH_FRONT}`,
    observe: 'Konparatu arkuak: lehena eta bigarrena txikitzen ari dira, hirugarrena handia da, laugarrena hasten da, bostgarrena ia ez dago.',
    meaning: 'Lehen bi arkuetatik zati txiki bat geratzen da: arteria maxilarrak, hioide arteria eta ointokiko arteria.',
    question: 'Zein arkutik ateratzen dira hasierako birika arteriak?',
    answer: 'Seigarren arkutik: adartxo horiek birika enborrarekin lotuko dira.',
  },
  'eguna-29/3d': {
    orientation: `Aorta arkuak 29. egunean, 10 mm-ko enbrioian. ${ARCH_FRONT}`,
    observe: 'Begiratu enbor arteriosoari: trenkadak bitan banatzen du, goranzko aorta eta birika enborra. Gero, aorta zakuaren bi luzapenei.',
    meaning: 'Luzapenak ez dira simetrikoak: ezkerrekoa lodiagoa da, eskuinekoa estuagoa. Kolore bakoitza helduan ere bere lekuan geratzen da.',
    question: 'Zer sortzen du aorta zakuaren eskuineko luzapenak?',
    answer: 'Arteria brakiozefalikoa: hortik eskuineko karotida komuna eta eskuineko subklabioa.',
  },
  'hirugarren-arkua/3d': {
    orientation: `Lehen hiru arkuak eta karotidak. ${ARCH_FRONT}`,
    observe: 'Jarraitu hirugarren arkuari: karotida komuna eta barneko karotidaren hasiera bihurtzen da. Goian, aorta dortsalak barneko karotida osatzen du.',
    meaning: 'Hirugarren arkuak berdin garatzen dira bi aldeetan. Kanpoko karotida kimu berri bat da, karotida komunetik.',
    question: 'Nondik dator barneko karotidaren urrutiko zatia?',
    answer: 'Aorta dortsalaren alde kranealetik.',
  },
  'laugarren-arkua/3d': {
    orientation: `Laugarren arkuak eta subklabioak. ${ARCH_FRONT}`,
    observe: 'Konparatu bi aldeak: ezkerreko arkua aortaren makoan geratzen da; eskuinekoa eskuineko subklabioaren hasiera da.',
    meaning: 'Eskuineko subklabioak hiru jatorri ditu, hiru kolore: laugarren arkua, eskuineko aorta dortsala eta zazpigarren segmentu arteko arteria.',
    question: 'Nondik dator ezkerreko arteria subklabioa?',
    answer: 'Ezkerreko zazpigarren segmentu arteko arteriatik; gero gorago kokatzen da, karotidatik gertu.',
  },
  'seigarren-arkua/3d': {
    orientation: `Seigarren arkuak eta birika enborra. ${ARCH_FRONT}`,
    observe: 'Konparatu bi aldeak: ezkerrean arkua osorik geratzen da; eskuinean urrutiko zatia desagertzen da.',
    meaning: 'Hurbileko zatiak birika arteriak dira. Ezkerreko urrutiko zatia hodi arteriosoa da: ezkerreko birika arteria eta aorta lotzen ditu.',
    question: 'Zer gertatzen da eskuineko seigarren arkuaren urrutiko zatiarekin?',
    answer: 'Desagertu egiten da. Hurbileko zatitik eskuineko birika arteria sortzen da.',
  },
  'beste-aldaketak/3d': {
    orientation: `Arku sistema osoa eta bihotza. ${ARCH_FRONT}`,
    observe: 'Lau aldaketa: hodi karotideoak desagertzen dira, eskuineko aorta dortsalaren zati bat ere bai, bihotza jaisten da eta ezkerreko subklabioa igotzen da.',
    meaning: 'Bihotza toraxera jaistean, haren adarrak luzatu egiten dira. Horregatik dira hain luzeak karotida komunak eta arteria brakiozefalikoa.',
    question: 'Zein aorta dortsaletik sortzen da beheranzko aorta?',
    answer: 'Ezkerreko aorta dortsaletik: eskuinekoaren zati bat desagertu egiten da.',
  },
  'nerbio-atzerakariak/3d': {
    orientation: `Arkuak, bi nerbio bagoak eta laringea. ${ARCH_FRONT}`,
    observe: 'Jarraitu nerbio laringeo atzerakari bakoitzari: arteria baten azpitik buelta eman, eta laringera igotzen da.',
    meaning: 'Nerbioa arteria baten azpitik igarotzen da; arteria hori desagertzean, hurrengoaren azpian geratzen da. Horregatik dira desberdinak bi aldeak.',
    question: 'Zer inguratzen du ezkerreko nerbio laringeo atzerakariak helduan?',
    answer: 'Lotailu arteriosoa: hodi arteriosoa, jaio ondoren itxita.',
  },
  'aorta-heldua/3d': {
    orientation: `Aorta heldua: goranzko aorta, makoa eta beheranzko aorta. ${BODY_FRONT}`,
    observe: 'Begiratu makoaren hiru adarrei: eskuinean arteria brakiozefaliko bakarra; ezkerrean karotida komuna eta subklabioa, bakoitza bere aldetik.',
    meaning: 'Koloreek jatorria gordetzen dute: zakua, laugarren arkua, seigarren arkua, aorta dortsala. Hala ikusten da zati bakoitza nondik datorren.',
    question: 'Zenbat adar ateratzen dira aortaren makotik?',
    answer: 'Hiru: arteria brakiozefalikoa, ezkerreko karotida komuna eta ezkerreko subklabioa.',
  },
  'adar-bentralak/enbrioia': {
    orientation: `5. asteko enbrioia. ${SIDE}`,
    observe: 'Begiratu aortaren aurreko paretari: zilborreko arteriak karenara doaz, eta bitelo arteriak bitelo zakura.',
    meaning: 'Bitelo zakua endekatzean, bitelo arteriak ere bai. Hiru geratzen dira abdomenean: enbor zeliakoa eta bi arteria mesenterikoak.',
    question: 'Zer dira hasieran aurreko errai adarrak?',
    answer: 'Bitelo arteriak, bitelo plexuetatik sortuak.',
  },
  'adar-bentralak/3d': {
    orientation: `Beheranzko aorta, makoaren azpitik. ${BODY_FRONT}`,
    observe: 'Hiru adar taldeak, bakoitza bere kolorean: aurreko errai adarrak laranja, alboko errai adarrak urdina, atze alboko adarrak berdea.',
    meaning: 'Aurreko adarrak hestera doaz: hestegorrira eta aurreko, bitarteko eta atzeko hestera. Zati bakoitzak bere arteria du.',
    question: 'Zein arteriak irrigatzen du bitarteko hestea?',
    answer: 'Goiko arteria mesenterikoak.',
  },
  'alboko-adarrak/3d': {
    orientation: `Beheranzko aorta eta bizkarrezurra. ${BODY_FRONT}`,
    observe: 'Begiratu albora doazen adarrei: giltzurrun gaineko guruinetara, giltzurrunetara eta gonadetara. Gero, atzera doazen segmentu arteko arteriei.',
    meaning: 'Segmentu arteko arteriek izen desberdina dute mailaka: lepoan orno arteriak, toraxean saihets artekoak, gerrian lunbarrak, sakroan alboko sakroak.',
    question: 'Nola sortzen dira orno arteriak?',
    answer: 'Lepoko segmentu arteko arteriak luzetarako anastomosiz lotzen dira, eta aortarekiko lotura galtzen dute.',
  },
  'zilbor-iliakoak/3d': {
    orientation: `Aortaren behealdea eta pelbisa. ${BODY_FRONT}`,
    observe: 'Jarraitu zilborreko arteriei: aortatik askatu, eta barneko arteria iliakoari lotzen zaizkio.',
    meaning: 'Arteria iliako primitiboak gerriko bostgarren segmentu arteko arteriatik datoz. Kanpokoa hankara doa; barnekoa pelbisera.',
    question: 'Zer bihurtzen da zilborreko arteriaren urrutiko zatia jaio ondoren?',
    answer: 'Erdialdeko zilbor lotailua. Hurbileko zatia goiko gernu maskuriaren arteria da.',
  },
  'gorputz-adarrak/3d': {
    orientation: 'Besoa eta hanka, haien ardatz arteriarekin. Arrastatu biratzeko.',
    observe: 'Besoan, arteria guztiak ardatz arteriatik datoz. Hankan, ardatz arteria barneko iliakoari lotzen zaio, eta femoralak hartzen du lekua.',
    meaning: 'Subklabioa besoko arteriekin lotzen da bakarrik: ez da haien jatorria.',
    question: 'Hankako ardatz arteriatik zein arteria sortzen dira?',
    answer: 'Arteria ziatikoa, popliteoa eta peroneoaren zati bat. Gehienak femoraletik datoz.',
  },
};

const VEIN_FRONT = 'Aurretik ikusita, enbrioiaren ezkerra zure eskuinean dago. Arrastatu biratzeko.';

export const guides13: Record<string, ViewGuide> = {
  'sarrera/3d': {
    orientation: `5. asteko enbrioia. ${SIDE}`,
    observe: 'Jarraitu zain sinura iristen diren hiru bikoteei: bitelinoak bitelo zakutik, zilborrekoak karenatik eta kardinal komunak enbrioiaren gorputzetik.',
    meaning: 'Hiru jatorri, hiru kolore: kolore horiek gai osoan zehar jarraitzen dute, heldutan ere. Odol zelulak: gorriak oxigenatuak, urdinak oxigeno gutxikoak.',
    question: 'Zein zainek dakarte odol oxigenatua 5. astean?',
    answer: 'Zilborreko zainek, karenatik. Bitelinoek eta kardinalek oxigeno gutxiko odola dakarte.',
  },
  'zain-nagusiak/3d': {
    orientation: `Zain sinua bere bi luzapenekin eta haietara heltzen diren hiru zain bikoteak. ${VEIN_FRONT}`,
    observe: 'Konparatu bi aldeak: hasieran simetrikoak dira, baina odola eskuinera desbideratzen denean ezkerreko zainak txikitzen dira.',
    meaning: 'Kolore bakoitza jatorri bat da (bitelinoak turkesa, zilborrekoak arrosa, kardinalak urdina): heldu zain bakoitzak bere jatorriaren kolorea gordetzen du.',
    question: 'Zergatik txikitzen dira ezkerreko zainak?',
    answer: 'Odola eskuineko luzapenera desbideratzen delako: eskuineko zainak handitzen dira eta ezkerrekoak txikitu edo desagertu.',
  },
  'bitelinoak/3d': {
    orientation: `Zain bitelinoak, duodenoa eta gibelaren hastapena. ${VEIN_FRONT}`,
    observe: 'Ikusi bitelinoak duodenoaren inguruan plexu bat eratzen, eta gibel hastapena haien gainean hazten, sinusoideak sortuz.',
    meaning: 'Turkesa = bitelinoak. Gibela hodi horien gainean hazten da: haien zatiak sinusoide bihurtzen dira.',
    question: 'Zer sortzen da zain bitelinoek duodenoaren inguruan?',
    answer: 'Zain plexu periduodenala: hortik porta zaina eratuko da.',
  },
  'porta/3d': {
    orientation: `Gibela gardena, porta zaina eta hodi hepatokardiakoak. ${VEIN_FRONT}`,
    observe: 'Jarraitu plexu periduodenalari: anastomosi batzuk geratzen dira eta porta zaina osatzen dute; gibelaren gainean, hodi hepatokardiakoak bihotzera.',
    meaning: 'Porta zainak bitelinoen jatorria du (turkesa). Eskuineko hodi hepatokardiakoa beheko kabaren gibel segmentua izango da.',
    question: 'Nondik dator beheko kabaren gibel segmentua?',
    answer: 'Eskuineko hodi hepatokardiakotik, hau da, eskuineko zain bitelinoaren zati hurbiletik.',
  },
  'zilbor-zainak/3d': {
    orientation: `Zilborreko zainak, gibela eta hodi benosoa. ${VEIN_FRONT}`,
    observe: 'Konparatu bi zilbor zainak: eskuinekoa desagertzen da; ezkerrekoa geratzen da, eta gibelean hodi benosoak beheko kabarekin lotzen du.',
    meaning: 'Arrosa = zilborrekoak. Ezkerreko zilbor zainak karenako odol oxigenatu guztia darama.',
    question: 'Zer lotzen du hodi benosoak?',
    answer: 'Ezkerreko zilbor zaina eta eskuineko hodi hepatokardiakoa (beheko kaba), gibeleko sinusoideak saihestuz.',
  },
  'kardinalak/3d': {
    orientation: `Kardinal zainak eta hiru sistema berriak, bizkarraldetik ikusita. ${VEIN_FRONT}`,
    observe: 'Ikusi hiru sistema berriak agertzen: kardinal azpikoak (laranja), sakrokardinalak (magenta) eta kardinal gainekoak (horia). Atzeko kardinalak desagertzen dira.',
    meaning: 'Kolore bakoitza sistema bat da. Hurrengo urratsetan zain heldu bakoitzak bere sistemaren kolorea izango du.',
    question: 'Zein zain sistema berri agertzen dira 5. eta 7. asteen artean?',
    answer: 'Kardinal azpikoak, sakrokardinalak eta kardinal gainekoak, bikoitzak.',
  },
  'azigos/3d': {
    orientation: `Kardinal gaineko zainak eta azigos sistema, atzetik. ${VEIN_FRONT}`,
    observe: 'Jarraitu kardinal gainekoei: eskuinekoa azigos zaina bihurtzen da, ezkerrekoa hemiazigosa, eta anastomosi batek bata bestearekin lotzen du.',
    meaning: 'Horia = kardinal gainekoak. Eskuineko saihets arteko zainak azigosera heltzen dira; ezkerrekoak hemiazigosetik eta hemiazigos laguntzailetik.',
    question: 'Nondik dator azigos zaina?',
    answer: 'Eskuineko kardinal gaineko zainetik eta eskuineko atzeko kardinalaren hurbileko ataletik.',
  },
  'kaba-zainak/3d': {
    orientation: `Goiko eta beheko kaba zainak, osorik. ${VEIN_FRONT}`,
    observe: 'Ikusi bi kabak eskuineko aurikulara heltzen: goikoa goitik, behekoa behetik. Biak eskuinean daude.',
    meaning: 'Kabek zati asko dituzte, eta zati bakoitzak bere jatorriaren kolorea gordetzen du.',
    question: 'Zergatik daude bi kaba zainak eskuinean?',
    answer: 'Odola eskuineko luzapenera desbideratu zelako: eskuineko zainak geratzen dira eta ezkerrekoak txikitzen dira.',
  },
  'beheko-kaba/3d': {
    orientation: `Beheko kaba zaina eta haren atalak. ${VEIN_FRONT}`,
    observe: 'Jarraitu beheko kabari behetik gora: atal sakrokardinala (magenta), giltzurrun atala (laranja) eta gibel atala (turkesa).',
    meaning: 'Hiru kolore, hiru jatorri: beheko kaba hiru zain sistemaren zatiz osatuta dago.',
    question: 'Nondik dator beheko kabaren giltzurrun segmentua?',
    answer: 'Eskuineko kardinal azpiko zainetik.',
  },
  'sinu-koronarioa/3d': {
    orientation: `Bihotza atzetik: zain sinuaren ezkerreko luzapena. ${VEIN_FRONT}`,
    observe: 'Ikusi ezkerreko luzapena txikitzen: odola galtzen du, eta bihotzaren atzean geratzen da.',
    meaning: 'Ezkerreko luzapenetik bi egitura geratzen dira: sinu koronarioa eta ezkerreko aurikularen zain laprana.',
    question: 'Zer bihurtzen da zain sinuaren ezkerreko luzapena?',
    answer: 'Sinu koronarioa, bihotzaren atzeko paretan; eta hara iristen den ezkerreko aurikularen zain laprana.',
  },
  'goiko-kaba/3d': {
    orientation: `Goiko kaba zaina, zain brakiozefalikoak eta jugularrak. ${VEIN_FRONT}`,
    observe: 'Ikusi aurreko kardinalen arteko anastomosia: ezkerreko zain brakiozefalikoa bihurtzen da eta ezkerreko odola eskuinera darama.',
    meaning: 'Urdina = aurreko kardinalak, urdin argia = kardinal komuna. Biek osatzen dute goiko kaba.',
    question: 'Zerk osatzen du goiko kaba zaina?',
    answer: 'Eskuineko aurreko kardinalaren zati hurbilak eta eskuineko kardinal komunak.',
  },
  'laburpena/3d': {
    orientation: `Zain sistema heldua. ${VEIN_FRONT}`,
    observe: 'Begiratu kolore guztiei batera: zain heldu bakoitzak bere jatorriaren kolorea du. Taulan, zaina eta jatorria.',
    meaning: 'Laburpena: goiko kabara brakiozefalikoak eta azigosa; beheko kabara beheko gorputzeko odol guztia.',
    question: 'Zein zain heltzen da goiko kabara atzetik?',
    answer: 'Azigos zaina: saihets arteko zainen odola dakar.',
  },
  'jaio-aurretik/3d': {
    orientation: `Fetua, zilbor hestea eta karena; bihotza beira moduan. ${BODY_FRONT}`,
    observe: 'Jarraitu zelula gorriei karenatik: zilbor zaina, hodi benosoa, beheko kaba, zulo obala, ezkerreko bihotza eta aorta. Gero itzulera zilborreko arterietatik.',
    meaning: 'Zelula gorriak = odol oxigenatua, urdinak = oxigeno gutxikoa. Korronte bakoitzean gorrien proportzioa = saturazioa (%80, %58).',
    question: 'Zergatik pasatzen da odol gutxi biriketatik fetuan?',
    answer: 'Biriketan erresistentzia handia dagoelako: odol gehiena hodi arteriosotik aortara pasatzen da.',
  },
  'jaiotza/3d': {
    orientation: `Jaiotzaren momentua: bihotza, biriken zirkulazioa eta zilborreko hodiak. ${BODY_FRONT}`,
    observe: 'Ikusi lasterbideak banan-banan ixten: zilborreko arteriak, zilbor zaina, hodi benosoa, hodi arteriosoa eta zulo obala.',
    meaning: 'Gris = lotailu bihurtzen den hodia. Kolore horiek esaten dute zer geratzen den helduan.',
    question: 'Zer bihurtzen da hodi benosoa?',
    answer: 'Gibeleko lotailu benosoa (gibelaren azalean). Ezkerreko zilbor zaina, berriz, gibeleko lotailu borobila.',
  },
  'jaio-ondoren/3d': {
    orientation: `Jaio osteko zirkulazioa: bi zirkuitu bereizi. ${BODY_FRONT}`,
    observe: 'Jarraitu odolari: kabetatik eskuineko bihotzera eta biriketara; birika zainetatik ezkerreko bihotzera eta aortara.',
    meaning: 'Orain ez dago nahasketarik: eskuinean zelula urdinak, ezkerrean gorriak.',
    question: 'Zein dira aortaren lehen adarrak?',
    answer: 'Arteria koronarioak, Valsalvaren sinuetatik irteten direnak.',
  },
  'linfa/3d': {
    orientation: `Linfa sistema, zainen gainean. ${VEIN_FRONT}`,
    observe: 'Jarraitu linfa tanta berdeei: gorputzetik linfa zakuetara, kiloren zisternara, eta hodi toraxikotik gora ezkerreko lotura yugulosubklabikora.',
    meaning: 'Berdea = linfa zakuak eta hodiak; urdina = zainak. Linfa azkenean zain odolera itzultzen da.',
    question: 'Non irekitzen da hodi toraxikoa?',
    answer: 'Ezkerreko lotura yugulosubklabikoan, ezkerreko zain yugularra eta subklabioa elkartzen diren puntuan.',
  },
};

/** Gives each view of a week its guide from `guides` (keyed stage/view). */
export function withGuides(week: WeekDef, guides: Record<string, ViewGuide>): WeekDef {
  for (const stage of week.stages) for (const view of stage.views) view.guide ??= guides[`${stage.id}/${view.id}`];
  return week;
}
