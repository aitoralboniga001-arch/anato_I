import { afterEach, describe, expect, it, vi } from 'vitest';

afterEach(() => { vi.unstubAllGlobals(); vi.resetModules(); vi.doUnmock('@/lib/three-d/offthread'); });

describe('geometry worker lifetime', () => {
  it('releases duplicate worker caches after every pending mesh arrives; later views can start a new worker', async () => {
    const adoptGeo = vi.fn(), buildIdle = vi.fn();
    vi.doMock('@/lib/three-d/offthread', () => ({ adoptGeo, buildIdle, geoReady: () => false, setGeoRequester: vi.fn() }));
    const workers: FakeWorker[] = [];
    class FakeWorker {
      onmessage?: (e: { data: object }) => void;
      onerror?: () => void;
      postMessage = vi.fn();
      terminate = vi.fn();
      constructor() { workers.push(this); }
    }
    vi.stubGlobal('window', {});
    vi.stubGlobal('Worker', FakeWorker);
    const { warmGeo } = await import('@/lib/three-d/geo-client');
    expect(workers).toHaveLength(0);
    warmGeo(['one', 'two']); warmGeo(['one']);
    expect(workers).toHaveLength(1);
    expect(workers[0].postMessage).toHaveBeenCalledTimes(2);
    workers[0].onmessage!({ data: { key: 'one', data: 1 } });
    expect(workers[0].terminate).not.toHaveBeenCalled();
    workers[0].onmessage!({ data: { key: 'two', data: 2 } });
    expect(adoptGeo.mock.calls).toEqual([['one', 1], ['two', 2]]);
    expect(workers[0].terminate).toHaveBeenCalledOnce();
    warmGeo(['three']);
    expect(workers).toHaveLength(2);
    workers[0].onerror!(); // A late event from a terminated worker cannot damage the new batch.
    expect(buildIdle).not.toHaveBeenCalled();
    workers[1].onerror!();
    expect(buildIdle).toHaveBeenCalledExactlyOnceWith('three');
    warmGeo(['four']);
    expect(workers).toHaveLength(2);
    expect(buildIdle).toHaveBeenLastCalledWith('four');
  });
});
