import { frames, type Mesh, type TubeOptions } from '@/lib/three-d/mesh';
import { cachedMesh, cachedTube, Sig } from '@/lib/three-d/mesh-cache';
import type { V3 } from '@/lib/three-d/math';
import { perfCount } from '@/lib/perf';

/** Topic 10 changes tube radii frequently. Keep path frames and layout, not mutable pose buffers. */
type Plan = { fr: ReturnType<typeof frames>; bend: V3[] };
const plans = new Map<string, Plan>();
function planOf(path: readonly V3[], ref: V3) {
  const key = new Sig().pts(path).pts([ref]).key();
  const known = plans.get(key);
  if (known) { plans.delete(key); plans.set(key, known); return known; }
  const fr = frames(path, ref);
  const bend = fr.map((_, i): V3 => {
    const a = fr[Math.max(0, i - 1)], b = fr[Math.min(fr.length - 1, i + 1)];
    const ds = Math.hypot(b.p[0] - a.p[0], b.p[1] - a.p[1], b.p[2] - a.p[2]);
    const inv = 1 / ds;
    return ds > 1e-9 ? [(b.t[0] - a.t[0]) * inv, (b.t[1] - a.t[1]) * inv, (b.t[2] - a.t[2]) * inv] : [0, 0, 0];
  });
  const plan = { fr, bend };
  if (plans.size >= 128) plans.delete(plans.keys().next().value!);
  plans.set(key, plan);
  perfCount('heartTubePlan');
  return plan;
}

type Layout = {
  uv: Float32Array; idx: Uint32Array; cs: number[]; sn: number[];
  q: Int32Array; table: Int32Array; group: Int32Array; acc: Float64Array; bytes: number;
};
const layouts = new Map<string, Layout>();
let layoutBytes = 0;
function layoutOf(n: number, sides: number, from: number, to: number, start: boolean, end: boolean): Layout {
  const whole = to - from >= Math.PI * 2 - 1e-6;
  const cols = whole ? sides : sides + 1;
  const key = `${n}/${sides}/${from}/${to}/${+start}/${+end}`;
  const known = layouts.get(key);
  if (known) { layouts.delete(key); layouts.set(key, known); return known; }
  const rows = n + (start ? 4 : 0) + (end ? 4 : 0), count = rows * cols;
  const uv = new Float32Array(count * 2);
  const cs: number[] = [], sn: number[] = [];
  for (let j = 0; j < cols; j++) {
    const angle = from + ((to - from) * j) / sides;
    cs.push(Math.cos(angle)); sn.push(Math.sin(angle));
  }
  for (let i = 0; i < rows; i++) for (let j = 0; j < cols; j++) {
    const body = i - (start ? 4 : 0);
    uv[(i * cols + j) * 2] = Math.max(0, Math.min(1, body / (n - 1)));
    uv[(i * cols + j) * 2 + 1] = j / sides;
  }
  const idx = new Uint32Array((rows - 1) * (whole ? cols : cols - 1) * 6);
  let at = 0;
  for (let i = 0; i < rows - 1; i++) for (let j = 0; j < (whole ? cols : cols - 1); j++) {
    const j1 = (j + 1) % cols, a = i * cols + j, b = i * cols + j1, c = (i + 1) * cols + j, d = (i + 1) * cols + j1;
    idx.set([a, b, c, b, d, c], at); at += 6;
  }
  let size = 1; while (size < count * 2) size <<= 1;
  const q = new Int32Array(count * 3), table = new Int32Array(size), group = new Int32Array(count), acc = new Float64Array(count * 3);
  const bytes = uv.byteLength + idx.byteLength + q.byteLength + table.byteLength + group.byteLength + acc.byteLength + cols * 16;
  const layout = { uv, idx, cs, sn, q, table, group, acc, bytes };
  layouts.set(key, layout); layoutBytes += bytes;
  for (const [oldKey, old] of layouts) {
    if (layoutBytes <= 2 * 1024 * 1024 || oldKey === key) break;
    layouts.delete(oldKey); layoutBytes -= old.bytes;
  }
  perfCount('heartTubeLayout');
  return layout;
}

/** Same Float32 triangle accumulation and 1e-4 weld grid as mesh.ts, without per-face vectors. */
function normals(p: Float32Array, l: Layout) {
  const n = new Float32Array(p.length), { idx, q, table, group, acc } = l;
  for (let i = 0; i < idx.length; i += 3) {
    const a = idx[i] * 3, b = idx[i + 1] * 3, c = idx[i + 2] * 3;
    const x = p[b] - p[a], y = p[b + 1] - p[a + 1], z = p[b + 2] - p[a + 2];
    const u = p[c] - p[a], v = p[c + 1] - p[a + 1], w = p[c + 2] - p[a + 2];
    const nx = y * w - z * v, ny = z * u - x * w, nz = x * v - y * u;
    n[a] += nx; n[a + 1] += ny; n[a + 2] += nz;
    n[b] += nx; n[b + 1] += ny; n[b + 2] += nz;
    n[c] += nx; n[c + 1] += ny; n[c + 2] += nz;
  }
  for (let i = 0; i < p.length; i++) q[i] = Math.round(p[i] * 1e4);
  table.fill(-1); acc.fill(0);
  for (let vertex = 0; vertex < p.length / 3; vertex++) {
    const i = vertex * 3;
    let h = (Math.imul(q[i], 73856093) ^ Math.imul(q[i + 1], 19349663) ^ Math.imul(q[i + 2], 83492791)) & (table.length - 1);
    for (;;) {
      const w = table[h];
      if (w < 0) { table[h] = vertex; group[vertex] = vertex; break; }
      if (q[w * 3] === q[i] && q[w * 3 + 1] === q[i + 1] && q[w * 3 + 2] === q[i + 2]) { group[vertex] = w; break; }
      h = (h + 1) & (table.length - 1);
    }
    const g = group[vertex] * 3;
    acc[g] += n[i]; acc[g + 1] += n[i + 1]; acc[g + 2] += n[i + 2];
  }
  for (let vertex = 0; vertex < p.length / 3; vertex++) {
    const i = vertex * 3, g = group[vertex] * 3;
    if (i === g) {
      const length = Math.hypot(acc[g], acc[g + 1], acc[g + 2]) || 1;
      n[i] = acc[g] / length; n[i + 1] = acc[g + 1] / length; n[i + 2] = acc[g + 2] / length;
    } else { n[i] = n[g]; n[i + 1] = n[g + 1]; n[i + 2] = n[g + 2]; }
  }
  return n;
}

/** Immutable, exact tube meshes. Only Topic 10 opts in; arbitrary around-functions use the reference. */
export function heartTube(path: readonly V3[], o: TubeOptions): Mesh {
  if (o.around || path.length < 2) return cachedTube(path, o);
  const radii = path.map((_, i) => o.radius(i / (path.length - 1)));
  const sides = o.sides ?? 18, from = o.from ?? -Math.PI, to = o.to ?? Math.PI;
  const whole = to - from >= Math.PI * 2 - 1e-6;
  const start = !!o.capStart && whole, end = !!o.capEnd && whole;
  const deps = [path.length, ...path.flat(), ...radii, ...o.ref, sides, from, to, +start, +end];
  return cachedMesh('topic10 tube', deps, () => {
    const { fr, bend } = planOf(path, o.ref);
    const layout = layoutOf(path.length, sides, from, to, start, end);
    const p = new Float32Array(layout.uv.length / 2 * 3);
    let offset = 0;
    const ring = (i: number, scale: number, push: number) => {
      const f = fr[i], kv = bend[i], r = radii[i] * scale;
      for (let j = 0; j < layout.cs.length; j++) {
        const c = layout.cs[j] * r, s = layout.sn[j] * r;
        let dx = f.n[0] * c + f.b[0] * s, dy = f.n[1] * c + f.b[1] * s, dz = f.n[2] * c + f.b[2] * s;
        const x = dx * kv[0] + dy * kv[1] + dz * kv[2];
        if (x > 0.7) { const k = (0.7 + 0.25 * Math.tanh((x - 0.7) / 0.25)) / x; dx *= k; dy *= k; dz *= k; }
        p[offset++] = (f.p[0] + dx) + f.t[0] * push;
        p[offset++] = (f.p[1] + dy) + f.t[1] * push;
        p[offset++] = (f.p[2] + dz) + f.t[2] * push;
      }
    };
    if (start) for (let c = 4; c >= 1; c--) {
      const th = c / 4 * (Math.PI / 2); ring(0, Math.cos(th), -Math.sin(th) * radii[0]);
    }
    for (let i = 0; i < fr.length; i++) ring(i, 1, 0);
    if (end) for (let c = 1; c <= 4; c++) {
      const th = c / 4 * (Math.PI / 2); ring(fr.length - 1, Math.max(0.02, Math.cos(th)), Math.sin(th) * radii[radii.length - 1]);
    }
    perfCount('meshBuild'); perfCount('heartTubeBuild');
    return { pos: p, nrm: normals(p, layout), uv: layout.uv, idx: layout.idx };
  });
}
