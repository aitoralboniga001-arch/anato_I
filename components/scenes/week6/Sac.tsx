'use client';

import { C, Flow, Label, Note, Part, lerp, rand, seg, smoothPath, type SceneProps } from '@/components/kit';

/**
 * Topic 6 — the chorionic sac as a whole (stage `biloxka-askeak`): a ring of villi around the
 * chorionic cavity, the small embryo hanging from the stalk at the top, spiral arteries entering
 * from the endometrium. Beats: 0 (trunk villi), .16 (free villi fill the space), .34/.5 (barrier
 * thinning), .66 (thickest layer disappears), .8 (fetal vs maternal circuits never touch).
 */
const vis = (t: number, a: number, b = 2) => Math.min(a <= 0 ? 1 : seg(t, a, a + 0.03), 1 - seg(t, b - 0.03, b));

const CX = 500;
const CY = 350;
const GAP = 34; // half-angle (deg) of the top gap where the stalk enters
/** Angles (deg, 0 = right, clockwise) of the stem villi, clear of the top gap. */
const STEMS = [-50, -15, 20, 55, 90, 125, 160, 195, 230];

function SacDefs() {
  return (
    <defs>
      <pattern id="w6s-villi" width="16" height="14" patternUnits="userSpaceOnUse">
        <rect width="16" height="14" fill="#f4a07f" />
        <circle cx="4" cy="4" r="2.1" fill="#f4d9c9" />
        <circle cx="12" cy="9" r="2.1" fill="#e0344f" />
        <circle cx="7" cy="11" r="1.4" fill="#f4d9c9" />
      </pattern>
      <pattern id="w6s-decidua" width="30" height="12" patternUnits="userSpaceOnUse">
        <rect width="30" height="12" fill="#c8645c" />
        <path d="M0 6h30" stroke="#a84b45" strokeWidth="1.6" />
      </pattern>
    </defs>
  );
}

/** Wobbly ring boundary: many free villi once `branch` is high, a smoother trunk-only ring before. */
function ringPts(r: number, branch: number, n: number, seed: number) {
  const pts: [number, number][] = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 - Math.PI / 2;
    const gapDeg = (GAP * Math.PI) / 180;
    const inGap = Math.abs(((a + Math.PI * 2.5) % (Math.PI * 2)) - Math.PI * 1.5) < gapDeg;
    const jitter = (rand(seed + i * 3.3) - 0.5) * 2;
    const amp = lerp(4, 22, branch) * (inGap ? 0.15 : 1);
    pts.push([CX + Math.cos(a) * (r + jitter * amp), CY + Math.sin(a) * (r + jitter * amp)]);
  }
  return pts;
}

function SacDrawing({ t, reduced }: SceneProps) {
  const branch = seg(t, 0, 0.16);
  const thin = seg(t, 0.34, 0.5);
  const R1 = 236; // outer, kanpoko-zorro
  const R2 = 214; // villi / intervillous band outer
  const R3 = 168; // korion-plaka (fetal leaf) outer
  const R4 = 142; // chorionic cavity
  const outerPts = ringPts(R1, branch, 48, 1.7);
  const villiPts = ringPts(R2, branch, 48, 4.1);
  return (
    <g>
      <path d="M120,566 Q500,610 880,566" fill="none" stroke="url(#w6s-decidua)" strokeWidth={16} opacity={0.9} />
      <Part id="dezidua-kapsularra" quiet show={vis(t, 0)}>
        <path d="M120,566 Q500,610 880,566" fill="none" stroke="none" />
      </Part>

      <Part id="kanpoko-zorro-zitotrofoblastikoa" show={vis(t, 0)}>
        <path d={smoothPath(outerPts, true, 0.55)} fill="#4f9a63" stroke="#2c6b41" strokeWidth={1.4} />
      </Part>
      <Part id="biloxka-askea" show={Math.max(vis(t, 0), branch)}>
        <path d={smoothPath(villiPts, true, 0.55)} fill="url(#w6s-villi)" stroke="#7a3a24" strokeWidth={1} opacity={lerp(0.55, 1, branch)} />
      </Part>
      <Part id="biloxka-arteko-espazioa" quiet show={vis(t, 0.16)}>
        <path d={smoothPath(villiPts, true, 0.55)} fill="none" />
      </Part>
      {/* Stem (anchoring) villi: plate → shell, the trunks the free villi branch from. */}
      <Part id="biloxka-enborra" show={vis(t, 0)}>
        {STEMS.map((deg) => {
          const a = (deg * Math.PI) / 180;
          const p = (r: number) => `${CX + Math.cos(a) * r},${CY + Math.sin(a) * r}`;
          return <path key={deg} d={`M${p(R3 - 4)} L${p(R1 - 6)}`} stroke="#11573b" strokeWidth={9} strokeLinecap="round" />;
        })}
      </Part>
      <Part id="korion-plaka" show={vis(t, 0)}>
        <circle cx={CX} cy={CY} r={R3} fill="#3f8f5e" stroke="#2c6b41" strokeWidth={1.2} />
      </Part>
      <Part id="korion-barrunbea" show={vis(t, 0)}>
        <circle cx={CX} cy={CY} r={R4} fill="#0d1526" />
      </Part>

      {/* barrier-thinning glow on the free villi ring */}
      <Part id="karena-mugaren-meheketa" quiet show={seg(t, 0.34, 0.4)}>
        <path d={smoothPath(villiPts, true, 0.55)} fill="none" stroke="#fbbf24" strokeWidth={2.4} strokeDasharray="3 5" opacity={0.6 + thin * 0.3} />
      </Part>

      {/* spiral arteries + venous return entering the gap at the top */}
      <Part id="arteria-espiralak" show={vis(t, 0)}>
        {[-14, 6].map((dx, i) => (
          <path key={i} d={`M${CX + dx * 3 - 26},${CY - R1 - 46} q10,20 -2,34 q-12,14 4,30 q10,12 -2,26`} fill="none" stroke={C.artery} strokeWidth={5} strokeLinecap="round" />
        ))}
      </Part>
      <Part id="endometrio-zainak" show={vis(t, 0)}>
        <path d={`M${CX + 46},${CY - R1 - 48} q-4,26 6,36 q10,10 2,30 q-6,16 4,28`} fill="none" stroke={C.vein} strokeWidth={7} strokeLinecap="round" />
      </Part>
      {!reduced && (
        <>
          <Flow d={`M${CX - 40},${CY - R1 - 40} q10,20 -2,34 q-12,14 4,30 L${CX - 26},${CY - R2 + 6}`} n={3} dur={3.4} r={2.2} color="#ff6b81" reduced={reduced} />
          <Flow d={`M${CX + 44},${CY - R2 + 4} q6,-14 0,-26 q-6,-14 2,-32 L${CX + 46},${CY - R1 - 44}`} n={2} dur={4} r={2} color={C.vein} reduced={reduced} />
        </>
      )}

      {/* embryo hanging from the stalk, inside the chorionic cavity */}
      <Part id="finkapen-pedikulua" show={vis(t, 0)}>
        <path d={`M${CX},${CY - R3 + 4} L${CX},${CY - 44}`} fill="none" stroke="#d9a6b8" strokeWidth={5} />
      </Part>
      <Part id="amnios-barrunbea" show={vis(t, 0)}>
        <ellipse cx={CX - 4} cy={CY - 24} rx={20} ry={26} fill="#101828" stroke="#9fc3e6" strokeWidth={2} />
      </Part>
      <Part id="bitelo-zaku-sekundarioa" show={vis(t, 0)}>
        <ellipse cx={CX + 14} cy={CY - 10} rx={11} ry={13} fill="#f2c14e" opacity={0.85} />
      </Part>
      <ellipse cx={CX - 8} cy={CY - 30} rx={10} ry={15} fill="#7aa7f5" opacity={0.9} />
    </g>
  );
}

export function ChorionicSac({ t, reduced }: SceneProps) {
  const branch = seg(t, 0, 0.16);
  return (
    <g>
      <SacDefs />
      <SacDrawing t={t} reduced={reduced} />
      <Label id="arteria-espiralak" x={190} y={70} ax={CX - 60} ay={CY - 236} text="Arteria kiribila" />
      <Label id="endometrio-zainak" x={810} y={70} ax={CX + 46} ay={CY - 236} text="Itzulera benosoa" />
      <Label id="kanpoko-zorro-zitotrofoblastikoa" x={300} y={140} align="end" ax={CX - 236} ay={CY - 30} />
      <Label id="biloxka-askea" x={740} y={140} ax={CX + 214} ay={CY - 60} show={Math.max(0.4, branch)} />
      <Label id="biloxka-arteko-espazioa" x={740} y={190} ax={CX + 190} ay={CY + 20} show={vis(t, 0.16)} />
      <Label id="biloxka-enborra" x={300} y={185} align="end" ax={CX - 195} ay={CY - 52} />
      <Label id="korion-plaka" x={190} y={230} ax={CX - 160} ay={CY + 40} />
      <Label id="biloxka-tertziarioa" x={190} y={280} ax={CX - 190} ay={CY + 69} show={vis(t, 0, 0.2)} />
      <Label id="korion-barrunbea" x={810} y={280} ax={CX + 110} ay={CY + 60} />
      <Label id="finkapen-pedikulua" x={190} y={330} ax={CX - 6} ay={CY - 50} />
      <Label id="amnios-barrunbea" x={810} y={330} ax={CX + 16} ay={CY - 24} />
      <Label id="bitelo-zaku-sekundarioa" x={810} y={380} ax={CX + 20} ay={CY - 8} />
      <Label id="dezidua-kapsularra" x={500} y={600} ax={500} ay={585} align="middle" />

      <Note x={500} y={44} show={seg(t, 0, 0.1)} tone="dim">
        Biloxka enborrak adarkatzen dira
      </Note>
      <Note x={500} y={44} show={seg(t, 0.16, 0.24)} tone="accent">
        Biloxka askeek biloxka arteko espazioa betetzen dute
      </Note>
    </g>
  );
}

/* ------------------------------------------------------------------ */
/* SacCirculation — fetal loop vs. maternal lakes, never touching     */
/* ------------------------------------------------------------------ */

const V_R = 205;
const N_VILLI = 12;

function villusUnit(i: number, t: number) {
  const a = (i / N_VILLI) * Math.PI * 2 - Math.PI / 2;
  const inGap = Math.abs(((a + Math.PI * 2.5) % (Math.PI * 2)) - Math.PI * 1.5) < 0.45;
  const rOut = inGap ? V_R - 30 : V_R;
  const len = inGap ? 30 : 56;
  const base: [number, number] = [CX + Math.cos(a) * (rOut - len), CY + Math.sin(a) * (rOut - len)];
  const tip: [number, number] = [CX + Math.cos(a) * rOut, CY + Math.sin(a) * rOut];
  const mid = lerp(0, 1, 0.5);
  const wob = Math.sin(a * 5 + t * 2) * 3;
  const ctrl: [number, number] = [
    CX + Math.cos(a) * (rOut - len * (1 - mid)) + wob,
    CY + Math.sin(a) * (rOut - len * (1 - mid)) + wob,
  ];
  return { a, base, tip, ctrl, inGap };
}

function CirculationDrawing({ t, reduced }: SceneProps) {
  const sep = seg(t, 0.76, 0.84);
  const units = Array.from({ length: N_VILLI }, (_, i) => villusUnit(i, t));
  return (
    <g>
      <circle cx={CX} cy={CY} r={V_R + 40} fill="#7a1626" opacity={0.9} />
      <Part id="biloxka-arteko-espazioa" show={vis(t, 0)}>
        <circle cx={CX} cy={CY} r={V_R + 34} fill="url(#p-blood)" opacity={0.85} />
      </Part>
      {units.map((u, i) => (
        <Part key={i} id="biloxka-tertziarioa" show={vis(t, 0)}>
          <path
            d={`M${u.base[0] - 8 * Math.sin(u.a)},${u.base[1] + 8 * Math.cos(u.a)} Q${u.ctrl[0]},${u.ctrl[1]} ${u.tip[0]},${u.tip[1]} Q${u.ctrl[0]},${u.ctrl[1]} ${u.base[0] + 8 * Math.sin(u.a)},${u.base[1] - 8 * Math.cos(u.a)} Z`}
            fill="#1b7f55"
            stroke="#11573b"
            strokeWidth={1.2}
          />
        </Part>
      ))}
      <Part id="korion-plaka" show={vis(t, 0)}>
        <circle cx={CX} cy={CY} r={V_R - 62} fill="#3f8f5e" stroke="#2c6b41" strokeWidth={1.4} />
      </Part>
      <Part id="korion-barrunbea" show={vis(t, 0)}>
        <circle cx={CX} cy={CY} r={V_R - 90} fill="#0d1526" />
      </Part>

      <Part id="finkapen-pedikulua" show={vis(t, 0)}>
        <path d={`M${CX},${CY - V_R + 96} L${CX},${CY - 46}`} fill="none" stroke="#d9a6b8" strokeWidth={5} />
      </Part>
      <Part id="amnios-barrunbea" show={vis(t, 0)}>
        <ellipse cx={CX - 4} cy={CY - 22} rx={18} ry={24} fill="#101828" stroke="#9fc3e6" strokeWidth={2} />
      </Part>
      <Part id="bitelo-zaku-sekundarioa" show={vis(t, 0)}>
        <ellipse cx={CX + 12} cy={CY - 8} rx={10} ry={12} fill="#f2c14e" opacity={0.85} />
      </Part>
      <ellipse cx={CX - 8} cy={CY - 28} rx={9} ry={13} fill="#7aa7f5" opacity={0.9} />
      <Part id="zilbor-hodiak" show={vis(t, 0)}>
        <path d={`M${CX - 2},${CY - 46} L${CX - 2},${CY - V_R + 96}`} stroke={C.artery} strokeWidth={2} />
        <path d={`M${CX + 2},${CY - 46} L${CX + 2},${CY - V_R + 96}`} stroke={C.vein} strokeWidth={2} />
      </Part>

      {!reduced && (
        <>
          {/* fetal circuit: stalk -> chorionic-plate vessels -> villi -> back */}
          <Flow d={`M${CX - 3},${CY - 46} L${CX - 3},${CY - V_R + 96} Q${CX - 60},${CY - V_R + 80} ${CX - (V_R - 40)},${CY - 60}`} n={2} dur={5} r={2} color={C.artery} reduced={reduced} />
          <Flow d={`M${CX + (V_R - 40)},${CY - 60} Q${CX + 60},${CY - V_R + 80} ${CX + 3},${CY - V_R + 96} L${CX + 3},${CY - 46}`} n={2} dur={5} r={2} color={C.vein} reduced={reduced} />
          {/* maternal circuit: enters and leaves the outer lakes */}
          <Flow d={`M${CX - 8},${CY - V_R - 36} q-16,18 -4,32 q10,12 -2,26`} n={2} dur={3.2} r={2.2} color="#ff6b81" reduced={reduced} />
        </>
      )}

      <Part id="biloxka-arteko-espazioa" quiet show={sep}>
        <circle cx={CX} cy={CY} r={V_R - 20} fill="none" stroke="#fbbf24" strokeWidth={2} strokeDasharray="2 6" opacity={sep * 0.7} />
      </Part>
    </g>
  );
}

export function SacCirculation({ t, reduced }: SceneProps) {
  const sep = seg(t, 0.76, 0.84);
  return (
    <g>
      <SacDefs />
      <CirculationDrawing t={t} reduced={reduced} />
      <Label id="finkapen-pedikulua" x={190} y={80} ax={CX - 4} ay={CY - V_R + 100} />
      <Label id="amnios-barrunbea" x={810} y={80} ax={CX + 14} ay={CY - 22} />
      <Label id="bitelo-zaku-sekundarioa" x={740} y={130} ax={CX + 18} ay={CY - 8} />
      <Label id="biloxka-tertziarioa" x={190} y={180} ax={CX - V_R + 30} ay={CY - 40} />
      <Label id="biloxka-arteko-espazioa" x={810} y={230} ax={CX + V_R - 10} ay={CY} />
      <Label id="korion-plaka" x={190} y={280} ax={CX - (V_R - 62)} ay={CY + 30} text="Korion-orria" />
      <Label id="korion-barrunbea" x={810} y={330} ax={CX + (V_R - 90) - 4} ay={CY + 30} />
      <Label id="sinzitiotrofoblastoa" x={190} y={380} ax={CX - V_R + 8} ay={CY + 70} text="Sinzitioa" />
      <Label id="zilbor-hodiak" x={190} y={130} ax={CX - 3} ay={CY - 80} show={vis(t, 0.76)} />

      <Note x={500} y={600} show={sep} tone="warn">
        Amaren eta fetuaren odolak ez dute inoiz kontakturik
      </Note>
    </g>
  );
}
