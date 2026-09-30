'use client';

import { useId } from 'react';
import type { Mood } from '@/lib/kimu/types';

/**
 * Kimu: a chubby little embryo with a sprout on its head ("kimu" is Basque for sprout). Drawn in SVG so
 * it scales from the 28px chat avatar to the welcome portrait, and the mood changes only the face.
 * Motion (breathing, blinking, swaying sprout, tail) is CSS and switched off for reduced motion.
 */
export function KimuFace({ mood = 'happy', talking = false, size = 96, still = false }: { mood?: Mood; talking?: boolean; size?: number; still?: boolean }) {
  const uid = useId().replace(/:/g, '');
  const body = `kb${uid}`;
  const glow = `kg${uid}`;
  const leaf = `kl${uid}`;
  const shut = mood === 'proud';
  const lookUp = mood === 'thinking';

  return (
    <svg className={`kimu-face is-${mood}${talking ? ' is-talking' : ''}${still ? ' is-still' : ''}`} width={size} height={size} viewBox="0 0 120 120" role="img" aria-label="Kimu">
      <defs>
        <radialGradient id={body} cx="38%" cy="30%" r="85%">
          <stop offset="0" stopColor="#ffd9b8" />
          <stop offset="0.55" stopColor="#ffa877" />
          <stop offset="1" stopColor="#ff7a4d" />
        </radialGradient>
        <radialGradient id={glow} cx="50%" cy="50%" r="50%">
          <stop offset="0" stopColor="#ff6a3d" stopOpacity="0.35" />
          <stop offset="1" stopColor="#ff6a3d" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={leaf} x1="0" y1="1" x2="1" y2="0">
          <stop offset="0" stopColor="#4fbf7a" />
          <stop offset="1" stopColor="#a4e6a0" />
        </linearGradient>
      </defs>

      <ellipse cx="60" cy="66" rx="52" ry="50" fill={`url(#${glow})`} />
      <ellipse className="kf-shadow" cx="60" cy="110" rx="26" ry="4.5" fill="#000" opacity="0.28" />

      <g className="kf-bob">
        {/* tail: the embryo's curl */}
        <path className="kf-tail" d="M84 92c14 2 22-8 18-17-2-4-8-4-8 0 1 4 6 3 6 3" fill="none" stroke="#ff8f5e" strokeWidth="7" strokeLinecap="round" />

        {/* sprout */}
        <g className="kf-sprout">
          <path d="M60 26c0-8 1-13 3-17" fill="none" stroke="#3aa869" strokeWidth="3.4" strokeLinecap="round" />
          <path d="M63 12c1-8 9-12 18-10-1 8-8 13-18 10z" fill={`url(#${leaf})`} />
          <path d="M62 16c-1-7-8-10-16-8 1 7 8 11 16 8z" fill={`url(#${leaf})`} opacity="0.92" />
          <path d="M63 12c5-1 10-4 14-8" fill="none" stroke="#2f8f57" strokeWidth="1" strokeLinecap="round" opacity="0.5" />
        </g>

        {/* head + body, one soft bean */}
        <g className="kf-tilt">
          <path d="M60 26c-22 0-38 15-38 37 0 12 4 21 11 28 5 5 13 8 22 8s18-3 24-9c8-7 12-16 12-27 0-22-16-37-31-37z" fill={`url(#${body})`} />
          <path d="M34 44c4-9 12-14 22-15" fill="none" stroke="#fff" strokeWidth="4" strokeLinecap="round" opacity="0.4" />
          {/* little hands */}
          <ellipse className="kf-hand-l" cx="26" cy="82" rx="6.5" ry="5" fill="#ff9a68" transform="rotate(28 26 82)" />
          <ellipse className="kf-hand-r" cx="93" cy="82" rx="6.5" ry="5" fill="#ff9a68" transform="rotate(-28 93 82)" />

          {/* cheeks */}
          <ellipse cx="38" cy="72" rx="7" ry="4.6" fill="#ff5b6b" opacity="0.42" />
          <ellipse cx="82" cy="72" rx="7" ry="4.6" fill="#ff5b6b" opacity="0.42" />

          {/* brows */}
          {mood === 'curious' && (
            <>
              <path d="M40 50q6-4 12-1" fill="none" stroke="#5a2a1a" strokeWidth="2.6" strokeLinecap="round" />
              <path d="M68 47q6-3 12 1" fill="none" stroke="#5a2a1a" strokeWidth="2.6" strokeLinecap="round" transform="translate(0 -3)" />
            </>
          )}
          {mood === 'sorry' && (
            <>
              <path d="M39 51q7 1 13-3" fill="none" stroke="#5a2a1a" strokeWidth="2.6" strokeLinecap="round" />
              <path d="M68 48q6 4 13 3" fill="none" stroke="#5a2a1a" strokeWidth="2.6" strokeLinecap="round" />
            </>
          )}

          {/* eyes */}
          <g className="kf-eyes">
            {shut ? (
              <>
                <path d="M39 61q7-8 14 0" fill="none" stroke="#3b1c12" strokeWidth="3.6" strokeLinecap="round" />
                <path d="M67 61q7-8 14 0" fill="none" stroke="#3b1c12" strokeWidth="3.6" strokeLinecap="round" />
              </>
            ) : (
              <>
                <g className="kf-eye">
                  <ellipse cx="46" cy="60" rx="6.6" ry="8" fill="#2a130c" />
                  <circle cx={lookUp ? 48 : 47.6} cy={lookUp ? 55.6 : 57} r="2.5" fill="#fff" />
                  <circle cx="44.2" cy="63" r="1.2" fill="#fff" opacity="0.85" />
                </g>
                <g className="kf-eye">
                  <ellipse cx="74" cy="60" rx="6.6" ry="8" fill="#2a130c" />
                  <circle cx={lookUp ? 76 : 75.6} cy={lookUp ? 55.6 : 57} r="2.5" fill="#fff" />
                  <circle cx="72.2" cy="63" r="1.2" fill="#fff" opacity="0.85" />
                </g>
              </>
            )}
          </g>

          {/* mouth */}
          <g className="kf-mouth">
            {mood === 'happy' && <path d="M50 74q10 10 20 0" fill="#7a2b1c" stroke="#7a2b1c" strokeWidth="2.6" strokeLinejoin="round" strokeLinecap="round" />}
            {mood === 'proud' && <path d="M48 72q12 15 24 0z" fill="#7a2b1c" stroke="#7a2b1c" strokeWidth="2.6" strokeLinejoin="round" />}
            {mood === 'curious' && <ellipse cx="60" cy="77" rx="4.2" ry="5" fill="#7a2b1c" />}
            {mood === 'thinking' && <path d="M53 77q7 3 14-1" fill="none" stroke="#7a2b1c" strokeWidth="3" strokeLinecap="round" />}
            {mood === 'sorry' && <path d="M52 79q8-7 16 0" fill="none" stroke="#7a2b1c" strokeWidth="3" strokeLinecap="round" />}
          </g>
        </g>

        {mood === 'sorry' && <path className="kf-drop" d="M91 44c3 5 5 8 5 11a5 5 0 0 1-10 0c0-3 2-6 5-11z" fill="#8fd3ff" opacity="0.9" />}
      </g>
    </svg>
  );
}
