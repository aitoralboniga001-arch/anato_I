'use client';

import { Label, Note, Part, lerp, seg, type SceneProps } from '@/components/kit';
import { cleavageFrame } from '@/components/shell/intro/cleavage';
import { Hud, MiniTract, vis } from './common';
import { Conceptus, ConceptusDefs } from './conceptus';

/**
 * 4.3 Zigotoaren segmentazioa and 4.4 Blastozistoaren eraketa.
 * The zygote divides by mitosis while it travels down the tube: more and more, ever smaller
 * blastomeres inside a zona pellucida whose size does not change. 3rd day: morula (12–16
 * cells); 4th day: ~32 cells, outer and inner cell masses. In the uterine cavity the zona is
 * lost, fluid enters between the cells and the small spaces fuse into the blastocoel.
 */

const piece = (tab: [number, number][], t: number) => {
  for (let i = 0; i < tab.length - 1; i++) if (t <= tab[i + 1][0]) return lerp(tab[i][1], tab[i + 1][1], seg(t, tab[i][0], tab[i + 1][0]));
  return tab[tab.length - 1][1];
};

const CX = 560;
const CY = 326;
const S = 1.42;

// Stage time → engine progress (gens = 5) and development day.
// Each count holds while its step is read: 16 cells for the whole 3rd day (notes: 12–16), ~32 on the 4th.
const P_SEG: [number, number][] = [[0, 0.5], [0.1, 1], [0.26, 2], [0.4, 3], [0.52, 4], [0.66, 5], [0.86, 5], [0.93, 5.999], [1, 5.999]];
const D_SEG: [number, number][] = [[0, 0.5], [0.1, 1], [0.26, 1.25], [0.4, 2], [0.52, 2.5], [0.66, 3], [0.86, 3], [0.89, 4], [1, 4]];

const dayText = (d: number) => (d < 1 ? '12–24 ordu' : d < 1.5 ? '30 ordu' : `${Math.floor(d + 0.001)}. eguna`);

/** Stage time at which the cleavage progress first reaches `p` (inverse of P_SEG). */
const tAtP = (p: number) => {
  for (let i = 0; i < P_SEG.length - 1; i++) {
    const [t0, p0] = P_SEG[i];
    const [t1, p1] = P_SEG[i + 1];
    if (p <= p1 && p1 > p0) return lerp(t0, t1, Math.max(0, (p - p0) / (p1 - p0)));
  }
  return 1;
};

/**
 * Milestones of the cleavage, all drawn at the SAME size (the notes: the cells get smaller, the
 * structure does not grow): zygote → 2 → 4 → 8 → 16 (morula) → ~32. Each lights when reached.
 */
const TRAIL = [
  { n: 1, f: cleavageFrame(0.5, 0, 5), at: 0, cap: '' },
  { n: 2, f: cleavageFrame(2, 0, 5), at: tAtP(1.6), cap: '30 h' },
  { n: 4, f: cleavageFrame(3, 0, 5), at: tAtP(2.6), cap: '' },
  { n: 8, f: cleavageFrame(4, 0, 5), at: tAtP(3.6), cap: '' },
  { n: 16, f: cleavageFrame(5, 0, 5), at: tAtP(4.6), cap: '3. eg.' },
  { n: 32, f: cleavageFrame(6, 0, 5), at: tAtP(5.6), cap: '4. eg.' },
];

function Trail({ t }: { t: number }) {
  const X0 = 372;
  const DX = 80;
  const Y = 62;
  const cur = TRAIL.reduce((k, m, i) => (t >= m.at ? i : k), 0);
  return (
    <g pointerEvents="none">
      {TRAIL.map((m, i) => {
        const x = X0 + i * DX;
        const reached = t >= m.at;
        const now = i === cur;
        return (
          <g key={m.n}>
            {i > 0 && (
              <path d={`M${x - DX + 27},${Y} L${x - 27},${Y} M${x - 32},${Y - 3.5} L${x - 27},${Y} L${x - 32},${Y + 3.5}`} fill="none" stroke={reached ? '#8a8073' : '#3a3732'} strokeWidth={1.3} strokeLinecap="round" />
            )}
            <g opacity={reached ? 1 : 0.22}>
              <Conceptus f={m.f} x={x} y={Y} s={0.135} tiny id="w1c" />
            </g>
            <text x={x} y={Y + 34} textAnchor="middle" fontSize={12} fontWeight={now ? 700 : 600} fill={now ? '#ffb86b' : reached ? '#d8d2c8' : '#5d5952'} style={{ fontVariantNumeric: 'tabular-nums' }}>
              {m.n}
              {m.cap && (
                <tspan fill={now ? '#ffcf99' : reached ? '#8f887d' : '#4a4640'} fontSize={10} fontWeight={500} dx={4}>
                  {m.cap}
                </tspan>
              )}
            </text>
          </g>
        );
      })}
    </g>
  );
}

export function Segmentation({ t }: SceneProps) {
  const p = piece(P_SEG, t);
  const day = piece(D_SEG, t);
  const f = cleavageFrame(p, 0, 5);
  const k = Math.floor(p);
  const count = p < 1 ? 1 : 2 ** Math.min(5, k - 1 + (p - k > 0.6 ? 1 : 0));
  const mass = seg(t, 0.9, 0.97);
  const polar = 1 - seg(t, 0.62, 0.7);
  // Anchors (engine units → screen), on the drawn cells.
  const at = (x: number, y: number): [number, number] => [CX + x * S, CY + y * S];
  const cen = (c: (typeof f.cells)[number]) => (c.shape ? at(c.shape.cx, c.shape.cy) : at(c.x, c.y));
  const zona = at(141 * Math.SQRT1_2, 141 * Math.SQRT1_2);
  const pb = at(Math.cos((-83 * Math.PI) / 180) * (f.zonaR - 7.5), Math.sin((-83 * Math.PI) / 180) * (f.zonaR - 7.5));
  const one = cen(f.cells.reduce((a, c) => ((c.shape?.cx ?? c.x) < (a.shape?.cx ?? a.x) ? c : a), f.cells[0]));
  const outer = f.cells.find((c) => c.fate === 'trofoblasto' && (c.shape?.cx ?? 0) > 50 && (c.shape?.cy ?? 0) > 20) ?? f.cells[0];
  const inner = f.cells.filter((c) => c.fate === 'enbrioblasto').sort((a, b) => (a.shape?.cx ?? a.x) - (b.shape?.cx ?? b.x))[0] ?? f.cells[0];
  const morulaA = cen(f.cells.reduce((a, c) => ((c.shape?.cx ?? c.x) - (c.shape?.cy ?? c.y) * 0.3 < (a.shape?.cx ?? a.x) - (a.shape?.cy ?? a.y) * 0.3 ? c : a), f.cells[0]));
  return (
    <g>
      <ConceptusDefs />
      <Conceptus
        f={f}
        x={CX}
        y={CY}
        s={S}
        polar={polar}
        mass={mass}
        parts={{ cell: (c) => (t >= 0.86 && c.fate ? (c.fate === 'enbrioblasto' ? 'enbrioblastoa' : 'trofoblastoa') : t < 0.1 ? 'zigotoa' : t >= 0.66 ? 'morula' : 'blastomeroak') }}
      />

      <Label id="zigotoa" x={250} y={150} ax={CX - 60 * S} ay={CY - 52 * S} show={vis(t, 0, 0.12)} />
      <Label id="mintz-peluzidoa" x={800} y={470} ax={zona[0]} ay={zona[1]} />
      <Label id="gorpuskulu-polarrak" x={790} y={236} ax={pb[0]} ay={pb[1]} show={polar * vis(t, 0.1)} />
      <Label id="blastomeroak" x={250} y={250} ax={one[0]} ay={one[1]} show={vis(t, 0.14, 0.66)} />
      {/* Still a morula while its outer and inner cell masses are told (last step). */}
      <Label id="morula" x={250} y={250} ax={morulaA[0]} ay={morulaA[1]} show={vis(t, 0.66)} />
      <Label id="trofoblastoa" text="Kanpoko masa zelularra" x={800} y={380} ax={cen(outer)[0]} ay={cen(outer)[1]} show={mass} />
      <Label id="enbrioblastoa" text="Barruko masa zelularra" x={250} y={330} ax={cen(inner)[0]} ay={cen(inner)[1]} show={mass} />

      <Note x={CX} y={596} tone="accent" show={vis(t, 0.3, 0.62)}>
        Zelulak gero eta txikiagoak: egituraren tamaina ez da aldatzen
      </Note>
      <Note x={CX} y={596} tone="accent" show={vis(t, 0.66, 0.86)}>
        3. eguna: 12–16 zelula, masusta itxura → morula
      </Note>
      <Note x={CX} y={596} tone="accent" show={vis(t, 0.86)}>
        4. eguna: ~32 zelula, tronparen istmotik umetokira
      </Note>

      <Trail t={t} />
      <MiniTract day={day} />
      <Hud value={dayText(day).split(' ')[0]} unit={` ${dayText(day).split(' ').slice(1).join(' ')}`} caption="Ernalkuntzatik" second={['Zelulak', count, '']} />
    </g>
  );
}

// ---------------------------------------------------------------------------

/**
 * Stage time → blastocyst progress u (engine p = 6 + u). The zona is lost first (step .08, while
 * the ball compacts); fluid then gathers between the cells in small spaces that swell and fuse
 * (step .30); the single cavity swells into the blastocoel (step .60) and the cells settle into
 * trophoblast and embryoblast (step .72).
 */
const B_SEG: [number, number][] = [[0.08, 0], [0.28, 0.16], [0.3, 0.17], [0.58, 0.53], [0.6, 0.55], [0.71, 0.95], [0.76, 1]];
const ROT = 43; // embryonic pole up, as it will face the endometrium

const hash1 = (n: number) => {
  const v = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return v - Math.floor(v);
};

/** Specks of uterine secretion drifting in the lumen (deterministic in t). */
const SPECKS = Array.from({ length: 30 }, (_, i) => ({ x: 150 + hash1(i) * 700, y: 70 + hash1(i + 40) * 500, r: 0.9 + hash1(i + 80) * 1.6, ph: hash1(i + 120) * 6.28 }));

/** The uterine cavity it has just entered: a soft lumen, its wall a glow rather than a line. */
function Lumen({ t }: { t: number }) {
  return (
    <g pointerEvents="none">
      <defs>
        <radialGradient id="w1bl-lumen">
          <stop offset="0" stopColor="#b25266" stopOpacity="0.07" />
          <stop offset="0.78" stopColor="#b25266" stopOpacity="0.1" />
          <stop offset="0.92" stopColor="#e3899e" stopOpacity="0.17" />
          <stop offset="1" stopColor="#e3899e" stopOpacity="0" />
        </radialGradient>
      </defs>
      <ellipse cx={CX} cy={CY} rx={440} ry={292} fill="url(#w1bl-lumen)" />
      {SPECKS.map((p, i) => {
        const x = p.x + Math.sin(t * 3 + p.ph) * 9;
        const y = p.y - t * 26 + Math.cos(t * 2.4 + p.ph) * 5;
        return <circle key={i} cx={x} cy={y} r={p.r} fill="#f3c2cd" opacity={0.16 + 0.12 * Math.sin(p.ph * 3) ** 2} />;
      })}
    </g>
  );
}

export function BlastocystFormation({ t }: SceneProps) {
  const u = piece(B_SEG, t);
  const f = cleavageFrame(6 + u, 0, 5);
  // Notes 4.4: in the uterine cavity the morula loses its zona (step .08), then the fluid enters.
  f.zonaO = Math.min(f.zonaO, 1 - seg(t, 0.09, 0.25));
  const day = lerp(4, 5, seg(t, 0, 0.72));
  const done = seg(t, 0.72, 0.78);
  // Named as soon as the single cavity (blastocoel) exists, the step that introduces the word.
  const named = seg(t, 0.6, 0.66);
  const poleOn = seg(t, 0.84, 0.88);

  // Engine units → screen (the conceptus is drawn rotated by ROT).
  const ca = Math.cos((ROT * Math.PI) / 180);
  const sa = Math.sin((ROT * Math.PI) / 180);
  const scr = (x: number, y: number): [number, number] => [CX + S * (x * ca - y * sa), CY + S * (x * sa + y * ca)];
  const cells = f.cells.filter((c) => c.shape);
  type C = (typeof cells)[number];
  const cen = (c: C) => (c.shape ? scr(c.shape.cx, c.shape.cy) : scr(c.x, c.y));
  // The cell whose screen centroid lies furthest towards a direction (deg, screen).
  const toward = (list: C[], deg: number) => {
    const dx = Math.cos((deg * Math.PI) / 180);
    const dy = Math.sin((deg * Math.PI) / 180);
    const along = (c: C) => {
      const [x, y] = cen(c);
      return (x - CX) * dx + (y - CY) * dy;
    };
    return list.reduce((a, c) => (along(c) > along(a) ? c : a), list[0]);
  };
  // Outer surface of the cell ball (screen radius).
  let outer = 0;
  for (const c of cells) for (const q of c.shape!.pts) outer = Math.max(outer, Math.hypot(q[0], q[1]));
  const R = outer * S;
  const onR = (deg: number, r = R): [number, number] => [CX + r * Math.cos((deg * Math.PI) / 180), CY + r * Math.sin((deg * Math.PI) / 180)];

  const morulaA = cen(toward(cells, 196));
  const tro = cells.filter((c) => c.fate === 'trofoblasto');
  const emb = cells.filter((c) => c.fate === 'enbrioblasto');
  const troA = cen(toward(tro.length ? tro : cells, 38));
  const embA = cen(toward(emb.length ? emb : cells, -128));
  const zonaA = onR(40, (f.zonaR + 9 + (1 - f.zonaO) * 14) * S);
  const cavA = scr(18, 30);
  const blA = onR(158);

  // The two poles: each end of the axis through the inner cell mass, lit along the blastocyst's
  // own surface there (never a mark beside it).
  const cap = (mid: number, h: number) => {
    const half = (Math.acos(h) * 180) / Math.PI;
    const a0 = onR(mid - half);
    const a1 = onR(mid + half);
    return { arc: `M${a0[0].toFixed(1)},${a0[1].toFixed(1)} A${R.toFixed(1)},${R.toFixed(1)} 0 0 1 ${a1[0].toFixed(1)},${a1[1].toFixed(1)}` };
  };
  const capE = cap(-90, 0.5);
  const capA = cap(90, 0.62);

  return (
    <g>
      <ConceptusDefs />
      <Part id="umetoki-barrunbea" quiet>
        <Lumen t={t} />
      </Part>
      {/* The whole blastocyst, named with the blastocoel: its outer surface, softly lit. */}
      {named > 0.02 && (
        <Part id="blastozistoa" show={named}>
          <circle cx={CX} cy={CY} r={R + 5} fill="none" stroke="#dfe8fb" strokeOpacity={0.07} strokeWidth={10} />
          <circle cx={CX} cy={CY} r={R + 0.6} fill="none" stroke="#e8eefc" strokeOpacity={0.5} strokeWidth={1.4} />
        </Part>
      )}
      <Conceptus
        f={f}
        x={CX}
        y={CY}
        s={S}
        rot={ROT}
        mass={1}
        parts={{ cell: (c) => (t < 0.6 ? 'morula' : c.fate === 'enbrioblasto' ? 'enbrioblastoa' : 'trofoblastoa') }}
      />
      {poleOn > 0.02 && (
        <>
          <Part id="mutur-enbrionarioa" show={poleOn}>
            <path d={capE.arc} fill="none" stroke="#9cc0ff" strokeWidth={9} strokeLinecap="round" opacity={0.22} />
            <path d={capE.arc} fill="none" stroke="#c4d9ff" strokeWidth={2.4} strokeLinecap="round" opacity={0.95} />
          </Part>
          <Part id="mutur-anenbrionarioa" show={poleOn}>
            <path d={capA.arc} fill="none" stroke="#8ee6b4" strokeWidth={9} strokeLinecap="round" opacity={0.22} />
            <path d={capA.arc} fill="none" stroke="#b5f2cf" strokeWidth={2.4} strokeLinecap="round" opacity={0.95} />
          </Part>
        </>
      )}

      {/* Named a morula until the blastocoel makes it a blastocyst (.6). */}
      <Label id="morula" x={250} y={300} ax={morulaA[0]} ay={morulaA[1]} show={vis(t, 0, 0.6)} />
      <Label id="mintz-peluzidoa" x={800} y={470} ax={zonaA[0]} ay={zonaA[1]} show={vis(t, 0, 0.26)} />
      <Label id="umetoki-barrunbea" x={250} y={470} ax={326} ay={462} show={vis(t, 0, 0.26)} />
      <Label id="trofoblastoa" x={800} y={420} ax={troA[0]} ay={troA[1]} show={done} />
      <Label id="enbrioblastoa" x={250} y={170} ax={embA[0]} ay={embA[1]} show={done} />
      <Label id="blastozelea" x={800} y={300} ax={cavA[0]} ay={cavA[1]} show={seg(t, 0.6, 0.65)} />
      <Label id="blastozistoa" x={250} y={420} ax={blA[0]} ay={blA[1]} show={named} />
      <Label id="mutur-enbrionarioa" x={800} y={110} ax={CX + 40} ay={CY - Math.sqrt(R * R - 1600)} show={poleOn} />
      <Label id="mutur-anenbrionarioa" x={250} y={540} ax={CX - 30} ay={CY + Math.sqrt(R * R - 900)} show={poleOn} />

      <Note x={CX} y={606} tone="accent" show={vis(t, 0.08, 0.26)}>
        Umetokiaren barrunbean mintz peluzidoa galtzen da
      </Note>
      <Note x={CX} y={606} tone="accent" show={vis(t, 0.3, 0.6)}>
        Likidoa zelulen artean: barrunbe txikiak fusionatzen dira
      </Note>
      <Note x={CX} y={606} tone="accent" show={vis(t, 0.62, 0.86)}>
        Kanpoan trofoblastoa (berdea) · mutur batean enbrioblastoa (urdina)
      </Note>
      <Note x={CX} y={606} tone="accent" show={vis(t, 0.9)}>
        Trofoblastotik karena · enbrioblastotik enbrioiaren ehun guztiak
      </Note>

      <MiniTract day={day} />
      <Hud value={day < 4.9 ? '4.–5.' : '5.'} unit=" eguna" caption="Ernalkuntzatik" />
    </g>
  );
}
