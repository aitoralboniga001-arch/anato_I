# Triage: Gemini 4 Argon's review of the class plan (v2), 2026-10-16

Every claim was checked against the code, the notes (`content/notes-text/w10.ts`) and `docs/klasea-plan.md` v2. Verdicts:
- **✔ confirmed**: the substance holds, and it went into plan v3.
- **◐ half**: the point holds, but its evidence was partly wrong.
- **✘ false**: the evidence was invented, or the claim is wrong.

Paste this file into the next Gemini prompt so it does not repeat closed items.

## Findings

| # | Claim | Verdict | What was checked | In v3 |
|---|---|---|---|---|
| 1 | The core rules drop causal, arterial-outflow and orientation sentences; the "section 3 table" is not in `w10.ts` | ◐ | Real ids, correct text: `w10/1/p3/s1`, `p26/s1–s3`, `2/p9/s1–s2`, `2/p20/s4`, `3.3/p3/s1–s2`. Real ids but text misquoted: `p33/s1`, `p34/s1`, `p35/s1`. Invented id: `p35/s2`. There is no table in the notes text (the table only exists in `AtriumTable`, `RightAtrium.tsx:361`). The v2 rules would leave these sentences out of the core. | §5 rules R2–R5, a pinned test set, and the table built from prose |
| 2 | The right column is a drawer with a scrim at ≤1320 px | ✔ | `Simulator.tsx:220` `NARROW_SCREEN`, `:1114–1115`, scrim `:2121` | §10 board placement |
| 3 | The respelling breaks `torax`, `plexua`, `extrazelularra`, `xixkuak`; the Spanish voice stresses the last syllable of `-ak` words | ◐ | `torax` ×2, `plexu` ×2, `extrazelular` ×1, `xixku` ×2 and `oxigen` ×10 are all in the notes. "biloxka" and "estrazelular" are not. The stress rule is real Spanish orthography. | §9 rules |
| 4 | The Simulator fights the class: auto view, `namedAt`, the default `guided`, deep links, the tour offer | ✔ (code paraphrased) | `Simulator.tsx:475` autoView; `named.ts:52` returns `null` at the last step and cannot take spoken ids; `prefs.ts` `guided: true`; `readDeepLink :248`; `replaceState :556`; `TourHost.tsx:13` `OFFER_AFTER = 1600` | §10 class hooks; §2 deep-link rule |
| 5 | Voice, morph, labels, subtitles, Kimu and the board all move at once (split attention) | ✔ principle | Design reasoning | §4 line rhythm: board cell after the line; scene holds while it writes |
| 6 | "Unsure" and predictions passed to `recordAnswer` corrupt the review | ✔ (code paraphrased) | `answers.ts:45`: a right answer pushes `due` forward, so "unsure but right" would never come back; a wrong one counts as a wrong answer | §10 `recordAnswer(…, { unsure })`; predictions are not recorded |
| 7 | Edge's `eu` voices are online-only; the word-based timing is too fast; `cancel()` then `speak()` races | ◐ | "`narrate.ts:56–77` calls `speechSynthesis.cancel()`" is **false**: there is no `speechSynthesis` anywhere in the code. The notes average **2.83** syllables per word, not 3.1–3.6, but the v2 estimate was still too fast. The Edge and race points are plausible, and their mitigations are cheap. | §9 |
| 8 | Blocked chunks of look-alike fates need contrast checks | ◐ principle ✔, evidence ✘ | Every id it cited (`w10/3.5/*`, `3.3/p10`, `3.2/p11`, …) is **missing**: section 3.5 does not exist. "Birika zainak", "sinus venarum" and "Kono arteriosoa" are not in the notes. The left atrium is not in topic 10. | §3 contrast checks on topic 10's own look-alikes |
| 9 | Kimu's gaze and tilt during motion pull the eye off the specimen | ✔ principle | It quoted plan text that does not exist (`lookAt: 'student'`, "Half-body"), but the v2 eye tracking had the same risk | §8: gaze moves only at phase boundaries |
| 10 | `KimuHere` has no field for the class line; Kimu opening does not pause the class | ◐ | The `KimuHere` it quoted (`weekTitle`, `beatText`, …) is **invented**: the real one is `{ week, stage, beat, structure, view }` (`lib/kimu/types.ts:72`). v2 already planned the lesson fields. Pause-on-open is new and valid. | §10 |
| 11 | Fill in a blanked table before the exit quiz | ✔ | Design reasoning | §4 chunk 10 |

## Proposed guards

| Gap | Verdict | In v3 |
|---|---|---|
| A line's cited sentences vs the steps its time covers | ✔ idea. `WEEK10_BEAT_NOTES` does not exist; use `beat.notes` | §6 G1 |
| Focus vs the structure the cited sentence is about | ✔ | §6 G2 |
| Swapped left and right | ✘ "no test does this": v2 §6 already had the direction guard. Its equivalence classes were adopted. | §6 G3 |
| Visibility at the start, middle and end of a glide, with the spoken set | ✔ | §6 G4 |

## Bigger ideas

| Idea | Verdict |
|---|---|
| Fill in the board table | ✔ (= finding 11) |
| "What if it fails?": dextrocardia, ASD (`w10/2/p21/s1`, `2/p29/s2`, `3.2/p14/s2`) | ✘ "Dextrokardia" appears **0 times** in the notes. `p21/s1` says "28. egunerako prozesu hau amaitu egiten da". The other two ids do not exist. Rejected: not grounded. |
| Click the structures on the 3D in blood order (`onPickStructure`, `[data-structure]` in `Viewport.tsx`) | ✘ Neither exists, and there is no 3D picking. Replaced by an "order the path" chip check that lights each segment (§3). |

## Other errors to watch for next time

- It "quoted" at least 8 phrases from the plan that are not in it, for example "if and only if", `WEEK10_STRUCTURES`, a 4-question exit quiz, the four pulmonary veins and `setKimuHere on every line`.
- It counted 83 steps in topic 10; there are 70.
- Every finding was labelled "High" confidence, including the ones with invented evidence.
