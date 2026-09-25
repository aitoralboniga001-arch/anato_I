'use client';

import { Label, Note, Part, lerp, seg, smoothPath, type Pt, type SceneProps } from '@/components/kit';
import { SkinDefs } from './skin';

/**
 * Relative head size (topic 5, §2): three fetuses standing, drawn to the SAME vertex–heel
 * height (as in the course figure) so only the proportions change: the head is ½ of the
 * vertex–heel length at the start of the fetal period, ⅓ at month 5 and ¼ at birth.
 */

const Y0 = 70;
const H = 468;
const FIGS = [
  { cx: 245, h: 1 / 2, at: 0.24, frac: '½', name: '3. hilabetea' },
  { cx: 535, h: 1 / 3, at: 0.52, frac: '⅓', name: '5. hilabetea' },
  { cx: 810, h: 1 / 4, at: 0.8, frac: '¼', name: 'Jaioberria' },
];

/** Front view of a standing fetus whose head is `h` of the total height. */
function Standing({ id, cx, h }: { id: string; cx: number; h: number }) {
  const k = (0.5 - h) / 0.25; // 0 → early fetus, 1 → newborn
  const hh = H * h;
  const headRx = hh * lerp(0.35, 0.4, k);
  const yChin = Y0 + hh;
  const rest = H - hh;
  const neck = rest * lerp(0.02, 0.05, k);
  const legs = rest * lerp(0.4, 0.53, k);
  const ySh = yChin + neck;
  const yHip = Y0 + H - legs;
  const sw = H * lerp(0.1, 0.15, k); // half shoulder width
  const hw = H * lerp(0.085, 0.12, k); // half hip width
  const bw = H * lerp(0.105, 0.14, k); // half belly width
  const armW = H * lerp(0.03, 0.042, k);
  const armL = (yHip - ySh) * lerp(1.0, 1.22, k);
  const legW = H * lerp(0.04, 0.055, k);
  const half: Pt[] = [
    [cx - headRx * 0.3, ySh - 3],
    [cx - sw * 0.82, ySh + 1],
    [cx - sw, ySh + (yHip - ySh) * 0.14],
    [cx - bw, lerp(ySh, yHip, 0.6)],
    [cx - hw, yHip + legW * 0.2],
    [cx - hw * 0.45, yHip + legW * 1.1],
  ];
  const trunk = smoothPath([...half, ...half.map(([x, y]): Pt => [2 * cx - x, y]).reverse()], true);
  const limb = (x1: number, y1: number, x2: number, y2: number, w1: number, w2: number) => {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const L = Math.hypot(dx, dy);
    const nx = -dy / L;
    const ny = dx / L;
    return `M${x1 + nx * w1},${y1 + ny * w1} L${x2 + nx * w2},${y2 + ny * w2} A${w2} ${w2} 0 0 0 ${x2 - nx * w2},${y2 - ny * w2} L${x1 - nx * w1},${y1 - ny * w1} A${w1} ${w1} 0 0 0 ${x1 + nx * w1},${y1 + ny * w1}Z`;
  };
  const sides = [-1, 1];
  const eyeY = Y0 + hh * lerp(0.6, 0.56, k);
  return (
    <g>
      <SkinDefs id={id} cx={cx - 30} cy={Y0 + H * 0.35} r={H * 0.75} />
      <g filter={`url(#${id}-sculpt)`} fill={`url(#${id}-skin)`}>
        {/* legs, then arms, then trunk and head so the lighting reads as one body */}
        {sides.map((s) => (
          <path key={`l${s}`} d={limb(cx + s * hw * 0.5, yHip, cx + s * hw * 0.42, Y0 + H - legW * 0.7, legW, legW * 0.62)} />
        ))}
        {sides.map((s) => (
          <ellipse key={`f${s}`} cx={cx + s * (hw * 0.42 + legW * 0.25)} cy={Y0 + H - legW * 0.45} rx={legW * 0.95} ry={legW * 0.45} />
        ))}
        <path d={trunk} />
        {sides.map((s) => (
          <path key={`a${s}`} d={limb(cx + s * (sw - armW * 0.2), ySh + armW * 1.1, cx + s * (sw + armW * 1.9), ySh + armL, armW, armW * 0.85)} />
        ))}
        <rect x={cx - headRx * 0.38} y={yChin - hh * 0.12} width={headRx * 0.76} height={neck + hh * 0.2} rx={headRx * 0.3} />
        {sides.map((s) => (
          <ellipse key={`e${s}`} cx={cx + s * headRx * 0.96} cy={eyeY + hh * 0.05} rx={hh * 0.045} ry={hh * 0.08} />
        ))}
        <ellipse cx={cx} cy={Y0 + hh * 0.5} rx={headRx} ry={hh * 0.5} />
      </g>
      {/* Face and navel, kept minimal: the figure is about proportion. */}
      <g fill="none" stroke="#5e2622" strokeWidth={1.6} strokeLinecap="round" opacity={0.7}>
        {sides.map((s) => (
          <path key={s} d={`M${cx + s * headRx * 0.2},${eyeY} q${s * headRx * 0.12},${hh * 0.025} ${s * headRx * 0.24},0`} />
        ))}
        <path d={`M${cx - headRx * 0.12},${Y0 + hh * 0.84} q${headRx * 0.12},${hh * 0.03} ${headRx * 0.24},0`} />
      </g>
      <ellipse cx={cx} cy={lerp(ySh, yHip, 0.7)} rx={3} ry={2.2} fill="#9b4d45" opacity={0.7} />
    </g>
  );
}

/** Vertex–heel bar cut into head-sized segments: the head fits 2, 3 or 4 times. */
function Scale({ x, h, on, grow }: { x: number; h: number; on: number; grow: number }) {
  const n = Math.round(1 / h);
  const seg = H * h;
  return (
    <g opacity={0.35 + 0.65 * on}>
      <line x1={x} x2={x} y1={Y0} y2={Y0 + H} stroke="rgba(255,255,255,0.28)" strokeWidth={1.5} />
      {Array.from({ length: n + 1 }, (_, i) => (
        <line key={i} x1={x - 7} x2={x + 7} y1={Y0 + i * seg} y2={Y0 + i * seg} stroke="rgba(255,255,255,0.45)" strokeWidth={1.5} />
      ))}
      {Array.from({ length: n }, (_, i) => {
        const a = Math.max(0, Math.min(1, grow * n - i));
        return a > 0.01 ? <rect key={i} x={x - 4} y={Y0 + i * seg + 3} width={8} height={(seg - 6) * a} rx={3} fill={i === 0 ? '#ffb86b' : 'rgba(255,184,107,0.32)'} /> : null;
      })}
    </g>
  );
}

export function HeadProportions({ t }: SceneProps) {
  const final = seg(t, 0.93, 0.98);
  return (
    <g>
      {/* Head-height guides shared by the three figures. */}
      {FIGS.map((f, i) => {
        const focus = Math.min(seg(t, f.at - 0.03, f.at + 0.02), 1 - seg(t, (FIGS[i + 1]?.at ?? 0.93) - 0.03, FIGS[i + 1]?.at ?? 0.93));
        const on = Math.max(focus, final, t < 0.21 ? 1 : 0);
        const grow = Math.max(seg(t, f.at, f.at + 0.12), final);
        const seen = t >= f.at - 0.03 ? 1 : 0;
        const k = (0.5 - f.h) / 0.25;
        const hh = H * f.h;
        const bx = f.cx - lerp(100, 138, k);
        const hx = f.cx + hh * lerp(0.35, 0.4, k) + 14;
        return (
          <g key={f.name}>
            <g opacity={0.6 + 0.4 * on}>
              <Standing id={`hp${i}`} cx={f.cx} h={f.h} />
            </g>
            <line x1={bx} x2={hx} y1={Y0 + hh} y2={Y0 + hh} stroke="#ffb86b" strokeWidth={1} strokeDasharray="3 5" opacity={0.25 + 0.5 * focus} />
            <Part id="vertex-orpo-luzera">
              <Scale x={bx} h={f.h} on={on} grow={grow} />
            </Part>
            <Part id="buruaren-tamaina">
              <path d={`M${hx - 6},${Y0} h6 v${hh} h-6`} fill="none" stroke="#ffb86b" strokeWidth={2} opacity={0.35 + 0.65 * on} />
            </Part>
            <text x={hx + 14} y={Y0 + hh / 2} dy="0.35em" fill="#ffb86b" fontSize={34} fontWeight={600} opacity={Math.max(seen, final) * (0.45 + 0.55 * on)}>
              {f.frac}
            </text>
            <text x={f.cx} y={Y0 + H + 42} textAnchor="middle" fill="#f1eee8" fontSize={15} fontWeight={600} opacity={0.45 + 0.55 * on}>
              {f.name}
            </text>
            <text x={f.cx} y={Y0 + H + 62} textAnchor="middle" fill="#7c7870" fontSize={11} letterSpacing="0.1em" opacity={0.45 + 0.55 * on} style={{ textTransform: 'uppercase' }}>
              {`burua = vertex–orpo ${f.frac}`}
            </text>
          </g>
        );
      })}

      <Label id="buruaren-tamaina" x={430} y={34} ax={FIGS[0].cx + H * 0.175 + 14} ay={Y0 + 30} />
      <Label id="vertex-orpo-luzera" x={40} y={590} ax={FIGS[0].cx - 100} ay={Y0 + H - 6} align="start" show={seg(t, 0.26, 0.3) * (1 - seg(t, 0.49, 0.52))} />
      <Note x={40} y={34} align="start" tone="accent">
        Altuera berdinera eskalatuta
      </Note>
    </g>
  );
}
