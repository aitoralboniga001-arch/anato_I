# Kimu handover

## Files
- `lib/kimu/`: engine.ts, notes.ts (new), practice.ts (new), offline.ts, search.ts, text.ts, prompt.ts, groq.ts, guard.ts, types.ts
- `components/kimu/`: Kimu.tsx, KimuFace.tsx, store.ts, kimu.css
- `app/api/kimu/route.ts`
- Tests: `tests/kimu.test.ts` (85 tests)

## Architecture
- **engine.ts `askKimu`** handles one question, in this order:
  1. a practice request;
  2. "explain this step", answered from the step's own notes sentences;
  3. search over places (`search.ts`) and notes passages (`notes.ts`, BM25-like with topic, stage and step boosts);
  4. the offline reply;
  5. `/api/kimu` with a 6 s timeout, but only when the notes give a strong hit.

  The model reply is kept only if it cites `n#`/`c#` ids it was given and states no number the evidence lacks; otherwise the offline reply is used.
- **offline.ts** builds the answer from the notes verbatim (a list, or the best one or two sentences), or from an atlas card for "zer / nondik / patua" questions with a short notes quote. Weak matches get "nearest section". Nothing found gets the generic reply plus sample questions.
- **prompt.ts / groq.ts**: notes-only system prompt with a JSON schema `{reply, cite, go, followups}`. The key is read server-side from env only.
- **practice.ts**: pulls questions from the reviewed `POOL` only, filtered through the generate.ts LEFT_OUT ids. Due questions come first, then unseen ones. Answers are written with `recordAnswer`.

## Landed
- **A–G**: grounding and citations, context, Basque copy, offline answers, latency (warm-up plus timeout), memorisation through practice, and calm visuals.
  - The launcher is a "Galdetu · K" pill with `data-tour="kimu"`.
  - Removed: nudge, toast, typewriter, emoji and auto-open.
  - In the simulator, the panel is narrow and hangs under the top bar.
- **P2**: practice in Kimu.
- **P4**: lineage line.

## P1: not applied (`components/shell/Simulator.tsx`, UI owner)
```diff
@@ kimuGo, just before `setBack(origin);`
-    setBack(origin);
+    if (t.notes) setPref('notes', true);
+    setBack(origin);
@@ cross-topic branch, after the `ikuspegia` line
+      if (t.notes) q.set('apunteak', '1');
@@ setKimuHere effect
-    setKimuHere({ week: week.week, stage: stage.id, beat: activeBeat, structure: selected ?? formation?.structure });
+    setKimuHere({ week: week.week, stage: stage.id, beat: activeBeat, structure: selected ?? formation?.structure, view: view.id });
-  }, [week.week, stage.id, activeBeat, selected, formation]);
+  }, [week.week, stage.id, activeBeat, selected, formation, view.id]);
```
Ideally the NotesPanel would also scroll to `t.sentence`. The toolbar button already has `data-tour="kimu"`.

## Open defects and resume list (by priority)
1. "Nola eratzen da hodi neurala?" answers with the somites sentence. The formation word is dropped as a question word. Keep "eratzen" for *nola* questions, map it to "eraketa", and re-check the other *nola* questions. A first attempt made the diaphragm answer worse and was reverted.
2. Do the browser check at 768, 1024 and 1440: home pill, sim panel, practice UI. Not done after the UI rewrite.
3. Apply P1 above.
4. `scripts/narration/export-catalog.test.ts` fails 2 tests ("all six topics"). The likely cause is the new topics 10 and 11 in the registry, not Kimu. Voice-mode readiness has not started: coverage, degrade, status dry-run and the generate command.
5. `components/shell/prefs.ts(31)` had a TS7023 error from another agent's work in progress. Typecheck is clean now.

## Hard rules
- No past-exam material, mention or refusal text anywhere in Kimu: index, prompts, UI, tests or comments. The test checks LEFT_OUT by id or hash only.
- API keys stay server-side in env. Never log them, never put them in client code, never change how they are stored.
- The notes are the source of truth, and prose wins over tables.
