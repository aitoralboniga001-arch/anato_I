'use client';

import { Arrow, C, Label, Mark, Note, Part, lerp, line, CellBand, seg, type Pt, type SceneProps } from '@/components/kit';
import { W3C, amnionArc, discOutlinePath, discX, f1, SAG, yolkArc } from './common';
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
const D = { cx: 500, cy: 318, rx: 152, ry: 188 };
const STREAK: [Pt, Pt] = [[D.cx, D.cy + 10], [D.cx, D.cy + D.ry - 42]];
const CRANIAL: Pt = [D.cx, D.cy - D.ry + 14];
const CAUDAL: Pt = [D.cx, D.cy + D.ry - 14];
const MEMBR_R = 17;
const STREAK_W = 8;
const STREAK_D = `M${f1(D.cx - STREAK_W)},${f1(STREAK[1][1])} Q${f1(D.cx - STREAK_W * 1.3)},${f1((STREAK[0][1] + STREAK[1][1]) / 2)} ${f1(D.cx - STREAK_W * 0.4)},${f1(STREAK[0][1] + 4)} L${f1(D.cx + STREAK_W * 0.4)},${f1(STREAK[0][1] + 4)} Q${f1(D.cx + STREAK_W * 1.3)},${f1((STREAK[0][1] + STREAK[1][1]) / 2)} ${f1(D.cx + STREAK_W)},${f1(STREAK[1][1])} Q${f1(D.cx)},${f1(STREAK[1][1] + 7)} ${f1(D.cx - STREAK_W)},${f1(STREAK[1][1])}Z`;

function dorsalWindows(t: number) {
  return {
    exMeso: seg(t, 0, 0.12),
    growth: seg(t, 0.16, 0.52),
    bucco: seg(t, 0.6, 0.64),
    cloaca: seg(t, 0.68, 0.72),
    noVessels: seg(t, 0.78, 0.82) * (1 - seg(t, 0.84, 0.86)),
    prechordal: seg(t, 0.86, 0.92),
    push: seg(t, 0.16, 0.44) * (1 - seg(t, 0.5, 0.56)),
  };
}

function DorsalDrawing({ t }: SceneProps) {
  const outline = discOutlinePath(D.cx, D.cy, D.rx, D.rx, D.ry, D.ry);
  const { exMeso, growth, bucco, cloaca, noVessels, prechordal, push } = dorsalWindows(t);
  // The mesoderm leaves the streak (caudal half) and spreads cranially and laterally.
  const rev = { cx: D.cx, cy: lerp(STREAK[0][1] + 40, D.cy - 20, growth), rx: lerp(16, 420, growth), ry: lerp(58, 420, growth) };

  return (
    <g>
      <rect x={0} y={0} width={1000} height={640} fill="#0f0f11" />

      <Part id="enbrioi-kanpoko-mesodermoa" show={exMeso}>
        <path d={discOutlinePath(D.cx, D.cy, D.rx + 22, D.rx + 22, D.ry + 22, D.ry + 22)} fill={W3C.mesoExtra} opacity={0.3} />
        <path d={discOutlinePath(D.cx, D.cy, D.rx + 22, D.rx + 22, D.ry + 22, D.ry + 22)} fill="url(#p-meso-extra)" opacity={0.45} stroke="#c97a52" strokeOpacity={0.7} strokeWidth={1} />
      </Part>

      <path d={outline} fill="#1a2540" />
      <Part id="ektodermoa" quiet>
        <path d={outline} fill={C.epiblast} opacity={0.18} />
      </Part>

      <mask id="w3-meso-reveal">
        <rect x={0} y={0} width={1000} height={640} fill="#000" />
        <ellipse cx={rev.cx} cy={rev.cy} rx={rev.rx} ry={rev.ry} fill="#fff" />
      </mask>
      <g mask="url(#w3-meso-reveal)">
        <path d={outline} fill="none" />
        <clipPath id="w3-disc-clip">
          <path d={outline} />
        </clipPath>
        <g clipPath="url(#w3-disc-clip)">
          <Part id="mesodermo-intraenbrionarioa">
            <rect x={D.cx - D.rx - 10} y={D.cy - D.ry - 10} width={2 * D.rx + 20} height={2 * D.ry + 20} fill="url(#w3-meso-intra-dorsal)" />
            <ellipse cx={CRANIAL[0]} cy={CRANIAL[1]} rx={MEMBR_R + 4} ry={MEMBR_R - 1} fill="#1a2540" opacity={bucco} />
            <ellipse cx={CAUDAL[0]} cy={CAUDAL[1]} rx={MEMBR_R + 4} ry={MEMBR_R - 1} fill="#1a2540" opacity={cloaca} />
          </Part>
        </g>
      </g>

      {/* Primitive streak (a groove, widening caudally) and node with its pit, drawn as in the gastrulation view. */}
      <Part id="ildo-primitiboa">
        <path d={STREAK_D} fill="#0c1730" stroke="#93a7d9" strokeWidth={1.2} opacity={0.96} />
      </Part>
      <Part id="nodo-primitiboa">
        <ellipse cx={STREAK[0][0]} cy={STREAK[0][1] - 4} rx={13} ry={11} fill="#0c1730" stroke="#dbe4ff" strokeWidth={1.4} />
        <ellipse cx={STREAK[0][0]} cy={STREAK[0][1] - 4} rx={5} ry={4} fill="#02040a" />
      </Part>
      {[
        [STREAK[0][0], STREAK[0][1] + 20, STREAK[0][0], STREAK[0][1] - 90],
        [STREAK[0][0] - 10, STREAK[0][1] + 50, STREAK[0][0] - 130, STREAK[0][1] + 10],
        [STREAK[0][0] + 10, STREAK[0][1] + 50, STREAK[0][0] + 130, STREAK[0][1] + 10],
      ].map(([x0, y0, x1, y1], i) => (
        <Arrow key={i} from={[x0, y0]} to={[x1, y1]} bend={i === 0 ? 0 : i === 1 ? 0.12 : -0.12} color="#fde68a" width={2} head={8} show={push} progress={Math.min(1, push * 1.4)} />
      ))}

      <Part id="mintz-bukofaringeoa" show={bucco}>
        <ellipse cx={CRANIAL[0]} cy={CRANIAL[1]} rx={MEMBR_R + 1} ry={MEMBR_R - 4} fill="rgba(223,230,247,0.5)" stroke="#dfe6f7" strokeWidth={1.4} />
      </Part>
      <Part id="kloaka-mintza" show={cloaca}>
        <ellipse cx={CAUDAL[0]} cy={CAUDAL[1]} rx={MEMBR_R + 1} ry={MEMBR_R - 4} fill="rgba(223,230,247,0.5)" stroke="#dfe6f7" strokeWidth={1.4} />
      </Part>

      <Part id="plaka-prekordala" show={prechordal}>
        <ellipse cx={CRANIAL[0]} cy={CRANIAL[1] + MEMBR_R + 14} rx={20} ry={12} fill={W3C.prechordal} opacity={0.92} stroke="rgba(255,255,255,0.45)" strokeWidth={1} />
      </Part>

      <path d={outline} fill="none" stroke="rgba(232,238,252,0.3)" strokeWidth={1.4} />

      {/* No mesoderm → no vessels: both membranes will later break down (mouth and cloaca openings). */}
      <Mark id="mintz-bukofaringeoa" x={CRANIAL[0]} y={CRANIAL[1]} rx={MEMBR_R + 12} show={noVessels} />
      <Mark id="kloaka-mintza" x={CAUDAL[0]} y={CAUDAL[1]} rx={MEMBR_R + 12} show={noVessels} />
    </g>
  );
}

function dorsalLabels(t: number) {
  const { exMeso, growth, bucco, cloaca, prechordal } = dorsalWindows(t);
  const L = (id: string, x: number, y: number, p: Pt, show = 1) => <Label key={id} id={id} x={x} y={y} ax={p[0]} ay={p[1]} show={show} />;
  return (
    <>
      {L('enbrioi-kanpoko-mesodermoa', 190, 150, [D.cx, D.cy - D.ry - 11], exMeso)}
      {L('mesodermo-intraenbrionarioa', 190, 220, [D.cx - D.rx * 0.55, D.cy], growth)}
      {L('ildo-primitiboa', 810, 400, [STREAK[0][0] + 3, (STREAK[0][1] + STREAK[1][1]) / 2])}
      {L('nodo-primitiboa', 810, 350, [STREAK[0][0] + 8, STREAK[0][1] - 4])}
      {L('mintz-bukofaringeoa', 810, 245, CRANIAL, bucco)}
      {L('plaka-prekordala', 810, 295, [CRANIAL[0] + 16, CRANIAL[1] + MEMBR_R + 14], prechordal)}
      {L('kloaka-mintza', 810, 490, CAUDAL, cloaca)}
    </>
  );
}

export function MesodermDorsal(props: SceneProps) {
  return (
    <g>
      <defs>
        <pattern id="w3-meso-intra-dorsal" width={18} height={16} patternUnits="userSpaceOnUse">
          <rect width={18} height={16} fill={C.mesoIntra} />
          <circle cx={4} cy={4} r={1.7} fill="#b62a33" />
          <circle cx={13} cy={7} r={1.7} fill="#b62a33" />
          <circle cx={7} cy={12} r={1.7} fill="#b62a33" />
        </pattern>
      </defs>
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

const ss = (v: number) => {
  const c = Math.max(0, Math.min(1, v));
  return c * c * (3 - 2 * c);
};

export function MesodermSagittal({ t }: SceneProps) {
  const { s, g } = sagittalDisc(t);
  const mid = (x: number) => s.map(x, (s.base(x) + s.dEnd(x)) / 2);
  const pre = mid(X_PRE);
  const L = (id: string, x: number, y: number, p: Pt, show = 1, small = false) => <Label key={id} id={id} x={x} y={y} ax={p[0]} ay={p[1]} show={show} small={small} />;
  const exL: Pt = [s.p.cx - (s.rx + 8 * s.k) * Math.cos(0.55), s.cyA - (s.p.amnionH * s.k + 8 * s.k) * Math.sin(0.55)];
  return (
    <g>
      <rect x={0} y={0} width={1000} height={640} fill="#0f0f11" />
      <DiscDrawing s={s} ids={{ epiblast: 'ektodermoa' }} />
      <Arrow from={mid(40)} to={mid(lerp(20, -150, g.growth))} bend={0} color="#fde68a" width={1.8} head={7} show={g.growth * (1 - seg(t, 0.46, 0.52))} />
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

      {L('enbrioi-kanpoko-mesodermoa', 190, 130, exL, 1, true)}
      {L('ektodermoa', 190, 175, s.at.epiblast)}
      {L('mintz-bukofaringeoa', 190, 215, s.map(X_BUCCO, s.top(X_BUCCO) + 6), g.bucco)}
      {L('plaka-prekordala', 190, 250, pre, g.prechordal)}
      {L('mesodermo-intraenbrionarioa', 190, 430, mid(120), g.growth)}
      {L('endodermoa', 190, 470, s.map(-120, s.dEnd(-120) + 6))}
      {L('kloaka-mintza', 810, 430, s.map(X_CLOACA, s.dEnd(X_CLOACA) + 8), g.cloaca)}
    </g>
  );
}
