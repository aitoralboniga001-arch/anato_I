# Topic 14 polish — stages 1–5 (audit only, no code changed)

Stopped at the 20:00 hard stop after the audit. **No source file was edited**; the tree is as it was.

## Screenshot tool
Own driver: `C:\Users\aitor\AppData\Local\Temp\claude\C--Users-aitor-Downloads-1-MEDICINA\42ea7305-b271-4c43-b787-7201193d9d96\scratchpad\a1\shots.mjs`
(`node shots.mjs <outDir> <W> <H> "stage@une,..." [tag]`). Self-contained (own launch/CDP/evaluate, port 9341,
absolute forward-slash profile path), so it no longer depends on `scripts/perf-topic10.mjs`.
Note: `scripts/perf-topic10.mjs` now hard-codes `PORT = 9341` (line 17) — someone changed it; agents importing it
share that port. Profile paths written in a bash heredoc must use forward slashes (backslashes → octal-escape error).
Before shots (1440×900, every step end): `...\scratchpad\a1\shots\before\*.png`, contact sheets `m-s1.png`…`m-s5.png`
(`mont.py` in the same folder makes them).

## Defects per stage (vs PDF p1, p2)

### 1 sarrera (Fold3D.tsx) — vs p1 A–C
- Camera looks at the extruded block from above/obliquely (orbit yaw −24…10, elev 6–22, `ZL = 1.15`): the long
  top faces dominate and the cut face (the p1 figure) reads poorly. Fix: shorter block (ZL ≈ 0.45), cameras near
  face-on (yaw ±10, elev 4–8), frame the whole section incl. the yolk sac (sac is cut off at the bottom at step 3).
- Ectoderm/amnion blue and parietal pink render dark and glassy; neural tube, notochord, somites are muddy dark
  blobs. Need brighter, opaque layers with clear gaps between them (p1: blue ectoderm, white coelom, yellow endoderm).
- Label clutter: "Enbrioi barruko barrunbea" overlaps "Hodi onfalomesenterikoa"; "Bitelo zakua" and
  "Bitelo zaku sekundarioa" both shown at the same point (step 3) — duplicate name source (name list +
  structure label). Left column crowded.
- Step 1 (flat disc) reads as a big blue slab over a yellow ring — not a flat trilaminar disc.

### 2 heste-atalak (Early3D.tsx S2, gut3d.ts) — vs p2 A/B
- Gut is a thin wire (r 0.12) inside a muddy brown glass body; not the hero. Stomach (pose 0.2) and liver bud
  (0.25) barely visible; no pouches/lung bud at this stage, fine, but p2 A shows a plump yellow gut.
- Vitelline duct and allantois are dim brown sticks (opacity 0.75/0.8 × dim) — "Hodi onfalomesenterikoa" points
  at an almost invisible line; yolk sac a pale blob at the frame edge. The wide→narrow action is hard to see.
- Aorta/aortic arches/heart (red) clutter behind the gut at full strength.

### 3 arnas-hastapena — vs p2 A (lung bud), p2 bottom A–C
- Respiratory diverticulum renders dark navy and sits behind the foregut — barely visible. Should be light blue
  (p2: blue lung bud), ventral (in front) of the foregut, camera showing it in profile.
- Orange foregut shows banding/stripes (tissue texture) — reads as faceting.
- Pouches step (front view): pouches form an unreadable green blob.
- Whole-gut step (0.82): leaders of "Gibel hastapena"/"Arnas hastapena" cross; marks ("arnas h.", "gibel h.",
  "2/3 | 1/3") overlap the gut.

### 4 zirkulazioa — vs p2 bottom (coeliac/SMA/IMA)
- Readable but: vessels thin, the aorta hidden/faint, each artery's territory not obvious; aortic arches (dark
  red) clutter at the top. Step 3 SMA camera is too close (gut cut off).

### 5 mesenterioa — vs p2 bottom (orange mesenteries)
- Peritoneal cavity/parietal peritoneum are faint green/pink tubes — read as glass noise.
- Mesentery sheets are see-through red; names (mesogastrio/mesoduodeno/mesenterioa/mesokolon) crowd the right
  edge; "Urdaila" leader crosses them.
- Retro step (0.7): huge red aorta/IVC curve dominates; kidneys tiny.
- Ventral mesogastrium step: the septum transversum is an orange box-like blob; labels stacked.

## To do, priority order
1. Gut as hero everywhere (gut3d.ts): thicker tube (~0.16), outline on, fade body glass (≈0.5) and vessels
   (`vessels` opt ≈ 0.15) in stages 2–3; duct/allantois at full opacity in yolk colour; lung bud light blue, in
   front of the foregut.
2. Stage 1 camera + block length + layer colours; remove the duplicate yolk sac label.
3. Stage 3 pouches view (side+above, not front) and the whole-gut label/mark layout.
4. Stage 5 mesentery sheets opaque orange (p2 colour) with the gut in front; spread the four names along the sheet.
5. Stage 4 thicker arteries from a visible aorta.
Verify: tsc, `npx vitest run tests/visibility.test.tsx tests/notes.test.ts`, re-shoot with shots.mjs.
