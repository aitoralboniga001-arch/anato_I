import { apply4, dot, mulM, norm, type Camera3, type M4, type V3, type View3 } from './math';
import type { Mesh } from './mesh';

/**
 * How a tissue looks in 3D. The same kinds as the 2D tissue library, so a muscle mass or a cartilage
 * model reads the same in a drawing and in a 3D view.
 */
export type Tissue3 = 'skin' | 'muscle' | 'mesenchyme' | 'cartilage' | 'bone' | 'membrane' | 'tendon' | 'nerve' | 'vessel' | 'epithelium' | 'neural';

export const TISSUE_KIND: Record<Tissue3, number> = {
  skin: 0,
  muscle: 1,
  mesenchyme: 2,
  cartilage: 3,
  bone: 4,
  membrane: 5,
  tendon: 6,
  nerve: 7,
  vessel: 8,
  epithelium: 9,
  neural: 10,
};

/**
 * A kite-shaped window on a dome, seen from the clip origin: centre direction `c`, unit tangents `u`
 * (towards `front`) and `v`; extents in tangent units (unit sphere). Sizes 0 = closed.
 */
export interface Hole3 {
  c: V3;
  u: V3;
  v: V3;
  front: number;
  back: number;
  side: number;
}

/**
 * Cut an item without rebuilding its mesh (the shader discards, the pointing shape drops the same
 * triangles), in object space, by direction from `o`: `grow` keeps only a cap round `dir` (a bone
 * spreading from its ossification centre, `spicules` streaks its growing edge), `holes` cut windows
 * out (fontanelles), `keep` keeps only inside one window (the fontanelle's own membrane).
 */
export interface Clip3 {
  o: V3;
  grow?: { dir: V3; cos: number; spicules?: number };
  holes?: Hole3[];
  keep?: Hole3;
}

const inKite = (h: Hole3, q: V3) => {
  if (h.front < 1e-4 || h.side < 1e-4 || dot(q, h.c) < 0.3) return false;
  const a = dot(q, h.u);
  const b = Math.abs(dot(q, h.v));
  return (a > 0 ? a / h.front : -a / Math.max(1e-4, h.back)) + b / h.side < 1;
};

/** Whether a point (object space) is cut away. */
export function clipped(c: Clip3, p: V3): boolean {
  const q = norm([p[0] - c.o[0], p[1] - c.o[1], p[2] - c.o[2]]);
  if (c.grow && dot(q, c.grow.dir) < c.grow.cos) return true;
  if (c.holes) for (const h of c.holes) if (inKite(h, q)) return true;
  if (c.keep && !inKite(c.keep, q)) return true;
  return false;
}

export interface Item3 {
  /** Stable identity (the WebGL layer keeps the buffers of a key while its mesh object stays the same). */
  key: string;
  /** Structure id: the item is pointable and named like a <Part>. Omit for unnamed context (the body). */
  id?: string;
  groups?: string[];
  /** Background tissue that never glows (like <Part quiet>). */
  quiet?: boolean;
  mesh: Mesh;
  /** Coarser mesh for pointing and the flat fallback (defaults to `mesh`). */
  hit?: Mesh;
  /** Model matrix (column-major), default identity. */
  matrix?: M4;
  color: string;
  /** Colour of the shaded side (defaults to a darker `color`). */
  deep?: string;
  tissue?: Tissue3;
  /** 0..1, multiplies with `show`. */
  opacity?: number;
  /** 0..1 stage-driven visibility (like <Part show>). */
  show?: number;
  /** Dark contour around the silhouette (default on). */
  outline?: boolean;
  clip?: Clip3;
}

export interface Scene3 {
  camera: Camera3;
  items: Item3[];
  /** Key light direction in camera space (x right, y up, z towards the viewer). */
  light?: V3;
}

export const KEY_LIGHT: V3 = norm([-0.5, 0.7, 0.55]);

export interface Projected {
  /** Front-facing triangles as one SVG path (frame units), for pointing. */
  d: string;
  /** The same triangles split by how lit they are (3 bands), for the flat fallback. */
  bands: [string, string, string];
  /** Mean depth (larger = farther), for painting back to front. */
  depth: number;
  any: boolean;
}

const f1 = (v: number) => (Math.round(v * 10) / 10).toString();

/** Project an item's coarse mesh: its visible triangles and how lit each is. */
export function projectItem(item: Item3, v: View3, light: V3): Projected {
  const mesh = item.hit ?? item.mesh;
  const m = item.matrix ? mulM(v.vp, item.matrix) : v.vp;
  const mv = item.matrix ? mulM(v.view, item.matrix) : v.view;
  const n = mesh.pos.length / 3;
  const sx = new Float32Array(n);
  const sy = new Float32Array(n);
  const ok = new Uint8Array(n);
  let depth = 0;
  for (let i = 0; i < n; i++) {
    const p: V3 = [mesh.pos[i * 3], mesh.pos[i * 3 + 1], mesh.pos[i * 3 + 2]];
    const [x, y, z, w] = apply4(m, p);
    if (w <= 0.01) continue;
    ok[i] = 1;
    sx[i] = (x / w) * 0.5 * 1000 + 500;
    sy[i] = 320 - (y / w) * 0.5 * 640;
    depth += z / w;
  }
  // Clipped vertices (the same test the shader makes per pixel).
  let cut: Uint8Array | null = null;
  if (item.clip) {
    cut = new Uint8Array(n);
    for (let i = 0; i < n; i++) cut[i] = clipped(item.clip, [mesh.pos[i * 3], mesh.pos[i * 3 + 1], mesh.pos[i * 3 + 2]]) ? 1 : 0;
  }
  const parts: string[] = [];
  const bands: [string[], string[], string[]] = [[], [], []];
  for (let t = 0; t < mesh.idx.length; t += 3) {
    const a = mesh.idx[t];
    const b = mesh.idx[t + 1];
    const c = mesh.idx[t + 2];
    if (!ok[a] || !ok[b] || !ok[c]) continue;
    if (cut && (cut[a] || cut[b] || cut[c])) continue;
    // Counter-clockwise in WebGL (y up) is clockwise in the frame (y down): negative area = facing us.
    const area = (sx[b] - sx[a]) * (sy[c] - sy[a]) - (sx[c] - sx[a]) * (sy[b] - sy[a]);
    if (area >= 0) continue;
    const tri = `M${f1(sx[a])},${f1(sy[a])}L${f1(sx[b])},${f1(sy[b])}L${f1(sx[c])},${f1(sy[c])}Z`;
    parts.push(tri);
    // Lit band from the face normal in camera space.
    const nx = mesh.nrm[a * 3] + mesh.nrm[b * 3] + mesh.nrm[c * 3];
    const ny = mesh.nrm[a * 3 + 1] + mesh.nrm[b * 3 + 1] + mesh.nrm[c * 3 + 1];
    const nz = mesh.nrm[a * 3 + 2] + mesh.nrm[b * 3 + 2] + mesh.nrm[c * 3 + 2];
    const vn = norm([mv[0] * nx + mv[4] * ny + mv[8] * nz, mv[1] * nx + mv[5] * ny + mv[9] * nz, mv[2] * nx + mv[6] * ny + mv[10] * nz]);
    const k = dot(vn, light);
    bands[k > 0.45 ? 2 : k > 0 ? 1 : 0].push(tri);
  }
  return { d: parts.join(''), bands: [bands[0].join(''), bands[1].join(''), bands[2].join('')], depth: depth / Math.max(1, n), any: parts.length > 0 };
}
