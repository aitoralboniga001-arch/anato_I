# Topic 10 performance follow-up (2026-10-17)

This continues the 3D polish handover after Batch 7. New implementation in this pass is limited to Topic 10 and its class dock. Earlier all-model changes remain in the working tree. No subagents were used.

## Changes

- `components/scenes/week10/tube-geometry.ts`: reuse rotation frames, bend vectors, trigonometry, triangle indices, UVs and normal-welding scratch space for heart/vessel tubes. Each new pose still owns separate position and normal arrays. Arbitrary `around` functions retain the original builder. Normal accumulation, welding, caps and tight-bend behaviour match the reference; sampling and triangle counts are unchanged.
- `model3d.ts`: retain up to two complete heart snapshots. When only blood phase changes, reuse anatomy, routes and labels and update stream wrappers with the original phase arithmetic. Cache up to eight centrelines and hoist constant radius tables.
- `atrium3d.ts`: retain up to two complete right-atrium snapshots, including walls, valves, ridges and label destinations.
- `components/klasea/ClassDock.tsx`: compute the immutable lesson duration/check count once per lesson, instead of resyllabifying every sentence on scene updates. Currently only Topic 10 provides this class dock.

Tube frame plans retain at most 128 entries; tube layouts/scratch space have a 2 MiB cache budget. Meshes still use the existing 24 MiB mesh cache. Complete-model snapshots are count bounded, rather than a history of every playback frame. No shader pass, particle count, runtime dependency or geometry simplification was added. The shared renderer and other topics received no new implementation changes in this pass.

## Evidence and limits

The fresh closing-vein baseline at stage time 0.45 is in `docs/perf/topic10-focused-before/results.json`: 538.9 ms of main-thread work per second, p95 page RAF interval 16.9 ms, 28.5 draws/s and 50,824 drawn triangles. Its CPU profile identifies procedural tube construction/normal calculation; another cost was repeated class-duration estimation.

Measurements use the production build, hardware Radeon 780M, 1536 x 960 CSS pixels at DPR 2, the existing 2M-pixel buffer ceiling and sequential bounded harness. GPU values are CPU submission plus completion/readback, **not hardware timer queries**. Short samples can vary with thermal state and browser work. A held/reading phase is not equivalent to continuous deformation.

### Final production measurements

All nine Topic 10 views load without runtime exceptions. `docs/perf/topic10-focused/results.json` and `comparison.json` retain the final survey and the earlier Batch 7 comparison. Mean main-thread work across these short playback samples is **263.9 -> 236.0 ms/s (10.6% less)**. This comparison uses the earlier survey, rather than nine freshly paired baselines. The right-atrium sample is slightly higher; no uniform per-view or GPU improvement is claimed.

| Topic 10 view | Batch 7 CPU ms/s | Final CPU ms/s | Final draw+completion ms | Final page RAF p95 ms |
|---|---:|---:|---:|---:|
| bihotz-hodia | 317.2 | 272.4 | 1.150 | 33.3 |
| zirkulazio-goiztiarra | 142.3 | 135.5 | 1.225 | 16.8 |
| bihotz-atalak | 372.6 | 317.6 | 1.225 | 16.8 |
| bihotz-lakioa | 146.8 | 134.8 | 1.188 | 16.9 |
| atal-bulbarra | 152.5 | 144.1 | 1.575 | 17.1 |
| atal-bentrikularra | 343.8 | 283.0 | 1.387 | 33.4 |
| atal-aurikularra | 344.6 | 311.2 | 1.487 | 16.9 |
| zain-sinua | 408.1 | 373.0 | 1.612 | 33.4 |
| eskuineko-aurikula | 147.6 | 152.3 | 1.625 | 17.1 |

The continuously closing vein at **t=0.45** has a fresh baseline and two final runs:

| Sample | Main thread ms/s | GPU draw+completion ms | Page RAF p95 ms | Pose/draws per second |
|---|---:|---:|---:|---:|
| Fresh before | 538.9 | 1.688 | 16.9 | 28.5 |
| Final | 492.4 | 1.750 | 33.3 | 28.5 |
| Final repeat | 474.5 | 1.537 | 16.8 | 29.0 |

This is **8.6–12.0% less main-thread work** in the two final runs, with the same 50,824 drawn triangles. GPU and frame-time results vary, so this supports a modest CPU saving rather than a promise of smoother frames or lower GPU cost. The final first run still builds 741 meshes/s (684 specialized tubes) and uploads 370.5 slots/s. Prepared frames/layouts are reused; continuous anatomy still needs fresh position/normal arrays. React/SVG work and remaining deformation are future candidates. The ventricular sample records 60 complete-model cache hits/s, consistent with avoiding its duplicate builder calls.

The 30 fps ceiling is a conservative sustained-workload choice, not a proven boundary between safe and unsafe operation. A genuine 40 fps path could request about one third more poses/draws than 30 fps while moving, and needs its own measurements. On a 60 Hz display, 30 fps has even two-refresh pacing; evenly presenting 40 fps requires a different refresh cadence. No 40 fps comparison was performed in this pass.

### Browser checks

- `topic10-focused/fallback.json`: final buffers stay under 2M pixels at 2400x1600 and 1536x960 CSS sizes; actual `WEBGL_lose_context` switches to flat drawing and stays flat after a view switch; zero runtime exceptions.
- `topic10-focused/playback.json`: actual Topic 10 class publishes 28.7 glide poses/s, reuses 28.7 heart snapshots/s and stops pose/draw work after pause. Voice uses the supported subtitle/timer fallback. The existing script also rechecks shared Topic 8 clock/hold/hidden/camera/disposal behaviour; no other-topic implementation was changed.
- `topic10-focused/pixel-diff.txt`: all 18 Topic 10 held/zoomed pairs compared with Batch 7. At most 0.325% of pixels differ by more than 2 colour levels and 0.018% by more than 40. The two closing-vein pairs against the fresh baseline differ by at most 0.053% / 0.002%. This is near-identical appearance, not a bitwise screenshot guarantee. Ventricular and right-atrium zoomed pictures were visually inspected.
- Every final survey triangle count equals its Batch 7 count. Unit tests additionally compare tube positions, normals, UVs and indices directly.
- `topic10-focused/windows-events.json`: no System events 41/1001/4101 between 19:20 and the 19:45 check. This is a bounded log observation, not proof about the cause or prevention of a future crash.

All work remains local and uncommitted; no push or deployment was requested. Earlier pending work was preserved.

This pass preserves Batch 7's 30 Hz ceiling, hidden/offscreen suspension, parked resource disposal and session-persistent flat fallback. These reduce app load and recover from supported WebGL failures. The previously recorded Windows 0x133 watchdog has an UNKNOWN responsible driver without a dump. No driver/OS changes or guarantee against future machine crashes is claimed.

## Source validation

- Full Vitest suite: **1,171 tests in 35 files pass**, two workers, 273.5 seconds.
- New tube reference checks: 48 path/side/cap combinations, open angular parts, arbitrary `around` fallback, unchanged older poses and shared immutable topology.
- New snapshot checks: phase-only updates equal a forced fresh build at three venous closure amounts; appearance/geometry/stream visibility invalidate correctly; atrium state changes and eviction preserve backward seeking.
- Final production build and its TypeScript check pass. ESLint passes for all six changed/new implementation and test files in this pass. The earlier shared-renderer/shell lint findings remain outside this pass's source changes.

Reproduce source checks:

```powershell
npx vitest run --maxWorkers=2 --testTimeout=20000
npx eslint components/scenes/week10/model3d.ts components/scenes/week10/atrium3d.ts components/scenes/week10/tube-geometry.ts components/klasea/ClassDock.tsx tests/topic10-model-reuse.test.ts tests/topic10-tube-geometry.test.ts
npm run build
```
