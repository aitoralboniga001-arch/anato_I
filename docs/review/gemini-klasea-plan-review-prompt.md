# Read-only review of the "Modu gidatua with Kimu as teacher" plan: prompt

You are reviewing a **feature plan** for an interactive embryology web app, before it is built. This is a **read-only pass**. Do not edit, create or delete any file, do not commit, and do not change settings. Read the plan and the code it builds on, run the app if you can, and write a critical, concrete review.

The plan is `docs/klasea-plan.md` (v2). Read it in full before anything else.

We want **new insights**: things the plan misses, gets wrong, or could do much better for students. We do not want a summary of the plan, praise, or generic advice. Quality matters far more than quantity: **10–12 findings at most**, each one checked.

---

## 1. The app, in short

- **Who uses it.** First-year medical students at a Basque university, studying human embryology. The interface, the structure names and the explanations are in **Basque (euskara)**.
- **What it replaces.** The course notes are dense PDFs. Each topic becomes an animated simulation: stages, then steps (beats), then scenes with labels, narration text, quizzes and a 3D model.
- **The bar.** Students must **understand and memorise better than with the notes alone**. When study effectiveness and charm conflict, effectiveness wins.
- **Devices.** PC and tablet, 768–1440 px. Phone is out of scope.
- **Who else sees it.** The app will be shown to anatomy teachers, so accuracy is non-negotiable.

The key files are listed in `docs/review/gemini-topic-10-review-prompt.md` §2. That file was an earlier review of topic 10's scenes; you may read it for orientation.

## 2. The feature

The guided mode ("Modu gidatua") becomes a **class given by Kimu**, the app's mascot, drawn as a grown-up teacher:

- Kimu speaks Basque text through the browser's own voice.
- The specimen moves and glows under what Kimu says.
- A board fills in the key points and a live derivatives table.
- The student predicts, answers checks, and gets a summary sheet and a mixed exit quiz.

The class covers only the **core** of the notes. The normal mode keeps everything. It is being built for **topic 10 (heart development) only** for now.

## 3. Decisions already made by the owner: do not reopen them

These are settled. Do not argue for alternatives. You may point out a **risk inside** a decision and a way to reduce it.

1. **Name and place.** The class *is* "Modu gidatua", not a new mode. Topics without a class keep today's guided mode.
2. **Character.** Kimu, grown up and more polished. Not a new character, not a realistic human, not a 3D avatar.
3. **No human review of content.** "Core" is chosen by fixed rules from the notes and from the steps already curated. Correctness is enforced by automated tests (plan §5–§6). Do not propose "have a teacher review it". Instead, propose stronger rules or tests if you see a gap.
4. **Voice.** The browser's local Web Speech voice reads Basque text. Where the browser has no Basque voice, a Spanish voice reads a respelled text (plan §9). No pre-generated audio, no cloud TTS.
5. **Topic 10 only** for now.

## 4. Intended designs that might look like mistakes

These are deliberate:

- **Labels appear as they are said.** Names show progressively, the first time the narration or Kimu says them, and all of them show at the stage end (`components/shell/named.ts`). This is the agreed way to keep every name without clutter.
- **No drawn pointers anywhere on the specimen.** No arrows, rings or boxes. Emphasis means the structure glows, plus the voice and the board highlight. Kimu's gaze is the only "pointing", and it stays off the specimen.
- **Every view change moves the camera** (dive, pull-back or glide). A hard cut is a defect.
- **The notes are the truth.** When the notes' prose and their tables disagree, the prose wins. When the notes differ from textbooks, the app follows the notes.
- **No mnemonics or invented analogies.** They were dropped on purpose: without human review they cannot be checked against the notes.
- **No past exams.** No past-exam material, wording or ranking signal, anywhere. Do not suggest using past exams, exam frequency or "what usually comes up" for anything, including prioritisation.
- **External 3D datasets were tried and dropped.** Do not propose them.

## 5. What we want from you

Pick the findings that would most change how well a student learns from this class. Good territory:

### A. Learning effectiveness

- Does the class structure in plan §4 (chunks, interaction every ~90 s, predict, "Zer da hau?", checks, exit quiz, summary sheet) actually produce durable memory for *this* content? What is missing, overdone or mis-sequenced?
- Is the cognitive load right when voice, a moving 3D heart, progressive labels, a live table, subtitles and an animated character all run at once? Where exactly does it overload, and what should yield?
- Is the "core" rule set (plan §5) likely to leave out something a student needs to understand topic 10, as opposed to something they need to recite? Name the concrete topic 10 content at risk, citing notes sentence ids from `content/notes-text/w10.ts`.
- Does the plan use retrieval, spacing, interleaving, confidence and prediction well? Where does it misuse them?

### B. The automated guards in plan §6

- Which ways of being wrong would slip past the tests? Typical cases:
  - a correct fact attached to the wrong structure;
  - left and right swapped in a loop description;
  - a true sentence said over the wrong animation frame.
- For each gap, propose a test that is mechanically checkable with the data the app already has.

### C. Voice (plan §9)

- What will go wrong when a Spanish Web Speech voice reads respelled Basque, on real student hardware: Windows Chrome and Edge, and iPad Safari?
- Are the respelling rules correct and complete for intelligibility? What is missing? Consider stress, `j`, `ll`, `h`, word-final consonants, hyphenated compounds, Latin terms and abbreviations.
- Name Web Speech API pitfalls the plan does not handle, with the browser and version where you know them.

### D. Kimu as a pedagogical agent (plan §8)

- What research on on-screen agents should change the design: gaze cueing, gesture, persona, and the seductive-details risk?
- What to keep, what to cut, and what to add.

### E. Architecture risk (plan §10)

- Read `components/shell/Simulator.tsx`, `named.ts`, `narrate.ts` and `lib/sim/types.ts`.
- Is "ClassHost drives the simulator through a narrow interface" realistic with the code as it is?
- What will break: progress, guided-mode holds, the reading timers, `KimuHere`, deep links, the tour overlay?

### F. Bigger ideas (at most 3)

High-value ideas the plan does not consider, each with its learning gain and a rough cost. They must respect §3 and §4.

## 6. Evidence rules: findings without evidence will be discarded

Earlier reviews of this app included invented ids, quotes that did not exist in the app, and deliberate designs read as bugs. To avoid that, every finding must give:

- **Where:**
  - for the plan: the plan section and a short exact quote from `docs/klasea-plan.md`;
  - for the code: `file:line` and the **exact text** quoted from the file;
  - for app behaviour: a deep link, such as `/astea/10?etapa=<stage id>&une=<0..1>`.
- **For a claim about the notes:** the sentence id (`w10/…/p…/s…`) and its exact Basque text.
- **For a claim from research:** the author(s), the year and the finding in one line. Mark it "from memory" if you have not checked the source. Do not invent citations; it is fine to say "I believe there is evidence that… but cannot cite it".
- **For a claim about a browser:** the browser, the version or platform, and how you know.
- **Confidence:** high, medium or low.
- **How you checked:** read the code / ran the app / read the notes / inferred.

If an id, a function or a field name is not in the repo, do not mention it as if it were. Search first.

## 7. Severity: impact on the student, not on the code

- **Critical:** the student learns something wrong, or the class leaves them lost or unable to follow.
- **High:** a real loss of learning (overload, a key idea that won't stick, a broken interaction) for many students.
- **Medium:** a smaller loss, or one that only affects some students or devices.
- **Low:** polish.

Rank by severity, then by how many students are affected. Do not label anything Critical unless it meets the definition above.

## 8. Output format

Write the review in English. Quote Basque exactly.

1. **Verdict.** Five lines at most: would this class beat reading the notes for topic 10, and what are the three changes that would help most?
2. **Findings.** 10–12 at most, ranked. For each:
   - the title;
   - the severity;
   - the evidence, as §6 requires;
   - what the student would experience;
   - a concrete fix that fits the plan and the existing code;
   - the confidence and how you checked.
3. **Gaps in the guards.** Each one paired with a test you propose (from §5.B).
4. **Bigger ideas.** At most 3 (from §5.F).
5. **Questions for the owner.** Only questions that block a decision, and none that reopen §3.

Do not pad. If a part of the plan is sound, say so in one line and move on.
