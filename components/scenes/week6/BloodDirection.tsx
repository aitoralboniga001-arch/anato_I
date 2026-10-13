'use client';

import { Arrow, Label, Note, Part, smoothPath, type Pt, type SceneProps } from '@/components/kit';
import { Chevron, K, W3bDefs, chevrons } from '@/components/scenes/week3-villi/art';
import { spline } from '@/components/scenes/week7/common';

/**
 * 6:biloxka-askeak, last step — "Arteria ala zaina?". The trap of the placental circuit, drawn as the
 * circuit itself: the mother's heart, the placenta (her blood in the intervillous space, the barrier, the
 * fetus's capillary in the villus) and the fetus's heart. Oxygen goes left to right along the top: red
 * leaves the mother's heart in an ARTERY, crosses the barrier as O₂ only (the two bloods never touch), and
 * reaches the fetus's heart in a VEIN. Same colour on both sides, opposite names: a vessel is named by where
 * it goes (out of the heart / back to it), never by its oxygen. Colours as in the sac and topic 3.
 */

const RED = '#d3283f';
const BLUE = '#3554b8';
const TOP = 190;
const LOW = 450;
const HEART_M: Pt = [100, 320];
const HEART_F: Pt = [900, 320];
/** The placenta: the mother's blood (left), the barrier, the villus with the fetus's capillary (right). */
const PL = { x0: 392, x1: 608, y0: 140, y1: 500, bar: 500 };

const LANES = {
  /** Out of the mother's heart into the intervillous space. */
  mArt: spline([[134, 292], [168, 222], [226, TOP], [300, TOP], [PL.x0 + 2, TOP]], 10),
  /** Out of the intervillous space back to her heart. */
  mVen: spline([[PL.x0 + 2, LOW], [300, LOW], [226, LOW], [168, 418], [134, 348]], 10),
  /** Out of the villus back to the fetus's heart. */
  fVen: spline([[PL.x1 - 2, TOP], [700, TOP], [774, TOP], [832, 222], [866, 292]], 10),
  /** Out of the fetus's heart to the villus. */
  fArt: spline([[866, 348], [832, 418], [774, LOW], [700, LOW], [PL.x1 - 2, LOW]], 10),
};
/** The fetus's capillary in the villus: in at the bottom (poor), up along the barrier, out at the top (rich). */
const CAP: Pt[] = spline([[PL.x1 - 2, LOW], [560, LOW], [530, 420], [528, 300], [530, 220], [560, TOP], [PL.x1 - 2, TOP]], 10);

const HEART = 'M0,30 C-40,6 -36,-30 -15,-31 C-5,-31 0,-22 0,-15 C0,-22 5,-31 15,-31 C36,-30 40,6 0,30Z';

function Vessel({ pts, color }: { pts: Pt[]; color: string }) {
  const d = smoothPath(pts, false, 0.4);
  return (
    <g fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path d={d} stroke="#2a0c14" strokeWidth={17} />
      <path d={d} stroke={K.endo} strokeWidth={14} />
      <path d={d} stroke={color} strokeWidth={9.5} />
    </g>
  );
}

function Heart({ at, label }: { at: Pt; label: string }) {
  return (
    <g pointerEvents="none">
      <g transform={`translate(${at[0]} ${at[1]}) scale(1.45)`}>
        <path d={HEART} fill="#8e1f33" stroke="#3a0a14" strokeWidth={2} />
        <path d="M-22,-18 C-26,-6 -20,6 -8,14" fill="none" stroke="#d65a6e" strokeWidth={3} strokeLinecap="round" opacity={0.7} />
      </g>
      <text x={at[0]} y={at[1] - 74} textAnchor="middle" fontSize={17} fontWeight={800} letterSpacing="0.14em" fill="#f1eee8">
        {label}
      </text>
    </g>
  );
}

/** The name a vessel gets from its direction, big, over its lane (no structure: the rule, not a part). */
function Tag({ x, y, name, rule, hot }: { x: number; y: number; name: string; rule: string; hot?: boolean }) {
  const w = name.length * 13.5 + 36;
  return (
    <g pointerEvents="none">
      <rect x={x - w / 2} y={y - 17} width={w} height={34} rx={17} fill={hot ? 'rgba(46,26,8,0.95)' : 'rgba(14,16,22,0.92)'} stroke={hot ? '#ffb86b' : 'rgba(232,238,252,0.35)'} strokeWidth={hot ? 2 : 1.2} />
      <text x={x} y={y} dy="0.36em" textAnchor="middle" fontSize={19} fontWeight={800} letterSpacing="0.12em" fill={hot ? '#ffb86b' : '#ffffff'}>
        {name}
      </text>
      <text x={x} y={y + 32} dy="0.35em" textAnchor="middle" fontSize={15} fontStyle="italic" fill="#e2ddd4">
        {rule}
      </text>
    </g>
  );
}

const CIRCUIT = ['enbrioi-kanpoko-zirkulazioa'];
const UMB = ['zilbor-hodiak', ...CIRCUIT];

export function BloodDirection({ t, reduced }: SceneProps) {
  // Chevrons creep along every lane once shown (none in reduced motion: the arrows in the tags say it).
  const phase = reduced ? 14 : t * 2600;
  const flow = (pts: Pt[], color: string) =>
    chevrons(pts, 46, phase, false).map((c, k) => <Chevron key={k} {...c} color={color} size={1.1} />);
  return (
    <g>
      <W3bDefs />
      <defs>
        <linearGradient id="w6bd-lake" x1="0" y1={PL.y0} x2="0" y2={PL.y1} gradientUnits="userSpaceOnUse">
          <stop offset="0.12" stopColor={RED} />
          <stop offset="0.88" stopColor={BLUE} />
        </linearGradient>
        <linearGradient id="w6bd-cap" x1="0" y1={LOW} x2="0" y2={TOP} gradientUnits="userSpaceOnUse">
          <stop offset="0.12" stopColor={BLUE} />
          <stop offset="0.88" stopColor={RED} />
        </linearGradient>
      </defs>
      <rect x={0} y={0} width={1000} height={640} fill="#0d0b10" />

      <Heart at={HEART_M} label="AMA" />
      <Heart at={HEART_F} label="FETUA" />

      {/* The placenta: her blood pools round the villus; the fetus's blood stays in its capillary. */}
      <Part id="biloxka-arteko-espazioa" groups={CIRCUIT}>
        <path d={`M${PL.bar - 6},${PL.y0} H${PL.x0 + 18} Q${PL.x0},${PL.y0} ${PL.x0},${PL.y0 + 18} V${PL.y1 - 18} Q${PL.x0},${PL.y1} ${PL.x0 + 18},${PL.y1} H${PL.bar - 6}Z`} fill="url(#w6bd-lake)" />
        <path d={`M${PL.bar - 6},${PL.y0} H${PL.x0 + 18} Q${PL.x0},${PL.y0} ${PL.x0},${PL.y0 + 18} V${PL.y1 - 18} Q${PL.x0},${PL.y1} ${PL.x0 + 18},${PL.y1} H${PL.bar - 6}Z`} fill="url(#w3b-blood)" opacity={0.35} />
      </Part>
      <Part id="biloxka-tertziarioa">
        <path d={`M${PL.bar + 6},${PL.y0} H${PL.x1 - 18} Q${PL.x1},${PL.y0} ${PL.x1},${PL.y0 + 18} V${PL.y1 - 18} Q${PL.x1},${PL.y1} ${PL.x1 - 18},${PL.y1} H${PL.bar + 6}Z`} fill={K.meso} />
      </Part>
      <Part id="karena-muga">
        <rect x={PL.bar - 7} y={PL.y0} width={14} height={PL.y1 - PL.y0} fill="url(#w3b-syn)" stroke={K.synEdge} strokeWidth={1.2} />
      </Part>
      <Part id="biloxka-kapilarrak" groups={CIRCUIT}>
        <path d={smoothPath(CAP, false, 0.4)} fill="none" stroke={K.endo} strokeWidth={14} strokeLinejoin="round" />
        <path d={smoothPath(CAP, false, 0.4)} fill="none" stroke="url(#w6bd-cap)" strokeWidth={9.5} strokeLinejoin="round" />
      </Part>

      <Part id="arteria-espiralak" groups={CIRCUIT}>
        <Vessel pts={LANES.mArt} color={RED} />
      </Part>
      <Part id="endometrio-zainak" groups={CIRCUIT}>
        <Vessel pts={LANES.mVen} color={BLUE} />
      </Part>
      <Part id="zilbor-zainak" groups={UMB}>
        <Vessel pts={LANES.fVen} color={RED} />
      </Part>
      <Part id="zilbor-arteriak" groups={UMB}>
        <Vessel pts={LANES.fArt} color={BLUE} />
      </Part>
      <g pointerEvents="none">
        {flow(LANES.mArt, '#ffd2d9')}
        {flow(LANES.mVen, '#cfe0ff')}
        {flow(LANES.fVen, '#ffd2d9')}
        {flow(LANES.fArt, '#cfe0ff')}
        {flow(CAP, '#f6eef0')}
      </g>

      {/* Only gases and nutrients cross the barrier: the two bloods never touch. */}
      <Arrow from={[452, 282]} to={[552, 282]} bend={0} color="#ffe08a" width={3} head={10} />
      <Arrow from={[552, 362]} to={[452, 362]} bend={0} color="#b9c6dd" width={3} head={10} />
      <text x={470} y={268} textAnchor="middle" fontSize={15} fontWeight={800} fill="#ffe08a" pointerEvents="none">
        O₂
      </text>
      <text x={470} y={386} textAnchor="middle" fontSize={14} fontWeight={700} fill="#c9d4e8" pointerEvents="none">
        CO₂
      </text>

      {/* The names the direction gives: the same red is an artery on her side and a vein on the fetus's. */}
      <Tag x={262} y={112} name="ARTERIA" rule="bihotzetik irten →" />
      <Tag x={262} y={512} name="ZAINA" rule="← bihotzera itzuli" />
      <Tag x={738} y={112} name="ZAINA" rule="bihotzera itzuli →" hot />
      <Tag x={738} y={512} name="ARTERIA" rule="← bihotzetik irten" hot />

      <Note x={500} y={34} tone="dim" size={14}>
        Gorria = O₂ asko · urdina = O₂ gutxi
      </Note>
      <Note x={500} y={590} tone="accent" size={15}>
        Izena norabideak ematen du, ez oxigenoak
      </Note>
      <Note x={500} y={616} tone="warn" size={15}>
        Fetuan, odol oxigenatua zilborreko ZAINETIK doa (helduan ez bezala)
      </Note>

      <Label id="arteria-espiralak" x={262} y={236} align="middle" ax={262} ay={TOP + 6} noArrange />
      <Label id="endometrio-zainak" x={262} y={404} align="middle" ax={262} ay={LOW - 6} noArrange />
      <Label id="zilbor-zainak" x={738} y={236} align="middle" ax={738} ay={TOP + 6} noArrange />
      <Label id="zilbor-arteriak" x={738} y={404} align="middle" ax={738} ay={LOW - 6} noArrange />
      <Label id="biloxka-arteko-espazioa" x={440} y={470} align="middle" small noArrange />
      <Label id="karena-muga" x={500} y={124} align="middle" small noArrange />
      <Label id="biloxka-kapilarrak" x={566} y={322} align="start" small noArrange text="Kapilarra" />
    </g>
  );
}
