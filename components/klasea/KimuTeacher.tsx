'use client';

import { useId } from 'react';
import type { Pose } from '@/lib/klasea/engine';
import type { Facing } from '@/lib/klasea/stand';
import styles from './klasea.module.css';

/**
 * Kimu as the class's teacher, full body: the chat's embryo bean grown up, on two short legs, with a free
 * hand that gestures and a telescopic pointer in the other. It walks about the scene (KimuWalker places
 * it), faces what it names and points at it; the pointer's tip stops just short of the structure, so
 * nothing is drawn on the specimen. While the voice speaks the mouth follows the words.
 */

/** Mouth shape from the word being said: its first vowel (a / e-i / o-u), closed between words. */
const mouthOf = (word: string) => {
  const v = /[aeiouáéíóú]/i.exec(word)?.[0]?.toLowerCase() ?? '';
  return v === 'a' || v === 'á' ? 'a' : v && 'eéií'.includes(v) ? 'e' : v && 'oóuú'.includes(v) ? 'o' : 'm';
};

/** The free arm's angle per pose (Kimu's own frame: 0 = ahead, 90 = down, −90 = up). */
const FREE: Record<Pose, number> = { listen: 112, talk: 60, emphasis: -125, caution: -95, think: 28, praise: -140, gentle: 100, look: 105 };

/** Pointer: arm 16 units, a telescopic stick up to 150 more (so Kimu can stand clear of the drawing). */
export const ARM = 16;
export const STICK = 150;

export function KimuTeacher({ pose, facing, arm, speaking, word, walking, look, reduced }: {
  pose: Pose;
  facing: Facing;
  /** The pointer arm: angle (own frame) and how far the stick is drawn out (0..1); null: at rest. */
  arm: { angle: number; reach: number } | null;
  speaking: boolean;
  word: string;
  walking: boolean;
  /** Where the eyes go: what it points at, the board, the student, or ahead (walking). */
  look: 'aim' | 'board' | 'student' | 'ahead';
  reduced: boolean;
}) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const body = `kt-b${uid}`;
  const rim = `kt-r${uid}`;
  const leaf = `kt-l${uid}`;
  const mouth = speaking ? mouthOf(word) : 'm';

  // Pointer arm: aimed, or held down along the side (stick short) when nothing is named.
  const stickAngle = arm ? arm.angle : look === 'board' ? -35 : 98;
  const stickLen = arm ? 18 + (STICK - 18) * arm.reach : look === 'board' ? 26 : 22;
  const a = (stickAngle * Math.PI) / 180;
  const eye = look === 'student' ? { x: 0, y: 0.8 } : look === 'ahead' ? { x: 1.8, y: 0.2 } : { x: Math.cos(a) * 1.8, y: Math.sin(a) * 1.5 };

  return (
    <svg
      className={`${styles.teacher} ${styles[`pose_${pose}`] ?? ''}${speaking ? ` ${styles.speaking}` : ''}${walking ? ` ${styles.walking}` : ''}${reduced ? ` ${styles.still}` : ''}`}
      viewBox="0 0 120 150"
      role="img"
      aria-label={speaking ? 'Kimu irakaslea hitz egiten' : 'Kimu irakaslea'}
    >
      <defs>
        <radialGradient id={body} cx="38%" cy="30%" r="80%">
          <stop offset="0" stopColor="#ffe9df" />
          <stop offset="0.45" stopColor="#ffab98" />
          <stop offset="1" stopColor="#d9594f" />
        </radialGradient>
        <linearGradient id={rim} x1="1" y1="0" x2="0" y2="0">
          <stop offset="0" stopColor="#ffd7a8" stopOpacity="0.85" />
          <stop offset="0.35" stopColor="#ffd7a8" stopOpacity="0" />
        </linearGradient>
        <linearGradient id={leaf} x1="0" y1="1" x2="1" y2="0">
          <stop offset="0" stopColor="#3fb36b" />
          <stop offset="1" stopColor="#a6eaa0" />
        </linearGradient>
      </defs>

      {/* a soft shadow on the floor, so it stands in the scene instead of floating over it */}
      <ellipse cx="60" cy="144" rx="30" ry="4.5" fill="#000" opacity="0.45" className={styles.shadow} />

      <g transform={facing === 'left' ? 'translate(120 0) scale(-1 1)' : undefined}>
        {/* emphasis: a warm glow on Kimu itself, never on the specimen */}
        <ellipse className={styles.aura} cx="60" cy="74" rx="42" ry="46" fill="#ffb86b" />

        {/* legs: they step while it walks */}
        <g className={styles.legL} style={{ transformOrigin: '50px 112px' }}>
          <path d="M46 108v24" stroke="#d9594f" strokeWidth="9" strokeLinecap="round" />
          <ellipse cx="47" cy="138" rx="8" ry="4.2" fill="#8a3a2e" />
        </g>
        <g className={styles.legR} style={{ transformOrigin: '70px 112px' }}>
          <path d="M72 108v24" stroke="#d9594f" strokeWidth="9" strokeLinecap="round" />
          <ellipse cx="75" cy="138" rx="8" ry="4.2" fill="#8a3a2e" />
        </g>

        <g className={styles.body}>
          {/* the embryo's curl, behind */}
          <path d="M34 104c-9 6-20 3-21-6-1-5 3-9 6-7 3 1 3 4 1 5-2 1-1 3 1 3 5 2 9 0 13-4Z" fill="#ec7f73" stroke="#b9473f" strokeOpacity="0.45" strokeWidth="1.2" />
          {/* free arm, behind the body: it gestures with the pose */}
          <g className={styles.armFree} style={{ transform: `rotate(${FREE[pose]}deg)`, transformOrigin: '30px 80px' }}>
            <path d="M30 80h15" stroke="#e7766a" strokeWidth="7" strokeLinecap="round" />
            <circle cx="47" cy="80" r="5" fill="#ee8576" stroke="#b9473f" strokeOpacity="0.4" />
          </g>
          {/* sprout */}
          <g className={styles.sprout}>
            <path d="M60 28c0-6 1-10 3.5-13.5" fill="none" stroke="#2f9a5c" strokeWidth="3" strokeLinecap="round" />
            <path d="M63 16c2-6 9.5-9.4 17-7.4-1.2 7-8.4 11-17 7.4Z" fill={`url(#${leaf})`} />
            <path d="M61.2 19.4c-2-5.4-8.2-8.2-14.8-6.6 1.6 5.8 7.4 9 14.8 6.6Z" fill={`url(#${leaf})`} opacity="0.92" />
          </g>
          {/* head and body: one soft bean */}
          <path d="M60 26C40 26 25 42 25 64c0 27 15 50 35 50s35-23 35-50C95 42 80 26 60 26Z" fill={`url(#${body})`} stroke="#b9473f" strokeOpacity="0.5" strokeWidth="1.3" />
          <path d="M60 26C40 26 25 42 25 64c0 27 15 50 35 50s35-23 35-50C95 42 80 26 60 26Z" fill={`url(#${rim})`} />
          <path d="M36 42c4-7.6 10.6-12.2 19-13" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" opacity="0.45" />

          {/* cheeks */}
          <ellipse cx="41" cy="70" rx="5.4" ry="3.2" fill="#ff5b6b" opacity="0.36" />
          <ellipse cx="79" cy="70" rx="5.4" ry="3.2" fill="#ff5b6b" opacity="0.36" />

          {/* eyes: they blink and look where the class is */}
          {pose === 'praise' ? (
            <g fill="none" stroke="#3b1c12" strokeWidth="2.6" strokeLinecap="round">
              <path d="M44 59q5-5.6 10 0" />
              <path d="M66 59q5-5.6 10 0" />
            </g>
          ) : (
            <g className={styles.eyes}>
              <g style={{ transform: `translate(${eye.x}px, ${eye.y + (pose === 'think' ? -1.6 : 0)}px)` }}>
                <ellipse cx="49" cy="58" rx="4.6" ry={pose === 'emphasis' ? 6.2 : 5.6} fill="#2a130c" />
                <circle cx="50.6" cy="55.8" r="1.8" fill="#fff" />
                <ellipse cx="71" cy="58" rx="4.6" ry={pose === 'emphasis' ? 6.2 : 5.6} fill="#2a130c" />
                <circle cx="72.6" cy="55.8" r="1.8" fill="#fff" />
              </g>
            </g>
          )}
          {/* round thin glasses */}
          <g fill="none" stroke="#3a2a2a" strokeWidth="1.3" opacity="0.85">
            <circle cx="49" cy="58" r="9" />
            <circle cx="71" cy="58" r="9" />
            <path d="M58 57q2-1.6 4 0" />
            <path d="M40 56l-6-2.6M80 56l6-2.6" />
          </g>

          {/* brows: raised for emphasis and caution, soft for "almost" */}
          <g fill="none" stroke="#5a2a1a" strokeWidth="1.6" strokeLinecap="round" className={styles.brows}>
            <path d={pose === 'gentle' ? 'M43 46q5 2 9 .4' : 'M43 46q5-3 9-.6'} />
            <path d={pose === 'gentle' ? 'M68 46.4q4 1.6 9-.4' : 'M68 45.4q4-2.4 9 .6'} />
          </g>

          {/* mouth: follows the words */}
          <g fill="#7a2b1c" stroke="#7a2b1c" strokeLinecap="round" strokeLinejoin="round">
            {mouth === 'a' && <ellipse cx="60.5" cy="77.6" rx="3.6" ry="3.4" stroke="none" />}
            {mouth === 'e' && <ellipse cx="60.5" cy="77" rx="4.4" ry="2" stroke="none" />}
            {mouth === 'o' && <ellipse cx="60.5" cy="77.4" rx="2.4" ry="2.8" stroke="none" />}
            {mouth === 'm' && (pose === 'praise' || pose === 'emphasis' ? <path d="M55.5 75.4q5 6 10 0Z" strokeWidth="1.4" /> : pose === 'think' ? <path d="M57 77.6q3.6 1.4 7.4-.6" fill="none" strokeWidth="1.8" /> : <path d="M56.6 76q3.9 3.8 7.8 0" fill="none" strokeWidth="1.8" />)}
          </g>
        </g>

        {/* the pointer arm, in front: the stick slides out to just short of what is named */}
        <g className={styles.armStick} style={{ transform: `rotate(${stickAngle}deg)`, transformOrigin: '92px 80px' }}>
          <line className={styles.stick} x1={92 + ARM} y1="80" x2={92 + ARM + STICK} y2="80" stroke="#8a5a34" strokeWidth="2.4" strokeLinecap="round" style={{ transform: `scaleX(${stickLen / STICK})`, transformOrigin: `${92 + ARM}px 80px` }} />
          <circle className={styles.stick} cx={92 + ARM} cy="80" r="2.2" fill="#f3e2c4" style={{ transform: `translateX(${stickLen}px)` }} />
          <path d={`M92 80h${ARM}`} stroke="#e7766a" strokeWidth="7" strokeLinecap="round" />
          <circle cx={92 + ARM + 1} cy="80" r="5" fill="#ee8576" stroke="#b9473f" strokeOpacity="0.4" />
        </g>
      </g>

      {/* reduced motion: a still pose and a small "speaking" dot */}
      {reduced && speaking && <circle cx="104" cy="22" r="4" fill="#ffb86b" />}
    </svg>
  );
}
