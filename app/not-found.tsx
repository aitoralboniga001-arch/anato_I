import Link from 'next/link';
import { LandFoot, LandNav, firstReady } from '@/components/shell/LandNav';

export default function NotFound() {
  return (
    <div className="landing">
      <LandNav />
      <section className="ln-hero">
        <p className="eyebrow">404</p>
        <h1>Orri hau ez dago</h1>
        <p className="hero-lead">Bilatzen ari zaren helbidea ez da existitzen edo lekuz aldatu da.</p>
        <div className="hero-cta">
          <Link href="/" className="btn primary lg">
            Hasierara itzuli
          </Link>
          <Link href={`/astea/${firstReady.week}`} className="btn lg">
            Simulagailua ireki
          </Link>
        </div>
      </section>
      <LandFoot />
    </div>
  );
}
