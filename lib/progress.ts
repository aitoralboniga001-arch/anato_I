import type { ProgressRecord } from '../content/types';

export interface StorageLike { getItem(key: string): string | null; setItem(key: string, value: string): void; removeItem(key: string): void; }
export interface ProgressRepository { get(topicId: string): ProgressRecord | null; save(record: ProgressRecord): void; remove(topicId: string): void; }

export class LocalStorageProgressRepository implements ProgressRepository {
  constructor(private readonly storage: StorageLike, private readonly key = 'embriologia:progress') {}
  private read(): Record<string, ProgressRecord> { const raw = this.storage.getItem(this.key); return raw ? JSON.parse(raw) as Record<string, ProgressRecord> : {}; }
  get(topicId: string) { return this.read()[topicId] ?? null; }
  save(record: ProgressRecord) { const all = this.read(); all[record.topicId] = record; this.storage.setItem(this.key, JSON.stringify(all)); }
  remove(topicId: string) { const all = this.read(); delete all[topicId]; this.storage.setItem(this.key, JSON.stringify(all)); }
}
