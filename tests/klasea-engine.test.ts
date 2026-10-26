import { describe, expect, it } from 'vitest';
import { commandOf, initialState, reduce, stepsOf, type ClassEvent, type ClassState } from '@/lib/klasea/engine';
import type { Lesson } from '@/lib/klasea/types';
import { LESSONS } from '@/content/klasea';

const lesson: Lesson = {
  week: 10,
  title: 'Proba',
  goals: ['Bat'],
  chunks: [
    {
      id: 'a',
      title: 'A',
      stage: 's1',
      lines: [
        { say: 'Lehena.', notes: ['n1'], at: 0.1, focus: ['x'] },
        { say: 'Bigarrena.', plain: 'Errazago.', notes: ['n2'], at: 0.4, focus: ['y'], writes: 'b1', tone: 'emphasis' },
      ],
      board: [{ id: 'b1', kind: 'line', text: 'Puntua', notes: ['n2'] }],
      checks: [{ kind: 'predict', after: 0, q: '?', options: ['a', 'b'], answer: 0, why: ['', ''], notes: ['n1'] }],
    },
    {
      id: 'b',
      title: 'B',
      stage: 's2',
      lines: [{ say: 'Hirugarrena.', notes: ['n3'], hold: 2, focus: ['z'] }],
      checks: [{ kind: 'pool', id: 'q1' }],
    },
  ],
};

const run = (events: ClassEvent[], from: ClassState = initialState()) => events.reduce((s, e) => reduce(lesson, s, e), from);

describe('class engine', () => {
  it('waits after a finished board point, retaining text and board until the learner continues', () => {
    let s: ClassState = { ...initialState(), step: 2, phase: 'speak' };
    s = reduce(lesson, s, { type: 'spoken' }, true);
    expect(s.phase).toBe('write');
    s = reduce(lesson, s, { type: 'written' }, true);
    expect(s).toMatchObject({ step: 2, phase: 'wait' });
    expect(commandOf(lesson, s)).toMatchObject({ text: 'Bigarrena.', written: ['b1'], focus: ['y'] });
    expect(reduce(lesson, s, { type: 'spoken' }, true)).toEqual(s);
    expect(reduce(lesson, s, { type: 'continue' }, true)).toMatchObject({ step: 3, phase: 'move' });
    expect(reduce(lesson, s, { type: 'back' }, true)).toMatchObject({ step: 2, phase: 'move' });
    expect(reduce(lesson, s, { type: 'notUnderstood' }, true)).toMatchObject({ step: 2, phase: 'move', plain: true });
  });

  it('does not add a wait before a check, or let Next skip an unanswered check', () => {
    const s = reduce(lesson, { ...initialState(), step: 3, phase: 'hold' }, { type: 'held' }, true);
    expect(s).toMatchObject({ step: 4, phase: 'ask' });
    expect(reduce(lesson, s, { type: 'next' }, true)).toEqual(s);
    expect(reduce(lesson, s, { type: 'continue' }, true)).toEqual(s);
  });

  it.each([10, 11, 12])('completes topic %i in both pacing modes with every check preserved', (week) => {
    const lesson = LESSONS[week];
    for (const manual of [false, true]) {
      let s = initialState();
      let checks = 0;
      let waits = 0;
      for (let guard = 0; s.phase !== 'done' && guard < 3000; guard++) {
        const ev: ClassEvent = s.phase === 'move' ? { type: 'arrived' }
          : s.phase === 'speak' ? { type: 'spoken' }
          : s.phase === 'write' ? { type: 'written' }
          : s.phase === 'hold' ? { type: 'held' }
          : s.phase === 'ask' ? { type: 'answered', ok: true, graded: true }
          : { type: 'continue' };
        if (s.phase === 'ask') checks++;
        if (s.phase === 'wait') waits++;
        s = reduce(lesson, s, ev, manual);
      }
      expect(s.phase).toBe('done');
      expect(checks).toBe(stepsOf(lesson).filter((step) => step.kind === 'check').length);
      expect(manual ? waits > 0 : waits === 0).toBe(true);
    }
  });

  it('slots checks after the line they name, else at the chunk end', () => {
    expect(stepsOf(lesson)).toEqual([
      { kind: 'line', chunk: 0, line: 0 },
      { kind: 'check', chunk: 0, check: 0 },
      { kind: 'line', chunk: 0, line: 1 },
      { kind: 'line', chunk: 1, line: 0 },
      { kind: 'check', chunk: 1, check: 0 },
    ]);
  });

  it('moves, speaks, writes after the speech, holds, asks and ends', () => {
    let s = run([{ type: 'start' }]);
    expect(s.phase).toBe('move');
    s = run([{ type: 'arrived' }], s);
    expect(s.phase).toBe('speak');
    s = run([{ type: 'spoken' }], s);
    expect(s).toMatchObject({ step: 1, phase: 'ask' });
    s = run([{ type: 'answered', ok: false, graded: false }], s);
    expect(s.phase).toBe('feedback');
    expect(s.weak).toEqual([]); // a guess is never held against the student
    s = run([{ type: 'continue' }, { type: 'arrived' }], s);
    expect(commandOf(lesson, s).written).toEqual([]);
    s = run([{ type: 'spoken' }], s);
    expect(s.phase).toBe('write');
    expect(commandOf(lesson, s).written).toEqual(['b1']);
    expect(commandOf(lesson, s).gaze).toBe('board');
    s = run([{ type: 'written' }, { type: 'arrived' }, { type: 'spoken' }], s);
    expect(s).toMatchObject({ step: 3, phase: 'hold' });
    s = run([{ type: 'held' }, { type: 'answered', ok: false, graded: true }], s);
    expect(s.weak).toEqual(['b']);
    s = run([{ type: 'continue' }], s);
    expect(s.phase).toBe('done');
    expect(commandOf(lesson, s).pose).toBe('praise');
  });

  it('ignores feedback that does not fit the phase', () => {
    const s = run([{ type: 'start' }, { type: 'spoken' }, { type: 'written' }, { type: 'continue' }]);
    expect(s).toMatchObject({ step: 0, phase: 'move' });
  });

  it('lights only after arriving, and names accumulate within a chunk', () => {
    let s = run([{ type: 'start' }]);
    expect(commandOf(lesson, s).focus).toEqual([]);
    expect(commandOf(lesson, s).said).toEqual([]);
    s = run([{ type: 'arrived' }], s);
    expect(commandOf(lesson, s)).toMatchObject({ focus: ['x'], said: ['x'], at: 0.1, stage: 's1' });
    s = run([{ type: 'spoken' }, { type: 'answered', ok: true, graded: false }, { type: 'continue' }, { type: 'arrived' }], s);
    expect(commandOf(lesson, s)).toMatchObject({ focus: ['y'], said: ['x', 'y'], at: 0.4, pose: 'emphasis', allNames: true });
  });

  it('"Ez dut ulertu" says the line again in plain words and marks the chunk', () => {
    let s = run([{ type: 'start' }, { type: 'arrived' }, { type: 'spoken' }, { type: 'answered', ok: true, graded: false }, { type: 'continue' }, { type: 'arrived' }]);
    s = run([{ type: 'notUnderstood' }], s);
    expect(s).toMatchObject({ step: 2, phase: 'move', plain: true, weak: ['a'] });
    expect(commandOf(lesson, run([{ type: 'arrived' }], s)).text).toBe('Errazago.');
    // From a check it goes back to the line the check rests on.
    const c = run([{ type: 'start' }, { type: 'arrived' }, { type: 'spoken' }, { type: 'notUnderstood' }]);
    expect(c).toMatchObject({ step: 0, plain: true });
  });

  it('jumps by chunk, and back goes to the previous line', () => {
    let s = run([{ type: 'chunk', chunk: 1 }]);
    expect(s).toMatchObject({ step: 3, phase: 'move' });
    expect(commandOf(lesson, s).stage).toBe('s2');
    s = run([{ type: 'back' }], s);
    expect(s).toMatchObject({ step: 2, phase: 'move' });
    s = run([{ type: 'arrived' }, { type: 'back' }], s);
    expect(s).toMatchObject({ step: 2, phase: 'move' });
    s = run([{ type: 'back' }], s);
    expect(s).toMatchObject({ step: 0 });
  });
});
