'use client';

import { C, Label, Note, Part, bezier, lerp, polyline, seg, tube, type Pt, type SceneProps } from '@/components/kit';
import { U_T, piece, stageOf, wavy } from './Tract';

/**
 * 4.1 Emakumearen ugal aparatua, the whole organ: the uterus in a frontal cut with its three
 * regions — fundus (above the openings of the tubes), body (with the triangular cavity) and cervix
 * (continuing into the vagina) — plus the tubes and ovaries, so the parts named in the notes can
 * be seen and pointed at. The wall keeps its three layers: perimetrium, myometrium, endometrium
 * (progestational, with its glands). The organ itself does not move; the conceptus travels it in
 * step with the "aparatua" view (same stage time): right ovary → tube → cavity → implantation.
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

const fmt = (pts: Pt[]) => pts.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' L');

/** Outline of the cavity as points (for the glands that open on its surface). */
const RIM: Pt[] = (() => {
  const q = (a: Pt, c: Pt, b: Pt, n: number) => Array.from({ length: n }, (_, i): Pt => {
    const s = i / n;
    return [(1 - s) ** 2 * a[0] + 2 * (1 - s) * s * c[0] + s * s * b[0], (1 - s) ** 2 * a[1] + 2 * (1 - s) * s * c[1] + s * s * b[1]];
  });
  const l = (a: Pt, b: Pt, n: number) => Array.from({ length: n }, (_, i): Pt => [lerp(a[0], b[0], i / n), lerp(a[1], b[1], i / n)]);
  return [...q([CX - 96, 188], [CX - 46, 166], [CX, 172], 8), ...q([CX, 172], [CX + 46, 166], [CX + 96, 188], 8), ...l([CX + 96, 188], [CX + 8, 380], 18), ...l([CX - 8, 380], [CX - 96, 188], 18)];
})();

/** Corkscrew glands of the endometrium, from the surface of the cavity into the wall. */
const GLANDS = RIM.map((p, i) => {
  const a = RIM[Math.max(0, i - 1)];
  const b = RIM[Math.min(RIM.length - 1, i + 1)];
  const L = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
  let n: Pt = [(b[1] - a[1]) / L, -(b[0] - a[0]) / L];
  // Outwards: away from the middle of the cavity.
  if ((p[0] - CX) * n[0] + (p[1] - 250) * n[1] < 0) n = [-n[0], -n[1]];
  const tg: Pt = [-n[1], n[0]];
  const depth = 13 + (i % 3) * 2;
  return fmt(
    Array.from({ length: 13 }, (_, j): Pt => {
      const s = j / 12;
      const r = 1 + s * depth;
      const z = Math.sin(s * Math.PI * 4 + i) * (0.8 + 2 * s);
      return [p[0] + n[0] * r + tg[0] * z, p[1] + n[1] * r + tg[1] * z];
    }),
  );
});

/** Vaginal rugae: transverse folds of the mucosa (context). */
const RUGAE = Array.from({ length: 6 }, (_, i) => {
  const y = 470 + i * 21;
  const w = 92 - i * 2;
  return `M${CX - w},${y} q${w / 2},${5 + (i % 2) * 3} ${w},0 t${w},0`;
});

/** Tube centreline on one side, from the uterine corner (u = 0) to the abdominal opening (u = 1). */
function tubeLine(s: 1 | -1) {
  const P = (px: number, py: number): Pt => [CX + s * (px - CX), py];
  const a = bezier(P(590, 189), P(652, 178), P(690, 150), P(742, 132));
  const b = bezier(P(742, 132), P(806, 110), P(866, 160), P(852, 226));
  return polyline([...Array.from({ length: 24 }, (_, i) => a(i / 24)), ...Array.from({ length: 25 }, (_, i) => b(i / 24))].map((q): Pt => [q.x, q.y]));
}
const RIGHT = tubeLine(1);

/** Ovaries: follicles in growth; on the right one the mature follicle that ovulates and then the corpus luteum. */
const OV_R: Pt = [790, 286];
const FOLLICLE: Pt = [826, 266];

/** One side: tube from the uterine corner over the ovary, the ovary and the fimbriae. `s` = +1 right, −1 left. */
function Side({ s, rupture, luteum }: { s: 1 | -1; rupture: number; luteum: number }) {
  const x = (v: number) => CX + s * (v - CX);
  const c = s === 1 ? RIGHT : tubeLine(-1);
  // Narrow isthmus → wider ampulla → trumpet-shaped infundibulum.
  const hw = (u: number) => lerp(7.5, 11, Math.min(1, u / 0.55)) + 7 * Math.max(0, (u - 0.86) / 0.14) ** 2;
  const wall = tube(c, hw, 0, 1, 64);
  const lumen = tube(c, (u) => hw(u) * 0.42 + 2.5 * Math.max(0, (u - 0.86) / 0.14) ** 2, 0, 1, 64);
  const shine = tube(c, (u) => hw(u) * 0.72, 0, 0.98, 64);
  // Fimbriae: tapered fingers fanning out from the rim of the infundibulum, towards the ovary.
  const e = c(1);
  const [tx, ty] = [-e.ny, e.nx];
  const fim = [-1, -0.6, -0.2, 0.2, 0.6, 1].map((k, i) => {
    const r = hw(1) - 5.5;
    const base: Pt = [e.x + e.nx * r * k - tx * 5, e.y + e.ny * r * k - ty * 5];
    const ang = Math.atan2(ty, tx) - k * 0.75;
    const L = 24 + ((i * 5) % 3) * 5;
    const tip: Pt = [base[0] + Math.cos(ang) * L, base[1] + Math.sin(ang) * L];
    const bend = (i % 2 ? 1 : -1) * 4;
    const mid: Pt = [(base[0] + tip[0]) / 2 - Math.sin(ang) * bend, (base[1] + tip[1]) / 2 + Math.cos(ang) * bend];
    // From the tip (rounded cap) back to the rim, widening.
    return tube(bezier(tip, mid, mid, base), (u) => lerp(2.6, 4.6, u), 0, 1, 12, true);
  });
  const ov: Pt = [x(OV_R[0]), OV_R[1]];
  const fol: Pt = [x(FOLLICLE[0]), FOLLICLE[1]];
  return (
    <g>
      <Part id="obulutegia">
        <ellipse cx={ov[0]} cy={ov[1]} rx={54} ry={34} transform={`rotate(${s * -14} ${ov[0]} ${ov[1]})`} fill={C.ovary} stroke="rgba(60,30,20,0.55)" strokeWidth={1.4} />
        <ellipse cx={ov[0]} cy={ov[1]} rx={54} ry={34} transform={`rotate(${s * -14} ${ov[0]} ${ov[1]})`} fill="url(#p-stroma)" opacity={0.22} />
        <ellipse cx={ov[0]} cy={ov[1]} rx={54} ry={34} transform={`rotate(${s * -14} ${ov[0]} ${ov[1]})`} fill="url(#w1u-ov)" />
        {[[-24, -2, 2.4], [16, 14, 2.4], [-6, 18, 2.4], [30, -4, 2.4]].map(([dx, dy, r], i) => (
          <circle key={`p${i}`} cx={ov[0] + s * dx} cy={ov[1] + dy} r={r} fill="#fbe6d0" stroke="rgba(90,50,30,0.45)" strokeWidth={0.7} />
        ))}
        {[[-14, -10, 5], [8, 4, 8]].map(([dx, dy, r], i) => (
          <g key={`a${i}`}>
            <circle cx={ov[0] + s * dx} cy={ov[1] + dy} r={r} fill="#f4d9bd" stroke="rgba(90,50,30,0.5)" strokeWidth={0.9} />
            {r > 6 && <circle cx={ov[0] + s * dx + r * 0.15} cy={ov[1] + dy - r * 0.1} r={r * 0.62} fill="#fbf3d9" />}
            <circle cx={ov[0] + s * dx - r * 0.42} cy={ov[1] + dy + r * 0.3} r={r * 0.28} fill={C.oocyte} />
          </g>
        ))}
      </Part>
      {s === 1 && (
        <>
          <Part id="folikulu-heldua" show={1 - luteum}>
            <g opacity={1 - luteum}>
              <circle cx={fol[0]} cy={fol[1]} r={12} fill="#fbe6d0" stroke="rgba(90,50,30,0.6)" strokeWidth={1.1} />
              <circle cx={fol[0] + 1.5} cy={fol[1] - 1.5} r={8.5} fill="#f7efcf" opacity={1 - rupture} />
              <circle cx={fol[0] - 4} cy={fol[1] + 4} r={3.4} fill={C.oocyte} opacity={1 - rupture} />
            </g>
          </Part>
          <Part id="gorputz-luteoa" show={luteum}>
            <g opacity={luteum}>
              <path d={wavy(fol, 11, 0.8, 7, 0)} fill="#efc860" stroke="rgba(120,80,20,0.65)" strokeWidth={1} />
              <path d={wavy(fol, 4.5, 1, 5, 1.3)} fill="#8f4630" />
            </g>
          </Part>
        </>
      )}
      <Part id="finbriak">
        {fim.map((f, i) => (
          <g key={i}>
            <path d={f.d} fill={C.tube} />
            <path d={f.d} fill="none" stroke="rgba(60,10,30,0.4)" strokeWidth={0.9} />
          </g>
        ))}
      </Part>
      <Part id="umetoki-tronpa">
        <path d={wall.d} fill={C.tube} />
        <path d={lumen.d} fill="#3a1b2e" opacity={0.8} />
        <path d={s === 1 ? shine.left : shine.right} fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth={1.6} />
        <g fill="none" stroke="rgba(60,10,30,0.45)" strokeWidth={1}>
          <path d={wall.left} />
          <path d={wall.right} />
        </g>
      </Part>
    </g>
  );
}

/** One muscular region of the wall: muscle colour, fibres, and the light of the scene (top left). */
function Muscle({ d }: { d: string }) {
  return (
    <>
      <path d={d} fill={C.myometrium} />
      <path d={d} fill="url(#p-muscle)" opacity={0.3} />
      <path d={d} fill="url(#w1u-light)" />
    </>
  );
}

// Route through the cavity: from the right tubal opening, free in the cavity, to the wall near the fundus.
const CAV: Pt[] = [[CX + 92, 190], [CX + 58, 228], [CX + 28, 246], [CX + 10, 186]];

export function UterusParts({ t }: SceneProps) {
  const rupture = seg(t, 0.13, 0.16);
  const luteum = seg(t, 0.28, 0.4);
  // The conceptus, in step with the "aparatua" view.
  const mouth = RIGHT(1);
  let pos: Pt = [FOLLICLE[0] - 4, FOLLICLE[1] + 4];
  let uDone = 1; // how much of the tube (from its abdominal end) has been travelled
  if (t >= 0.14 && t < 0.64) {
    const k = seg(t, 0.14, 0.17);
    const u = piece(U_T, t);
    const q = RIGHT(Math.max(0, 1 - u));
    pos = t < 0.17 ? [lerp(pos[0], mouth.x, k), lerp(pos[1], mouth.y, k)] : [q.x, q.y];
    uDone = Math.max(0, 1 - u);
  } else if (t >= 0.64) {
    uDone = 0;
    const k = piece([[0.64, 0], [0.74, 1], [0.86, 2], [0.94, 3]], t);
    const i = Math.min(2, Math.floor(k));
    const f = k - i;
    pos = [lerp(CAV[i][0], CAV[i + 1][0], f), lerp(CAV[i][1], CAV[i + 1][1], f)];
  }
  const st = stageOf(t);
  const travelled = t >= 0.17 ? tube(RIGHT, () => 0.01, uDone, 1, 48).left : '';
  const cavK = seg(t, 0.64, 0.94);
  const implanted = seg(t, 0.92, 0.96);
  return (
    <g>
      <defs>
        <radialGradient id="w1u-light" gradientUnits="userSpaceOnUse" cx={CX - 70} cy={150} r={320}>
          <stop offset="0" stopColor="#fff" stopOpacity={0.16} />
          <stop offset="0.5" stopColor="#fff" stopOpacity={0} />
          <stop offset="1" stopColor="#1a0608" stopOpacity={0.34} />
        </radialGradient>
        <radialGradient id="w1u-ov" cx="36%" cy="30%" r="78%">
          <stop offset="0" stopColor="#fff" stopOpacity={0.24} />
          <stop offset="0.55" stopColor="#fff" stopOpacity={0} />
          <stop offset="1" stopColor="#2a140a" stopOpacity={0.3} />
        </radialGradient>
        <radialGradient id="w1u-glow">
          <stop offset="0" stopColor="#ffb86b" stopOpacity={0.7} />
          <stop offset="0.45" stopColor="#ffb86b" stopOpacity={0.2} />
          <stop offset="1" stopColor="#ffb86b" stopOpacity={0} />
        </radialGradient>
        <linearGradient id="w1u-cav" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#4a2236" />
          <stop offset="1" stopColor="#2c1222" />
        </linearGradient>
      </defs>

      {/* Vagina: context only (not one of the studied structures) */}
      <g pointerEvents="none">
        <path d={`M${CX - 122},452 C${CX - 122},540 ${CX - 100},590 ${CX - 100},618 L${CX + 100},618 C${CX + 100},590 ${CX + 122},540 ${CX + 122},452`} fill="rgba(200,120,140,0.16)" stroke="rgba(230,150,170,0.5)" strokeWidth={1.6} />
        <g fill="none" stroke="rgba(230,150,170,0.22)" strokeWidth={1.2}>
          {RUGAE.map((d, i) => (
            <path key={i} d={d} />
          ))}
        </g>
        <text x={CX} y={600} textAnchor="middle" fill="#c9a0aa" fontSize={11} letterSpacing="0.14em" style={{ textTransform: 'uppercase' }}>
          Bagina
        </text>
      </g>

      <Side s={1} rupture={rupture} luteum={luteum} />
      <Side s={-1} rupture={0} luteum={0} />

      {/* Soft shadow under the organ, for depth */}
      <path d={band(Y_TOP, Y_END)} fill="#000" opacity={0.45} transform="translate(5 9)" filter="url(#f-soft)" pointerEvents="none" />

      {/* Wall: the whole organ in muscle, then its three regions so each can be lit alone */}
      <Part id="miometrioa">
        <Muscle d={band(Y_TOP, Y_END)} />
      </Part>
      <Part id="umetokiaren-fundusa">
        <Muscle d={band(Y_TOP, Y_FUNDUS)} />
      </Part>
      <Part id="umetokiaren-gorputza">
        <Muscle d={band(Y_FUNDUS, Y_OS)} />
      </Part>
      <Part id="umetokiaren-lepoa">
        <Muscle d={band(Y_OS, Y_END)} />
      </Part>
      <g pointerEvents="none" stroke="rgba(255,255,255,0.32)" strokeDasharray="5 5" strokeWidth={1.1}>
        <line x1={CX - 178} x2={CX + 178} y1={Y_FUNDUS} y2={Y_FUNDUS} />
        <line x1={CX - 84} x2={CX + 84} y1={Y_OS} y2={Y_OS} />
      </g>
      <Part id="perimetrioa">
        <path d={band(Y_TOP, Y_END)} fill="none" stroke={C.perimetrium} strokeWidth={5} strokeLinejoin="round" />
        <path d={band(Y_TOP + 2, Y_END)} fill="none" stroke="rgba(255,255,255,0.28)" strokeWidth={1} strokeLinejoin="round" transform="translate(-1 -1)" />
      </Part>
      <Part id="endometrioa">
        <path d={CAVITY} fill="none" stroke={C.stroma} strokeWidth={40} strokeLinejoin="round" />
        <path d={CAVITY} fill="none" stroke="url(#p-stroma)" strokeWidth={40} strokeLinejoin="round" opacity={0.18} />
        <g fill="none" strokeLinecap="round" strokeLinejoin="round">
          {GLANDS.map((d, i) => (
            <g key={i}>
              <path d={`M${d}`} stroke="#fdf2f4" strokeWidth={3.4} />
              <path d={`M${d}`} stroke="#d27f95" strokeWidth={1.2} />
            </g>
          ))}
        </g>
        <path d={CAVITY} fill="none" stroke={C.epithelium} strokeWidth={3} strokeLinejoin="round" />
      </Part>
      <Part id="umetoki-barrunbea">
        <path d={CAVITY} fill="url(#w1u-cav)" />
        <path d={CANAL} fill="#3a1b2e" />
      </Part>

      {/* Route travelled so far (tube, then cavity) and the conceptus on its warm light */}
      <g pointerEvents="none" fill="none" stroke="#ffb86b" strokeLinecap="round" strokeLinejoin="round" opacity={0.55}>
        {travelled && <path d={travelled} strokeWidth={1.6} />}
        {cavK > 0.001 && <path d={`M${fmt(CAV)}`} pathLength={1} strokeDasharray={`${cavK} 1`} strokeWidth={1.4} />}
      </g>
      {t >= 0.1 && (
        <g pointerEvents="none" opacity={seg(t, 0.1, 0.14)}>
          <circle cx={pos[0]} cy={pos[1]} r={26 + 6 * implanted} fill="url(#w1u-glow)" />
        </g>
      )}
      {t >= 0.14 && (
        <Part id={st.id}>
          <circle cx={pos[0]} cy={pos[1]} r={5.6} fill={t < 0.74 ? '#f4c7b0' : '#8fd3a8'} stroke="#2a1410" strokeWidth={1.1} />
          <circle cx={pos[0] - 1.4} cy={pos[1] - 1.4} r={1.4} fill="#fff" opacity={0.7} />
        </Part>
      )}

      {/* Labels: tube and ovary and the wall layers on the left, the uterus itself on the right */}
      <Label id="umetoki-tronpa" x={170} y={120} ax={CX - (742 - CX)} ay={132} />
      <Label id="finbriak" x={170} y={236} ax={CX - (846 - CX)} ay={244} />
      <Label id="obulutegia" x={170} y={346} ax={CX - (790 - CX) + 30} ay={296} />
      <Label id="endometrioa" x={170} y={420} ax={CX - 70} ay={250} />
      <Label id="miometrioa" x={170} y={470} ax={CX - 118} ay={230} />
      <Label id="perimetrioa" x={170} y={520} ax={CX - 78} ay={330} />
      <Label id="umetokiaren-fundusa" x={730} y={34} ax={CX + 60} ay={138} align="start" />
      <Label id="umetoki-barrunbea" x={730} y={344} ax={CX + 18} ay={300} align="start" />
      <Label id="umetokiaren-gorputza" x={730} y={396} ax={CX + 100} ay={300} align="start" />
      <Label id="umetokiaren-lepoa" x={730} y={452} ax={CX + 56} ay={440} align="start" />

      <Note x={CX} y={630} tone="dim">Umetokia: fundusa · gorputza · lepoa (baginaren jarraian)</Note>
    </g>
  );
}
