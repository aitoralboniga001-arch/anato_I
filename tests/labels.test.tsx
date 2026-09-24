import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { SceneContext, type SceneContextValue } from '@/components/kit/context';
import { structures, weeks } from '@/content/registry';
import type { Orientation } from '@/lib/sim/types';

/**
 * Layout lint for scene labels, run on the server-rendered SVG (no browser needed).
 * Text width is estimated from the character count (13.5px semibold ≈ 7.1 units/char),
 * which is close enough to catch clipped labels, labels under the toolbar or the
 * orientation pills, and labels printed on top of each other.
 */

const ctx: SceneContextValue = {
  selected: null,
  hovered: null,
  focus: [],
  showLabels: true,
  quiz: false,
  quizFlash: null,
  nameOf: (id) => structures.get(id)?.name ?? id,
  onSelect: () => {},
  onHover: () => {},
};

const SAMPLES = [0, 0.1, 0.25, 0.4, 0.5, 0.6, 0.75, 0.9, 1];
const H = 15;

interface Box {
  id: string;
  x0: number;
  x1: number;
  y0: number;
  y1: number;
}

const decode = (s: string) =>
  s.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#x27;/g, "'");

function labelBoxes(html: string): Box[] {
  const boxes: Box[] = [];
  const re = /<g data-label="([^"]+)" class="([^"]*)" opacity="([^"]+)"[^>]*>[\s\S]*?<text x="([^"]+)" y="([^"]+)"[^>]*text-anchor="([^"]+)"[^>]*>([^<]*)<\/text>/g;
  for (const m of html.matchAll(re)) {
    const [, id, cls, op, xs, ys, anchor, raw] = m;
    if (Number(op) < 0.3) continue;
    const w = decode(raw).length * (cls.includes('label-small') ? 6.4 : 7.1);
    const x = Number(xs);
    const y = Number(ys);
    const x0 = anchor === 'end' ? x - w : anchor === 'middle' ? x - w / 2 : x;
    boxes.push({ id, x0, x1: x0 + w, y0: y - H / 2, y1: y + H / 2 });
  }
  return boxes;
}

const hit = (b: Box, x0: number, x1: number, y0: number, y1: number) => b.x0 < x1 && b.x1 > x0 && b.y0 < y1 && b.y1 > y0;

function problems(boxes: Box[], o: Orientation | undefined): string[] {
  const out: string[] = [];
  for (const b of boxes) {
    if (b.x0 < 2 || b.x1 > 998 || b.y0 < 2 || b.y1 > 638) out.push(`${b.id}: frametik kanpo`);
    // Zones measured in the browser at 1440×900 (SVG units): toolbar column and the edge pills.
    if (hit(b, 932, 1000, 0, 222)) out.push(`${b.id}: tresna-barraren azpian`);
    if (o?.left && hit(b, 0, 114, 302, 338)) out.push(`${b.id}: ezkerreko orientazio-etiketaren azpian`);
    if (o?.right && hit(b, 891, 1000, 302, 338)) out.push(`${b.id}: eskuineko orientazio-etiketaren azpian`);
  }
  for (let i = 0; i < boxes.length; i++)
    for (let j = i + 1; j < boxes.length; j++) {
      const a = boxes[i];
      const b = boxes[j];
      if (a.id !== b.id && hit(a, b.x0, b.x1, b.y0 + 2, b.y1 - 2)) out.push(`${a.id} ↔ ${b.id}: gainjarrita`);
    }
  return out;
}

for (const w of weeks)
  describe(`${w.week}. astea — etiketen kokapena`, () => {
    for (const st of w.stages)
      for (const v of st.views)
        it(`${st.id} / ${v.id}`, () => {
          const Scene = v.scene;
          const found = new Map<string, number[]>();
          for (const t of SAMPLES) {
            const html = renderToStaticMarkup(
              <SceneContext.Provider value={ctx}>
                <svg viewBox="0 0 1000 640">
                  <Scene t={t} reduced={false} />
                </svg>
              </SceneContext.Provider>,
            );
            for (const p of problems(labelBoxes(html), v.orientation)) found.set(p, [...(found.get(p) ?? []), t]);
          }
          expect([...found].map(([p, ts]) => `${p} (t=${ts.join(',')})`)).toEqual([]);
        });
  });
