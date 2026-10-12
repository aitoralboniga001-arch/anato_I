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

/** The extraocular muscle strips round the optic cup (drawn once they arrive). */
function EyeMuscles({ show }: { show: number }) {
  if (show <= 0.01) return null;
  return (
    <g opacity={show}>
      {[-90, -30, 30, 90, 150, 210].map((a, i) => {
        const r = (a * Math.PI) / 180;
        const p0: Pt = [EYE[0] + Math.cos(r) * 13, EYE[1] + Math.sin(r) * 13];
        const p1: Pt = [EYE[0] + Math.cos(r) * 21, EYE[1] + Math.sin(r) * 21];
        return <path key={i} d={`M${f1(p0[0])},${f1(p0[1])} L${f1(p1[0])},${f1(p1[1])}`} stroke={W.striated} strokeWidth={5} strokeLinecap="round" />;
      })}
    </g>
  );
}

const S = g32.S;
const SOM_LINE = Array.from({ length: 48 }, (_, i) => {
  const u = lerp(0.06, 0.96, i / 47);
  return spineAt(S, u, somDepth(u)).p;
});

export function ParaxialMap({ t }: SceneProps) {
  const band = vis(t, 0, 0.3);
  const headSeg = seg(t, 0.08, 0.15);
  const trunkSeg = (k: number) => seg(t, 0.17 + (k / SOM_N) * 0.07, 0.19 + (k / SOM_N) * 0.07);
  const toEye = seg(t, 0.27, 0.33);
  const toArch = seg(t, 0.28, 0.34);
  const myo = seg(t, 0.37, 0.43);
  const lit = (a: number, b: number) => vis(t, a, b);
  const bandFade = 1 - seg(t, 0.17, 0.26) * 0.85;
  const bandD = smoothPath([...SMT, ...SOM_LINE], false, 0.3);

  return (
    <g>
      <Defs9 />
      <WindowEmbryo widen={myo}>
        {/* Paraxial mesoderm before segmentation: one band, head to tail, beside the neural tube. */}
        <Part id="mesodermo-paraxiala" show={band}>
          <path d={bandD} fill="none" stroke={C.mesoParaxial} strokeWidth={15} strokeLinecap="round" opacity={0.85 * bandFade} />
        </Part>
        {/* Head: seven somitomeres, loose mesenchyme without walls. */}
        <Part id="somitomeroak" show={headSeg} groups={['mesodermo-paraxiala']}>
          {SMT.map((p, i) => (
            <g key={i}>
              <ellipse cx={p[0]} cy={p[1]} rx={9.5} ry={10.5} fill={C.mesoParaxial} opacity={0.8} />
              <ellipse cx={p[0]} cy={p[1]} rx={9.5} ry={10.5} fill="url(#w9-mes)" />
            </g>
          ))}
        </Part>
        {/* Myotomes reach into the flank; their cells will make the back, body wall and limb muscles. */}
        <Part id="miotoma" show={myo}>
          {Array.from({ length: SOM_N - 6 }, (_, j) => {
            const k = j + 4;
            return <path key={k} d={myotomeStrip(k, myo)} stroke={W.myo} strokeWidth={lerp(11, 4, somite(k).u)} strokeLinecap="round" opacity={0.95} />;
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
        <Part id="begiaren-kanpoko-muskuluak" show={toEye}>
          <circle cx={EYE[0]} cy={EYE[1]} r={11} fill="#1d1b2e" opacity={0.85} />
          <EyeMuscles show={1} />
        </Part>
      </WindowEmbryo>

      {SMT.map((p, i) => (
        <text key={i} x={p[0]} y={p[1] + 3.5} textAnchor="middle" fontSize={10} fontWeight={800} fill="#fff" stroke="#10121c" strokeWidth={2.6} paintOrder="stroke" opacity={headSeg}>
          {i + 1}
        </text>
      ))}
      {REGIONS.map((r) => {
        const s = somite(Math.round((r.from + r.to) / 2));
        // Region letter just outside the back, opposite the somite.
        const x = s.c[0] - s.n[0] * 34;
        const y = s.c[1] - s.n[1] * 34;
        return (
          <Note key={r.name} x={x} y={y} size={12} tone="accent" show={seg(t, 0.22, 0.26)}>
            {r.name}
          </Note>
        );
      })}

      {/* Somitomere cells to the eye (1, 2, 3, 5) and to the arches (4, 6, 7); the arch cores take the muscle colour. */}
      {[0, 1, 2, 4].map((i, k) => (
        <Arrow key={i} from={SMT[i]} to={[EYE[0] + 12 - k * 3, EYE[1] - 14 + k * 3]} color={W.striated} width={1.8} bend={0.3} show={lit(0.26, 0.36)} progress={toEye} />
      ))}
      {([[3, 0], [5, 1], [6, 2]] as const).map(([i, a]) => (
        <Arrow key={i} from={SMT[i]} to={[BARS[a].top[0] - 1, BARS[a].top[1] + 22]} color={W.striated} width={1.8} bend={-0.15} show={lit(0.26, 0.36)} progress={toArch} />
      ))}
      <Part id="faringe-arkuak" show={toArch}>
        {BARS.slice(0, 3).map((b, i) => (
          <ellipse key={i} cx={(b.top[0] + b.bot[0]) / 2} cy={(b.top[1] + b.bot[1]) / 2} rx={b.w * 0.26} ry={(b.bot[1] - b.top[1]) * 0.34} fill={W.striated} opacity={0.8} />
        ))}
      </Part>
      <Arrow from={somite(11).c} to={[g32.arm[0] - 4, g32.arm[1] - 10]} color={W.striated} width={2.4} bend={0.2} show={vis(t, 0.39, 2)} progress={seg(t, 0.39, 0.44)} />
      <Arrow from={somite(27).c} to={[g32.leg[0] + 10, g32.leg[1] - 8]} color={W.striated} width={2.4} bend={0.2} show={vis(t, 0.39, 2)} progress={seg(t, 0.39, 0.44)} />

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

      <Label id="somita-okzipitalak" x={810} y={96} ax={somite(1).c[0]} ay={somite(1).c[1]} show={trunkSeg(1)} small />
      <Label id="mesodermo-paraxiala" x={810} y={256} ax={SOM_LINE[12][0]} ay={SOM_LINE[12][1]} show={band} />
      <Label id="somitak" x={810} y={360} ax={somite(14).c[0]} ay={somite(14).c[1]} show={trunkSeg(14)} />
      <Label id="miotoma" x={810} y={440} ax={lerp(somite(20).c[0], somite(20).c[0] + somite(20).n[0] * 22, myo)} ay={lerp(somite(20).c[1], somite(20).c[1] + somite(20).n[1] * 22, myo)} show={myo} />
      <Label id="somitomeroak" x={290} y={130} ax={SMT[4][0] - 8} ay={SMT[4][1] - 6} show={headSeg} />
      <Label id="begiaren-kanpoko-muskuluak" x={290} y={226} ax={EYE[0] - 16} ay={EYE[1] - 12} show={toEye} />
      <Label id="begia" x={290} y={290} ax={EYE[0] - 8} ay={EYE[1] + 6} small />
      <Label id="faringe-arkuak" x={290} y={350} ax={BARS[0].bot[0] - 6} ay={BARS[0].bot[1] - 8} small />
    </g>
  );
}
