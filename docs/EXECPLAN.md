# EnbrioAtlas: execution plan for the remaining work

Written 2026-10-12, at the close of the session. State at writing: all 812 tests pass; `tsc` and `eslint` are clean; nothing is half-done. Nothing is committed yet.

The detail for each area is in `docs/handover/*.md`. This file is the order of work and how to do it.

---

## 0. How to run each batch

These rules come from what worked, and failed, this session.

- **Order of priority.** Do what is shown to classmates and teachers first:
  1. the presentation (UI);
  2. topic 7, the hardest topic, shown first;
  3. topic 9, also shown first;
  4. topic 8;
  5. the new topics 10 and 11;
  6. topics 1–6.
- **Batches.** Each batch has 3–6 named items, a finish line (tests, one before/after image, a short report) and a time box of 15–25 minutes. Don't loop for more polish after the finish line.
- **Agents.**
  - At most 3 at a time. Use `opus-high` for scene and UI design work and `sonnet-high` for plumbing, data and tests.
  - **One owner per file.** If two agents need the same area, split it by file. Shared kit files (`components/kit/**`, `week7/common.tsx`, `SideEmbryo.tsx`) are edited by one agent only.
  - When an agent stops, it hands its info to whoever continues (an update in `docs/handover/`). Anything not finished goes back to a compiling, passing state. Never leave a half-done edit.
- **Rules every batch keeps:**
  - Keep all labels.
  - No drawn pointers: glow or outline the structure instead.
  - Text always sits above lines.
  - Leaders don't cross, and a label sits on the same side as its structure.
  - Anchor dots sit well inside one structure, never on a seam.
  - The same structure looks the same in every topic.
  - The notes are the truth; their prose beats their tables.
  - No past-exam material anywhere.
  - PC/tablet only (768–1440).
  - The embryo body always comes from the week-5 embryo (`SideEmbryo`).
  - Never read or use the keys in `.env.local`.
- **Checks for every batch:**
  ```bash
  npx vitest run tests/labels.test.tsx tests/visibility.test.tsx -t "7. "
  ```
  Replace `7.` with the topic number. The tests run in Basque, so the test names start with "7. astea" and "7. gaia".
  ```bash
  npx tsc --noEmit
  ```
  ```bash
  npx vitest run
  ```
  Run the full suite once at the end of a round.
- **Seeing a scene:**
  - Frame sheet: `http://localhost:3000/dev/frames?w=<topic>&s=<stage index>&v=<view id>&cols=2`. Add `&anchors=1` to show the anchor dots.
  - Real pages: `/`, `/astea/<n>`, `/kronologia`, `/egiturak`, `/leinuak`, `/irudiak`.
  - The headless screenshot driver lived in the session scratchpad and does **not** survive. Recreate it as `scripts/dev/shoot.py` (the source is in the appendix).

---

## 1. Decisions for you (before the next batch)

| # | Decision | Options |
|---|---|---|
| D1 | The home page says "11 gai" while topics 10–11 show "Prestatzen" | (a) count only the finished topics ("9 gai + 2 prestatzen"); (b) keep 11 |
| D2 | Commit this session's work | One commit now, before the next round (recommended: it is a large working tree) |
| D3 | Topic 7 front (coronal) view `LungBudFront` uses its own simple body outline | Keep it as a schematic, or build a front embryo |
| D4 | Topic 9 `Domains3D` view (53 bad dots) | Demote it to the second view behind `domeinuak`, or fix it fully |
| D5 | Voice narration (TTS) | Stays parked unless you ask |
| D6 | Unused AI route `/api/tutor` and `lib/ai/provider.ts` | Delete them, or keep them |
| D7 | Topic 11 notes contradiction (5.1, p5) and Kronologia day-84 data (lists exocoelomic cysts, somites and the neural crest as still present) | You check the notes; the agent applies the fix |

---

## 2. Batch A: presentation polish (UI), ~20 minutes, 1 `opus-high` agent

**Owns:** `app/globals.css`, `components/shell/**`, `components/kimu/**`, `components/shell/landing.css`.

| # | Item | Where | How | Done when |
|---|---|---|---|---|
| A1 | At 768 the fixed "Galdetu" button covers the end of the reel's "Ireki simulagailuan" link | `components/kimu/kimu.css` (pill), `components/shell/landing.css` (reel foot) | Give the reel foot right padding equal to the pill width at ≤820px, or lift the pill while the hero is in view | Home at 768 shows the whole link at the first scroll position |
| A2 | `/irudiak` filters: "0/0 zuzen" wraps onto a line of its own at 1440; the group hairline is out of line when the filters wrap at 1024 | `components/shell/ImageLab.tsx` + its CSS | Put the score in the header row (`margin-left:auto`, `white-space:nowrap`); draw the hairline as a border on the group, not as a separate element | Shots at 1024 and 1440 are aligned |
| A3 | Home map cards: their date kickers are lowercase mono, while the topic cards use uppercase | `components/shell/landing.css` | Use the same kicker class or tokens as the topic cards | The kickers match |
| A4 | The Kimu panel and the tour have not been re-checked since the last changes | `components/kimu/*`, `components/shell/tour/*` | Run the tour at 1024 and 1440 (and a few stops at 768); open Kimu on `/` and `/astea/7` | No card sits over its target; no panel clips |
| A5 | Home Chronicle: the day readout repeats the "0. eguna" date line; the section is a little taller than 1440×950 | `components/shell/Chronicle.tsx` | Drop one of the two date lines; tighten the vertical spacing | It fits 1440×950 |
| A6 | Topic 7 dock: the tallest-step reservation (385 px) leaves the frame only 353 px at 1440×900 | Topic 7 captions (`content/weeks/week7.ts`) or the dock's sizing | Shorten the 2–3 longest captions (meaning unchanged), or reserve space per step | The topic 7 frame is visibly larger at 1440×900 |

**Done:** before/after per item, tests for the tour and labels, `tsc`, `eslint`.

---

## 3. Batch B: topic 7 finish, ~25 minutes, 2 `opus-high` agents split by file

The detail is in `docs/handover/topics-7-10.md` (resume list and closing batch).

**Agent B1** owns `components/scenes/week7/Diaphragm.tsx` and `Thorax.tsx`.

| # | Item | How |
|---|---|---|
| B1.1 | Descent view at t≈1: Hodi neurala's leader crosses Hestegorria's | Change the T6 tag and the Hodi neurala anchor **together**. Moving only the anchor (to `cord(12)`) was tried and reverted: it fixes the crossing, but the leader then runs into the T6 tag. Move T6 to the arrow's tail, then anchor Hodi neurala below the oesophagus's leader. |
| B1.2 | Descent view at 4 weeks: the "C3–C5 nerbio espinalak" and "Nerbio frenikoa" names sit low, with long leaders | Let the column start these two near their anchors' height, or lift the bands that push them down |
| B1.3 | Descent view: the colour key's first row is tight under the top edge | Add a few px of top offset |
| B1.4 | Static steps: diafragma-eraketa 1–3, diafragma-heldua 2/4/6 | Each narrated change must be drawn; add the missing motion or glow |

**Agent B2** owns `components/scenes/week7/Lateral.tsx`, `Coelom.tsx`, `Peritoneum.tsx` and `CoelomMap.tsx`.

| # | Item | How |
|---|---|---|
| B2.1 | Re-shoot every step of septum-transversum/sagitala and zeloma/sagitala (only 3 frames were checked after the last fix) | Frame sheet, all steps; fix any crossing |
| B2.2 | zeloma/zeharkakoa: the moment it opens to the chorion (steps 3–4); the Errai/Paretako/Zeharkako tolespena leaders (steps 4–5) | Use the arranger bands, as in Lateral |
| B2.3 | Static steps: peritoneo-barrunbea; pleura-perikardioa 4/5/8 | Same as B1.4 |
| B2.4 | Colour key missing in: PeritoneumTypes, CavitySummary (it has its own keys) | Use the shared `CavityKey` with `KEY7` |

**After both are done (one agent):**
- Raise the `P.*` tint alphas towards the key colours. One known clash: the pleural cavity reads pink in pleura-perikardioa/zeharkakoa.
- Set all week 7 off-structure dots to 0. Composites go in span mode.
- Run the anchor audit.

---

## 4. Batch C: topic 9 finish, ~25 minutes, 1 `opus-high` agent

The detail is in `docs/handover/topics-8-9.md`.

1. Re-run the anchor probe (the old `anch.sh 1`; recreate it from `scripts/anchor-audit.mjs`). Re-check the 5 misses:
   - paraxiala: miotoma and begiaren-kanpoko-muskuluak;
   - miotoma: esklerotoma and paretako-orria;
   - fusioa.
2. Render and check `miotoma` and `fusioa`. Neither has been looked at since the last edits.
3. Fix the 5 known crossings:
   - okzipitalak and burua: laugarren-seigarren-arkuak × nerbio-bagoa;
   - gorputz-adarra: paretako-orria × mioblastoak;
   - somita and domeinuak: aurre-alboko-muskulu-zelulak × paretako-orria;
   - domeinuak: miotoma × bizkarreko-muskulu-sakonak.
4. `begia`: the nerves enter from the orbital apex.
5. `burua`: "Faringe arkuak" in span mode.
6. `heldua`: the "Muskulu murtsikatzaileak" dot moves off the zygoma.
7. Apply decision D4 (Domains3D).
8. Run the silent test for week 9 and fix the "!!" steps.

---

## 5. Batch D: topic 8, 2 batches, 1 `opus-high` agent

The baseline has 174 bad dots. Use the topic 9 method: an anchor audit, dots to zero (span mode for composites), crossings, then static steps. Do topic 8 after topic 9: topic 9 is shown first.

---

## 6. Batch E: Kronologia and home shelf, ~25 minutes, 1 `opus-high` agent

The detail is in `docs/handover/kronologia.md`.

1. **TopicShelf.**
   - Move `<section id="gaiak">` from `Home.tsx` into `components/shell/TopicShelf.tsx` + `shelf.css`.
   - Keep the counts coming from the registry.
   - Show "Hemen utzi zenuen · <stage>" with a deep link, and a progress bar ("Osatuta" when done).
   - Drop the "Berria" badges.
   - Then clean up `.lp-shelf*`/`.lp-card*` in `landing.css`.
2. **NowCard:** use `statusAt`/`changesBetween` (the same boundary as /kronologia) and link to `/kronologia?eguna=`.
3. Kronologia data: apply decision D7 (day 84).
4. Take shots of /kronologia and the Chronicle at 768.

---

## 7. Batch F: notch bands (scene text clear of the pill notches), ~15 minutes, 1 `sonnet-high` agent

**Views, from `docs/handover/ui.md` item 2:**
- bottom notch:
  - 1/ibilbidea/umetokia;
  - 11/septum-primum frontala and eskuinetik;
  - 11/zulo-obala frontala and eskuinetik;
- top notch:
  - 10/eskualde-kardiogenikoa/diskoa;
  - 11/septum-primum biak, frontala and eskuinetik;
  - 11/zulo-obala biak, frontala and eskuinetik.

Keep text out of the top and bottom centre band. The probe was `scratchpad/ui-probe/pills.test.tsx` (lost); write it into `tests/` instead. Topics 10 and 11 can wait until they are built.

---

## 8. Batch G: topic 10 (heart tube), then topic 11 (atrial septa), several batches

The detail is in `docs/handover/topic-10.md` and `topic-11.md`.

- **Topic 10:**
  1. Stage 2: the sagittal view and its two beats (notes p10, p19–p21).
  2. Stages 3–10, reusing ids and colours.
  3. The quiz and `NOTES[10]` sections 2–3.
  4. Kronologia milestones for days 21, 23 and 28.
  5. The narration week cap in `lib/narration/server-utils.ts`: it still rejects week > 9.
  6. The anchor audit (`node scripts/anchor-audit.mjs http://localhost:3000 10-10`).
  7. The `Specimen.tsx` case for week 10.
- **Topic 11:**
  1. Settle the septum colour pair.
  2. Do the browser pass on stages 2–4.
  3. Add the `Specimen.tsx` case for week 11.
  4. Build stage 1, then stages 5–11 in notes order.
  5. Stage 10, the spiral septum: an SVG projection with three level cross-sections.
- When a topic is complete, remove its `inPreparation` flag in `content/weeks/week10.ts` / `week11.ts`. "Prestatzen" disappears, and D1 resolves itself.

---

## 9. Batch H: topics 1–6, lowest priority, 1 `opus-high` agent, 2–3 batches

From `topics-1-3.md` and `topics-1-6.md`:
1. Topic 3, gastrulazioa/biak: clutter and overlapping names in the dual view.
2. Topic 3, diskoa: duplicate steps.
3. Topic 3, 2-astearen-amaiera and gastrulazioa/goitik: camera jumps.
4. Topic 6: re-run the silent test (the last run predates the Villus change). Then fix the static steps it flags: the karena-muga, biloxka-askeak, korion-hostotsua, kotiledoiak, aterminoa, zilbor-hestea and likido-amniotikoa lists in `topics-1-6.md`. The funtzioak view is empty until step 8.
5. Run the anchor audit for topics 1–6. The last counts were W1 65, W2 78, W3 157 (before fixes), and about 70 in topic 6 stages 2–6.
6. Home teaser, topic 1 fertilisation scene: the caption collides with the "FASEA 0/3" readout (`components/scenes/week1`).

---

## 10. Batch I: cleanup (after decisions D6 and D2)

- Delete `/api/tutor` and `lib/ai/provider.ts` if D6 = delete. Check that nothing imports them, then run `tsc`.
- Voice readiness only if D5 changes: coverage, degrade, a status dry-run and the generate command. Never run generation without you; the TTS key stays server-side.

---

## Suggested order and time

| Round | Batches (in parallel, ≤3 agents) | About |
|---|---|---|
| 1 | D1–D2 decided and committed; A (UI) + B1 + B2 (topic 7) | 30 min |
| 2 | C (topic 9) + E (Kronologia) + B follow-up (tints, dots) | 30 min |
| 3 | D (topic 8), two batches | 50 min |
| 4 | G (topic 10) | several rounds |
| 5 | G (topic 11), F, H, I | when time allows |

After every round, the main session:
1. reviews the before/after images;
2. runs `npx vitest run`, `npx tsc --noEmit` and `eslint` on the touched files;
3. updates `docs/handover/*.md`;
4. reports what landed.

---

## Appendix: the headless screenshot driver (`scripts/dev/shoot.py`)

```python
import subprocess, sys, os
E = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
base = os.path.dirname(os.path.abspath(__file__))
prof = os.path.join(base, "edgeprof-shoot")
out = os.path.join(base, sys.argv[1]); os.makedirs(out, exist_ok=True)
for sz in sys.argv[2].split(";"):
    for p in sys.argv[3:]:
        name, url = p.split("=", 1)  # url without a leading slash; "home=" for /
        f = os.path.join(out, f"{name}-{sz.split(',')[0]}.png")
        subprocess.run([E, "--headless=new", "--hide-scrollbars", "--force-prefers-reduced-motion",
                        f"--user-data-dir={prof}", f"--window-size={sz}", "--virtual-time-budget=20000",
                        f"--screenshot={f}", "http://localhost:3000/" + url], capture_output=True, timeout=120)
        print(name, sz, os.path.exists(f))
```

Usage:
```bash
python -I scripts/dev/shoot.py shots "1024,768;1440,900" "home=" "w7=astea/7"
```
