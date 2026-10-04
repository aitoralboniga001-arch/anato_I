import Link from 'next/link';
import type { ReactNode } from 'react';
import { appearances, structures } from '@/content/registry';
import { categoryColor } from '@/lib/sim/palette';
import { LandFoot, LandNav } from './LandNav';
import { EARLY as ROOT, LAYERS, type LNode } from '@/content/lineage';

/** The page starts the early tree at the blastocyst (cleavage is shown in the simulator). */
const EARLY: N[] = [findNode(ROOT, 'blastozistoa') ?? ROOT];

function findNode(node: LNode, id: string): LNode | null {
  if (node.id === id) return node;
  for (const k of node.kids ?? []) {
    const f = findNode(k, id);
    if (f) return f;
  }
  return null;
}

type N = LNode;

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
    <div className="landing ln-page">
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
