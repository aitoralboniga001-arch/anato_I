import type { Topic } from './types';

const source = { file: '2. ENBRIOLOGIA_GARAPENAREN BIGARREN ASTEA (zuzenduta).docx', section: '1-4' };

export const week2: Topic = {
  id: 'week-2', week: 2,
  title: { primary: 'Garapenaren bigarren astea', secondary: { es: 'Segunda semana del desarrollo', en: 'Week 2 of development' } },
  learningGoals: ['Reconocer la reorganización del trofoblasto y embrioblasto.', 'Seguir la formación de cavidades y de la circulación uteroplacentaria inicial.', 'Relacionar el día 13 con vellosidades coriónicas primarias y saco vitelino secundario.'], source,
  structures: [
    { id: 'cytotrophoblast', label: { primary: 'Zitotrofoblastoa', secondary: { es: 'Citotrofoblasto', en: 'Cytotrophoblast' } }, kind: 'cell', source: { ...source, section: '1' } },
    { id: 'syncytiotrophoblast', label: { primary: 'Sinzitiotrofoblastoa', secondary: { es: 'Sincitiotrofoblasto', en: 'Syncytiotrophoblast' } }, kind: 'cell', source: { ...source, section: '1' } },
    { id: 'epiblast', label: { primary: 'Epiblastoa', secondary: { es: 'Epiblasto', en: 'Epiblast' } }, kind: 'cell', source: { ...source, section: '1' } },
    { id: 'hypoblast', label: { primary: 'Hipoblastoa', secondary: { es: 'Hipoblasto', en: 'Hypoblast' } }, kind: 'cell', source: { ...source, section: '1' } },
    { id: 'bilaminar-disc', label: { primary: 'Bi orriko ernetze diskoa', secondary: { es: 'Disco germinativo bilaminar', en: 'Bilaminar disc' } }, kind: 'tissue', source: { ...source, section: '1' } },
    { id: 'amniotic-cavity', label: { primary: 'Amnios barrunbea', secondary: { es: 'Cavidad amniótica', en: 'Amniotic cavity' } }, kind: 'cavity', source: { ...source, section: '1' } },
    { id: 'primary-yolk-sac', label: { primary: 'Hasierako bitelo zakua', secondary: { es: 'Saco vitelino primario', en: 'Primary yolk sac' } }, kind: 'cavity', source: { ...source, section: '2' } },
    { id: 'extraembryonic-mesoderm', label: { primary: 'Enbrioi kanpoko mesodermoa', secondary: { es: 'Mesodermo extraembrionario', en: 'Extraembryonic mesoderm' } }, kind: 'tissue', source: { ...source, section: '3' } },
    { id: 'chorionic-cavity', label: { primary: 'Korion barrunbea', secondary: { es: 'Celoma coriónico', en: 'Chorionic cavity' } }, kind: 'cavity', source: { ...source, section: '3' } },
    { id: 'primary-chorionic-villus', label: { primary: 'Biloxka korioniko primarioa', secondary: { es: 'Vellosidad coriónica primaria', en: 'Primary chorionic villus' } }, kind: 'tissue', source: { ...source, section: '4' } },
    { id: 'secondary-yolk-sac', label: { primary: 'Behin-betiko bitelo zakua', secondary: { es: 'Saco vitelino secundario', en: 'Secondary yolk sac' } }, kind: 'cavity', source: { ...source, section: '4' } },
    { id: 'connecting-stalk', label: { primary: 'Finkapen pedikulua', secondary: { es: 'Pedículo de fijación', en: 'Connecting stalk' } }, kind: 'tissue', source: { ...source, section: '3-4' } },
  ],
  stages: [
    { id: 'day-8', title: { primary: '8. eguna', secondary: { es: 'Día 8', en: 'Day 8' } }, summary: 'El trofoblasto se separa en zitotrofoblastoa y sinzitiotrofoblastoa; el embrioblasto en epiblastoa e hipoblastoa. Se forma el disco bilaminar y la cavidad amniótica con amnioblastos; aparece edema y polaridad dorsoventral.', order: 1, start: 0, end: 0.2, transition: 'discrete', structures: ['cytotrophoblast', 'syncytiotrophoblast', 'epiblast', 'hypoblast', 'bilaminar-disc', 'amniotic-cavity'], source: { ...source, section: '1' }, visual: { renderer: 'svg', layers: ['bilaminar-disc', 'amniotic-cavity'] } },
    { id: 'day-9', title: { primary: '9. eguna', secondary: { es: 'Día 9', en: 'Day 9' } }, summary: 'Aparece el fibrin coagulum. Las vacuolas del sincitiotrofoblasto forman lacunae (garai lakunarra). La membrana de Heuser o mintz exozelomikoa delimita el saco vitelino primario; los vasos endometriales pasan a ser sinusoideak.', order: 2, start: 0.2, end: 0.4, transition: 'discrete', structures: ['syncytiotrophoblast', 'primary-yolk-sac'], source: { ...source, section: '2' }, visual: { renderer: 'css-2.5d', layers: ['lacunae', 'primary-yolk-sac'] } },
    { id: 'days-11-12', title: { primary: '11 eta 12. egunak', secondary: { es: 'Días 11-12', en: 'Days 11-12' } }, summary: 'La red lacunar erosiona sinusoideak y comienza el flujo uteroplacentario. Se forma el mesodermo extraembrionario; sus espacios confluyen en el celoma coriónico. Quedan el pedículo de fijación, la hoja somática/somatopleura y la esplacnopleura. El endometrio presenta reacción decidual.', order: 3, start: 0.4, end: 0.7, transition: 'interpolate', structures: ['extraembryonic-mesoderm', 'chorionic-cavity', 'connecting-stalk'], source: { ...source, section: '3' }, visual: { renderer: 'svg', layers: ['lacunar-network', 'chorionic-cavity', 'connecting-stalk'] } },
    { id: 'day-13', title: { primary: '13. eguna', secondary: { es: 'Día 13', en: 'Day 13' } }, summary: 'La implantación es completa y se recupera el epitelio. Surgen vellosidades coriónicas primarias con centro de citotrofoblasto y exterior de sincitio. El saco vitelino primario pasa a secundario, con quistes exocelómicos; el conjunto queda suspendido por el pedículo.', order: 4, start: 0.7, end: 1, transition: 'discrete', structures: ['primary-chorionic-villus', 'secondary-yolk-sac', 'connecting-stalk'], source: { ...source, section: '4' }, visual: { renderer: 'css-2.5d', layers: ['chorionic-villi', 'secondary-yolk-sac', 'connecting-stalk'] } },
  ],
};
