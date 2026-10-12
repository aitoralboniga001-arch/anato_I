# Visual plan for topics 7–9 (2026-10-12)

Goal: a student understands each process **by watching it**, with labels and narration off.
Not photorealism: recognisable tissue, real proportions, clear motion. No regressions in study UX.

## Diagnosis

- Every structure was drawn the same way: outline → one flat fill → a shared dot pattern → the same light
  gradient. Colour did all the work, so tissues read as "same blob, different colour".
- Each topic made its own textures (`w7-mesench`, `w8-cart`, `w9-mes`, …): no shared tissue look.
- Inherently 3D processes were drawn flat: limb rotation, the diaphragm dome, myoblast migration.

## Silent test (dev tool: `/dev/frames?silent=1&w=7`)

Each step is drawn at its start and end; the share of the frame that changes is measured
(highlights are CSS and do not count). `!!` < 2% of the frame changes, `!` < 5%.

- W7: 22 of 45 steps under 2%. Worst: peritoneo-barrunbea (5 steps at 0%), diafragma-eraketa 1–3,
  diafragma-heldua 2/4/6, pleura-perikardioa 4/5/8.
- W8: limb rotation (gorputz-adarrak 8–9) changes only ~5% of the frame: the most 3D process of the
  topic is nearly invisible. Many naming steps static (errai-kraneoa 1–5, saihetsak 1–4).
- W9: the most static topic. Migration steps barely move: ildaskatuak #8 0.2%,
  somitaren-paretak #7–8 0.1–1.1%, domeinuak #1–2 0.2–0.3%.

Naming steps may stay still; **process** steps (migration, fusion, rotation, descent) must move.

## Architecture

- **A — tissue materials** (`components/kit/materials.tsx`): one shared look per tissue
  (mesenchyme, epithelium, muscle, cartilage, bone, membrane, nerve, vessel, cavity), one light
  direction, cut face vs surface. Replaces the per-topic pattern sets of weeks 7–9.
- **B — 3D views** (`lib/three-d/*`, `components/kit/three/*`): each 3D scene is a pure function of
  `t` that returns meshes + camera, built with our own small math (no three.js), so labels, hit
  shapes and the server-rendered tests stay synchronous and exact. A lazily loaded three.js layer
  draws the shaded meshes in an underlay behind the SVG; the SVG keeps hover, click, focus, labels.
  Without WebGL (tests, thumbnails, old devices) the projected outlines are drawn flat in SVG.
- **C — 2D shading layer**: the same underlay idea for 2D views: tissue silhouettes get volume,
  contact shadows and soft membranes from a GPU pass, while the SVG stays the source of truth.

## 3D views, by study value

1. W8 gorputz-adarrak: opposite limb rotations (upper 90° lateral/outward, lower 90° medial;
   flexor/extensor masses end up front/back), from the notes w8/4/p13–p16.
2. W7 diafragma: the dome assembled from its four sources (septum transversum, pleuroperitoneal
   membranes, oesophageal mesenchyme, body-wall muscle), descent C3–C5 → T6 front / T12 back,
   phrenic nerve trailing; aorta, IVC, oesophagus through it (w7/3/*, w7/3.1/*).
3. W9 somite → domains: myoblasts crossing the lateral somitic frontier into the body wall and limb
   bud; epaxial/hypaxial with dorsal/ventral rami (w9/2.2/*, w9/2.2.2/*).
4. W8 buru-ganga: calvaria plates on a dome, sutures and fontanelles, moulding (w8/3.1.1/*).

## Progress

- [x] Silent-test tool and findings
- [x] B infrastructure (math, meshes, underlay, GL layer, SVG hit shapes + labels)
- [x] B1 limb rotation (week 8 `biraketa` = 3D; old 2D kept as `ebakiak`)
- [ ] A materials library, applied to weeks 7–9
- [ ] C shading layer
- [x] B2 diaphragm dome (week 7 `kupula` view, default for the four-components step)
- [x] B3 somite migration / domains (week 9 `domeinuak-3d`, default for steps 1–4 and 11; step 5 pinned to the 2D `domeinuak`)
- [x] 3D "where is this cut?" fly-in (`lib/three-d/embryo5.ts` + `flyin.ts`): whole 5-week embryo → glowing cut planes → the slab → the view's own camera. Used by `domeinuak-3d` (t 0–0.05) and `kupula` (on entering its step, 0.7568–0.7918; stage `diafragma-eraketa` 47 → 50 s so the step keeps its pace). Meshes prebuilt in idle time (`prewarm.ts`).
- [x] B4 calvaria (week 8 `kupula`): smooth newborn vault over a face (orbits, nasal aperture, maxilla, mandible) and ear openings, so it reads as a skull at a glance; an opaque pale membrane in which the plates grow from their centres with radiating spicules; cameras keep the face in sight. Names leave during camera turns and return when the view settles.
- [x] 3D names: `Callouts` (components/kit/callouts.tsx) — each name on its structure's side, in its points' order, crossing pairs trade places; used by all four 3D views. Orientation cross + one-time drag hint in the top-left corner (UI agent restyling).
- [x] 2D names app-wide: scenes are drawn through `SceneView` (components/kit/columns.tsx); every Label hands its props to a collector and one layer arranges each side's column (points' order, then swaps scored like tests/labels.test: frame, tools, overlaps, leaders through names, crossings).
