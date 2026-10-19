# Topic 11 plan: the culmination (2026-10-18)

**Owner's brief:** topic 11 must objectively be the best topic. It should be the culmination of everything learned in topics 1–10. It should use 3D wherever it helps, be super understandable for students, and be polished everywhere.

**Source:** `11. GAIA. ZIRKULAZIO-SISTEMA (II) (zuzenduta).pdf` → `content/notes-text/w11.ts`: 186 sentences, sections 1, 2.1, 2.2, 3, 4, 5.1 and 5.2. Earlier handover: `docs/handover/topic-11.md`.

**State at the start:**
- Stages 2–4 (septum primum, foramen ovale, birth) exist as **2D only**. They have frontal, face and dual views.
- The silent test fails: the septa are thin and the dual panes small.
- Stages 1 and 5–11 do not exist yet. `inPreparation: true`.

## 1. The bar: every rule from topics 1–10, applied from the start

| Rule (memory) | What it means for topic 11 |
|---|---|
| prefer-3d, showcase-7-and-9 | Septation is a 3D process: flaps side by side, an oblique path, a spiral. Each stage gets a **3D view as its main view**. 2D sections stay as alternatives, joined by bridges. |
| never-get-lost | Every view change moves the camera: bridges, `look`, zoom, `continuity` across stages. No hard cuts. Named-side camera keys (`axes.edges`). A turn of over 120° is announced in the step text. |
| 3d-arrows-follow-camera | Every 3D scene passes `axes.edges`. No faked directions: arrows seen end-on become ⊙/⊗. |
| topic10-working-lessons | Axes convention written in each model file: x = embryo's left, y = cranial, z = ventral. Check every sided structure on a front-view shot. Check each step's pose against the notes sentence by sentence. Every view is visited by a step, or kept optional with a written reason. Student walkthrough at the end. |
| visibility-guard, label-zones-design-first | Name windows span their whole beat. `tourAt` is absolute. Edge label columns at x = 24 / 976. Anything mentioned is visible. Nothing buried inside other meshes. |
| keep-all-labels, no-drawn-pointers, anchor-inside, consistent-style | Names appear progressively, never cut. Pointing is done with glow and outline, never drawn rings. Dots sit inside one structure. Colours stay topic 10's: sinus violet, atrium orange, ventricle cyan, proximal green, conus lime, truncus ivory, O2 red / deO2 blue. New colours: cushions mint with a pink endocardial rim. |
| keep-some-realism | Organic, shaded walls with tissue textures (muscle, membrane), as in the topic 10 heart. No pastel cylinders. |
| notes-prose-wins | 5.1 contradiction (conal cushions): use the self-consistent reading and add a KONTUZ note. 5.2 p11 (Lagman's version): shown as a "beste bertsio bat" note. The grey "EZ DA AIPATU" sentences use the GREY flag. |
| each-topic-step-forward | Beat topic 10 on four points: (1) blood **flowing** through every septation stage as Stream3 cells, to show what each hole lets through; (2) live cross-section planes for the spiral septum; (3) live summary tables built step by step; (4) recall links back to topic 10 (the same model and colours, continuity from the topic 10 heart). |
| klasea-*, no-past-exams | A topic 11 class (12–20 min, 1–2 checks per chunk, core only). Mechanism questions only (why/how), never past-exam style. |
| perf (Batches 1–9) | 30 Hz pose budget. Triangle budget per view < 250k drawn. Meshes come from caches and `deformBy`. Low-poly `hit` meshes. Measured with the harness at 1536×960 DPR 2 before each commit. |
| target-pc-tablet, design-beauty-and-usability | Checked at 768, 1024 and 1440 px. One message at a time; nothing covers the specimen. |

## 2. Stages and views (notes order)

| # | stage id | notes | 3D main view (what the 3D shows that 2D cannot) | 2D alternatives |
|---|---|---|---|---|
| 1 | `trenkadatze-mekanismoak` (new) | 1 | Two small 3D tubes cut lengthwise, side by side: (a) two endocardial cushions grow from opposite walls and fuse into a complete septum; one cushion from a single wall reaching the other wall; (b) two muscular walls grow together and leave a gap, so the septum is incomplete. Blood cells pass the gap in (b). | none |
| 2 | `septum-primum` | 2.1 | **Two-atria 3D model** opened from the front: the primum curtain grows from the roof towards the cushions. Ostium primum is the gap at its free edge. Ostium secundum is perforations that merge. Blood cells RA → LA through whichever opening is open. | frontal, face, dual (existing) |
| 3 | `zulo-obala` | 2.2 p3–p6 | Septum secundum on the primum's **right**. The camera turns from above, so the two flaps are seen side by side. Cells take the **oblique path** (FO low → ostium secundum high). The valve of the FO. | existing |
| 4 | `jaiotza` | 2.2 p7 | Pulmonary veins fill the LA, the LA pressure rises, and the primum is pressed onto the secundum. The cells stop. The 20% patent slit is a thin seam with a few cells, and cyanosis is marked in the caption. | existing |
| 5 | `aurikulen-paretak` (new) | 2.2 p8–p15 | RA: smooth back wall (sinus) and trabeculated anterior wall with pectinate muscles, crista terminalis and the SA node (reuse `atrium3d.ts`). The camera turns behind the LA: the primitive pulmonary vein buds, branches into 4, and is incorporated into the smooth wall. Mesocardium sentences are GREY. | frontal (HeartArt) |
| 6 | `erreten-ab` (new) | 3 p3–p16 | **AV canal model:** the camera looks down into the canal from the atria. The bulboventricular ridge flattens and the canal shifts right, so it opens onto both ventricles. Four cushions (superior, inferior, left, right) grow; the superior and inferior ones fuse, leaving 2 orifices. The canal lies in the **frontal** plane (KONTUZ). The side view, as in the notes' "ALBOTIK IKUSITA", is a 3D turn. | frontal |
| 7 | `balbula-ab` (new) | 3 p17–p22 | Inside the ventricle: the cushion mesenchyme is hollowed from below and thins into leaflets (3 tricuspid / 2 mitral). Chordae (3 orders) and papillary muscles. Papillary contraction pulls the leaflets. | frontal |
| 8 | `bentrikulu-arteko-trenkada` (new) | 4 | Ventricles growing, inner walls meeting into the muscular septum. The IV foramen above it lets cells pass RV → LV. RV slightly anterior to LV. The membranous part closes the foramen (from stage 9). | frontal |
| 9 | `arteria-konoa` (new) | 5.1 | Conus with two oblique ridges (posterior-right, anterior-left; KONTUZ). They fuse into the conal septum, giving the RV infundibulum (anterior-right → pulmonary) and the LV infundibulum (posterior-left → aorta). The lower end fuses with the muscular septum and the inferior cushion, giving the membranous IV septum. Cells stop crossing. | cross-section |
| 10 | `enbor-arteriosoa` (new) | 5.2 p3–p11 | **Showcase:** the spiral aorticopulmonary septum. Two ridges twisting 180°. Three level planes, each with its live cross-section inset: proximal transverse (pulmonary anterior), middle sagittal (aorta right), distal transverse (aorta anterior). Red/blue cells spiral up each channel. Lagman's version is a note. | 3 level sections (2D) |
| 11 | `balbula-semilunarrak` (new) | 5.2 p12 | Looking down each root: 3 swallow's-nest cusps (aortic: 2 lateral + posterior; pulmonary: 2 lateral + anterior). Tubercles hollow from above. Coronary arteries leave the right and left aortic sinuses. Ends on the **live summary table** (5.2 p10: smooth/trabeculated origins of every chamber). | table |

## 3. 3D models (one parametric model per region, shared across stages)

All models live in `components/scenes/week11/`, use topic 10's tissue kinds and colours, and state the axes convention at the top.
- **M0 `mechanism3d.ts`:** a generic tube cut lengthwise, with cushion and muscular-wall modes (stage 1).
- **M1 `atria3d.ts`:** RA + LA opened from the front, built on `atrium3d.ts` primitives (`wall`, `grid`, `ridge`):
  - septum primum (curtain), ostia, septum secundum (crescent band), FO valve;
  - LA back wall with the pulmonary vein bud → 4 veins;
  - streams along the oblique path (stages 2–5).
- **M2 `canal3d.ts`:** atria floor, AV canal ring, 4 cushions, the 2 orifices, ventricles below; leaflets, chordae and papillary muscles (stages 6–7).
- **M3 `ventricles3d.ts`:** both ventricles opened from the front; muscular septum, IV foramen, membranous part (stage 8). It shares the canal with M2.
- **M4 `outflow3d.ts`:** conus and truncus as one tube with a parametric septum surface. The surface is swept: angle θ(u) rotates 180° along the truncus, oblique in the conus. Aorta/pulmonary lumens follow it. Level planes. Semilunar cusps and coronaries (stages 9–11).
- **Continuity:**
  - topic 10 stage 10's 3D atrium → topic 11 stage 2 (`continuity` key);
  - M1 → M2 → M3 → M4 keep the same heart frame, so camera glides across stages make sense.

## 4. Batches (each one: build → headless check → tests → commit → short report)

- **B0:** commit the pending 3D performance work (Batches 6–9 by the other model, reviewed). This plan.
- **B1:** M1 + 3D main views for stages 2–4. Blood streams on the oblique path. Bridges to the existing 2D views. Fix the silent test.
- **B2:** M0 (stage 1) + stage 5 (atrial walls, pulmonary vein).
- **B3:** M2: stages 6–7.
- **B4:** M3 + M4 conus: stages 8–9.
- **B5:** M4 truncus spiral + semilunar valves: stages 10–11, final table.
- **B6:** learning layer:
  - 100% notes coverage;
  - quiz (mechanism questions);
  - chronology, atlas relations, recall links to topic 10;
  - Klasea topic 11 class.
- **B7:** final polish:
  - full student walkthrough at 1×, every crossing, cameras checked numerically;
  - anchor audit, silent test;
  - 768 / 1024 / 1440 px;
  - perf harness over every new 3D view;
  - drop `inPreparation`; docs + memory lessons.

## 5. Pending-work review notes (B0)
The other model's Batches 6–9 were reviewed before committing:
- Fixed: `createGL` refused to start in a hidden tab, so a topic opened in a background tab stayed flat for good. It now creates a sleeping layer.
- Kept as the user's decision: the 30 Hz draw and pose ceiling (user-requested 30 vs 40 comparison; default 30). Drags are also capped at 30 Hz; watch for "clunky" feedback.
- Removed prewarm: the first 3D view of a visit compiles on demand. Watch for a "prestatzen" moment in the middle of a bridge.

## 6. Progress
- **B1 (done, d6a3766):** M1 `atria3d.ts` + `Septa3D.tsx`, 3D main views for stages 2–4.
- **B2 (done):** M0 `mechanism3d.ts` + `Mechanisms3D.tsx` (stage 1 `trenkadatze-mekanismoak`: topic 10 loop → three chambers A/B/C, cut faces show matrix + endocardium, cells stop in A/B and keep crossing in C). Stage 5 `aurikulen-paretak` on M1 (`Walls3D`): sinus taken in, smooth/trabeculated parts, CS, crista + SA node, pectinate muscles and auricles; primitive pulmonary vein bud → 4 branches → lung buds → incorporated (4 openings, LA smooth part); the grey p14–p15 step replays the vein's growth out of the dorsal mesocardium. The pulmonary veins now run two to each lung (stage 4 too). Notes sections: '1' added, '2.2' gets `aurikulen-paretak`; beat count 635.
  - Stage 5 has no 2D alternative yet (3D only): decide in B7.
  - Silent check flags still open for B7: septum-primum #1 #3, zulo-obala #2 #3, jaiotza #1 #3 #6 (aurikulen-paretak #1 mild).
- **B3 (done):** M2 `canal3d.ts` + `AvCanal3D.tsx` (scene file name must differ from the model's by more than case on Windows). Stage 6 `erreten-ab` (notes 3 p3–p16): both primitive ventricles cut open from the front, the AV canal opening in their back wall (frontal plane) with a duct back and up to the common atrium; (1) the bulboventricular ridge flattens, (2) the canal moves right over both ventricles, (3) four cushions, superior (dorsal) + inferior fuse → right and left AV orifices; two side views (right wall glassy, blue frontal plane); the topic 10 loop recalled from the right with direction arrows (KONTUZ: p15 "gora, aurrera eta atzera" vs p11 "gora, atzera eta ezkerrera"); primary IV foramen as a faint doorway over the ridge. Stage 7 `balbula-ab` (p17–p22): swellings round each orifice → tricuspid (3 cusps) and mitral (2), hollowed thin; papillary muscles and chordae (muscular → fibrous), papillary contraction opens the cusps; the three orders of chordae glow in turn without claiming where each inserts (p22 s3). AV cushion orientation fixed in M1 too (superior = dorsal, at the back of the horizontal canal floor). Notes section '3' added; beat count 650.
  - Silent check: erreten-ab #1 and #9 mild (camera glide only); B7.
  - Stages 6–7 are 3D only, like stage 5: 2D alternative decision in B7.
- **B4 (done):** M4 `outflow3d.ts` (conus: wall, mouth, dorsal-right + ventral-left ridges, oblique plate turning 15°→50° up the conus, cut-across sections, the two infundibula as the lumen's halves; simple truncus until B5) and `VentricleSeptum3D.tsx`, both on M2's ventricles (`canal3d.ts` gains trabeculae, the heart's 18° turn (RV forward, notes 5.2 p9), the ridge growing into the muscular IV septum (green | cyan faces, full height in front, a gap at the back under the conus), the membranous sheet, the RV valve apparatus fading with its wall). Stage 8 `bentrikulu-arteko-trenkada` (notes 4 p3–p7; blood crosses RV → LV over the crest as p6 s3 says) and stage 9 `arteria-konoa` (5 p3, 5.1 p3–p7; KONTUZ: p5 s4 swaps the ridges' sides; Lagman's version as GREY-style `more`). The conus root now moves over the septum during stage 8 (x −0.62 → 0). Stage 6's last text no longer says which way blood crosses (p16 gives none). Notes sections 4, 5, 5.1 added; exception `11/arteria-konoa/0` (its 5 p3 anchor); beat count 660.
  - Silent: bentrikulu-arteko-trenkada #5 mild (3.1%).
- **B5 (done):** M4's upper half `truncus3d.ts` + `SpiralSeptum3D.tsx`, on the stage 8–9 heart (`canal3d.ts` takes an optional `truncus` state; `outflow3d.ts` gets `bare`). The aorticopulmonary septum's line turns 50° + 220°·u in the model; with the heart's 18° turn the body sees exactly 90° / 180° / 270° at `LEVELS` [0.1, 0.51, 0.92] (proximal transverse, pulmonary in front · middle front-to-back, aorta right · distal transverse, aorta in front). Stage 10 `enbor-arteriosoa` (5.2 p2–p10, 8 beats): two ridges spiral up the clear truncus and fuse (their names stay on the septum's edges); the truncus is cut at each level in turn, the section rising and turning under a top-down camera, while a strip of three small sections fills in at the top right; continuity with the conus septum (walls clear, from the right); the two vessels apart, twisted round each other; the p10 summary as a table. KONTUZ: the notes place the ridges "goi-atzean / behe-ezkerrean", which a 180° spiral cannot keep at every level, so both get the same neutral name. Stage 11 `balbula-semilunarrak` (p12): three tubercles per root, hollowed from above into pocket cusps (aortic posterior + 2 lateral, pulmonary anterior + 2 lateral, commissure Y lines), coronaries out of the aorta's right and left sinuses. Notes section 5.2; MENTION_ONLY for stage 10's intro beat; beat count 672.
  - Silent: all new beats move (5.8–25%).
  - Notes 5.2 p11 (Lagman) is only shown as stage 9's `more`, not anchored.

