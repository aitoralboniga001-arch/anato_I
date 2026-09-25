'use client';

import { Label, Note, Part, lerp, lerpPt, seg, type Pt, type SceneProps } from '@/components/kit';
import { AgeHud, ramp } from './skin';
import { LEN, WT, fmtWeight, interp } from './growth';
import { FetusFigure, fetusGeom, placeFetus, type FetusPose } from './FetusFigure';

/**
 * Fetal period (topic 5, §2), drawn like the course figures (fetuses of 9–38 weeks, side view
 * facing right, curled) and TO SCALE inside each stage: the ruler and the length/weight
 * read-outs come from the notes' table ("Enbrio aroko luzeera eta pisuen gehikuntza").
 * The fetus moves: kicks, hand-to-mouth (sucking) and breathing movements.
 */

const weekOf = (day: number) => Math.max(9, day / 7);

const CX = 500;
const CY = 330;

/** The figure placed so its vertex–rump length is the table's length at `pxcm` px per cm. */
function place(day: number, pxcm: number) {
  const cm = interp(LEN, weekOf(day));
  return { cm, ...placeFetus(cm, pxcm, CX, CY) };
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

const vis = (t: number, a: number, b = 2) => Math.min(a <= 0 ? 1 : seg(t, a, a + 0.03), 1 - seg(t, b - 0.03, b));
/** A burst of kicks between a and b (0..1, smooth). */
const kicks = (t: number, a: number, b: number, rate = 40) => Math.max(0, Math.sin(t * rate)) ** 3 * Math.min(seg(t, a, a + 0.02), 1 - seg(t, b - 0.02, b));

/** Always-on small movements; `sucking` and `breathing` switch on the rhythmic ones. */
function motion(t: number, o: { kick?: number; sucking?: number; breathing?: number; rest?: number }): FetusPose {
  const { kick = 0, sucking = 0, breathing = 0, rest = 0.6 } = o;
  return {
    kick,
    suck: lerp(rest, 0.85 + 0.15 * Math.sin(t * 90), sucking),
    breathe: breathing * Math.sin(t * 55),
    nod: 2.5 * Math.sin(t * 13) + 2 * sucking * Math.sin(t * 90),
  };
}

function Fetus({ id, day, pose, Pl, hernia, vernix }: { id: string; day: number; pose: FetusPose; Pl: ReturnType<typeof place>; hernia?: number; vernix?: number }) {
  return (
    <g>
      <g transform={Pl.transform}>
        <FetusFigure id={id} week={weekOf(day)} pose={pose} s={Pl.s} hernia={hernia} vernix={vernix} />
      </g>
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
  const pose = motion(t, { kick: kicks(t, 0.86, 1.02), rest: 0.35 });
  const Pl = place(day, 58);
  const g = fetusGeom(weekOf(day), pose);
  const x = Pl.xf;
  const hernia = 1 - ramp(day, 79, 84);
  const gen = x([g.hip[0] + 8, g.hip[1] + g.wL * 1.6]);
  const skull = x(g.turn([g.Hc[0] - g.R * 0.25, g.Hc[1] - g.R * 0.5]));
  const femur = x(g.femur);
  const loops = x([g.cordBase[0] + 3, g.cordBase[1] + 1]);
  const arm = x(lerpPt(g.arm.a, g.arm.j, 0.5));
  const oss = vis(t, 0.46, 0.6);
  return (
    <g>
      <Fetus id="w5f3" day={day} pose={pose} Pl={Pl} hernia={hernia} />
      {/* Ossification centres: skull bones and long bones start to ossify */}
      {oss > 0.01 && (
        <g opacity={oss} pointerEvents="none">
          <g transform={Pl.transform}>
            {[
              [-0.35, -0.55, 0.32],
              [0.25, -0.62, 0.26],
              [-0.62, 0.05, 0.22],
            ].map(([dx, dy, r], i) => {
              const c = g.turn([g.Hc[0] + dx * g.R, g.Hc[1] + dy * g.R]);
              return <circle key={i} cx={c[0]} cy={c[1]} r={r * g.R} fill="#fff6e8" opacity={0.45} stroke="#f6e3c8" strokeWidth={0.4} strokeDasharray="1 0.8" />;
            })}
            {[
              [g.leg.a, g.leg.j],
              [g.leg.j, g.leg.end],
              [g.arm.a, g.arm.j],
              [g.arm.j, g.arm.end],
            ].map(([p, q], i) => {
              const u = lerpPt(p, q, 0.3);
              const v = lerpPt(p, q, 0.7);
              return <line key={i} x1={u[0]} y1={u[1]} x2={v[0]} y2={v[1]} stroke="#fff6e8" strokeWidth={i < 2 ? 2.2 : 1.6} strokeLinecap="round" opacity={0.75} />;
            })}
          </g>
        </g>
      )}
      <Ruler pxcm={58} step={1} max={8} />

      <Label id="begia" x={790} y={200} ax={x(g.eye)[0] + 4} ay={x(g.eye)[1]} show={vis(t, 0.16)} />
      <Label id="sudurra" x={790} y={250} ax={x(g.nose)[0] + 2} ay={x(g.nose)[1]} show={vis(t, 0.16)} />
      <Label id="belarriaren-pabiloia" x={230} y={230} ax={x(g.ear)[0] - 6} ay={x(g.ear)[1]} show={vis(t, 0.16)} />
      <Label id="besoa" x={230} y={330} ax={arm[0]} ay={arm[1]} show={vis(t, 0.32, 0.46)} />
      <Label id="izterra" x={230} y={420} ax={femur[0]} ay={femur[1]} show={vis(t, 0.32, 0.46)} />
      <Label id="hezurtzapen-zentroak" x={230} y={420} ax={femur[0]} ay={femur[1]} show={oss} />
      <Label id="hezurtzapen-zentroak" text="Garezurreko hezurrak" x={230} y={120} ax={skull[0]} ay={skull[1]} show={oss} />
      <Label id="zilbor-ernia-fisiologikoa" x={790} y={390} ax={loops[0] + 8} ay={loops[1]} show={vis(t, 0.6, 0.86)} />
      <Label id="heste-lakioak" x={790} y={440} ax={loops[0] + 4} ay={loops[1] + 6} show={vis(t, 0.6, 0.76)} />
      <Label id="kanpoko-genitalak" x={790} y={500} ax={gen[0]} ay={gen[1]} show={vis(t, 0.86)} />
      <Label id="aktibitate-muskularra" x={790} y={550} ax={x(g.foot)[0] + 8} ay={x(g.foot)[1]} show={vis(t, 0.86)} />
      <Note x={40} y={520} align="start" tone="accent" show={vis(t, 0.74, 0.86)}>
        12. astea: lakioak barrunbe abdominalean
      </Note>

      <Readout day={day} />
    </g>
  );
}

export function Fetus4to5({ t }: SceneProps) {
  const day = lerp(85, 140, seg(t, 0, 0.9, (k) => k));
  const pose = motion(t, { kick: kicks(t, 0.76, 1.02, 34), breathing: seg(t, 0.1, 0.2), sucking: 0.4 * seg(t, 0.3, 0.4), rest: 0.55 });
  const Pl = place(day, 26);
  const g = fetusGeom(weekOf(day), pose);
  const x = Pl.xf;
  const scalp = x(g.scalp);
  const back = x([g.back[0] + 3, g.back[1]]);
  return (
    <g>
      <Fetus id="w5f45" day={day} pose={pose} Pl={Pl} />
      <Ruler pxcm={26} step={1} max={20} />
      <CrlLine a={Pl.vertex} b={Pl.rump} show={1} />

      <Label id="luzera-zefalokaudala" x={230} y={470} ax={lerp(Pl.vertex[0], Pl.rump[0], 0.6)} ay={lerp(Pl.vertex[1], Pl.rump[1], 0.6)} />
      <Label id="buruko-ilea" x={230} y={120} ax={scalp[0]} ay={scalp[1]} show={vis(t, 0.52)} />
      <Label id="bekainak" x={790} y={200} ax={x(g.brow)[0] + 4} ay={x(g.brow)[1]} show={vis(t, 0.52)} />
      <Label id="lanugoa" x={230} y={360} ax={back[0]} ay={back[1]} show={vis(t, 0.52)} />
      <Label id="aktibitate-muskularra" x={790} y={500} ax={x(g.foot)[0] + 6} ay={x(g.foot)[1]} show={vis(t, 0.76)} />
      <Note x={40} y={520} align="start" tone="accent" show={vis(t, 0.28, 0.52)}>
        5. hilabetearen bukaeran: ~15 cm · ~500 g
      </Note>

      <Readout day={day} />
    </g>
  );
}

export function Fetus6to9({ t }: SceneProps) {
  const day = lerp(141, 266, seg(t, 0, 0.9, (k) => k));
  const sucking = seg(t, 0.06, 0.12) * (1 - seg(t, 0.5, 0.52)) + seg(t, 0.64, 0.7);
  const pose = motion(t, { kick: kicks(t, 0.5, 0.62, 30), breathing: 1, sucking, rest: 0.7 });
  const Pl = place(day, 14);
  const g = fetusGeom(weekOf(day), pose);
  const x = Pl.xf;
  const flank = x([g.trunk[3][0] + 4, g.trunk[3][1]]);
  const fatP = x([g.trunk[5][0] + 4, g.trunk[5][1]]);
  const vern = x([g.trunk[2][0] + 3, g.trunk[2][1]]);
  const hair = x(g.scalp);
  return (
    <g>
      <Fetus id="w5f69" day={day} pose={pose} Pl={Pl} vernix={ramp(day, 224, 250)} />
      <Ruler pxcm={14} step={1} max={36} />
      <CrlLine a={Pl.vertex} b={Pl.rump} show={vis(t, 0.86)} />

      <Label id="gantz-metaketa" text="Larruazala ximurra eta gorrixka" x={230} y={440} ax={flank[0]} ay={flank[1]} show={vis(t, 0.16, 0.3)} />
      <Label id="gantz-metaketa" x={230} y={470} ax={fatP[0]} ay={fatP[1]} show={vis(t, 0.58)} />
      <Label id="vernix-caseosa" x={230} y={300} ax={vern[0]} ay={vern[1]} show={vis(t, 0.72)} />
      <Label id="lanugoa" x={230} y={150} ax={hair[0]} ay={hair[1]} show={vis(t, 0, 0.16)} />
      <Label id="luzera-zefalokaudala" x={790} y={540} ax={lerp(Pl.vertex[0], Pl.rump[0], 0.6)} ay={lerp(Pl.vertex[1], Pl.rump[1], 0.6)} show={vis(t, 0.86)} />

      <Note x={40} y={520} align="start" tone="warn" show={vis(t, 0.3, 0.44)}>
        6. hilabetea: bizirautea zaila
      </Note>
      <Note x={40} y={520} align="start" tone="accent" show={vis(t, 0.44, 0.58)}>
        7. hilabetea: bizirautea ~%90
      </Note>
      <Note x={40} y={520} align="start" tone="accent" show={vis(t, 0.86)}>
        Vertex–orpo: 40–50 cm
      </Note>

      <Readout day={day} />
    </g>
  );
}

// ---------------------------------------------------------------------------

/** The course figure "A 9 · B 12 · C 20 · D 28 · E 38 astea": fetuses drawn to the same scale. */
const LINEUP: { tag: string; week: number; x: number }[] = [
  { tag: 'A', week: 9, x: 72 },
  { tag: 'B', week: 12, x: 158 },
  { tag: 'C', week: 20, x: 305 },
  { tag: 'D', week: 28, x: 520 },
  { tag: 'E', week: 38, x: 790 },
];
const LINE_PX = 11;
const BASE = 522;

export function FetusLineup({ t }: SceneProps) {
  return (
    <g>
      <line x1={40} x2={960} y1={BASE + 6} y2={BASE + 6} stroke="rgba(255,255,255,0.08)" />
      {LINEUP.map((f, i) => {
        const show = vis(t, i * 0.1);
        if (show < 0.01) return null;
        const cm = interp(LEN, f.week);
        const ph = t * 60 + i * 1.7;
        const pose = {
          breathe: Math.sin(ph),
          suck: 0.8 + 0.2 * Math.sin(ph * 0.8),
          kick: Math.max(0, Math.sin(t * 26 + i * 2.3)) ** 8 * 0.55,
          nod: 3 * Math.sin(ph * 0.3),
        };
        const Pl = placeFetus(cm, LINE_PX, f.x, BASE, true);
        return (
          <g key={f.tag} opacity={show}>
            <g transform={Pl.transform}>
              <FetusFigure id={`w5l${i}`} week={f.week} pose={pose} s={Pl.s} hernia={f.week <= 10 ? 1 : 0} vernix={f.week >= 36 ? 0.7 : 0} />
            </g>
            <text x={f.x} y={BASE + 36} textAnchor="middle" fontSize={15} fontWeight={600} fill="#f1eee8">
              <tspan fill="#ff8f7a">{f.tag}</tspan>
              {`  ${f.week}. astea`}
            </text>
            <text x={f.x} y={BASE + 56} textAnchor="middle" fontSize={12} fill="#7c7870" style={{ fontVariantNumeric: 'tabular-nums' }}>
              {`${cm.toFixed(0)} cm`}
            </text>
          </g>
        );
      })}
      <Note x={500} y={612} show={vis(t, 0.55)}>
        Eskala berean: buruaren tamaina erlatiboa txikitu egiten da (3. hilabetean ½, jaiotzean ¼)
      </Note>
    </g>
  );
}
