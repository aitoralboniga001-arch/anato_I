'use client';

import { C, CellBand, Label, Note, Part, lerp, line, seg, smoothPath, zoom, type Pt, type SceneProps } from '@/components/kit';
import { cleavageFrame } from '@/components/shell/intro/cleavage';
import { Hud, vis } from './common';
import { Conceptus, ConceptusDefs } from './conceptus';

/**
 * 4.5 Blastozistoaren habiratze-prozesua (6. eguna). First the whole uterine wall — endometrium
 * (inner), myometrium (muscular, middle) and perimetrium (outer) — then a close-up of the
 * endometrial surface: the blastocyst approaches with its embryonic pole and the trophoblast
 * cells next to the embryoblast settle between the epithelial cells of the endometrium.
 * Same histology language as week 2 (which continues this process on day 8).
 */

const SURF = 500; // endometrial surface (local)
const MYO_TOP = -112;
const MYO_BOTTOM = 196;
const SB = 0.62; // blastocyst scale (local)
const RB = 138 * SB;
const ROT = 43; // embryonic pole up, towards the endometrium

const GLANDS: Pt[][] = [
  [[150, SURF - 12], [162, 440], [144, 380], [160, 320], [148, 262], [158, 214]],
  [[372, SURF - 12], [382, 452], [362, 400], [380, 350], [366, 300], [376, 240]],
  [[640, SURF - 12], [632, 446], [652, 392], [636, 340], [648, 288], [638, 226]],
  [[850, SURF - 12], [840, 450], [858, 396], [844, 334], [854, 270]],
];
const VESSELS: [number, number, number][] = [
  [330, 300, 1],
  [612, 262, 0.9],
  [640, 400, 0.8],
  [380, 420, 0.7],
  [160, 280, 0.8],
  [830, 330, 0.9],
];

export function Implantation({ t }: SceneProps) {
  const k = seg(t, 0.22, 0.42);
  const e = k * k * (3 - 2 * k);
  const z = zoom(500, lerp(300, 540, e), lerp(0.62, 1.75, e), 500, lerp(320, 300, e));

  // Blastocyst: approaches the surface, touches it with the embryonic pole, then settles.
  const cy = t < 0.45 ? lerp(SURF + RB + 170, SURF + RB + 12, seg(t, 0, 0.45)) : lerp(SURF + RB + 12, SURF + RB - 16, seg(t, 0.5, 0.78));
  const cx = lerp(560, 500, seg(t, 0, 0.45));
  const f = cleavageFrame(7, 0, 5);
  f.zonaO = 0;
  const gap = lerp(0, 20, seg(t, 0.62, 0.8));
  const wedge = seg(t, 0.64, 0.8);

  const P = (x: number, y: number) => z.at(x, y);
  const pole = P(cx, cy - RB + 6);
  const emb = P(cx - 10, cy - RB + 42);
  const cav = P(cx + 20, cy + 30);
  const tro = P(cx + RB * 0.78, cy + RB * 0.55);
  const epi = P(612, SURF - 8);
  const str = P(440, 420);
  const gland = P(640, 440);
  const layer = (y: number): Pt => P(1000, y);
  const over = vis(t, 0, 0.26);
  const close = seg(t, 0.4, 0.46);

  return (
    <g>
      <ConceptusDefs id="w1i" />
      <g mask="url(#m-slab)">
        <g transform={z.transform}>
          {/* Uterine cavity */}
          <Part id="umetoki-barrunbea" quiet>
            <rect x={-400} y={SURF} width={1800} height={700} fill="#1a1426" />
          </Part>
          {/* Wall: perimetrium, myometrium, endometrium */}
          <Part id="endometrioa">
            <rect x={-400} y={MYO_BOTTOM} width={1800} height={SURF - MYO_BOTTOM} fill="url(#p-stroma)" />
          </Part>
          <Part id="umetoki-guruina">
            {GLANDS.map((g, i) => {
              const d = smoothPath(g, false);
              return (
                <g key={i}>
                  <path d={d} fill="none" stroke={C.gland} strokeWidth={22} strokeLinecap="round" />
                  <path d={d} fill="none" stroke="#b9607a" strokeWidth={22} strokeLinecap="round" strokeDasharray="2 7" opacity={0.7} />
                  <path d={d} fill="none" stroke="#7a2f45" strokeWidth={5} strokeLinecap="round" />
                </g>
              );
            })}
          </Part>
          <Part id="amaren-odol-hodiak">
            {VESSELS.map(([x, y, s], i) => (
              <ellipse key={i} cx={x} cy={y} rx={13 * s} ry={8 * s} fill="url(#p-blood)" stroke="#8d1024" strokeWidth={1.4} />
            ))}
          </Part>
          <Part id="miometrioa">
            <rect x={-400} y={MYO_TOP} width={1800} height={MYO_BOTTOM - MYO_TOP} fill={C.myometrium} />
            <rect x={-400} y={MYO_TOP} width={1800} height={MYO_BOTTOM - MYO_TOP} fill="url(#p-muscle)" opacity={0.45} />
          </Part>
          <Part id="perimetrioa">
            <rect x={-400} y={MYO_TOP - 20} width={1800} height={20} fill={C.perimetrium} />
          </Part>

          {/* Blastocyst (zona pellucida already lost) */}
          <Part id="blastozistoa">
            <Conceptus f={f} x={cx} y={cy} s={SB} rot={ROT} mass={1} id="w1i" />
          </Part>
          {/* Trophoblast cells next to the embryoblast wedge between the epithelial cells. */}
          {wedge > 0.01 && (
            <Part id="trofoblastoa">
              {[-1, 1].map((sg) => (
                <ellipse
                  key={sg}
                  cx={cx + sg * (gap + 2)}
                  cy={SURF - 8 * wedge}
                  rx={5 + 3 * wedge}
                  ry={9 * wedge + 1}
                  fill={C.trophoblast}
                  stroke="rgba(10,40,20,0.55)"
                  strokeWidth={1}
                  opacity={wedge}
                />
              ))}
            </Part>
          )}
          <Part id="endometrio-epitelioa">
            <CellBand curve={line([-400, SURF], [cx - gap - 8 * wedge, SURF])} n={Math.round((cx - gap + 400) / 17)} thickness={16} color={C.epithelium} shape="columnar" />
            <CellBand curve={line([cx + gap + 8 * wedge, SURF], [1400, SURF])} n={Math.round((1400 - cx - gap) / 17)} thickness={16} color={C.epithelium} shape="columnar" />
          </Part>
        </g>
      </g>

      {/* Overview: the three layers of the uterine wall */}
      <Label id="perimetrioa" x={812} y={layer(MYO_TOP - 10)[1]} ax={layer(MYO_TOP - 10)[0] - 60} ay={layer(MYO_TOP - 10)[1]} align="start" show={over} />
      <Label id="miometrioa" x={812} y={layer(40)[1]} ax={layer(40)[0] - 60} ay={layer(40)[1]} align="start" show={over} />
      <Label id="endometrioa" x={812} y={layer(360)[1]} ax={layer(360)[0] - 60} ay={layer(360)[1]} align="start" show={over} />
      <Label id="umetoki-barrunbea" x={812} y={Math.min(600, layer(SURF + 60)[1])} ax={layer(SURF + 60)[0] - 60} ay={layer(SURF + 60)[1]} align="start" show={over} />
      <Label id="blastozistoa" x={150} y={560} ax={P(cx - RB, cy)[0]} ay={P(cx - RB, cy)[1]} show={vis(t, 0.1, 0.4)} />

      {/* Close-up */}
      <Label id="endometrio-epitelioa" x={812} y={262} ax={epi[0]} ay={epi[1]} align="start" show={close} />
      <Label id="endometrio-estroma" x={190} y={70} ax={str[0]} ay={str[1]} show={close} />
      <Label id="umetoki-guruina" x={812} y={150} ax={gland[0] + 10} ay={gland[1]} align="start" show={close} />
      <Label id="mutur-enbrionarioa" x={150} y={150} ax={pole[0] - 30} ay={pole[1]} show={vis(t, 0.45, 0.66)} />
      <Label id="habiratzea" x={150} y={150} ax={pole[0] - 22} ay={P(cx, SURF - 6)[1]} show={seg(t, 0.68, 0.74)} />
      <Label id="enbrioblastoa" x={150} y={420} ax={emb[0] - 10} ay={emb[1]} show={close} />
      <Label id="blastozelea" x={812} y={460} ax={cav[0]} ay={cav[1]} align="start" show={close} />
      <Label id="trofoblastoa" x={812} y={540} ax={tro[0]} ay={tro[1]} align="start" show={close} />

      <Note x={500} y={618} show={vis(t, 0, 0.2)}>Umetokiaren pareta: endometrioa, miometrioa, perimetrioa</Note>
      <Note x={500} y={618} tone="warn" show={vis(t, 0.2, 0.45)}>Normalean atzeko (edo aurreko) paretan, ez albokoetan</Note>
      <Note x={500} y={618} tone="accent" show={vis(t, 0.45, 0.66)}>Mutur enbrionarioa aurretik: enbrioblastoaren ondoko trofoblastoa</Note>
      <Note x={500} y={618} tone="accent" show={vis(t, 0.66, 0.84)}>Trofoblasto-zelulak zelula epitelialen artean inplantatzen dira</Note>
      <Note x={500} y={618} show={vis(t, 0.84)}>2. astean jarraitzen du (8. eguna →)</Note>

      <Hud value="6." unit=" eguna" caption="Ernalkuntzatik" />
    </g>
  );
}
