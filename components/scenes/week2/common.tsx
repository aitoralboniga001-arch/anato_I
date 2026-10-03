'use client';

import { Part, lerp, type Pt } from '@/components/kit';
import { Epithelium, Gland, SpiralArtery, Vessel, W2Defs, glandPath, lumps, spiralPath } from './materials';

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
  /** 0..1 oedema: fluid between the stromal cells (paler, looser stroma). */
  oedema?: number;
  /** Vessel scale (1 = normal capillaries, ~2 = dilated, sinusoids handled by the stage). */
  vesselScale?: number;
  /** Optional per-vessel opacity (index into VESSELS), e.g. vessels the blastocyst grows over. */
  vesselFade?: readonly number[];
  /** 0..1 opacity of the spiral arteries (they are eroded / pushed aside on later days). */
  arteries?: number;
  /** Extra content rendered inside the slab mask, above stroma (e.g. sinusoids). */
  children?: React.ReactNode;
}

/** Secretory (corkscrew) glands opening on the surface, clear of the implantation site. */
export const GLANDS: Pt[][] = [
  glandPath([262, 486], 250, 2),
  glandPath([742, 486], 236, 5),
  glandPath([118, 486], 220, 3),
  glandPath([890, 486], 228, 1),
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

/** Spiral arteries coiling down from the deep endometrium (top) towards the surface. */
export const ARTERIES: Pt[][] = [spiralPath([344, -10], [352, 240], 6, 6, 0.4), spiralPath([668, -10], [660, 250], 6.5, 6, 1.9)];

/** Stroma with its cells and fibres, decidual change, oedema and the light from the top left (no Part). */
export function StromaFill({ h, decidua = 0, oedema = 0 }: { h: number; decidua?: number; oedema?: number }) {
  return (
    <>
      <rect x={0} y={0} width={1000} height={h} fill="url(#w2-p-stroma)" />
      <rect x={0} y={0} width={1000} height={h} fill="url(#w2-p-stroma2)" />
      {decidua > 0 && <rect x={0} y={0} width={1000} height={h} fill="url(#w2-p-decidua)" opacity={decidua} />}
      {oedema > 0 && <rect x={0} y={0} width={1000} height={h} fill="url(#w2-p-oedema)" opacity={oedema} />}
      <rect x={0} y={0} width={1000} height={h} fill="url(#w2-g-light)" />
    </>
  );
}

/** Organic invasive front of the syncytium (no regular period), shared by days 8–13 so they continue each other. */
export const synFront = (a: number) => lumps(a, 0.7);
/** Tongues of syncytium advancing into the stroma (angles, degrees). */
const TONGUE_A = [204, 247, 291, 334];
export const tongues = (a: number) => TONGUE_A.reduce((acc, b) => acc + Math.exp(-(((a - b) / 7) ** 2)), 0);

/** Day-8 syncytium thickness at angle a (degrees, 90 = abembryonic pole, 270 = embryonic pole, sampled 90..450); grow 0..1. */
export function synTh8(a: number, grow: number) {
  if (a <= 160 || a >= 380) return 0;
  const prof = Math.pow(Math.sin(((a - 160) / 220) * Math.PI), 0.8);
  return lerp(18, 66, grow) * prof * synFront(a) * (1 + 0.32 * grow * tongues(a));
}

/** Day 9 onwards: the syncytium all round, thick at the embryonic pole (270°), thin abembryonically (90°). */
export function synTh9(a: number) {
  const p = Math.pow((1 - Math.sin((a * Math.PI) / 180)) / 2, 0.9);
  return (7 + 63 * p) * (1 + (synFront(a) - 1) * p) * (1 + 0.32 * tongues(a) * p);
}

/** Endometrium background: stroma, glands, capillaries and surface epithelium (with a gap). */
export function Endometrium({ gap, decidua = 0, secretion = 0, oedema = 0, vesselScale = 1, vesselFade, arteries = 1, children }: EndometriumProps) {
  const { surfaceY, epiThickness, cx } = W2;
  return (
    <g mask="url(#m-slab)">
      <W2Defs />
      <Part id="endometrio-estroma" quiet>
        <StromaFill h={surfaceY} decidua={decidua} oedema={oedema} />
      </Part>

      <Part id="amaren-odol-hodiak">
        {arteries > 0.01 && ARTERIES.map((a, i) => <SpiralArtery key={`a${i}`} pts={a} w={4.2 * lerp(1, 1.2, oedema)} opacity={arteries} />)}
        {VESSELS.map(([x, y, s], i) => (
          <Vessel key={i} x={x} y={y} rx={11 * s * vesselScale} ry={7 * s * vesselScale} rot={(i * 37) % 60 - 30} opacity={vesselFade?.[i] ?? 1} />
        ))}
      </Part>

      <Part id="umetoki-guruina">
        {GLANDS.map((g, i) => (
          <Gland key={i} pts={g} secretion={secretion} scale={1 + 0.12 * secretion} />
        ))}
      </Part>

      {children}

      <Part id="endometrio-epitelioa">
        <Epithelium x0={0} x1={cx - gap} y={surfaceY} th={epiThickness} w={16} />
        <Epithelium x0={cx + gap} x1={1000} y={surfaceY} th={epiThickness} w={16} />
      </Part>

      <Part id="umetoki-barrunbea" quiet>
        <rect x={0} y={surfaceY + 2} width={1000} height={640 - surfaceY} fill="#1a1426" />
        <rect x={0} y={surfaceY + 2} width={1000} height={640 - surfaceY} fill="url(#g-shade)" opacity={0.4} />
      </Part>
      {/* Secretion (glycogen, mucus, glycoproteins) leaving the gland mouths into the lumen. */}
      {secretion > 0.05 && (
        <Part id="umetoki-guruina">
          {GLANDS.map((g, i) =>
            [0, 1, 2].map((j) => {
              const k = Math.min(1, secretion * 1.3 - j * 0.15);
              if (k <= 0) return null;
              return <circle key={`${i}-${j}`} cx={g[0][0] + (j - 1) * 6} cy={surfaceY + 7 + j * 7 * k} r={2.8 - j * 0.5} fill="#fff4d6" stroke="#d8c08a" strokeWidth={0.6} opacity={0.9 * k} />;
            }),
          )}
        </Part>
      )}
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

/** Open arc around the embryo-complex centre (radius may vary with the angle), for stroking a band's edges without its ends. */
export function arcAround(cx: number, cy: number, r: (a: number) => number, a0: number, a1: number, step = 2) {
  const n = Math.max(2, Math.ceil(Math.abs(a1 - a0) / step));
  return `M${Array.from({ length: n + 1 }, (_, i) => {
    const a = a0 + ((a1 - a0) * i) / n;
    return `${f1(cx + r(a) * Math.cos(rad(a)))},${f1(cy + r(a) * Math.sin(rad(a)))}`;
  }).join(' L')}`;
}

/**
 * The connecting stalk as a living bridge between two concentric mesoderm layers: a short neck of
 * half-width `half` (px) centred on angle `a`, whose sides curve out in fillets of radius `fillet`
 * and run tangentially into the layer surfaces `rInEdge` / `rOutEdge`. The ends close along the
 * middle of each layer (`rIn` / `rOut`), so they vanish into the tissue instead of ending in a cut.
 * Returns the fill outline plus the two sides (to stroke without drawing the ends).
 */
export function stalkBridge(cx: number, cy: number, a: number, rIn: number, rInEdge: number, rOutEdge: number, rOut: number, half: number, fillet: number) {
  const gap = Math.max(0.1, rOutEdge - rInEdge);
  const rho = Math.min(fillet, gap / 2);
  const f = (d: number) => (d < rho ? rho - Math.sqrt(Math.max(0, rho * rho - (rho - d) * (rho - d))) : 0);
  const off = (r: number) => half + f(r - rInEdge) + f(rOutEdge - r);
  const at = (ang: number, r: number) => `${f1(cx + r * Math.cos(ang))},${f1(cy + r * Math.sin(ang))}`;
  const a0 = rad(a);
  const N = 36;
  const side = (sgn: number) =>
    Array.from({ length: N + 1 }, (_, i) => {
      // Denser sampling near the fillets, where the side turns fastest.
      const u = 0.5 - 0.5 * Math.cos((Math.PI * i) / N);
      const r = rInEdge + gap * u;
      return at(a0 + (sgn * off(r)) / r, r);
    });
  const arc = (r: number, from: number, to: number) => Array.from({ length: 9 }, (_, i) => at(from + ((to - from) * i) / 8, r));
  const L = side(-1);
  const Rt = side(1);
  const oIn = off(rInEdge) / rInEdge;
  const oOut = off(rOutEdge) / rOutEdge;
  const d = `M${[...arc(rIn, a0 + oIn, a0 - oIn), ...L, ...arc(rOut, a0 - oOut, a0 + oOut), ...[...Rt].reverse()].join(' L')}Z`;
  return { d, left: `M${L.join(' L')}`, right: `M${Rt.join(' L')}` };
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
        <path d={`M${f1(xt0)},${f1(yTop)} L${f1(xt1)},${f1(yTop)} L${f1(xb1)},${f1(yBottom)} L${f1(xb0)},${f1(yBottom)}Z`} fill="url(#w2-g-cell)" opacity={0.75} />
        <ellipse
          cx={f1(nx)}
          cy={f1(ny)}
          rx={f1(Math.min(w * 0.26, 5))}
          ry={f1(shape === 'columnar' ? Math.min(h * 0.2, 5) : Math.min(h * 0.26, w * 0.24))}
          fill="rgba(20,24,40,0.55)"
        />
        <circle cx={f1(nx)} cy={f1(ny)} r={f1(Math.min(w * 0.07, 1.3))} fill="rgba(5,8,20,0.7)" />
      </g>,
    );
  }
  return <g>{cells}</g>;
}
