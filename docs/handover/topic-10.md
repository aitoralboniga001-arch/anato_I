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
| 6 | `atal-bulbarra` | w10/3.1 | `3d` (every step; what each part becomes grows inside it), `eratorriak` (flat summary map) |
| 7 | `atal-bentrikularra` | w10/3.2 | `frontala` (topic 11 HeartArt, earlier), `3d` |
| 8 | `atal-aurikularra` | w10/3.3 | `3d` (front → right → behind), `frontala` |
| 9 | `zain-sinua` | w10/3.4 p3–p9 | `3d` (from behind; KONTUZ note on left/right), `frontala` |
| 10 | `eskuineko-aurikula` | w10/3.4 p10–p23 | `3d` (the atrium opened, a 3D room; every step), `barrutik` (the same as a 2D drawing), `trenkada`, `frontala`; ends on the section-3 summary table |

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

## More 3D: stages 6 and 10 (16 October 2026, after user feedback)

The user said the 3D made them understand the structure far better than the flat drawings. They got lost in stage 10's 2D right atrium, above all at the jump to the septum. They asked to use the 3D more.

- **Stage 6 stays in 3D for all five steps** (`BulbusScene`).
  - Step 1: the blood's way from the aortic sac through the arches on both sides to the dorsal aortas.
  - Step 2: a yellow trail from the ventricle up through the three sub-parts to the sac ("what it continues with").
  - Steps 3–5: the wall goes to glass and the camera comes to each sub-part. What it becomes grows inside it, from `HeartPose.derive` (`model3d.ts`):
    - trabeculae in the proximal part;
    - the conus divided into the two infundibula (right blue, left red);
    - the truncus divided into the pulmonary root (right) and the aortic root (left).
  - The roots show faintly at the end of step 4, because its text names the arteries.
  - `eratorriak` (the flat map) is kept as a summary view.
  - Stage 7's frontal cut has a bridge from `atal-bulbarra/3d`.
- **Stage 10 is a 3D room** (`RightAtrium3D`, model `atrium3d.ts`).
  - It is the right atrium opened from the front, with the septal, back and lateral walls built as `grid` patches from `lib/three-d/mesh.ts`, facing inwards.
  - Every step of the 2D story is on the same timeline, with the same names, notes and summary table (`AtriumTable`).
  - For the septum (step 3), the camera turns to the embryo's left wall from the right while the lateral wall goes clear. This is the turn the 2D could only cut to.
  - `HeartView` is now a thin wrapper round `ModelView` (any model, same axes, camera keys and names).
  - The 2D views (`barrutik`, `trenkada`, `frontala`) are kept as alternatives and bridged from `3d`. Stage 9's frontal cut and 3D both bridge into it.
- **The camera pad's ← and → were the wrong way round** (`Stage3D`). Every key now moves the camera, as ↑ already did.

## Second outside review (16 October 2026)

An outside review was checked line by line against the code and the notes. About half its points were wrong: ids that do not exist, quoted text that is not in the app, and "bugs" that are by design (paused stepping plays to `doneAt`; said → shown). What it got right, now fixed:

- **Stage 4: cavity and septum transversum** (`model3d.ts`).
  - The pericardial cavity is now centred on the heart and grows as the tube loops.
  - The septum transversum sits caudal to it and thins as the loop deepens (notes 2 p9).
- **Stage 9: the veins.**
  - The left umbilical vein is not cut. It reroutes through a third anastomosis (red, oxygenated) to the right vitelline vein.
  - Only the left vitelline vein's stretch near the sinus closes. The parts that remain are drawn separately (`umbD`, `vitD`).
- **2 → 3: the sagittal close-up turns as it pulls back.**
  - New `roll` on a bridge (`lib/sim/types.ts`). ViewZoom rotates the camera by it during the move.
  - The stage 2 sagittal cut has cranial on the left; the stage 3 side view has cranial up, so the roll is 90°.
- **3 → 4: the summary table fades before the dive.** Anything in `.zoom-fade` fades out first on an inward move and fades back in late on an outward one (`Circulation.tsx`).
- **Simulator: nothing runs while the camera travels.** The `bridgeHold` check now comes before the intro/overview block, and the step card waits for the move to end.
- **Stage 10: septum shapes in the 3D atrium.**
  - The septum primum hangs from the roof as a curtain with a concave free edge.
  - The septum secundum is a crescent band with a ridge on its free edge.
- **Stage 9: text.** Step 1 now says the heart is seen from behind, as in the notes' figure.
- **Stage 2: anchor.** The cardiac jelly's dot follows the middle of the jelly band as it widens; it used to land in the myocardium early on (`Fusion.tsx`).

**Still open (owner's call):**
- Views no step visits: stage 6 `eratorriak`, stage 8 `frontala`, stage 10 `barrutik` / `trenkada` / `frontala`. Should they be visited in a step, or kept as optional?
- Stage 3 step 2 jumps to the 3D and back. Should that preview stay?

## Resume list

1. Anchor audit for topic 10: `node scripts/anchor-audit.mjs http://localhost:3005 10-10` (it overwrites `docs/anchor-audit.md`).
2. Check the topic 10 views at 768 px (tablet) by eye.
3. `inPreparation` is gone from week 10 (it is still on week 11).
