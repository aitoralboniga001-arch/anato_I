import { getWeek } from './registry';

/** Reviewed animation windows, NOT biological dates or first-appearance guesses.
 * Times follow the scene geometry; beat identifies the corresponding original passage.
 * Add an entry only after checking both the scene and its narrative. Missing entries
 * deliberately fall back to an explanation, never to a purported formation movie.
 */
export interface Formation {
  structure: string;
  week: number;
  stage: string;
  view: string;
  beat: number;
  start: number;
  end: number;
  /** A whole structure may be drawn as its constituent parts (e.g. the definitive cord). */
  highlight?: readonly string[];
}

// Evidence: Cleavage.tsx (CAV_SEG/P_SEG), Day8.tsx, Day9.tsx (W),
// Day11_12.tsx (W), Gastrulation.tsx/GastrulationCells.tsx (GB),
// NotochordCells.tsx (NB), Neurulation.tsx (neuralAt/crestAppear),
// Stage2Somites.tsx (dayFor), Cord.tsx (trunkWrap/upWrap).
export const FORMATIONS: readonly Formation[] = [
  { structure: 'morula', week: 1, stage: 'segmentazioa', view: 'zelulak', beat: 3, start: .52, end: .8 },
  { structure: 'blastozistoa', week: 1, stage: 'blastozistoa', view: 'mozketa', beat: 3, start: .28, end: .7 },
  { structure: 'blastozelea', week: 1, stage: 'blastozistoa', view: 'mozketa', beat: 2, start: .28, end: .7 },
  { structure: 'zitotrofoblastoa', week: 2, stage: 'eguna-8', view: 'mozketa', beat: 0, start: 0, end: .2 },
  { structure: 'sinzitiotrofoblastoa', week: 2, stage: 'eguna-8', view: 'mozketa', beat: 0, start: 0, end: .2 },
  { structure: 'epiblastoa', week: 2, stage: 'eguna-8', view: 'diskoa', beat: 2, start: .24, end: .36 },
  { structure: 'hipoblastoa', week: 2, stage: 'eguna-8', view: 'diskoa', beat: 2, start: .24, end: .36 },
  { structure: 'amnios-barrunbea', week: 2, stage: 'eguna-8', view: 'diskoa', beat: 4, start: .46, end: .58 },
  { structure: 'amnioblastoak', week: 2, stage: 'eguna-8', view: 'diskoa', beat: 5, start: .61, end: .7 },
  { structure: 'bakuolak', week: 2, stage: 'eguna-9', view: 'lakuak', beat: 2, start: .27, end: .38 },
  { structure: 'lakuak', week: 2, stage: 'eguna-9', view: 'lakuak', beat: 3, start: .41, end: .48 },
  { structure: 'heuser-mintza', week: 2, stage: 'eguna-9', view: 'heuser', beat: 5, start: .55, end: .74 },
  { structure: 'hasierako-bitelo-zakua', week: 2, stage: 'eguna-9', view: 'heuser', beat: 6, start: .77, end: .82 },
  { structure: 'korion-barrunbea', week: 2, stage: 'eguna-11-12', view: 'mesodermoa', beat: 5, start: .53, end: .64 },
  { structure: 'somatopleura-kanpokoa', week: 2, stage: 'eguna-11-12', view: 'mesodermoa', beat: 6, start: .53, end: .7 },
  { structure: 'desidua-erreakzioa', week: 2, stage: 'eguna-11-12', view: 'desidua', beat: 8, start: .77, end: .96 },
  { structure: 'lerro-primitiboa', week: 3, stage: 'gastrulazioa', view: 'dortsala', beat: 1, start: .07, end: .125 },
  { structure: 'ildo-primitiboa', week: 3, stage: 'gastrulazioa', view: 'dortsala', beat: 2, start: .15, end: .195 },
  { structure: 'nodo-primitiboa', week: 3, stage: 'gastrulazioa', view: 'dortsala', beat: 3, start: .22, end: .275 },
  { structure: 'hobitxo-primitiboa', week: 3, stage: 'gastrulazioa', view: 'dortsala', beat: 3, start: .22, end: .275 },
  { structure: 'endodermoa', week: 3, stage: 'gastrulazioa', view: 'zelulak', beat: 6, start: .4, end: .61 },
  { structure: 'mesodermo-intraenbrionarioa', week: 3, stage: 'gastrulazioa', view: 'zelulak', beat: 7, start: .63, end: .755 },
  { structure: 'ektodermoa', week: 3, stage: 'gastrulazioa', view: 'zelulak', beat: 8, start: .77, end: .84 },
  { structure: 'notokorda-plaka', week: 3, stage: 'notokorda', view: 'zelulak', beat: 4, start: .47, end: .565 },
  { structure: 'notokorda', week: 3, stage: 'notokorda', view: 'zelulak', beat: 5, start: .59, end: .775 },
  { structure: 'ildo-neurala', week: 4, stage: 'neurulazioa', view: 'zeharkakoa', beat: 1, start: .11, end: .26 },
  { structure: 'tolesdura-neuralak', week: 4, stage: 'neurulazioa', view: 'zeharkakoa', beat: 2, start: .29, end: .405 },
  { structure: 'hodi-neurala', week: 4, stage: 'neurulazioa', view: 'zeharkakoa', beat: 3, start: .43, end: .76 },
  { structure: 'gandor-neurala', week: 4, stage: 'neurulazioa', view: 'zeharkakoa', beat: 4, start: .61, end: .655 },
  { structure: 'somitak', week: 4, stage: 'somitak', view: 'dortsala', beat: 1, start: .1, end: .26 },
  { structure: 'paretako-orria', week: 4, stage: 'mesodermoa-banatzen', view: 'zeharkakoa', beat: 5, start: .49, end: .7 },
  { structure: 'hasierako-zilbor-hestea', week: 6, stage: 'zilbor-hestea', view: 'sagitala', beat: 4, start: .47, end: .56 },
  { structure: 'behin-betiko-zilbor-hestea', week: 6, stage: 'zilbor-hestea', view: 'sagitala', beat: 6, start: .73, end: .98, highlight: ['behin-betiko-zilbor-hestea', 'wharton-gelatina', 'zilbor-hodiak'] },
];

const byStructure = new Map(FORMATIONS.map(f => [f.structure, f]));

/** Validate against current course content also when following an old saved chat/deep link. */
export function formationOf(id?: string | null): Formation | undefined {
  if (!id) return undefined;
  const f = byStructure.get(id);
  const stage = f && getWeek(f.week)?.stages.find(s => s.id === f.stage);
  return f && stage?.structures.includes(f.structure) && stage.beats[f.beat] && stage.views.some(v => v.id === f.view) ? f : undefined;
}

/** Reading-friendly, bounded playback; independent of auto-continue and guided tour holds. */
export function formationFrame(f: Formation, t: number, dt: number, speed: number) {
  const stage = getWeek(f.week)?.stages.find(s => s.id === f.stage);
  const seconds = Math.max(8, Math.min(22, (f.end - f.start) * (stage?.duration ?? 20) / .4));
  return Math.min(f.end, Math.max(f.start, t) + dt * Math.min(2, Math.max(.25, speed)) * (f.end - f.start) / seconds);
}
