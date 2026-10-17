# Topic 10: better 3D with less work per frame

Date: 2026-10-16. Status: executive implementation plan; no implementation performed.

## Executive decision

Keep EnbrioAtlas's deterministic educational model and custom Three.js/SVG renderer. Borrow the ocean project's resource reuse, selective updates, shared geometric data, and workload controls. Do not adopt its simulation engine or cinematic rendering stack.

The objective is clearer developmental transformations and spatial relationships at equal or lower steady-state CPU/GPU cost. Lower compute is a requirement, not a later optimization. A visual change that increases cost without an offsetting saving does not pass this plan.

Luna agents supplied targeted code facts during the later exploration; architectural conclusions and priorities were synthesized by the main agent. This is a source audit, not a visual or performance benchmark. Savings below are hypotheses with explicit validation gates, not measured results.

## Evidence and deeper conclusions

Paths starting `reference/` below mean `C:/Users/aitor/Downloads/natural-disasters/`. All other paths are relative to this repository.

1. **Persistent geometry has benefits beyond GPU uploads.** `Heart3D.tsx:174` invokes `heartModel(pose, opts)` during rendering; `model3d.ts:313` rebuilds curves and meshes. `components/kit/three/gl.ts:399` uploads changed mesh buffers even when their sizes match. Meanwhile `Stage3D.tsx:509` caches CPU projections by mesh identity. Keeping an unchanged mesh therefore saves model construction, buffer upload, and repeated SVG triangle projection. The reference's stable ocean grid (`reference/src/ocean/OceanMesh.js:16`) illustrates resource persistence; its projected-ocean geometry algorithm itself does not suit a heart.
2. **Presentation changes are not anatomical changes.** `heartModel` combines geometry, color, transparency, flow and labels. A color or flow-phase change can trigger unrelated geometry work. The reference separates weather targets, integrated state and material uniforms (`reference/src/weather/Weather.js:20`, `reference/src/core/SharedUniforms.js:4`). We should separate those responsibilities while retaining direct evaluation from educational time; a history-dependent weather integrator would break reliable scrubbing.
3. **Existing optimizations should be extended, not replaced.** The atrium already builds invariant walls once (`atrium3d.ts:90`). The renderer already reuses slots, precompiles shaders, skips unchanged GPU draws, and parks contexts. The opportunity is to make more Topic 10 resources follow these established patterns.
4. **Skipping rendering is not the same as sleeping.** `gl.ts:518` avoids an unchanged draw, but `gl.ts:557` still schedules RAF callbacks. Its draw path checks computed styles, screen transforms and highlight slots before returning. An event-driven wake/sleep mechanism can remove idle CPU work; it must still follow CSS-driven fades and bridge movements.
5. **The cheapest good flow is prescribed, not simulated.** `model3d.ts:638` creates and merges 26 cell meshes, sampling the route using `floor`. The reference uses persistent instanced precipitation (`reference/src/weather/Precipitation.js:190`). A small reusable cell geometry with instance transforms and interpolated route sampling can look smoother without fluid simulation or more cells. At this small count, benchmark CPU-updated instances before considering shaders.
6. **Reuse geometric truth across systems.** The reference shares ocean sampling code among GPU consumers. Its CPU event-height mirror is approximate for rogue waves (`reference/src/weather/Director.js:376`, `reference/src/ocean/OceanSampleGLSL.js:199`), so it is not a complete parity model. Topic 10 should expose one set of anatomical curves for vessel geometry, flow, label anchors and explanatory trails. `Circulation3D.tsx:78` currently constructs explanatory paths separately from vessels built in `model3d.ts:588`.
7. **Detail should follow what the learner needs to distinguish.** The reference filters and fades ripple detail by pixel footprint (`reference/src/ocean/OceanMesh.js:485`). Transfer the principle: silhouettes, openings, ridges and boundaries deserve geometry; subpixel texture does not. Do not transfer wave cascades, FFT, or ray marching.
8. **Caching does not make the reference a low-compute template.** Spectrum signatures avoid rebuilding spectra but FFT passes still run (`reference/src/ocean/OceanFFT.js:626`); some atmosphere LUTs and the environment probe update each frame (`reference/src/sky/Atmosphere.js:284`, `reference/src/core/App.js:247`). Its paused app still updates/render passes, and some particle effects receive nonzero time. Its profiler's CPU fallback calls `gl.finish()` (`reference/src/core/GpuProfiler.js:42`). None of those behaviors should be copied.

## Proposed architecture

```text
Existing source-backed stage / beat / narration timeline
                  |
        evaluateAnatomy(t) -- pure and seekable
                  |
      anatomical curves, landmarks, component shape parameters
                  |
       bounded per-component geometry cache
          /                         \
 persistent Three.js meshes      coarse picking / fallback geometry
          \                         /
         existing Stage3D, labels and anatomical camera

Presentation state: color, opacity, highlight, visibility -> material updates
Optional flow phase: prescribed route + instance transforms -> cells only
Camera state: view matrices + label projection -> no anatomy rebuild
Invalidation: wake only the work affected by a change
```

These are responsibility boundaries, not a requirement for a new framework, global singleton store, ECS, React Three Fiber migration, or many new abstractions. Keep changes small and retain the current public scene interfaces where possible.

## Prioritized work packages

| ID | Priority | Concrete work | Finish line / compute constraint |
|---|---|---|---|
| A | P0 | Establish baseline on stages 2, 3, 5, 6, 9 and 10: geometry time, projection time, uploads, draw calls, triangles, idle callbacks and frame-time distribution. | Same devices, viewport, DPR, timeline and interaction script for before/after. Separate cold start, steady playback, camera drag, paused and bridge transitions. Instrumentation off by default. No forced GPU synchronization. |
| B | P1 | Split geometric inputs from material, visibility and flow inputs. Cache invariant context and unchanged heart/atrium subcomponents. Use explicit shape dependencies rather than newly allocated pose-object identity. | Color/highlight/flow-only changes cause zero anatomical geometry builds and uploads. Cache bounded by component/version, not every visited timeline value. |
| C | P1 | Keep buffers and topology stable within each developmental phase. Update only changed attributes; rebuild when fusion or opening topology genuinely changes. | No routine buffer disposal/reallocation during a fixed-topology interval. UVs, indices, normals and picking stay consistent; do not freeze real anatomical change to satisfy caching. |
| D | P1 | Replace merged blood-cell blobs with a small reusable instanced mesh. Interpolate adjacent path samples; cache route lengths if constant-distance motion is needed. | Equal or fewer cells, no per-cell mesh construction, smoother paths. Retain the simpler existing path if total CPU/GPU measurements do not improve. No GPU particle-state textures. |
| E | P1 | Expose reusable vessel/heart routes and landmarks. Derive trails, cells and anchors from those routes. Add cheap, independent hit meshes through existing `Item3.hit`. | Trails follow their actual vessels; anchors follow transformations; projection triangle work falls without reducing selection accuracy. Decorative cells need no picking geometry. |
| F | P1 | Introduce renderer invalidation and sleep after highlights/transitions settle. Wake on frame input, resize, camera action, selection, shader readiness and viewport transitions. Suspend hidden/offscreen activity. | No perpetual renderer RAF while settled or parked. All CSS fades and bridges still animate correctly. Resume without elapsed-time jumps. Shared shell/narration logic must be audited separately before changing its clock. |
| G | P2 | Add one coherent low-cost quality configuration: capped DPR/render scale, tube sides, curve samples, outline policy and cell count. Start conservatively; add adaptation only if baseline warrants it. | SVG labels retain full readability. Minimum geometry preserves relevant holes and septal edges. No extra render passes. Prefer geometry reduction before reducing image resolution; hysteresis prevents repeated rebuilds. |
| H | P2 | Separate macro shape from decorative tissue detail. Keep explicit geometry for taught folds, septa and trabeculae; simplify tiny background fibers/grain and unnecessary outlines. | Less or equal fragment/triangle work, same learning landmarks. Compare lower-cost existing shader variants before adding texture resources. No new continuous surface animation. |
| I | P2 | Coordinate pose, camera, reveal and explanation with small declarative cue tracks derived from existing beat time. Hold the camera when a spatial relationship is being learned. | Same `t` always reconstructs the same anatomy; reverse scrub works; no competing camera tween. Student orbit, named sides, bridges, reduced motion and manual `Jarraitu` remain authoritative. |
| J | P2 | Apply selective reveal instead of broad translucency: hide only the obstructing wall, keep orientation context, use existing cutaway geometry where possible. | Fewer overlapping transparent surfaces; openings and relationships become easier to read from required views. No screen-space effects, general-purpose CSG or new multi-pass transparency. |
| K | P3, conditional | Move expensive one-time static construction to the existing geometry worker infrastructure only if startup traces show a remaining long task. | Better responsiveness within a measured memory/total-work budget. Workers do not count as compute reduction; no per-frame worker meshes or unbounded pre-baking. |
| L | Required throughout | Add Topic 10-specific geometry, flow, camera, seeking and idle-cost regression coverage. | Source/notes/labels retained, tests cover each changed developmental interval and six canonical camera sides, with browser proof at 768 and 1440 px. |

## Improvements to the ten stages

These are implementation targets to validate against the current source and visual baseline, not claims that each stage is currently broken. Preserve all original notes, structure IDs and Basque teaching content.

| Stage | Visual / animation improvement | Cheapest implementation direction |
|---|---|---|
| 1. Cardiogenic region | Make islands, horseshoe region and paired tube continuity easy to follow across disc and section. | Consistent landmarks/colors and focused reveals in existing views; no new 3D scene by default. |
| 2. Heart tube | Make the fusion front and surrounding layers legible throughout folding. | Reuse topology inside each fusion phase; keep dorsal context cached; test layer thickness and continuity at phase boundaries. |
| 3. Early circulation | Smooth cells along real vessel routes and distinguish incoming/outgoing paths. | Reusable routes and instances; reveal the relevant route rather than increasing particle count. Preserve source-defined oxygenation semantics. |
| 4. Heart segments | Identify segment boundaries while retaining the shape of the whole tube. | Material/selection changes on cached geometry, stable camera and named anchors. |
| 5. Looping | Explain how different regions move through the loop, with reliable before/after comparison. | Existing parametric curve and trails, interpolated landmarks, one cached start ghost only when it teaches the movement. No soft-body physics. |
| 6. Bulbar derivatives | Keep parent-to-derivative identity visible as infundibula and arterial roots emerge. | Existing derivative model, controlled wall reveal and persistent colors/anchors; simplify nonfocused context. |
| 7. Ventricular derivatives | Clarify cavity versus wall and the taught trabecular structures. | Geometry only for recognizable ridges; shared lower-detail context and existing frontal/3D bridge. |
| 8. Atrial derivatives | Show expansion/incorporation as one continuous anatomical change across front/back views. | Component-specific cached shapes, shared landmarks and deterministic cue tracks. |
| 9. Sinus venosus | Follow retained routes, rerouting and disappearing stretches without losing left/right orientation. | Shared vein graph/routes, local reveal and constrained topology changes; no simulated pressure or flow solver. |
| 10. Right atrium | Distinguish smooth/trabeculated wall, crista, venous valves and septal wall while turning inside the chamber. | Extend `wallsOnce`, cache static ridges/openings, update only changing patches, selectively hide the obstructing wall. Preserve the existing opened-room view. |

## Sequence and decision gates

1. **Baseline and correctness fixtures — A + initial L.** Record current behavior and fixed anatomical sample times. No performance percentage promised before this exists.
2. **Remove redundant work — B, C, E, F.** First ship geometry identity, dependency boundaries, coarse picking and idle sleep. These help existing visuals before any aesthetic work.
3. **Flow pilot — D in stage 3, then stage 4.** Compare total frame cost, uploads and smoothness; retain only if it wins. Keep flow phase derived from timeline by default. An optional flow preview at a held developmental pose must be explicitly activated, must not advance the lesson, must honor pause/reduced motion, and must stop when hidden.
4. **Clarity pass — G, H, I, J and stage table.** Start with looping and right atrium, where shape/orientation carry the explanation. Reuse these patterns for remaining stages only after proof.
5. **Startup work only if needed — K.** Do not move repeated work to another thread and call the architecture efficient.
6. **Final regression gate — L.** Focused Topic 10 checks, shared camera/visibility/label checks, typecheck, lint, full suite once at the end, and browser captures of affected views. Shared kit changes require representative checks in Topics 7–9 too.

Each implementation batch names its paths and owner. The main agent owns architectural choices and scientific/educational review. User-requested Luna readers may collect bounded evidence; implementation and verification roles should be selected separately when implementation is authorized. No work package authorizes changing other topics' content.

## Release acceptance

- No new runtime dependency or rendering pass by default; no larger particle population.
- Unchanged shape has stable mesh identity and no repeated anatomical buffer uploads.
- Settled paused/parked renderer has no recurring RAF; tab/viewport suspension works.
- CPU and GPU costs are both reported; transferring work between them is not sufficient.
- On agreed target hardware: aim for 60 fps desktop / 30 fps lower-power tablet during active scenes, but treat those as targets until measured. At minimum, no sustained regression beyond baseline measurement noise in frame time, startup, or memory.
- Same timeline position reproduces anatomy regardless of playback history. Cached resources are bounded and disposed; repeated stage switching does not grow memory indefinitely.
- Every relevant name still points inside the correct structure during deformation, orbit, seeking and view bridges. Cuts and opaque surfaces agree with hit geometry.
- Reduced motion and explicit learner-controlled progression work across all changed stages.

## Deliberately excluded

FFT/fluid dynamics, atmospheric LUTs, volumetric clouds, ray marching, GPU ping-pong particles, environment captures every frame, temporal history/TAA, motion blur, depth of field, bloom, dynamic shadows, dense tissue texture volumes, continuous heartbeat decoration, or a wholesale renderer/framework migration. These add compute or complexity without a demonstrated learning benefit under this brief.

The first implementation should be the redundant-work removal, followed by the small flow pilot. This yields evidence before committing to wider model changes.
