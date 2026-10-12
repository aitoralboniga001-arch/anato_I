'use client';

import { Label, Note, Part, clamp, lerp, mix, rand, seg, smoothPath, type Pt, type SceneProps } from '@/components/kit';
import { discOutline } from '@/components/scenes/week3/common';
import { DorsalDefs, Stellate } from '@/components/scenes/week3/dorsalKit';
import { Defs10, Steps, T, arc, f1, offset, resample, spline, vis } from './common';

/**
 * 10:eskualde-kardiogenikoa `diskoa` — 3. asteko enbrioi-diskoa goitik (kraneala goian), 3. gaiko diskoen
 * hizkuntza berean: ektodermoa zelulen mosaikoa da, eta haren zati handi bat kenduta dago azpiko mesodermoa
 * ikusteko (plaka neurala eta lerro primitiboa bere lekuan utzita). Lerro primitiboaren alde zefalikotik
 * zelula epiblastikoak migratzen dute plaka neuralaren alde zefalikora eta alboetara; han ferra formako
 * odol irlatxoak sortzen dira, sare bat egiten dute eta ferra formako tutu bat bihurtzen dira: erdian plaka
 * kardiogenikoa, alboetan endokardio hodiak. Azkenik aorta dortsalak notokordaren bi aldeetan.
 */

/** Stage times (shared with the transverse section). */
export const D1 = {
  grow: [0, 0.12],
  migrate: [0.14, 0.3],
  islands: [0.32, 0.44],
  vessels: [0.48, 0.6],
  network: [0.62, 0.69],
  tube: [0.68, 0.74],
  parts: [0.74, 0.8],
  aortae: [0.86, 0.95],
} as const;
const S = (t: number, k: keyof typeof D1) => seg(t, D1[k][0], D1[k][1]);

const CX = 500;
const CY = 318;
const OUTLINE = discOutline(CX, CY, 238, 186, 282, 272, 120);
const RIM = discOutline(CX, CY, 249, 197, 293, 283, 120);
const OUT_D = smoothPath(OUTLINE, true, 0.5);
const RIM_D = smoothPath(RIM, true, 0.5);

/** The horseshoe's centre-line, left caudal end → cranial bend → right caudal end. */
const HORSE: Pt[] = arc(CX, 300, 176, 226, 150, 390, 80);
const HR = resample(HORSE, 201);
const horseAt = (u: number) => HR[Math.round(clamp(u) * 200)];
/** Normal (outwards) of the horseshoe at u. */
const horseN = (u: number): Pt => {
  const a = horseAt(Math.max(0, u - 0.01));
  const b = horseAt(Math.min(1, u + 0.01));
  const l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
  return [(b[1] - a[1]) / l, -(b[0] - a[0]) / l];
};
/** Central stretch (cardiogenic plate) and the two lateral limbs (endocardial tubes). */
const MID: [number, number] = [0.37, 0.63];

/** Neural plate: broad cranially (future brain), narrow caudally, ending at the primitive node. */
const NP: Pt[] = spline(
  [
    [500, 150], [566, 160], [602, 204], [604, 262], [580, 326], [548, 386], [530, 430], [500, 440],
    [470, 430], [452, 386], [420, 326], [396, 262], [398, 204], [434, 160],
  ],
  8,
  true,
);
const NODE: Pt = [500, 452];
const STREAK_END = 556;
const BPM: Pt = [500, 120];
const CLOACAL: Pt = [500, 572];

/** Window through the ectoderm: everything but a rim, the neural plate (drawn on top) and the caudal streak region. */
const WIN: Pt[] = (() => {
  const inner = offset(OUTLINE, -15, true); // negative: inwards
  // The outline starts on the right (angle 0) and runs clockwise: start it at the bottom so the
  // part above the streak region is one unbroken run.
  const n = inner.length;
  const start = Math.round(n / 4);
  const ring = [...inner.slice(start), ...inner.slice(0, start)];
  const top = ring.filter((p) => p[1] < 468);
  const r = top[0];
  const l = top[top.length - 1];
  return [...top, [l[0] + 8, 476], [440, 488], [560, 488], [r[0] - 8, 476]];
})();
// Straight segments between the (dense) ring points: a smoothed sharp corner would overshoot the disc.
const WIN_D = `M${WIN.map((p) => `${f1(p[0])},${f1(p[1])}`).join('L')}Z`;

/** Mesenchyme sheet cells (seen from above) inside the window. */
const MES = (() => {
  const out: { p: Pt; a: number }[] = [];
  for (let i = 0; i < 300; i++) {
    const p: Pt = [lerp(270, 730, rand(i * 1.31)), lerp(40, 490, rand(i * 2.77 + 1))];
    out.push({ p, a: rand(i * 4.1) * 180 });
  }
  return out;
})();

/** Islands along the horseshoe (u positions, lateral jitter, size), each an irregular cluster. */
const ISLANDS = Array.from({ length: 30 }, (_, i) => ({
  u: 0.015 + (0.97 * i) / 29 + (rand(i * 7.3) - 0.5) * 0.012,
  d: (rand(i * 3.3) - 0.5) * 26,
  r: 7 + rand(i * 5.1) * 5,
  seed: i,
}));
const islandC = (k: (typeof ISLANDS)[number], pull = 0): Pt => {
  const c = horseAt(k.u);
  const n = horseN(k.u);
  return [c[0] + n[0] * k.d * (1 - pull), c[1] + n[1] * k.d * (1 - pull)];
};
/** Network links: each island to its neighbours, plus a few cross-links. */
const LINKS: [number, number][] = [
  ...ISLANDS.slice(1).map((_, i) => [i, i + 1] as [number, number]),
  ...ISLANDS.slice(2).filter((_, i) => i % 3 === 0).map((_, j) => [j * 3, j * 3 + 2] as [number, number]),
];

/** Migrating epiblast cells: from the cranial part of the streak, round the side, to an island. */
const MIGRANTS = Array.from({ length: 44 }, (_, i) => {
  const side = i % 2 ? 1 : -1;
  const u = side < 0 ? 0.02 + 0.47 * rand(i * 3.7) : 0.51 + 0.47 * rand(i * 3.7);
  return { side, u, delay: rand(i * 1.9) * 0.45, y0: 462 + rand(i * 5.3) * 30 };
});
function migrantAt(m: (typeof MIGRANTS)[number], k: number): Pt {
  const P = horseAt(m.u);
  const S0: Pt = [CX + m.side * 6, m.y0];
  const C1: Pt = [CX + m.side * 130, m.y0 + 8];
  const C2: Pt = [P[0] + m.side * 40, Math.max(P[1] + 90, 300)];
  const q = 1 - k;
  return [
    q * q * q * S0[0] + 3 * q * q * k * C1[0] + 3 * q * k * k * C2[0] + k * k * k * P[0],
    q * q * q * S0[1] + 3 * q * q * k * C1[1] + 3 * q * k * k * C2[1] + k * k * k * P[1],
  ];
}
const migK = (m: (typeof MIGRANTS)[number], mig: number) => clamp((mig - m.delay * 0.5) / 0.55);

/** Dorsal aortae: beside the notochord, their cranial ends reaching the endocardial tubes. */
function aortaPath(side: 1 | -1, grow: number): Pt[] {
  const touch = horseAt(side < 0 ? 0.3 : 0.7);
  const n = horseN(side < 0 ? 0.3 : 0.7);
  const keys: Pt[] = [
    [touch[0] - n[0] * 4, touch[1] - n[1] * 4],
    [CX + side * 92, 182],
    [CX + side * 40, 232],
    [CX + side * 30, 300],
    [CX + side * 28, 380],
    [CX + side * 26, 440],
  ];
  const pts = spline(keys, 10);
  return pts.slice(0, Math.max(2, Math.round(pts.length * grow)));
}

/** A closed blob of radius r round c, slightly irregular (seeded). */
const blob = (c: Pt, r: number, seed: number, n = 14): Pt[] =>
  Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2;
    const k = 1 + (rand(seed * 13 + i) - 0.5) * 0.36;
    return [c[0] + Math.cos(a) * r * k, c[1] + Math.sin(a) * r * k * 0.86];
  });

const bandD = (u0: number, u1: number, w: (u: number) => number) => {
  const n = 48;
  const us = Array.from({ length: n + 1 }, (_, i) => lerp(u0, u1, i / n));
  const a = us.map((u) => {
    const c = horseAt(u);
    const nn = horseN(u);
    return [c[0] + nn[0] * w(u), c[1] + nn[1] * w(u)] as Pt;
  });
  const b = us.map((u) => {
    const c = horseAt(u);
    const nn = horseN(u);
    return [c[0] - nn[0] * w(u), c[1] - nn[1] * w(u)] as Pt;
  });
  return smoothPath([...a, ...b.reverse()], true, 0.25);
};
const lineD = (u0: number, u1: number) => smoothPath(Array.from({ length: 41 }, (_, i) => horseAt(lerp(u0, u1, i / 40))), false, 0.4);
/** Width that rounds off at both ends of a stretch. */
const capped = (u0: number, u1: number, w: number) => (u: number) => w * Math.sqrt(clamp(Math.min(u - u0, u1 - u) / 0.025));

export function DiscArt({ t }: { t: number }) {
  const grow = lerp(0.92, 1, S(t, 'grow'));
  const mig = seg(t, D1.migrate[0], D1.migrate[1] + 0.04);
  const isl = S(t, 'islands');
  const ves = S(t, 'vessels');
  const net = S(t, 'network');
  const tube = S(t, 'tube');
  const parts = S(t, 'parts');
  const ao = S(t, 'aortae');
  const diffuse = 1 - seg(t, 0.1, 0.16);
  const pull = net * 0.6 + tube * 0.4;

  return (
    <g>
      <defs>
        <DorsalDefs />
        <clipPath id="w10d-disc">
          <path d={OUT_D} />
        </clipPath>
        <clipPath id="w10d-win">
          <path d={WIN_D} />
        </clipPath>
        <mask id="w10d-under" maskUnits="userSpaceOnUse" x={0} y={0} width={1000} height={640}>
          <rect width={1000} height={640} fill="#fff" />
          <path d={smoothPath(NP, true, 0.35)} fill="#a8a8a8" />
        </mask>
        {/* The ectoderm's cut face: columns of cells seen side on. */}
        <pattern id="w10d-face" width="5" height="5" patternUnits="userSpaceOnUse">
          <rect width="5" height="5" fill="#5c86d8" />
          <path d="M0 0v5" stroke="#2a4a94" strokeWidth={1.2} />
          <circle cx="2.6" cy="2.5" r="0.9" fill="#1d3577" />
        </pattern>
      </defs>
      <Defs10 />
      <g transform={`translate(${CX} ${CY}) scale(${grow.toFixed(3)}) translate(${-CX} ${-CY})`}>
        <path d={RIM_D} fill="#000" opacity={0.35} transform="translate(3 6)" pointerEvents="none" />
        <Part id="amnios-barrunbea" quiet>
          <path d={RIM_D + OUT_D} fill={T.amnion} fillRule="evenodd" opacity={0.55} />
        </Part>

        {/* Under the ectoderm: the mesoderm sheet (seen through the window). */}
        <g clipPath="url(#w10d-disc)">
          <Part id="mesodermo-intraenbrionarioa" quiet>
            <path d={OUT_D} fill="#9c3439" />
            {MES.map((m, i) => (
              <Stellate key={i} x={m.p[0]} y={m.p[1]} r={2.6} a={m.a} color="#e86a6a" />
            ))}
            <path d={OUT_D} fill="url(#w3g-light)" pointerEvents="none" />
          </Part>

          {/* Pericardial cavity forming over the cranial bend of the horseshoe. */}
          <Part id="perikardio-barrunbea" show={parts}>
            <path d={bandD(0.2, 0.8, capped(0.2, 0.8, 42))} fill={T.space} opacity={0.7} />
            <path d={bandD(0.2, 0.8, capped(0.2, 0.8, 42))} fill={T.cavity} stroke="rgba(170,200,255,0.5)" strokeWidth={1.2} />
          </Part>

          {/* Epiblast cells leaving the cranial part of the streak towards the cranial end and the sides. */}
          <Part id="epiblastoa" show={vis(t, D1.migrate[0], D1.islands[1])}>
            {MIGRANTS.map((m, i) => {
              const k = migK(m, mig);
              if (k <= 0) return null;
              const p = migrantAt(m, k);
              const q = migrantAt(m, Math.max(0, k - 0.1));
              const col = mix('#6a99f2', '#ff8a7a', clamp(k * 1.5));
              return (
                <g key={i} opacity={1 - isl * 0.9}>
                  <path d={`M${f1(q[0])},${f1(q[1])} L${f1(p[0])},${f1(p[1])}`} stroke={col} strokeWidth={2.6} opacity={0.35} strokeLinecap="round" />
                  <circle cx={f1(p[0])} cy={f1(p[1])} r={4.6} fill={col} stroke="rgba(30,10,20,0.65)" strokeWidth={0.8} />
                  <circle cx={f1(p[0] - 1.3)} cy={f1(p[1] - 1.3)} r={1.6} fill="rgba(255,255,255,0.4)" />
                </g>
              );
            })}
          </Part>

          {/* Blood islands: clusters of cells; inside them blood cells, round them a pale ring of angioblasts. */}
          <Part id="odol-irlatxoak" show={isl * (1 - tube)}>
            {ISLANDS.map((k, i) => {
              const c = islandC(k, pull);
              const r = k.r * lerp(0.35, 1, isl);
              return (
                <g key={i}>
                  <path d={smoothPath(blob(c, r + 1.5, k.seed), true, 0.4)} fill={T.angioblast} stroke="#b4473f" strokeWidth={0.9} />
                  <path d={smoothPath(blob(c, r * 0.68, k.seed + 50), true, 0.4)} fill={ves > 0.05 ? mix(T.angioblast, '#5a0f18', ves) : '#f08c84'} />
                  {Array.from({ length: 4 }, (_, j) => {
                    const a = (j / 4) * Math.PI * 2 + i;
                    return <ellipse key={j} cx={f1(c[0] + Math.cos(a) * r * 0.36)} cy={f1(c[1] + Math.sin(a) * r * 0.32)} rx={f1(r * 0.24)} ry={f1(r * 0.19)} fill={T.island} stroke="rgba(80,0,10,0.6)" strokeWidth={0.5} />;
                  })}
                </g>
              );
            })}
          </Part>

          {/* The islands' vessels join into a horseshoe-shaped network, then fuse into one horseshoe tube. */}
          <Part id="ferra-formako-plexua" show={net * (1 - parts)}>
            <g opacity={1 - tube * 0.85}>
              {LINKS.map(([a, b], i) => {
                const p = islandC(ISLANDS[a], pull);
                const q = islandC(ISLANDS[b], pull);
                const m: Pt = [(p[0] + q[0]) / 2 + Math.sin(i * 2.3) * 7, (p[1] + q[1]) / 2 + Math.cos(i * 1.7) * 7];
                const k = clamp(net * 1.6 - (i % 4) * 0.15);
                const d = `M${f1(p[0])},${f1(p[1])} Q${f1(m[0])},${f1(m[1])} ${f1(lerp(p[0], q[0], k))},${f1(lerp(p[1], q[1], k))}`;
                return (
                  <g key={i}>
                    <path d={d} stroke="#7a1238" strokeWidth={8.5} fill="none" strokeLinecap="round" />
                    <path d={d} stroke={T.plexus} strokeWidth={7} fill="none" strokeLinecap="round" />
                    <path d={d} stroke={T.blood} strokeWidth={3} fill="none" strokeLinecap="round" />
                  </g>
                );
              })}
              {ISLANDS.map((k, i) => {
                const c = islandC(k, pull);
                return <circle key={i} cx={f1(c[0])} cy={f1(c[1])} r={k.r * 0.7} fill={T.plexus} stroke="#7a1238" strokeWidth={1} />;
              })}
            </g>
            <g opacity={tube}>
              <path d={bandD(0, 1, capped(0, 1, 13))} fill={T.plexus} stroke="#7a1238" strokeWidth={1.4} />
              <path d={lineD(0.02, 0.98)} stroke={T.blood} strokeWidth={8} fill="none" strokeLinecap="round" />
              <path d={bandD(0, 1, capped(0, 1, 13))} fill="url(#w3g-light)" />
            </g>
          </Part>

          {/* Its two parts: the cardiogenic plate in the middle, the endocardial tubes at the sides. */}
          <Part id="bihotz-hodiak" show={parts}>
            {[
              [0, MID[0] + 0.02],
              [MID[1] - 0.02, 1],
            ].map(([a, b], i) => (
              <g key={i}>
                <path d={bandD(a, b, capped(a, b, 12))} fill={T.endocard} stroke="#9d2f6a" strokeWidth={1.3} />
                <path d={lineD(a + 0.012, b - 0.012)} stroke={T.blood} strokeWidth={7.5} fill="none" strokeLinecap="round" />
                <path d={lineD(a + 0.012, b - 0.012)} stroke="#ffd1e6" strokeWidth={1.4} fill="none" strokeLinecap="round" opacity={0.7} transform="translate(-2 -3)" />
              </g>
            ))}
          </Part>
          <Part id="plaka-kardiogenikoa" show={parts}>
            <path d={bandD(MID[0], MID[1], (u) => lerp(13, 22, Math.sin(((u - MID[0]) / (MID[1] - MID[0])) * Math.PI) ** 0.6))} fill={T.plate} stroke="#7a1240" strokeWidth={1.4} />
            <path d={bandD(MID[0], MID[1], (u) => lerp(13, 22, Math.sin(((u - MID[0]) / (MID[1] - MID[0])) * Math.PI) ** 0.6))} fill="url(#w10-mes)" />
            <path d={bandD(MID[0], MID[1], (u) => lerp(13, 22, Math.sin(((u - MID[0]) / (MID[1] - MID[0])) * Math.PI) ** 0.6))} fill="url(#w3g-light)" />
          </Part>
        </g>

        {/* Ectoderm (mosaic of cell apices), cut away over the window to show the mesoderm. */}
        <Part id="ektodermoa">
          <path d={OUT_D + WIN_D} fill="url(#w3g-mosaic)" fillRule="evenodd" />
          <path d={OUT_D + WIN_D} fill="url(#w3g-light)" fillRule="evenodd" pointerEvents="none" />
          {/* The cut: the ectoderm's thickness shown as a face along the window's edge, its shadow on the mesoderm. */}
          <g clipPath="url(#w10d-win)" pointerEvents="none">
            <path d={WIN_D} fill="none" stroke="rgba(4,6,20,0.55)" strokeWidth={14} transform="translate(1.5 2)" />
            <path d={WIN_D} fill="none" stroke="#3f68bf" strokeWidth={9} />
            <path d={WIN_D} fill="none" stroke="url(#w10d-face)" strokeWidth={9} />
          </g>
          <path d={WIN_D} fill="none" stroke="#c9dafc" strokeWidth={1.3} opacity={0.8} pointerEvents="none" />
        </Part>

        {/* Food from outside by diffusion: it only reaches the rim of the growing disc. */}
        {diffuse > 0.01 &&
          Array.from({ length: 60 }, (_, i) => {
            const p = OUTLINE[Math.floor((i / 60) * OUTLINE.length)];
            const k = ((t * 9 + rand(i * 2.1)) % 1) * 0.15;
            const q: Pt = [lerp(p[0], CX, k), lerp(p[1], CY, k)];
            return <circle key={i} cx={f1(q[0])} cy={f1(q[1])} r={2.3} fill="#fde68a" stroke="rgba(90,60,0,0.5)" strokeWidth={0.5} opacity={diffuse * (1 - k / 0.15) * 0.95} />;
          })}

        {/* The neural plate stays: a raised, thicker plate of ectoderm. */}
        <Part id="plaka-neurala">
          <path d={smoothPath(NP, true, 0.35)} fill="rgba(6,10,30,0.5)" transform="translate(3 4)" />
          <path d={smoothPath(NP, true, 0.35)} fill="url(#w3g-mosaic)" />
          <path d={smoothPath(NP, true, 0.35)} fill={T.neural} opacity={0.55} />
          <path d={smoothPath(offset(NP, 7, true), true, 0.35)} fill="none" stroke="#9fbcf6" strokeWidth={5} opacity={0.35} />
          <path d={smoothPath(NP, true, 0.35)} fill="url(#w3g-light)" />
          <path d="M500,170 C503,250 500,350 500,432" stroke="#16264f" strokeWidth={4} fill="none" opacity={0.75} />
          <path d="M497,172 C500,250 497,350 497,430" stroke="#9fbcf6" strokeWidth={1.2} fill="none" opacity={0.5} />
        </Part>

        {/* Deep, under the neural plate (drawn as if through it): the notochord and, later, the dorsal aortae. */}
        <g mask="url(#w10d-under)">
        <Part id="notokorda">
          <path d="M500,168 L500,446" stroke="rgba(10,6,30,0.45)" strokeWidth={14} strokeLinecap="round" />
          <path d="M500,168 L500,446" stroke={T.noto} strokeWidth={10} strokeLinecap="round" opacity={0.85} />
          <path d="M498,170 L498,444" stroke="#e9d5ff" strokeWidth={2} opacity={0.55} />
        </Part>
        <Part id="aorta-dortsalak" show={ao > 0.01 ? 1 : 0}>
          {([-1, 1] as const).map((s) => {
            const p = aortaPath(s, ao);
            const d = smoothPath(p, false, 0.4);
            return (
              <g key={s}>
                <path d={d} stroke="rgba(10,6,20,0.45)" strokeWidth={16} fill="none" strokeLinecap="round" />
                <path d={d} stroke={T.aortaDeep} strokeWidth={13} fill="none" strokeLinecap="round" />
                <path d={d} stroke={T.aorta} strokeWidth={10.5} fill="none" strokeLinecap="round" />
                <path d={d} stroke="#fecaca" strokeWidth={1.6} fill="none" strokeLinecap="round" opacity={0.6} transform="translate(-1.2 -1)" />
              </g>
            );
          })}
        </Part>
        </g>

        <Part id="mintz-bukofaringeoa">
          <ellipse cx={BPM[0]} cy={BPM[1]} rx={30} ry={13} fill="url(#w3g-memb)" stroke="#eef2ff" strokeWidth={1.2} />
        </Part>
        <Part id="kloaka-mintza" quiet>
          <ellipse cx={CLOACAL[0]} cy={CLOACAL[1]} rx={17} ry={9} fill="url(#w3g-memb)" stroke="#eef2ff" strokeWidth={1.1} />
        </Part>
        <Part id="lerro-primitiboa">
          <path d={`M${CX - 9},${NODE[1] + 12} Q${CX - 8},${STREAK_END - 20} ${CX},${STREAK_END} Q${CX + 8},${STREAK_END - 20} ${CX + 9},${NODE[1] + 12}Z`} fill="rgba(6,10,30,0.45)" transform="translate(2.5 2)" />
          <path d={`M${CX - 9},${NODE[1] + 12} Q${CX - 8},${STREAK_END - 20} ${CX},${STREAK_END} Q${CX + 8},${STREAK_END - 20} ${CX + 9},${NODE[1] + 12}Z`} fill="url(#w3g-ridge)" />
          <path d={`M${CX - 2.5},${NODE[1] + 14} L${CX},${STREAK_END - 8} L${CX + 2.5},${NODE[1] + 14}Z`} fill="#132453" />
          <ellipse cx={NODE[0] + 2.5} cy={NODE[1] + 3} rx={15} ry={12} fill="rgba(6,10,30,0.5)" />
          <ellipse cx={NODE[0]} cy={NODE[1]} rx={15} ry={12} fill="url(#w3g-node)" />
          <ellipse cx={NODE[0]} cy={NODE[1] + 0.5} rx={5.5} ry={4.8} fill="#081230" />
        </Part>
      </g>

      <Label id="plaka-neurala" x={226} y={196} ax={436} ay={226} />
      <Label
        id="epiblastoa"
        x={226}
        y={500}
        ax={migrantAt(MIGRANTS[12], migK(MIGRANTS[12], mig))[0]}
        ay={migrantAt(MIGRANTS[12], migK(MIGRANTS[12], mig))[1]}
        show={vis(t, D1.migrate[0] + 0.03, D1.islands[0])}
        text="Zelula epiblastikoak"
      />
      <Label id="odol-irlatxoak" x={226} y={262} ax={islandC(ISLANDS[6], pull)[0]} ay={islandC(ISLANDS[6], pull)[1]} show={vis(t, D1.islands[0] + 0.02, D1.network[1])} />
      <Label id="bihotz-hodiak" x={226} y={262} ax={horseAt(0.12)[0]} ay={horseAt(0.12)[1]} show={parts} text="Endokardio hodiak" />
      <Label id="aorta-dortsalak" x={226} y={404} ax={CX - 28} ay={404} show={seg(t, D1.aortae[0] + 0.03, D1.aortae[1])} />
      <Label id="lerro-primitiboa" x={226} y={540} ax={CX} ay={522} />
      <Label id="ektodermoa" x={774} y={540} ax={572} ay={516} small />
      <Label id="mintz-bukofaringeoa" x={774} y={120} ax={516} ay={120} />
      <Label id="plaka-kardiogenikoa" x={774} y={60} ax={horseAt(0.56)[0]} ay={horseAt(0.56)[1]} show={parts} />
      <Label id="ferra-formako-plexua" x={774} y={262} ax={horseAt(0.82)[0]} ay={horseAt(0.82)[1]} show={vis(t, D1.network[0] + 0.02, D1.parts[0] + 0.02)} />
      <Label id="perikardio-barrunbea" x={774} y={200} ax={horseAt(0.74)[0] + horseN(0.74)[0] * 12} ay={horseAt(0.74)[1] + horseN(0.74)[1] * 12} show={parts} small />
      <Label id="notokorda" x={774} y={340} ax={CX} ay={340} />
    </g>
  );
}

/** 10:eskualde-kardiogenikoa `diskoa`. */
export function CardiogenicDisc({ t }: SceneProps) {
  return (
    <g>
      <DiscArt t={t} />
      <Note x={500} y={14} size={12.5} tone="dim">
        3. astea · diskoa goitik, ektodermoa kenduta (plaka neurala eta lerro primitiboa utzita)
      </Note>
      <Steps
        t={t}
        steps={[
          [0, '3. astea: difusioa ez da nahikoa; bere zirkulazio-sistema garatuko da'],
          [0.14, 'Lerro primitiboaren alde zefalikoko zelula epiblastikoak aurrera eta alboetara'],
          [0.32, 'Ferra formako egitura: odol irlatxoak'],
          [0.48, 'Odol irlatxoetatik odoleko zelulak eta odol hodiak'],
          [0.62, 'Hodiak fusionatu: ferra formako tutua'],
          [0.74, 'Bi atal: erdian plaka kardiogenikoa, alboetan endokardio hodiak'],
          [0.86, 'Aorta dortsalak notokordaren bi aldeetan, endokardio hodiekin kontaktuan'],
        ]}
      />
    </g>
  );
}
