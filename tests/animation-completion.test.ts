import { describe, expect, it } from 'vitest';
import { weeks } from '@/content/registry';
import { doneAt } from '@/lib/sim/beat-completion';
import { buildDiaphragm } from '@/components/scenes/week7/DiaphragmDome3D';
import { buildLimbRotation } from '@/components/scenes/week8/LimbRotation3D';
import { buildCalvaria } from '@/components/scenes/week8/Calvaria3D';
import { buildDomains } from '@/components/scenes/week9/Domains3D';

const stage = (week: number, id: string) => weeks.find((w) => w.week === week)!.stages.find((s) => s.id === id)!;
const restingFrame = (week: number, id: string, at: number) => {
  const s = stage(week, id);
  return doneAt(s, s.beats.findIndex((b) => b.at === at));
};

describe('3D animations reach an observable result before the guided pause', () => {
  it('shows the completed diaphragm dome with the migrated cells still visible', () => {
    const frame = buildDiaphragm(restingFrame(7, 'diafragma-eraketa', 0.7568), false);
    expect(frame.F.domeK).toBe(1);
    expect(frame.F.rimK).toBe(1);
    expect(frame.canalShow).toBe(0);
    expect(frame.myoAt).toHaveLength(6);
    expect(frame.myoShow).toBe(1);
  });

  it('never teleports a tracked myocyte back towards the septum', () => {
    let previous = buildDiaphragm(0.8, false).myoAt;
    for (let t = 0.802; t <= 0.856; t += 0.002) {
      const current = buildDiaphragm(t, false).myoAt;
      expect(current).toHaveLength(6);
      current.forEach((p, i) => expect(p[2]).toBeLessThanOrEqual(previous[i][2] + 1e-9));
      previous = current;
    }
    expect(buildDiaphragm(0.855, false).myoAt).toEqual(buildDiaphragm(0.859, false).myoAt);
    expect(buildDiaphragm(0.855, true).myoAt).toEqual(previous);
  });

  it('finishes the upper 90-degree turn before starting the lower limbs', () => {
    const { turn } = buildLimbRotation(restingFrame(8, 'gorputz-adarrak', 0.76));
    expect(turn).toEqual({ up: 1, low: 0 });
    expect(buildLimbRotation(1).turn).toEqual({ up: 1, low: 1 });
  });

  it('lets every somite cell reach its destination before explaining the frontier', () => {
    const end = buildDomains(restingFrame(9, 'domeinuak', 0), false);
    const settled = buildDomains(0.15, false);
    expect(end.cellPts.length).toBeGreaterThan(0);
    expect(end.cellPts).toEqual(settled.cellPts);
    expect(end.front).toBe(0);
    expect(buildDomains(0.06, false).cellPts).not.toEqual(settled.cellPts);
    // The final recap repeats the same migration and arrives at the same destination.
    expect(buildDomains(1, false).cellPts).toEqual(settled.cellPts);
  });

  it('preserves skull moulding and the order of postnatal fontanelle closure', () => {
    expect(buildCalvaria(restingFrame(8, 'buru-ganga', 0.8), false).mold).toBe(1);
    const posteriorClosed = buildCalvaria(0.95, false);
    expect(posteriorClosed.pfClose).toBe(1);
    expect(posteriorClosed.afClose).toBe(0);
    const final = buildCalvaria(1, false);
    expect(final.mold).toBe(0);
    expect(final.pfClose).toBe(1);
    expect(final.afClose).toBe(1);
  });
});

describe('reading hold boundaries', () => {
  it('keeps each hold inside its caption and preserves all non-overridden timings', () => {
    for (const w of weeks) for (const s of w.stages) s.beats.forEach((b, k) => {
      const t = doneAt(s, k);
      const next = s.beats[k + 1];
      expect(t).toBeGreaterThanOrEqual(b.at);
      if (!next) { expect(t).toBe(1); return; }
      expect(t).toBeLessThan(next.at);
      if (b.completeAt !== undefined) {
        expect(t).toBe(b.completeAt);
      } else {
        expect(t).toBe(next.at - Math.min(0.035, (next.at - b.at) * 0.25) - 1e-4);
      }
    });
  });
});
