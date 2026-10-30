/**
 * Lineage: which structure gives rise to which. One tree, used by the Eratorriak page (drawn as trees)
 * and by the structure passport (the "Nondik?" chain and the "Zertan bihurtzen da?" children).
 */
import { structures } from './registry';

/** Tree node: a structure id or a plain label, with children. `via` names the process on the edge. */
export type LNode = { id?: string; label?: string; note?: string; via?: string; kids?: LNode[] };

const n = (id: string, kids?: LNode[], extra?: { note?: string; via?: string }): LNode => ({ id, kids, ...extra });

export const EARLY: LNode = n('zigotoa', [
  n('blastomeroak', [
    n('morula', [
      n('blastozistoa', [
        n('enbrioblastoa', [
          n('epiblastoa', [n('amnioblastoak'), { label: 'Gastrulazioa →', note: 'hiru ernetze orriak' }]),
          n('hipoblastoa', [
            n('heuser-mintza', [
              n('enbrioi-kanpoko-mesodermoa', [n('somatopleura-kanpokoa'), n('esplaknopleura-kanpokoa'), n('finkapen-pedikulua'), n('korion-barrunbea', undefined, { via: 'barrunbe txikiak fusionatuz' })], { via: '11–12. egunak' }),
            ]),
          ]),
        ]),
        n('blastozelea', [n('hasierako-bitelo-zakua', [n('bitelo-zaku-sekundarioa', [n('kiste-exozelomikoak')], { via: 'hipoblasto zelula berriek estalita' })], { via: 'Heuser mintzak estalita' })]),
        n('trofoblastoa', [
          n('zitotrofoblastoa', [n('biloxka-primarioa', [n('biloxka-sekundarioa', [n('biloxka-tertziarioa')], { via: 'mesodermo ardatza' })])]),
          n('sinzitiotrofoblastoa', [n('lakuak', [n('sare-lakunarra')])]),
        ]),
      ]),
    ]),
  ]),
]);

export const LAYERS: { id: string; kids: LNode[] }[] = [
  {
    id: 'ektodermoa',
    kids: [
      n('azaleko-ektodermoa', [n('estomodeoa'), n('proktodeoa')], { note: 'epidermisa, ilea, azazkalak' }),
      n('plaka-neurala', [
        n('tolesdura-neuralak', [
          n('hodi-neurala', [n('prosentzefaloa'), n('mesentzefaloa'), n('erronbentzefaloa'), n('ornomuina')]),
          n('gandor-neurala', [n('nerbio-kranialen-gongoilak'), n('gongoil-errakideoak'), n('giltzurrun-gaineko-muina'), n('schwann-zelulak'), n('melanozitoak'), n('buru-aurpegi-hezurrak'), n('odontoblastoak')]),
        ]),
      ], { via: 'notokordak induzituta' }),
    ],
  },
  {
    id: 'mesodermo-intraenbrionarioa',
    kids: [
      n('notokorda'),
      n('mesodermo-paraxiala', [
        n('somitomeroak', [
          n('somitak', [n('esklerotoma', [n('ornoak'), n('saihetsak')]), n('dermatomiotoma', [n('dermatoma'), n('miotoma')])]),
        ]),
      ]),
      n('bitarteko-mesodermoa', [n('nefrotomak'), n('kordoi-nefrogenoa', [n('giltzurruna'), n('gonadak')])]),
      n('alboko-mesodermoa', [
        n('paretako-orria', [n('esternoia')]),
        n('errai-orria', [n('bihotz-hodia')]),
        n('enbrioi-barruko-zeloma', [n('perikardio-barrunbea'), n('pleura-barrunbea'), n('peritoneo-barrunbea')]),
      ]),
    ],
  },
  {
    id: 'endodermoa',
    kids: [
      n('aurreko-hestea', [n('faringe-hestea', [n('faringe-poltsak'), n('hodi-tiroglosoa')]), n('arnas-hastapena')]),
      n('erdiko-hestea', [n('hodi-onfalomesenterikoa')]),
      n('atzeko-hestea', [n('kloaka')]),
    ],
  },
];

/** Gastrulation links the early tree to the three layers: all three come from the epiblast. */
const GASTRULATION = LAYERS.map((l) => l.id);

export interface Edge {
  parent: string;
  via?: string;
}

const graph = (() => {
  const parent = new Map<string, Edge>();
  const kids = new Map<string, string[]>();
  const link = (p: string, c: string, via?: string) => {
    if (!parent.has(c)) parent.set(c, { parent: p, via });
    kids.set(p, [...(kids.get(p) ?? []), c]);
  };
  const walk = (node: LNode) => {
    for (const k of node.kids ?? []) {
      if (node.id && k.id) link(node.id, k.id, k.via);
      walk(k);
    }
  };
  walk(EARLY);
  for (const l of LAYERS) {
    link('epiblastoa', l.id, 'gastrulazioa');
    for (const k of l.kids) {
      if (k.id) link(l.id, k.id, k.via);
      walk(k);
    }
  }
  return { parent, kids };
})();

/** The chain of ancestors, oldest first, ending with the structure itself: zigotoa → … → id. */
export function ancestry(id: string): { id: string; via?: string }[] {
  const chain: { id: string; via?: string }[] = [];
  let cur: string | undefined = id;
  const guard = new Set<string>();
  while (cur && !guard.has(cur)) {
    guard.add(cur);
    const e = graph.parent.get(cur);
    chain.unshift({ id: cur, via: e?.via });
    cur = e?.parent;
  }
  return chain.length > 1 ? chain : [];
}

/** Everything a structure gives rise to, at any depth (gastrulation included). */
export function descendantsOf(id: string): string[] {
  const out: string[] = [];
  const walk = (p: string) => {
    for (const k of graph.kids.get(p) ?? []) {
      if (out.includes(k)) continue;
      out.push(k);
      walk(k);
    }
  };
  walk(id);
  return out.filter((k) => structures.has(k));
}

/** Direct derivatives drawn in the lineage tree. */
export const childrenOf = (id: string) => (graph.kids.get(id) ?? []).filter((k) => structures.has(k));

/** The germ layer a structure ultimately comes from (for the "zein orritatik?" questions). */
export function layerOf(id: string): string | null {
  const chain = ancestry(id).map((c) => c.id);
  return GASTRULATION.find((l) => chain.includes(l)) ?? null;
}

/** Every id placed in the lineage (used by tests to check they exist). */
export const lineageIds = () => [...new Set([...graph.parent.keys(), ...graph.kids.keys()])];
