'use client';

import { useId } from 'react';
import { Part, clamp, lerp, rand, type Pt } from '@/components/kit';
import { K, Tissue, Cushion, at, blob, curve, f1 } from './common';

/**
 * The interatrial septum seen from inside the right atrium (looking towards the patient's left): the
 * septal plane is the picture plane, cranial up, posterior on the viewer's left, anterior on the right.
 * Behind every opening is the dark left atrium. Septum secundum lies on the viewer's side of septum
 * primum, so it is drawn over it, see-through enough that the hidden ostium secundum shows behind it:
 * the two holes do not line up, which is why the flap works as a valve.
 */
export interface FaceState {
  primum: number;
  closeOP: number;
  os2: number;
  /** Upper part of septum primum above the ostium secundum gone (0 … 1). */
  stub: number;
  secundum: number;
  /** Septum spurium and the left venous valve merging into septum secundum (0 … 1). */
  spurium: number;
  cushions: number;
  press: number;
  fuse: number;
  flow: number;
  /** Fusion incomplete (a patent foramen ovale): a slit stays open under septum secundum's edge. */
  patent?: boolean;
  /** After birth: the definitive atria. */
  adult?: boolean;
}

const X0 = 318;
const X1 = 682;
const ROOF = 92;
/** Top of the fused AV cushions as seen from the atrium. */
const CUSH = 468;
const W = (X1 - X0) / 2;
const CX = 500;

/** The septal window's outline (inner edge of the atrial wall around it). */
const windowPts: Pt[] = [
  [X0 + 20, CUSH + 8],
  [X0, 400],
  [X0 - 4, 300],
  [X0 + 8, 196],
  [X0 + 44, 122],
  [CX - 70, ROOF + 2],
  [CX, ROOF - 4],
  [CX + 70, ROOF + 2],
  [X1 - 44, 122],
  [X1 - 8, 196],
  [X1 + 4, 300],
  [X1, 400],
  [X1 - 20, CUSH + 8],
];

/** Outer outline of the opened right atrium (the cut edge of its wall). */
const RA_OUT = blob(
  [
    [X0 - 60, 566],
    [X0 - 92, 420],
    [X0 - 84, 250],
    [X0 - 44, 98],
    [CX, 34],
    [X1 + 44, 98],
    [X1 + 84, 250],
    [X1 + 92, 420],
    [X1 + 60, 566],
    [CX, 604],
  ],
  0.5,
);

/** Free edge of septum primum (its lower, concave border) at growth g. */
function primumEdge(g: number, close: number): Pt[] {
  const yc = lerp(ROOF + 24, CUSH - 6, g);
  const out: Pt[] = [];
  for (let i = 0; i <= 16; i++) {
    const u = i / 16;
    const x = lerp(X0 + 4, X1 - 4, u);
    const r = (x - CX) / W;
    // The horns run down the margins ahead of the middle: a crescent.
    const horn = lerp(yc, CUSH, Math.min(1, r * r * 1.25 + g * 0.2));
    out.push([x, Math.min(CUSH - 2, lerp(horn, CUSH - 2, close))]);
  }
  return out;
}

/** Septum primum outline: along the roof and margins down to its free edge. */
function primumPath(g: number, close: number, stub: number) {
  const edge = primumEdge(g, close);
  // When the upper part goes, the membrane's top drops to just above the ostium secundum's lower rim.
  const topY = lerp(ROOF - 6, 262, stub);
  if (stub < 0.02) {
    const rim = windowPts.slice(1, 12);
    return `${curve(rim, 0.5)}L${f1(edge[16][0])},${f1(edge[16][1])}${curve([...edge].reverse(), 0.5).replace(/^M[^C]*/, '')}Z`;
  }
  // The remaining lower part: the valve of the foramen ovale, from the cushions up to topY.
  const top: Pt[] = [
    [X0 + 2, Math.max(topY + 60, 300)],
    [CX - 120, topY + 14],
    [CX, topY],
    [CX + 120, topY + 14],
    [X1 - 2, Math.max(topY + 60, 300)],
  ];
  return `${curve(top, 0.5)}L${f1(X1 - 4)},${f1(edge[16][1])}${curve([...edge].reverse(), 0.5).replace(/^M[^C]*/, '')}L${f1(X0 + 2)},${f1(Math.max(topY + 60, 300))}Z`;
}

/** Ostium secundum: perforations (centres, radii) that merge into one opening, high and posterior. */
export function os2Holes(k: number): { c: Pt; rx: number; ry: number }[] {
  if (k > 0.85) return [{ c: [462, 196], rx: lerp(60, 74, (k - 0.85) / 0.15), ry: lerp(46, 56, (k - 0.85) / 0.15) }];
  const seeds: Pt[] = [
    [440, 180],
    [492, 168],
    [470, 222],
    [418, 222],
  ];
  return seeds.map((c, i) => {
    const g = clamp(k * 1.5 - i * 0.18);
    return { c, rx: 26 * g, ry: 22 * g };
  });
}

/** Septum secundum: a thick crescent from the roof whose free edge rims the foramen ovale. */
function secundumPath(g: number) {
  const yc = lerp(ROOF + 6, 300, g);
  const edge: Pt[] = [];
  for (let i = 0; i <= 14; i++) {
    const u = i / 14;
    const x = lerp(X0 + 6, X1 - 6, u);
    const r = (x - CX) / W;
    edge.push([x, lerp(yc, lerp(yc, CUSH - 4, Math.min(1, Math.pow(Math.abs(r), 1.6) * 1.15)), clamp(g * 1.4 - 0.25))]);
  }
  const rim = windowPts.slice(1, 12);
  return `${curve(rim, 0.5)}L${f1(edge[14][0])},${f1(edge[14][1])}${curve([...edge].reverse(), 0.5).replace(/^M[^C]*/, '')}Z`;
}

/** The foramen ovale's rim (free edge of septum secundum when fully grown), for labels and blood. */
export const FO_CENTER: Pt = [CX, 392];

export function FaceArt({ s, t }: { s: FaceState; t: number }) {
  const mid = `w11-os2-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;
  const holes = os2Holes(s.os2);
  const cushG = clamp(s.cushions);
  const cushTop = lerp(CUSH + 30, CUSH - 6, cushG);
  const win = blob(windowPts, 0.5);
  return (
    <g>
      {/* The right atrium opened from the patient's right: its cut wall (orange, trabeculated) frames the
          septum at the back; the walls recede (darker) towards it. Behind the septum, the dark left atrium. */}
      <Part id={s.adult ? 'eskuineko-aurikula' : 'hasierako-eskuineko-aurikula'} quiet>
        <path d={RA_OUT} fill={K.atrium} />
        <path d={RA_OUT} fill="url(#w11-atrial)" />
        <path d={RA_OUT} fill="url(#w11-light)" />
        <path d={RA_OUT} fill="url(#w11-recess)" />
        <path d={RA_OUT} fill="none" stroke="#ffd2a8" strokeWidth={5} opacity={0.55} />
        <path d={RA_OUT} fill="none" stroke={K.atriumDeep} strokeWidth={1.4} />
      </Part>
      {/* Where the venae cavae open, on the posterior wall (viewer's left): blood comes in here. */}
      <Part id="goiko-kaba-zaina">
        <path d="M232,0L236,60Q240,100 270,118L330,104Q306,74 300,40L298,0Z" fill={K.deo2} />
        <path d="M232,0L236,60Q240,100 270,118L330,104Q306,74 300,40L298,0Z" fill="url(#w11-tubeH)" />
        <ellipse cx={298} cy={110} rx={34} ry={16} transform="rotate(-14 298 110)" fill="#0b0712" stroke={K.deo2Deep} strokeWidth={2} />
      </Part>
      <Part id="beheko-kaba-zaina">
        <path d="M206,640L214,560Q222,528 256,516L312,540Q284,560 276,590L272,640Z" fill={K.deo2} />
        <path d="M206,640L214,560Q222,528 256,516L312,540Q284,560 276,590L272,640Z" fill="url(#w11-tubeH)" />
        <ellipse cx={284} cy={528} rx={38} ry={18} transform="rotate(16 284 528)" fill="#0b0712" stroke={K.deo2Deep} strokeWidth={2} />
      </Part>
      <Part id={s.adult ? 'ezkerreko-aurikula-jaiotakoan' : 'hasierako-ezkerreko-aurikula'} quiet>
        <path d={win} fill="#2a0f17" />
        <path d={win} fill="url(#w11-lumen)" opacity={0.7} />
      </Part>

      {/* The AV cushions (fused) at the bottom of the septal window. */}
      <Part id="kuxin-aurikulubentrikularrak">
        <Cushion d={blob([[X0 + 24, cushTop + 22], [CX - 120, cushTop + 2], [CX, cushTop - 6], [CX + 120, cushTop + 2], [X1 - 24, cushTop + 22], [CX + 140, 548], [CX, 560], [CX - 140, 548]], 0.5)} />
      </Part>

      {/* Septum primum with its openings. */}
      {s.primum > 0.01 && (
        <Part id={s.stub > 0.5 ? 'zulo-obalaren-balbula' : 'septum-primum'} groups={s.stub > 0.5 ? ['septum-primum'] : undefined}>
          <mask id={mid} maskUnits="userSpaceOnUse" x="0" y="0" width="1000" height="640">
            <rect x="0" y="0" width="1000" height="640" fill="#fff" />
            {holes.map((h, i) => (h.rx > 0.5 ? <ellipse key={i} cx={h.c[0]} cy={h.c[1]} rx={h.rx} ry={h.ry} fill="#000" /> : null))}
          </mask>
          <g mask={`url(#${mid})`}>
            <Tissue d={primumPath(s.primum, s.closeOP, s.stub)} fill={K.primum} deep={K.primumDeep} pattern="w11-membrane" />
            {/* Its free edge, a little thickened and catching the light. */}
            {s.closeOP < 0.97 && <path d={curve(primumEdge(s.primum, s.closeOP).slice(1, 16), 0.5)} fill="none" stroke="#fffaf0" strokeWidth={3} strokeLinecap="round" opacity={0.85} />}
          </g>
        </Part>
      )}
      {/* Extensions of the cushions closing the ostium primum, from below. */}
      {s.closeOP > 0.02 && s.primum > 0.3 && (
        <Part id="kuxin-aurikulubentrikularrak">
          <Cushion d={closingPath(s)} />
        </Part>
      )}

      {/* Septum secundum, on the viewer's side, see-through. */}
      {s.secundum > 0.01 && (
        <Part id="septum-secundum">
          <g opacity={0.82}>
            <Tissue d={secundumPath(s.secundum)} fill={K.secundum} deep={K.secundumDeep} pattern="w11-atrial" width={1.6} />
          </g>
          {/* The ostium secundum it hides, as seen through it. */}
          {s.os2 > 0.85 &&
            holes.map((h, i) => <ellipse key={i} cx={h.c[0]} cy={h.c[1]} rx={h.rx} ry={h.ry} fill="none" stroke={K.primum} strokeWidth={1.4} opacity={0.75 * clamp(s.secundum * 3 - 1)} />)}
        </Part>
      )}
      {/* Septum spurium and the left venous valve on the posterior margin (viewer's left), on the right atrium's side of septum secundum. */}
      {s.spurium > 0.01 && (
        <>
          <Part id="ezkerreko-zain-balbula">
            <Tissue d={valveRidge(lerp(0, 1, s.spurium))} fill="#a78bfa" deep="#5b3fb8" />
          </Part>
          <Part id="septum-spurium">
            <Tissue d={spuriumRidge(s.spurium)} fill="#e9d5ff" deep="#7c5fd6" />
          </Part>
        </>
      )}

      {s.fuse > 0.01 && <path d={blob([[CX - 140, 312], [CX, 296], [CX + 140, 312], [CX + 130, 330], [CX, 318], [CX - 130, 330]], 0.5)} fill={K.secundum} opacity={s.fuse * 0.6} pointerEvents="none" />}

      {s.patent && s.fuse > 0.05 && (
        <path d={blob([[CX - 70, 303], [CX, 298], [CX + 70, 303], [CX + 60, 310], [CX, 307], [CX - 60, 310]], 0.5)} fill="#12060c" opacity={clamp(s.fuse * 3)} pointerEvents="none" />
      )}
      <FaceBlood s={s} t={t} cushTop={cushTop} />
    </g>
  );
}

function closingPath(s: FaceState) {
  const edge = primumEdge(s.primum, 0);
  const k = clamp(s.closeOP);
  const pts = edge.map(([x, y]): Pt => [x, lerp(CUSH - 2, y + 3, k)]);
  return `M${f1(X0 + 6)},${CUSH + 6}${curve(pts, 0.5).replace(/^M/, 'L')}L${f1(X1 - 6)},${CUSH + 6}Z`;
}

function valveRidge(k: number) {
  const y1 = lerp(150, 452, k);
  return `M${X0 + 10},140C${X0 + 22},200 ${X0 + 30},${f1((140 + y1) / 2)} ${X0 + 26},${f1(y1)}L${X0 + 42},${f1(y1)}C${X0 + 48},${f1((140 + y1) / 2)} ${X0 + 40},200 ${X0 + 26},132Z`;
}

function spuriumRidge(k: number) {
  const x1 = lerp(X0 + 50, CX - 30, k);
  return `M${X0 + 30},${ROOF + 34}C${X0 + 80},${ROOF + 10} ${f1((X0 + x1) / 2)},${ROOF + 6} ${f1(x1)},${ROOF + 8}L${f1(x1)},${ROOF + 22}C${f1((X0 + x1) / 2)},${ROOF + 22} ${X0 + 80},${ROOF + 30} ${X0 + 40},${ROOF + 50}Z`;
}

/** Blood of the right atrium going into the foramen ovale (shrinking as it goes deeper), then, seen
 * through septum secundum, rising between the septa to the ostium secundum. */
function FaceBlood({ s, t, cushTop }: { s: FaceState; t: number; cushTop: number }) {
  if (s.flow <= 0.01 || s.primum < 0.05) return null;
  const open = s.patent ? Math.max(0.45, 1 - s.press) : 1 - s.press;
  if (open <= 0.03) return null;
  let path: Pt[];
  let deep: (u: number) => number;
  if (s.secundum < 0.2) {
    if (s.closeOP < 0.9) {
      // Under the free edge of septum primum: the ostium primum.
      const e = primumEdge(s.primum, s.closeOP)[8][1];
      const y = (e + cushTop) / 2;
      path = [[284, 528], [CX - 150, y + 40], [CX - 10, y]];
    } else {
      const h = os2Holes(s.os2)[0];
      path = [[284, 528], [CX - 140, 330], [h.c[0], h.c[1]]];
    }
    deep = (u) => (u > 0.72 ? 1 - (u - 0.72) / 0.28 : 1);
  } else {
    path = [[284, 528], [CX - 120, 460], [CX - 20, 404], [CX - 30, 300], [462, 210]];
    deep = (u) => (u < 0.55 ? 1 : 0.45);
  }
  const n = 10;
  return (
    <g pointerEvents="none" opacity={s.flow * open}>
      {Array.from({ length: n }, (_, i) => {
        const u = ((((i + rand(31 + i) * 0.5) / n + t * 3) % 1) + 1) % 1;
        const p = at(path, u);
        const k = deep(u);
        const o = Math.min(1, u * 6, (1 - u) * 6) * (k < 0.6 ? 0.55 : 1);
        const r = 3.4 * (0.55 + 0.45 * k);
        return <ellipse key={i} cx={f1(p[0])} cy={f1(p[1])} rx={r * 1.25} ry={r * 0.85} fill={i % 2 ? K.deo2 : K.o2} stroke="rgba(0,0,0,0.5)" strokeWidth={0.7} opacity={o} />;
      })}
    </g>
  );
}

export const FACE = { X0, X1, ROOF, CUSH, CX };
