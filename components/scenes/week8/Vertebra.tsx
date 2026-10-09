'use client';

import { useId, type ReactNode } from 'react';
import { Label, Note, Part, lerp, rand, seg, smoothPath, zoom, type Pt, type SceneProps } from '@/components/kit';
import { Defs8, MesCell, Q, f1, inPoly, mirror, offset, resample, spline, vis } from './common';

/**
 * 8:ornoa — apunteen 5.1 (ornoen atalak) eta 5.3 (orno zuloa, hodi errakideoa) eta 9. irudia.
 * - `goitik`: orno bat goitik (goian atzea). Esklerotomako zelulak notokorda eta hodi neuralaren inguruan bildu →
 *   orno gorputza notokordaren inguruan → orno arkua (pedikuluak, laminak) hodiaren inguruan hazten da eta atzean
 *   ixten → apofisi zeharrak alboetara, arantza apofisia atzera, apofisi artikularrak (hurbilketa) → orno zuloa.
 * - `atzetik`: bizkarrezurraren zati bat atzetik, laminak kenduta: orno zuloak elkarren segidan → hodi errakideoa
 *   ornomuinarekin; maila bakoitzean nerbio espinal bikote bat ornoarteko zuloetatik (diskoen mailan); miotomak
 *   orno gorputzen artean, orno batetik bestera.
 */

export const OR_T = { body: 0, arch: 0.14, trans: 0.26, spine: 0.36, artic: 0.46, hole: 0.56, canal: 0.66, nerves: 0.78, myo: 0.89 };

const BONE = Q.bone;
const EDGE = '#a8946a';
const DISC = '#8fd0c8';
const DISC_DEEP = '#3f8f86';
const MYO = '#d9534f';

// ——— goitik: one vertebra seen from above (dorsal up) ———
const BODY = spline(
  [
    [500, 370], [560, 374], [610, 394], [630, 432], [624, 482], [594, 524], [545, 545], [500, 549],
    [455, 545], [406, 524], [376, 482], [370, 432], [390, 394], [440, 374],
  ],
  6,
  true,
);
const BODY_IN = spline([[440, 410], [500, 400], [560, 410], [590, 455], [570, 505], [500, 522], [430, 505], [410, 455]], 6, true);
const NOTO: Pt = [500, 458];
const TUBE: Pt = [500, 300];
const FORAMEN = spline([[500, 238], [542, 250], [558, 290], [558, 340], [550, 374], [500, 378], [450, 374], [442, 340], [442, 290], [458, 250]], 6, true);
/** Right half of the arch: pedicle from the body, then lamina round the tube to the midline behind it. */
const ARCH_R: Pt[] = spline([[557, 377], [574, 346], [580, 302], [568, 262], [538, 232], [500, 220]], 10);
const PED_U = 0.44;
const TRANS_R: Pt[] = spline([[597, 286], [632, 278], [668, 265], [708, 254]], 8);
const SPINE: Pt[] = spline([[500, 207], [500, 176], [500, 134], [500, 90]], 8);
const ARTIC: Pt = [586, 246];

/** A band of width w0→w1 along the first u of a centre line, with a round cap. */
function band(path: readonly Pt[], w0: number, w1: number, u: number, from = 0): { d: string; cap: Pt; r: number; sub: Pt[]; w: (i: number) => number } | null {
  if (u - from <= 0.01) return null;
  const r = resample(path, 61);
  const a = Math.round(from * 60);
  const b = Math.max(a + 1, Math.round(u * 60));
  const sub = r.slice(a, b + 1);
  const w = (i: number) => lerp(w0, w1, (a + i) / 60) / 2;
  const L = offset(sub, w);
  const R = offset(sub, (i) => -w(i)).reverse();
  return { d: smoothPath([...L, ...R], true, 0.15), cap: sub[sub.length - 1], r: w(sub.length - 1), sub, w };
}

function Band({ path, w0, w1, u, from = 0, fill = BONE, edge = EDGE, pattern = true, capAtEnd = true }: { path: readonly Pt[]; w0: number; w1: number; u: number; from?: number; fill?: string; edge?: string; pattern?: boolean; capAtEnd?: boolean }) {
  const cap = capAtEnd || u < 0.97;
  const b = band(path, w0, w1, u, from);
  if (!b) return null;
  return (
    <g>
      <path d={b.d} fill={edge} stroke={edge} strokeWidth={4} strokeLinejoin="round" />
      {cap && <circle cx={b.cap[0]} cy={b.cap[1]} r={b.r + 2} fill={edge} />}
      <path d={b.d} fill={fill} />
      {cap && <circle cx={b.cap[0]} cy={b.cap[1]} r={b.r} fill={fill} />}
      {pattern && <path d={b.d} fill="url(#w8-bone)" />}
      {/* Rounded bone: a soft highlight along one flank, a shadow along the other. */}
      {b.sub.length > 2 && (
        <>
          <path d={smoothPath(offset(b.sub, (i) => b.w(i) * 0.4), false, 0.2)} fill="none" stroke="#fff" strokeOpacity={0.3} strokeWidth={3} strokeLinecap="round" />
          <path d={smoothPath(offset(b.sub, (i) => -b.w(i) * 0.62), false, 0.2)} fill="none" stroke="#3a2a10" strokeOpacity={0.22} strokeWidth={4} strokeLinecap="round" />
        </>
      )}
    </g>
  );
}

/** A stretch of a larger piece (its outline and a faint sheen over it), so the stretch itself can be pointed at and lit. */
function BandEdge({ path, w0, w1, u, from = 0, color = EDGE, width = 2.2 }: { path: readonly Pt[]; w0: number; w1: number; u: number; from?: number; color?: string; width?: number }) {
  const b = band(path, w0, w1, u, from);
  if (!b) return null;
  return <path d={b.d} fill="#fff7df" fillOpacity={0.08} stroke={color} strokeWidth={width} strokeLinejoin="round" />;
}

/** Sclerotome cells: from the two sides toward the notochord (body) and round the neural tube (arch). */
const CELLS = Array.from({ length: 84 }, (_, i) => {
  const side = i % 2 ? 1 : -1;
  const k = Math.floor(i / 2);
  const start: Pt = [500 + side * (190 + rand(i * 1.3) * 150), 250 + rand(i * 2.7) * 300];
  let target: Pt;
  if (k % 3 === 0) {
    // around the notochord, inside the future body
    let p: Pt = [500, 458];
    for (let j = 0; j < 12; j++) {
      p = [500 + side * rand(i * 5.1 + j) * 115, 385 + rand(i * 7.3 + j) * 150];
      if (inPoly(BODY, p[0], p[1])) break;
    }
    target = p;
  } else {
    // round the tube, where the arch will grow
    const a = ((-90 + side * (12 + ((k % 28) / 28) * 160 + (rand(i * 3.9) - 0.5) * 10)) * Math.PI) / 180;
    const rr = 54 + rand(i * 4.4) * 24;
    target = [TUBE[0] + Math.cos(a) * rr, TUBE[1] + Math.sin(a) * rr * 1.05];
  }
  return { start, target, body: k % 3 === 0, delay: rand(i * 6.6) * 0.03, a: rand(i * 8.8) * 360, r: 1.25 + rand(i * 9.9) * 0.35 };
});

export function VertebraTop({ t }: SceneProps) {
  const cid = useId().replace(/:/g, '');
  const gather = (d: number) => seg(t, 0.01 + d, 0.075 + d);
  const bodyR = 175 * seg(t, 0.06, 0.13);
  const archU = seg(t, OR_T.arch + 0.01, OR_T.arch + 0.09);
  const transU = seg(t, OR_T.trans + 0.01, OR_T.trans + 0.08);
  const spineU = seg(t, OR_T.spine + 0.01, OR_T.spine + 0.08);
  const artic = seg(t, OR_T.artic + 0.04, OR_T.artic + 0.08);
  const push = seg(t, OR_T.artic + 0.01, OR_T.artic + 0.04) * (1 - seg(t, OR_T.hole - 0.025, OR_T.hole));
  const hole = seg(t, OR_T.hole, OR_T.hole + 0.04);
  const z = zoom(lerp(500, 560, push), lerp(318, 262, push), lerp(1.14, 2.1, push));
  const A = (p: Pt) => z.at(p[0], p[1]);
  const inFrame = (p: Pt) => 1 - Math.min(1, Math.max(30 - p[0], p[0] - 970, 40 - p[1], p[1] - 596, 0) / 24);
  const L = (p: Pt) => ({ ax: A(p)[0], ay: A(p)[1] });
  const tubeId = t < OR_T.hole ? 'hodi-neurala' : 'ornomuina';
  const archL = ARCH_R.map((p) => mirror(p));
  const transL = TRANS_R.map((p) => mirror(p));
  const noto = lerp(16, 7, seg(t, 0.1, OR_T.arch + 0.06));
  const arches = (fn: (path: Pt[], side: 1 | -1) => ReactNode) => [fn(ARCH_R, 1), fn(archL, -1)];
  return (
    <g>
      <Defs8 />
      <rect x={0} y={0} width={1000} height={640} fill="#0f0f11" />
      <defs>
        <clipPath id={`${cid}-body`}>
          <circle cx={NOTO[0]} cy={NOTO[1]} r={bodyR} />
        </clipPath>
        <clipPath id={`${cid}-bodyshape`}>
          <path d={smoothPath(BODY, true, 0.25)} />
        </clipPath>
        <pattern id={`${cid}-pores`} width="14" height="13" patternUnits="userSpaceOnUse">
          <ellipse cx="3" cy="3" rx="1.6" ry="1.2" fill="#8a7448" opacity={0.55} />
          <ellipse cx="10" cy="5" rx="1.1" ry="0.9" fill="#8a7448" opacity={0.45} />
          <ellipse cx="6" cy="10" rx="1.4" ry="1.1" fill="#8a7448" opacity={0.5} />
          <ellipse cx="12.5" cy="11.5" rx="0.9" ry="0.8" fill="#8a7448" opacity={0.4} />
        </pattern>
      </defs>
      <g transform={z.transform}>
        {/* The vertebral foramen: open space between the body and the arch. */}
        <Part id="orno-zuloa" show={archU > 0.6 ? 1 : 0}>
          <path d={smoothPath(FORAMEN, true, 0.2)} fill={hole > 0.5 ? '#2a2134' : Q.space} stroke={hole > 0.01 ? '#e8dcb8' : 'none'} strokeWidth={2.6} />
        </Part>
        {/* Neural tube, later the spinal cord, in the foramen. */}
        <Part id={tubeId}>
          <circle cx={TUBE[0]} cy={TUBE[1]} r={36} fill={Q.neural} stroke="#8fa7ff" strokeWidth={2} />
          <circle cx={TUBE[0]} cy={TUBE[1]} r={36} fill="url(#w8-light)" />
          <path d={`M${TUBE[0]},${TUBE[1] - 26}L${TUBE[0]},${TUBE[1] + 26}`} stroke="#0d1640" strokeWidth={3} strokeLinecap="round" opacity={1 - hole * 0.6} />
          {hole > 0.01 && (
            <g opacity={hole}>
              <path d={`M${TUBE[0] - 26},${TUBE[1] - 10}Q${TUBE[0]},${TUBE[1] + 6} ${TUBE[0] + 26},${TUBE[1] - 10}Q${TUBE[0] + 18},${TUBE[1] + 22} ${TUBE[0]},${TUBE[1] + 16}Q${TUBE[0] - 18},${TUBE[1] + 22} ${TUBE[0] - 26},${TUBE[1] - 10}Z`} fill="#8b9be8" opacity={0.6} />
            </g>
          )}
        </Part>
        {/* Opaque backing under the bone pieces, so a dimmed piece reads as dark bone, not see-through. */}
        <g fill="#1d1a22" stroke="#1d1a22" strokeWidth={6} pointerEvents="none">
          {bodyR > 1 && <path d={smoothPath(BODY, true, 0.25)} clipPath={`url(#${cid}-body)`} />}
          {[ARCH_R, archL].map((p, i) => {
            const b = band(p, 34, 24, archU);
            return b && <path key={i} d={b.d} />;
          })}
          {[TRANS_R, transL].map((p, i) => {
            const b = band(p, 30, 20, transU);
            return b && <path key={i} d={b.d} />;
          })}
          {(() => {
            const b = band(SPINE, 30, 16, spineU);
            return b && <path d={b.d} />;
          })()}
        </g>
        {/* Body: forms round the notochord, ventrally. */}
        <Part id="orno-gorputza" show={bodyR > 1 ? 1 : 0}>
          <g clipPath={`url(#${cid}-body)`}>
            <path d={smoothPath(BODY, true, 0.25)} fill={BONE} stroke={EDGE} strokeWidth={3} />
            <path d={smoothPath(BODY, true, 0.25)} fill="url(#w8-bone)" />
            <path d={smoothPath(BODY, true, 0.25)} fill="url(#w8-boneshade)" />
            {/* End plate: a smooth raised rim round a porous centre. */}
            <path d={smoothPath(BODY, true, 0.25)} fill="none" stroke="#fff7df" strokeWidth={18} opacity={0.3} clipPath={`url(#${cid}-bodyshape)`} />
            <path d={smoothPath(BODY_IN, true, 0.2)} fill={`url(#${cid}-pores)`} opacity={0.8} />
            <path d={smoothPath(BODY_IN, true, 0.2)} fill="none" stroke={EDGE} strokeWidth={1.4} opacity={0.7} />
          </g>
        </Part>
        <Part id="notokorda">
          <circle cx={NOTO[0]} cy={NOTO[1]} r={noto} fill={Q.noto} stroke="#e9d5ff" strokeWidth={1.5} />
        </Part>
        {/* Arch: two halves from the body, round the tube, closing behind it. */}
        <Part id="orno-arkua" show={archU > 0.01 ? 1 : 0}>
          {arches((p, s) => (
            <Band key={s} path={p} w0={34} w1={24} u={archU} capAtEnd={false} />
          ))}
        </Part>
        <Part id="pedikulua" show={archU > 0.2 ? 1 : 0}>
          {arches((p, s) => (
            <BandEdge key={s} path={p} w0={34} w1={24} u={Math.min(archU, PED_U)} color="#6b5a35" />
          ))}
        </Part>
        <Part id="lamina" show={archU > PED_U + 0.1 ? 1 : 0}>
          {arches((p, s) => (
            <BandEdge key={s} path={p} w0={34} w1={24} u={archU} from={PED_U} color="#6b5a35" />
          ))}
        </Part>
        <Part id="apofisi-zeharrak" show={transU > 0.01 ? 1 : 0}>
          <Band path={TRANS_R} w0={30} w1={20} u={transU} />
          <Band path={transL} w0={30} w1={20} u={transU} />
        </Part>
        <Part id="arantza-apofisia" show={spineU > 0.01 ? 1 : 0}>
          <Band path={SPINE} w0={30} w1={16} u={spineU} />
        </Part>
        {/* Superior articular processes, rising at the pedicle–lamina junction with a smooth facet each. */}
        <Part id="apofisi-artikularrak" show={artic > 0.01 ? 1 : 0}>
          {[ARTIC, mirror(ARTIC)].map((c, i) => (
            <g key={i} transform={`translate(${f1(c[0])},${f1(c[1])}) scale(${f1(Math.max(0.01, artic) * 10)}) scale(0.1) rotate(${i ? 28 : -28})`}>
              <ellipse rx={17} ry={13} fill={BONE} stroke={EDGE} strokeWidth={2.4} />
              <ellipse rx={17} ry={13} fill="url(#w8-boneshade)" />
              <ellipse cx={0} cy={-3} rx={11} ry={6} fill="#fff7df" stroke="#c8b78a" strokeWidth={1} />
            </g>
          ))}
        </Part>
        {/* Sclerotome cells gathering. */}
        <Part id="esklerotoma" show={1 - seg(t, OR_T.arch + 0.04, OR_T.arch + 0.09)}>
          {CELLS.map((c, i) => {
            const k = gather(c.delay);
            const p: Pt = [lerp(c.start[0], c.target[0], k), lerp(c.start[1], c.target[1], k)];
            const op = c.body ? 1 - seg(t, 0.07 + c.delay, 0.12 + c.delay) : 1 - seg(t, OR_T.arch + 0.02, OR_T.arch + 0.08);
            return <MesCell key={i} p={p} r={c.r} a={c.a + k * 40} opacity={op} />;
          })}
        </Part>
      </g>

      <Note x={250} y={30} size={12.5} tone="accent">
        Orno bat goitik ikusita
      </Note>
      <Note x={500} y={612} tone="accent" show={vis(t, 0, OR_T.arch)}>
        Esklerotomako zelulak notokordaren inguruan bildu: orno gorputza, aurrean (bentralean)
      </Note>
      <Note x={500} y={612} tone="accent" show={vis(t, OR_T.arch, OR_T.trans)}>
        Orno arkua gorputzaren atze-alboetatik: pedikuluak eta laminak, hodiaren atzean ixten
      </Note>
      <Note x={500} y={612} tone="accent" show={vis(t, OR_T.trans, OR_T.spine)}>
        Arkutik alboetara: apofisi zeharrak
      </Note>
      <Note x={500} y={612} tone="accent" show={vis(t, OR_T.spine, OR_T.artic)}>
        Arkutik atzera: arantza apofisia (bizkarrean ukitzen duguna)
      </Note>
      <Note x={500} y={612} tone="accent" show={vis(t, OR_T.artic, OR_T.hole)}>
        Apofisi artikularrak (gainazal leun bana): ondoko ornoekin artikulatzeko
      </Note>
      <Note x={500} y={612} tone="accent" show={vis(t, OR_T.hole)}>
        Gorputzaren eta arkuaren artean zulo bat: orno zuloa, ornomuina barruan
      </Note>

      <Label id="arantza-apofisia" x={190} y={100} {...L([494, 126])} show={seg(spineU, 0.5, 0.8) * inFrame(A([494, 126]))} />
      <Label id="lamina" x={190} y={190} {...L([452, 236])} show={seg(archU, 0.8, 1) * inFrame(A([452, 236]))} />
      <Label id="apofisi-artikularrak" x={190} y={250} {...L(mirror([ARTIC[0] + 6, ARTIC[1]]))} show={artic * inFrame(A(mirror([ARTIC[0] + 6, ARTIC[1]])))} />
      <Label id="pedikulua" x={190} y={330} {...L([426, 344])} show={seg(archU, 0.3, 0.5) * inFrame(A([426, 344]))} />
      <Label id="orno-zuloa" x={190} y={400} {...L([474, 362])} show={hole * inFrame(A([474, 362]))} />
      <Label id="notokorda" x={190} y={480} {...L([NOTO[0] - noto + 2, NOTO[1]])} show={(1 - seg(t, OR_T.hole, OR_T.hole + 0.03)) * inFrame(A(NOTO))} />
      <Label id="esklerotoma" x={190} y={560} {...L(CELLS[1].start)} show={vis(t, 0, 0.06)} />
      <Label id="apofisi-zeharrak" x={810} y={240} {...L([700, 256])} show={seg(transU, 0.6, 0.9) * inFrame(A([700, 256]))} />
      <Label id="orno-arkua" x={810} y={330} {...L([592, 300])} show={seg(archU, 0.5, 0.8) * inFrame(A([592, 300]))} />
      <Label id={tubeId} x={810} y={400} {...L([530, 314])} show={inFrame(A([530, 314]))} />
      <Label id="orno-gorputza" x={810} y={470} {...L([618, 470])} show={seg(bodyR, 60, 120) * inFrame(A([618, 470]))} />
    </g>
  );
}

// ——— atzetik: a stretch of the column from behind, laminae removed ———
const N = 7;
const Y = (i: number) => 96 + i * 74;
const D = (i: number) => Y(i) + 37;
const PX = 64;
/** Spinal cord regions down the stretch (colour only): cervical, thoracic, lumbar. */
const REGION = (i: number) => (i < 2 ? 0 : i < 5 ? 1 : 2);
const REG_C = ['#6a86f0', '#3a5fd9', '#2a44a6'];
const REG_N = ['Lepokoak', 'Bizkarrekoak', 'Gerrikoak'];

function nervePath(i: number, s: 1 | -1): Pt[] {
  const y = D(i);
  return spline(
    [
      [500 + s * 17, y - 8],
      [500 + s * 44, y - 3],
      [500 + s * PX, y + 2],
      // Out into the middle of its myotome, between the fibres that run up and down to the processes.
      [500 + s * 120, y + 8],
      [500 + s * 180, y + 9],
      [500 + s * 236, y + 4],
    ],
    8,
  );
}
/** A vertebral body seen from behind: rims flare at the end plates, the sides curve in. */
const vbody = (y: number) =>
  `M410,${y - 27}H590Q604,${y - 27} 604,${y - 16}Q596,${y} 604,${y + 16}Q604,${y + 27} 590,${y + 27}H410Q396,${y + 27} 396,${y + 16}Q404,${y} 396,${y - 16}Q396,${y - 27} 410,${y - 27}Z`;
const sub = (pts: readonly Pt[], u: number) => {
  const r = resample(pts, 50);
  return r.slice(0, Math.max(2, Math.round(u * 49) + 1));
};

export function VertebraBack({ t }: SceneProps) {
  // The column builds in step with the view from above (body, arch, processes), level by level cranial → caudal;
  // later each vertebra's foramen joins the tube.
  const grow = (at: number) => (i: number) => seg(t, at + 0.005 + i * 0.008, at + 0.03 + i * 0.008);
  const bodyK = grow(OR_T.body);
  const archK = grow(OR_T.arch);
  const transK = grow(OR_T.trans);
  const lvl = grow(OR_T.canal);
  const canalY = lerp(60, 600, seg(t, OR_T.canal + 0.005, OR_T.canal + 0.085));
  const nerve = (i: number) => seg(t, OR_T.nerves + 0.01 + i * 0.01, OR_T.nerves + 0.05 + i * 0.01);
  const myo = seg(t, OR_T.myo + 0.005, OR_T.myo + 0.06);
  const levels = Array.from({ length: N }, (_, i) => i);
  const discs = levels.slice(0, N - 1);
  return (
    <g>
      <Defs8 />
      <rect x={0} y={0} width={1000} height={640} fill="#0f0f11" />
      {/* Floor of the canal: the back of the vertebral bodies and the discs between them. */}
      {levels.map((i) => (
        <g key={i} opacity={bodyK(i)}>
          <Part id="orno-gorputza">
            {/* Waisted body, rims (end plates) top and bottom. */}
            <path d={vbody(Y(i))} fill={BONE} stroke={EDGE} strokeWidth={2} />
            <path d={vbody(Y(i))} fill="url(#w8-bone)" />
            <path d={vbody(Y(i))} fill="url(#w8-boneshade)" />
            <path d={`M404,${Y(i) - 22}H596M404,${Y(i) + 22}H596`} stroke="#fff7df" strokeWidth={2} opacity={0.5} />
          </Part>
        </g>
      ))}
      {discs.map((i) => (
        <g key={i} opacity={Math.min(bodyK(i), bodyK(i + 1))}>
          <Part id="ornoarteko-diskoa">
            <rect x={402} y={D(i) - 9} width={196} height={18} rx={8} fill={DISC} stroke={DISC_DEEP} strokeWidth={1.4} />
            {/* Fibres of the annulus, crossing obliquely. */}
            <path
              d={Array.from({ length: 12 }, (_, k) => {
                const x = 414 + k * 15;
                return `M${x},${D(i) - 7}l${k % 2 ? 9 : -9},14`;
              }).join('')}
              stroke={DISC_DEEP}
              strokeWidth={1}
              opacity={0.45}
            />
          </Part>
        </g>
      ))}
      {/* The canal: every foramen in a row. */}
      <Part id="hodi-errakideoa">
        {/* A see-through shade: the pointer reaches the bodies and discs on the canal's floor. */}
        <rect x={447} y={60} width={106} height={canalY - 60} fill={Q.space} opacity={0.38} pointerEvents="none" />
        <path d={`M447,60V${f1(canalY)}M553,60V${f1(canalY)}`} stroke="#e8dcb8" strokeWidth={2.2} />
      </Part>
      {/* Spinal cord, its regions tinted. */}
      <Part id="ornomuina">
        {levels.map((i) => (
          <rect key={i} x={482} y={i === 0 ? 50 : Y(i) - 37} width={36} height={i === 0 ? Y(0) + 37 - 50 : 74} fill={REG_C[REGION(i)]} />
        ))}
        {[Y(2) - 37, Y(5) - 37].map((y) => (
          <path key={y} d={`M482,${y}H518`} stroke="#c7d2ff" strokeWidth={1.4} opacity={0.8} />
        ))}
        <rect x={482} y={50} width={36} height={560} rx={16} fill="url(#w8-light)" stroke="#8fa7ff" strokeWidth={1.6} />
        {/* Posterior median sulcus with its vessel. */}
        <path d="M500,54V606" stroke="#0d1640" strokeWidth={1.6} opacity={0.6} />
        <path d="M497,54C495,200 499,400 497,606" fill="none" stroke="#c0392b" strokeWidth={1} opacity={0.55} />
      </Part>
      {/* Cut pedicles and transverse processes of each vertebra. */}
      {levels.map((i) => (
        <g key={i}>
          <Part id="pedikulua" show={archK(i) > 0.01 ? 1 : 0}>
            <g opacity={archK(i)} transform={`translate(0,${f1((1 - archK(i)) * -14)})`}>
            {[1, -1].map((s) => (
              <g key={s}>
                <ellipse cx={500 + s * PX} cy={Y(i)} rx={17} ry={25} fill={BONE} stroke={EDGE} strokeWidth={2} />
                <ellipse cx={500 + s * PX} cy={Y(i)} rx={11} ry={17} fill="#d8c79c" />
              </g>
            ))}
            </g>
          </Part>
          <Part id="apofisi-zeharrak" show={transK(i) > 0.01 ? 1 : 0}>
            <g opacity={transK(i)}>
              {[1, -1].map((s) => (
                <path key={s} d={smoothPath([[500 + s * 78, Y(i) - 12], [500 + s * (150 - (1 - transK(i)) * 60), Y(i) - 20], [500 + s * (156 - (1 - transK(i)) * 60), Y(i) - 8], [500 + s * 78, Y(i) + 6]], true, 0.3)} fill={BONE} stroke={EDGE} strokeWidth={2} />
              ))}
            </g>
          </Part>
        </g>
      ))}
      {/* Intervertebral foramina: the gaps between consecutive pedicles, at disc level. */}
      {discs.map((i) => (
        <g key={i} opacity={Math.min(archK(i), archK(i + 1))}>
          <Part id="ornoarteko-zuloak">
            {[1, -1].map((s) => (
              <ellipse key={s} cx={500 + s * PX} cy={D(i)} rx={12} ry={11} fill={Q.space} stroke="#cbbfa0" strokeWidth={1.6} />
            ))}
          </Part>
        </g>
      ))}
      {/* Myotomes: between the bodies, each one reaching from one vertebra to the next. */}
      {myo > 0.01 && (
        <Part id="miotoma">
          {discs.map((i) =>
            [1, -1].map((s) => {
              const x = 500 + s * lerp(330, 262, myo);
              return (
                <g key={`${i}${s}`} opacity={myo}>
                  <path d={`M${f1(x - s * 30)},${D(i) - 18}L${500 + s * 150},${Y(i) - 12}M${f1(x - s * 30)},${D(i) + 18}L${500 + s * 150},${Y(i + 1) - 12}`} stroke={MYO} strokeWidth={3} opacity={seg(myo, 0.5, 1)} />
                  <rect x={x - 32} y={D(i) - 27} width={64} height={54} rx={14} fill={MYO} stroke="#8f2a26" strokeWidth={1.6} />
                  <rect x={x - 32} y={D(i) - 27} width={64} height={54} rx={14} fill="url(#w8-muscle)" />
                </g>
              );
            }),
          )}
        </Part>
      )}
      {/* A pair of spinal nerves per segment, out through the foramina. */}
      <Part id="nerbio-espinalak" show={nerve(0) > 0.01 ? 1 : 0}>
        {discs.map((i) =>
          [1, -1].map((s) => {
            const u = nerve(i);
            if (u <= 0.01) return null;
            const p = sub(nervePath(i, s as 1 | -1), u);
            const d = `M${p.map((q) => `${f1(q[0])},${f1(q[1])}`).join('L')}`;
            // The spinal ganglion swells the dorsal root in the foramen.
            const gx = 500 + s * (PX + 6);
            return (
              <g key={`${i}${s}`}>
                <path d={d} fill="none" stroke="#7a6410" strokeWidth={7} strokeLinecap="round" />
                <path d={d} fill="none" stroke={Q.nerve} strokeWidth={4.4} strokeLinecap="round" />
                {u > 0.4 && <ellipse cx={gx} cy={D(i) + 3} rx={9} ry={6.5} fill={Q.nerve} stroke="#7a6410" strokeWidth={1.4} opacity={seg(u, 0.4, 0.6)} />}
              </g>
            );
          }),
        )}
      </Part>

      <Note x={250} y={30} size={12.5} tone="accent">
        Bizkarrezurra atzetik, laminak kenduta
      </Note>
      {REG_N.map((n, k) => {
        const ys = levels.filter((i) => REGION(i) === k);
        const y = (Y(ys[0]) + Y(ys[ys.length - 1])) / 2;
        return (
          <g key={n}>
            <Part id="ornomuina" quiet>
              <rect x={828} y={y - 6} width={12} height={12} rx={3} fill={REG_C[k]} stroke="#8fa7ff" strokeWidth={1} opacity={vis(t, OR_T.canal + 0.06)} />
            </Part>
            <Note x={846} y={y} size={13.5} align="start" show={vis(t, OR_T.canal + 0.06)}>
              {n}
            </Note>
          </g>
        );
      })}
      <Note x={500} y={612} tone="accent" show={vis(t, OR_T.body, OR_T.arch)}>
        Orno gorputzak bata bestearen gainean, ornoarteko diskoak haien artean
      </Note>
      <Note x={500} y={612} tone="accent" show={vis(t, OR_T.arch, OR_T.trans)}>
        Pedikuluek arkua gorputzari lotzen diote; pedikuluen artean ornoarteko zuloak
      </Note>
      <Note x={500} y={612} tone="accent" show={vis(t, OR_T.trans, OR_T.canal)}>
        Arkutik alboetara apofisi zeharrak (laminak eta arantza apofisiak kenduta daude)
      </Note>
      <Note x={500} y={612} tone="accent" show={vis(t, OR_T.canal, OR_T.nerves)}>
        Orno guztien zuloak elkarren segidan: hodi errakideoa, ornomuina barruan
      </Note>
      <Note x={500} y={612} tone="accent" show={vis(t, OR_T.nerves, OR_T.myo)}>
        Segmentu bakoitzean nerbio espinal bikote bat, ornoarteko zuloetatik (diskoen mailan)
      </Note>
      <Note x={500} y={612} tone="accent" show={vis(t, OR_T.myo)}>
        Orno gorputzak segmentu arteko mailetan; miotomak eta nerbioak orno gorputzen artean
      </Note>

      <Label id="hodi-errakideoa" x={190} y={70} ax={447} ay={Y(0) - 28} show={seg(t, OR_T.canal + 0.02, OR_T.canal + 0.05)} />
      <Label id="ornomuina" x={190} y={180} ax={486} ay={Y(1) + 6} />
      <Label id="orno-gorputza" x={190} y={300} ax={466} ay={Y(3) - 14} show={bodyK(3)} />
      <Label id="ornoarteko-diskoa" x={190} y={420} ax={466} ay={D(4)} show={Math.min(bodyK(4), bodyK(5))} />
      <Label id="pedikulua" x={190} y={520} ax={500 - PX - 12} ay={Y(6) + 8} show={archK(6)} small />
      <Label id="ornoarteko-zuloak" x={770} y={92} ax={500 + PX + 10} ay={D(0) - 6} show={Math.min(archK(0), archK(1))} />
      <Label id="apofisi-zeharrak" x={810} y={210} ax={647} ay={Y(2) - 9} show={transK(2)} small />
      <Label id="nerbio-espinalak" x={810} y={410} ax={500 + 170} ay={D(2) + 9} show={seg(nerve(2), 0.7, 1)} />
      <Label id="miotoma" x={810} y={566} ax={500 + 262 + 28} ay={D(4) + 6} show={seg(myo, 0.4, 0.8)} />
    </g>
  );
}
