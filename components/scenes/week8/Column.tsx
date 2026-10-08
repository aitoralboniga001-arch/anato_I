'use client';

import { useId } from 'react';
import { Arrow, Label, Note, Part, lerp, rand, seg, smoothPath, type Pt, type SceneProps } from '@/components/kit';
import { Defs8, MesCell, Q, f1, inPoly, mirror, sm, spline, vis } from './common';

/**
 * 8:bizkarrezurra — apunteen 5.2 eta 5.2.1 (mesenkima zutabea, birsegmentazioa, diskoa, makurdurak) eta 10. irudia.
 * - `zeharkakoa`: somitak → dermatoma, miotoma, esklerotoma; esklerotomako zelulak erdialdera, hodi neurala eta
 *   notokorda inguratuz → mesenkima zutabea.
 * - `koronala`: zutabea notokordaren inguruan: segmentu trinkoak eta segmentu arteko mesenkima; miotomak eta segmentu
 *   arteko arteriak iristen dira → birsegmentazioa (segmentu bakoitza goiko/beheko erdietan) → beheko erdia beheko
 *   segmentuaren goiko erdiarekin fusionatu: orno gorputza bi segmentutatik → tartean diskoa → notokorda gorputzetan
 *   endekatu, diskoan gune pulposoa; inguruan eraztun fibrosoa → miotomak eta nerbioak orno batetik bestera; arteriak
 *   orno gorputzaren mailan.
 * - `makurdurak`: alboko bista: zifosia (primarioa, jaio aurretik) eta lordosia (sekundarioa: lepokoa burua altxatzean,
 *   gerrikoa ibiltzean).
 */

export const BZ_T = { somite: 0, migrate: 0.08, segments: 0.17, arrive: 0.26, split: 0.35, fuse: 0.44, disc: 0.53, nucleus: 0.61, muscles: 0.7, arteries: 0.77, kypho: 0.84, lordo: 0.91 };

const MYO = '#d9534f';
const MYO_DEEP = '#8f2a26';
const DERM = '#f4a3a8';
const SEGC = '#c98a5a';
const INTER = '#ead2b0';
const BODYC = '#e9d9b4';
const DISC = '#8fd0c8';
const ANNULUS = '#5fb8a8';
const ART = '#e04a3a';
const KYPHO = '#f0a35e';
const LORDO = '#5bc0eb';

// ——— zeharkakoa ———
const OUTLINE = spline([[500, 70], [640, 88], [760, 168], [806, 300], [764, 432], [640, 522], [500, 552], [360, 522], [236, 432], [194, 300], [240, 168], [360, 88]], 8, true);
const TUBE: Pt = [500, 190];
const NOTO_S: Pt = [500, 302];
const SOM_R: Pt = [652, 236];
const COLUMN = spline([[500, 92], [566, 110], [584, 190], [566, 258], [556, 302], [542, 346], [500, 360], [458, 346], [444, 302], [434, 258], [416, 190], [434, 110]], 8, true);
const inTube = (x: number, y: number) => ((x - TUBE[0]) / 50) ** 2 + ((y - TUBE[1]) / 76) ** 2 < 1;
const inNoto = (x: number, y: number) => Math.hypot(x - NOTO_S[0], y - NOTO_S[1]) < 22;

/** Sclerotome cells: from the ventromedial part of each somite to the column (round the tube and the notochord). */
const SCL = Array.from({ length: 96 }, (_, i) => {
  const side = i % 2 ? 1 : -1;
  const a = ((40 + rand(i * 2.3) * 150) * Math.PI) / 180;
  const rr = 10 + rand(i * 3.1) * 34;
  const c: Pt = side > 0 ? SOM_R : mirror(SOM_R);
  const start: Pt = [c[0] - side * Math.cos(a) * rr * 0.9 + side * 6, c[1] + Math.sin(a) * rr];
  let target: Pt = [500, 300];
  for (let j = 0; j < 30; j++) {
    const p: Pt = [500 + side * rand(i * 5.7 + j * 1.1) * 82, 96 + rand(i * 7.9 + j * 1.3) * 262];
    if (inPoly(COLUMN, p[0], p[1]) && !inTube(p[0], p[1]) && !inNoto(p[0], p[1])) {
      target = p;
      break;
    }
  }
  return { start, target, delay: rand(i * 4.4) * 0.02, a: rand(i * 9.1) * 360, r: 1.1 + rand(i * 6.2) * 0.3 };
});

function Somite({ c, side, t }: { c: Pt; side: 1 | -1; t: number }) {
  const diff = seg(t, BZ_T.somite + 0.005, BZ_T.somite + 0.03);
  // dorsolateral dermomyotome: an arc over the top and lateral side
  const arcPts = (r: number) =>
    Array.from({ length: 25 }, (_, i) => {
      const a = ((-170 + (i / 24) * 200) * Math.PI) / 180;
      return [c[0] + side * Math.cos(a) * r, c[1] + Math.sin(a) * r] as Pt;
    });
  const ringPath = (r0: number, r1: number) => {
    const o = arcPts(r1);
    const n = arcPts(r0).reverse();
    return smoothPath([...o, ...n], true, 0.2);
  };
  return (
    <g>
      {/* The epithelial somite, before it divides. */}
      <Part id="somitak">
        <circle cx={c[0]} cy={c[1]} r={56} fill="none" stroke={Q.paraxial} strokeWidth={2.4} opacity={0.9} />
        <circle cx={c[0]} cy={c[1]} r={46} fill="none" stroke={Q.paraxial} strokeWidth={18} opacity={1 - diff} strokeDasharray="7 3" />
      </Part>
      <Part id="dermatoma" show={diff}>
        <path d={ringPath(46, 56)} fill={DERM} stroke="#b45f68" strokeWidth={1.2} />
      </Part>
      <Part id="miotoma" show={diff}>
        <path d={ringPath(34, 46)} fill={MYO} stroke={MYO_DEEP} strokeWidth={1.2} />
        <path d={ringPath(34, 46)} fill="url(#w8-muscle)" />
      </Part>
    </g>
  );
}

export function ColumnSection({ t }: SceneProps) {
  const go = (d: number) => seg(t, BZ_T.migrate + 0.005 + d, BZ_T.migrate + 0.035 + d);
  const col = seg(t, BZ_T.migrate + 0.035, BZ_T.migrate + 0.06);
  const loose = seg(t, BZ_T.somite + 0.012, BZ_T.somite + 0.035);
  const cell1 = (() => {
    const c = SCL[1];
    const k = go(c.delay);
    return [lerp(c.start[0], c.target[0], k), lerp(c.start[1], c.target[1], k)] as Pt;
  })();
  return (
    <g>
      <Defs8 />
      <rect x={0} y={0} width={1000} height={640} fill="#0f0f11" />
      <path d={smoothPath(OUTLINE, true, 0.25)} fill={Q.body} stroke={Q.skin} strokeWidth={3} />
      <path d={smoothPath(OUTLINE, true, 0.25)} fill="url(#w8-light)" />
      {/* The column forming round the tube and the notochord. */}
      <Part id="mesenkima-zutabea" show={col}>
        <path d={smoothPath(COLUMN, true, 0.25)} fill={Q.mes} opacity={0.85} stroke={Q.mesDeep} strokeWidth={2} />
        <path d={smoothPath(COLUMN, true, 0.25)} fill="url(#w8-mes)" />
      </Part>
      <Part id="hodi-neurala">
        <ellipse cx={TUBE[0]} cy={TUBE[1]} rx={44} ry={70} fill={Q.neural} stroke="#8fa7ff" strokeWidth={2} />
        <path d={`M${TUBE[0]},${TUBE[1] - 48}L${TUBE[0]},${TUBE[1] + 48}`} stroke="#0d1640" strokeWidth={4} strokeLinecap="round" />
      </Part>
      <Part id="notokorda">
        <circle cx={NOTO_S[0]} cy={NOTO_S[1]} r={15} fill={Q.noto} stroke="#e9d5ff" strokeWidth={1.5} />
      </Part>
      {[455, 545].map((x) => (
        <circle key={x} cx={x} cy={372} r={13} fill="#7a1f1a" stroke={ART} strokeWidth={2} />
      ))}
      <Somite c={SOM_R} side={1} t={t} />
      <Somite c={mirror(SOM_R)} side={-1} t={t} />
      {/* Sclerotome: the ventromedial wall comes loose into mesenchyme and moves to the midline. */}
      <Part id="esklerotoma" show={loose}>
        {SCL.map((c, i) => {
          const k = go(c.delay);
          const p: Pt = [lerp(c.start[0], c.target[0], k), lerp(c.start[1], c.target[1], k)];
          return <MesCell key={i} p={p} r={c.r} a={c.a + k * 60} opacity={loose * (1 - 0.35 * col)} />;
        })}
      </Part>
      {[1, -1].map((s) => (
        <g key={s}>
          <Arrow from={[500 + s * 590 * 0.5 + s * -140, 290]} to={[500 + s * 60, 292]} bend={s * -0.12} color={Q.mes} width={3} show={vis(t, BZ_T.migrate + 0.005, BZ_T.migrate + 0.07)} flow />
          <Arrow from={[500 + s * 155, 196]} to={[500 + s * 70, 168]} bend={s * 0.1} color={Q.mes} width={3} show={vis(t, BZ_T.migrate + 0.005, BZ_T.migrate + 0.07)} flow />
        </g>
      ))}

      <Note x={250} y={30} size={12.5} tone="accent">
        Zeharkako ebakidura · 4. astea
      </Note>
      <Note x={500} y={612} tone="accent" show={vis(t, 0, BZ_T.migrate)}>
        Somita: dermatoma (kanpoan), miotoma (azpian) eta esklerotoma (erdialdean, mesenkima bihurtzen)
      </Note>
      <Note x={500} y={612} tone="accent" show={vis(t, BZ_T.migrate)}>
        Esklerotomako zelulak erdialdera: hodi neurala eta notokorda inguratu → mesenkima zutabea
      </Note>

      <Label id="hodi-neurala" x={190} y={150} ax={458} ay={168} />
      <Label id="notokorda" x={190} y={300} ax={485} ay={302} />
      <Label id="mesenkima-zutabea" x={190} y={420} ax={452} ay={330} show={col} />
      <Label id="dermatoma" x={810} y={130} ax={690} ay={186} show={loose} />
      <Label id="miotoma" x={810} y={190} ax={694} ay={226} show={loose} />
      <Label id="somitak" x={810} y={250} ax={708} ay={240} show={1 - seg(t, BZ_T.migrate, BZ_T.migrate + 0.02)} />
      <Label id="esklerotoma" x={810} y={330} ax={cell1[0]} ay={cell1[1]} show={loose} />
    </g>
  );
}

// ——— koronala ———
const PITCH = 128;
const YC = (k: number) => 120 + PITCH * k; // segment centres (later: discs)
const YB = (k: number) => 56 + PITCH * k; // intersegmental levels (later: middle of the bodies)
const KS = [-1, 0, 1, 2, 3, 4];
const HW = 72; // column half-width
/** A vertebral body between y0 and y1: rounded corners, the sides drawn in by `waist` at mid-height. */
const waisted = (y0: number, y1: number, waist: number) => {
  const r = 6;
  const m = (y0 + y1) / 2;
  const L = 500 - HW;
  const R = 500 + HW;
  return `M${L + r},${y0}H${R - r}Q${R},${y0} ${R},${y0 + r}Q${R - waist},${m} ${R},${y1 - r}Q${R},${y1} ${R - r},${y1}H${L + r}Q${L},${y1} ${L},${y1 - r}Q${L + waist},${m} ${L},${y0 + r}Q${L},${y0} ${L + r},${y0}Z`;
};
const IW = 58; // intersegmental band half-width (narrower, looser)
const IH = 11;

export function ColumnCoronal({ t }: SceneProps) {
  const myoIn = seg(t, BZ_T.arrive + 0.01, BZ_T.arrive + 0.06);
  const artIn = seg(t, BZ_T.arrive + 0.02, BZ_T.arrive + 0.07);
  const split = seg(t, BZ_T.split + 0.01, BZ_T.split + 0.06);
  const fuse = seg(t, BZ_T.fuse + 0.01, BZ_T.fuse + 0.07);
  // the lower half proliferates down over the intersegmental band, then the joined block becomes one body
  const grow = seg(fuse, 0, 0.55);
  const merge = seg(fuse, 0.5, 1);
  const disc = seg(t, BZ_T.disc + 0.01, BZ_T.disc + 0.06);
  const np = seg(t, BZ_T.nucleus + 0.01, BZ_T.nucleus + 0.06);
  const span = seg(t, BZ_T.muscles + 0.01, BZ_T.muscles + 0.06);
  const nerve = seg(t, BZ_T.muscles + 0.005, BZ_T.muscles + 0.03);
  const flow = seg(t, BZ_T.arteries, BZ_T.arteries + 0.02);
  const gap = 4 * split + 8 * disc; // half-gap at each segment centre
  const myoX = lerp(300, 196, myoIn);
  return (
    <g>
      <Defs8 />
      <rect x={0} y={0} width={1000} height={640} fill="#0f0f11" />
      <defs>
        <clipPath id="w8-bz-col">
          <rect x={300} y={44} width={400} height={552} />
        </clipPath>
      </defs>
      {/* Myotomes: at the segment levels; arrive from the sides, later reach from one vertebra to the next. */}
      <Part id="miotoma">
        {KS.map((k) =>
          [1, -1].map((s) => {
            const x = 500 + s * myoX;
            const y = YC(k);
            if (y < 20 || y > 620) return null;
            return (
              <g key={`${k}${s}`}>
                {span > 0.01 && (
                  <path
                    d={`M${f1(x - s * 40)},${f1(y - 30)}L${f1(lerp(x - s * 40, 500 + s * (HW + 2), span))},${f1(lerp(y - 30, YB(k) + 6, span))}M${f1(x - s * 40)},${f1(y + 30)}L${f1(lerp(x - s * 40, 500 + s * (HW + 2), span))},${f1(lerp(y + 30, YB(k + 1) - 6, span))}`}
                    stroke={MYO}
                    strokeWidth={5}
                    strokeLinecap="round"
                  />
                )}
                <rect x={x - 42} y={y - 46} width={84} height={92} rx={18} fill={MYO} stroke={MYO_DEEP} strokeWidth={1.6} />
                <rect x={x - 42} y={y - 46} width={84} height={92} rx={18} fill="url(#w8-muscle)" />
              </g>
            );
          }),
        )}
      </Part>
      {/* Intersegmental arteries, between the dense segments (later: at the middle of each body). */}
      <Part id="segmentu-arteko-arteriak" show={artIn > 0.01 ? 1 : 0}>
        {KS.map((k) =>
          [1, -1].map((s) => {
            const y = YB(k);
            if (y < 30 || y > 610) return null;
            const x0 = 500 + s * 330;
            const x1 = 500 + s * lerp(330, HW - 4, artIn);
            return (
              <g key={`${k}${s}`}>
                <path d={`M${x0},${y}L${f1(x1)},${y}`} stroke="#7a1f1a" strokeWidth={9} strokeLinecap="round" />
                <path d={`M${x0},${y}L${f1(x1)},${y}`} stroke={ART} strokeWidth={6} strokeLinecap="round" />
                {flow > 0.01 &&
                  [0, 1, 2].map((q) => {
                    const u = (q / 3 + t * 9) % 1;
                    return <circle key={q} cx={lerp(x0, x1, u)} cy={y} r={2.6} fill="#ffd0c8" opacity={flow} />;
                  })}
              </g>
            );
          }),
        )}
      </Part>
      {/* Spinal nerves: at the segment levels, then between the bodies (disc level). */}
      <Part id="nerbio-espinalak" show={nerve > 0.01 ? 1 : 0}>
        {KS.map((k) =>
          [1, -1].map((s) => {
            const y = YC(k);
            if (y < 30 || y > 610) return null;
            const x1 = 500 + s * lerp(HW, myoX - 30, nerve);
            return <path key={`${k}${s}`} d={`M${500 + s * HW},${y}L${f1(x1)},${y}`} stroke={Q.nerve} strokeWidth={4.4} strokeLinecap="round" />;
          }),
        )}
      </Part>

      <g clipPath="url(#w8-bz-col)">
        {/* Column outline and the opaque backing under its pieces. */}
        <rect x={500 - HW - 3} y={30} width={2 * HW + 6} height={600} fill="#1d1a22" />
        <Part id="mesenkima-zutabea" quiet>
          <path d={`M${500 - HW - 2},30V630M${500 + HW + 2},30V630`} stroke={Q.mesDeep} strokeWidth={2} />
        </Part>
        {/* Before fusion: dense segments, split into a looser upper and a denser lower half. */}
        {/* From the fusion on, the growing halves are the body being made: lit with it. */}
        <Part id={t >= BZ_T.fuse ? 'orno-gorputza' : 'esklerotoma-segmentuak'} show={1 - merge}>
          {KS.map((k) => (
            <g key={k}>
              <rect x={500 - HW} y={YB(k) + IH} width={2 * HW} height={YC(k) - gap - YB(k) - IH} fill={lerp(0, 1, split) > 0.5 ? '#d9a378' : SEGC} />
              <rect x={500 - lerp(HW, HW - 6, grow * (1 - grow) * 4)} y={YC(k) + gap} width={2 * lerp(HW, HW - 6, grow * (1 - grow) * 4)} height={YB(k + 1) - IH - YC(k) - gap + 2 * IH * grow} fill={split > 0.5 ? '#a86a3e' : SEGC} />
              <rect x={500 - HW} y={YB(k) + IH} width={2 * HW} height={YB(k + 1) - YB(k) - 2 * IH} fill="url(#w8-mes)" />
            </g>
          ))}
        </Part>
        <Part id="segmentu-arteko-mesenkima">
          {KS.map((k) => (
            <rect key={k} x={500 - IW} y={YB(k) - IH} width={2 * IW} height={2 * IH} fill={INTER} opacity={(1 - grow) * (1 - merge) + 0.0001} />
          ))}
        </Part>
        {/* After fusion: one body from the lower half of a segment and the upper half of the next. */}
        <Part id="orno-gorputza" show={merge}>
          {KS.map((k) => (
            <g key={k}>
              {/* The body takes its waisted shape (sides drawing in between the end plates) as it fuses. */}
              <path d={waisted(YC(k) + gap, YC(k + 1) - gap, 16 * fuse * merge)} fill={BODYC} stroke="#a8946a" strokeWidth={2} />
              <path d={waisted(YC(k) + gap, YC(k + 1) - gap, 16 * fuse * merge)} fill="url(#w8-cart)" opacity={0.35} />
              <path d={waisted(YC(k) + gap, YC(k + 1) - gap, 16 * fuse * merge)} fill="url(#w8-boneshade)" />
            </g>
          ))}
        </Part>
        {/* The old intersegmental mesenchyme, now inside the body (still named, and lit, as itself). */}
        <Part id="segmentu-arteko-mesenkima" show={merge}>
          {KS.map((k) => (
            <rect key={k} x={500 - HW + 10} y={YB(k + 1) - IH} width={2 * HW - 20} height={2 * IH} fill={INTER} opacity={0.45} />
          ))}
        </Part>
        {/* Resegmentation: the cleft through the middle of each segment, and the lower half joining the next. */}
        <Part id="birsegmentazioa" show={split > 0.01 ? 1 - seg(t, BZ_T.disc, BZ_T.disc + 0.03) : 0}>
          {KS.map((k) => (
            <path key={k} d={`M${500 - HW},${YC(k)}H${500 + HW}`} stroke="#fff3c4" strokeWidth={2.4} opacity={split * (1 - merge * 0.6)} />
          ))}
        </Part>
        {/* Disc: from the cells left between the two halves of each segment. */}
        <Part id="ornoarteko-diskoa" show={disc > 0.01 ? 1 : 0}>
          {KS.map((k) => (
            <rect key={k} x={500 - HW} y={YC(k) - gap} width={2 * HW} height={2 * gap} rx={4} fill={DISC} stroke="#3f8f86" strokeWidth={1.4} />
          ))}
        </Part>
        <Part id="eraztun-fibrosoa" show={np > 0.01 ? 1 : 0}>
          {KS.map((k) => (
            <g key={k} opacity={np}>
              <rect x={500 - HW} y={YC(k) - gap} width={2 * HW} height={2 * gap} rx={4} fill={ANNULUS} stroke="#2f7f74" strokeWidth={1.4} />
              {[0.35, 0.6, 0.85].map((q) => (
                <ellipse key={q} cx={500} cy={YC(k)} rx={HW * q + 6} ry={gap * 0.92} fill="none" stroke="#d6fff6" strokeWidth={1} opacity={0.6} />
              ))}
            </g>
          ))}
        </Part>
        {/* Notochord: degenerates in the bodies, stays in the discs as the nucleus pulposus. */}
        <Part id="notokorda">
          {KS.map((k) => {
            const w = lerp(14, 0.01, np);
            return (
              <g key={k}>
                <rect x={500 - w / 2} y={YC(k) + gap} width={w} height={YC(k + 1) - YC(k) - 2 * gap} fill={Q.noto} opacity={1 - np} />
                <rect x={500 - 7} y={YC(k) - gap - 0.5} width={14} height={2 * gap + 1} fill={Q.noto} opacity={1 - np} />
              </g>
            );
          })}
        </Part>
        <Part id="gune-pulposoa" show={np > 0.01 ? 1 : 0} groups={['notokorda']}>
          {KS.map((k) => (
            <ellipse key={k} cx={500} cy={YC(k)} rx={lerp(7, 30, np)} ry={lerp(gap, gap * 0.78, np)} fill={Q.noto} stroke="#e9d5ff" strokeWidth={1.4} />
          ))}
        </Part>
      </g>
      {/* The lower half of each segment grows down to join the upper half of the segment below. */}
      {KS.slice(1, 4).map((k) => (
        <Arrow key={k} from={[500 + HW + 26, YC(k) + 20]} to={[500 + HW + 26, YB(k + 1) + 24]} bend={0} color="#fff3c4" width={2.6} show={vis(t, BZ_T.fuse, BZ_T.disc)} />
      ))}

      <Note x={250} y={22} size={12} tone="accent">
        Ebakidura koronala notokordaren mailan
      </Note>
      <Note x={500} y={612} tone="accent" show={vis(t, BZ_T.segments, BZ_T.arrive)}>
        Zutabean segmentu trinkoak; haien artean segmentu arteko mesenkima (ez hain trinkoa, estuagoa)
      </Note>
      <Note x={500} y={612} tone="accent" show={vis(t, BZ_T.arrive, BZ_T.split)}>
        Miotomak segmentuen mailan finkatzen dira; segmentu arteko arteriak segmentuen artean iristen dira
      </Note>
      <Note x={500} y={612} tone="accent" show={vis(t, BZ_T.split, BZ_T.fuse)}>
        Birsegmentazioa: segmentu bakoitza goiko eta beheko erdietan banatzen da
      </Note>
      <Note x={500} y={612} tone="accent" show={vis(t, BZ_T.fuse, BZ_T.disc)}>
        Beheko erdia ugaldu eta azpiko segmentuaren goiko erdiarekin fusionatu: orno bakoitza bi segmentutatik
      </Note>
      <Note x={500} y={612} tone="accent" show={vis(t, BZ_T.disc, BZ_T.nucleus)}>
        Segmentu baten goiko eta beheko erdien artean gelditzen diren zeluletatik: ornoarteko diskoa
      </Note>
      <Note x={500} y={612} tone="accent" show={vis(t, BZ_T.nucleus, BZ_T.muscles)}>
        Notokorda gorputzetan desagertu; diskoan gune pulposoa, inguruan eraztun fibrosoa
      </Note>
      <Note x={500} y={612} tone="accent" show={vis(t, BZ_T.muscles, BZ_T.arteries)}>
        Miotomak eta nerbioak orno batetik bestera: muskuluek bizkarrezurra mugi dezakete
      </Note>
      <Note x={500} y={612} tone="accent" show={vis(t, BZ_T.arteries)}>
        Arteriak: hasieran segmentu artekoak, amaieran orno gorputzaren mailan
      </Note>

      {/* The notochord stays in the discs as the nucleus pulposus: its name follows it there. */}
      <Label id="notokorda" x={236} y={80} ax={lerp(494, 486, np)} ay={lerp(YB(0) + 40, YC(0) - 6, np)} />
      <Label id="esklerotoma-segmentuak" x={236} y={150} ax={500 - HW + 4} ay={YC(0) + 30} show={1 - merge} />
      <Label id="segmentu-arteko-mesenkima" x={250} y={230} ax={500 - IW + 4} ay={YB(1)} />
      <Label id="orno-gorputza" x={236} y={300} ax={500 - HW + 4} ay={YB(2) + 26} show={merge} />
      <Label id="ornoarteko-diskoa" x={236} y={380} ax={500 - HW + 4} ay={YC(2)} show={disc} />
      <Label id="eraztun-fibrosoa" x={236} y={424} ax={500 - HW + 6} ay={YC(3)} show={np} />
      <Label id="gune-pulposoa" x={236} y={470} ax={500 - 20} ay={YC(3)} show={np} />
      <Label id="mesenkima-zutabea" x={770} y={70} ax={500 + HW + 2} ay={86} show={1 - fuse} />
      <Label id="miotoma" x={810} y={240} ax={500 + myoX + 42} ay={YC(1)} />
      <Label id="segmentu-arteko-arteriak" x={770} y={330} ax={500 + lerp(330, 200, artIn)} ay={YB(2)} show={artIn} />
      <Label id="nerbio-espinalak" x={810} y={410} ax={500 + HW + 50} ay={YC(2)} show={nerve} />
      <Label id="birsegmentazioa" x={810} y={480} ax={500 + HW} ay={YC(3)} show={split * (1 - seg(t, BZ_T.disc, BZ_T.disc + 0.03))} />
    </g>
  );
}

// ——— makurdurak ———
type Curve = [number, number, number, number]; // per region (cervical, thoracic, lumbar, sacral); + = convex to the back
const REGIONS = [0.22, 0.6, 0.84, 1];
const NV = 30;
const SPINE_LEN = 380;
const regionOf = (i: number) => REGIONS.findIndex((e) => (i + 0.5) / NV <= e);
/** Integrate the curvature down the column, then stand the chord upright (back = +x). */
function spinePts(kappa: Curve): Pt[] {
  const pts: Pt[] = [[0, 0]];
  let a = 0;
  const ds = SPINE_LEN / NV;
  for (let i = 0; i < NV; i++) {
    a -= kappa[regionOf(i)] * ds;
    const p = pts[pts.length - 1];
    pts.push([p[0] + Math.sin(a) * ds, p[1] + Math.cos(a) * ds]);
  }
  const e = pts[pts.length - 1];
  const rot = Math.atan2(e[0], e[1]);
  const c = Math.cos(rot);
  const s = Math.sin(rot);
  const r = pts.map(([x, y]): Pt => [x * c - y * s, x * s + y * c]);
  const xs = r.map((p) => p[0]);
  const ys = r.map((p) => p[1]);
  const cx = (Math.min(...xs) + Math.max(...xs)) / 2;
  const cy = (Math.min(...ys) + Math.max(...ys)) / 2;
  return r.map((p): Pt => [500 + p[0] - cx, 352 + p[1] - cy]);
}
const FETUS: Curve = [0.0068, 0.0068, 0.0068, 0.0068];
const HEAD_UP: Curve = [-0.006, 0.0062, 0.0045, 0.009];
const WALK: Curve = [-0.0055, 0.0048, -0.0058, 0.011];
const mixC = (a: Curve, b: Curve, u: number): Curve => [lerp(a[0], b[0], u), lerp(a[1], b[1], u), lerp(a[2], b[2], u), lerp(a[3], b[3], u)];
/** Trunk depth in front of the column (neck, chest, belly, pelvis). */
const DEPTH_K: Pt[] = [[0, 58], [0.22, 76], [0.4, 108], [0.62, 104], [0.82, 92], [1, 66]];
const DEPTH = (i: number) => {
  const s = i / NV;
  const j = Math.max(1, DEPTH_K.findIndex((k) => k[0] >= s));
  const [a, b] = [DEPTH_K[j - 1], DEPTH_K[j]];
  return lerp(a[1], b[1], (s - a[0]) / (b[0] - a[0] || 1));
};

export function Curvatures({ t }: SceneProps) {
  const cid = useId().replace(/:/g, '');
  const curl = seg(t, BZ_T.kypho, BZ_T.kypho + 0.03);
  const head = seg(t, BZ_T.lordo + 0.005, BZ_T.lordo + 0.03);
  const walk = seg(t, BZ_T.lordo + 0.04, BZ_T.lordo + 0.065);
  const kappa = mixC(mixC(mixC(FETUS, [0.0035, 0.0035, 0.0035, 0.0035], 1 - curl), HEAD_UP, head), WALK, walk);
  // The pose: the baby lies on its belly to lift its head (neck lordosis), then stands up to walk (lumbar lordosis).
  const lie = sm(head) * (1 - sm(walk));
  const th = (-Math.PI / 2 + 0.42) * lie;
  const [rc, rs] = [Math.cos(th), Math.sin(th)];
  const P = spinePts(kappa).map(([x, y]): Pt => [500 + (x - 500) * rc - (y - 352) * rs, 352 + (x - 500) * rs + (y - 352) * rc]);
  const tan = (i: number): Pt => {
    const a = P[Math.max(0, i - 1)];
    const b = P[Math.min(P.length - 1, i + 1)];
    const l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
    return [(b[0] - a[0]) / l, (b[1] - a[1]) / l];
  };
  const back = (i: number): Pt => {
    const [tx, ty] = tan(i);
    return [ty, -tx];
  };
  const along = (i: number, d: number): Pt => [P[i][0] + back(i)[0] * d, P[i][1] + back(i)[1] * d];
  const kyLit = seg(t, BZ_T.kypho + 0.005, BZ_T.kypho + 0.025);
  const colour = (r: number) => (r === 1 || r === 3 ? (kyLit > 0.5 ? KYPHO : Q.bone) : (r === 0 ? head : walk) > 0.5 ? LORDO : Q.bone);
  const verts = Array.from({ length: NV }, (_, i) => {
    const a = P[i];
    const b = P[i + 1];
    const ang = (Math.atan2(b[1] - a[1], b[0] - a[0]) * 180) / Math.PI;
    const r = regionOf(i);
    return { m: [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2] as Pt, ang, r, w: r === 0 ? 20 : r === 3 ? 24 : 28 };
  });
  const piece = (r: number) =>
    verts
      .filter((v) => v.r === r)
      .map((v, i) => (
        <g key={i} transform={`translate(${f1(v.m[0])},${f1(v.m[1])}) rotate(${f1(v.ang - 90)})`}>
          <rect x={-v.w / 2} y={-4.4} width={v.w} height={8.8} rx={3} fill={colour(r)} stroke="#6b5a35" strokeWidth={1.2} />
          {r !== 3 && <path d={`M${v.w / 2 - 2},0L${v.w / 2 + 13},5`} stroke={colour(r)} strokeWidth={4} strokeLinecap="round" />}
        </g>
      ));
  // the trunk round the column: a thin layer behind it, the body in front
  const trunk = [...P.map((_, i) => along(i, 22)), ...P.map((_, i) => along(i, -DEPTH(i))).reverse()];
  const top = P[0];
  const up = tan(0);
  const headC: Pt = [top[0] - up[0] * 46 - back(0)[0] * 28, top[1] - up[1] * 46 - back(0)[1] * 28];
  const mid = (r: number) => {
    const ids = verts.map((v, i) => (v.r === r ? i : -1)).filter((i) => i >= 0);
    return ids[Math.floor(ids.length / 2)];
  };
  const tag = (r: number, d = 26) => {
    const p = along(mid(r), d);
    return { ax: p[0], ay: p[1] };
  };
  const ground = Math.max(...trunk.map((q) => q[1])) + 2;
  // Intervertebral discs between the bodies.
  const discs = verts.slice(0, -1).map((v, i) => {
    const n = verts[i + 1];
    return { m: [(v.m[0] + n.m[0]) / 2, (v.m[1] + n.m[1]) / 2] as Pt, ang: (v.ang + n.ang) / 2, w: Math.min(v.w, n.w) - 4, r: v.r };
  });
  const pose = [
    { text: 'Fetua: makurdura bakarra (C itxura)', on: 1 - head },
    { text: 'Haurra burua altxatzen', on: head * (1 - walk) },
    { text: 'Haurra ibiltzen', on: walk },
  ];
  return (
    <g>
      <Defs8 />
      <rect x={0} y={0} width={1000} height={640} fill="#0f0f11" />
      <defs>
        <radialGradient id={`w8-curv-body${cid}`} cx="40%" cy="35%" r="75%">
          <stop offset="0" stopColor="#4a3f52" />
          <stop offset="1" stopColor="#221c28" />
        </radialGradient>
      </defs>
      {/* The floor the baby lies on. */}
      <path d={`M150,${f1(ground)}H850`} stroke="#5b5360" strokeWidth={2} opacity={lie} />
      <path d={smoothPath(trunk, true, 0.2)} fill={`url(#w8-curv-body${cid})`} stroke={Q.greyEdge} strokeWidth={2} />
      <circle cx={headC[0]} cy={headC[1]} r={50} fill={`url(#w8-curv-body${cid})`} stroke={Q.greyEdge} strokeWidth={2} />
      {discs.map((d, i) => (
        <g key={i} transform={`translate(${f1(d.m[0])},${f1(d.m[1])}) rotate(${f1(d.ang - 90)})`}>
          <rect x={-d.w / 2} y={-2.4} width={d.w} height={4.8} rx={2} fill={Q.suture} opacity={0.75} />
        </g>
      ))}
      <Part id="zifosia" show={kyLit > 0.01 ? 1 : 0}>
        {piece(1)}
        {piece(3)}
      </Part>
      {kyLit <= 0.01 && (
        <>
          {piece(1)}
          {piece(3)}
        </>
      )}
      {head > 0.01 ? <Part id="lordosia">{piece(0)}</Part> : piece(0)}
      {walk > 0.01 ? <Part id="lordosia">{piece(2)}</Part> : piece(2)}

      {pose.map((p) => (
        <Note key={p.text} x={260} y={50} size={12.5} show={p.on}>
          {p.text}
        </Note>
      ))}
      <Note x={260} y={28} size={12.5} tone="accent">
        Bizkarrezurra alboetatik (ezkerrean aurrea, eskuinean atzea)
      </Note>
      <Note x={500} y={612} tone="accent" show={vis(t, BZ_T.kypho, BZ_T.lordo)}>
        Zifosia (makurdura primarioa): jaio aurretik, atzerantz ganbila; bizkarrekoa eta sakroarena
      </Note>
      <Note x={500} y={612} tone="accent" show={vis(t, BZ_T.lordo)}>
        Lordosia (sekundarioa): jaio ondoren, lepokoa burua altxatzean eta gerrikoa ibiltzean
      </Note>

      <Label id="lordosia" text="Lordosia (lepokoa)" x={740} y={150} {...tag(0, 20)} show={head} />
      <Label id="zifosia" text="Zifosia (bizkarrekoa)" x={810} y={270} {...tag(1)} show={kyLit} />
      <Label id="lordosia" text="Lordosia (gerrikoa)" x={810} y={420} {...tag(2)} show={walk} />
      <Label id="zifosia" text="Zifosia (sakroa)" x={810} y={520} {...tag(3, 16)} show={kyLit} />
    </g>
  );
}
