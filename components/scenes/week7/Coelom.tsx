'use client';

import { Arrow, C, Label, Mark, Note, Part, lin, seg, type Pt, type SceneProps } from '@/components/kit';
import { FoldXDrawing, foldXAnchors, foldXGeo, foldXScreen } from '@/components/scenes/week4/FoldTransverse';
import { f1, vis } from './common';

/**
 * 7:zeloma:zeharkakoa — apunteen 1. atala eta 23. orriko irudiak (A–D eta A–C): hiru orriko diskoaren
 * zeharkako mozketa enborraren mailan. Alboko mesodermoa paretako orrian (somatopleura) eta errai orrian
 * (esplaknopleura) banatuta dago, eta bien arteko enbrioi barruko zeloma korion barrunbearekin jarraia da
 * ertzetan. Zeharkako tolespenak alboko ertzak aurrerantz eta erdirantz eramaten ditu; hormak elkartzean
 * zeloma gorputzaren barruan geratzen da, korion barrunbetik isolatuta, eta hestea mesenterio
 * dortsaletik zintzilik. Topic 4's cell-built section drawing is reused; only the pacing and the names change.
 */

const mirrorL = (p: Pt): Pt => [-p[0], p[1]];

/** Fold 0 → 0.9 (walls at the vitelline duct), then the section slides just below the umbilical region. */
export function coelomTiming(t: number) {
  const f = 0.9 * Math.pow(lin(t, 0.05, 0.7), 1.08);
  const lam = seg(t, 0.71, 0.79);
  return { f, lam };
}

export function CoelomFold({ t }: SceneProps) {
  const { f, lam } = coelomTiming(t);
  const g = foldXGeo(f, lam);
  const { X, k } = foldXScreen(g);
  const A = foldXAnchors(g);
  const R = (p: Pt) => X(p);
  const L = (p: Pt) => X(mirrorL(p));

  // Intermediate mesoderm: the small cord between the somite and the lateral plate.
  const im = g.mapT(118, 64);
  const imRot = (Math.atan2(g.mapT(122, 64)[1] - g.mapT(114, 64)[1], g.mapT(122, 64)[0] - g.mapT(114, 64)[0]) * 180) / Math.PI;

  // Continuity: until the walls meet, the coelom opens at each edge straight into the chorionic cavity.
  const open = vis(t, 0.36, 0.69);
  const port = g.botSp.pts[g.botSp.iBody];
  const gate: Pt = [(g.E0[0] + port[0]) / 2, (g.E0[1] + port[1]) / 2];
  const out: Pt = [gate[0] + (gate[0] - A.coelom[0]) * 0.7, gate[1] + (gate[1] - A.coelom[1]) * 0.7];
  const contArrow = (side: 1 | -1) => {
    const P = side > 0 ? R : L;
    return <Arrow key={`c${side}`} from={P(A.coelom)} to={P(out)} color="#c4a8ff" width={2.4} show={open * (1 - seg(f, 0.82, 0.88))} bend={side * 0.12} flow />;
  };

  // Folding arrows at the two edges: where the wall edge is heading.
  const folding = vis(t, 0.52, 0.69);
  const ahead = foldXGeo(Math.min(0.9, f + 0.14), lam).E0;
  const edgeArrow = (side: 1 | -1) => {
    const p = side > 0 ? g.E0 : mirrorL(g.E0);
    const q = side > 0 ? ahead : mirrorL(ahead);
    return <Arrow key={`e${side}`} from={X([p[0] + side * 26, p[1] + 6])} to={X([q[0] + side * 26, q[1] + 18])} color="#fbbf24" width={2.6} show={folding * Math.min(1, (0.9 - f) / 0.05)} bend={side * -0.25} />;
  };
  const meet = X([0, g.E0[1]]);
  const isolated = seg(t, 0.74, 0.8);

  return (
    <g>
      <FoldXDrawing g={g} X={X} k={k} ghost={lam} />

      <Part id="bitarteko-mesodermoa">
        {[1, -1].map((s) => {
          const [x, y] = X(s > 0 ? im : mirrorL(im));
          return (
            <g key={s} transform={`rotate(${f1(s > 0 ? imRot : 180 - imRot)} ${f1(x)} ${f1(y)})`}>
              <ellipse cx={x} cy={y} rx={15 * k} ry={9 * k} fill={C.mesoIntermediate} stroke="rgba(90,20,24,0.55)" strokeWidth={0.9} />
              <ellipse cx={x - 3 * k} cy={y - 2 * k} rx={6 * k} ry={3 * k} fill="#fff" opacity={0.18} />
            </g>
          );
        })}
      </Part>

      {contArrow(1)}
      {contArrow(-1)}
      {edgeArrow(1)}
      {edgeArrow(-1)}
      <Mark id="tolestura-laterala" x={R(g.E0)[0]} y={R(g.E0)[1]} rx={28} show={folding} />
      <Mark id="tolestura-laterala" x={L(g.E0)[0]} y={L(g.E0)[1]} rx={28} show={folding} />
      <Mark id="tolestura-laterala" x={meet[0]} y={meet[1]} rx={30} show={vis(t, 0.68, 0.84)} />

      <Note x={500} y={590} show={vis(t, 0.18, 0.36)}>
        Alboko mesodermoa = paretako orria + errai orria; tartean, zeloma
      </Note>
      <Note x={500} y={612} tone="accent" show={open * (1 - isolated)}>
        Ertzetan zabalik: enbrioi barruko zeloma ↔ korion barrunbea (jarraia)
      </Note>
      <Note x={500} y={590} show={folding * (1 - isolated)}>
        Alboko ertzak aurrerantz eta erdirantz
      </Note>
      <Note x={500} y={612} tone="accent" show={isolated}>
        Hormak elkartu dira: zeloma gorputzaren barruan, korion barrunbetik isolatuta
      </Note>
      <Note x={500} y={590} show={vis(t, 0.84)}>
        Zeloma hau gorputz osoan hedatzen da: geroko toraxetik abdomenera
      </Note>

      <Label id="amnios-barrunbea" x={190} y={78} ax={L(A.amnion)[0]} ay={L(A.amnion)[1]} />
      <Label id="ektodermoa" x={190} y={114} ax={L(A.ecto)[0]} ay={L(A.ecto)[1]} />
      {/* Follows the fold: the left edge while it moves, then the midline where the two walls meet. */}
      <Label id="tolestura-laterala" x={190} y={150} ax={t < 0.68 ? L(g.E0)[0] : meet[0]} ay={t < 0.68 ? L(g.E0)[1] : meet[1]} show={vis(t, 0.5, 0.84)} />
      <Label id="paretako-orria" x={190} y={232} ax={L(A.parietal)[0]} ay={L(A.parietal)[1]} />
      <Label id="errai-orria" x={190} y={268} ax={L(A.visceral)[0]} ay={L(A.visceral)[1]} />
      <Label id="korion-barrunbea" x={190} y={380} ax={L(A.chorion)[0]} ay={L(A.chorion)[1]} small />
      <Label id="bitelo-zaku-sekundarioa" x={190} y={430} ax={L(A.yolk)[0]} ay={Math.min(L(A.yolk)[1], 600)} show={1 - 0.75 * lam} />

      <Label id="hodi-neurala" x={810} y={78} ax={R(A.tube)[0]} ay={R(A.tube)[1]} />
      <Label id="somitak" x={810} y={112} ax={R(A.somite)[0]} ay={R(A.somite)[1]} small />
      <Label id="notokorda" x={810} y={150} ax={R(A.noto)[0]} ay={R(A.noto)[1]} small />
      <Label id="aorta-dortsalak" x={810} y={190} ax={R(A.aorta)[0]} ay={R(A.aorta)[1]} small />
      <Label id="bitarteko-mesodermoa" x={810} y={238} ax={R(im)[0]} ay={R(im)[1]} small />
      <Label id="alboko-mesodermoa" x={810} y={272} ax={R(A.parietal)[0]} ay={R(A.parietal)[1]} small />
      <Label id="enbrioi-barruko-zeloma" x={810} y={310} ax={R(A.coelom)[0]} ay={R(A.coelom)[1]} />
      <Label id="mesenterio-dortsala" x={810} y={354} ax={R(A.mesentery)[0]} ay={R(A.mesentery)[1]} show={seg(g.mes, 8, 20)} small />
      <Label id="endodermoa" x={810} y={392} ax={R(A.gut)[0]} ay={R(A.gut)[1]} show={1 - seg(g.ff, 0.665, 0.69)} />
      <Label id="erdiko-hestea" x={810} y={392} ax={R(A.gut)[0]} ay={R(A.gut)[1]} show={seg(g.ff, 0.665, 0.69)} />
      <Label id="hodi-onfalomesenterikoa" x={810} y={430} ax={R(A.duct)[0]} ay={Math.min(R(A.duct)[1], 600)} show={seg(g.ff, 0.5, 0.6) * (1 - 0.75 * lam)} />
    </g>
  );
}
