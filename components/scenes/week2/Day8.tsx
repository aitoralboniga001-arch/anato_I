'use client';

import {
  C,
  Arrow,
  Cell,
  CellBand,
  Label,
  Part,
  ellipseArc,
  lerp,
  seg,
  smoothPath,
  zoom,
  type Pt,
  type SceneProps,
} from '@/components/kit';
import {
  CYTO,
  EPI_TOP,
  Endometrium,
  INNER,
  R,
  TrapBand,
  W2,
  chord,
  discGeometry,
  f1,
  lensPath,
  type DiscGeo,
} from './common';

/**
 * 8. eguna — blastocyst partially embedded (abembryonic third still in the uterine lumen).
 * t: 0–.20 trophoblast → cyto + syncytio · .24–.36 embryoblast → epiblast + hypoblast
 *    .47–.58 vacuoles between epiblast cells merge into the amniotic cavity; .62–.70 the epiblast cells
 *    next to the cytotrophoblast become amnioblasts · .74–.86 oedematous endometrium.
 *    Each window ends before its step's complete frame (next beat − 0.035).
 *
 * Disc geometry (all relative to the blastocyst centre): the dorsal (amniotic) side faces the
 * embryonic pole, which is the deepest point in the stroma. The disc and the amnion fill the
 * embryonic pole wall-to-wall: the blastocele is only ventral to the hypoblast.
 */
function geometry(t: number) {
  return discGeometry(W2.cx, lerp(478, 466, seg(t, 0, 1)));
}

function syncytioPath(cx: number, cy: number, grow: number) {
  const a0 = 160;
  const a1 = 380;
  const maxTh = lerp(18, 66, grow);
  const outer: Pt[] = [];
  const inner: Pt[] = [];
  const n = 56;
  for (let i = 0; i <= n; i++) {
    const a = a0 + ((a1 - a0) * i) / n;
    const prof = Math.pow(Math.sin(((a - a0) / (a1 - a0)) * Math.PI), 0.8);
    // Finger-like invasive fronts into the stroma.
    const fingers = 1 + 0.22 * Math.sin((a * Math.PI) / 11) + 0.12 * Math.sin((a * Math.PI) / 5.3);
    const th = maxTh * prof * fingers;
    const r = (a * Math.PI) / 180;
    outer.push([cx + (R + th) * Math.cos(r), cy + (R + th) * Math.sin(r)]);
    inner.push([cx + (R - 0.5) * Math.cos(r), cy + (R - 0.5) * Math.sin(r)]);
  }
  const back = inner
    .reverse()
    .map((p) => `L${f1(p[0])},${f1(p[1])}`)
    .join('');
  return `${smoothPath(outer, false)}${back}Z`;
}

type Geo = DiscGeo;

/** Epiblast cells packed between the disc and the cytotrophoblast, before the amniotic cavity opens. */
function lensCells({ cx, cy, epiTop }: Geo): Pt[] {
  const pts: Pt[] = [];
  for (let row = 0; ; row++) {
    const y = cy - INNER + 9 + row * 11;
    if (y > epiTop - 4) break;
    const half = chord(y - cy) - 7;
    const count = Math.max(1, Math.floor((2 * half) / 12) + 1);
    for (let i = 0; i < count; i++) pts.push([count === 1 ? cx : cx - half + (2 * half * i) / (count - 1), y]);
  }
  return pts;
}

function Day8Drawing({ t }: SceneProps) {
  const g = geometry(t);
  const { cx, cy, epiTop, discY, hypoBottom, wEpiTop, wDisc, wHypo } = g;
  const syn = seg(t, 0, 0.2);
  const disc = seg(t, 0.24, 0.36);
  const vac = seg(t, 0.47, 0.52) * (1 - seg(t, 0.54, 0.58));
  const cavity = seg(t, 0.49, 0.58);
  const amnion = seg(t, 0.62, 0.7);
  const endo = seg(t, 0.74, 0.86);
  const mitosis = seg(t, 0.12, 0.2);
  const gap = Math.sqrt(Math.max(0, R * R - (W2.surfaceY - cy) ** 2)) + 6;

  // Cells leaving the cytotrophoblast and fusing into the syncytium (they lose their membranes).
  const migrants = [-128, -96, -64, -38].map((deg, i) => {
    const k = ((t * 4 + i * 0.27) % 1 + 1) % 1;
    const r = (deg * Math.PI) / 180;
    const dist = lerp(R - 4, R + 26, k);
    return { x: cx + dist * Math.cos(r), y: cy + dist * Math.sin(r), o: (1 - k) * (1 - seg(t, 0.3, 0.4)) * syn };
  });

  // Two cytotrophoblast cells dividing (mitosis) during the second beat.
  const dividing = [248, 292].map((deg) => {
    const a = (deg * Math.PI) / 180;
    const rr = R - CYTO / 2;
    const tx = -Math.sin(a);
    const ty = Math.cos(a);
    const sep = 5.5 * mitosis;
    const x = cx + rr * Math.cos(a);
    const y = cy + rr * Math.sin(a);
    return { a: [x - tx * sep, y - ty * sep] as Pt, b: [x + tx * sep, y + ty * sep] as Pt, o: Math.sin(Math.PI * mitosis) };
  });

  // Embryoblast cluster before it splits into two layers: rows hug the inner wall at the embryonic pole.
  const cluster: Pt[] = [];
  for (let row = 0; row < 4; row++) {
    const y = cy - INNER + 13 + row * 17;
    const half = chord(y - cy) - 15;
    const count = Math.min(9, Math.floor((2 * half) / 19) + 1);
    for (let i = 0; i < count; i++) cluster.push([cx + (i - (count - 1) / 2) * 19, y]);
  }

  const lens = lensPath(g);
  const edge = (Math.asin(-EPI_TOP / INNER) * 180) / Math.PI;

  return (
    <g>
      <Endometrium gap={gap} secretion={endo} vesselScale={lerp(1, 1.45, endo)}>
        {/* Oedema: fluid accumulates between stromal cells. */}
        <rect x={0} y={0} width={1000} height={W2.surfaceY} fill="#fff" opacity={0.13 * endo} pointerEvents="none" />
      </Endometrium>

      <Part id="blastozelea">
        <circle cx={cx} cy={cy} r={INNER} fill="#1b2437" />
        <circle cx={cx} cy={cy} r={INNER} fill={C.blastocele} />
      </Part>

      <Part id="sinzitiotrofoblastoa">
        <path d={syncytioPath(cx, cy, syn)} fill="url(#p-syncytio)" stroke={C.syncytioDeep} strokeWidth={1.4} />
      </Part>

      <Part id="zitotrofoblastoa">
        <CellBand curve={ellipseArc(cx, cy, R, R, 0, 360)} n={44} thickness={CYTO} color={C.cyto} inward shape="cuboidal" />
        {migrants.map((m, i) => (
          <Cell key={i} x={m.x} y={m.y} r={6} color={C.cyto} opacity={m.o} />
        ))}
        {dividing.map((d, i) => (
          <g key={`m${i}`} opacity={d.o}>
            <Cell x={d.a[0]} y={d.a[1]} r={4.6} color="#b6f0c4" nucleus="rgba(20,60,35,0.8)" nucleusScale={0.45} />
            <Cell x={d.b[0]} y={d.b[1]} r={4.6} color="#b6f0c4" nucleus="rgba(20,60,35,0.8)" nucleusScale={0.45} />
          </g>
        ))}
      </Part>

      <Part id="enbrioblastoa" show={1 - disc}>
        {cluster.map(([x, y], i) => (
          <Cell key={i} x={x} y={y} r={9.5} color={C.embryoblast} />
        ))}
      </Part>

      {/* Epiblast cells filling the pole: the amniotic cavity will open between them. */}
      <Part id="epiblastoa" show={disc * (1 - cavity)}>
        <path d={lens} fill={C.epiblast} opacity={0.55} />
        {lensCells(g).map(([x, y], i) => (
          <Cell key={i} x={x} y={y} r={5.6} color="#6f9cf2" nucleus="rgba(20,24,40,0.5)" />
        ))}
      </Part>

      {/* Small vacuoles between epiblast cells that merge into the amniotic cavity. */}
      <g opacity={vac} pointerEvents="none">
        {[-40, -14, 14, 40].map((dx, i) => (
          <ellipse key={i} cx={cx + dx} cy={epiTop - 12 + (i % 2) * 5} rx={lerp(3, 8, vac)} ry={lerp(2, 4.5, vac)} fill="#dbe8ff" stroke="#9ebcf0" strokeWidth={0.8} />
        ))}
      </g>

      <Part id="amnios-barrunbea" show={cavity}>
        <path d={lens} fill="#6d9be6" opacity={0.42} />
        <path d={lens} fill="url(#g-cavity)" />
      </Part>

      <Part id="amnioblastoak" show={amnion}>
        <CellBand curve={ellipseArc(cx, cy, INNER, INNER, 180 + edge, 360 - edge)} n={14} thickness={5} color={C.amnioblast} shape="squamous" inward />
      </Part>

      <Part id="epiblastoa" show={disc}>
        <TrapBand cx={cx} yTop={epiTop} yBottom={discY} wTop={wEpiTop} wBottom={wDisc} n={15} color={C.epiblast} shape="columnar" />
      </Part>
      <Part id="hipoblastoa" show={disc}>
        <TrapBand cx={cx} yTop={discY} yBottom={hypoBottom} wTop={wDisc} wBottom={wHypo} n={17} color={C.hypoblast} shape="cuboidal" />
      </Part>

      {/* Outline of the bilaminar disc (stroke only, so it does not steal clicks from the layers). */}
      <Part id="bi-orriko-diskoa" show={disc}>
        <path
          d={`M${f1(cx - wEpiTop)},${f1(epiTop)} L${f1(cx + wEpiTop)},${f1(epiTop)} L${f1(cx + wHypo)},${f1(hypoBottom)} L${f1(cx - wHypo)},${f1(hypoBottom)}Z`}
          fill="none"
          stroke="#e8eefc"
          strokeWidth={1.1}
          strokeDasharray="3 3"
          opacity={0.75}
        />
      </Part>
    </g>
  );
}

function day8Labels(t: number, at: (x: number, y: number) => [number, number], closeUp: boolean) {
  const { cx, cy, epiTop, discY, hypoBottom, wDisc } = geometry(t);
  const disc = seg(t, 0.24, 0.36);
  const cavityShow = seg(t, 0.49, 0.58);
  const amnion = seg(t, 0.62, 0.7);
  const L = (id: string, x: number, y: number, p: [number, number], show = 1) => {
    const [ax, ay] = at(p[0], p[1]);
    return <Label key={id} id={id} x={x} y={y} ax={ax} ay={ay} show={show} />;
  };
  // Anchors computed so they sit inside their structure at every t.
  const onArc = (deg: number, r: number): [number, number] => [cx + r * Math.cos((deg * Math.PI) / 180), cy + r * Math.sin((deg * Math.PI) / 180)];
  const amnioblast = onArc(292, INNER - 2.5);
  const cavity: [number, number] = [cx - 20, (cy - INNER + epiTop) / 2 + 4];
  const epi: [number, number] = [cx + 40, (epiTop + discY) / 2];
  const hypo: [number, number] = [cx + 52, (discY + hypoBottom) / 2];
  const discEdge: [number, number] = [cx - wDisc * 0.6, discY];

  if (closeUp) {
    return (
      <>
        {L('sinzitiotrofoblastoa', 180, 70, synAnchor(t, 245))}
        {L('zitotrofoblastoa', 180, 140, onArc(232, R - CYTO / 2))}
        {L('enbrioblastoa', 180, 250, [cx - 20, cy - INNER + 30], 1 - disc)}
        {L('bi-orriko-diskoa', 180, 420, discEdge, disc)}
        {L('blastozelea', 180, 540, [cx - 30, cy + 10])}
        {L('amnioblastoak', 800, 250, amnioblast, amnion)}
        {L('amnios-barrunbea', 800, 300, cavity, cavityShow)}
        {L('epiblastoa', 800, 350, epi, disc)}
        {L('hipoblastoa', 800, 420, hypo, disc)}
      </>
    );
  }
  return (
    <>
      {L('endometrio-estroma', 190, 60, [300, 60])}
      {L('umetoki-guruina', 190, 150, [262, 250])}
      {L('sinzitiotrofoblastoa', 190, 250, synAnchor(t, 212))}
      {L('zitotrofoblastoa', 190, 330, onArc(190, R - CYTO / 2))}
      {L('blastozelea', 190, 420, [cx - 30, cy + 30])}
      {L('endometrio-epitelioa', 190, 482, [300, W2.surfaceY - 8])}
      {L('amaren-odol-hodiak', 790, 80, [612, 84])}
      {L('mutur-enbrionarioa', 810, 244, onArc(276, R - CYTO / 2))}
      {L('amnioblastoak', 810, 290, amnioblast, amnion)}
      {L('amnios-barrunbea', 810, 330, cavity, cavityShow)}
      {L('enbrioblastoa', 810, 330, [cx + 24, cy - INNER + 30], 1 - disc)}
      {L('epiblastoa', 810, 370, epi, disc)}
      {L('hipoblastoa', 810, 410, hypo, disc)}
      {L('blastozistoa', 810, 490, onArc(42, R - CYTO / 2))}
      {L('mutur-anenbrionarioa', 810, 548, [cx + 26, cy + R - 4])}
      {L('umetoki-barrunbea', 810, 600, [720, 600])}
    </>
  );
}

/** A point in the middle of the syncytiotrophoblast at angle `deg`, whatever its current thickness. */
function synAnchor(t: number, deg: number): [number, number] {
  const { cx, cy } = geometry(t);
  const prof = Math.pow(Math.sin(((deg - 160) / 220) * Math.PI), 0.8);
  const r = R + 0.45 * lerp(18, 66, seg(t, 0, 0.2)) * prof;
  const a = (deg * Math.PI) / 180;
  return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
}

export function Day8Section(props: SceneProps) {
  const id = (x: number, y: number): [number, number] => [x, y];
  return (
    <g>
      <Day8Drawing {...props} />
      {day8Labels(props.t, id, false)}
    </g>
  );
}

export function Day8Disc(props: SceneProps) {
  const { t } = props;
  const { cx, cy, epiTop, hypoBottom } = geometry(t);
  const z = zoom(cx, cy - 72, 2.6, 500, 300);
  // Dorso-ventral polarity (last beat): dorsal = epiblast / amnion side, ventral = hypoblast / blastocele side.
  const pol = seg(t, 0.88, 0.96);
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
    </g>
  );
}
