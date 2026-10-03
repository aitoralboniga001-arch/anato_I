'use client';

import { useState, useSyncExternalStore } from 'react';
import { categoryColor, categoryLabel } from '@/lib/sim/palette';
import type { StructureCategory } from '@/lib/sim/types';
import { IconClose } from './icons';

const SEEN = 'enbrioatlas:help-seen';
const listeners = new Set<() => void>();
const subscribe = (cb: () => void) => {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
};
const readSeen = () => {
  try {
    return window.localStorage.getItem(SEEN) === '1';
  } catch {
    return true;
  }
};
const markSeen = () => {
  try {
    window.localStorage.setItem(SEEN, '1');
  } catch {
    // Storage unavailable: the guide simply opens again next time.
  }
  listeners.forEach((l) => l());
};

/** A short welcome opens by itself on the first visit; the full sheet only from "?". Third value: first visit. */
export function useHelpOnce(): [boolean, (v: boolean) => void, boolean] {
  const seen = useSyncExternalStore(subscribe, readSeen, () => true);
  const [open, setOpen] = useState(false);
  return [
    open || !seen,
    (v: boolean) => {
      if (!v) markSeen();
      setOpen(v);
    },
    !seen,
  ];
}

/** First visit: three things to know, nothing more (the rest is one click away). */
const WELCOME: [string, string][] = [
  ['Ikusi', 'Sakatu ▶. Etapa bakoitza urratsez urrats doa: testua eta animazioa batera, eta urrats bakoitzaren amaieran galdera txiki bat.'],
  ['Ulertu', 'Klikatu edozein egitura haren fitxa ikusteko. Irudiaren gaineko koadroak ebakia non dagoen erakusten du, eta egun-txipak zer dagoen une horretan.'],
  ['Frogatu', '«Aurkitu» eta «Galderak»: azterketa-motakoak. Beste tresnak (glosarioa, kronologia, leinuak, irudiak) ⋯ menuan daude.'],
];

const STEPS: [string, string][] = [
  ['Aurrebista', 'Etapa bakoitza prozesu osoaren ikuspegi labur batekin hasten da. Irakurri lasai eta sakatu «Hasi».'],
  ['Urratsez urrats', 'Testua eta animazioa batera doaz: lerro lodia da ideia nagusia, azpian zer gertatu den. «Gakoa» eta «Kontuz» ere urrats berean.'],
  ['Izen azpimarratuak', 'Testuko egitura-izen bakoitza bere kolorez azpimarratuta dago: sagua gainetik pasatuta, egitura irudian argitzen da; klik eginda, haren fitxa irekitzen da.'],
  ['Hiru modu', 'Beheko eskuineko botoiak aukeratzen du (G tekla): «Gidatua»: mantso, urrats bakoitzean gelditu, egiturak banan-banan eta galdera txikiak. «Arrunta»: jarraian. «Azkarra»: prozesu osoa minutu batean baino gutxiagoan, errepasatzeko. Bertan: abiadura eta ahotsa.'],
  ['Egitura baten fitxa', 'Klikatu edozein egitura: zer den, noiz agertzen den, non dagoen, nondik datorren, nola sortzen den eta zertan bihurtzen den.'],
  ['Denboran atzera', '«Ikusi nola sortzen den» sakatuta, egitura sortzen den urratsera salto egiten da; «Bueltatu» sakatuta, zeunden lekura itzultzen zara.'],
  ['Frogatu', '«Aurkitu»: egitura irudian topatu. «Galderak»: azterketa-motako galderak, akatsaren azalpenarekin.'],
];

const KEYS: [string, string][] = [
  ['Zuriunea', 'Erreproduzitu / pausatu'],
  ['← →', 'Aurreko / hurrengo urratsa'],
  ['Shift + ← →', 'Aurreko / hurrengo etapa'],
  ['1–9', 'Ikuspegia aldatu (mozketak)'],
  ['G', 'Modua aldatu: gidatua → arrunta → azkarra'],
  ['L', 'Etiketak erakutsi / ezkutatu'],
  ['F', 'Foku modua: eszena handia, azalpena beti beheko txartelean'],
  ['[  ]', 'Etapen zerrenda / azalpen-panela tolestu'],
  ['Esc', 'Itxi fitxa edo leihoa'],
];

const LAYERS: StructureCategory[] = ['ektodermoa', 'mesodermoa', 'endodermoa', 'enbrioblastoa', 'trofoblastoa', 'enbrioi-kanpokoa', 'barrunbea', 'amarena'];

export function Help({ onClose, welcome }: { onClose: () => void; welcome?: boolean }) {
  const [full, setFull] = useState(!welcome);
  if (!full)
    return (
      <div className="modal-backdrop" onClick={onClose}>
        <div className="modal help help-welcome" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="Ongi etorri">
          <header className="help-head">
            <div>
              <p className="kicker">Ongi etorri</p>
              <h2>Hiru gauza, eta hasi</h2>
            </div>
            <button className="icon-btn" onClick={onClose} aria-label="Itxi" title="Itxi (Esc)">
              <IconClose size={16} />
            </button>
          </header>
          <ol className="help-steps">
            {WELCOME.map(([h, t]) => (
              <li key={h}>
                <b>{h}</b>
                <span>{t}</span>
              </li>
            ))}
          </ol>
          <footer className="help-foot">
            <button className="btn ghost small" onClick={() => setFull(true)}>
              Laguntza osoa (koloreak, teklak…)
            </button>
            <button className="btn btn-light" onClick={onClose} autoFocus>
              Hasi
            </button>
          </footer>
        </div>
      </div>
    );
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal help" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="Laguntza">
        <header className="help-head">
          <div>
            <p className="kicker">Laguntza</p>
            <h2>Nola ikasi EnbrioAtlas-ekin</h2>
          </div>
          <button className="icon-btn" onClick={onClose} aria-label="Itxi" title="Itxi (Esc)">
            <IconClose size={16} />
          </button>
        </header>
        <div className="help-grid">
          <section>
            <h3>Ikasteko bidea</h3>
            <ol className="help-steps">
              {STEPS.map(([h, t]) => (
                <li key={h}>
                  <b>{h}</b>
                  <span>{t}</span>
                </li>
              ))}
            </ol>
          </section>
          <section>
            <h3>Kolore-kodea</h3>
            <ul className="help-colors">
              {LAYERS.map((c) => (
                <li key={c}>
                  <i style={{ background: categoryColor[c] }} />
                  {categoryLabel[c]}
                </li>
              ))}
            </ul>
            <h3>Lasterbideak</h3>
            <dl className="help-keys">
              {KEYS.map(([k, v]) => (
                <div key={k}>
                  <dt>
                    <kbd>{k}</kbd>
                  </dt>
                  <dd>{v}</dd>
                </div>
              ))}
            </dl>
          </section>
        </div>
        <footer className="help-foot">
          <button className="btn btn-light" onClick={onClose}>
            Ulertuta, hasi
          </button>
        </footer>
      </div>
    </div>
  );
}
