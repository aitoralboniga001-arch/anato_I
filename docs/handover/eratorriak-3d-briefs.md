# Eratorriak — briefs for the following 3D session

Read `eratorriak-rooms.md` first for notes decisions and verification limits. Non-3D work must not edit scenes, three-d libraries or Arch3D.

## Shared insertion contract

`components/shell/eratorriak/kit/StudyRoom.tsx:24` accepts `view3d?: (state: RoomViewState) => ReactNode`. Pass it at the per-topic call site. State (`:14`): integer `stage`, `mode` (origin/fate), `lit` (ReadonlySet of piece keys), `labels`, `focus`, `onPick(key)`, `names` (aldaketak/guztiak/gabe). `TimelineLayout.tsx:5` renders the supplied view above the information panel and selects the solo grid when it is absent. 3D visibility/name controls appear only when a renderer is supplied. No placeholder div or fake 3D currently exists.

Never assume a room piece key equals an existing model item key. Map explicitly, especially composites. Keep the notes' embryonic/adult names from `nameAt`. Empty lit means no explicit selection; for default callouts use the current CHANGES keys. Do not turn that default into dimming every other structure unless desired by the model's own policy.

## 13 — Zainak

Slot: `components/shell/eratorriak/Topic13.tsx:10`. Data: `content/eratorriak/veins.ts:39` (moments), `:49` (pieces), `:84` (CHANGES). No extra toggles beyond shared state yet. Match origin colours, not oxygen saturation, unless explicitly switching to a blood-flow teaching mode.

| Moment | What to show / change to next | Default named/lit key candidates | Camera |
|---|---|---|---|
| 0 · Hiru bikote | Three bilateral inflows to the sinus horns. Cardinal cranial/caudal inflows remain distinguishable. Next: hepatic bud grows into septum and vitelline routes branch into two plexuses. | hcR, hcL, umbR, umbL, ccR, acR, acDistL, pcDistR, pcDistL. Names embryonic. | Front, slightly above; right of embryo on viewer left. |
| 1 · Gibela eta plexuak | Distinguish the periduodenal network from hepatic sinusoids and the two hepatocardiac exits. Next: left exit/selected distal routes regress; umbilical connection bypasses sinusoids. | portal, splenic, sinusoids, hcR, hcL. Embryonic labels except sinusoids. | Front/oblique with liver translucent, then expose its surface. |
| 2 · Eskuinerantz | Show regressions as narrowing then ghosts. Left umbilical distal route reaches right hepatocardiac channel by surface ductus venosus. Next: new cardinal systems grow, cross-connections direct left blood rightwards. | hcL, vitDistR, umbL, dv, hcR, sinusoids. Name dv “Hodi benosoa”. | Left/front oblique, surface duct visible outside liver. |
| 3 · Kardinal berriak | Sub-, supra-, sacrocardinals and three cross-anastomoses; posterior-cardinal bulk regresses. Next: connected adult caval and azygos routes; no dangling joints. | subR, subDistL, supR, supLowL, sacroR, sacroDistR, acAn, subAn, sacroAn, pcDistR, pcDistL, supHighL. | Front with viscera quiet; gentle posterior turn for azygos. |
| 4 · Behin-betiko bideak | IVC THREE source segments, SVC TWO source segments, azygos TWO sources. Left sinus horn gives coronary sinus/oblique vein. Next: umbilical vein/ductus close; flow must retire before ligament state. | hcR, subR, sacroR, acR, ccR, supR, pcR, hornL, oblique. Adult names from nameAt. | Front for cavals; posterior heart for coronary sinus. Announce any large turn. |
| 5 · Jaio ondoren | Keep closed umbilical and ductus pieces as ligamentum teres and venosum, without blood flow. Shared fetal/postnatal cardiopulmonary model may explain the other shunts. | umbL, dv, hcR, subR, sacroR, acR, ccR. Postnatal late names. | Front-oblique liver; separate cardiopulmonary view if adding birth flow. |

Reuse candidates (read only in the non-3D work):

- `components/scenes/week13/veins3d.ts`: VP0, LIVER_DONE, CARD_DONE, ADULT; initial venous model, liver plexuses, cardinal transforms and adult circulation. Simulator stages `sarrera`, `bitelinoak`, `porta`, `zilbor-zainak`, `kardinalak`, `azigos`, `beheko-kaba`, `goiko-kaba`, `sinu-koronarioa`, `laburpena`.
- `Liver3D.tsx`: bitelinoak/porta/zilbor-zainak camera treatments.
- `Cardinal3D.tsx`: cardinal/azygos/caval camera treatments.
- `circulation3d.ts`, `Circ3D.tsx`: jaio-aurretik/jaiotza/jaio-ondoren; stop shunt flow on closure.
- `Lymph3D.tsx`: linfa; optional, the room's static map may suffice.

Known mapping from source (verify runtime item existence in every pose):

| Room | Existing item candidates |
|---|---|
| hcR / hcL | hcR / hcL |
| vitDistR | vitDistR |
| vitDistL (named IMV remnant) | **No confirmed mapping.** Current model regresses left distal vitelline; room preserves the specific prose derivative. Resolve deliberately. |
| portal | vitPeriR |
| splenic | pMid + spleenV |
| smv | smv |
| sinusoids | sinusoid0… series (id gibeleko-sinusoideak) |
| umbProxR/L | umbProxR/L; liver-side portion may also be umbLiverR/L |
| umbR / umbL | umbDistR / umbDistL |
| dv | dv (id changes to gibeleko-lotailu-benosoa) |
| acAn / subAn / sacroAn | same item keys; left renal vein additionally renalL |
| subR | subUpR + subLowR + hepSub, all named as renal segment when mature |
| subProxL / subDistL | subUpL / subLowL |
| sacroR / sacroDistR | sacroProxR / sacroDistR |
| supR / supLowL / supHighL | supLowR + supMidR + supUpR (+ supLinkR); supLowL (+ supAnLow); supUpL (+ supAnUp) respectively |
| acR, ccR, acDistR/L, pcR, pcDistR/L | Examine the existing vessel-key definitions and named groups; not yet asserted as a complete one-to-one map. |
| hornL, oblique | Existing embedded heart/sinus model items; not mapped conclusively. |

What should remain 2D: the birth closure table (comparison/retrieval), IVC source bar (counts and origins), tabular origin/fate retrieval, flashcards, and lymph collection overview. A 3D spatial view complements these; replacing them would make side-by-side memorisation harder.

## 7 — Barrunbeak

Slot: `components/shell/eratorriak/Topic7.tsx:9`. Same live state contract as topic 13; there is no extra camera/tissue toggle yet. Data `content/eratorriak/cavities.ts:25` / `:35` / `:54`. The 2D map's default empty lit means whole overview; use the following CHANGES keys for default names, not as the only visible anatomy.

| Moment | Spatial story and visible change to next | Default name/focus candidates | Camera |
|---|---|---|---|
| 0 · Zeloma | The continuous space between somatic and splanchnic lateral plate, initially connected to extraembryonic coelom. Next: folds internalise it and a partial septum separates upper/lower spaces. | coelom, parietal, visceral; embryonic names | Start with transverse section; connect to a body cutaway without a hard cut. |
| 1 · Banaketa partziala | ST separates an upper primitive pericardial space from lower peritoneum but leaves TWO dorsal-lateral canals. Next: lungs push the visceral lining and pleuropericardial wall folds grow. | septum, pericardial, peritoneal, canalR, canalL, mesentery | Front-oblique plus superior cut exposing posterior canals. |
| 2 · Pleura eta perikardioa | Two pleurae behind/lateral to central anterior pericardium; pleuropericardial folds have continuous wall attachments and move medially. Canals remain open. Next: descending septum and appearing pleuroperitoneal membranes. | pleuralR/L, visceral, ppR/L, pericardial, canalR/L | Front then above; make lung push a real deforming lining, not a coloured ring. |
| 3 · Mintz pleuroperitonealak | Membranes grow from posterior-lateral walls. ST descent lengthens C3–C5 phrenic nerves; notes now say anterior T7/posterior T12 at end of week 5. Next: membranes fuse to ST posterior border and esophageal mesenchyme. | poR/L, septum, canalR/L | Above the diaphragm floor; brief side view for descent, retain body orientation. |
| 4 · Kanalak itxi | Week **7** closure. Retire canal spaces after the moving fusion front, no channels remaining through coloured tissue. Next: diaphragm rises to dome, cervical myocytes populate membranes, parts become distinct. | poR/L, septum, esophageal, canalR/L, pleuralR/L, peritoneal | Above, slightly anterior; show posterior fusion unobscured. |
| 5 · Diafragmaren atalak | Four source families, three tendon leaves, peripheral/sternal/costal/lumbar muscle, asymmetric crura. Adjacent visceral/parietal serosa; four final spaces. | septum, poR/L, esophageal, peripheral, pericardial, pleuralR/L, peritoneal, parietal, visceral | Above to identify sources, then side to reveal dome and lower posterior insertions. |

Reuse `components/scenes/week7/DiaphragmDome3D.tsx:328` (`buildDiaphragm`) in stages `diafragma-eraketa` / `diafragma-heldua`; it already has membrane growth, canals, myocyte migration, rim, dome and crura. Confirm against revised prose: scene/class may still contain older T6/week-5 closure references. Non-3D work corrected the migration labels but was forbidden to edit those scenes.

Known item mapping read from buildDiaphragm: room `septum` → item `septum`; `esophageal` → `mes` + `crura`; `poR/L` → `memR/L`; `peripheral` → `rim`; `canalR/L` → same items. Other items (aorta/ivc/eso) are contextual and are not additional diaphragm source pieces. The early cavity/serosa keys and `ppR/L` have **no confirmed mapping** in that model: a thoracic cutaway/lining model must be bridged to it. Do not pretend the dome-only model already contains the pleural/pericardial spaces.

Keep 2D: origin/part comparison table and source map; membrane-name contrast; mesentery fusion sequence and organ relationship table; card backs. The 3D should provide the missing spatial relationship (canals behind ST, lungs displacing continuous serosa, pericardium between pleurae, dome and crura), not replace retrieval tools.

## 11 — Bihotz trenkadak

Slot: `components/shell/eratorriak/Topic11.tsx:9`. Shared state only. `content/eratorriak/septa.ts:32` eight atrial moments; `:44` stable keys; `:76` default changes. The other four schema views are comparisons of processes running in parallel, not claims that AV/conal formation waits until an atrial stage with the same number.

| Moment | Spatial view / transition | Default name candidates | Camera |
|---|---|---|---|
| 0 | Common atrium and AV entrance with cushion mechanism context. Next: thin primum grows down from roof. | cushionSup, cushionInf, ivMuscle; optional common-atrium context label | Front-oblique into chamber; preserve right/left orientation. |
| 1 | Semilunar primum descends, leaving ostium primum between lower edge and cushions. Next: upper OS appears **before** lower OP closes. | primum, ostium1 | Right-atrium cutaway, see roof and floor simultaneously. |
| 2 | Both openings visible; upper OS in primum, lower OP still open. Next: cushion extensions close OP while OS remains. | primum, ostium1, ostium2 | Same view; no camera jump hides the order. |
| 3 | OP closed. AV superior/inferior cushions form septum intermedium, two AV openings. Next: thicker secundum grows on primum's RIGHT. | cushionSup/Inf, ostium1 ghost, ostium2 | Small turn/zoom between atrial and AV views; AV canal is frontal, not horizontal. |
| 4 | Two sheets at different side/depth positions; FO in lower secundum, OS in upper primum. Spurium + left venous valve incorporated into secundum. | primum, secundum, foramen, spurium, leftValve | Right/front cutaway, near wall glass; show sheet order. |
| 5 | Fetal path through FO then obliquely between sheets to OS; lower primum acts as flap. Next: pulmonary return raises left pressure; flap apposes secundum, stop fetal stream. | foramen, ostium2, primum, secundum | Oblique view of tunnel, then left-pressure context; do not reverse flow. |
| 6 | Functional apposition at birth; both tissues stay distinguishable, no instant anatomical fusion. Next: progressive fusion over first year. | primum, secundum, foramen, ostium2 | Same tunnel camera, with clear apposition contact. |
| 7 | Typical fused arrangement, with explicitly optional incomplete-fusion qualification. Also allow two-origin chamber wall exploration. | primum, secundum; raTrab/Smooth, laTrab/Smooth, rvTrab/Smooth, lvTrab/Smooth on relevant picks | Exterior→inner wall glide; expose smooth and trabeculated components without flattening them together. |

Reuse candidates (read only):

- `components/scenes/week11/atria3d.ts:446`, `atriaModel`: `septum-primum`, `zulo-obala`, `jaiotza`, `aurikulen-paretak`. Confirmed item mappings: room primum→`primum` (+ edge/cut pieces as appropriate), secundum→`secundum`/`secundum-edge`, spurium→`spurium`, leftValve→`lvv`; ostium1 uses `op-edge`, ostium2 uses `os-rim`/`primum-edge`; foramen uses `fo-rim`/`slit`/aperture representation according to pose. A hole's boundary alone may not provide a selectable surface: explicitly model the aperture for focus. Smooth RA includes `sinus`/`sinus-dome`, but complete chamber-component mapping is not asserted here.
- `canal3d.ts:219`, `canalModel`: `erreten-ab`, `balbula-ab`, `bentrikulu-arteko-trenkada`. `ivMembrane`→`membranous` confirmed at line 282. `in-r`/`in-l` and wall/cut items carry the early ventricular ids; confirm how to select whole muscular source walls without lighting unrelated chambers. Cushion/leaflet one-to-one keys not conclusively mapped.
- `outflow3d.ts:84`, `outflowParts`: `arteria-konoa`. RV/LV smooth components→`conus-in-r`/`conus-in-l`; paired conal ridges currently share `conus-ridges`, so a pick of one room ridge must not silently highlight both unless explicitly presented as the fused septum. Fused part `conus-septum`.
- `truncus3d.ts:102`, `truncusParts`: `enbor-arteriosoa`, `balbula-semilunarrak`; `LEVELS` defines three cross-section levels and `truncusRoutes` the two routes. Separate paired ridge/adult vessel/leaflet item mapping remains to be verified.
- `mechanism3d.ts:201`, `mechanismModel`: `trenkadatze-mekanismoak`; reusable extracellular-matrix/cushion and muscular-wall mechanisms.
- Existing `week11/*3D.tsx` wrappers provide camera plans; do not mix raw model state from one wrapper with another without inspecting it.

Keep 2D: opening comparison table; three-level spiral cross-section comparison (simultaneous positions are valuable); valve/cusp count table; chamber origin bars/cards; source-ambiguity details. 3D must show the tunnel, front/back AV plane, incomplete muscular IV septum and continuous conal/truncal spiral. Follow the source decisions in rooms.md, especially conal ridge directions and the two membranous-origin accounts.

## 10 · Bihotz hodia

Slot `components/shell/eratorriak/Topic10.tsx:9`, pass `view3d={state => <YourAdapter {...state}/>} ` to StudyRoom. State: stage, lit, names (aldaketak/guztiak/gabe), labels, mode, focus, onPick. Source lives/renames from `heart-tube.ts`; default glow from changedAt, not invented model timing.

|Moment|View / default emphasis / names|Camera and next transition|
|---|---|---|
|0 field|Prospective horseshoe in visceral mesoderm, central cardiogenic plate, paired tubes as context. No keyed formed segments yet.|Above field; then transverse fold merges tubes and cephalocaudal fold relocates region.|
|1 paired|endoR, endoL, myocard, epicard, mesocard appear. Embryonic layer names.|Cutaway/longitudinal, show dorsal attachment; fusion progresses cranial→caudal.|
|2 tube|Four segment groups, flow sinus→atrium→ventricle→bulbus; embryonic names. Mesocard thinning.|Anterior with superior outlet; preserve paired sinus horns; progress to looping.|
|3 loop|mesocard goes; proximal/ventricle and atrium/sinus move (CHANGES10 explicit keys).|Front, then slight left oblique to show atrium/sinus moving back/up and bulb forward/down/right. RV on viewer left.|
|4 parts|proximal, conusR/L, truncA/P, ventricle, atriumL switch to derivative names.|Cutaway front, smooth infundibula vs trabeculated inflows; keep roots continuous.|
|5 sinus|atriumR, sinusR, sinusCor/Oblique, valveIvc/Cor, valveL/spurium rename; valveUpper ghost.|Right atrial interior, posterolateral glass wall; sinus wall incorporated, left remnants preserved, left valve+spurium to secundum.|

Candidate reuse (read only): `week10/Heart3D.tsx`, `model3d.ts` for segment/loop stages (`bihotz-atalak`, `bihotz-lakioa`, `atal-bulbarra`); `Circulation3D.tsx` for early circuit; `atrium3d.ts` atriumModel for `eskuineko-aurikula`. Confirmed atrium item keys: sinusR→smooth/sinus (state-dependent transition), atriumR→back/lateral/auricle (several wall items, not one-to-one); valveUpper→rv-top; valveL→lv; spurium→spurium; valveIvc→ivc-valve; valveCor→cs-valve. rv-low is the precursor of BOTH lower valves; do not duplicate it as two adult valves too early. Remaining tube model item mapping not confirmed; use registry ids and verify before adapting.

Keep 2D: folding comparison, layer list/jelly explanation, circulation direction definition, origin matrix/composite bars. 3D adds spatial depth/rotation and atrial wall incorporation. Do not import the conflicting week-4 venous regression dates as universal; see rooms.md.

## 9 · Muskuluak

Slot `Topic9.tsx:9`, same view3d renderer state. Categorical stage: no temporal interpolation between unrelated categories. `muscles.ts` / MUSCLE_FACTS are authoritative; keys remain stable when recolouring by innervation. No default life-based glow because there are no lives; use selected keys or MUSCLES.changes lines.

|View|What to show / default names and candidate keys|Camera / transition|
|---|---|---|
|0 types|Visceral smooth muscle (gut), ectodermal exceptions (pupil/breast/sweat), proposed aortic wall sources (vascularWall/vascularCrest).|Focused organ/cell comparison; no forced morph to view 1.|
|1 head|eye12/eye3/eye5; arch1/arch2/arch3; larynx/tongue; show source numbers plus III/IV/V/VI/VII/IX/X/XII.|Head front/oblique, pharyngeal arches lateral. Distinguish embryonic right from viewer left.|
|2 domains|deep/intercostal/neck/scapula/wall/limb. Switch domain blue/amber to dorsal/ventral-ramus magenta/emerald while retaining geometry.|Transverse cutaway, neural tube/notochord/gut context. Migration across frontier is the meaningful animated event.|
|3 patterns|ctHead/ctBody; neural crest connective pattern vs parietal connective pattern, with somite-derived muscle precursors separate.|Head/limb regional views; actual migration only, not false origin conversion.|
|4 cardiac|cardiac/conduct; intercalated contacts, SA/AV/His/Purkinje conduction.|Cell enlargement plus heart cutaway; no skeletal myoblast fusion.|

Read-only candidate `components/scenes/week9/Domains3D.tsx`, buildDomains: simulator `domeinuak`, shared scaffold also useful for `somitaren-paretak`. Confirmed existing items: neural, noto, sclero, dermato, myo, parietal, visceral, frontier, prim, abax, cell{i}{side}. These describe SOURCE domains/precursors, not one-to-one adult muscle records. deep/intercostal/neck/scapula all fall in prim; wall/limb precursors cross frontier to abax; ctBody corresponds to parietal connective context. Do not colour every prim muscle as epaxial: intercostal is the pinned counterexample. Head muscle model mapping not confirmed.

Keep 2D: full source→muscle→nerve matrix, fibre-type warning, root/ramus schematic, fusion comparison, cardiac conduction flow. 3D is most valuable for frontier crossing, neural tube relationship and persistent geometry under a domain/innervation recolour toggle.

## 8 · Hezurrak

Slot `components/shell/eratorriak/Topic8.tsx:9`. Same view3d(state) as other rooms; stage is a categorical view index (0–4), not a developmental age. Read `bones.ts:155` for records, BONE_FACTS at 563 and stages at 678. Local actual resegmentation phase/lives are RESEGMENT8 at 686; do not synchronise them by pretending they share the main categorical index.

|Main view|What to see / names / keys|Camera and meaningful transition|
|---|---|---|
|0 vault|frontal, parietal, occScale, tempScale; source colours plus connective sutures/fontanelles.|Above calvaria then side; growth/moulding/fontanelle closure is meaningful, not morphing all calvarial bones into cartilage.|
|1 base|occBaseOcc/occBaseNeck through parachordal cartilage; hypophyseal, trabeculae, otic, greaterWing, lesserWing.|Inside skull from above; align posterior→anterior central and lateral plate order. Differentiate source from intermediate cartilage.|
|2 face|incus/maxilla/zygoma, malleus/mandible, stapes, with tempScale when selected.|Lateral head cutaway; maxillary dorsal versus mandibular ventral first-arch regions, Reichert second-arch path. Cartilage versus surrounding mesenchyme must stay distinguishable.|
|3 limbs/thorax|upper/lower/pelvis and ribBone/ribCart/sternum.|Separate limb and thorax scenes; upper external/lower internal rotation; sclerotome bone versus parietal anterior costal cartilage.|
|4 axial|vertebraCaudal, vertebraCranial, annulus, nucleus, notoBody.|Oblique segment column plus transverse canal cutaway. A caudal + B cranial halves fuse; nerves at discs and arteries at body levels; notochord regresses in bodies and remains in nuclei.|

Default emphasis: no false life-based glow in categorical views. Show the view's embryonic sources and derivative names as labelled; selected keys are authoritative. For a separate four-step 3D resegmentation interaction use RESEGMENT8 lives, maintaining A/B source identity; do not create an extra notochord-derived bone.

Candidates, read only:
- `components/scenes/week8/Calvaria3D.tsx`, buildCalvaria / simulator `buru-ganga`. Confirmed mapping frontal→bone-FL/FR, parietal→bone-PL/PR, occScale→bone-OC, tempScale→bone-TL/TR; greaterWing context→bone-SL/SR. Sutures/fontanelles are sut{i}/font{i}, context base/face/membrane. Paired model items are one categorical source record: highlight both without duplicating their adult derivation.
- `LimbRotation3D.tsx`, buildLimbRotation / `gorputz-adarrak`: tags create flex/ext skin regions and matrices for upper/lower external/internal turns. Those are useful rotation context, NOT named bone meshes; direct upper/lower/pelvis bone item mapping not confirmed.
- Existing simulator `bizkarrezurra`, `ornoa`, `hezur-luzeak`, `kondrokraneoa`, `errai-kraneoa`, `saihetsak` provide 2D stages to inspect. No existing accurate 3D item mapping for resegmentation/base/ear ossicles has been verified here.

Keep 2D: source×ossification matrix, fontanelle timing comparison, simultaneous arch-cartilage versus surrounding-mesenchyme plate, four-step A/B resegmentation teaching sequence and long-bone primary/secondary/growth-plate comparison. 3D adds spatial cranial plates, notochord/neural-tube relation and rotation, but should preserve the comparative 2D tools.

Source cautions: see rooms.md for contradictory flexor/extensor positions between topics 8/9, costal cartilage lineage in topic 8 versus recap in 9, styloid/hyoid unsupported asserted derivatives, and the lecture's growth-plate terminology. Do not silently import an outside textbook account or the old migration edge as the supplied notes' claim.

## Completion

Six non-3D rooms complete; 3D slots intentionally empty. Add adapters in Topic7/8/9/10/11 at line 9 and Topic13 at line 10, passing state into future components. No 3D files were edited during this task. Keep all stable keys and source decisions; if a model cannot represent a key, record the missing mapping rather than attaching its label to a convenient unrelated object.

## Built so far (2026-10-30)

- **Shared frame:** `components/shell/eratorriak/kit/Room3D.tsx`. A room passes `view3d={(s) => <X3D {...s} />}` to `StudyRoom`; `X3D` builds only `frame(u) → {items, pts, camera, names}` and hands it to `<Room3D state={s} frame={frame} continuity="eratorriak-N" label="…" />`. Room3D does the glide between moments, the label scale, the turn keys and **Handitu** (a full-screen overlay with the moment buttons and the names switch; Esc / ← → work there). `RoomViewState` now carries `stages`, `onStage` and `onNames` for that.
- **Topic 7:** model `components/scenes/week7/cavities3d.ts` (item keys = room piece keys; context keys `spine`, `gut`, `heart`, `lungs`), adapter `Cavity3D.tsx`, test `tests/eratorriak-7-3d.test.ts` (every living piece drawn and named, nothing gone drawn, sides). Moments 1–3 seen from the front; from moment 4 the camera rises over the floor and the upper organs turn to glass.
- **Shooting tip:** a 3D canvas outside the viewport stops drawing, so element captures with `captureBeyondViewport` show a stale picture. Scroll the view into the viewport first and clip in place.
- **Topic 13:** `Vein3D.tsx` reuses the simulator's `veins3d.ts` unchanged: six poses, room piece → model items map (`ITEMS`) and name points (`PT`). The left distal vitelline stays (`lDist: 0`) because the room keeps it as the inferior mesenteric vein. The oblique vein shares the left horn until the coronary sinus forms. A room piece is drawn only once its life is not 0 (the model leaves stubs of vessels about to grow). Test: `tests/eratorriak-13-3d.test.ts`.
- **Topic 11:** `Septa3D.tsx` reuses `atria3d.ts` (atria, eight poses) and `canal3d.ts` (AV canal, IV septum, conus and truncus) as two views of one heart. The atria view is the default; picking pieces that only the lower heart has (valves, IV septum, conus/truncus ridges, semilunar valves) glides the camera and fades the atria into the lower view (`lowerView`, `useGlide`). A room piece is drawn only while the room says it is alive, so a closed opening (ostium primum/secundum) disappears. `atria3d.ts` now draws septum spurium and the left venous valve before septum secundum grows, as the sinus orifice's venous valves (the simulator never sets spurium early, so it is unchanged). During a morph the old and new pulmonary vein openings can share a key, so repeated keys get a `~n` suffix. Test: `tests/eratorriak-11-3d.test.ts`.
- **Topic 10:** `Tube3D.tsx` reuses `model3d.ts` (the tube through the six moments) and `atrium3d.ts`, both unchanged. Moment 0 adds the cranial arc that closes the two arms into the horseshoe plexus, plus the cardiogenic plate; the room names nothing there, so the 3D gives these context names. The layers are a mode of the same tube: the tube without myocardium as the endocardium inside, the myocardium gone clear, its surface pushed out as the epicardium, and a sheet to the foregut as the dorsal mesocardium. That mode is the default at moment 1 and opens whenever only layers are picked. The venous valves live in a close-up of the opened right atrium beside the heart, turned to the camera. It is the default at moment 5 and opens when a valve is picked. Segment pieces belong to the wall only from moment 2. Test: `tests/eratorriak-10-3d.test.ts` (each view draws and names what the room has, each moment's opening view names what it says, and the sides hold).
- **Topic 8:** `Bone3D.tsx`, the same station pattern as topic 9, on one newborn skeleton (room frame: x left, y up, z forward). Vault: the simulator's calvaria (`week8/Calvaria3D`, `GEO` slot now exported) at `CAL_T.side + 0.02` (bones grown, sutures and fontanelles open, no moulding); its floor recoloured to a quiet bone tone. Base: the vault lifts off; paired cartilage plates sit on the floor in the notes' order (parachordals either side of the notochord, the first cervical share round the front of the foramen magnum; hypophyseal cartilages, trabeculae; periotic capsule, temporal wing, orbital wing), seen from behind and above so anterior is up and the names point at the embryo's right. Face: maxilla, zygoma, brow and mandible carved from the calvaria's own face SDF (narrow gaps between them); the mandible is see-through so Meckel's cartilage shows inside it; ossicles ×1.8 in front of a dark middle-ear recess, each with its arch cartilage (Meckel → malleus, palatopterygoquadrate bar → incus, Reichert → stapes; the bars keep a cartilage colour and are named as context). Limbs/thorax: column, 12 rib pairs (bone behind, costal cartilage in front: 1–7 to the sternum, 8–10 to the costal margin), sternum in three parts, pelvic girdle, limbs; the shoulder girdle is quiet context (the notes list only the pelvic one). Axis: only the column, with L1–L4 swapped for front-cut copies: each body in two halves (upper = vertebraCaudal, lower = vertebraCranial, drawn lighter since source and fate colours are the same), annulus round a nucleus, a fading notochord thread in the bodies, spinal nerves at the discs and segmental arteries at the body's middle. The vault's remark about the nucleus is not drawn there (`ELSEWHERE`). Test `tests/eratorriak-8-3d.test.ts`: every view draws and names exactly its pieces, name points stay in frame, the halves differ. Fixed in 8 and 9: a part named only in the next view no longer takes that view's colour while resting (topic 10's `Tube3D` has the same blend line, left as is). `twoLines` moved to `kit/twoLines.ts`.
- **Topic 9:** `Muscle3D.tsx`. The views are categories, so nothing morphs: one week-5 embryo (`lib/three-d/embryo5`) holds five stations and the camera travels between them while the parts cross-fade. The embryo's frame (y dorsal, z cranial) is turned into the room's (y cranial, z ventral), so the axis badge is true. The domains station keeps the simulator's dorsal-up view; the others stand the embryo head up, and the up vector glides too. The trunk block reuses `week9/Domains3D` (`buildDomains(1, true)`, its `GEO` slot now exported, waited for with `useGeoReady`) and gains a spinal nerve with its dorsal and ventral primary rami. The heart is `model3d`'s loop placed in the heart bulge, with an added conduction system that keeps its own yellow (both colourings would make it the myocardium's). Also added: arch, eye-muscle, larynx and hypoglossal-cord overlays; the mammary ridge; the sweat glands; the arch arteries; and the limb buds. An item's piece depends on the view (the arches are arch1–3 in the head view and ctHead in the patterns view). Long names wrap onto a second line at their own separator. Test: `tests/eratorriak-9-3d.test.ts`.
