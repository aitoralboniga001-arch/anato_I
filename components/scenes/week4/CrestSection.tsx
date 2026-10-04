'use client';

import { C, Destination, Label, Mark, Note, Part, clamp, lerp, seg, type Pt, type SceneProps } from '@/components/kit';
import type { ReactNode } from 'react';
import { CrestCell, Route, along, spline } from './crestRoute';
import { K, NS, NeuruDrawing, SX, TE, crestCells, neuruGeo, type NeuruGeo, type NeuruParams } from './NeuruSection';

/**
 * Stage `gandor-neurala`, transverse view — the same trunk section as the `neurulazioa` stage
 * (NeuruSection: same tube, ectoderm, somites, notochord, aortae), magnified on its dorsal half.
 * Beats: .00 the folds fuse and the crest cells at their rims go from epithelium to mesenchyme
 * (tall packed cells → free cells with processes) and gather over the tube · .18 dorsolateral
 * route, under the surface ectoderm, into the epidermis → melanocytes · .30 ventral route, past the
 * medial side of the somite, → spinal (dorsal root) ganglion and, deeper, sympathetic ganglion by
 * the aorta. Crest cells stay teal throughout; each route's line is in its destination's colour.
 * Every change ends before the step's complete frame (next beat − 0.035).
 */

const GOLD = '#ffba72';
const TEAL = C.neuralCrest;
const VTEAL = '#5eead4';
const MELANIN = '#7a3f22';

/**
 * Camera: close on the fold rims for the transition (the cells must be big enough to see them change
 * shape and let go), then out to the dorsal half of the section for the two routes.
 */
function camera(t: number) {
  const e = seg(t, 0.18, 0.2);
  const s = lerp(2.35, 1.3, e);
  const fy = lerp(178, 100, e);
  const ty = lerp(300, 105, e);
  const Z = (q: Pt): Pt => [500 + s * (q[0] - 500), ty + s * (q[1] - fy)];
  return { view: `translate(500 ${ty.toFixed(2)}) scale(${s.toFixed(4)}) translate(-500 ${(-fy).toFixed(2)})`, ZX: (q: Pt): Pt => Z(SX(q)), U: 1 / s, wide: e };
}

function params(t: number): NeuruParams {
  return { plate: 1, groove: 1, folds: 1, close: lerp(0.8, 1, seg(t, 0, 0.05)), detach: seg(t, 0.05, 0.12), oval: seg(t, 0.05, 0.13), somite: 1 };
}

const part = (id: string, node: ReactNode, show = 1) => (
  <Part id={id} show={show}>
    {node}
  </Part>
);

// Timing. Dorsolateral cell k (0..4); ventral cell j (0..4: three to the spinal ganglion, two deeper).
const DL0 = 0.192;
const V0 = 0.306;
const dlStart = (k: number) => DL0 + 0.006 * k;
const dlU = (k: number, t: number) => seg(t, dlStart(k), dlStart(k) + 0.036);
const melK = (k: number, t: number) => seg(t, dlStart(k) + 0.033, dlStart(k) + 0.045);
const vStart = (j: number) => V0 + 0.012 * j;
const vU = (j: number, t: number) => seg(t, vStart(j), vStart(j) + 0.08);
const DRG: Pt = [47, 6];
const SYMP: Pt = [58, 90];
const drgOn = (t: number) => seg(t, 0.39, 0.42);
const sympOn = (t: number) => seg(t, 0.425, 0.452);
const melX = (k: number) => 72 + 17 * k;

/** The dorsolateral route (right side, disc space): under the ectoderm, then up into it. */
function dlPath(g: NeuruGeo, from: Pt, xEnd: number): Pt[] {
  const eu = g.ectoUnder;
  const pts: Pt[] = [from, [28, eu(28) + 6], [52, eu(52) + 6]];
  for (let x = 72; x < xEnd - 6; x += 18) pts.push([x, eu(x) + 5.5]);
  pts.push([xEnd, eu(xEnd) + 3], [xEnd + 3, eu(xEnd) - 3]);
  return spline(pts, 6);
}
/** The ventral route: down beside the tube, past the somite's medial edge; to the spinal ganglion or deeper. */
function vPath(g: NeuruGeo, from: Pt, j: number): Pt[] {
  const top = g.roofBasal;
  const head: Pt[] = [from, [26, top + 10], [37, -26]];
  if (j < 3) return spline([...head, [[46, -4], [42, 8], [51, 15]][j] as Pt], 8);
  return spline([...head, [49, 2], [60, 34], [63, 58], [[54, 88], [62, 92]][j - 3] as Pt], 8);
}

function Melanocyte({ at, ang, grow }: { at: Pt; ang: number; grow: number }) {
  const s = K;
  const den = [
    [-6, -5.5],
    [-2, -7.5],
    [3, -7],
    [6.5, -3.5],
  ];
  return (
    <g transform={`translate(${at[0].toFixed(1)} ${at[1].toFixed(1)}) rotate(${ang.toFixed(1)})`}>
      {den.map(([x, y], i) => (
        <path key={i} d={`M0,0Q${(x * 0.3 * s * grow).toFixed(1)},${(y * 0.7 * s * grow).toFixed(1)} ${(x * s * grow).toFixed(1)},${(y * s * grow).toFixed(1)}`} fill="none" stroke={GOLD} strokeWidth={1.2} strokeLinecap="round" opacity={0.95} />
      ))}
      <ellipse rx={3.6 * s} ry={2.6 * s} fill={MELANIN} stroke={GOLD} strokeWidth={0.9} />
      {[[-1.8, 0.8], [1.6, -0.6], [0.4, 1.3], [-0.6, -1]].map(([x, y], i) => (
        <circle key={i} cx={x * s} cy={y * s} r={0.5 * s} fill="#2a1206" />
      ))}
    </g>
  );
}

function Ganglion({ c, rx, ry, n, show }: { c: Pt; rx: number; ry: number; n: number; show: number }) {
  if (show <= 0.02) return null;
  const P = SX(c);
  return (
    <g opacity={show}>
      <ellipse cx={P[0]} cy={P[1]} rx={rx * K} ry={ry * K} fill={TEAL} fillOpacity={0.24} stroke={VTEAL} strokeWidth={1.1} />
      {Array.from({ length: n }, (_, i) => {
        const a = (i / n) * Math.PI * 2 + 0.4;
        const r = n > 4 ? (i % 2 ? 0.58 : 0.3) : 0.42;
        const x = P[0] + Math.cos(a) * rx * K * r;
        const y = P[1] + Math.sin(a) * ry * K * r;
        return (
          <g key={i}>
            <circle cx={x} cy={y} r={2.3 * K} fill="#1f9e8f" stroke={VTEAL} strokeWidth={0.6} />
            <circle cx={x} cy={y} r={0.9 * K} fill="#0f4f49" />
          </g>
        );
      })}
    </g>
  );
}

type CellNow = { q: Pt; ang: number; mes: number; route: 'dl' | 'v'; sd: 1 | -1; k: number; u: number };

export function CrestSection({ t }: SceneProps) {
  const g = neuruGeo(params(t));
  const { view, ZX, U, wide } = camera(t);
  const tube = g.p.close > 0.9;
  const appear = seg(t, 0.01, 0.04);
  const gather = g.p.detach;
  // Weights of the three phases (EMT · dorsolateral · ventral), cross-faded right after each beat.
  const m1in = seg(t, 0.18, 0.195);
  const m2 = seg(t, 0.3, 0.315);
  const m = [1 - m1in, m1in * (1 - m2), m2];
  // Sentences swap without overlapping: the old one leaves before the new one arrives.
  const n1 = seg(t, 0.188, 0.198);
  const n2 = seg(t, 0.308, 0.318);
  const noteW = [1 - seg(t, 0.18, 0.187), n1 * (1 - seg(t, 0.3, 0.307)), n2];
  const dimD = lerp(1, 0.45, m2);
  const dimV = 1 - 0.5 * m[1];
  const drg = drgOn(t);
  const symp = sympOn(t);
  // Contacts between the epithelial cells, lost during the transition.
  const contact = 1 - seg(t, 0.045, 0.1);
  const mesAll = seg(t, 0.055, 0.12);

  // Where each cell gathers over the tube (w4a's crest layout, fully gathered).
  const pooled = crestCells(g, appear, 1, 0, 10);
  const mir = (q: Pt, sd: number): Pt => (sd > 0 ? q : [-q[0], q[1]]);
  const cells: CellNow[] = pooled.map((c, n) => {
    const idx = n % 10;
    const sd = c.side;
    // Before leaving, each cell is part of the fold-rim neuroepithelium: tall, apicobasal, two staggered rows.
    const ia = NS - 1 - Math.round(idx * 1.6);
    const depth = idx % 2 ? 0.68 : 0.32;
    const aE: Pt = [lerp(g.ap[ia][0], g.bas[ia][0], depth), lerp(g.ap[ia][1], g.bas[ia][1], depth)];
    const nAng = (Math.atan2(g.bas[ia][1] - g.ap[ia][1], g.bas[ia][0] - g.ap[ia][0]) * 180) / Math.PI;
    const pool: Pt = [Math.abs(c.q[0]), c.q[1] + 1.5];
    const b: Pt = [lerp(aE[0], pool[0], gather), lerp(aE[1], pool[1], gather)];
    const dl = idx % 2 === 0;
    const k = idx >> 1;
    const u = dl ? dlU(k, t) : vU(k, t);
    const path = dl ? dlPath(g, b, melX(k)) : vPath(g, b, k);
    const { p, ang } = along(path, u);
    const tall = sd > 0 ? nAng - 90 : 90 - nAng;
    const restAng = mesAll < 0.5 ? tall * (1 - gather) : sd > 0 ? 0 : 180;
    const moving = u > 0.005 && u < 0.995;
    return { q: mir(u > 0 ? p : b, sd), ang: moving ? (sd > 0 ? ang : 180 - ang) : restAng, mes: moving ? 1 : mesAll, route: dl ? 'dl' : 'v', sd, k, u };
  });

  const midOf = (i: number, sd: number): Pt => mir([(g.ap[i][0] + g.bas[i][0]) / 2, (g.ap[i][1] + g.bas[i][1]) / 2], sd);
  const foldAt = (sd: number) => midOf(NS - 6, sd);
  const sides = [-1, 1] as const;

  // The lead cell of each route draws the route ahead of the others.
  const pool: Pt = [10, g.roofBasal - 6];
  const dlMain = dlPath(g, pool, melX(4) + 8);
  const vDrg = vPath(g, pool, 1);
  const vSym = vPath(g, pool, 4);
  const toScreen = (pts: Pt[], sd: number) => pts.map((q) => SX(mir(q, sd)));
  const dlProg = seg(t, DL0, DL0 + 0.044);
  const vProgA = seg(t, V0, V0 + 0.07);
  const vProgB = seg(t, V0 + 0.02, V0 + 0.115);

  const over = (
    <g>
      {/* The folds: lit where they meet and the crest cells leave them. */}
      {sides.map((sd) => {
        const f = SX(foldAt(sd));
        return <Mark key={sd} id="tolesdura-neuralak" x={f[0]} y={f[1]} rx={22} show={0.9 * m[0]} />;
      })}

      {/* Where each route leads, softly lit while the cells travel. */}
      {sides.map((sd) => {
        const d = SX(mir(DRG, sd));
        const s = SX(mir(SYMP, sd));
        return (
          <g key={sd}>
            {[0, 1, 2, 3, 4].map((k) => {
              const e = SX(mir([melX(k), g.ectoUnder(melX(k)) - 3], sd));
              return <Destination key={k} x={e[0] - 6 * K} y={e[1] - 4 * K} w={12 * K} h={8 * K} color={GOLD} oval show={seg(t, 0.194, 0.205) * (1 - melK(k, t))} />;
            })}
            <Destination x={d[0] - 11 * K} y={d[1] - 16 * K} w={22 * K} h={32 * K} color={VTEAL} oval show={seg(t, 0.31, 0.33) * (1 - drg)} />
            <Destination x={s[0] - 9 * K} y={s[1] - 8 * K} w={18 * K} h={16 * K} color={VTEAL} oval show={seg(t, 0.31, 0.33) * (1 - symp)} />
          </g>
        );
      })}

      {/* Ganglia form where the ventral cells settle; the spinal ganglion's root runs to the tube. */}
      {part(
        'gongoil-errakideoak',
        <g>
          {sides.map((sd) => {
            const r0 = SX(mir([42, -9], sd));
            const r1 = SX(mir([33, -22], sd));
            return (
              <g key={sd}>
                <path d={`M${r0[0].toFixed(1)},${r0[1].toFixed(1)}L${r1[0].toFixed(1)},${r1[1].toFixed(1)}`} stroke={VTEAL} strokeWidth={1.8} strokeLinecap="round" opacity={0.8 * drg} />
                <Ganglion c={mir(DRG, sd)} rx={9} ry={14} n={7} show={drg} />
              </g>
            );
          })}
        </g>,
        drg,
      )}
      {part(
        'gongoil-sinpatikoak',
        <g>
          {sides.map((sd) => (
            <Ganglion key={sd} c={mir(SYMP, sd)} rx={7.5} ry={6} n={4} show={symp} />
          ))}
        </g>,
        symp,
      )}

      {/* The two routes: persistent lines in the destination colour, each ending in an arrowhead. */}
      {sides.map((sd) => (
        <g key={sd}>
          <Route pts={toScreen(dlMain, sd)} color={GOLD} progress={dlProg} width={2.6} u={U} head={10} show={dimD * (1 - 0.35 * m2)} />
          <Route pts={toScreen(vDrg, sd)} color={VTEAL} progress={vProgA} width={2.6} u={U} head={10} show={dimV} />
          <Route pts={toScreen(vSym, sd)} color={VTEAL} progress={vProgB} width={2.6} u={U} head={10} show={dimV} />
        </g>
      ))}

      {/* Melanocytes: dorsolateral cells settled in the epidermis. */}
      {part(
        'melanozitoak',
        <g opacity={dimD}>
          {cells
            .filter((c) => c.route === 'dl')
            .map((c, i) => {
              const w = melK(c.k, t);
              if (w <= 0.02) return null;
              const x = melX(c.k);
              const eu = g.ectoUnder;
              const ang = (Math.atan2(eu(x + 3) - eu(x - 3), 6) * 180) / Math.PI;
              return (
                <g key={i} opacity={w}>
                  <Melanocyte at={SX(mir([x, eu(x) - 3], c.sd))} ang={c.sd > 0 ? ang : -ang} grow={0.4 + 0.6 * w} />
                </g>
              );
            })}
        </g>,
        seg(t, dlStart(0) + 0.033, dlStart(0) + 0.045),
      )}

      {/* Contacts between neighbouring crest cells while they are still an epithelium. */}
      {contact > 0.02 && appear > 0.02 && (
        <g opacity={contact * appear} stroke="#d1fff6" strokeWidth={1.4 * U} strokeLinecap="round">
          {sides.map((sd) => {
            const row = cells.filter((c) => c.sd === sd).map((c) => SX(c.q));
            return row.slice(1).map((q, i) => {
              const p = row[i];
              const mx = (p[0] + q[0]) / 2;
              const my = (p[1] + q[1]) / 2;
              const d = Math.hypot(q[0] - p[0], q[1] - p[1]);
              if (d > 16) return null;
              const nx = -(q[1] - p[1]) / (d || 1);
              const ny = (q[0] - p[0]) / (d || 1);
              return <path key={`${sd}${i}`} d={`M${(mx - nx * 3).toFixed(1)},${(my - ny * 3).toFixed(1)}L${(mx + nx * 3).toFixed(1)},${(my + ny * 3).toFixed(1)}`} />;
            });
          })}
        </g>
      )}

      {/* Neural crest cells: tall epithelial cells in the fold rim → free mesenchymal cells → travellers. Always teal. */}
      {appear > 0.01 &&
        part(
          'gandor-neurala',
          <g>
            {cells.map((c, i) => {
              const [X, Y] = SX(c.q);
              const gone = c.route === 'dl' ? melK(c.k, t) : 0;
              if (gone > 0.98) return null;
              const o = (c.route === 'dl' ? dimD : dimV) * (1 - gone);
              return <CrestCell key={i} x={X} y={Y} ang={c.ang} mes={c.mes} s={K * lerp(0.62, 0.86, clamp(c.u * 6))} color={TEAL} opacity={o} />;
            })}
          </g>,
          appear,
        )}
    </g>
  );

  // Labels (outside the magnified group): anchors mapped through the same magnification.
  const pick = (route: 'dl' | 'v', k: number) => cells.find((c) => c.sd > 0 && c.route === route && c.k === k)?.q ?? pool;
  // The name follows cells that are still crest cells: the rim / pool, a dorsolateral traveller while it
  // travels, then the ventral stream (which waits in the pool until its own step).
  const dlLast = cells.find((c) => c.sd > 0 && c.route === 'dl' && c.k === 4);
  const travelling = dlLast && dlLast.u > 0.02 && dlLast.u < 0.9;
  const crestA = [pick('dl', 0), travelling ? dlLast.q : pick('v', 1)].map(ZX);
  const crest: Pt = [0, 1].map((i) => crestA[0][i] * m[0] + crestA[1][i] * (1 - m[0])) as Pt;
  const crestV = ZX(along(vSym, 0.55).p);
  const fold = ZX(foldAt(-1));
  const ex = lerp(66, 118, wide);
  const ecto = ZX([-ex, g.ectoUnder(ex) - TE / 2]);
  const wall = ZX(midOf(NS >> 1, -1));
  const noto = ZX([-6, g.noto[1] + 4]);
  const mel = ZX([melX(3), g.ectoUnder(melX(3)) - 3]);
  const drgA = ZX([DRG[0] + 5, DRG[1]]);
  const sympA = ZX([SYMP[0] + 4, SYMP[1]]);
  const som = ZX([128, g.somC[1] + 6]);
  const ao = ZX([48, g.aorta[1] + 2]);
  return (
    <g>
      <NeuruDrawing g={g} part={part} plateId="hodi-neurala" foldId="hodi-neurala" tube={tube} aortaShow={1} over={over} view={view} amnion={false} />
      <Label id="tolesdura-neuralak" x={204} y={108} ax={fold[0]} ay={fold[1]} show={m[0]} small />
      <Label id="azaleko-ektodermoa" x={204} y={166} ax={ecto[0]} ay={ecto[1]} small />
      <Label id="hodi-neurala" x={204} y={240} ax={wall[0]} ay={wall[1]} small />
      <Label id="notokorda" x={204} y={420} ax={noto[0]} ay={noto[1]} show={wide} small />
      <Label id="gandor-neurala" x={796} y={103} ax={crest[0]} ay={crest[1]} show={appear * (1 - m2)} small />
      <Label id="gandor-neurala" x={796} y={354} ax={crestV[0]} ay={crestV[1]} show={m2} small />
      <Label id="melanozitoak" x={796} y={175} ax={mel[0]} ay={mel[1]} show={melK(3, t) * dimD} small />
      <Label id="gongoil-errakideoak" x={796} y={262} ax={drgA[0]} ay={drgA[1]} show={drg} small />
      <Label id="somitak" x={796} y={392} ax={som[0]} ay={som[1]} show={wide} small />
      <Label id="gongoil-sinpatikoak" x={796} y={455} ax={sympA[0]} ay={sympA[1]} show={symp} small />
      <Label id="aorta-dortsalak" x={796} y={528} ax={ao[0]} ay={ao[1]} show={0.7 * m[2]} small />
      {[
        ['01 · Ertzetik askatu', 'Trantsizio epitelio-mesenkimatikoa: loturak galdu eta zelula libre, migratzaile bihurtu', 'Tolesdura neuralen ertzak → gandor neurala → migrazioa'],
        ['02 · Bide dortsolaterala (laranja)', 'Azaleko ektodermopean → epidermisa: melanozitoak', 'Apunteak: epidermisean melanozitoak, ile-folikuluak eta azazkalak'],
        ['03 · Bide bentrala (turkesa)', 'Hodi neuralaren eta somiten artetik → gongoil errakideoak eta sinpatikoak', 'Enborreko ebaki eskematikoa; gainerako eratorriak hurrengo ikuspegian'],
      ].map(([title, main, sub], i) => (
        <g key={title}>
          <Note x={500} y={57} tone="accent" size={16} show={noteW[i]}>
            {title}
          </Note>
          <Note x={500} y={574} tone="accent" size={16} show={noteW[i]}>
            {main}
          </Note>
          <Note x={500} y={602} tone="dim" size={15} show={noteW[i]}>
            {sub}
          </Note>
        </g>
      ))}
    </g>
  );
}

