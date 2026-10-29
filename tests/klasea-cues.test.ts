import { describe, expect, it } from 'vitest';
import { cuesOf, namedAt, progressAt, reached } from '@/lib/klasea/cues';
import { syllables } from '@/lib/klasea/speak-eu';

const NAMES: Record<string, string[]> = {
  'zilbor-zainak': ['Zilborreko zainak', 'Zilbor zainak'],
  'bitelo-zainak': ['Zain bitelinoak', 'Bitelo zainak'],
  'bena-kardinal-komuna': ['Bena kardinal komuna'],
  'zain-sinua': ['Zain sinua'],
  'plaka-kardiogenikoa': ['Plaka kardiogenikoa'],
  'hasierako-eskuineko-bentrikulua': ['Hasierako eskuineko bentrikulua', 'Hasierako eskumako bentrikulua'],
  'hasierako-ezkerreko-bentrikulua': ['Hasierako ezkerreko bentrikulua'],
};
const namesOf = (id: string) => NAMES[id] ?? [];

describe('class cues: when the voice names each lit structure', () => {
  it('finds a name in any declension', () => {
    const text = 'Kontuz: plaka kardiogenikoaren alde zefalikoan.';
    expect(namedAt(text, 'plaka-kardiogenikoa', namesOf)).toBe(text.indexOf('plaka'));
  });

  it('orders the cues as they are said, with their place in syllables', () => {
    const text = 'Hiru zain mota iristen dira: zilborrekoak, bitelinoak eta kardinal komunak.';
    const cues = cuesOf(text, ['bena-kardinal-komuna', 'bitelo-zainak', 'zilbor-zainak'], namesOf);
    expect(cues.map((c) => c.id)).toEqual(['zilbor-zainak', 'bitelo-zainak', 'bena-kardinal-komuna']);
    expect(cues[0].i).toBe(text.indexOf('zilborrekoak'));
    expect(cues[0].at).toBeCloseTo(syllables(text.slice(0, cues[0].i)) / syllables(text), 5);
  });

  it('tells two look-alikes apart by the word only one of them has', () => {
    const text = 'Bi hasierako bentrikuluak: eskumakoa bulbotik, ezkerrekoa atal bentrikularretik.';
    const cues = cuesOf(text, ['hasierako-eskuineko-bentrikulua', 'hasierako-ezkerreko-bentrikulua'], namesOf);
    expect(cues.find((c) => c.id === 'hasierako-eskuineko-bentrikulua')!.i).toBe(text.indexOf('eskumakoa'));
    expect(cues.find((c) => c.id === 'hasierako-ezkerreko-bentrikulua')!.i).toBe(text.indexOf('ezkerrekoa'));
  });

  it('a word shared by several names is not taken where it is another one\'s name', () => {
    const text = 'Azkena, zain sinuak. Ezker eta eskuineko zainak bertan amaitzen dira.';
    const cues = cuesOf(text, ['zain-sinua', 'zilbor-zainak', 'bitelo-zainak'], namesOf);
    expect(cues.find((c) => c.id === 'zain-sinua')!.i).toBe(text.indexOf('zain sinuak'));
    expect(cues.find((c) => c.id === 'zilbor-zainak')!.i).toBe(text.indexOf('zainak bertan'));
  });

  it('given words win, and what the line does not say is lit from its start', () => {
    const text = 'Arteriak bihotzetik irteten dira; zainek bihotzera eramaten dute.';
    const cues = cuesOf(text, ['zain-sinua', 'zilbor-zainak'], namesOf, { 'zain-sinua': 'bihotzera' });
    expect(cues.find((c) => c.id === 'zain-sinua')!.i).toBe(text.indexOf('bihotzera eramaten'));
    expect(cuesOf('Atal guztiak jarraiak dira.', ['zain-sinua'], namesOf)).toEqual([{ id: 'zain-sinua', i: -1, at: 0 }]);
  });

  it('counts the cues reached, from the voice\'s place in what it says', () => {
    const cues = [{ id: 'a', i: -1, at: 0 }, { id: 'b', i: 10, at: 0.4 }, { id: 'c', i: 30, at: 0.8 }];
    expect(reached(cues, 0)).toBe(1);
    expect(reached(cues, 0.5)).toBe(2);
    expect(reached(cues, 1)).toBe(3);
    const said = 'bat bi hiru lau';
    expect(progressAt(said, said.indexOf('hiru'))).toBeCloseTo(2 / 5, 5);
  });
});
