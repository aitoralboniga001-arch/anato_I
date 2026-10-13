'use client';

import { useId } from 'react';
import type { Mood } from '@/lib/kimu/types';

/**
 * Kimu: a little embryo with a sprout on its head ("kimu" is Basque for sprout) — a big round head, the
 * embryo's tapering tail curled behind it, embryo pink (not a fruit), two leaves on top. Drawn for the sizes it is really shown at (16–30px in
 * the top bar, the launcher and the panel header): a strong warm silhouette, big eyes, nothing thinner
 * than it can show. The mood changes only the face; while Kimu reads the notes ("thinking") the sprout
 * sways and the eyes look up. Motion is CSS (kimu.css) and off for `still` and reduced motion.
 */
export function KimuFace({ mood = 'happy', talking = false, size = 24, still = false }: { mood?: Mood; talking?: boolean; size?: number; still?: boolean }) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const body = `kb${uid}`;
  const leaf = `kl${uid}`;
  const shut = mood === 'proud';
  const up = mood === 'thinking' ? -1.1 : 0;
  // Below ~22px the hands and the leaf vein are only noise: the face and the silhouette carry it.
  const small = size < 22;

  return (
    <svg className={`kimu-face is-${mood}${talking ? ' is-talking' : ''}${still ? ' is-still' : ''}`} width={size} height={size} viewBox="-1 -1 50 50" aria-hidden>
      <defs>
        <radialGradient id={body} cx="36%" cy="30%" r="78%">
          <stop offset="0" stopColor="#ffe6dc" />
          <stop offset="0.5" stopColor="#ffa594" />
          <stop offset="1" stopColor="#e5685e" />
        </radialGradient>
        <linearGradient id={leaf} x1="0" y1="1" x2="1" y2="0">
          <stop offset="0" stopColor="#3fb36b" />
          <stop offset="1" stopColor="#a6eaa0" />
        </linearGradient>
      </defs>

      {/* the embryo's curl, behind the body */}
      <path className="kf-tail" d="M30.6 35.2c6.2 4.4 12.4 2.4 13.4-3.2.6-3.4-1.8-5.8-4.2-4.8-1.6.7-1.6 2.7-.4 3.4.9.5.7 1.9-.5 2.6-2.6 1.4-5.6.4-8.4-2.8Z" fill="#ef8579" stroke="#c4524a" strokeOpacity="0.5" strokeWidth="0.8" strokeLinejoin="round" />

      {/* sprout */}
      <g className="kf-sprout">
        <path d="M24 11c0-3 .5-5.2 1.8-7" fill="none" stroke="#2f9a5c" strokeWidth="2" strokeLinecap="round" />
        <path d="M25.6 4.6c1-3.2 4.8-4.8 8.6-3.8-.6 3.6-4.2 5.6-8.6 3.8Z" fill={`url(#${leaf})`} />
        <path d="M24.6 6.4c-1-2.8-4.2-4.2-7.6-3.4.8 3 3.8 4.6 7.6 3.4Z" fill={`url(#${leaf})`} opacity="0.92" />
        {!small && <path d="M26.4 4.2c2.2-.3 4.4-1.3 6.2-2.9" fill="none" stroke="#2a7f4b" strokeWidth="0.6" strokeLinecap="round" opacity="0.6" />}
      </g>

      {/* head and body: one soft bean */}
      <g className="kf-tilt">
        <path d="M24 10C14.6 10 8 17.2 8 26.2 8 35 14.4 41.2 23.2 41.2 31.8 41.2 38 35.4 38 26.8 38 17.4 31.6 10 24 10Z" fill={`url(#${body})`} stroke="#c4524a" strokeOpacity="0.55" strokeWidth="0.9" />
        <path d="M13.6 19.4c2-4 5.4-6.4 9.6-6.8" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" opacity="0.5" />
        {!small && (
          <g className="kf-hands" fill="#f08a7c">
            <ellipse className="kf-hand-l" cx="10.2" cy="33.4" rx="2.6" ry="2" transform="rotate(28 10.2 33.4)" />
            <ellipse className="kf-hand-r" cx="36" cy="33.2" rx="2.6" ry="2" transform="rotate(-28 36 33.2)" />
          </g>
        )}

        {/* cheeks */}
        <ellipse cx="14.8" cy="30.8" rx="2.9" ry="1.8" fill="#ff5b6b" opacity="0.42" />
        <ellipse cx="32.2" cy="30.8" rx="2.9" ry="1.8" fill="#ff5b6b" opacity="0.42" />

        {/* brows */}
        {mood === 'curious' && <path d="M27.2 19.6q2.6-1.6 5 .2" fill="none" stroke="#5a2a1a" strokeWidth="1.3" strokeLinecap="round" />}
        {mood === 'sorry' && (
          <g fill="none" stroke="#5a2a1a" strokeWidth="1.3" strokeLinecap="round">
            <path d="M15.4 20.6q2.8.6 5-1.2" />
            <path d="M26.6 19.4q2.2 1.8 5 1.2" />
          </g>
        )}

        {/* eyes */}
        {shut ? (
          <g fill="none" stroke="#3b1c12" strokeWidth="1.7" strokeLinecap="round">
            <path d="M15.6 25.6q2.8-3.2 5.6 0" />
            <path d="M26.2 25.6q2.8-3.2 5.6 0" />
          </g>
        ) : (
          <>
            <g className="kf-eye">
              <ellipse cx="18.4" cy="25" rx="2.9" ry="3.5" fill="#2a130c" />
              <circle cx="19.3" cy={23.7 + up} r="1.15" fill="#fff" />
            </g>
            <g className="kf-eye">
              <ellipse cx="29" cy="25" rx="2.9" ry="3.5" fill="#2a130c" />
              <circle cx="29.9" cy={23.7 + up} r="1.15" fill="#fff" />
            </g>
          </>
        )}

        {/* mouth */}
        <g className="kf-mouth" fill="#7a2b1c" stroke="#7a2b1c" strokeLinecap="round" strokeLinejoin="round">
          {mood === 'happy' && <path d="M21.4 30.4q2.4 3.4 4.8 0Z" strokeWidth="1.1" />}
          {mood === 'proud' && <path d="M20.6 29.8q3.2 4.8 6.4 0Z" strokeWidth="1.1" />}
          {mood === 'curious' && <ellipse cx="23.8" cy="31.4" rx="1.5" ry="1.8" stroke="none" />}
          {mood === 'thinking' && <path d="M21.6 31.4q2.2 1 4.4-.4" fill="none" strokeWidth="1.3" />}
          {mood === 'sorry' && <path d="M21.4 32.4q2.4-2.6 4.8 0" fill="none" strokeWidth="1.3" />}
        </g>
      </g>

      {mood === 'sorry' && <path className="kf-drop" d="M37.6 17.4c1.2 2 2 3.2 2 4.4a2 2 0 0 1-4 0c0-1.2.8-2.4 2-4.4Z" fill="#8fd3ff" opacity="0.9" />}
    </svg>
  );
}
