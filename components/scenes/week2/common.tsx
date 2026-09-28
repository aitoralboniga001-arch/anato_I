'use client';

import { C, CellBand, Part, lerp, line, smoothPath, type Pt } from '@/components/kit';

/**
 * Shared geometry for week-2 implantation sections (Langman orientation):
 * endometrial stroma on top, uterine lumen at the bottom, the blastocyst sinking upwards
 * with its embryonic pole (disc, amnion) deepest in the stroma.
 */
export const W2 = {
  cx: 500,
  /** y of the endometrial epithelium surface (lumen is below). */
  surfaceY: 500,
  epiThickness: 16,
} as const;

interface EndometriumProps {
  /** Half-width of the gap in the epithelium where the blastocyst sits (0 = intact epithelium). */
  gap: number;
  /** 0..1 oedema / decidual look of the stroma. */
  decidua?: number;
  /** 0..1 gland secretion (glycogen & mucus). */
  secretion?: number;
  /** Vessel scale (1 = normal capillaries, ~2 = dilated, sinusoids handled by the stage). */
  vesselScale?: number;
  /** Optional per-vessel opacity (index into VESSELS), e.g. vessels the blastocyst grows over. */
  vesselFade?: readonly number[];
  /** Extra content rendered inside the slab mask, above stroma (e.g. sinusoids). */
  children?: React.ReactNode;
}

const GLANDS: Pt[][] = [
  [[262, 500], [272, 452], [252, 400], [270, 350], [256, 300], [266, 250]],
  [[742, 500], [734, 446], [754, 392], [738, 340], [750, 288]],
];

export const VESSELS: [number, number, number][] = [
  [330, 118, 1],
  [612, 84, 0.9],
  [700, 196, 1.1],
  [300, 248, 0.8],
  [690, 330, 0.9],
  [388, 292, 0.7],
  [455, 60, 0.8],
  [560, 200, 0.7],
];

/** Endometrium background: stroma, glands, capillaries and surface epithelium (with a gap). */
export function Endometrium({ gap, decidua = 0, secretion = 0, vesselScale = 1, vesselFade, children }: EndometriumProps) {
  const { surfaceY, epiThickness, cx } = W2;
  return (
    <g mask="url(#m-slab)">
      <Part id="endometrio-estroma" quiet>
        <rect x={0} y={0} width={1000} height={surfaceY} fill="url(#p-stroma)" />
        {decidua > 0 && <rect x={0} y={0} width={1000} height={surfaceY} fill="url(#p-decidua)" opacity={decidua} />}
      </Part>

      <Part id="umetoki-guruina">
        {GLANDS.map((g, i) => {
          const d = smoothPath(g, false);
          return (
            <g key={i}>
              <path d={d} fill="none" stroke={C.gland} strokeWidth={22} strokeLinecap="round" />
              <path d={d} fill="none" stroke="#b9607a" strokeWidth={22} strokeLinecap="round" strokeDasharray="2 7" opacity={0.7} />
              <path d={d} fill="none" stroke="#7a2f45" strokeWidth={5} strokeLinecap="round" />
              {secretion > 0 &&
                [0.2, 0.45, 0.7, 0.9].map((k, j) => {
                  const p = g[Math.min(g.length - 1, Math.round(k * (g.length - 1)))];
                  return <circle key={j} cx={p[0]} cy={p[1]} r={3.2 * secretion} fill="#fff4d6" opacity={0.9 * secretion} />;
                })}
            </g>
          );
        })}
      </Part>

      <Part id="amaren-odol-hodiak">
        {VESSELS.map(([x, y, s], i) => (
          <g key={i} opacity={vesselFade?.[i]}>
            <ellipse cx={x} cy={y} rx={13 * s * vesselScale} ry={8 * s * vesselScale} fill="url(#p-blood)" stroke="#8d1024" strokeWidth={1.4} />
          </g>
        ))}
      </Part>

      {children}

      <Part id="endometrio-epitelioa">
        <CellBand curve={line([0, surfaceY], [cx - gap, surfaceY])} n={Math.max(1, Math.round((cx - gap) / 17))} thickness={epiThickness} color={C.epithelium} shape="columnar" />
        <CellBand curve={line([cx + gap, surfaceY], [1000, surfaceY])} n={Math.max(1, Math.round((1000 - cx - gap) / 17))} thickness={epiThickness} color={C.epithelium} shape="columnar" />
      </Part>

      <Part id="umetoki-barrunbea" quiet>
        <rect x={0} y={surfaceY + 1} width={1000} height={640 - surfaceY} fill="#1a1426" />
        <rect x={0} y={surfaceY + 1} width={1000} height={640 - surfaceY} fill="url(#g-shade)" opacity={0.4} />
      </Part>
    </g>
  );
}

/**
 * Blastocyst & bilaminar-disc geometry shared by days 8–13 (all relative to the blastocyst centre).
 * The dorsal (amniotic) side faces the embryonic pole, which is the deepest point in the stroma.
 */
export const R = 118;
export const CYTO = 12;
export const INNER = R - CYTO;
/** Offsets from the centre (negative = towards the embryonic pole). */
export const EPI_TOP = -72;
export const DISC = -48;
export const HYPO_BOTTOM = -38;

/**
 * Days 11–13: the trophoblast shell (radius `Rc`, centre `cyC`) grows much faster than the embryo
 * complex (amnion + disc + yolk sac, radius INNER, centre `cy`). The complex stays hung from the
 * connecting stalk at the embryonic pole, so the chorionic cavity opens as a wide crescent around it.
 */
export function conceptusAt(Rc: number, gap = 10) {
  const cyC = W2.surfaceY - gap - Rc;
  const D = Math.max(0, Rc - CYTO - INNER);
  const stalk = Math.min(D, 4 + 0.28 * D);
  return { cyC, cy: cyC + stalk - D, D, stalk };
}

const rad = (deg: number) => (deg * Math.PI) / 180;

/** Distance from the embryo-complex centre (cy), along angle `a`, to the cytotrophoblast's inner surface. */
export function toCyto(cy: number, cyC: number, Rc: number, a: number) {
  const dy = cyC - cy;
  const b = dy * Math.sin(rad(a));
  const ro = Rc - CYTO;
  return b + Math.sqrt(Math.max(0, b * b - dy * dy + ro * ro));
}

/** A band around the embryo-complex centre whose inner and outer radii may vary with the angle. */
export function bandAround(cx: number, cy: number, r0: (a: number) => number, r1: (a: number) => number, a0: number, a1: number, step = 2) {
  const n = Math.max(2, Math.ceil(Math.abs(a1 - a0) / step));
  const at = (a: number, r: number) => `${f1(cx + r * Math.cos(rad(a)))},${f1(cy + r * Math.sin(rad(a)))}`;
  const outer: string[] = [];
  const inner: string[] = [];
  for (let i = 0; i <= n; i++) {
    const a = a0 + ((a1 - a0) * i) / n;
    outer.push(at(a, r1(a)));
    inner.push(at(a, r0(a)));
  }
  return `M${[...outer, ...inner.reverse()].join(' L')}Z`;
}

/** A full circle as two half-arcs (a single 360° arc has coincident end points and SVG drops it). */
export const circlePath = (cx: number, cy: number, r: number, sweep = 1) =>
  `M${f1(cx + r)},${f1(cy)} A${r} ${r} 0 1 ${sweep} ${f1(cx - r)},${f1(cy)} A${r} ${r} 0 1 ${sweep} ${f1(cx + r)},${f1(cy)}Z`;

/** Half-width of the blastocyst's inner cavity at vertical offset `dy` from the centre. */
export const chord = (dy: number) => Math.sqrt(Math.max(0, INNER * INNER - dy * dy));

export const f1 = (v: number) => v.toFixed(1);

/** Disc landmarks for a blastocyst centred at (cx, cy). */
export function discGeometry(cx: number, cy: number) {
  return {
    cx,
    cy,
    epiTop: cy + EPI_TOP,
    discY: cy + DISC,
    hypoBottom: cy + HYPO_BOTTOM,
    /** Half-widths where each layer meets the cytotrophoblast. */
    wEpiTop: chord(EPI_TOP) - 0.5,
    wDisc: chord(DISC) - 0.5,
    wHypo: chord(HYPO_BOTTOM) - 0.5,
  };
}

export type DiscGeo = ReturnType<typeof discGeometry>;

/** Region between the cytotrophoblast (embryonic pole) and the top of the epiblast (amniotic cavity). */
export function lensPath({ cx, epiTop, wEpiTop }: DiscGeo) {
  return `M${f1(cx - wEpiTop)},${f1(epiTop)} A${INNER} ${INNER} 0 0 1 ${f1(cx + wEpiTop)},${f1(epiTop)} Z`;
}

/** Row of cells whose top and bottom edges have different widths, so the layer meets a curved wall. */
export function TrapBand({
  cx,
  yTop,
  yBottom,
  wTop,
  wBottom,
  n,
  color,
  shape,
}: {
  cx: number;
  yTop: number;
  yBottom: number;
  wTop: number;
  wBottom: number;
  n: number;
  color: string;
  shape: 'columnar' | 'cuboidal';
}) {
  const h = yBottom - yTop;
  const cells = [];
  for (let i = 0; i < n; i++) {
    const u0 = i / n;
    const u1 = (i + 1) / n;
    const xt0 = cx - wTop + 2 * wTop * u0;
    const xt1 = cx - wTop + 2 * wTop * u1;
    const xb0 = cx - wBottom + 2 * wBottom * u0;
    const xb1 = cx - wBottom + 2 * wBottom * u1;
    const um = (u0 + u1) / 2;
    // Columnar nuclei sit basally (towards the hypoblast); cuboidal nuclei are central.
    const k = shape === 'columnar' ? 0.64 : 0.5;
    const nx = lerp(cx - wTop + 2 * wTop * um, cx - wBottom + 2 * wBottom * um, k);
    const ny = yTop + h * k;
    const w = lerp(xt1 - xt0, xb1 - xb0, k);
    cells.push(
      <g key={i}>
        <path
          d={`M${f1(xt0)},${f1(yTop)} L${f1(xt1)},${f1(yTop)} L${f1(xb1)},${f1(yBottom)} L${f1(xb0)},${f1(yBottom)}Z`}
          fill={color}
          stroke="rgba(10,14,28,0.45)"
          strokeWidth={0.8}
        />
        <ellipse
          cx={f1(nx)}
          cy={f1(ny)}
          rx={f1(Math.min(w * 0.26, 5))}
          ry={f1(shape === 'columnar' ? Math.min(h * 0.2, 5) : Math.min(h * 0.26, w * 0.24))}
          fill="rgba(20,24,40,0.55)"
        />
      </g>,
    );
  }
  return <g>{cells}</g>;
}
