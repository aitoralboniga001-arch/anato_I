'use client';

import { Label, Mark, Note, Part, lerp, seg, type SceneProps } from '@/components/kit';
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

export function Segmentation({ t }: SceneProps) {
  const p = piece(P_SEG, t);
  const day = piece(D_SEG, t);
  const f = cleavageFrame(p, 0, 5);
  const count = p < 1 ? 1 : 2 ** Math.min(5, Math.floor(p) - 1 + (p % 1 > 0.6 ? 1 : 0));
  const mass = seg(t, 0.9, 0.97);
  const cut = seg(t, 0.93, 0.98);
  const polar = 1 - seg(t, 0.62, 0.7);
  // Anchors (engine units → screen).
  const at = (x: number, y: number): [number, number] => [CX + x * S, CY + y * S];
  const zona = at(150 * 0.71, 150 * 0.71);
  const c0 = f.cells[0];
  const one = at(c0.x, c0.y);
  const outer = f.cells.find((c) => c.fate === 'trofoblasto' && c.x > 40 && c.y > 20) ?? c0;
  const inner = f.cells.find((c) => c.fate === 'enbrioblasto') ?? c0;
  return (
    <g>
      <ConceptusDefs />
      {/* Reference ring: the conceptus does not grow while it divides. */}
      <circle cx={CX} cy={CY} r={158 * S} fill="none" stroke="rgba(255,255,255,0.12)" strokeDasharray="3 7" opacity={vis(t, 0.26, 0.66)} />
      <Conceptus
        f={f}
        x={CX}
        y={CY}
        s={S}
        polar={polar}
        mass={mass}
        cut={cut}
        parts={{ cell: (c) => (mass > 0.5 ? (c.fate === 'enbrioblasto' ? 'enbrioblastoa' : 'trofoblastoa') : count === 1 ? 'zigotoa' : t >= 0.66 ? 'morula' : 'blastomeroak') }}
      />

      <Label id="zigotoa" x={250} y={150} ax={one[0] - 40} ay={one[1] - 30} show={vis(t, 0, 0.12)} />
      <Label id="mintz-peluzidoa" x={800} y={470} ax={zona[0]} ay={zona[1]} />
      <Label id="gorpuskulu-polarrak" x={790} y={236} ax={CX + 90 * S} ay={CY - 84 * S} show={polar * vis(t, 0.1)} />
      <Label id="blastomeroak" x={250} y={250} ax={one[0]} ay={one[1]} show={vis(t, 0.14, 0.62)} />
      <Label id="morula" x={250} y={250} ax={CX - 60 * S} ay={CY - 40 * S} show={vis(t, 0.66, 0.86)} />
      <Label id="trofoblastoa" text="Kanpoko masa zelularra" x={800} y={380} ax={CX + outer.x * S} ay={CY + outer.y * S} show={mass} />
      <Label id="enbrioblastoa" text="Barruko masa zelularra" x={250} y={330} ax={CX + inner.x * S} ay={CY + inner.y * S} show={mass} />

      <Note x={CX} y={596} tone="accent" show={vis(t, 0.3, 0.62)}>
        Zelulak gero eta txikiagoak: egituraren tamaina ez da aldatzen
      </Note>
      <Note x={CX} y={596} tone="accent" show={vis(t, 0.66, 0.86)}>
        3. eguna: 12–16 zelula, masusta itxura → morula
      </Note>
      <Note x={CX} y={596} tone="accent" show={vis(t, 0.86)}>
        4. eguna: ~32 zelula, tronparen istmotik umetokira
      </Note>

      <MiniTract day={day} />
      <Hud value={dayText(day).split(' ')[0]} unit={` ${dayText(day).split(' ').slice(1).join(' ')}`} caption="Ernalkuntzatik" second={['Zelulak', count, '']} />
    </g>
  );
}

// ---------------------------------------------------------------------------

/** Deterministic fluid spaces between the morula cells that merge into the blastocoel. */
const DROPS = [
  [-38, 22, 0.1],
  [30, 40, 0.18],
  [52, -6, 0.26],
  [-12, 58, 0.14],
  [-54, -10, 0.3],
  [8, 18, 0.06],
  [20, -40, 0.34],
] as const;

// Cavitation by step: small spaces appear and start to fuse (step .30), the single blastocoel opens (step .60).
const CAV_SEG: [number, number][] = [[0.28, 0], [0.57, 0.42], [0.6, 0.45], [0.7, 1]];

export function BlastocystFormation({ t }: SceneProps) {
  const cav = piece(CAV_SEG, t);
  const f = cleavageFrame(6 + cav, 0, 5);
  const zonaLoss = seg(t, 0.08, 0.24);
  f.zonaO = Math.min(f.zonaO, 1 - zonaLoss);
  const day = lerp(4, 5, seg(t, 0, 0.72));
  const done = seg(t, 0.72, 0.78);
  // Named as soon as the single cavity (blastocoel) exists, the step that introduces the word.
  const named = seg(t, 0.6, 0.66);
  const ROT = 43; // embryonic pole up, as it will face the endometrium
  const RB = 138;
  const embC: [number, number] = [CX, CY - 72 * S];
  const poleOn = seg(t, 0.84, 0.88);
  const poleArc = (mid: number) => {
    const r = RB * S + 10;
    const pt = (a: number) => `${(CX + r * Math.cos((a * Math.PI) / 180)).toFixed(1)},${(CY + r * Math.sin((a * Math.PI) / 180)).toFixed(1)}`;
    return `M${pt(mid - 32)} A${r},${r} 0 0 1 ${pt(mid + 32)}`;
  };
  return (
    <g>
      <ConceptusDefs />
      {/* The uterine cavity it has just entered (day 4–5). */}
      <Part id="umetoki-barrunbea" quiet>
        <ellipse cx={CX} cy={CY} rx={430} ry={280} fill="rgba(190,90,110,0.06)" stroke="rgba(214,120,140,0.35)" strokeWidth={2} strokeDasharray="6 6" />
      </Part>
      {named > 0.02 && (
        <Part id="blastozistoa" show={named}>
          <circle cx={CX} cy={CY} r={(RB + 6) * S} fill="none" stroke="rgba(232,238,252,0.28)" strokeWidth={7} />
        </Part>
      )}
      <Conceptus
        f={f}
        x={CX}
        y={CY}
        s={S}
        rot={ROT}
        mass={1}
        parts={{ cell: (c) => (cav < 0.3 ? 'morula' : c.kind === 'enbrioblasto' || c.fate === 'enbrioblasto' ? 'enbrioblastoa' : 'trofoblastoa') }}
      />
      {/* Fluid entering between the cells: small spaces that grow and fuse. */}
      {cav > 0.01 && cav < 0.75 && (
        <g transform={`translate(${CX} ${CY}) scale(${S})`} pointerEvents="none">
          {DROPS.map(([x, y, a], i) => {
            const g = seg(cav, a, a + 0.25);
            const k = seg(cav, 0.35, 0.75);
            return g > 0.01 ? <circle key={i} cx={x * (1 - k)} cy={y * (1 - k) + 20 * k} r={lerp(3, 14, g) * (1 - k * 0.6)} fill="#9fd4f2" opacity={0.55 * (1 - k)} stroke="#2a3b5c" strokeWidth={1} /> : null;
          })}
        </g>
      )}

      {/* The two poles: an arc on each end of the axis through the inner cell mass */}
      {poleOn > 0.02 && (
        <>
          <Part id="mutur-enbrionarioa" show={poleOn}>
            <path d={poleArc(-90)} fill="none" stroke="#8fb4f7" strokeWidth={9} strokeLinecap="round" opacity={0.85} />
          </Part>
          <Part id="mutur-anenbrionarioa" show={poleOn}>
            <path d={poleArc(90)} fill="none" stroke="#7ad9a3" strokeWidth={9} strokeLinecap="round" opacity={0.85} />
          </Part>
        </>
      )}

      <Label id="mintz-peluzidoa" x={800} y={470} ax={CX + 110 * S} ay={CY + 100 * S} show={vis(t, 0, 0.26)} />
      <Label id="trofoblastoa" x={800} y={420} ax={CX + 88 * S} ay={CY + 88 * S} show={done} />
      <Label id="enbrioblastoa" x={250} y={170} ax={embC[0] - 20} ay={embC[1]} show={done} />
      <Label id="blastozelea" x={800} y={300} ax={CX + 30 * S} ay={CY + 30 * S} show={seg(t, 0.6, 0.65)} />
      <Label id="mutur-enbrionarioa" x={800} y={110} ax={CX + 8} ay={CY - RB * S - 4} show={seg(t, 0.84, 0.88)} />
      <Label id="mutur-anenbrionarioa" x={250} y={540} ax={CX} ay={CY + RB * S + 4} show={seg(t, 0.84, 0.88)} />
      <Mark id="blastozistoa" x={CX} y={CY} rx={RB * S + 22} color="#8fb4f7" show={named} />
      <Label id="blastozistoa" x={250} y={420} ax={CX - 120 * S} ay={CY + 40 * S} show={named} />
      <Label id="umetoki-barrunbea" x={250} y={560} ax={CX - 300} ay={CY + 200} show={vis(t, 0, 0.26)} />

      <Note x={CX} y={606} tone="accent" show={vis(t, 0.08, 0.26)}>
        Umetokiaren barrunbean mintz peluzidoa galtzen da
      </Note>
      <Note x={CX} y={606} tone="accent" show={vis(t, 0.3, 0.6)}>
        Likidoa zelulen artean: barrunbe txikiak fusionatzen dira
      </Note>
      <Note x={CX} y={606} tone="accent" show={vis(t, 0.9)}>
        Trofoblastotik karena · enbrioblastotik enbrioiaren ehun guztiak
      </Note>

      <MiniTract day={day} />
      <Hud value={day < 4.9 ? '4.–5.' : '5.'} unit=" eguna" caption="Ernalkuntzatik" />
    </g>
  );
}
