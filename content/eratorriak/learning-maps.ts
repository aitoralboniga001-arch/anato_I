import { MIGRATIONS, type Flow, type MNode } from '../migrations';

export interface LearningMap {
  id: string;
  week: number;
  title: string;
  roots: MNode[];
  details: Flow[];
  flowIds: string[];
}

type Group = [week: number, id: string, title: string, flows: string[]];
const GROUPS: Group[] = [
  [7, 'zeloma', 'Tolespenak, zeloma eta barrunbeen banaketa', ['zeloma-banatu', 'erretenen-kokapen-espaziala', 'tolespenen-ondorioak', 'zelomaren-mugak']],
  [7, 'diafragma', 'Diafragmaren eraketa eta jaitsiera', ['septum-jaitsi', 'miozitoak-migratu', 'diafragma']],
  [7, 'serosak', 'Serosak eta arnas-hastapena', ['pleura-perikardio-orriak', 'arnas-hastapena']],
  [7, 'peritoneoa', 'Peritoneoarekiko kokapena eta finkapena', ['peritoneo-atzeko', 'peritoneo-kokapenak']],
  [8, 'jatorriak', 'Hezur-ehunaren jatorriak eta hezurtzapena', ['mesenkima-iturriak', 'hezurtzapen-motak', 'gandor-neuralaren-ehunak']],
  [8, 'kraneoa', 'Garezurra: jatorriak, kartilagoak eta hezurrak', ['gandor-neurokraneoa', 'gandor-errai-kraneoa', 'paraxiala-burezurra', 'okzipital-oinaldea', 'kondrokraneoa-orientatu', 'kondrokraneo-parekatzeak']],
  [8, 'ardatza', 'Ornoak, diskoak eta saihetsak', ['esklerotoma-ornoak', 'esklerotoma-saihetsak']],
  [8, 'adarrak', 'Gorputz-adarrak, gerrikoak eta esternoia', ['paretako-orria-hezurrak', 'adar-hastapenen-egutegia']],
  [9, 'ehunak', 'Muskuluen eta ehun konektiboaren jatorriak', ['muskulu-motak', 'ehun-konektiboa', 'miokardioa']],
  [9, 'burua', 'Buruko muskuluak eta begiaren inerbazioa', ['somitomeroak', 'begiko-nerbio-motorrak']],
  [9, 'arkuak', 'Arkuak, mihia eta nerbio motorrak', ['somita-okzipitalak', 'aurpegi-eta-bago-nerbioak', 'arkuen-nerbio-adarrak']],
  [9, 'gorputza', 'Miotoma eta gorputzeko muskulu-domeinuak', ['somita-muskulu-migrazioa', 'domeinu-primaxiala', 'domeinu-abaxiala']],
  [10, 'hodia', 'Eskualde kardiogenikotik bihotz-hodira', ['eskualde-kardiogenikoa', 'bihotza-jaitsi', 'bihotzaren-erreferentzia-espazialak']],
  [10, 'pareta', 'Bihotz-pareta eta mesokardioa', ['bihotz-geruzak', 'mesokardioa']],
  [10, 'lakioa', 'Lakioa: noranzkoa, mugimenduak eta eratorriak', ['lakio-mugimenduak', 'lakio-atalak', 'bihotz-hodiaren-orientazioa']],
  [10, 'balbulak', 'Zain-balbulak eta septum secunduma', ['zain-balbulak', 'septum-secundum-fusioa']],
  [11, 'aurikulak', 'Aurikulak: paretak, trenkadak eta itxiera', ['aurikula-arteko-trenkada', 'eskuineko-aurikula', 'ezkerreko-aurikula', 'septuen-erlazioak', 'zain-balbulen-fusioak']],
  [11, 'ab', 'Kanal aurikulubentrikularra eta balbulak', ['erreten-ab']],
  [11, 'bentrikuluak', 'Bentrikuluak eta haien arteko trenkada', ['bentrikulu-arteko-trenkada', 'eskuineko-bentrikulua', 'ezkerreko-bentrikulua', 'trenkaden-kokapen-espaziala']],
  [11, 'irteerak', 'Arteria-irteerak eta balbula semilunarrak', ['atal-bulbarra-trenkadak', 'balbula-semilunarrak', 'irteera-bideen-banaketa']],
  [12, 'aorta', 'Arku aortikoak eta aorta helduaren osagaiak', ['aorta-arkuak', 'aorta-zakua', 'makoa', 'eskuineko-subklabioa', 'barneko-karotida', 'erlazioak-arku-aortikoak']],
  [12, 'arteriak', 'Arteria-adarrak eta nerbio atzerakariak', ['nerbio-atzerakariak', 'bitelo-arteriak', 'segmentu-arteko-arteriak', 'zilbor-iliakoak', 'ardatz-arteria', 'erlazioak-arteria-konexioak', 'atzerakariaren-erlazio-heldua']],
  [12, 'faringea', 'Faringe-poltsak, arkuak eta mintzak', ['erlazioak-faringe-poltsak', 'erlazioak-faringe-arkuak-eta-mintzak']],
  [12, 'aurpegia', 'Aurpegia, ahosabaia eta mihia', ['erlazioak-aurpegia-eta-mihia', 'ahosabaiaren-garapena', 'mihi-motorearen-jatorria']],
  [13, 'bitelinoak', 'Gibela, porta-sistema eta zilborreko zainak', ['zain-bitelinoak', 'zilbor-zainak']],
  [13, 'kardinalak', 'Kaba zainak, anastomosiak eta azigos sistema', ['beheko-kaba', 'anastomosiak', 'azigos', 'hemiazigos', 'goiko-kaba', 'aurreko-kardinalak', 'zain-sinu-ezkerra', 'erlazioak-zain-sistemen-eratorriak', 'erlazioak-beheko-kabaren-atalak']],
  [13, 'jaiotza', 'Fetuaren zirkulazioa eta jaiotzako aldaketak', ['jaiotza', 'erlazioak-fetuaren-zirkulazioa', 'erlazioak-jaiotzako-aldaketak']],
  [13, 'linfa', 'Linfa-sistemaren jatorria eta drainatzea', ['linfa']],
  [14, 'hestea', 'Heste-hodia: jatorria, lurraldeak eta eratorriak', ['heste-hodiaren-eraketa', 'digestio-arterien-lurraldeak', 'erlazioak-hesteen-eratorriak']],
  [14, 'lakioa', 'Heste-lakioaren adarrak, biraketa eta itzulera', ['lakioaren-ibilbidea', 'erlazioak-heste-lakioa']],
  [14, 'mesoak', 'Urdaila, mesogastrioak eta poltsa omentala', ['urdailaren-biraketa', 'erlazioak-mesogastrioen-eratorriak', 'erlazioak-poltsa-omentala']],
  [14, 'guruinak', 'Gibela, area eta digestio-egituren kokapena', ['gibel-area-garapena', 'digestio-egituren-kokapena']],
];

const clone = (node: MNode): MNode => ({ ...node, ...(node.kids ? { kids: node.kids.map(clone) } : {}) });
const identity = ({ kids: _kids, ...node }: MNode) => JSON.stringify([node.id, node.label, node.note, node.via, node.move, node.gone]);

/** Only identical node/edge metadata can coalesce; different qualifications remain separate. */
export function mergeBranches(nodes: MNode[]): MNode[] {
  const result: MNode[] = [];
  for (const node of nodes) {
    const existing = result.find((item) => identity(item) === identity(node));
    if (existing) {
      if (node.kids?.length) existing.kids = mergeBranches([...(existing.kids ?? []), ...node.kids]);
    } else result.push({ ...clone(node), ...(node.kids ? { kids: mergeBranches(node.kids) } : {}) });
  }
  return result;
}

/** A convergence is shown as a whole with explicitly labelled constituent origins.
 * The original incoming edges and the converging layout remain intact in details.
 */
export function overviewRoots(flow: Flow): MNode[] {
  if (!flow.join) return flow.roots.map(clone);
  return [{ ...clone(flow.join), kids: [
    ...(flow.join.kids ?? []).map(clone),
    ...flow.roots.map((root) => ({ label: 'Jatorria / osagaia', via: 'osagaia', kids: [clone(root)] })),
  ] }];
}

export const LEARNING_MAPS: LearningMap[] = GROUPS.map(([week, id, title, ids]) => {
  const topic = MIGRATIONS.find((item) => item.week === week);
  const details = ids.map((flowId) => {
    const flow = topic?.flows.find((item) => item.id === flowId);
    if (!flow) throw new Error(`Unknown learning-map flow: ${week}/${flowId}`);
    return flow;
  });
  return { id: `mapa-${week}-${id}`, week, title, roots: mergeBranches(details.flatMap(overviewRoots)), details, flowIds: [...ids] };
});
