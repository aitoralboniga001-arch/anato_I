'use client';

import { C, Cell, Flow, Label, Mark, Note, Part, lerp, mix, seg, smoothPath, zoom, type Pt, type SceneProps } from '@/components/kit';
import { fibrinPlug } from './Day9';
import { CYTO, HYPO_BOTTOM, INNER, R, TrapBand, VESSELS, W2, bandAround, circlePath, stalkBridge, conceptusAt, discGeometry, f1, lensPath, toCyto } from './common';

/**
 * 11-12. eguna — sare lakunarra, hasierako zirkulazio uteroplazentarioa, enbrioi kanpoko
 * mesodermoa eta korion barrunbea.
 * Windows (shared by every view and the stage beats in content/weeks/week2.ts):
 *   .00-.06 fibrina koagulu txikia oraindik han · .04-.20 lakuak elkarren artean komunikatzen: sare lakunarra
 *   .16-.28 sinzitiotrofoblastoak sinusoideen pareta urratzen du · .26-.40 amaren odola lakuetan zirkulatzen hasten da
 *   .42-.68 konzeptua hazi eta enbrioi kanpoko mesodermoa agertzen da (zito eta amnios/bitelo zakuaren artean)
 *   .54-.64 mesodermoan hutsune txikiak ireki, handitu eta fusionatzen dira -> korion barrunbea; finkapen pedikulua geratzen da
 *   .78-.88 desidua erreakzioa: estroma edematoso · .80-.875 zelula poliedrikoak glukogenoz beteta habiratze-gunean
 *   .92-.965 erreakzioa endometrio osora hedatzen da (urruneko estroma-zelulak ere poliedriko)
 */
export const W = {
  fibrin: [0, 0.06],
  network: [0.04, 0.2],
  erosion: [0.16, 0.28],
  circulation: [0.26, 0.4],
  mesoGrow: [0.42, 0.68],
  cavitate: [0.54, 0.64],
  decidua: [0.78, 0.88],
  cells: [0.8, 0.875],
  spread: [0.92, 0.965],
} as const;

const s = (t: number, w: readonly [number, number]) => seg(t, w[0], w[1]);
const rad = (deg: number) => (deg * Math.PI) / 180;
const norm = (a: number) => (a < 90 ? a + 360 : a);

/** Half-width of the fibrin plug still sealing the entry point: small on day 11 ("txiki-txikia"), smaller by day 12 as the epithelium closes over it. */
const PLUG: [number, number] = [24, 13];
/** The implantation site bulges into the uterine lumen ("goragunea"); day 13 continues it. */
export const BULGE = 9;
/** Surface of the endometrium at x: flat, bulging into the lumen over the implantation site. */
export const surfaceAt = (x: number, bulge: number) => W2.surfaceY + bulge * Math.exp(-(((x - W2.cx) / 150) ** 2));
/** Trophoblast radius at the end of day 12; day 13 continues from here. */
export const RC_END = 175;
const CY0 = W2.surfaceY - 10 - R;
/** Angle where the hypoblast disc's edge meets the cytotrophoblast (amnion/disc side has no Heuser membrane). */
const EDGE_H = (Math.asin(-HYPO_BOTTOM / INNER) * 180) / Math.PI;
const AMNION_L = 180 + EDGE_H;
const AMNION_R = 360 - EDGE_H;
const LACUNA = '#d3ebe6';

function fingers(a: number) {
  return 1 + 0.22 * Math.sin((a * Math.PI) / 11) + 0.12 * Math.sin((a * Math.PI) / 5.3);
}
/** Syncytiotrophoblast thickness at angle `a` (full coverage, as at the end of day 9). */
function synTh(a: number) {
  const p = Math.pow((1 - Math.sin(rad(a))) / 2, 0.9);
  return (7 + 63 * p) * (1 + (fingers(a) - 1) * p);
}

/**
 * The trophoblast shell (centre cyC) grows much faster than the embryo complex (amnion + disc +
 * yolk sac, centre cy), which stays hung from the future connecting stalk at the embryonic pole.
 */
function geometry(t: number) {
  const grow = seg(t, W.mesoGrow[0], W.cavitate[1]);
  const Rc = lerp(R, RC_END, grow);
  const { cyC, cy, D } = conceptusAt(Rc);
  const core = discGeometry(W2.cx, cy);
  const cav = s(t, W.cavitate);
  return { ...core, cyC, Rc, cav, thickness: D, plug: lerp(PLUG[0], PLUG[1], s(t, W.fibrin)) };
}
type Geo = ReturnType<typeof geometry>;

/** Around the trophoblast centre (syncytio, lacunae, cyto). */
const polar = (g: Geo, a: number, r: number): Pt => [g.cx + r * Math.cos(rad(a)), g.cyC + r * Math.sin(rad(a))];
/** Around the embryo-complex centre (mesoderm, cavity, stalk). */
const polarE = (g: Geo, a: number, r: number): Pt => [g.cx + r * Math.cos(rad(a)), g.cy + r * Math.sin(rad(a))];
/** From the embryo-complex centre to the cytotrophoblast's inner face, along angle a. */
const outR = (g: Geo, a: number) => toCyto(g.cy, g.cyC, g.Rc, a);
const synAt = (g: Geo, a: number, frac: number): Pt => polar(g, a, g.Rc + frac * synTh(norm(a)));

function syncytioPath(g: Geo) {
  const pts: Pt[] = [];
  for (let i = 0; i < 120; i++) {
    const a = 90 + i * 3;
    pts.push(polar(g, a, g.Rc + synTh(a)));
  }
  return `${smoothPath(pts, true)}${circlePath(g.cx, g.cyC, g.Rc, 0)}`;
}

/** Lacunae, already merged by the end of day 9: fixed angular slots that grow and, once networked, join by thin necks. */
const LACUNAE_A = [188, 212, 236, 259, 282, 305, 328, 352];

function lacunaBlob(g: Geo, a: number, seed: number) {
  const [cx, cy] = synAt(g, a, 0.5);
  const th = synTh(norm(a));
  const rx = Math.min(19, th * 0.34);
  const ry = rx * 0.72;
  const tx = -Math.sin(rad(a));
  const ty = Math.cos(rad(a));
  const nx = Math.cos(rad(a));
  const ny = Math.sin(rad(a));
  const pts: Pt[] = [];
  for (let i = 0; i < 12; i++) {
    const phi = (i / 12) * Math.PI * 2;
    const w = 1 + 0.14 * Math.sin(3 * phi + seed) + 0.08 * Math.cos(5 * phi + seed * 2.1);
    const u = rx * w * Math.cos(phi);
    const v = ry * w * Math.sin(phi);
    pts.push([cx + u * tx + v * nx, cy + u * ty + v * ny]);
  }
  return smoothPath(pts, true);
}

/** Maternal vessels close enough to the implantation site to be eroded into the lacunar network. */
/** Spaces in the extra-embryonic mesoderm: [angle°, opening delay, relative size]. None in the stalk (251–269°). */
const SPACES: [number, number, number][] = [
  [285, 0.0, 0.8], [312, 0.12, 0.6], [338, 0.05, 0.9], [4, 0.16, 0.7], [30, 0.02, 0.85], [56, 0.1, 0.6], [82, 0.06, 0.9],
  [108, 0.14, 0.7], [134, 0.03, 0.8], [160, 0.11, 0.65], [186, 0.07, 0.85], [212, 0.15, 0.6], [236, 0.09, 0.75],
];
/** Fluid-filled space: darker than the amnion (blue) and the yolk sac (yellow), as in week 3. */
export const CAVITY = '#111a2e';
const YOLK_WALL = '#f7d98a';
/** Half-width (°) each space reaches when they merge: slightly more than half the spacing, so they overlap. */
const SPACE_W = 15;

const NEAR_VESSEL = VESSELS.map(([x, y]) => Math.hypot(x - W2.cx, y - CY0) < 235);

/**
 * Vessel `i` as the conceptus grows: the stroma is pushed aside, so a vessel the syncytium would
 * swallow moves out along its radius. Sinusoids stay just embedded in the syncytium's edge (eroded
 * into the lacunae); other vessels keep clear of it.
 */
function vesselAt(g: Geo, i: number, rx: number): Pt {
  const [x, y] = VESSELS[i];
  const dx = x - g.cx;
  const dy = y - g.cyC;
  const d = Math.hypot(dx, dy) || 1;
  const a = (Math.atan2(dy, dx) * 180) / Math.PI;
  const need = g.Rc + synTh(a) + (NEAR_VESSEL[i] ? rx * 0.2 : rx + 6);
  return d >= need ? [x, y] : [g.cx + (dx / d) * need, g.cyC + (dy / d) * need];
}

const DECIDUAL_CELLS: Pt[] = [
  [340, 180],
  [660, 165],
  [300, 90],
  [700, 95],
  [380, 140],
  [620, 220],
  [260, 210],
  [740, 200],
  [440, 70],
  [560, 75],
];
/** Decidual cells next to the implantation site (they change first). */
const nearSite = (x: number, y: number) => Math.hypot(x - W2.cx, y - 400) < 290;

function Day1112Drawing({ t, reduced }: SceneProps) {
  const g = geometry(t);
  const { cx, cy, epiTop, discY, hypoBottom, wEpiTop, wDisc, wHypo, Rc, cav, thickness } = g;
  const network = s(t, W.network);
  const erosion = s(t, W.erosion);
  const circ = s(t, W.circulation);
  const decidua = s(t, W.decidua);
  const cells = s(t, W.cells);
  const spread = s(t, W.spread);
  const lens = lensPath(g);

  // Mesoderm between the embryo complex and the cyto: solid first, then it hollows into two thin
  // layers joined by the stalk. Widths vary with the angle (short at the stalk, widest abembryonically).
  const width = (a: number) => Math.max(0, outR(g, a) - INNER);
  const bandTh = (a: number) => Math.max(4, lerp(width(a) / 2, 9, cav));
  const inner = () => INNER;
  const innerB = (a: number) => INNER + bandTh(a);
  const outer = (a: number) => outR(g, a);
  const outerB = (a: number) => Math.max(innerB(a), outR(g, a) - bandTh(a));
  // Connecting stalk: a short neck at the embryonic pole whose sides fillet into both layers.
  const STALK_A = 260;
  const stalk = stalkBridge(cx, cy, STALK_A, INNER + bandTh(STALK_A) / 2, innerB(STALK_A), outerB(STALK_A), outer(STALK_A) - bandTh(STALK_A) / 2, 22, 14);
  // The solid tissue stays between the spaces until they have merged; only then are the two layers left.
  const genericShow = thickness > 3 ? 1 - seg(cav, 0.7, 0.9) : 0;
  const layerShow = seg(cav, 0.7, 0.9);
  const cavityShow = seg(cav, 0.72, 0.9);
  // Small spaces open at scattered points of the mesoderm, grow and merge into one cavity; the
  // connecting stalk never hollows. Staggered so the viewer sees them appear one by one.
  const spaces = SPACES.map(([a, delay, rr], i) => {
    const open = seg(cav, 0.04 + delay, 0.3 + delay);
    const merge = seg(cav, 0.45, 0.85);
    const mid = (b: number) => (INNER + outR(g, b)) / 2;
    const half = (b: number) => Math.max(0, width(b) / 2 - 7);
    const r0 = (b: number) => lerp(mid(b) - half(b) * rr * open, innerB(b), merge);
    const r1 = (b: number) => lerp(mid(b) + half(b) * rr * open, outerB(b), merge);
    const w = lerp(4 * open, SPACE_W, merge);
    return { key: i, d: open > 0.01 ? bandAround(cx, cy, (b) => Math.min(r0(b), r1(b) - 0.5), r1, a - w, a + w) : null };
  });

  return (
    <g>
      <g mask="url(#m-slab)" pointerEvents="none">
        {decidua > 0 && <rect x={0} y={0} width={1000} height={W2.surfaceY} fill="url(#p-decidua)" opacity={decidua * 0.7} />}
      </g>

      <circle cx={cx} cy={cy} r={INNER} fill="#1b2437" pointerEvents="none" />
      <Part id="hasierako-bitelo-zakua">
        {(() => {
          const rY = INNER - 4.5;
          const wY = Math.sqrt(rY * rY - HYPO_BOTTOM * HYPO_BOTTOM);
          const yolk = `M${f1(cx - wY)},${f1(hypoBottom)} A${rY} ${rY} 0 1 0 ${f1(cx + wY)},${f1(hypoBottom)} Z`;
          return (
            <>
              <path d={bandAround(cx, cy, () => INNER - 4.5, () => INNER, AMNION_R, AMNION_L + 360)} fill={YOLK_WALL} opacity={0.75} />
              <path d={yolk} fill={C.yolkCavity} />
              <path d={yolk} fill="rgba(242,193,78,0.34)" />
              <path d={yolk} fill="url(#g-cavity)" />
            </>
          );
        })()}
      </Part>

      {/* Mesoderm ring: solid tissue first, then hollows into somatopleura / esplaknopleura / korion barrunbea. */}
      {thickness > 3 && (
        <>
          <Part id="enbrioi-kanpoko-mesodermoa" show={genericShow}>
            <path d={`${circlePath(cx, g.cyC, Rc - CYTO)}${circlePath(cx, cy, INNER)}`} fill="url(#p-meso-extra)" fillRule="evenodd" stroke="#c97a52" strokeWidth={1} />
          </Part>
          <Part id="korion-barrunbea" show={cavityShow}>
            <path d={bandAround(cx, cy, innerB, outerB, STALK_A, STALK_A + 360)} fill={CAVITY} stroke="rgba(255,255,255,0.22)" strokeWidth={0.8} />
          </Part>
          {cav > 0.02 && cavityShow < 0.99 && (
            <Part id="korion-barrunbea">
              {spaces.map((sp) => sp.d && <path key={sp.key} d={sp.d} fill={CAVITY} stroke={CAVITY} strokeWidth={5} strokeLinejoin="round" />)}
            </Part>
          )}
          <Part id="somatopleura-kanpokoa" show={layerShow}>
            <path d={bandAround(cx, cy, outerB, outer, 0, 360)} fill="url(#p-meso-extra)" stroke="#c97a52" strokeWidth={1} />
            <path d={bandAround(cx, cy, inner, innerB, AMNION_L, AMNION_R)} fill="url(#p-meso-extra)" stroke="#c97a52" strokeWidth={1} />
          </Part>
          <Part id="esplaknopleura-kanpokoa" show={layerShow}>
            <path d={bandAround(cx, cy, inner, innerB, AMNION_R, AMNION_L + 360)} fill="url(#p-meso-extra)" stroke="#c97a52" strokeWidth={1} />
          </Part>
          <Part id="finkapen-pedikulua" show={1}>
            <path d={stalk.d} fill="url(#p-meso-extra)" />
            <g fill="none" stroke="#c97a52" strokeWidth={1} opacity={layerShow}>
              <path d={stalk.left} />
              <path d={stalk.right} />
            </g>
          </Part>
        </>
      )}

      <Part id="sinzitiotrofoblastoa">
        <path d={syncytioPath(g)} fill="url(#p-syncytio)" fillRule="evenodd" stroke={C.syncytioDeep} strokeWidth={1.4} />
      </Part>

      {/* Sare lakunarra: thin necks joining the lacunae once they start communicating. */}
      <Part id="sare-lakunarra" show={network}>
        {LACUNAE_A.map((a, i) => {
          const b = LACUNAE_A[(i + 1) % LACUNAE_A.length];
          if (i === LACUNAE_A.length - 1) return null;
          const p0 = synAt(g, a, 0.5);
          const p1 = synAt(g, b, 0.5);
          return <path key={i} d={`M${f1(p0[0])},${f1(p0[1])} L${f1(p1[0])},${f1(p1[1])}`} stroke={mix(LACUNA, C.maternalBlood, circ)} strokeWidth={lerp(0, 6, network)} strokeLinecap="round" opacity={0.85} />;
        })}
      </Part>

      <Part id="lakuak">
        {LACUNAE_A.map((a, i) => (
          <path key={i} d={lacunaBlob(g, a, i * 1.9 + 0.7)} fill={mix(LACUNA, C.maternalBlood, circ)} stroke={C.syncytioDeep} strokeWidth={1} />
        ))}
      </Part>

      {circ > 0.05 &&
        !reduced &&
        NEAR_VESSEL.flatMap((near, vi) => {
          if (!near) return [];
          const [vx, vy] = vesselAt(g, vi, 13 * VESSELS[vi][2] * lerp(1, 2, erosion));
          const a = LACUNAE_A[vi % LACUNAE_A.length];
          const p = synAt(g, a, 0.5);
          return [<Flow key={vi} d={`M${f1(vx)},${f1(vy)} L${f1(p[0])},${f1(p[1])}`} n={2} dur={2.6} r={1.8} reduced={reduced} />];
        })}

      <Part id="amaren-odol-hodiak" quiet>
        {VESSELS.map(([, , sc], i) => {
          if (NEAR_VESSEL[i]) return null;
          const [x, y] = vesselAt(g, i, 13 * sc);
          return <ellipse key={i} cx={f1(x)} cy={f1(y)} rx={13 * sc} ry={8 * sc} fill="url(#p-blood)" stroke="#8d1024" strokeWidth={1.4} />;
        })}
      </Part>
      <Part id="sinusoideak">
        {VESSELS.map(([, , sc], i) => {
          if (!NEAR_VESSEL[i]) return null;
          const dil = lerp(1, 2, erosion);
          const [x, y] = vesselAt(g, i, 13 * sc * dil);
          return <ellipse key={i} cx={f1(x)} cy={f1(y)} rx={13 * sc * dil} ry={8 * sc * dil} fill="url(#p-blood)" stroke={mix('#8d1024', '#f3b3c0', erosion)} strokeWidth={1.6} />;
        })}
      </Part>

      <Part id="zitotrofoblastoa">
        <path
          d={`${circlePath(cx, g.cyC, Rc)}${circlePath(cx, g.cyC, Rc - CYTO, 0)}`}
          fill={C.cyto}
          fillRule="evenodd"
          stroke="#4a9d63"
          strokeWidth={1}
        />
      </Part>

      <Part id="amnios-barrunbea">
        <path d={lens} fill="#6d9be6" opacity={0.42} />
        <path d={lens} fill="url(#g-cavity)" />
        {/* Amnion roof (amnioblasts): once the mesoderm separates it from the cyto it is a wall of its own. */}
        <path d={bandAround(cx, cy, () => INNER - 4, () => INNER, AMNION_L, AMNION_R)} fill={C.amnioblast} opacity={0.85} />
      </Part>
      <Part id="epiblastoa">
        <TrapBand cx={cx} yTop={epiTop} yBottom={discY} wTop={wEpiTop} wBottom={wDisc} n={15} color={C.epiblast} shape="columnar" />
      </Part>
      <Part id="hipoblastoa">
        <TrapBand cx={cx} yTop={discY} yBottom={hypoBottom} wTop={wDisc} wBottom={wHypo} n={17} color={C.hypoblast} shape="cuboidal" />
      </Part>

      {/* Decidual cells: polyhedral, glycogen/lipid-rich, oedematous stroma. */}
      <Part id="desidua-zelulak" show={cells}>
        {/* First around the implantation site, then (next step) out through the rest of the endometrium. */}
        {DECIDUAL_CELLS.map(([x, y], i) => (
          <Cell key={i} x={x} y={y} r={9} rx={9} ry={7.4} color="#f4d99a" nucleus="rgba(90,60,10,0.55)" nucleusScale={0.4} opacity={0.92 * (nearSite(x, y) ? 1 : spread)} />
        ))}
      </Part>
    </g>
  );
}

type At = (x: number, y: number) => [number, number];
function makeL(at: At) {
  return function label(id: string, x: number, y: number, p: Pt, show = 1, key = id) {
    const [ax, ay] = at(p[0], p[1]);
    return <Label key={key} id={id} x={x} y={y} ax={ax} ay={ay} show={show} />;
  };
}

/** A soft glow at a point of the drawing, for what a step names but has no outline (the decidual reaction, the flow). */
function makeM(at: At) {
  return function mark(id: string, p: Pt, rx: number, show = 1, color?: string) {
    const [x, y] = at(p[0], p[1]);
    return <Mark key={`m-${id}`} id={id} x={x} y={y} rx={rx} show={show} color={color} />;
  };
}

function anchors(t: number) {
  const g = geometry(t);
  const { cx, cy, epiTop, discY } = g;
  return {
    g,
    network: s(t, W.network),
    erosion: s(t, W.erosion),
    circ: s(t, W.circulation),
    cav: g.cav,
    decidua: s(t, W.decidua),
    cells: s(t, W.cells),
    generic: g.thickness > 3 ? 1 - seg(g.cav, 0.7, 0.9) : 0,
    layer: seg(g.cav, 0.7, 0.9),
    cavity: seg(g.cav, 0.35, 0.6),
    syn: (a: number) => synAt(g, a, 0.5),
    lacuna: (a: number) => synAt(g, a, 0.5),
    cyto: (a: number) => polar(g, a, g.Rc - CYTO / 2),
    /** A point in the mesoderm: fraction f of the way from the embryo complex to the cyto (+ offset px). */
    meso: (a: number, f: number, off = 0) => polarE(g, a, lerp(INNER, outR(g, a), f) + off),
    amnios: [cx - 22, (cy - INNER + epiTop) / 2 + 2] as Pt,
    epi: [cx + 38, (epiTop + discY) / 2] as Pt,
    yolk: [cx - 14, cy + 60] as Pt,
    stalk: polarE(g, 260, (INNER + outR(g, 260)) / 2),
  };
}

export function Day1112Section(props: SceneProps) {
  const { t } = props;
  const k = anchors(t);
  const L = makeL((x, y) => [x, y]);
  const M = makeM((x, y) => [x, y]);
  return (
    <g>
      <EndometriumBack decidua={k.decidua} bulge={BULGE} />
      <Day1112Drawing {...props} />
      <EndometriumFront gap={k.g.plug - 7} bulge={BULGE} />
      <FibrinPlug half={k.g.plug} />
      {M('desidua-erreakzioa', [340, 130], 56, k.decidua)}
      {M('zirkulazio-uteroplazentarioa', k.lacuna(259), 42, k.circ, '#ff8a8a')}
      {L('endometrio-estroma', 190, 50, [300, 60])}
      {L('amaren-odol-hodiak', 190, 100, vesselAt(k.g, 3, 13 * VESSELS[3][2]))}
      {L('umetoki-guruina', 190, 150, [266, 250])}
      {L('desidua-erreakzioa', 190, 200, [340, 130], k.decidua)}
      {L('sare-lakunarra', 190, 250, k.lacuna(200), k.network)}
      {L('lakuak', 190, 380, k.lacuna(224))}
      {L('zirkulazio-uteroplazentarioa', 208, 430, k.lacuna(259), k.circ)}
      {L('sinzitiotrofoblastoa', 190, 470, k.syn(150))}
      {L('zitotrofoblastoa', 190, 515, k.cyto(140))}
      {L('endometrio-epitelioa', 190, 560, [300, surfaceAt(300, BULGE) - 4])}
      {/* Right under the plug, in the lumen: the step names it, so it is named where it is. */}
      <Label id="fibrina-koagulua" x={500} y={549} ax={500} ay={W2.surfaceY + BULGE + 8} align="middle" small />
      {L('mutur-enbrionarioa', 810, 250, k.cyto(276))}
      {L('sinusoideak', 810, 315, vesselAt(k.g, 4, 13 * VESSELS[4][2] * lerp(1, 2, k.erosion)), seg(t, 0.14, 0.18))}
      {/* Still named while it hollows out (step "Hasieran ehun betea da…"), then its two sheets take over. */}
      {L('enbrioi-kanpoko-mesodermoa', 810, 380, k.meso(300, 0.5), Math.max(k.generic, seg(t, 0.42, 0.46) * (1 - seg(t, 0.62, 0.64))))}
      {L('korion-barrunbea', 810, 430, k.meso(12, 0.5), k.cavity)}
      {L('finkapen-pedikulua', 810, 470, k.stalk, k.layer)}
      {L('amnios-barrunbea', 810, 515, k.amnios)}
      {L('epiblastoa', 810, 560, k.epi)}
      {L('hasierako-bitelo-zakua', 810, 598, k.yolk)}
      <Note x={500} y={585} tone="dim" show={1}>
        Endometrioaren paretan goragune bat antzematen da: habiratze-gunea
      </Note>
    </g>
  );
}

/** Stroma + glands + surface epithelium drawn locally so the mesoderm ring's mask stays independent of Endometrium's children order. Exported so day 13 (which continues this implantation site) can reuse it. */
export function EndometriumBack({ decidua, bulge = 0 }: { decidua: number; bulge?: number }) {
  const GLANDS: Pt[][] = [
    [[262, 500], [272, 452], [252, 400], [270, 350], [256, 300], [266, 250]],
    [[742, 500], [734, 446], [754, 392], [738, 340], [750, 288]],
  ];
  return (
    <g mask="url(#m-slab)">
      <Part id="endometrio-estroma" quiet>
        {/* Down to the bottom of the bulge; the lumen (EndometriumFront) covers what lies below the surface. */}
        <rect x={0} y={0} width={1000} height={W2.surfaceY + bulge} fill="url(#p-stroma)" />
        <rect x={0} y={0} width={1000} height={W2.surfaceY + bulge} fill="url(#p-decidua)" opacity={decidua} />
      </Part>
      <Part id="umetoki-guruina">
        {GLANDS.map((gl, i) => {
          const d = smoothPath(gl, false);
          return (
            <g key={i}>
              <path d={d} fill="none" stroke="#c98a9e" strokeWidth={22} strokeLinecap="round" />
              <path d={d} fill="none" stroke="#7a2f45" strokeWidth={5} strokeLinecap="round" />
            </g>
          );
        })}
      </Part>
    </g>
  );
}

export function EndometriumFront({ gap, bulge = 0 }: { gap: number; bulge?: number }) {
  const { epiThickness, cx } = W2;
  // The surface follows the bulge of the implantation site; `gap` is the half-width still open (the fibrin plug).
  const line = (x0: number, x1: number) => {
    const n = Math.max(1, Math.ceil(Math.abs(x1 - x0) / 10));
    return Array.from({ length: n + 1 }, (_, i) => {
      const x = lerp(x0, x1, i / n);
      return `${i ? 'L' : 'M'}${f1(x)},${f1(surfaceAt(x, bulge))}`;
    }).join('');
  };
  const lumen = `${line(0, 1000)}L1000,640L0,640Z`;
  return (
    <g mask="url(#m-slab)">
      <Part id="endometrio-epitelioa">
        {(gap > 3 ? [line(0, cx - gap), line(cx + gap, 1000)] : [line(0, 1000)]).map((d) => (
          <path key={d.slice(0, 12)} d={d} fill="none" stroke={C.epithelium} strokeWidth={epiThickness} strokeLinecap="round" strokeLinejoin="round" />
        ))}
      </Part>
      <Part id="umetoki-barrunbea" quiet>
        <path d={lumen} transform="translate(0 1)" fill="#1a1426" />
        <path d={lumen} transform="translate(0 1)" fill="url(#g-shade)" opacity={0.4} />
      </Part>
    </g>
  );
}

/** What is left of the fibrin plug: in the epithelial gap, on the bulge, over the lumen. */
function FibrinPlug({ half }: { half: number }) {
  return (
    <Part id="fibrina-koagulua">
      {fibrinPlug(1, half, BULGE).map((d, i) => (
        <path key={i} d={d} fill="url(#p-fibrin)" stroke="#b9ae95" strokeWidth={1} />
      ))}
    </Part>
  );
}

export function Day1112Meso(props: SceneProps) {
  const { t } = props;
  const k = anchors(t);
  const { cx, cy } = k.g;
  // Fixed frame (centred where the shell ends up), so the growth of the chorionic cavity is seen.
  const z = zoom(cx, W2.surfaceY - 10 - RC_END, 1.45, 500, 320);
  const L = makeL(z.at);
  return (
    <g>
      <rect x={0} y={0} width={1000} height={640} fill="#101828" />
      <g transform={z.transform}>
        <EndometriumBack decidua={0} />
        <Day1112Drawing {...props} />
      </g>
      {L('zitotrofoblastoa', 180, 90, k.cyto(200))}
      {L('enbrioi-kanpoko-mesodermoa', 192, 150, k.meso(222, 0.5), Math.max(k.generic, seg(t, 0.42, 0.46) * (1 - seg(t, 0.62, 0.64))))}
      {L('somatopleura-kanpokoa', 180, 210, k.meso(212, 1, -5), k.layer)}
      {L('korion-barrunbea', 180, 400, k.meso(215, 0.5), k.cavity)}
      {L('esplaknopleura-kanpokoa', 180, 460, k.meso(160, 0, 4), k.layer)}
      {L('hasierako-bitelo-zakua', 180, 520, k.yolk)}
      {L('finkapen-pedikulua', 800, 150, k.stalk, k.layer)}
      {L('amnios-barrunbea', 800, 210, k.amnios)}
      {L('epiblastoa', 800, 260, k.epi)}
      {L('sinzitiotrofoblastoa', 800, 460, k.syn(15))}
      <Note x={500} y={585} tone="accent" show={k.cavity}>
        Korion barrunbeak amnios barrunbea eta bitelo zakua inguratzen ditu, finkapen pedikulua izan ezik
      </Note>
    </g>
  );
}

export function Day1112Desidua(props: SceneProps) {
  const { t } = props;
  const k = anchors(t);
  const { cx, cy } = k.g;
  // Framed so the slab's feathered left edge (x≈205) falls under the label column, not mid-picture.
  const z = zoom(cx - 147, k.g.cyC - 170, 2.1, 500, 320);
  const L = makeL(z.at);
  const M = makeM(z.at);
  return (
    <g>
      <rect x={0} y={0} width={1000} height={640} fill="#101828" />
      <g transform={z.transform}>
        <EndometriumBack decidua={k.decidua} />
        <Day1112Drawing {...props} />
      </g>
      {M('desidua-erreakzioa', [340, 140], 90, k.decidua)}
      {M('zirkulazio-uteroplazentarioa', k.lacuna(236), 70, k.circ, '#ff8a8a')}
      {L('endometrio-estroma', 180, 60, [280, 120])}
      {L('desidua-erreakzioa', 180, 110, [340, 150], k.decidua)}
      {L('desidua-zelulak', 180, 160, [340, 140], k.cells)}
      {L('umetoki-guruina', 180, 210, [266, 250])}
      {L('amaren-odol-hodiak', 800, 60, vesselAt(k.g, 3, 13 * VESSELS[3][2]))}
      {L('sinusoideak', 800, 110, vesselAt(k.g, 4, 13 * VESSELS[4][2] * lerp(1, 2, k.erosion)))}
      {L('sare-lakunarra', 800, 160, k.lacuna(212), k.network)}
      {L('zirkulazio-uteroplazentarioa', 790, 250, k.lacuna(236), k.circ)}
      {L('sinzitiotrofoblastoa', 800, 400, k.syn(240))}
      {L('bi-orriko-diskoa', 800, 460, [cx + 12, k.g.discY], seg(t, 0.9, 0.93))}
      <Note x={500} y={588} tone="warn" show={seg(k.erosion, 0.5, 1)}>
        Sinzitiotrofoblastoak sinusoideen pareta urratu du: amaren odola laku sarean zirkulatzen hasten da
      </Note>
    </g>
  );
}
