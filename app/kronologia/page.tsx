import type { Metadata } from 'next';
import { Timeline, type Source } from '@/components/shell/Timeline';
import { END_DAY, MILESTONES, SYSTEMS, type SystemId } from '@/content/chronology';
import { NOTES } from '@/content/notes';
import { sentence, sentenceText } from '@/content/notes-text';

export const metadata: Metadata = { title: 'Kronologia: zer dago orain? — EnbrioAtlas' };

/** The notes sentences the milestones cite, resolved here so the page does not ship the whole notes text. */
function sources(): Record<string, Source> {
  const out: Record<string, Source> = {};
  for (const m of MILESTONES)
    for (const id of m.notes) {
      const s = sentence(id);
      if (!s) continue;
      const [, topic, sec] = /^w(\d+)\/([^/]+)\//.exec(id) ?? [];
      const n = Number(topic);
      // The longest numbered heading of the notes that the sentence's section starts with ("3.1.1" → "3.1").
      const head = (NOTES[n] ?? []).filter((x) => sec === x.n || sec.startsWith(`${x.n}.`)).sort((a, b) => b.n.length - a.n.length)[0];
      out[id] = { topic: n, section: head ? `${head.n}. ${head.title}` : '', text: sentenceText(s).trim() };
    }
  return out;
}

type Query = { [key: string]: string | string[] | undefined };
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

/** The day and system a link asks for (?eguna=22&sistema=barrunbeak), read here so the first paint is already right. */
function readLink(q: Query): { day: number; system: SystemId | null } {
  const d = Number(one(q.eguna));
  const s = one(q.sistema);
  return {
    day: one(q.eguna) !== undefined && Number.isFinite(d) ? Math.min(END_DAY, Math.max(0, Math.round(d))) : 22,
    system: s && SYSTEMS.some((x) => x.id === s) ? (s as SystemId) : null,
  };
}

export default async function ChronologyPage({ searchParams }: { searchParams: Promise<Query> }) {
  return <Timeline sources={sources()} initial={readLink(await searchParams)} />;
}
