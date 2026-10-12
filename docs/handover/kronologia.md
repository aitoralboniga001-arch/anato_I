# Kronologia, the home chronicle and the Gaiak shelf: handover

State as of 2026-10-12. Tests (`tests/chronology.test.ts`, `tests/study.test.tsx`: 33/33), `tsc --noEmit` (no errors in these files) and `eslint` on these files are clean. Nothing is committed.

## Files

| File | State |
|---|---|
| `content/chronology.ts` | Rewritten. The single source of dates. Topic 10/11 agents append under `// 10. gaia` / `// 11. gaia`: re-read before editing. |
| `app/kronologia/page.tsx` | Server page: resolves notes citations (`sources()`), reads `?eguna=&sistema=` (`readLink`), renders `<Timeline>`. |
| `components/shell/Timeline.tsx` | Rewritten. `/kronologia`, plus shared pieces exported for the home page (`AgeScene`, `DayChart`, `dayParts`, `stepDay`). |
| `components/shell/Chronicle.tsx` | Rewritten: home chronicle as one screen (no scroll-jack). |
| `components/shell/timeline.css` | New, all `tl-*` and `chr-*` styles. Uses globals tokens only. |
| `components/shell/NowCard.tsx` | Unchanged (still uses `presenceAt`, `PRESENCE_GROUPS`). |
| `components/shell/TopicShelf.tsx`, `components/shell/shelf.css` | **Not started** (see resume list). The shelf is still inside `Home.tsx` (`<section id="gaiak">`). |
| `tests/chronology.test.ts` | New: registry/notes integrity, deep links, presence map, date wording, ruler scale. |
| `content/generate.ts` | One line (lead-approved): ordena question ids are hashed from their content. |

## Schema (`content/chronology.ts`)

- `PERIODS` `{id, name, short?, from, to, note}`: 0–14, 15–56, 57–266, 267–996 (after birth). `short` is shown when the band is too narrow.
- `BIRTH = 266`, `END_DAY = 996` (two years after birth), `afterBirth(months)` for postnatal dates. Postnatal milestones sit on a stage whose `dayRange` ends at `BIRTH`.
- `SYSTEMS` / `SystemId`: hasiera (Enbrioia), eranskinak, nerbioa, barrunbeak, hezurdura, muskuluak, zirkulazioa, kanpo-itxura. The chart's lanes are the systems that have milestones.
- `Milestone` `{day, to?, text, short, week, stage, view?, weight: 'gakoa'|'oinarria'|'xehetasuna', makes?, system, notes: string[], approx?, label?}`.
  - `notes` are ids from `content/notes-text`.
  - `approx` is set when the notes give only a week or month.
  - `label` overrides the date wording.
  - `short` is unique: it serves as the recall card.
- `LIFE[id]` `{from, to?, becomes?, note?}`. A structure "turns into" its `becomes` on its `to` day.
  - `statusAt(id, day)` returns 'oraindik-ez', 'badago' or 'desagertua'.
  - `changesBetween(from, to)` and `presentAt(day)` share that same boundary.
- Derived, never typed:
  - `systemOfStructure(id)`: extra-embryonic or maternal tissue goes to eranskinak; otherwise the system of the milestone that `makes` it; otherwise a space goes to barrunbeak; otherwise the majority system of its topic.
  - `structureHref(id)`: simulator at its first-seen step, `&egitura=`.
  - `momentOf(m)` and `momentAt(day, system?)` (stage, view, une), with `simHref`.
  - `whenOf(m)`, `dayLabel`, `weekOfDay` (22–28 = 4. astea), and `dayToX`/`xToDay` (a piecewise scale, so the first 8 weeks get 76 % of the ruler).
- Topic 11's foramen ovale should be `{day: BIRTH, to: afterBirth(12), approx: true, label: 'Jaiotza → 1. urtea'}`. Check whether it was added with `to`.

## /kronologia now

The page runs top to bottom:

1. **Scrubber card**: the day readout (`N. eguna`, then weeks, then months after birth) and the lanes chart.
   - The chart has one lane per system. A lane name is a filter, and its topic numbers are derived.
   - Names of key and basic events are written on the lanes with collision avoidance (`placeNames`), and the day's events are highlighted.
   - Axis ticks are placed by priority with no overlap (`placeTicks`).
   - The period band name falls back to `short`.
   - The playhead knob sits on the axis.
   - Magnetic snapping. Keys: ←/→ (Shift ±7), [ ] / PgUp/PgDn between milestones, Home/End.
2. **Presence map** (`PresenceMap`): named chips, grouped by system, each linking to the simulator at that structure.
   - **Bihurtu / desagertu**: since the previous milestone, with successors ("→ …"); a "Guztiak · N" toggle shows all of them.
   - **Berria**: since the previous milestone.
   - **Hurrengoak**: the next 10, with dates.
   - **Lehendik dago**: full width, one row per system.
   - Chips that changed column since the last day glow once (static under reduced motion).
3. **Specimen + event**: the live simulator scene at that exact stage, view and une, with "Ireki simulagailuan".
   - The event card shows the date, system, text and notes citation (`Apunteetan · N. gaia, section`), plus same-day events and "Hurrengoa".
4. **Ikasi ordena**: Zerrenda / Datak estalita (each date is a "Noiz?" button) / Ordenatu (six cards, check, "Beste sei").

Screenshots are in the scratchpad of session 8e6b5035:
- before: `before/kr-1440.png`, `kr-1024.png`, `kr-768.png`;
- after: `after/kr2-1440-top.png` (day 84), `kr2-1024-top.png` (day 35), `kr2-1024-stage.png`, `kr2-1440-d84.png` (full page), `chr-1440.png`.

## Dead selectors for the UI agent (safe to delete once TopicShelf lands)

- `app/globals.css`:
  - `.kr`, `.kr-band`, `.kr-bands`, `.kr-chips`, `.kr-day`, `.kr-empty`, `.kr-fill`, `.kr-grid`, `.kr-group`, `.kr-head`, `.kr-key`, `.kr-last`, `.kr-last-go`, `.kr-list`, `.kr-mark`, `.kr-marks`, `.kr-meta`, `.kr-mile`, `.kr-mile-day`, `.kr-miles`, `.kr-now`, `.kr-ruler`, `.kr-steps`, `.kr-ticks`, `.kr-track` (old Timeline);
  - `.chron`, `.chron-body`, `.chron-days`, `.chron-frame`, `.chron-index`, `.chron-sticky`, `.chron-svg` (old Chronicle).
  - A grep shows no other users.
- `components/shell/landing.css` `.lp-shelf*`, `.lp-cards`, `.lp-card*`: still in use by `Home.tsx` today. They become dead only after the shelf moves to `TopicShelf.tsx` + `shelf.css`.
- Siblings:
  - `LandFoot` (LandNav.tsx) hard-codes "(1.–9. gaiak)", which should be derived from `weeks.length`;
  - `TopicShot.tsx` `SHOTS` has no entries for topics 10 and 11.

## Resume list

1. **TopicShelf** (not started). Move `<section id="gaiak">` from `Home.tsx` into `components/shell/TopicShelf.tsx` + `shelf.css` (copy the `lp-card` rules under a new prefix), then mount it with one line.
   - Keep `--cols: shelfCols(weeks.length)` and `countWord`, so every count comes from the registry.
   - Mark the last place ("Hemen utzi zenuen · <stage>", using `useLastPlace`) and resume it by deep link.
   - Show stage progress as a bar with a count, and "Osatuta" when complete.
   - Drop the four "Berria" badges (`NEWEST`), and move the keyboard row out of the shelf.
   - Topics 7 and 9 first or best-looking.
   - Test: render it and check there is one card per week and the derived count text.
2. **Home Chronicle**: written and renders, but not polished.
   - The big day readout repeats the "0. eguna" date line (drop one).
   - The section is slightly taller than a 1440×950 viewport.
   - It autoplays through the 32 key dates only when on screen and not under reduced motion; check playback in a real browser.
3. **NowCard** sibling: switch it to `statusAt`/`changesBetween` (same boundary as /kronologia) and link `/kronologia?eguna=`.
4. Shots at 768 for /kronologia and the Chronicle.
