# UI handover (simulator redesign, partial topics, Kimu/tour/Kronologia follow-ups)

Screenshots live in the scratchpad of session 8e6b5035, under `scratchpad/shots/`:
- before: `B2-w3-*.png`, `B2-w7-*.png`, `B2-w9-*.png` (1440, 1024, 768);
- after: `Z-{kr,home,w3,w7,w9,tsw,snav}-{1440,1024}.png`, `A4-tsw-*.png`, `A4-snav-*.png`;
- tour: `T-{1440,1024}-{0,1,4,8}.png`;
- Kimu: `K-{open,ans}-{1440,1024,768}.png`.

## Landed

### Simulator redesign
- **Top bar** (`components/shell/Simulator.tsx`): brand, topic switcher, then the tools:
  - Frogatu group (Aurkitu, Galderak);
  - Kimu text button ("Galdetu Kimuri", or "Kimu" at 1024);
  - a separator, then panels, Tresnak and "?".
  - The mobile `<select>` and the "Gaia" label are gone. On mobile, the Tresnak menu carries Galderak and Apunteak.
- **Topic switcher** (`components/shell/WeekNav.tsx`, rewritten). The button shows a number badge, the title and a caret. It opens a two-column sheet (`TopicList`, exported) where each topic shows:
  - its number, title and span;
  - "Hemen zaude · stage" or "Prestatzen";
  - a progress bar or check.
  - Keys: arrows, Home/End and Escape. It closes on an outside click.
- **Stage navigator** (`StageNav` in `components/shell/SidePanel.tsx`). The "Etapa n/N" button opens the notes outline as a sheet, with a pin button ("Zutabean ireki", shortcut `[`).
  - The outline column is closed by default below 1600 px while the right column is open, and below 1280 px otherwise (`components/shell/prefs.ts`).
  - The old rail is removed.
  - On short screens (max-height 820), the navigator sits inline in the heading (`app/globals.css`, at the 14173 block).
- **Orientation pills**. The svg is clipped with `clip-path`, and the viewport is `overflow: visible`. The top and bottom notches sit outside the frame (`translate(-50%, ∓72%)`); the left and right ones sit inside at mid-height.
- **Transport** (`components/shell/Player.tsx`):
  - 32 px quiet keys;
  - play is a 36 px round key, white while cueing;
  - "Ahotsa" is a toggle grouped with the settings caret;
  - the step readout is unpadded.
- **Locator**: the "?" badges are gone.
- All the CSS is one appended layer in `app/globals.css`, starting at "Simulator, redesigned" (around line 13513).

### Partial-topic flag
- `inPrep(w) = isWip(w) || w.inPreparation` lives in `components/shell/LandNav.tsx:10`. It is used by the switcher and by the home cards ("Prestatzen" badge).
- `content/weeks/week11.ts:23` sets `inPreparation: true`.
- Siblings:
  - `LandFoot` and the StructureAtlas eyebrow use `weeks.length`, and so does the `/egiturak` description;
  - `TopicShot` SHOTS has an entry for 11;
  - Specimen handles week 11;
  - `lib/narration/server-utils.ts` uses `MAX_WEEK = 11` (the test pin is moved to week 12 in `lib/narration/server.test.ts:38`).
- **StudyMap** derives one card per registry topic (hand-written cards for 1–9, generated ones after that). Its heading count comes from `countWord`.

### Kimu
- P1 is applied in `Simulator.tsx`:
  - `apunteak=1` on cross-topic jumps;
  - `setPref('notes', true)` before `setBack`;
  - `view: view.id` in `setKimuHere`.
- The Kimu nudge no longer exists, so "hold the nudge while the tour runs" is moot.
- Checked at 1440, 1024 and 768 (simulator, "Zer da notokorda?"). The panel, answer, source card and chips all render, and none of them clips.

### Tour
- `gaiak` and `gaia-hautatu` moved to the switcher; `etapak` is new on StageNav. Nothing was removed.
- Run end to end at 1440 and 1024: all 12 stops lit their target. At 1024, `etapak` now works because of the inline navigator on short screens.

### Kronologia
- 89 dead `.kr*`/`.chron*` rules were removed from `app/globals.css` and 2 selector lists were trimmed; no matches are left. The page still renders (`Z-kr-*`). The backup is `scratchpad/ui-probe/globals.before-dead.css`.

### Hydration
- The Home/Intro hydration mismatch was seen once, during an HMR compile. It did not reproduce in 5 cold runs (normal, full intro, reduced motion; home and simulator). Nothing was changed.

### Checks
- vitest: 810/810 (after the narration pin).
- `tsc --noEmit`: clean.
- eslint on `components/shell`, `app`, `lib/narration`, `lib/kimu/text.ts`, `week11.ts` and `tests/weeknav.test.tsx`: clean.

## Open / half-done (nothing is left broken)
1. **Kimu.** "Nola eratzen da hodi neurala?" still answers with the somites sentence (`lib/kimu/text.ts`, question-word handling). A FORMING/FORMATION attempt made other answers worse and was reverted.
2. **Notch collisions.** The inner ~9 units of these views collide with a notch. Scene owners should keep text out of the top and bottom centre band:
   - bottom notch:
     - 1/ibilbidea/umetokia;
     - 11/septum-primum frontala and eskuinetik;
     - 11/zulo-obala frontala and eskuinetik;
   - top notch:
     - 10/eskualde-kardiogenikoa/diskoa;
     - 11/septum-primum biak, frontala and eskuinetik;
     - 11/zulo-obala biak, frontala and eskuinetik.
   - The probe is `scratchpad/ui-probe/pills.test.tsx`.
3. **Topic 7 dock.** The tallest-step reservation is 385 px, which leaves only 353 px for the frame at 1440×900. This was there before the redesign. Shortening the longest topic 7 captions would give the frame room.
4. **Tour.**
   - At 1024, the cards for top-bar stops land below the scene, far from their target (`components/shell/tour/geometry.ts:80`, `placeCard`; add a distance penalty).
   - At 1440, the tour offer can overlap the view switch.
5. **Hydration.** The mismatch is not reproducible. If it comes back, log the diff with the driver's hydration logging.
6. **TopicShelf** has not started, so the `components/shell/landing.css` `.lp-shelf*`/`.lp-card*` cleanup has to wait for it.
7. **Voice (item 7)** is deferred.

### Cosmetic nits (left for the final polish)
- `app/globals.css:13717` (`.tsw-item-meta`): the current item's "Hemen zaude · stage" truncates to "Hemen zau…" in the 2-column sheet at 1440. Let the meta wrap, or drop the stage name there.
- `components/shell/SidePanel.tsx:165` (`StageNav`) and `.snav-sec` (`app/globals.css:13801`):
  - the section label truncates hard ("1. Sarr…");
  - topic 3 shows "0. 2. astearen…", because the section number 0 comes from `sectionLabel`. Hide the number when it is 0.
- `app/globals.css:13928/13935`: the notch offset is the same at every frame size. On small frames (topic 7 at 1440) the pills sit close to the scene's bottom captions.

## Resume list
1. Kimu: hodi-neurala retrieval (the `kimu.md` resume list, item 1); then voice-mode readiness (`kimu.md` item 4).
2. Tour: add the `placeCard` distance penalty; take final per-stop shots, including 768 (`tour.md` Resume 2); consider a "Gida" item in the Tresnak menu at 768.
3. Kronologia: TopicShelf, then the landing.css cleanup; Chronicle polish; the NowCard switch to `statusAt`; 768 shots (`kronologia.md` Resume 1–4).
4. Scenes: clear the notch bands listed above.
5. The cosmetic nits above.

## Closing batch 2026-10-12

Landed: 768 site-bar underline on the bar; compact "Ireki simulagailua" pill at 768; /egiturak "Denak" pill sized to text; day-ruler labels clear of the playhead; orientation pills outside the frame; tour cards near their target and clear of the view switch; hero reel hides scene keys; topic 9 thumbnail.

Left for next time:
- Home at 768: the fixed "Galdetu" button covers the end of the reel's "Ireki simulagailuan" link at the first scroll position.
- Home teaser (topic 1 fertilisation scene): caption collides with the FASEA 0/3 readout (scene file, week1).
- /irudiak filters: "0/0 zuzen" wraps alone at 1440; group hairline misaligned when filters wrap at 1024 (ImageLab.tsx).
- Home map cards: date kickers lowercase mono vs uppercase on topic cards.
- Kimu panel and tour not re-reviewed in the last batch.
- Decision for the user: home says "11 gai" while topics 10–11 are "Prestatzen".
