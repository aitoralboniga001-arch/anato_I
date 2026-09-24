import Link from 'next/link';
import { weeks } from '@/content/registry';
import { BrandMark } from './icons';

/** A week whose only scenes are placeholders is still being prepared. */
export const isWip = (w: (typeof weeks)[number]) => w.stages.every((s) => s.views.every((v) => v.description === 'Prestatzen'));
export const firstReady = weeks.find((w) => !isWip(w)) ?? weeks[0];

export function LandNav() {
  return (
    <header className="land-nav">
      <Link href="/" className="brand">
        <BrandMark />
        <span className="brand-text">
          Enbrio<b>Atlas</b>
        </span>
      </Link>
      <nav>
        <Link href="/#asteak">Asteak</Link>
        <Link href="/#nola">Nola erabili</Link>
        <Link href="/leinuak">Leinuak</Link>
        <Link href={`/astea/${firstReady.week}`} className="btn primary small">
          Hasi
        </Link>
      </nav>
    </header>
  );
}

export function LandFoot() {
  return (
    <footer className="land-foot">
      <p>Iturria: Giza Anatomia I ikasgaiko apunteak (1.–4. gaiak) eta haietako irudiak (Langman). Simulagailu honek ez du ordezkatzen irakaslearen irizpidea.</p>
      <p className="land-foot-brand">
        <BrandMark size={18} /> EnbrioAtlas
      </p>
    </footer>
  );
}
