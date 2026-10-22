# Audit of topics 10–11, the circulatory system (2026-10-21)

**Brief (owner):** topics 10 and 11 are the hardest part of the course. They should feel, by far, the best implemented, the highest end and the most understandable topics. Take everything we have learned into account and make the learning experience as good as possible.

**How it was checked:**
- Every step of the 21 stages (143 steps) was shot in real WebGL at 75 % of the step, at 1536 × 960 (`ashots.mjs`, one shot per step, in its own view).
- The learning layer was counted per topic: class, key point per step (`exam`), recall links, tours, micro-questions, milestones, the "Irudia ulertu" guide and notes-figure parity.
- Each class was read against the notes, line by line.
- The notes of both topics were read in full, to ground every new text.

## 1. Already in place in 10–11

- **3D first:** the 3D models of 10–11 are the most advanced in the app:
  - GPU blood cells (topic 10);
  - blood flow through the atrial holes (topic 11);
  - named-side camera keys;
  - glides between steps, and camera moves at every stage crossing but one.
- **Never get lost:** in-stage body → body cuts: 0 in both topics.
- **Labels:** zones, mentioned = visible and focus pop are covered by the shared label and visibility tests.
- **Class (Klasea):** both topics have a Kimu class.
  - Topic 11's class is complete: plain wording on every line, 26 checks.
  - Topic 10's class had plain wording on only 10 of its 81 lines (fixed in batch 1, see below).

## 2. Numbers

| | 7 | 8 | 9 | **10** | **11** |
|---|---|---|---|---|---|
| Steps | 44 | 85 | 93 | 70 | 73 |
| Steps with a FUNTSEZKOA key line (`exam`) | 36 | 64 | 58 | **39** | 54 |
| Stages whose first step recalls an earlier topic | 3 / 6 | 10 / 10 | 11 / 11 | **8 / 10** | 11 / 11 |
| Steps with a tour (names introduced one by one) | 3 | 4 | 8 | 28 | **2** |
| Micro-questions | 29 | 29 | 18 | 24 | 26 |
| Views with an "Irudia ulertu" guide | 1 | 2 | 1 | **0 / 21** | **0 / 21** |
| Class lines with plain wording | 93 / 93 | 126 / 126 | 115 / 115 | **10 / 81** | 93 / 93 |

## 3. Gaps, ranked by study value per effort

### Batch 1: read every picture, keep every fact (this batch)

1. **"Irudia ulertu" guides on every 3D view and every orientation-trap picture of 10–11.**
   - **Gap:** none of the 42 views has one. In the heart, orientation is the first wall students hit:
     - the front view swaps right and left;
     - the venous sinus figure is seen from behind, so it does not swap;
     - the atrioventricular canal lies in the frontal plane, not the horizontal one;
     - the conus and truncus are seen from above.
   - **Fix:** one guide per view, in four parts:
     - Kokatu: where you stand and which side is which;
     - Behatu: one thing to watch;
     - Esanahia: how to read the colours and what is schematic;
     - a question with a hidden answer, worded from the notes.
   - **The student gains** a way to read each picture on demand, without leaving the step, and one retrieval question per picture.
2. **Topic 10 key lines (`exam`).**
   - **Gap:** 39 of 70 steps. Topic 11 has 54 of 73, and the notes of topic 10 are denser in facts (origins, vessels, oxygen).
   - **Fix:** add a FUNTSEZKOA line to every step whose notes carry a fact to keep. Each line is worded from the notes. Pure "look" steps and summaries are left without one.
   - **The student gains** one line to keep per step, for review in the replay.
3. **Topic 10 recall on the first step of its first two stages.**
   - Eskualde kardiogenikoa builds on the primitive streak and the splanchnic layer of the lateral mesoderm.
   - Bihotz hodia builds on the cardiogenic plate and the endocardial tubes.
4. **Topic 10 class plain wording (81 / 81)**, done and tested.

### Batch 2: the origins showcase (next, largest win)

- **Gap:** the course's central idea is that each segment of the tube becomes a given part of the finished heart. The notes summarise it in 5.2 p10 and in the topic 10 table. In the app it is only:
  - a table (topic 10, last step);
  - a flat summary (topic 10, `eratorriak`).
- **Fix:** a closing 3D step for topic 11 in the shared colour code:
  - the septated heart, coloured by the tube segment each part comes from;
  - sinus violet, atrium orange, ventricle cyan, proximal bulbus green, conus lime, truncus ivory;
  - with a glide from the straight tube, through the loop, to the septated heart.

  Each name links back to the stage that built it.
- **The student gains** the whole of 10–11 in one picture: "this smooth wall was the venous sinus; this outflow was the conus".

### Batch 3: polish

- **Topic 11 tours** on the stage openers where three or more parts are new: erretena, balbulak, bentrikuluak and konoa. Topic 11 has 2 tours against topic 10's 28.
- **Topic 10 class:**
  - a one-line road map in the opening, as topic 11's class has;
  - two or three more why-lines in the vessel chunk.
- **Tablet:** 768 / 1024 shots of every 3D view of 10–11.
- **The first-visit "NON NAGO?" plane card** covers part of the scene on 3 of the topic 10 shots. Check it at 1024, and move it to the frame corner if it hides a lit structure.
- **Views no step visits:**
  - topic 10 has 4;
  - topic 11 has 9, all 2D alternatives of the atrial stages.

  They stay, because the 2D picture matches the notes figure, but each is reachable from the view tabs, and its guide (batch 1) says so.

## 4. Batch 1 results (2026-10-21)

- **Guides.** All 42 views of 10–11 have an "Irudia ulertu" guide.
  - They live in `content/heart-guides.ts`: 21 for topic 10, 14 distinct for topic 11 (the atrial stages share their 3D, frontal and right-atrium guides).
  - `withGuides` attaches them in `week10.ts` and `week11.ts`.
  - Each states the side rule of its picture. The venous sinus figure gets a KONTUZ, because it is seen from behind and not swapped.
  - Colours are named only where the model draws them: right ventricle green and left blue-green (the topic 10 origins), primum ivory, secundum pink, aorta red, pulmonary blue.
  - Each guide's question is answered from the notes.
  - `tests/heart-guides.test.ts` guards that every view has all five parts, short enough to read at a glance, and that no guide names a view that is gone.
- **Key lines.** Topic 10 now has 64 of 70 steps with a FUNTSEZKOA line (was 39), each worded from its notes. The six without are pictures and summaries.
- **Recall.** Topic 10's first two stages now recall what they build on:
  - Eskualde kardiogenikoa: the primitive streak and the splanchnic layer.
  - Bihotz hodia: the cardiogenic plate and the blood islands.
- **Class.**
  - The new key lines made six more notes sentences core (112 / 189, 59 %, under the 60 % cap).
  - The class now says each of them: four by citing a line that already said it, two in new lines (the atria open into the venous sinus; the sinus becomes part of the right atrium).
  - Plain wording on 81 / 81 lines, before the two new lines.
  - `docs/klasea/w10-audit.md` was regenerated.
- **Found while checking, fixed for every topic.**
  - **Fading names printed at near full strength.** The dim, shade and context name states set `opacity` in CSS, which overrides the SVG `opacity` attribute that carries a name's fade. So a context name still fading in printed at 78 %, while the layout gave it almost no room. It sat on top of its neighbour, as on the zain sinua 3D view at 10 % of its first step.
    - Fix: the state opacity now multiplies the fade (`--show` in `Label.tsx`, `calc()` in `globals.css`).
  - **3D name spacing ignored the label scale.** `layoutCallouts` spaced names by a fixed 40 frame units. A name prints larger than that whenever the frame is drawn smaller: tablets, a narrow window, or the guide open under the picture.
    - Fix: gaps and plate widths are now scaled by the label scale `k`. A column too crowded for that eases back towards drawn-size spacing, never above its top, so the names under the toolbar rule in `tests/labels.test.tsx` still holds at `k` = 1.3.
    - Checked on the 3D views of 7–9 (1536) and of topic 10 (1024).
- **Verified:**
  - full suite;
  - WebGL shots with the guide open at 1536 × 960, 1024 × 768 and 768 × 1024;
  - every step of 10–11 shot at 1536 × 960, 143 shots, no errors.

## 5. Batch 2 results (2026-10-21)

- **The origins showcase.** Topic 11 has a closing stage, *Bihotz hodiatik bihotzera: jatorriak* (`components/scenes/week11/Origins3D.tsx`), in one 3D view and seven steps:
  1. The finished heart of the stage before rewinds into the straight tube of topic 10. The tube is drawn where the heart is and at its size, each segment in its colour, and the names are introduced one by one.
  2. The tube loops: the bulbus goes forward, down and to the right; the atrial part and the sinus go up, back and to the left.
  3. The loop dissolves, in place, into the septated heart, each part in its segment's colour. The loop is fitted onto the heart (a 28° turn, ×2, least squares over five segment ↔ part pairs), so each segment lies on what it becomes. The trabeculated ventricles come first: the right one from the proximal bulbus (green), the left one from the ventricular part (blue-green).
  4. The conus (lime) gives the two infundibula.
  5. The truncus (ivory) gives the aorta and the pulmonary trunk.
  6. The camera turns to the back. The right atrium's smooth wall comes from the sinus (violet, the cavae open into it); the left's comes from the pulmonary veins (red, four veins). The trabeculated rest comes from the atrial part (orange).
  7. Summary table, segment → derivative, in the same colours. Its cells are names, so each opens its card.
- **Learning layer:** a FUNTSEZKOA key line on six of the seven steps, recall links, one check question, a guide ("Irudia ulertu"), and a class chunk (*Jatorriak*, with its own contrast check). The class's closing table now runs on this stage, and the class stays under 20 minutes.
- **Notes:** each step cites the sentences it shows (sections 1, 2.2, 3, 5.1 and 5.2 p10). The stage is listed under 5.2, with a reviewed exception for the earlier sections.

### Found while checking, fixed for every topic

- **Names sharing one slot printed over each other** while one faded out and the other faded in (the owner's report: "Miokardioa" over "Orri epimiokardikoa", topic 10).
  - Fix: names in the same slot now hand it over. The stronger one fades out first, and the next appears only once it is gone (`handOver` in `components/kit/columns.tsx`, tested in `tests/hand-over.test.ts`).
  - The topic 10 split itself now ends before its step settles, so the step's picture names both layers.
- **View-to-view zooms aimed at the wrong place** (the owner's report: the camera dived in where the arteries could not be seen).
  - Every zoom now first lights the structure it goes to, for 0.65 s, before the camera moves.
  - Topic 10's transverse section → frontal 3D zoom now dives onto the two dorsal aortas, not onto the heart tube.
  - Topic 10's disc → section zoom now closes in on the band the cut runs through, not on the whole disc.
- **A 3D name could slip under the camera keys.** When a name stepped past the side pill, the names below it were pushed down with no check against the column's bottom.
  - Fix: the layout now picks the side that fits.
  - A column that is still too full drops its extra spacing before it overflows.
- **On tablets, the first name in a 3D view's left column could land on the orientation key** (top left). The left column now starts below it (`axes` on `Callouts`).
- **On tablets, a bottom caption could run under the camera keys** (topic 10's frontal 3D: "Bi endokardio hodiak goitik behera…"). A note level with the keys now moves left to clear them, or, if it is too wide for that, just above them (`Note` in `components/kit/Label.tsx`; the viewport now also reports where the keys start horizontally).
- **The origins summary table** was first placed high on the right, where on tablets it met the drag hint and the right side pill. It now sits in the left middle band, between the left side pill and the camera keys, with the heart beside it on the right. Checked at 1024 × 768, 768 × 1024 and 1536 × 960.

## 6. Batch 3 results (2026-10-22)

- **Topic 11 tours.** Four stage openers now introduce their parts one by one: the AV canal (5 parts), the AV valves (3), the ventricular septum (3) and the conus (3). Topic 11 now has 6 tours.
  - Each tour lights only parts that are drawn and named at the opening.
  - Parts first named by a later step stay out of the tour (the bulboventricular ridge, the common atrium, the conus in the septum stage): a tour does not jump ahead of its steps.
- **Topic 10 class.**
  - The opening now gives a one-line road map, from the notes' own sections: the cardiogenic region, the loop, then what each part of the loop gives.
  - Two more why-lines in the circulation chunk, both from the notes' own causal sentences ("beraz…" p29, "Honela…" p36), and the placental arteries line is now marked as a why.
- **Tablet sweep.** Every 3D step of topics 10 and 11 was shot at 1024 × 768 and 768 × 1024 (252 shots), with an automatic check of name plates and notes against each other and against everything fixed over the picture.
  - First pass: about 240 overlaps. Last pass: none, apart from the drag hint, which fades out by itself within seconds and only until the first drag.
  - **The viewport now measures what sits over the picture**: camera keys, scene tools, the 3D turn button, Kimu, and the 3D orientation key, in frame units.
  - **3D names:**
    - names level with the zoom-button column end just left of it;
    - the right column starts under the turn button;
    - the left column ends above Kimu and the bottom captions;
    - a side too full for its names, even at drawn size, hands the names nearest the middle to the other side;
    - two-line names keep their second line off the side pills.
  - **Notes:** a note that would touch one of these slides along its line into the nearest gap wide enough, or wraps onto lines that fit (`placeNote`, tested in `tests/place-note.test.ts`). Table headers stay put.
  - **Origins (topic 11):** the "part ← origin" names are now two lines (the part, then "← origin" smaller underneath), so they no longer cross on tablets.
- **The "NON NAGO?" card** no longer covers the scene: the live map now sits in the stage bar.
