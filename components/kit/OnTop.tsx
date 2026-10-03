'use client';

import { useContext, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { PaneContext, TextLayerContext } from './context';

/** Draw text (a name plate, a note, a call-out chip) in the viewport's top layer, above every line. */
export function OnTop({ children }: { children: ReactNode }) {
  const host = useContext(TextLayerContext);
  // Inside a dual view's pane the pane's own text (chips, legends) would shrink with it: the dual sets the text.
  if (useContext(PaneContext)) return null;
  return host ? createPortal(children, host) : <>{children}</>;
}
