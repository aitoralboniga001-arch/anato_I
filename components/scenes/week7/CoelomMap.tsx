'use client';

import { useId, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { Label, Note, Part, clamp, lerp, seg, type Pt, type SceneProps } from '@/components/kit';
import type { SceneComponent } from '@/lib/sim/types';
import { CavityKey, KEY7, P, f1, poly, sm } from './common';
import { SideEmbryo, fromSide, planeAt, sideXY, zNear, type SideState } from './SideEmbryo';

/**
 * Barrunbeen mapa: the whole coelom of the trunk at once, in the embryo seen from the side (topic 5's
 * day-32 embryo, see SideEmbryo.tsx) with the cavities seen through its wall, next to the transverse
 * section the student knows from the notes. The section on the right is the model cut at the level of
 * the white line, and the line is fitted level by level so both always agree: what is above the septum
 * (primitive pericardial cavity, later pericardium and two pleurae), the septum transversum, what is
 * below (peritoneal cavity), and the two dorsal pericardioperitoneal canals that join them until the
 * pleuroperitoneal membranes close them. The plane follows the step; it can be dragged up and down.
 *
 * Model space (the section): u = side (−1 … 1), v = dorsal (−1) … ventral (+1), z = caudal (0) … cranial (1).
 */

interface State {
  /** 1 = still one undivided coelom (violet). */
  one: number;
  /** Septum transversum grown (0 … 1). */
  sep: number;
  /** Upper and lower parts tinted as pericardial (rose) and peritoneal (green). */
  split: number;
  /** The canals called out (glow and the fluid passing through). */
  canal: number;
  /** Lung buds (0 … 1). */
  lung: number;
  /** Pleuropericardial membranes (0 … 1): pleural cavities apart from the pericardial cavity. */
  ppm: number;
  /** Pleuroperitoneal membranes closing the canals (0 … 1). */
  pom: number;
  /** Height of the section plane (0 … 1). */
  zc: number;
  /** Names of the foregut in this stage. */
  gut: 'aurreko-hestea' | 'hestegorria';
}

interface Ell {
  cu: number;
  cv: number;
  ru: number;
  rv: number;
  /** Dorsal half-depth when it differs from the ventral one (rv). */
  rd?: number;
}

// ——— Model ———

/** Top of the septum transversum and its underside (the canals run through this layer). */
const ZS = 0.5;
const ZB = 0.44;
const bump = (z: number, c: number, w: number) => Math.exp(-(((z - c) / w) ** 2));
/**
 * The trunk of a 5-week embryo: the heart prominence bulges the ventral wall of the chest, the liver
 * prominence the upper belly, with a groove between them at the septum; flatter at the back; narrowing
 * towards the neck and the pelvis.
 */
const bodyAt = (z: number): Ell => ({
  cu: 0,
  cv: 0,
  ru: 1 - 0.24 * sm((z - 0.8) / 0.2) - 0.16 * sm((0.2 - z) / 0.2) + 0.05 * bump(z, 0.68, 0.12) + 0.06 * bump(z, 0.34, 0.14) - 0.04 * bump(z, 0.52, 0.06),
  rv: 0.84 + 0.24 * bump(z, 0.69, 0.11) + 0.14 * bump(z, 0.32, 0.09),
  rd: 0.9,
});

/** 0 … 1 … 0 across [z0, z1], rounded (a circle's profile) over the fraction r at the ends that round. */
function prof(z: number, z0: number, z1: number, r: number, top = true, bottom = true) {
  if (z < z0 || z > z1) return 0;
  const a = (z - z0) / (z1 - z0);
  const e = Math.min(bottom ? a / r : 1, top ? (1 - a) / r : 1, 1);
  return Math.sqrt(Math.max(0, 1 - (1 - e) ** 2));
}

const scale = (e: Ell, k: number): Ell => ({ ...e, ru: e.ru * k, rv: e.rv * k });

type Shape = (z: number, S: State) => Ell | null;

const SH: Record<string, Shape> = {
  peri: (z) => {
    const k = prof(z, ZS, 0.9, 0.3, true, false);
    return k > 0.02 ? scale({ cu: 0, cv: 0.3, ru: 0.6, rv: 0.42 }, k) : null;
  },
  /** Before the septum closes the ventral coelom, upper and lower parts are one space. */
  bridge: (z, S) => (z >= ZB && z <= ZS && S.sep < 0.98 ? { cu: 0, cv: lerp(0.2, 0.0, S.sep), ru: 0.8 * (1 - S.sep * 0.6), rv: 0.55 * (1 - S.sep) } : null),
  septum: (z, S) => (z >= ZB && z <= ZS && S.sep > 0.02 ? { cu: 0, cv: lerp(0.66, 0.2, S.sep), ru: lerp(0.5, 0.86, S.sep), rv: lerp(0.1, 0.56, S.sep) } : null),
  perito: (z) => {
    const k = prof(z, 0.05, ZB, 0.35, false, true);
    return k > 0.02 ? scale({ cu: 0, cv: 0.02, ru: 0.84, rv: 0.66 }, k) : null;
  },
  /** A heart, not an egg: broad at the top (the base), tapering to the apex that points down and to the left. */
  heart: (z) => {
    const a = (z - 0.57) / 0.26;
    if (a < 0 || a > 1) return null;
    const k = Math.sqrt(Math.max(0, 1 - ((a - 0.7) / (a < 0.7 ? 0.7 : 0.3)) ** 2));
    return k > 0.02 ? scale({ cu: lerp(0.11, 0.0, a), cv: 0.3, ru: 0.31, rv: 0.22 }, k) : null;
  },
  meso: (z) => (z >= ZB && z <= 0.99 ? { cu: 0, cv: -0.38, ru: 0.16, rv: 0.19 } : null),
  eso: (z) => (z >= ZB - 0.02 && z <= 0.99 ? { cu: 0, cv: -0.38, ru: 0.06, rv: 0.06 } : null),
  stomach: (z) => {
    const k = prof(z, 0.1, ZB - 0.02, 0.3);
    return k > 0.02 ? { cu: 0, cv: lerp(-0.12, -0.3, clamp((z - 0.34) / 0.1)), ru: 0.09 + 0.05 * k, rv: 0.09 + 0.04 * k } : null;
  },
  aorta: (z) => (z >= 0.01 && z <= 0.99 ? { cu: 0, cv: -0.58, ru: 0.05, rv: 0.05 } : null),
  cord: (z) => (z >= 0.01 && z <= 0.99 ? { cu: 0, cv: -0.86, ru: 0.06, rv: 0.06 } : null),
};

/** The dorsolateral part of the upper cavity on one side (later the pleural cavity), and the canal under it. */
function recess(z: number, S: State, s: 1 | -1): Ell | null {
  if (z < ZS || z > 0.9) return null;
  const top = prof(z, ZS, 0.9, 0.28, true, false);
  // Until the pleuropericardial membranes part them, the recess opens ventrally into the pericardial
  // part: one cavity round the heart and the foregut, as in the thorax section.
  const join = 1 - S.ppm;
  const full: Ell = { cu: s * (0.48 + 0.04 * S.lung), cv: -0.27 + 0.1 * join, ru: 0.22 + 0.1 * S.lung, rv: 0.24 + 0.08 * S.lung + 0.12 * join };
  const c = canalFull(s);
  // Narrow at the bottom into the canal, so cavity and canal are one passage.
  const b = sm((z - ZS) / 0.07);
  const e: Ell = { cu: lerp(c.cu, full.cu, b), cv: lerp(c.cv, full.cv, b), ru: lerp(c.ru, full.ru, b), rv: lerp(c.rv, full.rv, b) };
  return scale(e, top);
}
const canalFull = (s: 1 | -1): Ell => ({ cu: s * 0.44, cv: -0.4, ru: 0.12, rv: 0.13 });
/** The open part of a canal: the membrane closes it from the lateral wall inwards. */
function canal(z: number, S: State, s: 1 | -1): Ell | null {
  if (z < ZB || z > ZS) return null;
  const c = canalFull(s);
  const k = 1 - S.pom;
  return k > 0.03 ? { ...c, cu: c.cu - s * c.ru * (1 - k), ru: c.ru * k } : null;
}
function membraneP(z: number, S: State, s: 1 | -1): Ell | null {
  if (z < ZB || z > ZS || S.pom < 0.02) return null;
  const c = canalFull(s);
  return { ...c, cu: c.cu + s * c.ru * (1 - S.pom), ru: c.ru * S.pom };
}
function lung(z: number, S: State, s: 1 | -1): Ell | null {
  if (S.lung < 0.02) return null;
  const k = prof(z, 0.6 - 0.05 * S.lung, 0.72 + 0.13 * S.lung, 0.5);
  return k > 0.02 ? scale({ cu: s * (0.48 + 0.04 * S.lung), cv: -0.25, ru: 0.05 + 0.18 * S.lung, rv: 0.05 + 0.19 * S.lung }, k) : null;
}

/** The pleuropericardial membrane across the upper cavity: from the lateral wall to the mesenchyme round the oesophagus. */
function ppmCurve(s: 1 | -1, grow: number): Pt[] {
  const keys: Pt[] = [
    [s * 0.9, 0.02],
    [s * 0.62, -0.02],
    [s * 0.36, -0.1],
    [s * 0.16, -0.24],
  ];
  const n = 16;
  const pts: Pt[] = [];
  for (let i = 0; i <= n; i++) {
    const a = (i / n) * 3 * grow;
    const j = Math.min(2, Math.floor(a));
    const r = a - j;
    pts.push([lerp(keys[j][0], keys[j + 1][0], r), lerp(keys[j][1], keys[j + 1][1], r)]);
  }
  return pts;
}

// ——— Colours ———

function hex(c: string): [number, number, number] {
  const n = parseInt(c.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function mixHex(a: string, b: string, k: number) {
  const A = hex(a);
  const B = hex(b);
  const m = A.map((x, i) => Math.round(lerp(x, B[i], clamp(k))));
  return `#${m.map((x) => x.toString(16).padStart(2, '0')).join('')}`;
}
const COL = {
  coelom: '#a77cff',
  peri: '#ff7d9c',
  pleura: '#6fb6ff',
  perito: '#7bdc8e',
  septum: P.septum,
  pom: P.poMem,
  ppm: P.ppMem,
  meso: P.eso,
  gut: '#e8c35a',
  heart: '#c62d42',
  lung: P.lung,
};
const colours = (S: State) => {
  const upper = mixHex(COL.coelom, COL.peri, S.split);
  const lower = mixHex(COL.coelom, COL.perito, S.split);
  const side = mixHex(upper, COL.pleura, clamp(0.45 * S.lung + 0.55 * S.ppm + (S.ppm > 0.5 ? 1 : 0)));
  return { upper, lower, side };
};

// ——— The flat section ———

const SX = 790;
const SY = 444;
const SR = 116;
const flat = (u: number, v: number): Pt => [SX + u * SR, SY + v * SR];

function ringUV(e: Ell, n = 26): [number, number][] {
  return Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2;
    const s = Math.sin(a);
    return [e.cu + e.ru * Math.cos(a), e.cv + (s < 0 ? (e.rd ?? e.rv) : e.rv) * s];
  });
}
const ringF = (e: Ell, n?: number) => ringUV(e, n).map(([u, v]) => flat(u, v));

function slice(S: State) {
  const z = S.zc;
  const c = colours(S);
  const out: { id: string; e: Ell; fill: string; o: number }[] = [];
  const push = (id: string, e: Ell | null, fill: string, o: number) => {
    if (e) out.push({ id, e, fill, o });
  };
  const upperId = S.one > 0.5 ? 'enbrioi-barruko-zeloma' : S.ppm > 0.5 ? 'perikardio-barrunbea' : 'hasierako-perikardio-barrunbea';
  const sideId = S.one > 0.5 ? 'enbrioi-barruko-zeloma' : S.ppm > 0.5 ? 'pleura-barrunbea' : 'hasierako-perikardio-barrunbea';
  for (const s of [1, -1] as const) {
    push(sideId, recess(z, S, s), c.side, 0.55);
    push(S.one > 0.5 ? 'enbrioi-barruko-zeloma' : 'erreten-perikardioperitonealak', canal(z, S, s), mixHex(c.side, '#56c8f0', 0.35 + 0.4 * S.canal), 0.75);
  }
  push(upperId, SH.peri(z, S), c.upper, 0.5);
  push(S.one > 0.5 ? 'enbrioi-barruko-zeloma' : 'peritoneo-barrunbea', SH.perito(z, S), c.lower, 0.5);
  push(S.one > 0.5 ? 'enbrioi-barruko-zeloma' : 'hasierako-perikardio-barrunbea', SH.bridge(z, S), mixHex(c.upper, c.lower, 0.5), 0.5);
  const solids: { id: string; e: Ell; fill: string; o: number }[] = [];
  const add = (id: string, e: Ell | null, fill: string, o = 1) => {
    if (e) solids.push({ id, e, fill, o });
  };
  add('septum-transversum', SH.septum(z, S), COL.septum);
  add('hestegorri-inguruko-mesenkima', SH.meso(z, S), COL.meso, 0.8);
  add(S.gut, SH.eso(z, S) ?? SH.stomach(z, S), COL.gut);
  for (const s of [1, -1] as const) {
    add('mintz-pleuroperitonealak', membraneP(z, S, s), COL.pom);
    add(S.lung < 0.75 ? 'birika-hastapenak' : 'birikak', lung(z, S, s), COL.lung);
  }
  add('bihotza', SH.heart(z, S), COL.heart);
  return { cav: out, solids };
}

// ——— The scene ———

interface Script {
  state: (t: number) => Omit<State, 'gut' | 'zc'> & { zc: number };
  gut: State['gut'];
  notes: { a: number; b: number; text: string }[];
}

/** Plane height through key frames (t → z), eased between them. */
export function keys(k: [number, number][]) {
  return (t: number) => {
    if (t <= k[0][0]) return k[0][1];
    for (let i = 1; i < k.length; i++) if (t <= k[i][0]) return lerp(k[i - 1][1], k[i][1], sm((t - k[i - 1][0]) / (k[i][0] - k[i - 1][0] || 1)));
    return k[k.length - 1][1];
  };
}

function coelomMap(script: Script): SceneComponent {
  function CoelomMap({ t, reduced }: SceneProps) {
    const uid = useId().replace(/:/g, '');
    const shade = `w7-map-shade${uid}`;
    const ref = useRef<SVGGElement>(null);
    // A plane the viewer dragged: kept while the player stays on the same moment.
    const [held, setHeld] = useState<{ z: number; t: number; drag: boolean } | null>(null);
    const base = script.state(t);
    const own = held && (held.drag || Math.abs(held.t - t) < 0.004) ? held.z : null;
    const S: State = { ...base, gut: script.gut, zc: own ?? base.zc };
    const c = colours(S);
    const cut = slice(S);
    /** The pointer, in the embryo drawing's own coordinates. */
    const zOf = (e: ReactPointerEvent) => {
      const m = ref.current?.getScreenCTM();
      if (!m) return S.zc;
      const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(m.inverse());
      return zNear(fromSide([p.x, p.y]));
    };
    const onDown = (e: ReactPointerEvent<SVGElement>) => {
      e.stopPropagation();
      (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
      setHeld({ z: zOf(e), t, drag: true });
    };
    const onMove = (e: ReactPointerEvent<SVGElement>) => {
      if (held?.drag) setHeld({ z: zOf(e), t, drag: true });
    };
    const onUp = () => held && setHeld({ ...held, t, drag: false });

    const here = bodyAt(S.zc);
    const sides = [1, -1] as const;
    const [pa, pb] = planeAt(S.zc).map(sideXY);
    const grip: Pt = [pa[0] + 20, pa[1] - 2];
    /** A name's point on the embryo (its drawing's coordinates). */
    const A = (x: number, y: number) => {
      const [ax, ay] = sideXY([x, y]);
      return { ax, ay };
    };
    const upperName = S.one > 0.5 ? 'enbrioi-barruko-zeloma' : S.ppm > 0.5 ? 'perikardio-barrunbea' : 'hasierako-perikardio-barrunbea';
    const lowerName = S.one > 0.5 ? 'enbrioi-barruko-zeloma' : 'peritoneo-barrunbea';
    const canalName = S.one > 0.5 ? 'enbrioi-barruko-zeloma' : S.ppm > 0.5 ? 'pleura-barrunbea' : 'erreten-perikardioperitonealak';
    const lungName = S.lung < 0.75 ? 'birika-hastapenak' : 'birikak';
    // The fluid that can still pass from the upper cavity through a canal into the peritoneal cavity.
    const flow = S.canal > 0.02 && S.pom < 0.6 ? S.canal * (1 - sm(S.pom / 0.6)) : 0;
    const level = S.zc > ZS ? 'toraxa' : S.zc >= ZB ? 'septumaren maila' : 'abdomena';
    const st: SideState = {
      upper: c.upper,
      lower: c.lower,
      side: S.one > 0.5 ? c.upper : S.ppm > 0.5 ? c.side : mixHex(c.side, '#56c8f0', 0.35 + 0.4 * S.canal),
      sep: S.sep,
      canal: S.canal,
      lung: S.lung,
      ppm: S.ppm,
      pom: S.pom,
      ids: { upper: upperName, lower: lowerName, canal: canalName, gut: S.gut },
    };

    return (
      <g ref={ref}>
        <defs>
          <radialGradient id={`${shade}-sec`} cx="0.42" cy="0.38" r="0.7">
            <stop offset="0" stopColor="#fff" stopOpacity={0.1} />
            <stop offset="0.7" stopColor="#000" stopOpacity={0} />
            <stop offset="1" stopColor="#000" stopOpacity={0.3} />
          </radialGradient>
          <radialGradient id={`${shade}-glow`} cx="0.5" cy="0.5" r="0.5">
            <stop offset="0" stopColor="#8a5a9a" stopOpacity={0.22} />
            <stop offset="1" stopColor="#8a5a9a" stopOpacity={0} />
          </radialGradient>
        </defs>
        <rect x={0} y={0} width={1000} height={640} fill="#0c0c0f" />
        <ellipse cx={360} cy={340} rx={300} ry={290} fill={`url(#${shade}-glow)`} />

        {/* ——— The embryo from the side (topic 5's day-32 embryo), the cavities seen through its wall ——— */}
        <SideEmbryo st={st} plane={S.zc} beating={!reduced} flow={flow} reduced={reduced} />

        {/* Drag handle on the plane. */}
        <g style={{ cursor: 'ns-resize' }} onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}>
          <title>Mozketa planoa: arrastatu gora eta behera, eskuineko zeharkako mozketa maila horretan ikusteko</title>
          <path d={`M${f1(pa[0])},${f1(pa[1])}L${f1(pb[0])},${f1(pb[1])}`} fill="none" stroke="transparent" strokeWidth={18} />
          <rect x={grip[0] - 13} y={grip[1] - 17} width={26} height={34} rx={9} fill="#f4f7ff" />
          <path d={`M${f1(grip[0] - 6)},${f1(grip[1] - 4)}L${f1(grip[0])},${f1(grip[1] - 11)}L${f1(grip[0] + 6)},${f1(grip[1] - 4)}M${f1(grip[0] - 6)},${f1(grip[1] + 4)}L${f1(grip[0])},${f1(grip[1] + 11)}L${f1(grip[0] + 6)},${f1(grip[1] + 4)}`} fill="none" stroke="#1a1d26" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
        </g>

        <Note x={770} y={30} size={13} tone="dim">
          Albotik ikusita · arrastatu plano zuria gora eta behera
        </Note>

        {/* ——— The section at the plane ——— */}
        <Note x={SX} y={Math.round(SY - 0.9 * SR - 42)} size={13}>
          {`Plano zuriko zeharkako mozketa · ${level}`}
        </Note>
        <Note x={Math.round(SX - SR - 34)} y={SY} size={12.5} tone="dim">
          eskuina
        </Note>
        <Note x={Math.round(SX + SR + 34)} y={SY} size={12.5} tone="dim">
          ezkerra
        </Note>
        <Note x={SX} y={Math.round(SY - 0.9 * SR - 16)} size={12.5} tone="dim">
          dortsala
        </Note>
        <Note x={SX} y={Math.round(SY + (here.rv + 0.13) * SR)} size={12.5} tone="dim">
          bentrala
        </Note>
        <Part id="gorputz-pareta">
          <path d={poly(ringF(here, 64))} fill={P.wall} />
          <path d={poly(ringF(here, 64))} fill="url(#w7-mesench)" />
          <path d={poly(ringF(here, 64))} fill={`url(#${shade}-sec)`} />
          <path d={poly(ringF(here, 64))} fill="none" stroke={P.skin} strokeWidth={5} opacity={0.95} />
        </Part>
        {/* Back: the somites either side, the spinal cord with its canal, the notochord in the forming vertebra, the aorta. */}
        <Part id="somitak">
          {sides.map((s) => (
            <g key={s}>
              <ellipse cx={f1(SX + s * 0.3 * SR)} cy={f1(SY - 0.72 * SR)} rx={0.13 * SR} ry={0.1 * SR} fill="#a84a5c" opacity={0.75} />
              <ellipse cx={f1(SX + s * 0.3 * SR)} cy={f1(SY - 0.72 * SR)} rx={0.13 * SR} ry={0.1 * SR} fill="url(#w7-muscle)" opacity={0.7} />
            </g>
          ))}
        </Part>
        <Part id="hodi-neurala">
          <ellipse cx={SX} cy={f1(SY - 0.86 * SR)} rx={0.07 * SR} ry={0.065 * SR} fill="#6d7fe0" stroke="rgba(10,16,48,0.6)" strokeWidth={1} />
          <ellipse cx={SX} cy={f1(SY - 0.86 * SR)} rx={0.012 * SR} ry={0.035 * SR} fill="#0c1428" />
        </Part>
        <Part id="ornoak">
          <ellipse cx={SX} cy={f1(SY - 0.72 * SR)} rx={0.15 * SR} ry={0.1 * SR} fill={P.bone} opacity={0.85} />
        </Part>
        <Part id="notokorda">
          <circle cx={SX} cy={f1(SY - 0.72 * SR)} r={0.03 * SR} fill="#dfe9ff" opacity={0.9} />
        </Part>
        <Part id="aorta">
          <circle cx={SX} cy={f1(SY - 0.58 * SR)} r={0.05 * SR} fill={P.aorta} stroke="#7a0f1e" strokeWidth={1} />
        </Part>
        {/* The serous lining of the cavities, drawn under them: where two pieces of one cavity overlap, no seam shows. */}
        {cut.cav.map((p, i) => (
          <path key={`fl${i}`} d={poly(ringF(p.e))} fill="none" stroke="rgba(255,236,240,0.6)" strokeWidth={2.6} pointerEvents="none" />
        ))}
        {cut.cav.map((p, i) => (
          <Part key={`fc${i}`} id={p.id}>
            <path d={poly(ringF(p.e))} fill={P.space} />
            <path d={poly(ringF(p.e))} fill={p.fill} opacity={p.o} />
          </Part>
        ))}
        {S.zc < ZB && S.zc > 0.08 && (
          <Part id="mesenterio-dortsala">
            <path d={`M${SX},${f1(SY - 0.66 * SR)}L${SX},${f1(SY + (SH.stomach(S.zc, S)?.cv ?? -0.1) * SR)}`} stroke={P.serosa} strokeWidth={5} opacity={0.8} />
          </Part>
        )}
        {cut.solids.map((p, i) => {
          const L = ringF(p.e);
          const inner = (k: number, fill: string, o = 1) => <path d={poly(ringF(scale(p.e, k)))} fill={fill} opacity={o} />;
          return (
            <Part key={`fs${i}`} id={p.id}>
              <path d={poly(L)} fill={p.fill} opacity={p.o} stroke="rgba(0,0,0,0.3)" strokeWidth={1} />
              {/* Cut organs show what is inside them: the heart's chamber, the bronchus, the gut's lumen. */}
              {p.id === 'bihotza' && (
                <>
                  <path d={poly(L)} fill="url(#w7-muscle)" opacity={0.55} />
                  {inner(0.55, '#5c0d1c')}
                  {inner(0.45, '#8e1b30', 0.7)}
                </>
              )}
              {(p.id === 'birikak' || p.id === 'birika-hastapenak') && (
                <>
                  <path d={poly(L)} fill="url(#w7-lung)" opacity={0.7} />
                  {inner(0.3, '#f3d39a', 0.9)}
                  {inner(0.15, '#2a1a10')}
                </>
              )}
              {p.id === S.gut && inner(0.35, '#2a1a08', 0.9)}
            </Part>
          );
        })}
        {S.ppm > 0.02 && S.zc > ZS + 0.01 && S.zc < 0.88 && (
          <Part id="mintz-pleuroperikardikoak">
            {sides.map((s) => (
              <path key={s} d={poly(ppmCurve(s, S.ppm).map(([u, v]) => flat(u, v)), false)} fill="none" stroke={COL.ppm} strokeWidth={6} strokeLinecap="round" />
            ))}
          </Part>
        )}
        <path d={poly(ringF(here, 64))} fill="none" stroke="#f4f7ff" strokeWidth={2} opacity={0.85} pointerEvents="none" />

        {/* Colour key: the same colour for the same cavity in every view of the topic (common's CavityKey). */}
        <CavityKey
          rows={[
            S.one > 0.5 ? KEY7.zeloma : S.ppm > 0.5 ? KEY7.peri : KEY7.hperi,
            (S.ppm > 0.5 || S.lung > 0.3) && KEY7.pleura,
            S.canal > 0.02 && S.ppm <= 0.5 && S.one <= 0.5 && KEY7.canal,
            S.one <= 0.5 && KEY7.perito,
            KEY7.septum,
          ]}
        />

        {script.notes.map((n, i) => (
          <Note key={i} x={500} y={612} tone="accent" show={Math.min(n.a <= 0 ? 1 : seg(t, n.a, n.a + 0.03), 1 - seg(t, n.b - 0.03, n.b))}>
            {n.text}
          </Note>
        ))}

        {/* Names: the dorsal ones (and the cavity round the heart) in a column above the section, the
            ventral ones under the face, left of the belly. */}
        <Label id={S.gut} x={612} y={80} {...A(667, 236)} />
        <Label id="hestegorri-inguruko-mesenkima" x={612} y={108} {...A(684, 232)} small />
        <Label id={upperName} x={612} y={52} {...A(600, 262)} />
        <Label id="pleura-barrunbea" x={612} y={136} {...A(646, 276)} show={S.one > 0.5 || S.ppm <= 0.5 ? 0 : S.ppm} />
        <Label id={lungName} x={612} y={220} {...A(lerp(682, 664, S.lung), lerp(262, 318, S.lung))} show={S.lung > 0.02 ? 1 : 0} />
        <Label id="mintz-pleuroperikardikoak" x={612} y={192} {...A(637, 286)} show={S.ppm > 0.02 ? 1 : 0} small />
        <Label id="bihotza" x={612} y={164} {...A(604, 312)} />
        <Label id="erreten-perikardioperitonealak" x={612} y={248} {...A(678, 372)} show={S.one > 0.5 || S.ppm > 0.5 ? 0 : 1} small />
        <Label id="mintz-pleuroperitonealak" x={612} y={276} {...A(676, 402)} show={S.pom > 0.05 ? 1 : 0} small />
        <Label id="septum-transversum" x={214} y={432} {...A(560, 393)} show={S.sep > 0.15 ? 1 : 0} />
        <Label id="peritoneo-barrunbea" x={214} y={556} {...A(520, 470)} show={S.one > 0.5 ? 0 : 1} />
      </g>
    );
  }
  return CoelomMap;
}

// ——— The three stages that use the map ———

/** 7:septum-transversum — one coelom; the septum grows across it; two cavities joined by two dorsal canals. */
export const CoelomMapSeptum = coelomMap({
  gut: 'aurreko-hestea',
  state: (t) => ({
    one: 1 - seg(t, 0.54, 0.6),
    sep: seg(t, 0.18, 0.34),
    split: seg(t, 0.54, 0.6),
    canal: seg(t, 0.72, 0.78),
    lung: 0,
    ppm: 0,
    pom: 0,
    zc: keys([
      [0, 0.7],
      [0.2, 0.7],
      [0.3, 0.47],
      [0.54, 0.47],
      [0.58, 0.7],
      [0.62, 0.7],
      [0.67, 0.26],
      [0.7, 0.26],
      [0.76, 0.47],
    ])(t),
  }),
  notes: [
    { a: 0, b: 0.18, text: 'Zeloma barrunbe bakarra da: toraxetik abdomenera' },
    { a: 0.18, b: 0.36, text: 'Septum transversuma: mesodermozko trenkada horizontala' },
    { a: 0.36, b: 0.54, text: 'Aurrean eta alboetan paretan finkatuta; atzean hestegorri inguruko mesenkiman' },
    { a: 0.54, b: 0.72, text: 'Goian hasierako perikardio barrunbea · behean peritoneo barrunbea' },
    { a: 0.72, b: 2, text: 'Atze-alboetan bi erreten: goiko eta beheko barrunbeak komunikatuta' },
  ],
});

/** 7:pleura-perikardioa — the lung buds grow into the dorsolateral parts; the membranes set the pericardium apart. */
export const CoelomMapThorax = coelomMap({
  gut: 'hestegorria',
  state: (t) => ({
    one: 0,
    sep: 1,
    split: 1,
    canal: 0,
    lung: seg(t, 0.1, 0.72),
    ppm: seg(t, 0.36, 0.555),
    pom: 0,
    zc: 0.7,
  }),
  notes: [
    { a: 0, b: 0.24, text: 'Hasierako perikardio barrunbea: septumaren gainean, torax osoa' },
    { a: 0.24, b: 0.36, text: 'Birika hastapenak atze-alboko aldeetan sartzen dira' },
    { a: 0.36, b: 0.6, text: 'Mintz pleuroperikardikoak: alboko paretatik hestegorri inguruko mesenkimara' },
    { a: 0.6, b: 2, text: 'Bi pleura barrunbe (atze-alboetan) + perikardio barrunbea (aurrean, erdian)' },
  ],
});

/** 7:diafragma-eraketa — the canals still join the upper and lower cavities; the pleuroperitoneal membranes close them. */
export const CoelomMapDiaphragm = coelomMap({
  gut: 'hestegorria',
  state: (t) => ({
    one: 0,
    sep: 1,
    split: 1,
    canal: 1,
    lung: 0.3,
    ppm: 0,
    pom: seg(t, 0.76, 0.86),
    // Down the way the fluid goes: upper cavity, canal, peritoneal cavity; then back to the canals.
    zc: keys([
      [0, 0.47],
      [0.6, 0.47],
      [0.625, 0.7],
      [0.645, 0.7],
      [0.685, 0.3],
      [0.7, 0.3],
      [0.73, 0.47],
    ])(t),
  }),
  notes: [
    { a: 0, b: 0.62, text: 'Goian hasierako perikardio barrunbea · behean peritoneo barrunbea · tartean erretenak' },
    { a: 0.62, b: 0.74, text: '4. astea: erreten perikardioperitonealek (atzean) goiko eta beheko barrunbeak lotzen dituzte' },
    { a: 0.74, b: 2, text: '5. astea: mintz pleuroperitonealek erretenak ixten dituzte' },
  ],
});
