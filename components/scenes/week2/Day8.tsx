'use client';

import { C, Arrow, CellBand, Journey, Label, Note, Part, ellipseArc, lerp, lin, mix, seg, smoothPath, zoom, type Pt, type SceneProps } from '@/components/kit';
import { CYTO, EPI_TOP, Endometrium, INNER, R, TrapBand, W2, chord, discGeometry, f1, lensPath, synTh8, type DiscGeo } from './common';
import { CellRing, SynFill } from './materials';

/**
 * 8. eguna — blastocyst partially embedded (abembryonic third still in the uterine lumen).
 * Windows (each ends before its step's finished frame, next beat − 0.035):
 *   .00–.10 the trophoblast splits: the syncytium grows out of the cyto at the embryonic pole
 *   .12–.20 cyto cells divide, a daughter migrates into the syncytium and loses its membrane (camera close)
 *   .24–.36 embryoblast cells sort into two layers: tall blue epiblast, small yellow cuboidal hypoblast
 *   .47–.52 vacuoles between the epiblast cells · .51–.58 they merge into the amniotic cavity, cells part
 *   .62–.70 the epiblast cells left against the cyto flatten: amnioblasts
 *   .74–.86 oedematous endometrium (fluid between cells, dilated vessels, glands secrete)
 *   .88–.96 dorso-ventral polarity
 *
 * Disc geometry (relative to the blastocyst centre): the dorsal (amniotic) side faces the embryonic
 * pole, the deepest point in the stroma; the disc and the amnion fill the pole wall-to-wall and the
 * blastocele is only ventral to the hypoblast.
 */
export const W = {
  syn: [0, 0.1],
  divide: [0.12, 0.2],
  disc: [0.24, 0.36],
  vacuoles: [0.47, 0.52],
  cavity: [0.51, 0.58],
  part: [0.5, 0.6],
  amnion: [0.62, 0.7],
  endo: [0.74, 0.86],
  polarity: [0.88, 0.96],
} as const;
const s = (t: number, w: readonly [number, number]) => seg(t, w[0], w[1]);
const rad = (d: number) => (d * Math.PI) / 180;

function geometry(t: number) {
  return discGeometry(W2.cx, lerp(478, 466, seg(t, 0, 1)));
}
type Geo = DiscGeo;

const synGrow = (t: number) => lerp(0.12, 1, s(t, W.syn));

function syncytioPath(cx: number, cy: number, grow: number) {
  const outer: Pt[] = [];
  const inner: Pt[] = [];
  for (let a = 160; a <= 380; a += 2.5) {
    const r = R + synTh8(a, grow);
    outer.push([cx + r * Math.cos(rad(a)), cy + r * Math.sin(rad(a))]);
    inner.push([cx + (R - 0.5) * Math.cos(rad(a)), cy + (R - 0.5) * Math.sin(rad(a))]);
  }
  return `${smoothPath(outer, false)}${inner
    .reverse()
    .map((p) => `L${f1(p[0])},${f1(p[1])}`)
    .join('')}Z`;
}

/** A point inside the syncytium at angle a, `frac` of its thickness out from the cyto. */
function synAt(t: number, a: number, frac: number): Pt {
  const { cx, cy } = geometry(t);
  const r = R + frac * synTh8(a, synGrow(t));
  return [cx + r * Math.cos(rad(a)), cy + r * Math.sin(rad(a))];
}

// ---------------------------------------------------------------------------------------------
// Cells of the embryoblast: one set of cells that sorts into the disc and the epiblast mass above it.

interface Slot {
  x: number;
  y: number;
  w: number;
  h: number;
  kind: 'epi' | 'hypo' | 'lens';
}

/** Final places: hypoblast row, epiblast row, and the epiblast cells filling the pole above the disc. */
function slots(g: Geo): Slot[] {
  const { cx, cy, epiTop, discY, hypoBottom, wEpiTop, wDisc, wHypo } = g;
  const out: Slot[] = [];
  const NH = 17;
  const NE = 15;
  for (let j = 0; j < NH; j++) {
    const w = (wDisc + wHypo) / 2;
    out.push({ x: cx - w + (2 * w * (j + 0.5)) / NH, y: (discY + hypoBottom) / 2, w: (2 * w) / NH, h: hypoBottom - discY, kind: 'hypo' });
  }
  for (let j = 0; j < NE; j++) {
    const w = (wEpiTop + wDisc) / 2;
    out.push({ x: cx - w + (2 * w * (j + 0.5)) / NE, y: (epiTop + discY) / 2, w: (2 * w) / NE, h: discY - epiTop, kind: 'epi' });
  }
  for (let row = 0; ; row++) {
    const y = cy - INNER + 9 + row * 11;
    if (y > epiTop - 4) break;
    const half = chord(y - cy) - 7;
    const count = Math.max(1, Math.floor((2 * half) / 12) + 1);
    for (let i = 0; i < count; i++) out.push({ x: count === 1 ? cx : cx - half + (2 * half * i) / (count - 1), y, w: 11.2, h: 11.2, kind: 'lens' });
  }
  return out;
}

/** Where each cell sits in the undivided inner cell mass: drawn towards the middle of the pole cap, round. */
function startOf(g: Geo, sl: Slot, i: number): Pt {
  const mx = g.cx;
  const my = (g.cy - INNER + g.hypoBottom) / 2;
  const j = Math.sin(i * 12.9898) * 0.5;
  return [mx + (sl.x - mx) * 0.84 + j * 3, my + (sl.y - my) * 0.78 + Math.cos(i * 7.3) * 2.5];
}

const AMNION_N = 14;
const edgeDeg = (Math.asin(-EPI_TOP / INNER) * 180) / Math.PI;
/** Slot k of the amnioblast layer (on the cyto's inner face, over the amniotic cavity). */
function amnionSlot(g: Geo, k: number): Pt {
  const a = 180 + edgeDeg + ((360 - 2 * edgeDeg - 180) * (k + 0.5)) / AMNION_N;
  const r = INNER - 2.6;
  return [g.cx + r * Math.cos(rad(a)), g.cy + r * Math.sin(rad(a))];
}

/** Lens cells → which ones become amnioblasts (the ones nearest each slot), the rest join the epiblast. */
function lensFates(g: Geo, lens: Slot[]) {
  const taken = new Set<number>();
  const toAmnion = new Map<number, number>();
  for (let k = 0; k < AMNION_N; k++) {
    const [ax, ay] = amnionSlot(g, k);
    let best = -1;
    let bd = Infinity;
    lens.forEach((c, i) => {
      if (taken.has(i)) return;
      const d = Math.hypot(c.x - ax, c.y - ay);
      if (d < bd) {
        bd = d;
        best = i;
      }
    });
    if (best >= 0) {
      taken.add(best);
      toAmnion.set(best, k);
    }
  }
  return toAmnion;
}

const COLORS = { epi: C.epiblast, hypo: C.hypoblast, lens: '#6f9cf2' } as const;

function EmbryoblastCells({ g, t }: { g: Geo; t: number }) {
  const disc = s(t, W.disc);
  const part = s(t, W.part);
  const flatten = s(t, W.amnion);
  const all = slots(g);
  const lens = all.filter((c) => c.kind === 'lens');
  const fates = lensFates(g, lens);
  const epiTopY = g.epiTop;
  // Before and during the sorting: every cell is drawn as a morphing rounded block.
  if (disc < 0.999) {
    return (
      <Part id={disc < 0.5 ? 'enbrioblastoa' : 'epiblastoa'}>
        {all.map((sl, i) => {
          const [sx, sy] = startOf(g, sl, i);
          const k = seg(disc, (i % 7) * 0.03, 0.8 + (i % 7) * 0.03);
          const r0 = 6.9;
          const w = lerp(r0 * 2, sl.kind === 'lens' ? 11.2 : sl.w - 0.6, k);
          const h = lerp(r0 * 2, sl.kind === 'lens' ? 11.2 : sl.h - 0.6, k);
          const x = lerp(sx, sl.x, k);
          const y = lerp(sy, sl.y, k);
          const rr = lerp(r0, sl.kind === 'lens' ? 5.6 : 1.6, k);
          const col = mix(C.embryoblast, COLORS[sl.kind], k);
          const ny = sl.kind === 'epi' ? lerp(y, y + h * 0.14, k) : y;
          return (
            <g key={i}>
              <rect x={f1(x - w / 2)} y={f1(y - h / 2)} width={f1(w)} height={f1(h)} rx={f1(rr)} fill={col} stroke="rgba(10,14,28,0.5)" strokeWidth={0.8} />
              <rect x={f1(x - w / 2)} y={f1(y - h / 2)} width={f1(w)} height={f1(h)} rx={f1(rr)} fill="url(#w2-g-cell)" />
              <ellipse cx={f1(x)} cy={f1(ny)} rx={f1(lerp(2.6, Math.min(sl.w * 0.24, 3), k))} ry={f1(lerp(2.6, sl.kind === 'epi' ? 4.4 : 2.4, k))} fill="rgba(20,24,40,0.55)" />
            </g>
          );
        })}
      </Part>
    );
  }
  return (
    <>
      {/* Epiblast cells filling the pole: as the cavity opens they part — the ones against the cyto stay there
          (future amnioblasts), the others settle onto the epiblast. */}
      <Part id={part > 0.5 && flatten > 0.5 ? 'amnioblastoak' : 'epiblastoa'}>
        {lens.map((c, i) => {
          const k = fates.get(i);
          if (k === undefined) {
            // Retreats onto the epiblast and merges into it.
            const m = seg(part, 0.05, 0.85);
            if (m > 0.98) return null;
            const x = lerp(c.x, Math.max(g.cx - g.wEpiTop + 6, Math.min(g.cx + g.wEpiTop - 6, c.x)), m);
            const y = lerp(c.y, epiTopY + 2, m);
            return <Cell8 key={i} x={x} y={y} rx={5.6 * (1 - 0.5 * m)} ry={5.6 * (1 - 0.6 * m)} color="#6f9cf2" opacity={1 - seg(m, 0.6, 1)} />;
          }
          if (flatten > 0.98) return null;
          const [ax, ay] = amnionSlot(g, k);
          const m = seg(part, 0, 0.9);
          const a = Math.atan2(ay - g.cy, ax - g.cx) * (180 / Math.PI) + 90;
          return <Cell8 key={i} x={lerp(c.x, ax, m)} y={lerp(c.y, ay, m)} rx={lerp(5.6, 6.4, flatten)} ry={lerp(5.6, 2.6, flatten)} rot={a * m} color={mix('#6f9cf2', C.amnioblast, flatten)} />;
        })}
      </Part>
      <Part id="amnioblastoak" show={seg(flatten, 0.85, 1)}>
        <CellBand curve={ellipseArc(g.cx, g.cy, INNER, INNER, 180 + edgeDeg, 360 - edgeDeg)} n={AMNION_N} thickness={5.2} color={C.amnioblast} shape="squamous" inward />
      </Part>
      <Part id="epiblastoa">
        <TrapBand cx={g.cx} yTop={g.epiTop} yBottom={g.discY} wTop={g.wEpiTop} wBottom={g.wDisc} n={15} color={C.epiblast} shape="columnar" />
      </Part>
      <Part id="hipoblastoa">
        <TrapBand cx={g.cx} yTop={g.discY} yBottom={g.hypoBottom} wTop={g.wDisc} wBottom={g.wHypo} n={17} color={C.hypoblast} shape="cuboidal" />
      </Part>
    </>
  );
}

function Cell8({ x, y, rx, ry, rot = 0, color, opacity = 1 }: { x: number; y: number; rx: number; ry: number; rot?: number; color: string; opacity?: number }) {
  return (
    <g opacity={opacity} transform={rot ? `rotate(${f1(rot)} ${f1(x)} ${f1(y)})` : undefined}>
      <ellipse cx={f1(x)} cy={f1(y)} rx={f1(rx)} ry={f1(ry)} fill={color} stroke="rgba(10,14,28,0.5)" strokeWidth={0.8} />
      <ellipse cx={f1(x)} cy={f1(y)} rx={f1(rx)} ry={f1(ry)} fill="url(#w2-g-cell)" />
      <ellipse cx={f1(x)} cy={f1(y)} rx={f1(rx * 0.42)} ry={f1(ry * 0.42)} fill="rgba(20,24,40,0.5)" />
    </g>
  );
}

// ---------------------------------------------------------------------------------------------
// Cytotrophoblast cells that divide and feed the syncytium.

const FEEDERS = [214, 238, 262, 286, 310, 334];

function feeder(t: number, i: number) {
  const g = geometry(t);
  const a = FEEDERS[i];
  const p = lin(t, W.divide[0] + i * 0.0085, W.divide[0] + 0.036 + i * 0.0085);
  const r0 = R - CYTO / 2;
  const split = seg(p, 0, 0.3);
  const go = seg(p, 0.3, 0.66);
  const fuse = seg(p, 0.66, 1);
  const rTarget = R + 0.42 * synTh8(a, synGrow(t)) * (0.85 + 0.3 * Math.sin(i * 2.3));
  const at = (r: number, da = 0): Pt => [g.cx + r * Math.cos(rad(a + da)), g.cy + r * Math.sin(rad(a + da))];
  const rNow = lerp(r0 + 7 * split, rTarget, go);
  return { a, p, split, go, fuse, inner: at(r0), outer: at(rNow, 2 * go), r0, rNow, at };
}

function Feeders({ t }: { t: number }) {
  // The fused nuclei keep a soft halo, and the routes stay, until the step is over: the finished frame shows what happened.
  const after = 1 - seg(t, 0.236, 0.27);
  return (
    <g>
      {FEEDERS.map((_, i) => {
        const f = feeder(t, i);
        if (f.p <= 0) return null;
        const cell = 6.2;
        const route: Pt[] = Array.from({ length: 12 }, (_, k) => f.at(lerp(f.r0 + 7, f.rNow, k / 11), 2 * f.go * (k / 11)));
        const nucleus = (
          <ellipse cx={f1(f.outer[0])} cy={f1(f.outer[1])} rx={f1(lerp(2.4, 3, f.fuse))} ry={f1(lerp(2.4, 2.3, f.fuse))} fill={mix('#1f5a37', C.syncytioDeep, f.fuse)} transform={`rotate(${f1(f.a + 90)} ${f1(f.outer[0])} ${f1(f.outer[1])})`} />
        );
        if (f.fuse >= 1) {
          if (after <= 0.01) return <g key={i}>{nucleus}</g>;
          return (
            <g key={i}>
              <Journey pts={route} color="#b6f0c4" show={0.75 * after} head={0} route={0.8} width={1.6} r={4} />
              <circle cx={f1(f.outer[0])} cy={f1(f.outer[1])} r={7.5} fill="url(#w2-g-fused)" opacity={after} />
              {nucleus}
            </g>
          );
        }
        const mem = 1 - f.fuse;
        return (
          <g key={i}>
            {f.go > 0.05 && <Journey pts={route} color="#b6f0c4" show={0.9} head={6} width={1.6} r={4} />}
            {/* Mother cell rounds up and pinches in two (the waist closes as the daughters part). */}
            {f.split < 1 && f.go < 0.1 && (
              <path d={`M${f1(f.inner[0])},${f1(f.inner[1])} L${f1(f.outer[0])},${f1(f.outer[1])}`} stroke="#a8ecba" strokeWidth={f1(cell * 2 * (1 - 0.75 * f.split))} strokeLinecap="round" />
            )}
            <g opacity={1 - seg(f.go, 0.2, 0.8)}>
              <circle cx={f1(f.inner[0])} cy={f1(f.inner[1])} r={cell} fill="#a8ecba" stroke="#2f7a4a" strokeWidth={0.9} />
              <circle cx={f1(f.inner[0])} cy={f1(f.inner[1])} r={2.4} fill="#1f5a37" />
            </g>
            {/* The daughter: its membrane (and its own colour) fade as it merges into the syncytium. */}
            <circle cx={f1(f.outer[0])} cy={f1(f.outer[1])} r={cell} fill={mix('#a8ecba', C.syncytio, f.fuse)} fillOpacity={0.35 + 0.65 * mem} stroke="#2f7a4a" strokeWidth={1} strokeOpacity={mem} />
            <circle cx={f1(f.outer[0])} cy={f1(f.outer[1])} r={cell} fill="url(#w2-g-cell)" opacity={mem} />
            {nucleus}
          </g>
        );
      })}
    </g>
  );
}

// ---------------------------------------------------------------------------------------------

function Day8Drawing({ t }: SceneProps) {
  const g = geometry(t);
  const { cx, cy, epiTop } = g;
  const grow = synGrow(t);
  const vac = s(t, W.vacuoles);
  const cavity = s(t, W.cavity);
  const endo = s(t, W.endo);
  const gap = Math.sqrt(Math.max(0, R * R - (W2.surfaceY - cy) ** 2)) + 6;
  const lens = lensPath(g);
  const cavC: Pt = [cx, (cy - INNER + epiTop) / 2 + 3];

  return (
    <g>
      <Endometrium gap={gap} secretion={endo} oedema={endo} vesselScale={lerp(1, 1.5, endo)} />

      <Part id="blastozelea">
        <circle cx={cx} cy={cy} r={INNER} fill="#1b2437" />
        <circle cx={cx} cy={cy} r={INNER} fill={C.blastocele} />
        <circle cx={cx} cy={cy} r={INNER} fill="url(#w2-g-cavity)" />
      </Part>

      <Part id="sinzitiotrofoblastoa">
        <SynFill d={syncytioPath(cx, cy, grow)} rule="nonzero" />
        <Feeders t={t} />
      </Part>

      <Part id="zitotrofoblastoa">
        <CellRing cx={cx} cy={cy} r={R} th={CYTO} n={44} seed={8} />
      </Part>

      <EmbryoblastCells g={g} t={t} />

      {/* Vacuoles between the epiblast cells, then the amniotic cavity they merge into. */}
      {vac > 0.01 && cavity < 0.99 && (
        <g pointerEvents="none" opacity={1 - seg(cavity, 0.5, 1)}>
          {[
            [-38, -6],
            [-13, -12],
            [12, -5],
            [36, -11],
            [0, 2],
          ].map(([dx, dy], i) => {
            const r = lerp(1, 6.5, vac) + 3 * cavity;
            return <ellipse key={i} cx={f1(lerp(cavC[0] + dx, cavC[0] + dx * 0.6, cavity))} cy={f1(cavC[1] + dy)} rx={f1(r)} ry={f1(r * 0.75)} fill="#dbe8ff" stroke="#9ebcf0" strokeWidth={0.8} />;
          })}
        </g>
      )}
      <Part id="amnios-barrunbea" show={seg(cavity, 0, 0.3)}>
        <g transform={`translate(${f1(cavC[0])} ${f1(cavC[1])}) scale(${f1(lerp(0.3, 1, cavity))}) translate(${f1(-cavC[0])} ${f1(-cavC[1])})`}>
          <path d={lens} fill="#2a3f6e" />
          <path d={lens} fill="url(#w2-g-amnion)" />
        </g>
      </Part>

      {/* Outline of the bilaminar disc (stroke only, so it does not steal clicks from the layers). */}
      <Part id="bi-orriko-diskoa" show={seg(t, 0.34, 0.37)}>
        <path
          d={`M${f1(cx - g.wEpiTop)},${f1(epiTop)} L${f1(cx + g.wEpiTop)},${f1(epiTop)} L${f1(cx + g.wHypo)},${f1(g.hypoBottom)} L${f1(cx - g.wHypo)},${f1(g.hypoBottom)}Z`}
          fill="none"
          stroke="#e8eefc"
          strokeWidth={1}
          opacity={0.55}
        />
      </Part>
    </g>
  );
}

type At = (x: number, y: number) => [number, number];
/** Hide a name whose point has left the specimen (camera pushed in). */
const inSlab = ([x, y]: [number, number]) => (x > 214 && x < 786 && y > 26 && y < 614 ? 1 : 0);

function day8Labels(t: number, at: At, closeUp: boolean) {
  const g = geometry(t);
  const { cx, cy, epiTop, discY, hypoBottom, wDisc } = g;
  const disc = s(t, W.disc);
  const cavityShow = seg(t, W.cavity[0] + 0.02, W.cavity[1]);
  const amnion = seg(t, W.amnion[0], W.amnion[0] + 0.04);
  const L = (id: string, x: number, y: number, p: Pt, show = 1, key = id) => {
    const a = at(p[0], p[1]);
    return <Label key={key} id={id} x={x} y={y} ax={a[0]} ay={a[1]} show={show * (closeUp ? 1 : inSlab(a))} />;
  };
  const onArc = (deg: number, r: number): Pt => [cx + r * Math.cos(rad(deg)), cy + r * Math.sin(rad(deg))];
  const amnioblast = onArc(292, INNER - 2.5);
  const cavity: Pt = [cx - 20, (cy - INNER + epiTop) / 2 + 4];
  const epi: Pt = [cx + 40, (epiTop + discY) / 2];
  const hypo: Pt = [cx + 52, (discY + hypoBottom) / 2];
  const discEdge: Pt = [cx - wDisc * 0.6, discY];
  // During the divisions (camera close) the names point at the cells doing it.
  const div = seg(t, 0.12, 0.15) * (1 - seg(t, 0.235, 0.26));
  const syn = synAt(t, lerp(212, 250, div), 0.55);
  const cyt = onArc(lerp(190, 256, div), R - CYTO / 2);

  if (closeUp) {
    return (
      <>
        {L('sinzitiotrofoblastoa', 180, 70, synAt(t, 245, 0.5))}
        {L('zitotrofoblastoa', 180, 140, onArc(232, R - CYTO / 2))}
        {L('enbrioblastoa', 180, 250, [cx - 20, cy - INNER + 30], 1 - seg(disc, 0.3, 0.6))}
        {L('bi-orriko-diskoa', 180, 420, discEdge, seg(t, 0.34, 0.37))}
        {L('blastozelea', 180, 540, [cx - 30, cy + 10])}
        {L('amnioblastoak', 800, 250, amnioblast, amnion)}
        {L('amnios-barrunbea', 800, 300, cavity, cavityShow)}
        {L('epiblastoa', 800, 350, epi, seg(disc, 0.5, 0.9))}
        {L('hipoblastoa', 800, 420, hypo, seg(disc, 0.5, 0.9))}
      </>
    );
  }
  return (
    <>
      {L('endometrio-estroma', 190, 60, [300, 60])}
      {L('umetoki-guruina', 190, 150, [264, 300])}
      {L('sinzitiotrofoblastoa', 190, 250, syn)}
      {L('zitotrofoblastoa', 190, 330, cyt)}
      {L('blastozelea', 190, 420, [cx - 30, cy + 30])}
      {L('endometrio-epitelioa', 190, 482, [300, W2.surfaceY - 8])}
      {L('amaren-odol-hodiak', 790, 80, [612, 84])}
      {L('mutur-enbrionarioa', 810, 244, onArc(276, R - CYTO / 2))}
      {L('amnioblastoak', 810, 290, amnioblast, amnion)}
      {L('amnios-barrunbea', 810, 330, cavity, cavityShow)}
      {L('enbrioblastoa', 810, 330, [cx + 24, cy - INNER + 30], 1 - seg(disc, 0.3, 0.6))}
      {L('epiblastoa', 810, 370, epi, seg(disc, 0.5, 0.9))}
      {L('hipoblastoa', 810, 410, hypo, seg(disc, 0.5, 0.9))}
      {L('blastozistoa', 810, 490, onArc(42, R - CYTO / 2))}
      {L('mutur-anenbrionarioa', 810, 548, [cx + 26, cy + R - 4])}
      {L('umetoki-barrunbea', 810, 600, [720, 600])}
    </>
  );
}

/** Camera of the section: it closes in on the embryonic pole while the cyto cells feed the syncytium. */
function sectionCam(t: number) {
  const { cx, cy } = geometry(t);
  const k = seg(t, 0.115, 0.15) * (1 - seg(t, 0.236, 0.27));
  return zoom(lerp(500, cx, k), lerp(320, cy - R - 6, k), lerp(1, 2.35, k), 500, lerp(320, 318, k));
}

export function Day8Section(props: SceneProps) {
  const { t } = props;
  const z = sectionCam(t);
  const div = seg(t, 0.12, 0.15) * (1 - seg(t, 0.235, 0.26));
  return (
    <g>
      <rect x={0} y={0} width={1000} height={640} fill="#101828" opacity={div} />
      <g transform={z.transform}>
        <Day8Drawing {...props} />
      </g>
      {day8Labels(t, z.at, false)}
      <Note x={500} y={588} tone="accent" show={seg(t, 0.13, 0.15) * (1 - seg(t, 0.235, 0.25))}>
        Zito-zelula zatitu → sinzitiora migratu → mintza galdu eta fusionatu
      </Note>
      <Note x={500} y={588} tone="dim" show={seg(t, 0.76, 0.8) * (1 - seg(t, 0.875, 0.9))}>
        Endometrio edematosoa: likidoa zelulen artean; guruinek glukogenoa eta mukia jariatzen dute
      </Note>
    </g>
  );
}

export function Day8Disc(props: SceneProps) {
  const { t } = props;
  const { cx, cy, epiTop, hypoBottom } = geometry(t);
  const z = zoom(cx, cy - 72, 2.6, 500, 300);
  // Dorso-ventral polarity (last beat): dorsal = epiblast / amnion side, ventral = hypoblast / blastocele side.
  const pol = s(t, W.polarity);
  const yTop = z.at(cx, epiTop)[1];
  const yBot = z.at(cx, hypoBottom)[1];
  const yMid = (yTop + yBot) / 2;
  return (
    <g>
      <rect x={0} y={0} width={1000} height={640} fill="#101828" />
      <g transform={z.transform}>
        <Day8Drawing {...props} />
      </g>
      {day8Labels(t, z.at, true)}
      {/* Vertical axis at the right edge, below the zoom controls. */}
      <Arrow from={[962, yMid]} to={[962, yTop - 50]} bend={0} color="#93c5fd" show={pol} progress={pol} />
      <Arrow from={[962, yMid]} to={[962, yBot + 100]} bend={0} color="#fcd34d" show={pol} progress={pol} />
      <g opacity={pol} pointerEvents="none" fontSize={14} fontWeight={700} textAnchor="middle">
        <text transform={`translate(984 ${(yMid + yTop - 50) / 2}) rotate(-90)`} fill="#93c5fd" stroke="#0c0c0e" strokeWidth={3} paintOrder="stroke">
          Dortsala
        </text>
        <text transform={`translate(984 ${(yMid + yBot + 100) / 2}) rotate(-90)`} fill="#fcd34d" stroke="#0c0c0e" strokeWidth={3} paintOrder="stroke">
          Bentrala
        </text>
      </g>
      <Note x={500} y={588} tone="accent" show={seg(t, 0.25, 0.28) * (1 - seg(t, 0.39, 0.41))}>
        Enbrioblasto-zelulak bi geruzatan antolatzen dira: epiblastoa (zilindrikoak) eta hipoblastoa (kubikoak)
      </Note>
      <Note x={500} y={588} tone="accent" show={seg(t, 0.48, 0.5) * (1 - seg(t, 0.6, 0.62))}>
        Epiblasto-zelulen artean bakuola txikiak → elkartu → amnios barrunbea
      </Note>
    </g>
  );
}
