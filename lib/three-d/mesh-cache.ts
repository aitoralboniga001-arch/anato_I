import { perfCount } from '@/lib/perf';
import type { V3 } from './math';
import { blob, merge, tube, type BlobOptions, type Mesh, type TubeOptions } from './mesh';

/**
 * Meshes kept by what they are built from. A model rebuilt for every frame (a played stage) asks for the
 * same shape again most of the time: only the colours or the highlights changed. Asked through here, an
 * unchanged shape returns the very same mesh object, so nothing downstream redoes its work either: the
 * WebGL layer skips the upload and the SVG layer reuses its projection (both keyed on mesh identity).
 *
 * The key is a fingerprint of every number the builder reads (the path's points, the radius at every
 * ring, the options), exact to the last bit, so a cached mesh is always the mesh the builder would make.
 * Bounded by size: the least recently asked-for meshes go first.
 */

const BUDGET = 24 * 1024 * 1024;

const f64 = new Float64Array(1);
const u32 = new Uint32Array(f64.buffer);

/** Two independent 32-bit hashes over the exact bits of the numbers, plus how many went in. */
export class Sig {
  private a = 0x811c9dc5;
  private b = 0x9747b28c;
  private n = 0;
  private word(w: number) {
    this.a = Math.imul(this.a ^ w, 0x01000193);
    this.b = Math.imul(this.b ^ w, 0x5bd1e995);
    this.b ^= this.b >>> 15;
    this.n++;
  }
  num(x: number) {
    f64[0] = x;
    this.word(u32[0]);
    this.word(u32[1]);
    return this;
  }
  pts(ps: readonly V3[]) {
    for (const p of ps) this.num(p[0]).num(p[1]).num(p[2]);
    return this.num(ps.length);
  }
  str(s: string) {
    for (let i = 0; i < s.length; i++) this.word(s.charCodeAt(i));
    return this.num(s.length);
  }
  key() {
    return `${(this.a >>> 0).toString(36)}.${(this.b >>> 0).toString(36)}.${this.n}`;
  }
}

const store = new Map<string, Mesh>();
let bytes = 0;
const sizeOf = (m: Mesh) => m.pos.byteLength + m.nrm.byteLength + m.uv.byteLength + m.idx.byteLength;

function cached(key: string, build: () => Mesh): Mesh {
  const hit = store.get(key);
  if (hit) {
    // Most recently used last.
    store.delete(key);
    store.set(key, hit);
    perfCount('meshCacheHit');
    return hit;
  }
  perfCount('meshCacheMiss');
  const m = build();
  store.set(key, m);
  bytes += sizeOf(m);
  for (const [k, old] of store) {
    if (bytes <= BUDGET || k === key) break;
    store.delete(k);
    bytes -= sizeOf(old);
  }
  return m;
}

/** `tube`, but the same inputs give the same mesh. A tube squashed `around` is built fresh (not fingerprinted). */
export function cachedTube(path: readonly V3[], o: TubeOptions): Mesh {
  if (o.around) return tube(path, o);
  const s = new Sig().str('tube').pts(path);
  // The builder reads the radius at each ring's u (and at 0 and 1 for the caps): exactly these.
  const n = path.length;
  for (let i = 0; i < n; i++) s.num(o.radius(n > 1 ? i / (n - 1) : 0));
  s.num(o.radius(0)).num(o.radius(1));
  s.num(o.ref[0]).num(o.ref[1]).num(o.ref[2]);
  s.num(o.from ?? -Math.PI).num(o.to ?? Math.PI).num(o.sides ?? 18).num(o.capStart ? 1 : 0).num(o.capEnd ? 1 : 0);
  return cached(s.key(), () => tube(path, o));
}

/**
 * `blob`, but the same inputs give the same mesh. A `shape` function cannot be fingerprinted: pass
 * `shapeId`, a name that changes whenever the function would (or the blob is built fresh).
 */
export function cachedBlob(o: BlobOptions, shapeId?: string): Mesh {
  if (o.shape && !shapeId) return blob(o);
  const s = new Sig().str('blob').pts([o.center, o.radii, ...(o.axes ?? [])]);
  s.num(o.rings ?? 18).num(o.sides ?? 24).str(shapeId ?? '');
  return cached(s.key(), () => blob(o));
}

const ids = new WeakMap<Mesh, number>();
let nextId = 1;
const idOf = (m: Mesh) => {
  let i = ids.get(m);
  if (!i) ids.set(m, (i = nextId++));
  return i;
};

/** `merge`, but merging the same mesh objects again gives the same merged mesh. */
export function cachedMerge(ms: readonly Mesh[]): Mesh {
  const s = new Sig().str('merge');
  for (const m of ms) s.num(idOf(m));
  return cached(s.key(), () => merge(ms));
}

/**
 * Any other mesh, cached on what the caller says it depends on: `deps` must name every number the build
 * reads (and `kind` the builder and its call site).
 */
export function cachedMesh(kind: string, deps: readonly number[], build: () => Mesh): Mesh {
  const s = new Sig().str(kind);
  for (const d of deps) s.num(d);
  return cached(s.key(), build);
}

/** For tests: forget everything. */
export function clearMeshCache() {
  store.clear();
  bytes = 0;
}
