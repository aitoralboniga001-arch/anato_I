import { add, cross, mix3, mul, norm, sub, type V3 } from '@/lib/three-d/math';
import { curve3, grid, merge, type Mesh } from '@/lib/three-d/mesh';
import { cachedMesh } from '@/lib/three-d/mesh-cache';
import type { Item3 } from '@/lib/three-d/scene';
import { blobParts, mixHex, tubeParts } from '@/components/scenes/week10/model3d';
import { T } from '@/components/scenes/week10/common';
import { EC } from '@/components/scenes/week12/embryo-model';
import { GC } from './gut3d';

/**
 * Topic 14, stages 6–16 (notes 3–3.6): the foregut's derivatives in the trunk, in 3D. One posed model:
 * the oesophagus with the trachea, lungs and the descending heart; the stomach and its two rotations; the
 * dorsal mesogastrium (spleen, gastrosplenic and splenorenal ligaments, greater omentum) and the omental
 * bursa it leaves behind the stomach; the ventral mesogastrium (lesser omentum, falciform ligament) with the
 * liver; the duodenum's C loop, its rotation and the mesoduodenum fusing with the posterior wall; the bile
 * ducts and gallbladder; the two pancreatic buds and their ducts.
 *
 * Axes (as every model of topics 10–14): x towards the embryo's LEFT, y cranial, z ventral. Seen from the
 * front the embryo's left is on the viewer's right. The diaphragm is at y ≈ 1.5, the posterior wall at
 * z ≈ −1.3, the anterior wall at z ≈ +1.4.
 *
 * The stomach is built from its two walls, painted from the start (the original posterior wall darker, the
 * anterior wall lighter), so the first rotation literally carries the posterior wall to the left. The
 * mesenteries are sheets between the organs and the walls, built from the organs' own points: when the stomach
 * turns, its dorsal mesogastrium is dragged to the left with it and the omental bursa opens behind it.
 */

// ———————————————————————————— colours ————————————————————————————

export const FC = {
  ...GC,
  /** The stomach's original posterior wall (→ left, greater curvature) and anterior wall (→ right). */
  postWall: '#ff8a2a',
  postWallDeep: '#8a3c08',
  antWall: '#ffd3a1',
  antWallDeep: '#9a6a3a',
  greater: '#ffe08a',
  /** The stomach's two ends (cardia, pylorus). */
  sphincter: '#f4b26b',
  lesser: '#fff4d6',
  striated: '#c8463f',
  smooth: T.visceral,
  vagus: '#f5d76e',
  autonomic: '#f2a65a',
  heart: '#b8323a',
  lung: '#f3a7b6',
  liver: EC.liver,
  liverDeep: EC.liverDeep,
  bare: '#5a2018',
  spleen: '#8e3b6b',
  gall: '#6fbf73',
  bile: '#9be36b',
  /** The notes' colours for the pancreatic buds: ventral blue, dorsal red. */
  pancV: '#3d7fe0',
  pancD: '#e0453a',
  duct: '#fff1b8',
  artery: T.aorta,
  portal: '#5b5fd6',
  colon: EC.sma,
  colonHind: EC.ima,
  kidney: '#c86b5a',
} as const;

const darker = (c: string) => mixHex(c, '#000000', 0.55);
const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
export const ss = (a: number, b: number, x: number) => {
  const u = clamp01((x - a) / (b - a));
  return u * u * (3 - 2 * u);
};
/** A liver, not an egg: the big right lobe, the thin left lobe tapering over the stomach, a flatter underside. */
const LIVER_SHAPE = (d: V3) => (1 - 0.48 * Math.max(0, d[0])) * (1 + 0.1 * Math.max(0, -d[0])) * (d[1] < 0 ? 1 - 0.32 * -d[1] : 1);

/** The ventral mesogastrium's derivatives stand for it as a group. */
const VM = 'mesogastrio-bentrala';
const lerp3 = (a: V3, b: V3, k: number): V3 => [lerp(a[0], b[0], k), lerp(a[1], b[1], k), lerp(a[2], b[2], k)];
const r3 = (v: number) => Math.round(v * 1000) / 1000;

// ———————————————————————————— pose ————————————————————————————

export interface ForePose {
  /** Thoracic context of the oesophagus: trachea, lungs, heart. */
  thorax: number;
  /** 0 = short oesophagus (the stomach high, the heart high, small lungs) → 1 = long (heart down, lungs grown). */
  oeso: number;
  /** The oesophagus's muscle coats: upper two thirds striated (vagus), lower third smooth (autonomic). */
  musc: number;
  /** The stomach's dilation. */
  dil: number;
  /** Rotation 1: 90° to the right about the long axis. */
  rotL: number;
  /** The left (originally posterior) wall's extra growth: greater curvature. */
  grow: number;
  /** The greater and lesser curvature lines drawn. */
  curv: number;
  /** Rotation 2: about the anteroposterior axis (cardia down-left, pylorus up-right). */
  rotAP: number;
  /** The dorsal mesogastrium (two layers). */
  meso: number;
  /** The omental bursa (the recess behind the stomach). */
  bursa: number;
  /** The spleen between the mesogastrium's layers (0..1 grows). */
  spleen: number;
  /** The greater omentum grows down (0..1) and its layers fuse (and the bursa's recess goes). */
  omentum: number;
  omFuse: number;
  /** The ventral mesogastrium: 1 = lesser omentum and falciform ligament drawn. */
  vmeso: number;
  /** The lesser omentum's two ligaments told apart; its free edge, Winslow and the edge's contents. */
  lesser: number;
  edge: number;
  /** The duodenum's C loop shown, its rotation to the right, the mesoduodenum's fusion with the posterior wall. */
  duod: number;
  duodRot: number;
  fuse: number;
  /** Duodenum told by parts (four colours of one tint, named). */
  duodParts: number;
  /** Double origin: foregut (orange) and midgut (pink) halves; the two arteries. */
  origin: number;
  /** Liver: 0 bud → 0.3 branches into the septum transversum → 1 grown. */
  liver: number;
  /** The liver's ligaments: falciform (and the round ligament in its free edge), coronary ligaments, bare area. */
  falc: number;
  round: number;
  coron: number;
  /** Gallbladder bud and cystic duct; the bile ducts named. */
  gall: number;
  /** Pancreatic buds: dorsal grows, ventral grows, ventral swings round (0..1 = 180° to the back) and fuses. */
  pancD: number;
  pancV: number;
  pancRot: number;
  /** The pancreas named by parts (head, body, tail; uncinate process). */
  pancParts: number;
  /** The pancreatic ducts (pancreas see-through). */
  ducts: number;
  /** Abdominal context: posterior wall, aorta, inferior vena cava, kidneys. */
  abdomen: number;
  /** Transverse colon and small intestine (context of the omentum). */
  bowel: number;
  /** The anterior abdominal wall (falciform). */
  front: number;
  /** Langerhans islets dotted through the pancreas (the endocrine part). */
  islets: number;
  /** The parietal peritoneum drawn over what has become retroperitoneal (duodenum 2–4, pancreas). */
  veil: number;
}

export const FP0: ForePose = {
  thorax: 0, oeso: 1, musc: 0, dil: 1, rotL: 0, grow: 0, curv: 0, rotAP: 0, meso: 0, bursa: 0, spleen: 0, omentum: 0, omFuse: 0,
  vmeso: 0, lesser: 0, edge: 0, duod: 0, duodRot: 0, fuse: 0, duodParts: 0, origin: 0, liver: 1, falc: 0, round: 0, coron: 0, gall: 0,
  pancD: 0, pancV: 0, pancRot: 0, pancParts: 0, ducts: 0, abdomen: 1, bowel: 0, front: 0, islets: 0, veil: 0,
};

/** The adult-like end of part 1: every rotation and fusion done. */
export const FP_DONE: ForePose = {
  ...FP0, rotL: 1, grow: 1, rotAP: 1, meso: 1, bursa: 1, spleen: 1, omentum: 1, omFuse: 1, vmeso: 1, lesser: 1, duod: 1, duodRot: 1, fuse: 1,
  liver: 1, falc: 1, round: 1, coron: 1, gall: 1, pancD: 1, pancV: 1, pancRot: 1, bowel: 1,
};

export interface ForeOpts {
  dim?: { ids: readonly string[]; k: number } | null;
  /** See-through liver (to show what lies behind it). */
  liverGlass?: number;
  /** Everything above the stomach faint (the top view of the bursa). */
  topCut?: number;
  /** Clear the view in front of the duodenum and pancreas: greater omentum, colon and small-intestine loops faint. */
  clear?: number;
  /** The diaphragm's opacity. */
  diaphragm?: number;
}

export interface ForeModel {
  items: Item3[];
  pts: Record<string, V3>;
}

// ———————————————————————————— geometry helpers ————————————————————————————

const tubeOf = (pts: readonly V3[], r: (u: number) => number, sides = 16) => tubeParts(pts, { radius: r, ref: [0, 0, 1], sides, capStart: true, capEnd: true });

/** The reverse side of a mesh (a sheet seen from behind). */
function flipped(m: Mesh): Mesh {
  const idx = new Uint32Array(m.idx.length);
  for (let i = 0; i < idx.length; i += 3) {
    idx[i] = m.idx[i];
    idx[i + 1] = m.idx[i + 2];
    idx[i + 2] = m.idx[i + 1];
  }
  return { pos: m.pos, nrm: m.nrm.map((v) => -v), uv: m.uv, idx };
}

/** A sheet through rows of points (each row one line across; rows run along), seen from both sides. */
function sheetMesh(key: string, rows: readonly (readonly V3[])[], offset = 0): Mesh {
  const nu = rows.length - 1;
  const nv = rows[0].length - 1;
  const deps = rows.flat(2).map(r3);
  deps.push(offset);
  return cachedMesh(`fsheet:${key}`, deps, () => {
    // Offset along the sheet's normal at the middle (two layers of a meso are two such sheets).
    const a = rows[Math.floor(nu / 2)][Math.floor(nv / 2)];
    const du = sub(rows[Math.min(nu, Math.floor(nu / 2) + 1)][Math.floor(nv / 2)], rows[Math.max(0, Math.floor(nu / 2) - 1)][Math.floor(nv / 2)]);
    const dv = sub(rows[Math.floor(nu / 2)][Math.min(nv, Math.floor(nv / 2) + 1)], rows[Math.floor(nu / 2)][Math.max(0, Math.floor(nv / 2) - 1)]);
    const n = norm(cross(du, dv));
    const o = mul(n, offset);
    const m = grid(nu, nv, (u, v) => add(rows[Math.round(u * nu)][Math.round(v * nv)], o), add(a, mul(n, 50)));
    return merge([m, flipped(m)]);
  });
}

/** Points along a polyline (resampled smooth). */
const L = (kps: readonly V3[], n = 20) => curve3(kps, n);

/** Rotations about y (the long axis) and z (the anteroposterior axis). */
const rotY = (v: V3, a: number): V3 => [v[0] * Math.cos(a) + v[2] * Math.sin(a), v[1], -v[0] * Math.sin(a) + v[2] * Math.cos(a)];
const rotZ = (v: V3, a: number): V3 => [v[0] * Math.cos(a) - v[1] * Math.sin(a), v[0] * Math.sin(a) + v[1] * Math.cos(a), v[2]];

// ———————————————————————————— the stomach ————————————————————————————

const ST_LEN = 0.72;
/** How much higher the stomach, diaphragm and septum sit while the oesophagus is still short. */
const HIGH = (p: ForePose) => (1 - clamp01(p.oeso)) * 0.8;
/** Rotation 2's final angle (the long axis ends oblique: upper left → lower right). */
const AP_ANGLE = (-52 * Math.PI) / 180;

/** The stomach's placement: local (x left, y along the axis from the pylorus up to the cardia, z ventral) → world. */
function stomachFrame(p: ForePose) {
  const phi = (-Math.PI / 2) * clamp01(p.rotL);
  const psi = AP_ANGLE * clamp01(p.rotAP);
  const high = HIGH(p);
  const c0: V3 = [0, 0.62 + high, -0.5];
  const c1: V3 = [0.42, 0.62, -0.25];
  const centre = lerp3(c0, c1, clamp01(0.45 * p.rotL + 0.55 * p.rotAP));
  const R = (v: V3) => rotZ(rotY(v, phi), psi);
  return { R, at: (q: V3) => add(centre, R(q)), centre };
}

/** A local point of the stomach's wall: u from the cardia (0) to the pylorus (1), a round the axis (0 = left, π/2 = ventral). */
function stomachLocal(p: ForePose, u: number, a: number, k = 1): V3 {
  const y = ST_LEN - 2 * ST_LEN * u;
  const s = Math.sin(Math.PI * u);
  const dil = clamp01(p.dil);
  const g = clamp01(p.grow);
  const r = (lerp(0.11, 0.12, u) + dil * (0.19 + 0.07 * g) * Math.pow(s, 0.75)) * k;
  // The dorsal wall grows more: its border bulges (the future greater curvature).
  const dorsal = Math.max(0, -Math.sin(a));
  const bulge = 1 + 0.7 * g * s * dorsal * dorsal;
  return [r * Math.cos(a), y, r * Math.sin(a) * bulge - 0.06 * g * s];
}

/** A wall of the stomach (a0..a0+π) as a mesh. */
function stomachHalf(p: ForePose, a0: number, key: string, cut = 0): Mesh {
  const F = stomachFrame(p);
  const deps = [p.dil, p.grow, p.rotL, p.rotAP, p.oeso, cut].map(r3);
  return cachedMesh(`stomach:${key}`, deps, () => {
    const am = a0 + Math.PI / 2;
    const mid = F.at(stomachLocal(p, 0.5, am));
    const out = F.R([Math.cos(am), 0, Math.sin(am)]);
    const g = grid(26, 12, (u, v) => F.at(stomachLocal(p, lerp(cut, 1, u), a0 + Math.PI * v)), add(mid, mul(out, 50)));
    // Cut open (the transverse section seen from above): its inside shows too.
    return cut > 0.001 ? merge([g, flipped(g)]) : g;
  });
}

/** A line along the stomach's wall at angle a (the curvatures), a hair outside it. */
const stomachLine = (p: ForePose, a: number, u0 = 0.04, u1 = 0.96, n = 22) => {
  const F = stomachFrame(p);
  return Array.from({ length: n + 1 }, (_, i) => F.at(stomachLocal(p, lerp(u0, u1, i / n), a, 1.04)));
};

// ———————————————————————————— the duodenum ————————————————————————————

/**
 * The C loop in its own plane: a along the loop's opening direction (ventral before the rotation, the
 * embryo's right after it), b down. Parts: 1st (bulb) to the right, 2nd down, 3rd back to the left, 4th up
 * and left, then the jejunum.
 */
const LOOP: readonly (readonly [number, number])[] = [
  [0, 0],
  [0.28, 0.02],
  [0.52, -0.02],
  [0.64, -0.14],
  [0.68, -0.4],
  [0.64, -0.66],
  [0.5, -0.8],
  [0.2, -0.86],
  [-0.12, -0.84],
  [-0.36, -0.76],
  [-0.46, -0.6],
  [-0.48, -0.46],
];
/** Where each part ends along the loop (index into the resampled line, as fractions). */
const PART_U = [0, 0.2, 0.52, 0.8, 1] as const;
const N_LOOP = 60;

export function duodenumLine(p: ForePose) {
  const F = stomachFrame(p);
  // The pylorus point is the centre of the stomach's end ring.
  const end = F.at([0, -ST_LEN, 0]);
  const th = (Math.PI / 2) * clamp01(p.duodRot);
  const D: V3 = [-Math.sin(th), 0, Math.cos(th)];
  const fuse = clamp01(p.fuse);
  const keys = LOOP.map(([a, b], i): V3 => {
    const q = add(add(end, mul(D, a)), [0, b - 0.04, 0]);
    // Against the posterior wall once fused (the bulb stays free).
    const w = fuse * ss(1, 3, i);
    return [q[0], q[1], lerp(q[2], -0.92, w)];
  });
  return L([end, ...keys.slice(1)], N_LOOP);
}

/** The jejunum beyond the duodenojejunal flexure: a few loops in front (context, intraperitoneal). */
function jejunumLine(start: V3) {
  return L([start, add(start, [0.25, -0.2, 0.35]), [0.55, -1.35, 0.35], [-0.2, -1.55, 0.45], [-0.55, -1.95, 0.3], [0.2, -2.2, 0.45], [0.65, -2.0, 0.25]], 50);
}

// ———————————————————————————— the model ————————————————————————————

export function foreModel(pose: ForePose, o: ForeOpts = {}): ForeModel {
  const items: Item3[] = [];
  const pts: Record<string, V3> = {};
  const dim = o.dim;
  const lit = (id: string, groups?: readonly string[]) => !dim || dim.k <= 0.001 || dim.ids.includes(id) || (groups ?? []).some((g) => dim.ids.includes(g));
  const fade = (id: string, groups?: readonly string[], k = 0.8) => (lit(id, groups) ? 1 : 1 - k * (dim?.k ?? 0));
  // Opaque organs stay opaque when lit (a solid tube drawn see-through shows its inside).
  const solid = (id: string, groups?: readonly string[]) => fade(id, groups, 0.75);
  const top = clamp01(o.topCut ?? 0);
  const clr = 1 - 0.92 * clamp01(o.clear ?? 0);
  const F = stomachFrame(pose);

  // ———— walls and the retroperitoneal context ————
  const ab = clamp01(pose.abdomen);
  if (ab > 0.01) {
    const back = sheetMesh('backwall', Array.from({ length: 9 }, (_, i) => Array.from({ length: 9 }, (_, j): V3 => {
      const x = lerp(-1.9, 1.9, j / 8);
      return [x, lerp(1.45, -2.7, i / 8), -1.32 - 0.12 * (x * x) / 3.6];
    })));
    items.push({ key: 'backwall', id: 'paretako-peritoneoa', mesh: back, color: FC.parietal, deep: darker(FC.parietal), tissue: 'membrane', opacity: 0.4 * ab * fade('paretako-peritoneoa'), thin: 0.6, outline: false });
    pts['paretako-peritoneoa'] = [-0.7, 0.2, -1.36];
    const aorta = L([[0, 4.6, -1.08], [0, 1.5, -1.08], [0, -2.7, -1.08]], 10);
    items.push({ key: 'aorta', id: 'aorta', ...tubeOf(aorta, () => 0.1, 14), color: FC.artery, deep: darker(FC.artery), tissue: 'vessel', opacity: ab * fade('aorta') });
    pts['aorta'] = [0, -1.6, -0.98];
    const ivc = L([[-0.42, -2.7, -1.0], [-0.42, 0.4, -0.98], [-0.4, 1.4, -0.7], [-0.25, 2.2, -0.4]], 12);
    items.push({ key: 'ivc', id: 'beheko-kaba-zaina', ...tubeOf(ivc, () => 0.1, 14), color: FC.ivc, deep: darker(FC.ivc), tissue: 'vessel', opacity: ab * fade('beheko-kaba-zaina') });
    pts['beheko-kaba-zaina'] = [-0.42, -1.7, -0.9];
    for (const s of [-1, 1] as const) {
      items.push({ key: `kid${s}`, id: 'giltzurruna', ...blobParts({ center: [s * 1.08, -0.95, -1.12], radii: [0.28, 0.52, 0.22], rings: 12, sides: 16 }), color: FC.kidney, deep: darker(FC.kidney), tissue: 'epithelium', opacity: ab * solid('giltzurruna') });
    }
    pts['giltzurruna'] = [1.08, -1.05, -0.92];
  }
  // The anterior abdominal wall (the falciform ligament's attachment).
  const fr = clamp01(pose.front);
  if (fr > 0.01) {
    const front = sheetMesh('frontwall', Array.from({ length: 7 }, (_, i) => Array.from({ length: 7 }, (_, j): V3 => {
      const x = lerp(-1.7, 1.7, j / 6);
      return [x, lerp(1.45, -1.4, i / 6), 1.42 + 0.1 * (x * x) / 2.9];
    })));
    items.push({ key: 'frontwall', id: 'paretako-peritoneoa', mesh: front, color: FC.parietal, deep: darker(FC.parietal), tissue: 'membrane', opacity: 0.16 * fr * fade('paretako-peritoneoa'), thin: 0.6, outline: false });
    if (fr > 0.5) pts['paretako-peritoneoa'] = [-0.9, -0.4, 1.46];
  }

  // ———— the diaphragm (septum transversum's derivative) ————
  {
    const dia = o.diaphragm ?? 0.34;
    if (dia > 0.01) {
      const m = sheetMesh('diaphragm', Array.from({ length: 9 }, (_, i) => Array.from({ length: 13 }, (_, j): V3 => {
        const a = (j / 12) * Math.PI * 2;
        const r = i / 8;
        const x = 1.75 * r * Math.cos(a);
        const z = 0.05 + 1.3 * r * Math.sin(a);
        return [x, 1.5 + HIGH(pose) + 0.38 * (1 - r * r), z];
      })));
      items.push({ key: 'diaphragm', id: 'diafragma', mesh: m, color: FC.septum, deep: FC.septumDeep, tissue: 'membrane', opacity: dia * (1 - 0.8 * top) * fade('diafragma', undefined, 0.6), thin: 0.6, outline: false });
      pts['diafragma'] = [1.2, 1.62 + HIGH(pose), 0.3];
    }
  }

  // ———— thorax: trachea, lungs, heart (the oesophagus lengthens as the heart descends and the lungs grow) ————
  const th = clamp01(pose.thorax) * (1 - top);
  const oe = clamp01(pose.oeso);
  if (th > 0.01) {
    const tr = L([[0, lerp(3.95, 4.55, oe), 0.02], [0, lerp(3.45, 3.6, oe), 0.04], [0, lerp(3.2, 2.95, oe), 0.02]], 10);
    const tEnd = tr[tr.length - 1];
    items.push({ key: 'trachea', id: 'trakea', ...tubeOf(tr, () => 0.085, 14), color: FC.resp, deep: FC.respDeep, tissue: 'epithelium', opacity: th * solid('trakea') });
    pts['trakea'] = tr[3];
    const lungS = lerp(0.42, 1, oe);
    for (const s of [-1, 1] as const) {
      const br = L([tEnd, add(tEnd, [s * 0.3, -0.12, -0.02]), [s * 0.62, lerp(2.95, 2.7, oe), -0.12]], 8);
      items.push({ key: `br${s}`, id: 'birikak', ...tubeOf(br, () => 0.06, 10), color: FC.resp, deep: FC.respDeep, tissue: 'epithelium', opacity: th * solid('birikak') });
      items.push({ key: `lung${s}`, id: 'birikak', ...blobParts({ center: [s * (0.42 + 0.4 * lungS), lerp(2.85, 2.55, oe), -0.15], radii: [0.36 * lungS, 0.72 * lungS, 0.5 * lungS], rings: 14, sides: 18 }), color: FC.lung, deep: darker(FC.lung), tissue: 'epithelium', opacity: th * solid('birikak') });
    }
    pts['birikak'] = [0.42 + 0.4 * lungS + 0.2 * lungS, lerp(2.85, 2.55, oe), 0.05];
    const hc: V3 = [0.12, lerp(3.55, 2.25, oe), 0.62];
    items.push({ key: 'heart', id: 'bihotza', ...blobParts({ center: hc, radii: [0.46, 0.5, 0.42], rings: 14, sides: 18 }), color: FC.heart, deep: darker(FC.heart), tissue: 'muscle', opacity: th * solid('bihotza') });
    pts['bihotza'] = add(hc, [-0.2, 0.1, 0.2]);
  }

  // ———— the oesophagus: from the pharynx down through the diaphragm to the cardia ————
  const cardia = F.at([0, ST_LEN, 0]);
  {
    const topP: V3 = [0, lerp(3.95, 4.55, oe), -0.32];
    const keys: V3[] = Array.from({ length: 7 }, (_, k): V3 => {
      const f = k / 6;
      return [lerp(topP[0], cardia[0], f ** 3), lerp(topP[1], cardia[1], f), lerp(topP[2], cardia[2], f * f)];
    });
    const line = L(keys, 40);
    const op = (1 - 0.95 * top) * solid('hestegorria');
    items.push({ key: 'oeso', id: 'hestegorria', groups: ['aurreko-hestea'], ...tubeOf(line, () => 0.08, 14), color: FC.endo, deep: FC.endoDeep, tissue: 'epithelium', opacity: op });
    pts['hestegorria'] = line[Math.round(line.length * 0.5)];
    const mu = clamp01(pose.musc);
    if (mu > 0.01) {
      // The coats round the endodermal lining, open towards the viewer's side so the lining shows.
      const coat = (key: string, id: string, u0: number, u1: number, color: string) => {
        const seg = line.slice(Math.round(u0 * (line.length - 1)), Math.round(u1 * (line.length - 1)) + 1);
        const m = cachedMesh(`coat:${key}`, seg.flat().map(r3), () => {
          const rows = seg.map((c, i) => {
            const t = norm(sub(seg[Math.min(seg.length - 1, i + 1)], seg[Math.max(0, i - 1)]));
            const n1 = norm(cross(t, [1, 0, 0]));
            const n2 = cross(n1, t);
            return Array.from({ length: 13 }, (_, j): V3 => {
              const a = Math.PI * 0.55 + (j / 12) * Math.PI * 1.55;
              return add(c, add(mul(n1, 0.115 * Math.cos(a)), mul(n2, 0.115 * Math.sin(a))));
            });
          });
          const g = grid(rows.length - 1, 12, (u, v) => rows[Math.round(u * (rows.length - 1))][Math.round(v * 12)]);
          return merge([g, flipped(g)]);
        });
        items.push({ key, id, groups: ['hestegorria'], mesh: m, color, deep: darker(color), tissue: 'muscle', opacity: mu * (1 - 0.85 * top) * solid(id, ['hestegorria']) });
        pts[id] = seg[Math.round(seg.length * 0.45)];
      };
      coat('coatS', 'hestegorriko-muskulu-ilaskatua', 0.02, 0.66, FC.striated);
      coat('coatL', 'hestegorriko-muskulu-lisoa', 0.66, 0.98, FC.smooth);
      // The vagus nerve's motor fibres to the upper two thirds; autonomic fibres to the lower third.
      for (const s of [-1, 1] as const) {
        const v = line.slice(0, Math.round(0.66 * (line.length - 1)) + 1).map((p, i) => add(p, [s * 0.15, 0, -0.05 + 0.01 * i * 0]));
        items.push({ key: `vag${s}`, id: 'nerbio-bagoa', ...tubeOf(v, () => 0.022, 8), color: FC.vagus, deep: darker(FC.vagus), tissue: 'nerve', opacity: mu * (1 - 0.85 * top) * solid('nerbio-bagoa') });
        const a = line.slice(Math.round(0.66 * (line.length - 1))).map((p) => add(p, [s * 0.15, 0, -0.06]));
        items.push({ key: `aut${s}`, id: 'nerbio-sistema-begetatiboa', ...tubeOf(a, () => 0.02, 8), color: FC.autonomic, deep: darker(FC.autonomic), tissue: 'nerve', opacity: mu * (1 - 0.85 * top) * solid('nerbio-sistema-begetatiboa') });
      }
      pts['nerbio-bagoa'] = add(line[Math.round(line.length * 0.3)], [0.16, 0, -0.05]);
      pts['nerbio-sistema-begetatiboa'] = add(line[Math.round(line.length * 0.85)], [0.16, 0, -0.06]);
    }
  }

  // ———— the stomach: two painted walls ————
  {
    const op = solid('urdaila');
    // From above (topCut) the stomach is cut across at its middle, as the notes' transverse section.
    const cut = 0.5 * ss(0.3, 1, top);
    items.push({ key: 'stPost', id: 'urdaila', groups: ['aurreko-hestea', 'errai-peritoneoa'], mesh: stomachHalf(pose, Math.PI, 'post', cut), color: FC.postWall, deep: FC.postWallDeep, tissue: 'epithelium', opacity: op });
    items.push({ key: 'stAnt', id: 'urdaila', groups: ['aurreko-hestea', 'errai-peritoneoa'], mesh: stomachHalf(pose, 0, 'ant', cut), color: FC.antWall, deep: FC.antWallDeep, tissue: 'epithelium', opacity: op });
    if (cut > 0.01) {
      // The cut face, filled like a sliced specimen: each half in its own wall's colour, and the cut edge.
      const centre = F.at([0, ST_LEN - 2 * ST_LEN * cut, 0]);
      for (const [key, a0, c] of [['capP', Math.PI, FC.postWall], ['capA', 0, FC.antWall]] as const) {
        const rim = Array.from({ length: 17 }, (_, i) => F.at(stomachLocal(pose, cut, a0 + (Math.PI * i) / 16, 1.0)));
        const cap = cachedMesh(`stcap:${key}`, rim.flat().map(r3), () => {
          const g = grid(16, 1, (u, v) => lerp3(centre, rim[Math.round(u * 16)], v), add(centre, F.R([0, 50, 0])));
          return merge([g, flipped(g)]);
        });
        const face = mixHex(c, '#ffffff', 0.12);
        items.push({ key, id: 'urdaila', groups: ['aurreko-hestea', 'errai-peritoneoa'], mesh: cap, color: face, deep: darker(face), tissue: 'epithelium', opacity: op });
        items.push({ key: `${key}rim`, id: 'urdaila', groups: ['aurreko-hestea'], ...tubeOf(rim, () => 0.012, 8), color: darker(c), deep: darker(darker(c)), tissue: 'epithelium', opacity: op });
      }
    }
    const uw = cut > 0.01 ? cut + 0.04 : 0.45;
    pts['urdaila'] = F.at(stomachLocal(pose, Math.max(0.42, uw), Math.PI * 0.25, 0.9));
    pts['urdail-atzeko-pareta'] = F.at(stomachLocal(pose, uw, -Math.PI / 2, 0.92));
    pts['urdail-aurreko-pareta'] = F.at(stomachLocal(pose, uw, Math.PI / 2, 0.92));
    // The two ends as their own short sleeves (named parts are drawn pieces): cardia above, pylorus below.
    const sleeve = (key: string, id: string, u0: number, u1: number) => {
      const n = 8;
      const line = Array.from({ length: n + 1 }, (_, i) => F.at([0, ST_LEN - 2 * ST_LEN * lerp(u0, u1, i / n), 0]));
      const rad = (u: number) => {
        const q = stomachLocal(pose, lerp(u0, u1, u), 0);
        return Math.hypot(q[0], 0) * 1.05 + 0.006;
      };
      const shown = u0 < cut ? 0 : 1;
      if (shown) items.push({ key, id, groups: ['urdaila'], ...tubeOf(line, rad, 18), color: FC.sphincter, deep: darker(FC.sphincter), tissue: 'epithelium', opacity: op * solid(id, ['urdaila']) });
      pts[id] = F.at(stomachLocal(pose, (u0 + u1) / 2, Math.PI * 0.3, 1.02));
    };
    sleeve('cardia', 'kardiasa', 0, 0.1);
    sleeve('pylorus', 'piloroa', 0.9, 1);
    const cv = clamp01(pose.curv);
    if (cv > 0.01) {
      const gl = stomachLine(pose, -Math.PI / 2, Math.max(0.04, cut));
      const ll = stomachLine(pose, Math.PI / 2, Math.max(0.04, cut));
      items.push({ key: 'greater', id: 'makurdura-handia', groups: ['urdaila'], ...tubeOf(gl, () => 0.035, 8), color: FC.greater, deep: darker(FC.greater), tissue: 'epithelium', opacity: cv * solid('makurdura-handia', ['urdaila']) });
      items.push({ key: 'lesser', id: 'makurdura-txikia', groups: ['urdaila'], ...tubeOf(ll, () => 0.03, 8), color: FC.lesser, deep: darker(FC.lesser), tissue: 'epithelium', opacity: cv * solid('makurdura-txikia', ['urdaila']) });
      pts['makurdura-handia'] = gl[Math.round(gl.length * 0.45)];
      pts['makurdura-txikia'] = ll[Math.round(ll.length * 0.5)];
    }
  }

  // ———— the dorsal mesogastrium: two layers from the posterior wall to the greater curvature; the spleen between them ————
  const me = clamp01(pose.meso);
  const spl = clamp01(pose.spleen);
  const spleenC: V3 = [1.38, 0.88, -0.72];
  if (me > 0.01) {
    const n = 14;
    const gc = stomachLine(pose, -Math.PI / 2, Math.max(0.08, 0.5 * ss(0.3, 1, top)), 0.95, n);
    const wall = gc.map((g): V3 => [0.04, g[1], -1.26]);
    const mid = gc.map((g, i): V3 => {
      const m = mix3(wall[i], g, 0.5);
      const w = spl * Math.exp(-(((i / n - 0.3) / 0.3) ** 2));
      return lerp3(m, add(spleenC, [0, (g[1] - spleenC[1]) * 0.35, 0]), 0.85 * w);
    });
    const rowsA = gc.map((_, i) => [wall[i], mix3(wall[i], mid[i], 0.5), mid[i]]);
    const rowsB = gc.map((g, i) => [mid[i], mix3(mid[i], g, 0.5), g]);
    const named = spl > 0.3;
    const parts: [string, string, V3[][]][] = [
      ['mgA', named ? 'lotailu-esplenoerrenala' : 'mesogastrio-dortsala', rowsA],
      ['mgB', named ? 'lotailu-gastroesplenikoa' : 'mesogastrio-dortsala', rowsB],
    ];
    for (const [key, id, rows] of parts) {
      const groups = id === 'mesogastrio-dortsala' ? undefined : ['mesogastrio-dortsala'];
      const op = 0.55 * me * (1 - 0.6 * top * 0) * fade(id, groups, 0.7);
      for (const s of [-1, 1] as const) items.push({ key: `${key}${s}`, id, groups, mesh: sheetMesh(`${key}${s}`, rows, s * 0.022), color: FC.visceral, deep: darker(FC.visceral), tissue: 'membrane', opacity: op, thin: 0.6, outline: false });
      pts[id] = rows[Math.round(n * 0.55)][1];
    }
    pts['mesogastrio-dortsala'] = rowsA[Math.round(n * 0.6)][2];
    if (spl > 0.01) {
      items.push({ key: 'spleen', id: 'barea', ...blobParts({ center: spleenC, radii: [0.22 * spl, 0.44 * spl, 0.3 * spl], rings: 14, sides: 18 }), color: FC.spleen, deep: darker(FC.spleen), tissue: 'epithelium', opacity: solid('barea') });
      pts['barea'] = add(spleenC, [0.12 * spl, 0.05, 0.12 * spl]);
    }
  }

  // ———— the omental bursa: the recess of the peritoneal cavity behind the stomach ————
  const bu = clamp01(pose.bursa);
  if (bu > 0.01) {
    const c = add(F.centre, [-0.38, -0.02, -0.48]);
    items.push({ key: 'bursa', id: 'poltsa-omentala', ...blobParts({ center: c, radii: [0.38 * bu, 0.36 * bu, 0.17 * bu], rings: 12, sides: 18 }), color: FC.cavity, deep: darker(FC.cavity), tissue: 'membrane', opacity: 0.55 * bu * fade('poltsa-omentala', undefined, 0.7), thin: 0.8, outline: false });
    pts['poltsa-omentala'] = add(c, [-0.15, 0, 0]);
  }

  // ———— the greater omentum: from the greater curvature down in front of the colon and small intestine, and back up ————
  const om = clamp01(pose.omentum);
  const bow = clamp01(pose.bowel);
  if (bow > 0.01) {
    const colon = L([[-1.3, -0.35, -0.55], [-1.25, -0.62, 0.0], [-0.3, -0.72, 0.12], [0.6, -0.68, 0.1], [1.25, -0.5, -0.05], [1.35, -0.3, -0.55]], 30);
    const k23 = Math.round(colon.length * 0.68);
    items.push({ key: 'colonA', id: 'zeharkako-kolona', ...tubeOf(colon.slice(0, k23 + 1), () => 0.15, 14), color: FC.colon, deep: darker(FC.colon), tissue: 'epithelium', opacity: bow * clr * solid('zeharkako-kolona') });
    items.push({ key: 'colonB', id: 'zeharkako-kolona', ...tubeOf(colon.slice(k23), () => 0.15, 14), color: FC.colonHind, deep: darker(FC.colonHind), tissue: 'epithelium', opacity: bow * clr * solid('zeharkako-kolona') });
    pts['zeharkako-kolona'] = add(colon[Math.round(colon.length * 0.42)], [0, 0, 0.12]);
    // The transverse mesocolon: the colon's dorsal link to the posterior wall.
    const mrows = colon.slice(3, colon.length - 3).filter((_, i) => i % 2 === 0).map((c): V3[] => [[c[0] * 0.8, c[1] + 0.05, -1.24], mix3([c[0] * 0.8, c[1] + 0.05, -1.24], c, 0.5), c]);
    items.push({ key: 'mesocolon', id: 'mesokolon-dortsala', mesh: sheetMesh('mesocolon', mrows), color: FC.visceral, deep: darker(FC.visceral), tissue: 'membrane', opacity: 0.4 * bow * clr * fade('mesokolon-dortsala', undefined, 0.7), thin: 0.6, outline: false });
    pts['mesokolon-dortsala'] = mrows[Math.round(mrows.length * 0.6)][1];
  }
  if (om > 0.01) {
    const n = 12;
    const gc = stomachLine(pose, -Math.PI / 2, 0.42, 0.97, n);
    const yb = lerp(Math.min(...gc.map((g) => g[1])) - 0.15, -2.45, om);
    const gap = 0.2 * (1 - clamp01(pose.omFuse)) + 0.03;
    const za = 0.72;
    // An apron: from the whole greater curvature it widens as it hangs, over the colon and the small intestine.
    const wide = (i: number) => lerp(1.25, -1.15, i / n);
    const ant = gc.map((g, i): V3[] => {
      const x = wide(i);
      return [g, [lerp(g[0], x, 0.35), g[1] - 0.12, lerp(g[2], za, 0.7)], [lerp(g[0], x, 0.8), lerp(g[1], yb, 0.4), za], [x, lerp(g[1], yb, 0.75), za], [x, yb, za - 0.02]];
    });
    const post = gc.map((_, i): V3[] => {
      const x = wide(i);
      return [[x, yb + 0.02, za - gap], [x, lerp(yb, -0.75, 0.4), za - gap], [x, lerp(yb, -0.75, 0.8), za - gap], [x * 0.95, -0.62, 0.28]];
    });
    const op = 0.62 * Math.min(1, om * 2) * clr * fade('epiploi-handia', undefined, 0.7);
    items.push({ key: 'omA', id: 'epiploi-handia', mesh: sheetMesh('omA', ant), color: '#f6d77a', deep: '#9a7f2a', tissue: 'membrane', opacity: op, thin: 0.7, outline: false });
    items.push({ key: 'omP', id: 'epiploi-handia', mesh: sheetMesh('omP', post), color: '#f0c860', deep: '#8a6f1a', tissue: 'membrane', opacity: op, thin: 0.7, outline: false });
    pts['epiploi-handia'] = ant[Math.round(n * 0.55)][3];
    // The bursa's lower recess between the omentum's two layers, gone once they fuse.
    const rec = (1 - clamp01(pose.omFuse)) * ss(0.2, 0.7, om) * Math.max(bu, 0.001);
    if (rec > 0.02) {
      const cx = 0.05;
      const c: V3 = [cx, (yb + -0.8) / 2, za - gap / 2];
      items.push({ key: 'recess', id: 'poltsa-omentala', ...blobParts({ center: c, radii: [1.0, Math.max(0.05, (-0.8 - yb) / 2), gap * 0.42], rings: 10, sides: 16 }), color: FC.cavity, deep: darker(FC.cavity), tissue: 'membrane', opacity: 0.6 * rec * clr * fade('poltsa-omentala', undefined, 0.7), thin: 0.8, outline: false });
      pts['poltsa-omentala-beheko'] = c;
    }
  }
  if (bow > 0.01) {
    const jj = jejunumLine([0.42, -0.95, -0.55]);
    items.push({ key: 'smallint', id: 'jejunoa', ...tubeOf(jj, () => 0.11, 12), color: FC.mid, deep: darker(FC.mid), tissue: 'epithelium', opacity: bow * clr * solid('jejunoa') });
    pts['jejunoa'] = jj[Math.round(jj.length * 0.6)];
  }

  // ———— the duodenum: the C loop, its rotation to the right, the mesoduodenum fusing with the posterior wall ————
  const du = clamp01(pose.duod);
  const dl = duodenumLine(pose);
  const papilla = dl[Math.round(N_LOOP * 0.38)];
  const D1end = dl[Math.round(N_LOOP * PART_U[1])];
  if (du > 0.01) {
    const partIds = ['duodenoaren-lehen-atala', 'duodenoaren-bigarren-atala', 'duodenoaren-hirugarren-atala', 'duodenoaren-laugarren-atala'];
    const pp = clamp01(pose.duodParts);
    const og = clamp01(pose.origin);
    const tint = [0, 0.18, 0.36, 0.54];
    // Double origin: the foregut's part (1st and the proximal 2nd) and the midgut's (distal 2nd, 3rd, 4th).
    const ORIGIN_U = 0.38;
    for (let k = 0; k < 4; k++) {
      const a = Math.round(N_LOOP * PART_U[k]);
      const b = Math.round(N_LOOP * PART_U[k + 1]);
      const id = pp > 0.5 ? partIds[k] : 'duodenoa';
      const groups = pp > 0.5 ? ['duodenoa'] : undefined;
      const base = mixHex(FC.fore, '#ffffff', 0.15);
      // Split a part at the origin border when it crosses it.
      const cut = Math.round(N_LOOP * ORIGIN_U);
      const pieces: [number, number, string][] = cut > a && cut < b ? [[a, cut, FC.fore], [cut, b, FC.mid]] : [[a, b, b <= cut ? FC.fore : FC.mid]];
      pieces.forEach(([i0, i1, oc], j) => {
        const c = mixHex(mixHex(base, '#3a1a00', tint[k] * pp * 0.6), oc, og);
        const seg = dl.slice(Math.max(0, i0 - 1), i1 + 2);
        items.push({ key: `duo${k}${j}`, id, groups, ...tubeOf(seg, () => 0.105, 14), color: c, deep: darker(c), tissue: 'epithelium', opacity: du * solid(id, groups) });
      });
      pts[partIds[k]] = dl[Math.round((a + b) / 2)];
    }
    pts['duodenoa'] = dl[Math.round(N_LOOP * 0.45)];
    pts['duodenoaren-bulboa'] = dl[Math.round(N_LOOP * 0.08)];
    pts['duodeno-jatorri-muga'] = dl[Math.round(N_LOOP * ORIGIN_U)];
    // The dorsal mesoduodenum: to the posterior wall; flattens onto it and takes the wall's colour as it fuses.
    const fu = clamp01(pose.fuse);
    const rows = dl.filter((_, i) => i >= Math.round(N_LOOP * 0.18) && i % 3 === 0).map((d): V3[] => {
      const w: V3 = [d[0] * 0.55, d[1], -1.27];
      const g: V3 = add(d, [0, 0, -0.1]);
      return [w, mix3(w, g, 0.5), g];
    });
    const mc = mixHex(FC.visceral, FC.parietal, fu);
    items.push({ key: 'mesoduod', id: 'mesoduodeno-dortsala', mesh: sheetMesh('mesoduod', rows), color: mc, deep: darker(mc), tissue: 'membrane', opacity: du * (0.5 - 0.15 * fu) * fade('mesoduodeno-dortsala', undefined, 0.7), thin: 0.6, outline: false });
    pts['mesoduodeno-dortsala'] = rows[Math.round(rows.length * 0.4)][1];
    // The jejunum's start beyond the 4th part (intraperitoneal again); also kept solid when the coils are cleared away.
    const stub = bow <= 0.01 ? 1 : 1 - clr;
    if (stub > 0.01) {
      const jj = L([dl[dl.length - 1], add(dl[dl.length - 1], [0.2, -0.15, 0.25]), add(dl[dl.length - 1], [0.4, -0.45, 0.45])], 10);
      items.push({ key: 'jstub', id: 'jejunoa', ...tubeOf(jj, () => 0.1, 12), color: FC.mid, deep: darker(FC.mid), tissue: 'epithelium', opacity: du * Math.min(1, stub * 1.1) * solid('jejunoa') });
      pts['jejunoa'] = jj[6];
    }
    // The two arteries of the double origin: coeliac trunk (foregut) and superior mesenteric (midgut).
    if (og > 0.01) {
      const cel = L([[0, 0.62, -1.02], [0, 0.6, -0.7], [-0.3, 0.42, -0.55], mix3(D1end, papilla, 0.5)], 14);
      const sma = L([[0, 0.25, -1.02], [0.05, 0.05, -0.55], [-0.1, -0.3, -0.45], dl[Math.round(N_LOOP * 0.62)]], 14);
      items.push({ key: 'cel', id: 'enbor-zeliakoa', ...tubeOf(cel, () => 0.045, 10), color: EC.celiac, deep: darker(EC.celiac), tissue: 'vessel', opacity: og * solid('enbor-zeliakoa') });
      items.push({ key: 'sma', id: 'goiko-arteria-mesenterikoa', ...tubeOf(sma, () => 0.05, 10), color: EC.sma, deep: darker(EC.sma), tissue: 'vessel', opacity: og * solid('goiko-arteria-mesenterikoa') });
      pts['enbor-zeliakoa'] = cel[5];
      pts['goiko-arteria-mesenterikoa'] = sma[6];
    }
  }

  // ———— the liver: a bud of the distal foregut branching into the septum transversum, then the organ ————
  const lv = clamp01(pose.liver);
  const hilum: V3 = [-0.42, 0.74, 0.02];
  const liverC: V3 = [-0.6, 1.02, 0.28];
  const glass = clamp01(o.liverGlass ?? 0);
  {
    const sep = 1 - ss(0.88, 1, lv);
    if (sep > 0.01) {
      items.push({ key: 'septum', id: 'septum-transversum', ...blobParts({ center: [-0.2, 1.12 + HIGH(pose), 0.55], radii: [1.3, 0.36, 0.6], rings: 12, sides: 18 }), color: FC.septum, deep: FC.septumDeep, tissue: 'mesenchyme', opacity: 0.38 * sep * fade('septum-transversum', undefined, 0.7), thin: 0.5, outline: false });
      pts['septum-transversum'] = [0.55, 1.2 + HIGH(pose), 0.75];
    }
    // The bud and its branches (adarkatu) while the liver is young.
    const bud = 1 - ss(0.75, 1, lv);
    const root = du > 0.01 ? mix3(D1end, papilla, 0.6) : F.at([0, -ST_LEN - 0.12, 0.1]);
    if (bud > 0.01 && lv < 0.999) {
      const grow = ss(0, 0.3, lv);
      const tip = lerp3(root, [-0.35, 1.0, 0.3], grow);
      const stem = L([root, mix3(root, tip, 0.5), tip], 10);
      items.push({ key: 'livbud', id: 'gibel-hastapena', ...tubeOf(stem, () => 0.07, 12), color: FC.endo, deep: FC.endoDeep, tissue: 'epithelium', opacity: bud * solid('gibel-hastapena') });
      pts['gibel-hastapena'] = stem[6];
      const br = ss(0.2, 0.55, lv);
      if (br > 0.01) {
        const dirs: V3[] = [[-0.7, 0.15, 0.2], [-0.4, 0.25, 0.5], [0.2, 0.2, 0.45], [-0.6, 0.05, -0.25], [0.35, 0.1, 0.05], [-0.9, -0.05, 0.4]];
        dirs.forEach((d, i) => {
          const end = add(tip, mul(d, br));
          const midp = add(mix3(tip, end, 0.5), [0, 0.06 * (i % 2 ? 1 : -1), 0]);
          items.push({ key: `lb${i}`, id: 'gibel-hastapena', ...tubeOf(L([tip, midp, end], 8), (u) => 0.045 * (1 - 0.5 * u), 10), color: FC.endo, deep: FC.endoDeep, tissue: 'epithelium', opacity: bud * solid('gibel-hastapena') });
        });
      }
    }
    const s = ss(0.35, 1, lv);
    if (s > 0.01) {
      const op = solid('gibela') * (1 - 0.65 * glass) * (1 - 0.9 * top);
      items.push({ key: 'liver', id: 'gibela', groups: ['errai-peritoneoa'], ...blobParts({ center: liverC, radii: [1.02 * s, 0.5 * s, 0.76 * s], rings: 22, sides: 28, shape: LIVER_SHAPE }, 'liver14'), color: FC.liver, deep: FC.liverDeep, tissue: 'epithelium', opacity: op });
      pts['gibela'] = add(liverC, [-0.45 * s, 0.05, 0.55 * s]);
    }
  }

  // ———— the bile ducts and the gallbladder ————
  const ga = clamp01(pose.gall);
  const J = du > 0.01 ? lerp3(hilum, D1end, 0.62) : hilum;
  if (du > 0.01 && lv > 0.6) {
    const hep = L([hilum, mix3(hilum, J, 0.5), J], 8);
    const bileOp = Math.max(ga, ss(0.6, 0.85, lv) * 0.85, clamp01(pose.edge));
    items.push({ key: 'hepduct', id: 'gibel-hodia', ...tubeOf(hep, () => 0.035, 10), color: FC.bile, deep: darker(FC.bile), tissue: 'epithelium', opacity: bileOp * solid('gibel-hodia') });
    pts['gibel-hodia'] = hep[4];
    const cbd = L([J, add(mix3(J, papilla, 0.5), [-0.12, 0, -0.05]), papilla], 10);
    items.push({ key: 'cbd', id: 'koledokoa', ...tubeOf(cbd, () => 0.04, 10), color: FC.bile, deep: darker(FC.bile), tissue: 'epithelium', opacity: bileOp * solid('koledokoa') });
    pts['koledokoa'] = cbd[5];
    if (ga > 0.01) {
      const gb: V3 = [-0.28, 0.6, 0.56];
      const cys = L([J, mix3(J, gb, 0.5), lerp3(J, gb, ss(0, 0.6, ga))], 8);
      items.push({ key: 'cystic', id: 'hodi-zistikoa', ...tubeOf(cys, () => 0.03, 10), color: FC.bile, deep: darker(FC.bile), tissue: 'epithelium', opacity: ga * solid('hodi-zistikoa') });
      pts['hodi-zistikoa'] = cys[3];
      const gs = ss(0.3, 1, ga);
      if (gs > 0.01) {
        const dir = norm(sub(gb, J));
        items.push({ key: 'gall', id: 'behazun-xixkua', ...blobParts({ center: add(gb, mul(dir, 0.12 * gs)), radii: [0.13 * gs, 0.13 * gs, 0.26 * gs], axes: [norm(cross(cross(dir, [0, 1, 0]), dir)), norm(cross(dir, [0, 1, 0])), dir] /* right-handed: a1 × a2 = dir */, rings: 12, sides: 16 }), color: FC.gall, deep: darker(FC.gall), tissue: 'epithelium', opacity: solid('behazun-xixkua') });
        pts['behazun-xixkua'] = add(gb, mul(dir, 0.18 * gs));
      }
    }
  }

  // ———— the ventral mesogastrium: lesser omentum (stomach ↔ liver) and falciform ligament (liver ↔ anterior wall) ————
  const vm = clamp01(pose.vmeso);
  if (vm > 0.01) {
    const n = 12;
    const lc = stomachLine(pose, Math.PI / 2, 0.06, 0.96, n);
    const target = (i: number): V3 => lerp3([0.3, 0.86, 0.12], [-0.3, 0.76, 0.06], i / n);
    const ls = clamp01(pose.lesser);
    const rows = lc.map((c, i): V3[] => [c, mix3(c, target(i), 0.5), target(i)]);
    const sepTint = mixHex(FC.septum, FC.visceral, 0.25);
    items.push({ key: 'gh', id: ls > 0.5 ? 'lotailu-gastroepatikoa' : 'epiploi-txikia', groups: ls > 0.5 ? ['epiploi-txikia', VM] : [VM], mesh: sheetMesh('gh', rows), color: sepTint, deep: darker(sepTint), tissue: 'membrane', opacity: 0.55 * vm * fade(ls > 0.5 ? 'lotailu-gastroepatikoa' : 'epiploi-txikia', ['epiploi-txikia'], 0.7), thin: 0.6, outline: false });
    pts[ls > 0.5 ? 'lotailu-gastroepatikoa' : 'epiploi-txikia'] = rows[Math.round(n * 0.4)][1];
    pts[VM] = rows[Math.round(n * 0.4)][1];
    // The hepatoduodenal ligament: from the duodenum's first part to the liver's hilum; its right edge is free.
    if (du > 0.01) {
      const d1 = dl.slice(0, Math.round(N_LOOP * PART_U[1]) + 1);
      const hrows = d1.filter((_, i) => i % 2 === 0 || i === d1.length - 1).map((d, i, arr): V3[] => {
        const tgt = lerp3([-0.3, 0.76, 0.06], hilum, i / (arr.length - 1));
        return [d, mix3(d, tgt, 0.5), tgt];
      });
      items.push({ key: 'hd', id: ls > 0.5 ? 'lotailu-duodenoepatikoa' : 'epiploi-txikia', groups: ls > 0.5 ? ['epiploi-txikia', VM] : [VM], mesh: sheetMesh('hd', hrows), color: sepTint, deep: darker(sepTint), tissue: 'membrane', opacity: 0.55 * vm * fade(ls > 0.5 ? 'lotailu-duodenoepatikoa' : 'epiploi-txikia', ['epiploi-txikia'], 0.7), thin: 0.6, outline: false });
      pts[ls > 0.5 ? 'lotailu-duodenoepatikoa' : 'epiploi-txikia-2'] = hrows[Math.round(hrows.length * 0.5)][1];
      if (ls <= 0.5) pts['epiploi-txikia'] = rows[Math.round(n * 0.4)][1];
      // The free edge and its contents: hepatic artery, portal vein, common bile duct (3.4 p15).
      const ed = clamp01(pose.edge);
      const fe = hrows[hrows.length - 1];
      const edgeLine = L([D1end, fe[1], hilum], 12);
      pts['ertz-librea'] = edgeLine[6];
      if (ed > 0.01) {
        const side = norm(sub(edgeLine[8], edgeLine[4]));
        const across = norm(cross(side, [0, 0, 1]));
        const art = edgeLine.map((q) => add(q, add(mul(across, 0.05), [0, 0, 0.03])));
        const por = edgeLine.map((q) => add(q, [0, 0, -0.07]));
        items.push({ key: 'hepart', id: 'gibel-arteria', ...tubeOf(art, () => 0.03, 10), color: FC.artery, deep: darker(FC.artery), tissue: 'vessel', opacity: ed * solid('gibel-arteria') });
        items.push({ key: 'portal', id: 'porta-zaina', ...tubeOf(por, () => 0.055, 12), color: FC.portal, deep: darker(FC.portal), tissue: 'vessel', opacity: ed * solid('porta-zaina') });
        pts['gibel-arteria'] = art[5];
        pts['porta-zaina'] = por[7];
        // Winslow's foramen: the entrance to the bursa behind the free edge (a space: drawn as one).
        const wc = add(edgeLine[6], [0.12, -0.02, -0.26]);
        items.push({ key: 'winslow', id: 'winslow-hiatoa', ...blobParts({ center: wc, radii: [0.13, 0.12, 0.1], rings: 10, sides: 14 }), color: FC.cavity, deep: darker(FC.cavity), tissue: 'membrane', opacity: 0.7 * ed * fade('winslow-hiatoa', undefined, 0.7), thin: 0.8, outline: false });
        pts['winslow-hiatoa'] = wc;
      }
    }
    // The falciform ligament: from the liver's anterior surface to the anterior wall, down to the umbilicus.
    const fa = clamp01(pose.falc);
    if (fa > 0.01) {
      const frows = Array.from({ length: 9 }, (_, i): V3[] => {
        const f = i / 8;
        const lvP: V3 = [lerp(-0.05, 0.0, f), lerp(1.36, 0.62, f), lerp(0.55, 0.92, Math.sin(f * Math.PI)) + 0.05];
        const wall: V3 = [0, lerp(1.4, 0.3, f), 1.38];
        return [lvP, mix3(lvP, wall, 0.5), wall];
      });
      // Its free lower edge runs on to the umbilicus.
      const tail = Array.from({ length: 5 }, (_, i): V3[] => {
        const f = (i + 1) / 5;
        const a: V3 = [0, lerp(0.62, -0.95, f), lerp(1.0, 1.36, f)];
        const w: V3 = [0, lerp(0.3, -0.95, f), 1.38];
        return [a, mix3(a, w, 0.5), w];
      });
      const all = [...frows, ...tail];
      items.push({ key: 'falc', id: 'lotailu-faltziformea', groups: [VM], mesh: sheetMesh('falc', all), color: FC.septum, deep: FC.septumDeep, tissue: 'membrane', opacity: 0.6 * fa * fade('lotailu-faltziformea', undefined, 0.7), thin: 0.6, outline: false });
      pts['lotailu-faltziformea'] = frows[4][1];
      const rl = L([[0, 0.62, 0.98], [0, -0.2, 1.2], [0, -0.95, 1.36]], 10);
      const ro = clamp01(pose.round);
      if (ro > 0.01) items.push({ key: 'round', id: 'gibeleko-lotailu-borobila', ...tubeOf(rl, () => 0.035, 10), color: '#e7b9a6', deep: '#8a5a48', tissue: 'tendon', opacity: ro * fa * solid('gibeleko-lotailu-borobila') });
      pts['gibeleko-lotailu-borobila'] = rl[5];
    }
    // Coronary ligaments and the bare area between them, on the liver's upper posterior face.
    const co = clamp01(pose.coron);
    if (co > 0.01) {
      for (const [k, zz] of [[0, -0.12], [1, 0.3]] as const) {
        const rows2 = Array.from({ length: 7 }, (_, i): V3[] => {
          const x = lerp(-1.3, 0.2, i / 6);
          const lvTop: V3 = [x, 1.46 - 0.08 * Math.abs(x + 0.6), zz];
          const dia: V3 = [x, 1.82 - 0.12 * (x * x), zz];
          return [lvTop, mix3(lvTop, dia, 0.5), dia];
        });
        items.push({ key: `cor${k}`, id: 'lotailu-koronarioak', mesh: sheetMesh(`cor${k}`, rows2), color: FC.septum, deep: FC.septumDeep, tissue: 'membrane', opacity: 0.7 * co * fade('lotailu-koronarioak', undefined, 0.7), thin: 0.6, outline: false });
        if (k === 0) pts['lotailu-koronarioak'] = rows2[2][1];
      }
      items.push({ key: 'bare', id: 'area-biluzia', ...blobParts({ center: [-0.58, 1.5, 0.09], radii: [0.55, 0.06, 0.2], rings: 8, sides: 16 }), color: FC.bare, deep: '#2a0c08', tissue: 'mesenchyme', opacity: co * solid('area-biluzia') });
      pts['area-biluzia'] = [-0.75, 1.55, 0.09];
    }
  }

  // ———— the pancreas: dorsal bud (red) and ventral bud (blue), the ventral swinging round to fuse ————
  const pd = clamp01(pose.pancD);
  const pv = clamp01(pose.pancV);
  if (du > 0.01 && (pd > 0.01 || pv > 0.01)) {
    const named = clamp01(pose.pancParts) > 0.5;
    const ductK = clamp01(pose.ducts);
    const glassP = 1 - 0.55 * ductK;
    const root = add(dl[Math.round(N_LOOP * 0.3)], [0.05, 0.05, -0.15]);
    const path = L([root, [lerp(root[0], -0.2, 0.6), 0.12, -0.86], [0.35, 0.22, -0.9], [0.9, 0.38, -0.88], [1.22, 0.6, -0.82]], 40);
    if (pd > 0.01) {
      const n = Math.max(3, Math.round(path.length * pd));
      const shown = path.slice(0, n);
      const rad = (i: number) => lerp(0.17, 0.1, i / (path.length - 1));
      const cuts: [string, number, number][] = named ? [['area-burua', 0, 0.22], ['area-gorputza', 0.22, 0.66], ['area-buztana', 0.66, 1]] : [['arearen-atzeko-hastapena', 0, 1]];
      for (const [id, a, b] of cuts) {
        const i0 = Math.round(a * (path.length - 1));
        const i1 = Math.min(n - 1, Math.round(b * (path.length - 1)));
        if (i1 - i0 < 1) continue;
        const seg = shown.slice(Math.max(0, i0 - 1), i1 + 1);
        const groups = named ? ['area', 'arearen-atzeko-hastapena'] : undefined;
        items.push({ key: `pd-${id}`, id, groups, ...tubeOf(seg, (u) => rad(lerp(i0, i1, u)), 16), color: FC.pancD, deep: darker(FC.pancD), tissue: 'epithelium', opacity: pd * glassP * solid(id, groups) });
        pts[id] = add(seg[Math.round(seg.length / 2)], [0, 0.04, 0.12]);
      }
      // Named parts: the dorsal bud's dot sits in the body, which comes from it alone.
      pts['arearen-atzeko-hastapena'] = add(shown[Math.round(shown.length * (named ? 0.55 : 0.5))], [0, 0.05, 0.12]);
      pts['area'] = add(path[Math.round(path.length * 0.45)], [0, 0.05, 0.13]);
    }
    if (pv > 0.01) {
      const al = Math.PI * clamp01(pose.pancRot);
      const side: V3 = [-Math.sin(al), -0.1, Math.cos(al)];
      // Budding from the start of the common bile duct, beside the papilla.
      const base = papilla;
      const fusedPos: V3 = add(root, [-0.06, -0.3, -0.04]);
      const free = add(base, mul(side, 0.2));
      const c = lerp3(free, fusedPos, ss(0.75, 1, clamp01(pose.pancRot)));
      const id = named ? 'apofisi-untziformea' : 'arearen-aurreko-hastapena';
      const groups = named ? ['area', 'area-burua', 'arearen-aurreko-hastapena'] : undefined;
      items.push({ key: 'pv', id, groups, ...blobParts({ center: c, radii: [0.17 * pv, 0.2 * pv, 0.15 * pv], rings: 12, sides: 16 }), color: FC.pancV, deep: darker(FC.pancV), tissue: 'epithelium', opacity: glassP * solid(id, groups) });
      pts[id] = add(c, [0, -0.05, 0.12]);
      if (!named) pts['arearen-aurreko-hastapena'] = add(c, [0, 0, 0.12]);
      // The hook (gakoa) of the uncinate process, behind the superior mesenteric vessels.
      if (named) {
        const hook = L([c, add(c, [0.22, -0.12, -0.05]), add(c, [0.38, -0.06, -0.12])], 8);
        items.push({ key: 'hook', id: 'apofisi-untziformea', groups, ...tubeOf(hook, (u) => 0.1 * (1 - 0.5 * u), 12), color: FC.pancV, deep: darker(FC.pancV), tissue: 'epithelium', opacity: glassP * solid(id, groups) });
      }
    }
    // The ducts: main (Wirsung) = the dorsal duct's distal part + the ventral duct, with the common bile duct on
    // the major papilla; accessory (Santorini) = the dorsal duct's proximal part, to the minor papilla.
    if (ductK > 0.01 && pd > 0.5) {
      const ventralC = add(root, [-0.06, -0.3, -0.04]);
      const wir = L([path[path.length - 3], path[28], path[16], path[8], mix3(path[4], ventralC, 0.6), ventralC, papilla], 30);
      const minor = dl[Math.round(N_LOOP * 0.3)];
      const san = L([path[8], path[4], mix3(path[2], minor, 0.5), minor], 10);
      items.push({ key: 'wirsung', id: 'wirsung-hodia', ...tubeOf(wir, () => 0.03, 10), color: FC.duct, deep: darker(FC.duct), tissue: 'epithelium', opacity: ductK * solid('wirsung-hodia') });
      items.push({ key: 'santorini', id: 'santorini-hodia', ...tubeOf(san, () => 0.022, 10), color: '#fff8dc', deep: darker('#fff8dc'), tissue: 'epithelium', opacity: ductK * solid('santorini-hodia') });
      pts['wirsung-hodia'] = wir[10];
      pts['santorini-hodia'] = san[3];
      items.push({ key: 'papilla', id: 'karunkula-handia', ...blobParts({ center: papilla, radii: [0.07, 0.07, 0.07], rings: 8, sides: 12 }), color: '#fff1b8', deep: '#8a7a3a', tissue: 'epithelium', opacity: ductK * solid('karunkula-handia') });
      pts['karunkula-handia'] = add(papilla, [-0.05, 0, 0.05]);
    }
    // The endocrine part: Langerhans islets, small pale clusters scattered through the gland.
    const il = clamp01(pose.islets);
    if (il > 0.01 && pd > 0.9) {
      // On the gland's front surface (half proud of it), so they read from the front through the lit gland.
      const dots = [4, 7, 10, 13, 16, 19, 22, 25, 28, 31, 34, 37].map((k, j) => add(path[k], [0.05 * Math.cos(j * 2.3), 0.06 * Math.sin(j * 1.7), lerp(0.15, 0.09, k / 39)]));
      const m = cachedMesh('islets14', dots.flat().map(r3), () => merge(dots.map((c) => blobParts({ center: c, radii: [0.05, 0.05, 0.04], rings: 6, sides: 8 }).mesh)));
      items.push({ key: 'islets', id: 'langerhans-irlatxoak', groups: ['area'], mesh: m, color: '#fff3c4', deep: '#8a7a3a', tissue: 'epithelium', opacity: il * solid('langerhans-irlatxoak', ['area']) });
      pts['langerhans-irlatxoak'] = dots[4];
    }
  }

  // ———— the parietal peritoneum over what has become retroperitoneal (duodenum 2–4, the pancreas) ————
  const ve = clamp01(pose.veil) * clamp01(pose.fuse);
  if (ve > 0.01 && du > 0.01) {
    const rows = Array.from({ length: 6 }, (_, i) => Array.from({ length: 8 }, (_, j): V3 => {
      const x = lerp(-0.95, 1.35, j / 7);
      const y = lerp(0.62, -0.95, i / 5);
      return [x, y, -0.7 - 0.12 * Math.max(0, x - 0.4) - 0.08 * (x * x) / 2];
    }));
    items.push({ key: 'veil', id: 'paretako-peritoneoa', mesh: sheetMesh('veil', rows), color: FC.parietal, deep: darker(FC.parietal), tissue: 'membrane', opacity: 0.34 * ve * fade('paretako-peritoneoa', undefined, 0.6), thin: 0.6, outline: false });
    pts['paretako-peritoneoa'] = [0.75, -0.6, -0.78];
  }

  pts['kardiasa'] ??= cardia;
  return { items, pts };
}

/** Points worth aiming the camera at. */
export const AIM = {
  thorax: [0, 2.6, -0.2] as V3,
  stomach: [0.3, 0.7, -0.25] as V3,
  duodenum: [-0.45, 0.0, -0.6] as V3,
  liver: [-0.4, 0.9, 0.2] as V3,
  pancreas: [0.1, 0.0, -0.75] as V3,
  omentum: [0.2, -1.0, 0.2] as V3,
};
