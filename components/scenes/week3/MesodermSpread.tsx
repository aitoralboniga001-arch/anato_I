'use client';

import { Arrow, C, Label, Note, Part, lerp, line, CellBand, seg, type Pt, type SceneProps } from '@/components/kit';
import { W3C, amnionArc, discOutlinePath, discX, f1, SAG, yolkArc } from './common';
import { CellCluster, DiscDrawing, MembraneMark, makeDisc } from './DiscSection';

/**
 * Intra-embryonic mesoderm spreads cranially and laterally from the streak until it is
 * continuous, at the disc edges, with the extra-embryonic mesoderm — except at the two membranes
 * (bucco-pharyngeal cranially, cloacal caudally) where ectoderm and endoderm stay fused because no
 * mesoderm ever reaches there. The prechordal plate appears cranial to the (future) notochord,
 * caudal to the bucco-pharyngeal membrane.
 * t (both views): 0–.2 extra-embryonic mesoderm ring · .1–.75 mesoderm spreads from the streak ·
 *    .55–.7 the two membranes stand out as mesoderm-free gaps · .7–.85 prechordal plate.
 */
const D = { cx: 500, cy: 320, rx: 190, ry: 145 };
const SRC: Pt = [D.cx, D.cy + 40];
const CRANIAL: Pt = [D.cx, D.cy - D.ry + 14];
const CAUDAL: Pt = [D.cx, D.cy + D.ry - 14];
const MEMBR_R = 17;

function DorsalDrawing({ t }: SceneProps) {
  const outline = discOutlinePath(D.cx, D.cy, D.rx, D.rx, D.ry, D.ry);
  const exMeso = seg(t, 0, 0.2);
  const growth = seg(t, 0.1, 0.75);
  const membranes = seg(t, 0.55, 0.7);
  const prechordal = seg(t, 0.7, 0.85);
  const revealR = lerp(24, 430, growth);

  return (
    <g>
      <rect x={0} y={0} width={1000} height={640} fill="#0c1220" />

      <Part id="enbrioi-kanpoko-mesodermoa" show={exMeso}>
        <path d={discOutlinePath(D.cx, D.cy, D.rx + 22, D.rx + 22, D.ry + 22, D.ry + 22)} fill={W3C.mesoExtra} opacity={0.35} />
      </Part>

      <path d={outline} fill="#1a2540" />
      <Part id="ektodermoa" quiet>
        <path d={outline} fill={C.epiblast} opacity={0.18} />
      </Part>

      <mask id="w3-meso-reveal">
        <rect x={0} y={0} width={1000} height={640} fill="#000" />
        <circle cx={SRC[0]} cy={SRC[1]} r={revealR} fill="#fff" />
      </mask>
      <g mask="url(#w3-meso-reveal)">
        <path d={outline} fill="none" />
        <clipPath id="w3-disc-clip">
          <path d={outline} />
        </clipPath>
        <g clipPath="url(#w3-disc-clip)">
          <Part id="mesodermo-intraenbrionarioa">
            <rect x={D.cx - D.rx - 10} y={D.cy - D.ry - 10} width={2 * D.rx + 20} height={2 * D.ry + 20} fill="url(#w3-meso-intra-dorsal)" />
            <circle cx={CRANIAL[0]} cy={CRANIAL[1]} r={MEMBR_R} fill="#0c1220" opacity={membranes} />
            <circle cx={CAUDAL[0]} cy={CAUDAL[1]} r={MEMBR_R} fill="#0c1220" opacity={membranes} />
          </Part>
        </g>
      </g>

      <Part id="mintz-bukofaringeoa" show={membranes}>
        <circle cx={CRANIAL[0]} cy={CRANIAL[1]} r={MEMBR_R - 3} fill="#dfe6f7" opacity={0.85} />
      </Part>
      <Part id="kloaka-mintza" show={membranes}>
        <circle cx={CAUDAL[0]} cy={CAUDAL[1]} r={MEMBR_R - 3} fill="#dfe6f7" opacity={0.85} />
      </Part>

      <Part id="plaka-prekordala" show={prechordal}>
        <ellipse cx={CRANIAL[0]} cy={CRANIAL[1] + MEMBR_R + 14} rx={20} ry={12} fill={W3C.prechordal} opacity={0.92} />
      </Part>

      <path d={outline} fill="none" stroke="rgba(232,238,252,0.3)" strokeWidth={1.4} />
    </g>
  );
}

function dorsalLabels(t: number) {
  const exMeso = seg(t, 0, 0.2);
  const growth = seg(t, 0.1, 0.75);
  const membranes = seg(t, 0.55, 0.7);
  const prechordal = seg(t, 0.7, 0.85);
  const L = (id: string, x: number, y: number, p: Pt, show = 1) => <Label key={id} id={id} x={x} y={y} ax={p[0]} ay={p[1]} show={show} />;
  return (
    <>
      {L('enbrioi-kanpoko-mesodermoa', 190, 150, [D.cx, D.cy - D.ry - 11], exMeso)}
      {L('mesodermo-intraenbrionarioa', 190, 220, [D.cx - D.rx * 0.55, D.cy], growth)}
      {L('mintz-bukofaringeoa', 810, 245, CRANIAL, membranes)}
      {L('plaka-prekordala', 810, 280, [CRANIAL[0] + 16, CRANIAL[1] + MEMBR_R + 14], prechordal)}
      {L('kloaka-mintza', 810, 470, CAUDAL, membranes)}
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
 * Fade-in windows end at the beats (.42 front at the cranial end, .6 / .68 membranes, .86 prechordal plate).
 */
const X_BUCCO = -238;
const X_CLOACA = 246;
const X_PRE = -196;

function sagittalGeometry(t: number) {
  return {
    growth: seg(t, 0.1, 0.42),
    bucco: seg(t, 0.54, 0.6),
    cloaca: seg(t, 0.62, 0.68),
    noVessels: seg(t, 0.72, 0.78) * (1 - seg(t, 0.82, 0.86)),
    prechordal: seg(t, 0.8, 0.86),
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
      <rect x={0} y={0} width={1000} height={640} fill="#0c1220" />
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
