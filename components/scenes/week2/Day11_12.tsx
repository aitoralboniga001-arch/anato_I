'use client';

import { C, Arrow, Cell, Flow, Label, Note, Part, lerp, mix, seg, smoothPath, zoom, type Pt, type SceneProps } from '@/components/kit';
import { CYTO, HYPO_BOTTOM, INNER, R, TrapBand, VESSELS, W2, discGeometry, f1, lensPath } from './common';

/**
 * 11-12. eguna — sare lakunarra, hasierako zirkulazio uteroplazentarioa, enbrioi kanpoko
 * mesodermoa eta korion barrunbea.
 * Windows (shared by every view and the stage beats in content/weeks/week2.ts):
 *   .00-.06 fibrina koagulu txikia oraindik han · .04-.20 lakuak elkarren artean komunikatzen: sare lakunarra
 *   .16-.28 sinzitiotrofoblastoak sinusoideen pareta urratzen du · .26-.40 amaren odola lakuetan zirkulatzen hasten da
 *   .42-.68 konzeptua hazi eta enbrioi kanpoko mesodermoa agertzen da (zito eta amnios/bitelo zakuaren artean)
 *   .54-.70 mesodermoan barrunbeak ireki eta fusionatzen dira -> korion barrunbea; finkapen pedikulua geratzen da
 *   .62-1.0 desidua erreakzioa: estroma edematoso, zelula poliedrikoak glukogenoz beteta
 */
export const W = {
  fibrin: [0, 0.06],
  network: [0.04, 0.2],
  erosion: [0.16, 0.28],
  circulation: [0.26, 0.4],
  mesoGrow: [0.42, 0.68],
  cavitate: [0.54, 0.7],
  decidua: [0.62, 1.0],
} as const;

const s = (t: number, w: readonly [number, number]) => seg(t, w[0], w[1]);
const rad = (deg: number) => (deg * Math.PI) / 180;
const norm = (a: number) => (a < 90 ? a + 360 : a);

/** The abembryonic pole stays just under the surface (small residual gap); the centre deepens as the conceptus grows. */
const GAP0 = 16;
const RC_MAX = 150;
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

function geometry(t: number) {
  const grow = seg(t, W.mesoGrow[0], W.cavitate[1]);
  const Rc = lerp(R, RC_MAX, grow);
  const cy = W2.surfaceY - 10 - Rc;
  const core = discGeometry(W2.cx, cy);
  const cav = s(t, W.cavitate);
  const thickness = Math.max(0, Rc - CYTO - INNER);
  return { ...core, Rc, cav, thickness, fib: lerp(1, 0.3, s(t, W.fibrin)) };
}
type Geo = ReturnType<typeof geometry>;

const polar = (g: Geo, a: number, r: number): Pt => [g.cx + r * Math.cos(rad(a)), g.cy + r * Math.sin(rad(a))];
const synAt = (g: Geo, a: number, frac: number): Pt => polar(g, a, g.Rc + frac * synTh(norm(a)));

function syncytioPath(g: Geo) {
  const pts: Pt[] = [];
  for (let i = 0; i < 120; i++) {
    const a = 90 + i * 3;
    pts.push(polar(g, a, g.Rc + synTh(a)));
  }
  return `${smoothPath(pts, true)}${`M${f1(g.cx + g.Rc)},${f1(g.cy)} A${g.Rc} ${g.Rc} 0 1 0 ${f1(g.cx - g.Rc)},${f1(g.cy)} A${g.Rc} ${g.Rc} 0 1 0 ${f1(g.cx + g.Rc)},${f1(g.cy)}Z`}`;
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
const NEAR_VESSEL = VESSELS.map(([x, y]) => Math.hypot(x - W2.cx, y - CY0) < 235);

function Day1112Drawing({ t, reduced }: SceneProps) {
  const g = geometry(t);
  const { cx, cy, epiTop, discY, hypoBottom, wEpiTop, wDisc, wHypo, Rc, cav, thickness } = g;
  const network = s(t, W.network);
  const erosion = s(t, W.erosion);
  const circ = s(t, W.circulation);
  const decidua = s(t, W.decidua);
  const cells = seg(t, W.decidua[0] + 0.18, 1);
  const lens = lensPath(g);

  // Mesoderm ring geometry: solid until cavitation starts, then hollows into two thin layers + a fixed bridge.
  const bandTh = Math.max(2.2, Math.min(thickness, lerp(thickness, 5, cav)));
  const innerOuter = INNER + bandTh; // outer edge of the inner (splanchno/somato) band
  const outerInner = Math.max(innerOuter, Rc - CYTO - bandTh); // inner edge of the outer (somatopleura) band
  const stalkA0 = 251;
  const stalkA1 = 269;
  const ring = (r0: number, r1: number, a0: number, a1: number) => {
    const p0 = polar(g, a0, r1);
    const p1 = polar(g, a1, r1);
    const p2 = polar(g, a1, r0);
    const p3 = polar(g, a0, r0);
    const large = a1 - a0 > 180 ? 1 : 0;
    return `M${f1(p0[0])},${f1(p0[1])} A${r1} ${r1} 0 ${large} 1 ${f1(p1[0])},${f1(p1[1])} L${f1(p2[0])},${f1(p2[1])} A${r0} ${r0} 0 ${large} 0 ${f1(p3[0])},${f1(p3[1])}Z`;
  };
  const fullRing = (r0: number, r1: number) => `${ring(r0, r1, 0, 359.999)}`;
  const genericShow = thickness > 3 ? 1 - seg(cav, 0.15, 0.55) : 0;
  const layerShow = seg(cav, 0.15, 0.55);
  const cavityShow = seg(cav, 0.15, 0.6);

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
              <path d={yolk} fill={C.yolkCavity} />
              <path d={yolk} fill="rgba(242,193,78,0.12)" />
              <path d={yolk} fill="url(#g-cavity)" />
            </>
          );
        })()}
      </Part>

      {/* Mesoderm ring: solid tissue first, then hollows into somatopleura / esplaknopleura / korion barrunbea. */}
      {thickness > 3 && (
        <>
          <Part id="enbrioi-kanpoko-mesodermoa" show={genericShow}>
            <path d={fullRing(INNER, Rc - CYTO)} fill="url(#p-meso-extra)" stroke="#c97a52" strokeWidth={1} />
          </Part>
          <Part id="korion-barrunbea" show={cavityShow}>
            <path d={fullRing(innerOuter, outerInner)} fill={C.chorionCavity} stroke="rgba(255,255,255,0.18)" strokeWidth={0.8} />
          </Part>
          <Part id="somatopleura-kanpokoa" show={layerShow}>
            <path d={fullRing(outerInner, Rc - CYTO)} fill="url(#p-meso-extra)" stroke="#c97a52" strokeWidth={1} />
            <path d={ring(INNER, innerOuter, AMNION_L, AMNION_R)} fill="url(#p-meso-extra)" stroke="#c97a52" strokeWidth={1} />
          </Part>
          <Part id="esplaknopleura-kanpokoa" show={layerShow}>
            <path d={ring(INNER, innerOuter, AMNION_R, AMNION_L + 360)} fill="url(#p-meso-extra)" stroke="#c97a52" strokeWidth={1} />
          </Part>
          <Part id="finkapen-pedikulua" show={1}>
            <path d={ring(INNER, Rc - CYTO, stalkA0, stalkA1)} fill="url(#p-meso-extra)" stroke="#c97a52" strokeWidth={1.2} />
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
          const [vx, vy] = VESSELS[vi];
          const a = LACUNAE_A[vi % LACUNAE_A.length];
          const p = synAt(g, a, 0.5);
          return [<Flow key={vi} d={`M${f1(vx)},${f1(vy)} L${f1(p[0])},${f1(p[1])}`} n={2} dur={2.6} r={1.8} reduced={reduced} />];
        })}

      <Part id="amaren-odol-hodiak" quiet>
        {VESSELS.map(([x, y, sc], i) =>
          NEAR_VESSEL[i] ? null : <ellipse key={i} cx={x} cy={y} rx={13 * sc} ry={8 * sc} fill="url(#p-blood)" stroke="#8d1024" strokeWidth={1.4} />,
        )}
      </Part>
      <Part id="sinusoideak">
        {VESSELS.map(([x, y, sc], i) => {
          if (!NEAR_VESSEL[i]) return null;
          const dil = lerp(1, 2, erosion);
          return <ellipse key={i} cx={x} cy={y} rx={13 * sc * dil} ry={8 * sc * dil} fill="url(#p-blood)" stroke={mix('#8d1024', '#f3b3c0', erosion)} strokeWidth={1.6} />;
        })}
      </Part>

      <Part id="zitotrofoblastoa">
        <path
          d={`M${f1(cx + Rc)},${f1(cy)} A${Rc} ${Rc} 0 1 1 ${f1(cx - Rc)},${f1(cy)} A${Rc} ${Rc} 0 1 1 ${f1(cx + Rc)},${f1(cy)} M${f1(cx + Rc - CYTO)},${f1(cy)} A${Rc - CYTO} ${Rc - CYTO} 0 1 0 ${f1(cx - (Rc - CYTO))},${f1(cy)} A${Rc - CYTO} ${Rc - CYTO} 0 1 0 ${f1(cx + Rc - CYTO)},${f1(cy)}`}
          fill={C.cyto}
          fillRule="evenodd"
          stroke="#4a9d63"
          strokeWidth={1}
        />
      </Part>

      <Part id="amnios-barrunbea">
        <path d={lens} fill="#6d9be6" opacity={0.42} />
        <path d={lens} fill="url(#g-cavity)" />
      </Part>
      <Part id="epiblastoa">
        <TrapBand cx={cx} yTop={epiTop} yBottom={discY} wTop={wEpiTop} wBottom={wDisc} n={15} color={C.epiblast} shape="columnar" />
      </Part>
      <Part id="hipoblastoa">
        <TrapBand cx={cx} yTop={discY} yBottom={hypoBottom} wTop={wDisc} wBottom={wHypo} n={17} color={C.hypoblast} shape="cuboidal" />
      </Part>

      {/* Small residual epithelial defect / fibrin (almost healed). */}
      {g.fib > 0.02 && (
        <Part id="fibrina-koagulua" show={g.fib}>
          <ellipse cx={cx} cy={W2.surfaceY - 4} rx={GAP0 * g.fib} ry={6 * g.fib} fill="url(#p-fibrin)" stroke="#b9ae95" strokeWidth={1} />
        </Part>
      )}

      {/* Decidual cells: polyhedral, glycogen/lipid-rich, oedematous stroma. */}
      <Part id="desidua-zelulak" show={cells}>
        {[
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
        ].map(([x, y], i) => (
          <Cell key={i} x={x} y={y} r={9} rx={9} ry={7.4} color="#f4d99a" nucleus="rgba(90,60,10,0.55)" nucleusScale={0.4} opacity={0.92} />
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
    cells: seg(t, W.decidua[0] + 0.18, 1),
    generic: g.thickness > 3 ? 1 - seg(g.cav, 0.15, 0.55) : 0,
    layer: seg(g.cav, 0.15, 0.55),
    cavity: seg(g.cav, 0.15, 0.6),
    syn: (a: number) => synAt(g, a, 0.5),
    lacuna: (a: number) => synAt(g, a, 0.5),
    cyto: (a: number) => polar(g, a, g.Rc - CYTO / 2),
    meso: (a: number, r: number) => polar(g, a, r),
    amnios: [cx - 22, (cy - INNER + epiTop) / 2 + 2] as Pt,
    epi: [cx + 38, (epiTop + discY) / 2] as Pt,
    yolk: [cx - 14, cy + 60] as Pt,
    stalk: polar(g, 260, (INNER + g.Rc - CYTO) / 2),
  };
}

export function Day1112Section(props: SceneProps) {
  const { t } = props;
  const k = anchors(t);
  const L = makeL((x, y) => [x, y]);
  return (
    <g>
      <EndometriumBack decidua={k.decidua} />
      <Day1112Drawing {...props} />
      <EndometriumFront gap={GAP0 * k.g.fib} />
      {L('endometrio-estroma', 190, 50, [300, 60])}
      {L('amaren-odol-hodiak', 190, 100, [VESSELS[3][0], VESSELS[3][1]])}
      {L('umetoki-guruina', 190, 150, [266, 250])}
      {L('desidua-erreakzioa', 190, 200, [340, 130], k.decidua)}
      {L('sare-lakunarra', 190, 250, k.lacuna(200), k.network)}
      {L('lakuak', 190, 380, k.lacuna(224))}
      {L('zirkulazio-uteroplazentarioa', 208, 430, k.lacuna(259), k.circ)}
      {L('sinzitiotrofoblastoa', 190, 470, k.syn(150))}
      {L('zitotrofoblastoa', 190, 515, k.cyto(140))}
      {L('endometrio-epitelioa', 190, 560, [300, W2.surfaceY - 8])}
      {L('mutur-enbrionarioa', 810, 250, k.cyto(276))}
      {L('enbrioi-kanpoko-mesodermoa', 810, 380, k.meso(300, (INNER + k.g.Rc - CYTO) / 2), k.generic)}
      {L('korion-barrunbea', 810, 430, k.meso(220, (INNER + k.g.Rc - CYTO) / 2), k.cavity)}
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
export function EndometriumBack({ decidua }: { decidua: number }) {
  const GLANDS: Pt[][] = [
    [[262, 500], [272, 452], [252, 400], [270, 350], [256, 300], [266, 250]],
    [[742, 500], [734, 446], [754, 392], [738, 340], [750, 288]],
  ];
  return (
    <g mask="url(#m-slab)">
      <Part id="endometrio-estroma" quiet>
        <rect x={0} y={0} width={1000} height={W2.surfaceY} fill="url(#p-stroma)" />
        <rect x={0} y={0} width={1000} height={W2.surfaceY} fill="url(#p-decidua)" opacity={decidua} />
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

export function EndometriumFront({ gap }: { gap: number }) {
  const { surfaceY, epiThickness, cx } = W2;
  return (
    <g mask="url(#m-slab)">
      <Part id="endometrio-epitelioa">
        {gap > 3 ? (
          <>
            <path d={`M0,${surfaceY} L${cx - gap},${surfaceY}`} stroke={C.epithelium} strokeWidth={epiThickness} strokeLinecap="round" />
            <path d={`M${cx + gap},${surfaceY} L1000,${surfaceY}`} stroke={C.epithelium} strokeWidth={epiThickness} strokeLinecap="round" />
          </>
        ) : (
          <path d={`M0,${surfaceY} L1000,${surfaceY}`} stroke={C.epithelium} strokeWidth={epiThickness} strokeLinecap="round" />
        )}
      </Part>
      <Part id="umetoki-barrunbea" quiet>
        <rect x={0} y={surfaceY + 1} width={1000} height={640 - surfaceY} fill="#1a1426" />
        <rect x={0} y={surfaceY + 1} width={1000} height={640 - surfaceY} fill="url(#g-shade)" opacity={0.4} />
      </Part>
    </g>
  );
}

export function Day1112Meso(props: SceneProps) {
  const { t } = props;
  const k = anchors(t);
  const { cx, cy } = k.g;
  const z = zoom(cx, cy - 10, 1.85, 500, 320);
  const L = makeL(z.at);
  const arrowShow = k.layer;
  return (
    <g>
      <rect x={0} y={0} width={1000} height={640} fill="#101828" />
      <g transform={z.transform}>
        <EndometriumBack decidua={0} />
        <Day1112Drawing {...props} />
      </g>
      <Arrow from={z.at(...k.meso(230, k.g.Rc - CYTO + 6))} to={z.at(...k.meso(230, INNER - 6))} bend={0} color={C.mesoExtra} show={arrowShow * 0.9} progress={1} />
      {L('zitotrofoblastoa', 180, 90, k.cyto(200))}
      {L('enbrioi-kanpoko-mesodermoa', 192, 150, k.meso(300, (INNER + k.g.Rc - CYTO) / 2), k.generic)}
      {L('somatopleura-kanpokoa', 180, 210, k.meso(300, k.g.Rc - CYTO - 4), k.layer)}
      {L('korion-barrunbea', 180, 400, k.meso(215, (INNER + k.g.Rc - CYTO) / 2), k.cavity)}
      {L('esplaknopleura-kanpokoa', 180, 460, k.meso(160, INNER + 4), k.layer)}
      {L('hasierako-bitelo-zakua', 180, 520, k.yolk)}
      {L('finkapen-pedikulua', 800, 150, k.stalk, k.layer)}
      {L('amnios-barrunbea', 800, 210, k.amnios)}
      {L('epiblastoa', 800, 260, k.epi)}
      {L('sinzitiotrofoblastoa', 800, 460, k.syn(200))}
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
  const z = zoom(cx - 190, cy - 190, 2.1, 500, 320);
  const L = makeL(z.at);
  return (
    <g>
      <rect x={0} y={0} width={1000} height={640} fill="#101828" />
      <g transform={z.transform}>
        <EndometriumBack decidua={k.decidua} />
        <Day1112Drawing {...props} />
      </g>
      {L('endometrio-estroma', 180, 60, [280, 120])}
      {L('desidua-erreakzioa', 180, 110, [340, 150], k.decidua)}
      {L('desidua-zelulak', 180, 160, [340, 140], k.cells)}
      {L('umetoki-guruina', 180, 210, [266, 250])}
      {L('amaren-odol-hodiak', 800, 60, [VESSELS[3][0], VESSELS[3][1]])}
      {L('sinusoideak', 800, 110, [VESSELS[4][0], VESSELS[4][1]])}
      {L('sare-lakunarra', 800, 160, k.lacuna(212), k.network)}
      {L('zirkulazio-uteroplazentarioa', 790, 250, k.lacuna(236), k.circ)}
      {L('sinzitiotrofoblastoa', 800, 400, k.syn(240))}
      <Note x={500} y={588} tone="warn" show={seg(k.erosion, 0.5, 1)}>
        Sinzitiotrofoblastoak sinusoideen pareta urratu du: amaren odola laku sarean zirkulatzen hasten da
      </Note>
    </g>
  );
}
