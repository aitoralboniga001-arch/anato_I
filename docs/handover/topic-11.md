# Topic 11 handover: "11. GAIA: ZIRKULAZIO-SISTEMA (II) — bihotzaren trenkaden sorrera"

Source: `C:\Users\aitor\Downloads\11. GAIA. ZIRKULAZIO-SISTEMA (II) (zuzenduta).pdf`, ingested by
`scripts/notes/extract.py` into `content/notes-text/w11.ts`. The output has 80 blocks, 186 sentences and
25,146 characters, and `--check` finds no differences from the PDF. Topics 1–10's notes-text is unchanged.

## Stage plan (notes order)

| # | stage id | notes | state |
|---|---|---|---|
| 1 | trenkadatze-mekanismoak | 1 (p3–p6: cushion mechanism vs muscular mechanism) | to do |
| 2 | septum-primum | 2.1 | **done, registered** |
| 3 | zulo-obala | 2.2 p3–p6 (septum secundum, FO, oblique path, valve) | **done, registered** |
| 4 | jaiotza | 2.2 p7 (birth, pressure, fusion during the 1st year, 20 %, mixing/cyanosis) | **done, registered** |
| 5 | aurikulen-paretak | 2.2 p8–p15 (RA smooth/trabeculated, crista terminalis, SA node; LA, primitive pulmonary vein; grey mesocardium) | to do |
| 6 | erreten-ab | 3 p3–p16 (canal shift, ridge, 4 cushions, 2 orifices, loop seen from the side) | to do |
| 7 | balbula-ab | 3 p17–p22 (tricuspid/mitral, hollowing, papillary muscles, chordae of 3 orders) | to do |
| 8 | bentrikulu-arteko-trenkada | 4 | to do |
| 9 | arteria-konoa | 5, 5.1 | to do |
| 10 | enbor-arteriosoa | 5.2 p3–p11 (spiral aorticopulmonary septum, 3 levels) | to do |
| 11 | balbula-semilunarrak | 5.2 p12 | to do |

`NOTES[11]` in content/notes.ts lists only sections 2, 2.1 and 2.2. Add each section when its stage lands.

The topic is **partial**. Only section 2 (aurikula komunaren trenkadak) is shipped, and the week subtitle says
so. If the lead prefers the topic flagged as "prestatzen": `isWip` (components/shell/LandNav.tsx) only
triggers when *every* view description is 'Prestatzen', which would hide the three finished stages. A
partial-topic flag would need a small shell change (not owned here).

## Files

Owned and created:
- components/scenes/week11/common.tsx: palette K (topic 10's T plus cushion mint, septum colours),
  Defs11 (light, lumen, recess, gap, tissue patterns), Cells, Tissue, Cushion, Trabeculae.
- components/scenes/week11/heart.tsx: the one frontal-section heart for every stage (`HeartState`, H0).
  It is drawn at HK = 0.86 about (500, 330), so label anchors must go through `hp()`. Helpers:
  `primumGeom`, `primumAxis`, `foBox`, `secundumBottom`, `canalOf`, `bloodPaths`. It already carries
  the canal shift, ridge, IV septum, membranous septum, valves/chordae/papillary muscles and
  smooth/pulmonary bands for stages 5–8. They are untested visually; the valves looked cluttered.
- components/scenes/week11/septal.tsx: the septum seen from inside the RA (`FaceState`). Viewer-left is
  posterior. It shows the caval openings, the crescent septum primum with a masked ostium secundum, the
  see-through septum secundum, spurium and the venous valve, and the patent slit.
- components/scenes/week11/Atria.tsx: stages 2–3 (P1, P2, frontal / face / dual).
- components/scenes/week11/Birth.tsx: stage 4 (P3). Its dual view is the whole heart plus a "lupa" of the
  same scene at 1.55×.
- content/weeks/week11.ts, content/weeks/week11-structures.ts. The second already defines the ids for
  stages 5–11 (cushions, orifices, valves, IV septum parts, conal/truncal ridges, semilunar valves,
  coronaries) and `ezkerreko-aurikula-jaiotakoan`. The existing `ezkerreko-aurikula` (topic 5) means
  the external LA prominence, so it is not used here.
- content/notes-text/w11.ts (generated).

Additive edits:
- scripts/notes/extract.py: FILES entry, a week-11 TOC branch, and week 11 excluded from the x>150
  caption rule.
- content/notes-text/index.ts (w11), lib/sim/types.ts (`| 11`), content/registry.ts (week11),
  content/notes.ts (NOTES[11]).
- content/chronology.ts, under `// 11. gaia`: 27–37 egunak, septum primuma (≈28), and
  `Zulo obala ixten` (BIRTH → afterBirth(12), approx, 'Jaiotza → 1. urtea').
- tests/notes.test.ts: w11 length 25146, its sha, beat count 567.
- content/weeks/week10-structures.ts: septum colours (see below).

## Colour decisions

Topic 10 is kept exactly: sinus violet, atrium orange, ventricle cyan, proximal green, conus lime, truncus
ivory, blood red/blue, mixing = red and blue cells. Topic 11 adds:
- cushions and everything they build: mint `#a9e4dc`, with a pink endocardial rim `#f9a8d4`;
- muscular IV septum: two-tone (green | cyan).

**Open decision: septum primum and secundum.** `septum-primum` is `#f4ecd8` (pale cream, thin flap) and
`septum-secundum` is `#ec8fbf` (rose, thick), both set in week10-structures.ts. The lead judged the pair
too close. Pick the final pair and change it in two places together: the K tokens in
components/scenes/week11/common.tsx and the two ids in week10-structures.ts. Yellow/gold is excluded
(endoderm #f2c14e).

## Notes facts to keep straight

- Grey "EZ DA AIPATU" sentences use topic 9's `GREY` text in `more`: 2.2 p3 s1, p3 s6–s7, and p14–p15
  (mesocardium).
- **5.1 contradiction.** p5 s2 puts the conal cushions posterior-right and anterior-left, but s4 says
  "aurre-eskuinaldean … atze-ezkerrean". The self-consistent reading is cushions posterior-right and
  anterior-left, with the spaces anterior-right (RV infundibulum → pulmonary) and posterior-left
  (LV → aorta). Add a KONTUZ when stage 9 is built.
- Truncus levels (5.2 p4–p6): proximal transverse (pulmonary anterior, aorta posterior); middle sagittal
  (aorta right, pulmonary left); distal transverse (aorta anterior, pulmonary posterior).
- The birth day is 266 (`BIRTH`).

## Verification at hand-over

- `npx vitest run` passes on the week-11 filters (labels, visibility, content, notes, chronology): 51
  passed. `npx tsc --noEmit` and `npx eslint` on the touched files are clean.
- Anchor audit (`node scripts/anchor-audit.mjs http://localhost:3007 11-11`, run from a scratch folder):
  0 crossings. The last complete run listed 11 single-view dots (RA on the smooth band, birth valve and FO,
  face spurium, venous valve and primum). All of them were fixed afterwards, but the re-run could not load
  because both dev servers (:3000 and :3007) went down, so **re-run it**. Rows on `/ biak` views show
  "(rect)" in every topic's dual views, which looks like an audit limitation with duals.
- **Silent test (`/dev/frames?silent=1&w=11`): not passing.** Most steps change less than 2 % of the frame,
  because the septa are thin and the dual panes are small. Fixes to try:
  - grow the atrial swellings on step 1;
  - widen the cushion growth range;
  - make the LA dilate as its pressure rises at birth;
  - stream the shunt blood more boldly;
  - show the face view as the default where the shape change is large (the septum primum crescent).
- Browser checks at 768, 1024 and 1440 are not done (the servers were down at the end).

## Resume list

1. Re-run the anchor audit and the silent test; fix the silent rows (ideas above).
2. Settle the septum colour pair (see above).
3. Browser pass at 768, 1024 and 1440 on stages 2–4 (dual, frontal and face views).
4. Ask the lead for a `Specimen.tsx` week-11 case, e.g. `if (week === 11) return day < 57 ? 'c' : 'fetua';`.
5. Build stage 1 (mechanisms), then 5–11 in notes order, reusing HeartArt. Stage 10 is the spiral
   septum: a computed SVG projection with three level cross-sections; 3D only if it is flawless.
6. Add structure-atlas relations under `// 11. gaia` as the stages land.
