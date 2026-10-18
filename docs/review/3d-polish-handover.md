# 3D polish and crash-safety: handover (2026-10-17)

The user reported two problems:
- A close-up of a topic 10 heart model with glitches: ring stripes, jagged teeth at seams, and a black crack.
- "My computer crashed in one of those, we still need to tackle performance."

Original handover state: usage ran out mid-batch; the changes below were uncommitted on top of `25fae30`. The continuation records at the end supersede the original pending list. The latest continuation is the [Topic 10 30/40 fps experiment](topic10-30-vs-40-fps.md). The normal production default remains 30 fps.

## What the crash was
- Windows System log, 17/10/2026 10:29:
  - Kernel-Power 41;
  - BugcheckCode 307 = **0x133 DPC_WATCHDOG_VIOLATION**;
  - no dump was written.
- Laptop: Lenovo 83E3 with an **AMD Radeon 780M** (integrated graphics, shares RAM). Screen 3072×1920, so the browser runs at DPR 2. Driver 32.0.31041.1004.
- The code confirms a driver/kernel watchdog timeout, but does not identify the responsible driver. The GPU attribution is unproven without a dump. Lower graphics load and a supported driver update are mitigations, not a confirmed root-cause repair.
- My headless benchmarks may also have run at that time; this is not certain.

## Measurements (before the changes)
Taken at 1536×960 CSS, DPR 2, on the real 780M:
- Scratch scripts: `all3d.mjs`, `prof.mjs`, `zoomshot.mjs` in the session scratchpad. They are not in the repo; recreate them from `scripts/perf-topic10.mjs` if needed.
- GPU per picture: 1–2.6 ms for every view except **topic 9 "domeinuak": 4 ms with 1.18M triangles**.
- Playing, main thread:

| View | Main thread | Frame p95 | Cause |
|---|---|---|---|
| Topic 9 domeinuak | 1010 ms/s | 50 ms | label re-seating every frame (camera drifts), projections, React |
| Topic 7 diafragma | 1021 ms/s | 33 ms | `deform()` of 14 meshes on **every** frame, even when nothing moves (~540 ms/s) |
| Topic 10 views | 600–750 ms/s | mostly 17 ms | — |

## Changes made (uncommitted)
1. `lib/three-d/sdf.ts`
   - New `deformBy(mesh, params, move, slot)`: remembers the last deformation per mesh and params.
   - `surfaceMesh` step can be per axis (`[hx, hy, hz]`).
2. `components/scenes/week7/DiaphragmDome3D.tsx`: uses `deformBy` keyed on `domeK`, `memGrow`, `open` and `rimK`. The lift is skipped while `domeK === 0`.
3. `components/scenes/week9/Domains3D.tsx`:
   - The frontier is deformed only while it shows, via `deformBy`.
   - Extruded parts use `along(step)`, which coarsens the z step to 0.04.
   - dermato step 0.0135, parietal 0.021, abax 0.03, ecto 0.026.
   - Result: drawn triangles 1.18M → 556k.
4. `components/kit/columns.tsx`:
   - The label seating is cached as "name → slot owner" and reused for up to 150 ms while the points drift (same names drawn). A timer re-seats once the points settle.
   - `clock()` returns -Infinity without `performance`, so every render searches, as before.
5. `components/kit/three/gl.ts`:
   - `PIXEL_BUDGET = 3.2e6` caps the drawing buffer; the ratio is recomputed on resize.
   - `webglcontextlost` sets a module flag (`glWasLost`, `onGLLost`). After that, `createGL` returns null and the views stay flat for the rest of the visit.
   - `__glInfo` (draw calls, triangles, buffer size) is installed only when `__perf` is on, for the harness.
   - Muscle fibres are softer and grouped in bundles (`* smoothstep(0.3,0.75,noise(vObj*6+1.7))`, amplitude 0.32 → 0.22). This fixes the "ring stripes".
6. `components/kit/three/Stage3D.tsx`: subscribes to `onGLLost`, then switches to flat and disposes the parked layer.
7. `lib/three-d/mesh.ts` `tube()`: on tight bends, the inner side of the tube is drawn in towards the bend (`x > 0.7` → tanh soft limit), so the wall cannot fold through itself.
   - This is a general safety change. It did NOT turn out to be the cause of the crack.
   - **Check that pictures in topics 7–10 barely change; revert it if they do.**
8. `components/scenes/week10/model3d.ts`:
   - Each segment's end is tucked 3% narrower where the next segment overlaps it. This fixes the z-fighting "teeth" at the seams; verified gone in a zoom shot.
   - The AV-canal collar (`av-canal`) ends taper from 1.06 to 0.95, so its open rim sinks into the wall. This is the fix for the **black crack**: the rim used to stand off the ventricle and show its dark inside.
   - **Not yet verified visually.** The last build succeeded; a server was started on port 3110, but its zoom shot was never looked at.

## Original pending list
1. **Verify:**
   - `npx tsc --noEmit -p .`, then `npx vitest run` (1079 tests passed before changes 7 and 8).
   - Lint: only the errors that were already there (7 in Stage3D, 1 in columns.tsx line ~215 `col.drawn`).
   - `next build && next start -p 31xx`. Zoom into `/astea/10?etapa=atal-bentrikularra&ikuspegia=3d&une=0.55` around CSS (680, 500), with 8 wheel ticks at 1536×960 DPR 2. Expect no black crack, no teeth, soft fibres. Do the same for `atal-aurikularra`.
2. **Re-measure** all 13 3D views (topics 7, 8, 9 and topic 10's nine stages) at 1536×960 DPR 2. Compare with the table above:
   - topic 7 and topic 9 playing should drop well below 1000 ms/s;
   - topic 9 GPU should be about 2 ms.
3. **Pixel-diff** held shots before and after for topics 7–10:
   - topic 9 changes slightly, because of the coarser meshes; check the cut-face rims for blockiness;
   - other views change only through the fibres and the tube bend guard.
4. **Zoomed glitch survey** of every 3D view ("some 3d models need some polishing"). Look for open rims standing off walls, coincident surfaces (teeth), and stripes. Same rule as the memory note "fix siblings".
5. **Topic 8 calvaria** has 293k triangles. Consider coarser steps like topic 9's if its GPU time stays at 2.6 ms.
6. **Docs:**
   - add a "Batch 6: crash safety + polish" section to `docs/perf/README.md` and `docs/review/topic-10-3d-execplan.md`;
   - add lessons to memory `reference-abyssal-3d-lessons.md`: deform caching, the label reseat throttle, open-rim cracks, overlap z-fighting, pixel budget, context loss.
7. **Commit** (the user gave blanket permission earlier). End the message with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
8. **Tell the user:**
   - the crash was a 0x133 driver watchdog;
   - what was reduced;
   - suggest updating the AMD driver.

## Continuation completed (2026-10-17)

- Production build and `npx tsc --noEmit -p .` pass. Full tests: **1084 passed in 31 files**, using two workers and a 20-second test timeout to avoid saturating the laptop during synchronous scene tests. Focused cache/partition/render-cost tests pass after the final heart changes; the final serial topic 10 label/visibility run passes 51 selected checks. ESLint retains the same eight baseline errors; no new focused errors.
- Added `scripts/perf-3d-polish.mjs` and measured all 13 views against an isolated production build of `25fae30`. The same-session evidence is in `docs/perf/polish-batch6-before/results.json` and `docs/perf/polish-batch6/results.json`. Use these instead of comparing different harnesses' GPU numbers.
- Diaphragm playback main thread: **1030→591 ms/s**. Domains: **1037.4→756.5 ms/s**. Their p95 frame times fall from about 33 to 17 ms. Domains holds its camera after entry, while manual orbit controls remain available.
- The original tapered collar did not remove the whole defect. The final AV canal is a tube segment instead of a raised sleeve, and looped walls omit the inflated outline hull that drew a false black crack. Both ventricular and atrial eight-tick close-ups were visually inspected on the final build.
- The survey also found saw teeth at limb colour boundaries. `partition` now clips crossing triangles at shared edge points. Skull internal membranes/sutures no longer have outlines that poke through the bone. Calvaria sampling was kept; redundant outlines alone reduced drawn triangles to 240,544. The shared tube bend guard was retained after comparison.
- Added `scripts/check-3d-fallback.mjs`: an actual lost WebGL context releases the active renderer, shows the SVG fallback, and remains flat after a view switch. Resize testing stays below 3.2M buffer pixels. Evidence: `docs/perf/polish-batch6/fallback.json`.
- Batch 6 and the transferable lessons are recorded in `docs/perf/README.md` and `docs/review/topic-10-3d-execplan.md`. External memory files were not edited under the current explicit-memory-write rule.
- Windows event evidence was re-read: Kernel-Power 41 records bugcheck **307 = 0x133** (the report entry is timestamped 10:55:27 local). That does not establish the graphics driver as the cause. No driver or OS setting was changed.

### Remaining limits for a later batch

- Domains' bounded draw+completion measurement is **7.46→3.64 ms**, not the hoped-for 2 ms. It includes CPU submission and readback; it is not a hardware GPU query. An earlier after-pass was 7.10 ms, so a repeatable GPU-time saving of a particular size has not been established. The final CPU reduction is about 43% for diaphragm and 27% for domains; an earlier repeat was about 49–50%.
- Some coarse venous junctions and anatomical suture edges remain visible at high magnification. The survey is not a claim that every vascular junction has been remeshed into a seamless union.
- The eight existing lint errors remain outside this polish batch. Publication beyond the requested local commit is not part of this continuation.

## Further performance/resilience follow-up (2026-10-17)

The user's subsequent request covers all 13 models and further crash mitigation, with no subagents. See [the all-model audit](3d-performance-resilience.md) and Batch 7 in `docs/perf/README.md` for the new evidence and remaining candidates.

- Shared renderer: unchanged-frame suppression, coalesced uploads, 30 Hz drawing, explicit hidden/intersection suspension, 2M-pixel buffers with safe intermediate resizing, and session-persistent fallback after context loss or failed creation.
- Work is requested by the visible 3D view. Ordinary 2D pages no longer create a context or prebuild the whole topic. Geometry workers release their duplicate caches after delivering a batch. Parked models release GPU buffers/materials after 180 ms, and contexts after 5 seconds; detached viewports dispose immediately.
- Both normal playback and the class/manual-step glide loop publish 3D poses at the same 30 Hz ceiling, using elapsed time. Duplicate positions in reading/narration holds are suppressed. Kimu's automatic search-index warm is demand-driven.
- Fixed cached-pose corruption in same-sized GPU geometry updates; UVs and topology are updated as well. Scrubbing backwards no longer inherits a later pose's writes into an older cached mesh.
- Final source passes **1115 tests in 33 files** and the production build's TypeScript check. New helpers/shared GL/worker code pass focused ESLint. The expanded Stage3D/Simulator/Viewport lint scope has nine pre-existing errors; the Simulator and Viewport findings were also reproduced from `HEAD`. This differs from Batch 6's narrower eight-error scope, which included columns instead of the two shell files.
- Browser lifecycle and playback proofs are in `docs/perf/renderer-audit/resilience.json` and `playback.json`; performance results and close-ups are in the same directory. The real class UI was exercised using its supported subtitle/timer fallback, not audible narration.
- This follow-up is local. No push, deployment, driver or OS-setting change was performed. The earlier 0x133 watchdog still has an UNKNOWN responsible driver; app-side mitigation cannot guarantee prevention of an OS-level crash.

## Topic 10-only continuation (Batch 8, 2026-10-17)

The user narrowed further performance work to Topic 10 only and retained the no-subagent instruction. See [the scoped report](topic10-performance-followup.md) for exact changes, raw-result paths and limits.

- Heart tubes reuse path frames/layouts/welding scratch space while preserving reference positions, normals, UVs, indices and older poses. Heart/right-atrium snapshots and centrelines are bounded; blood-phase-only updates retain static anatomy. Topic 10's class duration estimate is retained per lesson.
- Nine-view sample mean: **263.9 -> 236.0 ms/s (10.6% lower)** against the earlier Batch 7 survey. Fresh continuous closing-vein baseline: **538.9 -> 492.4 / 474.5 ms/s (8.6–12.0% lower)** in two final samples. GPU/frame timing varies; no uniform GPU or frame-time improvement is claimed.
- All nine views load without runtime errors, with unchanged triangle counts. All 18 held/zoomed pairs remain near-identical to Batch 7. Actual class pause and context-loss/view-switch fallback pass.
- **1,171 tests in 35 files**, final production build/TypeScript and lint of all six files changed in this pass pass. New implementation is limited to Topic 10 and its class dock; prior pending all-model work remains. Local only, no commit/push/deployment.
- The 30 fps ceiling remains a conservative workload choice, not an OS crash-prevention guarantee. 40 fps has not been benchmarked. The earlier Windows watchdog's responsible driver remains UNKNOWN.

## Topic 10 30/40 fps experiment (Batch 9, 2026-10-17)

The user explicitly requested a 40-versus-30 comparison without subagents. [Full method and results](topic10-30-vs-40-fps.md); raw evidence in `docs/perf/topic10-fps` and the corrected early-valve phase in `docs/perf/topic10-fps-atrium`.

- A simple 25 ms gate would still quantize to about 30 fps on the tested 60 Hz clock. Both diagnostic targets instead preserve deadlines. This is opt-in through the harness, exact Topic 10 route and numeric 30/40 flag; ordinary production pacing stays unchanged at 30.
- 56 three-second playback samples cover all nine views and extra phases. Four continuous-motion cases deliver about **39–40 draws/s versus 30**, using **12–24% more main-thread CPU**. Class glide's separate short sample costs about **45% more**; pause stops work at both settings. Static/reading samples are reported separately, without an overall percentage.
- More frames produce about 30–33% more GL submissions in moving scenes. Held per-draw completion timing varies; hardware utilization was not measured. On the current 60 Hz display, 40 fps mixes roughly 17/33 ms gaps instead of even 25 ms intervals.
- All 1,176 tests in 36 files, final build/TypeScript and focused policy/waker/GL/test/harness lint pass. Simulator retains its known purity lint error. Held triangle counts match; screenshots remain near-identical. Hidden/resume, actual context loss and reload fallback pass at 40, with zero runtime exceptions.
- Default remains 30 for the existing low-compute goal. No subagents, commit, push, deployment, driver or OS-setting changes. The previous watchdog's responsible driver remains UNKNOWN; neither target establishes crash prevention.
