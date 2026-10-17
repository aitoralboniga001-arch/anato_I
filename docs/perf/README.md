# Topic 10 3D performance

Measured with `scripts/perf-topic10.mjs`: headless Chrome on a production build (`next build && next start -p 3100`). The GPU is a Radeon 780M (ANGLE D3D11) at 1440×900 and 768×1024. Each run opens the 3D view of each topic 10 stage at stage time 0.55 and measures three scenarios:
- **held:** 3 s, nothing happening;
- **dragged:** 1.8 s, the viewer turning the model;
- **played:** 3 s.

| Folder | What |
|---|---|
| `topic10-baseline/` | Original code with the work counters only. Its "held" numbers are inflated by the harness's frame sampler (fixed afterwards); use it for the counters. |
| `topic10-baseline-v2/` | Original code (counters stashed away) with the fixed harness: the fair "before" for timings. |
| `topic10-batch1/` | After Batch 1 of `docs/review/topic-10-3d-execplan.md`. |

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
