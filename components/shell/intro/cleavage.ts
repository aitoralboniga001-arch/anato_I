/**
 * Geometry for the cleavage sequence (1. gaia, 4.3–4.4): zygote → 2 → 4 → 8 → morula (16) → blastocyst.
 * Pure functions of progress so the same drawing can be timed (intro) or scrubbed (landing).
 */

export interface Cell {
  x: number;
  y: number;
  rx: number;
  ry: number;
  /** Rotation in degrees. */
  rot: number;
  /** Pseudo depth, 0 (back) … 1 (front): drives draw order and shading. */
  z: number;
  /** Nucleus visibility 0..1. */
  nuc: number;
  /** Membrane contrast 0..1 (compaction blurs the borders between blastomeres). */
  rim: number;
  kind: 'blastomero' | 'trofoblasto' | 'enbrioblasto';
}

/** A dividing pair is drawn with a goo filter so the cleavage furrow reads as a pinch. */
export interface Frame {
  cells: Cell[];
  /** Pairs of indices into `cells` that are mid-division. */
  pairs: [number, number][];
  /** Inner radius of the zona pellucida; its opacity. */
  zonaR: number;
  zonaO: number;
  /** Blastocoel radius and opacity. */
  cavR: number;
  cavO: number;
  /** Pronuclei (zygote only): separation 0..1 and opacity. */
  pro: { sep: number; o: number };
}

export const ZONA = 132;

const R = [112, 68, 54, 43, 34];
const D = [0, 44, 38, 30, 24];

interface Node {
  x: number;
  y: number;
  r: number;
  z: number;
  axis: number;
  parent: number;
}

const hash = (n: number) => {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
};

function relax(nodes: Node[], inner: number) {
  for (let it = 0; it < 120; it++) {
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i];
        const b = nodes[j];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const d = Math.hypot(dx, dy) || 0.01;
        // Overlap allowed: cells are spheres seen in projection.
        const min = (a.r + b.r) * (nodes.length > 8 ? 0.7 : 0.84);
        if (d < min) {
          const p = (min - d) * 0.25;
          a.x -= (dx / d) * p;
          a.y -= (dy / d) * p;
          b.x += (dx / d) * p;
          b.y += (dy / d) * p;
        }
      }
    }
    for (const n of nodes) {
      const d = Math.hypot(n.x, n.y);
      const max = inner - n.r - 2;
      if (d > max) {
        n.x *= max / d;
        n.y *= max / d;
      }
    }
  }
}

/** Generation k (0..4) layouts, each child keeps the index of its parent in the previous generation. */
const GENS: Node[][] = (() => {
  const gens: Node[][] = [[{ x: 0, y: 0, r: R[0], z: 0.5, axis: -32, parent: -1 }]];
  for (let k = 1; k <= 4; k++) {
    const prev = gens[k - 1];
    const next: Node[] = [];
    prev.forEach((p, pi) => {
      // Cleavage planes rotate each round (meridional, then equatorial, then oblique).
      const axis = k === 1 ? -32 : k === 2 ? p.axis + 90 : p.axis + 45 + hash(pi + k * 7) * 50;
      const a = (axis * Math.PI) / 180;
      for (const s of [-1, 1]) {
        next.push({
          x: p.x + Math.cos(a) * D[k] * s,
          y: p.y + Math.sin(a) * D[k] * s,
          r: R[k],
          z: Math.min(1, Math.max(0, p.z + s * (k === 3 ? 0.35 : 0.18) + (hash(pi * 3 + k) - 0.5) * 0.3)),
          axis,
          parent: pi,
        });
      }
    });
    relax(next, ZONA);
    gens.push(next);
  }
  return gens;
})();

/** Blastocyst targets: outer cells flatten into the trophoblast ring, inner ones gather at one pole. */
const BLAST = (() => {
  const morula = GENS[4];
  const pole = { x: -0.68, y: -0.73 };
  const order = morula
    .map((c, i) => ({ i, d: (c.x / ZONA - pole.x * 0.5) ** 2 + (c.y / ZONA - pole.y * 0.5) ** 2 }))
    .sort((a, b) => a.d - b.d);
  const inner = new Set(order.slice(0, 5).map((o) => o.i));
  const ring = morula
    .map((c, i) => ({ i, ang: Math.atan2(c.y, c.x) }))
    .filter((o) => !inner.has(o.i))
    .sort((a, b) => a.ang - b.ang);
  const n = ring.length;
  const targets = new Map<number, { x: number; y: number; rx: number; ry: number; rot: number; kind: Cell['kind'] }>();
  const RB = 138;
  const off = ring[0].ang;
  ring.forEach((o, k) => {
    const ang = off + (k / n) * Math.PI * 2;
    targets.set(o.i, {
      x: Math.cos(ang) * (RB - 13),
      y: Math.sin(ang) * (RB - 13),
      rx: ((Math.PI * 2 * (RB - 13)) / n) * 0.62,
      ry: 11,
      rot: (ang * 180) / Math.PI + 90,
      kind: 'trofoblasto',
    });
  });
  const icm = [
    [0, 0],
    [-25, 16],
    [22, -14],
    [-8, -28],
    [26, 18],
  ];
  const c0 = { x: pole.x * 72, y: pole.y * 72 };
  [...inner].forEach((i, k) => {
    targets.set(i, { x: c0.x + icm[k][0], y: c0.y + icm[k][1], rx: 23, ry: 21, rot: k * 40, kind: 'enbrioblasto' });
  });
  return { targets, RB };
})();

const clamp = (v: number) => Math.min(1, Math.max(0, v));
const ease = (v: number) => {
  const x = clamp(v);
  return x < 0.5 ? 4 * x * x * x : 1 - (-2 * x + 2) ** 3 / 2;
};
const mix = (a: number, b: number, t: number) => a + (b - a) * t;
const mixAng = (a: number, b: number, t: number) => {
  const d = ((((b - a) % 360) + 540) % 360) - 180;
  return a + d * t;
};

const toCell = (n: Node, nuc = 1): Cell => ({ x: n.x, y: n.y, rx: n.r, ry: n.r, rot: n.axis, z: n.z, nuc, rim: 1, kind: 'blastomero' });

/**
 * Progress p in 0..6:
 *  0..1  zygote (pronuclei meet)
 *  1..2  first cleavage, 2..3 second, 3..4 third, 4..5 fourth (morula)
 *  5..6  compaction and cavitation (blastocyst)
 * `wobble` (seconds) adds a faint living jitter.
 */
export function cleavageFrame(p: number, wobble = 0): Frame {
  const base: Frame = { cells: [], pairs: [], zonaR: ZONA, zonaO: 1, cavR: 0, cavO: 0, pro: { sep: 0, o: 0 } };

  if (p < 1) {
    const u = clamp(p);
    base.cells = [toCell(GENS[0][0], 0)];
    base.pro = { sep: 1 - ease(u / 0.85), o: 1 - clamp((u - 0.85) / 0.15) };
  } else if (p < 5) {
    const k = Math.floor(p);
    const u = p - k;
    const prev = GENS[k - 1];
    const next = GENS[k];
    // Prophase: the parent elongates and its nucleus fades; then the furrow pinches the daughters apart.
    const grow = ease(u / 0.3);
    const split = ease((u - 0.22) / 0.78);
    if (split <= 0) {
      base.cells = prev.map((n) => {
        const c = toCell(n, 1 - grow);
        const a = (next.find((m) => m.parent === prev.indexOf(n))?.axis ?? n.axis) as number;
        c.rot = a;
        c.rx = n.r * (1 + 0.1 * grow);
        c.ry = n.r * (1 - 0.05 * grow);
        return c;
      });
    } else {
      next.forEach((n, idx) => {
        const par = prev[n.parent];
        const r0 = par.r * 0.92;
        // Daughters start overlapping inside the elongated parent, so the silhouette is continuous.
        const a = (n.axis * Math.PI) / 180;
        const s0 = (idx % 2 ? 1 : -1) * par.r * 0.16;
        base.cells.push({
          x: mix(par.x + Math.cos(a) * s0, n.x, split),
          y: mix(par.y + Math.sin(a) * s0, n.y, split),
          rx: mix(r0, n.r, split),
          ry: mix(r0, n.r, split),
          rot: n.axis,
          z: mix(par.z, n.z, split),
          nuc: clamp((split - 0.7) / 0.3),
          rim: 1,
          kind: 'blastomero',
        });
      });
      if (split < 0.97) for (let i = 0; i < next.length; i += 2) base.pairs.push([i, i + 1]);
    }
  } else {
    const u = clamp(p - 5);
    const compact = ease(u / 0.35);
    const cav = ease((u - 0.3) / 0.7);
    base.cells = GENS[4].map((n, i) => {
      const t = BLAST.targets.get(i)!;
      const cx = n.x * (1 - 0.06 * compact);
      const cy = n.y * (1 - 0.06 * compact);
      const r = n.r * (1 + 0.1 * compact);
      return {
        x: mix(cx, t.x, cav),
        y: mix(cy, t.y, cav),
        rx: mix(r, t.rx, cav),
        ry: mix(r, t.ry, cav),
        rot: mixAng(n.axis, t.rot, cav),
        z: t.kind === 'trofoblasto' ? mix(n.z, 0.5, cav) : mix(n.z, 0.8, cav),
        nuc: 1,
        rim: mix(1, 0.35, compact) + 0.55 * cav,
        kind: cav > 0.5 ? t.kind : 'blastomero',
      };
    });
    base.zonaR = mix(ZONA, BLAST.RB + 6, cav);
    base.zonaO = 1 - cav;
    base.cavR = mix(20, BLAST.RB - 22, cav);
    base.cavO = clamp(cav * 1.4);
  }

  if (wobble) {
    base.cells.forEach((c, i) => {
      c.x += Math.sin(wobble * 1.3 + i * 1.7) * 0.7;
      c.y += Math.cos(wobble * 1.1 + i * 2.3) * 0.7;
    });
  }
  return base;
}

/** Caption for each phase, as in the notes. */
export function cleavageStep(p: number): { name: string; day: string } {
  if (p < 1) return { name: 'Zigotoa', day: '0. eguna' };
  if (p < 2) return { name: 'Segmentazioa · 2 blastomero', day: '1.–3. egunak' };
  if (p < 3) return { name: 'Segmentazioa · 4 blastomero', day: '1.–3. egunak' };
  if (p < 4) return { name: 'Segmentazioa · 8 blastomero', day: '1.–3. egunak' };
  if (p < 5) return { name: 'Morula · 16 zelula inguru', day: '3. eguna' };
  return { name: 'Blastozistoa', day: '4.–5. egunak' };
}
