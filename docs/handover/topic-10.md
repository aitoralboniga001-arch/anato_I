# Topic 10 handover: 10. GAIA, ZIRKULAZIO APARATUA

Source: `10. GAIA_ ZIRKULAZIO APARATUA (ZUZENDUTA).pdf` → `content/notes-text/w10.ts` (sentence ids `w10/<section>/p<n>/s<n>`). When the prose and the tables disagree, the prose wins. Week 10 is registered with `inPreparation: true` (new optional `WeekDef` field). To show it as "prestatzen" while the built stages stay reachable, the shell's `isWip` in `components/shell/LandNav.tsx` needs `w.inPreparation ||`.

## Stage plan

| # | stage id | notes | state |
|---|---|---|---|
| 1 | `eskualde-kardiogenikoa` (views `diskoa`, `zeharkakoa`) | w10/1/p3–p8 | **done**, accepted by the lead |
| 2 | `bihotz-hodia` (view `zeharkakoa`) | w10/1/p9, p11–p18 | **done** for the section view |
| 2b | `bihotz-hodia` view `sagitala` (cephalocaudal fold, plaka kardiogenikoa from the neck to the thorax; aortic arches) | w10/1/p10, p19–p21 | to do. Plan: rotate a head flap 180° round a hinge caudal to the BPM; add beats at ≈0.1 (p10) and ≈0.84 (p19, p21) |
| 3 | `zirkulazio-goiztiarra` (real lateral embryo, vessels coloured by O2, summary table) | w10/1/p22–p36 | to do |
| 4 | `bihotz-atalak` (21. eguna: segments) | w10/2/p3–p11 | to do |
| 5 | `bihotz-lakioa` (23–28. egunak; front and side views with a ghost of the start and an orientation cross) | w10/2/p12–p22 | to do |
| 6 | `atal-bulbarra` | w10/3.1 | to do |
| 7 | `atal-bentrikularra` | w10/3.2 | to do |
| 8 | `atal-aurikularra` | w10/3.3 | to do |
| 9 | `zain-sinua` (posterior view, the shift from left to right) | w10/3.4 (first half) | to do |
| 10 | `eskuineko-aurikula` (valves, septa, smooth vs trabeculated parts, crista terminalis) | w10/3.4 (second half) | to do |

## Files

- `content/weeks/week10.ts`: the WeekDef with stages 1–2. `quiz: []` for now.
- `content/weeks/week10-structures.ts`: every topic 10 id with its colour (`SEG` = segment colours). It already has the ids that stages 3–10 will need.
- `components/scenes/week10/Disc.tsx`: stage 1 seen from above (`D1` timings).
- `components/scenes/week10/DiscSection.tsx`: stage 1 close-up section.
- `components/scenes/week10/Fusion.tsx`: stage 2 section (`D2` timings). It starts from stage 1's last frame and folds via key shapes A/B/C.
- `components/scenes/week10/flat.ts`: shared geometry of the flat disc section (`F`, `ectoTopAt`, `ectoBottomAt`, `coelomRight`, `range`).
- `components/scenes/week10/common.tsx`: palette `T`, `Defs10`, `Stream` (blood cells along a path), and re-exports of the week 7 helpers and the week 9 `Steps`/`SummaryTable`.
- Shared files that were edited:
  - `content/registry.ts`, `content/notes.ts` (NOTES[10] section 1), `content/notes-text/index.ts`
  - `content/chronology.ts`: 3 milestones
  - `lib/sim/types.ts`: week 10 and `inPreparation`
  - `components/shell/StudyMap.tsx`, `components/shell/TopicShot.tsx`
  - `tests/notes.test.ts`: w10 pin, beat count 560
  - `tests/visibility.test.tsx`: 2 GONE and 3 MENTION_ONLY entries for week 10, each with its reason
  - `scripts/narration/export-catalog.test.ts`: the week count is now ≥ 10

## Colours

- Germ layers follow topics 3–9. The heart wall: endocardium `#f9a8d4`, cardiac jelly `#a9e4dc`, myocardium `#d6337a`, epicardium `#f3b5c4`, epimyocardial layer `#e46a8c`.
- Blood by oxygen content: oxygenated `#e5484d`, deoxygenated `#3b82f6`. Mixing is never drawn as purple.
- One colour per heart segment, kept by everything that segment becomes: sinus venosus `#9b7bf0`, atrium `#ef7d2d`, ventricle `#22b8cf`, bulbus `#3fbf73` (its proximal part `#2fa865`, conus `#9ccc3c`, truncus and aortic sac `#e6dcc0`).
- Open item: `septum-primum` (`#fde4c8`) and `septum-secundum` (`#fcd9b6`) are too similar. The topic 11 agent now updates them in `week10-structures.ts`; the lead's suggestion was pale cream for primum and rose `#ec8fbf` for secundum.

## Resume list

1. Stage 2 sagittal view and its two beats (p10, p19–p21).
2. Stages 3–10 as planned above. Reuse ids and colours; use Label `span` for layered wholes.
3. Then: the topic quiz, NOTES[10] sections 2–3, chronology milestones for days 21, 23 and 28, the narration week cap in `lib/narration/server-utils.ts` (it still rejects week > 9), and the anchor audit (`node scripts/anchor-audit.mjs http://localhost:3000 10-10`; it overwrites docs/anchor-audit.md). The last audit run flagged 7 dots; they have been moved but the audit has not been re-run.
4. The `Specimen.tsx` week 10 case and `isWip` are shell work.
