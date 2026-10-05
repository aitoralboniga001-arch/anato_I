'use client';

import { Label, Mark, Note, Part, lerp, seg, smoothPath, type Pt, type SceneProps } from '@/components/kit';
import { Defs7, P, Serosa, Sheet, arc, f1, offset, poly, resample, spline, vis } from './common';

/**
 * 7:peritoneo-barrunbea — apunteen 2.1 atala eta 24. orriko irudiak: abdomenaren zeharkako mozketa
 * (dortsala goian, bentrala behean; ikuslearen ezkerra = enbrioiaren eskuina). Hestea errai orriak
 * inguratzen du eta atzeko paretari lotura zabal batek eusten dio; peritoneo barrunbean lotura hori bi
 * orriko mesenterio dortsala bihurtzen da. Paretako eta errai orriak paretako eta errai peritoneoa dira.
 * Hestetik sortutakoak peritoneo barrukoak dira; giltzurrunak, aorta eta beheko kaba atzeko paretan geratzen
 * dira (peritoneo kanpokoak); goranzko eta beheranzko kolonen mesenterioa atzeko paretako peritoneoarekin
 * fusionatzen da (peritoneo atzekoak). Peritoneo barrunbeak ez du abdomen osoa okupatzen.
 */

const BODY = spline(
  [
    [500, 52], [640, 66], [740, 120], [790, 220], [796, 330], [770, 438], [700, 524], [600, 574], [500, 584], [400, 574], [300, 524], [230, 438],
    [204, 330], [210, 220], [260, 120], [360, 66],
  ],
  8,
  true,
);
const SKIN_IN = offset(BODY, -9, true);

const GUT: Pt = [500, 414];
const GR = { x: 40, y: 36 };
const ROOT_Y = 278;
const AORTA: Pt = [500, 228];
const IVC: Pt = [452, 240];
const KIDNEY_L: Pt = [362, 214];
const KIDNEY_R: Pt = [638, 214];

/** Ascending colon (viewer's left = embryo's right) and descending colon: hanging → fused to the back wall. */
const colonAt = (side: -1 | 1, k: number): Pt => [500 + side * lerp(170, 152, k), lerp(404, 312, k)];
const CR = 25;

/** The peritoneal cavity: dorsal border (it bulges in front of the colons as they fuse), then the walls. */
function cavity(k: number): Pt[] {
  const b = 50 * k;
  const keys: Pt[] = [
    [508, ROOT_Y],
    [560, 284], [604, 292 + 0.25 * b], [652, 288 + b], [698, 298 + 0.25 * b], [736, 330],
    [750, 400], [726, 476], [664, 530], [580, 556], [500, 562], [420, 556], [336, 530], [274, 476], [250, 400],
    [264, 330], [302, 298 + 0.25 * b], [348, 288 + b], [396, 292 + 0.25 * b], [440, 284],
    [492, ROOT_Y],
  ];
  return spline(keys, 8);
}

/** Dorsal attachment of the gut (root width w, width bw where it meets the gut) + the gut, as one outline. */
function gutContour(w: number, bw: number): Pt[] {
  const half = Math.min(bw / 2, GR.x * 0.97);
  const a = (-Math.acos(-half / GR.x) * 180) / Math.PI; // left meeting point, top-left quadrant
  const top = GUT[1] - GR.y * Math.sin((Math.abs(a) * Math.PI) / 180);
  const left = spline([[500 - w / 2, ROOT_Y], [lerp(500 - w / 2, 500 - half, 0.55) - 4, lerp(ROOT_Y, top, 0.5)], [500 - half, top]], 6);
  const round = arc(GUT[0], GUT[1], GR.x, GR.y, a, -180 - (180 + a) - 180, 44);
  const right = left.map(([x, y]): Pt => [1000 - x, y]).reverse();
  return [...left, ...round.slice(1, -1), ...right];
}

function Bean({ c, flip }: { c: Pt; flip?: boolean }) {
  const s = flip ? -1 : 1;
  const pts = spline(
    [
      [c[0] - 34 * s, c[1] - 6], [c[0] - 18 * s, c[1] - 24], [c[0] + 14 * s, c[1] - 24], [c[0] + 34 * s, c[1] - 6], [c[0] + 30 * s, c[1] + 16],
      [c[0] + 8 * s, c[1] + 22], [c[0] - 2 * s, c[1] + 12], [c[0] - 14 * s, c[1] + 22], [c[0] - 32 * s, c[1] + 14],
    ],
    6,
    true,
  );
  return (
    <>
      <path d={poly(pts)} fill="#b2485a" stroke="#6e1f2e" strokeWidth={1.2} />
      <path d={poly(pts)} fill="url(#w7-light)" />
    </>
  );
}

function Tube({ c, rx, ry, wall = '#7a3b48' }: { c: Pt; rx: number; ry: number; wall?: string }) {
  return (
    <>
      <ellipse cx={c[0]} cy={c[1]} rx={rx} ry={ry} fill={wall} stroke="rgba(40,10,20,0.6)" strokeWidth={1} />
      <ellipse cx={c[0]} cy={c[1]} rx={rx * 0.66} ry={ry * 0.66} fill={P.gut} stroke="rgba(90,60,10,0.6)" strokeWidth={0.9} />
      <ellipse cx={c[0]} cy={c[1]} rx={rx * 0.3} ry={ry * 0.26} fill="#1a1208" />
      <ellipse cx={c[0]} cy={c[1]} rx={rx} ry={ry} fill="url(#w7-light)" />
    </>
  );
}

export function PeritoneumSection({ t }: SceneProps) {
  const thin = seg(t, 0.19, 0.31);
  const w = lerp(150, 18, thin);
  const bw = lerp(78, 14, thin);
  const named = seg(t, 0.34, 0.4);
  const colons = seg(t, 0.49, 0.56);
  const k = seg(t, 0.78, 0.88);
  const cav = cavity(k);
  const gut = gutContour(w, bw);
  const colonL = colonAt(-1, k);
  const colonR = colonAt(1, k);

  // A colon's short mesentery: from the dorsal wall down to the colon, shortening to nothing as it fuses.
  const colonMes = (c: Pt, side: -1 | 1) => {
    const rootY = 288;
    const topY = c[1] - CR + 2;
    if (topY - rootY < 2) return null;
    const x0 = c[0];
    const band: Pt[] = [[x0 - 7, rootY], [x0 + 7, rootY], [x0 + 5, topY], [x0 - 5, topY]];
    return <path key={side} d={poly(band)} fill="#c98a8a" opacity={0.85} />;
  };
  const extra = vis(t, 0.62);

  return (
    <g>
      <Defs7 />
      <rect x={0} y={0} width={1000} height={640} fill="#0f0f11" />

      {/* Body wall and dorsal mesenchyme. */}
      <path d={poly(BODY)} fill={P.wall} />
      <path d={poly(BODY)} fill="url(#w7-mesench)" />
      <Part id="azaleko-ektodermoa" quiet>
        <Sheet outer={BODY} inner={SKIN_IN} color={P.skin} nucleus="rgba(20,40,110,0.7)" cell={9} seed={5} />
      </Part>

      {/* Axial structures at the back. */}
      <Part id="hodi-neurala">
        <ellipse cx={500} cy={106} rx={26} ry={32} fill={P.neural} stroke="rgba(10,16,48,0.6)" strokeWidth={1} />
        <ellipse cx={500} cy={106} rx={3} ry={9} fill="#0c1428" />
      </Part>
      <Part id="ornoak" quiet>
        <ellipse cx={500} cy={170} rx={36} ry={22} fill={P.bone} opacity={0.85} />
        <ellipse cx={500} cy={170} rx={36} ry={22} fill="url(#w7-light)" />
      </Part>

      {/* Peritoneal cavity: a dark space with its tint. */}
      <path d={poly(cav)} fill={P.space} />
      <Part id="peritoneo-barrunbea">
        <path d={poly(cav)} fill={P.perito} />
      </Part>

      {/* Behind the cavity, in the back wall: kidneys, aorta, inferior vena cava (outside the peritoneum). */}
      <Part id="giltzurruna">
        <Bean c={KIDNEY_L} />
        <Bean c={KIDNEY_R} flip />
      </Part>
      <Part id="aorta">
        <circle cx={AORTA[0]} cy={AORTA[1]} r={17} fill={P.aorta} stroke="#7a0f1e" strokeWidth={1.4} />
        <circle cx={AORTA[0] - 4} cy={AORTA[1] - 5} r={6} fill="#fff" opacity={0.18} />
      </Part>
      <Part id="beheko-kaba-zaina">
        <ellipse cx={IVC[0]} cy={IVC[1]} rx={15} ry={12} fill={P.ivc} stroke="#1c3c88" strokeWidth={1.2} />
      </Part>
      <Part id="peritoneo-kanpoko-egiturak" show={extra}>
        <g opacity={0.001}>
          <Bean c={KIDNEY_L} />
          <Bean c={KIDNEY_R} flip />
          <circle cx={AORTA[0]} cy={AORTA[1]} r={17} fill={P.aorta} />
          <ellipse cx={IVC[0]} cy={IVC[1]} rx={15} ry={12} fill={P.ivc} />
        </g>
      </Part>

      {/* The dorsal attachment of the gut: broad mesenchyme first, then the two-layered dorsal mesentery. */}
      <Part id="mesenterio-dortsala">
        <path d={smoothPath(gut, true, 0.3)} fill="#a8606b" />
        <path d={smoothPath(gut, true, 0.3)} fill="url(#w7-mesench)" />
        <path d={`M500,${ROOT_Y + 6}L500,${f1(GUT[1] - GR.y)}`} stroke="#d8203a" strokeWidth={lerp(5, 2.4, thin)} opacity={0.7} />
      </Part>
      <Part id="erdiko-hestea">
        <Tube c={GUT} rx={GR.x - 4} ry={GR.y - 4} />
      </Part>

      {/* Colons, each on its own short mesentery, appear as more of the gut's derivatives. */}
      {colons > 0.01 && (
        <>
          <g opacity={colons}>
            {colonMes(colonL, -1)}
            {colonMes(colonR, 1)}
          </g>
          <Part id="goranzko-kolona" show={colons}>
            <Tube c={colonL} rx={CR} ry={CR - 2} />
          </Part>
          <Part id="beheranzko-kolona" show={colons}>
            <Tube c={colonR} rx={CR} ry={CR - 2} />
          </Part>
        </>
      )}

      {/* Serous linings: parietal (the wall of the cavity) and visceral (round the gut and its mesentery). */}
      <Part id="paretako-orria" show={1 - named}>
        <Serosa pts={cav} d={6} color={P.serosa} seed={2} cell={12} />
      </Part>
      <Part id="paretako-peritoneoa" show={named}>
        <Serosa pts={cav} d={6} color={P.serosa} seed={2} cell={12} />
      </Part>
      <Part id="errai-orria" show={1 - named}>
        <Serosa pts={resample(gut, 70)} d={5} color="#ffd29a" seed={4} cell={10} />
      </Part>
      <Part id="errai-peritoneoa" show={named}>
        <Serosa pts={resample(gut, 70)} d={5} color="#ffd29a" seed={4} cell={10} />
        {colons > 0.01 &&
          [colonL, colonR].map((c, i) => (
            <path key={i} d={poly(arc(c[0], c[1], CR + 2, CR, lerp(-90, 0, k), lerp(270, 180, k), 30), false)} fill="none" stroke="#ffd29a" strokeWidth={3.2} opacity={colons} />
          ))}
      </Part>

      {/* Groups (no outline of their own): they light up as the organs they name. */}
      <Part id="peritoneo-barruko-egiturak" show={vis(t, 0.48)}>
        <g opacity={0.001}>
          <ellipse cx={GUT[0]} cy={GUT[1]} rx={GR.x} ry={GR.y} />
          {k < 0.5 && <circle cx={colonL[0]} cy={colonL[1]} r={CR} />}
          {k < 0.5 && <circle cx={colonR[0]} cy={colonR[1]} r={CR} />}
        </g>
      </Part>
      <Part id="peritoneo-atzeko-egiturak" show={k}>
        <g opacity={0.001}>
          <circle cx={colonL[0]} cy={colonL[1]} r={CR} />
          <circle cx={colonR[0]} cy={colonR[1]} r={CR} />
        </g>
      </Part>
      <Mark id="peritoneo-atzeko-egiturak" x={colonL[0]} y={colonL[1] - 18} rx={34} ry={16} show={vis(t, 0.78, 0.9)} />
      <Mark id="peritoneo-atzeko-egiturak" x={colonR[0]} y={colonR[1] - 18} rx={34} ry={16} show={vis(t, 0.78, 0.9)} />

      <path d={poly(BODY)} fill="url(#w7-light)" pointerEvents="none" />

      <Note x={500} y={606} tone="accent" show={vis(t, 0, 0.17)}>
        Hestea atzeko paretari lotuta: mesenkimazko lotura zabala
      </Note>
      <Note x={500} y={606} tone="accent" show={vis(t, 0.17, 0.33)}>
        Peritoneo barrunbean: bi orriko atzeko lotura = mesenterio dortsala
      </Note>
      <Note x={500} y={606} tone="accent" show={vis(t, 0.33, 0.48)}>
        Paretako orria → paretako peritoneoa · errai orria → errai peritoneoa
      </Note>
      <Note x={500} y={606} tone="accent" show={vis(t, 0.48, 0.62)}>
        Hestetik sortutakoak errai peritoneoz inguratuta: peritoneo barrukoak
      </Note>
      <Note x={500} y={606} tone="accent" show={vis(t, 0.62, 0.76)}>
        Giltzurrunak, aorta eta beheko kaba: peritoneo barrunbearen atzean (peritoneo kanpokoak)
      </Note>
      <Note x={500} y={606} tone="accent" show={vis(t, 0.76, 0.9)}>
        Mesenterioa atzeko paretako peritoneoarekin fusionatzen da: peritoneo atzekoak
      </Note>
      <Note x={500} y={606} tone="accent" show={vis(t, 0.9)}>
        Peritoneo barrunbeak ez du abdomeneko barrunbe osoa okupatzen
      </Note>

      {/* Left gutter. */}
      <Label id="beheko-kaba-zaina" x={190} y={150} ax={IVC[0] - 10} ay={IVC[1] - 6} show={extra} small />
      <Label id="giltzurruna" x={190} y={196} ax={KIDNEY_L[0] - 26} ay={KIDNEY_L[1]} show={extra} />
      <Label id="peritoneo-atzeko-egiturak" x={190} y={290} ax={colonL[0] - 18} ay={colonL[1] - 8} show={k} small />
      <Label id="goranzko-kolona" x={190} y={360} ax={colonL[0] - CR + 4} ay={colonL[1]} show={colons} />
      <Label id="paretako-orria" x={190} y={432} ax={258} ay={432} show={1 - named} />
      <Label id="paretako-peritoneoa" x={190} y={432} ax={258} ay={432} show={named} />
      <Label id="peritoneo-barrunbea" x={190} y={492} ax={318} ay={498} />

      {/* Right gutter. */}
      <Label id="hodi-neurala" x={810} y={92} ax={526} ay={100} small />
      <Label id="aorta" x={810} y={180} ax={AORTA[0] + 14} ay={AORTA[1] - 6} show={extra} />
      <Label id="peritoneo-kanpoko-egiturak" x={804} y={240} ax={KIDNEY_R[0] + 28} ay={KIDNEY_R[1] + 4} show={extra} small />
      <Label id="mesenterio-dortsala" x={810} y={290} ax={500 + w / 2 - 6} ay={ROOT_Y + 30} show={seg(thin, 0.6, 1)} />
      <Label id="beheranzko-kolona" x={810} y={360} ax={colonR[0] + CR - 4} ay={colonR[1]} show={colons} />
      <Label id="erdiko-hestea" x={810} y={410} ax={GUT[0] + 20} ay={GUT[1]} />
      <Label id="errai-orria" x={810} y={452} ax={GUT[0] + 26} ay={GUT[1] + 30} show={1 - named} />
      <Label id="errai-peritoneoa" x={810} y={452} ax={GUT[0] + 26} ay={GUT[1] + 30} show={named} />
      <Label id="peritoneo-barruko-egiturak" x={804} y={500} ax={GUT[0] + 10} ay={GUT[1] + 36} show={vis(t, 0.48)} small />
    </g>
  );
}
