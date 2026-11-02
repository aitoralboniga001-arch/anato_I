# Topic 14 polish — stages 25–26 (`arnas-zuhaitza`, `albeoloak`) — handover 2026-11-02 20:00

Status: **audit only, no code changed.** `Lung3D.tsx`, `lung-model.ts`, `week14.ts`, `week14-structures.ts` untouched.

## Screenshot tool (fixed copy)
`C:\Users\aitor\AppData\Local\Temp\claude\C--Users-aitor-Downloads-1-MEDICINA\42ea7305-b271-4c43-b787-7201193d9d96\scratchpad\lung\shots.mjs`
- Self-contained (no import from `scripts/perf-topic10.mjs`, whose `launch` hardcodes `PORT = 9341`, so two agents on it collide).
- Port 9344, absolute forward-slash profile path (a backslash path in a heredoc becomes an octal-escape syntax error).
- Usage: `node shots.mjs <outDir> 1440 900 "arnas-zuhaitza@0.17,albeoloak@0.13,..."`. It hits `http://localhost:3000/astea/14?etapa=..&ikuspegia=3d&une=..` and waits for `canvas.is-ready`.
- Known issue: after about 6 shots headless Chrome died (the socket closed, "unsettled top-level await"). Run at most 5–6 jobs per call, or add a `ws.onclose` reject.
- Before shots: `...\scratchpad\lung\before\` (arnas-zuhaitza 0.17/0.37/0.57/0.77/0.99, albeoloak 0.13).

## Defects found, stage 25 `arnas-zuhaitza` (compared with PDF p2 bottom, A–D)
1. **Step 4 (tertiary + "more", une 0.77):** the tree is a symmetric binary fractal, like a wiring diagram, with the same angles on both sides. It does not read as an airway: no tapering from generation to generation, and right/left look the same.
   - Fix in `lung-model.ts` treeModel, the `more` loop (about line 232):
     - taper the radius continuously;
     - add jitter or seeded asymmetry;
     - make it fill the lobe volume instead of fanning in a plane.
2. **Step 5 (cartilage, une 0.99):** the fine generations vanish. In step 5 they are dimmed, and the "≈16 generations" are gone from the final picture.
   - Keep `bronkio-zuhaitza` in the step-5 `dim` list in `Lung3D.tsx` spec25, or lower the fade.
3. **Lobes (steps 3–5):** dark maroon ellipsoids at 0.28 opacity. They overlap each other, read as muddy blobs, and have no fissures.
   - The right and left lungs are the same size and shape (the right should be bigger, with 3 lobes; the left smaller, with the cardiac notch).
   - Fix `lobeShape`/lobes block (about lines 106–124 and 259–268): one lung hull per side, light pink, a brighter rim, and lobes separated by a fissure gap.
4. **Main bronchi asymmetry is too weak.** The right bronchus should be clearly more vertical, shorter and **wider**; currently both radii are 0.085 (line 181).
   - Make the right radius ≈0.1 and the left ≈0.075, and make the right steeper.
   - In step 3 the right-side lobar bronchi visibly cross each other: the upper lobar comes off `mains[-1][len-4]` with dir `[-0.8,0.45,..]` and crosses the middle/lower ones.
5. **C rings (step 5):** they look like flat white washers stacked on the trachea. Also, the larynx blob is not visible (hidden or too small); the "Laringea" leader points at the top of the trachea.
   - The rings should be thinner, sit flush in the wall, with the dorsal gap visible from a 3/4 view (they open towards the oesophagus).
   - Turn the step-5 camera to yaw ≈ −35° so the gap and the oesophagus behind show.
   - Make the larynx bigger and lighter, with an epiglottis bump (PDF D).
6. **Foregut:** a flat brown bar behind everything. In step 1 it is fine as the "wall", but in steps 2–5 it sits as a muddy column through the middle of the tree.
   - Fade it, or show it as the oesophagus dorsal to the trachea.
7. **Tracheoesophageal septum (PDF p2 A–C) is not shown in stage 25 at all.** The ridges (gandor trakeoesofagikoak) separating the tube from the foregut are missing; step 2 just grows a separate tube.
   - Add a pose param `septum` in step 1→2: the bud first opens into the gut, then the ridges pinch it off. A close-up of PDF A→B→C is the best match.
   - Check the notes' sentence ids first.
8. Labels: in step 2, the "Arnas hastapena" and "Birika hastapenak" callouts stack with ghost copies (fading duplicates overlap) at une 0.37. The stacked callouts at the right in step 5 are fine.

## Defects found, stage 26 `albeoloak` (only step 1 shot; Chrome died after)
1. **Step 1:** a lone blue capsule (the terminal bronchiole), with no context of where it sits.
   - Add a faint bronchial-tree inset, or a zoom bridge from stage 25's tree tip (`never-get-lost`).
   - It also has the same look as the trachea; a bronchiole should be thinner and pinker, with no cartilage.
2. Read from code (not yet shot):
   - The sacs are 6 identical spheres in a ring per bronchiole (`acinusModel`, about line 357).
   - The capillaries are 2D-ish rings round every other ball (about line 377), not a net hugging the sac.
   - Pneumocytes are 5 small flat discs and 2 balls on one sac (about line 393); too small to see at the step camera.
   - Surfactant is 10 yellow dots *inside* the sac at r = 0.11 (it should line the inner surface as a film).
   - Fluid is a blue sphere per sac.
   - Expected look: grape-like alveolar sacs with a cut-away half sac showing the type I (flat, wide) and type II (cuboidal, with granules) cells, a surfactant film, and capillaries pressed into the wall.
3. **Periods are not made explicit.** Pseudoglandular / canalicular / saccular / alveolar is not labelled; only week numbers in the subs.
   - Consider a period strip in `over` (stage 26) only if the notes name the periods. Notes prose wins: check before adding.
4. The Kontuz trap (respiratory vs terminal bronchiole at week 16) shows correctly. Keep it.

## Priority to do
1. Stage 26: shoot all 7 step ends (0.13, 0.27, 0.41, 0.55, 0.70, 0.85, 0.99) to confirm the code-read defects; then rebuild the sacs, capillaries and pneumocytes as a cut-away close-up with step cameras that frame each.
2. Stage 25: realistic asymmetric tree:
   - tapering;
   - right bronchus wider and more vertical;
   - 3 lobar bronchi on the right and 2 on the left, with no crossing;
   - generations that grow in visible order and stay in step 5;
   - light lung hulls with fissures.
3. Stage 25: tracheoesophageal ridges/septum (PDF A–C) and the larynx (PDF D); C-ring gap seen from 3/4.
4. Ghost duplicate callouts at step 2.

Stage 6 `hestegorria` (other agent): not inspected.
