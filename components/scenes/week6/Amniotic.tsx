'use client';

import { Arrow, C, Flow, Label, Mark, Note, OnTop, Part, lerp, mix, rand, seg, smoothPath, type Pt, type SceneProps } from '@/components/kit';
import { fetusGeom, FetusFigure, placeFetus } from '@/components/scenes/week5/FetusFigure';
import { useId } from 'react';
import { CordRope } from './CordRope';
import { FA, FV } from './placentaSection';

const vis = (t: number, a: number, b = 2) => Math.min(a <= 0 ? 1 : seg(t, a, a + 0.03), 1 - seg(t, b - 0.03, b));
const f1 = (v: number) => v.toFixed(1);

/* ---------------------------------------------------------------------------------------------- */
/* Shared materials: uterine wall, decidua, fetal membranes, amniotic fluid, placenta               */
/* ---------------------------------------------------------------------------------------------- */

/** Gradients for one scene instance (ids from useId, since the frames page renders many at once). */
function WombDefs({ uid, c, r }: { uid: string; c: Pt; r: Pt }) {
  return (
    <defs>
      <radialGradient id={`${uid}-myo`} gradientUnits="userSpaceOnUse" cx={c[0]} cy={c[1]} r={Math.max(r[0], r[1]) * 1.45}>
        <stop offset="0.6" stopColor="#8a3440" />
        <stop offset="0.85" stopColor="#6e2630" />
        <stop offset="1" stopColor="#521a22" />
      </radialGradient>
      <radialGradient id={`${uid}-fluid`} gradientUnits="userSpaceOnUse" cx={c[0] - r[0] * 0.3} cy={c[1] - r[1] * 0.35} r={Math.max(r[0], r[1]) * 1.25}>
        <stop offset="0" stopColor="#3f6f9c" stopOpacity={0.62} />
        <stop offset="0.65" stopColor="#24456c" stopOpacity={0.6} />
        <stop offset="1" stopColor="#173152" stopOpacity={0.7} />
      </radialGradient>
      <radialGradient id={`${uid}-plac`} cx="0.5" cy="0.4" r="0.7">
        <stop offset="0" stopColor="#d3506c" />
        <stop offset="1" stopColor="#9c2942" />
      </radialGradient>
    </defs>
  );
}

/** Decidua lining the uterine cavity: a soft pink band just outside the fetal membranes. */
function Decidua({ c, r }: { c: Pt; r: Pt }) {
  return (
    <g>
      <ellipse cx={c[0]} cy={c[1]} rx={r[0] + 17} ry={r[1] + 17} fill="#a54a58" />
      <ellipse cx={c[0]} cy={c[1]} rx={r[0] + 10} ry={r[1] + 10} fill="#bf6673" />
    </g>
  );
}

/** Amniotic fluid: a clear blue body of liquid with a few cells and vernix flecks drifting in it. */
const FLECKS = Array.from({ length: 24 }, (_, i) => ({ a: rand(i * 2.7 + 5) * Math.PI * 2, r: Math.sqrt(rand(i * 4.1 + 7)) * 0.86, s: 1 + rand(i * 1.3 + 2) * 1.4, ph: rand(i * 3.3) * 6.28 }));
function Fluid({ uid, c, r, t, amount = 1 }: { uid: string; c: Pt; r: Pt; t: number; amount?: number }) {
  return (
    <g opacity={lerp(0.3, 1, amount)}>
      <ellipse cx={c[0]} cy={c[1]} rx={r[0]} ry={r[1]} fill={`url(#${uid}-fluid)`} />
      <g fill="#dbeeff" opacity={0.32}>
        {FLECKS.map((p, i) => (
          <circle key={i} cx={f1(c[0] + Math.cos(p.a) * p.r * r[0] + 6 * Math.sin(t * 9 + p.ph))} cy={f1(c[1] + Math.sin(p.a) * p.r * r[1] + 5 * Math.cos(t * 7 + p.ph))} r={f1(p.s)} />
        ))}
      </g>
      {/* a soft sheen along the upper wall: the cavity reads as liquid */}
      <path d={`M${f1(c[0] - r[0] * 0.78)},${f1(c[1] - r[1] * 0.42)} A${r[0] * 0.92},${r[1] * 0.92} 0 0 1 ${f1(c[0] + r[0] * 0.1)},${f1(c[1] - r[1] * 0.9)}`} fill="none" stroke="#cfe6ff" strokeWidth={5} strokeLinecap="round" opacity={0.12} />
    </g>
  );
}

/** Fetal membranes: chorion laeve outside, the amnion lining the cavity (fused, solid). */
function Membranes({ c, r }: { c: Pt; r: Pt }) {
  return (
    <g fill="none">
      <ellipse cx={c[0]} cy={c[1]} rx={r[0] + 5} ry={r[1] + 5} stroke="#e1c7d0" strokeWidth={3.2} opacity={0.75} />
      <ellipse cx={c[0]} cy={c[1]} rx={r[0] + 1.2} ry={r[1] + 1.2} stroke="#9fc3e6" strokeWidth={2.2} />
    </g>
  );
}

/**
 * The placenta as a lens in the uterine wall whose fetal surface is the cavity wall: cotyledons
 * separated by septa, and the chorionic plate with the cord's vessels fanning out from the insertion.
 * Drawn inside clips that keep it out of the cavity and inside the uterus.
 */
function PlacentaLens({ uid, pc, rx, ry, tan, cav, cr, ins }: { uid: string; pc: Pt; rx: number; ry: number; tan: number; cav: Pt; cr: Pt; ins: number }) {
  const on = (a: number, d: number): Pt => [cav[0] + (cr[0] + d) * Math.cos(a), cav[1] + (cr[1] + d) * Math.sin(a)];
  const span = (rx / Math.max(cr[0], cr[1])) * 0.95;
  const arc = (d: number, a0: number, a1: number) => smoothPath(Array.from({ length: 13 }, (_, i) => on(lerp(a0, a1, i / 12), d)), false);
  return (
    <g>
      <ellipse cx={pc[0]} cy={pc[1]} rx={rx} ry={ry} transform={`rotate(${f1(tan)} ${f1(pc[0])} ${f1(pc[1])})`} fill={`url(#${uid}-plac)`} stroke="#6e1a30" strokeWidth={2} />
      {/* septa between the cotyledons, from the plate towards the basal plate */}
      <g stroke="#7c1f36" strokeWidth={1.5} opacity={0.75} strokeLinecap="round">
        {[-0.72, -0.4, -0.1, 0.22, 0.52, 0.8].map((k) => {
          const a = ins + k * span;
          const p0 = on(a, 8);
          const p1 = on(a, 30 + 8 * Math.cos(k * 3));
          return <path key={k} d={`M${f1(p0[0])},${f1(p0[1])} L${f1(p1[0])},${f1(p1[1])}`} />;
        })}
      </g>
      {/* chorionic plate (fetal surface) with the cord vessels branching over it */}
      <path d={arc(3, ins - span, ins + span)} fill="none" stroke="#efb3c3" strokeWidth={4} strokeLinecap="round" />
      <path d={arc(6.5, ins - span * 0.8, ins + span * 0.8)} fill="none" stroke={C.vein} strokeWidth={1.8} strokeLinecap="round" />
      <path d={arc(9.5, ins - span * 0.7, ins + span * 0.7)} fill="none" stroke={C.artery} strokeWidth={1.5} strokeLinecap="round" />
    </g>
  );
}

/* ---------------------------------------------------------------------------------------------- */
/* AmnioticFluid — stage `likido-amniotikoa`, view `bolumena`                                       */
/* ---------------------------------------------------------------------------------------------- */

const UTERUS: Pt[] = [
  [500, 66], [660, 90], [772, 190], [812, 340], [770, 480], [660, 566], [500, 592],
  [340, 566], [230, 480], [188, 340], [228, 190], [340, 90],
];

const PLACENTA_C: Pt = [652, 138];

/**
 * Amniotic-fluid volume (ml): 10 w. 30 ml → 30 w. 200–500 ml → 37–38 w. 800–1000 ml. The gauge
 * holds at 10 weeks until the volume step (.3), sweeps through the three reference points during it,
 * and stays at term afterwards.
 */
const VOL_MARKS = [
  { lo: 30, hi: 30, text: '10. a: 30 ml', at: 0.3 },
  { lo: 200, hi: 500, text: '30. a: 200–500 ml', at: 0.33 },
  { lo: 800, hi: 1000, text: '37.–38. a: 800–1000 ml', at: 0.39 },
];
/* ---------------------------------------------------------------------------------------------- */
/* Swallowing cycle (degluzioa): routed arrows with numbered chips, drawn (not only animated)       */
/* ---------------------------------------------------------------------------------------------- */

/** Catmull-Rom samples through `pts`, pushed `side` units to the left of the direction of travel. */
function besides(pts: Pt[], side: number, per = 10): Pt[] {
  const out: Pt[] = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(pts.length - 1, i + 2)];
    for (let j = 0; j < per; j++) {
      const u = j / per;
      const u2 = u * u;
      const u3 = u2 * u;
      const c = (a: number, b: number, d: number, e: number) => 0.5 * (2 * b + (-a + d) * u + (2 * a - 5 * b + 4 * d - e) * u2 + (-a + 3 * b - 3 * d + e) * u3);
      out.push([c(p0[0], p1[0], p2[0], p3[0]), c(p0[1], p1[1], p2[1], p3[1])]);
    }
  }
  out.push(pts[pts.length - 1]);
  return out.map((q, i) => {
    const a = out[Math.max(0, i - 1)];
    const b = out[Math.min(out.length - 1, i + 1)];
    const l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
    return [q[0] + ((b[1] - a[1]) / l) * side, q[1] - ((b[0] - a[0]) / l) * side];
  });
}

function upTo(pts: Pt[], p: number): Pt[] {
  if (p >= 1) return pts;
  const n = Math.max(2, Math.round(pts.length * Math.max(0, p)));
  return pts.slice(0, n);
}

/** A routed arrow: dark casing, the colour, a head, and moving dashes when motion is allowed. */
function Route({ pts, p, color, show, reduced }: { pts: Pt[]; p: number; color: string; show: number; reduced?: boolean }) {
  if (show <= 0.02 || p <= 0.02) return null;
  const q = upTo(pts, p);
  const d = `M${q.map((v) => `${f1(v[0])},${f1(v[1])}`).join('L')}`;
  const e = q[q.length - 1];
  const b = q[Math.max(0, q.length - 3)];
  const a = Math.atan2(e[1] - b[1], e[0] - b[0]);
  const h = 11;
  const tip = `M${f1(e[0] + Math.cos(a) * 5)},${f1(e[1] + Math.sin(a) * 5)} L${f1(e[0] - Math.cos(a - 0.5) * h)},${f1(e[1] - Math.sin(a - 0.5) * h)} L${f1(e[0] - Math.cos(a + 0.5) * h)},${f1(e[1] - Math.sin(a + 0.5) * h)}Z`;
  return (
    <g opacity={show} pointerEvents="none" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path d={d} stroke="rgba(6,10,20,0.8)" strokeWidth={6.4} />
      <path d={tip} fill="rgba(6,10,20,0.8)" stroke="rgba(6,10,20,0.8)" strokeWidth={3.4} />
      <path d={d} stroke={color} strokeWidth={3} />
      <path d={tip} fill={color} />
      {!reduced && <path d={d} stroke="rgba(255,255,255,0.7)" strokeWidth={1.2} strokeDasharray="2 11" className="dash-flow" />}
    </g>
  );
}

function Chip({ at, n, text, show }: { at: Pt; n: number; text: string; show: number }) {
  if (show <= 0.02) return null;
  const w = text.length * 6.3 + 30;
  return (
    <OnTop>
      <g opacity={show} pointerEvents="none">
        <rect x={f1(at[0] - w / 2)} y={f1(at[1] - 11)} width={f1(w)} height={22} rx={11} fill="rgba(8,14,26,0.92)" stroke="#8ecae6" strokeOpacity={0.7} />
        <circle cx={f1(at[0] - w / 2 + 11)} cy={f1(at[1])} r={7.5} fill="#8ecae6" />
        <text x={f1(at[0] - w / 2 + 11)} y={f1(at[1])} dy="0.35em" textAnchor="middle" fontSize={10} fontWeight={800} fill="#0b1626">
          {n}
        </text>
        <text x={f1(at[0] - w / 2 + 23)} y={f1(at[1])} dy="0.35em" fontSize={11.5} fontWeight={650} fill="#dceefa">
          {text}
        </text>
      </g>
    </OnTop>
  );
}

function volumeAt(t: number) {
  const a = seg(t, 0.3, 0.35);
  const b = seg(t, 0.355, 0.405);
  const ml = t < 0.355 ? lerp(30, 350, a) : lerp(350, 900, b);
  const wk = t < 0.355 ? lerp(10, 30, a) : lerp(30, 37.5, b);
  return { ml: Math.round(ml), week: b > 0.98 ? '37.–38. asteak' : `${Math.round(wk)}. astea` };
}

// Graduated cylinder in the lower-right gutter (clear of the labels above, the uterus and the scene tools).
const GAUGE = { x: 944, w: 30, y0: 556, h: 160 };
/** A placed fetus turned by `deg` round `c`: points, inverse and transform stay consistent. */
function turned(pl: ReturnType<typeof placeFetus>, deg: number, c: Pt) {
  const a = (deg * Math.PI) / 180;
  const rot = (p: Pt, k: number): Pt => {
    const dx = p[0] - c[0];
    const dy = p[1] - c[1];
    return [c[0] + dx * Math.cos(k * a) - dy * Math.sin(k * a), c[1] + dx * Math.sin(k * a) + dy * Math.cos(k * a)];
  };
  return { ...pl, xf: (p: readonly number[]) => rot(pl.xf(p), 1), inv: (p: readonly number[]) => pl.inv(rot([p[0], p[1]], -1)), transform: `rotate(${f1(deg)} ${f1(c[0])} ${f1(c[1])}) ${pl.transform}` };
}
/** Step 1: droplets the amnion cells secrete into the cavity (angle round the wall, start offset). */
const DROPS = Array.from({ length: 16 }, (_, i) => ({ a: (i / 16) * Math.PI * 2 + rand(i * 3.3) * 0.3, k: rand(i * 5.1) * 0.5 }));
const gaugeY = (ml: number) => GAUGE.y0 - (Math.min(ml, 1000) / 1000) * GAUGE.h;

export function AmnioticFluid({ t, reduced }: SceneProps) {
  const uid = useId().replace(/:/g, '');
  const { ml, week } = volumeAt(t);
  const fill = (ml - 30) / 870; // amnios barrunbea filling out with the volume
  const cavRx = lerp(232, 258, fill);
  const cavRy = lerp(196, 220, fill);
  const cavC: Pt = [500, 330];
  const cavR: Pt = [cavRx, cavRy];

  const pose = {
    kick: 0.5 + 0.5 * Math.sin(t * 42),
    suck: 0.5 + 0.5 * Math.sin(t * 23 + 1),
    breathe: Math.sin(t * 31),
    nod: 6 * Math.sin(t * 17),
  };
  const week5 = 24;
  // Step 4 (functions: the fluid lets the fetus move): it turns and drifts in the fluid, and stays there.
  const swim = seg(t, 0.47, 0.56);
  const place = turned(placeFetus(19, 9, lerp(560, 538, swim), lerp(372, 350, swim)), lerp(0, -16, swim), [lerp(560, 538, swim), lerp(372, 350, swim)]);
  const g = fetusGeom(week5, pose);
  const mouth = place.xf(g.mouth);
  const cordBase = place.xf(g.cordBase);
  const hip = place.xf(g.hip);

  const sourcesA = seg(t, 0.14, 0.2) * (1 - seg(t, 0.3, 0.34));
  // Step 1 (0–.14): the fluid is secreted by the amnion; seen later, the cavity is simply full.
  const secrete = seg(t, 0.005, 0.12);
  const drops = 1 - seg(t, 0.13, 0.16);
  const functionsA = vis(t, 0.46, 0.58);
  const swallowA = vis(t, 0.58, 1);

  // The cord leaves the belly, loops round in front of the knees and rises to the placenta's fetal
  // surface, which lies on the cavity wall right under the placenta.
  const ins = Math.atan2((PLACENTA_C[1] - cavC[1]) / cavRy, (PLACENTA_C[0] - cavC[0]) / cavRx);
  const insertion: Pt = [cavC[0] + (cavRx + 10) * Math.cos(ins), cavC[1] + (cavRy + 10) * Math.sin(ins)];
  const wallTan = (Math.atan2(cavRy * Math.cos(ins), -cavRx * Math.sin(ins)) * 180) / Math.PI;
  const plC: Pt = [cavC[0] + (cavRx + 6) * Math.cos(ins), cavC[1] + (cavRy + 6) * Math.sin(ins)];
  const cordPts: Pt[] = [cordBase, [cordBase[0] + 34, cordBase[1] + 22], [cordBase[0] + 92, cordBase[1] - 6], [cordBase[0] + 104, cordBase[1] - 96], [insertion[0] + 22, insertion[1] + 110], [insertion[0] + 2, insertion[1] + 36], insertion];
  const cordD = smoothPath(cordPts, false, 0.5);
  const cordMid = cordPts[3];
  const clipId = `${uid}-wall`;

  // Where the fluid comes from (numbered as in the note): amnios wall, fetal urine, decidua through the
  // membranes, intervillous blood through the chorionic plate, fetal lungs/gut.
  const wallAt = (deg: number, d: number): Pt => [cavC[0] + (cavRx + d) * Math.cos((deg * Math.PI) / 180), cavC[1] + (cavRy + d) * Math.sin((deg * Math.PI) / 180)];
  const sources: [Pt, Pt][] = [
    [wallAt(196, -2), wallAt(196, -50)],
    [[hip[0] + 4, hip[1] + 16], [hip[0] - 18, hip[1] + 46]],
    [wallAt(150, 13), wallAt(150, -36)],
    [[plC[0] - 14, plC[1] + 22], [plC[0] - 70, plC[1] + 70]],
    [[mouth[0] - 6, mouth[1] + 4], [mouth[0] - 46, mouth[1] - 10]],
  ];

  // Swallowing cycle routes (the cord route runs beside the rope, on its outer side).
  const swallowIn = besides([[mouth[0] - 26, mouth[1] - 68], [mouth[0] - 18, mouth[1] - 34], [mouth[0] - 5, mouth[1] - 6]], 0, 6);
  const swallowCord = besides(cordPts.slice(0, -1), -15, 8);
  const swallowOut = besides([[hip[0] + 2, hip[1] + 14], [hip[0] - 14, hip[1] + 38], [hip[0] - 44, hip[1] + 58]], 0, 6);
  const chipCord: Pt = [cordPts[3][0] + 92, cordPts[3][1] + 4];

  return (
    <g>
      <WombDefs uid={uid} c={cavC} r={cavR} />
      {/* Uterine wall: myometrium, then the decidua lining the cavity */}
      <path d={smoothPath(UTERUS, true, 0.55)} fill={`url(#${uid}-myo)`} stroke="#3e1218" strokeWidth={2} />
      <path d={smoothPath(UTERUS, true, 0.55)} fill="none" stroke="#e4b3b8" strokeWidth={1.4} opacity={0.4} />
      <Decidua c={cavC} r={cavR} />
      {/* opaque ground under the cavity, so the fluid stays blue when its part is dimmed */}
      <ellipse cx={cavC[0]} cy={cavC[1]} rx={cavRx} ry={cavRy} fill="#0b1626" />

      {/* Amnios barrunbea filled with likido amniotikoa; its size a proxy for the growing volume */}
      <Part id="amnios-barrunbea">
        <ellipse cx={cavC[0]} cy={cavC[1]} rx={cavRx} ry={cavRy} fill="#0d1a2c" />
        <ellipse cx={cavC[0]} cy={cavC[1]} rx={cavRx} ry={cavRy} fill={C.amnionCavity} />
      </Part>
      <Part id="likido-amniotikoa">
        <Fluid uid={uid} c={cavC} r={cavR} t={t} amount={secrete} />
        {/* Step 1: the amnion's own cells secrete the first fluid: droplets leave the wall and the cavity fills. */}
        {drops > 0.02 &&
          DROPS.map((d, i) => {
            const u = Math.max(0, Math.min(1, secrete * 1.6 - d.k));
            if (u <= 0) return null;
            const rr = lerp(1, 0.8, u);
            return <circle key={i} cx={f1(cavC[0] + Math.cos(d.a) * cavRx * rr)} cy={f1(cavC[1] + Math.sin(d.a) * cavRy * rr)} r={lerp(2.5, 5, u)} fill="#bfe3ff" opacity={drops * (1 - 0.6 * u)} />;
          })}
      </Part>
      <Part id="amniosa">
        <Membranes c={cavC} r={cavR} />
      </Part>

      <Part id="fetu-aroa" quiet>
        <g transform={place.transform}>
          <FetusFigure
            id="w6af"
            week={week5}
            pose={pose}
            s={place.s}
            vernix={0.4}
            cord={
              <Part id="zilborrestea">
                <CordRope pts={cordPts.map(place.inv)} w={12 / place.s} turns={9} />
              </Part>
            }
          />
        </g>
      </Part>

      {/* Placenta: a lens in the uterine wall whose fetal surface is the cavity wall itself (drawn over the cord's insertion) */}
      <clipPath id={clipId}>
        <path d={`M0,0H1000V640H0Z M${cavC[0] - cavRx},${cavC[1]} a${cavRx},${cavRy} 0 1,0 ${cavRx * 2},0 a${cavRx},${cavRy} 0 1,0 ${-cavRx * 2},0Z`} clipRule="evenodd" />
      </clipPath>
      <clipPath id={`${clipId}-u`}>
        <path d={smoothPath(UTERUS, true, 0.55)} />
      </clipPath>
      <Part id="karena" quiet>
        <g clipPath={`url(#${clipId})`}>
          <g clipPath={`url(#${clipId}-u)`}>
            <PlacentaLens uid={uid} pc={plC} rx={104} ry={44} tan={wallTan} cav={cavC} cr={cavR} ins={ins} />
          </g>
        </g>
      </Part>

      {/* Sources: solid arrows with numbered chips, in the order of the note */}
      {sourcesA > 0.02 &&
        sources.map(([from, to], i) => (
          <g key={i}>
            {/* where each source pours in: a soft cloud of new fluid at the arrow's end */}
            <circle cx={to[0]} cy={to[1]} r={6 + 16 * seg(t, 0.17 + i * 0.012, 0.26 + i * 0.012)} fill="#8ecae6" opacity={0.28 * sourcesA} />
            <Arrow from={from} to={to} bend={0.12} color="#8ecae6" width={3} head={10} show={sourcesA} progress={reduced ? 1 : seg(t, 0.14 + i * 0.012, 0.19 + i * 0.012)} />
            <g opacity={sourcesA}>
              <circle cx={from[0]} cy={from[1]} r={8} fill="#0b1626" stroke="#8ecae6" strokeWidth={1.4} />
              <text x={from[0]} y={from[1]} dy="0.35em" textAnchor="middle" fontSize={10} fontWeight={700} fill="#cfe6f5">
                {i + 1}
              </text>
            </g>
          </g>
        ))}

      {/* Swallowing cycle: mouth → gut → blood → placenta/kidneys → back to the cavity */}
      {!reduced && swallowA > 0.02 && (
        <g opacity={swallowA}>
          <Flow d={`M${mouth[0]},${mouth[1]} Q${cordBase[0] - 20},${cordBase[1] + 10} ${cordBase[0]},${cordBase[1]}`} n={3} dur={3.2} r={2.2} color="#8ecae6" />
          <Flow d={cordD} n={3} dur={3.6} r={2.2} color="#8ecae6" />
          <Flow d={`M${PLACENTA_C[0] - 20},${PLACENTA_C[1] + 20} Q${cavC[0] - 100},${cavC[1] - 120} ${mouth[0] - 40},${mouth[1] - 60}`} n={2} dur={5} r={2} color="#5fa8cc" />
        </g>
      )}
      {/* The cycle, drawn: 1 fluid swallowed at the mouth; 2 from the gut into the blood, along the cord to the
          placenta; 3 through the kidneys back out as urine into the cavity. */}
      {swallowA > 0.02 && (
        <>
          <Route pts={swallowIn} p={seg(t, 0.585, 0.612)} color="#8ecae6" show={swallowA} reduced={reduced} />
          <Route pts={swallowCord} p={seg(t, 0.612, 0.642)} color="#8ecae6" show={swallowA} reduced={reduced} />
          <Route pts={swallowOut} p={seg(t, 0.642, 0.665)} color="#8ecae6" show={swallowA} reduced={reduced} />
          <Chip at={[swallowIn[0][0] - 4, swallowIn[0][1] - 16]} n={1} text="irentsi" show={swallowA * seg(t, 0.59, 0.61)} />
          <Chip at={chipCord} n={2} text="odolera → karenara" show={swallowA * seg(t, 0.62, 0.64)} />
          <Chip at={[swallowOut[swallowOut.length - 1][0] - 30, swallowOut[swallowOut.length - 1][1] + 24]} n={3} text="giltzurrunak → gernua" show={swallowA * seg(t, 0.648, 0.665)} />
        </>
      )}
      <Mark id="degluzioa" x={mouth[0]} y={mouth[1]} rx={14} show={swallowA} />

      {/* Volume gauge: a graduated cylinder, bottom-right, clear of the toolbar/pill zones */}
      <g>
        <rect x={GAUGE.x} y={GAUGE.y0 - GAUGE.h - 8} width={GAUGE.w} height={GAUGE.h + 8} rx={4} fill="#0b1626" stroke="#8ecae6" strokeWidth={1.4} opacity={0.9} />
        {ml > 1 && (
          <>
            <rect x={GAUGE.x + 2} y={gaugeY(ml)} width={GAUGE.w - 4} height={GAUGE.y0 - gaugeY(ml) - 1} rx={2.5} fill="#5fa8cc" opacity={0.85} />
            <ellipse cx={GAUGE.x + GAUGE.w / 2} cy={gaugeY(ml)} rx={GAUGE.w / 2 - 2} ry={2.4} fill="#bfe0f2" opacity={0.8} />
          </>
        )}
        {/* scale: a tick every 100 ml, a longer one every 250 */}
        <g stroke="#8fa3c4" strokeWidth={1}>
          {Array.from({ length: 11 }, (_, i) => (
            <line key={i} x1={GAUGE.x} x2={GAUGE.x + (i % 5 === 0 ? 10 : 5)} y1={gaugeY(i * 100)} y2={gaugeY(i * 100)} />
          ))}
        </g>
        <text x={GAUGE.x + GAUGE.w / 2} y={gaugeY(1000) - 12} textAnchor="middle" fontSize={9} fill="#8fa3c4">
          1 L
        </text>
        <text x={GAUGE.x + GAUGE.w / 2} y={GAUGE.y0 + 18} textAnchor="middle" fontSize={14} fontWeight={700} fill="#cfe6f5">
          {ml} ml
        </text>
        <text x={GAUGE.x + GAUGE.w / 2} y={GAUGE.y0 + 33} textAnchor="middle" fontSize={10.5} fill="#8fa3c4">
          {week}
        </text>
        {/* Reference volumes from the notes, ticked off as the gauge passes them */}
        {VOL_MARKS.map((m) => {
          const o = vis(t, m.at);
          const y0 = gaugeY(m.hi);
          const y1 = gaugeY(m.lo);
          return (
            <g key={m.text} opacity={o}>
              <path d={`M${GAUGE.x - 2},${y0} h-6 V${Math.max(y1, y0 + 1)} h6`} fill="none" stroke="#fbbf24" strokeWidth={1.3} />
              <text x={GAUGE.x - 12} y={(y0 + y1) / 2 + 3.5} textAnchor="end" fontSize={10.5} fill="#fde68a">
                {m.text}
              </text>
            </g>
          );
        })}
      </g>

      {/* Labels — left gutter */}
      <Label id="likido-amniotikoa" x={200} y={100} ax={cavC[0] - cavRx * 0.5} ay={cavC[1] - cavRy * 0.6} />
      <Label id="amniosa" x={200} y={150} ax={cavC[0] - cavRx - 1} ay={cavC[1] - 30} />
      <Label id="amnios-barrunbea" x={200} y={200} ax={cavC[0] - 60} ay={cavC[1] + 60} />
      <Label id="fetu-aroa" x={200} y={250} ax={place.xf([0, 40])[0]} ay={place.xf([0, 40])[1]} />
      <Label id="degluzioa" x={200} y={300} ax={mouth[0]} ay={mouth[1]} show={swallowA} />

      {/* Labels — right gutter */}
      <Label id="karena" x={800} y={150} ax={plC[0] + 30} ay={plC[1] - 18} />
      <Label id="zilborrestea" x={800} y={200} ax={cordMid[0]} ay={cordMid[1]} />

      <Note x={500} y={612} tone="dim" show={sourcesA > 0.02 ? 1 : 0}>
        Jatorria: 1 amniosa · 2 fetuaren gernua · 3 dezidua · 4 biloxka-odola · 5 arnas/digestio aparatua
      </Note>
      <Note x={500} y={612} tone="dim" show={functionsA}>
        Funtzioak: hazkuntza, mugimenduak, astinketak baretu, itsaste-eragozpena
      </Note>
      <Note x={500} y={612} tone="accent" show={swallowA}>
        Degluzioa: ~400 ml/egun, hesteetatik odolera eta karena/giltzurrunetara
      </Note>
    </g>
  );
}

/* ---------------------------------------------------------------------------------------------- */
/* PrenatalTests — stage `likido-amniotikoa`, view `teknikak`                                       */
/* ---------------------------------------------------------------------------------------------- */

const U2: Pt[] = [
  [500, 150], [640, 168], [730, 250], [760, 360], [726, 466], [630, 528], [500, 546],
  [370, 528], [274, 466], [240, 360], [270, 250], [360, 168],
];
const PLAC2: Pt = [352, 230];
const CAV2: Pt = [500, 352];
const CAV2_R: Pt = [190, 170];
/** Where a placenta centred towards `toward` sits on the cavity wall: its centre, the wall's tangent (°), the cord insertion (just inside the wall) and its angle. */
function wallSpot(c: Pt, r: Pt, toward: Pt) {
  const a = Math.atan2((toward[1] - c[1]) / r[1], (toward[0] - c[0]) / r[0]);
  const at = (d: number): Pt => [c[0] + (r[0] + d) * Math.cos(a), c[1] + (r[1] + d) * Math.sin(a)];
  return { a, c: at(6), ins: at(10), tan: (Math.atan2(r[1] * Math.cos(a), -r[0] * Math.sin(a)) * 180) / Math.PI };
}
// Mother's abdominal wall: a quadratic whose x runs linearly, so its height at any x is closed-form.
const wallY = (x: number) => {
  const k = (x - 100) / 800;
  return 126 - 156 * k * (1 - k);
};
// Ultrasound-guided into a free pocket of fluid, well clear of the fetus and the placenta.
const NEEDLE_X = 468;
const NEEDLE_B: Pt = [NEEDLE_X, 318];
/** Needle length from hub to tip: at full depth the syringe barrel stays just above the skin. */
const NEEDLE_L = 250;
const VAGINA_A: Pt = [500, 546];
const VAGINA_B: Pt = [500, 604];
// Cervix: a narrow neck under the uterus (its top hides inside the uterine silhouette).
const CERVIX: Pt[] = [[452, 520], [480, 556], [482, 590], [490, 606], [510, 606], [518, 590], [520, 556], [548, 520]];
const PROBE: Pt = [566, wallY(566)];
const PROBE_TILT = (Math.atan2(-156 * (1 - 2 * ((566 - 100) / 800)), 800) * 180) / Math.PI;
/** Ultrasound monitor in the right gutter (below the toolbar zone), fed by the probe's cable. */
const MON = { x: 818, y: 246, w: 156, h: 104 };
/** The serum sample: a blood tube in the lower right. */
const TUBE: Pt = [878, 470];
/** Fixed speckle for the echo image. */
const SPECKLE = Array.from({ length: 70 }, (_, i) => ({ a: (rand(i * 1.7 + 3) - 0.5) * 1.05, r: 12 + rand(i * 2.9 + 1) * 76, o: 0.15 + rand(i * 0.7) * 0.4 }));

export function PrenatalTests({ t }: SceneProps) {
  const uid = useId().replace(/:/g, '');
  const probeA = seg(t, 0.68, 0.76) * (1 - seg(t, 0.94, 1));
  const bloodA = vis(t, 0.78);
  const tubeFill = seg(t, 0.8, 0.83);
  const tubeSep = seg(t, 0.825, 0.845);
  const needleA = seg(t, 0.86, 0.94);
  const cvsA = seg(t, 0.9, 0.98);

  // The syringe slides in from above: the tip crosses the skin early and ends in a free pocket of fluid.
  const needleTip: Pt = [NEEDLE_X, lerp(wallY(NEEDLE_X) + 6, NEEDLE_B[1], needleA)];
  const hubY = needleTip[1] - NEEDLE_L;
  const draw = seg(needleA, 0.85, 1);
  // Through the cervix and up between the uterine wall and the membranes (never through the amniotic cavity) to the villi.
  const inWall = (deg: number, d: number): Pt => [CAV2[0] + (CAV2_R[0] + d) * Math.cos((deg * Math.PI) / 180), CAV2[1] + (CAV2_R[1] + d) * Math.sin((deg * Math.PI) / 180)];
  const cvsEnd = inWall(212, 12);
  const catheterD = smoothPath([VAGINA_B, VAGINA_A, inWall(100, 9), inWall(140, 10), inWall(180, 10), cvsEnd], false, 0.5);
  const catheterLen = 1 - cvsA;
  const place = placeFetus(13, 6.5, 560, 380);
  const cordBase = place.xf(fetusGeom(22).cordBase);
  const pl = wallSpot(CAV2, CAV2_R, PLAC2);
  const cordPts: Pt[] = [cordBase, [cordBase[0] + 6, cordBase[1] + 30], [cordBase[0] - 60, cordBase[1] + 52], [412, 372], [pl.ins[0] + 16, pl.ins[1] + 60], pl.ins];
  const clipId = `${uid}-wall2`;
  // Ultrasound pulses: rings leaving the probe, pure functions of t.
  const pulses = [0, 1, 2].map((i) => (t * 24 + i / 3) % 1);
  const fanS = Math.sin((24 * Math.PI) / 180);
  const fanC = Math.cos((24 * Math.PI) / 180);
  // The probe cable's free end (probe-local (56,-92)) in scene coordinates, then on to the monitor.
  const tr = (PROBE_TILT * Math.PI) / 180;
  const cableEnd: Pt = [PROBE[0] + 56 * Math.cos(tr) + 92 * Math.sin(tr), PROBE[1] + 56 * Math.sin(tr) - 92 * Math.cos(tr)];
  const monIn: Pt = [MON.x, MON.y + MON.h * 0.7];
  const fanO: Pt = [MON.x + MON.w / 2, MON.y + 10];

  return (
    <g>
      <WombDefs uid={uid} c={CAV2} r={CAV2_R} />
      <defs>
        {/* The abdominal wall fades out at both ends instead of stopping in round caps. */}
        <linearGradient id={`${clipId}-abd`} gradientUnits="userSpaceOnUse" x1={100} y1={0} x2={900} y2={0}>
          <stop offset="0" stopColor="#e3a7ac" stopOpacity="0" />
          <stop offset="0.14" stopColor="#e3a7ac" stopOpacity="0.9" />
          <stop offset="0.86" stopColor="#e3a7ac" stopOpacity="0.9" />
          <stop offset="1" stopColor="#e3a7ac" stopOpacity="0" />
        </linearGradient>
        <linearGradient id={`${clipId}-abd-d`} gradientUnits="userSpaceOnUse" x1={100} y1={0} x2={900} y2={0}>
          <stop offset="0" stopColor="#5a2a30" stopOpacity="0" />
          <stop offset="0.14" stopColor="#5a2a30" />
          <stop offset="0.86" stopColor="#5a2a30" />
          <stop offset="1" stopColor="#5a2a30" stopOpacity="0" />
        </linearGradient>
        <radialGradient id={`${clipId}-fan`} gradientUnits="userSpaceOnUse" cx={0} cy={0} r={230}>
          <stop offset="0" stopColor="#8ecae6" stopOpacity="0.3" />
          <stop offset="1" stopColor="#8ecae6" stopOpacity="0" />
        </radialGradient>
        <clipPath id={`${clipId}-scr`}>
          <rect x={MON.x + 5} y={MON.y + 5} width={MON.w - 10} height={MON.h - 10} rx={3} />
        </clipPath>
      </defs>

      {/* Mother's abdominal wall: skin over a thin dark layer, fading at the ends */}
      <path d="M100,126 Q500,48 900,126" fill="none" stroke={`url(#${clipId}-abd-d)`} strokeWidth={11} />
      <path d="M100,126 Q500,48 900,126" fill="none" stroke={`url(#${clipId}-abd)`} strokeWidth={7} />

      {/* Uterus and cervix as one organ: both outlines first, then both fills, so no seam shows */}
      <g fill="none" stroke="#3e1218" strokeWidth={4} strokeLinejoin="round">
        <path d={smoothPath(U2, true, 0.55)} />
        <path d={smoothPath(CERVIX, true, 0.5)} />
      </g>
      <path d={smoothPath(CERVIX, true, 0.5)} fill="#6a252d" />
      <path d={smoothPath(U2, true, 0.55)} fill={`url(#${uid}-myo)`} />
      {/* Cervical canal, opening at the external os */}
      <path d={`M${VAGINA_A[0]},${VAGINA_A[1] - 4} L${VAGINA_B[0]},${VAGINA_B[1] + 1}`} stroke="#2a0c10" strokeWidth={3} strokeLinecap="round" />

      <Decidua c={CAV2} r={CAV2_R} />
      <ellipse cx={CAV2[0]} cy={CAV2[1]} rx={CAV2_R[0]} ry={CAV2_R[1]} fill="#0d1a2c" />
      <Fluid uid={uid} c={CAV2} r={CAV2_R} t={t} />
      <Membranes c={CAV2} r={CAV2_R} />

      <g transform={place.transform}>
        <FetusFigure
          id="w6pt"
          week={22}
          s={place.s}
          cord={
            <Part id="zilborrestea" quiet>
              <CordRope pts={cordPts.map(place.inv)} w={9 / place.s} turns={8} />
            </Part>
          }
        />
      </g>

      {/* Placenta as a lens in the wall; its fetal surface is the cavity wall (over the cord's insertion) */}
      <clipPath id={clipId}>
        <path d={`M0,0H1000V640H0Z M${CAV2[0] - CAV2_R[0]},${CAV2[1]} a${CAV2_R[0]},${CAV2_R[1]} 0 1,0 ${CAV2_R[0] * 2},0 a${CAV2_R[0]},${CAV2_R[1]} 0 1,0 ${-CAV2_R[0] * 2},0Z`} clipRule="evenodd" />
      </clipPath>
      <clipPath id={`${clipId}-u`}>
        <path d={smoothPath(U2, true, 0.55)} />
      </clipPath>
      <Part id="karena" quiet>
        <g clipPath={`url(#${clipId})`}>
          <g clipPath={`url(#${clipId}-u)`}>
            <PlacentaLens uid={uid} pc={pl.c} rx={84} ry={36} tan={pl.tan} cav={CAV2} cr={CAV2_R} ins={pl.a} />
          </g>
        </g>
      </Part>

      {/* Ekografia: transducer resting on the abdomen, its beam a fan of pulses into the uterus, its image on the monitor */}
      <Part id="ekografia" show={probeA > 0.02 ? 1 : 0}>
        <g opacity={probeA}>
          <path d={`M${f1(cableEnd[0])},${f1(cableEnd[1])} C${f1(cableEnd[0] + 60)},${f1(cableEnd[1] - 20)} ${f1(monIn[0] - 70)},${f1(monIn[1] - 40)} ${monIn[0]},${monIn[1]}`} fill="none" stroke="#64748b" strokeWidth={3} strokeLinecap="round" />
          {/* monitor: bezel, screen, and the echo sector with the fetus in it */}
          <rect x={MON.x} y={MON.y} width={MON.w} height={MON.h} rx={7} fill="#1e293b" stroke="#475569" strokeWidth={1.6} />
          <rect x={MON.x + 5} y={MON.y + 5} width={MON.w - 10} height={MON.h - 10} rx={3} fill="#05080d" />
          <g clipPath={`url(#${clipId}-scr)`}>
            <path d={`M${fanO[0]},${fanO[1]} L${f1(fanO[0] - Math.sin(0.55) * 92)},${f1(fanO[1] + Math.cos(0.55) * 92)} A92,92 0 0 0 ${f1(fanO[0] + Math.sin(0.55) * 92)},${f1(fanO[1] + Math.cos(0.55) * 92)} Z`} fill="#323d4d" />
            <g fill="#cbd5e1">
              {SPECKLE.map((p, i) => (
                <circle key={i} cx={f1(fanO[0] + Math.sin(p.a) * p.r)} cy={f1(fanO[1] + Math.cos(p.a) * p.r)} r={1.1} opacity={Math.min(1, p.o * 1.8)} />
              ))}
            </g>
            {/* the fluid shows black, the fetus bright: head, trunk and a limb */}
            <ellipse cx={fanO[0]} cy={fanO[1] + 50} rx={42} ry={26} fill="#05080d" opacity={0.9} />
            {/* fetus in profile: bright skull ring, soft trunk, the spine as a row of echoes */}
            <ellipse cx={fanO[0] + 10} cy={fanO[1] + 54} rx={19} ry={10} transform={`rotate(-18 ${fanO[0] + 10} ${fanO[1] + 54})`} fill="#94a3b8" opacity={0.55} />
            <ellipse cx={fanO[0] - 16} cy={fanO[1] + 42} rx={11} ry={10} fill="#64748b" opacity={0.5} stroke="#f8fafc" strokeWidth={2.4} />
            <g fill="#f8fafc">
              {[0, 1, 2, 3, 4, 5].map((k) => (
                <circle key={k} cx={f1(fanO[0] - 3 + k * 5.6)} cy={f1(fanO[1] + 47 + k * 1.2 - (k - 2.5) ** 2 * 0.5)} r={1.5} />
              ))}
            </g>
          </g>
          <circle cx={MON.x + MON.w - 12} cy={MON.y + MON.h - 4} r={1.6} fill="#22c55e" />
        </g>
        <g transform={`translate(${PROBE[0]} ${PROBE[1]}) rotate(${PROBE_TILT})`} opacity={probeA}>
          <path d={`M0,2 L${-fanS * 230},${2 + fanC * 230} A230,230 0 0 0 ${fanS * 230},${2 + fanC * 230} Z`} fill={`url(#${clipId}-fan)`} />
          {pulses.map((ph, i) => {
            const r = 24 + 200 * ph;
            return (
              <path
                key={i}
                d={`M${-fanS * r},${2 + fanC * r} A${r},${r} 0 0 0 ${fanS * r},${2 + fanC * r}`}
                fill="none"
                stroke="#8ecae6"
                strokeWidth={1.6}
                strokeLinecap="round"
                opacity={0.85 * (1 - ph)}
              />
            );
          })}
          <path d="M3,-50 C8,-74 30,-84 56,-92" fill="none" stroke="#64748b" strokeWidth={3} strokeLinecap="round" />
          <path d="M-13,-6 L-9,-48 Q0,-55 9,-48 L13,-6 Z" fill="#cbd5e1" stroke="#475569" strokeWidth={1.4} strokeLinejoin="round" />
          <rect x={-20} y={-9} width={40} height={10} rx={4} fill="#94a3b8" stroke="#475569" strokeWidth={1.4} />
        </g>
      </Part>

      {/* Amaren serumaren azterketa: the mother's blood sample, its serum tested for α-fetoproteina */}
      <Part id="alfa-fetoproteina" show={bloodA}>
        <g transform={`translate(${TUBE[0]} ${TUBE[1]}) scale(1.5)`}>
          <rect x={-11} y={0} width={22} height={58} rx={7} fill="rgba(226,232,240,0.25)" stroke="#94a3b8" strokeWidth={1.3} />
          {/* the tube fills with the mother's blood, then it separates: clotted cells below, pale serum (tested) above */}
          <clipPath id={`${uid}-tube`}>
            <rect x={-9.5} y={56.5 - 40.5 * tubeFill} width={19} height={40.5 * tubeFill} />
          </clipPath>
          <g clipPath={`url(#${uid}-tube)`}>
            <rect x={-9.5} y={16} width={19} height={40.5} rx={6} fill="#8f1730" />
            <rect x={-9.5} y={30} width={19} height={26.5} rx={6} fill="#b91c3c" />
            <rect x={-9.5} y={16} width={19} height={15} fill={mix('#9b1b35', '#f5d77a', tubeSep)} opacity={0.9} />
          </g>
          <rect x={-14} y={-9} width={28} height={11} rx={3} fill="#8b5cf6" stroke="#5b3fb8" strokeWidth={1} />
          <rect x={-8} y={36} width={16} height={12} rx={1.5} fill="#f8fafc" opacity={0.9} />
          <text x={0} y={42} dy="0.35em" textAnchor="middle" fontSize={7.5} fontWeight={700} fill="#334155">
            AFP
          </text>
        </g>
      </Part>

      {/* Amniozentesia: needle through the abdominal/uterine wall */}
      <Part id="amniozentesia" show={needleA > 0.02 ? 1 : 0}>
        <g opacity={seg(needleA, 0, 0.15)}>
          <line x1={NEEDLE_X} y1={hubY} x2={needleTip[0]} y2={needleTip[1]} stroke="#e2e8f0" strokeWidth={2} strokeLinecap="round" />
          {/* Syringe: hub, barrel (filling with fluid once the tip is in the pocket) and plunger drawn back */}
          <rect x={NEEDLE_X - 4} y={hubY - 8} width={8} height={9} rx={1.5} fill="#94a3b8" stroke="#475569" strokeWidth={1} />
          <rect x={NEEDLE_X - 8} y={hubY - 48} width={16} height={41} rx={3} fill="rgba(226,232,240,0.22)" stroke="#cbd5e1" strokeWidth={1.3} />
          {draw > 0.01 && <rect x={NEEDLE_X - 6.5} y={hubY - 9 - 30 * draw} width={13} height={30 * draw} rx={2} fill="#8ecae6" opacity={0.75} />}
          <rect x={NEEDLE_X - 6.5} y={hubY - 12 - 30 * draw} width={13} height={4} rx={1} fill="#475569" />
          <path d={`M${NEEDLE_X},${hubY - 11 - 30 * draw} V${hubY - 60 - 30 * draw} M${NEEDLE_X - 9},${hubY - 60 - 30 * draw} H${NEEDLE_X + 9}`} stroke="#cbd5e1" strokeWidth={2.4} strokeLinecap="round" />
          <circle cx={needleTip[0]} cy={needleTip[1]} r={4} fill="#8ecae6" opacity={0.8 * draw} />
        </g>
      </Part>

      {/* Biloxka korionikoen biopsia: catheter from the vagina, through the cervix, to the villi */}
      <Part id="biloxka-korionikoen-biopsia" show={cvsA > 0.02 ? 1 : 0}>
        <path d={catheterD} fill="none" stroke="#e2e8f0" strokeWidth={2.4} strokeLinecap="round" strokeDasharray="600" strokeDashoffset={600 * catheterLen} />
        <circle cx={cvsEnd[0]} cy={cvsEnd[1]} r={3.4} fill="#e2e8f0" opacity={seg(cvsA, 0.9, 1)} />
      </Part>

      {/* Labels */}
      <Label id="ekografia" x={200} y={100} ax={PROBE[0] - 12} ay={PROBE[1] - 30} show={probeA} />
      <Label id="alfa-fetoproteina" x={TUBE[0]} y={TUBE[1] - 40} align="middle" ax={TUBE[0]} ay={TUBE[1] - 15} show={bloodA} />
      <Label id="amniozentesia" x={200} y={400} ax={needleTip[0]} ay={needleTip[1]} show={needleA} />
      <Label id="biloxka-korionikoen-biopsia" x={204} y={460} small ax={cvsEnd[0]} ay={cvsEnd[1]} show={cvsA} />
      <Label id="karena" x={200} y={200} ax={pl.c[0] - 14} ay={pl.c[1] - 10} />

      <Note x={500} y={612} tone="warn" show={needleA}>
        Amniozentesia: ez lehen 14 asteetan
      </Note>
    </g>
  );
}
