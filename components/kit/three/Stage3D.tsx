'use client';

import { useContext, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { mix } from '@/lib/sim/anim';
import { aimCamera, blendCamera, centreOf } from '@/lib/three-d/aim';
import { viewOf, project, type M4, type V3, type View3 } from '@/lib/three-d/math';
import { orbitCamera } from '@/lib/three-d/orbit';
import { KEY_LIGHT, projectItem, type Item3, type Projected, type Scene3 } from '@/lib/three-d/scene';
import { Part } from '../Part';
import { UnderlayContext, partState, useLabelScale, useScene } from '../context';
import type { GLApi, GLState } from './gl';

export type At3 = (p: V3, m?: M4) => { x: number; y: number; z: number };

interface Stage3DProps {
  scene: Scene3;
  /** Names, notes and anything else drawn over the 3D picture, placed with `at` (frame coordinates). */
  children?: (at: At3, view: View3) => ReactNode;
  /** The viewer may turn the picture by dragging it (default on). */
  orbit?: boolean;
  /** Three short axis names for the small orientation cross (up, towards the viewer, side). */
  axes?: { up: string; front: string; side: string; sideDir: V3; edges?: EdgeNames };
}

/**
 * The six anatomical directions by name (`side` is `sideDir`, `otherSide` its opposite). Given, the frame's
 * edge pills follow the camera: each edge names the direction that now points that way on screen.
 */
export interface EdgeNames {
  up: string;
  down: string;
  front: string;
  back: string;
  side: string;
  otherSide: string;
}
type Edges = { top?: string; bottom?: string; left?: string; right?: string };

/**
 * Which anatomical direction faces each edge of the frame for this camera. An edge is named only when
 * one direction clearly points that way (within ~55 degrees); a name, once shown, stays until another
 * clearly beats it, so the pills do not flicker while the picture turns between two directions.
 */
function edgesFor(m: M4, n: EdgeNames, sideDir: V3, was: Edges): Edges {
  const dirs: [V3, string, string][] = [
    [[0, 1, 0], n.up, n.down],
    [[0, 0, 1], n.front, n.back],
    [sideDir, n.side, n.otherSide],
  ];
  const cs = dirs.flatMap(([d, a, b]) => {
    const x = m[0] * d[0] + m[4] * d[1] + m[8] * d[2];
    const y = m[1] * d[0] + m[5] * d[1] + m[9] * d[2];
    return [
      { name: a, x, y },
      { name: b, x: -x, y: -y },
    ];
  });
  const pick = (score: (c: (typeof cs)[number]) => number, prev?: string) => {
    let best = cs.reduce((p, q) => (score(q) > score(p) ? q : p));
    const kept = prev ? cs.find((c) => c.name === prev) : undefined;
    if (kept && score(kept) > 0.42 && score(best) - score(kept) < 0.18) best = kept;
    return score(best) > (best === kept ? 0.42 : 0.58) ? best.name : undefined;
  };
  return { top: pick((c) => c.y, was.top), bottom: pick((c) => -c.y, was.bottom), left: pick((c) => -c.x, was.left), right: pick((c) => c.x, was.right) };
}
const sameEdges = (a: Edges, b: Edges) => a.top === b.top && a.bottom === b.bottom && a.left === b.left && a.right === b.right;

/** How long a turn asked for with the buttons (or a reset) takes. */
const TURN_MS = 420;

const STATE: Record<ReturnType<typeof partState>, GLState> = {
  idle: 'idle',
  dim: 'dim',
  active: 'active',
  focus: 'focus',
  spot: 'spot',
  shade: 'shade',
  ctx: 'ctx',
};

/**
 * A 3D view inside the usual scene frame. The picture is computed here from the scene's meshes and
 * camera (pure, synchronous: the server render and the tests see the same names and parts); inside
 * the viewport a lazily loaded WebGL layer under the SVG draws the shaded tissue, and the SVG keeps
 * only invisible outlines for pointing, plus the names. Without WebGL the outlines are drawn flat.
 */
/** How long the camera takes to turn to a structure put forward, and back. */
const GLIDE_MS = 1100;
const ease = (x: number) => x * x * x * (x * (x * 6 - 15) + 10);

/** The drag hint is a one-time lesson: once the viewer has turned a 3D view, it no longer takes room. */
let turnedOnce = false;

export function Stage3D({ scene, children, orbit = true, axes }: Stage3DProps) {
  const ctx = useScene();
  const ul = useContext(UnderlayContext);
  const [turn, setTurn] = useState({ yaw: 0, pitch: 0 });
  const [gl, setGl] = useState<GLApi | null>(null);
  const [ready, setReady] = useState(false);
  // WebGL could not start (or is very late): only then the coarse flat picture stands in for it.
  const [flatOnly, setFlatOnly] = useState(false);
  const drag = useRef<{ x: number; y: number; yaw: number; pitch: number; moved: boolean } | null>(null);
  // Turns asked for with the buttons or a reset glide there (a drag follows the pointer at once).
  const turnNow = useRef(turn);
  turnNow.current = turn;
  const [turnGoal, setTurnGoal] = useState<{ yaw: number; pitch: number; serial: number } | null>(null);
  const turnRaf = useRef(0);
  useEffect(() => {
    if (!turnGoal) return;
    const from = turnNow.current;
    const ms = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 1 : TURN_MS;
    let t0 = 0;
    const step = (now: number) => {
      t0 ||= now;
      const p = Math.min(1, (now - t0) / ms);
      const e = ease(p);
      setTurn({ yaw: from.yaw + (turnGoal.yaw - from.yaw) * e, pitch: from.pitch + (turnGoal.pitch - from.pitch) * e });
      if (p < 1) turnRaf.current = requestAnimationFrame(step);
    };
    turnRaf.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(turnRaf.current);
  }, [turnGoal]);
  const glideTurn = (to: { yaw: number; pitch: number }) => setTurnGoal((g) => ({ ...to, serial: (g?.serial ?? 0) + 1 }));

  // The camera the scene asks for, turned by the viewer's drag around its target.
  const cam = useMemo(() => orbitCamera(scene.camera, turn), [scene.camera, turn]);
  const orbitRequest = ul?.orbitRequest;
  const [appliedOrbit, setAppliedOrbit] = useState<typeof orbitRequest>(undefined);
  if (orbitRequest && orbit && appliedOrbit !== orbitRequest) {
    setAppliedOrbit(orbitRequest);
    const { direction } = orbitRequest;
    // From where the last asked-for turn is heading (quick presses add up), not from mid-glide.
    const base = turnGoal && !drag.current ? turnGoal : turn;
    glideTurn(direction === 'reset' ? { yaw: 0, pitch: 0 } : {
      yaw: base.yaw + (direction === 'left' ? 0.35 : direction === 'right' ? -0.35 : 0),
      pitch: Math.max(-1.1, Math.min(1.1, base.pitch + (direction === 'up' ? 0.22 : direction === 'down' ? -0.22 : 0))),
    });
  }

  // The structure put forward (the step's tour, the 3D tour): the camera turns to the side it is best
  // seen from, gliding there and back so the viewer always sees where the picture went.
  const spot = ctx.spotlight ?? null;
  const goalFor = (id: string | null) => (id ? aimCamera(cam, centreOf(scene.items, id, ctx.partsOf)) : cam);
  const [aim, setAim] = useState<{ from: string | null; to: string | null; p: number }>({ from: spot, to: spot, p: 1 });
  // A new structure: the glide starts from where the camera is aimed now (adjusted during render, so
  // the first frame never shows the end of the move).
  if (aim.to !== spot) setAim({ from: aim.p < 0.5 ? aim.from : aim.to, to: spot, p: 0 });
  const gliding = aim.p < 1;
  useEffect(() => {
    if (!gliding) return;
    // Reduced motion: the camera is simply there on the next frame.
    const ms = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 1 : GLIDE_MS;
    let raf = 0;
    let t0 = 0;
    const step = (now: number) => {
      t0 ||= now;
      const p = Math.min(1, (now - t0) / ms);
      setAim((a) => ({ ...a, p }));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [gliding, aim.to]);
  const display = gliding ? blendCamera(goalFor(aim.from), goalFor(spot), ease(aim.p)) : goalFor(spot);
  const view = viewOf(display);
  const light = scene.light ?? KEY_LIGHT;

  // The frame's edge pills follow the camera (the step's turns, the tour's glides and the viewer's drag).
  const setOrient = ul?.setOrient;
  const edges = useRef<Edges>({});
  const edgeNames = axes?.edges;
  const nextEdges = edgeNames && axes ? edgesFor(view.view, edgeNames, axes.sideDir, edges.current) : null;
  useEffect(() => {
    if (!setOrient || !nextEdges || sameEdges(nextEdges, edges.current)) return;
    edges.current = nextEdges;
    setOrient(nextEdges);
  });
  useEffect(
    () => () => {
      edges.current = {};
      setOrient?.(null);
    },
    [setOrient],
  );

  const host = ul?.host ?? null;
  // The flat fallback is drawn without a viewport (server render, tests) or when WebGL fails. While the
  // WebGL layer is starting (well under a second) nothing is drawn: the coarse flat meshes would flash
  // a jagged picture before the smooth one.
  const flat = !ready && (!host || flatOnly);
  // Starting up: the spinner stands in for the picture, and its names wait for it.
  const waiting = !!host && !ready && !flatOnly;
  const drawn = scene.items
    .filter((it) => (it.show ?? 1) * (it.opacity ?? 1) > 0.01)
    .map((it) => ({ it, pr: projectCached(it, view, light, flat) }))
    .sort((a, b) => b.pr.depth - a.pr.depth);

  useEffect(() => {
    if (!host) return;
    let dead = false;
    let api: GLApi | null = null;
    const late = window.setTimeout(() => setFlatOnly(true), 2500);
    import('./gl')
      .then((m) => {
        if (dead) return;
        api = m.createGL(host, () => {
          window.clearTimeout(late);
          setReady(true);
        });
        setGl(api);
        if (!api) setFlatOnly(true);
      })
      .catch(() => !dead && setFlatOnly(true));
    return () => {
      dead = true;
      window.clearTimeout(late);
      api?.dispose();
      setGl(null);
      setReady(false);
      setFlatOnly(false);
    };
  }, [host]);

  const sceneEl = ul?.scene ?? null;
  useEffect(() => gl?.follow(sceneEl), [gl, sceneEl]);

  // Every render hands the WebGL layer this frame's meshes, matrices and highlight states.
  useLayoutEffect(() => {
    gl?.frame({
      view: view.view,
      proj: view.proj,
      light,
      items: drawn.map(({ it }) => ({
        key: it.key,
        mesh: it.mesh,
        matrix: it.matrix,
        color: it.color,
        deep: it.deep,
        tissue: it.tissue ?? 'skin',
        opacity: (it.show ?? 1) * (it.opacity ?? 1),
        outline: it.outline ?? true,
        state: it.id ? STATE[partState(ctx, it.id, it.groups)] : ctx.hovered || ctx.selected || ctx.spotlight ? 'ctx' : 'idle',
        quiet: !!it.quiet,
        clip: it.clip,
      })),
    });
  });

  const at: At3 = (p, m) => {
    const q = m ? applyPoint(m, p) : p;
    const r = project(view, q);
    return { x: r.x, y: r.y, z: r.z };
  };

  const canTurn = orbit && !ul?.zoomed;
  return (
    <g
      className={`stage3d${ready ? ' is-gl' : ''}`}
      onPointerDown={(e) => {
        if (!canTurn || e.button !== 0) return;
        // A drag takes over from a glide where it is.
        cancelAnimationFrame(turnRaf.current);
        drag.current = { x: e.clientX, y: e.clientY, yaw: turn.yaw, pitch: turn.pitch, moved: false };
      }}
      onPointerMove={(e) => {
        const d = drag.current;
        if (!d) return;
        const dx = e.clientX - d.x;
        const dy = e.clientY - d.y;
        if (!d.moved && Math.hypot(dx, dy) < 5) return;
        if (!d.moved) {
          d.moved = true;
          turnedOnce = true;
          (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
        }
        setTurn({ yaw: d.yaw - dx * 0.007, pitch: Math.max(-1.1, Math.min(1.1, d.pitch + dy * 0.006)) });
      }}
      onPointerUp={() => setTimeout(() => (drag.current = null), 0)}
      onPointerCancel={() => { drag.current = null; }}
      onLostPointerCapture={() => { setTimeout(() => (drag.current = null), 0); }}
      onClickCapture={(e) => {
        // A drag that turned the picture is not a click on what it started on.
        if (drag.current?.moved) e.stopPropagation();
      }}
      onDoubleClick={() => glideTurn({ yaw: 0, pitch: 0 })}
    >
      {canTurn && <rect className="stage3d-orbit" x={0} y={0} width={1000} height={640} fill="transparent" />}
      {drawn.map(({ it, pr }) => {
        if (!pr.any) return null;
        const deep = it.deep ?? mix(it.color, '#000000', 0.55);
        const lit = mix(it.color, '#ffffff', 0.22);
        const flatEl = flat && (
          <g className="stage3d-flat" opacity={it.opacity ?? 1}>
            <path d={pr.bands[0]} fill={deep} stroke={deep} strokeWidth={0.6} strokeLinejoin="round" />
            <path d={pr.bands[1]} fill={it.color} stroke={it.color} strokeWidth={0.6} strokeLinejoin="round" />
            <path d={pr.bands[2]} fill={lit} stroke={lit} strokeWidth={0.6} strokeLinejoin="round" />
          </g>
        );
        if (!it.id)
          return (
            <g key={it.key} opacity={it.show ?? 1} pointerEvents="none">
              {flatEl}
            </g>
          );
        return (
          <Part key={it.key} id={it.id} groups={it.groups} quiet={it.quiet} show={it.show ?? 1}>
            {flatEl}
            <path className="stage3d-hit" d={pr.d} />
          </Part>
        );
      })}
      {waiting && <Loading3D />}
      {!waiting && axes && <Axes view={view} axes={axes} hint={canTurn && ready && !turnedOnce} />}
      {!waiting && children?.(at, view)}
    </g>
  );
}

/**
 * The last projection of each item: while the camera, the item's matrix and its cut stay the same (most
 * frames of a played view: only highlights and visibility change), its outlines are not projected again.
 */
const projections = new Map<string, { mesh: object; sig: string; pr: Projected }>();
function projectCached(it: Item3, view: View3, light: V3, flat: boolean) {
  const mesh = it.hit ?? it.mesh;
  const sig = `${flat ? 1 : 0}|${Array.prototype.join.call(view.vp, ',')}|${it.matrix ? Array.prototype.join.call(it.matrix, ',') : ''}|${light.join(',')}|${it.clip ? JSON.stringify(it.clip) : ''}`;
  const last = projections.get(it.key);
  if (last && last.mesh === mesh && last.sig === sig) return last.pr;
  const pr = projectItem(it, view, light, flat);
  projections.set(it.key, { mesh, sig, pr });
  return pr;
}

/** Shown for the moment a 3D view's geometry is still being built (off the main thread). */
export function Loading3D() {
  return (
    <g className="stage3d-loading" pointerEvents="none" aria-label="3D eredua prestatzen">
      <circle cx={500} cy={300} r={22} fill="none" stroke="rgba(232,238,252,0.16)" strokeWidth={4} />
      <path d="M500,278 A22,22 0 0 1 522,300" fill="none" stroke="rgba(232,238,252,0.7)" strokeWidth={4} strokeLinecap="round">
        <animateTransform attributeName="transform" type="rotate" from="0 500 300" to="360 500 300" dur="0.9s" repeatCount="indefinite" />
      </path>
      <text x={500} y={350} textAnchor="middle" fontSize={15} fill="rgba(232,238,252,0.72)">
        3D eredua prestatzen…
      </text>
    </g>
  );
}

const sstep = (a: number, b: number, x: number) => {
  const u = Math.max(0, Math.min(1, (x - a) / (b - a)));
  return u * u * (3 - 2 * u);
};

function applyPoint(m: M4, p: V3): V3 {
  return [m[0] * p[0] + m[4] * p[1] + m[8] * p[2] + m[12], m[1] * p[0] + m[5] * p[1] + m[9] * p[2] + m[13], m[2] * p[0] + m[6] * p[1] + m[10] * p[2] + m[14]];
}

/**
 * Which way is which in a 3D view: a small orientation key that turns with the picture, on its own
 * plate in the top-left corner under the view's caption (the one corner the 3D scenes keep for it;
 * names live in the side columns, step notes at the foot). The cross only draws the directions; their
 * names are a legend beside it, so no name ever lands on another or on the drawing. How to turn the
 * picture is said once by the shell, in its view corner (never on the drawing), so `hint` is unused.
 */
function Axes({ view, axes }: { view: View3; axes: NonNullable<Stage3DProps['axes']>; hint: boolean }) {
  // Kept legible on small frames, like the names (but it grows less: it is a key, not the subject).
  const k = Math.min(1.5, useLabelScale().k);
  const dirs: { d: V3; name: string; c: string }[] = [
    { d: [0, 1, 0], name: axes.up, c: '#e8eefc' },
    { d: [0, 0, 1], name: axes.front, c: '#ffb86b' },
    { d: axes.sideDir, name: axes.side, c: '#8fb4f7' },
  ];
  // Directions in camera space (rotation part of the view matrix), drawn as a flat projection.
  const m = view.view;
  const cx = 26;
  const cy = 27;
  const L = 17;
  const rows = 13;
  const legendX = 54;
  const longest = Math.max(...dirs.map((d) => d.name.length));
  const w = legendX + 15 + longest * 5.9 + 10;
  const h = 54;
  return (
    <g pointerEvents="none" aria-hidden className="axes3d" transform={`translate(20 52) scale(${k})`}>
      <rect className="axes3d-plate" x={0} y={0} width={w} height={h} rx={9} />
      {dirs.map(({ d, name, c }, i) => {
        const x = m[0] * d[0] + m[4] * d[1] + m[8] * d[2];
        const y = m[1] * d[0] + m[5] * d[1] + m[9] * d[2];
        const z = m[2] * d[0] + m[6] * d[1] + m[10] * d[2];
        const tip: [number, number] = [cx + x * L, cy - y * L];
        const back = z < 0;
        // Pointing at (dot) or away from (ring) the viewer, the line shortens to nothing: it fades out as
        // the end mark fades in, gradually, so the key never jumps while the picture turns.
        const lineK = sstep(0.12, 0.42, Math.hypot(x, y));
        return (
          <g key={name} opacity={1 - 0.5 * sstep(0.05, 0.45, -z)}>
            {lineK > 0.01 && (
              <g opacity={lineK}>
                <line x1={cx} y1={cy} x2={tip[0]} y2={tip[1]} stroke={c} strokeWidth={2.2} strokeLinecap="round" />
                <circle cx={tip[0]} cy={tip[1]} r={2.4} fill={c} />
              </g>
            )}
            {lineK < 0.99 && <circle cx={cx} cy={cy} r={back ? 4.2 : 3.4} fill={back ? 'none' : c} stroke={c} strokeWidth={1.6} opacity={1 - lineK} />}
            <line x1={legendX} y1={14 + i * rows} x2={legendX + 9} y2={14 + i * rows} stroke={c} strokeWidth={2.2} strokeLinecap="round" />
            <text x={legendX + 15} y={14 + i * rows} dy="0.35em" fontSize={10.5} className="axes3d-name">
              {name}
            </text>
          </g>
        );
      })}
    </g>
  );
}
