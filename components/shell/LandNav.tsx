import Link from 'next/link';
import type { ReactNode } from 'react';
import { weeks } from '@/content/registry';
import { BrandMark } from './icons';
import atlasStyles from './structure-atlas.module.css';

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

type Section = 'kronologia' | 'irudiak' | 'leinuak' | 'egiturak';

/** The site bar; `current` marks the page you are on (aria-current), so the bar also says where you are. */
export function LandNav({ current }: { current?: Section }) {
  const here = (s: Section) => (s === current ? ('page' as const) : undefined);
  return (
    <header className={`land-nav ${atlasStyles.nav}`}>
      <Link href="/" aria-label="EnbrioAtlas — hasiera">
        <Wordmark />
      </Link>
      <nav>
        <Link href="/kronologia" aria-current={here('kronologia')}>Kronologia</Link>
        <Link href="/#gaiak">Gaiak</Link>
        <Link href="/irudiak" aria-current={here('irudiak')}>Irudiak</Link>
        <Link href="/leinuak" aria-current={here('leinuak')}>Leinuak</Link>
        <Link href="/egiturak" className={atlasStyles.entry} aria-current={here('egiturak')}>Egiturak</Link>
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
