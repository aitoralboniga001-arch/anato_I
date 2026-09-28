'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';

/**
 * A button that opens a small floating panel (a menu, a settings sheet). It closes on an outside
 * click, on Escape, and when the panel's own content asks to (`close`). The trigger and the panel
 * are the only things the screen carries until the student asks for more.
 */
export function Popover({
  trigger,
  children,
  className = '',
  align = 'end',
  up = false,
}: {
  trigger: (state: { open: boolean; toggle: () => void }) => ReactNode;
  children: (close: () => void) => ReactNode;
  className?: string;
  align?: 'start' | 'end';
  /** Open upwards (for controls at the bottom of the screen). */
  up?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const away = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    const esc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', away);
    document.addEventListener('keydown', esc);
    return () => {
      document.removeEventListener('pointerdown', away);
      document.removeEventListener('keydown', esc);
    };
  }, [open]);

  return (
    <div className={`pop ${className}`} ref={root}>
      {trigger({ open, toggle: () => setOpen((v) => !v) })}
      {open && (
        <div className={`pop-panel is-${align}${up ? ' is-up' : ''}`} role="dialog">
          {children(() => setOpen(false))}
        </div>
      )}
    </div>
  );
}
