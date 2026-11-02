# Topic 14 polish — status (2026-11-02)

Owner: "no lo veo ni bien pulido ni se entiende bien"; reference figures `C:\Users\aitor\Downloads\Enbriologia_liseri-aparatua.pdf`
(8 pages, rendered PNGs in the session scratchpad `pdf/p01–p08.png`). Four Opus agents audited 19:50–20:00 and
stopped; their defect lists and plans are in `topic-14-polish-1-5.md`, `-6-16.md`, `-17-24.md`, `-25-26.md`.
Nothing is committed.

## Batch 1 — landed (main session)
- **Stage 1** (`Fold3D.tsx`): block shortened (ZL 1.15 → 0.5) and cameras nearly face-on, so the cut face reads
  like p1 A–C; the yolk sac stays in frame; lighter shading.
- **Stages 2–5** (`gut3d.ts`, `Early3D.tsx`): the gut is the protagonist (radius 0.12 → 0.155, body glass 0.6,
  heart 0.25–0.35, vessels 0.15 unless the step is about them); vitelline duct, yolk sac and allantois opaque;
  the laryngotracheal tube and lung buds light blue, clear of the foregut; pharyngeal pouches seen from ventral
  (four pairs as a comb); stage 3 marks moved off the leaders; thicker coeliac/SMA/IMA; stage 5 cavity,
  parietal peritoneum and mesentery more opaque, kidneys larger, septum rounder.
- **Stage 7** (agent 2, `foregut-model.ts` `stomachAxis`): J-shaped stomach with fundus and pyloric part, and the
  two rotation axes as rods while each rotation runs. Renders; reads better in step 3, but steps 5–7 look
  bean-like and the dorsal mesogastrium's attachment must be checked against the bent greater curvature.
- Checks: `tsc` clean, eslint clean on the touched files, `vitest tests/visibility.test.tsx tests/notes.test.ts -t 14`
  78/78. Before/after: `shots14/batch1-before-after.png`.

## Batch 2 — landed: the live transverse section
- `components/scenes/week14/Section14.tsx` (`ForeSection`, `sectionShow`, `SECTION_BOX`/`SECTION_LEFT`): the notes'
  section style (dorsal up, the embryo's right on the viewer's left), drawn from the same pose as the 3D, bottom
  left of the view. Levels: `early` (stage 5: cavity, visceral peritoneum, dorsal mesentery, ventral mesogastrium,
  retroperitoneal kidneys/aorta/IVC), `stomach` (stomach walls turning 90°, dorsal mesogastrium → spleen and its
  two ligaments, liver moving right, lesser omentum, falciform, the bursa, Winslow's mouth), `duodenum`
  (mesoduodenum, duodenum swinging right and fusing behind the parietal peritoneum, ventral bud round to the
  dorsal one). Names: only the step's lit ids, in the margins with short leaders.
- Shown: stage 5 all steps; 7 steps 2 and 7; 8 all; 9 steps 1–2; 10 all; 11 steps 4–6; 15 steps 2–3.
- `common.tsx` `StageSpec.section` (inset + the left name column kept above it); `week10/Heart3D.tsx`
  `ModelView` got an optional `left` column span (default unchanged).
- Checks: tsc, eslint clean; topic 14 tests 78/78; shots 1440, 1024×768, 768×1024 (`shots14/batch2-section.png`).
  At 768 the inset text is small (≈7 px) but readable.

## Batch 3 — landed: the loop and the hernia (stages 18–19)
- `midgut-model.ts`: the primary loop is a U (narrow neck at the root, rounded apex, half width 0.36 → 0.5 out
  in the cord) instead of a thin hairpin; limbs thicker (r 0.1) and in contrasting colours (pale pink / coral);
  the caecal bud a conical swelling on the caudal limb; the yolk sac at the end of the vitelline duct; SMA
  branches fan from the nearest trunk point to both limbs; the cranial limb coils round itself in the cord.
  N 150 → 240; jejunum and ileum are trochoid coils (`coils()`), `finalLine` memoised. Cord/coelom lighter.
- Rotation arrow (`rotArc`, pose field `arc`): an arc round the SMA from the cranial limb's start to where it is,
  with an arrowhead, and the degree readout (90° → 270°) drawn by `arcOver` in `Midgut3D.tsx` (stages 18–19).
- `Midgut3D.tsx`: stage 18 step 5 raises the SMA branches; step 6 three-quarter camera; step 2 names the yolk
  sac; stage 19 cameras follow the jejunum in (upper left) and then the caecal bud (under the liver).
- Checks: tsc, eslint clean; topic 14 tests 78/78; shots 1440, 1024×768, 768×1024
  (`shots14/batch3-loop-hernia.png`, before left / after right).
- Still weak: stage 19 step 2 mid-return is busy; jejunal coils read as springs more than meanders.

## Next batches, by value
1. Sagittal inset for stage 9 steps 3–6 (greater omentum leaves, inferior recess, fusion with the transverse
   mesocolon, p3 bottom A/B) — same machinery, a `sagittal` level.
2. Stage 7 steps 5–7 stomach shape + mesogastrium attachment; then knock-on check of stages 8–16 (pylorus moved).
3. Stages 20–24 (`topic-14-polish-17-24.md`): summary colours to p8 (yellow/red/orange), caecum + appendix,
   cloaca 22.
4. Stage 5 again (retro step: aorta dominates; mesentery step camera), stage 4 aorta less dominant.
5. Lungs 25–26 (`topic-14-polish-25-26.md`), cloaca 22, the rest.

Shot driver (self-contained, port 9342): session scratchpad `fg/shots.mjs` —
`node shots.mjs <outDir> 1440 900 "stage@une,..."`. `scripts/perf-topic10.mjs` pins port 9341.
