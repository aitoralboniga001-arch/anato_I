import { weeks } from '@/content/registry';
import { NOTES, type NotesSection } from '@/content/notes';
import { w1 } from './w1';
import { w2 } from './w2';
import { w3 } from './w3';
import { w4 } from './w4';
import { w5 } from './w5';
import { w6 } from './w6';
import { w7 } from './w7';
import { w8 } from './w8';
import { w9 } from './w9';
import { w10 } from './w10';
import { w11 } from './w11';
import { w12 } from './w12';

export interface NotesPart { text: string; b?: boolean; i?: boolean }
export interface NotesSentence { id: string; parts: NotesPart[] }
export interface NotesBlock {
  id: string;
  kind: 'title' | 'toc' | 'h1' | 'h2' | 'p' | 'li' | 'caption';
  section: string;
  sentences: NotesSentence[];
}
export interface NotesAnchor { week: number; stageId: string; beat: number }
const documents: Record<number, NotesBlock[]> = { 1: w1, 2: w2, 3: w3, 4: w4, 5: w5, 6: w6, 7: w7, 8: w8, 9: w9, 10: w10, 11: w11, 12: w12 };
export const notesOf = (week: number): NotesBlock[] => documents[week] ?? [];
export const sentenceText = (s: NotesSentence) => s.parts.map(p => p.text).join('');
export const blockText = (b: NotesBlock) => b.sentences.map(sentenceText).join('');
const sentences = new Map(Object.values(documents).flatMap(blocks => blocks.flatMap(b => b.sentences.map(s => [s.id, s] as const))));
export const sentence = (id: string) => sentences.get(id);

/** Explicit ranges stay within a single paragraph. Unknown ids are never hidden by a fallback. */
export function expandNotes(refs: readonly string[] = []): string[] {
  return [...new Set(refs.flatMap(ref => {
    const range = /^(.*\/s)(\d+)-s(\d+)$/.exec(ref);
    if (!range) return [ref];
    const from = Number(range[2]), to = Number(range[3]);
    if (to < from || to - from > 1000) return [ref];
    return Array.from({ length: to - from + 1 }, (_, i) => `${range[1]}${from + i}`);
  }))];
}

/** Mirrors content/notes.ts, including explicit covered subsections. */
export function sectionMatches(section: string, config: NotesSection): boolean {
  const numbers = [...config.n.matchAll(/\d+(?:\.\d+)?/g), ...(config.covers ?? '').matchAll(/(?<!\d)\d+\.\d+/g)].map(m => m[0]);
  return numbers.some(n => section === n || section.startsWith(`${n}.`));
}
export function sectionConfig(week: number, section: string): NotesSection | undefined {
  // More specific subsections win over broad parent sections.
  return [...(NOTES[week] ?? [])].reverse().find(s => sectionMatches(section, s));
}
export function firstAnchorInSection(week: number, section: string): NotesAnchor | undefined {
  const configs = NOTES[week] ?? [];
  const config = sectionConfig(week, section);
  const stageId = config?.stages[0] ?? configs.find(s => s.n.startsWith(`${section}.`) && s.stages.length)?.stages[0];
  return stageId ? { week, stageId, beat: 0 } : undefined;
}

/** Built once from the reviewed beat data; a phrase may belong to several steps. */
export const sentenceAnchors = new Map<string, NotesAnchor[]>();
for (const week of weeks) for (const stage of week.stages) stage.beats.forEach((beat, i) => {
  for (const id of expandNotes(beat.notes)) {
    const refs = sentenceAnchors.get(id) ?? [];
    refs.push({ week: week.week, stageId: stage.id, beat: i });
    sentenceAnchors.set(id, refs);
  }
});

/** Audited exceptions where a scene teaches detail absent from this ORIGINAL PDF. */
export const NOTES_EXCEPTIONS: Record<string, { sections?: string[]; reason: string }> = {
  '12/aorta-heldua': { sections: ['2.3.4', '2.3.2'], reason: 'Aorta helduaren adarrak 2.3.4ko azken paragrafoan ere deskribatzen dira (makoaren hiru adarrak, brakiozefaliko bakarra), eta 2.3.2ko irudiak (arkuetatik eratutako arteriak) jatorriaren kolorea laburtzen du, 2.4ko laburpenarekin batera.' },
  '11/jatorriak': { sections: ['1', '2.2', '3', '5.1'], reason: 'Bi gaien laburpena: atal bakoitzaren jatorria aurreko ataletan azaltzen da (1, 2.2, 3, 5.1), eta 5.2ko laburpenarekin biltzen da.' },
  '11/arteria-konoa/0': { sections: ['5'], reason: '5. atalaren sarrera (kiribil formako trenkadak) atal bulbarraren trenkadatzea irekitzen du; 5.1 arteria konoarekin hasten da.' },
  '1/ibilbidea': { sections: ['4.2', '4.3', '4.4', '4.5'], reason: 'Ibilbideak ernalkuntza, segmentazioa, blastozistoa eta habiratzea ere erakusten ditu.' },
  '10/atal-bulbarra/5': { reason: 'Etaparen laburpena: aurreko urratsetako eratorriak mapa lau batean biltzen ditu; ez dago apunteetako esaldi berririk.' },
  '1/habiratzea/4': { reason: 'Ezohiko habiratzea simulazioan osagarri da; 1. gaiaren jatorrizko PDFak ez dauka 4.6 atala.' },
  '3/mesodermoa-hedatzen/6': { sections: ['2'], reason: 'Plaka prekordalaren lehen zelulak notokordaren atalaren hasieran azaltzen dira.' },
  '3/alantoidea-eta-hazkundea/1': { sections: ['2'], reason: 'Polaritatea eta lateralitatea 2. atalaren amaieran azaltzen dira.' },
  '3/alantoidea-eta-hazkundea/5': { sections: ['2'], reason: 'Alantoidea 2. atalaren bukaeran dago, content/notes.ts-eko covers eremuak dioen bezala.' },
  '3/alantoidea-eta-hazkundea/6': { sections: ['0'], reason: 'Korion barrunbea eta finkapen pedikulua hasierako egoeraren atalean deskribatzen dira; 19-20 eguneko xehetasuna ez dago PDFan.' },
  '4/tolespenak': { sections: ['3.3', '4'], reason: 'Tolespenen mekanika eta ondorioak alboko mesodermoaren eta endodermoaren ataletan zehazten dira.' },
  '5/iraupena/3': { sections: ['1'], reason: 'Enbrioi-aroaren muga 1. atalaren izenburuan ere azaltzen da.' },
  '7/septum-transversum/0': { sections: ['1'], reason: 'Abiapuntua: 1. atalaren azken esaldia (zeloma toraxetik abdomenera), septuma agertu aurretik.' },
  '7/diafragma-heldua/6': { sections: ['4'], reason: '4. atala (Gogoratu beharrekoa) gaiaren laburpena da: azken urratsean erakusten da.' },
  '8/buru-ganga/0': { sections: ['3'], reason: 'Burezurraren sarrera (3. atala): neurokraneoa eta errai kraneoa bereizi aurretik, buru-gangaren etapa irekitzen du.' },
  '5/hirugarren-hilabetea/0': { sections: ['2'], reason: 'Fetu-aroaren heltzea 2. ataleko sarreran azaltzen da.' },
};
