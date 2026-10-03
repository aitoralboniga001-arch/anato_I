'use client';

import { C, lerp, seg, smoothPath, type Pt } from '@/components/kit';

/**
 * Shared bits for week 1: a mini-map of the tract (where the conceptus is on each day) and the
 * timecode read-out. The route follows the notes (figure "ibilbidea"): ovulation → ampulla
 * (fertilization, 12–24 h) → 2 cells (30 h) → morula in the isthmus (3rd day) → uterine cavity
 * (4th day) → blastocyst (4.5–5) → implantation in the endometrium (5.5–6).
 */

// Mini-map in its own 260×118 box.
const TUBE: Pt[] = [
  [34, 92],
  [26, 60],
  [52, 30],
  [110, 20],
  [168, 26],
  [206, 40],
];
const tubeD = smoothPath(TUBE, false, 0.5);

/** Position along the route for a given day (0 = ovulation/fertilization). */
function routeAt(day: number): Pt {
  const onTube = (u: number): Pt => {
    // Piecewise-linear along the control points is close enough at this size.
    const k = Math.min(TUBE.length - 1.001, u * (TUBE.length - 1));
    const i = Math.floor(k);
    const f = k - i;
    return [lerp(TUBE[i][0], TUBE[i + 1][0], f), lerp(TUBE[i][1], TUBE[i + 1][1], f)];
  };
  if (day < 0.1) return onTube(lerp(0, 0.34, seg(day, -0.5, 0.1)));
  if (day < 3) return onTube(lerp(0.34, 0.86, seg(day, 0.1, 3)));
  if (day < 4) return onTube(lerp(0.86, 1, seg(day, 3, 4)));
  if (day < 5.5) return [lerp(206, 226, seg(day, 4, 5.5)), lerp(40, 62, seg(day, 4, 5.5))];
  return [232, 70];
}

export function placeOf(day: number) {
  if (day < 1) return 'Tronparen anpulua';
  if (day < 2.8) return 'Umetoki-tronpa';
  if (day < 4) return 'Tronparen istmoa';
  if (day < 5.5) return 'Umetokiaren barrunbea';
  return 'Endometrioa';
}

export function MiniTract({ day, x = 32, y = 28, show = 1 }: { day: number; x?: number; y?: number; show?: number }) {
  const p = routeAt(day);
  return (
    <g transform={`translate(${x} ${y})`} opacity={show} pointerEvents="none">
      {/* uterus corner */}
      <path d="M198,26 C230,20 258,34 262,60 L262,118 L214,118 C212,90 206,64 198,52 Z" fill={C.myometrium} opacity={0.55} />
      <path d="M206,46 C220,52 230,64 232,84 L232,118 L222,118 C220,92 214,70 206,58 Z" fill={C.stroma} opacity={0.7} />
      {/* ovary */}
      <ellipse cx={62} cy={82} rx={24} ry={15} fill={C.ovary} opacity={0.7} />
      {/* tube */}
      <path d={tubeD} fill="none" stroke={C.tube} strokeWidth={9} strokeLinecap="round" opacity={0.75} />
      <path d={tubeD} fill="none" stroke="#1a1426" strokeWidth={3} strokeLinecap="round" opacity={0.8} />
      <path d="M34,92 l-8,10 M34,92 l0,13 M34,92 l8,10" stroke={C.tube} strokeWidth={2.4} strokeLinecap="round" opacity={0.75} />
      {/* conceptus */}
      <circle cx={p[0]} cy={p[1]} r={9} fill="#ffb86b" opacity={0.25} />
      <circle cx={p[0]} cy={p[1]} r={4.2} fill="#ffb86b" stroke="#0c1220" strokeWidth={1.2} />
      <text x={0} y={-8} fill="#7c7870" fontSize={10.5} letterSpacing="0.12em" style={{ textTransform: 'uppercase' }}>
        Non?
      </text>
      <text x={48} y={-8} fill="#f1eee8" fontSize={12} fontWeight={600}>
        {placeOf(day)}
      </text>
    </g>
  );
}

/** Bottom-left read-out: a main value with unit and caption, plus an optional second column. */
export function Hud({ value, unit, caption, second }: { value: string | number; unit: string; caption: string; second?: [string, string | number, string] }) {
  return (
    <g pointerEvents="none">
      <text x={40} y={556} fill="#7c7870" fontSize={11} letterSpacing="0.12em" style={{ textTransform: 'uppercase' }}>
        {caption}
      </text>
      <text x={40} y={590} fill="#f1eee8" fontSize={30} fontWeight={600} style={{ fontVariantNumeric: 'tabular-nums' }}>
        {value}
        <tspan fill="#b4afa6" fontSize={16} fontWeight={500} dx={2}>
          {unit}
        </tspan>
      </text>
      {second && (
        <g transform="translate(250 0)">
          <text x={0} y={556} fill="#7c7870" fontSize={11} letterSpacing="0.12em" style={{ textTransform: 'uppercase' }}>
            {second[0]}
          </text>
          <text x={0} y={590} fill="#f1eee8" fontSize={24} fontWeight={600} style={{ fontVariantNumeric: 'tabular-nums' }}>
            {second[1]}
            <tspan fill="#b4afa6" fontSize={14} fontWeight={500} dx={2}>
              {second[2]}
            </tspan>
          </text>
        </g>
      )}
    </g>
  );
}

/** Fade in at `a`, out at `b` (stage time). */
export const vis = (t: number, a: number, b = 2) => Math.min(a <= 0 ? 1 : seg(t, a, a + 0.03), 1 - seg(t, b - 0.03, b));
