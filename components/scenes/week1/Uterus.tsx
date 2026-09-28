'use client';

import { C, Label, Note, Part, lerp, type Pt, type SceneProps } from '@/components/kit';

/**
 * 4.1 Emakumearen ugal aparatua, the whole organ: the uterus in a frontal cut with its three
 * regions — fundus (above the openings of the tubes), body (with the triangular cavity) and cervix
 * (continuing into the vagina) — plus the tubes and ovaries, so the parts named in the notes can
 * be seen and pointed at. The wall keeps its three layers: perimetrium, myometrium, endometrium.
 * Static: it does not move with the stage, only the step's structures light up.
 */

const CX = 500;
const Y_TOP = 104;
const Y_FUNDUS = 190; // level of the tubal openings: fundus above, body below
const Y_OS = 392; // internal os: body above, cervix below
const Y_END = 494; // external os

/** Half-width of the outer silhouette at height y. */
function half(y: number): number {
  if (y < Y_FUNDUS) return 152 * Math.sqrt(Math.max(0, 1 - ((Y_FUNDUS - y) / (Y_FUNDUS - Y_TOP)) ** 2));
  if (y < Y_OS) return lerp(152, 50, (y - Y_FUNDUS) / (Y_OS - Y_FUNDUS));
  return lerp(50, 58, (y - Y_OS) / (Y_END - Y_OS));
}

/** Closed outline of the uterus between two heights (both sides, mirrored on the midline). */
function band(y0: number, y1: number, n = 24): string {
  const ys = Array.from({ length: n + 1 }, (_, i) => lerp(y0, y1, i / n));
  const right: Pt[] = ys.map((y) => [CX + half(y), y]);
  const left: Pt[] = [...ys].reverse().map((y) => [CX - half(y), y]);
  return `M${[...right, ...left].map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' L')}Z`;
}

const CAVITY = `M${CX},172 Q${CX + 46},166 ${CX + 96},188 L${CX + 6},388 L${CX - 6},388 L${CX - 96},188 Q${CX - 46},166 ${CX},172Z`;
const CANAL = `M${CX - 6},388 L${CX + 6},388 L${CX + 5},${Y_END} L${CX - 5},${Y_END}Z`;

/** One side: tube from the uterine corner over the ovary, the ovary and the fimbriae. `s` = +1 right, −1 left. */
function Side({ s }: { s: 1 | -1 }) {
  const x = (v: number) => CX + s * (v - CX);
  const tube = `M${x(594)},188 C${x(652)},178 ${x(690)},150 ${x(742)},132 C${x(806)},110 ${x(866)},160 ${x(852)},228`;
  const fim = [
    [x(846), 238, x(826), 262],
    [x(854), 240, x(848), 270],
    [x(862), 236, x(872), 264],
  ];
  return (
    <g>
      <Part id="obulutegia">
        <ellipse cx={x(790)} cy={286} rx={54} ry={34} transform={`rotate(${s * -14} ${x(790)} 286)`} fill={C.ovary} stroke="rgba(60,30,20,0.55)" strokeWidth={1.4} />
        {[[-16, -6, 8], [10, 8, 6], [22, -10, 5], [-8, 14, 5]].map(([dx, dy, r], i) => (
          <circle key={i} cx={x(790) + s * dx} cy={286 + dy} r={r} fill="#fbe6d0" stroke="rgba(90,50,30,0.5)" strokeWidth={1} />
        ))}
      </Part>
      <Part id="umetoki-tronpa">
        <path d={tube} fill="none" stroke={C.tube} strokeWidth={22} strokeLinecap="round" />
        <path d={tube} fill="none" stroke="#3a1b2e" strokeWidth={8} strokeLinecap="round" opacity={0.8} />
      </Part>
      <Part id="finbriak">
        <g fill="none" stroke={C.tube} strokeWidth={7} strokeLinecap="round">
          {fim.map(([a, b, c, d], i) => (
            <path key={i} d={`M${a},${b} L${c},${d}`} />
          ))}
        </g>
      </Part>
    </g>
  );
}

export function UterusParts({ t: _t }: SceneProps) {
  void _t;
  return (
    <g>
      {/* Vagina: context only (not one of the studied structures) */}
      <g pointerEvents="none">
        <path d={`M${CX - 122},452 C${CX - 122},540 ${CX - 100},590 ${CX - 100},618 L${CX + 100},618 C${CX + 100},590 ${CX + 122},540 ${CX + 122},452`} fill="rgba(200,120,140,0.16)" stroke="rgba(230,150,170,0.5)" strokeWidth={1.6} />
        <text x={CX} y={590} textAnchor="middle" fill="#c9a0aa" fontSize={11} letterSpacing="0.14em" style={{ textTransform: 'uppercase' }}>
          Bagina
        </text>
      </g>

      <Side s={1} />
      <Side s={-1} />

      {/* Wall: the whole organ in muscle, then its three regions so each can be lit alone */}
      <Part id="miometrioa">
        <path d={band(Y_TOP, Y_END)} fill={C.myometrium} />
      </Part>
      <Part id="umetokiaren-fundusa">
        <path d={band(Y_TOP, Y_FUNDUS)} fill={C.myometrium} />
      </Part>
      <Part id="umetokiaren-gorputza">
        <path d={band(Y_FUNDUS, Y_OS)} fill={C.myometrium} />
      </Part>
      <Part id="umetokiaren-lepoa">
        <path d={band(Y_OS, Y_END)} fill={C.myometrium} />
      </Part>
      <g pointerEvents="none" stroke="rgba(255,255,255,0.35)" strokeDasharray="5 5" strokeWidth={1.2}>
        <line x1={CX - 178} x2={CX + 178} y1={Y_FUNDUS} y2={Y_FUNDUS} />
        <line x1={CX - 84} x2={CX + 84} y1={Y_OS} y2={Y_OS} />
      </g>
      <Part id="perimetrioa">
        <path d={band(Y_TOP, Y_END)} fill="none" stroke={C.perimetrium} strokeWidth={5} strokeLinejoin="round" />
      </Part>
      <Part id="endometrioa">
        <path d={CAVITY} fill="none" stroke={C.stroma} strokeWidth={28} strokeLinejoin="round" />
        <path d={CAVITY} fill="none" stroke={C.epithelium} strokeWidth={3} strokeLinejoin="round" />
      </Part>
      <Part id="umetoki-barrunbea">
        <path d={CAVITY} fill="#3a1b2e" />
        <path d={CANAL} fill="#3a1b2e" />
      </Part>

      {/* Labels: tube and ovary and the wall layers on the left, the uterus itself on the right */}
      <Label id="umetoki-tronpa" x={170} y={120} ax={CX - (742 - CX)} ay={132} />
      <Label id="finbriak" x={170} y={236} ax={CX - (846 - CX)} ay={244} />
      <Label id="obulutegia" x={170} y={346} ax={CX - (790 - CX) + 30} ay={296} />
      <Label id="endometrioa" x={170} y={420} ax={CX - 70} ay={250} />
      <Label id="miometrioa" x={170} y={470} ax={CX - 118} ay={230} />
      <Label id="perimetrioa" x={170} y={520} ax={CX - 78} ay={330} />
      <Label id="umetokiaren-fundusa" x={730} y={34} ax={CX + 60} ay={138} align="start" />
      <Label id="umetoki-barrunbea" x={730} y={344} ax={CX + 18} ay={262} align="start" />
      <Label id="umetokiaren-gorputza" x={730} y={396} ax={CX + 100} ay={300} align="start" />
      <Label id="umetokiaren-lepoa" x={730} y={452} ax={CX + 56} ay={440} align="start" />

      <Note x={CX} y={630} tone="dim">Umetokia: fundusa · gorputza · lepoa (baginaren jarraian)</Note>
    </g>
  );
}
