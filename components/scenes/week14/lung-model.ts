import { add, cross, mul, norm, type V3 } from '@/lib/three-d/math';
import { curve3, merge, type Mesh } from '@/lib/three-d/mesh';
import { cachedMesh } from '@/lib/three-d/mesh-cache';
import type { Item3 } from '@/lib/three-d/scene';
import { blobParts, mixHex, tubeParts } from '@/components/scenes/week10/model3d';
import { T } from '@/components/scenes/week10/common';
import { GC } from './gut3d';

/**
 * Topic 14, stages 25–26 (the notes' "ARNAS APARATUA"): the respiratory system in 3D.
 *
 * `treeModel`: the respiratory diverticulum budding from the foregut's ventral wall (day 22), lengthening into
 * the laryngotracheal tube; its two lung buds (the primary bronchi); the secondary bronchi of week 5 (3 on the
 * right, 2 on the left: the lobes) and the tertiary of week 6 (the segmental bronchi); further branching
 * (≈16 times); the trachea's C-shaped cartilages; the lobes.
 *
 * `acinusModel`: a close-up of one terminal bronchiole: respiratory bronchioles (16–28 weeks), terminal sacs
 * (28–36), the capillaries of the splanchnic mesoderm meeting them (36), type I and type II pneumocytes,
 * surfactant (month 7 on), maturation (thinner type I cells, capillaries bulging into the alveoli), the
 * fluid at birth.
 *
 * Axes: x the embryo's LEFT, y cranial, z ventral (seen from the front the embryo's right is on the viewer's
 * left, as the notes' figures).
 */

export const LC = {
  endo: T.endo,
  endoDeep: T.endoDeep,
  gut: GC.endo,
  resp: GC.resp,
  respDeep: GC.respDeep,
  cartilage: '#e9f1f7',
  lobeR: '#f3a7b6',
  lobeL: '#f6b9c6',
  pneumo1: '#f6d8e6',
  pneumo2: '#c0567f',
  surf: '#ffe36e',
  capO2: T.o2,
  capCO2: T.deo2,
  fluid: '#9fd3ff',
  meso: T.visceral,
} as const;

const darker = (c: string) => mixHex(c, '#000000', 0.55);
const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
const lerp3 = (a: V3, b: V3, k: number): V3 => [lerp(a[0], b[0], k), lerp(a[1], b[1], k), lerp(a[2], b[2], k)];
const ss = (a: number, b: number, x: number) => {
  const u = clamp01((x - a) / (b - a));
  return u * u * (3 - 2 * u);
};
const r3 = (v: number) => Math.round(v * 1000) / 1000;
const tube = (pts: readonly V3[], r: (u: number) => number, sides = 12) => tubeParts(pts, { radius: r, ref: [0, 0, 1], sides, capStart: true, capEnd: true });

type Dim = { ids: readonly string[]; k: number } | null | undefined;
const fader = (dim: Dim) => {
  const lit = (id: string, groups?: readonly string[]) => !dim || dim.k <= 0.001 || dim.ids.includes(id) || (groups ?? []).some((g) => dim.ids.includes(g));
  return (id: string, groups?: readonly string[], k = 0.75) => (lit(id, groups) ? 1 : 1 - k * (dim?.k ?? 0));
};

// ———————————————————————————— the bronchial tree ————————————————————————————

export interface TreePose {
  /** The respiratory diverticulum's outgrowth from the foregut (0 → 1: the laryngotracheal tube). */
  bud: number;
  /** The two lung buds (primary bronchi). */
  primary: number;
  /** Secondary (lobar) bronchi: 3 right, 2 left. */
  secondary: number;
  /** Tertiary (segmental) bronchi. */
  tertiary: number;
  /** Further branching (the ≈16 generations, shown as a few). */
  more: number;
  /** The lobes drawn round their bronchi. */
  lobes: number;
  /** The trachea's C-shaped cartilages and the larynx. */
  cartilage: number;
}

export const TP0: TreePose = { bud: 0, primary: 0, secondary: 0, tertiary: 0, more: 0, lobes: 0, cartilage: 0 };

export interface TreeOpts {
  dim?: Dim;
}

const TOP: V3 = [0, 2.2, -0.14];
const P1: V3 = [0, 2.06, 0.08];
const CARINA: V3 = [0, 0.75, 0.12];

/** A branch from a point along a direction, grown to fraction g. */
const branch = (from: V3, dir: V3, len: number, g: number, bend: V3 = [0, 0, 0]): V3[] => {
  const end = add(from, mul(norm(dir), len * Math.max(0.02, g)));
  return curve3([from, add(lerp3(from, end, 0.5), mul(bend, g)), end], 8);
};

/** The lobar bronchi: [side, direction, length]; 3 on the right (−x), 2 on the left. */
const LOBAR: { side: -1 | 1; dir: V3; len: number; lobe: string }[] = [
  { side: -1, dir: [-0.8, 0.45, 0.05], len: 0.5, lobe: 'goiko' },
  { side: -1, dir: [-0.6, -0.2, 0.55], len: 0.48, lobe: 'erdiko' },
  { side: -1, dir: [-0.35, -1, -0.1], len: 0.62, lobe: 'beheko' },
  { side: 1, dir: [0.8, 0.4, 0.15], len: 0.52, lobe: 'goiko' },
  { side: 1, dir: [0.35, -1, -0.05], len: 0.62, lobe: 'beheko' },
];

/** A lobe round its full-grown branches: an ellipsoid over the lobar bronchus, its segmental ones and their tips. */
function lobeShape(main: readonly V3[], L: (typeof LOBAR)[number]): { c: V3; r: V3 } {
  const start = main[main.length - (L.lobe === 'goiko' ? 4 : 1)];
  const end = add(start, mul(norm(L.dir), L.len));
  const d = norm(L.dir);
  const side = norm(cross(d, [0, 0, 1]));
  const up = norm(cross(side, d));
  const pts: V3[] = [start, end];
  const n = L.lobe === 'erdiko' ? 2 : 3;
  for (let k = 0; k < n; k++) {
    const a = (k - (n - 1) / 2) * 0.9;
    const dir = norm(add(d, add(mul(side, Math.sin(a) * 0.9), mul(up, Math.cos(a * 1.7) * 0.35 - 0.1))));
    pts.push(add(end, mul(dir, 0.32 + 0.45)));
  }
  const lo = [0, 1, 2].map((i) => Math.min(...pts.map((p) => p[i])));
  const hi = [0, 1, 2].map((i) => Math.max(...pts.map((p) => p[i])));
  const c: V3 = [(lo[0] + hi[0]) / 2, (lo[1] + hi[1]) / 2, (lo[2] + hi[2]) / 2];
  const r: V3 = [Math.max(0.3, (hi[0] - lo[0]) / 2 + 0.12), Math.max(0.3, (hi[1] - lo[1]) / 2 + 0.12), Math.max(0.3, (hi[2] - lo[2]) / 2 + 0.12)];
  return { c, r };
}

export function treeModel(pose: TreePose, o: TreeOpts = {}) {
  const fade = fader(o.dim);
  const items: Item3[] = [];
  const pts: Record<string, V3> = {};
  const bud = clamp01(pose.bud);
  const pr = clamp01(pose.primary);
  const sec = clamp01(pose.secondary);
  const ter = clamp01(pose.tertiary);
  const more = clamp01(pose.more);

  // The foregut (pharynx → oesophagus) behind, and its ventral outpouching.
  const gut = curve3([[0, 2.6, -0.25], [0, 1.5, -0.32], [0, 0.2, -0.36], [0, -0.8, -0.3]], 14);
  items.push({ key: 'foregut', id: 'aurreko-hestea', ...tube(gut, () => 0.16, 16), color: LC.gut, deep: LC.endoDeep, tissue: 'epithelium', opacity: 0.75 * fade('aurreko-hestea') });
  pts['aurreko-hestea'] = add(gut[9], [0.17, 0, -0.05]);
  const carina = lerp3([0, 1.92, 0.12], CARINA, bud);
  const tr = curve3([TOP, P1, lerp3(P1, carina, 0.5), carina], 14);
  const trId = bud > 0.6 ? 'trakea' : 'arnas-hastapena';
  items.push({ key: 'trachea', id: trId, groups: ['arnas-hastapena'], ...tube(tr, (u) => lerp(0.12, 0.1, u), 16), color: LC.resp, deep: LC.respDeep, tissue: 'epithelium', opacity: ss(0, 0.12, bud) * fade(trId, ['arnas-hastapena']) });
  pts[trId] = add(tr[8], [0.12, 0, 0.06]);
  pts['arnas-hastapena'] = add(tr[10], [0.12, 0, 0.06]);
  pts['laringea'] = add(tr[2], [0.13, 0, 0.06]);

  // The larynx and the C-shaped cartilages (open dorsally, towards the oesophagus).
  const cart = clamp01(pose.cartilage);
  if (cart > 0.01 && bud > 0.9) {
    const rings: Mesh[] = [];
    const hits: Mesh[] = [];
    for (let k = 0; k < 9; k++) {
      const y = lerp(1.82, 0.95, k / 8);
      const zc = lerp(0.1, 0.12, k / 8);
      // ~300° round the trachea, the gap dorsal (towards the oesophagus): a C.
      const arc = Array.from({ length: 13 }, (_, i): V3 => {
        const a = lerp(-0.83 * Math.PI, 0.83 * Math.PI, i / 12);
        return [0.135 * Math.sin(a), y, zc + 0.135 * Math.cos(a)];
      });
      const t = tube(arc, () => 0.022, 6);
      rings.push(t.mesh);
      hits.push(t.hit);
    }
    const m = cachedMesh('cRings', [r3(cart)], () => merge(rings));
    items.push({ key: 'cRings', id: 'kartilago-eraztunak', mesh: m, hit: merge(hits), color: LC.cartilage, deep: '#8aa0b4', tissue: 'cartilage', opacity: cart * fade('kartilago-eraztunak') });
    pts['kartilago-eraztunak'] = [0.15, 1.3, 0.18];
    items.push({ key: 'larynx', id: 'laringea', ...blobParts({ center: [0, 2.05, 0.05], radii: [0.2, 0.16, 0.17], rings: 10, sides: 14 }), color: mixHex(LC.resp, '#ffffff', 0.3), deep: LC.respDeep, tissue: 'cartilage', opacity: cart * fade('laringea') });
    pts['laringea'] = [0.2, 2.06, 0.08];
  }

  // The two lung buds → main bronchi.
  if (pr > 0.01) {
    const parts: Mesh[] = [];
    const hits: Mesh[] = [];
    const mains: Record<number, V3[]> = {};
    for (const s of [-1, 1] as const) {
      // The right main bronchus more vertical than the left.
      const b = branch(carina, [s * (s < 0 ? 0.55 : 0.8), -0.62, 0.02], s < 0 ? 0.42 : 0.5, pr);
      mains[s] = b;
      const t = tube(b, () => 0.085, 12);
      parts.push(t.mesh);
      hits.push(t.hit);
      pts[s < 0 ? 'eskuineko-bronkio-nagusia' : 'ezkerreko-bronkio-nagusia'] = add(b[5], [0, 0.08, 0.08]);
    }
    const id = sec > 0.3 ? 'bronkio-nagusiak' : 'birika-hastapenak';
    items.push({ key: 'mainBr', id, groups: ['bronkio-zuhaitza', 'birika-hastapenak'], mesh: merge(parts), hit: merge(hits), color: LC.resp, deep: LC.respDeep, tissue: 'epithelium', opacity: fade(id, ['bronkio-zuhaitza', 'birika-hastapenak']) });
    pts[id] = add(mains[1][6], [0.05, 0.1, 0.1]);
    pts['birika-hastapenak'] = add(mains[1][6], [0.05, 0.1, 0.1]);

    // Secondary (lobar) bronchi: 3 right, 2 left; tertiary (segmental) from each; then a few more generations.
    if (sec > 0.01) {
      const lob: Mesh[] = [];
      const lobH: Mesh[] = [];
      const seg: Mesh[] = [];
      const segH: Mesh[] = [];
      const fine: Mesh[] = [];
      const fineH: Mesh[] = [];
      const ends: { p: V3; d: V3; side: number; lobe: string }[] = [];
      for (const L of LOBAR) {
        const start = mains[L.side][mains[L.side].length - (L.lobe === 'goiko' ? 4 : 1)];
        const b = branch(start, L.dir, L.len, sec);
        const t = tube(b, () => 0.06, 10);
        lob.push(t.mesh);
        lobH.push(t.hit);
        const end = b[b.length - 1];
        if (ter > 0.01) {
          // Two to three segmental bronchi per lobar bronchus, fanned in the plane across it.
          const d = norm(L.dir);
          const side = norm(cross(d, [0, 0, 1]));
          const up = norm(cross(side, d));
          const n = L.lobe === 'erdiko' ? 2 : 3;
          for (let k = 0; k < n; k++) {
            const a = ((k - (n - 1) / 2) * 0.9) as number;
            const dir = add(mul(d, 1), add(mul(side, Math.sin(a) * 0.9), mul(up, Math.cos(a * 1.7) * 0.35 - 0.1)));
            const sb = branch(end, dir, 0.32, ter);
            const st = tube(sb, () => 0.04, 8);
            seg.push(st.mesh);
            segH.push(st.hit);
            ends.push({ p: sb[sb.length - 1], d: norm(dir), side: L.side, lobe: L.lobe });
          }
        }
        pts[`lobar-${L.side}-${L.lobe}`] = end;
      }
      items.push({ key: 'lobarBr', id: 'bronkio-lobarrak', groups: ['bronkio-zuhaitza'], mesh: merge(lob), hit: merge(lobH), color: LC.resp, deep: LC.respDeep, tissue: 'epithelium', opacity: fade('bronkio-lobarrak', ['bronkio-zuhaitza']) });
      pts['bronkio-lobarrak'] = add(pts['lobar--1-erdiko'], [0, 0.05, 0.08]);
      if (seg.length) {
        items.push({ key: 'segBr', id: 'bronkio-segmentarioak', groups: ['bronkio-zuhaitza'], mesh: merge(seg), hit: merge(segH), color: mixHex(LC.resp, '#ffffff', 0.15), deep: LC.respDeep, tissue: 'epithelium', opacity: fade('bronkio-segmentarioak', ['bronkio-zuhaitza']) });
        pts['bronkio-segmentarioak'] = add(ends[ends.length - 1].p, [0.03, 0.03, 0.06]);
      }
      // Further generations: dichotomous, each shorter, alternating planes (a handful of the ≈16).
      if (more > 0.01) {
        let tips = ends.map((e) => ({ p: e.p, d: e.d }));
        const levels = 4;
        for (let g = 0; g < levels; g++) {
          const grow = clamp01(more * levels - g);
          if (grow <= 0) break;
          const next: { p: V3; d: V3 }[] = [];
          for (const tip of tips) {
            const ax = norm(cross(tip.d, g % 2 ? [0, 1, 0] : [0, 0, 1]));
            for (const s of [-1, 1]) {
              const dir = norm(add(tip.d, mul(ax, 0.75 * s)));
              const len = 0.22 * Math.pow(0.78, g);
              const b = branch(tip.p, dir, len, grow);
              const t = tube(b, () => 0.026 * Math.pow(0.8, g), 6);
              fine.push(t.mesh);
              fineH.push(t.hit);
              next.push({ p: b[b.length - 1], d: dir });
            }
          }
          tips = next;
        }
        if (fine.length) {
          const m = cachedMesh('fineBr', [r3(more), r3(ter), r3(sec)], () => merge(fine));
          items.push({ key: 'fineBr', id: 'bronkio-zuhaitza', mesh: m, hit: merge(fineH.slice(0, 64)), color: mixHex(LC.resp, '#ffffff', 0.3), deep: LC.respDeep, tissue: 'epithelium', opacity: fade('bronkio-zuhaitza') });
          pts['bronkio-zuhaitza'] = add(tips[Math.floor(tips.length * 0.8)].p, [0, 0, 0.05]);
        }
      }
      // The lobes round their bronchi: 3 right, 2 left.
      const lobes = clamp01(pose.lobes);
      if (lobes > 0.01) {
        for (const L of LOBAR) {
          const { c, r } = lobeShape(mains[L.side], L);
          const id = L.side < 0 ? 'eskuineko-birika' : 'ezkerreko-birika';
          items.push({ key: `lobe${L.side}${L.lobe}`, id, groups: ['birikak'], ...blobParts({ center: c, radii: r, rings: 12, sides: 16 }), color: L.side < 0 ? LC.lobeR : LC.lobeL, deep: darker(LC.lobeR), tissue: 'epithelium', opacity: 0.28 * lobes * fade(id, ['birikak'], 0.6), thin: 0.6 });
          if (L.lobe === 'beheko') pts[id] = add(c, [L.side * r[0] * 0.8, r[1] * 0.3, 0.1]);
        }
      }
    }
  }
  return { items, pts };
}

// ———————————————————————————— the acinus (alveoli) ————————————————————————————

export interface AcinusPose {
  /** Respiratory bronchioles (16–28 weeks). */
  resp: number;
  /** Terminal sacs, the primitive alveoli (28–36). */
  sacs: number;
  /** Capillaries (splanchnic mesoderm) in contact with the sacs (36). */
  caps: number;
  /** Type I and type II pneumocytes shown. */
  pneumo: number;
  /** Surfactant (type II cells, month 7 on). */
  surf: number;
  /** Maturation: thinner type I cells, capillaries bulging into the alveoli (36 weeks → 2–3 years). */
  mature: number;
  /** Fluid in the alveoli (at birth), then cleared. */
  fluid: number;
}

export const AP0: AcinusPose = { resp: 0, sacs: 0, caps: 0, pneumo: 0, surf: 0, mature: 0, fluid: 0 };

export interface AcinusOpts {
  dim?: Dim;
}

/** The sacs' places: at the ends of the respiratory bronchioles (deterministic). */
const RB: { dir: V3; len: number }[] = [
  { dir: [-0.8, -0.6, 0.1], len: 0.7 },
  { dir: [0.75, -0.65, 0.15], len: 0.72 },
  { dir: [0.05, -1, 0.35], len: 0.62 },
];

export function acinusModel(pose: AcinusPose, o: AcinusOpts = {}) {
  const fade = fader(o.dim);
  const items: Item3[] = [];
  const pts: Record<string, V3> = {};
  const rb = clamp01(pose.resp);
  const sc = clamp01(pose.sacs);
  const cp = clamp01(pose.caps);
  const pn = clamp01(pose.pneumo);
  const sf = clamp01(pose.surf);
  const mt = clamp01(pose.mature);
  const fl = clamp01(pose.fluid);

  // The terminal bronchiole (no cartilage).
  const top: V3 = [0, 1.9, 0];
  const fork: V3 = [0, 0.75, 0];
  const tb = curve3([top, [0, 1.3, 0.02], fork], 10);
  items.push({ key: 'termBr', id: 'bukaerazko-bronkioloa', ...tube(tb, () => 0.11, 14), color: LC.resp, deep: LC.respDeep, tissue: 'epithelium', opacity: fade('bukaerazko-bronkioloa') });
  pts['bukaerazko-bronkioloa'] = add(tb[4], [0.12, 0, 0.05]);

  const sacCentres: V3[] = [];
  if (rb > 0.01) {
    const parts: Mesh[] = [];
    const hits: Mesh[] = [];
    const buds: Mesh[] = [];
    RB.forEach((r, i) => {
      const b = curve3([fork, add(fork, mul(norm(r.dir), r.len * 0.5 * rb)), add(fork, mul(norm(r.dir), r.len * rb))], 10);
      const t = tube(b, () => 0.07, 12);
      parts.push(t.mesh);
      hits.push(t.hit);
      // A few alveoli already bud from their walls (that is what makes them "respiratory").
      for (let k = 1; k <= 2; k++) {
        const p = b[Math.round((b.length - 1) * (0.35 + 0.3 * k * 0.5))];
        const side = norm(cross(norm(r.dir), [0, 0, 1]));
        buds.push(blobParts({ center: add(p, mul(side, 0.08 * (k % 2 ? 1 : -1))), radii: [0.06 * rb, 0.06 * rb, 0.06 * rb], rings: 8, sides: 10 }).mesh);
      }
      sacCentres.push(b[b.length - 1]);
      if (i === 1) pts['arnas-bronkioloak'] = add(b[5], [0.05, 0.08, 0.1]);
    });
    items.push({ key: 'respBr', id: 'arnas-bronkioloak', mesh: merge([...parts, ...buds]), hit: merge(hits), color: mixHex(LC.resp, '#ffffff', 0.2), deep: LC.respDeep, tissue: 'epithelium', opacity: fade('arnas-bronkioloak') });
  }

  // The terminal sacs: clusters of thin-walled bulges at each respiratory bronchiole's end.
  const sacBalls: V3[] = [];
  if (sc > 0.01) {
    const parts: Mesh[] = [];
    const hits: Mesh[] = [];
    const wall = lerp(0.62, 0.42, mt);
    sacCentres.forEach((c, i) => {
      const d = norm(RB[i].dir);
      const u = norm(cross(d, [0, 0, 1]));
      const v = norm(cross(u, d));
      for (let k = 0; k < 6; k++) {
        const a = (k / 6) * Math.PI * 2;
        const p = add(add(c, mul(d, 0.22)), add(mul(u, 0.2 * Math.cos(a)), mul(v, 0.2 * Math.sin(a))));
        const r = 0.16 * sc;
        sacBalls.push(p);
        const b = blobParts({ center: p, radii: [r, r, r], rings: 10, sides: 12 });
        parts.push(b.mesh);
        hits.push(b.hit);
      }
    });
    const m = cachedMesh('sacs', [r3(sc), r3(rb)], () => merge(parts));
    items.push({ key: 'sacs', id: 'bukaerazko-zakuak', groups: ['albeoloak'], mesh: m, hit: merge(hits), color: mixHex(LC.pneumo1, LC.lobeR, 0.4), deep: darker(LC.lobeR), tissue: 'membrane', opacity: wall * fade('bukaerazko-zakuak', ['albeoloak']), thin: 0.8 });
    pts['bukaerazko-zakuak'] = add(sacBalls[7], [0.1, 0.05, 0.16]);
    pts['albeoloak'] = add(sacBalls[4], [0.08, 0.05, 0.16]);
  }

  // The capillaries of the splanchnic (visceral) mesoderm, wrapping the sacs; bulging in as they mature.
  if (cp > 0.01 && sacBalls.length) {
    const parts: Mesh[] = [];
    const hits: Mesh[] = [];
    sacBalls.forEach((c, i) => {
      if (i % 2) return;
      const ring = Array.from({ length: 13 }, (_, k): V3 => {
        const a = (k / 12) * Math.PI * 2 * cp;
        const r = lerp(0.19, 0.165, mt);
        return add(c, [r * Math.cos(a), r * Math.sin(a) * 0.6, r * Math.sin(a) * 0.8]);
      });
      const t = tube(ring, () => 0.022, 6);
      parts.push(t.mesh);
      hits.push(t.hit);
    });
    items.push({ key: 'caps', id: 'kapilarrak', mesh: merge(parts), hit: merge(hits), color: LC.capO2, deep: darker(LC.capO2), tissue: 'vessel', opacity: cp * fade('kapilarrak') });
    pts['kapilarrak'] = add(sacBalls[0], [0.2, 0, 0.05]);
  }

  // Pneumocytes on one sac (shown large): type I flat and wide, type II cuboidal with surfactant granules.
  if (pn > 0.01 && sacBalls.length) {
    const c = sacBalls[9] ?? sacBalls[0];
    const p1: Mesh[] = [];
    const p2: Mesh[] = [];
    for (let k = 0; k < 5; k++) {
      const a = (k / 5) * Math.PI * 2;
      const n: V3 = norm([Math.cos(a), Math.sin(a) * 0.5, 0.7]);
      const at = add(c, mul(n, 0.155));
      p1.push(blobParts({ center: at, radii: [0.07, 0.07, lerp(0.022, 0.01, mt)], axes: frame(n), rings: 6, sides: 10 }).mesh);
    }
    for (let k = 0; k < 2; k++) {
      const n: V3 = norm([k ? -0.6 : 0.6, 0.6, 0.5]);
      p2.push(blobParts({ center: add(c, mul(n, 0.14)), radii: [0.04, 0.04, 0.04], rings: 6, sides: 8 }).mesh);
    }
    items.push({ key: 'pn1', id: 'pneumozitoak-1', groups: ['pneumozitoak'], mesh: merge(p1), color: LC.pneumo1, deep: darker(LC.pneumo1), tissue: 'epithelium', opacity: pn * fade('pneumozitoak-1', ['pneumozitoak']) });
    items.push({ key: 'pn2', id: 'pneumozitoak-2', groups: ['pneumozitoak'], mesh: merge(p2), color: LC.pneumo2, deep: darker(LC.pneumo2), tissue: 'epithelium', opacity: pn * fade('pneumozitoak-2', ['pneumozitoak']) });
    pts['pneumozitoak-1'] = add(c, mul(norm([1, 0, 0.7]), 0.2));
    pts['pneumozitoak-2'] = add(c, mul(norm([0.6, 0.6, 0.5]), 0.2));
    pts['pneumozitoak'] = pts['pneumozitoak-1'];
    if (sf > 0.01) {
      const dots: Mesh[] = [];
      for (let k = 0; k < 10; k++) {
        const a = k * 2.399;
        const n: V3 = norm([Math.cos(a) * 0.8, Math.sin(a) * 0.8, 0.5]);
        dots.push(blobParts({ center: add(c, mul(n, 0.11)), radii: [0.018, 0.018, 0.018], rings: 4, sides: 6 }).mesh);
      }
      items.push({ key: 'surf', id: 'surfaktantea', mesh: merge(dots), color: LC.surf, deep: darker(LC.surf), tissue: 'epithelium', opacity: sf * fade('surfaktantea') });
      pts['surfaktantea'] = add(c, [0, 0, 0.12]);
    }
  }

  // The fluid filling the alveoli at birth (cleared after; surfactant stays).
  if (fl > 0.01 && sacBalls.length) {
    const parts: Mesh[] = sacBalls.map((c) => blobParts({ center: c, radii: [0.12, 0.12, 0.12], rings: 8, sides: 10 }).mesh);
    items.push({ key: 'fluid', id: 'albeoloetako-likidoa', mesh: merge(parts), color: LC.fluid, deep: darker(LC.fluid), tissue: 'membrane', opacity: 0.55 * fl * fade('albeoloetako-likidoa'), thin: 0.8 });
    pts['albeoloetako-likidoa'] = add(sacBalls[2], [0.05, 0, 0.12]);
  }
  return { items, pts };
}

/** Axes with the third along n (for flat cells lying on a surface). */
function frame(n: V3): [V3, V3, V3] {
  const a = norm(cross(n, Math.abs(n[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0]));
  const b = norm(cross(n, a));
  return [a, b, n];
}
