# Eratorriak study rooms — non-3D handover

## Review changes (2026-10-30, 3D session)

- New-room code reformatted (prettier, 140 columns, single quotes) to match the codebase.
- `kit/PieceDiagram.tsx`: names are now placed after paint, in two columns hugging the drawing, each at its piece's height, with a short leader to a dot on (or well inside) the piece. Geometry `label` only picks the side and rough height. Two pieces sharing one name get their origin appended. New `Shape.casing` gives a dark edge so a line reads on a same-coloured piece.
- Topic 8 (`BoneDiagram.tsx`) and topic 9 (`MuscleDiagram.tsx`): the icon grids are replaced by simple anatomical schemas (lateral calvaria, chondrocranium from above, face with the ear ossicles, limbs, thorax, vertebral column; lateral head, neck and thoracic sections, smooth-muscle vignettes, connective patterns, heart wall and conduction). Shared builders are in `kit/shapes.ts`.
- Topic 10 tube view: filled segments, a straight tube and a frontal loop (bulbus down-right, ventricle left, atria up and back). The view toolbar now uses the shared tab style.
- Topic 7 moment 0: the coelom is the horseshoe on the disc. Topic 11 moment 0 has context words. Topic 13: the circulation figure is a before/after route map (shunts → remnants in the notes' words), and the lymph figure is a body schema with the six sacs and the final duct.

Work in the owner's checkout; no commits, pushes, stashes or reverts. Do not edit any `components/scenes/**`, `lib/three-d/**` or `Arch3D.tsx` as part of this work.

## Shared kit / topic 12

- `components/shell/eratorriak/Flashcards.tsx:8` is now a topic-12 adapter. The extracted `kit/Flashcards.tsx:45` accepts cards, tags, storeKey and renderFigure. Topic 12 retains `enbrioatlas:fitxak-12`, its tag order, ArchLadder back figures, 15-card rounds, boxes 0–4, mounted flag and keyboard rules.
- `content/eratorriak/flashcard-store.ts:2` ignores malformed storage (including valid JSON with the wrong shape) and retains valid boxes.
- `content/eratorriak/model.ts:1` defines stable piece keys, origins, fates, real simulator moments, keyed content, optional temporal lives and per-record sentence references. `derive` builds the table, explorer and composites from the pieces. Matrix topics may omit life rather than pretending categories are ages.
- `kit/MomentBar.tsx:7`: controlled moments, arrow keys, play with callback state updates and an accessible horizontal tab strip.
- `kit/TimelineLayout.tsx:5`: diagram + information column; optional view3d/tools3d. Without a view, no empty box.
- `kit/TestTable.tsx:9`: independent hide/reveal test state per table. `kit/StudyRoom.tsx:19`: section navigation, search/picks, info/life panels, hover changes, return links, composites, gone list, pitfalls and cards. `RoomViewState` is at line 14.
- `kit/PieceDiagram.tsx`: one keyed path per drawn piece, keyboard pick targets, label layer last. The glow uses a nonzero **user-space** filter area: object-bounding-box filters made perfectly vertical paths disappear. `tests/eratorriak-kit.test.ts` pins this regression and storage recovery.
- `kit/study.module.css` applies only to new rooms. Existing topic-12 CSS and Topic12.tsx were not edited.
- Ten 1440×900 before/after section shots: `C:\Users\aitor\Documents\Codex\2026-10-30\files-pasted-by-the-user-prompt\outputs\a12-{before,after}-*.png`. Seven pairs are pixel-identical. Differences in denbora are confined to the live 3D model, and in fitxak/nahasketak to the randomly dealt card (the latter includes the beginning of the card section). No claim of deterministic 3D-pixel equivalence.

## Topic 13 — Zainak

### What landed

1. `a13-mapa`: three subject blocks + suggested study order.
2. `a13-denbora`: six moments; four selectable 2D views (liver/vitelline, umbilical, cardinal/cavae, azygos/sinus). Lit picks spanning views show each relevant view. Origin/fate colours, name test, play, arrows, actual simulator links, searchable 61-pick explorer, per-piece source/fate/life info.
3. `a13-taula`: all 33 pieces and their fates; individual answer reveal.
4. `a13-helduak`: 20 compositions, notably the three-piece IVC, two-piece SVC and two-source azygos.
5. `a13-desagertu`: five regression/remnant entries with returns.
6. `a13-irudiak`: six-row birth closure table, prenatal/postnatal route schema, six lymph sacs → one thoracic duct, three-colour IVC bar.
7. `a13-nahasketak`: six common confusions with returns.
8. `a13-fitxak`: 54 cards in six tags, each with notes sentence ids; progress key `enbrioatlas:fitxak-13`.

### Files

- `content/eratorriak/veins.ts:5`: origin palette copied from the existing venous model/registry; fates at 17, moments at 39, 33 records at 49, changes at 84, room at 92.
- `content/eratorriak/cards13.ts:4`: 33 single-piece retrieval cards plus 21 focused cards for composites, surface location, birth, circulation, lymph and the notes' summary.
- `components/shell/eratorriak/VeinDiagram.tsx:11`: fixed geometry; renderer at 55. Viscera and cardinal views are schematic topology, explicitly captioned; no claim to anatomical proportion.
- `components/shell/eratorriak/figures13.tsx:11`: birth table; figures at 19 onward.
- `components/shell/eratorriak/Topic13.tsx:10`: room and future view3d insertion point.
- `components/shell/MigrationMap.tsx`: STUDY includes 13. Existing legend/below-room schemas retained.
- `components/shell/Lineage.tsx`: compact topic 7–13 jump links.
- `tests/eratorriak-13.test.ts`: lives, paths, ids, keyed links, source ids, card count, final labels and pinned compositions.

### Notes decisions / ambiguity

- **Three IVC segments.** The task's per-topic suggestions mentioned a standard five-region scheme. The supplied prose explicitly says three: `w13/3.1/p4/s1`, `w13/3.1/p13/s1–s2` (hepatic + renal/subcardinal + sacrocardinal). Those three drive diagram, table, composite and cards; no extra supracardinal IVC segment was imported.
- **Distal left vitelline exception.** General regression prose `w13/2.1.1/p7/s2` says the distal left segment disappears, while the specific derivative paragraph `w13/2.1.2/p5/s2` derives the inferior mesenteric vein from it. The room retains a clearly labelled *hondarra* record for that named derivative. This is an internal prose ambiguity, not a silently added outside fact. Inferior mesenteric vein has no registry entry, so the fate is textual and deliberately has no structure/id3.
- **Umbilical vein is not ductus venosus.** `w13/2.2/p6/s2`, `/p7/s2`, and `w13/4.2/p8/s1`, `/p9/s1`: separate pieces, separate postnatal names. Ductus is on the liver surface (`w13/2.2/p9/s1`), not in the sinusoid mesh shown by some figures.
- **No instantaneous anatomical foramen closure.** `w13/4.2/p11/s1–s4` distinguishes pressure apposition from later fusion (~one year; not complete in 20%). Table/cards preserve that distinction.
- The source's coronary-sinus sentence `w13/3.1/p15/s3` has a location typo (“gibelako…”). The room uses its derivative names without repeating the erroneous location. No external clinical claims were added.
- No migrations.ts flow correction was required for the three-segment interpretation; existing flows agree with the prose.

### Verification

- Source PDF: all ten pages rendered with fitz and viewed. Figure families: initial three pairs; liver/duodenal plexuses and remodel; cardinal/caval anastomoses; fetal/postnatal circulation; lymph. The room has matching schema families. The generic venous schema simplifies the periduodenal mesh to its persistent route; it is not a literal tracing of every loop in the PDF figure.
- 1440×900, 1024×768, 768×1024: all eight sections captured. Four schema views at moments 0, 4 and 5 also captured at all sizes; figure close-ups captured. Files: `C:\Users\aitor\Documents\Codex\2026-10-30\files-pasted-by-the-user-prompt\outputs\a13-*.png`. Contact sheets and dense figure shots inspected. No page horizontal overflow at any size. A viewport screenshot may show only part of a tall section; it is not a full-page export.
- CDP walkthrough at 1024×768: 61 picks; 45 table/gone/pitfall/figure return links; 20 composite buttons; answer hide/reveal; arrow navigation; real simulator URL; card flip/grade/storage; name and colour modes; absent 3D controls. **263 assertions passed**, including play-stop and blocked storage; no console exceptions. Middle-stage venous poses were not all captured; stages 0, 4, 5 were captured in all four views.
- Focused tests after shared-kit additions: **25 passed / 4 files**. ESLint passed. Typecheck caught a test-only Set<unknown> annotation; corrected to Set<string>, final rerun passed.
- Full suite after topic 13: **1785 passed, 28 failed, 6 skipped / 53 files**. An untouched `git archive HEAD` baseline under the task's work directory reproduces all **28 failures, 162 passes, 6 skipped** in `notes.test.ts` and `klasea.test.ts`; these files do not import the new rooms. They were not weakened or edited.

### Open questions / limits

- The distal-left-vitelline ambiguity is recorded above for the owner/teacher; the implementation follows the explicit named derivative.
- Source diagrams could benefit from a closer periduodenal mesh drawing and a richer side-by-side fetal circulation plate. These are visual limits, not missing registry claims.
- No 3D work was done. Start the next session with `docs/handover/eratorriak-3d-briefs.md`.

## Topic 7 — Barrunbeak

### What landed

- `a7-mapa`: one → four spaces; four diaphragm sources; serous layers and organ relationships, with a study sequence.
- `a7-denbora`: six moments (folding, partial separation, pleura/pericardium, pleuroperitoneal appearance, week-7 closure, mature parts). Three focused views: cavity map at multiple body levels, diaphragm source map from above, transverse serosa/mesentery section. Hollow cavity paths exclude the organs they surround; the diaphragm source regions join after closure rather than leaving false canals.
- Shared explorer, origin/fate colouring, name test, Info with sentence ids/lives, keyboard/play and simulator links. Search also finds individual segments (a collapsed “Enbrioiko piezak” list keeps all labels available). 29 destinations including detail picks.
- `a7-taula`: 17 records, hidden-answer test. `a7-helduak`: eight compositions; diaphragm has **four source families and five physical pieces** because the two pleuroperitoneal membranes are paired. The header now states both origins and pieces.
- `a7-desagertu`: canal closure, local mesentery/peritoneum fusion, and retained adjacent serous layers.
- `a7-irudiak`: transverse folding sequence, mesentery approximation/fusion sequence, interactive cervical→lower position/phrenic extension, diaphragm muscle parts and openings, six-row organ relationship test table, mediastinum explanation.
- Six pitfalls; 47 notes-only cards in four tags (`enbrioatlas:fitxak-7`). Each §4 summary line is covered by room text and cards (`four`, `secondary`, `virtual`, `not-whole`).

### Files / sources

- `content/eratorriak/cavities.ts:4`: colours; fates at 15, stages 25, records 35, changes 54, room 62, organ table 68.
- `content/eratorriak/cards7.ts:4`: 17 piece cards + 30 focused retrieval cards.
- `components/shell/eratorriak/CavityDiagram.tsx`: keyed geometry per moment, all text in reserved side bands.
- `components/shell/eratorriak/figures7.tsx`: folding, fusion, phrenic/descent and adult diaphragm figures and organ table.
- `components/shell/eratorriak/Topic7.tsx:9`: room and future 3D call site.
- `tests/eratorriak-contract.ts`: reusable data/source/geometry contract; `tests/eratorriak-7.test.ts`: four sources, four final spaces, paired closure and revised flow text.
- MigrationMap STUDY entry and Lineage compact link. `content/migrations.ts` two corrections below. No scene or 3D file changed.

### Prose decisions and corrected flows

- Updated source says **anterior T7**, posterior T12 at the end of week 5: `w7/3/p5/s2`. Corrected the `septum-jaitsi` migration flow's old T6 label to T7. The room/card/interactive figure follow T7. Existing simulator narration/3D is outside this change's scope and may still show the older T6; the following session must reconcile it against the updated source.
- Membranes appear in **week 5** but fuse and close the canals in **week 7** (`w7/3/p7/s1–s2`, `w7/3.1/p4/s3`). Corrected the old `zeloma-banatu` closed-canal note “5. astea” to “7. astea”. Timeline keeps channels open through stage 2, thinning at 3, ghosted at 4 onward.
- `w7/3/p8/s1` says the left canal is larger and `/s2` mentions hernias. It does **not** say it closes later. No left-late closure or extra clinical assertion was introduced.
- Peripheral diaphragm source is the **paraxial mesoderm of the lower six thoracic somites**, following `w7/3.1/p6/s1`; it was not silently replaced with lateral-plate origin.
- The source says the two leaves of the local mesentery/parietal peritoneum disappear on fusion (`w7/2.1/p12/s2`). This is not a claim that all mesenteries or all parietal peritoneum regress; their general records remain present, with a dedicated local-fusion explanation.
- Avoid adding later-topic organ exceptions: the organ table lists exactly the examples given here (`w7/2.1/p11/s2–s4`, `/p13/s1`).

### Verification / limits

- All 11 PDF pages rendered and viewed. Figure families matched by folding, thoracic separation/cavity map, mesentery and organ relations, membrane closure/source map, descent/phrenic view and diaphragm parts/openings. The cavity map deliberately combines levels and is captioned as a map, not as one anatomical slice. The source-coloured diaphragm is an origin map; the adult openings live in a separate figure.
- Captured all eight sections at 1440×900, 1024×768, 768×1024, plus **all six moments of all three schema views at all three widths** as unclipped figure captures (54). All figure contact sheets and selected dense full-size images reviewed; no page overflow. Files: `C:\Users\aitor\Documents\Codex\2026-10-30\files-pasted-by-the-user-prompt\outputs\a7-*.png`.
- Final CDP walkthrough: **139 assertions**, 29 explorer destinations, 29 return links, 8 composite buttons, piece click, test tables, card flip/grade, keyboard, play to last + stop, blocked storage, names/colour switches and no 3D controls. No console errors in the final run. The initial missing-key warning was fixed and captures regenerated.
- Typecheck and ESLint passed; **33 focused tests passed / 5 files** including topics 12/13 and migrations. Full suite after topic 7: **1795 passed, 28 baseline failures, 6 skipped / 55 files** (`work/full-topic7.log`). The 28 pre-existing alignment failures were already reproduced on HEAD.
- The descent figure's two positions were both clicked; the final late-position captures are `a7-W-descent-late.png`. 3D and browser camera animation are deferred.

## Topic 11 — Bihotz trenkadak

### What landed / files

- `content/eratorriak/septa.ts:3`: source palettes; fates at 13; eight atrial moments at 32; 30 pieces at 44; changes at 76; room at 86; openings comparison at 91. Every chamber is a two-source composition, and the IV septum has muscular + membranous parts.
- `components/shell/eratorriak/SeptaDiagram.tsx`: five diagrams (atrial sheets/openings, AV cushions/valves, IV closure, four-chamber origin map, conus/truncus). The atrial route is drawn as a biological flow arrow only before birth. Secundum is on the embryo's right of primum (viewer left), and the openings are at different heights. Ghosted openings denote former communication, not remaining flow.
- `components/shell/eratorriak/figures11.tsx`: hidden-answer opening table, two septation mechanisms, three-level spiral cross-sections, valve comparison table, and two collapsed source qualifications (optional upper-primum regression; alternative membranous-septum account).
- `content/eratorriak/cards11.ts:5`: 59 cards, five tags, per-piece figures and source sentence ids. Storage `enbrioatlas:fitxak-11`.
- `components/shell/eratorriak/Topic11.tsx:9`: future 3D insertion point. MigrationMap STUDY and Lineage link added. `tests/eratorriak-11.test.ts` plus the shared contract pin chamber pairs and opening order. Shared contract now also checks that every keyed CHANGES mention is actually drawn at that moment.
- Room sections: map; eight-moment atrial sequence with five alternative schemas; all-piece retrieval table; 15 compositions; three closure entries; figures/tables; six pitfalls; cards.

### Notes decisions / flows corrected

- **Ostium secundum appears before ostium primum closes** (`w11/2.1/p4/s4`). Stage 2 has both open; stage 3 has primum closed/ghosted. No moment leaves the fetal atria without their described route before the later septum creates the oblique path.
- **Secundum right of primum; FO below, OS above**: `w11/2.2/p3/s3–s4`, `/p4/s1`, `/p5/s1`. Side convention is printed. Left venous valve is the *left valve of the venous inlet within the right atrium*, not an instruction to put it in the left atrium.
- **Pressure apposition vs anatomical fusion**: `w11/2.2/p7/s3–s6`; stages 6/7 distinguish them and retain the notes' first-year/~20% qualification. The flow arrow stops at birth.
- **Membranous IV part**: main account `w11/4/p6/s2` and `w11/5.1/p4/s11` derives it from the lower conal septum, joining muscular septum and inferior cushion. Alternative book account `w11/5.2/p7/s12–s14` assigns the extension to the inferior cushion. Main model follows the lecture's first account; alternative is explicitly collapsed and cited, not silently merged into two independent adult membranes.
- **Conal ridge directional inconsistency within the prose**: `w11/5.1/p4/s2` explicitly lists posterior-right and anterior-left; `/s4` reverses the directional pair. Record labels follow the explicit list in s2; the resulting smooth chambers follow s5/s6 (RV anterior-right, LV posterior-left). This is recorded rather than inventing a third interpretation.
- `w11/5.1/p4/s16` calls inflow chambers muscular and then parenthetically “lisoak”; the explicit summary `w11/5.2/p7/s10` and chamber descriptions consistently distinguish trabeculated origins from smooth conal outflows. Those explicit descriptions drive the room.
- **AV leaflets**: `w11/3/p16/s2–s3` and `/p17/s1–s3` include myocardium thinning and mesenchymal elevations. Updated `migrations.ts` flow `erreten-ab`: lead and both valve-edge labels now include **mesenkima + miokardioa**; they no longer suggest cushion mesenchyme alone tells the whole story.
- Optional upper primum regression is not universalised (`w11/2.2/p6/s1`: source says several books, not all). The room's core flap label names the lower part; a collapsed note preserves the qualification.

### Verification

- All 11 source PDF pages rendered/viewed; matched schema families: mechanisms, atrial openings/birth, chamber wall incorporation, AV separation and valves, muscular/membranous IV parts, conus/truncus and three axial levels, semilunars/coronary origins.
- All eight room sections at 1440×900, 1024×768 and 768×1024. Atrial diagram all eight moments at each width; other four views at 3 and 7; mechanisms, spiral and valve-table close-ups. Source of truth screenshots: `C:\Users\aitor\Documents\Codex\2026-10-30\files-pasted-by-the-user-prompt\outputs\a11-*.png`. Contact sheets and dense full-size views inspected. No horizontal page overflow.
- Tooling correction: a view button and an adult pick share the IV-septum name. Screenshot driver now selects within the view's role=group, so it cannot accidentally click the adult pick and capture the previous view. The product keeps both meaningful controls.
- **235 browser assertions**: 52 picks, 48 return buttons, 15 compositions, main/extra test reveals, SVG pick, arrow keyboard, play-stop at last moment, card flip/grade, blocked storage, colour/names modes and hidden 3D controls. Final logs contain no exceptions/warnings.
- TypeScript and ESLint passed; **41 focused tests / 6 files passed**. Full suite after 11: **1803 passed, 28 failed, 6 skipped / 56 files**, all failures in the same HEAD-baseline notes/class alignment tests. Neither those tests nor the old scene/class content were changed.
- Remaining visual limit: these are explicit 2D topology/origin schemas, not anatomical 3D cutaways. The next session should supply spatially accurate atrial sheets, AV-plane orientation and spiral continuity in the provided slot.

## 10 · Bihotz hodia

Room: `Topic10.tsx:7` with the same eight section ids. `heart-tube.ts:1` owns 21 stable pieces, 6 temporal moments, source sentence ids, derived explorer/table/compositions, two regression entries and four pitfalls. `HeartTubeDiagram.tsx:8` exports geometry for tube/loop, layers/mesocardium and venous valves; selections automatically reveal all applicable views. `figures10.tsx:7` covers transverse versus cephalocaudal folding, jelly versus three cell layers, inlet/outlet circulation and RA incorporation. `cards10.ts:4`: 45 cards. `tests/eratorriak-10.test.ts:7` uses the common contract and independently pins both ventricular sources, both RA walls, both left sinus remnants and secundum contributions. MigrationMap and Lineage wire the room and jump link.

Source decisions:
- `w10/1/p10/s1`, `/p9/s1`: fusion and descent are separate folding consequences. Stage 0 shows a prospective field as context, not already differentiated adult segments. The early layers view is selected while the later segment paths do not yet exist.
- `w10/1/p14/s1–s3`: jelly is extracellular matrix secreted by myocardium, between endocardium and myocardium; three cellular layers, not four. Corrected migrations flow `bihotz-geruzak`: endocardial cells migrating INTO jelly no longer labels the edge as if migration produced endocardium.
- `w10/2/p3/s3–s4`, `/p9/s1`, `/p18/s1`: day 21 segment differentiation, cranial-to-caudal fusion; day 23 start and day 28 end of looping. The diagram is a labelled topological curve, not measured anatomical geometry. Initial atria/sinus outside the pericardium in septum transversum is preserved in the cards (`w10/2/p8/s2`).
- `w10/3.1/p4/s2`, `/p5/s1`, `/p6/s1`, `3.2/p3/s1`: bulbus proximal → RV trabeculated; conus → both smooth infundibula; truncus → vessel roots; ventricular → LV trabeculated. Composite names distinguish the two conal contributions.
- `w10/3.3/p3/s2`: the left atrial derivative here is explicitly the INITIAL left atrium, not the whole adult smooth left wall. The full two-origin explanation is linked conceptually to topic 11, not misattributed to topic 10.
- `w10/3.4/p7/s2`, `/p13/s2`, `/p13/s7`, `/p11/s1`, `/p16/s3`, `/p17/s1`, `/p18/s1`: left horn survives as coronary sinus + oblique vein; right horn supplies RA smooth wall, atrial segment its trabeculated wall; left valve + spurium join secundum; upper right valve goes, lower right supplies two valves.
- Conflicting venous dates: `w10/3.4/p4/s5` assigns regressions around week 4, whereas detailed topic 13 shows the initial paired systems in week 5. Topic 10 does not assert those regression dates as a universal chronology; topic 13 owns the detailed venous calendar. Owner/teacher clarification remains useful.
- Oxygenation wording in `w10/1/p31–p33` is internally inconsistent after stating heart mixing. Room uses the explicit direction definition `/p26`, source inlet oxygenation `/p27–p29`, and mixing statement; no new physiology or unlabelled external correction added.

Verification: all ten source PDF pages rendered and viewed. Eight sections at 1440×900, 1024×768, 768×1024, all three diagram views across all six moments; screenshots `outputs/a10-*.png` in the shared deliverable folder. 184 browser assertions: 42 picks, 30 return links, 14 composition cards; reveals, SVG pick, colour/names modes, arrows, play stops, flip/grade and blocked storage passed. Initial interaction run exposed origin selections staying on the wrong diagram; fixed by rendering every view containing selected keys, matching the other rooms. TypeScript/ESLint and 50 focused tests passed before final visual adjustment; repeated in final validation. Full-suite log: work/full-topic10.log, result recorded in final audit. The 2D loop preserves segment sequence; accurate front/back depth remains for the 3D slot.

## 9 · Muskuluak

`muscles.ts:3` (records at 216, metadata at 568, views at 691): 24 source-linked records, 14 origin groups, 23 derivatives, five categorical views. No life arrays or pretend disappearance chronology. MUSCLE_FACTS supplies nerve, domain and view; the main test table reads from the same records. `MuscleDiagram.tsx:6` exports geometry and draws labelled classification icons, explicitly not anatomical positions. Origin selections spanning views reveal all relevant groups. `figures9.tsx:8` covers domain/innervation cross-section (interactive colour switch), roots versus primary rami, skeletal fusion versus intercalated discs, connective patterns, segmental versus plexus innervation and cardiac conduction. `cards9.ts:4`: 54 source-based cards (24 derivations, eight cranial innervation facts, 22 mechanisms). `Topic9.tsx:9` wires the slot. `tests/eratorriak-9.test.ts:7` pins the domain/ramus counterexample and complete cranial nerve series. MigrationMap and Lineage add room/jump link. No migration corrections required for topic 9.

Source decisions:
- `w9/2.1.1/p3/s2` preserves the inferior oblique omitted from the short table; `/p7/s2` includes mimics AND jaw depressors for somitomere 6. Source labels distinguish somitomere number, arch number and cranial nerve number.
- `w9/2.1/p5/s3–s6` explicitly warns against reading the table as one fibre type per nerve. The trigeminal table entry `w9/2.1.3/p17/s2` says motor only, but prose `/2.1/p5/s4` gives sensory/motor/autonomic. Prose wins. Hypoglossal is motor only per `/2.1.2/p7/s1`.
- The source assigns larynx to occipital 1–2/arches 4&6 and tongue to occipital 2–5 (`w9/2.1.2/p4/s1`, `/p6/s1`); retained as lecture vocabulary, not replaced with an outside account. Five initial pairs and early first-pair loss `/p3/s1` are separately explained.
- `w9/2.1.4/p4/s1` says cranial connective patterns come from neural crest; its next sentence `/s2` vaguely attributes “those” to somite mesoderm. Explicit cranial source and the specific body statement `/p5/s1` drive the matrix; no claim that neural crest makes skeletal muscle cells. Owner clarification of the dangling sentence remains open.
- `w9/2.2/p9/s4–s6` drives myotome/migration; `w9/2.2.1/p5/s1–s4` and `/p6/s1–s2` separate domains. `w9/2.2.2/p23–p24` separates motor rami: intercostals are primaxial yet hypaxial, independently pinned. The broad `/p15/s4` says both rami innervate both domains; the room teaches the explicit muscle-specific statements rather than inventing an abaxial deep-back example.
- Table-only named examples (e.g. latissimus dorsi) remain in a collapsed consultation list; notes explicitly say not all muscle names must be memorised (`w9/2.1.3/p7/s2`, `/2.2.1/p11/s1`). No names cut to fit.
- `w9/3/p8/s4` proposes parietal layer + neural crest for aortic/branch wall smooth muscle; `/p9/s1` then denies lateral mesoderm. The specific explanatory sentence is retained as the notes' proposal, scope limited to aorta/branches; inconsistency shown in a cited details block. It is not generalised to all vessels.
- `w9/4/p3/s3`, `/s6–s7`: cardiac cells attach, do not fuse. `/p5/s1–s7`: conduction nodes are specialised muscle, external autonomic innervation regulates them. Full SA→internodal→AV→His→Purkinje sequence appears in figure/cards.

Verification: 15 source PDF pages rendered/viewed. Eight sections at 1440×900, 1024×768 and 768×1024, all five categorical diagrams, six focused figures at all sizes (`outputs/a9-*.png` in deliverable folder). Dense table and full figures reviewed. 228 interaction assertions: 53 picks, 34 return links, 23 composition cards, table/answer reveals, SVG pick, keyboard tabs, colour/names, card grade/persistence and blocked storage. No play is offered for categories. 58 focused tests passed; tsc and ESLint passed after correcting a generated file's quote typo. Full-suite work/full-topic9.log result is in final audit. No 3D was added.

## 8 · Hezurrak

`content/eratorriak/bones.ts:3`: six named source groups, with occipital/cervical explicitly nested under paraxial mesoderm and notochord explicitly NOT a fourth bone-forming mesenchyme source. Fates at 35, 28 records at 155, mechanism/view metadata at 563, five categorical views at 678, separate four-phase RESEGMENT8 at 686, matrix at 700. Stable keys drive matrix, explorer, composition cards and card backs. RESEGMENT8 stores only temporal lives keyed back into those records; it never duplicates their adult/source metadata or treats the categorical view index as an age.

`BoneDiagram.tsx:6`: keyed classification geometry (vault, base, face, limbs, thorax, axis), explicitly captioned as a source map rather than anatomical bone outlines. `figures8.tsx:16`: eight focused figures: ossification routes, calvaria/fontanelles, chondrocranium central/lateral plates, arch cartilage versus surrounding mesenchyme, four-step resegmentation (33), six-step long-bone development (47), limb buds/digital rays/rotation, vertebral arch/body/canal. Fontanelle comparison table has its own hide/reveal mode. `cards8.ts:4`: 59 cards. `Topic8.tsx:9`: future 3D slot. `tests/eratorriak-8.test.ts:7`: contract, independent resegmentation/disc/occipital/Meckel pins. MigrationMap and Lineage expose the room.

Source decisions and migration corrections:
- Three bone mesenchyme sources `w8/1/p2/s1`, with anterior crest versus posterior paraxial boundary at the hypophyseal region (`w8/3.1.2/p10/s1`, `/p11/s1`). Both membranous and endochondral routes can arise from those sources; no fourth endoderm bone source was imported from the coloured figure's caption `/1/p16/s1`.
- Skull is modelled by PARTS: vault squamae membranous, base endochondral (`w8/3.1.1/p2/s2`, `/3.1.2/p2/s2`). Occipital base sources are three occipital somites + first cervical sclerotome (`w8/3.1.2/p5/s3`), acting through parachordal cartilage. Corrected `okzipital-oinaldea` migration to show that intermediate, instead of counting sclerotome and its cartilage as unrelated converging sources. Occipital composite has squama plus the two base source contributions. Temporal composite keeps squama separate from petrous/mastoid parts.
- `w8/3.2/p7/s1`, `/p13/s1`, `/p15/s1`: cartilage → incus/malleus/stapes. `/p9/s1`, `/p10/s1`, `/p14/s1`: surrounding mesenchyme → maxilla/zygoma/temporal squama/mandible. Mandible is NOT assigned to Meckel ossification. The source's Reichert sentence mentions both mandibular process and second-arch mesenchyme; record labels retain the explicit second-arch/Reichert path without inventing a first-arch stapes contribution.
- Styloid attribution is ambiguous: `w8/3.2/p11/s1` follows the temporal squama paragraph, not an explicit Reichert derivation. The old migration added Reichert→styloid and a hyoid branch not supported by the current prose. Those two asserted derivations were removed from that flow; both names remain in the room's source-ambiguity details. No external alternative was taught as lecture content.
- Limb heading says week 5 while `w8/4/p3/s1–s2` explicitly begins in week 4; prose wins. Similarly `/p7/s1` has “7. astea?” but `/p8/s1–s2` states week 8: diagrams use the explicit week-8 explanation. Migration `hezurtzapen-motak` now distinguishes initial week-8 central centres from centres in ALL long bones by week 12 (`/p12/s1`), rather than implying they first appear only at 12.
- A genuine cross-topic contradiction remains: `w8/4/p9/s2–s3`, `/p10/s3` gives postrotation upper flexors anterior/lower extensors anterior; `w9/2.1.3/p5/s3` states the reverse. Topic 8 teaches its explicit rotation account; topic 9 shows the conflicting sentence in a cited details block. Teacher clarification is open. No outside anatomy was silently substituted.
- The source equates “epifisi orria / metafisia / hazkuntza plaka” (`w8/4/p20/s1`); preserved as lecture vocabulary, with the figure identifying the cartilaginous growth plate. No new separate metaphysis derivative invented. Normal two plates versus one in phalanges is stated, without outside developmental timing.
- Resegmentation follows `w8/5.2.1/p3/s1–s5`; disc sources `/p7/s2–s4`. Notochord regresses in bodies, survives as nucleus at discs. Nerves leave at disc-level intervertebral foramina (`w8/5.3/p3/s2`); arteries become body-level (`w8/5.2.1/p12/s1–s2`). The local diagram changes those relative levels and keeps myotomes bridging vertebrae.
- Specific costal prose `w8/5.4/p4/s1–s4` and `/p5/s1–s5` assigns bone to migrated sclerotome, anterior cartilage directly to parietal layer, and sternum to fused parietal cartilages. It conflicts with general parenthesis `w8/1/p12/s1` and topic-9 recap `w9/2.2/p6/s5–s6`. Room and corrected `esklerotoma-saihetsak` flow follow the specific 5.4 account; conflicting recap is documented. The nerve/muscle room does not assert the costal-cell derivation.

Verification: all 12 source PDF pages rendered/viewed, dense cranial/resegmentation source figures enlarged. Eight sections at all three requested sizes, every categorical view, every focused figure, every four-step resegmentation and six-step long-bone phase. Initial CDP pass: 234 interaction assertions (52 picks, 45 returns, 20 compositions), plus 16 supplementary figure/keyboard/reveal/bounds assertions. 66 focused tests pass; full suite has 1828 passed, 28 known baseline failures, 6 skipped. No new failure file. Layout and final screenshots are described in the final audit below.


## Final audit and delivery

All six requested rooms are implemented. Flashcards: 7=47, 8=56, 9=54, 10=45, 11=59, 13=54: **315 total**, with topic-prefixed ids and per-browser per-topic storage. No mixed deck or separate printable PDF was necessary. Topic 14 and topics 1–6 remain outside scope.

Shared refinements: search indexes source, derivative, later remnant and synonyms; `PieceDiagram` accepts an optional view height for sparse categorical panels; dense figures use a minimum 480px grid column, becoming one wide column at tablet widths. This applies only to new-room CSS. The topic-12 source, CSS and 3D implementation are unchanged; its adapter retains progress and keyboard behaviour. Files under components/scenes, lib/three-d and Arch3D.tsx have no task diff.

Final automated results:

|Checkpoint|Full-suite pass|Fail|Skipped|Files|
|---|---:|---:|---:|---:|
|13|1785|28|6|53|
|7|1795|28|6|55|
|11|1803|28|6|56|
|10|1812|28|6|57|
|9|1820|28|6|58|
|8 / all rooms|1828|28|6|59|

The same 28 failures are 3 in notes.test.ts and 25 in klasea.test.ts, reproduced before new rooms on an untouched HEAD archive. These are pre-existing note/class extraction alignment failures, not weakened or edited tests. Final TypeScript, scoped ESLint, all **66 focused tests / 9 files**, and diff whitespace check passed. Full suite was run once per topic; later purely visual width/colour and formatting adjustments were covered by the final targeted/type/lint pass.

Browser interactions: initial topic passes total **1283 assertions** (13=263, 7=139, 11=235, 10=184, 9=228, 8=234). Supplementary checks add **50**: all test cells reveal, Space flip, keys 1/2 grades, focus-driven change selection, topic-7 descent toggle, topic-8 local sequence buttons, topic-9 innervation recolour, and in-bounds SVG text. Total **1333 browser assertions**. Counts describe assertions, not independent unit tests.

Visual evidence: all eight sections in all six rooms at **1440×900, 1024×768 and 768×1024**; no horizontal page overflow in all 18 final viewports. Dense diagrams and source figures were inspected at enlarged size. Every final focused figure was recaptured after widening the grid. The initial section/interaction/animation evidence uses headless Chrome CDP. That browser/server session ended during repeated final captures; final static section/figure captures were completed with the connected Playwright browser (animations disabled, bounded screenshots). A CSS preload warning for existing structure-atlas CSS appears in the dev browser; final navigation had no room runtime errors. Topic-12 dynamic 3D pixels were not treated as a deterministic assertion. Cropped final figure/table captures temporarily hide fixed/sticky navigation and floating help in the screenshot browser only, keeping labels unobscured; regular section screenshots keep the actual UI. Adding the temporary data-qa-floating attribute before Kimu hydrated caused a screenshot-instrumentation-only hydration warning; a fresh six-topic navigation/interaction pass without that mutation returned zero console errors. No product hydration fix was needed.

Authoritative final images: `aN-W-{mapa,denbora,taula,helduak,desagertu,irudiak,nahasketak,fitxak}.png`; focused figures `aN-W-final-figure-I.png`; diagrams `aN-W-diagram-*.png`; topic-8 local phases `a8-W-sequence-A-S.png`; topic-9 recolour `a9-W-innervation.png`. Earlier `figure-I` captures are intermediate layout evidence; use **final-figure** for the final larger layout. All are under `C:/Users/aitor/Documents/Codex/2026-10-30/files-pasted-by-the-user-prompt/outputs/`; the generated captures.html index selects the final evidence.

Remaining limits/questions: no 3D implementation or production build/deployment; content audited against the supplied lecture notes. The source contradictions listed per topic remain visible and available for teacher clarification. The venous periduodenal diagram is a simplified route, not every mesh loop. The cardiac loop and categorical muscle/bone icons are explicit topology/classification schemas, not anatomical reconstructions. Work was performed and self-reviewed in the main session, with no subagents, commits, pushes, stashes or unrelated-file cleanup.

Next session starts with `docs/handover/eratorriak-3d-briefs.md` and its stable piece keys/slot state. Do not overwrite the other session's untracked prompt, .playwright-mcp, scratch class scripts or Python cache. Next dev generated AGENTS.md/next-env.d.ts edits are not implementation paths to stage.


## Implementation path inventory

All paths below are relative to `C:/Users/aitor/Downloads/1 MEDICINA`. Line 1 is the entry point unless a more precise definition is listed above.

- `components/shell/eratorriak/BoneDiagram.tsx:1` — room, source data, wiring, audit or tests described above.
- `components/shell/eratorriak/CavityDiagram.tsx:1` — room, source data, wiring, audit or tests described above.
- `components/shell/eratorriak/figures10.tsx:1` — room, source data, wiring, audit or tests described above.
- `components/shell/eratorriak/figures11.tsx:1` — room, source data, wiring, audit or tests described above.
- `components/shell/eratorriak/figures13.tsx:1` — room, source data, wiring, audit or tests described above.
- `components/shell/eratorriak/figures7.tsx:1` — room, source data, wiring, audit or tests described above.
- `components/shell/eratorriak/figures8.tsx:1` — room, source data, wiring, audit or tests described above.
- `components/shell/eratorriak/figures9.tsx:1` — room, source data, wiring, audit or tests described above.
- `components/shell/eratorriak/Flashcards.tsx:1` — room, source data, wiring, audit or tests described above.
- `components/shell/eratorriak/HeartTubeDiagram.tsx:1` — room, source data, wiring, audit or tests described above.
- `components/shell/eratorriak/kit/Flashcards.tsx:1` — shared component / styles.
- `components/shell/eratorriak/kit/MomentBar.tsx:1` — shared component / styles.
- `components/shell/eratorriak/kit/PieceDiagram.tsx:1` — shared component / styles.
- `components/shell/eratorriak/kit/study.module.css:1` — shared component / styles.
- `components/shell/eratorriak/kit/StudyRoom.tsx:1` — shared component / styles.
- `components/shell/eratorriak/kit/TestTable.tsx:1` — shared component / styles.
- `components/shell/eratorriak/kit/TimelineLayout.tsx:1` — shared component / styles.
- `components/shell/eratorriak/MuscleDiagram.tsx:1` — room, source data, wiring, audit or tests described above.
- `components/shell/eratorriak/SeptaDiagram.tsx:1` — room, source data, wiring, audit or tests described above.
- `components/shell/eratorriak/Topic10.tsx:1` — room, source data, wiring, audit or tests described above.
- `components/shell/eratorriak/Topic11.tsx:1` — room, source data, wiring, audit or tests described above.
- `components/shell/eratorriak/Topic13.tsx:1` — room, source data, wiring, audit or tests described above.
- `components/shell/eratorriak/Topic7.tsx:1` — room, source data, wiring, audit or tests described above.
- `components/shell/eratorriak/Topic8.tsx:1` — room, source data, wiring, audit or tests described above.
- `components/shell/eratorriak/Topic9.tsx:1` — room, source data, wiring, audit or tests described above.
- `components/shell/eratorriak/VeinDiagram.tsx:1` — room, source data, wiring, audit or tests described above.
- `components/shell/Lineage.tsx:1` — room, source data, wiring, audit or tests described above.
- `components/shell/MigrationMap.tsx:1` — room, source data, wiring, audit or tests described above.
- `content/eratorriak/bones.ts:1` — room, source data, wiring, audit or tests described above.
- `content/eratorriak/cards10.ts:1` — room, source data, wiring, audit or tests described above.
- `content/eratorriak/cards11.ts:1` — room, source data, wiring, audit or tests described above.
- `content/eratorriak/cards13.ts:1` — room, source data, wiring, audit or tests described above.
- `content/eratorriak/cards7.ts:1` — room, source data, wiring, audit or tests described above.
- `content/eratorriak/cards8.ts:1` — room, source data, wiring, audit or tests described above.
- `content/eratorriak/cards9.ts:1` — room, source data, wiring, audit or tests described above.
- `content/eratorriak/cavities.ts:1` — room, source data, wiring, audit or tests described above.
- `content/eratorriak/flashcard-store.ts:1` — room, source data, wiring, audit or tests described above.
- `content/eratorriak/heart-tube.ts:1` — room, source data, wiring, audit or tests described above.
- `content/eratorriak/model.ts:1` — room, source data, wiring, audit or tests described above.
- `content/eratorriak/muscles.ts:1` — room, source data, wiring, audit or tests described above.
- `content/eratorriak/septa.ts:1` — room, source data, wiring, audit or tests described above.
- `content/eratorriak/veins.ts:1` — room, source data, wiring, audit or tests described above.
- `content/migrations.ts:1` — room, source data, wiring, audit or tests described above.
- `docs/handover/eratorriak-3d-briefs.md:1` — room, source data, wiring, audit or tests described above.
- `docs/handover/eratorriak-rooms.md:1` — room, source data, wiring, audit or tests described above.
- `tests/eratorriak-10.test.ts:1` — room, source data, wiring, audit or tests described above.
- `tests/eratorriak-11.test.ts:1` — room, source data, wiring, audit or tests described above.
- `tests/eratorriak-13.test.ts:1` — room, source data, wiring, audit or tests described above.
- `tests/eratorriak-7.test.ts:1` — room, source data, wiring, audit or tests described above.
- `tests/eratorriak-8.test.ts:1` — room, source data, wiring, audit or tests described above.
- `tests/eratorriak-9.test.ts:1` — room, source data, wiring, audit or tests described above.
- `tests/eratorriak-contract.ts:1` — room, source data, wiring, audit or tests described above.
- `tests/eratorriak-kit.test.ts:1` — room, source data, wiring, audit or tests described above.
