import { add, cross, mix3, mul, norm, sub, type V3 } from '@/lib/three-d/math';
import { curve3, grid } from '@/lib/three-d/mesh';
import { cachedMesh } from '@/lib/three-d/mesh-cache';
import type { Item3 } from '@/lib/three-d/scene';
import { blobParts, mixHex, tubeParts } from '@/components/scenes/week10/model3d';
import { T } from '@/components/scenes/week10/common';
import { EC, EP0, P, embryoModel, type EmbryoPose } from '@/components/scenes/week12/embryo-model';

/**
 * Topic 14's gut, in 3D: one tube from the oropharyngeal membrane to the cloacal membrane, posed per stage.
 *
 * The embryo frame (stages 2–5, notes 2.1–2.3): the curled 5-week embryo of every topic (topic 12's
 * `embryoModel`, as glass, with its heart and aorta) and, inside it, this topic's own gut placed with the same
 * `P(θ, out, x)`: θ along the curled body axis (head ≈ 1.7, tail ≈ −2.1), `out` from the axis (negative =
 * ventral), x towards the embryo's LEFT. The gut is one centreline whose θ falls monotonically from the
 * pharynx to the cloaca (the midgut loop reaches out to the vitelline duct and comes back), so each level
 * (θ) has one gut point: the mesenteries hang from it and the parts are cut at fixed θ stations.
 *
 * Axes (as every model of topics 10–13): x towards the embryo's LEFT, y cranial, z ventral. Seen from the
 * embryo's left (the notes' sagittal figures, p2–p3), the face is on the viewer's left, the back on the right.
 *
 * Colour = origin, then region: the endoderm is topic 10's yellow; once the parts are told apart each takes
 * the colour of the artery that feeds it (topic 12: coeliac trunk orange, superior mesenteric pink, inferior
 * mesenteric violet) and the pharyngeal gut its own teal. Septum transversum mesoderm is topic 7's orange,
 * the peritoneum topic 7's rose (visceral) and pink (parietal), the peritoneal cavity topic 7's green.
 */

// ———————————————————————————— colours ————————————————————————————

export const GC = {
  endo: T.endo,
  endoDeep: T.endoDeep,
  /** Regions = the artery that feeds them (topic 12). */
  fore: EC.celiac,
  mid: EC.sma,
  hind: EC.ima,
  pharynx: '#2ec4b6',
  resp: '#7dd3fc',
  respDeep: '#2b6f99',
  septum: T.septum,
  septumDeep: T.septumDeep,
  liver: EC.liver,
  liverDeep: EC.liverDeep,
  visceral: T.visceral,
  parietal: T.parietal,
  cavity: '#7fd893',
  membrane: '#dfe6f7',
  yolk: EC.yolk,
  yolkDeep: EC.yolkDeep,
  kidney: '#c86b5a',
  ivc: T.deo2,
} as const;

const darker = (c: string) => mixHex(c, '#000000', 0.55);
const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
const ss = (a: number, b: number, x: number) => {
  const u = clamp01((x - a) / (b - a));
  return u * u * (3 - 2 * u);
};

// ———————————————————————————— stations (θ along the curled body) ————————————————————————————

/** Where each part begins and ends (θ). The gut runs from TH.opm (cranial) down to TH.cloaca. */
export const TH = {
  opm: 1.72,
  pouches: [1.64, 1.56, 1.48, 1.41] as const,
  resp: 1.36,
  /** The septum transversum's (later the diaphragm's) level: the thoracic mesentery is above it. */
  diaphragm: 0.86,
  stomach: [0.82, 0.54] as const,
  liverBud: 0.47,
  /** The vitelline duct's root (the loop's apex). */
  apex: -0.52,
  /** The border between the proximal two thirds and the distal third of the transverse colon. */
  colon: -0.86,
  cloaca: -2.02,
} as const;

/** The dorsal wall where the mesentery starts (just in front of the aorta, topic 12's DA_OUT = 0.42). */
const WALL_OUT = 0.3;

// ———————————————————————————— pose ————————————————————————————

export interface GutPose {
  /** The tube shown (0..1): the endoderm rolled into a tube. */
  tube: number;
  /** Region colours (0 = all endoderm yellow, 1 = by part). */
  parts: number;
  /** 1 = four parts: the pharyngeal gut split from the foregut (its own colour, its own name). */
  four: number;
  /** The vitelline duct: 0 = wide, 1 = narrow. */
  narrow: number;
  /** Respiratory diverticulum: 0–0.35 buds from the ventral wall, –0.7 lengthens (laryngotracheal tube), –1 two lung buds. */
  resp: number;
  /** Pharyngeal pouches out of the side walls. */
  pouches: number;
  /** Liver bud (0..1) out of the distal foregut, into the septum transversum. */
  liverBud: number;
  /** The stomach's dilation (0..1). */
  stomach: number;
  /** The three ventral arteries (0..1) and the regions tinted by them. */
  arteries: number;
  /** The peritoneal cavity (coelom below the diaphragm) and the parietal peritoneum lining it. */
  cavity: number;
  /** Visceral peritoneum round the gut. */
  visceral: number;
  /** Dorsal mesentery (two layers) from the posterior wall to the gut. */
  meso: number;
  /** The thoracic part of the dorsal mesentery gone (week 5). */
  thorGone: number;
  /** The ventral mesogastrium (septum transversum mesoderm) from the stomach to the anterior wall. */
  ventral: number;
  /** Retroperitoneal organs behind the posterior parietal peritoneum (kidneys, aorta, IVC). */
  retro: number;
}

export const GP0: GutPose = { tube: 1, parts: 0, four: 0, narrow: 0, resp: 0, pouches: 0, liverBud: 0.25, stomach: 0.2, arteries: 0, cavity: 0, visceral: 0, meso: 0, thorGone: 0, ventral: 0, retro: 0 };

export interface GutOpts {
  /** Topic 12's embryo glass (0..1) and its heart. */
  body?: number;
  heart?: number;
  yolk?: number;
  /** Lit ids (others see-through): the step's `dim`. */
  dim?: { ids: readonly string[]; k: number } | null;
  /** The septum transversum's opacity. */
  septum?: number;
  /** Topic 12's vessels (aorta, arch and umbilical arteries): context, faint unless a step is about them. */
  vessels?: number;
}

export interface GutModel {
  items: Item3[];
  pts: Record<string, V3>;
  lines: Record<string, V3[]>;
}

// ———————————————————————————— geometry ————————————————————————————

/** The gut's key points (θ, out) from the oropharyngeal membrane to the cloaca: θ falls all the way. */
const GUT_KEYS: readonly (readonly [number, number])[] = [
  [TH.opm, -0.1],
  [1.6, -0.1],
  [1.45, -0.1],
  [1.3, -0.11],
  [1.1, -0.12],
  [0.9, -0.12],
  [0.68, -0.14],
  [TH.liverBud, -0.13],
  [0.3, -0.15],
  [0.08, -0.32],
  [-0.22, -0.66],
  [-0.42, -0.92],
  [TH.apex, -1.0],
  [-0.62, -0.88],
  [-0.72, -0.55],
  [-0.8, -0.24],
  [TH.colon, -0.14],
  [-1.1, -0.1],
  [-1.4, -0.1],
  [-1.7, -0.11],
  [-1.92, -0.14],
  [TH.cloaca, -0.2],
];
const N_GUT = 140;

/** The gut centreline (sampled) with each sample's θ. */
const GUT = (() => {
  const line = curve3(GUT_KEYS.map(([th, out]) => P(th, out, 0)), N_GUT);
  const ths = curve3(GUT_KEYS.map(([th]) => [th, 0, 0] as V3), N_GUT).map((p) => p[0]);
  return { line, ths };
})();

/** Index of the gut sample at level θ. */
const iAt = (th: number) => {
  let best = 0;
  for (let i = 0; i < GUT.ths.length; i++) if (Math.abs(GUT.ths[i] - th) < Math.abs(GUT.ths[best] - th)) best = i;
  return best;
};

/** The body's own directions at θ: along the axis (cranial), out (dorsal). */
const frameAt = (th: number) => {
  const along = norm(sub(P(th + 0.01, 0, 0), P(th - 0.01, 0, 0)));
  const dorsal = norm(sub(P(th, 0.1, 0), P(th, -0.1, 0)));
  return { along, dorsal };
};

const tubeOf = (pts: readonly V3[], r: (u: number) => number, sides = 16, around?: (a: number, u: number) => number) =>
  tubeParts(pts, { radius: r, ref: [1, 0, 0], sides, capStart: true, capEnd: true, around });

/** A smooth line through key points. */
const L = (kps: V3[], n = 20) => curve3(kps, n);

/** The gut's radius at sample i (pharynx wide and flat, the stomach's dilation, the cloaca). */
function gutRadius(th: number, pose: GutPose): number {
  let r = 0.12;
  // Pharynx: wide (flattened sideways by `around`).
  r += 0.06 * ss(TH.resp - 0.05, TH.resp + 0.08, th);
  // The stomach's fusiform dilation.
  const sm = (TH.stomach[0] + TH.stomach[1]) / 2;
  const half = (TH.stomach[0] - TH.stomach[1]) / 2;
  const x = (th - sm) / half;
  if (Math.abs(x) < 1) r += 0.13 * clamp01(pose.stomach) * Math.cos((x * Math.PI) / 2) ** 2;
  // The cloaca: the hindgut's dilated end.
  r += 0.07 * ss(-1.85, TH.cloaca, th);
  // Midgut: wide where it opens into the vitelline duct while the duct is wide.
  const ap = Math.exp(-(((th - TH.apex) / 0.08) ** 2));
  r += 0.05 * ap * (1 - pose.narrow);
  return r;
}

/** One gut piece between two levels (θ), as an item. */
function gutPiece(th0: number, th1: number, pose: GutPose) {
  const i0 = iAt(th0);
  const i1 = iAt(th1);
  const pts = GUT.line.slice(Math.max(0, i0 - 1), Math.min(GUT.line.length, i1 + 2));
  const ths = GUT.ths.slice(Math.max(0, i0 - 1), Math.min(GUT.ths.length, i1 + 2));
  const radius = (u: number) => gutRadius(ths[Math.min(ths.length - 1, Math.round(u * (ths.length - 1)))], pose);
  // The pharynx is flat: wide sideways, shallow front to back.
  const around = (a: number, u: number) => {
    const th = ths[Math.min(ths.length - 1, Math.round(u * (ths.length - 1)))];
    const k = ss(TH.resp - 0.05, TH.resp + 0.08, th);
    return 1 + k * (0.45 * Math.cos(a) ** 2 - 0.3 * Math.sin(a) ** 2);
  };
  return cachedMesh2(`gut:${th0}:${th1}:${pose.stomach.toFixed(3)}:${pose.narrow.toFixed(3)}`, () => tubeOf(pts, radius, 18, around));
}

/** Mesh pairs cached by a key (the gut pieces change only with the stomach and the duct). */
const pieceCache = new Map<string, ReturnType<typeof tubeOf>>();
function cachedMesh2(key: string, build: () => ReturnType<typeof tubeOf>) {
  let m = pieceCache.get(key);
  if (!m) {
    if (pieceCache.size > 400) pieceCache.clear();
    m = build();
    pieceCache.set(key, m);
  }
  return m;
}

/**
 * A sheet between two rows of points (u along, v across), two layers a little apart (a meso is two layers),
 * each facing out to its own side so the sheet shows (and points) from the left and from the right.
 */
function sheet(key: string, a: V3[], b: V3[], gap: number) {
  const n = a.length - 1;
  const at = (dx: number) => (u: number, v: number): V3 => {
    const i = Math.min(n, Math.round(u * n));
    return add(mix3(a[i], b[i], v), [dx, 0, 0]);
  };
  const deps = [...a.flat(), ...b.flat(), gap];
  const one = (s: number) => cachedMesh(`sheet:${key}:${s}`, deps, () => grid(n, 4, at(s * gap), [s * 50, 0, 0]));
  const lo = one(-1);
  const hi = one(1);
  return { lo, hi };
}

// ———————————————————————————— the model ————————————————————————————

/** Topic 12's embryo pose for the frame: the glass body, the heart, the aorta; no gut, no plexus (this model draws its own). */
const EMBRYO: EmbryoPose = { ...EP0, arches: [0.15, 0.4, 1, 1, 0, 0.7], vitelline: 0, reduce: 1, umb: 0.6, veins: 0, cardinal: 0, gut: 0, interseg: 0 };

export function gutModel(pose: GutPose, o: GutOpts = {}): GutModel {
  const items: Item3[] = [];
  const pts: Record<string, V3> = {};
  const lines: Record<string, V3[]> = {};
  const dim = o.dim;
  const lit = (id: string, groups?: readonly string[]) => !dim || dim.k <= 0.001 || dim.ids.includes(id) || (groups ?? []).some((g) => dim.ids.includes(g));
  const fade = (id: string, groups?: readonly string[], k = 0.8) => (lit(id, groups) ? 1 : 1 - k * (dim?.k ?? 0));

  // ———— the embryo (topic 12): body glass, heart, aortas, umbilical arteries ————
  const body = o.body ?? 1;
  if (body > 0.01) {
    const E = embryoModel({ ...EMBRYO, body }, { dim: dim ? { ids: dim.ids, k: dim.k * 0.6 } : null });
    for (const it of E.items) {
      // The heart fades with the option (it is context here); the rest keeps topic 12's look.
      const heart = it.groups?.includes('bihotz-lakioa');
      // The vessels run right behind the gut: faint context, so they never hide it (full when lit).
      const vessel = it.tissue === 'vessel' && !(dim && dim.k > 0.001 && lit(it.id ?? '', it.groups));
      const k = heart ? (o.heart ?? 1) : vessel ? (o.vessels ?? 0.3) : 1;
      items.push(k === 1 ? it : { ...it, opacity: (it.opacity ?? 1) * k });
    }
    for (const [k, v] of Object.entries(E.pts)) pts[k] = v;
    pts['aorta'] = P(-0.2, 0.42, 0);
  }

  // ———— the gut: one tube, cut into its parts ————
  const tube = clamp01(pose.tube);
  const four = ss(0.15, 0.85, pose.four);
  const colourOf = (region: 'pharynx' | 'fore' | 'mid' | 'hind') => {
    const c = region === 'pharynx' ? mixHex(GC.fore, GC.pharynx, four) : GC[region];
    return mixHex(GC.endo, c, 0.85 * clamp01(pose.parts));
  };
  const piece = (key: string, id: string, th0: number, th1: number, region: 'pharynx' | 'fore' | 'mid' | 'hind', groups0: string[] = []) => {
    const groups = groups0.length ? groups0 : undefined;
    const m = gutPiece(th0, th1, pose);
    const c = colourOf(region);
    items.push({ key, id, groups, ...m, color: c, deep: darker(c), tissue: 'epithelium', opacity: tube * fade(id, groups) });
  };
  // Before the parts are told apart the whole tube is one: the endoderm (named "Hestea").
  const whole = pose.parts < 0.5 ? ['endodermoa'] : [];
  // While the foregut still starts at the oropharyngeal membrane (three parts), the pharyngeal gut is lit with it.
  piece('g-pharynx', four > 0.5 ? 'faringe-hestea' : 'aurreko-hestea', TH.opm, TH.resp, 'pharynx', [...(four > 0.5 ? [] : ['faringe-hestea']), ...whole]);
  // The stomach and the cloaca are pieces of their part (lit with it), drawn on their own so they can be named.
  piece('g-fore', 'aurreko-hestea', TH.resp, TH.stomach[0], 'fore', whole);
  piece('g-stomach', 'urdaila', TH.stomach[0], TH.stomach[1], 'fore', ['aurreko-hestea', ...whole]);
  piece('g-fore2', 'aurreko-hestea', TH.stomach[1], TH.liverBud, 'fore', whole);
  piece('g-mid', 'erdiko-hestea', TH.liverBud, TH.colon, 'mid', whole);
  piece('g-hind', 'atzeko-hestea', TH.colon, TH.cloaca + 0.16, 'hind', whole);
  piece('g-cloaca', 'kloaka', TH.cloaca + 0.16, TH.cloaca, 'hind', ['atzeko-hestea', ...whole]);
  lines.gut = GUT.line;
  pts['faringe-hestea'] = P(1.55, -0.1, 0.12);
  pts['aurreko-hestea'] = P(1.05, -0.12, 0.08);
  pts['aurreko-hestea-3'] = P(1.5, -0.1, 0.1);
  pts['erdiko-hestea'] = GUT.line[iAt(-0.25)];
  pts['atzeko-hestea'] = P(-1.4, -0.1, 0.08);
  pts['urdaila'] = P(0.68, -0.14, 0.12 + 0.1 * pose.stomach);
  pts['kloaka'] = P(TH.cloaca + 0.03, -0.2, 0.1);
  // Stations (for the camera and the region border marks).
  pts['st-resp'] = P(TH.resp, -0.1, 0);
  pts['st-liver'] = P(TH.liverBud, -0.13, 0);
  pts['st-colon'] = P(TH.colon, -0.14, 0);

  // Oropharyngeal and cloacal membranes: thin discs closing the two ends.
  {
    const c = P(TH.opm + 0.02, -0.1, 0);
    const f = frameAt(TH.opm);
    const m = blobParts({ center: c, radii: [0.2, 0.025, 0.15], axes: [[1, 0, 0], f.along, f.dorsal] });
    items.push({ key: 'opm', id: 'mintz-bukofaringeoa', ...m, color: GC.membrane, deep: '#8b93a8', tissue: 'membrane', opacity: 0.9 * tube * fade('mintz-bukofaringeoa'), thin: 0.6 });
    pts['mintz-bukofaringeoa'] = c;
    const cc = P(TH.cloaca - 0.02, -0.38, 0);
    const fc = frameAt(TH.cloaca);
    const mc = blobParts({ center: cc, radii: [0.14, 0.11, 0.025], axes: [[1, 0, 0], fc.along, fc.dorsal] });
    items.push({ key: 'cm', id: 'kloaka-mintza', ...mc, color: GC.membrane, deep: '#8b93a8', tissue: 'membrane', opacity: 0.9 * tube * fade('kloaka-mintza'), thin: 0.6 });
    pts['kloaka-mintza'] = cc;
  }

  // ———— the vitelline duct and the yolk sac (wide, then narrow) ————
  const yolk = (o.yolk ?? 1) * tube;
  const apex = P(TH.apex, -1.0, 0);
  const duct = L([apex, add(apex, [0, -0.45, 0.95]), add(apex, [0, -1.05, 1.85])], 14);
  if (yolk > 0.01) {
    const rd = lerp(0.17, 0.055, ss(0, 1, pose.narrow));
    const m = tubeOf(duct, (u) => rd * (1 + 0.6 * (1 - u) ** 3 * (1 - pose.narrow)), 14);
    items.push({ key: 'duct', id: 'hodi-onfalomesenterikoa', ...m, color: GC.yolk, deep: GC.yolkDeep, tissue: 'epithelium', opacity: 0.75 * yolk * fade('hodi-onfalomesenterikoa') });
    pts['hodi-onfalomesenterikoa'] = duct[7];
    const yc = add(duct[duct.length - 1], [0, -0.4, 0.55]);
    items.push({ key: 'yolk', id: 'bitelo-zaku-sekundarioa', ...blobParts({ center: yc, radii: [0.55, 0.6, 0.55], rings: 14, sides: 18 }), color: GC.yolk, deep: GC.yolkDeep, tissue: 'epithelium', opacity: 0.45 * yolk * fade('bitelo-zaku-sekundarioa'), outline: false });
    pts['bitelo-zaku-sekundarioa'] = add(yc, [0.35, 0.1, 0.3]);
    lines.duct = duct;
  }

  // ———— the allantois: from the cloaca's ventral wall into the connecting stalk ————
  {
    const al = L([P(TH.cloaca + 0.06, -0.3, 0), P(-1.75, -0.62, 0), P(-1.3, -0.92, 0), P(-0.92, -1.02, 0), add(P(-0.75, -0.98, 0), [0, -0.6, 0.95]), add(P(-0.75, -0.98, 0), [0, -1.1, 1.75])], 30);
    items.push({ key: 'allantois', id: 'alantoidea', ...tubeOf(al, (u) => 0.045 * (1 - 0.3 * u), 10), color: GC.endo, deep: GC.endoDeep, tissue: 'epithelium', opacity: 0.8 * tube * fade('alantoidea') });
    pts['alantoidea'] = al[9];
    lines.allantois = al;
  }

  // ———— pharyngeal pouches: paired buds of the side walls ————
  const pouch = clamp01(pose.pouches);
  if (pouch > 0.01)
    TH.pouches.forEach((th, k) => {
      for (const s of [-1, 1]) {
        const root = P(th, -0.1, s * 0.16);
        const tip = P(th + 0.01, -0.1, s * (0.16 + 0.42 * pouch * (1 - 0.15 * k)));
        const m = tubeOf(L([root, mix3(root, tip, 0.5), tip], 6), (u) => 0.06 * (1 - 0.3 * u), 10);
        // A lighter teal than the pharynx they bud from, so the four pairs read as their own.
        const c = mixHex(colourOf('pharynx'), '#ffffff', 0.3);
        items.push({ key: `pouch${k}${s}`, id: 'faringe-poltsak', ...m, color: c, deep: darker(c), tissue: 'epithelium', opacity: (pouch > 0.99 ? 1 : 0.85 * pouch) * fade('faringe-poltsak') });
        if (k === 1 && s > 0) pts['faringe-poltsak'] = tip;
      }
    });

  // ———— the respiratory diverticulum: out of the foregut's ventral wall, then the laryngotracheal tube and two lung buds ————
  const resp = clamp01(pose.resp);
  if (resp > 0.01) {
    const bud = ss(0, 0.35, resp);
    const grow = ss(0.35, 0.7, resp);
    const split = ss(0.7, 1, resp);
    const root = P(TH.resp + 0.02, -0.16, 0);
    // The tube runs caudally in front of the foregut (between the gut and the heart).
    const end = P(lerp(TH.resp - 0.06, 1.0, grow), lerp(-0.26, -0.36, grow), 0);
    const trunk = L([root, P(TH.resp - 0.02, lerp(-0.2, -0.32, bud), 0), mix3(P(TH.resp - 0.05, -0.33, 0), end, 0.5), end], 12);
    const shown = bud < 0.999 ? trunk.slice(0, Math.max(3, Math.round(trunk.length * (0.25 + 0.75 * Math.max(bud * 0.35, grow))))) : trunk.slice(0, Math.max(3, Math.round(trunk.length * (0.3 + 0.7 * grow))));
    const c = mixHex(GC.endo, GC.resp, 0.6 * clamp01(pose.parts) + 0.4 * bud);
    items.push({ key: 'resp', id: 'hodi-laringotrakeala', groups: ['arnas-hastapena'], ...tubeOf(shown, (u) => lerp(0.07, 0.05, u) * (0.6 + 0.4 * bud), 12), color: c, deep: darker(c), tissue: 'epithelium', opacity: 0.9 * fade('hodi-laringotrakeala', ['arnas-hastapena']) });
    pts['arnas-hastapena'] = shown[Math.min(shown.length - 1, 3)];
    pts['hodi-laringotrakeala'] = trunk[5];
    pts['laringea'] = trunk[2];
    pts['trakea'] = trunk[8];
    if (split > 0.01)
      for (const s of [-1, 1]) {
        const tip = add(end, [s * 0.26 * split, -0.04 * split, 0]);
        const lb = L([end, add(end, [s * 0.12 * split, -0.015, 0]), tip], 8);
        items.push({ key: `lung${s}`, id: 'birika-hastapenak', groups: ['arnas-hastapena'], ...tubeOf(lb, (u) => 0.05 + 0.05 * ss(0.5, 1, u) * split, 12), color: c, deep: darker(c), tissue: 'epithelium', opacity: 0.9 * split * fade('birika-hastapenak', ['arnas-hastapena']) });
        if (s > 0) pts['birika-hastapenak'] = tip;
      }
  }

  // ———— septum transversum and the liver bud ————
  const septum = o.septum ?? 0;
  const sth = 0.66;
  const sf = frameAt(sth);
  const sc = P(sth, -0.74, 0);
  if (septum > 0.01) {
    items.push({ key: 'septum', id: 'septum-transversum', ...blobParts({ center: sc, radii: [0.62, 0.3, 0.36], axes: [[1, 0, 0], sf.along, sf.dorsal], rings: 14, sides: 22 }), color: GC.septum, deep: GC.septumDeep, tissue: 'mesenchyme', opacity: 0.3 * septum * fade('septum-transversum', undefined, 0.6), outline: false });
    pts['septum-transversum'] = add(sc, [0.45, 0.05, 0.1]);
  }
  const lb = clamp01(pose.liverBud);
  if (lb > 0.01) {
    const root = P(TH.liverBud + 0.02, -0.2, 0);
    const tip = P(lerp(TH.liverBud + 0.04, sth - 0.02, lb), lerp(-0.3, -0.66, lb), 0);
    const stem = L([root, mix3(root, tip, 0.5), tip], 8);
    items.push({ key: 'liverBud', id: 'gibel-hastapena', ...tubeOf(stem, (u) => lerp(0.06, 0.07 + 0.05 * lb, u), 12), color: GC.endo, deep: GC.endoDeep, tissue: 'epithelium', opacity: 0.9 * fade('gibel-hastapena') });
    pts['gibel-hastapena'] = stem[3];
  }

  // ———— the three ventral arteries (topic 12's coeliac trunk, superior and inferior mesenteric) ————
  const art = clamp01(pose.arteries);
  if (art > 0.01) {
    const vessel = (key: string, id: string, line: V3[], color: string, r: number) => {
      const n = Math.max(2, Math.round(line.length * art));
      items.push({ key, id, ...tubeOf(line.slice(0, n), () => r, 10), color, deep: darker(color), tissue: 'vessel', opacity: fade(id) });
      lines[key] = line;
    };
    const ce = L([P(0.64, 0.4, 0), P(0.62, 0.15, 0), P(0.6, -0.04, 0), P(0.58, -0.14 - 0.1, 0.04)], 12);
    vessel('celiac', 'enbor-zeliakoa', ce, GC.fore, 0.045);
    // Branches along the abdominal foregut: up to the stomach, down to the duodenum.
    vessel('celiacUp', 'enbor-zeliakoa', L([ce[9], P(0.68, -0.05, 0.1), P(0.76, -0.04, 0.12)], 8), GC.fore, 0.028);
    vessel('celiacDown', 'enbor-zeliakoa', L([ce[9], P(0.48, -0.06, 0.1), P(0.36, -0.08, 0.12)], 8), GC.fore, 0.028);
    pts['enbor-zeliakoa'] = ce[4];
    const sma = L([P(0.12, 0.4, 0), P(0.05, 0.12, 0), P(-0.12, -0.25, 0), P(-0.32, -0.62, 0), P(-0.45, -0.85, 0.02), add(apex, [0.04, -0.1, 0.2]), add(duct[6], [0.06, 0, 0])], 18);
    vessel('sma', 'goiko-arteria-mesenterikoa', sma, GC.mid, 0.045);
    pts['goiko-arteria-mesenterikoa'] = sma[6];
    const ima = L([P(-1.0, 0.4, 0), P(-1.06, 0.2, 0), P(-1.15, 0.02, 0), P(-1.25, -0.02, 0.08)], 12);
    vessel('ima', 'beheko-arteria-mesenterikoa', ima, GC.hind, 0.04);
    vessel('imaUp', 'beheko-arteria-mesenterikoa', L([ima[10], P(-1.05, -0.04, 0.11), P(-0.92, -0.06, 0.12)], 8), GC.hind, 0.026);
    vessel('imaDown', 'beheko-arteria-mesenterikoa', L([ima[10], P(-1.5, -0.04, 0.11), P(-1.78, -0.06, 0.12)], 8), GC.hind, 0.026);
    pts['beheko-arteria-mesenterikoa'] = ima[4];
  }

  // ———— the peritoneal cavity: the coelom below the diaphragm, lined by parietal peritoneum ————
  const cav = clamp01(pose.cavity);
  if (cav > 0.01) {
    const axis = L([P(TH.diaphragm - 0.02, -0.62, 0), P(0.3, -0.62, 0), P(-0.4, -0.66, 0), P(-1.2, -0.58, 0), P(-1.85, -0.5, 0)], 30);
    const r = (u: number) => lerp(0.5, 0.36, u) * Math.sin(Math.PI * Math.min(1, 0.06 + u * 0.94)) ** 0.35;
    const around = (a: number) => 1 + 0.55 * Math.cos(a) ** 2;
    const m = cachedMesh2('cavity', () => tubeOf(axis, r, 24, around));
    items.push({ key: 'cavity', id: 'peritoneo-barrunbea', ...m, color: GC.cavity, deep: '#2f7a45', tissue: 'membrane', opacity: 0.16 * cav * fade('peritoneo-barrunbea', undefined, 0.5), outline: false, thin: 0.8 });
    pts['peritoneo-barrunbea'] = P(-0.05, -0.7, 0.55);
    const wall = cachedMesh2('parietal', () => tubeOf(axis, (u) => r(u) * 1.04, 24, around));
    items.push({ key: 'parietal', id: 'paretako-peritoneoa', ...wall, color: GC.parietal, deep: darker(GC.parietal), tissue: 'membrane', opacity: 0.14 * cav * fade('paretako-peritoneoa', undefined, 0.5), outline: false, thin: 0.9 });
    pts['paretako-peritoneoa'] = P(-1.2, -0.12, 0.62);
  }

  // ———— visceral peritoneum: a coat round every part below the diaphragm ————
  const visc = clamp01(pose.visceral);
  if (visc > 0.01) {
    const i0 = iAt(TH.diaphragm);
    const i1 = iAt(TH.cloaca + 0.12);
    const pts2 = GUT.line.slice(i0, i1 + 1);
    const ths = GUT.ths.slice(i0, i1 + 1);
    const m = cachedMesh2(`visc:${pose.stomach.toFixed(3)}:${pose.narrow.toFixed(3)}`, () => tubeOf(pts2, (u) => gutRadius(ths[Math.round(u * (ths.length - 1))], pose) + 0.035, 18));
    items.push({ key: 'visc', id: 'errai-peritoneoa', ...m, color: GC.visceral, deep: darker(GC.visceral), tissue: 'membrane', opacity: 0.38 * visc * fade('errai-peritoneoa', undefined, 0.6), outline: false, thin: 0.7 });
    pts['errai-peritoneoa'] = add(GUT.line[iAt(-1.3)], [0.12, 0, 0.1]);
  }

  // ———— the dorsal mesentery: two layers from the posterior wall to the gut, named by the organ it holds ————
  const meso = clamp01(pose.meso);
  if (meso > 0.01) {
    const parts: [string, string, number, number, number][] = [
      ['m-thor', 'mesenterio-dortsala', 1.3, TH.diaphragm, 1 - ss(0, 1, pose.thorGone)],
      ['m-gastr', 'mesogastrio-dortsala', TH.diaphragm, TH.liverBud, 1],
      ['m-duod', 'mesoduodeno-dortsala', TH.liverBud, 0.22, 1],
      ['m-ent', 'mesenterioa', 0.22, TH.colon, 1],
      ['m-colon', 'mesokolon-dortsala', TH.colon, -1.9, 1],
    ];
    for (const [key, id, a, b, show] of parts) {
      if (show <= 0.01) continue;
      const n = 16;
      const wall: V3[] = [];
      const gut: V3[] = [];
      for (let k = 0; k <= n; k++) {
        const th = lerp(a, b, k / n);
        const g = GUT.line[iAt(th)];
        // From the wall in front of the aorta to the gut's dorsal surface (the gut hangs from it).
        const d = frameAt(th).dorsal;
        wall.push(P(th, WALL_OUT, 0));
        gut.push(add(g, mul(d, gutRadius(th, pose) * 0.9)));
      }
      const groups = id === 'mesenterio-dortsala' ? undefined : ['mesenterio-dortsala'];
      const s = sheet(key, wall, gut, 0.018);
      const op = 0.55 * meso * show * fade(id, groups, 0.7);
      items.push({ key: `${key}a`, id, groups, mesh: s.lo, color: GC.visceral, deep: darker(GC.visceral), tissue: 'membrane', opacity: op, thin: 0.6, outline: false });
      items.push({ key: `${key}b`, id, groups, mesh: s.hi, color: GC.visceral, deep: darker(GC.visceral), tissue: 'membrane', opacity: op, thin: 0.6, outline: false });
      const mid = Math.round(n / 2);
      pts[id] = mix3(wall[mid], gut[mid], 0.5);
    }
  }

  // ———— the ventral mesogastrium: septum transversum mesoderm from the stomach to the anterior wall ————
  const ven = clamp01(pose.ventral);
  if (ven > 0.01) {
    const n = 12;
    const st: V3[] = [];
    const wall: V3[] = [];
    for (let k = 0; k <= n; k++) {
      const th = lerp(TH.stomach[0] - 0.02, TH.liverBud + 0.03, k / n);
      const g = GUT.line[iAt(th)];
      const d = frameAt(th).dorsal;
      st.push(add(g, mul(d, -gutRadius(th, pose) * 0.9)));
      wall.push(P(th, -1.06, 0));
    }
    const s = sheet('ventral', st, wall, 0.016);
    const op = 0.6 * ven * fade('mesogastrio-bentrala', undefined, 0.7);
    items.push({ key: 'venA', id: 'mesogastrio-bentrala', mesh: s.lo, color: GC.septum, deep: GC.septumDeep, tissue: 'membrane', opacity: op, thin: 0.6, outline: false });
    items.push({ key: 'venB', id: 'mesogastrio-bentrala', mesh: s.hi, color: GC.septum, deep: GC.septumDeep, tissue: 'membrane', opacity: op, thin: 0.6, outline: false });
    pts['mesogastrio-bentrala'] = mix3(st[n / 2], wall[n / 2], 0.3);
  }

  // ———— behind the posterior parietal peritoneum: kidneys, aorta, inferior vena cava ————
  const retro = clamp01(pose.retro);
  if (retro > 0.01) {
    for (const s of [-1, 1]) {
      const f = frameAt(-0.75);
      items.push({ key: `kid${s}`, id: 'giltzurruna', ...blobParts({ center: P(-0.75, 0.32, s * 0.36), radii: [0.13, 0.3, 0.12], axes: [[1, 0, 0], f.along, f.dorsal], rings: 12, sides: 16 }), color: GC.kidney, deep: darker(GC.kidney), tissue: 'epithelium', opacity: 0.85 * retro * fade('giltzurruna') });
    }
    pts['giltzurruna'] = P(-0.75, 0.32, 0.4);
    const ivc = L([P(0.55, 0.3, -0.2), P(0.0, 0.32, -0.2), P(-0.8, 0.32, -0.2), P(-1.3, 0.3, -0.18)], 16);
    items.push({ key: 'ivc', id: 'beheko-kaba-zaina', ...tubeOf(ivc, () => 0.06, 10), color: GC.ivc, deep: darker(GC.ivc), tissue: 'vessel', opacity: retro * fade('beheko-kaba-zaina') });
    pts['beheko-kaba-zaina'] = ivc[6];
  }

  return { items, pts, lines };
}

/** The plane through the body at level θ (for marks and cut lines): centre, along, dorsal. */
export function levelAt(th: number) {
  const f = frameAt(th);
  return { c: P(th, -0.1, 0), along: f.along, dorsal: f.dorsal, side: cross(f.along, f.dorsal) as V3 };
}
