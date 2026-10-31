'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  CHANGES,
  FATES,
  GONE,
  ORIGINS,
  PICKS,
  PITFALLS,
  SEG,
  SEGS,
  STAGES,
  STAGE_COUNT,
  TABLE,
  aliveAt,
  lifeAt,
  nameAt,
  originText,
  partsOf,
  type FateId,
  type Pick,
  type Seg,
} from '@/content/eratorriak/arteries';
import { CARDS12 } from '@/content/eratorriak/cards12';
import { ArchLadder, colourOf, type ColourMode } from './ArchLadder';
import { Arch3D } from './Arch3D';
import { BRANCH_GROUPS, BranchesFigure, NervesFigure, UMB_STEPS, UmbilicalFigure, type BranchGroup } from './figures12';
import { Flashcards } from './Flashcards';
import styles from './eratorriak.module.css';

/**
 * Topic 12 study room on the Eratorriak page. The arterial system is easy to get lost in: many pieces,
 * each changing name as it develops. The room is built around one idea: every piece keeps its colour
 * (its origin) from the 4th week to the adult, so a student can follow it. A time diagram and the 3D
 * model show the same pieces; tables, "where does this adult artery come from" cards, the list of what
 * disappears, the nerves, the aorta's branches, the umbilical arteries and flashcards go around it.
 */

const SECTIONS = [
  ['a12-mapa', 'Mapa'],
  ['a12-denbora', 'Arkuak denboran'],
  ['a12-taula', 'Taula'],
  ['a12-helduak', 'Arteria helduak'],
  ['a12-desagertu', 'Desagertzen direnak'],
  ['a12-nerbioak', 'Nerbio atzerakariak'],
  ['a12-adarrak', 'Beheranzko aorta'],
  ['a12-zilborra', 'Zilborra eta iliakoak'],
  ['a12-nahasketak', 'Nahasketak'],
  ['a12-fitxak', 'Fitxak'],
  // Blocks that follow the room in the same topic tab.
  ['a12-laburrak', 'Taula laburrak'],
  ['a12-eskemak', 'Eskemak'],
] as const;

/** The adult arteries, in the order the aorta meets them, with the pieces each is made of. */
const COMPOSITES: { fate: FateId; both?: boolean; parts: Seg[] }[] = (
  [
    ['goranzko-aorta', false],
    ['birika-enborra', false],
    ['aortaren-makoa', false],
    ['enbor-brakiozefalikoa', false],
    ['karotida-komuna', true],
    ['barneko-karotida', true],
    ['kanpoko-karotida', true],
    ['eskuineko-subklabioa', false],
    ['ezkerreko-subklabioa', false],
    ['beheranzko-aorta', false],
    ['birika-arteriak', true],
    ['hodi-arteriosoa', false],
    ['arteria-maxilarra', true],
    ['hioide-ointoki', true],
  ] as const
).map(([fate, both]) => {
  let parts = partsOf(fate).filter((s) => s.key !== 'asc-aorta' && s.key !== 'pulm-trunk');
  if (fate === 'birika-enborra') parts = [SEG.get('truncus')!];
  if (both) parts = parts.filter((s) => s.side !== 'L');
  return { fate, both, parts };
});

/** A piece's part name inside its artery ("hasierako atala"), from its fate text. */
const partName = (s: Seg) => (s.fateText.includes('·') ? s.fateText.split('·')[1].trim() : s.key === 'truncus' ? 'trenkadaz banatua (erdi bat)' : s.key === 'sac' ? 'goranzko aorta' : '');

export function Topic12Study() {
  const [stage, setStage] = useState(0);
  const [mode, setMode] = useState<ColourMode>('origin');
  const [labels, setLabels] = useState(true);
  const [focus, setFocus] = useState<string | null>(null);
  const [pick, setPick] = useState<Pick | null>(null);
  const [lineKeys, setLineKeys] = useState<string[] | null>(null);
  const [hover, setHover] = useState<string | null>(null);
  const [show3d, setShow3d] = useState(true);
  const [big, setBig] = useState(false);
  const [names3d, setNames3d] = useState<'aldaketak' | 'guztiak' | 'gabe'>('aldaketak');
  const [nerves, setNerves] = useState(false);
  const [playing, setPlaying] = useState(false);
  const timeline = useRef<HTMLDivElement>(null);

  const go = (n: number) => setStage(Math.max(0, Math.min(STAGE_COUNT - 1, n)));

  // Play: one moment every 3.4 s, stopping at the adult.
  useEffect(() => {
    if (!playing || stage >= STAGE_COUNT - 1) return;
    const id = window.setTimeout(() => {
      setStage(stage + 1);
      if (stage + 1 >= STAGE_COUNT - 1) setPlaying(false);
    }, 3400);
    return () => window.clearTimeout(id);
  }, [playing, stage]);

  useEffect(() => {
    if (!big) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setBig(false);
      if (e.key === 'ArrowRight') setStage((s) => Math.min(STAGE_COUNT - 1, s + 1));
      if (e.key === 'ArrowLeft') setStage((s) => Math.max(0, s - 1));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [big]);

  const focusSeg = focus ? SEG.get(focus) : undefined;
  // What is lit: a picked structure, a line of "what changes", or a piece with the rest of its artery.
  const lit = useMemo(() => {
    if (pick) return new Set(pick.keys);
    if (lineKeys?.length) return new Set(lineKeys);
    if (focusSeg) {
      if (focusSeg.fate === 'gone') return new Set([focusSeg.key]);
      const side = focusSeg.side === 'C' ? undefined : focusSeg.side;
      const same = SEGS.filter((s) => s.fate === focusSeg.fate && (s.side === side || s.side === 'C' || !side) && s.key !== 'asc-aorta' && s.key !== 'pulm-trunk').map((s) => s.key);
      return new Set([focusSeg.key, ...same]);
    }
    return new Set<string>();
  }, [pick, lineKeys, focusSeg]);

  const choose = (p: Pick | null) => {
    setPick(p);
    setFocus(null);
    setLineKeys(null);
    // Not there at this moment (not yet, or already gone): go to the moment it is best seen at.
    if (p && !p.keys.some((k) => aliveAt(SEG.get(k)!, stage))) go(p.stage);
    if (p) setShow3d(true);
  };
  const pickSeg = (key: string) => {
    setPick(null);
    setLineKeys(null);
    setFocus((f) => (f === key ? null : key));
  };
  /** From anywhere on the page: light pieces at a moment and bring the timeline into view. */
  const showInTimeline = (keys: string[], at: number) => {
    setPick(null);
    setFocus(keys.length === 1 ? keys[0] : null);
    setLineKeys(keys.length === 1 ? null : keys);
    go(at);
    timeline.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const view3d = show3d && <Arch3D stage={stage} lit={lit} names={names3d} nerves={nerves} big={big} onBig={() => setBig((b) => !b)} />;

  return (
    <section className={styles.room} aria-labelledby="a12-title">
      <header className={styles.roomHead}>
        <p className={styles.eyebrow}>12. gaia · Ikasgela</p>
        <h2 id="a12-title">Arteria sistema: arteria bakoitza nondik dator?</h2>
        <p className={styles.lead}>
          Gako bakarra: <b>pieza bakoitzak bere kolorea gordetzen du</b> 4. astetik heldura arte. Kolore batek jatorria esaten du (zein arku, aorta dortsala, 7. segmentu artekoa…); eskeman eta 3D ereduan pieza berak dira. Izenak aldatzen dira, kolorea ez.
        </p>
        <nav className={styles.subnav} aria-label="Ikasgelaren atalak">
          {SECTIONS.map(([id, label], i) => (
            <a key={id} href={`#${id}`}>
              <b>{i + 1}</b>
              {label}
            </a>
          ))}
        </nav>
      </header>

      {/* ——— 1. overview ——— */}
      <section id="a12-mapa" className={styles.block}>
        <h3 className={styles.h3}>
          <b>1</b> Mapa orokorra: hiru multzo
        </h3>
        <div className={styles.overview}>
          <article>
            <span className={styles.ovNum}>A</span>
            <h4>Arku sistema</h4>
            <p className={styles.ovWhere}>Lepoa eta toraxa · apunteak 2–2.4</p>
            <p>
              Aorta zakua + <b>6 aorta arku bikote</b> + <b>2 aorta dortsal</b> (+ 7. segmentu artekoak). Pieza batzuk geratzen dira, beste batzuk desagertzen.
            </p>
            <p className={styles.ovOut}>→ aorta (goranzkoa, makoa, beheranzkoa), enbor brakiozefalikoa, karotidak, subklabioak, birika arteriak, hodi arteriosoa</p>
            <a href="#a12-denbora" className={styles.linkBtn}>
              Arkuak denboran →
            </a>
          </article>
          <article>
            <span className={styles.ovNum}>B</span>
            <h4>Beheranzko aortaren adarrak</h4>
            <p className={styles.ovWhere}>Toraxa eta abdomena · 2.5</p>
            <p>
              Hiru norabide: <b>aurrera</b> (hestea), <b>albora</b> (abdomeneko erraiak), <b>atze-albora</b> (segmentu artekoak, maila guztietan).
            </p>
            <p className={styles.ovOut}>→ enbor zeliakoa, mesenterikoak, giltzurrun arteriak, gonadalak, saihets artekoak, lunbarrak…</p>
            <a href="#a12-adarrak" className={styles.linkBtn}>
              Adarrak →
            </a>
          </article>
          <article>
            <span className={styles.ovNum}>C</span>
            <h4>Zilbor arteriak eta iliakoak</h4>
            <p className={styles.ovWhere}>Pelbisa · 2.6 (gorputz adarrak 2.7: ez da jakin beharra)</p>
            <p>
              Zilborreko arteriak aortatik irten, gero <b>barneko iliakoarekin</b> konektatu; jaio ondoren lotailu.
            </p>
            <p className={styles.ovOut}>→ iliako primitiboak, kanpoko iliakoa → femorala, barneko iliakoa, goiko gernu maskuriaren arteria, erdialdeko zilbor lotailua</p>
            <a href="#a12-zilborra" className={styles.linkBtn}>
              Zilborra →
            </a>
          </article>
        </div>
        <ol className={styles.howto}>
          <li>
            <b>Koloreak ikasi</b> (jatorria): zakua, 1.–6. arkuak, aorta dortsala, 7. segm.
          </li>
          <li>
            <b>Denboran jarraitu</b>: 6 uneak, zer agertzen eta zer desagertzen den.
          </li>
          <li>
            <b>Alderantziz</b>: arteria heldu bakoitza, zein piezatatik.
          </li>
          <li>
            <b>Fitxekin errepasatu</b>, eguneroko saio laburrak.
          </li>
        </ol>
      </section>

      {/* ——— 2. the timeline ——— */}
      <section id="a12-denbora" className={styles.block} ref={timeline}>
        <h3 className={styles.h3}>
          <b>2</b> Arkuak denboran: eskema + 3D
        </h3>
        <p className={styles.blockLead}>
          Eskemak beti leku berean marrazten ditu pieza guztiak: urrats bakoitzean ikusi zer agertzen den, zer mehetzen den (endekatzen) eta zer desagertzen den (itzal argia). Sakatu pieza bat: zer den, zer bihurtzen den eta zein arteriaren zatia den. 3D ereduak forma erreala erakusten du (bihotzaren jaitsiera, ezkerreko subklabioaren igoera).
        </p>

        <div className={styles.stageBar}>
          <button type="button" className={styles.iconBtn} onClick={() => go(stage - 1)} disabled={stage === 0} aria-label="Aurreko unea">
            ←
          </button>
          <div
            className={styles.stages}
            role="tablist"
            aria-label="Uneak"
            onKeyDown={(e) => {
              if (e.key === 'ArrowRight') go(stage + 1);
              if (e.key === 'ArrowLeft') go(stage - 1);
            }}
          >
            {STAGES.map((s, i) => (
              <button key={s.id} role="tab" aria-selected={stage === i} tabIndex={stage === i ? 0 : -1} className={`${styles.stageBtn}${stage === i ? ` ${styles.on}` : ''}${i < stage ? ` ${styles.past}` : ''}`} onClick={() => go(i)}>
                <b>{i + 1}</b>
                <span>
                  {s.title}
                  <small>{s.when}</small>
                </span>
              </button>
            ))}
          </div>
          <button type="button" className={styles.iconBtn} onClick={() => go(stage + 1)} disabled={stage === STAGE_COUNT - 1} aria-label="Hurrengo unea">
            →
          </button>
          <button
            type="button"
            className={`${styles.btn}${playing ? ` ${styles.on}` : ''}`}
            onClick={() => {
              if (!playing && stage === STAGE_COUNT - 1) setStage(0);
              setPlaying((p) => !p);
            }}
          >
            {playing ? '❚❚ Gelditu' : '▶ Erreproduzitu'}
          </button>
        </div>

        <div className={styles.tools}>
          <div className={styles.seg2} role="group" aria-label="Kolorea">
            <span>Kolorea</span>
            <button aria-pressed={mode === 'origin'} className={mode === 'origin' ? styles.on : ''} onClick={() => setMode('origin')} title="Kolore bakoitza = nondik datorren">
              Jatorria
            </button>
            <button aria-pressed={mode === 'fate'} className={mode === 'fate' ? styles.on : ''} onClick={() => setMode('fate')} title="Kolore bakoitza = zein arteria heldu bihurtzen den">
              Eratorria
            </button>
          </div>
          <div className={styles.seg2} role="group" aria-label="Izenak">
            <span>Izenak</span>
            <button aria-pressed={labels} className={labels ? styles.on : ''} onClick={() => setLabels(true)}>
              Bai
            </button>
            <button aria-pressed={!labels} className={!labels ? styles.on : ''} onClick={() => setLabels(false)} title="Izenik gabe: zeure burua probatu">
              Proba
            </button>
          </div>
          <div className={styles.seg2} role="group" aria-label="3D eredua">
            <span>3D</span>
            <button aria-pressed={show3d} className={show3d ? styles.on : ''} onClick={() => setShow3d(true)}>
              Ondoan
            </button>
            <button aria-pressed={!show3d} className={!show3d ? styles.on : ''} onClick={() => setShow3d(false)}>
              Ezkutatu
            </button>
          </div>
          <Link className={styles.linkBtn} href={`/astea/12?etapa=${STAGES[stage].sim}`}>
            Simulagailuan ({STAGES[stage].title}) →
          </Link>
        </div>

        <div className={styles.explore}>
          <span className={styles.exploreK}>Esploratu egitura bat:</span>
          {(['enbrioia', 'heldua'] as const).map((g) => (
            <div key={g} className={styles.pickRow}>
              <small>{g === 'enbrioia' ? 'Enbrioian' : 'Helduan'}</small>
              {PICKS.filter((p) => p.group === g).map((p) => (
                <button key={p.id} type="button" aria-pressed={pick?.id === p.id} className={`${styles.pick}${pick?.id === p.id ? ` ${styles.on}` : ''}`} onClick={() => choose(pick?.id === p.id ? null : p)}>
                  {p.label}
                </button>
              ))}
            </div>
          ))}
        </div>

        <div className={`${styles.timeline}${show3d ? '' : ` ${styles.timelineSolo}`}`}>
          <div className={styles.ladderBox}>
            <ArchLadder stage={stage} mode={mode} lit={lit} focus={focus} hover={hover} labels={labels} onPick={pickSeg} onHover={setHover} />
            <p className={styles.ladderNote}>Aurretik ikusita: enbrioiaren eskuina zure ezkerrean (apunteetako irudietan bezala).</p>
            <Legend mode={mode} stage={stage} />
          </div>
          <div className={styles.side}>
            {show3d && !big && (
              <div className={styles.side3d}>
                {view3d}
                <div className={styles.tools3d}>
                  <div className={styles.seg2} role="group" aria-label="3D izenak">
                    <span>Izenak</span>
                    {(['aldaketak', 'guztiak', 'gabe'] as const).map((n) => (
                      <button key={n} aria-pressed={names3d === n} className={names3d === n ? styles.on : ''} onClick={() => setNames3d(n)}>
                        {n === 'aldaketak' ? 'Aldaketak' : n === 'guztiak' ? 'Guztiak' : 'Gabe'}
                      </button>
                    ))}
                  </div>
                  <button type="button" aria-pressed={nerves} className={`${styles.pick}${nerves ? ` ${styles.on}` : ''}`} onClick={() => setNerves((v) => !v)}>
                    Nerbio bagoak
                  </button>
                </div>
              </div>
            )}
            {focusSeg || pick ? (
              <Info seg={focusSeg} pick={pick} stage={stage} mode={mode} onSeg={pickSeg} onClose={() => (setFocus(null), setPick(null))} />
            ) : (
              <div className={styles.changes}>
                <h4>
                  {stage + 1}. unea · {STAGES[stage].title} <small>apunteak {STAGES[stage].sec}</small>
                </h4>
                <ul>
                  {CHANGES[stage].map((c, i) => (
                    <li key={i}>
                      <button
                        type="button"
                        className={lineKeys && c.keys.length && lineKeys.join() === c.keys.join() ? styles.on : ''}
                        onPointerEnter={() => c.keys.length && setLineKeys(c.keys)}
                        onPointerLeave={() => setLineKeys(null)}
                        onFocus={() => c.keys.length && setLineKeys(c.keys)}
                        onBlur={() => setLineKeys(null)}
                      >
                        {c.text}
                      </button>
                    </li>
                  ))}
                </ul>
                <p className={styles.hint}>Pasatu sagua lerro baten gainetik: haren piezak argitzen dira eskeman eta 3Dn.</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ——— 3. table ——— */}
      <section id="a12-taula" className={styles.block}>
        <h3 className={styles.h3}>
          <b>3</b> Taula: jatorria → eratorria
        </h3>
        <ArchTable onShow={(keys) => showInTimeline(keys, STAGE_COUNT - 1)} />
      </section>

      {/* ——— 4. adult arteries ——— */}
      <section id="a12-helduak" className={styles.block}>
        <h3 className={styles.h3}>
          <b>4</b> Arteria helduak: zein piezaz eginda?
        </h3>
        <p className={styles.blockLead}>Alderantziz irakurrita: arteria heldu bakoitza, bere piezen koloreekin (jatorria). Pieza bat baino gehiago dituztenak dira nahasgarrienak.</p>
        <div className={styles.composites}>
          {COMPOSITES.map(({ fate, both, parts }) => {
            const f = FATES[fate];
            return (
              <button key={fate} type="button" className={styles.composite} onClick={() => showInTimeline(parts.map((p) => p.key), STAGE_COUNT - 1)}>
                <span className={styles.compHead}>
                  <i style={{ background: f.color }} />
                  <b>{f.name}</b>
                  {both && <small>bi aldeetan</small>}
                  {parts.length > 1 && <em>{parts.length} zati</em>}
                </span>
                <span className={styles.bar}>
                  {parts.map((p) => (
                    <span key={p.key} style={{ background: ORIGINS[p.origin].color, flexGrow: 1 }}>
                      {p.key === 'truncus' ? 'Enbor art.' : ORIGINS[p.origin].short}
                    </span>
                  ))}
                </span>
                <span className={styles.compParts}>
                  {parts.map((p) => (
                    <span key={p.key}>
                      <i style={{ background: ORIGINS[p.origin].color }} />
                      <span>
                        {p.key === 'sac' || p.key === 'truncus' ? p.emb : originText(p)}
                        {partName(p) && <em> → {partName(p)}</em>}
                      </span>
                    </span>
                  ))}
                </span>
                <span className={styles.compHook}>{f.hook}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* ——— 5. what disappears ——— */}
      <section id="a12-desagertu" className={styles.block}>
        <h3 className={styles.h3}>
          <b>5</b> Desagertzen direnak (eta zergatik axola duen)
        </h3>
        <ol className={styles.gone}>
          {GONE.map((g) => (
            <li key={g.what}>
              <div>
                <b>{g.what}</b>
                <small>{g.when}</small>
                <p>{g.why}</p>
              </div>
              <button type="button" className={styles.linkBtn} onClick={() => showInTimeline(g.keys, g.stage)}>
                Eskeman ikusi →
              </button>
            </li>
          ))}
          <li>
            <div>
              <b>Hodi arteriosoa ez da desagertzen: lotailu bihurtzen da</b>
              <small>Jaio ondoren</small>
              <p>Lotailu arteriosoa. Zilborreko arterien urrutiko atala ere lotailu bihurtzen da (erdialdeko zilbor lotailua).</p>
            </div>
            <button type="button" className={styles.linkBtn} onClick={() => showInTimeline(['a6dL'], 5)}>
              Eskeman ikusi →
            </button>
          </li>
        </ol>
      </section>

      {/* ——— 6. nerves ——— */}
      <section id="a12-nerbioak" className={styles.block}>
        <h3 className={styles.h3}>
          <b>6</b> Nerbio laringeo atzerakariak: zergatik ez dira simetrikoak
        </h3>
        <p className={styles.blockLead}>Nerbio bagoaren (X) adarrak, laringeko muskuluetara (IV. eta VI. arkuetakoak). Laringetik behera jaitsi gabe ezin dira igo arkua inguratu gabe: arkuek aldatzean, nerbioek ere aldatzen dute.</p>
        <NervesFigure
          onShow3D={() => {
            setNerves(true);
            setShow3d(true);
            showInTimeline(['a4R', 'a6dL', 'a6dR'], STAGE_COUNT - 1);
          }}
        />
      </section>

      {/* ——— 7. descending aorta ——— */}
      <section id="a12-adarrak" className={styles.block}>
        <h3 className={styles.h3}>
          <b>7</b> Beheranzko aortaren adarrak
        </h3>
        <Branches />
      </section>

      {/* ——— 8. umbilical and iliac ——— */}
      <section id="a12-zilborra" className={styles.block}>
        <h3 className={styles.h3}>
          <b>8</b> Zilborreko arteriak eta iliakoak
        </h3>
        <Umbilical />
        <details className={styles.limbs}>
          <summary>
            Gorputz adarren arteriak <small>apunteak 2.7 · ez da jakin beharra</small>
          </summary>
          <p>
            <b>Jakin beharrekoa:</b> gorputz adarretako hasierako ardatz arteriek bertaraino iritsitako arteria subklabioekin (goian) edo kanpoko arteria iliakoarekin (behean) kontaktatzen dute.
          </p>
          <p>Goian: ardatz arteriatik arteria brakiala, hezur artekoa, eskuaurreko arku sakona, kubitala, erradiala… Subklabioek konektatu bakarrik egiten dute; ez dira haietatik eratortzen.</p>
          <p>Behean: ardatz arteria barneko iliakoarekin elkartzen da eta hortik gutxi garatzen dira (ziatikoa, popliteoa, peroneoaren zati bat); gehienak arteria femoraletik.</p>
        </details>
      </section>

      {/* ——— 9. pitfalls ——— */}
      <section id="a12-nahasketak" className={styles.block}>
        <h3 className={styles.h3}>
          <b>9</b> Ohiko nahasketak
        </h3>
        <div className={styles.pitfalls}>
          {PITFALLS.map((p) => (
            <article key={p.wrong}>
              <p className={styles.wrong}>
                <span aria-hidden>✗</span> {p.wrong}
              </p>
              <p className={styles.right}>
                <span aria-hidden>✓</span> {p.right}
              </p>
              {p.keys && (
                <button type="button" className={styles.linkBtn} onClick={() => showInTimeline(p.keys!, STAGE_COUNT - 1)}>
                  Eskeman ikusi →
                </button>
              )}
            </article>
          ))}
        </div>
      </section>

      {/* ——— 10. flashcards ——— */}
      <section id="a12-fitxak" className={styles.block}>
        <h3 className={styles.h3}>
          <b>10</b> Fitxak (errepasoa)
        </h3>
        <p className={styles.blockLead}>Galdera irakurri, erantzuna buruan esan, eta biratu. &quot;Ez nekien&quot; sakatuz gero, fitxa saio berean itzuliko da. Zure aurrerapena nabigatzaile honetan gordetzen da.</p>
        <Flashcards cards={CARDS12} />
      </section>

      {big &&
        show3d &&
        createPortal(
          <div className={styles.bigOverlay} role="dialog" aria-modal="true" aria-label="3D eredua handituta">
            <div className={styles.bigBar}>
              <div className={styles.stages}>
                {STAGES.map((s, i) => (
                  <button key={s.id} className={`${styles.stageBtn}${stage === i ? ` ${styles.on}` : ''}`} onClick={() => go(i)}>
                    <b>{i + 1}</b>
                    <span>{s.title}</span>
                  </button>
                ))}
              </div>
              <div className={styles.seg2} role="group" aria-label="3D izenak">
                <span>Izenak</span>
                {(['aldaketak', 'guztiak', 'gabe'] as const).map((n) => (
                  <button key={n} aria-pressed={names3d === n} className={names3d === n ? styles.on : ''} onClick={() => setNames3d(n)}>
                    {n === 'aldaketak' ? 'Aldaketak' : n === 'guztiak' ? 'Guztiak' : 'Gabe'}
                  </button>
                ))}
              </div>
              <button type="button" aria-pressed={nerves} className={`${styles.pick}${nerves ? ` ${styles.on}` : ''}`} onClick={() => setNerves((v) => !v)}>
                Nerbio bagoak
              </button>
            </div>
            <div className={styles.bigPicks}>
              {PICKS.map((p) => (
                <button key={p.id} type="button" aria-pressed={pick?.id === p.id} className={`${styles.pick}${pick?.id === p.id ? ` ${styles.on}` : ''}`} onClick={() => choose(pick?.id === p.id ? null : p)}>
                  {p.label}
                </button>
              ))}
            </div>
            <div className={styles.bigView}>{view3d}</div>
          </div>,
          document.body,
        )}
    </section>
  );
}

/** The colour key under the diagram: origins, or the adult arteries. */
function Legend({ mode, stage }: { mode: ColourMode; stage: number }) {
  if (mode === 'origin')
    return (
      <ul className={styles.legend} aria-label="Kolorea = jatorria">
        {Object.entries(ORIGINS).map(([id, o]) => (
          <li key={id}>
            <i style={{ background: o.color }} />
            {o.name}
          </li>
        ))}
        <li>
          <i className={styles.legendGhost} />
          desagertua
        </li>
      </ul>
    );
  const shown = new Set(SEGS.filter((s) => lifeAt(s, stage) > 0).map((s) => s.fate));
  return (
    <ul className={styles.legend} aria-label="Kolorea = eratorria">
      {Object.values(FATES)
        .filter((f) => shown.has(f.id))
        .map((f) => (
          <li key={f.id}>
            <i style={{ background: f.color }} />
            {f.name}
          </li>
        ))}
      <li>
        <i style={{ background: '#77737f' }} />
        desagertuko da
      </li>
    </ul>
  );
}

const LIFE_WORD = ['ez dago', 'badago', 'endekatzen', 'desagertua'] as const;

/** The picked piece (or structure): where it comes from, what it becomes, the artery it is part of. */
function Info({ seg, pick, stage, mode, onSeg, onClose }: { seg?: Seg; pick: Pick | null; stage: number; mode: ColourMode; onSeg: (k: string) => void; onClose: () => void }) {
  if (pick && !seg) {
    const segs = pick.keys.map((k) => SEG.get(k)!).filter(Boolean);
    const fate = pick.group === 'heldua' ? (FATES as Record<string, (typeof FATES)[FateId]>)[pick.id] : undefined;
    return (
      <div className={styles.info}>
        <button type="button" className={styles.infoClose} onClick={onClose} aria-label="Itxi">
          ×
        </button>
        <p className={styles.eyebrow}>{pick.group === 'enbrioia' ? 'Enbrioiko egitura' : 'Arteria heldua'}</p>
        <h4>{pick.label}</h4>
        {fate && <p className={styles.infoHook}>{fate.hook}</p>}
        <ul className={styles.infoParts}>
          {segs.map((s) => (
            <li key={s.key}>
              <button type="button" onClick={() => onSeg(s.key)}>
                <i style={{ background: colourOf(s, mode) }} />
                <span>
                  {s.emb}
                  {s.side !== 'C' && <small> · {s.side === 'R' ? 'eskuina' : 'ezkerra'}</small>}
                  <em>{s.fate === 'gone' ? 'desagertzen da' : `→ ${s.late && stage >= s.late.from ? s.late.text : s.fateText}`}</em>
                </span>
              </button>
            </li>
          ))}
        </ul>
        <p className={styles.hint}>Biratu 3D eredua arrastatuz; aldatu unea goian, nola aldatzen den ikusteko.</p>
      </div>
    );
  }
  if (!seg) return null;
  const parts = seg.fate === 'gone' ? [] : SEGS.filter((s) => s.fate === seg.fate && (s.side === seg.side || s.side === 'C' || seg.side === 'C') && s.key !== 'asc-aorta' && s.key !== 'pulm-trunk');
  const fate = seg.fate === 'gone' ? null : FATES[seg.fate];
  return (
    <div className={styles.info}>
      <button type="button" className={styles.infoClose} onClick={onClose} aria-label="Itxi">
        ×
      </button>
      <p className={styles.eyebrow}>Pieza hautatua · apunteak {seg.sec}</p>
      <div className={styles.flow}>
        <span className={styles.flowFrom}>
          <i style={{ background: ORIGINS[seg.origin].color }} />
          <span>
            <small>Jatorria</small>
            {seg.emb}
            {seg.side !== 'C' && <em> ({seg.side === 'R' ? 'eskuinekoa' : 'ezkerrekoa'})</em>}
          </span>
        </span>
        <span className={styles.flowArrow} aria-hidden>
          ↓
        </span>
        <span className={styles.flowTo}>
          <i style={{ background: fate?.color ?? '#77737f' }} />
          <span>
            <small>{seg.fate === 'gone' ? 'Patua' : 'Eratorria'}</small>
            {seg.fateText}
            {seg.late && <em> · gero: {seg.late.text}</em>}
          </span>
        </span>
      </div>
      <p className={styles.infoNow}>
        Orain ({STAGES[stage].title}): <b>{nameAt(seg, stage)}</b> — {LIFE_WORD[lifeAt(seg, stage)]}
      </p>
      <div className={styles.lifeRow} aria-label="Bizitza uneka">
        {STAGES.map((s, i) => (
          <span key={s.id} data-life={lifeAt(seg, i)} className={i === stage ? styles.lifeNow : ''} title={`${s.title}: ${LIFE_WORD[lifeAt(seg, i)]}`}>
            {i + 1}
          </span>
        ))}
      </div>
      {fate && parts.length > 1 && (
        <>
          <p className={styles.infoK}>{fate.name}: {parts.length} zati</p>
          <ul className={styles.infoParts}>
            {parts.map((p) => (
              <li key={p.key}>
                <button type="button" className={p.key === seg.key ? styles.on : ''} onClick={() => onSeg(p.key)}>
                  <i style={{ background: ORIGINS[p.origin].color }} />
                  <span>
                    {originText(p)}
                    {partName(p) && <em> → {partName(p)}</em>}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
      {fate && <p className={styles.infoHook}>{fate.hook}</p>}
    </div>
  );
}

/** The table, with a self-test switch that hides the derivatives until tapped. */
function ArchTable({ onShow }: { onShow: (keys: string[]) => void }) {
  const [test, setTest] = useState(false);
  const [open, setOpen] = useState<ReadonlySet<string>>(new Set());
  const cell = (id: string, text: string) => {
    const hidden = test && !open.has(id);
    return hidden ? (
      <button type="button" className={styles.hiddenCell} onClick={() => setOpen((o) => new Set(o).add(id))}>
        ?
      </button>
    ) : (
      text
    );
  };
  return (
    <div className={styles.tableWrap}>
      <div className={styles.figBar}>
        <button type="button" className={`${styles.btn}${test ? ` ${styles.on}` : ''}`} aria-pressed={test} onClick={() => (setTest((t) => !t), setOpen(new Set()))}>
          {test ? 'Erantzunak erakutsi' : 'Proba modua: eratorriak ezkutatu'}
        </button>
        {test && <span className={styles.hint}>Sakatu ? bakoitza erantzuna ikusteko.</span>}
      </div>
      <table className={styles.table}>
        <thead>
          <tr>
            <th scope="col">Jatorria</th>
            <th scope="col">Eskuina</th>
            <th scope="col">Ezkerra</th>
            <th scope="col" aria-label="Eskeman" />
          </tr>
        </thead>
        <tbody>
          {TABLE.map((r) => (
            <tr key={r.label}>
              <th scope="row">
                <i style={{ background: ORIGINS[r.origin].color }} />
                {r.label}
              </th>
              {r.both ? (
                <td colSpan={2} className={styles.both}>
                  {cell(`${r.label}-b`, r.both)}
                  {r.note && <small>{r.note}</small>}
                </td>
              ) : (
                <>
                  <td>{cell(`${r.label}-r`, r.right)}</td>
                  <td>
                    {cell(`${r.label}-l`, r.left)}
                    {r.note && <small>{r.note}</small>}
                  </td>
                </>
              )}
              <td>
                <button type="button" className={styles.linkBtn} onClick={() => onShow(r.keys)} aria-label={`${r.label} eskeman ikusi`}>
                  Eskeman
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Branches() {
  const [group, setGroup] = useState<BranchGroup | null>(null);
  return (
    <div className={styles.branches}>
      <div className={styles.figCard}>
        <BranchesFigure group={group} onGroup={setGroup} />
        <p className={styles.figCaption}>Aorta zeharkako ebakian (aurrea goian). Sakatu talde bat. Bi aorta dortsalak torax mailatik behera fusionatuta daude: aorta bakarra, eta hortik hiru norabidetan adarrak.</p>
      </div>
      <div className={styles.branchCols}>
        {BRANCH_GROUPS.filter((g) => !group || g.id === group).map((g) => (
          <article key={g.id} style={{ ['--c' as string]: g.color }}>
            <h4>{g.title}</h4>
            <p>{g.what}</p>
            {g.levels.map((l) => (
              <div key={l.at} className={styles.level}>
                <b>{l.at}</b>
                <ul>
                  {l.items.map((it) => (
                    <li key={it}>{it}</li>
                  ))}
                </ul>
              </div>
            ))}
          </article>
        ))}
      </div>
    </div>
  );
}

function Umbilical() {
  const [step, setStep] = useState(0);
  return (
    <div className={styles.umb}>
      <div className={styles.figCard}>
        <UmbilicalFigure step={step} />
      </div>
      <div className={styles.umbSteps}>
        {UMB_STEPS.map((s, i) => (
          <button key={s.title} type="button" className={`${styles.umbStep}${step === i ? ` ${styles.on}` : ''}`} onClick={() => setStep(i)} aria-pressed={step === i}>
            <b>{s.title}</b>
            <span>{s.text}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
