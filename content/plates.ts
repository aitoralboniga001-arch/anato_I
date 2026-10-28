/**
 * Image cards (Irudi-fitxak): numbered plates for reading figures, topics 7 onward. Each plate is one
 * of the atlas's own views at one moment, its names drawn as numbers. The names numbered are the ones
 * the scene shows at that moment (or `only` of them). `key` plates are the figures every student must
 * be able to read; they come first in their topic and in the «Funtsezkoak» run.
 */
export interface Plate {
  id: string;
  week: number;
  stage: string;
  view: string;
  /** The moment (0..1 of the stage) the figure is taken at. */
  t: number;
  title: string;
  /** What to look at first: one line under the title. */
  hint?: string;
  key?: boolean;
  /** Number only these ids (in the scene's own names); default: every name drawn. */
  only?: string[];
}

export const PLATE_GROUPS: { week: number; title: string }[] = [
  { week: 7, title: 'Gorputzaren barrunbeak' },
  { week: 8, title: 'Hezur-sistema' },
  { week: 9, title: 'Muskulu-sistema' },
  { week: 10, title: 'Bihotz hodia eta bihotz lakioa' },
  { week: 11, title: 'Bihotzaren trenkadak' },
  { week: 12, title: 'Aorta arkuak eta arteriak' },
  { week: 13, title: 'Zain-sistema' },
];

export const PLATES: Plate[] = [
  // ——— 7. Body cavities: the septum transversum and the pericardioperitoneal canals first ———
  { id: '7-septum-sagitala', week: 7, stage: 'septum-transversum', view: 'sagitala', t: 1, key: true, title: 'Septum transversuma eta erreten perikardioperitonealak (sagitala)', hint: 'Bihotzaren eta gibelaren artean: septum transversuma; haren atzean, bi erretenak.' },
  { id: '7-septum-zeharkakoa', week: 7, stage: 'septum-transversum', view: 'zeharkakoa', t: 1, key: true, title: 'Erreten perikardioperitonealak (zeharkako ebakia)', hint: 'Hestegorriaren bi aldeetan, dortsolateralki.' },
  { id: '7-birika-hastapena', week: 7, stage: 'pleura-perikardioa', view: 'birika-hastapena', t: 1, key: true, title: 'Birika-hastapenak erreten perikardioperitonealetan', hint: 'Birika-hastapenak erretenetara hazten dira.' },
  { id: '7-barrunbeen-mapa', week: 7, stage: 'diafragma-eraketa', view: 'mapa', t: 1, key: true, title: 'Barrunbeen mapa: erretenak eta mintzak', hint: 'Zein mintzek ixten du erreten bakoitza, eta zein barrunbe banatzen ditu.' },
  { id: '7-pleura-perikardioa', week: 7, stage: 'pleura-perikardioa', view: 'zeharkakoa', t: 1, title: 'Pleura eta perikardio barrunbeak (zeharkakoa)' },
  { id: '7-zeloma', week: 7, stage: 'zeloma', view: 'zeharkakoa', t: 0.58, title: 'Enbrioi barruko zeloma (zeharkakoa)' },
  { id: '7-peritoneoa', week: 7, stage: 'peritoneo-barrunbea', view: 'zeharkakoa', t: 1, title: 'Peritoneo barrunbea eta mesenterio dortsala' },
  { id: '7-diafragma-patua', week: 7, stage: 'diafragma-eraketa', view: 'patua', t: 1, title: 'Diafragmaren lau jatorriak' },
  { id: '7-diafragma-azpitik', week: 7, stage: 'diafragma-heldua', view: 'azpitik', t: 1, title: 'Diafragma heldua azpitik' },
  { id: '7-diafragma-sagitala', week: 7, stage: 'diafragma-heldua', view: 'sagitala', t: 1, title: 'Diafragma heldua (sagitala)' },

  // ——— 8. Skeleton: the skull base (sphenoid) first ———
  { id: '8-kondrokraneoa', week: 8, stage: 'kondrokraneoa', view: 'goitik', t: 0.72, key: true, title: 'Kondrokraneoa goitik: esfenoidea eta burezurraren oinaldea', hint: 'Esfenoidearen gorputza, hego txikia (begizulo-hegoa) eta hego handia (hego tenporala).' },
  { id: '8-buru-ganga', week: 8, stage: 'buru-ganga', view: 'kupula', t: 0.86, key: true, title: 'Buru-ganga: joskurak eta fontanelak' },
  { id: '8-albotik', week: 8, stage: 'buru-ganga', view: 'albotik', t: 1, key: true, title: 'Burezurra albotik: esfenoidearen hego handia' },
  { id: '8-errai-kraneoa', week: 8, stage: 'errai-kraneoa', view: 'burezurra', t: 1, title: 'Errai kraneoa: aurpegiko hezurrak' },
  { id: '8-arkuak', week: 8, stage: 'errai-kraneoa', view: 'arkuak', t: 1, title: 'Faringe-arkuen kartilagoak' },
  { id: '8-ornoa', week: 8, stage: 'ornoa', view: 'goitik', t: 1, title: 'Ornoa goitik' },
  { id: '8-bizkarrezurra', week: 8, stage: 'bizkarrezurra', view: 'koronala', t: 1, title: 'Ornoen eta diskoen jatorria (koronala)' },
  { id: '8-gorputz-adarrak', week: 8, stage: 'gorputz-adarrak', view: 'hastapena', t: 1, title: 'Gorputz-adarretako hezurrak' },

  // ——— 9. Muscles ———
  { id: '9-burua-heldua', week: 9, stage: 'somitomeroak-burua', view: 'heldua', t: 1, title: 'Faringe-arkuen muskuluak helduan' },
  { id: '9-okzipitalak', week: 9, stage: 'okzipitalak', view: 'burua', t: 1, title: 'Somitomeroak, somita okzipitalak eta nerbio kranialak' },
  { id: '9-begia', week: 9, stage: 'somitomeroak-burua', view: 'begia', t: 1, title: 'Begiaren kanpoko muskuluak eta haien nerbioak' },
  { id: '9-domeinuak', week: 9, stage: 'domeinuak', view: 'domeinuak', t: 1, title: 'Domeinu primaxiala eta abaxiala' },
  { id: '9-adarrak', week: 9, stage: 'epaxial-hipaxial', view: 'adarrak', t: 1, title: 'Adar primarioak: muskulu epaxialak eta hipaxialak' },
  { id: '9-somita', week: 9, stage: 'somitaren-paretak', view: 'somita', t: 0.7, title: 'Somitaren paretak' },
  { id: '9-eroapena', week: 9, stage: 'bihotz-muskulua', view: 'eroapena', t: 1, title: 'Bihotzaren eroapen-sistema' },

  // ——— 10. The primitive heart ———
  { id: '10-atalak', week: 10, stage: 'bihotz-atalak', view: '3d', t: 0.72, key: true, title: 'Bihotz hodiaren atalak', hint: 'Kranealetik kaudalera: aorta zakua, atal bulbarra, bentrikularra, aurikularra eta zain sinua.' },
  { id: '10-lakioa', week: 10, stage: 'bihotz-lakioa', view: '3d', t: 1, key: true, title: 'Bihotz lakioa', hint: 'Lakioaren ondoren atal aurikularra atzean eta goian geratzen da.' },
  { id: '10-lakioa-hasiera', week: 10, stage: 'bihotz-lakioa', view: '3d', t: 0.06, key: true, title: 'Bihotz hodi zuzena: arteria-muturra eta zain-muturra' },
  { id: '10-zirkulazioa', week: 10, stage: 'zirkulazio-goiztiarra', view: 'alboa', t: 0.36, key: true, title: 'Lehen zirkulazioa: hiru zain-bikoteak eta arkuak (albotik)', hint: 'Zain sinura: bitelo-zainak, zilbor-zainak eta kardinal komunak.' },
  { id: '10-albotik', week: 10, stage: 'zirkulazio-goiztiarra', view: 'alboa', t: 0.25, key: true, title: 'Bihotz hodiaren atalak enbrioian (albotik)' },
  { id: '10-zilbor-bitelo', week: 10, stage: 'zirkulazio-goiztiarra', view: 'alboa', t: 0.14, title: 'Zilborrestea: zilbor- eta bitelo-zainak' },
  { id: '10-atal-aurikularra', week: 10, stage: 'atal-aurikularra', view: '3d', t: 1, key: true, title: 'Atal aurikularra eta zain sinuaren luzapenak' },
  { id: '10-bihotz-hodia', week: 10, stage: 'bihotz-hodia', view: 'zeharkakoa', t: 1, key: true, title: 'Bihotz hodiaren horma eta perikardioa (zeharkakoa)' },
  { id: '10-eskualde-kardiogenikoa', week: 10, stage: 'eskualde-kardiogenikoa', view: 'diskoa', t: 1, title: 'Eskualde kardiogenikoa diskoan' },
  { id: '10-bihotz-hodia-sagitala', week: 10, stage: 'bihotz-hodia', view: 'sagitala', t: 1, title: 'Bihotz hodia tolestu ondoren (sagitala)' },
  { id: '10-bulbarra', week: 10, stage: 'atal-bulbarra', view: 'eratorriak', t: 1, key: true, title: 'Atal bulbarra eta haren eratorriak' },
  { id: '10-bentrikularra', week: 10, stage: 'atal-bentrikularra', view: 'frontala', t: 1, title: 'Atal bentrikularra barrutik (frontala)' },
  { id: '10-eskuineko-aurikula', week: 10, stage: 'eskuineko-aurikula', view: 'trenkada', t: 1, key: true, title: 'Eskuineko aurikula: zain balbulak eta aurikulen arteko trenkadak' },

  // ——— 11. Heart septa ———
  { id: '11-septum-primum', week: 11, stage: 'septum-primum', view: 'frontala', t: 0.9, key: true, title: 'Septum primuma, ostium primuma eta secunduma' },
  { id: '11-zulo-obala', week: 11, stage: 'zulo-obala', view: 'frontala', t: 1, key: true, title: 'Septum secunduma eta zulo obala' },
  { id: '11-zulo-obala-eskuinetik', week: 11, stage: 'zulo-obala', view: 'eskuinetik', t: 1, key: true, title: 'Zulo obala eskuineko aurikulatik' },
  { id: '11-enbor-arteriosoa', week: 11, stage: 'enbor-arteriosoa', view: '3d', t: 0.65, key: true, title: 'Enbor arteriosoaren eta konoaren trenkadak' },
  { id: '11-erreten-ab', week: 11, stage: 'erreten-ab', view: '3d', t: 0.06, title: 'Erreten aurikulubentrikularra' },
  { id: '11-bentrikuluak', week: 11, stage: 'erreten-ab', view: '3d', t: 1, title: 'Bentrikuluen arteko zulo primarioa' },
  { id: '11-jaiotza', week: 11, stage: 'jaiotza', view: 'frontala', t: 1, title: 'Jaiotza: zulo obala ixten da' },

  // ——— 12. Aortic arches ———
  { id: '12-eguna-27', week: 12, stage: 'eguna-27', view: '3d', t: 1, key: true, title: 'Aorta arkuak 27. egunean', hint: 'Arku bakoitza bere faringe-arkuan; 5.a ez da guztiz garatzen eta desagertzen da.' },
  { id: '12-eguna-29', week: 12, stage: 'eguna-29', view: '3d', t: 1, key: true, title: 'Aorta arkuak 29. egunean: zer bihurtzen den' },
  { id: '12-aorta-heldua', week: 12, stage: 'aorta-heldua', view: '3d', t: 1, key: true, title: 'Aorta eta haren adarrak helduan', hint: 'Enbor brakiozefalikoa eskuinean bakarrik dago.' },
  { id: '12-seigarren', week: 12, stage: 'seigarren-arkua', view: '3d', t: 0.76, key: true, title: 'Seigarren arkuak: birika arteriak eta hodi arteriosoa' },
  { id: '12-arku-sistema', week: 12, stage: 'arku-sistema', view: '3d', t: 0.4, key: true, title: 'Arku sistema: aorta zakua eta aorta dortsalak' },
  { id: '12-nerbioak', week: 12, stage: 'nerbio-atzerakariak', view: '3d', t: 0.33, title: 'Nerbio laringeo atzerakariak' },
  { id: '12-adar-bentralak', week: 12, stage: 'adar-bentralak', view: '3d', t: 1, title: 'Aorta beheranzkoaren aurreko errai adarrak' },
  { id: '12-zilbor-iliakoak', week: 12, stage: 'zilbor-iliakoak', view: '3d', t: 1, title: 'Zilborreko eta iliako arteriak' },
  { id: '12-gorputz-adarrak', week: 12, stage: 'gorputz-adarrak', view: '3d', t: 1, title: 'Beheko gorputz-adarraren arteriak' },

  // ——— 13. Veins ———
  { id: '13-zain-nagusiak', week: 13, stage: 'zain-nagusiak', view: '3d', t: 0.06, key: true, title: 'Zain sinura heltzen diren hiru zain-bikoteak', hint: 'Bitelo-zainak, zilbor-zainak eta kardinal komunak (aurreko eta atzeko kardinalek osatuak).' },
  { id: '13-zilbor-zainak', week: 13, stage: 'zilbor-zainak', view: '3d', t: 0.06, key: true, title: 'Zilborreko zainak eta sinu-luzapenak' },
  { id: '13-beheko-kaba', week: 13, stage: 'beheko-kaba', view: '3d', t: 1, key: true, title: 'Beheko kaba zaina eta haren adarrak' },
  { id: '13-beheko-kaba-segmentuak', week: 13, stage: 'beheko-kaba', view: '3d', t: 0.06, title: 'Beheko kabaren segmentuak' },
  { id: '13-porta', week: 13, stage: 'porta', view: '3d', t: 0.81, title: 'Porta zaina eta hodi hepatokardiakoak' },
  { id: '13-jaio-aurretik', week: 13, stage: 'jaio-aurretik', view: '3d', t: 0.38, title: 'Jaio aurretik: zulo obala' },
];

/** Topic order, the key figures first within each topic. */
export const platesOf = (week: number) => PLATES.filter((p) => p.week === week).sort((a, b) => Number(!!b.key) - Number(!!a.key));
export const KEY_PLATES = PLATE_GROUPS.flatMap((g) => platesOf(g.week).filter((p) => p.key));
