'use client';

import { useId } from 'react';
import { Label, Note, Part, lerp, seg, smoothPath, zoom, type Pt, type SceneProps } from '@/components/kit';
import { Defs8, MesCell, Q, f1, inPoly, mesCells, mirror, morph, vis } from './common';

/**
 * 8:kondrokraneoa — apunteen 3.1.2 atala eta haren irudia (kondrokraneoa goitik, ikuspegi endokraneala).
 * Irudiaren hitzarmena bera: ezkerreko erdian hezurrak, eskuinekoan haien kartilagoak. Pieza bakoitza bere
 * urratsean mesenkimatik kondentsatzen da kartilago gisa (bi aldeetan), eta ezkerrean hezur bihurtzen da;
 * erdiko plaka atzetik aurrera (esklerotoma okzipitalak → parakordalak → hipofisi kartilagoak → trenkadatxoak),
 * gero alboko plakak (kapsula periotikoa → hego tenporala → begizulo hegoa). Amaieran oinalde osoa hezurtzen da,
 * piezak fusionatzean zuloak geratzen dira eta nerbio kranialak haietatik irteten dira.
 */

export const CB_T = { intro: 0, scl: 0.1, para: 0.2, hyp: 0.33, trab: 0.46, peri: 0.56, wings: 0.66, all: 0.77, holes: 0.87 };

const CX = 500;
const CY = 322;
const mx = (p: Pt): Pt => mirror(p, CX);
const ell = (cx: number, cy: number, rx: number, ry: number, rot = 0, n = 36): Pt[] => {
  const r = (rot * Math.PI) / 180;
  return Array.from({ length: n }, (_, i) => {
    const a = -Math.PI / 2 + (i / n) * Math.PI * 2;
    const x = Math.cos(a) * rx;
    const y = Math.sin(a) * ry;
    return [cx + x * Math.cos(r) - y * Math.sin(r), cy + x * Math.sin(r) + y * Math.cos(r)];
  });
};
const closed = (pts: readonly Pt[]) => `M${pts.map((p) => `${f1(p[0])},${f1(p[1])}`).join('L')}Z`;
const centroid = (pts: readonly Pt[]): Pt => [pts.reduce((s, p) => s + p[0], 0) / pts.length, pts.reduce((s, p) => s + p[1], 0) / pts.length];

// The skull cut open above the floor: the cut vault (a ring) and the floor inside it.
const OUTER = ell(CX, CY, 236, 262, 0, 72);
const FLOOR = ell(CX, CY, 222, 248, 0, 72);
const SQUAMA: Pt[] = [
  [318, 472], [380, 494], [430, 508], [456, 522], [CX, 532], [544, 522], [570, 508], [620, 494], [682, 472],
  ...FLOOR.filter((p) => p[1] > 472).sort((a, b) => b[0] - a[0]),
];

/** One cartilage of the chondrocranium (left-side geometry; the right side is its mirror) and the bone it becomes. */
type Piece = { key: string; cart: string; bone: string; C: Pt[]; B: Pt[]; c0: number; o0: number };
const PIECES: Piece[] = [
  {
    key: 'peri',
    cart: 'kapsula-periotikoa',
    bone: 'harkaitza',
    C: ell(392, 396, 40, 26, -28),
    B: [[452, 352], [460, 366], [452, 392], [426, 420], [380, 440], [336, 446], [320, 432], [340, 412], [390, 384], [430, 362]],
    c0: CB_T.peri + 0.005,
    o0: CB_T.peri + 0.045,
  },
  {
    key: 'temp',
    cart: 'hego-tenporala',
    bone: 'esfenoidesaren-hego-handia',
    C: ell(404, 300, 34, 19, -15),
    B: [[462, 262], [462, 300], [446, 318], [410, 334], [360, 350], [326, 352], [322, 320], [350, 290], [400, 270], [440, 262]],
    c0: CB_T.wings + 0.005,
    o0: CB_T.wings + 0.045,
  },
  {
    key: 'para',
    cart: 'kartilago-parakordalak',
    bone: 'okzipitalaren-oinaldea',
    C: [[494, 326], [494, 428], [468, 424], [452, 404], [448, 370], [456, 336], [476, 322]],
    B: [[499, 300], [499, 530], [456, 520], [436, 492], [430, 452], [440, 412], [450, 368], [460, 326], [478, 302]],
    c0: CB_T.para + 0.015,
    o0: CB_T.para + 0.055,
  },
  {
    key: 'hyp',
    cart: 'hipofisi-kartilagoak',
    bone: 'esfenoidesaren-gorputza',
    C: ell(484, 286, 13, 16),
    B: [[499, 236], [499, 312], [480, 312], [464, 304], [460, 280], [466, 252], [482, 238]],
    c0: CB_T.hyp + 0.005,
    o0: CB_T.hyp + 0.045,
  },
  {
    key: 'orb',
    cart: 'begizulo-hegoa',
    bone: 'esfenoidesaren-hego-txikia',
    C: ell(420, 226, 38, 9, -8),
    B: [[482, 240], [484, 252], [466, 254], [430, 248], [380, 238], [340, 230], [334, 218], [370, 214], [420, 222], [462, 236]],
    c0: CB_T.wings + 0.015,
    o0: CB_T.wings + 0.055,
  },
  {
    key: 'trab',
    cart: 'trenkada-kranialak',
    bone: 'etmoidesa',
    C: [[497, 134], [497, 180], [496, 236], [490, 240], [484, 226], [482, 180], [486, 134]],
    B: [[499, 104], [499, 236], [482, 232], [476, 200], [476, 150], [486, 110]],
    c0: CB_T.trab + 0.005,
    o0: CB_T.trab + 0.045,
  },
];
const PIECE = Object.fromEntries(PIECES.map((p) => [p.key, p])) as Record<string, Piece>;

/** Three occipital somites' sclerotomes and the first cervical one, behind the parachordals (left side). */
const BLOCKS: Pt[] = [[468, 436], [468, 462], [468, 488], [468, 514]];
const SELLA: Pt = [CX, 282];
const FM = { c: [CX, 452] as Pt, rx: 32, ry: 38 };
const fmHalf = (side: 1 | -1): Pt[] =>
  Array.from({ length: 19 }, (_, i) => {
    const a = (side < 0 ? Math.PI / 2 : -Math.PI / 2) + (i / 18) * Math.PI;
    return [FM.c[0] + Math.cos(a) * FM.rx, FM.c[1] + Math.sin(a) * FM.ry];
  });

/** Holes left where the bone pieces fuse, and the nerves (and Roman numerals) that pass through them — left side. */
const HOLES: { p: Pt; rx: number; ry: number; rot?: number }[] = [
  { p: [472, 246], rx: 5, ry: 5 }, // canalis opticus
  { p: [440, 258], rx: 22, ry: 4.5, rot: 8 }, // fisura orbitarioa
  { p: [448, 296], rx: 4, ry: 4 }, // biribila
  { p: [428, 320], rx: 7, ry: 4.5, rot: -20 }, // obalatua
  { p: [410, 388], rx: 6, ry: 6 }, // barne entzunbidea
  { p: [440, 428], rx: 9, ry: 6, rot: 30 }, // jugularra
  { p: [452, 474], rx: 4, ry: 4 }, // hipoglosoa
];
const CRIBRI: Pt[] = Array.from({ length: 14 }, (_, i) => [i % 2 ? 492 : 485, 130 + Math.floor(i / 2) * 14]);
const NERVES: { a: Pt; b: Pt; bend: number }[] = [
  { a: [CX, 258], b: [472, 246], bend: 0 }, // II
  { a: [490, 318], b: [446, 258], bend: 0.12 }, // III
  { a: [482, 350], b: [452, 262], bend: 0.18 }, // IV
  { a: [476, 352], b: [444, 334], bend: 0 }, // V (to the ganglion)
  { a: [444, 334], b: [432, 260], bend: -0.08 }, // V1
  { a: [444, 334], b: [448, 296], bend: 0 }, // V2
  { a: [444, 334], b: [428, 320], bend: 0 }, // V3
  { a: [494, 400], b: [456, 262], bend: 0.1 }, // VI
  { a: [478, 384], b: [410, 388], bend: 0 }, // VII–VIII
  { a: [480, 412], b: [440, 428], bend: 0 }, // IX–XI
  { a: [486, 438], b: [452, 474], bend: 0 }, // XII
];
const NUMERALS: { p: Pt; s: string }[] = [
  { p: [534, 232], s: 'II' },
  { p: [588, 250], s: 'III · IV · V₁ · VI' },
  { p: [586, 314], s: 'V₂ · V₃' },
  { p: [610, 382], s: 'VII · VIII' },
  { p: [574, 448], s: 'IX · X · XI' },
  { p: [566, 494], s: 'XII' },
];
const BRAINSTEM: Pt[] = [[CX, 300], [524, 320], [530, 370], [522, 420], [514, 470], [486, 470], [478, 420], [470, 370], [476, 320]];

const quad = (a: Pt, b: Pt, bend: number, u: number): Pt => {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const c: Pt = [a[0] + dx / 2 - dy * bend, a[1] + dy / 2 + dx * bend];
  return [(1 - u) * (1 - u) * a[0] + 2 * (1 - u) * u * c[0] + u * u * b[0], (1 - u) * (1 - u) * a[1] + 2 * (1 - u) * u * c[1] + u * u * b[1]];
};
const partial = (a: Pt, b: Pt, bend: number, k: number) =>
  `M${Array.from({ length: 13 }, (_, i) => quad(a, b, bend, (i / 12) * k))
    .map((p) => `${f1(p[0])},${f1(p[1])}`)
    .join('L')}`;

/** Loose mesenchyme over the floor; each cell is pulled into the cartilage nearest to it when that cartilage condenses. */
const FIELD = mesCells((x, y) => inPoly(FLOOR, x, y), [282, 80, 718, 566], 21, 81);
type Target = { c: Pt; key: string };
const TARGETS: Target[] = [
  ...PIECES.flatMap((p) => [
    { c: centroid(p.C), key: p.key },
    { c: mx(centroid(p.C)), key: p.key },
  ]),
  ...BLOCKS.flatMap((b) => [
    { c: b, key: 'scl' },
    { c: mx(b), key: 'scl' },
  ]),
  { c: [CX, 548], key: 'sq' },
  { c: [400, 520], key: 'sq' },
  { c: [600, 520], key: 'sq' },
];
const FIELD_T = FIELD.map((cell) => {
  let best: Target | null = null;
  let bd = 62;
  for (const tg of TARGETS) {
    const d = Math.hypot(tg.c[0] - cell.p[0], tg.c[1] - cell.p[1]);
    if (d < bd) {
      bd = d;
      best = tg;
    }
  }
  return { ...cell, tg: best };
});

/** The inner ear inside the petrous part: cochlea spiral and three semicircular canals. */
function InnerEar({ c, s }: { c: Pt; s: number }) {
  const spiral = Array.from({ length: 40 }, (_, i) => {
    const a = i * 0.42;
    const r = 2 + i * 0.22;
    return [c[0] - 8 * s + Math.cos(a) * r * s, c[1] + 4 * s + Math.sin(a) * r * s] as Pt;
  });
  return (
    <g fill="none" stroke="#7dd3fc" strokeWidth={2.2} strokeLinecap="round">
      <path d={`M${spiral.map((p) => `${f1(p[0])},${f1(p[1])}`).join('L')}`} />
      <ellipse cx={c[0] + 8 * s} cy={c[1] - 6 * s} rx={7 * s} ry={5 * s} />
      <ellipse cx={c[0] + 12 * s} cy={c[1] + 2 * s} rx={5 * s} ry={7 * s} />
      <ellipse cx={c[0] + 4 * s} cy={c[1] - 1 * s} rx={6 * s} ry={4 * s} transform={`rotate(40 ${f1(c[0] + 4 * s)} ${f1(c[1] - s)})`} />
    </g>
  );
}

/** A label disappears as the push-in carries its anchor out of the picture. */
const inFrame = (p: Pt) => 1 - Math.min(1, Math.max(30 - p[0], p[0] - 970, 40 - p[1], p[1] - 596, 0) / 24);

export function CranialBase({ t, reduced }: SceneProps) {
  const cid = useId().replace(/:/g, '');
  const cartK = (p: Piece) => seg(t, p.c0, p.c0 + 0.035);
  const ossL = (p: Piece) => seg(t, p.o0, p.o0 + 0.03);
  const ossR = seg(t, CB_T.all + 0.015, CB_T.all + 0.06);
  const scl = seg(t, CB_T.scl + 0.005, CB_T.scl + 0.04);
  const sq = seg(t, CB_T.para + 0.055, CB_T.para + 0.09);
  const lift = seg(t, 0.015, 0.06);
  const fuse = seg(t, CB_T.holes - 0.006, CB_T.holes + 0.02);
  const holes = seg(t, CB_T.holes + 0.005, CB_T.holes + 0.03);
  const nv = seg(t, CB_T.holes + 0.02, CB_T.holes + 0.08);
  const ghost = seg(t, CB_T.holes + 0.01, CB_T.holes + 0.03);
  const ear = seg(t, PIECE.peri.c0, PIECE.peri.c0 + 0.035);
  const sella = ossL(PIECE.hyp);
  // Push-in on the sphenoid body while the hypophyseal fossa and the gland take shape.
  const push = seg(t, CB_T.hyp + 0.015, CB_T.hyp + 0.04) * (1 - seg(t, CB_T.trab - 0.03, CB_T.trab - 0.005));
  const z = zoom(CX, lerp(CY, SELLA[1], push), lerp(1, 2.2, push), 500, 320);
  const A = (p: Pt) => z.at(p[0], p[1]);
  const L = (p: Pt) => A(p);
  void reduced;
  const prog: Record<string, number> = { scl, sq, ...Object.fromEntries(PIECES.map((p) => [p.key, cartK(p)])) };
  // Where the mesenchyme is still loose: a cell not yet pulled into its cartilage (bottom left first).
  const mesAt = (() => {
    let best: Pt | null = null;
    for (const cell of FIELD_T) {
      const k = cell.tg ? (prog[cell.tg.key] ?? 0) : seg(t, CB_T.all, CB_T.all + 0.05);
      if (k > 0.3) continue;
      const to = cell.tg ? cell.tg.c : cell.p;
      const p: Pt = [lerp(cell.p[0], to[0], 0.6 * k), lerp(cell.p[1], to[1], 0.6 * k)];
      if (!best || p[1] - p[0] > best[1] - best[0]) best = p;
    }
    return best;
  })();

  const piece = (p: Piece, side: 1 | -1) => {
    const C = side < 0 ? p.C : p.C.map(mx);
    const B = side < 0 ? p.B : p.B.map(mx);
    const k = cartK(p);
    const o = side < 0 ? ossL(p) : ossR;
    if (k <= 0.01) return null;
    const G = morph(C, B, o, 64);
    // Condensing: the cartilage swells out of its centre as it appears.
    const c = centroid(C);
    const sk = lerp(0.55, 1, k);
    const tr = `translate(${f1(c[0] * (1 - sk))},${f1(c[1] * (1 - sk))}) scale(${sk.toFixed(3)})`;
    const centre = centroid(B);
    return (
      <g key={`${p.key}${side}`} transform={o > 0.01 ? undefined : tr}>
        <Part id={p.cart} show={k * (1 - o)}>
          <path d={smoothPath(G, true, 0.25)} fill={Q.cart} stroke={Q.cartDeep} strokeWidth={1.4} />
          <path d={smoothPath(G, true, 0.25)} fill="url(#w8-cart)" />
        </Part>
        <Part id={p.bone} show={o}>
          <path d={smoothPath(G, true, 0.25)} fill={Q.bone} stroke={Q.boneDeep} strokeWidth={1.4} />
          <path d={smoothPath(G, true, 0.25)} fill="url(#w8-bone)" />
          <path d={smoothPath(G, true, 0.25)} fill="url(#w8-boneshade)" />
          {/* The ossification centre glows while the cartilage turns to bone. */}
          <circle cx={centre[0]} cy={centre[1]} r={lerp(3, 9, o)} fill={Q.centre} opacity={Math.sin(Math.PI * Math.min(1, o * 1.15)) * 0.9} />
        </Part>
      </g>
    );
  };

  return (
    <g>
      <Defs8 />
      <rect x={0} y={0} width={1000} height={640} fill="#0f0f11" />
      <clipPath id={`w8-cb-sq${cid}`}>
        <path d={closed(SQUAMA)} />
      </clipPath>
      <g transform={z.transform}>
        {/* The floor of the box (the chondrocranium) inside the cut vault. */}
        <Part id="kondrokraneoa">
          <path d={closed(FLOOR)} fill="#251b23" stroke="#4a3a46" strokeWidth={2} />
          {/* Fusion: the pieces grow into one another and the floor closes into bone, all but the holes. */}
          <path d={closed(FLOOR)} fill="#d6c9ab" opacity={fuse} />
          <path d={closed(FLOOR)} fill="url(#w8-bone)" opacity={fuse} />
          <path d={closed(FLOOR)} fill="url(#w8-light)" />
        </Part>
        <Part id="buru-ganga" quiet>
          <path d={`${closed(OUTER)}${closed(FLOOR)}`} fillRule="evenodd" fill="#cfc3a6" stroke={Q.boneDeep} strokeWidth={1.5} />
        </Part>

        {/* Mesenchyme, pulled into each cartilage as it condenses. */}
        <Part id="mesenkima" show={1 - ossR}>
          {FIELD_T.map((cell, i) => {
            const k = cell.tg ? (prog[cell.tg.key] ?? 0) : seg(t, CB_T.all, CB_T.all + 0.05);
            if (k >= 0.99) return null;
            const to = cell.tg ? cell.tg.c : cell.p;
            const p: Pt = [lerp(cell.p[0], to[0], 0.6 * k), lerp(cell.p[1], to[1], 0.6 * k)];
            return <MesCell key={i} p={p} r={cell.r * 0.85} a={cell.a} opacity={0.75 * (1 - k)} />;
          })}
        </Part>

        {/* The occipital squama (vault, membranous) grows out to meet the basilar part. */}
        <Part id="okzipitalaren-ezkata" show={sq > 0.01 ? 1 : 0}>
          <g clipPath={`url(#w8-cb-sq${cid})`}>
            <circle cx={CX} cy={560} r={Math.max(0.5, 230 * sq)} fill={Q.bone} />
            <circle cx={CX} cy={560} r={Math.max(0.5, 230 * sq)} fill="url(#w8-boneshade)" />
            <path
              d={Array.from({ length: 26 }, (_, i) => {
                const a = Math.PI + (i / 25) * Math.PI;
                return `M${CX},560L${f1(CX + Math.cos(a) * 230 * sq)},${f1(560 + Math.sin(a) * 230 * sq)}`;
              }).join('')}
              stroke="rgba(150,120,70,0.4)"
              strokeWidth={1.3}
            />
            <path d={closed(SQUAMA)} fill="none" stroke={Q.boneDeep} strokeWidth={3} />
          </g>
        </Part>

        {/* Notochord: the central plate forms around its cranial end. */}
        <Part id="notokorda" show={vis(t, CB_T.scl, CB_T.all + 0.06)}>
          <path d={`M${CX},306L${CX},566`} stroke={Q.noto} strokeWidth={7} strokeLinecap="round" />
        </Part>

        {/* Occipital sclerotomes, merged into the basilar part when it ossifies. */}
        {([-1, 1] as const).map((side) => (
          <Part key={side} id="esklerotoma-okzipitalak" show={scl * (1 - (side < 0 ? ossL(PIECE.para) : ossR))}>
            {BLOCKS.map((b, i) => {
              const p = side < 0 ? b : mx(b);
              const s = lerp(0.5, 1, seg(t, CB_T.scl + 0.005 + i * 0.006, CB_T.scl + 0.03 + i * 0.006));
              return <rect key={i} x={p[0] - 16 * s} y={p[1] - 10 * s} width={32 * s} height={20 * s} rx={7} fill={Q.paraxial} opacity={i === 3 ? 0.7 : 0.9} stroke={Q.paraxialDeep} strokeWidth={1.2} />;
            })}
          </Part>
        ))}
        {/* Their mesenchyme streams forward into the parachordal plates. */}
        <Part id="mesenkima" show={vis(t, CB_T.para, CB_T.para + 0.06)}>
          {([-1, 1] as const).flatMap((side) =>
            Array.from({ length: 8 }, (_, i) => {
              const u = seg(t, CB_T.para + i * 0.002, CB_T.para + 0.035 + i * 0.002);
              const from = BLOCKS[i % 4];
              const to: Pt = [470 + (i % 3) * 8, 340 + (i % 4) * 20];
              const p0 = side < 0 ? from : mx(from);
              const p1 = side < 0 ? to : mx(to);
              return <MesCell key={`${side}${i}`} p={[lerp(p0[0], p1[0], u), lerp(p0[1], p1[1], u)]} r={1.05} a={i * 47 + t * 300} fill={Q.paraxial} opacity={1 - seg(u, 0.8, 1)} />;
            }),
          )}
        </Part>

        {/* Cartilages and their bones, back to front on the central plate, then the lateral plates. */}
        {PIECES.map((p) => piece(p, -1))}
        {PIECES.map((p) => piece(p, 1))}

        {/* Once fused, the floor shows its real relief: three stepped fossae (anterior, middle, posterior), the
            lesser wings' sharp edge and the petrous ridges between them, the crista galli, the dorsum sellae. */}
        {fuse > 0.01 && (
          <g opacity={fuse} pointerEvents="none">
            <defs>
              <radialGradient id={`w8-cb-deep${cid}`} cx="0.5" cy="0.5" r="0.5">
                <stop offset="0" stopColor="#2a1d10" stopOpacity={0.5} />
                <stop offset="0.7" stopColor="#2a1d10" stopOpacity={0.2} />
                <stop offset="1" stopColor="#2a1d10" stopOpacity={0} />
              </radialGradient>
              <linearGradient id={`w8-cb-ridge${cid}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#fffaf0" stopOpacity={0.95} />
                <stop offset="1" stopColor="#8a7448" stopOpacity={0.9} />
              </linearGradient>
            </defs>
            {([-1, 1] as const).map((side) => {
              const P = (p: Pt) => (side < 0 ? p : mx(p));
              const d = (pts: Pt[]) => smoothPath(pts.map(P), false, 0.3);
              const mid = P([372, 322]);
              return (
                <g key={side}>
                  {/* Middle fossa (temporal lobe), deeper than the anterior one. */}
                  <ellipse cx={mid[0]} cy={mid[1]} rx={88} ry={64} transform={`rotate(${side * -22} ${f1(mid[0])} ${f1(mid[1])})`} fill={`url(#w8-cb-deep${cid})`} />
                  {/* Orbital roof: the gentle bumps of the gyri pressed into it. */}
                  {[[392, 168], [420, 196], [364, 196]].map((q, i) => {
                    const c = P(q as Pt);
                    return <ellipse key={i} cx={c[0]} cy={c[1]} rx={18} ry={10} fill="#fffaf0" opacity={0.14} />;
                  })}
                  {/* Lesser wing: the sharp free edge between the anterior and middle fossae. */}
                  <path d={d([[334, 226], [372, 234], [420, 246], [456, 252], [482, 250]])} fill="none" stroke="#5c4a2a" strokeWidth={6} strokeLinecap="round" opacity={0.55} />
                  <path d={d([[334, 224], [372, 232], [420, 244], [456, 250], [482, 248]])} fill="none" stroke={`url(#w8-cb-ridge${cid})`} strokeWidth={3} strokeLinecap="round" />
                  {/* Petrous ridge: the top of the petrous part, between the middle and posterior fossae. */}
                  <path d={d([[326, 438], [366, 418], [404, 396], [436, 374], [458, 356]])} fill="none" stroke="#5c4a2a" strokeWidth={8} strokeLinecap="round" opacity={0.55} />
                  <path d={d([[326, 435], [366, 415], [404, 393], [436, 371], [458, 353]])} fill="none" stroke={`url(#w8-cb-ridge${cid})`} strokeWidth={4} strokeLinecap="round" />
                </g>
              );
            })}
            {/* Posterior fossa (cerebellum): the deepest bowl, round the foramen magnum. */}
            <ellipse cx={CX} cy={476} rx={150} ry={74} fill={`url(#w8-cb-deep${cid})`} />
            {/* Crista galli, in the midline of the ethmoid; the dorsum sellae and clinoid processes behind the sella. */}
            <path d={`M${CX},112L${CX},166`} stroke="#5c4a2a" strokeWidth={7} strokeLinecap="round" opacity={0.5} />
            <path d={`M${CX},110L${CX},164`} stroke={`url(#w8-cb-ridge${cid})`} strokeWidth={4} strokeLinecap="round" />
            <path d={`M${CX - 20},300Q${CX},310 ${CX + 20},300`} fill="none" stroke={`url(#w8-cb-ridge${cid})`} strokeWidth={4} strokeLinecap="round" />
            <circle cx={CX - 22} cy={262} r={4} fill="#fffaf0" opacity={0.8} />
            <circle cx={CX + 22} cy={262} r={4} fill="#fffaf0" opacity={0.8} />
          </g>
        )}

        {/* Hypophyseal fossa on the sphenoid body, with the gland in it. */}
        <Part id="hipofisi-hobitxoa" show={sella}>
          <ellipse cx={SELLA[0]} cy={SELLA[1]} rx={18} ry={15} fill="#2a1c12" stroke={Q.boneDeep} strokeWidth={2} />
        </Part>
        <Part id="hipofisi-guruina" show={sella}>
          <ellipse cx={SELLA[0]} cy={SELLA[1] - 4} rx={12} ry={7} fill="#e879f9" stroke="#86198f" strokeWidth={0.8} />
          <ellipse cx={SELLA[0]} cy={SELLA[1] + 7} rx={8.5} ry={5} fill="#a78bfa" stroke="#4c1d95" strokeWidth={0.8} />
        </Part>

        {/* The inner ear, inside the periotic capsule → petrous part. */}
        {([-1, 1] as const).map((side) => (
          <Part key={side} id="barne-belarria" show={ear}>
            <InnerEar c={side < 0 ? [396, 394] : mx([396, 394])} s={0.9} />
          </Part>
        ))}

        {/* Foramen magnum: a hole in the occipital base as each half ossifies. */}
        {([-1, 1] as const).map((side) => {
          const o = side < 0 ? ossL(PIECE.para) : ossR;
          return o > 0.01 ? <path key={side} d={closed([...fmHalf(side), FM.c])} fill="#0f0b0e" stroke={Q.boneDeep} strokeWidth={1.2} opacity={o} /> : null;
        })}

        {/* Fusion leaves holes; the cranial nerves leave the brain through them. */}
        <Part id="burezurreko-zuloak" show={holes}>
          {([-1, 1] as const).flatMap((side) => [
            ...HOLES.map((h, i) => {
              const p = side < 0 ? h.p : mx(h.p);
              return <ellipse key={`${side}h${i}`} cx={p[0]} cy={p[1]} rx={h.rx} ry={h.ry} transform={`rotate(${side * (h.rot ?? 0)} ${f1(p[0])} ${f1(p[1])})`} fill="#0f0b0e" stroke="#7a6a4a" strokeWidth={1} />;
            }),
            ...CRIBRI.map((p, i) => {
              const q = side < 0 ? p : mx(p);
              return <circle key={`${side}c${i}`} cx={q[0]} cy={q[1]} r={2.2} fill="#0f0b0e" />;
            }),
          ])}
        </Part>
        {ghost > 0.01 && (
          <g opacity={ghost * 0.85}>
            <path d={smoothPath(BRAINSTEM, true, 0.3)} fill="rgba(58,95,217,0.28)" stroke="rgba(120,150,240,0.6)" strokeWidth={1.2} />
            <path d={`M${CX - 30},244L${CX + 30},272M${CX + 30},244L${CX - 30},272`} stroke="rgba(120,150,240,0.5)" strokeWidth={5} strokeLinecap="round" />
          </g>
        )}
        <Part id="nerbio-kranialak" show={ghost}>
          {([-1, 1] as const).flatMap((side) => [
            <ellipse key={`${side}b`} cx={side < 0 ? 488 : 512} cy={164} rx={6.5} ry={lerp(4, 22, nv)} fill={Q.nerve} stroke="#a16207" strokeWidth={1} />,
            ...NERVES.map((n, i) => {
              const a = side < 0 ? n.a : mx(n.a);
              const b = side < 0 ? n.b : mx(n.b);
              return <path key={`${side}n${i}`} d={partial(a, b, side * n.bend, nv)} fill="none" stroke={Q.nerve} strokeWidth={3} strokeLinecap="round" />;
            }),
            <circle key={`${side}g`} cx={side < 0 ? 444 : 556} cy={334} r={6 * nv} fill={Q.nerve} />,
          ])}
        </Part>
        {/* The vault lifted off at the start: we look at the floor from above. */}
        {lift < 0.99 && (
          <g opacity={1 - lift} transform={`translate(${CX},${CY}) scale(${(1 + 0.25 * lift).toFixed(3)}) translate(${-CX},${-CY})`}>
            <path d={closed(OUTER)} fill="#d8ccb0" stroke={Q.boneDeep} strokeWidth={2} />
            <path d={closed(OUTER)} fill="url(#w8-boneshade)" />
            <path d={`M${CX},60L${CX},584M300,250Q${CX},200 700,250M310,470Q${CX},420 690,470`} fill="none" stroke={Q.suture} strokeWidth={4} opacity={0.6} />
          </g>
        )}
      </g>

      {/* Roman numerals of the nerves, on the right half (text above every line). */}
      {nv > 0.5 &&
        [{ p: [CX, 98] as Pt, s: 'I' }, ...NUMERALS].map((n, i) => (
          <text key={i} x={n.p[0]} y={n.p[1]} textAnchor={i === 0 ? 'middle' : 'start'} fontSize={13} fontWeight={700} fill={Q.nerve} stroke="#0f0f11" strokeWidth={3.5} paintOrder="stroke" opacity={seg(nv, 0.5, 1)}>
            {n.s}
          </text>
        ))}
      {push > 0.4 && (
        <g opacity={seg(push, 0.4, 1)} fontSize={12.5} fontWeight={600} stroke="#0f0f11" strokeWidth={3} paintOrder="stroke">
          {[
            { s: 'adenohipofisia (aurrea)', c: '#e879f9', y: 304 },
            { s: 'neurohipofisia (atzea)', c: '#a78bfa', y: 312 },
          ].map((k) => {
            const p = A([CX - 6, k.y]);
            return (
              <g key={k.s}>
                <circle cx={p[0]} cy={p[1]} r={6} fill={k.c} stroke="#0f0f11" strokeWidth={1.5} />
                <text x={p[0] + 12} y={p[1] + 4.5} fill="#fff">
                  {k.s}
                </text>
              </g>
            );
          })}
        </g>
      )}

      <Note x={380} y={48} size={12} show={vis(t, CB_T.para, CB_T.all + 0.03) * (1 - push)}>
        Hezurrak
      </Note>
      <Note x={620} y={48} size={12} show={vis(t, CB_T.para, CB_T.all + 0.03) * (1 - push)}>
        Kartilagoak
      </Note>
      <Note x={500} y={612} tone="accent" show={vis(t, 0, CB_T.scl)}>
        Buru-ganga kenduta: neurokraneoaren zorua (kondrokraneoa) goitik · hezurtzapen endokondrala
      </Note>
      <Note x={500} y={612} tone="accent" show={vis(t, CB_T.scl, CB_T.para)}>
        Erdiko plaka atzetik aurrera: 3 somita okzipitalen esklerotomak (+ 1. lepokoa) eta haien mesenkima
      </Note>
      <Note x={500} y={612} tone="accent" show={vis(t, CB_T.para, CB_T.hyp)}>
        Kartilago parakordalak → okzipitalaren oinaldea, ezkataren (mintzezkoa) jarraipena
      </Note>
      <Note x={500} y={612} tone="accent" show={vis(t, CB_T.hyp, CB_T.trab)}>
        Hipofisi kartilagoak → esfenoidesaren gorputza: haren hipofisi hoditxoan hipofisi guruina
      </Note>
      <Note x={500} y={612} tone="accent" show={vis(t, CB_T.trab, CB_T.peri)}>
        Trenkadatxo kranialak → etmoides hezurra
      </Note>
      <Note x={500} y={612} tone="accent" show={vis(t, CB_T.peri, CB_T.wings)}>
        Alboko plakak · kapsula periotikoa → tenporalaren harkaitza (barneko belarria barruan)
      </Note>
      <Note x={500} y={612} tone="accent" show={vis(t, CB_T.wings, CB_T.all)}>
        Hego tenporala → esfenoidesaren hego handia · begizulo hegoa → hego txikia
      </Note>
      <Note x={500} y={612} tone="accent" show={vis(t, CB_T.all, CB_T.holes)}>
        Oinalde osoa: mesenkima → kartilagoa → hezurra
      </Note>
      <Note x={500} y={612} tone="accent" show={vis(t, CB_T.holes)}>
        Piezak fusionatzean zuloak: 12 bikote nerbio kranial (eta odol hodiak) haietatik
      </Note>

      {/* Left gutter: the bones (left half). */}
      <Label id="etmoidesa" x={190} y={120} ax={L([484, 160])[0]} ay={L([484, 160])[1]} show={ossL(PIECE.trab) * inFrame(L([484, 160]))} />
      <Label id="esfenoidesaren-hego-txikia" x={232} y={180} ax={L([372, 226])[0]} ay={L([372, 226])[1]} show={ossL(PIECE.orb)} />
      <Label id="hipofisi-hobitxoa" x={190} y={236} ax={L([489, 283])[0]} ay={L([489, 283])[1]} show={sella} />
      <Label id="esfenoidesaren-gorputza" x={210} y={270} ax={L([468, 296])[0]} ay={L([468, 296])[1]} show={ossL(PIECE.hyp) * inFrame(L([468, 296]))} />
      <Label id="esfenoidesaren-hego-handia" x={232} y={356} ax={L([372, 318])[0]} ay={L([372, 318])[1]} show={ossL(PIECE.temp)} />
      <Label id="okzipitalaren-oinaldea" x={204} y={404} ax={L([472, 372])[0]} ay={L([472, 372])[1]} show={ossL(PIECE.para) * inFrame(L([472, 372]))} />
      <Label id="harkaitza" x={204} y={452} ax={L([352, 428])[0]} ay={L([352, 428])[1]} show={ossL(PIECE.peri)} />
      <Label id="kondrokraneoa" x={190} y={496} ax={L([338, 470])[0]} ay={L([338, 470])[1]} show={inFrame(L([338, 470]))} />
      <Label id="okzipitalaren-ezkata" x={190} y={540} ax={L([420, 532])[0]} ay={L([420, 532])[1]} show={sq * inFrame(L([420, 532]))} />

      {/* Right gutter: the cartilages (right half). */}
      <Label id="trenkada-kranialak" x={748} y={140} ax={L([514, 180])[0]} ay={L([514, 180])[1]} show={cartK(PIECE.trab) * (1 - ossR) * inFrame(L([514, 180]))} />
      <Label id="nerbio-kranialak" x={780} y={120} ax={L([513, 146])[0]} ay={L([513, 146])[1]} show={vis(t, CB_T.holes + 0.02)} />
      <Label id="burezurreko-zuloak" x={690} y={170} ax={L([509, 172])[0]} ay={L([509, 172])[1]} show={holes} />
      <Label id="begizulo-hegoa" x={810} y={200} ax={L([580, 226])[0]} ay={L([580, 226])[1]} show={cartK(PIECE.orb) * (1 - ossR)} />
      <Label id="hipofisi-guruina" x={810} y={226} ax={L([508, 276])[0]} ay={L([508, 276])[1]} show={vis(t, CB_T.hyp + 0.04)} small />
      {mesAt && <Label id="mesenkima" x={190} y={586} ax={L(mesAt)[0]} ay={L(mesAt)[1]} show={(1 - ossR) * inFrame(L(mesAt))} small />}
      <Label id="hipofisi-kartilagoak" x={800} y={250} ax={L([516, 288])[0]} ay={L([516, 288])[1]} show={cartK(PIECE.hyp) * (1 - ossR) * inFrame(L([516, 288]))} />
      <Label id="hego-tenporala" x={810} y={284} ax={L([596, 300])[0]} ay={L([596, 300])[1]} show={cartK(PIECE.temp) * (1 - ossR)} />
      <Label id="kartilago-parakordalak" x={790} y={356} ax={L([524, 372])[0]} ay={L([524, 372])[1]} show={cartK(PIECE.para) * (1 - ossR) * inFrame(L([524, 372]))} />
      <Label id="barne-belarria" x={810} y={398} ax={L([606, 396])[0]} ay={L([606, 396])[1]} show={ear} />
      <Label id="kapsula-periotikoa" x={810} y={440} ax={L([624, 414])[0]} ay={L([624, 414])[1]} show={cartK(PIECE.peri) * (1 - ossR)} />
      <Label id="esklerotoma-okzipitalak" x={790} y={490} ax={L([534, 484])[0]} ay={L([534, 484])[1]} show={scl * (1 - ossR) * inFrame(L([534, 484]))} />
      <Label id="notokorda" x={810} y={540} ax={L([502, 540])[0]} ay={L([502, 540])[1]} show={vis(t, CB_T.scl, CB_T.all + 0.06) * inFrame(L([502, 540]))} />
    </g>
  );
}
