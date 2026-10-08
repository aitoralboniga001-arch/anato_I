'use client';

import { Fragment, useId, useRef, useState, type PointerEvent as ReactPointerEvent, type ReactNode } from 'react';
import { Label, Note, Part, clamp, lerp, seg, smoothPath, type Pt, type SceneProps } from '@/components/kit';
import type { SceneComponent } from '@/lib/sim/types';
import { P, f1, poly, sm } from './common';

/**
 * Barrunbeen mapa: the whole coelom of the trunk at once, as a see-through block seen from the front and
 * a little from above (the ventral wall made clear), next to the transverse section the student knows
 * from the notes. The section on the right is the same model cut at the white plane, so both always
 * agree: what is above the septum (primitive pericardial cavity, later pericardium and two pleurae), the
 * septum transversum, what is below (peritoneal cavity), and the two dorsal pericardioperitoneal canals
 * that join them until the pleuroperitoneal membranes close them. The plane follows the step; when the
 * player is paused it can be dragged up and down.
 *
 * Model space: u = side (−1 … 1), v = dorsal (−1) … ventral (+1), z = caudal (0) … cranial (1).
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
  ru: 1 - 0.24 * sm((z - 0.8) / 0.2) - 0.1 * sm((0.14 - z) / 0.14) + 0.04 * bump(z, 0.68, 0.12),
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
  const full: Ell = { cu: s * (0.48 + 0.04 * S.lung), cv: -0.27, ru: 0.22 + 0.1 * S.lung, rv: 0.24 + 0.08 * S.lung };
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

// ——— Projection (the block) and the flat section ———

const MX = 392;
const MY = 548;
const AU = 138;
const BV = -24;
const CV = 46;
const HZ = 418;
/** The block turns about its long axis (yaw, radians): the viewer can drag it round. */
interface View {
  c: number;
  s: number;
}
const viewOf = (yaw: number): View => ({ c: Math.cos(yaw), s: Math.sin(yaw) });
/** How near the viewer a point is (the ventral side faces the viewer at yaw 0). */
const depth = (V: View, u: number, v: number) => u * V.s + v * V.c;
const prj = (V: View, u: number, v: number, z: number): Pt => {
  const uu = u * V.c - v * V.s;
  const vv = depth(V, u, v);
  return [MX + uu * AU + vv * BV, MY - z * HZ + vv * CV];
};

const SX = 790;
const SY = 372;
const SR = 116;
const flat = (u: number, v: number): Pt => [SX + u * SR, SY + v * SR];

function ringUV(e: Ell, n = 26): [number, number][] {
  return Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2;
    const s = Math.sin(a);
    return [e.cu + e.ru * Math.cos(a), e.cv + (s < 0 ? (e.rd ?? e.rv) : e.rv) * s];
  });
}
const ring3 = (V: View, e: Ell, z: number, n?: number) => ringUV(e, n).map(([u, v]) => prj(V, u, v, z));
const ringF = (e: Ell, n?: number) => ringUV(e, n).map(([u, v]) => flat(u, v));

function hull(pts: Pt[]): Pt[] {
  const p = [...pts].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  if (p.length < 3) return p;
  const cross = (o: Pt, a: Pt, b: Pt) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lo: Pt[] = [];
  for (const q of p) {
    while (lo.length >= 2 && cross(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop();
    lo.push(q);
  }
  const up: Pt[] = [];
  for (const q of [...p].reverse()) {
    while (up.length >= 2 && cross(up[up.length - 2], up[up.length - 1], q) <= 0) up.pop();
    up.push(q);
  }
  return [...lo.slice(0, -1), ...up.slice(0, -1)];
}

const DZ = 0.012;

/**
 * A solid between z0 and z1: its outline and its top face. The outline follows the slices' left and right
 * extremes, so waists and bulges (the groove at the septum, the heart's base and apex) stay visible; the
 * bottom slice closes it in front, the top slice behind.
 */
function solid(V: View, at: (z: number) => Ell | null, z0: number, z1: number) {
  const zs: number[] = [];
  for (let z = z0; z < z1 - 1e-6; z += DZ) zs.push(z);
  // The exact top (the step may stop short of it).
  zs.push(z1);
  const rows: Pt[][] = [];
  let top: { e: Ell; z: number } | null = null;
  for (const z of zs) {
    const e = at(z);
    if (!e) continue;
    rows.push(ring3(V, e, z, 24));
    top = { e, z };
  }
  if (!rows.length) return null;
  if (rows.length === 1) return { outline: hull(rows[0]), top };
  const ext = (r: Pt[]) => {
    let iL = 0;
    let iR = 0;
    r.forEach((p, i) => {
      if (p[0] < r[iL][0]) iL = i;
      if (p[0] > r[iR][0]) iR = i;
    });
    return [iL, iR] as const;
  };
  /** The half of a ring between two of its points that lies in front (lower on screen) or behind. */
  const arc = (r: Pt[], from: number, to: number, front: boolean): Pt[] => {
    const n = r.length;
    const fwd: Pt[] = [];
    const bwd: Pt[] = [];
    for (let i = from, k = 0; k <= n; i = (i + 1) % n, k++) {
      fwd.push(r[i]);
      if (i === to) break;
    }
    for (let i = from, k = 0; k <= n; i = (i - 1 + n) % n, k++) {
      bwd.push(r[i]);
      if (i === to) break;
    }
    const my = (a: Pt[]) => a.reduce((s, p) => s + p[1], 0) / a.length;
    return my(fwd) > my(bwd) === front ? fwd : bwd;
  };
  const bottom = rows[0];
  const topRow = rows[rows.length - 1];
  const [bL, bR] = ext(bottom);
  const [tL, tR] = ext(topRow);
  const left = [...rows].reverse().map((r) => r[ext(r)[0]]);
  const right = rows.map((r) => r[ext(r)[1]]);
  return { outline: [...left, ...arc(bottom, bL, bR, true), ...right, ...arc(topRow, tR, tL, false)], top };
}

/**
 * `vol` picks the shading: a cylinder (light from the left, falling off to the right) for tubes and
 * cavities, a sphere (highlight up and left) for organs. `tex` lays a tissue texture over the solid.
 */
function Block({ V, at, z0, z1, color, alpha, shade, vol = 'cyl', tex }: { V: View; at: (z: number) => Ell | null; z0: number; z1: number; color: string; alpha: number; shade: string; vol?: 'cyl' | 'sph'; tex?: string }) {
  if (z1 - z0 < 0.002 || alpha < 0.01) return null;
  const s = solid(V, at, z0, z1);
  if (!s) return null;
  const d = poly(s.outline);
  return (
    <g opacity={alpha}>
      <path d={d} fill={color} />
      <path d={d} fill={`url(#${shade}-${vol === 'sph' ? 's' : 'c'})`} />
      {tex && <path d={d} fill={`url(#${tex})`} opacity={0.9} />}
      {s.top && <path d={poly(ring3(V, s.top.e, s.top.z))} fill={mixHex(color, '#ffffff', 0.3)} opacity={0.6} />}
      <path d={d} fill="none" stroke={mixHex(color, '#ffffff', 0.6)} strokeWidth={1.5} opacity={0.95} strokeLinejoin="round" />
    </g>
  );
}

/**
 * Everything of the block between z0 and z1. Three layers, each drawn far to near for the current turn:
 * the dorsal midline, then the see-through cavities and sheets, then the solid organs on top.
 */
function Layer({ V, S, z0, z1, shade, ids }: { V: View; S: State; z0: number; z1: number; shade: string; ids: { gut: string } }) {
  const c = colours(S);
  const sides = [1, -1] as const;
  const B = (at: (z: number) => Ell | null, a: number, b: number, color: string, alpha: number, vol: 'cyl' | 'sph' = 'cyl', tex?: string) => (
    <Block V={V} at={at} z0={Math.max(a, z0)} z1={Math.min(b, z1)} color={color} alpha={alpha} shade={shade} vol={vol} tex={tex} />
  );
  const upperId = S.one > 0.5 ? 'enbrioi-barruko-zeloma' : S.ppm > 0.5 ? 'perikardio-barrunbea' : 'hasierako-perikardio-barrunbea';
  const sideId = S.one > 0.5 ? 'enbrioi-barruko-zeloma' : S.ppm > 0.5 ? 'pleura-barrunbea' : 'hasierako-perikardio-barrunbea';
  const lowerId = S.one > 0.5 ? 'enbrioi-barruko-zeloma' : 'peritoneo-barrunbea';
  const items: { g: number; d: number; el: ReactNode }[] = [];
  const put = (g: number, u: number, v: number, el: ReactNode) => items.push({ g, d: depth(V, u, v), el });

  // Dorsal midline: spinal cord, vertebrae, aorta.
  put(0, 0, -0.86, <Part id="hodi-neurala" quiet>{B((z) => SH.cord(z, S), 0, 1, '#6d7fe0', 0.8)}</Part>);
  put(
    0,
    0,
    -0.72,
    <Part id="ornoak" quiet>
      {Array.from({ length: 9 }, (_, i) => {
        const a = 0.03 + i * 0.108;
        return <g key={i}>{B(() => ({ cu: 0, cv: -0.72, ru: 0.15, rv: 0.1 }), a, a + 0.085, P.bone, 0.75)}</g>;
      })}
    </Part>,
  );
  put(0, 0, -0.58, <Part id="aorta" quiet>{B((z) => SH.aorta(z, S), 0, 1, P.aorta, 0.85)}</Part>);

  // Upper cavity, dorsolateral parts (lungs grow into them), and the canals under them.
  for (const s of sides) {
    put(1, s * 0.48, -0.27, <Part id={sideId}>{B((z) => recess(z, S, s), ZS, 0.9, c.side, 0.62)}</Part>);
    put(
      1,
      s * 0.44,
      -0.4,
      <>
        <Part id="erreten-perikardioperitonealak" show={S.one > 0.5 ? 0 : 1}>
          {B((z) => canal(z, S, s), ZB, ZS, mixHex(c.side, '#56c8f0', 0.35 + 0.4 * S.canal), 0.72 + 0.26 * S.canal)}
        </Part>
        <Part id="enbrioi-barruko-zeloma" show={S.one > 0.5 ? 1 : 0}>
          {B((z) => canal(z, S, s), ZB, ZS, c.side, 0.62)}
        </Part>
        <Part id="mintz-pleuroperitonealak" show={S.pom > 0.02 ? 1 : 0}>
          {B((z) => membraneP(z, S, s), ZB, ZS, COL.pom, 0.98)}
        </Part>
      </>,
    );
  }
  put(1, 0, -0.38, <Part id="hestegorri-inguruko-mesenkima">{B((z) => SH.meso(z, S), ZB, 1, COL.meso, 0.5, 'cyl', 'w7-mesench')}</Part>);
  put(
    1,
    0,
    -0.37,
    <Part id={ids.gut}>
      {B((z) => SH.eso(z, S), ZB - 0.02, 1, COL.gut, 0.98)}
      {B((z) => SH.stomach(z, S), 0.1, ZB - 0.02, COL.gut, 0.98, 'sph')}
    </Part>,
  );
  put(1, 0, 0.02, <Part id={lowerId}>{B((z) => SH.perito(z, S), 0.05, ZB, c.lower, 0.58)}</Part>);
  put(
    1,
    0,
    0.1,
    <Part id={S.one > 0.5 ? 'enbrioi-barruko-zeloma' : 'hasierako-perikardio-barrunbea'} show={S.sep < 0.98 ? 1 : 0}>
      {B((z) => SH.bridge(z, S), ZB, ZS, mixHex(c.upper, c.lower, 0.5), 0.52)}
    </Part>,
  );
  put(
    1,
    0,
    0.2,
    <Part id="septum-transversum" show={S.sep > 0.02 ? 1 : 0}>
      {B((z) => SH.septum(z, S), ZB, ZS, COL.septum, 0.98 - 0.3 * S.canal, 'cyl', 'w7-tendon')}
    </Part>,
  );
  put(1, 0, 0.3, <Part id={upperId}>{B((z) => SH.peri(z, S), ZS, 0.9, c.upper, 0.58)}</Part>);
  // Pleuropericardial membranes: a curved sheet from the side wall to the mesenchyme round the oesophagus.
  if (S.ppm > 0.02)
    for (const s of sides) {
      const za = Math.max(ZS + 0.01, z0);
      const zb = Math.min(0.88, z1);
      if (zb - za < 0.005) continue;
      const cv = ppmCurve(s, S.ppm);
      const d = poly([...cv.map(([u, v]) => prj(V, u, v, za)), ...[...cv].reverse().map(([u, v]) => prj(V, u, v, zb))]);
      put(
        1,
        s * 0.5,
        -0.08,
        <Part id="mintz-pleuroperikardikoak">
          <path d={d} fill={COL.ppm} opacity={0.32} stroke={mixHex(COL.ppm, '#ffffff', 0.4)} strokeWidth={1} />
        </Part>,
      );
    }

  // Solid organs.
  put(2, 0.05, 0.3, <Part id="bihotza">{B((z) => SH.heart(z, S), 0.57, 0.83, COL.heart, 0.98, 'sph')}</Part>);
  if (S.lung > 0.02)
    for (const s of sides)
      put(2, s * 0.5, -0.25, <Part id={S.lung < 0.75 ? 'birika-hastapenak' : 'birikak'}>{B((z) => lung(z, S, s), 0.5, 0.9, COL.lung, 0.98, 'sph', 'w7-lung')}</Part>);

  return (
    <g>
      {items
        .map((it, i) => ({ ...it, i }))
        .sort((a, b) => a.g - b.g || a.d - b.d || a.i - b.i)
        .map((it) => (
          <Fragment key={it.i}>{it.el}</Fragment>
        ))}
    </g>
  );
}

/** What the plane cuts, in model units: the same pieces for the plane in the block and for the flat section. */
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
    // The turn the viewer gave the block by dragging it sideways (kept while playing).
    const [spin, setSpin] = useState(0);
    const rot = useRef<{ x: number; s: number; moved: boolean } | null>(null);
    // The block swings round into its resting three-quarter view as the step opens.
    const yaw = clamp((reduced ? -0.42 : lerp(-1.15, -0.42, sm(seg(t, 0, 0.07)))) + spin, -1.25, 1.1);
    const V = viewOf(yaw);
    const P3 = (u: number, v: number, z: number) => prj(V, u, v, z);
    const base = script.state(t);
    const own = held && (held.drag || Math.abs(held.t - t) < 0.004) ? held.z : null;
    const S: State = { ...base, gut: script.gut, zc: own ?? base.zc };
    const c = colours(S);
    const cut = slice(S);
    const zOf = (e: ReactPointerEvent) => {
      const m = ref.current?.getScreenCTM();
      if (!m) return S.zc;
      const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(m.inverse());
      return clamp((MY - p.y) / HZ, 0.08, 0.92);
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
    const onRotDown = (e: ReactPointerEvent<SVGElement>) => {
      if (e.button !== 0) return;
      e.stopPropagation();
      rot.current = { x: e.clientX, s: spin, moved: false };
    };
    const onRotMove = (e: ReactPointerEvent<SVGElement>) => {
      const r = rot.current;
      if (!r) return;
      const dx = e.clientX - r.x;
      if (!r.moved && Math.abs(dx) < 4) return;
      if (!r.moved) {
        r.moved = true;
        (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
      }
      setSpin(clamp(r.s + dx * 0.007, -0.5, 1.6));
    };
    const onRotUp = () => {
      setTimeout(() => (rot.current = null), 0);
    };

    const here = bodyAt(S.zc);
    const plane = ring3(V, here, S.zc, 48);
    const grip = P3(here.ru + 0.12, 0.2, S.zc);
    const bodyHull = solid(V, bodyAt, 0, 1)?.outline ?? [];
    const sides = [1, -1] as const;

    // Anchors for the names (left side of the block).
    const A3 = (u: number, v: number, z: number) => {
      const [x, y] = P3(u, v, z);
      return { ax: x, ay: y };
    };
    const upperName = S.one > 0.5 ? 'enbrioi-barruko-zeloma' : S.ppm > 0.5 ? 'perikardio-barrunbea' : 'hasierako-perikardio-barrunbea';
    const lungR = lung(0.72, S, -1);
    // The fluid that can still pass from the upper cavity through a canal into the peritoneal cavity.
    const flowOn = S.canal > 0.02 && S.pom < 0.6;
    const flowPath = (s: 1 | -1) =>
      smoothPath(
        [
          P3(s * 0.47, -0.27, 0.66),
          P3(s * 0.45, -0.34, 0.56),
          P3(s * 0.44, -0.4, 0.47),
          P3(s * 0.43, -0.3, 0.38),
          P3(s * 0.38, -0.05, 0.28),
        ],
        false,
        0.4,
      );

    return (
      <g ref={ref}>
        <defs>
          {/* Cylinder: light from the left, falling off to the right. Sphere: highlight up and left. */}
          <linearGradient id={`${shade}-c`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#000" stopOpacity={0.28} />
            <stop offset="0.28" stopColor="#fff" stopOpacity={0.3} />
            <stop offset="0.55" stopColor="#fff" stopOpacity={0} />
            <stop offset="1" stopColor="#000" stopOpacity={0.5} />
          </linearGradient>
          <radialGradient id={`${shade}-s`} cx="0.34" cy="0.3" r="0.85">
            <stop offset="0" stopColor="#fff" stopOpacity={0.5} />
            <stop offset="0.35" stopColor="#fff" stopOpacity={0.08} />
            <stop offset="1" stopColor="#000" stopOpacity={0.55} />
          </radialGradient>
          {/* The body wall: lit on the left, a skin-coloured edge, deeper tissue inside. */}
          <linearGradient id={`${shade}-w`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#7a4a5c" />
            <stop offset="0.3" stopColor="#6a3d4e" />
            <stop offset="1" stopColor="#3a2230" />
          </linearGradient>
          {/* Rounded flanks: the wall darkens towards the silhouette, so the trunk reads as a body, not a tube. */}
          <radialGradient id={`${shade}-rim`} cx="0.42" cy="0.46" r="0.62">
            <stop offset="0.55" stopColor="#000" stopOpacity={0} />
            <stop offset="0.9" stopColor="#000" stopOpacity={0.28} />
            <stop offset="1" stopColor="#000" stopOpacity={0.45} />
          </radialGradient>
          <radialGradient id={`${shade}-sec`} cx="0.42" cy="0.38" r="0.7">
            <stop offset="0" stopColor="#fff" stopOpacity={0.1} />
            <stop offset="0.7" stopColor="#000" stopOpacity={0} />
            <stop offset="1" stopColor="#000" stopOpacity={0.3} />
          </radialGradient>
          <radialGradient id={`${shade}-glow`} cx="0.5" cy="0.5" r="0.5">
            <stop offset="0" stopColor="#8a5a9a" stopOpacity={0.28} />
            <stop offset="1" stopColor="#8a5a9a" stopOpacity={0} />
          </radialGradient>
        </defs>
        <rect x={0} y={0} width={1000} height={640} fill="#0c0c0f" />
        <ellipse cx={f1(MX)} cy={f1(MY - 0.5 * HZ)} rx={330} ry={300} fill={`url(#${shade}-glow)`} />
        {/* Contact shadow under the trunk. */}
        <ellipse cx={f1(MX + 6)} cy={f1(MY + 38)} rx={AU * 0.95} ry={30} fill="#000" opacity={0.55} />

        {/* ——— The block (drag it sideways to turn it) ——— */}
        <g
          style={{ cursor: 'grab', touchAction: 'none' }}
          onPointerDown={onRotDown}
          onPointerMove={onRotMove}
          onPointerUp={onRotUp}
          onPointerCancel={onRotUp}
          onClickCapture={(e) => {
            if (rot.current?.moved) e.stopPropagation();
          }}
        >
          <path d={poly(bodyHull)} fill={`url(#${shade}-w)`} opacity={0.55} />
          <path d={poly(bodyHull)} fill="url(#w7-mesench)" opacity={0.5} />
          <path d={poly(bodyHull)} fill={`url(#${shade}-rim)`} />
          <path d={poly(ring3(V, bodyAt(0), 0, 48))} fill="#241620" opacity={0.7} stroke={P.skin} strokeWidth={1.6} strokeOpacity={0.5} />
          <Layer V={V} S={S} z0={0} z1={S.zc} shade={shade} ids={{ gut: S.gut }} />
          {/* The section plane, and on it what it cuts. */}
          <g pointerEvents="none">
            <path d={poly(plane)} fill="rgba(235,240,255,0.16)" />
            {cut.cav.map((p, i) => (
              <path key={`c${i}`} d={poly(ring3(V, p.e, S.zc))} fill={p.fill} opacity={Math.min(1, p.o + 0.3)} />
            ))}
            {cut.solids.map((p, i) => (
              <path key={`s${i}`} d={poly(ring3(V, p.e, S.zc))} fill={p.fill} opacity={p.o} />
            ))}
          </g>
          <Layer V={V} S={S} z0={S.zc} z1={1} shade={shade} ids={{ gut: S.gut }} />
          <path d={poly(plane)} fill="none" stroke="#f4f7ff" strokeWidth={2.4} opacity={0.95} pointerEvents="none" />
          {/* The cut edge of the body wall at the top: thick tissue, skin outside. */}
          <path d={poly(ring3(V, bodyAt(1), 1, 48))} fill={P.wallDeep} fillOpacity={0.16} stroke={P.skin} strokeWidth={2.2} strokeOpacity={0.75} />
          <path d={poly(ring3(V, scale(bodyAt(1), 0.9), 1, 48))} fill="none" stroke="rgba(255,190,200,0.25)" strokeWidth={1.2} />
          <path d={poly(bodyHull)} fill="none" stroke={P.skin} strokeWidth={2} strokeOpacity={0.6} strokeLinejoin="round" />
        </g>

        {/* The communication through the canals. */}
        {flowOn &&
          sides.map((s) => (
            <g key={s} opacity={S.canal * (1 - sm(S.pom / 0.6))} pointerEvents="none">
              <path d={flowPath(s)} fill="none" stroke="#dff3ff" strokeWidth={2} strokeLinecap="round" opacity={0.35} />
              {reduced
                ? [0.2, 0.5, 0.8].map((k) => {
                    const q = P3(s * lerp(0.47, 0.4, k), -0.3, lerp(0.64, 0.3, k));
                    return <circle key={k} cx={f1(q[0])} cy={f1(q[1])} r={3.4} fill="#eef8ff" />;
                  })
                : [0, 0.8, 1.6].map((b) => (
                    <circle key={b} r={3.6} fill="#eef8ff">
                      <animateMotion dur="2.4s" begin={`${b}s`} repeatCount="indefinite" path={flowPath(s)} keyPoints="0;1;0" keyTimes="0;0.5;1" calcMode="linear" />
                    </circle>
                  ))}
            </g>
          ))}

        {/* Drag handle on the plane. */}
        <g style={{ cursor: 'ns-resize' }} onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}>
          <path d={poly(plane)} fill="none" stroke="transparent" strokeWidth={16} />
          <rect x={grip[0] - 13} y={grip[1] - 17} width={26} height={34} rx={9} fill="#f4f7ff" />
          <path d={`M${f1(grip[0] - 6)},${f1(grip[1] - 4)}L${f1(grip[0])},${f1(grip[1] - 11)}L${f1(grip[0] + 6)},${f1(grip[1] - 4)}M${f1(grip[0] - 6)},${f1(grip[1] + 4)}L${f1(grip[0])},${f1(grip[1] + 11)}L${f1(grip[0] + 6)},${f1(grip[1] + 4)}`} fill="none" stroke="#1a1d26" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
        </g>

        <Note x={392} y={50} size={12.5} tone="dim">
          Aurretik (aurreko pareta gardena) · ↔ arrastatu biratzeko
        </Note>
        <Note x={598} y={P3(0, 0, 0.7)[1]} size={13} tone="dim">
          toraxa
        </Note>
        <Note x={598} y={P3(0, 0, 0.22)[1]} size={13} tone="dim">
          abdomena
        </Note>

        {/* ——— The section at the plane ——— */}
        <Note x={SX} y={226} size={12.5} tone="dim">
          Zeharkako mozketa planoan · arrastatu planoa
        </Note>
        <Note x={SX} y={250} size={12.5} tone="dim">
          dortsala
        </Note>
        <Note x={SX} y={Math.round(SY + (here.rv + 0.13) * SR)} size={12.5} tone="dim">
          bentrala
        </Note>
        <path d={poly(ringF(here, 64))} fill={P.wall} />
        <path d={poly(ringF(here, 64))} fill="url(#w7-mesench)" />
        <path d={poly(ringF(here, 64))} fill={`url(#${shade}-sec)`} />
        <path d={poly(ringF(here, 64))} fill="none" stroke={P.skin} strokeWidth={5} opacity={0.95} />
        {/* Back: the somites either side, the spinal cord with its canal, the notochord in the forming vertebra, the aorta. */}
        <g pointerEvents="none">
          {sides.map((s) => (
            <g key={s}>
              <ellipse cx={f1(SX + s * 0.3 * SR)} cy={f1(SY - 0.72 * SR)} rx={0.13 * SR} ry={0.1 * SR} fill="#a84a5c" opacity={0.75} />
              <ellipse cx={f1(SX + s * 0.3 * SR)} cy={f1(SY - 0.72 * SR)} rx={0.13 * SR} ry={0.1 * SR} fill="url(#w7-muscle)" opacity={0.7} />
            </g>
          ))}
        </g>
        <ellipse cx={SX} cy={f1(SY - 0.86 * SR)} rx={0.07 * SR} ry={0.065 * SR} fill="#6d7fe0" stroke="rgba(10,16,48,0.6)" strokeWidth={1} />
        <ellipse cx={SX} cy={f1(SY - 0.86 * SR)} rx={0.012 * SR} ry={0.035 * SR} fill="#0c1428" />
        <ellipse cx={SX} cy={f1(SY - 0.72 * SR)} rx={0.15 * SR} ry={0.1 * SR} fill={P.bone} opacity={0.85} />
        <circle cx={SX} cy={f1(SY - 0.72 * SR)} r={0.03 * SR} fill="#dfe9ff" opacity={0.9} />
        <circle cx={SX} cy={f1(SY - 0.58 * SR)} r={0.05 * SR} fill={P.aorta} stroke="#7a0f1e" strokeWidth={1} />
        {cut.cav.map((p, i) => (
          <Part key={`fc${i}`} id={p.id}>
            <path d={poly(ringF(p.e))} fill={P.space} />
            <path d={poly(ringF(p.e))} fill={p.fill} opacity={p.o} />
            {/* The serous lining of the cavity. */}
            <path d={poly(ringF(p.e))} fill="none" stroke="rgba(255,236,240,0.55)" strokeWidth={1.2} />
          </Part>
        ))}
        {S.zc < ZB && S.zc > 0.08 && (
          <path d={`M${SX},${f1(SY - 0.66 * SR)}L${SX},${f1(SY + (SH.stomach(S.zc, S)?.cv ?? -0.1) * SR)}`} stroke={P.serosa} strokeWidth={5} opacity={0.8} />
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
        <path d={poly(ringF(here, 64))} fill="none" stroke="#f4f7ff" strokeWidth={2} opacity={0.85} />

        {/* Colour key: the same colour for the same cavity in every view of the topic. */}
        <g fontSize={13.5} fill="rgba(244,247,255,0.96)" style={{ paintOrder: 'stroke' }} stroke="rgba(11,12,15,0.9)" strokeWidth={3}>
          {[
            { k: S.one > 0.5 ? COL.coelom : c.upper, t: S.one > 0.5 ? 'zeloma' : S.ppm > 0.5 ? 'perikardioa' : 'hasierako perikardioa' },
            ...(S.ppm > 0.5 || S.lung > 0.3 ? [{ k: c.side, t: 'pleura' }] : []),
            ...(S.one > 0.5 ? [] : [{ k: c.lower, t: 'peritoneoa' }]),
            { k: COL.septum, t: 'septuma' },
          ].map((r, i) => (
            <g key={r.t} transform={`translate(${712} ${518 + i * 21})`}>
              <rect x={0} y={-6} width={14} height={12} rx={3} fill={r.k} opacity={0.85} />
              <text x={20} y={4}>
                {r.t}
              </text>
            </g>
          ))}
        </g>

        {script.notes.map((n, i) => (
          <Note key={i} x={500} y={612} tone="accent" show={Math.min(n.a <= 0 ? 1 : seg(t, n.a, n.a + 0.03), 1 - seg(t, n.b - 0.03, n.b))}>
            {n.text}
          </Note>
        ))}

        {/* Names: left of the block; the midline ones above the section. */}
        <Label id={upperName} x={236} y={150} {...A3(-0.3, 0.42, 0.78)} />
        <Label id="pleura-barrunbea" x={236} y={196} {...A3(-0.62, -0.32, 0.84)} show={S.one > 0.5 ? 0 : S.ppm} />
        <Label id={S.lung < 0.75 ? 'birika-hastapenak' : 'birikak'} x={236} y={244} ax={lungR ? P3(lungR.cu - lungR.ru * 0.6, lungR.cv, 0.72)[0] : 0} ay={lungR ? P3(lungR.cu, lungR.cv, 0.72)[1] : 0} show={lungR ? 1 : 0} />
        <Label id="mintz-pleuroperikardikoak" x={236} y={292} {...A3(-0.62, -0.02, 0.6)} show={S.ppm > 0.02 ? 1 : 0} small />
        <Label id="erreten-perikardioperitonealak" x={236} y={348} {...A3(-0.44, -0.4, 0.47)} show={S.one > 0.5 || S.pom > 0.9 ? 0 : 1} small />
        <Label id="septum-transversum" x={236} y={394} {...A3(-0.5, 0.55, ZS)} show={S.sep > 0.15 ? 1 : 0} />
        <Label id="mintz-pleuroperitonealak" x={236} y={438} {...A3(-0.54, -0.4, 0.47)} show={S.pom > 0.05 ? 1 : 0} small />
        <Label id="peritoneo-barrunbea" x={236} y={496} {...A3(-0.62, 0.3, 0.26)} show={S.one > 0.5 ? 0 : 1} />
        <Label id="enbrioi-barruko-zeloma" x={236} y={496} {...A3(-0.62, 0.3, 0.26)} show={S.one > 0.5 ? 1 : 0} />
        <Label id={S.gut} x={600} y={92} {...A3(0.04, -0.38, 0.97)} />
        <Label id="hestegorri-inguruko-mesenkima" x={600} y={128} {...A3(0.14, -0.3, 0.92)} small />
        <Label id="bihotza" x={600} y={170} {...A3(0.22, 0.32, 0.72)} />
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
