# Handover: topics 9 (muscular) and 8 (bone)

State when handed over (2026-10-12):
- `npx vitest run tests/labels.test.tsx tests/visibility.test.tsx -t "9|8" --testTimeout=60000` passes: 130 tests.
  - With the default 5 s timeout, `domeinuak` / `domeinuak-3d` time out under machine load. That is load, not a bug.
- `npx tsc --noEmit` is clean.
- `npx eslint components/scenes/week9 content/weeks/week9.ts` is clean.
- Topic 8 was not started.

Scratch tools (frame, anchor and silent scripts, before and after PNGs):
`%TEMP%\claude\C--Users-aitor-Downloads-1-MEDICINA\8e6b5035-...\scratchpad\t9` (frame.sh, anch.sh, silent.sh, b/, a/, before/, audit/w9-before.md).

## What landed (topic 9, stages 0–1)

**s0 `jatorria` (Origins.tsx, rewritten)**
- Step 1 washes the mesoderm sources.
- Step 2 streams myoblasts from the somites into the body wall.
- Steps 3–4 zoom in on the gut and heart (`originsCam`). Smooth muscle forms round the gut, then the myocardium round the heart tube.
- The parietal layer is now drawn over the pericardial cavity, so its dot is on it.
- Every dot is inside its structure. The old faint arrows were removed.
- Anchor probe: 0 misses, 0 crossings.

**s0 `ehunak` (Tissues.tsx, rewritten)**
- The three panels build in sequence (`TISSUE_T`), with captions in sync.
- Comparison cards (Nukleoak / Ildaskak / Zelulak) appear, then give way to the ectoderm-exceptions box.
- Intercalated discs are stepped bands, dots inside.
- Rendered and checked.

**s1 `paraxiala` (Paraxial.tsx)**
- The band draws in head to tail.
- The camera closes in on the head while the 7 numbered somitomeres form one by one, then pulls out while the trunk segments.
- A second head close-up shows the arrows to the eye muscles (a crimson cone round the optic cup, new `begia` Part) and to the arches.
- Myotomes grow into the flank.
- There are separate label sets for the whole view and for the close-up.
- The somitomere name now appears with the first somitomere. This fixed a visibility failure.

**s1 `miotoma` (Somite.tsx)**
- A sclerotome glow Part gives the sclerotome dot a home.
- The highlight on the somite's dorsal wall is wider.
- The note "miotoma = dermatomaren alde bentralean" overlapped the lips. It was removed; the caption already says it.
- The parietal-layer dot moved down the layer.

**s1 `fusioa` (Fusion.tsx)**
- Dots moved onto their cells.
- Fibrils are wider, and the striae start at x=246, so the bare fibrils show at the cut end.
- Intercalated discs use the same stepped band as `ehunak`.

## Open, by priority (topic 9 first)

1. **Re-run `anch.sh 1` when :3000 is back up.** The server went down mid-check. The last result showed 5 misses:
   - `paraxiala`: miotoma and begiaren-kanpoko-muskuluak. The dots have since been moved: the myotome dot to somite 16, the eye dot to the front of the cone. Not yet re-probed.
   - `miotoma`: esklerotoma. A glow Part was added since; not yet re-probed.
   - `miotoma`: paretako-orria, still sitting on migrating lip cells (Part `miotoma`). Scan for a clear point along the layer.
   - Fusioa dots were moved and not yet re-probed.
2. **Render and check** `miotoma` and `fusioa` after these edits. Neither has been looked at since.
3. **Stages 2–10, from the baseline audit** (`audit/w9-before.md`):
   - Get the dots to zero.
   - Fix the 5 crossings:
     - okzipitalak and burua laugarren-seigarren-arkuak × nerbio-bagoa;
     - gorputz-adarra paretako-orria × mioblastoak;
     - somita and domeinuak aurre-alboko-muskulu-zelulak × paretako-orria;
     - domeinuak miotoma × bizkarreko-muskulu-sakonak.
   - `begia`: nerves should enter from the orbital apex, with a badge on each muscle.
   - Composites:
     - `burua`: "Faringe arkuak" needs span mode.
     - `heldua`: the "Muskulu murtsikatzaileak" dot sits on the zygoma, and its leader nearly crosses Maseter's.
   - Silent "!!" steps: every narrated change must be drawn.
4. **Domains3D.** Not decided. It had 53 bad dots. Recommendation: demote it to the second view of s6, behind `domeinuak`, unless it can be made flawless.
5. **Run the full week 9 checks**: the silent test (`silent.sh 9`) and the anchor audit for week 9 only.
6. **Topic 8.** Not started. The baseline has 174 bad dots. Use the same method.
