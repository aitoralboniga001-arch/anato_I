'use client';

import Link from 'next/link';
import { structures, weeks } from '@/content/registry';
import { HeroFold } from './HeroFold';
import { LandFoot, LandNav, firstReady, isWip } from './LandNav';
import { IconBook, IconLayers, IconPlay, IconQuiz, IconTarget, IconTree } from './icons';
import { useVisited } from './progress';

const WEEK_HUE = ['#f4b7ab', '#46b979', '#5b8def', '#6ee7c8'];

const stageCount = weeks.reduce((n, w) => n + w.stages.length, 0);
const viewCount = weeks.reduce((n, w) => n + w.stages.reduce((m, s) => m + s.views.length, 0), 0);
const quizCount = weeks.reduce((n, w) => n + w.quiz.length, 0);

/** Milestones on the 0–28 day ribbon (days as in the notes). */
const MILESTONES: { day: number; label: string }[] = [
  { day: 0, label: 'Ernalkuntza' },
  { day: 5, label: 'Blastozistoa' },
  { day: 7, label: 'Inplantazioa' },
  { day: 13, label: 'Biloxka primarioak' },
  { day: 15, label: 'Gastrulazioa' },
  { day: 22, label: 'Neurulazioa eta tolespenak' },
];

const FEATURES = [
  { icon: <IconPlay size={18} />, title: 'Urratsez urrats', text: 'Prozesu bakoitza animazio batean: eten, atzera egin edo urrats bakoitzaren azalpena irakurri.' },
  { icon: <IconLayers size={18} />, title: 'Ikuspegi anitzak', text: 'Ebaki sagitala, zeharkakoa, goitik edo gertutik: egitura bera plano desberdinetan.' },
  { icon: <IconTarget size={18} />, title: 'Aurkitu jolasa', text: 'Egitura baten izena agertzen da eta irudian klikatu behar duzu. Autoebaluaziorako aproposa.' },
  { icon: <IconQuiz size={18} />, title: 'Azterketa-galderak', text: 'Aste bakoitzeko galderak, azalpenarekin eta dagokion etapara joateko estekarekin.' },
];

function WeekCard({ w, hue }: { w: (typeof weeks)[number]; hue: string }) {
  const visited = useVisited(w.week);
  if (isWip(w))
    return (
      <div className="wk is-wip" style={{ ['--hue' as string]: hue }}>
        <div className="wk-top">
          <span className="wk-n">{w.week}</span>
          <span className="wk-days">
            {w.dayRange[0]}–{w.dayRange[1]}. egunak
          </span>
        </div>
        <h3>{w.title}</h3>
        <p className="wk-sub">{w.subtitle}</p>
        <p className="wk-wip-note">Aste honetako animazioak prestatzen ari dira.</p>
        <div className="wk-foot">
          <span className="wk-badge">Laster</span>
        </div>
      </div>
    );
  const done = w.stages.filter((s) => visited.includes(s.id)).length;
  const pct = Math.round((done / w.stages.length) * 100);
  const next = w.stages.find((s) => !visited.includes(s.id)) ?? w.stages[0];
  const href = done > 0 && done < w.stages.length ? `/astea/${w.week}?etapa=${next.id}` : `/astea/${w.week}`;
  return (
    <Link href={href} className="wk" style={{ ['--hue' as string]: hue }}>
      <div className="wk-top">
        <span className="wk-n">{w.week}</span>
        <span className="wk-days">
          {w.dayRange[0]}–{w.dayRange[1]}. egunak
        </span>
      </div>
      <h3>{w.title}</h3>
      <p className="wk-sub">{w.subtitle}</p>
      <ul className="wk-stages">
        {w.stages.slice(0, 4).map((s) => (
          <li key={s.id} className={visited.includes(s.id) ? 'is-seen' : ''}>
            {s.title}
          </li>
        ))}
        {w.stages.length > 4 && <li className="wk-more">+ {w.stages.length - 4} etapa gehiago</li>}
      </ul>
      <div className="wk-foot">
        <div className="wk-progress" aria-label={`Aurrerapena: %${pct}`}>
          <span style={{ width: `${pct}%` }} />
        </div>
        <span className="wk-meta">
          {done}/{w.stages.length} etapa
        </span>
        <span className="wk-go">{done === 0 ? 'Hasi' : done < w.stages.length ? 'Jarraitu' : 'Berrikusi'} →</span>
      </div>
    </Link>
  );
}

export function Home() {
  return (
    <div className="landing">
      <LandNav />

      <section className="hero">
        <div className="hero-text">
          <p className="eyebrow">Giza Anatomia I · Enbriologia</p>
          <h1>
            Garapenaren lehen lau asteak, <em>urratsez urrats ikusita.</em>
          </h1>
          <p className="hero-lead">
            Ernalkuntzatik enbrioiaren tolespeneraino: prozesu bakoitza animatuta eta zelula-geruzekin marraztuta, mozketa eta ikuspegi desberdinetatik, zure apunteetako izen guztiekin euskaraz.
          </p>
          <div className="hero-cta">
            <Link className="btn primary lg" href={`/astea/${firstReady.week}`}>
              <IconPlay size={16} /> Hasi {firstReady.week}. astetik
            </Link>
            <Link className="btn lg" href="/leinuak">
              <IconTree size={16} /> Ernetze orrien leinuak
            </Link>
          </div>
          <dl className="hero-stats">
            <div>
              <dt>{weeks.length}</dt>
              <dd>aste</dd>
            </div>
            <div>
              <dt>{stageCount}</dt>
              <dd>etapa</dd>
            </div>
            <div>
              <dt>{viewCount}</dt>
              <dd>ikuspegi</dd>
            </div>
            <div>
              <dt>{structures.size}</dt>
              <dd>egitura</dd>
            </div>
            <div>
              <dt>{quizCount}</dt>
              <dd>galdera</dd>
            </div>
          </dl>
        </div>
        <HeroFold />
      </section>

      <section className="ribbon" aria-label="Garapenaren lehen 28 egunak">
        <div className="ribbon-track">
          {weeks.map((w, i) => (
            <Link
              key={w.week}
              href={`/astea/${w.week}`}
              className="ribbon-week"
              style={{ left: `${(w.dayRange[0] / 28) * 100}%`, width: `${((w.dayRange[1] - w.dayRange[0] + 1) / 28) * 100}%`, ['--hue' as string]: WEEK_HUE[i] }}
            >
              {w.week}. astea
            </Link>
          ))}
        </div>
        <div className="ribbon-marks">
          {MILESTONES.map((m) => (
            <span key={m.label} style={{ left: `${(m.day / 28) * 100}%` }}>
              <i />
              <b>{m.day}. eg.</b> {m.label}
            </span>
          ))}
        </div>
      </section>

      <section id="asteak" className="land-section">
        <div className="section-head">
          <p className="eyebrow">Edukiak</p>
          <h2>Aukeratu astea</h2>
          <p>Aste bakoitzak bere etapak ditu, garapenaren ordenan. Zure aurrerapena nabigatzaile honetan gordetzen da.</p>
        </div>
        <div className="wk-grid">
          {weeks.map((w, i) => (
            <WeekCard key={w.week} w={w} hue={WEEK_HUE[i]} />
          ))}
        </div>
      </section>

      <section id="nola" className="land-section">
        <div className="section-head">
          <p className="eyebrow">Nola erabili</p>
          <h2>Ikusi, ulertu eta zeure burua ebaluatu</h2>
        </div>
        <div className="feat-grid">
          {FEATURES.map((f) => (
            <article key={f.title} className="feat">
              <span className="feat-icon">{f.icon}</span>
              <h3>{f.title}</h3>
              <p>{f.text}</p>
            </article>
          ))}
        </div>
        <div className="keys">
          <span>
            <kbd>Zuriunea</kbd> erreproduzitu / pausatu
          </span>
          <span>
            <kbd>←</kbd>
            <kbd>→</kbd> urratsak
          </span>
          <span>
            <kbd>Shift</kbd>+<kbd>→</kbd> hurrengo etapa
          </span>
          <span>
            <kbd>1</kbd>–<kbd>9</kbd> ikuspegiak
          </span>
          <span>
            <kbd>L</kbd> etiketak
          </span>
          <span>
            <IconBook size={14} /> Glosarioa simulagailuan
          </span>
        </div>
      </section>

      <LandFoot />
    </div>
  );
}
