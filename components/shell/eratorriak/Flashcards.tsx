'use client';

import { CARD_TAGS, type Card } from '@/content/eratorriak/cards12';
import { ArchLadder } from './ArchLadder';
import { Flashcards as Deck } from './kit/Flashcards';

/** Topic 12 adapter: preserve its storage key, tag order and back figure. */
export function Flashcards({ cards }: { cards: Card[] }) {
  return (
    <Deck
      cards={cards}
      storeKey="enbrioatlas:fitxak-12"
      tags={CARD_TAGS}
      renderFigure={(card) => <ArchLadder stage={card.stage ?? 5} mode="origin" lit={new Set(card.keys)} mini glow={false} />}
    />
  );
}
