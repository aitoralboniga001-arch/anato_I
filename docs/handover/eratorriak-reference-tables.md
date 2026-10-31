# Eratorriak reference tables

Dataset: `content/eratorriak/reference-tables.ts`. Initial delivery: 26 tables, 177 rows, topics 7–14. The app renders only Basque study relationships; provenance labels from the question compilation are deliberately excluded from app-facing text. `sources` is audit metadata and is not rendered.

## Evidence and scope

Reviewed all 29 pages of `C:\Users\aitor\Downloads\Anatomia_I_2_partziala_Galderak_gaika_EGUNERATUA.pdf`, including all 99 entries (the earlier questions and the ordinary/extraordinary compilations). The document chooses coverage, not scientific truth: incomplete options and distractors are not imported as facts. Local original-note sentence IDs remain the baseline. Primary university teaching references supplement material absent from the local notes; each row records its evidence.

The following mapping includes every entry once. IDs below are developer-only provenance, not UI labels.

| Topic | Question IDs | Table IDs / coverage |
| --- | --- | --- |
| 7 | A01, C01, B05 | `barrunbeen-banaketa` |
| 7 | A06, B07, C08, OH21-11, EO21-10, OH26-12 | `peritoneoarekiko-kokapena` |
| 7 | OH21-04, OH26-02 | `zeloma-eta-tolespena` |
| 7 | B08 | Image identification: cannot reconstruct the marked structure from text; the existing cavity diagrams remain available. |
| 8 | A07, C04, B03, OH21-07, EO21-09, EO26-15 | `kondrokraneoaren-kartilagoak` |
| 8 | EO21-12, OH26-05 | `hezurren-jatorriak` |
| 8 | OH26-01, OH26-04 | `gandor-neurala-eta-adarrak` |
| 8 | OH26-IR03, EO26-IR10 | Image identification: no structure identity invented. |
| 9 | B06 | `muskuluen-jatorriak` |
| 9 | D04, OH21-13, EO21-15, OH26-15, EO26-10 | `arkuak-muskuluak-nerbioak` |
| 9 | OH26-06 | `begiaren-inerbazioa` |
| 9 | OH26-IR12, EO26-IR15 | Image identification: no structure identity invented. |
| 10 | C09, EO21-07, OH26-07, EO26-17 | `bihotz-lakioaren-eratorriak` |
| 10 | OH26-AH03 | `bihotz-lakioaren-eratorriak`, `bihotzaren-kokapena`; supports explanation, not a reconstruction of the unknown numbered embryo. |
| 10 | A09, B09, OH26-IR14, EO26-IR13 | Image identification: no structure identity invented. |
| 11 | C06, D07, EO26-12 | `aurikulen-trenkadak`, also left venous valve in `bihotz-lakioaren-eratorriak` |
| 11 | D01 | `bentrikuluak-eta-irteerak`, `arteria-konexioak`; missing option prevents assigning a unique answer. |
| 11 | OH26-IR11, EO26-IR14 | Image identification: no structure identity invented. |
| 12 | A04, B02, C10, EO26-06 | `arteria-konexioak` |
| 12 | D02, EO21-13, EO26-09 | `faringe-poltsak` |
| 12 | D05 | `arku-aortikoak`; IV and VI statements can both contain true relationships when side/segment is specified. |
| 12 | OH21-14, EO21-14, OH26-16, EO26-16 | `aurpegia-eta-mihia`; OH26-16 also uses `faringe-poltsak`. |
| 12 | OH21-15 | `faringe-arkuak-eta-mintzak` |
| 12 | A08, OH26-IR15, EO26-IR08, EO26-IR11 | Image identification: no structure identity invented. |
| 13 | A02, B04, C05, OH26-09 | `fetuaren-zirkulazioa` |
| 13 | A05, EO21-06, EO26-08 | `jaiotzako-aldaketak` |
| 13 | C02, OH26-08 | `beheko-kabaren-atalak` |
| 13 | EO21-08, EO26-14 | `zain-sistemen-eratorriak` |
| 13 | D09 | `fetuaren-zirkulazioa`, `zain-sistemen-eratorriak`, `jaiotzako-aldaketak`: left umbilical vein remains functional until birth; the vague comparison in the prompt is not assigned a unique answer. |
| 13 | OH26-IR04 | Image identification: no structure identity invented. |
| 14 | A03, B01, C03, D06, OH21-12, OH26-11 | `mesogastrioen-eratorriak` |
| 14 | C07, D03, D08 | `hesteen-eratorriak`, `heste-lakioa` |
| 14 | EO21-11, OH26-10, EO26-03 | `heste-lakioa` |
| 14 | EO26-04 | `poltsa-omentala` |
| 14 | OH26-AH02 | `hesteen-eratorriak`, `mesogastrioen-eratorriak`, `poltsa-omentala`; supports explanation rather than reconstructing an unspecified oral prompt. |
| 14 | A10, B10, OH26-IR05, OH26-IR09, OH26-IR13, EO26-IR02, EO26-IR07 | Image identification: no structure identity invented. |

## Scientific distinctions preserved

- The heart table expands the screenshot's shorthand: proximal bulbus and primitive ventricle yield trabeculated right and left ventricular parts, whereas conus yields smooth outflow parts. Truncus yields the great-vessel roots. Primitive atrium does not account for the whole adult left atrial wall: pulmonary-vein incorporation contributes the smooth part.
- Left recurrent laryngeal nerve: adult course under the aortic arch next to the ligamentum arteriosum; embryonic relation to distal left VI explains the position. Right nerve loops under right subclavian. Avoid teaching an isolated duct/ligament relation as the entire adult course.
- IVC names differ between the local three-part teaching scheme and finer segmentation. Local notes call the right-subcardinal contribution the renal segment. The finer scheme distinguishes a prerenal/subcardinal contribution and a renal/subcardinal–supracardinal anastomosis. Both are labelled explicitly; the simplified course term is not silently universalized. The historical human-development source is a primary account, not a claim that all modern models use identical nomenclature.
- Functional closure after birth is separate from later fibrosis. No assertion that ligamentum arteriosum is fully formed at the first breath. Right atrial pressure falls and left atrial pressure rises with the transition.
- Duodenal first-part shorthand is narrowed to the proximal mobile bulb. Rectal peritoneal coverage is partial and level-dependent. Pancreatic tail and hepatic bare area are explicit exceptions.
- Iris sphincter/dilator are neuroectodermal; glandular myoepithelium is described as contractile epithelial cells rather than ordinary skeletal muscle.
- Recurrent laryngeal nerve does not innervate cricothyroid; its motor supply is the external branch of the superior laryngeal nerve. Tongue XII has the palatoglossus/X exception; anterior taste has the circumvallate/IX exception.
- Tympanic membrane: outer ectoderm, inner endoderm, intermediate mesenchyme. The mesenchymal layer includes neural crest-derived fibroblasts and mesodermal vascular contribution; avoid claiming the entire middle layer is exclusively mesoderm.
- Gut loop caudal limb is not the hindgut. Distal anal canal is proctodeal ectoderm. Spleen is mesodermal, though supplied by the celiac trunk. The 270-degree rotation is labelled the classical teaching model; direction states anterior view.
- Limb buds begin late in week 4; week 5 headings in notes describe visibility, not a switch to fetal-period onset.

## Verification

All local sentence IDs referenced by the dataset were checked against parsed original-note exports and exist. All 99 PDF entry IDs are represented in the mapping above. Source existence does not by itself prove every claim; the distinctions above record deliberate source interpretation. Image identification remains outside what text-only tables can establish. Existing room diagrams and simulations are preserved.
