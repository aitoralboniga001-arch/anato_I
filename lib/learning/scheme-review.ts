import type { MNode } from '@/content/migrations';

export interface ReviewMap { id: string; week: number; title: string; roots: MNode[] }
export interface ReviewCard {
  id: string;
  mapId: string;
  week: number;
  direction: 'forward' | 'reverse';
  prompt: string;
  answer: string;
  context?: string;
}
export interface ReviewState { correct: number; mistakes: number; due: number; lastReviewed: number }
export type ReviewProgress = Record<string, ReviewState>;
export type ReviewFilter = 'all' | 'due' | 'mistakes';
export const STORAGE_KEY = 'enbrioatlas.scheme-review.v1';
const DAY = 86_400_000;
const INTERVALS = [1, 3, 7, 14];

/** Text includes qualifiers so sides, movements and disappearing structures are never conflated. */
export function buildReviewCards(maps: readonly ReviewMap[], resolveName: (id: string) => string): ReviewCard[] {
  const name = (node: MNode) => (node.id ? resolveName(node.id) : node.label) ?? '';
  const label = (node: MNode) => [name(node), node.note,
    node.gone ? 'desagertzen da' : '', node.move ? 'migratzen da / lekuz aldatzen da' : ''].filter(Boolean).join(' · ');
  const normalizedWords = (text: string) => ` ${text.toLocaleLowerCase('eu').replace(/[^\p{L}\p{N}]+/gu, ' ').trim()} `;
  const hash = (text: string) => {
    let value = 2166136261;
    for (let i = 0; i < text.length; i++) value = Math.imul(value ^ text.charCodeAt(i), 16777619);
    return (value >>> 0).toString(36);
  };
  const cards: ReviewCard[] = [];
  for (const map of maps) {
    const forward = new Map<string, Set<string>>();
    const reverse = new Map<string, Set<string>>();
    const add = (groups: Map<string, Set<string>>, query: string, answer: string) => {
      const answers = groups.get(query) ?? new Set<string>();
      answers.add(answer);
      groups.set(query, answers);
    };
    const walk = (parent: MNode, ancestors: string[]) => {
      const parentText = label(parent);
      const lineage = ancestors.length ? ` (${ancestors.join(' → ')})` : '';
      // Grouping labels organize convergences, but are not anatomical structures to recall.
      const children = (parent.kids ?? []).flatMap((child) => child.label === 'Jatorria / osagaia' && !child.id
        ? (child.kids ?? []).map((origin) => ({ ...origin, via: origin.via ? `osagaia · ${origin.via}` : 'osagaia' })) : [child]);
      for (const child of children) {
        const childText = label(child);
        const relationship = child.via ? ` [${child.via}]` : '';
        const parentQualifier = parentText !== name(parent) ? ` (${parentText})` : '';
        const childQualifier = childText !== name(child) ? ` (${childText})` : '';
        add(forward, name(parent), `${childText}${relationship}${lineage}${parentQualifier}`);
        // A descriptive sentence containing the parent would give away its own inverse answer.
        // Keep its full direct fact, and invert only standalone labels without that giveaway.
        if (!normalizedWords(name(child)).includes(normalizedWords(name(parent))))
          add(reverse, name(child), `${parentText}${relationship}${lineage}${childQualifier}`);
        walk(child, [...ancestors, parentText]);
      }
    };
    map.roots.forEach((root) => walk(root, []));
    for (const [direction, groups] of [['forward', forward], ['reverse', reverse]] as const) {
      for (const [query, values] of [...groups.entries()].sort(([a], [b]) => a.localeCompare(b))) {
        const answers = [...values].sort();
        cards.push({
          id: `${map.id}/${direction}/${hash(JSON.stringify([query, answers]))}`,
          mapId: map.id, week: map.week, direction,
          prompt: `${direction === 'forward' ? 'Zer lotzen da honekin?' : 'Zerekin lotzen da?'} ${query}`,
          answer: answers.join('\n'), context: map.title,
        });
      }
    }
  }
  return cards;
}

/** A remembered answer clears pending mistakes; a lapse restarts its spacing. */
export function gradeReview(progress: ReviewProgress, id: string, known: boolean, now: number): ReviewProgress {
  const previous = progress[id];
  const correct = known ? (previous?.correct ?? 0) + 1 : 0;
  return { ...progress, [id]: {
    correct, mistakes: known ? 0 : (previous?.mistakes ?? 0) + 1,
    due: now + (known ? INTERVALS[Math.min(correct - 1, INTERVALS.length - 1)] * DAY : 10 * 60_000),
    lastReviewed: now,
  } };
}

export function selectReviewCards(cards: readonly ReviewCard[], progress: ReviewProgress, filter: ReviewFilter, now: number): ReviewCard[] {
  const priority = (card: ReviewCard) => {
    const state = progress[card.id];
    return state?.mistakes ? 0 : state && state.due <= now ? 1 : !state ? 2 : 3;
  };
  return cards.filter((card) => filter === 'all' || (filter === 'mistakes'
    ? (progress[card.id]?.mistakes ?? 0) > 0
    : !progress[card.id] || progress[card.id].due <= now))
    .sort((a, b) => priority(a) - priority(b) || (progress[a.id]?.due ?? 0) - (progress[b.id]?.due ?? 0) || a.id.localeCompare(b.id));
}

export function parseReviewProgress(raw: string | null): ReviewProgress {
  if (!raw) return {};
  try {
    const decoded: unknown = JSON.parse(raw);
    if (!decoded || typeof decoded !== 'object' || Array.isArray(decoded)) return {};
    const envelope = decoded as Record<string, unknown>;
    if ('version' in envelope && envelope.version !== 1) return {};
    const source = 'version' in envelope ? envelope.progress : decoded;
    if (!source || typeof source !== 'object' || Array.isArray(source)) return {};
    const result: ReviewProgress = {};
    for (const [id, value] of Object.entries(source)) {
      if (!value || typeof value !== 'object' || Array.isArray(value)) continue;
      const item = value as Record<string, unknown>;
      if (!['correct', 'mistakes', 'due', 'lastReviewed'].every((key) => typeof item[key] === 'number' && Number.isFinite(item[key]) && (item[key] as number) >= 0)) continue;
      if (!Number.isInteger(item.correct) || !Number.isInteger(item.mistakes)) continue;
      Object.defineProperty(result, id, { value: { correct: item.correct, mistakes: item.mistakes, due: item.due, lastReviewed: item.lastReviewed }, enumerable: true, writable: true, configurable: true });
    }
    return result;
  } catch { return {}; }
}
