'use client';

import Link from 'next/link';
import { useRef, useState, type CSSProperties, type PointerEvent } from 'react';
import { weeks } from '@/content/registry';
import { POOL, compKey } from '@/content/pool';
import { isDue, useAnswers } from './answers';
import { Chronicle } from './Chronicle';
import { HeroReel } from './HeroReel';
import { StudyMap, countWord, shelfCols } from './StudyMap';
import { INTRO_KEY, Intro } from './intro/Intro';
import { LandFoot, LandNav, firstReady, inPrep, isWip } from './LandNav';
import { IconPlay } from './icons';
import { useLastPlace, useVisited } from './progress';
import { TopicShot } from './TopicShot';
import { GuideButton, TourHost } from './tour/TourHost';
import { CountUp, useReveal } from './landing-fx';
import './landing.css';
import { spanOf } from '@/lib/sim/age';

const stageCount = weeks.reduce((n, w) => n + w.stages.filter((s) => !s.views.every((v) => v.description === 'Prestatzen')).length, 0);
const viewCount = weeks.reduce((n, w) => n + w.stages.reduce((m, s) => m + s.views.filter((v) => v.description !== 'Prestatzen').length, 0), 0);

const pad = (n: number) => String(n).padStart(2, '0');

const NEWEST = 7;

/** Cursor-following light on a card (CSS variables the stylesheet reads). */
const spot = (e: PointerEvent<HTMLElement>) => {
  const r = e.currentTarget.getBoundingClientRect();
  e.currentTarget.style.setProperty('--mx', `${e.clientX - r.left}px`);
  e.currentTarget.style.setProperty('--my', `${e.clientY - r.top}px`);
};

/** One topic on the home shelf: a frame of its own scene, span, title, progress and the next step. */
function TopicCard({ w, i }: { w: (typeof weeks)[number]; i: number }) {
  const visited = useVisited(w.week);
  const [hot, setHot] = useState(false);
  const days = spanOf(w).long;
  const wip = isWip(w);
  const done = w.stages.filter((s) => visited.includes(s.id)).length;
  const next = w.stages.find((s) => !visited.includes(s.id)) ?? w.stages[0];
  const href = done > 0 && done < w.stages.length ? `/astea/${w.week}?etapa=${next.id}` : `/astea/${w.week}`;
  const inner = (
    <>
      <span className="lp-card-fig">
        <TopicShot week={w.week} hot={hot} />
        <span className="lp-card-n">{pad(w.week)}</span>
        {!wip && inPrep(w) ? <span className="lp-card-new is-prep">Prestatzen</span> : w.week >= NEWEST && !wip && <span className="lp-card-new">Berria</span>}
      </span>
      <span className="lp-card-body">
        <span className="lp-card-days">{days}</span>
        <b>{w.title}</b>
        <small>{w.subtitle}</small>
      </span>
      <span className="lp-card-foot">
        {wip ? (
          <span className="lp-card-state">Prestatzen</span>
        ) : (
          <>
            <span className="lp-card-prog" aria-label={`${done}/${w.stages.length} etapa ikusita`}>
              <span className="toc-ticks">
                {w.stages.map((s) => (
                  <i key={s.id} className={visited.includes(s.id) ? 'is-on' : ''} />
                ))}
              </span>
              <small>
                {done}/{w.stages.length}
              </small>
            </span>
            <span className="lp-card-go">
              {done === 0 ? 'Hasi' : done < w.stages.length ? 'Jarraitu' : 'Berrikusi'} <span aria-hidden>→</span>
            </span>
          </>
        )}
      </span>
    </>
  );
  const style = { '--d': `${(i % 4) * 80}ms` } as CSSProperties;
  return (
    <li className={`lp-card${wip ? ' is-wip' : ''}`} data-rv style={style}>
      {wip ? (
        <span className="lp-card-in">{inner}</span>
      ) : (
        <Link
          href={href}
          className="lp-card-in"
          onPointerEnter={() => setHot(true)}
          onPointerLeave={() => setHot(false)}
          onFocus={() => setHot(true)}
          onBlur={() => setHot(false)}
          onPointerMove={spot}
        >
          {inner}
        </Link>
      )}
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
      <Link className="btn btn-light lg" data-tour="hasi" href={`/astea/${firstReady.week}`}>
        <IconPlay size={14} /> Hasi simulagailua
      </Link>
    );
  return (
    <Link className="btn btn-light lg cta-continue" data-tour="hasi" href={`/astea/${w.week}?etapa=${st.id}`}>
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
  // Asked for again from the footer: the whole sequence, not the short signature.
  const [replayed, setReplayed] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const ready = !intro || lifting;
  useReveal(root, true);

  const replay = () => {
    try {
      sessionStorage.removeItem(INTRO_KEY);
    } catch {}
    delete document.documentElement.dataset.intro;
    window.scrollTo({ top: 0 });
    setLifting(false);
    setReplayed(true);
    setIntro(true);
  };

  return (
    <div ref={root} className={`landing${ready ? ' is-ready' : ' is-intro'}`}>
      {intro && <Intro full={replayed} onDone={() => setIntro(false)} onOut={() => setLifting(true)} />}
      <LandNav help={<GuideButton tour="home" />} />
      <TourHost tour="home" ready={ready} />

      <section className="hero lp-hero">
        <div className="lp-aurora" aria-hidden />
        <div className="hero-text">
          <p className="kicker rv">
            <span className="lp-live" aria-hidden /> Giza Anatomia I — Enbriologia
          </p>
          <h1 className="rv lp-h1">
            <span className="lp-line">
              <span>Giza garapena,</span>
            </span>
            <span className="lp-line">
              <span>zelulaz zelula.</span>
            </span>
          </h1>
          <p className="hero-lead rv">
            Ernalkuntzatik gorputzaren sistemak eratu arte (barrunbeak, hezurrak, muskuluak…): prozesu bakoitza animatuta eta zure apunteetako izen guztiekin, euskaraz. Eten, atzera egin, mozketa aldatu eta egitura bakoitza klikatu.
          </p>
          <div className="hero-cta rv">
            <ContinueCta />
            <ReviewCta />
            <Link className="link-arrow" href="#mapa">
              Gai osoa 20 segundotan <span aria-hidden>↓</span>
            </Link>
          </div>
          <dl className="lp-stats rv">
            <div>
              <dt>gai</dt>
              <dd>
                <CountUp to={weeks.length} go={ready} delay={500} />
              </dd>
            </div>
            <div>
              <dt>etapa</dt>
              <dd>
                <CountUp to={stageCount} go={ready} delay={600} />
              </dd>
            </div>
            <div>
              <dt>ikuspegi</dt>
              <dd>
                <CountUp to={viewCount} go={ready} delay={700} />
              </dd>
            </div>
            <div>
              <dt>hizkuntza</dt>
              <dd className="is-word">euskara</dd>
            </div>
          </dl>
        </div>
        <div className="hero-visual rv">
          <HeroReel playing={ready} />
        </div>
      </section>

      <section id="gaiak" className="shelf lp-shelf" aria-labelledby="shelf-h">
        <header className="lp-shelf-head" data-rv>
          <div>
            <p className="kicker" id="shelf-h">
              Gaiak · aukeratu nondik hasi
            </p>
            <h2>{countWord(weeks.length)} gai, garapenaren ordenan</h2>
          </div>
          <p className="shelf-note">Etapatan banatuta, eta bakoitza bere eszenarekin. Pasatu sagua gainetik eta ikusiko duzu mugitzen. Ikusitako etapak nabigatzaile honetan gordetzen dira.</p>
        </header>
        <ol className="lp-cards" data-tour="gaiak" style={{ '--cols': shelfCols(weeks.length) } as CSSProperties}>
          {weeks.map((w, i) => (
            <TopicCard key={w.week} w={w} i={i} />
          ))}
        </ol>
        <div className="keys" aria-label="Laster-teklak" data-rv>
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
