# Handoff: 3D name-dot audit for topics 7–12, finish and commit

You are taking over work in progress in `C:\Users\aitor\Downloads\1 MEDICINA` (Next 16 app, vitest). Read `AGENTS.md` first.

## Goal
Every 3D step's name dot must sit on its own structure as the camera sees it, not on something in front of it, and must be inside the frame. This covers topics 7–12.

## Rules
- Reply to the user in Spanish.
- No subagents unless the user asks.
- Never mention past exams.
- Keep all labels.
- No drawn pointers.
- Camera changes glide; no hard cuts.
- Test at 768–1440 px.
- Never run prettier.
- Don't kill PID 36512 (another session's dev server on port 3000).

## Already done (uncommitted, mine)

**`tests/anchors3d.test.ts`** was rewritten as a general audit.
- It server-renders every step's settled frame (`t = next beat − 0.035`) for topics 7 and up.
- It uses `vi.mock` for `Stage3D`, which projects with the step camera and records which 3D point each screen point came from.
- It uses `vi.mock` for `Callouts`, which records the items.
- Each shown name (`show ≥ 0.5`) must pass `coverOf(..., 0.3)` and fall inside 0..1000 × 0..640.
- It audits 963 names. Topics 7–9 have few 3D names, and those pass.
- An `afterAll` prints `AUDITED [...]` counts. Remove that before committing, or keep it quiet.

**`lib/three-d/occlusion.ts`** (`visibleAnchor` / `search`) got two changes.
- The anchor is kept only if it is uncovered **and** inside the frame.
- A second "tight" pass accepts a visible point without the ~12 px room. This is for thin things lying on others, like the patent foramen-ovale slit.

**`components/scenes/week11/Septa3D.tsx`** has new cameras.
- `CAM.section` yaw went from −16 to −7.
- Step P2[5] is now `orbit(-9, 20, 5.2, …)`; it was `orbit(-34, 16, …)`.
- Reason: from further right, septum secundum hides the ostium secundum. A camera sweep showed yaw −10…−4 sees all the names.

**`components/scenes/week10/Heart3D.tsx`**: ModelView now passes `at: q` instead of `{x, y}`, so the audit can map dots back to 3D.
- Only that one line is mine.
- The caption hunk in the same file ("Hasierako ikuspegia: …", `askedView` comment) belongs to another session.

## Remaining
1. Run `npx vitest run tests/anchors3d.test.ts`.
   - The last run had 1 failure: `11/enbor-arteriosoa` step 0, `hasierako-eskuineko-bentrikulua` out of frame at (324, 643).
   - The inFrame-anchor change above was meant to fix it but has not been re-run.
   - If any step still fails, sweep cameras numerically. Unwrap the scene to its ModelView props and test `visibleAnchor` + `coverOf` over a yaw/elev grid. Change the camera rather than hand-tuning anchor fractions.
2. Check the dots that the solver now moves, because the tight pass and the frame rule are new.
   - Build: `npx next build`, then `exec node node_modules/next/dist/bin/next start -p 3121` (background).
   - Shoot headless with the scratchpad CDP script pattern. URL: `/astea/<topic>?etapa=<stage>&ikuspegia=3d&une=<t>`.
   - Steps to check:
     - topic 10 `bihotz-lakioa` t 0.89 (AV canal)
     - topic 11 `zulo-obala` t 0.64 and 0.78 (ostium secundum, new cameras)
     - topic 11 `jaiotza` t 0.10, 0.81, 0.96 (foramen ovale)
     - topic 11 `aurikulen-paretak` t 0.46 (sinus node)
     - topic 11 `arteria-konoa` t 0.96 (lower cushion)
     - topic 11 `enbor-arteriosoa` t 0.07
     - topic 11 `jatorriak` t 0.56 (left infundibulum)
   - Also spot-check a few topic 12 steps for regressions: `arku-sistema` 0.14 and 0.97, `nerbio-atzerakariak` 0.24, `aorta-heldua` 0.85.
   - Shoot at 1440 and 1024.
   - Each dot must visibly sit on its named structure.
   - Labels with dotted leaders and italic cyan text are the "space" convention (holes and cavities). They are fine if the dot is in the opening as seen.
3. If a jaiotza step from the left atrium still puts "Zulo obala" on the valve, choose the anatomically right fix, guided by the step text in `content/weeks/week11.ts`.
   - The foramen ovale is on the right-atrium face of septum secundum and is visible from yaw −30…−60.
   - Options: a camera that shows it, or name it only on the steps whose text is about it.
4. Run the full suite: `npx vitest run`. Fix anything broken, such as tests that pin cameras or captions.
5. Commit **only** these:
   - `tests/anchors3d.test.ts`
   - `lib/three-d/occlusion.ts`
   - `components/scenes/week11/Septa3D.tsx`
   - the one `at: q` hunk of `Heart3D.tsx`: stage it with a crafted patch (`git diff` → keep that hunk → `git apply --cached`)
   - any scene files you change for step 1/3
6. Do **not** commit anything else. Other sessions own:
   - Stage3D, Viewport, Player, Simulator, StudyMap, Home, progress
   - the klasea engine, dock and useKlasea, globals.css
   - notes manifest and extract.py, package.json, pnpm-lock
   - `scripts/klasea/.tmp-*`, `scripts/notes/__pycache__`
   - any week13 files (the topic 13 session; the audit will cover week 13 automatically once it is registered)
7. End the commit message with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
8. Update memory `anchor-occlusion-audit.md` with these points: the audit now covers 7–12 via the Stage3D/Callouts mocks; there is a tight fallback pass; off-frame anchors move too.
9. Report to the user in Spanish what landed, with before/after screenshots.
