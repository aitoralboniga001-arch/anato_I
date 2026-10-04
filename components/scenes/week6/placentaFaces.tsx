'use client';

import { Part, lerp, polyline, rand, smoothPath, type Pt } from '@/components/kit';
import { FA, FV } from './placentaSection';

/**
 * The term placenta seen whole (Langman fig. 8-14): a disc 15–20 cm across and 3–4 cm thick (thinner at
 * the rim), drawn in three-quarter view at those proportions.
 * - Fetal face: the chorionic plate under the shiny amnion, the cord inserted a little off-centre, and
 *   the chorionic vessels branching out from it (arteries blue-violet over the red veins).
 * - Maternal face: 18 cotyledons (16–20 in the notes) bulging between grooves, under a thin layer of
 *   basal decidua; at one spot the decidua has come away.
 */

const f1 = (v: number) => v.toFixed(1);

export const RX = 136;
export const RY = 80;
/** Rim thickness in the drawing (the disc is thicker in the middle, 3–4 cm; see the profile). */
export const TH = 24;

/** Maternal-face lobes (cotyledons): Voronoi cells of 18 jittered seeds, clipped to the unit disc. */
export const LOBES: Pt[][] = (() => {
  const seeds: Pt[] = [[0.02, -0.03]];
  const ring = (r: number, n: number, off: number, key: number) => {
    for (let i = 0; i < n; i++) {
      const a = ((i + off + (rand(key + i) - 0.5) * 0.5) / n) * Math.PI * 2;
      const rr = r + (rand(key + 50 + i) - 0.5) * 0.12;
      seeds.push([Math.cos(a) * rr, Math.sin(a) * rr]);
    }
  };
  ring(0.43, 6, 0.1, 10);
  ring(0.8, 11, 0.4, 30);
  const disc: Pt[] = Array.from({ length: 48 }, (_, i) => [Math.cos((i / 48) * Math.PI * 2) * 0.98, Math.sin((i / 48) * Math.PI * 2) * 0.98]);
  const clip = (poly: Pt[], p: Pt, q: Pt): Pt[] => {
    const nx = q[0] - p[0];
    const ny = q[1] - p[1];
    const c = (q[0] * q[0] + q[1] * q[1] - p[0] * p[0] - p[1] * p[1]) / 2;
    const inside = (v: Pt) => v[0] * nx + v[1] * ny <= c;
    const res: Pt[] = [];
    poly.forEach((cur, i) => {
      const prev = poly[(i + poly.length - 1) % poly.length];
      const ci = inside(cur);
      const pi = inside(prev);
      if (ci !== pi) {
        const dp = prev[0] * nx + prev[1] * ny - c;
        const dc = cur[0] * nx + cur[1] * ny - c;
        const u = dp / (dp - dc);
        res.push([lerp(prev[0], cur[0], u), lerp(prev[1], cur[1], u)]);
      }
      if (ci) res.push(cur);
    });
    return res;
  };
  return seeds.map((p) => seeds.reduce((poly, q) => (q === p ? poly : clip(poly, p, q)), disc));
})();

const centroid = (pts: Pt[]): Pt => [pts.reduce((s, p) => s + p[0], 0) / pts.length, pts.reduce((s, p) => s + p[1], 0) / pts.length];
const inset = (pts: Pt[], k: number): Pt[] => {
  const [cx, cy] = centroid(pts);
  return pts.map(([x, y]) => [cx + (x - cx) * k, cy + (y - cy) * k]);
};

/** Disc coordinates (unit circle) → the drawing, with the disc's own size. */
const toDisc = (cx: number, cy: number, rx = RX, ry = RY) => (p: Pt): Pt => [cx + p[0] * rx, cy + p[1] * ry];

/** The rim: the visible lower half of the disc's edge, `th` thick. */
const rimD = (cx: number, cy: number, th: number, rx = RX, ry = RY) => `M${cx - rx},${cy} A${rx} ${ry} 0 0 0 ${cx + rx},${cy} L${cx + rx},${cy + th} A${rx} ${ry} 0 0 1 ${cx - rx},${cy + th} Z`;

/** The cord insertion: a little off-centre, as is usual. */
export const INS: Pt = [-0.14, -0.1];

/** Chorionic vessels: trunks radiating from the insertion, each forking twice, in disc coordinates. */
type VSeg = { a: Pt; b: Pt; lvl: number };
const VTREE: VSeg[] = (() => {
  const out: VSeg[] = [];
  const grow = (from: Pt, ang: number, len: number, lvl: number, key: number) => {
    const n = 3;
    let p = from;
    let a = ang;
    for (let i = 0; i < n; i++) {
      a += (rand(key * 7 + i) - 0.5) * 0.5;
      const q: Pt = [p[0] + Math.cos(a) * (len / n), p[1] + Math.sin(a) * (len / n)];
      // keep inside the disc
      const r = Math.hypot(q[0], q[1]);
      const qq: Pt = r > 0.9 ? [(q[0] / r) * 0.9, (q[1] / r) * 0.9] : q;
      out.push({ a: p, b: qq, lvl });
      p = qq;
    }
    if (lvl < 2) {
      grow(p, a - 0.5, len * 0.55, lvl + 1, key * 3 + 1);
      grow(p, a + 0.5, len * 0.55, lvl + 1, key * 3 + 2);
    }
  };
  const N = 6;
  for (let i = 0; i < N; i++) {
    const a = (i / N) * Math.PI * 2 + 0.4 + (rand(i + 9) - 0.5) * 0.4;
    // Trunks towards the far rim are longer (the insertion is off-centre).
    const dx = Math.cos(a);
    const dy = Math.sin(a);
    const reach = 0.5 + 0.18 * (dx * -INS[0] + dy * -INS[1]) / 0.17;
    grow(INS, a, Math.max(0.36, reach), 0, i + 1);
  }
  return out;
})();

/** The cord rising from the insertion: a twisted rope (Wharton's jelly) with two arteries and a vein coiling round each other. */
function CordUp({ base, t, h = 170 }: { base: Pt; t: number; h?: number }) {
  const sway = Math.sin(t * 30) * 5;
  const keys: Pt[] = [base, [base[0] + 16, base[1] - h * 0.28], [base[0] - 12 + sway, base[1] - h * 0.56], [base[0] + 22 + sway, base[1] - h * 0.82], [base[0] + 6 + sway, base[1] - h]];
  const c = polyline(smoothSamples(keys));
  const w = 10;
  const N = 90;
  const side = (s: number) => Array.from({ length: N + 1 }, (_, i) => {
    const q = c(i / N);
    return [q.x + q.nx * w * s, q.y + q.ny * w * s] as Pt;
  });
  const body = `${smoothPath(side(1), false)} L${f1(side(-1)[N][0])},${f1(side(-1)[N][1])} ${smoothPath([...side(-1)].reverse(), false).replace(/^M/, 'L')} Z`;
  const helix = (ph: number, k: number) =>
    smoothPath(
      Array.from({ length: N + 1 }, (_, i) => {
        const u = i / N;
        const q = c(u);
        const o = w * k * Math.sin(u * Math.PI * 2 * 5 + ph);
        return [q.x + q.nx * o, q.y + q.ny * o] as Pt;
      }),
      false,
    );
  return (
    <g>
      <path d={body} fill="#5c2a3a" transform="translate(2 3)" opacity={0.5} />
      <path d={body} fill="#efe3c4" />
      <path d={helix(Math.PI, 0.35)} fill="none" stroke={FV} strokeWidth={4.2} strokeLinecap="round" opacity={0.9} />
      <path d={helix(0, 0.55)} fill="none" stroke={FA} strokeWidth={2.8} strokeLinecap="round" opacity={0.9} />
      <path d={helix(Math.PI * 0.5, 0.55)} fill="none" stroke={FA} strokeWidth={2.8} strokeLinecap="round" opacity={0.8} />
      <path d={body} fill="#fff" opacity={0.12} />
      <path d={body} fill="none" stroke="#9fc3e6" strokeWidth={1.2} />
    </g>
  );
}

function smoothSamples(keys: Pt[], per = 12): Pt[] {
  const out: Pt[] = [];
  const get = (i: number) => keys[Math.max(0, Math.min(keys.length - 1, i))];
  for (let i = 0; i < keys.length - 1; i++) {
    const [p0, p1, p2, p3] = [get(i - 1), get(i), get(i + 1), get(i + 2)];
    for (let j = 0; j < per; j++) {
      const u = j / per;
      const cr = (a: number, b: number, c: number, d: number) => 0.5 * (2 * b + (-a + c) * u + (2 * a - 5 * b + 4 * c - d) * u * u + (-a + 3 * b - 3 * c + d) * u * u * u);
      out.push([cr(p0[0], p1[0], p2[0], p3[0]), cr(p0[1], p1[1], p2[1], p3[1])]);
    }
  }
  out.push(keys[keys.length - 1]);
  return out;
}

/** Gradients for the two faces (ids per instance). */
export function FaceDefs({ uid }: { uid: string }) {
  return (
    <defs>
      <radialGradient id={`${uid}-fetal`} cx="0.42" cy="0.36" r="0.72">
        <stop offset="0" stopColor="#dc93a8" />
        <stop offset="0.6" stopColor="#ad5068" />
        <stop offset="1" stopColor="#7b2a42" />
      </radialGradient>
      <linearGradient id={`${uid}-amn`} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#e8f2ff" stopOpacity="0.34" />
        <stop offset="0.45" stopColor="#e8f2ff" stopOpacity="0.06" />
        <stop offset="1" stopColor="#e8f2ff" stopOpacity="0" />
      </linearGradient>
      <linearGradient id={`${uid}-rim`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#8a2c44" />
        <stop offset="1" stopColor="#4a1222" />
      </linearGradient>
      <radialGradient id={`${uid}-lobe`} cx="0.4" cy="0.35" r="0.75">
        <stop offset="0" stopColor="#c24f66" />
        <stop offset="0.65" stopColor="#962a42" />
        <stop offset="1" stopColor="#6e1a2e" />
      </radialGradient>
      <radialGradient id={`${uid}-torn`} cx="0.4" cy="0.35" r="0.75">
        <stop offset="0" stopColor="#ef7d92" />
        <stop offset="1" stopColor="#c0405a" />
      </radialGradient>
      <pattern id={`${uid}-spongy`} width="9" height="8" patternUnits="userSpaceOnUse">
        <circle cx="2" cy="2" r="0.9" fill="#4a0f20" opacity="0.5" />
        <circle cx="6.5" cy="5.5" r="0.8" fill="#4a0f20" opacity="0.45" />
        <circle cx="5" cy="1.5" r="0.5" fill="#ffd0da" opacity="0.25" />
      </pattern>
    </defs>
  );
}

/** Torn membranes (amnion + chorion leuna) round the edge. */
function Frill({ cx, cy }: { cx: number; cy: number }) {
  const m = toDisc(cx, cy);
  const frill: Pt[] = Array.from({ length: 44 }, (_, i) => {
    const a = (i / 44) * Math.PI * 2;
    const r = 1.07 + (i % 2 ? 0.06 : 0) + rand(i + 3) * 0.05;
    return m([Math.cos(a) * r, Math.sin(a) * r]);
  });
  return <path d={smoothPath(frill, true, 0.3)} fill="#d9c7cf" opacity={0.38} stroke="rgba(255,255,255,0.3)" strokeWidth={1} />;
}

export function FetalFace({ cx, cy, t, uid }: { cx: number; cy: number; t: number; uid: string }) {
  const m = toDisc(cx, cy);
  const ins = m(INS);
  const lw = [4.6, 3, 1.8];
  const aw = [3.2, 2.1, 1.3];
  return (
    <g>
      <ellipse cx={cx + 6} cy={cy + TH + 14} rx={RX * 1.02} ry={RY * 0.62} fill="#000" opacity={0.35} />
      <Part id="amniosa">
        <Frill cx={cx} cy={cy} />
      </Part>
      <path d={rimD(cx, cy, TH)} fill={`url(#${uid}-rim)`} />
      <path d={rimD(cx, cy, TH)} fill="none" stroke="#2c0a12" strokeWidth={1} />
      <Part id="korion-plaka">
        <ellipse cx={cx} cy={cy} rx={RX} ry={RY} fill={`url(#${uid}-fetal)`} stroke="#4a1022" strokeWidth={1.2} />
      </Part>
      <Part id="korioneko-odol-hodiak">
        {/* veins (red) under, arteries (blue-violet) crossing over them */}
        {[0, 1, 2].map((lvl) => (
          <path key={`v${lvl}`} d={VTREE.filter((s) => s.lvl === lvl).map((s) => `M${f1(m(s.a)[0])},${f1(m(s.a)[1])}L${f1(m(s.b)[0])},${f1(m(s.b)[1])}`).join('')} stroke="#7a1a2c" strokeWidth={lw[lvl] + 1.4} strokeLinecap="round" fill="none" />
        ))}
        {[0, 1, 2].map((lvl) => (
          <path key={`vv${lvl}`} d={VTREE.filter((s) => s.lvl === lvl).map((s) => `M${f1(m(s.a)[0])},${f1(m(s.a)[1])}L${f1(m(s.b)[0])},${f1(m(s.b)[1])}`).join('')} stroke={FV} strokeWidth={lw[lvl]} strokeLinecap="round" fill="none" />
        ))}
        {[0, 1, 2].map((lvl) => (
          <path key={`a${lvl}`} d={VTREE.filter((s) => s.lvl === lvl).map((s) => `M${f1(m(s.a)[0] + 2)},${f1(m(s.a)[1] - 1.6)}L${f1(m(s.b)[0] + 2)},${f1(m(s.b)[1] - 1.6)}`).join('')} stroke={FA} strokeWidth={aw[lvl]} strokeLinecap="round" fill="none" />
        ))}
      </Part>
      {/* the shiny amnion over the whole fetal face */}
      <ellipse cx={cx} cy={cy} rx={RX} ry={RY} fill={`url(#${uid}-amn)`} pointerEvents="none" />
      <ellipse cx={cx - RX * 0.32} cy={cy - RY * 0.42} rx={RX * 0.34} ry={RY * 0.14} fill="#fff" opacity={0.12} pointerEvents="none" />
      <Part id="zilborrestea">
        <CordUp base={ins} t={t} />
      </Part>
    </g>
  );
}

export function MaternalFace({ cx, cy, uid }: { cx: number; cy: number; uid: string }) {
  const m = toDisc(cx, cy);
  const torn = 3;
  return (
    <g>
      <ellipse cx={cx + 6} cy={cy + TH + 14} rx={RX * 1.02} ry={RY * 0.62} fill="#000" opacity={0.35} />
      <Frill cx={cx} cy={cy} />
      <path d={rimD(cx, cy, TH)} fill={`url(#${uid}-rim)`} />
      <path d={rimD(cx, cy, TH)} fill="none" stroke="#2c0a12" strokeWidth={1} />
      <Part id="dezidua-basala">
        {/* grooves between the cotyledons are where the decidual septa were */}
        <ellipse cx={cx} cy={cy} rx={RX} ry={RY} fill="#3a0d18" stroke="#2c0a12" strokeWidth={1.2} />
      </Part>
      <Part id="kotiledoiak">
        {LOBES.map((l, i) => (
          <g key={i}>
            <path d={smoothPath(inset(l, 0.9).map(m), true, 0.3)} fill={i === torn ? `url(#${uid}-torn)` : `url(#${uid}-lobe)`} />
            <path d={smoothPath(inset(l, 0.9).map(m), true, 0.3)} fill={`url(#${uid}-spongy)`} />
          </g>
        ))}
      </Part>
      <Part id="dezidua-basala">
        {/* the thin greyish layer of basal decidua over them (missing over one cotyledon) */}
        {LOBES.map((l, i) => (i === torn ? null : <path key={i} d={smoothPath(inset(l, 0.9).map(m), true, 0.3)} fill="#e9d6dc" opacity={0.13} stroke="#f1c6cf" strokeOpacity={0.25} strokeWidth={0.8} />))}
      </Part>
      <ellipse cx={cx - RX * 0.3} cy={cy - RY * 0.4} rx={RX * 0.36} ry={RY * 0.14} fill="#fff" opacity={0.08} pointerEvents="none" />
    </g>
  );
}

/** A lobe centre on a maternal face. */
export const lobeAt = (cx: number, cy: number, i: number): Pt => toDisc(cx, cy)(centroid(LOBES[i]));

/** A small maternal face (for the cotyledon view): 18 lobes. */
export function MiniMaternal({ cx, cy, rx, ry, uid }: { cx: number; cy: number; rx: number; ry: number; uid: string }) {
  const m = toDisc(cx, cy, rx, ry);
  return (
    <g>
      <path d={rimD(cx, cy, ry * 0.3, rx, ry)} fill={`url(#${uid}-rim)`} />
      <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill="#3a0d18" />
      {LOBES.map((l, i) => (
        <path key={i} d={smoothPath(inset(l, 0.88).map(m), true, 0.3)} fill={`url(#${uid}-lobe)`} />
      ))}
    </g>
  );
}

/** Side profile of the disc: thicker in the middle (3–4 cm) than at the rim. */
export function Profile({ cx, cy, w, th }: { cx: number; cy: number; w: number; th: number }) {
  const top = `M${cx - w / 2},${cy} C${cx - w * 0.3},${cy - th * 0.62} ${cx + w * 0.3},${cy - th * 0.62} ${cx + w / 2},${cy}`;
  const bot = `C${cx + w * 0.3},${cy + th * 0.62} ${cx - w * 0.3},${cy + th * 0.62} ${cx - w / 2},${cy}`;
  return (
    <g>
      <path d={`${top} ${bot} Z`} fill="#962a42" stroke="#4a1022" strokeWidth={1.2} />
      {/* fetal face (chorionic plate) on top, maternal face (cotyledons) below */}
      <path d={top} fill="none" stroke="#d27d95" strokeWidth={3} />
      <path d={`M${cx + w / 2},${cy} ${bot}`} fill="none" stroke="#6e1a2e" strokeWidth={3} />
    </g>
  );
}
