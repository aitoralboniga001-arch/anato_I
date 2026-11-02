import { add, cross, mul, norm, sub, type V3 } from '@/lib/three-d/math';
import { curve3, grid, merge, type Mesh } from '@/lib/three-d/mesh';
import { cachedMesh } from '@/lib/three-d/mesh-cache';
import type { Item3 } from '@/lib/three-d/scene';
import { blobParts, mixHex, tubeParts } from '@/components/scenes/week10/model3d';
import { T } from '@/components/scenes/week10/common';
import { EC } from '@/components/scenes/week12/embryo-model';
import { FC, FP_DONE, duodenumLine, foreModel, ss, type ForePose } from './foregut-model';

/**
 * Topic 14, stages 17–24 (notes 4–5.1 and the summary): the midgut and the hindgut in the trunk, in 3D, on
 * the finished foregut of stages 6–16 (`foreModel` at its end pose, as context).
 *
 * One gut line from the duodenojejunal flexure to the anal canal, posed by morphing three layouts sample by
 * sample: the short straight midgut of week 5; the primary intestinal loop (a hairpin round the superior
 * mesenteric artery, its axis) that lengthens, herniates into the umbilical cord and turns 270° counter-
 * clockwise seen from the front; and the adult frame (jejunum upper left, ileum to the right iliac fossa,
 * caecum, ascending, transverse, descending, sigmoid colon, rectum, anal canal). The return is staggered
 * along the line, so the jejunum comes back first and the caecal bud last; the caecum then descends.
 * The mesenteries are sheets from the same samples to their roots, morphed with them.
 *
 * Axes as every model of topics 10–14: x towards the embryo's LEFT, y cranial, z ventral.
 */

// ———————————————————————————— colours ————————————————————————————

export const MC = {
  ...FC,
  /** The primary loop's two limbs. */
  cephalic: mixHex(FC.mid, '#ffffff', 0.5),
  caudal: mixHex(FC.mid, '#ff7a3a', 0.5),
  /** The rotation arrow round the SMA. */
  arc: '#ffe08a',
  cord: '#d9c7a6',
  ecto: T.ecto,
  iliac: mixHex(T.aorta, '#ffffff', 0.25),
  rectal: '#ffd166',
  /** The summary's three peritoneal positions. */
  intra: '#5fd08a',
  retro: '#f0a43a',
  extra: '#a98bf0',
} as const;

const darker = (c: string) => mixHex(c, '#000000', 0.55);
const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
const lerp3 = (a: V3, b: V3, k: number): V3 => [lerp(a[0], b[0], k), lerp(a[1], b[1], k), lerp(a[2], b[2], k)];
const r3 = (v: number) => Math.round(v * 1000) / 1000;
const dot = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const tubeOf = (pts: readonly V3[], r: (u: number) => number, sides = 14) => tubeParts(pts, { radius: r, ref: [0, 0, 1], sides, capStart: true, capEnd: true });

/** A polyline resampled by arc length to exactly n points. */
function resample(keys: readonly V3[], n: number, smooth = true): V3[] {
  const fine = smooth ? curve3(keys, Math.max(40, keys.length * 16)) : keys;
  const cum = [0];
  for (let i = 1; i < fine.length; i++) {
    const d = sub(fine[i], fine[i - 1]);
    cum.push(cum[i - 1] + Math.hypot(d[0], d[1], d[2]));
  }
  const total = cum[cum.length - 1] || 1;
  const out: V3[] = [];
  let j = 0;
  for (let i = 0; i < n; i++) {
    const s = (total * i) / Math.max(1, n - 1);
    while (j < cum.length - 2 && cum[j + 1] < s) j++;
    const k = (s - cum[j]) / Math.max(1e-9, cum[j + 1] - cum[j]);
    out.push(lerp3(fine[j], fine[j + 1], clamp01(k)));
  }
  return out;
}

function flipped(m: Mesh): Mesh {
  const idx = new Uint32Array(m.idx.length);
  for (let i = 0; i < idx.length; i += 3) {
    idx[i] = m.idx[i];
    idx[i + 1] = m.idx[i + 2];
    idx[i + 2] = m.idx[i + 1];
  }
  return { pos: m.pos, nrm: m.nrm.map((v) => -v), uv: m.uv, idx };
}

/** A sheet through rows of points, seen from both sides. */
function sheetMesh(key: string, rows: readonly (readonly V3[])[]): Mesh {
  const nu = rows.length - 1;
  const nv = rows[0].length - 1;
  return cachedMesh(`msheet:${key}`, rows.flat(2).map(r3), () => {
    const a = rows[Math.floor(nu / 2)][Math.floor(nv / 2)];
    const du = sub(rows[Math.min(nu, Math.floor(nu / 2) + 1)][Math.floor(nv / 2)], rows[Math.max(0, Math.floor(nu / 2) - 1)][Math.floor(nv / 2)]);
    const dv = sub(rows[Math.floor(nu / 2)][Math.min(nv, Math.floor(nv / 2) + 1)], rows[Math.floor(nu / 2)][Math.max(0, Math.floor(nv / 2) - 1)]);
    const n = norm(cross(du, dv));
    const m = grid(nu, nv, (u, v) => rows[Math.round(u * nu)][Math.round(v * nv)], add(a, mul(n, 50)));
    return merge([m, flipped(m)]);
  });
}

// ———————————————————————————— pose ————————————————————————————

export interface MidPose {
  /** The finished foregut (stomach, duodenum, liver, pancreas, spleen) as context. */
  fore: number;
  /** 0: the short straight midgut of week 5 → 1: the primary intestinal loop. */
  loop: number;
  /** The loop out in the umbilical cord (week 6). */
  hern: number;
  /** The rotation round the SMA, 0..1 = 0..270° counter-clockwise seen from the front. */
  rot: number;
  /** The return into the abdomen (week 12), staggered: jejunum first, caecal bud last. */
  ret: number;
  /** The caecum's descent from under the liver to the right iliac fossa. */
  cDesc: number;
  /** The loop's two limbs coloured and named. */
  limbs: number;
  /** The adult parts named (jejunum, ileum, caecum, colon…). */
  parts: number;
  /** The vitelline (omphalomesenteric) duct at the loop's apex. */
  vit: number;
  /** The umbilical cord. */
  cord: number;
  /** The mesenteries drawn. */
  meso: number;
  /** Ascending colon: its meso fuses with the posterior wall (retroperitoneal). */
  fuseA: number;
  /** Descending colon: likewise. */
  fuseD: number;
  /** The hindgut drawn (transverse colon's last third → anal canal). */
  hind: number;
  /** The superior mesenteric artery's branches; the inferior mesenteric artery. */
  sma: number;
  ima: number;
  /** The coeliac trunk too (the three arteries of the gut). */
  celiac: number;
  /** The rectal arteries and the iliac arteries they come from. */
  rectal: number;
  /** The anal canal's two origins (endoderm above, ectoderm below). */
  anal: number;
  /** The summary colours: intraperitoneal, retroperitoneal, extraperitoneal. */
  summary: number;
  /** The anterior abdominal wall. */
  front: number;
  /** The rotation arrow round the SMA (how far the loop has turned). */
  arc: number;
  /** The retroperitoneal veil over the duodenum and pancreas (foregut model). */
  veil: number;
}

export const MP0: MidPose = {
  fore: 1, loop: 0, hern: 0, rot: 0, ret: 0, cDesc: 0, limbs: 0, parts: 0, vit: 1, cord: 0, meso: 1, fuseA: 0, fuseD: 0,
  hind: 1, sma: 0, ima: 0, celiac: 0, rectal: 0, anal: 0, summary: 0, front: 0, veil: 0, arc: 0,
};

/** The adult end of the midgut and hindgut. */
export const MP_DONE: MidPose = { ...MP0, loop: 1, hern: 0, rot: 1, ret: 1, cDesc: 1, parts: 1, vit: 0, fuseA: 1, fuseD: 1 };

export interface MidOpts {
  dim?: { ids: readonly string[]; k: number } | null;
  /** See-through foregut context (so the midgut reads in front of it). */
  foreGlass?: number;
  liverGlass?: number;
  diaphragm?: number;
}

export interface MidModel {
  items: Item3[];
  pts: Record<string, V3>;
}

// ———————————————————————————— the midgut line ————————————————————————————

const N = 240;
/** Where the parts end along the midgut (fractions of the line). */
const S_JEJ = 0.3;
const S_ILE = 0.56;
const S_CAE = 0.58;
const S_ASC = 0.74;
/** The loop's apex (the vitelline duct, at the ileum: between its proximal and distal loops). */
const S_APEX = 0.47;

const NH = 90;
const H_TRA = 0.15;
const H_DES = 0.45;
const H_SIG = 0.7;
const H_REC = 0.88;

const DONE_FORE: ForePose = { ...FP_DONE, bowel: 0, omentum: 0, duodParts: 1, pancParts: 1 };
const DJ = (() => {
  const d = duodenumLine(DONE_FORE);
  return d[d.length - 1];
})();

/** The SMA's origin on the aorta and the loop's root on the posterior wall; the umbilicus. */
const SMA0: V3 = [0, 0.22, -1.02];
const ROOT: V3 = [0, -0.55, -1.05];
const UMB: V3 = [0, -1.25, 1.5];
const AX = norm(sub(UMB, ROOT));
const E0 = norm(sub([0, 1, 0], mul(AX, dot(AX, [0, 1, 0]))));
const F0 = cross(AX, E0); // → the embryo's right: +90° carries the cranial limb there

/** The transverse colon's 2/3 border (midgut | hindgut) in the early layouts and in the adult. */
const B23_EARLY: V3 = [0.1, -0.85, -0.82];
const B23: V3 = [0.55, -0.42, 0.33];

/** The ileocaecal junction under the liver (just returned) and in the right iliac fossa. */
const J_HI: V3 = [-0.82, 0.02, -0.08];
const J_LO: V3 = [-0.86, -1.95, -0.12];
const HEP_FLEX: V3 = [-1.12, 0.1, -0.45];

/** Week 5: short and straight, on a short dorsal meso. */
const STRAIGHT = resample([DJ, [0.12, -0.45, -0.62], [0.02, -0.62, -0.32], [-0.02, -0.75, -0.42], [0.04, -0.8, -0.66], B23_EARLY], N);

/**
 * Intestinal loops: a prolate trochoid along a base path (each turn a loop that crosses its neighbour, as the
 * notes' jejunal loops), lifted in and out of the frontal plane so the crossings pass over each other.
 */
function coils(keys: readonly V3[], n: number, turns: number, d: number): V3[] {
  const M = 360;
  const base = resample(keys, M);
  const out: V3[] = [];
  for (let i = 0; i < M; i++) {
    const t = i / (M - 1);
    const T = norm(sub(base[Math.min(M - 1, i + 1)], base[Math.max(0, i - 1)]));
    const Nr = norm(cross([0, 0, 1], T));
    const env = ss(0, 0.07, t) * (1 - ss(0.93, 1, t));
    const ph = 2 * Math.PI * turns * t;
    const off = add(add(mul(T, -d * Math.sin(ph)), mul(Nr, d * (1 - Math.cos(ph)) * 0.8)), [0, 0, 0.13 * Math.sin(ph)]);
    out.push(add(base[i], mul(off, env)));
  }
  return resample(out, n, false);
}

/** The adult frame (the caecum's descent moves the junction and stretches the ascending colon). */
const finalMemo = new Map<number, V3[]>();
function finalLine(c: number): V3[] {
  const key = Math.round(c * 200);
  const hit = finalMemo.get(key);
  if (hit) return hit;
  const line = finalLineOf(key / 200);
  if (finalMemo.size > 240) finalMemo.clear();
  finalMemo.set(key, line);
  return line;
}
function finalLineOf(c: number): V3[] {
  const J = lerp3(J_HI, J_LO, c);
  const nJ = Math.round(N * S_JEJ);
  const nI = Math.round(N * S_ILE) - nJ;
  const nC = Math.round(N * S_CAE) - nJ - nI;
  const nA = Math.round(N * S_ASC) - nJ - nI - nC;
  const nT = N - nJ - nI - nC - nA;
  const jej = coils([DJ, [0.62, -0.38, -0.42], [0.82, -0.72, 0.02], [0.58, -1.06, 0.3], [0.74, -1.38, 0.3], [0.4, -1.52, 0.38]], nJ + 1, 5.5, 0.17);
  const ileEnd = add(J, [0.12, 0.02, 0.18]);
  const ileKeys: V3[] = [jej[jej.length - 1], [0.12, -1.66, 0.4], [-0.16, -1.88, 0.34], lerp3([-0.5, -1.86, 0.26], [-0.5, -0.9, 0.3], 1 - c), ileEnd];
  const ile = coils(ileKeys, nI + 1, 4, 0.15);
  const cae = resample([ileEnd, J], nC + 1);
  const asc = resample([J, lerp3(J, HEP_FLEX, 0.5), HEP_FLEX], nA + 1);
  const tra = resample([HEP_FLEX, [-0.78, -0.18, 0.22], [-0.12, -0.46, 0.44], B23], nT);
  return [...jej.slice(0, nJ), ...ile.slice(0, nI), ...cae.slice(0, nC), ...asc.slice(0, nA), ...tra];
}

/** The loop's half width (limb to axis): wider once out in the cord. */
const loopW = (hern: number) => lerp(0.36, 0.5, hern);

/**
 * The primary loop round the axis (cranial limb on +e, caudal on −e), turned by θ about it: two limbs with a
 * narrow neck at the root and a rounded apex (the notes' U), the cranial limb coiling as it lengthens.
 */
function loopLine(dLen: number, th: number, coil: number, W: number): { line: V3[]; axis: V3[] } {
  const e = add(mul(E0, Math.cos(th)), mul(F0, Math.sin(th)));
  const f = cross(AX, e);
  const line: V3[] = [];
  const axis: V3[] = [];
  const d0 = dLen * 0.08;
  const Ls = Math.max(0.05, dLen - W - d0);
  const Lt = Ls + (Math.PI / 2) * W;
  for (let i = 0; i < N; i++) {
    const s = i / (N - 1);
    const cranial = s <= S_APEX;
    const k = cranial ? s / S_APEX : (1 - s) / (1 - S_APEX);
    const a = k * Lt;
    let d: number;
    let w: number;
    if (a <= Ls) {
      d = d0 + a;
      w = W * (0.42 + 0.58 * ss(0, 0.4, a / Ls));
    } else {
      const ph = (a - Ls) / W;
      d = d0 + Ls + W * Math.sin(ph);
      w = W * Math.cos(ph);
    }
    w *= cranial ? 1 : -1;
    // The cranial limb grows faster: its coils (the future jejunum and ileum) wind round it.
    let q = add(add(ROOT, mul(AX, d)), mul(e, w));
    if (cranial && coil > 0.001) {
      const env = ss(0.12, 0.3, k) * (1 - ss(0.72, 0.9, k));
      const ph = 2 * Math.PI * 6 * k;
      q = add(q, mul(add(mul(e, 0.16 * (Math.cos(ph) - 1)), mul(f, 0.16 * Math.sin(ph))), coil * env));
    }
    line.push(q);
    axis.push(add(ROOT, mul(AX, d)));
  }
  // The two ends stay on the duodenum and on the hindgut.
  for (let i = 0; i < N; i++) {
    const s = i / (N - 1);
    const a = 1 - ss(0, 0.07, s);
    const b = ss(0.93, 1, s);
    if (a > 0) line[i] = lerp3(line[i], lerp3(DJ, STRAIGHT[i], 0.5), a);
    if (b > 0) line[i] = lerp3(line[i], B23_EARLY, b);
  }
  return { line, axis };
}

/** When each sample comes back in (0 first … 1 last): jejunum, ileum, then the colon from the transverse end, the caecum last. */
function returnOrder(s: number) {
  const k: [number, number][] = [[0, 0], [0.52, 0.6], [S_CAE, 1], [0.64, 0.86], [1, 0.66]];
  for (let i = 1; i < k.length; i++) if (s <= k[i][0]) return lerp(k[i - 1][1], k[i][1], (s - k[i - 1][0]) / (k[i][0] - k[i - 1][0]));
  return 0.66;
}

/** The hindgut: early (down the midline to the cloaca) and adult. */
const HIND_EARLY = resample([B23_EARLY, [0.12, -1.3, -0.86], [0.06, -2.0, -0.9], [0, -2.65, -0.88], [0, -3.15, -0.72], [0, -3.5, -0.55]], NH);
function hindFinal(): V3[] {
  const nT = Math.round(NH * H_TRA);
  const nD = Math.round(NH * H_DES) - nT;
  const nS = Math.round(NH * H_SIG) - nT - nD;
  const nR = Math.round(NH * H_REC) - nT - nD - nS;
  const nA = NH - nT - nD - nS - nR;
  const SF: V3 = [1.2, 0.14, -0.45];
  const tra = resample([B23, [1.0, -0.22, 0.12], SF], nT + 1);
  const des = resample([SF, [1.24, -0.5, -0.66], [1.2, -1.45, -0.66], [1.06, -1.95, -0.5]], nD + 1);
  const sig = resample([[1.06, -1.95, -0.5], [0.72, -2.14, 0.04], [0.26, -1.96, 0.14], [0.1, -2.34, -0.36], [0.03, -2.62, -0.9]], nS + 1);
  const rec = resample([[0.03, -2.62, -0.9], [0, -2.85, -0.98], [0, -3.08, -0.9]], nR + 1);
  const ana = resample([[0, -3.08, -0.9], [0, -3.32, -0.74], [0, -3.55, -0.56]], nA);
  return [...tra.slice(0, nT), ...des.slice(0, nD), ...sig.slice(0, nS), ...rec.slice(0, nR), ...ana];
}
const HIND_DONE = hindFinal();

/** The samples between two fractions of a line (overlapping one sample, so the pieces meet). */
const span = (line: readonly V3[], a: number, b: number) => line.slice(Math.max(0, Math.round((line.length - 1) * a) - 1), Math.round((line.length - 1) * b) + 1);
const at = (line: readonly V3[], u: number) => line[Math.round((line.length - 1) * clamp01(u))];

// ———————————————————————————— the model ————————————————————————————

/** The summary: which peritoneal position each named part has (notes, ERATORRIEN KOKAPENA LABURBILDUTA). */
const PLACE: Record<string, 'intra' | 'retro' | 'extra'> = {
  urdaila: 'intra', kardiasa: 'intra', piloroa: 'intra', 'duodenoaren-lehen-atala': 'intra', jejunoa: 'intra', ileona: 'intra', 'kolon-itsua': 'intra',
  'zeharkako-kolona': 'intra', 'kolon-sigmoideoa': 'intra', barea: 'intra',
  'duodenoaren-bigarren-atala': 'retro', 'duodenoaren-hirugarren-atala': 'retro', 'duodenoaren-laugarren-atala': 'retro', area: 'retro', 'area-burua': 'retro',
  'area-gorputza': 'retro', 'area-buztana': 'retro', 'apofisi-untziformea': 'retro', 'goranzko-kolona': 'retro', 'beheranzko-kolona': 'retro',
  hestegorria: 'extra', ondestea: 'extra', 'uzki-hodia': 'extra',
};

export function midModel(pose: MidPose, o: MidOpts = {}): MidModel {
  const dim = o.dim;
  const lit = (id: string, groups?: readonly string[]) => !dim || dim.k <= 0.001 || dim.ids.includes(id) || (groups ?? []).some((g) => dim.ids.includes(g));
  const fade = (id: string, groups?: readonly string[], k = 0.8) => (lit(id, groups) ? 1 : 1 - k * (dim?.k ?? 0));
  const solid = (id: string, groups?: readonly string[]) => fade(id, groups, 0.75);
  const sum = clamp01(pose.summary);
  const place = (id: string, groups: readonly string[] | undefined, c: string) => {
    const p = PLACE[id] ?? (groups ?? []).map((g) => PLACE[g]).find(Boolean);
    return p && sum > 0.001 ? mixHex(c, MC[p], sum) : c;
  };

  // ———— the foregut, finished, as context ————
  const fg = clamp01(pose.fore);
  const glass = clamp01(o.foreGlass ?? 0);
  const ctx = foreModel(
    { ...DONE_FORE, front: pose.front, veil: pose.veil, origin: Math.max(pose.celiac, 0) > 0.01 ? 1 : 0, thorax: sum > 0.01 ? 1 : 0 },
    { dim, liverGlass: o.liverGlass ?? 0.55, diaphragm: o.diaphragm ?? 0.2 },
  );
  const items: Item3[] = [];
  const pts: Record<string, V3> = {};
  for (const it of ctx.items) {
    // The model's own jejunum stub and SMA give way to the midgut's.
    if (it.key === 'jstub' || it.key === 'sma') continue;
    const wall = it.id === 'paretako-peritoneoa' || it.id === 'aorta' || it.id === 'beheko-kaba-zaina' || it.id === 'giltzurruna' || it.id === 'diafragma';
    const k = wall ? 1 : fg * (1 - 0.7 * glass);
    if (k <= 0.01) continue;
    items.push({ ...it, color: place(it.id ?? '', it.groups, it.color), opacity: (it.opacity ?? 1) * k });
  }
  for (const [id, p] of Object.entries(ctx.pts)) if (id !== 'jejunoa' && id !== 'goiko-arteria-mesenterikoa') pts[id] = p;

  // ———— the midgut line: straight → loop (out, turning) → adult, staggered ————
  const lp = clamp01(pose.loop);
  const hern = clamp01(pose.hern);
  const th = clamp01(pose.rot) * 1.5 * Math.PI;
  const ret = clamp01(pose.ret);
  const dLen = lerp(1.35, 3.35, hern);
  const W = loopW(hern);
  const { line: loopL, axis } = loopLine(dLen, th, lp * hern, W);
  const fin = finalLine(clamp01(pose.cDesc));
  const w = Array.from({ length: N }, (_, i) => {
    const o0 = returnOrder(i / (N - 1));
    return ss(o0 * 0.7, o0 * 0.7 + 0.3, ret);
  });
  const mid = Array.from({ length: N }, (_, i) => lerp3(lerp3(STRAIGHT[i], loopL[i], lp), fin[i], w[i]));

  const named = clamp01(pose.parts) > 0.5;
  const limbs = clamp01(pose.limbs);
  const limbNamed = !named && limbs > 0.5;
  const MID = 'erdiko-hestea';
  const pieces: { id: string; groups?: string[]; a: number; b: number; color: string; r: number }[] = named
    ? [
        { id: 'jejunoa', groups: [MID], a: 0, b: S_JEJ, color: FC.mid, r: 0.085 },
        { id: 'ileona', groups: [MID], a: S_JEJ, b: S_ILE, color: mixHex(FC.mid, '#ffffff', 0.18), r: 0.08 },
        { id: 'goranzko-kolona', groups: [MID], a: S_CAE, b: S_ASC, color: FC.colon, r: 0.13 },
        { id: 'zeharkako-kolona', groups: [MID], a: S_ASC, b: 1, color: FC.colon, r: 0.13 },
      ]
    : [
        { id: limbNamed ? 'adar-zefalikoa' : MID, groups: limbNamed ? [MID, 'heste-lakioa'] : lp > 0.5 ? ['heste-lakioa'] : undefined, a: 0, b: S_APEX, color: mixHex(FC.mid, MC.cephalic, limbs), r: 0.1 },
        { id: limbNamed ? 'adar-kaudala' : MID, groups: limbNamed ? [MID, 'heste-lakioa'] : lp > 0.5 ? ['heste-lakioa'] : undefined, a: S_APEX, b: 1, color: mixHex(FC.mid, MC.caudal, limbs), r: 0.105 },
      ];
  // Between the ileum and the ascending colon the line runs through the caecum (drawn as the blob below).
  if (named) pieces.splice(2, 0, { id: 'kolon-itsua', groups: [MID], a: S_ILE, b: S_CAE, color: FC.colon, r: 0.12 });
  for (const pc of pieces) {
    const seg = span(mid, pc.a, pc.b);
    items.push({ key: `mg-${pc.id}-${pc.a}`, id: pc.id, groups: pc.groups, ...tubeOf(seg, () => pc.r, 12), color: place(pc.id, pc.groups, pc.color), deep: darker(pc.color), tissue: 'epithelium', opacity: solid(pc.id, pc.groups) });
  }
  const mpt = (u: number, lift = 0.1): V3 => add(at(mid, u), [0, 0.02, lift]);
  if (named) {
    pts['jejunoa'] = mpt(0.16);
    pts['ileona'] = mpt(0.44);
    pts['goranzko-kolona'] = mpt((S_CAE + S_ASC) / 2, 0.14);
    pts['zeharkako-kolona'] = mpt(0.87, 0.14);
  } else {
    pts['adar-zefalikoa'] = mpt(S_APEX * 0.45);
    pts['adar-kaudala'] = mpt(S_APEX + (1 - S_APEX) * 0.45);
  }
  pts[MID] = mpt(0.25);
  pts['heste-lakioa'] = mpt(S_APEX * 0.8);
  pts['bitarteko-muga'] = mpt(0.995, 0.16);

  // The caecal bud on the caudal limb → the caecum (and its appendix) at the junction.
  {
    const c = at(mid, (S_ILE + S_CAE) / 2);
    const bud = 1 - ss(0.35, 0.6, ret);
    if (!named && bud > 0.01) {
      // The caecal bud: a conical swelling on the caudal limb (blunt towards the colon, tapering to the ileum).
      const seg = span(mid, S_ILE - 0.04, S_CAE + 0.03);
      items.push({ key: 'caecalBud', id: 'kolon-itsuaren-hastapena', groups: [MID], ...tubeOf(seg, (u) => 0.105 + 0.11 * Math.pow(Math.sin(Math.PI * Math.min(1, u * 1.15)), 1.4) * ss(0, 0.7, u), 14), color: mixHex(MC.caudal, '#ffd0a8', 0.4), deep: darker(MC.caudal), tissue: 'epithelium', opacity: bud * solid('kolon-itsuaren-hastapena', [MID]) });
    }
    const grow = lerp(0.07, 0.17, ret);
    const down: V3 = ret > 0.5 ? [-0.06, -0.16, 0.06] : mul(norm(sub(at(mid, S_CAE + 0.02), at(mid, S_ILE - 0.02))), -0.02);
    const centre = add(c, mul(down, ret > 0.5 ? 1 : 0));
    const id = named ? 'kolon-itsua' : 'kolon-itsuaren-hastapena';
    if (named || ret > 0.3) items.push({ key: 'caecum', id, groups: [MID], ...blobParts({ center: centre, radii: [grow, grow * 1.15, grow], rings: 12, sides: 14 }), color: place('kolon-itsua', undefined, FC.colon), deep: darker(FC.colon), tissue: 'epithelium', opacity: solid(id, [MID]) });
    pts[id] = add(centre, named ? [0, 0, grow * 0.6] : [0, 0, 0.12]);
    if (ret > 0.6) {
      const ap = resample([add(centre, [0, -grow * 0.9, 0]), add(centre, [0.08, -grow * 1.6, 0.05]), add(centre, [0.16, -grow * 1.8, 0.12])], 8);
      items.push({ key: 'appendix', id: 'kolon-itsua', groups: [MID], ...tubeOf(ap, (u) => 0.04 * (1 - 0.4 * u), 10), color: place('kolon-itsua', undefined, FC.colon), deep: darker(FC.colon), tissue: 'epithelium', opacity: ss(0.6, 0.9, ret) * solid('kolon-itsua', [MID]) });
    }
  }

  // ———— the vitelline duct (to the yolk sac, through the cord) ————
  const vit = clamp01(pose.vit) * (1 - ss(0.1, 0.4, ret));
  if (vit > 0.01) {
    const apex = at(mid, S_APEX);
    const far: V3 = add(UMB, [0, -0.5, 2.35]);
    const vd = resample([apex, lerp3(apex, UMB, 0.5), add(UMB, [0, -0.12, 0.6]), far], 16);
    items.push({ key: 'vit', id: 'hodi-onfalomesenterikoa', ...tubeOf(vd, (u) => 0.05 * (1 - 0.3 * u), 10), color: FC.yolk, deep: FC.yolkDeep, tissue: 'epithelium', opacity: vit * solid('hodi-onfalomesenterikoa') });
    pts['hodi-onfalomesenterikoa'] = vd[5];
    // The yolk sac at its end (shrinking as the duct thins out).
    const ys = add(far, [0, -0.12, 0.3]);
    const yr = 0.34 * (1 - 0.35 * hern);
    items.push({ key: 'yolkSac', id: 'bitelo-zaku-sekundarioa', ...blobParts({ center: ys, radii: [yr, yr * 1.05, yr], rings: 14, sides: 18 }), color: FC.yolk, deep: FC.yolkDeep, tissue: 'epithelium', opacity: vit * solid('bitelo-zaku-sekundarioa') });
    pts['bitelo-zaku-sekundarioa'] = add(ys, [0, yr * 0.3, -yr * 0.6]);
  }

  // ———— the umbilical cord (the loop herniates into its proximal part) ————
  const cord = clamp01(pose.cord);
  if (cord > 0.01) {
    const cl = resample([add(UMB, [0, 0.05, -0.2]), add(UMB, [0, -0.12, 0.8]), add(UMB, [0, -0.35, 1.9]), add(UMB, [0, -0.6, 2.8])], 18);
    items.push({ key: 'cord', id: 'zilborrestea', ...tubeOf(cl, (u) => lerp(0.62, 0.34, ss(0.2, 0.7, u)), 20), color: MC.cord, deep: darker(MC.cord), tissue: 'membrane', opacity: 0.14 * cord * fade('zilborrestea', undefined, 0.6), thin: 0.8, outline: false });
    pts['zilborrestea'] = add(cl[13], [0.3, 0, 0]);
    // The extraembryonic coelom it holds there, where the loops lie.
    const coel = add(UMB, [0, -0.15, 0.7]);
    items.push({ key: 'coelomX', id: 'enbrioi-kanpoko-zeloma', ...blobParts({ center: coel, radii: [0.48, 0.5, 0.75], rings: 12, sides: 16 }), color: FC.cavity, deep: darker(FC.cavity), tissue: 'membrane', opacity: 0.11 * cord * hern * fade('enbrioi-kanpoko-zeloma', undefined, 0.7), thin: 0.8, outline: false });
    pts['enbrioi-kanpoko-zeloma'] = add(coel, [-0.42, 0.1, 0.2]);
  }

  // ———— the mesenteries ————
  const ms = clamp01(pose.meso);
  if (ms > 0.01) {
    const fuseA = clamp01(pose.fuseA);
    const R_TOP: V3 = [0.28, -0.32, -1.2];
    const R_BOT: V3 = [-0.72, -1.82, -1.2];
    const rootOf = (i: number): V3 => {
      const s = i / (N - 1);
      const straight: V3 = [STRAIGHT[i][0] * 0.3, STRAIGHT[i][1] + 0.05, -1.24];
      const early = lerp3(straight, axis[i], lp);
      let adult: V3;
      if (s <= S_ILE) adult = lerp3(R_TOP, R_BOT, s / S_ILE);
      else if (s <= S_ASC) adult = [fin[i][0] * 0.9, fin[i][1], lerp(-1.2, fin[i][2] - 0.08, fuseA)];
      else adult = [fin[i][0] * 0.82, lerp(-0.28, fin[i][1], 0.4), -1.2];
      return lerp3(early, adult, w[i]);
    };
    const rows = (a: number, b: number, step = 4) => {
      const out: V3[][] = [];
      const i0 = Math.round((N - 1) * a);
      const i1 = Math.round((N - 1) * b);
      for (let i = i0; i <= i1; i += step) {
        const r = rootOf(i);
        const g = add(mid[i], mul(norm(sub(r, mid[i])), 0.06));
        out.push([r, lerp3(r, g, 0.5), g]);
      }
      return out;
    };
    if (named) {
      items.push({ key: 'mesentery', id: 'mesenterioa', mesh: sheetMesh('mesentery', rows(0.02, S_ILE)), color: FC.visceral, deep: darker(FC.visceral), tissue: 'membrane', opacity: 0.42 * ms * fade('mesenterioa', undefined, 0.7), thin: 0.6, outline: false });
      pts['mesenterioa'] = lerp3(R_TOP, at(mid, 0.2), 0.45);
      // Ascending colon: its meso flattens onto the posterior wall and takes the parietal colour.
      const mc = mixHex(FC.visceral, FC.parietal, fuseA);
      const opA = 0.42 * ms * (1 - 0.55 * fuseA) * fade('goranzko-kolona', undefined, 0.7);
      if (opA > 0.01) items.push({ key: 'mesoAsc', id: 'goranzko-kolona', mesh: sheetMesh('mesoAsc', rows(S_CAE, S_ASC, 3)), color: mc, deep: darker(mc), tissue: 'membrane', opacity: opA, thin: 0.6, outline: false });
      items.push({ key: 'mesoTra', id: 'zeharkako-mesokolona', mesh: sheetMesh('mesoTra', rows(S_ASC + 0.02, 0.99)), color: FC.visceral, deep: darker(FC.visceral), tissue: 'membrane', opacity: 0.42 * ms * fade('zeharkako-mesokolona', undefined, 0.7), thin: 0.6, outline: false });
      pts['zeharkako-mesokolona'] = lerp3(rootOf(Math.round(N * 0.87)), at(mid, 0.87), 0.5);
    } else {
      const id = lp > 0.5 ? 'mesenterioa' : 'mesenterio-dortsala';
      items.push({ key: 'mesentery', id, mesh: sheetMesh('mesentery', rows(0.02, 0.98)), color: FC.visceral, deep: darker(FC.visceral), tissue: 'membrane', opacity: 0.4 * ms * fade(id, undefined, 0.7), thin: 0.6, outline: false });
      pts[id] = lerp3(rootOf(Math.round(N * 0.3)), at(mid, 0.3), 0.5);
    }
  }

  // ———— the hindgut ————
  const hd = clamp01(pose.hind);
  const hw = ss(0.55, 1, ret);
  const hind = Array.from({ length: NH }, (_, i) => lerp3(HIND_EARLY[i], HIND_DONE[i], hw));
  if (named) hind[0] = at(mid, 1);
  if (hd > 0.01) {
    const HIND = 'atzeko-hestea';
    const anal = clamp01(pose.anal);
    const hp: { id: string; a: number; b: number; r: number; color?: string }[] = named
      ? [
          { id: 'zeharkako-kolona', a: 0, b: H_TRA, r: 0.13 },
          { id: 'beheranzko-kolona', a: H_TRA, b: H_DES, r: 0.12 },
          { id: 'kolon-sigmoideoa', a: H_DES, b: H_SIG, r: 0.11 },
          { id: 'ondestea', a: H_SIG, b: H_REC, r: 0.15 },
          { id: 'uzki-hodia', a: H_REC, b: (H_REC + 1) / 2, r: 0.1, color: mixHex(FC.colonHind, FC.endo, anal) },
          { id: 'uzki-hodia', a: (H_REC + 1) / 2, b: 1, r: 0.09, color: mixHex(FC.colonHind, MC.ecto, anal) },
        ]
      : [{ id: HIND, a: 0, b: 1, r: 0.09 }];
    hp.forEach((pc, j) => {
      const c = pc.color ?? FC.colonHind;
      const groups = named ? [HIND] : undefined;
      items.push({ key: `hg-${j}`, id: pc.id, groups, ...tubeOf(span(hind, pc.a, pc.b), () => pc.r, 12), color: place(pc.id, groups, c), deep: darker(c), tissue: 'epithelium', opacity: hd * solid(pc.id, groups) });
    });
    const hpt = (u: number, lift: V3 = [0, 0, 0.14]): V3 => add(at(hind, u), lift);
    if (named) {
      pts['beheranzko-kolona'] = hpt((H_TRA + H_DES) / 2, [0.1, 0, 0.12]);
      pts['kolon-sigmoideoa'] = hpt((H_DES + H_SIG) / 2);
      pts['ondestea'] = hpt((H_SIG + H_REC) / 2, [0.12, 0, 0.06]);
      pts['uzki-hodia'] = hpt((H_REC + 1) / 2, [0.08, 0, 0.06]);
      pts['uzki-hodia-hurbila'] = hpt(H_REC + 0.03, [0.08, 0, 0.05]);
      pts['uzki-hodia-urruna'] = hpt(0.97, [0.07, 0, 0.05]);
      pts['zeharkako-kolona-urruna'] = hpt(H_TRA * 0.4);
    }
    pts[HIND] = hpt(0.4);
    if (named && ms > 0.01) {
      // Descending colon: no meso once fused (a parietal veil in front); sigmoid colon: its own meso.
      const fuseD = clamp01(pose.fuseD);
      const rowsH = (a: number, b: number, root: (p: V3) => V3) => {
        const out: V3[][] = [];
        for (let i = Math.round((NH - 1) * a); i <= Math.round((NH - 1) * b); i += 2) {
          const r = root(hind[i]);
          out.push([r, lerp3(r, hind[i], 0.5), hind[i]]);
        }
        return out;
      };
      const mcD = mixHex(FC.visceral, FC.parietal, fuseD);
      const opD = 0.42 * ms * (1 - 0.55 * fuseD) * fade('beheranzko-kolona', undefined, 0.7);
      if (opD > 0.01) items.push({ key: 'mesoDes', id: 'beheranzko-kolona', mesh: sheetMesh('mesoDes', rowsH(H_TRA + 0.03, H_DES, (p) => [p[0] * 0.92, p[1], lerp(-1.24, p[2] - 0.08, fuseD)])), color: mcD, deep: darker(mcD), tissue: 'membrane', opacity: opD, thin: 0.6, outline: false });
      items.push({ key: 'mesoSig', id: 'mesokolon-sigmoideoa', mesh: sheetMesh('mesoSig', rowsH(H_DES + 0.02, H_SIG - 0.02, (p) => [p[0] * 0.5, p[1] - 0.05, -1.22])), color: FC.visceral, deep: darker(FC.visceral), tissue: 'membrane', opacity: 0.42 * ms * fade('mesokolon-sigmoideoa', undefined, 0.7), thin: 0.6, outline: false });
      pts['mesokolon-sigmoideoa'] = lerp3([0.2, -2.1, -1.2], hpt((H_DES + H_SIG) / 2, [0, 0, 0]), 0.45);
      // The retroperitoneal veil: parietal peritoneum passing in front of the fused colon.
      const veil = (key: string, a: number, b: number, k: number) => {
        if (k <= 0.01) return;
        const lineV = key === 'veilAsc' ? span(mid, a, b) : span(hind, a, b);
        const rowsV = lineV.filter((_, i) => i % 2 === 0).map((p): V3[] => [add(p, [-0.24, 0, 0.17]), add(p, [0, 0, 0.2]), add(p, [0.24, 0, 0.17])]);
        items.push({ key, id: 'paretako-peritoneoa', mesh: sheetMesh(key, rowsV), color: FC.parietal, deep: darker(FC.parietal), tissue: 'membrane', opacity: 0.3 * k * fade('paretako-peritoneoa', undefined, 0.7), thin: 0.6, outline: false });
      };
      veil('veilAsc', S_CAE + 0.02, S_ASC, clamp01(pose.fuseA));
      veil('veilDes', H_TRA + 0.04, H_DES, fuseD);
    }
  }

  // ———— the arteries: SMA (the loop's axis), IMA, the rectal arteries ————
  const smaK = Math.max(clamp01(pose.sma), lp > 0.01 ? 1 : 0);
  if (smaK > 0.01) {
    const loopAx = [SMA0, add(ROOT, [0, 0.1, 0.12]), axis[Math.round(N * S_APEX * 0.6)], axis[Math.round(N * S_APEX)]];
    const adult: V3[] = [SMA0, [0, -0.05, -0.72], [-0.2, -0.7, -0.62], [-0.55, -1.5, -0.5]];
    const straight: V3[] = [SMA0, [0, -0.2, -0.9], [0.02, -0.45, -0.7], [0.02, -0.6, -0.5]];
    const k = ss(0.2, 0.9, ret);
    const keys = straight.map((p, i) => lerp3(lerp3(p, loopAx[i], lp), adult[i], k));
    const tr = resample(keys, 22);
    items.push({ key: 'smaTrunk', id: 'goiko-arteria-mesenterikoa', ...tubeOf(tr, () => 0.055, 10), color: EC.sma, deep: darker(EC.sma), tissue: 'vessel', opacity: smaK * solid('goiko-arteria-mesenterikoa') });
    pts['goiko-arteria-mesenterikoa'] = tr[9];
    // Its branches to every midgut derivative.
    const br = clamp01(pose.sma);
    if (br > 0.01) {
      const parts: Mesh[] = [];
      const hits: Mesh[] = [];
      for (let i = 8; i < N - 4; i += 14) {
        const to = mid[i];
        // From the nearest point of the trunk (past its origin on the aorta): a fan to both limbs.
        let from = tr[4];
        for (let j = 4; j < tr.length; j++) if (dot(sub(tr[j], to), sub(tr[j], to)) < dot(sub(from, to), sub(from, to))) from = tr[j];
        const b = resample([from, lerp3(from, to, 0.5), to], 6);
        const t = tubeOf(b, () => 0.024, 6);
        parts.push(t.mesh);
        hits.push(t.hit);
      }
      items.push({ key: 'smaBr', id: 'goiko-arteria-mesenterikoa', mesh: merge(parts), hit: merge(hits), color: EC.sma, deep: darker(EC.sma), tissue: 'vessel', opacity: br * solid('goiko-arteria-mesenterikoa') });
    }
  }
  const imaK = clamp01(pose.ima);
  if (imaK > 0.01 && hd > 0.01) {
    const I0: V3 = [0, -1.65, -1.02];
    const tr = resample([I0, [0.25, -1.75, -0.95], [0.55, -1.95, -0.85], [0.4, -2.3, -0.9], [0.08, -2.62, -0.98]], 18);
    items.push({ key: 'ima', id: 'beheko-arteria-mesenterikoa', ...tubeOf(tr, () => 0.035, 10), color: EC.ima, deep: darker(EC.ima), tissue: 'vessel', opacity: imaK * solid('beheko-arteria-mesenterikoa') });
    pts['beheko-arteria-mesenterikoa'] = tr[4];
    const parts: Mesh[] = [];
    const hits: Mesh[] = [];
    for (let i = 3; i < Math.round(NH * H_REC); i += 8) {
      const from = tr[Math.min(tr.length - 1, Math.round((i / NH) * 16))];
      const t = tubeOf(resample([from, lerp3(from, hind[i], 0.5), hind[i]], 6), () => 0.016, 6);
      parts.push(t.mesh);
      hits.push(t.hit);
    }
    items.push({ key: 'imaBr', id: 'beheko-arteria-mesenterikoa', mesh: merge(parts), hit: merge(hits), color: EC.ima, deep: darker(EC.ima), tissue: 'vessel', opacity: imaK * solid('beheko-arteria-mesenterikoa') });
  }
  const rc = clamp01(pose.rectal);
  if (rc > 0.01 && hd > 0.01) {
    const vessel = (key: string, id: string, ks: V3[], r: number, color: string, ptAt = 0.5) => {
      const l = resample(ks, 14);
      items.push({ key, id, ...tubeOf(l, () => r, 8), color, deep: darker(color), tissue: 'vessel', opacity: rc * solid(id) });
      if (!pts[id]) pts[id] = l[Math.round((l.length - 1) * ptAt)];
    };
    // The aorta's end, the common and internal iliac arteries (both sides), the internal pudendal.
    vessel('iliacCommonR', 'arteria-iliako-primitiboak', [[0, -2.68, -1.08], [-0.26, -2.9, -1.06], [-0.46, -3.06, -1.02]], 0.06, MC.iliac, 0.6);
    vessel('iliacCommonL', 'arteria-iliako-primitiboak', [[0, -2.68, -1.08], [0.26, -2.9, -1.06], [0.46, -3.06, -1.02]], 0.06, MC.iliac);
    for (const s of [-1, 1] as const) {
      vessel(`iliacInt${s}`, 'barneko-arteria-iliakoa', [[s * 0.46, -3.06, -1.02], [s * 0.42, -3.24, -1.0], [s * 0.38, -3.42, -0.88]], 0.04, MC.iliac, 0.4);
      vessel(`iliacExt${s}`, 'kanpoko-arteria-iliakoa', [[s * 0.46, -3.06, -1.02], [s * 0.66, -3.25, -0.8], [s * 0.78, -3.45, -0.4]], 0.045, mixHex(MC.iliac, '#000000', 0.15));
      vessel(`pud${s}`, 'barneko-pudenda-arteria', [[s * 0.38, -3.42, -0.88], [s * 0.34, -3.6, -0.72], [s * 0.2, -3.66, -0.6]], 0.026, MC.iliac, 0.5);
      vessel(`midRect${s}`, 'erdiko-arteria-hemorroidala', [[s * 0.42, -3.24, -1.0], [s * 0.24, -3.1, -1.0], [s * 0.1, -3.0, -0.93]], 0.022, MC.rectal, 0.45);
      vessel(`infRect${s}`, 'beheko-arteria-hemorroidala', [[s * 0.2, -3.66, -0.6], [s * 0.1, -3.52, -0.58], [s * 0.04, -3.45, -0.62]], 0.02, MC.rectal, 0.3);
    }
    vessel('supRect', 'goiko-arteria-hemorroidala', [[0.08, -2.62, -0.98], [0.06, -2.8, -1.05], [0.05, -3.02, -1.0], [0.03, -3.2, -0.88]], 0.024, MC.rectal, 0.45);
  }

  // ———— the rotation arrow round the SMA (the cranial limb's path, counter-clockwise from the front) ————
  const ra = rotArc(pose);
  if (ra) {
    items.push({ key: 'rotArc', ...tubeOf(ra.line, () => 0.032, 10), color: MC.arc, deep: darker(MC.arc), tissue: 'vessel', opacity: ra.k });
    items.push({ key: 'rotHead', ...tubeOf(ra.head, (u) => lerp(0.1, 0.004, u), 14), color: MC.arc, deep: darker(MC.arc), tissue: 'vessel', opacity: ra.k });
  }

  return { items, pts };
}

/**
 * The rotation arrow: an arc round the loop's axis from where the cranial limb started to where it is now
 * (0..270°), its head, the point for the degree readout and the angle. Null while there is nothing to show.
 */
export function rotArc(pose: MidPose): { line: V3[]; head: V3[]; label: V3; deg: number; k: number } | null {
  const k = clamp01(pose.arc);
  const th = clamp01(pose.rot) * 1.5 * Math.PI;
  if (k <= 0.01 || th < 0.08) return null;
  const hern = clamp01(pose.hern);
  const dLen = lerp(1.35, 3.35, hern);
  const C = add(ROOT, mul(AX, dLen * 0.5));
  const R = loopW(hern) + 0.34;
  const P = (ph: number): V3 => add(C, mul(add(mul(E0, Math.cos(ph)), mul(F0, Math.sin(ph))), R));
  const n = Math.max(6, Math.ceil(th / 0.06));
  const end = Math.max(0.02, th - 0.16 / R);
  const line = Array.from({ length: n + 1 }, (_, i) => P((end * i) / n));
  const tan = norm(add(mul(E0, -Math.sin(end)), mul(F0, Math.cos(end))));
  const h0 = P(end);
  const head = Array.from({ length: 6 }, (_, i) => add(h0, mul(tan, (0.26 * i) / 5)));
  const label = add(C, mul(add(mul(E0, Math.cos(th)), mul(F0, Math.sin(th))), R + 0.32));
  return { line, head, label, deg: (th * 180) / Math.PI, k };
}
