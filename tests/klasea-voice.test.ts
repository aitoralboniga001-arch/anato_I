import { describe, expect, it } from 'vitest';
import { cardinal, ordinal, respellWord, spellNumbers, spokenText, syllables } from '@/lib/klasea/speak-eu';
import { rankVoices } from '@/lib/klasea/voice';

describe('class voice: Basque numbers', () => {
  it('writes cardinals and ordinals as normalize_basque.py does', () => {
    expect(cardinal(21)).toBe('hogeita bat');
    expect(cardinal(28)).toBe('hogeita zortzi');
    expect(cardinal(100)).toBe('ehun');
    expect(ordinal(21)).toBe('hogeita batgarren');
    expect(ordinal(1)).toBe('lehenengo');
    expect(ordinal(10)).toBe('hamargarren');
  });

  it('reads the day and week forms the class uses', () => {
    expect(spellNumbers('21. egunean')).toBe('hogeita batgarren egunean');
    expect(spellNumbers('23.–28. egunak')).toBe('hogeita hirugarren egunetik hogeita zortzigarrenera');
    expect(spellNumbers('4.–5. asteak')).toBe('laugarren astetik bosgarrenera');
    expect(spellNumbers('≈10. astean')).toBe('gutxi gorabehera hamargarren astean');
    expect(spellNumbers('3 zain mota')).toBe('hiru zain mota');
    expect(spellNumbers('O₂ gutxi')).toBe('o bi gutxi');
  });
});

describe('class voice: respelling for a Spanish voice', () => {
  it('lands Basque sounds on Spanish letters', () => {
    expect(respellWord('zain', false)).toBe('sain');
    expect(respellWord('bihotz', false)).toBe('bihots');
    expect(respellWord('geruza', false)).toBe('guerusa');
    expect(respellWord('xixkuen', false)).toBe('chiskuen');
    expect(respellWord('txiki', false)).toBe('chiki');
  });

  it('keeps Greco-Latin x and Latin terms', () => {
    expect(respellWord('torax', false)).toBe('torax');
    expect(respellWord('plexua', false)).toBe('plexua');
    expect(respellWord('extrazelularra', false)).toBe('extraselularra');
    expect(respellWord('septum', false)).toBe('septum');
    expect(respellWord('secundum', false)).toBe('secundum');
  });

  it('never turns an existing gue/gui into guue', () => {
    expect(respellWord('hoguei', false)).toBe('hoguei');
  });

  it('steers the stress of -ak/-ek/-tik words to the penultimate syllable', () => {
    expect(respellWord('aurikulak')).toBe('aurikúlak');
    expect(respellWord('eskuinetik')).toBe('eskuinétik');
    expect(respellWord('bihotz')).toBe('bihots'); // ends in s: Spanish already stresses the penultimate
    expect(respellWord('aorta')).toBe('aorta');
  });

  it('gives a Basque voice only the numbers', () => {
    expect(spokenText('21. egunean, zain-sinua', 'eu')).toBe('hogeita batgarren egunean, zain sinua');
    expect(spokenText('21. egunean, zain-sinua', 'es', false)).toBe('hogueita batgarren egunean, sain sinua');
  });

  it('counts syllables for timing', () => {
    expect(syllables('aurikula')).toBe(4);
    expect(syllables('bihotz hodia')).toBe(4);
  });
});

describe('class voice: choosing a voice', () => {
  const v = (name: string, lang: string, localService = true) => ({ name, lang, localService, default: false, voiceURI: name }) as SpeechSynthesisVoice;

  it('prefers Basque, then seseo Spanish, then Spain, local first', () => {
    const ranked = rankVoices([v('Helena', 'es-ES'), v('Zira', 'en-US'), v('Sabina', 'es-MX'), v('Ainhoa Online', 'eu-ES', false)]);
    expect(ranked.map((c) => c.voice.name)).toEqual(['Ainhoa Online', 'Sabina', 'Helena']);
    expect(ranked[0].kind).toBe('eu');
    expect(ranked[1].kind).toBe('es');
  });

  it('drops online voices when offline', () => {
    expect(rankVoices([v('Ainhoa Online', 'eu-ES', false), v('Helena', 'es-ES')], true).map((c) => c.voice.name)).toEqual(['Helena']);
  });
});
