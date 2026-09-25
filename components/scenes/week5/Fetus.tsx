'use client';

import { Label, Note, Part, lerp, seg, type Pt, type SceneProps } from '@/components/kit';
import { EmbryoFigure, embryoGeom } from './Embryo';
import { AgeHud, polar, spineAt } from './skin';
import { LEN, WT, fmtWeight, interp } from './growth';

/**
 * Fetal period (topic 5, §2): the same body as the embryo scenes, continued from week 9 to
 * birth and drawn TO SCALE inside each stage: the ruler and the length/weight read-outs come
 * from the notes' table ("Enbrio aroko luzeera eta pisuen gehikuntza").
 */

const weekOf = (day: number) => Math.max(9, day / 7);

const CX = 520;
const CY = 330;

/** Placement of the normalised figure so its vertex–rump length equals `cm` at `pxcm` px per cm. */
function placement(day: number, pxcm: number) {
  const { b, S } = embryoGeom(day);
  const vertex = polar(b.cran, -104, b.cran[3]);
  const rump = spineAt(S, 0.84).p;
  const local = Math.hypot(rump[0] - vertex[0], rump[1] - vertex[1]);
  const cm = interp(LEN, weekOf(day));
  const s = (cm * pxcm) / local;
  const m: Pt = [(vertex[0] + rump[0]) / 2, (vertex[1] + rump[1]) / 2];
  const xf = (p: readonly number[]): Pt => [CX + (p[0] - m[0]) * s, CY + (p[1] - m[1]) * s];
  return { s, m, xf, vertex: xf(vertex), rump: xf(rump), cm };
}

function Ruler({ pxcm, step, max }: { pxcm: number; step: number; max: number }) {
  const x = 960;
  const y0 = 600;
  const ticks = [];
  for (let c = 0; c <= max; c += step) ticks.push(c);
  return (
    <g pointerEvents="none">
      <line x1={x} y1={y0} x2={x} y2={y0 - max * pxcm} stroke="rgba(255,255,255,0.18)" />
      {ticks.map((c) => (
        <g key={c}>
          <line x1={x - (c % (step * 5) === 0 ? 10 : 5)} x2={x} y1={y0 - c * pxcm} y2={y0 - c * pxcm} stroke="rgba(255,255,255,0.3)" />
          {c % (step * 5) === 0 && (
            <text x={x - 14} y={y0 - c * pxcm} dy="0.35em" textAnchor="end" fill="#7c7870" fontSize={10} style={{ fontVariantNumeric: 'tabular-nums' }}>
              {c}
            </text>
          )}
        </g>
      ))}
      <text x={x} y={y0 + 18} textAnchor="end" fill="#7c7870" fontSize={10} letterSpacing="0.1em">
        CM
      </text>
    </g>
  );
}

/** Week, length and weight read-out from the notes' table. */
function Readout({ day }: { day: number }) {
  const w = weekOf(day);
  const cm = interp(LEN, w);
  const g = interp(WT, w);
  const [wv, wu] = fmtWeight(g);
  return (
    <g pointerEvents="none">
      <AgeHud value={Math.min(38, Math.ceil(day / 7))} unit=". astea" caption="Fetuaren adina" />
      {[
        ['Luzera', cm.toFixed(0), ' cm'],
        ['Pisua', wv, wu],
      ].map(([k, v, u], i) => (
        <g key={k as string} transform={`translate(${170 + i * 110} 0)`}>
          <text x={0} y={572} fill="#7c7870" fontSize={11} letterSpacing="0.12em" style={{ textTransform: 'uppercase' }}>
            {k}
          </text>
          <text x={0} y={606} fill="#f1eee8" fontSize={24} fontWeight={600} style={{ fontVariantNumeric: 'tabular-nums' }}>
            {v}
            <tspan fill="#b4afa6" fontSize={14} fontWeight={500}>
              {u}
            </tspan>
          </text>
        </g>
      ))}
    </g>
  );
}

function CrlLine({ a, b, show }: { a: Pt; b: Pt; show: number }) {
  if (show < 0.02) return null;
  return (
    <Part id="luzera-zefalokaudala" show={show}>
      <path d={`M${a[0]},${a[1]} L${b[0]},${b[1]}`} stroke="#ffb86b" strokeWidth={2} strokeDasharray="7 6" />
      <circle cx={a[0]} cy={a[1]} r={4.5} fill="#ffb86b" />
      <circle cx={b[0]} cy={b[1]} r={4.5} fill="#ffb86b" />
    </Part>
  );
}

const vis = (t: number, a: number, b = 2) => Math.min(seg(t, a, a + 0.03), 1 - seg(t, b - 0.03, b));
const kickAt = (t: number, a: number, b: number) => Math.sin(t * 260) * Math.min(seg(t, a, a + 0.02), 1 - seg(t, b - 0.02, b));

function Figure({ day, kick, P }: { day: number; kick: number; P: ReturnType<typeof placement> }) {
  return (
    <g transform={`translate(${CX} ${CY}) scale(${P.s}) translate(${-P.m[0]} ${-P.m[1]})`}>
      <EmbryoFigure day={day} kick={kick} />
    </g>
  );
}

// ---------------------------------------------------------------------------

const D3: [number, number][] = [[0, 63], [0.16, 77], [0.6, 80], [0.74, 84], [1, 84]];
const dayOf = (tab: [number, number][], t: number) => {
  for (let i = 0; i < tab.length - 1; i++) if (t <= tab[i + 1][0]) return lerp(tab[i][1], tab[i + 1][1], seg(t, tab[i][0], tab[i + 1][0]));
  return tab[tab.length - 1][1];
};

export function Fetus3rdMonth({ t }: SceneProps) {
  const day = dayOf(D3, t);
  const kick = kickAt(t, 0.86, 1.02);
  const P = placement(day, 58);
  const { b, arm, leg } = embryoGeom(day, kick);
  const x = P.xf;
  const cord = b.cord;
  const herniaC = polar(cord, cord[2], cord[3] * 0.32);
  const genP: Pt = [lerp(b.leg[0], cord[0], 0.5) - 6, lerp(b.leg[1], cord[1], 0.5) + 14];
  const femur = x([lerp(leg.joints.prox[0], leg.joints.mid[0], 0.55), lerp(leg.joints.prox[1], leg.joints.mid[1], 0.55)]);
  const skull = x(polar(b.cran, -95, b.cran[2] * 0.62));
  const loops = x(polar(cord, cord[2], cord[3] * 0.4));
  return (
    <g>
      <Figure day={day} kick={kick} P={P} />
      <Ruler pxcm={58} step={1} max={8} />

      <Label id="begia" x={250} y={210} ax={x(b.eye)[0] - 6} ay={x(b.eye)[1]} show={vis(t, 0.16)} />
      <Label id="sudurra" x={250} y={262} ax={x(b.nose)[0] - 2} ay={x(b.nose)[1]} show={vis(t, 0.16)} />
      <Label id="belarriaren-pabiloia" x={790} y={150} ax={x(b.ear)[0] + 8} ay={x(b.ear)[1]} show={vis(t, 0.16)} />
      <Label id="besoa" x={790} y={250} ax={x(arm.joints.mid)[0]} ay={x(arm.joints.mid)[1] - 4} show={vis(t, 0.32, 0.46)} />
      <Label id="izterra" x={790} y={420} ax={x(leg.joints.mid)[0] + 4} ay={x(leg.joints.mid)[1]} show={vis(t, 0.32, 0.46)} />
      <Label id="hezurtzapen-zentroak" x={790} y={470} ax={femur[0]} ay={femur[1]} show={vis(t, 0.46, 0.6)} />
      <Label id="hezurtzapen-zentroak" text="Garezurreko hezurrak" x={790} y={90} ax={skull[0]} ay={skull[1]} show={vis(t, 0.46, 0.6)} />
      <Label id="zilbor-ernia-fisiologikoa" x={250} y={395} ax={x(herniaC)[0] - 8} ay={x(herniaC)[1]} show={vis(t, 0.6, 0.86)} />
      <Label id="heste-lakioak" x={250} y={440} ax={loops[0]} ay={loops[1]} show={vis(t, 0.6, 0.76)} />
      <Label id="kanpoko-genitalak" x={250} y={490} ax={x(genP)[0]} ay={x(genP)[1]} show={vis(t, 0.86)} />
      <Label id="aktibitate-muskularra" x={790} y={520} ax={x(leg.joints.palm)[0]} ay={x(leg.joints.palm)[1]} show={vis(t, 0.86)} />
      <Note x={40} y={520} align="start" tone="accent" show={vis(t, 0.74, 0.86)}>
        12. astea: lakioak barrunbe abdominalean
      </Note>

      <Readout day={day} />
    </g>
  );
}

export function Fetus4to5({ t }: SceneProps) {
  const day = lerp(85, 140, seg(t, 0, 0.9, (k) => k));
  const kick = kickAt(t, 0.76, 1.02);
  const P = placement(day, 26);
  const { b, leg } = embryoGeom(day, kick);
  const x = P.xf;
  const brow = x([b.eye[0], b.eye[1] - 16]);
  const scalp = x(polar(b.cran, -120, b.cran[2]));
  const back = x(spineAt(embryoGeom(day).S, 0.5, -2).p);
  return (
    <g>
      <Figure day={day} kick={kick} P={P} />
      <Ruler pxcm={26} step={1} max={20} />
      <CrlLine a={P.vertex} b={P.rump} show={1} />

      <Label id="luzera-zefalokaudala" x={790} y={560} ax={lerp(P.vertex[0], P.rump[0], 0.6)} ay={lerp(P.vertex[1], P.rump[1], 0.6)} />
      <Label id="buruko-ilea" x={250} y={120} ax={scalp[0]} ay={scalp[1]} show={vis(t, 0.52)} />
      <Label id="bekainak" x={250} y={200} ax={brow[0]} ay={brow[1]} show={vis(t, 0.52)} />
      <Label id="lanugoa" x={790} y={300} ax={back[0]} ay={back[1]} show={vis(t, 0.52)} />
      <Label id="aktibitate-muskularra" x={790} y={500} ax={x(leg.joints.palm)[0]} ay={x(leg.joints.palm)[1]} show={vis(t, 0.76)} />
      <Note x={40} y={520} align="start" tone="accent" show={vis(t, 0.28, 0.52)}>
        5. hilabetearen bukaeran: ~15 cm · ~500 g
      </Note>

      <Readout day={day} />
    </g>
  );
}

export function Fetus6to9({ t }: SceneProps) {
  const day = lerp(141, 266, seg(t, 0, 0.9, (k) => k));
  const P = placement(day, 14);
  const { b, S } = embryoGeom(day);
  const x = P.xf;
  const fatP = x(spineAt(S, 0.6, 12).p);
  const vern = x(spineAt(S, 0.4, 14).p);
  const flank = x(spineAt(S, 0.46, 50).p);
  return (
    <g>
      <Figure day={day} kick={0} P={P} />
      <Ruler pxcm={14} step={1} max={36} />
      <CrlLine a={P.vertex} b={P.rump} show={vis(t, 0.86)} />

      <Label id="gantz-metaketa" text="Larruazala ximurra eta gorrixka" x={250} y={440} ax={flank[0]} ay={flank[1]} show={vis(t, 0.16, 0.3)} />
      <Label id="gantz-metaketa" x={790} y={420} ax={fatP[0]} ay={fatP[1]} show={vis(t, 0.58)} />
      <Label id="vernix-caseosa" x={790} y={250} ax={vern[0]} ay={vern[1]} show={vis(t, 0.72)} />
      <Label id="lanugoa" x={790} y={150} ax={x(polar(b.cran, -60, b.cran[2]))[0]} ay={x(polar(b.cran, -60, b.cran[2]))[1]} show={vis(t, 0, 0.16)} />
      <Label id="luzera-zefalokaudala" x={790} y={540} ax={lerp(P.vertex[0], P.rump[0], 0.6)} ay={lerp(P.vertex[1], P.rump[1], 0.6)} show={vis(t, 0.86)} />

      <Note x={40} y={480} align="start" tone="warn" show={vis(t, 0.3, 0.44)}>
        6. hilabetea: bizirautea zaila
      </Note>
      <Note x={40} y={480} align="start" tone="accent" show={vis(t, 0.44, 0.58)}>
        7. hilabetea: bizirautea ~%90
      </Note>
      <Note x={40} y={480} align="start" tone="accent" show={vis(t, 0.86)}>
        Vertex–orpo: 40–50 cm
      </Note>

      <Readout day={day} />
    </g>
  );
}
