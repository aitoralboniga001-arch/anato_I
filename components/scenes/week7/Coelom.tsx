'use client';

import { Arrow, C, Label, Mark, Note, Part, lin, seg, type Pt, type SceneProps } from '@/components/kit';
import { FoldXDrawing, foldXAnchors, foldXGeo, foldXScreen } from '@/components/scenes/week4/FoldTransverse';
import { CavityKey, KEY7, P, f1, poly, vis } from './common';

/**
 * 7:zeloma:zeharkakoa — apunteen 1. atala eta 23. orriko irudiak (A–D eta A–C): hiru orriko diskoaren
 * zeharkako mozketa enborraren mailan. Alboko mesodermoa paretako orrian (somatopleura) eta errai orrian
 * (esplaknopleura) banatuta dago, eta bien arteko enbrioi barruko zeloma korion barrunbearekin jarraia da
 * ertzetan. Zeharkako tolespenak alboko ertzak aurrerantz eta erdirantz eramaten ditu; hormak elkartzean
 * zeloma gorputzaren barruan geratzen da, korion barrunbetik isolatuta, eta hestea mesenterio
 * dortsaletik zintzilik. Topic 4's cell-built section drawing is reused; only the pacing and the names change.
 */

const mirrorL = (p: Pt): Pt => [-p[0], p[1]];
/** Topic 4's lateral edge of the intermediate mesoderm (FoldTransverse's U_RIB): where the coelom begins. */
const U_RIB = 134;

type FoldX = ReturnType<typeof foldXGeo>;
/** The right half of the intra-embryonic coelom, as topic 4's drawing outlines it (body coordinates). */
function coelomHalf(g: FoldX): Pt[] {
  const off = (sp: FoldX['topSp'], i: number, d: number): Pt => [sp.pts[i][0] + sp.n[i][0] * d, sp.pts[i][1] + sp.n[i][1] * d];
  const { topSp, botSp } = g;
  const iRib = Math.round(U_RIB / g.top.ds);
  return [
    ...Array.from({ length: topSp.iBody - iRib + 1 }, (_, j) => off(topSp, iRib + j, topSp.a[iRib + j] + topSp.b[iRib + j])),
    ...Array.from({ length: botSp.iBody - g.iRoot + 1 }, (_, j) => {
      const i = botSp.iBody - j;
      return off(botSp, i, botSp.a[i] + botSp.b[i]);
    }),
    ...g.closing.slice().reverse(),
  ];
}

/**
 * Topic 4's placement, enlarged: this topic is about the section's cavities, so the embryo fills the
 * space between the two columns of names (about 600 of the 1000 units) instead of under half of it.
 */
function bigScreen(g: FoldX) {
  const { X: X0, k: k0 } = foldXScreen(g);
  const pts = g.topSp.pts.map(X0);
  const half = Math.max(...pts.map((p) => Math.abs(p[0] - 500)));
  const y0 = Math.min(...pts.map((p) => p[1]));
  const s = Math.max(1, Math.min(1.34, 300 / half));
  const top = 34;
  return { k: k0 * s, X: (p: Pt): Pt => { const q = X0(p); return [500 + (q[0] - 500) * s, top + (q[1] - y0) * s + Math.max(0, y0 - top) * 0.4]; } };
}

/** The dorsal mesentery, long and wide enough to see its two layers back to back (topic 4: 30 long, 3.2 wide). */
const MES_LEN = 42;
const MES_WAIST = 7;

/** Fold 0 → 0.9 (walls at the vitelline duct), then the section slides just below the umbilical region. */
export function coelomTiming(t: number) {
  const f = 0.9 * Math.pow(lin(t, 0.05, 0.7), 1.08);
  const lam = seg(t, 0.71, 0.79);
  return { f, lam };
}

export function CoelomFold({ t }: SceneProps) {
  const { f, lam } = coelomTiming(t);
  const g = foldXGeo(f, lam, MES_LEN, MES_WAIST);
  const { X, k } = bigScreen(g);
  const A = foldXAnchors(g);
  const R = (p: Pt) => X(p);
  const L = (p: Pt) => X(mirrorL(p));

  // Intermediate mesoderm: the small cord between the somite and the lateral plate.
  const im = g.mapT(118, 64);
  const ectoOver = g.mapT(74, 4);
  // The parietal layer named a little further down the wall than topic 4 does, clear of the intermediate mesoderm's leader.
  const iPar = Math.min(g.topSp.iBody, Math.round((U_RIB + 0.6 * g.lw) / g.top.ds));
  const parietal: Pt = [g.topSp.pts[iPar][0] + g.topSp.n[iPar][0] * (g.topSp.a[iPar] + g.topSp.b[iPar] * 0.5), g.topSp.pts[iPar][1] + g.topSp.n[iPar][1] * (g.topSp.a[iPar] + g.topSp.b[iPar] * 0.5)];
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
  const ahead = foldXGeo(Math.min(0.9, f + 0.14), lam, MES_LEN, MES_WAIST).E0;
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
      {/* The coelom is this topic's subject: the topic's coelom violet over topic 4's dark space (the colour key of topic 7). */}
      <g pointerEvents="none">
        {[1, -1].map((s) => {
          const d = poly(coelomHalf(g).map((p) => X(s > 0 ? p : mirrorL(p))));
          return (
            <g key={s}>
              <path d={d} fill={P.coelomSolid} opacity={0.5} />
              <path d={d} fill="none" stroke={P.coelomEdge} strokeWidth={1.6} opacity={0.85} />
            </g>
          );
        })}
      </g>

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

      <CavityKey rows={[KEY7.zeloma]} />
      <Label id="amnios-barrunbea" x={190} y={78} ax={L(A.amnion)[0]} ay={L(A.amnion)[1]} />
      {/* The surface ectoderm named over the somite (medial to it and above): the leaders to the somite and the intermediate mesoderm pass under it. */}
      <Label id="ektodermoa" x={190} y={114} ax={L(ectoOver)[0]} ay={L(ectoOver)[1]} />
      {/* Follows the fold: the left edge while it moves, then the midline where the two walls meet. */}
      <Label id="tolestura-laterala" x={190} y={150} ax={t < 0.68 ? L(g.E0)[0] + 21 : meet[0] + 26} ay={t < 0.68 ? L(g.E0)[1] + 16 : meet[1]} show={vis(t, 0.5, 0.84)} />
      <Label id="somitak" x={190} y={186} ax={L(A.somite)[0]} ay={L(A.somite)[1]} small />
      <Label id="bitarteko-mesodermoa" x={190} y={222} ax={L(im)[0]} ay={L(im)[1]} small />
      <Label id="paretako-orria" x={190} y={258} ax={L(parietal)[0]} ay={L(parietal)[1]} />
      <Label id="errai-orria" x={190} y={294} ax={L(A.visceral)[0]} ay={L(A.visceral)[1]} />
      <Label id="korion-barrunbea" x={190} y={380} ax={L(A.chorion)[0] - 5} ay={L(A.chorion)[1] - 4} small />
      <Label id="bitelo-zaku-sekundarioa" x={190} y={430} ax={L(A.yolk)[0]} ay={Math.min(L(A.yolk)[1], 600)} show={1 - 0.75 * lam} />

      <Label id="hodi-neurala" x={810} y={78} ax={R(A.tube)[0]} ay={R(A.tube)[1]} />
      <Label id="notokorda" x={810} y={150} ax={R(A.noto)[0]} ay={R(A.noto)[1]} small />
      <Label id="aorta-dortsalak" x={810} y={190} ax={R(A.aorta)[0]} ay={R(A.aorta)[1]} small />
      <Label id="alboko-mesodermoa" x={810} y={272} ax={R(A.parietal)[0]} ay={R(A.parietal)[1]} small />
      <Label id="enbrioi-barruko-zeloma" x={810} y={310} ax={R(A.coelom)[0]} ay={R(A.coelom)[1]} />
      <Label id="mesenterio-dortsala" sub="atzeko mesenterioa" x={810} y={354} ax={R(A.mesentery)[0] - 6} ay={R(A.mesentery)[1] - 9} show={seg(g.mes, 8, 20)} small />
      <Label id="endodermoa" x={810} y={392} ax={R(A.gut)[0]} ay={R(A.gut)[1]} show={1 - seg(g.ff, 0.665, 0.69)} />
      <Label id="erdiko-hestea" x={810} y={392} ax={R(A.gut)[0]} ay={R(A.gut)[1]} show={seg(g.ff, 0.665, 0.69)} />
      <Label id="hodi-onfalomesenterikoa" x={810} y={430} ax={R(A.duct)[0]} ay={Math.min(R(A.duct)[1], 600)} show={seg(g.ff, 0.5, 0.6) * (1 - 0.75 * lam)} />
    </g>
  );
}
