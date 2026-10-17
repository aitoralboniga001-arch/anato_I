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

