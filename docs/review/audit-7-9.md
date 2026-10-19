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

#### J. Every named structure must be clearly seen (owner request, 2026-10-19: "must be solved in this iteration across topic 7 to 9")
- **Owner's example:** `septum-transversum` step 5. "Erreten perikardioperitonealak" is lit, but the student sees only a fuzzy orange pool inside a large dark-blue area; no canal can be made out.
- **Why it happens in the canals (`components/scenes/week7/Diaphragm.tsx`):**
  - three different things carry the canal's id:
    - the whole open cavity (`CAV_X`, line 630);
    - the two canal shapes (`CANAL_L`, line 650);
    - two `Mark` light pools (lines 678–679).
  - When the step lights the canals, the outline of the whole cavity glows, so the space reads as one cavity wrapped around the oesophagus, not as two passages.
  - The `Mark` blobs sit in the middle with no edge.
  - `Mark` is meant for things with **no outline of their own** (a process, a direction); the canals have one.
- **The rules this sweep enforces** (from no-drawn-pointers, anchor-inside and visibility-guard):
  1. **A lit structure glows by its own shape.** Use an outline and a tint, never a pool of light, when the structure has a shape. `Mark` stays only for processes (e.g. `tolestura-laterala`).
  2. **One id, one thing on screen.** A container must not carry the id of what is inside it.
  3. **When a structure is the step's subject, it is big enough to see.** About 40 px or more at 1536 px wide and about 28 px or more at 1024 px. If it is small in the body, zoom in with a bridge (and keep context, see "never get lost").
  4. **Its defining feature is visible.** If the text says "two-layer", "a canal", "an opening" or "fused", the picture shows two layers, a passage, a hole or the fusion.
- **Found** (automatic check of all 222 steps, then every flag checked by eye):
  - **Topic 7, structures lit only by `Mark` blobs although they have shapes:**
    - `erreten-perikardioperitonealak` (`septum-transversum` 5; `Diaphragm.tsx:678–679`): redraw as two separate dorsolateral passages beside the oesophageal mesenchyme. Give them depth shading (a passage going down to the peritoneal cavity) and the coelom colour (see H). Remove the id from `CAV_X`.
    - `aortaren-hiatoa`, `hestegorriaren-hiatoa`, `beheko-kabaren-zuloa` (`diafragma-heldua` 4; `DiaphragmAdult.tsx:215–217`): the three openings are glowing dots on vessels about 15 px wide. Draw each as an opening in the muscle or tendon with the vessel passing through, and zoom in on the step.
    - `bularrezur-atala`, `gerriko-atala` (`diafragma-heldua` 5, side view; `DiaphragmAdult.tsx:445–446`): blobs at the two ends of the arc. Light the muscle segments themselves.
    - `peritoneo-atzeko-egiturak` (`peritoneo-barrunbea` 6; `Peritoneum.tsx:270–271`): blobs over the colons. Light the colons and the fused mesentery. Better still, show the fusion happening (ties to I).
  - **Topic 7, too small to see:**
    - `mesenterio-dortsala` in `zeloma` 5 is a pink stub of about 25 px between the aorta and the gut. Draw it as a two-layer sheet, continuous with the splanchnic layer round the gut (ties to I).
  - **Topic 8:**
    - `errai-kraneoa` 6–10: the three ossicles are dots inside a circle of about 15 px at the ear of the newborn skull.
    - In `errai-kraneoa` 9 the close-up fills the screen with a magnified, unreadable piece of skull, so the student cannot tell where it is.
    - Fix: a zoom bridge from the whole skull down to the middle ear. The ossicles sit in their place, big enough to see, and the skull outline stays as context.
  - **Topic 8 `kondrokraneoa`:**
    - Step 1 lights "Kondrokraneoa" on an empty dark oval: there is nothing to see yet.
    - Step 4 (pituitary) is very zoomed. The "adenohipofisia / neurohipofisia" text is small, and "Hipofisi kartilagoak" are dots.
  - **Topic 8, also flagged:**
    - `buru-ganga` 7: the posterior fontanelle is a small triangle. It is visible; the zoom could favour it. Low.
    - `buru-ganga` 2 (3D): the ossification centres are small on the skull model. Low.
  - **Topic 9, real:**
    - `somitomeroak-burua` 7: the step lights "1. faringe arkua" and "3. faringe arkua" on an *adult* head. There the arches are only faint tints over the muscles, and the colour key in the corner is dim. The student cannot see the arches the text names. Fix: light the arch-derived muscle groups clearly in each arch's colour, or show the 5-week embryo's arches beside the adult head, as `okzipitalak` does.
    - `nerbio-espinala` 7: the spinal cord section fills about a quarter of the frame. The ependymal canal is a dot and the lateral horn is tiny. Fix: frame the section about twice as big.
    - `okzipitalak` 4–5: "Nerbio kranialak" lights small numbered badges, and the nerves themselves are not drawn as nerves. Medium. Draw short nerve paths from each badge to its muscles, or accept the badges and make them larger.
    - `bihotz-muskulua` 3–7: the sinoatrial and AV nodes are 15–18 px ovals. They are lit and readable, but small. Low: enlarge them slightly.
  - **Topic 9, fine on inspection:**
    - `somitomeroak-burua` 4 (trochlea);
    - `muskulu-lisoa` 4 (membranes, small but lit and named);
    - `ildaskatuak` 3 and 5 (paraxial somites);
    - `somitaren-paretak` 4 and 6;
    - `ehun-konektiboa` 1 (fades in).
  - **Not real flags:**
    - The `domeinuak` table rows: they are wide rows, measured as short.
    - The 3D name chips.
- **Method for the rest:**
  - `focuscheck.mjs` (the scratchpad tool; to become a repeatable script under `scripts/`) loads every step in real Chrome and measures each lit structure's size and opacity. It also flags lighting by `Mark` alone.
  - Then every flagged step is checked by eye.
  - A test pins rule 1: `Mark` is not allowed on ids that also have a `Part` with a shape.
- **Cost:** medium. Topic 7 has 5 scene fixes plus the canal redraw. Topic 8 has 2 zoom bridges. Topic 9 needs checking. These are scene edits, not new scenes.

### Possible, lower value (only after A–J)

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
2. **H + I + J for topic 7 (coelom → septum → peritoneum, the notes' figures, and clear structures):** the canals redrawn as two passages, the openings, the diaphragm parts and the mesentery lit by their own shapes and big enough, no `Mark` on shaped structures. 2.1 opens on the notes' A → B → C figure, the mesentery is seen thinning, both names are shown, figure captions are linked, and a figure-parity test is added. Also: give the two cavities their own longer step with a key line, keep their names and colours in the section, keep the coelom's colour, grow the septum, and add a `look` bridge into the section. Check the sibling sections in `pleura-perikardioa` and `diafragma-eraketa`. This comes before the topic 7 class so the class can narrate the new transition.
3. **J for topics 8 and 9:** finish the automatic sweep, then fix every flagged structure. Start with the ossicles in `errai-kraneoa` and with `kondrokraneoa`. The owner wants J done across 7–9 in this iteration, before the classes.
4. **C + D for topic 7:** the class with plain wording, plus key lines where they are missing.
5. **E for topic 8:** the 11 in-stage bridges, starting with `errai-kraneoa`, plus the **F** recall links for topic 8 and the **I** caption links (`kondrokraneoa` and the others).
6. **C + D for topic 9**, plus the **F** timeline milestones.
7. **C + D for topic 8**, plus the **F** tours.
8. **E for topic 9** and the crossings that change body or scale, plus **G** (name chips).
9. Optional: the topic 9 front embryo and the 3D vertebra.

Each batch ends with:
- tests;
- real-WebGL shots at 1536 px and at 768–1024 px;
- a commit.

## 4. Batch 2 results (topic 7: H + I + J), 2026-10-19

**Done:**
- **Canals (J, owner's example).**
  - Only the two canal shapes carry `erreten-perikardioperitonealak`. The open cavity behind the septum no longer does, and the two `Mark` pools are gone.
  - The oesophageal mesenchyme now reaches the back wall (`MES`, shared with the 3D dome), so there are two separate passages, one either side of it.
  - Each canal has a crisp rim along the wall, the septum and the mesenchyme.
- **Other pools on shaped structures (J).**
  - The three diaphragm openings glow by their own rim.
  - The sternal and lumbar parts glow by their segments.
  - The retroperitoneal organs glow through the colons, which already belong to that group.
  - `tests/clear-structures.test.ts` now fails on any `Mark` whose id the same scene also draws as a `Part` (topics 7–9). Topics 1–6 still have 6 such cases; they are left for their own sweep.
- **Two cavities (H).**
  - `septum-transversum` grows from 30 s to 38 s.
  - Step 3 (the two cavities) now lasts about 10.6 s instead of about 2.7 s. The side view used to spend the first half of the step on the fixings; now it lights the upper cavity (pink, named), then the lower one (green, named).
  - The step has a FUNTSEZKOA line.
  - The side view and the map play in the stage's order: plate, cavities, fixings, canals (`SEPT_STEPS`).
- **Coelom → septum section (H).**
  - The section opens on stage 1's last picture: one round coelom in its purple, the gut and its mesenchyme.
  - The septum grows in from the front wall, then its fixings glow.
  - The open space beside the oesophagus stays coelom-purple until step 5, when it becomes the named canals.
  - The note names both cavities: "hasierako perikardio barrunbea (goian) ↔ peritoneo barrunbea (behean)".
  - In `diafragma-eraketa` the note now says "pleura barrunbea ↔ peritoneo barrunbea".
- **Mesentery (J + I).**
  - In `zeloma` 5 the dorsal mesentery is longer and wider: a two-layer sheet with its seam, continuous with the splanchnic layer round the gut. It is drawn by topic 4's drawing with new optional `mesLen` and `mesWaist`; topic 4 is unchanged.
  - Labels can now carry a second line (`sub`). "Mesenterio dortsala" shows "atzeko mesenterioa" under it in `zeloma` and in 2.1, and the FUNTSEZKOA line names both.
- **Notes figures (I).**
  - 2.1 opens on a new view, "Apunteetako irudia (A–C)": stage 1's fold plays during step 1 and ends on figure C. Step 2 goes into the abdominal section, where the wide link thins into the mesentery.
  - The caption "Atzeko mesenterioa ikusi daiteke" now links to that step 1.
  - The caption "Peritoneo barrunbea" (the last 2.1 figure) now links to the step that compares the cavity with the whole abdomen.
  - `tests/notes.test.ts` pins three things: every topic 7 caption is linked, 2.1 opens on the figure, and topics 8–9 keep their links (with 2 topic 8 captions still pending for batch 5).
  - The guide and the help card now say that a figure can be clicked too.

**Not done (kept for later):**
- A `look` bridge or a 3D turn from "slice" to "looking down": the growing septum and the notes' "goitik ikusita" do that job now. Revisit if the owner still finds the jump hard.
- The notes' clause "hasieran ez du guztiz inguratzen hestea".

## 5. Batch 3 results (J for topics 8 and 9), 2026-10-19

**Done:**
- **`errai-kraneoa` (topic 8), the ossicles.**
  - Steps 6–8: the camera moves in on the face and the ear (×1.45), so the three ossicles are about 1.5 times bigger. The bones the steps name stay in the frame.
  - Step 9: the close-up of the middle ear is ×3.3 instead of ×6.5. The jaw, the cheekbone, the temporal bone and the styloid stay around it, so the student can see where it is.
- **`kondrokraneoa` (topic 8).**
  - Step 1 no longer lights an empty oval: a faint preview shows where every piece of the floor will form (both sides).
  - Step 4 zooms in more on the pituitary (×2.9, was ×2.2), and the key is larger.
- **`somitomeroak-burua` 7 (topic 9).**
  - Each arch's muscles take its colour in turn: arch 1 (temporalis, masseter, pterygoids), then arch 2 (expression muscles, jaw depressors), then arch 3 (stylopharyngeus).
  - The muscles are grouped under their arch, so naming an arch lights its muscles.
- **`nerbio-espinala` 4–8 (topic 9).**
  - The camera moves in on the cord (×1.6) while the steps are about the cord itself, and back out when the roots and the nerve leave it.
  - The names that would sit on the enlarged cord move aside.
- **`okzipitalak` 4 (topic 9):** the nerve badges are larger, with full-size numerals. The X and XII nerves were already drawn as nerves.
- **`bihotz-muskulua` (topic 9):** the sinoatrial and AV nodes are about 30% larger.

**Not changed (judged fine in the sweep):** `buru-ganga` 2 and 7, `somitomeroak-burua` 4, `muskulu-lisoa` 4, `ildaskatuak` 3 and 5, `somitaren-paretak` 4 and 6, `ehun-konektiboa` 1, and the `domeinuak` table rows.

## 6. Batch 4 results (C + D for topic 7), 2026-10-19

- **Key lines (D).** 23 steps of topic 7 gained a FUNTSEZKOA line (`exam`), so 37 of 44 steps now have one (before: 14).
  - Every line is worded from the notes prose and rests on sentences that were already core, apart from three:
    - the coelom being continuous with the chorionic cavity at first (1/p4/s4);
    - where the septum is fixed (2/p4/s1);
    - "peritoneo barruko egiturak" (2.1/p7/s2).
  - The core is now 66 of 111 prose sentences (59.5 %), under the 60 % cap. The steps left without one are recaps, a repeated fold, or steps whose only sentences are not core (the lung's growth, the three muscle parts, the cavities above and below the diaphragm).
- **Class (C).** `content/klasea/w7.ts`, "Gorputzaren barrunbeak eta diafragma" (13 chunks, ~19 min, 26 checks). Topic 7's guided mode is now this class.
  - It covers all 66 core sentences, from the folding disc to the adult diaphragm. It runs in the stages' own order and uses the views of batch 2 (the notes' A → C figure, the growing septum, the two-layer mesentery).
  - Every line has a "plain" wording. Every name it says is lit and already drawn.
  - There is a contrast check in every chunk from "Bi orri eta zeloma" on. The last chunk fills the diaphragm table from memory (component → what it gives in the adult).
  - `tests/klasea.test.ts` runs the same guards for topic 7 as for 10 and 11. The x-words "toraxa", "toraxetik", "paraxiala" and the others are classified. `paraxial…` is now read /ks/ (`KS_STEMS`).
  - The source audit is in `docs/klasea/w7-audit.md`.
- **Checked:** headless Chrome at 1280 px and 1024 px, playing the class from the septum, its fixings, the mesentery, the organs, the membranes, the components and the adult diaphragm chunks. The lit parts match each line, the board fills in, and there are no console errors.

## 7. Batch 5 results (E + F for topic 8, the two pending captions), 2026-10-19

- **Camera moves instead of cuts (E).** All 11 in-stage changes between two body pictures in topic 8 now move the camera. `tests/view-changes.test.ts` pins this for topic 8: every guided change must be a travel, a dive or a turn.
  - `jatorriak`: the map → the transverse cut dives into the somites of the trunk and opens the cut ("BARRURA BEGIRATZEN · MOZKETA"). Going back, the cut shrinks into its place.
  - `buru-ganga`:
    - the 3D dome turns to its right side and the side drawing lands on it, front to the right as in the drawing;
    - turned to its top, front up, the top drawing lands on it in the same way;
    - top ↔ side (no model of their own) go through the dome: the drawing hands over to the dome seen from the same side, the dome turns once from one side to the other, and the other drawing lands on it (`hubPlan`).
  - `errai-kraneoa`: the 5-week head grows into the newborn skull in place ("BURUA HAZTEN · 5. ASTETIK JAIOTZARA").
  - `gorputz-adarrak`: the limb drawing hands over to the 3D embryo seen from the front (its left side), then the camera pulls back and turns to the usual view.
  - `ornoa`: the vertebra from above shrinks into its level of the column seen from behind (a cut, so "KANPOTIK IKUSTEN · OSORIK").
  - `bizkarrezurra`:
    - transverse → coronal now travels inside the young embryo: the transverse plane turns into the coronal one through the back;
    - coronal → curvatures pulls back from the column to the whole fetus.
- **What changed in the shared code.**
  - `ViewDef.body`: the day of the body a cut is taken from, when the drawing is younger than the stage's running day. The plane map, "Non nago?" and the travel use it, and the clock keeps running. The transverse column cut is now pinned to day 28 (`age`), as its drawing and the notes say ("4. astean"). Before, its clock read the 9th week.
  - Bridges can carry their own caption header, for moves that are not a closer look (the same thing from the same side, the same head grown).
  - "Goitik" and "Behetik" on any 3D model now put the front at the top of the picture, as the notes draw a skull from above. Before, the camera kept its own side, so the front could end up at the bottom-left. Topics 9–11 get this too.
- **Fixed in passing (all plane travels, topics 7–11).** During a travel between planes, the old view's names were meant to fade in 0.4 s. Instead they stayed at full strength, without their leaders, for the whole move: they were drawn in the viewport's top text layer, outside the fading group. They now fade as designed.
- **Recall links (F).** Every topic 8 stage opens with GOGORATU chips for what it builds on; a tap replays where that structure formed:
  - origins: paraxial mesoderm, the parietal layer, the neural crest;
  - ossification, long bones: the ossification centres;
  - calvaria: the neural crest, the somitomeres;
  - chondrocranium: the notochord, the somites;
  - face: the pharyngeal arches, the neural crest;
  - limbs: the upper and lower limb buds;
  - vertebra: the sclerotome, the notochord; column: the somites, the sclerotome, the notochord; ribs: the sclerotome.
- **The two pending captions.** The notes figures of the skull from above (`w8/3.1.1/p12`) and the chondrocranium from above (`w8/3.1.2/p5`) are now linked to their steps. `tests/notes.test.ts` no longer keeps a pending list: every caption of topics 8 and 9 must stay linked.
- **Checked:** headless Chrome at 1280 px, frame by frame through every new move, including the two-leg move through the dome. In headless, the first entry into a 3D model waits up to ~3 s for WebGL to start, as every move into 3D does. The full test suite passes.
