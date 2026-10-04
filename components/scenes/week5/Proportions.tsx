'use client';

import { useId } from 'react';
import { Label, Note, Part, lerp, seg, smoothPath, type Pt, type SceneProps } from '@/components/kit';
import { SkinDefs } from './skin';

/**
 * Relative head size (topic 5, §2): three fetuses standing, drawn to the SAME vertex–heel
 * height (as in the course figure) so only the proportions change: the head is ½ of the
 * vertex–heel length at the start of the fetal period, ⅓ at month 5 and ¼ at birth.
 */

const Y0 = 70;
const H = 468;
const FIGS = [
  { cx: 245, h: 1 / 2, at: 0.24, frac: '½', name: '3. hilabetea' },
  { cx: 535, h: 1 / 3, at: 0.52, frac: '⅓', name: '5. hilabetea' },
  { cx: 810, h: 1 / 4, at: 0.8, frac: '¼', name: 'Jaioberria' },
];

/** Front view of a standing fetus whose head is `h` of the total height. */
export function Standing({ id, cx, h }: { id: string; cx: number; h: number }) {
  const k = (0.5 - h) / 0.25; // 0 → early fetus, 1 → newborn
  const hh = H * h;
  const headRx = hh * lerp(0.35, 0.4, k);
  const yChin = Y0 + hh;
  const rest = H - hh;
  const neck = rest * lerp(0.02, 0.05, k);
  const legs = rest * lerp(0.4, 0.53, k);
  const ySh = yChin + neck;
  const yHip = Y0 + H - legs;
  const sw = H * lerp(0.1, 0.15, k); // half shoulder width
  const hw = H * lerp(0.085, 0.12, k); // half hip width
  const bw = H * lerp(0.105, 0.14, k); // half belly width
  const armW = H * lerp(0.03, 0.042, k);
  const armL = (yHip - ySh) * lerp(1.0, 1.22, k);
  const legW = H * lerp(0.04, 0.055, k);
  const half: Pt[] = [
    [cx - headRx * 0.3, ySh - 3],
    [cx - sw * 0.82, ySh + 1],
    [cx - sw, ySh + (yHip - ySh) * 0.14],
    [cx - bw, lerp(ySh, yHip, 0.6)],
    [cx - hw, yHip + legW * 0.2],
    [cx - hw * 0.45, yHip + legW * 1.1],
  ];
  const trunk = smoothPath([...half, ...half.map(([x, y]): Pt => [2 * cx - x, y]).reverse()], true);
  const limb = (x1: number, y1: number, x2: number, y2: number, w1: number, w2: number) => {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const L = Math.hypot(dx, dy);
    const nx = -dy / L;
    const ny = dx / L;
    return `M${x1 + nx * w1},${y1 + ny * w1} L${x2 + nx * w2},${y2 + ny * w2} A${w2} ${w2} 0 0 0 ${x2 - nx * w2},${y2 - ny * w2} L${x1 - nx * w1},${y1 - ny * w1} A${w1} ${w1} 0 0 0 ${x1 + nx * w1},${y1 + ny * w1}Z`;
  };
  const sides = [-1, 1];
  const eyeY = Y0 + hh * lerp(0.6, 0.56, k);
  return (
    <g>
      <SkinDefs id={id} cx={cx - 30} cy={Y0 + H * 0.35} r={H * 0.75} />
      <g filter={`url(#${id}-sculpt)`} fill={`url(#${id}-skin)`}>
        {/* legs, then arms, then trunk and head so the lighting reads as one body */}
        {sides.map((s) => (
          <path key={`l${s}`} d={limb(cx + s * hw * 0.5, yHip, cx + s * hw * 0.42, Y0 + H - legW * 0.7, legW, legW * 0.62)} />
        ))}
        {sides.map((s) => (
          <ellipse key={`f${s}`} cx={cx + s * (hw * 0.42 + legW * 0.25)} cy={Y0 + H - legW * 0.45} rx={legW * 0.95} ry={legW * 0.45} />
        ))}
        <path d={trunk} />
        {sides.map((s) => (
          <path key={`a${s}`} d={limb(cx + s * (sw - armW * 0.2), ySh + armW * 1.1, cx + s * (sw + armW * 1.9), ySh + armL, armW, armW * 0.85)} />
        ))}
        <rect x={cx - headRx * 0.38} y={yChin - hh * 0.12} width={headRx * 0.76} height={neck + hh * 0.2} rx={headRx * 0.3} />
        {sides.map((s) => (
          <ellipse key={`e${s}`} cx={cx + s * headRx * 0.96} cy={eyeY + hh * 0.05} rx={hh * 0.045} ry={hh * 0.08} />
        ))}
        <ellipse cx={cx} cy={Y0 + hh * 0.5} rx={headRx} ry={hh * 0.5} />
      </g>
      {/* Face and navel, kept minimal: the figure is about proportion. */}
      <g fill="none" stroke="#5e2622" strokeWidth={1.6} strokeLinecap="round" opacity={0.7}>
        {sides.map((s) => (
          <path key={s} d={`M${cx + s * headRx * 0.2},${eyeY} q${s * headRx * 0.12},${hh * 0.025} ${s * headRx * 0.24},0`} />
        ))}
        <path d={`M${cx - headRx * 0.12},${Y0 + hh * 0.84} q${headRx * 0.12},${hh * 0.03} ${headRx * 0.24},0`} />
      </g>
      <ellipse cx={cx} cy={lerp(ySh, yHip, 0.7)} rx={3} ry={2.2} fill="#9b4d45" opacity={0.7} />
    </g>
  );
}

// ---------------------------------------------------------------------------
// HeadProportions — the course figure (3. hilabetea, 5. hilabetea, jaioberria): three
// fetuses in equal boxes cut into 2, 3 and 4 equal bands; the head fills the top band.
// ---------------------------------------------------------------------------

type P2 = readonly [number, number];

interface Fig {
  name: string;
  frac: string;
  n: number; // bands: the head is 1/n of vertex–heel
  at: number; // beat
  red: number; // thin reddish skin of the younger fetus
  cx: number; // figure centre (course px)
  head: P2[]; // right half, vertex → chin
  trunk: P2[]; // right half, neck → crotch
  ear: P2;
  eyeY: number;
  eyeDx: number;
  noseY: number;
  mouthY: number;
  arm: { sh: P2; el: P2; wr: P2; hand: P2; w: [number, number, number]; hr: number };
  armL: { sh: P2; el: P2; wr: P2; hand: P2 };
  leg: { hip: P2; kn: P2; an: P2; foot: P2; w: [number, number, number] };
  cord?: [P2, P2];
  navel?: P2;
  nipples?: number;
  hair?: boolean;
  genital: P2;
}

// Traced on the course figure (image px; the boxes span y 205 → 575, 370 px).
const TOP = 205;
const SPAN = 370;
const PFIGS: Fig[] = [
  {
    name: '3. hilabetea',
    frac: '½',
    n: 2,
    at: 0.24,
    red: 0.35,
    cx: 450,
    head: [[450, 205], [485, 218], [510, 248], [522, 281], [520, 310], [510, 334], [500, 352], [486, 372], [468, 388], [450, 393]],
    trunk: [[468, 390], [490, 401], [502, 420], [506, 455], [512, 488], [510, 514], [496, 531], [472, 543], [450, 547]],
    ear: [511, 346],
    eyeY: 349,
    eyeDx: 19,
    noseY: 364,
    mouthY: 379,
    arm: { sh: [497, 408], el: [508, 468], wr: [474, 440], hand: [459, 431], w: [12, 10, 8], hr: 11 },
    armL: { sh: [403, 408], el: [392, 470], wr: [428, 455], hand: [443, 452] },
    leg: { hip: [478, 524], kn: [522, 544], an: [497, 577], foot: [486, 588], w: [19, 15, 10] },
    cord: [[470, 498], [516, 486]],
    genital: [450, 549],
  },
  {
    name: '5. hilabetea',
    frac: '⅓',
    n: 3,
    at: 0.52,
    red: 0.25,
    cx: 685,
    head: [[685, 206], [713, 212], [733, 232], [742, 260], [740, 284], [733, 302], [720, 322], [703, 334], [685, 338]],
    trunk: [[703, 333], [727, 343], [737, 368], [740, 400], [741, 432], [733, 458], [716, 475], [699, 484], [685, 487]],
    ear: [739, 294],
    eyeY: 302,
    eyeDx: 17,
    noseY: 317,
    mouthY: 329,
    arm: { sh: [731, 352], el: [738, 402], wr: [706, 366], hand: [694, 355], w: [11, 9, 7], hr: 9 },
    armL: { sh: [639, 352], el: [632, 400], wr: [664, 380], hand: [677, 373] },
    leg: { hip: [712, 470], kn: [719, 522], an: [713, 576], foot: [716, 596], w: [16, 13, 9] },
    cord: [[697, 430], [737, 419]],
    genital: [685, 481],
  },
  {
    name: 'Jaioberria',
    frac: '¼',
    n: 4,
    at: 0.8,
    red: 0,
    cx: 913,
    head: [[913, 205], [938, 209], [952, 226], [957, 248], [954, 268], [946, 282], [933, 292], [913, 297]],
    trunk: [[927, 293], [945, 300], [956, 318], [955, 360], [958, 400], [953, 430], [940, 447], [925, 457], [913, 462]],
    ear: [955, 257],
    eyeY: 260,
    eyeDx: 16,
    noseY: 272,
    mouthY: 283,
    arm: { sh: [950, 314], el: [966, 372], wr: [972, 416], hand: [975, 430], w: [13, 11, 9], hr: 10 },
    armL: { sh: [876, 314], el: [860, 372], wr: [854, 416], hand: [851, 430] },
    leg: { hip: [933, 452], kn: [938, 515], an: [931, 574], foot: [936, 594], w: [18, 13, 9] },
    navel: [913, 413],
    nipples: 16,
    hair: true,
    genital: [913, 462],
  },
];

const PY0 = 92; // vertex
const PH = 420; // vertex → heel
const PK = PH / SPAN;
const BOXW = 200;
const BOXC = [300, 530, 760];

/** Tapered limb through three joints, round at both ends. */
function chain(p: P2[], w: number[]) {
  const L: Pt[] = [];
  const R: Pt[] = [];
  p.forEach((q, i) => {
    const a = p[Math.max(0, i - 1)];
    const b = p[Math.min(p.length - 1, i + 1)];
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const l = Math.hypot(dx, dy) || 1;
    L.push([q[0] - (dy / l) * w[i], q[1] + (dx / l) * w[i]]);
    R.push([q[0] + (dy / l) * w[i], q[1] - (dx / l) * w[i]]);
  });
  const end = (q: P2, from: P2, r: number, back: boolean): Pt[] => {
    const a = Math.atan2(q[1] - from[1], q[0] - from[0]) + (back ? Math.PI : 0);
    return [-0.9, -0.45, 0, 0.45, 0.9].map((k) => [q[0] + Math.cos(a + k * 1.2) * r, q[1] + Math.sin(a + k * 1.2) * r]);
  };
  const n = p.length - 1;
  const tip = end(p[n], p[n - 1], w[n], false);
  const root = end(p[0], p[1], w[0], false);
  return smoothPath([...L, ...tip.reverse(), ...[...R].reverse(), ...root.reverse()], true, 0.5);
}

function ProportionFigure({ f, bx, uid }: { f: Fig; bx: number; uid: string }) {
  const id = `w5p${uid}`;
  const P = (p: P2): Pt => [bx + (p[0] - f.cx) * PK, PY0 + (p[1] - TOP) * PK];
  const M = (p: P2): Pt => [bx - (p[0] - f.cx) * PK, PY0 + (p[1] - TOP) * PK];
  const sym = (half: P2[]) => smoothPath([...half.map(P), ...[...half].reverse().slice(1, -1).map(M)], true, 0.5);
  const s = PK;
  const limb = (pts: P2[], w: number[], mirror: boolean) => chain(pts.map(mirror ? M : P), w.map((v) => v * s));
  const a = f.arm;
  const l = f.leg;
  const eyeY = PY0 + (f.eyeY - TOP) * s;
  const noseY = PY0 + (f.noseY - TOP) * s;
  const mouthY = PY0 + (f.mouthY - TOP) * s;
  const ear = P(f.ear);
  const earL = M(f.ear);
  const hd = P(f.head[0]);
  return (
    <g>
      <SkinDefs id={id} cx={bx - 50} cy={PY0 + 40} r={PH * 0.95} red={f.red} />
      {/* One sculpted body: legs, trunk, head, then the arms that lie over the trunk. */}
      <g filter={`url(#${id}-sculpt)`} fill={`url(#${id}-skin)`}>
        <path d={limb([l.hip, l.kn, l.an], l.w, false)} />
        <path d={limb([l.hip, l.kn, l.an], l.w, true)} />
        {[P(l.foot), M(l.foot)].map((q, i) => (
          <ellipse key={i} cx={q[0]} cy={q[1]} rx={l.w[2] * s * 1.35} ry={l.w[2] * s * 0.95} />
        ))}
        <path d={sym(f.trunk)} />
        {[ear, earL].map((q, i) => (
          <ellipse key={i} cx={q[0]} cy={q[1]} rx={6 * s} ry={10 * s} />
        ))}
        <path d={sym(f.head)} />
      </g>
      <g filter={`url(#${id}-sculpt)`} fill={`url(#${id}-skin)`}>
        <path d={limb([a.sh, a.el, a.wr], a.w, false)} />
        <path d={chain([f.armL.sh, f.armL.el, f.armL.wr].map(P), a.w.map((v) => v * s))} />
        {[
          [P(a.wr), P(a.hand)],
          [P(f.armL.wr), P(f.armL.hand)],
        ].map(([w, q], i) => {
          // A small mitten along the forearm: palm plus a thumb.
          const deg = (Math.atan2(q[1] - w[1], q[0] - w[0]) * 180) / Math.PI;
          return (
            <g key={i} transform={`rotate(${deg} ${q[0]} ${q[1]})`}>
              <ellipse cx={q[0]} cy={q[1]} rx={a.hr * s * 1.15} ry={a.hr * s * 0.78} />
              <ellipse cx={q[0] - a.hr * s * 0.2} cy={q[1] - a.hr * s * 0.62} rx={a.hr * s * 0.48} ry={a.hr * s * 0.3} transform={`rotate(-30 ${q[0]} ${q[1]})`} />
            </g>
          );
        })}
      </g>
      {/* Face: closed eyes, nose, mouth; ear fold; cord or navel; a little hair on the newborn. */}
      <g fill="none" stroke="#5e2622" strokeLinecap="round" pointerEvents="none">
        {[-1, 1].map((k) => (
          <path key={k} d={`M${bx + k * (f.eyeDx - 7) * s},${eyeY} q${k * 7 * s},${3.2 * s} ${k * 14 * s},${-0.6 * s}`} strokeWidth={1.6} opacity={0.75} />
        ))}
        <path d={`M${bx - 4 * s},${noseY} q${4 * s},${2.6 * s} ${8 * s},0`} strokeWidth={1.4} opacity={0.6} />
        <path d={`M${bx - 6 * s},${mouthY} q${6 * s},${3.4 * s} ${12 * s},0`} strokeWidth={1.6} opacity={0.7} />
        {[ear, earL].map((q, i) => (
          <path key={i} d={`M${q[0] + (i ? 1 : -1) * 1 * s},${q[1] - 5 * s} q${(i ? -1 : 1) * 3.5 * s},${5 * s} 0,${10 * s}`} strokeWidth={1.2} opacity={0.5} />
        ))}
        {f.hair &&
          [-14, -7, 0, 7, 14].map((k) => (
            <path key={k} d={`M${hd[0] + k * s * 1.6},${hd[1] + 9 * s} q${2 * s},${-6 * s} ${5 * s},${-7 * s}`} strokeWidth={1.3} opacity={0.55} />
          ))}
        {f.nipples &&
          [-1, 1].map((k) => <circle key={k} cx={bx + k * f.nipples! * s} cy={PY0 + (333 - TOP) * s} r={1.6} fill="#9b4d45" stroke="none" opacity={0.7} />)}
      </g>
      <g fill="none" stroke="#9b4d45" strokeWidth={1} strokeLinecap="round" opacity={0.5} pointerEvents="none">
        {[P(l.foot), M(l.foot)].map((q, i) =>
          [-0.5, 0, 0.5].map((k) => <path key={`${i}${k}`} d={`M${q[0] + k * l.w[2] * s},${q[1] + l.w[2] * s * 0.35} v${l.w[2] * s * 0.5}`} />),
        )}
      </g>
      {f.cord && (
        <g pointerEvents="none">
          <path d={`M${P(f.cord[0])[0]},${P(f.cord[0])[1]} q${12 * s},${-14 * s} ${(f.cord[1][0] - f.cord[0][0]) * s},${(f.cord[1][1] - f.cord[0][1]) * s}`} fill="none" stroke="#7d3029" strokeWidth={7.5 * s} strokeLinecap="round" opacity={0.65} />
          <path d={`M${P(f.cord[0])[0]},${P(f.cord[0])[1]} q${12 * s},${-14 * s} ${(f.cord[1][0] - f.cord[0][0]) * s},${(f.cord[1][1] - f.cord[0][1]) * s}`} fill="none" stroke="#e7a092" strokeWidth={5.5 * s} strokeLinecap="round" />
        </g>
      )}
      {f.navel && <ellipse cx={P(f.navel)[0]} cy={P(f.navel)[1]} rx={2.6} ry={1.8} fill="#9b4d45" opacity={0.7} />}
      <path d={`M${P(f.genital)[0] - 5 * s},${P(f.genital)[1] - 3 * s} q${5 * s},${8 * s} ${10 * s},0`} fill="none" stroke="#9b4d45" strokeWidth={1.3} opacity={0.55} />
    </g>
  );
}

const smoothK = (k: number) => k * k * (3 - 2 * k);

export function HeadProportions({ t }: SceneProps) {
  const uid = useId().replace(/[^A-Za-z0-9_-]/g, '');
  const final = seg(t, 0.9, 0.96);
  return (
    <g>
      {PFIGS.map((f, i) => {
        const bx = BOXC[i];
        const x0 = bx - BOXW / 2;
        // All lit at the start; each step lights its own figure (cross-fades over ~2 s); all lit again at the end.
        const rise = seg(t, f.at, f.at + 0.04);
        const next = PFIGS[i + 1]?.at;
        const mine = Math.min(rise, next === undefined ? 1 : 1 - seg(t, next, next + 0.04));
        const intro = 1 - seg(t, PFIGS[0].at, PFIGS[0].at + 0.04);
        const on = Math.max(mine, final, intro);
        const draw = Math.max(seg(t, f.at + 0.01, f.at + 0.1, smoothK), final);
        const band = PH / f.n;
        const seen = Math.max(seg(t, f.at + 0.06, f.at + 0.1), final);
        return (
          <g key={f.name}>
            {/* The box and its equal bands, as in the course figure. */}
            <g opacity={0.45 + 0.55 * on} pointerEvents="none">
              <rect x={x0} y={PY0} width={BOXW} height={PH} rx={6} fill="rgba(255,255,255,0.025)" stroke="rgba(255,255,255,0.22)" strokeWidth={1.2} />
              {Array.from({ length: f.n - 1 }, (_, j) => (
                <line key={j} x1={x0} x2={x0 + BOXW} y1={PY0 + band * (j + 1)} y2={PY0 + band * (j + 1)} stroke="rgba(255,255,255,0.28)" strokeWidth={1.2} />
              ))}
            </g>
            <Part id="buruaren-tamaina" show={0.35 + 0.65 * on}>
              <rect x={x0 + 1} y={PY0 + 1} width={BOXW - 2} height={band - 1} rx={5} fill="#ffb86b" opacity={0.07 + 0.09 * on} />
              <line x1={x0} x2={x0 + BOXW} y1={PY0 + band} y2={PY0 + band} stroke="#ffb86b" strokeWidth={2} opacity={0.5 + 0.5 * on} />
            </Part>
            <g opacity={0.55 + 0.45 * on}>
              <ProportionFigure f={f} bx={bx} uid={`${uid}${i}`} />
            </g>
            {/* Vertex–heel rule on the box's left edge; head-sized steps fill it one by one. */}
            <Part id="vertex-orpo-luzera" show={0.4 + 0.6 * on}>
              <line x1={x0 - 12} x2={x0 - 12} y1={PY0} y2={PY0 + PH} stroke="rgba(255,255,255,0.3)" strokeWidth={1.6} />
              {Array.from({ length: f.n + 1 }, (_, j) => (
                <line key={j} x1={x0 - 18} x2={x0 - 6} y1={PY0 + band * j} y2={PY0 + band * j} stroke="rgba(255,255,255,0.55)" strokeWidth={1.6} />
              ))}
              {Array.from({ length: f.n }, (_, j) => {
                const k = Math.max(0, Math.min(1, draw * f.n - j));
                return k > 0.01 ? <rect key={j} x={x0 - 16} y={PY0 + band * j + 3} width={8} height={(band - 6) * k} rx={4} fill={j === 0 ? '#ffb86b' : 'rgba(255,184,107,0.4)'} /> : null;
              })}
            </Part>
            {/* Read-out: the fraction, big, over the box. */}
            <g pointerEvents="none" opacity={0.4 + 0.6 * on}>
              <text x={bx} y={PY0 - 14} textAnchor="middle" fill="#ffb86b" fontSize={15} fontWeight={650} opacity={seen}>
                burua =
                <tspan fontSize={28} fontWeight={700} dx={6}>
                  {f.frac}
                </tspan>
              </text>
              <text x={bx} y={PY0 + PH + 52} textAnchor="middle" fill="#f1eee8" fontSize={16} fontWeight={650}>
                {f.name}
              </text>
              <text x={bx} y={PY0 + PH + 72} textAnchor="middle" fill="#8b867d" fontSize={11} letterSpacing="0.1em" style={{ textTransform: 'uppercase' }}>
                {`vertex–orpo luzeraren ${f.frac}`}
              </text>
            </g>
          </g>
        );
      })}

      <Label id="buruaren-tamaina" x={40} y={46} align="start" ax={BOXC[0] - BOXW / 2 + 10} ay={PY0 + 24} />
      <Label id="vertex-orpo-luzera" x={40} y={PY0 + PH * 0.72} align="start" ax={BOXC[0] - BOXW / 2 - 12} ay={PY0 + PH * 0.72} show={seg(t, 0.24, 0.28) * (1 - seg(t, 0.52, 0.55))} />
      <Note x={872} y={46} align="end" tone="accent">
        Altuera berdinera eskalatuta
      </Note>
    </g>
  );
}
