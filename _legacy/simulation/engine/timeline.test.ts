import { describe, expect, it } from 'vitest';
import { TimelineEngine } from './timeline';
import type { Stage } from '../../content/types';

const stages: Stage[] = [
  { id: 'a', title: { primary: 'A' }, summary: '', order: 1, start: 0, end: 0.25, transition: 'discrete', structures: [], source: { file: 'test', section: 'a' } },
  { id: 'b', title: { primary: 'B' }, summary: '', order: 2, start: 0.25, end: 0.75, transition: 'interpolate', structures: [], source: { file: 'test', section: 'b' } },
  { id: 'c', title: { primary: 'C' }, summary: '', order: 3, start: 0.75, end: 1, transition: 'discrete', structures: [], source: { file: 'test', section: 'c' } },
];

describe('TimelineEngine', () => {
  it('orders stages and resolves discrete boundaries', () => { const e = new TimelineEngine([...stages].reverse()); expect(e.getState().stageId).toBe('a'); expect(e.scrub(0.25).stageId).toBe('b'); expect(e.scrub(1).stageId).toBe('c'); });
  it('scrubs and reconstructs exactly when going back', () => { const e = new TimelineEngine(stages); const at = e.scrub(0.6); e.scrub(0.1); expect(e.scrub(0.6)).toEqual(at); });
  it('plays, reverses and stops at ends', () => { const e = new TimelineEngine(stages); e.setSpeed(0.5); e.play(); e.tick(1); expect(e.getState().time).toBe(0.5); e.reverse(); e.tick(0.4); expect(e.getState().time).toBeCloseTo(0.3); e.tick(1); expect(e.getState().time).toBe(0); expect(e.getState().playing).toBe(false); });
  it('supports next and previous stages', () => { const e = new TimelineEngine(stages); expect(e.next().stageId).toBe('b'); expect(e.next().stageId).toBe('c'); expect(e.previous().stageId).toBe('b'); });
});
