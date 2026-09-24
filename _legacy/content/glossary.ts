import type { GlossaryTerm } from './types';

const w1 = { file: '1. ENBRIOLOGIA_GARAPENAREN LEHENGO ASTEA (zuzenduta).docx', section: '1.–4. atalak' };
const w2 = { file: '2. ENBRIOLOGIA_GARAPENAREN BIGARREN ASTEA (zuzenduta).pdf', section: '1.–4. atalak' };
const w3 = { file: '3. Enbriologia_Garapenaren hirugarren astea .pdf', section: '1.–4. atalak' };
const w4 = { file: '4. Enbriologia_Garapenaren laugarren astea (ZUZENDUTA).pdf', section: '1.–4. atalak' };

export const glossary: GlossaryTerm[] = [
  { id: 'cranial', label: { primary: 'Kraneala / zefalikoa' }, definition: 'Enbrioiaren buruaren edo aurreko muturraren aldeko noranzkoa.', source: { ...w1, section: '1.2' } },
  { id: 'caudal', label: { primary: 'Kaudala' }, definition: 'Enbrioiaren isatsaren edo atzeko muturraren aldeko noranzkoa.', source: { ...w1, section: '1.2' } },
  { id: 'ventral-dorsal', label: { primary: 'Bentrala / dortsala' }, definition: 'Bentrala sabelaren aldera doa; dortsala bizkarraren aldera.', source: { ...w1, section: '1.2' } },
  { id: 'blastocoel', label: { primary: 'Blastozelea' }, definition: 'Blastozistoaren barruko likidoz betetako barrunbea.', source: { ...w1, section: '4.4' } },
  { id: 'lacunae', label: { primary: 'Lakuak / garai lakunarra' }, definition: 'Sinzitiotrofoblastoan agertu eta elkartzen diren espazioak; amaren odolaren hasierako bidea.', source: { ...w2, section: '2' } },
  { id: 'decidual-reaction', label: { primary: 'Desidua erreakzioa' }, definition: 'Inplantazioari erantzunez endometrioan gertatzen diren ehun-aldaketak.', source: { ...w2, section: '3' } },
  { id: 'somatopleure-splanchnopleure', label: { primary: 'Orri somatikoa / esplaknopleura' }, definition: 'Orri somatikoa gorputz-paretaren aldean dago; esplaknikoa erraien eta bitelo-zakuaren aldean.', source: { ...w2, section: '3' } },
  { id: 'gastrulation', label: { primary: 'Gastrulazioa' }, definition: 'Epiblastoko zelulen migrazioaren bidez hiru ernetze-orriak sortzeko prozesua.', source: { ...w3, section: '1. atala; 2.–5. or.' } },
  { id: 'notochord', label: { primary: 'Notokorda' }, definition: 'Enbrioiaren erdiko ardatzeko egitura, gaineko ektodermoaren neurulazioa induzitzen duena.', source: { ...w3, section: '2. atala; 5.–6. or.' } },
  { id: 'neurenteric-canal', label: { primary: 'Kanal neurenterikoa' }, definition: 'Notokordaren eraketako une batean amnioi-barrunbea eta bitelo-zakua lotzen dituen behin-behineko kanala.', source: { ...w3, section: '2. atala; 6. or.' } },
  { id: 'chorionic-villi', label: { primary: 'Korion-biloxka primarioa, sekundarioa eta tertziarioa' }, definition: 'Biloxka primarioak zitotrofoblastozko muina dauka; sekundarioan mesodermoa sartzen da, eta tertziarioan kapilarrak garatzen dira.', source: { ...w3, section: '4. atala; 9.–11. or.' } },
  { id: 'placental-barrier', label: { primary: 'Karena-hesia' }, definition: 'Amaren odola eta fetuaren kapilarretako odola bereizten dituzten biloxka-ehunak; gas eta mantenugaien trukea ahalbidetzen dute.', source: { ...w3, section: '4. atala; 10.–11. or.' } },
  { id: 'neurulation', label: { primary: 'Neurulazioa' }, definition: 'Plaka neuralaren tolesdura eta fusioaren bidez hodi neurala sortzeko prozesua.', source: { ...w4, section: '2. atala; 2. or.' } },
  { id: 'neuropore', label: { primary: 'Neuroporoa' }, definition: 'Garatu ahala ixten den hodi neuralaren muturreko irekidura; aurrekoa 25. egun inguruan eta atzekoa 27.–28. egun inguruan.', source: { ...w4, section: '2. atala; 2. or.' } },
  { id: 'neural-crest', label: { primary: 'Gandor neurala' }, definition: 'Hodi neuralaren ertzetik migratzen diren zelulak; gongoilak, melanozitoak eta beste hainbat egitura sortzen dituzte.', source: { ...w4, section: '2. atala; 2.–4. or.' } },
  { id: 'somite', label: { primary: 'Somita' }, definition: 'Mesodermo paraxialeko segmentu parekatua; esklerotoma, dermatoma eta miotoma eratzen ditu.', source: { ...w4, section: '3.1 atala; 5.–7. or.' } },
  { id: 'intraembryonic-coelom', label: { primary: 'Enbrioi barruko zeloma' }, definition: 'Alboko mesodermoaren bi orrien arteko barrunbea; perikardio-, pleura- eta peritoneo-barrunbeen aitzindaria.', source: { ...w4, section: '3.3 atala; 5., 8.–10. or.' } },
  { id: 'vitelline-duct', label: { primary: 'Hodi bitelinoa' }, definition: 'Erdiko hestearen eta enbrioitik kanpoko bitelo-zakuaren arteko aldi baterako lotura.', source: { ...w4, section: '4. atala; 11. or.' } },
];
