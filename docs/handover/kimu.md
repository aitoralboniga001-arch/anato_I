# Kimu handover

## Files
- `lib/kimu/`: engine.ts, notes.ts (new), practice.ts (new), offline.ts, search.ts, text.ts, prompt.ts, groq.ts, guard.ts, types.ts
- `components/kimu/`: Kimu.tsx, KimuFace.tsx, store.ts, kimu.css
- `app/api/kimu/route.ts`
- Tests: `tests/kimu.test.ts` (94 tests)

## Architecture
- **engine.ts `askKimu`** handles one question, in this order:
  1. a practice request;
  2. "explain this step", answered from the step's own notes sentences;
  3. search over places (`search.ts`) and notes passages (`notes.ts`, BM25-like with topic, stage and step boosts);
  4. the offline reply;
  5. `/api/kimu` with a 6 s timeout, but only when the notes give a strong hit.

  The model reply is kept only if it cites `n#`/`c#` ids it was given and states no number the evidence lacks; otherwise the offline reply is used.
- **Position ("eraman nazazu X-ra", "llévame a X", "where is X")**: when the browser sends `KimuHere` and the question asks to go to or see a named structure (`wantsPlace`, `GO` in search.ts; "erakutsi" alone does not make it a formation question), `nearestFrom` (search.ts) picks the nearest place at or after the student in the same topic: a later step of this stage that lights or tours it (`focus`/`tour`), else the first later stage that does, or that lists it in `structures` (stage start). It becomes `c1`; the usual place (`bestSpot` / reviewed formation) stays `c2` when it is in another stage. Nothing later in the topic: the usual place only.
  - Every target gets `from` (`fromHere`: now, ahead, back, next, later, earlier, other) whenever `here` is known. The go card shows it ("Hurrengo etapa · Azalpena · …").
  - The reply says where the first place is (`fromSentence`, offline.ts: "Hurrengo etapan ikusten da: …", "Se ve en la siguiente etapa: …", "It is shown in the next stage: …"), in `located` (engine.ts). The model gets "FROM HERE: …" in each PLACE's facts and a prompt rule to say it; its sentence is added only when its reply lacks one (`SAYS_WHERE`). The offline reply always gets it (its notes quotes may say "lehenago" about something else).
  - "Noiz / nola sortzen da X?" keeps the reviewed formation first; only `from` is added.
- text.ts `ENDINGS` now strip `-etara` and `-era` ("somitetara", "hodi neuralera").
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
- **P5**: "take me to X" from where the student is (above).

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
