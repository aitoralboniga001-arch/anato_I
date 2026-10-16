'use client';

import { useEffect, useRef, useState, type RefObject } from 'react';
import { createPortal } from 'react-dom';
import type { Gaze, Phase, Pose } from '@/lib/klasea/engine';
import { armTo, blocked, centreOf, reaches, standAt,type Facing, type Pt, type Rect } from '@/lib/klasea/stand';
import { ARM, KimuTeacher, STICK } from './KimuTeacher';
import styles from './klasea.module.css';

/**
 * Kimu walking about the scene like a teacher at the board: when a line names structures it walks to a
 * free spot beside them (never over them, their names or the scene's buttons), turns to them and points
 * with its stick; between lines it stays put, and for a question it turns to the student. It lives in
 * the viewport's own layer, takes no clicks, and moves only at phase boundaries (its arm follows a
 * structure that moves while it is said).
 */

const GHOST = '.scene-ghost, .view-zoom, .travel';
const OVERLAYS = '.focus-title, .turn-hint, .back-chip, .fs-offer, .look-controls, .zoom-controls, .view-tools, .focus-exit, .axes3d-plate, .orient span';

/** How visible an element is, from the opacity of it and its parents inside the viewport. */
function seen(el: Element, stop: Element) {
  let o = 1;
  for (let n: Element | null = el; n && n !== stop; n = n.parentElement) {
    const a = n.getAttribute('opacity');
    if (a) o *= Number(a);
    const s = (n as HTMLElement).style?.opacity;
    if (s) o *= Number(s);
  }
  return o;
}

/** A card on screen (not faded out or hidden by its own styles). */
const shown = (el: Element) => {
  const c = getComputedStyle(el);
  return c.visibility !== 'hidden' && Number(c.opacity) > 0.3;
};

const local = (r: DOMRect, h: DOMRect): Rect => ({ x: r.left - h.left, y: r.top - h.top, w: r.width, h: r.height });

/** What the scene looks like, to the nearest few pixels: what is named, and the names and dots around. */
const signature = (scene: { targets: Pt[]; avoid: { r: Rect; weight: number }[] }) =>
  [...scene.targets.map((p) => `${Math.round(p.x / 4)},${Math.round(p.y / 4)}`), ...scene.avoid.filter((a) => a.weight >= 6).map((a) => `${Math.round(a.r.x / 4)},${Math.round(a.r.y / 4)}`)].join(' ');

interface Scene {
  view: { w: number; h: number };
  targets: Pt[];
  keepClear: Rect[];
  avoid: { r: Rect; weight: number }[];
}

/** Reads the scene: where the named structures are (a name's dot first) and what must stay uncovered. */
function readScene(host: HTMLElement, focus: string[]): Scene {
  const h = host.getBoundingClientRect();
  const view = { w: h.width, h: h.height };
  const live = (el: Element) => !el.closest(GHOST) && seen(el, host) > 0.3;
  const present = (el: Element) => !el.closest(GHOST) && seen(el, host) > 0.05;
  const rectOf = (el: Element) => {
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0 ? local(r, h) : null;
  };
  const targets: Pt[] = [];
  const keepClear: Rect[] = [];
  for (const id of focus) {
    const sel = CSS.escape(id);
    const dots = [...host.querySelectorAll(`[data-label="${sel}"] .label-dot`)].filter(live).map(rectOf).filter((r): r is Rect => !!r);
    const parts = [...host.querySelectorAll(`[data-part="${sel}"]`)].filter(live).map(rectOf).filter((r): r is Rect => !!r);
    if (dots.length) targets.push(...dots.map((r) => ({ x: r.x + r.w / 2, y: r.y + r.h / 2 })));
    else if (parts.length) {
      const c = centreOf(parts.map((r) => ({ x: r.x + r.w / 2, y: r.y + r.h / 2 })));
      if (c) targets.push(c);
    }
    for (const r of parts) if (r.w * r.h < view.w * view.h * 0.3) keepClear.push(r);
  }
  const avoid: Scene['avoid'] = [];
  // What it names gets its name shown as it is said: keep clear of where that name will be, too.
  for (const id of focus)
    for (const el of host.querySelectorAll(`[data-label="${CSS.escape(id)}"] .label-plate`)) {
      const r = el.closest(GHOST) ? null : rectOf(el);
      if (r) avoid.push({ r: { x: r.x - 4, y: r.y - 4, w: r.w + 8, h: r.h + 8 }, weight: 9 });
    }
  // Every name on screen, dimmed ones too (the class dims what it is not about, but they are still read).
  for (const el of host.querySelectorAll('.label-plate')) if (present(el)) { const r = rectOf(el); if (r) avoid.push({ r: { x: r.x - 4, y: r.y - 4, w: r.w + 8, h: r.h + 8 }, weight: 9 }); }
  for (const el of host.querySelectorAll('.label-dot')) if (present(el)) { const r = rectOf(el); if (r) avoid.push({ r: { x: r.x - 8, y: r.y - 8, w: r.w + 16, h: r.h + 16 }, weight: 6 }); }
  for (const el of host.querySelectorAll('button, [role="toolbar"]')) { const r = rectOf(el); if (r) avoid.push({ r, weight: 6 }); }
  // The screen's own cards over the picture: where-you-are title, hints, the way back, the 3D axes key.
  for (const el of host.querySelectorAll(OVERLAYS)) if (!el.closest(GHOST) && shown(el)) { const r = rectOf(el); if (r) avoid.push({ r: { x: r.x - 6, y: r.y - 6, w: r.w + 12, h: r.h + 12 }, weight: 6 }); }
  // Drawn tissue: covering a small structure costs more than standing on a large background one.
  for (const el of host.querySelectorAll('[data-part]')) {
    if (!live(el)) continue;
    const r = rectOf(el);
    if (r) avoid.push({ r, weight: r.w * r.h < view.w * view.h * 0.35 ? 3 : 1.6 });
  }
  // A 3D model is drawn in WebGL, not as parts: where its names' dots lie (and a margin) is the model.
  if ([...host.querySelectorAll('.stage3d')].some(live)) {
    const dots = [...host.querySelectorAll('.label-dot')].filter(live).map(rectOf).filter((r): r is Rect => !!r);
    if (dots.length) {
      const x0 = Math.min(...dots.map((r) => r.x)) - view.w * 0.08;
      const y0 = Math.min(...dots.map((r) => r.y)) - view.h * 0.08;
      const x1 = Math.max(...dots.map((r) => r.x + r.w)) + view.w * 0.08;
      const y1 = Math.max(...dots.map((r) => r.y + r.h)) + view.h * 0.08;
      avoid.push({ r: { x: x0, y: y0, w: x1 - x0, h: y1 - y0 }, weight: 3 });
    }
  }
  return { view, targets, keepClear, avoid };
}

export function KimuWalker({ svgRef, status, phase, stepKey, pose, gaze, focus, speaking, word, paused, reduced }: {
  svgRef: RefObject<SVGSVGElement | null>;
  status: 'card' | 'running' | 'done';
  phase: Phase;
  /** Changes with each step (and phase): Kimu decides where to stand then. */
  stepKey: string;
  pose: Pose;
  gaze: Gaze;
  focus: string[];
  speaking: boolean;
  word: string;
  paused: boolean;
  reduced: boolean;
}) {
  const [host, setHost] = useState<HTMLElement | null>(null);
  const [spot, setSpot] = useState<{ x: number; y: number; facing: Facing } | null>(null);
  const [kimu, setKimu] = useState({ w: 88, h: 110 });
  const [walk, setWalk] = useState(0);
  const [arm, setArm] = useState<{ angle: number; reach: number } | null>(null);
  const spotRef = useRef(spot);
  const walkRef = useRef(walk);
  /** When it started pointing at this set (turning round must not restart the round). */
  const round = useRef({ key: '', start: 0 });
  useEffect(() => {
    spotRef.current = spot;
    walkRef.current = walk;
  });

  // The viewport (the scene's own box) hosts Kimu.
  useEffect(() => {
    // The scene is drawn once the page has mounted: look for it on the next frames until it is there.
    let raf = 0;
    const find = () => {
      const el = svgRef.current?.parentElement ?? null;
      if (el) setHost((h) => (h === el ? h : el));
      else raf = requestAnimationFrame(find);
    };
    raf = requestAnimationFrame(find);
    return () => cancelAnimationFrame(raf);
  }, [svgRef]);

  const focusKey = focus.join(' ');
  const pointing = status === 'running' && !paused && focus.length > 0 && (phase === 'speak' || phase === 'hold' || phase === 'move' || phase === 'ask');

  // Where to stand: decided at phase boundaries (and when the scene's box changes size).
  useEffect(() => {
    if (!host) return;
    let retry = 0;
    let tries = 0;
    let lastLook = '';
    let covering = 0;
    // The camera is still travelling to another view: what is on screen now is not where it will be.
    const settling = () => !!host.querySelector('.travel, .view-zoom');
    const sized = (view: Scene['view']) => {
      const size = Math.round(Math.max(64, Math.min(104, view.w * 0.085)));
      return { w: size, h: Math.round((size * 150) / 120) };
    };
    // `aside`: only out of the way, to the nearest free spot (nothing to point at yet).
    const walkTo = (scene: Scene, k: { w: number; h: number }, from: typeof spot, aside = false) => {
      const home = aside ? undefined : { x: 8, y: scene.view.h - k.h - 8 };
      const next = standAt({ view: scene.view, kimu: k, targets: pointing && !aside ? scene.targets : [], keepClear: scene.keepClear, avoid: scene.avoid, from, home, reach: (k.w / 120) * (ARM + STICK) });
      const dist = from ? Math.hypot(next.x - from.x, next.y - from.y) : 0;
      if (from && dist < 6 && next.facing === from.facing) return;
      const ms = reduced || !from ? 0 : Math.round(Math.max(380, Math.min(1500, dist * 2.4)));
      setWalk(ms);
      setSpot({ x: next.x, y: next.y, facing: next.facing });
    };
    const decide = () => {
      window.clearTimeout(retry);
      if (settling()) {
        if (tries++ < 30) retry = window.setTimeout(decide, 200);
        return;
      }
      const scene = readScene(host, pointing ? focus : []);
      // What it names may still be appearing (its name shows once said): look again before deciding.
      if (pointing && !scene.targets.length) {
        if (tries++ < 8) retry = window.setTimeout(decide, 300);
        return;
      }
      // The camera may still be gliding to it, and a new view's names still fading in: decide once the
      // picture holds still (what it names and every name around it), not on how it was a moment ago.
      const look = signature(scene);
      if (look !== lastLook && tries++ < 14) {
        lastLook = look;
        retry = window.setTimeout(decide, 160);
        return;
      }
      const k = sized(scene.view);
      setKimu(k);
      const from = spotRef.current;
      // It walks to point (a line, or a check that lights something), or to its corner before and after
      // the class; for a question with nothing lit it stays and turns to the student.
      const moves = !from || status !== 'running' || (pointing && (phase === 'speak' || phase === 'ask'));
      if (!moves || (paused && from)) return;
      // Like a teacher: if its stick reaches from where it stands, it points without walking.
      const reach = (k.w / 120) * (ARM + STICK);
      if (pointing && from && reaches(from, k, scene.targets, reach) && !blocked(from, { view: scene.view, kimu: k, targets: scene.targets, keepClear: scene.keepClear, avoid: scene.avoid, from, reach })) return;
      walkTo(scene, k, from);
    };
    // While it points, a name can pop up under it or the camera can move the drawing: it steps aside then.
    const watch = window.setInterval(() => {
      const from = spotRef.current;
      if (status !== 'running' || paused || !from || walkRef.current || settling()) return;
      const scene = readScene(host, focus);
      const k = sized(scene.view);
      const reach = (k.w / 120) * (ARM + STICK);
      // Walking to point is only for what is being said (between lines it still holds the last line's
      // names, which a new view may have put elsewhere).
      const saying = pointing && (phase === 'speak' || phase === 'ask' || phase === 'hold') && scene.targets.length > 0;
      if (saying) {
        if (blocked(from, { view: scene.view, kimu: k, targets: scene.targets, keepClear: scene.keepClear, avoid: scene.avoid, from, reach })) walkTo(scene, k, from);
      } else if (blocked(from, { view: scene.view, kimu: k, targets: [], keepClear: [], avoid: scene.avoid, from, reach })) {
        // A new view put a name under it while it waits: it steps out of the way, whatever the phase (on
        // the second look, so a line about to start walks it straight to its place instead).
        if (++covering >= 2) walkTo(scene, k, from, true);
        return;
      }
      covering = 0;
    }, 700);
    // After the frame has settled (labels placed, the camera arrived).
    const t = window.setTimeout(decide, 120);
    const ro = new ResizeObserver(() => decide());
    ro.observe(host);
    return () => {
      window.clearTimeout(t);
      window.clearTimeout(retry);
      window.clearInterval(watch);
      ro.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- decided once per step and phase
  }, [host, stepKey, status, pointing, focusKey, paused]);

  // A walk ends when its time is up (even if the class moved on meanwhile).
  useEffect(() => {
    if (!walk) return;
    const id = window.setTimeout(() => setWalk(0), walk);
    return () => window.clearTimeout(id);
  }, [walk, spot]);

  // The arm follows what it names (it can move while it is said), one structure after another when it
  // names several, turning round when one is behind it; at rest otherwise.
  useEffect(() => {
    if (!host || !spot || walk || !pointing) return;
    if (round.current.key !== focusKey) round.current = { key: focusKey, start: performance.now() };
    const start = round.current.start;
    const aimNow = () => {
      const pts = readScene(host, focus).targets.filter((p, i, all) => all.findIndex((q) => Math.hypot(q.x - p.x, q.y - p.y) < 30) === i).sort((a, b) => a.x - b.x);
      if (!pts.length) return setArm(null);
      const aim = pts[Math.floor((performance.now() - start) / 1800) % pts.length];
      const facing: Facing = aim.x >= spot.x + kimu.w / 2 ? 'right' : 'left';
      if (facing !== spot.facing && Math.abs(aim.x - (spot.x + kimu.w / 2)) > 12) {
        // Turn round where it stands now (a walk decided meanwhile wins).
        setSpot((s) => (s && s.x === spot.x && s.y === spot.y ? { ...s, facing } : s));
        return;
      }
      setArm(armTo(spot, kimu, aim, (kimu.w / 120) * (ARM + STICK)));
    };
    aimNow();
    const id = window.setInterval(aimNow, 250);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- focus follows its key
  }, [host, spot, walk, pointing, focusKey, kimu]);

  if (!host || !spot) return null;
  const shownPose: Pose = walk ? 'look' : paused && status === 'running' ? 'listen' : status === 'card' ? 'talk' : status === 'done' ? 'praise' : pose;
  return createPortal(
    <div
      className={styles.walker}
      style={{ width: kimu.w, height: kimu.h, transform: `translate(${spot.x}px, ${spot.y}px)`, transitionDuration: `${walk}ms` }}
      aria-hidden={!speaking}
    >
      <KimuTeacher
        pose={shownPose}
        facing={spot.facing}
        arm={!walk && pointing ? arm : null}
        speaking={speaking && !paused}
        word={word}
        walking={walk > 0}
        look={walk ? 'ahead' : arm ? 'aim' : gaze === 'board' ? 'board' : 'student'}
        reduced={reduced}
      />
    </div>,
    host,
  );
}
