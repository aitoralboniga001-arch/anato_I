/**
 * What the browser's voice is given to say: the class's Basque text with numbers written out in Basque
 * words, and, for a Spanish voice (the usual case: few browsers have a Basque one), respelled so Spanish
 * letter rules land on Basque sounds. The subtitle always shows the original text.
 *
 * Numbers follow scripts/narration/normalize_basque.py (Euskaltzaindia rules 18 and 203), the subset the
 * class needs: ordinals with their endings, day and week ranges, plain quantities.
 */

const SMALL = ['zero', 'bat', 'bi', 'hiru', 'lau', 'bost', 'sei', 'zazpi', 'zortzi', 'bederatzi', 'hamar', 'hamaika', 'hamabi', 'hamahiru', 'hamalau', 'hamabost', 'hamasei', 'hamazazpi', 'hemezortzi', 'hemeretzi'];
const TWENTIES: Record<number, string> = { 20: 'hogei', 40: 'berrogei', 60: 'hirurogei', 80: 'laurogei' };
const HUNDREDS = ['', 'ehun', 'berrehun', 'hirurehun', 'laurehun', 'bostehun', 'seiehun', 'zazpiehun', 'zortziehun', 'bederatziehun'];
const ORDINALS = ['zero', 'lehenengo', 'bigarren', 'hirugarren', 'laugarren', 'bosgarren', 'seigarren', 'zazpigarren', 'zortzigarren', 'bederatzigarren', 'hamargarren', 'hamaikagarren', 'hamabigarren', 'hamahirugarren', 'hamalaugarren', 'hamabosgarren', 'hamaseigarren', 'hamazazpigarren', 'hemezortzigarren', 'hemeretzigarren'];

export function cardinal(n: number): string {
  if (!Number.isInteger(n) || n < 0 || n > 9999) throw new Error(`Number out of range: ${n}`);
  if (n < 20) return SMALL[n];
  if (n < 100) {
    const base = Math.floor(n / 20) * 20;
    const rest = n % 20;
    return rest ? `${TWENTIES[base].slice(0, -1)}ita ${cardinal(rest)}` : TWENTIES[base];
  }
  if (n < 1000) {
    const rest = n % 100;
    return HUNDREDS[Math.floor(n / 100)] + (rest ? ` eta ${cardinal(rest)}` : '');
  }
  const base = Math.floor(n / 1000);
  const rest = n % 1000;
  const head = base === 1 ? 'mila' : `${cardinal(base)} mila`;
  if (!rest) return head;
  const tail = cardinal(rest);
  return head + (tail.includes(' eta ') ? ' ' : ' eta ') + tail;
}

export function ordinal(n: number, compound = false): string {
  if (!Number.isInteger(n) || n < 0 || n > 9999) throw new Error(`Ordinal out of range: ${n}`);
  if (n < 20) return n === 1 && compound ? 'batgarren' : ORDINALS[n];
  if (n < 100) {
    const base = Math.floor(n / 20) * 20;
    const rest = n % 20;
    return rest ? `${TWENTIES[base].slice(0, -1)}ita ${ordinal(rest, true)}` : `${TWENTIES[base]}garren`;
  }
  if (n < 1000) {
    const rest = n % 100;
    return HUNDREDS[Math.floor(n / 100)] + (rest ? ` eta ${ordinal(rest, true)}` : 'garren');
  }
  const base = Math.floor(n / 1000);
  const rest = n % 1000;
  const head = base === 1 ? 'mila' : `${cardinal(base)} mila`;
  if (!rest) return `${head}garren`;
  const tail = ordinal(rest, true);
  return head + (tail.includes(' eta ') ? ' ' : ' eta ') + tail;
}

const ONE_SUFFIX: Record<string, string> = { etik: 'tik', era: 'ra', ean: 'an', eko: 'ko', erako: 'rako' };
export const inflectedOrdinal = (n: number, suffix: string) => ordinal(n) + (n === 1 && ONE_SUFFIX[suffix] ? ONE_SUFFIX[suffix] : suffix);

const L = String.raw`(?<![\p{L}\p{N}.,\-–—])`;
const DASH = String.raw`\s*[-–—]\s*`;
const TIME = String.raw`(egun|aste|hilabete)(etarako|etako|etatik|etara|etan|aren|en|eko|ko|erako|rako|etik|tik|era|ra|ean|an|ak|a)?`;

/** Basque numerals as words, for a voice that would otherwise read the digits in its own language. */
export function spellNumbers(text: string): string {
  let out = text.replace(/[~≈]\s*(?=\d)/g, 'gutxi gorabehera ');
  out = out.replace(/(?<![\p{L}\p{N}])O[2₂](?![\p{L}\p{N}])/gu, 'o bi');
  // Dated ranges: "23.–28. egunak" → hogeita hirugarren egunetik hogeita zortzigarrenera.
  out = out.replace(new RegExp(`${L}(\\d{1,3})\\.?${DASH}(\\d{1,3})\\.\\s*${TIME}(?![\\p{L}])`, 'gu'), (_m, a: string, b: string, stem: string, suffix = '') => {
    const from = { aste: 'astetik', egun: 'egunetik', hilabete: 'hilabetetik' }[stem as 'aste'];
    let r = `${ordinal(+a)} ${from} ${inflectedOrdinal(+b, 'era')}`;
    if (['aren', 'en', 'eko', 'ko', 'etako'].includes(suffix)) r += ' arteko';
    return r;
  });
  // Elided-noun ranges: "4.–5. asteak" handled above; "37.–38.ean".
  out = out.replace(new RegExp(`${L}(\\d{1,3})\\.${DASH}(\\d{1,3})\\.(ean|a|ak|aren|en|etik|era|eko)?(?![\\p{L}])`, 'gu'), (_m, a: string, b: string, s?: string) =>
    `${inflectedOrdinal(+a, 'etik')} ${inflectedOrdinal(+b, 'era')}${s && ['aren', 'en', 'eko'].includes(s) ? ' arteko' : ''}`);
  // Ordinals with their ending glued on: "5.a", "30.ean".
  out = out.replace(new RegExp(`${L}(\\d{1,3})\\.(ean|a|ak|aren|en|etik|era|eko|erako)(?![\\p{L}])`, 'gu'), (_m, n: string, s: string) => inflectedOrdinal(+n, s));
  // Ordinals before a time noun or a list break: "21. egunean", "4. astea", "3. gaia".
  out = out.replace(new RegExp(`${L}(\\d{1,3})\\.(?!\\d)(?=\\s*(?:[,;)]|eta\\b|egun|aste|hilabete|gai))`, 'giu'), (_m, n: string) => ordinal(+n));
  // Plain quantity ranges and numbers.
  out = out.replace(new RegExp(`${L}(\\d{1,4})${DASH}(\\d{1,4})(?![\\p{L}\\p{N},]|\\.\\d)`, 'gu'), (_m, a: string, b: string) => `${cardinal(+a)} eta ${cardinal(+b)} arteko`);
  out = out.replace(new RegExp(`${L}(\\d{1,4})(?![\\p{L}\\p{N},]|\\.\\d)`, 'gu'), (_m, n: string) => cardinal(+n));
  return out;
}

/** Words whose x is /ks/ (Greco-Latin), never respelled; matched by their start. */
const KS_STEMS = ['torax', 'plexu', 'extra', 'oxigen', 'axial', 'maxil', 'aprox', 'sexu', 'toxi', 'oxi', 'parax', 'primax', 'abax', 'epax', 'hipax', 'axoi'];
/** Latin terms the notes use as they are. */
const LATIN = new Set(['septum', 'primum', 'secundum', 'sekundum', 'spurium', 'transversum', 'sinus', 'venarum', 'venosus', 'cordis', 'arteriosus', 'truncus']);

const VOWEL = 'aeiouáéíóú';
const STRONG = 'aeoáéó';

/** The vowel groups of a word as Spanish would syllabify them (a strong pair is two syllables). */
function nuclei(word: string): [number, number][] {
  const out: [number, number][] = [];
  let i = 0;
  while (i < word.length) {
    if (!VOWEL.includes(word[i])) {
      i += 1;
      continue;
    }
    let j = i + 1;
    while (j < word.length && VOWEL.includes(word[j]) && !(STRONG.includes(word[j - 1]) && STRONG.includes(word[j]))) j += 1;
    out.push([i, j]);
    i = j;
  }
  return out;
}

export const syllables = (text: string) =>
  (text.toLowerCase().match(/\p{L}+/gu) ?? []).reduce((n, w) => n + Math.max(1, nuclei(w).length), 0);

const ACUTE: Record<string, string> = { a: 'á', e: 'é', i: 'í', o: 'ó', u: 'ú' };

/**
 * Spanish voices stress the last syllable of a word that ends in a consonant other than n or s, which
 * hammers every Basque -ak, -ek, -tik. An acute accent on the penultimate vowel steers it back.
 */
function steerStress(word: string): string {
  if (/[áéíóú]/.test(word) || /[aeiouns]$/.test(word)) return word;
  const groups = nuclei(word);
  if (groups.length < 2) return word;
  const [a, b] = groups[groups.length - 2];
  const group = word.slice(a, b);
  // In a rising pair (ia, ue…) the stress falls on the second vowel; otherwise on the strong one, or the first.
  let k = [...group].findIndex((c) => STRONG.includes(c));
  if (k < 0) k = group.length - 1;
  const at = a + k;
  return word.slice(0, at) + (ACUTE[word[at]] ?? word[at]) + word.slice(at + 1);
}

/** One Basque word, respelled for a Spanish voice. */
export function respellWord(raw: string, stress = true): string {
  const word = raw.toLowerCase();
  if (LATIN.has(word)) return word;
  let w = word;
  if (!KS_STEMS.some((s) => w.startsWith(s))) {
    w = w
      .replace(/tx/g, 'ch')
      .replace(/x(?=[aeiou])/g, 'ch')
      .replace(/x/g, 's');
  }
  w = w
    .replace(/tz/g, 'ts')
    .replace(/z/g, 's')
    .replace(/g(?=[eéií])/g, 'gu');
  return stress ? steerStress(w) : w;
}

export type VoiceKind = 'eu' | 'es';

/** The text the voice is given. Basque voices get only the numbers; Spanish ones the respelling too. */
export function spokenText(text: string, voice: VoiceKind, stress = true): string {
  const spelled = spellNumbers(text).replace(/(\p{L})-(\p{L})/gu, '$1 $2');
  if (voice === 'eu') return spelled;
  return spelled.replace(/\p{L}+/gu, (w) => respellWord(w, stress));
}
