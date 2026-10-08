'use client';

import { useEffect, useEffectEvent } from 'react';
import type { Orientation, PlaneKind } from '@/lib/sim/types';
import { PLANE_TEXT, markSeen } from './Locator';
import { SHAPE_TEXT, Specimen, shapeFor } from './Specimen';

/** What was on screen: enough to redraw its plane on the 3-D sketch and to name it. */
export interface ViewSnap {
  key: string;
  week: number;
  stageTitle: string;
  label: string;
  plane: PlaneKind;
  day: number;
  level?: number;
  orientation?: Orientation;
}

/** The sketch faces the way the drawing does (cranial left, back right, unless the view says otherwise). */
export const flipOf = (o?: Orientation) => !!o && (['Dortsala', 'Kaudala'].includes(o.left ?? '') || ['Bentrala', 'Kraneala'].includes(o.right ?? ''));

const CUTS: PlaneKind[] = ['sagitala', 'zeharkakoa', 'koronala'];

/**
 * Does moving from one view to the other deserve the bridge? Yes when the object or the plane
 * changes; not for zooming into a detail of the same drawing, nor for diagrams.
 */
export const needsBridge = (a: ViewSnap, b: ViewSnap) => {
  if (a.plane === 'eskema' || b.plane === 'eskema') return false;
  if (shapeFor(a.week, a.day, a.plane) !== shapeFor(b.week, b.day, b.plane)) return true;
  if (a.plane === b.plane || a.plane === 'xehetasuna' || b.plane === 'xehetasuna') return false;
  return true;
};

/** "Up is…, left is…" for the new view, from its orientation labels. */
function compass(o?: Orientation) {
  if (!o) return null;
  const parts = [
    o.top && ['↑', o.top],
    o.bottom && ['↓', o.bottom],
    o.left && ['←', o.left],
    o.right && ['→', o.right],
  ].filter(Boolean) as [string, string][];
  return parts.length ? parts : null;
}

/** How long the centred view name stays over the picture (ms). */
export const FLASH_MS = 2200;

/**
 * Over the middle of the picture, for a moment, whenever the simulation changes the view: the new view's
 * name, so nobody keeps reading the new drawing as the old one. It lets the pointer through and goes by itself.
 */
export function ViewFlash({ label, plane, onDone }: { label: string; plane: PlaneKind; onDone: () => void }) {
  const done = useEffectEvent(onDone);
  useEffect(() => {
    const id = window.setTimeout(done, FLASH_MS);
    return () => window.clearTimeout(id);
  }, []);
  const kind = PLANE_TEXT[plane].name;
  const said = label.toLowerCase().includes(plane) || label.toLowerCase() === kind.toLowerCase();
  return (
    <div className="view-flash" role="status" aria-live="polite">
      <span className="view-flash-k">Ikuspegi berria</span>
      <b>{label}</b>
      {!said && <small>{kind}</small>}
    </div>
  );
}

/** How long the card stays open before it folds into its chip, and how long the chip then stays (ms). */
export const BRIDGE_OPEN_MS = 6500;
const BRIDGE_CHIP_MS = 14000;

/**
 * Shown when the simulation itself moves to another view (next step, next stage, next week): the
 * same 3-D sketch with the old plane (dashed) and the new one, so the student sees that it is the
 * same object cut another way, and where up/down/left/right now point.
 *
 * It is a coachmark in the stage's top-right corner, under the view switcher — never over the
 * middle of the drawing. After a few seconds it folds into a small chip (the student can open it
 * again); "Ulertuta" dismisses it. Narrated playback keeps it open until it is acknowledged.
 */
export function ViewBridge({ from, to, onClose, autoClose = true, small = false, onSmall }: { from: ViewSnap; to: ViewSnap; onClose: () => void; autoClose?: boolean; small?: boolean; onSmall?: (v: boolean) => void }) {
  const close = useEffectEvent(onClose);
  const fold = useEffectEvent(() => onSmall?.(true));
  // The card already explains the new plane: the locator need not open its own explanation after it.
  useEffect(() => markSeen(to.plane), [to.plane]);
  const canFold = !!onSmall;
  useEffect(() => {
    const id = autoClose ? window.setTimeout(small || !canFold ? close : fold, small ? BRIDGE_CHIP_MS : canFold ? BRIDGE_OPEN_MS : 9000) : null;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || (e.key === 'Enter' && !small)) close();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      if (id !== null) window.clearTimeout(id);
      window.removeEventListener('keydown', onKey);
    };
  }, [autoClose, small, canFold]);

  const sFrom = shapeFor(from.week, from.day, from.plane);
  const sTo = shapeFor(to.week, to.day, to.plane);
  const same = sFrom === sTo;
  const dirs = compass(to.orientation);
  const planeFrom = PLANE_TEXT[from.plane];
  const planeTo = PLANE_TEXT[to.plane];
  const samePlane = from.plane === to.plane;
  const headline = same
    ? samePlane
      ? 'Objektu bera, beste zati bat'
      : `Objektu bera, ${CUTS.includes(to.plane) ? 'beste plano batean ebakita' : 'beste leku batetik ikusita'}`
    : from.week !== to.week
      ? `${to.week}. astea: objektua hazi eta aldatu da`
      : 'Beste objektu bat';

  if (small)
    return (
      <div className="bridge-chip" role="status">
        <button className="bridge-chip-open" onClick={() => onSmall?.(false)} title="Ireki berriro: zer aldatu den eta norabideak" aria-expanded={false}>
          <span className="bridge-chip-dot" aria-hidden />
          <span className="bridge-chip-k">Ikuspegia aldatu da</span>
          <b>{to.label}</b>
        </button>
        <button className="bridge-chip-x" onClick={onClose} aria-label="Ulertuta" data-tip="Ulertuta" data-tip-pos="bottom-end">
          ×
        </button>
      </div>
    );

  return (
    <div className="bridge" role="dialog" aria-label="Ikuspegia aldatu da">
      <div className="bridge-figs">
        {!same && (
          <figure className="bridge-old">
            <Specimen plane={from.plane} week={from.week} day={from.day} level={from.level} flip={flipOf(from.orientation)} className="bridge-svg" />
            <figcaption>Lehen</figcaption>
          </figure>
        )}
        {!same && (
          <span className="bridge-arrow" aria-hidden>
            →
          </span>
        )}
        <figure className="bridge-new">
          <Specimen plane={to.plane} week={to.week} day={to.day} level={to.level} flip={flipOf(to.orientation)} prev={same ? from.plane : null} big className="bridge-svg" />
          <figcaption>{same && !samePlane ? 'Marratxoak: lehengo planoa · horia: orain' : 'Orain'}</figcaption>
        </figure>
      </div>
      <div className="bridge-text">
        <p className="kicker">Ikuspegia aldatu da</p>
        <h4>{headline}</h4>
        <p className="bridge-change">
          <span>{from.label}</span>
          {!samePlane && <small> ({planeFrom.name.toLowerCase()})</small>}
          <b aria-hidden> → </b>
          <span className="is-now">{to.label}</span>
          {!samePlane && <small> ({planeTo.name.toLowerCase()})</small>}
        </p>
        {!same && <p className="muted">Orain: {SHAPE_TEXT[sTo]}.</p>}
        {!samePlane && <p className="muted">{planeTo.text}</p>}
        {dirs && (
          <p className="bridge-dirs" aria-label="Pantailako norabideak">
            {dirs.map(([a, t]) => (
              <span key={a}>
                <b>{a}</b> {t}
              </span>
            ))}
          </p>
        )}
        <div className="bridge-foot">
          <span className="bridge-timer" aria-hidden />
          <button className="btn small" onClick={onClose}>
            Ulertuta
          </button>
        </div>
      </div>
    </div>
  );
}
