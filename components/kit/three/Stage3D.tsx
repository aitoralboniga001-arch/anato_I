'use client';

import { useContext, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { mix } from '@/lib/sim/anim';
import { add, cross, mul, norm, rotate, sub, viewOf, project, type M4, type V3, type View3 } from '@/lib/three-d/math';
import { KEY_LIGHT, projectItem, type Scene3 } from '@/lib/three-d/scene';
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
  axes?: { up: string; front: string; side: string; sideDir: V3 };
}

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
/** The drag hint is a one-time lesson: once the viewer has turned a 3D view, it no longer takes room. */
let turnedOnce = false;

export function Stage3D({ scene, children, orbit = true, axes }: Stage3DProps) {
  const ctx = useScene();
  const ul = useContext(UnderlayContext);
  const [turn, setTurn] = useState({ yaw: 0, pitch: 0 });
  const [gl, setGl] = useState<GLApi | null>(null);
  const [ready, setReady] = useState(false);
  const drag = useRef<{ x: number; y: number; yaw: number; pitch: number; moved: boolean } | null>(null);

  // The camera the scene asks for, turned by the viewer's drag around its target.
  const cam = useMemo(() => {
    const c = scene.camera;
    if (!turn.yaw && !turn.pitch) return c;
    const up: V3 = c.up ?? [0, 1, 0];
    let off = sub(c.eye, c.target);
    off = rotate(off, up, turn.yaw);
    const right = norm(cross(up, off));
    off = rotate(off, right, -turn.pitch);
    return { ...c, eye: add(c.target, off) };
  }, [scene.camera, turn]);
  const view = viewOf(cam);
  const light = scene.light ?? KEY_LIGHT;

  const drawn = scene.items
    .filter((it) => (it.show ?? 1) * (it.opacity ?? 1) > 0.01)
    .map((it) => ({ it, pr: projectItem(it, view, light) }))
    .sort((a, b) => b.pr.depth - a.pr.depth);

  const host = ul?.host ?? null;
  useEffect(() => {
    if (!host) return;
    let dead = false;
    let api: GLApi | null = null;
    import('./gl')
      .then((m) => {
        if (dead) return;
        api = m.createGL(host, () => setReady(true));
        setGl(api);
      })
      .catch(() => {});
    return () => {
      dead = true;
      api?.dispose();
      setGl(null);
      setReady(false);
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
      onClickCapture={(e) => {
        // A drag that turned the picture is not a click on what it started on.
        if (drag.current?.moved) e.stopPropagation();
      }}
      onDoubleClick={() => setTurn({ yaw: 0, pitch: 0 })}
    >
      {canTurn && <rect className="stage3d-orbit" x={0} y={0} width={1000} height={640} fill="transparent" />}
      {drawn.map(({ it, pr }) => {
        if (!pr.any) return null;
        const deep = it.deep ?? mix(it.color, '#000000', 0.55);
        const lit = mix(it.color, '#ffffff', 0.22);
        const flat = (
          <g className="stage3d-flat" opacity={it.opacity ?? 1}>
            <path d={pr.bands[0]} fill={deep} stroke={deep} strokeWidth={0.6} strokeLinejoin="round" />
            <path d={pr.bands[1]} fill={it.color} stroke={it.color} strokeWidth={0.6} strokeLinejoin="round" />
            <path d={pr.bands[2]} fill={lit} stroke={lit} strokeWidth={0.6} strokeLinejoin="round" />
          </g>
        );
        if (!it.id)
          return (
            <g key={it.key} opacity={it.show ?? 1} pointerEvents="none">
              {flat}
            </g>
          );
        return (
          <Part key={it.key} id={it.id} groups={it.groups} quiet={it.quiet} show={it.show ?? 1}>
            {flat}
            <path className="stage3d-hit" d={pr.d} />
          </Part>
        );
      })}
      {axes && <Axes view={view} axes={axes} hint={canTurn && ready && !turnedOnce} />}
      {children?.(at, view)}
    </g>
  );
}

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
        const back = z < -0.2;
        // Pointing straight at (dot) or away from (ring) the viewer: the line has no length to show.
        const end = Math.hypot(x, y) < 0.3;
        return (
          <g key={name} opacity={back ? 0.5 : 1}>
            {!end && <line x1={cx} y1={cy} x2={tip[0]} y2={tip[1]} stroke={c} strokeWidth={2.2} strokeLinecap="round" />}
            {end ? <circle cx={cx} cy={cy} r={back ? 4.2 : 3.4} fill={back ? 'none' : c} stroke={c} strokeWidth={1.6} /> : <circle cx={tip[0]} cy={tip[1]} r={2.4} fill={c} />}
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
