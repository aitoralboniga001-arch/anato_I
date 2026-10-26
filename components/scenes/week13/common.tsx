'use client';

import { Note, type SceneProps } from '@/components/kit';
import type { At3 } from '@/components/kit/three/Stage3D';
import { ModelView, cameraAt, type CalloutSpec } from '@/components/scenes/week10/Heart3D';
import { ColourKey } from '@/components/scenes/week12/common';
import { seg } from '@/lib/sim/anim';
import type { Camera3, V3 } from '@/lib/three-d/math';
import type { Item3 } from '@/lib/three-d/scene';
import { routeLength, vesselRouteOf } from '@/components/scenes/week10/model3d';
import { VC, bloodCells, rev, route, veinModel, type VeinOpts, type VeinPose } from './veins3d';

export { cameraAt, orbit, type CalloutSpec } from '@/components/scenes/week10/Heart3D';
export { vis } from '@/components/scenes/week10/common';
export { ColourKey };

/** Every 3D view of topic 13 shares one continuity: a stage change glides the camera, never cuts. */
export const CONT = 'zainak-13';

/** Colour = origin: the embryonic vein each adult vein comes from (the notes' figures). */
export const ORIGIN_KEY13 = {
  liver: [
    { color: VC.vit, text: 'bitelinoak' },
    { color: VC.umb, text: 'zilborrekoak' },
    { color: VC.hornR, text: 'zain sinua' },
  ],
  cardinal: [
    { color: VC.ant, text: 'aurreko kard.' },
    { color: VC.common, text: 'kard. komuna' },
    { color: VC.post, text: 'atzeko kard.' },
    { color: VC.sub, text: 'azpiko kard.' },
    { color: VC.sacro, text: 'sakrokard.' },
    { color: VC.supra, text: 'gaineko kard.' },
  ],
  all: [
    { color: VC.vit, text: 'bitelinoak' },
    { color: VC.umb, text: 'zilborrekoak' },
    { color: VC.ant, text: 'aurreko kard.' },
    { color: VC.common, text: 'kard. komuna' },
    { color: VC.post, text: 'atzeko kard.' },
    { color: VC.sub, text: 'azpiko kard.' },
    { color: VC.sacro, text: 'sakrokard.' },
    { color: VC.supra, text: 'gaineko kard.' },
  ],
  blood: [
    { color: VC.o2, text: 'odol oxigenatua' },
    { color: VC.deo2, text: 'oxigeno gutxikoa' },
  ],
} as const;

type Names = VeinPose['names'];
export type PoseTo = Partial<Omit<VeinPose, 'names'>> & { names?: Partial<Names> };
type NumOpts = 'heart' | 'heartGlass' | 'liverOp' | 'septum' | 'gut' | 'kidneys' | 'ribs' | 'limbs' | 'stalk' | 'ghosts' | 'faint' | 'glass';
export type OptsTo = Partial<Record<NumOpts, number>>;

export interface NameSpec {
  id: string;
  /** The model point (defaults to the id). */
  p?: string | V3;
  text?: string;
  sub?: string;
  small?: boolean;
  key?: string;
  /** When in the step the name comes in (0..1 of the step; default 0): said → shown. */
  from?: number;
}

/** Blood cells along a route made of model centrelines ('-key' = run backwards), `sat` = share of red cells. */
export interface Flow {
  path: string[];
  sat: number;
  n?: number;
  speed?: number;
  /** When in the step the flow starts (0..1). */
  from?: number;
}

export interface Step {
  /** Pose and context the step animates to (from wherever the previous steps left them). */
  to?: PoseTo;
  opts?: OptsTo;
  /** When in the step the change runs (0..1 of the step; default 0.08–0.7). */
  run?: readonly [number, number];
  cam: Camera3;
  glide?: number;
  names?: (string | NameSpec)[];
  note?: string;
  warn?: boolean;
  /** Only these ids or groups at full strength; the other veins see-through. */
  dim?: string[];
  flows?: Flow[];
  /** Small numbers or words at model points (intercostal spaces, the notes' figure letters). */
  marks?: { p: V3 | string; text: string; dx?: number; dy?: number }[];
  caption?: string;
  /** Colour key shown during the step (defaults to the stage's). */
  key?: readonly { color: string; text: string }[];
  /** The stage's own extra state (the circulation's closures), animated like `to`. */
  x?: Record<string, number>;
}

export interface StageSpec {
  /** Step starts (stage time, 0..1); one per step. */
  S: readonly number[];
  pose: VeinPose;
  opts: VeinOpts;
  steps: Step[];
  caption: string;
  key?: readonly { color: string; text: string }[];
  /** Blood colour of veins by id for the moment (the circulation: mixed blood, veins closing to ligaments). */
  blood?: (pose: VeinPose, x: Record<string, number>) => Record<string, string>;
  /** How far a step's dim fades the rest (default 1; the circulation keeps its context: less). */
  dimStrength?: number;
  /** Title of the colour key (default: by the key, blood or origin). */
  keyTitle?: string;
  /** Cells spaced by length (one per `cellGap` of route) instead of a fixed count: close-ups stay airy, long routes stay full. Trickles (n ≤ 6) keep their count. */
  cellGap?: number;
  /** Starting values of the stage's extra state (see Step.x). */
  x0?: Record<string, number>;
  /** More of the same frame (the circulation's heart and arteries, the lymph sacs): built from the pose and extra state of the moment. */
  extra?: (t: number, pose: VeinPose, opts: VeinOpts, lines: Record<string, V3[]>, x: Record<string, number>) => { items: Item3[]; pts: Record<string, V3>; lines?: Record<string, V3[]> };
  /** Extra overlay. */
  over?: (t: number, at: At3) => React.ReactNode;
}

const lerp = (a: number, b: number, k: number) => a + (b - a) * k;

/** The step that holds stage time t. */
export const stepAt = (S: readonly number[], t: number) => {
  let i = 0;
  for (let k = 0; k < S.length; k++) if (t >= S[k]) i = k;
  return i;
};

/** The pose and options of the moment: every step's change applied in order, each eased over its own window. */
export function poseAt(spec: Pick<StageSpec, 'S' | 'pose' | 'opts' | 'steps' | 'x0'>, t: number): { pose: VeinPose; opts: VeinOpts; x: Record<string, number> } {
  const pose: VeinPose = { ...spec.pose, names: { ...spec.pose.names } };
  const opts: VeinOpts = { ...spec.opts };
  const x: Record<string, number> = { ...(spec.x0 ?? {}) };
  spec.steps.forEach((st, k) => {
    const a = spec.S[k];
    const b = spec.S[k + 1] ?? 1;
    const run = st.run ?? [0.08, 0.7];
    const u = seg(t, a + run[0] * (b - a), a + run[1] * (b - a));
    if (u <= 0) return;
    if (st.to) {
      for (const [key, v] of Object.entries(st.to)) {
        if (key === 'names') {
          for (const [n, w] of Object.entries(v as Partial<Names>)) (pose.names as Record<string, number>)[n] = lerp((pose.names as Record<string, number>)[n], w as number, u);
        } else (pose as unknown as Record<string, number>)[key] = lerp((pose as unknown as Record<string, number>)[key], v as number, u);
      }
    }
    if (st.opts) for (const [key, v] of Object.entries(st.opts)) (opts as Record<string, number>)[key] = lerp(((opts as Record<string, number>)[key] ?? 0) as number, v as number, u);
    if (st.x) for (const [key, v] of Object.entries(st.x)) x[key] = lerp(x[key] ?? 0, v, u);
  });
  return { pose, opts, x };
}

/** A whole stage: one venous model, a camera key per step, names said then shown, one note per step. */
export function veinStage(spec: StageSpec) {
  const { S, steps } = spec;
  function Scene({ t }: SceneProps) {
    const i = stepAt(S, t);
    const st = steps[i];
    const { pose, opts, x } = poseAt(spec, t);
    const span = (k: number) => (S[k + 1] ?? 1) - S[k];
    // The lit set fades in at the step's start (no flicker when the step before was lit too).
    const prevDim = i > 0 && !!steps[i - 1].dim;
    const dimK = st.dim ? (prevDim ? 1 : seg(t, S[i], S[i] + 0.025)) : prevDim ? 1 - seg(t, S[i], S[i] + 0.025) : 0;
    const dimIds = st.dim ?? (prevDim ? steps[i - 1].dim! : []);
    const dim = dimK > 0.001 ? { ids: dimIds, k: dimK * (spec.dimStrength ?? 1) } : null;
    const m = veinModel(pose, { body: 1, ...opts, dim, blood: spec.blood?.(pose, x) });
    const ex = spec.extra?.(t, pose, { ...opts, dim }, m.lines, x);
    const lines = { ...m.lines, ...(ex?.lines ?? {}) };
    const items = [...m.items, ...(ex?.items ?? [])];
    const pts = { ...m.pts, ...(ex?.pts ?? {}) };
    // Blood: each step's flows, fading in and out with the step.
    steps.forEach((s, k) => {
      if (!s.flows) return;
      const a = S[k];
      const b = S[k + 1] ?? 2;
      s.flows.forEach((f, j) => {
        const show = Math.min(seg(t, a + (f.from ?? 0.05) * span(k), a + ((f.from ?? 0.05) + 0.12) * span(k)), 1 - seg(t, b - 0.02, b));
        if (show <= 0.01) return;
        const r = route(...f.path.map((key) => (key.startsWith('-') ? rev(lines[key.slice(1)]) : lines[key])));
        const n = spec.cellGap && !(f.n && f.n <= 6) ? Math.max(4, Math.min(60, Math.round(routeLength(vesselRouteOf(r)) / spec.cellGap))) : (f.n ?? 14);
        items.push(...bloodCells(`${k}-${j}`, r, t * 60 * (f.speed ?? 1), show, f.sat, n));
      });
    });
    const camera = cameraAt(
      t,
      steps.map((s, k) => (s.glide ? ([S[k], s.cam, s.glide] as const) : ([S[k], s.cam] as const))),
    );
    // A name kept by the next step stays up (one callout, no fade between steps).
    const runs: { n: NameSpec; a: number; b: number; k: number }[] = [];
    steps.forEach((s, k) => {
      for (const n of s.names ?? []) {
        const n1: NameSpec = typeof n === 'string' ? { id: n } : n;
        const same = runs.find((r) => r.b === S[k] && r.n.id === n1.id && String(r.n.p ?? '') === String(n1.p ?? '') && r.n.text === n1.text && !n1.from);
        if (same) same.b = S[k + 1] ?? 2;
        else runs.push({ n: n1, a: S[k] + (n1.from ?? 0) * span(k), b: S[k + 1] ?? 2, k });
      }
    });
    const names: CalloutSpec[] = runs.map(({ n, a, b, k }) => ({ id: n.id, p: n.p ?? n.id, show: vis2(t, a, b), text: n.text, sub: n.sub, small: n.small, key: `${n.key ?? n.id}:${k}` }));
    const key = st.key ?? spec.key;
    return (
      <ModelView
        model={{ items, pts }}
        continuity={CONT}
        camera={camera}
        names={names}
        caption={st.caption ?? spec.caption}
        over={(at) => (
          <>
            {key && <ColourKey items={[...key]} show={1} title={spec.keyTitle ?? (key === ORIGIN_KEY13.blood ? 'Kolorea = odola' : 'Kolorea = jatorria')} />}
            {steps.map((s, k) =>
              s.note ? (
                <Note key={`n${k}`} x={500} y={612} tone={s.warn ? 'warn' : 'accent'} show={vis2(t, S[k], S[k + 1] ?? 2)}>
                  {s.note}
                </Note>
              ) : null,
            )}
            {steps.map((s, k) =>
              (s.marks ?? []).map((mk, j) => {
                const p = typeof mk.p === 'string' ? pts[mk.p] : mk.p;
                if (!p) return null;
                const q = at(p);
                const show = vis2(t, S[k] + 0.25 * span(k), S[k + 1] ?? 2);
                if (show <= 0.02) return null;
                return (
                  <text key={`m${k}-${j}`} x={q.x + (mk.dx ?? 0)} y={q.y + (mk.dy ?? -10)} textAnchor="middle" className="note note-accent" opacity={show} style={{ fontSize: 12.5, fontWeight: 600 }} pointerEvents="none">
                    {mk.text}
                  </text>
                );
              }),
            )}
            {spec.over?.(t, at)}
          </>
        )}
      />
    );
  }
  return Scene;
}

/** vis with the stage-end case: a name or note of the last step stays to the end. */
const vis2 = (t: number, a: number, b: number) => Math.min(a <= 0 ? 1 : seg(t, a, a + 0.03), b >= 1.5 ? 1 : 1 - seg(t, b - 0.03, b));
