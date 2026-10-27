import { add, type M4, type V3 } from '@/lib/three-d/math';
import { curve3 } from '@/lib/three-d/mesh';
import { cachedBlob } from '@/lib/three-d/mesh-cache';
import type { Item3 } from '@/lib/three-d/scene';
import { embryo5 } from '@/lib/three-d/embryo5';
import { POSE0, blobParts, heartModel, mixHex, routeLength, tubeParts, vesselRouteOf, type HeartPose } from '@/components/scenes/week10/model3d';
import { T } from '@/components/scenes/week10/common';

/**
 * The 5-week embryo of topic 12 with its circulation inside (the notes' first figure, and the figure of
 * the ventral branches): the week-5 body of every topic (lib/three-d/embryo5) as glass, the heart loop of
 * topic 10 under the pharynx, the aortic arches round the pharynx, the two dorsal aortas fused along the
 * back, the vitelline arteries to the yolk sac (later the coeliac trunk and the two mesenteric arteries),
 * the umbilical arteries to the cord, and the veins back to the sinus venosus.
 *
 * Axes (as every model of topics 10–12): x towards the embryo's LEFT, y cranial, z ventral. The body
 * curls in the y–z plane: points are placed by their angle θ along the curled body axis (embryo5's
 * `axisAt`), how far dorsal of the axis (`out`, negative = ventral) and how far to the left (x).
 */

// embryo5 space: x lateral, the body curls in y–z (dorsal = +y at θ = 0). Ours: (x, y, z) = (x, e.z − 0.25, −e.y − 2.6).
const RC = 2.6;
const OY = -0.2 - RC;
const toOurs = (e: V3): V3 => [e[0], e[2] - 0.25, -e[1] - 2.6];
/** A point by angle along the body axis, dorsal offset (negative = ventral) and x (the embryo's left). */
export const P = (th: number, out: number, x = 0): V3 => toOurs([x, OY + (RC + out) * Math.cos(th), (RC + out) * Math.sin(th)]);
/** The body's matrix (embryo5 space → ours). */
const BODY_M: M4 = new Float32Array([1, 0, 0, 0, 0, 0, -1, 0, 0, 1, 0, 0, 0, -0.25, -2.6, 1]);

export const EC = {
  artery: T.o2,
  arteryDeep: T.o2Deep,
  vein: T.deo2,
  veinDeep: T.deo2Deep,
  umbVein: '#f0605a',
  gut: '#f2c14e',
  gutDeep: '#9a7a1f',
  liver: '#9c4a3a',
  liverDeep: '#4d2219',
  yolk: '#f4d27a',
  yolkDeep: '#a8873a',
  skin: '#f0c9b4',
  skinDeep: '#a07060',
  cord: '#d9d2e6',
  /** The three abdominal arteries in their own colours (they are told apart in the figures). */
  celiac: '#ff9a3c',
  sma: '#e0408f',
  ima: '#7c5cff',
  oeso: '#14b8a6',
  interseg: '#f2766b',
} as const;

export interface EmbryoPose {
  /** Aortic arches shown (1st..6th, 0..1 each). */
  arches: readonly [number, number, number, number, number, number];
  /** Vitelline arteries: the paired plexus (0..1), then reduced to the three unpaired trunks (0..1). */
  vitelline: number;
  reduce: number;
  /** Oesophageal pairs (0..1). */
  oeso: number;
  /** Intersegmental arteries along the back (0..1). */
  interseg: number;
  /** Umbilical arteries (0..1), umbilical and vitelline veins (0..1), cardinal veins (0..1). */
  umb: number;
  veins: number;
  cardinal: number;
  /** Gut, liver and yolk sac (0..1). */
  gut: number;
  /** The body glass (0..1). */
  body: number;
}

export const EP0: EmbryoPose = { arches: [0.15, 0.4, 1, 1, 0, 0.7], vitelline: 1, reduce: 0, oeso: 0, interseg: 0, umb: 1, veins: 1, cardinal: 1, gut: 1, body: 1 };

const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);

/** Arch levels along the neck (θ), 1st..6th. */
const ARCH_TH = [1.9, 1.8, 1.7, 1.6, 1.54, 1.47] as const;
/** The dorsal aortas are paired above this angle, fused below. */
const FUSE_TH = 1.02;
const DA_OUT = 0.42;
const DA_X = 0.26;

export interface EmbryoModel {
  items: Item3[];
  pts: Record<string, V3>;
  lines: Record<string, V3[]>;
}

const tubeOf = (pts: V3[], r: number | ((u: number) => number), sides = 12) =>
  tubeParts(pts, { radius: typeof r === 'number' ? () => r : r, ref: [1, 0, 0], sides, capStart: true, capEnd: true });

/** A smooth line through key points. */
const L = (kps: V3[], n = 24) => curve3(kps, n);
/** Points along the body between two angles at a fixed offset and x. */
const along = (th0: number, th1: number, out: number, x: number, n = 7): V3[] => Array.from({ length: n }, (_, i) => P(th0 + ((th1 - th0) * i) / (n - 1), out, x));

/** The heart loop of topic 10, under the pharynx: its aortic sac at the arches' ventral ends. */
const HEART_POSE: HeartPose = { ...POSE0, segs: 1, colour: 0, split: 1, loop: 1, atriaFuse: 1, arches: 0, veins: 0 };
function heartItems(): { items: Item3[]; sac: V3; centre: V3; pts: Record<string, V3> } {
  const h = heartModel(HEART_POSE, { cavity: 0, septum: 0, gut: 0, aortas: 0, noto: 0 });
  const sac = h.pts['aorta-zakua'];
  const k = 0.36;
  // Tilted forward with the neck (the outflow points at the floor of the pharynx).
  const a = (-38 * Math.PI) / 180;
  const c = Math.cos(a);
  const s = Math.sin(a);
  const target = P(1.42, -0.92, 0);
  // Rotation about x then scale: y' = c·y − s·z, z' = s·y + c·z.
  const rs: V3 = [k * sac[0], k * (c * sac[1] - s * sac[2]), k * (s * sac[1] + c * sac[2])];
  const tr: V3 = [target[0] - rs[0], target[1] - rs[1], target[2] - rs[2]];
  const m: M4 = new Float32Array([k, 0, 0, 0, 0, k * c, k * s, 0, 0, -k * s, k * c, 0, tr[0], tr[1], tr[2], 1]);
  const items = h.items.filter((it) => !it.stream).map((it) => ({ ...it, key: `h-${it.key}`, groups: it.id ? [...(it.groups ?? []), 'bihotz-lakioa'] : undefined, matrix: m }));
  const place = (v: V3): V3 => [k * v[0] + tr[0], k * (c * v[1] - s * v[2]) + tr[1], k * (s * v[1] + c * v[2]) + tr[2]];
  const pts: Record<string, V3> = {};
  for (const id of ['atal-bulbarra', 'atal-bentrikularra', 'atal-aurikularra', 'zain-sinua', 'enbor-arteriosoa']) if (h.pts[id]) pts[id] = place(h.pts[id]);
  return { items, sac: target, centre: place(h.pts['atal-bentrikularra']), pts };
}

export function embryoModel(pose: EmbryoPose, o: { flow?: { phase: number; show: number } | null; dim?: { ids: readonly string[]; k: number } | null; bars?: number } = {}): EmbryoModel {
  const items: Item3[] = [];
  const pts: Record<string, V3> = {};
  const lines: Record<string, V3[]> = {};
  const dim = o.dim;
  const fade = (id: string, groups?: string[]) => (!dim || dim.k <= 0.001 || dim.ids.includes(id) || (groups ?? []).some((g) => dim.ids.includes(g)) ? 1 : 1 - 0.8 * dim.k);
  const vessel = (key: string, id: string, line: V3[], color: string, r: number | ((u: number) => number), show = 1, groups?: string[]) => {
    if (show <= 0.01 || line.length < 2) return;
    lines[key] = line;
    items.push({ key, id, groups, ...tubeOf(line, r), color, deep: mixHex(color, '#000000', 0.55), tissue: 'vessel', show, opacity: fade(id, groups) });
  };
  const grown = (line: V3[], g: number) => (g >= 0.999 ? line : line.slice(0, Math.max(2, Math.round(line.length * clamp01(g)))));

  // ———— the body ————
  if (pose.body > 0.01) {
    const E = embryo5();
    items.push({ key: 'body', mesh: E.body, hit: E.hit, matrix: BODY_M, color: EC.skin, deep: EC.skinDeep, tissue: 'skin', opacity: 0.16 * pose.body, outline: false, quiet: true });
    E.eyes.forEach((m, i) => items.push({ key: `eye${i}`, mesh: m, matrix: BODY_M, color: '#3a2a30', deep: '#140c10', tissue: 'skin', opacity: 0.5 * pose.body, quiet: true }));
  }

  // ———— the heart ————
  const H = heartItems();
  for (const it of H.items) items.push({ ...it, opacity: (it.opacity ?? 1) * fade('bihotz-lakioa') });
  pts['bihotz-lakioa'] = H.centre;
  Object.assign(pts, H.pts);
  const sac = H.sac;
  pts['aorta-zakua'] = sac;

  // ———— dorsal aortas: paired in the neck and up into the head, fused down the back ————
  const fused = along(FUSE_TH, -2.15, DA_OUT, 0, 14);
  vessel('aorta', 'aorta-dortsalak', fused, EC.artery, (u) => 0.1 * (1 - 0.45 * u), 1, ['aorta']);
  pts['aorta-dortsal-bakarra'] = P(0.2, DA_OUT, 0);
  for (const s of [-1, 1]) {
    const n = s < 0 ? 'R' : 'L';
    const da = L([P(2.42, 0.05, s * 0.3), P(2.2, 0.32, s * DA_X), ...along(2.0, FUSE_TH + 0.12, DA_OUT, s * DA_X, 6), P(FUSE_TH, DA_OUT, s * 0.04)], 30);
    vessel(`da${n}`, 'aorta-dortsalak', da, EC.artery, 0.07);
    pts[`aorta-dortsalak${n}`] = P(1.25, DA_OUT, s * DA_X);
    // Aortic arches round the pharynx: from the sac's horn, out and back to the dorsal aorta.
    for (let k = 0; k < 6; k++) {
      const g = pose.arches[k];
      if (g <= 0.01) continue;
      const th = ARCH_TH[k];
      const line = L([sac, P(th - 0.04, -0.62, s * 0.16), P(th, -0.42, s * 0.5), P(th, -0.05, s * 0.6), P(th, 0.28, s * 0.42), P(th, DA_OUT, s * DA_X)], 18);
      vessel(`arch${k}${n}`, 'aorta-arkuak', grown(line, g), EC.artery, 0.05 + (k === 2 || k === 3 ? 0.012 : 0), 1, ['aorta-arkuak']);
      if (k === 3) pts[`aorta-arkuak${n}`] = line[11];
      // The pharyngeal arch round its artery (mesoderm), see-through.
      const b = o.bars ?? 0;
      if (b > 0.01 && k !== 4) {
        items.push({ key: `bar${k}${n}`, id: 'faringe-arkuak', ...tubeOf(line.slice(2, 15), 0.13, 14), color: '#e6d2bf', deep: '#86705c', tissue: 'mesenchyme', opacity: 0.3 * b, outline: false });
        if (k === 2 && s > 0) pts['faringe-arkuak'] = line[9];
      }
    }
  }

  // ———— the gut, the liver, the yolk sac and the cord ————
  const cordRoot = P(-0.55, -1.05, 0);
  const cordEnd: V3 = add(cordRoot, [0, -1.0, 2.2]);
  if (pose.gut > 0.01) {
    const g = pose.gut;
    const fore = along(1.62, 0.3, -0.12, 0, 9);
    const mid = L([P(0.3, -0.12, 0), P(-0.1, -0.35, 0), P(-0.45, -0.95, 0.05), P(-0.62, -1.15, 0.02), P(-0.7, -0.75, -0.04), P(-0.85, -0.3, 0), P(-1.2, -0.14, 0)], 20);
    const hind = along(-1.2, -2.05, -0.1, 0, 6);
    // The three parts of the gut, each its own piece (the three ventral arteries each feed one).
    ([['gutF', 'aurreko-hestea', fore], ['gutM', 'erdiko-hestea', mid], ['gutH', 'atzeko-hestea', hind]] as const).forEach(([key, id, line]) =>
      items.push({ key, id, ...tubeOf([...line], 0.1), color: EC.gut, deep: EC.gutDeep, tissue: 'epithelium', opacity: 0.55 * g, quiet: true }),
    );
    pts['aurreko-hestea'] = P(1.0, -0.12, 0.08);
    pts['erdiko-hestea'] = P(-0.5, -0.95, 0.12);
    pts['atzeko-hestea'] = P(-1.6, -0.1, 0.08);
    items.push({ key: 'stomach', id: 'urdaila', ...blobParts({ center: P(0.62, -0.2, 0.12), radii: [0.24, 0.32, 0.2], rings: 10, sides: 14 }), color: EC.gut, deep: EC.gutDeep, tissue: 'epithelium', opacity: 0.6 * g, quiet: true });
    pts['urdaila'] = P(0.62, -0.2, 0.3);
    items.push({ key: 'liver', id: 'gibela', ...blobParts({ center: P(0.4, -0.78, 0), radii: [0.7, 0.5, 0.55], rings: 12, sides: 16 }), color: EC.liver, deep: EC.liverDeep, tissue: 'epithelium', opacity: 0.28 * g, outline: false, quiet: true });
    pts['gibela'] = P(0.4, -0.95, 0.35);
    const stalk = L([P(-0.55, -1.1, 0), add(P(-0.55, -1.1, 0), [0, -0.5, 1.1]), add(P(-0.55, -1.1, 0), [0, -1.1, 2.0])], 10);
    items.push({ key: 'yolk-stalk', id: 'hodi-onfalomesenterikoa', ...tubeOf(stalk, 0.07), color: EC.yolk, deep: EC.yolkDeep, tissue: 'epithelium', opacity: 0.6 * g, quiet: true });
    const yc = add(stalk[stalk.length - 1], [0, -0.4, 0.55]);
    items.push({ key: 'yolk', id: 'bitelo-zaku-sekundarioa', ...blobParts({ center: yc, radii: [0.55, 0.6, 0.55], rings: 14, sides: 18 }), color: EC.yolk, deep: EC.yolkDeep, tissue: 'epithelium', opacity: 0.5 * g, outline: false });
    pts['bitelo-zaku-sekundarioa'] = add(yc, [0.35, 0.1, 0.3]);
    lines.yolk = [yc];
    // The cord: glass round the umbilical vessels.
    items.push({ key: 'cord', id: 'zilborrestea', ...tubeOf(L([P(-0.75, -0.95, 0), add(P(-0.75, -0.95, 0), [0, -0.9, 1.4]), add(P(-0.75, -0.95, 0), [0, -1.6, 2.6])], 12), 0.32), color: EC.cord, deep: '#6a6478', tissue: 'membrane', opacity: 0.14 * g, outline: false, quiet: true });
  }
  void cordEnd;

  // ———— ventral branches: vitelline arteries → coeliac trunk, superior and inferior mesenteric ————
  const vit = clamp01(pose.vitelline);
  const red = clamp01(pose.reduce);
  if (vit > 0.01) {
    // The plexus: paired vessels from the aorta's ventral wall down the mesentery to the gut and out along the yolk stalk.
    const levels = [0.62, 0.42, 0.22, 0.02, -0.2, -0.45, -0.7];
    const keep: Record<number, [string, string, number]> = { 0: ['enbor-zeliakoa', EC.celiac, 0.55], 3: ['goiko-arteria-mesenterikoa', EC.sma, 0.15], 6: ['beheko-arteria-mesenterikoa', EC.ima, -0.65] };
    levels.forEach((th, i) => {
      const kept = keep[i];
      for (const s of [-1, 1]) {
        const x0 = s * 0.08 * (1 - red);
        const line = L([P(th, DA_OUT - 0.08, x0), P(th - 0.02, 0.05, s * 0.18 * (1 - red)), P(th - 0.05, -0.12, s * 0.12 * (1 - red)), ...(i >= 2 && i <= 4 ? [P(-0.45, -0.95, s * 0.06 * (1 - red)), P(-0.55, -1.1, s * 0.05)] : [P(th - 0.08, -0.2, 0)])], 16);
        const show = kept ? 1 : 1 - red;
        // Reduced: the kept ones lose their pair (one vessel in the midline).
        if (kept && s > 0 && red > 0.5) continue;
        const colour = kept ? mixHex(EC.artery, kept[1], red) : EC.artery;
        vessel(`vit${i}${s}`, kept && red > 0.5 ? kept[0] : 'bitelo-arteriak', grown(line, vit), colour, 0.045 + (kept ? 0.02 * red : 0), show * (kept ? 1 : 1 - red), kept ? ['bitelo-arteriak', kept[0]] : ['bitelo-arteriak']);
        if (kept) pts[kept[0]] = line[Math.round(line.length * 0.4)];
      }
    });
    // Vitelline arteries on to the yolk sac.
    if (red < 0.99 && pose.gut > 0.01) {
      const yv = L([P(-0.55, -1.1, 0.04), add(P(-0.55, -1.1, 0.04), [0.02, -0.5, 1.1]), add(P(-0.55, -1.1, 0.04), [0.02, -1.15, 2.1])], 10);
      vessel('vit-yolk', 'bitelo-arteriak', yv, EC.artery, 0.04, vit * (1 - red));
      pts['bitelo-arteriak'] = yv[5];
    }
  }
  // Five oesophageal pairs in the thorax.
  if (pose.oeso > 0.01)
    for (let i = 0; i < 5; i++) {
      const th = 1.0 + i * 0.09;
      for (const s of [-1, 1]) {
        const line = L([P(th, DA_OUT - 0.06, s * 0.05), P(th, 0.15, s * 0.1), P(th - 0.02, -0.02, s * 0.06)], 8);
        vessel(`oeso${i}${s}`, 'hestegorriko-arteriak', grown(line, pose.oeso), EC.oeso, 0.03);
        if (i === 2 && s > 0) pts['hestegorriko-arteriak'] = line[5];
      }
    }

  // ———— intersegmental arteries along the back ————
  if (pose.interseg > 0.01)
    for (let i = 0; i < 26; i++) {
      const th = 1.38 - i * 0.135;
      if (th < -2.05) break;
      for (const s of [-1, 1]) {
        const line = L([P(th, DA_OUT + 0.02, s * 0.06), P(th, 0.58, s * 0.3), P(th, 0.72, s * 0.62), P(th, 0.45, s * 0.92)], 10);
        vessel(`is${i}${s}`, 'segmentu-arteko-arteriak', grown(line, pose.interseg), EC.interseg, 0.025);
      }
    }
  if (pose.interseg > 0.01) pts['segmentu-arteko-arteriak'] = P(0.0, 0.72, 0.62);

  // ———— umbilical arteries: from the caudal aorta round the hindgut into the cord ————
  if (pose.umb > 0.01)
    for (const s of [-1, 1]) {
      const n = s < 0 ? 'R' : 'L';
      const base = P(-0.75, -0.95, 0);
      const line = L([P(-1.75, DA_OUT, s * 0.08), P(-1.72, 0.0, s * 0.42), P(-1.5, -0.62, s * 0.5), P(-1.1, -0.95, s * 0.32), P(-0.85, -1.0, s * 0.14), add(base, [s * 0.12, -0.9, 1.4]), add(base, [s * 0.1, -1.6, 2.6])], 26);
      vessel(`umbA${n}`, 'zilbor-arteriak', grown(line, pose.umb), T.deo2, 0.06);
      if (s > 0) pts['zilbor-arteriak'] = line[8];
    }

  // ———— veins back to the sinus venosus ————
  const sinus = (s: number) => P(1.15, -0.7, s * 0.28);
  if (pose.veins > 0.01)
    for (const s of [-1, 1]) {
      const n = s < 0 ? 'R' : 'L';
      const base = P(-0.75, -0.95, 0);
      const umbV = L([add(base, [s * 0.02, -1.6, 2.6]), add(base, [s * 0.04, -0.9, 1.4]), P(-0.6, -0.98, s * 0.3), P(-0.1, -0.98, s * 0.66), P(0.5, -0.95, s * 0.72), P(0.95, -0.85, s * 0.48), sinus(s)], 26);
      vessel(`umbV${n}`, 'zilbor-zainak', umbV, EC.umbVein, 0.055, pose.veins * (s < 0 ? 0.75 : 1));
      if (s > 0) pts['zilbor-zainak'] = umbV[14];
      const vitV = L([P(-0.55, -1.1, s * 0.1), P(-0.2, -0.55, s * 0.24), P(0.3, -0.5, s * 0.3), P(0.8, -0.6, s * 0.3), sinus(s)], 18);
      vessel(`vitV${n}`, 'bitelo-zainak', vitV, EC.vein, 0.05, pose.veins * (1 - red));
      if (s > 0) pts['bitelo-zainak'] = vitV[8];
    }
  if (pose.cardinal > 0.01)
    for (const s of [-1, 1]) {
      const n = s < 0 ? 'R' : 'L';
      const ant = L([P(2.5, 0.35, s * 0.55), P(2.1, 0.62, s * 0.62), P(1.6, 0.6, s * 0.66), P(1.25, 0.45, s * 0.66)], 18);
      const post = L([P(-1.9, 0.55, s * 0.62), P(-1.0, 0.6, s * 0.68), P(0.0, 0.6, s * 0.68), P(0.9, 0.5, s * 0.66), P(1.15, 0.42, s * 0.66)], 22);
      const common = L([P(1.2, 0.44, s * 0.66), P(1.2, 0.05, s * 0.6), P(1.18, -0.4, s * 0.45), sinus(s)], 12);
      vessel(`cardA${n}`, 'aurreko-bena-kardinalak', ant, EC.vein, 0.05, pose.cardinal);
      vessel(`cardP${n}`, 'atzeko-bena-kardinalak', post, EC.vein, 0.05, pose.cardinal);
      vessel(`cardC${n}`, 'bena-kardinal-komuna', common, EC.vein, 0.06, pose.cardinal);
      if (s > 0) {
        pts['aurreko-bena-kardinalak'] = ant[6];
        pts['atzeko-bena-kardinalak'] = post[9];
        pts['bena-kardinal-komuna'] = common[5];
      }
    }

  // ———— blood ————
  if (o.flow && o.flow.show > 0.01) {
    const f = o.flow;
    const route = (key: string, line: V3[] | undefined, color: string, deep: string) => {
      if (!line || line.length < 2) return;
      const r = vesselRouteOf(line);
      items.push({ key: `flow-${key}`, mesh: CELL(), color, deep, tissue: 'skin', stream: { route: r, phase: f.phase / Math.max(0.5, routeLength(r)), grow: f.show, ...CELLS } });
    };
    // Out through the 3rd and 4th arches, down the aorta, into the cord.
    for (const n of ['R', 'L']) {
      const a = lines[`arch3${n}`];
      if (a) route(`a${n}`, [...a, ...(lines[`da${n}`] ?? []).slice(-10)], T.o2, T.o2Deep);
      route(`umbA${n}`, lines[`umbA${n}`], T.deo2, T.deo2Deep);
      route(`umbV${n}`, lines[`umbV${n}`], T.o2, T.o2Deep);
      route(`vitV${n}`, lines[`vitV${n}`], T.deo2, T.deo2Deep);
      route(`cardP${n}`, lines[`cardP${n}`] ? [...lines[`cardP${n}`], ...(lines[`cardC${n}`] ?? [])] : undefined, T.deo2, T.deo2Deep);
      route(`cardA${n}`, lines[`cardA${n}`], T.deo2, T.deo2Deep);
    }
    route('aorta', lines.aorta, T.o2, T.o2Deep);
  }
  return { items, pts, lines };
}

const CELL = () => cachedBlob({ center: [0, 0, 0], radii: [0.035, 0.026, 0.035], rings: 6, sides: 8 });
const CELLS = (() => {
  const n = 8;
  const cells = new Float32Array(n * 4);
  const gates = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    cells.set([i / n, Math.sin(i * 12.9) * 0.02, Math.cos(i * 7.3) * 0.015, Math.sin(i * 3.1) * 0.02], i * 4);
    gates[i] = ((i * 0.618034) % 1) * 0.85;
  }
  return { cells, gates };
})();
