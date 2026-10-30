'use client';
import { useState } from 'react';
import Link from 'next/link';
import type { ShowInTimeline } from './kit/StudyRoom';
import styles from './eratorriak.module.css';
import extra from './kit/study.module.css';
export function MuscleFigures({ onShow }: { onShow: ShowInTimeline }) {
  return (
    <div>
      <p className={styles.figCaption}>
        Apunteek diote ez dela muskulu guztien izenak ikasi beharrik (2.1.3; 2.2.1). Izen guztiak mantendu dira kontsultarako; lehenik
        jatorri, domeinu eta nerbioaren arteko lotura landu.
      </p>
      <div className={extra.figureGrid}>
        <article className={styles.figCard}>
          <h4>Somita → miotoma eta alboko migrazioa</h4>
          <Domains />
          <p>
            Dermomiotomaren atzeko ertzetako atze-erdialdeko eta aurre-alboko zelulak dermatomaren bentralera migratu: miotoma. Aurre-alboko
            batzuek alboko muga gurutzatu eta pareta orrira iristen dira. Han muskulu-zelulak somitatik datoz; ehun konektibozko patroia
            pareta orritik (2; 2.2).
          </p>
          <button type="button" className={styles.linkBtn} onClick={() => onShow(['deep', 'intercostal', 'wall', 'limb'], 2)}>
            Eskeman ikusi →
          </button>
        </article>
        <article className={styles.figCard}>
          <h4>Sustraia, enborra eta adar primarioa</h4>
          <Nerve />
          <p>
            Aurreko sustraitik axoi motoreak irten; atzeko sustraian gongoil espinala eta zuntz sentsorialak. Enborrean elkartu ondoren
            aurreko eta atzeko adar primarioak bereizten dira: BIETAN zuntz motore eta sentsorialak. Ez nahasi sustraia eta adar primarioa
            (2.2.2).
          </p>
          <p className={extra.source}>
            Gorria: motorra · urdina: sentsoriala · horia: enbor mistoa · morea: atzeko adar primarioa · berdea: aurrekoa.
          </p>
          <Link className={styles.linkBtn} href="/astea/9?etapa=nerbio-espinala">
            Simulagailuan ikusi →
          </Link>
        </article>
        <article className={styles.figCard}>
          <h4>Mioblastoa: fusionatu ala lotu?</h4>
          <svg
            viewBox="0 0 620 350"
            role="img"
            aria-label="Eskeletikoan nukleo ugariko zuntzaren fusioa eta miokardioan disko interkalarrak"
          >
            <text x="310" y="30" textAnchor="middle">
              Eskeletikoa: zelulak fusionatu
            </text>
            {[90, 170, 250].map((x) => (
              <g key={x}>
                <rect x={x} y="70" width="55" height="45" rx="20" fill="#e5484d" />
                <circle cx={x + 28} cy="92" r="6" fill="#522433" />
              </g>
            ))}
            <rect x="370" y="70" width="190" height="45" rx="20" fill="#e5484d" />
            {[400, 445, 490, 535].map((x) => (
              <circle key={x} cx={x} cy="92" r="6" fill="#522433" />
            ))}
            <text x="310" y="180" textAnchor="middle">
              Miokardioa: zelulak lotu, EZ fusionatu
            </text>
            {[120, 245, 370].map((x) => (
              <g key={x}>
                <rect x={x} y="225" width="125" height="50" rx="10" fill="#d6337a" />
                <circle cx={x + 62} cy="250" r="8" fill="#522433" />
              </g>
            ))}
            <path d="M245,225 L245,275 M370,225 L370,275" stroke="#fde68a" strokeWidth="5" />
            <text x="310" y="325" textAnchor="middle">
              Horia: disko interkalarrak · nukleoek bereizita jarraitzen dute
            </text>
          </svg>
          <p>
            Eskeletikoan miofibrillak eta 3. hilabetearen amaierarako ildaskak. Miokardioa ere ildaskatua da, baina zelulak disko
            interkalarren bidez atxikitzen dira (2; 4).
          </p>
        </article>
        <article className={styles.figCard}>
          <h4>Patroiaren iturria ez da muskulu-zelularena</h4>
          <svg viewBox="0 0 620 330" role="img" aria-label="Buruko eta gorputzeko ehun konektibozko patroiak eta mioblastoak">
            <text x="155" y="30" textAnchor="middle">
              BURUA
            </text>
            <text x="465" y="30" textAnchor="middle">
              PARETA ETA ADARRAK
            </text>
            <rect x="40" y="80" width="230" height="70" rx="10" fill="#2dd4bf" opacity=".3" />
            <rect x="350" y="80" width="230" height="70" rx="10" fill="#f9b4b4" opacity=".3" />
            <text x="155" y="120" textAnchor="middle">
              Gandor neuraleko patroia
            </text>
            <text x="465" y="120" textAnchor="middle">
              Pareta orriko patroia
            </text>
            {[100, 155, 210, 410, 465, 520].map((x) => (
              <ellipse key={x} cx={x} cy="235" rx="19" ry="12" fill="#e5484d" />
            ))}
            <text x="310" y="300" textAnchor="middle">
              Mioblastoak (paraxiala) patroi horietara iritsi eta garatu
            </text>
          </svg>
          <button type="button" className={styles.linkBtn} onClick={() => onShow(['ctHead', 'ctBody'], 3)}>
            Eskeman ikusi →
          </button>
          <p className={extra.source}>
            Gandor neuralaren berdea eta pareta orriaren arrosa: ehun konektiboa; gorria: muskulu-aitzindariak (2.1.4).
          </p>
        </article>
        <article className={styles.figCard}>
          <h4>Metameria edo nerbio sarea</h4>
          <svg viewBox="0 0 620 280" role="img" aria-label="Saihets arteko inerbazio segmentarioa eta gorputz adarretako sareak">
            <text x="155" y="30" textAnchor="middle">
              Toraxa: segmentarioa
            </text>
            <text x="465" y="30" textAnchor="middle">
              Adarrak: mailak nahastu
            </text>
            {[85, 145, 205].map((y) => (
              <g key={y}>
                <path d={`M50,${y} L250,${y}`} stroke="#fde047" strokeWidth="6" />
                <path d={`M355,${y} Q455,145 560,${y}`} stroke="#fde047" strokeWidth="6" />
              </g>
            ))}
            <text x="310" y="270" textAnchor="middle">
              Maila desberdinetako zuntz motoreak → nerbio jakinak
            </text>
          </svg>
          <p>
            Goiko adarrean: erradiala, ertaina, kubitala. Behekoan: femorala, ziatikoa, bultzatzailea. Bizkarreko sakon luzeetara ere
            hainbat mailatako zuntzak iristen dira (2.2.2).
          </p>
        </article>
        <article className={styles.figCard}>
          <h4>Bihotzaren eroapena: muskulu espezializatua</h4>
          <svg viewBox="0 0 620 330" role="img" aria-label="Nodulu sinusaletik Purkinje sarera doan eroapen sekuentzia">
            <text x="310" y="30" textAnchor="middle">
              Nodulu sinusala (eskuineko aurikula)
            </text>
            <text x="310" y="90" textAnchor="middle">
              Nodoen arteko traktuak
            </text>
            <text x="310" y="150" textAnchor="middle">
              Nodulu aurikulubentrikularra
            </text>
            <text x="310" y="210" textAnchor="middle">
              His faszikulua → eskuineko / ezkerreko adarrak
            </text>
            <text x="310" y="285" textAnchor="middle">
              Purkinje sarea · endokardio azpian
            </text>
            {[42, 102, 162, 224].map((y) => (
              <path
                key={y}
                d={`M310,${y} L310,${y + 23} M304,${y + 17} L310,${y + 23} L316,${y + 17}`}
                fill="none"
                stroke="#67e8f9"
                strokeWidth="3"
              />
            ))}
          </svg>
          <p>Barneko sistema: kinadak sortu eta garraiatu. Kanpoko sinpatiko/parasinpatikoak sistema erregulatzen du. Biak bereizi (4).</p>
          <button type="button" className={styles.linkBtn} onClick={() => onShow(['cardiac', 'conduct'], 4)}>
            Eskeman ikusi →
          </button>
        </article>
      </div>
      <details className={styles.limbs}>
        <summary>
          Kontsultarako: muskulu talde gehiago eta nerbio-egitura <small>2.1–2.2</small>
        </summary>
        <p>
          Murtsikatzaileak: loki muskulua, maseterra, alboko eta erdialdeko pterigoideoak. Primaxial migratuen taulan bizkarraldeko muskulu
          zabala ere agertzen da. Abdominalak: kanpoko laprana, barruko laprana, zeharkakoa. Ez dira izen guztiak buruz ikasi behar (2.1.3;
          2.2.1).
        </p>
        <p>
          Ornomuinaren gai grisa H/tximeleta itxurakoa: aurreko adar motoreak, atzeko sentsorialak eta, ez beti, alboko begetatiboak. Erdian
          ependimo hodia; kanpoan gai zuriko aurreko, alboko eta atzeko kordoiak, goranzko/beheranzko traktuekin. Gongoil espinaleko luzapen
          zentripetoak informazioa ornomuinera eta zentrifugoak periferiatik somara garraiatzen du (2.2.2).
        </p>
        <p>
          Kokapenari buruzko desadostasuna: 9. gaiaren 2.1.3ko prosak beheko adarrean tolestatzailea aurrean eta hedatzailea atzean jartzen
          ditu, eta goikoan alderantziz (w9/2.1.3/p5/s3). 8. gaiaren 4ko biraketaren ondorengo azalpenak kontrako banaketa ematen du. Bi
          formulazioak ez dira hemen baieztapen bakar batean nahastu; irakaslearekin argitzea komeni da.{' '}
          <Link href="/astea/9?etapa=ehun-konektiboa">Biraketa simulagailuan →</Link>
        </p>
      </details>
      <details className={styles.limbs}>
        <summary>
          Aortaren muskulu leuna: apunteen formulazioa <small>3</small>
        </summary>
        <p>
          Azalpen zehatzak dio gaur egun pareta orriko eta gandor neuraleko zelulen jatorria proposatzen dela (w9/3/p8/s4). Ondorengo
          oharrak alboko mesodermoa ukatzen du (w9/3/p9/s1). Taulak azalpen zehatza mantentzen du, proposamen gisa, ez gorputzeko odol-hodi
          guztietarako ziurtasun unibertsal gisa.
        </p>
      </details>
    </div>
  );
}
function Domains() {
  const [nerve, setNerve] = useState(false);
  return (
    <>
      <div className={styles.toolbar} role="group" aria-label="Ebakiaren kolore irizpidea">
        <button type="button" aria-pressed={!nerve} onClick={() => setNerve(false)}>
          Domeinua
        </button>
        <button type="button" aria-pressed={nerve} onClick={() => setNerve(true)}>
          Inerbazioa
        </button>
      </div>
      <svg viewBox="0 0 620 420" role="img" aria-label="Somitaren alboko muga eta bi sailkapenen zeharkako ebakia">
        <path d="M70,170 Q110,70 310,80 Q510,70 550,170 L530,290 Q310,405 90,290Z" fill="#3a2a36" stroke="#6b5566" strokeWidth="3" />
        <ellipse cx="310" cy="140" rx="35" ry="45" fill="#3a5fd9" />
        <circle cx="310" cy="205" r="13" fill="#a78bfa" />
        <ellipse cx="310" cy="295" rx="55" ry="40" fill="#e7c45f" />
        {[150, 410].map((x) => (
          <g key={x}>
            <path
              d={`M${x},130 Q${x + 30},100 ${x + 60},130 L${x + 60},185 Q${x + 30},210 ${x},185Z`}
              fill={nerve ? '#d946ef' : '#3b82f6'}
            />
            <path d={`M${x},200 Q${x + 30},180 ${x + 60},200 L${x + 60},240 L${x},240Z`} fill={nerve ? '#10b981' : '#3b82f6'} />
          </g>
        ))}
        <path d="M90,250 Q160,285 210,310 M530,250 Q460,285 410,310" stroke={nerve ? '#10b981' : '#f59e0b'} strokeWidth="28" fill="none" />
        <path d="M120,110 Q85,200 140,280 M500,110 Q535,200 480,280" fill="none" stroke="#4ade80" strokeWidth="3" />
        <text x="310" y="35" textAnchor="middle">
          Atzea goian · aurrea behean
        </text>
        <text x="310" y="380" textAnchor="middle">
          {nerve ? 'Morea: atzeko adarra · berdea: aurreko adarra' : 'Urdina: primaxiala · anbarra: abaxiala'}
        </text>
        <text x="310" y="410" textAnchor="middle">
          Lerro berde mehea: somitaren alboko muga
        </text>
      </svg>
      <p className={extra.source}>
        Zeharkako ebaki eskematikoa. Goiko primaxial sakona epaxiala; primaxial bentraleko saihets artekoa hipaxiala. Hodi neural urdina,
        notokorda morea, heste horia: testuingurua.
      </p>
    </>
  );
}
function Nerve() {
  return (
    <svg viewBox="0 0 620 380" role="img" aria-label="Aurreko eta atzeko sustraiak enborrean batu eta bi adar primarioetan banatzen dira">
      <ellipse cx="130" cy="180" rx="80" ry="110" fill="#e2e8f0" />
      <path d="M95,125 Q130,155 165,125 L160,230 Q130,205 100,230Z" fill="#9aa3b8" />
      <path d="M165,145 Q245,90 320,180" stroke="#60a5fa" strokeWidth="6" fill="none" />
      <ellipse cx="250" cy="125" rx="18" ry="12" fill="#60a5fa" />
      <path d="M165,220 Q245,275 320,180" stroke="#f87171" strokeWidth="6" fill="none" />
      <path d="M320,180 L415,180" stroke="#fde047" strokeWidth="9" />
      <path d="M415,180 Q460,100 550,100" stroke="#d946ef" strokeWidth="6" fill="none" />
      <path d="M415,180 Q460,260 550,260" stroke="#10b981" strokeWidth="6" fill="none" />
      <text x="250" y="55" textAnchor="middle">
        Atzeko sustraia + gongoila
      </text>
      <text x="250" y="320" textAnchor="middle">
        Aurreko sustraia
      </text>
      <text x="490" y="55" textAnchor="middle">
        Atzeko adar primarioa
      </text>
      <text x="490" y="320" textAnchor="middle">
        Aurreko adar primarioa
      </text>
      <text x="365" y="150" textAnchor="middle">
        Enborra
      </text>
      <text x="310" y="375" textAnchor="middle">
        Sustraiak lehenik; adar primarioak enborretik ondoren
      </text>
    </svg>
  );
}
