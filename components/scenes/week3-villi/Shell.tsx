'use client';

import { C, Flow, Label, Note, Part, lerp, seg, type SceneProps } from '@/components/kit';
import { V, VilliDefs, alongFinger, f1, fingerD, place } from './common';

/**
 * Stage `zorro-zitotrofoblastikoa` — cytotrophoblast of the tertiary (stem) villi penetrates the
 * syncytium and reaches the decidua basalis, forming the outer cytotrophoblastic shell that anchors
 * the whole chorionic sac. Distinguishes stem/anchoring villi (plate → shell) from free villi
 * (branches floating in the intervillous space). Windows (shared by views and content/weeks/week3b.ts):
 *   .08–.30 cyto cells at the trunk tips push through the syncytial roof, spreading sideways
 *   .28–.55 the cells join between villi → continuous kanpoko zorro zitotrofoblastikoa
 *   .50–.58 anchoring (stem) villi highlighted (trunk: plate → shell)
 *   .70–.82 free villi highlighted (branches, floating, do not reach the shell)
 */
export const W = {
  penetrate: [0.08, 0.3],
  shell: [0.28, 0.55],
  anchor: [0.5, 0.58],
  anchorFade: [0.66, 0.72],
  free: [0.62, 0.72],
} as const;

/**
 * Vertical layout of the maternal-facing region (decidua-basala ↔ intervillous space):
 *   0..deciduaBottom            dezidua basala
 *   deciduaBottom..shellSplit   kanpoko zorro zitotrofoblastikoa (grows in here, replacing the roof)
 *   shellSplit..roofBottom      thin residual sinzitiotrofoblastoa (always present — the roof's lower half,
 *                                the blood-facing lamina left once the shell has formed above it)
 *   roofBottom..plateSyn        biloxka arteko espazioa (maternal blood)
 * The anchoring-villus trunk spans the full distance from the chorionic plate to the decidua
 * (TRUNK_LEN = plateSyn - deciduaBottom) so its tip merges into the shell with no gap.
 */
const Y = { deciduaBottom: 92, shellSplit: 112, roofBottom: 124, plateSyn: 480, plateCyto: 494, plateMeso: 508, plateBottom: 566 };
const TRUNK_X = [350, 650] as const;
const TRUNK_LEN = Y.plateSyn - Y.deciduaBottom;

interface VGeo {
  x: number;
  y: number;
  angle: number;
  len: number;
  hw: number;
  ts: number;
  tc: number;
  kind: 'enbor' | 'aske';
}

const TRUNKS: VGeo[] = TRUNK_X.map((x) => ({ x, y: Y.plateSyn, angle: 0, len: TRUNK_LEN, hw: 32, ts: 10, tc: 9, kind: 'enbor' }));

const BRANCHES: { trunk: 0 | 1; d: number; o: number; angle: number; len: number; hw: number; ts: number; tc: number }[] = [
  { trunk: 0, d: 150, o: -8, angle: -34, len: 108, hw: 17, ts: 6.5, tc: 5.5 },
  { trunk: 0, d: 225, o: 10, angle: 26, len: 92, hw: 15, ts: 6, tc: 5 },
  { trunk: 1, d: 140, o: 8, angle: 34, len: 112, hw: 17, ts: 6.5, tc: 5.5 },
  { trunk: 1, d: 235, o: -10, angle: -27, len: 86, hw: 15, ts: 6, tc: 5 },
];

function geometry() {
  const branches: VGeo[] = BRANCHES.map((b) => {
    const t = TRUNKS[b.trunk];
    const [x, y] = alongFinger(t.x, t.y, t.angle, b.d, b.o);
    return { x, y, angle: t.angle + b.angle, len: b.len, hw: b.hw, ts: b.ts, tc: b.tc, kind: 'aske' as const };
  });
  return { trunks: TRUNKS, branches, all: [...TRUNKS, ...branches] };
}
type Geo = ReturnType<typeof geometry>;

/** Points across the decidua-facing band where cytotrophoblast cells arrive, closest to the trunks first. */
const SHELL_X0 = 150;
const SHELL_X1 = 850;
const SHELL_N = 16;
function shellSeg(i: number, shellGrow: number) {
  const x = lerp(SHELL_X0, SHELL_X1, (i + 0.5) / SHELL_N);
  const dist = Math.min(Math.abs(x - TRUNK_X[0]), Math.abs(x - TRUNK_X[1]));
  const delay = Math.min(0.55, (dist / 380) * 0.55);
  return { x, show: seg(shellGrow, delay, delay + 0.42) };
}

/**
 * One tertiary villus. Its three tissue layers each belong to the same structure id as the flat plate
 * bands elsewhere in this scene (sinzitiotrofoblastoa / zitotrofoblastoa / enbrioi-kanpoko-mesodermoa),
 * so a click or a label leader anywhere on the villus wall hits the correct layer — not a separate,
 * competing id. `biloxka-tertziarioa` gets its own thin outline (as biloxka-enborra/biloxka-askea already
 * do), and the capillary loop is `biloxka-kapilarrak`.
 */
function Villus({ v }: { v: VGeo }) {
  const capLen = v.len * 0.46;
  const capHalf = Math.max(3, (v.hw - v.ts - v.tc) * 0.42);
  return (
    <g transform={place(v.x, v.y, v.angle)}>
      <Part id="sinzitiotrofoblastoa" quiet>
        <path d={fingerD(v.len, v.hw)} fill="url(#p-syncytio)" stroke={C.syncytioDeep} strokeWidth={1} />
      </Part>
      <Part id="zitotrofoblastoa" quiet>
        <path d={fingerD(v.len - v.ts * 0.9, v.hw - v.ts, 6)} fill="url(#w3v-cyto)" stroke="rgba(22,80,45,0.6)" strokeWidth={0.9} />
      </Part>
      <Part id="enbrioi-kanpoko-mesodermoa" quiet>
        <path d={fingerD(v.len - (v.ts + v.tc) * 0.9, v.hw - v.ts - v.tc, 5)} fill={C.mesoExtra} stroke="#d9785a" strokeWidth={0.7} />
      </Part>
      <Part id="biloxka-kapilarrak">
        <path
          d={`M${f1(-capHalf)},${f1(-v.len * 0.14)} L${f1(-capHalf)},${f1(-v.len * 0.14 - capLen)} A${f1(capHalf)} ${f1(capHalf)} 0 0 1 ${f1(capHalf)},${f1(-v.len * 0.14 - capLen)} L${f1(capHalf)},${f1(-v.len * 0.14)}`}
          fill="none"
          stroke={V.endothelium}
          strokeWidth={3.4}
        />
        <path
          d={`M${f1(-capHalf * 0.55)},${f1(-v.len * 0.14)} L${f1(-capHalf * 0.55)},${f1(-v.len * 0.14 - capLen)} A${f1(capHalf * 0.55)} ${f1(capHalf * 0.55)} 0 0 1 ${f1(capHalf * 0.55)},${f1(-v.len * 0.14 - capLen)} L${f1(capHalf * 0.55)},${f1(-v.len * 0.14)}`}
          fill="none"
          stroke={V.fetal}
          strokeWidth={1.8}
        />
      </Part>
      <Part id="biloxka-tertziarioa">
        <path d={fingerD(v.len, v.hw + 2, 9)} fill="none" stroke="#e8eefc" strokeWidth={1} strokeDasharray="2 3" opacity={0.55} />
      </Part>
    </g>
  );
}

/** Spiral artery: opens through the decidua and the shell to spill maternal blood into the intervillous space. */
const ARTERY_D = 'M500,4 C524,24 478,38 500,58 C524,76 480,90 500,106 C518,118 514,132 500,150';

function ShellDrawing({ t, reduced }: SceneProps) {
  const g = geometry();
  const penetrate = seg(t, W.penetrate[0], W.penetrate[1]);
  const shellGrow = seg(t, W.shell[0], W.shell[1]);
  const anchor = seg(t, W.anchor[0], W.anchor[1]) * (1 - seg(t, W.anchorFade[0], W.anchorFade[1]));
  const free = seg(t, W.free[0], W.free[1]);
  const shellShown = shellGrow > 0.02 ? 1 : 0;
  const shellW = (SHELL_X1 - SHELL_X0) / SHELL_N;

  return (
    <g mask="url(#m-slab)">
      <Part id="dezidua-basala">
        <rect x={0} y={0} width={1000} height={Y.deciduaBottom} fill="url(#p-decidua)" />
        {[130, 300, 470, 700, 870].map((x, i) => (
          <path key={i} d={`M${x},0 q${8 + (i % 3) * 4},${Y.deciduaBottom * 0.4} 0,${Y.deciduaBottom}`} fill="none" stroke="#8d1024" strokeWidth={2.4} opacity={0.5} />
        ))}
      </Part>

      <Part id="biloxka-arteko-espazioa" quiet>
        <rect x={0} y={Y.roofBottom} width={1000} height={Y.plateSyn - Y.roofBottom} fill="url(#w3v-mblood)" opacity={0.85} />
      </Part>
      {!reduced &&
        [
          'M200,132 C230,240 190,360 210,462',
          'M400,132 C420,240 388,360 402,462',
          'M600,132 C580,240 612,360 598,462',
          'M800,132 C770,240 810,360 790,462',
        ].map((d, i) => <Flow key={i} d={d} n={4} dur={7.5 + i} r={2.2} color="#ff6b81" reduced={reduced} />)}

      {/* Syncytial roof: general trophoblastic covering facing the decidua, present from the start. Its
          lower half (shellSplit..roofBottom) stays as a thin residual layer even once the shell forms above it. */}
      <Part id="sinzitiotrofoblastoa">
        <rect x={0} y={Y.deciduaBottom} width={1000} height={Y.roofBottom - Y.deciduaBottom} fill="url(#p-syncytio)" stroke={C.syncytioDeep} strokeWidth={0.6} />
      </Part>

      {/* Cytotrophoblast cells breaching the syncytial roof at each trunk tip, spreading toward neighbours. */}
      <Part id="zitotrofoblastoa" quiet={false}>
        {g.trunks.map((v, i) => (
          <rect
            key={i}
            x={v.x - v.hw * 0.65 * penetrate}
            y={Y.deciduaBottom}
            width={v.hw * 1.3 * penetrate}
            height={Y.shellSplit - Y.deciduaBottom}
            fill="url(#w3v-cyto)"
            stroke="rgba(22,80,45,0.6)"
            strokeWidth={0.6}
            opacity={penetrate > 0.02 ? 1 : 0}
          />
        ))}
      </Part>

      <Part id="kanpoko-zorro-zitotrofoblastikoa" show={shellShown}>
        {Array.from({ length: SHELL_N }, (_, i) => {
          const seg_ = shellSeg(i, shellGrow);
          return <rect key={i} x={seg_.x - shellW / 2 - 1} y={Y.deciduaBottom} width={shellW + 2} height={Y.shellSplit - Y.deciduaBottom} fill="url(#w3v-cyto)" stroke="rgba(22,80,45,0.5)" strokeWidth={0.6} opacity={seg_.show} />;
        })}
      </Part>

      {/* Spiral artery: breaches decidua + shell to open directly into the intervillous space. */}
      <Part id="arteria-espiralak">
        <path d={ARTERY_D} fill="none" stroke="#c9314f" strokeWidth={7} strokeLinecap="round" />
        <path d={ARTERY_D} fill="none" stroke="#ff6b81" strokeWidth={3} strokeLinecap="round" opacity={0.85} />
      </Part>
      {!reduced && <Flow d={ARTERY_D} n={4} dur={5} r={2.2} color="#ffb3bf" reduced={reduced} />}

      <Part id="korion-barrunbea" quiet>
        <rect x={0} y={Y.plateBottom} width={1000} height={640 - Y.plateBottom} fill="#131a2b" />
        <rect x={0} y={Y.plateBottom} width={1000} height={640 - Y.plateBottom} fill="url(#g-shade)" opacity={0.35} />
      </Part>

      <Part id="sinzitiotrofoblastoa" quiet>
        <rect x={0} y={Y.plateSyn} width={1000} height={Y.plateCyto - Y.plateSyn + 1} fill="url(#p-syncytio)" />
      </Part>
      <Part id="zitotrofoblastoa" quiet>
        <rect x={0} y={Y.plateCyto} width={1000} height={Y.plateMeso - Y.plateCyto + 1} fill="url(#w3v-cyto)" />
      </Part>
      <Part id="enbrioi-kanpoko-mesodermoa" quiet>
        <rect x={0} y={Y.plateMeso} width={1000} height={Y.plateBottom - Y.plateMeso} fill={C.mesoExtra} />
        <rect x={0} y={Y.plateMeso} width={1000} height={Y.plateBottom - Y.plateMeso} fill="url(#p-meso-extra)" />
      </Part>
      <Part id="korion-plaka">
        <path d={`M232,${Y.plateSyn} h-8 v${Y.plateBottom - Y.plateSyn} h8`} fill="none" stroke="#e8eefc" strokeWidth={2} opacity={0.85} />
      </Part>

      {g.all.map((v, i) => (
        <Villus key={i} v={v} />
      ))}

      <Part id="biloxka-enborra" show={Math.max(0.001, anchor)}>
        {g.trunks.map((v, i) => (
          <path key={i} transform={place(v.x, v.y, v.angle)} d={fingerD(v.len, v.hw + 4, 10)} fill="none" stroke="#e8eefc" strokeWidth={1.3} strokeDasharray="4 4" opacity={0.85} />
        ))}
      </Part>
      <Part id="biloxka-askea" show={Math.max(0.001, free)}>
        {g.branches.map((v, i) => (
          <path key={i} transform={place(v.x, v.y, v.angle)} d={fingerD(v.len, v.hw + 3, 8)} fill="none" stroke="#e8eefc" strokeWidth={1.1} strokeDasharray="3 3" opacity={0.85} />
        ))}
      </Part>
    </g>
  );
}

function labels(t: number) {
  const g = geometry();
  const penetrate = seg(t, W.penetrate[0], W.penetrate[1]);
  const shellGrow = seg(t, W.shell[0], W.shell[1]);
  const shellShown = shellGrow > 0.02 ? 1 : 0;
  const anchor = seg(t, W.anchor[0], W.anchor[1]) * (1 - seg(t, W.anchorFade[0], W.anchorFade[1]));
  const free = seg(t, W.free[0], W.free[1]);
  const trunk = g.trunks[0];
  const branch = g.branches[0];
  return (
    <>
      <Label id="dezidua-basala" x={190} y={54} ax={300} ay={54} />
      <Label id="arteria-espiralak" x={810} y={54} ax={500} ay={58} />
      <Label id="biloxka-arteko-espazioa" x={190} y={150} ax={262} ay={220} />
      <Label id="kanpoko-zorro-zitotrofoblastikoa" x={190} y={200} ax={280} ay={Y.deciduaBottom + 6} show={shellShown} text="Zorro zitotrofoblastikoa" />
      <Label id="zitotrofoblastoa" x={190} y={250} ax={trunk.x - trunk.hw + trunk.ts + 3} ay={trunk.y - trunk.len * 0.55} show={Math.max(0.15, penetrate)} />
      <Label id="biloxka-enborra" x={190} y={330} ax={trunk.x - trunk.hw - 4} ay={trunk.y - trunk.len * 0.7} show={anchor} text="Enborrezko biloxka" />
      <Label id="biloxka-askea" x={190} y={400} ax={alongFinger(branch.x, branch.y, branch.angle, branch.len * 0.6)[0]} ay={alongFinger(branch.x, branch.y, branch.angle, branch.len * 0.6)[1]} show={free} />
      <Label id="sinzitiotrofoblastoa" x={190} y={460} ax={260} ay={(Y.shellSplit + Y.roofBottom) / 2} />
      <Label id="korion-plaka" x={190} y={510} ax={224} ay={510} />
      <Label id="korion-barrunbea" x={190} y={590} ax={262} ay={590} />
      <Label id="enbrioi-kanpoko-mesodermoa" x={810} y={330} ax={g.trunks[1].x + 60} ay={Y.plateMeso + 20} text="Kanpoko mesodermoa" />
      <Label id="biloxka-kapilarrak" x={810} y={400} ax={g.trunks[1].x + 5.5} ay={g.trunks[1].y - 90} text="Biloxka kapilarrak" />
      <Label
        id="biloxka-askea"
        x={810}
        y={450}
        ax={alongFinger(g.branches[2].x, g.branches[2].y, g.branches[2].angle, g.branches[2].len * 0.6)[0]}
        ay={alongFinger(g.branches[2].x, g.branches[2].y, g.branches[2].angle, g.branches[2].len * 0.6)[1]}
        show={free}
        key="askea-r"
      />
    </>
  );
}

export function ShellSection(props: SceneProps) {
  return (
    <g>
      <VilliDefs />
      <ShellDrawing {...props} />
      {labels(props.t)}
    </g>
  );
}

export function ShellClose({ t, reduced }: SceneProps) {
  const g = geometry();
  const trunk = g.trunks[0];
  const penetrate = seg(t, W.penetrate[0], W.penetrate[1]);
  const shellGrow = seg(t, W.shell[0], W.shell[1]);
  const shellShown = shellGrow > 0.02 ? 1 : 0;
  const cx = trunk.x;
  const cy = trunk.y - trunk.len + 6;
  const s = 2.1;
  const tx = 500;
  const ty = 320;
  const at = (x: number, y: number): [number, number] => [tx + (x - cx) * s, ty + (y - cy) * s];
  return (
    <g>
      <VilliDefs />
      <rect x={0} y={0} width={1000} height={640} fill="#101828" />
      <g transform={`translate(${tx} ${ty}) scale(${s}) translate(${-cx} ${-cy})`}>
        <ShellDrawing t={t} reduced={reduced} />
      </g>
      <Label id="dezidua-basala" x={180} y={90} ax={at(cx - 20, Y.deciduaBottom - 20)[0]} ay={at(cx - 20, Y.deciduaBottom - 20)[1]} />
      <Label id="kanpoko-zorro-zitotrofoblastikoa" x={180} y={200} ax={at(cx + 30, (Y.deciduaBottom + Y.shellSplit) / 2)[0]} ay={at(cx + 30, (Y.deciduaBottom + Y.shellSplit) / 2)[1]} show={shellShown} text="Zorro zitotrofoblastikoa" />
      <Label id="zitotrofoblastoa" x={180} y={310} ax={at(cx - 17, Y.shellSplit + 40)[0]} ay={at(cx - 17, Y.shellSplit + 40)[1]} />
      <Label id="sinzitiotrofoblastoa" x={180} y={420} ax={at(cx - trunk.hw + 4, Y.shellSplit + 4)[0]} ay={at(cx - trunk.hw + 4, Y.shellSplit + 4)[1]} />
      <Label id="biloxka-enborra" x={180} y={520} ax={at(cx, Y.shellSplit + 140)[0]} ay={at(cx, Y.shellSplit + 140)[1]} text="Enborrezko biloxka" />
      <Note x={500} y={612} tone="accent" show={seg(t, W.penetrate[0], W.penetrate[0] + 0.06) * (1 - seg(t, 0.28, 0.34))}>
        Zitotrofoblasto-zelulak sinzitioa zeharkatu eta dezidua basalera iristen dira
      </Note>
    </g>
  );
}
