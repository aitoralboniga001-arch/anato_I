'use client';

import { Label, Note, Part, lerp, seg, smoothPath, type Pt, type SceneProps } from '@/components/kit';
import { Defs8, MesCell, Q, f1, inPoly, mesCells, vis } from './common';

/**
 * 8:gorputz-adarrak — apunteen 4. atalaren lehen zatia (5., 6. eta 8. asteak) eta 6. asteko irudiak.
 * - `hastapena`: goiko eta beheko hasikinak gorputz-paretatik (goikoa lehenago), paretako orriko mesenkimaz beteak
 *   eta ektodermoz estaliak; erpineko ektodermo ertza; esku/oin plakak eta bi hertsadurak; izpiarteko ildoak
 *   apoptosiz eta hatzetako izpiak; 6. astean kartilagoak (gerrikoarenak ere), 8. astean hezurtzapen zentroak.
 * - `biraketa`: 8. asteko biraketak bentraletik. Gorputz-adar bakoitza zilindro bat da, muskulu tolestatzaileak
 *   (gorria) eta hedatzaileak (urdina) bere azaleran; ondoan zeharkako ebakidura (goian aurrea): goikoak 90° albora,
 *   behekoak 90° erdialdera.
 */

export const LIMB_T = { bud: 0, aer: 0.12, plates: 0.22, second: 0.32, rays: 0.42, cart: 0.54, centres: 0.66, rotUp: 0.76, rotLow: 0.88 };

const TISSUE = '#e9c6a8';
const EDGE = '#9a7056';
const WALL_X = 150;
const UP_Y = 190;
const LOW_Y = 450;
const RAYS = [-64, -32, 0, 32, 64];
const GROOVES = [-48, -16, 16, 48];
const rad = (d: number) => (d * Math.PI) / 180;
const gauss = (d: number, s: number) => Math.exp(-((d / s) ** 2));
const smooth = (x: number) => {
  const k = Math.min(1, Math.max(0, x));
  return k * k * (3 - 2 * k);
};

/** Stage time → limb development (0 bud … .2 plate … .4 second constriction … .55 rays … .72 cartilage … .86 centres … 1). */
function limbS(t: number, lower: boolean) {
  const bud = lower ? seg(t, 0.04, 0.1) : seg(t, 0.01, 0.07);
  return 0.2 * bud + 0.2 * seg(t, 0.225, 0.29) + 0.15 * seg(t, 0.325, 0.39) + 0.17 * seg(t, 0.425, 0.5) + 0.14 * seg(t, 0.545, 0.62) + 0.14 * seg(t, 0.665, 0.72);
}

/** The limb at development s, growing to the right from the body wall along y = ay. */
function limb(s: number, ay: number) {
  const b = seg(s, 0, 0.2);
  const A = s < 0.2 ? lerp(12, 46, b) : lerp(46, 32, seg(s, 0.2, 0.55));
  const R = s < 0.2 ? A : lerp(46, 60, seg(s, 0.2, 0.35));
  const L = lerp(12, 130, b) + 120 * seg(s, 0.2, 0.4) + 90 * seg(s, 0.4, 0.55);
  const xp = Math.max(0, L - R);
  const xw = Math.max(0, xp - R * 0.95);
  const xe = xw * 0.5;
  const d1 = 0.32 * seg(s, 0.24, 0.36);
  const d2 = 0.24 * seg(s, 0.42, 0.52);
  const dig = seg(s, 0.6, 0.72);
  const w = (x: number) => (x < xw || xp <= xw ? A : lerp(A, R, smooth((x - xw) / (xp - xw)))) * (1 - d1 * gauss(x - xw, 16)) * (1 - d2 * gauss(x - xe, 16));
  const r = (th: number) => {
    const peak = Math.max(...RAYS.map((k) => gauss(th - k, 10)));
    return R * (1 + dig * (0.34 * peak - 0.1) * Math.cos(rad(th)));
  };
  const rim = (th: number, f = 1): Pt => [WALL_X + xp + r(th) * f * Math.cos(rad(th)), ay + r(th) * f * Math.sin(rad(th))];
  const N = 30;
  const top: Pt[] = Array.from({ length: N + 1 }, (_, i) => [WALL_X + (xp * i) / N, ay - w((xp * i) / N)]);
  const tip: Pt[] = Array.from({ length: 61 }, (_, i) => rim(-90 + i * 3));
  const bot: Pt[] = Array.from({ length: N + 1 }, (_, i) => [WALL_X + (xp * (N - i)) / N, ay + w((xp * (N - i)) / N)]);
  const outline: Pt[] = [[WALL_X - 6, ay - A], ...top, ...tip, ...bot, [WALL_X - 6, ay + A]];
  const X = (x: number) => WALL_X + x;
  return { A, R, L, xp, xw, xe, w, rim, outline, X, ay, dig };
}
type Limb = ReturnType<typeof limb>;

const CELLS_UP = mesCells(() => true, [WALL_X - 4, UP_Y - 80, 560, UP_Y + 80], 15, 301);
const CELLS_LOW = mesCells(() => true, [WALL_X - 4, LOW_Y - 80, 560, LOW_Y + 80], 15, 377);

/**
 * A cartilage model from p0 toward p1 (grown to k): the shape of the future bone — a waisted shaft between two
 * rounded ends — lavender with cells in lacunae, lit from above.
 */
function Rod({ p0, p1, w, k }: { p0: Pt; p1: Pt; w: number; k: number }) {
  if (k <= 0.01) return null;
  const e: Pt = [lerp(p0[0], p1[0], k), lerp(p0[1], p1[1], k)];
  const len = Math.hypot(e[0] - p0[0], e[1] - p0[1]);
  if (len < 1) return null;
  const u: Pt = [(e[0] - p0[0]) / len, (e[1] - p0[1]) / len];
  const n: Pt = [-u[1], u[0]];
  // Half-width along the model: ends swell (future epiphyses), the middle narrows (future diaphysis).
  const ends = Math.min(1, len / (w * 3));
  const half = (s: number) => (w / 2) * (0.78 + 0.34 * ends * (Math.exp(-((s / 0.16) ** 2)) + Math.exp(-(((1 - s) / 0.16) ** 2))));
  const N = 14;
  const side = (sgn: number) =>
    Array.from({ length: N + 1 }, (_, i) => {
      const s = sgn > 0 ? i / N : 1 - i / N;
      const c: Pt = [p0[0] + u[0] * len * s, p0[1] + u[1] * len * s];
      return [c[0] + n[0] * half(s) * sgn, c[1] + n[1] * half(s) * sgn] as Pt;
    });
  const cap = (c: Pt, dir: number, r: number) =>
    Array.from({ length: 7 }, (_, i) => {
      const a = ((i + 1) / 8) * Math.PI;
      return [c[0] + n[0] * Math.cos(a) * r * dir + u[0] * Math.sin(a) * r * dir, c[1] + n[1] * Math.cos(a) * r * dir + u[1] * Math.sin(a) * r * dir] as Pt;
    });
  const pts: Pt[] = [...side(1), ...cap(e, 1, half(1)), ...side(-1), ...cap(p0, -1, half(0))];
  const d = smoothPath(pts, true, 0.25);
  const hi = `M${f1(p0[0] - n[0] * half(0) * 0.45)},${f1(p0[1] - n[1] * half(0) * 0.45)}L${f1(e[0] - n[0] * half(1) * 0.45)},${f1(e[1] - n[1] * half(1) * 0.45)}`;
  return (
    <g>
      <path d={d} fill={Q.cart} stroke={Q.cartDeep} strokeWidth={1.5} />
      <path d={d} fill="url(#w8-cart)" />
      <path d={hi} stroke="#fff" strokeOpacity={0.28} strokeWidth={Math.max(1, w * 0.18)} strokeLinecap="round" />
      <path d={d} fill="url(#w8-light)" />
    </g>
  );
}
const along = (a: Pt, b: Pt, u: number): Pt => [lerp(a[0], b[0], u), lerp(a[1], b[1], u)];

/** Every cartilage of one limb (upper: humerus…; lower: femur… and the girdle), proximal ones first. */
function Cartilages({ g, s, lower }: { g: Limb; s: number; lower: boolean }) {
  const k = (order: number) => seg(s, 0.72 + order * 0.025, 0.77 + order * 0.025);
  const y = g.ay;
  const inner: Pt = [g.X(g.xp - g.R * 0.38), y];
  const ray = (th: number, a: number, b: number) => [along(inner, g.rim(th, 0.97), a), along(inner, g.rim(th, 0.97), b)] as const;
  const ids = lower
    ? { long: 'femurra', pre: 'tibia', post: 'peroneoa', carp: 'tartsoaren-kartilagoak', meta: 'metatartsoaren-kartilagoak' }
    : { long: 'humeroa', pre: 'erradioa', post: 'ulna', carp: 'eskuko-kartilagoak', meta: 'eskuko-kartilagoak' };
  return (
    <g>
      {lower && (
        <>
          {/* The three girdle cartilages of the hip bone. */}
          {(
            [
              { id: 'iliona', c: [WALL_X + 8, y - 50], pts: [[-2, 30], [-14, 6], [-18, -22], [-6, -36], [10, -30], [14, -6], [8, 22]] },
              { id: 'pubisa', c: [WALL_X + 18, y + 50], pts: [[-12, -12], [2, -10], [16, 2], [18, 10], [8, 10], [-6, 2], [-14, 2]] },
              { id: 'iskiona', c: [WALL_X - 8, y + 60], pts: [[-2, -20], [10, -14], [10, 2], [4, 14], [-8, 14], [-12, 0], [-8, -14]] },
            ] as { id: string; c: Pt; pts: Pt[] }[]
          ).map((b) => {
            const d = smoothPath(b.pts.map(([px, py]) => [b.c[0] + px * k(0), b.c[1] + py * k(0)] as Pt), true, 0.3);
            return (
              <Part key={b.id} id={b.id} show={k(0) > 0.01 ? 1 : 0}>
                <path d={d} fill={Q.cart} stroke={Q.cartDeep} strokeWidth={1.5} />
                <path d={d} fill="url(#w8-cart)" />
                <path d={d} fill="url(#w8-light)" />
              </Part>
            );
          })}        </>
      )}
      <Part id={ids.long} show={k(0) > 0.01 ? 1 : 0}>
        <Rod p0={[g.X(14), y]} p1={[g.X(g.xe - 10), y]} w={lower ? 17 : 15} k={k(0)} />
      </Part>
      <Part id={ids.pre} show={k(1) > 0.01 ? 1 : 0}>
        <Rod p0={[g.X(g.xe + 9), y - 8]} p1={[g.X(g.xw - 7), y - 8]} w={lower ? 11 : 9} k={k(1)} />
      </Part>
      <Part id={ids.post} show={k(1) > 0.01 ? 1 : 0}>
        <Rod p0={[g.X(g.xe + 9), y + 9]} p1={[g.X(g.xw - 7), y + 9]} w={lower ? 7 : 9} k={k(1)} />
      </Part>
      <Part id={ids.carp} show={k(2) > 0.01 ? 1 : 0}>
        {[-17, -6, 5, 16].map((dy, i) => (
          <ellipse key={i} cx={g.X(g.xw + 9)} cy={y + dy} rx={6 * k(2)} ry={5 * k(2)} fill={Q.cart} stroke={Q.cartDeep} strokeWidth={1.2} />
        ))}
      </Part>
      <Part id={ids.meta} show={k(3) > 0.01 ? 1 : 0}>
        {RAYS.map((th) => {
          const [a, b] = ray(th, 0.02, 0.46);
          return <Rod key={th} p0={a} p1={b} w={6} k={k(3)} />;
        })}
      </Part>
      <Part id="falangeak" show={k(4) > 0.01 ? 1 : 0}>
        {RAYS.flatMap((th, i) =>
          (i === 0 ? [[0.53, 0.72], [0.77, 0.93]] : [[0.52, 0.66], [0.7, 0.82], [0.86, 0.95]]).map(([a0, b0], j) => {
            const [a, b] = ray(th, a0, b0);
            return <Rod key={`${th}-${j}`} p0={a} p1={b} w={5} k={k(4)} />;
          }),
        )}
      </Part>
    </g>
  );
}

function LimbDrawing({ g, s, cells, lower, t, reduced }: { g: Limb; s: number; cells: { p: Pt; r: number; a: number }[]; lower: boolean; t: number; reduced?: boolean }) {
  const y = g.ay;
  const inner: Pt = [g.X(g.xp - g.R * 0.45), y];
  const rays = seg(s, 0.55, 0.62);
  const grooves = seg(s, 0.56, 0.64);
  const dying = seg(s, 0.58, 0.62) * (1 - seg(s, 0.72, 0.76));
  const centres = seg(s, 0.87, 0.95);
  const aer = seg(t, LIMB_T.aer, LIMB_T.aer + 0.03) * (1 - seg(s, 0.7, 0.76));
  const plate = seg(s, 0.2, 0.3);
  const shaft = [g.X(14 + (g.xe - 24) / 2), lower ? g.X(g.xe + 9 + (g.xw - g.xe - 16) / 2) : g.X(g.xe + 9 + (g.xw - g.xe - 16) / 2)];
  return (
    <g>
      <Part id={lower ? 'beheko-gorputz-adarraren-hasikina' : 'goiko-gorputz-adarraren-hasikina'}>
        <path d={smoothPath(g.outline, true, 0.25)} fill={TISSUE} stroke={EDGE} strokeWidth={1.5} />
        <path d={smoothPath(g.outline, true, 0.25)} fill="url(#w8-light)" />
        {/* Round across its axis: lit on top, shadowed underneath. */}
        <path d={smoothPath(g.outline, true, 0.25)} fill="url(#w8-limb-round)" />
      </Part>
      {/* Mesenchyme from the parietal layer fills the bud. */}
      <Part id="gorputz-adarren-mesenkima">
        {cells.map((c, i) =>
          inPoly(g.outline, c.p[0], c.p[1]) ? <MesCell key={i} p={c.p} r={c.r * 0.7} a={c.a + (reduced ? 0 : t * 60)} fill={Q.lateral} opacity={0.85} /> : null,
        )}
      </Part>
      {/* Hand / foot plate. */}
      <Part id={lower ? 'oin-plaka' : 'esku-plaka'} show={plate}>
        <path d={smoothPath([...Array.from({ length: 61 }, (_, i) => g.rim(-90 + i * 3)), [g.X(g.xp), y + g.R], [g.X(g.xw), y + g.w(g.xw)], [g.X(g.xw), y - g.w(g.xw)]], true, 0.2)} fill="rgba(255,236,200,0.28)" stroke="rgba(255,236,200,0.5)" strokeWidth={1.2} />
      </Part>
      {/* Digital rays (condensed mesenchyme) and, between them, grooves where cells die. */}
      <Part id="hatzetako-izpiak" show={rays}>
        {RAYS.map((th) => (
          <path key={th} d={`M${f1(inner[0])},${f1(inner[1])}L${f1(g.rim(th, 0.95)[0])},${f1(g.rim(th, 0.95)[1])}`} stroke={Q.lateralDeep} strokeWidth={13} strokeLinecap="round" opacity={0.55} />
        ))}
      </Part>
      <Part id="izpiarteko-ildoak" show={grooves}>
        {GROOVES.map((th) => (
          <path key={th} d={`M${f1(along(inner, g.rim(th), 0.35)[0])},${f1(along(inner, g.rim(th), 0.35)[1])}L${f1(g.rim(th, 1.02)[0])},${f1(g.rim(th, 1.02)[1])}`} stroke="#5a3418" strokeWidth={3} strokeLinecap="round" />
        ))}
      </Part>
      {/* The dying cells lie in the grooves: they count as the grooves too. */}
      <Part id="apoptosia" groups={['izpiarteko-ildoak']} show={dying}>
        {GROOVES.flatMap((th, i) =>
          [0.5, 0.64, 0.78, 0.92].map((u, j) => {
            const p = along(inner, g.rim(th), u);
            const br = seg(s, 0.6 + j * 0.02, 0.68 + j * 0.02);
            return (
              <g key={`${i}${j}`}>
                <circle cx={p[0]} cy={p[1]} r={lerp(4.2, 2.4, br)} fill="#2a1408" stroke="#f87171" strokeWidth={1} />
                {[0, 1, 2].map((q) => (
                  <circle key={q} cx={p[0] + Math.cos(q * 2.1 + i) * 6 * br} cy={p[1] + Math.sin(q * 2.1 + i) * 6 * br} r={1.4} fill="#f87171" opacity={br} />
                ))}
              </g>
            );
          }),
        )}
      </Part>
      <Cartilages g={g} s={s} lower={lower} />
      {/* Week 8: an ossification centre in the middle of each long cartilage. */}
      <Part id="hezurtzapen-zentroak" show={centres}>
        {[
          [shaft[0], y],
          [shaft[1], y - 8],
          [shaft[1], y + 9],
        ].map(([x, yy], i) => (
          <g key={i}>
            <ellipse cx={x} cy={yy} rx={lerp(2, i ? 7 : 11, centres)} ry={lerp(2, i ? 3.5 : 6, centres)} fill={Q.centre} stroke={Q.osteo} strokeWidth={1} />
            {[-1, 0, 1].map((q) => (
              <circle key={q} cx={x + q * 4 * centres} cy={yy} r={1.1} fill={Q.osteo} opacity={centres} />
            ))}
          </g>
        ))}
      </Part>
      {/* Apical ectodermal ridge: the thickened ectoderm along the tip. */}
      <Part id="erpineko-ektodermo-ertza" show={aer}>
        <path d={smoothPath(Array.from({ length: 51 }, (_, i) => g.rim(-75 + i * 3, 1.0)), false, 0.3)} fill="none" stroke="#bcd6ff" strokeWidth={7} strokeLinecap="round" />
      </Part>
      <Part id="azaleko-ektodermoa" quiet>
        <path d={smoothPath(g.outline, true, 0.25)} fill="none" stroke={Q.skin} strokeWidth={2.4} />
      </Part>
    </g>
  );
}

/** The limbs are drawn 1.3× about their root on the body wall; label anchors go through the same map. */
const K = 1.3;
const zoomAt = (ay: number) => `translate(${WALL_X},${ay}) scale(${K}) translate(${-WALL_X},${-ay})`;
/** `dx`/`dy` nudge the tip in screen pixels, after the zoom. */
const at = (p: Pt, ay: number, dx = 0, dy = 0) => ({ ax: WALL_X + (p[0] - WALL_X) * K + dx, ay: ay + (p[1] - ay) * K + dy });

/** Topic 8's bud drawing (body wall, somites, parietal layer, the two limbs) without its captions and names, for later topics. */
export function LimbBudsDrawing({ t, reduced }: SceneProps) {
  const su = limbS(t, false);
  const sl = limbS(t, true);
  const up = limb(su, UP_Y);
  const low = limb(sl, LOW_Y);
  return (
    <g>
      <Defs8 />
      <rect x={0} y={0} width={1000} height={640} fill="#0f0f11" />
      <defs>
        <linearGradient id="w8-limb-round" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#3a1a0c" stopOpacity={0.28} />
          <stop offset="0.3" stopColor="#fff" stopOpacity={0.14} />
          <stop offset="0.55" stopColor="#fff" stopOpacity={0} />
          <stop offset="1" stopColor="#3a1a0c" stopOpacity={0.38} />
        </linearGradient>
      </defs>
      {/* The body wall, seen from behind: somites near the midline, the parietal layer at the side. */}
      <Part id="gorputz-pareta" quiet>
        <path d={`M0,0L${WALL_X},0L${WALL_X},640L0,640Z`} fill={TISSUE} />
        <path d={`M0,0L${WALL_X},0L${WALL_X},640L0,640Z`} fill="url(#w8-light)" />
      </Part>
      <Part id="somitak" quiet>
        {Array.from({ length: 16 }, (_, i) => (
          <rect key={i} x={26} y={6 + i * 40} width={44} height={32} rx={9} fill={Q.paraxial} opacity={0.35} />
        ))}
      </Part>
      <Part id="paretako-orria">
        <rect x={WALL_X - 30} y={0} width={24} height={640} fill={Q.lateral} opacity={0.8} />
      </Part>
      <g transform={zoomAt(UP_Y)}>
        <LimbDrawing g={up} s={su} cells={CELLS_UP} lower={false} t={t} reduced={reduced} />
      </g>
      <g transform={zoomAt(LOW_Y)}>
        <LimbDrawing g={low} s={sl} cells={CELLS_LOW} lower t={t} reduced={reduced} />
      </g>
      <Part id="azaleko-ektodermoa" quiet>
        <path d={`M${WALL_X},0L${WALL_X},640`} stroke={Q.skin} strokeWidth={2.4} opacity={0.8} />
      </Part>

    </g>
  );
}

/** Screen geometry of the buds at topic-8 time t: outlines and a mapper from limb space to the screen. */
export function limbBudsScreen(t: number) {
  const up = limb(limbS(t, false), UP_Y);
  const low = limb(limbS(t, true), LOW_Y);
  const map = (p: Pt, ay: number): Pt => [WALL_X + (p[0] - WALL_X) * K, ay + (p[1] - ay) * K];
  return { up: up.outline.map((p) => map(p, UP_Y)), low: low.outline.map((p) => map(p, LOW_Y)), wallX: WALL_X, upY: UP_Y, lowY: LOW_Y };
}

export function LimbBuds({ t, reduced }: SceneProps) {
  const su = limbS(t, false);
  const sl = limbS(t, true);
  const up = limb(su, UP_Y);
  const low = limb(sl, LOW_Y);
  const cart = vis(t, LIMB_T.cart);
  const week = t < LIMB_T.plates ? '4.–5. astea' : t < LIMB_T.centres ? '6. astea' : '8. astea';
  const ray = (g: Limb, th: number, u: number) => along([g.X(g.xp - g.R * 0.45), g.ay], g.rim(th), u);
  // The mesenchyme is loose cells: its name points at the drawn cell nearest the middle of the bud.
  const mesWant: Pt = [up.X(up.xp * 0.45), UP_Y + 12];
  const mesAt = CELLS_UP.filter((c) => inPoly(up.outline, c.p[0], c.p[1])).reduce<Pt>(
    (a, c) => (Math.hypot(c.p[0] - mesWant[0], c.p[1] - mesWant[1]) < Math.hypot(a[0] - mesWant[0], a[1] - mesWant[1]) ? c.p : a),
    [up.X(0), UP_Y],
  );
  return (
    <g>
      <LimbBudsDrawing t={t} reduced={reduced} />
      <Note x={260} y={30} size={13} tone="accent">
        {week}
      </Note>
      <Note x={560} y={612} tone="accent" show={vis(t, 0, LIMB_T.aer)}>
        Gorputz-adarren hasikinak: paretako orriko mesenkima, ektodermoz estalia (goikoa lehenago)
      </Note>
      <Note x={560} y={612} tone="accent" show={vis(t, LIMB_T.aer, LIMB_T.plates)}>
        Hasikinaren erpinean ektodermoa lodituta: erpineko ektodermo ertza
      </Note>
      <Note x={560} y={612} tone="accent" show={vis(t, LIMB_T.plates, LIMB_T.second)}>
        Esku eta oin plakak; lehen hertsadura: bi zati
      </Note>
      <Note x={560} y={612} tone="accent" show={vis(t, LIMB_T.second, LIMB_T.rays)}>
        Bigarren hertsadura hurbileko atalean: hiru zati
      </Note>
      <Note x={560} y={612} tone="accent" show={vis(t, LIMB_T.rays, LIMB_T.cart)}>
        4 ildo erradiatu apoptosiz; haien artean hatzetako izpiak → hatzak eta behatzak
      </Note>
      <Note x={560} y={612} tone="accent" show={vis(t, LIMB_T.cart, LIMB_T.centres)}>
        6. astea: mesenkimatik lehen kartilagoak → hezurtzapen endokondrala
      </Note>
      <Note x={560} y={612} tone="accent" show={vis(t, LIMB_T.centres)}>
        8. astea: hezurtzapen zentroak kartilagoen erdiko ataletan
      </Note>

      {/* Upper limb names (above its axis, proximal ones highest), then the lower limb's. */}
      <Label id="goiko-gorputz-adarraren-hasikina" x={680} y={100} {...at(up.rim(-50), UP_Y, -3, 5)} show={vis(t, 0, LIMB_T.plates)} />
      <Label id="gorputz-adarren-mesenkima" x={700} y={160} {...at(mesAt, UP_Y)} show={vis(t, 0, LIMB_T.cart)} />
      <Label id="erpineko-ektodermo-ertza" x={770} y={236} {...at([up.rim(32)[0] + 2, up.rim(32)[1]], UP_Y)} show={seg(t, LIMB_T.aer, LIMB_T.aer + 0.03) * (1 - seg(su, 0.7, 0.76))} />
      <Label id="esku-plaka" x={810} y={276} {...at([up.X(up.xp + 6), UP_Y + up.R * 0.6], UP_Y, -5, 9)} show={vis(t, LIMB_T.plates, LIMB_T.cart)} />
      <Label id="hatzetako-izpiak" x={810} y={70} {...at(ray(up, -32, 0.72), UP_Y)} show={vis(t, LIMB_T.rays, LIMB_T.cart)} />
      <Label id="izpiarteko-ildoak" x={810} y={112} {...at(ray(up, -16, 0.42), UP_Y)} show={Math.min(vis(t, LIMB_T.rays, LIMB_T.cart), seg(su, 0.56, 0.64))} />
      <Label id="apoptosia" x={810} y={196} {...at(ray(up, 16, 0.78), UP_Y)} show={vis(t, LIMB_T.rays, LIMB_T.cart)} />
      <Label id="humeroa" x={810} y={50} {...at([up.X(40), UP_Y - 7], UP_Y, 5, 4)} show={cart} />
      <Label id="erradioa" x={810} y={84} {...at([up.X(up.xe + 30), UP_Y - 13], UP_Y, 5, 4)} show={cart} />
      <Label id="eskuko-kartilagoak" x={760} y={118} {...at(ray(up, -32, 0.3), UP_Y)} show={cart} />
      <Label id="falangeak" x={810} y={152} {...at(ray(up, -32, 0.76), UP_Y)} show={cart} />
      <Label id="ulna" x={810} y={236} {...at([up.X(up.xe + 30), UP_Y + 14], UP_Y, -3, -5)} show={cart} />
      <Label id="hezurtzapen-zentroak" x={740} y={290} {...at([up.X(14 + (up.xe - 24) / 2) + 8, UP_Y + 5], UP_Y, -2, -3)} show={vis(t, LIMB_T.centres)} />

      <Label id="paretako-orria" x={810} y={318} ax={WALL_X - 18} ay={318} />
      <Label id="beheko-gorputz-adarraren-hasikina" x={680} y={372} {...at(low.rim(-50), LOW_Y, -3, 6)} show={vis(t, 0.04, LIMB_T.plates)} />
      <Label id="oin-plaka" x={810} y={530} {...at([low.X(low.xp + 6), LOW_Y + low.R * 0.6], LOW_Y, -5, 9)} show={vis(t, LIMB_T.plates, LIMB_T.cart)} />
      <Label id="azaleko-ektodermoa" x={810} y={566} {...at([low.X(low.xp * 0.5), LOW_Y + low.w(low.xp * 0.5)], LOW_Y)} show={vis(t, 0, LIMB_T.cart)} small />
      <Label id="iliona" x={810} y={352} {...at([WALL_X + 14, LOW_Y - 66], LOW_Y)} show={cart} />
      <Label id="femurra" x={810} y={384} {...at([low.X(40), LOW_Y - 8], LOW_Y, 5, 4)} show={cart} />
      <Label id="tibia" x={810} y={414} {...at([low.X(low.xe + 30), LOW_Y - 14], LOW_Y, 1, 6)} show={cart} />
      <Label id="tartsoaren-kartilagoak" x={786} y={444} {...at([low.X(low.xw + 9), LOW_Y - 17], LOW_Y)} show={cart} />
      <Label id="metatartsoaren-kartilagoak" x={756} y={474} {...at(ray(low, 0, 0.3), LOW_Y)} show={cart} />
      <Label id="falangeak" x={810} y={504} {...at(ray(low, 32, 0.78), LOW_Y)} show={cart} />
      <Label id="peroneoa" x={810} y={534} {...at([low.X(low.xe + 30), LOW_Y + 13], LOW_Y, -3, -5)} show={cart} />
      <Label id="iskiona" x={810} y={562} {...at([WALL_X - 8, LOW_Y + 66], LOW_Y)} show={cart} />
      <Label id="pubisa" x={810} y={590} {...at([WALL_X + 24, LOW_Y + 56], LOW_Y)} show={cart} />
    </g>
  );
}

// ——— View `biraketa`: the 8th-week rotations, from the front ———
/** One straight piece of a limb (arm, forearm, thigh, leg); `k0`/`k1` its radius at each end, in limb widths. */
type L2 = { p0: Pt; p1: Pt; w: number; ms: 1 | -1; disc: Pt; lower: boolean; k0?: number; k1?: number };
/**
 * Each limb from the root, with its joint (elbow / knee) and end (wrist / ankle) before the rotation (`pe0`, `p10`)
 * and after it (`pe1`, `p11`). Before, the limbs stick out with a slight bend; after, the elbow points back (caudal)
 * and the forearms come forward, hands in front of the trunk, while the knee points forward and the feet meet,
 * soles towards each other.
 */
type Bent = L2 & { pe0: Pt; pe1: Pt; p11: Pt };
const bent = (ms: 1 | -1, lower: boolean, p0: Pt, pe0: Pt, p10: Pt, pe1: Pt, p11: Pt, disc: Pt): Bent => {
  const x = (p: Pt): Pt => (ms > 0 ? p : [1000 - p[0], p[1]]);
  return { p0: x(p0), p1: x(p10), pe0: x(pe0), pe1: x(pe1), p11: x(p11), w: lower ? 26 : 22, ms, disc: x(disc), lower };
};
const arm = (ms: 1 | -1) => bent(ms, false, [418, 200], [352, 262], [300, 338], [336, 298], [402, 334], [250, 196]);
const leg = (ms: 1 | -1) => bent(ms, true, [462, 436], [424, 505], [392, 574], [400, 506], [462, 566], [278, 470]);
const LIMBS: Bent[] = [arm(1), arm(-1), leg(1), leg(-1)];
/** The two pieces of a limb at rotation progress r (0 before, 1 after). */
function pieces(l: Bent, r: number): [L2, L2] {
  const k = smooth(r);
  const pe: Pt = [lerp(l.pe0[0], l.pe1[0], k), lerp(l.pe0[1], l.pe1[1], k)];
  const p1: Pt = [lerp(l.p1[0], l.p11[0], k), lerp(l.p1[1], l.p11[1], k)];
  return [
    { ...l, p1: pe, k0: 1.12, k1: 0.96 },
    { ...l, p0: pe, p1, k0: 0.96, k1: 0.8 },
  ];
}
/** An 8th-week embryo from the front: big head, chest with the heart bulge, belly with the liver and the cord. */
const TORSO: Pt[] = [[446, 178], [554, 178], [590, 214], [598, 300], [596, 382], [574, 432], [530, 456], [470, 456], [426, 432], [404, 382], [402, 300], [410, 214]];

/** Tube geometry of a limb: unit axis u, normal n toward the midline, radius tapering from the root to the wrist/ankle. */
const poly = (pts: Pt[]) => `M${pts.map((p) => `${f1(p[0])},${f1(p[1])}`).join('L')}Z`;

function tube(l: L2) {
  const dx = l.p1[0] - l.p0[0];
  const dy = l.p1[1] - l.p0[1];
  const len = Math.hypot(dx, dy);
  const u: Pt = [dx / len, dy / len];
  let n: Pt = [-u[1], u[0]];
  if (n[0] * l.ms < 0) n = [-n[0], -n[1]];
  const w0 = l.w * (l.k0 ?? 1.12);
  const w1 = l.w * (l.k1 ?? 0.8);
  // Not a straight tube: the muscle belly swells a little past the root, then the limb narrows to the wrist/ankle.
  const S = Array.from({ length: 13 }, (_, i) => i / 12);
  const wAt = (s: number) => lerp(w0, w1, s * s * (0.6 + 0.4 * s) + 0.4 * s * (1 - s)) * (1 + 0.1 * Math.sin(Math.PI * Math.min(1, s * 1.25)));
  const at = (s: number, o: number): Pt => [l.p0[0] + dx * s + n[0] * wAt(s) * o, l.p0[1] + dy * s + n[1] * wAt(s) * o];
  const band = (o1: number, o2: number) => poly([...S.map((s) => at(s, o1)), ...[...S].reverse().map((s) => at(s, o2))]);
  // Round ends: half circles at the root and at the wrist/ankle.
  const cap = (p: Pt, w: number, dir: 1 | -1): Pt[] =>
    Array.from({ length: 9 }, (_, i) => {
      const a = (Math.PI * (i + 1)) / 10;
      return [p[0] + n[0] * w * Math.cos(a) * dir + u[0] * w * Math.sin(a) * dir, p[1] + n[1] * w * Math.cos(a) * dir + u[1] * w * Math.sin(a) * dir] as Pt;
    });
  const capsule = smoothPath([...S.map((s) => at(s, 1)), ...cap(l.p1, wAt(1), 1), ...[...S].reverse().map((s) => at(s, -1)), ...cap(l.p0, wAt(0), -1)], true, 0.2);
  return { u, n, w0, w1: wAt(1), band, capsule, ang: Math.atan2(dy, dx) };
}

/**
 * Hand or foot: a plate whose palm/sole faces the flexor side, so from the front its width and the order of the digits
 * follow the rotation — thumb lateral at the end above, big toe medial below.
 */
function Extremity({ l, alpha }: { l: L2; alpha: number }) {
  const { u, n } = tube(l);
  const th = rad(alpha - 90);
  const span = Math.sin(th);
  const W = l.lower ? 16 : 14;
  const at = (p: Pt, along: number, across: number): Pt => [p[0] + u[0] * along + n[0] * across, p[1] + u[1] * along + n[1] * across];
  const wrist = at(l.p1, l.w * 0.55, 0);
  const palm = at(wrist, l.lower ? 12 : 10, 0);
  const plateW = Math.max(5, W * Math.abs(span));
  const angDeg = (Math.atan2(u[1], u[0]) * 180) / Math.PI;
  const lens = l.lower ? [6, 5, 4.6, 4.2, 3.8] : [7, 9, 10, 9, 7];
  const widths = l.lower ? [8.6, 7, 6.6, 6.2, 5.8] : [7.4, 7, 7.4, 7, 6.4];
  const digits = lens.map((len, k) => {
    const f = 1 - k / 2;
    const thumb = k === 0;
    const o = span * W * f * (thumb && !l.lower ? 1.05 : 0.86);
    const z = Math.cos(th) * f;
    const root = at(palm, thumb && !l.lower ? -1 : l.lower ? 10 : 9, o);
    const spread = thumb && !l.lower ? 0.45 : 0.05 * f;
    const dir: Pt = [u[0] + n[0] * spread * Math.sign(span || 1), u[1] + n[1] * spread * Math.sign(span || 1)];
    const tip: Pt = [root[0] + dir[0] * len, root[1] + dir[1] * len];
    return { k, root, tip, w: widths[k], z };
  });
  const digit = (d: (typeof digits)[number]) => (
    <g key={d.k}>
      <path d={`M${f1(d.root[0])},${f1(d.root[1])}L${f1(d.tip[0])},${f1(d.tip[1])}`} stroke={EDGE} strokeWidth={d.w + 2.4} strokeLinecap="round" />
      <path d={`M${f1(d.root[0])},${f1(d.root[1])}L${f1(d.tip[0])},${f1(d.tip[1])}`} stroke="#efcfb4" strokeWidth={d.w} strokeLinecap="round" />
      <circle cx={f1(d.tip[0] - (d.tip[0] - d.root[0]) * 0.2)} cy={f1(d.tip[1] - (d.tip[1] - d.root[1]) * 0.2)} r={d.w * 0.22} fill="#fff" opacity={0.25} />
    </g>
  );
  return (
    <g>
      {digits.filter((d) => d.z < 0).sort((a, b) => a.z - b.z).map(digit)}
      <ellipse cx={f1(palm[0])} cy={f1(palm[1])} rx={f1(plateW + 2)} ry={l.lower ? 16 : 14} transform={`rotate(${f1(angDeg - 90)} ${f1(palm[0])} ${f1(palm[1])})`} fill="#ecc9ad" stroke={EDGE} strokeWidth={1.4} />
      <ellipse cx={f1(palm[0])} cy={f1(palm[1])} rx={f1(plateW + 2)} ry={l.lower ? 16 : 14} transform={`rotate(${f1(angDeg - 90)} ${f1(palm[0])} ${f1(palm[1])})`} fill="url(#w8-boneshade)" opacity={0.6} />
      {digits.filter((d) => d.z >= 0).sort((a, b) => a.z - b.z).map(digit)}
    </g>
  );
}

/** The visible part (as offsets −1…1 across the limb, + toward the midline) of a surface sector [a, b] (degrees from the front). */
function visibleBand(a: number, b: number): [number, number] | null {
  for (const k of [-360, 0, 360]) {
    const lo = Math.max(a + k, -90);
    const hi = Math.min(b + k, 90);
    if (hi - lo > 0.5) return [Math.sin(rad(lo)), Math.sin(rad(hi))];
  }
  return null;
}

/** A limb in two pieces, bent at the elbow / knee; the hand or foot at the end of the distal piece. */
function LimbTube({ l, alpha, r }: { l: Bent; alpha: number; r: number }) {
  const [a, b] = pieces(l, r);
  // Segment names: proximal piece, distal piece, hand / foot, elbow / knee.
  const [near, far, end, joint] = l.lower ? ['izterra', 'berna', 'oina', 'belauna'] : ['besoa', 'besaurrea', 'eskua', 'ukondoa'];
  return (
    <g>
      <Part id={end} quiet>
        <Extremity l={b} alpha={alpha} />
      </Part>
      <LimbPiece l={b} alpha={alpha} id={far} />
      <LimbPiece l={a} alpha={alpha} id={near} />
      <Part id={joint} quiet>
        <Joint l={a} next={b} alpha={alpha} />
      </Part>
    </g>
  );
}

function LimbPiece({ l, alpha, id }: { l: L2; alpha: number; id: string }) {
  const { n, band, capsule, w1 } = tube(l);
  const fl = visibleBand(alpha - 90, alpha + 90);
  const ex = visibleBand(alpha + 90, alpha + 270);
  return (
    <g>
      <Part id={id} quiet>
        <path d={capsule} fill={TISSUE} stroke={EDGE} strokeWidth={1.6} />
      </Part>
      {/* The muscle masses seen through the thin skin, fibres along the limb. */}
      <Part id="muskulu-tolestatzaileak">
        {fl && <path d={band(fl[0] * 0.94, fl[1] * 0.94)} fill={Q.flexor} opacity={0.88} />}
        {fl && <path d={band(fl[0] * 0.94, fl[1] * 0.94)} fill="url(#w8-muscle)" />}
      </Part>
      <Part id="muskulu-hedatzaileak">
        {ex && <path d={band(ex[0] * 0.94, ex[1] * 0.94)} fill={Q.extensor} opacity={0.88} />}
        {ex && <path d={band(ex[0] * 0.94, ex[1] * 0.94)} fill="url(#w8-muscle)" />}
      </Part>
      {/* Cylinder shading: darker toward both edges, a soft highlight down the middle; the wrist/ankle crease. */}
      <path d={band(-1, -0.5)} fill="rgba(40,16,10,0.26)" pointerEvents="none" />
      <path d={band(0.5, 1)} fill="rgba(40,16,10,0.26)" pointerEvents="none" />
      <path d={band(-0.2, 0.1)} fill="rgba(255,255,255,0.14)" pointerEvents="none" />
      {/* The wrist / ankle crease. */}
      {l.k1 === 0.8 && <path d={`M${f1(l.p1[0] - n[0] * w1)},${f1(l.p1[1] - n[1] * w1)}L${f1(l.p1[0] + n[0] * w1)},${f1(l.p1[1] + n[1] * w1)}`} stroke="rgba(60,30,20,0.35)" strokeWidth={1.4} pointerEvents="none" />}
    </g>
  );
}

/**
 * The elbow / knee between the two pieces: a crease across, and its point (olecranon / patella) on the extensor side,
 * seen from the front only while that side faces us — the elbow turns away to the back, the knee to the front.
 */
function Joint({ l, next, alpha }: { l: L2; next: L2; alpha: number }) {
  const { n, ang } = tube(l);
  const { n: n2 } = tube(next);
  const m = l.p1;
  // Across the joint: halfway between the two pieces' cross directions.
  const c = norm2([n[0] + n2[0], n[1] + n2[1]]);
  const w = l.w * 0.96;
  const ext = rad(alpha + 180);
  const o = Math.sin(ext) * l.w * 0.82;
  const face = Math.cos(ext);
  const cap: Pt = [m[0] + c[0] * o, m[1] + c[1] * o];
  return (
    <g>
      <path d={`M${f1(m[0] - c[0] * w)},${f1(m[1] - c[1] * w)}L${f1(m[0] + c[0] * w)},${f1(m[1] + c[1] * w)}`} stroke="rgba(60,30,20,0.45)" strokeWidth={1.6} />
      {face > -0.25 && (
        <ellipse
          cx={f1(cap[0])}
          cy={f1(cap[1])}
          rx={f1(l.lower ? 11 : 8)}
          ry={f1((l.lower ? 11 : 8) * (0.45 + 0.55 * Math.max(0, face)))}
          transform={`rotate(${f1((ang * 180) / Math.PI + 90)} ${f1(cap[0])} ${f1(cap[1])})`}
          fill="#f3dcc2"
          stroke={EDGE}
          strokeWidth={1.4}
          opacity={Math.min(1, (face + 0.25) * 2)}
        />
      )}
    </g>
  );
}

const norm2 = (v: Pt): Pt => {
  const k = Math.hypot(v[0], v[1]) || 1;
  return [v[0] / k, v[1] / k];
};

/** Cross-section of the limb: front at the top, the midline toward the body; flexors red, extensors blue, the bone white. */
function Disc({ l, alpha, turning, label }: { l: L2; alpha: number; turning: number; label: number }) {
  const [cx, cy] = l.disc;
  const R = 34;
  const dir = (phi: number): Pt => [cx + l.ms * Math.sin(rad(phi)) * R, cy - Math.cos(rad(phi)) * R];
  const wedge = (a: number, b: number) => {
    const p = dir(a);
    const q = dir(b);
    const sweep = l.ms > 0 ? 1 : 0;
    return `M${cx},${cy}L${f1(p[0])},${f1(p[1])}A${R},${R} 0 0 ${sweep} ${f1(q[0])},${f1(q[1])}Z`;
  };
  const start = l.lower ? 90 : 90;
  const arc = Array.from({ length: 13 }, (_, i) => {
    const phi = lerp(start, alpha, i / 12);
    return [cx + l.ms * Math.sin(rad(phi)) * (R + 10), cy - Math.cos(rad(phi)) * (R + 10)] as Pt;
  });
  const head = arc[arc.length - 1];
  const prev = arc[arc.length - 2];
  const ang = Math.atan2(head[1] - prev[1], head[0] - prev[0]);
  return (
    <g>
      <circle cx={cx} cy={cy} r={R + 3} fill="#1a1418" stroke="#4a3a46" strokeWidth={1.5} pointerEvents="none" />
      <Part id="muskulu-tolestatzaileak">
        <path d={wedge(alpha - 90, alpha + 90)} fill={Q.flexor} />
      </Part>
      <Part id="muskulu-hedatzaileak">
        <path d={wedge(alpha + 90, alpha + 270)} fill={Q.extensor} />
      </Part>
      <circle cx={cx} cy={cy} r={9} fill="#f5efe2" stroke="#b9a77e" strokeWidth={1.2} pointerEvents="none" />
      {turning > 0.02 && Math.abs(alpha - start) > 4 && (
        <g opacity={turning}>
          <path d={`M${arc.map((p) => `${f1(p[0])},${f1(p[1])}`).join('L')}`} fill="none" stroke="#fff" strokeWidth={2.6} strokeLinecap="round" />
          <path d={`M${f1(head[0] + Math.cos(ang) * 8)},${f1(head[1] + Math.sin(ang) * 8)}L${f1(head[0] + Math.cos(ang + 2.4) * 8)},${f1(head[1] + Math.sin(ang + 2.4) * 8)}L${f1(head[0] + Math.cos(ang - 2.4) * 8)},${f1(head[1] + Math.sin(ang - 2.4) * 8)}Z`} fill="#fff" />
        </g>
      )}
      <text x={cx} y={cy - R - 18} textAnchor="middle" fontSize={13} fontWeight={600} fill="#cbd5e1" stroke="#0f0f11" strokeWidth={3} paintOrder="stroke" opacity={label}>
        aurrea
      </text>
      <text x={cx} y={cy + R + 22} textAnchor="middle" fontSize={13} fontWeight={600} fill="#cbd5e1" stroke="#0f0f11" strokeWidth={3} paintOrder="stroke" opacity={label}>
        atzea
      </text>
    </g>
  );
}

/**
 * The 8th-week embryo from the front with its limbs at rotation progress `ru` (upper) / `rl` (lower): trunk, head
 * and limbs only (no discs, notes or labels). Topic 9 draws its nerves on it.
 */
export function FetusFront({ ru = 1, rl = 1 }: { ru?: number; rl?: number }) {
  const aUp = 90 - 90 * ru;
  const aLow = 90 + 90 * rl;
  return (
    <g>
        <Defs8 />
        <rect x={0} y={0} width={1000} height={640} fill="#0f0f11" />
        <defs>
          <radialGradient id="w8-rot-skin" cx="0.42" cy="0.36" r="0.7">
            <stop offset="0" stopColor="#f8e2cf" />
            <stop offset="0.65" stopColor="#e7c2a4" />
            <stop offset="1" stopColor="#b98b6e" />
          </radialGradient>
          <radialGradient id="w8-rot-bulge" cx="0.5" cy="0.4" r="0.6">
            <stop offset="0" stopColor="#fff" stopOpacity={0.22} />
            <stop offset="1" stopColor="#fff" stopOpacity={0} />
          </radialGradient>
        </defs>
        {/* Trunk: the heart and liver bulges, the umbilical cord cut short (two arteries, one vein), the genital tubercle. */}
        <Part id="gorputz-pareta" quiet>
        <path d={smoothPath(TORSO, true, 0.3)} fill="url(#w8-rot-skin)" stroke={EDGE} strokeWidth={1.6} />
        <ellipse cx={500} cy={248} rx={56} ry={44} fill="url(#w8-rot-bulge)" />
        <ellipse cx={500} cy={338} rx={82} ry={52} fill="url(#w8-rot-bulge)" />
        <path d="M454,296 Q500,312 546,296" fill="none" stroke="rgba(120,70,50,0.28)" strokeWidth={1.6} />
        <ellipse cx={500} cy={446} rx={9} ry={7} fill="#e3b99c" stroke={EDGE} strokeWidth={1.2} />
        </Part>
        <Part id="behin-betiko-zilbor-hestea" quiet>
        <circle cx={500} cy={372} r={25} fill="#e9d6c6" stroke={EDGE} strokeWidth={1.6} />
        <circle cx={500} cy={372} r={25} fill="url(#w8-rot-bulge)" />
        </Part>
        <Part id="zilbor-hodiak" quiet>
        <circle cx={500} cy={364} r={6.5} fill="#5a4a9a" stroke="#2a1f55" strokeWidth={1} />
        <circle cx={491} cy={379} r={4.2} fill="#c0392b" stroke="#6b1d14" strokeWidth={1} />
        <circle cx={509} cy={379} r={4.2} fill="#c0392b" stroke="#6b1d14" strokeWidth={1} />
        </Part>
        {/* The head, half the embryo: wide-set eyes under thin lids, a flat nose, a wide mouth, ears still low. */}
        <Part id="burua" quiet>
        <path d="M470,168 L530,168 L534,192 L466,192Z" fill="#dcb497" />
        <ellipse cx={500} cy={104} rx={90} ry={82} fill="url(#w8-rot-skin)" stroke={EDGE} strokeWidth={1.6} />
        <ellipse cx={470} cy={70} rx={46} ry={30} fill="url(#w8-rot-bulge)" />
        {[452, 548].map((x) => (
          <g key={x}>
            <ellipse cx={x} cy={118} rx={13} ry={9} fill="#2b1d22" opacity={0.78} />
            <path d={`M${x - 14},116 Q${x},${106} ${x + 14},116`} fill="none" stroke="#9a6a52" strokeWidth={2} strokeLinecap="round" />
            <ellipse cx={x - 3} cy={116} rx={3} ry={2} fill="#fff" opacity={0.35} />
          </g>
        ))}
        <path d="M492,140 Q500,150 508,140" fill="none" stroke="#a87458" strokeWidth={2} strokeLinecap="round" />
        <circle cx={494} cy={143} r={1.6} fill="#7a4a36" />
        <circle cx={506} cy={143} r={1.6} fill="#7a4a36" />
        <path d="M474,164 Q500,166 526,164" fill="none" stroke="#8a5240" strokeWidth={2.2} strokeLinecap="round" />
        {[1, -1].map((s) => (
          <path key={s} d={`M${500 - s * 88},138 C${500 - s * 100},134 ${500 - s * 102},156 ${500 - s * 90},164`} fill="#e2bb9e" stroke={EDGE} strokeWidth={1.4} />
        ))}
        </Part>
        {LIMBS.map((l, i) => (
          <LimbTube key={i} l={l} alpha={l.lower ? aLow : aUp} r={l.lower ? rl : ru} />
        ))}
    </g>
  );
}
/** Root, joint (elbow/knee) and end (wrist/ankle) of each limb at rotation progress r: [right arm, left arm, right leg, left leg]. */
export function fetusLimb(i: number, r = 1): { root: Pt; joint: Pt; end: Pt; w: number } {
  const [a, b] = pieces(LIMBS[i], r);
  return { root: a.p0, joint: a.p1, end: b.p1, w: LIMBS[i].w };
}

export function LimbRotation({ t }: SceneProps) {
  const ru = seg(t, LIMB_T.rotUp + 0.015, LIMB_T.rotUp + 0.065);
  const rl = seg(t, LIMB_T.rotLow + 0.015, LIMB_T.rotLow + 0.065);
  const aUp = 90 - 90 * ru;
  const aLow = 90 + 90 * rl;
  const upTurn = vis(t, LIMB_T.rotUp, LIMB_T.rotLow);
  const lowTurn = vis(t, LIMB_T.rotLow);
  return (
    <g>
      <FetusFront ru={ru} rl={rl} />
      {LIMBS.map((l, i) => (
        <Disc key={i} l={l} alpha={l.lower ? aLow : aUp} turning={l.lower ? lowTurn : upTurn} label={1} />
      ))}

      <Note x={24} y={24} size={12.5} align="start">
        8. astea · aurretik (bentrala)
      </Note>
      <Note x={24} y={44} size={12.5} align="start">
        ondoan: zeharkako ebakidura
      </Note>
      <Note x={500} y={262} size={12.5} tone="accent" show={upTurn}>
        Goikoak: 90° albora (kanpora)
      </Note>
      <Note x={500} y={418} size={12.5} tone="accent" show={lowTurn}>
        Behekoak: 90° erdialdera (barrura)
      </Note>
      <Note x={240} y={282} size={12.5} tone="dim" show={seg(ru, 0.7, 1)}>
        ukondoa atzera
      </Note>
      <Note x={300} y={548} size={12.5} tone="dim" show={seg(rl, 0.7, 1)}>
        belauna aurrera
      </Note>
      <Note x={500} y={612} tone="accent" show={upTurn}>
        Goiko gorputz-adarrak: aurrean tolestatzaileak; atzean eta alboan hedatzaileak
      </Note>
      {/* The two colours, kept in sight the whole way (the names move from limb to limb). */}
      <g pointerEvents="none" fontSize={12.5} fontWeight={600} fill="rgba(244,247,255,0.92)">
        <rect x={748} y={14} width={238} height={26} rx={8} fill="rgba(11,12,15,0.78)" stroke="rgba(255,255,255,0.1)" />
        <rect x={760} y={21} width={14} height={12} rx={3} fill={Q.flexor} />
        <text x={780} y={31.5}>tolestatzaileak</text>
        <rect x={882} y={21} width={14} height={12} rx={3} fill={Q.extensor} />
        <text x={902} y={31.5}>hedatzaileak</text>
      </g>
      <Note x={500} y={612} tone="accent" show={lowTurn}>
        Beheko gorputz-adarrak (kontrako biraketa): aurrean hedatzaileak; atzean tolestatzaileak
      </Note>

      <Label id="muskulu-tolestatzaileak" x={720} y={130} ax={640} ay={262} show={vis(t, 0, LIMB_T.rotLow)} />
      <Label id="muskulu-hedatzaileak" x={810} y={290} ax={LIMBS[1].disc[0]} ay={LIMBS[1].disc[1] + 24} show={vis(t, 0, LIMB_T.rotLow)} />
      <Label id="muskulu-tolestatzaileak" x={810} y={420} ax={LIMBS[3].disc[0]} ay={LIMBS[3].disc[1] + 24} show={lowTurn} />
      <Label id="muskulu-hedatzaileak" x={810} y={540} ax={583} ay={533} show={lowTurn} />
    </g>
  );
}
