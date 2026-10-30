'use client';

import { createContext, useContext, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import { Defs } from '@/components/kit/Defs';
import { SceneView } from '@/components/kit';
import { LabelScaleContext, SceneContext, UnderlayContext, type SceneContextValue, type Underlay } from '@/components/kit/context';
import { isSpace, nameOf, partsOf } from '@/content/registry';
import { ModelView, type CalloutSpec } from '@/components/scenes/week10/Heart3D';
import type { Camera3, V3 } from '@/lib/three-d/math';
import type { Item3 } from '@/lib/three-d/scene';
import type { RoomViewState } from './StudyRoom';
import styles from '../eratorriak.module.css';

/**
 * The 3D frame every study room shares (as topic 12's arch model): the shown moment glides to the asked
 * one (the model morphs and the camera travels, never a cut), names keep the page's text size, the turn
 * keys and a drag turn it, and "Handitu" opens it full screen with the moments and the names switch.
 * A room gives only `frame(u)`: its model, camera and names at a moment that may lie between two.
 */

export interface Frame3 {
  items: Item3[];
  pts: Record<string, V3>;
  camera: Camera3;
  names: CalloutSpec[];
}

interface Live {
  u: number;
  frame: (u: number) => Frame3;
  continuity: string;
}
const LiveContext = createContext<Live | null>(null);

/** The scene reads the live state from context, so SceneView keeps one mounted scene (and its WebGL). */
function RoomScene() {
  const live = useContext(LiveContext)!;
  const f = live.frame(live.u);
  return (
    <ModelView model={{ items: f.items, pts: f.pts }} continuity={live.continuity} camera={f.camera} names={f.names} right={[60, 540]} />
  );
}

const noop = () => {};
const subscribeNothing = () => () => {};

/** The morph: a value that glides to `stage` (shorter for a near moment; at once with reduced motion). */
export function useGlide(stage: number) {
  const [u, setU] = useState(stage);
  const uRef = useRef(stage);
  useEffect(() => {
    const from = uRef.current;
    const to = stage;
    if (from === to) return;
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const ms = reduce ? 1 : Math.min(1600, 700 + 260 * Math.abs(to - from));
    let raf = 0;
    const t0 = performance.now();
    const step = (now: number) => {
      const p = Math.min(1, (now - t0) / ms);
      const v = from + (to - from) * p;
      uRef.current = v;
      setU(v);
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [stage]);
  return u;
}

/** The view itself: canvas under, names over, turn keys. */
function View3D({
  u,
  frame,
  continuity,
  label,
  big,
  onBig,
}: {
  u: number;
  frame: Live['frame'];
  continuity: string;
  label: string;
  big: boolean;
  onBig: () => void;
}) {
  const mounted = useSyncExternalStore(
    subscribeNothing,
    () => true,
    () => false,
  );
  const [host, setHost] = useState<HTMLDivElement | null>(null);
  const [sceneEl, setSceneEl] = useState<SVGGElement | null>(null);
  const [turn, setTurn] = useState<Underlay['orbitRequest']>(undefined);
  const box = useRef<HTMLDivElement>(null);
  const [k, setK] = useState(1.6);

  // Names stay as readable as the page's text, whatever the drawing's size.
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setK(Math.min(2.4, Math.max(1, (0.92 * 1000) / Math.max(1, el.clientWidth)))));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const underlay = useMemo<Underlay | null>(
    () => (host ? { host, scene: sceneEl, zoomed: false, orbitRequest: turn } : null),
    [host, sceneEl, turn],
  );
  const ctx: SceneContextValue = {
    selected: null,
    hovered: null,
    focus: [],
    showLabels: true,
    quiz: false,
    quizFlash: null,
    nameOf,
    isSpace,
    partsOf,
    onSelect: noop,
    onHover: noop,
  };
  const ask = (direction: NonNullable<Underlay['orbitRequest']>['direction']) =>
    setTurn((t) => ({ direction, serial: (t?.serial ?? 0) + 1 }));

  return (
    <div className={`${styles.view3d}${big ? ` ${styles.view3dBig}` : ''}`} ref={box}>
      <div ref={setHost} className={styles.underlay} aria-hidden />
      <svg
        viewBox="0 0 1000 640"
        preserveAspectRatio="xMidYMid meet"
        className={styles.svg3d}
        role="img"
        aria-label={`${label}: arrastatu biratzeko`}
      >
        <Defs />
        <g ref={setSceneEl}>
          {mounted && (
            <SceneContext.Provider value={ctx}>
              <UnderlayContext.Provider value={underlay}>
                <LabelScaleContext.Provider value={{ k, left: false, right: false }}>
                  <LiveContext.Provider value={{ u, frame, continuity }}>
                    <SceneView Scene={RoomScene} t={0} reduced={false} />
                  </LiveContext.Provider>
                </LabelScaleContext.Provider>
              </UnderlayContext.Provider>
            </SceneContext.Provider>
          )}
        </g>
      </svg>
      <div className={styles.turnKeys}>
        <button type="button" onClick={() => ask('left')} aria-label="Biratu ezkerrera" title="Biratu">
          ⟲
        </button>
        <button type="button" onClick={() => ask('reset')} title="Aurretik ikusi (hasierako ikuspegia)">
          Aurretik
        </button>
        <button type="button" onClick={() => ask('right')} aria-label="Biratu eskuinera" title="Biratu">
          ⟳
        </button>
        <button type="button" onClick={onBig} title={big ? 'Itxi (Esc)' : 'Handitu'} aria-pressed={big}>
          {big ? 'Itxi' : 'Handitu'}
        </button>
      </div>
    </div>
  );
}

export function Room3D({
  state,
  frame,
  continuity,
  label,
}: {
  state: RoomViewState;
  frame: Live['frame'];
  continuity: string;
  label: string;
}) {
  const u = useGlide(state.stage);
  const [big, setBig] = useState(false);
  const { stage, stages, onStage, names, onNames } = state;

  useEffect(() => {
    if (!big) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setBig(false);
      if (e.key === 'ArrowRight') onStage?.(stage + 1);
      if (e.key === 'ArrowLeft') onStage?.(stage - 1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [big, stage, onStage]);

  const toggle = () => setBig((b) => !b);
  // One view at a time: while enlarged, the side slot keeps its place empty (one WebGL scene).
  if (!big) return <View3D u={u} frame={frame} continuity={continuity} label={label} big={false} onBig={toggle} />;
  return (
    <>
      <div className={styles.view3d} aria-hidden />
      {createPortal(
        <div className={styles.bigOverlay} role="dialog" aria-modal="true" aria-label={`${label} handituta`}>
          <div className={styles.bigBar}>
            {stages && onStage && (
              <div className={styles.stages}>
                {stages.map((s, i) => (
                  <button
                    key={s}
                    type="button"
                    className={`${styles.stageBtn}${stage === i ? ` ${styles.on}` : ''}`}
                    onClick={() => onStage(i)}
                  >
                    <b>{i + 1}</b>
                    <span>{s}</span>
                  </button>
                ))}
              </div>
            )}
            {onNames && (
              <div className={styles.seg2} role="group" aria-label="3D izenak">
                <span>Izenak</span>
                {(['aldaketak', 'guztiak', 'gabe'] as const).map((n) => (
                  <button
                    key={n}
                    type="button"
                    aria-pressed={names === n}
                    className={names === n ? styles.on : ''}
                    onClick={() => onNames(n)}
                  >
                    {n === 'aldaketak' ? 'Aldaketak' : n === 'guztiak' ? 'Guztiak' : 'Gabe'}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className={styles.bigView}>
            <View3D u={u} frame={frame} continuity={continuity} label={label} big onBig={toggle} />
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}
