'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import type { Orientation, PlaneKind } from '@/lib/sim/types';
import { SHAPE_TEXT, Specimen, levelLine, shapeFor } from './Specimen';
import { flipOf } from './ViewBridge';

/** One sentence per plane, for a student who has never seen one (the [?] repeats it at any time). */
export const PLANE_TEXT: Record<PlaneKind, { name: string; text: string }> = {
  sagitala: { name: 'Ebaki sagitala', text: 'Gorputza ezker eta eskuin ataletan banatzen duen planoa: burutik buztanera doa, erditik.' },
  zeharkakoa: { name: 'Ebaki zeharkakoa', text: 'Gorputza goiko (kraneala) eta beheko (kaudala) ataletan banatzen duen planoa, ardatzarekiko perpendikularra: «xerra» bat.' },
  koronala: { name: 'Ebaki koronala', text: 'Gorputza aurreko (bentrala) eta atzeko (dortsala) ataletan banatzen duen planoa.' },
  dortsala: { name: 'Ikuspegi dortsala', text: 'Ez da ebakia: enbrioia goitik (bizkarraldetik) ikusten duzu, amnios barrunbetik begiratuta bezala.' },
  kanpokoa: { name: 'Kanpoko ikuspegia', text: 'Ez da ebakia: enbrioia edo fetua kanpotik, osorik, ikusten duzu.' },
  xehetasuna: { name: 'Xehetasuna', text: 'Eremu txiki baten handipena (lupa): zelulak eta geruzak gertutik.' },
  eskema: { name: 'Eskema', text: 'Ez da benetako ebakia: prozesuaren laburpen marraztua.' },
};

const SEEN_KEY = 'enbrioatlas:planes-seen';
const readSeen = (): string[] => {
  try {
    return JSON.parse(window.localStorage.getItem(SEEN_KEY) ?? '[]') as string[];
  } catch {
    return [];
  }
};
export const markSeen = (plane: string) => {
  try {
    window.localStorage.setItem(SEEN_KEY, JSON.stringify([...new Set([...readSeen(), plane])]));
  } catch {}
};

/** A drawn summary is not a cut of the embryo: the thumbnail is a sheet with a small diagram on it. */
function SchemeGlyph() {
  const Y = '#fbbf24';
  return (
    <svg viewBox="0 0 120 88" className="loc-svg" aria-hidden>
      <rect x={22} y={12} width={76} height={64} rx={9} fill="rgba(232,238,252,0.05)" stroke="rgba(232,238,252,0.45)" strokeWidth={2.5} />
      <circle cx={45} cy={36} r={10} fill="none" stroke={Y} strokeWidth={3} />
      <rect x={65} y={26} width={20} height={20} rx={4} fill="none" stroke={Y} strokeWidth={3} />
      <path d="M55 36h6" stroke={Y} strokeWidth={3} strokeLinecap="round" />
      <path d="M34 60h52M34 67h34" stroke="rgba(232,238,252,0.4)" strokeWidth={3} strokeLinecap="round" />
    </svg>
  );
}

const levelName = (l: number) => (l < 0.3 ? 'buru-aldean' : l > 0.7 ? 'buztan-aldean' : 'erdiko mailan (enborra)');

/** A transverse cut elsewhere in the topic: a stop for the dragged plane. */
export interface CutStop {
  level: number;
  stage: string;
  view: string;
  /** Where it is ("Toraxa") and what it shows (the stage's title). */
  note: string;
  title: string;
}

/** One step of the "where am I" path: a name, and (when it leads somewhere) what pressing it does. */
export interface Crumb {
  label: string;
  tip?: string;
  onClick?: () => void;
}

/** How long a view change keeps the old plane (dashed) and the "new view" badge on the map (ms). */
const CHANGE_MS = 3200;

/**
 * The live map ("Non nago?"), always in the stage bar beside the view tabs, never over the picture: the
 * body at this age with the plane being looked at, and the path from the whole embryo to this view.
 * When the view changes it shows the move (old plane dashed, the new one drawn in, "Ikuspegi berria"),
 * so no card has to cover the drawing. On a transverse cut the plane can be dragged along the body: it
 * snaps to the topic's other cuts (the notches) and opens the one it is let go on. The card explains the
 * plane (opened by itself the first time a plane is met).
 */
export function Locator({
  plane,
  week,
  day,
  level = 0.5,
  orientation,
  viewKey,
  note,
  view,
  label,
  crumbs,
  stops,
  onStop,
  hold,
  onOpen,
}: {
  plane: PlaneKind;
  week: number;
  day: number;
  level?: number;
  orientation?: Orientation;
  viewKey: string;
  note?: string;
  /** What this view shows, in the view's own words (it used to sit over the scene). */
  view?: string;
  /** The view's short name. */
  label: string;
  /** The path from the whole embryo to this view; the last is where we are. */
  crumbs: Crumb[];
  /** The topic's transverse cuts, for dragging the plane (only on a transverse view of the modelled body). */
  stops?: CutStop[];
  onStop?: (s: CutStop) => void;
  hold?: boolean;
  /** The student opened the card: other cards in the same place give way. */
  onOpen?: () => void;
}) {
  // 'auto': opened by itself the first time a plane is met; 'user': opened from the button.
  const [open, setOpen] = useState<false | 'auto' | 'user'>(false);
  const flip = flipOf(orientation);
  const info = PLANE_TEXT[plane];
  const shape = shapeFor(week, day, plane);

  // The view before this one, for a moment: its plane dashed on the same body, and a badge.
  const [seen, setSeen] = useState<{ key: string; plane: PlaneKind; level: number; label: string } | null>(null);
  const [change, setChange] = useState<{ key: string; fromPlane: PlaneKind; fromLevel: number } | null>(null);
  if (seen?.key !== viewKey) {
    if (seen && seen.label !== label) setChange({ key: viewKey, fromPlane: seen.plane, fromLevel: seen.level });
    setSeen({ key: viewKey, plane, level, label });
  }
  useEffect(() => {
    if (!change) return;
    const id = window.setTimeout(() => setChange(null), CHANGE_MS);
    return () => window.clearTimeout(id);
  }, [change]);
  const changed = change?.key === viewKey ? change : null;

  // First time a plane is met: explain it once, but not over another window: it waits for it to close.
  useEffect(() => {
    if (hold || !['sagitala', 'zeharkakoa', 'koronala', 'dortsala'].includes(plane) || readSeen().includes(plane)) return;
    const on = window.setTimeout(() => {
      markSeen(plane);
      setOpen('auto');
    }, 400);
    return () => window.clearTimeout(on);
  }, [plane, hold]);
  useEffect(() => {
    if (open !== 'auto') return;
    const off = window.setTimeout(() => setOpen(false), 8000);
    return () => window.clearTimeout(off);
  }, [open]);
  const [wasHeld, setWasHeld] = useState(hold);
  if (wasHeld !== hold) {
    setWasHeld(hold);
    if (hold && open) setOpen(false);
  }
  const shown = !!open;

  // Dragging the plane: along the body, snapping to the topic's cuts.
  const line = stops && stops.length > 1 && shape === 'c' ? levelLine(week, day, plane, flip) : null;
  const [drag, setDrag] = useState<{ level: number; stop: CutStop } | null>(null);
  const svgBox = useRef<HTMLDivElement>(null);
  const levelFrom = (clientX: number, clientY: number) => {
    const el = svgBox.current?.querySelector('svg');
    if (!el || !line) return null;
    const r = el.getBoundingClientRect();
    // The sketch's 120×88 box is fitted into the element (xMidYMid meet).
    const k = Math.min(r.width / 120, r.height / 88);
    const x = (clientX - r.left - (r.width - 120 * k) / 2) / k;
    const y = (clientY - r.top - (r.height - 88 * k) / 2) / k;
    const [p0, p1] = line;
    const d: [number, number] = [p1[0] - p0[0], p1[1] - p0[1]];
    const u = ((x - p0[0]) * d[0] + (y - p0[1]) * d[1]) / (d[0] * d[0] + d[1] * d[1] || 1);
    return Math.max(0, Math.min(1, u));
  };
  const nearest = (l: number) => stops!.reduce((b, s) => (Math.abs(s.level - l) < Math.abs(b.level - l) ? s : b));
  const here = stops?.find((s) => `${week}/${s.stage}/${s.view}` === viewKey);

  const leveled = plane === 'zeharkakoa' || plane === 'xehetasuna';
  const where = leveled
    ? `Maila: ${note ?? levelName(level)}.`
    : plane === 'sagitala'
      ? 'Erdiko lerroan.'
      : plane === 'dortsala'
        ? 'Goitik begiratuta.'
        : plane === 'koronala'
          ? 'Orrialdearen planoan.'
          : '';
  const shownLevel = drag?.level ?? level;

  return (
    <div className={`live-map${changed ? ' is-changed' : ''}${drag ? ' is-drag' : ''}`} data-tour="non-nago">
      <div
        ref={svgBox}
        className={`lm-fig${line ? ' can-drag' : ''}${shown ? ' is-on' : ''}`}
        key={changed ? `c-${viewKey}` : 'still'}
        role="button"
        tabIndex={0}
        aria-expanded={shown}
        aria-label={`Non nago? ${info.name}${line ? ' · arrastatu planoa beste maila batera' : ''}`}
        title={line ? `Non nago? ${info.name} · ${SHAPE_TEXT[shape]}\nArrastatu plano horia gora edo behera: gaiaren beste zeharkako mozketak (marka txikiak)` : `Non nago? ${info.name} · ${SHAPE_TEXT[shape]}`}
        onClick={() => {
          if (drag) return;
          if (!shown) onOpen?.();
          setOpen(shown ? false : 'user');
        }}
        onKeyDown={(e) => {
          if (e.key !== 'Enter' && e.key !== ' ') return;
          e.preventDefault();
          e.stopPropagation();
          if (!shown) onOpen?.();
          setOpen(shown ? false : 'user');
        }}
        onPointerDown={(e) => {
          if (!line) return;
          const l = levelFrom(e.clientX, e.clientY);
          if (l === null || Math.abs(l - level) > 0.16) return;
          (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
          setDrag({ level: l, stop: nearest(l) });
        }}
        onPointerMove={(e) => {
          if (!drag) return;
          const l = levelFrom(e.clientX, e.clientY);
          if (l !== null) setDrag({ level: l, stop: nearest(l) });
        }}
        onPointerUp={() => {
          if (!drag) return;
          const s = drag.stop;
          // Let the click that follows the release see the drag, then forget it.
          window.setTimeout(() => setDrag(null), 0);
          if (`${week}/${s.stage}/${s.view}` !== viewKey) onStop?.(s);
        }}
        onPointerCancel={() => setDrag(null)}
      >
        {plane === 'eskema' ? (
          <SchemeGlyph />
        ) : (
          <Specimen
            plane={plane}
            week={week}
            day={day}
            level={drag ? drag.stop.level : shownLevel}
            flip={flip}
            prev={changed && changed.fromPlane !== plane ? changed.fromPlane : null}
            ticks={line ? stops!.map((s) => ({ level: s.level, on: s === (drag?.stop ?? here) })) : undefined}
          />
        )}
        {changed && <span className="lm-new">Ikuspegi berria</span>}
      </div>
      <div className="lm-text">
        <nav className="lm-crumbs" aria-label="Non nago">
          {crumbs.map((c, i) => {
            const last = i === crumbs.length - 1;
            return (
              <span key={i} className={last ? 'is-here' : undefined}>
                {i > 0 && <i aria-hidden>›</i>}
                {c.onClick && !last ? (
                  <button onClick={c.onClick} title={c.tip}>
                    {c.label}
                  </button>
                ) : (
                  <b title={c.tip}>{c.label}</b>
                )}
              </span>
            );
          })}
        </nav>
        <small className="lm-plane">{drag ? `→ ${drag.stop.note} · ${drag.stop.title}` : info.name}</small>
      </div>
      {shown && (
        <div className="loc-card" role="dialog" aria-label="Non nago?">
          <div className="loc-big">
            <Specimen plane={plane} week={week} day={day} level={level} flip={flip} big />
          </div>
          <div>
            <p className="kicker">Non nago?</p>
            <h4>{info.name}</h4>
            {view && <p className="loc-view">{view}</p>}
            <p>{info.text}</p>
            <p className="loc-where">
              Irudian: {SHAPE_TEXT[shape]}. {where} {leveled ? null : note}
            </p>
            {line && <p className="loc-dirs">Arrastatu plano horia gora edo behera: gaiaren beste zeharkako mozketetara salto egiten du (marka txikiak).</p>}
            <p className="loc-dirs">Horia = orain ikusten duzun planoa · Kr = kraneala (burua) · Ka = kaudala (buztana) · Dor = dortsala (bizkarra) · Ben = bentrala (sabela)</p>
            <div className="loc-foot">
              <Link className="link-quiet" href="/astea/1?etapa=terminoak">
                Planoak eta ardatzak (1. gaia) →
              </Link>
              <button className="btn small" onClick={() => setOpen(false)}>
                Ulertuta
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
