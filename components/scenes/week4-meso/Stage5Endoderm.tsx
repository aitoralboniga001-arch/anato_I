'use client';

import { C, Label, Note, Part, clamp, lerp, seg, smoothPath, type Pt, type SceneProps } from '@/components/kit';
import { catmull, f1 } from './trunk';

/**
 * `endodermoa` — the gut tube at the end of week 4 (notes §4; Langman figs. 6-18 D, 6-20 A and 17-10).
 *  - Sagittal: mid-sagittal section of the folded C-shaped embryo (cranial left, dorsal up). The endoderm
 *    taken in by both folds is a tube from the oropharyngeal membrane to the cloacal membrane, wrapped in
 *    splanchnic mesoderm (errai orria): foregut (pharyngeal gut → pouches, thyroglossal duct; respiratory
 *    diverticulum from its ventral wall), midgut (still open to the yolk sac through the vitelline duct, which
 *    narrows as folding ends) and hindgut (cloaca, where the allantois opens). Both ends are ectodermal pits
 *    (stomodeum, proctodeum). The camera moves in on the pharyngeal region for steps 3–6.
 *  - Pharynx: frontal section of the pharyngeal gut (Langman 17-10): arches I–IV, endodermal pouches between
 *    them meeting the ectodermal clefts; on the left the pouches as they form, on the right what each gives.
 */

/** Each window starts at its beat (week4b.ts: 0, .12, .24, .34, .44, .52, .62, .76, .9) and ends before that step's done frame. */
function timing(t: number) {
  return {
    parts: seg(t, 0.12, 0.19),
    phar: seg(t, 0.24, 0.3),
    pouches: seg(t, 0.34, 0.385),
    fate: seg(t, 0.37, 0.405),
    resp: seg(t, 0.44, 0.5),
    thyro: seg(t, 0.52, 0.58),
    vit: seg(t, 0.62, 0.7),
    hind: seg(t, 0.76, 0.84),
    ends: seg(t, 0.9, 0.96),
    // Camera: in on the pharynx for steps 3–6 (t .24–.62), back out for the midgut.
    zoom: seg(t, 0.24, 0.31) * (1 - seg(t, 0.62, 0.68)),
  };
}
type Tm = ReturnType<typeof timing>;

// ---------------------------------------------------------------- colours (Langman: ectoderm blue, endoderm yellow, mesoderm red)

const ENDO = C.endoderm;
const ENDO_EDGE = '#b8891f';
const LUMEN = '#2a2110';
const SPL = '#c8505f'; // splanchnic mesoderm coat (errai orria)
const SPL_EDGE = 'rgba(120,20,40,0.55)';
const BODY = '#3a1d2b';
const BODY_EDGE = C.surfaceEcto;
const EXTRA = C.mesoExtra;
const AMNION_LINE = 'rgba(143,180,247,0.85)';
const AMNION_FILL = '#16223f';
const REGION = { fore: 'rgba(255,170,90,0.30)', mid: 'rgba(255,226,120,0.26)', hind: 'rgba(190,220,110,0.26)' };

// ---------------------------------------------------------------- spine helpers

interface Sm {
  p: Pt;
  /** Left-hand unit normal of the travel direction (dorsal for the body axis, which runs head → tail over the back). */
  n: Pt;
  u: number;
}

function spine(ctrl: Pt[], per = 8): Sm[] {
  const pts = catmull(ctrl, per);
  const cum = [0];
  for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  const L = cum[cum.length - 1] || 1;
  return pts.map((p, i) => {
    const a = pts[Math.max(0, i - 1)];
    const b = pts[Math.min(pts.length - 1, i + 1)];
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const l = Math.hypot(dx, dy) || 1;
    return { p, n: [dy / l, -dx / l], u: cum[i] / L };
  });
}

function at(sp: Sm[], u: number): Sm {
  const v = clamp(u);
  let i = 1;
  while (i < sp.length - 1 && sp[i].u < v) i++;
  const a = sp[i - 1];
  const b = sp[i];
  const k = (v - a.u) / (b.u - a.u || 1);
  const nx = lerp(a.n[0], b.n[0], k);
  const ny = lerp(a.n[1], b.n[1], k);
  const l = Math.hypot(nx, ny) || 1;
  return { p: [lerp(a.p[0], b.p[0], k), lerp(a.p[1], b.p[1], k)], n: [nx / l, ny / l], u: v };
}

const offAt = (sp: Sm[], u: number, d: number): Pt => {
  const s = at(sp, u);
  return [s.p[0] + s.n[0] * d, s.p[1] + s.n[1] * d];
};

const range = (u0: number, u1: number, n: number) => Array.from({ length: n + 1 }, (_, i) => lerp(u0, u1, i / n));

/** Closed outline of a tube between u0 and u1 with half-width hw(u); round caps where asked. */
function tubeD(sp: Sm[], u0: number, u1: number, hw: (u: number) => number, n = 40, cap0 = false, cap1 = false): string {
  const us = range(u0, u1, n);
  const L = us.map((u) => offAt(sp, u, hw(u)));
  const R = us.map((u) => offAt(sp, u, -hw(u)));
  // Round cap: from one side round the tip to the other; dir 1 = forwards (end), -1 = backwards (start).
  const cap = (u: number, dir: 1 | -1): Pt[] => {
    const s = at(sp, u);
    const w = hw(u);
    const tx = -s.n[1] * dir;
    const ty = s.n[0] * dir;
    return Array.from({ length: 7 }, (_, i) => {
      const a = ((i + 1) / 8) * Math.PI;
      const c = Math.cos(a) * dir;
      const sn = Math.sin(a);
      return [s.p[0] + w * (s.n[0] * c + tx * sn), s.p[1] + w * (s.n[1] * c + ty * sn)] as Pt;
    });
  };
  return smoothPath([...L, ...(cap1 ? cap(u1, 1) : []), ...R.slice().reverse(), ...(cap0 ? cap(u0, -1) : [])], true, 0.5);
}

/** Open polyline of an offset curve. */
const offLine = (sp: Sm[], u0: number, u1: number, d: (u: number) => number, n = 30) => smoothPath(range(u0, u1, n).map((u) => offAt(sp, u, d(u))), false, 0.5);

// ---------------------------------------------------------------- sagittal model (viewBox units, unzoomed)

/** Neural tube centre line, head (forebrain, low left) → over the back → curled tail. */
const N_CTRL: Pt[] = [
  [262, 352],
  [232, 302],
  [238, 242],
  [272, 198],
  [328, 168],
  [400, 148],
  [480, 134],
  [560, 128],
  [640, 136],
  [705, 163],
  [750, 213],
  [772, 278],
  [772, 348],
  [752, 412],
  [718, 458],
  [688, 478],
];
const NS = spine(N_CTRL, 10);
const hwN = (u: number) => (u < 0.24 ? 30 : u < 0.36 ? lerp(30, 13, (u - 0.24) / 0.12) : u < 0.9 ? lerp(13, 10, (u - 0.36) / 0.54) : lerp(10, 6, (u - 0.9) / 0.1));

/** Gut centre line: oropharyngeal membrane → pharynx (up and back under the hindbrain) → oesophagus → stomach → midgut (dips to the vitelline duct) → hindgut → cloaca. */
const G_CTRL: Pt[] = [
  [306, 372],
  [330, 330],
  [362, 290],
  [402, 254],
  [446, 230],
  [492, 216],
  [532, 212],
  [562, 222],
  [580, 242],
  [592, 258],
  [610, 252],
  [640, 234],
  [686, 228],
  [722, 252],
  [738, 300],
  [734, 350],
  [716, 396],
  [690, 432],
];
const GS = spine(G_CTRL, 10);
const uOf = (sp: Sm[], p: Pt) => {
  let best = 0;
  let bd = Infinity;
  for (const s of sp) {
    const d = Math.hypot(s.p[0] - p[0], s.p[1] - p[1]);
    if (d < bd) {
      bd = d;
      best = s.u;
    }
  }
  return best;
};
// Landmarks along the gut (u on GS).
const U = {
  pharEnd: uOf(GS, [446, 230]), // respiratory diverticulum: end of the pharyngeal gut
  thy: uOf(GS, [334, 324]), // foramen caecum: thyroglossal duct
  stom: uOf(GS, [532, 212]),
  foreEnd: uOf(GS, [572, 232]), // cranial lip of the vitelline opening (anterior intestinal portal)
  vit: uOf(GS, [592, 258]),
  midEnd: uOf(GS, [618, 248]),
  clo: uOf(GS, [716, 396]),
};

const EN = 4.5; // endoderm thickness
const SP = 8; // splanchnic coat thickness

function gutHW(u: number, tm: Tm) {
  // Pharyngeal gut: wide and flattened, widest cranially.
  const ph = u < U.pharEnd ? Math.sin(clamp((u - 0.01) / (U.pharEnd - 0.01)) * Math.PI * 0.92) : 0;
  const stomach = Math.exp(-(((u - U.stom) / 0.035) ** 2));
  const clo = clamp((u - U.clo) / 0.06);
  return 6 + ph * lerp(6, 13, tm.phar) + stomach * 4.5 + clo * lerp(4, 9, tm.hind);
}

/** Respiratory diverticulum: from the ventral wall at the end of the pharynx, growing caudally ventral to the oesophagus. */
function respPath(g: number): Pt[] {
  const o = offAt(GS, U.pharEnd, -8);
  const s = at(GS, U.pharEnd + 0.02);
  const tip = lerp(0.2, 1, g);
  const pts: Pt[] = [o, offAt(GS, U.pharEnd + 0.012, -22)];
  for (let k = 1; k <= 4; k++) pts.push(offAt(GS, U.pharEnd + 0.012 + 0.05 * tip * (k / 4), -24 - 4 * (k / 4)));
  void s;
  return pts;
}

/** Thyroglossal duct: from the pharyngeal floor (foramen caecum) down in front of the pharynx; the gland at its tip. */
function thyroPath(g: number): Pt[] {
  const o = offAt(GS, U.thy, -10);
  const tip = lerp(0.15, 1, g);
  return [o, offAt(GS, U.thy + 0.006, -10 - 16 * tip), offAt(GS, U.thy + 0.02 * tip, -14 - 26 * tip), offAt(GS, U.thy + 0.045 * tip, -16 - 32 * tip)];
}

/** Pharyngeal pouches seen through the plane (they are lateral): four lobes off the pharynx, 1st biggest. */
function pouchLobes(g: number) {
  const us = [0.22, 0.42, 0.6, 0.76].map((k) => lerp(0.04, U.pharEnd - 0.01, k));
  return us.map((u, i) => {
    const s = at(GS, u);
    const r = lerp(2, [9, 8, 7, 5.5][i], g);
    const d = gutHW(u, { ...timing(0), phar: 1 } as Tm) + r * 0.55;
    return { c: [s.p[0] + s.n[0] * d, s.p[1] + s.n[1] * d] as Pt, r, n: s.n };
  });
}

/** Vitelline duct and yolk sac (outside the body, below the umbilical ring). */
const YOLK = { c: [528, 528] as Pt, r: 44 };
const CORD: Pt[] = [
  [596, 300],
  [604, 360],
  [612, 420],
  [632, 486],
  [664, 556],
];
const CS = spine(CORD, 8);
function vitPath(): Pt[] {
  const o = at(GS, U.vit).p;
  return [o, [596, 296], [600, 352], [598, 410], [578, 456], [553, 488]];
}

/** Allantois: from the cloaca's ventral wall through the body wall into the connecting stalk. */
function allantoisPath(): Pt[] {
  const c = offAt(GS, U.clo + 0.03, -10);
  return [c, [660, 380], [638, 342], [618, 312], [612, 360], [622, 430], [646, 500], [668, 548]];
}

/** Proctodeum: ectodermal pit capping the cloacal membrane at the end of the hindgut (deepens in step 9). */
function proctoPit(tm: Tm) {
  const m = at(GS, 1);
  const dir: Pt = [-m.n[1], m.n[0]]; // gut direction at its end (caudoventral)
  const depth = lerp(9, 14, tm.ends);
  const P = (a: number, b: number): Pt => [m.p[0] + dir[0] * a + m.n[0] * b, m.p[1] + dir[1] * a + m.n[1] * b];
  return { lipD: P(depth, 11), floorD: P(3, 7), floor: P(2.5, 0), floorV: P(3, -7), lipV: P(depth, -11) };
}

/** Body outline: dorsal side follows the neural tube; ventral side hand-placed (heart bulge, umbilical ring, tail). */
function bodyOutline(tm: Tm): Pt[] {
  const dors = range(0.13, 1, 40).map((u) => offAt(NS, u, hwN(u) + 11));
  const tipS = at(NS, 1);
  const tx = -tipS.n[1];
  const ty = tipS.n[0];
  // tail tip: round the end of the neural tube
  const tip: Pt[] = [0.5, 1.2, 1.9, 2.6].map((a) => [tipS.p[0] + 17 * (tipS.n[0] * Math.cos(a) + tx * Math.sin(a) * 0.9), tipS.p[1] + 17 * (tipS.n[1] * Math.cos(a) + ty * Math.sin(a) * 0.9)]);
  const pit = proctoPit(tm);
  const ventral: Pt[] = [
    [684, 474],
    pit.lipD,
    pit.floorD,
    pit.floor,
    pit.floorV,
    pit.lipV,
    [656, 396],
    [636, 350],
    [622, 312],
    [612, 296], // caudal edge of the umbilical ring
    [578, 296], // cranial edge
    [548, 318],
    [526, 360],
    [498, 404],
    [458, 438],
    [408, 454],
    [362, 446],
    [332, 420],
    [318, 396], // lower lip of the stomodeum
    [300, 384], // floor (oropharyngeal membrane)
    [286, 394], // upper lip
    [262, 398],
    [232, 380],
    [212, 338],
    [206, 284],
    [218, 228],
  ];
  return [...dors, ...tip, ...ventral];
}

/** Heart bulge contents: pericardial cavity and the heart tube (context). */
function Heart() {
  const cav = smoothPath(
    [
      [372, 330],
      [430, 316],
      [492, 340],
      [500, 380],
      [470, 418],
      [412, 434],
      [362, 424],
      [346, 384],
    ],
    true,
    0.6,
  );
  const tube = smoothPath(
    [
      [384, 352],
      [420, 336],
      [462, 352],
      [452, 384],
      [412, 396],
      [400, 416],
      [440, 420],
    ],
    false,
    0.6,
  );
  return (
    <g>
      <path d={cav} fill="#1c0f18" stroke="rgba(255,122,122,0.35)" strokeWidth={1.4} />
      <Part id="bihotz-hodia" quiet>
        <path d={tube} fill="none" stroke="#7a1626" strokeWidth={17} strokeLinecap="round" />
        <path d={tube} fill="none" stroke="#c43a4a" strokeWidth={13} strokeLinecap="round" />
        <path d={tube} fill="none" stroke="#5a0f1c" strokeWidth={4} strokeLinecap="round" opacity={0.7} />
      </Part>
    </g>
  );
}

/** The gut and everything that buds from it, drawn in three passes (coat, endoderm, lumen) so branches merge cleanly. */
function Gut({ tm }: { tm: Tm }) {
  const hw = (u: number) => gutHW(u, tm);
  const vitW = lerp(15, 5.5, tm.vit);
  const vit = spine(vitPath(), 8);
  const vhw = (u: number) => lerp(vitW + 3, vitW, clamp(u / 0.15));
  const all = spine(allantoisPath(), 8);
  const ahw = (u: number) => lerp(4.2, 2.6, u);
  const rp = spine(respPath(tm.resp), 6);
  const rhw = (u: number) => lerp(5.2, 4.2, u);
  const tp = spine(thyroPath(tm.thyro), 6);
  const thw = () => 2.6;
  const respOn = tm.resp > 0.01;
  const thyOn = tm.thyro > 0.01;
  const lobes = pouchLobes(tm.pouches);
  const rTip = at(rp, 1);
  const tTip = at(tp, 1);
  const bud = lerp(3, 7, tm.resp);
  const gland = lerp(3, 7, tm.thyro);
  const respTx = -rTip.n[1];
  const respTy = rTip.n[0];

  // Region slices of the endoderm (for the three names and their focus).
  const seg3 = [
    { id: 'aurreko-hestea', u0: 0, u1: U.foreEnd, tint: REGION.fore },
    { id: 'erdiko-hestea', u0: U.foreEnd, u1: U.midEnd, tint: REGION.mid },
    { id: 'atzeko-hestea', u0: U.midEnd, u1: 1, tint: REGION.hind },
  ];

  return (
    <g>
      {/* 1 · splanchnic mesoderm coat (errai orria) */}
      <Part id="errai-orria">
        <g fill={SPL} stroke={SPL_EDGE} strokeWidth={1}>
          <path d={tubeD(GS, 0, 1, (u) => hw(u) + EN + SP, 90)} />
          <path d={tubeD(vit, 0, 0.32, (u) => vhw(u) + EN + SP * 0.8, 12)} />
          {respOn && <path d={tubeD(rp, 0, 1, (u) => rhw(u) + EN + 5, 14, false, true)} opacity={clamp(tm.resp * 3)} />}
        </g>
      </Part>
      {/* 2 · endoderm */}
      {seg3.map((s) => (
        <Part key={s.id} id={s.id}>
          <path d={tubeD(GS, s.u0, s.u1, (u) => hw(u) + EN, 40)} fill={ENDO} stroke={ENDO_EDGE} strokeWidth={0.8} />
        </Part>
      ))}
      <Part id="hodi-onfalomesenterikoa">
        <path d={tubeD(vit, 0.03, 1, (u) => vhw(u) + EN, 26)} fill={ENDO} stroke={ENDO_EDGE} strokeWidth={0.8} />
      </Part>
      {tm.pouches > 0.01 && (
        <Part id="faringe-poltsak" show={tm.pouches}>
          {lobes.map((l, i) => (
            <g key={i}>
              <circle cx={f1(l.c[0])} cy={f1(l.c[1])} r={f1(l.r + EN)} fill="#f7d98a" stroke={ENDO_EDGE} strokeWidth={0.8} opacity={0.85} />
              <circle cx={f1(l.c[0])} cy={f1(l.c[1])} r={f1(l.r)} fill="#4a3a18" opacity={0.85} />
            </g>
          ))}
        </Part>
      )}
      {respOn && (
        <Part id="arnas-hastapena" show={clamp(tm.resp * 3)}>
          <path d={tubeD(rp, 0, 1, (u) => rhw(u) + EN, 14, false, true)} fill={ENDO} stroke={ENDO_EDGE} strokeWidth={0.8} />
          {/* lung buds at the tip */}
          {[1, -1].map((sd) => (
            <circle key={sd} cx={f1(rTip.p[0] + respTx * 3 + rTip.n[0] * sd * bud * 0.8)} cy={f1(rTip.p[1] + respTy * 3 + rTip.n[1] * sd * bud * 0.8)} r={f1(bud)} fill={ENDO} stroke={ENDO_EDGE} strokeWidth={0.8} opacity={clamp((tm.resp - 0.5) * 2.5)} />
          ))}
          <path d={tubeD(rp, 0.05, 0.98, (u) => rhw(u) - 1.6, 12, false, true)} fill={LUMEN} />
        </Part>
      )}
      {thyOn && (
        <Part id="hodi-tiroglosoa" show={clamp(tm.thyro * 3)}>
          <path d={tubeD(tp, 0, 1, thw, 10)} fill={ENDO} stroke={ENDO_EDGE} strokeWidth={0.8} />
          {/* bilobed thyroid primordium at the tip */}
          {[1, -1].map((sd) => (
            <ellipse key={sd} cx={f1(tTip.p[0] + tTip.n[0] * sd * gland * 0.7)} cy={f1(tTip.p[1] + tTip.n[1] * sd * gland * 0.7)} rx={f1(gland)} ry={f1(gland * 0.8)} fill="#f5c95a" stroke={ENDO_EDGE} strokeWidth={0.8} />
          ))}
        </Part>
      )}
      <Part id="alantoidea">
        <path d={tubeD(all, 0, 1, (u) => ahw(u) + 2.2, 30)} fill={ENDO} stroke={ENDO_EDGE} strokeWidth={0.7} />
        <path d={tubeD(all, 0.02, 1, (u) => ahw(u) - 0.6, 30)} fill={LUMEN} />
      </Part>
      {/* 3 · lumen, tinted by region once the three parts are named */}
      <path d={tubeD(GS, 0.004, 0.996, hw, 90)} fill={LUMEN} />
      <path d={tubeD(vit, 0, 0.995, vhw, 26)} fill={LUMEN} />
      {tm.parts > 0.01 &&
        seg3.map((s) => <path key={s.id} d={tubeD(GS, Math.max(0.004, s.u0), Math.min(0.996, s.u1), hw, 40)} fill={s.tint} opacity={tm.parts} />)}
      {tm.phar > 0.01 && (
        <Part id="faringe-hestea" show={tm.phar}>
          <path d={tubeD(GS, 0.004, U.pharEnd, hw, 30)} fill="rgba(255,214,120,0.22)" stroke="#fde68a" strokeWidth={1.4} />
        </Part>
      )}
    </g>
  );
}

/** Yolk sac: endoderm lining inside extra-embryonic mesoderm. */
function YolkSac({ tm }: { tm: Tm }) {
  const r = lerp(52, YOLK.r, tm.vit);
  const [cx, cy] = YOLK.c;
  return (
    <Part id="bitelo-zaku-sekundarioa">
      <circle cx={cx} cy={cy + (YOLK.r - r) * 0.4} r={f1(r + 9)} fill={EXTRA} opacity={0.9} />
      <circle cx={cx} cy={cy + (YOLK.r - r) * 0.4} r={f1(r + 9)} fill="url(#p-meso-extra)" opacity={0.5} />
      <circle cx={cx} cy={cy + (YOLK.r - r) * 0.4} r={f1(r)} fill={ENDO} />
      <circle cx={cx} cy={cy + (YOLK.r - r) * 0.4} r={f1(r - 4.5)} fill="#3a2c10" />
    </Part>
  );
}

/** Close-up window (steps 3–6), clear of the name columns. */
const WIN = { x0: 204, y0: 40, x1: 796, y1: 588 };

function camera(tm: Tm) {
  const s = lerp(1, 1.62, tm.zoom);
  const fx = lerp(500, 402, tm.zoom);
  const fy = lerp(320, 296, tm.zoom);
  const tx = 500;
  const ty = 320;
  return {
    s,
    transform: `translate(${tx} ${ty}) scale(${f1(s * 1000) / 1000}) translate(${f1(-fx)} ${f1(-fy)})`,
    at: (p: Pt): Pt => [tx + (p[0] - fx) * s, ty + (p[1] - fy) * s],
  };
}

export function GutSagittal({ t }: SceneProps) {
  const tm = timing(t);
  const cam = camera(tm);
  const body = smoothPath(bodyOutline(tm), true, 0.5);
  const cordD = smoothPath(
    [...range(0, 1, 10).map((u) => offAt(CS, u, lerp(17, 13, u))), ...range(1, 0, 10).map((u) => offAt(CS, u, -lerp(17, 13, u)))],
    true,
    0.5,
  );
  const N = NS;
  const ntD = tubeD(N, 0, 1, hwN, 80, true, true);
  const ntLumen = tubeD(N, 0.01, 0.985, (u) => hwN(u) * (u < 0.3 ? 0.52 : 0.28), 80, true, true);
  const noto = offLine(N, 0.2, 0.975, (u) => -(hwN(u) + 6.5), 50);
  // Oropharyngeal and cloacal membranes: where the gut's endoderm meets the ectoderm of the pits.
  const g0 = at(GS, 0);
  const memb = (s: Sm, w: number) => `M${f1(s.p[0] + s.n[0] * w)},${f1(s.p[1] + s.n[1] * w)}L${f1(s.p[0] - s.n[0] * w)},${f1(s.p[1] - s.n[1] * w)}`;
  const g1 = at(GS, 1);
  const zoomed = tm.zoom;
  const pit = proctoPit(tm);
  void zoomed;
  const A = (p: Pt) => cam.at(p);
  // While the camera is in, a name shows only if its anchor is inside the close-up window.
  const inWin = (q: Pt) => (tm.zoom < 0.01 ? 1 : clamp(Math.min(q[0] - WIN.x0, WIN.x1 - q[0], q[1] - WIN.y0, WIN.y1 - q[1]) / 14));
  const L = (id: string, x: number, y: number, p: Pt, show = 1, small = false) => {
    const q = A(p);
    return <Label key={id} id={id} x={x} y={y} ax={q[0]} ay={q[1]} show={show * inWin(q)} small={small} />;
  };
  const lobes = pouchLobes(tm.pouches);
  const rp = respPath(tm.resp);
  const tp = thyroPath(tm.thyro);

  return (
    <g>
      <defs>
        <clipPath id="w4b-gut-win">
          <rect x={f1(lerp(-10, WIN.x0, tm.zoom))} y={f1(lerp(-10, WIN.y0, tm.zoom))} width={f1(lerp(1020, WIN.x1 - WIN.x0, tm.zoom))} height={f1(lerp(660, WIN.y1 - WIN.y0, tm.zoom))} rx={f1(18 * tm.zoom)} />
        </clipPath>
      </defs>
      {tm.zoom > 0.01 && <rect x={WIN.x0} y={WIN.y0} width={WIN.x1 - WIN.x0} height={WIN.y1 - WIN.y0} rx={18} fill="#0b0a10" stroke="rgba(200,210,240,0.22)" strokeWidth={1.2} opacity={tm.zoom} />}
      <g clipPath="url(#w4b-gut-win)">
      <g transform={cam.transform}>
        {/* Amniotic cavity round the body and cord (amnion = the thin outer line). */}
        <Part id="amnios-barrunbea" quiet>
          <g fill="none" strokeLinejoin="round">
            <path d={body} stroke={AMNION_LINE} strokeWidth={44} />
            <path d={cordD} stroke={AMNION_LINE} strokeWidth={30} />
            <path d={body} stroke={AMNION_FILL} strokeWidth={41} />
            <path d={cordD} stroke={AMNION_FILL} strokeWidth={27} />
          </g>
        </Part>
        {/* Connecting stalk (primitive umbilical cord) with the yolk sac beside it. */}
        <Part id="finkapen-pedikulua" quiet>
          <path d={cordD} fill={EXTRA} opacity={0.85} />
          <path d={cordD} fill="url(#p-meso-extra)" opacity={0.45} />
        </Part>
        <YolkSac tm={tm} />
        {/* Body */}
        <path d={body} fill={BODY} />
        <path d={body} fill="url(#p-meso-intra)" opacity={0.18} />
        <path d={body} fill="none" stroke={BODY_EDGE} strokeWidth={3.2} />
        <Heart />
        <Part id="hodi-neurala">
          <path d={ntD} fill={C.neural} stroke="rgba(20,30,90,0.6)" strokeWidth={1} />
          <path d={ntLumen} fill="#121a3a" />
        </Part>
        <Part id="notokorda">
          <path d={noto} fill="none" stroke={C.notochord} strokeWidth={7} strokeLinecap="round" />
        </Part>
        <Gut tm={tm} />
        {/* Ectodermal pits at both ends */}
        <Part id="estomodeoa">
          <path d="M318,396 Q306,384 300,384 Q292,386 286,394" fill="none" stroke={C.ectoderm} strokeWidth={5} strokeLinecap="round" />
        </Part>
        <Part id="mintz-bukofaringeoa">
          <path d={memb(g0, gutHW(0, tm) + EN + 1)} stroke={C.ectoderm} strokeWidth={3.4} strokeLinecap="round" />
          <path d={memb(g0, gutHW(0, tm) + EN + 1)} stroke={ENDO} strokeWidth={1.6} strokeLinecap="round" transform={`translate(${f1(-g0.n[1] * -1.6)} ${f1(g0.n[0] * -1.6)})`} />
        </Part>
        <Part id="proktodeoa" show={lerp(0.55, 1, tm.ends)}>
          <path d={smoothPath([pit.lipD, pit.floorD, pit.floor, pit.floorV, pit.lipV], false, 0.5)} fill="none" stroke={C.ectoderm} strokeWidth={5} strokeLinecap="round" />
        </Part>
        <Part id="kloaka" show={lerp(0.6, 1, tm.hind)}>
          <path d={tubeD(GS, U.clo, 0.995, (u) => gutHW(u, tm) + EN, 14)} fill="none" stroke="#fde68a" strokeWidth={1.6} />
        </Part>
        <Part id="kloaka-mintza">
          <path d={memb(g1, gutHW(1, tm) + EN)} stroke={C.ectoderm} strokeWidth={3.4} strokeLinecap="round" />
        </Part>
      </g>
      </g>

      <Note x={500} y={612} tone="warn" size={12}>
        KONTUZ: mukosa bakarrik da endodermikoa; gainerako geruzak errai orritik datoz.
      </Note>

      {L('hodi-neurala', 190, 96, offAt(N, 0.3, hwN(0.3) * 0.6))}
      {L('notokorda', 190, 136, offAt(N, 0.33, -(hwN(0.33) + 6.5)), 1, true)}
      {L('faringe-poltsak', 190, 176, lobes[1].c, tm.pouches)}
      {L('faringe-hestea', 190, 216, at(GS, U.pharEnd * 0.5).p, tm.phar)}
      {L('hodi-tiroglosoa', 190, 256, tp[tp.length - 1], tm.thyro)}
      {L('mintz-bukofaringeoa', 190, 290, at(GS, 0).p)}
      {L('estomodeoa', 190, 356, [296, 389])}
      {L('bihotz-hodia', 190, 410, [440, 420], 1, true)}
      {L('hodi-onfalomesenterikoa', 190, 500, [598, 384], tm.vit)}
      {L('bitelo-zaku-sekundarioa', 190, 556, [YOLK.c[0] - 30, YOLK.c[1] + 10])}

      {L('amnios-barrunbea', 810, 96, [520, 82], 1, true)}
      {L('aurreko-hestea', 810, 140, at(GS, U.stom).p, tm.parts)}
      {L('erdiko-hestea', 810, 180, at(GS, (U.foreEnd + U.midEnd) / 2).p, tm.parts)}
      {L('atzeko-hestea', 810, 220, at(GS, 0.7).p, tm.parts)}
      {L('arnas-hastapena', 810, 262, rp[rp.length - 1], tm.resp)}
      {L('errai-orria', 810, 292, offAt(GS, 0.79, -(gutHW(0.79, tm) + EN + SP * 0.5)), 1, true)}
      {L('kloaka', 810, 360, at(GS, 0.975).p, tm.hind)}
      {L('kloaka-mintza', 810, 400, offAt(GS, 1, 0))}
      {L('proktodeoa', 810, 440, pit.floor, tm.ends)}
      {L('alantoidea', 810, 480, [652, 372], lerp(0.6, 1, tm.hind))}
      {L('finkapen-pedikulua', 810, 530, at(CS, 0.8).p, 1, true)}
    </g>
  );
}

// ---------------------------------------------------------------- pharynx: frontal section (Langman 17-10)

const PX = 470;
/** Arch centres (y) and pouch levels between them. */
const ARCH_Y = [128, 214, 292, 360];
const POUCH_Y = [172, 254, 328, 392];
const POUCH_D = [74, 64, 56, 44]; // lateral reach of each pouch
const POUCH_W = [19, 17, 15, 12];
const Y_TOP = 98;
const Y_OES = 438; // where the pharynx narrows into the oesophagus
const lumenHalf = (y: number) => (y <= 400 ? lerp(108, 48, clamp((y - 100) / 300)) : lerp(48, 22, clamp((y - 400) / (Y_OES - 400))));
const surfHalf = (y: number) => {
  const base = (v: number) => lerp(204, 140, clamp((v - 100) / 300)) + 10 * Math.cos(((v - 100) / 300) * Math.PI);
  return y <= 384 ? base(y) : lerp(base(384), 34, clamp((y - 384) / (Y_OES - 384)) ** 1.4);
};
const bump = (y: number, y0: number, w: number) => Math.exp(-(((y - y0) / w) ** 2));
const pouchW = (i: number, fateK: number) => POUCH_W[i] * (i === 0 ? 1 + 0.45 * fateK : 1);

function pharWalls(g: number) {
  const ys = range(Y_TOP, Y_OES, 90);
  /** Endodermal wall including the pouches (the arch tissue ends here). */
  const wall = (sd: 1 | -1, fateK: number) =>
    ys.map((y): Pt => {
      let x = lumenHalf(y);
      POUCH_Y.forEach((py, i) => (x += POUCH_D[i] * g * bump(y, py, pouchW(i, fateK))));
      return [PX + sd * x, y];
    });
  /** Ectodermal surface with the clefts. */
  const surf = (sd: 1 | -1) =>
    ys.map((y): Pt => {
      let x = surfHalf(y);
      POUCH_Y.forEach((py, i) => (x -= (i === 0 ? 44 : 32) * lerp(0.4, 1, g) * bump(y, py, i === 0 ? 11 : 9)));
      return [PX + sd * x, y];
    });
  /** One pouch as a closed finger: from the main wall out to its tip. */
  const pouch = (sd: 1 | -1, i: number, fateK: number, inset = 0): Pt[] => {
    const w = pouchW(i, fateK) - inset * 0.9;
    const yy = range(POUCH_Y[i] - w * 1.9, POUCH_Y[i] + w * 1.9, 18);
    const outer = yy.map((y): Pt => [PX + sd * (lumenHalf(y) + Math.max(0, (POUCH_D[i] * g - inset) * bump(y, POUCH_Y[i], w) - inset * 0.4)), y]);
    const inner = yy.map((y): Pt => [PX + sd * (lumenHalf(y) - 6), y]).reverse();
    return [...outer, ...inner];
  };
  return { wall, surf, pouch };
}

export function PharynxClose({ t }: SceneProps) {
  const tm = timing(t);
  const g = Math.max(tm.pouches, 0.02);
  const { wall, surf, pouch } = pharWalls(g);
  const wl = wall(-1, 0);
  const wr = wall(1, tm.fate);
  const sl = surf(-1);
  const sr = surf(1);
  const archD = (w: Pt[], s: Pt[]) => smoothPath([...w, ...s.slice().reverse()], true, 0.4);
  const ys = range(Y_TOP, Y_OES, 60);
  const lumen = (inset: number) =>
    smoothPath([...ys.map((y): Pt => [PX - lumenHalf(y) + inset, y]), ...ys.map((y): Pt => [PX + lumenHalf(y) - inset, y]).reverse()], true, 0.4);
  const resp = tm.resp;
  const thy = tm.thyro;
  const fateOn = tm.fate;
  const roman = ['I', 'II', 'III', 'IV'];
  const Lb = (id: string, x: number, y: number, a: Pt, show = 1, small = false) => <Label key={id} id={id} x={x} y={y} ax={a[0]} ay={a[1]} show={show} small={small} />;
  const tipX = (sd: 1 | -1, i: number) => PX + sd * (lumenHalf(POUCH_Y[i]) + POUCH_D[i] * g);
  const archX = (sd: 1 | -1, y: number) => PX + (sd * (lumenHalf(y) + surfHalf(y))) / 2;
  const derived = [
    { head: '1. poltsa → erdiko belarria', sub: 'danbor-barrunbea + Eustakioren tronpa' },
    { head: '2. poltsa → aho-sabaiko amigdala', sub: '' },
    { head: '3. poltsa → timoa', sub: '+ beheko paratiroidea' },
    { head: '4. poltsa → goiko paratiroidea', sub: '' },
  ];
  const thyTip = lerp(198, 300, thy);
  const respTip = lerp(Y_OES + 6, 528, resp);
  const oes = (hw: number) =>
    `M${PX - hw - 2},${Y_OES - 4} C${PX - hw},${Y_OES + 40} ${PX - hw + 6},${Y_OES + 90} ${PX - hw + 6},574 L${PX + hw - 6},574 C${PX + hw - 6},${Y_OES + 90} ${PX + hw},${Y_OES + 40} ${PX + hw + 2},${Y_OES - 4} Z`;
  const vline = (y0: number, y1: number) => `M${PX},${f1(y0)} L${PX},${f1(y1)}`;

  return (
    <g>
      <rect x={0} y={0} width={1000} height={640} fill="#0e0d12" />
      {/* Oesophagus continuing caudally (foregut beyond the pharynx). */}
      <Part id="aurreko-hestea">
        <path d={oes(22)} fill={ENDO} stroke={ENDO_EDGE} strokeWidth={1} />
        <path d={oes(15)} fill={LUMEN} />
      </Part>
      {/* Arches: mesenchyme with the arch artery; ectoderm outside, endoderm inside. */}
      <Part id="faringe-arkuak">
        {[
          [wl, sl],
          [wr, sr],
        ].map(([w, s], k) => (
          <g key={k}>
            <path d={archD(w, s)} fill="#7a2a36" />
            <path d={archD(w, s)} fill="url(#p-meso-intra)" opacity={0.35} />
          </g>
        ))}
        {ARCH_Y.map((y, i) =>
          ([-1, 1] as const).map((sd) => <circle key={`${i}${sd}`} cx={f1(archX(sd, y))} cy={y + 4} r={[9, 8, 7, 6][i]} fill={C.artery} stroke="#7a1020" strokeWidth={1} opacity={0.9} />),
        )}
      </Part>
      {[sl, sr].map((s, k) => (
        <path key={k} d={smoothPath(s, false, 0.4)} fill="none" stroke={C.ectoderm} strokeWidth={5} strokeLinecap="round" />
      ))}
      {/* Pharyngeal gut: lumen lined by endoderm */}
      <Part id="faringe-hestea">
        <path d={lumen(0)} fill={ENDO} />
        <path d={lumen(5)} fill={LUMEN} />
      </Part>
      {/* Pouches: lateral evaginations of the lining between the arches. */}
      <Part id="faringe-poltsak" show={lerp(0.5, 1, tm.pouches)}>
        {POUCH_Y.map((_, i) =>
          ([-1, 1] as const).map((sd) => (
            <g key={`${i}${sd}`}>
              <path d={smoothPath(pouch(sd, i, sd > 0 ? tm.fate : 0), true, 0.4)} fill={ENDO} />
              <path d={smoothPath(pouch(sd, i, sd > 0 ? tm.fate : 0, 5), true, 0.4)} fill={LUMEN} />
            </g>
          )),
        )}
      </Part>
      {/* Derivatives on the right side (later fate of each pouch). */}
      {fateOn > 0.01 && (
        <g opacity={fateOn}>
          {/* 1: tubotympanic recess widening into the tympanic cavity */}
          <ellipse cx={f1(tipX(1, 0) - 8)} cy={POUCH_Y[0] - 3} rx={15} ry={12} fill="rgba(253,230,138,0.18)" stroke="#fde68a" strokeWidth={2} />
          {/* 2: palatine tonsil (lymphoid tissue round the shallow pouch) */}
          <circle cx={f1(PX + lumenHalf(POUCH_Y[1]) + POUCH_D[1] * 0.5)} cy={POUCH_Y[1]} r={11} fill="#e58fb0" opacity={0.85} />
          {/* 3: inferior parathyroid (dorsal) + thymus (ventral, elongating caudally) */}
          <circle cx={f1(tipX(1, 2) - 6)} cy={POUCH_Y[2] - 9} r={6} fill="#f3e07a" stroke="#8a6b10" strokeWidth={1} />
          <path d={`M${f1(tipX(1, 2) - 10)},${POUCH_Y[2] + 8} q 6,24 -2,46`} fill="none" stroke="#b9445a" strokeWidth={10} strokeLinecap="round" />
          {/* 4: superior parathyroid */}
          <circle cx={f1(tipX(1, 3) - 4)} cy={POUCH_Y[3] - 6} r={5.5} fill="#f3e07a" stroke="#8a6b10" strokeWidth={1} />
        </g>
      )}
      {/* Thyroglossal duct: from the foramen caecum in the floor (between arches I and II) down the midline, in front of the gut. */}
      {thy > 0.01 && (
        <Part id="hodi-tiroglosoa" show={clamp(thy * 3)}>
          <path d={vline(192, thyTip)} stroke={ENDO_EDGE} strokeWidth={6.5} strokeLinecap="round" />
          <path d={vline(192, thyTip)} stroke="#f5c95a" strokeWidth={4} strokeLinecap="round" />
          {([1, -1] as const).map((sd) => (
            <ellipse key={sd} cx={f1(PX + sd * lerp(4, 14, thy))} cy={f1(thyTip + 6)} rx={f1(lerp(4, 13, thy))} ry={f1(lerp(4, 10, thy))} fill="#f5c95a" stroke={ENDO_EDGE} strokeWidth={1} />
          ))}
        </Part>
      )}
      <circle cx={PX} cy={192} r={3.5} fill="#1a1408" stroke="#fde68a" strokeWidth={1} />
      {/* Respiratory diverticulum: from the laryngotracheal groove in the caudal floor, ventral to the oesophagus. */}
      {resp > 0.01 && (
        <Part id="arnas-hastapena" show={clamp(resp * 3)}>
          <path d={vline(Y_OES - 6, respTip)} stroke={ENDO_EDGE} strokeWidth={13} strokeLinecap="round" opacity={0.95} />
          <path d={vline(Y_OES - 6, respTip)} stroke="#f7d27a" strokeWidth={10} strokeLinecap="round" />
          {([1, -1] as const).map((sd) => (
            <ellipse key={sd} cx={f1(PX + sd * lerp(4, 22, resp))} cy={f1(respTip + lerp(2, 12, resp))} rx={f1(lerp(4, 14, resp))} ry={f1(lerp(4, 11, resp))} fill="#f7d27a" stroke={ENDO_EDGE} strokeWidth={1} opacity={clamp((resp - 0.3) * 2)} />
          ))}
        </Part>
      )}
      {/* Oropharyngeal membrane closing the cranial end */}
      <Part id="mintz-bukofaringeoa">
        <path d={`M${f1(PX - lumenHalf(Y_TOP) + 2)},${Y_TOP} Q${PX},${Y_TOP - 8} ${f1(PX + lumenHalf(Y_TOP) - 2)},${Y_TOP}`} fill="none" stroke={C.ectoderm} strokeWidth={4} />
        <path d={`M${f1(PX - lumenHalf(Y_TOP) + 2)},${Y_TOP + 3} Q${PX},${Y_TOP - 5} ${f1(PX + lumenHalf(Y_TOP) - 2)},${Y_TOP + 3}`} fill="none" stroke={ENDO} strokeWidth={2} />
      </Part>
      {/* Arch numbers, pouch numbers (inside) and cleft numbers (outside) */}
      {ARCH_Y.map((y, i) =>
        ([-1, 1] as const).map((sd) => (
          <text key={`${i}${sd}`} x={f1(archX(sd, y))} y={y - 12} textAnchor="middle" className="note" fontSize={12} fill="#f5d0d6" opacity={0.85}>
            {roman[i]}
          </text>
        )),
      )}
      {POUCH_Y.map((y, i) => (
        <text key={i} x={f1(PX - lumenHalf(y) + 16)} y={y + 4} textAnchor="middle" className="note" fontSize={11} fill="#fde68a" opacity={0.9}>
          {i + 1}
        </text>
      ))}
      {POUCH_Y.map((y, i) => (
        <text key={`c${i}`} x={f1(PX - surfHalf(y) + (i === 0 ? 44 : 32) * lerp(0.4, 1, g) - 14)} y={y + 4} textAnchor="middle" className="note" fontSize={11} fill="#9ec0ff" opacity={0.9}>
          {i + 1}
        </text>
      ))}
      <Note x={PX - 120} y={72} tone="dim" size={11}>
        Garatzen: poltsak (horiz) eta arrailak (urdinez)
      </Note>
      <Note x={PX + 150} y={72} tone="dim" size={11} show={fateOn}>
        Eratorriak (geroago)
      </Note>
      {derived.map((d, i) => (
        <g key={i} opacity={fateOn}>
          <Note x={704} y={POUCH_Y[i] - (d.sub ? 7 : 0)} align="start" tone="accent" size={11}>
            {d.head}
          </Note>
          {d.sub && (
            <Note x={704} y={POUCH_Y[i] + 8} align="start" tone="dim" size={10.5}>
              {d.sub}
            </Note>
          )}
        </g>
      ))}

      {Lb('mintz-bukofaringeoa', 190, 96, [PX - 50, Y_TOP - 4], 1, true)}
      {Lb('faringe-arkuak', 190, 150, [archX(-1, ARCH_Y[0]) - 14, ARCH_Y[0] + 16])}
      {Lb('faringe-poltsak', 190, 236, [tipX(-1, 1) + 10, POUCH_Y[1]], lerp(0.5, 1, tm.pouches))}
      {Lb('faringe-hestea', 190, 290, [PX - 26, 300])}
      {Lb('hodi-tiroglosoa', 190, 350, [PX - 3, thyTip - 10], thy)}
      {Lb('arnas-hastapena', 190, 460, [PX - 12, respTip - 8], resp)}
      {Lb('aurreko-hestea', 190, 530, [PX - 12, 560])}

      <Note x={500} y={592} tone="warn" size={11}>
        Apunteek 6 faringe-poltsa aipatzen dituzte; ohikoena 4 poltsa garatu + 5.a hastapenezkoa da.
      </Note>
      <Note x={500} y={612} tone="warn" size={11}>
        Kanpoko entzunbidea 1. faringe-arrailetik (ektodermoa) dator, ez poltsatik.
      </Note>
    </g>
  );
}
