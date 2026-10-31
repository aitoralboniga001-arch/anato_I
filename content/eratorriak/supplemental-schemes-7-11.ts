import type { MigrationTopic, MNode } from '../migrations';

const l = (label: string, kids?: MNode[], note?: string): MNode => ({ label, kids, note, via: 'erlazioa' });
const n = (id: string, kids?: MNode[]): MNode => ({ id, kids });

/** Complements the developmental trees with spatial relationships and functional transitions.
 * Sources: notes-text/w7–w11; UNSW Embryology Week_4, Neural_Crest_Development,
 * Endocrine_-_Adrenal_Development; NCBI Bookshelf NBK470179 (laryngeal branches).
 */
export const SUPPLEMENTAL_7_11: MigrationTopic[] = [
  {
    week: 7, short: 'Barrunbeak', flows: [
      {
        id: 'erretenen-kokapen-espaziala', title: 'Erreten perikardioperitonealak irudietan kokatu', stage: 'septum-transversum',
        lead: 'Bi erretenak septum transversumaren atze-alboetan daude; septumak ez du hasieran zeloma guztiz ixten.',
        roots: [l('Septum transversuma', [l('Atze-alboetan: bi pasabide', [l('Goiko barrunbea eta beheko peritoneo barrunbea lotu'), l('Birika-hastapenak haztean: pleura barrunbeak'), l('Mintz pleuroperitonealak fusionatzean: komunikazioa itxi')])])],
      },
      {
        id: 'tolespenen-ondorioak', title: 'Bi tolespenak: zergatia eta ondorioa', stage: 'zeloma',
        lead: 'Tolespen zefalokaudala eta zeharkakoa prozesu desberdinak dira; gorputzaren forma eta barrunbeen kokapena aldatzen dituzte.',
        roots: [
          l('Nerbio-sistema zentralaren luzetarako hazkuntza', [l('Tolespen zefalokaudala', [l('Buru- eta isats-muturrak bentralki tolestu'), l('Eskualde kardiogenikoa toraxera eraman')])]),
          l('Somiten eta alboko ehunen hazkuntza', [l('Zeharkako tolespena', [l('Alboko paretak bentralki hurbildu'), l('Bi endokardio hodiak erdian elkartu')])]),
        ],
      },
      {
        id: 'zelomaren-mugak', title: 'Zeloma: orrien arteko espazioa eta komunikazioak', stage: 'zeloma',
        lead: 'Enbrioi barruko zeloma alboko mesodermoaren paretako eta errai orrien artean dago; ez du amnios barrunbea bitelo-zakuarekin lotzen.',
        roots: [
          n('enbrioi-barruko-zeloma', [l('Paretako orria', undefined, 'ektodermoaren ondoan'), l('Errai orria', undefined, 'endodermoaren ondoan'), l('Enbrioi kanpoko zelomarekin komunikazioa', [l('Tolespenek mugatu eta komunikazioa galdu')], 'hasierakoa, behin-behinekoa')]),
          n('septum-transversum', [l('Goian: hasierako perikardio barrunbea'), l('Behean: peritoneo barrunbea'), l('Atze-alboetan: erreten perikardioperitonealak', [l('Goiko eta beheko atalak komunikatu'), l('Mintz pleuroperitonealek itxi', undefined, '7. astean')])]),
        ],
      },
      {
        id: 'peritoneo-kokapenak', title: 'Peritoneoarekiko kokapena: organoak eta salbuespenak', stage: 'peritoneo-barrunbea',
        lead: 'Peritoneo barruko organoa errai peritoneoz estalita dago eta meso bidez lotuta; ez dago peritoneo barrunbearen hutsunean libre.',
        roots: [
          l('Peritoneo barrukoak', [l('Urdaila, gibela eta barea'), l('Jejunoa eta ileona'), l('Kolon itsua eta apendizea'), l('Zeharkako kolona eta kolon sigmoideoa'), l('Duodenoaren lehen zatiaren hasiera', undefined, 'lehen 2 cm inguru; ez lehen zati osoa')]),
          l('Bigarren mailako retroperitonealak', [l('Duodenoaren gainerakoa', undefined, '2., 3. eta 4. zatiak barne'), l('Goranzko eta beheranzko kolona'), l('Area', undefined, 'isatsa izan ezik; isatsa lotailu esplenorrenalean dago')]),
          l('Peritoneo kanpoko beste egiturak', [l('Giltzurrunak'), l('Abdomeneko aorta eta beheko kaba zaina'), l('Ondestea', undefined, 'goian azal batzuk bakarrik estalita; behean subperitoneala')]),
        ],
      },
    ],
  },
  {
    week: 8, short: 'Hezurrak', flows: [
      {
        id: 'kondrokraneoa-orientatu', title: 'Kondrokraneoa irudian orientatu', stage: 'kondrokraneoa',
        lead: 'Lehenik aurreko eta atzeko muturrak bereizi, eta ondoren hipofisiaren, begien eta belarrien kokapena erreferentziatzat hartu.',
        roots: [l('Hipofisiaren ingurua', [l('Hipofisi-kartilagoak', undefined, 'erdialdean; esfenoidesaren gorputzaren eredua')]), l('Begiaren ingurua', [l('Begizulo-hegoa', undefined, 'hego txikiaren eredua; hego tenporaletik bereizi')]), l('Belarriaren ingurua', [l('Kapsula periotikoa', undefined, 'albo-atzeko kokapena; zati petrosoa eta mastoideoa')])],
      },
      {
        id: 'kondrokraneo-parekatzeak', title: 'Kondrokraneoa: kartilago bakoitzaren hezur-atala', stage: 'kondrokraneoa',
        lead: 'Kartilagozko eredua hezurtzapen endokondralaren bidez ordezkatzen da; ez nahastu esfenoidesaren gorputza eta bi hegoak.',
        roots: [
          n('hipofisi-kartilagoak', [n('esfenoidesaren-gorputza')]),
          n('hego-tenporala', [n('esfenoidesaren-hego-handia')]),
          n('begizulo-hegoa', [n('esfenoidesaren-hego-txikia')]),
          n('kapsula-periotikoa', [l('Tenporalaren zati petrosoa eta mastoideoa', undefined, 'harkaitzak barne-belarria inguratzen du')]),
          n('mesodermo-paraxiala', [n('okzipitalaren-ezkata')]),
        ],
      },
      {
        id: 'gandor-neuralaren-ehunak', title: 'Gandor neuralaren eratorriak eta mesodermoarenak', stage: 'jatorriak',
        lead: 'Gandor neurala jatorri ektodermikokoa da. Giltzurrun gaineko guruinaren muina eta kortexa jatorri desberdinetakoak dira.',
        roots: [
          n('gandor-neurala', [l('Aurpegiko mesenkima', [l('Goiko maxilarra eta baraila')]), l('Melanozitoak'), l('Gongoil espinaletako neurona sentsitiboak'), l('Gongoil sinpatikoetako neuronak'), l('Giltzurrun gaineko guruinaren muina')]),
          l('Mesodermoa', [l('Giltzurrun gaineko guruinaren kortexa', undefined, 'ez da gandor neuralaren eratorria')]),
        ],
      },
      {
        id: 'adar-hastapenen-egutegia', title: 'Gorputz-adarren hastapenak eta ehunen jatorriak', stage: 'gorputz-adarrak',
        lead: 'Hastapenak enbrioi-aldian agertzen dira: 4. astearen amaieran, goikoak behekoak baino lehenago; 5. astean hazten jarraitzen dute.',
        roots: [
          l('4. astearen amaiera', [l('Goiko gorputz-adarren hastapenak'), l('Beheko gorputz-adarren hastapenak', undefined, 'pixka bat geroago')]),
          n('paretako-orria', [l('Hastapenaren mesenkima', [l('Kartilagozko eredua', [l('Gorputz-adarren hezurrak')])])]),
          l('Somitetako mioblastoak', [l('Gorputz-adarretara migratu', [l('Muskulu ildaskatuak')])]),
          l('Azaleko ektodermoa', [l('Estaldura eta erpineko ektodermo-ertza')]),
        ],
      },
    ],
  },
  {
    week: 9, short: 'Muskuluak', flows: [
      {
        id: 'aurpegi-eta-bago-nerbioak', title: 'Aurpegi-nerbioa eta bagoa: ibilbidea eta helburua', stage: 'okzipitalak',
        lead: 'Nerbioa ezagutzeko, haren jatorria, arkuekiko erlazioa eta muskulu-helburua batera lotu.',
        roots: [l('VII · Aurpegi-nerbioa', [l('2. faringe-arkuarekin erlazionatua', [l('Aurpegiko muskulu mimikoetara')])]), l('X · Nerbio bagoa', [l('4. eta 6. faringe-arkuekin erlazionatua'), l('Faringera eta laringera adarrak'), l('Nerbio laringeo atzekariak', undefined, 'toraxean arterien azpitik bihurtu eta laringera igo')])],
      },
      {
        id: 'begiko-nerbio-motorrak', title: 'Begi inguruko muskulu ildaskatuen nerbioak', stage: 'somitomeroak-burua',
        lead: 'Begiaren mugimenduan III., IV. eta VI. bikoteek parte hartzen dute. V1 adarra sentsitiboa da; ez ditu begi inguruko muskulu ildaskatuak motorrez inerbatzen.',
        roots: [
          l('III · Nerbio begi-eragilea', [l('Goiko, beheko eta erdiko muskulu zuzenak'), l('Beheko muskulu laprana'), l('Goiko betazalaren jasotzailea')]),
          l('IV · Nerbio troklearra', [l('Goiko muskulu laprana')]),
          l('VI · Nerbio aldentzailea', [l('Alboko muskulu zuzena')]),
          l('V1 · Nerbio oftalmikoa', [l('Sentsibilitatea', undefined, 'ez begiaren mugimendu motorra')]),
        ],
      },
      {
        id: 'arkuen-nerbio-adarrak', title: 'Faringe-arkuak, muskuluak eta nerbio-adarrak', stage: 'okzipitalak',
        lead: 'Arku bakoitzak bere nerbio motorra mantentzen du; IV. eta VI. arkuak bereizteko bagoaren adarra zehaztu behar da.',
        roots: [
          l('1. faringe-arkua', [l('V3 · Barail-nerbioa', [l('Muskulu murtxikatzaileak')])]),
          l('2. faringe-arkua', [l('VII · Aurpegi-nerbioa', [l('Muskulu mimikoak')])]),
          l('3. faringe-arkua', [l('IX · Nerbio glosofaringeoa', [l('Muskulu estilofaringeoa')])]),
          l('4. faringe-arkua', [l('X · Goiko nerbio laringeoa', [l('Kanpoko adarra: muskulu krikotiroideoa')]), l('X · Faringeko adarrak', [l('Faringeko muskulu hertsatzaileak')])]),
          l('6. faringe-arkua', [l('X · Nerbio laringeo atzekaria', [l('Laringeko gainerako muskulu intrintsekoak', undefined, 'krikotiroideoa izan ezik')])]),
        ],
      },
    ],
  },
  {
    week: 10, short: 'Bihotz hodia', flows: [
      {
        id: 'bihotzaren-erreferentzia-espazialak', title: 'Endokardio hodiak eta lakioaren alde aurikularra kokatu', stage: 'bihotz-hodia',
        lead: 'Garapen-fasea bereizi: fusionatu aurretik bi hodi daude; lakioan, berriz, atal aurikularra bentrikuluen atze-goian kokatzen da.',
        roots: [l('Zeharkako tolespena baino lehen', [l('Bi endokardio hodi', undefined, 'alde banatan; erdira hurbildu eta fusionatzen dira')]), l('Bihotz lakioa', [l('Atal aurikularra / hasierako aurikula komuna', undefined, 'zain sinuaren eta atal bentrikularraren artean; lakioaren atze-goiko aldean'), l('Zain sinua', undefined, 'odolaren sarrera benosoa; atal aurikularrean irekitzen da')])],
      },
      {
        id: 'bihotz-hodiaren-orientazioa', title: 'Bihotz hodia: odolaren noranzkoa eta lakioa', stage: 'bihotz-hodia',
        lead: 'Hasieran odola mutur benosotik mutur arterialera doa; lakioa sortzean hodiko atalak lekuz aldatzen dira, beren jatorrizko jarraitutasuna mantenduz.',
        roots: [
          l('Mutur benosoa', [l('Zain sinua', [l('Atal aurikularra', [l('Atal bentrikularra', [l('Atal bulbarra', [l('Aorta zakua eta aorta arkuak')])])])])]),
          l('Lakioaren tolestura', [l('Atal bulbarra: aurrera, behera eta eskuinera'), l('Atal bentrikularra: ezkerrera'), l('Atal aurikularra eta zain sinua: atzera eta gora')]),
          l('Hodiaren pareta', [l('Barrutik kanpora: endokardioa → miokardioa → epikardioa'), l('Bihotz gelatina', undefined, 'endokardioaren eta miokardioaren arteko matrizea')]),
        ],
      },
    ],
  },
  {
    week: 11, short: 'Bihotz trenkadak', flows: [
      {
        id: 'trenkaden-kokapen-espaziala', title: 'Mintzezko trenkada eta trenkada aortikopulmonarra kokatu', stage: 'bentrikulu-arteko-trenkada',
        lead: 'Mintzezko atala txikia eta goikoa da; zati muskular handiaren eta irteera-bideen arteko tartea ixten du.',
        roots: [l('Bentrikuluen arteko trenkada', [l('Zati muskularra', undefined, 'beheko zatirik handiena'), l('Mintzezko zatia', undefined, 'goian; konoaren trenkadaren eta kuxin aurikulubentrikularren inguruan')]), l('Enbor arteriosoa', [l('Trenkada aortikopulmonar kiribila', undefined, 'aortaren eta birika-enborraren argiak banatzen ditu')])],
      },
      {
        id: 'septuen-erlazioak', title: 'Aurikularteko komunikazioa: zuloa, balbula eta itxiera', stage: 'jaiotza',
        lead: 'Zulo obala septum secundumaren beheko irekidura da; septum primumaren beheko atalak haren balbula osatzen du. Ez da komunikazio aurikulubentrikularra.',
        roots: [
          n('septum-primum', [l('Ostium primuma: behean, kuxinekin itxi'), l('Ostium secunduma: goiko zulaketak elkartzean'), l('Beheko atala: zulo obalaren balbula')]),
          n('septum-secundum', [l('Zulo obala: beheko irekidura')]),
          l('Jaiotzean birikak hedatu', [l('Birika-zainen itzulera handitu', [l('Ezkerreko aurikulako presioa eskuinekoa baino handiagoa', [l('Septum primuma septum secundumaren aurka', [l('Itxiera funtzionala; gero fusio anatomikoa')])])])]),
        ],
      },
      {
        id: 'zain-balbulen-fusioak', title: 'Zain-balbulak eta aurikularteko trenkada', stage: 'aurikulen-paretak',
        roots: [
          l('Ezkerreko zain-balbula eta septum spuriuma', [n('septum-secundum')]),
          l('Eskuineko zain-balbula', [l('Goiko aldea desagertu'), l('Beheko kaba zainaren balbula'), l('Sinu koronarioaren balbula')]),
        ],
      },
      {
        id: 'irteera-bideen-banaketa', title: 'Konoa eta enbor arteriosoa: bi irteera bereizi', stage: 'enbor-arteriosoa',
        lead: 'Trenkada tronkokonalak aortaren eta birika-enborraren bideak banatzen ditu; ez ditu elkarrekin komunikatzen.',
        roots: [
          n('arteria-konoa', [l('Bi bentrikuluetako atal lisoak: infundibuluak')]),
          n('enbor-arteriosoa', [l('Aortaren hasierako atala eta birika-enborra')]),
          l('Trenkada aortikopulmonar kiribila', [l('Ezkerreko bentrikulua → aorta'), l('Eskuineko bentrikulua → birika-enborra')]),
        ],
      },
    ],
  },
];
