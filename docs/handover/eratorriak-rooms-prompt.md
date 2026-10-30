# Prompt: Eratorriak study rooms for topics 7, 8, 9, 10, 11 and 13 (everything except the 3D)

You are extending the **Eratorriak** page (`/eratorriak`) of the embryology app in `C:\Users\aitor\Downloads\1 MEDICINA`. It is a Next.js app with a Basque UI. The owner is a medical student who studies from the lecture notes and then checks the app side by side.

Topic 12 (arteries) already has a full **study room** on that page. It was built so that a very tangled topic (many pieces, each changing what it becomes over time) can be studied and memorised better than from the notes. The owner now wants the same for every topic from 7 forward. In their words, about topic 12:

> "I want it to be much clearer, with all the content i need to study, different tools to visualize things, tables, schemas, whatever may be better for students… you may also create slides, anki like flashcards or whatever, but I really need to get this topic right… as there are a lots of different structures and eratorriak, it is really easy to get meshed up… It would be nice also to have the option to say I want [structure X] and be able to explore it, see the different names."

**Your job is everything except the 3D.** That covers data, 2D schemas, tables, timelines, explorers, figures, pitfalls, flashcards, wiring, tests and verification. Another Claude session (the one that built topic 12) will add the 3D views after you and then review all your work. So:

- Build every room so that a 3D view can be plugged in later without restructuring (§5).
- Leave a precise 3D brief (§11).
- Make your work easy to check: tests, screenshots, and a handover with file:line references.

**Topic 12's room is your reference implementation. Read it in full before writing anything, and copy its structure, data model, look and quality bar.** Where a topic genuinely needs a different tool, choose the better tool, but keep the same visual language.

Work in the main session; **do not spawn subagents** unless the owner asks you to (`memory/no-agents.md`). **Don't commit or push** until the owner asks.

---

## 0. Read first, in this order

1. **Every memory file** in `C:\Users\aitor\.claude\projects\C--Users-aitor-Downloads-1-MEDICINA\memory\` (start at `MEMORY.md`). They are the owner's standing rules. These matter most here:
   - `eratorriak-study-room`: what topic 12's room is.
   - `notes-prose-wins`: when the notes' prose and their tables disagree, the prose wins.
   - `keep-all-labels`: never cut a name.
   - `no-drawn-pointers`: glow or outline the thing; no rings, no dashed boxes; text always above lines, never crossed by one.
   - `anchor-inside`, `consistent-style`, `design-beauty-and-usability`: one product, simple and high-end; fix the siblings of every issue you find.
   - `target-pc-tablet`: test at 768–1440 px; skip phone-only work.
   - `no-past-exams`: no past-exam questions, material or mention, anywhere.
   - `notes-figure-parity`, `each-topic-step-forward`, `topic7-hardest`, `teacher-showcase`, `keep-some-realism`, `visible-returns`, `verify-animations-headless`, `gemini-argon-reviews`.
2. `AGENTS.md`. This Next.js (16.x) is newer than your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing framework code (routing, `next/navigation`, metadata).
3. **The template, end to end** (all paths relative to the repo):
   | File | What to learn from it |
   |---|---|
   | `components/shell/eratorriak/Topic12.tsx` | The room: sections, the timeline (moment bar, play, keyboard, colour mode, names test mode), structure picks ("Esploratu egitura bat"), the Info panel, the table with a hide/reveal test, composite cards, the gone list, the figures, pitfalls, flashcards, and `showInTimeline` (every "Eskeman ikusi →" jumps to the timeline with the right pieces lit). |
   | `content/eratorriak/arteries.ts` | **The data model** (§4): `ORIGINS`, `FATES`, `STAGES`, `Seg` with `life[6]`, `pair()`, the helpers (`lifeAt`, `aliveAt`, `drawnAt`, `changedAt`, `nameAt`, `originText`, `partsOf`) and the content arrays `CHANGES`, `PICKS`, `TABLE`, `GONE`, `PITFALLS`. Everything on the page reads from this one list, so the diagram, table, cards and (later) 3D can never disagree. |
   | `components/shell/eratorriak/ArchLadder.tsx` | The 2D time diagram: fixed geometry, one path per piece, mirrored sides, ghosts for gone pieces, a thin stroke while a piece is going, a glow on what changed this moment, a white halo on focus, short two-line labels placed by hand so nothing collides, and a `mini` mode for card backs. |
   | `components/shell/eratorriak/figures12.tsx` | Small, focused SVG figures (nerves, branches cross-section, umbilical steps). Note how names sit *between* lines, never across them. |
   | `components/shell/eratorriak/Flashcards.tsx` | Leitner boxes 0–4 in `localStorage`, SSR-safe through a `useSyncExternalStore` mounted flag; at most 15 cards per round, weakest first; "Ez nekien" / "Banekien" with keys 1 and 2, space to flip; a mini diagram on the back. |
   | `content/eratorriak/cards12.ts` | Card format and tone: one fact per card, the notes' words, a short question, an exact answer, optional `keys` and `stage` for the back figure. |
   | `components/shell/eratorriak/eratorriak.module.css` | Every style, using the site's tokens (`--text`, `--text-2…4`, `--line`, `--surface`, …). Reuse these classes; don't invent a second look. |
   | `components/shell/MigrationMap.tsx` | How a room is hooked in: the `STUDY` map, `parseHash` (`/^a(\d+)-/` opens that topic's tab), the scroll to `#aN-*`, the legend moved below the room, and the "Eskemak · " prefix before the existing schemas. |
   | `components/shell/Lineage.tsx` | The page hero and its jump links (`#a12-mapa`). |
   | `tests/eratorriak.test.ts` | The invariants every room must keep (§9). |
   | `components/shell/eratorriak/Arch3D.tsx` | **Read only.** It shows how the 3D plugs in, so you know what your slot must provide. Don't edit it, and don't write anything like it. |
4. **The notes** for each topic:
   - The extracted text, with sentence ids like `w7/2.2/p3/s4`, is in `content/notes-text/w7.ts` … `w13.ts`. The table of contents and section → simulator stage map is in `content/notes.ts`.
   - The source PDFs are in `C:\Users\aitor\Downloads\`. The exact file names are in `scripts/notes/extract.py` (lines 27–34).
   - Render the PDF pages to PNG with PyMuPDF (`fitz` is installed; `pdftoppm` is not) to see every figure. **Each notes figure that shows a derivation or a change over time should have a matching picture in the room** (`notes-figure-parity`).
5. **What the page already shows for each topic:** `content/migrations.ts` (the flows drawn as chip trees below each topic; topic 7 starts at line 47, 8 at 134, 9 at 268, 10 at 387, 11 at 488, 13 at 739) and `content/lineage.ts`. Your room goes *above* these and must not contradict them. If you find a flow that is wrong against the notes' prose, fix the flow and list the fix in your handover.
6. **Each topic's simulator content:** `content/weeks/weekN.ts` and `weekN-structures.ts`. Structure ids, names, colours and definitions live there; the registry is in `content/registry.ts` (`structures`, `getWeek`, `appearances`). **Use registry structure ids and colours** so a structure looks the same everywhere (`consistent-style`).

---

## 1. Scope

Build one study room per topic: **7 (Barrunbeak), 8 (Hezurrak), 9 (Muskuluak), 10 (Bihotz hodia), 11 (Bihotz trenkadak), 13 (Zainak)**.

- Topic 14 is not in the registry yet (`content/weeks/` has no week 14). Skip it, but keep your shared pieces generic enough that it can follow.
- Topics 1–6 are out of scope (they use the germ-layer trees tab).

**Yours:** everything a student studies with except 3D. That includes:

- data files;
- 2D SVG schemas and time diagrams;
- tables with test modes;
- structure explorers;
- composite "made of which pieces" cards;
- gone/vestige lists;
- figures;
- pitfalls;
- flashcards (per topic, plus an optional mixed deck);
- a printable or slide-like summary if it helps;
- wiring, tests, screenshots and the handover.

**Not yours (the 3D session does it after you):**

- Anything WebGL or three.js.
- Any file under `components/scenes/**` or `lib/three-d/**`, and `components/shell/eratorriak/Arch3D.tsx`.
- No new 3D component, even a simple one.

If a 2D schema of yours would be "better in 3D", build the 2D version well anyway and say so in the 3D brief.

---

## 2. Order of work: one topic at a time, with a finish line

Follow `visible-returns`: finish a topic completely (data, room, cards, tests, screenshots at three sizes, self-review), write its part of the handover, then start the next. Don't leave six half-rooms.

1. **Step A: shared kit (§3).** Extract the reusable pieces from topic 12 without changing what topic 12 looks like or does.
2. **Topic 13 (Zainak).** It is the closest twin of topic 12: vein segments that appear, regress, anastomose and become adult veins, with composite adult veins (the IVC is built from several segments). It proves the kit.
3. **Topic 7 (Barrunbeak).** Students struggle with it most (`topic7-hardest`), and it is shown to teachers (`teacher-showcase`).
4. **Topic 11**, then **10**, then **9**, then **8**.

After each topic, post a short report to the owner: what landed, screenshots, open questions.

---

## 3. Step A: the shared kit

Create `components/shell/eratorriak/kit/` (or a similar name) and move only what really is generic into it. **Topic 12 must render and behave exactly as it does now.** Take 1440×900 screenshots of every topic 12 section before you start and again after the refactor, then compare them. `tests/eratorriak.test.ts` must stay green.

Candidates:

- **`Flashcards`**:
  - Take a `storeKey` prop. Topic 12 keeps `enbrioatlas:fitxak-12` so the owner's progress survives; new topics use `enbrioatlas:fitxak-<N>`.
  - Take a `tags` list and a `renderFigure?: (card) => ReactNode` instead of the hard-wired `ArchLadder`.
  - Keep the SSR-safe mounted flag, the try/catch around storage, and the keyboard rules.
- **`MomentBar`**: the stage tabs with ←/→, keyboard and play (one moment every ~3.4 s, stopping at the last). Keep the play logic inside the `setTimeout` callback, as `Topic12.tsx` does, because the repo's ESLint forbids `setState` in an effect body (`react-hooks/set-state-in-effect`).
- **`TestTable`**: rows with origin swatches, "Eskeman" links, and a "Proba modua" that hides the answer cells until clicked.
- **`CompositeCards`**: an adult structure, the coloured bar of its pieces, one line per piece ("origin → part"), and a hook sentence.
- **`GoneList`**, **`Pitfalls`** (✗ wrong / ✓ right / "Eskeman ikusi →"), and a section/heading helper with numbered `h3`s and an `id`.
- **`InfoPanel`**: for a clicked piece, origin → derivative, a "now" line, a life row across the moments, and the parts of the adult structure it belongs to.
- **The timeline layout, with a 3D slot.** The grid is diagram + side column. Give it a `view3d?: ReactNode` prop. When it is absent, use the solo layout (`styles.timelineSolo`), and hide the "3D: Ondoan/Ezkutatu" toggle and the 3D name controls. Topic 12 keeps passing its `Arch3D`. This prop is exactly where the 3D session will plug in.

Don't over-generalise. If one topic needs a different tool, write it inside that topic's folder. A shared component with five boolean props is worse than two clear ones.

Layout per topic:

- `content/eratorriak/<topic>.ts`: the data and content arrays. Name the files by subject, like `arteries.ts`: `veins.ts`, `cavities.ts`, `bones.ts`, `muscles.ts`, `heart-tube.ts`, `septa.ts`.
- `content/eratorriak/cards<N>.ts`
- `components/shell/eratorriak/Topic<N>.tsx`, plus that topic's diagram and figures files.
- `tests/eratorriak-<N>.test.ts`, or extend `tests/eratorriak.test.ts` with one `describe` per topic.

---

## 4. The data model: one source of truth per topic

Copy the topic 12 model and adapt the names. The core idea: **every piece the topic talks about is one record that knows where it comes from, what it becomes, and whether it exists at each moment.**

```ts
interface Piece {          // topic 12 calls it Seg
  key: string;             // stable, short, unique: used by the diagram, table, cards, picks, the 3D later
  side: 'R' | 'L' | 'C';   // use pair() for left/right twins
  origin: OriginId;        // colour + name from ORIGINS (germ layer, source tissue, embryonic vessel, swelling…)
  emb: string;             // its embryonic name (notes' words)
  fate: FateId | 'gone';   // the adult structure, or gone
  fateText: string;        // "what it becomes", notes' words; "… · hurbileko atala" marks the part it forms
  fateFrom?: number;       // the moment its adult name applies
  late?: { from: number; text: string };  // a later rename (e.g. ductus → ligament after birth)
  life: Life[];            // per moment: 0 absent, 1 present, 2 going (regressing/thinning), 3 gone (ghost)
  sec: string;             // notes section(s), e.g. '2.3 · 2.4'
  id3?: string;            // registry structure id (validated by tests)
}
```

- **`STAGES`**: the topic's moments, usually 4–7, with an `id`, a short title, a sub-line (age or size if the notes give one), and **`sim`, a real stage id of that topic in the simulator** (tests check it). Choose moments where the notes say something *changes*. Don't just copy one moment per section.
- **`CHANGES[stage]`**: the lines the notes say at that moment, in the notes' words. Each line carries the `keys` it talks about, so hovering a line lights those pieces.
- **`PICKS`**: the "Esploratu egitura bat" list, grouped by embryonic and adult structures. Each pick has `keys` and a `stage` to jump to if its pieces aren't alive at the current moment. This is the owner's explicit request: "I want X, show me X and its names."
- **`TABLE`**: origin → right / left / both, plus a note. For non-paired topics, use whatever columns fit (origin → adult structure → mechanism/ossification type → notes section).
- **`GONE`**: what disappears, when, and *why it matters* (a vestige, a nerve hook, a ligament, a clinical remnant **if the notes mention it**).
- **`PITFALLS`**: the mix-ups a student really makes, each with ✗ wrong, ✓ right and `keys`.

Not every topic is a "pieces over time" topic. For topic 8 (bones) or 9 (muscles), the core may be a **source → structure → mechanism** matrix rather than a timeline of lives. Keep the same idea anyway: one record list drives the table, the explorer, the cards and the figures. Only use `life[]` where things really appear and disappear (resegmentation of sclerotomes, the coelom being partitioned, the heart tube segments, the veins).

---

## 5. Building each room

Use the same section skeleton as topic 12, adapted to the topic, with ids `a<N>-…` (for example `a13-mapa`). `parseHash` already maps `#a13-…` to the topic 13 tab.

1. **Mapa** (`a<N>-mapa`): the topic in 3–4 blocks, plus a suggested study order. One screen that says "this is what you must know".
2. **Timeline / main schema** (`a<N>-denbora`, or a better name):
   - The 2D diagram, moment bar, colour modes ("Jatorria" / "Eratorria"), a names test mode ("Izenak: Bai / Proba"), structure picks, the CHANGES list (hover to light keys) or the Info panel, and a "Simulagailuan (stage) →" link.
   - **Leave room for the 3D:** pass nothing to `view3d`, so the solo layout applies.
   - Design the diagram so the same `keys` and `life` can later drive a 3D model. One path per piece; no piece drawn as two unrelated shapes.
3. **Table** with a test mode.
4. **Adult structures**: what each one is made of (composite cards). The confusing ones are those with more than one piece.
5. **Gone list.**
6. **Topic-specific figures**: one focused SVG per idea the notes draw or explain (§6).
7. **Nahasketak** (pitfalls).
8. **Fitxak** (flashcards).

Then hook it in:

- Add the topic to `STUDY` in `MigrationMap.tsx`.
- Add a jump link in the `Lineage.tsx` hero. When several topics have rooms, a compact row of topic links is better than one long sentence per topic.
- Keep the "Eskemak · " prefix and the legend below the room, as topic 12 has them.

**Interaction rules (all copied from topic 12):**

- Lit pieces keep full colour; everything else fades.
- Hover a line → light its keys. Click a piece → Info panel.
- "Eskeman ikusi →" from any section scrolls to the timeline at the right moment with the right pieces lit (`showInTimeline`).
- Keyboard: ←/→ moves through the moments when the timeline has focus.
- Esc closes overlays.
- Storage is per browser, always inside try/catch, and the page must render correctly without it.

---

## 6. Per-topic guidance (starting points; the notes decide)

The notes sections are in `content/notes.ts` lines 82–172. Read the prose of each topic fully; these are only my guesses at where students get lost.

**Topic 13: Zainak** (`content/notes-text/w13.ts`; flows at `content/migrations.ts` line 739; simulator stages `sarrera, zain-nagusiak, bitelinoak, porta, zilbor-zainak, kardinalak, azigos, kaba-zainak, beheko-kaba, sinu-koronarioa, goiko-kaba, laburpena, jaio-aurretik, jaiotza, jaio-ondoren, linfa`).
- This is a direct twin of topic 12. The pieces:
  - vitelline (left/right, distal/proximal, periduodenal plexus, hepatocardiac channels);
  - umbilical (right regresses; left → ductus venosus → after birth ligamentum venosum / ligamentum teres);
  - cardinals (anterior, posterior, common), subcardinals, supracardinals, sacrocardinals, and the anastomoses (left brachiocephalic, renal, iliac);
  - the sinus horns (left horn → coronary sinus).
- Composite adult veins: the **IVC segments** (hepatic, prehepatic/subcardinal, renal, postrenal/supracardinal, sacrocardinal), the **SVC**, the **azygos/hemiazygos**, the **portal, superior mesenteric and splenic veins**.
- Circulation before, at and after birth: a three-column table of shunt → what closes it → adult remnant (foramen ovale, ductus venosus, ductus arteriosus, umbilical vessels).
- Lymph: sacs → thoracic duct, as a small figure plus a table.
- Highest-value tools: the time diagram with the right-ward shift of blood, the IVC "built from N segments" bar, and the birth-changes table.

**Topic 7: Barrunbeak** (`w7.ts`; flows line 47; stages `zeloma, septum-transversum, peritoneo-barrunbea, pleura-perikardioa, diafragma-eraketa, diafragma-heldua`).
- The coelom goes from one cavity to four: pericardial, two pleural, peritoneal.
- What separates what: the septum transversum, the pleuropericardial folds/membranes, the pleuroperitoneal membranes, and the pericardioperitoneal canals closing.
- The diaphragm has **four sources**. That needs a source → adult part table plus a dome figure coloured by source, and the descent and phrenic innervation (why C3–C5).
- Serous layers: parietal vs visceral.
- Intraperitoneal → (secondarily) retroperitoneal: a table of organs by the relation the notes give.
- Pitfalls: membrane names, which canal closes, which side closes later (only if the notes say so).
- A cross-section diagram per moment (the 2D partner of the later 3D) is the core.

**Topic 11: Bihotz trenkadak** (`w11.ts`; flows line 488; stages per `content/notes.ts` 134–144).
- Septum primum → ostium primum → ostium secundum; septum secundum → foramen ovale; fusion at birth.
- AV canal and endocardial cushions → two AV orifices and valves; interventricular septum in two parts; conus/truncus septation (spiral), semilunar valves.
- Right and left atrium and each ventricle have **two origins**: composite cards are perfect here.
- An "openings" table: hole → made by → closed by → remnant. Plus a step diagram of the atrial septation (6–8 moments).

**Topic 10: Bihotz hodia** (`w10.ts`; flows line 387).
- Cardiogenic region → heart tube; the descent; the three layers; dorsal mesocardium; looping.
- **Heart tube segments → adult parts** is the core table: bulbus, ventricle, atrium, sinus venosus horns → adult structures, with "smooth vs trabeculated" answers.
- Venous valves and what fuses with the septum secundum.
- A looping time diagram with segments coloured by origin.

**Topic 9: Muskuluak** (`w9.ts`; flows line 268).
- Three muscle types → origins.
- **Pharyngeal arch → muscles → nerve** (somitomeres) and occipital somites → tongue and larynx: matrix tables with a test mode.
- Connective-tissue patterns (two sources).
- Somite → myotome → primaxial/abaxial domains → epaxial/hypaxial by innervation. A cross-section figure, coloured per domain, plus the "domain vs innervation classification" trap.
- Smooth and cardiac muscle origins.

**Topic 8: Hezurrak** (`w8.ts`; flows line 134).
- Three mesenchyme sources → bones; two ossification routes (membranous vs endochondral): a bone → origin → ossification matrix with a test mode is the core.
- Neurocranium (membranous calvaria vs chondrocranium) vs viscerocranium (pharyngeal arch cartilages → derivatives table); the occipital base's two sources.
- **Sclerotome resegmentation** → vertebrae, discs, ribs. A step diagram students always need (cranial/caudal halves, intersegmental arteries, nerves).
- Lateral plate (parietal) → limbs, pelvis, sternum.

For every topic: if the notes have a "Gogoratu beharrekoa" or summary section, make sure every line of it is covered somewhere in the room *and* in the cards.

---

## 7. Content rules

- **The notes' words, in Basque.** Use the notes' vocabulary and spelling.
  - When the notes give a Spanish or Latin synonym, show it as a sub-line, e.g. "onfalomesenterikoak".
  - **Prose beats the notes' own tables** when they disagree. Record each such case in the handover.
- **Nothing beyond the notes**, unless it is labelled "ez da jakin beharra", collapsed in a `<details>` like topic 12's limbs (which also cites the notes section). No outside facts presented as notes content.
- **No past exams**: no "azterketan galdetu zen", no exam questions, no exam material. Cards are written from the notes only.
- **Keep all labels**: never drop a name to make room. Shorten the layout, not the content. Two-line labels are fine.
- **Registry ids**: every `id3` must exist in `structures`, and every `sim` must be a real stage of that topic.
- **Cards**:
  - 35–60 per topic, one fact each. The question names exactly one thing; the answer is exact and short.
  - Tags per topic, mirroring the room's sections.
  - Give `keys` (and a `stage`) wherever a diagram on the back helps.
  - Unique ids per topic. Prefix them, e.g. `v13-…`, so a future mixed deck can't clash.

---

## 8. Visual rules (the review will check every one)

Use the same tokens, classes, spacing and type as topic 12. The owner wants "one product, simple, high end".

- **No text crossed by a line.** I had to fix exactly this in topic 12's nerve and branch figures. The 4 px halo is not enough: place names *between* lines or beside the end of a vessel.
- **No drawn pointers**: no arrows pointing at labels, no rings, no dashed boxes. Glow the lit thing (topic 12 uses a glow filter for "changed this moment" and a white halo for focus).
- **Arrows only as biology** (a flow, a migration). Label them above the line.
- **Colours**: registry structure colours for structures. Origin palettes consistent with that topic's simulator scenes (look at `components/scenes/week<N>/common.tsx` or the stage views). A colour key under every diagram.
- **No duplicate-looking items.** I fixed a composite card that showed "Zakua | Zakua" with two near-identical lines; every part must read differently. If two labels are identical on both sides, add the side ("eskuinekoa" / "ezkerrekoa").
- **Flex gotcha.** In a `display:flex` row, a bare text node and an `<em>` become separate columns and wrap badly at tablet width. Wrap the text and the `<em>` in one `<span>` (see the composite parts in `Topic12.tsx`).
- **Front-view convention**: the embryo's right is on the viewer's left. Say so in a caption under each such diagram, as topic 12 does.
- **Tablet**: at 768 px the timeline becomes one column; chip rows wrap; nothing is clipped. The moment bar must not hide its last tab.
- **Empty states**: a card without a figure must not look broken.

---

## 9. Tests

For each topic, mirror `tests/eratorriak.test.ts`:

- Unique piece keys; `life.length === STAGE_COUNT`; a drawable path for every piece at every moment it is drawn.
- Never resurrected after `life === 3`.
- Every `id3` and every fate `structure` exists in the registry; every `STAGES[].sim` is a real stage of that week (`getWeek(N)!.stages`).
- Every key used by `CHANGES`, `PICKS`, `TABLE`, `GONE`, `PITFALLS` and the cards exists.
- Every pick is alive at the moment it jumps to.
- Composite structures match the notes. Pin the important ones, e.g. the IVC's segments, the diaphragm's four sources, each atrium's two origins.
- Every alive piece at the last moment has a label, apart from an explicit, justified list.
- Card ids are unique.

Run all of these before every report:

```bash
npx tsc --noEmit -p .
npx eslint components/shell/eratorriak content/eratorriak components/shell/MigrationMap.tsx components/shell/Lineage.tsx tests/eratorriak*.test.ts
npx vitest run tests/eratorriak tests/migrations.test.ts
```

Run the full `npx vitest run` once at the end of each topic. It takes several minutes, so run it in the background. The rooms are pure DOM/SVG; if any existing test breaks, fix the cause, not the test.

---

## 10. Verification: screenshots at three sizes, before every report

The built-in browser pane doesn't run `requestAnimationFrame`, and its screenshots time out (`verify-animations-headless`). Use headless Chrome over CDP:

1. Start the dev server with `preview_start` (name `dev`, port 3000; `dev-alt` on 3007 if busy).
2. Launch Chrome:
   ```bash
   "C:/Program Files/Google/Chrome/Application/chrome.exe" --headless=new --remote-debugging-port=9333 --user-data-dir=<ABSOLUTE path in your scratchpad> --use-angle=swiftshader --enable-unsafe-swiftshader --window-size=1440,900 about:blank
   ```
   Run it in the background. The profile path must be absolute; a relative one fails silently.
3. Drive it with this Node 22 script (save it as `shots.mjs` in your scratchpad). Generate the jobs JSON with a small `node -e` script; don't hand-escape JS inside JSON.
   ```js
   // Usage: node shots.mjs jobs.json — each job {url?,w,h,wait?,eval?,after?,out?,print?,full?}
   import fs from 'node:fs';
   const jobs = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
   const tgt = await (await fetch('http://127.0.0.1:9333/json/new?about:blank', { method: 'PUT' })).json();
   const ws = new WebSocket(tgt.webSocketDebuggerUrl);
   await new Promise((r) => ws.addEventListener('open', r));
   let id = 0; const pend = new Map(); const logs = [];
   ws.addEventListener('message', (e) => { const m = JSON.parse(e.data); if (m.id && pend.has(m.id)) { pend.get(m.id)(m); pend.delete(m.id); } if (m.method === 'Runtime.exceptionThrown') logs.push('EXC ' + JSON.stringify(m.params.exceptionDetails.exception?.description ?? m.params.exceptionDetails.text).slice(0, 400)); if (m.method === 'Runtime.consoleAPICalled' && (m.params.type === 'error' || m.params.type === 'warning')) logs.push(m.params.type + ' ' + m.params.args.map((a) => a.value ?? a.description).join(' ').slice(0, 400)); });
   const send = (method, params = {}) => new Promise((r) => { const i = ++id; pend.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
   const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
   await send('Page.enable'); await send('Runtime.enable');
   for (const j of jobs) {
     await send('Emulation.setDeviceMetricsOverride', { width: j.w, height: j.h, deviceScaleFactor: 1, mobile: false });
     if (j.url) { await send('Page.navigate', { url: j.url }); await sleep(j.wait ?? 4000); }
     if (j.eval) { const r = await send('Runtime.evaluate', { expression: j.eval, awaitPromise: true, returnByValue: true }); if (j.print) console.log(j.out ?? '', JSON.stringify(r.result?.result?.value ?? r.result)); }
     if (j.after) await sleep(j.after);
     if (j.out && !j.print) { const p = { format: 'png' }; if (j.full) p.captureBeyondViewport = true; const r = await send('Page.captureScreenshot', p); fs.writeFileSync(j.out, Buffer.from(r.result.data, 'base64')); console.log('shot', j.out); }
   }
   console.log(logs.join('\n'));
   ws.close(); process.exit(0);
   ```
4. Pitfalls I hit:
   - The page uses smooth scrolling and a hash handler. Scroll with `window.scrollTo({ top, behavior: 'instant' })` inside every job.
   - Navigating to the same URL with only a different hash does **not** reload, so overlays stay open. Add a dummy query (`?r=2`) to force a fresh page.
   - Click buttons by their text or aria-label. Tab buttons contain a number badge plus a span, so match with `includes`, not `startsWith`.
5. Shoot **every section of every room at 1440×900, 1024×768 and 768×1024**. Then **look at every shot yourself**, zoomed in where labels are dense. Check for:
   - colliding or clipped labels, and lines through text;
   - wrapped columns and clipped tab bars;
   - empty cards;
   - duplicate-looking items;
   - console errors (the driver prints them).

   Also click through: every pick, a piece click (Info panel), each "Eskeman ikusi →", test-mode reveal, and a flashcard flip and grade.
6. Afterwards, kill **only** the `chrome.exe` whose command line contains `remote-debugging-port=9333`. Run `git checkout -- next-env.d.ts` if `next dev` rewrote it.

Report honestly: if something is not verified, say so.

---

## 11. Handover (the 3D session reads this first)

Write two files.

**`docs/handover/eratorriak-rooms.md`**, one section per topic:

- What the room contains, section by section.
- Every file you created or changed, with what changed.
- Every decision where the notes were ambiguous, and every case where prose beat a notes table (quote the sentence id).
- Flows in `migrations.ts` you corrected.
- Open questions for the owner.
- Exactly what you verified (sizes, interactions) and what you didn't.

**`docs/handover/eratorriak-3d-briefs.md`**: a brief per topic for the 3D views I will build. For each topic:

- **Where the slot is**: the component and line where `view3d` should be passed, and the props available there (`stage`, `lit`, names mode, any toggles).
- **Per moment**:
  - What the student should *see turn in 3D* (one or two sentences).
  - Which piece keys are lit by default.
  - Which names should show.
  - Which side or camera direction tells the story best (e.g. "from the left, slightly above").
  - What must visibly *happen* between this moment and the next (regress, fuse, descend, rotate).
- **Candidate existing 3D** to reuse. List the files and the simulator stage where something similar is already modelled. Existing 3D scene files by topic:
  - 7: `components/scenes/week7/DiaphragmDome3D.tsx`
  - 8: `components/scenes/week8/Calvaria3D.tsx`, `LimbRotation3D.tsx`
  - 9: `components/scenes/week9/Domains3D.tsx`
  - 10: `components/scenes/week10/Heart3D.tsx`, `model3d.ts`, `atrium3d.ts`, `Circulation3D.tsx`
  - 11: `components/scenes/week11/*3D.tsx` and `atria3d.ts`, `canal3d.ts`, `outflow3d.ts`, `truncus3d.ts`, `mechanism3d.ts`
  - 13: `components/scenes/week13/veins3d.ts`, `circulation3d.ts`, `Cardinal3D.tsx`, `Liver3D.tsx`, `Circ3D.tsx`, `Lymph3D.tsx`

  Read these files only to name them; don't edit them. If you can tell which model item keys correspond to your piece keys, list the mapping. If not, say so.
- **Where 2D is enough**: say which of your figures should stay 2D-only, and why.

Then end with a final message to the owner:

- What landed per topic, and the screenshot paths (absolute).
- The test results with numbers.
- What is not done or not verified.
- That the 3D session takes over from `docs/handover/eratorriak-3d-briefs.md`.

---

## 12. Don'ts

- Don't touch 3D code (§1).
- Don't change topic 12's behaviour or look (Step A must be visually identical).
- Don't commit, push, stash or revert anything. Other sessions may have uncommitted work in this checkout: check `git status` at the start, and never edit, revert or include files you didn't create or that aren't part of this task. When the owner asks for a commit, stage only your own paths (`git add <paths>`), never `git add -A`.
- Don't add outside content as if it came from the notes, and nothing from past exams.
- Don't stop at "it compiles". The owner judges by what they see: shoot it, look at it, fix the siblings.
