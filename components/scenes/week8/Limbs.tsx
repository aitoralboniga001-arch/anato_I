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

/** A cartilage rod from p0 toward p1 (grown to k), lavender with lacunae. */
function Rod({ p0, p1, w, k }: { p0: Pt; p1: Pt; w: number; k: number }) {
  if (k <= 0.01) return null;
  const e: Pt = [lerp(p0[0], p1[0], k), lerp(p0[1], p1[1], k)];
  const d = `M${f1(p0[0])},${f1(p0[1])}L${f1(e[0])},${f1(e[1])}`;
  return (
    <g>
      <path d={d} stroke={Q.cartDeep} strokeWidth={w + 3} strokeLinecap="round" />
      <path d={d} stroke={Q.cart} strokeWidth={w} strokeLinecap="round" />
      <path d={d} stroke="url(#w8-cart)" strokeWidth={w} strokeLinecap="round" />
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
          <Part id="iliona" show={k(0) > 0.01 ? 1 : 0}>
            <ellipse cx={WALL_X + 8} cy={y - 50} rx={15 * k(0)} ry={32 * k(0)} fill={Q.cart} stroke={Q.cartDeep} strokeWidth={1.5} transform={`rotate(-12 ${WALL_X + 8} ${y - 50})`} />
          </Part>
          <Part id="pubisa" show={k(0) > 0.01 ? 1 : 0}>
            <ellipse cx={WALL_X + 18} cy={y + 50} rx={17 * k(0)} ry={9 * k(0)} fill={Q.cart} stroke={Q.cartDeep} strokeWidth={1.5} transform={`rotate(20 ${WALL_X + 18} ${y + 50})`} />
          </Part>
          <Part id="iskiona" show={k(0) > 0.01 ? 1 : 0}>
            <ellipse cx={WALL_X - 8} cy={y + 60} rx={12 * k(0)} ry={11 * k(0)} fill={Q.cart} stroke={Q.cartDeep} strokeWidth={1.5} />
          </Part>
        </>
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
      <Part id="apoptosia" show={dying}>
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
const at = (p: Pt, ay: number) => ({ ax: WALL_X + (p[0] - WALL_X) * K, ay: ay + (p[1] - ay) * K });

export function LimbBuds({ t, reduced }: SceneProps) {
  const su = limbS(t, false);
  const sl = limbS(t, true);
  const up = limb(su, UP_Y);
  const low = limb(sl, LOW_Y);
  const cart = vis(t, LIMB_T.cart);
  const week = t < LIMB_T.plates ? '4.–5. astea' : t < LIMB_T.centres ? '6. astea' : '8. astea';
  const ray = (g: Limb, th: number, u: number) => along([g.X(g.xp - g.R * 0.45), g.ay], g.rim(th), u);
  return (
    <g>
      <Defs8 />
      <rect x={0} y={0} width={1000} height={640} fill="#0f0f11" />
      {/* The body wall, seen from behind: somites near the midline, the parietal layer at the side. */}
      <path d={`M0,0L${WALL_X},0L${WALL_X},640L0,640Z`} fill={TISSUE} />
      <path d={`M0,0L${WALL_X},0L${WALL_X},640L0,640Z`} fill="url(#w8-light)" />
      {Array.from({ length: 16 }, (_, i) => (
        <rect key={i} x={26} y={6 + i * 40} width={44} height={32} rx={9} fill={Q.paraxial} opacity={0.35} />
      ))}
      <Part id="paretako-orria">
        <rect x={WALL_X - 30} y={0} width={24} height={640} fill={Q.lateral} opacity={0.8} />
      </Part>
      <g transform={zoomAt(UP_Y)}>
        <LimbDrawing g={up} s={su} cells={CELLS_UP} lower={false} t={t} reduced={reduced} />
      </g>
      <g transform={zoomAt(LOW_Y)}>
        <LimbDrawing g={low} s={sl} cells={CELLS_LOW} lower t={t} reduced={reduced} />
      </g>
      <path d={`M${WALL_X},0L${WALL_X},640`} stroke={Q.skin} strokeWidth={2.4} opacity={0.8} />

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
      <Label id="goiko-gorputz-adarraren-hasikina" x={680} y={100} {...at(up.rim(-50), UP_Y)} show={vis(t, 0, LIMB_T.plates)} />
      <Label id="gorputz-adarren-mesenkima" x={700} y={160} {...at([up.X(up.xp * 0.45), UP_Y + 12], UP_Y)} show={vis(t, 0, LIMB_T.cart)} />
      <Label id="erpineko-ektodermo-ertza" x={770} y={236} {...at([up.rim(32)[0] + 2, up.rim(32)[1]], UP_Y)} show={seg(t, LIMB_T.aer, LIMB_T.aer + 0.03) * (1 - seg(su, 0.7, 0.76))} />
      <Label id="esku-plaka" x={810} y={276} {...at([up.X(up.xp + 6), UP_Y + up.R * 0.6], UP_Y)} show={vis(t, LIMB_T.plates, LIMB_T.cart)} />
      <Label id="hatzetako-izpiak" x={810} y={70} {...at(ray(up, -32, 0.72), UP_Y)} show={vis(t, LIMB_T.rays, LIMB_T.cart)} />
      <Label id="izpiarteko-ildoak" x={810} y={112} {...at(ray(up, -16, 0.86), UP_Y)} show={vis(t, LIMB_T.rays, LIMB_T.cart)} />
      <Label id="apoptosia" x={810} y={196} {...at(ray(up, 16, 0.78), UP_Y)} show={vis(t, LIMB_T.rays, LIMB_T.cart)} />
      <Label id="humeroa" x={810} y={50} {...at([up.X(40), UP_Y - 7], UP_Y)} show={cart} />
      <Label id="erradioa" x={810} y={84} {...at([up.X(up.xe + 30), UP_Y - 13], UP_Y)} show={cart} />
      <Label id="eskuko-kartilagoak" x={760} y={118} {...at(ray(up, -32, 0.3), UP_Y)} show={cart} />
      <Label id="falangeak" x={810} y={152} {...at(ray(up, -32, 0.76), UP_Y)} show={cart} />
      <Label id="ulna" x={810} y={236} {...at([up.X(up.xe + 30), UP_Y + 14], UP_Y)} show={cart} />
      <Label id="hezurtzapen-zentroak" x={740} y={290} {...at([up.X(14 + (up.xe - 24) / 2) + 8, UP_Y + 5], UP_Y)} show={vis(t, LIMB_T.centres)} />

      <Label id="paretako-orria" x={810} y={318} ax={WALL_X - 18} ay={318} />
      <Label id="beheko-gorputz-adarraren-hasikina" x={680} y={372} {...at(low.rim(-50), LOW_Y)} show={vis(t, 0.04, LIMB_T.plates)} />
      <Label id="oin-plaka" x={810} y={530} {...at([low.X(low.xp + 6), LOW_Y + low.R * 0.6], LOW_Y)} show={vis(t, LIMB_T.plates, LIMB_T.cart)} />
      <Label id="azaleko-ektodermoa" x={810} y={566} {...at([low.X(low.xp * 0.5), LOW_Y + low.w(low.xp * 0.5)], LOW_Y)} show={vis(t, 0, LIMB_T.cart)} small />
      <Label id="iliona" x={810} y={352} {...at([WALL_X + 14, LOW_Y - 66], LOW_Y)} show={cart} />
      <Label id="femurra" x={810} y={384} {...at([low.X(40), LOW_Y - 8], LOW_Y)} show={cart} />
      <Label id="tibia" x={810} y={414} {...at([low.X(low.xe + 30), LOW_Y - 14], LOW_Y)} show={cart} />
      <Label id="tartsoaren-kartilagoak" x={786} y={444} {...at([low.X(low.xw + 9), LOW_Y - 17], LOW_Y)} show={cart} />
      <Label id="metatartsoaren-kartilagoak" x={756} y={474} {...at(ray(low, 0, 0.3), LOW_Y)} show={cart} />
      <Label id="falangeak" x={810} y={504} {...at(ray(low, 32, 0.78), LOW_Y)} show={cart} />
      <Label id="peroneoa" x={810} y={534} {...at([low.X(low.xe + 30), LOW_Y + 13], LOW_Y)} show={cart} />
      <Label id="iskiona" x={810} y={562} {...at([WALL_X - 8, LOW_Y + 66], LOW_Y)} show={cart} />
      <Label id="pubisa" x={810} y={590} {...at([WALL_X + 24, LOW_Y + 56], LOW_Y)} show={cart} />
    </g>
  );
}

// ——— View `biraketa`: the 8th-week rotations, from the front ———
type L2 = { p0: Pt; p1: Pt; w: number; ms: 1 | -1; disc: Pt; lower: boolean };
const LIMBS: L2[] = [
  { p0: [418, 200], p1: [296, 330], w: 22, ms: 1, disc: [250, 196], lower: false },
  { p0: [582, 200], p1: [704, 330], w: 22, ms: -1, disc: [750, 196], lower: false },
  { p0: [462, 436], p1: [384, 572], w: 26, ms: 1, disc: [278, 470], lower: true },
  { p0: [538, 436], p1: [616, 572], w: 26, ms: -1, disc: [722, 470], lower: true },
];
const TORSO: Pt[] = [[436, 150], [564, 150], [594, 220], [592, 330], [578, 418], [540, 452], [460, 452], [422, 418], [408, 330], [406, 220]];

/** The visible part (as offsets −1…1 across the limb, + toward the midline) of a surface sector [a, b] (degrees from the front). */
function visibleBand(a: number, b: number): [number, number] | null {
  for (const k of [-360, 0, 360]) {
    const lo = Math.max(a + k, -90);
    const hi = Math.min(b + k, 90);
    if (hi - lo > 0.5) return [Math.sin(rad(lo)), Math.sin(rad(hi))];
  }
  return null;
}

function LimbTube({ l, alpha }: { l: L2; alpha: number }) {
  const dx = l.p1[0] - l.p0[0];
  const dy = l.p1[1] - l.p0[1];
  const len = Math.hypot(dx, dy);
  let n: Pt = [-dy / len, dx / len];
  if (n[0] * l.ms < 0) n = [-n[0], -n[1]];
  const band = (o1: number, o2: number) => {
    const a = l.w * o1;
    const b = l.w * o2;
    return `M${f1(l.p0[0] + n[0] * a)},${f1(l.p0[1] + n[1] * a)}L${f1(l.p1[0] + n[0] * a)},${f1(l.p1[1] + n[1] * a)}L${f1(l.p1[0] + n[0] * b)},${f1(l.p1[1] + n[1] * b)}L${f1(l.p0[0] + n[0] * b)},${f1(l.p0[1] + n[1] * b)}Z`;
  };
  const fl = visibleBand(alpha - 90, alpha + 90);
  const ex = visibleBand(alpha + 90, alpha + 270);
  const end: Pt = [l.p1[0] + (dx / len) * 22, l.p1[1] + (dy / len) * 22];
  return (
    <g>
      <path d={`M${f1(l.p0[0])},${f1(l.p0[1])}L${f1(l.p1[0])},${f1(l.p1[1])}`} stroke={EDGE} strokeWidth={l.w * 2 + 3} strokeLinecap="round" />
      <ellipse cx={end[0]} cy={end[1]} rx={l.lower ? 14 : 12} ry={l.lower ? 24 : 18} fill={TISSUE} stroke={EDGE} strokeWidth={1.5} transform={`rotate(${f1((Math.atan2(dy, dx) * 180) / Math.PI - 90)} ${f1(end[0])} ${f1(end[1])})`} />
      <Part id="muskulu-tolestatzaileak">{fl && <path d={band(fl[0], fl[1])} fill={Q.flexor} />}</Part>
      <Part id="muskulu-hedatzaileak">{ex && <path d={band(ex[0], ex[1])} fill={Q.extensor} />}</Part>
      {/* Cylinder shading: darker toward both edges. */}
      <path d={band(-1, -0.55)} fill="rgba(0,0,0,0.22)" />
      <path d={band(0.55, 1)} fill="rgba(0,0,0,0.22)" />
      <path d={band(-0.15, 0.15)} fill="rgba(255,255,255,0.12)" />
      {/* The joint halfway (elbow / knee): a crease, and its point (olecranon / patella) on the extensor side,
          seen from the front only while that side faces us. */}
      {(() => {
        const m: Pt = [(l.p0[0] + l.p1[0]) / 2, (l.p0[1] + l.p1[1]) / 2];
        const ext = rad(alpha + 180);
        const o = Math.sin(ext) * l.w * 0.82;
        const face = Math.cos(ext);
        const cap: Pt = [m[0] + n[0] * o, m[1] + n[1] * o];
        const ang = (Math.atan2(dy, dx) * 180) / Math.PI;
        return (
          <g>
            <path d={`M${f1(m[0] - n[0] * l.w)},${f1(m[1] - n[1] * l.w)}L${f1(m[0] + n[0] * l.w)},${f1(m[1] + n[1] * l.w)}`} stroke="rgba(60,30,20,0.45)" strokeWidth={1.6} />
            {face > -0.25 && (
              <ellipse
                cx={f1(cap[0])}
                cy={f1(cap[1])}
                rx={f1(l.lower ? 11 : 8)}
                ry={f1((l.lower ? 11 : 8) * (0.45 + 0.55 * Math.max(0, face)))}
                transform={`rotate(${f1(ang + 90)} ${f1(cap[0])} ${f1(cap[1])})`}
                fill="#f3dcc2"
                stroke={EDGE}
                strokeWidth={1.4}
                opacity={Math.min(1, (face + 0.25) * 2)}
              />
            )}
          </g>
        );
      })()}
      {/* The first digit (thumb / big toe) on the preaxial border: ends lateral above, medial below. */}
      {(() => {
        const th = rad(alpha - 90);
        const face = Math.cos(th);
        const o = Math.sin(th) * (l.lower ? 12 : 10);
        const ang = Math.atan2(dy, dx);
        const tip: Pt = [end[0] + Math.cos(ang) * (l.lower ? 6 : 4) + n[0] * o, end[1] + Math.sin(ang) * (l.lower ? 6 : 4) + n[1] * o];
        return face > -0.3 ? (
          <ellipse cx={f1(tip[0])} cy={f1(tip[1])} rx={l.lower ? 6.5 : 5} ry={l.lower ? 8 : 7.5} transform={`rotate(${f1((ang * 180) / Math.PI - 90)} ${f1(tip[0])} ${f1(tip[1])})`} fill="#f3dcc2" stroke={EDGE} strokeWidth={1.3} opacity={Math.min(1, (face + 0.3) * 2)} />
        ) : null;
      })()}
    </g>
  );
}

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
      <circle cx={cx} cy={cy} r={R + 3} fill="#1a1418" stroke="#4a3a46" strokeWidth={1.5} />
      <Part id="muskulu-tolestatzaileak">
        <path d={wedge(alpha - 90, alpha + 90)} fill={Q.flexor} />
      </Part>
      <Part id="muskulu-hedatzaileak">
        <path d={wedge(alpha + 90, alpha + 270)} fill={Q.extensor} />
      </Part>
      <circle cx={cx} cy={cy} r={9} fill="#f5efe2" stroke="#b9a77e" strokeWidth={1.2} />
      {turning > 0.02 && Math.abs(alpha - start) > 4 && (
        <g opacity={turning}>
          <path d={`M${arc.map((p) => `${f1(p[0])},${f1(p[1])}`).join('L')}`} fill="none" stroke="#fff" strokeWidth={2.6} strokeLinecap="round" />
          <path d={`M${f1(head[0] + Math.cos(ang) * 8)},${f1(head[1] + Math.sin(ang) * 8)}L${f1(head[0] + Math.cos(ang + 2.4) * 8)},${f1(head[1] + Math.sin(ang + 2.4) * 8)}L${f1(head[0] + Math.cos(ang - 2.4) * 8)},${f1(head[1] + Math.sin(ang - 2.4) * 8)}Z`} fill="#fff" />
        </g>
      )}
      <text x={cx} y={cy - R - 18} textAnchor="middle" fontSize={11.5} fontWeight={600} fill="#cbd5e1" stroke="#0f0f11" strokeWidth={3} paintOrder="stroke" opacity={label}>
        aurrea
      </text>
      <text x={cx} y={cy + R + 22} textAnchor="middle" fontSize={11.5} fontWeight={600} fill="#cbd5e1" stroke="#0f0f11" strokeWidth={3} paintOrder="stroke" opacity={label}>
        atzea
      </text>
    </g>
  );
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
      <Defs8 />
      <rect x={0} y={0} width={1000} height={640} fill="#0f0f11" />
      <circle cx={500} cy={98} r={58} fill={TISSUE} stroke={EDGE} strokeWidth={1.5} />
      <path d={smoothPath(TORSO, true, 0.3)} fill={TISSUE} stroke={EDGE} strokeWidth={1.5} />
      <path d={smoothPath(TORSO, true, 0.3)} fill="url(#w8-light)" />
      {LIMBS.map((l, i) => (
        <LimbTube key={i} l={l} alpha={l.lower ? aLow : aUp} />
      ))}
      {LIMBS.map((l, i) => (
        <Disc key={i} l={l} alpha={l.lower ? aLow : aUp} turning={l.lower ? lowTurn : upTurn} label={1} />
      ))}

      <Note x={260} y={30} size={12}>
        8. astea · aurretik (bentrala); ondoan zeharkako ebakidura
      </Note>
      <Note x={500} y={262} size={12.5} tone="accent" show={upTurn}>
        Goikoak: 90° albora (kanpora)
      </Note>
      <Note x={500} y={418} size={12.5} tone="accent" show={lowTurn}>
        Behekoak: 90° erdialdera (barrura)
      </Note>
      <Note x={240} y={282} size={11} tone="dim" show={seg(ru, 0.7, 1)}>
        ukondoa atzera
      </Note>
      <Note x={322} y={548} size={11} tone="dim" show={seg(rl, 0.7, 1)}>
        belauna aurrera
      </Note>
      <Note x={500} y={612} tone="accent" show={upTurn}>
        Goiko gorputz-adarrak: aurrean tolestatzaileak; atzean eta alboan hedatzaileak
      </Note>
      <Note x={500} y={612} tone="accent" show={lowTurn}>
        Beheko gorputz-adarrak (kontrako biraketa): aurrean hedatzaileak; atzean tolestatzaileak
      </Note>

      <Label id="muskulu-tolestatzaileak" x={720} y={130} ax={640} ay={262} show={vis(t, 0, LIMB_T.rotLow)} />
      <Label id="muskulu-hedatzaileak" x={810} y={290} ax={LIMBS[1].disc[0]} ay={LIMBS[1].disc[1] + 24} show={vis(t, 0, LIMB_T.rotLow)} />
      <Label id="muskulu-tolestatzaileak" x={810} y={420} ax={LIMBS[3].disc[0]} ay={LIMBS[3].disc[1] + 24} show={lowTurn} />
      <Label id="muskulu-hedatzaileak" x={810} y={540} ax={588} ay={524} show={lowTurn} />
    </g>
  );
}
