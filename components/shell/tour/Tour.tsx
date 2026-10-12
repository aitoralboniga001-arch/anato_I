'use client';

import { useEffect, useId, useLayoutEffect, useReducer, useRef, useState } from 'react';
import { IconClose, IconNext } from '../icons';
import { boxOf, litOf, placeCard, type Box, type ElementLike, type Lit, type Placement } from './geometry';
import { copyOf, resolveStop, type Stop, type Variant } from './steps';
import { advance, start, type Nav } from './nav';
import './tour.css';

const pad2 = (n: number) => String(n).padStart(2, '0');
const PAD = 3;
/** How long a stop may wait for its element to appear (a panel sliding in) before it is skipped. */
const WAIT_MS = 900;

const q = (id: string) => document.querySelector<HTMLElement>(`[data-tour="${id}"]`);
const pressed = (el: Element) => el.getAttribute('aria-pressed') === 'true' || el.getAttribute('aria-expanded') === 'true';
const visible = (el: ElementLike) => {
  const e = el as unknown as Element & { checkVisibility?: (o?: object) => boolean };
  if (typeof e.checkVisibility === 'function') return e.checkVisibility({ checkVisibilityCSS: true });
  return true;
};
const radiusOf = (el: ElementLike) => {
  const e = el as unknown as Element;
  if (!(e instanceof HTMLElement)) {
    // SVG label plates are rounded by their rx; read it from the plate when there is one.
    const plate = e.querySelector?.('rect');
    const rx = plate ? parseFloat(plate.getAttribute('rx') ?? '') : NaN;
    const k = plate ? (plate as SVGGraphicsElement).getScreenCTM?.()?.a ?? 1 : 1;
    return Number.isFinite(rx) ? rx * k : 6;
  }
  const r = parseFloat(getComputedStyle(e).borderTopLeftRadius);
  if (!Number.isFinite(r)) return 0;
  // A pill's 999px radius is half its height on screen.
  return Math.min(r, e.getBoundingClientRect().height / 2);
};

type Shown = { key: string; variant: Variant; lits: Lit[]; card: Placement | null; vw: number; vh: number };

const same = (a: Lit[], b: Lit[]) => a.length === b.length && a.every((l, i) => Math.abs(l.x - b[i].x) < 0.5 && Math.abs(l.y - b[i].y) < 0.5 && Math.abs(l.w - b[i].w) < 0.5 && Math.abs(l.h - b[i].h) < 0.5 && Math.abs(l.r - b[i].r) < 0.5);

/**
 * The guide over the live page: everything dims except the elements of the current stop, which keep
 * their own shape and light up; the card sits beside them, never on them. Elements are found by their
 * data-tour id and measured every frame, so the guide follows any layout. A stop whose element is not
 * on screen (a panel closed, a narrow layout) opens it with the page's own button or is skipped.
 */
export function Tour({ stops, scrolls = false, avoid = [], onClose }: { stops: Stop[]; scrolls?: boolean; avoid?: string[]; onClose: (finished: boolean) => void }) {
  const ids = useId();
  // The stops this screen can show right now (toggles count: the stop opens what it needs).
  const [plan] = useState(() =>
    stops.filter((s) => {
      if (s.open && q(s.open)) return true;
      return !!resolveStop(s, document, window.innerWidth, window.innerHeight, scrolls, visible);
    }),
  );
  const [nav, go] = useReducer((n: Nav, a: Parameters<typeof advance>[1]) => advance(n, a, plan.length), start(plan.length));
  const [shown, setShown] = useState<Shown | null>(null);
  // The card glides from stop to stop, but appears in place the first time.
  const [glide, setGlide] = useState(false);
  const [reduced] = useState(() => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false);
  const cardRef = useRef<HTMLDivElement>(null);
  const primaryRef = useRef<HTMLButtonElement>(null);
  const opened = useRef<string | null>(null);
  const focused = useRef('');
  const avoidKey = avoid.join(' ');
  const closing = useRef(onClose);
  useLayoutEffect(() => {
    closing.current = onClose;
  });

  const stop = nav.done ? undefined : plan[nav.idx];
  const stopKey = stop ? `${stop.id}#${nav.idx}` : '';

  // Finished, skipped or nothing to show: hand back.
  useEffect(() => {
    if (nav.done) closing.current(nav.finished);
  }, [nav.done, nav.finished]);

  // Each stop: open what it needs, then follow its elements frame by frame until the next one.
  useEffect(() => {
    if (!stop) return;
    if (stop.open) {
      const t = q(stop.open);
      if (t && !pressed(t)) {
        t.click();
        opened.current = stop.open;
      }
    }
    const t0 = performance.now();
    let scrolled = false;
    let raf = 0;
    let last: Shown | null = null;
    const tick = () => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const got = resolveStop(stop, document, vw, vh, scrolls, visible);
      if (!got) {
        if (performance.now() - t0 > WAIT_MS) {
          go('missing');
          return;
        }
        raf = requestAnimationFrame(tick);
        return;
      }
      const boxes = got.els.map(boxOf);
      if (scrolls && !scrolled) {
        scrolled = true;
        const u = boxes[0];
        if (u.y < 72 || u.y + Math.min(u.h, vh * 0.6) > vh - 24) (got.els[0] as unknown as Element).scrollIntoView({ block: u.h > vh * 0.6 ? 'start' : 'center', behavior: reduced ? 'auto' : 'smooth' });
      }
      const lits = got.els.map((el, i) => litOf(boxes[i], radiusOf(el), PAD));
      const c = cardRef.current;
      const size = c ? { w: c.offsetWidth, h: c.offsetHeight } : null;
      const avoidBoxes: Box[] = (avoidKey ? avoidKey.split(' ') : []).map((id) => q(id)).filter((e): e is HTMLElement => !!e).map(boxOf);
      const card = size && size.w ? placeCard(lits, size, vw, vh, avoidBoxes) : null;
      if (!last || last.variant !== got.variant || !same(last.lits, lits) || last.card?.x !== card?.x || last.card?.y !== card?.y || last.vw !== vw || last.vh !== vh) {
        last = { key: stopKey, variant: got.variant, lits, card, vw, vh };
        setShown(last);
        if (card) requestAnimationFrame(() => setGlide(true));
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      // Leave the page as the stop found it.
      if (opened.current) {
        const t = q(opened.current);
        if (t && pressed(t)) t.click();
        opened.current = null;
      }
    };
  }, [stop, stopKey, scrolls, reduced, avoidKey]);

  // The primary key takes the focus at every stop, so Enter always means "on".
  const placed = shown?.key === stopKey && !!shown.card;
  useEffect(() => {
    if (!placed || focused.current === stopKey) return;
    focused.current = stopKey;
    primaryRef.current?.focus({ preventScroll: true });
  }, [placed, stopKey]);

  // Keys belong to the guide while it is up (Space, arrows and letters never reach the page below).
  useEffect(() => {
    const back = document.activeElement as HTMLElement | null;
    const onKey = (e: KeyboardEvent) => {
      e.stopImmediatePropagation();
      const inCard = !!cardRef.current && cardRef.current.contains(e.target as Node);
      const onButton = inCard && (e.target as HTMLElement).tagName === 'BUTTON';
      if (e.key === 'Escape') {
        e.preventDefault();
        go('close');
      } else if (e.key === 'ArrowRight' || e.key === 'PageDown') {
        e.preventDefault();
        go('next');
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault();
        go('prev');
      } else if (e.key === 'Enter' || e.key === ' ') {
        // A focused key of the card does its own thing; anywhere else, Enter goes on.
        if (onButton) return;
        e.preventDefault();
        if (e.key === 'Enter') go('next');
      } else if (e.key === 'Tab') {
        // Focus stays in the card.
        const keys = cardRef.current ? [...cardRef.current.querySelectorAll<HTMLElement>('button:not(:disabled)')] : [];
        if (!keys.length) return e.preventDefault();
        const i = keys.indexOf(document.activeElement as HTMLElement);
        e.preventDefault();
        keys[(i + (e.shiftKey ? -1 : 1) + keys.length) % keys.length].focus();
      } else if (!e.metaKey && !e.ctrlKey) {
        e.preventDefault();
      }
    };
    window.addEventListener('keydown', onKey, true);
    return () => {
      window.removeEventListener('keydown', onKey, true);
      const to = back && back.isConnected && back !== document.body ? back : q('laguntza');
      to?.focus?.({ preventScroll: true });
    };
  }, []);

  if (!stop) return null;
  const ready = shown?.key === stopKey;
  const copy = copyOf(stop, ready ? shown.variant : undefined);
  const lits = ready ? shown.lits : [];
  const n = plan.length;
  const last = nav.idx === n - 1;
  const titleId = `${ids}-t`;
  const textId = `${ids}-x`;
  const W = shown?.vw ?? 0;
  const H = shown?.vh ?? 0;

  return (
    <div className={`gida${reduced ? ' is-still' : ''}`} data-gida-stop={stop.id}>
      <svg className="gida-dim" width={W} height={H} viewBox={`0 0 ${W} ${H}`} aria-hidden onPointerDown={(e) => e.preventDefault()}>
        <defs>
          <mask id={`${ids}-m`} maskUnits="userSpaceOnUse" x="0" y="0" width={W} height={H}>
            <rect x="0" y="0" width={W} height={H} fill="#fff" />
            {lits.map((l, i) => (
              <rect key={i} className="gida-hole" style={{ x: l.x, y: l.y, width: l.w, height: l.h, rx: l.r, ry: l.r }} fill="#000" />
            ))}
          </mask>
        </defs>
        <rect className="gida-shade" x="0" y="0" width={W} height={H} mask={`url(#${ids}-m)`} />
      </svg>
      {lits.map((l, i) => (
        <span key={i} className="gida-lit" aria-hidden style={{ transform: `translate(${l.x}px, ${l.y}px)`, width: l.w, height: l.h, borderRadius: l.r }} />
      ))}
      <div
        ref={cardRef}
        className={`gida-card${ready && shown.card ? ' is-placed' : ''}${glide ? ' is-gliding' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={textId}
        style={ready && shown.card ? { transform: `translate(${shown.card.x}px, ${shown.card.y}px)` } : undefined}
      >
        <div className="gida-top">
          <span className="gida-kicker">
            Gida laburra <b>{pad2(nav.idx + 1)}</b>/{pad2(n)}
          </span>
          <button className="icon-btn gida-x" onClick={() => go('close')} aria-label="Itxi gida" title="Itxi (Esc)">
            <IconClose size={15} />
          </button>
        </div>
        <h3 id={titleId} key={`h-${stopKey}`}>
          {copy.title}
        </h3>
        <p id={textId} key={`p-${stopKey}`}>
          {copy.text}
        </p>
        {stop.keys && (
          <dl className="gida-keys">
            {stop.keys.map(([k, v]) => (
              <div key={k}>
                <dt>
                  <kbd>{k}</kbd>
                </dt>
                <dd>{v}</dd>
              </div>
            ))}
          </dl>
        )}
        <div className="gida-foot">
          <span className="gida-dots" aria-hidden>
            {plan.map((s, k) => (
              <i key={s.id} className={k < nav.idx ? 'is-past' : k === nav.idx ? 'is-on' : ''} />
            ))}
          </span>
          {nav.idx === 0 ? (
            <span className="gida-hint" aria-hidden>
              <kbd>←</kbd> <kbd>→</kbd> <kbd>Esc</kbd>
            </span>
          ) : (
            <button className="btn small ghost" onClick={() => go('prev')}>
              Atzera
            </button>
          )}
          <button ref={primaryRef} className="btn small btn-light gida-next" onClick={() => go('next')}>
            {last ? 'Amaitu' : 'Hurrengoa'} {!last && <IconNext size={13} />}
          </button>
        </div>
      </div>
      <p className="gida-sr" aria-live="polite">
        {ready ? `${nav.idx + 1}/${n}. ${copy.title}. ${copy.text}` : ''}
      </p>
    </div>
  );
}
