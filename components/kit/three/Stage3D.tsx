'use client';

import { useContext, useEffect, useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore, type ReactNode } from 'react';
import { mix } from '@/lib/sim/anim';
import { aimCamera, blendCamera, centreOf } from '@/lib/three-d/aim';
import { len, norm, sub, viewOf, project, type Camera3, type M4, type V3, type View3 } from '@/lib/three-d/math';
import { lookTurn, orbitCamera } from '@/lib/three-d/orbit';
import { KEY_LIGHT, projectItem, type Item3, type Projected, type Scene3 } from '@/lib/three-d/scene';
import { Part } from '../Part';
import { BridgeLookContext, UnderlayContext, partState, useLabelScale, useScene, type LookSide } from '../context';
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
  /**
   * The same specimen across views (a key naming it): a view that takes over from one with the same key
   * starts from the camera the viewer was just looking through and glides to its own, so a stage change
   * on the same model never cuts to another angle.
   */
  continuity?: string;
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

/** Where the eye is, seen from the specimen, for each named side. */
function lookDir(side: LookSide, sideDir: V3): V3 {
  const neg = (v: V3): V3 => [-v[0], -v[1], -v[2]];
  return side === 'front' ? [0, 0, 1] : side === 'back' ? [0, 0, -1] : side === 'up' ? [0, 1, 0] : side === 'down' ? [0, -1, 0] : side === 'side' ? sideDir : neg(sideDir);
}
const SIDES: LookSide[] = ['front', 'back', 'side', 'otherSide', 'up', 'down'];

/** The named side the camera looks from now (within ~20 degrees), if any. */
function facingOf(m: M4, sideDir: V3): LookSide | undefined {
  // The camera's own z axis in world space points from the specimen to the eye.
  const z: V3 = [m[2], m[6], m[10]];
  return SIDES.find((k) => {
    const d = lookDir(k, sideDir);
    return (z[0] * d[0] + z[1] * d[1] + z[2] * d[2]) / Math.hypot(d[0], d[1], d[2]) > 0.94;
  });
}

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

/**
 * The WebGL layer a 3D view leaves behind stays parked a few seconds for the next one in the same frame:
 * a camera move between views (which draws the view it leaves once more) or the next stage's 3D view
 * then shows at once, with no "preparing" moment in the middle of the move.
 */
const parked = new Map<HTMLDivElement, { api: GLApi; timer: number }>();
const PARK_MS = 60000;
/** 3D views on screen per frame: one still there when another mounts will hand its layer over. */
const live = new Map<HTMLDivElement, number>();

function park(host: HTMLDivElement, api: GLApi) {
  api.park();
  const old = parked.get(host);
  if (old && old.api !== api) {
    window.clearTimeout(old.timer);
    old.api.dispose();
  }
  parked.set(host, {
    api,
    timer: window.setTimeout(() => {
      if (parked.get(host)?.api === api) parked.delete(host);
      api.dispose();
    }, PARK_MS),
  });
}

/**
 * A WebGL layer made ready in the background (its shader programs compile while nothing else is going
 * on), parked for the first 3D view: that view, or a camera move into it, never waits for WebGL.
 */
export function prewarm3D(host: HTMLDivElement) {
  if (parked.has(host) || (live.get(host) ?? 0) > 0) return;
  import('./gl')
    .then((m) => {
      if (parked.has(host) || (live.get(host) ?? 0) > 0 || !host.isConnected) return;
      const api = m.createGL(host, () => {});
      if (api) park(host, api);
    })
    .catch(() => {});
}

/** The camera each frame's 3D view last showed (and its specimen key), for the next view to start from. */
const lastCam = new Map<HTMLDivElement, { key: string; cam: Camera3; at: number; live: number }>();
const ENTER_MS = 1100;
const differs = (a: Camera3, b: Camera3) => {
  const ea = norm(sub(a.eye, a.target));
  const eb = norm(sub(b.eye, b.target));
  return ea[0] * eb[0] + ea[1] * eb[1] + ea[2] * eb[2] < 0.9986 || Math.hypot(...sub(a.target, b.target)) > 0.05 || Math.abs(a.fov - b.fov) > 0.5 || Math.abs(len(sub(a.eye, a.target)) - len(sub(b.eye, b.target))) > 0.1;
};

type Pub = { orient: Edges | null; look: { names: Record<LookSide, string>; facing?: LookSide } | null };
/** The 3D views on each frame, oldest first: the last one sets the frame's side names and camera keys. */
const pubs = new Map<HTMLDivElement, Pub[]>();

const noSubscribe = () => () => {};
const zero = () => 0;

/** The drag hint is a one-time lesson: once the viewer has turned a 3D view, it no longer takes room. */
let turnedOnce = false;

export function Stage3D({ scene, children, orbit = true, axes, continuity }: Stage3DProps) {
  const ctx = useScene();
  const ul = useContext(UnderlayContext);
  // Taking over from a view of the same specimen: start from its camera (see `continuity`).
  const [enter] = useState(() => {
    const l = continuity && ul?.host ? lastCam.get(ul.host) : undefined;
    // Still on screen (the outgoing view fades out over this one) or only just gone.
    return l && l.key === continuity && (l.live > 0 || performance.now() - l.at < 1500) ? l.cam : null;
  });
  const [enterP, setEnterP] = useState(enter ? 0 : 1);
  useEffect(() => {
    if (!enter) return;
    const ms = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 1 : ENTER_MS;
    let raf = 0;
    let last = 0;
    let done = 0;
    // The new stage's first frames can be slow (scene set-up): the glide counts at most one smooth
    // frame's worth per frame, so it is seen from its start instead of jumping a third of the way.
    const step = (now: number) => {
      done += last ? Math.min(now - last, 40) : 0;
      last = now;
      const p = Math.min(1, done / ms);
      setEnterP(p);
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [enter]);
  const [turn, setTurn] = useState({ yaw: 0, pitch: 0 });
  const [gl, setGl] = useState<GLApi | null>(null);
  const [ready, setReady] = useState(false);
  // WebGL could not start (or is very late): only then the coarse flat picture stands in for it.
  const [flatOnly, setFlatOnly] = useState(false);
  // A parked layer is waiting for this view: no "preparing" spinner, the picture is there next frame.
  const [warm] = useState(() => !!ul?.host && (parked.has(ul.host) || (live.get(ul.host) ?? 0) > 0));
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

  // A camera move into a cut turns the picture to the side the cut is seen from first.
  const bridge = useContext(BridgeLookContext);
  const bridgeK = useSyncExternalStore(bridge?.subscribe ?? noSubscribe, bridge?.get ?? zero, zero);
  // The camera the scene asks for, turned by the viewer's drag around its target.
  const cam = useMemo(() => {
    if (!bridge || bridgeK <= 0 || !axes) return orbitCamera(scene.camera, turn);
    const goal = lookTurn(scene.camera, lookDir(bridge.side, axes.sideDir));
    const yaw = turn.yaw + Math.atan2(Math.sin(goal.yaw - turn.yaw), Math.cos(goal.yaw - turn.yaw));
    return orbitCamera(scene.camera, { yaw: turn.yaw + (yaw - turn.yaw) * bridgeK, pitch: turn.pitch + (goal.pitch - turn.pitch) * bridgeK });
  }, [scene.camera, turn, bridge, bridgeK, axes]);
  const orbitRequest = ul?.orbitRequest;
  const [appliedOrbit, setAppliedOrbit] = useState<typeof orbitRequest>(undefined);
  if (orbitRequest && orbit && appliedOrbit !== orbitRequest) {
    setAppliedOrbit(orbitRequest);
    const { direction } = orbitRequest;
    // From where the last asked-for turn is heading (quick presses add up), not from mid-glide.
    const base = turnGoal && !drag.current ? turnGoal : turn;
    const look = direction === 'look' && orbitRequest.look && axes ? lookTurn(scene.camera, lookDir(orbitRequest.look, axes.sideDir)) : null;
    // The short way round from where the picture is now.
    const wrap = (a: number) => base.yaw + Math.atan2(Math.sin(a - base.yaw), Math.cos(a - base.yaw));
    glideTurn(look ? { yaw: wrap(look.yaw), pitch: look.pitch } : direction === 'reset' || direction === 'look' ? { yaw: 0, pitch: 0 } : {
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
  const aimed = gliding ? blendCamera(goalFor(aim.from), goalFor(spot), ease(aim.p)) : goalFor(spot);
  const display = enter && enterP < 1 && differs(enter, aimed) ? blendCamera(enter, aimed, ease(enterP)) : aimed;
  const view = viewOf(display);
  useEffect(() => {
    if (continuity && ul?.host) lastCam.set(ul.host, { key: continuity, cam: display, at: performance.now(), live: lastCam.get(ul.host)?.live ?? 0 });
  });
  // A paused view stops rendering, so "how recent" counts from when it leaves, not from its last frame.
  useEffect(() => {
    const h = ul?.host;
    if (!continuity || !h) return;
    const mark = (d: number) => {
      const l = lastCam.get(h);
      if (l) lastCam.set(h, { ...l, live: Math.max(0, l.live + d), at: performance.now() });
    };
    mark(1);
    return () => mark(-1);
  }, [continuity, ul?.host]);
  const light = scene.light ?? KEY_LIGHT;

  // The frame's edge pills follow the camera (the step's turns, the tour's glides and the viewer's drag).
  const setOrient = ul?.setOrient;
  const setLook = ul?.setLook;
  const host0 = ul?.host ?? null;
  // Two views share the frame while one fades into the other: the newest one speaks for it, and the
  // one leaving hands the frame back to whoever is left instead of blanking it.
  const pub = useRef<Pub>({ orient: null, look: null });
  useEffect(() => {
    if (!host0) return;
    const entry = pub.current;
    const list = pubs.get(host0) ?? [];
    // The fading copy of the last view never speaks over the view taking over.
    if (root.current?.closest('.scene-ghost')) list.unshift(entry);
    else list.push(entry);
    pubs.set(host0, list);
    return () => {
      const i = list.indexOf(entry);
      if (i < 0) return;
      const top = i === list.length - 1;
      list.splice(i, 1);
      if (!top) return;
      const next = list[list.length - 1];
      setOrient?.(next?.orient ?? null);
      setLook?.(next?.look ?? null);
    };
  }, [host0, setOrient, setLook]);
  const speaks = () => {
    const list = host0 ? pubs.get(host0) : undefined;
    return !list || list[list.length - 1] === pub.current;
  };
  const edges = useRef<Edges>({});
  const edgeNames = axes?.edges;
  const nextEdges = edgeNames && axes ? edgesFor(view.view, edgeNames, axes.sideDir, edges.current) : null;
  useEffect(() => {
    if (!setOrient || !nextEdges || sameEdges(nextEdges, edges.current)) return;
    edges.current = nextEdges;
    pub.current.orient = nextEdges;
    if (speaks()) setOrient(nextEdges);
  });
  // The frame's camera keys offer the named sides and light the one the picture is seen from now.
  const facing = edgeNames && axes && orbit ? facingOf(view.view, axes.sideDir) : undefined;
  const lookKey = edgeNames && orbit ? `${SIDES.map((k) => edgeNames[k]).join('|')}|${facing ?? ''}` : '';
  useEffect(() => {
    if (!setLook || !lookKey || !edgeNames) return;
    pub.current.look = { names: edgeNames, facing };
    if (speaks()) setLook(pub.current.look);
    // Only when the names or the side change: the key says both.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setLook, lookKey]);

  const host = ul?.host ?? null;
  // The flat fallback is drawn without a viewport (server render, tests) or when WebGL fails. While the
  // WebGL layer is starting (well under a second) nothing is drawn: the coarse flat meshes would flash
  // a jagged picture before the smooth one.
  const flat = !ready && (!host || flatOnly);
  // Starting up: the spinner stands in for the picture, and its names wait for it.
  const waiting = !!host && !ready && !flatOnly && !warm;
  const drawn = scene.items
    .filter((it) => (it.show ?? 1) * (it.opacity ?? 1) > 0.01)
    .map((it) => ({ it, pr: projectCached(it, view, light, flat) }))
    .sort((a, b) => b.pr.depth - a.pr.depth);

  useEffect(() => {
    if (!host) return;
    live.set(host, (live.get(host) ?? 0) + 1);
    let dead = false;
    let api: GLApi | null = null;
    const late = window.setTimeout(() => setFlatOnly(true), 2500);
    const pooled = parked.get(host);
    if (pooled) {
      parked.delete(host);
      window.clearTimeout(pooled.timer);
      api = pooled.api;
      api.wake(() => {
        window.clearTimeout(late);
        if (!dead) setReady(true);
      });
      setGl(api);
    } else
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
      live.set(host, (live.get(host) ?? 1) - 1);
      window.clearTimeout(late);
      // Parked for the next 3D view in this frame (one at a time), then let go.
      if (api) park(host, api);
      setGl(null);
      setReady(false);
      setFlatOnly(false);
    };
  }, [host]);

  // The shaded picture follows this view's own group (not just the frame's zoom): a camera move between
  // views, which carries and fades the drawings, carries and fades the 3D picture with them.
  const root = useRef<SVGGElement>(null);
  const sceneEl = ul?.scene ?? null;
  useEffect(() => gl?.follow(root.current ?? sceneEl), [gl, sceneEl]);

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
      ref={root}
      className={`stage3d${ready ? ' is-gl' : ''}`}
      data-orbit={orbit ? '' : undefined}
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
