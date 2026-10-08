'use client';

import { structures } from '@/content/registry';
import { categoryColor } from '@/lib/sim/palette';
import type { WeekDef } from '@/lib/sim/types';

/**
 * Topic 7's thread, always in view: which cavity comes from which, by what partition and when. The
 * stage being watched is lit, what it has not formed yet waits dimmed, and the structures the current
 * step names glow, so "where am I in the story?" has an answer at every step. Each piece opens the
 * stage that forms it; resting on one glows it in the drawing.
 */

interface Box {
  id: string;
  /** Two short lines. */
  text: [string, string];
  x: number;
  y: number;
  w: number;
  /** Stage that forms it. */
  stage: string;
}

interface Wall {
  /** The partition that makes the split below it. */
  id: string;
  text: string;
  when: string;
  x: number;
  w: number;
  y: number;
  stage: string;
}

const W = 248;
const H = 268;
const BH = 34;

const Z: Box = { id: 'enbrioi-barruko-zeloma', text: ['Enbrioi barruko zeloma', 'barrunbe bakarra · 3.–4. a.'], x: 30, y: 6, w: 188, stage: 'zeloma' };
const HP: Box = { id: 'hasierako-perikardio-barrunbea', text: ['Hasierako perikardio', 'barrunbea · goian'], x: 4, y: 92, w: 134, stage: 'septum-transversum' };
const PE: Box = { id: 'peritoneo-barrunbea', text: ['Peritoneo b.', 'behean'], x: 166, y: 92, w: 78, stage: 'peritoneo-barrunbea' };
const PL: Box = { id: 'pleura-barrunbea', text: ['2 pleura', 'alboetan'], x: 4, y: 196, w: 62, stage: 'pleura-perikardioa' };
const PK: Box = { id: 'perikardio-barrunbea', text: ['Perikardio', 'erdian'], x: 72, y: 196, w: 66, stage: 'pleura-perikardioa' };
const BOXES = [Z, HP, PE, PL, PK];

const SEPTUM: Wall = { id: 'septum-transversum', text: 'Septum transversuma', when: '4. a. · C3–C5', x: 30, w: 124, y: 62, stage: 'septum-transversum' };
const PPK: Wall = { id: 'mintz-pleuroperikardikoak', text: 'Mintz pleuroperikardikoak', when: '5. a.', x: 4, w: 134, y: 164, stage: 'pleura-perikardioa' };
const WALLS = [SEPTUM, PPK];

/** Stage → what it is about on the road (boxes, walls, the canals, the diaphragm). */
const ABOUT: Record<string, string[]> = {
  zeloma: ['enbrioi-barruko-zeloma'],
  'septum-transversum': ['septum-transversum', 'hasierako-perikardio-barrunbea', 'peritoneo-barrunbea', 'erreten-perikardioperitonealak'],
  'peritoneo-barrunbea': ['peritoneo-barrunbea'],
  'pleura-perikardioa': ['mintz-pleuroperikardikoak', 'pleura-barrunbea', 'perikardio-barrunbea'],
  'diafragma-eraketa': ['erreten-perikardioperitonealak', 'mintz-pleuroperitonealak', 'diafragma'],
  'diafragma-heldua': ['diafragma'],
};

const colorOf = (id: string) => {
  const s = structures.get(id);
  return s?.color ?? (s ? categoryColor[s.category] : '#9fb6d9');
};

const mid = (b: Box) => b.x + b.w / 2;

export function CavityRoad({
  week,
  stage,
  focus,
  onStage,
  onHover,
}: {
  week: WeekDef;
  stage: string;
  focus: readonly string[];
  onStage: (i: number) => void;
  onHover: (id: string | null) => void;
}) {
  const order = week.stages.map((s) => s.id);
  const now = order.indexOf(stage);
  const about = new Set(ABOUT[stage] ?? []);
  const lit = new Set(focus);
  // Formed once the story has reached the stage that makes it.
  const formed = (st: string) => order.indexOf(st) <= now;
  const state = (id: string, st: string) => (lit.has(id) ? 'is-lit' : about.has(id) ? 'is-here' : formed(st) ? 'is-done' : 'is-later');
  const act = (id: string, st: string) => ({
    onClick: () => {
      const i = order.indexOf(st);
      if (i >= 0) onStage(i);
    },
    onPointerEnter: () => onHover(id),
    onPointerLeave: () => onHover(null),
  });
  const canals = state('erreten-perikardioperitonealak', 'septum-transversum');
  const closed = order.indexOf('diafragma-eraketa') < now || (stage === 'diafragma-eraketa' && lit.has('mintz-pleuroperitonealak'));
  const dia = lit.has('mintz-pleuroperitonealak') ? 'is-lit' : state('diafragma', 'diafragma-eraketa');
  const cy = HP.y + BH * 0.62;

  return (
    <section className="road" aria-label="Barrunbeen bidea">
      <p className="kicker road-kicker">Barrunbeen bidea</p>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="road-svg"
        role="img"
        aria-label="Zelomatik lau barrunbe: septum transversumak bitan banatzen du, mintz pleuroperikardikoek goikoa hirutan, eta mintz pleuroperitonealek erretenak ixten dituzte (diafragma)."
      >
        {/* The splits: the coelom → upper and lower; the upper → the two pleural cavities and the pericardial one. */}
        <path
          className={`road-link ${state(SEPTUM.id, SEPTUM.stage)}`}
          d={`M${mid(Z)},${Z.y + BH} V${SEPTUM.y - 8} M${mid(HP)},${SEPTUM.y + 8} V${HP.y} M${mid(PE)},${SEPTUM.y + 8} V${PE.y} M${mid(HP)},${SEPTUM.y + 8} H${mid(PE)}`}
        />
        <path className={`road-link ${state(PPK.id, PPK.stage)}`} d={`M${mid(HP)},${HP.y + BH} V${PPK.y - 8} M${mid(PL)},${PPK.y + 8} V${PL.y} M${mid(PK)},${PPK.y + 8} V${PK.y} M${mid(PL)},${PPK.y + 8} H${mid(PK)}`} />

        {/* The canals: the upper and lower cavities still open into each other at the back, until the pleuroperitoneal membranes close them. */}
        <g className={`road-canal ${canals}${closed ? ' is-closed' : ''}`} {...act('erreten-perikardioperitonealak', 'septum-transversum')}>
          <title>Erreten perikardioperitonealak: goiko eta beheko barrunbeak atzean komunikatzen dituzte, 5. astean itxi arte</title>
          <path d={`M${HP.x + HP.w},${cy} H${PE.x}`} style={{ stroke: colorOf('erreten-perikardioperitonealak') }} />
          {closed && <path className="road-x" d={`M${(HP.x + HP.w + PE.x) / 2 - 4},${cy - 4} l8,8 m0,-8 l-8,8`} />}
          <text x={(HP.x + HP.w + PE.x) / 2} y={HP.y + BH + 14} textAnchor="middle" className="road-t2">
            {closed ? 'erretenak itxita' : 'erretenak (atzean)'}
          </text>
        </g>

        {WALLS.map((w) => (
          <g key={w.id} className={`road-wall ${state(w.id, w.stage)}`} {...act(w.id, w.stage)}>
            <title>{structures.get(w.id)?.name ?? w.text}</title>
            <rect x={w.x} y={w.y - 8} width={w.w} height={16} rx={8} style={{ fill: colorOf(w.id) }} />
            <text x={w.x + w.w / 2} y={w.y + 3.5} textAnchor="middle">
              {w.text}
            </text>
            <text x={w.x + w.w + 6} y={w.y + 3.5} className="road-when">
              {w.when}
            </text>
          </g>
        ))}

        {BOXES.map((b) => (
          <g key={b.id} className={`road-box ${state(b.id, b.stage)}`} {...act(b.id, b.stage)}>
            <title>{structures.get(b.id)?.name ?? b.text[0]}</title>
            <rect x={b.x} y={b.y} width={b.w} height={BH} rx={9} style={{ stroke: colorOf(b.id) }} />
            <rect x={b.x + 1} y={b.y + 7} width={3} height={BH - 14} rx={1.5} style={{ fill: colorOf(b.id) }} className="road-tab" />
            <text x={b.x + 10} y={b.y + 14} className="road-t1">
              {b.text[0]}
            </text>
            <text x={b.x + 10} y={b.y + 27} className="road-t2">
              {b.text[1]}
            </text>
          </g>
        ))}

        {/* The diaphragm finishes the road: thorax above, abdomen below, the canals shut. */}
        <g className={`road-dia ${dia}`} {...act('diafragma', 'diafragma-eraketa')}>
          <title>Diafragma: septum transversuma, mintz pleuroperitonealak, hestegorri inguruko mesenkima eta gorputz paretako mesodermoa</title>
          <path d={`M${PE.x - 6},${H - 54} Q${(PE.x + W) / 2},${H - 78} ${W - 4},${H - 54}`} style={{ stroke: colorOf('diafragma') }} className="road-dome" />
          <text x={W - 4} y={H - 30} textAnchor="end" className="road-t1">
            Diafragma · 5. a.
          </text>
          <text x={W - 4} y={H - 16} textAnchor="end" className="road-t2">
            4 osagai
          </text>
        </g>
        <text x={4} y={H - 4} className="road-foot">
          Torax barrunbea gainean · peritoneoa azpian
        </text>
      </svg>
    </section>
  );
}
