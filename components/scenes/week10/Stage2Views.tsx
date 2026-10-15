'use client';

import { Label, Note, Part, lerp, seg, zoom, type SceneProps } from '@/components/kit';
import { FoldBody, LH, D_ROOF, computeFold, type P2 } from '@/components/scenes/week4/FoldSagittal';
import type { V3 } from '@/lib/three-d/math';
import { T, f1, vis } from './common';
import { D2 } from './Fusion';
import { HeartView, cameraAt, orbit, type CalloutSpec } from './Heart3D';
import { POSE0, centreline, type HeartPose } from './model3d';

/**
 * Stage 2 (bihotz-hodia), the two views the transverse section cannot give.
 *
 * `HeadFoldSagittal` (view `sagitala`) — topic 4's mid-sagittal fold (week4/FoldSagittal, the same drawing
 * the student has seen), with this topic's layer on top: the brain vesicles grow, the head folds, and the
 * cardiogenic plate goes from in front of the head to the neck and then to the thorax, caudal to the brain
 * vesicles and the buccopharyngeal membrane (p10). Its route is drawn as it moves. Later (p21) the fold is
 * replayed with the dorsal aorta in red: its cranial end is carried ventrally and joins the cranial end of
 * the heart tube through the first aortic arch.
 *
 * `ZipperFront` (view `3d`) — the frontal section of the notes' figure (p20) in 3D: the two endocardial
 * tubes fuse from cranial to caudal, and behind them, at the back of the embryo, the dorsal aortas run top
 * to bottom; cranially they meet the cranial end of the heart tube (p19).
 */

/** Stage time → topic 4's fold time: the head fold during p10; replayed for p21. */
function foldTime(t: number) {
  if (t < 0.6) return 0.5 * seg(t, D2.fold[0] + 0.01, D2.fold[1] - 0.02);
  return lerp(0.12, 0.52, seg(t, 0.905, 0.955));
}

const heartCache = new Map<number, P2>();
function heartAt(u: number): P2 {
  const k = Math.round(u * 50);
  let p = heartCache.get(k);
  if (!p) {
    p = computeFold(k / 50, 5, 1).heartC;
    heartCache.set(k, p);
  }
  return p;
}

export function HeadFoldSagittal({ t }: SceneProps) {
  const u = foldTime(t);
  const f = computeFold(u, 5, 1);
  const { g, X, map, fH, LF, heartC, heartO, bmMid } = f;
  const late = t >= 0.6;
  const p10 = vis(t, 0, 0.6);
  // The heart tube's two ends (the ring's long axis runs along the flap: v grows caudally once folded).
  const ax: P2 = [heartO[0][0] - heartC[0], heartO[0][1] - heartC[1]];
  const half = Math.hypot(ax[0], ax[1]) || 1;
  const dir: P2 = [ax[0] / half, ax[1] / half];
  const flapDir = (() => {
    const a = X(fH(LF * 0.3, 0));
    const b = X(fH(LF * 0.5, 0));
    const l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
    return [(b[0] - a[0]) / l, (b[1] - a[1]) / l] as P2;
  })();
  const sgn = dir[0] * flapDir[0] + dir[1] * flapDir[1] > 0 ? -1 : 1;
  const arterial: P2 = [heartC[0] + dir[0] * half * sgn * 0.82, heartC[1] + dir[1] * half * sgn * 0.82];

  // The dorsal aorta: between the notochord and the gut roof, from the cranial end of the foregut caudally.
  const aoPts: P2[] = Array.from({ length: 40 }, (_, i) => X(map(lerp(-0.93 * LH, 0.8 * LH, i / 39), D_ROOF - 3.5)));
  const A = aoPts[0];
  const tng: P2 = (() => {
    const l = Math.hypot(aoPts[1][0] - A[0], aoPts[1][1] - A[1]) || 1;
    return [(A[0] - aoPts[1][0]) / l, (A[1] - aoPts[1][1]) / l];
  })();
  const archGrow = seg(t, 0.935, 0.96);
  const c1: P2 = [A[0] + tng[0] * 26, A[1] + tng[1] * 26];
  const c2: P2 = [arterial[0] - dir[0] * sgn * 30, arterial[1] - dir[1] * sgn * 30];
  const bez = (k: number): P2 => {
    const v = 1 - k;
    return [v * v * v * A[0] + 3 * v * v * k * c1[0] + 3 * v * k * k * c2[0] + k * k * k * arterial[0], v * v * v * A[1] + 3 * v * v * k * c1[1] + 3 * v * k * k * c2[1] + k * k * k * arterial[1]];
  };
  const nArch = Math.max(2, Math.round(24 * archGrow));
  const arch = Array.from({ length: nArch }, (_, i) => bez((i / (nArch - 1)) * archGrow));
  const pd = (pts: P2[]) => pts.map((q, i) => `${i ? 'L' : 'M'}${f1(q[0])},${f1(q[1])}`).join('');

  // The cardiogenic plate's route: sampled from the start of the fold to now.
  const route: P2[] = [];
  for (let k = 0; k <= u + 1e-6; k += 0.02) route.push(heartAt(k));
  route.push(heartC);
  const plate = 1 - seg(t, D2.fold[1] + 0.025, D2.fold[1] + 0.045);
  const brain = X(map(g.sHT + 22, g.cen(g.sHT + 22)));
  const aoShow = late ? 1 : 0;

  // Camera: the whole embryo first, then in on the head and heart, following the heart as it moves.
  const zs = late ? lerp(1, 2.3, seg(t, 0.95, 0.972)) : lerp(1, 1.85, seg(t, 0.115, 0.145));
  const archMid = bez(0.5);
  const fp: P2 = late ? [lerp(heartC[0], archMid[0], 0.5), lerp(heartC[1], archMid[1], 0.5)] : [lerp(heartC[0], bmMid[0], 0.35), lerp(heartC[1], bmMid[1], 0.35)];
  const z = zoom(fp[0], fp[1], zs, lerp(500, 470, (zs - 1) / 0.85), lerp(318, 300, (zs - 1) / 0.85));
  const Z = (q: P2) => z.at(q[0], q[1]);
  return (
    <g>
      <rect x={0} y={0} width={1000} height={640} fill="#0f0f11" />
      <g transform={z.transform}>
      <FoldBody f={f} kloakaShow={0} bare />
      {/* This topic's names for what topic 4 drew: the pericardial cavity, the cardiogenic plate. */}
      <Part id="perikardio-barrunbea">
        <path d={pd(f.cavPoly(8, f.vSplit)) + 'Z'} fill={T.peri} />
      </Part>
      {plate > 0.01 && (
        <Part id="plaka-kardiogenikoa" show={plate}>
          <path d={pd(heartO) + 'Z'} fill={T.plate} opacity={0.85} />
        </Part>
      )}
      <Part id="garun-xixkuak" quiet>
        <ellipse cx={brain[0]} cy={brain[1]} rx={26} ry={20} fill="rgba(80,120,255,0.001)" />
      </Part>

      {/* The plate's route: from where it started (dot) to where it is now. */}
      {!late && route.length > 2 && (
        <g pointerEvents="none" opacity={p10}>
          <path d={pd(route)} fill="none" stroke="rgba(10,6,12,0.8)" strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" />
          <path d={pd(route)} fill="none" stroke="#ffd27a" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" strokeDasharray="1 0" />
          <circle cx={route[0][0]} cy={route[0][1]} r={4.5} fill="#ffd27a" stroke="rgba(10,6,12,0.8)" strokeWidth={1.4} />
        </g>
      )}

      {/* Dorsal aorta (p19, p21) and the first aortic arch to the heart's cranial end. */}
      {aoShow > 0 && (
        <>
          <Part id="aorta-dortsalak">
            <path d={pd(aoPts)} fill="none" stroke={T.aortaDeep} strokeWidth={7.5} strokeLinecap="round" />
            <path d={pd(aoPts)} fill="none" stroke={T.aorta} strokeWidth={5} strokeLinecap="round" />
          </Part>
          {archGrow > 0.01 && (
            <Part id="aorta-arkuak">
              <path d={pd(arch)} fill="none" stroke={T.o2Deep} strokeWidth={6.5} strokeLinecap="round" />
              <path d={pd(arch)} fill="none" stroke={T.o2} strokeWidth={4} strokeLinecap="round" />
            </Part>
          )}
        </>
      )}

      </g>

      <Label id="garun-xixkuak" x={190} y={150} ax={Z([brain[0], brain[1]])[0]} ay={Z([brain[0], brain[1]])[1]} show={p10 * seg(t, 0.1, 0.112)} />
      <Label id="plaka-kardiogenikoa" x={190} y={270} ax={Z([heartC[0], heartC[1]])[0]} ay={Z([heartC[0], heartC[1]])[1]} show={p10 * plate} />
      <Label id="bihotz-hodia" x={190} y={362} ax={Z([heartC[0], heartC[1]])[0]} ay={Z([heartC[0], heartC[1]])[1]} show={late ? 1 : p10 * (1 - plate)} />
      <Label id="perikardio-barrunbea" x={190} y={400} ax={Z([X(fH(LF * 0.2, 14 + g.sp(LF * 0.2) + g.cav(LF * 0.2) * 0.5))[0], X(fH(LF * 0.2, 14 + g.sp(LF * 0.2) + g.cav(LF * 0.2) * 0.5))[1]])[0]} ay={Z([X(fH(LF * 0.2, 14 + g.sp(LF * 0.2) + g.cav(LF * 0.2) * 0.5))[0], X(fH(LF * 0.2, 14 + g.sp(LF * 0.2) + g.cav(LF * 0.2) * 0.5))[1]])[1]} show={p10} small />
      <Label id="mintz-bukofaringeoa" x={190} y={210} ax={Z([bmMid[0], bmMid[1]])[0]} ay={Z([bmMid[0], bmMid[1]])[1]} show={1} small />
      <Label id="aurreko-hestea" x={190} y={434} ax={Z([X(fH(LF * 0.15, 0))[0], X(fH(LF * 0.15, 0))[1]])[0]} ay={Z([X(fH(LF * 0.15, 0))[0], X(fH(LF * 0.15, 0))[1]])[1]} small />
      <Label id="notokorda" x={810} y={250} ax={Z([X(map(0.05 * LH, 21))[0], X(map(0.05 * LH, 21))[1]])[0]} ay={Z([X(map(0.05 * LH, 21))[0], X(map(0.05 * LH, 21))[1]])[1]} small />
      <Label id="aorta-dortsalak" x={810} y={380} ax={Z([aoPts[late && zs > 1.5 ? 6 : 30][0], aoPts[late && zs > 1.5 ? 6 : 30][1]])[0]} ay={Z([aoPts[late && zs > 1.5 ? 6 : 30][0], aoPts[late && zs > 1.5 ? 6 : 30][1]])[1]} show={aoShow} />
      <Label id="aorta-arkuak" x={190} y={470} ax={Z([arch[Math.floor(arch.length * 0.55)][0], arch[Math.floor(arch.length * 0.55)][1]])[0]} ay={Z([arch[Math.floor(arch.length * 0.55)][0], arch[Math.floor(arch.length * 0.55)][1]])[1]} show={archGrow > 0.3 ? seg(archGrow, 0.3, 0.6) : 0} />

      <Note x={500} y={588} tone="accent" show={vis(t, 0.105, 0.17)}>
        Garun xixkuak hazten dira (tolespen zefalokaudala): plaka kardiogenikoa alde kaudalera doa
      </Note>
      <Note x={500} y={588} tone="accent" show={vis(t, 0.17, 0.235)}>
        Hasieran perikardio barrunbea eta plaka kardiogenikoa lepo mailan daude
      </Note>
      <Note x={500} y={588} tone="accent" show={vis(t, 0.235, 0.6)}>
        Azkenean torax barrunbean: garun xixkuen eta mintz bukofaringeoaren alde kaudalean
      </Note>
      <Note x={500} y={588} tone="accent" show={vis(t, 0.9, 0.955)}>
        Tolespenak aorta dortsalen alde zefalikoa gero eta aurrerago (bentralago) eramaten du
      </Note>
      <Note x={500} y={588} tone="accent" show={vis(t, 0.94, 2)}>
        Lehen arku aortikoak aorta dortsala bihotz hodiaren alde zefalikoarekin lotzen du (2 arku: aorta bakoitzeko bat)
      </Note>
      <Note x={24} y={24} size={12.5} align="start" tone="dim">
        Erdiko mozketa sagitala (kraneala ezkerrean, dortsala goian)
      </Note>
    </g>
  );
}

// ———————————————————————————— p19–p20: the frontal "zipper" in 3D ————————————————————————————

export function ZipperFront({ t }: SceneProps) {
  const a = 0.82;
  const fuse = lerp(0.1, 1, seg(t, a + 0.01, a + 0.07));
  const pose: HeartPose = { ...POSE0, fuse, myo: 0.35, segs: 0, colour: 0, arches: 0, veins: 0.0 };
  const line = centreline(pose, 60);
  // An anchor inside the left tube (never the empty space between the two).
  const k = 0.82;
  const p = line[Math.round(k * 60)];
  const front = lerp(-0.05, 1.05, fuse);
  const below = Math.max(0, Math.min(1, (k - front) / 0.25));
  const leftTube: V3 = [p[0] + 0.36 * (below * below * (3 - 2 * below)), p[1], p[2] - 0.05 * below];
  const camera = cameraAt(t, [
    [0, orbit(0, 4, 12.5, [0, -0.3, -0.5], [40, 4])],
    [a + 0.07, orbit(-28, 12, 12.5, [0, -0.3, -0.6], [40, 4])],
  ]);
  const names: CalloutSpec[] = [
    { id: 'bihotz-hodiak', p: leftTube, show: fuse < 0.95 ? 1 : 0, text: 'Endokardio hodiak' },
    { id: 'bihotz-hodia', p: line[20], show: 1 },
    { id: 'notokorda', p: 'notokorda', show: 1, small: true },
    { id: 'aorta-dortsalak', p: 'aorta-dortsalak1', show: 1 },
    { id: 'aurreko-hestea', p: 'aurreko-hestea', show: 1, small: true },
    { id: 'perikardio-barrunbea', p: 'perikardio-barrunbea', show: 1, small: true },
  ];
  return (
    <HeartView
      pose={pose}
      opts={{ cavity: 0.6, septum: 0.6, gut: 0.6, aortas: 1, noto: 0.9 }}
      camera={camera}
      names={names}
      caption="3.–4. astea · mozketa frontala aurretik (3D): endokardio hodiak fusionatzen, atzean aorta dortsalak"
      over={() => (
        <>
          <Note x={500} y={612} tone="accent" show={vis(t, 0, a + 0.07)}>
            Bi endokardio hodiak goitik behera fusionatzen dira · atzean, aorta dortsalak goitik behera (gorriz)
          </Note>
          <Note x={500} y={612} tone="accent" show={vis(t, a + 0.07, 2)}>
            Aorta dortsalak enbrioiaren atzekaldean; goian bihotz hodiaren alde zefalikoarekin kontaktuan
          </Note>
        </>
      )}
    />
  );
}
