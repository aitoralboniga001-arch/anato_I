import { mix3, type V3 } from '@/lib/three-d/math';
import { grid, merge, type Mesh } from '@/lib/three-d/mesh';
import { cachedMesh } from '@/lib/three-d/mesh-cache';
import type { Item3 } from '@/lib/three-d/scene';
import { T } from '@/components/scenes/week10/common';
import { mixHex, tubeParts } from '@/components/scenes/week10/model3d';
import { K } from './common';

/**
 * M4 of topic 11 (notes 5): the outflow, from the ventricles' roof up: the arterial conus, then the
 * truncus. It sits on canal3d.ts's ventricles (same axes: x = the embryo's left, y = cranial, z = ventral).
 * Inside the conus two ridges grow from its side walls, one dorsal-right and one ventral-left (notes 5.1
 * p5 s2), and fuse into an oblique septum: a plate whose line across the lumen turns a little from the
 * conus's base to its top (the start of the spiral the truncus continues). The space in front and to the
 * right of it is the right ventricle's infundibulum (the pulmonary way), the one behind and to the left
 * the left ventricle's (the aortic way). Its lower end comes down as the membranous IV septum.
 */

const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
const q = (v: number) => Math.round(v * 200) / 200;

/** The conus lumen's radius and wall. */
export const CONUS_R = 0.34;
const WALL = 0.07;
/** Its height above the roof, and the depth (z) of its root. */
const HEIGHT = 0.95;
export const CONUS_Z = -0.05;

export interface OutflowState {
  /** The conus's root across x (over the right ventricle, then over the septum). */
  x: number;
  /** The roof's height at the root. */
  roof: number;
  /** The two ridges (0 none, 1 meeting in the middle) and the septum they fuse into. */
  ridges: number;
  fuse: number;
  /** The conus wall seen through, and the truncus left out (the conus cut across at its top). */
  glass: number;
  cut: number;
}

/** The plate's turn across the lumen at height u (degrees from the sagittal plane, towards the left in front). */
const thetaAt = (u: number) => lerp(15, 50, u);

export interface Conus {
  /** The centreline at u (0 root, 1 top). */
  at: (u: number) => V3;
  /** The septum line's direction at u (its ventral-left end), and the normal pointing to the left-dorsal side. */
  e: (u: number) => V3;
  n: (u: number) => V3;
  top: V3;
}

export function conusFrame(o: Pick<OutflowState, 'x' | 'roof'>): Conus {
  const base: V3 = [o.x, o.roof - 0.03, CONUS_Z];
  const top: V3 = [o.x + 0.06, o.roof + HEIGHT, CONUS_Z + 0.16];
  const at = (u: number) => mix3(base, top, u);
  const e = (u: number): V3 => {
    const t = (thetaAt(u) * Math.PI) / 180;
    return [Math.sin(t), 0, Math.cos(t)];
  };
  const n = (u: number): V3 => {
    const t = (thetaAt(u) * Math.PI) / 180;
    return [Math.cos(t), 0, -Math.sin(t)];
  };
  return { at, e, n, top };
}

const ring = (c: V3, r: number, a: number): V3 => [c[0] + r * Math.cos(a), c[1], c[2] + r * Math.sin(a)];

function flipped(m: Mesh): Mesh {
  const idx = new Uint32Array(m.idx.length);
  for (let i = 0; i < idx.length; i += 3) {
    idx[i] = m.idx[i];
    idx[i + 1] = m.idx[i + 2];
    idx[i + 2] = m.idx[i + 1];
  }
  return { ...m, idx, nrm: m.nrm.map((v) => -v) };
}

export function outflowParts(o: OutflowState, items: Item3[], pts: Record<string, V3>) {
  const F = conusFrame(o);
  const dep = [q(o.x), q(o.roof)];
  const glassOp = o.glass > 0.01 ? { opacity: 1 - 0.74 * clamp01(o.glass) } : {};
  // —— the conus wall (outside and inside), its top cut across when the truncus is left out ——
  const wall = (r: number, coarse: number) =>
    grid(Math.round(28 / coarse), Math.round(8 / coarse), (u, v) => ring(F.at(v), r, u * Math.PI * 2));
  const outer = cachedMesh('conus outer', dep, () => orient(wall(CONUS_R + WALL, 1), F, true));
  const inner = cachedMesh('conus inner', dep, () => orient(wall(CONUS_R, 1), F, false));
  const tone = { color: T.conus, deep: '#4d6a12', tissue: 'muscle' as const };
  items.push({ key: 'conus', id: 'arteria-konoa', groups: ['atal-bulbarra'], mesh: outer, hit: cachedMesh('conus hit', dep, () => orient(wall(CONUS_R + WALL, 3), F, true)), ...tone, ...glassOp });
  if (o.fuse > 0.5 && o.ridges > 0.01) {
    // Divided: each half of the lumen is an infundibulum, the right one in front, the left one behind.
    const half = (right: boolean) => cachedMesh('conus half', [...dep, right ? 1 : 0], () =>
      orient(grid(16, 8, (w, v) => {
        const e = F.e(v);
        const a0 = Math.atan2(e[2], e[0]) + (right ? 0 : Math.PI);
        return ring(F.at(v), CONUS_R, a0 + w * Math.PI);
      }), F, false));
    items.push({ key: 'conus-in-r', id: 'eskuineko-infundibulua', groups: ['infundibuluak', 'arteria-konoa'], mesh: half(true), color: mixHex('#9ccc3c', '#1d2a08', 0.25), deep: '#3a500e', tissue: 'muscle', outline: false, ...glassOp });
    items.push({ key: 'conus-in-l', id: 'ezkerreko-infundibulua', groups: ['infundibuluak', 'arteria-konoa'], mesh: half(false), color: mixHex('#b9dc6e', '#1d2a08', 0.25), deep: '#3a500e', tissue: 'muscle', outline: false, ...glassOp });
  } else {
    items.push({ key: 'conus-in', id: 'arteria-konoa', groups: ['atal-bulbarra', 'infundibuluak'], mesh: inner, color: mixHex(T.conus, '#1d2a08', 0.3), deep: '#3a500e', tissue: 'muscle', outline: false, ...glassOp });
  }
  pts['arteria-konoa'] = ring(F.at(0.55), CONUS_R + WALL, Math.PI * 0.62);
  if (o.cut > 0.5) {
    const lip = cachedMesh('conus lip', dep, () => grid(36, 2, (u, v) => ring(F.top, lerp(CONUS_R, CONUS_R + WALL, v), u * Math.PI * 2), [F.top[0], F.top[1] + 9, F.top[2]]));
    items.push({ key: 'conus-lip', id: 'arteria-konoa', mesh: lip, color: mixHex(T.conus, '#ffffff', 0.25), deep: '#4d6a12', tissue: 'muscle', outline: false });
  } else {
    // The truncus above (topic 10's ivory), simple until its own septum is built.
    const tr = tubeParts([F.top, [F.top[0] + 0.06, F.top[1] + 0.45, F.top[2] + 0.1], [F.top[0] + 0.22, F.top[1] + 0.88, F.top[2] + 0.08]], { radius: (u) => lerp(CONUS_R + WALL, 0.27, u), ref: [1, 0, 0], sides: 20, capEnd: true });
    items.push({ key: 'truncus', id: 'enbor-arteriosoa', groups: ['atal-bulbarra'], ...tr, color: '#efe6cf', deep: '#8a7a55', tissue: 'muscle', ...glassOp });
    pts['enbor-arteriosoa'] = [F.top[0] + 0.06 - 0.28, F.top[1] + 0.5, F.top[2] + 0.1];
  }
  // —— its way out of the ventricles: a dark mouth in the inner roof ——
  const mouth = cachedMesh('conus mouth', dep, () => grid(6, 28, (r, a) => ring([o.x, o.roof - 0.012, CONUS_Z], CONUS_R * r, a * Math.PI * 2), [o.x, o.roof - 9, CONUS_Z]));
  items.push({ key: 'mouth', id: 'arteria-konoa', mesh: mouth, color: '#12070c', deep: '#000000', tissue: 'vessel', outline: false });

  // —— the ridges: dorsal-right and ventral-left, along the whole conus; then the septum they make ——
  if (o.ridges > 0.01) {
    const h = clamp01(o.ridges) * CONUS_R;
    const fused = o.fuse > 0.5;
    const ridgeTone = { color: K.cushion, deep: K.cushionDeep, tissue: 'mesenchyme' as const };
    if (!fused) {
      const ridge = (sign: 1 | -1) => (coarse: number) =>
        grid(Math.round(16 / coarse), Math.round(12 / coarse), (a, u) => {
          const s = lerp(-Math.PI / 2, Math.PI / 2, a);
          const e = F.e(u);
          const n = F.n(u);
          const d = CONUS_R + 0.01 - h * Math.cos(s);
          const w = lerp(0.16, 0.09, clamp01(o.ridges)) * Math.sin(s);
          const c = F.at(u);
          return [c[0] + sign * e[0] * d + n[0] * w, c[1], c[2] + sign * e[2] * d + n[2] * w];
        }, F.at(0.5));
      const dr = [q(h), ...dep];
      const both = (coarse: number) => merge([ridge(1)(coarse), ridge(-1)(coarse)]);
      items.push({ key: 'conus-ridges', id: 'konoaren-gandorrak', groups: ['endokardio-kuxinak'], mesh: cachedMesh('conus ridges', dr, () => both(1)), hit: cachedMesh('conus ridges hit', dr, () => both(3)), ...ridgeTone });
      // Cut across at the top: each ridge's section, seen from above.
      if (o.cut > 0.5) {
        const cap = (sign: 1 | -1) =>
          grid(16, 2, (a, k) => {
            const s = lerp(-Math.PI / 2, Math.PI / 2, a);
            const e = F.e(1);
            const n = F.n(1);
            const d = CONUS_R + 0.01 - h * Math.cos(s) * k;
            const w = lerp(0.16, 0.09, clamp01(o.ridges)) * Math.sin(s);
            return [F.top[0] + sign * e[0] * d + n[0] * w, F.top[1] + 0.004, F.top[2] + sign * e[2] * d + n[2] * w];
          }, [F.top[0], F.top[1] + 9, F.top[2]]);
        items.push({ key: 'conus-ridge-caps', groups: ['konoaren-gandorrak'], mesh: cachedMesh('conus ridge caps', dr, () => merge([cap(1), cap(-1)])), color: mixHex(K.cushion, '#ffffff', 0.25), deep: K.cushionDeep, tissue: 'mesenchyme', outline: false });
      }
      const u = 0.62;
      const e = F.e(u);
      const c = F.at(u);
      // The dorsal-right one (behind on the right) and the ventral-left one: each named where it is.
      pts['konoaren-gandorrak'] = [c[0] - e[0] * (CONUS_R - h * 0.5), c[1], c[2] - e[2] * (CONUS_R - h * 0.5)];
      pts['konoaren-gandorra-aurre-ezker'] = [c[0] + e[0] * (CONUS_R - h * 0.5), c[1], c[2] + e[2] * (CONUS_R - h * 0.5)];
    } else {
      // The septum: a plate across the lumen, turning with u, a little thick.
      const plate = (side: 1 | -1) =>
        grid(14, 10, (v, u) => {
          const c = F.at(u);
          const e = F.e(u);
          const n = F.n(u);
          const r = lerp(-1, 1, v) * (CONUS_R + 0.005);
          return [c[0] + e[0] * r + side * n[0] * 0.035, c[1], c[2] + e[2] * r + side * n[2] * 0.035];
        });
      const m = cachedMesh('conus septum', dep, () => merge([orientTo(plate(1), F, 1), orientTo(plate(-1), F, -1)]));
      items.push({ key: 'conus-septum', id: 'konoaren-trenkada', mesh: m, ...ridgeTone });
      if (o.cut > 0.5) {
        const e = F.e(1);
        const n = F.n(1);
        const cap = grid(14, 2, (v, k) => {
          const r = lerp(-1, 1, v) * (CONUS_R + 0.005);
          const side = lerp(-0.035, 0.035, k);
          return [F.top[0] + e[0] * r + n[0] * side, F.top[1] + 0.004, F.top[2] + e[2] * r + n[2] * side];
        }, [F.top[0], F.top[1] + 9, F.top[2]]);
        items.push({ key: 'conus-septum-cap', groups: ['konoaren-trenkada'], mesh: cachedMesh('conus septum cap', dep, () => cap), color: mixHex(K.cushion, '#ffffff', 0.25), deep: K.cushionDeep, tissue: 'mesenchyme', outline: false });
      }
      const c = F.at(0.6);
      pts['konoaren-trenkada'] = [c[0], c[1], c[2]];
      // The two spaces it leaves: in front and right (the right ventricle's), behind and left (the left's).
      const nR = F.n(0.45);
      const cR = F.at(0.45);
      pts['eskuineko-infundibulua'] = [cR[0] - nR[0] * CONUS_R * 0.55, cR[1], cR[2] - nR[2] * CONUS_R * 0.55];
      pts['ezkerreko-infundibulua'] = [cR[0] + nR[0] * CONUS_R * 0.55, cR[1], cR[2] + nR[2] * CONUS_R * 0.55];
    }
  }
  return F;
}

/** Turn a wall's triangles to face out (`out`) or in (towards the centreline). */
function orient(m: Mesh, F: Conus, out: boolean): Mesh {
  // The patch's middle normal against the way to the axis at the same height.
  const i = Math.floor(m.pos.length / 6) * 3;
  const p: V3 = [m.pos[i], m.pos[i + 1], m.pos[i + 2]];
  const n: V3 = [m.nrm[i], m.nrm[i + 1], m.nrm[i + 2]];
  const c = F.at(0.5);
  const toAxis = (p[0] - c[0]) * n[0] + (p[2] - c[2]) * n[2];
  // toAxis > 0: the normal points away from the axis (outward).
  return (toAxis > 0) === out ? m : flipped(m);
}

/** Turn a plate's triangles to face its own side (+n or −n). */
function orientTo(m: Mesh, F: Conus, side: 1 | -1): Mesh {
  const i = Math.floor(m.pos.length / 6) * 3;
  const n: V3 = [m.nrm[i], m.nrm[i + 1], m.nrm[i + 2]];
  const want = F.n(0.5);
  const d = n[0] * want[0] + n[2] * want[2];
  return (d > 0) === (side > 0) ? m : flipped(m);
}

/** Routes up the conus: one along its middle, or one in each infundibulum once it is divided. */
export function outflowRoutes(F: Conus, split: number): { mid: V3[]; right: V3[]; left: V3[] } {
  const up = (k: number) => [0, 0.25, 0.5, 0.75, 1].map((u) => {
    const c = F.at(u);
    const n = F.n(u);
    const r = k * CONUS_R * 0.5 * split;
    return [c[0] + n[0] * r, c[1], c[2] + n[2] * r] as V3;
  });
  const exit: V3 = [F.top[0] + 0.1, F.top[1] + 0.6, F.top[2] + 0.1];
  return { mid: [...up(0), exit], right: [...up(-1), exit], left: [...up(1), exit] };
}
