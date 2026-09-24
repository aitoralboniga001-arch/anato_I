import Link from 'next/link';
import type { ReactNode } from 'react';
import { appearances, structures } from '@/content/registry';
import { categoryColor } from '@/lib/sim/palette';
import { LandFoot, LandNav } from './LandNav';

/** Lineage tree node: a structure id (linked to its first stage) or a plain label, with children. */
type N = { id?: string; label?: string; note?: string; kids?: N[] };

const n = (id: string, kids?: N[], note?: string): N => ({ id, kids, note });

const EARLY: N[] = [
  n('blastozistoa', [
    n('enbrioblastoa', [n('epiblastoa', [n('amnioblastoak'), { label: 'Gastrulazioa →', note: 'hiru ernetze orriak' }]), n('hipoblastoa', [n('hasierako-bitelo-zakua'), n('heuser-mintza')])]),
    n('trofoblastoa', [n('zitotrofoblastoa', [n('biloxka-primarioa')]), n('sinzitiotrofoblastoa', [n('lakuak'), n('sare-lakunarra')])]),
  ]),
];

const LAYERS: { id: string; title: string; kids: N[] }[] = [
  {
    id: 'ektodermoa',
    title: 'Ektodermoa',
    kids: [
      n('azaleko-ektodermoa', [n('estomodeoa'), n('proktodeoa')], 'epidermisa, ilea, azazkalak'),
      n('plaka-neurala', [n('hodi-neurala', [n('prosentzefaloa'), n('mesentzefaloa'), n('erronbentzefaloa'), n('ornomuina')])]),
      n('gandor-neurala', [n('nerbio-kranialen-gongoilak'), n('gongoil-errakideoak'), n('giltzurrun-gaineko-muina'), n('schwann-zelulak'), n('melanozitoak'), n('buru-aurpegi-hezurrak'), n('odontoblastoak')]),
    ],
  },
  {
    id: 'mesodermo-intraenbrionarioa',
    title: 'Mesodermoa',
    kids: [
      n('notokorda'),
      n('mesodermo-paraxiala', [n('somitak', [n('esklerotoma', [n('ornoak'), n('saihetsak')]), n('dermatoma'), n('miotoma')])]),
      n('bitarteko-mesodermoa', [n('nefrotomak'), n('kordoi-nefrogenoa', [n('giltzurruna'), n('gonadak')])]),
      n('alboko-mesodermoa', [n('paretako-orria', [n('esternoia')]), n('errai-orria', [n('bihotz-hodia')]), n('enbrioi-barruko-zeloma', [n('perikardio-barrunbea'), n('pleura-barrunbea'), n('peritoneo-barrunbea')])]),
    ],
  },
  {
    id: 'endodermoa',
    title: 'Endodermoa',
    kids: [
      n('aurreko-hestea', [n('faringe-hestea', [n('faringe-poltsak'), n('hodi-tiroglosoa')]), n('arnas-hastapena')]),
      n('erdiko-hestea', [n('hodi-onfalomesenterikoa')]),
      n('atzeko-hestea', [n('kloaka')]),
    ],
  },
];

function Chip({ node }: { node: N }) {
  const s = node.id ? structures.get(node.id) : undefined;
  const label = s?.name ?? node.label ?? node.id;
  const color = s ? (s.color ?? categoryColor[s.category]) : 'var(--faint)';
  const first = node.id ? appearances.get(node.id)?.[0] : undefined;
  const body: ReactNode = (
    <>
      <i style={{ background: color }} />
      <span>{label}</span>
      {node.note && <em>{node.note}</em>}
    </>
  );
  return first ? (
    <Link className="ln-chip" href={`/astea/${first.week.week}?etapa=${first.stage.id}&egitura=${node.id}`} title={s?.definition}>
      {body}
    </Link>
  ) : (
    <span className="ln-chip is-plain" title={s?.definition}>
      {body}
    </span>
  );
}

function Tree({ nodes }: { nodes: N[] }) {
  return (
    <ul className="ln-tree">
      {nodes.map((node, i) => (
        <li key={(node.id ?? node.label ?? '') + i}>
          <Chip node={node} />
          {node.kids && <Tree nodes={node.kids} />}
        </li>
      ))}
    </ul>
  );
}

export function Lineage() {
  return (
    <div className="landing">
      <LandNav />
      <section className="ln-hero">
        <p className="eyebrow">Leinuak</p>
        <h1>Ernetze orrien leinuak</h1>
        <p className="hero-lead">
          Blastozistotik hiru ernetze orrietara, eta horietako bakoitzetik 4. asteko eratorrietara. Egitura bakoitzean klikatuz, simulagailuan lehen aldiz agertzen den etapa irekitzen da.
        </p>
      </section>

      <section className="ln-early">
        <div className="section-head">
          <p className="eyebrow">1.–2. asteak</p>
          <h2>Blastozistotik bi orriko diskora</h2>
        </div>
        <div className="ln-card">
          <Chip node={EARLY[0]} />
          <div className="ln-split">
            {EARLY[0].kids!.map((k) => (
              <Tree key={k.id} nodes={[k]} />
            ))}
          </div>
        </div>
      </section>

      <section className="land-section">
        <div className="section-head">
          <p className="eyebrow">3.–4. asteak</p>
          <h2>Hiru ernetze orriak eta haien eratorriak</h2>
          <p>Gastrulazioan epiblastoko zelulek lerro primitibotik inbaginatzen dute: endodermoa eta mesodermoa sortzen dira, eta gainazalean geratzen direnak ektodermo bihurtzen dira.</p>
        </div>
        <div className="ln-layers">
          {LAYERS.map((l) => (
            <article key={l.id} className="ln-layer" style={{ ['--hue' as string]: categoryColor[structures.get(l.id)?.category ?? 'prozesua'] }}>
              <header>
                <Chip node={{ id: l.id }} />
              </header>
              <Tree nodes={l.kids} />
            </article>
          ))}
        </div>
      </section>
      <LandFoot />
    </div>
  );
}
