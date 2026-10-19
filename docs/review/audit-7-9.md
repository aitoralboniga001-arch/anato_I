# Audit of topics 7–9 against what topics 10–11 taught us (2026-10-19)

**Brief (owner):** a comprehensive, thorough audit of topics 7–9. Find where the improvements made in later topics can be used, **but only where they improve the experience**.

**How it was checked:**
- Every step of the 28 stages (222 steps) was shot in real WebGL at 75 % of the step, at 1536 × 960.
- Every view change in the guided order was classified as a camera move or a hard cut, using the app's own planners (`travelPlan`, `zoomPlan`).
- The four 3D cameras of 7–9 were sampled at 401 points, as in topic 11's walkthrough.
- The learning layer was counted per topic: class, per-step key point (`exam`), recall links, tours, timeline, quiz and atlas.
- The existing perf results and the test suites that guard the earlier lessons were read.

**Not checked:**
- Audio narration.
- Reduced motion.
- A full 768 px sweep: only sample views were shot at tablet size.

## 1. Already in place in 7–9 (nothing to do)

These lessons live in shared code or in tests that cover every topic, so 7–9 already have them:
- **Labels:**
  - label zones and overlaps are checked by `tests/labels.test.tsx` for all topics;
  - the mentioned = visible rule and focus labels are checked by `tests/visibility.test.tsx` for all topics.
- **3D names:**
  - names follow the camera during drags and glides;
  - the turn buttons glide in 420 ms;
  - WebGL contexts are reused, so there is no "prestatzen" spinner in the middle of a move;
  - the tablet pill band (`callouts.tsx`) is used by all four 3D views of 7–9.
- **Small screens:** the ≤ 820 px layout (`--under-frame`) is shared.
- **Perf:** the four 3D views of 7–9 already play at 60 fps:
  - p95 frame 16.8–17.6 ms;
  - main thread 72–278 ms/s;
  - GPU 1.2–3.5 ms (`docs/perf/renderer-audit/results.json`).

  No perf work is needed. The domains view draws 556k triangles, over topic 11's 250k budget, but it holds 60 fps, so it is not worth touching.
- **Plane moves:** topic 7's moves between body planes already travel (plane travel inside the modelled embryo). Topic 7 has **no in-stage cut between two body planes**.
- **Guide:** 7–9 have the "Irudia ulertu" guide on their 3D views, which 10–11 lack. That is a forward-port idea, outside this audit.

## 2. Gaps, ranked by study value per effort

### Numbers behind the ranking

| | 7 | 8 | 9 | 10 | 11 |
|---|---|---|---|---|---|
| Kimu class (Klasea) | – | – | – | ✓ | ✓ (with plain wording) |
| Steps with a FUNTSEZKOA key line (`exam`) | 12 / 44 | **0 / 85** | 5 / 93 | 39 / 70 | 54 / 73 |
| In-stage view changes that cut, body → body | 0 | **11** | 6 | 0 | 0 |
| In-stage view changes that cut, to / from a table or close-up | 5 | 0 | 15 | 0 | 0 |
| Stage crossings that cut (no bridge, no 3D continuity) | 5 / 5 | 9 / 9 | 10 / 10 | 1 / 9 | 0 / 10 |
| 3D views with named-side camera keys (`axes.edges`) | 0 / 1 | 0 / 2 | 0 / 1 | all | all |
| Stages whose first step recalls an earlier topic | 3 / 6 | **0 / 10** | 11 / 11 | 8 / 10 | 11 / 11 |
| Steps with a tour (names introduced one by one) | 3 | **0** | 8 | 28 | 2 |
| Timeline milestones | 4 | 8 | **0** | 6 | 4 |
| Views no step visits | 2 (`mapa` ×2) | 1 (`ebakiak`) | 0 | 4 | 9 (2D alternatives) |

### Recommended back-ports (do these)

Each item says what the student gains, so it passes the brief's test: **only if it improves the experience**.

#### A. Named-side camera keys on the four 3D views (cheap, high value)
- **Gap:** all four 3D views of 7–9 pass `axes` without `edges`. Their pad shows a bare arrow cross instead of the named sides that 10–11 have (Kraneala / Kaudala / Bentrala / Dortsala / Ezkerra / Eskuina):
  - `components/scenes/week7/DiaphragmDome3D.tsx:405`
  - `components/scenes/week8/Calvaria3D.tsx:503`
  - `components/scenes/week8/LimbRotation3D.tsx:315`
  - `components/scenes/week9/Domains3D.tsx:338`
- **Also:** the "seen from …" notes stay on screen after the student turns the model. Topics 10–11 fade them with `askedView` (`components/scenes/week10/Heart3D.tsx:241`).
- **What the student gains:** they always know which side they are looking at ("never get lost"). The same keys also appear in every topic, so the style stays consistent.
- **Cost:** about one line per scene, plus the fade and a sides test per scene.

#### B. Longer glide on the limb turn (cheap)
- **Gap:** in `gorputz-adarrak / biraketa` the camera turns 88° between t 0.920 and 0.963 of a 48 s stage. That peaks at about **121°/s**. Topic 11 keeps glides at about 55°/s or less, after fast turns made students lose their place.
- **Fix:** spread the turn over about 4 s with a per-key glide (`cameraAt`, as in topic 11), or start it earlier in the step.
- **What the student gains:** the limbs' rotation is the point of the stage, and a whip-pan hides it.
- **Other cameras:** the diaphragm and skull cameras measured fine. Domains-3d stays still on steps 2–4 while its content moves, which is fine.

#### C. Kimu class (Klasea) for topic 7, then 9, then 8 (big, highest study value)
- **Gap:** 7–9 have no guided class. Topics 10–11 showed that the class is the easiest way in for a student starting from zero.
- **Order:**
  1. Topic 7: the hardest topic for students, and a showcase topic.
  2. Topic 9: a showcase topic, and its stages already open with a recall.
  3. Topic 8.
- **Core size:** `scripts/klasea/core-map.ts` counts the cited core sentences per topic:
  - topic 7: 76 of 128. That is close to the 60 % cap the tests allow, so the class must stay short and pick what matters.
  - topic 8: 56 of 213.
  - topic 9: 46 of 227.
- **Build it the way topic 11's was:**
  - `plain` wording on every line from the start;
  - a short class (12–20 min);
  - rules, not review;
  - every named structure lit.
- **Cost:** one batch per topic, each with its own test loop.

#### D. FUNTSEZKOA key lines (`exam`) in topics 8 and 9 (medium, pairs with C)
- **Gap:** steps with a key line:
  - topic 8: **0 of 85**;
  - topic 9: 5 of 93;
  - for comparison, topic 10 has 39 of 70 and topic 11 has 54 of 73.
- **What the student gains:** the side card's key line is what they re-read before an exam. A class also leans on it.
- **Rule:** write them from the notes' prose only (notes prose wins). No past-exam material.
- **Cost:** content only, no code. Best done in the same batch as each topic's class.

#### E. Camera moves instead of cuts inside topics 8 and 9 (medium)
- **Gap:** 17 in-stage changes between two body pictures are hard cuts.
  - Topic 8 (11 cuts):
    - `jatorriak`: mapa ↔ zeharkakoa;
    - `buru-ganga`: albotik → kupula → goitik → albotik → goitik;
    - `errai-kraneoa`: arkuak → burezurra (a 5-week embryo head becomes a newborn skull with no bridge);
    - `gorputz-adarrak`: hastapena → biraketa;
    - `ornoa`: goitik → atzetik;
    - `bizkarrezurra`: zeharkakoa → koronala → makurdurak.
  - Topic 9 (6 cuts):
    - `nerbio-espinala`: ornoa → zutabea → ornomuina;
    - `epaxial-hipaxiala`: zutabea → sareak;
    - `muskulu-lisoa`: jatorria ↔ hestea.
- **Fix:** `bridges` (`section` / `look` / `zoom`) as in topic 10, so the camera shows where the new picture sits in the old one.
- **What the student gains:** these are exactly the jumps where a student asks "what am I looking at now?". The `errai-kraneoa` jump is the worst, because it changes both the week and the scale.
- **Then, at lower priority:** the 24 stage crossings of 7–9 also cut. Bridge only the crossings that change the body or the scale. A crossing that starts a new subject reads fine as a cut.
- **Not worth it:** the 20 cuts to or from a table or close-up (5 in topic 7, 15 in topic 9). A table is not a place in the body, so a camera move there teaches nothing.

#### F. Smaller learning-layer gaps (cheap content)
- **Recall links in topic 8:** none of its 10 stages opens with a recall, while topics 9 and 11 do it on every stage. Fix: link each stage's first step to the earlier topic it builds on (somites from topic 4, pharyngeal arches from topic 5, and so on).
- **Timeline milestones in topic 9:** there are none. Fix: add the dated events the notes give (myoblasts, fusion, limb muscles arriving, and so on).
- **Tours in topic 8:** there are none. Fix: add tours only on the crowded first views (skull bones, vertebra parts), where names appearing one by one help memory. Do not add tours for their own sake.

#### G. Name chips on the 3D models (check, then likely trim)
- **Gap:** the small 🔍 chips repeat the same name three times over the model. Examples: "Hezurtzapen zentro primarioak" on the skull, "Aurre-alboko muskulu zelulak" in domains.
- **Fix:** once each part glows (anchor-inside rule), one name is enough. Keep one chip per name, or drop the chips where the glow already says it.
- **What the student gains:** a cleaner picture, in line with the no-drawn-pointers and consistent-style rules.
- **Before cutting:** check with the labels test, and keep every name.

#### H. Topic 7: from the coelom section to the septum section (owner request, 2026-10-19, high value)
- **Owner's words:** "me cuesta visualizar la transición entre estas dos vistas" (it is hard to picture how one view becomes the other). The two views are:
  - `zeloma / zeharkakoa` (`CoelomFold`): the flat disc on day 20, with the coelom as a purple slit between the somatopleure and the splanchnopleure;
  - `septum-transversum / zeharkakoa` (`SeptumSection`, `components/scenes/week7/Diaphragm.tsx:761`): a round body at C3–C5 with an orange septum, a green oesophageal mesenchyme and two dark-blue canals.
- **Why the jump is hard (seen in the shots):**
  1. **Two kinds of picture.** The coelom view is a slice through tissue. The septum view reads as a look *down onto a floor* with two holes in it. Nothing tells the student that the camera changed from "slice" to "looking down at a shelf".
  2. **Nothing grows.** `SeptumSection` borrows the diaphragm section at its t = 0.5 (`early`), so the septum is already there, whole. The student never sees the round coelom of the closed body being partly closed by a shelf that grows in from the front wall.
  3. **The coelom changes colour.** The canals are the leftover coelom, but they turn dark blue ("erretenak") instead of staying the purple coelom of stage 1. The somatopleure and splanchnopleure, the gut tube and the mesentery of stage 1's last step also disappear. That breaks the rule that the same structure looks the same.
  4. **A different level and week with no link.** Stage 1 ends at the midgut level (day 28, closed tube). The septum section is at the neck level (C3–C5). The sagittal steps in between show the level line, but the section does not start from a picture the student already knows.
- **Fix, in order of value:**
  1. **Start the septum section from stage 1's last picture.** Same colours: coelom purple, the two layers, the gut in the middle. Then grow the septum from the front wall as an orange shelf. What is left open beside the oesophagus stays purple, and only then gets its name, "erretenak". This needs a `SeptumSection` that starts at an earlier state of `DiaphragmSection`, or a short opening built on `CoelomFold`'s closed-body frame.
  2. **Say what the camera is doing.** Before the cut, the sagittal view shows the C3–C5 plane as a sheet seen edge-on. A `look` bridge then tilts down through it, so the student sees that they are looking at the shelf from above (cranial view) and that the two dark holes go down to the peritoneal cavity. Text above lines, no drawn pointers: the shelf and the holes glow.
  3. **Best, if the 3D route is taken:** reuse the topic 7 diaphragm 3D model (`DiaphragmDome3D`) at its early state: a trunk slab with the septum as a horizontal shelf. The student turns it from the side (shelf edge-on) to the top (shelf and two canals). This is what "prefer 3D" means for the hardest topic. The cost is higher; do it only if fixes 1–2 are not enough.
- **Second owner report, same stage:** "hasierako perikardio barrunbea eta peritoneo barrunbea ez dakit agertzen badira, baina ez ditut ikasi 7. gaian" (I am not sure the two cavities even appear; I did not learn them in topic 7). They do appear, but the way they are taught makes them easy to miss:
  - **One short step.** The only step that names them is `septum-transversum` step 3 (`content/weeks/week7.ts`, `at: 0.36`). It runs from 0.36 to 0.54 of a 30 s stage, so about **5 s**. These are the two names that the rest of topic 7 builds on (pleura, pericardium, peritoneum).
  - **No key line.** Step 2 has a FUNTSEZKOA line (C3–C5), but step 3 has none, so the side card never states the fact to re-read.
  - **Gone in the next picture.** Only the side view names and colours them (pink above, green below). The transverse section that follows never names them, and its note says only "goiko ↔ beheko barrunbea". As a result, the two cavities are seen once and then lost.
- **Fix (add to the batch):**
  - Give the two cavities a step of their own of about 10–12 s, by lengthening the stage or the step. Light them one at a time: the septum, then the upper cavity glows pink and its name pops, then the lower cavity glows green and its name pops.
  - Add the key line: "Septum transversuma: gainean hasierako perikardio barrunbea (torax osoa), azpian peritoneo barrunbea."
  - Carry both names and colours into the transverse section. Above the shelf is the initial pericardial cavity; the canals lead down to the peritoneal cavity. The note should name them instead of "goiko / beheko".
  - Check that the visibility test covers the names in the section (mentioned = visible).
- **Siblings to check in the same batch:** the same "slice ↔ looking down" change happens later, in `pleura-perikardioa` and `diafragma-eraketa` (the same `DiaphragmSection`). The canal colour must match there too.
- **Cost:** fixes 1–2 are one scene file plus one view entry (`bridges`), with labels and visibility tests and real-WebGL shots of the whole stage-1 → stage-2 path at 1536 px and 1024 px.

#### I. Studying from the notes: each notes figure should have a picture that looks like it (owner request, 2026-10-19, high value)
- **Owner's words:** "I study from the notes, and then I go checking the simulation while studying … I find it hard to locate myself, things are not in the same order … or there are things that don't appear, like mesenterio dortsala edo atzeko mesenterioa, or at least I find it hard to visualize it." The example is notes section 2.1, *Peritoneo barrunbea*, with its A → B → C figure: the open disc, then the folding, then the closed body with the gut hanging from the "Atzeko mesenterioa".
- **What is already right:**
  - **Stage order.** The topic 7 stages follow the notes' headings (1, 2, 2.1, 2.2, 3, 3.1), and inside a stage the steps follow the notes' sentences in order.
  - **The dorsal mesentery is taught.** It is lit and named in `peritoneo-barrunbea` steps 2–3.
  - **A notes reader exists.** The in-app notes reader (**Apunteak**, key N) shows the same text, lights the sentence being shown, and jumps to its step when a sentence is clicked. Figure captions get a "Simulazioan ikusi" link.
- **What is wrong (why the student gets lost):**
  1. **The notes' figure is in another stage.** The A → B → C sequence is drawn by `CoelomFold` in stage 1 (`zeloma`, notes section 1). In stage 2.1, where the notes print it, the student finds something different: a finished abdominal section with kidneys, aorta and cava. Its caption, "Atzeko mesenterioa ikusi daiteke", links to step 2 of that section, a picture that does not look like the figure.
  2. **The change itself is never shown.** The notes say the gut is first held by a *wide* mesenchymal link, then by a *two-layer* link, the dorsal mesentery. In the simulator, step 1 shows the wide link and step 2 the thin one, but the student does not watch the first become the second. The notes' clause "hasieran ez du guztiz inguratzen hestea" (at first the splanchnic layer does not fully wrap the gut) is not shown either.
  3. **The notes' second name never appears.** The notes and their figure say "atzeko mesenterioa"; the simulator's label says only "Mesenterio dortsala". The atlas has the alias (`week4b.ts:303`), but the picture never shows it.
  4. **Some captions have no link** (no "Simulazioan ikusi"):
     - topic 7, "Peritoneo barrunbea" (2.1);
     - topic 8: 4 of 8, including "Kondrokraneoa goitik ikusita". The `kondrokraneoa` stage exists; its steps just do not cite the caption.
     - In topic 9 all 23 captions are linked. Most are table fragments, not figures.
- **Fix:**
  - **2.1 opens on the notes' figure.** `peritoneo-barrunbea` step 1 starts from `CoelomFold`'s A → B → C, with the same colours as stage 1. The camera then moves into the abdominal section (a `zoom` / `look` bridge), and the student watches the wide link thin into the two-layer mesentery.
  - **Both names.** The first time the label appears, it reads "Mesenterio dortsala (atzeko mesenterioa)" (keep-all-labels: add, never cut). The FUNTSEZKOA line names both too.
  - **Caption links.** Every caption of a real figure links to the step whose picture matches it.
  - **A new check, "figure parity", for every topic.** For each notes figure: name the view and step that reproduce it, and confirm by eye that a student can match them. Add a test listing the captions that must be linked.
  - **The student's way of studying.** Show the Apunteak panel in the first-run guide ("study with the notes open here"). Reading the notes inside the app gives this student exactly the side-by-side they now get by hand from Word.
- **Cost:**
  - step 1 of 2.1: one scene opening plus a bridge;
  - names and caption links: content only;
  - the figure-parity check: one test.
- **Same batch as H.** It is the same thread: coelom → septum → peritoneum, with the coelom kept in one colour.

### Possible, lower value (only after A–I)

- **Topic 9 front embryo (8 weeks):**
  - **Problem:** the front view on the `epaxial-hipaxiala` steps and the last `ehun-konektiboa` step reads as a doll (round head, tube limbs). The rule is that the embryo must look like an embryo.
  - **Fix:** rework the figure toward the week-5 `EmbryoFigure` look (the one-lateral-embryo rule), or switch to a lateral view where the content allows.
- **3D vertebra (topic 8 `ornoa`):**
  - **Why:** the flat vertebra drawings teach the parts, but a vertebra the student can turn would show body, arch and processes far better (prefer 3D).
  - **Value and cost:** medium value, high cost. Do it only if topic 8's class shows students get stuck there.
- **Stage intros in 7–8:** a one-line "what this stage is about" opener, as 10–11 have. Minor, because the class covers it.

### Do not do (checked, no gain)

- **Perf work:** all four 3D views already hold 60 fps. The 556k-triangle domains model is over budget only on paper.
- **Views no step visits** (topic 7 `mapa` ×2, topic 8 `ebakiak`): they are free-exploration extras, reachable from the tabs. Forcing them into the guided order would make it longer without adding content.
- **Bridges to tables:** see E.
- **Redrawing the 2D scenes:** the 2D drawings of 7–9 are polished and match each other. Shots of every step showed no broken label, no overlap and no missing structure, apart from load-time ghosts (see below).

### Shot artifacts that are not bugs

On the slow dev server, a few deep-link shots taken at 2.6 s show one of two things:
- a fading ghost of the stage's first picture;
- the 3D "prestatzen" spinner (all of `domeinuak` steps 1–4).

Re-shot at 5–6 s, every one of these frames is clean. The DOM check found only the normal `view-switch-ghost` cross-fade.

## 3. Suggested batches

1. **A + B:** named sides on the four 3D views, fading "seen from" notes, and a slower limb turn. One short batch covering all four scenes, with tests and tablet shots.
2. **H + I (topic 7, coelom → septum → peritoneum, and the notes' figures):** 2.1 opens on the notes' A → B → C figure, the mesentery is seen thinning, both names are shown, figure captions are linked, and a figure-parity test is added. Also: give the two cavities their own longer step with a key line, keep their names and colours in the section, keep the coelom's colour, grow the septum, and add a `look` bridge into the section. Check the sibling sections in `pleura-perikardioa` and `diafragma-eraketa`. This comes before the topic 7 class so the class can narrate the new transition.
3. **C + D for topic 7:** the class with plain wording, plus key lines where they are missing.
4. **E for topic 8:** the 11 in-stage bridges, starting with `errai-kraneoa`, plus the **F** recall links for topic 8 and the **I** caption links (`kondrokraneoa` and the others).
5. **C + D for topic 9**, plus the **F** timeline milestones.
6. **C + D for topic 8**, plus the **F** tours.
7. **E for topic 9** and the crossings that change body or scale, plus **G** (name chips).
8. Optional: the topic 9 front embryo and the 3D vertebra.

Each batch ends with:
- tests;
- real-WebGL shots at 1536 px and at 768–1024 px;
- a commit.
