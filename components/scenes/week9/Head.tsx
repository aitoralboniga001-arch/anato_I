'use client';

import { Journey, Label, Note, Part, clamp, seg, smoothPath, zoom, type Pt, type SceneProps } from '@/components/kit';
import { Defs9, HUE, Steps, W, f1, vis } from './common';
import { BARS, EYE, SMT, SomiteBead, WindowEmbryo, g32, somite } from './EmbryoWindow';
import { spineAt } from '@/components/scenes/week5/skin';

/**
 * Topic 9, stage `somitomeroak` (and the head views of `okzipitalak`). One colour per origin in every view,
 * so the colour itself is the thing to memorise:
 *   somitomeres 1–2 red · 3 orange · 4 pink · 5 lime · 6 emerald · 7 sky · occipital somites 1–2 indigo · 2–5 violet.
 * A muscle keeps its somitomere's colour from the embryo to the adult, and its nerve tag carries the same colour.
 */

export const SM_COLOR = [HUE.sm12, HUE.sm12, HUE.sm3, HUE.sm4, HUE.sm5, HUE.sm6, HUE.sm7] as const;

/* ------------------------------------------------------------------ */
/* The 5-week head: topic 5's day-32 embryo, camera pushed in on the    */
/* head, the inside seen through the skin window (EmbryoWindow).        */
/* ------------------------------------------------------------------ */

/** Camera on the head of the window embryo (same figure as the whole-embryo view and topic 5). */
export const HZ = zoom(528, 206, 2.2, 500, 318);
export const hz = (p: readonly number[]): Pt => HZ.at(p[0], p[1]);
const ARCH_ID = ['lehen-faringe-arkua', 'hioide-arkua', 'hirugarren-faringe-arkua', 'laugarren-seigarren-arkuak'];
/** Arch core colour: the somitomere (or occipital somites) whose mesoderm fills it. */
export const ARCH_COLOR = [SM_COLOR[3], SM_COLOR[5], SM_COLOR[6], HUE.os12];
export const archMid = (i: number): Pt => [(BARS[i].top[0] + BARS[i].bot[0]) / 2, (BARS[i].top[1] + BARS[i].bot[1]) / 2];
/** Mouth (stomodeum) between the frontonasal region and the first arch. */
export const MOUTH: Pt = [BARS[0].bot[0] - 11, BARS[0].bot[1] + 20];

/** A stream of mesoderm cells from a somitomere to its target (screen coordinates): a lead cell with its route, and followers. */
export function Stream({ from, to, bend = 0.25, prog, color, n = 5 }: { from: Pt; to: Pt; bend?: number; prog: number; color: string; n?: number }) {
  if (prog <= 0.01) return null;
  const mx = (from[0] + to[0]) / 2 - (to[1] - from[1]) * bend;
  const my = (from[1] + to[1]) / 2 + (to[0] - from[0]) * bend;
  const at = (u: number): Pt => [(1 - u) * (1 - u) * from[0] + 2 * (1 - u) * u * mx + u * u * to[0], (1 - u) * (1 - u) * from[1] + 2 * (1 - u) * u * my + u * u * to[1]];
  const lead = clamp(prog);
  const trail = Array.from({ length: 18 }, (_, i) => at((i / 17) * lead));
  return (
    <g>
      <Journey pts={trail} color={color} head={8} width={2.6} r={7} />
      {Array.from({ length: n }, (_, i) => {
        const u = clamp(lead - i * 0.07);
        const p = at(u);
        return <circle key={i} cx={f1(p[0])} cy={f1(p[1])} r={4.6} fill={color} stroke="rgba(10,10,20,0.6)" strokeWidth={1} opacity={u > 0.02 ? 1 : 0} />;
      })}
    </g>
  );
}

const EYE_RING: [number, string][] = [
  [-90, SM_COLOR[0]],
  [-30, SM_COLOR[2]],
  [30, SM_COLOR[0]],
  [90, SM_COLOR[0]],
  [150, SM_COLOR[0]],
  [210, SM_COLOR[4]],
];

/**
 * The head inside the window (model coordinates; wrap in HZ.transform): somitomeres in their colours,
 * the occipital somites, the optic cup with its muscle ring, and the arch cores tinted by their mesoderm.
 * `occ0` shows the first occipital somite (the one that disappears early), `archLit` tints arches 1, 2, 3, 4/6.
 */
export function HeadInside({ archLit, eyeMus = 0, occ0 = 0, smt = 1, occColor = true, children }: { archLit: number[]; eyeMus?: number; occ0?: number; smt?: number; occColor?: boolean; children?: React.ReactNode }) {
  const occFill = (i: number) => (!occColor ? W.paraxial : i === 0 ? HUE.os12 : HUE.os25);
  return (
    <>
      <WindowEmbryo id="w9head">
        <Part id="begia">
          <circle cx={EYE[0]} cy={EYE[1]} r={11.5} fill="#1d1b2e" stroke="#4b4870" strokeWidth={1} />
          <circle cx={EYE[0] - 2} cy={EYE[1]} r={5.5} fill="#d9e8ff" opacity={0.8} />
        </Part>
        <Part id="begiaren-kanpoko-muskuluak" show={eyeMus}>
          {EYE_RING.map(([a, c], i) => {
            const r = (a * Math.PI) / 180;
            const p0: Pt = [EYE[0] + Math.cos(r) * 13, EYE[1] + Math.sin(r) * 13];
            const p1: Pt = [EYE[0] + Math.cos(r) * 20, EYE[1] + Math.sin(r) * 20];
            return <path key={i} d={`M${f1(p0[0])},${f1(p0[1])} L${f1(p1[0])},${f1(p1[1])}`} stroke={c} strokeWidth={4.4} strokeLinecap="round" />;
          })}
        </Part>
        <Part id="somitomeroak" show={smt} groups={['mesodermo-paraxiala']}>
          {SMT.map((p, i) => (
            <g key={i}>
              <ellipse cx={p[0]} cy={p[1]} rx={9.5} ry={10.5} fill={SM_COLOR[i]} stroke="rgba(30,10,20,0.7)" strokeWidth={0.6} />
              <ellipse cx={p[0]} cy={p[1]} rx={9.5} ry={10.5} fill="url(#w9-mes)" />
            </g>
          ))}
        </Part>
        {occ0 > 0.01 && (
          <Part id="somita-okzipitalak" show={occ0} groups={['mesodermo-paraxiala']}>
            <SomiteBead i={-1} fill="#8b8fb0" />
          </Part>
        )}
        <Part id="somita-okzipitalak" groups={['mesodermo-paraxiala']}>
          {[0, 1, 2, 3].map((i) => (
            <SomiteBead key={i} i={i} fill={occFill(i)} />
          ))}
        </Part>
        <Part id="somitak" groups={['mesodermo-paraxiala']}>
          {[4, 5, 6, 7, 8].map((i) => (
            <SomiteBead key={i} i={i} fill={W.paraxial} />
          ))}
        </Part>
        {children}
      </WindowEmbryo>
      {/* Arch cores: the mesoderm that fills each arch, seen through its thin surface. */}
      {BARS.map((b, i) => (
        <Part key={i} id={ARCH_ID[i]} groups={['faringe-arkuak']}>
          <ellipse cx={archMid(i)[0]} cy={archMid(i)[1]} rx={b.w * 0.3} ry={(b.bot[1] - b.top[1]) * 0.36} fill={ARCH_COLOR[i]} opacity={0.88 * (archLit[i] ?? 0)} />
          <path d={`M${f1(b.top[0])},${f1(b.top[1] + 3)} L${f1(b.bot[0])},${f1(b.bot[1] - 3)}`} stroke="rgba(255,255,255,0.001)" strokeWidth={b.w * 0.8} />
        </Part>
      ))}
      <Part id="estomodeoa">
        <ellipse cx={MOUTH[0]} cy={MOUTH[1]} rx={9} ry={4} transform={`rotate(-12 ${MOUTH[0]} ${MOUTH[1]})`} fill="rgba(60,16,20,0.001)" />
      </Part>
    </>
  );
}

/** 9:somitomeroak-burua `burua` — the paraxial mesoderm of the head and where each somitomere goes. */
export function HeadEmbryo({ t }: SceneProps) {
  const toEye = seg(t, 0.1, 0.15);
  const toArch = seg(t, 0.57, 0.64);
  const archLit = [toArch, toArch, toArch, 0];
  const eyeMus = seg(t, 0.13, 0.16);
  const sm = SMT.map(hz);
  const eye = hz(EYE);
  const brain = hz(spineAt(g32.S, 0.27, 4).p);
  const skin = hz([g32.cran[0], g32.cran[1] - 50]);
  const heart = hz([g32.heart[0] - 20, g32.heart[1] - 30]);
  return (
    <g>
      <Defs9 />
      <g transform={HZ.transform}>
        <HeadInside archLit={archLit} eyeMus={eyeMus} />
      </g>
      {[0, 1, 2, 4].map((i, k) => (
        <Stream key={i} from={sm[i]} to={[eye[0] + 26 - k * 10, eye[1] - 40 + k * 6]} bend={0.3} prog={toEye} color={SM_COLOR[i]} />
      ))}
      {([[3, 0], [5, 1], [6, 2]] as const).map(([i, a]) => (
        <Stream key={i} from={sm[i]} to={hz(archMid(a))} bend={-0.18} prog={toArch} color={SM_COLOR[i]} />
      ))}
      {sm.map((p, i) => (
        <text key={i} x={p[0]} y={p[1] + 5} textAnchor="middle" fontSize={14} fontWeight={800} fill="#fff" stroke="#10121c" strokeWidth={3} paintOrder="stroke">
          {i + 1}
        </text>
      ))}

      {/* Which goes where: a legend that fills in with the steps (colour = somitomere). */}
      <Note x={400} y={30} size={12.5} tone="accent" show={vis(t, 0.11, 2)}>
        Somitomeroak 1, 2, 3 eta 5 → begiaren inguruan
      </Note>
      <Note x={400} y={52} size={12.5} tone="accent" show={vis(t, 0.57, 2)}>
        4 → 1. arkua · 6 → 2. arkua · 7 → 3. arkua
      </Note>
      <Steps
        t={t}
        steps={[
          [0, 'Buruko muskulu ildaskatuak: somitomeroetatik eta somita okzipitaletatik'],
          [0.1, '7 somitomero (egitura bikoitzak): 1, 2, 3 eta 5 → begiaren kanpoko muskuluak'],
          [0.56, 'Beste somitomeroak faringe arkuetan kokatzen dira: 4 → 1., 6 → 2., 7 → 3.'],
        ]}
      />

      <Label id="hodi-neurala" x={990} y={286} ax={brain[0]} ay={brain[1]} align="end" small />
      <Label id="somitomeroak" x={190} y={250} ax={sm[2][0] - 18} ay={sm[2][1]} />
      <Label id="begia" x={190} y={420} ax={eye[0] - 22} ay={eye[1]} small />
      <Label id="begiaren-kanpoko-muskuluak" x={190} y={470} ax={eye[0] - 30} ay={eye[1] + 26} show={eyeMus} />
      <Label id="estomodeoa" x={190} y={560} ax={hz(MOUTH)[0]} ay={hz(MOUTH)[1]} small />
      <Label id="bihotz-goragunea" x={190} y={606} ax={heart[0]} ay={heart[1]} small />
      <Label id="somita-okzipitalak" x={700} y={30} ax={hz(somite(1).c)[0]} ay={hz(somite(1).c)[1]} align="middle" />
      <Label id="somitak" x={990} y={250} ax={hz(somite(5).c)[0]} ay={hz(somite(5).c)[1]} align="end" small />
      {/* Paraxial mesoderm: the whole column, somitomeres to trunk somites (a span, its parts glow). */}
      <Label id="mesodermo-paraxiala" x={190} y={180} span={[sm[0], hz(somite(5).c)]} small />
      <Label id="azaleko-ektodermoa" x={190} y={110} ax={skin[0]} ay={skin[1]} small />
      <Label id="laugarren-seigarren-arkuak" x={810} y={356} ax={hz(BARS[3].bot)[0] + 4} ay={hz(BARS[3].bot)[1] - 4} small />
      <Label id="hirugarren-faringe-arkua" x={810} y={396} ax={hz(BARS[2].bot)[0] + 6} ay={hz(BARS[2].bot)[1] - 8} small />
      <Label id="hioide-arkua" x={810} y={436} ax={hz(BARS[1].bot)[0] + 6} ay={hz(BARS[1].bot)[1] - 10} small />
      <Label id="lehen-faringe-arkua" x={810} y={476} ax={hz(BARS[0].bot)[0] + 6} ay={hz(BARS[0].bot)[1] - 12} />
      <Label id="faringe-arkuak" x={810} y={520} ax={hz(BARS[0].bot)[0] + 2} ay={hz(BARS[0].bot)[1] + 6} small />
    </g>
  );
}

/* ------------------------------------------------------------------ */
/* The right eye from the front: six muscles, nerves III, IV, VI.        */
/* Medial (nose) is to the right of the picture.                         */
/* ------------------------------------------------------------------ */

const G: Pt = [500, 330];
const GR = 118;

/** A straight muscle band from the globe outwards (its tendon on the eyeball, its belly running back to the apex). */
function Band({ a, b, w, color }: { a: Pt; b: Pt; w: number; color: string }) {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const L = Math.hypot(dx, dy);
  const ux = dx / L;
  const uy = dy / L;
  const nx = -uy;
  const ny = ux;
  // Tendon (narrow, pale) on the globe, then the fleshy belly widening towards the back of the orbit.
  const prof: [number, number][] = [[0, 0.34], [0.14, 0.42], [0.3, 0.86], [0.6, 1], [1, 0.84]];
  const side = (sg: number) => prof.map(([u, k]) => [a[0] + dx * u + nx * sg * k * (w / 2), a[1] + dy * u + ny * sg * k * (w / 2)] as Pt);
  const outline = [...side(1), ...side(-1).reverse()];
  const d = smoothPath(outline, true, 0.25);
  const tendon = `M${f1(a[0])},${f1(a[1])} L${f1(a[0] + ux * L * 0.22)},${f1(a[1] + uy * L * 0.22)}`;
  return (
    <g>
      <path d={d} fill={color} stroke="rgba(40,8,12,0.75)" strokeWidth={1.3} />
      <path d={d} fill="url(#w9-fibres)" opacity={0.75} />
      <path d={d} fill="url(#w9-light)" />
      <path d={tendon} stroke="#fde9dc" strokeWidth={w * 0.26} strokeLinecap="round" opacity={0.85} />
    </g>
  );
}

/** A nerve: a cased yellow cord ending in a plug coloured like the somitomere it serves, with its number. */
export function Nerve({ pts, plug, color, num, show }: { pts: Pt[]; plug: Pt; color: string; num: string; show: number }) {
  if (show <= 0.01) return null;
  const d = smoothPath(pts, false, 0.3);
  return (
    <g opacity={show}>
      <path d={d} fill="none" stroke="#1a1405" strokeWidth={7} strokeLinecap="round" />
      <path d={d} fill="none" stroke={HUE.nerve} strokeWidth={3.6} strokeLinecap="round" />
      <circle cx={plug[0]} cy={plug[1]} r={11} fill={color} stroke="#1a1405" strokeWidth={2} />
      <text x={plug[0]} y={plug[1] + 4} textAnchor="middle" fontSize={10.5} fontWeight={800} fill="#10121c">
        {num}
      </text>
    </g>
  );
}

export function OrbitScene({ t }: SceneProps) {
  const sm12 = seg(t, 0.2, 0.25);
  const sm3 = seg(t, 0.3, 0.35);
  const sm5 = seg(t, 0.38, 0.43);
  const nerves = seg(t, 0.46, 0.52);
  const SR: [Pt, Pt] = [[G[0], G[1] - GR + 6], [G[0], 92]];
  const IR: [Pt, Pt] = [[G[0], G[1] + GR - 6], [G[0], 560]];
  const LR: [Pt, Pt] = [[G[0] - GR + 6, G[1]], [236, G[1]]];
  const MR: [Pt, Pt] = [[G[0] + GR - 6, G[1]], [764, G[1]]];
  const TROCH: Pt = [700, 156];
  return (
    <g>
      <Defs9 />
      {/* Bony orbit rim and the dark orbit behind the eye. */}
      <ellipse cx={G[0]} cy={G[1]} rx={300} ry={250} fill="#1a1420" stroke={W.bone} strokeWidth={22} strokeOpacity={0.85} />
      <ellipse cx={G[0]} cy={G[1]} rx={300} ry={250} fill="none" stroke={W.boneDeep} strokeWidth={2} />

      {/* Muscles drawn before the globe so their tendons slip under its edge. */}
      <Part id="begi-goiko-zuzena" show={0.25 + 0.75 * sm12} groups={['begiaren-kanpoko-muskuluak']}>
        <Band a={SR[0]} b={SR[1]} w={50} color={SM_COLOR[0]} />
      </Part>
      <Part id="begi-beheko-zuzena" show={0.25 + 0.75 * sm12} groups={['begiaren-kanpoko-muskuluak']}>
        <Band a={IR[0]} b={IR[1]} w={50} color={SM_COLOR[0]} />
      </Part>
      <Part id="begi-erdiko-zuzena" show={0.25 + 0.75 * sm12} groups={['begiaren-kanpoko-muskuluak']}>
        <Band a={MR[0]} b={MR[1]} w={50} color={SM_COLOR[0]} />
      </Part>
      <Part id="begi-alboko-zuzena" show={0.25 + 0.75 * sm5} groups={['begiaren-kanpoko-muskuluak']}>
        <Band a={LR[0]} b={LR[1]} w={50} color={SM_COLOR[4]} />
      </Part>
      {/* Superior oblique: belly back along the upper medial wall, tendon through the trochlea, then back to the globe. */}
      <Part id="begi-goiko-laprana" show={0.25 + 0.75 * sm3} groups={['begiaren-kanpoko-muskuluak']}>
        <Band a={TROCH} b={[806, 96]} w={30} color={SM_COLOR[2]} />
        <path d={`M${TROCH[0]},${TROCH[1]} Q620,190 ${G[0] - 40},${G[1] - GR + 30}`} fill="none" stroke="#3a1a06" strokeWidth={13} strokeLinecap="round" />
        <path d={`M${TROCH[0]},${TROCH[1]} Q620,190 ${G[0] - 40},${G[1] - GR + 30}`} fill="none" stroke="#fde2c8" strokeWidth={8} strokeLinecap="round" />
      </Part>
      <Part id="troklea" show={0.4 + 0.6 * sm3}>
        <path d={`M${TROCH[0] - 16},${TROCH[1] - 6} q16,-22 32,0 q-16,22 -32,0Z`} fill="none" stroke={W.cart} strokeWidth={6} />
      </Part>
      {/* Inferior oblique: from the medial floor, under the globe, to its lower lateral side. */}
      <Part id="begi-beheko-laprana" show={0.25 + 0.75 * sm12} groups={['begiaren-kanpoko-muskuluak']}>
        <path d={`M690,520 Q560,500 ${G[0] - 70},${G[1] + GR - 26}`} fill="none" stroke="rgba(40,8,12,0.75)" strokeWidth={34} strokeLinecap="round" />
        <path d={`M690,520 Q560,500 ${G[0] - 70},${G[1] + GR - 26}`} fill="none" stroke={SM_COLOR[0]} strokeWidth={31} strokeLinecap="round" />
      </Part>

      {/* The eyeball. */}
      <Part id="begia">
        <circle cx={G[0]} cy={G[1]} r={GR} fill="#f4f1ea" stroke="#9c9486" strokeWidth={1.5} />
        <circle cx={G[0]} cy={G[1]} r={48} fill="#3f6fb0" />
        {Array.from({ length: 24 }, (_, i) => {
          const an = (i / 24) * Math.PI * 2;
          return <path key={i} d={`M${f1(G[0] + Math.cos(an) * 20)},${f1(G[1] + Math.sin(an) * 20)} L${f1(G[0] + Math.cos(an) * 46)},${f1(G[1] + Math.sin(an) * 46)}`} stroke="#9fc0ee" strokeWidth={1.4} opacity={0.6} />;
        })}
        <circle cx={G[0]} cy={G[1]} r={18} fill="#06080e" />
        <circle cx={G[0] - 12} cy={G[1] - 14} r={6} fill="#fff" opacity={0.7} />
        <circle cx={G[0]} cy={G[1]} r={GR} fill="url(#w9-ball)" />
      </Part>
      {/* Tendon of the superior oblique crosses on top of the globe to its insertion. */}
      <circle cx={G[0] - 40} cy={G[1] - GR + 30} r={5} fill="#fde2c8" opacity={0.25 + 0.75 * sm3} />

      {/* Nerves III (1–2), IV (3), VI (5): each plug has the colour of the somitomere it serves. */}
      {/* Nerves III (1–2), IV (3), VI (5): a nerve twig reaching each muscle, its tag in the somitomere's colour. */}
      <Part id="nerbio-begi-eragilea" show={nerves} groups={['nerbio-kranialak']}>
        {([
          [[560, 112], [500, 150]],
          [[560, 548], [500, 505]],
          [[724, 392], [690, 330]],
          [[660, 566], [612, 506]],
        ] as [Pt, Pt][]).map(([o, p], i) => (
          <Nerve key={i} pts={[o, p]} plug={p} color={SM_COLOR[0]} num="III" show={1} />
        ))}
      </Part>
      <Part id="nerbio-troklearra" show={nerves} groups={['nerbio-kranialak']}>
        <Nerve pts={[[846, 64], [772, 118]]} plug={[772, 118]} color={SM_COLOR[2]} num="IV" show={1} />
      </Part>
      <Part id="nerbio-aldentzailea" show={nerves} groups={['nerbio-kranialak']}>
        <Nerve pts={[[214, 280], [300, 330]]} plug={[300, 330]} color={SM_COLOR[4]} num="VI" show={1} />
      </Part>
      <Note x={500} y={30} size={12.5} tone="dim">
        Eskuineko begia aurretik · muskuluak atzerantz doaz, begi-zuloaren hondoraino
      </Note>
      <Note x={168} y={120} size={14} tone="accent" show={nerves}>
        LR₆ SO₄ · gainerakoak III
      </Note>

      <Steps
        t={t}
        steps={[
          [0.2, '1. eta 2. somitomeroak → goiko, beheko eta erdialdeko zuzenak + beheko laprana'],
          [0.3, '3. somitomeroa → goiko muskulu laprana (troklean barrena)'],
          [0.38, '5. somitomeroa → alboko muskulu zuzena'],
          [0.46, 'III → 1–2. somitomeroenak · IV → 3.arena · VI → 5.arena'],
        ]}
      />

      {/* The three cranial nerves, each on its twig, and their family name as the key to their numbers. */}
      <Label id="nerbio-begi-eragilea" x={900} y={280} ax={707} ay={361} align="middle" show={nerves} small />
      <Label id="nerbio-troklearra" x={920} y={150} ax={809} ay={91} align="end" show={nerves} small />
      <Label id="nerbio-aldentzailea" x={120} y={250} ax={257} ay={305} align="middle" show={nerves} small />
      <Label id="nerbio-kranialak" x={30} y={606} align="start" text="Nerbio kranialak: III, IV, VI" show={nerves} small />
      <Label id="begi-goiko-zuzena" x={420} y={62} ax={G[0] - 8} ay={150} align="middle" />
      <Label id="begi-beheko-zuzena" x={500} y={596} ax={G[0]} ay={520} align="middle" />
      <Label id="begi-alboko-zuzena" x={210} y={392} ax={260} ay={G[1] + 14} align="middle" />
      <Label id="begi-erdiko-zuzena" x={790} y={392} ax={740} ay={G[1] + 14} align="middle" />
      <Label id="begi-goiko-laprana" x={680} y={108} ax={760} ay={118} align="end" />
      <Label id="troklea" x={890} y={240} ax={TROCH[0] + 14} ay={TROCH[1] + 6} align="end" small />
      <Label id="begi-beheko-laprana" x={760} y={560} ax={650} ay={512} align="start" />
      <Label id="begia" x={360} y={470} ax={430} ay={410} align="middle" small />
      <Label id="nerbio-begi-eragilea" x={990} y={600} ax={662} ay={568} align="end" show={nerves} small />
      <Label id="nerbio-troklearra" x={900} y={60} ax={848} ay={64} align="end" show={nerves} small />
      <Label id="nerbio-aldentzailea" x={24} y={250} ax={214} ay={280} align="start" show={nerves} small />
    </g>
  );
}
