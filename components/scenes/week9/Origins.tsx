'use client';

import { Arrow, Label, Note, Part, seg, smoothPath, type Pt, type SceneProps } from '@/components/kit';
import { Cells } from '@/components/scenes/section/Section';
import { Defs9, Spindle, Steps, W, arc, f1, offset, resample, spline, vis } from './common';

/**
 * 9:muskulu-motak `jatorria` — 4. asteko enbrioiaren zeharkako mozketa bihotzaren mailan (dortsala goian).
 * Irudi bakar batean ikusten dira hiru muskulu moten jatorriak: somitak (mesodermo paraxiala) →
 * muskulu ildaskatuak; aurreko hestearen inguruko errai orria → muskulu leuna; bihotz hodiaren
 * (endokardioaren) inguruko errai orria → miokardioa. Ehun bakoitzak bere jatorriaren lekuan hartzen
 * du bere kolorea (ildaskatua crimson, leuna eztia, miokardioa magenta), eta kolore horiek gai osoan
 * mantentzen dira.
 */

const BODY: Pt[] = spline(
  [
    [500, 46], [604, 56], [694, 100], [748, 172], [772, 262], [782, 362], [762, 462], [702, 540], [602, 590], [500, 602],
    [398, 590], [298, 540], [238, 462], [218, 362], [228, 262], [252, 172], [306, 100], [396, 56],
  ],
  8,
  true,
);
const ECTO_IN = offset(BODY, 11, true);

/** The pericardial part of the coelom: outer contour (lined by the parietal layer). */
const CAV: Pt[] = spline(
  [
    [336, 300], [298, 352], [282, 430], [298, 504], [350, 552], [420, 578], [500, 586], [580, 578], [650, 552], [702, 504], [718, 430], [702, 352], [664, 300],
    [600, 318], [540, 338], [500, 344], [460, 338], [400, 318],
  ],
  8,
  true,
);
/** Parietal layer: a band outside the cavity contour along the body wall (not along its gut roof). */
const WALL = spline([[400, 318], [336, 300], [298, 352], [282, 430], [298, 504], [350, 552], [420, 578], [500, 586], [580, 578], [650, 552], [702, 504], [718, 430], [702, 352], [664, 300], [600, 318]], 8);
const WALL_OUT = offset(WALL, 15);
/** Visceral layer along the cavity roof (under the gut), continuous with the mesocardium. */
const ROOF_L = spline([[400, 318], [440, 333], [478, 342], [490, 350]], 8);
const ROOF_R = spline([[510, 350], [522, 342], [560, 333], [600, 318]], 8);

const NT: Pt = [500, 120];
const NOTO: Pt = [500, 198];
const GUT: Pt = [500, 300];
const HEART: Pt = [500, 455];
const AO_L: Pt = [452, 236];
const AO_R: Pt = [548, 236];
const SOM_L: Pt = [390, 146];
const SOM_R: Pt = [610, 146];

/** An epithelial somite (ring of columnar cells around a core) at c; mirrored on the left. */
function somiteRing(c: Pt, sd: 1 | -1) {
  const outer = arc(c[0], c[1], 64, 44, 0, 360, 40).map(([x, y]) => [c[0] + (x - c[0]) * sd, y] as Pt);
  const inner = arc(c[0], c[1], 44, 26, 0, 360, 40).map(([x, y]) => [c[0] + (x - c[0]) * sd, y] as Pt);
  return { outer, inner };
}

/** The section with its names, without the caption (other stages of this topic reuse it). */
export function OriginsArt({ t }: { t: number }) {
  const striated = seg(t, 0.14, 0.26);
  const smooth = seg(t, 0.32, 0.44);
  const cardiac = seg(t, 0.5, 0.6);
  const glowMeso = vis(t, 0.04, 0.14);

  const somites = ([[SOM_L, -1], [SOM_R, 1]] as const).map(([c, sd]) => ({ c, sd, ...somiteRing(c, sd) }));
  // The dorsal (dermomyotome) half of each somite turns into muscle: a crimson cap with fibres.
  const capOf = (c: Pt, sd: 1 | -1) => {
    const top = arc(c[0], c[1], 64, 44, 200, 340, 18).map(([x, y]) => [c[0] + (x - c[0]) * sd, y] as Pt);
    const bot = arc(c[0], c[1] + 6, 46, 22, 200, 340, 18).map(([x, y]) => [c[0] + (x - c[0]) * sd, y] as Pt);
    return { top, bot };
  };

  const gutOuter = arc(GUT[0], GUT[1], 40, 30, 0, 360, 36);
  const gutInner = arc(GUT[0], GUT[1], 30, 21, 0, 360, 36);
  const splOuter = arc(GUT[0], GUT[1], 60, 46, 0, 360, 40);
  const heartOuter = arc(HEART[0], HEART[1], 76, 60, 0, 360, 44);
  const heartInner = arc(HEART[0], HEART[1], 60, 46, 0, 360, 44);
  const endoOuter = arc(HEART[0], HEART[1], 36, 26, 0, 360, 36);
  const endoInner = arc(HEART[0], HEART[1], 28, 19, 0, 360, 36);
  const meso = `M490,346 C492,370 490,382 486,${HEART[1] - 58} L514,${HEART[1] - 58} C510,382 508,370 510,346Z`;

  return (
    <g>
      <Defs9 />
      {/* Body: mesenchyme under the surface ectoderm. */}
      <path d={smoothPath(BODY, true, 0.3)} fill="#4a2a35" />
      <path d={smoothPath(BODY, true, 0.3)} fill="url(#w9-mes)" />

      {/* Lateral mesoderm: parietal layer along the body wall, visceral layer under the gut. */}
      <Part id="paretako-orria">
        <Cells outer={WALL_OUT} inner={WALL} n={52} fill={W.parietal} nucleus="rgba(120,20,30,0.7)" edge="rgba(120,20,30,0.35)" seed={11} />
      </Part>
      <Part id="perikardio-barrunbea">
        <path d={smoothPath(CAV, true, 0.3)} fill={W.space} />
        <path d={smoothPath(CAV, true, 0.3)} fill={W.cavity} />
      </Part>

      {/* Neural tube and notochord. */}
      <Part id="hodi-neurala">
        <ellipse cx={NT[0]} cy={NT[1]} rx={34} ry={54} fill={W.neural} stroke="#0e1d5c" strokeWidth={1.4} />
        <ellipse cx={NT[0]} cy={NT[1]} rx={34} ry={54} fill="url(#w9-ball)" />
        <path d={`M${NT[0]},${NT[1] - 34} Q${NT[0] + 5},${NT[1]} ${NT[0]},${NT[1] + 34} Q${NT[0] - 5},${NT[1]} ${NT[0]},${NT[1] - 34}Z`} fill={W.neuralLumen} />
      </Part>
      <Part id="notokorda">
        <circle cx={NOTO[0]} cy={NOTO[1]} r={14} fill={W.noto} stroke="#4c1d95" strokeWidth={1.2} />
        <circle cx={NOTO[0]} cy={NOTO[1]} r={14} fill="url(#w9-ball)" />
      </Part>

      {/* Somites (paraxial mesoderm): epithelial ring; their dorsal half becomes striated muscle. */}
      {somites.map(({ c, sd, outer, inner }) => {
        const cap = capOf(c, sd);
        return (
          <g key={sd}>
            <Part id="somitak" groups={['mesodermo-paraxiala']}>
              <ellipse cx={c[0]} cy={c[1]} rx={64} ry={44} fill={W.paraxial} opacity={0.35} />
              <Cells outer={outer} inner={inner} n={30} fill={W.paraxial} pseudo seed={21 + sd} nucleus="rgba(80,6,18,0.7)" />
              {glowMeso > 0.01 && <ellipse cx={c[0]} cy={c[1]} rx={70} ry={50} fill="none" stroke="#ffd5d5" strokeOpacity={0.5 * glowMeso} strokeWidth={3} />}
            </Part>
            <Part id="muskulu-ildaskatuak" show={striated}>
              <path d={`M${cap.top.map((p) => `${f1(p[0])},${f1(p[1])}`).join('L')}L${cap.bot.slice().reverse().map((p) => `${f1(p[0])},${f1(p[1])}`).join('L')}Z`} fill={W.striated} stroke="#5a0a18" strokeWidth={1} />
              {[0.22, 0.4, 0.58, 0.76].map((u) => {
                const a = resample(cap.top, 41)[Math.round(u * 40)];
                const b = resample(cap.bot, 41)[Math.round(u * 40)];
                return <path key={u} d={`M${f1(a[0])},${f1(a[1] + 2)} L${f1(b[0])},${f1(b[1] - 2)}`} stroke="#ffc2cc" strokeWidth={1} opacity={0.6} />;
              })}
            </Part>
          </g>
        );
      })}

      {/* Paired dorsal aortae. */}
      <Part id="aorta-dortsalak">
        {[AO_L, AO_R].map((c, i) => (
          <g key={i}>
            <circle cx={c[0]} cy={c[1]} r={21} fill={W.aorta} stroke={W.aortaDeep} strokeWidth={1.4} />
            <circle cx={c[0]} cy={c[1]} r={15} fill={W.blood} />
            <circle cx={c[0]} cy={c[1]} r={21} fill="url(#w9-ball)" />
          </g>
        ))}
      </Part>

      {/* Foregut: endoderm tube, wrapped by the visceral layer (→ smooth muscle). */}
      <Part id="errai-orria">
        <path d={smoothPath(splOuter, true, 0.3)} fill={W.visceral} stroke="rgba(90,10,24,0.5)" strokeWidth={1} />
        <Cells outer={splOuter} inner={gutOuter} n={30} fill={W.visceral} nucleus="rgba(90,10,24,0.75)" edge="rgba(90,10,24,0.35)" seed={41} />
        <Cells outer={offset(ROOF_L, -12)} inner={ROOF_L} n={8} fill={W.visceral} nucleus="rgba(90,10,24,0.75)" edge="rgba(90,10,24,0.35)" seed={43} />
        <Cells outer={offset(ROOF_R, -12)} inner={ROOF_R} n={8} fill={W.visceral} nucleus="rgba(90,10,24,0.75)" edge="rgba(90,10,24,0.35)" seed={45} />
        <path d={meso} fill={W.visceral} stroke="rgba(90,10,24,0.45)" strokeWidth={1} />
        {/* Around the heart the visceral layer is the future myocardium (cardiac jelly between it and the endocardium). */}
        <Cells outer={heartOuter} inner={heartInner} n={34} fill={W.visceral} nucleus="rgba(90,10,24,0.75)" edge="rgba(90,10,24,0.35)" seed={47} />
      </Part>
      <Part id="muskulu-leuna" show={smooth}>
        <path d={`${smoothPath(splOuter, true, 0.3)} ${smoothPath(gutOuter.slice().reverse(), true, 0.3)}`} fill={W.smooth} fillRule="evenodd" stroke="#7a4a06" strokeWidth={1} />
        {Array.from({ length: 16 }, (_, i) => {
          const a = (i / 16) * Math.PI * 2;
          return <Spindle key={i} x={GUT[0] + Math.cos(a) * 50} y={GUT[1] + Math.sin(a) * 38} len={20} h={6} rot={(a * 180) / Math.PI + 90} />;
        })}
      </Part>
      <Part id="aurreko-hestea">
        <Cells outer={gutOuter} inner={gutInner} n={22} fill={W.endo} nucleus="rgba(90,60,10,0.7)" edge="rgba(90,60,10,0.4)" seed={51} />
        <path d={smoothPath(gutInner, true, 0.3)} fill="#2c2010" />
      </Part>

      {/* Heart tube: endocardium inside, cardiac jelly, visceral layer → myocardium. */}
      <path d={smoothPath(heartInner, true, 0.3)} fill="#5a2a3a" />
      <path d={smoothPath(heartInner, true, 0.3)} fill="url(#w9-mes)" opacity={0.5} />
      <Part id="miokardioa" show={cardiac}>
        <path d={`${smoothPath(heartOuter, true, 0.3)} ${smoothPath(heartInner.slice().reverse(), true, 0.3)}`} fill={W.cardiac} fillRule="evenodd" stroke="#5a0a30" strokeWidth={1.2} />
        {Array.from({ length: 22 }, (_, i) => {
          const a = (i / 22) * Math.PI * 2;
          const p0: Pt = [HEART[0] + Math.cos(a) * 61, HEART[1] + Math.sin(a) * 47];
          const p1: Pt = [HEART[0] + Math.cos(a) * 75, HEART[1] + Math.sin(a) * 59];
          return <path key={i} d={`M${f1(p0[0])},${f1(p0[1])} L${f1(p1[0])},${f1(p1[1])}`} stroke="#fde68a" strokeWidth={1.4} opacity={0.75} />;
        })}
      </Part>
      <Part id="endokardioa">
        <Cells outer={endoOuter} inner={endoInner} n={18} fill="#f9a8d4" nucleus="rgba(120,20,70,0.7)" edge="rgba(120,20,70,0.4)" seed={61} />
        <path d={smoothPath(endoInner, true, 0.3)} fill={W.blood} />
      </Part>

      {/* Surface ectoderm. */}
      <Part id="azaleko-ektodermoa">
        <Cells outer={BODY} inner={ECTO_IN} n={120} fill={W.ecto} nk={0.5} seed={71} />
      </Part>
      <path d={smoothPath(BODY, true, 0.3)} fill="url(#w9-light)" pointerEvents="none" />

      {/* Where the striated muscle goes next: from the somites into the back and the body wall. */}
      <Arrow from={[338, 186]} to={[262, 300]} color={W.striated} width={3} bend={0.18} show={vis(t, 0.16, 0.3)} progress={seg(t, 0.16, 0.24)} />
      <Arrow from={[662, 186]} to={[738, 300]} color={W.striated} width={3} bend={-0.18} show={vis(t, 0.16, 0.3)} progress={seg(t, 0.16, 0.24)} />

      <Label id="hodi-neurala" x={200} y={84} ax={474} ay={96} />
      <Label id="somitak" x={200} y={146} ax={334} ay={150} />
      <Label id="muskulu-ildaskatuak" x={200} y={196} ax={360} ay={118} show={striated} />
      <Label id="aorta-dortsalak" x={200} y={250} ax={434} ay={244} small />
      <Label id="paretako-orria" x={200} y={392} ax={292} ay={410} />
      <Label id="perikardio-barrunbea" x={200} y={470} ax={344} ay={500} small />
      <Label id="azaleko-ektodermoa" x={200} y={560} ax={318} ay={556} small />
      <Label id="notokorda" x={800} y={196} ax={514} ay={198} small />
      <Label id="aurreko-hestea" x={800} y={258} ax={528} ay={292} />
      <Label id="muskulu-leuna" x={800} y={362} ax={552} ay={326} show={smooth} />
      <Label id="errai-orria" x={800} y={404} ax={510} ay={372} />
      <Label id="endokardioa" x={800} y={452} ax={534} ay={452} small />
      <Label id="miokardioa" x={800} y={512} ax={566} ay={492} show={cardiac} />
    </g>
  );
}

/** 9:muskulu-motak `jatorria`. */
export function OriginsSection({ t }: SceneProps) {
  return (
    <g>
      <OriginsArt t={t} />
      <Note x={500} y={22} size={12.5} tone="dim">
        4. astea · bihotzaren mailako zeharkako mozketa
      </Note>
      <Steps
        t={t}
        steps={[
          [0, 'Gihar guztiak mesodermotik: paraxiala (somitak) eta alboko mesodermoaren bi orriak'],
          [0.14, 'Somitak (mesodermo paraxiala) → muskulu ildaskatuak (borondatezkoak, mugimendua)'],
          [0.32, 'Hestearen inguruko errai orria → muskulu leuna (erraiak, arteriak, zainak)'],
          [0.5, 'Bihotz hodiaren inguruko errai orria → miokardioa (ildaskatua, baina berezia)'],
          [0.64, 'Hiru muskulu motak, hiru jatorri: kolore bakoitza gai osoan bera da'],
        ]}
      />

    </g>
  );
}
