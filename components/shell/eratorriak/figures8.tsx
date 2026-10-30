'use client';
import { useState } from 'react';
import Link from 'next/link';
import { BONES, RESEGMENT8 } from '@/content/eratorriak/bones';
import type { TableRow } from '@/content/eratorriak/model';
import type { ShowInTimeline } from './kit/StudyRoom';
import { TestTable } from './kit/TestTable';
import styles from './eratorriak.module.css';
import extra from './kit/study.module.css';
const FONTANELLES: TableRow[] = [
  {
    id: 'front',
    origin: 'crest',
    label: 'Aurrekoa / Bregma',
    cells: ['Bi frontal + bi parietalen artean', '18. hilabetea'],
    keys: ['frontal', 'parietal'],
    stage: 0,
  },
  {
    id: 'back',
    origin: 'para',
    label: 'Atzekoa / Lambda',
    cells: ['Bi parietal + okzipitalaren ezkata', '1.–2. hilabetea'],
    keys: ['parietal', 'occScale'],
    stage: 0,
  },
  {
    id: 'sphenoidal',
    origin: 'crest',
    label: 'Aurre-albokoa / esfenoidala',
    cells: ['Alboetan, bilaterala', 'Atal honetan eperik ez'],
    keys: ['frontal', 'tempScale', 'greaterWing'],
    stage: 0,
  },
  {
    id: 'mastoid',
    origin: 'para',
    label: 'Atze-albokoa / mastoidea',
    cells: ['Alboetan, bilaterala', 'Atal honetan eperik ez'],
    keys: ['parietal', 'occScale', 'otic'],
    stage: 0,
  },
];
export function BoneFigures({ onShow }: { onShow: ShowInTimeline }) {
  return (
    <div>
      <div className={extra.figureGrid}>
        <article className={styles.figCard}>
          <h4>Bi hezurtzapen bide, mesenkima beretik</h4>
          <svg viewBox="0 0 620 320" role="img" aria-label="Mintzezko eta endokondral hezurtzapenaren bideak">
            <text x="310" y="30" textAnchor="middle">
              Mesenkima
            </text>
            <text x="155" y="105" textAnchor="middle">
              Osteoblastoak zuzenean
            </text>
            <text x="465" y="105" textAnchor="middle">
              Kondroblastoak
            </text>
            <text x="155" y="195" textAnchor="middle">
              Hezurtzapen zentroak
            </text>
            <text x="465" y="195" textAnchor="middle">
              Kartilago hialinozko eredua
            </text>
            <text x="155" y="285" textAnchor="middle">
              Mintzezko hezurra
            </text>
            <text x="465" y="285" textAnchor="middle">
              Endokondral hezurra
            </text>
            <path
              d="M280,42 L155,70 M340,42 L465,70 M155,120 L155,165 M465,120 L465,165 M155,210 L155,255 M465,210 L465,255"
              fill="none"
              stroke="#d9a066"
              strokeWidth="3"
            />
          </svg>
          <p>
            Jatorria (paraxiala, pareta orria, gandor neurala) eta mekanismoa (mintzezkoa, endokondrala) bi ardatz dira. Mesenkimatik
            fibroblastoak, kondroblastoak eta osteoblastoak desberdindu daitezke (1–2).
          </p>
          <button type="button" className={styles.linkBtn} onClick={() => onShow(['frontal', 'hypophyseal'], 1)}>
            Eskeman ikusi →
          </button>
        </article>
        <article className={styles.figCard}>
          <h4>Buru-ganga: hezur plakak eta hutsune konektiboak</h4>
          <Skull />
          <p>
            Goiko ikuspegia: aurrea goian. Aurreko Bregma bi frontal eta bi parietalen artean; atzeko Lambda bi parietal eta ezkataren
            artean. Ez dira hezurreko zuloak: ehun konektibozko eremuak dira. Joskurak estuak; fontanelak zabalagoak (3.1.1).
          </p>
          <p className={extra.source}>
            Berdea: gandor neuraleko aurrealdea · gorria: paraxialeko atzealdea · urdina: joskura/fontanela konektiboa. Forma eskematikoa.
          </p>
        </article>
        <article className={styles.figCard}>
          <h4>Kondrokraneoa: erdiko eta alboko plakak</h4>
          <CranialBase />
          <p>
            Erdian atzetik aurrera: parakordalak → hipofisi kartilagoak → trenkada kranialak. Alboetan: kapsula periotikoa → hego tenporala
            → begizulo hegoak. Atalak fusionatzean zulo eta arraildurak geratzen dira nerbio kraneal eta odol-hodientzat (3.1.2).
          </p>
          <button
            type="button"
            className={styles.linkBtn}
            onClick={() => onShow(['occBaseOcc', 'occBaseNeck', 'hypophyseal', 'trabeculae', 'otic', 'greaterWing', 'lesserWing'], 1)}
          >
            Eskeman ikusi →
          </button>
        </article>
        <article className={styles.figCard}>
          <h4>Arkuetako kartilagoa edo haren inguruko mesenkima?</h4>
          <svg
            viewBox="0 0 620 360"
            role="img"
            aria-label="Arku faringeoetako kartilagoaren eta inguruko mesenkimaren eratorri desberdinak"
          >
            <text x="310" y="30" textAnchor="middle">
              1. arkua · prozesu maxilarra
            </text>
            <text x="155" y="90" textAnchor="middle">
              Barra → ingudea
            </text>
            <text x="455" y="85" textAnchor="middle">
              Ingurua → maxilarra, malarra
            </text>
            <text x="455" y="110" textAnchor="middle">
              eta tenporalaren ezkata
            </text>
            <path d="M60,130 Q155,100 250,130" stroke="#ff8a4c" strokeWidth="16" fill="none" />
            <text x="310" y="185" textAnchor="middle">
              1. arkua · barail prozesua
            </text>
            <text x="155" y="240" textAnchor="middle">
              Meckel → mailua
            </text>
            <text x="455" y="240" textAnchor="middle">
              Ingurua → baraila
            </text>
            <path d="M60,275 Q155,245 250,275" stroke="#ff8a4c" strokeWidth="16" fill="none" />
            <text x="310" y="340" textAnchor="middle">
              2. arkua · Reichert → estriboa / ointokia
            </text>
          </svg>
          <p>
            Arkuetako hezur-mesenkima gandor neuraleko zelulek osatzen dute; mesodermotik, berriz, muskuluak (3.2). Ez hartu kartilagoaren
            inguruko mesenkimaren hezurra kartilago horren zuzeneko eratorritzat.
          </p>
          <button type="button" className={styles.linkBtn} onClick={() => onShow(['incus', 'malleus', 'mandible', 'stapes'], 2)}>
            Eskeman ikusi →
          </button>
        </article>
        <article className={styles.figCard}>
          <h4>Birsegmentazioa, lau pausotan</h4>
          <Resegmentation />
          <button
            type="button"
            className={styles.linkBtn}
            onClick={() => onShow(['vertebraCaudal', 'vertebraCranial', 'annulus', 'nucleus', 'notoBody'], 4)}
          >
            Jatorri-mapan ikusi →
          </button>
        </article>
        <article className={styles.figCard}>
          <h4>Hezur luzea: kartilagotik hazkuntza amaitu arte</h4>
          <LongBone />
          <button type="button" className={styles.linkBtn} onClick={() => onShow(['upper', 'lower'], 3)}>
            Eskeman ikusi →
          </button>
        </article>
        <article className={styles.figCard}>
          <h4>Adarrak: sorrera, hatzak eta kontrako biraketak</h4>
          <LimbSteps />
          <p>
            4. astean hastapenak (goikoak lehenago), 6.ean esku/oin plakak eta hiru atal bereizteko ertzadurak. Lau ildo erradiatuen arteko
            bost izpiak: apoptosiak hatzen arteko ehuna kentzen du. 8. astean goiko adarra 90° kanpora; behekoa 90° barrura (4).
          </p>
          <p>
            Goikoan tolestatzaileak aurrean, hedatzaileak dortso-alboan; behekoan hedatzaileak aurrean eta tolestatzaileak atzean (4).
            Norabide hauek 8. gaiaren biraketaren ondorengo azalpenari dagozkio; 9. gaiaren 2.1.3ko esaldiak kontrako banaketa dakar (ikus
            formulazio anbiguoak).
          </p>
          <Link className={styles.linkBtn} href="/astea/8?etapa=gorputz-adarrak">
            Simulagailuan ikusi →
          </Link>
        </article>
        <article className={styles.figCard}>
          <h4>Orno zuloa ez da ornoarteko zuloa</h4>
          <svg viewBox="0 0 620 350" role="img" aria-label="Ornoaren gorputza, atzeko arku neurala eta orno zuloa">
            <ellipse cx="310" cy="245" rx="95" ry="65" fill="#efe3c4" />
            <path d="M230,210 Q145,70 275,55 L310,25 L345,55 Q475,70 390,210" fill="none" stroke="#efe3c4" strokeWidth="25" />
            <ellipse cx="310" cy="125" rx="40" ry="50" fill="#5577e6" />
            <text x="310" y="245" textAnchor="middle" style={{ fill: '#45352b' }}>
              Orno gorputza
            </text>
            <text x="105" y="70" textAnchor="middle">
              Arku neurala
            </text>
            <text x="510" y="150" textAnchor="middle">
              Orno zuloa
            </text>
            <text x="310" y="335" textAnchor="middle">
              Zulo guztiek hodi errakideoa osatu · barruan ornomuina
            </text>
          </svg>
          <p>
            Orno gorputza aurrean; arku neurala atze-alboan. Apofisi zeharrak alboetara, arantza atzera, eta giltzadura apofisiak. Nerbio
            espinalak ornoarteko zuloetatik irteten dira, diskoaren mailan (5.1; 5.3).
          </p>
          <p>
            Zifosi primarioak: toraxekoa eta sakrokoa, jaio aurretik. Lordosi sekundarioak: lepoa burua altxatzean; gerrikoa ibiltzean
            (5.2.1).
          </p>
        </article>
      </div>
      <h4 style={{ marginTop: 24 }}>Fontanelak eta joskurak</h4>
      <TestTable data={BONES} rows={FONTANELLES} columns={['Non?', 'Itxiera (apunteak)']} onShow={onShow} />
      <p className={styles.figCaption}>
        Joskurak eta fontanelak entzefaloaren hazkuntza ahalbidetzen dute. Erditzean plakak gainjarri; fontanelak joskurak baino lehen ixten
        dira. Alboetako bi fontanelak bilateralak dira; apunteek ez dute haien itxiera-eperik ematen.
      </p>
      <details className={styles.limbs}>
        <summary>
          Apunteen formulazio anbiguoak <small>1 · 3.2 · 4 · 5.4</small>
        </summary>
        <p>
          Hioidesaren deribazioa ez da 3.2ko azalpen honetan zehazten. Estiloide apofisia 3.2ko testuan tenporal ezkataren ondoren aipatzen
          da, baina ez du jatorria argi bereizten. Ez da Reicherten zuzeneko eratorri gisa gehitu ikasteko taulan. 4. atalak 8. astea dio
          erdiko zentroak eta biraketak azaltzean, nahiz eta aurreko izenburuak «7. astea?» galdetu: azalpeneko 8.a mantendu da.
        </p>
        <p>
          Saihetsen 5.4ko azalpen zehatzak hezurra esklerotomatik eta aurreko kartilagoa pareta orritik bereizten ditu. 1. ataleko
          esternoiaren parentesiak eta 9. gaiaren birpasoak bestelako formulazioak dituzte; hemen 5.4 jarraitzen da. Adarren aurre/atzeko
          tolestatzaile-hedatzaileen kokapena 8. gaiaren 4ko prosaren arabera erakutsi da; 9. gaiaren 2.1.3/p5/s3k kontrakoa dio, eta argitu
          gabe dago. «Epifisi orria / metafisia / hazkuntza plaka» apunteen izendapen gisa mantendu da; ez da hezur osoaren atal berritzat
          gehitu.
        </p>
      </details>
    </div>
  );
}
function Skull() {
  return (
    <svg viewBox="0 0 620 420" role="img" aria-label="Jaioberriaren buru-gangaren goiko ikuspegi eskematikoa">
      <path d="M300,70 Q195,40 175,165 L290,185Z M320,70 Q425,40 445,165 L330,185Z" fill="#2dd4bf" />
      <path
        d="M170,190 L285,205 L290,320 L200,340 Q140,285 170,190Z M450,190 L335,205 L330,320 L420,340 Q480,285 450,190Z"
        fill="#ef6b5b"
      />
      <path d="M225,355 L310,335 L395,355 Q310,405 225,355Z" fill="#ef6b5b" />
      <path d="M310,150 L335,190 L310,220 L285,190Z M310,315 L330,335 L290,335Z" fill="#4fb3e8" />
      <path d="M310,70 L310,150 M310,220 L310,315" stroke="#4fb3e8" strokeWidth="5" />
      <text x="310" y="25" textAnchor="middle">
        Aurrea
      </text>
      <text x="80" y="140" textAnchor="middle">
        Frontalak
      </text>
      <text x="80" y="270" textAnchor="middle">
        Parietalak
      </text>
      <text x="515" y="190" textAnchor="middle">
        Bregma
      </text>
      <text x="515" y="335" textAnchor="middle">
        Lambda
      </text>
      <text x="310" y="415" textAnchor="middle">
        Okzipitalaren ezkata · atzea
      </text>
    </svg>
  );
}
function CranialBase() {
  return (
    <svg viewBox="0 0 620 430" role="img" aria-label="Kondrokraneoaren erdiko eta alboko kartilagoak goitik">
      <text x="310" y="25" textAnchor="middle">
        Aurrea goian · atzea behean · goitik barrura
      </text>
      <path d="M290,75 L330,75 L330,145 L290,145Z M280,175 L340,175 L340,245 L280,245Z" fill="#2dd4bf" />
      <path d="M275,285 L300,285 L300,365 L275,365Z M320,285 L345,285 L345,365 L320,365Z" fill="#ef6b5b" />
      <path
        d="M205,120 L250,140 L230,160 L190,140Z M415,120 L370,140 L390,160 L430,140Z M205,185 L250,205 L230,235 L185,220Z M415,185 L370,205 L390,235 L435,220Z"
        fill="#2dd4bf"
      />
      <ellipse cx="220" cy="310" rx="30" ry="40" fill="#ef6b5b" />
      <ellipse cx="400" cy="310" rx="30" ry="40" fill="#ef6b5b" />
      <text x="20" y="92">
        Trenkada kranialak
      </text>
      <text x="20" y="185">
        Hipofisi kartilagoak
      </text>
      <text x="20" y="370">
        Parakordalak
      </text>
      <text x="455" y="140">
        Begizulo hegoak
      </text>
      <text x="455" y="220">
        Hego tenporala
      </text>
      <text x="455" y="315">
        Periotikoa
      </text>
      <text x="310" y="415" textAnchor="middle">
        Berdea: aurreko gandor neurala · gorria: atzeko paraxiala
      </text>
    </svg>
  );
}
function Resegmentation() {
  const [s, setS] = useState(0);
  const fused = s >= 2,
    notolife = RESEGMENT8.lives.notoBody[s];
  return (
    <>
      <div className={extra.panelTabs} role="group" aria-label="Birsegmentazioaren pausoak">
        {RESEGMENT8.stages.map((t, i) => (
          <button key={t} type="button" className={styles.pick} aria-pressed={s === i} onClick={() => setS(i)}>
            {i + 1} · {t}
          </button>
        ))}
      </div>
      <svg viewBox="0 0 760 520" role="img" aria-label={RESEGMENT8.stages[s]}>
        <text x="380" y="30" textAnchor="middle">
          {RESEGMENT8.stages[s]}
        </text>
        <rect x="305" y="90" width="130" height="55" rx="4" fill="#8c6b55" opacity=".35" />
        <rect x="305" y={fused ? 190 : 145} width="130" height="60" rx="4" fill="#e6a23c" data-reseg-piece="vertebraCaudal" />
        <rect x="305" y={fused ? 250 : 235} width="130" height="60" rx="4" fill="#43b6c4" data-reseg-piece="vertebraCranial" />
        <rect x="305" y={fused ? 350 : 295} width="130" height="55" rx="4" fill="#437d86" opacity=".35" />
        <rect
          x="305"
          y={fused ? 163 : 135}
          width="130"
          height="23"
          rx="3"
          fill="#5fb8a8"
          opacity={s === 0 ? 0.25 : 1}
          data-reseg-piece="annulus"
        />
        <path
          d={notolife === 3 ? 'M370,100 L370,145 M370,350 L370,400' : 'M370,100 L370,400'}
          stroke="#a855f7"
          strokeWidth={notolife === 2 ? 4 : 8}
          opacity={notolife === 3 ? 0.25 : 1}
          fill="none"
          data-reseg-piece="notoBody"
        />
        <ellipse cx="370" cy={fused ? 175 : 147} rx="18" ry="9" fill="#a855f7" data-reseg-piece="nucleus" />
        <path d={fused ? 'M440,250 L495,250' : 'M440,220 L495,220'} stroke="#e04a3a" strokeWidth="5" />
        <path d={fused ? 'M440,175 L495,175 M440,325 L495,325' : 'M440,110 L495,110 M440,270 L495,270'} stroke="#fde047" strokeWidth="5" />
        <path
          d={fused ? 'M475,150 Q455,250 475,345' : 'M475,100 L475,205 M475,235 L475,350'}
          stroke="#e5484d"
          strokeWidth="12"
          fill="none"
          opacity=".5"
        />
        <g style={{ fill: 'var(--text)', fontSize: 17 }}>
          <text x="20" y="100">
            A · goiko erdia
          </text>
          <text x="20" y="200">
            A · beheko erdia
          </text>
          <text x="20" y="285">
            B · goiko erdia
          </text>
          <text x="20" y="380">
            B · beheko erdia
          </text>
          <text x="530" y="175">
            Nerbioa: disko mailan
          </text>
          <text x="530" y="245">
            Arteria: orno mailan
          </text>
          <text x="530" y="360">
            Miotoma: bi orno lotu
          </text>
          <text x="380" y="455" textAnchor="middle">
            {fused ? 'A behekoa + B goikoa = orno gorputz bat' : 'Bi jatorrizko segmentu: A eta B'}
          </text>
          <text x="380" y="495" textAnchor="middle">
            Anbarra / ziana: segmentu-jatorria · morea: notokorda · menda: eraztuna
          </text>
        </g>
      </svg>
      <p>
        {s < 2
          ? '4. astean esklerotoma zelulek hodi neurala eta notokorda inguratu: mesenkima zutabe segmentatua. Segmentu bakoitzak goiko eta beheko erdiak ditu.'
          : 'Beheko erdiak azpiko segmentuaren goikoarekin fusionatu. Ornoa intersegmentarioa; nerbioa diskoaren mailan, arteria orno gorputzaren mailan. Miotomek bi orno lotzen dituzte.'}
      </p>
      <p>
        Notokorda orno gorputzaren mailan endekatu eta galdu; diskoan nukleo pulposoa geratu. Inguruko mesenkima eraztun fibrosoa da
        (5.2.1). Hemen koloreek jatorrizko A/B segmentuak bereizten dituzte, biak mesodermo paraxialekoak.
      </p>
    </>
  );
}
function LongBone() {
  const [s, setS] = useState(0);
  const names = [
    '6. astea · kartilagoa',
    '8. astea · erdiko zentroa',
    '12. astea · diafisia',
    'Jaio ondoren · epifisiak',
    'Hazkuntza plaka',
    'Hazkuntza amaitu',
  ];
  return (
    <>
      <div className={extra.panelTabs} role="group" aria-label="Hezur luzearen pausoak">
        {names.map((n, i) => (
          <button key={n} type="button" className={styles.pick} aria-pressed={s === i} onClick={() => setS(i)}>
            {n}
          </button>
        ))}
      </div>
      <svg viewBox="0 0 620 330" role="img" aria-label={names[s]}>
        <text x="310" y="30" textAnchor="middle">
          {names[s]}
        </text>
        <path
          d="M100,140 C55,90 40,230 100,220 Q310,195 520,220 C580,230 565,90 520,140 Q310,165 100,140Z"
          fill={s === 5 ? '#efe3c4' : '#9a8fe0'}
        />
        {s > 0 && <rect x={s === 1 ? 270 : 145} y="156" width={s === 1 ? 80 : 330} height="45" rx="10" fill="#efe3c4" />}
        {s >= 3 && (
          <>
            <ellipse cx="85" cy="180" rx="25" ry="30" fill="#efe3c4" />
            <ellipse cx="535" cy="180" rx="25" ry="30" fill="#efe3c4" />
          </>
        )}
        {s === 5 && <path d="M100,160 L145,160 L145,199 L100,199Z M475,160 L520,160 L520,199 L475,199Z" fill="#efe3c4" />}
        <text x="95" y="90" textAnchor="middle">
          Epifisia
        </text>
        <text x="310" y="90" textAnchor="middle">
          Diafisia
        </text>
        <text x="525" y="90" textAnchor="middle">
          Epifisia
        </text>
        <text x="310" y="285" textAnchor="middle">
          {s === 5
            ? 'Plaka hezurtu; diafisia eta epifisiak fusionatu'
            : s >= 3
              ? 'Kartilagozko plaka epifisiaren eta diafisiaren artean'
              : 'Primarioa diafisian; epifisiak oraindik kartilago'}
        </text>
      </svg>
      <p className={extra.source}>
        Morea: kartilagoa · krema: hezurra. Zentro sekundarioak epifisietan, jaio ondoren. Hazkuntza plaka / epifisi orria (apunteetan
        «metafisia» ere) luzetarako hazkuntzarako mantendu; amaieran fusionatu. Normalean bi plaka; falangeetan bakarra aipatzen da (4).
      </p>
    </>
  );
}
function LimbSteps() {
  return (
    <svg viewBox="0 0 620 330" role="img" aria-label="Hastapen zilindrikotik hatz izpietara eta adarren kontrako biraketak">
      <path d="M45,65 L115,65 Q150,105 115,145 L45,145Z" fill="#e6a23c" />
      <path d="M230,70 L280,70 Q350,45 365,105 Q350,165 280,140 L230,140Z" fill="#e6a23c" />
      <path
        d="M450,75 L485,75 M450,92 L500,92 M450,109 L505,109 M450,126 L495,126 M450,143 L480,143"
        stroke="#e6a23c"
        strokeWidth="11"
        strokeLinecap="round"
      />
      <text x="100" y="195" textAnchor="middle">
        Hastapena
      </text>
      <text x="300" y="195" textAnchor="middle">
        Plaka
      </text>
      <text x="495" y="195" textAnchor="middle">
        Bost izpi
      </text>
      <text x="310" y="265" textAnchor="middle">
        Goikoa: 90° kanpora · behekoa: 90° barrura
      </text>
      <text x="310" y="310" textAnchor="middle">
        Lau ildo apoptotikoren artean hatzetako izpiak
      </text>
    </svg>
  );
}
