# Notes update, 2026-10-29 (topics 7–13)

The owner sent new versions of the notes for topics 7–13. This file lists what changed **in a way that matters for the simulation**, and which parts of the app are now out of step with the notes. Punctuation, spelling and word-order edits are left out.

## How the new notes are wired in

| Topic | New source (in Downloads) | Replaces |
|---|---|---|
| 7 | `7.GAIA. Gorputzaren barrunbeak (zuzenduta) (1).docx` → `.docx.pdf` | `7.GAIA_Gorputzaren barrunbeak (ZUZENDUTA).pdf` |
| 8 | `8. GAIA. Enbriologia espezifikoa. Hezur sistema (zuzenduta) (1).docx` → `.docx.pdf` | `8. GAIA_ HEZUR SISTEMA (zuzendu gabe).docx.pdf` |
| 9 | `9.GAIA _MUSKULU EDO GIHAR SISTEMA  (2).docx` → `.docx.pdf` | `9.GAIA _MUSKULU EDO GIHAR SISTEMA .docx.pdf` |
| 10 | `10 gaia. Zirkulazio aparatua.docx` → `.docx.pdf` | `10. GAIA_ ZIRKULAZIO APARATUA (ZUZENDUTA).pdf` |
| 11 | `11.GAIA. Zirkulazio sistema.docx` → `.docx.pdf` | `11. GAIA. ZIRKULAZIO-SISTEMA (II) (zuzenduta).pdf` |
| 12 | `12. GAIA. ARTERIA SISTEMA.docx` → `.docx.pdf` | `12. GAIA_ARTERIA SISTEMA (zirkulazio-sistema III) (zuzendu gabe) (1).pdf` |
| 13 | `13. GAIA_ZAIN SISTEMA (zirkulazio-sistema IV) (zuzendu gabe).pdf` (dated 29 Oct, newer despite the name) | `… (Zuzenduta).pdf` (25 Oct) |

- The DOCX files were exported to PDF with Word (text unchanged), as topic 9 already was.
- `scripts/notes/extract.py` has three extractor fixes. Week 13's TOC sets its numbers on separate lines, like week 11's. A heading whose number stands alone takes its title from the words after it (topic 9, 2.2.2). Roman numerals ("III.", "IV.") don't end a sentence in week 9, as in week 12.
- `content/notes-text` was regenerated. Text fidelity is 0 differences for all 14 topics. Topics 1–6 and 14 are byte-identical. Topics 7–13 keep the same section structure.
- Beat, chronology and Klasea anchors were remapped by sentence similarity plus hand-checked overrides. `content/klasea/importance/w7–w13` were regenerated.
- The `FILE` constants in `content/weeks/week7–13.ts` (the "Iturria" source label) still name the old PDFs. They were left alone because those files were off-limits in this pass.

## What changed, topic by topic

### Topic 7: body cavities

- **Inverted statement.** The primitive pericardial cavity **no longer "occupies the whole thoracic cavity"**: it is now "ez du torax barrunbe osoa okupatzen" (2/p8, 2.2/p3). Likewise the peritoneal cavity "does not fully occupy the abdomen" (2/p9, 2.1/p9). Any narration, board item or caption saying "torax osoa okupatzen du" is now wrong.
- **Septum transversum.** It now comes "from the visceral layer around the heart tube" (2/p3/s2). It sits "at the level of the 3rd–5th cervical somites", and **"C3-C4-C5" no longer appears**. A new sentence: myoblasts that migrated from the somites, and the cervical nerves, come from its fibres (2/p5).
- **Septum descent.** By the end of week 5 the front edge is at **T7 (was T6)** and the back edge at T12 (3/p5/s2).
- **Pleuropericardial folds.** They appear **in week 4 (was week 5)** and are now called "mintz / tolesdura" (folds). They still move medially and fuse in week 5, splitting the primitive pericardial cavity in two. **New:** the phrenic nerves and the lungs descend within the folds' mesenchyme, going down, forward and lateral (2.2/p9/s4). The growing lungs also take over the pericardioperitoneal canals.
- **Pleuroperitoneal membranes.** They fuse with the back edge of the septum and the foregut mesenchyme **in week 7** (new explicit timing, 3/p7/s2). The canals disappear at that moment. **New:** the **left** pericardioperitoneal canal is larger than the right, and diaphragmatic hernias pass through it (3/p8).
- **Mediastinum added** (2.2/p13–p15). It has three parts: anterior (very narrow), middle (holds the pericardial cavity) and posterior (descending thoracic aorta, oesophagus, vagus nerves, thoracic lymph trunks). The figure is marked "not from class, just to show what the mediastinum is". There is no matching step yet, so its caption is unlinked.
- **Removed:** the whole paragraph on the **fibrous and serous pericardium** (the fibrous from the pleuropericardial mesenchyme, the serous from the somatopleure, and "both form the parietal pericardium"). It is replaced by one line: "its visceral pericardium touches the heart and reflects into the parietal pericardium" (2.2/p16/s2).
- **Diaphragm parts.**
  - The lumbar part comes from **foregut** mesenchyme. It was "oesophagus" mesenchyme.
  - The peripheral muscle comes from the **lower six thoracic somites** and is "a ring-shaped peripheral muscular part".
  - The sternal part inserts on the **back face** of the sternum. The costal part inserts on **ribs 7–12**.
  - The **right crus is longer**.
  - The central tendon is also called "zentro freniko".
- **Structures crossing the diaphragm.** The aorta crosses at **T12** (new). The list of **nerves** (splanchnic, autonomic) **was removed**.
- **Smaller additions.** The folds happen "usually in week 4". "Somatopleura/splanchnopleura" was dropped from the lateral-plate sentence. "Mesenchyme = primitive embryonic tissue, mostly from mesoderm" was added. The gut is "not fully surrounded at first". The mesentery is now "mesenterio dortsala / atzeko mesenterioa". Intraperitoneal organs that become retroperitoneal: "both layers disappear".

### Topic 8: skeletal system

- **New header:** "Grisez dagoena ez du 2026/2027 kurtsoan aipatu" (grey text was not covered this year). Grey runs (colours ADADAD, B7B7B7, 999999) cover, among others:
  - the sclerotome and dermomyotome cell types;
  - "Esternoia" and "Gerrialdeko hezurrak";
  - the chondroblast model sentence;
  - the fontanelle bilateral note;
  - the occipital-somite mesenchyme;
  - the maxillary and mandibular prominence origins;
  - the **whole intersegmental vertebra explanation** (segmental vs intersegmental mesenchyme, myotomes and arteries reaching the column, artery branches at start and end);
  - section 5.4 (ribs).

  The full list is in the scratchpad `grey.txt` from the update session. Decide whether the simulation should mark or dim these.
- **New KONTUZ paragraph (3.2/p20).** All facial bones and the **front** of the neurocranium (vault and chondrocranium, in front of the hypophyseal fossa, where the notochord ends) come from **neural-crest** mesenchyme. The parts **behind** it come from **paraxial mesoderm** (somitomeres and occipital somites).
- **Ossification definitions rewritten.** Membranous: mesenchyme gives osteoblasts that form ossification centres directly, with no cartilage stage. Endochondral: "in a 2nd phase". The chondrocranium now has "2 kinds of plates" (central and lateral). The temporal-wing and orbital-wing cartilages are named as "kartilagoa". The ethmoid comes from the trabeculae ("hezurraren **gorputza**"). The hypophyseal fossa is named "hipofisi hodia".
- **Fontanelles.** The posterior closes at **2 months** and the anterior at **18 months**. The order is reworded: posterior first. The anterolateral is "sphenoidal" and the posterolateral is now the "**mastoid** fonticulus" (was "temporal").
- **Spine curvatures named.** Primary: **thoracic kyphosis and sacral kyphosis**. Secondary: **cervical lordosis and lumbar lordosis**.
- **Vertebrae.** A new sentence says **each vertebra arises from two primitive segments** (5.2.1/p3/s2). Vertebral bodies "form at intersegmental levels". The notochord in the disc "is transformed, not lost" into the nucleus pulposus.
- **Limbs.** The line "by week 8 these rotations are done" was **removed**. The flexor/extensor sentences are restructured, with the same content. "End of the embryonic period" moved to the ossification-centres sentence (week 8). Ridges now "appear by apoptosis" ("programmed" dropped).
- **Neural-crest sentence.** The cranial neural-crest mesenchyme forms "anterior bones, all facial bones, and the anterior neurocranium". The dermis and sensory ganglia were **dropped**.
- **Mesenchyme glossed** as "embryonic connective tissue". The sternum gets a note: sclerotome cells reach the lateral plate.

### Topic 9: muscular system

- The topic 9 intro paragraph on **fontanelle closure was removed**, which settles the SOURCE_ISSUES note on it. Its chronology anchor `w9/intro/p5/s3` was dropped.
- **Cranial nerves numbered** throughout. III oculomotor, IV trochlear and VI abducens supply the eye muscles. V trigeminal for arch 1, VII facial for arch 2, IX glossopharyngeal for arch 3, X vagus for arches 4/6, XII hypoglossal for the tongue. "12 cranial nerves in total" is said once.
- **Spinal-nerve motor innervation refined.** "Most skeletal muscles of the trunk and limbs; some head and neck muscles get cranial-nerve innervation". It was "all muscles except the head".
- **Smooth muscle** is in "all viscera **except the heart**".
- **Moved.** The paragraph on precursors fusing into multinucleate striated fibres moved from the general domains text to the **abaxial domain**. The abaxial domain now forms "the limbs' **own** muscles". Most (not all) abdominal muscles are abaxial.
- **Somite back wall.** It now forms the **dermomyotome** on the dorsal side, from which the dermatome and muscle precursors separate. It was "the dermatome cell group".
- **Spinal cord.** "Ependymal canal (central canal)". Lateral horns are "sympathetic and parasympathetic". The conduction tract between nodes is "nodoenarteko traktua" (was "interatrial bundles").
- **Grey text** (999999) is unchanged in meaning: "Grisez dena aurten ez da aipatu".

### Topic 10: circulatory apparatus

- **Cardiogenic fields.** The **primary cardiogenic field** is named: the horseshoe cell cluster. A **secondary cardiogenic field** "from which the heart tube arises" is added, and its cells also reach the endocardial tubes. Cells "invaginate through the primitive streak" (was "migrate").
- **Atria and sinus venosus** "are **initially outside the pericardial cavity**", in the septum transversum (2/p8/s2). The naming note ("say *atal aurikularra/bentrikularra*, not just atrium/ventricle") moved to the blood-path sentence. The blood path now reads "veins → sinus → **atria** → …".
- **Common cardinal veins** now come from the fusion of the anterior and posterior cardinals. The anterior drains the cephalic end and the posterior the caudal end (3.4/p4).
- **Right atrium.**
  - Its trabeculated wall has **pectinate muscles (muskulu peptinatiak)**.
  - The crista terminalis is also "**bukaera gangarra**".
  - The two venous valves sit "goi **atzekaldean**" (upper back) of the sinoatrial opening.
  - **Removed:** the sentence on the right venous valve giving the **IVC valve and coronary-sinus valve**. That now lives in topic 13, 3/p5. **"Septum spurium"** was also removed here.
- **Trimmed.**
  - The trabeculated right-ventricle explanation ("most important but not only part").
  - The arterial-cone division into the two infundibula, now reduced to one line.
  - "Alde kaudala zain muturra da".
  - "The loop's parts are continuous, no septum yet": the class line *lakioa#9* cited this and now has no notes.
  - The dorsal-aortae link wording.
  - The aortic-sac naming ("arteria **sakua**").
- **Loop timing.** "From day 23 on" (was "on day 23"). "28. egunerako amaituta dago".

### Topic 11: heart septation

- **Septum primum and secundum are both crescent-shaped**. The foramen ovale is glossed "arrautza itxurako zuloa". The sinus "enlarges the right atrium" as it is incorporated.
- **Pulmonary veins rewritten** (2.2/p14).
  - A single outgrowth from the primitive left atrium's back wall (the embryonic pulmonary vein) branches into **four** pulmonary veins, two for each lung.
  - These are **incorporated into the back wall** to form the left atrium's smooth part.
  - The trabeculated front wall, with pectinate muscles, forms the auricle.
  - **Removed:** the dorsal-mesocardium origin of the vein (it was already marked "ez du aipatu"), plus the "contacts the lung-bud veins" wording.
- **AV canal.**
  - The four endocardial cushions are introduced up front: dorsal, ventral, right and left.
  - The bulboventricular edge flattens.
  - The fused upper and lower cushions form the **septum intermedium** (now named).
  - The canal "shifts right for several reasons".
- **AV valves** "**arise from the ventricular myocardium**": blood flow thins the myocardium and the cusps form. The papillary-muscle and chordae mechanism is now explained: muscles pull, chords pull the cusps, and the openings open or close.
- **Ventricular septum.** The muscular part forms as the walls approach. The cavity created is taken into the septum. The membranous part is "the lower end of the conus septum". **New:** both ventricles have **inflow chambers** (muscular) and **outflow chambers** (infundibula), in different planes.
- **Outflow.**
  - The conus is divided by two ridges, back-right and front-left.
  - The aorticopulmonary septum is "**kiribil formakoa**" (spiral). The ridges "fuse".
  - The truncus ridges are on the **right** side (was "upper back") and the lower left.
  - The h1 heading now reads "→ kiribil formako trenkadak".
- **Exam note:** "ADI!! Azterketan beti hauetako argazkiren bat agertzen da" (5.1). The extractor keeps it verbatim, so **it will show in the notes pane and Kimu can quote it**. This conflicts with the no-past-exams rule; decide how to hide it.
- **Light-grey text** (B7B7B7) covers the loop-orientation recap ("ALBOTIK IKUSITA…") and the primary interventricular foramen. The notes don't say what grey means here.

### Topic 12: arterial system

- **Limb arteries (2.7) are now marked "EZ DA JAKIN BEHARRA"** (not required). A new "**ATAL HONETAN JAKIN BEHARREKOA**" box says what is required: the limbs' axial arteries first connect with the external iliac or subclavian arteries, plus the parts of the aorta and the origin of its branches.
- **Arch 5** "appears but almost disappears **very fast; it does not develop**".
- **New details.**
  - Each pharyngeal arch has a cranial nerve and an artery.
  - Arches appear cranio-caudally. The arch-system figures sit at days 27 and 29, and the overview is at **weeks 4–5** (was 5).
  - Arch 2 now gives "hyoid-**infra** arteries" and stapedial arteries. Arch 3 gives the stapes **bone** (was muscle).
  - **Inferior phrenic arteries** were added among the lateral branches.
  - Intersegmental arteries "lie between somites" and "take part in forming the subclavians".
  - Lateral sacral arteries.
  - The femoral artery "supplies almost the whole lower limb except the buttock".
  - Internal-iliac branches feed the bladder, uterus and vagina.
  - The umbilical artery links to the **superior vesical** artery.
- **Source numbering issue:** two sections are numbered 2.3.2 (third arches and fourth arches). They are logged in `SOURCE_ISSUES.md`. The text is preserved, and both live under `w12/2.3.2/…`.
- **Light-grey text** marks the organ lists of the coeliac and mesenteric arteries (spleen/stomach/liver; distal duodenum and two thirds of the gut; last third).

### Topic 13: venous system

- **Supracardinal section (2.3.1) rewritten.**
  - Supracardinals take over the posterior cardinals' drainage of the body wall.
  - The **azygos** forms from the right supracardinal and the right posterior cardinal's proximal part. It opens into the SVC with an arch.
  - Hemiazygos takes left intercostals 9–11. The accessory hemiazygos sits "slightly higher" and takes 4–8. Both reach the azygos through cross anastomoses.
  - **New:** left intercostals 1–3 form the **left superior intercostal vein**, which drains straight into the **left brachiocephalic vein**.
  - Lumbar veins join the azygos.
- **Inferior mesenteric vein added.** It comes from the distal left vitelline vein and drains into the splenic vein. The vitelline veins also branch to the midgut. The hepatic sinusoid plexus is "gibel barneko zain-sare/plexua".
- **Venae cavae (3).**
  - The anastomosis principle (left blood goes to the right) is restated.
  - Both cavae reach the right atrium's **smooth back wall**.
  - **New here:** the IVC opening has a **valve from the right venous valve**, and the **coronary sinus** enters with another valve. This moved from topic 10.
- **IVC segments.** Hepatic (top), renal (middle) and sacrocardinal (bottom) **fuse in that order**. The old summary sentence was removed.
  - The hepatic segment is also "hepatocardiac segment".
  - The left gonadal vein comes from the left subcardinal's distal part and reaches the right subcardinal. The proximal part disappears.
  - The sacrocardinal anastomosis gives the left common iliac. Right sacrocardinal: the distal part gives the right common iliac and the proximal part the sacrocardinal segment.
- **SVC.**
  - The left brachiocephalic carries blood from left to right.
  - The left internal jugular comes from the left anterior cardinal's distal part and drains the left head and face.
  - The subclavians come from the limb-bud veins. The SVC trunk "has two origins".
  - **New box "JAKIN BEHARREKOA"**: the SVC receives both brachiocephalics and the azygos. The IVC receives all lower-body blood (iliacs, portal, viscera).
- **Fetal circulation.**
  - About 80 % saturation.
  - A small amount of umbilical blood enters the hepatic plexus and mixes with portal blood.
  - Left atrial blood mixes with a little deoxygenated pulmonary blood.
  - The myocardium and brain are well oxygenated because they get the first aortic branches.
  - The IVC carries low-saturation blood from the lower body.
- **Birth (4.2).** "Four main changes".
  - The umbilical arteries close **functionally** at 2–3 minutes and **anatomically ~3 months later**.
  - The umbilical vein and ductus venosus close a little later.
  - The ductus arteriosus becomes the ligamentum arteriosum **by month 3**, and **the left recurrent laryngeal nerve hooks around it**.
  - The foramen ovale is "arrautza itxurako zuloa".
- **Title** is now "ZAIN-SISTEMA (ZIRKULAZIO SISTEMA IV)". The TOC adds 2.3.1.

## Anchor remap: what needs a hand fix in `content/weeks`

These come from the remap itself, not from the notes content. Each is a one-line edit in a file this pass was not allowed to touch:

1. **Topic 7, `week7.ts`, stage `peritoneo-barrunbea`, step 6.** It cites `w7/2/p8/s1`, which is outside the stage's section and fails `notes.test` "keeps anchors in the stage sections". Use **`w7/2.1/p9/s1`** ("Peritoneo barrunbeak ez du barrunbe abdominal osoa okupatzen").
2. **Topic 8, `week8.ts:654`, the pharyngeal-arch step.** It lost the arch sentence: the old `w8/3.2/p2/s2` is now **`w8/3.2/p3/s1-s2`**. Add it. Klasea line `arkuak#1` already cites it and fails G1 until the step does.
3. **Topic 10, `week10.ts`.** The heart-tube cut step lost its caption ref **`w10/1/p20/s1`** ("Bihotz hodiko mozketa sagitala / … frontala"). The id did not change, but the remap dropped it. Add it back.

Refs dropped because the new notes **deleted** the sentence (no target exists):
- T7 fibrous/serous pericardium (`2.2/p14/s2–s3`). Klasea line `mintzak#9` now has no notes.
- T7 the "●…" bullet in the diaphragm list.
- T8 "segments keep segmental origin, then fuse" (`5.2.1/p18/s1`).
- T9 "-" in the deep-back list. T9 the intro fontanelle sentence (chronology "Aurreko fontanela ixten").
- T10 "atalak jarraiak, ez da trenkadarik" (Klasea `lakioa#9`).
- T11 dorsal-mesocardium origin of the pulmonary vein.
- T13 the separator line.

## Simulation spots now out of sync (failing guard tests)

After this pass (full `npx vitest run`, 2026-10-29), **32 tests fail because of the notes update**:

| Suite | Topic 7 | Topic 8 | Topic 9 | Topic 10 | Topic 11 | Topic 12 | Topic 13 |
|---|---|---|---|---|---|---|---|
| `klasea.test.ts` (25) | 6 | 3 | 2 | 5 | 3 | 2 | 4 |
| `notes.test.ts` (3) | 2 | 1 (topics 8 and 9) | | — | — | — | — |
| `kimu.test.ts` (4) | 4 | — | — | — | — | — | — |

Four of the Klasea failures are the 60 % core cap (topics 7, 10, 11, 12). The rest are notes-sync findings.

Not from the notes update: `tests/visibility.test.tsx` (50 failures) and `tests/anchors3d.test.ts` topic 11 `zulo-obala` (1 failure) come from the in-progress "mentioned structure must be visible" rework: the zain sinua fix, which touches `lib/sim/mentions.ts` and the topic 11 3D scenes.

### Topic 7
- **Numbers no longer in the notes.**
  - `septum#2`, `b-septum`: "3"/"5". The class says C3–C5, but the notes now say "3º, 4º eta 5º somita zerbikalen mailan".
  - `diafragma#8` (+ plain), `b-jaitsiera`, `diafragma/contrast`: "6". The class says the septum front edge is at T6; the notes now say **T7**.
  - `b-zutabeak`: "2". Crus sentence split by the extraction.
- **Directions.**
  - `mesenterioa#3` (+ plain): "behe". "Enbrioi barruko zelomaren beheko aldean" was removed.
  - `mintzak#8` (+ plain), `b-perikardioa`, `mintzak/contrast`: "erdi". The pericardium sentence became "Erdialdean gelditzen den".
- **No notes:** `mintzak#9` (the serous-pericardium line; its paragraph was deleted).
- **Core sentences no line says:**
  - `w7/2/p8/s1` (pericardial cavity does **not** fill the thorax).
  - `w7/3.1/p9/s1` (sternal part, back face).
  - `w7/3.1/p11/s1` (lumbar part from foregut mesenchyme).
- **Pinned "needed" sentences no longer core:** `2/p7/s1` (coelom split), `2.2/p3/s1` (pericardial cavity, inverted statement).
- **Core share** is 0.61 (cap 0.60).
- **Notes figure parity:** new captions with no matching step:
  - the **mediastinum** figure (`w7/2.2/p14–p15`);
  - `w7/3.1/p14`, the tail of "kendu egin dira … abdomeneko organoak", split off as a caption.

  The step-section failure is fix 1 above.
- **Kimu:** the "four parts of the diaphragm" answer now starts at "Gero, diafragmaren atal muskularra…" and no longer quotes "Septum Transversuma". The citation test fails the same way. The "noiz" answer now starts with "Diafragmatik egitura asko…". "Mediastinoa" now finds topic 7 notes (the new mediastinum text) instead of falling back to topic 13. Update the test expectation, or keep 13 if that is preferred.

### Topic 8
- **Core sentences no line says:**
  - `3.1.1/p6/s1`;
  - `3.1.2/p5/s1` (central plate);
  - `3.1.2/p8/s6–s7`, `3.1.2/p9/s1–s2` (foramina and the **KONTUZ** origin paragraph);
  - `3.2/p13/s1`;
  - `5.2.1/p10/s1`, `5.2.1/p12/s1`.
- **G1:** `arkuak#1` (fix 2 above).
- **Number:** `b-behekoak: 90`. The 90° lower-limb rotation now sits in a separate sentence from the board item's cited one.
- **Notes figure parity:**
  - `w8/1/p4` is the new grey-text header, detected as a caption.
  - `w8/3.2/p9` is an indented body line detected as a caption.

### Topic 9
- **Core sentences no line says:** `2.1/p5/s2`, `2.1.3/p26/s1`, `2.2.2/p8/s1` (ependymal canal), `2.2.2/p15/s1`.
- **Number:** `okzipitalak#5: 12`. The line says "XII"/"12"; the cited sentence now reads "XII. gara nerbioak".
- **Notes figure parity:** `w9/2.1.2/p7` and `w9/2.2.1/p23` are indented body lines detected as captions.

### Topic 10
- **Core sentences no line says:**
  - `1/p26/s4–s7`;
  - `2/p7/s2` (sinus receives umbilical, vitelline and **common cardinal** veins);
  - `3.1/p6/s1`;
  - `3.4/p16/s3`, `3.4/p17/s1`, `3.4/p18/s1` (right atrium: pectinate muscles / bukaera gangarra).
- **No notes:** `lakioa#9`. **G2:** `lakioa#9` lights the four loop parts with no fact, and `bentrikuluak-aurikulak#1` lights the early right ventricle.
- **Direction:** `zain-sinua/contrast: atze`.
- **Core share** is 0.62.

### Topic 11
Another session is reworking a topic 11 scene; check these after it lands.
- **Core sentences no line says:** `2.2/p15/s1` (left auricle from the trabeculated wall), `3/p8/s3` (AV openings link the upper-back atria and lower-front ventricles).
- **Number:** `b-zuloak: 4`.
- **Core share** is 0.62.

### Topic 12
- **Core sentences no line says:** `2.3.2/p8/s1`, `2.4/p16/s1`, `2.4/p17/s1`, `2.5.1/p6/s1`, `2.5.2/p7/s1`, `2.5.3/p4/s1`.
- **Core share** is 0.601.
- **Content check:** the limb-artery stage (2.7) is now "not required".

### Topic 13
- **Core sentences no line says:**
  - `2.1.1/p5/s1`;
  - `2.3/p7/s3` (the three new systems give the two cavae);
  - `2.3.1/p8/s1` (accessory hemiazygos);
  - `3.1/p7/s1` (left gonadal vein);
  - `3.1/p11/s1` (sacrocardinal segment);
  - `3.2/p16/s1`.
- **Pinned not core:** `2.3/p7/s2`.
- **Numbers:** `jaiotza#5: 2`, `jaiotza#5: 3`, `b-hiru: 3`. Birth timing was reworded: functional closure at 2–3 min, anatomical ~3 months, ductus by month 3.
- **Direction:** `azigos#4` (+ plain): "goi". The azygos now "goiko aldetik" reaches the SVC.

## Extraction notes

- In the Word-exported PDFs, some **indented body lines are detected as captions**: topic 7 3.1/p12, topic 8 3.2/p9, topic 9 2.1.2/p7 and 2.2.1/p23. The text is right; only the block kind is wrong. A future extractor rule could limit `box[0] > 150` captions to italic lines for these Word exports.
- Topic 9's cranial-nerve table is laid out beside the list, so lines like "○ IV. gara nerbioa (troklea-nerbioa) ○ 5º somitomeroaren…" carry the next list item.
