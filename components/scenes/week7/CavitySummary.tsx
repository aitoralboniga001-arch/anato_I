'use client';

import { useId } from 'react';
import { Arrow, Label, Note, Part, seg, type Pt, type SceneProps } from '@/components/kit';
import { Defs7, P, mirror, poly, spline, vis } from './common';
import { SUMMARY } from './timing';

/**
 * 7:diafragma-heldua:laburpena — apunteen 4. atala (Gogoratu beharrekoa) eta gai osoa irudi bakarrean.
 * Enborra aurretik ikusita hiru unetan (goian kraneala; ikuslearen ezkerra = gorputzaren eskuina), barrunbe
 * bakoitza gaiaren kolore berean:
 *  1. 3.–4. astea: enbrioi barruko zeloma, barrunbe bakarra toraxetik abdomenera;
 *  2. 4. astea: septum transversumak bitan banatzen du (goian hasierako perikardio barrunbea, behean peritoneo
 *     barrunbea); atzealdeko alboetan bi erreten perikardioperitonealek komunikatzen dituzte;
 *  3. 5. astetik aurrera: mintz pleuroperikardikoek goiko barrunbea hirutan banatzen dute (bi pleura barrunbe
 *     eta perikardio barrunbea) eta mintz pleuroperitonealek (7. astean) erretenak ixten dituzte: diafragmaren gainean
 *     toraxeko hiru barrunbeak, azpian peritoneo barrunbea.
 * Mintz bakoitzaren izenak esaten du zein bi barrunbe bereizten dituen.
 */

const PANELS = [170, 500, 830] as const;
const TOP = 104;

/** The trunk seen from the front, and its body cavity, round a panel centre. */
const trunk = (cx: number): Pt[] => {
  const half: Pt[] = [[cx, 98], [cx - 34, 102], [cx - 70, 116], [cx - 104, 140], [cx - 114, 196], [cx - 110, 286], [cx - 102, 352], [cx - 86, 396], [cx - 50, 416], [cx, 420]];
  return spline([...half, ...half.slice(1, -1).reverse().map((p) => mirror(p, cx))], 8, true);
};
const cavity = (cx: number): Pt[] => {
  const half: Pt[] = [[cx, 128], [cx - 40, 132], [cx - 80, 152], [cx - 94, 204], [cx - 92, 290], [cx - 86, 350], [cx - 70, 386], [cx - 38, 400], [cx, 403]];
  return spline([...half, ...half.slice(1, -1).reverse().map((p) => mirror(p, cx))], 8, true);
};

function Heart({ c, s = 1 }: { c: Pt; s?: number }) {
  return (
    <g transform={`translate(${c[0]} ${c[1]}) scale(${s})`}>
      <path d="M-4,-26 C14,-30 30,-18 28,2 C26,20 10,30 -2,28 C-18,26 -28,12 -26,-4 C-24,-18 -14,-24 -4,-26Z" fill={P.heart} stroke={P.heartDeep} strokeWidth={1.4} />
      <path d="M-6,-18 C6,-22 18,-14 18,-2" fill="none" stroke="#f06a7e" strokeWidth={3} strokeLinecap="round" opacity={0.7} />
      <path d="M-4,-26 C14,-30 30,-18 28,2 C26,20 10,30 -2,28 C-18,26 -28,12 -26,-4 C-24,-18 -14,-24 -4,-26Z" fill="url(#w7-light)" />
    </g>
  );
}

/** The gut: oesophagus down the back of the thorax, then the abdominal loops. */
function Gut({ cx, from }: { cx: number; from: number }) {
  const d = `M${cx + 4},${from} L${cx + 6},300 C${cx + 30},314 ${cx + 40},334 ${cx + 22},350 C${cx}, 368 ${cx - 34},352 ${cx - 30},376 C${cx - 26},394 ${cx + 10},392 ${cx + 12},402`;
  return (
    <g pointerEvents="none">
      <path d={d} fill="none" stroke="#7a5a1a" strokeWidth={11} strokeLinecap="round" opacity={0.85} />
      <path d={d} fill="none" stroke={P.gut} strokeWidth={7} strokeLinecap="round" />
    </g>
  );
}

function Lung({ cx, side }: { cx: number; side: 1 | -1 }) {
  const half: Pt[] = [[cx + side * 44, 156], [cx + side * 70, 170], [cx + side * 82, 214], [cx + side * 80, 262], [cx + side * 52, 268], [cx + side * 44, 222]];
  const pts = spline(half, 6, true);
  return (
    <g pointerEvents="none">
      <path d={poly(pts)} fill={P.lung} stroke={P.lungDeep} strokeWidth={1.2} />
      <path d={poly(pts)} fill="url(#w7-lung)" />
    </g>
  );
}

/** One row of a panel's colour key: the swatch (the structure itself, so it lights with it) and its name. */
function Key({ x, y, id, color, line, show }: { x: number; y: number; id: string; color: string; line?: boolean; show: number }) {
  return (
    <>
      <Part id={id} show={show}>
        {line ? (
          <path d={`M${x},${y} H${x + 20}`} stroke={color} strokeWidth={5} strokeLinecap="round" />
        ) : (
          <rect x={x} y={y - 7} width={20} height={14} rx={4} fill={color} fillOpacity={0.75} stroke={color} strokeWidth={1.4} />
        )}
      </Part>
      <Label id={id} x={x + 30} y={y} align="start" show={show} small />
    </>
  );
}

export function CavitySummary({ t }: SceneProps) {
  const cid = useId().replace(/:/g, '');
  // Before the summary step the strip is a finished reference; in the step it is built panel by panel.
  const build = t < SUMMARY.at - 0.001 ? 1 : 0;
  const p1 = build || seg(t, SUMMARY.at, SUMMARY.at + 0.012);
  const p2 = build || seg(t, SUMMARY.p2, SUMMARY.p2 + 0.012);
  const p3 = build || seg(t, SUMMARY.p3, SUMMARY.p3 + 0.012);
  const [a, b, c] = PANELS;

  const body = (cx: number, show: number) => (
    <g opacity={show}>
      <Part id="gorputz-pareta" quiet>
        <path d={poly(trunk(cx))} fill={P.wall} />
        <path d={poly(trunk(cx))} fill="url(#w7-mesench)" />
        <path d={poly(trunk(cx))} fill="none" stroke={P.skin} strokeWidth={3} />
      </Part>
    </g>
  );
  const clip = (id: string, y0: number, y1: number) => (
    <clipPath id={`${id}${cid}`}>
      <rect x={0} y={y0} width={1000} height={y1 - y0} />
    </clipPath>
  );

  // Panel 3: the pericardial sac in the middle, the pleural cavities either side, the dome below.
  const sac = (cx: number): Pt[] => spline([[cx - 26, 140], [cx - 40, 190], [cx - 40, 240], [cx, 262], [cx + 40, 240], [cx + 40, 190], [cx + 26, 140]], 8);
  const pleuraL = (cx: number): Pt[] => spline([[cx - 30, 134], [cx - 80, 152], [cx - 94, 204], [cx - 93, 284], [cx - 60, 274], [cx - 42, 244], [cx - 40, 190], [cx - 28, 140]], 8, true);
  const dome = (cx: number, off = 0): Pt[] => spline([[cx - 93, 296 + off], [cx - 60, 270 + off], [cx, 262 + off], [cx + 60, 270 + off], [cx + 93, 296 + off]], 8);

  return (
    <g>
      <Defs7 />
      <rect x={0} y={0} width={1000} height={640} fill="#0f0f11" />
      <defs>
        {clip('w7-sum-up', 0, 266)}
        {clip('w7-sum-down', 282, 640)}
        {clip('w7-sum-under', 268, 640)}
      </defs>

      {/* ——— 1. One cavity from the thorax to the abdomen ——— */}
      {body(a, p1)}
      <g opacity={p1}>
        <Part id="enbrioi-barruko-zeloma">
          <path d={poly(cavity(a))} fill={P.space} />
          <path d={poly(cavity(a))} fill="rgba(170,120,255,0.42)" stroke="#c4a8ff" strokeWidth={1.4} />
        </Part>
        <Gut cx={a} from={140} />
        <Heart c={[a - 4, 196]} s={0.9} />
      </g>

      {/* ——— 2. The septum splits it; the two canals behind still join the halves ——— */}
      {body(b, p2)}
      <g opacity={p2}>
        <Part id="hasierako-perikardio-barrunbea">
          <g clipPath={`url(#w7-sum-up${cid})`}>
            <path d={poly(cavity(b))} fill={P.space} />
            <path d={poly(cavity(b))} fill="rgba(255,120,150,0.42)" stroke="#ff9fb4" strokeWidth={1.4} />
          </g>
        </Part>
        <Part id="peritoneo-barrunbea">
          <g clipPath={`url(#w7-sum-down${cid})`}>
            <path d={poly(cavity(b))} fill={P.space} />
            <path d={poly(cavity(b))} fill="rgba(120,220,140,0.36)" stroke="#9fe6ae" strokeWidth={1.4} />
          </g>
        </Part>
        <Gut cx={b} from={140} />
        <Heart c={[b - 4, 196]} s={0.9} />
        <Part id="erreten-perikardioperitonealak">
          {[-1, 1].map((s) => (
            <rect key={s} x={b + s * 80 - 9} y={238} width={18} height={72} rx={9} fill="#7fc8e8" fillOpacity={0.55} stroke="#bfe6f7" strokeWidth={1.4} />
          ))}
        </Part>
        <Part id="septum-transversum">
          <rect x={b - 70} y={264} width={140} height={20} rx={6} fill={P.septum} stroke={P.septumDeep} strokeWidth={1.2} />
          <rect x={b - 70} y={264} width={140} height={20} rx={6} fill="url(#w7-mesench)" />
        </Part>
      </g>

      {/* ——— 3. Pleuropericardial membranes: three cavities above; pleuroperitoneal membranes close the canals ——— */}
      {body(c, p3)}
      <g opacity={p3}>
        <Part id="peritoneo-barrunbea">
          <g clipPath={`url(#w7-sum-under${cid})`}>
            <path d={poly(cavity(c))} fill={P.space} />
            <path d={poly(cavity(c))} fill="rgba(120,220,140,0.36)" stroke="#9fe6ae" strokeWidth={1.4} />
          </g>
        </Part>
        <Gut cx={c} from={300} />
        <Part id="pleura-barrunbea">
          {[pleuraL(c), pleuraL(c).map((p) => mirror(p, c))].map((pts, i) => (
            <g key={i}>
              <path d={poly(pts)} fill={P.space} />
              <path d={poly(pts)} fill="rgba(110,180,255,0.42)" stroke="#a9d2ff" strokeWidth={1.4} />
            </g>
          ))}
        </Part>
        <Lung cx={c} side={-1} />
        <Lung cx={c} side={1} />
        <Part id="perikardio-barrunbea">
          <path d={poly(sac(c))} fill={P.space} />
          <path d={poly(sac(c))} fill="rgba(255,120,150,0.42)" />
        </Part>
        <Heart c={[c - 2, 206]} s={0.82} />
        <Part id="mintz-pleuroperikardikoak">
          <path d={poly(sac(c), false)} fill="none" stroke={P.ppMem} strokeWidth={4.5} strokeLinecap="round" />
        </Part>
        <Part id="diafragma">
          <path d={poly([...dome(c), ...dome(c, 14).reverse()])} fill="#c0606a" stroke="#6e1f2e" strokeWidth={1.2} />
          <path d={poly([...dome(c), ...dome(c, 14).reverse()])} fill="url(#w7-muscle)" />
        </Part>
        <Part id="mintz-pleuroperitonealak">
          {[-1, 1].map((s) => (
            <ellipse key={s} cx={c + s * 82} cy={299} rx={12} ry={9} fill={P.poMem} stroke="#e4ccff" strokeWidth={1.2} />
          ))}
        </Part>
      </g>

      {/* Between the panels: what divides, and when. */}
      <Arrow from={[a + 122, 276]} to={[b - 122, 276]} color={P.septum} width={3} show={p2} bend={0} />
      <Arrow from={[b + 122, 276]} to={[c - 122, 276]} color={P.ppMem} width={3} show={p3} bend={0} />

      <Note x={a} y={54} tone="accent" show={p1}>
        3.–4. astea
      </Note>
      <Note x={a} y={74} show={p1}>
        barrunbe bakarra
      </Note>
      <Note x={b} y={54} tone="accent" show={p2}>
        4. astea
      </Note>
      <Note x={b} y={74} show={p2}>
        2 barrunbe + atzean 2 erreten
      </Note>
      <Note x={c} y={54} tone="accent" show={p3}>
        5. astetik aurrera
      </Note>
      <Note x={c} y={74} show={p3}>
        4 barrunbe
      </Note>
      <Note x={24} y={20} align="start" size={11.5} show={p1}>
        Enborra aurretik ikusita (ezkerrean gorputzaren eskuina)
      </Note>

      <Note x={500} y={612} tone="accent" show={vis(t, SUMMARY.at, SUMMARY.p2) * (1 - build)}>
        Enbrioi barruko zeloma: barrunbe bakarra, toraxetik abdomenera
      </Note>
      <Note x={500} y={612} tone="accent" show={vis(t, SUMMARY.p2, SUMMARY.p3) * (1 - build)}>
        Septum transversuma: goian hasierako perikardio barrunbea, behean peritoneo barrunbea; atzean bi erreten
      </Note>
      <Note x={500} y={600} tone="accent" show={Math.max(build, vis(t, SUMMARY.p3))}>
        Mintz pleuroperikardikoak: pleura ↔ perikardioa · mintz pleuroperitonealak: pleura ↔ peritoneoa
      </Note>
      <Note x={500} y={622} show={Math.max(build, vis(t, SUMMARY.p3))}>
        Izenak esaten du zein bi barrunbe bereizten dituen mintz bakoitzak
      </Note>

      {/* Names: a colour key under each panel (the swatch is the structure: it lights with it). */}
      <Key x={a - 92} y={448} id="enbrioi-barruko-zeloma" color="#b48cff" show={p1} />
      <Key x={b - 100} y={448} id="hasierako-perikardio-barrunbea" color="#ff8fa8" show={p2} />
      <Key x={b - 100} y={472} id="septum-transversum" color={P.septum} show={p2} />
      <Key x={b - 100} y={496} id="erreten-perikardioperitonealak" color="#7fc8e8" show={p2} />
      <Key x={b - 100} y={520} id="peritoneo-barrunbea" color="#7fd893" show={p2} />
      <Key x={c - 100} y={448} id="pleura-barrunbea" color="#6eb4ff" show={p3} />
      <Key x={c - 100} y={472} id="mintz-pleuroperikardikoak" color={P.ppMem} line show={p3} />
      <Key x={c - 100} y={496} id="perikardio-barrunbea" color="#ff8fa8" show={p3} />
      <Key x={c - 100} y={520} id="mintz-pleuroperitonealak" color={P.poMem} show={p3} />
      <Key x={c - 100} y={544} id="diafragma" color="#c0606a" show={p3} />
      <Key x={c - 100} y={568} id="peritoneo-barrunbea" color="#7fd893" show={p3} />
    </g>
  );
}
