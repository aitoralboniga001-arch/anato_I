'use client';
import { useState } from 'react';
import { SEPTA } from '@/content/eratorriak/septa';
import { PieceDiagram, type Geometry } from './kit/PieceDiagram';
import type { DiagramProps } from './kit/StudyRoom';
import styles from './eratorriak.module.css';
import extra from './kit/study.module.css';

const hole = (x: number, y: number, rx: number, ry: number) =>
  `M${x - rx},${y} a${rx},${ry} 0 1,0 ${2 * rx},0 a${rx},${ry} 0 1,0 ${-2 * rx},0Z`;
export function septaGeometry(stage: number): Record<string, Geometry> {
  const px = stage >= 6 ? 480 : 500,
    end = stage === 1 ? 310 : stage === 2 ? 430 : 540;
  const cusp = (x: number, y: number) =>
    `M${x},${y - 25} Q${x + 28},${y - 18} ${x + 22},${y + 14} Q${x + 8},${y + 5} ${x},${y} Q${x - 8},${y + 5} ${x - 22},${y + 14} Q${x - 28},${y - 18} ${x},${y - 25}Z`;
  return {
    atria: {
      primum: {
        d: `M${px},140 L${px + 60},140 L${px + 60},${end} Q${px + 30},${end + 15} ${px},${end}Z ${stage >= 2 && stage < 7 ? hole(px + 30, 245, 18, 25) : ''}`,
        label: [630, 170],
        fill: true,
        width: 2,
      },
      secundum: { d: 'M438,140 L478,140 L478,385 Q458,414 438,395Z', label: [20, 310], fill: true, width: 2 },
      spurium: { d: 'M370,145 Q402,165 438,200', label: [20, 110], width: 8 },
      leftValve: { d: 'M370,220 Q402,205 438,200', label: [20, 210], width: 8 },
      ostium1: {
        d:
          stage < 3
            ? `M${px - 4},${end + 22} L${px + 64},${end + 22} L${px + 64},525 L${px - 4},525Z`
            : 'M495,500 L565,500 L565,527 L495,527Z',
        label: [20, 480],
        fill: true,
        width: 2,
      },
      ostium2: { d: hole(px + 30, 245, 18, 25), label: [630, 285], fill: true, width: 2 },
      foramen: { d: 'M438,405 Q458,425 478,405 L478,495 Q458,510 438,490Z', label: [630, 465], fill: true, width: 2 },
    },
    canal: {
      cushionSup: {
        d: stage >= 3 ? 'M410,200 Q480,180 550,200 L520,320 L440,320Z' : 'M410,200 Q480,180 550,200 L525,265 Q480,280 435,265Z',
        label: [20, 190],
        fill: true,
        width: 2,
      },
      cushionInf: {
        d: stage >= 3 ? 'M410,450 Q480,470 550,450 L520,320 L440,320Z' : 'M410,450 Q480,470 550,450 L525,385 Q480,370 435,385Z',
        label: [630, 450],
        fill: true,
        width: 2,
      },
      valveR: { d: 'M350,290 L365,325 L380,290 L395,325 L410,290 L425,325 L440,290', label: [20, 560], width: 10 },
      valveL: { d: 'M525,290 L545,330 L565,290 L585,330 L605,290', label: [630, 560], width: 10 },
    },
    iv: {
      ivMuscle: {
        d:
          stage < 4
            ? 'M425,650 Q450,580 455,470 L470,470 L475,605 L485,605 L490,470 L505,470 Q510,580 535,650Z'
            : 'M425,650 Q460,590 465,445 L495,445 Q500,590 535,650Z',
        label: [20, 500],
        fill: true,
        width: 2,
      },
      ivMembrane: { d: 'M465,445 L495,445 L495,380 L465,380Z', label: [630, 330], fill: true, width: 2 },
      ivGap: { d: 'M465,355 L495,355 L495,420 L465,420Z', label: [20, 300], fill: true, width: 2 },
    },
    walls: {
      raSmooth: { d: 'M350,170 Q405,100 460,170 L460,230 L350,230Z', label: [20, 150], fill: true, width: 2 },
      raTrab: { d: 'M350,230 L460,230 L460,295 Q405,325 350,295Z', label: [20, 285], fill: true, width: 2 },
      laSmooth: { d: 'M500,170 Q555,100 610,170 L610,230 L500,230Z', label: [630, 150], fill: true, width: 2 },
      laTrab: { d: 'M500,230 L610,230 L610,295 Q555,325 500,295Z', label: [630, 285], fill: true, width: 2 },
      rvSmooth: { d: 'M350,390 Q405,350 460,390 L460,445 L350,445Z', label: [20, 415], fill: true, width: 2 },
      rvTrab: { d: 'M350,445 L460,445 L460,575 Q405,630 350,575Z', label: [20, 580], fill: true, width: 2 },
      lvSmooth: { d: 'M500,390 Q555,350 610,390 L610,445 L500,445Z', label: [630, 415], fill: true, width: 2 },
      lvTrab: { d: 'M500,445 L610,445 L610,575 Q555,630 500,575Z', label: [630, 580], fill: true, width: 2 },
    },
    outflow: {
      truncAorta: { d: 'M420,610 C420,490 550,390 550,275 C550,200 510,155 510,90', label: [20, 95], width: 15 },
      truncPulm: { d: 'M550,610 C550,490 420,390 420,275 C420,200 460,155 460,90', label: [630, 95], width: 15 },
      conalRidgeR: { d: 'M395,480 Q445,470 480,455', label: [20, 435], width: 10 },
      conalRidgeL: { d: 'M575,480 Q525,470 480,455', label: [630, 435], width: 10 },
      truncRidgeR: { d: 'M415,240 Q460,260 480,310', label: [20, 240], width: 10 },
      truncRidgeL: { d: 'M555,340 Q510,330 480,310', label: [630, 310], width: 10 },
      semiAorta: { d: cusp(420, 610), label: [20, 610], fill: true, width: 2 },
      semiPulm: { d: cusp(550, 610), label: [630, 610], fill: true, width: 2 },
    },
  };
}
const views = {
  atria: 'Primum, secundum eta zuloak',
  canal: 'Erreten AB eta balbulak',
  iv: 'Bentrikulu arteko trenkada',
  walls: 'Lau ganberen bi jatorriak',
  outflow: 'Konoa eta enborra',
};
const ATRIAL_CAPTIONS = [
  'Aurikula komuna: oraindik trenkada nagusirik gabe',
  'Primum-en behean: ostium primum irekita',
  'Ostium secundum agertu da, ostium primum itxi aurretik',
  'Ostium primum itxita; ostium secundum irekita',
  'Eskuinekoa → zulo obala → ostium secundum → ezkerrekoa',
  'Eskuinekoa → zulo obala → ostium secundum → ezkerrekoa',
  'Ezkerreko presioa handitu → primum secundum-aren aurka',
  'Fusio luzea; ez da kasu guztietan osoa',
];
export function SeptaDiagram(props: DiagramProps) {
  const [chosen, setChosen] = useState<string | null>(null),
    geo = septaGeometry(props.stage);
  const hits = Object.keys(geo).filter((g) => Object.keys(geo[g]).some((k) => props.lit.has(k))),
    groups = hits.length ? hits : [chosen ?? 'atria'];
  return (
    <div>
      {!props.mini && (
        <div className={extra.panelTabs} role="group" aria-label="Trenkaden ikuspegia">
          {Object.entries(views).map(([g, title]) => (
            <button
              key={g}
              type="button"
              className={`${styles.pick}${groups.includes(g) ? ` ${styles.on}` : ''}`}
              aria-pressed={groups.includes(g)}
              disabled={props.lit.size > 0 && !groups.includes(g)}
              onClick={() => setChosen(g)}
            >
              {title}
            </button>
          ))}
        </div>
      )}
      {groups.map((g) => (
        <PieceDiagram
          key={g}
          {...props}
          data={SEPTA}
          geometry={geo[g]}
          title={views[g as keyof typeof views]}
          overlay={
            g === 'atria' && props.stage >= 4 && props.stage < 6 ? (
              <path
                d="M350,470 L458,450 Q490,450 490,420 L490,245 L605,245 M591,236 L605,245 L591,254"
                stroke="#ffd166"
                strokeWidth="5"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                pointerEvents="none"
                opacity={props.lit.size && !props.lit.has('foramen') && !props.lit.has('ostium2') ? 0.15 : 0.85}
              />
            ) : null
          }
          caption={
            g === 'atria'
              ? 'Aurretik: enbrioiaren eskuina zure ezkerrean. Secundum primum-en eskuinean dago; zuloak ez daude altuera berean. Horia: odolaren bide lapranaren eskema; zain balbulen kokapena eskematikoa da.'
              : 'Aurretik: enbrioiaren eskuina zure ezkerrean. Atalen eta jatorrien eskema; AB, bentrikulu eta irteera prozesuak aurikulenarekin paraleloak dira.'
          }
        >
          <g>
            {g === 'atria' && (
              <>
                <path
                  d="M340,195 Q350,80 480,105 Q610,80 620,195 L620,500 Q600,595 480,585 Q360,595 340,500Z"
                  fill="#7d394e"
                  opacity=".35"
                />
                <path d="M440,550 Q480,525 540,550" stroke="#a9e4dc" strokeWidth="20" />
                <text x="490" y="578" textAnchor="middle" className={extra.small}>
                  erreten AB · kuxinak
                </text>
                {props.stage === 0 && (
                  <text x="500" y="330" textAnchor="middle" className={extra.small}>
                    aurikula komuna · trenkadarik gabe
                  </text>
                )}
                <text x="480" y="660" textAnchor="middle" className={extra.small}>
                  {ATRIAL_CAPTIONS[props.stage]}
                </text>
              </>
            )}
            {g === 'canal' && (
              <>
                <ellipse cx="480" cy="320" rx="155" ry="160" fill="#7d394e" opacity=".35" />
                <path d="M335,275 Q385,320 335,365Z M625,275 Q575,320 625,365Z" fill="#a9e4dc" opacity={props.stage < 4 ? 0.5 : 0.15} />
                <text x="345" y="392" textAnchor="middle" className={extra.small}>
                  alboko kuxina
                </text>
                <text x="615" y="392" textAnchor="middle" className={extra.small}>
                  alboko kuxina
                </text>
                <text x="480" y="90" textAnchor="middle" className={extra.small}>
                  goikoa / dortsala
                </text>
                <text x="480" y="680" textAnchor="middle" className={extra.small}>
                  goikoak + behekoak fusionatu · alboetakoak testuinguruan
                </text>
              </>
            )}
            {g === 'iv' && (
              <>
                <path d="M340,250 Q480,200 620,250 L600,560 Q550,705 480,680 Q410,705 360,560Z" fill="#7d394e" opacity=".35" />
                <text x="480" y="100" textAnchor="middle" className={extra.small}>
                  {props.stage >= 4 ? 'Mintzezkoa + muskularra: komunikazioa itxita' : 'Muskularra bakarrik: goiko komunikazioa irekita'}
                </text>
              </>
            )}
            {g === 'walls' && (
              <>
                <text x="480" y="55" textAnchor="middle" className={extra.small}>
                  aurikulak
                </text>
                <text x="480" y="695" textAnchor="middle" className={extra.small}>
                  bentrikuluak · jatorrien mapa
                </text>
              </>
            )}
            {g === 'outflow' && (
              <>
                <text x="480" y="35" textAnchor="middle" className={extra.small}>
                  enbor arteriosoa
                </text>
                <text x="480" y="700" textAnchor="middle" className={extra.small}>
                  arteria konoa · bi infundibuluetara
                </text>
              </>
            )}
          </g>
        </PieceDiagram>
      ))}
    </div>
  );
}
