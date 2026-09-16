import type { Topic } from './types';

const source = { file: 'Anato lehenengo gaia (zuzenduta).docx', section: '4. Lehenengo asteko prozesuak' };

export const week1: Topic = {
  id: 'week-1',
  week: 1,
  title: { primary: 'Garapenaren lehenengo astea', secondary: { es: 'Primera semana del desarrollo', en: 'Week 1 of development' } },
  learningGoals: ['Orientar estructuras con planos y ejes.', 'Distinguir la fecundación, segmentación, blastocisto e implantación.', 'Recordar que el espermatozoide y el ovocito secundario son haploides.'],
  source: { ...source, section: '1-4.5' },
  structures: [
    { id: 'sagittal-plane', label: { primary: 'Plano sagitala', secondary: { es: 'Plano sagital', en: 'Sagittal plane' } }, kind: 'orientation', description: 'Divide la estructura en lados izquierdo y derecho.', source: { ...source, section: '1.1' } },
    { id: 'coronal-plane', label: { primary: 'Plano koronala', secondary: { es: 'Plano coronal o frontal', en: 'Coronal plane' } }, kind: 'orientation', description: 'Divide la estructura en partes anterior y posterior.', source: { ...source, section: '1.1' } },
    { id: 'female-reproductive-apparatus', label: { primary: 'Emakumearen ugal aparatua', secondary: { es: 'Aparato reproductor femenino', en: 'Female reproductive system' } }, kind: 'anatomy', source: { ...source, section: '4.1' } },
    { id: 'ampulla', label: { primary: 'Anpulua', secondary: { es: 'Ampolla', en: 'Ampulla' } }, kind: 'anatomy', description: 'Zona habitual de la fecundación en la trompa uterina.', source: { ...source, section: '4.1-4.2' } },
    { id: 'endometrium', label: { primary: 'Endometrioa', secondary: { es: 'Endometrio', en: 'Endometrium' } }, kind: 'tissue', source: { ...source, section: '4.5' } },
    { id: 'zygote', label: { primary: 'Zigotoa', secondary: { es: 'Cigoto', en: 'Zygote' } }, kind: 'cell', source: { ...source, section: '4.2' } },
    { id: 'morula', label: { primary: 'Morula', secondary: { es: 'Mórula', en: 'Morula' } }, kind: 'cell', source: { ...source, section: '4.3' } },
    { id: 'blastocyst', label: { primary: 'Blastozistoa', secondary: { es: 'Blastocisto', en: 'Blastocyst' } }, kind: 'cell', source: { ...source, section: '4.4' } },
    { id: 'trophoblast', label: { primary: 'Trofoblastoa', secondary: { es: 'Trofoblasto', en: 'Trophoblast' } }, kind: 'cell', source: { ...source, section: '4.4' } },
    { id: 'embryoblast', label: { primary: 'Enbrioblastoa', secondary: { es: 'Embrioblasto', en: 'Embryoblast' } }, kind: 'cell', source: { ...source, section: '4.4' } },
  ],
  stages: [
    { id: 'orientation', title: { primary: 'Planoak eta ardatzak', secondary: { es: 'Planos y ejes', en: 'Planes and axes' } }, summary: 'Planos sagitala, koronala eta zeharkakoa; ardatz longitudinala, zeharkakoa eta dortsobentrala. Terminos: kraneala/zefalikoa, kaudala, bentralak eta dortsalak.', order: 1, start: 0, end: 0.15, transition: 'discrete', structures: ['sagittal-plane', 'coronal-plane'], source: { ...source, section: '1.1-1.2' }, visual: { renderer: 'svg', layers: ['orientation-axes'] } },
    { id: 'fertilization', title: { primary: 'Ernalkuntza', secondary: { es: 'Fecundación', en: 'Fertilization' } }, summary: 'Tiene lugar normalmente en el anpulu/anpulu de la trompa. Fases: atravesar la corona radiata, reacción acrosómica y zona pelúcida, fusión de membranas, reacción cortical, pronúcleos y zigoto.', order: 2, start: 0.15, end: 0.42, transition: 'discrete', structures: ['female-reproductive-apparatus', 'ampulla', 'zygote'], source: { ...source, section: '4.1-4.2' }, visual: { renderer: 'css-2.5d', layers: ['ampulla', 'gametes', 'zygote'] } },
    { id: 'cleavage', title: { primary: 'Zigotoaren segmentazioa', secondary: { es: 'Segmentación del cigoto', en: 'Cleavage' } }, summary: 'Los blastómeros se dividen por mitosis sin aumentar el tamaño total: 2, 4, 12-16 (mórula, día 3) y aproximadamente 32 células (día 4).', order: 3, start: 0.42, end: 0.65, transition: 'interpolate', structures: ['zygote', 'morula'], source: { ...source, section: '4.3' }, visual: { renderer: 'svg', layers: ['blastomeres'] } },
    { id: 'blastocyst-formation', title: { primary: 'Blastozistoaren eraketa', secondary: { es: 'Formación del blastocisto', en: 'Blastocyst formation' } }, summary: 'Aparece el blastocele; la masa externa forma trofoblastoa y la interna, enbrioblastoa. Se distinguen polo embrionario y polo anembrionario.', order: 4, start: 0.65, end: 0.82, transition: 'interpolate', structures: ['blastocyst', 'trophoblast', 'embryoblast'], source: { ...source, section: '4.4' }, visual: { renderer: 'svg', layers: ['blastocoel', 'trophoblast', 'embryoblast'] } },
    { id: 'implantation', title: { primary: 'Blastozistoaren habiratzea', secondary: { es: 'Implantación del blastocisto', en: 'Blastocyst implantation' } }, summary: 'Al final de la primera semana se implanta en el endometrio, normalmente en la pared uterina. También se describen sitios ectópicos: trompa, ovario o cavidad peritoneal.', order: 5, start: 0.82, end: 1, transition: 'discrete', structures: ['blastocyst', 'endometrium'], source: { ...source, section: '4.5-4.6' }, visual: { renderer: 'css-2.5d', layers: ['uterus', 'endometrium', 'implantation'] } },
  ],
};
