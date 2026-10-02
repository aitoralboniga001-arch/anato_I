import 'server-only';
import { createHash } from 'node:crypto';
import { getWeek, structures } from '@/content/registry';
import { getNarrationSegments } from '@/lib/sim/narration';
import manifest from '@/public/narration/manifest.json';
import { NarrationError, type NarrationRequest } from './server-utils';

export interface NarrationAsset { url: string; durationMs: number; bytes: number }

export function validNarrationAsset(value: unknown): value is NarrationAsset {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const asset = value as Record<string, unknown>;
  return typeof asset.url === 'string' && /^\/narration\/audio\/[a-f0-9]{64}\.mp3$/.test(asset.url)
    && Number.isSafeInteger(asset.durationMs) && Number(asset.durationMs) > 0
    && Number.isSafeInteger(asset.bytes) && Number(asset.bytes) > 0;
}

export const narrationConfigured = () => manifest.version === 1
  && typeof manifest.provider === 'string' && !!manifest.provider
  && typeof manifest.voice === 'string' && !!manifest.voice
  && Object.keys(manifest.entries).length > 0
  && Object.values(manifest.entries).every(validNarrationAsset);

export const narrationProvider = () => manifest.provider;

export function resolveNarrationText(input: NarrationRequest): string {
  const week = getWeek(input.week);
  const stage = week?.stages.find(s => s.id === input.stage);
  const missing = () => new NarrationError('CONTENT_NOT_FOUND', 404, 'Narrazio-zatia ez da aurkitu.');
  if (!week || !stage) throw missing();
  if (input.beat !== undefined && !stage.beats[input.beat]) throw missing();
  if (input.structure !== undefined && (!stage.structures.includes(input.structure) || !structures.has(input.structure))) throw missing();
  if (input.view !== undefined && !stage.views.some(v => v.id === input.view)) throw missing();
  const segments = getNarrationSegments(week, stage, input.kind, input);
  const text = segments[input.segment ?? 0]?.text;
  if (!text?.trim() || text.length > 1600) throw missing();
  return text;
}


/** Resolve an existing immutable clip; listening never calls a speech provider. */
export function getNarrationAsset(input: NarrationRequest): NarrationAsset {
  const text = resolveNarrationText(input);
  if (!narrationConfigured()) throw new NarrationError('NOT_CONFIGURED', 503, 'Ahotsaren audioak ez daude erabilgarri oraindik.');
  const hash = createHash('sha256').update(text, 'utf8').digest('hex');
  const asset: unknown = (manifest.entries as Record<string, unknown>)[hash];
  if (!validNarrationAsset(asset)) throw new NarrationError('AUDIO_NOT_FOUND', 404, 'Narrazio-zatiaren audioa ez da aurkitu.');
  return asset;
}
