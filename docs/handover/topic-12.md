# Topic 12 handover: "12. GAIA: ARTERIA SISTEMA (zirkulazio-sistema III)"

Source: `C:\Users\aitor\Downloads\12. GAIA_ARTERIA SISTEMA (zirkulazio-sistema III) (zuzendu gabe) (1).pdf`
(the uncorrected version), ingested by `scripts/notes/extract.py` into `content/notes-text/w12.ts`
(20,131 characters, pinned in tests/notes.test.ts; mapped beat refs across the course: 764).
When the corrected PDF arrives, re-run the extractor, re-pin the length and sha, and re-check every
`w12/...` ref: the extractor's `--check` lists the differences.

The topic is **complete**: 14 stages, every one in 3D, plus 17 quiz questions, the class, guides,
tours, chronology and atlas relations.

## Stage plan (notes order)

| # | stage id | notes | scene |
|---|---|---|---|
| 1 | sarrera | 1 (circulation of the 5-week embryo) | Embryo3D (transparent lateral embryo, blood flow) |
| 2 | arku-sistema | 2 (sac, arches, dorsal aortae, fusion below T4) | Arches3D ArchSystem3D |
| 3 | eguna-27 | 2.1 (day 27, 4 mm) | Arches3D, arches grow and regress |
| 4 | eguna-29 | 2.2.1–2.2.2 (truncus split, sac horns) | Arches3D, aortic-sac extensions |
| 5 | hirugarren-arkua | 2.3.1 (carotids) | Arches3D |
| 6 | laugarren-arkua | 2.3.2–2.3.3 (arch of aorta, right subclavian's three origins, 5th arch) | Arches3D |
| 7 | seigarren-arkua | 2.3.4 (pulmonary arteries, ductus arteriosus) | Arches3D |
| 8 | beste-aldaketak | 2.4 p3–p4 (carotid ducts go, right DA part goes, heart descends, left subclavian rises) | Arches3D OtherChanges3D |
| 9 | nerbio-atzerakariak | 2.4 p5–p12 (recurrent laryngeal nerves) | Arches3D, nerves in yellow |
| 10 | aorta-heldua | 2.4 p13 with 2.3.2/2.3.4 recalls (the adult aorta and its origins by colour) | Adult3D |
| 11 | adar-bentralak | 2.5, 2.5.1 (vitelline → coeliac and two mesenterics) | Embryo3D view `enbrioia` + Trunk3D `3d` |
| 12 | alboko-adarrak | 2.5.2–2.5.3 (lateral visceral and intersegmental branches, vertebral arteries) | Trunk3D |
| 13 | zilbor-iliakoak | 2.6 (umbilical arteries, iliacs, umbilical ligaments) | Trunk3D |
| 14 | gorputz-adarrak | 2.7–2.7.2 (axis arteries of arm and leg) | Trunk3D limbs |

## Files

Created:
- components/scenes/week12/arteries3d.ts: the one arch-system model (`arteryModel(pose, opts)`, `ArtPose`,
  presets AP0 / DAY29). Everything in stages 2–10 is one model posed differently, so the colours and
  shapes carry over from step to step.
- components/scenes/week12/common.tsx: `ArtView` (ModelView wrapper), `ColourKey`, shared callout lists.
- components/scenes/week12/Arches3D.tsx, Adult3D.tsx, Embryo3D.tsx, Trunk3D.tsx; embryo-model.ts,
  trunk-model.ts.
- content/weeks/week12.ts, content/weeks/week12-structures.ts, content/notes-text/w12.ts.
- content/klasea/w12.ts, content/klasea/importance/w12.ts, docs/klasea/w12-audit.md.

Additive edits:
- scripts/notes/extract.py (FILES + TOC), content/notes-text/index.ts, lib/sim/types.ts (`| 12`),
  content/registry.ts, content/notes.ts (`NOTES[12]`).
- content/heart-guides.ts: `guides12` (all 15 views); tests/heart-guides.test.ts.
- content/chronology.ts, `// 12. gaia`: arches (27), first two arches (≈28), sac extensions (29),
  ligamentum arteriosum and umbilical ligaments (BIRTH).
- content/structure-atlas.ts, `// 12. gaia`: 38 relations (arch → derivative, ductus → ligament,
  vitelline → gut arteries, axis artery → limb arteries…).
- content/klasea/index.ts, tests/klasea.test.ts (TOPICS entry, X_WORDS konexio*), scripts/klasea/audit.ts.
- components/shell/Specimen.tsx (week 11 || 12), components/shell/TopicShot.tsx (12 → aorta-heldua/3d).
- lib/narration/server-utils.ts `MAX_WEEK = 12` (and the reject pin in server.test.ts moved to 13).

## Colour decisions (`AC` in arteries3d.ts)

Colour = origin, kept from the embryo to the adult so a student can read where each adult part comes
from: aortic sac = truncus ivory (topic 10), arch 1 sky `#7dd3fc`, 2 lilac `#b9a3ff`, 3 orange `#ff9a3c`,
4 magenta `#e0408f`, 5 grey `#a3a1b3`, 6 blue `#3b82f6`, dorsal aorta red `#dc2626`, 7th intersegmental
teal `#14b8a6`, vagus/recurrent nerves yellow `#facc15`, ligaments putty `#c9c1b2`. Blood colour (O₂) only
appears in stage 1 and in the flow streams.

## Class (Klasea)

15 chunks, ~9.5 min of speech (566 s) plus checks; the test keeps the whole class inside 12–20 min.
The board table `taula` (arch → what it forms, 7 rows) is filled step by step and completed in `amaiera`.
Every line has a plain wording ("Ez dut ulertu").

## Verification at hand-over

- `npx vitest run`: whole suite green after the fixes in this batch (narration MAX_WEEK, two label
  crossings on eguna-29 and adar-bentralak/enbrioia).
- `npx tsc --noEmit -p .` and eslint on the touched files are clean (Viewport.tsx keeps one older
  `set-state-in-effect` error at the `setZ(HOME)` reset, not from this batch).
- Headless Chrome on a production build (`next start -p 3121`): every stage at 1440×900, and the arch,
  adult, trunk, pelvis and limb views at 768×1024 and 1024×768. The colour keys now wrap against the
  turn button and drag hint (`ColourKey` reads `useLabelScale().chrome` and `k`).
- Shell fix found here, for every topic: the magnifier pills repeated names already shown, because
  `sameMarks` (components/shell/Viewport.tsx) ignored `named`, and a paused step was never re-measured
  after its 0.7 s fade-in. Both fixed.
- The `/dev/frames` silent test and the anchor audit need `next dev`; see the resume list.

## Resume list

1. Run the silent test (`/dev/frames?silent=1&w=12`) and the anchor audit
   (`node scripts/anchor-audit.mjs http://localhost:3007 12-12`) once a dev server is up.
2. Swap in the corrected PDF when it is published (see the top).
3. Back-port to topics 7–9 what topic 12 does well: colour = origin carried through every step, one model
   posed per stage.
