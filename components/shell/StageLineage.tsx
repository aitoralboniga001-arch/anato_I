'use client';

import Link from 'next/link';
import { structures } from '@/content/registry';
import { EARLY, LAYERS, ancestry, type LNode } from '@/content/lineage';
import { categoryColor } from '@/lib/sim/palette';

const ROOTS: LNode[] = [EARLY, ...LAYERS.map((l) => ({ id: l.id, kids: l.kids }))];

const count = (node: LNode, here: Set<string>): number => (node.id && here.has(node.id) ? 1 : 0) + (node.kids ?? []).reduce((a, k) => a + count(k, here), 0);

/** The smallest branch of the lineage that holds the stage's structures (null when fewer than two are in it). */
export function branchOf(ids: readonly string[]): LNode | null {
  const here = new Set(ids);
  let best: LNode | null = null;
  let hits = 0;
  for (const r of ROOTS) {
    const c = count(r, here);
    if (c > hits) {
      best = r;
      hits = c;
    }
  }
  if (!best || hits < 2) return null;
  // Walk down while a single child holds every hit and the node itself is not one.
  for (;;) {
    if (best.id && here.has(best.id)) break;
    const holding: LNode[] = (best.kids ?? []).filter((k) => count(k, here) > 0);
    if (holding.length !== 1 || count(holding[0], here) < hits) break;
    best = holding[0];
  }
  return best;
}

function Node({ node, here, onSelect }: { node: LNode; here: Set<string>; onSelect: (id: string) => void }) {
  const s = node.id ? structures.get(node.id) : undefined;
  const on = !!node.id && here.has(node.id);
  const label = s?.name ?? node.label ?? node.id;
  return (
    <li>
      {node.via && <span className="lm-via">{node.via}</span>}
      {s ? (
        <button className={`lm-chip${on ? ' is-here' : ''}`} onClick={() => onSelect(s.id)} title={s.definition}>
          <i style={{ background: s.color ?? categoryColor[s.category] }} />
          {label}
        </button>
      ) : (
        <span className="lm-chip is-plain">{label}</span>
      )}
      {node.note && <em className="lm-note">{node.note}</em>}
      {node.kids && (
        <ul>
          {node.kids.map((k, i) => (
            <Node key={(k.id ?? k.label ?? '') + i} node={k} here={here} onSelect={onSelect} />
          ))}
        </ul>
      )}
    </li>
  );
}

/**
 * "Leinuak" inside the simulator: the branch of the lineage this stage works on, with its structures
 * lit, so the student sees where each one comes from and what it becomes without leaving the scene.
 */
export function StageLineage({ ids, root, onSelect }: { ids: readonly string[]; root: LNode; onSelect: (id: string) => void }) {
  const here = new Set(ids);
  const from = root.id ? ancestry(root.id).slice(0, -1) : [];
  return (
    <div className="info-scroll lm">
      <p className="info-hint">Etapa honetako egiturak argituta. Klikatu fitxa irekitzeko.</p>
      {from.length > 0 && (
        <p className="lm-from">
          {from.map((a) => structures.get(a.id)?.name ?? a.id).join(' → ')} →
        </p>
      )}
      <ul className="lm-tree">
        <Node node={root} here={here} onSelect={onSelect} />
      </ul>
      <Link className="lm-all" href="/leinuak">
        Leinu guztiak ikusi <span aria-hidden>→</span>
      </Link>
    </div>
  );
}
