# Topic 14 plan: "14. GAIA: DIGESTIO APARATUA" (parts 1 and 2)

> **State on 2026-10-31 (read first).** Part 2 (`14.GAIA_DIGESTIO APARATUA 2.Atala (Zuzenduta).docx.pdf`) arrived;
> both PDFs are extracted into one `w14.ts` (215 blocks, 391 sentences, 37,344 chars, sha `295fb1d6…`; part 2's
> block numbers continue after part 1's TOC). Batch 1 is built: stages 1–5 (`components/scenes/week14/`:
> `Fold3D.tsx` stage 1, `Early3D.tsx` stages 2–5 on `gut3d.ts` + `common.tsx`), `week14.ts`,
> `week14-structures.ts`, all registration, `NOTES[14]`, notes tests; visibility tests green for topic 14.
> **The Kimu class is deferred** (owner, 2026-10-31: "not necessary for now"); do stages, 3D and the notes first.
>
> **2026-11-01: stages 6–16 built** (batches 2–3, part 1 complete). One trunk model `foregut-model.ts` (`foreModel`,
> pose fields thorax…veil, opts dim/liverGlass/topCut/clear/diaphragm) posed per step by `Foregut3D.tsx`
> (`spec6`…`spec16`, each starting from the previous `endPose`; stages 12, 14, 15 rewind fields to replay a
> process). `NOTES[14]` 3.1–3.6 mapped; exceptions `14/hestegorria/0` (§3) and `14/duodenoa/0` (§3.2 p15); beat
> count 962. Topic 14 visibility tests green; notes/Kimu tests have only the old baseline failures (topic 7 anchor,
> figure parity 7–9). Notes-wording traps flagged in the app: 3.2 "bena korda" vs 3.4 "zain porta"; 3.6 p3 "gibelak
> egiten duen biraketagatik" vs p7 duodenum's rotation (stage `area` caution). Screenshot pass on 11–16 in progress.
> Next: tablet shots, then part 2 (17–26, §4b) and the summary table.
>
> **2026-11-01 (later): part 2 built, stages 17–26 (all notes sections now have stages).** Models:
> `midgut-model.ts` (`midModel`: straight midgut → primary loop about the SMA axis ROOT→UMB, herniation into the
> cord, 270° counter-clockwise rotation, staggered return via `returnOrder` (jejunum first, caecum last), caecal
> descent, hindgut, peritoneal fusion veils, SMA/IMA/coeliac, rectal arteries, PLACE recolouring for the summary),
> `cloaca-model.ts` (urorectal septum, sinus/anorectal canal, proctodeum, membranes, perineum), `lung-model.ts`
> (`treeModel` bud → primary → 3+2 lobar → segmental → 4 more generations, C rings, lobes fitted round the
> full-grown branches; `acinusModel` terminal/respiratory bronchioles, sacs, capillaries, pneumocytes, surfactant,
> fluid). Specs: `Midgut3D.tsx` (spec17–21, 23, 24), `Cloaca3D.tsx` (spec22), `Lung3D.tsx` (spec25, 26). Stages
> cite the part-2 file via `src2`. `NOTES[14]`: 4, 4.1, 4.2, 4.4 (the notes have no 4.3), 5 (two stages), 5.1,
> `n:'6'` summary (exception `14/eratorrien-kokapena` → `laburpena`), `n:'0'` "Arnas aparatua" (exceptions
> `14/arnas-zuhaitza`, `14/albeoloak` → `arnas`). Beat count 1011. Topic-14 visibility 78/78 green. Traps flagged:
> descending colon "kanpokoa" (§5) vs "atzekoa" (summary); arnas p4 s2 calls the week-16 bronchi "arnas
> bronkioloak" (they are terminal). `zilbor-hestea` is the existing structure `zilborrestea`. Still open: tablet
> shots 768/1024 of 17–26; `inPreparation: true` still set on the week (home card says "Prestatzen"); week quiz empty.

Source: `C:\Users\aitor\Downloads\14.GAIA_DIGESTIO APARATUA 1.ATALA (Zuzenduta).pdf` (12 pages, a Google Docs
export). The owner's bar: this topic is the culmination of every topic so far: the strengths of each, none of
their defects, 3D wherever it teaches better, and a student who has finished it understands every line of the notes.

Work in the main session; no subagents unless the owner asks in that session (`memory/no-agents.md`). Nothing is
committed until the owner asks. Read every memory file first; `topic10-working-lessons` is the checklist to run
*while* building, not after.

---

## 0. Already done

- `scripts/notes/extract.py` lists the topic 14 PDF. Week 14 joins 11–13 in the "indented wrap text is body, not
  caption" rule; two week-14-only rules: an all-italic ≤ 11.2 pt short line is a caption (the p1 caption sits at body
  indent), and a list item never continues across a page break into the next page's paragraph (3.6: "Arearen atzeko
  hastapena→ …" / "Duodenoak eskubitara …").
- `content/notes-text/w14.ts` generated: 120 blocks, 234 sentences, 22,245 characters, PDF differences = 0; the
  manifest has the week 14 entry (sha `e12a0b16…`). Weeks 1–13 are byte-identical; `--check` passes.
- Still to wire: `content/notes-text/index.ts` (`14: w14`), `content/notes.ts` (`NOTES[14]`),
  `tests/notes.test.ts` (length 22245 + sha + beat counts).
- Known extraction choices, left as they are: the underlined sub-headings "ATZEKO MESOGASTRIOA" and "AURREKO
  MESOGASTRIOA" open their paragraphs (`w14/3.2/p11`, `p14`); "Aurreko hestea" (`w14/2.1/p7`) is a one-line block.

## 1. Scope: this PDF is part 1 of 2

The table of contents lists sections 1–6, but this PDF ("1. ATALA") stops after **3.6 (pancreas)**. Sections
4 (midgut, physiological hernia), 5 (hindgut) and 6 (their derivatives) will come in part 2.

Decision to confirm with the owner: **part 2 extends topic 14** (same week, same 3D gut model, stages appended,
the class gets more chunks), rather than becoming topic 15. Everything below is built so part 2 slots in: the gut
model already carries the midgut and hindgut as context, and the 3.2 asterisk on the 270° herniation is shown as a
forward pointer ("2. atalean ikusiko dugu"), never built out now.

## 2. What the notes say, section by section (and their traps)

1. **Sarrera.** The two folds (transverse and sagittal) bring the endoderm and the main part of the yolk sac inside;
   the gut runs cranial → caudal; the digestive system appears with the cephalocaudal fold. Figure p1 A–C
   (transverse folding: amniotic cavity, surface ectoderm, splanchnic mesoderm, yolk sac, vitelline duct,
   intra-embryonic cavity, gut, dorsal mesentery).
2. **2.1 Parts.** First from the oropharyngeal to the cloacal membrane, three parts: foregut (from the
   buccopharyngeal membrane, "from the respiratory start to the liver bud"), midgut (open to the yolk sac by the
   vitelline/omphalomesenteric duct, wide then narrow), hindgut (cloacal membrane, the allantois enters it).
   Week 4: an endodermal evagination of the foregut's *anterior* wall = the respiratory diverticulum; proximal
   (laryngotracheal tube) → larynx and trachea, distal → two lung buds. From then on, **four** parts: pharyngeal
   gut (to the respiratory bud; pharyngeal pouches from its side walls), foregut (respiratory bud → liver bud),
   midgut (liver bud → junction of the proximal 2/3 and distal 1/3 of the transverse colon), hindgut (that
   junction → cloacal membrane). Figure p2 A–D (sagittal).
   - **Trap:** the three-part list says the foregut starts at the buccopharyngeal membrane; the four-part list
     moves its start to the respiratory bud. Show both in order and say why the start moves.
3. **2.2 Circulation.** Coeliac trunk → all foregut derivatives (abdominal level); SMA → midgut; IMA → hindgut.
   Figure p3 B (sagittal, regions labelled).
4. **2.3 Mesentery.** The intra-embryonic coelom below the diaphragm = peritoneal cavity. All parts wrapped in
   visceral peritoneum (the visceral layer of lateral mesoderm), tied to the posterior wall's peritoneum by a
   **two-layer** dorsal link = the mesentery, named per organ. All start intraperitoneal; retroperitoneal
   kidneys, aorta and IVC lie behind the posterior parietal peritoneum. From **week 5** the thoracic mesentery
   disappears; the abdominal one stays. The stomach also has a **ventral** meso from the septum transversum
   mesoderm: the ventral mesogastrium, tying it to the anterior abdominal wall. Figure p3 bottom (sagittal:
   bare area, lesser omentum, dorsal mesogastrium, falciform, coeliac, mesoduodenum, SMA, mesentery, IMA,
   dorsal mesocolon, vitelline duct, allantois, cloaca, umbilical artery).
5. **3 Foregut derivatives:** oesophagus → stomach → initial duodenum → liver → pancreas.
6. **3.1 Oesophagus.** The respiratory bud is ventral; the dorsal part is the oesophagus. Short, then much longer
   because the heart descends and the lungs grow; it descends through the diaphragm into the abdomen and continues
   as the stomach. Endodermal lining; muscle from the surrounding mesenchyme: **upper two thirds striated**,
   vagus (10th cranial nerve) motor fibres; **lower third smooth**, from the visceral layer of the lateral mesoderm,
   autonomic (sympathetic + parasympathetic). Figures p4 A–C (tracheoesophageal ridge/septum, lung buds) and D
   (larynx from the floor of the pharynx).
7. **3.2 Stomach.** A dilation of the foregut that makes two rotations:
   - **90° to the right about a longitudinal axis:** the original posterior wall ends on the left, the anterior
     wall on the right. The left wall grows much more → **greater curvature**; the right wall → **lesser curvature**.
   - **About an anteroposterior axis:** the cranial end (cardia) moves down and left, the caudal end (pylorus) up
     and right. The long axis ends oblique: top-left → bottom-right.
   - The asterisk: the herniated intestinal loops turn 90°, then 180° more on returning, 270° in all (part 2:
     forward pointer only).
   - Intraperitoneal; the **dorsal mesogastrium** (two layers) swings **left** with the first rotation, so a recess
     of the peritoneal cavity appears behind the stomach: the **omental bursa** (lesser sac). Its downward
     extension lies between the anterior and posterior layers of the greater omentum and disappears when the
     layers fuse with each other and with the transverse colon's peritoneum and meso. Figure p5 A/B
     (transverse sections) and the "IKUSI IRUDIA" box (italic, p6) describing that section.
   - **Dorsal mesogastrium:** the **spleen** develops between its two layers (intraperitoneal). Two ligaments:
     **gastrosplenic** (stomach ↔ spleen) and **splenorenal** (spleen ↔ posterior wall; "between spleen and
     pancreas", very short). The AP rotation makes it grow down in front of the transverse colon and small
     intestine: the **greater omentum** (fatty apron).
   - **Ventral mesogastrium** (from the lesser curvature, septum transversum mesoderm, which also gives the
     diaphragm and liver): **lesser omentum** (stomach ↔ liver; gastrohepatic + hepatoduodenal), the omental
     bursa behind it, a free right edge with the **epiploic foramen (Winslow)** behind it; the edge carries what
     enters and leaves the liver; and the **falciform ligament** (liver ↔ anterior wall). Figures p7 A/B
     (sagittal), p8 (adult photo + transverse section), p9 (section and lateral).
   - **Trap:** 3.2 p14 says the free edge carries the hepatic artery and "bena korda"; 3.4 says hepatic artery and
     **portal vein** (zain porta), plus the common bile duct. Draw the portal vein and say so in that beat.
8. **3.3 Duodenum.** Small intestine = duodenum, jejunum, ileum. **Double origin**: the 1st part and the proximal
   2nd part from the distal foregut; the distal 2nd, 3rd and 4th from the proximal midgut → arteries from the
   coeliac trunk **and** the SMA. Four parts: 1st horizontal to the right (bulb, intraperitoneal), 2nd descending,
   3rd horizontal to the left, 4th ascending to the left of L3, then the jejunum. Dorsal mesoduodenum; the
   duodenum's rotation to the right fuses it with the posterior wall → retroperitoneal except the bulb. The
   jejunum is intraperitoneal again.
9. **3.4 Liver.** Intraperitoneal, right upper quadrant (right hypochondrium). An endodermal evagination of the
   distal foregut = the liver bud; it grows and branches into the septum transversum mesoderm (between thorax and
   abdomen); joined to the gut by the **hepatic duct**, later the **common bile duct** when the cystic duct joins.
   Endoderm → hepatocytes. Septum transversum mesoderm → haematopoietic cells, capsule cells, reticuloendothelial
   cells, Kupffer cells; also the liver's visceral peritoneum and its ligaments: **falciform** (liver ↔ diaphragm /
   anterior wall; the **round ligament** from the umbilical vein in its free lower edge), **lesser omentum** (the
   mesoderm between stomach and liver thins out), **bare area** on the upper posterior face between the two
   **coronary ligaments** (liver ↔ the peritoneum under the diaphragm). Lesser omentum = gastrohepatic (left) +
   hepatoduodenal (right); the omental bursa behind; Winslow in the right free edge (hepatic artery, portal vein,
   common bile duct). Figures p8 bottom, p9 top, p10 (photo, lateral).
10. **3.5 Gallbladder.** A second bud from the liver bud's proximal part (the common bile duct) → the gallbladder;
    its **cystic duct** joins the **hepatic duct** → the **common bile duct**, opening into the duodenum's 2nd part.
    Figures p10 A/B (sagittal) and A/B (bile ducts with the two pancreatic buds: ventral **blue**, dorsal **red**).
11. **3.6 Pancreas.** The last foregut derivative; ends retroperitoneal. Two buds: **ventral** (from the liver bud's
    proximal part, the start of the common bile duct) and **dorsal** (from the posterior wall of the foregut,
    behind the duodenum). With the duodenum's rotation to the right the ventral bud moves back and fuses with the
    dorsal one, low and posterior. Head (right), body, tail. Ventral bud → lower head = uncinate process / "area
    txikia"; and the hook from it ("arearen gakoa"). Dorsal bud → upper head, body, tail. Exocrine (pancreatic
    juice) and endocrine (islets of Langerhans: α glucagon, β insulin, somatostatin cells; hormones straight into
    the blood; blood glucose). Ducts: the dorsal duct's distal part fuses with the ventral duct → **main duct
    (Wirsung)**, opening with the common bile duct on the **major papilla** in the 2nd part; the **accessory duct
    (Santorini)** from the dorsal duct's proximal part, shorter, not always present. The tail sometimes lies
    between the splenorenal ligament's two layers. Figure p12 A/B (major/minor papilla, both ducts).
    - **Trap:** 3.6 p3 says the pancreas becomes retroperitoneal "because of the **liver's** rotation"; 3.6 p6–p7
      and p18 say the **duodenum's** rotation. Animate the duodenum's rotation and say plainly in that beat that
      one sentence says "gibelak".
    - **Trap:** the notes spell the uncinate process two ways ("apofisi untziformea", "apofisi funtziformea").
      Use the notes' first spelling as the name and list the other as `aka`.

Notes figures to match (figure parity: each at the step where the notes print it, with the notes' names):
p1 transverse folding A–C · p2 sagittal A–D · p3 sagittal B (regions) · p3 bottom sagittal (mesenteries +
arteries) · p4 A–C oesophagus/trachea, D larynx, stomach rotation A–E · p5 transverse A/B (bursa) · p7 A/B
sagittal (greater omentum) and A/B (duodenum, colon) · p8 photo (lesser omentum, Winslow) and transverse section ·
p9 transverse + lateral · p10 photo, lateral B, sagittal A/B, bile and pancreatic buds A/B · p12 pancreatic ducts A/B.

## 3. Design: what "the culmination" means here

Every rule below comes from a memory or a past topic's lesson; the source is in brackets.

**One posed 3D gut model** `components/scenes/week14/gut3d.ts` (the topic 12/13 pattern: one model, posed per
stage; `arteries3d.ts`, `veins3d.ts`) [topic 12–13 lessons].
- Axes as in topics 10–13: x = the embryo's **left**, y = cranial, z = ventral. Stated in the file header. Seen from
  the front, the embryo's left is on the viewer's right. Check every sided structure and the camera pad on a
  front-view shot before moving on [lesson 1].
- The gut is a centreline + radius profile with named stations (oropharyngeal membrane, respiratory bud, liver
  bud, stomach, duodenum, vitelline duct, 2/3–1/3 colon junction, cloacal membrane). Pose parameters drive it:
  `fold`, `respBud`, `oesoLen`, `stomachDil`, `rotL` (0–90°), `rotAP`, `duodLoop`, `duodRot`, `liver`, `gall`,
  `pancV`, `pancD`, `pancFuse`, `spleen`, `omentum`, `fuseMeso`.
- **Mesenteries are sheets attached to the gut and the walls**, built from the same centreline: the dorsal
  mesentery/mesogastrium/mesoduodenum from the posterior-wall root to the gut, the ventral mesogastrium from the
  lesser curvature to the anterior wall through the liver. Because they hang from the gut, the stomach's rotation
  *drags* the dorsal mesogastrium to the left and the **omental bursa appears by itself**: the student sees why,
  not just that. Two layers drawn as two close sheets with the visceral-peritoneum colour.
- Walls stay walls: the parietal peritoneum as a translucent lining of the body cavity, the posterior wall with
  aorta, IVC and kidneys behind it (retroperitoneal), the diaphragm/septum transversum above.
- The rotations are the signature moment. Paint the stomach's **original posterior wall** and **original anterior
  wall** in two tints from the start, so "the posterior wall ends on the left" is literally visible, and the left
  wall's extra growth into the greater curvature reads as the painted wall stretching. Show each rotation axis as
  a drawn rod only while its rotation runs (it is content, not a pointer) [no-drawn-pointers: glow the thing].
- The duodenum's C-loop rotates right and its mesoduodenum **visibly fuses** with the posterior wall (the sheet
  flattens and changes to the parietal colour), leaving the bulb free; the pancreas follows into the wall.
- Reuse, don't redraw: topic 12's coeliac trunk / SMA / IMA shapes and colours (`arteries3d.ts`), topic 13's liver,
  septum transversum, duodenum, spleen and portal vein (`veins3d.ts` LIVER_DONE), topic 7's peritoneum colours and
  septum transversum, topic 4's folding, the shared week-5 embryo body (`embryo5.ts`) for any whole embryo
  [consistent-style, one-lateral-embryo].

**Live cross-section, synced with the 3D** (the new step forward) [each-topic-step-forward, prefer-3d].
- The notes explain the bursa, the ligaments and Winslow with **transverse sections** (p5, p8, p9) and students
  get lost exactly there [topic7-hardest: body cavities]. So: a glassy cut plane in the 3D at the notes' level, and
  beside it a 2D section **computed from the same pose** (tube centres and radii → organ outlines; sheet
  attachment points → the mesentery lines; the bursa as the space they close). As the stomach turns in 3D, the
  section redraws in step. The section uses topic 7's transverse-section style (`week7/Peritoneum.tsx`: dorsal up,
  the viewer's left = the embryo's right, as the notes' figures) so it looks like the notes' figure.
- If a true slice of the mesh is too costly, compute the section analytically from the model's own primitives;
  never hand-draw a second geometry that can drift from the 3D.
- Dual views obey the visibility contract: a name lit in one is lit in the other.

**Colour = origin, carried through the topic** (the topic 12/13 colour lesson), with one key per stage:
- endoderm (gut lining, liver bud, gallbladder, pancreatic buds) = topic 10's `T.endo` yellow family;
- splanchnic mesoderm / visceral layer (gut muscle, smooth third of the oesophagus) = `T.lateral` rose;
- septum transversum mesoderm (ventral mesogastrium, liver capsule, falciform, lesser omentum, coronary
  ligaments) = topic 7's septum transversum colour;
- peritoneum: visceral and parietal as topic 7 (the notes' figures draw it orange-red);
- regions: foregut / midgut / hindgut bands that match the coeliac / SMA / IMA colours of topic 12;
- the pancreatic buds as the notes draw them: **ventral blue, dorsal red**.

**Context organs semi-realistic, never abstract stand-ins** [keep-some-realism, high-end-3d]: the liver lobes, the
spleen, the kidneys, the heart descending and lungs growing (oesophagus stage), the diaphragm. Strong contrast.

**Every verb happens on screen** [narrated-actions-shown]: tolestu (fold), ebaginatu (bud out), luzatu (lengthen),
jaitsi (descend), biratu (rotate, twice), hazi (grow: greater curvature), abiatu ezkerrera (the mesogastrium
swings), luzatu beherantz (the omentum descends), fusionatu (the omentum layers; the mesoduodenum to the wall; the
pancreatic buds; the ducts), argaldu (the ventral mesogastrium thins), adarkatu (the liver bud branches), desagertu
(the thoracic mesentery from week 5). Each happens *while* its beat says it; small actions get a zoom or a synced
close-up [narration-zoom-reveal].

**Never get lost** [never-get-lost, 3d-arrows-follow-camera]: one continuity key (`digestioa-14`) so every stage
change glides; named-side edge pills; a turn over ~120° announced in the text; DirArrows and names true while
turning. The section inset keeps its own orientation key ("bizkarra goian").

**Visibility contract** [visibility-guard, anchor-inside, anchor-occlusion-audit]: whatever a step names is drawn
and named for the whole beat; lit = only that; spaces (omental bursa, Winslow, peritoneal cavity) get a drawn
body; composites (duodenum's four parts, lesser omentum's two ligaments, pancreas head/body/tail) use
`parts`/`spans`; dots well inside their structure, cameras turned rather than anchors moved.

**Names** [keep-all-labels, label-zones-design-first, consistent-style]: progressive appearance via callouts, all
names by stage end, short near-horizontal leaders in edge columns, text above lines, zones designed before
building.

**Learning layers on every beat:** `idea`, `key`, `exam` (FUNTSEZKOA, worded from the notes), `recall` (topic 4
folding and gut parts; topic 7 coelom, septum transversum, peritoneum types, diaphragm; topic 12 coeliac/SMA/IMA;
topic 13 periduodenal plexus → portal vein, umbilical vein → round ligament, spleen), `caution` for every trap in
§2, an `ask` on a mechanism/why angle (never like a past exam: check `content/generate.ts` `LEFT_OUT`), `tour` +
`tourAt` when a stage introduces several parts, `more` where useful. **100 % notes-sentence coverage** within each
stage's own section [notes-figure-parity, notes-prose-wins].

**Summary table built live**: foregut derivative | origin (endoderm + what mesoderm) | peritoneum (intra / retro) |
artery. It is the topic's natural table and the class board table.

## 4. Stage plan (notes order)

| # | stage id | notes | what the student sees |
|---|---|---|---|
| 1 | `sarrera` | 1 | transverse folding in 3D (a disc slab rolling the endoderm into a tube, the yolk sac pinched off), synced with the p1 A–C section; then the sagittal fold closes the tube cranial → caudal |
| 2 | `heste-atalak` | 2.1 p3–p6 | the gut tube in the lateral embryo, oropharyngeal → cloacal membrane; foregut, midgut (vitelline duct wide → narrow), hindgut (allantois) lit in turn; figure p2 A–D |
| 3 | `arnas-hastapena` | 2.1 p7–p15 | week 4: the ventral foregut wall buds the respiratory diverticulum, laryngotracheal tube → larynx/trachea, two lung buds; the four parts with their new borders (pharyngeal pouches; 2/3–1/3 transverse colon); the boundary trap |
| 4 | `zirkulazioa` | 2.2 | coeliac / SMA / IMA from topic 12's aorta, each region tinted by its artery; figure p3 B |
| 5 | `mesenterioa` | 2.3 | coelom below the diaphragm = peritoneal cavity; visceral peritoneum wraps each part; the two-layer dorsal mesentery and its names; retroperitoneal kidneys/aorta/IVC; week 5 the thoracic part fades; the ventral mesogastrium from the septum transversum; figure p3 bottom |
| 6 | `hestegorria` | 3, 3.1 | the derivatives list; the oesophagus behind the trachea, lengthening as the heart descends and the lungs grow, through the diaphragm; muscle thirds coloured by origin with the vagus vs autonomic nerves; figures p4 A–D |
| 7 | `urdail-biraketak` | 3.2 p3–p6 | the dilation; rotation 1 (90° right, painted walls; greater/lesser curvature grow); rotation 2 (cardia down-left, pylorus up-right); the 270° asterisk as a part-2 pointer; figure p4 A–E |
| 8 | `poltsa-omentala` | 3.2 p7–p10 | the oblique axis; the dorsal mesogastrium dragged left, the omental bursa opening behind the stomach, in 3D and in the live section (p5 A/B); the inferior recess and its later fusion |
| 9 | `atzeko-mesogastrioa` | 3.2 p11–p13 | the spleen budding between the two layers; gastrosplenic and splenorenal ligaments; the greater omentum growing down in front of colon and small intestine |
| 10 | `aurreko-mesogastrioa` | 3.2 p14–p15 | lesser omentum, its free edge and Winslow (the "bena korda" trap), the falciform ligament; figures p7 A/B |
| 11 | `duodenoa` | 3.3 | the four parts toured; double origin (foregut/midgut border on the 2nd part) and double arteries; the right rotation and the mesoduodenum fusing → retroperitoneal except the bulb; jejunum intraperitoneal again |
| 12 | `gibela` | 3.4 p3–p10 | the liver bud branching into the septum transversum, the hepatic duct; hepatocytes vs the four septum-transversum cell types (a cell close-up); recall topic 13's sinusoids |
| 13 | `gibel-lotailuak` | 3.4 p11–p15 | falciform with the round ligament in its free edge (topic 13 recall), lesser omentum by thinning, bare area between the coronary ligaments, Winslow's free edge contents; photo-matched view (p8/p10) |
| 14 | `behazun-xixkua` | 3.5 | the gallbladder bud, cystic + hepatic duct → common bile duct into the 2nd part; figure p10 |
| 15 | `area` | 3.6 p3–p9 | ventral (blue) and dorsal (red) buds, the duodenum's rotation carrying the ventral bud behind to fuse (the "gibelak" trap), head/body/tail and the uncinate process; figure p10–p11 |
| 16 | `area-hodiak` | 3.6 p10–p18 | exocrine vs endocrine (islet close-up: α, β, somatostatin cells), Wirsung + common bile duct on the major papilla, Santorini; retroperitoneal, tail in the splenorenal ligament; the live summary table; figure p12 A/B |

`NOTES[14]` lists each section with its stages; a stage cites only its own section's sentences or has a
`NOTES_EXCEPTIONS` entry.

## 4b. Part 2 stages (sections 4, 4.1–4.4, 5, 5.1, the summary, the respiratory system)

| # | stage id | notes | what the student sees |
|---|---|---|---|
| 17 | `bitarteko-hestea` | 4 | the midgut's extent and derivatives (from the 2nd part of the duodenum to the transverse colon's 2/3), SMA axis, the vitelline duct at the ileum |
| 18 | `heste-lakioa` | 4.1 | the primary loop: cephalic and caudal limbs, SMA as the axis, the vitelline duct at the apex; the 270° counter-clockwise rotation seen from the front (about +z) |
| 19 | `hernia-fisiologikoa` | 4.2 (+ 4.3 content in it) | week 6 herniation into the cord; ~week 12 return: jejunum first, upper left (left of L2); caecal bud last, upper right under the liver, then down to the right iliac fossa; ascending colon, hepatic flexure; the "Beraz, hemen dituzue…" summary |
| 20 | `peritoneo-egiturak` | 4.4 | which mesenteries persist / fuse (mesentery proper, transverse mesocolon, ascending/descending colon retroperitoneal) |
| 21 | `atzeko-hestea` | 5 | the hindgut's extent and derivatives, IMA |
| 22 | `kloaka` | 5 | urorectal septum: urogenital sinus (bladder, urethra) vs anorectal canal; endoderm vs proctodeum ectoderm, the anal membrane, the perineum |
| 23 | `irrigazioa` | 5.1 | rectal arteries: superior ← IMA, middle ← internal iliac, inferior ← internal pudendal |
| 24 | `laburpena` | summary | intra / retro / extraperitoneal table, live |
| 25 | `arnas-zuhaitza` | ARNAS APARATUA | the bronchial tree's branching |
| 26 | `albeoloak` | ARNAS APARATUA | the lung's periods and alveoli |

Part 2 traps (notes prose wins, flag the conflict on screen): the descending colon is "peritoneo kanpoko" in 5 but
"peritoneo atzeko" in the summary; the respiratory text calls terminal bronchioles "arnas bronkioloak" and then says
the respiratory bronchioles come from them (weeks 16–28). `NOTES` for the summary section → `n: '6'` + an exception;
the unnumbered "arnas" section needs a label rule in `content/notes.ts`/tests.

## 5. The Kimu class (deferred, owner 2026-10-31)

`content/klasea/w14.ts` + generated `content/klasea/importance/w14.ts` (`scripts/klasea/importance.ts`,
`core-map.ts 14`). Rules as `tests/klasea.test.ts` enforces them (core ≤ 60 %, G1–G4, ≤ 22 words, chunks
60–240 s, 12–20 min, an action every ≤ 120 s, contrast checks, X_WORDS, no Basque-only letters for the Spanish
voice) [klasea-lecture-mode, klasea-short-core]. Open with the big picture (one tube, three arteries, two
mesenteries, two rotations); every line has a `plain`; keep every trap as a KONTUZ; build the summary table on the
board and end with a `fill` check; no mnemonics or invented analogies. Plan lines over the beat that shows the
thing (topic 13 lesson: G4).

## 6. Everything else a finished topic has

`content/weeks/week14.ts` + `week14-structures.ts` (Basque names exactly as in the notes, `es`, `aka`,
definition/location/origin/fate, `parts`/`spans`, `space`); 15–20 mechanism quiz questions + class pool
questions; `guides14` in `content/heart-guides.ts` for every view; chronology milestones (week 4 respiratory bud,
week 5 thoracic mesentery gone, …); atlas relations (foregut → its derivatives, liver bud → hepatocytes / bile
ducts / gallbladder, septum transversum → ligaments, dorsal mesogastrium → spleen / greater omentum, ventral +
dorsal pancreatic buds → parts, umbilical vein → round ligament recalled); tours on the openers; Kimu sweep green.
Reuse existing ids before adding new ones (`aurreko-hestea`, `erdiko-hestea`, `atzeko-hestea`, `faringe-hestea`,
`faringe-poltsak`, `hodi-onfalomesenterikoa`, `kloaka`, `mesenterio-dortsala`, `peritoneo-barrunbea`, `mintz-bukofaringeoa`,
`kloaka-mintza`, `alantoidea`, `birika-hastapena(k)`, `hestegorria`, `urdaila`, `gibela`, `gibel-hastapena`,
`septum-transversum`, `diafragma`, `errai-peritoneoa`, `paretako-peritoneoa`, `peritoneo-*-egiturak`, `duodenoa`, `barea`,
`gibeleko-lotailu-borobila`, `enbor-zeliakoa`, `goiko-/beheko-arteria-mesenterikoa`, `aorta`, `beheko-kaba-zaina`,
`giltzurruna`, `zain-porta`…); a week owns only what it introduces.

Registration (small, additive): `lib/sim/types.ts` week `| 14`; `content/registry.ts`; notes index/NOTES/tests;
`lib/narration/server-utils.ts` `MAX_WEEK = 14` + the reject pin in `server.test.ts` → 15; `Specimen.tsx`;
`TopicShot.tsx` hero (the rotated stomach with the bursa, wide frame, no table); grep every `13`-limited sibling.

## 7. Verification (before calling it done)

1. `npx vitest run` whole suite; `npx tsc --noEmit -p .`; eslint on own files. Never prettier.
2. Dev server via `preview_start`; glides and camera checked headless over CDP (the pane has no rAF).
3. Shots at 1440×900, 1024×768, 768×1024: step ends (une ≈ 0.99) + one early-time shot per 3D view; name plates vs
   chrome measured (`det.js`), not eyeballed.
4. Camera sampled numerically across every step and stage crossing: no cut, no whip-pan.
5. Every beat's verbs confirmed between its start and end in the real app.
6. Each pose checked sentence by sentence against the notes; sides on a front-view shot against DirArrows.
7. `/dev/frames?silent=1&w=14`, `tests/anchors3d.test.ts`.
8. Student walkthrough at 1×, then the whole class.
9. Perf: 60 fps on the heaviest stage; no model rebuild per frame.

## 7b. Batch 1 design, decided from the code (2026-10-26; nothing built yet)

The owner confirmed: **part 2 extends topic 14**. Batch 1 started; only the code study was done. Resume here:

- **Two frames in one file** (`components/scenes/week14/gut3d.ts`, one palette and one set of ids): the
  *embryo frame* for stages 1–5 (the curled week-5 body), and the *trunk frame* (straight, y cranial, like
  topic 13's `veins3d.ts`) for stages 6–16 (batch 2). Topic 13 did the same: stage 1 in the embryo,
  then a straight model.
- **Stage 1 (folding)**: a real 3D slab of the transverse fold, built from topic 4's exact section geometry
  `foldXGeo(f, lam)` (`components/scenes/week4/FoldTransverse.tsx`: `topSp`/`botSp` spines with per-sample
  normals `n` and layer thicknesses `a`/`b`, the mesentery, duct and sac). Extrude each layer band (spine
  sample i, offsets 0→a→a+b) along the body axis as quad strips: two cut faces + inner/outer walls, so the
  3D and the notes' p1 A–C section are the same shape. Timing like `transverseTiming(t)` (`Folding.tsx`).
  The sagittal fold is shown in the small sagittal key (`SectionKey`, `computeFold(t)` from
  `FoldSagittal.tsx`) with the cut plane, so both folds are seen.
- **Stages 2–5 (embryo frame)**: reuse `embryoModel` (`components/scenes/week12/embryo-model.ts`) with
  `gut: 0` for the body glass, heart, aortas and veins (`P(th, out, x)` places points: θ along the curled
  axis, `out` negative = ventral, x = the embryo's left), and draw topic 14's own detailed gut on the same
  `P()`: oropharyngeal and cloacal membranes, pharyngeal gut + pouches, respiratory diverticulum →
  laryngotracheal tube → two lung buds, stomach dilation, liver bud in the septum transversum, vitelline duct
  (wide → narrow), allantois, hindgut, and the 2/3–1/3 transverse-colon border. Its gut is at θ ≈ 1.62
  (pharynx) … 0.3 (foregut end) … midgut loop to the stalk at P(-0.55,-1.1) … −2.05 (hindgut). Stage 4's
  arteries: `vitelline: 1, reduce: 1` gives the coeliac trunk / SMA / IMA in `EC.celiac/sma/ima`; tint each
  gut region with its artery's colour.
- **Stage machinery**: copy topic 13's `veinStage` pattern (`components/scenes/week13/common.tsx`: steps with
  `to`/`opts` eased over `run`, camera keys via `cameraAt`, names said → shown with `from`, one note per
  step, `dim` lighting, `ColourKey`), as a `gutStage` over the gut pose. One continuity key `digestioa-14`.
- **Wiring still to do**: `content/notes-text/index.ts` (`14: w14`), `content/notes.ts` (`NOTES[14]`),
  `tests/notes.test.ts` (length 22245, sha `e12a0b16…` from the manifest, beat counts), `lib/sim/types.ts`
  (`| 14`), `content/registry.ts`, `MAX_WEEK = 14` + the reject pin → 15, `Specimen.tsx`, `TopicShot.tsx`.
  Beat/stage format: copy `content/weeks/week13.ts` (`at: S1[k]`, `notes`, `idea`, `key`, `text`, `focus`,
  `tour`/`tourAt`, `exam`, `ask`, `recall`, `view`; stage `id/day/dayRange/title/subtitle/intro/duration/
  source/views/beats/structures/keyPoints`).

## 8. Batches (each ends with a report and evidence)

1. **Skeleton**: wiring, structures, `gut3d.ts` (tube, stations, walls, arteries reused), stages 1–5 usable.
2. **The signature**: stomach rotations, mesogastria, bursa, live section (stages 6–10).
3. **Duodenum, liver, gallbladder, pancreas** (stages 11–16) + summary table.
4. **Part 2** (stages 17–26, §4b), same models.
5. **Quiz, guides, chronology, atlas**; drop `inPreparation`; ship usable. (Class only when the owner asks.)
6. **Polish sweep**: tablet shots, camera audit, walkthrough, perf; handover `docs/handover/topic-14.md`; lessons
   appended to `memory/topic10-working-lessons.md`.
