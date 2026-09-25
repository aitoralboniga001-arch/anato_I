'use client';

import Link from 'next/link';
import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { Defs } from '@/components/kit/Defs';
import { SceneContext } from '@/components/kit/context';
import { getWeek } from '@/content/registry';
import type { SceneComponent } from '@/lib/sim/types';
import { QUIET_CTX } from './HeroFold';
import { cleavageFrame } from './intro/cleavage';
import { CleavageArt, CleavageDefs } from './intro/CleavageArt';

interface Chapter {
  days: string;
  title: string;
  text: string;
  href?: string;
  scene?: SceneComponent;
}

/** Real simulator scenes, scrubbed by scroll. Text paraphrases the notes of each topic. */
function chapters(): Chapter[] {
  const pick = (week: number, stage: string, view = 0) => {
    const w = getWeek(week);
    const s = w?.stages.find((x) => x.id === stage);
    const v = s?.views[view];
    return v ? { scene: v.scene, href: `/astea/${week}?etapa=${stage}&ikuspegia=${v.id}` } : {};
  };
  return [
    {
      days: '0.–5. egunak',
      title: 'Segmentazioa eta blastozistoa',
      text: 'Zigotoa tronpan zehar umetokirantz doan bitartean, zatiketa mitotikoz gero eta blastomero txikiagoak sortzen dira. 3. egunean morula da; 4.–5. egunetan zelulen artean likidoa sartu eta blastozistoa eratzen da.',
    },
    {
      days: '8. eguna',
      title: 'Habiratzea',
      text: 'Blastozistoa endometrioan sartzen ari da. Trofoblastoa zitotrofoblasto eta sinzitiotrofoblastotan bereizten da, eta enbrioblastoa epiblasto eta hipoblastotan.',
      ...pick(2, 'eguna-8'),
    },
    {
      days: '13. eguna',
      title: 'Bi orriko ernetze diskoa',
      text: 'Biloxka primarioak agertzen dira eta bitelo zaku sekundarioa eratzen da. Enbrioia korion barrunbean esekita geratzen da, finkapen pedikuluari lotuta.',
      ...pick(2, 'eguna-13'),
    },
    {
      days: '15.–16. egunak',
      title: 'Gastrulazioa',
      text: 'Epiblastoko zelulek lerro primitibotik inbaginatzen dute: endodermoa eta mesodermoa sortzen dira, eta gainazalean geratzen direnak ektodermo bihurtzen dira.',
      ...pick(3, 'gastrulazioa', 1),
    },
    {
      days: '22.–28. egunak',
      title: 'Neurulazioa',
      text: 'Plaka neurala tolesten da, tolesdura neuralak erdiko lerroan fusionatzen dira eta hodi neurala eratzen da. Gandor neuralaren zelulak ertzetatik askatzen dira.',
      ...pick(4, 'neurulazioa'),
    },
    {
      days: '22.–28. egunak',
      title: 'Tolespenak',
      text: 'Zeharkako eta zefalokaudal tolespenak aldi berean gertatzen dira: disko laua C itxurako enbrioi zilindriko bihurtzen da eta endodermoa hestea bihurtzen da.',
      ...pick(4, 'tolespenak'),
    },
  ];
}

const CH = chapters();
const subscribeNothing = () => () => {};
const clamp = (v: number) => Math.min(1, Math.max(0, v));

/** Scroll-driven film: each chapter takes one screen of scroll; the scene plays as you scroll. */
export function Chronicle() {
  const mounted = useSyncExternalStore(subscribeNothing, () => true, () => false);
  const ref = useRef<HTMLElement>(null);
  const [pos, setPos] = useState({ i: 0, t: 0 });

  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      const el = ref.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const span = r.height - window.innerHeight;
      const p = clamp(-r.top / Math.max(1, span)) * CH.length;
      const i = Math.min(CH.length - 1, Math.floor(p));
      setPos({ i, t: clamp((p - i - 0.06) / 0.78) });
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  const ch = CH[pos.i];
  const Scene = ch.scene;
  return (
    <section ref={ref} id="kronologia" className="chron" style={{ height: `${CH.length * 100 + 60}vh` }} aria-label="Kronologia">
      <div className="chron-sticky">
        <div className="chron-text">
          <p className="kicker">Kronologia</p>
          <ol className="chron-index">
            {CH.map((c, k) => (
              <li key={k} className={k === pos.i ? 'is-on' : k < pos.i ? 'is-past' : ''}>
                <span className="n">{String(k + 1).padStart(2, '0')}</span>
                <span>{c.title}</span>
              </li>
            ))}
          </ol>
          <div className="chron-body" key={pos.i}>
            <p className="chron-days">{ch.days}</p>
            <h3>{ch.title}</h3>
            <p>{ch.text}</p>
            {ch.href && (
              <Link className="link-arrow" href={ch.href}>
                Ireki simulagailuan <span aria-hidden>→</span>
              </Link>
            )}
          </div>
        </div>

        <figure className="chron-frame">
          <svg viewBox={Scene ? '0 0 1000 640' : '-320 -205 640 410'} aria-label={ch.title} role="img" key={pos.i} className="chron-svg">
            {Scene ? <Defs /> : <CleavageDefs id="ch" />}
            {mounted &&
              (Scene ? (
                <SceneContext.Provider value={QUIET_CTX}>
                  <Scene t={pos.t} reduced={false} />
                </SceneContext.Provider>
              ) : (
                <CleavageArt f={cleavageFrame(pos.t * 6)} id="ch" polar={1 - clamp(pos.t * 6 - 4)} />
              ))}
          </svg>
          <span className="vf vf-tl" />
          <span className="vf vf-tr" />
          <span className="vf vf-bl" />
          <span className="vf vf-br" />
          <figcaption className="hv-hud">
            <span className="rec" />
            <span className="tc">{ch.days}</span>
            <span className="hv-cap">
              {String(pos.i + 1).padStart(2, '0')} / {String(CH.length).padStart(2, '0')}
            </span>
          </figcaption>
          <div className="hv-scrub" aria-hidden>
            <span style={{ transform: `scaleX(${pos.t})` }} />
          </div>
        </figure>
      </div>
    </section>
  );
}
