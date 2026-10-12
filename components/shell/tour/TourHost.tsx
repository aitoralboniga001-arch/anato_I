'use client';

import { useEffect, useRef, useState } from 'react';
import { IconClose, IconHelp } from '../icons';
import { boxOf, overlap, type Box } from './geometry';
import { STOPS } from './steps';
import { Tour } from './Tour';
import { endTour, hideOffer, showOffer, startTour, useTourState, type TourId } from './store';

/** What the guide must not cover for long: the specimen. */
const AVOID: Record<TourId, string[]> = { sim: ['eszena'], home: [] };
/** Time for the page to settle (the first frame, the opening on the home page) before the offer. */
const OFFER_AFTER = 1600;
/** Left alone, the offer steps aside (the "?" keeps the guide). */
const OFFER_FOR = 30000;

const playing = () => {
  const p = document.querySelector('[data-tour="play"]');
  return !!p && (p.classList.contains('is-playing') || p.getAttribute('aria-label') === 'Pausatu');
};

/**
 * The guide of one place, mounted once by that place: the quiet offer on the first visit, and the
 * tour itself when any button starts it (`startTour`). `ready` holds the offer back (the home page's
 * opening sequence).
 */
export function TourHost({ tour, ready = true }: { tour: TourId; ready?: boolean }) {
  const s = useTourState();

  useEffect(() => {
    if (!ready) return;
    const tryOffer = () => {
      // Never over an explanation already running.
      if (playing()) return;
      // Another first-time card is up: try again once it has gone (one card at a time).
      if (otherCard()) {
        retry = window.setTimeout(tryOffer, 1000);
        return;
      }
      showOffer(tour);
    };
    let retry = 0;
    const id = window.setTimeout(tryOffer, OFFER_AFTER);
    return () => {
      window.clearTimeout(id);
      window.clearTimeout(retry);
    };
  }, [ready, tour]);

  // The tour stops the explanation where it is: it talks about the screen, not over the voice.
  useEffect(() => {
    if (s.active !== tour) return;
    const p = document.querySelector<HTMLElement>('[data-tour="play"]');
    if (p && playing()) p.click();
  }, [s.active, s.run, tour]);

  return (
    <>
      {s.offer === tour && <Offer tour={tour} />}
      {s.active === tour && <Tour key={s.run} stops={STOPS[tour]} scrolls={tour === 'home'} avoid={AVOID[tour]} onClose={endTour} />}
    </>
  );
}

/** Cards that already hold the eye: the offer waits for them, and steps aside if one opens. */
const OTHER_CARDS = '.loc-card, .kimu-nudge, .kimu-peek, .kimu-panel, .fs-offer, .pv-card, .bridge, .now-card, .find-bar, .viewport .tour, .menu, [role="dialog"]';
const otherCard = () => [...document.querySelectorAll(OTHER_CARDS)].some((el) => !el.closest('.gida-offer') && el.getClientRects().length > 0);

/**
 * Where the offer sits: under the "?" that keeps the guide, over the right column, when that is clear
 * of the picture; else docked just above the bottom bar (over the step text, never the specimen).
 */
export function offerSpot(card: { w: number; h: number }, vw: number, vh: number, help: Box | null, bar: Box | null, scene: Box | null, avoid: (Box | null)[] = []): { x: number; y: number } {
  const m = 12;
  // Clear of the picture, and of the keys over it (the view switch) that the card would hide.
  const clear = (b: Box) => (!scene || overlap(b, scene) === 0) && avoid.every((a) => !a || overlap(b, a) === 0);
  const fits = (b: Box) => b.x >= m && b.y >= m && b.x + b.w <= vw - m && b.y + b.h <= vh - m;
  if (help) {
    const b = { x: Math.min(help.x + help.w, vw - m) - card.w, y: help.y + help.h + 10, w: card.w, h: card.h };
    if (fits(b) && clear(b)) return b;
  }
  if (bar) {
    const b = { x: bar.x + bar.w - card.w - 8, y: bar.y - card.h - 8, w: card.w, h: card.h };
    if (fits(b) && clear(b)) return b;
    // Right on the bar's top edge, clear of the picture above it.
    return { x: Math.max(m, bar.x + bar.w - card.w - 8), y: Math.max(scene ? scene.y + scene.h + 8 : m, bar.y - card.h - 8) };
  }
  return { x: m + 12, y: vh - card.h - m - 12 };
}

const boxOfId = (id: string) => {
  const el = document.querySelector(`[data-tour="${id}"]`);
  if (!el) return null;
  const b = boxOf(el);
  return b.w > 1 && b.h > 1 && el.getClientRects().length ? b : null;
};

/**
 * First visit: one small card, never a window and never over the specimen. One click starts or
 * dismisses it; so does Esc. It waits while another first-time card is up, and gives way to one.
 */
function Offer({ tour }: { tour: TourId }) {
  const ref = useRef<HTMLDivElement>(null);
  const [at, setAt] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      e.stopImmediatePropagation();
      hideOffer();
    };
    window.addEventListener('keydown', onKey, true);
    let raf = 0;
    const place = () => {
      const c = ref.current;
      if (c) {
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        // Both places keep the guide under their "?": the offer opens right under it.
        const p = offerSpot({ w: c.offsetWidth, h: c.offsetHeight }, vw, vh, boxOfId('laguntza'), boxOfId('erreprodukzioa-mugikorra') ?? boxOfId('erreprodukzioa'), boxOfId('eszena'), [boxOfId('ebakiak')]);
        setAt((o) => (o && Math.abs(o.x - p.x) < 0.5 && Math.abs(o.y - p.y) < 0.5 ? o : p));
      }
      raf = requestAnimationFrame(place);
    };
    raf = requestAnimationFrame(place);
    // Playback started or another card opened: the offer steps aside (the "?" keeps the guide).
    const watch = window.setInterval(() => (playing() || otherCard()) && hideOffer(), 400);
    const off = window.setTimeout(hideOffer, OFFER_FOR);
    return () => {
      window.removeEventListener('keydown', onKey, true);
      cancelAnimationFrame(raf);
      window.clearInterval(watch);
      window.clearTimeout(off);
    };
  }, [tour]);

  return (
    <div ref={ref} className={`gida-offer${at ? ' is-placed' : ''}`} style={at ? { transform: `translate(${at.x}px, ${at.y}px)` } : undefined} role="group" aria-label="Gida laburra">
      <span className="gida-offer-icon" aria-hidden>
        <IconHelp size={16} />
      </span>
      <span className="gida-offer-text">
        <b>{tour === 'sim' ? 'Nola ikasi hemen?' : 'Lehen aldia hemen?'}</b>
        <small>{tour === 'sim' ? 'Gida labur bat, minutu batean.' : 'Gida labur bat: nondik hasi.'}</small>
      </span>
      <button className="btn small btn-light" onClick={() => startTour(tour)}>
        Hasi gida
      </button>
      <button className="icon-btn gida-offer-x" onClick={hideOffer} aria-label="Orain ez" title="Orain ez (Esc)">
        <IconClose size={14} />
      </button>
    </div>
  );
}

/** The "?" of a place without the simulator's help sheet (the home page): it opens the guide itself. */
export function GuideButton({ tour }: { tour: TourId }) {
  return (
    <button type="button" className="icon-btn gida-help" data-tour="laguntza" aria-label="Gida laburra" onClick={() => startTour(tour)} data-tip="Gida laburra: nondik hasi eta zer dagoen" data-tip-pos="bottom-end">
      <IconHelp size={17} />
    </button>
  );
}
