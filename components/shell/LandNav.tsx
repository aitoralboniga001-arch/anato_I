import Link from 'next/link';
import type { ReactNode } from 'react';
import { weeks } from '@/content/registry';
import { BrandMark } from './icons';

/** A week whose only scenes are placeholders is still being prepared. */
export const isWip = (w: (typeof weeks)[number]) => w.stages.every((s) => s.views.every((v) => v.description === 'Prestatzen'));
export const firstReady = weeks.find((w) => !isWip(w)) ?? weeks[0];

export function Wordmark({ size = 22 }: { size?: number }) {
  return (
    <span className="wordmark">
      <BrandMark size={size} />
      <span>
        Enbrio<b>Atlas</b>
      </span>
    </span>
  );
}

export function LandNav() {
  return (
    <header className="land-nav">
      <Link href="/" aria-label="EnbrioAtlas — hasiera">
        <Wordmark />
      </Link>
      <nav>
        <Link href="/kronologia">Kronologia</Link>
        <Link href="/#gaiak">Gaiak</Link>
        <Link href="/irudiak">Irudiak</Link>
        <Link href="/leinuak">Leinuak</Link>
        <Link href={`/astea/${firstReady.week}`} className="btn btn-light small">
          Ireki simulagailua
        </Link>
      </nav>
    </header>
  );
}

export function LandFoot({ children }: { children?: ReactNode }) {
  return (
    <footer className="land-foot">
      <Wordmark size={18} />
      <p>Iturria: Giza Anatomia I ikasgaiko apunteak (1.–6. gaiak) eta haietako irudiak (Langman). Simulagailu honek ez du ordezkatzen irakaslearen irizpidea.</p>
      {children}
    </footer>
  );
}
