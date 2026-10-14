'use client';

import { Arrow, C, Label, Note, Part, lerp, seg, smoothPath, type Pt, type SceneProps } from '@/components/kit';
import { spineAt } from '@/components/scenes/week5/skin';
import { Defs9, Steps, W, f1, vis } from './common';
import { BARS, EYE, REGIONS, SMT, SOM_N, SomiteBead, WindowEmbryo, g32, myotomeStrip, regionOf, somDepth, somite } from './EmbryoWindow';

/**
 * 9:ildaskatuak `paraxiala` — topic 5's day-32 embryo (same figure), with a window cut in the skin
 * along the back and over the head. Inside: the paraxial mesoderm, one band beside the neural tube;
 * in the head it segments only partly (7 somitomeres, no walls), from the occipital region down
 * completely (somites, region by region). Then where they go: somitomeres round the eye and into the
 * arches, somites into myotomes that reach the back, the body wall and the limbs.
 */

/** The extraocular muscles: a cone of crimson round the optic cup, its strips reaching the globe (drawn once they arrive). */
function EyeMuscles({ show }: { show: number }) {
  if (show <= 0.01) return null;
  const ring = `M${EYE[0] - 23},${EYE[1]}a23,23 0 1,0 46,0a23,23 0 1,0 -46,0ZM${EYE[0] - 12.5},${EYE[1]}a12.5,12.5 0 1,1 25,0a12.5,12.5 0 1,1 -25,0Z`;
  return (
    <g opacity={show}>
      <path d={ring} fill={W.striated} fillOpacity={0.38} fillRule="evenodd" />
      {[-90, -30, 30, 90, 150, 210].map((a, i) => {
        const r = (a * Math.PI) / 180;
        const p0: Pt = [EYE[0] + Math.cos(r) * 13, EYE[1] + Math.sin(r) * 13];
        const p1: Pt = [EYE[0] + Math.cos(r) * 22, EYE[1] + Math.sin(r) * 22];
        return <path key={i} d={`M${f1(p0[0])},${f1(p0[1])} L${f1(p1[0])},${f1(p1[1])}`} stroke={W.striated} strokeWidth={5} strokeLinecap="round" />;
      })}
    </g>
  );
}

/** The head close-up: somitomeres, eye and arches filling the frame (steps 2 and 4). */
const HF: Pt = [552, 192];
const HT: Pt = [500, 330];
const HS = 2.2;
function headCam(k: number) {
  const s = 1 + (HS - 1) * k;
  const tx = HF[0] + (HT[0] - HF[0]) * k;
  const ty = HF[1] + (HT[1] - HF[1]) * k;
  return {
    transform: `translate(${f1(tx)} ${f1(ty)}) scale(${s.toFixed(4)}) translate(${-HF[0]} ${-HF[1]})`,
    s,
    at: (p: Pt): Pt => [tx + (p[0] - HF[0]) * s, ty + (p[1] - HF[1]) * s],
  };
}
const mid = (b: (typeof BARS)[number], u: number): Pt => [lerp(b.top[0], b.bot[0], u), lerp(b.top[1], b.bot[1], u)];
/** A dot on the extraocular muscle cone (its front side, between two strips, clear of the arrows and the window edge). */
const EYE_MUSCLE: Pt = [EYE[0] + 18, EYE[1]];
/** A dot halfway along a cervical myotome (wide enough to hold it, clear of the limb arrows and the window edge). */
const myoDot: Pt = (() => {
  const s = somite(16);
  const L = lerp(22, 62, 1 - s.u) * 0.5;
  return [s.c[0] + s.n[0] * L, s.c[1] + s.n[1] * L];
})();

const S = g32.S;
const SOM_LINE = Array.from({ length: 48 }, (_, i) => {
  const u = lerp(0.06, 0.96, i / 47);
  return spineAt(S, u, somDepth(u)).p;
});

export function ParaxialMap({ t }: SceneProps) {
  // Step 1: the band draws in, head to tail. Step 2: close-up on the head, the seven somitomeres form one by one.
  const bandIn = seg(t, 0.004, 0.055);
  const band = vis(t, 0, 0.3);
  const smt = (i: number) => seg(t, 0.1 + i * 0.006, 0.112 + i * 0.006);
  const trunkSeg = (k: number) => seg(t, 0.19 + (k / SOM_N) * 0.035, 0.2 + (k / SOM_N) * 0.035);
  const toEye = seg(t, 0.285, 0.32);
  const toArch = seg(t, 0.29, 0.325);
  const myo = seg(t, 0.38, 0.42);
  const lit = (a: number, b: number) => vis(t, a, b);
  const bandFade = 1 - seg(t, 0.19, 0.24) * 0.85;
  const bandD = smoothPath([...SMT, ...SOM_LINE], false, 0.3);
  // The camera: in on the head for steps 2 and 4, back out for the trunk (3 and 5).
  const head = seg(t, 0.082, 0.102) * (1 - seg(t, 0.17, 0.19)) + seg(t, 0.262, 0.284) * (1 - seg(t, 0.36, 0.378));
  const cam = headCam(head);
  const whole = 1 - head;
  const atC = (p: Pt) => cam.at(p);

  return (
    <g>
      <Defs9 />
      <g transform={cam.transform}>
        <WindowEmbryo widen={myo}>
          {/* Paraxial mesoderm before segmentation: one band, head to tail, beside the neural tube. */}
          <Part id="mesodermo-paraxiala" show={band}>
            <path d={bandD} fill="none" stroke={C.mesoParaxial} strokeWidth={15} strokeLinecap="round" opacity={0.85 * bandFade} pathLength={1} strokeDasharray={`${bandIn.toFixed(4)} 2`} />
          </Part>
          {/* Head: seven somitomeres, loose mesenchyme without walls (they form one after the other). */}
          {SMT.map((p, i) => (
            <Part key={i} id="somitomeroak" show={smt(i)} groups={['mesodermo-paraxiala']}>
              <ellipse cx={p[0]} cy={p[1]} rx={9.5 * (0.6 + 0.4 * smt(i))} ry={10.5 * (0.6 + 0.4 * smt(i))} fill={C.mesoParaxial} opacity={0.8} />
              <ellipse cx={p[0]} cy={p[1]} rx={9.5} ry={10.5} fill="url(#w9-mes)" opacity={smt(i)} />
            </Part>
          ))}
          {/* Myotomes reach into the flank; their cells will make the back, body wall and limb muscles. */}
          <Part id="miotoma" show={myo}>
            {Array.from({ length: SOM_N - 6 }, (_, j) => {
              const k = j + 4;
              return <path key={k} d={myotomeStrip(k, myo)} stroke={W.myo} strokeWidth={lerp(12, 5, somite(k).u)} strokeLinecap="round" opacity={0.95} />;
            })}
          </Part>
          {/* Trunk: complete segmentation into somites, cranial to caudal, each region its own shade. */}
          {Array.from({ length: SOM_N }, (_, k) => {
            const s = trunkSeg(k);
            if (s <= 0.01) return null;
            return (
              <Part key={k} id={k < 4 ? 'somita-okzipitalak' : 'somitak'} show={s} groups={['mesodermo-paraxiala']}>
                <SomiteBead i={k} fill={regionOf(k).color} />
              </Part>
            );
          })}
          {/* The optic cup, and round it the extraocular muscles once the somitomere cells arrive. */}
          <Part id="begia">
            <circle cx={EYE[0]} cy={EYE[1]} r={11.5} fill="#1d1b2e" stroke="#0b0a14" strokeWidth={1} opacity={0.9} />
            <circle cx={EYE[0] - 3} cy={EYE[1] - 3} r={3} fill="#fff" opacity={0.25} />
          </Part>
          <Part id="begiaren-kanpoko-muskuluak" show={toEye}>
            <EyeMuscles show={1} />
          </Part>
        </WindowEmbryo>

        {/* Somitomere cells to the eye (1, 2, 3, 5), each to its own side of the muscle cone, and to the arches (4, 6, 7). */}
        {[0, 1, 2, 4].map((i, k) => {
          const an = ((-25 - k * 32) * Math.PI) / 180;
          const to: Pt = [EYE[0] + Math.cos(an) * 25, EYE[1] + Math.sin(an) * 25];
          const d = Math.hypot(to[0] - SMT[i][0], to[1] - SMT[i][1]);
          const from: Pt = [SMT[i][0] + ((to[0] - SMT[i][0]) / d) * 10, SMT[i][1] + ((to[1] - SMT[i][1]) / d) * 10];
          // The long ones (3 and 5) bow out on the ventral side, clear of the beads and of 4's arrow to the first arch.
          return <Arrow key={i} from={from} to={to} color={W.striated} width={2.4 / cam.s} head={8 / cam.s} bend={i === 4 ? 0.42 : i === 2 ? 0.3 : 0.22} show={lit(0.28, 0.37)} progress={toEye} />;
        })}
        {([[3, 0], [5, 1], [6, 2]] as const).map(([i, a]) => (
          <Arrow key={i} from={[SMT[i][0] + 2, SMT[i][1] + 10]} to={[BARS[a].top[0] - 1, BARS[a].top[1] + 22]} color={W.striated} width={2.4 / cam.s} head={8 / cam.s} bend={-0.15} show={lit(0.28, 0.37)} progress={toArch} />
        ))}
        <Part id="faringe-arkuak" show={toArch}>
          {BARS.slice(0, 3).map((b, i) => (
            <ellipse key={i} cx={(b.top[0] + b.bot[0]) / 2} cy={(b.top[1] + b.bot[1]) / 2} rx={b.w * 0.26} ry={(b.bot[1] - b.top[1]) * 0.34} fill={W.striated} opacity={0.8} />
          ))}
        </Part>
        {SMT.map((p, i) => (
          <text key={i} x={p[0]} y={p[1] + 3.5} textAnchor="middle" fontSize={10} fontWeight={800} fill="#fff" stroke="#10121c" strokeWidth={2.6} paintOrder="stroke" opacity={smt(i)}>
            {i + 1}
          </text>
        ))}

        <Arrow from={somite(11).c} to={[g32.arm[0] - 4, g32.arm[1] - 10]} color={W.striated} width={2.4} bend={0.2} show={vis(t, 0.39, 2)} progress={seg(t, 0.39, 0.42)} />
        <Arrow from={somite(27).c} to={[g32.leg[0] + 10, g32.leg[1] - 8]} color={W.striated} width={2.4} bend={0.2} show={vis(t, 0.39, 2)} progress={seg(t, 0.39, 0.42)} />
      </g>
      {/* In the close-up the head fills the frame: a soft dark band keeps the title and the caption legible. */}
      {head > 0.01 && (
        <g opacity={head} pointerEvents="none">
          <defs>
            <linearGradient id="w9-par-veil" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#000" stopOpacity={0.8} />
              <stop offset="0.09" stopColor="#000" stopOpacity={0} />
              <stop offset="0.88" stopColor="#000" stopOpacity={0} />
              <stop offset="1" stopColor="#000" stopOpacity={0.85} />
            </linearGradient>
          </defs>
          <rect x={0} y={0} width={1000} height={640} fill="url(#w9-par-veil)" />
        </g>
      )}

      {REGIONS.map((r) => {
        const s = somite(Math.round((r.from + r.to) / 2));
        // Region letter just outside the back, opposite the somite.
        const [x, y] = atC([s.c[0] - s.n[0] * 34, s.c[1] - s.n[1] * 34]);
        return (
          <Note key={r.name} x={x} y={y} size={12} tone="accent" show={seg(t, 0.215, 0.235) * whole}>
            {r.name}
          </Note>
        );
      })}

      <Note x={500} y={24} size={12.5} tone="dim">
        5. asteko enbrioia (5. gaiko irudia) · leihoa larruazalean: barruko mesodermoa
      </Note>
      <Steps
        t={t}
        steps={[
          [0, 'Muskulu ildaskatu guztiak mesodermo paraxialetik sortzen dira'],
          [0.08, 'Alde zefalikoan segmentazioa ez da osoa: 7 somitomero (paretarik gabe)'],
          [0.17, 'Okzipitaletik behera zatitze osoa: somitak (O, C, T, L, S, Co)'],
          [0.26, 'Buruko muskuluak: somitomeroetatik → begiaren inguruan eta faringe arkuetan'],
          [0.36, 'Gainerako gorputza: somitetatik (miotomak → bizkarra, paretak, gorputz-adarrak)'],
        ]}
      />

      {/* The whole embryo's names. */}
      <Label id="somita-okzipitalak" x={810} y={96} ax={somite(1).c[0]} ay={somite(1).c[1]} show={trunkSeg(1) * whole} small />
      <Label id="mesodermo-paraxiala" x={810} y={256} ax={SOM_LINE[12][0]} ay={SOM_LINE[12][1]} show={band * whole} />
      <Label id="somitak" x={810} y={360} ax={somite(14).c[0]} ay={somite(14).c[1]} show={trunkSeg(14) * whole} />
      <Label id="miotoma" x={810} y={330} ax={myoDot[0]} ay={myoDot[1]} show={myo * whole} />
      <Label id="somitomeroak" x={290} y={130} ax={SMT[4][0] - 3.5} ay={SMT[4][1] + 3} show={smt(0) * whole} />
      <Label id="begiaren-kanpoko-muskuluak" x={290} y={212} ax={EYE_MUSCLE[0]} ay={EYE_MUSCLE[1]} show={toEye * whole} />
      <Label id="begia" x={290} y={270} ax={EYE[0]} ay={EYE[1]} small show={whole} />
      <Label id="faringe-arkuak" x={290} y={350} ax={mid(BARS[0], 0.85)[0]} ay={mid(BARS[0], 0.85)[1]} small show={whole} />
      {/* The head close-up's names. */}
      {head > 0.02 && (
        <>
          <Label id="somita-okzipitalak" x={790} y={120} ax={atC(somite(1).c)[0]} ay={atC(somite(1).c)[1]} show={trunkSeg(1) * head} small />
          <Label id="somitomeroak" x={230} y={300} ax={atC([SMT[2][0] - 3.5, SMT[2][1] + 3])[0]} ay={atC([SMT[2][0] - 3.5, SMT[2][1] + 3])[1]} show={smt(0) * head} />
          <Label id="begiaren-kanpoko-muskuluak" x={230} y={440} ax={atC(EYE_MUSCLE)[0]} ay={atC(EYE_MUSCLE)[1]} show={toEye * head} />
          <Label id="begia" x={230} y={530} ax={atC(EYE)[0]} ay={atC(EYE)[1]} show={head} small />
          <Label id="faringe-arkuak" x={790} y={440} ax={atC(mid(BARS[1], 0.75))[0]} ay={atC(mid(BARS[1], 0.75))[1]} show={head} />
        </>
      )}
    </g>
  );
}
