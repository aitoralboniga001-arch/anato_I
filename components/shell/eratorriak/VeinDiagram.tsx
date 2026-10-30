'use client';

import { useState } from 'react';
import { VEINS } from '@/content/eratorriak/veins';
import type { DiagramProps } from './kit/StudyRoom';
import { PieceDiagram, type Geometry } from './kit/PieceDiagram';
import styles from './eratorriak.module.css';
import extra from './kit/study.module.css';

/** Front view: embryo right is viewer left. All vessels stay inside x=350–610; names outside. */
export const VEIN_GEOMETRY: Record<string, Geometry> = {
  liver: {
    hcR: { d: 'M420,300 L420,140 Q420,100 460,100', label: [20, 100] },
    hcL: { d: 'M540,300 L540,140 Q540,100 500,100', label: [630, 100] },
    sinusoids: { d: 'M420,300 L455,325 L490,300 L540,330 L510,355 L455,345 L420,375 L490,385 L540,365', label: [630, 300], width: 7 },
    portal: { d: 'M420,375 Q400,430 435,470 L435,510', label: [20, 390] },
    splenic: { d: 'M435,510 Q510,495 590,510', label: [630, 480] },
    smv: { d: 'M435,510 L400,630', label: [20, 560] },
    vitDistR: { d: 'M400,630 L380,680', label: [20, 665] },
    vitDistL: { d: 'M560,630 L590,510', label: [630, 620] },
  },
  umbilical: {
    umbProxR: { d: 'M365,350 L355,180 Q355,100 400,100', label: [20, 230] },
    umbProxL: { d: 'M595,350 L610,180 Q610,100 560,100', label: [630, 170] },
    umbR: { d: 'M365,350 Q350,500 455,660', label: [20, 500] },
    umbL: { d: 'M595,350 Q610,500 505,660', label: [630, 510] },
    dv: { d: 'M595,350 Q480,390 400,300', label: [630, 350] },
  },
  cardinal: {
    acDistR: { d: 'M380,60 L380,170', label: [20, 70] },
    acDistL: { d: 'M580,60 L580,170', label: [630, 70] },
    acAn: { d: 'M580,170 Q480,190 380,170', label: [630, 180] },
    acR: { d: 'M380,170 L380,250', label: [20, 190] },
    ccR: { d: 'M380,250 Q380,310 440,310', label: [20, 300] },
    subR: { d: 'M400,390 L400,500', label: [20, 420] },
    subProxL: { d: 'M570,330 L570,390', label: [630, 300] },
    subAn: { d: 'M570,390 Q500,420 400,390', label: [630, 420] },
    subDistL: { d: 'M570,390 L590,505', label: [630, 520] },
    sacroR: { d: 'M400,500 L400,590', label: [20, 535] },
    sacroAn: { d: 'M400,590 Q490,590 580,650', label: [630, 635] },
    sacroDistR: { d: 'M400,590 L350,680', label: [20, 660] },
  },
  azygos: {
    pcR: { d: 'M400,160 Q400,100 465,100', label: [20, 80] },
    supR: { d: 'M400,160 L400,640', label: [20, 380] },
    pcDistR: { d: 'M350,250 L350,670', label: [20, 590] },
    pcDistL: { d: 'M610,250 L610,670', label: [630, 590] },
    supHighL: { d: 'M560,190 L560,310 Q490,340 400,340', label: [630, 220] },
    supLowL: { d: 'M560,620 L560,480 Q490,460 400,460', label: [630, 450] },
    hornL: { d: 'M540,95 Q520,140 480,140', label: [630, 75] },
    oblique: { d: 'M540,95 L575,40', label: [630, 135] },
  },
};
const TITLES = {
  liver: 'Bitelinoak eta gibela',
  umbilical: 'Zilbor-zainak',
  cardinal: 'Kardinalak eta kabak',
  azygos: 'Azigos eta sinu koronarioa',
};
export function VeinDiagram(props: DiagramProps) {
  const [chosen, setChosen] = useState<string | null>(null);
  const relevant = Object.keys(VEIN_GEOMETRY).filter((g) => Object.keys(VEIN_GEOMETRY[g]).some((k) => props.lit.has(k)));
  const defaults = props.stage >= 3 ? 'cardinal' : 'liver';
  const groups = relevant.length ? relevant : [chosen ?? defaults];
  return (
    <div>
      {!props.mini && (
        <div className={extra.panelTabs} role="group" aria-label="Zain eskemaren ikuspegia">
          {Object.entries(TITLES).map(([g, title]) => (
            <button
              key={g}
              type="button"
              className={`${styles.pick}${groups.includes(g) ? ` ${styles.on}` : ''}`}
              aria-pressed={groups.includes(g)}
              onClick={() => {
                setChosen(g);
              }}
              disabled={props.lit.size > 0 && !groups.includes(g)}
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
          data={VEINS}
          geometry={VEIN_GEOMETRY[g]}
          title={TITLES[g as keyof typeof TITLES]}
          caption="Aurretik ikusita: enbrioiaren eskuina zure ezkerrean. Eskema topologikoa: kolorea = jatorria; ez du oxigenazioa adierazten."
        >
          {g === 'liver' && (
            <>
              <path d="M365,280 Q490,240 590,300 L590,390 Q480,430 365,390Z" fill="#9b633c" opacity=".18" />
              <text x="480" y="265" textAnchor="middle" className={extra.small}>
                gibela
              </text>
              <ellipse cx="480" cy="460" rx="27" ry="60" fill="#f2c14e" opacity=".14" />
              <text x="480" y="550" textAnchor="middle" className={extra.small}>
                duodenoa
              </text>
            </>
          )}
          {g === 'umbilical' && (
            <>
              <path d="M385,310 Q480,260 575,320 L575,410 Q470,440 385,390Z" fill="#9b633c" opacity=".18" />
              <path d="M400,300 L400,100" fill="none" stroke="#737078" strokeWidth="7" />
              <text x="20" y="100" className={extra.small}>
                hodi hepatokardiakora
              </text>
              <text x="480" y="285" textAnchor="middle" className={extra.small}>
                gibela
              </text>
              <text x="480" y="710" textAnchor="middle" className={extra.small}>
                {props.stage === 5 ? 'zilborra' : 'karena'}
              </text>
            </>
          )}
          {g === 'cardinal' && (
            <>
              <text x="480" y="315" textAnchor="middle" className={extra.small}>
                aurikula
              </text>
              <text x="480" y="710" textAnchor="middle" className={extra.small}>
                beheko gorputz-adarrak
              </text>
            </>
          )}
        </PieceDiagram>
      ))}
    </div>
  );
}
