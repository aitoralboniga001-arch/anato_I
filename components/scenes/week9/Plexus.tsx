'use client';

import { Label, Note, Part, lerp, seg, smoothPath, type Pt, type SceneProps } from '@/components/kit';
import { FetusFront, fetusLimb } from '@/components/scenes/week8/Limbs';
import { HUE, Steps, W, f1, resample, vis } from './common';

/**
 * 9:epaxial-hipaxial `sareak` — topic 8's 8th-week embryo from the front (limbs already rotated, flexors red and
 * extensors blue as in topic 8). On it, the anterior rami (green glow, as in the section): on the thorax one
 * intercostal nerve per segment (metameric); at the limbs the fibres of several levels mix in a plexus and leave
 * as named nerves.
 */

type Limb = ReturnType<typeof fetusLimb>;
const sub = (pts: Pt[], u: number) => resample(pts, 60).slice(0, Math.max(2, Math.round(u * 59) + 1));

/** A point on a limb at fraction a of the proximal piece (a ≤ 1) or 1 + fraction of the distal one, moved `o` limb
 * widths toward the midline (negative: laterally). */
function onLimb(l: Limb, a: number, o: number): Pt {
  const [p, q] = a <= 1 ? [l.root, l.joint] : [l.joint, l.end];
  const k = a <= 1 ? a : a - 1;
  const x = lerp(p[0], q[0], k);
  const y = lerp(p[1], q[1], k);
  const dx = q[0] - p[0];
  const dy = q[1] - p[1];
  const len = Math.hypot(dx, dy) || 1;
  let n: Pt = [-dy / len, dx / len];
  // Toward the midline (x = 500).
  if (n[0] * (500 - x) < 0) n = [-n[0], -n[1]];
  return [x + n[0] * o * l.w, y + n[1] * o * l.w];
}

/** A nerve: dark rim, yellow core, a green glow (anterior ramus); `back` ones (behind the limb) fainter. */
function NerveLine({ pts, u, glow = 1, back = false, w = 3.4 }: { pts: Pt[]; u: number; glow?: number; back?: boolean; w?: number }) {
  if (u <= 0.01) return null;
  const d = smoothPath(sub(pts, u), false, 0.3);
  return (
    <g opacity={back ? 0.55 : 1}>
      <path d={d} fill="none" stroke={HUE.ventralRamus} strokeWidth={w + 7} strokeLinecap="round" opacity={0.35 * glow} />
      <path d={d} fill="none" stroke="#5a4706" strokeWidth={w + 2} strokeLinecap="round" />
      <path d={d} fill="none" stroke={W.nerve} strokeWidth={w} strokeLinecap="round" />
    </g>
  );
}

const ARMS = [fetusLimb(0), fetusLimb(1)];
const LEGS = [fetusLimb(2), fetusLimb(3)];
const sideX = (x: number, ms: number) => (ms > 0 ? x : 1000 - x);

/** Plexus knot near the limb root, fed by roots from several levels of the trunk. */
function knot(l: Limb): Pt {
  return onLimb(l, 0.06, 0.15);
}
function roots(l: Limb, ys: number[], x0: number): Pt[][] {
  const ms = l.root[0] < 500 ? 1 : -1;
  const k = knot(l);
  return ys.map((y) => [[sideX(x0, ms), y], [lerp(sideX(x0, ms), k[0], 0.55), lerp(y, k[1], 0.7)], k]);
}

export function FetusNerves({ t }: SceneProps) {
  const flex = vis(t, 0.64, 0.7);
  const ic = seg(t, 0.7, 0.75);
  const plex = seg(t, 0.8, 0.84);
  const named = seg(t, 0.88, 0.93);
  // Intercostal nerves: one per segment round the chest wall, both sides.
  const IC = Array.from({ length: 6 }, (_, k) => 220 + k * 15);
  const icPath = (y: number, ms: number): Pt[] => [[sideX(410, ms), y], [sideX(432, ms), y + 9], [sideX(466, ms), y + 16]];
  const upNerves = (l: Limb) => ({
    erradiala: [knot(l), onLimb(l, 0.4, -0.4), onLimb(l, 1, -0.45), onLimb(l, 1.9, -0.4)],
    ertaina: [knot(l), onLimb(l, 0.4, 0.05), onLimb(l, 1, 0.05), onLimb(l, 1.92, 0.05)],
    kubitala: [knot(l), onLimb(l, 0.4, 0.45), onLimb(l, 1, 0.5), onLimb(l, 1.9, 0.45)],
  });
  const lowNerves = (l: Limb) => ({
    femorala: [knot(l), onLimb(l, 0.35, -0.2), onLimb(l, 0.85, -0.15)],
    bultzatzailea: [knot(l), onLimb(l, 0.3, 0.45), onLimb(l, 0.65, 0.5)],
    ziatikoa: [knot(l), onLimb(l, 0.4, 0.05), onLimb(l, 1, 0.05), onLimb(l, 1.85, 0.05)],
  });
  const ups = ARMS.map(upNerves);
  const lows = LEGS.map(lowNerves);
  const R = ARMS[1];
  const RL = LEGS[1];
  return (
    <g>
      <FetusFront ru={1} rl={1} />
      <Part id="saihets-arteko-nerbioak" show={ic}>
        {IC.flatMap((y, k) => [1, -1].map((ms) => <NerveLine key={`${k}${ms}`} pts={icPath(y, ms)} u={seg(t, 0.7 + k * 0.006, 0.73 + k * 0.006)} w={2.6} />))}
      </Part>
      <Part id="nerbio-sareak" show={plex}>
        {[...ARMS.map((l) => roots(l, [170, 180, 190, 200, 210], 466)), ...LEGS.map((l) => roots(l, [400, 410, 420, 430, 440], 484))].flatMap((rs, i) =>
          rs.map((r, j) => <NerveLine key={`${i}${j}`} pts={r} u={seg(t, 0.8 + j * 0.006, 0.83 + j * 0.006)} w={2.4} />),
        )}
        {[...ARMS, ...LEGS].map((l, i) => {
          const k = knot(l);
          return <ellipse key={i} cx={f1(k[0])} cy={f1(k[1])} rx={9} ry={7} fill={W.nerve} stroke="#5a4706" strokeWidth={1.6} opacity={plex} />;
        })}
      </Part>
      {(
        [
          ['nerbio-erradiala', ups.map((n) => n.erradiala), true],
          ['nerbio-ertaina', ups.map((n) => n.ertaina), false],
          ['nerbio-kubitala', ups.map((n) => n.kubitala), false],
          ['nerbio-femorala', lows.map((n) => n.femorala), false],
          ['nerbio-bultzatzailea', lows.map((n) => n.bultzatzailea), false],
          ['nerbio-ziatikoa', lows.map((n) => n.ziatikoa), true],
        ] as const
      ).map(([id, paths, back]) => (
        <Part key={id} id={id} show={named} groups={['nerbio-sareak']}>
          {paths.map((p, i) => (
            <NerveLine key={i} pts={p as Pt[]} u={named} back={back} w={2.8} />
          ))}
        </Part>
      ))}

      {/* Motor fibres from several levels mixing in each plexus, then shared out to the named nerves. */}
      <Part id="axoi-motoreak" show={plex}>
        {[...ARMS.map((l) => roots(l, [170, 180, 190, 200, 210], 466)), ...LEGS.map((l) => roots(l, [400, 410, 420, 430, 440], 484))].flatMap((rs, i) =>
          rs.map((r, j) => {
            const u = seg(t, 0.8 + j * 0.006, 0.83 + j * 0.006);
            return u > 0.01 ? <path key={`${i}${j}`} d={smoothPath(sub(r, u), false, 0.3)} fill="none" stroke="#fb7185" strokeWidth={1.1} strokeLinecap="round" /> : null;
          }),
        )}
      </Part>
      <Note x={24} y={24} size={12.5} align="start">
        8. astea · aurretik (8. gaiko irudia)
      </Note>
      <Note x={500} y={262} size={12.5} tone="accent" show={vis(t, 0.7, 0.8)}>
        Saihets artekoak: metamerikoak, segmentu bakoitzean bat
      </Note>
      <Note x={24} y={600} size={12} align="start" tone="dim" show={named}>
        (atzean doazenak argiago: erradiala, ziatikoa)
      </Note>
      <Steps
        t={t}
        steps={[
          [0.64, 'Bi muskulu mota gorputz-adarretan: tolestatzaileak (gorria) eta hedatzaileak (urdina)'],
          [0.7, 'Gorputz paretan: saihets arteko muskuluen inerbazioa metamerikoa (segmentarioa)'],
          [0.8, 'Gorputz-adarretan: maila askotako zuntz motoreak nerbio sareetan nahasten dira'],
          [0.88, 'Saretik nerbio jakinak: behekoan femorala, ziatikoa, bultzatzailea · goikoan erradiala, ertaina, kubitala'],
        ]}
      />

      <Label id="axoi-motoreak" x={14} y={170} align="start" ax={roots(ARMS[0], [190], 466)[0][1][0]} ay={roots(ARMS[0], [190], 466)[0][1][1]} show={plex} small text="Zuntz motoreak (maila askotakoak)" />
      <Label id="muskulu-tolestatzaileak" x={14} y={300} align="start" ax={onLimb(ARMS[0], 1.5, 0)[0]} ay={onLimb(ARMS[0], 1.5, 0)[1]} show={flex} />
      <Label id="muskulu-hedatzaileak" x={14} y={500} align="start" ax={onLimb(LEGS[0], 0.5, -0.1)[0]} ay={onLimb(LEGS[0], 0.5, -0.1)[1]} show={flex} />
      <Label id="saihets-arteko-nerbioak" x={810} y={240} align="start" ax={sideX(440, -1)} ay={IC[2] + 10} show={ic} />
      <Label id="nerbio-sareak" x={810} y={170} align="start" ax={knot(R)[0] + 6} ay={knot(R)[1] - 4} show={plex} />
      <Label id="nerbio-erradiala" x={810} y={290} align="start" ax={onLimb(R, 0.6, -0.42)[0]} ay={onLimb(R, 0.6, -0.42)[1]} show={named} small />
      <Label id="nerbio-ertaina" x={810} y={330} align="start" ax={onLimb(R, 1.5, 0.05)[0]} ay={onLimb(R, 1.5, 0.05)[1]} show={named} small />
      <Label id="nerbio-kubitala" x={810} y={370} align="start" ax={onLimb(R, 1.6, 0.47)[0]} ay={onLimb(R, 1.6, 0.47)[1]} show={named} small />
      <Label id="nerbio-femorala" x={810} y={470} align="start" ax={onLimb(RL, 0.6, -0.18)[0]} ay={onLimb(RL, 0.6, -0.18)[1]} show={named} small />
      <Label id="nerbio-bultzatzailea" x={810} y={510} align="start" ax={onLimb(RL, 0.5, 0.47)[0]} ay={onLimb(RL, 0.5, 0.47)[1]} show={named} small />
      <Label id="nerbio-ziatikoa" x={810} y={550} align="start" ax={onLimb(RL, 1.4, 0.05)[0]} ay={onLimb(RL, 1.4, 0.05)[1]} show={named} small />
    </g>
  );
}
