'use client';

import { seg } from '@/lib/sim/anim';
import { FC, type ForePose } from './foregut-model';

/**
 * Topic 14's live transverse section (the notes' figures p3 A/B and p5 A/B), drawn beside the 3D and computed
 * from the same pose, so as the stomach turns in 3D the section turns with it, and the omental bursa, the
 * ligaments and Winslow's foramen appear where and when the 3D makes them.
 *
 * Orientation as the notes draw it: dorsal UP, ventral down, the embryo's RIGHT on the viewer's left. Two
 * levels: `stomach` (stomach, dorsal mesogastrium with the spleen, liver, lesser omentum, falciform, bursa) and
 * `duodenum` (duodenum on its mesoduodenum, the pancreatic buds, fusion with the posterior wall).
 *
 * Section units: the body is about 2 units across; (0, 0) near its centre, x to the viewer's right (the
 * embryo's left), y down (ventral).
 */

type Pt = readonly [number, number];
export type SectionLevel = 'stomach' | 'duodenum' | 'early';

/** The early section (stage 5, the embryo frame): what the gut pose shows of the peritoneum and the mesos. */
export interface EarlySection {
  cavity: number;
  visceral: number;
  meso: number;
  ventral: number;
  retro: number;
}

/** The inset's box in the 3D view's 1000 × 640 frame: bottom left, under the left name column. */
export const SECTION_BOX = { x: 12, y: 340, w: 344, h: 268 } as const;
/** The left name column's room while the section shows (it ends above the inset). */
export const SECTION_LEFT: [number, number] = [120, 318];

const K = 110;
const CX = SECTION_BOX.x + SECTION_BOX.w / 2;
const CY = SECTION_BOX.y + 142;
const X = (p: Pt) => CX + p[0] * K;
const Y = (p: Pt) => CY + p[1] * K;
const f1 = (n: number) => n.toFixed(1);
const xy = (p: Pt) => `${f1(X(p))},${f1(Y(p))}`;

const add = (a: Pt, b: Pt): Pt => [a[0] + b[0], a[1] + b[1]];
const mul = (a: Pt, k: number): Pt => [a[0] * k, a[1] * k];
const mix = (a: Pt, b: Pt, k: number): Pt => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k];
const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);
/** Turned clockwise on screen (y down) by `deg`. */
const rot = (p: Pt, deg: number): Pt => {
  const r = (deg * Math.PI) / 180;
  return [p[0] * Math.cos(r) - p[1] * Math.sin(r), p[0] * Math.sin(r) + p[1] * Math.cos(r)];
};

const poly = (pts: readonly Pt[], close = true) => `M${pts.map(xy).join('L')}${close ? 'Z' : ''}`;
/** A quadratic curve through a control point, sampled. */
const quad = (a: Pt, c: Pt, b: Pt, n = 16): Pt[] => Array.from({ length: n + 1 }, (_, i) => mix(mix(a, c, i / n), mix(c, b, i / n), i / n));
/** Points of an ellipse (centre, half-axes along u and v). */
const ell = (c: Pt, u: Pt, v: Pt, a0: number, a1: number, n = 28): Pt[] =>
  Array.from({ length: n + 1 }, (_, i) => {
    const a = a0 + ((a1 - a0) * i) / n;
    return add(c, add(mul(u, Math.cos(a)), mul(v, Math.sin(a))));
  });

const C = {
  panel: 'rgba(12,10,16,0.86)',
  edge: 'rgba(255,255,255,0.14)',
  body: '#4a4450',
  bodyEdge: '#6d6676',
  cavity: '#1b1a22',
  parietal: '#ff6b45',
  vertebra: '#ddd5c4',
  cord: '#9fb2d6',
  aorta: '#e04a4a',
  ivc: '#5b7fd6',
};

/** Where the peritoneal cavity's back wall is (y) at x: the parietal peritoneum in front of aorta and kidneys. */
const CAV = { c: [0, 0.16] as Pt, rx: 0.86, ry: 0.62 };
const wallY = (x: number) => CAV.c[1] - CAV.ry * Math.sqrt(Math.max(0, 1 - (x / CAV.rx) ** 2));
/** The midline root of the dorsal mesos on the back wall. */
const ROOT: Pt = [0, wallY(0) + 0.01];

interface Label {
  id: string;
  text: string;
  at: Pt;
  dx?: number;
  dy?: number;
  anchor?: 'start' | 'middle' | 'end';
  /** Set in the inset's left or right margin, joined to its point by a short leader. */
  edge?: 'left' | 'right';
}

/** Corner-cutting (Chaikin) for a closed outline: soft edges for a space drawn from straight pieces. */
const soften = (pts: readonly Pt[], rounds = 2): Pt[] => {
  let ps = [...pts];
  for (let r = 0; r < rounds; r++) {
    const out: Pt[] = [];
    for (let i = 0; i < ps.length; i++) {
      const a = ps[i];
      const b = ps[(i + 1) % ps.length];
      out.push(mix(a, b, 0.25), mix(a, b, 0.75));
    }
    ps = out;
  }
  return ps;
};

/** The section at a pose. `lit`: the step's lit ids (the rest faded), as in the 3D. */
export function ForeSection({ pose, level, lit, show, early }: { pose: ForePose; level: SectionLevel; lit: readonly string[] | null; show: number; early?: EarlySection }) {
  if (show <= 0.01) return null;
  const on = (...ids: string[]) => !lit || ids.some((id) => lit.includes(id));
  const op = (...ids: string[]) => (on(...ids) ? 1 : 0.32);
  const labels: Label[] = [];
  const shapes: React.ReactNode[] = [];

  // ———— the body wall, the spine, the aorta and IVC, the kidneys (behind the parietal peritoneum) ————
  const back = (
    <g key="back">
      <ellipse cx={X([0, -0.05])} cy={Y([0, -0.05])} rx={1.04 * K} ry={1.0 * K} fill={C.body} stroke={C.bodyEdge} strokeWidth={1.5} />
      <circle cx={X([0, -0.86])} cy={Y([0, -0.86])} r={0.07 * K} fill={C.cord} />
      <ellipse cx={X([0, -0.68])} cy={Y([0, -0.68])} rx={0.15 * K} ry={0.11 * K} fill={C.vertebra} opacity={0.85} />
      {[-1, 1].map((s) => (
        <ellipse key={s} cx={X([s * 0.43, -0.6])} cy={Y([s * 0.43, -0.6])} rx={0.16 * K} ry={0.1 * K} fill={FC.kidney} opacity={op('giltzurruna')} transform={`rotate(${s * -18} ${f1(X([s * 0.43, -0.6]))} ${f1(Y([s * 0.43, -0.6]))})`} />
      ))}
      <circle cx={X([0.03, -0.53])} cy={Y([0.03, -0.53])} r={0.055 * K} fill={C.aorta} opacity={op('aorta', 'aorta-dortsalak')} />
      <circle cx={X([-0.13, -0.53])} cy={Y([-0.13, -0.53])} r={0.05 * K} fill={C.ivc} opacity={op('beheko-kaba-zaina')} />
      <ellipse cx={X(CAV.c)} cy={Y(CAV.c)} rx={CAV.rx * K} ry={CAV.ry * K} fill={C.cavity} stroke={FC.parietal} strokeWidth={2.6} opacity={1} />
    </g>
  );
  shapes.push(back);
  if (level !== 'early') labels.push({ id: 'giltzurruna', text: 'Giltzurrunak', at: [0.6, -0.68], dx: 2, dy: -6, anchor: 'start' });
  labels.push({ id: 'paretako-peritoneoa', text: 'Paretako peritoneoa', at: [-0.7, 0.5], dy: 30, edge: 'left' });

  // A double line: two layers of peritoneum back to back (a meso, a ligament).
  const meso = (key: string, pts: readonly Pt[], color: string, o: number) => (
    <g key={key} opacity={o}>
      <path d={poly(pts, false)} fill="none" stroke={color} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" />
      <path d={poly(pts, false)} fill="none" stroke={C.cavity} strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round" />
    </g>
  );

  if (level === 'early' && early) {
    // ———— stage 5 (p1 C, p2): the peritoneal cavity lined by parietal peritoneum, the gut in its visceral
    // peritoneum, hung from the back wall by the two-layer dorsal mesentery; in front, the ventral mesogastrium
    // to the anterior wall; behind the parietal peritoneum, the retroperitoneal kidneys, aorta and IVC ————
    const cav = clamp01(early.cavity);
    shapes.push(<ellipse key="cavfill" cx={X(CAV.c)} cy={Y(CAV.c)} rx={CAV.rx * K} ry={CAV.ry * K} fill={FC.cavity} opacity={0.3 * cav * op('peritoneo-barrunbea')} />);
    labels.push({ id: 'peritoneo-barrunbea', text: 'Peritoneo barrunbea', at: [-0.42, 0.42], dy: 0, anchor: 'middle' });
    const gut: Pt = [0, 0.02];
    const r = 0.15;
    const MESO = ['mesenterio-dortsala', 'mesogastrio-dortsala', 'mesoduodeno-dortsala', 'mesenterioa', 'mesokolon-dortsala'];
    const ms = clamp01(early.meso);
    if (ms > 0.01) shapes.push(meso('emeso', [ROOT, mix(ROOT, gut, 0.5), [0, gut[1] - r]], FC.visceral, ms * op(...MESO)));
    labels.push({ id: 'mesenterio-dortsala', text: 'Mesenterio dortsala (bi orri)', at: mix(ROOT, gut, 0.45), dy: -8, edge: 'right' });
    const vm = clamp01(early.ventral);
    if (vm > 0.01) shapes.push(meso('event', [[0, gut[1] + r], [0, 0.45], [0, CAV.c[1] + CAV.ry - 0.01]], FC.septum, vm * op('mesogastrio-bentrala')));
    if (vm > 0.01) labels.push({ id: 'mesogastrio-bentrala', text: 'Aurreko mesogastrioa', at: [0, 0.5], dy: 4, edge: 'right' });
    const vi = clamp01(early.visceral);
    shapes.push(
      <g key="egut" opacity={op('aurreko-hestea', 'erdiko-hestea', 'atzeko-hestea', 'urdaila', 'errai-peritoneoa', ...MESO)}>
        <circle cx={X(gut)} cy={Y(gut)} r={r * K} fill={FC.fore} />
        <circle cx={X(gut)} cy={Y(gut)} r={r * 0.42 * K} fill={C.cavity} opacity={0.75} />
        <circle cx={X(gut)} cy={Y(gut)} r={(r + 0.025) * K} fill="none" stroke={FC.visceral} strokeWidth={2.4} opacity={vi} />
      </g>,
    );
    labels.push({ id: 'errai-peritoneoa', text: 'Errai peritoneoa', at: [r * 0.7, gut[1] + r * 0.7], dy: 26, edge: 'right' });
    const re = clamp01(early.retro);
    if (re > 0.01) {
      labels.push({ id: 'giltzurruna', text: 'Giltzurrunak', at: [-0.43, -0.6], dy: -22, edge: 'left' });
      labels.push({ id: 'aorta-dortsalak', text: 'Aorta', at: [0.03, -0.53], dy: -40, edge: 'right' });
      labels.push({ id: 'beheko-kaba-zaina', text: 'Beheko kaba zaina', at: [-0.13, -0.53], dy: 6, edge: 'left' });
    }
  } else if (level === 'stomach') {
    const rotL = clamp01(pose.rotL);
    const grow = clamp01(pose.grow);
    // Rotation 1 turns the section 90° (the original posterior wall to the left = the viewer's right); rotation 2
    // tilts the cut a little more; the stomach moves to the embryo's left as it turns.
    const th = 90 * rotL - 22 * clamp01(pose.rotAP) * rotL;
    const c: Pt = [0.3 * rotL, -0.04 + 0.06 * rotL];
    const a = 0.25 + 0.08 * grow;
    const b = 0.17;
    const d = rot([0, -1], th);
    const n = rot([1, 0], th);
    const G = add(c, mul(d, a));
    const L = add(c, mul(d, -a));

    // The liver (septum transversum mesoderm, ventral) moves to the embryo's right as the stomach turns.
    const lv = clamp01((pose.liver - 0.2) / 0.6);
    const lc: Pt = [-0.34 * rotL, 0.4 - 0.06 * rotL];
    const lu = rot([0.42 * (0.55 + 0.45 * lv), 0], -22 * rotL);
    const lvv = rot([0, 0.24 * (0.55 + 0.45 * lv)], -22 * rotL);
    const liverPts = ell(lc, lu, lvv, 0, Math.PI * 2, 40);
    const hilum = mix(lc, L, 0.42);
    const liverTop: Pt = [lc[0] + 0.12, lc[1] - 0.22 * (0.55 + 0.45 * lv)];

    // The dorsal mesogastrium from the midline to the greater curvature; the spleen grows between its layers and
    // the root slides towards the left kidney (the splenorenal ligament).
    const sp = clamp01(pose.spleen);
    const root: Pt = [ROOT[0] + 0.16 * sp, wallY(0.16 * sp) + 0.01];
    const S: Pt = [0.62, -0.24];
    const ctrl = mix(mix(root, G, 0.5), S, 0.25 + 0.75 * sp);
    const mesoLine = quad(root, ctrl, G, 22);

    // The omental bursa: the space closed by the meso, the stomach's back, the lesser omentum, the liver and the
    // back wall; its mouth (Winslow) is the gap between the liver and the wall at the right.
    const bursa = clamp01(pose.bursa) * rotL;
    if (bursa > 0.01) {
      const arcA = ell(c, mul(d, a), mul(n, b), 0, Math.PI, 18);
      const arcB = ell(c, mul(d, a), mul(n, b), 0, -Math.PI, 18);
      const meanY = (ps: Pt[]) => ps.reduce((s, p) => s + p[1], 0) / ps.length;
      const arc = meanY(arcA) < meanY(arcB) ? arcA : arcB;
      const wallAt = (x: number): Pt => [x, wallY(x) + 0.03];
      const mouthX = liverTop[0];
      const along = Array.from({ length: 9 }, (_, i) => wallAt(mix([mouthX, 0], [root[0], 0], i / 8)[0]));
      const region = [...mesoLine, ...arc, ...quad(L, mix(L, hilum, 0.5), hilum, 6), liverTop, wallAt(mouthX), ...along];
      shapes.push(<path key="bursa" d={poly(soften(region))} fill={FC.cavity} opacity={0.7 * bursa * op('poltsa-omentala')} />);
      const cen = region.reduce((acc, p) => add(acc, mul(p, 1 / region.length)), [0, 0] as Pt);
      labels.push({ id: 'poltsa-omentala', text: 'Poltsa omentala', at: cen, dx: -6, dy: 4, anchor: 'end' });
      const edge = clamp01(pose.edge);
      if (edge > 0.01) {
        const m0 = liverTop;
        const m1 = wallAt(mouthX);
        shapes.push(
          <g key="winslow" opacity={edge * op('winslow-hiatoa')}>
            <path d={poly([m0, m1], false)} stroke={FC.cavity} strokeWidth={2} strokeDasharray="3 3" fill="none" />
            <path d={`M${xy(mix(m0, m1, 0.5))}l-14,0`} stroke={FC.cavity} strokeWidth={1.6} fill="none" />
          </g>,
        );
        labels.push({ id: 'winslow-hiatoa', text: 'Winslow hiatoa', at: mix(m0, m1, 0.5), dy: -26, edge: 'left' });
      }
    }

    // Liver, lesser omentum (stomach ↔ liver) and falciform ligament (liver ↔ anterior wall).
    if (pose.liver > 0.05) {
      shapes.push(<path key="liver" d={poly(liverPts)} fill={FC.liver} stroke={FC.parietal} strokeWidth={1.6} opacity={op('gibela')} />);
      labels.push({ id: 'gibela', text: 'Gibela', at: lc, dx: -8, dy: 5, anchor: 'middle' });
    }
    const vm = clamp01(pose.vmeso);
    if (vm > 0.01) {
      shapes.push(meso('lesser', quad(L, mix(L, hilum, 0.5), hilum, 6), FC.septum, vm * op('epiploi-txikia', 'mesogastrio-bentrala', 'lotailu-gastroepatikoa', 'lotailu-duodenoepatikoa')));
      labels.push({ id: 'epiploi-txikia', text: 'Epiploi txikia', at: mix(L, hilum, 0.5), dy: 4, edge: 'left' });
      const fTop = add(lc, mul(lvv, 1));
      const fBot: Pt = [0, CAV.c[1] + CAV.ry - 0.01];
      shapes.push(meso('falc', [fTop, mix(fTop, fBot, 0.5), fBot], FC.septum, clamp01(pose.falc || vm) * op('lotailu-faltziformea', 'mesogastrio-bentrala')));
      labels.push({ id: 'lotailu-faltziformea', text: 'Lotailu faltziformea', at: mix(fTop, fBot, 0.55), dy: 14, edge: 'right' });
    }

    // The dorsal mesogastrium and the spleen in it.
    const ms = clamp01(pose.meso);
    if (ms > 0.01) {
      if (sp > 0.01) {
        const mid = mesoLine.reduce((best, p) => (Math.hypot(p[0] - S[0], p[1] - S[1]) < Math.hypot(best[0] - S[0], best[1] - S[1]) ? p : best), mesoLine[0]);
        const k = mesoLine.indexOf(mid);
        shapes.push(meso('splenorenal', mesoLine.slice(0, k + 1), FC.visceral, ms * op('lotailu-esplenoerrenala', 'mesogastrio-dortsala')));
        shapes.push(meso('gastrosplenic', mesoLine.slice(k), FC.visceral, ms * op('lotailu-gastroesplenikoa', 'mesogastrio-dortsala')));
        const sc = mid;
        shapes.push(
          <ellipse key="spleen" cx={X(sc)} cy={Y(sc)} rx={0.17 * sp * K} ry={0.1 * sp * K} fill={FC.spleen} stroke={FC.visceral} strokeWidth={1.6} opacity={op('barea')} transform={`rotate(-38 ${f1(X(sc))} ${f1(Y(sc))})`} />,
        );
        labels.push({ id: 'barea', text: 'Barea', at: sc, dy: -4, edge: 'right' });
        labels.push({ id: 'lotailu-esplenoerrenala', text: 'Lot. esplenoerrenala', at: mix(root, sc, 0.5), dy: -34, edge: 'right' });
        labels.push({ id: 'lotailu-gastroesplenikoa', text: 'Lot. gastroesplenikoa', at: mix(sc, G, 0.5), dy: 78, edge: 'right' });
      } else {
        shapes.push(meso('dmeso', mesoLine, FC.visceral, ms * op('mesogastrio-dortsala')));
      }
      labels.push({ id: 'mesogastrio-dortsala', text: 'Atzeko mesogastrioa', at: mesoLine[Math.round(mesoLine.length * 0.4)], dy: -22, edge: 'right' });
    }

    // The stomach: its original posterior wall (dark) and anterior wall (light), in its visceral peritoneum.
    const post = ell(c, mul(d, a), mul(n, b), -Math.PI / 2, Math.PI / 2, 22);
    const ant = ell(c, mul(d, a), mul(n, b), Math.PI / 2, (3 * Math.PI) / 2, 22);
    shapes.push(
      <g key="stomach" opacity={op('urdaila', 'makurdura-handia', 'makurdura-txikia')}>
        <path d={poly(post)} fill={FC.postWall} />
        <path d={poly(ant)} fill={FC.antWall} />
        <path d={poly(ell(c, mul(d, a + 0.022), mul(n, b + 0.022), 0, Math.PI * 2, 40))} fill="none" stroke={FC.visceral} strokeWidth={2} />
        <path d={poly(ell(c, mul(d, a * 0.45), mul(n, b * 0.4), 0, Math.PI * 2, 24))} fill={C.cavity} opacity={0.75} />
      </g>,
    );
    labels.push({ id: 'urdaila', text: 'Urdaila', at: [c[0], c[1] + Math.max(Math.abs(d[1]) * a, b) + 0.02], dx: 0, dy: 13, anchor: 'middle' });
  } else {
    // ———— duodenum level (p5 top A/B): the duodenum swings to the embryo's right on its mesoduodenum, the
    // ventral pancreatic bud goes round behind it to the dorsal one, and both fuse with the back wall ————
    const phi = 80 * clamp01(pose.duodRot);
    const dir = rot([0, 1], phi);
    const D = add(ROOT, mul(dir, 0.44));
    const fuse = clamp01(pose.fuse);
    // Retroperitoneal at the end: the parietal peritoneum now passes in front of the duodenum and pancreas.
    if (fuse > 0.01) {
      const wl: Pt = [D[0] - 0.22, wallY(D[0] - 0.22) + 0.02];
      const wr: Pt = [ROOT[0] + 0.1, wallY(ROOT[0] + 0.1) + 0.02];
      const front = add(D, mul(rot([0, 1], phi - 25), 0.2));
      const cover = [wl, ...quad(wl, front, wr, 18)];
      shapes.push(
        <g key="retro" opacity={fuse}>
          <path d={poly(cover)} fill={C.body} />
          <path d={poly(quad(wl, front, wr, 18), false)} fill="none" stroke={FC.parietal} strokeWidth={2.6} />
        </g>,
      );
    }
    shapes.push(meso('mesoduod', [ROOT, mix(ROOT, D, 0.5), D], FC.visceral, (1 - 0.85 * fuse) * op('mesoduodeno-dortsala', 'duodenoa')));
    labels.push({ id: 'mesoduodeno-dortsala', text: 'Mesoduodeno dortsala', at: mix(ROOT, D, 0.45), dy: 0, edge: 'right' });
    const pd = clamp01(pose.pancD);
    if (pd > 0.01) {
      const pc = mix(ROOT, D, 0.42);
      shapes.push(<ellipse key="pancD" cx={X(pc)} cy={Y(pc)} rx={0.12 * pd * K} ry={0.07 * pd * K} fill={FC.pancD} opacity={op('area', 'arearen-atzeko-hastapena', 'area-burua')} transform={`rotate(${f1(phi + 90)} ${f1(X(pc))} ${f1(Y(pc))})`} />);
      labels.push({ id: 'arearen-atzeko-hastapena', text: 'Atzeko hastapena', at: pc, dy: -30, edge: 'right' });
    }
    const pv = clamp01(pose.pancV);
    if (pv > 0.01) {
      // Round the embryo's right side (the viewer's left), from in front of the duodenum to behind it.
      const psi = 180 * (1 - clamp01(pose.pancRot));
      const toRoot = rot([0, -1], phi);
      const vc = add(D, mul(rot(toRoot, psi), 0.19 + 0.02 * (1 - clamp01(pose.pancRot))));
      shapes.push(<ellipse key="pancV" cx={X(vc)} cy={Y(vc)} rx={0.075 * pv * K} ry={0.058 * pv * K} fill={FC.pancV} opacity={op('area', 'arearen-aurreko-hastapena', 'apofisi-untziformea')} />);
      labels.push({ id: 'arearen-aurreko-hastapena', text: 'Aurreko hastapena', at: vc, dy: 34, edge: 'left' });
    }
    shapes.push(
      <g key="duod" opacity={op('duodenoa', 'duodenoaren-bigarren-atala', 'duodenoaren-lehen-atala')}>
        <circle cx={X(D)} cy={Y(D)} r={0.13 * K} fill={FC.fore} stroke={FC.visceral} strokeWidth={2} />
        <circle cx={X(D)} cy={Y(D)} r={0.055 * K} fill={C.cavity} opacity={0.75} />
      </g>,
    );
    labels.push({ id: 'duodenoa', text: fuse > 0.5 ? 'Duodenoa (peritoneo atzekoa)' : 'Duodenoa', at: D, dy: 52, edge: 'left' });
  }

  // Names: the lit ones, or all when the step lights nothing.
  const shown = labels.filter((l) => !lit || lit.includes(l.id));
  return (
    <g opacity={show} pointerEvents="none">
      <rect x={SECTION_BOX.x} y={SECTION_BOX.y} width={SECTION_BOX.w} height={SECTION_BOX.h} rx={12} fill={C.panel} stroke={C.edge} />
      <text x={SECTION_BOX.x + 12} y={SECTION_BOX.y + 19} className="note" style={{ fontSize: 13, fontWeight: 700, letterSpacing: 0.3 }} fill="#f4e6c8">
        ZEHARKAKO EBAKETA
      </text>
      <text x={SECTION_BOX.x + SECTION_BOX.w - 12} y={SECTION_BOX.y + 19} textAnchor="end" style={{ fontSize: 12 }} fill="#b8b0c4">
        bizkarra goian
      </text>
      <text x={SECTION_BOX.x + 10} y={SECTION_BOX.y + SECTION_BOX.h - 9} style={{ fontSize: 12, fontWeight: 600 }} fill="#b8b0c4">
        ◀ eskuina
      </text>
      <text x={SECTION_BOX.x + SECTION_BOX.w - 10} y={SECTION_BOX.y + SECTION_BOX.h - 9} textAnchor="end" style={{ fontSize: 12, fontWeight: 600 }} fill="#b8b0c4">
        ezkerra ▶
      </text>
      <svg x={SECTION_BOX.x + 2} y={SECTION_BOX.y + 22} width={SECTION_BOX.w - 4} height={SECTION_BOX.h - 38} viewBox={`${SECTION_BOX.x + 2} ${SECTION_BOX.y + 22} ${SECTION_BOX.w - 4} ${SECTION_BOX.h - 38}`} overflow="hidden">
        {shapes}
        {shown.map((l) => {
          const px = X(l.at);
          const py = Y(l.at);
          const ex = l.edge === 'left' ? SECTION_BOX.x + 10 : l.edge === 'right' ? SECTION_BOX.x + SECTION_BOX.w - 10 : px + (l.dx ?? 0);
          const ey = py + (l.dy ?? 0);
          return (
            <g key={l.id}>
              {l.edge && (
                // From the point to the name's inner end (bold 13.5 ≈ 7.6 units a letter).
                <path d={`M${f1(px)},${f1(py)}L${f1(l.edge === 'left' ? ex + l.text.length * 7.6 + 4 : ex - l.text.length * 7.6 - 4)},${f1(ey - 4.5)}`} stroke="#eee6f4" strokeOpacity={0.7} strokeWidth={1.2} fill="none" />
              )}
              {l.edge && <circle cx={px} cy={py} r={2.2} fill="#ffd27a" />}
          <text
            x={ex}
            y={ey}
            textAnchor={l.edge === 'left' ? 'start' : l.edge === 'right' ? 'end' : (l.anchor ?? 'middle')}
            style={{ fontSize: 13.5, fontWeight: 700, paintOrder: 'stroke', stroke: 'rgba(10,8,14,0.92)', strokeWidth: 3.6, strokeLinejoin: 'round' }}
            fill={lit && lit.includes(l.id) ? '#ffd27a' : '#eee6f4'}
          >
            {l.text}
          </text>
            </g>
          );
        })}
      </svg>
    </g>
  );
}

/**
 * The section's show over stage time: on for the listed steps (consecutive steps merged, so it never blinks
 * between them), fading in and out at the edges.
 */
export function sectionShow(S: readonly number[], steps: readonly number[], t: number) {
  let best = 0;
  const sorted = [...steps].sort((p, q) => p - q);
  for (let i = 0; i < sorted.length; i++) {
    let j = i;
    while (j + 1 < sorted.length && sorted[j + 1] === sorted[j] + 1) j++;
    const a = S[sorted[i]];
    const b = S[sorted[j] + 1] ?? 2;
    const v = Math.min(a <= 0 ? 1 : seg(t, a, a + 0.03), b >= 1.5 ? 1 : 1 - seg(t, b - 0.03, b));
    best = Math.max(best, v);
    i = j;
  }
  return best;
}
