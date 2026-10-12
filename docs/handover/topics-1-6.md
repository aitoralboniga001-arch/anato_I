# Handover: topics 1–6 (2026-10-12)

Topics 4–6 were worked by one agent; topics 1–3 were handed over to it at the end (see `docs/handover/topics-1-3.md`
for what landed there). Only topic 6 got real work; topics 5 and 4 got no visual changes. Nothing is committed.

## Tests at hand-off

- `npx tsc --noEmit -p .`: clean.
- `npx eslint` on scenes week4, week4-meso, week5, week6 and content week4/4b/5/6: clean.
- `tests/labels.test.tsx`, full run: weeks 1, 3, 4, 5, 6 green. Still failing in weeks 1–6:
  - `2. astea > eguna-13 / mozketa` and `eguna-13 / biloxkak`: 5000 ms timeouts under machine load only
    (files untouched; the shared `Cells` component is slow). Fix: a per-test timeout, or speed up `Cells`.
  - Outside scope, same run: `8. astea > kondrokraneoa / goitik`, `gorputz-adarrak / hastapena`.
- `tests/visibility.test.tsx` for topics 4–6: green.

## What landed in topic 6

- **Uterus (sagitala):** fuller abembryonic villi on the smooth chorion (24 villi, varied length).
- **Sac (biloxka-askeak: korion-zakua, zirkulazioa):**
  - The fetus is the topic 5 `FetusFigure` (months 2 → 4), not a blob. The amnion grows to fill the chorionic
    cavity and the yolk sac shrinks into the crescent, as the notes describe.
  - The stalk and cord flare into the chorionic plate. The two umbilical vessels touch, so they read as one band.
  - The plate's arterial and venous rings sit side by side. The spiral arteries and veins are thicker, so their
    dots sit inside them.
  - `karena-mugaren-meheketa` is a Mark (a process), not an outline.
  - The thin circulation "Sinzitioa" label was removed.
  - Right-column names start below the scene tools (y ≥ 230).
  - The stage 1 anchor rows went from 17 to 6.
- **Villus:**
  - The long section is unframed tissue, and step 5 zooms in on the stem's layers.
  - In the cross-section (zeharkakoa), each step now differs.
  - The intervillous-space name was moved out from under the tools.
  - `endotelioa` was removed from the long view: it is thinner than a dot there, and is named in the cross-section.
- **Placenta (funtzioak):**
  - Molecule piles build up per row as each exchange happens, so the steps move.
  - `karena-muga` is now a span bracket across sinzitio → endotelio, whose layer Parts carry `groups={['karena-muga']}`.
- **Amniotic (likido-amniotikoa):** a volume gauge, secretion droplets, the swallowing loop, and the AFP tube.
- **Silent test (W6):** the baseline was 23 `!!` and 14 `! ` across 51 steps. The last run was 16/18/17, but it was not re-run after the final Sac, Villus and Placenta edits.

## Batch 2 (resumed): week 6 dots and span brackets, finished

The official anchor audit (`/dev/frames?anchors=1&w=6&s=0` and `&s=1`) now shows **0 rows** for stages karena-muga and biloxka-askeak. Before this batch they had 28.

- **Cross-sections (zeharkakoa, karena-muga):**
  - `karena-muga` is now a span bracket from just under the syncytial surface to the middle of capillary A's endothelial wall (`barrierSpan`, Villus.tsx).
  - The four layer Parts carry `groups={['karena-muga']}`.
  - The exchange molecules are `pointerEvents="none"`.
- **Long section (biloxkak):**
  - `TreeTissue` and `TreeVessels` (week3-villi/tree.tsx) take optional `groups`. They are used only by week 6, so week 3 is unchanged.
  - The decidua and arteries carry the maternal part; the trophoblast, mesoderm, plate and villous vessels carry the fetal part.
  - `karenaren-ama-atala` now has its dot on the decidua at (620, 25), so its leader no longer crosses the leader of `endometrioa`.
  - `karena` is a span bracket up the middle anchoring villus, from the plate to the decidua (left column).
  - The right stem villus has a faint body Part, so `biloxka-tertziarioa` has a body to be named on.
  - The endothelial nuclei are grouped with the capillaries.
  - The connective-core dot in the close-up sits above the capillary loop.
- **Sac (korion-zakua, zirkulazioa):**
  - The umbilical vessels are offset along the cord's normal, so they always touch.
  - The vessel dot sits on their seam.
  - The artery and vein dots sit on their centre lines.
  - The thinning Mark is a pool of light with no rim.
- **Not done (left for next time):** the static steps (karena-muga #5, biloxka-askeak #1–3, #5 and #6, aterminoa zirkulazioa #6), and the dots of stages 2–6 (not re-audited).
- **No registry spans were added:** the groups approach covers week 6 without changing the focus lighting in week 3.

## Topic 6 items still open

1. **Static steps.** The last silent run flagged:
   - karena-muga #1 and #3/#5;
   - biloxka-askeak #1–#3, #5 and #6;
   - korion-hostotsua #2–#5;
   - kotiledoiak #2, #3, #5 and #6;
   - aterminoa #1, #2, #6 and #8–#10;
   - zilbor-hestea #1–#4, #6 and #8;
   - likido-amniotikoa #2, #4–#8.

   The silent test needs a re-run first: that run predates the Villus push-in.
2. **Anchors in stages 2–6:** Uterus sagitala, kotiledoiak, aurpegiak, aterminoa zirkulazioa, Cord and Amniotic. The last full audit, before this batch, had about 70 rows there.
3. **Registry spans:** consider `spans` for `karena` (fetu → ama) once its Uterus dot labels are converted to brackets.
4. **`docs/visual-plan-4-6.md`:** add the after-numbers.

## Topics 5 and 4

No new work; their label tests are green. Anchor audit counts before any fixes: W5 116, W4 201. The composites to convert are somatopleura and splanchnopleura in the week4-meso folding sections.

## Topics 1–3 resume list, highest study value first

See `docs/handover/topics-1-3.md` for the detail.

1. **gastrulazioa/biak:** clutter and overlapping names in the dual view. Then the camera jumps in 2-astearen-amaiera and gastrulazioa/goitik, and re-check diskoa for duplicate steps.
2. **Week 3 anchor leftovers:** Shell.tsx and Circulation.tsx anchors, and the biloxkak capillary ring. Dorsal views of span wholes need an audit exemption.
3. **Topics 2 and 1:** not started (W2 78 and W1 65 anchor rows), plus the eguna-13 timeouts.

## Tools

The `/dev/frames` pages run against the shared dev server, which was on **:3007** at hand-off (:3000 was down).

`/dev/frames` renders every beat in every view, so steps can look identical in views that a beat doesn't use. The silent test (`?silent=1&w=N`) uses the real views.
