import type { Structure, Topic } from './types';

const source = { file: '2. ENBRIOLOGIA_GARAPENAREN BIGARREN ASTEA (zuzenduta).pdf', section: '1-4' };
const part = (id: string, primary: string, kind: Structure['kind'], description: string, section: string): Structure =>
  ({ id, label: { primary }, kind, description, source: { ...source, section } });

export const week2: Topic = {
  id: 'week-2', week: 2, title: { primary: 'Garapenaren bigarren astea' },
  learningGoals: [
    'Trofoblastoaren eta enbrioblastoaren bi geruzak bereiztea, bakoitzaren kokapena adieraziz.',
    'Amnios barrunbea, bitelo zakuak eta korion barrunbea sortzeko hurrenkera jarraitzea.',
    'Sinzitiotrofoblastoko lakuak eta amaren sinusoideak hasierako utero-plazentako zirkulazioarekin lotzea.',
    '13. eguneko biloxka korioniko primarioak eta bitelo zaku sekundarioa bereiztea.',
  ], source,
  structures: [
    part('cytotrophoblast', 'Zitotrofoblastoa', 'tissue', 'Barneko geruza trofoblastikoa, nukleo bakarreko zelula bereiziekin.', '1'),
    part('syncytiotrophoblast', 'Sinzitiotrofoblastoa', 'tissue', 'Kanpoko geruza inbaditzaile multinukleatua; ez dago zelula-mintzen muga arruntik.', '1-4'),
    part('epiblast', 'Epiblastoa', 'tissue', 'Disko bilaminarraren zelula zilindrikoen geruza, amniosaren aldean.', '1'),
    part('hypoblast', 'Hipoblastoa', 'tissue', 'Disko bilaminarraren zelula kubiko txikien geruza, blastozelearen aldean.', '1'),
    part('bilaminar-disc', 'Bi orriko ernetze diskoa', 'tissue', 'Epiblastoak eta hipoblastoak osatutako disko laua.', '1'),
    part('amnioblasts', 'Amnioblastoak', 'cell', 'Amnios barrunbea mugatzen duten epiblastotik eratorritako zelulak.', '1'),
    part('amniotic-cavity', 'Amnios barrunbea', 'cavity', 'Epiblastoaren inguruan agertzen den barrunbea.', '1'),
    part('fibrin-plug', 'Fibrinazko koagulua', 'tissue', 'Habiratze-guneko epitelioaren irekidura behin-behinean ixten du.', '2-3'),
    part('trophoblastic-lacunae', 'Sinzitiotrofoblastoko lakuak', 'cavity', 'Bakuolak handitu eta elkartzean sortutako espazioak.', '2-3'),
    part('heuser-membrane', 'Heuser-en mintza', 'tissue', 'Hipoblastoko zelulek zitotrofoblastoaren barruko aurpegian eratutako mintz exozelomikoa.', '2'),
    part('primary-yolk-sac', 'Hasierako bitelo zakua', 'cavity', 'Hipoblastoak eta Heuser-en mintzak inguratzen duten lehengo barrunbe exozelomikoa.', '2-3'),
    part('maternal-sinusoids', 'Amaren sinusoideak', 'anatomy', 'Endometrioko odol-hodi handituak; lakuen sarearekin lotzen dira.', '2-3'),
    part('uteroplacental-flow', 'Hasierako utero-plazentako zirkulazioa', 'process', 'Amaren odola sinusoideetatik sinzitiotrofoblastoko lakuen sarera igarotzen hasten da.', '3'),
    part('extraembryonic-mesoderm', 'Enbrioi kanpoko mesodermoa', 'tissue', 'Zitotrofoblastoaren barrualdea, amniosa eta bitelo zakua inguratzen dituen ehuna.', '3'),
    part('somatic-mesoderm', 'Enbrioi kanpoko mesodermo somatikoa', 'tissue', 'Zitotrofoblastoaren barruko azalera eta amniosa estaltzen dituen orria.', '3'),
    part('splanchnic-mesoderm', 'Enbrioi kanpoko mesodermo esplaknikoa', 'tissue', 'Hasierako bitelo zakua estaltzen duen orria.', '3'),
    part('chorionic-cavity', 'Korion barrunbea', 'cavity', 'Mesodermoko espazioen fusioz sortutako enbrioi kanpoko zeloma.', '3-4'),
    part('decidual-reaction', 'Erreakzio deziduala', 'process', 'Endometrioko zelulen eta hodien aldaketak: edema eta zelulen glukogeno nahiz lipido metaketa.', '3'),
    part('primary-chorionic-villus', 'Biloxka korioniko primarioa', 'tissue', 'Zitotrofoblastoko zelulen luzakina, kanpoaldean sinzitiotrofoblastoa duena.', '4'),
    part('chorionic-plate', 'Korion plaka', 'tissue', 'Zitotrofoblastoaren barruko azalaren ondoan dagoen enbrioi kanpoko mesodermoa.', '4'),
    part('secondary-yolk-sac', 'Bitelo zaku sekundarioa', 'cavity', 'Hipoblastoko zelula berriek mugatutako behin-betiko bitelo zaku txikiagoa.', '4'),
    part('exocoelomic-cysts', 'Kiste exozelomikoak', 'cavity', 'Hasierako bitelo zakuaren hondar bereiziak korion barrunbean.', '4'),
    part('connecting-stalk', 'Finkapen pedikulua', 'tissue', 'Korion plakaren eta diskoaren inguruko egituren arteko mesodermo-lotura.', '3-4'),
  ],
  stages: [
    {
      id: 'day-8', title: { primary: '8. eguna' },
      summary: 'Blastozistoa partzialki sartuta dago endometrioan. Trofoblastoa zitotrofoblasto eta sinzitiotrofoblasto bihurtzen da; enbrioblastoak epiblastoa eta hipoblastoa eratzen ditu. Bi orriko ernetze diskoa, amnios barrunbea eta amnioblastoak agertzen dira.',
      order: 1, start: 0, end: .2, transition: 'discrete',
      structures: ['cytotrophoblast', 'syncytiotrophoblast', 'epiblast', 'hypoblast', 'bilaminar-disc', 'amnioblasts', 'amniotic-cavity'],
      explanation: { changes: ['Trofoblastoko bi geruzak eta enbrioblastoko bi orriak bereizi.', 'Amnios barrunbea eta amnioblastoak agertu.', 'Endometrioa edematoso bihurtu; guruinek glukogenoa eta mukia jariatu.'], relations: ['Hipoblastoa blastozelearen aldean dago; epiblastoa amniosaren aldean.', 'Zitotrofoblastoko zelulek sinzitiotrofoblastoari zelulak ematen dizkiote.'], caution: 'Sinzitiotrofoblastoa zelula-muga arruntik gabeko masa multinukleatua da.' },
      source: { ...source, section: '1' }, visual: { renderer: 'svg', layers: ['bilaminar-disc', 'amniotic-cavity'] },
    },
    {
      id: 'day-9', title: { primary: '9. eguna' },
      summary: 'Habiratze-guneko epitelioan fibrinazko koagulua agertzen da. Sinzitiotrofoblastoko bakuolak laku bihurtzen dira. Hipoblastotik datorren Heuser-en mintzak hasierako bitelo zakua mugatzen du; endometrioko odol-hodiak sinusoide bihurtzen dira.',
      order: 2, start: .2, end: .4, transition: 'discrete',
      structures: ['fibrin-plug', 'syncytiotrophoblast', 'trophoblastic-lacunae', 'heuser-membrane', 'primary-yolk-sac', 'maternal-sinusoids'],
      explanation: { changes: ['Fibrinazko koagulua habiratze-gunean agertu.', 'Bakuolak zabaldu eta sinzitiotrofoblastoko lakuak osatu.', 'Heuser-en mintzak hasierako bitelo zakua mugatu.'], relations: ['Heuser-en mintza hipoblastoko zelulen luzapenetik dator.', 'Lakuak sinzitiotrofoblastoan daude; sinusoideak amaren endometrioan.'] },
      source: { ...source, section: '2' }, visual: { renderer: 'svg', layers: ['lacunae', 'primary-yolk-sac'] },
    },
    {
      id: 'days-11-12', title: { primary: '11. eta 12. egunak' },
      summary: 'Sinzitiotrofoblastoko lakuak sare batean elkartzen dira eta amaren sinusoideetara irekitzen dira: hasierako utero-plazentako odol-fluxua. Enbrioi kanpoko mesodermoaren hutsuneak korion barrunbe bihurtzen dira; orri somatikoa, esplaknikoa eta finkapen pedikulua bereizten dira. Endometrioan erreakzio deziduala agertzen da.',
      order: 3, start: .4, end: .7, transition: 'interpolate',
      structures: ['trophoblastic-lacunae', 'maternal-sinusoids', 'uteroplacental-flow', 'extraembryonic-mesoderm', 'somatic-mesoderm', 'splanchnic-mesoderm', 'chorionic-cavity', 'connecting-stalk', 'decidual-reaction'],
      explanation: { changes: ['Lakuak sinusoideekin konektatu eta amaren odola laku-sarean sartu.', 'Mesodermoaren barruko espazioak elkartu eta korion barrunbea eratu.', 'Endometrioko zelulek glukogenoa eta lipidoak metatu.'], relations: ['Mesodermo somatikoak zitotrofoblastoa eta amniosa estaltzen ditu.', 'Mesodermo esplaknikoak bitelo zakua estaltzen du.', 'Finkapen pedikuluak lotura mantentzen du korion barrunbean.'], caution: 'Hasierako utero-plazentako zirkulazioa amaren odolaren lakunetako fluxua da; ez dago oraindik enbrioiaren odol-zirkulazio heldurik.' },
      source: { ...source, section: '3' }, visual: { renderer: 'svg', layers: ['lacunar-network', 'chorionic-cavity', 'connecting-stalk'] },
    },
    {
      id: 'day-13', title: { primary: '13. eguna' },
      summary: 'Blastozistoa endometrioaren barruan dago eta epitelioa leheneratu da. Zitotrofoblastoko luzakinek biloxka korioniko primarioak sortzen dituzte, sinzitiotrofoblastoaren barruan. Korion plaka bereizten da. Hasierako bitelo zakua txikitu eta bitelo zaku sekundarioa eratzen da; hondarrak kiste exozelomikoak dira.',
      order: 4, start: .7, end: 1, transition: 'discrete',
      structures: ['primary-chorionic-villus', 'cytotrophoblast', 'syncytiotrophoblast', 'chorionic-plate', 'secondary-yolk-sac', 'exocoelomic-cysts', 'connecting-stalk', 'chorionic-cavity', 'extraembryonic-mesoderm', 'somatic-mesoderm', 'splanchnic-mesoderm'],
      explanation: { changes: ['Endometrioko epitelioa berreraiki; fibrinazko koagulua desagertu.', 'Zitotrofoblastoaren luzakinek biloxka primarioak eratu.', 'Bitelo zaku sekundarioa eta kiste exozelomikoak bereizi.'], relations: ['Biloxka primarioaren erdigunea zitotrofoblastikoa da eta kanpoaldea sinzitiotrofoblastikoa.', 'Finkapen pedikuluak diskoaren inguruko egiturak korion plakari lotzen dizkio.'], caution: 'Biloxka primarioan ez dago oraindik mesodermoko nukleorik edo fetu-hodi funtzionalik.' },
      source: { ...source, section: '4' }, visual: { renderer: 'svg', layers: ['chorionic-villi', 'secondary-yolk-sac', 'connecting-stalk'] },
    },
  ],
};
