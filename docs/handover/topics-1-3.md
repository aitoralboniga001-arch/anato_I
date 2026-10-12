# Handover: topics 1–3

Only topic 3 got real work. Topics 2 and 1 are untouched, apart from the `bi-orriko-diskoa` spans in `week2.ts`. Nothing is committed. The progress log is in `docs/visual-plan-1-3.md`.

## What landed

### 2-astearen-amaiera (week3.ts, Stage1.tsx)

**sagitala:**
- The camera stays wide in steps 8–9, so the sac fills the frame.
- "Korion barrunbea" no longer sits on "Zitotrofoblastoa".
- `bi-orriko-diskoa` is drawn as a span bracket.

**diskoa:** rewritten with its own nine-step story (no dive), using `ownFocus`, orientation pills and a tone for each step.

### gastrulazioa

**zelulak (GastrulationCells.tsx):**
- The streak cells now light as `lerro-primitiboa`.
- New `ildo-primitiboa` furrow.
- Mesoderm drawn as a matrix band.
- `hiru-orriko-diskoa` drawn as a span bracket.
- The gastrulazioa process label is gone.

**goitik (GastrulationDorsal.tsx):**
- Smooth camera keys.
- Mesoderm drawn as a sheet with stellate cells.
- New anchors.

**zeharkakoa:** the hiru-orriko span bracket.

**biak:** a new dual view (dorsal | cells) with step chips.

### mesodermoa-hedatzen (MesodermSpread.tsx)
- The `enbrioi-kanpoko-mesodermoa` label is moved right.
- Cells are drawn as batched paths.

### notokorda (Notochord.tsx, NotochordCells.tsx)
- The canal is drawn under the pit.
- Prenotochordal cells redrawn.
- All anchors moved inside their structures.

### alantoidea (Allantois.tsx)
- The outline Part is gone, and hiru-orriko is now a span bracket.
- The stalk anchor is found by search.
- The korion-plaka and kloaka anchors are fixed.

### biloxkak (Villi.tsx)

In the villi, each layer (sinzitio, zito, meso, capillaries) is drawn twice: once in the plate, and once in the villi, where it also carries the active villus type as a group. Focusing a type lights the villi only, and the type dots now pass the audit.

The mesoderm label returns to the plate once vessels form, because the core is too narrow for a clear dot.

### Shared drawing helpers
- `DiscSection.tsx`: `DiscTone`, a tinted streak band, batched mesenchyme.
- `dorsalKit.tsx`: `StellateField` and `ellipseD`.

### Disc3D
Removed entirely: the file is deleted and nothing references it. 2D is the default everywhere.

## Tests (2026-10-12)

**Passing:**
- tsc: clean.
- eslint (scenes week1–3 and week3-villi, content week1–3 and week3b): clean.
- Label tests for weeks 1 and 3: green.

**Failing:** only week 2.
- `eguna-13 / mozketa`, `eguna-13 / biloxkak` and `eguna-13 / bitelo-zakua` fail on the 5000 ms timeout only, under machine load. These files are untouched.
- The fix is to add a per-test timeout, or to speed up the shared `Cells` component.

**Not re-run:**
- The full vitest run since the last edits.
- The visibility tests for weeks 1–3.

**Seen in the full labels run, outside weeks 1–3:** failures in weeks 6, 8, 9 and 10.

## Open items, by priority

1. **gastrulazioa/biak:** reviewer defects still unfixed:
   - clutter and overlapping names in the dual view;
   - not visually verified since the build broke.

   The other reviewer defects:
   - **diskoa:** duplicate steps. The rewrite targets this; re-check it against sagitala.
   - **2-astearen-amaiera and gastrulazioa/goitik:** camera jumps.
2. **Week 3 anchor audit:** not re-run since the fixes. Before the fixes there were 157 rows.

   Known leftovers:
   - **biloxkak:** `biloxka-kapilarrak` is 1/9 off in muturra and zeharkakoa at step 5. The young island ring has gaps.
   - **zorro-zitotrofoblastikoa (Shell.tsx):** the arteria-espiralak, korion-plaka bracket, kanpoko-zorro, biloxka-enborra, biloxka-askea and biloxka-tertziarioa anchors.
   - **zirkulazioa (Circulation.tsx):** the arteria-espiralak, sinzitio/zito, korion-plaka, finkapen and karena-muga anchors.
   - Dorsal views of span wholes get flagged needs-span. From above there is no thickness to bracket, so they need an exemption.
3. **Topics 2 and 1:** not started. The anchor audit counts are W2 78 and W1 65. Also, the eguna-13 timeouts above.

## Kit and audit requests (kit owner)
- `dual()` should carry `span` through when it lifts labels from a pane.
- The anchor audit's clip check mis-transforms inside dual panes, so its dual-view rows are unreliable.
- The shared `Cells` component (components/scenes/section) is slow, which causes the label-test timeouts.
