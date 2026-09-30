'use client';

import { Label, Note, Part, seg, type SceneProps } from '@/components/kit';
import { D_ROOF, ENDO, FoldBody, H0, S_BM, computeFold, type Fold, type P2 } from '@/components/scenes/week4/FoldSagittal';

/**
 * `endodermoa` — mid-sagittal section of the folded embryo at the end of week 4 (notes §4, fig. 12
 * = Langman D), drawn with the same cellular model as the folding stage (cranial left, dorsal up).
 * The endoderm taken inside by both folds forms the gut tube from the oropharyngeal membrane to the
 * cloacal membrane: foregut (pharyngeal gut → pouches, thyroglossal duct; respiratory diverticulum
 * from its ventral wall), midgut (open to the yolk sac through the vitelline duct) and hindgut
 * (cloaca, where the allantois opens). Both ends are ectodermal pits (stomodeum, proctodeum). The
 * gut wall outside the endodermal lining is splanchnic mesoderm (errai orria) — drawn thicker here.
 */
const SPLANCH = 13;
const POUCH_V = [9, 21, 33, 45];

/** Each window starts at its beat (week4b.ts: 0, .12, .24, .34, .44, .52, .62, .76, .9) and is done before that step's done frame. */
function timing(t: number) {
  return {
    parts: seg(t, 0.12, 0.19), // foregut, midgut and hindgut are named together (step 2)
    phar: seg(t, 0.24, 0.3),
    pouches: seg(t, 0.34, 0.4),
    resp: seg(t, 0.44, 0.49),
    thyro: seg(t, 0.52, 0.58),
    vit: seg(t, 0.62, 0.7),
    hind: seg(t, 0.76, 0.84),
    ends: seg(t, 0.9, 0.96),
  };
}

const f1 = (v: number) => v.toFixed(1);
const pathD = (pts: P2[], close = false) => pts.map((q, i) => `${i ? 'L' : 'M'}${f1(q[0])},${f1(q[1])}`).join('') + (close ? 'Z' : '');

function gutExtras(f: Fold) {
  const { X, fH, map } = f;
  const wEnd = H0 + ENDO; // mesoderm side of the foregut floor
  const vPh = 52;
  const sPh = S_BM + vPh * 0.95;
  const n = 14;
  const phar = [
    ...Array.from({ length: n + 1 }, (_, i) => X(map(S_BM + ((sPh - S_BM) * i) / n, D_ROOF + ENDO))),
    ...Array.from({ length: n + 1 }, (_, i) => X(fH(vPh - (vPh * i) / n, H0))),
  ];
  const pouch = POUCH_V.map((v) => X(fH(v, -1)));
  const thyro = [fH(14, wEnd - 3), fH(16, wEnd + 5), fH(21, wEnd + 9), fH(27, wEnd + 10)].map(X);
  const resp = [fH(56, wEnd - 3), fH(60, wEnd + 6), fH(68, wEnd + 9), fH(80, wEnd + 9)].map(X);
  return { phar, pouch, thyro, resp };
}
type Extras = ReturnType<typeof gutExtras>;

function Tube({ pts, show, bulb }: { pts: P2[]; show: number; bulb: number }) {
  const end = pts[pts.length - 1];
  return (
    <g opacity={show}>
      <path d={pathD(pts)} stroke="#b8891f" strokeWidth={8} fill="none" strokeLinecap="round" />
      <path d={pathD(pts)} stroke="#f2c14e" strokeWidth={6} fill="none" strokeLinecap="round" />
      <circle cx={end[0]} cy={end[1]} r={bulb} fill="#f2c14e" stroke="#b8891f" strokeWidth={1.2} />
      <path d={pathD(pts.slice(0, -1))} stroke="#2a2413" strokeWidth={2} fill="none" strokeLinecap="round" />
      {pts.slice(0, -1).map((q, i) => (
        <circle key={i} cx={q[0]} cy={q[1]} r={1.2} fill="rgba(90,60,10,0.8)" />
      ))}
    </g>
  );
}

function GutFeatures({ e, tm }: { e: Extras; tm: ReturnType<typeof timing> }) {
  return (
    <>
      <Part id="faringe-hestea" show={tm.phar}>
        <path d={pathD(e.phar, true)} fill="rgba(253,230,138,0.3)" stroke="#fde68a" strokeWidth={1.2} strokeDasharray="4 3" />
      </Part>
      <Part id="faringe-poltsak" show={tm.pouches}>
        {e.pouch.map((q, i) => (
          <ellipse key={i} cx={q[0]} cy={q[1]} rx={i === 3 ? 4.5 : 6} ry={i === 3 ? 3.5 : 4.5} fill="rgba(242,193,78,0.25)" stroke="#fcd34d" strokeWidth={1.2} strokeDasharray="2 2" />
        ))}
      </Part>
      <Part id="hodi-tiroglosoa" show={tm.thyro}>
        <Tube pts={e.thyro} show={1} bulb={4} />
      </Part>
      <Part id="arnas-hastapena" show={tm.resp}>
        <Tube pts={e.resp} show={1} bulb={6} />
      </Part>
    </>
  );
}

export function GutSagittal({ t }: SceneProps) {
  const f = computeFold(1, SPLANCH);
  const e = gutExtras(f);
  const tm = timing(t);
  const { X, fH, fT, map, LF, LFT, pieces, stalkS, allC, bmMid, cmMid, kloakaC, pits, g } = f;
  const L = (id: string, x: number, y: number, p: P2, show = 1, small = false) => <Label key={id} id={id} x={x} y={y} ax={p[0]} ay={p[1]} show={show} small={small} />;
  return (
    <g>
      <FoldBody f={f} kloakaShow={tm.hind}>
        <GutFeatures e={e} tm={tm} />
      </FoldBody>
      <Note x={500} y={612} tone="warn" size={12}>
        KONTUZ: mukosa bakarrik da endodermikoa; gainerako geruzak errai orritik datoz.
      </Note>

      {L('hodi-neurala', 190, 110, X(map(-0.6 * 250, g.cen(-0.6 * 250))))}
      {L('faringe-poltsak', 190, 150, e.pouch[1], tm.pouches)}
      {L('faringe-hestea', 190, 190, e.phar[4], tm.phar)}
      {L('aurreko-hestea', 190, 235, X(fH(LF * 0.62, 0)), tm.parts)}
      {L('arnas-hastapena', 190, 280, e.resp[3], tm.resp)}
      {L('hodi-tiroglosoa', 190, 355, e.thyro[3], tm.thyro)}
      {L('mintz-bukofaringeoa', 190, 395, bmMid)}
      {L('estomodeoa', 190, 435, pits[0].c)}
      {L('errai-orria', 190, 475, X(fH(LF * 0.3, H0 + ENDO + SPLANCH * 0.5)), 1, true)}
      {L('hodi-onfalomesenterikoa', 190, 530, pieces[5][Math.floor(pieces[5].length * 0.45)], tm.vit)}
      {L('bitelo-zaku-sekundarioa', 190, 580, pieces[4][Math.floor(pieces[4].length * 0.62)], Math.max(1 - tm.parts, tm.vit))}

      {L('amnios-barrunbea', 810, 110, X(map(0.1 * 250, -80)), 1, true)}
      {L('notokorda', 810, 150, X(map(0.3 * 250, 17 + 5)))}
      {L('erdiko-hestea', 810, 190, X(map(0, D_ROOF + 9)), tm.parts)}
      {L('atzeko-hestea', 810, 235, X(fT(LFT * 0.45, 0)), tm.parts)}
      {L('kloaka-mintza', 810, 275, cmMid)}
      {L('kloaka', 810, 318, kloakaC, tm.hind)}
      {L('proktodeoa', 810, 360, pits[1].c, tm.ends)}
      {L('alantoidea', 810, 420, allC[Math.floor(allC.length * 0.8)], tm.hind)}
      {L('finkapen-pedikulua', 810, 480, stalkS[18], 1, true)}
    </g>
  );
}

/** Pharyngeal close-up (rotated so the pharynx runs cranial→caudal left→right, dorsal up): 4 developed pouch pairs (+ rudimentary 5th). */
export function PharynxClose({ t }: SceneProps) {
  const f = computeFold(1, SPLANCH);
  const e = gutExtras(f);
  const tm = timing(t);
  const focus = f.X(f.fH(30, 4));
  const th = f.g.frame(S_BM + 30).th;
  const s = 2.5;
  const tx = 400;
  const ty = 330;
  const c = Math.cos(-th);
  const sn = Math.sin(-th);
  const at = (p: P2): P2 => {
    const x = (p[0] - focus[0]) * s;
    const y = (p[1] - focus[1]) * s;
    return [tx + x * c - y * sn, ty + x * sn + y * c];
  };
  const transform = `translate(${tx} ${ty}) rotate(${f1((-th * 180) / Math.PI)}) scale(${s}) translate(${f1(-focus[0])} ${f1(-focus[1])})`;
  const names = ['1: erdiko belarria / entzumen-tutua', '2: aho-sabaiko amigdala', '3: timoa + paratiroidea (behekoa)', '4: paratiroidea (goikoa)'];
  const L = (id: string, x: number, y: number, p: P2, show = 1) => <Label key={id} id={id} x={x} y={y} ax={at(p)[0]} ay={at(p)[1]} show={show} small />;
  return (
    <g>
      <rect x={0} y={0} width={1000} height={640} fill="#0f0f11" />
      <g transform={transform}>
        <FoldBody f={f} kloakaShow={0}>
          <GutFeatures e={e} tm={{ ...tm, phar: 1, pouches: Math.max(0.5, tm.pouches) }} />
        </FoldBody>
      </g>
      <rect x={690} y={96} width={290} height={176} rx={10} fill="#0c0c0e" opacity={0.82 * tm.pouches} />
      <rect x={0} y={566} width={1000} height={60} fill="#0c0c0e" opacity={0.85} />
      {e.pouch.map((q, i) => {
        const [x, y] = at(q);
        return (
          <g key={i} opacity={tm.pouches}>
            <circle cx={x} cy={y} r={2.6} fill="#fff" stroke="#070b16" strokeWidth={1.2} />
            <line x1={x} y1={y} x2={700} y2={120 + i * 42} stroke="rgba(226, 234, 250, 0.55)" strokeWidth={1.1} />
            <text x={708} y={120 + i * 42} fontSize={12.5} fill="#e8eefc" dy="0.35em" className="note">
              {names[i]}
            </text>
          </g>
        );
      })}
      {L('faringe-hestea', 200, 130, e.phar[20])}
      {L('mintz-bukofaringeoa', 200, 390, f.bmMid)}
      {L('hodi-tiroglosoa', 200, 450, e.thyro[3], tm.thyro)}
      {L('arnas-hastapena', 200, 500, e.resp[3], tm.resp)}
      <Note x={500} y={585} tone="warn" size={11}>
        Apunteek 6 faringe-poltsa aipatzen dituzte; ohikoena 4 poltsa garatu + 5.a hastapenezkoa da.
      </Note>
      <Note x={500} y={605} tone="warn" size={11}>
        Kanpoko entzunbidea 1. faringe-arteko ildotik dator, ez poltsatik.
      </Note>
    </g>
  );
}
