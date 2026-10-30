'use client';

import { BONES } from '@/content/eratorriak/bones';
import { PieceDiagram, type Geometry } from './kit/PieceDiagram';
import type { DiagramProps } from './kit/StudyRoom';
import { bar, both, oval } from './kit/shapes';

/**
 * Topic 8's five views as simple anatomical schemas: the calvaria from the side, the chondrocranium from
 * above, the face with the middle-ear ossicles, the limb skeleton and thorax, and the vertebral column.
 * Every piece is a region where its bone (or tissue) really sits; colours say where it comes from.
 * The label point only picks the side and rough height; PieceDiagram places the names.
 */

const L = 20;
const R = 700;
const SEAM = { stroke: '#16141c', strokeWidth: 3, fill: 'none', strokeLinecap: 'round' } as const;
const CTX = { stroke: 'var(--text-3)', strokeWidth: 1.5, fill: 'none', opacity: 0.55 } as const;

/** Lateral calvaria, face to the left: frontal, parietal, occipital squama, temporal squama. */
const VAULT: Geometry = {
  frontal: { d: 'M300,300 C285,190 330,95 420,70 Q425,150 440,230 Q400,262 382,300 Z', label: [L, 160], fill: true, width: 2 },
  parietal: { d: 'M420,70 C490,52 570,62 610,105 Q590,180 595,235 Q515,182 440,230 Q425,150 420,70 Z', label: [R, 90], fill: true, width: 2 },
  tempScale: { d: 'M440,230 Q515,182 595,235 L600,300 L452,300 Z', label: [R, 270], fill: true, width: 2 },
  occScale: { d: 'M610,105 C660,150 675,230 650,300 L600,300 L595,235 Q590,180 610,105 Z', label: [R, 200], fill: true, width: 2 },
};
const vaultSeams = ['M420,70 Q425,150 440,230', 'M440,230 Q515,182 595,235', 'M610,105 Q590,180 595,235 L600,300'];

/** Chondrocranium from above, front at the top: central plates on the midline, lateral plates beside them. */
const band = (x: number, y: number, w: number, h: number) => `M${x + 6},${y} L${x + w - 6},${y} Q${x + w},${y} ${x + w},${y + 6} L${x + w},${y + h - 6} Q${x + w},${y + h} ${x + w - 6},${y + h} L${x + 6},${y + h} Q${x},${y + h} ${x},${y + h - 6} L${x},${y + 6} Q${x},${y} ${x + 6},${y} Z`;
const BASE: Geometry = {
  trabeculae: { d: both(band(450, 70, 18, 132)), label: [L, 110], fill: true, width: 2 },
  lesserWing: { d: both('M446,150 Q400,128 350,146 L356,182 Q404,168 446,186 Z'), label: [R, 160], fill: true, width: 2 },
  hypophyseal: { d: both(band(450, 214, 24, 74)), label: [L, 250], fill: true, width: 2 },
  greaterWing: { d: both('M444,250 Q392,240 340,266 L356,310 Q402,288 444,290 Z'), label: [R, 280], fill: true, width: 2 },
  otic: { d: both('M332,396 Q340,356 386,362 Q430,370 428,404 Q420,440 376,438 Q334,432 332,396 Z'), label: [R, 400], fill: true, width: 2 },
  occBaseOcc: { d: both(`${band(436, 304, 38, 30)} ${band(436, 340, 38, 30)} ${band(436, 376, 38, 30)}`), label: [L, 350], fill: true, width: 2 },
  occBaseNeck: { d: both(band(436, 414, 38, 28)), label: [L, 430], fill: true, width: 2 },
};

/** The face from the side, front to the left; the ossicles enlarged in a lens at the ear. */
const FACE: Geometry = {
  zygoma: { d: 'M382,288 L432,280 Q474,283 528,292 L534,310 Q482,312 442,318 L398,330 Q378,314 382,288 Z', label: [L, 270], fill: true, width: 2 },
  maxilla: { d: 'M318,280 Q342,300 382,292 L398,332 Q424,346 442,360 L440,394 Q382,402 336,392 Q312,350 318,280 Z', label: [L, 330], fill: true, width: 2 },
  mandible: { d: 'M336,410 Q382,420 442,413 L516,406 L536,334 L562,328 L558,356 L548,410 Q540,452 500,462 Q402,472 346,452 Q324,434 336,410 Z', label: [L, 440], fill: true, width: 2 },
  malleus: { d: 'M612,214 Q624,204 636,214 L636,236 L630,282 L620,282 L622,238 Q606,228 612,214 Z', label: [R, 200], fill: true, width: 2 },
  incus: { d: 'M648,216 Q668,204 682,220 L678,240 L688,276 L678,280 L664,244 Q646,238 648,216 Z', label: [R, 240], fill: true, width: 2 },
  stapes: { d: 'M690,268 L706,252 L716,258 L736,282 L726,292 L700,282 Z', label: [R, 290], fill: true, width: 2 },
};

/** Limbs: an upper limb (left) and a lower limb with its hip bone (right), from the front. */
const fingers = (x0: number, y0: number, dx: number, len: number) => [0, 1, 2, 3, 4].map((i) => bar(x0 + i * dx, y0, x0 + i * dx * 1.15, y0 + len - (i === 0 ? 22 : 0), 5)).join(' ');
const LIMB: Geometry = {
  upper: {
    d: [bar(372, 80, 372, 250, 22), bar(358, 268, 348, 402, 12), bar(386, 268, 384, 402, 12), oval(368, 424, 30, 16), fingers(344, 446, 12, 70)].join(' '),
    label: [L, 260],
    fill: true,
    width: 2,
  },
  pelvis: { d: 'M516,70 Q566,48 598,84 Q606,124 584,152 L590,198 Q574,228 544,222 Q522,208 530,180 Q508,140 516,70 Z M548,198 A12,8 0 1 0 572,198 A12,8 0 1 0 548,198 Z', label: [R, 110], fill: true, width: 2 },
  lower: {
    d: [bar(588, 170, 604, 340, 24), bar(600, 362, 598, 500, 18), bar(626, 364, 628, 500, 8), bar(588, 516, 650, 524, 18), fingers(632, 530, 8, 26)].join(' '),
    label: [R, 380],
    fill: true,
    width: 2,
  },
};

/** The thorax from the front: seven ribs a side, bony part and costal cartilage, and the sternum. */
const ribs = (part: 'bone' | 'cart') =>
  both(
    [0, 1, 2, 3, 4, 5, 6]
      .map((i) => {
        const y = 92 + 34 * i;
        const end = 404 + i * 6;
        return part === 'bone' ? `M452,${y} Q${300 - i * 4},${y + 6} ${316 - i * 3},${y + 74} Q${334},${y + 108} ${end},${y + 96}` : `M${end},${y + 96} Q${448 - i * 2},${y + 90} 466,${y + 58}`;
      })
      .join(' '),
  );
const THORAX: Geometry = {
  ribBone: { d: ribs('bone'), label: [L, 200], width: 9 },
  ribCart: { d: ribs('cart'), label: [R, 300], width: 9 },
  sternum: { d: `${band(462, 86, 36, 62)} ${band(468, 154, 24, 156)} ${band(474, 316, 12, 34)}`, label: [R, 120], fill: true, width: 2 },
};

/** The column from the side: three bodies (top half from segment A, bottom half from B) and discs between. */
const bodies = [94, 218, 342];
const AXIS: Geometry = {
  vertebraCaudal: { d: bodies.map((y) => band(420, y, 120, 45)).join(' '), label: [L, 110], fill: true, width: 2 },
  vertebraCranial: { d: bodies.map((y) => band(420, y + 45, 120, 45)).join(' '), label: [L, 170], fill: true, width: 2 },
  annulus: { d: [60, 184, 308, 432].map((y) => `${band(424, y + 2, 112, 30)} ${oval(480, y + 17, 22, 9)}`).join(' '), label: [R, 200], fill: true, width: 2 },
  nucleus: { d: [60, 184, 308, 432].map((y) => oval(480, y + 17, 20, 8)).join(' '), label: [R, 320], fill: true, width: 2 },
  notoBody: { d: bodies.map((y) => `M480,${y + 8} L480,${y + 82}`).join(' '), label: [R, 140], width: 3 },
};

const VIEWS: Record<string, Geometry> = { vault: VAULT, base: BASE, face: FACE, limb: LIMB, thorax: THORAX, axis: AXIS };
export const boneGeometry = () => VIEWS;

const titles: Record<string, string> = {
  vault: 'Buru-ganga albotik · mintzezko hezurtzapena',
  base: 'Kondrokraneoa goitik · kartilagoak eta eratorriak',
  face: 'Errai kraneoa albotik · kartilagoa edo inguruko mesenkima',
  limb: 'Gorputz adarrak eta gerrikoa · aurretik',
  thorax: 'Saihetsak eta esternoia · aurretik',
  axis: 'Ornoak eta diskoak · albotik',
};
const heights: Record<string, number> = { vault: 420, base: 500, face: 500, limb: 580, thorax: 450, axis: 490 };

/** Context (not pieces): outlines, orientation words, the notochord and the ear lens. */
function context(g: string) {
  const t = { fill: 'var(--text-3)', fontSize: 13 } as const;
  switch (g) {
    case 'vault':
      return (
        <g>
          <path d="M300,300 C268,326 282,376 330,392 L450,398 Q502,392 522,330 L600,300" {...CTX} />
          <circle cx="352" cy="318" r="26" {...CTX} />
          <text x="300" y="404" style={t}>aurrea</text>
          <text x="640" y="330" style={t}>atzea</text>
        </g>
      );
    case 'base':
      return (
        <g>
          <path d="M480,300 L480,460" stroke="var(--text-3)" strokeWidth="2" opacity="0.6" />
          <circle cx="480" cy="472" r="22" {...CTX} />
          <text x="480" y="56" textAnchor="middle" style={t}>aurrea</text>
          <text x="512" y="476" style={t}>zulo okzipitala</text>
          <text x="480" y="492" textAnchor="middle" style={{ ...t, fontSize: 12 }}>notokorda hipofisiraino</text>
        </g>
      );
    case 'face':
      return (
        <g>
          <path d="M318,280 C290,140 410,70 530,72 C640,76 700,150 690,250" {...CTX} />
          <circle cx="368" cy="250" r="30" {...CTX} />
          <circle cx="600" cy="300" r="10" {...CTX} />
          <circle cx="670" cy="250" r="78" {...CTX} strokeDasharray="4 5" />
          <text x="670" y="350" textAnchor="middle" style={t}>erdiko belarria (handituta)</text>
          <text x="318" y="490" style={t}>aurrea</text>
        </g>
      );
    case 'limb':
      return (
        <g>
          <text x="372" y="566" textAnchor="middle" style={t}>goiko adarra</text>
          <text x="600" y="566" textAnchor="middle" style={t}>beheko adarra</text>
        </g>
      );
    case 'thorax':
      return <path d="M480,70 L480,360" stroke="var(--text-3)" strokeWidth="14" opacity="0.18" strokeLinecap="round" />;
    case 'axis':
      return (
        <g>
          <text x="400" y="80" textAnchor="end" style={t}>aurrea</text>
          <text x="560" y="80" style={t}>atzea</text>
        </g>
      );
    default:
      return null;
  }
}

function seams(g: string) {
  if (g === 'vault') return vaultSeams.map((d) => <path key={d} d={d} {...SEAM} />);
  if (g === 'axis') return bodies.map((y) => <path key={y} d={`M424,${y + 45} L536,${y + 45}`} {...SEAM} strokeWidth={2} strokeDasharray="5 4" />);
  return null;
}

export function BoneDiagram(props: DiagramProps) {
  const gs = boneGeometry();
  const hits = Object.keys(gs).filter((g) => Object.keys(gs[g]).some((k) => props.lit.has(k)));
  const groups = hits.length ? hits : props.stage === 3 ? ['limb', 'thorax'] : [['vault', 'base', 'face', 'limb', 'axis'][props.stage]];
  return (
    <div>
      {groups.map((g) => (
        <PieceDiagram
          key={g}
          {...props}
          data={BONES}
          geometry={gs[g]}
          viewHeight={heights[g]}
          title={titles[g]}
          overlay={seams(g)}
          caption={
            g === 'axis'
              ? 'Orno bakoitza: A segmentuaren beheko erdia (goian) + B segmentuaren goiko erdia (behean); marra etena = fusio lerroa. Kolorea = jatorria.'
              : 'Eskema sinplifikatua: hezur bakoitza bere lekuan; kolorea = jatorria (gakoa azpian). Mekanismoa taulan.'
          }
        >
          <text x="480" y="30" textAnchor="middle" style={{ fill: 'var(--text-3)', fontSize: 15 }}>
            {titles[g]}
          </text>
          {context(g)}
        </PieceDiagram>
      ))}
    </div>
  );
}
