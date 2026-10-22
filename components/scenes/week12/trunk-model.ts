import { add, mix3, type V3 } from '@/lib/three-d/math';
import { curve3 } from '@/lib/three-d/mesh';
import type { Item3 } from '@/lib/three-d/scene';
import { blobParts, mixHex, tubeParts } from '@/components/scenes/week10/model3d';
import { T } from '@/components/scenes/week10/common';

/**
 * Topic 12's descending aorta and everything it gives (notes 2.5–2.7), in the adult frame of the arch
 * model (arteries3d `descend` = 1): the same axes and units, so the camera can follow the aorta down from
 * the arch to the pelvis and out into the limbs without a cut.
 *
 * Axes: x towards the embryo's LEFT, y cranial, z ventral (a camera in front shows the left on the right).
 *
 * Three groups of branches, each in its own colour (as the notes' figures tell them apart): ventral
 * (to the gut: the oesophageal pairs, coeliac trunk, superior and inferior mesenteric arteries),
 * lateral (to the suprarenal glands, kidneys and gonads) and posterolateral (the intersegmental
 * arteries at every level: cervical → vertebral artery, thoracic → intercostal, lumbar, lateral sacral).
 * Then the umbilical and iliac arteries, and the axial arteries of the limbs.
 */

export const TC = {
  aorta: '#dc2626',
  ventral: '#ff9a3c',
  celiac: '#ff9a3c',
  sma: '#e0408f',
  ima: '#7c5cff',
  oeso: '#14b8a6',
  lateral: '#38bdf8',
  supra: '#f59e0b',
  renal: '#38bdf8',
  gonad: '#a78bfa',
  interseg: '#4ade80',
  vertebral: '#fb7185',
  umb: '#3b82f6',
  iliac: '#ef4444',
  ext: '#f97316',
  int: '#ec4899',
  femoral: '#facc15',
  axial: '#22d3ee',
  radial: '#a3e635',
  ulnar: '#f472b6',
  ligament: '#c9c1b2',
  // Context.
  bone: '#e9e1cf',
  boneDeep: '#8a7f66',
  gut: '#f2c14e',
  gutDeep: '#9a7a1f',
  kidney: '#c0504d',
  kidneyDeep: '#5a2120',
  adrenal: '#e8963c',
  adrenalDeep: '#7a4410',
  gonadOrg: '#6d5bd0',
  gonadDeep: '#2c2366',
  bladder: '#e8d27a',
  bladderDeep: '#8a7a2a',
  skin: '#f0c9b4',
  skinDeep: '#a07060',
} as const;

export interface TrunkPose {
  /** The descending aorta itself, drawn down from the arch (0..1 of its length). */
  aorta: number;
  oeso: number;
  /** Coeliac trunk, superior and inferior mesenteric arteries (0..1 each). */
  celiac: number;
  sma: number;
  ima: number;
  supra: number;
  renal: number;
  gonadal: number;
  /** Intersegmental arteries by region (0..1 each). */
  cerv: number;
  thor: number;
  lumb: number;
  sacr: number;
  /** Cervical intersegmentals: longitudinal anastomoses (0..1), then their link to the aorta lost (0..1). */
  anast: number;
  cervLoss: number;
  /** Umbilical arteries (0..1); their root moved from the aorta to the internal iliac (0..1). */
  umb: number;
  umbShift: number;
  /** Common iliac from the 5th lumbar intersegmental (0..1); external and internal iliac (0..1). */
  common: number;
  ext: number;
  int: number;
  /** After birth: umbilical artery → medial umbilical ligament + superior vesical artery (0..1). */
  birth: number;
  /** Upper limb: growth (0 = 30-day bud, 0.5 = 41 days, 1 = 46 days), axial artery (0..1), radial and ulnar (0..1). */
  arm: number;
  armAxial: number;
  armBranches: number;
  /** Lower limb: growth, axial artery (0..1), femoral (0..1), the axial's proximal part gone (0..1). */
  leg: number;
  legAxial: number;
  femoral: number;
  legTake: number;
}

export const TP0: TrunkPose = {
  aorta: 1,
  oeso: 0,
  celiac: 0,
  sma: 0,
  ima: 0,
  supra: 0,
  renal: 0,
  gonadal: 0,
  cerv: 0,
  thor: 0,
  lumb: 0,
  sacr: 0,
  anast: 0,
  cervLoss: 0,
  umb: 0,
  umbShift: 0,
  common: 0,
  ext: 0,
  int: 0,
  birth: 0,
  arm: 0,
  armAxial: 0,
  armBranches: 0,
  leg: 0,
  legAxial: 0,
  femoral: 0,
  legTake: 0,
};

export interface TrunkOpts {
  spine?: number;
  gut?: number;
  organs?: number;
  bladder?: number;
  limbs?: number;
  ghosts?: number;
  /** 0..1: every branch takes its group's colour (ventral, lateral, posterolateral), as the notes sort them. */
  groupColour?: number;
  dim?: { ids: readonly string[]; k: number } | null;
}

/** The three groups of the descending aorta's branches (notes 2.5) and their colours. */
const GROUP_OF: Record<string, string> = {
  'hestegorriko-arteriak': TC.ventral,
  'enbor-zeliakoa': TC.ventral,
  'goiko-arteria-mesenterikoa': TC.ventral,
  'beheko-arteria-mesenterikoa': TC.ventral,
  'giltzurrun-gaineko-arteriak': TC.lateral,
  'giltzurrun-arteriak': TC.lateral,
  'arteria-gonadalak': TC.lateral,
  'segmentu-arteko-arteriak': TC.interseg,
  'saihets-arteko-arteriak': TC.interseg,
  'arteria-lunbarrak': TC.interseg,
  'alboko-arteria-sakroak': TC.interseg,
};

const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
const darker = (c: string) => mixHex(c, '#000000', 0.55);
const L = (kps: readonly V3[], n = 20) => curve3(kps as V3[], n);
const grown = (line: V3[], g: number) => (g >= 0.999 ? line : line.slice(0, Math.max(2, Math.round(line.length * clamp01(g)))));
const goingRadius = (r: number, g: number) => (g <= 0.001 ? () => r : (u: number) => r * Math.max(0.12, 1 - g * (1.25 - 0.55 * Math.abs(2 * u - 1))));
const X = (s: number, p: V3): V3 => [s * p[0], p[1], p[2]];

/** The descending aorta (from the arch model's fusion point down to the sacrum). */
export const AORTA: V3[] = L([[0.06, -2.0, -0.86], [0.04, -3.5, -0.88], [0.02, -5.0, -0.88], [0, -6.6, -0.88], [0, -7.8, -0.9], [0, -8.9, -0.92]], 40);
const SACRAL: V3[] = L([[0, -8.9, -0.92], [0, -9.7, -0.98], [0, -10.6, -1.08]], 12);
const aortaAt = (y: number): V3 => {
  for (let i = 1; i < AORTA.length; i++) if (AORTA[i][1] <= y) return mix3(AORTA[i - 1], AORTA[i], (AORTA[i - 1][1] - y) / (AORTA[i - 1][1] - AORTA[i][1]));
  return AORTA[AORTA.length - 1];
};

/** Vertebral levels (y): cervical C1–C7, thoracic T1–T12, lumbar L1–L5, then the sacrum. */
export const LEVELS = {
  cerv: [3.7, 3.15, 2.6, 2.05, 1.5, 0.95, 0.4],
  thor: Array.from({ length: 12 }, (_, i) => -0.1 - i * 0.5),
  lumb: Array.from({ length: 5 }, (_, i) => -6.25 - i * 0.62),
  sacr: [-9.45, -9.9, -10.35],
};
/** Intersegmental levels: between two vertebrae. */
const between = (a: readonly number[]) => a.slice(0, -1).map((y, i) => (y + a[i + 1]) / 2);

export const UMB_ROOT = (s: number): V3 => X(s, [0.08, -9.7, -0.95]);
const U = (s: number): V3 => X(s, [0.8, -10.2, -0.6]);
const BIF = (s: number): V3 => X(s, [0.85, -9.55, -0.85]);
const INGUINAL = (s: number): V3 => X(s, [1.3, -10.35, -0.05]);
const SHOULDER = (s: number): V3 => X(s, [2.35, 0.05, -0.1]);
const HIP = (s: number): V3 => X(s, [1.3, -10.4, -0.15]);

export interface TrunkModel {
  items: Item3[];
  pts: Record<string, V3>;
}

export function trunkModel(pose: TrunkPose, o: TrunkOpts = {}): TrunkModel {
  const items: Item3[] = [];
  const pts: Record<string, V3> = {};
  const dim = o.dim;
  const fade = (id: string, groups?: string[]) => (!dim || dim.k <= 0.001 || dim.ids.includes(id) || (groups ?? []).some((g) => dim.ids.includes(g)) ? 1 : 1 - 0.8 * dim.k);
  const ghost = o.ghosts ?? 0;
  const vessel = (key: string, id: string, line: V3[], color: string, r: number | ((u: number) => number), show = 1, extra: Partial<Item3> = {}) => {
    if (show <= 0.01 || line.length < 2) return;
    const g = GROUP_OF[id];
    if (g && (o.groupColour ?? 0) > 0.001) color = mixHex(color, g, o.groupColour!);
    items.push({ key, id, ...tubeParts(line, { radius: typeof r === 'number' ? () => r : r, ref: [0, 0, 1], sides: 12, capStart: true, capEnd: true }), color, deep: darker(color), tissue: 'vessel', show, opacity: fade(id, extra.groups), ...extra });
  };
  const ghostOf = (key: string, line: V3[], r: number, g: number) => {
    const k = ghost * clamp01((g - 0.35) / 0.55);
    if (k <= 0.01) return;
    items.push({ key: `ghost-${key}`, ...tubeParts(line, { radius: () => r * 0.5, ref: [0, 0, 1], sides: 8, capStart: true, capEnd: true }), color: '#d8d2e6', deep: '#5a5468', tissue: 'membrane', opacity: 0.16 * k, outline: false });
  };

  // ———— the aorta ————
  const ao = grown(AORTA, pose.aorta);
  vessel('aorta-desc', 'beheranzko-aorta', ao, TC.aorta, (u) => lerp(0.15, 0.12, u), 1, { groups: ['aorta'] });
  if (pose.aorta > 0.99) vessel('aorta-sacral', 'beheranzko-aorta', SACRAL, TC.aorta, (u) => lerp(0.08, 0.04, u), 1, { groups: ['aorta'] });
  pts['beheranzko-aorta'] = aortaAt(-4.2);
  pts['aorta-torazikoa'] = aortaAt(-3.2);
  pts['aorta-abdominala'] = aortaAt(-7.6);

  // ———— context: the spine, the gut, the organs ————
  const sp = o.spine ?? 0;
  if (sp > 0.01) {
    const all = [...LEVELS.cerv, ...LEVELS.thor, ...LEVELS.lumb];
    all.forEach((y, i) => {
      const r = i < 7 ? 0.22 : i < 19 ? 0.27 : 0.33;
      items.push({ key: `vb${i}`, id: 'ornoak', ...blobParts({ center: [0, y, -1.5], radii: [r * 1.15, 0.19, r], rings: 8, sides: 14 }), color: TC.bone, deep: TC.boneDeep, tissue: 'bone', opacity: 0.32 * sp, outline: false, quiet: true });
    });
    items.push({ key: 'sacrum', id: 'ornoak', ...blobParts({ center: [0, -10.0, -1.62], radii: [0.6, 0.85, 0.3], rings: 10, sides: 14 }), color: TC.bone, deep: TC.boneDeep, tissue: 'bone', opacity: 0.3 * sp, outline: false, quiet: true });
    pts['ornoak'] = [0.35, -4.6, -1.5];
  }
  const gut = o.gut ?? 0;
  if (gut > 0.01) {
    const g = (key: string, id: string, line: V3[], r: number) => items.push({ key, id, ...tubeParts(line, { radius: () => r, ref: [0, 0, 1], sides: 12, capStart: true, capEnd: true }), color: TC.gut, deep: TC.gutDeep, tissue: 'epithelium', opacity: 0.4 * gut, outline: false, quiet: true });
    g('oesophagus', 'hestegorria', L([[0, 1.2, -0.42], [0.02, -2.0, -0.45], [0.05, -5.0, -0.42], [0.25, -6.4, -0.3]], 20), 0.11);
    items.push({ key: 'stomach', id: 'urdaila', ...blobParts({ center: [0.6, -6.85, -0.05], radii: [0.55, 0.42, 0.34], rings: 12, sides: 16 }), color: TC.gut, deep: TC.gutDeep, tissue: 'epithelium', opacity: 0.4 * gut, outline: false, quiet: true, groups: ['aurreko-hestea'] });
    g('midgut', 'erdiko-hestea', L([[0.2, -7.05, -0.1], [-0.35, -7.3, -0.15], [-0.4, -7.7, 0.4], [-0.1, -8.4, 0.85], [0.35, -8.1, 0.75], [0.3, -7.6, 0.45], [-0.6, -7.9, 0.2], [-0.9, -8.6, 0.1], [-0.7, -7.2, -0.1], [0.4, -7.05, -0.2], [0.95, -7.3, -0.3]], 36), 0.12);
    g('hindgut', 'atzeko-hestea', L([[0.95, -7.3, -0.3], [1.0, -8.3, -0.4], [0.8, -9.4, -0.5], [0.3, -10.0, -0.6], [0, -10.6, -0.7]], 18), 0.12);
    pts['hestegorria'] = [0.02, -1.0, -0.4];
    pts['urdaila'] = [0.75, -6.85, 0.2];
    pts['erdiko-hestea'] = [-0.1, -8.4, 0.9];
    pts['atzeko-hestea'] = [0.95, -8.6, -0.4];
    pts['aurreko-hestea'] = [0.6, -6.6, 0.2];
  }
  const org = o.organs ?? 0;
  if (org > 0.01)
    for (const s of [-1, 1]) {
      const n = s < 0 ? 'R' : 'L';
      items.push({ key: `adrenal${n}`, id: 'giltzurrun-gaineko-guruinak', ...blobParts({ center: X(s, [0.78, -6.75, -0.9]), radii: [0.24, 0.3, 0.16], rings: 10, sides: 12 }), color: TC.adrenal, deep: TC.adrenalDeep, tissue: 'epithelium', opacity: 0.7 * org });
      items.push({ key: `kidney${n}`, id: 'giltzurruna', ...blobParts({ center: X(s, [1.05, -7.55, -1.0]), radii: [0.3, 0.55, 0.24], rings: 12, sides: 14 }), color: TC.kidney, deep: TC.kidneyDeep, tissue: 'epithelium', opacity: 0.72 * org });
      items.push({ key: `gonad${n}`, id: 'gonadak', ...blobParts({ center: X(s, [0.92, -9.35, -0.55]), radii: [0.17, 0.3, 0.15], rings: 10, sides: 12 }), color: TC.gonadOrg, deep: TC.gonadDeep, tissue: 'epithelium', opacity: 0.75 * org });
      if (s > 0) {
        pts['giltzurrun-gaineko-guruinak'] = X(s, [0.85, -6.6, -0.8]);
        pts['giltzurruna'] = X(s, [1.22, -7.75, -0.9]);
        pts['gonadak'] = X(s, [1.0, -9.45, -0.45]);
      }
    }
  const bl = o.bladder ?? 0;
  if (bl > 0.01) {
    items.push({ key: 'bladder', id: 'gernu-maskuria', ...blobParts({ center: [0, -9.95, 0.75], radii: [0.42, 0.42, 0.34], rings: 12, sides: 14 }), color: TC.bladder, deep: TC.bladderDeep, tissue: 'epithelium', opacity: 0.55 * bl });
    pts['gernu-maskuria'] = [0.1, -10.15, 1.0];
  }

  // ———— ventral branches ————
  if (pose.oeso > 0.01)
    [-2.4, -2.95, -3.5, -4.05, -4.6].forEach((y, i) => {
      for (const s of [-1, 1]) {
        const a = aortaAt(y);
        const line = L([add(a, [s * 0.05, 0, 0.1]), X(s, [0.12, y + 0.02, -0.62]), X(s, [0.1, y + 0.08, -0.48])], 8);
        vessel(`oeso${i}${s}`, 'hestegorriko-arteriak', grown(line, pose.oeso), TC.oeso, 0.04);
        if (i === 2 && s > 0) pts['hestegorriko-arteriak'] = line[4];
      }
    });
  if (pose.celiac > 0.01) {
    const a = aortaAt(-6.55);
    const trunk = L([add(a, [0, 0, 0.1]), [0.02, -6.58, -0.55], [0.04, -6.62, -0.3]], 10);
    vessel('celiac', 'enbor-zeliakoa', grown(trunk, pose.celiac * 2), TC.celiac, 0.06);
    if (pose.celiac > 0.5) {
      const k = (pose.celiac - 0.5) * 2;
      vessel('celiac-spl', 'enbor-zeliakoa', grown(L([[0.04, -6.62, -0.3], [0.5, -6.55, -0.3], [1.0, -6.6, -0.35]], 10), k), TC.celiac, 0.04);
      vessel('celiac-hep', 'enbor-zeliakoa', grown(L([[0.04, -6.62, -0.3], [-0.4, -6.55, -0.15], [-0.85, -6.4, 0.05]], 10), k), TC.celiac, 0.04);
      vessel('celiac-gas', 'enbor-zeliakoa', grown(L([[0.04, -6.62, -0.3], [0.25, -6.45, -0.2], [0.45, -6.5, -0.0]], 8), k), TC.celiac, 0.035);
    }
    pts['enbor-zeliakoa'] = [0.03, -6.6, -0.42];
  }
  if (pose.sma > 0.01) {
    const a = aortaAt(-7.15);
    const line = L([add(a, [0, 0, 0.1]), [0, -7.3, -0.45], [-0.05, -7.6, 0.0], [-0.1, -8.0, 0.45], [-0.12, -8.35, 0.75]], 14);
    vessel('sma', 'goiko-arteria-mesenterikoa', grown(line, pose.sma), TC.sma, 0.06);
    pts['goiko-arteria-mesenterikoa'] = line[6];
  }
  if (pose.ima > 0.01) {
    const a = aortaAt(-8.45);
    const line = L([add(a, [0.03, 0, 0.1]), [0.25, -8.65, -0.62], [0.5, -9.0, -0.52], [0.7, -9.4, -0.48]], 12);
    vessel('ima', 'beheko-arteria-mesenterikoa', grown(line, pose.ima), TC.ima, 0.05);
    pts['beheko-arteria-mesenterikoa'] = line[5];
  }

  // ———— lateral branches ————
  for (const s of [-1, 1]) {
    const n = s < 0 ? 'R' : 'L';
    if (pose.supra > 0.01) {
      const line = L([add(aortaAt(-6.85), [s * 0.1, 0, -0.02]), X(s, [0.45, -6.82, -0.9]), X(s, [0.7, -6.78, -0.9])], 8);
      vessel(`supra${n}`, 'giltzurrun-gaineko-arteriak', grown(line, pose.supra), TC.supra, 0.04);
      if (s > 0) pts['giltzurrun-gaineko-arteriak'] = line[4];
    }
    if (pose.renal > 0.01) {
      const line = L([add(aortaAt(-7.45), [s * 0.12, 0, -0.04]), X(s, [0.5, -7.5, -0.98]), X(s, [0.85, -7.55, -1.0])], 10);
      vessel(`renal${n}`, 'giltzurrun-arteriak', grown(line, pose.renal), TC.renal, 0.06);
      if (s > 0) pts['giltzurrun-arteriak'] = line[5];
    }
    if (pose.gonadal > 0.01) {
      const line = L([add(aortaAt(-8.05), [s * 0.1, 0, 0.04]), X(s, [0.45, -8.4, -0.78]), X(s, [0.75, -8.95, -0.65]), X(s, [0.88, -9.15, -0.58])], 14);
      vessel(`gonadal${n}`, 'arteria-gonadalak', grown(line, pose.gonadal), TC.gonad, 0.035);
      if (s > 0) pts['arteria-gonadalak'] = line[7];
    }
  }

  // ———— posterolateral branches: the intersegmental arteries ————
  for (const s of [-1, 1]) {
    const n = s < 0 ? 'R' : 'L';
    // Cervical: at first from the dorsal aorta's line; longitudinal anastomoses join them; then they lose the aorta: the vertebral artery.
    if (pose.cerv > 0.01) {
      const lv = between(LEVELS.cerv);
      const chain: V3[] = [];
      lv.forEach((y, i) => {
        const root = X(s, [0.6, y + 0.05, -0.2]);
        const end = X(s, [0.55, y, -1.3]);
        chain.push(end);
        const line = L([root, X(s, [0.62, y + 0.02, -0.75]), end], 8);
        vessel(`cerv${i}${n}`, 'segmentu-arteko-arteriak', grown(line, pose.cerv), TC.interseg, goingRadius(0.035, pose.cervLoss), 1 - clamp01((pose.cervLoss - 0.75) * 4), { groups: ['lepoko-segmentu-arteko-arteriak'] });
        ghostOf(`cerv${i}${n}`, line, 0.035, pose.cervLoss);
      });
      if (pose.anast > 0.01) {
        // The chain (ascending from the subclavian): the vertebral artery.
        const from = s < 0 ? ([-1.5, 0.36, 0.0] as V3) : ([1.2, 0.05, -0.12] as V3);
        const line = L([from, X(s, [0.8, 0.55, -0.9]), ...[...chain].reverse(), X(s, [0.4, 3.75, -1.3]), X(s, [0.1, 4.2, -1.15])], 30);
        vessel(`vert${n}`, 'orno-arteria', grown(line, pose.anast), TC.vertebral, 0.045, 1, { groups: ['luzetarako-anastomosiak'] });
        if (s > 0) {
          pts['orno-arteria'] = line[14];
          pts['luzetarako-anastomosiak'] = line[18];
        }
      }
      if (s > 0) pts['lepoko-segmentu-arteko-arteriak'] = X(s, [0.62, between(LEVELS.cerv)[3], -0.75]);
    }
    if (pose.thor > 0.01)
      between(LEVELS.thor).forEach((y, i) => {
        if (i < 1) return;
        const line = L([add(aortaAt(y), [s * 0.1, 0, -0.06]), X(s, [0.55, y + 0.04, -1.22]), X(s, [1.25, y - 0.1, -1.18]), X(s, [1.85, y - 0.35, -0.5]), X(s, [1.95, y - 0.6, 0.35]), X(s, [1.4, y - 0.85, 1.15])], 18);
        vessel(`thor${i}${n}`, 'saihets-arteko-arteriak', grown(line, pose.thor), TC.interseg, 0.032, 1, { groups: ['segmentu-arteko-arteriak'] });
        if (i === 6 && s > 0) pts['saihets-arteko-arteriak'] = line[11];
      });
    if (pose.lumb > 0.01)
      between([LEVELS.thor[11], ...LEVELS.lumb]).forEach((y, i) => {
        if (i > 3) return;
        const line = L([add(aortaAt(y), [s * 0.1, 0, -0.06]), X(s, [0.6, y, -1.25]), X(s, [1.3, y - 0.1, -1.1]), X(s, [1.75, y - 0.25, -0.45])], 14);
        vessel(`lumb${i}${n}`, 'arteria-lunbarrak', grown(line, pose.lumb), TC.interseg, 0.034, 1, { groups: ['segmentu-arteko-arteriak'] });
        if (i === 2 && s > 0) pts['arteria-lunbarrak'] = line[9];
      });
    if (pose.sacr > 0.01)
      LEVELS.sacr.forEach((y, i) => {
        const line = L([[s * 0.04, y + 0.1, -1.04], X(s, [0.35, y, -1.25]), X(s, [0.6, y - 0.1, -1.5])], 8);
        vessel(`sacr${i}${n}`, 'alboko-arteria-sakroak', grown(line, pose.sacr), TC.interseg, 0.028, 1, { groups: ['segmentu-arteko-arteriak'] });
        if (i === 1 && s > 0) pts['alboko-arteria-sakroak'] = line[5];
      });
  }

  // ———— umbilical and iliac arteries ————
  for (const s of [-1, 1]) {
    const n = s < 0 ? 'R' : 'L';
    const sh = clamp01(pose.umbShift);
    // Common iliac (from the 5th lumbar intersegmental): aorta → bifurcation.
    if (pose.common > 0.01) {
      const line = L([[s * 0.05, -8.88, -0.92], X(s, [0.5, -9.25, -0.92]), BIF(s)], 10);
      vessel(`common${n}`, 'arteria-iliako-primitiboak', grown(line, pose.common), TC.iliac, 0.075);
      if (s > 0) pts['arteria-iliako-primitiboak'] = line[5];
    }
    if (pose.ext > 0.01) {
      const line = L([BIF(s), X(s, [1.12, -9.95, -0.55]), INGUINAL(s)], 10);
      vessel(`ext${n}`, 'kanpoko-arteria-iliakoa', grown(line, pose.ext), TC.ext, 0.06);
      if (s > 0) pts['kanpoko-arteria-iliakoa'] = line[5];
      pts[`iztai${n}`] = INGUINAL(s);
    }
    if (pose.int > 0.01) {
      const line = L([BIF(s), X(s, [0.92, -9.95, -0.88]), U(s)], 10);
      vessel(`int${n}`, 'barneko-arteria-iliakoa', grown(line, pose.int), TC.int, 0.06);
      if (s > 0) pts['barneko-arteria-iliakoa'] = line[5];
    }
    if (pose.umb > 0.01) {
      // Root: the aorta's ventral wall at the sacrum (lost as the internal iliac takes it).
      const root = L([UMB_ROOT(s), X(s, [0.5, -9.95, -0.78]), U(s)], 10);
      vessel(`umbRoot${n}`, 'zilbor-arteriak', root, TC.umb, goingRadius(0.06, sh), (1 - clamp01((sh - 0.75) * 4)) * clamp01(pose.umb * 3));
      ghostOf(`umbRoot${n}`, root, 0.06, sh);
      // Proximal (→ superior vesical artery) and distal (→ medial umbilical ligament) parts.
      const prox = L([U(s), X(s, [0.72, -10.3, 0.0]), X(s, [0.45, -9.95, 0.55])], 10);
      const dist = L([X(s, [0.45, -9.95, 0.55]), X(s, [0.32, -8.8, 1.2]), X(s, [0.1, -7.7, 1.45]), X(s, [0.05, -7.75, 2.6])], 18);
      const b = clamp01(pose.birth);
      const g = clamp01(pose.umb);
      const all = [...prox, ...dist.slice(1)];
      const upTo = Math.round(all.length * g);
      vessel(`umbProx${n}`, b > 0.5 ? 'goiko-gernu-maskuri-arteria' : 'zilbor-arteriak', prox.slice(0, Math.max(2, Math.min(prox.length, upTo))), mixHex(TC.umb, TC.int, 0.5 * b), 0.06, 1, { groups: ['zilbor-arteriak', 'goiko-gernu-maskuri-arteria'] });
      if (upTo > prox.length)
        vessel(`umbDist${n}`, b > 0.5 ? 'erdialdeko-zilbor-lotailua' : 'zilbor-arteriak', dist.slice(0, Math.max(2, upTo - prox.length + 1)), mixHex(TC.umb, TC.ligament, b), (u) => lerp(0.06, 0.03, b) * (1 - 0.1 * b * Math.sin(Math.PI * u)), 1, { groups: ['zilbor-arteriak', 'erdialdeko-zilbor-lotailua'], tissue: b > 0.5 ? 'tendon' : 'vessel' });
      if (s > 0) {
        pts['zilbor-arteriak'] = dist[6];
        pts['goiko-gernu-maskuri-arteria'] = prox[6];
        pts['erdialdeko-zilbor-lotailua'] = dist[8];
      }
    }
  }

  // ———— limbs ————
  const lim = o.limbs ?? 0;
  for (const s of [-1, 1]) {
    const n = s < 0 ? 'R' : 'L';
    // Upper limb: a bud (30 days) that lengthens into an arm with a hand plate (46 days).
    if (pose.arm > -0.5 && (pose.armAxial > 0.01 || lim > 0.01)) {
      const g = clamp01(pose.arm);
      const S = SHOULDER(s);
      const k = 0.32 + 0.68 * g;
      const at = (p: V3): V3 => add(S, [(p[0] - S[0]) * k, (p[1] - S[1]) * k, (p[2] - S[2]) * k]);
      const E = at(X(s, [3.0, -1.7, 0.25]));
      const W = at(X(s, [3.05, -3.2, 0.85]));
      const Hc = at(X(s, [3.0, -3.75, 1.15]));
      if (lim > 0.01) {
        items.push({ key: `arm${n}`, id: 'goiko-gorputz-adarra', ...tubeParts(L([S, E, W], 16), { radius: (u) => lerp(0.42, 0.26, u) * (0.75 + 0.25 * g), ref: [0, 0, 1], sides: 16, capStart: true, capEnd: true }), color: TC.skin, deep: TC.skinDeep, tissue: 'skin', opacity: 0.16 * lim, outline: false, quiet: true });
        items.push({ key: `hand${n}`, id: 'goiko-gorputz-adarra', ...blobParts({ center: Hc, radii: [0.2 + 0.08 * g, 0.4 * k + 0.1, 0.36 * k + 0.1], rings: 10, sides: 14 }), color: TC.skin, deep: TC.skinDeep, tissue: 'skin', opacity: 0.16 * lim, outline: false, quiet: true });
      }
      if (pose.armAxial > 0.01) {
        const brach = L([S, mix3(S, E, 0.5), E], 12);
        const inter = L([E, mix3(E, W, 0.5), W], 12);
        const arch = L([add(Hc, X(s, [0.12, 0.08, -0.3 * k])), add(Hc, X(s, [-0.05, -0.12, 0])), add(Hc, X(s, [-0.12, 0.05, 0.3 * k]))], 10);
        const all = [...brach, ...inter.slice(1)];
        vessel(`armAx${n}`, 'ardatz-arteria', grown(all, pose.armAxial), TC.axial, 0.05, 1, { groups: ['arteria-brakiala', 'hezur-arteko-arteria'] });
        vessel(`armAxW${n}`, 'ardatz-arteria', L([W, Hc], 6), TC.axial, 0.045, clamp01(pose.armAxial * 2 - 1));
        vessel(`palmar${n}`, 'eskuaurreko-arku-sakona', arch, TC.axial, 0.035, clamp01(pose.armAxial * 2 - 1));
        if (s > 0) {
          pts['ardatz-arteria'] = brach[6];
          pts['arteria-brakiala'] = brach[7];
          pts['hezur-arteko-arteria'] = inter[6];
          pts['eskuaurreko-arku-sakona'] = arch[5];
          pts['goiko-gorputz-adarra'] = add(E, X(s, [0.35, 0, 0]));
        }
        if (pose.armBranches > 0.01) {
          const E2 = mix3(E, W, 0.12);
          const rad = L([E2, add(mix3(E, W, 0.55), X(s, [0.22, 0, 0.12])), arch[0]], 14);
          const uln = L([E2, add(mix3(E, W, 0.55), X(s, [-0.2, 0, 0.1])), arch[arch.length - 1]], 14);
          vessel(`radial${n}`, 'arteria-erradiala', grown(rad, pose.armBranches), TC.radial, 0.04);
          vessel(`ulnar${n}`, 'arteria-kubitala', grown(uln, pose.armBranches), TC.ulnar, 0.04);
          if (s > 0) {
            pts['arteria-erradiala'] = rad[8];
            pts['arteria-kubitala'] = uln[8];
          }
        }
      }
    }
    // Lower limb.
    if (pose.legAxial > 0.01 || pose.femoral > 0.01 || lim > 0.01) {
      const g = clamp01(pose.leg);
      const H = HIP(s);
      const k = 0.32 + 0.68 * g;
      const at = (p: V3): V3 => add(H, [(p[0] - H[0]) * k, (p[1] - H[1]) * k, (p[2] - H[2]) * k]);
      const K = at(X(s, [1.75, -10.95, 1.55]));
      const A = at(X(s, [1.6, -12.55, 1.35]));
      const F = at(X(s, [1.6, -12.9, 2.0]));
      if (lim > 0.01) {
        items.push({ key: `leg${n}`, id: 'beheko-gorputz-adarra', ...tubeParts(L([H, mix3(H, K, 0.5), K, A], 18), { radius: (u) => lerp(0.5, 0.26, u) * (0.75 + 0.25 * g), ref: [1, 0, 0], sides: 16, capStart: true, capEnd: true }), color: TC.skin, deep: TC.skinDeep, tissue: 'skin', opacity: 0.16 * lim, outline: false, quiet: true });
        items.push({ key: `foot${n}`, id: 'beheko-gorputz-adarra', ...blobParts({ center: F, radii: [0.22 + 0.06 * g, 0.18 + 0.06 * g, 0.36 * k + 0.08], rings: 10, sides: 14 }), color: TC.skin, deep: TC.skinDeep, tissue: 'skin', opacity: 0.16 * lim, outline: false, quiet: true });
        if (s > 0) pts['beheko-gorputz-adarra'] = add(K, [0.4, 0.1, 0]);
      }
      // The axial artery: from the internal iliac (the umbilical's root) behind the thigh, behind the knee, down the leg.
      const P1 = X(s, [1.05, -10.3, -0.62]);
      const sciatic = L([U(s), P1, at(X(s, [1.5, -10.85, 0.3])), mix3(K, A, 0.08)], 14);
      const pop = L([mix3(K, A, 0.08), mix3(K, A, 0.2)], 6);
      const per = L([mix3(K, A, 0.2), add(mix3(K, A, 0.6), X(s, [-0.1, 0, -0.1])), add(A, X(s, [-0.08, 0, -0.12]))], 12);
      if (pose.legAxial > 0.01) {
        const tk = clamp01(pose.legTake);
        vessel(`sciatic${n}`, tk > 0.5 ? 'arteria-ziatikoa' : 'ardatz-arteria', grown(sciatic, pose.legAxial * 1.6), TC.axial, goingRadius(0.05, tk * 0.8), 1, { groups: ['ardatz-arteria', 'arteria-ziatikoa'] });
        vessel(`pop${n}`, 'arteria-popliteoa', pop, TC.axial, 0.05, clamp01(pose.legAxial * 3 - 1.5), { groups: ['ardatz-arteria'] });
        vessel(`per${n}`, 'arteria-peroneoa', grown(per, pose.legAxial * 3 - 2), TC.axial, 0.04, pose.legAxial > 0.67 ? 1 : 0, { groups: ['ardatz-arteria'] });
        if (s > 0) {
          pts['arteria-ziatikoa'] = sciatic[6];
          pts['arteria-popliteoa'] = pop[3];
          pts['arteria-peroneoa'] = per[7];
        }
      }
      if (pose.femoral > 0.01) {
        const fem = L([INGUINAL(s), at(X(s, [1.5, -10.55, 0.75])), mix3(K, A, 0.08)], 14);
        vessel(`fem${n}`, 'arteria-femorala', grown(fem, pose.femoral), TC.femoral, 0.055);
        if (s > 0) pts['arteria-femorala'] = fem[6];
      }
    }
  }
  return { items, pts };
}
