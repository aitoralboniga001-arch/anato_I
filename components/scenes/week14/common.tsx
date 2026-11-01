'use client';

import { Note, type SceneProps } from '@/components/kit';
import { Loading3D, type At3 } from '@/components/kit/three/Stage3D';
import { ModelView, cameraAt, type CalloutSpec } from '@/components/scenes/week10/Heart3D';
import { ColourKey } from '@/components/scenes/week12/common';
import { seg } from '@/lib/sim/anim';
import { EMBRYO5 } from '@/lib/three-d/embryo5';
import { useGeoReady } from '@/lib/three-d/offthread';
import type { Camera3, V3 } from '@/lib/three-d/math';
import type { Item3 } from '@/lib/three-d/scene';
import { GC, gutModel, type GutOpts, type GutPose } from './gut3d';

export { cameraAt, orbit, type CalloutSpec } from '@/components/scenes/week10/Heart3D';
export { vis } from '@/components/scenes/week10/common';
export { ColourKey };

/** Every 3D view of topic 14 shares one continuity: a stage change glides the camera, never cuts. */
export const CONT = 'digestioa-14';

/** Colour keys of the topic. */
export const KEY14 = {
  endo: [{ color: GC.endo, text: 'endodermoa' }],
  three: [
    { color: GC.fore, text: 'aurreko hestea' },
    { color: GC.mid, text: 'bitarteko hestea' },
    { color: GC.hind, text: 'atzeko hestea' },
  ],
  four: [
    { color: GC.pharynx, text: 'faringe hestea' },
    { color: GC.fore, text: 'aurreko hestea' },
    { color: GC.mid, text: 'bitarteko hestea' },
    { color: GC.hind, text: 'atzeko hestea' },
  ],
  arteries: [
    { color: GC.fore, text: 'enbor zeliakoa → aurreko hestea' },
    { color: GC.mid, text: 'goiko a. mesenterikoa → bitarteko hestea' },
    { color: GC.hind, text: 'beheko a. mesenterikoa → atzeko hestea' },
  ],
  peritoneum: [
    { color: GC.cavity, text: 'peritoneo barrunbea' },
    { color: GC.visceral, text: 'errai peritoneoa' },
    { color: GC.parietal, text: 'paretako peritoneoa' },
    { color: GC.septum, text: 'septum transversuma' },
  ],
} as const;

type Num<T> = { [K in keyof T as T[K] extends number | undefined ? K : never]?: number };
export type PoseTo<P = GutPose> = Partial<P>;
export type OptsTo<O = GutOpts> = Num<O>;

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

export interface Step<P = GutPose, O = GutOpts> {
  /** Pose and context the step animates to (from wherever the previous steps left them). */
  to?: PoseTo<P>;
  opts?: OptsTo<O>;
  /** When in the step the change runs (0..1 of the step; default 0.08–0.7). */
  run?: readonly [number, number];
  cam: Camera3;
  glide?: number;
  names?: (string | NameSpec)[];
  note?: string;
  warn?: boolean;
  /** Only these ids or groups at full strength; the rest see-through. */
  dim?: string[];
  /** Small words at model points (the notes' figure letters, borders). */
  marks?: { p: V3 | string; text: string; dx?: number; dy?: number }[];
  caption?: string;
  key?: readonly { color: string; text: string }[];
  keyTitle?: string;
}

export interface StageSpec<P = GutPose, O = GutOpts> {
  /** Step starts (stage time, 0..1); one per step. */
  S: readonly number[];
  pose: P;
  opts: O;
  steps: Step<P, O>[];
  caption: string;
  key?: readonly { color: string; text: string }[];
  keyTitle?: string;
  /** Extra overlay. */
  over?: (t: number, at: At3, pose: P) => React.ReactNode;
}

const lerp = (a: number, b: number, k: number) => a + (b - a) * k;

/** The step that holds stage time t. */
export const stepAt = (S: readonly number[], t: number) => {
  let i = 0;
  for (let k = 0; k < S.length; k++) if (t >= S[k]) i = k;
  return i;
};

/** The pose and options of the moment: every step's change applied in order, each eased over its own window. */
export function poseAt<P = GutPose, O = GutOpts>(spec: Pick<StageSpec<P, O>, 'S' | 'pose' | 'opts' | 'steps'>, t: number): { pose: P; opts: O } {
  const pose: P = { ...spec.pose };
  const opts: O = { ...spec.opts };
  spec.steps.forEach((st, k) => {
    const a = spec.S[k];
    const b = spec.S[k + 1] ?? 1;
    const run = st.run ?? [0.08, 0.7];
    const u = seg(t, a + run[0] * (b - a), a + run[1] * (b - a));
    if (u <= 0) return;
    if (st.to) for (const [key, v] of Object.entries(st.to)) (pose as unknown as Record<string, number>)[key] = lerp((pose as unknown as Record<string, number>)[key], v as number, u);
    if (st.opts) for (const [key, v] of Object.entries(st.opts)) (opts as unknown as Record<string, number>)[key] = lerp(((opts as unknown as Record<string, number>)[key] ?? 0) as number, v as number, u);
  });
  return { pose, opts };
}

/** The stage's end pose (the next stage starts from it). */
export const endPose = <P = GutPose, O = GutOpts>(spec: Pick<StageSpec<P, O>, 'S' | 'pose' | 'opts' | 'steps'>) => poseAt(spec, 1);

/** What a stage's model function returns. */
export interface PoseModel {
  items: Item3[];
  pts: Record<string, V3>;
}

/** vis with the stage-end case: a name or note of the last step stays to the end. */
const vis2 = (t: number, a: number, b: number) => Math.min(a <= 0 ? 1 : seg(t, a, a + 0.03), b >= 1.5 ? 1 : 1 - seg(t, b - 0.03, b));

/** A whole stage on the gut model: a camera key per step, names said then shown, one note per step. */
export function gutStage(spec: StageSpec) {
  return poseStage(spec, (pose, opts) => gutModel(pose, opts), true);
}

/**
 * A whole stage on any posed model (the embryo's gut, the trunk's foregut): a camera key per step, names said
 * then shown, one note per step, the step's lit set. `embryo`: the model uses the shared week-5 embryo body.
 */
export function poseStage<P, O extends { dim?: { ids: readonly string[]; k: number } | null }>(spec: StageSpec<P, O>, build: (pose: P, opts: O) => PoseModel, embryo = false) {
  const { S, steps } = spec;
  function View({ t }: SceneProps) {
    const i = stepAt(S, t);
    const st = steps[i];
    const { pose, opts } = poseAt(spec, t);
    const span = (k: number) => (S[k + 1] ?? 1) - S[k];
    // The lit set fades in at the step's start (no flicker when the step before was lit too).
    const prevDim = i > 0 && !!steps[i - 1].dim;
    const dimK = st.dim ? (prevDim ? 1 : seg(t, S[i], S[i] + 0.025)) : prevDim ? 1 - seg(t, S[i], S[i] + 0.025) : 0;
    const dimIds = st.dim ?? (prevDim ? steps[i - 1].dim! : []);
    const dim = dimK > 0.001 ? { ids: dimIds, k: dimK } : null;
    const m = build(pose, { ...opts, dim });
    const camera = cameraAt(
      t,
      steps.map((s, k) => (s.glide ? ([S[k], s.cam, s.glide] as const) : ([S[k], s.cam] as const))),
    );
    // A name kept by the next step stays up (one callout, no fade between steps).
    const runs: { n: NameSpec; a: number; b: number; k: number }[] = [];
    steps.forEach((s, k) => {
      for (const n of s.names ?? []) {
        const n1: NameSpec = typeof n === 'string' ? { id: n } : n;
        const same = runs.find((r) => r.b === S[k] && r.n.id === n1.id && String(r.n.p ?? '') === String(n1.p ?? '') && r.n.text === n1.text && r.n.sub === n1.sub && !n1.from);
        if (same) same.b = S[k + 1] ?? 2;
        else runs.push({ n: n1, a: S[k] + (n1.from ?? 0) * span(k), b: S[k + 1] ?? 2, k });
      }
    });
    const names: CalloutSpec[] = runs.map(({ n, a, b, k }) => ({ id: n.id, p: n.p ?? n.id, show: vis2(t, a, b), text: n.text, sub: n.sub, small: n.small, key: `${n.key ?? n.id}:${k}` }));
    const key = st.key ?? spec.key;
    return (
      <ModelView
        model={m}
        continuity={CONT}
        camera={camera}
        names={names}
        caption={st.caption ?? spec.caption}
        over={(at) => (
          <>
            {key && <ColourKey items={[...key]} show={1} title={st.keyTitle ?? spec.keyTitle ?? 'Kolorea'} y={46} />}
            {steps.map((s, k) =>
              s.note ? (
                <Note key={`n${k}`} x={500} y={612} tone={s.warn ? 'warn' : 'accent'} show={vis2(t, S[k], S[k + 1] ?? 2)}>
                  {s.note}
                </Note>
              ) : null,
            )}
            {steps.map((s, k) =>
              (s.marks ?? []).map((mk, j) => {
                const p = typeof mk.p === 'string' ? m.pts[mk.p] : mk.p;
                if (!p) return null;
                const q = at(p);
                const show = vis2(t, S[k] + 0.2 * span(k), S[k + 1] ?? 2);
                if (show <= 0.02) return null;
                return (
                  <text key={`m${k}-${j}`} x={q.x + (mk.dx ?? 0)} y={q.y + (mk.dy ?? -10)} textAnchor="middle" className="note note-accent" opacity={show} style={{ fontSize: 12.5, fontWeight: 600 }} pointerEvents="none">
                    {mk.text}
                  </text>
                );
              }),
            )}
            {spec.over?.(t, at, pose)}
          </>
        )}
      />
    );
  }
  if (!embryo) return View;
  function Scene(props: SceneProps) {
    return useGeoReady([EMBRYO5]) ? <View {...props} /> : <Loading3D />;
  }
  Scene.geo = ['embryo5'];
  return Scene;
}
