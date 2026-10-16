import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { LabelScaleContext, SceneContext, type SceneContextValue } from '@/components/kit/context';
import { structures, weeks } from '@/content/registry';
import { SceneView } from '@/components/kit/columns';
import type { Orientation } from '@/lib/sim/types';

/**
 * Layout lint for scene labels, run on the server-rendered SVG (no browser needed).
 * Text width is estimated from the character count (13.5px semibold ≈ 7.1 units/char),
 * which is close enough to catch clipped labels, labels under the toolbar or the
 * orientation pills, and labels printed on top of each other. Checked at the drawn size and
 * at the largest size the viewport grows labels to on small screens.
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
const SCALES = [1, 1.3];

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
    const [whole, id, cls, op, xs, ys, anchor, raw] = m;
    if (Number(op) < 0.3) continue;
    const drawn = cls.includes('label-small') ? 12 : 13.5;
    const k = Number(/font-size:([\d.]+)px/.exec(whole)?.[1] ?? drawn) / drawn;
    const w = k * decode(raw).length * (cls.includes('label-small') ? 6.4 : 7.1);
    const h = k * H;
    const x = Number(xs);
    const y = Number(ys);
    const x0 = anchor === 'end' ? x - w : anchor === 'middle' ? x - w / 2 : x;
    boxes.push({ id, x0, x1: x0 + w, y0: y - h / 2, y1: y + h / 2 });
  }
  return boxes;
}

interface Leader {
  id: string;
  pts: [number, number][];
}

/** Each name's leader line (plate edge → elbow → the dot on the structure). */
function leaders(html: string): Leader[] {
  const out: Leader[] = [];
  const re = /<g data-label="([^"]+)" class="[^"]*" opacity="([^"]+)"[^>]*><path class="label-casing" d="([^"]+)"/g;
  for (const m of html.matchAll(re)) {
    if (Number(m[2]) < 0.3) continue;
    const nums = m[3].match(/-?[\d.]+/g)?.map(Number) ?? [];
    const pts: [number, number][] = [];
    for (let i = 0; i + 1 < nums.length; i += 2) pts.push([nums[i], nums[i + 1]]);
    out.push({ id: m[1], pts });
  }
  return out;
}

/** Does the segment a→b pass through the box (shrunk a little, so grazing a corner is allowed)? */
function crosses(a: [number, number], b: [number, number], box: Box) {
  const x0 = box.x0 + 3;
  const x1 = box.x1 - 3;
  const y0 = box.y0 + 2;
  const y1 = box.y1 - 2;
  let t0 = 0;
  let t1 = 1;
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  for (const [p, q] of [
    [-dx, a[0] - x0],
    [dx, x1 - a[0]],
    [-dy, a[1] - y0],
    [dy, y1 - a[1]],
  ]) {
    if (p === 0) {
      if (q < 0) return false;
    } else {
      const r = q / p;
      if (p < 0) t0 = Math.max(t0, r);
      else t1 = Math.min(t1, r);
      if (t0 > t1) return false;
    }
  }
  return true;
}

const hit = (b: Box, x0: number, x1: number, y0: number, y1: number) => b.x0 < x1 && b.x1 > x0 && b.y0 < y1 && b.y1 > y0;

function problems(boxes: Box[], o: Orientation | undefined, lines: Leader[] = []): string[] {
  const out: string[] = [];
  // A leader must never run behind another name: the eye reads it as crossing the word.
  for (const l of lines)
    for (const b of boxes) {
      if (b.id === l.id) continue;
      for (let i = 0; i + 1 < l.pts.length; i++) if (crosses(l.pts[i], l.pts[i + 1], b)) { out.push(`${l.id}: lerroak "${b.id}" izena zeharkatzen du`); break; }
    }
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
          const found = new Map<string, string[]>();
          for (const k of SCALES)
            for (const t of SAMPLES) {
              const html = renderToStaticMarkup(
                <SceneContext.Provider value={ctx}>
                  <LabelScaleContext.Provider value={{ k, left: !!v.orientation?.left, right: !!v.orientation?.right }}>
                    <svg viewBox="0 0 1000 640">
                      <SceneView Scene={Scene} t={t} reduced={false} />
                    </svg>
                  </LabelScaleContext.Provider>
                </SceneContext.Provider>,
              );
              for (const p of problems(labelBoxes(html), v.orientation, leaders(html))) found.set(p, [...(found.get(p) ?? []), k === 1 ? `${t}` : `${t}×${k}`]);
            }
          expect([...found].map(([p, ts]) => `${p} (t=${ts.join(',')})`)).toEqual([]);
        }, 15000);
  });
