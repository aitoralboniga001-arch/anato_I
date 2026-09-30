/**
 * Text helpers for matching what a student types (Spanish, Basque or English, with or without
 * accents) against the Basque notes: "notocorda" has to find "Notokorda".
 */

export type Lang = 'eu' | 'es' | 'en';

/** Spelling folded to one sound-alike form, so Spanish and Basque spellings of the same word meet. */
export function fold(word: string): string {
  return word
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/ll/g, 'l')
    .replace(/qu/g, 'k')
    .replace(/c(?=[ei])/g, 's')
    .replace(/c/g, 'k')
    .replace(/z/g, 's')
    .replace(/v/g, 'b')
    .replace(/w/g, 'b')
    .replace(/y/g, 'i')
    .replace(/h/g, '')
    .replace(/ph/g, 'f')
    .replace(/(.)\1+/g, '$1');
}

const STOP = new Set(
  (
    // Spanish
    'de la el los las un una unos unas que se en y o es son como cuando donde por para con del al me lo le les mi tu su sus esto esta este eso esa ese aqui ahi ' +
    'quiero saber puedes puedo llevame lleva llevar mostrar muestrame ensename explica explicame dime decir hay ser fue era hace hacer sobre acerca ' +
    'forma forman formacion forma formar parte partes cual cuales cuanto cuantos ' +
    // Basque
    'zer noiz nola non da dira eta ez bai du dute zein zergatik ari nire buruz azaldu esan nahi dut ikusi eraman eramaidazu erakutsi hau hori ' +
    'bat bi izan zen ziren dago daude egin egiten sortzen sortu ' +
    // English
    'what when how where why the is are of a an in on to and or do does did it its this that me show take about explain tell form forms formed'
  )
    .split(' ')
    .map(fold),
);

/** Spanish and English words the notes' Basque terms do not carry. */
const SYNONYMS: Record<string, string[]> = {
  tubo: ['hodi'],
  tube: ['hodi'],
  cierre: ['itxiera', 'itxi'],
  closure: ['itxiera'],
  pliegue: ['tolesdura', 'tolestura'],
  pliegues: ['tolesdura', 'tolestura'],
  fold: ['tolesdura', 'tolestura'],
  cresta: ['gandor'],
  crest: ['gandor'],
  corazon: ['bihotz'],
  heart: ['bihotz'],
  placenta: ['karena'],
  cordon: ['hestea'],
  umbilical: ['zilbor'],
  cord: ['hestea'],
  vellosidades: ['biloxka'],
  vellosidad: ['biloxka'],
  villi: ['biloxka'],
  huevo: ['obulua'],
  ovulo: ['obulua'],
  espermatozoide: ['espermatozoide'],
  implantacion: ['habiratze'],
  anidacion: ['habiratze'],
  implantation: ['habiratze'],
  fecundacion: ['ernalkuntza'],
  fertilization: ['ernalkuntza'],
  fertilisation: ['ernalkuntza'],
  segmentacion: ['segmentazio'],
  cleavage: ['segmentazio'],
  sangre: ['odol'],
  extremidades: ['gorputz-adar'],
  miembros: ['gorputz-adar'],
  limbs: ['gorputz-adar'],
  cerebro: ['burmuin'],
  brain: ['burmuin'],
  liquido: ['likido'],
  amniotico: ['amniotiko'],
  intestino: ['heste'],
  gut: ['heste'],
  columna: ['orno'],
  vertebra: ['orno'],
  vertebras: ['orno'],
  disco: ['disko'],
  capa: ['orri'],
  capas: ['orri'],
  hoja: ['orri'],
  hojas: ['orri'],
  layer: ['orri'],
  layers: ['orri'],
  saco: ['zaku'],
  vitelino: ['bitelo'],
  yolk: ['bitelo'],
  cavidad: ['barrunbe'],
  cavity: ['barrunbe'],
  gemelos: ['bikia'],
  primitiva: ['primitibo'],
  primitive: ['primitibo'],
  streak: ['lerro'],
  linea: ['lerro'],
  semana: ['aste'],
  week: ['aste'],
  dia: ['egun'],
  day: ['egun'],
};

export const tokens = (text: string): string[] =>
  text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .split(/[^a-z0-9ñ]+/)
    .filter((w) => w.length > 1)
    .map(fold)
    .filter((w) => w.length > 1 && !STOP.has(w));

/** Query tokens with the sound-alike synonyms added (each synonym counts as an alternative). */
export function queryTokens(text: string): string[][] {
  const out: string[][] = [];
  const raw = text.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').split(/[^a-z0-9ñ]+/).filter((w) => w.length > 1);
  for (const w of raw) {
    const f = fold(w);
    if (f.length < 2 || STOP.has(f)) continue;
    const alts = [f, ...(SYNONYMS[w] ?? []).map(fold)];
    out.push(alts);
  }
  return out;
}

const BASQUE = new Set('zer noiz nola non zein zergatik da dira eta ez bai du dute nire buruz azaldu esan nahi dut ikusi eraman eramaidazu erakutsi hau hori egun aste sortzen sortu dago daude ari ere'.split(' '));
const SPANISH = new Set('que qué cuando cuándo como cómo donde dónde por porque para con del los las una uno el la se es son hay quiero puedes llevame llévame explicame explícame dime muestrame muéstrame semana dia día forma forman esto esta este'.split(' '));
const ENGLISH = new Set('what when how where why the is are of and does show take explain tell me about week day form'.split(' '));

/** Which language the student writes in (Basque when unsure: it is the app's language). */
export function detectLang(text: string): Lang {
  const words = text.toLowerCase().split(/[^a-záéíóúüñ]+/).filter(Boolean);
  let eu = 0;
  let es = 0;
  let en = 0;
  for (const w of words) {
    if (BASQUE.has(w)) eu += 1;
    if (SPANISH.has(w)) es += 1;
    if (ENGLISH.has(w)) en += 1;
    // Basque case endings and Spanish-only letters/accents are good tells.
    if (/(ak|ek|oa|ean|era|etik|ren|tzen|ko|rik)$/.test(w) && w.length > 4) eu += 0.3;
    if (/[áéíóúñ]/.test(w)) es += 0.6;
  }
  if (eu === 0 && es === 0 && en === 0) return 'eu';
  if (en > eu && en > es) return 'en';
  return es > eu ? 'es' : 'eu';
}

/** Character trigram Dice similarity, for typos and spellings the fold does not reconcile. */
export function dice(a: string, b: string): number {
  if (a === b) return 1;
  if (a.length < 3 || b.length < 3) return 0;
  const grams = (s: string) => {
    const m = new Map<string, number>();
    for (let i = 0; i < s.length - 2; i++) {
      const g = s.slice(i, i + 3);
      m.set(g, (m.get(g) ?? 0) + 1);
    }
    return m;
  };
  const ga = grams(a);
  const gb = grams(b);
  let shared = 0;
  for (const [g, n] of ga) shared += Math.min(n, gb.get(g) ?? 0);
  return (2 * shared) / (a.length - 2 + (b.length - 2));
}
