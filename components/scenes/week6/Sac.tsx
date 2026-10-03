'use client';

import { C, Flow, Label, Mark, Note, Part, bezier, lerp, line, rand, seg, smoothPath, tube, type Pt, type SceneProps } from '@/components/kit';

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

/**
 * A stem (anchoring) villus as a living trunk: it flares where it leaves the chorionic plate and
 * again where it anchors in the cytotrophoblastic shell, bends slightly, and gives off a few short
 * free-villus twigs with rounded tips.
 */
function stemVillus(deg: number, r0: number, r1: number, twig: number) {
  const a = (deg * Math.PI) / 180;
  const at = (r: number, side = 0): Pt => [CX + Math.cos(a) * r - Math.sin(a) * side, CY + Math.sin(a) * r + Math.cos(a) * side];
  const bend = (rand(deg * 0.37 + 2) - 0.5) * 16;
  const c = bezier(at(r0), at(lerp(r0, r1, 0.35), bend), at(lerp(r0, r1, 0.7), -bend * 0.6), at(r1));
  const trunk = tube(c, (u) => 4.2 + 4 * Math.max(0, 1 - u / 0.28) ** 2 + 3.4 * Math.max(0, (u - 0.8) / 0.2) ** 2, 0, 1, 30);
  const twigs = [0.42, 0.66].flatMap((u, i) => {
    if (twig <= 0.02) return [];
    const q = c(u);
    const side = (i + Math.round(rand(deg) * 2)) % 2 ? 1 : -1;
    const tx = -q.ny;
    const ty = q.nx; // unit tangent
    const len = (14 + 8 * rand(deg + i * 5.1)) * twig;
    const ang = 0.75; // ~45° off the trunk, towards the shell
    const dx = tx * Math.cos(ang) + q.nx * side * Math.sin(ang);
    const dy = ty * Math.cos(ang) + q.ny * side * Math.sin(ang);
    const tip: Pt = [q.x + dx * len, q.y + dy * len];
    return [tube(line(tip, [q.x, q.y]), (v) => lerp(2, 3.4, v), 0, 1, 10, true).d];
  });
  return { trunk, twigs };
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
          const v = stemVillus(deg, R3 - 6, R1 - 8, branch);
          return (
            <g key={deg}>
              {v.twigs.map((d, i) => (
                <path key={i} d={d} fill="#3f8f5e" stroke="#2c6b41" strokeWidth={1} />
              ))}
              <path d={v.trunk.d} fill="#3f8f5e" />
              <g fill="none" stroke="#2c6b41" strokeWidth={1.1}>
                <path d={v.trunk.left} />
                <path d={v.trunk.right} />
              </g>
            </g>
          );
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
        <path d={smoothPath(villiPts, true, 0.55)} fill="none" stroke="#fbbf24" strokeWidth={7} strokeLinejoin="round" filter="url(#f-soft)" opacity={0.25 + thin * 0.25} />
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
      {/* The stalk is chorionic-plate mesoderm: same tissue, flaring out of the plate's cavity face; its lower end tucks under the amnion. */}
      <Part id="finkapen-pedikulua" show={vis(t, 0)}>
        {(() => {
          const st = tube(bezier([CX, CY - R4 - 1], [CX, CY - R4 + 30], [CX - 6, CY - 70], [CX - 4, CY - 40]), (u) => 5 + 10 * Math.max(0, 1 - u / 0.3) ** 2, 0, 1, 30);
          return (
            <>
              <path d={st.d} fill="#3f8f5e" />
              <g fill="none" stroke="#2c6b41" strokeWidth={1.1}>
                <path d={st.left} />
                <path d={st.right} />
              </g>
            </>
          );
        })()}
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
      <Label id="karena-mugaren-meheketa" x={810} y={235} ax={CX + 208 * Math.cos(-0.3)} ay={CY + 208 * Math.sin(-0.3)} show={seg(t, 0.34, 0.4) * (1 - seg(t, 0.62, 0.66))} />
      <Label id="korion-barrunbea" x={810} y={280} ax={CX + 110} ay={CY + 60} />
      <Label id="finkapen-pedikulua" x={190} y={330} ax={CX - 6} ay={CY - 50} />
      <Label id="amnios-barrunbea" x={810} y={330} ax={CX + 16} ay={CY - 24} />
      <Label id="bitelo-zaku-sekundarioa" x={810} y={380} ax={CX + 20} ay={CY - 8} />
      <Label id="dezidua-kapsularra" x={500} y={600} ax={500} ay={585} align="middle" />

      <Note x={500} y={44} show={1 - seg(t, 0.12, 0.16)} tone="dim">
        Biloxka enborrak adarkatzen dira
      </Note>
      <Note x={500} y={44} show={vis(t, 0.16, 0.66)} tone="accent">
        Biloxka askeek biloxka arteko espazioa betetzen dute
      </Note>
      {/* Stem villi never thin: they take no part in the exchange. */}
      <Mark id="biloxka-enborra" x={CX - 195} y={CY - 52} rx={26} color="#fbbf24" show={vis(t, 0.66)} />
      <Note x={500} y={44} show={vis(t, 0.66)} tone="warn">
        Enborrezko biloxkak ez dira mehetzen: ez dute trukerik egiten
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
  const sep = seg(t, 0.8, 0.86);
  const units = Array.from({ length: N_VILLI }, (_, i) => villusUnit(i, t));
  return (
    <g>
      <circle cx={CX} cy={CY} r={V_R + 40} fill="#7a1626" opacity={0.9} />
      <Part id="biloxka-arteko-espazioa" show={vis(t, 0)}>
        <circle cx={CX} cy={CY} r={V_R + 34} fill="url(#p-blood)" opacity={0.85} />
      </Part>
      {/* Tertiary villi as fingers with rounded tips, each carrying a fetal capillary loop (artery out, vein back). */}
      {units.map((u, i) => {
        const tipIn: Pt = [u.tip[0] - Math.cos(u.a) * 7, u.tip[1] - Math.sin(u.a) * 7];
        const baseIn: Pt = [CX + Math.cos(u.a) * (V_R - 66), CY + Math.sin(u.a) * (V_R - 66)];
        const c = bezier(tipIn, [lerp(tipIn[0], u.ctrl[0], 0.8), lerp(tipIn[1], u.ctrl[1], 0.8)], [lerp(baseIn[0], u.ctrl[0], 0.5), lerp(baseIn[1], u.ctrl[1], 0.5)], baseIn);
        const f = tube(c, (v) => 6.5 + 5 * Math.max(0, (v - 0.7) / 0.3) ** 2, 0, 1, 24, true);
        const loop = (side: number) =>
          smoothPath(
            Array.from({ length: 13 }, (_, k) => {
              const q = c(0.06 + (0.94 * k) / 12);
              return [q.x + q.nx * 2.6 * side, q.y + q.ny * 2.6 * side] as Pt;
            }),
            false,
          );
        const q0 = c(0.06);
        return (
          <Part key={i} id="biloxka-tertziarioa" show={vis(t, 0)}>
            <path d={f.d} fill="#1b7f55" />
            <path d={loop(1)} fill="none" stroke={C.artery} strokeWidth={1.5} opacity={0.9} />
            <path d={loop(-1)} fill="none" stroke={C.vein} strokeWidth={1.5} opacity={0.9} />
            <path d={`M${q0.x + q0.nx * 2.6},${q0.y + q0.ny * 2.6} A2.6 2.6 0 0 0 ${q0.x - q0.nx * 2.6},${q0.y - q0.ny * 2.6}`} fill="none" stroke="#a78bfa" strokeWidth={1.5} opacity={0.9} />
            <g fill="none" stroke="#11573b" strokeWidth={1.2}>
              <path d={f.left} />
              <path d={f.right} />
            </g>
          </Part>
        );
      })}
      <Part id="korion-plaka" show={vis(t, 0)}>
        <circle cx={CX} cy={CY} r={V_R - 62} fill="#3f8f5e" stroke="#2c6b41" strokeWidth={1.4} />
      </Part>
      <Part id="korion-barrunbea" show={vis(t, 0)}>
        <circle cx={CX} cy={CY} r={V_R - 90} fill="#0d1526" />
      </Part>

      <Part id="finkapen-pedikulua" show={vis(t, 0)}>
        {(() => {
          const st = tube(line([CX, CY - (V_R - 91)], [CX, CY - 40]), (u) => 6 + 9 * Math.max(0, 1 - u / 0.3) ** 2, 0, 1, 24);
          return (
            <>
              <path d={st.d} fill="#3f8f5e" />
              <g fill="none" stroke="#2c6b41" strokeWidth={1.1}>
                <path d={st.left} />
                <path d={st.right} />
              </g>
            </>
          );
        })()}
      </Part>
      <Part id="amnios-barrunbea" show={vis(t, 0)}>
        <ellipse cx={CX - 4} cy={CY - 22} rx={18} ry={24} fill="#101828" stroke="#9fc3e6" strokeWidth={2} />
      </Part>
      <Part id="bitelo-zaku-sekundarioa" show={vis(t, 0)}>
        <ellipse cx={CX + 12} cy={CY - 8} rx={10} ry={12} fill="#f2c14e" opacity={0.85} />
      </Part>
      <ellipse cx={CX - 8} cy={CY - 28} rx={9} ry={13} fill="#7aa7f5" opacity={0.9} />
      <Part id="zilbor-hodiak" show={vis(t, 0)}>
        <path d={`M${CX - 2},${CY - 46} L${CX - 2},${CY - V_R + 82}`} stroke={C.artery} strokeWidth={2} />
        <path d={`M${CX + 2},${CY - 46} L${CX + 2},${CY - V_R + 82}`} stroke={C.vein} strokeWidth={2} />
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
  const sep = seg(t, 0.8, 0.86);
  return (
    <g>
      <SacDefs />
      <CirculationDrawing t={t} reduced={reduced} />
      <Mark id="enbrioi-kanpoko-zirkulazioa" x={CX} y={CY} rx={V_R + 52} color="#93b4ff" />
      <Label id="enbrioi-kanpoko-zirkulazioa" x={270} y={480} ax={CX - (V_R + 52) * 0.72} ay={CY + (V_R + 52) * 0.69} />
      <Label id="finkapen-pedikulua" x={190} y={80} ax={CX - 4} ay={CY - V_R + 100} />
      <Label id="amnios-barrunbea" x={810} y={80} ax={CX + 14} ay={CY - 22} />
      <Label id="bitelo-zaku-sekundarioa" x={740} y={130} ax={CX + 18} ay={CY - 8} />
      <Label id="biloxka-tertziarioa" x={190} y={180} ax={CX - V_R + 30} ay={CY - 40} />
      <Label id="biloxka-arteko-espazioa" x={810} y={230} ax={CX + V_R - 10} ay={CY} />
      <Label id="korion-plaka" x={190} y={280} ax={CX - (V_R - 62)} ay={CY + 30} text="Korion-orria" />
      <Label id="korion-barrunbea" x={810} y={330} ax={CX + (V_R - 90) - 4} ay={CY + 30} />
      <Label id="sinzitiotrofoblastoa" x={190} y={380} ax={CX - V_R + 8} ay={CY + 70} text="Sinzitioa" />
      <Label id="zilbor-hodiak" x={190} y={130} ax={CX - 3} ay={CY - 80} show={vis(t, 0.8)} />

      <Note x={500} y={630} show={sep} tone="warn">
        Amaren eta fetuaren odolak ez dute inoiz kontakturik
      </Note>
    </g>
  );
}
