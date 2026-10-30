'use client';
import Link from 'next/link';
import type { ShowInTimeline } from './kit/StudyRoom';
import styles from './eratorriak.module.css';
import extra from './kit/study.module.css';
export function HeartTubeFigures({ onShow }: { onShow: ShowInTimeline }) {
  return (
    <div className={extra.figureGrid}>
      <article className={styles.figCard}>
        <h4>Bi tolespen, bi ondorio</h4>
        <svg viewBox="0 0 620 350" role="img" aria-label="Zeharkako tolespena bi hodi fusionatzeko eta jaitsiera zefalokaudala">
          <text x="310" y="25" textAnchor="middle">
            Zeharkakoa: bi hodi → hodi bakarra
          </text>
          <path d="M110,80 L110,140 M200,80 L200,140 M450,80 L450,140" stroke="#f9a8d4" strokeWidth="22" />
          <path d="M275,110 L365,110" stroke="#9b7bf0" strokeWidth="3" />
          <path d="M355,103 L365,110 L355,117" fill="none" stroke="#9b7bf0" strokeWidth="3" />
          <text x="310" y="205" textAnchor="middle">
            Zefalokaudala: eskualdea kaudalera
          </text>
          <text x="100" y="265">
            Lepoa
          </text>
          <text x="430" y="315">
            Toraxa
          </text>
          <path d="M210,250 Q280,245 340,300 L390,300" fill="none" stroke="#e05592" strokeWidth="15" />
        </svg>
        <p>
          Eskualde kardiogenikoa hasieran plaka neuralaren kranialean eta mintz bukofaringeoaren bentralean dago. Garun xixkuen
          hazkundearekin lepotik toraxera jaisten da. Ez nahasi jaitsiera eta bi hodien fusioa (1).
        </p>
        <button type="button" className={styles.linkBtn} onClick={() => onShow(['endoR', 'endoL'], 1)}>
          Eskeman ikusi →
        </button>
      </article>
      <article className={styles.figCard}>
        <h4>Hiru geruza; gelatina ez da laugarren zelula-geruza</h4>
        <p>
          Barrutik kanpora: endokardioa → miokardioa → epikardioa (errai perikardioa). Miokardioak azido hialuronikotan aberatsa den
          matrizea / bihotz gelatina jariatzen du endokardioaren eta miokardioaren artean. Endokardio zelula batzuk gelatinara migratzen
          dira (1).
        </p>
        <p className={extra.source}>Arrosa argia: endokardioa · menda: gelatina · arrosa iluna: miokardioa · kanpoko arrosa: epikardioa.</p>
        <button type="button" className={styles.linkBtn} onClick={() => onShow(['endoR', 'endoL', 'myocard', 'epicard', 'mesocard'], 2)}>
          Eskeman ikusi →
        </button>
        <p>Mesokardio dortsala desagertu → perikardioaren zeharkako sinua. Bi muturrek lotuta jarraitzen dute.</p>
      </article>
      <article className={styles.figCard}>
        <h4>Sarrera eta irteera: noranzkoa da definizioa</h4>
        <svg viewBox="0 0 620 290" role="img" aria-label="Zain sinutik aorta arkuetara doan odol fluxua">
          <text x="310" y="30" textAnchor="middle">
            Zain bitelinoak + zilbor zainak + kardinal komunak
          </text>
          <text x="310" y="100" textAnchor="middle">
            Sinua → aurikula → bentrikulua → bulboa
          </text>
          <path d="M80,145 L530,145 L515,135 M530,145 L515,155" fill="none" stroke="#9b7bf0" strokeWidth="4" />
          <text x="310" y="215" textAnchor="middle">
            Aorta arkuak → bizkarraldeko aortak
          </text>
          <text x="310" y="265" textAnchor="middle">
            Arteria: bihotzetik irten · zaina: bihotzera itzuli
          </text>
        </svg>
        <p>
          Zilbor zainak: plazentatik odol oxigenatua. Bitelinoak eta kardinal komunak: oxigeno gutxikoa. Hasierako bihotzean nahasten dira;
          arteria/zain izenak ez du oxigenazioa definitzen (1–2).
        </p>
        <Link className={styles.linkBtn} href="/astea/10?etapa=zirkulazio-goiztiarra">
          Simulagailuan ikusi →
        </Link>
      </article>
      <article className={styles.figCard}>
        <h4>Sinua eskuinera, bi aurikula-pareta</h4>
        <svg viewBox="0 0 620 340" role="img" aria-label="Eskuineko sinu adarraren inkorporazioa eta ezkerreko hondarrak">
          <path d="M100,145 Q120,80 220,100 Q300,120 300,220 Q250,280 170,245Z" fill="#9b7bf0" />
          <path d="M300,220 Q360,270 420,220 L420,125 Q350,80 300,145Z" fill="#ef7d2d" />
          <text x="175" y="190" textAnchor="middle" style={{ fill: '#fff' }}>
            Atzeko lisoa
          </text>
          <text x="360" y="190" textAnchor="middle" style={{ fill: '#fff' }}>
            Trabekulatua
          </text>
          <text x="310" y="310" textAnchor="middle">
            Sinua + atal aurikularra → eskuineko aurikula
          </text>
        </svg>
        <p>
          Gandor terminala / bukaera gangarra bi atalen artean; goian nodulu sinusala. Trabekulatuan belarritxoa eta muskulu pektineoak.
          Ezkerreko sinu adarra ez da guztiz galtzen: sinu koronarioa eta zain laprana (3.4).
        </p>
        <button type="button" className={styles.linkBtn} onClick={() => onShow(['sinusR', 'atriumR', 'sinusCor', 'sinusOblique'], 5)}>
          Eskeman ikusi →
        </button>
        <p className={extra.source}>Koloreak jatorria adierazten du; irudia pareten osaeraren eskema da.</p>
      </article>
    </div>
  );
}
