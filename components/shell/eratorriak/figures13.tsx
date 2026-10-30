'use client';

import Link from 'next/link';
import { VEINS } from '@/content/eratorriak/veins';
import type { TableRow } from '@/content/eratorriak/model';
import { TestTable } from './kit/TestTable';
import type { ShowInTimeline } from './kit/StudyRoom';
import styles from './eratorriak.module.css';
import extra from './kit/study.module.css';

export const BIRTH13: TableRow[] = [
  {
    id: 'ua-dist',
    origin: 'umb',
    label: 'Zilborreko arteriak · urrutikoa',
    cells: ['Muskulu lisoa uzkurtu: 2–3 minutu; gero fibrosia', 'Erdialdeko zilborreko lotailuak'],
    keys: [],
    stage: 5,
  },
  {
    id: 'ua-prox',
    origin: 'umb',
    label: 'Zilborreko arteriak · hurbilekoa',
    cells: ['Permeable mantentzen da', 'Goiko gernu maskuriaren arteriak'],
    keys: [],
    stage: 5,
  },
  {
    id: 'uv',
    origin: 'umb',
    label: 'Ezkerreko zilbor-zaina',
    cells: ['Arterien ondoren ixten da', 'Gibelaren lotailu borobila'],
    keys: ['umbL'],
    stage: 5,
  },
  {
    id: 'dv',
    origin: 'umb',
    label: 'Hodi benosoa',
    cells: ['Zilbor-zainarekin batera ixten da', 'Gibelaren lotailu benosoa'],
    keys: ['dv'],
    stage: 5,
  },
  {
    id: 'da',
    origin: 'umb',
    label: 'Hodi arteriosoa',
    cells: ['Birika arteria–aorta komunikazioa eteten da', 'Lotailu arteriosoa (3. hilabeterako)'],
    keys: [],
    stage: 5,
  },
  {
    id: 'fo',
    origin: 'sinus',
    label: 'Zulo obala',
    cells: [
      'Ezkerreko aurikularen presioa handitu; primum secundum-aren aurka',
      'Primum eta secundum fusionatu (~urtebete); %20an ez osoa',
    ],
    keys: [],
    stage: 5,
  },
];
export function VeinFigures({ onShow }: { onShow: ShowInTimeline }) {
  return (
    <div>
      <h4>Jaiotza: bidea → itxiera → aztarna</h4>
      <p className={styles.blockLead}>Itxiera funtzionala eta egiturazko fusioa ez dira aldi berekoak. Apunteak 4.2.</p>
      <TestTable data={VEINS} rows={BIRTH13} columns={['Zerk aldatzen du?', 'Jaio ondoren']} />
      <div className={extra.figureGrid} style={{ marginTop: 20 }}>
        <article className={styles.figCard}>
          <h4>Jaio aurretik eta ondoren</h4>
          <CirculationFigure />
          <p>
            Jaio aurretik: karenatik datorren odolak hodi benosoa eta zulo obala erabiltzen ditu; eskuineko bentrikulutik gehiena hodi
            arteriosotik aortara. Ondoren: biriketan oxigenatu, lau birika zainetatik ezkerreko aurikulara.
          </p>
          <p className={extra.source}>Apunteak 4.1–4.3 · gorria = oxigenatua · urdina = oxigeno gutxi · morea = nahasia · horia = saihesbidea · grisa = aztarna</p>
          <Link href="/astea/13?etapa=jaio-aurretik" className={styles.linkBtn}>
            Simulagailuan ikusi →
          </Link>
        </article>
        <article className={styles.figCard}>
          <h4>Linfa: sei zakuetatik hodi bakarrera</h4>
          <LymphFigure />
          <p>
            Errai orritik: bi zaku jugular, peritoneo atzeko zakua, Kiloren/Pecquet zisterna eta bi atzeko zaku. Bi hodi toraxikoetatik bat
            geratzen da; ezkerreko lotura yugulosubklabikoan irekitzen da.
          </p>
          <p className={extra.source}>Apunteak 5 · berdea = linfa; urdina = zain sistemako irteera</p>
          <Link href="/astea/13?etapa=linfa" className={styles.linkBtn}>
            Simulagailuan ikusi →
          </Link>
        </article>
        <article className={styles.figCard}>
          <h4>Beheko kaba: hiru jatorri</h4>
          <svg viewBox="0 0 560 370" role="img" aria-label="Beheko kaba zainaren hiru segmentuak">
            {[
              ['#22c3b0', 'Gibel segmentua', 'Eskuineko hodi hepatokardiakoa'],
              ['#f97316', 'Giltzurrun segmentua', 'Eskuineko kardinal azpikoa'],
              ['#e879f9', 'Segmentu sakrokardinala', 'Eskuineko sakrokardinal hurbilekoa'],
            ].map(([c, t, s], i) => (
              <g key={t}>
                <path d={`M46,${30 + i * 110} L46,${115 + i * 110}`} stroke={c} strokeWidth="22" strokeLinecap="round" />
                <text x="82" y={58 + i * 110} style={{ fill: c, fontWeight: 600 }}>
                  {t}
                </text>
                <text x="82" y={85 + i * 110}>
                  {s}
                </text>
              </g>
            ))}
          </svg>
          <p>
            Apunteetako hiru segmentuak fusionatzen dira. Porta zainaren odola gibeleko plexutik pasa ondoren gibel segmentura heltzen da.
          </p>
          <button type="button" className={styles.linkBtn} onClick={() => onShow(['hcR', 'subR', 'sacroR'], 4)}>
            Eskeman ikusi →
          </button>
        </article>
      </div>
    </div>
  );
}
const OX = '#ee796b';
const POOR = '#60a5fa';
const MIX = '#b48ce6';
const SHUNT = '#ffd166';
const SCAR = '#8a8494';

/** One node of the route map: a rounded box with its name. */
function Node({ x, y, t, w = 70 }: { x: number; y: number; t: string; w?: number }) {
  return (
    <g>
      <rect x={x - w / 2} y={y - 13} width={w} height={26} rx={8} fill="#2a2230" stroke="#5b4a5e" />
      <text x={x} y={y + 4} textAnchor="middle" style={{ fontSize: 10.5, fill: 'var(--text)' }}>
        {t}
      </text>
    </g>
  );
}

/** One panel of the route map: before birth (with its three shunts) or after (the shunts closed into remnants). */
function Routes({ ox, after }: { ox: number; after: boolean }) {
  const e = (d: string, c: string, dash?: boolean, w = 4) => (
    <path
      d={d}
      transform={`translate(${ox} 0)`}
      stroke={c}
      strokeWidth={w}
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeDasharray={dash ? '5 5' : undefined}
    />
  );
  const tag = (x: number, y: number, t: string, c: string, anchor: 'start' | 'middle' = 'middle') => (
    <text x={ox + x} y={y} textAnchor={anchor} className={styles.figSmall} style={{ fill: c, fontWeight: 600 }}>
      {t}
    </text>
  );
  const right = after ? POOR : MIX;
  const left = after ? OX : MIX;
  return (
    <g>
      <text x={ox + 140} y={14} textAnchor="middle" className={styles.figHead}>
        {after ? 'Jaio ondoren' : 'Jaio aurretik'}
      </text>
      {/* the heart's own path */}
      {e('M83,240 L100,240', right)}
      {e('M135,227 L135,183', right)}
      {e('M135,157 L135,113', right)}
      {e('M225,227 L225,183', left)}
      {e('M225,157 L225,113', left)}
      {/* the lungs: a little flow before birth, all of it after */}
      {e('M135,87 L158,53', right, false, after ? 4 : 1.6)}
      {e('M215,40 L268,40 L268,240 L260,240', after ? OX : MIX, false, after ? 4 : 1.6)}
      {/* umbilical vein, ductus venosus */}
      {after ? e('M45,412 L45,323', SCAR, true, 3) : e('M45,367 L45,323', OX)}
      {after ? e('M45,297 L45,253', SCAR, true, 3) : e('M45,297 L45,253', OX)}
      {/* foramen ovale and ductus arteriosus */}
      {after ? e('M170,240 L190,240', SCAR, true, 3) : e('M170,240 L190,240', SHUNT, false, 5)}
      {after ? e('M170,100 L190,100', SCAR, true, 3) : e('M170,100 L190,100', SHUNT, false, 5)}
      {/* umbilical arteries back to the placenta */}
      {after ? e('M260,100 L278,100 L278,412 L60,412', SCAR, true, 3) : e('M260,100 L278,100 L278,412 L45,412 L45,393', MIX)}
      <Node x={ox + 180} y={40} t="birikak" />
      <Node x={ox + 135} y={100} t="birika enborra" />
      <Node x={ox + 225} y={100} t="aorta" />
      <Node x={ox + 135} y={170} t="esk. bentrikulua" w={76} />
      <Node x={ox + 225} y={170} t="ezk. bentrikulua" w={76} />
      <Node x={ox + 135} y={240} t="esk. aurikula" />
      <Node x={ox + 225} y={240} t="ezk. aurikula" />
      <Node x={ox + 45} y={240} t="beheko kaba" w={76} />
      <Node x={ox + 45} y={310} t="gibela" />
      {!after && <Node x={ox + 45} y={380} t="karena" />}
      {after ? tag(52, 362, 'lotailu borobila', SCAR, 'start') : tag(52, 350, 'zilbor-zaina', OX, 'start')}
      {after ? tag(52, 280, 'lotailu benosoa', SCAR, 'start') : tag(52, 280, 'hodi benosoa', SHUNT, 'start')}
      {after ? tag(180, 270, 'zulo obala itxita', SCAR) : tag(180, 270, 'zulo obala', SHUNT)}
      {after ? tag(180, 134, 'lotailu arteriosoa', SCAR) : tag(180, 134, 'hodi arteriosoa', SHUNT)}
      {after ? tag(170, 432, 'zilborreko lotailuak', SCAR) : tag(170, 432, 'zilbor arteriak', MIX)}
    </g>
  );
}

function CirculationFigure() {
  return (
    <svg viewBox="0 0 580 450" role="img" aria-label="Fetuaren hiru saihesbideak eta jaio ondoren haien aztarnak">
      <Routes ox={0} after={false} />
      <path d="M290,30 L290,430" stroke="var(--line)" />
      <Routes ox={292} after />
    </svg>
  );
}

const LYMPH = '#7ee08a';
function LymphFigure() {
  const lead = (x1: number, y1: number, x2: number, y2: number) => (
    <g>
      <path d={`M${x1},${y1} L${x2},${y2}`} stroke={LYMPH} strokeWidth="1.4" opacity="0.8" />
      <circle cx={x2} cy={y2} r="3" fill={LYMPH} stroke="#0e0d11" />
    </g>
  );
  const label = (x: number, y: number, lines: string[], anchor: 'start' | 'end') => (
    <text x={x} y={y} textAnchor={anchor} className={styles.figLabel} style={{ fill: LYMPH }}>
      {lines.map((l, i) => (
        <tspan key={l} x={x} dy={i ? 15 : 0}>
          {l}
        </tspan>
      ))}
    </text>
  );
  return (
    <svg viewBox="0 0 560 460" role="img" aria-label="Sei linfa zakuak eta toraxeko linfa hodiaren irteera ezkerrean">
      {/* body and veins (context) */}
      <path
        d="M250,30 L250,92 Q170,100 130,124 L150,250 L170,430 L390,430 L410,250 L430,124 Q390,100 310,92 L310,30"
        fill="#1d1a22"
        stroke="#3d3544"
      />
      <path
        d="M255,36 L255,122 L150,122 M305,36 L305,122 L410,122 M280,430 L280,330 M280,392 L236,440 M280,392 L324,440"
        stroke={POOR}
        strokeWidth="5"
        fill="none"
        opacity="0.55"
        strokeLinecap="round"
      />
      {/* the two first thoracic ducts: the parts that go, dashed */}
      <path d="M266,212 Q258,170 255,124 M286,290 Q290,240 296,196" stroke={SCAR} strokeWidth="3" strokeDasharray="5 5" fill="none" />
      {/* the final duct: lower right part, the crossing, upper left part, into the left jugulo-subclavian angle */}
      <path
        d="M274,290 Q270,250 266,212 L296,196 Q302,160 305,124"
        stroke={LYMPH}
        strokeWidth="5"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* the six sacs */}
      <ellipse cx="238" cy="104" rx="13" ry="17" fill={LYMPH} />
      <ellipse cx="322" cy="104" rx="13" ry="17" fill={LYMPH} />
      <ellipse cx="280" cy="306" rx="12" ry="20" fill={LYMPH} />
      <ellipse cx="280" cy="356" rx="20" ry="11" fill={LYMPH} opacity="0.85" />
      <ellipse cx="252" cy="404" rx="12" ry="13" fill={LYMPH} />
      <ellipse cx="308" cy="404" rx="12" ry="13" fill={LYMPH} />
      {lead(206, 72, 232, 96)}
      {label(200, 64, ['Bi zaku jugular'], 'end')}
      {lead(354, 62, 307, 120)}
      {label(360, 50, ['Ezkerreko lotura', 'yugulosubklabikoa: irteera'], 'start')}
      {lead(354, 196, 298, 196)}
      {label(360, 200, ['Hodi toraxikoa: bitik bat'], 'start')}
      {lead(206, 302, 268, 304)}
      {label(200, 298, ['Kiloren / Pecquet', 'zisterna'], 'end')}
      {lead(354, 356, 300, 356)}
      {label(360, 360, ['Peritoneo atzeko zakua'], 'start')}
      {lead(206, 404, 240, 404)}
      {label(200, 400, ['Bi atzeko zaku', '(iliakoen elkargunean)'], 'end')}
      <text x="280" y="454" textAnchor="middle" className={styles.figSmall}>
        marra etena = desagertzen den zatia · urdina = zainak
      </text>
    </svg>
  );
}
