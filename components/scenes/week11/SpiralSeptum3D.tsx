'use client';

import { Note, Part, lerp, seg, type SceneProps } from '@/components/kit';
import { mix3, type Camera3, type V3 } from '@/lib/three-d/math';
import { ModelView, cameraAt, orbit, type CalloutSpec } from '@/components/scenes/week10/Heart3D';
import { Steps, vis } from './common';
import { CN0, canalModel, type CanalState } from './canal3d';
import { LEVELS, TR0, U_ROOTS, type TruncusState } from './truncus3d';

/**
 * Stages 10–11 of topic 11 (notes 5.2), on the heart of stages 8–9 (canal3d.ts: the ventricles, the conus),
 * with the spiral truncus of truncus3d.ts on the conus:
 * - Stage 10: two ridges grow up the truncus wall, winding round it, and fuse into the aorticopulmonary
 *   septum. The truncus is then cut across at the notes' three levels in turn, the camera looking down
 *   into each (the front at the bottom, the embryo's right on your left), while a strip of three small
 *   sections fills in at the top right: proximal transverse (pulmonary in front), middle front to back (aorta
 *   on the right), distal transverse (aorta in front). Then the septum is shown continuous with the conus
 *   septum, the two vessels apart twisted round each other, and the notes' summary as a table.
 * - Stage 11: at each vessel's root three swellings (tubercles) grow and are hollowed from above into the
 *   three pocket-shaped cusps (aortic: posterior + two lateral; pulmonary: anterior + two lateral); the
 *   coronary arteries come out of the aorta's right and left sinuses.
 */

const CONT = 'erretena-11';
const RIGHT: [number, number] = [262, 505];

/** Stages 8–9 finished, as these stages keep them: the valves, the turned heart, both septa, the conus divided. */
const DONE: Partial<CanalState> = {
  flatten: 1, shift: 1, cushions: 1, fuse: 1, swell: 1, leaflets: 1, hollow: 1, papillary: 1, chordae: 1, fibrous: 1,
  trab: 1, turn: 1, septum: 1, align: 1, conusRidges: 1, conusFuse: 1, membranous: 1, split: 1,
};

/** The truncus's axis (the heart turned, as drawn): from its base on the conus to its top. */
const axisOf = (pts: Record<string, V3>) => {
  const B = pts['truncus-base'];
  const T = pts['truncus-top'];
  return (u: number): V3 => mix3(B, T, u);
};

/** Looking down into the truncus at u: the front at the bottom, the embryo's right on your left. */
const down = (c: V3, dist = 4.2, yaw = 0) => orbit(yaw, 76, dist, [c[0], c[1] - 0.05, c[2]]);

// ———————————————————————————— the small sections (SVG) ————————————————————————————

const RED = '#e05a6a';
const BLUE = '#5b8ce6';
const LEVEL_NAMES = ['Hurbilekoa', 'Tartekoa', 'Urrutikoa'] as const;
/** The septum's line across the lumen at each level, in the body (degrees, as truncus3d.ts). */
const LEVEL_THETA = [90, 180, 270] as const;

/** One level's section seen from above: front at the bottom, the embryo's right on the left. */
function Section({ x, y, level, show, hot }: { x: number; y: number; level: 0 | 1 | 2; show: number; hot: number }) {
  if (show <= 0.02) return null;
  const r = 30;
  const th = (LEVEL_THETA[level] * Math.PI) / 180;
  // Screen: x = the embryo's left, y down = ventral (front).
  const e = [Math.sin(th), Math.cos(th)];
  const n = [Math.cos(th), -Math.sin(th)];
  const half = (k: 1 | -1) => {
    const pts = Array.from({ length: 19 }, (_, i) => {
      const a = (Math.PI * i) / 18;
      return [x + r * (Math.cos(a) * e[0] + k * Math.sin(a) * n[0]), y + r * (Math.cos(a) * e[1] + k * Math.sin(a) * n[1])];
    });
    return `M${pts.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join('L')}Z`;
  };
  const lab = (k: 1 | -1) => [x + k * n[0] * r * 0.5, y + k * n[1] * r * 0.5];
  const [ax, ay] = lab(1);
  const [px, py] = lab(-1);
  return (
    <g opacity={show * (0.45 + 0.55 * hot)}>
      <rect x={x - 50} y={y - 50} width={100} height={116} rx={10} fill="#1d0f16" stroke={hot > 0.5 ? 'rgba(255,214,140,0.85)' : 'rgba(255,220,200,0.3)'} strokeWidth={hot > 0.5 ? 1.8 : 1.1} />
      <text x={x} y={y - 38} textAnchor="middle" className="note note-dim" style={{ fontSize: 10.5 }}>
        {LEVEL_NAMES[level]}
      </text>
      <Part id="aorta">
        <path d={half(1)} fill={RED} stroke="#5a1a22" strokeWidth={1} />
      </Part>
      <Part id="birika-arteria">
        <path d={half(-1)} fill={BLUE} stroke="#1a2a5a" strokeWidth={1} />
      </Part>
      <Part id="trenkada-aortikopulmonarra">
        <line x1={x + e[0] * (r + 2)} y1={y + e[1] * (r + 2)} x2={x - e[0] * (r + 2)} y2={y - e[1] * (r + 2)} stroke="#a9e4dc" strokeWidth={4} strokeLinecap="round" />
      </Part>
      <circle cx={x} cy={y} r={r} fill="none" stroke="#efe6cf" strokeWidth={2.4} />
      <text x={ax} y={ay} dy="0.35em" textAnchor="middle" style={{ fontSize: 9.5, fontWeight: 700, fill: '#fff' }}>
        Aorta
      </text>
      <text x={px} y={py} dy="0.35em" textAnchor="middle" style={{ fontSize: 9.5, fontWeight: 700, fill: '#fff' }}>
        Birika
      </text>
      <text x={x} y={y + r + 12} textAnchor="middle" className="note note-dim" style={{ fontSize: 9.5 }}>
        aurrea ↓
      </text>
      <text x={x} y={y + r + 25} textAnchor="middle" className="note note-dim" style={{ fontSize: 9.5 }}>
        {['zeharkakoa', 'aurretik atzera', 'zeharkakoa'][level]}
      </text>
    </g>
  );
}

/** The strip of the three sections, top right; each appears when its level is reached. */
function Sections({ shown, hot }: { shown: [number, number, number]; hot: number }) {
  return (
    <>
      {([0, 1, 2] as const).map((i) => (
        <Section key={i} x={722 + i * 108} y={158} level={i} show={shown[i]} hot={hot < 0 ? 1 : Math.max(0, 1 - Math.abs(hot - i))} />
      ))}
    </>
  );
}

/** The notes' summary (5.2 p10) as a table, right of the heart. */
function Summary({ show }: { show: number }) {
  if (show <= 0.02) return null;
  const x0 = 596;
  const y0 = 150;
  const W = [128, 132, 132];
  const rows: [string, string, string][] = [
    ['', 'Atal lisoa', 'Atal trabekulatua'],
    ['Eskuineko aurikula', 'Zain sinua', 'Atal aurikularra'],
    ['Ezkerreko aurikula', 'Birika zainak', 'Atal aurikularra'],
    ['Bentrikuluak', 'Arteria konoa (infundibuluak)', 'Hasierako bentrikuluak'],
  ];
  const H = 40;
  const cell = (text: string, x: number, y: number, w: number, head: boolean) => {
    const words = text.split(' ');
    // Two lines at most: split at the middle word.
    const lines = text.length > 18 ? [words.slice(0, Math.ceil(words.length / 2)).join(' '), words.slice(Math.ceil(words.length / 2)).join(' ')] : [text];
    return lines.map((l, i) => (
      <text key={i} x={x + w / 2} y={y + H / 2 + (i - (lines.length - 1) / 2) * 13} dy="0.35em" textAnchor="middle" style={{ fontSize: 11.5, fontWeight: head ? 700 : 500, fill: head ? '#ffd68c' : '#f4ece4' }}>
        {l}
      </text>
    ));
  };
  return (
    <g opacity={show}>
      <rect x={x0 - 10} y={y0 - 34} width={W[0] + W[1] + W[2] + 20} height={H * rows.length + 108} rx={12} fill="#1d0f16" stroke="rgba(255,220,200,0.35)" strokeWidth={1.2} />
      <text x={x0 + (W[0] + W[1] + W[2]) / 2} y={y0 - 16} textAnchor="middle" className="note note-accent" style={{ fontSize: 13 }}>
        Laburpena: paretak eta irteerak
      </text>
      {rows.map((row, r) => {
        let x = x0;
        return (
          <g key={r}>
            {r > 0 && <line x1={x0} y1={y0 + r * H} x2={x0 + W[0] + W[1] + W[2]} y2={y0 + r * H} stroke="rgba(255,220,200,0.2)" />}
            {row.map((c, i) => {
              const out = cell(c, x, y0 + r * H, W[i], r === 0 || i === 0);
              x += W[i];
              return <g key={i}>{out}</g>;
            })}
          </g>
        );
      })}
      <line x1={x0} y1={y0 + rows.length * H} x2={x0 + W[0] + W[1] + W[2]} y2={y0 + rows.length * H} stroke="rgba(255,220,200,0.2)" />
      <Part id="enbor-arteriosoa">
        <text x={x0 + (W[0] + W[1] + W[2]) / 2} y={y0 + rows.length * H + 22} textAnchor="middle" style={{ fontSize: 12, fontWeight: 700, fill: '#efe6cf' }}>
          Enbor arteriosoa (lakioaren urrutiko atala)
        </text>
      </Part>
      <text x={x0 + (W[0] + W[1] + W[2]) / 2} y={y0 + rows.length * H + 42} textAnchor="middle" style={{ fontSize: 11.5, fill: '#f4ece4' }}>
        trenkada aortiko-pulmonar kiribila →
      </text>
      <Part id="aorta">
        <text x={x0 + (W[0] + W[1] + W[2]) / 2 - 70} y={y0 + rows.length * H + 62} textAnchor="middle" style={{ fontSize: 12, fontWeight: 700, fill: RED }}>
          aorta (ezk. infund.)
        </text>
      </Part>
      <Part id="birika-arteria">
        <text x={x0 + (W[0] + W[1] + W[2]) / 2 + 76} y={y0 + rows.length * H + 62} textAnchor="middle" style={{ fontSize: 12, fontWeight: 700, fill: BLUE }}>
          birika enborra (esk. infund.)
        </text>
      </Part>
    </g>
  );
}

// ———————————————————————————— 11:enbor-arteriosoa ————————————————————————————

export const P10 = [0, 0.1, 0.22, 0.35, 0.47, 0.59, 0.72, 0.86] as const;

export const STEPS10: [number, string][] = [
  [P10[0], 'Enbor arteriosoan trenkada aortiko-pulmonarra: aorta eta birika arteria'],
  [P10[1], 'Bi gandor (endokardio kuxin): hurbildu eta hazi → trenkada kiribila'],
  [P10[2], 'Hurbileko atala: zeharkakoa; birika arteria aurrean, aorta atzean'],
  [P10[3], 'Tarteko atala: aurretik atzera; aorta eskuinean, birika arteria ezkerrean'],
  [P10[4], 'Urrutiko atala: berriro zeharkakoa; aorta aurrean, birika arteria atzean'],
  [P10[5], 'Konoaren trenkadarekin jarraia: birika arteria aurretik, aorta atzetik'],
  [P10[6], 'Bihotza apur bat biratuta: bi hodiak bata bestearen inguruan kiribilean'],
  [P10[7], 'Laburpena: atal lisoak eta trabekulatuak; enborretik aorta eta birika enborra'],
];

/** The truncus cut at each level in turn; the section rises from one level to the next. */
function cutAt(t: number) {
  const [a, b, c] = LEVELS;
  if (t < P10[2]) return 1;
  if (t < P10[3]) return lerp(1, a, seg(t, P10[2] + 0.01, P10[2] + 0.045));
  if (t < P10[4]) return lerp(a, b, seg(t, P10[3] + 0.005, P10[3] + 0.06));
  if (t < P10[5]) return lerp(b, c, seg(t, P10[4] + 0.005, P10[4] + 0.06));
  return lerp(c, 1, seg(t, P10[5], P10[5] + 0.03));
}

export function truncusStage(t: number): TruncusState {
  return {
    ...TR0,
    ridges: seg(t, P10[1] + 0.01, P10[1] + 0.06),
    // Fused before the step ends (its text says so); the ridges' names stay on the septum's edges.
    fuse: t >= P10[1] + 0.065 ? 1 : 0,
    cut: cutAt(t),
    // Seen through while the ridges grow and when the septum meets the conus's; solid when cut across.
    glass: 0.7 * (vis(t, 0.02, P10[2], 0.02) + vis(t, P10[5] + 0.02, P10[6], 0.02)),
    split: seg(t, P10[6] + 0.01, P10[6] + 0.05),
  };
}

export function Truncus3D({ t }: SceneProps) {
  const tr = truncusStage(t);
  const s: CanalState = {
    ...CN0,
    ...DONE,
    conusGlass: 0.75 * vis(t, P10[5] + 0.02, P10[6], 0.02),
    glassR: vis(t, P10[5] + 0.02, P10[6], 0.02),
    truncus: tr,
  };
  const model = canalModel(s, { phase: t, show: 1 });
  const at = axisOf(model.pts);
  const camera = cameraAt(t, [
    [0, orbit(-36, 14, 9.2, [0, 0.7, -0.1])],
    [0.03, orbit(-24, 12, 8.6, [0, 1.1, 0])],
    // The ridges, the truncus clear; then round to its other side to follow them winding up.
    [P10[1], orbit(-28, 8, 5.4, at(0.5))],
    [P10[1] + 0.06, orbit(34, 8, 5.4, at(0.5))],
    [P10[2], down(at(LEVELS[0]))],
    [P10[3], down(at(LEVELS[1]))],
    [P10[4], down(at(LEVELS[2]))],
    // From the right and in front, the conus and the truncus clear: one septum, from the ventricles up.
    [P10[5], orbit(-58, 12, 7.6, at(0.05))],
    [P10[6], orbit(-14, 10, 9.6, at(0.35))],
    [P10[6] + 0.06, orbit(28, 12, 9.6, at(0.35))],
    // The heart on the left, the table on the right.
    [P10[7], orbit(-18, 12, 12, [2.1, 0.9, 0])],
  ]);
  const hotLevel = t < P10[3] ? 0 : t < P10[4] ? 1 : 2;
  const names: CalloutSpec[] = [
    { id: 'enbor-arteriosoa', p: 'enbor-arteriosoa', show: vis(t, 0.03, P10[1] + 0.06) },
    { id: 'arteria-konoa', p: 'arteria-konoa', show: vis(t, 0.03, P10[1]), small: true },
    { id: 'hasierako-eskuineko-bentrikulua', p: 'hasierako-eskuineko-bentrikulua', show: vis(t, 0.03, P10[1]), small: true },
    { id: 'hasierako-ezkerreko-bentrikulua', p: 'hasierako-ezkerreko-bentrikulua', show: vis(t, 0.03, P10[1]), small: true },
    { id: 'enborraren-gandorrak', key: 'gandorra-1', p: 'enborraren-gandorrak', text: 'Enborraren gandorra', show: vis(t, P10[1] + 0.03, P10[2]) },
    { id: 'enborraren-gandorrak', key: 'gandorra-2', p: 'enborraren-gandorrak-2', text: 'Enborraren gandorra', show: vis(t, P10[1] + 0.03, P10[2]) },
    { id: 'trenkada-aortikopulmonarra', p: 'trenkada-aortikopulmonarra', show: vis(t, P10[1] + 0.065, P10[2]) + vis(t, P10[2] + 0.05, P10[5]) + vis(t, P10[5] + 0.04, P10[6]) * 0.999, small: true },
    { id: 'aorta', p: 'aorta', show: vis(t, P10[2] + 0.05, P10[6]) },
    { id: 'birika-arteria', p: 'birika-arteria', show: vis(t, P10[2] + 0.05, P10[6]) },
    { id: 'konoaren-trenkada', p: 'konoaren-trenkada', show: vis(t, P10[5] + 0.04, P10[6]), small: true },
    { id: 'eskuineko-infundibulua', p: 'eskuineko-infundibulua', show: vis(t, P10[5] + 0.04, P10[6]), small: true },
    { id: 'ezkerreko-infundibulua', p: 'ezkerreko-infundibulua', show: vis(t, P10[5] + 0.04, P10[6]), small: true },
    { id: 'mintzezko-trenkada', p: 'mintzezko-trenkada', show: vis(t, P10[5] + 0.04, P10[6]), small: true },
    { id: 'aorta', key: 'aorta-hodia', p: 'aorta-vessel', show: vis(t, P10[6] + 0.05) },
    { id: 'birika-arteria', key: 'birika-hodia', p: 'birika-arteria-vessel', show: vis(t, P10[6] + 0.05) },
  ];
  const levelsShown: [number, number, number] = [vis(t, P10[2] + 0.04, P10[7]), vis(t, P10[3] + 0.05, P10[7]), vis(t, P10[4] + 0.05, P10[7])];
  return (
    <ModelView
      model={model}
      continuity={CONT}
      right={RIGHT}
      camera={camera}
      names={names}
      over={(_, asked) => (
        <>
          <Note x={500} y={22} size={12.5} tone="dim" show={vis(t, 0, P10[1]) * asked}>
            Eskuinetik eta aurretik: bentrikuluen gainean arteria konoa, haren gainean enbor arteriosoa
          </Note>
          <Note x={500} y={22} size={12.5} tone="dim" show={vis(t, P10[1], P10[2]) * asked}>
            Enbor arteriosoa gardena: bi gandorrak horman kiribilean
          </Note>
          <Note x={420} y={22} size={12.5} tone="dim" show={vis(t, P10[2], P10[5]) * asked}>
            Goitik, zeharka moztuta: aurrea behean, eskuina zure ezkerrean
          </Note>
          <Note x={500} y={22} size={12.5} tone="dim" show={vis(t, P10[5], P10[6]) * asked}>
            Eskuinetik (paretak gardenak): enborraren trenkada konoaren trenkadaren jarraipena da
          </Note>
          <Note x={500} y={22} size={12.5} tone="dim" show={vis(t, P10[6], P10[7]) * asked}>
            Aurretik: bi hodiak bata bestearen inguruan biratzen dira
          </Note>
          <Sections shown={levelsShown} hot={t < P10[5] ? hotLevel : -1} />
          <Note x={500} y={600} size={13} tone="accent" show={vis(t, P10[4] + 0.06, P10[5])}>
            Mailaz maila trenkada biratzen da: kiribila
          </Note>
          <Note x={500} y={600} size={13} tone="accent" show={vis(t, P10[6] + 0.06, P10[7])}>
            Hurbilean birika arteria aurrean · tartean parean · goian aorta aurrean
          </Note>
          <Summary show={vis(t, P10[7] + 0.03)} />
          {Steps({ t, steps: STEPS10, y: 630 })}
        </>
      )}
    />
  );
}

// ———————————————————————————— 11:balbula-semilunarrak ————————————————————————————

export const P11 = [0, 0.25, 0.5, 0.73] as const;

export const STEPS11: [number, string][] = [
  [P11[0], 'Bi hodien hasieran hiru gandor; goian goraguneak (tuberkuluak)'],
  [P11[1], 'Goiko aldetik zulatu: balba ahurrak, enara kabiko formakoak'],
  [P11[2], 'Trikuspideak: aortan bi alboko + atzekoa; birikan bi alboko + aurrekoa'],
  [P11[3], 'Aortaren eskuineko eta ezkerreko sinuetatik: arteria koronarioak'],
];

export function valvesStage(t: number): TruncusState {
  return {
    ...TR0,
    ridges: 1,
    fuse: 1,
    split: 1,
    cut: t < P11[3] ? lerp(1, U_ROOTS, seg(t, 0.01, 0.05)) : lerp(U_ROOTS, 1, seg(t, P11[3] + 0.005, P11[3] + 0.045)),
    tubercles: seg(t, 0.05, 0.15),
    hollow: seg(t, P11[1] + 0.01, P11[1] + 0.13),
    coronaries: seg(t, P11[3] + 0.05, P11[3] + 0.16),
    glass: 0.75 * vis(t, P11[3] + 0.02, 2, 0.03),
  };
}

export function SemilunarValves3D({ t }: SceneProps) {
  const s: CanalState = { ...CN0, ...DONE, truncus: valvesStage(t) };
  const model = canalModel(s, { phase: t, show: 1 });
  const at = axisOf(model.pts);
  const roots = at(0.07);
  const camera = cameraAt(t, [
    [0, orbit(28, 12, 9.6, at(0.35))],
    // 66° down onto the roots: a longer glide (a short stage).
    [0.01, down(roots, 3.4), 0.05],
    // Lower, from the front: into the pockets as they are hollowed.
    [P11[1], orbit(-12, 58, 3.3, roots)],
    [P11[2], down(roots, 3.2)],
    // The heart from in front and the left: the coronaries down over it.
    [P11[3], orbit(-22, 18, 6.6, [0.1, 0.55, 0.15])],
  ]);
  const cusp = (valve: 'aorta-balbula' | 'birika-balbula', k: number, text: string) =>
    ({ id: valve, key: `${valve}-${k}`, p: `${valve}-${k}`, text, small: true, show: vis(t, P11[2] + 0.04, P11[3]) }) satisfies CalloutSpec;
  const names: CalloutSpec[] = [
    { id: 'aorta', key: 'aorta-hodia', p: 'aorta-vessel', show: vis(t, 0, P11[2]) + vis(t, P11[3] + 0.04) * 0.999 },
    { id: 'birika-arteria', key: 'birika-hodia', p: 'birika-arteria-vessel', show: vis(t, 0, P11[2]) + vis(t, P11[3] + 0.04) * 0.999 },
    { id: 'balbula-semilunarrak', key: 'tuberkuluak', p: 'balbula-semilunarrak', text: 'Goraguneak (tuberkuluak)', show: vis(t, 0.1, P11[1]) },
    { id: 'aorta-balbula', p: 'aorta-balbula', show: vis(t, P11[1] + 0.05, P11[2]) },
    { id: 'birika-balbula', p: 'birika-balbula', show: vis(t, P11[1] + 0.05, P11[2]) },
    cusp('aorta-balbula', 0, 'Atzeko balba (aorta)'),
    cusp('aorta-balbula', 1, 'Alboko balba (aorta)'),
    cusp('aorta-balbula', 2, 'Alboko balba (aorta)'),
    cusp('birika-balbula', 0, 'Aurreko balba (birika)'),
    cusp('birika-balbula', 1, 'Alboko balba (birika)'),
    cusp('birika-balbula', 2, 'Alboko balba (birika)'),
    { id: 'arteria-koronarioak', key: 'koronarioa-eskuin', p: 'arteria-koronarioak', text: 'Eskuineko arteria koronarioa', show: vis(t, P11[3] + 0.1) },
    { id: 'arteria-koronarioak', key: 'koronarioa-ezker', p: 'arteria-koronarioak-2', text: 'Ezkerreko arteria koronarioa', show: vis(t, P11[3] + 0.1) },
  ];
  return (
    <ModelView
      model={model}
      continuity={CONT}
      right={RIGHT}
      camera={camera}
      names={names}
      over={(_, asked) => (
        <>
          <Note x={500} y={22} size={12.5} tone="dim" show={(vis(t, 0.01, P11[1]) + vis(t, P11[2], P11[3])) * asked}>
            Goitik, bi hodiak hasieran moztuta: aurrea behean, eskuina zure ezkerrean
          </Note>
          <Note x={500} y={22} size={12.5} tone="dim" show={vis(t, P11[1], P11[2]) * asked}>
            Aurretik eta goitik: balba bakoitza poltsa bat da, goitik irekia
          </Note>
          <Note x={500} y={22} size={12.5} tone="dim" show={vis(t, P11[3]) * asked}>
            Aurretik (hodiak gardenak): koronarioak aortaren hasieratik bihotzaren gainera
          </Note>
          <Note x={500} y={600} size={13} tone="accent" show={vis(t, P11[1] + 0.12, P11[2])}>
            Balba ahurrak: enara kabiko forma, goiko aldetik zulatuta
          </Note>
          <Note x={500} y={600} size={13} tone="accent" show={vis(t, P11[3] + 0.16)}>
            Aortaren lehen adarrak: bihotzaren miokardioa irrigatzen dute
          </Note>
          {Steps({ t, steps: STEPS11, y: 630 })}
        </>
      )}
    />
  );
}
