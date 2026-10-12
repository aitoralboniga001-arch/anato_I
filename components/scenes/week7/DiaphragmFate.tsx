'use client';

import { Label, Note, Part, lerp, seg, type Pt, type SceneProps } from '@/components/kit';
import { Defs7, P, Sheet, f1, mirror, offset, poly, sm, spline, vis } from './common';
import { BODY_X } from './Diaphragm';
import { FATE } from './timing';

/**
 * 7:diafragma-eraketa:patua — apunteen 3.1 atala ("Diafragmaren eraketan parte hartzen duten atalak" eta
 * zentro tendinosoaren, gerriko atalaren eta alde periferikoaren jatorria; 3.1/p7 irudia). Ikuspegi bera
 * hasieratik bukaerara: 5. asteko zeharkako mozketa diafragmaren mailan (dortsala goian, ikuslearen ezkerra
 * = gorputzaren eskuina), lau osagaiak bakoitza bere kolorez. Gero mozketa diafragma heldu bihurtzen da,
 * goitik ikusita eta orientazio berean, eta osagai bakoitzak bere tokia gordetzen du:
 *  - septum transversuma (laranja) → aurrean eta erdian: zentro tendinosoa;
 *  - hestegorri inguruko mesenkima (turkesa) → atzean, erdian: gerriko atala (zutabeak);
 *  - mintz pleuroperitonealak (morea) → atze-alboetan (septumeko miozitoak hartzen dituzte);
 *  - gorputz paretako mesodermoa (arrosa) → ertz osoa: alde periferikoa.
 * Hiru hodiek (aorta, hestegorria, beheko kaba) beren tokia gordetzen dute: horrela ikusten da zein zulotatik
 * pasatzen den bakoitza.
 */


/** A key point: where it is in the 5-week section (DiaphragmSection coordinates) and in the adult. */
type KP = readonly [Pt, Pt];
/** The section, a little smaller so the body wall fits with the names round it. */
const S = (p: Pt): Pt => [500 + (p[0] - 500) * 0.86, 320 + (p[1] - 320) * 0.86];
const at = (q: KP, k: number): Pt => {
  const e = S(q[0]);
  return [lerp(e[0], q[1][0], k), lerp(e[1], q[1][1], k)];
};
const curve = (keys: readonly KP[], k: number): Pt[] => spline(keys.map((q) => at(q, k)), 8);
const rev = (pts: readonly Pt[]) => [...pts].reverse();
const mir = (pts: readonly Pt[]) => pts.map((p) => mirror(p));

// ——— Boundaries of the left half (viewer's left = the body's right); the right half is mirrored. ———
/** Outer edge: the cavity wall in the section → the rim of the dome; from beside the mesentery to the front. */
const OUT: KP[] = [
  [[462, 224], [458, 170]],
  [[430, 214], [432, 138]],
  [[360, 202], [352, 126]],
  [[300, 228], [276, 160]],
  [[264, 292], [232, 236]],
  [[252, 372], [224, 330]],
  [[276, 462], [252, 418]],
  [[336, 532], [320, 482]],
  [[420, 566], [410, 514]],
  [[500, 574], [500, 520]],
];
/** Inner edge of the body-wall rim, behind (where the membrane meets it) and in front (the septum). */
const RIM_BACK: KP[] = [
  [[459, 252], [462, 200]],
  [[430, 242], [430, 170]],
  [[366, 230], [354, 158]],
  [[316, 254], [298, 186]],
  [[289, 302], [263, 240]],
  [[280, 380], [256, 272]],
];
const RIM_FRONT: KP[] = [
  [[280, 380], [256, 272]],
  [[302, 452], [264, 384]],
  [[352, 508], [330, 452]],
  [[426, 538], [414, 482]],
  [[500, 546], [500, 488]],
];
/** The septum's dorsal edge (the membrane in front of it), from the rim to the mesentery, then to the midline. */
const SEPT_EDGE: KP[] = [
  [[280, 380], [256, 272]],
  [[304, 358], [300, 256]],
  [[370, 336], [370, 258]],
  [[436, 343], [436, 278]],
  [[468, 348], [472, 292]],
];
const SEPT_MID: KP[] = [
  [[468, 348], [472, 292]],
  [[500, 354], [500, 298]],
];
/** The mesentery's lateral edge (next to the membrane), from the dorsal wall down to the septum. */
const MES_SIDE: KP[] = [
  [[459, 252], [462, 200]],
  [[447, 292], [448, 236]],
  [[447, 332], [450, 272]],
  [[468, 348], [472, 292]],
];
const O0: KP = OUT[0];
/** The mesentery's root on the dorsal wall → the crura's root in front of the vertebral column. */
const ROOT: KP[] = [
  [[462, 224], [458, 170]],
  [[480, 222], [480, 176]],
  [[500, 222], [500, 178]],
];

function regions(k: number) {
  const out = curve(OUT, k);
  const back = curve(RIM_BACK, k);
  const front = curve(RIM_FRONT, k);
  const edge = curve(SEPT_EDGE, k);
  const mid = SEPT_MID.map((q) => at(q, k));
  const side = [at(O0, k), ...curve(MES_SIDE, k)];
  const root = curve(ROOT, k);
  // The rim as one band round the front (open behind, at the mesentery / the crura): no seam on the midline.
  const rim = [...out, ...rev(mir(out)).slice(1), ...mir(back), ...mir(front).slice(1), ...rev(front).slice(1), ...rev(back).slice(1)];
  const ppL = [...back, ...edge.slice(1), ...rev(side).slice(1, -1)];
  const septum = [...edge, ...mid.slice(1), ...rev(mir(mid)).slice(1), ...rev(mir(edge)).slice(1), ...mir(front).slice(1), ...rev(front).slice(1, -1)];
  const meso = [...side, ...mid.slice(1), ...rev(mir(mid)).slice(1), ...rev(mir(side)).slice(1), ...mir(root).slice(1), ...rev(root).slice(1, -1)];
  return { out, rim, ppL, septum, meso };
}

// ——— The adult dome's own parts (they appear on top of the colours of their origin). ———
/** Central tendon (three leaflets), right half from the front tip to the notch behind; mirrored. */
const TENDON_R: Pt[] = [[500, 465], [566, 456], [614, 417], [670, 373], [693, 314], [666, 268], [618, 275], [577, 308], [539, 327], [500, 318]];
const TENDON = spline([...TENDON_R, ...rev(TENDON_R).slice(1, -1).map((p) => mirror(p))], 8, true);
/** Borders of the middle (front) leaflet. */
const LEAF_LINES = 'M500,334L454,395M500,334L546,395';
const IVC: KP = [[462, 378], [468, 374]];
const ESO: KP = [[520, 296], [522, 222]];
const AORTA: KP = [[500, 196], [500, 140]];
const VERT: KP = [[500, 158], [500, 100]];
const CORD: KP = [[500, 100], [500, 56]];
/** The crura: from the lumbar part back to the lumbar vertebrae (the right one is the longer). */
const CRUS_R: Pt[] = [[470, 192], [466, 150], [474, 104]];
const CRUS_L: Pt[] = [[530, 192], [534, 152], [526, 112]];

/** Farthest crossing of a ray from c with a closed polygon (the dome and the tendon are star-shaped enough). */
function rayHit(pts: readonly Pt[], c: Pt, deg: number): Pt | null {
  const a = (deg * Math.PI) / 180;
  const dx = Math.cos(a);
  const dy = Math.sin(a);
  let best = -1;
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i];
    const q = pts[(i + 1) % pts.length];
    const ex = q[0] - p[0];
    const ey = q[1] - p[1];
    const den = dx * ey - dy * ex;
    if (Math.abs(den) < 1e-9) continue;
    const s = ((p[0] - c[0]) * ey - (p[1] - c[1]) * ex) / den;
    const u = ((p[0] - c[0]) * dy - (p[1] - c[1]) * dx) / den;
    if (s > 0 && u >= 0 && u <= 1 && s > best) best = s;
  }
  return best > 0 ? [c[0] + dx * best, c[1] + dy * best] : null;
}

/** Muscle fibres radiating from the tendon to the rim (none behind, where the crura run). */
function fibres(outline: readonly Pt[]) {
  const c: Pt = [500, 360];
  const d: string[] = [];
  for (let deg = -52; deg <= 232; deg += 4.5) {
    const o = rayHit(outline, c, deg);
    const i = rayHit(TENDON, c, deg);
    if (o && i) d.push(`M${f1(i[0])},${f1(i[1])}L${f1(o[0])},${f1(o[1])}`);
  }
  return d.join('');
}

const lerpPt = (a: Pt, b: Pt, k: number): Pt => [lerp(a[0], b[0], k), lerp(a[1], b[1], k)];

export function DiaphragmFate({ t }: SceneProps) {
  const k = sm(seg(t, FATE.morph[0], FATE.morph[1]));
  const named = seg(t, FATE.named[0], FATE.named[1]);
  const adult = seg(k, 0.55, 1);
  const body = 1 - seg(k, 0, 0.55);
  const g = regions(k);
  const outline = [...g.out, ...rev(mir(g.out)).slice(1, -1)];
  const ivc = at(IVC, k);
  const eso = at(ESO, k);
  const aorta = at(AORTA, k);
  const vert = at(VERT, k);
  const cord = at(CORD, k);
  const bodyX = BODY_X.map(S);

  const region = (pts: Pt[], color: string) => (
    <>
      <path d={poly(pts)} fill={color} stroke={color} strokeWidth={1.4} strokeLinejoin="round" />
      <path d={poly(pts)} fill="url(#w7-mesench)" opacity={1 - adult * 0.6} />
    </>
  );

  return (
    <g>
      <Defs7 />
      <rect x={0} y={0} width={1000} height={640} fill="#0f0f11" />

      {/* The 5-week body round the section: wall, skin and back muscles fade as the drawing becomes the adult dome. */}
      <g opacity={body}>
        <Part id="gorputz-pareta" quiet>
          <path d={poly(bodyX)} fill={P.wall} />
          <path d={poly(bodyX)} fill="url(#w7-mesench)" />
        </Part>
        <Part id="azaleko-ektodermoa" quiet>
          <Sheet outer={bodyX} inner={offset(bodyX, -8, true)} color={P.skin} nucleus="rgba(20,40,110,0.7)" cell={9} seed={11} />
        </Part>
        <Part id="somitak" quiet>
          {[1, -1].map((s) => (
            <g key={s}>
              <ellipse cx={500 + s * 62} cy={S([0, 116])[1]} rx={34} ry={26} fill="#6e2a40" opacity={0.75} />
              <ellipse cx={500 + s * 62} cy={S([0, 116])[1]} rx={34} ry={26} fill="url(#w7-muscle)" opacity={0.45} />
            </g>
          ))}
        </Part>
      </g>

      {/* Axial structures behind: the cord in its arch and the vertebral body (embryo → adult). */}
      <Part id="ornoak" quiet>
        <path d={`M${f1(vert[0] - 30)},${f1(vert[1] - 6)} C${f1(vert[0] - 36)},${f1(cord[1] - 8)} ${f1(vert[0] - 22)},${f1(cord[1] - 24)} ${f1(vert[0])},${f1(cord[1] - 26)} C${f1(vert[0] + 22)},${f1(cord[1] - 24)} ${f1(vert[0] + 36)},${f1(cord[1] - 8)} ${f1(vert[0] + 30)},${f1(vert[1] - 6)}`} fill="none" stroke={P.bone} strokeWidth={8} strokeLinecap="round" opacity={0.7} />
        <ellipse cx={vert[0]} cy={vert[1]} rx={lerp(31, 42, k)} ry={lerp(17, 19, k)} fill={P.bone} opacity={0.92} />
        <ellipse cx={vert[0]} cy={vert[1]} rx={lerp(31, 42, k)} ry={lerp(17, 19, k)} fill="url(#w7-light)" />
      </Part>
      <Part id="hodi-neurala" quiet>
        <ellipse cx={cord[0]} cy={cord[1]} rx={lerp(22, 13, k)} ry={lerp(27, 13, k)} fill={P.neural} stroke="rgba(10,16,48,0.6)" strokeWidth={1} />
        <ellipse cx={cord[0]} cy={cord[1]} rx={2.5} ry={lerp(8, 3, k)} fill="#0c1428" />
      </Part>

      {/* The four components, each in its colour from the section to the adult dome. */}
      <Part id="mintz-pleuroperitonealak">
        {region(g.ppL, P.poMem)}
        {region(mir(g.ppL), P.poMem)}
      </Part>
      <Part id="septum-transversum">{region(g.septum, P.septum)}</Part>
      <Part id="hestegorri-inguruko-mesenkima">{region(g.meso, P.eso)}</Part>
      <Part id="gorputz-paretako-mesodermoa">{region(g.rim, P.bodyMuscle)}</Part>

      {/* The adult muscle: fibres from the tendon out to the rim. */}
      <path d={fibres(outline)} stroke="rgba(255,236,236,0.3)" strokeWidth={1.1} opacity={adult} pointerEvents="none" />

      {/* The adult parts, drawn over the colour of where they came from. */}
      <Part id="diafragmaren-alde-periferikoa" show={adult}>
        <path d={poly(g.rim)} fill="url(#w7-muscle)" stroke="#f3c6dc" strokeWidth={1.4} strokeOpacity={0.7} />
      </Part>
      <Part id="gerriko-atala" show={adult}>
        <path d={poly(g.meso)} fill="url(#w7-muscle)" stroke="#bff3e8" strokeWidth={1.4} strokeOpacity={0.75} />
      </Part>
      <Part id="diafragmaren-zutabeak" show={adult}>
        {[CRUS_R, CRUS_L].map((c, i) => (
          <path key={i} d={poly(spline(c, 6), false)} fill="none" stroke={P.eso} strokeWidth={i ? 11 : 13} strokeLinecap="round" />
        ))}
      </Part>
      <Part id="zentro-tendinosoa" show={adult}>
        <path d={poly(TENDON)} fill="#fbe3c2" fillOpacity={0.4} stroke="#fff4e2" strokeWidth={1.8} />
        <path d={poly(TENDON)} fill="url(#w7-tendon)" />
        <path d={LEAF_LINES} stroke="#c9b89e" strokeWidth={1.4} />
      </Part>

      {/* The three tubes keep their places: the vena cava through the tendon, the oesophagus through the lumbar part, the aorta behind. */}
      <Part id="beheko-kaba-zaina">
        <circle cx={ivc[0]} cy={ivc[1]} r={lerp(11, 12, k)} fill={P.ivc} stroke="#1c3c88" strokeWidth={1.2} />
        <circle cx={ivc[0] - 3} cy={ivc[1] - 3} r={3} fill="#9fbcff" opacity={0.5} />
      </Part>
      <Part id="hestegorria">
        <circle cx={eso[0]} cy={eso[1]} r={13} fill="#7a3b48" stroke="rgba(40,10,20,0.6)" strokeWidth={1} />
        <circle cx={eso[0]} cy={eso[1]} r={7.5} fill={P.gut} />
        <circle cx={eso[0]} cy={eso[1]} r={2.4} fill="#1a1208" />
      </Part>
      <Part id="aorta">
        <circle cx={aorta[0]} cy={aorta[1]} r={13} fill={P.aorta} stroke="#7a0f1e" strokeWidth={1.4} />
        <circle cx={aorta[0]} cy={aorta[1]} r={7.5} fill="#9e1228" />
      </Part>
      {/* The median arcuate ligament arching in front of the aorta, between the crura. */}
      <path d="M470,162 Q500,184 530,162" fill="none" stroke="#efe6d6" strokeWidth={4} strokeLinecap="round" opacity={adult} pointerEvents="none" />

      <path d={poly(bodyX)} fill="url(#w7-light)" opacity={body} pointerEvents="none" />

      <Note x={24} y={22} align="start" show={1 - seg(k, 0.2, 0.45)}>
        5. astea: zeharkako mozketa diafragmaren mailan
      </Note>
      <Note x={24} y={22} align="start" show={seg(k, 0.55, 0.85)}>
        Diafragma heldua, goitik ikusita (atzea goian, orientazio berean)
      </Note>
      <Note x={500} y={600} tone="accent" show={vis(t, 0, FATE.morph[0])}>
        Lau osagai, bakoitza bere kolorez
      </Note>
      <Note x={500} y={600} tone="accent" show={vis(t, FATE.morph[0], FATE.named[1])}>
        Hazi ahala, osagai bakoitzak bere tokia gordetzen du diafragma helduan
      </Note>
      <Note x={500} y={592} tone="accent" show={vis(t, FATE.named[1])}>
        Septuma → zentro tendinosoa · hestegorri inguruko mesenkima → gerriko atala
      </Note>
      <Note x={500} y={614} tone="accent" show={vis(t, FATE.named[1])}>
        Gorputz paretako mesodermoa → alde periferikoa · mintz pleuroperitonealak → atze-alboetan
      </Note>

      {/* Left: where each part came from. */}
      <Label id="diafragmaren-zutabeak" x={190} y={118} ax={CRUS_R[1][0] - 4} ay={CRUS_R[1][1]} show={named} small />
      <Label id="mintz-pleuroperitonealak" x={190} y={196} ax={lerpPt(S([372, 292]), [352, 210], k)[0]} ay={lerpPt(S([372, 292]), [352, 210], k)[1]} />
      <Label id="gerriko-atala" x={190} y={258} ax={455} ay={238} show={named} />
      <Label id="beheko-kaba-zaina" x={190} y={350} ax={ivc[0] - 10} ay={ivc[1] + 2} small />
      <Label id="septum-transversum" x={202} y={420} ax={lerpPt(S([392, 470]), [404, 404], k)[0]} ay={lerpPt(S([392, 470]), [404, 404], k)[1]} />
      <Label id="gorputz-paretako-mesodermoa" x={248} y={548} ax={lerpPt(S([290, 474]), [292, 440], k)[0]} ay={lerpPt(S([290, 474]), [292, 440], k)[1]} small />

      {/* Right: the tubes and the adult parts. */}
      <Label id="aorta" x={810} y={124} ax={aorta[0] + 12} ay={aorta[1] - 2} small />
      <Label id="hestegorria" x={810} y={176} ax={eso[0] + 11} ay={eso[1] - 3} small />
      <Label id="hestegorri-inguruko-mesenkima" x={784} y={258} ax={lerpPt(S([540, 326]), [546, 262], k)[0]} ay={lerpPt(S([540, 326]), [546, 262], k)[1]} small />
      <Label id="zentro-tendinosoa" x={810} y={404} ax={600} ay={400} show={named} />
      <Label id="diafragmaren-alde-periferikoa" x={810} y={470} ax={724} ay={430} show={named} />
    </g>
  );
}
