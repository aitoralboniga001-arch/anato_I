# Handover: topics 7–10 (plus the label kit)

Topics 8 and 9: see docs/handover/topics-8-9.md. Topic 10: see docs/handover/topic-10.md. Neither was started in this session.

## What landed earlier (label kit, zeloma section)

- Label arranger (components/kit/columns.tsx) and Label geometry (components/kit/Label.tsx):
  - the arranger is conservative: it moves a name only into a slot where it fits outright, and only if crossings strictly drop;
  - `noArrange` on a single Label or on a whole scene;
  - `span` prop plus a registry `spans` field (lib/sim/types.ts, content/registry.ts) for names of layered wholes;
  - in /dev/frames, a name the arranger moved gets a yellow outline.
- Leader audit: app/dev/frames/Anchors.tsx and scripts/anchor-audit.mjs. Rules and the span API are documented at the top of docs/anchor-audit.md. That file still holds an older full run; a new run was not done.
- week7-structures: the bena-kardinal-komuna definition now follows the topic 10 notes.
- zeloma/zeharkakoa (Coelom.tsx): the coelom is the hero in topic 7 violet over topic 4's drawing (FoldTransverse untouched), drawn larger; the left-side somite and intermediate mesoderm are named in the left column.

## This batch (items 1–3): every side view is on topic 5's embryo

### SideEmbryo (components/scenes/week7/SideEmbryo.tsx)

Topic 5's day-32 embryo (week5/EarlyEmbryo, wrapped, not forked; topic 5 untouched), its trunk see-through, the cavities inside in their side-view places. One component serves all four side views. Options:
- `place` (frame placement; `placeXY(place)` maps embryo → frame), `plane` / `planeColor` (the transverse line; `planeAt`, `zNear`);
- `cavities` / `septum` / `heart` / `gut` (leave out what a view draws itself), `whole` + `wholeId` (the coelom as one cavity, cross-fading to its pieces);
- septum growth: `cells` (mesenchymal cells gathering), `reach` (plate grows from the ventral wall back), `solid`, `meso` (oesophageal mesenchyme), `anchors` (glow at the plate's two ends);
- `pour` (cavity tint pours cranial → caudal), `flow` (fluid down the canal), `hideSomites`, `stomach`, `midgut` (midgut loop, dorsal mesentery, vitelline duct);
- `under` / `children` (drawn inside the embryo's coordinates, under the cavities or on top).
- The neural tube (hodi-neurala) is drawn once, along the back. `backAt(u, d)` gives points on the back (topic 5's somite beads at u = 0.06 + 0.9·k/35).
- LoopHeart and the tube helpers moved to components/scenes/week7/LoopHeart.tsx (Lateral.tsx re-exports them; this breaks the SideEmbryo ↔ Lateral import cycle).

### Views

- **mapa ×3** (CoelomMap.tsx): on SideEmbryo; the plane drags with `zNear`; plane ↔ section checked at every step's final frame.
- **zeloma/sagitala** (Lateral.tsx `CoelomExtent`): the one coelom (violet) pours in; the heart travels the head-fold arc from in front of the head into the heart prominence ("hasieran (3. astea)"); orange line = the transverse plane at the midgut; GEROKO TORAXA / GEROKO ABDOMENA region names (uppercase, spaced); arrows up and down from the middle.
- **septum-transversum/sagitala** (`SeptumLateral`): cells gather, the plate grows from the ventral wall to the oesophageal mesenchyme, anchors glow, the coelom splits (pericardial rose above, peritoneal green below), canals open (with flow) and the loupe shows the transverse section at the septum. C3–C5 tags sit on the somites facing the septum (the same convention as the descent view at 4 weeks).
- **diafragma-eraketa/jaitsiera** (Diaphragm.tsx `DiaphragmDescent`): the body is fixed at day 32; the vertebral column is a faint ruler along the back whose levels slide past the septum as the back grows (level L at bead L + off(s), off 12 → 1). At 4 weeks C4 faces the plate; at the end of the 5th week T6 faces its ventral end and T12 its dorsal end (the plate tilts: its dorsal end is pulled caudally). C3–C5 roots join into the phrenic nerve, which lengthens; gold arrows along the back show C4 → T6 and C4 → T12. Stomach under the dorsal plate, liver under the ventral plate. All the old labels and notes are kept; the right column follows its anchors (no crossings).
- **Colour key** (common.tsx `CavityKey`, `KEY7`): one row at the top left, the same in every cavity view: zeloma violet, (hasierako) perikardioa rose, pleura blue, erretenak cyan, peritoneoa green, septuma orange. Used in: zeloma/zeharkakoa, zeloma/sagitala, septum/sagitala, all 3 mapa views, jaitsiera, diafragma/zeharkakoa, kupula 3D, pleura-perikardioa/zeharkakoa, peritoneo-barrunbea/zeharkakoa. Rows are Parts (hover lights the cavity) where the view draws that id; `quiet` elsewhere.
- **zeloma/zeharkakoa steps 1–2**: the Somitak and Bitarteko mesodermoa leaders no longer run through Ektodermoa's: the ectoderm is named over the somite (`mapT(74, 4)`), the parietal layer a little further down the wall.

## Resume list (topic 7, in order)

1. Thorax.tsx `LungBudFront` (pleura-perikardioa/birika-hastapena) is a front (coronal) schematic with its own simple body outline; it was left as is (a side embryo cannot stand in for a coronal view). Decide whether it needs a front embryo.
2. Colour key not yet in: DiaphragmFate, DiaphragmBelow/DiaphragmProfile, PeritoneumTypes, CavitySummary (has its own keys in the same colours), LungBudFront.
3. Raise the P.* tint alphas (P.peri/pleura/perito/canal) towards the key colours in the older section views; known clash: the pleural cavity in pleura-perikardioa/zeharkakoa reads pinkish; violet pleuroperitoneal membranes vs coelom violet. Tell the topic 10 owner the pericardium colour (#ff7d9c).
4. zeloma/zeharkakoa: the open-to-chorion moment in steps 3–4; Errai/Paretako/Zeharkako tolespena leaders in steps 4–5; focus weighting.
5. Static steps: peritoneo-barrunbea; diafragma-eraketa 1–3; diafragma-heldua 2/4/6; pleura-perikardioa 4/5/8.
6. Week 7 off-structure dots to 0, with composites in span mode.
7. Lead items A–D: peritoneum fusion; motak table; pleural fill and the fist-in-balloon inset; lung buds into the canals.

## Notes

- Shared files edited minimally: lib/sim/types.ts, content/registry.ts, app/dev/frames/Frames.tsx.
- Offline SSR contact-sheet tools are in the session scratchpad (w7agent/sheet.mjs, audit/sheet.audit.tsx). They will not survive the session; recreate them from labels.test if needed.

## Closing batch 2026-10-12 (labels in the side views)

Landed: descent view (Diaphragm.tsx) tags only the levels the notes name (C3–C5 at 4 weeks, fading before they leave the neck; T6/T12 at the end), nerve roots stop at the neck, short gold arrows to T6/T12, right-column names fixed in place (noArrange) and kept clear of tags/arrows. Side views (Lateral.tsx): Bihotza and Hasierako perikardio barrunbea named from the dorsal (right) column so no leader crosses the face; heart name crossfades left→right in zeloma/sagitala; long names lifted above the right pill. Diaphragm.tsx and Lateral.tsx are self-contained (each has its own column()).

Left for next time:
- jaitsiera t≈1: Hodi neurala's leader still crosses Hestegorria's; Urdaila's leader passes close under the T12 tag.
- jaitsiera 4 weeks: C3–C5 nerbio espinalak and Nerbio frenikoa names sit low with long leaders.
- Colour-key first row sits tight under the top edge in jaitsiera.
- Lateral views: only t=0.685/1 (septum) and t=0.905 (zeloma) re-shot after the last fix; other steps covered by tests only.
- Tried (and reverted) moving the jaitsiera Hodi neurala anchor down to cord(12)–cord(12.8): it untangles the 4-week frame and the Hestegorria crossing, but at the end of week 5 its leader then runs into the T6 tag. Fix needs the T6 tag moved or the column order changed together.
