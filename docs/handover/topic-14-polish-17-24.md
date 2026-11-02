# Topic 14 polish — stages 17–24 (handover, 2026-11-02 20:00)

**State: audit only. No source file was changed** (Midgut3D.tsx, midgut-model.ts, Cloaca3D.tsx, cloaca-model.ts,
week14.ts and week14-structures.ts are untouched by this agent). Stages 18–19 were shot and compared with PDF p7;
20–24 and 22 (cloaca) were not shot yet.

## Screenshot tool (fixed, own copy)
`C:\Users\aitor\AppData\Local\Temp\claude\C--Users-aitor-Downloads-1-MEDICINA\42ea7305-b271-4c43-b787-7201193d9d96\scratchpad\s1724\shot.mjs`
- Self-contained (no import from `scripts/perf-topic10.mjs`, whose `launch` hard-codes port 9341, so two
  agents sharing it swap frames). Port 9343, absolute profile dir `...\scratchpad\s1724\profile`.
- `node shot.mjs <outDir> <W> <H> "stage@une,stage@une"`; waits for `.viewport-underlay canvas.is-ready` + 2.5 s.
  About 30 s per shot with the shared dev server; run it in the background for more than ~8 shots.
- `sheet.py` in the same folder: `python -I sheet.py out.png 2 files...` makes a contact sheet.
- Before shots: `...\scratchpad\s1724\before\` (stage 18 step ends 0.15/0.31/0.45/0.59/0.73/0.97, stage 19
  0.17/0.35/0.53/0.71/0.85/0.98, 1440×900); sheets `sheet18.png`, `sheet19.png`.

## Defects found (18–19 vs p7)
Stage 18 `heste-lakioa` (Midgut3D.tsx spec18 ~l.126–208; model midgut-model.ts `loopLine` l.225–251):
1. The loop is tiny on screen (about 1/8 of the viewport) and thin (r 0.075–0.08, l.349–350): it reads as a pink
   hairpin, not the p7 A loop. Limb colours (MC.cephalic / MC.caudal, l.30–31) are too close to each other.
2. The hairpin is narrow (`w = ±0.3`, l.235): seen from the front (step 6) both limbs overlap and the loop runs
   along the view direction, so the 90° turn is foreshortened and not readable.
3. SMA branches never show in stage 18 (`sma` is set to 0 in step 1 and never raised): p7 A's red fan from the
   SMA to both limbs is missing; the axis is a lone trunk.
4. Nothing shows the direction of the turn: no arc arrow round the SMA, no "90°" readout. The rotation verb is
   not visible enough (narrated-actions-shown).
5. The caecal bud is a small blob hidden at the bend (step 4); the vitelline duct goes off-screen with no yolk sac.
6. Step 6 camera: front view at dist 9.4 — the subject is small and the translucent cord (opacity 0.22, l.402)
   is a grey smear.

Stage 19 `hernia-fisiologikoa` (spec19 ~l.214–296):
7. Step 1 (from the left): the extraembryonic coelom is a muddy green ellipsoid (l.406), the cord is barely
   visible; the loop inside it is small.
8. The jejunal "coils" are a planar zigzag (adult `finalLine` jejunum keys l.214; herniated `wig` sinusoid
   l.237) — the "noodles" complaint. Need 3D coils (prolate trochoid / alternating-plane U-bends) like p7 middle
   A/B and p8 summary.
9. Step 2–3: the staggered return (jejunum first) is not readable — no camera follow, the rest just dims.
10. Step 5 (caecal descent) works but the caecum + appendix is a sphere + stub; p7 bottom A–C (conical bud →
   caecum with appendix, ileum entering from the side) is not matched.

## Plan, priority order (what I was about to do)
1. midgut-model.ts: widen the hairpin (w ≈ 0.55), thicker tubes (r ≈ 0.11), stronger limb contrast; caecal bud
   as a cone on the caudal limb; small yolk sac at the vitelline duct's far end (id check in week14-structures).
2. Spec18 step 5: `to: { sma: 1 }` so the SMA branches fan to both limbs (p7 A).
3. A 3D arc arrow (tube + cone, item with no id) round the SMA axis, its swept angle = current rotation, plus a
   "90°" / "270°" readout via the spec's `over` (motion arrow, not a pointer). Cameras oblique (yaw ≈ −25°,
   elev ≈ 18°, closer) so the turn reads with depth.
4. Coils: replace the zigzag/sinusoid with trochoid loops (more samples: N 150 → ~260; check `smaBr` step and
   mesentery row step scale with N).
5. Spec19 steps 2–4: camera follows the part returning (jejunum to upper left, then caecum under the liver).
6. Then 22 (cloaca vs p8 top A–C), 20, 24 (p8 colour key: yellow intra / red primary retro / orange secondary
   retro — note the model uses green/orange/purple, MC.intra/retro/extra l.37–39), 17, 21, 23.

## Tests
None run (no code change).
