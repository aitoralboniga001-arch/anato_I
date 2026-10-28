import type { Metadata } from 'next';
import { PlateCards } from '@/components/shell/PlateCards';

export const metadata: Metadata = { title: 'Irudi-fitxak: irudiak zenbakiekin — EnbrioAtlas' };

export default function PlateCardsPage() {
  return <PlateCards />;
}
