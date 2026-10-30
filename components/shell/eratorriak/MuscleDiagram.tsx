'use client';

import { MUSCLES } from '@/content/eratorriak/muscles';
import { PieceDiagram, type Geometry } from './kit/PieceDiagram';
import type { DiagramProps } from './kit/StudyRoom';
import { bar, both, oval, ring, sector } from './kit/shapes';

/**
 * Topic 9's five views as simple anatomical schemas: the head from the side (eye, jaw, face, larynx and
 * tongue muscles where they sit), neck and thorax cross-sections for the two domains, small vignettes for
 * smooth muscle, the two connective patterns, and the heart's wall and conduction system. Colours say
 * where each muscle comes from; the label point only picks the side and rough height.
 */

const L = 20;
const R = 700;
const CTX = { stroke: 'var(--text-3)', strokeWidth: 1.5, fill: 'none', opacity: 0.55 } as const;
const TXT = { fill: 'var(--text-3)', fontSize: 13 } as const;

/** Head from the side, face to the left. */
const HEAD: Geometry = {
  eye12: { d: [bar(398, 200, 470, 209, 7), bar(398, 232, 470, 222, 7), bar(372, 240, 402, 247, 6)].join(' '), label: [L, 190], fill: true, width: 2 },
  eye3: { d: `${bar(386, 182, 470, 198, 5)} ${bar(366, 186, 388, 182, 3)}`, label: [R, 160], fill: true, width: 2 },
  eye5: { d: bar(410, 216, 470, 216, 7), label: [R, 214], fill: true, width: 2 },
  arch1: { d: 'M476,104 Q534,90 578,132 Q578,184 544,214 L508,248 Q494,200 474,168 Z M476,272 L528,262 L544,346 L484,356 Z', label: [R, 290], fill: true, width: 2 },
  arch2: { d: `M336,96 Q372,60 422,62 L426,112 Q382,116 348,140 Z ${ring(324, 302, 22, 12, 14, 5)}`, label: [L, 110], fill: true, width: 2 },
  arch3: { d: bar(568, 300, 528, 396, 6), label: [R, 370], fill: true, width: 2 },
  larynx: { d: `${bar(448, 424, 488, 436, 7)} ${bar(448, 452, 488, 460, 7)}`, label: [L, 440], fill: true, width: 2 },
  tongue: { d: 'M350,306 Q384,284 440,292 Q470,306 462,330 Q424,344 362,332 Q346,320 350,306 Z', label: [L, 320], fill: true, width: 2 },
};

/** Neck section (top) and thoracic section with the limb (bottom); dorsal is up. */
const BODY: Geometry = {
  deep: { d: `${both(oval(458, 312, 24, 14))} ${both(oval(484, 96, 12, 8))}`, label: [L, 300], fill: true, width: 2 },
  neck: { d: `${both(oval(476, 150, 10, 7))} ${both(oval(456, 136, 7, 11))}`, label: [L, 140], fill: true, width: 2 },
  scapula: { d: both(bar(466, 286, 420, 302, 7)), label: [L, 260], fill: true, width: 2 },
  intercostal: { d: both('M430,334 Q392,384 436,448'), label: [L, 400], width: 8 },
  wall: { d: `M426,470 Q480,500 534,470 ${bar(468, 190, 492, 190, 5)}`, label: [R, 470], width: 8 },
  limb: { d: `${oval(644, 352, 24, 12)} ${oval(644, 384, 24, 12)}`, label: [R, 360], fill: true, width: 2 },
};

/** Smooth muscle: gut wall, iris, mammary and sweat glands, and the aortic wall's two proposed sources. */
const aorta = (k: number) => [0, 1, 2, 3, 4, 5, 6, 7].filter((i) => i % 2 === k).map((i) => sector(560, 360, 46, 30, i * 45 + 2, i * 45 + 43)).join(' ');
const OTHER: Geometry = {
  gut: { d: ring(400, 110, 44, 30), label: [L, 110], fill: true, width: 2 },
  pupil: { d: ring(400, 270, 28, 12), label: [L, 270], fill: true, width: 2 },
  breast: { d: `${ring(386, 430, 22, 16)} ${ring(420, 448, 22, 16)}`, label: [L, 440], fill: true, width: 2 },
  sweat: { d: 'M548,90 Q590,96 586,126 Q582,152 552,146 Q526,140 536,116 Q546,100 566,108', label: [R, 110], width: 8 },
  vascularWall: { d: aorta(0), label: [R, 330], fill: true, width: 1 },
  vascularCrest: { d: aorta(1), label: [R, 400], fill: true, width: 1 },
};

/** Connective patterns: a head muscle and a limb muscle, each wrapped in its connective sheath. */
const PATTERNS: Geometry = {
  ctHead: { d: `${oval(400, 170, 62, 36)} ${oval(400, 170, 50, 26)}`, label: [L, 170], fill: true, width: 2 },
  ctBody: { d: `${oval(560, 170, 40, 74)} ${oval(560, 170, 30, 62)}`, label: [R, 170], fill: true, width: 2 },
};

/** The heart from the front: the myocardial wall and the conduction pathway along it. */
const HEART_OUT = 'M400,140 Q430,96 480,112 Q530,92 572,124 Q606,150 596,196 Q640,250 610,320 Q580,380 520,420 Q470,400 430,350 Q384,290 380,220 Q376,170 400,140 Z';
const CAVITIES = 'M410,152 Q440,130 468,148 L470,214 Q436,226 410,206 Z M492,142 Q530,124 566,144 Q582,170 572,204 L496,212 Z M410,238 L470,238 L474,360 Q430,320 410,270 Z M496,238 L584,232 Q596,300 560,350 Q520,392 494,380 Z';
const CARDIAC: Geometry = {
  cardiac: { d: `${HEART_OUT} ${CAVITIES}`, label: [L, 280], fill: true, width: 2 },
  conduct: {
    d: 'M438,126 Q466,170 482,226 L483,258 M478,256 L474,370 Q428,336 404,268 M488,256 L500,382 Q572,350 592,262',
    label: [R, 300],
    width: 5,
    casing: true,
  },
};

const VIEWS: Record<string, Geometry> = { head: HEAD, body: BODY, other: OTHER, patterns: PATTERNS, cardiac: CARDIAC };
export const muscleGeometry = () => VIEWS;

const titles: Record<string, string> = {
  head: 'Burua albotik · somitomeroak eta somita okzipitalak',
  body: 'Lepoa eta toraxa zeharka · domeinu primaxiala eta abaxiala',
  other: 'Muskulu leuna: jatorriak eta salbuespenak',
  patterns: 'Ehun konektibozko patroiaren bi iturriak',
  cardiac: 'Bihotza aurretik · miokardioa eta eroapen sistema',
};
const heights: Record<string, number> = { head: 500, body: 540, other: 500, patterns: 300, cardiac: 440 };

function context(g: string) {
  switch (g) {
    case 'head':
      return (
        <g>
          <path d="M336,96 C330,60 430,30 520,40 C620,50 672,120 666,210 C662,280 640,330 604,362 L594,480 M336,96 Q320,150 318,200 L298,250 L314,276 L310,322 L326,350 Q344,372 372,384 L388,480" {...CTX} />
          <circle cx="386" cy="216" r="20" {...CTX} />
          <rect x="440" y="412" width="56" height="62" rx="10" {...CTX} />
          <text x="300" y="490" style={TXT}>aurrea</text>
        </g>
      );
    case 'body':
      return (
        <g>
          <ellipse cx="480" cy="140" rx="70" ry="58" {...CTX} />
          <circle cx="480" cy="140" r="13" {...CTX} />
          <circle cx="480" cy="112" r="7" {...CTX} />
          <ellipse cx="480" cy="368" rx="122" ry="112" {...CTX} />
          <path d="M598,340 Q640,330 672,350 Q680,384 640,398 Q610,398 598,392" {...CTX} />
          <circle cx="480" cy="300" r="13" {...CTX} />
          <circle cx="480" cy="340" r="20" {...CTX} />
          <path d="M400,452 Q380,420 372,380 M560,452 Q580,420 590,392" stroke="var(--text-3)" strokeWidth="1.5" strokeDasharray="4 4" fill="none" opacity="0.8" />
          <text x="480" y="242" textAnchor="middle" style={TXT}>primaxiala: hodi neuralaren ondoan</text>
          <text x="480" y="526" textAnchor="middle" style={TXT}>abaxiala: pareta orrira iritsitako zelulak · marra etena = muga</text>
          <text x="480" y="66" textAnchor="middle" style={TXT}>lepoa</text>
        </g>
      );
    case 'other':
      return (
        <g style={TXT}>
          <text x="400" y="176" textAnchor="middle">hestea (zeharka)</text>
          <circle cx="400" cy="270" r="44" {...CTX} />
          <text x="400" y="336" textAnchor="middle">begia aurretik</text>
          <text x="404" y="490" textAnchor="middle">titi guruina</text>
          <text x="566" y="176" textAnchor="middle">izerdi guruina</text>
          <text x="560" y="428" textAnchor="middle">aorta (zeharka)</text>
        </g>
      );
    case 'patterns':
      return (
        <g>
          <ellipse cx="400" cy="170" rx="46" ry="22" fill="var(--text-3)" opacity="0.25" />
          <ellipse cx="560" cy="170" rx="26" ry="58" fill="var(--text-3)" opacity="0.25" />
          <text x="400" y="240" textAnchor="middle" style={TXT}>buruko muskulua</text>
          <text x="560" y="272" textAnchor="middle" style={TXT}>gorputzeko muskulua</text>
          <text x="480" y="292" textAnchor="middle" style={{ ...TXT, fontSize: 11 }}>gris = somitatik datozen muskulu-zelulak; koloretakoa = haien ehun konektiboa</text>
        </g>
      );
    case 'cardiac':
      return (
        <g style={TXT}>
          <text x="440" y="114" textAnchor="end">SA nodoa</text>
          <text x="480" y="434" textAnchor="middle">SA nodoa → AV nodoa → His sorta → adarrak → Purkinje</text>
        </g>
      );
    default:
      return null;
  }
}

export function MuscleDiagram(props: DiagramProps) {
  const gs = muscleGeometry();
  const hits = Object.keys(gs).filter((g) => Object.keys(gs[g]).some((k) => props.lit.has(k)));
  const groups = hits.length ? hits : [['other', 'head', 'body', 'patterns', 'cardiac'][props.stage]];
  return (
    <div>
      {groups.map((g) => (
        <PieceDiagram
          key={g}
          {...props}
          data={MUSCLES}
          viewHeight={heights[g]}
          geometry={gs[g]}
          title={titles[g]}
          caption={
            g === 'other'
              ? 'Eskema sinplifikatua; kolorea = jatorria. Aortan bi jatorri-proposamen: zatiak txandaka margotuta, ez dira horma-zati jakinak.'
              : 'Eskema sinplifikatua: muskulu bakoitza bere lekuan; kolorea = jatorria (gakoa azpian). Inerbazioa taulan.'
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
