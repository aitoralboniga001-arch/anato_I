import type { ViewGuide } from '@/lib/sim/types';

/** Reading aids for the models, separate from the verbatim course notes.
 * Anatomical cross-checks:
 * https://embryology.med.unsw.edu.au/embryology/index.php/Respiratory_System_-_Diaphragm
 * https://embryology.med.unsw.edu.au/embryology/index.php/Lecture_-_Limb_Development
 * https://pmc.ncbi.nlm.nih.gov/articles/PMC2409079/ (somitic frontier is a lineage boundary).
 */
export const diaphragmGuide: ViewGuide = {
  orientation: 'Enborreko xerra bat ikusten ari zara. Kraneala = bururantz; bentrala = sabelalderantz. Diafragmak toraxa eta abdomena bereizten ditu.',
  observe: 'Jarraitu atzeko bi erretenei: hasieran zabalik daude; mintz pleuroperitonealak haztean itxi egiten dira. Gero begiratu osagai bakoitzaren koloreari kupulan.',
  meaning: 'Koloreek osagaiak bereizten laguntzen dute. Eredua eskematikoa da: kupularen sorrera ikusten ari zara, ez arnasketako mugimendua.',
  question: 'Erretenak itxi aurretik, zein bi barrunbe daude komunikatuta?',
  answer: 'Goiko barrunbea (hasierako perikardio barrunbea; erreten horietan garatuko dira pleura-barrunbeak) eta beheko peritoneo-barrunbea. Mintz pleuroperitonealek erretenak ixten dituzte.',
};

export const calvariaGuide: ViewGuide = {
  orientation: 'Buru-ganga entzefaloaren gaineko eta alboetako hezur-estalkia da. Biratu eredua aurrealdea, goialdea eta atzealdea bereizteko.',
  observe: 'Begiratu hezur-plaken arteko urdinari: ildo estuak joskurak dira; elkargune zabalagoak fontanelak. Biratzean beste aldekoak ikusiko dituzu.',
  meaning: 'Urdina ehun konektiboa da, ez zulo hutsa. Hezurrak mintzean hazten dira, eta hezurtu gabeko tarteek hazten jarraitzea ahalbidetzen dute.',
  question: 'Zer dute komunean joskurek eta fontanelek?',
  answer: 'Hezurren arteko ehun konektibozko tarteak dira. Joskurak estuak dira; fontanelak zabalagoak, hainbat hezur elkartzen diren tokian.',
};

export const limbGuide: ViewGuide = {
  orientation: 'Enbrioiaren gorputz-adarrak ikusten ari zara. Kraneala = bururantz; bentrala = sabelalderantz. Ezkerra enbrioiaren ezkerra da, ez pantailarena.',
  observe: 'Jarraitu gorriari (tolestatzaileak) eta urdinari (hedatzaileak). Goiko adarrak kanporantz biratzen dira; behekoak, erdialderantz.',
  meaning: 'Koloreak muskulu-masak identifikatzeko dira. Kamera biratzeak ikuspegia soilik aldatzen du; denbora-lerroak garapeneko biraketa erakusten du.',
  question: 'Biraketaren ondoren, non geratzen dira muskulu tolestatzaileak?',
  answer: 'Goiko gorputz-adarretan aurrealdean; behekoetan atzealdean. Kontrako noranzkoko biraketek azaltzen dute desberdintasuna.',
};

export const domainsGuide: ViewGuide = {
  orientation: 'Lehenik enbrioi osoa kokatzen da; gero enborraren xerra bat hurbiltzen da, hiru somita luze. Somitak hodi neuralaren bi alboetako zelula multzoak dira. Dortsala = bizkarralderantz; kraneala = bururantz.',
  observe: 'Jarraitu somitatik ateratzen diren zelulei. Batzuek muga berdea gurutzatu eta alboko mesodermoaren paretako orrira migratzen dute.',
  meaning: 'Gortina berdea muga kontzeptuala da, ez benetako mintza. Domeinuak bereizteko, zelularen jatorriaz gain, inguruko ehun konektiboaren jatorria ere kontuan hartu.',
  question: 'Somitatik datorren muskulu-zelula bat abaxiala izan daiteke?',
  answer: 'Bai. Alboko mesodermotik datorren ehun konektiboan garatzen bada, domeinu abaxialean dago; zelularen somita-jatorria ez da aldatzen.',
};
