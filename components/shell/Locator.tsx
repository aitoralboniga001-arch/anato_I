'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import type { Orientation, PlaneKind } from '@/lib/sim/types';
import { SHAPE_TEXT, Specimen, shapeFor } from './Specimen';
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

const levelName = (l: number) => (l < 0.3 ? 'buru-aldean' : l > 0.7 ? 'buztan-aldean' : 'erdiko mailan (enborra)');

/**
 * "Non nago?": a 3-D sketch of what is being looked at at this age with the plane on it, always
 * visible next to the view tabs. The card explains the plane (opened automatically the first time a
 * plane appears) and where the cut is.
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
  hold,
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
  hold?: boolean;
}) {
  // 'auto': opened by itself the first time a plane is met; 'user': opened from the button.
  const [open, setOpen] = useState<false | 'auto' | 'user'>(false);
  // The card folds back into the thumbnail: a short glow on the button says where it went.
  const [absorb, setAbsorb] = useState(0);
  const shape = shapeFor(week, day, plane);
  const flip = flipOf(orientation);
  const info = PLANE_TEXT[plane];

  // First time a plane is met: explain it once (the [?] brings it back any time), but not over
  // another window (the welcome, a question, the view-change card…): it waits for it to close.
  useEffect(() => {
    if (hold || !['sagitala', 'zeharkakoa', 'koronala', 'dortsala'].includes(plane) || readSeen().includes(plane)) return;
    const on = window.setTimeout(() => {
      markSeen(plane);
      setOpen('auto');
    }, 400);
    return () => window.clearTimeout(on);
  }, [plane, hold]);

  // The automatic card folds away by itself after a while.
  useEffect(() => {
    if (open !== 'auto') return;
    const off = window.setTimeout(() => {
      setOpen(false);
      setAbsorb((n) => n + 1);
    }, 8000);
    return () => window.clearTimeout(off);
  }, [open]);
  // When another window takes the stage (a question, the view-change card…), an open card gives way;
  // the student can still open it again over that window on purpose.
  const [wasHeld, setWasHeld] = useState(hold);
  if (wasHeld !== hold) {
    setWasHeld(hold);
    if (hold && open) setOpen(false);
  }
  const shown = !!open;

  const where =
    plane === 'zeharkakoa' || plane === 'xehetasuna'
      ? `Maila: ${levelName(level)}.`
      : plane === 'sagitala'
        ? 'Erdiko lerroan.'
        : plane === 'dortsala'
          ? 'Goitik begiratuta.'
          : plane === 'koronala'
            ? 'Orrialdearen planoan.'
            : '';

  return (
    <div className="loc">
      <button
        key={absorb ? `${viewKey}/${absorb}` : viewKey}
        className={`loc-btn${shown ? ' is-on' : ''}${absorb ? ' is-absorb' : ''}`}
        onClick={() => setOpen(shown ? false : 'user')}
        aria-expanded={shown}
        title={`Non nago? ${info.name} · ${SHAPE_TEXT[shape]}${view ? `
${view}` : ''}`}
      >
        <Specimen plane={plane} week={week} day={day} level={level} flip={flip} />
        <span className="loc-txt">
          <small>Non nago?</small>
          <b>{info.name}</b>
        </span>
        <span className="loc-q" aria-hidden>
          ?
        </span>
      </button>
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
              Irudian: {SHAPE_TEXT[shape]}. {where} {note}
            </p>
            <p className="loc-dirs">Horia = orain ikusten duzun planoa · Kr = kraneala (burua) · Ka = kaudala (buztana) · Dor = dortsala (bizkarra) · Ben = bentrala (sabela)</p>
            <div className="loc-foot">
              <Link className="link-quiet" href="/astea/1?etapa=terminoak">
                Planoak eta ardatzak (1. gaia) →
              </Link>
              <button
                className="btn small ghost"
                onClick={() => {
                  setOpen(false);
                  setAbsorb((n) => n + 1);
                }}
              >
                Ulertuta
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
