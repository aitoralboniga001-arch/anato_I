'use client';

import { Label, Note, Part, lerp, seg, smoothPath, type Pt, type SceneProps } from '@/components/kit';
import { AgeHud, SkinDefs } from './skin';

/**
 * Stage `hirugarren-hilabetea`, view `ernia`: the abdomen cut open from the left side.
 * From week 6 the gut loops (from the midgut) have no room in the abdominal cavity and go
 * out into the proximal umbilical cord: a PHYSIOLOGICAL hernia. By week 12 the cavity is
 * larger, the loops return and the bulge disappears.
 */

const C: Pt = [610, 290];
const E: Pt = [72, 468]; // cut end of the cord

/** Week shown for each moment of the stage (the other view runs weeks 9–12 in parallel). */
function weekAt(t: number) {
  if (t < 0.12) return 6;
  if (t < 0.3) return lerp(6, 7, seg(t, 0.12, 0.3));
  if (t < 0.62) return lerp(7, 10, seg(t, 0.3, 0.62));
  if (t < 0.84) return lerp(10, 12, seg(t, 0.62, 0.84));
  return 12;
}

const bez = (a: Pt, b: Pt, c: Pt, d: Pt, u: number): Pt => {
  const v = 1 - u;
  return [v * v * v * a[0] + 3 * v * v * u * b[0] + 3 * v * u * u * c[0] + u * u * u * d[0], v * v * v * a[1] + 3 * v * v * u * b[1] + 3 * v * u * u * c[1] + u * u * u * d[1]];
};

export function UmbilicalHernia({ t }: SceneProps) {
  const week = weekAt(t);
  const out = seg(t, 0.12, 0.3) * (1 - seg(t, 0.62, 0.84)); // loops in the cord
  const grow = seg(t, 0.56, 0.84); // the abdominal cavity enlarges
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
  const loops = inside.map((p, i) => [lerp(p[0], outside[i][0], out), lerp(p[1], outside[i][1], out)] as Pt);
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
        <radialGradient id="hn-liver" cx="0.4" cy="0.35" r="0.75">
          <stop offset="0" stopColor="#9b4440" />
          <stop offset="1" stopColor="#5c201f" />
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
          <ellipse cx={bulge.p[0]} cy={bulge.p[1]} rx={halfW(bulgeU) * 1.9} ry={halfW(bulgeU) * 1.3} transform={`rotate(${(Math.atan2(bulge.n[1], bulge.n[0]) * 180) / Math.PI + 90} ${bulge.p[0]} ${bulge.p[1]})`} fill="none" stroke="#ffb86b" strokeWidth={1.5} strokeDasharray="5 5" opacity={0.85} />
        </Part>
      )}

      {/* Liver: fills much of the small cavity, which is why the loops go out. */}
      <ellipse cx={C[0] - rx * 0.12} cy={C[1] - ry * 0.46} rx={rx * 0.66} ry={ry * 0.4} fill="url(#hn-liver)" stroke="#c9786b" strokeOpacity={0.45} strokeWidth={1.2} />
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

      <Label id="zilbor-ernia-fisiologikoa" x={250} y={120} ax={bulge.p[0] + bulge.n[0] * halfW(bulgeU) * 1.2} ay={bulge.p[1] + bulge.n[1] * halfW(bulgeU) * 1.2} show={seg(out, 0.5, 0.8)} />
      <Label id="heste-lakioak" x={250} y={190} ax={loopC[0]} ay={loopC[1]} />
      <Label id="zilborrestea" x={470} y={560} ax={at(0.66).p[0]} ay={at(0.66).p[1] + 14} />
      <Label id="barrunbe-abdominala" x={846} y={262} ax={C[0] + rx * 0.62} ay={C[1] - ry * 0.3} />
      <Label id="erdiko-hestea" x={846} y={440} ax={S1[0] + rx * 0.2} ay={S1[1] + 9} />

      <Note x={610} y={36} tone="accent" show={seg(t, 0.32, 0.36) * (1 - seg(t, 0.6, 0.64))}>
        Ernia FISIOLOGIKOA: normala, ez patologikoa
      </Note>
      <Note x={610} y={36} tone="accent" show={seg(t, 0.86, 0.9)}>
        12. astea: barrunbea handiagoa, goragunea desagertu da
      </Note>
      <AgeHud value={Math.floor(week)} unit=". astea" caption="Adina" />
    </g>
  );
}
