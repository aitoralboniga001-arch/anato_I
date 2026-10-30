'use client';
import { useState } from 'react';
import { HEART_TUBE } from '@/content/eratorriak/heart-tube';
import { PieceDiagram, type Geometry, type Shape } from './kit/PieceDiagram';
import { bar, oval } from './kit/shapes';
import type { DiagramProps } from './kit/StudyRoom';
import styles from './eratorriak.module.css';
import extra from './kit/study.module.css';
const L = 20;
const R = 700;
const band = (x: number, y: number, w: number, h: number) =>
  `M${x + 8},${y} L${x + w - 8},${y} Q${x + w},${y} ${x + w},${y + 8} L${x + w},${y + h - 8} Q${x + w},${y + h} ${x + w - 8},${y + h} L${x + 8},${y + h} Q${x},${y + h} ${x},${y + h - 8} L${x},${y + 8} Q${x},${y} ${x + 8},${y} Z`;

export function heartTubeGeometry(stage: number): Record<string, Geometry> {
  const g: Record<string, Geometry> = { tube: {}, layers: {}, sinus: {} };
  // Straight tube (cranial at the top) or the loop seen from the front (embryo's right on the viewer's left):
  // bulbus down and to the right, ventricle to the left, atria up and back beside the outflow, sinus behind.
  const bent = stage >= 3;
  const fill = (d: string, x: number, y: number): Shape => ({ d, label: [x, y], fill: true, width: 2 });
  const tube: Record<string, Shape> = bent
    ? {
        truncA: fill(band(452, 66, 26, 84), L, 100),
        truncP: fill(band(482, 66, 26, 84), R, 100),
        conusR: fill(bar(462, 160, 424, 224, 22), L, 200),
        conusL: fill(bar(490, 164, 452, 230, 22), R, 220),
        proximal: fill(oval(420, 306, 52, 64), L, 320),
        ventricle: fill(oval(548, 336, 72, 84), R, 340),
        atriumR: fill(oval(372, 172, 42, 34), L, 160),
        atriumL: fill(oval(582, 170, 44, 34), R, 170),
        sinusR: fill(stage >= 5 ? oval(334, 214, 18, 22) : bar(340, 140, 306, 98, 22), L, 120),
        sinusCor: fill(bar(622, 140, 654, 102, 22), R, 130),
        sinusOblique: fill(bar(654, 100, 662, 62, 10), R, 70),
      }
    : {
        truncA: fill(band(452, 80, 26, 70), L, 110),
        truncP: fill(band(482, 80, 26, 70), R, 110),
        conusR: fill(band(452, 156, 26, 60), L, 190),
        conusL: fill(band(482, 156, 26, 60), R, 190),
        proximal: fill(oval(480, 262, 44, 38), L, 262),
        ventricle: fill(oval(480, 350, 54, 44), R, 350),
        atriumR: fill(band(430, 404, 48, 50), L, 430),
        atriumL: fill(band(482, 404, 48, 50), R, 430),
        sinusR: fill(bar(462, 470, 404, 536, 26), L, 520),
        sinusCor: fill(bar(498, 470, 556, 536, 26), R, 520),
        sinusOblique: fill(bar(560, 542, 590, 584, 14), R, 580),
      };
  g.tube = tube;
  g.layers = {
    endoR: { d: stage === 1 ? 'M410,235 L410,435' : 'M450,245 L450,455', label: [20, 235], width: 10 },
    endoL: { d: stage === 1 ? 'M550,235 L550,435' : 'M510,245 L510,455', label: [630, 235], width: 10 },
    myocard: { d: 'M400,205 L400,490 M560,205 L560,490', label: [20, 370], width: 23 },
    epicard: { d: 'M370,200 L370,495 M590,200 L590,495', label: [630, 370], width: 9 },
    mesocard: { d: 'M480,500 L480,610', label: [20, 570], width: 13 },
  };
  const names = ['valveUpper', 'valveIvc', 'valveCor', 'valveL', 'spurium'];
  const paths = [
    'M405,230 Q430,270 410,320',
    'M405,350 Q435,385 410,425',
    'M405,450 Q435,475 410,500',
    'M550,255 Q520,325 550,400',
    'M430,205 Q480,170 530,205',
  ];
  names.forEach((key, i) => (g.sinus[key] = { d: paths[i], label: [i % 2 ? 630 : 20, 120 + 105 * i], width: 14 }));
  return g;
}
export function HeartTubeDiagram(props: DiagramProps) {
  const [view, setView] = useState('tube');
  const gs = heartTubeGeometry(props.stage);
  const hits = Object.keys(gs).filter((g) => Object.keys(gs[g]).some((k) => props.lit.has(k))),
    groups = hits.length ? hits : [props.stage === 1 && view === 'tube' ? 'layers' : view];
  return (
    <div>
      {!props.mini && (
        <div className={extra.panelTabs} role="group" aria-label="Bihotz hodiaren ikuspegia">
          {[
            ['tube', 'Hodia eta lakioa'],
            ['layers', 'Geruzak eta mesokardioa'],
            ['sinus', 'Zain balbulak'],
          ].map(([id, name]) => (
            <button
              type="button"
              key={id}
              className={`${styles.pick}${groups.includes(id) ? ` ${styles.on}` : ''}`}
              aria-pressed={groups.includes(id)}
              disabled={props.lit.size > 0 && !groups.includes(id)}
              onClick={() => setView(id)}
            >
              {name}
            </button>
          ))}
        </div>
      )}
      {groups.map((active) => (
        <PieceDiagram
          key={active}
          {...props}
          data={HEART_TUBE}
          geometry={gs[active]}
          viewHeight={active === 'tube' && props.stage >= 2 ? (props.stage >= 3 ? 480 : 640) : 730}
          title={
            active === 'tube'
              ? 'Lau atalen tolespena eta eratorriak'
              : active === 'layers'
                ? 'Hodiaren geruzak eta atzeko lotura'
                : 'Zain balbulak eta septum spurium'
          }
          caption="Aurreko ikuspegia: enbrioiaren eskuina zure ezkerrean. Kurba eskematikoa: aurikula/sinua atze-goian, bentrikuluak aurrean; ez da denbora-eskala anatomiko zehatza."
        >
          <g style={{ fill: 'var(--text-3)', fontSize: 15 }}>
            <text x="480" y="40" textAnchor="middle">
              {props.stage === 0 ? 'Errai orriko eremu kardiogenikoa' : HEART_TUBE.stages[props.stage].title}
            </text>
            {props.stage === 1 && active === 'sinus' && (
              <text x="480" y="650" textAnchor="middle">
                Zain balbulen xehetasunak hurrengo unetik
              </text>
            )}
            {props.stage === 0 ? (
              <>
                <path d="M350,400 Q300,160 480,150 Q660,160 610,400" fill="none" stroke="#ec6f9e" strokeWidth="35" />
                <text x="480" y="310" textAnchor="middle">
                  Plaka kardiogenikoa
                </text>
                <text x="480" y="500" textAnchor="middle">
                  Ferra formako plexua · alboetan bi hodi
                </text>
                <text x="480" y="550" textAnchor="middle">
                  Epiblastoa → errai orria → odol irlatxoak
                </text>
              </>
            ) : active === 'layers' ? (
              <>
                <path d="M420,215 L420,475 M540,215 L540,475" stroke="#a9e4dc" strokeWidth="18" />
                <text x="480" y="335" textAnchor="middle">
                  Argia
                </text>
                <text x="480" y="680" textAnchor="middle">
                  Gelatina (menda): endokardioaren eta miokardioaren artean
                </text>
              </>
            ) : active === 'tube' ? (
              <text x="480" y={props.stage >= 3 ? 450 : 620} textAnchor="middle" style={{ fontSize: 13 }}>
                {props.stage >= 3 ? 'Aurikulak eta sinua atzean eta goian; bulboa eta bentrikulua aurrean' : 'Buru aldea goian · odola behetik gora: sinua → aurikula → bentrikulua → bulboa'}
              </text>
            ) : active === 'sinus' ? (
              <path d="M360,155 Q480,95 600,155 L600,525 Q480,585 360,525Z" fill="#3e293a" stroke="#795675" strokeWidth="2" />
            ) : null}
          </g>
        </PieceDiagram>
      ))}
    </div>
  );
}
