'use client';

import { useContext, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { TextLayerContext } from './context';

/** Draw text (a name plate, a note, a call-out chip) in the viewport's top layer, above every line. */
export function OnTop({ children }: { children: ReactNode }) {
  const host = useContext(TextLayerContext);
  return host ? createPortal(children, host) : <>{children}</>;
}
