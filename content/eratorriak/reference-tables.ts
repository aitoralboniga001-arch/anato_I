/** Concise relationships. Source ids point to the original notes in content/notes-text. */
/** 1 funtsezkoa · 2 garrantzitsua · 3 osagarria. Rows render most important first. */
export type ReferenceLevel = 1 | 2 | 3;

export interface ReferenceRow {
  id: string;
  level: ReferenceLevel;
  origin: string;
  derivative: string;
  note?: string;
  sources: string[];
}

export interface ReferenceTable {
  id: string;
  topic: number;
  title: string;
  originHeading: string;
  derivativeHeading: string;
  lead?: string;
  rows: ReferenceRow[];
}

const CRANIO = 'https://embryology.oit.duke.edu/craniofacial/craniofacial.html';
const TONGUE = 'https://www.embryology.ch/old/anglais/sdigestive/gesicht04.html';
const GUT = 'https://embryology.oit.duke.edu/embryoModules/GI/GI.html';
const MIDGUT = 'https://www.embryology.ch/old/anglais/sdigestive/mitteldarm01.html';
const CREST = 'https://embryology.med.unsw.edu.au/embryology/index.php/Neural_Crest_Development';
const ADRENAL = 'https://embryology.med.unsw.edu.au/embryology/index.php/Endocrine_-_Adrenal_Development';
const HEART = 'https://embryology.oit.duke.edu/embryoModules/cardiovascular/cardiovascular.html';
const HEAD = 'https://embryology.med.unsw.edu.au/embryology/index.php/Head_Development';
const PARATHYROID = 'https://embryology.med.unsw.edu.au/embryology/index.php/Endocrine_-_Parathyroid_Development';

export const REFERENCE_TABLES: ReferenceTable[] = [
  {
    id: 'zeloma-eta-tolespena', topic: 7, title: 'Zeloma eta gorputzaren tolespena',
    originHeading: 'Egitura / prozesua', derivativeHeading: 'Kokapena / ondorioa',
    rows: [
      { id: 'zeloma', level: 2, origin: 'Enbrioi barruko zeloma', derivative: 'Alboko mesodermoaren pareta-orriaren eta errai-orriaren arteko espazioa.', sources: ['w7/1/p4/s2', 'w7/1/p4/s3'] },
      { id: 'zeloma-komunikazioa', level: 2, origin: 'Enbrioi barruko eta kanpoko zelomak', derivative: 'Hasieran komunikatuta; tolespenarekin bereizten dira.', note: 'Ez dira haurdunaldi osoan komunikatuta mantentzen.', sources: ['w7/1/p4/s4', 'w7/1/p5/s1'] },
      { id: 'zeloma-eratorriak', level: 3, origin: 'Enbrioi barruko zeloma', derivative: 'Perikardio barrunbea, bi pleura barrunbe eta peritoneo barrunbea.', sources: ['w7/2/p8/s1', 'w7/2/p9/s1', 'w7/2.2/p3/s1', 'w7/2.2/p4/s1', 'w7/2.2/p5/s1'] },
      { id: 'tolespen-zefalokaudala', level: 2, origin: 'Tolespen zefalokaudala', derivative: 'Alde zefalikoa eta kaudala bentralerantz tolesten dira; nerbio-sistema zentralaren hazkunde azkarrak laguntzen du.', sources: ['w7/1/p3/s2', 'w7/1/p4/s5', 'https://embryology.med.unsw.edu.au/embryology/index.php/Neural_System_Development'] },
      { id: 'tolespen-zeharkakoa', level: 3, origin: 'Zeharkako tolespena', derivative: 'Alboko ertzak bentralerantz eta erdikalderantz; gorputz-pareta ixten eta heste-hodia eratzen laguntzen du.', sources: ['w7/1/p4/s5', 'w7/1/p5/s1', 'w14/1/p3/s1'] },
    ],
  },
  {
    id: 'barrunbeen-banaketa', topic: 7, title: 'Barrunbeen banaketa eta diafragma',
    originHeading: 'Jatorria / egitura', derivativeHeading: 'Ekarpena / erlazioa',
    rows: [
      { id: 'septum-transversum', level: 2, origin: 'Septum transversuma', derivative: 'Hasierako perikardio barrunbea eta peritoneo barrunbea partzialki bereizten ditu.', sources: ['w7/2/p7/s1', 'w7/2/p10/s1'] },
      { id: 'erretenak', level: 1, origin: 'Erreten perikardioperitonealak', derivative: 'Goiko eta beheko zeloma-atalak komunikatzen dituzten behin-behineko bi kanal.', note: 'Septum transversumaren atze-alboetan daude; ez dute aurreko hestea barnean.', sources: ['w7/2/p10/s1', 'w7/2.2/p6/s1'] },
      { id: 'pleuroperikardikoak', level: 2, origin: 'Mintz pleuroperikardikoak', derivative: 'Pleura barrunbeak eta perikardio barrunbea bereizten dituzte.', sources: ['w7/2.2/p8/s1', 'w7/2.2/p9/s1', 'w7/2.2/p9/s2'] },
      { id: 'pleuroperitonealak', level: 3, origin: 'Mintz pleuroperitonealak', derivative: 'Erreten perikardioperitonealak ixten dituzte, septum transversumarekin eta hestegorri inguruko mesenkimarekin fusionatuta.', sources: ['w7/3/p7/s1', 'w7/3/p7/s2'] },
      { id: 'zentro-frenikoa', level: 3, origin: 'Septum transversuma', derivative: 'Diafragmaren zentro tendinosoa edo zentro frenikoa.', sources: ['w7/3.1/p8/s1'] },
      { id: 'diafragma-lumbarra', level: 3, origin: 'Hestegorriaren inguruko mesenkima', derivative: 'Diafragmaren atal lumbarra eta zutabeak.', sources: ['w7/3.1/p5/s1', 'w7/3.1/p5/s2', 'w7/3.1/p11/s1'] },
      { id: 'diafragma-periferikoa', level: 3, origin: 'Gorputz-paretako osagai muskularra', derivative: 'Diafragmaren atal muskular periferikoa.', sources: ['w7/3.1/p6/s1', 'w7/3.1/p6/s2'] },
      { id: 'frenikoa', level: 3, origin: 'C3, C4 eta C5 nerbio espinalen aurreko adarrak', derivative: 'Nerbio frenikoak; diafragmaren jaitsierarekin luzatzen dira.', sources: ['w7/3/p4/s5', 'w7/3/p4/s6', 'w7/3/p5/s3'] },
    ],
  },
  {
    id: 'peritoneoarekiko-kokapena', topic: 7, title: 'Peritoneoarekiko kokapena',
    originHeading: 'Egitura', derivativeHeading: 'Kokapena',
    lead: 'Peritoneo barruko organoa errai-peritoneoz inguratuta dago; ez dago barrunbe birtualaren barruan flotatzen.',
    rows: [
      { id: 'urdaila-barea', level: 1, origin: 'Urdaila eta barea', derivative: 'Peritoneo barrukoak.', sources: ['w14/3.2/p7/s2', 'w14/3.2/p11/s4'] },
      { id: 'jejuno-ileon', level: 1, origin: 'Jejunoa eta ileona', derivative: 'Peritoneo barrukoak; mesenterioa mantentzen dute.', sources: ['w14/3.3/p12/s1', GUT] },
      { id: 'kolon-mugikorra', level: 1, origin: 'Zeharkako kolona eta kolon sigmoideoa', derivative: 'Peritoneo barrukoak, beren mesoekin.', sources: [GUT] },
      { id: 'kolon-itsua-kokapena', level: 2, origin: 'Kolon itsua / zekua', derivative: 'Normalean peritoneo barrukoa; maiz ez du meso askerik.', note: 'Ez nahasi jarraian duen goranzko kolonaren kokapenarekin.', sources: ['https://www.elsevier.com/resources/anatomy/digestive-system/digestive-canal/cecum/20227', 'https://www.ncbi.nlm.nih.gov/books/NBK470577/'] },
      { id: 'duodeno-bulboa', level: 2, origin: 'Duodenoaren hasierako bulboa', derivative: 'Peritoneo barrukoa.', note: 'Lehen atalaren hasierako zati mugikorra; ez lehen atal osoa salbuespenik gabe.', sources: ['w14/3.3/p11/s4', 'w14/3.3/p11/s5', GUT] },
      { id: 'duodeno-gainerakoa', level: 1, origin: 'Duodenoaren gainerako zatirik handiena, bereziki 2.–4. atalak', derivative: 'Bigarren mailako peritoneo atzekoa.', sources: ['w14/3.3/p11/s2', 'w14/3.3/p11/s4'] },
      { id: 'kolon-finkoa', level: 2, origin: 'Goranzko eta beheranzko kolona', derivative: 'Bigarren mailako peritoneo atzekoak.', note: 'Hasierako mesoa atzeko paretarekin fusionatzen da.', sources: ['w7/2.1/p12/s2', 'w7/2.1/p13/s1'] },
      { id: 'area-kokapena', level: 1, origin: 'Area / pankreasa', derivative: 'Ia osoa bigarren mailako peritoneo atzekoa.', note: 'Buztana lotailu esplenoerrenalean gera daiteke.', sources: ['w14/3.6/p19/s1', 'w14/3.6/p19/s2'] },
      { id: 'giltzurrun-hodiak', level: 1, origin: 'Giltzurrunak, abdomeneko aorta eta beheko kaba zaina', derivative: 'Hasieratik peritoneo atzeko egiturak.', sources: ['w7/2.1/p11/s2', 'w7/2.1/p11/s3', 'w7/2.1/p11/s4'] },
      { id: 'ondestea', level: 1, origin: 'Ondestea', derivative: 'Peritoneo kanpokoa: atzeko hestearen urrutiko atala peritoneo barrunbetik kanpo geratzen da.', note: 'Goiko atalak estaldura peritoneal partziala du; beheko atala peritoneo azpikoa da.', sources: ['w7/2.1/p7/s1', GUT] },
      { id: 'gibela-kokapena', level: 2, origin: 'Gibela', derivative: 'Nagusiki peritoneo barrukoa.', note: 'Area biluziak ez du estaldura peritonealik.', sources: ['w14/3.4/p10/s2', 'w14/3.4/p13/s1'] },
    ],
  },
  {
    id: 'hezurren-jatorriak', topic: 8, title: 'Hezurren jatorri nagusiak',
    originHeading: 'Jatorria', derivativeHeading: 'Eratorria',
    rows: [
      { id: 'hezur-gandorra', level: 1, origin: 'Gandor neuraleko mesenkima', derivative: 'Aurpegiko hezur ugari: goiko maxilarra, baraila eta zigomatikoa.', note: 'Gandor neurala ektodermo-jatorrikoa da.', sources: ['w8/1/p2/s1', 'w8/3.2/p20/s1'] },
      { id: 'hezur-paraxiala', level: 3, origin: 'Mesodermo paraxiala', derivative: 'Ornoak, saihets-hezurrak eta garezurraren atzeko hezur-osagaiak.', sources: ['w8/1/p2/s1', 'w8/3.1.2/p11/s1', 'w8/5.2.1/p2/s1'] },
      { id: 'hezur-albokoa', level: 3, origin: 'Alboko mesodermoaren pareta-orria', derivative: 'Gorputz-adarren hezur eta ehun konektibo gehiena.', sources: ['w8/4/p6/s2', 'w8/1/p2/s1'] },
      { id: 'okzipital-ezkata', level: 2, origin: 'Mesodermo paraxialeko mesenkima', derivative: 'Hezur okzipitalaren ezkata (buru-gangan; mintzezko hezurtzapena).', note: 'Oinaldeko atal bazilarra, berriz, kartilago parakordaletatik dator (hezurtzapen endokondrala).', sources: ['w8/3.1.2/p5/s6', 'w8/3.1.2/p11/s1'] },
      { id: 'mintzezko-hezurtzea', level: 2, origin: 'Mesenkimaren zuzeneko hezurtzea', derivative: 'Mintzezko hezurtzapena; adibidez, maxilarra eta barailaren zatirik handiena.', sources: ['w8/3.2/p8/s1', 'w8/3.2/p20/s1', CRANIO] },
      { id: 'endokondral-hezurtzea', level: 2, origin: 'Kartilago-ereduaren ordezkapena', derivative: 'Hezurtzapen endokondrala: kondrokraneoa eta gorputz-adarren hezur luzeak.', sources: ['w8/3.1.2/p2/s2', 'w8/4/p6/s3'] },
    ],
  },
  {
    id: 'kondrokraneoaren-kartilagoak', topic: 8, title: 'Kondrokraneoaren kartilagoak',
    originHeading: 'Kartilagoa / jatorria', derivativeHeading: 'Hezur-atala',
    rows: [
      { id: 'hipofisi-kartilagoa', level: 1, origin: 'Hipofisi-kartilagoak', derivative: 'Esfenoides hezurraren gorputza.', sources: ['w8/3.1.2/p5/s8', 'w8/3.1.2/p5/s9'] },
      { id: 'hego-tenporala', level: 1, origin: 'Hego tenporalaren kartilagoa', derivative: 'Esfenoidesaren hego nagusia / handia.', note: 'Kondrokraneoaren osagaia; hezurtzapen endokondrala.', sources: ['w8/3.1.2/p6/s2', 'w8/3.1.2/p2/s2'] },
      { id: 'begizulo-hegoak', level: 2, origin: 'Begizulo-hegoen kartilagoak', derivative: 'Esfenoidesaren hego txikiak.', sources: ['w8/3.1.2/p6/s3'] },
      { id: 'periotikoa', level: 1, origin: 'Kapsula periotikoak', derivative: 'Tenporalaren zati petrosoa eta mastoideoa.', sources: ['w8/3.1.2/p6/s1'] },
      { id: 'parakordalak', level: 1, origin: 'Kartilago parakordalak eta somita okzipitaletako mesenkima', derivative: 'Okzipitalaren atal bazilarra.', sources: ['w8/3.1.2/p5/s3', 'w8/3.1.2/p5/s5'] },
      { id: 'trabekula-kranealak', level: 3, origin: 'Trabekula / trenkada kranealak', derivative: 'Etmoidesaren gorputza.', sources: ['w8/3.1.2/p5/s12', 'w8/3.1.2/p5/s13'] },
    ],
  },
  {
    id: 'gandor-neurala-eta-adarrak', topic: 8, title: 'Gandor neurala eta gorputz-adarren hasiera',
    originHeading: 'Jatorria / unea', derivativeHeading: 'Eratorria / gertaera',
    rows: [
      { id: 'gandor-melanozitoak', level: 2, origin: 'Gandor neurala', derivative: 'Melanozitoak.', sources: [CREST] },
      { id: 'gandor-neuronak', level: 2, origin: 'Gandor neurala', derivative: 'Gongoil espinaletako neurona sentsitiboak eta gongoil sinpatikoetako neuronak.', sources: [CREST] },
      { id: 'gandor-medula', level: 3, origin: 'Gandor neurala', derivative: 'Giltzurrun gaineko guruinaren muineko zelula kromafinak.', sources: [ADRENAL] },
      { id: 'adrenal-kortexa', level: 2, origin: 'Mesodermoa', derivative: 'Giltzurrun gaineko guruinaren kortexa.', note: 'Kortexa eta muina ez dira jatorri berekoak.', sources: [ADRENAL] },
      { id: 'adar-hastapenak', level: 2, origin: '4. astearen amaiera', derivative: 'Gorputz-adarren hastapenak agertzen hasten dira; goikoak behekoak baino lehen.', note: '5. astearen hasierarako ikusgai daude; ez da umeki-aroaren hasierako gertaera.', sources: ['w8/4/p3/s1', 'w8/4/p3/s2'] },
      { id: 'adar-biraketa', level: 3, origin: 'Gorputz-adarren biraketa', derivative: 'Goikoak kanporantz; behekoak barrurantz, gutxi gorabehera 90°.', sources: ['w8/4/p9/s1', 'w8/4/p10/s2'] },
    ],
  },
  {
    id: 'muskuluen-jatorriak', topic: 9, title: 'Muskuluen jatorriak eta salbuespenak',
    originHeading: 'Jatorria', derivativeHeading: 'Muskulua',
    rows: [
      { id: 'muskulu-paraxiala', level: 3, origin: 'Mesodermo paraxiala: somitomeroak eta somitak', derivative: 'Muskulu eskeletiko gehienak; gorputz-paretako eta gorputz-adarretakoak barne.', sources: ['w9/2/p3/s1', 'w9/2/p3/s4', 'w9/2.2/p9/s6'] },
      { id: 'muskulu-errai', level: 3, origin: 'Alboko mesodermoaren errai-orria', derivative: 'Heste-paretako muskulu lisoa.', sources: ['w9/1/p6/s1'] },
      { id: 'miokardioa', level: 3, origin: 'Bihotz-hodi inguruko errai-mesodermoa', derivative: 'Bihotzeko muskulua / miokardioa.', sources: ['w9/1/p7/s1'] },
      { id: 'iris-muskuluak', level: 2, origin: 'Neuroektodermoa, begi-koparen epitelioa', derivative: 'Begi-niniaren muskulu estutzailea eta zabaltzailea.', note: 'Muskuluen jatorri mesodermikoaren salbuespenak.', sources: ['w9/1/p3/s2', 'https://www.nature.com/articles/s41467-025-65653-8'] },
      { id: 'mioepitelioa', level: 3, origin: 'Gainazaleko ektodermotik eratorritako guruin-epitelioa', derivative: 'Titi- eta izerdi-guruinetako zelula mioepitelialak.', note: 'Zelula uzkurkorrak dira; ez dira ohiko muskulu eskeletikoak.', sources: ['w9/1/p3/s2'] },
      { id: 'mihi-muskuluak', level: 2, origin: 'Somita okzipitaletako mesodermoa', derivative: 'Mihiaren muskulu gehienak; XII nerbio hipoglosoak inerbatuta.', note: 'Palatoglosoa X nerbioaren bidez inerbatzen da.', sources: ['w9/2.1.2/p6/s1', 'w9/2.1.2/p6/s2', TONGUE] },
    ],
  },
  {
    id: 'arkuak-muskuluak-nerbioak', topic: 9, title: 'Faringe-arkuak: muskuluak eta nerbioak',
    originHeading: 'Faringe-arkua', derivativeHeading: 'Muskuluak · inerbazioa',
    rows: [
      { id: 'arku1-muskulu', level: 1, origin: '1. arkua', derivative: 'Murtxikatzaileak · V3, trigeminoaren barail-adarra.', sources: ['w9/2.1.1/p6/s2', 'w9/2.1.1/p7/s1', CRANIO] },
      { id: 'arku2-muskulu', level: 1, origin: '2. arkua', derivative: 'Aurpegiko muskulu mimikoak · VII, aurpegi-nerbioa.', sources: ['w9/2.1.1/p7/s2', 'w9/2.1.1/p7/s3'] },
      { id: 'arku3-muskulu', level: 2, origin: '3. arkua', derivative: 'Estilofaringeoa · IX, nerbio glosofaringeoa.', sources: ['w9/2.1.1/p8/s1', 'w9/2.1.1/p9/s1'] },
      { id: 'arku4-muskulu', level: 2, origin: '4. arkua', derivative: 'Krikotiroideoa eta faringeko muskulu hertsatzaileak · X, bagoa.', note: 'Krikotiroideoaren adar motorea goiko nerbio laringeoaren kanpoko adarra da.', sources: ['w9/2.1.2/p4/s1', 'w12/2.4/p8/s5', CRANIO] },
      { id: 'arku6-muskulu', level: 2, origin: '6. arkua', derivative: 'Laringeko muskulu intrintsekoak, krikotiroideoa izan ezik · X, nerbio laringeo atzerakaria.', sources: ['w9/2.1.2/p4/s1', 'w12/2.4/p8/s5', CRANIO] },
    ],
  },
  {
    id: 'begiaren-inerbazioa', topic: 9, title: 'Begiaren inguruko muskuluen inerbazioa',
    originHeading: 'Nerbioa', derivativeHeading: 'Muskulua / eginkizuna',
    rows: [
      { id: 'begiIII', level: 2, origin: 'III · nerbio begi-eragilea', derivative: 'Goiko, beheko eta erdialdeko muskulu zuzenak; beheko muskulu laprana.', sources: ['w9/2.1.1/p3/s2', 'w9/2.1.1/p4/s1'] },
      { id: 'begiIV', level: 2, origin: 'IV · troklea-nerbioa', derivative: 'Goiko muskulu laprana.', sources: ['w9/2.1.1/p4/s1', 'w9/2.1.1/p4/s2'] },
      { id: 'begiVI', level: 2, origin: 'VI · nerbio aldentzailea', derivative: 'Alboko muskulu zuzena.', sources: ['w9/2.1.1/p4/s2', 'w9/2.1.1/p5/s3'] },
      { id: 'begiV1', level: 2, origin: 'V1 · nerbio oftalmikoa', derivative: 'Sentsibilitate-adarra; ez du begiaren kanpoko muskuluen inerbazio motorea egiten.', note: 'Begi-mugimenduen nerbio motoreak III, IV eta VI dira.', sources: ['w9/2.1.1/p5/s1', 'w9/2.1.1/p5/s2', CRANIO] },
    ],
  },
  {
    id: 'bihotz-lakioaren-eratorriak', topic: 10, title: 'Bihotz-lakioaren atalak eta eratorriak',
    originHeading: 'Bihotz-lakioaren atala', derivativeHeading: 'Eratorria',
    rows: [
      { id: 'bulbo-hurbila', level: 1, origin: 'Bulboaren hurbileko atala', derivative: 'Hasierako eskuineko bentrikulua: eskuineko bentrikuluaren atal trabekulatua.', sources: ['w10/3.1/p4/s1', 'w10/3.1/p4/s2'] },
      { id: 'arteria-konoa', level: 1, origin: 'Arteria konoa', derivative: 'Bi bentrikuluen atal leunak: eskuineko infundibulua eta ezkerreko atari aortikoa.', note: 'Ez dira bentrikuluen atal trabekulatuak.', sources: ['w10/3.1/p5/s1', 'w11/5.1/p4/s5', 'w11/5.1/p4/s6'] },
      { id: 'enbor-arteriosoa', level: 1, origin: 'Enbor arteriosoa', derivative: 'Goranzko aortaren eta birika-enborraren hasierako atalak / sustraiak.', note: 'Ez ditu bentrikuluen atal leunak sortzen (hori konoa da), ezta aorta dortsalak edo arku aortikoak ere.', sources: ['w10/3.1/p6/s2', 'w11/5.2/p3/s7'] },
      { id: 'atal-bentrikularra', level: 2, origin: 'Atal bentrikularra', derivative: 'Hasierako ezkerreko bentrikulua: ezkerreko bentrikuluaren atal trabekulatua.', sources: ['w10/3.2/p3/s1'] },
      { id: 'atal-aurikularra', level: 2, origin: 'Atal aurikularra / aurikula primitiboa', derivative: 'Bi aurikulen atal trabekulatuak eta belarritxoak.', sources: ['w11/2.2/p11/s1', 'w11/2.2/p15/s1'] },
      { id: 'sinu-eskuina', level: 3, origin: 'Zain-sinuaren eskuineko luzapena', derivative: 'Eskuineko aurikularen atzeko atal leuna.', sources: ['w10/3.4/p12/s1', 'w11/2.2/p10/s1'] },
      { id: 'sinu-ezkerra', level: 2, origin: 'Zain-sinuaren ezkerreko luzapena', derivative: 'Sinu koronarioa eta ezkerreko aurikularen zain laprana.', sources: ['w10/3.4/p7/s1', 'w10/3.4/p7/s2'] },
      { id: 'eskuin-balbula', level: 2, origin: 'Eskuineko zain-balbularen beheko atala', derivative: 'Beheko kaba zainaren eta sinu koronarioaren balbulak.', sources: ['w13/3.1/p15/s4'] },
      { id: 'ezker-balbula', level: 1, origin: 'Ezkerreko zain-balbula eta septum spuriuma', derivative: 'Septum secundumarekin fusionatzen dira.', sources: ['w10/3.4/p11/s1'] },
      { id: 'birika-zainak', level: 2, origin: 'Birika-zain primitiboa eta haren adarren inkorporazioa', derivative: 'Ezkerreko aurikularen atal leunaren eraketan parte hartzen du.', sources: ['w11/2.2/p14/s1', 'w11/2.2/p14/s3'] },
    ],
  },
  {
    id: 'bihotzaren-kokapena', topic: 10, title: 'Bihotz-hoditik lakiora',
    originHeading: 'Atala / konexioa', derivativeHeading: 'Mugimendua / kokapena',
    rows: [
      { id: 'bulbo-mugimendua', level: 3, origin: 'Atal bulbarra', derivative: 'Aurrera, behera eta eskuinera.', sources: ['w11/3/p10/s1'] },
      { id: 'bentrikulu-mugimendua', level: 3, origin: 'Atal bentrikularra', derivative: 'Bulboaren ezkerraldean geratzen da.', sources: ['w10/2/p14/s1', 'w11/3/p13/s1'] },
      { id: 'aurikula-mugimendua', level: 3, origin: 'Atal aurikularra eta zain-sinua', derivative: 'Gora eta atzera; aurikulak bentrikuluen goi-atzekaldean.', sources: ['w10/2/p15/s1', 'w10/3.3/p4/s1'] },
      { id: 'zulo-sinuaurikularra', level: 3, origin: 'Zulo sinuaurikularra', derivative: 'Zain-sinua aurikula primitiboarekin komunikatzen du.', sources: ['w10/3.4/p4/s6'] },
      { id: 'kanal-aurikulubentrikularra', level: 3, origin: 'Kanal aurikulubentrikularra', derivative: 'Aurikula primitiboa eta bentrikulu-atala komunikatzen ditu; gero eskuinera zabaltzen da.', sources: ['w11/3/p5/s1', 'w11/3/p7/s1'] },
    ],
  },
  {
    id: 'aurikulen-trenkadak', topic: 11, title: 'Aurikulen trenkadak eta zulo obala',
    originHeading: 'Egitura', derivativeHeading: 'Erlazioa / patua',
    rows: [
      { id: 'septum-primum', level: 1, origin: 'Septum primuma', derivative: 'Aurikularen sabaitik beherantz hazten den lehen trenkada.', sources: ['w11/2.2/p4/s1', HEART] },
      { id: 'ostium-primum', level: 3, origin: 'Ostium primuma', derivative: 'Septum primumaren beheko ertzaren eta endokardio-kuxinen arteko behin-behineko irekidura.', sources: [HEART] },
      { id: 'ostium-secundum', level: 3, origin: 'Ostium secunduma', derivative: 'Septum primumaren goiko aldean eratzen den irekidura.', sources: ['w11/2.2/p4/s1'] },
      { id: 'septum-secundum', level: 1, origin: 'Septum secunduma', derivative: 'Septum primumaren eskuinaldeko bigarren trenkada; zulo obala irekita uzten du.', sources: ['w11/2.2/p3/s2', 'w11/2.2/p3/s4'] },
      { id: 'foramen-ovale', level: 2, origin: 'Zulo obala / foramen ovale', derivative: 'Aurikulen arteko fetu-komunikazioa; ez da komunikazio aurikulubentrikularra.', sources: ['w11/2.2/p4/s1', 'w11/2.2/p5/s1'] },
      { id: 'balbula-obala', level: 2, origin: 'Septum primumaren geratzen den beheko atala', derivative: 'Zulo obalaren balbula.', sources: ['w11/2.2/p6/s1'] },
      { id: 'zulo-obala-itxiera', level: 1, origin: 'Jaiotzean ezkerreko aurikulako presioa eskuinekoa baino handiagoa', derivative: 'Septum primuma septum secundumaren aurka jartzen da: itxiera funtzionala.', note: 'Ondorengo fusio anatomikoa motelagoa da; trenkadak ez dira bat-batean desagertzen.', sources: ['w11/2.2/p7/s3', 'w11/2.2/p7/s4', 'w11/2.2/p7/s5'] },
    ],
  },
  {
    id: 'bentrikuluak-eta-irteerak', topic: 11, title: 'Bentrikuluak eta arteria-irteerak',
    originHeading: 'Egitura / jatorria', derivativeHeading: 'Emaitza / konexioa',
    rows: [
      { id: 'irteera-eskuina', level: 3, origin: 'Eskuineko bentrikuluaren infundibulua', derivative: 'Birika-enborrarekin jarraitzen du.', sources: ['w11/5.1/p4/s5'] },
      { id: 'irteera-ezkerra', level: 3, origin: 'Ezkerreko bentrikuluaren atal leuna', derivative: 'Aortarekin jarraitzen du.', sources: ['w11/5.1/p4/s6'] },
      { id: 'trenkada-tronkokonala', level: 2, origin: 'Trenkada aortopulmonarra / tronkokonala', derivative: 'Arteria-irteera komuna aorta- eta birika-bideetan bereizten du.', note: 'Kiribil-itxurakoa da; ez ditu bi bideak elkarren artean komunikatzen.', sources: ['w11/5.2/p3/s1', 'w11/5.2/p3/s2', 'w11/5.2/p7/s1'] },
      { id: 'mintzezko-trenkada', level: 3, origin: 'Konoaren trenkada, endokardio-kuxinak eta trenkada muskularra', derivative: 'Bentrikulu arteko komunikazioaren itxiera eta trenkadaren mintzezko atala.', sources: ['w11/5.1/p4/s10', 'w11/5.2/p7/s12'] },
      { id: 'kuxin-aurikulubentrikularrak', level: 3, origin: 'Kanal aurikulubentrikularreko endokardio-kuxinen fusioa', derivative: 'Eskuineko eta ezkerreko zulo aurikulubentrikularrak bereizten dira.', sources: ['w11/3/p7/s5'] },
    ],
  },
  {
    id: 'arkua-ala-poltsa', topic: 12, title: 'Egitura → nondik? Arkua, poltsa ala arraila',
    originHeading: 'Egitura', derivativeHeading: 'Arkua / poltsa / arraila',
    lead: 'Alderantzizko norabidea: egituratik abiatu eta haren zenbakia eta mota esan.',
    rows: [
      { id: 'ra-hioidea', level: 1, origin: 'Hioide-hezurra', derivative: '2. arkua (adar txikiak, gorputzaren goiko atala) + 3. arkua (adar handiak, gorputzaren beheko atala).', note: 'Arkuetatik dator, ez poltsetatik.', sources: [HEAD] },
      { id: 'ra-laringe-kartilagoak', level: 1, origin: 'Laringeko kartilagoak', derivative: '4. eta 6. arkuak.', note: 'Ez 3. arkua.', sources: [HEAD] },
      { id: 'ra-murtxikatzaileak', level: 1, origin: 'Muskulu murtxikatzaileak', derivative: '1. arkua · V3 barail-nerbioa.', sources: ['w9/2.1.1/p6/s2', 'w9/2.1.1/p7/s1'] },
      { id: 'ra-mimikoak', level: 1, origin: 'Aurpegiko muskulu mimikoak', derivative: '2. arkua · VII aurpegi-nerbioa.', note: 'Ez 4. arkua.', sources: ['w9/2.1.1/p7/s2', 'w9/2.1.1/p7/s3'] },
      { id: 'ra-laringe-intrintsekoak', level: 1, origin: 'Laringeko muskulu intrintsekoak', derivative: '6. arkua · X, nerbio laringeo atzerakaria.', note: 'Krikotiroideoa izan ezik: 4. arkua, goiko nerbio laringeoa.', sources: ['w9/2.1.2/p4/s1', 'w12/2.4/p8/s5', CRANIO] },
      { id: 'ra-timoa', level: 1, origin: 'Timoa', derivative: '3. poltsa, atal bentrala.', note: 'Ez 5. poltsa.', sources: [PARATHYROID] },
      { id: 'ra-amigdala', level: 1, origin: 'Ahosabaiko amigdala', derivative: '2. poltsa.', sources: [CRANIO] },
      { id: 'ra-tinpano-kutxa', level: 1, origin: 'Tinpano-kutxa', derivative: '1. poltsaren urrutiko atala.', sources: [CRANIO] },
      { id: 'ra-eustakio', level: 1, origin: 'Eustakioren tronpa / tronpa faringotinpanikoa', derivative: '1. poltsaren hurbileko atala.', sources: [CRANIO] },
      { id: 'ra-tiroidea', level: 1, origin: 'Tiroidesa (osagai folikularra)', derivative: 'Ez da poltsa-eratorria: faringe-zoruko erdiko dibertikulua, foramen caecumaren mailan.', note: 'C zelulak, berriz, 4. poltsako gorputz ultimobrankialetik.', sources: [CRANIO, TONGUE] },
      { id: 'ra-hodi-arteriosoa', level: 1, origin: 'Hodi arteriosoa', derivative: 'Ezkerreko 6. arku aortikoaren urrutiko atala.', sources: ['w12/2.3.4/p9/s2', 'w12/2.4/p14/s1'] },
      { id: 'ra-mailua', level: 2, origin: 'Mailua (eta ingudea)', derivative: '1. arkua · Meckel kartilagoa.', sources: ['w8/3.2/p12/s2', 'w8/3.2/p13/s1', CRANIO] },
      { id: 'ra-estriboa', level: 2, origin: 'Estriboa', derivative: '2. arkua · Reichert kartilagoa.', sources: ['w8/3.2/p15/s1'] },
      { id: 'ra-estilofaringeoa', level: 2, origin: 'Muskulu estilofaringeoa', derivative: '3. arkua · IX glosofaringeoa.', sources: ['w9/2.1.1/p8/s1', 'w9/2.1.1/p9/s1'] },
      { id: 'ra-krikotiroideoa', level: 2, origin: 'Krikotiroideoa eta faringe-hertsatzaileak', derivative: '4. arkua · X, goiko nerbio laringeoa.', sources: ['w9/2.1.2/p4/s1', CRANIO] },
      { id: 'ra-paratiroide-behe', level: 2, origin: 'Beheko paratiroideak', derivative: '3. poltsa, atal dortsala.', note: 'Timoarekin batera jaisten dira; horregatik daude goikoak (4. poltsa) baino beherago.', sources: [PARATHYROID] },
      { id: 'ra-paratiroide-goi', level: 2, origin: 'Goiko paratiroideak', derivative: '4. poltsa, atal dortsala.', sources: [PARATHYROID] },
      { id: 'ra-entzumen-bidea', level: 2, origin: 'Kanpoko entzumen-bidea', derivative: '1. arraila (ektodermoa).', note: 'Ez poltsa: poltsak endodermoa dira.', sources: [HEAD] },
      { id: 'ra-tinpano-mintza', level: 2, origin: 'Tinpano-mintza', derivative: '1. mintza: ektodermoa + mesenkima + endodermoa.', sources: [HEAD] },
      { id: 'ra-karotida', level: 2, origin: 'Karotida komuna', derivative: '3. arku aortikoa.', note: 'Ez 2.a.', sources: ['w12/2.3.2/p4/s1'] },
      { id: 'ra-aorta-makoa', level: 2, origin: 'Aorta-makoaren atala (karotida komunaren eta subklabioaren artean)', derivative: 'Ezkerreko 4. arku aortikoa.', sources: ['w12/2.3.2/p9/s1'] },
      { id: 'ra-birika-arteriak', level: 2, origin: 'Birika-arterien hurbileko atalak', derivative: '6. arku aortikoak.', note: 'Ez 5.a: 5. arkua ez da garatzen.', sources: ['w12/2.3.4/p9/s1', 'w12/2.1/p9/s1'] },
    ],
  },
  {
    id: 'arku-aortikoak', topic: 12, title: 'Arku aortikoen eratorriak',
    originHeading: 'Arkua / aldea', derivativeHeading: 'Arteria / patua',
    rows: [
      { id: 'aorta1', level: 3, origin: '1. arku aortikoa', derivative: 'Arteria maxilarraren osagai bat; gainerakoa atzeratzen da.', sources: ['w12/2.1/p5/s1', 'w12/2.1/p5/s2'] },
      { id: 'aorta2', level: 2, origin: '2. arku aortikoa', derivative: 'Arteria hioideo eta estapedioaren hondarrak.', sources: ['w12/2.1/p6/s1', 'w12/2.1/p6/s2'] },
      { id: 'aorta3', level: 2, origin: '3. arku aortikoak', derivative: 'Karotida komunak eta barneko karotiden hurbileko atalak.', sources: ['w12/2.3.2/p4/s1'] },
      { id: 'aorta4L', level: 2, origin: 'Ezkerreko 4. arku aortikoa', derivative: 'Aorta-makoaren atala: ezkerreko karotida komunaren eta ezkerreko subklabioaren artean.', sources: ['w12/2.3.2/p9/s1'] },
      { id: 'aorta4R', level: 2, origin: 'Eskuineko 4. arku aortikoa', derivative: 'Eskuineko arteria subklabioaren hurbileko atala.', sources: ['w12/2.3.2/p11/s1'] },
      { id: 'aorta5', level: 2, origin: '5. arkua', derivative: 'Ez da garatzen edo goiz atzeratzen da; ez du behin betiko eratorririk.', sources: ['w12/2.1/p9/s1', 'w12/2.1/p9/s2', 'w12/2.3.3/p3/s1'] },
      { id: 'aorta6-prox', level: 2, origin: 'Bi 6. arkuen hurbileko atalak', derivative: 'Birika-arterien hurbileko osagaiak.', sources: ['w12/2.3.4/p9/s1', 'w12/2.3.4/p10/s1'] },
      { id: 'aorta6L-dist', level: 1, origin: 'Ezkerreko 6. arkuaren urrutiko atala', derivative: 'Hodi arteriosoa; jaio ostean lotailu arteriosoa.', sources: ['w12/2.3.4/p9/s2', 'w12/2.4/p14/s3'] },
      { id: 'aorta6R-dist', level: 3, origin: 'Eskuineko 6. arkuaren urrutiko atala', derivative: 'Desagertzen da.', sources: ['w12/2.3.4/p10/s1'] },
    ],
  },
  {
    id: 'arteria-konexioak', topic: 12, title: 'Arteriak eta nerbio laringeo atzerakariak',
    originHeading: 'Jatorria / egitura', derivativeHeading: 'Eratorria / erlazioa',
    rows: [
      { id: 'zakuaR', level: 3, origin: 'Aorta-zakuaren eskuineko luzapena', derivative: 'Enbor brakiozefalikoa.', sources: ['w12/2.2.2/p8/s1'] },
      { id: 'zakuaL', level: 3, origin: 'Aorta-zakuaren ezkerreko luzapena', derivative: 'Aorta-makoaren hurbileko osagaia.', sources: ['w12/2.2.2/p7/s1'] },
      { id: 'subklabioL', level: 3, origin: 'Ezkerreko 7. lepoko segmentu arteko arteria', derivative: 'Ezkerreko arteria subklabioa.', sources: ['w12/2.3.2/p10/s1'] },
      { id: 'atzerakariR', level: 1, origin: 'Eskuineko nerbio laringeo atzerakaria', derivative: 'Eskuineko arteria subklabioaren hasierako atala inguratzen du (eskuineko 4. arkua).', note: 'Eskuineko 6. arkuaren urrutiko atala desagertzen da eta 5.a ez da garatzen; horregatik igotzen da 4. arkuraino.', sources: ['w12/2.4/p11/s1', 'w12/2.4/p11/s2', 'w12/2.4/p13/s1'] },
      { id: 'atzerakariL', level: 1, origin: 'Ezkerreko nerbio laringeo atzerakaria', derivative: 'Ezkerreko 6. arkuaren urrutiko atala inguratzen du: hodi arteriosoa; jaio ostean, lotailu arteriosoa.', note: 'Eskuinekoak ez bezala, ezkerrekoa ez da gorago igotzen: 6. arkuaren urrutiko atala ezkerrean mantentzen delako.', sources: ['w12/2.4/p10/s1', 'w12/2.4/p14/s1', 'w12/2.4/p14/s4', 'w13/4.2/p10/s2'] },
      { id: 'iliako-umbilikala', level: 2, origin: 'Barneko arteria iliakoa', derivative: 'Zilborreko arteriarekin konektatzen da garapenean.', sources: ['w12/2.6/p5/s1', 'w12/2.6/p5/s2'] },
      { id: 'aorta-dortsala', level: 3, origin: 'Bi aorta dortsalen fusioa, toraxetik beherantz', derivative: 'Beheranzko aorta bakarra.', sources: ['w12/2.5/p3/s3'] },
    ],
  },
  {
    id: 'faringe-poltsak', topic: 12, title: 'Faringe-poltsak',
    originHeading: 'Poltsa endodermikoa', derivativeHeading: 'Eratorria',
    rows: [
      { id: 'poltsa1-dist', level: 1, origin: '1. poltsaren urrutiko atala', derivative: 'Tinpano-kutxaren barrunbea.', sources: [CRANIO] },
      { id: 'poltsa1-prox', level: 1, origin: '1. poltsaren hurbileko atala', derivative: 'Tronpa faringotinpanikoa / Eustakioren tronpa.', sources: [CRANIO] },
      { id: 'poltsa2', level: 1, origin: '2. faringe-poltsa', derivative: 'Ahosabaiko amigdalaren epitelioa eta kriptak.', note: 'Ehun linfoidea geroago iristen diren zelulek osatzen dute.', sources: [CRANIO] },
      { id: 'poltsa3-dorsal', level: 2, origin: '3. poltsaren atal dortsala', derivative: 'Beheko paratiroide guruinak.', sources: [PARATHYROID] },
      { id: 'poltsa3-ventral', level: 1, origin: '3. poltsaren atal bentrala', derivative: 'Timoaren osagai epiteliala.', note: 'Beheko paratiroideak timoarekin batera jaisten dira.', sources: [PARATHYROID] },
      { id: 'poltsa4-dorsal', level: 2, origin: '4. poltsaren atal dortsala', derivative: 'Goiko paratiroide guruinak.', sources: [PARATHYROID] },
      { id: 'poltsa4-ultimo', level: 2, origin: '4. poltsaren osagai bentrala / gorputz ultimobrankiala', derivative: 'Tiroidera inkorporatzen da, C zelulen garapenarekin erlazionatuta.', note: 'Batzuetan 5. poltsatzat hartzen da; timoa ez dator 5. poltsatik.', sources: [CRANIO] },
      { id: 'tiroide-jatorria', level: 2, origin: 'Faringearen zoruko erdiko dibertikulu endodermikoa', derivative: 'Tiroidesaren osagai folikularra.', note: 'Ez da faringe-poltsa baten eratorri zuzena.', sources: [CRANIO] },
    ],
  },
  {
    id: 'faringe-arkuak-eta-mintzak', topic: 12, title: 'Arkuak, arrailak eta mintzak bereiztu',
    originHeading: 'Jatorria / egitura', derivativeHeading: 'Eratorria',
    rows: [
      { id: 'meckel', level: 3, origin: '1. arkuko Meckel kartilagoa', derivative: 'Mailua eta ingudea.', note: 'Baraila inguruko mesenkimatik hezurtzen da nagusiki, ez Meckel kartilagoa osorik ordezkatuz.', sources: ['w8/3.2/p12/s2', CRANIO] },
      { id: 'reichert', level: 2, origin: '2. arkuko Reichert kartilagoa', derivative: 'Estriboa, apofisi estiloidea, lotailu estilohioideoa eta hioidearen goiko osagaiak.', sources: ['w8/3.2/p15/s1', HEAD] },
      { id: 'arku3-hioidea', level: 2, origin: '3. arkuaren kartilagoa', derivative: 'Hioidearen adar handiak eta gorputzaren beheko osagaia.', sources: [HEAD] },
      { id: 'arku46-laringea', level: 2, origin: '4. eta 6. arkuetako mesenkima', derivative: 'Laringeko kartilagoen eraketan parte hartzen du.', sources: [HEAD] },
      { id: 'arrail1', level: 2, origin: '1. faringe-arraila · ektodermoa', derivative: 'Kanpoko entzumen-bidea.', sources: [HEAD] },
      { id: 'tinpano-mintza', level: 2, origin: '1. faringe-mintza', derivative: 'Tinpano-mintza: kanpoan ektodermoa, barruan endodermoa eta tartean mesenkimazko geruza.', note: 'Hiru osagai histologiko ditu; ez da geruza bakarreko eratorria.', sources: [HEAD, 'https://pubmed.ncbi.nlm.nih.gov/38390727/'] },
      { id: 'arrail234', level: 3, origin: '2.–4. faringe-arrailak', derivative: 'Lepoko sinua; garapen arruntean desagertzen da.', sources: [HEAD] },
    ],
  },
  {
    id: 'aurpegia-eta-mihia', topic: 12, title: 'Aurpegia, mihia eta inerbazioa',
    originHeading: 'Jatorria / eskualdea', derivativeHeading: 'Eratorria / nerbioa',
    rows: [
      { id: 'filtruma', level: 1, origin: 'Sudur-prozesu medialen fusioa', derivative: 'Segmentu intermaxilarra eta goiko ezpainaren erdiko atala / filtruma.', sources: [CRANIO] },
      { id: 'ezpain-alboak', level: 2, origin: 'Prozesu maxilarrak', derivative: 'Goiko ezpainaren alboko atalak.', sources: [CRANIO] },
      { id: 'behe-ezpaina', level: 3, origin: 'Barail-prozesuak', derivative: 'Beheko ezpaina eta barailaren eskualdea.', sources: [CRANIO] },
      { id: 'mihi-aurreko-sents', level: 1, origin: 'Mihiaren aurreko 2/3ak · sentsibilitate orokorra', derivative: 'Mihi-nerbioa, V3 trigeminoaren adarra.', sources: [TONGUE] },
      { id: 'mihi-aurreko-dast', level: 1, origin: 'Mihiaren aurreko 2/3ak · dastamena', derivative: 'VII aurpegi-nerbioa, tinpanoko sokaren bidez.', note: 'Papila zirkunbalatuak salbuespena dira: IX nerbioa.', sources: [TONGUE] },
      { id: 'mihi-atzeko', level: 2, origin: 'Mihiaren atzeko 1/3a', derivative: 'IX glosofaringeoa: sentsibilitate orokorra eta dastamena.', sources: [TONGUE] },
      { id: 'mihi-epiglotis', level: 3, origin: 'Epiglotis inguruko mihi-eskualdea', derivative: 'X bagoaren goiko adar laringeoa.', sources: [TONGUE] },
      { id: 'tiroglosoa', level: 1, origin: 'Mihiaren foramen caecumaren mailako tiroide-hastapena', derivative: 'Tiroidesaren jaitsierako hodi tiroglosoa; normalean desagertu egiten da.', note: 'Hodi tiroglosoak ez du mihia sortzen.', sources: [TONGUE, CRANIO] },
    ],
  },
  {
    id: 'zain-sistemen-eratorriak', topic: 13, title: 'Zain-sistemen jatorriak eta eratorriak',
    originHeading: 'Jatorria', derivativeHeading: 'Eratorria / drainatzea',
    rows: [
      { id: 'zain-sarrera', level: 3, origin: 'Zain bitelinoak, zilborreko zainak eta kardinal komunak', derivative: 'Zain-sinuaren bi luzapenetan amaitzen diren hasierako hiru zain-sistemak.', sources: ['w13/2/p3/s1'] },
      { id: 'porta', level: 2, origin: 'Duodeno inguruko zain bitelinoen plexuaren birmoldaketa', derivative: 'Porta zaina.', sources: ['w13/2.1.1/p3/s4', 'w13/2.1.1/p7/s3', 'w13/2.1.2/p3/s1'] },
      { id: 'kaba-goikoa', level: 2, origin: 'Eskuineko aurreko kardinalaren hurbileko atala + eskuineko kardinal komuna', derivative: 'Goiko kaba zaina.', sources: ['w13/3.2/p3/s1'] },
      { id: 'brakiozefalikoL', level: 1, origin: 'Bi aurreko zain kardinalen arteko anastomosia', derivative: 'Ezkerreko zain brakiozefalikoa.', note: 'Zainen arteko lotura da, ez arterien artekoa.', sources: ['w13/3.2/p4/s1', 'w13/3.2/p5/s1'] },
      { id: 'jugularrak', level: 3, origin: 'Aurreko zain kardinalen urrutiko atalak', derivative: 'Barruko zain jugularrak.', sources: ['w13/3.2/p6/s1', 'w13/3.2/p9/s1'] },
      { id: 'brakiozefalikoak-kaba', level: 3, origin: 'Eskuineko eta ezkerreko zain brakiozefalikoak', derivative: 'Elkartzean goiko kaba zaina osatzen dute.', sources: ['w13/3.2/p10/s3', 'w13/3.2/p14/s1'] },
      { id: 'azigos', level: 1, origin: 'Eskuineko suprakardinala + atzeko kardinalaren hurbileko osagaia', derivative: 'Azigos zaina; goiko kaba zainean irekitzen da.', sources: ['w13/2.3.1/p5/s1', 'w13/2.3.1/p5/s3'] },
      { id: 'hemiazigos', level: 2, origin: 'Ezkerreko suprakardinala', derivative: 'Hemiazigos eta hemiazigos laguntzailea; azigosera drainatzen dute.', sources: ['w13/2.3.1/p6/s1', 'w13/2.3.1/p9/s1'] },
    ],
  },
  {
    id: 'beheko-kabaren-atalak', topic: 13, title: 'Beheko kaba zainaren osagaiak',
    originHeading: 'Jatorria / eredua', derivativeHeading: 'Atala / eratorria',
    lead: 'Hiru segmentu, hiru jatorri: gibel-segmentua, giltzurrun-segmentua eta segmentu sakrokardinala.',
    rows: [
      { id: 'kaba-hepatikoa', level: 2, origin: 'Eskuineko hodi hepatokardiakoa, zain bitelinoaren azken atala', derivative: 'Beheko kaba zainaren gibel-segmentua.', sources: ['w13/3.1/p4/s1', 'w13/2.1.1/p5/s3', 'w13/2.1.1/p5/s4'] },
      { id: 'kaba-subkardinala', level: 1, origin: 'Eskuineko kardinal azpiko zaina / subkardinala', derivative: 'Beheko kaba zainaren giltzurrun-segmentua.', note: 'Ez da goiko kaba, ez azigosa: azigosa eskuineko kardinal gaineko zainetik dator.', sources: ['w13/3.1/p8/s1', 'w13/2.3.1/p5/s1'] },
      { id: 'kaba-sakrokardinala', level: 3, origin: 'Eskuineko zain sakrokardinalaren hurbileko atala', derivative: 'Beheko kaba zainaren segmentu sakrokardinala.', sources: ['w13/3.1/p11/s1', 'w13/3.1/p12/s1'] },
      { id: 'giltzurrun-zainL', level: 3, origin: 'Bi kardinal azpiko zainen arteko anastomosia', derivative: 'Ezkerreko giltzurrun-zaina.', sources: ['w13/3.1/p6/s2'] },
      { id: 'iliako-zainL', level: 3, origin: 'Bi zain sakrokardinalen arteko anastomosia', derivative: 'Ezkerreko zain iliako primitiboa / komuna.', sources: ['w13/3.1/p9/s2'] },
    ],
  },
  {
    id: 'fetuaren-zirkulazioa', topic: 13, title: 'Fetuaren odol-ibilbideak',
    originHeading: 'Hodia / igarobidea', derivativeHeading: 'Norabidea / eginkizuna',
    rows: [
      { id: 'umbilikalL', level: 1, origin: 'Ezkerreko zilborreko zaina', derivative: 'Karenatik fetura oxigenoan aberatsa den odola eramaten du; jaiotzara arte funtzionatzen du.', note: 'Eskuineko zilborreko zaina osorik desagertzen da garapenean.', sources: ['w13/2.2/p5/s1', 'w13/2.2/p7/s1', 'w13/4.2/p7/s1'] },
      { id: 'duktus-benosus', level: 1, origin: 'Hodi benosoa', derivative: 'Ezkerreko zilborreko zainaren eta eskuineko hodi hepatokardiakoaren artean hedatzen da.', note: 'Ez kardinalen, bitelinoen edo azigos/hemiazigosen artean. Gibel barneko plexua saihesten du.', sources: ['w13/2.2/p7/s2', 'w13/2.2/p7/s4', 'w13/2.2/p7/s5'] },
      { id: 'kaba-nahasketa', level: 2, origin: 'Beheko kaba zaina, gibel-mailan', derivative: 'Hodi benosotik datorren odol oxigenatua behetik (adib. giltzurrunetatik) igotzen den oxigeno gutxiko odolarekin nahasten da.', note: 'Odol oxigenatua gibel-segmentuan sartzen da, ez giltzurrun-segmentuan.', sources: ['w13/4.1.1/p3/s2', 'w13/4.1.1/p3/s5', 'w13/4.1.1/p3/s6'] },
      { id: 'porta-fluxua', level: 2, origin: 'Porta zaina', derivative: 'Oxigeno gutxiko odola gibel barneko plexura; han zilbor-odolaren zati txiki batekin nahasten da.', sources: ['w13/4.1.1/p3/s3', 'w13/4.1.1/p3/s4', 'w13/4.1.1/p3/s7'] },
      { id: 'kaba-goiko-fluxua', level: 2, origin: 'Goiko kaba zaina', derivative: 'Oxigeno saturazio baxuko odola eskuineko aurikulara; gehiena eskuineko bentrikulura eta birika-enborrera doa.', sources: ['w13/4.1.2/p3/s4', 'w13/4.1.2/p3/s5'] },
      { id: 'foramen-fluxua', level: 3, origin: 'Zulo obala', derivative: 'Eskuineko aurikulatik ezkerreko aurikulara odol-fluxua ahalbidetzen du.', sources: ['w11/2.2/p5/s1'] },
      { id: 'duktus-arteriosus', level: 3, origin: 'Hodi arteriosoa', derivative: 'Birika-arteria / enborretik beheranzko aortara; biriketako zirkulazioaren zati handi bat saihesten du.', sources: ['w12/2.4/p14/s1', 'w12/2.4/p14/s2'] },
      { id: 'umbilikal-arteriak', level: 2, origin: 'Zilborreko arteriak', derivative: 'Fetutik karenara oxigeno gutxiagoko odola eramaten dute.', sources: ['w13/4.1.2/p3/s11', 'w13/4.1.2/p3/s12'] },
    ],
  },
  {
    id: 'jaiotzako-aldaketak', topic: 13, title: 'Jaiotzako aldaketak eta ondorengo hondarrak',
    originHeading: 'Prozesua / egitura', derivativeHeading: 'Aldaketa / patua',
    lead: 'Itxiera funtzionala eta ondorengo fibrosia ez dira une berean gertatzen.',
    rows: [
      { id: 'arnasketa', level: 1, origin: 'Lehen arnasketak', derivative: 'Biriketako erresistentzia jaisten da eta biriketako odol-fluxua handitzen da.', sources: [HEART, 'w13/4.2/p3/s1'] },
      { id: 'presio-aurikularrak', level: 1, origin: 'Karenako itzuleraren etena + birika-zainetako itzulera handiagoa', derivative: 'Eskuineko aurikulako presioa jaisten eta ezkerrekoa igotzen da; zulo obala funtzionalki ixten da.', sources: [HEART, 'w11/2.2/p7/s3', 'w11/2.2/p7/s4'] },
      { id: 'lotailu-arteriosoa', level: 1, origin: 'Hodi arteriosoa', derivative: 'Itxi egiten da eta lotailu arteriosoa bihurtzen da, 3. hilabeterako.', note: 'Lotailua ez da jaiotzaren unean eratzen.', sources: ['w13/4.2/p10/s1'] },
      { id: 'lotailu-borobila', level: 1, origin: 'Ezkerreko zilborreko zaina', derivative: 'Gibelaren lotailu borobila.', sources: ['w13/4.2/p8/s1'] },
      { id: 'lotailu-benosoa', level: 1, origin: 'Hodi benosoa', derivative: 'Gibelaren lotailu benosoa.', sources: ['w13/4.2/p9/s1'] },
      { id: 'umbilikal-distal', level: 3, origin: 'Zilborreko arterien urrutiko atalak', derivative: 'Erdialdeko zilbor-lotailuak, fibrosi bidez.', sources: ['w13/4.2/p5/s1'] },
      { id: 'umbilikal-proximal', level: 3, origin: 'Zilborreko arterien hurbileko atalak', derivative: 'Irekita mantentzen dira; goiko maskuri-arteriekin lotutako atal erabilgarriak.', sources: ['w13/4.2/p6/s1'] },
      { id: 'koronario-lotailua', level: 2, origin: 'Gibelaren lotailu koronarioak', derivative: 'Gibeleko eta diafragma azpiko peritoneoaren arteko loturak.', note: 'Ez dira jaiotzean ixten den fetu-hodi baten hondarrak.', sources: ['w14/3.4/p13/s2', 'w14/3.4/p13/s3'] },
    ],
  },
  {
    id: 'hesteen-eratorriak', topic: 14, title: 'Aurreko, bitarteko eta atzeko hestearen eratorriak',
    originHeading: 'Jatorria', derivativeHeading: 'Eratorriak / muga',
    rows: [
      { id: 'faringe-hestea', level: 2, origin: 'Faringe-hestea', derivative: 'Mintz orofaringeotik arnas aparatuaren hastapeneraino; alboko paretetatik faringe-poltsak sortzen dira.', note: 'Arnas aparatuaren hastapena da faringe-hestearen eta aurreko hestearen arteko muga.', sources: ['w14/2.1/p11/s1', 'w14/2.1/p11/s2', 'w14/2.1/p12/s1'] },
      { id: 'hestegorria', level: 2, origin: 'Aurreko hestearen hasierako atala, arnas hastapenaren atzean', derivative: 'Hestegorria.', note: 'Ez da faringe-hestetik sortzen. Goiko 2/3etan muskulu ildaskatua; beheko herenean muskulu lisoa, errai-orritik.', sources: ['w14/3.1/p3/s1', 'w14/3.1/p3/s2', 'w14/3.1/p5/s1', 'w14/3.1/p6/s1'] },
      { id: 'aurreko-hestea', level: 1, origin: 'Aurreko hestea', derivative: 'Hestegorria, urdaila eta duodenoaren atal proximala; gibel, behazun-bide eta arearen hastapenak.', sources: ['w14/3/p3/s2', 'w14/3.5/p3/s1', 'w14/3.6/p3/s1'] },
      { id: 'duodeno-muga', level: 1, origin: 'Duodenoa', derivative: 'Jatorri bikoitza: aurreko eta bitarteko hesteak; muga behazun-hodiaren sarreraren mailan.', sources: ['w14/3.3/p3/s3', 'w14/3.3/p9/s1', 'w14/3.3/p9/s2', GUT] },
      { id: 'bitarteko-hestea', level: 1, origin: 'Bitarteko hestea', derivative: 'Duodeno distala, jejunoa, ileona, kolon itsua, apendizea, goranzko kolona eta zeharkako kolonaren hurbileko 2/3ak.', sources: [MIDGUT] },
      { id: 'atzeko-hestea', level: 2, origin: 'Atzeko hestea', derivative: 'Zeharkako kolonaren urrutiko 1/3a, beheranzko kolona, sigmoidea, ondestea eta uzki-hodiaren goiko atala.', sources: [GUT] },
      { id: 'uzki-distala', level: 1, origin: 'Proktodeoko ektodermoa', derivative: 'Uzki-hodiaren beheko atala, lerro pektinatuaren azpitik.', note: 'Ez da atzeko hesteko endodermoaren eratorria.', sources: [GUT] },
      { id: 'heste-geruzak', level: 3, origin: 'Heste-hodiko endodermoa', derivative: 'Digestio-hodiko epitelioa eta guruin askoren parenkima.', note: 'Muskulua eta ehun konektiboa inguruko mesodermotik datoz.', sources: ['w14/3.1/p4/s1', 'w14/3.1/p6/s1', GUT] },
      { id: 'barea-jatorria', level: 3, origin: 'Mesogastrio dortsaleko mesenkima', derivative: 'Barea; jatorri mesodermikoa.', note: 'Ez da heste-endodermoaren eratorria, nahiz eta enbor zeliakoak irrigatu.', sources: ['w14/3.2/p11/s1', 'w14/3.2/p11/s2', 'w12/2.5.1/p6/s2', GUT] },
    ],
  },
  {
    id: 'heste-lakioa', topic: 14, title: 'Hasierako heste-lakioa eta biraketa',
    originHeading: 'Atala / prozesua', derivativeHeading: 'Eratorria / erlazioa',
    rows: [
      { id: 'lakio-zefalikoa', level: 2, origin: 'Heste-lakioaren adar zefalikoa', derivative: 'Duodeno distala, jejunoa eta ileonaren zati handiena.', sources: [MIDGUT, GUT] },
      { id: 'lakio-kaudala', level: 1, origin: 'Heste-lakioaren adar kaudala', derivative: 'Ileon distala, kolon itsua, apendizea, goranzko kolona eta zeharkako kolonaren hurbileko 2/3ak.', note: 'Ez da atzeko hestearen sinonimoa.', sources: [MIDGUT, GUT] },
      { id: 'lakio-ardatza', level: 2, origin: 'Biraketa-ardatza', derivative: 'Goiko arteria mesenterikoa.', note: 'Ez enbor zeliakoa, ez abdomeneko aorta osotasunean.', sources: [MIDGUT] },
      { id: 'hernia-fisiologikoa', level: 3, origin: 'Hernia fisiologikoa', derivative: 'Lakioa aldi baterako zilbor-eremura irteten da, abdomeneko espazioa mugatua delako.', sources: [MIDGUT] },
      { id: 'biraketa270', level: 3, origin: 'Biraketa osoa, eredu klasikoan', derivative: '270° erloju-orratzen aurka, enbrioia aurretik ikusita: 90° + 180°.', sources: [MIDGUT, GUT] },
      { id: 'heste-itzulera', level: 1, origin: 'Abdomenera itzulera', derivative: '10. astearen inguruan (3. hilabetearen amaiera): jejunoaren hurbileko atala lehena, kolon itsuaren hastapena azkena.', sources: [GUT, MIDGUT] },
      { id: 'zeku-jaitsiera', level: 3, origin: 'Kolon itsuaren hastapena', derivative: 'Hasieran gibel azpian; gero eskuineko hobi iliakorantz jaisten da.', sources: [MIDGUT] },
    ],
  },
  {
    id: 'mesogastrioen-eratorriak', topic: 14, title: 'Mesogastrio dortsalaren eta bentralaren eratorriak',
    originHeading: 'Jatorria', derivativeHeading: 'Eratorria / lotura',
    rows: [
      { id: 'meso-dorsal-epiploia', level: 1, origin: 'Mesogastrio dortsala', derivative: 'Epiploi handia / epiploi-amantala.', sources: ['w14/3.2/p12/s2', 'w14/3.2/p12/s3'] },
      { id: 'meso-dorsal-gastrolienala', level: 1, origin: 'Mesogastrio dortsala, urdailaren eta barearen artean', derivative: 'Lotailu gastroesplenikoa / gastrolienala.', sources: ['w14/3.2/p11/s5', 'w14/3.2/p11/s6'] },
      { id: 'meso-dorsal-esplenorrenala', level: 3, origin: 'Mesogastrio dortsala, barearen eta atzeko paretaren artean', derivative: 'Lotailu esplenoerrenala.', sources: ['w14/3.2/p11/s7'] },
      { id: 'meso-ventral-epiploia', level: 1, origin: 'Mesogastrio bentrala', derivative: 'Epiploi txikia: lotailu gastrohepatikoa eta hepatoduodenala.', sources: ['w14/3.2/p14/s3', 'w14/3.4/p15/s1'] },
      { id: 'meso-ventral-faltziformea', level: 1, origin: 'Mesogastrio bentrala, gibeletik aurreko paretara', derivative: 'Lotailu faltziformea.', sources: ['w14/3.2/p14/s6', 'w14/3.4/p14/s2'] },
      { id: 'epiploi-fusioa', level: 2, origin: 'Epiploi handiaren atzeko geruzak', derivative: 'Zeharkako kolonarekin eta haren mesoarekin fusionatzen dira.', note: 'Ez jejunoaren mesenterioarekin.', sources: ['w14/3.2/p8/s6'] },
      { id: 'borobila-faltziformea', level: 2, origin: 'Lotailu faltziformearen beheko ertz librea', derivative: 'Gibelaren lotailu borobila dauka.', note: 'Lotailu borobila zilbor-zainaren hondarra da; lotailu faltziformea mesenterio-eratorria.', sources: ['w14/3.4/p11/s2'] },
    ],
  },
  {
    id: 'poltsa-omentala', topic: 14, title: 'Poltsa omentala eta lotura garrantzitsuak',
    originHeading: 'Egitura / kokapena', derivativeHeading: 'Erlazioa',
    rows: [
      { id: 'poltsa-sorrera', level: 3, origin: 'Urdailaren biraketa eta mesogastrio dortsalaren ezkerreratzea', derivative: 'Urdailaren atzeko poltsa omentala / epiploiaren transkabitatea.', sources: ['w14/3.2/p8/s1', 'w14/3.2/p8/s3'] },
      { id: 'poltsa-ezkerra', level: 2, origin: 'Poltsa omentalaren ezkerreko muga', derivative: 'Barea eta lotailu gastroespleniko zein esplenoerrenalaren eskualdea.', sources: ['w14/3.2/p11/s5', 'w14/3.2/p11/s7', GUT] },
      { id: 'poltsa-aurrea', level: 3, origin: 'Poltsa omentalaren aurreko erlazioak', derivative: 'Urdaila eta epiploi txikia.', sources: ['w14/3.4/p15/s2'] },
      { id: 'winslow', level: 3, origin: 'Winslow zuloa / foramen epiploikoa', derivative: 'Poltsa omentala peritoneo-barrunbe nagusiarekin komunikatzen du.', sources: ['w14/3.2/p14/s4', 'w14/3.4/p15/s6'] },
      { id: 'epiploi-ertz-librea', level: 3, origin: 'Epiploi txikiaren eskuineko ertz librea / lotailu hepatoduodenala', derivative: 'Porta zaina, gibel-arteria eta koledokoa; Winslow zuloaren aurrean.', sources: ['w14/3.4/p15/s4', 'w14/3.4/p15/s5'] },
      { id: 'heste-irrigazioa', level: 2, origin: 'Aurreko · bitarteko · atzeko hestea', derivative: 'Enbor zeliakoa · goiko arteria mesenterikoa · beheko arteria mesenterikoa.', sources: ['w12/2.5.1/p6/s1', 'w12/2.5.1/p7/s1', 'w12/2.5.1/p8/s1'] },
    ],
  },
];

/** Arch systems, read down a column (one arch) or across a row (one system). */
export type ArchSystem = 'nerve' | 'muscle' | 'skeleton' | 'artery' | 'pouch' | 'cleft';

export interface ArchCell {
  text: string;
  note?: string;
  level: ReferenceLevel;
  sources: string[];
}

export const ARCH_SYSTEMS: { id: ArchSystem; label: string }[] = [
  { id: 'nerve', label: 'Nerbioa' },
  { id: 'muscle', label: 'Muskuluak' },
  { id: 'skeleton', label: 'Kartilagoa / hezurrak' },
  { id: 'artery', label: 'Arku aortikoa' },
  { id: 'pouch', label: 'Poltsa' },
  { id: 'cleft', label: 'Arraila · mintza' },
];

export const ARCH_GRID: { arch: string; cells: Record<ArchSystem, ArchCell | null> }[] = [
  {
    arch: '1. arkua',
    cells: {
      nerve: { text: 'V · trigeminoa (V3, barail-nerbioa)', level: 1, sources: ['w9/2.1.1/p7/s1', CRANIO] },
      muscle: { text: 'Murtxikatzaileak: lokikoa, maseteroa, pterigoideoak; digastrikoaren aurreko sabela, milohioideoa, tinpano- eta ahosabai-tentsoreak', level: 1, sources: ['w9/2.1.1/p6/s2', CRANIO] },
      skeleton: { text: 'Meckel kartilagoa → mailua eta ingudea', note: 'Baraila eta goiko maxilarra inguruko mesenkimatik, mintzezko hezurtzapenez.', level: 2, sources: ['w8/3.2/p12/s2', 'w8/3.2/p13/s1', 'w8/3.2/p14/s1', CRANIO] },
      artery: { text: 'Arteria maxilarraren zati bat; gainerakoa desagertzen da', level: 3, sources: ['w12/2.1/p5/s1', 'w12/2.1/p5/s2'] },
      pouch: { text: 'Urrutikoa → tinpano-kutxa · hurbilekoa → Eustakioren tronpa', level: 1, sources: [CRANIO] },
      cleft: { text: '1. arraila → kanpoko entzumen-bidea · 1. mintza → tinpano-mintza', note: 'Tinpano-mintza: kanpoan ektodermoa, tartean mesenkima, barruan endodermoa.', level: 2, sources: [HEAD] },
    },
  },
  {
    arch: '2. arkua',
    cells: {
      nerve: { text: 'VII · aurpegi-nerbioa', note: 'Mihiaren aurreko 2/3en dastamena ere VII-k (tinpanoko soka).', level: 1, sources: ['w9/2.1.1/p7/s3', TONGUE] },
      muscle: { text: 'Aurpegiko muskulu mimikoak; estapedioa, estilohioideoa, digastrikoaren atzeko sabela', level: 1, sources: ['w9/2.1.1/p7/s2', CRANIO] },
      skeleton: { text: 'Reichert kartilagoa → estriboa, apofisi estiloidea, lotailu estilohioideoa, hioidearen adar txikiak eta gorputzaren goiko atala', level: 2, sources: ['w8/3.2/p15/s1', HEAD] },
      artery: { text: 'Arteria hioideo eta estapedioaren hondarrak', level: 3, sources: ['w12/2.1/p6/s1', 'w12/2.1/p6/s2'] },
      pouch: { text: 'Ahosabaiko amigdala (epitelioa eta kriptak)', level: 1, sources: [CRANIO] },
      cleft: { text: '2.–4. arrailak → lepoko sinua; desagertzen da', level: 3, sources: [HEAD] },
    },
  },
  {
    arch: '3. arkua',
    cells: {
      nerve: { text: 'IX · glosofaringeoa', level: 2, sources: ['w9/2.1.1/p9/s1'] },
      muscle: { text: 'Estilofaringeoa (bakarra)', level: 2, sources: ['w9/2.1.1/p8/s1'] },
      skeleton: { text: 'Hioidearen adar handiak eta gorputzaren beheko atala', level: 2, sources: [HEAD] },
      artery: { text: 'Karotida komunak eta barneko karotiden hurbileko atala', level: 2, sources: ['w12/2.3.2/p4/s1'] },
      pouch: { text: 'Dortsala → beheko paratiroideak · bentrala → timoa', note: 'Timoarekin jaisten direnez, beheko paratiroideak 3.tik datoz, ez 4.tik.', level: 1, sources: [PARATHYROID] },
      cleft: { text: 'Lepoko sinuaren atala; desagertzen da', level: 3, sources: [HEAD] },
    },
  },
  {
    arch: '4. arkua',
    cells: {
      nerve: { text: 'X · bagoa: goiko nerbio laringeoa', level: 2, sources: ['w9/2.1.2/p4/s2', 'w12/2.4/p8/s5'] },
      muscle: { text: 'Krikotiroideoa, faringe-hertsatzaileak, ahosabai-jasotzailea', level: 2, sources: ['w9/2.1.2/p4/s1', CRANIO] },
      skeleton: { text: 'Laringeko kartilagoak, 6. arkuarekin batera', level: 2, sources: [HEAD] },
      artery: { text: 'Ezkerra → aorta-makoaren atala · eskuina → eskuineko subklabioaren hurbileko atala', note: 'Eskuineko nerbio atzerakariak eskuineko subklabioa inguratzen du.', level: 1, sources: ['w12/2.3.2/p9/s1', 'w12/2.3.2/p11/s1', 'w12/2.4/p13/s1'] },
      pouch: { text: 'Dortsala → goiko paratiroideak · gorputz ultimobrankiala → tiroidearen C zelulak', level: 2, sources: [PARATHYROID, CRANIO] },
      cleft: { text: 'Lepoko sinuaren atala; desagertzen da', level: 3, sources: [HEAD] },
    },
  },
  {
    arch: '6. arkua',
    cells: {
      nerve: { text: 'X · bagoa: nerbio laringeo atzerakaria', level: 1, sources: ['w12/2.4/p8/s5', 'w12/2.4/p10/s1'] },
      muscle: { text: 'Laringeko muskulu intrintsekoak, krikotiroideoa izan ezik', level: 1, sources: ['w9/2.1.2/p4/s1', CRANIO] },
      skeleton: { text: 'Laringeko kartilagoak, 4. arkuarekin batera', level: 2, sources: [HEAD] },
      artery: { text: 'Hurbilekoak → birika-arteriak · ezkerreko urrutikoa → hodi arteriosoa (lotailu arteriosoa)', note: 'Ezkerreko nerbio atzerakariak hodi / lotailu arteriosoa inguratzen du.', level: 1, sources: ['w12/2.3.4/p9/s1', 'w12/2.3.4/p9/s2', 'w12/2.4/p14/s4'] },
      pouch: null,
      cleft: null,
    },
  },
];

/** Tables shown with the arch grid in the Arku sistemak view. */
export const ARCH_TABLE_IDS = ['arkua-ala-poltsa', 'arkuak-muskuluak-nerbioak', 'faringe-poltsak', 'arku-aortikoak', 'arteria-konexioak', 'faringe-arkuak-eta-mintzak', 'aurpegia-eta-mihia'];
