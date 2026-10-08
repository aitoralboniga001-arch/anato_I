'use client';

import { Arrow, Label, Note, Part, lerp, seg, smoothPath, type Pt, type SceneProps } from '@/components/kit';
import { somiteClose } from '@/components/scenes/week4-meso/Stage3Somite';
import { Defs8, MesCell, Q, f1, mirror, poly, spline, vis } from './common';

/**
 * 8:jatorriak — apunteen 1. atala. Ezkerrean, 4. asteko enbrioia goitik: hezurren hiru jatorriak
 * (mesodermo paraxiala: buruan somitomeroak eta okzipitaletik behera somitak; alboko mesodermoaren
 * paretako orria; gandor neurala). Eskuinean, jaioberriaren hezurdura aurretik, hezur bakoitza bere
 * jatorriaren kolorez betetzen da urrats bakoitzean: paraxialetik ornoak, saihetsak eta burezurraren
 * atzealdea; paretako orritik gorputz-adarrak, esternoia eta gerriko hezurrak; gandor neuraletik
 * aurpegia eta buru-gangaren aurrealdea.
 */

// Stage beats (week8.ts): 0 sources, .12 paraxial segments, .26–.78 section view, .78 parietal layer, .9 neural crest.
export const ORIGIN_T = { paraxial: 0.12, lateral: 0.78, crest: 0.9 };

// ——— Left panel: the 4-week embryo seen from the back ———
const EX = 330;
const EMBRYO = spline(
  [[330, 58], [372, 66], [398, 100], [400, 160], [388, 214], [392, 252], [404, 300], [406, 380], [398, 460], [380, 520], [356, 566], [330, 592], [304, 566], [280, 520], [262, 460], [254, 380], [256, 300], [268, 252], [272, 214], [260, 160], [262, 100], [288, 66]],
  8,
  true,
);
/** Neural tube: brain vesicles at the head, a narrow tube down the trunk (right half, mirrored). */
const TUBE_R: Pt[] = [[330, 74], [352, 80], [364, 100], [362, 124], [352, 136], [358, 152], [356, 170], [346, 182], [352, 200], [348, 222], [340, 240], [338, 300], [338, 420], [337, 520], [334, 572], [330, 580]];
const TUBE = [...spline(TUBE_R, 6), ...spline(TUBE_R, 6).map((p) => mirror(p, EX)).reverse()];
const SOMITE_Y0 = 246;
const SOMITE_N = 22;
const SOMITE_P = 13.4;
const somiteBox = (i: number) => {
  const y = SOMITE_Y0 + i * SOMITE_P;
  const w = lerp(22, 12, Math.max(0, (i - 12) / 10));
  return { x0: EX + 10, x1: EX + 10 + w, y, h: SOMITE_P - 2.6 };
};
const SOMITOMERES: Pt[] = [[368, 138], [372, 156], [372, 174], [370, 192], [366, 210], [360, 226], [362, 240]];
/** Paraxial band: along the brain (head mesenchyme) and the trunk (somites). */
const PARAX_R: Pt[] = [[360, 128], [378, 150], [380, 196], [366, 236], [366, 300], [362, 420], [354, 520], [344, 560]];
const PARAX_IN: Pt[] = [[344, 520], [341, 420], [341, 300], [342, 240], [352, 196], [358, 150], [350, 128]];
const PARAX = spline([...PARAX_R, ...PARAX_IN], 6, true);
const LATERAL_R = spline([[378, 250], [392, 300], [396, 380], [390, 460], [374, 528], [362, 552], [356, 540], [366, 470], [372, 380], [370, 300], [366, 258]], 6, true);
const INTER_R = spline([[367, 250], [370, 300], [371, 380], [366, 470], [356, 536], [352, 534], [361, 470], [366, 380], [365, 300], [363, 252]], 6, true);
const LIMB_BUDS: Pt[] = [[402, 312], [396, 488]];
const CREST_R: Pt[] = [[346, 140], [350, 170], [346, 200], [341, 236], [340, 300], [340, 420], [339, 520], [336, 562]];
/** Cranial neural crest streams heading into the face and the first arches. */
const STREAMS: Pt[][] = [
  [[352, 134], [372, 128], [388, 142]],
  [[354, 176], [378, 184], [392, 200]],
  [[350, 204], [372, 214], [386, 230]],
];

// ——— Right panel: the newborn skeleton from the front ———
const SX = 670;
const k = 0.89;
const S = (p: Pt): Pt => [SX + (p[0] - SX) * k, 62 + (p[1] - 58) * k];
const SKULL = spline([[670, 58], [712, 66], [734, 100], [738, 140], [728, 172], [716, 186], [670, 190], [624, 186], [612, 172], [602, 140], [606, 100], [628, 66]], 8, true).map(S);
const FRONTAL = spline([[670, 80], [696, 84], [714, 102], [720, 128], [712, 152], [692, 160], [670, 156], [648, 160], [628, 152], [620, 128], [626, 102], [644, 84]], 8, true).map(S);
const FACE = spline([[640, 160], [670, 158], [700, 160], [708, 186], [700, 206], [690, 226], [670, 236], [650, 226], [640, 206], [632, 186]], 8, true).map(S);
const ORBITS: Pt[] = [S([648, 166]), S([692, 166])];
const NOSE = spline([[670, 176], [678, 194], [670, 200], [662, 194]], 6, true).map(S);
const JAW = spline([[640, 206], [652, 224], [670, 236], [688, 224], [700, 206], [704, 214], [692, 236], [670, 248], [648, 236], [636, 214]], 6, true).map(S);
const NECK_Y = [252, 260, 268, 276, 284].map((y) => S([670, y])[1]);
const RIB_Y = Array.from({ length: 10 }, (_, i) => 300 + i * 13);
function ribPath(i: number, side: 1 | -1) {
  const y = RIB_Y[i];
  const w = lerp(64, 78, Math.sin((i / 9) * Math.PI * 0.9));
  const pts = spline([[SX + side * 8, y - 4], [SX + side * w * 0.7, y - 6], [SX + side * w, y + 8], [SX + side * w * 0.78, y + 26], [SX + side * 20, y + 30 + i * 1.2]], 8).map(S);
  return pts;
}
const STERNUM = spline([[662, 300], [678, 300], [680, 318], [676, 330], [676, 400], [672, 414], [668, 414], [664, 400], [664, 330], [660, 318]], 6, true).map(S);
const LUMBAR_Y = [442, 456, 470, 484, 498];
const PELVIS_R = spline([[682, 508], [700, 488], [726, 480], [742, 492], [738, 516], [722, 534], [706, 544], [690, 540], [684, 526]], 8, true).map(S);
const SACRUM = spline([[656, 506], [684, 506], [678, 540], [670, 548], [662, 540]], 6, true).map(S);
const bone = (a: Pt, b: Pt, w: number): Pt[] => {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const l = Math.hypot(dx, dy) || 1;
  const nx = (-dy / l) * w;
  const ny = (dx / l) * w;
  return spline([[a[0] + nx * 1.3, a[1] + ny * 1.3], [lerp(a[0], b[0], 0.5) + nx * 0.8, lerp(a[1], b[1], 0.5) + ny * 0.8], [b[0] + nx * 1.3, b[1] + ny * 1.3], [b[0] + dx / l * w, b[1] + dy / l * w], [b[0] - nx * 1.3, b[1] - ny * 1.3], [lerp(a[0], b[0], 0.5) - nx * 0.8, lerp(a[1], b[1], 0.5) - ny * 0.8], [a[0] - nx * 1.3, a[1] - ny * 1.3], [a[0] - dx / l * w, a[1] - dy / l * w]], 5, true);
};
function limbBones(side: 1 | -1): Pt[][] {
  const m = (p: Pt): Pt => S(side > 0 ? p : mirror(p, SX));
  return [
    bone(m([742, 300]), m([760, 392]), 6),
    bone(m([761, 400]), m([772, 470]), 3.6),
    bone(m([754, 402]), m([762, 472]), 3.4),
    ...[0, 1, 2, 3, 4].map((j) => bone(m([758 + j * 4, 482]), m([756 + j * 6.5, 506 + (j === 0 ? -6 : 0)]), 1.8)),
    bone(m([708, 548]), m([714, 600]), 6.4),
    bone(m([714, 608]), m([716, 640]), 4.4),
    bone(m([725, 610]), m([727, 640]), 2.4),
    bone(m([710, 648]), m([734, 652]), 3.2),
  ].map((pts) => pts.map((p) => p));
}

const MES_FLOWS: { a: Pt; b: Pt; bend: number; color: string; from: number; to: number }[] = [
  { a: [404, 400], b: [600, 380], bend: -0.12, color: Q.paraxial, from: ORIGIN_T.paraxial + 0.03, to: 0.26 },
  { a: [410, 470], b: [640, 470], bend: 0.1, color: Q.lateral, from: ORIGIN_T.lateral + 0.02, to: ORIGIN_T.crest },
  { a: [396, 196], b: [612, 196], bend: -0.12, color: Q.crest, from: ORIGIN_T.crest + 0.02, to: 1.01 },
];
/** A point along the kit Arrow's curve (same bend rule). */
function quad(a: Pt, b: Pt, bend: number, u: number): Pt {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const c: Pt = [a[0] + dx / 2 - dy * bend, a[1] + dy / 2 + dx * bend];
  return [(1 - u) * (1 - u) * a[0] + 2 * (1 - u) * u * c[0] + u * u * b[0], (1 - u) * (1 - u) * a[1] + 2 * (1 - u) * u * c[1] + u * u * b[1]];
}

export function OriginsMap({ t, reduced }: SceneProps) {
  const par = seg(t, ORIGIN_T.paraxial + 0.02, ORIGIN_T.paraxial + 0.09);
  const segs = seg(t, ORIGIN_T.paraxial, ORIGIN_T.paraxial + 0.05);
  const lat = seg(t, ORIGIN_T.lateral + 0.01, ORIGIN_T.lateral + 0.07);
  const cr = seg(t, ORIGIN_T.crest + 0.01, ORIGIN_T.crest + 0.06);
  const fill = (base: string, k1: number) => (k1 > 0.01 ? base : Q.grey);
  const boneFill = (c: string, k1: number) => ({ fill: fill(c, k1), opacity: k1 > 0.01 ? 0.35 + 0.65 * k1 : 1 });

  const both = (pts: Pt[]) => [pts, pts.map((p) => mirror(p, EX))];
  const flow = MES_FLOWS.find((r) => t >= r.from && t < r.to);
  const flowMid = flow ? quad(flow.a, flow.b, flow.bend, 0.5) : ([0, 0] as Pt);
  return (
    <g>
      <Defs8 />
      <rect x={0} y={0} width={1000} height={640} fill="#0f0f11" />
      <rect x={470} y={56} width={1.2} height={520} fill="#ffffff" opacity={0.08} />

      {/* ——— 4-week embryo, dorsal view ——— */}
      <Part id="azaleko-ektodermoa" quiet>
        <path d={smoothPath(EMBRYO, true, 0.3)} fill={Q.body} stroke={Q.bodyEdge} strokeWidth={1.4} />
        {LIMB_BUDS.map((p, i) => (
          <g key={i}>
            <ellipse cx={p[0]} cy={p[1]} rx={10} ry={16} fill={Q.body} stroke={Q.bodyEdge} strokeWidth={1.2} />
            <ellipse cx={2 * EX - p[0]} cy={p[1]} rx={10} ry={16} fill={Q.body} stroke={Q.bodyEdge} strokeWidth={1.2} />
          </g>
        ))}
      </Part>
      <Part id="paretako-orria">
        {both(LATERAL_R).map((pts, i) => (
          <path key={i} d={smoothPath(pts, true, 0.3)} fill={Q.lateral} opacity={0.85} />
        ))}
        {LIMB_BUDS.map((p, i) => (
          <g key={i} fill={Q.lateral} opacity={0.7}>
            <ellipse cx={p[0] - 2} cy={p[1]} rx={6} ry={11} />
            <ellipse cx={2 * EX - p[0] + 2} cy={p[1]} rx={6} ry={11} />
          </g>
        ))}
      </Part>
      <Part id="bitarteko-mesodermoa" quiet>
        {both(INTER_R).map((pts, i) => (
          <path key={i} d={smoothPath(pts, true, 0.3)} fill="#c0504a" opacity={0.55} />
        ))}
      </Part>
      <Part id="mesodermo-paraxiala">
        {both(PARAX).map((pts, i) => (
          <path key={i} d={smoothPath(pts, true, 0.3)} fill={Q.paraxial} opacity={lerp(0.85, 0.3, segs)} />
        ))}
      </Part>
      <Part id="somitomeroak" show={segs}>
        {SOMITOMERES.map((p, i) => (
          <g key={i}>
            {[p, mirror(p, EX)].map((q, j) => (
              <ellipse key={j} cx={q[0]} cy={q[1]} rx={8} ry={7.4} fill={Q.paraxial} opacity={0.55} stroke={Q.paraxialDeep} strokeWidth={0.8} strokeDasharray="2 2" />
            ))}
          </g>
        ))}
      </Part>
      <Part id="somitak" show={segs}>
        {Array.from({ length: SOMITE_N }, (_, i) => {
          const b = somiteBox(i);
          return (
            <g key={i}>
              <rect x={b.x0} y={b.y} width={b.x1 - b.x0} height={b.h} rx={3} fill={Q.paraxial} stroke={Q.paraxialDeep} strokeWidth={0.8} />
              <rect x={2 * EX - b.x1} y={b.y} width={b.x1 - b.x0} height={b.h} rx={3} fill={Q.paraxial} stroke={Q.paraxialDeep} strokeWidth={0.8} />
            </g>
          );
        })}
      </Part>
      <Part id="hodi-neurala">
        <path d={smoothPath(TUBE, true, 0.3)} fill={Q.neural} stroke="#1e3a9a" strokeWidth={1} />
        <path d={`M${EX},90L${EX},570`} stroke="#0c1640" strokeWidth={2} opacity={0.7} />
      </Part>
      <Part id="gandor-neurala">
        {[spline(CREST_R, 6), spline(CREST_R, 6).map((p) => mirror(p, EX))].map((pts, i) => (
          <path key={i} d={`M${pts.map((p) => `${f1(p[0])},${f1(p[1])}`).join('L')}`} fill="none" stroke={Q.crest} strokeWidth={4} strokeLinecap="round" />
        ))}
        {STREAMS.map((s, i) =>
          [s, s.map((p) => mirror(p, EX))].map((pts, j) => (
            <g key={`${i}${j}`}>
              {[0.25, 0.55, 0.85].map((u, m) => {
                const uu = reduced ? u : (u + (cr > 0 ? t * 6 : 0)) % 1;
                const a = pts[Math.min(1, Math.floor(uu * 2))];
                const b = pts[Math.min(2, Math.floor(uu * 2) + 1)];
                const f = (uu * 2) % 1;
                return <circle key={m} cx={lerp(a[0], b[0], f)} cy={lerp(a[1], b[1], f)} r={3} fill={Q.crest} opacity={0.35 + 0.65 * cr} />;
              })}
            </g>
          )),
        )}
      </Part>

      {/* ——— Newborn skeleton, from the front ——— */}
      <Part id="hezur-parietala">
        <path d={smoothPath(SKULL, true, 0.3)} {...boneFill(Q.paraxial, par)} stroke={Q.greyEdge} strokeWidth={1.2} />
      </Part>
      <Part id="buru-aurpegi-hezurrak">
        <path d={smoothPath(FRONTAL, true, 0.3)} {...boneFill(Q.crest, cr)} stroke={Q.greyEdge} strokeWidth={1.2} />
        <path d={smoothPath(FACE, true, 0.3)} {...boneFill(Q.crest, cr)} stroke={Q.greyEdge} strokeWidth={1.2} />
        <path d={smoothPath(JAW, true, 0.3)} {...boneFill(Q.crest, cr)} stroke={Q.greyEdge} strokeWidth={1.2} />
      </Part>
      {ORBITS.map((p, i) => (
        <ellipse key={i} cx={p[0]} cy={p[1]} rx={15} ry={12} fill="#0f0f11" stroke={Q.greyEdge} strokeWidth={1} />
      ))}
      <path d={smoothPath(NOSE, true, 0.3)} fill="#0f0f11" />

      <Part id="ornoak">
        {NECK_Y.map((y, i) => (
          <rect key={`c${i}`} x={SX - 10} y={y - 3.4} width={20} height={6.8} rx={2.5} {...boneFill(Q.paraxial, par)} stroke={Q.greyEdge} strokeWidth={0.8} />
        ))}
        {RIB_Y.map((y, i) => (
          <rect key={`t${i}`} x={SX - 9} y={S([SX, y])[1] - 4} width={18} height={8.5} rx={2.5} {...boneFill(Q.paraxial, par)} stroke={Q.greyEdge} strokeWidth={0.6} />
        ))}
        {LUMBAR_Y.map((y, i) => (
          <rect key={`l${i}`} x={SX - 13} y={S([SX, y])[1] - 5.6} width={26} height={11.2} rx={3} {...boneFill(Q.paraxial, par)} stroke={Q.greyEdge} strokeWidth={0.8} />
        ))}
        <path d={smoothPath(SACRUM, true, 0.3)} {...boneFill(Q.paraxial, par)} stroke={Q.greyEdge} strokeWidth={0.8} />
      </Part>
      <Part id="saihetsak">
        {RIB_Y.map((_, i) =>
          ([1, -1] as const).map((sd) => {
            const pts = ribPath(i, sd);
            const n = pts.length;
            const cut = Math.round(n * 0.72);
            const bony = pts.slice(0, cut + 1);
            const cartP = pts.slice(cut);
            const line = (p: Pt[]) => `M${p.map((q) => `${f1(q[0])},${f1(q[1])}`).join('L')}`;
            return (
              <g key={`${i}${sd}`} fill="none" strokeLinecap="round">
                <path d={line(bony)} stroke={Q.greyEdge} strokeWidth={5.4} />
                <path d={line(bony)} stroke={fill(Q.paraxial, par)} strokeWidth={3.8} opacity={par > 0.01 ? 0.35 + 0.65 * par : 1} />
                <path d={line(cartP)} stroke={Q.greyEdge} strokeWidth={4.4} />
                <path d={line(cartP)} stroke={fill(Q.lateral, lat)} strokeWidth={2.8} opacity={lat > 0.01 ? 0.35 + 0.65 * lat : 1} />
              </g>
            );
          }),
        )}
      </Part>
      <Part id="esternoia">
        <path d={smoothPath(STERNUM, true, 0.3)} {...boneFill(Q.lateral, lat)} stroke={Q.greyEdge} strokeWidth={1} />
      </Part>
      <Part id="gerriko-hezurrak">
        {[PELVIS_R, PELVIS_R.map((p) => mirror(p, SX))].map((pts, i) => (
          <path key={i} d={smoothPath(pts, true, 0.3)} {...boneFill(Q.lateral, lat)} stroke={Q.greyEdge} strokeWidth={1} />
        ))}
      </Part>
      <Part id="gorputz-adarretako-hezurrak">
        {([1, -1] as const).map((sd) =>
          limbBones(sd).map((pts, i) => <path key={`${sd}${i}`} d={smoothPath(pts, true, 0.3)} {...boneFill(Q.lateral, lat)} stroke={Q.greyEdge} strokeWidth={0.9} />),
        )}
      </Part>

      {/* Where each tissue goes (shown at its step): its mesenchyme streams along the arrow to the bones it builds. */}
      {MES_FLOWS.map((r, i) => {
        const show = vis(t, r.from, r.to);
        return (
          <g key={i}>
            <Part id="mesenkima" show={show}>
              <Arrow from={r.a} to={r.b} color={r.color} width={2.6} bend={r.bend} show={0.8} flow={!reduced} />
              {Array.from({ length: 6 }, (_, k) => {
                const u = (k / 6 + (reduced ? 0 : t * 9)) % 1;
                const p = quad(r.a, r.b, r.bend, 0.06 + u * 0.82);
                const fade = Math.min(1, u * 6, (1 - u) * 6);
                return <MesCell key={k} p={[p[0], p[1] + (k % 2 ? 9 : -9)]} r={2.2} a={k * 53 + t * 200} fill={r.color} opacity={fade} />;
              })}
            </Part>
          </g>
        );
      })}

      <Note x={EX} y={36} size={12}>
        Enbrioia goitik · 4. astea
      </Note>
      <Note x={SX} y={36} size={12}>
        Jaioberriaren hezurdura · aurretik
      </Note>
      <Note x={500} y={612} tone="accent" show={vis(t, 0, ORIGIN_T.paraxial)}>
        Hiru jatorri: mesodermo paraxiala · alboko mesodermoaren paretako orria · gandor neurala
      </Note>
      <Note x={500} y={612} tone="accent" show={vis(t, ORIGIN_T.paraxial, 0.26)}>
        Buruan somitomeroak (mesenkima), okzipitaletik behera somitak: ornoak, saihetsak, burezurraren atzealdea
      </Note>
      <Note x={500} y={612} tone="accent" show={vis(t, ORIGIN_T.lateral, ORIGIN_T.crest)}>
        Paretako orritik: gorputz-adarretako hezurrak, esternoia eta gerrialdeko hezurrak
      </Note>
      <Note x={500} y={612} tone="accent" show={vis(t, ORIGIN_T.crest)}>
        Gandor neuraletik (ektodermoa): aurpegia eta buru-gangaren aurrealdea
      </Note>

      <Label id="hodi-neurala" x={190} y={84} ax={EX + 14} ay={96} />
      <Label id="gandor-neurala" x={190} y={130} ax={2 * EX - 346} ay={150} />
      <Label id="somitomeroak" x={190} y={186} ax={2 * EX - 372} ay={182} show={segs} />
      <Label id="mesodermo-paraxiala" x={190} y={256} ax={2 * EX - 378} ay={196} />
      <Label id="somitak" x={190} y={300} ax={2 * EX - somiteBox(4).x1 + 4} ay={somiteBox(4).y + 5} show={segs} />
      <Label id="bitarteko-mesodermoa" x={190} y={360} ax={2 * EX - 368} ay={380} small />
      <Label id="paretako-orria" x={190} y={420} ax={2 * EX - 384} ay={420} />
      <Label id="azaleko-ektodermoa" x={190} y={540} ax={2 * EX - LIMB_BUDS[1][0] - 7} ay={LIMB_BUDS[1][1]} small />

      {/* The mesenchyme on its way: named on the arrow of the step's tissue. */}
      {flow && <Label id="mesenkima" x={535} y={flowMid[1] - 40} ax={flowMid[0]} ay={flowMid[1]} align="middle" show={vis(t, flow.from, flow.to)} small />}

      <Label id="hezur-parietala" x={810} y={70} ax={S([726, 110])[0]} ay={S([726, 110])[1]} />
      <Label id="buru-aurpegi-hezurrak" x={786} y={236} ax={S([702, 196])[0]} ay={S([702, 196])[1]} />
      <Label id="ornoak" x={810} y={290} ax={SX + 10} ay={NECK_Y[2]} />
      <Label id="esternoia" x={810} y={330} ax={S([678, 340])[0]} ay={S([678, 340])[1]} />
      <Label id="saihetsak" x={810} y={366} ax={S([744, 350])[0]} ay={S([744, 350])[1]} />
      <Label id="gorputz-adarretako-hezurrak" x={772} y={440} ax={S([768, 440])[0]} ay={S([768, 440])[1]} />
      <Label id="gerriko-hezurrak" x={810} y={496} ax={S([740, 504])[0]} ay={S([740, 504])[1]} />
    </g>
  );
}

// ——— Transverse section: the somite retold (topic 4 drawing), with this topic's names ———

/** Stage time → topic-4 somite time: sclerotome (.26–.4), migration (.4–.54), vertebra and ribs (.54–.66). */
function somiteT(t: number) {
  if (t < 0.28) return 0.06;
  if (t < 0.4) return lerp(0.06, 0.24, seg(t, 0.28, 0.38));
  if (t < 0.54) return lerp(0.24, 0.39, seg(t, 0.41, 0.52));
  if (t < 0.58) return lerp(0.39, 0.9, seg(t, 0.55, 0.58));
  return lerp(0.9, 0.96, seg(t, 0.58, 0.63));
}

export function OriginsSection({ t }: SceneProps) {
  const st = somiteT(t);
  const { drawing, anchors: a, tm } = somiteClose(st, { sclero: t < 0.4 ? 'esklerotoma' : 'mesenkima', plate: 'dermatomiotoma' });
  const mesNamed = seg(t, 0.41, 0.44);
  const cells = seg(t, 0.67, 0.72);
  const CELL_Y = 524;
  const cellX = [520, 640, 760];
  return (
    <g>
      {drawing}
      {/* The three cell types the mesenchyme can become (inset). */}
      {cells > 0.01 && (
        <g opacity={cells}>
          <rect x={452} y={470} width={376} height={124} rx={12} fill="#141018" stroke="#3a3044" strokeWidth={1.2} />
          <Part id="fibroblastoak">
            <path d={`M${cellX[0] - 26},${CELL_Y}Q${cellX[0] - 6},${CELL_Y - 10} ${cellX[0]},${CELL_Y}T${cellX[0] + 26},${CELL_Y + 2}Q${cellX[0]},${CELL_Y + 9} ${cellX[0] - 26},${CELL_Y}Z`} fill="#e8b98a" stroke="#7a4a1e" strokeWidth={1} />
            <ellipse cx={cellX[0]} cy={CELL_Y + 1} rx={7} ry={3.4} fill="#7a4a1e" />
            {[-1, 1].map((s) => (
              <path key={s} d={`M${cellX[0] + s * 34},${CELL_Y + 14}l${s * 14},-4M${cellX[0] + s * 34},${CELL_Y + 18}l${s * 14},2`} stroke="#e8b98a" strokeWidth={1} opacity={0.6} />
            ))}
          </Part>
          <Part id="kondroblastoak">
            <ellipse cx={cellX[1]} cy={CELL_Y} rx={24} ry={20} fill="#2a2440" />
            <circle cx={cellX[1]} cy={CELL_Y} r={15} fill={Q.cart} stroke={Q.cartDeep} strokeWidth={1.2} />
            <circle cx={cellX[1]} cy={CELL_Y} r={6} fill={Q.cartDeep} />
          </Part>
          <Part id="osteoblastoak">
            <path d={`M${cellX[2] - 30},${CELL_Y + 18}L${cellX[2] + 30},${CELL_Y + 18}`} stroke={Q.bone} strokeWidth={7} strokeLinecap="round" />
            {[-16, 0, 16].map((dx) => (
              <g key={dx}>
                <rect x={cellX[2] + dx - 7} y={CELL_Y - 4} width={14} height={18} rx={4} fill={Q.centre} stroke="#5a3010" strokeWidth={1} />
                <circle cx={cellX[2] + dx} cy={CELL_Y + 1} r={3.4} fill={Q.osteo} />
              </g>
            ))}
          </Part>
          <Note x={cellX[0]} y={CELL_Y - 34} size={12.5} tone="dim">
            ehun konektiboa
          </Note>
          <Note x={cellX[1]} y={CELL_Y - 34} size={12.5} tone="dim">
            kartilagoa
          </Note>
          <Note x={cellX[2]} y={CELL_Y - 34} size={12.5} tone="dim">
            hezurra
          </Note>
        </g>
      )}

      <Note x={500} y={612} tone="accent" show={vis(t, 0.26, 0.4)}>
        Aurreko eta erdiko paretak → esklerotoma · atzeko horma → dermomiotoma
      </Note>
      <Note x={500} y={612} tone="accent" show={vis(t, 0.4, 0.54)}>
        Esklerotoma zelulak mesenkima bihurtzen dira: zelula mugikorrak, erdialdera migratzen dute
      </Note>
      <Note x={500} y={612} tone="accent" show={vis(t, 0.54, 0.66)}>
        Hodi neurala eta notokorda inguratuz: ornoak · alboetara: saihetsak
      </Note>
      <Note x={500} y={612} tone="accent" show={vis(t, 0.66)}>
        Mesenkimatik: fibroblastoak, kondroblastoak eta osteoblastoak
      </Note>

      <Label id="hodi-neurala" x={190} y={170} ax={a['hodi-neurala'][0]} ay={a['hodi-neurala'][1]} />
      <Label id="esklerotoma" x={190} y={330} ax={a.esklerotoma[0]} ay={a.esklerotoma[1]} show={seg(t, 0.28, 0.32) * (1 - mesNamed)} />
      <Label id="mesenkima" x={190} y={330} ax={a.esklerotoma[0]} ay={a.esklerotoma[1]} show={mesNamed} />
      <Label id="notokorda" x={190} y={400} ax={a.notokorda[0]} ay={a.notokorda[1]} />
      <Label id="ornoak" x={190} y={450} ax={a.ornoak[0]} ay={a.ornoak[1]} show={tm.fa} />
      <Label id="aorta-dortsalak" x={190} y={500} ax={a['aorta-dortsalak'][0]} ay={a['aorta-dortsalak'][1]} small />
      <Label id="ektodermoa" x={810} y={96} ax={a.ektodermoa[0]} ay={a.ektodermoa[1]} small />
      <Label id="somitak" x={810} y={150} ax={a.somitak[0]} ay={a.somitak[1]} show={1 - seg(t, 0.28, 0.32)} />
      <Label id="dermatomiotoma" x={810} y={150} ax={a.dermatomiotoma[0]} ay={a.dermatomiotoma[1]} show={seg(t, 0.3, 0.34) * (1 - tm.dt)} />
      <Label id="dermatoma" x={810} y={150} ax={a.dermatoma[0]} ay={a.dermatoma[1]} show={tm.dt} small />
      <Label id="miotoma" x={810} y={200} ax={a.miotoma[0]} ay={a.miotoma[1]} show={tm.my} small />
      <Label id="paretako-orria" x={810} y={290} ax={a['paretako-orria'][0]} ay={a['paretako-orria'][1]} small />
      <Label id="bitarteko-mesodermoa" x={810} y={560} ax={a['bitarteko-mesodermoa'][0]} ay={a['bitarteko-mesodermoa'][1]} show={1 - cells} small />
      <Label id="saihetsak" x={810} y={400} ax={a.saihetsak[0]} ay={a.saihetsak[1]} show={tm.fa} />
      <Label id="fibroblastoak" x={cellX[0]} y={CELL_Y + 46} align="middle" show={cells} small />
      <Label id="kondroblastoak" x={cellX[1]} y={CELL_Y + 46} align="middle" show={cells} small />
      <Label id="osteoblastoak" x={cellX[2]} y={CELL_Y + 46} align="middle" show={cells} small />
    </g>
  );
}
