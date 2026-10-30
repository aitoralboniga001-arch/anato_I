'use client';

import { Label, Note, Part, rand, seg, smoothPath, type Pt, type SceneProps } from '@/components/kit';
import { Cells } from '@/components/scenes/section/Section';
import { Defs9, Spindle, Steps, W, along, arc, f1, offset, resample, spline, vis } from './common';

/**
 * 9:muskulu-motak `jatorria` — 4. asteko enbrioiaren zeharkako mozketa bihotzaren mailan (dortsala goian).
 * Irudi bakar batean ikusten dira hiru muskulu moten jatorriak: somitak (mesodermo paraxiala) →
 * muskulu ildaskatuak; aurreko hestearen inguruko errai orria → muskulu leuna; bihotz hodiaren
 * (endokardioaren) inguruko errai orria → miokardioa. Ehun bakoitzak bere jatorriaren lekuan hartzen
 * du bere kolorea (ildaskatua crimson, leuna eztia, miokardioa magenta), eta kolore horiek gai osoan
 * mantentzen dira. 1. urratsean hiru iturriak batera argitzen dira (denak mesodermoa); 2.ean mioblastoak
 * somitetatik gorputz paretara abiatzen dira; 3.–4. urratsetan kamera hestera eta bihotz hodira hurbiltzen da,
 * errai orria muskulu leun eta miokardio bihurtzen den lekura.
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

/** Where the close-up on the gut and the heart tube looks (frame units of the whole section), and how much it magnifies. */
const ZF: Pt = [500, 392];
const ZT: Pt = [500, 326];
const ZS = 1.75;
/** The close-up camera: k = 0 the whole section, 1 the gut and heart tube filling the frame. */
export function originsCam(k: number) {
  const s = 1 + (ZS - 1) * k;
  const tx = ZF[0] + (ZT[0] - ZF[0]) * k;
  const ty = ZF[1] + (ZT[1] - ZF[1]) * k;
  return {
    transform: `translate(${f1(tx)} ${f1(ty)}) scale(${s.toFixed(4)}) translate(${-ZF[0]} ${-ZF[1]})`,
    at: (p: Pt): Pt => [tx + (p[0] - ZF[0]) * s, ty + (p[1] - ZF[1]) * s],
  };
}

/** Myoblasts leave each somite's ventrolateral lip down the body wall (between the ectoderm and the parietal layer). */
const STREAM_L: Pt[] = spline([[334, 190], [302, 220], [274, 260], [257, 308], [251, 360], [253, 410], [259, 452]], 8);
const STREAM: Pt[][] = [STREAM_L, STREAM_L.map(([x, y]) => [1000 - x, y] as Pt)];
const N_STREAM = 24;

/** Leader dots, each well inside its structure (the middle of a band, of a ring). */
const ECTO_MID = offset(BODY, 5.5, true);
const ectoDot = ECTO_MID.reduce((b, p) => (Math.hypot(p[0] - 300, p[1] - 540) < Math.hypot(b[0] - 300, b[1] - 540) ? p : b));
const WALL_MID = offset(WALL, 7.5);
const wallDot = WALL_MID.reduce((b, p) => (p[0] < 500 && Math.abs(p[1] - 430) < Math.abs(b[1] - 430) ? p : b));

const ptsD = (pts: readonly Pt[]) => `M${pts.map((q) => `${f1(q[0])},${f1(q[1])}`).join('L')}Z`;

/** The section with its names, without the caption (other stages of this topic reuse it). `zoom` closes in on the gut and the heart tube. */
export function OriginsArt({ t, zoom = 0 }: { t: number; zoom?: number }) {
  const striated = seg(t, 0.14, 0.26);
  const smooth = seg(t, 0.34, 0.46);
  const cardiac = seg(t, 0.5, 0.6);
  // Step 1: the three sources light up together as one germ layer, the mesoderm.
  const meso = vis(t, 0.015, 0.15);
  const cam = originsCam(zoom);

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
  const mesoCardium = `M490,346 C492,370 490,382 486,${HEART[1] - 58} L514,${HEART[1] - 58} C510,382 508,370 510,346Z`;
  const ring = (o: Pt[], i: Pt[]) => `${smoothPath(o, true, 0.3)} ${smoothPath(i.slice().reverse(), true, 0.3)}`;
  /** Step 1's mesoderm light over one source (drawn inside its own Part). */
  const wash = (d: string, key: string, rule: 'evenodd' | 'nonzero' = 'nonzero') =>
    meso > 0.01 ? <path key={key} d={d} fill="#ff5a6a" fillOpacity={0.42 * meso} fillRule={rule} stroke="#ffe0e4" strokeOpacity={0.85 * meso} strokeWidth={2.2} /> : null;

  // Names: in the whole section, then (zoom) in the close-up on the gut and the heart tube. a = the dot, in section units.
  type Name = { id: string; x: number; y: number; a: Pt; zy?: number; zoomOut?: boolean; show?: number; small?: boolean };
  const names: Name[] = [
    { id: 'hodi-neurala', x: 200, y: 84, a: [482, 92], zoomOut: true },
    { id: 'somitak', x: 200, y: 146, a: [336, 150], zoomOut: true },
    { id: 'muskulu-ildaskatuak', x: 200, y: 196, a: [360, 118], zoomOut: true, show: striated },
    { id: 'aorta-dortsalak', x: 200, y: 250, a: [446, 240], zy: 60, small: true },
    { id: 'paretako-orria', x: 200, y: 392, a: wallDot, zoomOut: true },
    { id: 'perikardio-barrunbea', x: 200, y: 470, a: [350, 470], zy: 462, small: true },
    { id: 'azaleko-ektodermoa', x: 200, y: 560, a: ectoDot, zoomOut: true, small: true },
    // The somites are the paraxial mesoderm of this level: named on the other one, below its muscle cap.
    { id: 'mesodermo-paraxiala', x: 200, y: 320, a: [SOM_L[0] + 8, SOM_L[1] + 20], zoomOut: true, small: true },
    { id: 'notokorda', x: 800, y: 196, a: [503, 198], zoomOut: true, small: true },
    { id: 'aurreko-hestea', x: 800, y: 258, a: [517, 278], zy: 120 },
    { id: 'muskulu-leuna', x: 800, y: 330, a: [538, 324], zy: 200, show: smooth },
    { id: 'errai-orria', x: 800, y: 392, a: [500, 376], zy: 296 },
    { id: 'endokardioa', x: 800, y: 452, a: [532, 455], zy: 436, small: true },
    { id: 'miokardioa', x: 800, y: 512, a: [552, 489], zy: 500, show: cardiac },
  ];

  return (
    <g>
      <Defs9 />
      <g transform={cam.transform}>
        {/* Body: mesenchyme under the surface ectoderm. */}
        <path d={smoothPath(BODY, true, 0.3)} fill="#4a2a35" />
        <path d={smoothPath(BODY, true, 0.3)} fill="url(#w9-mes)" />

        {/* Lateral mesoderm: parietal layer along the body wall, visceral layer under the gut. */}
        <Part id="perikardio-barrunbea">
          <path d={smoothPath(CAV, true, 0.3)} fill={W.space} />
          <path d={smoothPath(CAV, true, 0.3)} fill={W.cavity} />
        </Part>
        <Part id="paretako-orria">
          <Cells outer={WALL_OUT} inner={WALL} n={52} fill={W.parietal} nucleus="rgba(120,20,30,0.7)" edge="rgba(120,20,30,0.35)" seed={11} />
          {wash(ptsD([...WALL_OUT, ...WALL.slice().reverse()]), 'w')}
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
                {wash(`M${c[0] - 64},${c[1]}a64,44 0 1,0 128,0a64,44 0 1,0 -128,0Z`, 's')}
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
        {/* Myoblasts stream out of each somite into the body wall: the back and body-wall muscles to come. */}
        {striated > 0.01 && (
          <Part id="muskulu-ildaskatuak">
            {STREAM.map((path, sd) =>
              Array.from({ length: N_STREAM }, (_, i) => {
                // A loose stream, not a bead chain: cells at uneven spacing, in two staggered lanes.
                const u = Math.min(0.98, (i + 0.3 + rand(i * 5.1 + sd * 9) * 0.7) / N_STREAM);
                const a = 0.14 + 0.06 * (1 - u);
                const k = seg(t, a, a + 0.06);
                if (k <= 0.01) return null;
                const p = along(path, u * k);
                const q = along(path, Math.min(1, u * k + 0.02));
                const ang = Math.atan2(q[1] - p[1], q[0] - p[0]);
                const lane = (i % 2 ? 1 : -1) * (3.5 + rand(i * 3.7 + sd) * 4);
                const rot = (ang * 180) / Math.PI + (rand(i * 2.3 + sd) - 0.5) * 40;
                return (
                  <g key={`${sd}-${i}`} transform={`translate(${f1(p[0] - Math.sin(ang) * lane)} ${f1(p[1] + Math.cos(ang) * lane)}) rotate(${f1(rot)})`}>
                    <ellipse rx={6.6} ry={4.2} fill={W.striated} stroke="#5a0a18" strokeWidth={1} />
                    <ellipse rx={2.2} ry={1.7} fill="#4a0a18" />
                  </g>
                );
              }),
            )}
          </Part>
        )}

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
          <path d={mesoCardium} fill={W.visceral} stroke="rgba(90,10,24,0.45)" strokeWidth={1} />
          {/* Around the heart the visceral layer is the future myocardium (cardiac jelly between it and the endocardium). */}
          <Cells outer={heartOuter} inner={heartInner} n={34} fill={W.visceral} nucleus="rgba(90,10,24,0.75)" edge="rgba(90,10,24,0.35)" seed={47} />
          {wash(ring(splOuter, gutOuter), 'v1', 'evenodd')}
          {wash(mesoCardium, 'v2')}
          {wash(ring(heartOuter, heartInner), 'v3', 'evenodd')}
          {[ROOF_L, ROOF_R].map((r, i) => wash(ptsD([...offset(r, -12), ...r.slice().reverse()]), `r${i}`))}
        </Part>
        {/* The visceral coat round the gut turns into smooth muscle: spindle cells appear one by one, round the tube. */}
        <Part id="muskulu-leuna" show={smooth}>
          <path d={ring(splOuter, gutOuter)} fill={W.smooth} fillRule="evenodd" stroke="#7a4a06" strokeWidth={1} />
          {Array.from({ length: 16 }, (_, i) => {
            const a = (i / 16) * Math.PI * 2;
            const k = seg(t, 0.36 + (i / 16) * 0.07, 0.39 + (i / 16) * 0.07);
            return k > 0.01 ? (
              <g key={i} opacity={k}>
                <Spindle x={GUT[0] + Math.cos(a) * 50} y={GUT[1] + Math.sin(a) * 38} len={20} h={6} rot={(a * 180) / Math.PI + 90} />
              </g>
            ) : null;
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
          <path d={ring(heartOuter, heartInner)} fill={W.cardiac} fillRule="evenodd" stroke="#5a0a30" strokeWidth={1.2} />
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
      </g>

      {names.map((n) => {
        const [ax, ay] = cam.at(n.a);
        const show = (n.show ?? 1) * (n.zoomOut ? 1 - seg(zoom, 0, 0.5) : 1);
        return <Label key={n.id} id={n.id} x={n.x} y={n.y + ((n.zy ?? n.y) - n.y) * zoom} ax={ax} ay={ay} show={show} small={n.small} />;
      })}
    </g>
  );
}

/** 9:muskulu-motak `jatorria`. */
export function OriginsSection({ t: stageT }: SceneProps) {
  // The stage teaches two steps here (the sources, then somites → striated muscle, until the tissues view
  // at 0.64): the striated step is stretched over that span. The smooth-muscle and myocardium phases of the
  // art (printed in grey in the notes' introduction) are never reached; their own stages teach them.
  const t = stageT <= 0.12 ? stageT : Math.min(0.29, 0.12 + (stageT - 0.12) * 0.34);
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
        ]}
      />
    </g>
  );
}
