'use client';

import { C, Label, Mark, Note, OnTop, Part, clamp, lerp, seg, smoothPath, type SceneProps } from '@/components/kit';
import { Hud, MiniTract, vis } from './common';
import { NucleusArt, Spindle } from './conceptus';

/**
 * 4.2 Ernalkuntza (Langman fig. 3-5 and 3-6). A secondary oocyte (haploid, arrested in metaphase of
 * meiosis II) inside the zona pellucida and corona radiata. A camera follows one sperm through the
 * three phases — (1) between the corona cells after capacitation, (2) through the zona by the
 * acrosome reaction, (3) fusion of the plasma membranes — pulling back for the cortical reaction that
 * seals the zona against the others. The oocyte then completes meiosis II (ovum + 2nd polar body),
 * the female and male pronuclei form and meet, and their chromosomes gather on the first cleavage
 * spindle: the zygote, still inside the zona pellucida.
 */

const CX = 560;
const CY = 320;
const OO = 138; // oolemma (outside the polar-body pocket)
const ZI = 150; // zona pellucida, inner edge
const ZO = 170; // zona pellucida, outer edge
const COR = 172; // corona radiata starts on the zona
const WIN = 208; // where the winning sperm enters
const POLE = -76; // animal pole: meiosis II spindle and second polar body
const PB1 = -55; // first polar body (from ovulation)
const DENT = -66; // the oocyte surface is flattened under the polar bodies (perivitelline pocket)
const SP1 = 90; // first cleavage spindle, pole to pole

type P2 = [number, number];
const rad = (d: number) => (d * Math.PI) / 180;
const pt = (r: number, deg: number): P2 => [CX + r * Math.cos(rad(deg)), CY + r * Math.sin(rad(deg))];
const angDist = (a: number, b: number) => Math.abs((((a - b) % 360) + 540) % 360 - 180);
const bump = (d: number, w: number) => (d >= w ? 0 : 0.5 * (1 + Math.cos((Math.PI * d) / w)));

// ---------------------------------------------------------------------------
// Camera: the overview for the oocyte as a whole, push-ins where the event is small.
interface Cam {
  s: number;
  transform: string;
  at: (x: number, y: number) => P2;
  inv: (x: number, y: number) => P2;
}

const E = (r: number): [number, number] => pt(r, WIN);
const SPIN = pt(OO - 11 - 15, POLE);
// [t, focus x, focus y, scale]
const KEYS: [number, number, number, number][] = [
  [0, CX, CY, 1],
  [0.13, CX, CY, 1],
  [0.18, ...E(192), 2.65],
  [0.29, ...E(186), 2.65],
  [0.325, ...E(160), 2.55],
  [0.455, ...E(158), 2.55],
  [0.5, CX, CY, 1.05],
  [0.578, CX, CY, 1.05],
  [0.618, ...E(132), 2.75],
  [0.7, ...E(124), 2.75],
  [0.718, (E(124)[0] + SPIN[0]) / 2, (E(124)[1] + SPIN[1]) / 2, 1.75],
  [0.738, SPIN[0], SPIN[1] + 4, 3.3],
  [0.81, SPIN[0], SPIN[1] + 4, 3.3],
  [0.852, CX - 14, CY - 22, 1.85],
  // Push in as the pronuclei meet (their DNA replicates), keeping the polar bodies in the picture…
  [0.885, CX + 10, CY - 30, 2.5],
  [0.92, CX + 10, CY - 30, 2.5],
  // …then back to the whole zygote inside its zona, with the first cleavage spindle at its centre.
  [0.95, CX + 8, CY, 1.6],
  [1, CX + 8, CY, 1.6],
];

function camera(t: number): Cam {
  let k = 0;
  while (k < KEYS.length - 2 && t > KEYS[k + 1][0]) k++;
  const [t0, x0, y0, s0] = KEYS[k];
  const [t1, x1, y1, s1] = KEYS[k + 1];
  const e = seg(t, t0, t1);
  // Zoom in log space so pushes feel even; the focus slides toward the frame centre as it closes in.
  const s = Math.exp(lerp(Math.log(s0), Math.log(s1), e));
  const fx = lerp(x0, x1, e);
  const fy = lerp(y0, y1, e);
  const close = clamp((s - 1) / 1.2);
  const tx = lerp(CX, 505, close);
  const ty = lerp(CY, 300, close);
  return {
    s,
    transform: `translate(${tx.toFixed(2)} ${ty.toFixed(2)}) scale(${s.toFixed(4)}) translate(${(-fx).toFixed(2)} ${(-fy).toFixed(2)})`,
    at: (x, y) => [tx + (x - fx) * s, ty + (y - fy) * s],
    inv: (x, y) => [fx + (x - tx) / s, fy + (y - ty) / s],
  };
}

/**
 * The drawing fills the whole frame at every zoom; anchors stay in the open part of it, clear of the
 * overlays (route map top left, HUD bottom left, phase trail bottom right, note band, toolbar).
 */
const VIEW = { x0: 30, x1: 970, y0: 34, y1: 578 };
const KEEP_OUT: [number, number, number, number][] = [
  [0, 0, 300, 150], // MiniTract
  [0, 540, 330, 640], // HUD
  [790, 500, 1000, 640], // phase trail
  [920, 0, 1000, 230], // toolbar
];
/** Distance (screen units) from p to the open area's edge; negative outside it. */
function room(p: P2) {
  let d = Math.min(p[0] - VIEW.x0, VIEW.x1 - p[0], p[1] - VIEW.y0, VIEW.y1 - p[1]);
  for (const [x0, y0, x1, y1] of KEEP_OUT) {
    const dx = Math.max(x0 - p[0], p[0] - x1);
    const dy = Math.max(y0 - p[1], p[1] - y1);
    const out = dx > 0 || dy > 0 ? Math.hypot(Math.max(dx, 0), Math.max(dy, 0)) : Math.max(dx, dy);
    d = Math.min(d, out);
  }
  return d;
}
const inView = (p: P2, m = 0) => room(p) > m;
/** 1 well inside the view, fading to 0 at its edge, so names leave with what they name. */
const viewFade = (p: P2) => clamp(room(p) / 24);

/**
 * The point of a ring (radius r round the oocyte centre) nearest the label on screen, among those
 * in the open view and not under the label's own text, so leaders stay short at every zoom.
 */
function ringAnchor(cam: Cam, r: number | number[], label: P2, rOf?: (deg: number) => number): P2 {
  const radii = Array.isArray(r) ? r : [r];
  let best: P2 | null = null;
  let bd = Infinity;
  for (const rr of radii)
    for (let a = 0; a < 360; a += 2) {
      const p = cam.at(...pt(rOf ? rOf(a) : rr, a));
      if (!inView(p, 14)) continue;
      const d = Math.hypot(p[0] - label[0], p[1] - label[1]);
      if (d < 34) continue;
      if (d < bd) {
        bd = d;
        best = p;
      }
    }
  if (best) return best;
  const w = cam.inv(label[0], label[1]);
  return cam.at(...pt(rOf ? rOf(0) : radii[0], (Math.atan2(w[1] - CY, w[0] - CX) * 180) / Math.PI));
}

// ---------------------------------------------------------------------------
// The oocyte surface (oolemma): flattened under the polar bodies, raised into a fertilization
// cone where the sperm fuses, and budding the second polar body at the animal pole.
function oolR(deg: number, cone: number, dome: number) {
  return OO - 11 * bump(angDist(deg, DENT), 48) + cone * 8 * bump(angDist(deg, WIN), 8) + dome * bump(angDist(deg, POLE), 7.5);
}
function oolPath(cone: number, dome: number) {
  const pts: P2[] = [];
  for (let a = 0; a < 360; a += 2.5) pts.push(pt(oolR(a, cone, dome), a));
  return smoothPath(pts, true, 0.5);
}

// ---------------------------------------------------------------------------
// Corona radiata: radially elongated follicle cells in three loose rows, joined to the zona by
// fine processes. Where the sperm passes they are pushed aside (not erased).
function Corona({ gapOpen }: { gapOpen: number }) {
  const cells: React.ReactElement[] = [];
  const procs: string[] = [];
  const ROWS = [
    { r: COR + 11, n: 40, rx: 11, ry: 6.8, a: 1 },
    { r: COR + 28, n: 44, rx: 10.5, ry: 6.4, a: 0.88 },
    { r: COR + 45, n: 38, rx: 9.5, ry: 6, a: 0.66 },
  ];
  ROWS.forEach((R, row) => {
    for (let i = 0; i < R.n; i++) {
      const jit = Math.sin(i * 12.9898 + row * 78.233) * 43758.5453;
      const j = jit - Math.floor(jit);
      let deg = ((i + row * 0.37 + (j - 0.5) * 0.45) / R.n) * 360;
      // Push cells away from the sperm's path.
      const dd = ((deg - WIN + 540) % 360) - 180;
      const near = bump(Math.abs(dd), 14);
      deg += Math.sign(dd || 1) * near * gapOpen * 5;
      const rr = R.r + (j - 0.5) * 6;
      const [x, y] = pt(rr, deg);
      if (row === 0 && i % 2 === 0) {
        const [x0, y0] = pt(ZO - 2, deg + (j - 0.5) * 2);
        procs.push(`M${x0.toFixed(1)},${y0.toFixed(1)} L${x.toFixed(1)},${y.toFixed(1)}`);
      }
      cells.push(
        <g key={`${row}-${i}`} opacity={R.a} transform={`rotate(${deg.toFixed(1)} ${x.toFixed(1)} ${y.toFixed(1)})`}>
          <ellipse cx={x + 1.2} cy={y + 1.6} rx={R.rx} ry={R.ry} fill="#000" opacity={0.28} />
          <ellipse cx={x} cy={y} rx={R.rx} ry={R.ry} fill="url(#w1f-corona)" stroke="rgba(52,32,92,0.65)" strokeWidth={0.9} />
          <ellipse cx={x + 1.2} cy={y + 0.3} rx={3.6} ry={2.6} fill="#5a3f97" opacity={0.75} />
          <circle cx={x + 2} cy={y - 0.4} r={0.9} fill="#2a1a52" opacity={0.8} />
        </g>,
      );
    }
  });
  return (
    <g>
      <path d={procs.join(' ')} stroke="#c9b9f7" strokeOpacity={0.35} strokeWidth={0.8} />
      {cells}
    </g>
  );
}

// ---------------------------------------------------------------------------
// A spermatozoon in profile (Langman fig. 3-5): paddle-shaped head with the acrosome cap over its
// front two thirds, the condensed nucleus behind it, midpiece and tail.
interface SpermState {
  x: number;
  y: number;
  deg: number; // heading (towards the oocyte)
  scale: number;
  headO: number;
  tailO: number;
  acro: number; // 1 intact acrosome … 0 gone (acrosome reaction)
  coat: number; // 1 glycoprotein coat on the head … 0 shed (capacitation)
  cloud: number; // enzyme cloud from the acrosome
  wig: number; // tail wave phase
  amp: number; // tail wave amplitude
}

const HEAD = 'M11,0 C11,-5.4 4.5,-6.8 -1.5,-6.4 C-6.8,-6 -9.2,-3.2 -9.6,0 C-9.2,3.2 -6.8,6 -1.5,6.4 C4.5,6.8 11,5.4 11,0 Z';
const CAP = 'M-1.5,-6.4 C4.5,-6.8 11,-5.4 11,0 C11,5.4 4.5,6.8 -1.5,6.4 C2.6,4.6 5.4,2.6 5.4,0 C5.4,-2.6 2.6,-4.6 -1.5,-6.4 Z';

function Sperm({ s }: { s: SpermState }) {
  if (s.headO <= 0.02 && s.tailO <= 0.02) return null;
  const L = 64;
  const n = 14;
  const pts: P2[] = [];
  for (let i = 0; i <= n; i++) {
    const u = i / n;
    const amp = 6.5 * s.amp * u * (1.3 - 0.5 * u);
    pts.push([-21 - u * L, Math.sin(s.wig + u * 5.8) * amp]);
  }
  const tail = smoothPath(pts, false, 0.5);
  const [mx, my] = pts[0];
  return (
    <g transform={`translate(${s.x.toFixed(2)} ${s.y.toFixed(2)}) rotate(${s.deg.toFixed(1)}) scale(${s.scale})`}>
      {s.tailO > 0.02 && (
        <g opacity={s.tailO}>
          <path d={tail} fill="none" stroke="#0b1020" strokeOpacity={0.45} strokeWidth={2.6} strokeLinecap="round" />
          <path d={tail} fill="none" stroke={C.sperm} strokeWidth={1.4} strokeLinecap="round" />
          {/* Midpiece: mitochondrial sheath. */}
          <path d={`M-9,0 L${mx},${my}`} stroke="#0b1020" strokeOpacity={0.5} strokeWidth={4.4} strokeLinecap="round" />
          <path d={`M-9,0 L${mx},${my}`} stroke="#c4d3f2" strokeWidth={3} strokeLinecap="round" />
          <path d={`M-9,0 L${mx},${my}`} stroke="#8095bf" strokeWidth={3} strokeDasharray="1.1 1.7" />
        </g>
      )}
      {s.headO > 0.02 && (
        <g opacity={s.headO}>
          <path d={HEAD} fill="url(#w1f-sperm)" stroke="#0b1020" strokeOpacity={0.6} strokeWidth={0.9} />
          <ellipse cx={0.4} cy={0} rx={6.4} ry={4.2} fill="#6f84b4" opacity={0.55} />
          {s.acro > 0.02 && <path d={CAP} fill={C.acrosome} opacity={0.9 * s.acro} stroke="#0e5f86" strokeOpacity={0.5 * s.acro} strokeWidth={0.6} />}
          <ellipse cx={-3} cy={-3.2} rx={3.4} ry={1.3} fill="#fff" opacity={0.45} />
          {/* Acrosome reaction: the cap breaks up into vesicles that drift ahead and dissolve. */}
          {s.acro > 0.02 && s.acro < 0.98 &&
            [-4.5, -1.5, 1.5, 4.5].map((v, i) => (
              <circle key={i} cx={9 + (1 - s.acro) * (8 + i * 2)} cy={v * (1 + (1 - s.acro) * 0.6)} r={1.4} fill={C.acrosome} opacity={s.acro * 0.9} />
            ))}
          {/* Capacitation: the glycoprotein coat over the acrosome is shed. */}
          {s.coat > 0.02 &&
            [-6.8, -5, -2.6, 0, 2.6, 5, 6.8].map((v, i) => {
              const off = (1 - s.coat) * (10 + i * 2.4);
              return <circle key={i} cx={6.5 - Math.abs(v) * 0.75 - off} cy={v * (1.14 + (1 - s.coat) * 0.5)} r={1.15} fill="#e9d48a" opacity={s.coat} />;
            })}
        </g>
      )}
      {s.cloud > 0.02 && (
        <ellipse cx={17 + 6 * s.cloud} cy={0} rx={9 + 12 * s.cloud} ry={7 + 8 * s.cloud} fill="url(#w1f-enzyme)" opacity={s.cloud} />
      )}
    </g>
  );
}

// ---------------------------------------------------------------------------
// The winner's journey (stage time → position along the entry line, from outside in).
function winnerR(t: number) {
  if (t < 0.13) return lerp(330, 224, seg(t, 0, 0.13, (k) => k));
  if (t < 0.19) return lerp(224, 216, seg(t, 0.13, 0.19));
  if (t < 0.3) return lerp(216, ZO + 9, seg(t, 0.19, 0.285));
  if (t < 0.44) return lerp(ZO + 9, OO + 11, seg(t, 0.335, 0.44));
  if (t < 0.6) return OO + 11;
  if (t < 0.7) return lerp(OO + 11, 98, seg(t, 0.625, 0.7));
  return lerp(98, 84, seg(t, 0.7, 0.8));
}

function winner(t: number): SpermState {
  const r = winnerR(t);
  // It weaves between the corona cells instead of driving straight through them.
  const weave = Math.sin(seg(t, 0.19, 0.285, (k) => k) * Math.PI * 2) * 6 * (1 - seg(t, 0.26, 0.29));
  const [x0, y0] = pt(r, WIN);
  const nx = -Math.sin(rad(WIN));
  const ny = Math.cos(rad(WIN));
  return {
    x: x0 + nx * weave,
    y: y0 + ny * weave,
    deg: WIN + 180 + weave * 1.4,
    scale: 1.05,
    headO: 1 - seg(t, 0.8, 0.85),
    tailO: 1 - seg(t, 0.8, 0.88),
    acro: 1 - seg(t, 0.305, 0.345),
    coat: 1 - seg(t, 0.15, 0.215),
    cloud: seg(t, 0.31, 0.35) * (1 - seg(t, 0.42, 0.47)),
    wig: t * 150,
    amp: 1 - 0.85 * seg(t, 0.62, 0.7),
  };
}

// Five others: they reach the corona or the zona, stall, and are shut out by the cortical reaction.
const LOSERS: { deg: number; reach: number; delay: number }[] = [
  { deg: 52, reach: ZO + 9, delay: 0 },
  { deg: 102, reach: ZO + 8, delay: 0.03 },
  { deg: 150, reach: COR + 52, delay: 0.1 },
  { deg: 286, reach: ZO + 10, delay: 0.05 },
  { deg: 16, reach: COR + 56, delay: 0.14 },
];

function loser(l: (typeof LOSERS)[number], t: number, i: number, wave: number): SpermState {
  const tt = Math.max(0, t - l.delay);
  const r0 = lerp(330, l.reach, seg(tt, 0, 0.32));
  // Shut out as the cortical wave passes their side: they back off a little and fade.
  const blocked = clamp((wave - angDist(l.deg, WIN)) / 40);
  const r = r0 + 10 * blocked;
  const [x, y] = pt(r, l.deg);
  const fade = 1 - seg(t, 0.53, 0.6);
  return { x, y, deg: l.deg + 180, scale: 0.95, headO: fade, tailO: fade, acro: 1, coat: 1 - seg(tt, 0.2, 0.3), cloud: 0, wig: t * 150 + i * 1.7, amp: 1 - 0.6 * blocked };
}

// ---------------------------------------------------------------------------

/** The three phases as a persistent checklist (the notes' order), lit as the camera reaches each. */
function PhaseTrail({ t }: { t: number }) {
  const steps = [
    { n: 1, txt: 'Koroa erradiatua', a: 0.14, b: 0.3 },
    { n: 2, txt: 'Mintz peluzidoa', a: 0.3, b: 0.58 },
    { n: 3, txt: 'Mintzen fusioa', a: 0.58, b: 0.7 },
  ];
  const o = vis(t, 0.12);
  if (o <= 0.02) return null;
  return (
    <OnTop>
      <g opacity={o} pointerEvents="none" fontSize={12}>
        <text x={812} y={506} fill="#7c7870" fontSize={10.5} letterSpacing="0.12em" style={{ textTransform: 'uppercase' }}>
          Faseak
        </text>
        {steps.map((s, i) => {
          const now = t >= s.a && t < s.b;
          const done = t >= s.b;
          const y = 528 + i * 22;
          return (
            <g key={s.n}>
              {i > 0 && <line x1={821} y1={y - 15} x2={821} y2={y - 7} stroke={done || now ? '#ffb86b' : '#3b3833'} strokeWidth={1.4} />}
              <circle cx={821} cy={y} r={7.5} fill={now ? '#ffb86b' : done ? '#5a4128' : '#1c1b19'} stroke={now || done ? '#ffb86b' : '#4a4640'} strokeWidth={1.2} />
              <text x={821} y={y} dy="0.35em" textAnchor="middle" fill={now ? '#1a1206' : done ? '#ffd8a8' : '#8a857c'} fontSize={10} fontWeight={700}>
                {s.n}
              </text>
              <text x={835} y={y} dy="0.35em" fill={now ? '#ffe2bf' : done ? '#cfc6b8' : '#77726a'} fontWeight={now ? 700 : 500}>
                {s.txt}
              </text>
            </g>
          );
        })}
      </g>
    </OnTop>
  );
}

export function Fertilization({ t }: SceneProps) {
  const cam = camera(t);
  const zoomed = clamp((cam.s - 1.06) / 0.45);
  const coronaO = 1 - seg(t, 0.86, 0.96);
  const w = winner(t);

  // Cortical reaction: a wave of granule release runs round the oocyte from the entry point
  // (degrees covered on each side), and the zona hardens behind it.
  const wave = 180 * seg(t, 0.475, 0.548, (k) => k * k * (3 - 2 * k));
  const sealed = seg(t, 0.475, 0.6);

  // Fertilization cone, then the oolemma closes over the sinking head.
  const cone = seg(t, 0.585, 0.625) * (1 - seg(t, 0.66, 0.7));
  const fuse = seg(t, 0.6, 0.64);

  // Meiosis II completes: anaphase, the outer chromatids bud off in the second polar body.
  const ana = seg(t, 0.705, 0.74);
  const e2 = seg(t, 0.725, 0.795);
  const dome = 13 * seg(e2, 0, 0.42) * (1 - seg(e2, 0.48, 0.92));
  // The spindle fibres go; the chromatids left in the ovum stay until they become the female pronucleus.
  const fibres = 1 - seg(t, 0.75, 0.785);
  const spindleO = 1 - seg(t, 0.8, 0.835);
  const baseP = oolR(POLE, 0, 0);
  const pb2R = lerp(baseP + 3, baseP + 12.5, seg(e2, 0.42, 1));
  const pb2 = pt(pb2R, POLE);
  const pb2O = seg(e2, 0.36, 0.5);
  const neck = 7.5 * (1 - seg(e2, 0.5, 0.86)) * pb2O;
  const pb1 = pt(oolR(PB1, 0, 0) + 11, PB1);

  // Pronuclei: the male one from the sperm head, the female one from the chromatids left in the
  // ovum. They move to the centre, replicate their DNA, then their envelopes break down and the
  // chromosomes line up on the first cleavage spindle (the pronuclei do not fuse).
  const mForm = seg(t, 0.8, 0.85);
  const fForm = seg(t, 0.795, 0.84);
  const meet = seg(t, 0.835, 0.895);
  const mStart = pt(84, WIN);
  const fStart = pt(OO - 11 - 15 - 12, POLE);
  const mPos: P2 = [lerp(mStart[0], CX - 15, meet), lerp(mStart[1], CY, meet)];
  const fPos: P2 = [lerp(fStart[0], CX + 15, meet), lerp(fStart[1], CY, meet)];
  const replicate = seg(t, 0.865, 0.905);
  const envelope = 1 - seg(t, 0.922, 0.952);
  const gather = seg(t, 0.945, 0.985);
  const spindle1 = seg(t, 0.95, 0.99);
  const pronO = Math.max(mForm, fForm) * (1 - seg(t, 0.94, 0.96));

  const oolD = oolPath(cone, dome);
  const at = cam.at;
  const head = at(w.x, w.y);
  const front = at(...pt(winnerR(t) - 12, WIN));
  const zygoteId = t < 0.7 ? 'obozito-sekundarioa' : t < 0.92 ? 'obulua' : 'zigotoa';
  // Just inside the oolemma; the inset shrinks as the camera closes in so the anchor stays near the edge.
  const cyto = (deg: number) => oolR(deg, 0, 0) - 26 / cam.s - 4;

  return (
    <g>
      <defs>
        <radialGradient id="w1f-cyto" cx="38%" cy="32%" r="78%">
          <stop offset="0" stopColor="#fde9e2" />
          <stop offset="0.6" stopColor="#f7cfc6" />
          <stop offset="1" stopColor="#e9aaa0" />
        </radialGradient>
        <radialGradient id="w1f-zona" gradientUnits="userSpaceOnUse" cx={CX} cy={CY} r={ZO}>
          <stop offset={ZI / ZO} stopColor="#f6b3c3" stopOpacity="0.78" />
          <stop offset={(ZI + 5) / ZO} stopColor={C.zona} stopOpacity="0.42" />
          <stop offset={(ZO - 5) / ZO} stopColor={C.zona} stopOpacity="0.36" />
          <stop offset="1" stopColor="#e47c97" stopOpacity="0.8" />
        </radialGradient>
        <radialGradient id="w1f-corona" cx="35%" cy="30%" r="80%">
          <stop offset="0" stopColor="#e3dafd" />
          <stop offset="1" stopColor="#a592ea" />
        </radialGradient>
        <linearGradient id="w1f-sperm" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f2f6ff" />
          <stop offset="1" stopColor="#b7c6e6" />
        </linearGradient>
        <radialGradient id="w1f-enzyme">
          <stop offset="0" stopColor={C.acrosome} stopOpacity="0.6" />
          <stop offset="1" stopColor={C.acrosome} stopOpacity="0" />
        </radialGradient>
        <linearGradient id="w1f-rim" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0.85" />
          <stop offset="0.55" stopColor="#fff" stopOpacity="0.1" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <radialGradient id="w1f-corner" gradientUnits="userSpaceOnUse" cx={0} cy={0} r={400} gradientTransform="translate(0 0) scale(1 0.62)">
          <stop offset="0" stopColor="#060506" stopOpacity="0.9" />
          <stop offset="0.55" stopColor="#060506" stopOpacity="0.7" />
          <stop offset="1" stopColor="#060506" stopOpacity="0" />
        </radialGradient>
        {/* Eased (no knee where it starts), so it never reads as an edge across the cell. */}
        <linearGradient id="w1f-band" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#060506" stopOpacity="0" />
          <stop offset="0.2" stopColor="#060506" stopOpacity="0.035" />
          <stop offset="0.4" stopColor="#060506" stopOpacity="0.13" />
          <stop offset="0.6" stopColor="#060506" stopOpacity="0.3" />
          <stop offset="0.8" stopColor="#060506" stopOpacity="0.52" />
          <stop offset="1" stopColor="#060506" stopOpacity="0.72" />
        </linearGradient>
        <pattern id="w1f-gran" width="23" height="21" patternUnits="userSpaceOnUse">
          <circle cx="3" cy="4" r="0.9" fill="#b0606c" fillOpacity="0.32" />
          <circle cx="13" cy="9" r="0.6" fill="#b0606c" fillOpacity="0.28" />
          <circle cx="19" cy="17" r="1.1" fill="#b0606c" fillOpacity="0.22" />
          <circle cx="8" cy="15" r="0.5" fill="#b0606c" fillOpacity="0.3" />
          <circle cx="17" cy="3" r="0.45" fill="#fff" fillOpacity="0.5" />
        </pattern>
      </defs>

      <g>
        <g transform={cam.transform}>
          {/* Corona radiata. */}
          {coronaO > 0.02 && (
            <Part id="koroa-erradiatua" show={coronaO}>
              <Corona gapOpen={seg(t, 0.17, 0.27)} />
            </Part>
          )}

          {/* Zona pellucida: translucent glycoprotein shell with denser edges; it hardens (darkens)
              behind the cortical wave, and keeps the slit the sperm cut through it. */}
          <Part id="mintz-peluzidoa">
            <circle cx={CX} cy={CY} r={(ZI + ZO) / 2} fill="none" stroke="url(#w1f-zona)" strokeWidth={ZO - ZI} />
            {wave > 0.5 && (
              <path
                d={`M${pt((ZI + ZO) / 2, WIN - Math.min(wave, 179.9)).map((v) => v.toFixed(1)).join(',')} A${(ZI + ZO) / 2},${(ZI + ZO) / 2} 0 ${wave > 179 ? 1 : 0} 1 ${pt((ZI + ZO) / 2, WIN + Math.min(wave, 179.9)).map((v) => v.toFixed(1)).join(',')}`}
                fill="none"
                stroke="#b8395a"
                strokeOpacity={0.42}
                strokeWidth={ZO - ZI - 1}
              />
            )}
            {wave > 179 && <circle cx={CX} cy={CY} r={(ZI + ZO) / 2} fill="none" stroke="#b8395a" strokeOpacity={0.42 * seg(t, 0.543, 0.548)} strokeWidth={ZO - ZI - 1} />}
            <circle cx={CX} cy={CY} r={ZO} fill="none" stroke="#c4506d" strokeWidth={1.4} />
            <circle cx={CX} cy={CY} r={ZI} fill="none" stroke="#c4506d" strokeOpacity={0.75} strokeWidth={1} />
            <circle cx={CX} cy={CY} r={ZO - 1.8} fill="none" stroke="#fff" strokeOpacity={0.16} strokeWidth={1} />
            {/* Penetration slit, cut by the acrosomal enzymes. */}
            {t > 0.34 && (
              <path
                d={`M${pt(ZO + 1, WIN + 1.2).join(',')} L${pt(Math.max(ZI - 1, Math.min(ZO, winnerR(t) - 4)), WIN - 0.4).join(',')}`}
                stroke="#5a1430"
                strokeOpacity={0.55}
                strokeWidth={2.4}
                strokeLinecap="round"
              />
            )}
          </Part>

          {/* Perivitelline space between zona and oocyte. */}
          <circle cx={CX} cy={CY} r={ZI - 0.5} fill="rgba(255,214,222,0.07)" />

          {/* Polar bodies in the perivitelline space: the first from ovulation, the second budding now. */}
          <Part id="gorpuskulu-polarrak">
            <circle cx={pb1[0] + 1} cy={pb1[1] + 1.5} r={9} fill="#000" opacity={0.25} />
            <circle cx={pb1[0]} cy={pb1[1]} r={9} fill="url(#w1f-cyto)" stroke="rgba(150,60,72,0.7)" strokeWidth={1} />
            <circle cx={pb1[0] + 1} cy={pb1[1] + 0.5} r={2.6} fill="#b03a6e" opacity={0.7} />
            {pb2O > 0.02 && (
              <g opacity={pb2O}>
                {neck > 0.3 &&
                  (() => {
                    const a = pt(baseP - 1, POLE - (neck / baseP) * 57.3 * 0.9);
                    const b = pt(baseP - 1, POLE + (neck / baseP) * 57.3 * 0.9);
                    const m1 = pt(pb2R - 6, POLE - (neck / baseP) * 57.3 * 0.35);
                    const m2 = pt(pb2R - 6, POLE + (neck / baseP) * 57.3 * 0.35);
                    return <path d={`M${a.join(',')} Q${pt(baseP + 4, POLE).join(',')} ${m1.join(',')} L${m2.join(',')} Q${pt(baseP + 4, POLE).join(',')} ${b.join(',')} Z`} fill="#f7d6ce" />;
                  })()}
                <circle cx={pb2[0]} cy={pb2[1]} r={8} fill="url(#w1f-cyto)" stroke="rgba(150,60,72,0.7)" strokeWidth={1} />
              </g>
            )}
          </Part>

          {/* Oocyte → ovum → zygote. */}
          <Part id={zygoteId}>
            <path d={oolD} fill="url(#w1f-cyto)" />
            <path d={oolD} fill="url(#w1f-gran)" />
            <path d={oolD} fill="none" stroke="rgba(150,60,72,0.75)" strokeWidth={1.3} />
            <path d={oolD} fill="none" stroke="url(#w1f-rim)" strokeWidth={1.4} transform={`translate(${CX} ${CY}) scale(0.982) translate(${-CX} ${-CY})`} />
          </Part>

          {/* Cortical granules under the oolemma: released into the perivitelline space as the wave passes. */}
          <g pointerEvents="none">
            {Array.from({ length: 46 }, (_, i) => {
              const deg = (i / 46) * 360 + Math.sin(i * 7.3) * 2.5;
              const q = clamp((wave - angDist(deg, WIN)) / 26);
              if (q >= 1) return null;
              const r0 = oolR(deg, 0, 0);
              const [x, y] = pt(lerp(r0 - 5, r0 + 3, q), deg);
              return (
                <g key={i}>
                  <circle cx={x} cy={y} r={1.9 + q * 1.5} fill="#f5c94a" stroke="#9a6a10" strokeOpacity={0.5} strokeWidth={0.5} opacity={0.85 * (1 - q)} />
                  {q > 0.02 && <circle cx={x} cy={y} r={2 + q * 7} fill="#fde68a" opacity={0.35 * (1 - q)} />}
                </g>
              );
            })}
          </g>

          {/* Meiosis II spindle at the animal pole (metaphase arrest until the sperm enters). */}
          <Spindle x={SPIN[0]} y={SPIN[1]} axis={POLE} len={32} sep={ana} o={spindleO} fibres={fibres} colors={['#b03a6e', '#c4487c', '#a8326a', '#bf4277']} only={e2 > 0.42 ? -1 : undefined} />
          {/* The outer chromatids travel into the bud: the second polar body's chromosomes. */}
          {e2 > 0.3 && pb2O > 0.02 && (
            <g opacity={pb2O} pointerEvents="none">
              {[-3, 0, 3].map((v, i) => {
                const [x, y] = pt(pb2R, POLE);
                return <ellipse key={i} cx={x + v * Math.cos(rad(POLE + 90))} cy={y + v * Math.sin(rad(POLE + 90))} rx={1.1} ry={2.2} transform={`rotate(${POLE} ${x + v * Math.cos(rad(POLE + 90))} ${y + v * Math.sin(rad(POLE + 90))})`} fill="#a8326a" />;
              })}
            </g>
          )}

          {/* Pronuclei: female (pink) and male (blue). */}
          {pronO > 0.02 && (
            <Part id="pronukleoak" show={pronO}>
              <NucleusArt x={fPos[0]} y={fPos[1]} r={lerp(4, 17, fForm)} color={C.pronucleusF} seed={3} envelope={envelope} replicate={replicate} />
              <NucleusArt x={mPos[0]} y={mPos[1]} r={lerp(5, 17, mForm)} color={C.pronucleusM} seed={7} envelope={envelope} replicate={replicate} />
            </Part>
          )}

          {/* First cleavage spindle: maternal and paternal chromosomes on one plate. */}
          {t > 0.925 && (
            <g pointerEvents="none">
              <Spindle x={CX} y={CY} axis={0} len={SP1} o={spindle1} colors={[C.pronucleusF, C.pronucleusM, C.pronucleusF, C.pronucleusM, C.pronucleusF, C.pronucleusM]} asters />
              {[0, 1, 2, 3, 4, 5].map((i) => {
                const fromF = i % 2 === 0;
                const src = fromF ? [CX + 15, CY] : [CX - 15, CY];
                const v = (i / 5 - 0.5) * SP1 * 0.62;
                const x = lerp(src[0] + (i % 3) * 3 - 3, CX, gather);
                const y = lerp(src[1] + v * 0.6, CY + v, gather);
                return (
                  <g key={i} opacity={seg(t, 0.925, 0.945) * (1 - spindle1)}>
                    <ellipse cx={x - 2.2} cy={y} rx={1.9} ry={6.2} transform={`rotate(${i * 25} ${x} ${y})`} fill={fromF ? '#d9468f' : '#3f7fe0'} />
                    <ellipse cx={x + 2.2} cy={y} rx={1.9} ry={6.2} transform={`rotate(${i * 25} ${x} ${y})`} fill={fromF ? '#d9468f' : '#3f7fe0'} />
                  </g>
                );
              })}
            </g>
          )}

          {/* Spermatozoa (the zona and the cytoplasm veil them where they are inside). */}
          <Part id="espermatozoidea">
            {LOSERS.map((l, i) => (
              <Sperm key={i} s={loser(l, t, i, wave)} />
            ))}
            <Sperm s={w} />
          </Part>
          {/* Veils: what is inside the zona or the cytoplasm reads as inside. */}
          <Part id="mintz-peluzidoa">
            <circle cx={CX} cy={CY} r={(ZI + ZO) / 2} fill="none" stroke={C.zona} strokeOpacity={0.3} strokeWidth={ZO - ZI - 2} pointerEvents="none" />
          </Part>
          <Part id={zygoteId}>
            <path d={oolD} fill="#f7d2c9" fillOpacity={0.3 * seg(t, 0.62, 0.68)} pointerEvents="none" />
          </Part>

          {/* Membrane fusion: a brief glow where the two plasma membranes merge. */}
          {fuse > 0.02 && fuse < 0.99 && (
            <circle cx={pt(OO + 2, WIN)[0]} cy={pt(OO + 2, WIN)[1]} r={5 + 8 * fuse} fill="#fff1c9" opacity={0.55 * Math.sin(Math.PI * fuse)} pointerEvents="none" />
          )}

          {/* What the steps name but has no outline of its own. */}
          <Mark id="akrosoma" x={pt(winnerR(t) - 7, WIN)[0]} y={pt(winnerR(t) - 7, WIN)[1]} rx={8} show={vis(t, 0.02, 0.46) * w.headO} />
          <Mark id="kapazitazioa" x={w.x} y={w.y} rx={16} show={vis(t, 0.1, 0.26)} />
          <Mark id="akrosoma-erreakzioa" x={pt(winnerR(t) - 16, WIN)[0]} y={pt(winnerR(t) - 16, WIN)[1]} rx={11} show={vis(t, 0.28, 0.46)} />
          <Mark id="erreakzio-kortikala" show={vis(t, 0.44, 0.58)}>
            <g>
              <path
                d={`M${pt(OO - 3, WIN - Math.max(1, Math.min(wave, 179.9))).join(',')} A${OO - 3},${OO - 3} 0 ${wave > 179 ? 1 : 0} 1 ${pt(OO - 3, WIN + Math.max(1, Math.min(wave, 179.9))).join(',')}`}
                fill="none"
                stroke="#fde68a"
                strokeOpacity={0.2}
                strokeWidth={10}
              />
              <path
                className="mark-light"
                d={`M${pt(OO - 3, WIN - Math.max(1, Math.min(wave, 179.9))).join(',')} A${OO - 3},${OO - 3} 0 ${wave > 179 ? 1 : 0} 1 ${pt(OO - 3, WIN + Math.max(1, Math.min(wave, 179.9))).join(',')}`}
                fill="none"
                stroke="#fde68a"
                strokeOpacity={0.85}
                strokeWidth={2.2}
              />
            </g>
          </Mark>
        </g>
      </g>

      {/* Quiet backdrops so the overlays stay legible over the zoomed tissue (under every name and note). */}
      {zoomed > 0.01 && (
        <g pointerEvents="none" opacity={zoomed}>
          <rect x={0} y={0} width={420} height={260} fill="url(#w1f-corner)" />
          <rect x={0} y={380} width={1000} height={260} fill="url(#w1f-band)" />
        </g>
      )}

      {/* Labels — side gutters; anchors follow the camera. */}
      {(() => {
        // On the animal-pole close-up the corona is only a fringe at the far edge: the name steps back
        // rather than send a leader across the scene.
        // Below the route map (it ends at y≈146), so nothing covers the name.
        const a = ringAnchor(cam, [COR + 11, COR + 28, COR + 45], [200, 174]);
        const far = clamp((Math.hypot(a[0] - 200, a[1] - 174) - 240) / 60);
        return <Label id="koroa-erradiatua" x={200} y={174} ax={a[0]} ay={a[1]} show={coronaO * (1 - far)} />;
      })()}
      {(() => {
        // While the camera is on the animal pole the zona shows at the top left: the name rises to meet it.
        const y = lerp(470, 330, seg(t, 0.705, 0.735) * (1 - seg(t, 0.81, 0.85)));
        return <Label id="mintz-peluzidoa" x={200} y={y} {...xy(ringAnchor(cam, [ZI + 4, (ZI + ZO) / 2, ZO - 4], [200, y]))} />;
      })()}
      {(() => {
        const a = ringAnchor(cam, 0, [790, 210], cyto);
        return (
          <>
            <Label id="obozito-sekundarioa" x={790} y={210} align="start" ax={a[0]} ay={a[1]} show={vis(t, 0, 0.705)} />
            <Label id="obulua" x={790} y={210} align="start" ax={a[0]} ay={a[1]} show={vis(t, 0.705, 0.915)} />
            <Label id="zigotoa" x={790} y={210} align="start" ax={a[0]} ay={a[1]} show={vis(t, 0.915)} />
          </>
        );
      })()}
      {(() => {
        const a = t > 0.76 && t < 0.85 ? at(...pb2) : at(...pb1);
        return <Label id="gorpuskulu-polarrak" x={790} y={150} align="start" ax={a[0]} ay={a[1]} show={vis(t, 0.02, 0.93) * viewFade(a)} />;
      })()}
      <Label id="espermatozoidea" x={200} y={205} ax={head[0] - 10} ay={head[1] - 4} show={Math.max(vis(t, 0.02, 0.44), vis(t, 0.58, 0.7)) * viewFade(head)} />
      <Label id="akrosoma" x={200} y={250} ax={front[0]} ay={front[1]} show={vis(t, 0.02, 0.46) * viewFade(front)} />
      <Label id="kapazitazioa" x={200} y={292} ax={head[0]} ay={head[1] + 6} show={vis(t, 0.1, 0.26) * viewFade(head)} />
      {(() => {
        const a = at(...pt(winnerR(t) - 16, WIN));
        return <Label id="akrosoma-erreakzioa" x={200} y={334} ax={a[0]} ay={a[1]} show={vis(t, 0.28, 0.46) * viewFade(a)} />;
      })()}
      {(() => {
        const a = ringAnchor(cam, OO - 3, [804, 470]);
        return <Label id="erreakzio-kortikala" x={804} y={470} align="start" ax={a[0]} ay={a[1]} show={vis(t, 0.53, 0.58)} />;
      })()}
      {(() => {
        // On the pronucleus nearer the name (a short leader), never on the empty space between them.
        const fa = at(...fPos);
        const ma = at(...mPos);
        const a = Math.hypot(fa[0] - 804, fa[1] - 286) <= Math.hypot(ma[0] - 804, ma[1] - 286) ? fa : ma;
        return <Label id="pronukleoak" x={804} y={286} align="start" ax={a[0]} ay={a[1]} show={vis(t, 0.79, 0.94) * viewFade(a)} />;
      })()}
      {(() => {
        const a = ringAnchor(cam, 0, [804, 92], (d) => oolR(d, cone, 0) - 6);
        return <Label id="ernalkuntza" x={804} y={92} align="start" ax={a[0]} ay={a[1]} show={vis(t, 0.58, 0.7)} />;
      })()}

      <Note x={CX} y={606} tone="accent" show={vis(t, 0, 0.14)}>
        Obozito sekundarioa: haploidea, II. zatiketa meiotikoaren metafasean etenda
      </Note>
      <Note x={CX} y={606} tone="accent" show={vis(t, 0.14, 0.3)}>
        1. fasea — koroa erradiatua zeharkatzea (gaitzearen ondoren)
      </Note>
      <Note x={CX} y={606} tone="accent" show={vis(t, 0.3, 0.46)}>
        2. fasea — mintz peluzidoa zeharkatzea: akrosoma erreakzioa
      </Note>
      <Note x={CX} y={606} tone="accent" show={vis(t, 0.46, 0.58)}>
        Erreakzio kortikala: mintz peluzidoa iragazgaitza bihurtzen da
      </Note>
      <Note x={CX} y={606} tone="accent" show={vis(t, 0.58, 0.7)}>
        3. fasea — mintz plasmatikoen fusioa
      </Note>
      <Note x={CX} y={606} tone="accent" show={vis(t, 0.7, 0.82)}>
        II. zatiketa meiotikoa amaitu da: obulua + 2. gorpuskulu polarra
      </Note>
      <Note x={CX} y={606} tone="accent" show={vis(t, 0.82, 0.92)}>
        Pronukleoak elkartu eta DNA bikoizten da
      </Note>
      <Note x={CX} y={606} tone="accent" show={vis(t, 0.92)}>
        Zigotoa: mintz peluzidoz inguratua
      </Note>

      <PhaseTrail t={t} />
      <MiniTract day={0.24} />
      <Hud value="0." unit=" eguna" caption="Ernalkuntza" second={['Fasea', t < 0.14 ? '0' : t < 0.3 ? '1' : t < 0.58 ? '2' : t < 0.7 ? '3' : '—', t < 0.7 ? '/3' : '']} />
    </g>
  );
}

const xy = (p: P2) => ({ ax: p[0], ay: p[1] });
