# 10. gaiko klasea: iturriak

_Sortua: `npx tsx scripts/klasea/audit.ts 10`. F = funtsezkoa, g = garrantzitsua._

## 0. Gaur

Etapa: `eskualde-kardiogenikoa` · 2 lerro · ~13 s hitz eginda

1. «Kaixo! Gaurko klasean bihotza nola sortzen den eta lehen zirkulazioa ikasiko ditugu.»
  _t=0_
  - Ez dut ulertu: «Gaurko gaia: bihotza nola sortzen den, eta odolak egiten duen lehen bidea.»
  - **F** `w10/1/p3/s1` Garapenaren 3. astean enbrioia jada ezin da orain arte bezala elikatu (difusioaren bidez) eta 3. astetik aurrera bere berezko zirkulazio-sistema/sistema kardiobaskularra garatuko da.

2. «3. astean, enbrioia ezin da jada difusioaren bidez elikatu. Horregatik, bere zirkulazio-sistema garatzen du.»
  _t=0 · why · arbelean: b-zergatik_
  - Ez dut ulertu: «Enbrioia handitu egin da: difusioa ez da nahikoa, eta odol hodiak eta bihotza behar ditu.»
  - **F** `w10/1/p3/s1` Garapenaren 3. astean enbrioia jada ezin da orain arte bezala elikatu (difusioaren bidez) eta 3. astetik aurrera bere berezko zirkulazio-sistema/sistema kardiobaskularra garatuko da.

- Arbela `b-zergatik`: 3. astetik aurrera: difusioa ez da nahikoa, zirkulazio-sistema propioa
  - **F** `w10/1/p3/s1` Garapenaren 3. astean enbrioia jada ezin da orain arte bezala elikatu (difusioaren bidez) eta 3. astetik aurrera bere berezko zirkulazio-sistema/sistema kardiobaskularra garatuko da.
- Galdera (predict): Zer uste duzu: zergatik behar du enbrioiak bere zirkulazio-sistema 3. astetik aurrera?

## 1. Nondik dator bihotza?

Etapa: `eskualde-kardiogenikoa` · 6 lerro · ~41 s hitz eginda

1. «Lerro primitiboaren alde zefalikotik zelulak migratzen dira, eta ferra forman zelula multzoak sortzen dituzte: odol irlatxoak.»
  _t=0.32 · argi: lerro-primitiboa, odol-irlatxoak_
  - Ez dut ulertu: «Lerro primitiboaren buru aldetik zelula batzuk ateratzen dira, eta ferra itxurako multzoak egiten dituzte: odol irlatxoak.»
  - **F** `w10/1/p4/s1` Lerro primitiboaren alde zefalikoan kokatzen diren zelula epiblastiko batzuk, lerro primitibotik migratzen dute eta alde zefalikora abiatuz, plaka neuralaren alde zefalikoan eta alde lateraletan, migratutako zelula horiek alboko mesodermoko errai orriraino iristen dira.
  - **F** `w10/1/p4/s2` Bertan, ferra formako egitura bat sortzen dute.
  - **F** `w10/1/p4/s3` Bertako zelula multzoak, odol irlatxoak dira.

2. «Zeharkako mozketan ikusten da non dauden: alboko mesodermoaren errai orrian.»
  _t=0.48 · emphasis · argi: odol-irlatxoak, errai-orria · arbelean: b-irlatxoak_
  - Ez dut ulertu: «Mozketa honetan ikusten da: irlatxoak errai orrian daude, alboko mesodermoaren barruko geruzan.»
  - **F** `w10/1/p4/s1` Lerro primitiboaren alde zefalikoan kokatzen diren zelula epiblastiko batzuk, lerro primitibotik migratzen dute eta alde zefalikora abiatuz, plaka neuralaren alde zefalikoan eta alde lateraletan, migratutako zelula horiek alboko mesodermoko errai orriraino iristen dira.
  - **F** `w10/1/p4/s3` Bertako zelula multzoak, odol irlatxoak dira.

3. «Irlatxoetatik odol hodiak garatzen dira: ferra formako sare bat osatzen dute, eta fusionatzean, ferra formako tutu bat.»
  _t=0.62 · argi: ferra-formako-plexua_
  - Ez dut ulertu: «Irlatxo horiek odol hodi bihurtzen dira; elkartzean, ferra itxurako hodi bakar bat egiten dute.»
  - **F** `w10/1/p4/s4` Odol irlatxo horietatik garatzen dira odoleko zelulak eta baita odol hodiak ere.
  - **F** `w10/1/p4/s5` Beraz, hemendik ferra formako odol hodiz osatutako sare bat sortzen da.
  - **F** `w10/1/p4/s6` Sare horretako odol hodiak fusionatzean, ferra formako tutu itxurako egitura sortzen da.

4. «Tutu horretan bi atal daude: erdian plaka kardiogenikoa, eta alboetan endokardio hodiak.»
  _t=0.74 · emphasis · argi: plaka-kardiogenikoa, bihotz-hodiak · arbelean: b-plaka_
  - Ez dut ulertu: «Ferra bera da, bi izenekin: erdiko atala plaka kardiogenikoa da, eta alboetako besoak endokardio hodiak.»
  - g `w10/1/p5/s1` Tutu itxurako egitura horretan, bi atal bereizten dira.
  - **F** `w10/1/p6/s1` 1-Erdiko atala: Plaka kardiogenikoa→ Plaka neuralaren alde zefalikoan kokatuta dago (mintz bukofaringeoaren alde bentralean, eta plaka neuralaren aurreko aldean kokatzen dela ikusten da mozketa sagitalean; kokatzen ari da perikardio barrunbean).
  - g `w10/1/p7/s1` 2-Alboko aldeak: Endokardio hodiak dira.

5. «Kontuz: plaka kardiogenikoa plaka neuralaren alde zefalikoan dago, mintz bukofaringeoaren alde bentralean.»
  _t=0.74 · caution · argi: plaka-kardiogenikoa, plaka-neurala, mintz-bukofaringeoa_
  - Ez dut ulertu: «Kontuz: plaka kardiogenikoa plaka neuralaren buruko aldean dago, eta mintz bukofaringeoaren aurrean.»
  - **F** `w10/1/p6/s1` 1-Erdiko atala: Plaka kardiogenikoa→ Plaka neuralaren alde zefalikoan kokatuta dago (mintz bukofaringeoaren alde bentralean, eta plaka neuralaren aurreko aldean kokatzen dela ikusten da mozketa sagitalean; kokatzen ari da perikardio barrunbean).

6. «Notokordaren bi alboetan bi aorta dortsal agertzen dira, hasieratik endokardio hodiekin kontaktuan.»
  _t=0.86 · emphasis · argi: aorta-dortsalak, notokorda · arbelean: b-aortak_
  - Ez dut ulertu: «Notokordaren bi aldeetan bi aorta dortsal sortzen dira, eta hasieratik hodiekin ukitzen dira.»
  - **F** `w10/1/p8/s1` Aldi berean, alboko mesodermoko errai orritik sortutako beste motako zelula batzuk, notokordaren bi alboetan osatzen dituzten zelula irlatxoetatik, bi luzetarako odol hodi (arteria) agertzen dira.
  - **F** `w10/1/p8/s2` Hauek, aorta dortsalak (bat ezkerrekoa bat eskumakoa) dute izena.
  - **F** `w10/1/p8/s3` Hauek, hasieratik kontaktuan egongo dira alboko hodi endokardikoekin.

- Arbela `b-irlatxoak`: Odol irlatxoak: alboko mesodermoaren errai orrian, ferra forman
  - **F** `w10/1/p4/s1` Lerro primitiboaren alde zefalikoan kokatzen diren zelula epiblastiko batzuk, lerro primitibotik migratzen dute eta alde zefalikora abiatuz, plaka neuralaren alde zefalikoan eta alde lateraletan, migratutako zelula horiek alboko mesodermoko errai orriraino iristen dira.
  - **F** `w10/1/p4/s2` Bertan, ferra formako egitura bat sortzen dute.
  - **F** `w10/1/p4/s3` Bertako zelula multzoak, odol irlatxoak dira.
- Arbela `b-plaka`: Ferra formako tutua: erdian plaka kardiogenikoa, alboetan endokardio hodiak
  - **F** `w10/1/p6/s1` 1-Erdiko atala: Plaka kardiogenikoa→ Plaka neuralaren alde zefalikoan kokatuta dago (mintz bukofaringeoaren alde bentralean, eta plaka neuralaren aurreko aldean kokatzen dela ikusten da mozketa sagitalean; kokatzen ari da perikardio barrunbean).
  - g `w10/1/p7/s1` 2-Alboko aldeak: Endokardio hodiak dira.
- Arbela `b-aortak`: Aorta dortsalak: notokordaren alboetan, hasieratik endokardio hodiekin kontaktuan
  - **F** `w10/1/p8/s1` Aldi berean, alboko mesodermoko errai orritik sortutako beste motako zelula batzuk, notokordaren bi alboetan osatzen dituzten zelula irlatxoetatik, bi luzetarako odol hodi (arteria) agertzen dira.
  - **F** `w10/1/p8/s3` Hauek, hasieratik kontaktuan egongo dira alboko hodi endokardikoekin.
- Galdera (pool): w10-q-plaka

## 2. Tolespenek hodi bakarra egiten dute

Etapa: `bihotz-hodia` · 8 lerro · ~70 s hitz eginda

1. «Hasieran diskoa laua da oraindik. 3. aste bukaeran bi tolespen egiten ditu: zefalokaudala eta zeharkakoa.»
  _t=0_
  - Ez dut ulertu: «Disko laua tolestu egingo da, bi norabidetan: luzetara eta zeharka.»
  - **F** `w10/1/p9/s1` Diskoaren tolespenak ez dira hasi oraindik (laua mantentzen da oraindik).
  - **F** `w10/1/p9/s2` 3. aste bukaeran, laua den diskoa tolesten hasi eta 2 tolespen egiten ditu: zefalokaudala eta zeharkakoa.

2. «Lehenik, tolespen zefalokaudala: nerbio sistema luzetara hazten da, eta horregatik plaka kardiogenikoa alde kaudalera doa.»
  _t=0.1 · why · argi: plaka-kardiogenikoa_
  - Ez dut ulertu: «Garuna eta muina asko hazten dira luzetara; horregatik bihotzaren plaka beherago geratzen da.»
  - **F** `w10/1/p10/s1` → Tolespen zefalokaudala (erdiko nerbio sistemaren luzetarako hazkuntzagatik) dela eta, ferra formako plexuaren erdiko atala (plaka kardiogenikoa) alde kaudalera abiatzen da, alde zefalikoan garun xixkuak agertzen hasten baitira.

3. «Hasieran lepo mailan dago, perikardio barrunbean; azkenean torax barrunbera iristen da, garun xixkuen eta mintz bukofaringeoaren alde kaudalean.»
  _t=0.1 · emphasis · argi: plaka-kardiogenikoa, perikardio-barrunbea, garun-xixkuak, mintz-bukofaringeoa · arbelean: b-zefalokaudala_
  - Ez dut ulertu: «Nerbio sistema hazten denean, plaka kardiogenikoa beherago geratzen da: lepotik toraxera.»
  - **F** `w10/1/p10/s2` Hasieran, plaka kardiogenikoa (perikardio barrunbean sartuta dagoena) lepo mailan dago.
  - **F** `w10/1/p10/s3` Ostean, gero eta beherago egongo da, azkenean torax barrunbera iritsiko da eta bertan, entzefalo xixkuen eta mintz bukofaringeoaren alde kaudalean geratuko da.

4. «Bigarrena, zeharkako tolespena: somitak hazten dira, eta ezkerreko eta eskuineko endokardio hodiak fusionatzen dira: hodi bakarra.»
  _t=0.32 · emphasis · argi: bihotz-hodiak, endokardioa · arbelean: b-zeharkakoa_
  - Ez dut ulertu: «Gero gorputza zeharka tolesten da: ezkerreko eta eskuineko hodiak elkartu, eta hodi bakarra geratzen da.»
  - **F** `w10/1/p11/s1` → Zeharkako tolespenagatik (somiten hazkuntzagatik), plexuaren alboko aldeak gero eta lodiagoak egingo dira, hurbilduz, haien artean fusionatzen hasten diren arte.
  - **F** `w10/1/p11/s2` Tolespen honen ondorioz, endokardio-hodiak (ezkerrekoak eta eskuinekoak) haien artean hurbildu eta fusionatu egiten dira, endokardio hodi bakarra sortuz.

5. «Hodiaren inguruan errai orria kokatzen da, eta hortik orri epimiokardikoa sortzen da.»
  _t=0.47 · argi: errai-orria, orri-epimiokardikoa_
  - Ez dut ulertu: «Hodiaren inguruan errai orria jartzen da, eta hortik hodiaren kanpoko geruzak sortzen dira.»
  - **F** `w10/1/p11/s3` Hodi horren inguran, alboko mesodermoaren errai orria kokatuko da, eta errai orri horretatik, orri epimiokardikoa sortzen da.

6. «Hala, hiru geruza bereizten dira: barrutik endokardioa, tartean miokardioa, muskularra, eta kanpoan epikardioa edo errai perikardioa.»
  _t=0.59 · emphasis · argi: endokardioa, miokardioa, epikardioa · arbelean: b-geruzak_
  - Ez dut ulertu: «Hiru geruza: barruan endokardioa, gero miokardioa, hau da, muskulua, eta kanpoan epikardioa.»
  - **F** `w10/1/p12/s1` ● Miokardio geruza = geruza muskularra
  - **F** `w10/1/p13/s1` ● Epikardio geruza edo errai perikardioa→miokardioaren inguruan.
  - g `w10/1/p14/s3` Honela, bihotzak dituen 3 zelula geruzak desberdintzen dira:
  - **F** `w10/1/p15/s1` ● Endokardioa: bihotzaren barruko geruza, hodi-endokardiotik migratutako eta bihotz gelatinatik sortutako zeluletatik sortu.
  - **F** `w10/1/p16/s1` ● Miokardioa: tarteko zelula geruza, geruza muskularra (Endokardioa inguratu).
  - **F** `w10/1/p17/s1` ● Epikardioa edo errai perikardioa: epimiokardiotik sortutako geruza, miokardio inguruan.

7. «Hodia atzeko paretari lotuta dago, mesokardio dortsalaren bidez; lotura hori desagertzean, perikardioaren zeharkako sinua geratzen da.»
  _t=0.73 · argi: mesokardio-dortsala, perikardioaren-zeharkako-sinua · arbelean: b-sinua_
  - Ez dut ulertu: «Hodia atzeko paretari zintzilik dago, mesokardio dortsalaren bidez; hori galtzean tarte bat geratzen da: perikardioaren zeharkako sinua.»
  - **F** `w10/1/p18/s1` Hasieran, bihotz-hodia lotuta mantentzen da perikardio barrunbearen atzeko paretarekin mesokardio dortsala izeneko loturaren bitartez, baina garapenean lotura hau desagertu egiten da (behin-behineko egitura da).
  - g `w10/1/p18/s2` Desagerpenarekin, perikardio barrunbeak zakuondo/sinu bat agertzen da → perikardioaren zeharkako sinua.

8. «Tolespenagatik, atzekaldeko aorta dortsalen alde zefalikoak gero eta aurrerago kokatzen dira, eta lehen arku aortikoen bidez bihotz hodiarekin lotzen dira.»
  _t=0.9 · emphasis · argi: aorta-dortsalak, aorta-arkuak, bihotz-hodia · arbelean: b-arkuak_
  - Ez dut ulertu: «Tolestean, aorten muturrak aurrerago geratzen dira, eta lehen aorta arkuek bihotz hodiarekin lotzen dituzte.»
  - **F** `w10/1/p19/s2` Hauetatik, bi luzetarako odol-hodi sortzen dira: arteria dortsalak (enbrioiaren atzekaldean kokatuak).
  - **F** `w10/1/p19/s3` Arteria dortsal hauek alde zefalikotik, kontaktatzen dute bihotz hodiaren atal zefalikoarekin.
  - **F** `w10/1/p21/s1` Gainera, enbrioiaren tolespen zefalokaudalarengatik, aorta dortsal hauen alde zefalikoak gero eta aurrerago kokatzen dira.
  - **F** `w10/1/p21/s2` Azkenenan, bihotz hodiaren alde zefalikoarekin lotzen da konexio ezberdinen bitartez.
  - g `w10/1/p21/s4` Lehenengo arku aortikoen bitartez batu egingo dira.
  - g `w10/1/p21/s5` 2 arku dira, aorta bakoitzak arku batekin konektatzen baitu.

- Arbela `b-zefalokaudala`: Tolespen zefalokaudala: plaka kardiogenikoa lepo mailatik torax barrunbera
  - **F** `w10/1/p10/s1` → Tolespen zefalokaudala (erdiko nerbio sistemaren luzetarako hazkuntzagatik) dela eta, ferra formako plexuaren erdiko atala (plaka kardiogenikoa) alde kaudalera abiatzen da, alde zefalikoan garun xixkuak agertzen hasten baitira.
  - **F** `w10/1/p10/s2` Hasieran, plaka kardiogenikoa (perikardio barrunbean sartuta dagoena) lepo mailan dago.
  - **F** `w10/1/p10/s3` Ostean, gero eta beherago egongo da, azkenean torax barrunbera iritsiko da eta bertan, entzefalo xixkuen eta mintz bukofaringeoaren alde kaudalean geratuko da.
- Arbela `b-zeharkakoa`: Zeharkako tolespena: bi endokardio hodiak fusionatzen dira, hodi bakarra
  - **F** `w10/1/p11/s1` → Zeharkako tolespenagatik (somiten hazkuntzagatik), plexuaren alboko aldeak gero eta lodiagoak egingo dira, hurbilduz, haien artean fusionatzen hasten diren arte.
  - **F** `w10/1/p11/s2` Tolespen honen ondorioz, endokardio-hodiak (ezkerrekoak eta eskuinekoak) haien artean hurbildu eta fusionatu egiten dira, endokardio hodi bakarra sortuz.
- Arbela `b-geruzak`: 3 geruza: endokardioa (barrukoa), miokardioa (muskularra), epikardioa (kanpokoa)
  - g `w10/1/p14/s3` Honela, bihotzak dituen 3 zelula geruzak desberdintzen dira:
  - **F** `w10/1/p15/s1` ● Endokardioa: bihotzaren barruko geruza, hodi-endokardiotik migratutako eta bihotz gelatinatik sortutako zeluletatik sortu.
  - **F** `w10/1/p16/s1` ● Miokardioa: tarteko zelula geruza, geruza muskularra (Endokardioa inguratu).
  - **F** `w10/1/p17/s1` ● Epikardioa edo errai perikardioa: epimiokardiotik sortutako geruza, miokardio inguruan.
- Arbela `b-sinua`: Mesokardio dortsala desagertzen da: perikardioaren zeharkako sinua
  - **F** `w10/1/p18/s1` Hasieran, bihotz-hodia lotuta mantentzen da perikardio barrunbearen atzeko paretarekin mesokardio dortsala izeneko loturaren bitartez, baina garapenean lotura hau desagertu egiten da (behin-behineko egitura da).
  - g `w10/1/p18/s2` Desagerpenarekin, perikardio barrunbeak zakuondo/sinu bat agertzen da → perikardioaren zeharkako sinua.
- Arbela `b-arkuak`: Lehen arku aortikoak: aorta dortsalak bihotz hodiaren alde zefalikoarekin lotzen dituzte (2 arku)
  - **F** `w10/1/p21/s1` Gainera, enbrioiaren tolespen zefalokaudalarengatik, aorta dortsal hauen alde zefalikoak gero eta aurrerago kokatzen dira.
  - **F** `w10/1/p21/s2` Azkenenan, bihotz hodiaren alde zefalikoarekin lotzen da konexio ezberdinen bitartez.
  - g `w10/1/p21/s4` Lehenengo arku aortikoen bitartez batu egingo dira.
  - g `w10/1/p21/s5` 2 arku dira, aorta bakoitzak arku batekin konektatzen baitu.
- Galdera (zer-da-hau)

## 3. Lehen zirkulazioa

Etapa: `zirkulazio-goiztiarra` · 11 lerro · ~85 s hitz eginda

1. «Orain, bihotzera iristen den eta handik irteten den odola. Hasieran hodia nahiko zuzena da, eta bi mutur ditu.»
  _t=0 · argi: arteria-muturra, zain-muturra_
  - Ez dut ulertu: «Orain odolaren bidea: hodiak bi mutur ditu, bata odola sartzeko eta bestea irteteko.»
  - **F** `w10/1/p22/s1` Bihotz hodian 2 mutur bereizten dira: Hasieran bihotz hodia nahiko zuzena da

2. «Beheko muturra zain muturra da: hara hiru zain mota iristen dira, bikoteka: zilborrekoak, bitelinoak eta kardinal komunak.»
  _t=0.08 · argi: zain-muturra, zilbor-zainak, bitelo-zainak, bena-kardinal-komuna_
  - Ez dut ulertu: «Beheko muturrera hiru zain bikote iristen dira: zilborrekoak, bitelinoak eta kardinal komunak.»
  - **F** `w10/1/p23/s1` - Beheko muturra→ Zain muturra: honaino iristen dira momentu honetan enbrioiak dauzkan zainak.
  - **F** `w10/1/p23/s2` Hasieran 3 zain mota: zilborrekoak (2 dira, karenatik bueltatzen dira, eta odol oxigenatua garraiatzen dute), bitelinoak (2 dira, bitelo zakutik itzuli eta odol ez-oxigenatua garraiatzen dute), eta kardinal komunak (2 dira, eta alde zefalikotik zein alde kaudaletik itzultzen diren zainak (aurreko eta atzeko kardinalak direnak) elkartzen direnean sortzen dira).

3. «Goiko muturra arteria muturra da: odola arteria bulboaren urrutiko atalatik, aorta zakutik, arku aortikoetara eta aorta dortsaletara irteten da.»
  _t=0.19 · argi: arteria-muturra, atal-bulbarra, aorta-zakua, aorta-arkuak, aorta-dortsalak_
  - Ez dut ulertu: «Goiko muturretik odola irteten da: bulbotik aorta zakura, gero aorta arkuetara eta aorta dortsaletara.»
  - **F** `w10/1/p24/s1` - Goiko muturra (zefalikoa)→ Arteria muturra (edo irteera muturra): hemendik ateratzen da odola eta dauden arku aortikoen bitartez, aorta dortsaletara pasatu (komunikatu).
  - g `w10/1/p24/s2` Arteria bulboa dago hemen kokatuta.
  - **F** `w10/1/p25/s1` Arteria bulboaren urrutiko atalak aorta zakua du izena.

4. «Kontuan hartu: arteriak bihotzetik irteten diren odol hodiak dira; zainek, aldiz, odola bihotzera eramaten dute.»
  _t=0.3 · emphasis · argi: aorta-arkuak, aorta-dortsalak, zilbor-zainak, bitelo-zainak · arbelean: b-arteria-zaina_
  - Ez dut ulertu: «Gogoratzeko erraza: arteriak bihotzetik irteten dira; zainak bihotzera sartzen dira.»
  - **F** `w10/1/p26/s1` Kontuan hartu: Arteriak bihotzetik irtetzen diren odol hodiak dira.
  - **F** `w10/1/p26/s2` Zainak, aldiz, kontrakoa, odola bihotzera eramaten duten odol hodiak dira.

5. «Biek eraman dezakete odol oxigenatua edo oxigeno gabea. Adibidez, zilborreko zainek odol oxigenatua dakarte.»
  _t=0.3 · caution · argi: zilbor-zainak_
  - Ez dut ulertu: «Arteria edo zaina izatea norabideak erabakitzen du, ez oxigenoak: bihotzetik irten ala bihotzera etorri.»
  - **F** `w10/1/p26/s3` Bi odol hodi mota hauek oxigenaturik dagoen odola edo oxigeno gabeko odola eraman dezakete.
  - **F** `w10/1/p23/s2` Hasieran 3 zain mota: zilborrekoak (2 dira, karenatik bueltatzen dira, eta odol oxigenatua garraiatzen dute), bitelinoak (2 dira, bitelo zakutik itzuli eta odol ez-oxigenatua garraiatzen dute), eta kardinal komunak (2 dira, eta alde zefalikotik zein alde kaudaletik itzultzen diren zainak (aurreko eta atzeko kardinalak direnak) elkartzen direnean sortzen dira).

6. «Kardinal komunek enbrioiaren alde zefalikoko eta behe aldeko odola biltzen dute: oxigeno gutxikoa.»
  _t=0.38 · argi: bena-kardinal-komuna, zain-sinua · arbelean: zt-kardinal_
  - Ez dut ulertu: «Kardinal komunek enbrioiaren gorputzeko odola biltzen dute, oxigeno gutxirekin.»
  - **F** `w10/1/p29/s1` ●Zain kardinal komunak: bihotz hodiaren beheko atalera iristen da.
  - **F** `w10/1/p29/s3` Enbrioiaren alde zefalikoko oxigeno gutxiko odola eta enbrioiaren behe aldeko oxigeno gutxiko odola hartzen ditu, beraz, bihotzeraino iristen den odola, oxigeno gutxikoa da.

7. «Zain bitelinoek ere oxigeno gutxiko odola dakarte, bitelo zakutik hodiaren beheko ataleraino.»
  _t=0.48 · argi: bitelo-zainak, bitelo-zaku-sekundarioa · arbelean: zt-bitelo_
  - Ez dut ulertu: «Zain bitelinoek bitelo zakuko odola dakarte, hau ere oxigeno gutxirekin.»
  - **F** `w10/1/p23/s2` Hasieran 3 zain mota: zilborrekoak (2 dira, karenatik bueltatzen dira, eta odol oxigenatua garraiatzen dute), bitelinoak (2 dira, bitelo zakutik itzuli eta odol ez-oxigenatua garraiatzen dute), eta kardinal komunak (2 dira, eta alde zefalikotik zein alde kaudaletik itzultzen diren zainak (aurreko eta atzeko kardinalak direnak) elkartzen direnean sortzen dira).
  - **F** `w10/1/p30/s1` ●Zain bitelinoak: oxigeno gutxiko odola eraman.
  - g `w10/1/p30/s2` Bihotz hodiaren beheko ataleraino iritsi.

8. «Zilborreko zainak, berriz, karenatik datoz; horregatik, odol oxigenatua dute.»
  _t=0.57 · why · argi: zilbor-zainak, karena · arbelean: zt-zilbor_
  - Ez dut ulertu: «Zilborreko zainek, berriz, karenako odola dakarte: oxigenoz betea.»
  - **F** `w10/1/p31/s1` ● Zilborestearen zainak: karenatik datorrenez, odol oxigenatua dute.

9. «Arku aortikoek odol oxigenatua burura eta aorta dortsaletara daramate; aorta dortsalek, gorputzeko beste atal guztietara.»
  _t=0.74 · argi: aorta-arkuak, aorta-dortsalak_
  - Ez dut ulertu: «Aorta arkuek odola burura eramaten dute, eta aorta dortsalek gorputz osora.»
  - **F** `w10/1/p33/s1` ● Arku aortikoak: odol oxigenatua bihotzetik ateratzen du, burura eta aorta dortsaletara.
  - **F** `w10/1/p34/s1` ● Aorta dortsalak: odol oxigenatua (gero eta oxigeno gutxiagorekin), gorputzaren beste atal guztietara eramaten du.

10. «Azkenik, bitelo arteriek eta zilborreko arteriek oxigenorik gabeko odola karenara eramaten dute, oxigenoa eta makromolekulak har ditzan.»
  _t=0.8 · emphasis · argi: bitelo-arteriak, zilbor-arteriak, karena_
  - Ez dut ulertu: «Bitelo eta zilborreko arteriek oxigenorik gabeko odola karenara itzultzen dute, berriz oxigenatzeko.»
  - **F** `w10/1/p35/s1` ● Bitelo arteriak eta zilborreko arteriak: jadanik oxigenorik ez daukan odola gorputzetik karenara eramaten du, bertan oxigenoa eta makromolekulak har ditzan.

11. «Zain eta arteria hauek bikoitiak dira, eta zainen odola bihotzean nahasten da, atrio primitiboan.»
  _t=0.87 · emphasis · argi: atal-aurikularra_
  - Ez dut ulertu: «Zain guztien odola bihotzaren sarreran elkartu eta nahasten da, atal aurikularrean.»
  - **F** `w10/1/p36/s1` Bi motatako odolak (zain kardinal komuneko odol oxigenatu gabea eta bitelo benatik datorren odol oxigenatu gabea) bihotzean (atrio primitiboan) nahasten dira.
  - **F** `w10/1/p36/s2` Zain eta arteria mota hauek bikoitiak dira (ezker-eskuin kokatzen dira).

- Arbela `b-arteria-zaina`: Arteria: bihotzetik irten. Zaina: bihotzera. Biek eraman dezakete odol oxigenatua edo oxigeno gabea
  - **F** `w10/1/p26/s1` Kontuan hartu: Arteriak bihotzetik irtetzen diren odol hodiak dira.
  - **F** `w10/1/p26/s2` Zainak, aldiz, kontrakoa, odola bihotzera eramaten duten odol hodiak dira.
  - **F** `w10/1/p26/s3` Bi odol hodi mota hauek oxigenaturik dagoen odola edo oxigeno gabeko odola eraman dezakete.
- Taula `zt-zilbor`: Zilborreko zainak → Karenatik → Oxigenatua
  - **F** `w10/1/p23/s2` Hasieran 3 zain mota: zilborrekoak (2 dira, karenatik bueltatzen dira, eta odol oxigenatua garraiatzen dute), bitelinoak (2 dira, bitelo zakutik itzuli eta odol ez-oxigenatua garraiatzen dute), eta kardinal komunak (2 dira, eta alde zefalikotik zein alde kaudaletik itzultzen diren zainak (aurreko eta atzeko kardinalak direnak) elkartzen direnean sortzen dira).
  - **F** `w10/1/p31/s1` ● Zilborestearen zainak: karenatik datorrenez, odol oxigenatua dute.
- Taula `zt-bitelo`: Zain bitelinoak → Bitelo zakutik → Oxigeno gutxikoa
  - **F** `w10/1/p23/s2` Hasieran 3 zain mota: zilborrekoak (2 dira, karenatik bueltatzen dira, eta odol oxigenatua garraiatzen dute), bitelinoak (2 dira, bitelo zakutik itzuli eta odol ez-oxigenatua garraiatzen dute), eta kardinal komunak (2 dira, eta alde zefalikotik zein alde kaudaletik itzultzen diren zainak (aurreko eta atzeko kardinalak direnak) elkartzen direnean sortzen dira).
  - **F** `w10/1/p30/s1` ●Zain bitelinoak: oxigeno gutxiko odola eraman.
- Taula `zt-kardinal`: Kardinal komunak → Aurreko eta atzeko kardinaletatik → Oxigeno gutxikoa
  - **F** `w10/1/p23/s2` Hasieran 3 zain mota: zilborrekoak (2 dira, karenatik bueltatzen dira, eta odol oxigenatua garraiatzen dute), bitelinoak (2 dira, bitelo zakutik itzuli eta odol ez-oxigenatua garraiatzen dute), eta kardinal komunak (2 dira, eta alde zefalikotik zein alde kaudaletik itzultzen diren zainak (aurreko eta atzeko kardinalak direnak) elkartzen direnean sortzen dira).
  - **F** `w10/1/p29/s3` Enbrioiaren alde zefalikoko oxigeno gutxiko odola eta enbrioiaren behe aldeko oxigeno gutxiko odola hartzen ditu, beraz, bihotzeraino iristen den odola, oxigeno gutxikoa da.
- Galdera (contrast): Zilborreko zainak eta zain bitelinoak: zein da haien arteko aldea?
- Galdera (order): Ordenatu odolaren irteera bidea, bihotzetik gorputzetik kanpora arte.

## 4. Hodiaren atalak

Etapa: `bihotz-atalak` · 8 lerro · ~61 s hitz eginda

1. «Gogoratu: goiko muturra arteria muturra da, eta beheko muturra zain muturra; hodi osoa perikardio barrunbean dago.»
  _t=0 · recall · argi: arteria-muturra, zain-muturra, perikardio-barrunbea_
  - Ez dut ulertu: «Gogoratu: goiko muturretik odola irteten da, behekotik sartzen da, eta hodi osoa perikardio barrunbean dago.»
  - **F** `w10/2/p3/s1` Bihotz hodiaren goiko aldean duen muturra, arteria muturra deitzen da, bertatik irtetzen da bihotz hodiaren odola, eta arku aortikoen bitartez odola pasatzen da aorta dortsaletara.
  - g `w10/2/p3/s2` Alde kaudala zain muturra da eta bertara heltzen da zainetatik datorren odola.
  - g `w10/2/p3/s3` Badakigu bihotz hodia perikardio barruan sartuta dagoela.

2. «21. egunean, bihotz hodian estuguneak eta zabalkuntzak agertzen dira, eta atal desberdinak eratzen dira goitik behera.»
  _t=0.13 · emphasis · argi: bihotz-hodia · arbelean: b-21_
  - Ez dut ulertu: «21. egunean hodia ez da berdina: zati estuagoak eta zabalagoak agertzen dira.»
  - **F** `w10/2/p3/s4` Garapenaren 21. egunean, bihotz hodian estuguneak eta hertsadurak (zabalkuntzak) agertzen dira eta atal desberdinak eratzen dira goitik behera hedatzen den bihotz hodi honetan.

3. «Goiko atala atal bulbarra da, arteria bulboa; haren muturrean aorta zakua dago.»
  _t=0.27 · argi: atal-bulbarra, aorta-zakua_
  - Ez dut ulertu: «Goiko zatia atal bulbarra da, eta haren puntan aorta zakua dago.»
  - **F** `w10/2/p5/s1` ● Atal bulbarra (Arteria bulboa): goiko atala (alde zefalikoa).
  - g `w10/2/p5/s4` Honen muturrean ARTERIA ZAKUA/ Aorta zakua (irudian beltzez) dago.

4. «Ondoren atal bentrikularra eta atal aurikularra datoz. Fusioa zefalikotik kaudalera doanez, atal aurikularra oraindik bikoitza da.»
  _t=0.4 · why · argi: atal-bentrikularra, atal-aurikularra_
  - Ez dut ulertu: «Gero atal bentrikularra eta atal aurikularra. Hodiak goitik behera elkartzen direnez, atal aurikularra oraindik bikoitza da.»
  - **F** `w10/2/p4/s1` Bi alboko endokardio hodiak fusionatzen dira (alde zefalikoan hasi eta alde kaudalera arte) bihotz hodi bakarra sortzeko.
  - **F** `w10/2/p6/s1` ● Atal bentrikularra: jarraia da aurreko eta hurrengo atalekin.
  - **F** `w10/2/p7/s1` ● Atal aurikularra: jarraia da aurreko eta hurrengo atalekin.
  - **F** `w10/2/p7/s3` Hasieran bikoitza da, baina gero fusionatu egingo dira.

5. «Azkena, zain sinuak: bilateralak eta bikoitzak. Enbrioiaren ezker eta eskuineko zainak bertan amaitzen dira.»
  _t=0.53 · argi: zain-sinua, zilbor-zainak, bitelo-zainak, bena-kardinal-komuna_
  - Ez dut ulertu: «Azkena, zain sinuak, bat alde bakoitzean: hara iristen dira enbrioiaren zain guztiak.»
  - **F** `w10/2/p8/s1` ● Atal zain-sinuak (bilaterala eta bikoitza): ezker eta eskuineko zainak hemen amaitzen dira.

6. «Atal bulbarra eta atal bentrikularra perikardio barrunbean daude; atal aurikularrak eta zain sinuak, kanpoan, septum transversumean.»
  _t=0.66 · emphasis · argi: atal-bulbarra, atal-bentrikularra, perikardio-barrunbea, atal-aurikularra, zain-sinua, septum-transversum · arbelean: b-non_
  - Ez dut ulertu: «Atal bulbarra eta atal bentrikularra barrunbearen barruan daude; atal aurikularrak eta zain sinuak, kanpoan, septum transversumean.»
  - **F** `w10/2/p9/s1` Atal bulbarra eta bentrikularra (Izendatzeko erabili ODOL HODIAREN atal aurikularra eta bentrikularra, ez bakarrik aurikula/bentrikulua) perikardio barrunbean kokatzen dira.
  - **F** `w10/2/p9/s2` Bikoitzak diren aurikulak eta zain sinuak perikardio barrunbe kanpoan dagoen septum transversumean kokatzen dira, enbrioiaren lepo mailan gutxi gorabehera.

7. «Kontuz izenekin: esan odol hodiaren atal aurikularra eta atal bentrikularra, ez aurikula edo bentrikulua bakarrik.»
  _t=0.66 · caution · argi: atal-aurikularra, atal-bentrikularra_
  - Ez dut ulertu: «Kontuz: atal aurikularra eta atal bentrikularra hodiaren zatiak dira, ez oraindik benetako aurikula eta bentrikuluak.»
  - **F** `w10/2/p9/s1` Atal bulbarra eta bentrikularra (Izendatzeko erabili ODOL HODIAREN atal aurikularra eta bentrikularra, ez bakarrik aurikula/bentrikulua) perikardio barrunbean kokatzen dira.

8. «Odolaren bidea, beraz: zainak, zain sinuak, atal aurikularra, atal bentrikularra eta atal bulbarra.»
  _t=0.8 · emphasis · argi: zain-sinua, atal-aurikularra, atal-bentrikularra, atal-bulbarra · arbelean: b-bidea_
  - Ez dut ulertu: «Odolaren bidea: zain sinua, gero atal aurikularra, atal bentrikularra eta azkenik atal bulbarra.»
  - **F** `w10/2/p10/s1` Odolaren bidea: Zainak → Zain sinuak → Atal aurikularra → Atal bentrikularra → Atal bulbarra.

- Arbela `b-21`: 21. eguna: estuguneak eta zabalkuntzak; atalak goitik behera
  - **F** `w10/2/p3/s4` Garapenaren 21. egunean, bihotz hodian estuguneak eta hertsadurak (zabalkuntzak) agertzen dira eta atal desberdinak eratzen dira goitik behera hedatzen den bihotz hodi honetan.
- Arbela `b-non`: Perikardio barrunbean: atal bulbarra eta bentrikularra. Septum transversumean: aurikulak eta zain sinuak
  - **F** `w10/2/p9/s1` Atal bulbarra eta bentrikularra (Izendatzeko erabili ODOL HODIAREN atal aurikularra eta bentrikularra, ez bakarrik aurikula/bentrikulua) perikardio barrunbean kokatzen dira.
  - **F** `w10/2/p9/s2` Bikoitzak diren aurikulak eta zain sinuak perikardio barrunbe kanpoan dagoen septum transversumean kokatzen dira, enbrioiaren lepo mailan gutxi gorabehera.
- Arbela `b-bidea`: Odolaren bidea: zainak, zain sinuak, atal aurikularra, atal bentrikularra, atal bulbarra
  - **F** `w10/2/p10/s1` Odolaren bidea: Zainak → Zain sinuak → Atal aurikularra → Atal bentrikularra → Atal bulbarra.
- Galdera (order): Ordenatu odolaren bidea bihotz hodian, sartzen denetik irteten den arte.

## 5. Lakioa

Etapa: `bihotz-lakioa` · 11 lerro · ~72 s hitz eginda

1. «23. egunean, bihotz hodi luze eta zuzena tolesten hasten da: lakio bat sortuko du.»
  _t=0 · argi: bihotz-hodia_
  - Ez dut ulertu: «23. egunean hodi zuzena tolesten hasten da, eta lakio bat egiten du.»
  - **F** `w10/2/p12/s1` Garapenaren 23. egunean luzea eta zuzena den bihotz hodia tolesten hasten da, bihotz lakio bat sortzeko.

2. «Alde zefalikoa, arteria bulboa, aurrera, behera eta eskuinera abiatzen da.»
  _t=0.12 · emphasis · argi: atal-bulbarra · arbelean: b-lakio-goi_
  - Ez dut ulertu: «Hodiaren goiko aldea, bulboa, aurrera, behera eta eskuinera doa.»
  - **F** `w10/2/p13/s1` ●​ Alde zefalikoa (arteria bulboa): aurrera, behera eta eskuinera abiatzen da.

3. «Alde kaudala, zain sinua eta aurikula, kontrakoa: atzera, gora eta ezkerrera.»
  _t=0.26 · emphasis · argi: atal-aurikularra, zain-sinua · arbelean: b-lakio-behe_
  - Ez dut ulertu: «Hodiaren goiko aldea aurrera eta behera doa; behekoa, atzera eta gora: bata bestearen kontra.»
  - **F** `w10/2/p13/s1` ●​ Alde zefalikoa (arteria bulboa): aurrera, behera eta eskuinera abiatzen da.
  - **F** `w10/2/p14/s1` ●​ Alde kaudala (zain sinua eta aurikula): atzera, gora eta ezkerrera abiatuko da.

4. «Atalez atal: atal bulbobentrikularra aurrera, behera eta eskuinera; atal bentrikularra, ezkerrera.»
  _t=0.4 · argi: atal-bulbobentrikularra, atal-bentrikularra_
  - Ez dut ulertu: «Hau da: atal bulbobentrikularra aurrera, behera eta eskuinera; atal bentrikularra, ezkerrera.»
  - **F** `w10/2/p16/s1` ● Atal bulbarra/bulbobentrikularra (atal bulbarra eta bentrikularra): aurrera, behera eta eskuinera abiatzen da.
  - **F** `w10/2/p17/s1` ● Atal bentrikularra (atal bulbarraren jarraipena): ezkerrera

5. «Atal aurikularrak kontrakoa: ezkerrera, atzera eta gora. Bulboaren goi atzekaldean geratzen dira, zain sinuekin.»
  _t=0.4 · emphasis · argi: atal-aurikularra, zain-sinua, atal-bulbarra_
  - Ez dut ulertu: «Atal aurikularrak alderantziz doaz: ezkerrera, atzera eta gora, bulboaren gainean eta atzean geratu arte.»
  - **F** `w10/2/p18/s1` ● Atal aurikularrak (bentrikularraren jarraipena) (beheko atalak) kontrako mugimendua egiten dute: ezkerrera, atzera eta gora, beraz atal bulbarraren goi atzekaldean gelditu.
  - **F** `w10/2/p19/s1` ● Zain sinuak (aurikularen jarraipena): hor enbrioiaren zainak kokatu.

6. «Tolestu ahala, bikoitzak diren egiturak fusionatzen dira, eta egitura komunak bilakatzen dira: bihotz lakioa.»
  _t=0.58 · argi: atal-aurikularra, zain-sinua, bihotz-lakioa_
  - Ez dut ulertu: «Tolestean, bikoitzak ziren zatiak elkartzen dira: hala sortzen da bihotz lakioa.»
  - **F** `w10/2/p20/s1` Zuzena den bihotz hodia tolesten hasten da, tolespen hau ematen den heinean, bikoitzak diren egiturak fusionatzen dira, eta egitura komunak bilakatzen dira.
  - g `w10/2/p20/s2` Honela, bihotz lakio bat sortzen da.

7. «Kontuan hartu: bihotza aurretik begiratzen dugu, beraz eskuma eta ezkerra alderantziz daude.»
  _t=0.7 · caution · argi: atal-bulbarra · arbelean: b-aurretik_
  - Ez dut ulertu: «Enbrioiaren eskuina zure ezkerrean dago: bulboa eskuinera doa, baina pantailan ezkerrera.»
  - **F** `w10/2/p20/s4` Kontuan hartu bihotza aurretik begiratzen gaudela irudian: eskuma eta ezkerra alderantziz daude.

8. «28. egunean, atal bulbarra lakioaren aurre eskuinaldean dago, eta atal bentrikularra ezkerrean.»
  _t=0.8 · argi: atal-bulbarra, atal-bentrikularra_
  - Ez dut ulertu: «28. egunean, atal bulbarra aurrean eta eskuinean dago, eta atal bentrikularra ezkerrean.»
  - g `w10/2/p21/s1` 28. egunerako prozesu hau amaitu egiten da.
  - **F** `w10/2/p21/s2` Hurrengo irudian ikusten den moduan, hasieran alde zefalikoan dagoen atal bulbarra (arteria bulboa, behera eta eskuinera jaisten da) bihotz lakioaren aurre eskuinaldean kokatzen da, eta berarekin jarraia den atal bentrikularra (ezkerrean) ezkerrean kokatzen da, eta hau erreten aurikulubentrikularraren (zuloa) bitartez jarraia da goi-atzekaldean gelditu den atal aurikularrarekin (goi atzekaldean).

9. «Atal bentrikularra goi atzekaldeko atal aurikularrarekin jarraia da, erreten aurikulubentrikularraren bidez.»
  _t=0.8 · argi: atal-bentrikularra, erreten-aurikulubentrikularra, atal-aurikularra_
  - Ez dut ulertu: «Atal bentrikularra goian eta atzean dagoen atal aurikularrarekin lotuta dago, erreten aurikulubentrikularraren bidez.»
  - **F** `w10/2/p21/s2` Hurrengo irudian ikusten den moduan, hasieran alde zefalikoan dagoen atal bulbarra (arteria bulboa, behera eta eskuinera jaisten da) bihotz lakioaren aurre eskuinaldean kokatzen da, eta berarekin jarraia den atal bentrikularra (ezkerrean) ezkerrean kokatzen da, eta hau erreten aurikulubentrikularraren (zuloa) bitartez jarraia da goi-atzekaldean gelditu den atal aurikularrarekin (goi atzekaldean).

10. «Atal guztiak jarraiak dira oraindik: ez da trenkadarik agertu.»
  _t=0.8 · emphasis · argi: atal-bulbarra, atal-bentrikularra, atal-aurikularra, zain-sinua · arbelean: b-28_
  - Ez dut ulertu: «Oraindik hodi bakarra da: barruan ez dago hormarik.»
  - **F** `w10/2/p21/s4` Beraz, bihotz lakio honetako atalak jarraiak dira bata bestearekin, oraindik ez da trenkadarik agertu.

11. «Begiratu orain bihotza aurretik ikusita: hasierako hodi zuzena eta lakioa, bata bestearen gainean.»
  _t=0.92 · argi: bihotz-lakioa_
  - Ez dut ulertu: «Begiratu: hasierako hodi zuzena eta lakioa, bata bestearen gainean, aurretik ikusita.»
  - **F** `w10/2/p22/s1` Bihotza aurretik ikusita

- Arbela `b-lakio-goi`: Alde zefalikoa (bulboa): aurrera, behera, eskuinera
  - **F** `w10/2/p13/s1` ●​ Alde zefalikoa (arteria bulboa): aurrera, behera eta eskuinera abiatzen da.
- Arbela `b-lakio-behe`: Alde kaudala (zain sinua, aurikula): atzera, gora, ezkerrera
  - **F** `w10/2/p14/s1` ●​ Alde kaudala (zain sinua eta aurikula): atzera, gora eta ezkerrera abiatuko da.
- Arbela `b-aurretik`: Aurretik ikusita: eskuma eta ezkerra alderantziz
  - **F** `w10/2/p20/s4` Kontuan hartu bihotza aurretik begiratzen gaudela irudian: eskuma eta ezkerra alderantziz daude.
- Arbela `b-28`: 28. eguna: bulbarra aurre-eskuinean, bentrikularra ezkerrean, aurikularra goi-atzean; trenkadarik ez
  - g `w10/2/p21/s1` 28. egunerako prozesu hau amaitu egiten da.
  - **F** `w10/2/p21/s2` Hurrengo irudian ikusten den moduan, hasieran alde zefalikoan dagoen atal bulbarra (arteria bulboa, behera eta eskuinera jaisten da) bihotz lakioaren aurre eskuinaldean kokatzen da, eta berarekin jarraia den atal bentrikularra (ezkerrean) ezkerrean kokatzen da, eta hau erreten aurikulubentrikularraren (zuloa) bitartez jarraia da goi-atzekaldean gelditu den atal aurikularrarekin (goi atzekaldean).
  - **F** `w10/2/p21/s4` Beraz, bihotz lakio honetako atalak jarraiak dira bata bestearekin, oraindik ez da trenkadarik agertu.
- Galdera (predict): Zer uste duzu: tolestean, nora mugituko da hodiaren goiko muturra, arteria bulboa?
- Galdera (pool): mikro:10/bihotz-lakioa:6

## 6. Atal bulbarra

Etapa: `atal-bulbarra` · 8 lerro · ~56 s hitz eginda

1. «Arteria bulboaren urrutiko zatia aorta zakua da; hortik, odola aorta arkuen bidez atzekaldeko aorta dortsaletara heltzen da.»
  _t=0 · argi: aorta-zakua, atal-bulbarra, aorta-arkuak, aorta-dortsalak_
  - Ez dut ulertu: «Bulboaren puntan aorta zakua dago; hortik odola aorta arkuetatik aorta dortsaletara doa.»
  - **F** `w10/3.1/p3/s1` Arteria bulbo honetako urrutiko zatia arteria edo aorta zakua da, eta hau komunikatuta dago ezkerrean eta eskubian kokatuta dauden aorta dortsalekin, komunikazio ezberdinen bidez.
  - g `w10/3.1/p3/s2` Komunikazio horiek aorta arkuak izenekoak dira eta hauek tolesdura zefalokaudalean agertzen dira (Diskoak tolespen zefalokaudala egiten duen bitartean aorta dortsaletatik komunikazio ezberdinak agertzen dira).
  - **F** `w10/3.1/p3/s4` Beraz, bihotz lakio honetako arteria muturretik ateratzen den odola komunikazio hauen bidez (aorta arkuak) atzekaldean dauden aorta dortsaletara helduko da.

2. «Arteria bulboan hiru azpiatal bereizten dira: hurbileko atala, arteria konoa eta enbor arteriosoa.»
  _t=0.18 · emphasis · argi: atal-bulbarra, bulboaren-hurbileko-atala, arteria-konoa, enbor-arteriosoa_
  - Ez dut ulertu: «Bulboak hiru zati ditu: hurbileko atala, arteria konoa eta enbor arteriosoa.»
  - **F** `w10/3.1/p3/s5` Arteria bulbo honetan hiru azpiatal bereizten dira:

3. «Hurbileko atala zabalena da, eta bere paretako muskulu trenkadetatik eskuineko bentrikuluaren atal trabekulatua sortzen da.»
  _t=0.38 · emphasis · argi: bulboaren-hurbileko-atala, muskulu-trenkadak, hasierako-eskuineko-bentrikulua · arbelean: tz-hurbileko_
  - Ez dut ulertu: «Lehen zatiko muskuluetatik eskuineko bentrikuluaren zati zimurtsua sortzen da.»
  - **F** `w10/3.1/p4/s1` ● Hurbileko ataletik: (zabalena den atala da) Atal zabal honen paretan hasten dira muskuluak agertzen eta muskulu horiek muskulu trenkadak sortzen dituzte.
  - **F** `w10/3.1/p4/s2` Beraz, hemendik behin-betiko bihotzaren eskuineko bentrikuluak duen atal trabekulatua sortzen da (hasierako eskuineko bentrikulua).

4. «Hori izango da eskuineko bentrikuluaren atalik garrantzitsuena, baina ez bakarra.»
  _t=0.38 · argi: hasierako-eskuineko-bentrikulua_
  - Ez dut ulertu: «Eskuineko bentrikuluaren zatirik handiena hortik dator, baina ez osoa.»
  - **F** `w10/3.1/p4/s4` Hori izango da behin betiko eskuineko bentrikuluak izango duen atalik garrantzitsuena, baina ez bakarra.

5. «Kontuz: eskuineko bentrikulu primitiboa atal bulbarretik dator, ez atal bentrikularretik.»
  _t=0.38 · caution · argi: hasierako-eskuineko-bentrikulua, bulboaren-hurbileko-atala, atal-bulbarra_
  - Ez dut ulertu: «Kontuz: eskuineko bentrikulua atal bulbarretik dator, ez atal bentrikularretik.»
  - **F** `w10/3.1/p4/s2` Beraz, hemendik behin-betiko bihotzaren eskuineko bentrikuluak duen atal trabekulatua sortzen da (hasierako eskuineko bentrikulua).

6. «Erdiko atala, arteria konoa, trenkada batek bitan banatzen du: bi bentrikuluen atal lisoak dira, infundibuluak.»
  _t=0.56 · emphasis · argi: arteria-konoa, infundibuluak · arbelean: tz-konoa_
  - Ez dut ulertu: «Erdiko zatia, konoa, bitan banatzen da: bi bentrikuluen irteera leunak, infundibuluak.»
  - **F** `w10/3.1/p5/s1` ● Bitarteko (erdiko) atala edo arteria konoa: bertatik sortzen dira bi (eskuin eta ezkerreko) bentrikuletako atal lisoak edo infundibuluak.
  - **F** `w10/3.1/p5/s3` Arteria konoa trenkadatu egingo da eta espazio horretan trenkada bat agertuko da, espazio hori bitan banatuz.
  - g `w10/3.1/p5/s4` Bi espazio horiek izango dira, hain zuzen ere, bi bentrikuluek dituzten atal lisoak edo infundibuluak.

7. «Urruneko atala, enbor arteriosoa, ere trenkadatu egiten da: hortik birika enborraren eta aortaren sustraiak sortzen dira.»
  _t=0.72 · emphasis · argi: enbor-arteriosoa, birika-enborraren-sustraiak, aortaren-sustraiak · arbelean: tz-enborra_
  - Ez dut ulertu: «Azken zatia, enborra, ere bitan banatzen da: hortik birika enborraren sustraiak eta aortaren sustraiak.»
  - **F** `w10/3.1/p6/s1` ● Urruneko atala edo enbor arteriosoa/arteriala/arteria enborra: Trenkadatzen da eta bertatik sortzen dira bi bentrikuluetatik irteten diren birika arteriaren/ enborraren hasierako zatiak eta sustraiak (eskuineko bentrikuluaren infundibulutik) eta aorta arteriaren hasierako zatiak eta sustraiak (ezkerreko bentrikuluaren infundibulutik).

8. «Laburbilduz: hurbileko atala, eskuineko bentrikulua; konoa, infundibuluak; enborra, sustraiak.»
  _t=0.9 · summary · argi: bulboaren-hurbileko-atala, hasierako-eskuineko-bentrikulua, arteria-konoa, infundibuluak, enbor-arteriosoa, aortaren-sustraiak, birika-enborraren-sustraiak_
  - Ez dut ulertu: «Hiru zati, hiru emaitza: lehenengotik eskuineko bentrikulua, konotik infundibuluak, enborretik sustraiak.»
  - **F** `w10/3.1/p4/s2` Beraz, hemendik behin-betiko bihotzaren eskuineko bentrikuluak duen atal trabekulatua sortzen da (hasierako eskuineko bentrikulua).
  - **F** `w10/3.1/p5/s1` ● Bitarteko (erdiko) atala edo arteria konoa: bertatik sortzen dira bi (eskuin eta ezkerreko) bentrikuletako atal lisoak edo infundibuluak.
  - **F** `w10/3.1/p6/s1` ● Urruneko atala edo enbor arteriosoa/arteriala/arteria enborra: Trenkadatzen da eta bertatik sortzen dira bi bentrikuluetatik irteten diren birika arteriaren/ enborraren hasierako zatiak eta sustraiak (eskuineko bentrikuluaren infundibulutik) eta aorta arteriaren hasierako zatiak eta sustraiak (ezkerreko bentrikuluaren infundibulutik).

- Taula `tz-hurbileko`: Bulboaren hurbileko atala → Eskuineko bentrikuluaren atal trabekulatua
  - **F** `w10/3.1/p4/s2` Beraz, hemendik behin-betiko bihotzaren eskuineko bentrikuluak duen atal trabekulatua sortzen da (hasierako eskuineko bentrikulua).
- Taula `tz-konoa`: Arteria konoa → Bi bentrikuluen infundibuluak (atal lisoak)
  - **F** `w10/3.1/p5/s1` ● Bitarteko (erdiko) atala edo arteria konoa: bertatik sortzen dira bi (eskuin eta ezkerreko) bentrikuletako atal lisoak edo infundibuluak.
- Taula `tz-enborra`: Enbor arteriosoa → Birika enborraren eta aortaren sustraiak
  - **F** `w10/3.1/p6/s1` ● Urruneko atala edo enbor arteriosoa/arteriala/arteria enborra: Trenkadatzen da eta bertatik sortzen dira bi bentrikuluetatik irteten diren birika arteriaren/ enborraren hasierako zatiak eta sustraiak (eskuineko bentrikuluaren infundibulutik) eta aorta arteriaren hasierako zatiak eta sustraiak (ezkerreko bentrikuluaren infundibulutik).
- Taula `tz-bentrikularra`: Atal bentrikularra → Ezkerreko bentrikuluaren atal trabekulatua
  - **F** `w10/3.2/p5/s1` Bihotz hodakiloren atal bentrikularreko paretan, hasierako ezkerreko bentrikulua ere deitua, muskulu trabekuluak garatzen dira, zeinetatik hasierako ezkerreko bentrikuluaren atal trabekulatua sortu egiten da.
- Taula `tz-aurikularra`: Atal aurikularra (hasierako eskuineko aurikula) → Eskuineko aurikularen atal trabekulatua eta belarritxoa
  - **F** `w10/3.4/p14/s7` Beste aldetik, behin-betiko eskuineko aurikularrean atal trabekulatua dago, hasierako eskuineko aurikulatik sortzen dena, behin-betiko eskuineko aurikularen beste atala osatzen du, belarritxo izenez ezaguna (mintz fin bat, oso finak diren muskuluak bertan kokatzen dira, muskulu pektinioak, horregatik eskuineko aurikularen pareta atal trabekulatua dela esaten da).
- Taula `tz-eskuin-luzapena`: Zain sinuaren eskuineko luzapena → Eskuineko aurikularen atzeko atal lisoa
  - **F** `w10/3.4/p15/s1` Beraz, eskuineko aurikulak bi atal guztiz desberdin ditu, atzeko atal lisoa non bukatzen diren zain egitura ezberdinak (atal liso hau zain sinutik sortzen da eta atal handiena da) eta atal trabekulatua (gainerako pareta non muskuluak garatzen diren): aurreko pareta, belarritxoa… (hasierako eskuineko aurikulatik sortzen dira).
  - g `w10/3.4/p22/s1` Behin betiko eskuineko aurikularen atzeko pareta lisoa da sortu delakoz zain sinuaren eskuineko luzapenetik, gainerako pareta sortzen da bihotz lakioaren atal aurikularretik, konkretuki kasu honetan eskuineko hasierako aurikulatik.
- Taula `tz-ezker-luzapena`: Zain sinuaren ezkerreko luzapena → Sinu koronarioa eta ezkerreko aurikularen zain laprana
  - **F** `w10/3.4/p7/s1` Ondorioz, ezkerreko luzapen honetatik bi zain egitura sortzen dira bakarrik: alde batetik, bihotzaren atze ezkerreko partean kokatzen den zain egitura bat, sinu koronarioa, eta bestetik zain sinu horretan bukatzen edo irekitzen den eta ezkerreko aurikulatik itzultzen den ezkerreko aurikularen zain laprana.
- Taula `tz-eskuin-balbula`: Eskuineko zain balbula → Beheko kabaren eta sinu koronarioaren balbulak
  - **F** `w10/3.4/p12/s1` Eskuineko zain balbula bere goiko aldean desagertu egiten da, baina bere beheko aldetik bi balbula berri agertzen dira: beheko bena kabaren balbula eta sinu koronarioaren balbula, egitura hauek sarrera zuloetan dituzten balbulak.
- Taula `tz-ezker-balbula`: Ezkerreko zain balbula → Septum secundumarekin fusionatzen da
  - **F** `w10/3.4/p11/s1` Horrez gain, garapena aurrera doan heinean, honako trenkada hau (septum spurium), ezkerreko zain balbularekin batera, momentu horretan garatzen ari den bi aurikula artean agertzen den aurikularteko trenkadarekin fusionatuko da, trenkada hori Septum secundum da zehazki.
- Galdera (contrast): Arteria konoa eta enbor arteriosoa: zer sortzen da bakoitzetik?

## 7. Bentrikuluak eta aurikulak

Etapa: `atal-bentrikularra` · 8 lerro · ~61 s hitz eginda

1. «Atal bentrikularraren paretan ere muskulu trenkadak sortzen dira: hortik ezkerreko bentrikuluaren atal trabekulatua, hasierako ezkerreko bentrikulua.»
  _t=0 · emphasis · argi: hasierako-ezkerreko-bentrikulua, muskulu-trenkadak · arbelean: tz-bentrikularra_
  - Ez dut ulertu: «Atal bentrikularreko muskuluetatik ezkerreko bentrikuluaren zati zimurtsua sortzen da.»
  - **F** `w10/3.2/p3/s1` Atal bentrikularreko paretan muskuluak garatzen hasten dira eta hortik muskulu trenkadak sortzen dira.
  - g `w10/3.2/p3/s2` Horrela, hasierako ezkerreko bentrikuluaren atal trabekulatua sortzen da, hau da, hasierako ezkerreko bentrikulua.
  - **F** `w10/3.2/p5/s1` Bihotz hodakiloren atal bentrikularreko paretan, hasierako ezkerreko bentrikulua ere deitua, muskulu trabekuluak garatzen dira, zeinetatik hasierako ezkerreko bentrikuluaren atal trabekulatua sortu egiten da.

2. «Beraz, bi hasierako bentrikuluak jatorri desberdinekoak dira: eskumakoa bulbotik, ezkerrekoa atal bentrikularretik.»
  _t=0.36 · emphasis · argi: hasierako-eskuineko-bentrikulua, hasierako-ezkerreko-bentrikulua_
  - Ez dut ulertu: «Eskuineko bentrikuluaren atal trabekulatua bulboaren hurbileko ataletik dator; ezkerrekoarena, atal bentrikularretik.»
  - **F** `w10/3.2/p4/s1` Bi hasierako bentrikulu hauek (atal bulbarraren hurbileko atala=hasierako eskumako bentrikulua eta atal bentrikularretik sortzen den hasierako ezkerreko bentrikulua) komunikatuta daude bentrikulu arteko zulo primarioaren bitartez.

3. «Bi bentrikulu horiek bentrikulu arteko zulo primarioaren bidez komunikatuta daude.»
  _t=0.36 · argi: bentrikulu-arteko-zulo-primarioa · arbelean: b-zuloa_
  - Ez dut ulertu: «Bi bentrikulu horiek zulo baten bidez lotuta daude: bentrikulu arteko zulo primarioa.»
  - **F** `w10/3.2/p4/s1` Bi hasierako bentrikulu hauek (atal bulbarraren hurbileko atala=hasierako eskumako bentrikulua eta atal bentrikularretik sortzen den hasierako ezkerreko bentrikulua) komunikatuta daude bentrikulu arteko zulo primarioaren bitartez.

4. «Atal bentrikularra goi atzekaldeko atal aurikular komunarekin komunikatuta dago, erreten aurikulubentrikularraren bidez.»
  _t=0.66 · argi: atal-bentrikularra, atal-aurikularra, erreten-aurikulubentrikularra_
  - Ez dut ulertu: «Atal bentrikularra goian eta atzean dagoen atal aurikularrarekin lotuta dago, erreten aurikulubentrikularraren bidez.»
  - **F** `w10/3.2/p6/s1` Bihotz lakioaren atal bentrikularra komunikatuta dago goi-atzekaldean gelditu den bihotz lakioaren atal aurikularrarekin (komuna dena) erreten/hodi aurikulubentrikularraren bitartez.

5. «Lakioa eratzean, enbor arteriosoa barrunbe perikardikoaren eskuinean dago; gero, erdira mugitzen da.»
  _etapa atal-aurikularra · t=0 · argi: enbor-arteriosoa, perikardio-barrunbea_
  - Ez dut ulertu: «Lakioa egitean enbor arteriosoa eskuinean dago; gero erdira mugitzen da.»
  - **F** `w10/3.3/p3/s1` Hasieran bihotz lakioa eratu bitartean atal bulbarraren arteria enborra kokatzen da barrunbe perikardikoaren eskuineko aldean, eta garapenean, erdira abiatzen da (Alde medialera mugitzen da).

6. «Aldi berean, aurikula komunean bi alboko zabalkuntza agertzen dira: hasierako eskuineko eta ezkerreko aurikulak.»
  _t=0.26 · emphasis · argi: atal-aurikularra, hasierako-eskuineko-aurikula, hasierako-ezkerreko-aurikula · arbelean: b-aurikulak_
  - Ez dut ulertu: «Enborra erdira doan bitartean, aurikula komuna bi aldeetara zabaltzen da: eskuinera eta ezkerrera.»
  - **F** `w10/3.3/p3/s1` Hasieran bihotz lakioa eratu bitartean atal bulbarraren arteria enborra kokatzen da barrunbe perikardikoaren eskuineko aldean, eta garapenean, erdira abiatzen da (Alde medialera mugitzen da).
  - **F** `w10/3.3/p3/s2` Hasieran batean, atal aurikularrean aurikula komuna dago, baina mugimendu honekin batera, komuna den aurikulan bi alboko zabalkuntza agertuko dira: hasierako eskuineko aurikula eta hasierako ezkerreko aurikula.

7. «Orain atalak plano ezberdinetan daude: bentrikuluak aurre eskuinaldean, aurikulak goi atzekaldean.»
  _t=0.5 · emphasis · argi: atal-bentrikularra, atal-aurikularra · arbelean: b-planoak_
  - Ez dut ulertu: «Orain atalak ez daude lerro berean: bentrikuluak aurrean eta eskuinean, aurikulak goian eta atzean.»
  - **F** `w10/3.3/p3/s3` Bihotzaren atal ezberdinak plano ezberdinean daude: bentrikuluak aurre eskuinaldean eta aurikulak goi atzekaldean.

8. «Gogoratu: atzekaldean, aurikulak zain sinuarekin komunikatuta daude, eta hortaz zain guztiekin.»
  _t=0.74 · recall · argi: atal-aurikularra, zain-sinua_
  - Ez dut ulertu: «Atzean, aurikulak zain sinura irekita daude: horregatik iristen da hara zain guztien odola.»
  - **F** `w10/3.3/p3/s4` Gogoratu atzekaldean komunikatuta mantentzen direla zain sinuarekin, eta hortaz zain guztiekin.

- Arbela `b-zuloa`: Bi bentrikulu primitiboak: bentrikulu arteko zulo primarioaren bidez komunikatuta
  - **F** `w10/3.2/p4/s1` Bi hasierako bentrikulu hauek (atal bulbarraren hurbileko atala=hasierako eskumako bentrikulua eta atal bentrikularretik sortzen den hasierako ezkerreko bentrikulua) komunikatuta daude bentrikulu arteko zulo primarioaren bitartez.
- Arbela `b-aurikulak`: Enbor arteriosoa erdira; aurikula komunean bi zabalkuntza: hasierako eskuineko eta ezkerreko aurikulak
  - **F** `w10/3.3/p3/s1` Hasieran bihotz lakioa eratu bitartean atal bulbarraren arteria enborra kokatzen da barrunbe perikardikoaren eskuineko aldean, eta garapenean, erdira abiatzen da (Alde medialera mugitzen da).
  - **F** `w10/3.3/p3/s2` Hasieran batean, atal aurikularrean aurikula komuna dago, baina mugimendu honekin batera, komuna den aurikulan bi alboko zabalkuntza agertuko dira: hasierako eskuineko aurikula eta hasierako ezkerreko aurikula.
- Arbela `b-planoak`: Bentrikuluak aurre-eskuinaldean, aurikulak goi-atzekaldean
  - **F** `w10/3.3/p3/s3` Bihotzaren atal ezberdinak plano ezberdinean daude: bentrikuluak aurre eskuinaldean eta aurikulak goi atzekaldean.
- Galdera (contrast): Bi bentrikuluen atal trabekulatuak: nondik dator bakoitza?
- Galdera (zer-da-hau)

## 8. Zain sinua

Etapa: `zain-sinua` · 11 lerro · ~81 s hitz eginda

1. «Kontuz! Hau atzetik ikusita dago: hemen eskuina eta ezkerra ez dira alderantzizkatu behar.»
  _t=0 · caution · argi: eskuineko-sinu-luzapena, ezkerreko-sinu-luzapena · arbelean: b-atzetik_
  - Ez dut ulertu: «Orain bihotzaren atzean gaude: enbrioiaren eskuina zure eskuinean dago, eta ezkerra zure ezkerrean.»
  - **F** `w10/3.4/p3/s1` Ezkerraldea Eskumaldea
  - **F** `w10/3.4/p4/s1` KONTUZ!
  - **F** `w10/3.4/p4/s2` Atzetik ikusita dago, orduan, eskuina eta ezkerra ez dira alderantzizkatu behar Goi ezkerraldeko irudia (zurixka atala) aurikula komunaren espazioa da, komunikaturik dago zain sinuarekin.

2. «4. astean, zain sinuan zeharkako atala eta ezkerreko eta eskuineko luzapenak bereizten dira.»
  _t=0 · argi: zain-sinua, zain-sinuaren-zeharkako-atala, eskuineko-sinu-luzapena, ezkerreko-sinu-luzapena_
  - Ez dut ulertu: «Laugarren astean zain sinuak hiru zati ditu: zeharkako atala eta bi luzapen, eskuinekoa eta ezkerrekoa.»
  - **F** `w10/3.4/p4/s3` Garapenaren 4.astean zain-sinuan (kolorezko atala) bereizten dira zeharkako atala eta ezkerreko eta eskubiko luzapenak.

3. «Luzapen bakoitzean enbrioiaren alde horretako 3 zainak bukatzen dira: bitelinoa, zilborrekoa eta kardinala.»
  _t=0 · argi: bitelo-zainak, zilbor-zainak, bena-kardinal-komuna_
  - Ez dut ulertu: «Luzapen bakoitzera alde horretako 3 zainak iristen dira.»
  - **F** `w10/3.4/p4/s4` Ezkerreko eta eskumako luzapen horietan bukatzen dira enbrioiaren ezkerreko eta eskuineko zainak, hasiera batean 3 direnak (zain bitelinoak, zilborreko zainak eta kardinalak).

4. «Hortik odola zain sinura heltzen da, eta zulo sinoaurikularretik atal aurikularrera pasatzen da; hasieran zulo hori oso zabala da.»
  _t=0.16 · argi: zain-sinua, zulo-sinoaurikularra_
  - Ez dut ulertu: «Zain sinutik odola zulo handi batetik pasatzen da atal aurikularrera: zulo sinoaurikularra.»
  - **F** `w10/3.4/p4/s5` Bi luzapen edo adar horien bidez odola heltzen da zain sinura eta daukan zuloaren bidez odola pasatzen da atal aurikularrera.
  - **F** `w10/3.4/p4/s7` Zainaren eta aurikularen arteko komunikazioa, hau da, zati zuria eta urdinaren arteko komunikazioa zulo sinuaurikularra deitzen da (hasieran honako hau oso zabala da, irudian ikusten den moduan).

5. «Hara zilborreko odol oxigenatua eta bitelinoen oxigeno gutxikoa iristen dira; beraz, odola nahasten da.»
  _t=0.16 · why · argi: zulo-sinoaurikularra_
  - Ez dut ulertu: «Odol oxigenatua eta oxigeno gutxikoa leku berean elkartzen dira, beraz nahastu egiten dira.»
  - **F** `w10/3.4/p5/s2` Esaterako, zilbor-hestetik datorren odola oxigeno altukoa da (odol oxigenatua), eta zain bitelinoak daramatena, gutxikoa.
  - g `w10/3.4/p5/s3` Hauek komunikatuta daudenez zulo sinoaurikularraren bitartez, odol-nahasketa gertatuko da.

6. «Garapenean anastomosiak agertzen dira: ezkerreko zainetako odola eskuineko zainetara desbideratzen da.»
  _t=0.34 · argi: anastomosiak_
  - Ez dut ulertu: «Zainen artean zubiak sortzen dira, anastomosiak: ezkerreko odola eskuineko zainetara pasatzen da.»
  - **F** `w10/3.4/p4/s6` Garapenean, zain sisteman aldaketa anitz gertatzen dira: komunikazioak desberdinak agertu ezkerreko eta eskuineko zainen artean, zain batzuk desagertu (4.asterako desagertzen da karenatik bueltatzen den eskuineko zilborreko zaina, ezkerreko zain bitelinoa eta beranduago gutxi gorabehera 10.astean ezkerreko kardinal komuna).
  - g `w10/3.4/p6/s2` Garapenean, enbrioiaren ezkerreko zainetatik doan odola desbideratu eta eskuineko zainetara (eskuineko zain sinuaren luzapenera) heltzen da, anastomozioak (konexioak) agertzen direlako.

7. «Kontuz: 4. asterako, zilborrekoetatik eskuinekoa desagertzen da, eta bitelinoetatik, ezkerrekoa.»
  _t=0.34 · caution · argi: eskuineko-zilbor-zaina, ezkerreko-zain-bitelinoa_
  - Ez dut ulertu: «Kontuz: 4. asterako, eskuineko zilborreko zaina eta ezkerreko zain bitelinoa desagertzen dira.»
  - **F** `w10/3.4/p4/s6` Garapenean, zain sisteman aldaketa anitz gertatzen dira: komunikazioak desberdinak agertu ezkerreko eta eskuineko zainen artean, zain batzuk desagertu (4.asterako desagertzen da karenatik bueltatzen den eskuineko zilborreko zaina, ezkerreko zain bitelinoa eta beranduago gutxi gorabehera 10.astean ezkerreko kardinal komuna).

8. «Beranduago, gutxi gorabehera 10. astean, ezkerreko kardinal komuna ere desagertzen da.»
  _t=0.34 · argi: ezkerreko-kardinal-komuna · arbelean: b-ixten_
  - Ez dut ulertu: «Geroago, 10. aste inguruan, ezkerreko kardinal komuna ere desagertzen da.»
  - **F** `w10/3.4/p4/s6` Garapenean, zain sisteman aldaketa anitz gertatzen dira: komunikazioak desberdinak agertu ezkerreko eta eskuineko zainen artean, zain batzuk desagertu (4.asterako desagertzen da karenatik bueltatzen den eskuineko zilborreko zaina, ezkerreko zain bitelinoa eta beranduago gutxi gorabehera 10.astean ezkerreko kardinal komuna).

9. «Horregatik, zain odol ia guztia eskuineko luzapenera iristen da, eta ezkerreko luzapena poliki-poliki txikitzen da.»
  _t=0.34 · why · argi: eskuineko-sinu-luzapena, ezkerreko-sinu-luzapena_
  - Ez dut ulertu: «Ondorioz, odol gehiena eskuineko luzapenera doa, eta ezkerrekoa txikitzen joaten da.»
  - **F** `w10/3.4/p6/s3` Horregatik, enbrioiaren zain-odol ia guztia iristen da zain sinuaren eskuineko luzapenera.
  - **F** `w10/3.4/p6/s4` Ondorioz, zain-sinuaren ezkerreko luzapenak garrantzia galtzen du eta poliki-poliki hasten da txikitzen edo desagertzen.

10. «Ezkerreko luzapenetik bi zain egitura bakarrik sortzen dira: sinu koronarioa eta ezkerreko aurikularen zain laprana.»
  _t=0.52 · emphasis · argi: ezkerreko-sinu-luzapena, sinu-koronarioa, ezkerreko-aurikularen-zain-laprana · arbelean: tz-ezker-luzapena_
  - Ez dut ulertu: «Ezkerreko luzapenetik bi gauza bakarrik geratzen dira: sinu koronarioa eta ezkerreko aurikularen zain laprana.»
  - **F** `w10/3.4/p7/s1` Ondorioz, ezkerreko luzapen honetatik bi zain egitura sortzen dira bakarrik: alde batetik, bihotzaren atze ezkerreko partean kokatzen den zain egitura bat, sinu koronarioa, eta bestetik zain sinu horretan bukatzen edo irekitzen den eta ezkerreko aurikulatik itzultzen den ezkerreko aurikularen zain laprana.

11. «Eskuineko luzapena, aldiz, handitu egiten da, eta zulo sinoaurikularra eskuinera mugitzen da, hasierako eskuineko aurikulara.»
  _t=0.86 · argi: eskuineko-sinu-luzapena, zulo-sinoaurikularra, hasierako-eskuineko-aurikula_
  - Ez dut ulertu: «Eskuineko luzapena hazi egiten da, eta zuloa eskuinera mugitzen da, hasierako eskuineko aurikulara.»
  - **F** `w10/3.4/p8/s1` Gainerako odola anastomosi bitartez desbideratzen da eskuineko zainetara eta hauek garrantzi handiagoa irabazten dute.
  - **F** `w10/3.4/p8/s2` Horregatik eskuineko luzapena handituz doa, baita eskuineko zainak ere.
  - **F** `w10/3.4/p8/s3` Hasierako aurikularen eta zain sinuaren arteko komunikazioa eskuinalderantz mugitzen da (Aurikula komunaren eskuineko aldea, hau da, hasierako eskuineko aurikula), zain-sinua aurikula komunaren atzeko paretarekin komunikatzen delarik.

- Arbela `b-atzetik`: Atzetik ikusita: eskuina eta ezkerra ez dira alderantzizkatzen
  - **F** `w10/3.4/p4/s1` KONTUZ!
  - **F** `w10/3.4/p4/s2` Atzetik ikusita dago, orduan, eskuina eta ezkerra ez dira alderantzizkatu behar Goi ezkerraldeko irudia (zurixka atala) aurikula komunaren espazioa da, komunikaturik dago zain sinuarekin.
- Arbela `b-ixten`: 4. asterako ixten dira eskuineko zilborreko zaina eta ezkerreko zain bitelinoa; 10. aste inguruan, ezkerreko kardinal komuna
  - **F** `w10/3.4/p4/s6` Garapenean, zain sisteman aldaketa anitz gertatzen dira: komunikazioak desberdinak agertu ezkerreko eta eskuineko zainen artean, zain batzuk desagertu (4.asterako desagertzen da karenatik bueltatzen den eskuineko zilborreko zaina, ezkerreko zain bitelinoa eta beranduago gutxi gorabehera 10.astean ezkerreko kardinal komuna).
- Galdera (contrast): Aurretik eta atzetik ikusita: zer gertatzen da eskuinarekin eta ezkerrarekin?
- Galdera (predict): Zer uste duzu: ezkerreko zainak ixten direnean, zer gertatuko zaio zain sinuaren ezkerreko luzapenari?
- Galdera (contrast): Zain sinuaren bi luzapenak: zer gertatzen zaio bakoitzari?

## 9. Eskuineko aurikula

Etapa: `eskuineko-aurikula` · 9 lerro · ~73 s hitz eginda

1. «Eskuin atzeko aurikularen pareta zain sinuarekin komunikatuta dago: hori da zulo sinoaurikularra.»
  _t=0 · argi: zulo-sinoaurikularra_
  - Ez dut ulertu: «Aurikula honen atzeko horman zulo bat dago, zain sinura irekitzen dena: zulo sinoaurikularra.»
  - **F** `w10/3.4/p10/s1` Eskuin atzeko aurikularen pareta komunikatuta dago bihotz-hodiaren atzeko zain sinuarekin, aurretik aipatutako mugimenduen ondorioz.
  - g `w10/3.4/p10/s2` Zulo honi zulo sino-aurikularra deritzo.

2. «Zuloaren ertzeko eskuineko eta ezkerreko zain balbulak goikaldean fusionatzen dira, eta trenkada bat sortzen dute: septum spuriuma.»
  _t=0.1 · emphasis · argi: eskuineko-zain-balbula, ezkerreko-zain-balbula, septum-spurium_
  - Ez dut ulertu: «Zuloaren bi ertzetan bi balbula daude; goian elkartzen dira eta horma txiki bat egiten dute: septum spuriuma.»
  - g `w10/3.4/p10/s3` Sarrera zuloaren inguruan (sinu aurikularraren ertzeetan) tolesturak agertzen dira, eta hortik sortuko dira bi zain-balbula/balbula benosa: eskuineko balbula benosoa eta ezkerreko balbula benosoa (edo zain balbula).
  - **F** `w10/3.4/p10/s4` Bi balbula hauek zulo sinoaurikularraren goikaldean (alde kranealan) fusionatuko dira septum trenkadarekin, trenkada bat sortuz plano sagitalean: Septum Spurium/trenkada spuriuma.

3. «Gero, septum spuriuma eta ezkerreko zain balbula septum secundumarekin fusionatzen dira: aurikula arteko trenkadaren osagai bihurtzen dira.»
  _t=0.22 · argi: septum-spurium, ezkerreko-zain-balbula, septum-secundum · arbelean: tz-ezker-balbula_
  - Ez dut ulertu: «Gero horma hori eta ezkerreko balbula septum secundumarekin elkartzen dira, aurikulen arteko horman.»
  - **F** `w10/3.4/p11/s1` Horrez gain, garapena aurrera doan heinean, honako trenkada hau (septum spurium), ezkerreko zain balbularekin batera, momentu horretan garatzen ari den bi aurikula artean agertzen den aurikularteko trenkadarekin fusionatuko da, trenkada hori Septum secundum da zehazki.
  - **F** `w10/3.4/p11/s2` Beraz, bi aurikularteko trenkadaren osagai bat izango dira.

4. «Eskuineko zain balbula goian desagertzen da; behean bitan banatzen da: beheko kabaren balbula eta sinu koronarioaren balbula.»
  _t=0.34 · emphasis · argi: eskuineko-zain-balbula, beheko-kabaren-balbula, sinu-koronarioaren-balbula · arbelean: tz-eskuin-balbula_
  - Ez dut ulertu: «Eskuineko balbula goian galtzen da; behean bi balbula txiki uzten ditu: beheko kabaren balbula eta sinu koronarioaren balbula.»
  - **F** `w10/3.4/p12/s1` Eskuineko zain balbula bere goiko aldean desagertu egiten da, baina bere beheko aldetik bi balbula berri agertzen dira: beheko bena kabaren balbula eta sinu koronarioaren balbula, egitura hauek sarrera zuloetan dituzten balbulak.

5. «Bitartean, atzean zegoen sinua aurikularen atzeko paretan inkorporatzen da: horrela sortzen da behin betiko eskuineko aurikula.»
  _t=0.46 · argi: atal-lisoa, eskuineko-aurikula_
  - Ez dut ulertu: «Atzean zegoen sinua aurikularen atzeko hormaren parte bihurtzen da. Hortik dator behin betiko eskuineko aurikula.»
  - **F** `w10/3.4/p13/s1` Bukatzeko, hasierako eskuineko aurikularen atzealdean kokatuta zegoen zain sinua, garapenean, hasierako eskuineko aurikularen atzeko paretan poliki-poliki inkorporatuko da.
  - g `w10/3.4/p13/s2` Momentu honetan, inkorporazioa gertatu ondoren, hasierako eskuineko aurikula, behin-betiko eskuineko aurikula izatera pasatzen da.

6. «Atzeko atal lisoa zain sinuaren eskuineko luzapenetik dator: bertan bukatzen dira goiko eta beheko bena kabak, eta sinu koronarioa.»
  _t=0.58 · emphasis · argi: atal-lisoa, goiko-kaba-zaina, beheko-kaba-zaina, sinu-koronarioa · arbelean: tz-eskuin-luzapena_
  - Ez dut ulertu: «Atzeko zati leuna zain sinutik dator: hara iristen dira bi bena kabak eta sinu koronarioa.»
  - g `w10/3.4/p14/s2` Alde batetik, atzeko pareta lisoa, atzeko paretan gehitutako zain sinuetatik eskuineko luzapenetik eratorria dela.
  - g `w10/3.4/p14/s5` Zehazki, atal liso honetan bukatzen dira eskuineko aurikulara iristen diren enbrioiaren zainak, goitik goiko bena kaba sartzen da eta behetik beheko bena kaba.
  - **F** `w10/3.4/p14/s6` Halaber, bihotzeko atzeko paretaren eskuineko atal liso horretan bukatzen da sinu koronarioa (zain sinuaren ezkerreko luzapenatik sortutakoa).
  - **F** `w10/3.4/p23/s1` *Goiko eta beheko bena kabak (gorputzeko odol-hodi garrantzitsuenak) iristen dira eskuineko aurikularen atal lisora.

7. «Gainerakoa atal trabekulatua da: hasierako eskuineko aurikulatik dator, belarritxoa barne, eta muskulu pektinio finak ditu.»
  _t=0.7 · emphasis · argi: atal-trabekulatua, belarritxoa, muskulu-pektinioak · arbelean: tz-aurikularra_
  - Ez dut ulertu: «Beste zatiak muskulu finak ditu, zimurtsua da, eta belarritxoa barne hartzen du.»
  - **F** `w10/3.4/p14/s7` Beste aldetik, behin-betiko eskuineko aurikularrean atal trabekulatua dago, hasierako eskuineko aurikulatik sortzen dena, behin-betiko eskuineko aurikularen beste atala osatzen du, belarritxo izenez ezaguna (mintz fin bat, oso finak diren muskuluak bertan kokatzen dira, muskulu pektinioak, horregatik eskuineko aurikularen pareta atal trabekulatua dela esaten da).

8. «Beraz, eskuineko aurikulak bi atal guztiz desberdin ditu: atzeko atal lisoa eta atal trabekulatua.»
  _t=0.7 · summary · argi: eskuineko-aurikula, atal-lisoa, atal-trabekulatua_
  - Ez dut ulertu: «Eskuineko aurikulak bi zati oso desberdin ditu: bata leuna, bestea zimurtsua.»
  - **F** `w10/3.4/p15/s1` Beraz, eskuineko aurikulak bi atal guztiz desberdin ditu, atzeko atal lisoa non bukatzen diren zain egitura ezberdinak (atal liso hau zain sinutik sortzen da eta atal handiena da) eta atal trabekulatua (gainerako pareta non muskuluak garatzen diren): aurreko pareta, belarritxoa… (hasierako eskuineko aurikulatik sortzen dira).

9. «Bi atalen artean gandor terminala dago, eta haren goiko aldean nodulu sinusala: bihotzaren markapasoa.»
  _t=0.8 · emphasis · argi: gandor-terminala, nodulu-sinusala · arbelean: b-gandor_
  - Ez dut ulertu: «Bi zatien arteko mugan gandor terminala dago, eta haren goian nodulu sinusala, bihotzaren taupada hasten duena.»
  - **F** `w10/3.4/p16/s1` Bi atal horien artean gandortxo (gandor muskularra da) bat egoten da, gandor terminala (atal liso eta atal trabekulatuaren artean) eta horren goiko aldean bihotz eroapen sistemako nodulu sinusala dago, bihotz eroapen sistemako egitura hori non nerbio kinadak sortzen diren, bihotzeko markapasoa dena.

- Arbela `b-gandor`: Gandor terminala: atal lisoaren eta trabekulatuaren artean; goian nodulu sinusala (markapasoa)
  - **F** `w10/3.4/p16/s1` Bi atal horien artean gandortxo (gandor muskularra da) bat egoten da, gandor terminala (atal liso eta atal trabekulatuaren artean) eta horren goiko aldean bihotz eroapen sistemako nodulu sinusala dago, bihotz eroapen sistemako egitura hori non nerbio kinadak sortzen diren, bihotzeko markapasoa dena.
- Galdera (contrast): Eskuineko aurikularen bi atalak: nondik dator bakoitza?
- Galdera (pool): w10-q-spurium

## 10. Osatu taula

Etapa: `eskuineko-aurikula` · 1 lerro · ~6 s hitz eginda

1. «Azken zatia: taula osatu oroimenetik, eta gero zenbait galdera, gai osoko zatiak nahastuta.»
  _t=0.9 · summary_
  - Ez dut ulertu: «Orain zu: bete taula buruz, eta erantzun galdera batzuei.»
  - **F** `w10/3.4/p15/s1` Beraz, eskuineko aurikulak bi atal guztiz desberdin ditu, atzeko atal lisoa non bukatzen diren zain egitura ezberdinak (atal liso hau zain sinutik sortzen da eta atal handiena da) eta atal trabekulatua (gainerako pareta non muskuluak garatzen diren): aurreko pareta, belarritxoa… (hasierako eskuineko aurikulatik sortzen dira).

- Galdera (fill): klasea:10/taula
- Galdera (pool): w10-q-zilbor-zainak
- Galdera (pool): w10-q-eskuineko-bentrikulua
- Galdera (pool): w10-q-desagertzen

## Estaldura

- Funtsezko esaldiak: 112 / 189; klaseak esaten ditu: 112.
- Klaseak aipatzen dituen esaldi guztiak: 135.
- Hitz egiteko denbora: ~10 min (galderak aparte).
