'use client';

import { Arrow, Label, Note, Part, clamp, lerp, seg, smoothPath, type Pt, type SceneProps } from '@/components/kit';
import { AgeHud, SkinDefs } from './skin';

/**
 * Stage `hirugarren-hilabetea`, view `ernia`: the abdomen cut open from the left side.
 * From week 6 the gut loops (from the midgut) have no room in the abdominal cavity and go
 * out into the proximal umbilical cord: a PHYSIOLOGICAL hernia. By week 12 the cavity is
 * larger, the loops return and the bulge disappears.
 *
 * The view runs its own clock, the weeks on its dial (6 → 12): it opens at the 6th week with the loops
 * still inside, plays the way out in the step that names the hernia (.60–.69) and the way back in the
 * step that names the return (.74–.83), so both halves of the process are watched, each with its arrow.
 */

const C: Pt = [610, 290];
const E: Pt = [72, 468]; // cut end of the cord

const EXIT: [number, number] = [0.6, 0.69];
const BACK: [number, number] = [0.74, 0.83];
/** Hernia clock: 6th week until the step, out by the 10th, 11th while they wait, back by the 12th. */
const weekAt = (t: number) => (t < EXIT[1] ? lerp(6, 10, seg(t, EXIT[0], EXIT[1])) : t < BACK[0] ? lerp(10, 11, seg(t, EXIT[1], BACK[0], (k) => k)) : lerp(11, 12, seg(t, BACK[0], BACK[1])));
const smooth = (k: number) => k * k * (3 - 2 * k);

const bez = (a: Pt, b: Pt, c: Pt, d: Pt, u: number): Pt => {
  const v = 1 - u;
  return [v * v * v * a[0] + 3 * v * v * u * b[0] + 3 * v * u * u * c[0] + u * u * u * d[0], v * v * v * a[1] + 3 * v * v * u * b[1] + 3 * v * u * u * c[1] + u * u * u * d[1]];
};

export function UmbilicalHernia({ t }: SceneProps) {
  const week = weekAt(t);
  // The loops go out into the cord in the hernia step and come back in the return step.
  const out = Math.min(seg(t, EXIT[0], EXIT[1]), 1 - seg(t, BACK[0], BACK[1])); // loops in the cord
  const grow = seg(t, 0.72, 0.83); // the abdominal cavity enlarges
  const rx = lerp(168, 222, grow);
  const ry = lerp(150, 188, grow);
  const wall = 30;

  // Cord leaves the ventral (left) body wall.
  const ang = (158 * Math.PI) / 180;
  const R: Pt = [C[0] + Math.cos(ang) * (rx + wall * 0.4), C[1] + Math.sin(ang) * (ry + wall * 0.4)];
  const c1: Pt = [R[0] - 150, R[1] + 26];
  const c2: Pt = [E[0] + 150, E[1] - 12];
  const at = (u: number) => {
    const p = bez(R, c1, c2, E, u);
    const q = bez(R, c1, c2, E, Math.min(1, u + 0.01));
    const r = bez(R, c1, c2, E, Math.max(0, u - 0.01));
    const l = Math.hypot(q[0] - r[0], q[1] - r[1]) || 1;
    return { p, n: [-(q[1] - r[1]) / l, (q[0] - r[0]) / l] as Pt };
  };
  const bulgeU = 0.22;
  const halfW = (u: number) => 25 + 34 * out * Math.exp(-(((u - bulgeU) / 0.15) ** 2)) + 10 * Math.max(0, 0.08 - u) * 12;
  const us = Array.from({ length: 26 }, (_, i) => -0.04 + (i / 25) * 1.04);
  const cordD = smoothPath(
    [...us.map((u) => at(Math.max(0, u))).map(({ p, n }, i) => [p[0] + n[0] * halfW(us[i]), p[1] + n[1] * halfW(us[i])] as Pt), ...us.map((u) => at(Math.max(0, u))).map(({ p, n }, i) => [p[0] - n[0] * halfW(us[i]), p[1] - n[1] * halfW(us[i])] as Pt).reverse()],
    true,
    0.4,
  );
  const bulge = at(bulgeU);
  const cutEnd = at(1);

  // Gut: fixed ends deep in the cavity, loops either coiled inside or herniated into the cord.
  const S0: Pt = [C[0] + rx * 0.62, C[1] - ry * 0.1];
  const S1: Pt = [C[0] + rx * 0.5, C[1] + ry * 0.66];
  // Loops as a trochoid (a tube coiling along an axis), inside the cavity or as a hairpin in the cord.
  const N = 64;
  const coil = (i: number, r: number) => {
    const w = (i / (N - 1)) * Math.PI * 2 * 7;
    return [Math.cos(w) * r, Math.sin(w) * r * 0.8] as Pt;
  };
  const A: Pt = [C[0] - rx * 0.5, C[1] + ry * 0.12];
  const B: Pt = [C[0] + rx * 0.3, C[1] + ry * 0.4];
  const inside: Pt[] = Array.from({ length: N }, (_, i) => {
    const k = i / (N - 1);
    const c = coil(i, 24);
    return [lerp(A[0], B[0], k) + c[0], lerp(A[1], B[1], k) + Math.sin(k * Math.PI * 2) * 22 + c[1]];
  });
  const outside: Pt[] = Array.from({ length: N }, (_, i) => {
    const goOut = i < N / 2;
    const k = goOut ? i / (N / 2 - 1) : (N - 1 - i) / (N / 2 - 1);
    const u = lerp(0.03, 0.34, k);
    const { p, n } = at(u);
    const side = (goOut ? 1 : -1) * halfW(u) * 0.34;
    const c = coil(i, 12);
    return [p[0] + n[0] * side + c[0], p[1] + n[1] * side + c[1]];
  });
  // The hairpin's tip leads the way out and is the last to come back: each point of the loop moves
  // with a delay set by how far along the loop it lies from the tip.
  const loops = inside.map((p, i) => {
    const far = Math.abs(i - (N - 1) / 2) / ((N - 1) / 2);
    const k = smooth(clamp(out * 1.6 - far * 0.6));
    return [lerp(p[0], outside[i][0], k), lerp(p[1], outside[i][1], k)] as Pt;
  });
  const gut = smoothPath([S0, [S0[0] - rx * 0.25, S0[1] + ry * 0.3], ...loops, [S1[0] - rx * 0.2, S1[1] - 4], S1], false, 0.5);
  const inner = (u: number) => out * Math.max(0, halfW(u) - 9) * (1 - seg(u, 0.3, 0.42));
  const cus = Array.from({ length: 18 }, (_, i) => -0.06 + (i / 17) * 0.48);
  const coelomD = smoothPath(
    [...cus.map((u) => { const { p, n } = at(Math.max(0, u)); return [p[0] + n[0] * inner(u), p[1] + n[1] * inner(u)] as Pt; }), ...cus.map((u) => { const { p, n } = at(Math.max(0, u)); return [p[0] - n[0] * inner(u), p[1] - n[1] * inner(u)] as Pt; }).reverse()],
    true,
    0.4,
  );
  const loopC = loops[Math.floor(N * 0.3)];

  return (
    <g>
      <SkinDefs id="hn" cx={C[0] - 140} cy={C[1] - 40} r={560} />
      <defs>
        <radialGradient id="hn-cav" cx="0.45" cy="0.4" r="0.7">
          <stop offset="0" stopColor="#3b1d20" />
          <stop offset="1" stopColor="#220f13" />
        </radialGradient>
        <radialGradient id="hn-liver" cx="0.38" cy="0.3" r="0.8">
          <stop offset="0" stopColor="#b8524b" />
          <stop offset="0.7" stopColor="#7e2d2a" />
          <stop offset="1" stopColor="#5c201f" />
        </radialGradient>
        <radialGradient id="hn-glow">
          <stop offset="0" stopColor="#ffb86b" stopOpacity="0.32" />
          <stop offset="0.6" stopColor="#ffb86b" stopOpacity="0.16" />
          <stop offset="1" stopColor="#ffb86b" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Body wall and cord as one sculpted surface, cut open. */}
      <g filter="url(#hn-sculpt)" fill="url(#hn-skin)">
        <ellipse cx={C[0]} cy={C[1]} rx={rx + wall} ry={ry + wall} />
        <path d={cordD} />
      </g>
      {/* Umbilical vessels seen through the cord wall. */}
      <g fill="none" strokeLinecap="round" opacity={0.35}>
        {[-0.45, 0, 0.45].map((o, i) => (
          <path key={i} d={smoothPath(Array.from({ length: 9 }, (_, j) => {
            const u = 0.42 + j * 0.07;
            const s = at(u);
            return [s.p[0] + s.n[0] * o * 18, s.p[1] + s.n[1] * o * 18] as Pt;
          }), false)} stroke={i === 1 ? '#6d4b8a' : '#b8404c'} strokeWidth={i === 1 ? 7 : 4.5} />
        ))}
      </g>
      <ellipse cx={cutEnd.p[0]} cy={cutEnd.p[1]} rx={10} ry={24} transform={`rotate(${(Math.atan2(cutEnd.n[1], cutEnd.n[0]) * 180) / Math.PI - 90} ${cutEnd.p[0]} ${cutEnd.p[1]})`} fill="#f3c0b2" stroke="#9b4d45" strokeWidth={1} />

      <Part id="barrunbe-abdominala">
        <ellipse cx={C[0]} cy={C[1]} rx={rx} ry={ry} fill="url(#hn-cav)" stroke="#e8a996" strokeWidth={1.5} strokeOpacity={0.5} />
      </Part>
      {out > 0.02 && (
        <Part id="zilbor-ernia-fisiologikoa" show={out}>
          {/* Extension of the cavity into the proximal cord, holding the loops. */}
          <path d={coelomD} fill="#2c1418" />
          {/* A soft pool of light on the bulge of the cord (no drawn ring). */}
          <ellipse cx={bulge.p[0]} cy={bulge.p[1]} rx={halfW(bulgeU) * 2.1} ry={halfW(bulgeU) * 1.45} transform={`rotate(${(Math.atan2(bulge.n[1], bulge.n[0]) * 180) / Math.PI + 90} ${bulge.p[0]} ${bulge.p[1]})`} fill="url(#hn-glow)" pointerEvents="none" />
        </Part>
      )}

      {/* Liver: fills much of the small cavity, which is why the loops go out. */}
      <g pointerEvents="none">
        <ellipse cx={C[0] - rx * 0.12} cy={C[1] - ry * 0.46} rx={rx * 0.66} ry={ry * 0.4} fill="url(#hn-liver)" stroke="#e29a8a" strokeOpacity={0.55} strokeWidth={1.4} />
        <path d={`M${C[0] - rx * 0.6},${C[1] - ry * 0.55} Q${C[0] - rx * 0.2},${C[1] - ry * 0.8} ${C[0] + rx * 0.3},${C[1] - ry * 0.66}`} fill="none" stroke="#f3b8aa" strokeWidth={2} strokeLinecap="round" opacity={0.35} />
        <text x={C[0] - rx * 0.12} y={C[1] - ry * 0.42} textAnchor="middle" fill="#f3c9bd" fontSize={12} letterSpacing="0.1em" opacity={0.75} style={{ textTransform: 'uppercase' }}>
          gibela
        </text>
      </g>
      <Part id="heste-lakioak">
        <g fill="none" strokeLinecap="round" strokeLinejoin="round">
          <path d={gut} stroke="#5e2622" strokeWidth={17} />
          <path d={gut} stroke="#dd8f82" strokeWidth={13} />
          <path d={gut} stroke="#f6c3b6" strokeWidth={3.5} opacity={0.7} transform="translate(-1.5 -2.5)" />
        </g>
      </Part>
      <Part id="erdiko-hestea">
        <g fill="none" strokeLinecap="round">
          <path d={`M${S0[0]},${S0[1]} l${rx * 0.3},-14`} stroke="#5e2622" strokeWidth={17} />
          <path d={`M${S0[0]},${S0[1]} l${rx * 0.3},-14`} stroke="#dd8f82" strokeWidth={13} />
          <path d={`M${S1[0]},${S1[1]} l${rx * 0.3},16`} stroke="#5e2622" strokeWidth={17} />
          <path d={`M${S1[0]},${S1[1]} l${rx * 0.3},16`} stroke="#dd8f82" strokeWidth={13} />
        </g>
      </Part>

      {/* Direction of the process: out along the cord, then back into the enlarged cavity. */}
      {(() => {
        // Beside the cord on its lower side, clear of the bulge at its widest (and of the names above it).
        const side = (u: number): Pt => {
          const { p, n } = at(u);
          const o = 25 + 34 + 26;
          return [p[0] - n[0] * o, p[1] - n[1] * o];
        };
        const goOut = seg(t, EXIT[0], EXIT[0] + 0.07);
        const goIn = seg(t, BACK[0], BACK[0] + 0.07);
        return (
          <>
            <Arrow from={side(0.03)} to={side(0.4)} bend={-0.05} color="#ffb86b" width={3.6} progress={goOut} show={1 - seg(t, 0.71, 0.74)} />
            <Arrow from={side(0.4)} to={side(0.03)} bend={0.05} color="#8fb4f7" width={3.6} progress={goIn} show={1 - seg(t, 0.85, 0.88)} />
          </>
        );
      })()}

      <Label id="zilbor-ernia-fisiologikoa" x={250} y={120} ax={bulge.p[0] + bulge.n[0] * halfW(bulgeU) * 1.2} ay={bulge.p[1] + bulge.n[1] * halfW(bulgeU) * 1.2} show={seg(out, 0.5, 0.8)} />
      <Label id="heste-lakioak" x={250} y={190} ax={loopC[0]} ay={loopC[1]} />
      <Label id="zilborrestea" x={470} y={560} ax={at(0.66).p[0]} ay={at(0.66).p[1] + 14} />
      <Label id="barrunbe-abdominala" x={820} y={262} ax={C[0] + rx * 0.62} ay={C[1] - ry * 0.3} />
      <Label id="erdiko-hestea" x={820} y={440} ax={S1[0] + rx * 0.2} ay={S1[1] + 9} />

      <Note x={610} y={36} tone="accent" show={seg(t, 0.6, 0.64) * (1 - seg(t, 0.74, 0.76))}>
        Ernia FISIOLOGIKOA: normala, ez patologikoa (6. astetik)
      </Note>
      <Note x={610} y={60} show={seg(t, 0.62, 0.66) * (1 - seg(t, 0.74, 0.76))}>
        Heste lakioek ez daukate lekurik barrunbe abdominalean → zilborrestera sartzen dira
      </Note>
      <Note x={610} y={36} tone="accent" show={seg(t, 0.78, 0.82)}>
        12. astea: barrunbea handiagoa, goragunea desagertu da
      </Note>
      {/* Weeks 6 → 12: when the loops are out in the cord. */}
      <g pointerEvents="none">
        {(() => {
          const wx = (w: number) => 620 + ((w - 5) / 8) * 260;
          const now = week;
          return (
            <>
              <text x={620} y={548} fill="#8b867d" fontSize={11} letterSpacing="0.12em" style={{ textTransform: 'uppercase' }}>
                Lakioak zilborrestean
              </text>
              <path d={`M${wx(5)},566 H${wx(13)}`} stroke="#3b3833" strokeWidth={4} strokeLinecap="round" />
              <path d={`M${wx(6)},566 H${wx(12)}`} stroke="#ffb86b" strokeWidth={8} strokeLinecap="round" opacity={0.45} />
              {[6, 8, 10, 12].map((w) => (
                <text key={w} x={wx(w)} y={588} textAnchor="middle" fill={w === 6 || w === 12 ? '#ffd7a8' : '#8b867d'} fontSize={11} fontWeight={w === 6 || w === 12 ? 650 : 500} style={{ fontVariantNumeric: 'tabular-nums' }}>
                  {w}
                </text>
              ))}
              <circle cx={wx(now)} cy={566} r={6.5} fill="#ffb86b" stroke="#1b1916" strokeWidth={2} />
            </>
          );
        })()}
      </g>
      <AgeHud value={Math.floor(week + 0.001)} unit=". astea" caption="Adina" />
    </g>
  );
}
