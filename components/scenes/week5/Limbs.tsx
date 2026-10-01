'use client';

import { Label, Note, Part, lerp, seg, type Pt, type SceneProps } from '@/components/kit';
import { AgeHud, PlateMask, SKIN, SkinDefs, limbGeom, ramp, type LimbGeom } from './skin';

/**
 * Stage `gorputz-adarrak` — upper and lower limb side by side on the same day, so the 1–2 day
 * delay of the lower limb is visible at every moment. Bud → 1st constriction (proximal/distal)
 * → hand/foot plate with 4 grooves → digital rays → 2nd constriction (3 segments, joints).
 */

// Development index per day (same scale as the whole-embryo scenes).
const DEV_ARM: [number, number][] = [[28, 0.75], [32, 1.1], [42, 2.25], [48, 3.25], [56, 4]];
const DEV_LEG: [number, number][] = [[28, 0.25], [32, 0.9], [42, 1.9], [48, 2.9], [56, 3.9]];
const devAt = (tab: [number, number][], day: number) => {
  if (day <= tab[0][0]) return tab[0][1];
  for (let i = 0; i < tab.length - 1; i++) if (day <= tab[i + 1][0]) return lerp(tab[i][1], tab[i + 1][1], (day - tab[i][0]) / (tab[i + 1][0] - tab[i][0]));
  return tab[tab.length - 1][1];
};

// Stage time → day (beats: 0 bud, .18 1st constriction, .34 plates, .5 rays, .66 2nd constriction, .84 joints).
// The ruler reads 42 at the first-constriction step and ~48-49 when the second constriction is shown, as in the notes.
const DAYS: [number, number][] = [[0, 29], [0.16, 38], [0.3, 42], [0.46, 44], [0.62, 46.5], [0.8, 48.6], [1, 56]];
const dayAt = (t: number) => {
  for (let i = 0; i < DAYS.length - 1; i++) if (t <= DAYS[i + 1][0]) return lerp(DAYS[i][1], DAYS[i + 1][1], seg(t, DAYS[i][0], DAYS[i + 1][0], (k) => k));
  return 56;
};

const ARM_ROOT: Pt = [300, 118];
const LEG_ROOT: Pt = [700, 118];

const mid = (a: Pt, b: Pt, k = 0.5): Pt => [lerp(a[0], b[0], k), lerp(a[1], b[1], k)];

function Panel({ g, root, id, plateId, day, lag }: { g: LimbGeom; root: Pt; id: string; plateId: string; day: number; lag: number }) {
  const plate = ramp(day, 38 + lag, 41 + lag);
  const rw = g.w * 0.075;
  return (
    <g>
      <g filter="url(#w5l-sculpt)" fill="url(#w5l-skin)">
        {/* Slice of the body wall the limb grows out of. */}
        <ellipse cx={root[0]} cy={root[1] - 70} rx={185} ry={86} />
        <path d={g.body} />
        {g.hand && <path d={g.hand} />}
        {g.digitA > 0.02 && (
          <g stroke="url(#w5l-skin)" strokeWidth={g.digitW} strokeLinecap="round">
            {g.digits.map(([a, b], i) => (
              <path key={i} d={`M${a[0]},${a[1]} L${b[0]},${b[1]}`} />
            ))}
          </g>
        )}
      </g>
      <Part id={id} show={1 - plate}>
        <path d={g.body} fill="rgba(255,255,255,0.001)" />
      </Part>
      {g.hand && (
        <Part id={plateId} show={plate}>
          <path d={g.hand} fill="rgba(255,255,255,0.001)" />
        </Part>
      )}
      <defs>
        <PlateMask id={`${id}-marks`} g={g} inset={rw / 2 + 3} />
      </defs>
      <g mask={`url(#${id}-marks)`}>
        {g.rayA > 0.02 && (
          <Part id="hatzetako-izpiak" show={g.rayA}>
            {g.rays.map(([a, b], i) => (
              <path key={i} d={`M${a[0]},${a[1]} L${b[0]},${b[1]}`} stroke={SKIN.light} strokeWidth={rw} strokeLinecap="round" opacity={0.55} />
            ))}
          </Part>
        )}
        {g.grooveA > 0.02 && (
          <Part id="izpiarteko-ildoak" show={g.grooveA}>
            {g.grooves.map(([a, b], i) => (
              <path key={i} d={`M${a[0]},${a[1]} L${b[0]},${b[1]}`} stroke={SKIN.line} strokeWidth={2.4} strokeLinecap="round" />
            ))}
          </Part>
        )}
      </g>
    </g>
  );
}

function Joint({ id, p, show }: { id: string; p: Pt; show: number }) {
  if (show < 0.02) return null;
  return (
    <Part id={id} show={show}>
      <circle cx={p[0]} cy={p[1]} r={9} fill="none" stroke="#ffb86b" strokeWidth={1.6} strokeDasharray="3 3" />
    </Part>
  );
}

const SPAN_MIN = 172;
const SPAN_MAX = 846;
const spanX = (a: Pt, b: Pt, side: number) => {
  const x0 = Math.min(a[0], b[0]) * (side < 0 ? 1 : 0) + Math.max(a[0], b[0]) * (side > 0 ? 1 : 0) + side * 70;
  return side < 0 ? Math.max(x0, SPAN_MIN) : Math.min(x0, SPAN_MAX);
};

/** Bracket beside a segment (proximal / distal, arm / forearm / hand…). */
function Span({ id, a, b, side, show }: { id: string; a: Pt; b: Pt; side: number; show: number }) {
  if (show < 0.02) return null;
  // Beside the segment, but never out into the label column (the spread hand/foot would push it there).
  const x = spanX(a, b, side);
  return (
    <Part id={id} show={show}>
      <path d={`M${x - side * 6},${a[1]} L${x},${a[1]} L${x},${b[1]} L${x - side * 6},${b[1]}`} fill="none" stroke="#b4afa6" strokeWidth={1.4} />
    </Part>
  );
}

export function LimbDevelopment({ t }: SceneProps) {
  const day = dayAt(t);
  const arm = limbGeom({ root: ARM_ROOT, a: [88, 114, 104], len: 340, dev: devAt(DEV_ARM, day), w: 100 });
  const leg = limbGeom({ root: LEG_ROOT, a: [92, 74, 62], len: 340, dev: devAt(DEV_LEG, day), w: 106, toes: true });
  const two = (tt: number, a: number, b = 2) => Math.min(seg(tt, a, a + 0.03), 1 - seg(tt, b - 0.03, b));
  const ertz1 = ramp(day, 38, 42);
  const ertz2 = ramp(day, 46, 49);
  const A = arm.joints;
  const L = leg.joints;
  const segs2 = two(t, 0.18, 0.66) * ertz1;
  const segs3 = two(t, 0.66) * ertz2;

  return (
    <g>
      <SkinDefs id="w5l" cx={500} cy={120} r={560} />

      <text x={300} y={34} textAnchor="middle" fill="#b4afa6" fontSize={12} letterSpacing="0.14em" style={{ textTransform: 'uppercase' }}>
        Goiko gorputz-adarra
      </text>
      <text x={700} y={34} textAnchor="middle" fill="#b4afa6" fontSize={12} letterSpacing="0.14em" style={{ textTransform: 'uppercase' }}>
        Beheko gorputz-adarra
      </text>
      <line x1={500} y1={60} x2={500} y2={600} stroke="rgba(255,255,255,0.07)" />

      <Panel g={arm} root={ARM_ROOT} id="goiko-gorputz-adarraren-hasikina" plateId="esku-plaka" day={day} lag={0} />
      <Panel g={leg} root={LEG_ROOT} id="beheko-gorputz-adarraren-hasikina" plateId="oin-plaka" day={day} lag={1.5} />

      {/* First constriction: proximal vs distal (days ~38–48). */}
      <Span id="segmentu-proximala" a={A.prox} b={A.dist} side={-1} show={segs2} />
      <Span id="segmentu-distala" a={A.dist} b={A.tip} side={-1} show={segs2} />
      <Joint id="ertzadura" p={A.dist} show={segs2} />
      <Joint id="ertzadura" p={L.dist} show={segs2} />

      {/* Second constriction: three segments and their joints. */}
      <Span id="besoa" a={A.prox} b={A.mid} side={-1} show={segs3} />
      <Span id="besaurrea" a={A.mid} b={A.dist} side={-1} show={segs3} />
      <Span id="eskua" a={A.dist} b={A.tip} side={-1} show={segs3} />
      <Span id="izterra" a={L.prox} b={L.mid} side={1} show={segs3} />
      <Span id="berna" a={L.mid} b={L.dist} side={1} show={segs3} />
      <Span id="oina" a={L.dist} b={L.tip} side={1} show={segs3} />
      <Part id="atzamarrak" show={two(t, 0.9)}>
          {arm.rays.map(([, b], i) => (
            <circle key={i} cx={b[0]} cy={b[1]} r={7} fill="rgba(255,184,107,0.14)" stroke="#ffb86b" strokeWidth={1.4} strokeDasharray="3 3" />
          ))}
      </Part>
      <Part id="behatzak" show={two(t, 0.9)}>
          {leg.rays.map(([, b], i) => (
            <circle key={i} cx={b[0]} cy={b[1]} r={7} fill="rgba(255,184,107,0.14)" stroke="#ffb86b" strokeWidth={1.4} strokeDasharray="3 3" />
          ))}
      </Part>
      <Joint id="ukondoa" p={A.mid} show={two(t, 0.84) * ertz2} />
      <Joint id="eskumuturra" p={A.dist} show={two(t, 0.84)} />
      <Joint id="belauna" p={L.mid} show={two(t, 0.84) * ertz2} />
      <Joint id="orkatila" p={L.dist} show={two(t, 0.84)} />

      {/* Labels: upper limb on the left, lower limb on the right. */}
      <Label id="goiko-gorputz-adarraren-hasikina" x={300} y={300} align="middle" ax={A.tip[0]} ay={A.tip[1] - 6} show={two(t, 0, 0.18)} />
      <Label id="beheko-gorputz-adarraren-hasikina" x={700} y={330} align="middle" ax={L.tip[0]} ay={L.tip[1] - 6} show={two(t, 0, 0.18)} />
      <Label id="segmentu-proximala" x={150} y={mid(A.prox, A.dist)[1]} ax={spanX(A.prox, A.dist, -1)} ay={mid(A.prox, A.dist)[1]} show={segs2} />
      <Label id="segmentu-distala" x={150} y={mid(A.dist, A.tip)[1]} ax={spanX(A.dist, A.tip, -1)} ay={mid(A.dist, A.tip)[1]} show={segs2} />
      <Label id="ertzadura" x={850} y={L.dist[1]} ax={L.dist[0] + 10} ay={L.dist[1]} show={segs2} />
      <Label id="esku-plaka" x={150} y={A.tip[1] + 26} ax={A.palm[0] - 20} ay={A.palm[1] + 16} show={two(t, 0.34, 0.66)} />
      <Label id="oin-plaka" x={850} y={L.palm[1] + 50} ax={L.palm[0] + 20} ay={L.palm[1] + 20} show={two(t, 0.34, 0.66)} />
      <Label id="hatzetako-izpiak" x={440} y={590} ax={arm.rays[2][1][0]} ay={arm.rays[2][1][1]} show={two(t, 0.5, 0.84)} />
      <Label id="izpiarteko-ildoak" x={600} y={590} align="start" ax={leg.grooves[1][1][0]} ay={leg.grooves[1][1][1]} show={two(t, 0.5, 0.84)} />
      <Label id="besoa" x={150} y={mid(A.prox, A.mid)[1]} ax={spanX(A.prox, A.mid, -1)} ay={mid(A.prox, A.mid)[1]} show={segs3} />
      <Label id="besaurrea" x={150} y={mid(A.mid, A.dist)[1]} ax={spanX(A.mid, A.dist, -1)} ay={mid(A.mid, A.dist)[1]} show={segs3} />
      <Label id="eskua" x={150} y={mid(A.dist, A.tip)[1]} ax={spanX(A.dist, A.tip, -1)} ay={mid(A.dist, A.tip)[1]} show={segs3} />
      <Label id="izterra" x={880} y={mid(L.prox, L.mid)[1]} ax={spanX(L.prox, L.mid, 1)} ay={mid(L.prox, L.mid)[1]} show={segs3} />
      <Label id="berna" x={880} y={mid(L.mid, L.dist)[1]} ax={spanX(L.mid, L.dist, 1)} ay={mid(L.mid, L.dist)[1]} show={segs3} />
      <Label id="oina" x={880} y={mid(L.dist, L.tip)[1]} ax={spanX(L.dist, L.tip, 1)} ay={mid(L.dist, L.tip)[1]} show={segs3} />
      <Label id="ukondoa" x={A.mid[0] + 70} y={A.mid[1] - 20} align="start" ax={A.mid[0] + 10} ay={A.mid[1]} show={two(t, 0.84)} />
      <Label id="eskumuturra" x={A.dist[0] + 70} y={A.dist[1] + 4} align="start" ax={A.dist[0] + 10} ay={A.dist[1]} show={two(t, 0.84)} />
      <Label id="belauna" x={L.mid[0] - 70} y={L.mid[1] - 20} align="end" ax={L.mid[0] - 10} ay={L.mid[1]} show={two(t, 0.84)} />
      <Label id="orkatila" x={L.dist[0] - 70} y={L.dist[1] + 4} align="end" ax={L.dist[0] - 10} ay={L.dist[1]} show={two(t, 0.84)} />
      <Label id="atzamarrak" x={440} y={620} ax={arm.rays[3][1][0]} ay={arm.rays[3][1][1]} show={two(t, 0.9)} />
      <Label id="behatzak" x={560} y={620} align="start" ax={leg.rays[1][1][0]} ay={leg.rays[1][1][1]} show={two(t, 0.9)} />

      <Note x={500} y={548} tone="warn" size={12} show={two(t, 0.84)}>
        Behekoa 1–2 egun atzeratuta
      </Note>
      <AgeHud value={Math.round(day)} unit=". eguna" caption="Adina" />
    </g>
  );
}
