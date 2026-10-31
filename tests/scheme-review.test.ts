import { describe, expect, it } from 'vitest';
import { buildReviewCards, gradeReview, parseReviewProgress, selectReviewCards, type ReviewMap } from '@/lib/learning/scheme-review';

const map: ReviewMap = { id: 'example', week: 7, title: 'Erlazioak', roots: [
  { label: 'A', note: 'eskuinean', kids: [{ label: 'B', via: 'inerbazioa', move: true }, { label: 'C', gone: true }] },
  { label: 'D', kids: [{ label: 'B', via: 'erlazioa', move: true }] },
] };
const cards = buildReviewCards([map], (id) => id);

describe('scheme review', () => {
  it('asks all relations in both directions and groups all valid answers', () => {
    const direct = cards.find((c) => c.direction === 'forward' && c.prompt.endsWith('? A'))!;
    expect(direct.answer).toContain('B · migratzen da / lekuz aldatzen da [inerbazioa]');
    expect(direct.answer).toContain('C · desagertzen da');
    const reverse = cards.find((c) => c.direction === 'reverse' && c.prompt.endsWith('? B'))!;
    expect(reverse.answer).toContain('A · eskuinean [inerbazioa]');
    expect(reverse.answer).toContain('D [erlazioa]');
    expect(cards.some((c) => c.prompt.includes('jatorri'))).toBe(false);
  });

  it('keeps answer-bearing notes and movement qualifiers out of prompts without losing them', () => {
    const examples: ReviewMap = { ...map, roots: [
      { label: 'Faringe-hestea', note: 'goiko lurraldea', kids: [{ label: 'Muga', note: 'Faringe-hestearen amaiera', gone: true, move: true }] },
      { label: 'Atala', note: 'eskuinean', kids: [{ label: 'Helburua' }] },
      { label: 'Atala', note: 'ezkerrean', kids: [{ label: 'Beste helburua' }] },
    ] };
    const result = buildReviewCards([examples], (id) => id);
    expect(result.find((c) => c.direction === 'reverse' && c.prompt.endsWith('? Muga'))?.prompt).toBe('Zerekin lotzen da? Muga');
    expect(result.every((c) => !/amaiera|goiko lurraldea|eskuinean|ezkerrean|desagertzen|migratzen/.test(c.prompt))).toBe(true);
    const answer = result.find((c) => c.direction === 'forward' && c.prompt.endsWith('? Atala'))!.answer;
    expect(answer).toContain('Helburua (Atala · eskuinean)');
    expect(answer).toContain('Beste helburua (Atala · ezkerrean)');
    expect(result.find((c) => c.direction === 'reverse' && c.prompt.endsWith('? Muga'))?.answer).toContain('Faringe-hestearen amaiera');
  });

  it('does not ask organizational wrappers or tautological inverse questions', () => {
    const result = buildReviewCards([{ ...map, roots: [
      { label: 'Diafragma', kids: [{ label: 'Jatorria / osagaia', kids: [{ label: 'Septum', kids: [{ label: 'Zentro tendinosoa' }] }] }] },
      { label: 'Gibela', kids: [{ label: 'Gibela eta behazun-bideak' }] },
    ] }], (id) => id);
    expect(result.every((card) => !card.prompt.includes('Jatorria / osagaia') && !card.answer.includes('Jatorria / osagaia'))).toBe(true);
    expect(result.find((card) => card.direction === 'forward' && card.prompt.endsWith('? Diafragma'))?.answer).toBe('Septum [osagaia]');
    expect(result.some((card) => card.direction === 'forward' && card.answer.includes('Gibela eta behazun-bideak'))).toBe(true);
    expect(result.some((card) => card.direction === 'reverse' && card.prompt.includes('Gibela eta behazun-bideak'))).toBe(false);
  });

  it('keeps ancestry for nested qualifiers and stable cards after branch reordering', () => {
    const nested: ReviewMap = { ...map, roots: [{ label: 'Eskuin', kids: [{ label: 'Atala', kids: [{ id: 'leaf', note: 'goian' }] }] }] };
    const result = buildReviewCards([nested], () => 'Hostoa');
    expect(result.some((card) => card.answer.includes('Hostoa · goian (Eskuin)'))).toBe(true);
    const reversed = buildReviewCards([{ ...map, roots: [...map.roots].reverse().map((root) => ({ ...root, kids: [...root.kids!].reverse() })) }], (id) => id);
    expect(reversed).toEqual(cards);
    expect(buildReviewCards([{ ...map, roots: [...map.roots, ...map.roots] }], (id) => id)).toEqual(cards);
  });

  it('spaces success, prioritizes lapses and never mutates earlier progress', () => {
    const first = gradeReview({}, cards[0].id, true, 100);
    expect(first[cards[0].id].due).toBe(86_400_100);
    const second = gradeReview(first, cards[0].id, true, 200);
    expect(second[cards[0].id].due).toBe(3 * 86_400_000 + 200);
    expect(first[cards[0].id].correct).toBe(1);
    const failed = gradeReview(second, cards[0].id, false, 300);
    expect(failed[cards[0].id]).toEqual({ correct: 0, mistakes: 1, due: 600_300, lastReviewed: 300 });
    expect(selectReviewCards(cards, failed, 'mistakes', 300).map((card) => card.id)).toEqual([cards[0].id]);
    expect(selectReviewCards(cards, failed, 'all', 300)[0].id).toBe(cards[0].id);
    const fixed = gradeReview(failed, cards[0].id, true, 400);
    expect(selectReviewCards(cards, fixed, 'mistakes', 400)).toEqual([]);
    expect(selectReviewCards(cards, fixed, 'due', 400)).not.toContainEqual(cards[0]);
    expect(selectReviewCards(cards, fixed, 'due', fixed[cards[0].id].due)).toContainEqual(cards[0]);
    expect(selectReviewCards(cards, fixed, 'all', 400)).toHaveLength(cards.length);
  });

  it('round-trips progress and ignores invalid saved values or unknown versions', () => {
    const progress = gradeReview({}, cards[0].id, false, 100);
    expect(parseReviewProgress(JSON.stringify(progress))).toEqual(progress);
    expect(parseReviewProgress(JSON.stringify({ version: 1, progress }))).toEqual(progress);
    for (const raw of [null, 'not json', 'null', '[]', '{"version":2}', '{"bad":{"correct":-1}}']) expect(parseReviewProgress(raw)).toEqual({});
    expect(parseReviewProgress(JSON.stringify({ ...progress, bad: { correct: 1.2, mistakes: 0, due: 100, lastReviewed: 0 } }))).toEqual(progress);
  });
});
