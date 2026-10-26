# Topic 13 handover: "13. GAIA: ZAIN-SISTEMA (zirkulazio-sistema IV)"

Source: `C:\Users\aitor\Downloads\13. GAIA_ZAIN SISTEMA (zirkulazio-sistema IV) (Zuzenduta).pdf`
(the corrected version), ingested by `scripts/notes/extract.py` into `content/notes-text/w13.ts`
(24,707 characters, sha `a3f3a479…`, pinned in tests/notes.test.ts; mapped beat refs across the course: 881).

The topic is **complete**: 16 stages, every one in 3D, plus 19 quiz questions, the Kimu class (14 chunks,
~9 min spoken, ~20 min with checks), 16 view guides, chronology milestones and atlas relations.
Nothing is committed.

## Stage plan (notes order)

| # | stage id | notes | scene (components/scenes/week13) |
|---|---|---|---|
| 1 | sarrera | 1 (three pairs of veins at week 5) | Embryo13 `Intro13` (the week-5 lateral embryo, see-through) |
| 2 | zain-nagusiak | 2 (sinus horns, anastomoses, blood to the right) | Liver3D `MainVeins3D` |
| 3 | bitelinoak | 2.1.1 (vitelline plexus, liver, sinusoids, hepatocardiac channels) | Liver3D `Vitelline3D` |
| 4 | porta | 2.1.2–2.1.3 (portal vein, SMV, splenic, hepatocardiac fate) | Liver3D `Portal3D` |
| 5 | zilbor-zainak | 2.2 (umbilical veins, ductus venosus on the liver surface) | Liver3D `Umbilical3D` |
| 6 | kardinalak | 2.3 p3–p7 (cardinals; sub-, sacro- and supracardinals) | Cardinal3D `Cardinal3D` |
| 7 | azigos | 2.3 p8–p11 (azygos, hemiazygos, accessory hemiazygos) | Cardinal3D `Azygos3D` |
| 8 | kaba-zainak | 3 (the two venae cavae, left → right) | Cardinal3D `Cavae3D` |
| 9 | beheko-kaba | 3.1 (IVC segments, left renal, iliacs) | Cardinal3D `Inferior3D` |
| 10 | sinu-koronarioa | 3.1 p9 s12–s14 (left horn → coronary sinus, oblique vein) | Cardinal3D `Coronary3D` |
| 11 | goiko-kaba | 3.2 (brachiocephalics, jugulars, subclavians, SVC) | Cardinal3D `Superior3D` |
| 12 | laburpena | 3.2 p14–p18 (what to know; adult vein ← origin table) | Cardinal3D `Summary3D` |
| 13 | jaio-aurretik | 4.1 (fetal circulation, saturations) | Circ3D `Fetal3D` |
| 14 | jaiotza | 4.2 (closures, ligaments, foramen ovale) | Circ3D `Birth3D` |
| 15 | jaio-ondoren | 4.3 (two separate circuits, aortic valve, Valsalva) | Circ3D `Postnatal3D` |
| 16 | linfa | 5 (lymph sacs, cisterna chyli, thoracic duct) | Lymph3D `Lymph3D` |

## Files

Created:
- components/scenes/week13/veins3d.ts: the one venous model (every vein a route through shared points,
  posed per stage), `bloodCells` (GPU red/blue cells; `sat` = share of red) and `tintCells` (one-colour
  lymph drops). circulation3d.ts: the fetal / birth / adult circulation model.
- components/scenes/week13/common.tsx: `veinStage(spec)`, the shared step machinery (cam glides, names,
  dims, flows, marks, keys; `cellGap` spaces cells by vessel length, `keyTitle`).
- components/scenes/week13/Embryo13.tsx, Liver3D.tsx, Cardinal3D.tsx, Circ3D.tsx, Lymph3D.tsx.
- content/weeks/week13.ts, content/weeks/week13-structures.ts, content/notes-text/w13.ts.
- content/klasea/w13.ts, content/klasea/importance/w13.ts, docs/klasea/w13-audit.md.

Additive edits:
- scripts/notes/extract.py, content/notes-text/index.ts + manifest.json, lib/sim/types.ts, content/registry.ts,
  content/notes.ts.
- content/heart-guides.ts `guides13` + `VEIN_FRONT`; tests/heart-guides.test.ts.
- content/chronology.ts (5 milestones: days 29–35, 35–49, birth ×2 ligaments, ductus 2–3 months, septal fusion).
- content/klasea/index.ts, tests/klasea.test.ts (TOPICS entry, X_WORDS toraxiko*, plexu*, oxigenatuta,
  baxuagoa), scripts/klasea/audit.ts.
- components/shell/Specimen.tsx (week 13 → c/fetua), components/shell/TopicShot.tsx (13 → kaba-zainak/3d 0.45).
- lib/narration/server-utils.ts `MAX_WEEK = 13`; the reject pin in lib/narration/server.test.ts moved to 14.
- tests/notes.test.ts (length, sha, 881 beats); tests/kimu.test.ts (mediastinoa now also has a week-13 source).

## Colour decisions

- Vein stages 1–12: colour = origin (vitellines turquoise, umbilicals pink, anterior cardinals blue, common
  cardinal light blue, subcardinals orange, sacrocardinals magenta, supracardinals yellow). Each adult vein
  keeps its origin's colour, so the summary reads as the table.
- Circulation stages 13–15: colour = blood. Mixing is drawn as red and blue cells together (share of red =
  saturation, 80 % / 58 %), never a purple wall.
- Lymph: green sacs and ducts, light-green drops; veins behind in faint blue.

## Kimu class

14 chunks (gaur → amaiera), contrast checks from `bitelinoak` on, one table (`taula`, adult vein ← origin,
11 rows, fill check on three). Test exceptions in tests/klasea.test.ts:
- `shown`: kabak#3 and kabak#10 light `beheko-kaba-zaina`; Cardinal3D names the whole vein from the
  beheko-kaba stage's first step while the beats tour its three segments.
- `same`: each fetal shunt and its ligament (left umbilical vein ↔ ligamentum teres, ductus venosus ↔
  ligamentum venosum, ductus arteriosus ↔ ligamentum arteriosum): the birth scene draws the vessel under
  the ligament's name.

## Follow-ups

- The 2D leader audit (`node scripts/anchor-audit.mjs http://localhost:3007 13-13`) reports 160 dots off or on
  a seam in topic 13, mostly thin veins over the see-through heart/liver (sinus horns, hepatocardiac
  channels, sinusoids). It rewrites docs/anchor-audit.md for that week only, so I restored the file; a copy of
  the week-13 table is not checked in. tests/anchors3d.test.ts (the 3D occlusion check) is the authoritative
  gate; see its result before polishing dots.
- Kimu's citation for "mediastinoa" opens at the start of the section, not at the exact sentence (p6/s4).
- Atria and Valsalva sinuses in Circ3D are acceptable but could be finer; the lymph overview is decent, not
  showcase.
