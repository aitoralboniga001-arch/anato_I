'use client';

import { useId } from 'react';
import { Label, Note, Part, lerp, rand, seg, smoothPath, type Pt, type SceneProps } from '@/components/kit';
import { Defs8, MesCell, Q, f1, inPoly, mesCells, spline, vis } from './common';

/**
 * 8:hezurtzapena — apunteen 2. atala eta 29. orriko irudia (A–D). Bi panel aldi berean:
 *  ezkerrean MINTZEZKO hezurtzapena (buru-ganga: azalaren eta garunaren artean): mesenkimak mintzezko eredua
 *  osatzen du, erdian hezurtzapen zentroa agertzen da (osteoblastoak) eta hezur espikulak erradialki hazten dira:
 *  eredua zuzenean hezurtzen da;
 *  eskuinean hezurtzapen ENDOKONDRALA: mesenkima → kondroblastoek kartilago hialinozko eredua → 2. fasean
 *  erdian hezurtzapen zentroa (odol hodia sartzen da, osteoblastoak) → hezurra erditik muturretara hedatzen da.
 */

export const OSS_T = { membrane: 0.16, spicules: 0.32, cartilage: 0.48, centre: 0.64, spread: 0.8 };

// ——— Left: membranous (skull vault) ———
const LX = 345;
const LC: Pt = [LX, 318];
const MEMBRANE = spline([[232, 196], [300, 182], [390, 182], [458, 196], [462, 318], [458, 440], [390, 454], [300, 454], [232, 440], [228, 318]], 8, true);
const L_CELLS = mesCells((x, y) => inPoly(MEMBRANE, x, y), [232, 186, 460, 452], 26, 11);
/** Radial spicules: each a branching polyline from the centre. */
const SPICULES: Pt[][] = Array.from({ length: 14 }, (_, i) => {
  const a = (i / 14) * Math.PI * 2 + rand(i * 3.3) * 0.3;
  const len = 92 + rand(i * 7.1) * 26;
  const pts: Pt[] = [];
  for (let k = 0; k <= 6; k++) {
    const r = (len * k) / 6;
    const wob = Math.sin(k * 1.7 + i) * 6 * (k / 6);
    pts.push([LC[0] + Math.cos(a) * r - Math.sin(a) * wob, LC[1] + Math.sin(a) * r * 0.92 + Math.cos(a) * wob]);
  }
  return pts;
});
const BRANCHES: { from: number; spic: number; pts: Pt[] }[] = SPICULES.flatMap((sp, i) =>
  [3, 5].map((k, j) => {
    const p = sp[k];
    const a = Math.atan2(p[1] - LC[1], p[0] - LC[0]) + (j ? -0.6 : 0.55);
    const l = 22 + rand(i * 5 + j) * 10;
    return { from: k / 6, spic: i, pts: [p, [p[0] + Math.cos(a) * l * 0.5, p[1] + Math.sin(a) * l * 0.5], [p[0] + Math.cos(a) * l, p[1] + Math.sin(a) * l]] as Pt[] };
  }),
);

// ——— Right: endochondral (a long bone model) ———
const RX = 655;
const TOP = 112;
const BOT = 520;
function boneShape(sw: number, ew: number): Pt[] {
  const mid = (TOP + BOT) / 2;
  const R: Pt[] = [
    [RX, TOP - 6],
    [RX + ew * 0.7, TOP],
    [RX + ew, TOP + 40],
    [RX + ew * 0.8, TOP + 92],
    [RX + sw, TOP + 140],
    [RX + sw * 0.94, mid],
    [RX + sw, BOT - 140],
    [RX + ew * 0.8, BOT - 92],
    [RX + ew, BOT - 40],
    [RX + ew * 0.7, BOT],
    [RX, BOT + 6],
  ];
  const L = R.slice(1, -1).map(([x, y]) => [2 * RX - x, y] as Pt).reverse();
  return spline([...R, ...L], 8, true);
}
const MODEL = boneShape(30, 56);
const R_CELLS = mesCells((x, y) => inPoly(boneShape(44, 70), x, y) || Math.abs(x - RX) < 110, [RX - 110, 120, RX + 110, 512], 26, 41);
const condensedAt = (p: Pt): Pt => {
  // Pull each cell into the bone model (keeps its relative position).
  const y = lerp(TOP + 14, BOT - 14, (p[1] - 120) / 392);
  const half = inPoly(MODEL, RX + 1, y) ? halfWidthAt(y) : 30;
  return [RX + ((p[0] - RX) / 110) * (half - 8), y];
};
function halfWidthAt(y: number) {
  let best = 0;
  for (const q of MODEL) if (Math.abs(q[1] - y) < 6 && q[0] > RX) best = Math.max(best, q[0] - RX);
  return best || 30;
}
const LACUNAE: { p: Pt; r: number }[] = (() => {
  const out: { p: Pt; r: number }[] = [];
  let i = 0;
  for (let y = TOP + 8; y < BOT - 6; y += 13)
    for (let x = RX - 64; x < RX + 64; x += 15) {
      i++;
      const jx = x + (rand(i * 2.3) - 0.5) * 7 + ((y / 13) % 2) * 6;
      const jy = y + (rand(i * 4.1) - 0.5) * 5;
      if (inPoly(offsetIn(MODEL, 6), jx, jy)) out.push({ p: [jx, jy], r: 3 + rand(i * 6.7) * 0.8 });
    }
  return out;
})();
function offsetIn(pts: Pt[], d: number): Pt[] {
  const cy = (TOP + BOT) / 2;
  return pts.map(([x, y]) => [x - Math.sign(x - RX) * d, y - Math.sign(y - cy) * d * 0.6]);
}

export function OssificationTypes({ t, reduced }: SceneProps) {
  const cid = useId().replace(/:/g, '');
  // Left timeline.
  const lCentre = seg(t, OSS_T.membrane + 0.02, OSS_T.membrane + 0.08);
  const spic = seg(t, OSS_T.spicules + 0.01, OSS_T.spicules + 0.13);
  // Right timeline.
  const cond = seg(t, OSS_T.cartilage + 0.005, OSS_T.cartilage + 0.05);
  const cart = seg(t, OSS_T.cartilage + 0.04, OSS_T.cartilage + 0.09);
  const hyper = seg(t, OSS_T.centre + 0.005, OSS_T.centre + 0.04);
  const vessel = seg(t, OSS_T.centre + 0.03, OSS_T.centre + 0.07);
  const prim = seg(t, OSS_T.centre + 0.06, OSS_T.centre + 0.1);
  const spread = seg(t, OSS_T.spread + 0.01, OSS_T.spread + 0.1);
  const mid = (TOP + BOT) / 2;
  const reach = lerp(18, 128, spread) + 14 * prim;
  const boneTop = mid - reach;
  const boneBot = mid + reach;
  const pulse = reduced ? 0 : Math.sin(t * 90) * 0.5 + 0.5;

  const spicPath = (pts: Pt[], u: number) => {
    const n = pts.length - 1;
    const m = u * n;
    const k = Math.floor(m);
    const out = pts.slice(0, k + 1);
    if (k < n) out.push([lerp(pts[k][0], pts[k + 1][0], m - k), lerp(pts[k][1], pts[k + 1][1], m - k)]);
    return `M${out.map((p) => `${f1(p[0])},${f1(p[1])}`).join('L')}`;
  };
  const shaftClip = `M${RX - 80},${f1(boneTop)}H${RX + 80}V${f1(boneBot)}H${RX - 80}Z`;

  return (
    <g>
      <Defs8 />
      <rect x={0} y={0} width={1000} height={640} fill="#0f0f11" />
      <rect x={499} y={60} width={1.2} height={500} fill="#fff" opacity={0.08} />
      <clipPath id={`w8-oss-model${cid}`}>
        <path d={smoothPath(MODEL, true, 0.3)} />
      </clipPath>
      <clipPath id={`w8-oss-shaft${cid}`}>
        <path d={shaftClip} />
      </clipPath>

      {/* ——— Membranous: between the skin and the brain ——— */}
      <rect x={214} y={136} width={262} height={22} rx={8} fill={Q.skin} opacity={0.55} />
      <rect x={214} y={480} width={262} height={44} rx={14} fill={Q.neural} opacity={0.45} />
      <path d={smoothPath(MEMBRANE, true, 0.3)} fill="#2a1d18" stroke="#5a3a28" strokeWidth={1.2} />
      <Part id="mesenkima">
        <path d={smoothPath(MEMBRANE, true, 0.3)} fill="url(#w8-mes)" />
        {L_CELLS.map((c, i) => {
          const d = Math.hypot(c.p[0] - LC[0], c.p[1] - LC[1]);
          // Cells near the centre become osteoblasts; spicules then sweep past the rest.
          const taken = lCentre * (d < 40 ? 1 : 0) + Math.min(1, spic * 1.15) * (d < 120 ? 1 : 0);
          return <MesCell key={i} p={c.p} r={c.r} a={c.a} opacity={1 - 0.75 * Math.min(1, taken)} />;
        })}
      </Part>
      <Part id="hezur-espikulak" show={spic > 0.01 ? 1 : 0}>
        {SPICULES.map((sp, i) => (
          <path key={i} d={spicPath(sp, spic)} fill="none" stroke={Q.bone} strokeWidth={lerp(6, 4, i % 2)} strokeLinecap="round" />
        ))}
        {BRANCHES.map((b, i) => {
          const u = Math.max(0, (spic - b.from) / (1 - b.from));
          return u > 0.02 ? <path key={i} d={spicPath(b.pts, u)} fill="none" stroke={Q.bone} strokeWidth={3} strokeLinecap="round" /> : null;
        })}
        <circle cx={LC[0]} cy={LC[1]} r={lerp(8, 26, spic)} fill={Q.bone} />
      </Part>
      <Part id="hezurtzapen-zentroak" show={lCentre}>
        <circle cx={LC[0]} cy={LC[1]} r={22 + 3 * pulse * (1 - spic)} fill={Q.centre} opacity={0.35 * (1 - 0.6 * spic)} />
      </Part>
      <Part id="osteoblastoak" show={lCentre}>
        {Array.from({ length: 9 }, (_, i) => {
          const a = (i / 9) * Math.PI * 2;
          const r = lerp(14, 34, spic);
          return <circle key={i} cx={LC[0] + Math.cos(a) * r} cy={LC[1] + Math.sin(a) * r} r={4.2} fill={Q.centre} stroke={Q.osteo} strokeWidth={1.4} />;
        })}
        {SPICULES.map((sp, i) => {
          const p = sp[Math.max(1, Math.round(spic * 6))];
          return spic > 0.15 ? <circle key={`s${i}`} cx={p[0]} cy={p[1]} r={3.4} fill={Q.centre} stroke={Q.osteo} strokeWidth={1.2} /> : null;
        })}
      </Part>

      {/* ——— Endochondral: a long-bone model ——— */}
      <Part id="mesenkima" show={1 - cart}>
        {R_CELLS.map((c, i) => (
          <MesCell key={i} p={[lerp(c.p[0], condensedAt(c.p)[0], cond), lerp(c.p[1], condensedAt(c.p)[1], cond)]} r={c.r} a={c.a + cond * 40} />
        ))}
      </Part>
      <Part id="kartilago-eredua" show={cart}>
        <path d={smoothPath(MODEL, true, 0.3)} fill={Q.cart} stroke={Q.cartDeep} strokeWidth={2.4} />
        <g clipPath={`url(#w8-oss-model${cid})`}>
          {LACUNAE.map((l, i) => {
            const near = 1 - Math.min(1, Math.abs(l.p[1] - mid) / 150);
            const r = l.r * (1 + 0.6 * hyper * near);
            return (
              <g key={i}>
                <ellipse cx={l.p[0]} cy={l.p[1]} rx={r * 1.3} ry={r} fill={Q.cartCell} opacity={0.8} />
                <circle cx={l.p[0]} cy={l.p[1]} r={r * 0.42} fill={Q.cartDeep} />
              </g>
            );
          })}
        </g>
      </Part>
      <Part id="kondroblastoak" show={cart * (1 - hyper)}>
        {MODEL.filter((_, i) => i % 5 === 0).map((p, i) => (
          <ellipse key={i} cx={p[0] - Math.sign(p[0] - RX) * 3} cy={p[1]} rx={4.6} ry={2.6} fill={Q.cartCell} stroke={Q.cartDeep} strokeWidth={1} />
        ))}
      </Part>
      <Part id="kondrozitoak" show={hyper * (1 - prim * 0.7)}>
        {LACUNAE.filter((l) => Math.abs(l.p[1] - mid) < 70).map((l, i) => (
          <circle key={i} cx={l.p[0]} cy={l.p[1]} r={l.r * 0.95} fill="none" stroke={Q.cartDeep} strokeWidth={1.2} />
        ))}
      </Part>
      <Part id="hezurtzapen-zentroak" show={prim}>
        <g clipPath={`url(#w8-oss-model${cid})`}>
          <g clipPath={`url(#w8-oss-shaft${cid})`}>
            <rect x={RX - 80} y={TOP} width={160} height={BOT - TOP} fill={Q.bone} />
            <rect x={RX - 80} y={TOP} width={160} height={BOT - TOP} fill="url(#w8-bone)" />
            {/* Marrow cavity with vessels. */}
            <path d={`M${RX - 14},${f1(boneTop + 12)}Q${RX + 8},${mid} ${RX - 10},${f1(boneBot - 12)}`} fill="none" stroke={Q.vessel} strokeWidth={1.6} opacity={0.7} />
          </g>
        </g>
        {/* Collar of bone round the shaft. */}
        <path d={`M${RX - 32},${f1(boneTop + 6)}V${f1(boneBot - 6)}M${RX + 32},${f1(boneTop + 6)}V${f1(boneBot - 6)}`} stroke={Q.bone} strokeWidth={6} strokeLinecap="round" />
      </Part>
      <Part id="osteoblastoak" show={prim}>
        {[[-12, -6], [8, -14], [14, 6], [-6, 12], [0, 0]].map(([dx, dy], i) => (
          <circle key={i} cx={RX + dx} cy={mid + dy} r={4.4} fill={Q.osteo} />
        ))}
        {[-1, 1].map((s) =>
          [0.3, 0.7].map((u, j) => <circle key={`${s}${j}`} cx={RX + s * 18} cy={lerp(mid, s > 0 ? boneBot - 8 : boneTop + 8, u)} r={3.6} fill={Q.osteo} />),
        )}
      </Part>
      {/* The vessel that brings the osteoblasts in. */}
      {vessel > 0.01 && <path d={`M${RX + 112},${mid - 44}Q${RX + 64},${mid - 30} ${f1(lerp(RX + 70, RX + 4, vessel))},${mid - 4}`} fill="none" stroke={Q.vessel} strokeWidth={4} strokeLinecap="round" opacity={vessel} />}

      <path d={smoothPath(MEMBRANE, true, 0.3)} fill="url(#w8-light)" pointerEvents="none" />

      <Note x={LX} y={44} size={13}>
        Mintzezko hezurtzapena
      </Note>
      <Note x={RX} y={44} size={13}>
        Hezurtzapen endokondrala
      </Note>
      <Note x={LX} y={147} size={11} tone="dim">
        azala
      </Note>
      <Note x={LX} y={502} size={11} tone="dim">
        entzefaloa
      </Note>
      <Note x={RX} y={78} size={11.5} tone="accent" show={vis(t, OSS_T.cartilage + 0.02, OSS_T.centre)}>
        1. fasea: kartilago hialinozko eredua
      </Note>
      <Note x={RX} y={78} size={11.5} tone="accent" show={vis(t, OSS_T.centre + 0.02)}>
        2. fasea: kartilagoa hezurtzen da
      </Note>
      <Note x={RX + 112} y={mid - 58} size={11} tone="dim" show={vessel * (1 - spread)}>
        odol hodia
      </Note>

      <Note x={500} y={612} tone="accent" show={vis(t, 0, OSS_T.membrane)}>
        Bi hezurtzapen mota, biak mesenkimatik
      </Note>
      <Note x={500} y={612} tone="accent" show={vis(t, OSS_T.membrane, OSS_T.spicules)}>
        Mintzezkoa: mesenkimaren mintzezko ereduan zuzenean agertzen da hezurtzapen zentroa
      </Note>
      <Note x={500} y={612} tone="accent" show={vis(t, OSS_T.spicules, OSS_T.cartilage)}>
        Zentrotik hezur espikulak erradialki: mintzezko eredua zuzenean hezurtzen da
      </Note>
      <Note x={500} y={612} tone="accent" show={vis(t, OSS_T.cartilage, OSS_T.centre)}>
        Endokondrala: lehenengo kondroblastoek kartilago hialinozko eredua egiten dute
      </Note>
      <Note x={500} y={612} tone="accent" show={vis(t, OSS_T.centre, OSS_T.spread)}>
        2. fasean: hezurtzapen zentroa (odol hodia, osteoblastoak) eta kartilagoa hezur bihurtzen da
      </Note>
      <Note x={500} y={612} tone="accent" show={vis(t, OSS_T.spread)}>
        Mintzezkoa: buru-gangako hezur lauak · endokondrala: kondrokraneoa, gorputz-adarrak, ornoak
      </Note>

      <Label id="mesenkima" x={190} y={230} ax={L_CELLS[3].p[0]} ay={L_CELLS[3].p[1]} show={1 - 0.7 * spic} />
      <Label id="hezurtzapen-zentroak" text="Hezurtzapen zentroa" x={190} y={318} ax={LC[0] - 20} ay={LC[1]} show={lCentre} />
      <Label id="osteoblastoak" x={190} y={360} ax={LC[0] - lerp(14, 34, spic) * Math.cos(Math.PI / 9)} ay={LC[1] + 12} show={lCentre} small />
      <Label id="hezur-espikulak" x={190} y={420} ax={SPICULES[5][4][0]} ay={SPICULES[5][4][1]} show={spic} />

      <Label id="mesenkima" x={810} y={150} ax={RX + 60} ay={170} show={1 - cart} />
      <Label id="kartilago-eredua" x={776} y={150} ax={RX + 46} ay={TOP + 40} show={cart} />
      <Label id="kondroblastoak" x={810} y={230} ax={RX + 42} ay={TOP + 120} show={cart * (1 - hyper)} small />
      <Label id="kondrozitoak" x={810} y={230} ax={RX + 22} ay={mid - 50} show={hyper * (1 - prim * 0.7)} small />
      <Label id="hezurtzapen-zentroak" text="Zentro primarioa" x={810} y={316} ax={RX + 24} ay={mid + 10} show={prim} />
      <Label id="osteoblastoak" x={810} y={360} ax={RX + 14} ay={mid + 6} show={prim} small />
    </g>
  );
}
