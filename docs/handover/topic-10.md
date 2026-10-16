# Topic 10 handover: 10. GAIA, ZIRKULAZIO APARATUA

Source: `10. GAIA_ ZIRKULAZIO APARATUA (ZUZENDUTA).pdf` → `content/notes-text/w10.ts` (sentence ids `w10/<section>/p<n>/s<n>`). When the prose and the tables disagree, the prose wins. State on 15 October 2026: all ten stages are built; nothing is committed.

## Stages

| # | stage id | notes | views |
|---|---|---|---|
| 1 | `eskualde-kardiogenikoa` | w10/1/p3–p8 | `diskoa`, `zeharkakoa` |
| 2 | `bihotz-hodia` | w10/1/p9–p21 | `zeharkakoa`, `sagitala` (head fold), `3d` (zipper + dorsal aortas + notochord) |
| 3 | `zirkulazio-goiztiarra` | w10/1/p22–p36 | `alboa` (whole conceptus → embryo → heart camera, O2-coloured vessels, summary table), `3d` |
| 4 | `bihotz-atalak` | w10/2/p3–p11 | `3d` |
| 5 | `bihotz-lakioa` | w10/2/p12–p22 | `3d` (ghost of the start, direction arrows) |
| 6 | `atal-bulbarra` | w10/3.1 | `3d`, `eratorriak` (derivative map: one continuous outflow per ventricle) |
| 7 | `atal-bentrikularra` | w10/3.2 | `frontala` (topic 11 HeartArt, earlier), `3d` |
| 8 | `atal-aurikularra` | w10/3.3 | `3d` (front → right → behind), `frontala` |
| 9 | `zain-sinua` | w10/3.4 p3–p9 | `3d` (from behind; KONTUZ note on left/right), `frontala` |
| 10 | `eskuineko-aurikula` | w10/3.4 p10–p23 | `barrutik` (the atrium opened, one morphing drawing with a zoom table), `trenkada`, `frontala`; ends on the section-3 summary table |

Every notes sentence of topic 10 is mapped to a beat (`tests/notes.test.ts`, count pinned at 619). There are 15 quiz questions (`w10-q-*`) and chronology milestones for days 21, 23–28 and 28–70.

## Files

- `content/weeks/week10.ts` (stages 1–2, the quiz), `week10-circulation.ts` (3), `week10-loop.ts` (4–5), `week10-derivs.ts` (6–10), `week10-structures.ts` (ids and colours).
- `components/scenes/week10/`:
  - `model3d.ts`: the one parametric heart. Its pose fields include `fuse`, `segs`, `loop`, `loopTail`, `atriaFuse`, `split`, `truncusMid`, `expand`, `shift`, `obliterate`, `anast`, `coronary` and `hole`. Its options include `cavity`, `septum`, `gut`, `aortas`, `noto`, `flow` and `ghost`.
  - `Heart3D.tsx`: `HeartView`, `orbit`, `cameraAt`, `Trail` and `DirArrows`, plus stages 4–5.
  - `Stage2Views.tsx`, `Circulation.tsx`, `Circulation3D.tsx`, `Bulbus.tsx`, `Derivs.tsx` (stages 7–9), `RightAtrium.tsx`.
- `components/scenes/week11/heart.tsx` (`HeartArt`) is reused for the frontal views of stages 7–10. New state fields: `trabR`/`trabL` (trabeculae growing) and `lvAlso` (names the primitive left ventricle also answers to).

## Test exceptions added (each with its reason)

- `tests/visibility.test.tsx`:
  - GONE: `bihotz-hodia/4/orri-epimiokardikoa`, `bihotz-hodia/6/mesokardio-dortsala` (the step numbers moved when the sagittal step was inserted), `zain-sinua/3/eskuineko-zilbor-zaina`, `zain-sinua/3/ezkerreko-zain-bitelinoa`, `eskuineko-aurikula/4/eskuineko-zain-balbula`.
  - MENTION_ONLY: `bihotz-hodia/7/errai-orria`, `bihotz-hodia/7/endokardioa`.

## 3D arrows and turning (15 October 2026, after user feedback)

- **Names now follow the camera when the picture turns.** Kit fix in `LabelCollector` and `Label`: a name re-rendered without its layer triggers a redraw. Before, a drag, a turn-button press or a tour glide left every leader pointing where things had been, and all the names jumped at the next tick. It is shared, so it also applies to topics 7–9.
- **Turn buttons and reset glide.** They now take 420 ms with easing; they used to jump. Each press turns 0.35 rad. A drag still follows the pointer at once and takes over from a glide.
- **The axes key fades between line and end mark.** There is no abrupt line ↔ dot switch.
- **Live edge pills in topic 10's 3D views.** `axes.edges` names the six directions; Stage3D works out which one faces each frame edge (with hysteresis) and hands it to the Viewport through `Underlay.setOrient`. A pill that changes fades in, and name columns step in past the side pills (`Callouts`).
- **Honest direction arrows.** `DirArrows` seen end-on fade into a dot (towards you) or a crossed ring (away), and the word says which. Before, the arrow got a fake direction, straight up when exactly end-on.

**Pending for topics 7–9:**
- Give `DiaphragmDome3D`, `Calvaria3D`, `LimbRotation3D` and `Domains3D` an `edges` set in their `axes`, so their pills follow the camera.
- Check their own arrow overlays for fake directions when seen end-on.
- Re-check their views by dragging, at 768 and 1440 px.

## Never getting lost: camera keys and moves between views (16 October 2026, after user feedback)

The user said the camera pad did not work, that its purpose was unclear, and that students "sometimes get lost" in topic 10. Their demand: a student seeing it for the first time must understand it and never get lost. What changed:

- **The camera pad now names the sides.**
  - A 3D view with `axes.edges` gets a `.look-controls` panel (Viewport) instead of the arrow pad. Its keys are Aurretik / Atzetik / Ezkerretik / Eskuinetik / Goitik / Behetik, plus ↺.
  - The title says where the picture is seen from now ("Aurretik ikusita"), or just "Ikusi" when the view sits between named sides.
  - A key glides the turn to that side with `lookTurn` (`lib/three-d/orbit.ts`, tested in `tests/orbit-look.test.ts`).
  - The arrow pad is still there only for 3D views without edge names (topics 7–9 until they get `edges`).
- **Why the pad looked dead.** The Simulator found the 3D once, sometimes a fading ghost, and stopped looking. It now polls for the live 3D only (not `.scene-ghost`, `.view-zoom` or `.travel`).
- **Every view change in topic 10 moves the camera.**
  - `ViewDef.bridges` (`lib/sim/types.ts`) links two views that show one region. A bridge works within a stage (`from: 'view'`) and across stages (`from: 'stage/view'`).
  - `zoomPlan` turns a bridge into a ViewZoom dive (inward) or pull-back (outward).
  - `section: true` captions the move "Barrura begiratzen · mozketa" / "Kanpotik ikusten · osorik".
  - `look` first turns the 3D to the side the cut is drawn from, so left and right never flip. Example: stage 9, from the 3D seen from behind to the frontal cut seen from the front.
  - The links: stage 1 disc→cut; stage 2 sagittal↔cut↔3D; stage 3 side↔3D; 3→4; stage 6 3D→derivatives; 7–9 3D↔frontal cut; 9→10 frontal cut→inside of the atrium; stage 10 inside→septum, with an explicit `at` because the part box was taller than the frame.
  - Checked frame by frame in headless Chrome, both ways where they exist.
- **3D → 3D across stages glides instead of cutting.** `Stage3D continuity="bihotza-10"` (HeartView): a new 3D view starts from the camera the last one ended on and glides to its own (1.1 s). Each frame's step is capped at 40 ms, so a slow first frame does not eat the start of the move.
- **Viewpoint notes only show once the camera has arrived.** "Aurretik begiratzen dugu", the KONTUZ note and similar notes are multiplied by `askedView`, so a student who has turned the model is not told the wrong side.
- **No more "3D eredua prestatzen" spinner in the middle of a move.**
  - Contexts that have done their work are parked and reused for 60 s.
  - The Viewport warms one up 1.2 s after mount.
  - The canvas keeps its last picture through a hand-off.
  - ViewZoom waits (at most 3 s) while a 3D is still compiling.
  - A draw on a detached element is skipped: it used to read opacity '' as 0 and blank the canvas.
- **Two views share the frame while one fades into the other.** The newest one sets the side pills and camera keys. The ghost never does, and a view that leaves hands them back instead of blanking them. Before this fix, the arrow pad came back and the side pills vanished after every "Hurrengo etapa".

**Pending for topics 7–9:**
- Add `edges` so the named-sides panel appears.
- Add `bridges` / `zoom` links between their views.
- Add `continuity` where one model spans several stages.

## Resume list

1. Anchor audit for topic 10: `node scripts/anchor-audit.mjs http://localhost:3005 10-10` (it overwrites `docs/anchor-audit.md`).
2. Check the topic 10 views at 768 px (tablet) by eye.
3. `inPreparation` is gone from week 10 (it is still on week 11).
