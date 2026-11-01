'use client';

import { Callouts, Note, lerp, useScene, type Callout, type SceneProps } from '@/components/kit';
import { Stage3D, type At3 } from '@/components/kit/three/Stage3D';
import { blendCamera } from '@/lib/three-d/aim';
import { add, deg, norm, sub, type Camera3, type V3, type View3 } from '@/lib/three-d/math';
import type { Scene3 } from '@/lib/three-d/scene';
import { ownCentre, visibleAnchor } from '@/lib/three-d/occlusion';
import { seg } from '@/lib/sim/anim';
import { vis } from './common';
import { POSE0, centreline, caudal, heartModel, type HeartOpts, type HeartPose } from './model3d';

/**
 * The heart in 3D for stages 4–5 of topic 10 (notes 2: bihotz lakioaren eraketa): the straight tube
 * gets its segments, then folds into the loop. One model (heart3d.ts), one camera per step, gliding
 * between them so the viewer always sees from where to where the picture moved.
 */

// ———————————————————————————— camera ————————————————————————————

/** A camera round the heart: yaw 0 = from the front (ventral), +90 = from the embryo's left side. */
export function orbit(yaw: number, elev: number, dist = 9.4, target: V3 = [0, 0.15, 0], shift: [number, number] = [0, 0], fov = 30): Camera3 {
  const y = deg(yaw);
  const e = deg(elev);
  return { eye: add(target, [Math.sin(y) * Math.cos(e) * dist, Math.sin(e) * dist, Math.cos(y) * Math.cos(e) * dist]), target, up: [0, 1, 0], fov, shift };
}

const glide = (x: number) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * x * (x * (x * 6 - 15) + 10));

/**
 * Camera keyframes over stage time: [t, camera] or [t, camera, glide]; between two keys the camera glides
 * round the target. A key's own glide length is for a large turn (over ~75°), so it is never a whip-pan.
 */
export function cameraAt(t: number, keys: readonly (readonly [number, Camera3] | readonly [number, Camera3, number])[], glideLen = 0.035): Camera3 {
  let cam = keys[0][1];
  for (let i = 1; i < keys.length; i++) {
    const [tk, ck] = keys[i];
    if (t <= tk) break;
    const k = glide((t - tk) / (keys[i][2] ?? glideLen));
    cam = k >= 1 ? ck : blendCamera(cam, ck, k);
  }
  return cam;
}

// ———————————————————————————— drawing helpers ————————————————————————————

/** A route seen in 3D (where a part of the tube travels), drawn as a soft arrow over the picture. */
export function Trail({ pts, at, show, color = '#ffd27a', progress = 1 }: { pts: V3[]; at: At3; show: number; color?: string; progress?: number }) {
  if (show <= 0.02 || pts.length < 2) return null;
  const n = Math.max(2, Math.round(pts.length * Math.min(1, progress)));
  const P = pts.slice(0, n).map((p) => at(p));
  const d = P.map((p, i) => `${i ? 'L' : 'M'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join('');
  const a = P[P.length - 2];
  const b = P[P.length - 1];
  const ang = Math.atan2(b.y - a.y, b.x - a.x);
  const hd = 13;
  const head = `M${b.x.toFixed(1)},${b.y.toFixed(1)}L${(b.x - hd * Math.cos(ang - 0.45)).toFixed(1)},${(b.y - hd * Math.sin(ang - 0.45)).toFixed(1)}L${(b.x - hd * Math.cos(ang + 0.45)).toFixed(1)},${(b.y - hd * Math.sin(ang + 0.45)).toFixed(1)}Z`;
  return (
    <g opacity={show} pointerEvents="none">
      <path d={d} fill="none" stroke="rgba(10,6,12,0.75)" strokeWidth={6.5} strokeLinecap="round" strokeLinejoin="round" />
      <path d={d} fill="none" stroke={color} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={P[0].x} cy={P[0].y} r={4.2} fill={color} stroke="rgba(10,6,12,0.75)" strokeWidth={1.4} />
      <path d={head} fill={color} stroke="rgba(10,6,12,0.75)" strokeWidth={1.4} strokeLinejoin="round" />
    </g>
  );
}

/**
 * The notes' words for a movement drawn on the moving part: one short arrow per direction of the
 * embryo (aurrera = ventral +z, behera = caudal −y, eskuinera = the embryo's right −x…), projected,
 * with its word at the tip, so "forward, down and right" is read in the picture as the camera turns.
 */
export function DirArrows({ at, p, dirs, show, len = 0.62 }: { at: At3; p: V3; dirs: { v: V3; text: string; color: string }[]; show: number; len?: number }) {
  if (show <= 0.02) return null;
  const o = at(p);
  return (
    <g opacity={show} pointerEvents="none">
      {dirs.map(({ v, text, color }) => {
        const q = at([p[0] + v[0] * len, p[1] + v[1] * len, p[2] + v[2] * len]);
        const dx = q.x - o.x;
        const dy = q.y - o.y;
        const l = Math.hypot(dx, dy);
        // Seen end-on (pointing at the viewer or away) an arrow has no direction on screen: it never gets a
        // made-up one. It shortens and fades out as a dot (towards you) or a crossed ring (away) fades in.
        const flat = Math.max(0, Math.min(1, (l - 12) / 22));
        const k = flat * flat * (3 - 2 * flat);
        const toward = q.z < o.z;
        const ang = Math.atan2(dy, dx);
        const hd = 11;
        const ex = q.x;
        const ey = q.y;
        const head = `M${ex.toFixed(1)},${ey.toFixed(1)}L${(ex - hd * Math.cos(ang - 0.45)).toFixed(1)},${(ey - hd * Math.sin(ang - 0.45)).toFixed(1)}L${(ex - hd * Math.cos(ang + 0.45)).toFixed(1)},${(ey - hd * Math.sin(ang + 0.45)).toFixed(1)}Z`;
        const tl = l || 1;
        // The word: past the tip while the arrow reads, beside the end-on mark when it does not.
        const tx = lerp(o.x + 40, ex + (dx / tl) * 34, k);
        const ty = lerp(o.y - 22, ey + (dy / tl) * 16, k);
        return (
          <g key={text}>
            {k > 0.01 && (
              <g opacity={k}>
                <line x1={o.x} y1={o.y} x2={ex} y2={ey} stroke="rgba(10,6,12,0.8)" strokeWidth={6} strokeLinecap="round" />
                <line x1={o.x} y1={o.y} x2={ex} y2={ey} stroke={color} strokeWidth={3} strokeLinecap="round" />
                <path d={head} fill={color} stroke="rgba(10,6,12,0.8)" strokeWidth={1.2} />
              </g>
            )}
            {k < 0.99 && (
              <g opacity={1 - k}>
                <circle cx={o.x} cy={o.y} r={10} fill="rgba(10,6,12,0.75)" stroke={color} strokeWidth={2.4} />
                {toward ? (
                  <circle cx={o.x} cy={o.y} r={3.6} fill={color} />
                ) : (
                  <path d={`M${o.x - 6},${o.y - 6}L${o.x + 6},${o.y + 6}M${o.x + 6},${o.y - 6}L${o.x - 6},${o.y + 6}`} stroke={color} strokeWidth={2.2} strokeLinecap="round" />
                )}
              </g>
            )}
            <Note x={tx} y={ty} size={13} tone="accent">
              {k < 0.5 ? `${text} (${toward ? 'zuregana' : 'zugandik urrun'})` : text}
            </Note>
          </g>
        );
      })}
    </g>
  );
}

/** The directions of the loop, in the embryo's axes (x left, y cranial, z ventral). */
export const DIRS = {
  aurrera: [0, 0, 1] as V3,
  atzera: [0, 0, -1] as V3,
  gora: [0, 1, 0] as V3,
  behera: [0, -1, 0] as V3,
  ezkerrera: [1, 0, 0] as V3,
  eskuinera: [-1, 0, 0] as V3,
};

const travels = new Map<string, V3[]>();

/** Where a point of the tube goes as the loop runs (for the trails): u along the tube, loop range. */
export function travel(u: number, from: number, to: number, base: Partial<HeartPose> = {}, n = 16, tail = false): V3[] {
  // The same trail every frame of a step: worked out once.
  const key = JSON.stringify([u, from, to, base, n, tail]);
  const known = travels.get(key);
  if (known) return known;
  if (travels.size > 64) travels.clear();
  const out = travelPath(u, from, to, base, n, tail);
  travels.set(key, out);
  return out;
}

function travelPath(u: number, from: number, to: number, base: Partial<HeartPose>, n: number, tail: boolean): V3[] {
  return Array.from({ length: n }, (_, i) => {
    const L = from + ((to - from) * i) / (n - 1);
    const pose: HeartPose = { ...POSE0, ...base, loop: tail ? (base.loop ?? 0) : L, loopTail: tail ? L : undefined };
    const line = centreline(pose, 60);
    if (u >= 1) {
      const cd = caudal(pose, line);
      return [(cd.atrium[0][0] + cd.atrium[1][0]) / 2, (cd.atrium[0][1] + cd.atrium[1][1]) / 2, (cd.atrium[0][2] + cd.atrium[1][2]) / 2] as V3;
    }
    return line[Math.round(u * 60)];
  });
}

export interface CalloutSpec {
  id: string;
  /** A named point of the model (heart3d `pts`), or a point. */
  p: string | V3;
  show: number;
  small?: boolean;
  text?: string;
  /** A second, smaller line under the name. */
  sub?: string;
  key?: string;
}

const AXES = {
  up: 'kraneala',
  front: 'bentrala (aurrea)',
  side: 'ezkerra',
  sideDir: [1, 0, 0] as V3,
  // The frame's edge pills follow the camera: whatever way the heart is turned, they say which way is which.
  edges: { up: 'Kraneala', down: 'Kaudala', front: 'Bentrala', back: 'Dortsala', side: 'Ezkerra', otherSide: 'Eskuina' },
};

type ViewProps = {
  camera: Camera3;
  names: CalloutSpec[];
  /** `asked`: 1 while the picture is seen as the step shows it, fading to 0 as the viewer turns it away. */
  over?: (at: At3, asked: number) => React.ReactNode;
  caption?: string;
  /** The right column's span (top, bottom); a view can keep it above the camera keys (bottom right). */
  right?: [number, number];
  /** Other axes than the body's (a section block whose up is dorsal). */
  axes?: typeof AXES;
};

/** One 3D heart view: the model for a pose, a camera, and the names. */
export function HeartView({ pose, opts, ...rest }: ViewProps & { pose: HeartPose; opts: HeartOpts }) {
  return <ModelView model={heartModel(pose, opts)} continuity="bihotza-10" {...rest} />;
}

/** Any model of topic 10 in 3D (the heart, the right atrium): the same axes, camera keys and names. */
export function ModelView({
  model,
  continuity,
  camera,
  names,
  over,
  caption,
  right,
  axes = AXES,
}: ViewProps & { model: { items: Scene3['items']; pts: Record<string, V3> }; continuity: string }) {
  const scene: Scene3 = { camera, items: model.items };
  const { mentioned, partsOf } = useScene();
  return (
    <g>
      <rect x={0} y={0} width={1000} height={640} fill="none" />
      <Stage3D scene={scene} axes={axes} continuity={continuity}>
        {(at, view) => {
          // Directional captions describe the step's reference camera. After a turn, label that
          // reference explicitly; the frame edges and camera keys describe the current view.
          const asked = askedView(camera, view);
          const items: Callout[] = [];
          const inFrame = (q: V3) => {
            const s = at(q);
            return s.x > 30 && s.x < 970 && s.y > 30 && s.y < 610;
          };
          for (const n of names) {
            if (n.show <= 0.01) continue;
            const p = typeof n.p === 'string' ? model.pts[n.p] : n.p;
            if (!p) continue;
            // A dot behind another structure would sit on that one: it moves to the part of its own the eye sees.
            const q = at(typeof n.p === 'string' ? visibleAnchor(model.items, view.eye, p, n.id, inFrame) : p);
            items.push({ id: n.id, at: q, show: n.show, small: n.small, text: n.text, sub: n.sub, key: n.key });
          }
          // What the step's text says is named too, when the model draws it in the frame, even where the
          // scene's own callouts leave it out at this moment.
          for (const id of mentioned ?? []) {
            if (items.some((c) => c.id === id && c.show > 0.3)) continue;
            // Drawn (as itself, as a group of parts, or as the members of a whole), named where the model says
            // or else at its biggest piece.
            const own = [id, ...(partsOf?.(id) ?? [])].find((o) => ownCentre(model.items, o));
            if (!own) continue;
            const q = visibleAnchor(model.items, view.eye, model.pts[id] ?? model.pts[own] ?? ownCentre(model.items, own)!, own, inFrame);
            if (!inFrame(q)) continue;
            items.push({ id, key: `${id}-said`, at: at(q), show: 1, small: true });
          }
          return (
            <>
              {over?.(at, asked)}
              <Callouts items={items} left={[120, 580]} right={right ?? [240, 580]} />
              {caption && (
                <Note x={24} y={24} size={12.5} align="start">
                  {asked < 0.5 ? `Hasierako ikuspegia: ${caption}` : caption}
                </Note>
              )}
            </>
          );
        }}
      </Stage3D>
    </g>
  );
}

/** 1 while the view looks from where the step's camera does, 0 once turned ~25 degrees or more away. */
function askedView(camera: Camera3, view: View3) {
  const e = norm(sub(camera.eye, camera.target));
  const m = view.view;
  const c = e[0] * m[2] + e[1] * m[6] + e[2] * m[10];
  const u = Math.max(0, Math.min(1, (c - 0.9) / (0.97 - 0.9)));
  return u * u * (3 - 2 * u);
}

// ———————————————————————————— stage 4: the segments (21–22 days) ————————————————————————————

/** Step starts of stage 4 (bihotz-atalak). */
export const S4 = [0, 0.13, 0.27, 0.4, 0.53, 0.66, 0.8] as const;

export function SegmentsScene({ t }: SceneProps) {
  // The two endocardial tubes zip together from the cranial end down first, then the constrictions appear.
  const fuse = 0.62 + 0.38 * seg(t, S4[1] + 0.005, S4[1] + 0.065);
  const segs = seg(t, S4[1] + 0.06, S4[1] + 0.1);
  const cBulb = seg(t, S4[2], S4[2] + 0.04);
  const cVent = seg(t, S4[3], S4[3] + 0.03);
  const cAtr = seg(t, S4[3] + 0.04, S4[3] + 0.07);
  const cSin = seg(t, S4[4], S4[4] + 0.04);
  // Colours appear segment by segment from the top down, as each is named.
  const pose: HeartPose = { ...POSE0, fuse, segs, colour: 0, colourBy: { bulbus: cBulb, ventricle: cVent, atrium: cAtr, sinus: cSin }, loop: 0, arches: 1, veins: 1, glass: seg(t, S4[6], S4[6] + 0.03) * 0.9 };
  const flow = vis(t, S4[6] + 0.02, 2);
  const opts: HeartOpts = {
    cavity: 1,
    septum: 1,
    gut: 0.55,
    aortas: 1,
    flow: flow > 0 ? { phase: t * 28, show: flow, mixed: true } : null,
  };
  const camera = cameraAt(t, [
    [0, orbit(28, 14, 11, [0, 0.0, -0.4], [40, 10])],
    [S4[1], orbit(8, 6, 10.6, [0, -0.3, 0], [40, 6])],
    [S4[5], orbit(-72, 10, 11, [0, -0.35, -0.2], [40, 6])],
    [S4[6], orbit(10, 8, 10.6, [0, -0.3, 0], [40, 6])],
  ]);
  const L = 1;
  const names: CalloutSpec[] = [
    { id: 'bihotz-hodia', p: 'bihotz-hodia', show: vis(t, 0, S4[2]) * L, key: 'bihotz-hodia:4' },
    { id: 'bihotz-hodiak', p: 'bihotz-hodiak', show: vis(t, 0, S4[1] + 0.062) * L, small: true },
    { id: 'arteria-muturra', p: 'aorta-zakua', show: vis(t, 0, S4[2]) * L },
    { id: 'aorta-arkuak', p: 'aorta-arkuak1', show: L },
    { id: 'aorta-dortsalak', p: 'aorta-dortsalak1', show: L, small: true },
    { id: 'zain-muturra', p: 'zain-sinua', show: vis(t, 0, S4[4]) * L },
    { id: 'perikardio-barrunbea', p: 'perikardio-barrunbea', show: L },
    { id: 'septum-transversum', p: 'septum-transversum', show: L, small: true },
    { id: 'aorta-zakua', p: 'aorta-zakua', show: cBulb },
    { id: 'atal-bulbarra', p: 'atal-bulbarra', show: cBulb },
    { id: 'atal-bentrikularra', p: 'atal-bentrikularra', show: cVent },
    { id: 'atal-aurikularra', p: 'atal-aurikularra', show: cAtr },
    { id: 'zain-sinua', p: 'zain-sinua', show: cSin },
    { id: 'zilbor-zainak', p: 'zilbor-zainak1', show: cSin, small: true },
    { id: 'bitelo-zainak', p: 'bitelo-zainak0', show: cSin, small: true },
    { id: 'bena-kardinal-komuna', p: 'bena-kardinal-komuna1', show: cSin, small: true },
    { id: 'aurreko-hestea', p: 'aurreko-hestea', show: vis(t, S4[5], S4[6]), small: true },
  ];
  return (
    <HeartView
      pose={pose}
      opts={opts}
      camera={camera}
      names={names}
      caption="21.–22. egunak · bihotz hodia aurretik (3D eredua)"
      over={(at) => {
        // The blood's way, as a route along the tube (p10).
        const line = centreline(pose, 60);
        const cd = caudal(pose, line);
        const route: V3[] = [cd.horn[1], cd.atrium[1], ...[...line].reverse().filter((_, i) => i % 3 === 0)];
        return (
          <>
            <Trail pts={route} at={at} show={vis(t, S4[6] + 0.01, 2) * 0.9} progress={seg(t, S4[6] + 0.01, S4[6] + 0.08)} color="#ffd27a" />
            <Note x={500} y={612} tone="accent" show={vis(t, S4[1], S4[1] + 0.07)}>
              Bi endokardio hodiak goitik behera fusionatzen dira: bihotz hodi bakarra
            </Note>
            <Note x={500} y={612} tone="accent" show={vis(t, S4[1] + 0.07, S4[2])}>
              Estuguneak eta zabalkuntzak goitik behera: atal desberdinak
            </Note>
            <Note x={500} y={612} tone="accent" show={vis(t, S4[5], S4[6])}>
              Bulboa eta bentrikulua perikardio barrunbean · aurikulak eta zain sinuak septum transversumean
            </Note>
            <Note x={500} y={612} tone="accent" show={vis(t, S4[6], 2)}>
              Zainak → zain sinuak → atal aurikularra → atal bentrikularra → atal bulbarra
            </Note>
          </>
        );
      }}
    />
  );
}

// ———————————————————————————— stage 5: the loop (23–28 days) ————————————————————————————

/** Step starts of stage 5 (bihotz-lakioa). */
export const S5 = [0, 0.12, 0.26, 0.4, 0.58, 0.7, 0.8, 0.92] as const;

export function LoopScene({ t }: SceneProps) {
  // The two ends move one after the other (p13, p14), then the whole loop is replayed segment by segment (p16–p19).
  const head = seg(t, S5[1] + 0.01, S5[1] + 0.1);
  const tail = seg(t, S5[2] + 0.01, S5[2] + 0.1);
  const replay = seg(t, S5[3] + 0.02, S5[3] + 0.16);
  const inReplay = t >= S5[3] && t < S5[4];
  const loop = inReplay ? replay : t >= S5[4] ? 1 : head;
  const loopTail = inReplay ? replay : t >= S5[4] ? 1 : tail;
  const atriaFuse = seg(t, S5[4] + 0.01, S5[4] + 0.08);
  const pose: HeartPose = { ...POSE0, fuse: 1, segs: 1, colour: 1, loop, loopTail, atriaFuse, arches: 1, veins: 0.5 + 0.5 * vis(t, S5[6], 2) };
  const ghost = vis(t, S5[1], 2) > 0 ? { ...POSE0, segs: 1, colour: 1 } : null;
  const opts: HeartOpts = { cavity: 0.8, aortas: 0.35, ghost };
  const camera = cameraAt(t, [
    [0, orbit(6, 6, 9.6, [0, 0.1, 0], [40, 0])],
    [S5[1], orbit(-38, 14, 9.8, [-0.1, 0.1, 0.2], [40, 0])],
    [S5[2], orbit(64, 14, 9.8, [0.1, 0.2, -0.2], [40, 0])],
    [S5[3], orbit(-30, 18, 9.8, [0, 0.1, 0], [40, 0])],
    [S5[4], orbit(4, 8, 9.4, [0, 0.2, 0], [40, 0])],
    // From the right and a little above: front (bulb) and back (atrium, sinus) side by side, without
    // swinging round behind the heart and back again within one step.
    [S5[6], orbit(-72, 22, 9.8, [0, 0.2, -0.1], [40, 0])],
    [S5[7], orbit(0, 6, 9.2, [0, 0.25, 0], [40, 0])],
  ]);
  // During the replay each segment glows as its direction is said.
  const r = (a: number, b: number) => (inReplay ? vis(t, S5[3] + a, S5[3] + b) : 0);
  const names: CalloutSpec[] = [
    { id: 'atal-bulbarra', p: 'atal-bulbarra', show: 1 },
    { id: 'atal-bentrikularra', p: 'atal-bentrikularra', show: 1 },
    { id: 'atal-aurikularra', p: 'atal-aurikularra', show: 1 },
    { id: 'zain-sinua', p: 'zain-sinua', show: 1 },
    { id: 'bihotz-hodia', p: 'atal-bentrikularra', show: vis(t, 0, S5[1]), key: 'bihotz-hodia:5' },
    { id: 'atal-bulbobentrikularra', p: 'atal-bulbobentrikularra', show: vis(t, S5[3], S5[4]), small: true },
    { id: 'arteria-muturra', p: 'aorta-zakua', show: vis(t, 0, S5[3]), small: true },
    { id: 'zain-muturra', p: 'eskuineko-sinu-luzapena', show: vis(t, 0, S5[3]), small: true },
    { id: 'erreten-aurikulubentrikularra', p: 'erreten-aurikulubentrikularra', show: vis(t, S5[6], 2), small: true },
    { id: 'bihotz-lakioa', p: [0.9, -0.9, 0.4], show: vis(t, S5[4] + 0.06, 2), small: true },
  ];
  return (
    <HeartView
      pose={pose}
      opts={opts}
      camera={camera}
      names={names}
      caption={t < S5[1] ? '23. eguna · bihotz hodi luze eta zuzena' : t < S5[6] ? '23.–28. egunak · bihotz hodia tolesten (zuria: hasierako hodia)' : '28. eguna · bihotz lakioa'}
      over={(at, asked) => {
        const bulb = travel(0.44, 0, 1);
        const atr = travel(1, 0, 1, { loop: 1 }, 16, true);
        const line = centreline(pose, 60);
        const cd = caudal(pose, line);
        const bulbNow = line[Math.round(0.44 * 60)];
        const atrNow = add(cd.atrium[1], [0, 0.05, 0]);
        // The ventricular part (between the proximal bulbus and the atrium) during the replay (p17).
        const ventNow = line[Math.round(0.68 * 60)];
        const G = '#7ee0a0';
        const O = '#ffb070';
        const cran = [
          { v: DIRS.aurrera, text: 'aurrera', color: G },
          { v: DIRS.behera, text: 'behera', color: G },
          { v: DIRS.eskuinera, text: 'eskuinera', color: G },
        ];
        const caud = [
          { v: DIRS.atzera, text: 'atzera', color: O },
          { v: DIRS.gora, text: 'gora', color: O },
          { v: DIRS.ezkerrera, text: 'ezkerrera', color: O },
        ];
        return (
          <>
            <DirArrows at={at} p={bulbNow} dirs={cran} show={vis(t, S5[1] + 0.012, S5[2]) + vis(t, S5[3] + 0.01, S5[3] + 0.08)} />
            <DirArrows at={at} p={atrNow} dirs={caud} show={vis(t, S5[2] + 0.012, S5[3]) + vis(t, S5[3] + 0.09, S5[4])} />
            <Trail pts={bulb} at={at} show={vis(t, S5[1], S5[2]) + vis(t, S5[3], S5[3] + 0.09)} progress={inReplay ? replay * 2 : head} color="#7ee0a0" />
            <Trail pts={atr} at={at} show={vis(t, S5[2], S5[3]) + vis(t, S5[3] + 0.09, S5[4])} progress={inReplay ? (replay - 0.3) * 1.6 : tail} color="#ffb070" />
            <Note x={500} y={612} tone="accent" show={vis(t, S5[1], S5[2])}>
              Alde zefalikoa (arteria bulboa): aurrera, behera eta eskuinera
            </Note>
            <Note x={500} y={612} tone="accent" show={vis(t, S5[2], S5[3])}>
              Alde kaudala (zain sinua eta aurikula): atzera, gora eta ezkerrera
            </Note>
            <DirArrows at={at} p={ventNow} dirs={[{ v: DIRS.ezkerrera, text: 'ezkerrera', color: '#67e8f9' }]} show={r(0.03, 0.09)} />
            <Note x={500} y={612} tone="accent" show={r(0, 0.09)}>
              Atal bulbobentrikularra: aurrera, behera eta eskuinera · atal bentrikularra: ezkerrera
            </Note>
            <Note x={500} y={612} tone="accent" show={r(0.09, S5[4] - S5[3])}>
              Atal aurikularrak: ezkerrera, atzera eta gora, atal bulbarraren goi-atzekaldera
            </Note>
            <Note x={500} y={612} tone="accent" show={vis(t, S5[4], S5[5])}>
              Bikoitzak diren egiturak fusionatzen dira: bihotz hodia → bihotz lakioa
            </Note>
            <Note x={500} y={612} tone="warn" show={vis(t, S5[5], S5[6]) * asked}>
              Aurretik begiratzen dugu: enbrioiaren eskuina zure ezkerrean dago
            </Note>
            <Note x={500} y={612} tone="accent" show={vis(t, S5[6], 2)}>
              Bulboa aurre-eskuinean · bentrikulua ezkerrean · aurikula goi-atzean · zain sinua atzean
            </Note>
          </>
        );
      }}
    />
  );
}
