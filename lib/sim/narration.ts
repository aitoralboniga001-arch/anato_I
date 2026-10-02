import { structures } from '@/content/registry';
import type { StageDef, WeekDef } from './types';

export type NarrationKind = 'intro' | 'beat' | 'structure' | 'bridge';
export interface NarrationOptions { beat?: number; structure?: string; view?: string }
export interface NarrationSegment { text: string; focus: string[] }

/** Sentence boundaries respect ordinal days such as "15. eguna". No course text is rewritten. */
export function splitNarration(text: string): string[] {
  return (text.trim().match(/[\s\S]+?(?<!\d)[.!?](?=\s|$)|[\s\S]+$/g) ?? [])
    .map((part) => part.trim()).filter(Boolean);
}

export function getNarrationSegments(week: WeekDef, stage: StageDef, kind: NarrationKind, options: NarrationOptions = {}): NarrationSegment[] {
  let text = '';
  let focus: string[] = [];
  if (kind === 'beat') {
    const beat = stage.beats[options.beat ?? 0];
    if (!beat) return [];
    text = beat.text;
    focus = beat.focus ?? [];
  } else if (kind === 'intro') {
    text = `${stage.title}. ${stage.intro ?? stage.subtitle ?? stage.views[0]?.description ?? ''}`;
  } else if (kind === 'structure') {
    const structure = week.structures.find((s) => s.id === options.structure) ?? structures.get(options.structure ?? '');
    if (!structure || !stage.structures.includes(structure.id)) return [];
    text = `${structure.name}. ${structure.definition}`;
    focus = [structure.id];
  } else {
    const view = stage.views.find((v) => v.id === options.view);
    if (!view) return [];
    const directions = [view.orientation?.top && `Goian: ${view.orientation.top}.`, view.orientation?.left && `Ezkerrean: ${view.orientation.left}.`].filter(Boolean).join(' ');
    text = `Ikuspegia aldatu da. ${view.label}. ${view.description} ${directions}`;
  }
  return splitNarration(text).map((sentence) => {
    const named = focus.filter((id) => {
      const s = week.structures.find((item) => item.id === id) ?? structures.get(id);
      return s && [s.name, ...(s.aka ?? [])].some((name) => sentence.toLocaleLowerCase().includes(name.toLocaleLowerCase()));
    });
    return { text: sentence, focus: named.length ? named : focus };
  });
}

/** Each spoken fragment owns an equal portion of the current step; no wall-clock drift. */
export function narratedFrame(from: number, to: number, segment: number, count: number, fraction: number) {
  return from + (to - from) * Math.min(1, Math.max(0, (segment + Math.min(1, Math.max(0, fraction))) / Math.max(1, count)));
}

/** A held final frame can belong to paused speech or observation, not a completed stage. */
export function needsStageRestart(playing: boolean, progress: number, narrationActive: boolean) {
  return !playing && progress >= 1 && !narrationActive;
}
