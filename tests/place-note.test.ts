import { describe, expect, it } from 'vitest';
import { placeNote } from '@/components/kit/Label';

// Notes keep clear of what is fixed over the picture (camera keys, tools, Kimu, the 3D orientation key).
describe('placeNote', () => {
  const keys = { x0: 640, y0: 480, x1: 1000, y1: 640 };
  const kimu = { x0: 0, y0: 470, x1: 115, y1: 620 };

  it('leaves a clear note as drawn', () => {
    const p = placeNote('Laburpena', 500, 300, 'middle', 13, [keys, kimu]);
    expect(p).toMatchObject({ x: 500, y: 300, lines: ['Laburpena'] });
  });

  it('slides a note along its line into the gap left of the keys', () => {
    const p = placeNote('Bi endokardio hodiak fusionatzen dira', 500, 612, 'middle', 13, [keys, kimu]);
    expect(p.lines).toHaveLength(1);
    const w = 'Bi endokardio hodiak fusionatzen dira'.length * (7.1 / 13.5) * 13;
    expect(p.x + w / 2).toBeLessThanOrEqual(keys.x0 - 8 + 0.01);
    expect(p.x - w / 2).toBeGreaterThanOrEqual(kimu.x1 + 8 - 0.01);
  });

  it('wraps a note too wide for the gap, inside the frame bottom, every line inside the gap', () => {
    const text = 'Behetik gora jarraian: atal bentrikularra, hurbileko atala, arteria konoa, enbor arteriosoa eta aorta zakua';
    const p = placeNote(text, 500, 612, 'middle', 16, [keys, kimu]);
    expect(p.lines.length).toBeGreaterThan(1);
    expect(p.lines.join(' ')).toBe(text);
    for (const l of p.lines) expect(p.x + (l.length * (7.1 / 13.5) * 16) / 2).toBeLessThanOrEqual(keys.x0);
    expect(p.y).toBeLessThanOrEqual(612);
    expect(p.y + (p.lines.length - 1) * p.lh + p.lh / 2).toBeLessThanOrEqual(638.01);
  });
});
