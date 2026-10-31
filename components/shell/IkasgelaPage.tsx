'use client';

import Link from 'next/link';
import { useEffect, type ReactNode } from 'react';
import { getWeek } from '@/content/registry';
import { MIGRATIONS } from '@/content/migrations';
import { LandFoot, LandNav } from './LandNav';
import { ROOM_WEEKS } from './eratorriak/roomWeeks';
import { Topic7Study } from './eratorriak/Topic7';
import { Topic8Study } from './eratorriak/Topic8';
import { Topic9Study } from './eratorriak/Topic9';
import { Topic10Study } from './eratorriak/Topic10';
import { Topic11Study } from './eratorriak/Topic11';
import { Topic12Study } from './eratorriak/Topic12';
import { Topic13Study } from './eratorriak/Topic13';

const ROOMS: Record<number, () => ReactNode> = {
  7: () => <Topic7Study />,
  8: () => <Topic8Study />,
  9: () => <Topic9Study />,
  10: () => <Topic10Study />,
  11: () => <Topic11Study />,
  12: () => <Topic12Study />,
  13: () => <Topic13Study />,
};

const nameOf = (week: number) => MIGRATIONS.find((t) => t.week === week)?.short ?? getWeek(week)?.title ?? `${week}. gaia`;

/** One topic's study room (3D, time diagram, tables, figures, flashcards) on a page of its own. */
export function IkasgelaPage({ week }: { week: number }) {
  // Old links into a room ("#a12-taula") land on that section.
  useEffect(() => {
    const id = decodeURIComponent(window.location.hash.slice(1));
    if (id) requestAnimationFrame(() => document.getElementById(id)?.scrollIntoView({ block: 'start' }));
  }, []);
  return (
    <div className="landing ln-page ik-page">
      <LandNav current="ikasgela" />
      <header className="ik-head">
        <div className="ik-title">
          <h1>Ikasgelak</h1>
          <nav className="ik-topics" aria-label="Gaiak">
            {ROOM_WEEKS.map((w) => (
              <Link key={w} href={`/ikasgela/${w}`} className={w === week ? 'is-on' : undefined} aria-current={w === week ? 'page' : undefined}>
                <b>{w}</b>
                {nameOf(w)}
              </Link>
            ))}
          </nav>
        </div>
        <div className="ik-links">
          <Link href={`/eratorriak#gaia-${week}`}>Taulak eta eskemak →</Link>
          <Link href={`/astea/${week}`}>Simulagailua →</Link>
        </div>
      </header>
      <section className="land-section ik-room">{ROOMS[week]?.()}</section>
      <LandFoot />
    </div>
  );
}
