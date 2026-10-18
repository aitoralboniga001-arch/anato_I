import { BufferAttribute, BufferGeometry, InstancedBufferAttribute, InstancedBufferGeometry } from 'three';
import type { Mesh } from '@/lib/three-d/mesh';
import type { Stream3 } from '@/lib/three-d/scene';

export function geometryOf(m: Mesh, stream?: Stream3) {
  const g = stream ? new InstancedBufferGeometry() : new BufferGeometry();
  g.setAttribute('position', new BufferAttribute(m.pos, 3));
  g.setAttribute('normal', new BufferAttribute(m.nrm, 3));
  g.setAttribute('uv', new BufferAttribute(m.uv, 2));
  g.setIndex(new BufferAttribute(m.idx, 1));
  if (stream && g instanceof InstancedBufferGeometry) {
    g.setAttribute('aCell', new InstancedBufferAttribute(stream.cells, 4));
    g.setAttribute('aGate', new InstancedBufferAttribute(stream.gates, 1));
    g.instanceCount = stream.gates.length;
  }
  return g;
}

/** Same-sized buffers: point at the new immutable mesh, never copy INTO a cached older pose. */
export function updateGeometry(g: BufferGeometry, mesh: Mesh) {
  let changed = false;
  for (const [name, data] of [['position', mesh.pos], ['normal', mesh.nrm], ['uv', mesh.uv]] as const) {
    const attr = g.getAttribute(name) as BufferAttribute;
    if (attr.array === data) continue;
    attr.array = data;
    attr.needsUpdate = true;
    changed = true;
  }
  if (g.index!.array !== mesh.idx) {
    g.index!.array = mesh.idx;
    g.index!.needsUpdate = true;
    changed = true;
  }
  return changed;
}
