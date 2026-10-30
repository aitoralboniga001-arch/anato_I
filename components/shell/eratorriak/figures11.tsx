'use client';
import Link from 'next/link';
import { SEPTA, OPENINGS11 } from '@/content/eratorriak/septa';
import type { TableRow } from '@/content/eratorriak/model';
import type { ShowInTimeline } from './kit/StudyRoom';
import { TestTable } from './kit/TestTable';
import styles from './eratorriak.module.css';
import extra from './kit/study.module.css';

const VALVES: TableRow[] = [
  {
    id: 'tri',
    origin: 'valves',
    label: 'Balbula trikuspidea',
    cells: ['Eskuineko zulo ABa', '3 erpin; soka tendinosoak → muskulu papilarrak', 'Mesenkima goraguneak + mehetutako miokardioa'],
    keys: ['valveR'],
    stage: 4,
  },
  {
    id: 'mit',
    origin: 'valves',
    label: 'Balbula mitrala / bikuspidea',
    cells: ['Ezkerreko zulo ABa', '2 erpin; soka tendinosoak → muskulu papilarrak', 'Mesenkima goraguneak + mehetutako miokardioa'],
    keys: ['valveL'],
    stage: 4,
  },
  {
    id: 'ao',
    origin: 'cushion',
    label: 'Aorta balbula',
    cells: ['Goranzko aortaren hasiera', '3 balba: bi alboko + atzekoa', 'Endokardio almoadilatxoak; alboko sinuetatik koronarioak'],
    keys: ['semiAorta'],
    stage: 4,
  },
  {
    id: 'pul',
    origin: 'cushion',
    label: 'Birika balbula',
    cells: ['Birika enborraren hasiera', '3 balba: bi alboko + aurrekoa', 'Endokardio almoadilatxoak; goitik ahurrak'],
    keys: ['semiPulm'],
    stage: 4,
  },
];
export function SeptaFigures({ onShow }: { onShow: ShowInTimeline }) {
  return (
    <div>
      <h4>Zuloak alderatu: non, zerk ixten du, zer geratzen da?</h4>
      <TestTable data={SEPTA} rows={OPENINGS11} columns={['Non agertzen da?', 'Itxiera / bilakaera', 'Gakoa']} onShow={onShow} />
      <p className={styles.figCaption}>
        Erreten ABaren inguruan lau kuxin daude: goikoa/dortsala, behekoa/bentrala eta bi albokoak (eskuinekoa eta ezkerrekoa). Goikoak eta
        behekoak osatzen dute septum intermedium. Aurikulen jatorrietan, eskuineko atal liso eta trabekulatuaren artean gandor terminala /
        bukaera gangarra dago; goiko aldean nodulu sinusala. Pareta trabekulatuek belarritxoak eta muskulu pektineoak / peptinatuak dituzte.
        Ezkerreko pareta lisoa, aldiz, hasierako birika zain bakarraren lau adarrak inkorporatzean osatzen da (2.2–3).
      </p>
      <div className={extra.figureGrid} style={{ marginTop: 20 }}>
        <article className={styles.figCard}>
          <h4>Bi mekanismo: kuxina edo pareta muskularra</h4>
          <MechanismsFigure />
          <p>
            Endokardio kuxina: zelula kanpoko matrizea, kanpoan endokardioa. Bi goragunek fusionatu dezakete, edo bakarra kontrako
            paretaraino hazi. Bentrikuluetan, barruko pareta muskularrak hurbildu eta fusionatzen dira; hasierako trenkada ez da osoa.
          </p>
          <p className={extra.source}>Apunteak 1 · menda: kuxinaren matrizea; arrosa: endokardioa; berdea/ziana: bi miokardio paretak.</p>
          <Link className={styles.linkBtn} href="/astea/11?etapa=trenkadatze-mekanismoak">
            Simulagailuan ikusi →
          </Link>
        </article>
        <article className={styles.figCard}>
          <h4>Kiribilak mailaren arabera aldatzen du kokapena</h4>
          <SpiralSections />
          <p>
            Hurbil: birika enborra aurrean. Tartean: aorta eskuinean, birika enborra ezkerrean. Urruti: aorta aurrean. Ez erabili ebaki
            bakar baten posizioa enbor osoarentzat.
          </p>
          <p className={extra.source}>
            Apunteak 5.2 · zeharkako ebakiak behetik: aurrea goian; enbrioiaren eskuina zure ezkerrean. Gorria = aorta, urdina = birika
            enborra (eratorriak).
          </p>
          <button
            type="button"
            className={styles.linkBtn}
            onClick={() => onShow(['truncAorta', 'truncPulm', 'truncRidgeR', 'truncRidgeL'], 4)}
          >
            Eskeman ikusi →
          </button>
        </article>
      </div>
      <h4 style={{ marginTop: 24 }}>Balbulak: izena ez nahasteko</h4>
      <TestTable data={SEPTA} rows={VALVES} columns={['Non?', 'Balbak / loturak', 'Eraketa']} onShow={onShow} />
      <p className={styles.figCaption}>
        Soka tendinosoek balben azalera bentrikularra muskulu papilarrekin lotzen dute. Hiru mota: lehen, bigarren eta hirugarren mailakoak;
        apunteek ez dute bakoitzaren intserzioa ikasteko eskatzen (3).
      </p>
      <details className={styles.limbs}>
        <summary>
          Primum-en goiko ataltxoaren bilakaerari buruz <small>2.2</small>
        </summary>
        <p>
          Apunteek hainbat liburutan (ez guztietan) primum-en goiko ataltxoa desagertzen dela diote. Geratzen den beheko atala zulo obalaren
          balbula da. Eskemak balbularen funtzioa erakusten du; ez du goiko atala desagertzea bertsio guztietarako derrigorrezko urrats gisa
          aurkezten.
        </p>
        <p className={extra.source}>w11/2.2/p6/s1</p>
      </details>
      <details className={styles.limbs}>
        <summary>
          Mintzezko IV atala: apunteetako beste bertsioa <small>5.2</small>
        </summary>
        <p>
          Azalpen nagusia (4; 5.1): arteria konoaren trenkadaren beheko luzapena muskularrarekin eta beheko kuxinarekin fusionatzen da.
          5.2ko oharrean beste bertsio bat dago: beheko kuxinaren luzapenak mintzezko zatia ematen du eta konoaren trenkada zuzenean
          muskularrarekin fusionatzen da. Eskemak azalpen nagusia jarraitzen du.
        </p>
        <p className={extra.source}>w11/4/p6/s2 · w11/5.1/p4/s11 · w11/5.2/p7/s12–s14</p>
      </details>
    </div>
  );
}
function MechanismsFigure() {
  return (
    <svg viewBox="0 0 620 390" role="img" aria-label="Endokardio kuxinen fusioa eta pareta muskularren hurbilketa">
      <text x="310" y="28" textAnchor="middle">
        Kuxinak hazi eta fusionatu
      </text>
      {[0, 1, 2].map((i) => (
        <g key={i} transform={`translate(${i * 200},0)`}>
          <path d="M25,75 L175,75 M25,175 L175,175" stroke="#7d394e" strokeWidth="16" />
          <path
            d={`M65,80 Q100,${i === 0 ? 110 : i === 1 ? 140 : 150} 135,80Z M65,170 Q100,${i === 0 ? 140 : i === 1 ? 110 : 100} 135,170Z`}
            fill="#a9e4dc"
            stroke="#f9a8d4"
            strokeWidth="3"
          />
        </g>
      ))}
      <text x="310" y="225" textAnchor="middle">
        Pareta muskularrak hurbildu
      </text>
      {[0, 1, 2].map((i) => (
        <g key={i} transform={`translate(${i * 200},0)`}>
          <path d={`M45,350 Q${70 + i * 9},300 ${80 + i * 9},260 L${92 + i * 4},350Z`} fill="#2fa865" />
          <path d={`M155,350 Q${130 - i * 9},300 ${120 - i * 9},260 L${108 - i * 4},350Z`} fill="#22b8cf" />
        </g>
      ))}
      <text x="310" y="385" textAnchor="middle" style={{ fontSize: 12 }}>
        Lehen muskulu trenkadak goiko komunikazioa irekita uzten du.
      </text>
    </svg>
  );
}
function SpiralSections() {
  return (
    <svg viewBox="0 0 620 350" role="img" aria-label="Enbor arteriosoaren hiru mailatan aortaren eta birika enborraren posizioak">
      {[0, 1, 2].map((i) => (
        <g key={i} transform={`translate(${i * 200},0)`}>
          <text x="100" y="25" textAnchor="middle">
            {['Hurbilekoa / behea', 'Tartekoa', 'Urrutikoa / goia'][i]}
          </text>
          <path d="M25,110 Q100,50 175,110 L175,230 Q100,290 25,230Z" fill="#2b2027" stroke="#765663" strokeWidth="2" />
          {i === 1 ? (
            <>
              <path d="M100,80 L100,260" stroke="#a9e4dc" strokeWidth="8" />
              <text x="62" y="165" textAnchor="middle" style={{ fill: '#ff7b72', fontSize: 13 }}>
                Aorta
              </text>
              <text x="138" y="155" textAnchor="middle" style={{ fill: '#93c5fd', fontSize: 13 }}>
                Birika
              </text>
              <text x="138" y="175" textAnchor="middle" style={{ fill: '#93c5fd', fontSize: 13 }}>
                enborra
              </text>
            </>
          ) : (
            <>
              <path d="M25,170 L175,170" stroke="#a9e4dc" strokeWidth="8" />
              <text x="100" y="132" textAnchor="middle" style={{ fill: i === 0 ? '#93c5fd' : '#ff7b72', fontSize: 13 }}>
                {i === 0 ? 'Birika enborra' : 'Aorta'}
              </text>
              <text x="100" y="218" textAnchor="middle" style={{ fill: i === 0 ? '#ff7b72' : '#93c5fd', fontSize: 13 }}>
                {i === 0 ? 'Aorta' : 'Birika enborra'}
              </text>
            </>
          )}
          <text x="100" y="320" textAnchor="middle" style={{ fontSize: 12 }}>
            aurrea goian · atzea behean
          </text>
        </g>
      ))}
    </svg>
  );
}
