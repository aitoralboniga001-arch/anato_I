# Topic 10 3D performance

Measured with `scripts/perf-topic10.mjs`: headless Chrome on a production build (`next build && next start -p 3100`). The GPU is a Radeon 780M (ANGLE D3D11) at 1440×900 and 768×1024. Each run opens the 3D view of each topic 10 stage at stage time 0.55 and measures three scenarios (and, since Batch 2, plays six views where blood cells flow):
- **held:** 3 s, nothing happening;
- **dragged:** 1.8 s, the viewer turning the model;
- **played:** 3 s.

| Folder | What |
|---|---|
| `topic10-baseline/` | Original code with the work counters only. Its "held" numbers are inflated by the harness's frame sampler (fixed afterwards); use it for the counters. |
| `topic10-baseline-v2/` | Original code (counters stashed away) with the fixed harness: the fair "before" for timings. |
| `topic10-batch1/` | After Batch 1 of `docs/review/topic-10-3d-execplan.md`. |
| `topic10-batch1-flow/` | Batch 1 code, measured again with the blood-cell points added to the harness: the fair "before" for Batch 2. |
| `topic10-batch2/` | After Batch 2 (blood cells drawn by the GPU). |
| `topic10-batch3-before/`, `-before-dpr2/` | Batch 2 code with the GPU bench, at DPR 1 and 2: the "before" for Batch 3. |
| `topic10-batch3/`, `-dpr2/` | After Batch 3 (shader detail fade, thin walls, shared light). |
| `topic10-batch5/` | After Batch 5 (pointing outlines held while turning, normal welding without strings). |
| `topic10-batch4/` | After Batch 4 (blood in the vessels at stages 3 and 9); adds the stage 9 rerouting point (une 0.45). |

Screenshots (`shots/`) are written next to each `results.json` but are not kept in git. Compare two runs' pictures with `node scripts/perf-topic10.mjs compare <dirA> <dirB>`.

## Batch 1 (2026-10-16): stop redundant work

Averages over the 12 measured views:

| | Before | After |
|---|---|---|
| Played: main thread busy | 1040 ms/s (saturated) | 552 ms/s |
| Played: frame time p50 / p95 | 40 / 54 ms (15–30 fps) | 16.7 / 19.7 ms (60 fps) |
| Played: long tasks per 3 s | 7.4 | 0.2 |
| Played: meshes built / SVG projections / GPU uploads per s | 803 / 718 / 718 | 0 / 40 / 0 |
| Dragged: script | 390 ms/s | 234 ms/s |
| Held: 3D frame loop ticks | 53 /s | 0 /s |

A held view's remaining main-thread time is not 3D work: every 3D counter reads zero. Without the harness attached, a held view costs about 8 ms/s. Some runs catch a single long task of about 300 ms a few seconds after load. It happens in the original code too, and its source has not been identified yet.

Pictures at the same stage time are the same before and after. The largest difference is 0.27% of pixels, on stage 2, at the level of run-to-run noise.

View changes checked frame by frame on the new build:
- a named-side turn, ↺ reset, zoom and a hover glide each render at about 60 fps for the move, then stop;
- the stage 4→5 glide renders throughout;
- the stage 9 3D→frontal bridge and the stage 10 room→cut bridge turn the 3D and land on the cut.

Still the biggest cost: turning the model. Each frame re-projects every item to SVG for pointing (about 600 projections/s), now on coarse hit meshes.

## Batch 2 (2026-10-17): blood cells drawn by the GPU

Before Batch 2, each played frame with blood flowing built 26 cell meshes, merged them, uploaded them and projected them to SVG. Now one cell mesh is drawn 26 times. Each copy's place along a 32-point route comes from its start plus one phase number per frame, interpolated rather than snapped to the nearest centreline point.

Averages over the six blood-flow views (stages 3, 4, 6, 7, 8 and 9; playing, 1440×900):

| | Before | After |
|---|---|---|
| Main thread busy | 867 ms/s | 614 ms/s |
| Script | 722 ms/s | 446 ms/s |
| Frame time p50 / p95 | 17.8 / 24.1 ms | 17.9 / 18.3 ms |
| Meshes built / GPU uploads per s | 1390–2720 / 107–209 | 0 / 0 |

- **Other views:** the views without cells are unchanged (within run-to-run noise).
- **Pictures:** cells sit where they did before. They are now opaque, and they grow in one by one instead of fading as a whole. The shots differ by at most 0.4% of pixels.
- **Frame-time baseline:** this run's p50 sits at 17.8 ms for every view, before and after, rather than 16.7 ms. This is a machine-state difference between days, so compare within a run.

## Batch 3 (2026-10-17): the shader, measured on the GPU

`gpuMs` in the results is the GPU time for one held picture: the median of 5 timings, each of 30 pictures drawn back to back and ended by waiting for the GPU. `DPR=2` emulates a retina or tablet screen.

| | DPR 1 | DPR 2 |
|---|---|---|
| Before (Batch 2 code) | 0.65 ms (0.48–0.85) | 0.96 ms (0.64–1.39) |
| After | 0.68 ms | 0.94 ms |

- **The GPU has plenty of room:** under 1.5 ms of a 16.7 ms frame, even at DPR 2. Quadrupling the pixels adds only about 0.3 ms, so the texture maths is not where the time goes.
- **The changes are cost-neutral within noise.** About half the views are faster and half slower, with swings of up to ±15% between runs.
- **Pictures:** they differ by at most 1% of pixels (cell timing and labels).
- **Not done:** a texture bake and a DPR cap below 2 would save almost nothing, so neither was done.

## Batch 4 (2026-10-17): blood in the vessels

- **Stage 3 at une 0.9** (the vessel cells on): about 90 more cells, each drawn as part of an instanced stream. Main thread 702 → 631 ms/s (run-to-run noise; no cost visible). GPU 0.67 → 0.84 ms per picture, from the extra instanced draws; still under 1 ms.
- **Stage 9 at une 0.45** (new point): about 1000 ms/s main thread and 1100 mesh builds/s while playing. This is the anatomy changing shape every frame: the horns shift and the left veins close, over about 0.07 of the stage. The vessel cells add no mesh builds. It is the remaining playback hot spot.

## Batch 5 (2026-10-17): turning and the closing veins

| | Before (Batch 4) | After |
|---|---|---|
| Dragged: script | 220 ms/s | 144 ms/s |
| Dragged: SVG projections per s | 373 | 10 |
| Stage 9 closing (une 0.45, played): main thread | 1021 ms/s | 798 ms/s |
| Stage 9 closing: frame p95 | 36 ms (30 fps) | 18 ms (60 fps) |
| Played, all views: SVG projections per s | 65 | 14 |

Pictures are within 0.13% of Batch 4. From this run on, a stage's later blood point gets its own shot (`flow-zain-sinua@0.45.png`). Before, it overwrote the first one.

## Batch 6: crash safety + polish (2026-10-17)

The reproducible all-topic survey is now `scripts/perf-3d-polish.mjs`. It measures all 13 3D views at 1536×960 CSS pixels, DPR 2, stage time 0.55, and captures held and eight-wheel-tick close-ups. `polish-batch6-before/results.json` is commit `25fae30`, built in an isolated temporary source copy; `polish-batch6/results.json` is this batch. Both use the Radeon 780M through ANGLE D3D11. The baseline copy only changes Turbopack's filesystem root so it can use the existing dependency junction.

| View / measure | Before | After |
|---|---:|---:|
| Topic 7 diaphragm, played main thread | 1030 ms/s | 591 ms/s |
| Topic 7, frame p95 | 33.4 ms | 16.8 ms |
| Topic 9 domains, played main thread | 1037.4 ms/s | 756.5 ms/s |
| Topic 9, frame p95 | 33.5 ms | 17.0 ms |
| Topic 9, draw + completion time per picture | 7.46 ms | 3.64 ms |
| Topic 8 calvaria, drawn triangles including outlines | 292,724 (previous survey) | 240,544 |

The final run records CPU reductions of about 43% (diaphragm) and 27% (domains). An earlier repeat recorded about 49–50%; these short samples vary. Domains also caught a one-off 235 ms main-thread task in the final playback sample, visible in the raw result. The GPU sample is **not** a hardware timer query: it includes CPU submission and a readback waiting for completion. This survey uses the median of three eight-draw samples, with one browser and cooling gaps between views; the older harness used five thirty-draw samples. Compare the new before/after pair, not these absolute GPU values with the earlier table. The domains' hoped-for 2 ms GPU target was not reached; the CPU/frame-time improvement is clearer across repeats. An earlier after-pass measured 7.10 ms per picture versus the final 3.64 ms, so a repeatable GPU saving of a particular size has not been established. Its drawn triangles fell from the previous survey's 1.18 million to 555,704, but translucent overdraw and draw submission still cost time.

Across all 13 sampled views, mean played main-thread work is 642.4→609.7 ms/s. Both runs report zero runtime exceptions. `pixel-diff.txt` records all 26 held/zoomed comparisons. At the held scale: diaphragm 0% changed; skull 0.084%; limb 0.025%; heart views 0.439–2.267%; domains 6.386% (the camera also changed). The largest close-up difference is domains at 16.598%; these are intentional appearance/framing changes, not a claim of pixel equivalence. The cut-face rims and landmarks were inspected visually as well. A 390×844, DPR 2, reduced-motion smoke survey of diaphragm, domains and the ventricular heart view is in `polish-batch6-mobile/results.json`; all three render without runtime exceptions.

Changes and visual review:

- Diaphragm deformations are cached by the parameters that actually move them. Domains use fewer samples along their extrusion and skip hidden/unchanged frontier deformation. Its camera holds after entry instead of slowly orbiting throughout playback; explicit orbit controls still work.
- Label seating follows cached slot owners and searches at most every 150 ms while the anchors move, with a final settled update.
- Heart seams nest the overlapping segment end. The AV canal is now a segment of the narrowed tube, rather than a raised sleeve intersecting it. Inflated outline hulls are omitted from the looped walls where they cut through the surface as false cracks. Both reported ventricular and atrial close-ups were inspected.
- Muscle fibres are softer and broken into bundles. Internal skull membranes and sutures no longer have inflated outlines protruding through bone. The calvaria's sampling resolution was retained: its fontanelles and grooves are teaching landmarks, and removing the redundant outlines already reduced triangles.
- Limb colour boundaries clip crossing triangles at a shared border instead of assigning whole triangles. This removes the red/blue saw teeth without opening a seam; draw triangles rise modestly (127,648 → 134,312), without changing the limb surface.
- The shared tube bend guard was retained after the held/zoomed survey; it is not credited with fixing the heart crack. Remaining coarse venous junctions and anatomical suture edges can still be seen at high zoom; this batch does not claim seamless remeshing of every vessel junction.

Crash mitigation and proof:

- The drawing buffer is capped at 3.2 million pixels on resize. The browser check measured 2281×1402 pixels at a 2400×1600 CSS viewport, DPR 2, then successfully resized back.
- A real `WEBGL_lose_context` event disposes the active renderer and switches to the SVG drawing. A subsequent flat→3D view switch stays flat for the rest of that document visit. No retries or mesh uploads to the lost context. `polish-batch6/fallback.json` records this check with no runtime exceptions.
- The harness no longer bypasses the browser's GPU blocklist. Diagnostic globals are installed only when `__perf` is enabled.
- TypeScript and the production build pass. Full Vitest: 31 files, 1084 tests pass; focused cache/partition/render-cost checks also pass after the final model changes. The final serial topic 10 label/visibility run passes all 51 selected checks (one concurrent run hit the existing 15-second per-test timeout; its isolated and serial reruns pass). Focused ESLint has the same eight existing errors (seven in `Stage3D.tsx`, one in `columns.tsx`), with no additional errors.

The Windows event was re-read: Kernel-Power 41 records bugcheck 307 (`0x133`, `DPC_WATCHDOG_VIOLATION`). That confirms a watchdog timeout, **not which driver caused it**. The GPU attribution in the original handover remains unproven without a dump. See [Microsoft's diagnostic description](https://learn.microsoft.com/en-us/windows-hardware/drivers/debugger/bug-check-0x133-dpc-watchdog-violation). Checking for a supported graphics-driver update is sensible; [AMD's official detection tool](https://www.amd.com/en/resources/support-articles/faqs/GPU-Driver-Autodetect.html) can identify available packages. No driver was installed by this work.

Lessons for the next batch: cache deformation by pose inputs; throttle expensive label arrangement, then settle it; distinguish outline-hull artifacts from geometry cracks; avoid coincident sleeves over existing walls; clip material boundaries instead of colouring whole triangles; cap pixels independently of DPR; and verify context-loss disposal with an actual browser event.


## Batch 7: all-model workload limits and GPU resilience (2026-10-17)

Audit and implementation: [all-model report](../review/3d-performance-resilience.md). Every current Stage3D view is covered. Source/build validation: **1115 tests in 33 files pass**, production build including TypeScript passes; focused new/shared-code lint passes. The expanded shell/Stage3D scope retains nine pre-existing errors (seven Stage3D, one Simulator, one Viewport), with the shell findings reproduced from HEAD. No new runtime dependency, anatomy sampling reduction, render pass, push or deployment.

The final 13-view survey uses the same bounded harness, 1536x960 CSS, DPR 2, stage time 0.55. Its baseline is the committed Batch 6 after result (`polish-batch6/results.json`, code at `5b97561`). New representative baseline samples of calvaria, domains and ventricle are in `renderer-audit-before/results.json`; keep these separate from the full 13-view baseline. `renderer-audit/comparison.json` records both rather than mixing them into one mean.

**Mean main-thread work over the 13 two-second playback samples: 609.7 -> 244.4 ms/s (59.9% less).** These samples include reading holds and phases whose anatomy is static. This is not a claim of that percentage for every continuously deforming pose, overall machine CPU, battery power or GPU utilization. The calvaria sample is already in a manual reading hold: its published poses and GPU draws both fall to zero. Short-run machine/thermal variation remains.

| Topic / 3D view | Prior Batch 6 CPU ms/s | Final CPU ms/s | Final GPU draw+completion ms | Draws/s during playback |
|---|---:|---:|---:|---:|
| 7 / diafragma-eraketa | 591 | 242 | 1.225 | 0 |
| 8 / buru-ganga | 483.8 | 72.4 | 2.45 | 0 |
| 8 / gorputz-adarrak | 607.4 | 278.4 | 1.363 | 0 |
| 9 / domeinuak | 756.5 | 208.4 | 3.512 | 0 |
| 10 / bihotz-hodia | 516 | 317.2 | 1.2 | 0.5 |
| 10 / zirkulazio-goiztiarra | 614.7 | 142.3 | 0.9 | 0.5 |
| 10 / bihotz-atalak | 675.1 | 372.6 | 1.013 | 27 |
| 10 / bihotz-lakioa | 641.6 | 146.8 | 1.138 | 1 |
| 10 / atal-bulbarra | 654.8 | 152.5 | 1.537 | 0.5 |
| 10 / atal-bentrikularra | 577.5 | 343.8 | 1.375 | 1 |
| 10 / atal-aurikularra | 615.1 | 344.6 | 1.525 | 1 |
| 10 / zain-sinua | 585.4 | 408.1 | 1.712 | 12 |
| 10 / eskuineko-aurikula | 607.6 | 147.6 | 1.512 | 1 |

The fresh three-view baselines are calvaria 572.7, domains 649.2 and ventricle 673.6 ms/s, versus final 72.4, 208.4 and 343.8. The calvaria baseline also caught a one-off 302 ms startup task. These numbers are individual diagnostics, not the denominator of the 13-view mean. Its automatic Kimu search-index warm is now triggered by hover/focus/open rather than a timer.

GPU timings are bounded CPU-submission + completion-readback samples, not hardware timer queries. Domains remains the most expensive held picture at 3.512 ms and 555,704 drawn triangles. The pixel cap lowers raster resolution; no teaching geometry was coarsened in this batch. Motion presentation and pose publishing deliberately use a nominal 30 Hz ceiling; sample counters can show 30.5/s at a measurement-window boundary. The independent page RAF frame metric is not the 3D presentation rate.

The separately checked closing-vein phase (`AT=0.45 FILTER=zain-sinua`) records **556.4 ms/s**, about **29 pose updates and GPU draws/s**, **754 mesh builds/s** and **377 slot uploads/s**. Its p95 page RAF interval is 17 ms, with no runtime exceptions or long tasks in the sampled interval. See `renderer-audit-flow/results.json`. This is still meaningful procedural construction work: persistent deformation buffers remain a measured next candidate. The historical 798 ms/s figure used a different viewport/harness, so it is not presented as a matched before/after percentage.

Implemented shared protections: unchanged-frame comparison and coalesced uploads; 30 Hz drawing and both simulator/class pose loops; duplicate reading-hold positions suppressed; explicit document/intersection suspension; 2M-pixel final and intermediate buffers with device dimension limits; browser-default power preference and refusal of major performance caveats; lazy context/geometry requests; worker termination after delivery; GPU buffer/material release after 180 ms parked, context disposal after 5 s, immediate disposal for detached hosts; weak host metadata; immutable cached-pose ownership and correct UV/index updates; session-persistent flat fallback after loss/creation failure.

Browser evidence:

- `renderer-audit/resilience.json`: 2D topics 1/7/8/9/11 create zero WebGL contexts/workers; domains creates and terminates one geometry worker; all tested final and intermediate buffers stay below 2M pixels; held/offscreen/hidden rendering sleeps; parked geometry releases and the context disposes; real context loss and context refusal both retain flat fallback after reload.
- `renderer-audit/playback.json`: real timeline progress matches elapsed-time playback; hidden pause/resume does not jump; a manual hold stays exactly at t=0.5249 with no pose updates/draws; camera turn wakes and settles; SPA navigation immediately loses the detached context; topic 10 class publishes 30 poses/s and stops on pause. Class speech uses the supported subtitle/timer fallback in the diagnostic browser.
- All 13 final held/zoomed views load with zero runtime exceptions, and every measured buffer stays below 2M pixels. Held skull/domains and the ventricular heart close-up were visually inspected; small views keep DPR 2 while large views are somewhat softer.
- `renderer-audit/pixel-diff.txt` records all 26 held/zoomed view comparisons against Batch 6: 0.349–1.370% of pixels differ by more than 2 colour levels, and at most 0.142% by more than 40. This is consistent with the intentional raster-resolution change, not pixel equivalence. The baseline's auxiliary `contact.png` montage is outside the 26-view comparison set and has no matching after montage.

The existing Windows bugcheck 0x133 still has an UNKNOWN responsible driver. Lower bounded workload and tested WebGL recovery are app-side mitigation; an OS-level crash can occur before JavaScript receives any context-loss event. No driver, registry or browser blocklist setting was changed. See the audit for the remaining driver/dump diagnostic boundary.

## Batch 8: Topic 10 CPU follow-up (2026-10-17)

[Scoped implementation and evidence](../review/topic10-performance-followup.md). The final nine-view survey is in `topic10-focused/results.json`; `comparison.json` retains the earlier Batch 7 comparison and the separate fresh closing-vein baseline/final/repeat. Mean sampled main-thread work is 263.9 -> 236.0 ms/s (10.6% less). The continuous closing-vein phase is 538.9 -> 492.4 / 474.5 ms/s (8.6–12.0% less). GPU and frame-time readings vary; triangle counts are unchanged. These are modest CPU savings in bounded samples, not a universal frame-rate/GPU claim.

Topic 10-only changes reuse tube plans/layouts, bounded complete heart/atrium snapshots and centrelines, and the per-lesson class estimate. Shared renderer safeguards remain unchanged in this pass. All 1,171 tests in 35 files, final build/TypeScript and focused lint pass. `topic10-focused/fallback.json`, `playback.json` and `pixel-diff.txt` record actual context loss, class pause and all 18 Topic 10 visual pairs. No subagents, commit, push or deployment.

## Batch 9: Topic 10 30/40 fps experiment (2026-10-17)

[Method, results and limits](../review/topic10-30-vs-40-fps.md). `topic10-fps/results.json` contains the 52-sample comparison plus class/control/recovery checks; `topic10-fps-atrium/results.json` retains four corrected early-valve samples. `topic10-fps/summary.json` separates continuous motion from static/reading phases. True 40 fps draws about 39–40 times/s, with 12–24% higher main-thread work in four moving cases and about 45% higher work in a separate short class glide. GPU submission counts rise; exact GPU utilization was not measured. Default stays 30. All 1,176 tests, build/TypeScript and focused lint pass; class pause, hidden/resume and actual context-loss/reload fallback pass at 40. No subagents, commit, push or deployment.

## Topic 11: all 11 3D views (2026-10-19)

`FILTER=11/ WIDTH=1440 HEIGHT=900 node scripts/perf-3d-polish.mjs http://localhost:3111 docs/perf/topic11` on a production build (Radeon 780M, stage time 0.55). Every view plays at 60 fps (p95 frame 16.8–17.1 ms) with no errors. Main-thread work while playing is 150–430 ms/s, inside topic 10's range after its batches. The GPU bench (median of 3 × 8 draws, where measured) is 2.4–6.5 ms per picture. The septa and walls views draw 74k triangles; the ventricles and outflow 34–64k.

| Stage | Main thread ms/s (playing) | p95 frame ms | GPU ms | Triangles |
|---|---|---|---|---|
| trenkadatze-mekanismoak | 260.4 | 17 | 3.463 | 67824 |
| septum-primum | 150.7 | 17.1 | – | 73608 |
| zulo-obala | 405.2 | 17.1 | – | 73608 |
| jaiotza | 422.8 | 17.1 | – | 73608 |
| aurikulen-paretak | 345.9 | 17 | – | 73608 |
| erreten-ab | 401 | 17.1 | 3.3 | 34096 |
| balbula-ab | 432.3 | 17 | 6.488 | 43688 |
| bentrikulu-arteko-trenkada | 374.3 | 16.8 | 2.6 | 50520 |
| arteria-konoa | 356.2 | 16.8 | 2.9 | 50864 |
| enbor-arteriosoa | 326.7 | 17 | 2.425 | 54896 |
| balbula-semilunarrak | 399.9 | 16.9 | 3.55 | 63224 |
