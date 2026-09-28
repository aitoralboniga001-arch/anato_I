'use client';

import { Arrow, C, Flow, Label, Note, Part, clamp, lerp, seg, smoothPath, zoom, type Pt, type SceneProps } from '@/components/kit';
import { V, VilliDefs, f1, fingerD, place } from '@/components/scenes/week3-villi/common';

/**
 * Topic 6 — the placenta.
 * - Cotyledons (6:kotiledoiak:ebakia): apunteetako irudia (img_p06_0) — deziduaren orria goian, trenkadak
 *   behera, arteria kiribilak eta endometrio-zainak; korion orria behean, biloxka zuhaitzak gora, amniosa eta
 *   zilborresteko / korioneko odol-hodiak.
 * - PlacentaCirculation: the same section, zoomed on one cotyledon (jets, return, exchange).
 * - PlacentaFaces (img_p06_1): fetal face (amniosa, zilborrestea, orri korionikoa, odol-hodi korionikoak)
 *   and maternal face (kotiledoiak, dezidua basala).
 * - PlacentaFunctions: mother | barrier | fetus scheme with the notes' functions and harmful exchanges.
 */

const vis = (t: number, a: number, b = 2) => Math.min(a <= 0 ? 1 : seg(t, a, a + 0.03), 1 - seg(t, b - 0.03, b));
const hash = (n: number) => {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
};

// ——— Section geometry (maternal side up, fetal side down, as in the figure) ———
const X0 = 70;
const X1 = 900;
const WALL = 72;
const DEC = 102;
const SHELL = 138;
const IVS = 145;
const PLATE = 452;
const PLATE_H = 28;
const AMN = PLATE + PLATE_H;
const CAV = 540;
const SEPTA = [150, 370, 590, 810];
const COTS = [260, 480, 700];
const TRUNKS: { x: number; out: -1 | 1; k: number }[] = [
  { x: 108, out: -1, k: 0.75 },
  ...COTS.flatMap((c) => [
    { x: c - 62, out: -1 as const, k: 1 },
    { x: c + 62, out: 1 as const, k: 1 },
  ]),
  { x: 856, out: 1, k: 0.75 },
];
const CORD_X = 800;

type Seg = { a: Pt; b: Pt; w: number };

/** A stem (tertiary, anchoring) villus from the chorionic plate up to the shell, with free villi branching off it. */
function villusTree(x: number, seed: number, grow: number, out: -1 | 1) {
  const sway = (hash(seed) - 0.5) * 14;
  const at = (f: number): Pt => [x + Math.sin(f * 3 + seed) * 5 + sway * f, lerp(PLATE, IVS, f)];
  const trunk = [0, 0.25, 0.5, 0.75, 1].map(at);
  const stem: Seg[] = trunk.slice(0, -1).map((a, i) => ({ a, b: trunk[i + 1], w: lerp(12, 7.5, i / 3) }));
  const free: Seg[] = [];
  const tips: { p: Pt; r: number }[] = [];
  const LEVELS = [0.13, 0.22, 0.31, 0.4, 0.49, 0.58, 0.67, 0.76, 0.85];
  const twig = (from: Pt, ang: number, L: number, w: number, g: number, depth: number, key: number) => {
    const end: Pt = [from[0] + Math.sin(ang) * L, from[1] - Math.cos(ang) * L];
    free.push({ a: from, b: end, w });
    if (depth === 0) {
      tips.push({ p: end, r: 1 + 3.6 * g });
      return;
    }
    tips.push({ p: end, r: 1 + 4.2 * g });
    [0.45, 0.78].forEach((u, j) => {
      const m: Pt = [lerp(from[0], end[0], u), lerp(from[1], end[1], u)];
      const side = j % 2 ? 1 : -1;
      const a2 = ang + side * (0.6 + hash(key * 5 + j) * 0.5);
      twig(m, a2, L * (0.42 + hash(key * 3 + j) * 0.18), Math.max(3, w - 1.6), g, depth - 1, key * 7 + j + 1);
    });
  };
  LEVELS.forEach((f, i) => {
    const g = clamp(grow * 1.8 - i * 0.08, 0, 1);
    if (g <= 0.02) return;
    const dir = i >= 6 ? out : (i + seed) % 2 ? 1 : -1;
    const ang = (dir * (44 + hash(seed * 7 + i) * 30) * Math.PI) / 180;
    const L = (34 + hash(seed * 3 + i) * 24) * g * (i >= 6 ? 0.8 : 1);
    twig(at(f), ang, L, 5.4, g, 1, seed * 13 + i);
  });
  return { stem, free, tips, trunk };
}

const segD = (s: Seg[]) => s.map(({ a, b }) => `M${f1(a[0])},${f1(a[1])}L${f1(b[0])},${f1(b[1])}`).join('');

function Branches({ segs, tips, w = 0 }: { segs: Seg[]; tips?: { p: Pt; r: number }[]; w?: number }) {
  // Outer syncytiotrophoblast, then the mesoderm core (drawn per width class so joints stay smooth).
  const widths = [...new Set(segs.map((s) => s.w))];
  return (
    <g>
      {widths.map((wd) => (
        <path key={`o${wd}`} d={segD(segs.filter((s) => s.w === wd))} stroke={C.syncytio} strokeWidth={wd + 3.4 + w} strokeLinecap="round" fill="none" />
      ))}
      {tips?.map((tp, i) => <circle key={`to${i}`} cx={tp.p[0]} cy={tp.p[1]} r={tp.r + 1.7} fill={C.syncytio} />)}
      {widths.map((wd) => (
        <path key={`i${wd}`} d={segD(segs.filter((s) => s.w === wd))} stroke="#f2b08c" strokeWidth={wd + w * 0.5} strokeLinecap="round" fill="none" />
      ))}
      {tips?.map((tp, i) => <circle key={`ti${i}`} cx={tp.p[0]} cy={tp.p[1]} r={tp.r} fill="#f2b08c" />)}
    </g>
  );
}

/** Coiled spiral artery through the decidua, opening into the intervillous space at (x, IVS). */
const spiralD = (x: number) => {
  const pts: Pt[] = [];
  for (let i = 0; i <= 24; i++) {
    const y = lerp(WALL - 6, IVS, i / 24);
    pts.push([x + Math.sin(i * 1.3) * 7, y]);
  }
  return smoothPath(pts, false, 0.5);
};

interface SectionProps {
  /** Free-villus branching, 0..1. */
  branch: number;
  /** Decidual septa grown, 0..1. */
  septa: number;
  /** Cotyledon compartments tinted. */
  tint: number;
  /** Blood passing between cotyledons under the septa. */
  cross: number;
  /** Arterial jets into the intervillous space. */
  jets: number;
  /** Venous return to the endometrial veins. */
  veins: number;
  /** Structure id used for the umbilical vessels stub. */
  cordId: string;
  reduced: boolean;
  id: string;
}

function Section({ branch, septa, tint, cross, jets, veins, cordId, reduced, id }: SectionProps) {
  const trees = TRUNKS.map((tr, i) => villusTree(tr.x, i + 1, branch * tr.k, tr.out));
  const sLen = 188 * septa;
  const tintCols = ['rgba(255,190,120,1)', 'rgba(150,200,255,1)', 'rgba(255,150,200,1)'];
  return (
    <g>
      <defs>
        <linearGradient id={`${id}-fadeg`} x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="#000" />
          <stop offset="0.05" stopColor="#fff" />
          <stop offset="0.95" stopColor="#fff" />
          <stop offset="1" stopColor="#000" />
        </linearGradient>
        <mask id={`${id}-fade`} maskUnits="userSpaceOnUse" x={X0} y={0} width={X1 - X0} height={640}>
          <rect x={X0} y={0} width={X1 - X0} height={640} fill={`url(#${id}-fadeg)`} />
        </mask>
        <radialGradient id={`${id}-jet`} cx="0.5" cy="0.2" r="0.8">
          <stop offset="0" stopColor="#ff4d63" stopOpacity="0.95" />
          <stop offset="0.55" stopColor="#e0344f" stopOpacity="0.45" />
          <stop offset="1" stopColor="#e0344f" stopOpacity="0" />
        </radialGradient>
      </defs>
      <g mask={`url(#${id}-fade)`}>
        {/* Uterine wall and the decidual plate (maternal side) */}
        <rect x={X0} y={WALL} width={X1 - X0} height={DEC - WALL} fill="url(#p-muscle)" />
        <Part id="deziduaren-orria">
          <rect x={X0} y={DEC} width={X1 - X0} height={SHELL - DEC} fill="url(#p-decidua)" />
        </Part>

        {/* Intervillous space with maternal blood */}
        <Part id="biloxka-arteko-espazioa" quiet>
          <rect x={X0} y={IVS} width={X1 - X0} height={PLATE - IVS} fill="#3a0f19" />
          <rect x={X0} y={IVS} width={X1 - X0} height={PLATE - IVS} fill="url(#w3v-mblood)" opacity={0.32} />
        </Part>
        {tint > 0.02 && (
          <Part id="kotiledoiak" show={tint}>
            {COTS.map((c, i) => (
              <rect key={c} x={SEPTA[i] + 2} y={IVS} width={SEPTA[i + 1] - SEPTA[i] - 4} height={PLATE - IVS} fill={tintCols[i]} opacity={0.13} rx={10} />
            ))}
          </Part>
        )}

        {/* Outer cytotrophoblastic shell under the decidual plate, lining the septa too */}
        <Part id="kanpoko-zorro-zitotrofoblastikoa">
          <rect x={X0} y={SHELL} width={X1 - X0} height={IVS - SHELL} fill={C.cyto} />
        </Part>
        {sLen > 1 && (
          <Part id="deziduaren-trenkadak">
            {SEPTA.map((s) => (
              <g key={s} transform={place(s, IVS - 1, 180)}>
                <path d={fingerD(sLen, 13, 12)} fill="url(#p-decidua)" stroke={C.cyto} strokeWidth={3.2} />
              </g>
            ))}
          </Part>
        )}

        {/* Endometrial veins leave the intervillous space near each septum */}
        <Part id="endometrio-zainak">
          {SEPTA.flatMap((s) => [s - 30, s + 30]).map((x) => (
            <g key={x}>
              <rect x={x - 4} y={SHELL - 1} width={8} height={IVS - SHELL + 2} fill="#241016" />
              <path d={`M${x},${IVS} L${x},${WALL - 4}`} stroke="#2d4fb8" strokeWidth={7} strokeLinecap="round" />
              <path d={`M${x},${IVS} L${x},${WALL - 4}`} stroke="#5b86f0" strokeWidth={3.4} strokeLinecap="round" />
            </g>
          ))}
        </Part>

        {/* Villous trees: tertiary (stem, anchoring) villi and the free villi branching off them */}
        <Part id="biloxka-askea">
          {trees.map((tr, i) => (
            <Branches key={i} segs={tr.free} tips={tr.tips} />
          ))}
        </Part>
        <Part id="biloxka-tertziarioa">
          {trees.map((tr, i) => (
            <Branches key={i} segs={tr.stem} />
          ))}
          {trees.map((tr, i) => (
            <g key={`c${i}`} fill="none" strokeLinecap="round">
              <path d={smoothPath(tr.trunk.map(([x, y]) => [x - 2.4, y] as Pt), false)} stroke={V.deoxy} strokeWidth={1.6} />
              <path d={smoothPath(tr.trunk.map(([x, y]) => [x + 2.4, y] as Pt), false)} stroke={V.oxy} strokeWidth={1.6} />
            </g>
          ))}
        </Part>

        {/* Spiral arteries and their jets */}
        <Part id="arteria-espiralak">
          {COTS.map((c) => (
            <g key={c}>
              <rect x={c - 5} y={SHELL - 1} width={10} height={IVS - SHELL + 2} fill="#241016" />
              <path d={spiralD(c)} fill="none" stroke="#6b0f1c" strokeWidth={7.5} strokeLinecap="round" />
              <path d={spiralD(c)} fill="none" stroke="#ef4444" strokeWidth={4} strokeLinecap="round" />
              <ellipse cx={c} cy={IVS + 18 + 60 * jets} rx={10 + 26 * jets} ry={16 + 64 * jets} fill={`url(#${id}-jet)`} opacity={0.35 + 0.65 * jets} />
            </g>
          ))}
        </Part>

        {/* Chorionic plate with the chorionic vessels; amnion below */}
        <Part id="korion-plaka">
          <rect x={X0} y={PLATE} width={X1 - X0} height={PLATE_H} fill="url(#p-meso-extra)" />
          <rect x={X0} y={PLATE - 2} width={X1 - X0} height={3} fill={C.syncytio} />
        </Part>
        <Part id="korioneko-odol-hodiak">
          <path d={`M${X0},${PLATE + 9} L${CORD_X - 8},${PLATE + 9}`} stroke={V.deoxy} strokeWidth={4.5} strokeLinecap="round" />
          <path d={`M${X0},${PLATE + 19} L${CORD_X + 8},${PLATE + 19}`} stroke={V.oxy} strokeWidth={5.5} strokeLinecap="round" />
          {TRUNKS.map((tr) => (
            <g key={tr.x}>
              <path d={`M${tr.x - 2.4},${PLATE} L${tr.x - 2.4},${PLATE + 9}`} stroke={V.deoxy} strokeWidth={1.6} />
              <path d={`M${tr.x + 2.4},${PLATE} L${tr.x + 2.4},${PLATE + 19}`} stroke={V.oxy} strokeWidth={1.6} />
            </g>
          ))}
        </Part>
        <Part id="amniosa">
          <rect x={X0} y={AMN} width={X1 - X0} height={7} fill="#9fc3e6" opacity={0.85} />
        </Part>
        <rect x={X0} y={AMN + 7} width={X1 - X0} height={CAV - AMN - 7} fill="#121a2e" />
        <Part id={cordId}>
          <rect x={CORD_X - 22} y={AMN} width={44} height={CAV - AMN + 40} rx={10} fill="#e7c6d2" />
          <path d={`M${CORD_X - 10},${PLATE + 9} L${CORD_X - 10},${CAV + 40}`} stroke={V.deoxy} strokeWidth={5} />
          <path d={`M${CORD_X + 10},${PLATE + 9} L${CORD_X + 10},${CAV + 40}`} stroke={V.deoxy} strokeWidth={5} />
          <path d={`M${CORD_X},${PLATE + 19} L${CORD_X},${CAV + 40}`} stroke={V.oxy} strokeWidth={7} />
        </Part>

        {/* Blood flow: jets from the spiral arteries, return to the veins, and between cotyledons */}
        <g opacity={jets}>
          {COTS.flatMap((c) =>
            [-1, 1].map((d) => {
              const vx = c + d * 80;
              return <Flow key={`${c}${d}`} d={`M${c},${IVS + 4} C${c},${IVS + 170} ${vx + d * 10},${IVS + 170} ${vx},${IVS + 10} L${vx},${DEC}`} n={5} dur={3.6} r={2.6} color="#ff6b7d" reduced={reduced} />;
            }),
          )}
        </g>
        <g opacity={veins}>
          {SEPTA.flatMap((s) => [s - 30, s + 30]).map((x) => (
            <Flow key={x} d={`M${x},${IVS + 26} L${x},${WALL}`} n={3} dur={2.4} r={2.4} color="#7aa2ff" reduced={reduced} />
          ))}
        </g>
        <g opacity={cross}>
          {SEPTA.slice(1, 3).map((s) => (
            <g key={s}>
              <Flow d={`M${s - 84},${IVS + 150} Q${s},${IVS + sLen + 110} ${s + 84},${IVS + 150}`} n={5} dur={3} r={2.8} color="#ffd166" reduced={reduced} />
              <Arrow from={[s - 70, IVS + sLen + 10]} to={[s + 70, IVS + sLen + 10]} bend={-0.35} color="#ffd166" width={2.2} show={cross} />
            </g>
          ))}
        </g>
      </g>
    </g>
  );
}

// ——— 6:kotiledoiak:ebakia ———
export function Cotyledons({ t, reduced }: SceneProps) {
  const branch = 0.5 + 0.5 * seg(t, 0, 0.2);
  const septa = seg(t, 0.38, 0.54);
  const tint = vis(t, 0.56) * (0.75 + 0.25 * Math.sin(t * 40));
  const cross = vis(t, 0.72);
  const jets = 0.3 + 0.7 * seg(t, 0.86, 0.9);
  const veins = 0.25 + 0.75 * seg(t, 0.86, 0.92);
  const sLen = 188 * septa;
  return (
    <g>
      <VilliDefs />
      <Section id="w6cot" branch={branch} septa={septa} tint={tint} cross={cross} jets={jets} veins={veins} cordId="zilbor-hodiak" reduced={reduced} />

      {/* Top rows: maternal side */}
      <Label id="deziduaren-trenkadak" x={96} y={24} ax={370} ay={IVS + sLen * 0.5} show={vis(t, 0.38)} align="start" />
      <Label id="arteria-espiralak" x={400} y={24} ax={480} ay={SHELL - 14} show={vis(t, 0.18)} align="start" />
      <Label id="endometrio-zainak" x={690} y={24} ax={620} ay={DEC + 6} show={vis(t, 0.18)} align="start" />
      <Label id="kanpoko-zorro-zitotrofoblastikoa" x={96} y={50} ax={220} ay={SHELL + 3} show={vis(t, 0.18)} align="start" small />
      <Label id="deziduaren-orria" x={560} y={50} ax={540} ay={DEC + 18} show={vis(t, 0.18)} align="start" />

      {/* Bottom rows: fetal side */}
      <Label id="amniosa" x={96} y={566} ax={130} ay={AMN + 4} show={vis(t, 0)} align="start" />
      <Label id="korion-plaka" x={250} y={566} ax={300} ay={PLATE + 14} show={vis(t, 0)} align="start" />
      <Label id="korioneko-odol-hodiak" x={420} y={566} ax={450} ay={PLATE + 19} show={vis(t, 0.04)} align="start" />
      <Label id="zilbor-hodiak" x={690} y={566} ax={CORD_X - 10} ay={CAV - 4} show={vis(t, 0.04)} align="start" />
      <Label id="biloxka-tertziarioa" x={96} y={590} ax={TRUNKS[1].x + 3} ay={PLATE - 40} show={vis(t, 0)} align="start" small />
      <Label id="biloxka-askea" x={250} y={590} ax={TRUNKS[2].x + 40} ay={PLATE - 110} show={vis(t, 0)} align="start" small />
      <Label id="biloxka-arteko-espazioa" x={420} y={590} ax={560} ay={IVS + 220} show={vis(t, 0.72)} align="start" small />
      <Label id="kotiledoiak" x={690} y={590} ax={700} ay={IVS + 250} show={vis(t, 0.56)} align="start" />


      <Note x={500} y={618} show={vis(t, 0, 0.18)}>Korion plakatik biloxka tertziarioak; hauetatik biloxka askeak</Note>
      <Note x={500} y={618} show={vis(t, 0.18, 0.38)}>Biloxka tertziarioek deziduaren orriarekin kontaktatzen dute</Note>
      <Note x={500} y={618} tone="accent" show={vis(t, 0.38, 0.56)}>4.–5. hilabeteak: deziduaren trenkadak biloxka arteko guneetan</Note>
      <Note x={500} y={618} tone="accent" show={vis(t, 0.56, 0.72)}>Kotiledoiak: 16–20</Note>
      <Note x={500} y={618} show={vis(t, 0.72, 0.86)}>Trenkadak ez dira korion plakara heltzen: odola kotiledoi batetik bestera</Note>
      <Note x={500} y={618} tone="warn" show={vis(t, 0.86)}>Biloxka arteko odola amaren arteria kiribiletatik dator</Note>
    </g>
  );
}

// ——— Shared captions for the three views of 6:karena-aterminoa ———
function TermNotes({ t }: { t: number }) {
  return (
    <>
      <Note x={500} y={618} show={vis(t, 0, 0.1)}>Erditzean askatu; ~ordu erdi beranduago kanporatzen da</Note>
      <Note x={500} y={618} show={vis(t, 0.1, 0.2)}>Disko itxura: 15–20 cm · 3–4 cm · 500–600 g</Note>
      <Note x={500} y={618} tone="accent" show={vis(t, 0.2, 0.3)}>Fetuaren aurpegia: orri korionikoa, odol-hodi korionikoak, amniosa</Note>
      <Note x={500} y={618} tone="accent" show={vis(t, 0.3, 0.4)}>Amaren aurpegia: kotiledoiak, dezidua basalez inguratuta</Note>
      <Note x={500} y={618} show={vis(t, 0.4, 0.5)}>80–100 arteria espiral: lumen estua → presio handia</Note>
      <Note x={500} y={618} show={vis(t, 0.5, 0.6)}>Endometrio-zainetatik itzuli · 150–200 ml, 3–4 aldiz minutuko</Note>
      <Note x={500} y={618} show={vis(t, 0.6, 0.68)}>Umetokiaren azaleraren %20–30</Note>
      <Note x={500} y={618} tone="accent" show={vis(t, 0.68, 0.78)}>Gasak (difusioz) eta elikagaiak</Note>
      <Note x={500} y={618} tone="accent" show={vis(t, 0.78, 0.88)}>Hormonak eta IgG antigorputzak</Note>
      <Note x={500} y={618} tone="warn" show={vis(t, 0.88)}>Ez dira beti onuragarriak</Note>
    </>
  );
}

// ——— 6:karena-aterminoa:zirkulazioa ———
export function PlacentaCirculation({ t, reduced }: SceneProps) {
  const z = zoom(480, 300, 1.2, 500, 318);
  const jets = 0.25 + 0.75 * seg(t, 0.4, 0.46);
  const veins = 0.2 + 0.8 * seg(t, 0.5, 0.56);
  const branch = 0.82 + 0.18 * seg(t, 0.6, 0.68);
  const ex = vis(t, 0.68);
  const [lx] = z.at(SEPTA[1], 0);
  const [rx] = z.at(SEPTA[2], 0);
  const O2 = [
    [440, 300, 420, 330],
    [520, 250, 540, 275],
    [450, 380, 430, 405],
  ];
  return (
    <g>
      <VilliDefs />
      <g transform={z.transform}>
        <Section id="w6circ" branch={branch} septa={1} tint={0} cross={0} jets={jets} veins={veins} cordId="zilborrestea" reduced={reduced} />
        {/* Exchange across the free villi: O2 into the fetal blood, CO2 out */}
        <g opacity={ex}>
          {O2.map(([x0, y0, x1, y1], i) => (
            <g key={i}>
              <Arrow from={[x0, y0]} to={[x1, y1]} bend={0.1} color="#ff8a8a" width={2} head={7} progress={seg(t, 0.68, 0.72)} />
              <Arrow from={[x1 + 18, y1 + 16]} to={[x0 + 18, y0 + 16]} bend={0.1} color="#93b4ff" width={2} head={7} progress={seg(t, 0.7, 0.74)} />
            </g>
          ))}
        </g>
      </g>
      {/* Dim the neighbouring cotyledons so the central one reads as the subject */}
      <rect x={0} y={0} width={lx} height={640} fill="#0a0c12" opacity={0.55} />
      <rect x={rx} y={0} width={1000 - rx} height={640} fill="#0a0c12" opacity={0.55} />
      <text x={z.at(440, 300)[0] - 18} y={z.at(440, 300)[1] - 8} className="note note-accent" opacity={ex} textAnchor="end">
        O₂
      </text>
      <text x={z.at(540, 275)[0] + 26} y={z.at(540, 275)[1] + 10} className="note note-dim" opacity={ex}>
        CO₂
      </text>

      <Label id="arteria-espiralak" x={240} y={80} ax={z.at(480, 110)[0]} ay={z.at(480, 110)[1]} show={vis(t, 0)} align="end" />
      <Label id="dezidua-basala" x={240} y={150} ax={z.at(400, DEC + 16)[0]} ay={z.at(400, DEC + 16)[1]} show={vis(t, 0)} align="end" />
      <Label id="karenaren-zirkulazioa" x={240} y={240} ax={z.at(480, IVS + 120)[0]} ay={z.at(480, IVS + 120)[1]} show={vis(t, 0.4)} align="end" />
      <Label id="biloxka-askea" x={240} y={400} ax={z.at(TRUNKS[3].x - 30, 330)[0]} ay={z.at(TRUNKS[3].x - 30, 330)[1]} show={vis(t, 0)} align="end" />
      <Label id="korion-plaka" x={240} y={470} ax={z.at(430, PLATE + 12)[0]} ay={z.at(430, PLATE + 12)[1]} show={vis(t, 0)} align="end" />

      <Label id="endometrio-zainak" x={770} y={250} ax={z.at(SEPTA[2] - 30, 120)[0]} ay={z.at(SEPTA[2] - 30, 120)[1]} show={vis(t, 0.5)} align="start" />
      <Label id="deziduaren-trenkadak" x={770} y={380} ax={z.at(SEPTA[2], 230)[0]} ay={z.at(SEPTA[2], 230)[1]} show={vis(t, 0)} align="start" />
      <Label id="biloxka-arteko-espazioa" x={770} y={420} ax={z.at(540, 390)[0]} ay={z.at(540, 390)[1]} show={vis(t, 0.4)} align="start" small />
      <Label id="korioneko-odol-hodiak" x={770} y={470} ax={z.at(560, PLATE + 19)[0]} ay={z.at(560, PLATE + 19)[1]} show={vis(t, 0)} align="start" />
      <Label id="amniosa" x={770} y={520} ax={z.at(560, AMN + 4)[0]} ay={z.at(560, AMN + 4)[1]} show={vis(t, 0)} align="start" />

      <TermNotes t={t} />
    </g>
  );
}

// ——— 6:karena-aterminoa:aurpegiak ———
const RX = 132;
const RY = 76;
const TH = 18;

/** Maternal-face lobes (cotyledons): Voronoi cells of 18 jittered seeds, clipped to the unit disc. */
const LOBES: Pt[][] = (() => {
  const seeds: Pt[] = [[0.02, -0.03]];
  const ring = (r: number, n: number, off: number, key: number) => {
    for (let i = 0; i < n; i++) {
      const a = ((i + off + (hash(key + i) - 0.5) * 0.5) / n) * Math.PI * 2;
      const rr = r + (hash(key + 50 + i) - 0.5) * 0.12;
      seeds.push([Math.cos(a) * rr, Math.sin(a) * rr]);
    }
  };
  ring(0.43, 6, 0.1, 10);
  ring(0.8, 11, 0.4, 30);
  const disc: Pt[] = Array.from({ length: 48 }, (_, i) => [Math.cos((i / 48) * Math.PI * 2) * 0.98, Math.sin((i / 48) * Math.PI * 2) * 0.98]);
  // Keep the part of `poly` closer to seed p than to seed q (Sutherland–Hodgman against one half-plane).
  const clip = (poly: Pt[], p: Pt, q: Pt): Pt[] => {
    const nx = q[0] - p[0];
    const ny = q[1] - p[1];
    const c = (q[0] * q[0] + q[1] * q[1] - p[0] * p[0] - p[1] * p[1]) / 2;
    const inside = (v: Pt) => v[0] * nx + v[1] * ny <= c;
    const res: Pt[] = [];
    poly.forEach((cur, i) => {
      const prev = poly[(i + poly.length - 1) % poly.length];
      const ci = inside(cur);
      const pi = inside(prev);
      if (ci !== pi) {
        const dp = prev[0] * nx + prev[1] * ny - c;
        const dc = cur[0] * nx + cur[1] * ny - c;
        const u = dp / (dp - dc);
        res.push([lerp(prev[0], cur[0], u), lerp(prev[1], cur[1], u)]);
      }
      if (ci) res.push(cur);
    });
    return res;
  };
  return seeds.map((p) => seeds.reduce((poly, q) => (q === p ? poly : clip(poly, p, q)), disc));
})();

/** Shrink a lobe towards its centroid so grooves show between lobes. */
const inset = (pts: Pt[], k: number): Pt[] => {
  const cx = pts.reduce((s, p) => s + p[0], 0) / pts.length;
  const cy = pts.reduce((s, p) => s + p[1], 0) / pts.length;
  return pts.map(([x, y]) => [cx + (x - cx) * k, cy + (y - cy) * k]);
};

/** Chorionic vessels radiating from the cord insertion (fetal face), in disc coordinates. */
const VESSELS: Pt[][] = Array.from({ length: 8 }, (_, i) => {
  const a = (i / 8) * Math.PI * 2 + 0.3;
  const pts: Pt[] = [[-0.08, -0.06]];
  for (let j = 1; j <= 4; j++) {
    const r = (j / 4) * 0.9;
    const w = Math.sin(j * 1.7 + i) * 0.12;
    pts.push([-0.08 + Math.cos(a + w) * r, -0.06 + Math.sin(a + w) * r]);
  }
  return pts;
});
const TWIGS: Pt[][] = VESSELS.flatMap((v, i) => {
  const [x, y] = v[2];
  const a = Math.atan2(y + 0.06, x + 0.08) + (i % 2 ? 0.7 : -0.7);
  return [[v[2], [x + Math.cos(a) * 0.28, y + Math.sin(a) * 0.28]] as Pt[]];
});

const toDisc = (cx: number, cy: number) => (p: Pt): Pt => [cx + p[0] * RX, cy + p[1] * RY];

function FetalFace({ cx, cy, t }: { cx: number; cy: number; t: number }) {
  const m = toDisc(cx, cy);
  const ins = m([-0.08, -0.06]);
  const sway = Math.sin(t * 30) * 5;
  const cord: Pt[] = [ins, [ins[0] + 18, ins[1] - 50], [ins[0] - 14 + sway, ins[1] - 104], [ins[0] + 26 + sway, ins[1] - 150], [ins[0] + 6 + sway, ins[1] - 186]];
  const cordD = smoothPath(cord, false, 0.5);
  const frill: Pt[] = Array.from({ length: 40 }, (_, i) => {
    const a = (i / 40) * Math.PI * 2;
    const r = 1.08 + (i % 2 ? 0.07 : 0) + hash(i + 3) * 0.05;
    return m([Math.cos(a) * r, Math.sin(a) * r]);
  });
  return (
    <g>
      {/* Torn membranes (amnion + chorion leuna) around the edge */}
      <Part id="amniosa">
        <path d={smoothPath(frill, true, 0.3)} fill="#d9c7cf" opacity={0.45} stroke="rgba(255,255,255,0.35)" strokeWidth={1} />
      </Part>
      <path d={`M${cx - RX},${cy} A${RX} ${RY} 0 0 0 ${cx + RX},${cy} L${cx + RX},${cy + TH} A${RX} ${RY} 0 0 1 ${cx - RX},${cy + TH} Z`} fill="#6e1f33" />
      <Part id="korion-plaka">
        <ellipse cx={cx} cy={cy} rx={RX} ry={RY} fill="url(#w6f-fetal)" stroke="#4a1022" strokeWidth={1.2} />
        <ellipse cx={cx - 30} cy={cy - 26} rx={RX * 0.55} ry={RY * 0.3} fill="#fff" opacity={0.08} />
      </Part>
      <Part id="korioneko-odol-hodiak">
        {VESSELS.map((v, i) => (
          <g key={i} fill="none" strokeLinecap="round">
            <path d={smoothPath(v.map(m), false)} stroke="#6a0f24" strokeWidth={4.2} />
            <path d={smoothPath(v.map(m), false)} stroke="#3456c4" strokeWidth={1.6} transform="translate(1.5 -1.2)" />
            <path d={smoothPath(v.map(m), false)} stroke="#ff9aa8" strokeWidth={1.1} strokeDasharray="4 12" strokeDashoffset={-t * 900} opacity={0.8} />
          </g>
        ))}
        {TWIGS.map((v, i) => (
          <path key={`t${i}`} d={`M${f1(m(v[0])[0])},${f1(m(v[0])[1])} L${f1(m(v[1])[0])},${f1(m(v[1])[1])}`} stroke="#6a0f24" strokeWidth={2.4} strokeLinecap="round" />
        ))}
      </Part>
      <Part id="zilborrestea">
        <path d={cordD} fill="none" stroke="#5c2a3a" strokeWidth={19} strokeLinecap="round" />
        <path d={cordD} fill="none" stroke="#e7c6d2" strokeWidth={16} strokeLinecap="round" />
        <path d={cordD} fill="none" stroke="#b9637c" strokeWidth={16} strokeDasharray="3 9" opacity={0.55} />
      </Part>
    </g>
  );
}

function MaternalFace({ cx, cy }: { cx: number; cy: number }) {
  const m = toDisc(cx, cy);
  const tones = ['#9b2a40', '#8a2238', '#a3344a', '#932740'];
  const patch = LOBES[3];
  return (
    <g>
      <path d={`M${cx - RX},${cy} A${RX} ${RY} 0 0 0 ${cx + RX},${cy} L${cx + RX},${cy + TH} A${RX} ${RY} 0 0 1 ${cx - RX},${cy + TH} Z`} fill="#4d1422" />
      <Part id="dezidua-basala">
        <ellipse cx={cx} cy={cy} rx={RX} ry={RY} fill="#5a1626" stroke="#2c0a12" strokeWidth={1.2} />
      </Part>
      <Part id="kotiledoiak">
        {LOBES.map((l, i) => (
          <path key={i} d={smoothPath(inset(l, 0.9).map(m), true, 0.25)} fill={tones[i % tones.length]} stroke="rgba(255,190,200,0.18)" strokeWidth={0.8} />
        ))}
      </Part>
      {/* A piece of basal decidua torn away */}
      <path d={smoothPath(inset(patch, 0.6).map(m), true, 0.2)} fill="#d27a8c" opacity={0.85} stroke="#f4b6c2" strokeWidth={0.8} />
    </g>
  );
}

export function PlacentaFaces({ t }: SceneProps) {
  const detach = seg(t, 0.02, 0.09);
  const split = seg(t, 0.2, 0.3);
  const lx = lerp(500, 300, split);
  const flip = seg(t, 0.28, 0.4);
  const rxPos = lerp(500, 700, seg(t, 0.28, 0.36));
  const showRight = t > 0.28;
  const sq = flip < 0.5 ? 1 - flip * 2 : flip * 2 - 1;
  const dims = vis(t, 0.1, 0.24);
  const cy = 330;
  const bob = Math.sin(t * 20) * 2;
  return (
    <g>
      <defs>
        <radialGradient id="w6f-fetal" cx="0.42" cy="0.38" r="0.7">
          <stop offset="0" stopColor="#d27d95" />
          <stop offset="0.7" stopColor="#a4465f" />
          <stop offset="1" stopColor="#7b2a42" />
        </radialGradient>
      </defs>

      {/* Uterine wall the placenta peels away from */}
      <g opacity={1 - detach} transform={`translate(0 ${-70 * detach})`}>
        <path d={`M${lx - RX - 60},${cy - RY + 20} Q${lx},${cy - RY - 70} ${lx + RX + 60},${cy - RY + 20} L${lx + RX + 60},${cy - RY - 20} Q${lx},${cy - RY - 110} ${lx - RX - 60},${cy - RY - 20} Z`} fill="url(#p-muscle)" opacity={0.9} />
      </g>

      <Part id="fetuaren-aurpegia">
        <g transform={`translate(0 ${bob})`}>
          <FetalFace cx={lx} cy={cy} t={t} />
        </g>
      </Part>
      {showRight && (
        <Part id="amaren-aurpegia">
          <g transform={`translate(${rxPos} ${cy - bob}) scale(1 ${Math.max(sq, 0.02)}) translate(${-rxPos} ${-cy})`}>
            {flip < 0.5 ? <FetalFace cx={rxPos} cy={cy} t={t} /> : <MaternalFace cx={rxPos} cy={cy} />}
          </g>
        </Part>
      )}

      {/* Size of the term placenta */}
      <g opacity={dims} pointerEvents="none">
        <Arrow from={[lx - RX + 8, cy + RY + TH + 24]} to={[lx + RX - 8, cy + RY + TH + 24]} bend={0} color="#fbbf24" width={1.6} head={7} />
        <Arrow from={[lx + RX - 8, cy + RY + TH + 24]} to={[lx - RX + 8, cy + RY + TH + 24]} bend={0} color="#fbbf24" width={1.6} head={7} />
        <path d={`M${lx + RX + 16},${cy} L${lx + RX + 16},${cy + TH}`} stroke="#fbbf24" strokeWidth={1.6} />
      </g>
      <Note x={lx} y={cy + RY + TH + 44} show={dims} tone="accent">15–20 cm diametroa</Note>
      <Note x={lx + RX + 26} y={cy + TH / 2} align="start" show={dims} tone="accent">3–4 cm lodiera</Note>
      <Note x={lx} y={cy - RY - 34} show={dims} tone="accent">500–600 g</Note>

      <Label id="karena-aterminoa" x={850} y={250} ax={lx + RX * 0.7} ay={cy + 10} show={vis(t, 0, 0.28)} align="start" />
      <Label id="karena" x={850} y={250} ax={lx + RX * 0.7} ay={cy + 10} show={vis(t, 0.6, 0.68)} align="start" />
      <Label id="zilborrestea" x={240} y={80} ax={lx + 4} ay={cy - RY - 80} show={vis(t, 0.2)} align="end" />
      <Label id="fetuaren-aurpegia" x={240} y={160} ax={lx - RX * 0.55} ay={cy - RY * 0.5} show={vis(t, 0.2)} align="end" />
      <Label id="korion-plaka" x={240} y={230} ax={lx - RX * 0.35} ay={cy + RY * 0.1} show={vis(t, 0.2)} align="end" text="Orri korionikoa" />
      <Label id="korioneko-odol-hodiak" x={240} y={420} ax={lx - RX * 0.5} ay={cy + RY * 0.4} show={vis(t, 0.2)} align="end" />
      <Label id="amniosa" x={240} y={480} ax={lx - RX * 0.9} ay={cy + RY * 0.62} show={vis(t, 0.2)} align="end" />

      <Label id="amaren-aurpegia" x={850} y={250} ax={rxPos + RX * 0.6} ay={cy - RY * 0.5} show={vis(t, 0.36)} align="start" />
      <Label id="kotiledoiak" x={850} y={380} ax={rxPos + RX * 0.5} ay={cy + RY * 0.35} show={vis(t, 0.36)} align="start" />
      <Label id="dezidua-basala" x={850} y={440} ax={rxPos + RX * 0.9} ay={cy + TH + 4} show={vis(t, 0.36)} align="start" />
      <Note x={rxPos} y={cy + RY + TH + 30} show={vis(t, 0.36)}>Dezidua basala erauzia (zati bat)</Note>

      <TermNotes t={t} />
    </g>
  );
}

// ——— 6:karena-aterminoa:funtzioak ———
const MOM: [number, number] = [320, 500];
const BAR: [number, number] = [500, 562];
const FET: [number, number] = [562, 880];
const TOP = 96;
const BOT = 588;
const ROWS = { gas: 142, food: 222, horm: 304, igg: 386, rh: 470, bad: 548 };

function Mover({ y, dir, t, color, n = 3, speed = 8, glyph = 'dot', x0 = MOM[0] + 20, x1 = FET[1] - 20 }: { y: number; dir: 1 | -1; t: number; color: string; n?: number; speed?: number; glyph?: 'dot' | 'y' | 'x'; x0?: number; x1?: number }) {
  return (
    <g pointerEvents="none">
      {Array.from({ length: n }, (_, i) => {
        const u = (t * speed + i / n) % 1;
        const x = dir > 0 ? lerp(x0, x1, u) : lerp(x1, x0, u);
        const o = Math.min(1, u * 6, (1 - u) * 6);
        if (glyph === 'y')
          return <path key={i} d={`M${f1(x)},${y + 5} L${f1(x)},${y} L${f1(x - 5)},${y - 6} M${f1(x)},${y} L${f1(x + 5)},${y - 6}`} stroke={color} strokeWidth={2} fill="none" opacity={o} strokeLinecap="round" />;
        if (glyph === 'x')
          return <path key={i} d={`M${f1(x - 4)},${y - 4} L${f1(x + 4)},${y + 4} M${f1(x + 4)},${y - 4} L${f1(x - 4)},${y + 4}`} stroke={color} strokeWidth={2.2} opacity={o} strokeLinecap="round" />;
        return <circle key={i} cx={x} cy={y} r={3.4} fill={color} opacity={o} />;
      })}
    </g>
  );
}

export function PlacentaFunctions({ t, reduced }: SceneProps) {
  const g = vis(t, 0.68);
  const food = vis(t, 0.71);
  const horm = vis(t, 0.78);
  const igg = vis(t, 0.81);
  const rh = vis(t, 0.88);
  const bad = vis(t, 0.91);
  const tt = reduced ? 0 : t;
  return (
    <g>
      <VilliDefs />
      {/* Maternal blood | placental barrier | fetal blood */}
      <Part id="biloxka-arteko-espazioa" quiet>
        <rect x={MOM[0]} y={TOP} width={MOM[1] - MOM[0]} height={BOT - TOP} rx={14} fill="#3a0f19" />
        <rect x={MOM[0]} y={TOP} width={MOM[1] - MOM[0]} height={BOT - TOP} rx={14} fill="url(#w3v-mblood)" opacity={0.3} />
      </Part>
      <rect x={FET[0]} y={TOP} width={FET[1] - FET[0]} height={BOT - TOP} rx={14} fill="#131b36" />
      <Part id="biloxka-askea">
        <rect x={BAR[0]} y={TOP} width={18} height={BOT - TOP} fill={C.syncytio} />
        <rect x={BAR[0] + 18} y={TOP} width={32} height={BOT - TOP} fill="url(#p-meso-extra)" />
        <rect x={BAR[0] + 50} y={TOP} width={12} height={BOT - TOP} fill={V.endothelium} />
      </Part>
      {/* Ambient blood flow on both sides */}
      <Flow d={`M${MOM[0] + 40},${TOP + 4} L${MOM[0] + 40},${BOT - 4}`} n={6} dur={5} r={2.8} color="#ff6b7d" reduced={reduced} />
      <Flow d={`M${MOM[1] - 30},${TOP + 4} L${MOM[1] - 30},${BOT - 4}`} n={6} dur={6} r={2.8} color="#ff6b7d" reduced={reduced} />
      <Flow d={`M${FET[1] - 30},${BOT - 4} L${FET[1] - 30},${TOP + 4}`} n={6} dur={5.5} r={2.6} color="#7aa2ff" reduced={reduced} />

      <Note x={(MOM[0] + MOM[1]) / 2} y={76} tone="accent">Amaren odola</Note>
      <Note x={(BAR[0] + BAR[1]) / 2} y={76}>Karena muga</Note>
      <Note x={(FET[0] + FET[1]) / 2} y={76} tone="accent">Fetuaren odola</Note>

      {/* 1) Gases */}
      <g opacity={g}>
        <Arrow from={[MOM[0] + 24, ROWS.gas - 10]} to={[FET[1] - 24, ROWS.gas - 10]} bend={0} color="#ff8a8a" width={2.2} progress={seg(t, 0.68, 0.72)} />
        <Arrow from={[FET[1] - 24, ROWS.gas + 12]} to={[MOM[0] + 24, ROWS.gas + 12]} bend={0} color="#93b4ff" width={2.2} progress={seg(t, 0.69, 0.73)} />
        <Mover y={ROWS.gas - 10} dir={1} t={tt} color="#ff8a8a" />
        <Mover y={ROWS.gas + 12} dir={-1} t={tt} color="#93b4ff" />
      </g>
      <Note x={FET[0] + 20} y={ROWS.gas - 26} align="start" show={g} tone="accent">O₂ fetura</Note>
      <Note x={MOM[1] - 20} y={ROWS.gas + 32} align="end" show={g}>CO₂ eta CO amarengana</Note>
      <Label id="gasen-elkartrukea" x={300} y={ROWS.gas} show={g} align="end" />

      {/* 2) Nutrients and electrolytes */}
      <g opacity={food}>
        <Arrow from={[MOM[0] + 24, ROWS.food]} to={[FET[1] - 24, ROWS.food]} bend={0} color="#fbbf24" width={2.2} progress={seg(t, 0.71, 0.75)} />
        <Mover y={ROWS.food} dir={1} t={tt} color="#fbbf24" n={4} speed={6} />
      </g>
      <Note x={(MOM[0] + FET[1]) / 2} y={ROWS.food + 22} show={food} size={11.5}>aminoazidoak · karbohidratoak · gantz-azido askeak · bitaminak</Note>
      <Label id="elikagaien-elkartrukea" x={300} y={ROWS.food} show={food} align="end" small />

      {/* 3) Hormones made by the placenta */}
      <g opacity={horm}>
        <circle cx={BAR[0] + 9} cy={ROWS.horm} r={10 + 3 * Math.sin(t * 60)} fill="#c084fc" opacity={0.35} />
        <Arrow from={[BAR[0] + 4, ROWS.horm]} to={[MOM[0] + 24, ROWS.horm]} bend={0} color="#c084fc" width={2.2} progress={seg(t, 0.78, 0.82)} />
        <Mover y={ROWS.horm} dir={-1} t={tt} color="#c084fc" x0={MOM[0] + 20} x1={BAR[0]} speed={5} />
      </g>
      <Note x={(MOM[0] + FET[1]) / 2} y={ROWS.horm + 22} show={horm} size={11.5}>estrogenoa · progesterona · gonadotropina · hazkuntza hormonaren antzekoa · somatomamotropina</Note>
      <Label id="karenaren-hormonak" x={300} y={ROWS.horm} show={horm} align="end" />

      {/* 4) IgG antibodies from mother to fetus */}
      <g opacity={igg}>
        <Arrow from={[MOM[0] + 24, ROWS.igg]} to={[FET[1] - 24, ROWS.igg]} bend={0} color="#7ed492" width={2.2} progress={seg(t, 0.81, 0.85)} />
        <Mover y={ROWS.igg - 2} dir={1} t={tt} color="#7ed492" glyph="y" speed={5} />
      </g>
      <Note x={FET[0] + 20} y={ROWS.igg + 22} align="start" show={igg} size={11.5}>amarengandik fetura</Note>
      <Label id="igg-antigorputzak" x={300} y={ROWS.igg} show={igg} align="end" />

      {/* Not always beneficial */}
      <g opacity={rh}>
        <Arrow from={[MOM[0] + 24, ROWS.rh]} to={[FET[1] - 24, ROWS.rh]} bend={0} color="#ff7b72" width={2.2} progress={seg(t, 0.88, 0.92)} />
        <Mover y={ROWS.rh - 2} dir={1} t={tt} color="#ff7b72" glyph="y" speed={5} />
      </g>
      <Note x={(MOM[0] + FET[1]) / 2} y={ROWS.rh + 22} show={rh} tone="warn" size={11.5}>Rh antigorputzak: 2. haurdunaldian fetuaren globulu gorriak suntsitu</Note>
      <Label id="eritroblastosi-fetala" x={300} y={ROWS.rh} show={rh} align="end" />

      <g opacity={bad}>
        <Arrow from={[MOM[0] + 24, ROWS.bad]} to={[FET[1] - 24, ROWS.bad]} bend={0} color="#ff7b72" width={2.2} progress={seg(t, 0.91, 0.95)} />
        <Mover y={ROWS.bad} dir={1} t={tt} color="#ff7b72" glyph="x" speed={6} n={4} />
      </g>
      <Note x={(MOM[0] + FET[1]) / 2} y={ROWS.bad + 22} show={bad} tone="warn" size={11.5}>biruela · barizela · poliomielitisa · errubeola · drogak · alkohola</Note>
      <Label id="karena-zeharkatzen-duten-kalteak" x={300} y={ROWS.bad} show={bad} align="end" small />

      <TermNotes t={t} />
    </g>
  );
}
