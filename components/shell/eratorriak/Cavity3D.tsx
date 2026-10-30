'use client';

import { CAVITIES, CHANGES7 } from '@/content/eratorriak/cavities';
import { aliveAt, changedAt, colourOf, lifeAt, nameAt, type Piece } from '@/content/eratorriak/model';
import { orbit, type CalloutSpec } from '@/components/scenes/week10/Heart3D';
import { CAV_POSES, cavityModel, mixCav } from '@/components/scenes/week7/cavities3d';
import { Room3D, type Frame3 } from './kit/Room3D';
import type { RoomViewState } from './kit/StudyRoom';

/**
 * Topic 7's room in 3D: the trunk's cavities at the diagram's six moments, morphing between them. The
 * first three are seen from the front and a little to the right (the coelom, then the spaces round the
 * heart and the lungs); from moment 4 the camera rises to look down on the floor, where the membranes
 * close the canals and the four sources make the dome. Colours follow the room's Jatorria / Eratorria.
 */

const CAMS = [
  { yaw: 18, elev: 10, dist: 12, target: [0, -0.45, 0] },
  { yaw: 22, elev: 16, dist: 10.5, target: [0, 0.1, 0] },
  { yaw: 20, elev: 14, dist: 7.6, target: [0, 1.25, -0.05] },
  { yaw: 18, elev: 62, dist: 7.4, target: [0, 0.5, -0.1] },
  { yaw: 22, elev: 66, dist: 7.2, target: [0, 0.4, -0.1] },
  { yaw: 30, elev: 38, dist: 7.6, target: [0, 0.45, -0.05] },
] as const;
const N = CAMS.length;

const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
const BY_KEY = new Map(CAVITIES.pieces.map((p) => [p.key, p]));
const seen = (p: Piece | undefined, stage: number) => (!p ? 1 : aliveAt(p, stage) ? 1 : 0);

/** Each piece's 3D name: its room name at the moment; the two sides' alike names say which side. */
function nameSpecs(pick: Piece[], stage: number, pts: Record<string, unknown>): CalloutSpec[] {
  const out = pick
    .filter((p) => aliveAt(p, stage) && pts[p.key])
    .map((p): CalloutSpec => ({ id: p.id3 ?? p.key, p: p.key, show: 1, text: nameAt(p, stage), key: p.key, small: true }));
  const twice = new Set(out.filter((c, i) => out.findIndex((d) => d.text === c.text) !== i).map((c) => c.text));
  for (const c of out) if (twice.has(c.text)) c.sub = BY_KEY.get(c.key!)!.side === 'R' ? 'eskuinekoa' : 'ezkerrekoa';
  return out;
}

export function Cavity3D(state: RoomViewState) {
  const { mode, lit, names } = state;
  const frame = (u: number): Frame3 => {
    const i = Math.max(0, Math.min(N - 1, Math.floor(u)));
    const j = Math.min(N - 1, i + 1);
    const k = u - i;
    const e = k * k * (3 - 2 * k);
    const stage = Math.round(u);
    const pose = mixCav(CAV_POSES[i], CAV_POSES[j], e);
    const colour = (key: string) => colourOf(BY_KEY.get(key)!, mode, CAVITIES);
    const show = (key: string) => lerp(seen(BY_KEY.get(key), i), seen(BY_KEY.get(key), j), e);
    const m = cavityModel(pose, colour, show);
    // Lit pieces stay; the rest (context too) fades back.
    const items = lit.size ? m.items.map((it) => (lit.has(it.key) ? it : { ...it, opacity: (it.opacity ?? 1) * 0.16 })) : m.items;
    const said = new Set(CHANGES7[stage].flatMap((c) => c.keys));
    const all = CAVITIES.pieces;
    const pick =
      names === 'gabe'
        ? []
        : lit.size
          ? all.filter((p) => lit.has(p.key))
          : names === 'guztiak'
            ? all
            : all.filter((p) => said.has(p.key) || (changedAt(p, stage) && lifeAt(p, stage) !== 3));
    const c0 = CAMS[i];
    const c1 = CAMS[j];
    const target = [0, 1, 2].map((n) => lerp(c0.target[n], c1.target[n], e)) as [number, number, number];
    return {
      items,
      pts: m.pts,
      camera: orbit(lerp(c0.yaw, c1.yaw, e), lerp(c0.elev, c1.elev, e), lerp(c0.dist, c1.dist, e), target),
      names: nameSpecs(pick, stage, m.pts),
    };
  };
  return <Room3D state={state} frame={frame} continuity="eratorriak-7" label="Gorputz barrunbeen 3D eredua" />;
}
