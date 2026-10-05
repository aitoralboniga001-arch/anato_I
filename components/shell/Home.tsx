'use client';

import Link from 'next/link';
import { useState } from 'react';
import { weeks } from '@/content/registry';
import { POOL, compKey } from '@/content/pool';
import { isDue, useAnswers } from './answers';
import { Chronicle } from './Chronicle';
import { HeroFold } from './HeroFold';
import { StudyMap } from './StudyMap';
import { INTRO_KEY, Intro } from './intro/Intro';
import { LandFoot, LandNav, firstReady, isWip } from './LandNav';
import { IconPlay } from './icons';
import { useLastPlace, useVisited } from './progress';
import { Specimen } from './Specimen';
import { spanOf } from '@/lib/sim/age';

const stageCount = weeks.reduce((n, w) => n + w.stages.filter((s) => !s.views.every((v) => v.description === 'Prestatzen')).length, 0);
const viewCount = weeks.reduce((n, w) => n + w.stages.reduce((m, s) => m + s.views.filter((v) => v.description !== 'Prestatzen').length, 0), 0);

const pad = (n: number) => String(n).padStart(2, '0');

// The object each topic is about, as the light 3-D sketch the simulator's "Non nago?" uses.
const SKETCH_DAY: Record<number, number> = { 1: 4, 2: 10, 3: 17, 4: 24, 5: 40, 6: 80, 7: 35, 8: 56 };

/** One topic on the home shelf: its object, span, title, progress and the next step. */
function TopicCard({ w }: { w: (typeof weeks)[number] }) {
  const visited = useVisited(w.week);
  const days = spanOf(w).long;
  const sketch = (
    <span className="tc-fig" aria-hidden>
      <Specimen plane="eskema" week={w.week} day={SKETCH_DAY[w.week] ?? w.dayRange[0]} className="tc-svg" />
    </span>
  );
  const head = (
    <>
      <span className="tc-k">
        <span className="tc-n">{pad(w.week)}</span>
        <span className="tc-days">{days}</span>
      </span>
      <b className="tc-t">{w.title}</b>
      <small className="tc-sub">{w.subtitle}</small>
    </>
  );
  if (isWip(w))
    return (
      <li className="tc is-wip">
        <span className="tc-in">
          {sketch}
          {head}
          <span className="tc-foot">
            <span className="tc-state">Prestatzen</span>
          </span>
        </span>
      </li>
    );
  const done = w.stages.filter((s) => visited.includes(s.id)).length;
  const next = w.stages.find((s) => !visited.includes(s.id)) ?? w.stages[0];
  const href = done > 0 && done < w.stages.length ? `/astea/${w.week}?etapa=${next.id}` : `/astea/${w.week}`;
  return (
    <li className="tc">
      <Link href={href} className="tc-in">
        {sketch}
        {head}
        <span className="tc-foot">
          <span className="tc-prog" aria-label={`${done}/${w.stages.length} etapa ikusita`}>
            <span className="toc-ticks">
              {w.stages.map((s) => (
                <i key={s.id} className={visited.includes(s.id) ? 'is-on' : ''} />
              ))}
            </span>
            <small>
              {done}/{w.stages.length}
            </small>
          </span>
          <span className="tc-go">
            {done === 0 ? 'Hasi' : done < w.stages.length ? 'Jarraitu' : 'Berrikusi'} <span aria-hidden>→</span>
          </span>
        </span>
      </Link>
    </li>
  );
}

/** The first screen's main action: back to where the student left off, or the very beginning. */
function ContinueCta() {
  const last = useLastPlace();
  const w = last ? weeks.find((x) => x.week === last.week) : undefined;
  const st = w?.stages.find((s) => s.id === last?.stage);
  if (!w || !st)
    return (
      <Link className="btn btn-light lg" href={`/astea/${firstReady.week}`}>
        <IconPlay size={14} /> Hasi simulagailua
      </Link>
    );
  return (
    <Link className="btn btn-light lg cta-continue" href={`/astea/${w.week}?etapa=${st.id}`}>
      <IconPlay size={14} />
      <span className="cta-continue-t">
        Jarraitu
        <small>
          {w.week}. gaia · {st.title}
        </small>
      </span>
    </Link>
  );
}

/** Spaced review, surfaced: how many competences are due today, one click into the trainer's review. */
function ReviewCta() {
  const answers = useAnswers();
  const last = useLastPlace();
  const [now] = useState(() => Date.now());
  const due = new Set(POOL.filter((q) => isDue(answers[q.id], now)).map((q) => compKey(q.comp, q.concept))).size;
  if (!due) return null;
  const week = last && weeks.some((w) => w.week === last.week) ? last.week : firstReady.week;
  return (
    <Link className="btn lg cta-review" href={`/astea/${week}?galderak=errepasoa`} title="Huts egindako edo berriro lantzeko garaia iritsi zaien gaitasunak, gai guztietan">
      Errepasatu
      <small>{due} gaitasun</small>
    </Link>
  );
}

export function Home() {
  const [intro, setIntro] = useState(true);
  // The page reveals as the opening lifts (not after it is gone), so the two cross-dissolve.
  const [lifting, setLifting] = useState(false);

  const replay = () => {
    try {
      sessionStorage.removeItem(INTRO_KEY);
    } catch {}
    delete document.documentElement.dataset.intro;
    window.scrollTo({ top: 0 });
    setLifting(false);
    setIntro(true);
  };

  return (
    <div className={`landing${intro && !lifting ? '' : ' is-ready'}`}>
      {intro && <Intro onDone={() => setIntro(false)} onOut={() => setLifting(true)} />}
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
            <ContinueCta />
            <ReviewCta />
            <Link className="link-arrow" href="#mapa">
              Gai osoa 20 segundotan <span aria-hidden>↓</span>
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
          <HeroFold playing={!intro || lifting} />
        </div>
      </section>

      <section id="gaiak" className="shelf" aria-labelledby="shelf-h">
        <header className="shelf-head">
          <p className="kicker" id="shelf-h">
            Gaiak · aukeratu nondik hasi
          </p>
          <p className="shelf-note">Garapenaren ordenan, etapatan banatuta. Ikusitako etapak nabigatzaile honetan gordetzen dira.</p>
        </header>
        <ol className="shelf-row">
          {weeks.map((w) => (
            <TopicCard key={w.week} w={w} />
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

      <StudyMap />

      <Chronicle />


      <LandFoot>
        <button className="link-quiet" onClick={replay}>
          Sarrera berriro ikusi
        </button>
      </LandFoot>
    </div>
  );
}
