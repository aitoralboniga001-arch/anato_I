import type { Stage, Structure, Topic } from './types';

const source = { file: '1. ENBRIOLOGIA_GARAPENAREN LEHENGO ASTEA (zuzenduta).docx', section: '4. Lehenengo asteko prozesuak' };
const ref = (section: string) => ({ ...source, section });
const part = (id: string, primary: string, kind: Structure['kind'], description: string, section: string): Structure =>
  ({ id, label: { primary }, kind, description, source: ref(section) });
const step = (id: string, primary: string, summary: string, structures: string[], section: string, order: number, start: number, end: number, changes: string[], relations: string[], caution?: string): Stage =>
  ({ id, title: { primary }, summary, structures, source: ref(section), order, start, end, transition: 'discrete', explanation: { changes, relations, caution }, visual: { renderer: 'svg', layers: structures } });

export const week1: Topic = {
  id: 'week-1', week: 1,
  title: { primary: 'Garapenaren lehenengo astea' },
  learningGoals: [
    'Obozito sekundarioaren eta espermatozoideen ibilbidea umetoki-tutuko anpuluraino jarraitzea.',
    'Ernalkuntzaren hesiak eta polispermia eragozten duen erreakzio kortikala hurrenkera egokian bereiztea.',
    'Segmentazioa, morularen trinkotzea, blastozistoaren eraketa eta habiratzearen hasiera antzematea.',
  ],
  source: ref('1.1-1.2; 4.1-4.6'),
  structures: [
    part('sagittal-plane', 'Plano sagitala', 'orientation', 'Gorputza ezkerreko eta eskuineko zatitan banatzen duen plano bertikala.', '1.1'),
    part('coronal-plane', 'Plano koronala', 'orientation', 'Aurreko eta atzeko zatien arteko plano bertikala.', '1.1'),
    part('transverse-plane', 'Zeharkako planoa', 'orientation', 'Goiko eta beheko zatien arteko plano horizontala.', '1.1'),
    part('female-reproductive-apparatus', 'Emakumearen ugal-aparatua', 'anatomy', 'Obulutegiek, umetoki-tutuek, umetokiak, umetoki-lepoak eta baginak osatzen duten ibilbidea.', '4.1'),
    part('ovary', 'Obulutegia', 'anatomy', 'Folikulu heldua haustean obozito sekundarioa askatzen den organoa.', '4.1-4.2'),
    part('fimbriae', 'Finbriak', 'anatomy', 'Infundibuluaren ertzeko luzakinak; obozitoa tutuaren aldera bideratzen dute.', '4.1-4.2'),
    part('infundibulum', 'Infundibulua', 'anatomy', 'Umetoki-tutuaren inbutu-formako muturra, abdomeneko irekidurarekin.', '4.1'),
    part('ampulla', 'Umetoki-tutuaren anpulua', 'anatomy', 'Umetoki-tutuaren atal zabala; ernalkuntzaren ohiko tokia.', '4.1-4.2'),
    part('isthmus', 'Umetoki-tutuaren istmoa', 'anatomy', 'Anpuluaren eta umetokiaren arteko atal estuagoa.', '4.1-4.3'),
    part('uterus', 'Umetokia', 'anatomy', 'Blastozistoa umetoki-barrunbera iritsi eta horman habiratzen hasten da.', '4.1; 4.5'),
    part('endometrium', 'Endometrioa', 'tissue', 'Umetoki-hormaren barruko mukosa; blastozistoa bertan habiratzen hasten da.', '4.5'),
    part('myometrium', 'Miometrioa', 'tissue', 'Endometrioaren kanpoko muskulu-geruza.', '4.5'),
    part('perimetrium', 'Perimetrioa', 'tissue', 'Umetoki-hormaren kanpo-geruza.', '4.5'),
    part('secondary-oocyte', 'Obozito sekundarioa', 'cell', 'Obulazioan askatzen den gameto haploidea; II. meiosiko metafasean dago geldirik.', '3.2; 4.2'),
    part('sperm', 'Espermatozoidea', 'cell', 'Emakumearen ugal-aparatuan gaitzen den gameto haploidea.', '4.2'),
    part('capacitation', 'Espermatozoidearen gaikuntza', 'process', 'Espermatozoidearen mintzeko aldaketek obozitoarekin elkarreragiteko gaitasuna ematen diote.', '4.2'),
    part('corona-radiata', 'Koroa erradiatua', 'tissue', 'Obozitoaren inguruko folikulu-zelulen geruza.', '4.2'),
    part('zona-pellucida', 'Alde peluzidoa', 'tissue', 'Obozitoaren inguruko glikoproteina-geruza; erreakzio kortikalaren ondoren beste espermatozoideei sarrera eragozten die.', '4.2'),
    part('acrosome', 'Akrosoma', 'cell', 'Espermatozoide-buruaren entzima-edukiontzia.', '4.2'),
    part('acrosome-reaction', 'Erreakzio akrosomikoa', 'process', 'Akrosomaren edukia askatu eta alde peluzidoa zeharkatzea ahalbidetzen du.', '4.2'),
    part('cortical-reaction', 'Erreakzio kortikala', 'process', 'Granulu kortikalen askapenak alde peluzidoa aldatzen du, polispermia eragozteko.', '4.2'),
    part('second-polar-body', 'Bigarren gorputz polarra', 'cell', 'II. meiosia amaitzean bereizten den zelula txikia.', '4.2'),
    part('pronuclei', 'Pronukleo arra eta emea', 'cell', 'Bi gametoen genoma haploideak; lehen zatiketarako prestatzen dira.', '4.2'),
    part('zygote', 'Zigotoa', 'cell', 'Ernalkuntzaren ondoren sortutako kontzeptu diploidea; alde peluzidoak inguratzen du hasieran.', '4.2'),
    part('blastomeres', 'Blastomeroak', 'cell', 'Segmentazio mitotikoz sortutako zelula gero eta txikiagoak.', '4.3'),
    part('morula', 'Morula', 'cell', 'Hirugarren egunean 12-16 blastomero inguruko egitura trinkoa.', '4.3'),
    part('compaction', 'Trinkotzea', 'process', 'Blastomeroen arteko kontaktua handitzen da; barruko eta kanpoko zelulak bereizten hasten dira.', '4.3'),
    part('blastocyst', 'Blastozistoa', 'cell', 'Blastozelea, kanpoko trofoblastoa eta mutur bateko enbrioblastoa dituen egitura.', '4.4'),
    part('blastocoel', 'Blastozelea', 'cavity', 'Morulako likidoz betetako espazioak elkartzean sortzen den barrunbea.', '4.4'),
    part('trophoblast', 'Trofoblastoa', 'tissue', 'Blastozistoaren kanpoko zelula-geruza.', '4.4'),
    part('embryoblast', 'Enbrioblastoa', 'cell', 'Blastozistoaren mutur enbrionarioan kokatutako barneko zelula-masa.', '4.4'),
    part('hatching', 'Alde peluzidotik askatzea', 'process', 'Blastozistoak alde peluzidoa galtzen du endometrioarekin zuzenean elkarreragin ahal izateko.', '4.4-4.5'),
    part('implantation', 'Habiratzearen hasiera', 'process', 'Mutur enbrionarioko trofoblastoa endometrioko epitelioari lotu eta bertan sartzen hasten da.', '4.5'),
  ],
  stages: [
    step('orientation', 'Planoak eta kokapena', 'Plano sagitalak ezkerra eta eskuina; koronalak aurrea eta atzea; zeharkakoak goia eta behea bereizten ditu. Norabide anatomikoak enbrioiaren araberakoak dira.', ['sagittal-plane', 'coronal-plane', 'transverse-plane'], '1.1-1.2', 1, 0, .05, ['Hiru plano anatomikoak bereizi.'], ['Kraneala eta kaudala, bentrala eta dortsala kokapen anatomikoko norabideak dira.']),
    step('anatomy', 'Ugal-aparatuko ibilbidea', 'Obulutegitik gertu daude finbriak eta infundibulua; ondoren anpulua, istmoa eta umetokia datoz. Ernalkuntza gehienetan anpuluan gertatzen da.', ['female-reproductive-apparatus', 'ovary', 'fimbriae', 'infundibulum', 'ampulla', 'isthmus', 'uterus', 'endometrium'], '4.1', 2, .05, .11, ['Obulutegiaren, tutuaren eta umetokiaren arteko jarraitutasuna ikusi.'], ['Infundibuluak abdomeneko irekidura du; endometrioa umetokiaren barruko geruza da.']),
    step('ovulation', 'Obulazioa eta obozitoaren harrera', 'Folikulu heldua hausten da. Askaturiko obozito sekundarioa II. meiosiko metafasean geldirik dago; koroa erradiatua eta alde peluzidoa ditu inguruan. Finbriek anpulurantz bideratzen dute.', ['ovary', 'secondary-oocyte', 'corona-radiata', 'zona-pellucida', 'fimbriae', 'infundibulum'], '4.2', 3, .11, .17, ['Obozito sekundarioa askatu eta infundibulura hurbildu.'], ['Finbriek obozitoa umetoki-tutuaren aldera bideratzen dute.'], 'Obulazioan askatzen dena obozito sekundarioa da, ez obulu heldua.'),
    step('capacitation', 'Espermatozoidearen gaikuntza', 'Espermatozoideak ugal-aparatuan zehar mugitzen dira. Mintzeko aldaketen bidez gaituta, anpuluan obozitoarekin elkarreragin dezakete.', ['sperm', 'capacitation', 'ampulla'], '4.2', 4, .17, .23, ['Espermatozoidearen mintzeko aldaketak erakutsi.'], ['Gaikuntza ernalkuntzaren aurreko baldintza da.']),
    step('corona-radiata', 'Koroa erradiatua zeharkatzea', 'Gaitutako espermatozoidea obozitoaren inguruko koroa erradiatuko zelulen artetik igarotzen da; alde peluzidora iristen da.', ['sperm', 'corona-radiata', 'secondary-oocyte', 'zona-pellucida'], '4.2', 5, .23, .29, ['Koroa erradiatuko zelulen artetik igaro.'], ['Koroa erradiatua alde peluzidoaren kanpoaldean dago.']),
    step('acrosome-reaction', 'Erreakzio akrosomikoa', 'Espermatozoideak alde peluzidoarekin elkarreragiten du, akrosomaren edukia askatzen du eta geruza hori zeharkatzen du.', ['sperm', 'acrosome', 'acrosome-reaction', 'zona-pellucida'], '4.2', 6, .29, .35, ['Akrosomaren edukia askatu eta alde peluzidoa zeharkatu.'], ['Akrosoma espermatozoidearen buruan dago.']),
    step('membrane-fusion', 'Gametoen mintzen fusioa', 'Espermatozoidearen eta obozito sekundarioaren mintzak fusionatzen dira; espermatozoidearen edukia obozitoaren zitoplasman sartzen da.', ['sperm', 'secondary-oocyte', 'zona-pellucida'], '4.2', 7, .35, .41, ['Bi mintz plasmatikoak fusionatu.'], ['Sarrera gertatu ondoren abiatzen dira polispermia eragozteko aldaketak.']),
    step('cortical-reaction', 'Erreakzio kortikala', 'Obozitoaren granulu kortikalen edukia askatzen da. Alde peluzidoa eraldatuta, beste espermatozoide batzuk sartzea eragozten da.', ['cortical-reaction', 'zona-pellucida', 'secondary-oocyte'], '4.2', 8, .41, .47, ['Granulu kortikalen edukia askatu.'], ['Alde peluzidoaren aldaketak polispermia eragozten du.']),
    step('pronuclei-zygote', 'II. meiosia, pronukleoak eta zigotoa', 'Espermatozoidea sartu ondoren obozitoak II. meiosia bukatzen du eta bigarren gorputz polarra bereizten da. Pronukleo arra eta emea agertzen dira; zigoto diploidea lehen mitosirako prestatzen da.', ['second-polar-body', 'pronuclei', 'zygote'], '4.2', 9, .47, .55, ['II. meiosia amaitu eta gorputz polarra bereizi.', 'Bi pronukleoak agertu.'], ['Bi genoma haploideek zigotoaren kromosoma-dotazio diploidea osatzen dute.'], 'Pronukleoak ez dira bi zigoto bereizi.'),
    step('cleavage-2', 'Lehen segmentazioa: 2 blastomero', 'Zigotoaren lehen mitosiak bi blastomero sortzen ditu. Zelula bakoitza txikiagoa da, baina alde peluzidoaren barruko egituraren tamaina orokorra ez da handitzen.', ['zygote', 'blastomeres', 'zona-pellucida'], '4.3', 10, .55, .61, ['Bi blastomero sortu.'], ['Alde peluzidoak segmentatzen ari den multzoa inguratzen du.']),
    step('cleavage-4', 'Segmentazioa: 4 blastomero', 'Blastomeroak mitosiz zatitzen jarraitzen dute umetokirantz mugitzen diren bitartean; kanpoaldeko alde peluzidoa oraindik presente dago.', ['blastomeres', 'zona-pellucida', 'isthmus'], '4.3', 11, .61, .66, ['Lau blastomero bereizi.'], ['Zatiketak tamaina orokorra handitu gabe gertatzen dira.']),
    step('cleavage-8', 'Segmentazioa: 8 blastomero', 'Ondorengo zatiketek zortzi blastomero inguruko multzoa ematen dute. Irudiak hurrenkera adierazten du, ez ordu finko bat.', ['blastomeres', 'zona-pellucida'], '4.3', 12, .66, .71, ['Zortzi blastomero bereizi.'], ['Blastomero bakoitza aurreko etapan baino txikiagoa da.']),
    step('morula-compaction', 'Morula eta trinkotzea', 'Hirugarren egunean 12-16 blastomero inguruko morula agertzen da; laugarren egunean 32 zelula inguru izan ditzake. Kanpoko eta barruko zelulen posizioak bereizten dira.', ['morula', 'compaction', 'blastomeres', 'isthmus'], '4.3', 13, .71, .78, ['Blastomeroak trinkotu eta morula eratu.'], ['Barruko eta kanpoko zelulek ondorengo blastozistoaren bi populazioak abiatzen dituzte.']),
    step('blastocyst-formation', 'Blastozistoaren eraketa', 'Laugarren eta bosgarren egunen inguruan, umetoki-barrunbean, likidoz betetako espazioak blastozele bakarrean elkartzen dira. Kanpoko zelulek trofoblastoa eta mutur bateko barne-zelulek enbrioblastoa osatzen dute.', ['blastocyst', 'blastocoel', 'trophoblast', 'embryoblast', 'uterus'], '4.4', 14, .78, .87, ['Blastozelea, trofoblastoa eta enbrioblastoa bereizi.'], ['Enbrioblastoa mutur enbrionarioan dago; aurkakoa mutur anenbrionarioa da.']),
    step('hatching', 'Alde peluzidotik askatzea', 'Blastozistoak alde peluzidoa galtzen du umetoki-barrunbean. Horrela trofoblastoak endometrioarekin zuzenean kontaktua egin dezake.', ['hatching', 'zona-pellucida', 'blastocyst', 'trophoblast'], '4.4-4.5', 15, .87, .93, ['Alde peluzidoa askatu.'], ['Alde peluzidotik askatzeak habiratzea ahalbidetzen du.']),
    step('implantation', 'Habiratzearen hasiera', 'Seigarren egunaren inguruan mutur enbrionarioko trofoblastoa endometrioko epitelioari lotu eta bertan sartzen hasten da. Prozesuak bigarren astean jarraitzen du.', ['implantation', 'blastocyst', 'embryoblast', 'trophoblast', 'endometrium', 'myometrium', 'perimetrium'], '4.5-4.6', 16, .93, 1, ['Mutur enbrionarioa endometriora orientatu eta itsatsi.'], ['Endometrioa barruko geruza da; miometrioa eta perimetrioa kanporago daude.'], 'Ohiko lekua umetokiko aurreko edo atzeko pareta da; ezohiko habiratzea umetoki-tutuan, obulutegian edo peritoneoan gerta daiteke.'),
  ],
};
