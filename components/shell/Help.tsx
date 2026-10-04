'use client';

import { useState, useSyncExternalStore, type ReactNode } from 'react';
import { categoryColor, categoryLabel } from '@/lib/sim/palette';
import type { StructureCategory } from '@/lib/sim/types';
import { KimuFace } from '@/components/kimu/KimuFace';
import { IconCalendar, IconClose, IconExpand, IconGuide, IconHelp, IconLayers, IconMore, IconNext, IconNotes, IconPlay, IconQuiz, IconSkipNext, IconTag, IconTarget, IconVoice, IconZoomIn, PlaneGlyph } from './icons';
import { IconRail } from './SidePanel';

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
  ['Frogatu', '«Aurkitu» eta «Galderak»: azterketa-motakoak. Beste tresnak (glosarioa, kronologia, leinuak, irudiak) «Tresnak» menuan daude, eta goiko «?» botoiak botoi bakoitzak zer egiten duen azaltzen du.'],
];

/** What every control on the study screen does, grouped by where it sits, each with the icon it shows. */
const CONTROLS: { area: string; items: { icon: ReactNode; name: string; text: string; key?: string }[] }[] = [
  {
    area: 'Goiko barra',
    items: [
      { icon: <KimuFace size={20} mood="happy" still />, name: 'Galdetu Kimuri', text: 'Galdetu edozer (euskaraz, gaztelaniaz edo ingelesez): azalpena hasten den urratsera eramango zaitu.', key: 'K' },
      { icon: <IconTarget size={16} />, name: 'Aurkitu', text: 'Egitura baten izena agertzen da: aurkitu irudian eta klikatu. Berriro sakatuta, jokoa amaitzen da.' },
      { icon: <IconQuiz size={16} />, name: 'Galderak', text: 'Azterketa-motako galderak, akats bakoitzaren azalpenarekin; huts egindakoak errepasatzeko ere bai.' },
      { icon: <IconRail open side="right" />, name: 'Laburpena', text: 'Eskuineko zutabea: etaparen gakoak, azterketarako datak eta egiturak. Berriro sakatuta, ezkutatzen da.', key: ']' },
      { icon: <IconNotes size={16} />, name: 'Apunteak', text: 'Eskuineko zutabea: jatorrizko apunteak, simulazioarekin batera argituta. Esaldi bat klikatuta, hara joaten da simulazioa.', key: 'N' },
      { icon: <IconMore size={16} />, name: 'Tresnak', text: 'Glosarioa, kronologia, leinuak, etiketarik gabeko irudiak eta foku modua.' },
      { icon: <IconHelp size={16} />, name: 'Laguntza', text: 'Orri hau.', key: '?' },
    ],
  },
  {
    area: 'Ezkerreko zutabea',
    items: [
      { icon: <IconRail open={false} />, name: 'Aurkibidea', text: 'Apunteen aurkibidea: etapak, apunteen atal bakoitzaren azpian. Tolestuta, atalen zenbakiak eta etapa bakoitzeko puntu bat geratzen dira (betea = ikusita, laranja = hemen zaude); sagua gainean jarrita, zerrenda osoa agertzen da.', key: '[' },
    ],
  },
  {
    area: 'Etaparen goiburua',
    items: [
      { icon: <span className="hc-pips" aria-hidden><i className="is-on" /><i /><i /></span>, name: 'Etapak', text: 'Puntu bakoitza gaiaren etapa bat da; klikatu bertara joateko. Ezkerreko aurkibideak etapa guztiak izenez erakusten ditu.' },
      { icon: <IconCalendar size={15} />, name: 'Egun-txipa', text: 'Zer dagoen egun horretan: zer den berria, zer dagoen jada eta zer desagertu edo eraldatu den.' },
      { icon: <span className="hc-q" aria-hidden>?</span>, name: 'Non nago?', text: 'Irudi txikiak zer ikusten duzun erakusten du: zein ebaki edo ikuspegi, 3D zirriborro batean, eta norabideak.' },
      { icon: <PlaneGlyph plane="sagitala" size={18} />, name: 'Ikuspegiak', text: 'Gauza bera beste ebaki edo handipen batean. Simulazioak berak aldatzen duenean, txartel batek azaltzen du.', key: '1–9' },
    ],
  },
  {
    area: 'Irudia',
    items: [
      { icon: <IconTag size={16} />, name: 'Etiketak', text: 'Egituren izenak erakutsi edo ezkutatu (ezkutatuta, zure burua probatzeko).', key: 'L' },
      { icon: <IconLayers size={16} />, name: 'Kolore-kodea', text: 'Kolore bakoitzak zer ehun edo orri esan nahi duen.' },
      { icon: <IconZoomIn size={16} />, name: 'Zooma', text: 'Handitu, txikitu edo irudia osorik ikusi. Arrastatuta mugitzen da.' },
      { icon: <IconExpand size={16} />, name: 'Pantaila osoa', text: 'Irudia ahalik eta handien, azalpena behean. F teklak gauza bera egiten du leihoaren barruan (foku modua). Irteteko: Esc, F edo tresnen azpiko botoia.', key: 'F' },
    ],
  },
  {
    area: 'Azalpena eta erreprodukzioa',
    items: [
      { icon: <span className="hc-next" aria-hidden>Hurrengoa <IconNext size={12} /></span>, name: 'Urratsak', text: 'Urratsez urrats aurrera edo atzera. Gidatuan, urratsa ikusita dagoenean «Jarraitu» argitzen da; arruntean, segundoak kontatzen ditu.', key: '← →' },
      { icon: <IconPlay size={14} />, name: 'Erreproduzitu', text: 'Etapa osoa martxan jarri edo pausatu. Hasieran, aurrebista labur bat.', key: 'Zuriunea' },
      { icon: <IconSkipNext size={15} />, name: 'Etapa', text: 'Aurreko edo hurrengo etapara salto. Barra zatitua: urrats bakoitza zati bat da; klikatu edo arrastatu.', key: 'Shift + ← →' },
      { icon: <IconVoice size={16} />, name: 'Ahotsa', text: 'Urrats bakoitza ahoz azaltzen da, irudiari begira egon zaitezen.' },
      { icon: <IconGuide size={16} />, name: 'Modua', text: 'Gidatua (mantso, galdera txikiekin), arrunta edo azkarra (errepasoa); baita abiadura eta etapak jarraian ere.', key: 'G' },
    ],
  },
];

type HelpTab = 'botoiak' | 'bidea' | 'teklak';

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
  ['N', 'Apunteak erakutsi / ezkutatu'],
  ['K', 'Galdetu Kimuri'],
  ['?', 'Laguntza hau'],
  ['Esc', 'Itxi fitxa edo leihoa'],
];

const LAYERS: StructureCategory[] = ['ektodermoa', 'mesodermoa', 'endodermoa', 'enbrioblastoa', 'trofoblastoa', 'enbrioi-kanpokoa', 'barrunbea', 'amarena'];

export function Help({ onClose, welcome }: { onClose: () => void; welcome?: boolean }) {
  const [full, setFull] = useState(!welcome);
  const [tab, setTab] = useState<HelpTab>('botoiak');
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
              Botoi bakoitza zertarako den
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
            <h2>Nola erabili EnbrioAtlas</h2>
          </div>
          <button className="icon-btn" onClick={onClose} aria-label="Itxi" title="Itxi (Esc)">
            <IconClose size={16} />
          </button>
        </header>
        <div className="tabs help-tabs" role="tablist" aria-label="Laguntza">
          {(
            [
              ['botoiak', 'Botoiak'],
              ['bidea', 'Nola ikasi'],
              ['teklak', 'Teklak eta koloreak'],
            ] as [HelpTab, string][]
          ).map(([id, label]) => (
            <button key={id} role="tab" aria-selected={tab === id} className={tab === id ? 'is-on' : ''} onClick={() => setTab(id)}>
              {label}
            </button>
          ))}
        </div>
        {tab === 'botoiak' && (
          <div className="help-controls" role="tabpanel">
            {CONTROLS.map((g) => (
              <section key={g.area}>
                <h3>{g.area}</h3>
                <dl>
                  {g.items.map((c) => (
                    <div key={c.name}>
                      <dt>
                        <span className="hc-icon">{c.icon}</span>
                        <b>{c.name}</b>
                        {c.key && <kbd>{c.key}</kbd>}
                      </dt>
                      <dd>{c.text}</dd>
                    </div>
                  ))}
                </dl>
              </section>
            ))}
          </div>
        )}
        {tab === 'bidea' && (
          <div className="help-grid is-one" role="tabpanel">
            <ol className="help-steps">
              {STEPS.map(([h, t]) => (
                <li key={h}>
                  <b>{h}</b>
                  <span>{t}</span>
                </li>
              ))}
            </ol>
          </div>
        )}
        {tab === 'teklak' && (
          <div className="help-grid" role="tabpanel">
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
            </section>
            <section>
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
        )}
        <footer className="help-foot">
          <button className="btn btn-light" onClick={onClose}>
            Ulertuta, hasi
          </button>
        </footer>
      </div>
    </div>
  );
}
