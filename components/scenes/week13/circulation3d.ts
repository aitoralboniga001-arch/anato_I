import { add, mix3, type M4, type V3 } from '@/lib/three-d/math';
import { curve3 } from '@/lib/three-d/mesh';
import type { Item3 } from '@/lib/three-d/scene';
import { blobParts, mixHex, tubeParts } from '@/components/scenes/week10/model3d';
import { VC } from './veins3d';

/**
 * The circulation of stages 13–15 (notes 4.1–4.3), in the venous model's frame (x = the embryo's LEFT, y cranial,
 * z ventral): a four-chamber heart in glass where topic 10's loop was, the interatrial septum with the foramen ovale,
 * the aorta and its arch, the pulmonary trunk and the ductus arteriosus, the lungs, the umbilical arteries round the
 * bladder, the cord and the placenta. The veins (cavae, ductus venosus, left umbilical vein) are the venous model's own.
 */

export interface CircState {
  /** Lungs: 0 = fetal (small, filled with fluid) … 1 = breathing. */
  lungs: number;
  /** Umbilical arteries closing: distal part → medial umbilical ligament; proximal part stays (superior vesical artery). */
  uaClose: number;
  /** Ductus arteriosus → ligamentum arteriosum. */
  daClose: number;
  /** Septum primum pressed against septum secundum; then the two fused; a slit left open (20 %). */
  press: number;
  fuse: number;
  patent: number;
  /** Cord and placenta (0 once the cord is cut). */
  cord: number;
  /** The aortic valve's three cusps, the sinuses of Valsalva and the coronary arteries. */
  valsalva: number;
  /** The heart cut open in front so the septa and the paths through it show (0..1). */
  open: number;
}

export const CS0: CircState = { lungs: 0, uaClose: 0, daClose: 0, press: 0, fuse: 0, patent: 0, cord: 1, valsalva: 0, open: 1 };

export const CC = {
  myo: '#c9787a',
  myoDeep: '#5c2a33',
  septum: '#e6b2a8',
  valve: '#f3d9cc',
  artery: '#d9473f',
  arteryDeep: '#6e1c1a',
  pulm: '#5b6fd8',
  lung: '#f2b3c0',
  lungFetal: '#d99aa9',
  lungDeep: '#9a5a6a',
  rightSide: '#7f8fe6',
  leftSide: '#e67f7f',
  bladder: '#e8c46a',
  cord: '#d9d2e6',
  placenta: '#a8344a',
  placentaDeep: '#4d1220',
  ligament: VC.ligament,
} as const;

const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
const ss = (a: number, b: number, x: number) => {
  const u = clamp01((x - a) / (b - a));
  return u * u * (3 - 2 * u);
};
const X = (s: number, p: V3): V3 => [s * p[0], p[1], p[2]];

/** Saturation → colour: the share of oxygenated blood (blue … red). */
export const satColour = (s: number) => mixHex(VC.deo2, VC.o2, clamp01(s));

/** An affine matrix (column-major) mapping the unit frame to centre + three scaled axes. */
const frame = (c: V3, ax: V3, ay: V3, az: V3): M4 => new Float32Array([ax[0], ax[1], ax[2], 0, ay[0], ay[1], ay[2], 0, az[0], az[1], az[2], 0, c[0], c[1], c[2], 1]);
const sc = (v: V3, k: number): V3 => [v[0] * k, v[1] * k, v[2] * k];
const norm = (v: V3): V3 => {
  const l = Math.hypot(v[0], v[1], v[2]) || 1;
  return [v[0] / l, v[1] / l, v[2] / l];
};

// ———————————————————————————— geometry ————————————————————————————

/** Chamber centres and semi-axes. */
const RA = { c: [-0.85, 0.12, 0.12] as V3, r: [0.66, 0.72, 0.6] as V3 };
const LA = { c: [0.55, 0.38, -0.3] as V3, r: [0.6, 0.5, 0.5] as V3 };
const RV = { c: [-0.15, -0.6, 0.92] as V3, r: [0.52, 0.48, 0.4] as V3 };
const LV = { c: [0.62, -0.82, 0.48] as V3, r: [0.42, 0.6, 0.42] as V3 };

/** The foramen ovale: the gap between the free edge of septum secundum (above) and septum primum (the valve, on the left). */
const FO: V3 = [-0.12, 0.12, -0.12];
const SEPT_N: V3 = norm([1, 0.08, 0.1]);

const L = (kps: V3[], n = 24) => curve3(kps, n);

/** Centrelines (blood runs from the first point to the last). */
export const CL = {
  /** Right atrium: from where the venae cavae open (the right horn) through the foramen ovale to the left atrium, the mitral orifice, the left ventricle and its outflow. */
  raFo: L([[-1.1, 0, -0.35], [-0.75, -0.05, -0.2], [-0.35, 0.05, -0.15], FO, [0.25, 0.25, -0.25], [0.55, 0.3, -0.3], [0.62, -0.15, 0.05], [0.72, -0.75, 0.35], [0.55, -0.6, 0.6], [0.35, -0.15, 0.6], [0.3, -0.02, 0.58]], 30),
  /** Left atrium → left ventricle → aortic root (after birth, from the pulmonary veins). */
  laLv: L([[0.55, 0.38, -0.45], [0.6, 0.1, -0.15], [0.62, -0.15, 0.05], [0.72, -0.75, 0.35], [0.55, -0.6, 0.6], [0.35, -0.15, 0.6], [0.3, -0.02, 0.58]], 24),
  /** Right atrium → tricuspid orifice → right ventricle → its outflow. */
  raRv: L([[-1.1, 0.02, -0.33], [-0.95, 0.15, 0.1], [-0.7, -0.25, 0.5], [-0.35, -0.75, 0.85], [-0.1, -0.55, 1.05], [-0.05, -0.15, 1.15]], 24),
  /** Pulmonary trunk to its bifurcation. */
  pt: L([[-0.05, -0.15, 1.15], [0.12, 0.45, 1.05], [0.3, 0.88, 0.6], [0.36, 0.98, 0.42]], 16),
  /** Ductus arteriosus: bifurcation → descending aorta. */
  da: L([[0.36, 0.98, 0.42], [0.45, 1.22, -0.05], [0.44, 1.42, -0.55], [0.42, 1.48, -0.74]], 12),
  lpa: L([[0.36, 0.98, 0.42], [0.85, 0.98, 0.05], [1.35, 0.8, -0.25], [1.62, 0.62, -0.42]], 14),
  rpa: L([[0.36, 0.98, 0.42], [-0.2, 1.02, 0.18], [-0.75, 0.9, 0.05], [-1.35, 0.75, -0.3], [-1.6, 0.62, -0.42]], 16),
  /** Pulmonary veins (two each side) into the back of the left atrium. */
  pvL1: L([[1.6, 0.85, -0.55], [1.1, 0.6, -0.55], [0.75, 0.48, -0.6]], 10),
  pvL2: L([[1.6, 0.2, -0.55], [1.1, 0.25, -0.55], [0.75, 0.3, -0.62]], 10),
  pvR1: L([[-1.55, 0.85, -0.6], [-0.6, 0.62, -0.62], [0.32, 0.5, -0.62]], 12),
  pvR2: L([[-1.55, 0.2, -0.6], [-0.6, 0.28, -0.62], [0.32, 0.3, -0.64]], 12),
  /** Aorta: root → ascending → arch → (ductus) → descending → bifurcation. */
  asc: L([[0.3, -0.02, 0.58], [0.18, 0.65, 0.66], [0.06, 1.3, 0.4], [0.1, 1.6, 0.06]], 16),
  arch: L([[0.1, 1.6, 0.06], [0.24, 1.72, -0.18], [0.38, 1.66, -0.46], [0.42, 1.48, -0.74]], 12),
  desc: L([[0.42, 1.48, -0.74], [0.38, 1.1, -0.95], [0.3, 0.0, -1.02], [0.22, -1.8, -1.02], [0.14, -3.4, -0.98], [0.06, -4.55, -0.92]], 26),
  bct: L([[0.1, 1.6, 0.06], [-0.3, 2.1, -0.4], [-0.62, 2.6, -0.55], [-0.72, 3.4, -0.58]], 14),
  rsa: L([[-0.62, 2.6, -0.55], [-1.1, 2.62, -0.72], [-1.75, 2.48, -0.78]], 10),
  lcc: L([[0.24, 1.72, -0.18], [0.32, 2.25, -0.62], [0.55, 3.0, -0.64], [0.62, 3.5, -0.62]], 14),
  lsa: L([[0.38, 1.66, -0.46], [0.75, 2.1, -0.76], [1.25, 2.45, -0.8], [1.75, 2.5, -0.78]], 12),
  /** Coronary arteries from the sinuses of Valsalva. */
  corR: L([[0.18, 0.05, 0.7], [-0.25, -0.05, 0.98], [-0.7, -0.35, 0.82], [-0.95, -0.75, 0.45]], 12),
  corL: L([[0.42, 0.06, 0.62], [0.68, 0.0, 0.62], [0.55, -0.45, 1.05], [0.3, -1.05, 1.2]], 12),
  /** Common iliac → internal iliac, and the external iliac (each side; `side` −1 right, +1 left). */
  cia: (s: number) => L([X(s, [0.06, -4.55, -0.92]), X(s, [0.45, -5.15, -0.88]), X(s, [0.82, -5.75, -0.76])], 10),
  eia: (s: number) => L([X(s, [0.82, -5.75, -0.76]), X(s, [1.15, -6.4, -0.35]), X(s, [1.32, -7.05, 0.1])], 10),
  iia: (s: number) => L([X(s, [0.82, -5.75, -0.76]), X(s, [0.8, -6.15, -0.62]), X(s, [0.78, -6.35, -0.4])], 8),
  /** Umbilical artery: from the internal iliac round the bladder to the umbilicus. Its first stretch stays as the superior vesical artery. */
  ua: (s: number) => L([X(s, [0.78, -6.35, -0.4]), X(s, [0.76, -6.4, 0.1]), X(s, [0.62, -6.1, 0.75]), X(s, [0.38, -5.4, 1.35]), X(s, [0.12, -4.82, 1.72])], 22),
  /** The cord: the left umbilical vein and the two arteries round its axis, out to the placenta. */
  cordAxis: L([[0, -4.75, 1.75], [0, -5.05, 2.45], [0.18, -5.7, 3.25], [0.05, -6.35, 3.95], [0, -6.75, 4.45]], 30),
};

/** Points on the cord's axis with a helical offset (the arteries twist round the vein). */
function helix(phase: number, r: number, turns = 2.2): V3[] {
  const ax = CL.cordAxis;
  return ax.map((p, i) => {
    const u = i / (ax.length - 1);
    const a = phase + u * turns * Math.PI * 2;
    return add(p, [r * Math.cos(a), r * Math.sin(a) * 0.6, 0]);
  });
}
const CORD_V = (() => {
  const v = [...helix(0, 0.0)].reverse();
  // Placenta → umbilicus, then on into the body to where the venous model's umbilical vein begins.
  return [...v, [0.05, -4.55, 1.6] as V3, [0.05, -4.35, 1.45] as V3];
})();
const CORD_A = (s: number) => {
  const h = helix(s > 0 ? 0 : Math.PI, 0.13);
  return [X(s, [0.12, -4.82, 1.72]), ...h.slice(1)];
};
export const PLACENTA_C: V3 = [0, -7.05, 4.85];

export interface CircModel {
  items: Item3[];
  pts: Record<string, V3>;
  lines: Record<string, V3[]>;
}

export interface CircOpts {
  /** Only these ids or groups at full strength (the rest see-through). */
  dim?: { ids: readonly string[]; k: number } | null;
  /** Vessel walls turned to glass so the blood cells inside show (0..1). */
  glass?: number;
}

/**
 * The heart, the arteries, the lungs, the bladder, the cord and the placenta for the state of the moment.
 * Saturations colour the vessels (the notes' figure: red oxygenated, violet mixed, blue poor).
 */
export function circModel(s: CircState, o: CircOpts = {}): CircModel {
  const items: Item3[] = [];
  const pts: Record<string, V3> = {};
  const lines: Record<string, V3[]> = {};
  const dim = o.dim;
  const lit = (id: string, groups?: readonly string[]) => !dim || dim.k <= 0.001 || dim.ids.includes(id) || (groups ?? []).some((g) => dim.ids.includes(g));
  const dk = (id: string, groups?: readonly string[]) => (lit(id, groups) ? 1 : 1 - 0.78 * (dim?.k ?? 0));
  const born = clamp01(s.lungs);
  const wall = 1 - 0.4 * clamp01(o.glass ?? 0);

  const vessel = (key: string, id: string, line: V3[], color: string, r: number | ((u: number) => number), extra: Partial<Item3> = {}) => {
    lines[key] = line;
    items.push({
      key: `c-${key}`,
      id,
      ...tubeParts(line, { radius: typeof r === 'number' ? () => r : r, ref: [0, 0, 1], sides: 14, capStart: true, capEnd: true }),
      color,
      deep: mixHex(color, '#120a10', 0.55),
      tissue: 'vessel',
      ...extra,
      opacity: (extra.opacity ?? 1) * wall * dk(id, extra.groups),
    });
  };
  const mid = (l: V3[], f = 0.5) => l[Math.min(l.length - 1, Math.round((l.length - 1) * f))];

  // ———— heart: the atria as two lobes on top, the ventricles one cone; each cavity tinted by its side (right venous, left arterial) ————
  const glass = lerp(0.3, 0.2, s.open);
  const atrium = (key: string, id: string, c: { c: V3; r: V3 }, tint: string) => {
    items.push({ key: `c-${key}`, id, groups: ['bihotza'], ...blobParts({ center: c.c, radii: c.r, rings: 18, sides: 26 }), color: mixHex(CC.myo, tint, 0.35), deep: CC.myoDeep, tissue: 'muscle', opacity: glass * dk(id), outline: true, thin: 0.5 });
  };
  atrium('ra', 'eskuineko-aurikula', RA, CC.rightSide);
  atrium('la', 'ezkerreko-aurikula-jaiotakoan', LA, CC.leftSide);
  {
    const apex = norm([0.42, -0.78, 0.46]);
    const side = norm([0.75, 0.2, -0.45]);
    const depth = norm([apex[1] * side[2] - apex[2] * side[1], apex[2] * side[0] - apex[0] * side[2], apex[0] * side[1] - apex[1] * side[0]]);
    const taper = (d: V3) => 1 - 0.38 * Math.max(0, d[1]) ** 1.6 + 0.04 * Math.max(0, -d[1]);
    items.push({ key: 'c-vent', groups: ['bihotza', 'eskuineko-bentrikulua', 'ezkerreko-bentrikulua'], ...blobParts({ center: [0.25, -0.62, 0.62], radii: [1.0, 1.08, 0.82], axes: [side, apex, depth], shape: taper, rings: 22, sides: 30 }, 'ventricles13'), color: CC.myo, deep: CC.myoDeep, tissue: 'muscle', opacity: 0.2 * dk('bihotza', ['eskuineko-bentrikulua', 'ezkerreko-bentrikulua']), outline: true, thin: 0.5, quiet: true });
    const cavity = (key: string, id: string, c: { c: V3; r: V3 }, tint: string) =>
      items.push({ key: `c-${key}`, id, groups: ['bihotza'], ...blobParts({ center: c.c, radii: c.r, rings: 16, sides: 22 }), color: tint, deep: mixHex(tint, '#10101a', 0.6), tissue: 'muscle', opacity: 0.3 * dk(id), outline: false });
    cavity('rv', 'eskuineko-bentrikulua', RV, CC.rightSide);
    cavity('lv', 'ezkerreko-bentrikulua', LV, CC.leftSide);
  }
  pts['eskuineko-aurikula'] = add(RA.c, [-0.3, 0.32, 0.25]);
  pts['ezkerreko-aurikula-jaiotakoan'] = add(LA.c, [0.25, 0.22, -0.1]);
  pts['eskuineko-bentrikulua'] = add(RV.c, [-0.15, -0.15, 0.35]);
  pts['ezkerreko-bentrikulua'] = add(LV.c, [0.25, -0.25, 0.2]);
  pts['bihotza'] = add(RV.c, [0.3, 0.3, 0.3]);

  // ———— interatrial septum: secundum (thick, above), primum (the valve, on the left) ————
  {
    const n = SEPT_N;
    const up: V3 = [0, 1, 0];
    const fw: V3 = norm([-0.1, 0, 1]);
    // Septum secundum: a thick crescent wall from the roof down to just above the foramen.
    const secC = add(FO, [-0.04, 0.3, 0]);
    items.push({ key: 'c-sec', id: 'septum-secundum', groups: ['aurikula-arteko-trenkada'], ...blobParts({ center: secC, radii: [0.06, 0.2, 0.32], axes: [n, up, fw], rings: 14, sides: 20 }), color: mixHex(CC.septum, '#d8c3b8', s.fuse), deep: '#7a4a48', tissue: 'muscle', opacity: 0.9 * dk('septum-secundum', ['aurikula-arteko-trenkada']), outline: true });
    pts['septum-secundum'] = add(secC, [-0.05, 0.08, 0.18]);
    // Septum primum: a thin flap hinged at the floor; before birth it swings into the left atrium, at birth it is pressed shut.
    const swing = (1 - clamp01(s.press)) * 0.55 + clamp01(s.patent) * 0.08;
    const hinge = add(FO, [0.08, -0.28, 0]);
    const dir = norm(add(sc(up, Math.cos(swing)), sc(n, Math.sin(swing))));
    const nn = norm(add(sc(n, Math.cos(swing)), sc(up, -Math.sin(swing))));
    const priC = add(hinge, sc(dir, 0.22));
    items.push({ key: 'c-pri', id: 'zulo-obalaren-balbula', groups: ['septum-primum', 'aurikula-arteko-trenkada'], ...blobParts({ center: priC, radii: [0.02, 0.22, 0.3], axes: [nn, dir, fw], rings: 12, sides: 20 }), color: mixHex(CC.valve, '#d8c3b8', s.fuse), deep: '#8c5a50', tissue: 'membrane', opacity: 0.85 * dk('zulo-obalaren-balbula', ['septum-primum']), outline: true, thin: 0.7 });
    pts['zulo-obalaren-balbula'] = add(priC, sc(dir, 0.06));
    pts['septum-primum'] = pts['zulo-obalaren-balbula'];
    // The opening's rim (limbus): a fine pale ring round the foramen, the way in from the right atrium.
    {
      const rim: V3[] = [];
      for (let i = 0; i <= 28; i++) {
        const a = (i / 28) * Math.PI * 2;
        rim.push(add(add(FO, [-0.05, 0.02, 0]), add(sc(up, 0.19 * Math.sin(a)), sc(fw, 0.26 * Math.cos(a)))));
      }
      const shut = clamp01(s.fuse) * (1 - 0.6 * clamp01(s.patent));
      items.push({ key: 'c-fo', id: 'zulo-obala', groups: ['aurikula-arteko-trenkada'], ...tubeParts(rim, { radius: () => 0.022, ref: n, sides: 8, capStart: false, capEnd: false }), color: '#ffe9c2', deep: '#8a6b4a', tissue: 'tendon', opacity: (1 - 0.7 * shut) * dk('zulo-obala', ['aurikula-arteko-trenkada']), outline: false });
    }
    pts['zulo-obala'] = add(FO, [-0.06, -0.15, 0.1]);
    pts['aurikula-arteko-trenkada'] = secC;
    // A slit that stays open in 20 % (a hairline glow under septum secundum).
    if (s.patent > 0.01)
      items.push({ key: 'c-slit', id: 'zulo-obala', ...tubeParts(L([add(FO, [0.02, 0.06, -0.3]), add(FO, [0.03, 0.1, 0]), add(FO, [0.02, 0.06, 0.3])], 8), { radius: () => 0.025, ref: [1, 0, 0], sides: 8, capStart: true, capEnd: true }), color: '#ffe3a3', deep: '#8a6b2a', tissue: 'membrane', opacity: clamp01(s.patent) * dk('zulo-obala'), outline: false });
  }
  // Interventricular septum and the two atrioventricular orifices (rings).
  items.push({ key: 'c-ivs', groups: ['bihotza'], ...blobParts({ center: [0.25, -0.75, 0.68], radii: [0.06, 0.55, 0.42], axes: [norm([1, 0, -0.55]), [0, 1, 0], norm([0.55, 0, 1])], rings: 12, sides: 18 }), color: CC.septum, deep: '#7a4a48', tissue: 'muscle', opacity: 0.6 * dk('bihotza'), outline: false, quiet: true });
  const ring = (key: string, id: string, c: V3, nrm: V3, r: number) => {
    const a = norm([nrm[1], -nrm[0], 0.0001 + nrm[2] * 0]);
    const b = norm([nrm[1] * a[2] - nrm[2] * a[1], nrm[2] * a[0] - nrm[0] * a[2], nrm[0] * a[1] - nrm[1] * a[0]]);
    const loop: V3[] = [];
    for (let i = 0; i <= 24; i++) {
      const t = (i / 24) * Math.PI * 2;
      loop.push(add(c, add(sc(a, r * Math.cos(t)), sc(b, r * Math.sin(t)))));
    }
    items.push({ key: `c-${key}`, id, ...tubeParts(loop, { radius: () => 0.03, ref: nrm, sides: 8, capStart: false, capEnd: false }), color: CC.valve, deep: '#8c5a50', tissue: 'tendon', opacity: 0.85 * dk(id), outline: false });
    pts[id] = add(c, sc(a, r));
  };
  ring('tric', 'eskuineko-zulo-ab', [-0.72, -0.22, 0.48], norm([0.4, -0.6, 0.6]), 0.24);
  ring('mitr', 'ezkerreko-zulo-ab', [0.62, -0.12, 0.05], norm([0.1, -0.8, 0.5]), 0.22);

  // ———— great arteries ————
  // Before birth the arteries carry mixed blood (the head's a little richer than the trunk's, the notes' 58 % below); after it, red.
  const aoCol = CC.artery;
  const upCol = aoCol;
  const lowCol = aoCol;
  vessel('asc', 'goranzko-aorta', CL.asc, upCol, 0.16, { groups: ['aorta'] });
  vessel('arch', 'aortaren-makoa', CL.arch, upCol, 0.155, { groups: ['aorta'] });
  vessel('desc', 'beheranzko-aorta', CL.desc, lowCol, (u: number) => lerp(0.15, 0.11, u), { groups: ['aorta'] });
  pts['goranzko-aorta'] = mid(CL.asc, 0.45);
  pts['aortaren-makoa'] = mid(CL.arch, 0.35);
  pts['beheranzko-aorta'] = mid(CL.desc, 0.45);
  pts['aorta'] = pts['aortaren-makoa'];
  vessel('bct', 'enbor-brakiozefalikoa', CL.bct, upCol, 0.085);
  vessel('rsa', 'enbor-brakiozefalikoa', CL.rsa, upCol, 0.06, { key: 'c-rsa' });
  vessel('lcc', 'karotida-komuna', CL.lcc, upCol, 0.065);
  vessel('lsa', 'ezkerreko-subklabioa', CL.lsa, upCol, 0.065);
  pts['enbor-brakiozefalikoa'] = mid(CL.bct, 0.35);
  pts['karotida-komuna'] = mid(CL.lcc, 0.45);
  pts['ezkerreko-subklabioa'] = mid(CL.lsa, 0.55);
  const ptCol = CC.pulm;
  vessel('pt', 'birika-enborra', CL.pt, ptCol, 0.15, { groups: ['birika-arteria'] });
  vessel('lpa', 'birika-arteria', CL.lpa, ptCol, (u: number) => lerp(0.09, 0.06, u) * lerp(0.85, 1.25, born));
  vessel('rpa', 'birika-arteria', CL.rpa, ptCol, (u: number) => lerp(0.09, 0.06, u) * lerp(0.85, 1.25, born), { key: 'c-rpa' });
  pts['birika-enborra'] = mid(CL.pt, 0.4);
  pts['birika-arteria'] = mid(CL.lpa, 0.55);
  pts['birika-arteriaR'] = mid(CL.rpa, 0.6);
  // Ductus arteriosus → ligamentum arteriosum.
  {
    const k = clamp01(s.daClose);
    const lig = k > 0.5;
    vessel('da', lig ? 'lotailu-arteriosoa' : 'hodi-arteriosoa', CL.da, mixHex(CC.pulm, CC.ligament, k), lerp(0.11, 0.04, k), { groups: ['hodi-arteriosoa', 'lotailu-arteriosoa'], tissue: lig ? 'tendon' : 'vessel' });
    pts[lig ? 'lotailu-arteriosoa' : 'hodi-arteriosoa'] = mid(CL.da, 0.5);
    pts['hodi-arteriosoa'] = mid(CL.da, 0.5);
    pts['lotailu-arteriosoa'] = mid(CL.da, 0.5);
  }
  // Pulmonary veins.
  for (const k of ['pvL1', 'pvL2', 'pvR1', 'pvR2'] as const) vessel(k, 'birika-zainak', CL[k], VC.o2, 0.05 * lerp(0.85, 1.2, born));
  pts['birika-zainak'] = mid(CL.pvL1, 0.4);

  // ———— aortic valve, sinuses of Valsalva, coronary arteries ————
  if (s.valsalva > 0.01) {
    const v = clamp01(s.valsalva);
    const root: V3 = [0.3, 0.02, 0.58];
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * Math.PI * 2 + 0.6;
      const c = add(root, [0.13 * Math.cos(a), 0.06, 0.13 * Math.sin(a)]);
      items.push({ key: `c-sinus${i}`, id: 'valsalva-sinuak', groups: ['aorta-balbula'], ...blobParts({ center: c, radii: [0.11, 0.12, 0.11], rings: 10, sides: 14 }), color: mixHex(aoCol, '#f2a19a', 0.35), deep: CC.arteryDeep, tissue: 'vessel', show: v, opacity: dk('valsalva-sinuak', ['aorta-balbula']), outline: true });
      items.push({ key: `c-cusp${i}`, id: 'aorta-balbula', ...blobParts({ center: add(root, [0.07 * Math.cos(a), 0.0, 0.07 * Math.sin(a)]), radii: [0.08, 0.02, 0.08], rings: 8, sides: 12 }), color: CC.valve, deep: '#8c5a50', tissue: 'membrane', show: v, opacity: dk('aorta-balbula'), outline: false, thin: 0.6 });
    }
    pts['valsalva-sinuak'] = add(root, [-0.15, 0.06, 0.12]);
    pts['aorta-balbula'] = add(root, [0.05, 0.0, 0.05]);
    vessel('corR', 'arteria-koronarioak', CL.corR, aoCol, 0.045, { show: v });
    vessel('corL', 'arteria-koronarioak', CL.corL, aoCol, 0.045, { show: v, key: 'c-corL' });
    pts['arteria-koronarioak'] = mid(CL.corL, 0.6);
  }

  // ———— lungs: small and fluid-filled before birth, inflating with the first breath ————
  for (const sd of [-1, 1]) {
    const c: V3 = X(sd, [1.72, 0.5, -0.42]);
    const k = lerp(0.86, 1.06, born);
    const mtx = frame(c, [0.62 * k, 0, 0], [0, 1.25 * k, 0], [0, 0, 0.85 * k]);
    items.push({ key: `c-lung${sd}`, id: 'birikak', ...blobParts({ center: [0, 0, 0], radii: [1, 1, 1], rings: 16, sides: 22 }), matrix: mtx, color: mixHex(CC.lungFetal, CC.lung, born), deep: CC.lungDeep, tissue: 'epithelium', opacity: lerp(0.26, 0.36, born) * dk('birikak'), outline: true });
  }
  pts['birikak'] = [2.05, 0.95, -0.2];
  pts['birikakR'] = [-2.05, 0.95, -0.2];

  // ———— iliac arteries, umbilical arteries and the bladder ————
  for (const sd of [-1, 1]) {
    const n = sd < 0 ? 'R' : 'L';
    vessel(`cia${n}`, 'arteria-iliako-primitiboak', CL.cia(sd), lowCol, 0.095);
    vessel(`eia${n}`, 'kanpoko-arteria-iliakoa', CL.eia(sd), lowCol, 0.07);
    vessel(`iia${n}`, 'barneko-arteria-iliakoa', CL.iia(sd), lowCol, 0.075);
    pts[`arteria-iliako-primitiboak${n}`] = mid(CL.cia(sd), 0.5);
    pts[`barneko-arteria-iliakoa${n}`] = mid(CL.iia(sd), 0.4);
    pts[`kanpoko-arteria-iliakoa${n}`] = mid(CL.eia(sd), 0.6);
    // Umbilical artery: proximal stretch (→ superior vesical artery) and the rest (→ medial umbilical ligament).
    const ua = CL.ua(sd);
    lines[`ua${n}`] = ua;
    const cut = 6;
    const prox = ua.slice(0, cut + 1);
    const dist = ua.slice(cut);
    const k = clamp01(s.uaClose);
    const lig = k > 0.5;
    const uaCol = VC.deo2;
    vessel(`uaP${n}`, lig ? 'goiko-gernu-maskuri-arteria' : 'zilbor-arteriak', prox, mixHex(uaCol, aoCol, k), 0.07, { groups: ['zilbor-arteriak', 'goiko-gernu-maskuri-arteria'] });
    vessel(`uaD${n}`, lig ? 'erdialdeko-zilbor-lotailua' : 'zilbor-arteriak', dist, mixHex(uaCol, CC.ligament, k), (u: number) => lerp(0.07, 0.035, k * ss(0, 0.15, u)), { groups: ['zilbor-arteriak', 'erdialdeko-zilbor-lotailua'], tissue: lig ? 'tendon' : 'vessel' });
    lines[`ua${n}`] = ua;
    pts[`zilbor-arteriak${n}`] = mid(ua, 0.6);
    pts[`erdialdeko-zilbor-lotailua${n}`] = mid(ua, 0.62);
    pts[`goiko-gernu-maskuri-arteria${n}`] = mid(prox, 0.75);
    if (sd > 0) pts['zilbor-arteriak'] = pts['zilbor-arteriakL'];
    // A short branch of the proximal stretch to the bladder.
    vessel(`sva${n}`, lig ? 'goiko-gernu-maskuri-arteria' : 'zilbor-arteriak', L([prox[prox.length - 1], X(sd, [0.55, -6.05, 0.55]), X(sd, [0.38, -5.95, 0.7])], 6), mixHex(uaCol, aoCol, k), 0.035, { groups: ['zilbor-arteriak', 'goiko-gernu-maskuri-arteria'], key: `c-sva${n}` });
  }
  items.push({ key: 'c-bladder', id: 'gernu-maskuria', ...blobParts({ center: [0, -6.05, 0.72], radii: [0.42, 0.5, 0.36], rings: 14, sides: 20 }), color: CC.bladder, deep: '#7a5a1a', tissue: 'epithelium', opacity: 0.55 * dk('gernu-maskuria'), outline: false });
  pts['gernu-maskuria'] = [0.25, -6.25, 0.95];

  // ———— cord and placenta ————
  if (s.cord > 0.01) {
    const c = clamp01(s.cord);
    lines['cordV'] = CORD_V;
    items.push({ key: 'c-cordV', id: 'zilbor-zainak', groups: ['ezkerreko-zilbor-zaina'], ...tubeParts(CORD_V, { radius: () => 0.085, ref: [1, 0, 0], sides: 12, capStart: true, capEnd: true }), color: VC.o2, deep: '#5a1a1a', tissue: 'vessel', show: c, opacity: dk('zilbor-zainak', ['ezkerreko-zilbor-zaina']) });
    for (const sd of [-1, 1]) {
      const n = sd < 0 ? 'R' : 'L';
      const a = CORD_A(sd);
      lines[`cordA${n}`] = a;
      items.push({ key: `c-cordA${n}`, id: 'zilbor-arteriak', ...tubeParts(a, { radius: () => 0.055, ref: [1, 0, 0], sides: 10, capStart: true, capEnd: true }), color: VC.deo2, deep: '#1a2a5a', tissue: 'vessel', show: c, opacity: dk('zilbor-arteriak') });
    }
    // Wharton's jelly round the three vessels.
    items.push({ key: 'c-cord', id: 'behin-betiko-zilbor-hestea', ...tubeParts(CL.cordAxis, { radius: () => 0.24, ref: [1, 0, 0], sides: 18, capStart: true, capEnd: true }), color: CC.cord, deep: '#6a6478', tissue: 'membrane', show: c, opacity: 0.22 * dk('behin-betiko-zilbor-hestea'), outline: false });
    pts['behin-betiko-zilbor-hestea'] = mid(CL.cordAxis, 0.35);
    pts['zilbor-zainak-cord'] = mid(CORD_V, 0.6);
    // Placenta: a thick disc facing the cord, its villi a lobed surface.
    const pn = norm([0, -0.45, 1]);
    const lobes = (d: V3) => 1 + 0.06 * Math.sin(d[0] * 9) * Math.cos(d[2] * 7);
    items.push({ key: 'c-placenta', id: 'karena', ...blobParts({ center: PLACENTA_C, radii: [1.55, 1.35, 0.32], axes: [[1, 0, 0], norm([0, 1, 0.45]), pn], shape: lobes, rings: 18, sides: 30 }, 'placenta13'), color: CC.placenta, deep: CC.placentaDeep, tissue: 'muscle', show: c, opacity: 0.92 * dk('karena'), outline: true });
    pts['karena'] = add(PLACENTA_C, [0.9, 0.3, 0.2]);
  }
  return { items, pts, lines };
}
