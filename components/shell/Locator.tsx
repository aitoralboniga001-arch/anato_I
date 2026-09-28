'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
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
  hold,
}: {
  plane: PlaneKind;
  week: number;
  day: number;
  level?: number;
  orientation?: Orientation;
  viewKey: string;
  note?: string;
  hold?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const auto = useRef(false);
  const shape = shapeFor(week, day, plane);
  const flip = flipOf(orientation);
  const info = PLANE_TEXT[plane];

  // First time a plane is met: explain it once (the [?] brings it back any time), but not over
  // another window (the welcome, a question…): it waits for it to close.
  useEffect(() => {
    if (hold || !['sagitala', 'zeharkakoa', 'koronala', 'dortsala'].includes(plane) || readSeen().includes(plane)) return;
    auto.current = true;
    const on = window.setTimeout(() => {
      markSeen(plane);
      setOpen(true);
    }, 400);
    const off = window.setTimeout(() => {
      if (auto.current) setOpen(false);
    }, 9400);
    return () => {
      window.clearTimeout(on);
      window.clearTimeout(off);
    };
  }, [plane, hold]);

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
        key={viewKey}
        className={`loc-btn${open ? ' is-on' : ''}`}
        onClick={() => {
          auto.current = false;
          setOpen((v) => !v);
        }}
        aria-expanded={open}
        title={`Non nago? ${info.name} · ${SHAPE_TEXT[shape]}`}
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
      {open && (
        <div className="loc-card" role="dialog" aria-label="Non nago?">
          <div className="loc-big">
            <Specimen plane={plane} week={week} day={day} level={level} flip={flip} big />
          </div>
          <div>
            <p className="kicker">Non nago?</p>
            <h4>{info.name}</h4>
            <p>{info.text}</p>
            <p className="loc-where">
              Irudian: {SHAPE_TEXT[shape]}. {where} {note}
            </p>
            <p className="loc-dirs">Horia = orain ikusten duzun planoa · Kr = kraneala (burua) · Ka = kaudala (buztana) · Dor = dortsala (bizkarra) · Ben = bentrala (sabela)</p>
            <div className="loc-foot">
              <Link className="link-quiet" href="/astea/1?etapa=terminoak">
                Planoak eta ardatzak (1. gaia) →
              </Link>
              <button className="btn small ghost" onClick={() => setOpen(false)}>
                Ulertuta
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
