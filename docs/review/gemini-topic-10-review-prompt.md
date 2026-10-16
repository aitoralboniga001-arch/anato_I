# Read-only review of Topic 10 (heart development): prompt

You are reviewing one topic of an interactive embryology web app. This is a **read-only pass**. Do not edit, create or delete any file, do not commit, and do not change settings. Read the code, run the app if you can, and write a critical, concrete review.

Your strengths in 3D, simulation and visual explanation are the reason you were asked. Be demanding and honest. Praise only what earns it, and say clearly what is wrong, confusing or ugly.

---

## 1. What this app is and who it is for

- **Who uses it.** First-year medical students at a Basque university, studying human embryology. The interface, structure names and explanations are in **Basque (euskara)**.
- **What it replaces.** The course notes are dense PDFs, written by students and corrected by the teacher. The app turns each topic into a guided, animated simulation: stages, then steps, then animated scenes with labels, narration text, quizzes and a 3D model.
- **The bar it must clear.** Students should **understand and memorise better than they would with the notes alone**. Each new topic must be a step forward over the previous ones.
- **Who sees it beyond students.** Anatomy and embryology teachers will be shown the app. Anatomical accuracy and visual polish both matter.
- **Target devices.** PC and tablet, 768–1440 px wide. Phone layout is out of scope.

**The single most important principle.** Every scene must be understandable to a student who knows *nothing* about the topic yet, the first time they see it. Specifically:

- The student must never get lost:
  - always know where they are looking from (front, back, left, right, top, bottom);
  - know which plane a section cuts;
  - know which part of the body or organ they are inside;
  - know how the current view relates to the previous one.
- What the text names must be visible on screen at that moment. What is lit must be the thing being discussed, and only that.
- Animations must explain a process, not just decorate it.

The owner has said plainly that **getting lost is the worst UX regression possible**, the kind that makes students stop using the tool. Treat every moment of possible disorientation as a high-severity finding.

---

## 2. Topic 10: 10. GAIA — ZIRKULAZIO APARATUA (cardiovascular development)

- **Source of truth.** The notes PDF, `10. GAIA_ ZIRKULAZIO APARATUA (ZUZENDUTA).pdf`, sits in the folder *above* the repo, if you have access to it.
  - Its text has been extracted to `content/notes-text/w10.ts`, with sentence ids like `w10/<section>/p<n>/s<n>`.
  - Each step lists the note sentences it covers in `notes: [...]`.
  - Every sentence of the notes is mapped to some step; `tests/notes.test.ts` checks this.
- **When the notes disagree with themselves.** Their prose wins over their tables.
- **When the notes disagree with textbooks** (Langman, Moore, Carlson). Say so, but frame it as "the notes say X, the standard texts say Y". The app follows the notes; the owner decides what to do about the difference.

Ten stages:

| # | stage id | what it teaches | views |
|---|---|---|---|
| 1 | `eskualde-kardiogenikoa` | cardiogenic region: blood islands, horseshoe plexus, cardiogenic plate, endocardial tubes | `diskoa` (disc from above), `zeharkakoa` (transverse section) |
| 2 | `bihotz-hodia` | folding: cephalocaudal fold carries the heart into the thorax, lateral folding fuses the two endocardial tubes, myocardium/epicardium, cardiac jelly, dorsal mesocardium disappears | `zeharkakoa`, `sagitala` (head fold), `3d` (tubes zipping, dorsal aortas, notochord) |
| 3 | `zirkulazio-goiztiarra` | early circulation: vitelline, umbilical and cardinal systems, O2-coloured vessels, summary table | `alboa` (whole conceptus → embryo → heart, lateral), `3d` |
| 4 | `bihotz-atalak` | segments of the heart tube | `3d` |
| 5 | `bihotz-lakioa` | cardiac looping (day 23–28) | `3d` (ghost of the straight tube, direction arrows) |
| 6 | `atal-bulbarra` | bulbus cordis and its derivatives | `3d`, `eratorriak` (derivative map) |
| 7 | `atal-bentrikularra` | ventricles | `frontala` (2D frontal heart), `3d` |
| 8 | `atal-aurikularra` | primitive atrium | `3d` (front → right → behind), `frontala` |
| 9 | `zain-sinua` | sinus venosus, its horns, the shift to the right | `3d` (seen from behind, with a KONTUZ warning on left/right), `frontala` |
| 10 | `eskuineko-aurikula` | right atrium: sinoatrial orifice, valves, septum spurium, smooth vs trabeculated parts, crista terminalis | `barrutik` (atrium opened, one morphing drawing), `trenkada` (septum), `frontala`; ends on a summary table |

**Key files**

- Content, all in Basque:
  - `content/weeks/week10.ts` (stages 1–2 and the quiz)
  - `content/weeks/week10-circulation.ts` (stage 3)
  - `content/weeks/week10-loop.ts` (stages 4–5)
  - `content/weeks/week10-derivs.ts` (stages 6–10)
  - `content/weeks/week10-structures.ts` (structure ids, names, colours)
- Scenes: `components/scenes/week10/`.
  - `model3d.ts` is **one parametric heart model** posed per step. Its pose fields include `fuse`, `segs`, `loop`, `atriaFuse`, `split`, `expand`, `shift`, `obliterate`, `anast`, `coronary`, `hole`.
  - The rest: `Heart3D.tsx`, `Stage2Views.tsx`, `Disc.tsx`, `DiscSection.tsx`, `Fusion.tsx`, `Circulation.tsx`, `Circulation3D.tsx`, `Bulbus.tsx`, `Derivs.tsx`, `RightAtrium.tsx`.
  - The 2D frontal heart is reused from topic 11: `components/scenes/week11/heart.tsx` (`HeartArt`).
- Shell and kit:
  - `components/shell/Simulator.tsx`: the player, steps, view changes, crossfade ghost.
  - `Viewport.tsx`: frame, zoom, edge pills, camera keys.
  - `ViewZoom.tsx`: camera dives between linked views.
  - `ViewTravel.tsx`: plane travel on the body, used in earlier topics.
  - `components/kit/three/Stage3D.tsx` and `gl.ts`: WebGL underlay with an SVG overlay for labels.
  - `lib/three-d/` holds the camera and orbit math.
- Data model: `lib/sim/types.ts`. A `ViewDef` can declare `zoom` and `bridges`, which link views so the camera travels between them.
- Handover notes from the builders: `docs/handover/topic-10.md`, `docs/handover/animations-7-9.md`.
- Guard tests worth reading to see the rules:
  - `tests/visibility.test.tsx`: lit means only that structure; named means visible; the focus label stands out.
  - `tests/labels.test.tsx`: labels stay inside safe zones.
  - `tests/notes.test.ts`.

**How a step is built.** A step (beat) has:
- `text`, the narration;
- `idea`, a one-line summary;
- optionally `key` (ULERTZEKO GAKOA, "key to understand"), `exam` (FUNTSEZKOA, "the essential fact") and `ask` (an inline quiz question);
- `focus`, the structures lit;
- `tour`, the structures named one by one;
- `view`, which view is shown.

**Glossary of the UI words you will see.** etapa = stage, urratsa = step, ikuspegia = view, une = time within the stage (0–1), Hurrengoa = next, Ikusi urratsa = play this step, Hurrengo etapa = next stage, Aurretik / Atzetik / Ezkerretik / Eskuinetik / Goitik / Behetik = from the front / behind / left / right / above / below, Kraneala / Kaudala / Dortsala / Bentrala = cranial / caudal / dorsal / ventral, Ezkerra / Eskuina = left / right, KONTUZ = careful (a common trap), GOGORATU = remember, Laburpena = summary, Apunteak = notes, Galderak = questions, Kimu = the app's chat helper.

---

## 3. Running it (if you can)

```bash
npm install
npm run dev
```

Open `http://localhost:3000/astea/10`.

**Deep links**
- `?etapa=<stage id>&une=<0..1>` opens a stage at a point in time. Example: `/astea/10?etapa=zain-sinua&une=0.5`.
- Adding `&ikuspegia=<view id>` forces a view. Doing so pins that view for the following steps, so leave it out when you want to judge the automatic view changes.
- Adding `&jolastu=1` autoplays.

**Controls**
- Space plays or pauses; ← and → move between steps; L cycles the label modes; `[` and `]` toggle the side panels; `?` opens help.
- Dragging a 3D view turns it. The named-side keys turn it to a side, and ↺ resets it.
- "3D bira" runs a camera tour of the structures.

**What has to be watched live.** Animations, camera glides, the dives between views and the crossfades all run on requestAnimationFrame. Judge them in a real, visible browser. Static code reading cannot tell you whether a move is followable.

If you cannot run it, review from the code and say which conclusions you could not verify.

---

## 4. Rules the owner has set: judge against them, and do not suggest breaking them

- **Never remove structure names.** Every name the notes use stays. Names may appear progressively: shown when said, all shown at the stage end, all at once with the L key.
- **No drawn pointers.** No rings, dashed boxes or arrows pointing at things. To show a structure, make the structure itself glow or outline it. Label text always sits above its leader line. Leaders are short and tidy.
- **Anchor inside.** A label's dot sits well inside its structure, never on a seam between two. A composite structure gets a span tick, and all its parts glow.
- **Visibility.** What is lit is only that structure. Anything the step's text names is visible in that step. The focused label stands out and the others step back.
- **Narration zoom reveal.** If the narration names something the current zoom cuts off, zoom out briefly to show it, then zoom back in.
- **Consistent style.** The same structure looks the same across views and topics. Keep a semi-realistic look with strong contrast, not abstract diagrams.
- **3D honesty.** Edge pills (EZKERRA, KRANEALA…), leaders and arrows must stay true while the model turns, and must never show a direction that is not real. A direction seen end-on becomes a dot or a crossed ring, never a fake arrow.
- **Every view change moves the camera.** It dives into a cut, pulls out, travels along the body, or glides between 3D cameras. A hard cut between views counts as a defect. This was just implemented for topic 10; it is the newest work, so test it hardest.
- **No past exam questions or material**, and no mention of them, anywhere. Do not suggest adding past-exam content.
- **Don't propose replacing the 3D model with external datasets or scanned models.** That route was tried and dropped: too complex compared with the notes. Improve the parametric model instead.

---

## 5. What to review

Go through **every stage and every step** of topic 10 in order. Watch each step play out and each view change happen. For each stage, ask:

### A. Getting lost (highest priority)
- At every view change, is it obvious where the new view sits relative to the old one? Which plane? Which side? Inside or outside?
- In every 3D view, can a novice tell front from back and left from right at a glance? Are the student's left/right and the embryo's left/right ever confusable? Stage 9 is seen from behind: is that clear enough?
- Are 2D sections tied clearly to the 3D model and to the whole embryo, with a locator or a "where am I"? Or does the student have to guess?
- Does any camera move go too fast, too slow, or through a confusing path? Does any start before the student has read the step, or end somewhere unexpected?
- Does any step change the anatomy and the viewpoint at the same moment, which doubles the cognitive load?

### B. The notes made visible
- For each step: does the animation actually *show* what the `text` says? Read the note sentences listed in `notes`, then compare.
- Is anything in the notes stated but never visualised, or visualised weakly?
- Is anything shown that the notes don't support, or that is anatomically wrong? Check in particular:
  - looping direction;
  - which segment becomes what;
  - sinus horns and their fate;
  - which veins drain where;
  - valve and septum positions;
  - the smooth and trabeculated parts of the right atrium.
- Are the timings right? Do processes that the notes say happen together appear together, and sequential ones in sequence?

### C. 3D and animation quality
This is your speciality.
- Shape, proportion and topology of the heart at each stage. Does it read as a real embryonic heart?
- Materials, lighting, colour coding, depth cues, silhouettes, and how the model reads at 768 px.
- Camera framing per step; the choice of default viewpoints; easing and duration of glides.
- Morphs between poses: are they smooth and causally readable ("this part grows into that")?
- Is a 3D view ever used where a 2D view would explain better, or the reverse?
- Is the SVG label overlay well integrated with the WebGL picture? Look for leaders crossing the model, labels covering key anatomy, and clutter.

### D. Pedagogy and UX
- How long and dense are the steps? Is too much said or lit at once?
- Is it clear what to look at in each step?
- Do the quizzes (`ask`) test understanding, or only recall?
- Does the summary table at the end of stage 10 consolidate well?
- Are there missing "aha" moments, places where a short extra animation, a comparison or a before/after would make a concept click?
- Accessibility: contrast, reduced motion, keyboard use.

### E. Engineering, as far as it affects the student
- Visible jank, popping, loading spinners or flashes during moves.
- Fragile patterns likely to break the "never lost" guarantee in future topics.

---

## 6. Output format

Write the review in English. Quote Basque UI text and structure names exactly as they appear.

1. **Executive summary.** Ten lines at most: the overall verdict and the three changes that would help students most.
2. **What is working.** Specific, with locations. This keeps the owner from "fixing" what is good.
3. **Findings, ranked by severity: Critical / High / Medium / Low.** For each finding give:
   - **where:** stage id, step number or `une`, view, and a deep link `/astea/10?etapa=…&une=…`; add file:line when it is a code issue;
   - **what the student experiences**, in one or two sentences, from the point of view of a novice;
   - **why it matters:** confusion, an anatomical error, a notes mismatch, polish;
   - **a concrete fix** that fits the existing architecture (pose fields in `model3d.ts`, camera per step, `bridges`/`zoom` on a view, label placement, step text), not "rebuild it";
   - **confidence:** verified live, read in code, or inferred.
4. **Notes vs animation table.** Every note section that is missing, weak, wrong or out of order on screen.
5. **Anatomy check.** Everything you believe is inaccurate, with the notes sentence id and, where relevant, what the standard texts say.
6. **Bigger ideas.** At most five ambitious improvements a strong 3D or simulation engineer would make: new visualisations, interactions or comparison modes. For each, give the learning gain and a rough cost.
7. **Open questions** for the owner: things you could not decide without them.

Be concrete. "The camera move at stage 9 is confusing" is not useful. "At `zain-sinua` step 3 (`une≈0.42`), the view swaps from 3D-from-behind to the frontal section seen from the front; for about 0.5 s the left sinus horn appears on screen-left in both, so…" is.

Do not pad. If something is fine, say so in a line and move on. Spend your words on what would make a novice understand faster and never get lost.
