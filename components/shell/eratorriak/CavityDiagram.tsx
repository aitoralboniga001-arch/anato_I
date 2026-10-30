'use client';

import { useState } from 'react';
import { CAVITIES } from '@/content/eratorriak/cavities';
import { PieceDiagram, type Geometry } from './kit/PieceDiagram';
import type { DiagramProps } from './kit/StudyRoom';
import styles from './eratorriak.module.css';
import extra from './kit/study.module.css';

const heart = 'M454,310 C430,278 417,315 430,340 L480,392 L530,340 C543,315 530,278 506,310 Q480,278 454,310Z';
const lungR = 'M400,192 C370,205 363,285 378,323 Q398,345 428,312 L428,230 Q415,188 400,192Z';
const lungL = 'M560,192 C590,205 597,285 582,323 Q562,345 532,312 L532,230 Q545,188 560,192Z';
/** A cavity's path has a real hole for its organ; lighting the space never lights the organ. */
export function cavityGeometry(stage: number): Record<string, Geometry> {
  return {
    cavities: {
      // Week 3–4, seen from above on the disc: the horseshoe, its bend at the head end, open at both caudal limbs.
      coelom: {
        d:
          stage === 0
            ? 'M330,600 L330,270 Q330,120 480,120 Q630,120 630,270 L630,600 L566,600 L566,280 Q566,190 480,190 Q394,190 394,280 L394,600 Z'
            : 'M360,160 Q480,60 600,160 L620,570 Q480,685 340,570Z',
        label: [20, 155],
        fill: true,
        width: 1,
      },
      pericardial: {
        d:
          stage < 2
            ? `M355,155 Q480,80 605,155 L605,420 Q480,490 355,420Z ${heart}`
            : `M433,286 Q480,255 527,286 Q568,315 540,365 L480,418 L420,365 Q395,315 433,286Z ${heart}`,
        label: [20, 340],
        fill: true,
        width: 1,
      },
      pleuralR: {
        d: `M370,155 Q390,120 433,158 L442,280 Q435,347 397,363 Q353,335 350,270Z ${lungR}`,
        label: [20, 180],
        fill: true,
        width: 1,
      },
      pleuralL: {
        d: `M590,155 Q570,120 527,158 L518,280 Q525,347 563,363 Q607,335 610,270Z ${lungL}`,
        label: [630, 180],
        fill: true,
        width: 1,
      },
      peritoneal: {
        d: 'M360,540 Q480,500 600,540 L600,635 Q480,690 360,635Z M457,565 Q480,540 503,565 L503,620 Q480,645 457,620Z',
        label: [630, 580],
        fill: true,
        width: 1,
      },
      canalR: { d: 'M345,405 Q330,465 345,535', label: [20, 480], width: 15 },
      canalL: { d: 'M615,405 Q636,465 615,535', label: [630, 465], width: 19 },
      ppR: { d: stage >= 4 ? 'M415,290 Q398,325 420,365 L480,418' : 'M350,350 Q380,360 420,365', label: [20, 270], width: 7 },
      ppL: { d: stage >= 4 ? 'M545,290 Q562,325 540,365 L480,418' : 'M610,350 Q580,360 540,365', label: [630, 270], width: 7 },
    },
    diaphragm: {
      septum: {
        d:
          stage >= 4
            ? 'M385,365 Q480,340 575,365 Q590,430 540,470 Q480,515 420,470 Q370,430 385,365Z'
            : 'M405,370 Q480,340 555,370 L555,448 Q480,485 405,448Z',
        label: [20, 325],
        fill: true,
        width: 2,
      },
      poR: {
        d:
          stage >= 4
            ? 'M385,250 Q414,233 444,230 L444,300 Q430,330 480,350 Q430,348 385,365 Q370,310 385,250Z'
            : 'M385,250 Q370,310 405,370 L446,365 L430,265Z',
        label: [20, 445],
        fill: true,
        width: 2,
      },
      poL: {
        d:
          stage >= 4
            ? 'M575,250 Q546,233 516,230 L516,300 Q530,330 480,350 Q530,348 575,365 Q590,310 575,250Z'
            : 'M575,250 Q590,310 555,370 L514,365 L530,265Z',
        label: [630, 445],
        fill: true,
        width: 2,
      },
      esophageal: {
        d:
          stage >= 4
            ? 'M444,230 Q480,210 516,230 L516,300 Q530,330 480,350 Q430,330 444,300Z'
            : 'M444,250 Q480,225 516,250 L530,315 L504,330 L492,275 L468,275 L456,330 L430,315Z',
        label: [630, 115],
        fill: true,
        width: 2,
      },
      peripheral: {
        d: 'M350,235 Q480,130 610,235 Q660,430 550,530 Q480,565 410,530 Q300,430 350,235Z M385,250 Q480,200 575,250 Q610,405 540,470 Q480,515 420,470 Q350,405 385,250Z',
        label: [20, 580],
        fill: true,
        width: 2,
      },
    },
    serosa: {
      parietal: { d: 'M355,170 Q480,95 605,170 L605,565 Q480,650 355,565Z', label: [20, 170], width: 10 },
      visceral: { d: 'M450,380 Q480,345 510,380 L510,480 Q480,515 450,480Z', label: [630, 420], width: 9 },
      mesentery: { d: 'M468,136 L468,355 M492,136 L492,355', label: [630, 215], width: 6 },
    },
  };
}
const names = { cavities: 'Barrunbeen banaketa', diaphragm: 'Diafragmaren lau jatorriak', serosa: 'Serosa eta mesenterioa' };
export function CavityDiagram(props: DiagramProps) {
  const [chosen, setChosen] = useState<string | null>(null);
  const geometry = cavityGeometry(props.stage);
  const relevant = Object.keys(geometry).filter((g) => Object.keys(geometry[g]).some((k) => props.lit.has(k)));
  const groups = relevant.length ? relevant : [chosen ?? (props.stage >= 3 ? 'diaphragm' : 'cavities')];
  return (
    <div>
      {!props.mini && (
        <div className={extra.panelTabs} role="group" aria-label="Barrunbeen ikuspegia">
          {Object.entries(names).map(([g, name]) => (
            <button
              key={g}
              type="button"
              className={`${styles.pick}${groups.includes(g) ? ` ${styles.on}` : ''}`}
              aria-pressed={groups.includes(g)}
              disabled={!!props.lit.size && !groups.includes(g)}
              onClick={() => setChosen(g)}
            >
              {name}
            </button>
          ))}
        </div>
      )}
      {groups.map((g) => (
        <PieceDiagram
          {...props}
          key={g}
          data={CAVITIES}
          geometry={geometry[g]}
          title={names[g as keyof typeof names]}
          caption={
            g === 'diaphragm'
              ? 'Diafragma goitik: enbrioiaren eskuina zure ezkerrean; aurrea behean. Kolorea = lau jatorriak.'
              : 'Aurretik: enbrioiaren eskuina zure ezkerrean. Barrunbeen ikuspegia maila desberdinen mapa da; serosa, zeharkako ebakia.'
          }
        >
          <g>
            {g === 'cavities' && (
              <>
                {props.stage === 0 ? (
                  <>
                    <ellipse cx="480" cy="390" rx="210" ry="300" fill="#5a3644" opacity=".35" />
                    <text x="480" y="160" textAnchor="middle" className={extra.small}>
                      buru aldea: bihotz eremua
                    </text>
                    <text x="480" y="660" textAnchor="middle" className={extra.small}>
                      bi muturretan zabalik: enbrioz kanpoko zelomarekin jarraitua
                    </text>
                    <text x="480" y="400" textAnchor="middle" className={extra.small}>
                      enbrioi-diskoa goitik
                    </text>
                  </>
                ) : (
                  <path d="M337,145 Q480,50 623,145 L650,635 Q480,735 310,635Z" fill="#5a3644" opacity=".35" />
                )}
                {props.stage > 0 && (
                  <>
                    <path d="M360,490 Q480,450 600,490" stroke="#f2a65a" strokeWidth="14" opacity=".32" />
                    <path d={heart} fill="#c62d42" />
                    {props.stage >= 2 && (
                      <>
                        <path d={lungR} fill="#d97a93" />
                        <path d={lungL} fill="#d97a93" />
                      </>
                    )}
                    <path d="M457,565 Q480,540 503,565 L503,620 Q480,645 457,620Z" fill="#f2c14e" />
                  </>
                )}
                {props.stage > 0 && (
                  <>
                    <text x="480" y="105" textAnchor="middle" className={extra.small}>
                      toraxa
                    </text>
                    <text x="480" y="710" textAnchor="middle" className={extra.small}>
                      abdomena
                    </text>
                  </>
                )}
              </>
            )}
            {g === 'diaphragm' && (
              <>
                <path d="M350,235 Q480,130 610,235 Q660,430 550,530 Q480,565 410,530 Q300,430 350,235Z" fill="#46293a" opacity=".5" />
                <text x="480" y="80" textAnchor="middle" className={extra.small}>
                  atzeko aldea · ornoak
                </text>
                <text x="480" y="655" textAnchor="middle" className={extra.small}>
                  aurrea · bularrezurra
                </text>
              </>
            )}
            {g === 'serosa' && (
              <>
                <path d="M325,145 Q480,60 635,145 L635,590 Q480,690 325,590Z" fill="#5a3644" opacity=".25" />
                <path d="M452,380 Q480,345 508,380 L508,480 Q480,515 452,480Z" fill="#f2c14e" opacity=".8" />
                <text x="480" y="435" textAnchor="middle" className={extra.small}>
                  hestea
                </text>
                <text x="480" y="80" textAnchor="middle" className={extra.small}>
                  atzeko pareta
                </text>
              </>
            )}
          </g>
        </PieceDiagram>
      ))}
    </div>
  );
}
