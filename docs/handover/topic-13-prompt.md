# Prompt: build topic 13 (zain-sistema, zirkulazio-sistema IV) in the simulator

You are adding **topic 13, "13. GAIA: ZAIN-SISTEMA"** (the venous system, fetal/postnatal circulation and the lymphatic system) to the embryology simulator in `C:\Users\aitor\Downloads\1 MEDICINA` (Next.js app, Basque UI, owner: a medical student who studies from the notes and then checks the app side by side).

The owner's words: *"Add 3D where it enhances the experience. Use everything we've learned till today. This topic must be the best implemented of all, improving all errors we've encountered in previous topics, enhancing the best things from previous topics while eliminating their defects. It must be really understandable; animations should tell the whole story. It must be really useful for students; every line in the notes must be visualized perfectly. Also add the Kimu class."*

Treat that as the acceptance bar. Work in the main session; **do not spawn subagents** unless the owner asks in your session (`memory/no-agents.md`). Don't commit or push until the owner asks.

---

## 0. Read first (in this order)

1. **Every memory file** in `C:\Users\aitor\.claude\projects\C--Users-aitor-Downloads-1-MEDICINA\memory\` (start at `MEMORY.md`). They are the owner's standing rules. The ones that shape this topic most:
   - `each-topic-step-forward`, `teacher-showcase`, `visibility-guard`, `narrated-actions-shown`, `notes-figure-parity`, `notes-prose-wins`, `keep-all-labels`, `no-drawn-pointers`, `anchor-inside`, `anchor-occlusion-audit`, `consistent-style`, `keep-some-realism`, `prefer-3d`, `never-get-lost`, `3d-arrows-follow-camera`, `narration-zoom-reveal`, `label-zones-design-first`, `topic10-working-lessons` (the living checklist; run it while building, not after), `reference-abyssal-3d-lessons` (Stream3 blood cells, mesh cache, perf), `verify-animations-headless`, `target-pc-tablet`, `no-past-exams`, `klasea-lecture-mode`, `klasea-short-core`, `kimu-retrieval-lessons`, `design-beauty-and-usability`, `visible-returns`.
2. `AGENTS.md`: this is a newer Next.js than your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing framework code.
3. `docs/handover/topic-12.md`: the template you are following (the last topic built, 14 stages, all in 3D, one posed model, colour = origin).
4. The notes PDF: `C:\Users\aitor\Downloads\13. GAIA_ZAIN SISTEMA (zirkulazio-sistema IV) (Zuzenduta).pdf` (11 pages). The extracted text is already in `content/notes-text/w13.ts` (see §1). Render the pages to PNG with PyMuPDF to see the figures (`pdftoppm` is not installed; `fitz` is): every figure needs a matching picture (§4).
5. Code to study before building:
   - `content/weeks/week12.ts`, `content/weeks/week12-structures.ts`: stage, beat, view and structure format (`lib/sim/types.ts`).
   - `components/scenes/week12/` (`common.tsx` `ArtView`/`ColourKey`, `Arches3D.tsx`, `arteries3d.ts`, `embryo-model.ts`, `trunk-model.ts`, `Adult3D.tsx`).
   - `components/scenes/week10/Heart3D.tsx`: `ModelView`, `orbit`, `cameraAt`, `Trail`, `DirArrows`, `CalloutSpec`. Every topic 10–12 3D view goes through `ModelView` (axes with live edge pills, continuity glides, occlusion-aware anchors).
   - `components/scenes/week10/model3d.ts`: `tubeParts`, `blobParts`, `mixHex`, `vesselRouteOf`, `routeLength`, and the topic 10 veins (vitelline, umbilical, cardinal, the anastomoses, the left-to-right reroute with blood cells).
   - `components/scenes/week10/common.tsx` `T` (blood colours `o2`/`deo2`), `lib/three-d/scene.ts` (`Item3`, `Stream3`), `lib/three-d/mesh.ts` (`curve3`), `lib/three-d/embryo5.ts` (the shared week-5 embryo body).
   - Topic 11's `components/scenes/week11/atria3d.ts` and the `jaiotza` stage (`Birth.tsx`, `Birth3D`): the foramen ovale closing at birth, already modelled.
   - `content/klasea/w12.ts`, `content/klasea/importance/w12.ts`, `lib/klasea/importance.ts` (rules R1–R7), `lib/klasea/types.ts`, and `tests/klasea.test.ts` (it is the class spec).

---

## 1. Already done (keep it)

- `scripts/notes/extract.py` now lists the topic 13 PDF and handles its quirk: it is a Google Docs export that wraps every word in zero-width spaces (U+200B), and justified lines keep only two of them (no real space) between words. For week 13 only, a double ZWSP becomes the word gap, a single one is dropped, including across a span boundary. Indented wrap lines beside figures are no longer taken as captions for week 13 (same as 11–12).
- `python scripts/notes/extract.py` regenerated everything: weeks 1–12 are byte-identical; **`content/notes-text/w13.ts`** is new (105 blocks, 242 sentences, 24,707 characters, PDF differences = 0), and `content/notes-text/manifest.json` has the week 13 entry.
- Still to wire for the notes: `content/notes-text/index.ts` (import `w13`, add `13: w13` to `documents`), `content/notes.ts` (`NOTES[13]`, the table of contents below), and `tests/notes.test.ts` (append length `24707` and the sha256 from the manifest, and update the beat counts at the end).
- Run `python scripts/notes/extract.py --check` once more after you finish; it must pass.
- These three files (`scripts/notes/extract.py`, `content/notes-text/manifest.json`, `content/notes-text/w13.ts`) are topic 13's: commit them with the topic. The anchor-audit agent's doc lists them as "owned by another session" and will leave them alone.

Sentence ids look like `w13/2.1.1/p3/s4`. Dump them all with a small node script over `content/notes-text/w13.ts` before you map beats.

---

## 2. Another session works in this same checkout

The 3D anchor audit for topics 7–12 has been handed to another agent: read **`docs/handover/anchors-audit-7-11.md`** (its step 5 lists the files it owns and will commit, step 6 lists what other sessions own). It owns `tests/anchors3d.test.ts`, `lib/three-d/occlusion.ts`, `components/scenes/week11/Septa3D.tsx`, the `at: q` hunk of `Heart3D.tsx`, and any topic 7–11 scene files it changes for its fixes. A third, unknown session left uncommitted edits in `components/kit/three/Stage3D.tsx`, `components/shell/{Viewport,Player,Simulator,StudyMap,Home,progress}.ts(x)`, `components/klasea/{ClassDock,useKlasea}.ts(x)`, `lib/klasea/engine.ts`, `app/globals.css` and several new tests.

- **Don't edit, stash, revert or commit any of those files.** If you truly need a shared kit change, find the live session that owns it (ListAgents) and message it first, saying exactly what; the original topic 12 session may not answer, so don't rely on it.
- When you commit, stage only your own files and hunks (`git add <paths>`, or a crafted `git apply --cached` patch for a shared file), never `git add -A`.
- Your files are new ones (`components/scenes/week13/*`, `content/weeks/week13*.ts`, `content/klasea/w13.ts`, `content/klasea/importance/w13.ts`, `docs/handover/topic-13.md`, `docs/klasea/w13-audit.md`) plus small additive edits to the registration files in §7.
- That audit doc confirms that once week 13 is in the registry, `tests/anchors3d.test.ts` audits its 3D steps too (each shown name's dot must not hide behind another solid and must stay in frame). If it fails, turn the camera rather than moving the anchor; `ModelView` already moves a covered dot onto the visible part of its own structure.

---

## 3. What the notes say (and the traps in them)

The PDF header says "7. ASTEA"; that is furniture, not the topic's week. Sections:

1. **Sarrera.** In week 5, three paired veins reach the sinus venosus: vitelline (omphalomesenteric, from the yolk sac, low O₂), umbilical (from the placenta, oxygenated), common cardinals (anterior + posterior cardinals joined). Each side's veins reach that side's sinus horn, and the blood mixes in the sinus.
2. **Zain nagusien garapena.** Anastomoses between the veins send the left veins' blood to the right; the left sinus horn loses importance.
   - **2.1.1** Vitelline veins: they branch round the duodenum (an anastomotic plexus). The liver bud grows from the foregut into the septum transversum mesoderm. The vitelline veins enter it and form a second plexus: the hepatic sinusoids. The blood leaves through the right and left hepatocardiac channels (the last parts of the vitelline veins) to the horns. Then the left distal part, the left proximal part (= the left hepatocardiac channel) and the right distal part disappear. The remaining right periduodenal part becomes the **portal vein** (blood from the abdominal viscera, mainly the coeliac ones).
   - **2.1.2** The portal vein comes from the periduodenal plexus and the right vitelline. The superior mesenteric vein (on the portal's right) also comes from the right vitelline. The splenic vein (on its left) comes from an anastomosis between the two vitellines. They join, the portal enters the liver and branches, and the blood leaves through the right hepatocardiac channel to the right horn.
   - **2.1.3** The left hepatocardiac channel disappears (route: portal → liver plexus → right hepatocardiac → right horn). The right hepatocardiac becomes the **hepatic segment of the IVC**.
   - **2.2** Umbilical veins: they pass on both sides of the liver to the horns and touch the liver's plexus. Their proximal parts (towards the heart) disappear. The **right umbilical vein disappears entirely**. The left one's small proximal part disappears too, and its distal part forms a direct connection with the right hepatocardiac channel: the **ductus venosus**, which carries oxygenated blood past the liver's plexus. Two notes asterisks:
     - "Egela's document says artery: not an artery, it is the left umbilical **vein**."
     - "**KONTUZ: the ductus venosus lies on the liver's SURFACE, not inside it as the figures suggest.**" Draw it on the surface and say so; this is exactly the kind of accuracy the teachers will check.
   - **2.3** Cardinal veins: anterior (cranial walls) and posterior (caudal walls) join into the common cardinals, which open into the horns; at first a symmetric system. Between weeks 5 and 7, three new bilateral systems appear:
     - **subcardinal** (kidneys; abdomen);
     - **sacrocardinal** (lower limbs);
     - **supracardinal** (body wall via the intercostal veins; "**horiz argazkian**": yellow in the figure). They are continuous above with the proximal part of the posterior cardinals, take over the posterior cardinals' job as most of those disappear, and are linked by an anastomosis.

     Then:
     - right supracardinal + the proximal part of the right posterior cardinal → **azygos** (right intercostals; the lumbar vein joins it; the first 3 intercostal spaces form another trunk into it);
     - left supracardinal → **hemiazygos** (intercostal spaces 9–11) and, above it, **accessory hemiazygos** (spaces 4–8), each crossing to the azygos by an anastomosis.
     - **Trap:** one sentence says the azygos "ends in the *inferior* vena cava" (`w13/2.3/p8/s2`), but the next two sentences and the JAKIN BEHARREKOA box say its blood reaches the *superior* vena cava. Draw it ending in the SVC and say plainly in that beat that one sentence of the notes says "beheko" while the rest of the notes say "goiko". Don't silently pick one.
3. **Kaba zainak.** From those systems come the SVC and IVC, both opening into the right atrium's smooth posterior wall (SVC from above, IVC from below). Left-to-right shunting by anastomoses is the key process.
   - **3.1 IVC.** Its segments:
     - hepatic segment, from the right hepatocardiac channel; the portal blood crosses the liver to reach it;
     - the subcardinal anastomosis forms the **left renal vein**; the **left gonadal vein** comes from the left subcardinal's distal part, *below* the left renal vein, and drains to the right subcardinal; the left subcardinal's proximal part disappears;
     - the right subcardinal forms the **renal segment**, which fuses above with the hepatic segment;
     - the sacrocardinal anastomosis: the left distal part → left common iliac vein, the right distal part → right common iliac, the right proximal part → **sacrocardinal segment**;
     - all fuse into the definitive IVC (summary: three main parts). The IVC also receives renal blood and the lower lumbar veins.

     Then the left horn does not vanish: it gives the **coronary sinus** and the **oblique vein of the left atrium**. Recall topic 10: the IVC valve and the coronary sinus valve in the right atrium.
   - **3.2 SVC.** It comes from the right common cardinal + the proximal right anterior cardinal.
     - The anastomosis between the anterior cardinals → **left brachiocephalic vein** (left to right), joining the right brachiocephalic. Both open into the SVC.
     - Left internal jugular (distal left anterior cardinal) + left subclavian → left brachiocephalic.
     - Right internal jugular (distal right anterior cardinal) + right subclavian → right brachiocephalic.
     - External jugulars come from a facial network and end in the subclavians.
     - The SVC has two parts: initial (right anterior cardinal) and final (right common cardinal).
     - Then the **JAKIN BEHARREKOA** box: SVC ← both brachiocephalics + azygos; IVC ← all lower-body venous blood (iliacs, portal, abdominal viscera); definitive IVC = sacrocardinal + hepatic + renal parts.
4. **Circulation.**
   - **4.1.1 before birth, left route.** Placental blood (80 % saturated) comes up the left umbilical vein. Most of it takes the ductus venosus on the liver surface → the hepatocardiac channel (later the hepatic IVC) → IVC. It mixes with IVC venous blood (from the kidneys…) and with portal/liver blood, so its O₂ falls. It reaches the RA, and most of it (not all) crosses the foramen ovale → LA → left AV orifice → LV → aorta (ascending, arch, descending).
   - **4.1.2 before birth, right route.** A small amount stays in the RA (the lower part of septum secundum blocks it) and mixes with SVC blood → RV → pulmonary trunk. High pulmonary resistance before birth, so little goes to the lungs; most crosses the **ductus arteriosus** into the aorta below the first branches, so well-oxygenated blood goes to the head first. Descending aorta and umbilical artery blood ≈ **58 %**. The umbilical arteries first leave the aorta directly, later the internal iliac branches of the common iliacs (5th lumbar segmental arteries).
   - **4.2 at birth.** Pulmonary circulation starts. At 2–3 minutes the smooth muscle of the umbilical arteries contracts and closes them: distal parts → **medial umbilical ligaments** (fibrosis, over the following months); proximal parts stay open → **superior vesical arteries** (parts of the internal iliacs). Then the left umbilical vein → **ligamentum teres hepatis** (liver to navel) and the ductus venosus → **ligamentum venosum** (on the liver surface), within minutes. The ductus arteriosus → **ligamentum arteriosum** (2–3 months). The foramen ovale: LA pressure rises and pushes the valve (septum primum) against septum secundum; slow fusion over about a year; 20 % stay probe-patent.
   - **4.3 after birth.** Venous blood: SVC/IVC → RA → right AV orifice → RV → pulmonary arteries → lungs → **4 pulmonary veins** → LA → left AV orifice → LV → aorta. The aortic valve has 3 cusps with the **sinuses of Valsalva**, from which the coronaries leave; from the arch the brachiocephalic trunk and the left common carotid. High saturation in the coronaries (myocardium) and to the brain; the descending aorta carries less. Newborns are often cyanotic because the interatrial septum is not yet fully closed (small shunt).
5. **Linfa sistema.**
   - Lymph sacs and vessels develop from the splanchnic (visceral) layer of the lateral mesoderm.
   - Head, neck, trunk and upper-limb lymphatics drain to **2 jugular lymph sacs**.
   - In the abdomen there are 4 more sacs: the **retroperitoneal**, the **cisterna chyli** (Pecquet; the most important) and **2 posterior** sacs (where the internal and external iliac veins join).
   - All drain to the cisterna chyli, from which **two thoracic ducts** run up; only one remains. It crosses the diaphragm, rises through the mediastinum, turns left and opens into the **left jugulo-subclavian junction** (where the left internal jugular and left subclavian meet).

Notes figures to match (figure parity; each at the step where the notes print it, with the notes' names):
- p1: the week-5 embryo's circulation (lateral, transparent, the same figure as topic 12 stage 1);
- p2: liver bud A/B, with sinusoids and the left hepatocardiac channel;
- p3: A/B, with the hepatocardiac channels, the ductus venosus, the portal/SMV/splenic and the "Beheko kaba benaren zati hepatikoa";
- p4: the placenta–fetus circulation (two arteries and one vein in the cord);
- p6: the cardinal systems A (embryo) and B (adult), Langman, ventral view, supracardinals yellow;
- p9: the fetal circulation (Langman);
- p10: the circulation after birth, with the ligaments;
- p11: the lymph sacs.

---

## 4. Design: what "best topic yet" means here

Build on topic 12's winning pattern and fix what the memories list as past defects.

**One posed 3D model for the venous system** (`components/scenes/week13/veins3d.ts`, like `arteries3d.ts`). Every vessel is a polyline of key points with an embryonic and an adult pose and the same point count, so junctions stay junctions while it morphs.
- Axes as in topics 10–12: x = the embryo's **left**, y = cranial, z = ventral. State this in the file header. Seen from the front, the embryo's left is on the viewer's right.
- The notes' figures (p2, p3, p6) are **ventral views**: default camera from the front.
- Check every sided structure and the camera pad on a front-view screenshot before moving on (lesson 1: left/right were inverted twice in topic 10).

**Colour = origin, carried from embryo to adult.** Make a `VC` palette and a `ColourKey` like topic 12's:
- sinus horns: topic 10's violet (`zain-sinua` `#9b7bf0`, horns `#a78bfa`/`#8a6ae6`);
- vitelline: one colour for all its products (the portal, the SMV, the hepatic IVC segment);
- umbilical: one colour (the ductus venosus and ligamentum teres keep it until they turn to ligament putty `#c9c1b2`, the colour topic 12 uses for ligaments);
- anterior cardinal, posterior cardinal, common cardinal;
- subcardinal, sacrocardinal;
- supracardinal **yellow**, as the notes say.

So the adult IVC reads as three coloured segments, the SVC as two, and the azygos as yellow plus posterior-cardinal colour. Blood colour (O₂) is used only in the flow streams and in the circulation stages. Reuse the existing structure ids and colours where they exist (`bitelo-zainak`, `zilbor-zainak`, `aurreko-zain-kardinalak`, `atzeko-zain-kardinalak`, `bena-kardinal-komuna`, `zain-sinua`, `eskuineko-sinu-luzapena`, `ezkerreko-sinu-luzapena`, `eskuineko-zilbor-zaina`, `ezkerreko-zain-bitelinoa`, `sinu-koronarioa`, `ezkerreko-aurikularen-zain-laprana`, `goiko-kaba-zaina`, `beheko-kaba-zaina`, `gibela`, `septum-transversum`, `zulo-obala`, `zulo-obalaren-balbula`, `septum-primum`, `septum-secundum`, `hodi-arteriosoa`, `lotailu-arteriosoa`, `erdialdeko-zilbor-lotailua`, `goiko-gernu-maskuri-arteria`, `zilbor-arteriak`, `birika-zainak`, `birika-arteria`, `aorta`, `goranzko-aorta`, `aortaren-makoa`, `beheranzko-aorta`, `arteria-koronarioak`, `enbor-brakiozefalikoa`, `karotida-komuna`, `giltzurruna`, `gonadak`, `diafragma`, `birikak`, `eskuineko-aurikula`, `aurreko-hestea`, `karena`, `zilborrestea`, `bitelo-zaku-sekundarioa`…). A week owns only the structures it introduces (`content/registry.ts` deduplicates).

**Context organs, semi-realistic, never abstract stand-ins** (`keep-some-realism`):
- the liver as a translucent organ in the septum transversum;
- the duodenum and gut;
- the kidneys (mesonephros/metanephros level) for the subcardinals;
- the rib/intercostal levels for the azygos system (number spaces 3, 4–8, 9–11 so the hemiazygos ranges are seen);
- the limb buds, the heart from behind (topic 10's sinus picture) and later a 4-chamber heart;
- reuse `embryo5` for any whole-embryo body (`one-lateral-embryo`).

**A circulation model for stages 4.1–4.3** (fetal → birth → postnatal), in the same frame as the venous model's adult pose, so the IVC, SVC, portal, umbilical vein/ductus venosus and liver are literally the same pieces. Add:
- the 4-chamber heart, opened, with septum primum/secundum and the foramen ovale; reuse or align with topic 11's atria model and `Birth3D` so the student recognises it;
- the pulmonary trunk and arteries, the ductus arteriosus, the aorta (reuse topic 12's adult arch shapes/colours where you can);
- the lungs, umbilical arteries, bladder, cord and placenta.

**Blood as `Stream3` cells** (GPU, scrubbable; never per-frame meshes). Colour them by saturation along the route: 80 % at the umbilical vein, mixing in the IVC and the RA, the 58 % read-out at the umbilical arteries. Show the % as small notes where the notes give them. Show both routes (left 4.1.1, right 4.1.2) one after the other, then together. At birth, close each shunt visibly (umbilical arteries contract, vein and ductus venosus close and turn to ligament colour, ductus arteriosus too, the foramen valve presses and fuses), and re-route the cells, crossfading with grow gates and no jumps (topic 10 Batch 4 technique).

**Lymphatics** (stage 5): the same trunk with the veins ghosted. The sacs appear as budding blobs from the splanchnic mesoderm, the two thoracic ducts rise, one regresses, and the survivor crosses the diaphragm and hooks left into the left jugulo-subclavian junction (a junction that already exists in your venous model: same place, same colours).

**Every verb happens on screen** (`narrated-actions-shown`). This topic is all verbs:
- adarkatu (branch), anastomosi sortu (link), sartu (enter the liver);
- desagertu: each regressing segment fades or thins out *while* its beat says so, never pre-gone;
- fusionatu: the IVC segments visibly join;
- pasatu ezkerretik eskuinera: cells cross the anastomosis;
- itxi / lotailu bihurtu: close and become a ligament;
- bultzatu (push the valve) and igo (rise).

If an action is small on screen, zoom in (narration-zoom-reveal) or add a synced close-up.

**Never get lost.** Every view change and stage change is a camera move (`ModelView` continuity, `cameraAt` glides, a turn over ~120° announced in the text). Use named-side edge pills (`axes.edges`) and the "Aurretik begiratzen dugu" notes that fade when the student turns away. One continuity key for the whole topic (e.g. `zainak-13`), so stage → stage glides.

**Visibility contract** (`tests/visibility.test.tsx`):
- whatever a step's text names is drawn and named during the whole beat (tour frame and beat end − 0.035);
- lit means only that thing;
- one id = one thing; give composite names `parts`/`spans`;
- spaces (the foramen ovale, the jugulo-subclavian junction) need a drawn body.

Progressive names via `<Label>`/callouts (never cut names). No rings, dashed boxes or decorative arrows; glow the thing itself. Text is always above lines. Short, near-horizontal leaders in edge columns (`label-zones-design-first`).

**Learning layers on every beat:** `idea`, `key`, `exam` (FUNTSEZKOA, worded from the notes), `recall` (topics 10–12 links: sinus horns, the left-to-right shunt, the umbilical arteries and ductus arteriosus from topic 12, the foramen ovale and birth from topic 11), `caution` for every KONTUZ and every trap above, an `ask` micro-question on a mechanism/why angle (never like a past exam: `no-past-exams`; check against `content/generate.ts` `LEFT_OUT`), a `tour` + `tourAt` (absolute stage time inside its own beat) when a stage introduces several parts, and a `more` where useful. **100 % notes-sentence coverage**: every prose sentence of `w13.ts` cited by some beat, within its stage's notes section (`tests/notes.test.ts`).

**Live summary tables** (the JAKIN BEHARREKOA box, and "adult vein ← embryonic origin") built row by row in a scene, as topics 9–10 did (`SummaryTable`), with the colour chips of the origin key.

### Suggested stage plan (follow the notes' order; improve it if you can justify why)

| # | stage id | notes | what the student sees |
|---|---|---|---|
| 1 | `sarrera` | 1 | 5-week glass embryo (reuse topic 12 `embryo-model`, figure p1): the three vein pairs to the horns, cells red/blue mixing in the sinus |
| 2 | `zain-nagusiak` | 2 | the venous model introduced: horns, three pairs by colour (tour), anastomoses, left blood crossing right, the left horn shrinking |
| 3 | `bitelinoak` | 2.1.1 | periduodenal plexus, the liver bud growing into the septum transversum, the veins entering it and forming sinusoids, the hepatocardiac channels; then the left distal, left proximal and right distal parts regress → portal (figures p2 A/B) |
| 4 | `porta` | 2.1.2–2.1.3 | SMV from the right vitelline, splenic from the anastomosis, portal into the liver, out by the right hepatocardiac channel; the left hepatocardiac goes; the right one becomes the hepatic IVC segment (figure p3 A/B) |
| 5 | `zilbor-zainak` | 2.2 | the umbilical veins beside the liver, proximal parts go, the right one goes entirely, the left one's ductus venosus on the liver surface (KONTUZ + the Egela note), oxygenated blood bypassing the plexus; the cord/placenta figure (p4) |
| 6 | `kardinalak` | 2.3 p3–p7 | anterior, posterior and common cardinals, symmetric; weeks 5–7 the three new systems grow in one by one (sub, sacro, supra in yellow), the supracardinals take over as the posterior cardinals regress, the supracardinal anastomosis |
| 7 | `azigos` | 2.3 p8–p11 | azygos (right supra + proximal right posterior), intercostals, lumbar, the trunk of spaces 1–3; hemiazygos (9–11) and accessory (4–8) crossing to the azygos; the "beheko/goiko" trap |
| 8 | `kaba-zainak` | 3 p3–p7 | the two cavae into the RA's smooth back wall (heart from behind, topic 10 look), the left → right rule recalled |
| 9 | `beheko-kaba` | 3.1 p3–p9 s1–s11 | segment by segment with colour = origin: hepatic, renal (subcardinal anastomosis, left renal and left gonadal below it), sacrocardinal (iliacs), fusion into the definitive IVC; figure p6 A → B morph |
| 10 | `sinu-koronarioa` | 3.1 p9 s12–s16 | the left horn → coronary sinus + oblique vein of the LA, the IVC and coronary sinus valves in the RA (recall topic 10) |
| 11 | `goiko-kaba` | 3.2 p3–p13 | the anterior cardinal anastomosis → left brachiocephalic, jugulars, subclavians, external jugulars, the SVC's two parts |
| 12 | `laburpena` | 3.2 p14–p18 | JAKIN BEHARREKOA as a live table + the adult venous system in origin colours, then rewound to the embryo and forward again (topic 12 `Adult3D` trick) |
| 13 | `jaio-aurretik` | 4.1.1–4.1.2 | the fetal circulation (figure p9), left route then right route, saturation read-outs, the ductus arteriosus, the umbilical arteries' change of origin |
| 14 | `jaiotza` | 4.2 | the closures in notes order with timing chips (2–3 min, minutes, 2–3 months, ~1 year, 20 %), each structure turning to its ligament (figure p10) |
| 15 | `jaio-ondoren` | 4.3 | the postnatal loop, 4 pulmonary veins, Valsalva sinuses → coronaries, arch branches, falling saturation, the cyanotic newborn |
| 16 | `linfa` | 5 | sacs, cisterna chyli, two thoracic ducts → one, its path to the left jugulo-subclavian junction (figure p11) |

`NOTES[13]` must list each section with its stages (a sub-heading wins over its parent), and a stage's cited sentences must sit in its own section or have an explicit `NOTES_EXCEPTIONS` entry.

---

## 5. The Kimu class (Klasea)

Write `content/klasea/w13.ts` (`LESSON_W13`) and generate `content/klasea/importance/w13.ts` with the importance script in `scripts/klasea/` (see how w12 was generated: "Generated by scripts/klasea/importance.ts"). Use `scripts/klasea/core-map.ts 13` to print the core per step.

Rules the test enforces (`tests/klasea.test.ts`, add a `TOPICS` entry for week 13 with `pinned`, `contrastFrom`, `shown`, `same`):
- every core (funtsezkoa) sentence is said by a line;
- the core is ≤ 60 % of the prose, and every stage has some;
- lines cite sentences their frames have shown (G1);
- no number or direction the cited sentences don't say (G3);
- every name said is lit, and only what the fact is about (G2, G4);
- ≤ 22 words per line, no symbols, never exam wording;
- chunks 60–240 s, the class 12–20 min, the student acts at least every 120 s;
- contrast checks from your chosen chunk on, one per chunk;
- every x-word classified in `X_WORDS` (add new ones, e.g. `azigos` has no x, but `toraxeko`/`oxigeno…` exist; check `plexua`/`plexutik`/`konexio…`);
- no Basque-only letters left for the Spanish voice.

Style rules from the memories:
- short (core + likely exam facts, no fine detail);
- open with the big picture;
- every line gets a `plain` wording ("Ez dut ulertu");
- keep every KONTUZ;
- a board table built through the class (e.g. adult vein ↔ embryonic origin, the topic's natural table), a `fill` check at the end;
- no mnemonics or invented analogies.

Adding FUNTSEZKOA (`exam`) lines raises the core through R1, so word new key lines from sentences that are already core, or the 60 % cap breaks.

Register the lesson in `content/klasea/index.ts` and `scripts/klasea/audit.ts`. Write `docs/klasea/w13-audit.md` like w12's.

---

## 6. Everything else a finished topic has

- `content/weeks/week13.ts` (`week: 13`, slug `'13'`, title like "Zirkulazio-sistema (IV)", subtitle, `dayRange`, `span`), `content/weeks/week13-structures.ts` (Basque names exactly as in the notes, `es`, `aka`, definition/location/origin/fate, `parts`/`spans` for composites, `space` for spaces).
- 15–20 quiz questions (mechanism/why/relations; not stock "which is X" exam questions), and the pool questions the class checks use.
- Guides ("Irudia ulertu") for **every** view: `guides13` in `content/heart-guides.ts`, wired with `withGuides`, plus `[13, guides13]` in `tests/heart-guides.test.ts` (each part ≤ 240 chars, question ends with "?").
- Chronology milestones in `content/chronology.ts` (`// 13. gaia`: 5th week three pairs, weeks 5–7 new cardinal systems, birth closures with their times).
- Structure-atlas relations in `content/structure-atlas.ts` (`// 13. gaia`: vitelline → portal/SMV/splenic/hepatic IVC, left umbilical → ductus venosus → ligamentum venosum, left umbilical → ligamentum teres, supracardinal → azygos/hemiazygos, subcardinal → renal segment/left renal vein, sacrocardinal → iliacs/sacrocardinal segment, anterior cardinal → jugulars/left brachiocephalic/SVC, left horn → coronary sinus, ductus arteriosus → ligamentum arteriosum, umbilical arteries → medial umbilical ligaments + superior vesical arteries…).
- Kimu: the all-structures sweep in `tests/kimu.test.ts` must stay green; atlas-only structures must be indexed (`kimu-retrieval-lessons`).
- Tours on the openers.

---

## 7. Registration edits (small, additive)

- `lib/sim/types.ts`: add `| 13` to `WeekDef.week`.
- `content/registry.ts`: import and append `week13`.
- `content/notes-text/index.ts`: `w13` in `documents`.
- `content/notes.ts`: `NOTES[13]`.
- `tests/notes.test.ts`: the length/sha pins and the beat counts.
- `tests/visibility.test.tsx`: add exemptions only with a real reason (format `'13/stage/beat/id': 'why'`).
- `lib/narration/server-utils.ts`: `MAX_WEEK = 13`, and move the reject pin in `lib/narration/server.test.ts` to 14 (topic 12 broke 3 narration tests by forgetting this sibling).
- `components/shell/Specimen.tsx` (line 44: `week === 11 || week === 12` → include 13).
- `components/shell/TopicShot.tsx` (a `13:` hero shot: the fetal circulation or the adult venous system in origin colours).
- Grep for other `12`-limited lists (`MAX_WEEK`, `week === 12`, `[10, 11, 12]`, `<= 12`) and extend each sibling.

---

## 8. How to verify (before calling it done)

1. `npx vitest run`: the whole suite green (notes, visibility, labels, named, tour, klasea, heart-guides, kimu, structure-atlas, chronology, anchors3d, narrated-actions, view-changes, narration). `npx tsc --noEmit -p .` and eslint on your files clean. Never run prettier on this repo.
2. The dev server via `preview_start` (`.claude/launch.json`; ports 3005/3007 were used before). The built-in browser pane has **no requestAnimationFrame**, so verify glides and camera moves with headless Chrome over CDP (`verify-animations-headless`): absolute `--user-data-dir`, port 9333; kill only that Chrome afterwards; `git checkout -- next-env.d.ts` if next dev rewrote it.
3. Shots at 1440×900, 1024×768 and 768×1024 for every stage: the step ends (une ≈ 0.99) and one early-time shot per 3D view. Check name plates against the fixed chrome (keys, bira, Kimu, drag hint, axes plate) by measurement (the `det.js` approach in `topic10-working-lessons` item 15), not by eye.
4. Sample the camera numerically across every step change and every "Hurrengo etapa" crossing: no hard cut, no whip-pan, no dive through a table.
5. For every beat, read its verbs and confirm the action happens between the beat's start and end (a mid + end pair per beat). For 3D, confirm in the real app, because `/dev/frames` uses a fixed camera.
6. Check each step's pose against the notes' prose sentence by sentence (what connects to what, which side, what is gone), not only that the names exist. Sides on a front-view shot against the DirArrows.
7. `/dev/frames?silent=1&w=13` (silent test; it misjudges 3D behind glass, so judge 3D on real WebGL frames) and `node scripts/anchor-audit.mjs http://localhost:<port> 13-13`.
8. A student walkthrough: the whole topic in order at 1×, crossing by "Hurrengo etapa", then the whole class. Note every moment of confusion and fix it.
9. Perf: playback at 60 fps on the heaviest stage (cells flowing), with no model rebuild per frame (`perf-topic10.mjs` approach).

---

## 9. Finish line and hand-over

- Ship a usable topic early (stages + class passing), then polish (`topic10-working-lessons` item 11). Work in batches; after each, report to the owner what landed with evidence (screenshots, test output, quotes from the notes).
- Write `docs/handover/topic-13.md` like topic 12's: the stage table, files, colour decisions, class summary, verification, and a resume list.
- Append topic 13's lessons to `memory/topic10-working-lessons.md`, and update `MEMORY.md` pointers if you add memories.
- Report honestly what is not done or not verified.
