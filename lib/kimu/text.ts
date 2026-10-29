/**
 * Text helpers for matching what a student types (Spanish, Basque or English, with or without
 * accents) against the Basque notes: "notocorda" has to find "Notokorda".
 */

export type Lang = 'eu' | 'es' | 'en';

/** Spelling folded to one sound-alike form, so Spanish and Basque spellings of the same word meet. */
/** Words that qualify a name rather than name it ("enbrioi barruko zeloma" is about the zeloma). */
const GENERIC = new Set(['enbrioi', 'enbrioiaren', 'barruko', 'kanpoko', 'aurreko', 'atzeko', 'alboko', 'erdiko', 'goiko', 'beheko', 'hasierako', 'behin', 'betiko', 'bukaerako', 'lehen', 'lehenengo', 'primitiboa', 'primitibo']);

/** The word that names a structure: its longest word that is not a qualifier. */
export function keyWord(name: string): string {
  return keyWords(name).reduce((a, b) => (b.length > a.length ? b : a), '');
}

/** The words of a name without its qualifiers (all of them when it has nothing else). */
export function keyWords(name: string): string[] {
  const all = tokens(name);
  const own = all.filter((w) => !GENERIC.has(w));
  return own.length ? own : all;
}

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
  cierra: ['itxi', 'itxiera', 'ixten'],
  ixten: ['itxi', 'itxiera'],
  itxi: ['ixten', 'itxiera'],
  cierran: ['itxi', 'itxiera'],
  cerrar: ['itxi', 'itxiera'],
  close: ['itxi', 'itxiera'],
  closes: ['itxi', 'itxiera'],
  osatzen: ['atal', 'osagai'],
  osatu: ['atal', 'osagai'],
  osatuta: ['atal', 'osagai'],
  componentes: ['atal', 'osagai'],
  partes: ['atal'],
  formado: ['atal', 'osagai'],
  formada: ['atal', 'osagai'],
  compuesto: ['atal', 'osagai'],
  made: ['atal', 'osagai'],
  components: ['atal', 'osagai'],
  parts: ['atal'],
  forman: ['atal', 'osagai'],
  origen: ['jatorri'],
  origin: ['jatorri'],
  diafragma: ['diafragma'],
  diaphragm: ['diafragma'],
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
  // Split into two: the notes say "trenkadatze" (septation) and "trenkada" (septum).
  banatzen: ['trenkadatze', 'trenkada'],
  banatu: ['trenkadatze', 'trenkada'],
  banaketa: ['trenkadatze', 'trenkada'],
  zatitzen: ['trenkadatze', 'trenkada'],
  tabicacion: ['trenkadatze', 'trenkada'],
  tabique: ['trenkada'],
  tabiques: ['trenkada'],
  septacion: ['trenkadatze', 'trenkada'],
  septation: ['trenkadatze', 'trenkada'],
  divide: ['trenkadatze', 'trenkada'],
  division: ['trenkadatze', 'trenkada'],
  bulbo: ['bulbar'],
  bulbus: ['bulbar'],
  cono: ['kono'],
  conus: ['kono'],
  tronco: ['enbor'],
  truncus: ['enbor'],
};

/**
 * "3. faringe arkua" → "hirugarren faringe arkua": a single-digit ordinal is a word too (it tells the 3rd
 * arch from the 1st), and the notes write it both ways. Section numbers ("3.1.") and dates stay out.
 */
const ORDINAL = ['', 'lehen', 'bigarren', 'hirugarren', 'laugarren', 'bosgarren', 'seigarren', 'zazpigarren', 'zortzigarren', 'bederatzigarren'];
const ordinals = (text: string) => text.replace(/(^|[^\d.])([1-9])\.(?=\s+\p{L})/gu, (_, pre: string, d: string) => `${pre}${ORDINAL[+d]}`);

export const tokens = (text: string): string[] =>
  ordinals(text)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .split(/[^a-z0-9ñ]+/)
    .filter((w) => w.length > 1)
    .map(fold)
    .filter((w) => w.length > 1 && !STOP.has(w));

/** Question words that say what kind of answer is wanted, not what it is about (the intent reads them). */
const ASKING = new Set('egitura egiturak egiturek estructura estructuras structure structures viene vienen proviene procede deriva convierte origina come comes become becomes nondik datoz dator zertan bihurtzen bihurtu eratzen zergatik jaisten gertatzen azaltzen deitzen esaten aurkitzen kokatzen habiratzen agertzen ixten itxi'.split(' ').map(fold));
const ASKING_KEEP = new Set(['jaisten', 'habiratzen', 'ixten', 'itxi', 'agertzen', 'kokatzen'].map(fold));

/** Query tokens with the sound-alike synonyms added (each synonym counts as an alternative). */
export function queryTokens(text: string, asking = false): string[][] {
  const out: string[][] = [];
  const raw = ordinals(text).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').split(/[^a-z0-9ñ]+/).filter((w) => w.length > 1);
  for (const w of raw) {
    const f = fold(w);
    if (f.length < 2 || STOP.has(f)) continue;
    if (asking && ASKING.has(f) && !ASKING_KEEP.has(f)) continue;
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

/** How well a query word matches a document word (1 = same, 0 = unrelated). */
export function match(q: string, w: string, fuzzy: boolean): number {
  if (q === w) return 1;
  // Basque case endings: "somitei" and "somitak", "notokordaren" and "notokorda" are the same word.
  const sq = stem(q);
  if (sq.length >= 4 && sq === stem(w)) return 0.85;
  const [short, long] = q.length <= w.length ? [q, w] : [w, q];
  if (short.length >= 4 && long.startsWith(short) && short.length / long.length >= 0.6) return 0.85;
  if (fuzzy && short.length >= 5 && q[0] === w[0]) {
    const d = dice(q, w);
    if (d >= 0.6) return d * 0.8;
  }
  return 0;
}

/** Folded Basque word without its case or number ending ("somitei" → "somit"), when enough is left. */
const ENDINGS = ['etatik', 'etara', 'arekin', 'aren', 'etako', 'etan', 'eko', 'ari', 'ren', 'tik', 'ean', 'ak', 'ek', 'ei', 'ri', 'era', 'ra', 'an', 'en', 'a'];
export function stem(w: string): string {
  for (const e of ENDINGS) if (w.length - e.length >= 4 && w.endsWith(e)) return w.slice(0, -e.length);
  return w;
}

/**
 * "7. gaian", "7. gaia", "gaia 7", "topic 7", "tema 7": the topic a question names (not "4. astea", which
 * is a week of development). The phrase is not about content, so it is removed before searching.
 */
const TOPIC = /(?:\b(\d{1,2})\s*\.?\s*(?:gai\w*|tema\w*|topic)\b|\b(?:gai\w*|tema|topic)\s*\.?\s*(\d{1,2})\b)/gi;

/** The topic number (1–11) a question names, or null. */
export function topicIn(question: string): number | null {
  for (const m of question.matchAll(TOPIC)) {
    const n = Number(m[1] ?? m[2]);
    if (n >= 1 && n <= 11) return n;
  }
  return null;
}

/** The question without its topic phrase, tidied (commas and spaces left behind). */
export const withoutTopic = (question: string): string =>
  topicIn(question) === null ? question : question.replace(TOPIC, ' ').replace(/\s*,\s*(?=,|$)/g, ' ').replace(/\s+/g, ' ').replace(/^[\s,;]+|[\s,;]+$/g, '');

/** Edit distance (a swap of two letters counts once), or `max + 1` as soon as it is surely more than `max`. */
function edits(a: string, b: string, max: number): number {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  let prev2: number[] = [];
  let prev = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    let low = i;
    for (let j = 1; j <= b.length; j++) {
      let d = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d = Math.min(d, prev2[j - 2] + 1);
      cur.push(d);
      low = Math.min(low, d);
    }
    if (low > max) return max + 1;
    prev2 = prev;
    prev = cur;
  }
  return prev[b.length];
}

/**
 * A misspelt word ("bihtza", "somtak", "neuala"): the closest word the atlas or the notes use, added as
 * one more alternative (one letter off for short words, two for long ones; same first letter). A word
 * already known, or known through its case ending, is left alone.
 */
const spelt = new WeakMap<Map<string, number>, Map<string, string>>();
export function spell(alts: string[], vocab: Map<string, number>): string[] {
  const w = alts[0];
  if (w.length < 5 || /\d/.test(w) || alts.some((a) => vocab.has(a))) return alts;
  let seen = spelt.get(vocab);
  if (!seen) spelt.set(vocab, (seen = new Map()));
  let fix = seen.get(w);
  if (fix === undefined) seen.set(w, (fix = closest(w, vocab)));
  return fix ? [...alts, fix] : alts;
}

function closest(w: string, vocab: Map<string, number>): string {
  const max = w.length >= 8 ? 2 : 1;
  let best = '';
  let bestD = max + 1;
  let bestIdf = Infinity;
  for (const [v, idf] of vocab) {
    if (v[0] !== w[0]) continue;
    if (match(w, v, false) >= 0.85) return '';
    const d = edits(w, v, max);
    // The closest; among equals, the commonest (the lowest idf).
    if (d < bestD || (d === bestD && d <= max && idf < bestIdf)) { best = v; bestD = d; bestIdf = idf; }
  }
  return bestD <= max ? best : '';
}
