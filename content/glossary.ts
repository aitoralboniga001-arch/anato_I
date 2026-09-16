import type { GlossaryTerm } from './types';

const w1 = { file: 'Anato lehenengo gaia (zuzenduta).docx', section: '1-4' };
const w2 = { file: '2. ENBRIOLOGIA_GARAPENAREN BIGARREN ASTEA (zuzenduta).docx', section: '1-4' };

export const glossary: GlossaryTerm[] = [
  { id: 'cranial', label: { primary: 'Kraneala / zefalikoa', secondary: { es: 'Craneal / cefálico', en: 'Cranial / cephalic' } }, definition: 'Cerca del cráneo.', source: { ...w1, section: '1.2' } },
  { id: 'caudal', label: { primary: 'Kaudala', secondary: { es: 'Caudal', en: 'Caudal' } }, definition: 'En la parte inferior, hacia la cola.', source: { ...w1, section: '1.2' } },
  { id: 'ventral-dorsal', label: { primary: 'Bentrala / dortsala', secondary: { es: 'Ventral / dorsal', en: 'Ventral / dorsal' } }, definition: 'Anterior / posterior.', source: { ...w1, section: '1.2' } },
  { id: 'blastocoel', label: { primary: 'Blastozelea', secondary: { es: 'Blastocele', en: 'Blastocoel' } }, definition: 'Cavidad líquida del blastocisto.', source: { ...w1, section: '4.4' } },
  { id: 'lacunae', label: { primary: 'Lakuak / garai lakunarra', secondary: { es: 'Lagunas / período lacunar', en: 'Lacunae / lacunar stage' } }, definition: 'Espacios que aparecen y se expanden en el sincitiotrofoblasto.', source: { ...w2, section: '2' } },
  { id: 'decidual-reaction', label: { primary: 'Desidua erreakzioa', secondary: { es: 'Reacción decidual', en: 'Decidual reaction' } }, definition: 'Cambios del endometrio asociados a la implantación.', source: { ...w2, section: '3' } },
  { id: 'somatopleure-splanchnopleure', label: { primary: 'Orri somatikoa / esplaknopleura', secondary: { es: 'Hoja somática / esplacnopleura', en: 'Somatic layer / splanchnopleure' } }, definition: 'Nombres según la localización de las hojas del mesodermo extraembrionario.', source: { ...w2, section: '3' } },
];
