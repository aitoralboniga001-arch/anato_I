/// <reference lib="webworker" />
// Builds the 3D views' geometry off the main thread (see offthread.ts): the same modules register
// their slots here, and each request is answered with the built (cloneable) value.
import './geo-registry';
import { buildForTransfer } from './offthread';

self.onmessage = (e: MessageEvent<{ key: string }>) => {
  const { key } = e.data;
  try {
    self.postMessage({ key, data: buildForTransfer(key) });
  } catch (err) {
    self.postMessage({ key, error: String(err) });
  }
};
