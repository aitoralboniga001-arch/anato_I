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

## Resume list

1. Anchor audit for topic 10: `node scripts/anchor-audit.mjs http://localhost:3005 10-10` (it overwrites `docs/anchor-audit.md`).
2. Check the topic 10 views at 768 px (tablet) by eye.
3. `inPreparation` is gone from week 10 (it is still on week 11).
