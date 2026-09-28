'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import type { PlaneKind } from '@/lib/sim/types';

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
const markSeen = (plane: string) => {
  try {
    window.localStorage.setItem(SEEN_KEY, JSON.stringify([...new Set([...readSeen(), plane])]));
  } catch {}
};

const levelName = (l: number) => (l < 0.3 ? 'buru-aldean' : l > 0.7 ? 'buztan-aldean' : 'erdiko mailan (enborra)');

type Shape = 'blastozistoa' | 'diskoa' | 'udarea' | 'luzanga' | 'c';
const shapeOf = (day: number): Shape => (day < 6 ? 'blastozistoa' : day < 15 ? 'diskoa' : day < 20 ? 'udarea' : day <= 28 ? 'luzanga' : 'c');
const SHAPE_NAME: Record<Shape, string> = {
  blastozistoa: 'blastozistoa',
  diskoa: 'bi orriko diskoa (goitik)',
  udarea: 'hiru orriko diskoa (goitik)',
  luzanga: 'enbrioia tolesten (goitik)',
  c: 'C itxurako enbrioia (albotik)',
};

/**
 * The mini specimen for this age, cranial up, with the cut (or the eye) drawn on it. Coordinates are
 * in a 100×70 box; `big` adds the direction letters.
 */
function Mini({ plane, day, level, big }: { plane: PlaneKind; day: number; level: number; big?: boolean }) {
  const shape = shapeOf(day);
  const body = 'rgba(232,238,252,0.16)';
  const edge = 'rgba(232,238,252,0.55)';
  // Vertical extent of the specimen (for the transverse level line).
  const [y0, y1] = shape === 'blastozistoa' ? [14, 56] : shape === 'diskoa' ? [18, 52] : shape === 'c' ? [10, 60] : [8, 62];
  const ly = y0 + (y1 - y0) * level;
  const halfW = (y: number) => {
    if (shape === 'blastozistoa') return Math.sqrt(Math.max(0, 21 * 21 - (y - 35) ** 2));
    if (shape === 'diskoa') return 22 * Math.sqrt(Math.max(0, 1 - ((y - 35) / 17) ** 2));
    if (shape === 'udarea') return 12 + 9 * (1 - (y - 8) / 54) * Math.sqrt(Math.max(0, 1 - ((y - 35) / 27) ** 2));
    return 11 * Math.sqrt(Math.max(0, 1 - ((y - 35) / 27) ** 2)) + 2;
  };
  let spec;
  if (shape === 'blastozistoa')
    spec = (
      <>
        <circle cx={50} cy={35} r={21} fill={body} stroke={edge} />
        <path d="M36 22a18 18 0 0 1 28 0v4H36z" fill="rgba(122,167,245,0.55)" />
      </>
    );
  else if (shape === 'diskoa') spec = <ellipse cx={50} cy={35} rx={22} ry={17} fill={body} stroke={edge} />;
  else if (shape === 'udarea')
    spec = (
      <>
        <path d="M50 8C70 8 72 30 63 46 58 56 55 62 50 62 45 62 42 56 37 46 28 30 30 8 50 8Z" fill={body} stroke={edge} />
        <path d="M50 44V58" stroke="#e8eefc" strokeWidth={1.4} opacity={0.6} />
      </>
    );
  else if (shape === 'luzanga')
    spec = (
      <>
        <path d="M50 7C60 7 63 16 61 26 60 36 60 48 56 58 54 62 46 62 44 58 40 48 40 36 39 26 37 16 40 7 50 7Z" fill={body} stroke={edge} />
        {[24, 30, 36, 42, 48].map((y) => (
          <g key={y} fill="rgba(239,75,75,0.55)">
            <rect x={42} y={y} width={4} height={3} rx={1} />
            <rect x={54} y={y} width={4} height={3} rx={1} />
          </g>
        ))}
      </>
    );
  else spec = <path d="M44 12C62 6 76 20 72 38 69 52 56 62 44 58 34 55 32 46 40 44 50 42 52 34 44 30 36 26 30 16 44 12Z" fill={body} stroke={edge} />;

  const Y = '#fbbf24';
  let cut = null;
  if (plane === 'sagitala') cut = shape === 'c' ? <path d="M44 12C62 6 76 20 72 38 69 52 56 62 44 58" fill="none" stroke={Y} strokeWidth={2} className="loc-cut" /> : <path d={`M50 ${y0 - 4}V${y1 + 4}`} stroke={Y} strokeWidth={2} className="loc-cut" />;
  else if (plane === 'zeharkakoa') {
    const w = halfW(ly) + 7;
    cut = <path d={`M${50 - w} ${ly}H${50 + w}`} stroke={Y} strokeWidth={2} className="loc-cut" />;
  } else if (plane === 'koronala') cut = <rect x={26} y={y0 - 2} width={48} height={y1 - y0 + 4} rx={6} fill="rgba(251,191,36,0.18)" stroke={Y} strokeDasharray="3 2" className="loc-cut" />;
  else if (plane === 'dortsala' || plane === 'kanpokoa')
    cut = (
      <g className="loc-cut" stroke={Y} fill="none" strokeWidth={1.6}>
        <path d="M80 10q6-6 12 0q-6 6-12 0Z" />
        <circle cx={86} cy={10} r={1.6} fill={Y} />
        <path d="M84 16L72 26" strokeDasharray="2 2" />
      </g>
    );
  else if (plane === 'xehetasuna')
    cut = (
      <g className="loc-cut" stroke={Y} fill="none" strokeWidth={1.8}>
        <circle cx={50} cy={ly} r={7} />
        <path d="M55 40l8 8" />
      </g>
    );

  const t = { fontSize: 7.5, fill: 'rgba(232,238,252,0.6)', fontFamily: 'var(--font-mono)' } as const;
  return (
    <svg viewBox="0 0 100 70" className="loc-svg" aria-hidden>
      {spec}
      {cut}
      {big && shape !== 'c' && (
        <>
          <text x={50} y={6} textAnchor="middle" {...t}>
            Kr
          </text>
          <text x={50} y={69} textAnchor="middle" {...t}>
            Ka
          </text>
          {shape !== 'blastozistoa' && (
            <>
              <text x={16} y={37} textAnchor="middle" {...t}>
                Ez
              </text>
              <text x={84} y={37} textAnchor="middle" {...t}>
                Esk
              </text>
            </>
          )}
        </>
      )}
      {big && shape === 'c' && (
        <>
          <text x={36} y={9} {...t}>
            Kr
          </text>
          <text x={80} y={40} {...t}>
            Dor
          </text>
        </>
      )}
    </svg>
  );
}

/**
 * "Non nago?": a mini specimen of this age with the plane on it, always visible next to the view tabs.
 * The card explains the plane (opened automatically the first time a plane appears) and where the cut is.
 */
export function Locator({ plane, day, level = 0.5, viewKey, note, hold }: { plane: PlaneKind; day: number; level?: number; viewKey: string; note?: string; hold?: boolean }) {
  const [open, setOpen] = useState(false);
  const auto = useRef(false);
  const shape = shapeOf(day);
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
        title={`Non nago? ${info.name} · ${SHAPE_NAME[shape]}`}
      >
        <Mini plane={plane} day={day} level={level} />
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
            <Mini plane={plane} day={day} level={level} big />
          </div>
          <div>
            <p className="kicker">Non nago?</p>
            <h4>{info.name}</h4>
            <p>{info.text}</p>
            <p className="loc-where">
              {SHAPE_NAME[shape]}. {where} {note}
            </p>
            <p className="loc-dirs">Kr = kraneala (burua) · Ka = kaudala (buztana) · Ez/Esk = ezkerra/eskuina · Dor = dortsala (bizkarra)</p>
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
