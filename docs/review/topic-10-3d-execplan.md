# Topic 10: better 3D for less compute — exec plan

Date: 2026-10-16. Status: Batches 0 and 1 done (2026-10-16), Batch 2 done (2026-10-17); results in `docs/perf/README.md`. Batches 3–4 not started.

**What Batch 1 changed.**
- `lib/three-d/mesh-cache.ts`: meshes fingerprinted on every input, so the same inputs give the same object.
- `tubeParts`/`blobParts` in `model3d.ts`: every heart and atrium item gets a coarse `hit` copy.
- `gl.ts`: the frame loop sleeps (`lib/three-d/waker.ts`). It wakes only for changes to the followed drawing or what holds it, not for Kimu's CSS animations. Per-frame allocations are gone.
- The stage 5 trails are memoised.
- Counters in `lib/perf.ts` (off unless the harness turns them on); tests in `tests/render-cost.test.ts`.

**Measured result.** Playback went from saturated (15–30 fps) to 60 fps, with half the main-thread time. Drag script is down 40%. A held view no longer runs a frame loop. Pictures are unchanged.

**Learned while doing it.**
- The biggest cost was CPU work (rebuild + SVG re-projection), not GPU.
- A frame-sampling harness distorts idle measurements.
- The remaining drag cost is the per-frame SVG projection; a candidate for the next batch is to project hit paths only when the pointer can use them. Scope: topic 10 (`components/scenes/week10/`) and the shared 3D kit it draws through (`components/kit/three/`, `lib/three-d/`). Other topics' content is not touched. Kit changes get checks on topics 7–9 and 11 too.

This plan builds on `docs/review/topic-10-low-compute-executive-plan.md` (the "earlier plan"). It keeps that plan's direction and adds findings from a fresh read of both codebases. Reference paths `ref/…` mean `C:/Users/aitor/Downloads/natural-disasters/src/…` ("ABYSSAL", a Three.js ocean/storm demo). Four Haiku 5.5 readers collected facts; every fact a decision rests on was re-checked in the source.

## 1. What our topic 10 spends its compute on today

Checked in the code. In order of likely cost:

1. **During playback the whole heart is rebuilt and re-projected on every animation frame (CPU).** `Simulator.tsx:739` calls `setPos` each frame while playing. Every render calls `heartModel` (`Heart3D.tsx:175`), which rebuilds every tube and blob from scratch (`model3d.ts:313-662`). New mesh objects then miss `projectCached` (`Stage3D.tsx:509-516`, keyed on mesh identity). So `projectItem` (`lib/three-d/scene.ts:117`) re-projects every vertex and rebuilds SVG path strings for every item, every frame. `gl.ts:399-405` then re-uploads positions and normals. Only the atrium walls (`wallsOnce`, `atrium3d.ts:90`) escape this.
2. **Blood cells are built as geometry.** There are 26 blobs (6×8 each), merged into new meshes on each frame (`model3d.ts:638-653`). Their positions snap to centreline samples with `floor`, so motion steps.
3. **The tissue shader is heavy per pixel (GPU).** One 3D value noise takes 8 hashes; `fbm` is 4 noises. The skin path makes about 10 noise evaluations per pixel (`gl.ts:158-161`) and muscle about 9 (`gl.ts:163-164`). Nothing fades this detail when it is smaller than a pixel. So distant walls pay full price, and fibres (`sin(vUv.x*150)`) shimmer.
4. **The render loop never sleeps.** `gl.ts:557-563` reschedules RAF forever. Each tick walks every SVG ancestor with `getComputedStyle` (`gl.ts:466-476`) and reads `getScreenCTM` and `getBoundingClientRect` (`gl.ts:456-462`), even when nothing changed. `draw()` returns `moving` but the loop ignores it.
5. **Pixels:** DPR up to 2 with MSAA (`gl.ts:337, 341`), no quality setting, nothing for tablets.
6. **Small per-frame allocations:** `new Float32Array(16)` per draw (`gl.ts:532`), `new Color` per item per sync (`gl.ts:439`), and `frame()` runs from an effect with no dependencies (`Stage3D.tsx:411-430`).

What we already do well, and should keep: shaders compile in advance without blocking (`gl.ts:369-393`). Layers are parked and pooled (`Stage3D.tsx:119-153`). Highlight fades are frame-rate independent (`gl.ts:493`). Draws are skipped when nothing changed (`gl.ts:518`). Most importantly, **the scene is a pure function of timeline `t`**, so it scrubs both ways. The reference does not have that.

## 2. What ABYSSAL offers, judged for topic 10

| # | Technique (reference) | Verdict | Why |
|---|---|---|---|
| R1 | **Stateless instanced motion**: `fall = mod(seed + uTime*v, box)` in the vertex shader. One geometry is created once; the CPU only writes uniforms (`ref/weather/Precipitation.js:72, 188-265`). | **Take** | Blood cells become one instanced draw. CPU work per frame is one float. Phase stays a function of `t`, so it still scrubs. |
| R2 | **Per-instance density gate**: `live = step(hash, density)` (`Precipitation.js:59`). | **Take** | Cells appear or thin out one by one, with no pop and no rebuild. |
| R3 | **Footprint-faded micro detail**: `microFade = 1 - smoothstep(.35, 2.2, footprint)`, with the layer skipped below 0.004 (`ref/ocean/OceanMesh.js:501-502`). | **Take** | Fixes our shimmer and makes distant or small surfaces cheaper. ALU only. |
| R4 | **Bake once, read each frame**: a full-screen pass bakes a texture once and the pass is disposed. Channels are packed (`ref/gfx/ProceduralTextures.js:187-193`). | **Take, gated on measurement** | Replaces about 10 procedural noises per pixel with 1–3 texture reads. Only worth the memory (512² RGBA ≈ 1.3 MB with mips) if baseline shows we are fragment-bound. |
| R5 | **Thin-body backlight**: `pow(dot(L,-V),4) * pow(.5-.5*dot(L,N),3) * thinness` (`OceanMesh.js:668-675`). | **Take** | Thin embryonic walls (atrium room, membranes, sinus horns) glow when lit from behind. They read as living tissue for a few ALU ops. |
| R6 | **Sub-pixel widening with opacity compensation** (`Precipitation.js:102-108`). | **Take, small** | Thin vessels (cardinal and vitelline veins, the trail vessels) keep a minimum on-screen width and fade instead of breaking into dashes. |
| R7 | **Analytic tube in the vertex shader** (`ref/weather/Waterspout.js:73-93`). The shape is a function of height and time; the reference ray-marches it, which we would not copy. | **Defer** | It would move looping to the GPU. But labels, hit paths and clipping need the same shape on the CPU, and the tube changes topology (split, branches). Revisit only if batch 1 leaves playback CPU-bound. |
| R8 | **Event envelopes from event-local time**, e.g. `pow(1-u,1.7)` with afterglow (`ref/weather/Lightning.js:238-250`; `Director.js:464`). | **Take, on demand only** | A one-shot pulse along a route ("blood enters here") as a glow uniform. Never continuous: it would keep the GPU awake. |
| R9 | **Quality presets + DPR cap + render scale** (`ref/core/Quality.js:1-37`; `App.js:148-156`). | **Take the static part** | One small preset table: DPR cap, tube sides, cell count, detail on/off. The adaptive median loop (`Quality.js:127-172`) is not needed if the renderer sleeps; add it only if measurements show sustained frame drops. |
| R10 | **A pure-logic CI test of a performance policy** (`tools/quality-sim.mjs`, run in `ci.yml`). | **Take the pattern** | Test our sleep/wake and invalidation rules as pure logic in vitest, with no GPU needed. |
| R11 | **Smoke tool**: Puppeteer boots the app, collects console and shader errors, samples frame times and screenshots at seek points (`tools/smoke.mjs`). | **Take the pattern** | Our baseline harness (headless Chrome + CDP; the browser pane has no RAF). |
| R12 | GPU timer queries with no stall: one query in flight, polled, disjoint results dropped (`ref/core/GpuProfiler.js:31-77`). | **Take, dev only** | GPU numbers for the baseline. Never copy its `gl.finish()` fallback (`GpuProfiler.js:45-49`). |
| R13 | Shared uniform objects held by reference (`ref/core/SharedUniforms.js`). | **Take** | The light, time and phase uniforms are shared by all slots instead of copied per slot each frame (`gl.ts:516`). |
| R14 | Exponential camera damping (`ref/camera/CinematicCamera.js:376`) and typed shots. | **Already have** | `cameraAt` is pure in `t` with a quintic ease (`Heart3D.tsx:27-39`); highlights use exp damping. Nothing to add. |
| R15 | Handheld or breathing camera (`CinematicCamera.js:8-14`). | **Reject** | Constant motion means constant rendering, and it fights "never get lost". |
| R16 | Director timeline (`ref/weather/Director.js:432-443`): `actTime += dt` with events latched once. | **Reject the mechanism** | It cannot scrub backwards. Keep our pure `t`. Borrow only the "acts as data tables" idea, which `cameraAt` keys already follow. |
| R17 | FFT ocean, ray marching, volumetric clouds, atmosphere LUTs, PostFX (≈27 full-screen passes), TAA, bloom, DOF, motion blur, env probe. | **Reject** | Each adds passes or per-frame GPU work with no teaching value. The reference renders the whole pipeline even when paused (`ref/core/App.js:177-190`). |

## 3. Work batches

Each batch has a finish line. Measure, then report what landed, and only then pick the next.

### Batch 0: baseline harness (half a day)
- `tools/perf-topic10.mjs`: headless Chrome via CDP with an absolute profile path (see memory). It opens topic 10 at 1440×900 and 768×1024, seeks stages 2, 3, 5, 6, 9 and 10, then plays, drags, pauses and bridges each one.
- It records frame-time p50/p95, long tasks, heartModel calls, `projectItem` calls, buffer uploads, draw calls, triangles and RAF callbacks while settled. GPU timer query behind `?perf=1`. All counters off by default.
- **Finish line:** a committed baseline JSON plus screenshots at fixed `t`. These are the "before" for every later batch.

### Batch 1: stop redundant CPU work, with no visual change (P0)
1. **Split shape from presentation in `heartModel`.** Its geometric inputs (pose keys, fusion, loop amount, which parts exist) decide meshes. Colour, opacity, highlight and flow phase only decide items. Memoise each part's mesh on its own geometric inputs, quantised (for example 1/2000 of the stage), in a bounded cache per part (LRU of about 8).
2. **Stable identity means everything downstream already works:** `projectCached` hits, `gl.ts` skips the upload, and labels reuse the same points.
3. **Coarse `hit` meshes** (existing `Item3.hit`) for the big tubes, so changes that do happen re-project fewer triangles. Decorative items (cells, ghost) get no hit geometry.
4. **`frame()` only on change:** give the Stage3D effect real dependencies, or compare a cheap frame signature.
5. **Renderer sleeps** (`gl.ts`): the loop stops when `!dirty && !moving` and the CTM is unchanged. It wakes on `frame`, `follow`, resize, wake, compile and CSS transitions. Opacity of ancestors is read only while a `transitionrun` or animation is active (listen at the viewport root), not every tick. Hidden tab or offscreen: no RAF.
6. Remove per-frame allocations (`gl.ts:439, 532`).
- **Finish line:** during playback heartModel geometry builds drop to about 0 per frame between topology changes. Settled view: 0 RAF callbacks. Same screenshots pixel-for-pixel at fixed `t`. Pure-logic vitest for the sleep/wake rules (R10). Topics 7–9 and 11 smoke-checked because `gl.ts` and `Stage3D` are shared.

### Batch 2: stateless blood flow (P1, stages 3 and 4, then wherever `o.flow` is used)
- Add instancing to `gl.ts`: `GLItem.instances?: { count, seed: Float32Array }`. Upload one cell mesh once.
- The route is the centreline already computed (`line` in `model3d.ts`), resampled to 32 points and uploaded as a `vec3` uniform array only when the shape changes. The vertex shader places each cell at `fract(seed + phase)` with linear interpolation between route points (no `floor` snap) and a fixed per-seed jitter (R1).
- `phase` is still `t × 28`, so it scrubs. The O2 mix is per-instance (seed hash < mix), and the count ramps through the density gate (R2).
- Cells skip the SVG projection: decorative, no hit.
- **Finish line:** the same number of cells or fewer; 0 cell geometry builds per frame; smoother motion (screenshots at 3 consecutive `t`); and a lower total frame time than batch 1. If it doesn't win, revert to the CPU path with interpolation only.
- **Done (2026-10-17).** As built: `Item3.stream` / `GLItem.stream` (`Stream3` in `lib/three-d/scene.ts`), with constant per-cell starts, offsets and gates, a cached 32-point route (`routeOf` in `model3d.ts`), and `phase` and `grow` as the only per-frame numbers. The O2 split stayed as two items (every third cell), the same as before. The cells grow in one by one instead of fading as a whole, and they are now opaque. With cells flowing, main-thread time fell by 29% and frame p95 went from 24 to 18 ms; cell builds, uploads and projections fell to 0. Without WebGL (the flat fallback), the cells are not drawn.

### Batch 3: the shader looks better and costs less (P1)
1. **Footprint fade (R3):** `fp = length(fwidth(vObj * freq))`. Texture amplitude goes to `1 - smoothstep(0.35, 2.2, fp)`, and fbm octaves are skipped when the fade is near 0. Muscle fibres fade the same way via `fwidth(vUv.x*150)`. This removes shimmer and cuts cost on small or far surfaces.
2. **Thin-wall backlight (R5)** for kinds membrane, epithelium and vessel, gated by a per-item `thin` uniform. Pilot it inside the stage 10 atrium room.
3. **Min-width vessels (R6)** in the vertex shader, for thin tubes only (per-item flag). Opacity compensates.
4. **Shared uniforms (R13):** one light uniform object referenced by all slots.
5. **Bake (R4), only if batch 0 and 1 show the GPU fragment cost matters on the tablet profile.** Bake one 512² tileable RGBA texture once per GL layer (fibres, mottling, cells, grain) and sample it triplanar on `vObj`, replacing fbm.
6. **DPR trial:** cap 1.5 vs 2 on DPR-2 screens, with A/B screenshots at 1440. Labels are SVG and stay sharp either way. Ship 1.5 only if the outlines and edges hold up.
- **Finish line:** equal or lower GPU time (timer query) on every baseline scene. No new pass. The A/B screenshots show the same or better legibility. The teaching landmarks (septa, ridges, openings) stay as geometry.

### Batch 4: teaching clarity using the new tools (P2)
- **Stage 3 (early circulation):** instanced cells on the real vessel routes. One on-demand pulse (R8) runs along the incoming veins, then along the outgoing arches, when the narration names them.
- **Stage 4 (segments):** same cached geometry, only highlight states change. Cells show the direction through the segments.
- **Stage 5 (looping):** cached start ghost (built once per pose), interpolated landmarks, and the camera held while the loop forms (earlier plan, item I).
- **Stage 9 (sinus venosus):** a shared vein route graph. Rerouted veins keep their colour. Vanishing stretches fade per instance and segment, with no rebuild.
- **Stage 10 (right atrium room):** backlit thin walls, selective reveal (hide only the blocking wall), footprint-faded trabeculae texture on the rough part vs the smooth sinus part. That is the teaching contrast, now cheaper.
- **Finish line:** each stage passes the visibility guard, the label-zone and named-side tests, and browser proof at 768 and 1440 px.

### Deferred, with a reason
- Vertex-shader tube deformation (R7): needs a CPU mirror for labels, hits and clips; only if batch 1 isn't enough.
- An adaptive quality loop (R9 dynamic part): not needed once the renderer sleeps; add if measurements show sustained drops on tablets.
- A worker for static construction (earlier plan, K): only if a long task remains at startup.

## 4. Acceptance (whole plan)
- No new runtime dependency, no extra render pass, no larger particle count.
- Same `t` gives the same picture, whatever the playback history (scrub forward and back).
- Settled view: no recurring RAF. Hidden tab: nothing runs.
- CPU and GPU both reported, before and after. Moving work from one to the other doesn't count as a saving.
- Every name still lands inside its structure while turning, seeking and bridging. Reduced motion still works.
- Typecheck, lint and full vitest pass at the end; topic 7–9 and 11 3D views are smoke-checked, since the kit is shared.

## 5. How good is ABYSSAL compared with our code?

**Short answer:** as a graphics engine, ABYSSAL is more sophisticated and more carefully tuned than ours. It is also far more expensive by design, and weaker at being correct and testable. Ours has the better architecture for an app that teaches. It wastes compute in a few easy-to-fix places, not because of its design.

| | ABYSSAL (≈9,600 lines JS, 25 files) | Ours (topic 10 3D + kit ≈ 6,000 lines TS) |
|---|---|---|
| Language and safety | Plain JS, no types | TypeScript, `tsc --noEmit`, ESLint |
| Tests | One pure-logic test (`quality-sim.mjs`) in CI over Node 20/22/24; Puppeteer smoke tool, local only | 26 vitest files: visibility, labels, orbit, view changes, notes and more |
| GPU discipline | Strong: early-out gates, footprint LOD, filtered sampling, bake-once textures, shared uniforms, preallocated arrays, async compile | Partial: async compile, draw skip, parking. But noise per pixel with no LOD, and DPR 2 + MSAA |
| CPU discipline | Good in the hot paths. Some per-frame `Vector3` allocations in the camera, and the resize is not debounced | Weak in one hot path: full model rebuild + SVG re-projection on every played frame |
| Idle cost | Poor: the whole pipeline (FFT, clouds, post) renders even when paused | Poor-ish: RAF never stops, though it skips the GPU draw |
| Determinism | History-dependent (`+= dt`, latched events, unseeded `Math.random` lightning). It cannot scrub | Pure function of `t`; scrubs both ways. A clear win for teaching |
| Comments | Excellent "why" comments recording failed attempts and driver hazards | Good "why" comments, in the same spirit |
| Rough edges | DOF and motion-blur preset flags are read only in debug mode. The `gl.finish()` profiler fallback stalls. History is a single import commit, so there is no evolution to learn from | No performance measurement at all; no quality presets |

**Verdict:** borrow its rendering techniques and its measurement habits, not its architecture. Its renderer is an expert one. Its budget (57 FFT passes and about 27 post passes per frame) is the opposite of our goal.
