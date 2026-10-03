'use client';

import { C, lerp, mix, rand, smoothPath, type Pt } from '@/components/kit';

/**
 * Materials for the implantation sections (week 1 day 6 and week 2): a secretory endometrium with
 * stromal cells, corkscrew glands and spiral arteries; syncytium, cytotrophoblast cells, lacunae and
 * vessels with light from the top left. Flat atlas colours (Langman code), depth from gradients and
 * rims only — no filters, so they are cheap to redraw every frame.
 * Ids are prefixed `w2-`; every scene that uses them renders <W2Defs /> once.
 */

const f1 = (v: number) => v.toFixed(1);
const rad = (d: number) => (d * Math.PI) / 180;

export const INK = {
  stromaCell: '#d9909f',
  stromaNucleus: '#9b4560',
  glandWall: '#e993a9',
  glandLumen: '#fff2f5',
  glandNucleus: '#9c3f5b',
  artery: '#c8324c',
  arteryDeep: '#7d1427',
  cytoEdge: '#3f8f59',
  cytoNucleus: '#2c6b43',
  synEdge: '#0d4a32',
  lacuna: '#dff2ec',
  lacunaEdge: '#0f5a3c',
} as const;

export function W2Defs() {
  return (
    <defs>
      {/* Stroma: pale connective tissue, fine fibres, stellate fibroblasts with oval nuclei. */}
      <pattern id="w2-p-stroma" width="64" height="56" patternUnits="userSpaceOnUse">
        <rect width="64" height="56" fill={C.stroma} />
        <g fill="none" stroke="#f8dbe1" strokeWidth="0.9" strokeLinecap="round" opacity="0.9">
          <path d="M0 12 C14 8 22 18 36 14 S56 6 64 10" />
          <path d="M0 40 C10 44 24 36 38 42 S54 48 64 44" />
          <path d="M20 0 C18 12 26 20 22 30" />
        </g>
        <g fill={INK.stromaCell}>
          <path d="M6 22 q5 -4 11 -1 q-5 4 -11 1z" />
          <path d="M40 24 q4 -5 10 -4 q-4 5 -10 4z" />
          <path d="M26 46 q6 -2 10 2 q-6 2 -10 -2z" />
          <path d="M50 4 q4 3 9 1 q-4 -4 -9 -1z" />
        </g>
        <g fill={INK.stromaNucleus} opacity="0.85">
          <ellipse cx="11.5" cy="21.5" rx="2.4" ry="1.3" transform="rotate(-12 11.5 21.5)" />
          <ellipse cx="45" cy="22" rx="2.3" ry="1.3" transform="rotate(-25 45 22)" />
          <ellipse cx="31" cy="46.5" rx="2.4" ry="1.3" transform="rotate(20 31 46.5)" />
          <ellipse cx="54.5" cy="4.5" rx="2.1" ry="1.2" transform="rotate(10 54.5 4.5)" />
        </g>
      </pattern>
      {/* A second, sparser layer at another scale and angle: the tiling disappears. */}
      <pattern id="w2-p-stroma2" width="98" height="84" patternUnits="userSpaceOnUse" patternTransform="rotate(23)">
        <g fill={INK.stromaCell} opacity="0.8">
          <path d="M14 30 q6 -5 13 -2 q-6 5 -13 2z" />
          <path d="M66 62 q5 -6 12 -4 q-5 6 -12 4z" />
        </g>
        <g fill={INK.stromaNucleus} opacity="0.75">
          <ellipse cx="20" cy="29" rx="2.6" ry="1.4" />
          <ellipse cx="72" cy="59.5" rx="2.5" ry="1.4" transform="rotate(-20 72 59.5)" />
        </g>
        <circle cx="46" cy="14" r="1.2" fill="#c9758a" opacity="0.6" />
      </pattern>
      {/* Decidual cells: plump, polyhedral, pale glycogen-filled cytoplasm, round central nuclei; fluid between them. */}
      <pattern id="w2-p-decidua" width="52" height="46" patternUnits="userSpaceOnUse">
        <rect width="52" height="46" fill="#eccbd3" />
        <g fill="#f1c8aa" stroke="#bf7f88" strokeWidth="0.8">
          <path d="M3 5 l10 -3 8 6 -2 10 -10 2 -7 -7z" />
          <path d="M29 2 l11 1 6 9 -5 8 -11 -1 -4 -9z" />
          <path d="M12 25 l10 -1 7 8 -4 9 -10 1 -6 -8z" />
          <path d="M37 26 l9 2 3 9 -6 7 -9 -3 -2 -9z" />
        </g>
        <g fill="#fff7e8" opacity="0.7">
          <circle cx="8" cy="7" r="2" />
          <circle cx="33" cy="6" r="2" />
          <circle cx="16" cy="29" r="2" />
          <circle cx="41" cy="31" r="1.8" />
        </g>
        <g fill="#a35467">
          <circle cx="11.5" cy="10.5" r="2.2" />
          <circle cx="36.5" cy="10.5" r="2.2" />
          <circle cx="19.5" cy="33" r="2.2" />
          <circle cx="42.5" cy="35.5" r="2" />
        </g>
      </pattern>
      {/* Oedema: clear fluid pooling between the stromal cells. */}
      <pattern id="w2-p-oedema" width="58" height="50" patternUnits="userSpaceOnUse" patternTransform="rotate(-11)">
        <g fill="#fff8fa" opacity="0.6">
          <path d="M4 14 q8 -7 17 -2 q3 6 -4 9 q-9 2 -13 -7z" />
          <path d="M34 4 q9 -2 14 4 q-2 7 -10 6 q-6 -3 -4 -10z" />
          <path d="M28 32 q10 -5 18 1 q0 8 -9 9 q-9 -1 -9 -10z" />
          <path d="M2 40 q5 -3 9 1 q-1 5 -6 4z" />
        </g>
      </pattern>
      {/* Light from the top left over the whole specimen. */}
      <linearGradient id="w2-g-light" x1="150" y1="0" x2="850" y2="640" gradientUnits="userSpaceOnUse">
        <stop offset="0" stopColor="#ffffff" stopOpacity="0.16" />
        <stop offset="0.45" stopColor="#ffffff" stopOpacity="0" />
        <stop offset="1" stopColor="#1a0610" stopOpacity="0.2" />
      </linearGradient>
      {/* Syncytiotrophoblast: one dark-green cytoplasm with many nuclei and no cell borders. */}
      <pattern id="w2-p-syn" width="30" height="27" patternUnits="userSpaceOnUse">
        <rect width="30" height="27" fill={C.syncytio} />
        <circle cx="22" cy="20" r="5" fill="#238c5f" opacity="0.5" />
        <g fill={C.syncytioDeep}>
          <ellipse cx="6" cy="6" rx="2.6" ry="2" transform="rotate(20 6 6)" />
          <ellipse cx="19" cy="9" rx="2.5" ry="1.9" transform="rotate(-30 19 9)" />
          <ellipse cx="10" cy="19" rx="2.6" ry="2" />
          <ellipse cx="26" cy="23" rx="2.2" ry="1.7" transform="rotate(40 26 23)" />
        </g>
        <g fill="#5fc08d" opacity="0.55">
          <circle cx="5.4" cy="5.4" r="0.7" />
          <circle cx="18.5" cy="8.4" r="0.7" />
          <circle cx="9.5" cy="18.6" r="0.7" />
        </g>
      </pattern>
      <pattern id="w2-p-syn2" width="47" height="41" patternUnits="userSpaceOnUse" patternTransform="rotate(31)">
        <g fill={C.syncytioDeep} opacity="0.9">
          <ellipse cx="12" cy="30" rx="2.5" ry="1.9" />
          <ellipse cx="36" cy="12" rx="2.4" ry="1.8" transform="rotate(25 36 12)" />
        </g>
      </pattern>
      <radialGradient id="w2-g-sheen" cx="32%" cy="22%" r="85%">
        <stop offset="0" stopColor="#ffffff" stopOpacity="0.2" />
        <stop offset="0.5" stopColor="#ffffff" stopOpacity="0" />
        <stop offset="1" stopColor="#000000" stopOpacity="0.28" />
      </radialGradient>
      <radialGradient id="w2-g-cell" cx="34%" cy="28%" r="80%">
        <stop offset="0" stopColor="#ffffff" stopOpacity="0.42" />
        <stop offset="0.55" stopColor="#ffffff" stopOpacity="0" />
        <stop offset="1" stopColor="#000000" stopOpacity="0.2" />
      </radialGradient>
      {/* Lacuna (clear) and lacuna full of maternal blood: rounded inner wall, dark at the rim. */}
      <radialGradient id="w2-g-lacuna" cx="40%" cy="35%" r="72%">
        <stop offset="0" stopColor="#eef8f5" />
        <stop offset="0.65" stopColor="#c6e5dc" />
        <stop offset="1" stopColor="#86b9aa" />
      </radialGradient>
      <radialGradient id="w2-g-blood" cx="38%" cy="32%" r="72%">
        <stop offset="0" stopColor="#ffffff" stopOpacity="0.28" />
        <stop offset="0.5" stopColor="#ffffff" stopOpacity="0" />
        <stop offset="1" stopColor="#3a0010" stopOpacity="0.45" />
      </radialGradient>
      <pattern id="w2-p-rbc" width="14" height="12" patternUnits="userSpaceOnUse">
        <rect width="14" height="12" fill="#c51d38" />
        <ellipse cx="4" cy="4" rx="2.7" ry="2" fill="#e0475f" />
        <ellipse cx="4" cy="4" rx="1.1" ry="0.8" fill="#a3122a" />
        <ellipse cx="11" cy="9" rx="2.7" ry="2" fill="#e0475f" />
        <ellipse cx="11" cy="9" rx="1.1" ry="0.8" fill="#a3122a" />
      </pattern>
      {/* Soft halo round a nucleus that has just joined the syncytium. */}
      <radialGradient id="w2-g-fused">
        <stop offset="0" stopColor="#c9f7d6" stopOpacity="0.75" />
        <stop offset="1" stopColor="#c9f7d6" stopOpacity="0" />
      </radialGradient>
      {/* Cavities: fluid with a faint inner glow. */}
      <radialGradient id="w2-g-cavity" cx="45%" cy="35%" r="70%">
        <stop offset="0" stopColor="#ffffff" stopOpacity="0.09" />
        <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
      </radialGradient>
      {/* Yolk-sac cavity: an opaque warm amber (a yellow tint over the dark ground would turn olive). */}
      <radialGradient id="w2-g-yolk" cx="44%" cy="34%" r="75%">
        <stop offset="0" stopColor="#7a6427" />
        <stop offset="0.6" stopColor="#544419" />
        <stop offset="1" stopColor="#3a2e12" />
      </radialGradient>
      <radialGradient id="w2-g-amnion" cx="45%" cy="40%" r="70%">
        <stop offset="0" stopColor="#cfe0ff" stopOpacity="0.45" />
        <stop offset="1" stopColor="#5b8def" stopOpacity="0.32" />
      </radialGradient>
      {/* Extra-embryonic mesoderm (salmon): loose stellate mesenchyme. */}
      <pattern id="w2-p-meso" width="34" height="30" patternUnits="userSpaceOnUse">
        <rect width="34" height="30" fill="#f4a989" />
        <g stroke="#d77655" strokeWidth="0.8" fill="none" strokeLinecap="round">
          <path d="M8 8l-6-3M8 8l5-5M8 8l6 4M8 8l-2 7" />
          <path d="M25 20l-6-2M25 20l4-6M25 20l6 3M25 20l-1 7" />
        </g>
        <g fill="#b9573a">
          <ellipse cx="8" cy="8" rx="2.2" ry="1.6" />
          <ellipse cx="25" cy="20" rx="2.2" ry="1.6" transform="rotate(30 25 20)" />
        </g>
      </pattern>
      {/* Chorionic cavity (extra-embryonic coelom): clear fluid, a little lighter at the centre, sparse flecks. */}
      <radialGradient id="w2-g-coelom" cx="500" cy="300" r="240" gradientUnits="userSpaceOnUse">
        <stop offset="0" stopColor="#2b3d5c" />
        <stop offset="0.65" stopColor="#1b2943" />
        <stop offset="1" stopColor="#131d33" />
      </radialGradient>
      <pattern id="w2-p-coelom" width="46" height="40" patternUnits="userSpaceOnUse" patternTransform="rotate(17)">
        <g fill="#cfe0ff" opacity="0.13">
          <circle cx="7" cy="9" r="1.1" />
          <circle cx="31" cy="5" r="0.8" />
          <circle cx="22" cy="27" r="1.3" />
          <circle cx="41" cy="33" r="0.9" />
        </g>
      </pattern>
      <linearGradient id="w2-g-fibrin" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#f6f2e8" />
        <stop offset="1" stopColor="#d8cfba" />
      </linearGradient>
    </defs>
  );
}

/** Sample a polyline with its unit normals. */
function normals(pts: Pt[]) {
  return pts.map((p, i) => {
    const a = pts[Math.max(0, i - 1)];
    const b = pts[Math.min(pts.length - 1, i + 1)];
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const l = Math.hypot(dx, dy) || 1;
    return [-dy / l, dx / l] as Pt;
  });
}
const poly = (pts: Pt[]) => `M${pts.map((p) => `${f1(p[0])},${f1(p[1])}`).join(' L')}`;
const offsetPts = (pts: Pt[], d: number) => {
  const n = normals(pts);
  return pts.map((p, i) => [p[0] + n[i][0] * d, p[1] + n[i][1] * d] as Pt);
};

/**
 * A secretory (progestational) gland: a corkscrew tube from deep in the stroma to its mouth on the
 * surface. `mouth` = opening on the epithelium, `depth` = how far it reaches into the stroma (towards −y),
 * `secretion` 0..1 = glycogen / mucus droplets in the lumen.
 */
export function glandPath(mouth: Pt, depth: number, seed: number, dir: Pt = [0, -1]) {
  const tg: Pt = [-dir[1], dir[0]];
  return Array.from({ length: 40 }, (_, j) => {
    const s = j / 39;
    const r = s * depth;
    // Straight at the mouth for a few cells, then coiling more and more (secretory, "corkscrew" glands).
    const coil = Math.min(1, s / 0.12);
    const zz = Math.sin(s * Math.PI * (6.5 + (seed % 3)) + seed * 1.7) * (6.5 + 6 * s) * coil + Math.sin(s * 9 + seed) * 2.5 * s;
    return [mouth[0] + dir[0] * r + tg[0] * zz, mouth[1] + dir[1] * r + tg[1] * zz] as Pt;
  });
}

export function Gland({ pts, secretion = 0, scale = 1 }: { pts: Pt[]; secretion?: number; scale?: number }) {
  const W = 16 * scale;
  const d = poly(pts);
  const sideA = poly(offsetPts(pts, W * 0.3));
  const sideB = poly(offsetPts(pts, -W * 0.3));
  return (
    <g fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path d={d} stroke="rgba(120,30,55,0.22)" strokeWidth={W + 4} />
      <path d={d} stroke={INK.glandWall} strokeWidth={W} />
      {/* Cell borders across the wall, then a row of basal nuclei on each side. */}
      <path d={d} stroke="#c56a84" strokeWidth={W} strokeDasharray={`${f1(0.9 * scale)} ${f1(5.2 * scale)}`} opacity={0.55} />
      <path d={sideA} stroke={INK.glandNucleus} strokeWidth={2.6 * scale} strokeDasharray={`0.1 ${f1(6.1 * scale)}`} opacity={0.8} />
      <path d={sideB} stroke={INK.glandNucleus} strokeWidth={2.6 * scale} strokeDasharray={`0.1 ${f1(6.1 * scale)}`} opacity={0.8} />
      <path d={d} stroke={INK.glandLumen} strokeWidth={W * 0.3} />
      {secretion > 0.01 && <path d={d} stroke="#fff6dc" strokeWidth={W * 0.26} strokeDasharray={`${f1(2.4 * scale)} ${f1(4.5 * scale)}`} opacity={secretion} />}
      <path d={sideA} stroke="rgba(255,255,255,0.35)" strokeWidth={0.8 * scale} transform={`translate(${f1(-0.6 * scale)} ${f1(-0.6 * scale)})`} />
    </g>
  );
}

/** A spiral artery: a tightly coiled vessel running from the deep endometrium towards the surface. */
export function spiralPath(from: Pt, to: Pt, coils: number, amp: number, seed = 0) {
  const dx = to[0] - from[0];
  const dy = to[1] - from[1];
  const L = Math.hypot(dx, dy) || 1;
  const n: Pt = [-dy / L, dx / L];
  return Array.from({ length: 90 }, (_, j) => {
    const s = j / 89;
    const z = Math.sin(s * Math.PI * 2 * coils + seed) * amp * (0.6 + 0.4 * s);
    const wob = Math.sin(s * 5 + seed) * 4;
    return [from[0] + dx * s + n[0] * (z + wob), from[1] + dy * s + n[1] * (z + wob)] as Pt;
  });
}

export function SpiralArtery({ pts, w = 4.2, opacity = 1 }: { pts: Pt[]; w?: number; opacity?: number }) {
  const d = poly(pts);
  return (
    <g fill="none" strokeLinecap="round" strokeLinejoin="round" opacity={opacity}>
      <path d={d} stroke={INK.arteryDeep} strokeWidth={w + 2.2} opacity={0.7} />
      <path d={d} stroke={INK.artery} strokeWidth={w} />
      <path d={poly(offsetPts(pts, -w * 0.22))} stroke="#f07a8e" strokeWidth={w * 0.3} opacity={0.75} />
    </g>
  );
}

/** A capillary / venule in cross-section: endothelial rim, red cells, light from the top left. */
export function Vessel({ x, y, rx, ry, rot = 0, rim = '#f6c3cd', edge = '#8d1024', opacity = 1 }: { x: number; y: number; rx: number; ry: number; rot?: number; rim?: string; edge?: string; opacity?: number }) {
  const tr = rot ? `rotate(${f1(rot)} ${f1(x)} ${f1(y)})` : undefined;
  return (
    <g transform={tr} opacity={opacity}>
      <ellipse cx={f1(x)} cy={f1(y)} rx={f1(rx + 1.6)} ry={f1(ry + 1.6)} fill={rim} stroke={edge} strokeWidth={0.9} />
      <ellipse cx={f1(x)} cy={f1(y)} rx={f1(rx)} ry={f1(ry)} fill="url(#w2-p-rbc)" />
      <ellipse cx={f1(x)} cy={f1(y)} rx={f1(rx)} ry={f1(ry)} fill="url(#w2-g-blood)" />
    </g>
  );
}

/** A dilated sinusoid (any closed outline): thin endothelium, blood, gloss. */
export function SinusoidShape({ d, rim = '#f3b3c0', opacity = 1 }: { d: string; rim?: string; opacity?: number }) {
  return (
    <g opacity={opacity}>
      <path d={d} fill="url(#w2-p-rbc)" stroke={rim} strokeWidth={2.4} />
      <path d={d} fill="url(#w2-g-blood)" />
      <path d={d} fill="none" stroke="#7d1427" strokeWidth={0.9} />
    </g>
  );
}

/** Syncytiotrophoblast fill for an outline `d` (may carry holes with evenodd). */
export function SynFill({ d, rule = 'evenodd' }: { d: string; rule?: 'evenodd' | 'nonzero' }) {
  return (
    <g fillRule={rule}>
      <path d={d} fill="url(#w2-p-syn)" />
      <path d={d} fill="url(#w2-p-syn2)" />
      <path d={d} fill="url(#w2-g-sheen)" />
      <path d={d} fill="none" stroke={INK.synEdge} strokeWidth={1.5} strokeLinejoin="round" />
    </g>
  );
}

/** Lacuna in the syncytium: clear (day 9) → full of maternal blood (`blood` 0..1, days 11–13). */
export function LacunaFill({ d, blood = 0 }: { d: string; blood?: number }) {
  return (
    <g>
      <path d={d} fill="url(#w2-g-lacuna)" />
      {blood > 0.01 && (
        <g opacity={blood}>
          <path d={d} fill="url(#w2-p-rbc)" />
          <path d={d} fill="url(#w2-g-blood)" />
        </g>
      )}
      <path d={d} fill="none" stroke={mix(INK.lacunaEdge, '#5a0a1a', blood)} strokeWidth={1.1} strokeLinejoin="round" />
    </g>
  );
}

/**
 * A ring of cuboidal cells around a circle (cytotrophoblast): each cell a soft rounded block with
 * nucleus and nucleolus. Cells grow inward from radius r (towards the centre) by `th`.
 */
export function CellRing({
  cx,
  cy,
  r,
  th,
  n,
  color = C.cyto,
  edge = INK.cytoEdge,
  nucleus = INK.cytoNucleus,
  a0 = 0,
  a1 = 360,
  outward = false,
  jitter = 0.12,
  seed = 1,
  divide = 0,
}: {
  cx: number;
  cy: number;
  r: number;
  th: number;
  n: number;
  color?: string;
  edge?: string;
  nucleus?: string;
  a0?: number;
  a1?: number;
  outward?: boolean;
  jitter?: number;
  seed?: number;
  /** 0..1: the ring grows by cell division — each cell splits in two at its own moment (as the shell enlarges). */
  divide?: number;
}) {
  const sgn = outward ? 1 : -1;
  // Cell spans (start, end) in degrees: a cell whose moment has come is drawn as its two daughters.
  const spans: [number, number, number][] = [];
  for (let i = 0; i < n; i++) {
    const u0 = a0 + ((a1 - a0) * i) / n;
    const u1 = a0 + ((a1 - a0) * (i + 1)) / n;
    if (divide > 0.02 + 0.96 * rand(seed + i * 5.1)) {
      const um = (u0 + u1) / 2;
      spans.push([u0, um, i * 2 + 1000], [um, u1, i * 2 + 1001]);
    } else spans.push([u0, u1, i]);
  }
  const cells = [];
  for (const [u0, u1, i] of spans) {
    const um = (u0 + u1) / 2;
    const tk = th * (1 + jitter * (rand(seed + i * 3.7) - 0.5) * 2);
    const ri = r + sgn * tk;
    const at = (a: number, rr: number): Pt => [cx + rr * Math.cos(rad(a)), cy + rr * Math.sin(rad(a))];
    const p0 = at(u0, r);
    const p1 = at(u1, r);
    const q1 = at(u1, ri);
    const q0 = at(u0, ri);
    const rm = (r + ri) / 2;
    const bulge = at(um, ri + sgn * tk * 0.12);
    const d = `M${f1(p0[0])},${f1(p0[1])} A${f1(r)} ${f1(r)} 0 0 ${a1 > a0 ? 1 : 0} ${f1(p1[0])},${f1(p1[1])} L${f1(q1[0])},${f1(q1[1])} Q${f1(bulge[0])},${f1(bulge[1])} ${f1(q0[0])},${f1(q0[1])}Z`;
    const nc = at(um + (rand(seed + i) - 0.5) * (u1 - u0) * 0.3, rm);
    const nr = Math.min(tk * 0.27, (Math.abs(u1 - u0) * Math.PI * r) / 180 * 0.24);
    cells.push(
      <g key={i}>
        <path d={d} fill={color} stroke={edge} strokeWidth={0.8} strokeLinejoin="round" />
        <path d={d} fill="url(#w2-g-cell)" />
        <ellipse cx={f1(nc[0])} cy={f1(nc[1])} rx={f1(nr * 1.15)} ry={f1(nr * 0.9)} transform={`rotate(${f1(um + 90)} ${f1(nc[0])} ${f1(nc[1])})`} fill={nucleus} opacity={0.75} />
        <circle cx={f1(nc[0] - nr * 0.2)} cy={f1(nc[1] - nr * 0.2)} r={f1(nr * 0.28)} fill="#0f2a1a" opacity={0.6} />
      </g>,
    );
  }
  return <g>{cells}</g>;
}

/** Cell boundary of an Epithelium(x0, x1, w) nearest to x: where something can wedge between two cells. */
export function epiBoundary(x: number, x0: number, x1: number, w: number) {
  const cw = (x1 - x0) / Math.max(1, Math.round((x1 - x0) / w));
  return x0 + Math.round((x - x0) / cw) * cw;
}

/**
 * Columnar surface epithelium along y = `y` between x0 and x1, cells pushed apart around `gaps`
 * (each gap: centre x, half-width) as when something wedges between them. Apical side faces +y (lumen).
 */
export function Epithelium({
  x0,
  x1,
  y: y0,
  th = 16,
  w = 15,
  gaps = [],
  color = C.epithelium,
  dy,
}: {
  x0: number;
  x1: number;
  y: number;
  th?: number;
  w?: number;
  gaps?: [number, number][];
  color?: string;
  /** Optional surface offset at x (a bulging implantation site). */
  dy?: (x: number) => number;
}) {
  const n = Math.max(1, Math.round((x1 - x0) / w));
  const cw = (x1 - x0) / n;
  // Each gap opens at the cell boundary nearest to it, so two neighbours part (no cell is stretched).
  const snapped = gaps.map(([gx, hw]) => [x0 + Math.round((gx - x0) / cw) * cw, hw] as const);
  // Displacement of a cell edge at x for a cell whose middle is at m: away from each gap, fading with distance.
  const push = (x: number, m: number) =>
    snapped.reduce((acc, [gx, hw]) => (hw <= 0.05 ? acc : acc + Math.sign(m - gx) * hw * Math.exp(-Math.abs(x - gx) / (w * 1.6))), 0);
  const cells = [];
  for (let i = 0; i < n; i++) {
    const xa = x0 + cw * i;
    const xb = x0 + cw * (i + 1);
    const m = (xa + xb) / 2;
    // Base (stroma side, y - th) moves less than the apex: the cells tilt away from the wedge.
    const pa = push(xa, m);
    const pb = push(xb, m);
    const ba = xa + pa * 0.7;
    const bb = xb + pb * 0.7;
    const ta = xa + pa;
    const tb = xb + pb;
    if (tb - ta < 1.2 && bb - ba < 1.2) continue;
    const y = y0 + (dy ? dy(m) : 0);
    const top = y - th;
    const d = `M${f1(ba)},${f1(top)} L${f1(bb)},${f1(top)} L${f1(tb - 0.6)},${f1(y - 2)} Q${f1((ta + tb) / 2)},${f1(y + 2.2)} ${f1(ta + 0.6)},${f1(y - 2)}Z`;
    const nx = lerp((ba + bb) / 2, (ta + tb) / 2, 0.35);
    const ny = top + th * 0.36;
    const wid = Math.max(0.5, (tb - ta + bb - ba) / 2);
    cells.push(
      <g key={i}>
        <path d={d} fill={color} stroke="rgba(110,30,55,0.55)" strokeWidth={0.8} strokeLinejoin="round" />
        <path d={d} fill="url(#w2-g-cell)" opacity={0.7} />
        <ellipse cx={f1(nx)} cy={f1(ny)} rx={f1(Math.min(wid * 0.24, 3.2))} ry={f1(th * 0.2)} fill="#8f3553" opacity={0.75} />
        <circle cx={f1(nx)} cy={f1(ny - th * 0.05)} r={0.7} fill="#3d0f1f" opacity={0.7} />
      </g>,
    );
  }
  return (
    <g>
      {cells}
      {/* Microvilli: a fine brush border on the apical (lumen) side. */}
      <path
        d={dy ? `M${Array.from({ length: Math.ceil((x1 - x0) / 10) + 1 }, (_, i) => { const x = Math.min(x1, x0 + i * 10); return `${f1(x)},${f1(y0 + dy(x) + 1.2)}`; }).join(' L')}` : `M${x0},${y0 + 1.2} L${x1},${y0 + 1.2}`}
        fill="none"
        stroke="#ffd3df"
        strokeWidth={1.4}
        strokeDasharray="0.8 1.6"
        opacity={0.6}
      />
    </g>
  );
}

/** Organic, lumpy invasive front: a smooth function of the angle (degrees) with no regular period. */
export function lumps(a: number, seed = 0) {
  const t = rad(a);
  return (
    1 +
    0.13 * Math.sin(3 * t + 1.3 + seed) +
    0.1 * Math.sin(7 * t + 0.4 + seed * 1.7) +
    0.07 * Math.sin(11 * t + 2.1 + seed * 0.6) +
    0.05 * Math.sin(17 * t + 0.9 + seed * 2.3)
  );
}

/** Closed smooth outline through radial samples r(a) around (cx, cy). */
export function radialPath(cx: number, cy: number, r: (a: number) => number, step = 4) {
  const pts: Pt[] = [];
  for (let a = 0; a < 360; a += step) pts.push([cx + r(a) * Math.cos(rad(a)), cy + r(a) * Math.sin(rad(a))]);
  return smoothPath(pts, true);
}
