# Topic 14 polish, stages 6–16 (foregut): handover 2026-11-02 20:00

Status: a short first pass, cut off by the 20:00 stop. `npx tsc --noEmit -p .` was clean after the last edit.
**None of the changes below has been rendered yet.** Shoot them before you trust them.

## Defects found (audit shots at 1440×900, compared with the PDF figures)
- **Stage 7 `urdail-biraketak` (p3 A–E)**: the stomach is a symmetric lemon or capsule: no J, no fundus, no
  concave lesser curvature, no narrow pyloric part. Neither rotation axis was drawn (p3 A and D draw them). The
  greater and lesser curvature lines barely show. The context (lungs, kidneys, liver) is dark and muddy, and the
  subject is small in the frame. Step 3 at une=0.3 still shows the top-view disc (the glide starts there).
- **Stages 8–10 (p3 sections A/B, p4)**: the live transverse section planned in `topic-14-plan.md` §3 ("Live
  cross-section, synced with the 3D") **was never built**. The bursa is a pale green blob behind the stomach, and
  it does not read like p3 A/B.
- Stages 6 and 11–16 were not audited (no time).

## Changed
- `components/scenes/week14/foregut-model.ts`
  - :245 `stomachAxis(p,u)`: a bent centreline that turns into a J as `grow` rises. The body bows towards the
    greater curvature and the pyloric part turns up towards the lesser curvature.
  - :251 `stomachLocal`: rings stay square to the bent axis; the profile tapers to the pyloric canal; a fundus
    bulge rises above the cardia on the dorsal (greater) side.
  - The cardia, the pylorus sleeves, the cut cap and the duodenum start (:323) now use `stomachAxis`, so the
    duodenum stays attached to the pylorus. Stages 11–16 move slightly as a result: check them.
  - New pose fields `axisL` and `axisAP` (:99, FP0 :152). They draw rotation-axis rods (id `urdail-ardatza`,
    :518–530), visible only while the stomach turns about them.
- `components/scenes/week14/Foregut3D.tsx` spec7:
  - step 2 (:148) adds `axisL: 1` and the name "Luzetarako ardatza";
  - step 3 (:163) fades `axisL` back to 0;
  - step 4 (:176) adds `axisAP: 1` and the name "Aurretik atzerako ardatza";
  - step 5 (:190) fades `axisAP` to 0.
- `content/weeks/week14-structures.ts` :157: new structure `urdail-ardatza` ("Biraketa ardatza", category
  `ardatza`, as weeks 5 and 8 use). If a test rejects that category for topic 14, switch it to `anatomia`.

## Still to do (priority order)
1. Render stage 7 at une 0.25 / 0.45 / 0.6 / 0.98 and check the J shape: no self-intersection at the pylorus,
   the fundus not poking through the diaphragm, the duodenum joined to the pylorus. Then check stages 11 and 15
   for regressions from the moved pylorus.
2. **Build the synced transverse-section inset** (biggest teaching win), through `StageSpec.over` (common.tsx
   already passes `(t, at, pose)`). Put it bottom-left at about (16,404) 232×196; bottom-right holds the camera
   keys. Draw it in 2D, computed from the pose:
   - body, vertebra, aorta, IVC, red kidneys, and the cavity lined by the orange-red parietal peritoneum;
   - the stomach as two painted halves (postWall / antWall), rotated by 90°·rotL − 30°·rotAP·rotL and moving
     left with rotL;
   - the dorsal mesogastrium as a two-layer band from the dorsal midline to the greater curvature, through the
     spleen when `spleen` > 0 (splenorenal and gastrosplenic named);
   - the liver moving right, the lesser omentum from the lesser curvature to the hilum, the falciform to the
     anterior wall;
   - the bursa as the cavity-green region enclosed by the meso, the stomach's back, the lesser omentum and the
     posterior wall, with "Winslow" at the right-hand gap when `edge` > 0.5;
   - lit = the step's `dim` list, the rest faded.

   Show it in stage 7 steps 2 and 7, all of stage 8, stage 9 steps 1–2, all of stage 10, and stage 13's last step.
3. A sagittal inset for stage 9 steps 3–6, as in p3 bottom A/B: the greater omentum's two leaves hang to
   `lerp(-0.4, 0.85, omentum)`, the gap between them is `0.1·(1−omFuse)`, the posterior leaf comes down onto the
   transverse mesocolon as `omFuse` rises, and the inferior recess fades with omFuse.
4. Stages 15–16 (p5 top, p6): ventral bud blue / dorsal red; the duct fusion (Wirsung, Santorini, papillae) shot
   close up; the pancreas made more solid. Then 11, 12–14, 6.
5. Make the context organs read better: brighter kidneys (FC.kidney), and less of the dark posterior-wall sheet.

## Screenshot tool
Own driver: `C:\Users\aitor\AppData\Local\Temp\claude\C--Users-aitor-Downloads-1-MEDICINA\42ea7305-b271-4c43-b787-7201193d9d96\scratchpad\fg\shots.mjs`
(self-contained CDP, port 9342, absolute profile in the same folder). Usage:
`node shots.mjs <outDir> 1440 900 "stage@une,stage@une"`. The old shots14.mjs failed because perf-topic10.mjs
hard-codes port 9341; this driver has no imports. Under load each shot takes about 30–90 s: run it in the
background. Before shots are in `scratchpad\fg\before\`.
