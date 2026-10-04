'use client';

import { Arrow, Label, Mark, Note, clamp, lin, seg, type Pt, type SceneProps } from '@/components/kit';
import { computeFold } from './FoldSagittal';
import { FoldXDrawing, foldXAnchors, foldXGeo, foldXScreen } from './FoldTransverse';

/**
 * Stage `tolespenak` — transverse + cephalocaudal folding of the trilaminar disc into the
 * C-shaped cylindrical embryo (notes §1, figures 1, 2, 5, 10; Langman figs. 6-18 and 6-19).
 *
 * Both views run on the same `t`, so scrubbing keeps the sagittal and transverse pictures at the same
 * moment; a small sagittal key in the transverse view shows where the section is cut.
 */

export { FoldingSagittal } from './FoldSagittal';

/** Lateral fold at the level of the midgut (0 → .9: walls at the vitelline duct), then the section slides caudally (lam). */
export function transverseTiming(t: number) {
  const f = 0.9 * Math.pow(lin(t, 0.03, 0.7), 1.08);
  const lam = seg(t, 0.72, 0.785);
  return { f, lam };
}

const mirror = (p: Pt): Pt => [-p[0], p[1]];

/** Sagittal key: the embryo in midline section at the same t, and the plane of the transverse cut through it. */
function SectionKey({ t, lam }: { t: number; lam: number }) {
  const F = computeFold(t);
  const { g } = F;
  // Fit the embryo (without the far yolk sac) into the key box.
  const pts = F.ecto;
  const xs = pts.map((p) => p[0]);
  const ys = pts.map((p) => p[1]);
  const x0 = Math.min(...xs);
  const x1 = Math.max(...xs);
  const y0 = Math.min(...ys);
  const y1 = Math.max(...ys);
  const box = { x: 20, y: 468, w: 166, h: 100 };
  const k = Math.min(box.w / (x1 - x0), (box.h - 10) / (y1 - y0));
  const ox = box.x + (box.w - k * (x1 - x0)) / 2;
  const oy = box.y + 8;
  const S = (p: Pt): Pt => [ox + k * (p[0] - x0), oy + k * (p[1] - y0)];
  const d = (arr: Pt[]) => `M${arr.map((p) => S(p).map((v) => v.toFixed(1)).join(',')).join('L')}`;
  // The section level: the midgut (vitelline duct), then just caudal to it.
  const sMid = (g.sAIP + g.sCIP) / 2 + 46 * lam;
  const a = S(F.X(g.map(sMid, -16)));
  const b = S(F.X(g.map(sMid, 66)));
  const ext = 7;
  const u: Pt = [(b[0] - a[0]) / Math.hypot(b[0] - a[0], b[1] - a[1]), (b[1] - a[1]) / Math.hypot(b[0] - a[0], b[1] - a[1])];
  const A: Pt = [a[0] - u[0] * ext, a[1] - u[1] * ext];
  const B: Pt = [b[0] + u[0] * ext, b[1] + u[1] * ext];
  return (
    <g pointerEvents="none">
      <rect x={box.x - 8} y={box.y - 8} width={box.w + 16} height={box.h + 44} rx={9} fill="rgba(10,10,12,0.78)" stroke="rgba(232,238,252,0.12)" />
      <path d={d(F.pieces.flat())} fill="none" stroke="#f2c14e" strokeWidth={1.1} opacity={0.75} />
      <path d={d(F.ntTop)} fill="none" stroke="#3a5fd9" strokeWidth={1.6} />
      <path d={d(F.ecto)} fill="none" stroke="#7aa7f5" strokeWidth={1.4} />
      <path d={`M${A[0].toFixed(1)},${A[1].toFixed(1)}L${B[0].toFixed(1)},${B[1].toFixed(1)}`} stroke="#0f0f11" strokeWidth={4.2} strokeLinecap="round" />
      <path d={`M${A[0].toFixed(1)},${A[1].toFixed(1)}L${B[0].toFixed(1)},${B[1].toFixed(1)}`} stroke="#ffb86b" strokeWidth={2} strokeLinecap="round" />
      {/* Two Notes (they grow with the stage's label scale): one long line could not grow inside the inset. */}
      <Note x={box.x + box.w / 2} y={box.y + box.h + 6} size={11.5}>
        Ebakia:
      </Note>
      <Note x={box.x + box.w / 2} y={box.y + box.h + 22} size={11.5}>
        {lam > 0.5 ? 'zilbor-eskualdetik beherago' : 'erdiko hestearen mailan'}
      </Note>
    </g>
  );
}

export function FoldingTransverse({ t }: SceneProps) {
  const { f, lam } = transverseTiming(t);
  const g = foldXGeo(f, lam);
  const { X, k } = foldXScreen(g);
  const A = foldXAnchors(g);
  const R = (p: Pt) => X(p);
  const Lf = (p: Pt) => X(mirror(p));

  // Steps of the transverse view: .44 lateral folds (cause: somites), .56 gut + duct, .72 walls meet.
  const cause = seg(t, 0.44, 0.47) * (1 - seg(t, 0.54, 0.56));
  const folds = seg(t, 0.44, 0.47) * (1 - seg(t, 0.7, 0.72));
  const fuse = seg(t, 0.72, 0.75) * (1 - seg(t, 0.8, 0.83));
  const lateral = seg(t, 0.42, 0.46);

  // Fold arrows: where each wall edge is heading (its position a little later), drawn just outside the edge.
  const ahead = foldXGeo(Math.min(0.9, f + 0.14), lam).E0;
  const edgeArrow = (side: 1 | -1) => {
    const p = side > 0 ? g.E0 : mirror(g.E0);
    const q = side > 0 ? ahead : mirror(ahead);
    return <Arrow key={side} from={X([p[0] + side * 26, p[1] + 6])} to={X([q[0] + side * 26, q[1] + 18])} color="#fbbf24" width={2.6} show={folds * clamp((0.9 - f) / 0.05)} bend={side * -0.25} />;
  };
  const meet = X([0, g.E0[1]]);

  return (
    <g>
      <FoldXDrawing g={g} X={X} k={k} ghost={lam} />

      {/* Cause: the somites grow and push the body wall down and in. */}
      {([1, -1] as const).map((side) => {
        const a = X(side > 0 ? A.somite : mirror(A.somite));
        const b = X(side > 0 ? A.wallMid : mirror(A.wallMid));
        return <Arrow key={side} from={[a[0] + side * 22 * k, a[1] + 8 * k]} to={b} color="#f97316" width={2.6} show={cause} bend={side * -0.18} />;
      })}
      {edgeArrow(1)}
      {edgeArrow(-1)}

      {/* The lateral fold happens at the two edges; the walls meet at the ventral midline. */}
      <Mark id="tolestura-laterala" x={R(g.E0)[0]} y={R(g.E0)[1]} rx={28} show={folds} />
      <Mark id="tolestura-laterala" x={Lf(g.E0)[0]} y={Lf(g.E0)[1]} rx={28} show={folds} />
      <Mark id="tolestura-laterala" x={meet[0]} y={meet[1]} rx={30} show={fuse} />

      <Note x={500} y={612} tone="accent" show={cause}>
        Eragilea: somitak hazi eta ertzak behera eta erdirantz bultzatzen dituzte
      </Note>
      <Note x={500} y={612} tone="accent" show={seg(t, 0.56, 0.58) * (1 - seg(t, 0.7, 0.72))}>
        Erdiko hestea bitelo zakuarekin komunikatuta: hodi onfalomesenterikoa
      </Note>
      <Note x={500} y={612} tone="accent" show={fuse}>
        Ertzak elkartzen dira → gorputz-horma bentrala; zeloma isolatuta geratzen da
      </Note>
      <Note x={500} y={612} show={seg(t, 0.82, 0.86)}>
        Zilbor-eskualdean ez da ixten: hodi onfalomesenterikoa kanpora doa
      </Note>
      <Note x={500} y={590} tone="dim" show={seg(t, 0.02, 0.06) * (1 - seg(t, 0.72, 0.745))}>
        Tolestu arte, enbrioi barruko zeloma korion barrunbearekin jarraia da
      </Note>

      <SectionKey t={t} lam={lam} />

      <Label id="amnios-barrunbea" x={190} y={78} ax={Lf(A.amnion)[0]} ay={Lf(A.amnion)[1]} />
      <Label id="ektodermoa" x={190} y={114} ax={Lf(A.ecto)[0]} ay={Lf(A.ecto)[1]} />
      <Label id="tolestura-laterala" x={190} y={150} ax={Lf(g.E0)[0]} ay={Lf(g.E0)[1]} show={lateral * (1 - lam)} />
      <Label id="paretako-orria" x={190} y={232} ax={Lf(A.parietal)[0]} ay={Lf(A.parietal)[1]} />
      <Label id="errai-orria" x={190} y={268} ax={Lf(A.visceral)[0]} ay={Lf(A.visceral)[1]} />
      <Label id="korion-barrunbea" x={190} y={380} ax={Lf(A.chorion)[0]} ay={Lf(A.chorion)[1]} small />
      <Label id="bitelo-zaku-sekundarioa" x={190} y={430} ax={Lf(A.yolk)[0]} ay={Math.min(Lf(A.yolk)[1], 600)} show={1 - 0.75 * lam} />

      <Label id="hodi-neurala" x={810} y={78} ax={R(A.tube)[0]} ay={R(A.tube)[1]} />
      <Label id="somitak" x={810} y={112} ax={R(A.somite)[0]} ay={R(A.somite)[1]} small />
      <Label id="notokorda" x={810} y={146} ax={R(A.noto)[0]} ay={R(A.noto)[1]} small />
      <Label id="aorta-dortsalak" x={810} y={180} ax={R(A.aorta)[0]} ay={R(A.aorta)[1]} small />
      <Label id="mesodermo-intraenbrionarioa" x={810} y={246} ax={R(A.meso)[0]} ay={R(A.meso)[1]} small />
      <Label id="enbrioi-barruko-zeloma" x={810} y={282} ax={R(A.coelom)[0]} ay={R(A.coelom)[1]} />
      <Label id="mesenterio-dortsala" x={810} y={354} ax={R(A.mesentery)[0]} ay={R(A.mesentery)[1]} show={seg(g.mes, 8, 20)} small />
      <Label id="endodermoa" x={810} y={392} ax={R(A.gut)[0]} ay={R(A.gut)[1]} show={1 - seg(g.ff, 0.665, 0.69)} />
      <Label id="erdiko-hestea" x={810} y={392} ax={R(A.gut)[0]} ay={R(A.gut)[1]} show={seg(g.ff, 0.665, 0.69)} />
      <Label id="hodi-onfalomesenterikoa" x={810} y={430} ax={R(A.duct)[0]} ay={Math.min(R(A.duct)[1], 600)} show={seg(t, 0.54, 0.58) * (1 - 0.75 * lam)} />
    </g>
  );
}
