import type { PlaneKind } from '@/lib/sim/types';

type P = { size?: number; className?: string };

const base = (size = 18) => ({
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
});

export const IconPlay = ({ size }: P) => (
  <svg {...base(size)}>
    <path d="M7 4.5v15l12-7.5z" fill="currentColor" stroke="none" />
  </svg>
);
export const IconPause = ({ size }: P) => (
  <svg {...base(size)}>
    <rect x="6" y="4.5" width="4" height="15" rx="1.2" fill="currentColor" stroke="none" />
    <rect x="14" y="4.5" width="4" height="15" rx="1.2" fill="currentColor" stroke="none" />
  </svg>
);
export const IconRestart = ({ size }: P) => (
  <svg {...base(size)}>
    <path d="M4 12a8 8 0 1 0 2.4-5.7" />
    <path d="M4 4v4.5h4.5" />
  </svg>
);
export const IconPrev = ({ size }: P) => (
  <svg {...base(size)}>
    <path d="M15 5l-7 7 7 7" />
  </svg>
);
export const IconNext = ({ size }: P) => (
  <svg {...base(size)}>
    <path d="M9 5l7 7-7 7" />
  </svg>
);
/** Fold marker of a collapsible section (points down when open). */
export const IconChevron = ({ size, className }: P) => (
  <svg {...base(size)} className={className}>
    <path d="M6 9l6 6 6-6" />
  </svg>
);
export const IconSkipNext = ({ size }: P) => (
  <svg {...base(size)}>
    <path d="M6 5l8 7-8 7z" fill="currentColor" stroke="none" />
    <path d="M18 5v14" />
  </svg>
);
export const IconSkipPrev = ({ size }: P) => (
  <svg {...base(size)}>
    <path d="M18 5l-8 7 8 7z" fill="currentColor" stroke="none" />
    <path d="M6 5v14" />
  </svg>
);
export const IconTag = ({ size }: P) => (
  <svg {...base(size)}>
    <path d="M3 12V4h8l10 10-8 8z" />
    <circle cx="7.5" cy="8.5" r="1.4" />
  </svg>
);
export const IconZoomIn = ({ size }: P) => (
  <svg {...base(size)}>
    <circle cx="11" cy="11" r="6.5" />
    <path d="M20 20l-4.2-4.2M11 8v6M8 11h6" />
  </svg>
);
export const IconZoomOut = ({ size }: P) => (
  <svg {...base(size)}>
    <circle cx="11" cy="11" r="6.5" />
    <path d="M20 20l-4.2-4.2M8 11h6" />
  </svg>
);
export const IconFit = ({ size }: P) => (
  <svg {...base(size)}>
    <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />
  </svg>
);
export const IconTarget = ({ size }: P) => (
  <svg {...base(size)}>
    <circle cx="12" cy="12" r="8" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="12" cy="12" r="0.8" fill="currentColor" />
  </svg>
);
export const IconBook = ({ size }: P) => (
  <svg {...base(size)}>
    <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5z" />
    <path d="M4 20.5A2.5 2.5 0 0 1 6.5 18H20v3H6.5" />
  </svg>
);
/** The original course notes: a page of text with a highlighted line. */
export const IconNotes = ({ size }: P) => (
  <svg {...base(size)}>
    <path d="M6.5 3h8l4 4v12.5a1.5 1.5 0 0 1-1.5 1.5h-10A1.5 1.5 0 0 1 5.5 19.5v-15A1.5 1.5 0 0 1 6.5 3z" />
    <path d="M14.5 3v4h4M8.5 11h7M8.5 17h5" />
    <path d="M8 14h8" strokeWidth={3} strokeOpacity={0.45} />
  </svg>
);
export const IconSun = ({ size }: P) => (
  <svg {...base(size)}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4" />
  </svg>
);
export const IconMoon = ({ size }: P) => (
  <svg {...base(size)}>
    <path d="M19.5 14.5A8 8 0 0 1 9.5 4.5a8 8 0 1 0 10 10z" />
  </svg>
);
export const IconList = ({ size }: P) => (
  <svg {...base(size)}>
    <path d="M9 6h11M9 12h11M9 18h11M4.5 6h.01M4.5 12h.01M4.5 18h.01" />
  </svg>
);
export const IconQuiz = ({ size }: P) => (
  <svg {...base(size)}>
    <rect x="3.5" y="3.5" width="17" height="17" rx="4" />
    <path d="M9.5 9.5a2.5 2.5 0 1 1 3.4 2.3c-.6.3-.9.8-.9 1.4v.6M12 16.8v.2" />
  </svg>
);
export const IconClose = ({ size }: P) => (
  <svg {...base(size)}>
    <path d="M6 6l12 12M18 6L6 18" />
  </svg>
);
export const IconSearch = ({ size }: P) => (
  <svg {...base(size)}>
    <circle cx="11" cy="11" r="6.5" />
    <path d="M20 20l-4.2-4.2" />
  </svg>
);
export const IconLayers = ({ size }: P) => (
  <svg {...base(size)}>
    <path d="M12 3l9 5-9 5-9-5z" />
    <path d="M3 13l9 5 9-5" />
  </svg>
);
export const IconWarn = ({ size }: P) => (
  <svg {...base(size)}>
    <path d="M12 3l10 18H2z" />
    <path d="M12 10v5M12 18v.2" />
  </svg>
);
export const IconCheck = ({ size }: P) => (
  <svg {...base(size)}>
    <path d="M5 12.5l4.5 4.5L19 7" />
  </svg>
);
export const IconTree = ({ size }: P) => (
  <svg {...base(size)}>
    <circle cx="12" cy="5" r="2" />
    <circle cx="5" cy="19" r="2" />
    <circle cx="12" cy="19" r="2" />
    <circle cx="19" cy="19" r="2" />
    <path d="M12 7v10M12 11H5v6M12 11h7v6" />
  </svg>
);
export const IconLoop = ({ size }: P) => (
  <svg {...base(size)}>
    <path d="M4 12a8 8 0 0 1 13.7-5.6L20 9" />
    <path d="M20 4v5h-5" />
    <path d="M20 12a8 8 0 0 1-13.7 5.6L4 15" />
    <path d="M4 20v-5h5" />
  </svg>
);
/** Guided (slow, explained) playback: an open book with a pointer. */
export const IconGuide = ({ size }: P) => (
  <svg {...base(size)}>
    <path d="M12 6.5C10.2 5.2 7.6 4.6 4 4.8v12.6c3.6-.2 6.2.4 8 1.7 1.8-1.3 4.4-1.9 8-1.7V4.8c-3.6-.2-6.2.4-8 1.7z" />
    <path d="M12 6.5v12.6" />
  </svg>
);
export const IconBolt = ({ size }: P) => (
  <svg {...base(size)}>
    <path d="M13 3 5 13.5h6L10 21l8-10.5h-6z" />
  </svg>
);
export const IconVoice = ({ size }: P) => (
  <svg {...base(size)}>
    <path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" />
    <path d="M15.5 9a4 4 0 0 1 0 6" />
    <path d="M18 6.5a7.5 7.5 0 0 1 0 11" />
  </svg>
);
/** Narration off: the speaker with a cross instead of sound waves. */
export const IconVoiceOff = ({ size }: P) => (
  <svg {...base(size)}>
    <path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" />
    <path d="M16 9.5l5 5M21 9.5l-5 5" />
  </svg>
);
/** Subtitles: a screen with two caption lines. */
export const IconCaptions = ({ size }: P) => (
  <svg {...base(size)}>
    <rect x="3" y="5" width="18" height="14" rx="2.5" />
    <path d="M7 12.5h4M13.5 12.5H17M7 15.5h7" />
  </svg>
);
export const IconHome = ({ size }: P) => (
  <svg {...base(size)}>
    <path d="M4 11l8-7 8 7v9h-5v-6H9v6H4z" />
  </svg>
);
export const IconInfo = ({ size }: P) => (
  <svg {...base(size)}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 11v6M12 7.5v.2" />
  </svg>
);

/** Focus mode: corners opening out. */
export const IconExpand = ({ size }: P) => (
  <svg {...base(size)}>
    <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />
  </svg>
);
/** Chronology: a clock face. */
export const IconClock = ({ size }: P) => (
  <svg {...base(size)}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3.5 2" />
  </svg>
);
/** Exam date: a calendar page. */
export const IconCalendar = ({ size }: P) => (
  <svg {...base(size)}>
    <rect x="3.5" y="5" width="17" height="15.5" rx="2.5" />
    <path d="M3.5 10h17M8 3v4M16 3v4" />
  </svg>
);
export const IconImage = ({ size }: P) => (
  <svg {...base(size)}>
    <rect x="3.5" y="4.5" width="17" height="15" rx="2.5" />
    <circle cx="9" cy="10" r="1.8" />
    <path d="M20.5 16l-5-5-8 8.5" />
  </svg>
);

/** Small glyph describing how the specimen is cut/viewed. */
export function PlaneGlyph({ plane, size = 22 }: { plane: PlaneKind; size?: number }) {
  const s = { width: size, height: size, viewBox: '0 0 32 32', fill: 'none', strokeWidth: 1.6, strokeLinecap: 'round' as const };
  const disc = <ellipse cx="16" cy="18" rx="11" ry="6" stroke="currentColor" opacity={0.55} />;
  switch (plane) {
    case 'sagitala':
      return (
        <svg {...s}>
          {disc}
          <path d="M16 5v26" stroke="#fbbf24" strokeWidth={2.2} />
          <path d="M12 7l4-3 4 3" stroke="#fbbf24" />
        </svg>
      );
    case 'zeharkakoa':
      return (
        <svg {...s}>
          {disc}
          <path d="M3 18h26" stroke="#fbbf24" strokeWidth={2.2} />
          <path d="M6 14l-3 4 3 4" stroke="#fbbf24" />
        </svg>
      );
    case 'koronala':
      return (
        <svg {...s}>
          {disc}
          <path d="M5 26L27 10" stroke="#fbbf24" strokeWidth={2.2} />
        </svg>
      );
    case 'dortsala':
      return (
        <svg {...s}>
          {disc}
          <path d="M10 6c2-2 10-2 12 0M16 4v8" stroke="#fbbf24" strokeWidth={2} />
          <circle cx="16" cy="18" r="2" fill="#fbbf24" stroke="none" />
        </svg>
      );
    case 'kanpokoa':
      return (
        <svg {...s}>
          <path d="M9 24c-3-6 0-15 7-16 6 0 9 6 7 11-1 4-6 6-9 5" stroke="currentColor" opacity={0.7} />
          <circle cx="24" cy="8" r="3" stroke="#fbbf24" strokeWidth={2} />
        </svg>
      );
    case 'xehetasuna':
      return (
        <svg {...s}>
          <circle cx="14" cy="14" r="7.5" stroke="#fbbf24" strokeWidth={2} />
          <path d="M20 20l7 7" stroke="#fbbf24" strokeWidth={2.4} />
          <circle cx="12" cy="13" r="2" fill="currentColor" opacity={0.7} stroke="none" />
          <circle cx="16.5" cy="15" r="1.6" fill="currentColor" opacity={0.7} stroke="none" />
        </svg>
      );
    default:
      return (
        <svg {...s}>
          <rect x="4" y="6" width="9" height="7" rx="2" stroke="currentColor" opacity={0.7} />
          <rect x="19" y="19" width="9" height="7" rx="2" stroke="currentColor" opacity={0.7} />
          <path d="M13 9.5h4a2 2 0 0 1 2 2v7.5" stroke="#fbbf24" strokeWidth={2} />
        </svg>
      );
  }
}

export const planeName: Record<PlaneKind, string> = {
  sagitala: 'Mozketa sagitala',
  zeharkakoa: 'Zeharkako mozketa',
  koronala: 'Mozketa koronala',
  dortsala: 'Goitik (dortsala)',
  kanpokoa: 'Kanpotik',
  xehetasuna: 'Xehetasuna',
  eskema: 'Eskema',
};

/** EnbrioAtlas mark: a C-shaped (folded) embryo inside the zona, drawn in a single line weight. */
export const BrandMark = ({ size = 28 }: P) => (
  <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true" className="brand-mark-svg">
    <circle cx="16" cy="16" r="14" fill="none" stroke="currentColor" strokeOpacity="0.35" strokeWidth="1.2" />
    <path d="M21.2 10.4a7.4 7.4 0 1 0 0.9 10.6" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />
    <circle cx="22.3" cy="21.3" r="2" fill="var(--signal, #ff6a3d)" />
  </svg>
);

export const IconMore = ({ size }: P) => (
  <svg {...base(size)}>
    <circle cx="5.5" cy="12" r="1.3" fill="currentColor" stroke="none" />
    <circle cx="12" cy="12" r="1.3" fill="currentColor" stroke="none" />
    <circle cx="18.5" cy="12" r="1.3" fill="currentColor" stroke="none" />
  </svg>
);
export const IconSliders = ({ size }: P) => (
  <svg {...base(size)}>
    <path d="M4 7h9M17 7h3M4 17h3M11 17h9" />
    <circle cx="15" cy="7" r="2" />
    <circle cx="9" cy="17" r="2" />
  </svg>
);
