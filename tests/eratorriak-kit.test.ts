import { describe, expect, it } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { decodeBoxes } from '@/content/eratorriak/flashcard-store';
import { PieceDiagram } from '@/components/shell/eratorriak/kit/PieceDiagram';
import { VEINS } from '@/content/eratorriak/veins';
import { VEIN_GEOMETRY } from '@/components/shell/eratorriak/VeinDiagram';
import { pickMatches } from '@/content/eratorriak/model';
import { CAVITIES } from '@/content/eratorriak/cavities';

describe('Eratorriak shared kit', () => {
  it('recovers from unavailable or corrupted stored progress and retains valid boxes', () => {
    for (const raw of [null, '{', 'null', '[]', 'true', '17', '"old"']) expect(decodeBoxes(raw)).toEqual({});
    expect(decodeBoxes('{"a":0,"b":4,"c":-1,"d":5,"e":1.5,"f":"2"}')).toEqual({ a: 0, b: 4 });
  });
  it('a glow has a nonzero user-space area even for straight vertical vessels', () => {
    const svg = renderToStaticMarkup(
      createElement(PieceDiagram, {
        data: VEINS,
        geometry: VEIN_GEOMETRY.cardinal,
        title: 'Kardinalak',
        stage: 4,
        mode: 'origin',
        lit: new Set<string>(),
        labels: true,
      }),
    );
    expect(svg).toContain('filterUnits="userSpaceOnUse"');
    expect(svg).toContain('data-piece-path="acR"');
    expect(svg).toContain('data-label="acR"');
  });
  it('finds late remnants and alternative derivative names, not just the pick label', () => {
    expect(VEINS.picks.filter((p) => pickMatches(VEINS, p, 'lotailu borobila')).some((p) => p.keys.includes('umbL'))).toBe(true);
    expect(CAVITIES.picks.filter((p) => pickMatches(CAVITIES, p, 'zentro frenikoa')).some((p) => p.keys.includes('septum'))).toBe(true);
    expect(VEINS.picks.some((p) => pickMatches(VEINS, p, 'zz-no-such-structure'))).toBe(false);
  });
});
