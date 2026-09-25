'use client';

import Link from 'next/link';
import { useState } from 'react';
import { weeks } from '@/content/registry';
import { Chronicle } from './Chronicle';
import { HeroFold } from './HeroFold';
import { INTRO_KEY, Intro } from './intro/Intro';
import { LandFoot, LandNav, firstReady, isWip } from './LandNav';
import { IconPlay } from './icons';
import { useVisited } from './progress';
import { spanOf } from '@/lib/sim/age';

const stageCount = weeks.reduce((n, w) => n + w.stages.filter((s) => !s.views.every((v) => v.description === 'Prestatzen')).length, 0);
const viewCount = weeks.reduce((n, w) => n + w.stages.reduce((m, s) => m + s.views.filter((v) => v.description !== 'Prestatzen').length, 0), 0);

const pad = (n: number) => String(n).padStart(2, '0');

function TocRow({ w }: { w: (typeof weeks)[number] }) {
  const visited = useVisited(w.week);
  const days = spanOf(w).long;
  if (isWip(w))
    return (
      <li className="toc-row is-wip">
        <span className="toc-n">{pad(w.week)}</span>
        <span className="toc-main">
          <b>{w.title}</b>
          <small>{w.subtitle}</small>
        </span>
        <span className="toc-days">{days}</span>
        <span className="toc-state">Prestatzen</span>
      </li>
    );
  const done = w.stages.filter((s) => visited.includes(s.id)).length;
  const next = w.stages.find((s) => !visited.includes(s.id)) ?? w.stages[0];
  const href = done > 0 && done < w.stages.length ? `/astea/${w.week}?etapa=${next.id}` : `/astea/${w.week}`;
  return (
    <li>
      <Link href={href} className="toc-row">
        <span className="toc-n">{pad(w.week)}</span>
        <span className="toc-main">
          <b>{w.title}</b>
          <small>{w.subtitle}</small>
        </span>
        <span className="toc-days">{days}</span>
        <span className="toc-prog" aria-label={`${done}/${w.stages.length} etapa ikusita`}>
          <span className="toc-ticks">
            {w.stages.map((s) => (
              <i key={s.id} className={visited.includes(s.id) ? 'is-on' : ''} />
            ))}
          </span>
          <small>
            {done}/{w.stages.length}
          </small>
        </span>
        <span className="toc-go">
          {done === 0 ? 'Hasi' : done < w.stages.length ? 'Jarraitu' : 'Berrikusi'} <span aria-hidden>→</span>
        </span>
      </Link>
    </li>
  );
}

export function Home() {
  const [intro, setIntro] = useState(true);

  const replay = () => {
    try {
      sessionStorage.removeItem(INTRO_KEY);
    } catch {}
    delete document.documentElement.dataset.intro;
    window.scrollTo({ top: 0 });
    setIntro(true);
  };

  return (
    <div className={`landing${intro ? '' : ' is-ready'}`}>
      {intro && <Intro onDone={() => setIntro(false)} />}
      <LandNav />

      <section className="hero">
        <div className="hero-text">
          <p className="kicker rv">Giza Anatomia I — Enbriologia</p>
          <h1 className="rv">
            Giza garapena,
            <br />
            zelulaz zelula.
          </h1>
          <p className="hero-lead rv">
            Ernalkuntzatik enbrioiaren tolespenetara, prozesu bakoitza animatuta eta zure apunteetako izen guztiekin, euskaraz. Eten, atzera egin, mozketa aldatu eta egitura bakoitza klikatu.
          </p>
          <div className="hero-cta rv">
            <Link className="btn btn-light lg" href={`/astea/${firstReady.week}`}>
              <IconPlay size={14} /> Hasi simulagailua
            </Link>
            <Link className="link-arrow" href="#kronologia">
              Ikusi kronologia <span aria-hidden>↓</span>
            </Link>
          </div>
          <p className="hero-meta rv">
            <span>{weeks.length} gai</span>
            <span>{stageCount} etapa</span>
            <span>{viewCount} ikuspegi</span>
            <span>euskaraz</span>
          </p>
        </div>
        <div className="hero-visual rv">
          <HeroFold playing={!intro} />
        </div>
      </section>

      <Chronicle />

      <section id="gaiak" className="land-section">
        <header className="section-head">
          <p className="kicker">Gaiak</p>
          <h2>Aukeratu nondik hasi</h2>
          <p>Gai bakoitza etapatan banatuta dago, garapenaren ordenan. Ikusitako etapak nabigatzaile honetan gordetzen dira.</p>
        </header>
        <ol className="toc">
          {weeks.map((w) => (
            <TocRow key={w.week} w={w} />
          ))}
        </ol>

        <div className="keys" aria-label="Laster-teklak">
          <span>
            <kbd>Zuriunea</kbd> erreproduzitu / pausatu
          </span>
          <span>
            <kbd>←</kbd> <kbd>→</kbd> urratsak
          </span>
          <span>
            <kbd>Shift</kbd> <kbd>→</kbd> hurrengo etapa
          </span>
          <span>
            <kbd>1</kbd>–<kbd>9</kbd> ikuspegiak
          </span>
          <span>
            <kbd>L</kbd> etiketak
          </span>
        </div>
      </section>

      <LandFoot>
        <button className="link-quiet" onClick={replay}>
          Sarrera berriro ikusi
        </button>
      </LandFoot>
    </div>
  );
}
