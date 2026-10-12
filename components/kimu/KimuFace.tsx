'use client';

import type { Mood } from '@/lib/kimu/types';

/**
 * Kimu's mark: a sprout ("kimu" is Basque for sprout), drawn in the app's own line style and signal
 * colour so it sits with the other tools instead of on top of them. It scales from the 16px launcher
 * to the panel header; while Kimu reads the notes ("thinking") the leaves breathe, and nothing moves
 * with reduced motion. The name and props stay as they were, so every place that shows Kimu keeps working.
 */
export function KimuFace({ mood = 'happy', size = 24, still = false }: { mood?: Mood; talking?: boolean; size?: number; still?: boolean }) {
  return (
    <svg className={`kimu-mark${mood === 'thinking' && !still ? ' is-thinking' : ''}`} width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path className="km-stem" d="M12 20.5V11.2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path className="km-leaf km-leaf-l" d="M11.6 12.6C7.5 12.9 4.9 10.6 4.6 6.6c4-.3 6.7 1.9 7 6Z" fill="currentColor" fillOpacity=".16" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path className="km-leaf km-leaf-r" d="M12.4 10.4c.2-3.6 2.6-5.8 6.6-5.9.1 3.9-2.3 6.1-6.6 5.9Z" fill="currentColor" fillOpacity=".3" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M8.6 20.5h6.8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity=".45" />
    </svg>
  );
}
