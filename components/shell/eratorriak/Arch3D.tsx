'use client';

import { useEffect, useMemo, useRef, useState, useSyncExternalStore, createContext, useContext } from 'react';
import { Defs } from '@/components/kit/Defs';
import { SceneView } from '@/components/kit';
import { LabelScaleContext, SceneContext, UnderlayContext, type SceneContextValue, type Underlay } from '@/components/kit/context';
import { isSpace, nameOf, partsOf } from '@/content/registry';
import { CHANGES, SEGS, STAGE_COUNT, aliveAt, changedAt, items3Of, type Seg } from '@/content/eratorriak/arteries';
import { ModelView, orbit, type CalloutSpec } from '@/components/scenes/week10/Heart3D';
import { ADULT, AP0, arteryModel, type ArtOpts, type ArtPose } from '@/components/scenes/week12/arteries3d';
import { labelOf } from './ArchLadder';
import styles from './eratorriak.module.css';

/**
 * Topic 12's own 3D model of the arch system (the simulator's), on the Eratorriak page: one pose per
 * moment of the 2D diagram, morphing between them (arches thin away, the heart goes down into the
 * thorax), the picked pieces lit and named, free to turn with a drag. Item keys are the diagram's keys.
 */

/** The model's pose at each of the diagram's six moments (see STAGES). */
const POSES: ArtPose[] = (() => {
  const day29: ArtPose = { ...AP0, gone1: 1, gone2: 1, cranGone: 1, gone5: 1, split: 1, size34: 1, is7: 0 };
  const arches: ArtPose = { ...day29, eca: 1, r6dist: 0.6, is7: 1 };
  return [
    { ...AP0, is7: 0, pulm: 0 },
    { ...AP0, grow: [1, 1, 1, 0.85, 0.6, 0.85], gone1: 0.55, gone2: 0.55, cranGone: 0.45, gone5: 0.5, is7: 0 },
    day29,
    arches,
    { ...arches, r6dist: 1, ductCar: 0.6, rLow: 0.6, descend: 1, rHook: 1 },
    { ...ADULT, ligament: 1, size34: 1 },
  ];
})();

const CAMS = [
  { yaw: 16, elev: 8, dist: 16, target: [0, 0.4, 0.2] },
  { yaw: 16, elev: 8, dist: 12.5, target: [0, 1.6, 0.2] },
  { yaw: 16, elev: 8, dist: 12.5, target: [0, 1.4, 0.3] },
  { yaw: 16, elev: 8, dist: 13, target: [0, 1.2, 0.2] },
  { yaw: 16, elev: 8, dist: 15, target: [0, 0.4, 0.2] },
  { yaw: 16, elev: 8, dist: 15, target: [0, 0.4, 0.2] },
] as const;

const lerp = (a: number, b: number, k: number) => a + (b - a) * k;

function mixPose(a: ArtPose, b: ArtPose, k: number): ArtPose {
  const out = { ...a } as Record<string, unknown>;
  for (const key of Object.keys({ ...a, ...b }) as (keyof ArtPose)[]) {
    const x = a[key] ?? 0;
    const y = b[key] ?? 0;
    if (Array.isArray(x)) out[key] = (x as readonly number[]).map((v, i) => lerp(v, (y as readonly number[])[i], k));
    else out[key] = lerp(x as number, y as number, k);
  }
  return out as unknown as ArtPose;
}

/** The pose and camera at a moment that may lie between two (while the morph plays). */
function frameAt(u: number) {
  const i = Math.max(0, Math.min(STAGE_COUNT - 1, Math.floor(u)));
  const j = Math.min(STAGE_COUNT - 1, i + 1);
  const k = u - i;
  const e = k * k * (3 - 2 * k);
  const c0 = CAMS[i];
  const c1 = CAMS[j];
  const target: [number, number, number] = [0, 1, 2].map((n) => lerp(c0.target[n], c1.target[n], e)) as [number, number, number];
  return { pose: mixPose(POSES[i], POSES[j], e), camera: orbit(lerp(c0.yaw, c1.yaw, e), lerp(c0.elev, c1.elev, e), lerp(c0.dist, c1.dist, e), target) };
}

/** A 3D name for a piece: its diagram name, at its model point (paired points carry the side letter). */
function nameSpecs(segs: Seg[], stage: number): CalloutSpec[] {
  const out: CalloutSpec[] = [];
  const seen = new Set<string>();
  for (const s of segs) {
    if (!s.p3 || !aliveAt(s, stage)) continue;
    const l = labelOf(s, stage);
    const arch = /^a[1-6]/.test(s.key) && !l ? `${s.key[1]}. aorta arkua` : null;
    const text = l?.t ?? arch ?? s.emb;
    const sub = l?.sub;
    const dedupe = `${text}|${sub ?? ''}|${s.side}`;
    if (seen.has(dedupe)) continue;
    seen.add(dedupe);
    const p = s.side === 'C' || s.p3.endsWith('-R') || /birika-arteria$|hodi-arteriosoa$/.test(s.p3) ? s.p3 : `${s.p3}${s.side}`;
    out.push({ id: s.id3 ?? 'aorta-dortsalak', p, show: 1, text, sub, key: s.key, small: true });
  }
  // Two names alike on both sides (not an arch rung, whose number already pairs them): say which side.
  const twice = new Set(out.filter((c, i) => out.findIndex((d) => d.text === c.text) !== i).map((c) => c.text));
  for (const c of out) {
    const s = SEGS.find((x) => x.key === c.key)!;
    if (!twice.has(c.text) || s.side === 'C' || /^\d\. aorta arkua$/.test(c.text ?? '')) continue;
    const side = s.side === 'R' ? 'eskuinekoa' : 'ezkerrekoa';
    c.sub = c.sub ? `${c.sub} · ${side}` : side;
  }
  return out;
}

interface Live {
  u: number;
  lit: ReadonlySet<string>;
  names: 'aldaketak' | 'guztiak' | 'gabe';
  nerves: boolean;
}
const LiveContext = createContext<Live | null>(null);

/** The scene: reads the live state from context, so SceneView keeps one mounted scene (and its WebGL). */
function ArchScene() {
  const live = useContext(LiveContext)!;
  const { pose, camera } = frameAt(live.u);
  const stage = Math.round(live.u);
  const opts: ArtOpts = {
    heart: 1,
    pharynx: live.u < 2 ? 0.35 : 0,
    lungs: stage >= 1 && stage <= 3 ? 0.5 : 0,
    ghosts: 1,
    vagus: live.nerves ? 1 : 0,
    recurrent: live.nerves ? 1 : 0,
    superior: live.nerves ? 1 : 0,
  };
  const m = arteryModel(pose, opts);
  const any = live.lit.size > 0;
  const lit3 = new Set(SEGS.filter((s) => live.lit.has(s.key)).flatMap(items3Of));
  const items = any
    ? m.items.map((it) => {
        const key = it.key.replace(/^ghost-/, '');
        const on = lit3.has(key) || (live.nerves && it.tissue === 'nerve');
        return on ? it : { ...it, opacity: (it.opacity ?? 1) * 0.16 };
      })
    : m.items;
  // Named: the lit pieces; else what this moment's lines talk about (or everything there).
  const said = new Set([...CHANGES[stage].flatMap((c) => c.keys), ...(stage === 0 ? ['sac', 'truncus', 'daCranR', 'fused'] : [])]);
  const pick = live.names === 'gabe' ? [] : any ? SEGS.filter((s) => live.lit.has(s.key)) : live.names === 'guztiak' ? SEGS : SEGS.filter((s) => said.has(s.key) || changedAt(s, stage));
  const names = nameSpecs(pick, stage);
  if (live.nerves && live.names !== 'gabe')
    names.push(
      { id: 'eskuineko-nerbio-atzerakaria', p: 'eskuineko-nerbio-atzerakaria', show: 1, small: true },
      { id: 'ezkerreko-nerbio-atzerakaria', p: 'ezkerreko-nerbio-atzerakaria', show: 1, small: true },
    );
  return <ModelView model={{ items, pts: m.pts }} continuity="eratorriak-12" camera={camera} names={names} right={[60, 600]} />;
}

const noop = () => {};
const subscribeNothing = () => () => {};

export function Arch3D({
  stage,
  lit,
  names,
  nerves,
  big,
  onBig,
}: {
  stage: number;
  lit: ReadonlySet<string>;
  names: Live['names'];
  nerves: boolean;
  big?: boolean;
  onBig?: () => void;
}) {
  const mounted = useSyncExternalStore(subscribeNothing, () => true, () => false);
  const [host, setHost] = useState<HTMLDivElement | null>(null);
  const [sceneEl, setSceneEl] = useState<SVGGElement | null>(null);
  const [turn, setTurn] = useState<Underlay['orbitRequest']>(undefined);
  const box = useRef<HTMLDivElement>(null);
  const [k, setK] = useState(1.6);

  // The morph: the shown moment glides to the asked one.
  const [u, setU] = useState(stage);
  const uRef = useRef(stage);
  useEffect(() => {
    const from = uRef.current;
    const to = stage;
    if (from === to) return;
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const ms = reduce ? 1 : Math.min(1600, 700 + 260 * Math.abs(to - from));
    let raf = 0;
    const t0 = performance.now();
    const step = (now: number) => {
      const p = Math.min(1, (now - t0) / ms);
      const v = from + (to - from) * p;
      uRef.current = v;
      setU(v);
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [stage]);

  // Names stay as readable as the page's text, whatever the drawing's size.
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setK(Math.min(2.4, Math.max(1, (0.92 * 1000) / Math.max(1, el.clientWidth)))));
    ro.observe(el);
    return () => ro.disconnect();
  }, [big]);

  const underlay = useMemo<Underlay | null>(() => (host ? { host, scene: sceneEl, zoomed: false, orbitRequest: turn } : null), [host, sceneEl, turn]);
  const ctx: SceneContextValue = { selected: null, hovered: null, focus: [], showLabels: true, quiz: false, quizFlash: null, nameOf, isSpace, partsOf, onSelect: noop, onHover: noop };
  const live: Live = { u, lit, names, nerves };
  const ask = (direction: NonNullable<Underlay['orbitRequest']>['direction']) => setTurn((t) => ({ direction, serial: (t?.serial ?? 0) + 1 }));

  return (
    <div className={`${styles.view3d}${big ? ` ${styles.view3dBig}` : ''}`} ref={box}>
      <div ref={setHost} className={styles.underlay} aria-hidden />
      <svg viewBox="0 0 1000 640" preserveAspectRatio="xMidYMid meet" className={styles.svg3d} role="img" aria-label="Aorta arkuen 3D eredua: arrastatu biratzeko">
        <Defs />
        <g ref={setSceneEl}>
          {mounted && (
            <SceneContext.Provider value={ctx}>
              <UnderlayContext.Provider value={underlay}>
                <LabelScaleContext.Provider value={{ k, left: false, right: false }}>
                  <LiveContext.Provider value={live}>
                    <SceneView Scene={ArchScene} t={0} reduced={false} />
                  </LiveContext.Provider>
                </LabelScaleContext.Provider>
              </UnderlayContext.Provider>
            </SceneContext.Provider>
          )}
        </g>
      </svg>
      <div className={styles.turnKeys}>
        <button type="button" onClick={() => ask('left')} aria-label="Biratu ezkerrera" title="Biratu">
          ⟲
        </button>
        <button type="button" onClick={() => ask('reset')} title="Aurretik ikusi (hasierako ikuspegia)">
          Aurretik
        </button>
        <button type="button" onClick={() => ask('right')} aria-label="Biratu eskuinera" title="Biratu">
          ⟳
        </button>
        {onBig && (
          <button type="button" onClick={onBig} title={big ? 'Itxi (Esc)' : 'Handitu'} aria-pressed={!!big}>
            {big ? 'Itxi' : 'Handitu'}
          </button>
        )}
      </div>
    </div>
  );
}
