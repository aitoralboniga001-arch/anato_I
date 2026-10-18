# Topic 10: 30 versus 40 fps (2026-10-17)

Requested experiment only: compare 40 fps with 30 fps in Topic 10, without subagents. Earlier pending implementation is preserved. The ordinary production setting remains 30 fps.

## Method

The existing `now + interval` frame gate quantizes a nominal 25 ms interval to roughly 33.3 ms on a 60 Hz RAF clock. Simply replacing `1000 / 30` with `1000 / 40` would therefore be a misleading experiment. Both experimental targets use a deadline-preserving gate that carries fractional refresh time and skips missed deadlines without catch-up bursts. On a 60 Hz display, 40 fps submissions necessarily mix one- and two-refresh gaps; at 120 Hz they can use even three-refresh gaps.

`renderTiming()` permits only numeric 30/40 targets, only with the existing `__perf` harness enabled, and only at the exact Topic 10 route. The harness sets `window.__topic10Fps` before application startup. Ordinary visits, other topics, pixel budgets, fallback policy and the original default pacing remain unchanged. There is no new user-facing setting. Simulator playback, class glides and the GL waker use the same diagnostic target.

Reproduction uses a production build and one hardware browser at a time:

```powershell
npm run build
npm run start -- -p 3123
# In a second terminal, after the server is ready:
node scripts/compare-topic10-fps.mjs http://localhost:3123 docs/perf/topic10-fps
```

The initial harness run covers all nine Topic 10 3D views at t=0.55 and four extra phases: closing veins (0.45), looping (0.30), atrial valves (initially 0.30), and ventricular blood flow (0.80). Each case uses **30, 40, 40, 30**, three-second samples and 1.5 seconds on a blank page between runs. CSS viewport is 1536x960, DPR 2; the drawing buffer stays below 2M pixels. The first pair also checks held rendering and records matching held screenshots and bounded 3x8 draw timings. There is an additional unchanged-production-30 control, real class UI checks, hidden/resume and actual context loss/reload checks.

The initial atrium phase entered a reading hold during some samples. It is retained as mixed/hold evidence and excluded from the continuous-motion comparison. The case was moved to t=0.12 and repeated in `docs/perf/topic10-fps-atrium`, giving a full active valve-growth interval. The current script reproduces that corrected start; run with `$env:FILTER='atrium-valves'` to isolate it. There are **56 three-second playback samples** in total, plus class, hold, control and recovery checks.

Counters distinguish **published poses**, **GL submissions** and the independent **page RAF**. Bounded submission timestamps record intervals between real draw calls; RAF frequency alone is not labelled model fps. A diagnostic Proxy records timestamps identically in both targets. CPU values are main-thread task time per second, not whole-machine utilization. GPU values are CPU submission plus completion/readback per held draw, not hardware timer-query time or GPU utilization. Some survey phases have static anatomy or manual reading holds; their rates are reported separately from continuous motion.

Raw evidence is retained in `docs/perf/topic10-fps/results.json`. Short-run machine/thermal variation, different numbers of frames and the 60 Hz refresh cadence must be considered when interpreting the results. Neither fps setting is proof against an OS-level crash; the earlier watchdog's responsible driver remains UNKNOWN.

## Result

**40 fps is feasible on this machine in the tested moving scenes.** Mean actual GL submission rates are about 39–40/s, versus about 30/s. The four continuous-motion cases use **12–24% more main-thread CPU** at 40. The ordinary production default remains 30; no user-facing fps setting, deployment or commit was requested.

Means below are two three-second runs per target, using the same diagnostic scheduler. CPU units are milliseconds of main-thread task work per second, not total machine CPU percent.

| Continuous scene | CPU at 30 | CPU at 40 | Increase | Actual draws/s, 30 -> 40 | Mean draw interval, 30 -> 40 |
|---|---:|---:|---:|---:|---:|
| Closing veins, t=0.45 | 442.3 | 536.1 | 21.2% | 29.90 -> 39.78 | 33.36 -> 25.14 ms |
| Looping, t=0.30 | 510.7 | 624.9 | 22.4% | 30.23 -> 39.30 | 33.20 -> 25.24 ms |
| Ventricular blood flow, t=0.80 | 322.4 | 400.6 | 24.3% | 30.14 -> 40.03 | 33.17 -> 24.99 ms |
| Atrial valve growth, t=0.12 | 485.4 | 543.4 | 11.9% | 30.16 -> 39.96 | 33.22 -> 25.10 ms |

The existing production-30 control (original pacing, no diagnostic target) records 454.8 ms/s and 28.90 draws/s in closing veins. Its single late-run sample is kept separate from the paired diagnostic comparison. Using it as an individual reference, the two 40 fps closing-vein samples cost 17.1–18.6% more CPU. It is not an additional paired trial.

The actual class UI's short glide sample records **311.0 -> 450.9 ms/s (+45.0%)** and 31.04 -> 40.74 published glide poses/s. These are single 1.5-second samples with UI work, not a sustained-animation mean. Only 1.98 -> 3.94 draws/s are needed in this particular early class glide; unchanged-frame suppression remains effective. After pause, both targets record zero further glide poses and GL draws.

### GPU work and pacing

- More frames mean approximately **30–33% more GL submissions** in the four continuously moving scenes. Anatomy, particles, drawing-buffer limit and held-picture triangle counts are unchanged. This is an increase in submitted rendering work; hardware GPU utilization and energy were not measured.
- Held draw+completion samples vary in both directions: closing veins 1.625 -> 2.138 ms, looping 1.225 -> 1.275 ms, ventricular flow 1.737 -> 1.788 ms, and valve growth 1.600 -> 1.450 ms. These bounded readback timings are not a steady-state GPU-time comparison. No GPU saving is claimed.
- The benchmark's RAF clock is about 60 Hz. Windows separately reports the current display as **3072x1920 at 60 Hz** (`display.json`). At 40 fps, draw gaps mix roughly 17 and 33 ms instead of being evenly 25 ms apart. For example, the first 40 fps closing-vein run has 58 gaps under 22 ms and 61 between 22 and 42 ms; the first 30 fps run has 1 and 88 respectively. The mean update interval decreases, while the refresh-spacing tradeoff remains. This does not substitute for a subjective foreground-browser smoothness test.
- A 120 Hz fake-clock unit test confirms even three-refresh scheduling at 40. No physical 120 Hz browser benchmark or long thermal/battery test was performed.

### All nine views and validation

`summary.json` reports every case's CPU, pose rate, draw rate and intervals. The nine t=0.55 survey samples include static anatomy and manual holds, so their CPU numbers are **not averaged into a universal 30-versus-40 penalty**. In particular, the ventricular/atrial samples can publish more poses without needing more draws; circulation/loop holds publish neither. The original t=0.30 atrium samples are retained separately with their hold-related variability.

- Main comparison and corrected atrium repeat both pass, with zero runtime exceptions. All checked buffers stay below 2M pixels; every held 30/40 triangle-count pair matches. Held pictures do not keep drawing.
- Real Topic 10 class pause, simulated document hidden/resume, real `WEBGL_lose_context` and flat fallback after reload pass at 40. These are bounded app recovery checks, not a guarantee against a driver/kernel failure.
- All 13 initial held screenshot pairs and the corrected atrium pair were compared. Initial differences reach 0.459% of pixels above 2 colour levels and 0.094% above 40; the corrected atrium pair reaches 0.284% / 0.082%. The largest initial pair was visually inspected: the anatomy and labels remain aligned, with small transient highlight differences. This is near-identical appearance, not screenshot bit equivalence.
- Full tests: **1,176 in 36 files pass**, including 30/40 delivery at 60/120 Hz, early timestamp tolerance, missed-deadline skipping, disabled/resume/settle and diagnostic-scope gates. Final production build/TypeScript pass. Focused lint passes for policy, waker, GL, new tests and harness. Simulator retains its previously recorded `Math.random` purity error; no new lint finding was introduced.
- Windows System events 41/1001/4101: zero between 19:48 and the 20:05 check (`windows-events.json`). This is an observation during the experiment, not crash-prevention proof.

For the existing low-compute goal, 30 remains the conservative default. The experiment establishes a functioning 40 fps path and its measured cost; it does not establish that 40 is unsafe or that either target prevents the earlier OS crash. No subagents, driver/OS changes, commit, push or deployment were used.
