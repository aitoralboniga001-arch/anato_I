'use client';

import { Arrow, C, Journey, Label, Mark, Note, Part, clamp, dual, lerp, rand, seg, zoom, type Pt, type SceneProps } from '@/components/kit';
import { discOutline, f1 } from './common';
import { DorsalDefs, Stellate } from './dorsalKit';
import { CellCluster, DiscDrawing, MembraneMark, makeDisc } from './DiscSection';

/**
 * Intra-embryonic mesoderm spreads cranially and laterally from the streak until it is
 * continuous, at the disc edges, with the extra-embryonic mesoderm — except at the two membranes
 * (bucco-pharyngeal cranially, cloacal caudally) where ectoderm and endoderm stay fused because no
 * mesoderm ever reaches there. The prechordal plate appears cranial to the (future) notochord,
 * caudal to the bucco-pharyngeal membrane.
 * Both views follow the beats (.16 spread · .42 continuity at the edges · .6 bucco-pharyngeal membrane ·
 *    .68 cloacal membrane · .78 no vessels there · .86 prechordal plate); each window ends before its
 *    step's complete frame. The dorsal disc is longer than wide, as in the gastrulation stage.
 */
const D = { cx: 500, cy: 318, rxT: 150, rxB: 132, ryT: 196, ryB: 188 };
const NODE_Y = D.cy + 4;
const STREAK_END = D.cy + D.ryB - 64;
const STREAK_W = 10;
const BUCCO: Pt = [D.cx, D.cy - D.ryT + 34];
const CLOACA: Pt = [D.cx, D.cy + D.ryB - 32];
const PRE: Pt = [D.cx, BUCCO[1] + 34];
const OUTLINE = discOutline(D.cx, D.cy, D.rxT, D.rxB, D.ryT, D.ryB, 96);
const ring = (k: number) => discOutline(D.cx, D.cy, D.rxT + k, D.rxB + k, D.ryT + k, D.ryB + k, 96);
const poly = (pts: Pt[]) => `M${pts.map((q) => `${f1(q[0])},${f1(q[1])}`).join('L')}Z`;
const OUT_D = poly(OUTLINE);
const RIM_D = poly(ring(9));
const YOLK_D = poly(ring(30));
const oval = (c: Pt, rx: number, ry: number) => `M${f1(c[0] - rx)},${f1(c[1])}a${rx},${ry} 0 1,0 ${2 * rx},0a${rx},${ry} 0 1,0 ${-2 * rx},0Z`;
const BUCCO_D = oval(BUCCO, 19, 12);
const CLOACA_D = oval(CLOACA, 17, 11);
/** Ectoderm left in place: the left part of the disc plus a strip carrying the streak and node; the rest is cut away. */
const BX = D.cx - 46;
const WIN_D = (() => {
  const top = D.cy - D.ryT - 40;
  const bot = D.cy + D.ryB + 40;
  const R = D.cx + D.rxT + 40;
  const a = NODE_Y - 26;
  const b = STREAK_END + 14;
  const sx = D.cx + STREAK_W + 12;
  return `M${BX},${top}H${R}V${bot}H${BX}V${b + 14}Q${BX},${b} ${BX + 14},${b}H${sx - 12}Q${sx},${b} ${sx},${b - 12}V${a + 12}Q${sx},${a} ${sx - 12},${a}H${BX + 14}Q${BX},${a} ${BX},${a - 14}Z`;
})();
const STREAK_D = `M${f1(D.cx - STREAK_W)},${f1(STREAK_END)} Q${f1(D.cx - STREAK_W * 1.3)},${f1((NODE_Y + STREAK_END) / 2)} ${f1(D.cx - STREAK_W * 0.5)},${f1(NODE_Y + 8)} L${f1(D.cx + STREAK_W * 0.5)},${f1(NODE_Y + 8)} Q${f1(D.cx + STREAK_W * 1.3)},${f1((NODE_Y + STREAK_END) / 2)} ${f1(D.cx + STREAK_W)},${f1(STREAK_END)} Q${f1(D.cx)},${f1(STREAK_END + 8)} ${f1(D.cx - STREAK_W)},${f1(STREAK_END)}Z`;
const GW = STREAK_W * 0.42;
const GROOVE_D = `M${f1(D.cx - GW)},${f1(STREAK_END - 3)} Q${f1(D.cx - GW * 1.3)},${f1((NODE_Y + STREAK_END) / 2)} ${f1(D.cx - GW * 0.45)},${f1(NODE_Y + 13)} L${f1(D.cx + GW * 0.45)},${f1(NODE_Y + 13)} Q${f1(D.cx + GW * 1.3)},${f1((NODE_Y + STREAK_END) / 2)} ${f1(D.cx + GW)},${f1(STREAK_END - 3)} Z`;

function halfW(y: number) {
  let best = 0;
  for (let i = 0; i < OUTLINE.length; i++) {
    const a = OUTLINE[i];
    const b = OUTLINE[(i + 1) % OUTLINE.length];
    if ((a[1] - y) * (b[1] - y) <= 0 && a[1] !== b[1]) best = Math.max(best, Math.abs(lerp(a[0], b[0], (y - a[1]) / (b[1] - a[1])) - D.cx));
  }
  return best;
}

/** Mesenchymal cells over the disc, each revealed when the front (spreading from the streak) passes it; never in the two membranes. */
const MESO_PTS = (() => {
  const out: { p: Pt; d: number; a: number }[] = [];
  let i = 0;
  for (let y = D.cy - D.ryT + 8; y < D.cy + D.ryB - 6; y += 15)
    for (let x = D.cx - D.rxT; x < D.cx + D.rxT; x += 16) {
      i++;
      const px = x + (rand(i * 2.3) - 0.5) * 12;
      const py = y + (rand(i * 5.1) - 0.5) * 10;
      if (Math.abs(px - D.cx) > halfW(py) - 7 || px < BX - 8) continue;
      if (Math.hypot((px - BUCCO[0]) / 27, (py - BUCCO[1]) / 19) < 1 || Math.hypot((px - CLOACA[0]) / 25, (py - CLOACA[1]) / 18) < 1) continue;
      const sy = clamp(py, NODE_Y, STREAK_END);
      out.push({ p: [px, py], d: Math.hypot(px - D.cx, (py - sy) * (py < sy ? 0.82 : 1.15)), a: rand(i * 9.7) * 180 });
    }
  return out;
})();
const MESO_MAX = Math.max(...MESO_PTS.map((m) => m.d));
/** Where the mesoderm front stands (fraction of the farthest reach): gastrulation ended near 0.72; this stage spreads it to the edges. */
const frontAt = (t: number) => lerp(0.62, 1.03, seg(t, 0.16, 0.4));

function dorsalWindows(t: number) {
  return {
    exMeso: seg(t, 0, 0.06),
    front: frontAt(t),
    spread: seg(t, 0.16, 0.2) * (1 - seg(t, 0.4, 0.44)),
    join: seg(t, 0.4, 0.44) * (1 - seg(t, 0.58, 0.6)),
    bucco: seg(t, 0.6, 0.64),
    cloaca: seg(t, 0.68, 0.72),
    noVessels: seg(t, 0.78, 0.82) * (1 - seg(t, 0.84, 0.86)),
    prechordal: seg(t, 0.86, 0.92),
  };
}

const DZ_S = 1.12;
const DZ = zoom(500, 318, DZ_S);

function DorsalDrawing({ t }: SceneProps) {
  const { front, spread, join, bucco, cloaca, noVessels, prechordal } = dorsalWindows(t);
  const shown = MESO_PTS.filter((m) => m.d < front * MESO_MAX);
  // The first cells in through the pit run up the midline to form the prechordal plate.
  const preCells = Array.from({ length: 9 }, (_, i) => {
    const row = Math.floor(i / 3);
    const col = (i % 3) - 1;
    const k = seg(t, 0.86 + i * 0.006, 0.9 + i * 0.006);
    const end: Pt = [PRE[0] + col * 9 + (row % 2) * 4, PRE[1] + row * 7 - 6];
    return { p: [lerp(D.cx, end[0], k), lerp(NODE_Y - 4, end[1], k)] as Pt, k };
  });
  const lead: Pt[] = [];
  for (let tt = 0.86; tt <= Math.min(t, 0.92); tt += 0.004) {
    const k = seg(tt, 0.86, 0.9);
    lead.push([lerp(D.cx, PRE[0] - 9, k), lerp(NODE_Y - 4, PRE[1] - 6, k)]);
  }
  return (
    <g>
      <rect x={0} y={0} width={1000} height={640} fill="#0f0f11" />
      <defs>
        <DorsalDefs />
        <clipPath id="w3m-disc">
          <path d={OUT_D} />
        </clipPath>
      </defs>
      <g transform={DZ.transform}>
        <path d={YOLK_D} fill="#000" opacity={0.35} transform="translate(3 6)" pointerEvents="none" />
        {/* Beyond the disc: the yolk sac and the cut amnion, both coated with extra-embryonic mesoderm (salmon). */}
        <Part id="enbrioi-kanpoko-mesodermoa">
          <path d={YOLK_D + RIM_D} fill="url(#w3g-extra)" fillRule="evenodd" />
          <path d={YOLK_D} fill="none" stroke="#f1b79c" strokeWidth={1} opacity={0.6} />
        </Part>
        <Part id="amnioblastoak" quiet>
          <path d={RIM_D + OUT_D} fill={C.amnioblast} fillRule="evenodd" opacity={0.5} />
        </Part>

        {/* Under the ectoderm: endoderm, then the mesoderm spreading over it (holes at the two membranes). */}
        <g clipPath="url(#w3m-disc)">
          <Part id="endodermoa">
            <path d={OUT_D} fill="url(#w3g-endo)" />
          </Part>
          <Part id="mesodermo-intraenbrionarioa">
            {/* A sheet of mesenchyme: each cell's territory joins the next, so the sheet's edge is the front itself. */}
            <g fill="#c23a3f">
              {shown.map((m, i) => (
                <circle key={i} cx={f1(m.p[0])} cy={f1(m.p[1])} r={12.5} />
              ))}
            </g>
            {shown.map((m, i) => (
              <Stellate key={i} x={m.p[0]} y={m.p[1]} r={3.1} a={m.a} color="#ff7676" />
            ))}
          </Part>
          {/* Fate-coloured movement: the mesoderm spreads laterally and cranially from the streak. */}
          <Arrow from={[D.cx + 26, STREAK_END - 34]} to={[D.cx + 118, STREAK_END - 44]} bend={0} color={C.mesoIntra} width={2.6} head={9} show={spread} progress={spread} />
          <Arrow from={[D.cx + 26, NODE_Y + 18]} to={[D.cx + 104, D.cy - 96]} bend={0.14} color={C.mesoIntra} width={2.6} head={9} show={spread} progress={spread} />
          <Arrow from={[D.cx - 30, NODE_Y - 34]} to={[D.cx - 34, PRE[1] + 26]} bend={-0.1} color={C.mesoIntra} width={2.6} head={9} show={spread} progress={spread} />
          <Part id="mintz-bukofaringeoa" show={bucco}>
            <path d={BUCCO_D} fill="url(#w3g-memb)" stroke="#eef2ff" strokeWidth={1.2} />
          </Part>
          <Part id="kloaka-mintza" show={cloaca}>
            <path d={CLOACA_D} fill="url(#w3g-memb)" stroke="#eef2ff" strokeWidth={1.2} />
          </Part>
          {prechordal > 0.01 && (
            <Part id="plaka-prekordala">
              <Journey pts={lead} color={C.prechordal} head={10} width={2.4} route={0.5} origin={false} u={1 / DZ_S} />
              {preCells.map((c, i) =>
                c.k > 0.01 ? (
                  <g key={i} opacity={Math.min(1, c.k * 4)}>
                    <circle cx={f1(c.p[0])} cy={f1(c.p[1])} r={4.6} fill={C.prechordal} stroke="rgba(60,10,50,0.7)" strokeWidth={0.7} />
                    <circle cx={f1(c.p[0] - 1.2)} cy={f1(c.p[1] - 1.2)} r={1.6} fill="rgba(255,255,255,0.35)" />
                  </g>
                ) : null,
              )}
            </Part>
          )}
        </g>

        {/* Ectoderm on top (mosaic of cell apices), cut away over the right part to show the layers below. */}
        <Part id="ektodermoa">
          <path d={OUT_D + WIN_D} fill="url(#w3g-mosaic)" fillRule="evenodd" clipPath="url(#w3m-disc)" />
          <path d={OUT_D + WIN_D} fill="url(#w3g-light)" fillRule="evenodd" clipPath="url(#w3m-disc)" pointerEvents="none" />
          <path d={WIN_D} fill="none" stroke="#2d4c9c" strokeWidth={4} clipPath="url(#w3m-disc)" pointerEvents="none" />
        </Part>
        <Part id="ildo-primitiboa">
          <path d={STREAK_D} fill="rgba(6,10,30,0.45)" transform="translate(2.5 2)" />
          <path d={STREAK_D} fill="url(#w3g-ridge)" />
          <path d={GROOVE_D} fill="#132453" />
        </Part>
        <Part id="nodo-primitiboa">
          <ellipse cx={D.cx + 2.5} cy={NODE_Y + 3} rx={16} ry={13} fill="rgba(6,10,30,0.5)" />
          <ellipse cx={D.cx} cy={NODE_Y} rx={16} ry={13} fill="url(#w3g-node)" />
        </Part>
        <Part id="hobitxo-primitiboa">
          <ellipse cx={D.cx} cy={NODE_Y + 0.5} rx={6} ry={5} fill="#081230" />
        </Part>

        {/* Where the two mesoderms meet at the disc edge. */}
        <Mark id="enbrioi-kanpoko-mesodermoa" x={D.cx + D.rxT - 2} y={D.cy - 20} rx={22} ry={60} show={join} />
        {/* No mesoderm → no vessels: both membranes will later break down (mouth and cloaca openings). */}
        <Mark id="mintz-bukofaringeoa" x={BUCCO[0]} y={BUCCO[1]} rx={30} ry={22} show={noVessels} />
        <Mark id="kloaka-mintza" x={CLOACA[0]} y={CLOACA[1]} rx={28} ry={20} show={noVessels} />
      </g>
      <Note x={500} y={606} tone="dim" size={11}>
        Goitik · eskuinean ektodermoa kenduta: mesodermoa (gorria) endodermoaren (horia) gainean
      </Note>
    </g>
  );
}

function dorsalLabels(t: number) {
  const { exMeso, bucco, cloaca, prechordal } = dorsalWindows(t);
  const g = seg(t, 0.12, 0.16);
  const L = (id: string, x: number, y: number, p: Pt, show = 1, small = false) => {
    const q = DZ.at(p[0], p[1]);
    return <Label key={id} id={id} x={x} y={y} ax={q[0]} ay={q[1]} show={show} small={small} />;
  };
  return (
    <>
      {L('enbrioi-kanpoko-mesodermoa', 200, 112, [D.cx - (D.rxT + 20) * Math.cos(0.9), D.cy - (D.ryT + 20) * Math.sin(0.9)], exMeso, true)}
      {L('ektodermoa', 190, 200, [D.cx - D.rxT * 0.6, D.cy - D.ryT * 0.3])}
      {L('nodo-primitiboa', 190, 300, [D.cx - 13, NODE_Y + 2])}
      {L('ildo-primitiboa', 190, 400, [D.cx - STREAK_W * 0.9, (NODE_Y + STREAK_END) / 2 + 20])}
      {L('endodermoa', 190, 470, [D.cx - 30, CLOACA[1] + 2], 1, true)}
      {L('mintz-bukofaringeoa', 190, 156, [BUCCO[0] - 13, BUCCO[1] - 2], bucco)}
      {L('plaka-prekordala', 810, 168, [PRE[0] + 12, PRE[1]], prechordal)}
      {L('mesodermo-intraenbrionarioa', 792, 250, [D.cx + D.rxT * 0.5, D.cy - D.ryT * 0.2], g, true)}
      {L('hobitxo-primitiboa', 810, 320, [D.cx + 3, NODE_Y])}
      {L('kloaka-mintza', 810, 530, [CLOACA[0] + 10, CLOACA[1] + 2], cloaca)}
    </>
  );
}

export function MesodermDorsal(props: SceneProps) {
  return (
    <g>
      <DorsalDrawing {...props} />
      {dorsalLabels(props.t)}
    </g>
  );
}

/**
 * Realistic sagittal section (cranial = left): the mesoderm front sweeps cranially from the streak
 * between ectoderm and endoderm, never reaching the two membranes (ectoderm + endoderm fused);
 * the prechordal plate lies just caudal to the bucco-pharyngeal membrane.
 * Each change plays right after its beat (.16 spread, .6 / .68 membranes, .78 no vessels, .86 prechordal plate).
 */
const X_BUCCO = -238;
const X_CLOACA = 246;
const X_PRE = -196;

function sagittalGeometry(t: number) {
  return {
    growth: seg(t, 0.16, 0.4),
    bucco: seg(t, 0.6, 0.64),
    cloaca: seg(t, 0.68, 0.72),
    noVessels: seg(t, 0.78, 0.82) * (1 - seg(t, 0.84, 0.86)),
    prechordal: seg(t, 0.86, 0.92),
  };
}

function sagittalDisc(t: number) {
  const g = sagittalGeometry(t);
  const front = lerp(60, -262, g.growth);
  const s = makeDisc({
    k: 1.08,
    endo: 1,
    meso: 1,
    ecto: 1,
    streak: 0.5,
    groove: 1,
    invag: 1,
    phase: t * 14,
    streakAt: [70, 214],
    membranes: [X_BUCCO, X_CLOACA],
    gapFn: (x) => 40 * ss((x - front) / 40) * ss((258 - Math.abs(x)) / 40),
  });
  return { s, g };
}

/**
 * Transverse section through the primitive streak (dorsal up): the mesoderm leaves the groove and
 * spreads laterally between ectoderm and endoderm (.16–.44) until, at the disc's edges, it meets the
 * extra-embryonic mesoderm that coats the amnion and the yolk sac (.42, continuity).
 */
function Transverse({ t, pane }: SceneProps & { pane?: boolean }) {
  const grow = seg(t, 0.16, 0.44);
  const s = makeDisc({ k: 1.08, endo: 1, ecto: 1, meso: lerp(0.12, 1, grow), streak: 1, groove: 1, invag: 1, phase: t * 14 });
  const mid = (x: number) => s.map(x, (s.base(x) + s.dEnd(x)) / 2);
  const front = Math.min(s.spread * 0.6, s.W * 0.45);
  const join = seg(t, 0.42, 0.46) * (1 - seg(t, 0.58, 0.6));
  const edge = (sd: 1 | -1): Pt => [s.p.cx + sd * (s.rx + 6 * s.k), (s.cyA + s.cyY) / 2];
  const L = (id: string, x: number, y: number, p: Pt, show = 1, small = false) => <Label key={id} id={id} x={x} y={y} ax={p[0]} ay={p[1]} show={show} small={small} />;
  return (
    <g>
      <rect x={0} y={0} width={1000} height={640} fill="#0f0f11" />
      <DiscDrawing s={s} ids={{ epiblast: 'ektodermoa' }} />
      {([1, -1] as const).map((sd) => (
        <Arrow key={sd} from={mid(sd * 30)} to={mid(sd * lerp(60, 230, grow))} bend={0} color={C.mesoIntra} width={2.4} head={8} show={grow > 0.02 ? 1 - seg(t, 0.46, 0.52) : 0} progress={Math.max(0.2, grow)} />
      ))}
      {/* Where the two mesoderms meet, at both edges of the disc. */}
      <Mark id="enbrioi-kanpoko-mesodermoa" x={edge(-1)[0]} y={edge(-1)[1]} rx={30} show={join} />
      <Mark id="enbrioi-kanpoko-mesodermoa" x={edge(1)[0]} y={edge(1)[1]} rx={30} show={join} />

      {/* In the dual pane only the right half is framed (the section is mirror-symmetric): anchors sit on that half. */}
      {L('amnios-barrunbea', 190, 120, s.at.amnion)}
      {L('ektodermoa', 190, 190, pane ? s.map(s.W * 0.32, s.top(s.W * 0.32) + 10) : s.at.epiblast)}
      {L('mesodermo-intraenbrionarioa', 198, 300, mid(pane ? front * 0.7 : -front), seg(t, 0.12, 0.16), true)}
      {L('endodermoa', 190, 380, pane ? s.map(160, s.dEnd(160) + 6) : s.map(-120, s.dEnd(-120) + 6))}
      {L('ildo-primitiboa', 810, 240, s.at.groove)}
      {L('enbrioi-kanpoko-mesodermoa', pane ? 810 : 200, 245, edge(pane ? 1 : -1), 1, true)}
      {L('bitelo-zaku-sekundarioa', 810, 470, s.at.yolk)}
      {pane && (
        <Note x={500} y={606} tone="dim" size={11}>
          Erditik eskuineko ertzera (ezkerreko erdia berdina da, ispiluan)
        </Note>
      )}
    </g>
  );
}

export function MesodermTransverse(props: SceneProps) {
  return Transverse(props);
}

/** The transverse section framed for the dual pane: the midline and the right half, larger. */
function MesodermTransversePane(props: SceneProps) {
  return Transverse({ ...props, pane: true });
}

const ss = (v: number) => {
  const c = Math.max(0, Math.min(1, v));
  return c * c * (3 - 2 * c);
};

function Sagittal({ t, pane }: SceneProps & { pane?: boolean }) {
  const { s, g } = sagittalDisc(t);
  const mid = (x: number) => s.map(x, (s.base(x) + s.dEnd(x)) / 2);
  const pre = mid(X_PRE);
  const L = (id: string, x: number, y: number, p: Pt, show = 1, small = false) => <Label key={id} id={id} x={x} y={y} ax={p[0]} ay={p[1]} show={show} small={small} />;
  // In the dual pane all names sit in the right column: anchors that can be anywhere go on the caudal (right) side.
  const exL: Pt = [s.p.cx + (pane ? 1 : -1) * (s.rx + 8 * s.k) * Math.cos(0.55), s.cyA - (s.p.amnionH * s.k + 8 * s.k) * Math.sin(0.55)];
  return (
    <g>
      <rect x={0} y={0} width={1000} height={640} fill="#0f0f11" />
      <DiscDrawing s={s} ids={{ epiblast: 'ektodermoa' }} />
      <Arrow from={mid(40)} to={mid(lerp(20, -150, g.growth))} bend={0} color={C.mesoIntra} width={2.4} head={8} show={g.growth * (1 - seg(t, 0.46, 0.52))} />
      <Part id="mintz-bukofaringeoa" show={g.bucco}>
        <MembraneMark s={s} x={X_BUCCO} />
      </Part>
      <Part id="kloaka-mintza" show={g.cloaca}>
        <MembraneMark s={s} x={X_CLOACA} />
      </Part>
      <Part id="plaka-prekordala" show={g.prechordal}>
        <CellCluster s={s} x={X_PRE} color={C.prechordal} />
      </Part>
      <Note x={500} y={606} show={g.noVessels} tone="warn" size={11}>
        Mintzetan ez dago mesodermorik → ez dago odol-hodirik; geroago zulatu egingo dira (ahoa eta uzkia)
      </Note>

      {L('enbrioi-kanpoko-mesodermoa', 200, 130, exL, 1, true)}
      {L('ektodermoa', 190, 175, pane ? s.map(150, s.top(150) + 10) : s.at.epiblast)}
      {L('mintz-bukofaringeoa', 190, 215, s.map(X_BUCCO, s.top(X_BUCCO) + 6), g.bucco)}
      {L('plaka-prekordala', 190, 250, pre, g.prechordal)}
      {L('mesodermo-intraenbrionarioa', 198, 430, mid(pane ? 110 : lerp(120, -150, g.growth)), g.growth, true)}
      {L('endodermoa', 190, 470, s.map(150, s.dEnd(150) + 6))}
      {L('kloaka-mintza', 810, 430, s.map(X_CLOACA, s.dEnd(X_CLOACA) + 8), g.cloaca)}
    </g>
  );
}

export function MesodermSagittal(props: SceneProps) {
  return Sagittal(props);
}

/** The sagittal section for the dual pane: same drawing, free anchors moved next to the right-hand name column. */
function MesodermSagittalPane(props: SceneProps) {
  return Sagittal({ ...props, pane: true });
}

/** Both at once: from above with the cross-section (lateral spread) or with the sagittal section (cranial spread, membranes). */
export const MesodermBothTransverse = dual(
  { scene: MesodermDorsal, title: 'Goitik · goian kraneala', fx: 500, fy: 318, s: 0.56 },
  { scene: MesodermTransversePane, title: 'Zeharkako mozketa · goian dortsala', fx: 598, fy: 318, s: 0.8 },
);
export const MesodermBothSagittal = dual(
  { scene: MesodermDorsal, title: 'Goitik · goian kraneala', fx: 500, fy: 318, s: 0.56 },
  { scene: MesodermSagittalPane, title: 'Mozketa sagitala · ezkerrean kraneala', fx: 500, fy: 318, s: 0.575 },
);
