'use client';

import { useEffect, useRef, useState } from 'react';
import { Defs } from '@/components/kit/Defs';
import { LabelScaleContext, SceneContext, type SceneContextValue } from '@/components/kit/context';
import { appearances, isSpace, partsOf, nameOf, weeks } from '@/content/registry';
import { atlasTopics } from '@/content/structure-atlas';
import { categoryColor, categoryLabel } from '@/lib/sim/palette';
import type { StructureDef } from '@/lib/sim/types';
import { frameAround, shotsOf, type Box } from './AtlasFigure';
import styles from './structure-atlas.module.css';

const W = 1000;
const H = 640;
const noop = () => {};

/** Each structure's frame, found once per page visit (a card scrolled back into view reuses it). */
const frames = new Map<string, Box | null>();

/**
 * The structure as the simulator draws it, small: the step that introduces it, lit (the rest shaded,
 * as in the guided tour), framed around it. Drawn only while the card is on or near the screen, and
 * still (the scene's reduced mode), so a long grid costs no more than the few cards in view.
 */
function AtlasMini({ id }: { id: string }) {
  const box = useRef<HTMLSpanElement>(null);
  const svg = useRef<SVGSVGElement>(null);
  const [near, setNear] = useState(false);
  const [vb, setVb] = useState<Box | null | undefined>(() => frames.get(id));
  const [shot] = useState(() => shotsOf(id)[0]);

  useEffect(() => {
    const el = box.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(([e]) => setNear(e.isIntersecting), { rootMargin: '320px 0px' });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Frame it once it is drawn: the box of its parts (the lit drawing), in scene units.
  useEffect(() => {
    if (!near || vb !== undefined) return;
    const r = requestAnimationFrame(() => {
      const root = svg.current;
      const ctm = root?.getScreenCTM();
      if (!root || !ctm) return;
      const inv = ctm.inverse();
      let b: Box = [Infinity, Infinity, -Infinity, -Infinity];
      for (const g of root.querySelectorAll<SVGGElement>(`[data-part="${CSS.escape(id)}"]`)) {
        if (Number(g.getAttribute('opacity') ?? 1) <= 0.3) continue;
        const q = g.getBoundingClientRect();
        if (!q.width && !q.height) continue;
        for (const [cx, cy] of [[q.left, q.top], [q.right, q.bottom]]) {
          const p = new DOMPoint(cx, cy).matrixTransform(inv);
          b = [Math.min(b[0], p.x), Math.min(b[1], p.y), Math.max(b[2], p.x), Math.max(b[3], p.y)];
        }
      }
      const found = Number.isFinite(b[0]) ? frameAround(b) : null;
      frames.set(id, found);
      setVb(found);
    });
    return () => cancelAnimationFrame(r);
  }, [near, vb, id]);

  const view = shot?.stage.views.find((v) => v.id === shot.view);
  const Scene = view?.scene;
  const ctx: SceneContextValue = {
    selected: null,
    hovered: null,
    focus: [],
    spotlight: id,
    showLabels: false,
    quiz: false,
    quizFlash: null,
    nameOf,
    isSpace,
    partsOf,
    onSelect: noop,
    onHover: noop,
  };
  return (
    <span ref={box} className={styles.mini} data-ready={vb !== undefined || undefined} aria-hidden>
      {near && Scene && shot && (
        <svg ref={svg} viewBox={vb ? vb.map((v) => v.toFixed(0)).join(' ') : `0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet">
          <Defs />
          <SceneContext.Provider value={ctx}>
            <LabelScaleContext.Provider value={{ k: 1, left: false, right: false }}>
              <Scene t={shot.t} reduced />
            </LabelScaleContext.Provider>
          </SceneContext.Provider>
        </svg>
      )}
    </span>
  );
}

function Card({ s, selected, onChoose }: { s: StructureDef; selected: boolean; onChoose: (id: string) => void }) {
  const first = appearances.get(s.id)?.[0];
  return (
    <li>
      <button type="button" className={styles.card} data-atlas-node={s.id} aria-pressed={selected} onClick={() => onChoose(s.id)}>
        <AtlasMini id={s.id} />
        <span className={styles.cardBody}>
          <span className={styles.cardMeta}>
            <i className={styles.swatch} style={{ background: s.color ?? categoryColor[s.category] }} aria-hidden />
            {categoryLabel[s.category]}
          </span>
          <b className={styles.cardName}>{s.name}</b>
          {s.es && (
            <small className={styles.cardEs} lang="es">
              {s.es}
            </small>
          )}
          <span className={styles.cardDef}>{s.definition}</span>
          <span className={styles.cardFirst}>
            {first ? (
              <>
                <em>Lehen aldiz</em> {`${first.week.week}. gaia · ${first.stage.title} · ${first.stage.day}`}
              </>
            ) : (
              <em>Simulagailuan ez dago oraindik</em>
            )}
          </span>
        </span>
      </button>
    </li>
  );
}

/**
 * The atlas as cards: each structure with its own small drawing, its notes' definition and where it
 * first appears, grouped under the topic that introduces it.
 */
export function AtlasCards({ items, topic, selectedId, onChoose }: { items: StructureDef[]; topic: number; selectedId?: string; onChoose: (id: string) => void }) {
  const home = (s: StructureDef) => (topic && atlasTopics(s.id).includes(topic) ? topic : (atlasTopics(s.id)[0] ?? 0));
  return (
    <>
      {weeks
        .filter((w) => !topic || w.week === topic)
        .map((w) => {
          const list = items.filter((s) => home(s) === w.week);
          if (!list.length) return null;
          return (
            <section key={w.week} className={styles.cardSection} aria-labelledby={`atlas-cards-${w.week}`}>
              <header>
                <p className="eyebrow">
                  {w.week}. gaia · {list.length} egitura
                </p>
                <h2 id={`atlas-cards-${w.week}`}>{w.title}</h2>
              </header>
              <ul className={styles.cards}>
                {list.map((s) => (
                  <Card key={s.id} s={s} selected={selectedId === s.id} onChoose={onChoose} />
                ))}
              </ul>
            </section>
          );
        })}
    </>
  );
}
