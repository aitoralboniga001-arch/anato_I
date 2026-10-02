import type { NarrationKind, NarrationOptions, NarrationSegment } from '@/lib/sim/narration';

export interface NarrationRequest extends NarrationOptions { week: number; stage: string; kind: NarrationKind }
export type AudioStatus = 'idle' | 'loading' | 'playing' | 'paused' | 'observing' | 'done' | 'error';
export interface AudioSnapshot { status: AudioStatus; text: string; focus: string[]; segment: number; count: number; fraction: number; error: string }
const initial = (): AudioSnapshot => ({ status: 'idle', text: '', focus: [], segment: 0, count: 1, fraction: 0, error: '' });

/** One owned audio session. Cancellation rejects stale fetches; pause preserves the exact sample. */
export class NarrationTransport {
  key = '';
  private audio: HTMLAudioElement | null = null;
  private abort: AbortController | null = null;
  private generation = 0;
  private cache = new Map<string, Blob>();
  private pending = new Map<string, Promise<Blob>>();
  private playAttempt = 0;
  private url: string | null = null;
  private request: NarrationRequest | null = null;
  private segments: NarrationSegment[] = [];
  private paused = false;
  private speed = 1;
  private observation = 0;
  private state = initial();
  constructor(private readonly changed: (snapshot: AudioSnapshot) => void) {}
  private emit(patch: Partial<AudioSnapshot>) { this.state = { ...this.state, ...patch }; this.changed(this.state); }
  snapshot() {
    return { ...this.state, fraction: this.audio && Number.isFinite(this.audio.duration) && this.audio.duration > 0 ? this.audio.currentTime / this.audio.duration : this.state.fraction };
  }
  start(key: string, request: NarrationRequest, segments: NarrationSegment[], speed: number) {
    this.cancel(); this.key = key; this.request = request; this.segments = segments; this.speed = speed; this.abort = new AbortController();
    this.state = { ...initial(), count: segments.length };
    if (!segments.length) { this.emit({ status: 'error', error: 'Ez dago azalpenik urrats honetan.' }); return; }
    void this.load(0);
  }
  private releaseAudio() {
    if (this.audio) { this.audio.pause(); this.audio.onended = null; this.audio.onerror = null; this.audio.removeAttribute('src'); this.audio.load(); this.audio = null; }
    if (this.url) { URL.revokeObjectURL(this.url); this.url = null; }
  }
  private cacheClip(key: string, blob: Blob) {
    this.cache.set(key, blob);
    while (this.cache.size > 16) this.cache.delete(this.cache.keys().next().value!);
  }
  private fetchClip(key: string, generation: number, signal: AbortSignal): Promise<Blob> {
    const cached = this.cache.get(key);
    if (cached) return Promise.resolve(cached);
    const existing = this.pending.get(key);
    if (existing) return existing;
    const promise = (async () => {
      const response = await fetch('/api/narration', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: key, signal });
      if (!response.ok) throw new Error(response.status === 503 ? 'Ahotsa ez dago erabilgarri oraindik.' : response.status === 429 ? 'Ahotsaren muga gainditu da. Saiatu geroago.' : 'Ezin izan da audioa erreproduzitu. Saiatu berriro.');
      const blob = await response.blob();
      if (!blob.size || !blob.type.startsWith('audio/')) throw new Error('Ezin izan da audioa kargatu.');
      if (generation === this.generation) this.cacheClip(key, blob);
      return blob;
    })();
    this.pending.set(key, promise);
    void promise.finally(() => { if (this.pending.get(key) === promise) this.pending.delete(key); }).catch(() => {});
    return promise;
  }
  private async preload(segment: number, generation: number, signal: AbortSignal) {
    if (segment >= this.segments.length) return;
    try {
      await this.fetchClip(JSON.stringify({ ...this.request!, segment }), generation, signal);
    } catch { /* Active loading reports errors; speculative preloading can fail quietly. */ }
  }
  private async playAudio(audio: HTMLAudioElement, generation: number) {
    const attempt = ++this.playAttempt;
    try {
      await audio.play();
      if (generation !== this.generation || attempt !== this.playAttempt || this.audio !== audio) return;
      if (this.paused) { audio.pause(); this.emit({ status: 'paused' }); }
      else this.emit({ status: 'playing' });
    } catch {
      if (generation !== this.generation || attempt !== this.playAttempt || this.audio !== audio) return;
      if (this.paused) this.emit({ status: 'paused' });
      else this.emit({ status: 'error', error: 'Sakatu berriro ahotsa hasteko.' });
    }
  }
  private async load(segment: number) {
    this.releaseAudio();
    const generation = this.generation;
    const abort = this.abort!;
    const request = { ...this.request!, segment };
    this.emit({ status: 'loading', segment, fraction: 0, text: this.segments[segment].text, focus: this.segments[segment].focus });
    try {
      const blob = await this.fetchClip(JSON.stringify(request), generation, abort.signal);
      if (generation !== this.generation) return;
      this.url = URL.createObjectURL(blob);
      const audio = new Audio(this.url); this.audio = audio; audio.playbackRate = this.speed;
      void this.preload(segment + 1, generation, abort.signal);
      audio.onended = () => {
        if (generation !== this.generation) return;
        if (segment + 1 < this.segments.length) void this.load(segment + 1);
        else { this.observation = 0; this.emit({ status: 'observing', fraction: 1 }); }
      };
      audio.onerror = () => { if (generation === this.generation) this.emit({ status: 'error', error: 'Ezin izan da audioa erreproduzitu. Saiatu berriro.' }); };
      if (this.paused) this.emit({ status: 'paused' });
      else await this.playAudio(audio, generation);
    } catch (error) {
      if (generation === this.generation && !abort.signal.aborted) this.emit({ status: 'error', error: error instanceof Error ? error.message : 'Ahotsak huts egin du.' });
    }
  }
  tick(dt: number) {
    if (!this.paused && this.state.status === 'observing') {
      this.observation += dt;
      if (this.observation >= 1.5) this.emit({ status: 'done' });
    }
  }
  pause() {
    this.paused = true; this.playAttempt++; this.audio?.pause();
    if (this.audio && (this.state.status === 'playing' || this.state.status === 'loading' || this.state.status === 'paused')) this.emit({ status: 'paused' });
  }
  resume() {
    this.paused = false;
    if (this.audio && this.state.status === 'paused') void this.playAudio(this.audio, this.generation);
  }
  setSpeed(speed: number) { this.speed = speed; if (this.audio) this.audio.playbackRate = speed; }
  cancel() { this.generation++; this.playAttempt++; this.pending.clear(); this.abort?.abort(); this.abort = null; this.releaseAudio(); this.key = ''; this.paused = false; this.state = initial(); }
  dispose() { this.cancel(); this.cache.clear(); }
}
