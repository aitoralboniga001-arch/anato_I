import { mix3, type V3 } from '@/lib/three-d/math';
import { grid, merge, type Mesh } from '@/lib/three-d/mesh';
import { cachedMerge, cachedMesh } from '@/lib/three-d/mesh-cache';
import type { Item3 } from '@/lib/three-d/scene';
import { blobParts, mixHex, tubeParts } from '@/components/scenes/week10/model3d';
import { K } from './common';

/**
 * M4's upper half (notes 5.2): the truncus arteriosus on top of the conus (outflow3d.ts), its spiral
 * aorticopulmonary septum, the two vessels it leaves, their semilunar valves and the coronary arteries.
 * - The septum is a plate across the lumen whose line turns with height, carrying on the conus septum's turn
 *   (50° at the truncus base, 220° more by its top). With the heart turned 18° as these stages keep it
 *   (canal3d.ts), the body sees it at 90° at the proximal level (transverse: the pulmonary way in front, the
 *   aortic behind), 180° in the middle (front to back: the aorta on the right), 270° at the distal level
 *   (transverse again: the aorta in front). So each way winds half a turn round the other (notes 5.2 p4–p6).
 * - Its two ridges grow along the walls where the plate will meet them, and fuse.
 * - Cut across at a level, the truncus shows that level's section from above; the rest of it stays faint.
 * - Once divided, it can be shown as the two vessels it gives, each round, twisted round each other.
 * Axes as the other heart models: x = the embryo's left, y = cranial, z = ventral.
 */

const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
const q = (v: number) => Math.round(v * 200) / 200;

export const TRUNCUS_R = 0.34;
const WALL = 0.065;
/** The three levels of the notes (u along the truncus): proximal, middle, distal (the body's 90°, 180°, 270°). */
export const LEVELS = [0.1, 0.51, 0.92] as const;
const IVORY = '#efe6cf';
const IVORY_DEEP = '#8a7a55';
/** The two ways, by their blood (the aortic one from the left ventricle, the pulmonary from the right). */
const AORTA = '#d9485a';
const PULM = '#4a78d8';

export interface TruncusState {
  ridges: number;
  fuse: number;
  /** Cut across at u (1: whole); above the cut it is faint. */
  cut: number;
  glass: number;
  /** The two vessels apart (round, twisted round each other) instead of one divided tube. */
  split: number;
  /** Semilunar valves: tubercles at each root, hollowed from above into cusps. */
  tubercles: number;
  hollow: number;
  /** Coronary arteries growing out of the aorta's right and left sinuses. */
  coronaries: number;
}
export const TR0: TruncusState = { ridges: 0, fuse: 0, cut: 1, glass: 0, split: 0, tubercles: 0, hollow: 0, coronaries: 0 };

export interface Truncus {
  at: (u: number) => V3;
  /** Degrees: the septum line's turn at u. */
  theta: (u: number) => number;
  e: (u: number) => V3;
  /** Towards the aortic way (the left ventricle's side at the base). */
  n: (u: number) => V3;
  top: V3;
}

export function truncusFrame(base: V3): Truncus {
  const top: V3 = [base[0] + 0.1, base[1] + 1.5, base[2] + 0.06];
  const theta = (u: number) => 50 + 220 * u;
  const rad = (u: number) => (theta(u) * Math.PI) / 180;
  return {
    at: (u) => mix3(base, top, u),
    theta,
    e: (u) => [Math.sin(rad(u)), 0, Math.cos(rad(u))],
    n: (u) => [Math.cos(rad(u)), 0, -Math.sin(rad(u))],
    top,
  };
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
const twoSided = (m: Mesh) => merge([m, flipped(m)]);

/** A wall round a path (horizontal rings), facing out or in. */
function wallOf(path: (u: number) => V3, r: number, u0: number, u1: number, out: boolean, a0 = 0, a1 = Math.PI * 2, nu = 30, nv = 10): Mesh {
  const m = grid(nu, nv, (w, v) => ring(path(lerp(u0, u1, v)), r, lerp(a0, a1, w)));
  // The middle normal against the way out from the axis.
  const i = (Math.floor(nu / 2) * (nv + 1) + Math.floor(nv / 2)) * 3;
  const p: V3 = [m.pos[i], m.pos[i + 1], m.pos[i + 2]];
  const c = path(lerp(u0, u1, 0.5));
  const away = (p[0] - c[0]) * m.nrm[i] + (p[2] - c[2]) * m.nrm[i + 2];
  return (away > 0) === out ? m : flipped(m);
}

/** A flat ring (lip) at a level, facing up. */
const lipAt = (c: V3, r0: number, r1: number) => grid(36, 2, (w, v) => ring(c, lerp(r0, r1, v), w * Math.PI * 2), [c[0], c[1] + 9, c[2]]);

export function truncusParts(base: V3, s: TruncusState, items: Item3[], pts: Record<string, V3>): Truncus {
  const F = truncusFrame(base);
  const dep = [q(base[0]), q(base[1]), q(base[2])];
  const cut = clamp01(s.cut);
  const whole = cut > 0.995;
  const split = clamp01(s.split);
  const one = 1 - split;
  const glassOp = (k = 1) => ({ opacity: k * (1 - 0.72 * clamp01(s.glass)) });
  const fused = s.fuse > 0.5 && s.ridges > 0.01;
  pts['truncus-base'] = base;
  pts['truncus-top'] = F.top;

  if (one > 0.01) {
    // —— one tube: its wall, its lumen (each half its way's colour once divided), faint above a cut ——
    const show = one;
    const outer = cachedMesh('truncus outer', [...dep, q(cut)], () => wallOf(F.at, TRUNCUS_R + WALL, 0, cut, true));
    items.push({ key: 'truncus', id: 'enbor-arteriosoa', groups: ['atal-bulbarra'], mesh: outer, color: IVORY, deep: IVORY_DEEP, tissue: 'muscle', show, ...glassOp() });
    if (!whole) {
      const above = cachedMesh('truncus above', [...dep, q(cut)], () => wallOf(F.at, TRUNCUS_R + WALL, cut, 1, true, 0, Math.PI * 2, 24, 8));
      items.push({ key: 'truncus-above', mesh: above, color: IVORY, deep: IVORY_DEEP, tissue: 'membrane', thin: 1, opacity: 0.12 * show, outline: false });
      const lip = cachedMesh('truncus lip', [...dep, q(cut)], () => lipAt(F.at(cut), TRUNCUS_R, TRUNCUS_R + WALL));
      items.push({ key: 'truncus-lip', groups: ['enbor-arteriosoa'], mesh: lip, color: mixHex(IVORY, '#ffffff', 0.3), deep: IVORY_DEEP, tissue: 'muscle', outline: false, show });
    }
    if (fused) {
      const half = (aortic: boolean) => cachedMesh('truncus half', [...dep, q(cut), aortic ? 1 : 0], () => {
        const parts: Mesh[] = [];
        // Thin bands up the tube, each following the septum's turn.
        const N = 14;
        for (let k = 0; k < N; k++) {
          const u0 = (cut * k) / N;
          const u1 = (cut * (k + 1)) / N;
          const um = (u0 + u1) / 2;
          const e = F.e(um);
          const a0 = Math.atan2(e[2], e[0]) + (aortic ? Math.PI : 0);
          parts.push(wallOf(F.at, TRUNCUS_R, u0, u1, false, a0, a0 + Math.PI, 14, 1));
        }
        return merge(parts);
      });
      items.push({ key: 'truncus-in-a', id: 'aorta', mesh: half(true), color: mixHex(AORTA, IVORY, 0.2), deep: '#5a1a22', tissue: 'vessel', outline: false, show, ...glassOp() });
      items.push({ key: 'truncus-in-p', id: 'birika-arteria', mesh: half(false), color: mixHex(PULM, IVORY, 0.2), deep: '#1a2a5a', tissue: 'vessel', outline: false, show, ...glassOp() });
    } else {
      const inner = cachedMesh('truncus inner', [...dep, q(cut)], () => wallOf(F.at, TRUNCUS_R, 0, cut, false));
      items.push({ key: 'truncus-in', id: 'enbor-arteriosoa', mesh: inner, color: mixHex(IVORY, '#2a2418', 0.3), deep: IVORY_DEEP, tissue: 'muscle', outline: false, show, ...glassOp() });
    }
    pts['enbor-arteriosoa'] = ring(F.at(0.5), TRUNCUS_R + WALL, Math.PI * 0.75);

    // —— the ridges, then the spiral septum ——
    if (s.ridges > 0.01) {
      const h = clamp01(s.ridges) * TRUNCUS_R;
      const tone = { color: K.cushion, deep: K.cushionDeep, tissue: 'mesenchyme' as const };
      const capTone = { color: mixHex(K.cushion, '#ffffff', 0.25), deep: K.cushionDeep, tissue: 'mesenchyme' as const, outline: false };
      if (!fused) {
        const w = lerp(0.15, 0.09, clamp01(s.ridges));
        const point = (sign: 1 | -1, a: number, u: number, k = 1): V3 => {
          const sa = lerp(-Math.PI / 2, Math.PI / 2, a);
          const e = F.e(u);
          const n = F.n(u);
          const c = F.at(u);
          const d = TRUNCUS_R + 0.01 - h * Math.cos(sa) * k;
          return [c[0] + sign * e[0] * d + n[0] * w * Math.sin(sa), c[1], c[2] + sign * e[2] * d + n[2] * w * Math.sin(sa)];
        };
        const ridge = (sign: 1 | -1, coarse: number) => grid(Math.round(14 / coarse), Math.round(30 / coarse), (a, u) => point(sign, a, u * cut), F.at(cut / 2));
        const dr = [...dep, q(h), q(cut)];
        items.push({ key: 'truncus-ridges', id: 'enborraren-gandorrak', groups: ['endokardio-kuxinak'], mesh: cachedMesh('truncus ridges', dr, () => merge([ridge(1, 1), ridge(-1, 1)])), hit: cachedMesh('truncus ridges hit', dr, () => merge([ridge(1, 3), ridge(-1, 3)])), ...tone, show });
        if (!whole) {
          const cap = (sign: 1 | -1) => grid(14, 2, (a, k) => {
            const p = point(sign, a, cut, k);
            return [p[0], p[1] + 0.004, p[2]] as V3;
          }, [0, 99, 0]);
          items.push({ key: 'truncus-ridge-caps', groups: ['enborraren-gandorrak'], mesh: cachedMesh('truncus ridge caps', dr, () => merge([cap(1), cap(-1)])), ...capTone, show });
        }
        // One ridge named low on its wall, the other high on its own: each winds up the tube.
        pts['enborraren-gandorrak'] = point(1, 0.5, 0.3 * cut, 0.6);
        pts['enborraren-gandorrak-2'] = point(-1, 0.5, 0.75 * cut, 0.6);
      } else {
        const plate = (side: 1 | -1) => {
          const m = grid(12, 30, (v, u) => {
            const uu = u * cut;
            const c = F.at(uu);
            const e = F.e(uu);
            const n = F.n(uu);
            const r = lerp(-1, 1, v) * (TRUNCUS_R + 0.004);
            return [c[0] + e[0] * r + side * n[0] * 0.035, c[1], c[2] + e[2] * r + side * n[2] * 0.035];
          });
          const i = Math.floor(m.pos.length / 6) * 3;
          const nn = F.n(cut / 2);
          const d = m.nrm[i] * nn[0] + m.nrm[i + 2] * nn[2];
          return (d > 0) === (side > 0) ? m : flipped(m);
        };
        items.push({ key: 'truncus-septum', id: 'trenkada-aortikopulmonarra', groups: ['enborraren-gandorrak', 'endokardio-kuxinak'], mesh: cachedMesh('truncus septum', [...dep, q(cut)], () => merge([plate(1), plate(-1)])), ...tone, show });
        if (!whole) {
          const e = F.e(cut);
          const n = F.n(cut);
          const c = F.at(cut);
          const cap = grid(14, 2, (v, k) => {
            const r = lerp(-1, 1, v) * (TRUNCUS_R + 0.004);
            const side = lerp(-0.035, 0.035, k);
            return [c[0] + e[0] * r + n[0] * side, c[1] + 0.004, c[2] + e[2] * r + n[2] * side];
          }, [c[0], c[1] + 9, c[2]]);
          items.push({ key: 'truncus-septum-cap', groups: ['trenkada-aortikopulmonarra'], mesh: cachedMesh('truncus septum cap', [...dep, q(cut)], () => cap), ...capTone, show });
        }
        const um = whole ? 0.5 : cut * 0.85;
        pts['trenkada-aortikopulmonarra'] = F.at(um);
        // Where the two ridges were (each now the septum's edge on its wall).
        const edge = (sign: 1 | -1, u: number): V3 => {
          const c = F.at(u * cut);
          const e = F.e(u * cut);
          return [c[0] + sign * e[0] * TRUNCUS_R * 0.8, c[1], c[2] + sign * e[2] * TRUNCUS_R * 0.8];
        };
        pts['enborraren-gandorrak'] = edge(1, 0.3);
        pts['enborraren-gandorrak-2'] = edge(-1, 0.75);
        // Each way named on its own side, just under the cut (or half way up).
        const n = F.n(um);
        const c = F.at(um);
        pts['aorta'] = [c[0] + n[0] * TRUNCUS_R * 0.55, c[1], c[2] + n[2] * TRUNCUS_R * 0.55];
        pts['birika-arteria'] = [c[0] - n[0] * TRUNCUS_R * 0.55, c[1], c[2] - n[2] * TRUNCUS_R * 0.55];
      }
    }
  }

  if (split > 0.01) vessels(F, s, split, items, pts, dep);
  return F;
}

// ———————————————————————————— the two vessels, the valves, the coronaries ————————————————————————————

/** Each vessel's lumen: apart, side by side on the conus top, their walls just not touching. */
const VR = TRUNCUS_R * 0.44;
/** Where each vessel runs: the middle of its way, winding round the other. */
const vesselPath = (F: Truncus, aortic: boolean) => (u: number): V3 => {
  const c = F.at(u);
  const n = F.n(u);
  const k = (aortic ? 1 : -1) * TRUNCUS_R * 0.6;
  return [c[0] + n[0] * k, c[1], c[2] + n[2] * k];
};
/** The roots' valve level, and how far up the vessels are cut when looking into them. */
const U_VALVE = 0.05;
export const U_ROOTS = 0.2;
/**
 * Stages 8 on turn the whole heart 18° about the vertical (canal3d.ts): a model angle φ round y shows at φ − 18°
 * in the body. Places named by the body's sides (the cusps, the coronaries) are set that much further on.
 */
const TURN = (18 * Math.PI) / 180;
/** The cusps' middles in the body (radians round each root: x = cos, z = sin): aortic: posterior + two lateral; pulmonary: anterior + two lateral. */
const CUSPS = {
  aorta: [-Math.PI / 2, Math.PI / 6, (Math.PI * 5) / 6],
  pulm: [Math.PI / 2, -Math.PI / 6, (Math.PI * 7) / 6],
};
/** The aorta's right and left sinuses (its two lateral cusps), whence the coronaries. */
const SINUS = { right: (Math.PI * 5) / 6, left: Math.PI / 6 };

/** One cusp: attached along a U on the wall, its two edges running in to meet the others in the middle; deep in its middle (a swallow's nest), open upwards. */
function cuspSheet(c: V3, mid: number, g: number, hol: number, coarse: number): Mesh {
  return grid(Math.round(16 / coarse), Math.round(8 / coarse), (a, v) => {
    const ang = mid + TURN + lerp(-1, 1, a);
    const across = Math.sin(Math.PI * a);
    const depth = 0.17 * g * (0.3 + 0.7 * hol);
    const r = VR * (1 - 0.94 * v * g);
    const y = c[1] + 0.12 - depth * across * (1 - v * 0.85);
    return ring([c[0], y, c[2]], r, ang);
  });
}

function vessels(F: Truncus, s: TruncusState, split: number, items: Item3[], pts: Record<string, V3>, dep: number[]) {
  const cut = clamp01(s.cut);
  const whole = cut > 0.995;
  for (const aortic of [true, false]) {
    const path = vesselPath(F, aortic);
    const tag = aortic ? 'a' : 'p';
    const id = aortic ? 'aorta' : 'birika-arteria';
    const color = aortic ? mixHex(AORTA, '#ffffff', 0.08) : mixHex(PULM, '#ffffff', 0.08);
    const deep = aortic ? '#5a1a22' : '#1a2a5a';
    const d = [...dep, q(cut), aortic ? 1 : 0];
    // Out beyond the truncus a little: the aorta on up and forward, the pulmonary trunk back.
    const ext = (u: number): V3 => {
      if (u <= 1) return path(u);
      const top = path(1);
      const k = u - 1;
      return aortic ? [top[0] + 0.05 * k, top[1] + 0.9 * k, top[2] + 0.3 * k] : [top[0] - 0.05 * k, top[1] + 0.55 * k, top[2] - 0.55 * k];
    };
    const end = whole ? 1.5 : cut;
    items.push({ key: `vessel-${tag}`, id, groups: ['enbor-arteriosoa'], mesh: cachedMesh(`vessel out ${tag}`, d, () => wallOf(ext, VR + 0.045, 0, end, true, 0, Math.PI * 2, 26, 20)), color, deep, tissue: 'vessel', show: split, ...(s.glass > 0.01 ? { opacity: 1 - 0.72 * clamp01(s.glass) } : {}) });
    items.push({ key: `vessel-in-${tag}`, id, mesh: cachedMesh(`vessel in ${tag}`, d, () => wallOf(ext, VR, 0, end, false, 0, Math.PI * 2, 26, 20)), color: mixHex(color, '#1a0e12', 0.35), deep, tissue: 'vessel', outline: false, show: split });
    if (!whole) {
      items.push({ key: `vessel-lip-${tag}`, groups: [id], mesh: cachedMesh(`vessel lip ${tag}`, d, () => lipAt(path(cut), VR, VR + 0.045)), color: mixHex(color, '#ffffff', 0.3), deep, tissue: 'vessel', outline: false, show: split });
      items.push({ key: `vessel-above-${tag}`, mesh: cachedMesh(`vessel above ${tag}`, d, () => wallOf(ext, VR + 0.045, cut, 1.5, true, 0, Math.PI * 2, 20, 12)), color, deep, tissue: 'membrane', thin: 1, opacity: 0.12 * split, outline: false });
    }
    // Each vessel named on its outer side, half way up what is drawn.
    const um = whole ? 0.45 : cut * 0.6;
    const c0 = F.at(um);
    const pm = path(um);
    const away = Math.hypot(pm[0] - c0[0], pm[2] - c0[2]) || 1;
    pts[`${id}-vessel`] = [pm[0] + ((pm[0] - c0[0]) / away) * VR * 0.9, pm[1], pm[2] + ((pm[2] - c0[2]) / away) * VR * 0.9];

    // —— semilunar valves: three swellings at the root, hollowed from above into pockets ——
    if (s.tubercles > 0.01) {
      const c = path(U_VALVE);
      const g = Math.round(clamp01(s.tubercles) * 20) / 20;
      const hol = Math.round(clamp01(s.hollow) * 20) / 20;
      const valveId = aortic ? 'aorta-balbula' : 'birika-balbula';
      const mids = aortic ? CUSPS.aorta : CUSPS.pulm;
      const dv = [...d, g, hol];
      const mesh = cachedMesh(`cusps ${tag}`, dv, () => merge(mids.map((m) => twoSided(cuspSheet(c, m, g, hol, 1)))));
      const hit = cachedMesh(`cusps hit ${tag}`, dv, () => merge(mids.map((m) => twoSided(cuspSheet(c, m, g, hol, 3)))));
      const tone = mixHex(K.cushion, '#f4f0e4', hol * 0.5);
      items.push({ key: `cusps-${tag}`, id: valveId, groups: ['balbula-semilunarrak', 'endokardio-kuxinak'], mesh, hit, color: tone, deep: K.cushionDeep, tissue: 'membrane' });
      // Where the cusps meet (the commissures, from the wall to the middle): the valve's Y seen from above.
      if (hol > 0.3) {
        const seams = mids.map((m) => {
          const a = m + Math.PI / 3 + TURN;
          return tubeParts([ring([c[0], c[1] + 0.122, c[2]], VR * 0.97, a), ring([c[0], c[1] + 0.122, c[2]], VR * 0.5, a), ring([c[0], c[1] + 0.122, c[2]], VR * 0.04, a)], { radius: () => 0.011, ref: [0, 1, 0], sides: 6 });
        });
        items.push({ key: `seams-${tag}`, groups: [valveId], mesh: cachedMerge(seams.map((x) => x.mesh)), color: K.cushionDeep, deep: '#1d4a44', tissue: 'membrane', outline: false, opacity: Math.min(1, (hol - 0.3) / 0.4) });
      }
      // Before hollowing: a tubercle (a rounded swelling) on top of each.
      if (hol < 0.98) {
        const k = g * (1 - hol);
        const bumps = mids.map((m) => blobParts({ center: ring([c[0], c[1] + 0.09 - 0.05 * hol, c[2]], VR * 0.5, m + TURN), radii: [0.11 * k + 0.004, 0.08 * k + 0.004, 0.11 * k + 0.004], rings: 10, sides: 14 }));
        items.push({ key: `tubercles-${tag}`, id: valveId, groups: ['balbula-semilunarrak', 'endokardio-kuxinak'], mesh: cachedMerge(bumps.map((x) => x.mesh)), hit: cachedMerge(bumps.map((x) => x.hit)), color: K.cushion, deep: K.cushionDeep, tissue: 'mesenchyme' });
      }
      pts[valveId] = ring([c[0], c[1] + 0.07, c[2]], VR * 0.5, mids[0] + TURN);
      // Each cusp's own spot (0: the posterior / anterior one, 1–2: the laterals).
      mids.forEach((m, k) => (pts[`${valveId}-${k}`] = ring([c[0], c[1] + 0.07, c[2]], VR * 0.55, m + TURN)));
      if (aortic) pts['balbula-semilunarrak'] = pts[valveId];
    }

    // —— the coronary arteries: out of the aorta's right and left sinuses, down over the heart ——
    if (aortic && s.coronaries > 0.01) {
      const c = path(U_VALVE + 0.05);
      const g = Math.round(clamp01(s.coronaries) * 20) / 20;
      const arts = [SINUS.right, SINUS.left].map((ang) => {
        const a = ang + TURN;
        const dir: V3 = [Math.cos(a), 0, Math.sin(a)];
        const out = (k: number, dy: number, dz = 0): V3 => [c[0] + dir[0] * k, c[1] + dy, c[2] + dir[2] * k + dz];
        const full = [out(VR, 0), out(VR + 0.25, -0.02), out(0.75, -0.3, 0.12), out(1.05, -0.75, 0.3), out(1.25, -1.3, 0.4)];
        // Grown from the sinus out: the first part of a fine resampling of the whole course.
        const fine: V3[] = [];
        for (let i = 0; i < full.length - 1; i++) for (let j = 0; j < 6; j++) fine.push(mix3(full[i], full[i + 1], j / 6));
        fine.push(full[full.length - 1]);
        return tubeParts(fine.slice(0, Math.max(2, Math.round(fine.length * g))), { radius: () => 0.042, ref: [0, 1, 0], sides: 10, capEnd: true });
      });
      items.push({ key: 'coronaries', id: 'arteria-koronarioak', groups: ['aorta'], mesh: cachedMerge(arts.map((x) => x.mesh)), hit: cachedMerge(arts.map((x) => x.hit)), color: '#e5484d', deep: '#6a1420', tissue: 'vessel' });
      const a = SINUS.right + TURN;
      pts['arteria-koronarioak'] = [c[0] + Math.cos(a) * 0.75, c[1] - 0.3, c[2] + Math.sin(a) * 0.75 + 0.12];
      const l = SINUS.left + TURN;
      pts['arteria-koronarioak-2'] = [c[0] + Math.cos(l) * 0.75, c[1] - 0.3, c[2] + Math.sin(l) * 0.75 + 0.12];
    }
  }
}

/** Routes up the truncus: one up the middle before it divides, then one up each way (or each vessel). */
export function truncusRoutes(F: Truncus, divided: number, apart = 0): { mid: V3[]; aorta: V3[]; pulm: V3[] } {
  const us = [0, 0.12, 0.25, 0.37, 0.5, 0.62, 0.75, 0.87, 1];
  const along = (k: number) => us.map((u) => {
    const c = F.at(u);
    const n = F.n(u);
    const r = k * TRUNCUS_R * 0.5 * divided;
    return [c[0] + n[0] * r, c[1], c[2] + n[2] * r] as V3;
  });
  const aorta = along(1);
  const pulm = along(-1);
  const a1 = aorta[aorta.length - 1];
  const p1 = pulm[pulm.length - 1];
  return {
    mid: along(0),
    aorta: apart > 0.5 ? [...aorta, [a1[0] + 0.03, a1[1] + 0.5, a1[2] + 0.17]] : aorta,
    pulm: apart > 0.5 ? [...pulm, [p1[0] - 0.03, p1[1] + 0.3, p1[2] - 0.3]] : pulm,
  };
}
