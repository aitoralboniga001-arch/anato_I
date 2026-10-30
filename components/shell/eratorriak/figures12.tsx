'use client';

import { useState, type ReactNode } from 'react';
import { ORIGINS } from '@/content/eratorriak/arteries';
import styles from './eratorriak.module.css';

/**
 * Topic 12's smaller figures on the Eratorriak page: the recurrent laryngeal nerves (right vs left,
 * embryo vs adult), the descending aorta's three branch groups in a cross-section, and the umbilical and
 * iliac arteries in three steps. Same colours as the arch diagram and the 3D model.
 */

const NERVE = '#facc15';
const GHOST = '#d8d2e6';

// ———————————————————————————— recurrent laryngeal nerves (notes 2.4) ————————————————————————————

/** One side: the vagus going down laterally, the 4th and 6th arches, the recurrent branch hooking under one. */
function NerveSide({ side, adult }: { side: 'R' | 'L'; adult: boolean }) {
  // Drawn for the right side (vagus on the left, the larynx towards the middle on the right); the left mirrors.
  // The names sit between the vagus (V) and the recurrent branch going up (RX), so no nerve crosses a name.
  const W = 340;
  const V = 56;
  const RX = 270;
  const MID = (V + RX) / 2;
  const m = (x: number) => (side === 'R' ? x : W - x);
  const hook6 = side === 'L' || !adult;
  const y4 = 124;
  const y6 = 214;
  const hy = hook6 ? y6 + 22 : y4 + 22;
  const six = side === 'R' ? (adult ? 'gone' : 'on') : 'on';
  const sixName: [string, string] = side === 'L' ? (adult ? ['Lotailu arteriosoa', '6. urrutikoa'] : ['Hodi arteriosoa', '6. urrutikoa']) : adult ? ['6. urrutikoa', 'desagertua'] : ['6. arkua', 'urrutikoa'];
  const fourName: [string, string] = side === 'R' ? (adult ? ['Eskuineko subklabioa', '4. arkua'] : ['4. arkua', 'gero: eskuineko subklabioa']) : adult ? ['Aortaren makoa', '4. arkua'] : ['4. arkua', 'gero: aortaren makoa'];
  const path = `M${m(V)},40 L${m(V)},${hy - 14} Q${m(V)},${hy} ${m(V + 16)},${hy} L${m(RX - 18)},${hy} Q${m(RX)},${hy} ${m(RX)},${hy - 18} L${m(RX)},44`;
  const name = ([main, sub]: [string, string], y: number) => (
    <>
      <text x={m(MID)} y={y - 26} textAnchor="middle" className={styles.figLabel}>
        {main}
      </text>
      <text x={m(MID)} y={y - 12} textAnchor="middle" className={styles.figSmall}>
        {sub}
      </text>
    </>
  );
  return (
    <svg viewBox={`0 0 ${W} 300`} className={styles.nerveSvg} role="img" aria-label={`${side === 'R' ? 'Eskuineko' : 'Ezkerreko'} nerbio laringeo atzerakaria, ${adult ? 'helduan' : 'enbrioian'}`}>
      <text x={W / 2} y={18} textAnchor="middle" className={styles.figHead}>
        {side === 'R' ? 'Eskuina' : 'Ezkerra'}
      </text>
      {/* The larynx, towards the middle. */}
      <rect x={m(RX) - 18} y={26} width={36} height={22} rx={7} className={styles.larynx} />
      <text x={m(RX - 26)} y={42} textAnchor={side === 'R' ? 'end' : 'start'} className={styles.figSmall}>
        laringea
      </text>
      {/* 4th, 5th (never forms), 6th arches as horizontal pieces between the vagus and the middle. */}
      <path d={`M${m(26)},${y4} L${m(240)},${y4}`} stroke={ORIGINS.a4.color} strokeWidth={11} strokeLinecap="round" />
      <path d={`M${m(26)},${(y4 + y6) / 2} L${m(240)},${(y4 + y6) / 2}`} stroke={GHOST} strokeWidth={3} opacity={0.2} strokeLinecap="round" />
      <path d={`M${m(26)},${y6} L${m(240)},${y6}`} stroke={six === 'gone' ? GHOST : side === 'L' && adult ? '#c9c1b2' : ORIGINS.a6.color} strokeWidth={six === 'gone' ? 3 : side === 'L' && adult ? 6 : 11} opacity={six === 'gone' ? 0.25 : 1} strokeLinecap="round" />
      {/* The vagus (down the side) and its recurrent branch: under the arch, then up to the larynx. */}
      <path d={`M${m(V)},26 L${m(V)},290`} stroke={NERVE} strokeWidth={4} strokeLinecap="round" opacity={0.55} />
      <path d={path} stroke={NERVE} strokeWidth={4} fill="none" strokeLinecap="round" strokeLinejoin="round" className={styles.nervePath} />
      {name(fourName, y4)}
      <text x={m(MID)} y={(y4 + y6) / 2 - 8} textAnchor="middle" className={styles.figSmall}>
        5. arkua: ez da garatzen
      </text>
      {name(sixName, y6)}
      <text x={m(V)} y={292} textAnchor="middle" className={styles.figSmall} dy="-0.3em">
        bagoa
      </text>
    </svg>
  );
}

export function NervesFigure({ onShow3D }: { onShow3D?: () => void }) {
  const [adult, setAdult] = useState(true);
  return (
    <div className={styles.figCard}>
      <div className={styles.figBar}>
        <div className={styles.seg2} role="tablist" aria-label="Unea">
          <button role="tab" aria-selected={!adult} className={!adult ? styles.on : ''} onClick={() => setAdult(false)}>
            Enbrioia
          </button>
          <button role="tab" aria-selected={adult} className={adult ? styles.on : ''} onClick={() => setAdult(true)}>
            Heldua
          </button>
        </div>
        {onShow3D && (
          <button type="button" className={styles.linkBtn} onClick={onShow3D}>
            3D ereduan ikusi →
          </button>
        )}
      </div>
      <div className={styles.nerveRow}>
        <NerveSide side="R" adult={adult} />
        <NerveSide side="L" adult={adult} />
      </div>
      <p className={styles.figCaption}>
        {adult
          ? 'Eskuinean 5. arkua ez da garatzen eta 6.aren urrutikoa desagertzen da: nerbioa gora igotzen da eta eskuineko subklabioaren hasierako atala (4. arkua) inguratzen du. Ezkerrean 6.aren urrutikoa hodi arteriosoa da (gero lotailu arteriosoa): nerbioa haren azpian geratzen da.'
          : 'Hasieran bi nerbio atzerakariak 6. arkuaren azpitik igotzen dira laringera, laringeko muskuluak (IV. eta VI. arkuetakoak) inerbatzera.'}
      </p>
    </div>
  );
}

// ———————————————————————————— descending aorta branches (notes 2.5) ————————————————————————————

export type BranchGroup = 'aurrekoak' | 'albokoak' | 'atzealbokoak';

export const BRANCH_GROUPS: { id: BranchGroup; title: string; color: string; what: string; levels: { at: string; items: string[] }[] }[] = [
  {
    id: 'aurrekoak',
    title: 'Aurreko errai adarrak (bentralak)',
    color: '#ff9a3c',
    what: 'Hestea eta haren eratorriak. Hasieran bitelo arteriak (bitelo plexuetatik); bitelo zakua endekatzean, beste arteria hauek:',
    levels: [
      { at: 'Toraxa', items: ['5 arteria bikote (toraxeko aortaren aurreko paretatik) → hestegorria'] },
      { at: 'Abdomena', items: ['Enbor zeliakoa → aurreko hestea (barea, area, gibela)', 'Goiko arteria mesenterikoa → bitarteko hestea (duodeno distala eta hesteen bi heren)', 'Beheko arteria mesenterikoa → atzeko hestea (azken herena)'] },
    ],
  },
  {
    id: 'albokoak',
    title: 'Alboko errai adarrak',
    color: '#c084fc',
    what: 'Abdomeneko erraiak (apunteek: "gehiago dira, baina 3 bakarrik ikasi behar ditugu"). Zerrendatzen dituztenak:',
    levels: [
      { at: 'Abdomena', items: ['Erdiko giltzurrun gaineko arteriak (adrenalak) → giltzurrun gaineko guruinak', 'Giltzurrun arteriak → giltzurrunak', 'Arteria gonadalak → obulutegiak / barrabilak (espermatikoak luzeagoak: beherago daude)', 'Beheko diafragma arteriak → diafragmaren beheko aurpegia'] },
    ],
  },
  {
    id: 'atzealbokoak',
    title: 'Atze-alboko adarrak = segmentu arteko arteriak',
    color: ORIGINS.is7.color,
    what: 'Bilateralak, maila guztietan, somiten artean: bizkarreko muskulu ildaskatuak, orno muina, larruazala… Mailaka:',
    levels: [
      { at: 'Lepoa', items: ['Subklabioen eraketan parte hartzen dute (7. maila)', 'Luzetarako anastomosiak: batzuek aortarekiko konexioa galtzen dute → orno arteriak, lepoko arteria sakonak, lepoko goranzko arteria, arteria epigastrikoak, titiko arteriak…'] },
      { at: 'Toraxa', items: ['Saihets arteko arteriak'] },
      { at: 'Gerria', items: ['Arteria lunbarrak (gerriko arteriak)', 'Gerriko V.etik: arteria iliako primitiboak'] },
      { at: 'Sakroa', items: ['Alboko arteria sakroak'] },
    ],
  },
];

/** The aorta in cross-section: ventral up, the three directions its branches take. */
export function BranchesFigure({ group, onGroup }: { group: BranchGroup | null; onGroup: (g: BranchGroup | null) => void }) {
  const op = (g: BranchGroup) => (!group || group === g ? 1 : 0.2);
  const g = (id: BranchGroup) => BRANCH_GROUPS.find((b) => b.id === id)!;
  const pick = (id: BranchGroup) => () => onGroup(group === id ? null : id);
  return (
    <svg viewBox="0 0 640 384" className={styles.branchSvg} role="img" aria-label="Beheranzko aorta zeharkako ebakian: adarren hiru taldeak">
      <text x={320} y={18} textAnchor="middle" className={styles.figSmall}>
        aurrea (bentrala)
      </text>
      <text x={320} y={378} textAnchor="middle" className={styles.figSmall}>
        atzea (dortsala)
      </text>
      {/* Targets. */}
      <ellipse cx={320} cy={62} rx={70} ry={26} className={styles.organ} />
      <text x={320} y={66} textAnchor="middle" className={styles.figLabel}>
        Hestea
      </text>
      {[90, 550].map((x) => (
        <g key={x}>
          <ellipse cx={x} cy={200} rx={70} ry={36} className={styles.organ} />
          <text x={x} y={195} textAnchor="middle" className={styles.figSmall}>
            giltzurruna
          </text>
          <text x={x} y={211} textAnchor="middle" className={styles.figSmall}>
            adrenala · gonada
          </text>
        </g>
      ))}
      <path d="M170,334 Q320,304 470,334" className={styles.wall} />
      <text x={320} y={358} textAnchor="middle" className={styles.figSmall}>
        gorputz horma · orno muina · larruazala
      </text>
      {/* Branches: drawn as vessels from the aorta, never as arrows; names beside them, never across. */}
      <g opacity={op('aurrekoak')} onClick={pick('aurrekoak')} className={styles.clickable}>
        <path d="M320,178 L320,92" stroke={g('aurrekoak').color} strokeWidth={10} strokeLinecap="round" />
        <text x={336} y={136} className={styles.figLabel} fill={g('aurrekoak').color}>
          aurreko errai adarrak
        </text>
      </g>
      <g opacity={op('albokoak')} onClick={pick('albokoak')} className={styles.clickable}>
        <path d="M298,200 L162,200 M342,200 L478,200" stroke={g('albokoak').color} strokeWidth={8} strokeLinecap="round" />
        <text x={358} y={230} className={styles.figLabel} fill={g('albokoak').color}>
          alboko errai adarrak
        </text>
      </g>
      <g opacity={op('atzealbokoak')} onClick={pick('atzealbokoak')} className={styles.clickable}>
        <path d="M306,222 Q292,276 258,320 M334,222 Q348,276 382,320" stroke={g('atzealbokoak').color} strokeWidth={8} strokeLinecap="round" fill="none" />
        <text x={246} y={288} textAnchor="end" className={styles.figLabel} fill={g('atzealbokoak').color}>
          atze-alboko adarrak
        </text>
        <text x={246} y={305} textAnchor="end" className={styles.figSmall}>
          (segmentu artekoak)
        </text>
      </g>
      <circle cx={320} cy={200} r={24} fill={ORIGINS.da.color} stroke="#2a0a0a" strokeWidth={2} />
      <text x={320} y={204} textAnchor="middle" className={styles.aortaText}>
        aorta
      </text>
    </svg>
  );
}

// ———————————————————————————— umbilical and iliac arteries (notes 2.6) ————————————————————————————

const UMB = '#6b8cff';
const ILI = '#ff7a59';

export const UMB_STEPS = [
  { title: '1 · Zilborreko arteriak aortatik', text: 'Aorta dortsalaren urrutiko ataletik (aurreko aldetik, sakro mailan) zilborreko arteriak irteten dira: oxigeno gutxiko odola karenara, bertan oxigenatzeko.' },
  { title: '2 · Iliakoak eta bigarren konexioa', text: 'Gerriko V. segmentu arteko arteriatik arteria iliako primitiboak (kanpokoa → femorala; barnekoa → pelbisa eta ipurmasaila). Zilborreko arteriek aortarekiko kontaktua galtzen dute eta barneko arteria iliakoarekin konektatzen dira.' },
  { title: '3 · Jaio ondoren', text: 'Zilborreko arteriak ixten dira: urrutiko atala → erdialdeko zilbor lotailua; hurbileko atala → goiko gernu maskuriaren arteria (barneko iliakotik).' },
];

export function UmbilicalFigure({ step }: { step: number }) {
  const s = step;
  // Drawn for the embryo's right (viewer's left) and mirrored.
  const side = (fn: (m: (x: number) => number, k: string) => ReactNode) => (['R', 'L'] as const).map((k) => fn((x) => (k === 'R' ? x : 520 - x), k));
  return (
    <svg viewBox="0 0 520 380" className={styles.umbSvg} role="img" aria-label={UMB_STEPS[s].title}>
      {/* The aorta (and the fused dorsal aorta it is). */}
      <path d="M260,14 L260,250" stroke={ORIGINS.da.color} strokeWidth={14} strokeLinecap="round" />
      <text x={276} y={40} className={styles.figLabel}>
        beheranzko aorta
      </text>
      {/* The placenta / the umbilicus below. */}
      <ellipse cx={260} cy={350} rx={s === 2 ? 26 : 64} ry={s === 2 ? 12 : 20} className={styles.organ} />
      <text x={260} y={354} textAnchor="middle" className={styles.figSmall}>
        {s === 2 ? 'zilborra' : 'karena (zilbor-heste bidez)'}
      </text>
      {side((m, k) => (
        <g key={k}>
          {/* Common iliac (from the 5th lumbar intersegmental), its two branches. */}
          {s >= 1 && (
            <>
              <path d={`M${m(256)},236 Q${m(222)},252 ${m(196)},270`} stroke={ILI} strokeWidth={10} strokeLinecap="round" fill="none" />
              <path d={`M${m(196)},270 Q${m(150)},300 ${m(110)},368`} stroke={ILI} strokeWidth={8} strokeLinecap="round" fill="none" />
              <path d={`M${m(196)},270 Q${m(206)},296 ${m(214)},312`} stroke={ILI} strokeWidth={7} strokeLinecap="round" fill="none" />
            </>
          )}
          {/* Umbilical artery: from the aorta first, then from the internal iliac. */}
          {s === 0 && <path d={`M${m(256)},244 Q${m(220)},290 ${m(232)},338`} stroke={UMB} strokeWidth={8} strokeLinecap="round" fill="none" />}
          {s === 1 && (
            <>
              <path d={`M${m(256)},248 Q${m(236)},262 ${m(222)},282`} stroke={GHOST} strokeWidth={3} opacity={0.3} strokeLinecap="round" fill="none" />
              <path d={`M${m(214)},312 Q${m(220)},326 ${m(234)},338`} stroke={UMB} strokeWidth={8} strokeLinecap="round" fill="none" />
            </>
          )}
          {s === 2 && (
            <>
              <path d={`M${m(214)},312 Q${m(200)},318 ${m(186)},314`} stroke={ILI} strokeWidth={5} strokeLinecap="round" fill="none" />
              <path d={`M${m(214)},312 Q${m(228)},330 ${m(246)},346`} stroke="#c9c1b2" strokeWidth={4} strokeLinecap="round" fill="none" />
            </>
          )}
        </g>
      ))}
      {s === 2 && <ellipse cx={260} cy={308} rx={30} ry={18} className={styles.organ} />}
      {s === 2 && (
        <text x={260} y={312} textAnchor="middle" className={styles.figSmall}>
          maskuria
        </text>
      )}
      {/* Names: on the viewer's left only, so nothing crosses. */}
      {s === 0 && (
        <text x={150} y={292} textAnchor="end" className={styles.figLabel} fill={UMB}>
          zilborreko arteria
        </text>
      )}
      {s >= 1 && (
        <>
          <text x={186} y={256} textAnchor="end" className={styles.figLabel} fill={ILI}>
            arteria iliako primitiboa
          </text>
          <text x={116} y={318} textAnchor="end" className={styles.figLabel} fill={ILI}>
            kanpoko iliakoa
          </text>
          <text x={116} y={334} textAnchor="end" className={styles.figSmall}>
            → arteria femorala
          </text>
        </>
      )}
      {s === 1 && (
        <>
          <text x={404} y={318} className={styles.figLabel} fill={ILI}>
            barneko iliakoa
          </text>
          <text x={404} y={340} className={styles.figLabel} fill={UMB}>
            zilborreko arteria
          </text>
        </>
      )}
      {s === 2 && (
        <>
          <text x={404} y={292} className={styles.figLabel} fill={ILI}>
            goiko gernu maskuriaren a.
          </text>
          <text x={404} y={362} className={styles.figLabel} fill="#c9c1b2">
            erdialdeko zilbor lotailua
          </text>
        </>
      )}
    </svg>
  );
}
