'use client';

import { C, Label, Mark, Note, Part, lerp, mix, seg, type SceneProps } from '@/components/kit';
import { Hud, MiniTract, vis } from './common';

/**
 * 4.2 Ernalkuntza. A secondary oocyte (haploid, arrested in MII metaphase) surrounded by the
 * zona pellucida and corona radiata. A sperm crosses the three barriers in turn — corona
 * radiata (after capacitation), zona pellucida (acrosome reaction), plasma membrane fusion —
 * while the cortical reaction seals the zona against the others. The oocyte then completes
 * meiosis II (ovum + 2nd polar body); the two pronuclei meet and the zygote forms.
 */

const CX = 560;
const CY = 320;
const OO_R = 148; // cytoplasm / oolemma radius
const ZONA_OUT = OO_R + 18; // outer edge of the zona pellucida
const CORONA_R0 = OO_R + 18;
const CORONA_R1 = OO_R + 40;

const pt = (r: number, deg: number): [number, number] => {
  const a = (deg * Math.PI) / 180;
  return [CX + r * Math.cos(a), CY + r * Math.sin(a)];
};

// ---------------------------------------------------------------------------
// Corona radiata: radially arranged follicular cells, thinning out as the winner
// passes through and fading completely once the zygote forms.
function Corona({ o, gapDeg, gapOpen }: { o: number; gapDeg: number; gapOpen: number }) {
  if (o <= 0.02) return null;
  const cells: React.ReactElement[] = [];
  // Three loose layers of follicular cells resting on the zona, densest next to it.
  const RINGS = [
    { r: CORONA_R0 + 9, n: 36, rx: 10.5, ry: 8, a: 0.95 },
    { r: CORONA_R0 + 26, n: 40, rx: 10, ry: 7.5, a: 0.8 },
    { r: CORONA_R0 + 42, n: 34, rx: 9, ry: 7, a: 0.55 },
  ];
  RINGS.forEach((R, ring) => {
    for (let i = 0; i < R.n; i++) {
      const jit = Math.sin(i * 12.9898 + ring * 78.233) * 43758.5453;
      const j = jit - Math.floor(jit);
      const deg = ((i + ring * 0.37 + (j - 0.5) * 0.4) / R.n) * 360;
      const d = Math.abs(((deg - gapDeg + 540) % 360) - 180);
      const open = gapOpen > 0.02 && d < 22 ? 1 - gapOpen * (1 - d / 22) : 1;
      if (open < 0.05) continue;
      const [x, y] = pt(R.r + (j - 0.5) * 5, deg);
      cells.push(
        <g key={`${ring}-${i}`} opacity={R.a * open} transform={`rotate(${deg} ${x} ${y})`}>
          <ellipse cx={x} cy={y} rx={R.rx} ry={R.ry} fill={C.corona} stroke="rgba(40,20,70,0.5)" strokeWidth={1} />
          <ellipse cx={x + 1} cy={y} rx={3.4} ry={2.6} fill="rgba(50,24,90,0.55)" />
        </g>,
      );
    }
  });
  return <g opacity={o}>{cells}</g>;
}

// ---------------------------------------------------------------------------
// A single spermatozoon: oval head with acrosome cap, midpiece, sinusoidal tail.
interface SpermState {
  x: number;
  y: number;
  deg: number; // heading, degrees (points toward the oocyte)
  scale: number;
  headOpacity: number;
  tailOpacity: number;
  acrosome: number; // 1 = intact cap, 0 = burst / gone
  cloud: number; // 0..1 fading enzyme cloud at the acrosome tip
}

function Sperm({ s, t, seedPhase }: { s: SpermState; t: number; seedPhase: number }) {
  if (s.headOpacity <= 0.02 && s.tailOpacity <= 0.02) return null;
  const L = 62 * s.scale;
  const wig = t * 46 + seedPhase;
  const pts: [number, number][] = [];
  const n = 10;
  for (let i = 0; i <= n; i++) {
    const u = i / n;
    const amp = 6 * s.scale * u * (1.4 - 0.6 * u);
    pts.push([-u * L, Math.sin(wig + u * 5.6) * amp]);
  }
  const d = pts.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
  const headRx = 9.5 * s.scale;
  const headRy = 6 * s.scale;
  return (
    <g transform={`translate(${s.x} ${s.y}) rotate(${s.deg})`}>
      {s.tailOpacity > 0.02 && <path d={d} fill="none" stroke={C.sperm} strokeWidth={1.6 * s.scale} strokeLinecap="round" opacity={s.tailOpacity * 0.85} />}
      {s.tailOpacity > 0.02 && <circle cx={headRx * 0.6} cy={0} r={2.6 * s.scale} fill={C.sperm} opacity={s.tailOpacity} />}
      {s.headOpacity > 0.02 && (
        <g opacity={s.headOpacity}>
          <ellipse cx={0} cy={0} rx={headRx} ry={headRy} fill={C.sperm} stroke="rgba(10,20,40,0.55)" strokeWidth={0.8} />
          {s.acrosome > 0.02 && (
            <path
              d={`M${headRx * 0.15},${-headRy} A${headRx},${headRy} 0 0 1 ${headRx * 0.15},${headRy} Z`}
              fill={C.acrosome}
              opacity={0.85 * s.acrosome}
            />
          )}
        </g>
      )}
      {s.cloud > 0.02 && (
        <g opacity={s.cloud * 0.6}>
          <circle cx={headRx} cy={-3} r={5 + 6 * s.cloud} fill={C.acrosome} opacity={0.25} />
          <circle cx={headRx + 4} cy={4} r={4 + 5 * s.cloud} fill={C.acrosome} opacity={0.22} />
        </g>
      )}
    </g>
  );
}

// ---------------------------------------------------------------------------
// Six deterministic approach angles: one winner (upper-left) and five that stall at the zona
// and fade once the cortical reaction seals it (or, for the last two, never even reach it).
const WINNER_DEG = 208;
const LOSERS: { deg: number; reach: number; delay: number }[] = [
  { deg: 55, reach: ZONA_OUT + 6, delay: 0 },
  { deg: 100, reach: ZONA_OUT + 4, delay: 0.03 },
  { deg: 150, reach: CORONA_R1 + 14, delay: 0.1 },
  { deg: 285, reach: ZONA_OUT + 8, delay: 0.05 },
  { deg: 18, reach: CORONA_R1 + 10, delay: 0.14 },
];

function winnerState(t: number, seedPhase: number): { s: SpermState; enterR: number } {
  const rFar = 300;
  const rCoronaEdge = CORONA_R1 + 12;
  const rZonaEdge = ZONA_OUT + 2;
  const rOolemma = OO_R + 2;
  const rInside = OO_R * 0.55;
  let r: number;
  if (t < 0.14) r = lerp(rFar, rCoronaEdge, seg(t, 0, 0.14));
  else if (t < 0.3) r = lerp(rCoronaEdge, rZonaEdge, seg(t, 0.14, 0.3));
  else if (t < 0.46) r = lerp(rZonaEdge, rOolemma, seg(t, 0.3, 0.46));
  else if (t < 0.58) r = rOolemma;
  else r = lerp(rOolemma, rInside, seg(t, 0.58, 0.66));
  const [x, y] = pt(r, WINNER_DEG);
  const headOpacity = 1 - seg(t, 0.66, 0.74);
  const tailOpacity = (1 - seg(t, 0.56, 0.64)) * (1 - vis(t, -1, 0) * 0);
  const acrosome = 1 - seg(t, 0.28, 0.32);
  const cloud = seg(t, 0.29, 0.34) * (1 - seg(t, 0.4, 0.5));
  return {
    s: { x, y, deg: WINNER_DEG + 180, scale: 1.05, headOpacity: Math.max(0, headOpacity), tailOpacity: Math.max(0, tailOpacity), acrosome, cloud },
    enterR: rInside,
  };
}

function loserState(l: (typeof LOSERS)[number], t: number): SpermState {
  const tt = Math.max(0, t - l.delay);
  const rFar = 300;
  const arrive = seg(tt, 0, 0.32);
  const r = lerp(rFar, l.reach, arrive);
  const [x, y] = pt(r, l.deg);
  // Stall at the barrier, then fade once the cortical reaction seals the zona.
  const stalled = seg(tt, 0.3, 0.34);
  const fade = 1 - seg(t, 0.46, 0.56);
  return { x, y, deg: l.deg + 180, scale: 0.92, headOpacity: fade, tailOpacity: fade, acrosome: 1 - 0.3 * stalled, cloud: 0 };
}

// ---------------------------------------------------------------------------

export function Fertilization({ t }: SceneProps) {
  const coronaO = 1 - seg(t, 0.86, 0.96);
  const { s: winner, enterR } = winnerState(t, 0);

  // Cortical reaction: granules pop just under the oolemma and the zona tints/thickens.
  const cortical = seg(t, 0.44, 0.54);
  const zonaSealed = seg(t, 0.44, 0.6);

  // MII spindle (metaphase-arrested) near the upper edge, resolving into anaphase and the
  // second polar body as meiosis II completes.
  const spindleFade = 1 - seg(t, 0.64, 0.7);
  const spindleSplit = seg(t, 0.6, 0.68);
  const spindlePos = pt(OO_R * 0.62, -80);

  // Polar bodies in the perivitelline space (first one present from t=0; second pinches off at .70).
  const polar1 = pt(ZONA_OUT - 9, -60);
  const polar2At = seg(t, 0.66, 0.74);
  const polar2 = [lerp(spindlePos[0], pt(ZONA_OUT - 9, -46)[0], polar2At), lerp(spindlePos[1], pt(ZONA_OUT - 9, -46)[1], polar2At)] as const;
  const polar2O = seg(t, 0.64, 0.7);

  // Pronuclei: the male one starts where the sperm head entered, the female one near the
  // (now resolved) spindle; both migrate to the centre and touch by .82.
  const pronO = seg(t, 0.66, 0.74);
  const meet = seg(t, 0.7, 0.82);
  const mStart = pt(enterR, WINNER_DEG);
  const fStart = pt(OO_R * 0.5, -80);
  const mPos = [lerp(mStart[0], CX - 12, meet), lerp(mStart[1], CY, meet)] as const;
  const fPos = [lerp(fStart[0], CX + 12, meet), lerp(fStart[1], CY, meet)] as const;
  const touch = seg(t, 0.8, 0.86);
  const proSep = 1 - touch * 0.75;

  // Zygote: pronuclear membranes fade into a single nucleus once DNA has replicated.
  const zygoteFade = seg(t, 0.88, 0.96);

  return (
    <g>
      <defs>
        <radialGradient id="w1f-cyto" cx="38%" cy="32%" r="75%">
          <stop offset="0" stopColor="#fbe0d9" />
          <stop offset="1" stopColor={C.oocyte} />
        </radialGradient>
      </defs>

      <Part id="koroa-erradiatua" show={coronaO > 0.02 ? 1 : 0}>
        <Corona o={coronaO * (1 - cortical * 0.15)} gapDeg={WINNER_DEG} gapOpen={seg(t, 0.12, 0.28)} />
      </Part>

      {/* Zona pellucida: thickens/tints slightly once the cortical reaction seals it. */}
      <Part id="mintz-peluzidoa">
        <circle cx={CX} cy={CY} r={OO_R + 9} fill="none" stroke={C.zona} strokeOpacity={0.55} strokeWidth={lerp(18, 21, zonaSealed)} />
        <circle cx={CX} cy={CY} r={OO_R + 18} fill="none" stroke="#b64f6b" strokeWidth={1.6} />
        <circle cx={CX} cy={CY} r={OO_R} fill="none" stroke="#b64f6b" strokeWidth={1} strokeOpacity={0.7} />
        <circle cx={CX} cy={CY} r={OO_R + 9} fill="none" stroke="#7a2f42" strokeOpacity={0.35 * zonaSealed} strokeWidth={3} />
      </Part>

      {/* Cortical granules, released just under the oolemma. */}
      {cortical > 0.02 && cortical < 1 && (
        <g opacity={1 - seg(cortical, 0.85, 1)}>
          {Array.from({ length: 14 }, (_, i) => {
            const deg = (i / 14) * 360;
            const rr = lerp(OO_R - 10, OO_R + 6, cortical);
            const [x, y] = pt(rr, deg);
            return <circle key={i} cx={x} cy={y} r={2.2} fill="#fde68a" opacity={0.8} />;
          })}
        </g>
      )}

      {/* Cytoplasm / oocyte–ovum–zygote body. */}
      <Part id={t < 0.7 ? 'obozito-sekundarioa' : t < 0.92 ? 'obulua' : 'zigotoa'}>
        <circle cx={CX} cy={CY} r={OO_R} fill="url(#w1f-cyto)" stroke="rgba(140,60,70,0.4)" strokeWidth={1.2} />
      </Part>

      {/* MII spindle: metaphase plate near the edge, splitting into anaphase as meiosis II completes. */}
      {spindleFade > 0.02 && (
        <g transform={`translate(${spindlePos[0]} ${spindlePos[1]})`} opacity={spindleFade}>
          <line x1={-16} y1={0} x2={16} y2={0} stroke={C.oocyteNucleus} strokeWidth={1} opacity={0.6} />
          {[-1, 1].map((sg) => (
            <g key={sg} transform={`translate(${sg * 8 * spindleSplit} 0)`}>
              {[-6, -2, 2, 6].map((o, i) => (
                <line key={i} x1={o - 2.4} y1={-1.5} x2={o + 2.4} y2={1.5} stroke={C.oocyteNucleus} strokeWidth={2} strokeLinecap="round" />
              ))}
            </g>
          ))}
        </g>
      )}

      {/* Polar bodies. */}
      <Part id="gorpuskulu-polarrak">
        <circle cx={polar1[0]} cy={polar1[1]} r={8.5} fill={C.oocyte} stroke="rgba(140,60,70,0.5)" strokeWidth={1} opacity={0.9} />
        {polar2O > 0.02 && <circle cx={polar2[0]} cy={polar2[1]} r={7.5} fill={C.oocyte} stroke="rgba(140,60,70,0.5)" strokeWidth={1} opacity={0.9 * polar2O} />}
      </Part>

      {/* Pronuclei. */}
      {pronO > 0.02 && (
        <Part id="pronukleoak">
          <g opacity={pronO}>
            <circle cx={fPos[0] - 6 * proSep} cy={fPos[1] - 3 * proSep} r={19} fill={C.pronucleusF} fillOpacity={touch > 0.5 ? 0.4 : 0.55} stroke="rgba(30,20,50,0.6)" strokeWidth={1.2} />
            <circle cx={mPos[0] + 6 * proSep} cy={mPos[1] + 3 * proSep} r={19} fill={C.pronucleusM} fillOpacity={touch > 0.5 ? 0.4 : 0.55} stroke="rgba(30,20,50,0.6)" strokeWidth={1.2} />
          </g>
        </Part>
      )}

      {/* Zygote nucleus: pronuclei merge once DNA has replicated. */}
      {zygoteFade > 0.02 && (
        <circle cx={CX} cy={CY} r={20} fill={mix(C.pronucleusF, C.pronucleusM, 0.5)} fillOpacity={0.5 * zygoteFade} stroke="rgba(30,20,50,0.6)" strokeWidth={1.2} />
      )}

      {/* Spermatozoa. */}
      <Part id="espermatozoidea">
        {LOSERS.map((l, i) => (
          <Sperm key={i} s={loserState(l, t)} t={t} seedPhase={i * 1.7} />
        ))}
        <Sperm s={winner} t={t} seedPhase={5.1} />
      </Part>

      {/* Marks for what the steps name but that has no outline: the acrosome, gaitze, the acrosome reaction, the cortical reaction */}
      <Mark id="akrosoma" x={winner.x} y={winner.y} rx={13} show={vis(t, 0.02, 0.46) * winner.headOpacity} />
      <Mark id="kapazitazioa" x={winner.x} y={winner.y} rx={27} color="#7dd3fc" show={vis(t, 0.1, 0.26)} />
      <Mark id="akrosoma-erreakzioa" x={winner.x + Math.cos(((WINNER_DEG + 180) * Math.PI) / 180) * 16} y={winner.y + Math.sin(((WINNER_DEG + 180) * Math.PI) / 180) * 16} rx={17} show={vis(t, 0.28, 0.44)} />
      <Mark id="erreakzio-kortikala" show={vis(t, 0.42, 0.58)}>
        <circle className="mark-ring" cx={CX} cy={CY} r={OO_R - 6} fill="none" stroke="#fde68a" strokeWidth={3} strokeDasharray="5 4" />
      </Mark>

      {/* Labels — side gutters only. */}
      <Label id="koroa-erradiatua" x={210} y={150} ax={pt(CORONA_R1 - 4, 235)[0]} ay={pt(CORONA_R1 - 4, 235)[1]} show={coronaO * vis(t, 0, 1)} />
      <Label id="mintz-peluzidoa" x={210} y={470} ax={pt(OO_R + 9, 162)[0]} ay={pt(OO_R + 9, 162)[1]} />
      <Label id="obozito-sekundarioa" x={790} y={150} align="start" ax={CX + OO_R * 0.5} ay={CY - OO_R * 0.5} show={vis(t, 0, 0.62)} />
      <Label id="obulua" x={790} y={150} align="start" ax={CX + OO_R * 0.5} ay={CY - OO_R * 0.5} show={vis(t, 0.66, 0.9)} />
      <Label id="zigotoa" x={790} y={150} align="start" ax={CX + OO_R * 0.5} ay={CY - OO_R * 0.5} show={vis(t, 0.92)} />
      <Label id="gorpuskulu-polarrak" x={790} y={210} align="start" ax={polar1[0]} ay={polar1[1]} show={vis(t, 0.02, 0.64)} />

      <Label id="kapazitazioa" x={210} y={290} ax={pt(CORONA_R1 + 6, WINNER_DEG - 14)[0]} ay={pt(CORONA_R1 + 6, WINNER_DEG - 14)[1]} show={vis(t, 0.1, 0.26)} />
      <Label id="akrosoma" x={210} y={250} ax={winner.x} ay={winner.y} show={vis(t, 0.02, 0.46)} />
      <Label id="akrosoma-erreakzioa" x={210} y={330} ax={winner.x} ay={winner.y} show={vis(t, 0.28, 0.44)} />
      <Label id="erreakzio-kortikala" x={790} y={470} align="start" ax={pt(OO_R - 2, -20)[0]} ay={pt(OO_R - 2, -20)[1]} show={vis(t, 0.42, 0.58)} />
      <Label id="espermatozoidea" x={210} y={200} ax={winner.x - 22} ay={winner.y - 4} show={vis(t, 0.02, 0.44)} />
      <Label id="pronukleoak" x={790} y={280} align="start" ax={CX + 10} ay={CY} show={vis(t, 0.68, 0.9)} />
      <Label id="ernalkuntza" x={790} y={90} align="start" ax={CX} ay={CY - OO_R - 10} show={vis(t, 0.56, 0.62)} />

      <Note x={560} y={600} tone="accent" show={vis(t, 0, 0.14)}>
        Obozito sekundarioa: haploidea, II. zatiketa meiotikoaren metafasean etenda
      </Note>
      <Note x={560} y={600} tone="accent" show={vis(t, 0.14, 0.3)}>
        1. fasea — koroa erradiatua zeharkatzea (gaitzearen ondoren)
      </Note>
      <Note x={560} y={600} tone="accent" show={vis(t, 0.3, 0.46)}>
        2. fasea — mintz peluzidoa zeharkatzea: akrosoma erreakzioa
      </Note>
      <Note x={560} y={600} tone="accent" show={vis(t, 0.46, 0.58)}>
        Erreakzio kortikala: mintz peluzidoa iragazgaitza bihurtzen da
      </Note>
      <Note x={560} y={600} tone="accent" show={vis(t, 0.58, 0.7)}>
        3. fasea — mintz plasmatikoen fusioa
      </Note>
      <Note x={560} y={600} tone="accent" show={vis(t, 0.7, 0.82)}>
        II. zatiketa meiotikoa amaitu da: obulua + 2. gorpuskulu polarra
      </Note>
      <Note x={560} y={600} tone="accent" show={vis(t, 0.82, 0.92)}>
        Pronukleoak elkartu eta DNA bikoizten da
      </Note>
      <Note x={560} y={600} tone="accent" show={vis(t, 0.92)}>
        Zigotoa: mintz peluzidoz inguratua
      </Note>

      <MiniTract day={0.24} />
      <Hud
        value="0."
        unit=" eguna"
        caption="Ernalkuntza"
        second={['Fasea', t < 0.14 ? '0' : t < 0.3 ? '1' : t < 0.58 ? '2' : t < 0.7 ? '3' : '—', t < 0.7 ? '/3' : '']}
      />
    </g>
  );
}
