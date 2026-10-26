import { describe, expect, it, vi } from 'vitest';
import { edgesFor, type EdgeNames } from '@/components/kit/three/Stage3D';
import { registerPublication } from '@/components/kit/three/publication';
import { viewOf, type V3 } from '@/lib/three-d/math';

const names: EdgeNames = { up: 'Kraneala', down: 'Kaudala', front: 'Bentrala', back: 'Dortsala', side: 'Ezkerra', otherSide: 'Eskuina' };
const edges = (eye: V3) => edgesFor(viewOf({ eye, target: [0, 0, 0], fov: 30 }).view, names, [1, 0, 0], {});

describe('anatomical frame directions', () => {
  it('shows dorsal on the left and ventral on the right when seen from the embryo right', () => {
    expect(edges([-6, 0, 0])).toEqual({ top: 'Kraneala', bottom: 'Kaudala', left: 'Dortsala', right: 'Bentrala' });
  });
  it('reverses the depth directions when seen from the embryo left', () => {
    expect(edges([6, 0, 0])).toEqual({ top: 'Kraneala', bottom: 'Kaudala', left: 'Bentrala', right: 'Dortsala' });
  });
  it('shows the embryo right at screen left in the frontal view', () => {
    expect(edges([0, 0, 6])).toEqual({ top: 'Kraneala', bottom: 'Kaudala', left: 'Eskuina', right: 'Ezkerra' });
  });
});

describe('paused 3D frame ownership', () => {
  const entry = () => ({ orient: edges([-6, 0, 0]), look: { names, facing: 'otherSide' } });

  it('republishes the same camera to replacement callbacks after a viewport reset', () => {
    const value = entry();
    const list: ReturnType<typeof entry>[] = [];
    const oldCallback = vi.fn();
    const release = registerPublication(list, value, false, oldCallback);
    expect(oldCallback).toHaveBeenLastCalledWith(value);
    release();
    const newCallback = vi.fn();
    registerPublication(list, value, false, newCallback);
    expect(newCallback).toHaveBeenCalledExactlyOnceWith(value);
    expect(newCallback.mock.calls[0][0].orient.left).toBe('Dortsala');
  });

  it('keeps a fading ghost from replacing the live view and restores the remaining owner', () => {
    const list: ReturnType<typeof entry>[] = [];
    const current = entry();
    const ghost = entry();
    const publish = vi.fn();
    const release = registerPublication(list, current, false, publish);
    publish.mockClear();
    const releaseGhost = registerPublication(list, ghost, true, publish);
    expect(publish).not.toHaveBeenCalled();
    release();
    expect(publish).toHaveBeenLastCalledWith(ghost);
    releaseGhost();
    expect(publish).toHaveBeenLastCalledWith(null);
    expect(list).toEqual([]);
  });

  it('does not clear the newest owner when an older view leaves', () => {
    const list: ReturnType<typeof entry>[] = [];
    const publish = vi.fn();
    const releaseOld = registerPublication(list, entry(), false, publish);
    const current = entry();
    registerPublication(list, current, false, publish);
    publish.mockClear();
    releaseOld();
    expect(publish).not.toHaveBeenCalled();
    expect(list).toEqual([current]);
  });
});
