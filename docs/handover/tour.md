# Tour handover ("Gida laburra")

## Files
- `components/shell/tour/store.ts`: `startTour(id)`, `endTour()`, `showOffer(id)` / `hideOffer()`, `useTourState()`, `isTourBusy()` / `useTourBusy()`. The offer is remembered per place in `localStorage` under `enbrioatlas:gida:sim|home`. Without storage it never offers.
- `steps.ts`: `SIM_STOPS` (12) and `HOME_STOPS` (6). A stop has `targets` (variants tried in order; each one can reword its `title`/`text`), an optional `open` (the data-tour id of a toggle the stop presses, then presses back), and `keys`.
- `geometry.ts`: `findTargets` (`[data-tour=…]`, optional `children`/`max`/`min`/`row`), `placeCard` (beside the target, never on it, avoids `[data-tour=eszena]`).
- `nav.ts`: the next/prev/close/missing reducer.
- `Tour.tsx`: the overlay. It runs a rAF loop that re-measures the live DOM every frame and draws an SVG-mask dim, with a glow that hugs each lit element's own radius. Keys are taken in the capture phase (→/Enter, ←, Esc, Tab trapped). It has an aria-live line and respects reduced motion.
- `TourHost.tsx`: `<TourHost tour="sim|home" ready?>` draws the offer and the tour. `offerSpot()` places the offer under the "?" or just above the bottom bar, never on the scene. `GuideButton` is the home bar's "?".
- `tour.css`: tokens only. Tests: `tests/tour.test.tsx` (21).
- `Help.tsx`: the welcome modal is gone. The sheet now opens with "Hasi gida" (autofocused, so "?" then Enter). Hook: `useHelp()`.

## Missing targets
At start, the tour keeps only the stops that can be shown (a toggle stop counts if its toggle exists). Mid-run, a stop whose target doesn't appear within 900 ms is skipped in the direction of travel. If nothing can be shown, the tour closes.

## data-tour attributes
Simulator (* = moved or added by the simulator redesign, so check it after any layout change):
- `gaiak`* / `gaia-hautatu`*: WeekNav.tsx (topic switcher)
- `etapak`*: SidePanel.tsx (stage navigator; at 1024 it is not on screen, so the stop is skipped)
- `eszena`, `etiketak` (text layer; its children are lit), `norabideak`* (orientation chips; children): Viewport.tsx
- `ebakiak`: ViewSwitch.tsx. `non-nago`: Locator.tsx
- `erreprodukzioa`, `erreprodukzioa-mugikorra`, `play`*: Player.tsx
- `kimu`, `aurkitu`, `galderak`, `apunteak`, `eskuineko-zutabea`, `eguna`, `tresnak`, `laguntza`: Simulator.tsx (all of these sit in the top bar or panels the redesign reshuffles)

Home: `hasi`, `gaiak` (lp-cards; first row lit) in Home.tsx. `kronologia` and `simulagailua` in LandNav.tsx (`help` slot = GuideButton, `laguntza`). `kimu` in kimu/Kimu.tsx (`kimu-launch`).

Mounts: Simulator.tsx has `<TourHost tour="sim" />` and `tourBusy` in the Locator `hold`. Home.tsx has `<TourHost tour="home" ready={ready} />` and `LandNav help={<GuideButton/>}`.

## Open notes
- The offer must never sit on the specimen. `offerSpot` handles this (tested at 1440/1024/768 geometry). It waits for other first-time cards (`.loc-card`, `.kimu-nudge`, …) and steps aside if one opens or playback starts.
- No Kimu nudge over the view switcher. That's on the Kimu side; it can hold its nudge on `isTourBusy()`.
- At 1024, the simulator cards for top-bar stops land below the scene, far from their target, because they keep off the specimen. Consider a distance penalty in `placeCard`.

## Resume
1. Re-check every stop at 1024 and 1440 after the redesign settles (the `etapak` position at 1024, card distance).
2. Final screenshots per stop, and 768 for a few.
3. Optional: a "Gida" item in the Tresnak menu for 768 (today the path is Tresnak › Laguntza › Hasi gida).
