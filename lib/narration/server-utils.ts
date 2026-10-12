/** Bounded server utilities; no credentials or environment values in this module. */
export class NarrationError extends Error {
  constructor(public readonly code: string, public readonly status: number, message: string) {
    super(message);
  }
}

/** Browser origin check, not authentication. The ingress must preserve public Host. */
export function isSameOriginNarrationRequest(request: Request): boolean {
  if (request.headers.get('sec-fetch-site') === 'cross-site') return false;
  const origin = request.headers.get('origin');
  if (!origin) return false;
  try {
    const incoming = new URL(origin);
    // Reject opaque origins, paths, credentials and lists rather than normalizing them.
    if (!['http:', 'https:'].includes(incoming.protocol) || incoming.origin !== origin) return false;
    const internal = new URL(request.url);
    const forwardedProtocol = request.headers.get('x-forwarded-proto');
    if (forwardedProtocol !== null && !['http', 'https'].includes(forwardedProtocol)) return false;
    const protocol = forwardedProtocol ? `${forwardedProtocol}:` : internal.protocol;
    const host = request.headers.get('host') ?? internal.host;
    if (!host || /[\s,@/?#\\]/.test(host)) return false;
    const publicOrigin = new URL(`${protocol}//${host}`);
    return publicOrigin.host !== '' && incoming.origin === publicOrigin.origin;
  } catch { return false; }
}

export interface NarrationRequest {
  week: number;
  stage: string;
  kind: 'intro' | 'beat' | 'structure' | 'bridge';
  beat?: number;
  structure?: string;
  view?: string;
  segment?: number;
}

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const isId = (v: unknown): v is string => typeof v === 'string' && /^[a-z0-9][a-z0-9-]{0,99}$/.test(v);
/** The highest topic number the course has (this module takes no imports: keep in step with the registry). */
const MAX_WEEK = 11;

const isIndex = (v: unknown): v is number => Number.isInteger(v) && Number(v) >= 0 && Number(v) <= 999;

/** Arbitrary text, model settings and unknown fields are deliberately not accepted. */
export function parseNarrationRequest(value: unknown): NarrationRequest {
  const bad = () => new NarrationError('INVALID_REQUEST', 400, 'Narrazioaren identifikatzaileak ez dira baliozkoak.');
  if (!isRecord(value)) throw bad();
  const allowed = ['week', 'stage', 'kind', 'beat', 'structure', 'view', 'segment'];
  if (Object.keys(value).some(k => !allowed.includes(k))) throw bad();
  if (!Number.isInteger(value.week) || Number(value.week) < 1 || Number(value.week) > MAX_WEEK || !isId(value.stage)) throw bad();
  if (typeof value.kind !== 'string' || !['intro', 'beat', 'structure', 'bridge'].includes(value.kind)) throw bad();
  if (value.segment !== undefined && !isIndex(value.segment)) throw bad();
  if (value.beat !== undefined && !isIndex(value.beat)) throw bad();
  if (value.structure !== undefined && !isId(value.structure)) throw bad();
  if (value.view !== undefined && !isId(value.view)) throw bad();
  if (value.kind === 'beat' && value.beat === undefined) throw bad();
  if (value.kind !== 'beat' && value.beat !== undefined) throw bad();
  if (value.kind === 'structure' && value.structure === undefined) throw bad();
  if (value.kind !== 'structure' && value.structure !== undefined) throw bad();
  if (value.kind === 'bridge' && value.view === undefined) throw bad();
  return value as unknown as NarrationRequest;
}

/** Read only up to maxBytes, including requests without a Content-Length header. */
export async function readBoundedBody(request: Request | Response, maxBytes: number): Promise<string> {
  const length = request.headers.get('content-length');
  if (length && (!/^\d+$/.test(length) || Number(length) > maxBytes)) throw new NarrationError('BODY_TOO_LARGE', 413, 'Eskaera handiegia da.');
  const reader = request.body?.getReader();
  if (!reader) return '';
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > maxBytes) {
        await reader.cancel();
        throw new NarrationError('BODY_TOO_LARGE', 413, 'Eskaera handiegia da.');
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  return Buffer.concat(chunks).toString('utf8');
}

/** Gemini documents little-endian signed 16-bit PCM despite the audio/l16 MIME name. */
export function audioToWav(encoded: string, mimeType: string): Buffer {
  if (!encoded || encoded.length > 12_000_000 || !/^[A-Za-z0-9+/]+={0,2}$/.test(encoded) || encoded.length % 4 !== 0) {
    throw new NarrationError('INVALID_AUDIO', 502, 'Ahots-zerbitzuaren audioa ez da baliozkoa.');
  }
  const bytes = Buffer.from(encoded, 'base64');
  const mime = mimeType.toLowerCase();
  if (mime.split(';')[0].trim() === 'audio/wav' || mime.split(';')[0].trim() === 'audio/x-wav') {
    if (bytes.length < 44 || bytes.toString('ascii', 0, 4) !== 'RIFF' || bytes.toString('ascii', 8, 12) !== 'WAVE') {
      throw new NarrationError('INVALID_AUDIO', 502, 'Ahots-zerbitzuaren audioa ez da baliozkoa.');
    }
    return bytes;
  }
  if (!/^audio\/(l16|pcm)(;|$)/.test(mime) || bytes.length < 2 || bytes.length % 2 !== 0) {
    throw new NarrationError('INVALID_AUDIO', 502, 'Ahots-zerbitzuaren audio-formatua ez da bateragarria.');
  }
  const rate = Number(mime.match(/(?:rate|samplerate)=(\d+)/)?.[1] ?? 24000);
  if (!Number.isInteger(rate) || rate < 8000 || rate > 48000 || /channels=(?!1(?:;|$))/.test(mime)) {
    throw new NarrationError('INVALID_AUDIO', 502, 'Ahots-zerbitzuaren audio-formatua ez da bateragarria.');
  }
  const wav = Buffer.alloc(44 + bytes.length);
  wav.write('RIFF', 0); wav.writeUInt32LE(36 + bytes.length, 4); wav.write('WAVEfmt ', 8);
  wav.writeUInt32LE(16, 16); wav.writeUInt16LE(1, 20); wav.writeUInt16LE(1, 22);
  wav.writeUInt32LE(rate, 24); wav.writeUInt32LE(rate * 2, 28);
  wav.writeUInt16LE(2, 32); wav.writeUInt16LE(16, 34); wav.write('data', 36);
  wav.writeUInt32LE(bytes.length, 40); bytes.copy(wav, 44);
  return wav;
}

/** LRU entries are bounded by count, bytes and lifetime. In-flight calls are shared. */
export class AudioCache {
  private entries = new Map<string, { audio: Buffer; at: number }>();
  private flights = new Map<string, Promise<Buffer>>();
  private bytes = 0;
  constructor(private readonly maxBytes = 48 * 1024 * 1024, private readonly maxEntries = 240, private readonly ttlMs = 12 * 60 * 60_000) {}

  private remove(key: string) {
    const entry = this.entries.get(key);
    if (entry) this.bytes -= entry.audio.length;
    this.entries.delete(key);
  }

  async obtain(key: string, generate: () => Promise<Buffer>): Promise<Buffer> {
    const hit = this.entries.get(key);
    if (hit && Date.now() - hit.at < this.ttlMs) {
      this.entries.delete(key); this.entries.set(key, hit);
      return hit.audio;
    }
    if (hit) this.remove(key);
    const pending = this.flights.get(key);
    if (pending) return pending;
    if (this.flights.size >= 4) throw new NarrationError('BUSY', 429, 'Ahots-zerbitzua lanpetuta dago. Saiatu berriro une batean.');
    const promise = Promise.resolve().then(generate).then(audio => {
      if (audio.length <= this.maxBytes) {
        while (this.entries.size >= this.maxEntries || this.bytes + audio.length > this.maxBytes) this.remove(this.entries.keys().next().value!);
        this.entries.set(key, { audio, at: Date.now() }); this.bytes += audio.length;
      }
      return audio;
    }).finally(() => this.flights.delete(key));
    this.flights.set(key, promise);
    return promise;
  }
}

/** Bounded fixed windows; limits apply per running server instance. */
export class RequestBudget {
  private windows = new Map<string, { at: number; expires: number; count: number }>();
  constructor(private readonly maxKeys = 1000) {}
  allow(key: string, max: number, windowMs: number): boolean {
    const now = Date.now();
    const hit = this.windows.get(key);
    if (hit && now - hit.at < windowMs) {
      if (hit.count >= max) return false;
      hit.count++; return true;
    }
    if (!hit && this.windows.size >= this.maxKeys) {
      for (const [id, window] of this.windows) if (now >= window.expires) this.windows.delete(id);
      if (this.windows.size >= this.maxKeys) return false;
    }
    this.windows.set(key, { at: now, expires: now + windowMs, count: 1 });
    return true;
  }
}
