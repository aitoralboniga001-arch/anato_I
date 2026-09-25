'use client';

import { Label, Note, Part, ellipsePts, lerp, seg, smoothPath, type Pt, type SceneProps } from '@/components/kit';
import { AgeHud, SKIN, SkinDefs, atDay, limbGeom, polar, ramp, sampleSpine, spineAt, trunkPath, win, type LimbPose, type Num } from './skin';

/**
 * Topic 5 — the embryo seen from its left side between days 28 and 56 (course figures:
 * 28., 32., 42., 48. and 56. eguna). One parametric body is interpolated between keyframes,
 * so every change (head growth, face, limb segmentation) is a continuous morph.
 * Face to the left (ventral), back to the right (dorsal).
 */

type V = readonly number[];
interface Body {
  [k: string]: Num;
  belly: V;
  spine: readonly V[];
  thick: V;
  cran: V;
  face: V;
  heart: V;
  liver: V;
  arch: V;
  cord: V;
  arm: V;
  leg: V;
  eye: V;
  ear: V;
  nose: V;
  mouth: V;
  somites: V;
}

const K: { day: number; s: Body }[] = [
  {
    day: 28,
    s: {
      belly: [570, 380, 120, 130],
      spine: [[540, 136], [662, 166], [722, 268], [727, 380], [690, 480], [612, 548], [500, 566], [404, 470]],
      thick: [118, 162, 182, 172, 146, 104, 56, 4],
      cran: [452, 176, 110, 100, -12],
      face: [398, 262, 56, 48, 30],
      heart: [470, 346, 60, 66],
      liver: [478, 420, 0, 0],
      arch: [498, 250, 1],
      cord: [446, 424, 196, 56, 23],
      arm: [652, 336, 122, 150, 170, 150, 0.75, 44],
      leg: [468, 512, 205, 150, 180, 120, 0.25, 36],
      eye: [432, 214],
      ear: [548, 196],
      nose: [388, 262],
      mouth: [372, 300],
      somites: [28, 1],
    },
  },
  {
    day: 32,
    s: {
      belly: [568, 382, 122, 130],
      spine: [[540, 134], [666, 164], [726, 268], [728, 382], [688, 482], [606, 548], [486, 560], [398, 452]],
      thick: [120, 164, 184, 172, 146, 104, 54, 3],
      cran: [450, 174, 116, 106, -12],
      face: [394, 264, 58, 50, 30],
      heart: [466, 350, 62, 68],
      liver: [478, 424, 0, 0],
      arch: [498, 252, 1],
      cord: [444, 428, 196, 56, 23],
      arm: [652, 336, 122, 150, 170, 150, 1.1, 46],
      leg: [470, 510, 205, 150, 180, 120, 0.9, 40],
      eye: [428, 216],
      ear: [546, 196],
      nose: [384, 264],
      mouth: [370, 302],
      somites: [34, 1],
    },
  },
  {
    day: 42,
    s: {
      belly: [570, 390, 115, 125],
      spine: [[552, 146], [676, 178], [722, 285], [718, 392], [676, 480], [600, 532], [522, 540], [476, 508]],
      thick: [122, 166, 184, 170, 140, 98, 52, 3],
      cran: [440, 186, 140, 126, -6],
      face: [392, 276, 60, 50, 20],
      heart: [452, 372, 60, 62],
      liver: [480, 438, 44, 40],
      arch: [500, 262, 0.25],
      cord: [468, 468, 200, 58, 24],
      arm: [620, 344, 140, 165, 180, 120, 2.25, 46],
      leg: [556, 500, 188, 165, 185, 105, 1.9, 44],
      eye: [398, 244],
      ear: [506, 262],
      nose: [356, 284],
      mouth: [356, 318],
      somites: [36, 0.2],
    },
  },
  {
    day: 48,
    s: {
      belly: [565, 395, 105, 120],
      spine: [[552, 158], [664, 196], [700, 296], [694, 396], [658, 480], [594, 532], [528, 546], [496, 528]],
      thick: [120, 150, 170, 160, 134, 98, 52, 3],
      cran: [430, 184, 146, 136, -2],
      face: [386, 282, 56, 52, 10],
      heart: [454, 376, 52, 55],
      liver: [474, 446, 56, 48],
      arch: [500, 262, 0],
      cord: [468, 476, 202, 58, 24],
      arm: [594, 330, 120, 172, 182, 150, 3.25, 40],
      leg: [566, 494, 172, 125, 182, 130, 2.9, 40],
      eye: [394, 250],
      ear: [500, 250],
      nose: [350, 290],
      mouth: [360, 318],
      somites: [36, 0],
    },
  },
  {
    day: 56,
    s: {
      belly: [560, 400, 100, 115],
      spine: [[548, 162], [650, 206], [680, 306], [675, 406], [640, 490], [580, 540], [522, 552], [504, 544]],
      thick: [116, 146, 160, 150, 124, 90, 44, 3],
      cran: [420, 182, 150, 142, 0],
      face: [386, 288, 52, 52, 0],
      heart: [460, 380, 40, 44],
      liver: [470, 442, 56, 50],
      arch: [500, 262, 0],
      cord: [470, 482, 205, 58, 24],
      arm: [586, 322, 104, 186, 192, 185, 4, 34],
      leg: [574, 490, 168, 100, 186, 165, 3.9, 36],
      eye: [386, 258],
      ear: [494, 246],
      nose: [352, 292],
      mouth: [366, 318],
      somites: [36, 0],
    },
  },
  // ---- Fetal period (drawn at a normalised size; scenes scale it by the table's length). ----
  {
    day: 84,
    s: {
      belly: [575, 430, 110, 130],
      spine: [[540, 176], [640, 228], [690, 330], [695, 440], [665, 530], [600, 580], [540, 590], [522, 585]],
      thick: [110, 150, 170, 165, 140, 100, 50, 3],
      cran: [430, 172, 128, 122, 0],
      face: [392, 262, 46, 46, 0],
      heart: [470, 380, 30, 34],
      liver: [480, 452, 55, 55],
      arch: [500, 262, 0],
      cord: [482, 505, 205, 62, 22],
      arm: [592, 318, 100, 196, 206, 200, 4, 36],
      leg: [592, 522, 170, 100, 190, 200, 4, 42],
      eye: [390, 234],
      ear: [498, 224],
      nose: [358, 266],
      mouth: [370, 292],
      somites: [36, 0],
    },
  },
  {
    day: 140,
    s: {
      belly: [590, 440, 120, 140],
      spine: [[545, 172], [650, 222], [705, 330], [715, 450], [690, 560], [630, 615], [565, 625], [545, 620]],
      thick: [105, 150, 175, 175, 150, 110, 55, 3],
      cran: [440, 160, 112, 108, 0],
      face: [405, 236, 40, 40, 0],
      heart: [480, 370, 25, 25],
      liver: [490, 440, 50, 50],
      arch: [500, 262, 0],
      cord: [492, 525, 205, 66, 22],
      arm: [600, 300, 100, 198, 210, 215, 4, 38],
      leg: [610, 545, 172, 96, 190, 215, 4, 44],
      eye: [404, 210],
      ear: [506, 200],
      nose: [372, 243],
      mouth: [383, 266],
      somites: [36, 0],
    },
  },
  {
    day: 196,
    s: {
      belly: [595, 445, 122, 145],
      spine: [[542, 168], [655, 214], [718, 322], [732, 450], [708, 568], [642, 628], [572, 638], [552, 633]],
      thick: [106, 152, 178, 180, 156, 114, 56, 3],
      cran: [440, 154, 104, 101, 0],
      face: [407, 226, 38, 38, 0],
      heart: [480, 362, 22, 22],
      liver: [490, 432, 44, 44],
      arch: [500, 262, 0],
      cord: [498, 530, 205, 66, 23],
      arm: [604, 296, 100, 200, 210, 222, 4, 40],
      leg: [616, 555, 174, 95, 190, 225, 4, 47],
      eye: [407, 201],
      ear: [506, 188],
      nose: [377, 232],
      mouth: [387, 254],
      somites: [36, 0],
    },
  },
  {
    day: 266,
    s: {
      belly: [602, 450, 142, 162],
      spine: [[540, 165], [658, 208], [724, 320], [742, 452], [716, 574], [648, 634], [576, 644], [556, 640]],
      thick: [112, 168, 200, 205, 184, 134, 62, 3],
      cran: [440, 150, 100, 98, 0],
      face: [408, 222, 38, 38, 0],
      heart: [480, 360, 20, 20],
      liver: [490, 430, 40, 40],
      arch: [500, 262, 0],
      cord: [502, 534, 205, 66, 25],
      arm: [606, 294, 100, 200, 210, 226, 4, 50],
      leg: [620, 562, 175, 95, 190, 232, 4, 60],
      eye: [408, 198],
      ear: [505, 185],
      nose: [378, 228],
      mouth: [388, 250],
      somites: [36, 0],
    },
  },
];

const pose = (v: readonly number[], toes = false): LimbPose => ({ root: [v[0], v[1]], a: [v[2], v[3], v[4]], len: v[5], dev: v[6], w: v[7], toes });

const ell = (e: readonly number[]) => <ellipse cx={e[0]} cy={e[1]} rx={Math.max(0.1, e[2])} ry={Math.max(0.1, e[3])} transform={e[4] ? `rotate(${e[4]} ${e[0]} ${e[1]})` : undefined} />;

/** Pharyngeal arches: bars running dorsal→ventral, stacked cranio-caudally, under the head. */
function arches(b: Body): { bars: string[]; grooves: string[]; sinus: string } {
  const [x, y] = b.arch;
  const u: Pt = [-0.62, 0.78]; // along a bar (dorsal → ventral)
  const v: Pt = [0.78, 0.62]; // stacking (cranial → caudal)
  const L = [62, 52, 40, 28];
  const bars: string[] = [];
  const grooves: string[] = [];
  L.forEach((len, i) => {
    const c: Pt = [x + v[0] * i * 18, y + v[1] * i * 18];
    const pts: Pt[] = [];
    for (let k = 0; k < 12; k++) {
      const a = (k / 12) * Math.PI * 2;
      const r1 = (len / 2) * Math.cos(a);
      const r2 = 8 * Math.sin(a);
      pts.push([c[0] + u[0] * r1 + v[0] * r2, c[1] + u[1] * r1 + v[1] * r2]);
    }
    bars.push(smoothPath(pts, true, 0.9));
    if (i < L.length - 1) {
      const g: Pt = [c[0] + v[0] * 9, c[1] + v[1] * 9];
      const h = Math.min(len, L[i + 1]) * 0.42;
      grooves.push(`M${g[0] - u[0] * h},${g[1] - u[1] * h} Q${g[0] + v[0] * 2},${g[1] + v[1] * 2} ${g[0] + u[0] * h},${g[1] + u[1] * h}`);
    }
  });
  const s: Pt = [x + v[0] * 58, y + v[1] * 58];
  const sinus = `M${s[0] - u[0] * 14},${s[1] - u[1] * 14} Q${s[0] + v[0] * 9},${s[1] + v[1] * 9} ${s[0] + u[0] * 12},${s[1] + u[1] * 12}`;
  return { bars, grooves, sinus };
}

function Limb({ id, idPlate, g, day, lag }: { id: string; idPlate: string; g: ReturnType<typeof limbGeom>; day: number; lag: number }) {
  const plate = ramp(day, 36 + lag, 40 + lag);
  const [rx, ry] = g.joints.prox;
  return (
    <g>
      <defs>
        <radialGradient id={`${id}-fade`} gradientUnits="userSpaceOnUse" cx={rx} cy={ry} r={g.w * 1.05}>
          <stop offset="0.42" stopColor="#000" />
          <stop offset="1" stopColor="#fff" />
        </radialGradient>
        <mask id={`${id}-mask`} maskUnits="userSpaceOnUse" x="-1000" y="-1000" width="3000" height="3000">
          <rect x="-1000" y="-1000" width="3000" height="3000" fill={`url(#${id}-fade)`} />
        </mask>
      </defs>
      <g mask={`url(#${id}-mask)`}>
        <g filter="url(#w5-soft)" fill="url(#w5-skin)">
          <path d={g.body} />
          {g.hand && <path d={g.hand} />}
          {g.digitA > 0.02 && (
            <g stroke="url(#w5-skin)" strokeWidth={g.digitW} strokeLinecap="round">
              {g.digits.map(([a, b], i) => (
                <path key={i} d={`M${a[0]},${a[1]} L${b[0]},${b[1]}`} />
              ))}
            </g>
          )}
        </g>
        <g fill="none" stroke="#3a1512" strokeWidth={1.3} strokeOpacity={0.75}>
          <path d={g.body} />
          {g.hand && <path d={g.hand} />}
        </g>
      </g>
      <Part id={id} show={1 - plate}>
        <path d={g.body} fill="rgba(255,255,255,0.001)" />
      </Part>
      {g.hand && (
        <Part id={idPlate} show={plate}>
          <path d={g.hand} fill="rgba(255,255,255,0.001)" />
        </Part>
      )}
      {g.rayA > 0.02 && (
        <Part id="hatzetako-izpiak" show={g.rayA}>
          {g.rays.map(([a, b], i) => (
            <path key={i} d={`M${a[0]},${a[1]} L${b[0]},${b[1]}`} stroke={SKIN.light} strokeWidth={4.5} strokeLinecap="round" opacity={0.75} />
          ))}
        </Part>
      )}
      {g.grooveA > 0.02 && (
        <Part id="izpiarteko-ildoak" show={g.grooveA}>
          {g.grooves.map(([a, b], i) => (
            <path key={i} d={`M${a[0]},${a[1]} L${b[0]},${b[1]}`} stroke={SKIN.line} strokeWidth={1.6} strokeLinecap="round" />
          ))}
        </Part>
      )}
    </g>
  );
}

/** Geometry of the embryo on a given day; labels anchor to the same points the drawing uses. */
export function embryoGeom(day: number, kick = 0) {
  const b0 = atDay(K, day);
  // `kick`: small limb movement (-1..1) for the muscular-activity beats.
  const b: Body = kick ? { ...b0, leg: b0.leg.map((v, i) => (i === 2 ? v + kick * 8 : i === 3 ? v - kick * 14 : v)), arm: b0.arm.map((v, i) => (i === 3 ? v + kick * 8 : v)) } : b0;
  const S = sampleSpine(b.spine, 72);
  return { b, S, A: arches(b), arm: limbGeom(pose(b.arm)), leg: limbGeom(pose(b.leg, true)), cordEnd: polar(b.cord, b.cord[2], b.cord[3]) };
}

export function EmbryoFigure({ day, kick = 0 }: { day: number; kick?: number }) {
  const { b, S, A, arm, leg, cordEnd } = embryoGeom(day, kick);
  const archA = b.arch[2];
  const [nSom, somA] = b.somites;
  const cord = b.cord;
  const cordAng = cord[2];
  const cordR = cord[4];

  // Face features.
  const lensPlate = win(day, 26, 31, 1.5);
  const lensPit = win(day, 31, 38, 2);
  const eyeA = ramp(day, 37, 42);
  const lid = ramp(day, 40, 56);
  const nasPlate = win(day, 30.5, 38, 1.5);
  const nasPit = win(day, 38, 50, 3);
  const nose = ramp(day, 49, 55);
  const hill = win(day, 38, 45, 3);
  const auricle = ramp(day, 43, 48);
  const otic = win(day, 26, 31, 1.5);
  const plexus = ramp(day, 51, 56) * (1 - ramp(day, 60, 70));
  // Fetal period.
  const oss = ramp(day, 70, 84) * (1 - ramp(day, 112, 150));
  const gen = ramp(day, 77, 84);
  const lan = ramp(day, 100, 124);
  const hair = ramp(day, 104, 126);
  const fat = ramp(day, 200, 266);
  const vern = ramp(day, 215, 245);
  const wrinkle = win(day, 145, 185, 15);
  const hernia = ramp(day, 42, 50) * (1 - ramp(day, 80, 84));
  const herniaC = polar(cord, cordAng, cord[3] * 0.32);
  const genP: Pt = [lerp(b.leg[0], cord[0], 0.5) - 6, lerp(b.leg[1], cord[1], 0.5) + 14];
  const neckFold = win(day, 45, 60, 3);
  const mouth = ramp(day, 50, 56);
  const nape = ramp(day, 56, 70);
  const napeC = ((a: Pt, c: Pt): Pt => [(a[0] + c[0]) / 2, (a[1] + c[1]) / 2])(polar(b.cran, 30, b.cran[2] * 0.7), spineAt(S, 0.1, 30).p);
  const vent4 = win(day, 29, 36, 2);
  const meso = win(day, 26, 42, 4);

  // Somites: beads along the dorsal edge, visible through the skin.
  const somites: { c: Pt; a: number; r: number }[] = [];
  for (let i = 0; i < nSom; i++) {
    const u = 0.04 + (0.9 * i) / Math.max(1, nSom - 1);
    const s = spineAt(S, u, lerp(15, 7, u));
    somites.push({ c: s.p, a: (Math.atan2(s.t[1], s.t[0]) * 180) / Math.PI, r: lerp(8.5, 3.6, u) });
  }

  const cordPath = (() => {
    const n: Pt = polar([0, 0], cordAng + 90, 1);
    const at = (k: number, w: number): [Pt, Pt] => {
      const c = polar(cord, cordAng, cord[3] * k);
      return [[c[0] + n[0] * w, c[1] + n[1] * w], [c[0] - n[0] * w, c[1] - n[1] * w]];
    };
    const ks = [-0.12, 0.2, 0.6, 1];
    const ws = [cordR * 1.2, cordR * 1.08, cordR * 0.98, cordR];
    const side = ks.map((k, i) => at(k, ws[i]));
    return smoothPath([...side.map((q) => q[0]), ...side.map((q) => q[1]).reverse()], true, 0.5);
  })();

  return (
    <g>
      <SkinDefs id="w5" cx={470} cy={250} r={430} red={wrinkle * 0.85} />
      <clipPath id="w5-trunk">
        <path d={trunkPath(S, b.thick)} />
      </clipPath>

      {/* Sculpted silhouette: every bulge is part of one lit surface. */}
      <g filter="url(#w5-sculpt)" fill="url(#w5-skin)">
        <path d={trunkPath(S, b.thick)} />
        {ell(b.belly)}
        {gen > 0.02 && <ellipse cx={genP[0]} cy={genP[1]} rx={10 * gen} ry={8 * gen} />}
        {ell([b.arch[0] + 14, b.arch[1] + 46, 56, 44])}
        {ell([b.face[0] + 40, b.face[1] + 38, 42, 32])}
        {ell(b.cran)}
        {ell(b.face)}
        {nape > 0.02 && ell([napeC[0], napeC[1], b.cran[2] * 0.5 * nape, b.cran[3] * 0.46 * nape])}
        {nape > 0.02 && ell([(b.mouth[0] + b.heart[0]) / 2 + 24, (b.mouth[1] + b.heart[1]) / 2 - 6, 46 * nape, 40 * nape])}
        {nape > 0.02 && ell([b.ear[0] + 4, b.ear[1] + 66, 44 * nape, 46 * nape])}
        {mouth > 0.02 && ell([b.mouth[0] + 16, b.mouth[1] - 4, 30 * mouth, 22 * mouth])}
        {ell([b.heart[0], b.heart[1], b.heart[2], b.heart[3]])}
        {b.liver[2] > 1 && ell([b.liver[0], b.liver[1], b.liver[2], b.liver[3]])}
        {archA > 0.05 && A.bars.map((d, i) => <path key={i} d={d} opacity={archA} />)}

        {/* Relief drawn on the surface (inside the same lighting pass). */}
        {somA > 0.02 && (
          <Part id="somitak" show={somA}>
            {somites.map((s, i) => (
              <rect key={i} x={s.c[0] - s.r * 0.7} y={s.c[1] - s.r} width={s.r * 1.4} height={s.r * 2} rx={s.r * 0.6} transform={`rotate(${s.a + 90} ${s.c[0]} ${s.c[1]})`} fill={SKIN.light} stroke={SKIN.line} strokeOpacity={0.45} strokeWidth={0.9} opacity={0.85} />
            ))}
          </Part>
        )}
        <Part id="bihotz-goragunea">
          <ellipse cx={b.heart[0]} cy={b.heart[1]} rx={b.heart[2] * 0.92} ry={b.heart[3] * 0.92} fill="url(#w5-heart)" />
        </Part>
        {b.liver[2] > 1 && (
          <Part id="gibelaren-goragunea" show={ramp(day, 40, 46)}>
            <ellipse cx={b.liver[0]} cy={b.liver[1]} rx={b.liver[2] * 0.9} ry={b.liver[3] * 0.9} fill="url(#w5-liver)" />
          </Part>
        )}
        {archA > 0.05 && (
          <Part id="faringe-arkuak" show={archA}>
            {A.bars.map((d, i) => (
              <path key={i} d={d} fill={SKIN.light} opacity={0.6} stroke={SKIN.line} strokeOpacity={0.5} strokeWidth={1} />
            ))}
          </Part>
        )}
        {archA > 0.05 && (
          <Part id="arrialdura-brankialak" show={archA}>
            {A.grooves.map((d, i) => (
              <path key={i} d={d} fill="none" stroke={SKIN.ink} strokeWidth={2} strokeLinecap="round" opacity={0.65} />
            ))}
          </Part>
        )}
        {archA > 0.05 && (
          <Part id="lepoko-sinua" show={archA * ramp(day, 29, 32)}>
            <path d={A.sinus} fill="none" stroke={SKIN.ink} strokeWidth={3} strokeLinecap="round" opacity={0.55} />
          </Part>
        )}
        {meso > 0.02 && (
          <Part id="mesonefros-gandorra" show={meso}>
            <path
              d={smoothPath(
                [0.42, 0.5, 0.58, 0.66, 0.74].map((u) => spineAt(S, u, lerp(58, 50, u)).p),
                false,
                0.5,
              )}
              fill="none"
              stroke={SKIN.light}
              strokeWidth={11}
              strokeLinecap="round"
              opacity={0.55}
            />
          </Part>
        )}
        {vent4 > 0.02 && (
          <Part id="laugarren-bentrikulua" show={vent4}>
            <path d={smoothPath([spineAt(S, 0.0, 6).p, spineAt(S, 0.05, 22).p, spineAt(S, 0.02, 40).p, polar(b.cran, -20, b.cran[2] * 0.82)], true, 0.7)} fill="#b3544c" opacity={0.18} />
          </Part>
        )}
        {plexus > 0.02 && (
          <Part id="sare-baskularra" show={plexus}>
            <g fill="none" stroke={SKIN.vessel} strokeWidth={1.1} strokeLinecap="round" opacity={0.6}>
              {[-150, -128, -104, -80, -58].map((a, i) => {
                const p0 = polar(b.cran, a, b.cran[3] * 0.62);
                const p1 = polar(b.cran, a + 6, b.cran[3] * 0.8);
                const p2 = polar(b.cran, a - 4, b.cran[3] * 0.93);
                return <path key={i} d={`M${p0[0]},${p0[1]} Q${p1[0]},${p1[1]} ${p2[0]},${p2[1]} M${p1[0]},${p1[1]} l${8 - i * 3},-6`} />;
              })}
            </g>
          </Part>
        )}
        {neckFold > 0.02 && (
          <Part id="lepoko-tolestura" show={neckFold}>
            <path d={smoothPath([spineAt(S, 0.02, 4).p, spineAt(S, 0.06, 18).p, spineAt(S, 0.1, 28).p], false)} fill="none" stroke={SKIN.line} strokeWidth={2} opacity={0.6} />
          </Part>
        )}
      </g>

      {/* Eye: lens placode → lens pit → pigmented eye → eyelids. */}
      <g>
        {lensPlate > 0.02 && (
          <Part id="kristalinoaren-plaka" show={lensPlate}>
            <ellipse cx={b.eye[0]} cy={b.eye[1]} rx={11} ry={10} fill={SKIN.light} stroke={SKIN.line} strokeWidth={1} opacity={0.9} />
          </Part>
        )}
        {lensPit > 0.02 && (
          <Part id="kristalinoaren-hobitxoa" show={lensPit * (1 - eyeA)}>
            <ellipse cx={b.eye[0]} cy={b.eye[1]} rx={11} ry={10} fill={SKIN.light} stroke={SKIN.line} strokeWidth={1} />
            <ellipse cx={b.eye[0] + 1} cy={b.eye[1] + 1} rx={5} ry={4.5} fill={SKIN.ink} opacity={0.75} />
          </Part>
        )}
        {eyeA > 0.02 && (
          <Part id="begia" show={eyeA}>
            <ellipse cx={b.eye[0]} cy={b.eye[1]} rx={lerp(12, 13, lid)} ry={lerp(11, 5, lid)} fill="#2a1414" />
            <ellipse cx={b.eye[0] - 3} cy={b.eye[1] - 3} rx={3} ry={2 * (1 - lid) + 1} fill="#fff" opacity={0.35} />
          </Part>
        )}
        {lid > 0.02 && (
          <Part id="betazala" show={ramp(day, 40, 44)}>
            <path d={`M${b.eye[0] - 17},${b.eye[1] - 1} Q${b.eye[0]},${b.eye[1] - lerp(20, 10, lid)} ${b.eye[0] + 17},${b.eye[1] - 1}`} fill="none" stroke={SKIN.line} strokeWidth={2.4} strokeLinecap="round" />
            <path d={`M${b.eye[0] - 15},${b.eye[1] + 2} Q${b.eye[0]},${b.eye[1] + lerp(18, 9, lid)} ${b.eye[0] + 15},${b.eye[1] + 2}`} fill="none" stroke={SKIN.line} strokeWidth={1.8} strokeLinecap="round" opacity={0.8} />
          </Part>
        )}
        {win(day, 39, 46, 3) > 0.02 && (
          <Part id="ildo-nasolakrimala" show={win(day, 39, 46, 3)}>
            <path d={`M${b.eye[0] - 12},${b.eye[1] + 8} Q${(b.eye[0] + b.nose[0]) / 2 - 6},${(b.eye[1] + b.nose[1]) / 2 + 8} ${b.nose[0] + 6},${b.nose[1] - 6}`} fill="none" stroke={SKIN.line} strokeWidth={1.6} opacity={0.8} />
          </Part>
        )}
      </g>

      {/* Nose: nasal placode (32) → nasal pit (42) → nose (56). */}
      {nasPlate > 0.02 && (
        <Part id="sudur-plaka" show={nasPlate}>
          <ellipse cx={b.nose[0]} cy={b.nose[1]} rx={9} ry={12} transform={`rotate(20 ${b.nose[0]} ${b.nose[1]})`} fill={SKIN.light} stroke={SKIN.line} strokeWidth={1} />
        </Part>
      )}
      {nasPit > 0.02 && (
        <Part id="sudur-hobia" show={nasPit * (1 - nose)}>
          <ellipse cx={b.nose[0]} cy={b.nose[1]} rx={8} ry={11} transform={`rotate(20 ${b.nose[0]} ${b.nose[1]})`} fill={SKIN.light} stroke={SKIN.line} strokeWidth={1} />
          <path d={`M${b.nose[0] - 2},${b.nose[1] - 7} q-4,7 1,14`} fill="none" stroke={SKIN.ink} strokeWidth={2.4} strokeLinecap="round" />
        </Part>
      )}
      {nose > 0.02 && (
        <Part id="sudurra" show={nose}>
          <path d={`M${b.nose[0] + 10},${b.nose[1] - 16} Q${b.nose[0] - 6},${b.nose[1] - 2} ${b.nose[0] + 2},${b.nose[1] + 8} Q${b.nose[0] + 8},${b.nose[1] + 10} ${b.nose[0] + 12},${b.nose[1] + 6}`} fill={SKIN.mid} stroke={SKIN.line} strokeWidth={1.4} />
          <ellipse cx={b.nose[0] + 6} cy={b.nose[1] + 5} rx={2.4} ry={1.6} fill={SKIN.ink} />
        </Part>
      )}
      {mouth > 0.02 && (
        <>
          <Part id="ahoa" show={mouth}>
            <path d={`M${b.mouth[0] - 11},${b.mouth[1] - 1} Q${b.mouth[0]},${b.mouth[1] + 4} ${b.mouth[0] + 12},${b.mouth[1]}`} fill="none" stroke={SKIN.ink} strokeWidth={2.2} strokeLinecap="round" />
          </Part>
          <Part id="beheko-maxilarra" show={mouth}>
            <path d={`M${b.mouth[0] - 4},${b.mouth[1] + 12} Q${b.mouth[0] + 12},${b.mouth[1] + 20} ${b.mouth[0] + 32},${b.mouth[1] + 12}`} fill="none" stroke={SKIN.line} strokeWidth={1.8} strokeLinecap="round" opacity={0.8} />
          </Part>
        </>
      )}

      {/* Ear: otic placode (28) → auricular hillocks (42) → auricle (48–56). */}
      {otic > 0.02 && (
        <Part id="entzumen-plaka" show={otic}>
          <ellipse cx={b.ear[0]} cy={b.ear[1]} rx={9} ry={8} fill={SKIN.light} stroke={SKIN.line} strokeWidth={1} opacity={0.85} />
        </Part>
      )}
      {hill > 0.02 && (
        <Part id="belarriaren-goraguneak" show={hill}>
          {[0, 1, 2, 3, 4, 5].map((i) => {
            const p = polar(b.ear, -120 + i * 50, 14);
            return <circle key={i} cx={p[0]} cy={p[1]} r={5.2} fill={SKIN.light} stroke={SKIN.line} strokeWidth={1} />;
          })}
        </Part>
      )}
      {auricle > 0.02 && (
        <Part id="belarriaren-pabiloia" show={auricle}>
          <path
            d={`M${b.ear[0] - 6},${b.ear[1] - 20} C${b.ear[0] + 16},${b.ear[1] - 30} ${b.ear[0] + 26},${b.ear[1] + 4} ${b.ear[0] + 10},${b.ear[1] + 20} C${b.ear[0]},${b.ear[1] + 28} ${b.ear[0] - 12},${b.ear[1] + 22} ${b.ear[0] - 10},${b.ear[1] + 12}`}
            fill={SKIN.mid}
            stroke={SKIN.line}
            strokeWidth={2}
          />
        </Part>
      )}
      {day >= 38 && (
        <Part id="kanpoko-entzumenbidea" show={ramp(day, 38, 42)}>
          <ellipse cx={b.ear[0]} cy={b.ear[1]} rx={4.5} ry={5.5} fill={SKIN.ink} />
        </Part>
      )}

      {/* Umbilical cord (cut), then the limbs in front of the body. */}
      <Part id="zilborrestea">
        <g filter="url(#w5-sculpt)" fill="url(#w5-skin)">
          <path d={cordPath} />
          {hernia > 0.02 && <ellipse cx={herniaC[0]} cy={herniaC[1]} rx={cord[3] * 0.36} ry={cordR * (1 + 0.75 * hernia)} transform={`rotate(${cordAng} ${herniaC[0]} ${herniaC[1]})`} />}
          <ellipse cx={cordEnd[0]} cy={cordEnd[1]} rx={cordR * 0.55} ry={cordR} transform={`rotate(${cordAng} ${cordEnd[0]} ${cordEnd[1]})`} />
        </g>
        <ellipse cx={cordEnd[0]} cy={cordEnd[1]} rx={cordR * 0.48} ry={cordR * 0.92} transform={`rotate(${cordAng} ${cordEnd[0]} ${cordEnd[1]})`} fill="#f3c0b2" stroke={SKIN.line} strokeWidth={1} />
      </Part>
      {hernia > 0.02 && (
        <>
          <Part id="heste-lakioak" show={hernia}>
            <path
              d={smoothPath([0, 1, 2, 3, 4, 5, 6].map((i) => polar(polar(cord, cordAng, cord[3] * (0.08 + i * 0.075)), cordAng + 90, (i % 2 ? 1 : -1) * cordR * 0.7 * hernia)), false, 0.9)}
              fill="none"
              stroke="#c9665e"
              strokeWidth={5}
              strokeLinecap="round"
              opacity={0.55}
            />
          </Part>
          <Part id="zilbor-ernia-fisiologikoa" show={hernia}>
            <ellipse cx={herniaC[0]} cy={herniaC[1]} rx={cord[3] * 0.4} ry={cordR * (1.12 + 0.75 * hernia)} transform={`rotate(${cordAng} ${herniaC[0]} ${herniaC[1]})`} fill="none" stroke="#ffb86b" strokeWidth={1.4} strokeDasharray="4 4" opacity={0.8} />
          </Part>
        </>
      )}
      {gen > 0.02 && (
        <Part id="kanpoko-genitalak" show={gen}>
          <ellipse cx={genP[0]} cy={genP[1]} rx={10} ry={8} fill="rgba(255,255,255,0.001)" stroke={SKIN.line} strokeWidth={1.2} />
        </Part>
      )}
      <Limb id={day > 52 ? 'izterra' : 'beheko-gorputz-adarraren-hasikina'} idPlate={day > 52 ? 'oina' : 'oin-plaka'} g={leg} day={day} lag={1.5} />
      <Limb id={day > 52 ? 'besoa' : 'goiko-gorputz-adarraren-hasikina'} idPlate={day > 52 ? 'eskua' : 'esku-plaka'} g={arm} day={day} lag={0} />

      {/* ---- Fetal surface features ---- */}
      <defs>
        <filter id="w5-blur8" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="9" />
        </filter>
        <filter id="w5-vern" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="1.6" />
        </filter>
      </defs>
      {oss > 0.02 && (
        <Part id="hezurtzapen-zentroak" show={oss}>
          <path
            d={`M${lerp(leg.joints.prox[0], leg.joints.mid[0], 0.3)},${lerp(leg.joints.prox[1], leg.joints.mid[1], 0.3)} L${lerp(leg.joints.prox[0], leg.joints.mid[0], 0.75)},${lerp(leg.joints.prox[1], leg.joints.mid[1], 0.75)}`}
            stroke="#f6eddc"
            strokeWidth={b.leg[7] * 0.2}
            strokeLinecap="round"
            opacity={0.8}
          />
          {[-150, -95, -40].map((a, i) => {
            const c = polar(b.cran, a, b.cran[2] * 0.62);
            return <ellipse key={i} cx={c[0]} cy={c[1]} rx={b.cran[2] * 0.2} ry={b.cran[2] * 0.14} transform={`rotate(${a + 90} ${c[0]} ${c[1]})`} fill="#f6eddc" opacity={0.42} />;
          })}
        </Part>
      )}
      {fat > 0.02 && (
        <Part id="gantz-metaketa" show={fat}>
          {/* Warm subcutaneous glow under the dorsal skin; the body itself also rounds out. */}
          <g clipPath="url(#w5-trunk)">
            <path
              d={smoothPath(Array.from({ length: 12 }, (_, i) => spineAt(S, 0.06 + i * 0.078, 18).p), false)}
              fill="none"
              stroke="#ffd79c"
              strokeWidth={34}
              strokeLinecap="round"
              opacity={0.32}
              filter="url(#w5-blur8)"
            />
          </g>
        </Part>
      )}
      {wrinkle > 0.02 && (
        <g fill="none" stroke={SKIN.line} strokeWidth={1.2} strokeLinecap="round" opacity={0.45 * wrinkle} pointerEvents="none">
          {[0.3, 0.38, 0.46, 0.54, 0.62, 0.7].map((u, i) => {
            const p = spineAt(S, u, 34 + (i % 2) * 22);
            return <path key={i} d={`M${p.p[0] - p.t[0] * 16},${p.p[1] - p.t[1] * 16} q${p.n[0] * 6},${p.n[1] * 6} ${p.t[0] * 32},${p.t[1] * 32}`} />;
          })}
        </g>
      )}
      {lan > 0.02 && (
        <Part id="lanugoa" show={lan}>
          <g stroke="#fbe7dc" strokeWidth={0.7} strokeLinecap="round" opacity={0.6}>
            {Array.from({ length: 58 }, (_, i) => {
              const s = spineAt(S, 0.05 + i * 0.015, -1);
              const o = polar(s.p, (Math.atan2(-s.n[1], -s.n[0]) * 180) / Math.PI + 38, 4.5 + (i % 3) * 1.2);
              return <path key={i} d={`M${s.p[0]},${s.p[1]} L${o[0]},${o[1]}`} />;
            })}
          </g>
        </Part>
      )}
      {hair > 0.02 && (
        <>
          <Part id="buruko-ilea" show={hair}>
            <g stroke="#5e3c31" strokeWidth={1.4} strokeLinecap="round" fill="none" opacity={0.78}>
              {Array.from({ length: 34 }, (_, i) => {
                const a = -168 + i * 3.6;
                const r0 = b.cran[2] * (0.94 + (i % 3) * 0.015);
                const p = polar(b.cran, a, r0);
                const m = polar(b.cran, a + 4, b.cran[2] * 1.015);
                const o = polar(b.cran, a + 8, r0 + 1);
                return <path key={i} d={`M${p[0]},${p[1]} Q${m[0]},${m[1]} ${o[0]},${o[1]}`} />;
              })}
            </g>
          </Part>
          <Part id="bekainak" show={hair}>
            <path d={`M${b.eye[0] - 16},${b.eye[1] - 12} Q${b.eye[0]},${b.eye[1] - 20} ${b.eye[0] + 14},${b.eye[1] - 13}`} fill="none" stroke="#5e3c31" strokeWidth={2.6} strokeLinecap="round" opacity={0.85} />
          </Part>
        </>
      )}
      {vern > 0.02 && (
        <Part id="vernix-caseosa" show={vern}>
          {/* Creamy film collected in the back, the skin folds and the scalp. */}
          <g fill="#f8f3e6" opacity={0.55} filter="url(#w5-vern)">
            {[0.14, 0.24, 0.36, 0.47, 0.58, 0.7, 0.82].map((u, i) => {
              const p = spineAt(S, u, 9 + (i % 3) * 5).p;
              return <path key={i} d={smoothPath(ellipsePts(p[0], p[1], 12 - (i % 3) * 2.5, 6, 10, 0.25, i + 3))} />;
            })}
            {[-150, -112, -76].map((a, i) => {
              const p = polar(b.cran, a, b.cran[2] * 0.84);
              return <path key={`c${i}`} d={smoothPath(ellipsePts(p[0], p[1], 10, 6, 10, 0.25, i + 11))} />;
            })}
            <path d={smoothPath(ellipsePts(arm.joints.prox[0], arm.joints.prox[1] + 10, 10, 6, 10, 0.25, 21))} />
            <path d={smoothPath(ellipsePts(leg.joints.prox[0] - 6, leg.joints.prox[1], 11, 6, 10, 0.25, 23))} />
            <path d={smoothPath(ellipsePts(leg.joints.mid[0], leg.joints.mid[1], 9, 5, 10, 0.25, 25))} />
          </g>
        </Part>
      )}
    </g>
  );
}


const day28to32 = (t: number) => (t < 0.62 ? 28 : t < 0.74 ? lerp(28, 32, seg(t, 0.62, 0.74)) : 32);
const day42to56 = (t: number) => {
  if (t < 0.13) return lerp(32, 42, seg(t, 0, 0.13));
  if (t < 0.44) return 42;
  if (t < 0.5) return lerp(42, 48, seg(t, 0.44, 0.5));
  if (t < 0.72) return 48;
  if (t < 0.78) return lerp(48, 56, seg(t, 0.72, 0.78));
  return 56;
};

/** Fade in at `a`, out at `b` (stage time). */
const vis = (t: number, a: number, b = 2) => Math.min(seg(t, a, a + 0.03), 1 - seg(t, b - 0.03, b));

export function Embryo28to32({ t }: SceneProps) {
  const day = day28to32(t);
  const { b, S, arm, leg, cordEnd } = embryoGeom(day);
  const cran = b.cran;
  const vertex = polar(cran, -112, cran[3] * 0.98);
  const rump = spineAt(S, 0.8, 0).p;
  const crl = vis(t, 0.25, 0.48);
  const heartTop = polar(b.heart, -40, b.heart[2] * 0.7);
  const archC: Pt = [b.arch[0] + 12, b.arch[1] + 8];
  const groove: Pt = [b.arch[0] + 20, b.arch[1] + 16];
  const sinus: Pt = [b.arch[0] + 0.78 * 58, b.arch[1] + 0.62 * 58];
  const tail = spineAt(S, 0.985, 2).p;
  const v4 = spineAt(S, 0.02, 22).p;
  const meso = spineAt(S, 0.6, 54).p;
  const som = spineAt(S, 0.72, 10).p;
  return (
    <g>
      <EmbryoFigure day={day} />

      {crl > 0.02 && (
        <Part id="luzera-zefalokaudala" show={crl}>
          <path d={`M${vertex[0]},${vertex[1]} L${rump[0]},${rump[1]}`} stroke="#ffb86b" strokeWidth={2} strokeDasharray="7 6" fill="none" />
          <circle cx={vertex[0]} cy={vertex[1]} r={5} fill="#ffb86b" />
          <circle cx={rump[0]} cy={rump[1]} r={5} fill="#ffb86b" />
        </Part>
      )}

      {/* Left gutter */}
      <Label id="mesentzefaloa" x={290} y={100} ax={polar(cran, -150, cran[2] * 0.8)[0]} ay={polar(cran, -150, cran[3] * 0.8)[1]} show={vis(t, 0.37)} />
      <Label id="kristalinoaren-plaka" x={290} y={165} ax={b.eye[0] - 8} ay={b.eye[1]} show={vis(t, 0.37, 0.7)} />
      <Label id="kristalinoaren-hobitxoa" x={290} y={165} ax={b.eye[0] - 8} ay={b.eye[1]} show={vis(t, 0.74)} />
      <Label id="sudur-plaka" x={290} y={225} ax={b.nose[0] - 6} ay={b.nose[1]} show={vis(t, 0.74)} />
      <Label id="bihotz-goragunea" x={290} y={345} ax={b.heart[0] - b.heart[2] * 0.5} ay={b.heart[1]} show={vis(t, 0.48)} />
      <Label id="ezkerreko-bentrikulua" x={290} y={390} ax={b.heart[0] - 10} ay={b.heart[1] + b.heart[3] * 0.45} show={vis(t, 0.48, 0.74)} />
      <Label id="zilborrestea" x={290} y={440} ax={cordEnd[0]} ay={cordEnd[1]} show={vis(t, 0.6)} />
      <Label id="goragune-kaudala" x={290} y={492} ax={tail[0]} ay={tail[1]} show={vis(t, 0.6)} />
      <Label id="beheko-gorputz-adarraren-hasikina" x={300} y={540} ax={leg.joints.mid[0]} ay={leg.joints.mid[1]} show={vis(t, 0.6)} />

      {/* Right gutter */}
      <Label id="laugarren-bentrikulua" x={770} y={60} ax={v4[0]} ay={v4[1]} show={vis(t, 0.86)} />
      <Label id="entzumen-plaka" x={770} y={105} ax={b.ear[0] + 8} ay={b.ear[1]} show={vis(t, 0.37, 0.7)} />
      <Label id="faringe-arkuak" x={770} y={150} ax={archC[0]} ay={archC[1]} />
      <Label id="arrialdura-brankialak" x={770} y={195} ax={groove[0]} ay={groove[1]} show={vis(t, 0.86)} />
      <Label id="lepoko-sinua" x={770} y={240} ax={sinus[0]} ay={sinus[1]} show={vis(t, 0.86)} />
      <Label id="ezkerreko-aurikula" x={765} y={272} ax={heartTop[0]} ay={heartTop[1]} show={vis(t, 0.48, 0.74)} />
      <Label id="goiko-gorputz-adarraren-hasikina" x={765} y={372} ax={arm.joints.mid[0]} ay={arm.joints.mid[1]} show={vis(t, 0.48)} />
      <Label id="mesonefros-gandorra" x={770} y={440} ax={meso[0]} ay={meso[1]} show={vis(t, 0.86)} />
      <Label id="somitak" x={770} y={520} ax={som[0]} ay={som[1]} />
      <Label id="luzera-zefalokaudala" x={770} y={585} ax={lerp(vertex[0], rump[0], 0.55)} ay={lerp(vertex[1], rump[1], 0.55)} show={crl} />

      <Note x={40} y={536} align="start" tone="accent" show={vis(t, 0.13, 0.37)}>
        28 somita bikote inguru
      </Note>
      <AgeHud value={Math.round(day)} unit=". eguna" caption="Enbrioiaren adina" />
    </g>
  );
}

export function Embryo42to56({ t }: SceneProps) {
  const day = day42to56(t);
  const { b, arm, leg, cordEnd } = embryoGeom(day);
  const d42 = vis(t, 0.13, 0.45);
  const d48 = vis(t, 0.5, 0.73);
  const d56 = vis(t, 0.78);
  const eye = b.eye;
  const ear = b.ear;
  const hand = arm.joints.palm;
  const foot = leg.joints.palm;
  const cran = b.cran;
  const plex = polar(cran, -140, cran[2] * 0.82);
  return (
    <g>
      <EmbryoFigure day={day} />

      {/* 42. eguna */}
      <Label id="betazala" x={250} y={185} ax={eye[0]} ay={eye[1] - 12} show={Math.max(d42, d48, d56)} />
      <Label id="begia" text="Begi pigmentatua" x={250} y={228} ax={eye[0] - 10} ay={eye[1]} show={d42} />
      <Label id="ildo-nasolakrimala" x={250} y={272} ax={(eye[0] + b.nose[0]) / 2 - 4} ay={(eye[1] + b.nose[1]) / 2 + 6} show={d42} />
      <Label id="sudur-hobia" x={250} y={345} ax={b.nose[0] - 4} ay={b.nose[1] + 2} show={d42} />
      <Label id="bihotz-goragunea" x={250} y={400} ax={b.heart[0] - b.heart[2] * 0.6} ay={b.heart[1]} show={d42} />
      <Label id="oin-plaka" x={250} y={530} ax={foot[0]} ay={foot[1]} show={d42} />
      <Label id="belarriaren-goraguneak" x={770} y={170} ax={ear[0] + 14} ay={ear[1] - 6} show={d42} />
      <Label id="kanpoko-entzumenbidea" text="Kanpoko belarri meatoa" x={770} y={215} ax={ear[0] + 3} ay={ear[1] + 2} show={d42} />
      <Label id="esku-plaka" x={770} y={372} ax={hand[0] + 10} ay={hand[1] - 10} show={d42} />
      <Label id="hatzetako-izpiak" x={770} y={420} ax={arm.rays[4][1][0]} ay={arm.rays[4][1][1]} show={d42} />

      {/* 48. eguna */}
      <Label id="begia" x={250} y={228} ax={eye[0] - 10} ay={eye[1]} show={Math.max(d48, d56)} />
      <Label id="hatzetako-izpiak" x={250} y={360} ax={arm.rays[1][1][0]} ay={arm.rays[1][1][1]} show={d48} />
      <Label id="izpiarteko-ildoak" x={250} y={392} ax={arm.grooves[1][1][0]} ay={arm.grooves[1][1][1]} show={d48} />
      <Label id="gibelaren-goragunea" x={250} y={424} ax={b.liver[0] - b.liver[2] * 0.4} ay={b.liver[1] + 6} show={d48} />
      <Label id="hatzetako-izpiak" text="Behatzetako izpiak" x={770} y={560} ax={leg.rays[2][1][0]} ay={leg.rays[2][1][1]} show={d48} />
      <Label id="lepoko-tolestura" x={770} y={130} ax={b.spine[0][0] + 50} ay={b.spine[0][1] + 20} show={d48} />
      <Label id="kanpoko-entzumenbidea" x={770} y={180} ax={ear[0] + 3} ay={ear[1] + 2} show={d48} />
      <Label id="belarriaren-pabiloia" x={770} y={235} ax={ear[0] + 20} ay={ear[1]} show={Math.max(d48, d56)} />
      <Label id="eskumuturra" x={770} y={400} ax={arm.joints.dist[0]} ay={arm.joints.dist[1]} show={d48} />
      <Label id="zilborrestea" x={250} y={462} ax={cordEnd[0] - 6} ay={cordEnd[1]} show={Math.max(d42, d48, d56)} />

      {/* 56. eguna */}
      <Label id="sare-baskularra" x={250} y={80} ax={plex[0]} ay={plex[1]} show={d56} />
      <Label id="sudurra" x={250} y={275} ax={b.nose[0] - 2} ay={b.nose[1]} show={d56} />
      <Label id="ahoa" x={250} y={318} ax={b.mouth[0] - 12} ay={b.mouth[1]} show={d56} />
      <Label id="beheko-maxilarra" x={250} y={352} ax={b.mouth[0] + 4} ay={b.mouth[1] + 18} show={d56} />
      <Label id="eskumuturra" x={250} y={405} ax={arm.joints.dist[0]} ay={arm.joints.dist[1]} show={d56} />
      <Label id="behatzak" x={250} y={500} ax={leg.rays[1][1][0]} ay={leg.rays[1][1][1]} show={d56} />
      <Label id="oinzola" x={250} y={538} ax={foot[0]} ay={foot[1] + 6} show={d56} />
      <Label id="sorbalda" x={770} y={290} ax={arm.joints.prox[0] + 6} ay={arm.joints.prox[1] + 4} show={d56} />
      <Label id="besoa" x={770} y={350} ax={lerp(arm.joints.prox[0], arm.joints.mid[0], 0.6)} ay={lerp(arm.joints.prox[1], arm.joints.mid[1], 0.6)} show={d56} />
      <Label id="ukondoa" x={770} y={410} ax={arm.joints.mid[0]} ay={arm.joints.mid[1]} show={d56} />
      <Label id="belauna" x={770} y={540} ax={leg.joints.mid[0]} ay={leg.joints.mid[1]} show={d56} />

      <AgeHud value={Math.round(day)} unit=". eguna" caption="Enbrioiaren adina" />
    </g>
  );
}
