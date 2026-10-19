import { describe, expect, it } from 'vitest';
import { weeks } from '@/content/registry';
import { NOTES, sectionLabel, sectionOf } from '@/content/notes';
import { EXAM_DATES } from '@/content/examDates';
import { createHash } from 'node:crypto';
import { blockText, expandNotes, firstAnchorInSection, NOTES_EXCEPTIONS, notesOf, sectionMatches, sentence, sentenceAnchors } from '@/content/notes-text';

describe('original notes and reviewed alignment', () => {
  const lengths = [17921, 10991, 17577, 23697, 13010, 18297, 14910, 23059, 27672, 22566, 25146];
  const hashes = [
    'f8abeb46de6a656b112e6b89b9c99802bab9a7af8affd6c63ed4ac2a6e0524db',
    'fd368f4eb7b398bec5c5275cd244233a86f4f5e099f796bbf42328b3ac32994c',
    'a30f3bef515434dc3696800623caffe24375e9782bb688f35ada7160c677d4ee',
    '87cdeecd4f3886bf3372b8acc920b229a29850a39b48b205fe59d7f2ceb21b28',
    '4854deb7f05ef579b31896d81de6007cfda719875d8a2843d8dbd2b9174c05dd',
    '22cbeeff3550f3b502b61bbeec542930188777fde34fe7f28312142656565e59',
    'ff4d7aa44e043142f49bf2e045890f4cce02b53438d3205b73089d21e0ced7d8',
    '048370ce48acf90b2487d95eede57f5cd6fd78018410f286fb1ca70140a96359',
    '71a3bed50c941e34e6206251606bd654c8fa2e61a74e895f3ff5ee3491d012b0',
    '5e74a6d4f575b9f0c8c6d58cf70f2366fe71080ec6c31eca43eec20e4e53be3f',
    'b431fe6ac5cf2556312c20b59a0fd010b1e2addb7a0e2ea2fb2c912a6ccfecd0',
  ];

  it('pins the complete original text of each of the PDFs', () => {
    for (const w of weeks) {
      const text = notesOf(w.week).map(blockText).join(' ');
      expect(text.length, `w${w.week}`).toBe(lengths[w.week - 1]);
      expect(createHash('sha256').update(text).digest('hex'), `w${w.week}`).toBe(hashes[w.week - 1]);
    }
  });

  it('has unique block and sentence ids across all topics', () => {
    const ids = weeks.flatMap(w => notesOf(w.week).flatMap(b => [b.id, ...b.sentences.map(s => s.id)]));
    expect(new Set(ids).size).toBe(ids.length);
    for (const w of weeks) for (const b of notesOf(w.week)) for (const s of b.sentences) {
      expect(s.id).toMatch(new RegExp(`^w${w.week}/[^/]+/p\\d+/s\\d+$`));
      expect(sentence(s.id)).toBe(s);
    }
  });

  it('gives every beat real anchors or a justified source exception', () => {
    let count = 0, unmapped = 0;
    for (const w of weeks) for (const stage of w.stages) stage.beats.forEach((beat, i) => {
      count++;
      const key = `${w.week}/${stage.id}/${i}`;
      const refs = expandNotes(beat.notes);
      if (!refs.length) {
        unmapped++;
        expect(NOTES_EXCEPTIONS[key]?.reason, key).toBeTruthy();
        expect(NOTES_EXCEPTIONS[key]?.sections, key).toBeUndefined();
      }
      for (const id of refs) expect(sentence(id), `${key}: ${id}`).toBeDefined();
    });
    expect(count).toBe(672);
    // The second: topic 10 stage 6's summary step (the flat map of the derivatives).
    expect(unmapped).toBe(2);
  });

  it('keeps anchors in the stage sections or an explicitly reviewed exception', () => {
    for (const w of weeks) for (const stage of w.stages) stage.beats.forEach((beat, i) => {
      const key = `${w.week}/${stage.id}/${i}`;
      const config = sectionOf(w.week, stage.id)!.section;
      const exception = NOTES_EXCEPTIONS[key] ?? NOTES_EXCEPTIONS[`${w.week}/${stage.id}`];
      for (const id of expandNotes(beat.notes)) {
        expect(id.startsWith(`w${w.week}/`), key).toBe(true);
        const section = id.split('/')[1];
        expect(sectionMatches(section, config) || !!exception?.sections?.includes(section), `${key}: ${id}`).toBe(true);
      }
    });
  });

  it('round trips every phrase to the exact stage and beat', () => {
    for (const w of weeks) for (const stage of w.stages) stage.beats.forEach((beat, i) => {
      for (const id of expandNotes(beat.notes)) expect(sentenceAnchors.get(id)).toContainEqual({ week: w.week, stageId: stage.id, beat: i });
    });
    for (const [id, refs] of sentenceAnchors) for (const ref of refs) {
      const stage = weeks.find(w => w.week === ref.week)!.stages.find(s => s.id === ref.stageId)!;
      expect(expandNotes(stage.beats[ref.beat].notes)).toContain(id);
    }
  });

  it('expands explicit paragraph ranges without masking invalid ids', () => {
    expect(expandNotes(['w1/4.2/p3/s1-s3', 'w1/4.2/p3/s2'])).toEqual(['w1/4.2/p3/s1', 'w1/4.2/p3/s2', 'w1/4.2/p3/s3']);
    expect(sentence(expandNotes(['w1/4.2/p3/s3-s1'])[0])).toBeUndefined();
    expect(sentence('unknown')).toBeUndefined();
  });

  it('routes original TOC subsections, merged sections and non-simulated text', () => {
    expect(firstAnchorInSection(1, '4')).toEqual({ week: 1, stageId: 'ibilbidea', beat: 0 });
    expect(firstAnchorInSection(1, '3.1')).toBeUndefined();
    expect(firstAnchorInSection(4, '3.3')?.stageId).toBe('bitarteko-eta-alboko-mesodermoa');
    expect(firstAnchorInSection(6, '1.4')?.stageId).toBe('biloxka-askeak');
    expect(firstAnchorInSection(6, '3.2')?.stageId).toBe('karena-aterminoa');
  });
});

describe('notes table of contents', () => {
  it('puts every stage in exactly one section, in the order they are played', () => {
    for (const w of weeks) {
      const listed = (NOTES[w.week] ?? []).flatMap((s) => s.stages);
      expect(listed, `${w.week}. gaia`).toEqual(w.stages.map((s) => s.id));
    }
  });

  it('numbers sections as the notes do and explains the empty ones', () => {
    for (const [week, list] of Object.entries(NOTES)) {
      for (const s of list) {
        expect(s.n, `${week}/${s.title}`).toMatch(/^\d+(\.\d+)?(–\d+(\.\d+)?)?$/);
        expect(s.depth === 1, `${week}/${s.n}`).toBe(s.n.includes('.'));
        // A heading without stages either explains why, or is followed by its sub-headings.
        if (!s.stages.length) {
          const next = list[list.indexOf(s) + 1];
          expect(!!s.note || next?.depth === 1, `${week}/${s.n}`).toBe(true);
        }
      }
    }
  });

  it('finds the parent heading of a sub-heading', () => {
    const r = sectionOf(4, 'somitak');
    expect(r && sectionLabel(r.section)).toBe('3.1 Mesodermo paraxialean gertatutako aldaketak');
    expect(r?.parent && sectionLabel(r.parent)).toBe('3. Mesodermoaren eratorriak');
    expect(sectionOf(4, 'neurulazioa')?.section.title).toBe('Ektodermoaren eratorriak');
  });
});

describe('exam dates', () => {
  it('pin to real steps and take their numbers from the step itself', () => {
    for (const [key, byAt] of Object.entries(EXAM_DATES)) {
      const [wn, sid] = key.split('/');
      const stage = weeks.find((w) => w.week === Number(wn))?.stages.find((s) => s.id === sid);
      expect(stage, key).toBeDefined();
      for (const [at, list] of Object.entries(byAt)) {
        const beat = stage!.beats.find((b) => b.at === Number(at));
        expect(beat, `${key}@${at}`).toBeDefined();
        const source = [beat!.text, beat!.idea, beat!.exam, stage!.day].join(' ');
        for (const d of list) for (const num of d.when.match(/\d+(,\d+)?/g) ?? []) expect(source, `${key}@${at}: ${d.when}`).toContain(num);
      }
    }
  });
});

// The owner studies from the notes and then looks for the same picture in the simulator: every figure the
// notes print needs a step whose picture looks like it, linked from its caption ("Simulazioan ikusi").
describe('figure parity: notes captions link to a matching step', () => {
  const captions = (week: number) => notesOf(week).filter((b) => b.kind === 'caption');
  const linked = (b: ReturnType<typeof captions>[number]) => b.sentences.some((s) => sentenceAnchors.has(s.id));

  it('links every topic 7 figure caption', () => {
    const open = captions(7).filter((b) => !linked(b)).map((b) => `${b.id}: ${blockText(b)}`);
    expect(open).toEqual([]);
  });

  it('opens 2.1 on the notes figure A → C (the fold of stage 1), not on the finished abdomen', () => {
    const refs = sentenceAnchors.get('w7/2.1/p4/s1') ?? [];
    expect(refs[0]).toEqual({ week: 7, stageId: 'peritoneo-barrunbea', beat: 0 });
    const stage = weeks.find((w) => w.week === 7)!.stages.find((s) => s.id === 'peritoneo-barrunbea')!;
    expect(stage.beats[0].view).toBe('irudia');
    expect(stage.beats[1].view).toBe('zeharkakoa');
  });

  it('keeps the linked captions of topics 8 and 9 linked', () => {
    // Not yet linked in topic 8 (the audit's batch for topic 8 adds them): the skull from above, the chondrocranium from above.
    const pending = new Set(['w8/3.1.1/p12', 'w8/3.1.2/p5']);
    for (const week of [8, 9]) for (const b of captions(week)) if (!pending.has(b.id) && !blockText(b).trim().match(/^[\s○•*-]*$/)) {
      expect(linked(b), `${b.id}: ${blockText(b).slice(0, 60)}`).toBe(true);
    }
  });
});
