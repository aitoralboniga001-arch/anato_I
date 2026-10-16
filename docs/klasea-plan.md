# Modu gidatua with Kimu as teacher: final plan (v3)

- v1 and v2 written 2026-10-16.
- v3 written the same day, after Gemini 4 Argon's review. It was triaged point by point against the code and the notes: see `docs/review/gemini-klasea-plan-triage.md`.
- Status: final plan, ready to build. Nothing is built yet.
- The interface is in Basque; this doc is in English like `EXECPLAN.md`.

## 1. What we are building

The **guided mode (Modu gidatua)** becomes a class given by **Kimu**, grown up into a polished teacher:

- Kimu speaks in Basque with the browser's own voice.
- The specimen moves and lights up under what Kimu says.
- A board fills in the key points and a live table of what each part of the heart tube becomes.
- The student predicts, recalls, tells look-alikes apart, fills in the table from memory, and leaves with a summary sheet. Wrong and unsure answers come back in "Gaurko errepasoa".

The class covers only the **core** of the notes. **Modu arrunta** stays as the complete, step-by-step path.

The rule above all others: **study effectiveness beats charm.** Kimu exists to carry attention and emphasis. Anything that pulls the eye off the specimen while it is explaining is a regression.

**Scope: topic 10 only** (Zirkulazio aparatua). Other topics keep today's guided mode until they get a class.

## 2. Decisions

From the user (2026-10-16):

| # | Question | Decision |
|---|---|---|
| 1 | Name | **Modu gidatua.** The class *is* the guided mode. Topics without a class keep today's guided mode; Arrunta and Azkarra are unchanged. |
| 2 | Character | **Kimu grown up, more polished** (§8). |
| 3 | Review | **None needed.** The core is chosen by fixed rules (§5) and enforced by tests (§6). |
| 4 | Voice | **Basque text read by the browser's standard local voice.** A Spanish voice reads a respelled text when there is no Basque one (§9). |
| 5 | Topics | **Topic 10 only**, for now. |

Made in v3 to settle the two questions Gemini raised (both follow from "never get lost" and "the student decides"):

| # | Question | Decision |
|---|---|---|
| 6 | What does opening topic 10 do? | **Guided mode shows a start card and never starts speaking by itself.** The card offers "Hasi klasea · 20 min", or "Jarraitu · N. zatia" when there is a saved place. **A link to a place** (from Galderak, the glossary or Kimu: `etapa`/`une`/`egitura`) opens that place paused, and the card offers "Klasea hemendik" (the chunk that contains that place). A saved class position never overrides an explicit link. |
| 7 | Where does the board go below 1320 px? | The right column is a closing drawer with a scrim there (`Simulator.tsx:220`, `:1114`). **In class mode it does not act as a drawer.** At 1024–1320 px it docks as a 260 px rail beside the scene. At 768–1023 px the board is a one-row strip under the scene (the current point, or the table row being filled), and the full board opens only when the class is paused or in a check. Nothing ever covers the specimen while Kimu speaks. Acceptance criterion: the scene keeps at least 60 % of the viewport width at every size from 768 to 1440 px. |

## 3. What the student does: the learning design

Something to do at least every ~90–120 s:

1. **Start anywhere.** A chunk menu sits on the board. Students come back for the hard part (the sinus venosus, the right atrium), not to sit through the whole class again.
2. **Predict, then watch.** This happens before the loop folds (chunk 5) and before the sinus venosus shift (chunk 8). Three options; guessing first, even wrong, helps the answer stick. **Predictions are never recorded as answers.**
3. **"Zer da hau?"** Kimu lights one structure with its name hidden and the student picks the name. This trains spatial recall, which is what anatomy demands. It needs no 3D picking, only the existing glow. It is recorded under the structure's image competence (`imageId`, `content/pool.ts`).
4. **Order the path.** The student puts chips in order, and each chip lights its segment on the specimen when placed:
   - the blood path through the tube (veins → sinus venosus → atrial → ventricular → bulbar part);
   - the arterial way out (aortic sac → aortic arches → dorsal aortas → vitelline and umbilical arteries).
5. **Contrast checks on topic 10's own look-alikes.** From chunk 6 on, at least one check per chunk sets the new fact against one already on the board:
   - trabeculated right ventricle (from the proximal bulbus) vs trabeculated left ventricle (from the ventricular part);
   - infundibula (from the conus) vs the roots of the aorta and pulmonary trunk (from the truncus);
   - left horn (→ coronary sinus and oblique vein of the left atrium) vs right horn (→ smooth wall of the right atrium);
   - the smooth part of the right atrium (sinus venosus) vs its trabeculated part (primitive atrium);
   - veins that close in week 4 (right umbilical, left vitelline) vs about week 10 (left common cardinal);
   - umbilical (from the chorion, oxygenated) vs vitelline (from the yolk sac, low O₂);
   - seen from the front (left and right swap) vs from behind (they don't).
6. **Confidence** on each check: "Ziur nago" or "Ez nago ziur". A right answer given while unsure still comes back for review, without counting as a wrong answer (§10).
7. **"Ez dut ulertu":**
   - the first press plays the plain rewording and replays the 5–10 s of the scene that shows it;
   - it marks the chunk as weak, and weak chunks lead the end-of-class review;
   - a second press opens the Kimu chat with that line's notes.
8. **Fill in the table from memory.** Before the exit quiz, 5–6 of the most confusable cells of the derivatives table go blank, and the student slots the chips back. Each placed cell lights its structure on the heart.
9. **Interleaved exit quiz.** Six questions mixed across chunks, mostly from the reviewed pool and the steps' own `ask`.
10. **Summary sheet ("Laburpen-orria").** Printable, opened after the exit quiz. It holds the goals, the full table, the KONTUZ traps, the words to know, and this student's weak chunks with "Errepasatu zati hau" links.
11. **Subtitles on by default**, one short line under the scene. The voice is imperfect, and some students study with the sound off. The class must work fully muted.

Later (not in the topic 10 build):
- a next-day 3-minute replay of the board and three due questions;
- a recall at the start drawn from the student's own weak foundations;
- a "Funtsezkoa" filter in the notes panel.

Dropped:
- **Mnemonics and invented analogies.** They cannot be grounded without review.
- **"What if it fails?" (clinical) moments.** The notes for topic 10 do not contain them.
- **Clicking structures in 3D.** There is no 3D picking today; "order the path" covers the same skill.

## 4. The topic 10 class

The class lasts about 20 minutes plus about 4 for the quiz, in 10 chunks. Each chunk sits on an existing stage, its views and its camera moves.

| # | Chunk (board heading) | Stage(s) | Must include (rules in §5 guarantee it) | Interactions |
|---|---|---|---|---|
| 0 | Gaur (today) | none | 4 goals; why the embryo needs circulation from week 3 (`w10/1/p3/s1`) | pre-question on that "why" |
| 1 | Nondik dator bihotza? (Where does the heart come from?) | 1 | blood islands in the splanchnic layer, in a horseshoe; cardiogenic plate in the middle, endocardial tubes at the sides; dorsal aortas | check |
| 2 | Tolespenek hodi bakarra egiten dute (Folding makes one tube) | 2 | the cephalocaudal fold (cause: growth of the nervous system) carries the plate down to the thorax; the transverse fold fuses the tubes; 3 layers; dorsal mesocardium → transverse sinus; first aortic arches | Zer da hau? |
| 3 | Lehen zirkulazioa (The first circulation) | 3 | arteries leave the heart and veins come to it, and either can carry oxygenated blood (`w10/1/p26`); the 3 paired veins (table: vein · from where · O₂); **the way out**: arches, dorsal aortas, vitelline and umbilical arteries (`p33–p35`); mixing in the primitive atrium | order the arterial path; contrast umbilical vs vitelline |
| 4 | Hodiaren atalak (The parts of the tube, day 21) | 4 | the parts top to bottom; the bulbar and ventricular parts lie in the pericardial cavity, the atria and sinus venosus in the septum transversum (`w10/2/p9`); the blood path | order the blood path |
| 5 | Lakioa (The loop, days 23–28) | 5 | cephalic end forward, down and right; caudal end back, up and left; positions on day 28; **seen from the front, left and right swap** (`w10/2/p20/s4`) | **predict**; check |
| 6 | Atal bulbarra (The bulbar part) | 6 | 3 sub-parts → trabeculated right ventricle, infundibula, roots | the table starts; contrast conus vs truncus |
| 7 | Bentrikuluak eta aurikulak (Ventricles and atria) | 7–8 | the ventricular part = primitive left ventricle; the primary interventricular foramen; the AV canal; **the truncus moves from right to midline while the common atrium widens into two** (`w10/3.3/p3`); the planes | contrast right vs left trabeculated ventricle; Zer da hau? |
| 8 | Zain sinua (The sinus venosus) | 9 | horns and their 3 veins; **seen from behind, left and right do not swap** (`w10/3.4/p4`); the shunt to the right; which veins close and when; left horn → coronary sinus and oblique vein | **predict** the shift; contrast the two horns |
| 9 | Eskuineko aurikula (The right atrium) | 10 | venous valves → septum spurium; smooth part (right horn) vs trabeculated part (primitive atrium); crista terminalis; SA node | contrast smooth vs trabeculated |
| 10 | Osatu taula + irteera (Fill in the table, then exit) | 10's summary view | the table with blanks, then the 6-question quiz, then the summary sheet | fill in, quiz |

**Rhythm of one line**, sequenced so that only one thing changes at a time (the split-attention fix):

1. **Move.** The scene glides to the line's `at`. Kimu turns its gaze to the specimen about 250 ms *before* the glide starts.
2. **Speak.** The voice and the one-line subtitle run, the `focus` structures glow, and their names appear as they are said. The scene may animate, since narration over animation is good. **Kimu stays still**: only the mouth moves and it blinks.
3. **Write.** If the line `writes` to the board, that happens *after* the speech. For 600–900 ms the scene holds still, the structure stays lit, the cell writes in with a highlight, and Kimu glances at the board.
4. **Hold.** If the line has a `hold`, there are silent seconds to watch.

## 5. Choosing the core without a human review

The rules run in a script whose output is checked in at `content/klasea/importance/w10.ts`. A prose sentence of `w10.ts` is **Funtsezkoa (core)** when at least one of these holds:

As built (`lib/klasea/importance.ts`; numbering matches the code):

- **R1 · Step facts.** Of the sentences a step with an `exam` field cites, the (at most two) that best carry that `exam`: taken greedily by the content-word stems and numbers they add, until at most half the `exam` is left or the next adds fewer than two.
- **R2 · The notes' own flags.** It contains "Kontuan hartu", "KONTUZ" or "garrantzi…"; a paragraph that *opens* with "Kontuan hartu" or "Kontuz" counts whole.
- **R3 · Tested facts.** The cited sentence that best carries a step's micro-question's right answer (and its why).
- **R4 · Causes.** It contains a causal link ("ondorioz", "dela eta", "-gatik", "horregatik", "beraz", "eragin…"), and a step with `key` or `exam` cites it.
- **R5 · Place and viewpoint.** It says where a part lies (pericardial cavity, septum transversum, left/right/front/back/up/down) with a placing verb, and a step with `caution` or a view change cites it. Or it says which side the picture is seen from ("aurretik/atzetik ikus…").
- **R6 · Stage opener.** It is the first prose sentence cited by a stage's first step: the "why" of the stage.
- **R7 · List heads.** In a bulleted list one item of which is core, the first sentence of every item (lists are taught whole).

The v2 "fates" rule was dropped: the fates the derivatives table uses are already core through R1 and R3.

**Garrantzitsua (supporting)** = any other sentence cited by a step with `idea` or `key`; the class may say it in passing. **Xehetasuna (detail)** = everything else, which stays in Modu arrunta.

**Tests on the rules themselves:**

- **Coverage.** The core is at most 60 % of the 189 prose sentences, and every stage has at least one core sentence. Topic 10 comes out at 99 sentences (52 %): its notes are dense and its steps' `exam` fields cover most of them, so the 25–40 % hoped for in v2 is not reachable without dropping exam facts. The class compresses instead by saying each fact once, in short spoken lines. 2026-10-16 trim: lines that only carried secondary sentences were dropped and repeated ones merged (1447 → 1124 spoken words, 29 → 20 checks, about 18 minutes in all).
- **Every `exam` fact is covered.** Each one is reachable from at least one core sentence.
- **A pinned set of sentences a student needs in order to *understand* topic 10 must be core:** `w10/1/p3/s1`, `p26/s1–s3`, `p33/s1`, `p34/s1`, `p35/s1`, `2/p9/s1–s2`, `2/p20/s4`, `3.3/p3/s1–s2`, `3.4/p4/s2`. These came out of the review: the v2 rules dropped them. If one fails, the rules change. Membership is never hand-edited.
- **Never past exams**, in any role.

**The derivatives table is built from prose, not from a table.** The notes text has no table (`NotesBlock` kinds are title, toc, h1, h2, p, li and caption). The section 3 table exists only as the drawn `AtriumTable` (`components/scenes/week10/RightAtrium.tsx:361`). Each board cell cites the prose sentence that states that fate. A test checks that the board table and `AtriumTable` list the same parts and fates.

## 6. Right by construction: the guards (`tests/klasea.test.ts`)

**Grounding**
- Every line, board cell and check cites `notes` ids that exist.
- Every core sentence is cited by at least one line.
- **G1. Said over the right frames.** A line's cited sentences must belong to the `notes` of the steps its `at` (and any glide end) falls in. Lines with tone `recall` or `summary` may instead cite earlier steps of the class.

**No new facts**
- Every number, day, week and ordinal in a line, board cell or check appears in its cited sentences (prose, not tables).
- **G3. Directions.** Every direction word must appear in the cited sentences or in the step's `exam`. The word stems are grouped into equivalence classes:
  - eskuin / eskum;
  - ezker;
  - zefal / kraneal / goi;
  - kaudal / behe;
  - aurre / bentral;
  - atze / dortsal;
  - medial / erdi;
  - albo.

  This guards the loop, the planes and the horns.

**Names and focus**
- Every structure named in a line resolves to its notes name or `aka`.
- A line's `focus` covers every structure it names.
- **G2. Focus belongs to the fact.** Each `focus` id is named in the line or in its cited sentences, or is in the `focus` of the step those sentences come from. A true sentence must not light the wrong part.

**Scene**
- `stage`, `view` and `at` exist, and `at` is inside the stage.
- **G4. Visible for the whole line.** Each `focus` structure is visible and its name is shown (given the spoken set so far) at the line's start, middle and end. This re-uses the `tests/visibility.test.tsx` renderer.
- If a named structure is out of frame, the zoom-reveal rule applies.

**Checks**
- Pool and `ask` items are not in LEFT_OUT.
- New class checks (predict, contrast, order, fill) must cite sentences, and use mechanism or discrimination angles, never stock "which is X" items.
- They go through the existing check against past exams before shipping. That is a Haiku pass, and it needs your OK because agents are off by default.

**Wording**
- No exam wording.
- No symbols in spoken text.
- At most 22 words per `say`.

**Timing**
- A chunk lasts 60–240 s at 1× and the class 12–20 min (2026-10-16, after the student's review: shorter, the core and what an exam can ask, not every detail), estimated as syllables ÷ 5.5 per second plus holds. Topic 10's notes average 2.83 syllables per word, about 1.9 words per second; the v2 figure of 2.3 words per second was too fast.
- There is an interaction at least every 120 s.

**Voice**
- The respelling fixture in §9 covers every word that contains `x`, `tx`, `tz`, `z` or `g+e/i` in the topic 10 lesson. A new such word with no classification fails the test.

`scripts/klasea/audit.ts` writes `docs/klasea/w10-audit.md`: each line beside its source sentences, each board cell with its source, and the coverage numbers. It is evidence for anyone who asks "where does this come from?", not a review step.

## 7. Data model

```
content/klasea/importance/w10.ts   // generated by §5 and checked in
content/klasea/w10.ts              // the class script
content/klasea/index.ts            // hasClass(week), helpers
```

```ts
interface Lesson { week: number; goals: string[]; pre?: Check; chunks: Chunk[]; exit: string[] }

interface Chunk {
  id: string; title: string; stage: string; view?: string;
  lines: Line[]; board?: BoardItem[]; checks: Check[];
}

interface Line {
  say: string;          // spoken Basque, short, written for the ear (subtitles show it too)
  plain?: string;       // the "Ez dut ulertu" rewording: same facts, simpler words
  notes: string[];      // cited sentence ids (required)
  at?: number;          // stage time to glide to
  focus?: string[];     // lit while said; feeds the spoken-names set
  tone?: 'explain' | 'emphasis' | 'caution' | 'why' | 'recall' | 'summary';
  writes?: string;      // board item filled AFTER the line is spoken
  hold?: number;        // silent seconds to watch
}

type BoardItem =
  | { id: string; kind: 'line'; text: string; notes: string[] }
  | { id: string; kind: 'table'; head: string[];
      rows: { id: string; cells: string[]; notes: string[]; structures: string[] }[] };

type Check =
  | { kind: 'predict'; q: string; options: string[]; answer: number; why: string[]; notes: string[] }  // not recorded
  | { kind: 'zer-da-hau'; structure: string; options: string[] }                                      // recorded via imageId
  | { kind: 'order'; items: { label: string; structure: string }[]; notes: string[] }
  | { kind: 'contrast'; q: string; options: string[]; answer: number; why: string[]; notes: string[] }
  | { kind: 'fill'; table: string; blanks: string[] }                                                  // cell ids
  | { kind: 'pool'; id: string };
```

## 8. Kimu, grown up

The same character as the 24 px `KimuFace` (embryo pink, curled tail, two-leaf sprout), drawn for 120–160 px as `components/klasea/KimuTeacher.tsx`, in SVG and CSS.

- **Look:**
  - layered soft shading;
  - a rim light from the scene side;
  - round thin glasses and a piece of chalk as the only teacher cues;
  - big eyes with highlights;
  - small hands.
- **Poses:**
  - `listen`;
  - `talk`;
  - `emphasis`: sprout up, eyes wide, a warm glow on Kimu itself;
  - `caution`: a raised hand;
  - `think`;
  - `praise`;
  - `gentle`: "almost", for wrong answers, never a sad face;
  - `look`.

  Poses ease into each other in about 250 ms.
- **Motion budget (from the review):**
  - While the voice is speaking or the scene is moving, Kimu moves only its mouth and blinks.
  - Gaze and body turns happen **only at phase boundaries**: toward the specimen just before a glide, toward the board for a write, toward the student for a question.
  - The gaze target is the screen position of the lit structure's label anchor. It is the only "pointing" there is, and it comes before the motion, not during it.
- **Mouth.** The mouth follows the speech engine's word boundaries. The current word's vowel picks one of four shapes (a / e-i / o-u / closed). Without boundary events, a gentle rhythm runs while speaking.
- **Place.** It sits in the lower corner away from the specimen, docked to the caption dock or rail, never over the scene. One click shrinks it to the small face.
- **Reduced motion:** still poses and a small "speaking" dot.
- **The small face.** `KimuFace` gets the same refinements, so the chat and the class are visibly one character.

## 9. Voice: the browser's own, reading Basque

`lib/klasea/voice.ts` speaks through `speechSynthesis`, with no network and no key of ours.

**Voice choice**
1. A Basque voice (`eu`), with no respelling.
   - Edge's natural Basque voices are online (`localService: false`). If the browser is offline, or the voice errors or does not start within 2.5 s, the class switches to the best local Spanish voice for the rest of the session and shows a small note.
2. A local Spanish voice with *seseo* (`es-US`, `es-MX`, `es-419`).
3. A local `es-ES` voice. This PC has Helena, Laura and Pablo.
4. No voice: subtitles, with reading-time pacing.

The student can pick another voice from a small menu, and the choice is remembered.

**Respelling for Spanish voices** (`lib/klasea/speak-eu.ts`; the subtitles always show the original text). Rules, in this order:

| # | Rule | Example |
|---|---|---|
| 1 | Keep Greco-Latin words whose `x` is /ks/, from a fixed stem list | torax, plexu…, extra…, oxigen… |
| 2 | Keep Latin terms as they are, from a list | septum primum / secundum / spurium / transversum, sinus |
| 3 | `tx` → `ch` | |
| 4 | `tz` → `ts`, done before `z` | bihotz → bihots |
| 5 | `x` before a vowel → `ch`; `x` before a consonant → `s` | xixkuak → chiskuak |
| 6 | `z` → `s` | zain → sain |
| 7 | `g` before `e`/`i` → `gu`, unless already after `gu`/`qu` | geruza → guerusa |
| 8 | Numbers and ordinals → Basque words: a TypeScript port of `scripts/narration/normalize_basque.py` with its test cases | 15. eguna → hamabosgarren eguna |
| 9 | **Stress.** Spanish voices stress the last syllable of words ending in a consonant other than `n`/`s`, which hammers every `-ak`, `-ek`, `-tik`. An acute accent on the penultimate vowel of such words with 2+ syllables steers it there. | aurikulak → aurikúlak |

On by default; `/dev/ahotsa` plays each sample with and without rule 9.

**Web Speech handling**
- one utterance per sentence;
- 50 ms between `cancel()` and `speak()`;
- pause is implemented as cancel and resume from the sentence start;
- voices are picked after `voiceschanged`;
- speech is primed inside the "Hasi" click (iPad);
- the watchdog starts at `onstart`: estimate × 1.5 + 2 s, plus a 2.5 s start timeout;
- the rate menu offers 0.8 / 1 / 1.15 / 1.3;
- a hidden tab pauses the class.

**`/dev/ahotsa`** lists this browser's voices and plays topic 10 sample lines with each, raw and respelled. This is the one listening check (§6 cannot hear).

The pre-generated MP3 narration stays for Modu arrunta. The class does not use it.

## 10. Architecture

- **`lib/klasea/engine.ts`: a pure, deterministic class clock.**
  - Phases: `move` → `speak` → `write` → `hold`, plus `check` and `paused`.
  - Its state is the position (chunk, line), the spoken-names set, the board, Kimu's pose and gaze target, and the weak chunks.
  - It is unit-tested without a browser.
- **`components/klasea/ClassHost.tsx`** drives the scene with `place`, `glide` (every view change moves the camera) and `setView`; with the spotlight; and with the spoken set.
- **What `Simulator.tsx` must change.** The review showed that a one-line mount switch is not enough. While the class is active:
  1. skip the step auto-view effect (`:475`), because the class sets the view;
  2. skip the intro preview, the guided reading holds and the normal playback advance, because the class owns time;
  3. take `named` from the class's spoken set plus `knownBefore`, not from `namedAt` (`:1450`). All names show at each chunk's end, which is the class equivalent of "all names at the stage end";
  4. hold the tour offer (`TourHost`, `OFFER_AFTER = 1600`);
  5. apply the deep-link rule of decision 6, and read and write `klasea=<chunk>` in the URL without breaking `readDeepLink` (`:248`) or the URL sync (`:556`);
  6. use the board placement of decision 7.

  Each of these is a guarded branch. The logic itself lives in `components/klasea/`.
- **Kimu chat.**
  - Opening Kimu (button, `K` key or "Galdetu") **pauses the class and the voice**. "Bueltatu" resumes at the start of the line.
  - `KimuHere` (`{ week, stage, beat, structure, view }`, `lib/kimu/types.ts:72`) gains `lesson?: { chunk: string; line: number; notes: string[] }`, so answers come from that line's own sentences.
  - "Take me to X" during class uses the existing replay with "Bueltatu" back to the class.
- **Answers** (`components/shell/answers.ts`):
  - `recordAnswer(id, ok, picked?, opts?: { unsure?: boolean })`. A right answer given while unsure counts as right in the history, but `streak` is 0 and `due` is now, so it comes back in review without counting as wrong.
  - Predictions are not recorded.
  - "Zer da hau?" records under `imageId(structure)`.
  - Contrast, order and fill items join the pool with stable ids, so review can re-ask them.
- **Progress:** `enbrioatlas:klasea:10` stores the chunk and the line. Resume starts at the beginning of that line.
- **Board** (`Board.tsx`), **summary sheet** (`Sheet.tsx`, with a print stylesheet), **voice** (`voice.ts`, `speak-eu.ts`), **dev page** (`app/dev/ahotsa`).

## 11. Build order for topic 10

1. **Importance rules**, then `importance/w10.ts` and the §5 tests. Finish line: coverage, every `exam` fact covered, and the pinned set all pass.
2. **Engine, data model and the §6 guards with a stub lesson.** Finish line: the engine and guard tests pass.
3. **Voice:** `voice.ts`, `speak-eu.ts` with the fixture, the number port and `/dev/ahotsa`. Finish line: the unit tests pass, and this PC's voices are listed and speak.
4. **`answers.ts` `unsure` option and the pool entries for class checks.** Finish line: the review tests pass.
5. **The topic 10 script**, all chunks, from the core sentences and the steps' `exam`/`idea`/`key`/`caution` fields. Finish line: every guard passes and the audit is generated.
6. **ClassHost, the Simulator hooks, Board, Sheet and KimuTeacher.** Finish line:
   - the whole class plays through in the browser at 768, 1024, 1280 and 1440 px;
   - the scene keeps at least 60 % of the width, and nothing covers it while Kimu speaks;
   - glides are checked in headless Chrome;
   - `tsc`, the full `vitest` run and lint are clean;
   - deep links into topic 10 still land on their place.
7. **Report:** a screenshot per chunk, the audit, and what is left: the one listening check, and the past-exam check of the new questions (needs your OK).

After topic 10, in this order:
- the "later" items in §3;
- the other topics: 7 → 9 → 8 → 11 → 1–6. Topics 1, 3b, 5 and 6 need far more writing, because their steps lack `idea`, `key` and `exam`.

## 12. Risks

| Risk | Mitigation |
|---|---|
| **The voice.** Respelled Basque in a Spanish voice is understandable, not native. | A Basque voice when present; subtitles by default; the stress rule with A/B; works muted; the MP3 pipeline is a fallback that the design does not block. |
| **Drift when rewriting for the ear.** | G1–G4, the number and direction guards, short lines, and the audit. |
| **The rules miss what a teacher would stress.** | The rules are generous (R1–R7); the pinned understanding set; every chunk points to Modu arrunta for the detail. |
| **Overload.** | The line rhythm in §4, Kimu's motion budget in §8, and one line of subtitles. |
| **Simulator coupling.** It is 2,141 lines, and the six hooks in §10 touch shared paths. | Each hook is a guarded branch; the full test suite runs; deep links and the tour are re-checked. Topic 10 files had uncommitted work at the start; build on top of it once it is committed. |

## 13. Rules this feature keeps

- The notes are the truth; their prose beats their tables. Every spoken line, board cell and check cites its sentences.
- No past-exam material, wording or ranking signal, anywhere.
- Keep all labels: names appear as Kimu says them, and all show at each chunk's end.
- No drawn pointers. Emphasis is the voice, the glow and the board highlight. Kimu's gaze, before the motion, is the only "pointing".
- Every view change moves the camera. A structure named out of frame triggers zoom out, show, zoom back in.
- The same structure has the same look and colour in every view.
- PC and tablet, 768–1440 px. Basque UI. Reduced motion respected. No keys in client code.
