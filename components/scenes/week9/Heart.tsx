'use client';

import { useId } from 'react';
import { Label, Note, Part, lerp, seg, smoothPath, type Pt, type SceneProps } from '@/components/kit';
import { Steps, SummaryTable, W, along, arc, f1 } from './common';
import { OriginsArt } from './Origins';

/**
 * 9:bihotz-muskulua — section 4. Origin on this topic's own section (stage 1) plus a small inset of the two heart
 * tubes fusing; the tissue on stage 1's panels; and an adult heart in frontal section (as seen from the front:
 * the patient's right on the left) with the conduction system — sinus node, internodal tracts, AV node, His bundle
 * and its two branches, Purkinje network under the endocardium. An impulse runs through it on a loop and lights
 * the atria, then the ventricles. The external (vegetative) fibres are green, as in the spinal cord.
 */

/* ---------- origin ---------- */

/** Inset: two endocardial tubes, each in its visceral layer, come together and fuse into one heart tube. */
function TwoTubes({ t }: { t: number }) {
  const k = seg(t, 0.02, 0.12);
  const x0 = 754;
  const y0 = 34;
  const cx = x0 + 86;
  const cy = y0 + 70;
  const dx = lerp(42, 0, k);
  const ring = (x: number, rx: number, ry: number) => smoothPath(arc(x, cy, rx, ry, 0, 360, 28), true, 0.3);
  return (
    <g>
      <rect x={x0} y={y0} width={172} height={136} rx={12} fill="#1d0f16" stroke="rgba(255,220,200,0.35)" strokeWidth={1.2} />
      <Note x={cx} y={y0 + 14} size={11} tone="dim">
        Lehenik: bi bihotz hodi → bat
      </Note>
      <Part id="errai-orria" quiet>
        {k < 0.95 ? (
          [-1, 1].map((s) => <path key={s} d={ring(cx + s * dx, 30, 26)} fill={W.visceral} stroke="#5a0a30" strokeWidth={1} />)
        ) : (
          <path d={ring(cx, 52, 30)} fill={W.visceral} stroke="#5a0a30" strokeWidth={1} />
        )}
      </Part>
      <Part id="bihotz-hodiak">
        {k < 0.95 ? (
          [-1, 1].map((s) => <path key={s} d={ring(cx + s * dx, 16, 13)} fill="#f9a8d4" stroke="#831843" strokeWidth={1.2} />)
        ) : (
          <path d={ring(cx, 26, 15)} fill="#f9a8d4" stroke="#831843" strokeWidth={1.2} />
        )}
      </Part>
    </g>
  );
}

/** 9:bihotz-muskulua `jatorria`. */
export function HeartOrigin({ t }: SceneProps) {
  return (
    <g>
      <OriginsArt t={1} />
      <TwoTubes t={t} />
      <Note x={500} y={22} size={12.5} tone="dim">
        4. astea · bihotzaren mailako zeharkako mozketa (1. urratseko irudia)
      </Note>
      <Steps t={t} steps={[[0, 'Bi bihotz hodien (endokardioaren) inguruko errai orritik: bihotzaren erdiko geruza, miokardioa']]} />
      <Label id="bihotz-hodiak" x={746} y={104} align="end" ax={840 - lerp(42, 0, seg(t, 0.02, 0.12)) - 16} ay={104} small />
    </g>
  );
}

/* ---------- adult heart, frontal (four-chamber) section ---------- */

/** Epicardial outline: right border = right atrium, inferior border = right ventricle, apex and left border = left
 * ventricle (apex down and to the patient's left, i.e. the viewer's right). */
const OUTER: Pt[] = [
  [352, 150],
  [318, 176],
  [298, 220],
  [292, 276],
  [300, 330],
  [318, 372],
  [352, 420],
  [412, 470],
  [482, 520],
  [560, 568],
  [620, 596],
  [652, 598],
  [680, 578],
  [702, 530],
  [714, 460],
  [708, 388],
  [690, 322],
  [668, 266],
  [640, 222],
  [606, 198],
  [560, 192],
  [520, 200],
  [470, 196],
  [420, 170],
];
/** Right heart: atrium + tricuspid orifice + crescent ventricle wrapped round the septum (thin walls). */
const RIGHT: Pt[] = [
  [336, 188],
  [392, 180],
  [436, 200],
  [456, 250],
  [452, 300],
  [442, 330],
  [462, 352],
  [480, 402],
  [506, 456],
  [536, 506],
  [556, 530],
  [528, 526],
  [478, 494],
  [420, 452],
  [362, 410],
  [324, 378],
  [316, 350],
  [320, 330],
  [310, 290],
  [310, 236],
];
/** Left heart: atrium + mitral orifice + the thick-walled ventricle that makes the apex. */
const LEFT: Pt[] = [
  [492, 214],
  [560, 206],
  [620, 222],
  [650, 258],
  [656, 302],
  [664, 342],
  [672, 402],
  [668, 462],
  [654, 512],
  [630, 552],
  [606, 544],
  [578, 494],
  [550, 434],
  [528, 378],
  [512, 340],
  [486, 300],
  [478, 252],
];
/** Atrioventricular plane (fibrous skeleton): only the His bundle crosses it. */
const PLANE: Pt[] = [
  [288, 338],
  [470, 326],
  [712, 302],
];
const ABOVE = 'M0,0 H1000 V302 L712,302 L470,326 L288,338 L0,338 Z';
const BELOW = 'M0,640 H1000 V302 L712,302 L470,326 L288,338 L0,338 Z';
const SVC: Pt[] = [
  [364, 18],
  [364, 100],
  [366, 172],
];
const AORTA: Pt[] = [
  [500, 300],
  [502, 200],
  [512, 116],
  [552, 66],
  [620, 54],
  [672, 78],
];
const PULM_V: Pt[][] = [
  [
    [760, 236],
    [700, 240],
    [652, 246],
  ],
  [
    [764, 282],
    [704, 280],
    [656, 276],
  ],
];
/** Valve leaflets (from the annulus into the ventricle) and the papillary muscles with their chordae. */
const LEAFLETS: [Pt, Pt][] = [
  [
    [320, 334],
    [338, 374],
  ],
  [
    [444, 332],
    [432, 372],
  ],
  [
    [512, 334],
    [538, 372],
  ],
  [
    [656, 306],
    [632, 352],
  ],
];
const PAPILLARY: { base: Pt[]; tip: Pt; chords: Pt[] }[] = [
  {
    base: [
      [396, 448],
      [428, 466],
    ],
    tip: [410, 410],
    chords: [
      [338, 374],
      [432, 372],
    ],
  },
  {
    base: [
      [634, 520],
      [662, 498],
    ],
    tip: [632, 444],
    chords: [
      [632, 352],
      [538, 372],
    ],
  },
];

const SA: Pt = [362, 168];
const AV: Pt = [470, 314];
const TRACTS: Pt[][] = [
  [SA, [414, 178], [450, 216], [458, 272], AV],
  [SA, [398, 232], [440, 286], AV],
  [SA, [322, 236], [334, 300], [404, 322], AV],
];
const BACHMANN: Pt[] = [SA, [414, 178], [470, 200], [520, 214], [566, 214]];
const HIS: Pt[] = [AV, [480, 334], [488, 356]];
const RBB: Pt[] = [
  [488, 356],
  [488, 400],
  [512, 454],
  [542, 502],
  [552, 522],
];
const LBB: Pt[] = [
  [488, 356],
  [528, 398],
  [552, 452],
  [578, 500],
  [608, 540],
];
const PURK: Pt[][] = [
  [
    [552, 522],
    [484, 486],
    [424, 444],
    [366, 402],
    [332, 374],
    [326, 352],
  ],
  [
    [608, 540],
    [638, 512],
    [656, 462],
    [660, 402],
    [652, 348],
  ],
  [
    [608, 540],
    [622, 556],
    [640, 560],
  ],
];
const TWIGS: Pt[][] = [
  [
    [424, 444],
    [416, 426],
  ],
  [
    [366, 402],
    [374, 386],
  ],
  [
    [484, 486],
    [492, 470],
  ],
  [
    [638, 512],
    [622, 506],
  ],
  [
    [656, 462],
    [640, 462],
  ],
  [
    [660, 402],
    [644, 404],
  ],
  [
    [500, 420],
    [514, 412],
  ],
  [
    [520, 470],
    [534, 462],
  ],
  [
    [548, 424],
    [536, 432],
  ],
  [
    [566, 474],
    [554, 482],
  ],
];
const VEG = '#86efac';
const CONDUCT = '#67e8f9';
const VAGUS: Pt[][] = [
  [
    [294, 24],
    [318, 96],
    [354, 160],
  ],
  [
    [424, 24],
    [440, 120],
    [462, 222],
    [470, 304],
  ],
];

function Path({ pts, color, w, glow = 0, opacity = 1 }: { pts: Pt[]; color: string; w: number; glow?: number; opacity?: number }) {
  const d = smoothPath(pts, false, 0.35);
  return (
    <g opacity={opacity}>
      {glow > 0.01 && <path d={d} fill="none" stroke="#fff" strokeWidth={w + 10} strokeLinecap="round" opacity={0.35 * glow} />}
      <path d={d} fill="none" stroke="#0b3b47" strokeWidth={w + 2.4} strokeLinecap="round" />
      <path d={d} fill="none" stroke={color} strokeWidth={w} strokeLinecap="round" />
    </g>
  );
}
function Bead({ pts, u }: { pts: Pt[]; u: number }) {
  if (u <= 0 || u >= 1) return null;
  const p = along(pts, u);
  return (
    <g>
      <circle cx={f1(p[0])} cy={f1(p[1])} r={10} fill="#fff" opacity={0.3} />
      <circle cx={f1(p[0])} cy={f1(p[1])} r={4.5} fill="#fff" />
    </g>
  );
}

/** 9:bihotz-muskulua `eroapena`. */
export function HeartConduction({ t }: SceneProps) {
  const uid = useId().replace(/:/g, '');
  const sys = seg(t, 0.32, 0.36);
  const nodes = seg(t, 0.46, 0.5);
  const lower = seg(t, 0.6, 0.64);
  const veg = seg(t, 0.84, 0.88);
  // One heartbeat every 0.05 of the stage: SA → atria (tracts) → AV (it waits) → His → branches → Purkinje → ventricles.
  const run = t >= 0.36;
  const u = run ? ((t - 0.36) / 0.05) % 1 : -1;
  const sa = run ? Math.max(0, 1 - Math.abs(u - 0.03) / 0.06) : 0;
  const atria = run ? Math.max(0, 1 - Math.abs(u - 0.22) / 0.14) : 0;
  const avGlow = run ? Math.max(0, 1 - Math.abs(u - 0.36) / 0.08) : 0;
  const vent = run ? Math.max(0, 1 - Math.abs(u - 0.72) / 0.16) : 0;
  const clipA = `${uid}-a`;
  const clipV = `${uid}-v`;
  const outer = smoothPath(OUTER, true, 0.35);
  const right = smoothPath(RIGHT, true, 0.3);
  const left = smoothPath(LEFT, true, 0.3);
  return (
    <g>
      <rect x={0} y={0} width={1000} height={640} fill="#120a10" />
      <defs>
        <clipPath id={clipA}>
          <path d={ABOVE} />
        </clipPath>
        <clipPath id={clipV}>
          <path d={BELOW} />
        </clipPath>
        <clipPath id={`${uid}-o`}>
          <path d={outer} />
        </clipPath>
      </defs>
      {/* Great vessels (context): superior vena cava into the right atrium, pulmonary veins into the left, aorta. */}
      <path d={smoothPath(SVC, false, 0.3)} fill="none" stroke="#28264f" strokeWidth={46} strokeLinecap="round" />
      <path d={smoothPath(SVC, false, 0.3)} fill="none" stroke="#3b3a78" strokeWidth={38} strokeLinecap="round" />
      {PULM_V.map((p, i) => (
        <g key={i}>
          <path d={smoothPath(p, false, 0.3)} fill="none" stroke="#5a1220" strokeWidth={24} strokeLinecap="round" />
          <path d={smoothPath(p, false, 0.3)} fill="none" stroke="#9b2335" strokeWidth={18} strokeLinecap="round" />
        </g>
      ))}
      <path d={smoothPath(AORTA, false, 0.3)} fill="none" stroke={W.aortaDeep} strokeWidth={46} strokeLinecap="round" />
      <path d={smoothPath(AORTA, false, 0.3)} fill="none" stroke={W.aorta} strokeWidth={38} strokeLinecap="round" />
      {/* Myocardium: the wall. It brightens when it contracts (atria, then ventricles); the chambers sit on top. */}
      <Part id="miokardioa">
        <path d={outer} fill={W.cardiac} stroke="#4a0a28" strokeWidth={2} />
        <g clipPath={`url(#${clipA})`}>
          <path d={outer} fill="#fff" opacity={0.3 * atria} />
        </g>
        <g clipPath={`url(#${clipV})`}>
          <path d={outer} fill="#fff" opacity={0.3 * vent} />
        </g>
      </Part>
      {/* Fibrous skeleton between atria and ventricles: drawn under the chambers, so it shows in the walls only. */}
      <path d={smoothPath(PLANE, false, 0.3)} fill="none" stroke="#f5e6d0" strokeWidth={7} opacity={0.75} clipPath={`url(#${uid}-o)`} />
      {/* Opaque floor under the chambers, so a dimmed chamber never shows the plane through it. */}
      <path d={right} fill="#120a10" />
      <path d={left} fill="#120a10" />
      <Part id="eskuineko-aurikula">
        <g clipPath={`url(#${clipA})`}>
          <path d={right} fill="#2b2350" />
        </g>
      </Part>
      <g clipPath={`url(#${clipA})`}>
        <path d={left} fill="#4a1220" />
      </g>
      <Part id="bentrikuluak">
        <g clipPath={`url(#${clipV})`}>
          <path d={right} fill="#2b2350" />
          <path d={left} fill="#4a1220" />
        </g>
      </Part>
      <Part id="endokardioa" quiet>
        <path d={right} fill="none" stroke="#f9a8d4" strokeWidth={2.4} />
        <path d={left} fill="none" stroke="#f9a8d4" strokeWidth={2.4} />
      </Part>
      {/* Valves and papillary muscles (context). */}
      <Part id="miokardioa">
        {PAPILLARY.map((p, i) => (
          <g key={i}>
            {p.chords.map((c, j) => (
              <path key={j} d={`M${p.tip[0]},${p.tip[1]} L${c[0]},${c[1]}`} stroke="#f5e6d0" strokeWidth={1.2} opacity={0.75} />
            ))}
            <path
              d={`M${p.base[0][0]},${p.base[0][1]} Q${p.tip[0] - 8},${p.tip[1] + 22} ${p.tip[0]},${p.tip[1]} Q${p.tip[0] + 8},${p.tip[1] + 22} ${p.base[1][0]},${p.base[1][1]} Z`}
              fill={W.cardiac}
              stroke="#f9a8d4"
              strokeWidth={1.6}
            />
          </g>
        ))}
      </Part>
      {LEAFLETS.map(([a, b], i) => (
        <path
          key={i}
          d={`M${a[0]},${a[1]} Q${(a[0] + b[0]) / 2 + 6},${(a[1] + b[1]) / 2} ${b[0]},${b[1]}`}
          fill="none"
          stroke="#f5e6d0"
          strokeWidth={4}
          strokeLinecap="round"
        />
      ))}

      {/* Conduction system: specialised muscle fibres (not nerves). */}
      <g opacity={sys}>
        <Part id="noduluen-arteko-traktuak" show={sys} groups={['eroapen-sistema']}>
          {[...TRACTS, BACHMANN].map((p, i) => (
            <Path key={i} pts={p} color={CONDUCT} w={2.6} glow={atria} opacity={0.9} />
          ))}
        </Part>
        <Part id="his-faszikulua" show={sys} groups={['eroapen-sistema']}>
          <Path pts={HIS} color={CONDUCT} w={6} />
          <Path pts={RBB} color={CONDUCT} w={4} />
          <Path pts={LBB} color={CONDUCT} w={4} />
        </Part>
        <Part id="purkinje-sarea" show={sys} groups={['eroapen-sistema']}>
          {[...PURK, ...TWIGS].map((p, i) => (
            <Path key={i} pts={p} color={CONDUCT} w={2.2} glow={vent} />
          ))}
        </Part>
        <Part id="nodulu-sinusala" show={sys} groups={['eroapen-sistema']}>
          <ellipse cx={SA[0]} cy={SA[1]} rx={20 + 6 * sa} ry={14 + 4 * sa} fill="#fff" opacity={0.3 * sa} />
          <ellipse cx={SA[0]} cy={SA[1]} rx={17} ry={12} fill={CONDUCT} stroke="#0b3b47" strokeWidth={2} />
        </Part>
        <Part id="nodulu-aurikobentrikularra" show={sys} groups={['eroapen-sistema']}>
          <ellipse cx={AV[0]} cy={AV[1]} rx={19 + 5 * avGlow} ry={13 + 4 * avGlow} fill="#fff" opacity={0.3 * avGlow} />
          <ellipse cx={AV[0]} cy={AV[1]} rx={16} ry={11} fill={CONDUCT} stroke="#0b3b47" strokeWidth={2} />
        </Part>
        <Part id="eroapen-sistema" show={sys} quiet>
          <circle cx={AV[0]} cy={AV[1]} r={1} fill="none" />
        </Part>
      </g>
      {/* The impulse. */}
      {run && (
        <g>
          {[...TRACTS, BACHMANN].map((p, i) => (
            <Bead key={i} pts={p} u={(u - 0.04) / 0.26} />
          ))}
          <Bead pts={HIS} u={(u - 0.42) / 0.06} />
          <Bead pts={RBB} u={(u - 0.48) / 0.1} />
          <Bead pts={LBB} u={(u - 0.48) / 0.1} />
          {PURK.slice(0, 2).map((p, i) => (
            <Bead key={i} pts={p} u={(u - 0.58) / 0.14} />
          ))}
        </g>
      )}
      {/* External innervation: vegetative fibres to the nodes. */}
      <Part id="nerbio-sistema-begetatiboa" show={veg}>
        {VAGUS.map((p, i) => {
          const d = smoothPath(p, false, 0.35);
          return (
            <g key={i} opacity={veg}>
              <path d={d} fill="none" stroke="#14532d" strokeWidth={5} strokeLinecap="round" />
              <path d={d} fill="none" stroke={VEG} strokeWidth={3} strokeLinecap="round" />
            </g>
          );
        })}
      </Part>

      {[
        ['Taupada bakoitzean:', 0],
        ['1 aurikulak uzkurtu', atria],
        ['2 AB noduluan itxaron', avGlow],
        ['3 bentrikuluak uzkurtu', vent],
      ].map(([s, g], i) => (
        <Note key={i} x={790} y={462 + i * 22} size={12.5} align="start" tone={i && (g as number) > 0.4 ? 'accent' : 'dim'} show={sys}>
          {s as string}
        </Note>
      ))}
      <Steps
        t={t}
        steps={[
          [0.32, 'Eroapen sistema: kinadak sortu eta bihotzeko zelula muskularretara eraman → uzkurdura'],
          [0.46, 'Eskuineko aurikulan nodulu sinusala (markapasoa) → traktuak → nodulu aurikobentrikularra (aurikularen behealdean)'],
          [0.6, 'His faszikulua → eskuineko eta ezkerreko adarrak → endokardio azpian Purkinje sarea'],
          [0.74, 'Noduluak ez dira nerbio sistema: zuntz muskular oso espezializatuak (barneko inerbazioa)'],
          [0.84, 'Kanpoko inerbazioa: nerbio sistema begetatiboa (sinpatikoa eta parasinpatikoa) eroapen sistemara'],
        ]}
      />

      <Label id="nodulu-sinusala" x={250} y={120} align="end" ax={SA[0] - 12} ay={SA[1] - 6} show={nodes} />
      <Label id="noduluen-arteko-traktuak" x={250} y={214} align="end" ax={along(TRACTS[2], 0.3)[0]} ay={along(TRACTS[2], 0.3)[1]} show={nodes} small />
      <Label id="eskuineko-aurikula" x={250} y={268} align="end" ax={330} ay={268} />
      <Label id="nodulu-aurikobentrikularra" x={250} y={348} align="end" ax={AV[0] - 12} ay={AV[1] + 2} show={nodes} />
      <Label id="his-faszikulua" x={250} y={388} align="end" ax={along(HIS, 0.75)[0] - 4} ay={along(HIS, 0.75)[1]} show={lower} />
      <Label id="bentrikuluak" x={250} y={432} align="end" ax={372} ay={392} />
      <Label id="purkinje-sarea" x={250} y={520} align="end" ax={along(PURK[0], 0.5)[0]} ay={along(PURK[0], 0.5)[1] + 2} show={lower} />
      <Label id="nerbio-sistema-begetatiboa" x={490} y={24} align="start" ax={along(VAGUS[1], 0.25)[0] + 4} ay={along(VAGUS[1], 0.25)[1]} show={veg} small />
      <Label id="eroapen-sistema" x={760} y={250} align="start" ax={along(LBB, 0.45)[0] + 4} ay={along(LBB, 0.45)[1]} show={sys} />
      <Label id="miokardioa" x={760} y={380} align="start" ax={694} ay={400} />
      <Label id="endokardioa" x={760} y={570} align="start" ax={669} ay={440} small />
    </g>
  );
}

/* ---------- the three muscle types ---------- */

/** 9:bihotz-muskulua `taula`: the topic's three muscle tissues side by side (origin, cells, innervation). */
export function MuscleSummary({ t }: SceneProps) {
  return (
    <g>
      <Note x={500} y={100} size={14} tone="accent">
        Hiru muskulu motak: jatorria, zelulak eta inerbazioa
      </Note>
      <SummaryTable
        t={t}
        x={30}
        y={140}
        widths={[150, 250, 250, 290]}
        rowH={64}
        head={['Muskulua', 'Jatorria', 'Mioblastoak fusionatzen?', 'Inerbazioa']}
        rows={[
          {
            at: 0.92,
            cells: [
              {
                id: 'muskulu-ildaskatuak',
                text: 'Ildaskatua',
                color: W.striated,
              },
              { text: 'Paraxiala: somitak, somitomeroak', color: W.paraxial },
              {
                id: 'zuntz-muskularrak',
                text: 'Bai: zuntz luzeak',
                color: W.striated,
              },
              { text: 'Nerbio kranialak edo espinalak', color: W.nerve },
            ],
          },
          {
            at: 0.925,
            cells: [
              { id: 'muskulu-leuna', text: 'Leuna', color: W.smooth },
              {
                id: 'errai-orria',
                text: 'Errai orria + salbuespenak',
                color: W.visceral,
              },
              { text: 'Ez: zelula bakarrak', color: W.smooth },
              {
                id: 'nerbio-sistema-begetatiboa',
                text: 'Begetatiboa',
                color: '#86efac',
              },
            ],
          },
          {
            at: 0.93,
            cells: [
              { id: 'miokardioa', text: 'Bihotzekoa', color: W.cardiac },
              {
                id: 'bihotz-hodiak',
                text: 'Bihotz hodien errai orria',
                color: W.visceral,
              },
              {
                id: 'disko-interkalarrak',
                text: 'Ez: disko interkalarrak',
                color: W.cardiac,
              },
              {
                id: 'eroapen-sistema',
                text: 'Eroapen sistema + begetatiboa',
                color: CONDUCT,
              },
            ],
          },
        ]}
      />
      <Note x={500} y={470} size={13} tone="dim" show={seg(t, 0.94, 0.97)}>
        Erraiak eta bihotza: kanpoko inerbazioa beti begetatiboa (sinpatikoa eta parasinpatikoa)
      </Note>
    </g>
  );
}
