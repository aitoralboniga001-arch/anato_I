# 10. gaiko klasea: iturriak

_Sortua: `npx tsx scripts/klasea/audit.ts 10`. F = funtsezkoa, g = garrantzitsua._

## 0. Gaur

Etapa: `eskualde-kardiogenikoa` · 2 lerro · ~13 s hitz eginda

1. «Kaixo! Gaurko klasean bihotza nola sortzen den eta lehen zirkulazioa ikasiko ditugu.»
  _t=0_
  - **F** `w10/1/p3/s1` Garapenaren 3. astean enbrioia jada ezin da orain arte bezala elikatu (difusioaren bidez) eta 3. astetik aurrera bere berezko zirkulazio-sistema/sistema kardiobaskularra garatuko da.

2. «3. astean, enbrioia ezin da jada difusioaren bidez elikatu. Horregatik, bere zirkulazio-sistema garatzen du.»
  _t=0 · why · arbelean: b-zergatik_
  - Ez dut ulertu: «Enbrioia handitu egin da: difusioa ez da nahikoa, eta odol hodiak eta bihotza behar ditu.»
  - **F** `w10/1/p3/s1` Garapenaren 3. astean enbrioia jada ezin da orain arte bezala elikatu (difusioaren bidez) eta 3. astetik aurrera bere berezko zirkulazio-sistema/sistema kardiobaskularra garatuko da.

- Arbela `b-zergatik`: 3. astetik aurrera: difusioa ez da nahikoa, zirkulazio-sistema propioa
  - **F** `w10/1/p3/s1` Garapenaren 3. astean enbrioia jada ezin da orain arte bezala elikatu (difusioaren bidez) eta 3. astetik aurrera bere berezko zirkulazio-sistema/sistema kardiobaskularra garatuko da.
- Galdera (predict): Zer uste duzu: zergatik behar du enbrioiak bere zirkulazio-sistema 3. astetik aurrera?

## 1. Nondik dator bihotza?

Etapa: `eskualde-kardiogenikoa` · 9 lerro · ~57 s hitz eginda

1. «Lerro primitiboaren alde zefalikoko zelula epiblastiko batzuk migratu egiten dira, plaka neuralaren alde zefalikora eta alboetara.»
  _t=0.14 · argi: lerro-primitiboa, plaka-neurala, epiblastoa_
  - g `w10/1/p4/s1` Lerro primitiboaren alde zefalikoan kokatzen diren zelula epiblastiko batzuk, lerro primitibotik migratzen dute eta alde zefalikora abiatuz, plaka neuralaren alde zefalikoan eta alde lateraletan, migratutako zelula horiek alboko mesodermoko errai orriraino iristen dira.

2. «Iristen diren lekuan, ferra forman, zelula multzoak sortzen dituzte: odol irlatxoak.»
  _t=0.32 · argi: odol-irlatxoak_
  - **F** `w10/1/p4/s2` Bertan, ferra formako egitura bat sortzen dute.
  - **F** `w10/1/p4/s3` Bertako zelula multzoak, odol irlatxoak dira.

3. «Zeharkako mozketan ikusten da non dauden: alboko mesodermoaren errai orrian.»
  _t=0.48 · emphasis · argi: odol-irlatxoak, errai-orria · arbelean: b-irlatxoak_
  - g `w10/1/p4/s1` Lerro primitiboaren alde zefalikoan kokatzen diren zelula epiblastiko batzuk, lerro primitibotik migratzen dute eta alde zefalikora abiatuz, plaka neuralaren alde zefalikoan eta alde lateraletan, migratutako zelula horiek alboko mesodermoko errai orriraino iristen dira.
  - **F** `w10/1/p4/s3` Bertako zelula multzoak, odol irlatxoak dira.

4. «Irlatxo horietatik odoleko zelulak eta odol hodiak garatzen dira.»
  _t=0.48 · argi: odol-irlatxoak_
  - g `w10/1/p4/s4` Odol irlatxo horietatik garatzen dira odoleko zelulak eta baita odol hodiak ere.

5. «Odol hodiek ferra formako sare bat osatzen dute, eta fusionatzean, ferra formako tutu bat.»
  _t=0.62 · argi: ferra-formako-plexua_
  - g `w10/1/p4/s5` Beraz, hemendik ferra formako odol hodiz osatutako sare bat sortzen da.
  - g `w10/1/p4/s6` Sare horretako odol hodiak fusionatzean, ferra formako tutu itxurako egitura sortzen da.

6. «Tutu horretan bi atal daude: erdian plaka kardiogenikoa, eta alboetan endokardio hodiak.»
  _t=0.74 · emphasis · argi: plaka-kardiogenikoa, bihotz-hodiak · arbelean: b-plaka_
  - Ez dut ulertu: «Ferra bera da, bi izenekin: erdiko atala plaka kardiogenikoa da, eta alboetako besoak endokardio hodiak.»
  - g `w10/1/p5/s1` Tutu itxurako egitura horretan, bi atal bereizten dira.
  - **F** `w10/1/p6/s1` 1-Erdiko atala: Plaka kardiogenikoa→ Plaka neuralaren alde zefalikoan kokatuta dago (mintz bukofaringeoaren alde bentralean, eta plaka neuralaren aurreko aldean kokatzen dela ikusten da mozketa sagitalean; kokatzen ari da perikardio barrunbean).
  - g `w10/1/p7/s1` 2-Alboko aldeak: Endokardio hodiak dira.

7. «Kontuz: plaka kardiogenikoa plaka neuralaren alde zefalikoan dago, mintz bukofaringeoaren alde bentralean. Alboetan, endokardio hodiak.»
  _t=0.74 · caution · argi: plaka-kardiogenikoa, plaka-neurala, mintz-bukofaringeoa_
  - **F** `w10/1/p6/s1` 1-Erdiko atala: Plaka kardiogenikoa→ Plaka neuralaren alde zefalikoan kokatuta dago (mintz bukofaringeoaren alde bentralean, eta plaka neuralaren aurreko aldean kokatzen dela ikusten da mozketa sagitalean; kokatzen ari da perikardio barrunbean).
  - g `w10/1/p7/s1` 2-Alboko aldeak: Endokardio hodiak dira.

8. «Aldi berean, notokordaren bi alboetan bi aorta dortsal agertzen dira: bat ezkerrekoa eta bestea eskumakoa.»
  _t=0.86 · argi: aorta-dortsalak, notokorda_
  - g `w10/1/p8/s1` Aldi berean, alboko mesodermoko errai orritik sortutako beste motako zelula batzuk, notokordaren bi alboetan osatzen dituzten zelula irlatxoetatik, bi luzetarako odol hodi (arteria) agertzen dira.
  - g `w10/1/p8/s2` Hauek, aorta dortsalak (bat ezkerrekoa bat eskumakoa) dute izena.

9. «Hasieratik, aorta dortsalak alboko endokardio hodiekin kontaktuan daude.»
  _t=0.86 · emphasis · argi: aorta-dortsalak · arbelean: b-aortak_
  - **F** `w10/1/p8/s3` Hauek, hasieratik kontaktuan egongo dira alboko hodi endokardikoekin.

- Arbela `b-irlatxoak`: Odol irlatxoak: alboko mesodermoaren errai orrian, ferra forman
  - g `w10/1/p4/s1` Lerro primitiboaren alde zefalikoan kokatzen diren zelula epiblastiko batzuk, lerro primitibotik migratzen dute eta alde zefalikora abiatuz, plaka neuralaren alde zefalikoan eta alde lateraletan, migratutako zelula horiek alboko mesodermoko errai orriraino iristen dira.
  - **F** `w10/1/p4/s2` Bertan, ferra formako egitura bat sortzen dute.
  - **F** `w10/1/p4/s3` Bertako zelula multzoak, odol irlatxoak dira.
- Arbela `b-plaka`: Ferra formako tutua: erdian plaka kardiogenikoa, alboetan endokardio hodiak
  - **F** `w10/1/p6/s1` 1-Erdiko atala: Plaka kardiogenikoa→ Plaka neuralaren alde zefalikoan kokatuta dago (mintz bukofaringeoaren alde bentralean, eta plaka neuralaren aurreko aldean kokatzen dela ikusten da mozketa sagitalean; kokatzen ari da perikardio barrunbean).
  - g `w10/1/p7/s1` 2-Alboko aldeak: Endokardio hodiak dira.
- Arbela `b-aortak`: Aorta dortsalak: notokordaren alboetan, hasieratik endokardio hodiekin kontaktuan
  - g `w10/1/p8/s1` Aldi berean, alboko mesodermoko errai orritik sortutako beste motako zelula batzuk, notokordaren bi alboetan osatzen dituzten zelula irlatxoetatik, bi luzetarako odol hodi (arteria) agertzen dira.
  - **F** `w10/1/p8/s3` Hauek, hasieratik kontaktuan egongo dira alboko hodi endokardikoekin.
- Galdera (pool): w10-q-plaka
- Galdera (pool): mikro:10/eskualde-kardiogenikoa:2

## 2. Tolespenek hodi bakarra egiten dute

Etapa: `bihotz-hodia` · 14 lerro · ~95 s hitz eginda

1. «Hasieran diskoa laua da oraindik. 3. aste bukaeran bi tolespen egiten ditu: zefalokaudala eta zeharkakoa.»
  _t=0_
  - **F** `w10/1/p9/s1` Diskoaren tolespenak ez dira hasi oraindik (laua mantentzen da oraindik).
  - g `w10/1/p9/s2` 3. aste bukaeran, laua den diskoa tolesten hasi eta 2 tolespen egiten ditu: zefalokaudala eta zeharkakoa.

2. «Lehenik, tolespen zefalokaudala: nerbio sistema luzetara hazten da, eta garun xixkuak agertzen dira alde zefalikoan.»
  _t=0.1 · why · argi: garun-xixkuak_
  - **F** `w10/1/p10/s1` → Tolespen zefalokaudala (erdiko nerbio sistemaren luzetarako hazkuntzagatik) dela eta, ferra formako plexuaren erdiko atala (plaka kardiogenikoa) alde kaudalera abiatzen da, alde zefalikoan garun xixkuak agertzen hasten baitira.

3. «Horregatik, plaka kardiogenikoa alde kaudalera doa. Hasieran lepo mailan dago, perikardio barrunbean sartuta.»
  _t=0.1 · why · argi: plaka-kardiogenikoa, perikardio-barrunbea_
  - **F** `w10/1/p10/s1` → Tolespen zefalokaudala (erdiko nerbio sistemaren luzetarako hazkuntzagatik) dela eta, ferra formako plexuaren erdiko atala (plaka kardiogenikoa) alde kaudalera abiatzen da, alde zefalikoan garun xixkuak agertzen hasten baitira.
  - **F** `w10/1/p10/s2` Hasieran, plaka kardiogenikoa (perikardio barrunbean sartuta dagoena) lepo mailan dago.

4. «Azkenean torax barrunbera iristen da, garun xixkuen eta mintz bukofaringeoaren alde kaudalean.»
  _t=0.1 · emphasis · argi: plaka-kardiogenikoa, garun-xixkuak, mintz-bukofaringeoa · arbelean: b-zefalokaudala_
  - Ez dut ulertu: «Nerbio sistema hazten denean, plaka kardiogenikoa beherago geratzen da: lepotik toraxera.»
  - **F** `w10/1/p10/s3` Ostean, gero eta beherago egongo da, azkenean torax barrunbera iritsiko da eta bertan, entzefalo xixkuen eta mintz bukofaringeoaren alde kaudalean geratuko da.

5. «Bigarrena, zeharkako tolespena: somitak hazten dira, eta plexuaren alboko aldeak lodiagoak egin eta hurbiltzen dira.»
  _t=0.32 · why · argi: bihotz-hodiak_
  - **F** `w10/1/p11/s1` → Zeharkako tolespenagatik (somiten hazkuntzagatik), plexuaren alboko aldeak gero eta lodiagoak egingo dira, hurbilduz, haien artean fusionatzen hasten diren arte.

6. «Ondorioz, ezkerreko eta eskuineko endokardio hodiak fusionatzen dira: endokardio hodi bakarra sortzen da.»
  _t=0.32 · emphasis · argi: bihotz-hodiak, endokardioa · arbelean: b-zeharkakoa_
  - **F** `w10/1/p11/s2` Tolespen honen ondorioz, endokardio-hodiak (ezkerrekoak eta eskuinekoak) haien artean hurbildu eta fusionatu egiten dira, endokardio hodi bakarra sortuz.

7. «Hodiaren inguruan errai orria kokatzen da, eta hortik orri epimiokardikoa sortzen da.»
  _t=0.47 · argi: errai-orria, orri-epimiokardikoa_
  - **F** `w10/1/p11/s3` Hodi horren inguran, alboko mesodermoaren errai orria kokatuko da, eta errai orri horretatik, orri epimiokardikoa sortzen da.

8. «Hala, bihotzaren hiru geruzak bereizten dira: barrutik endokardioa, tartean miokardioa, eta kanpoan epikardioa.»
  _t=0.59 · emphasis · argi: endokardioa, miokardioa, epikardioa · arbelean: b-geruzak_
  - g `w10/1/p14/s3` Honela, bihotzak dituen 3 zelula geruzak desberdintzen dira:
  - **F** `w10/1/p15/s1` ● Endokardioa: bihotzaren barruko geruza, hodi-endokardiotik migratutako eta bihotz gelatinatik sortutako zeluletatik sortu.
  - **F** `w10/1/p16/s1` ● Miokardioa: tarteko zelula geruza, geruza muskularra (Endokardioa inguratu).
  - **F** `w10/1/p17/s1` ● Epikardioa edo errai perikardioa: epimiokardiotik sortutako geruza, miokardio inguruan.

9. «Miokardioa geruza muskularra da; epikardioari errai perikardioa ere esaten zaio.»
  _t=0.59 · argi: miokardioa, epikardioa_
  - **F** `w10/1/p16/s1` ● Miokardioa: tarteko zelula geruza, geruza muskularra (Endokardioa inguratu).
  - **F** `w10/1/p17/s1` ● Epikardioa edo errai perikardioa: epimiokardiotik sortutako geruza, miokardio inguruan.

10. «Hasieran hodia perikardio barrunbearen atzeko paretari lotuta dago, mesokardio dortsalaren bidez.»
  _t=0.73 · argi: mesokardio-dortsala, perikardio-barrunbea_
  - **F** `w10/1/p18/s1` Hasieran, bihotz-hodia lotuta mantentzen da perikardio barrunbearen atzeko paretarekin mesokardio dortsala izeneko loturaren bitartez, baina garapenean lotura hau desagertu egiten da (behin-behineko egitura da).

11. «Lotura hori desagertu egiten da, eta perikardioaren zeharkako sinua geratzen da.»
  _t=0.73 · argi: mesokardio-dortsala, perikardioaren-zeharkako-sinua · arbelean: b-sinua_
  - **F** `w10/1/p18/s1` Hasieran, bihotz-hodia lotuta mantentzen da perikardio barrunbearen atzeko paretarekin mesokardio dortsala izeneko loturaren bitartez, baina garapenean lotura hau desagertu egiten da (behin-behineko egitura da).
  - g `w10/1/p18/s2` Desagerpenarekin, perikardio barrunbeak zakuondo/sinu bat agertzen da → perikardioaren zeharkako sinua.

12. «Aorta dortsalak, berriz, enbrioiaren atzekaldean luzetara doazen bi odol hodi dira.»
  _t=0.82 · argi: aorta-dortsalak_
  - **F** `w10/1/p19/s2` Hauetatik, bi luzetarako odol-hodi sortzen dira: arteria dortsalak (enbrioiaren atzekaldean kokatuak).

13. «Tolespen zefalokaudalagatik, aorta dortsalen alde zefalikoak gero eta aurrerago kokatzen dira.»
  _t=0.9 · why · argi: aorta-dortsalak_
  - **F** `w10/1/p21/s1` Gainera, enbrioiaren tolespen zefalokaudalarengatik, aorta dortsal hauen alde zefalikoak gero eta aurrerago kokatzen dira.

14. «Azkenean bihotz hodiaren alde zefalikoarekin lotzen dira, lehen arku aortikoen bidez: aorta bakoitzak arku bat.»
  _t=0.9 · emphasis · argi: aorta-arkuak, bihotz-hodia · arbelean: b-arkuak_
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
- Galdera (pool): mikro:10/bihotz-hodia:7

## 3. Lehen zirkulazioa

Etapa: `zirkulazio-goiztiarra` · 17 lerro · ~111 s hitz eginda

1. «Orain, bihotzera iristen den eta handik irteten den odola. Hasieran hodia nahiko zuzena da, eta bi mutur ditu.»
  _t=0 · argi: arteria-muturra, zain-muturra_
  - **F** `w10/1/p22/s1` Bihotz hodian 2 mutur bereizten dira: Hasieran bihotz hodia nahiko zuzena da

2. «Beheko muturra zain muturra da. Hara iristen dira hiru zain mota, bikoteka.»
  _t=0.08 · argi: zain-muturra, zilbor-zainak, bitelo-zainak, bena-kardinal-komuna_
  - **F** `w10/1/p23/s1` - Beheko muturra→ Zain muturra: honaino iristen dira momentu honetan enbrioiak dauzkan zainak.
  - **F** `w10/1/p23/s2` Hasieran 3 zain mota: zilborrekoak (2 dira, karenatik bueltatzen dira, eta odol oxigenatua garraiatzen dute), bitelinoak (2 dira, bitelo zakutik itzuli eta odol ez-oxigenatua garraiatzen dute), eta kardinal komunak (2 dira, eta alde zefalikotik zein alde kaudaletik itzultzen diren zainak (aurreko eta atzeko kardinalak direnak) elkartzen direnean sortzen dira).

3. «Zilborrekoak karenatik datoz, bitelinoak bitelo zakutik; kardinal komunak, aurreko eta atzeko kardinalak elkartzean sortzen dira.»
  _t=0.08 · argi: zilbor-zainak, bitelo-zainak, bena-kardinal-komuna, aurreko-zain-kardinalak, atzeko-zain-kardinalak, karena, bitelo-zaku-sekundarioa_
  - **F** `w10/1/p23/s2` Hasieran 3 zain mota: zilborrekoak (2 dira, karenatik bueltatzen dira, eta odol oxigenatua garraiatzen dute), bitelinoak (2 dira, bitelo zakutik itzuli eta odol ez-oxigenatua garraiatzen dute), eta kardinal komunak (2 dira, eta alde zefalikotik zein alde kaudaletik itzultzen diren zainak (aurreko eta atzeko kardinalak direnak) elkartzen direnean sortzen dira).

4. «Goiko muturra arteria muturra da: hortik irteten da odola, arku aortikoetara eta aorta dortsaletara.»
  _t=0.19 · argi: arteria-muturra, aorta-arkuak, aorta-dortsalak_
  - **F** `w10/1/p24/s1` - Goiko muturra (zefalikoa)→ Arteria muturra (edo irteera muturra): hemendik ateratzen da odola eta dauden arku aortikoen bitartez, aorta dortsaletara pasatu (komunikatu).

5. «Hor arteria bulboa dago, eta haren urrutiko atalari aorta zakua deritzo.»
  _t=0.19 · argi: atal-bulbarra, aorta-zakua_
  - g `w10/1/p24/s2` Arteria bulboa dago hemen kokatuta.
  - **F** `w10/1/p25/s1` Arteria bulboaren urrutiko atalak aorta zakua du izena.

6. «Bulboa atal bentrikularrarekin jarraitzen da, hau aurikularrarekin, eta hau zain sinuarekin, zain muturrean.»
  _t=0.19 · argi: atal-bulbarra, atal-bentrikularra, atal-aurikularra, zain-sinua, zain-muturra_
  - g `w10/1/p25/s2` Hau jarraia bihotzaren atal bentrikularrarekin, hau aurikularrarekin, eta hau bihotzeko zain muturrean dagoen, zain sinua hain zuzen.

7. «Zain sinuak bi alboko adar ditu, ezkerrean eta eskuinean.»
  _t=0.19 · argi: zain-sinua, eskuineko-sinu-luzapena, ezkerreko-sinu-luzapena_
  - g `w10/1/p25/s3` Sinu honek bi alboko adar ditu, ezker eta eskubian.

8. «Kontuan hartu: arteriak bihotzetik irteten diren odol hodiak dira; zainek, aldiz, odola bihotzera eramaten dute.»
  _t=0.3 · emphasis · argi: aorta-arkuak, aorta-dortsalak, zilbor-zainak, bitelo-zainak · arbelean: b-arteria-zaina_
  - **F** `w10/1/p26/s1` Kontuan hartu: Arteriak bihotzetik irtetzen diren odol hodiak dira.
  - **F** `w10/1/p26/s2` Zainak, aldiz, kontrakoa, odola bihotzera eramaten duten odol hodiak dira.

9. «Biek eraman dezakete odol oxigenatua edo oxigeno gabea. Adibidez, zilborreko zainek odol oxigenatua dakarte.»
  _t=0.3 · caution · argi: zilbor-zainak_
  - Ez dut ulertu: «Arteria edo zaina izatea norabideak erabakitzen du, ez oxigenoak: bihotzetik irten ala bihotzera etorri.»
  - **F** `w10/1/p26/s3` Bi odol hodi mota hauek oxigenaturik dagoen odola edo oxigeno gabeko odola eraman dezakete.
  - **F** `w10/1/p23/s2` Hasieran 3 zain mota: zilborrekoak (2 dira, karenatik bueltatzen dira, eta odol oxigenatua garraiatzen dute), bitelinoak (2 dira, bitelo zakutik itzuli eta odol ez-oxigenatua garraiatzen dute), eta kardinal komunak (2 dira, eta alde zefalikotik zein alde kaudaletik itzultzen diren zainak (aurreko eta atzeko kardinalak direnak) elkartzen direnean sortzen dira).

10. «Kardinal komunek enbrioiaren alde zefalikoko eta behe aldeko odola biltzen dute: oxigeno gutxikoa.»
  _t=0.38 · argi: bena-kardinal-komuna, zain-sinua · arbelean: zt-kardinal_
  - **F** `w10/1/p29/s1` ●Zain kardinal komunak: bihotz hodiaren beheko atalera iristen da.
  - **F** `w10/1/p29/s3` Enbrioiaren alde zefalikoko oxigeno gutxiko odola eta enbrioiaren behe aldeko oxigeno gutxiko odola hartzen ditu, beraz, bihotzeraino iristen den odola, oxigeno gutxikoa da.

11. «Zain bitelinoek ere oxigeno gutxiko odola dakarte, hodiaren beheko ataleraino.»
  _t=0.48 · argi: bitelo-zainak · arbelean: zt-bitelo_
  - **F** `w10/1/p30/s1` ●Zain bitelinoak: oxigeno gutxiko odola eraman.
  - g `w10/1/p30/s2` Bihotz hodiaren beheko ataleraino iritsi.

12. «Zilborreko zainak, berriz, karenatik datoz; horregatik, odol oxigenatua dute.»
  _t=0.57 · why · argi: zilbor-zainak, karena · arbelean: zt-zilbor_
  - **F** `w10/1/p31/s1` ● Zilborestearen zainak: karenatik datorrenez, odol oxigenatua dute.

13. «Arteriak ere bikoteka daude. Arku aortikoek bihotzetik ateratako odol oxigenatua burura eta aorta dortsaletara eramaten dute.»
  _t=0.66 · argi: aorta-arkuak, aorta-dortsalak_
  - g `w10/1/p32/s1` Arteriak (bilateralak baita ere):
  - **F** `w10/1/p33/s1` ● Arku aortikoak: odol oxigenatua bihotzetik ateratzen du, burura eta aorta dortsaletara.

14. «Aorta dortsalek odol hori gorputzaren beste atal guztietara daramate, gero eta oxigeno gutxiagorekin.»
  _t=0.74 · argi: aorta-dortsalak_
  - **F** `w10/1/p34/s1` ● Aorta dortsalak: odol oxigenatua (gero eta oxigeno gutxiagorekin), gorputzaren beste atal guztietara eramaten du.

15. «Azkenik, bitelo arteriek eta zilborreko arteriek oxigenorik gabeko odola karenara eramaten dute, oxigenoa eta makromolekulak har ditzan.»
  _t=0.8 · emphasis · argi: bitelo-arteriak, zilbor-arteriak, karena_
  - **F** `w10/1/p35/s1` ● Bitelo arteriak eta zilborreko arteriak: jadanik oxigenorik ez daukan odola gorputzetik karenara eramaten du, bertan oxigenoa eta makromolekulak har ditzan.

16. «Zainen odola bihotzean nahasten da, atrio primitiboan.»
  _t=0.87 · emphasis · argi: atal-aurikularra_
  - **F** `w10/1/p36/s1` Bi motatako odolak (zain kardinal komuneko odol oxigenatu gabea eta bitelo benatik datorren odol oxigenatu gabea) bihotzean (atrio primitiboan) nahasten dira.

17. «Zain eta arteria hauek bikoitiak dira: ezkerrean eta eskuinean daude.»
  _t=0.87 · argi: atal-aurikularra_
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
- Galdera (pool): mikro:10/zirkulazio-goiztiarra:3
- Galdera (contrast): Zilborreko zainak eta zain bitelinoak: zein da haien arteko aldea?
- Galdera (order): Ordenatu odolaren irteera bidea, bihotzetik gorputzetik kanpora arte.

## 4. Hodiaren atalak

Etapa: `bihotz-atalak` · 13 lerro · ~84 s hitz eginda

1. «Gogoratu: goiko muturra arteria muturra da; handik, aorta arkuen bidez, odola aorta dortsaletara pasatzen da.»
  _t=0 · recall · argi: arteria-muturra, aorta-arkuak, aorta-dortsalak_
  - **F** `w10/2/p3/s1` Bihotz hodiaren goiko aldean duen muturra, arteria muturra deitzen da, bertatik irtetzen da bihotz hodiaren odola, eta arku aortikoen bitartez odola pasatzen da aorta dortsaletara.

2. «Beheko muturra zain muturra da, eta hodi osoa perikardio barrunbean dago.»
  _t=0 · argi: zain-muturra, perikardio-barrunbea_
  - g `w10/2/p3/s2` Alde kaudala zain muturra da eta bertara heltzen da zainetatik datorren odola.
  - g `w10/2/p3/s3` Badakigu bihotz hodia perikardio barruan sartuta dagoela.

3. «21. egunean, bihotz hodian estuguneak eta zabalkuntzak agertzen dira, eta atal desberdinak eratzen dira goitik behera.»
  _t=0.13 · emphasis · argi: bihotz-hodia · arbelean: b-21_
  - **F** `w10/2/p3/s4` Garapenaren 21. egunean, bihotz hodian estuguneak eta hertsadurak (zabalkuntzak) agertzen dira eta atal desberdinak eratzen dira goitik behera hedatzen den bihotz hodi honetan.

4. «Bi endokardio hodiak alde zefalikotik kaudalera fusionatzen dira; hasieran, hodi bakarra lineala da.»
  _t=0.13 · argi: bihotz-hodia_
  - **F** `w10/2/p4/s1` Bi alboko endokardio hodiak fusionatzen dira (alde zefalikoan hasi eta alde kaudalera arte) bihotz hodi bakarra sortzeko.
  - g `w10/2/p4/s2` Hasieran, honako hau lineala da, baina garapenak aurrera egin ahala, atal desberdinak agertzen dira (atal horietatik geroago sortuko dira gure bihotzak dituen atalak).

5. «Goiko atala atal bulbarra da, arteria bulboa; haren muturrean aorta zakua dago.»
  _t=0.27 · argi: atal-bulbarra, aorta-zakua_
  - **F** `w10/2/p5/s1` ● Atal bulbarra (Arteria bulboa): goiko atala (alde zefalikoa).
  - g `w10/2/p5/s4` Honen muturrean ARTERIA ZAKUA/ Aorta zakua (irudian beltzez) dago.

6. «Ondoren atal bentrikularra eta atal aurikularra datoz, jarraian. Atal aurikularra bikoitza da hasieran.»
  _t=0.4 · argi: atal-bentrikularra, atal-aurikularra_
  - **F** `w10/2/p6/s1` ● Atal bentrikularra: jarraia da aurreko eta hurrengo atalekin.
  - **F** `w10/2/p7/s1` ● Atal aurikularra: jarraia da aurreko eta hurrengo atalekin.
  - g `w10/2/p7/s3` Hasieran bikoitza da, baina gero fusionatu egingo dira.

7. «Fusioa alde zefalikotik kaudalera doanez, beheko atal aurikularra oraindik bikoitza da.»
  _t=0.4 · why · argi: atal-aurikularra_
  - **F** `w10/2/p4/s1` Bi alboko endokardio hodiak fusionatzen dira (alde zefalikoan hasi eta alde kaudalera arte) bihotz hodi bakarra sortzeko.
  - g `w10/2/p7/s3` Hasieran bikoitza da, baina gero fusionatu egingo dira.

8. «Azkena, zain sinuak: bilateralak eta bikoitzak. Enbrioiaren ezker eta eskuineko zainak bertan amaitzen dira.»
  _t=0.53 · argi: zain-sinua, zilbor-zainak, bitelo-zainak, bena-kardinal-komuna_
  - **F** `w10/2/p8/s1` ● Atal zain-sinuak (bilaterala eta bikoitza): ezker eta eskuineko zainak hemen amaitzen dira.

9. «Atal bulbarra eta atal bentrikularra perikardio barrunbean daude.»
  _t=0.66 · emphasis · argi: atal-bulbarra, atal-bentrikularra, perikardio-barrunbea_
  - **F** `w10/2/p9/s1` Atal bulbarra eta bentrikularra (Izendatzeko erabili ODOL HODIAREN atal aurikularra eta bentrikularra, ez bakarrik aurikula/bentrikulua) perikardio barrunbean kokatzen dira.

10. «Atal aurikularrak eta zain sinuak, berriz, kanpoan daude: septum transversumean, lepo mailan gutxi gorabehera.»
  _t=0.66 · emphasis · argi: atal-aurikularra, zain-sinua, septum-transversum, atal-bulbarra, atal-bentrikularra · arbelean: b-non_
  - Ez dut ulertu: «Atal bulbarra eta atal bentrikularra barrunbearen barruan daude; atal aurikularrak eta zain sinuak, kanpoan, septum transversumean.»
  - **F** `w10/2/p9/s2` Bikoitzak diren aurikulak eta zain sinuak perikardio barrunbe kanpoan dagoen septum transversumean kokatzen dira, enbrioiaren lepo mailan gutxi gorabehera.

11. «Kontuz izenekin: esan odol hodiaren atal aurikularra eta atal bentrikularra, ez aurikula edo bentrikulua bakarrik.»
  _t=0.66 · caution · argi: atal-aurikularra, atal-bentrikularra_
  - **F** `w10/2/p9/s1` Atal bulbarra eta bentrikularra (Izendatzeko erabili ODOL HODIAREN atal aurikularra eta bentrikularra, ez bakarrik aurikula/bentrikulua) perikardio barrunbean kokatzen dira.

12. «Odolaren bidea, beraz: zainak, zain sinuak, atal aurikularra, atal bentrikularra eta atal bulbarra.»
  _t=0.8 · emphasis · argi: zain-sinua, atal-aurikularra, atal-bentrikularra, atal-bulbarra · arbelean: b-bidea_
  - **F** `w10/2/p10/s1` Odolaren bidea: Zainak → Zain sinuak → Atal aurikularra → Atal bentrikularra → Atal bulbarra.

13. «Atalak bereizten direnerako, bihotza lepo mailatik toraxeko barrunbera jaitsi da.»
  _t=0.8_
  - g `w10/2/p11/s1` Bihotzaren atal hauek ezberdindu diren momenturako, bihotza lepo mailatik jaitsi da toraxeko barrunbera.

- Arbela `b-21`: 21. eguna: estuguneak eta zabalkuntzak; atalak goitik behera
  - **F** `w10/2/p3/s4` Garapenaren 21. egunean, bihotz hodian estuguneak eta hertsadurak (zabalkuntzak) agertzen dira eta atal desberdinak eratzen dira goitik behera hedatzen den bihotz hodi honetan.
- Arbela `b-non`: Perikardio barrunbean: atal bulbarra eta bentrikularra. Septum transversumean: aurikulak eta zain sinuak
  - **F** `w10/2/p9/s1` Atal bulbarra eta bentrikularra (Izendatzeko erabili ODOL HODIAREN atal aurikularra eta bentrikularra, ez bakarrik aurikula/bentrikulua) perikardio barrunbean kokatzen dira.
  - **F** `w10/2/p9/s2` Bikoitzak diren aurikulak eta zain sinuak perikardio barrunbe kanpoan dagoen septum transversumean kokatzen dira, enbrioiaren lepo mailan gutxi gorabehera.
- Arbela `b-bidea`: Odolaren bidea: zainak, zain sinuak, atal aurikularra, atal bentrikularra, atal bulbarra
  - **F** `w10/2/p10/s1` Odolaren bidea: Zainak → Zain sinuak → Atal aurikularra → Atal bentrikularra → Atal bulbarra.
- Galdera (order): Ordenatu odolaren bidea bihotz hodian, sartzen denetik irteten den arte.

## 5. Lakioa

Etapa: `bihotz-lakioa` · 13 lerro · ~80 s hitz eginda

1. «23. egunean, bihotz hodi luze eta zuzena tolesten hasten da: lakio bat sortuko du.»
  _t=0 · argi: bihotz-hodia_
  - **F** `w10/2/p12/s1` Garapenaren 23. egunean luzea eta zuzena den bihotz hodia tolesten hasten da, bihotz lakio bat sortzeko.

2. «Alde zefalikoa, arteria bulboa, aurrera, behera eta eskuinera abiatzen da.»
  _t=0.12 · emphasis · argi: atal-bulbarra · arbelean: b-lakio-goi_
  - **F** `w10/2/p13/s1` ●​ Alde zefalikoa (arteria bulboa): aurrera, behera eta eskuinera abiatzen da.

3. «Alde kaudala, zain sinua eta aurikula, kontrakoa: atzera, gora eta ezkerrera.»
  _t=0.26 · emphasis · argi: atal-aurikularra, zain-sinua · arbelean: b-lakio-behe_
  - Ez dut ulertu: «Hodiaren goiko aldea aurrera eta behera doa; behekoa, atzera eta gora: bata bestearen kontra.»
  - **F** `w10/2/p13/s1` ●​ Alde zefalikoa (arteria bulboa): aurrera, behera eta eskuinera abiatzen da.
  - **F** `w10/2/p14/s1` ●​ Alde kaudala (zain sinua eta aurikula): atzera, gora eta ezkerrera abiatuko da.

4. «Atalez atal: atal bulbobentrikularra aurrera, behera eta eskuinera; atal bentrikularra, ezkerrera.»
  _t=0.4 · argi: atal-bulbobentrikularra, atal-bentrikularra_
  - **F** `w10/2/p16/s1` ● Atal bulbarra/bulbobentrikularra (atal bulbarra eta bentrikularra): aurrera, behera eta eskuinera abiatzen da.
  - **F** `w10/2/p17/s1` ● Atal bentrikularra (atal bulbarraren jarraipena): ezkerrera

5. «Atal aurikularrak kontrako mugimendua egiten dute: ezkerrera, atzera eta gora. Bulboaren goi atzekaldean geratzen dira.»
  _t=0.4 · emphasis · argi: atal-aurikularra, zain-sinua, atal-bulbarra_
  - **F** `w10/2/p18/s1` ● Atal aurikularrak (bentrikularraren jarraipena) (beheko atalak) kontrako mugimendua egiten dute: ezkerrera, atzera eta gora, beraz atal bulbarraren goi atzekaldean gelditu.

6. «Eta zain sinuetan, enbrioiaren zainak kokatzen dira.»
  _t=0.4 · argi: zain-sinua_
  - **F** `w10/2/p19/s1` ● Zain sinuak (aurikularen jarraipena): hor enbrioiaren zainak kokatu.

7. «Tolestu ahala, bikoitzak diren egiturak fusionatzen dira, eta egitura komunak bilakatzen dira: bihotz lakioa.»
  _t=0.58 · argi: atal-aurikularra, zain-sinua, bihotz-lakioa_
  - **F** `w10/2/p20/s1` Zuzena den bihotz hodia tolesten hasten da, tolespen hau ematen den heinean, bikoitzak diren egiturak fusionatzen dira, eta egitura komunak bilakatzen dira.
  - g `w10/2/p20/s2` Honela, bihotz lakio bat sortzen da.

8. «Kontuan hartu: bihotza aurretik begiratzen dugu, beraz eskuma eta ezkerra alderantziz daude.»
  _t=0.7 · caution · argi: atal-bulbarra · arbelean: b-aurretik_
  - Ez dut ulertu: «Enbrioiaren eskuina zure ezkerrean dago: bulboa eskuinera doa, baina pantailan ezkerrera.»
  - **F** `w10/2/p20/s4` Kontuan hartu bihotza aurretik begiratzen gaudela irudian: eskuma eta ezkerra alderantziz daude.

9. «28. egunean, atal bulbarra lakioaren aurre eskuinaldean dago, eta atal bentrikularra ezkerrean.»
  _t=0.8 · argi: atal-bulbarra, atal-bentrikularra_
  - g `w10/2/p21/s1` 28. egunerako prozesu hau amaitu egiten da.
  - **F** `w10/2/p21/s2` Hurrengo irudian ikusten den moduan, hasieran alde zefalikoan dagoen atal bulbarra (arteria bulboa, behera eta eskuinera jaisten da) bihotz lakioaren aurre eskuinaldean kokatzen da, eta berarekin jarraia den atal bentrikularra (ezkerrean) ezkerrean kokatzen da, eta hau erreten aurikulubentrikularraren (zuloa) bitartez jarraia da goi-atzekaldean gelditu den atal aurikularrarekin (goi atzekaldean).

10. «Atal bentrikularra goi atzekaldeko atal aurikularrarekin jarraia da, erreten aurikulubentrikularraren bidez.»
  _t=0.8 · argi: atal-bentrikularra, erreten-aurikulubentrikularra, atal-aurikularra_
  - **F** `w10/2/p21/s2` Hurrengo irudian ikusten den moduan, hasieran alde zefalikoan dagoen atal bulbarra (arteria bulboa, behera eta eskuinera jaisten da) bihotz lakioaren aurre eskuinaldean kokatzen da, eta berarekin jarraia den atal bentrikularra (ezkerrean) ezkerrean kokatzen da, eta hau erreten aurikulubentrikularraren (zuloa) bitartez jarraia da goi-atzekaldean gelditu den atal aurikularrarekin (goi atzekaldean).

11. «Atal aurikularra, bere aldetik, atzeko zain sinuarekin jarraia da.»
  _t=0.8 · argi: atal-aurikularra, zain-sinua_
  - g `w10/2/p21/s3` Aldi berean, atal aurikularra, atzealdean dagoen zain-sinuarekin (atzean) jarraia da (komunikatuta geratzen da atzeko paretatik).

12. «Atal guztiak jarraiak dira oraindik: ez da trenkadarik agertu.»
  _t=0.8 · emphasis · argi: atal-bulbarra, atal-bentrikularra, atal-aurikularra, zain-sinua · arbelean: b-28_
  - **F** `w10/2/p21/s4` Beraz, bihotz lakio honetako atalak jarraiak dira bata bestearekin, oraindik ez da trenkadarik agertu.

13. «Begiratu orain bihotza aurretik ikusita: hasierako hodi zuzena eta lakioa, bata bestearen gainean.»
  _t=0.92 · argi: bihotz-lakioa_
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
- Galdera (pool): mikro:10/bihotz-lakioa:2
- Galdera (pool): mikro:10/bihotz-lakioa:6

## 6. Atal bulbarra

Etapa: `atal-bulbarra` · 13 lerro · ~75 s hitz eginda

1. «Arteria bulboaren urrutiko zatia aorta zakua da, ezker eta eskuineko aorta dortsalekin komunikatuta.»
  _t=0 · argi: aorta-zakua, aorta-dortsalak, atal-bulbarra_
  - **F** `w10/3.1/p3/s1` Arteria bulbo honetako urrutiko zatia arteria edo aorta zakua da, eta hau komunikatuta dago ezkerrean eta eskubian kokatuta dauden aorta dortsalekin, komunikazio ezberdinen bidez.

2. «Bihotzetik ateratzen den odola aorta arkuen bidez heltzen da atzekaldeko aorta dortsaletara.»
  _t=0 · argi: aorta-arkuak, aorta-dortsalak_
  - g `w10/3.1/p3/s2` Komunikazio horiek aorta arkuak izenekoak dira eta hauek tolesdura zefalokaudalean agertzen dira (Diskoak tolespen zefalokaudala egiten duen bitartean aorta dortsaletatik komunikazio ezberdinak agertzen dira).
  - **F** `w10/3.1/p3/s4` Beraz, bihotz lakio honetako arteria muturretik ateratzen den odola komunikazio hauen bidez (aorta arkuak) atzekaldean dauden aorta dortsaletara helduko da.

3. «Arteria bulboan hiru azpiatal bereizten dira: hurbileko atala, arteria konoa eta enbor arteriosoa.»
  _t=0.18 · emphasis · argi: atal-bulbarra, bulboaren-hurbileko-atala, arteria-konoa, enbor-arteriosoa_
  - **F** `w10/3.1/p3/s5` Arteria bulbo honetan hiru azpiatal bereizten dira:

4. «Hurbileko atala zabalena da. Bere paretan muskuluak agertzen dira, eta muskulu trenkadak sortzen dituzte.»
  _t=0.38 · argi: bulboaren-hurbileko-atala, muskulu-trenkadak_
  - **F** `w10/3.1/p4/s1` ● Hurbileko ataletik: (zabalena den atala da) Atal zabal honen paretan hasten dira muskuluak agertzen eta muskulu horiek muskulu trenkadak sortzen dituzte.

5. «Hortik eskuineko bentrikuluaren atal trabekulatua sortzen da: hasierako eskuineko bentrikulua.»
  _t=0.38 · emphasis · argi: hasierako-eskuineko-bentrikulua · arbelean: tz-hurbileko_
  - **F** `w10/3.1/p4/s2` Beraz, hemendik behin-betiko bihotzaren eskuineko bentrikuluak duen atal trabekulatua sortzen da (hasierako eskuineko bentrikulua).

6. «Hori izango da eskuineko bentrikuluaren atalik garrantzitsuena, baina ez bakarra.»
  _t=0.38 · argi: hasierako-eskuineko-bentrikulua_
  - **F** `w10/3.1/p4/s4` Hori izango da behin betiko eskuineko bentrikuluak izango duen atalik garrantzitsuena, baina ez bakarra.

7. «Kontuz: eskuineko bentrikulu primitiboa atal bulbarretik dator, ez atal bentrikularretik.»
  _t=0.38 · caution · argi: hasierako-eskuineko-bentrikulua, bulboaren-hurbileko-atala, atal-bulbarra_
  - **F** `w10/3.1/p4/s2` Beraz, hemendik behin-betiko bihotzaren eskuineko bentrikuluak duen atal trabekulatua sortzen da (hasierako eskuineko bentrikulua).

8. «Erdiko atala, arteria konoa, trenkadatu egiten da: trenkada batek bitan banatzen du.»
  _t=0.56 · argi: arteria-konoa_
  - **F** `w10/3.1/p5/s1` ● Bitarteko (erdiko) atala edo arteria konoa: bertatik sortzen dira bi (eskuin eta ezkerreko) bentrikuletako atal lisoak edo infundibuluak.
  - **F** `w10/3.1/p5/s3` Arteria konoa trenkadatu egingo da eta espazio horretan trenkada bat agertuko da, espazio hori bitan banatuz.

9. «Bi espazio horiek bi bentrikuluen atal lisoak dira: infundibuluak.»
  _t=0.56 · emphasis · argi: infundibuluak · arbelean: tz-konoa_
  - **F** `w10/3.1/p5/s1` ● Bitarteko (erdiko) atala edo arteria konoa: bertatik sortzen dira bi (eskuin eta ezkerreko) bentrikuletako atal lisoak edo infundibuluak.
  - g `w10/3.1/p5/s4` Bi espazio horiek izango dira, hain zuzen ere, bi bentrikuluek dituzten atal lisoak edo infundibuluak.

10. «Urruneko atala, enbor arteriosoa, ere trenkadatu egiten da.»
  _t=0.72 · argi: enbor-arteriosoa_
  - **F** `w10/3.1/p6/s1` ● Urruneko atala edo enbor arteriosoa/arteriala/arteria enborra: Trenkadatzen da eta bertatik sortzen dira bi bentrikuluetatik irteten diren birika arteriaren/ enborraren hasierako zatiak eta sustraiak (eskuineko bentrikuluaren infundibulutik) eta aorta arteriaren hasierako zatiak eta sustraiak (ezkerreko bentrikuluaren infundibulutik).

11. «Hortik birika enborraren eta aortaren hasierako zatiak eta sustraiak sortzen dira.»
  _t=0.72 · emphasis · argi: birika-enborraren-sustraiak, aortaren-sustraiak · arbelean: tz-enborra_
  - **F** `w10/3.1/p6/s1` ● Urruneko atala edo enbor arteriosoa/arteriala/arteria enborra: Trenkadatzen da eta bertatik sortzen dira bi bentrikuluetatik irteten diren birika arteriaren/ enborraren hasierako zatiak eta sustraiak (eskuineko bentrikuluaren infundibulutik) eta aorta arteriaren hasierako zatiak eta sustraiak (ezkerreko bentrikuluaren infundibulutik).

12. «Bereizi ondo: konotik atal lisoak sortzen dira; enborretik, arteria handien sustraiak.»
  _t=0.72 · emphasis · argi: arteria-konoa, enbor-arteriosoa, infundibuluak_
  - Ez dut ulertu: «Erdiko atalak bentrikuluen barruko atal lisoak ematen ditu; urrunekoak, bentrikuluetatik irteten diren arteria handien hasiera.»
  - **F** `w10/3.1/p5/s1` ● Bitarteko (erdiko) atala edo arteria konoa: bertatik sortzen dira bi (eskuin eta ezkerreko) bentrikuletako atal lisoak edo infundibuluak.
  - **F** `w10/3.1/p6/s1` ● Urruneko atala edo enbor arteriosoa/arteriala/arteria enborra: Trenkadatzen da eta bertatik sortzen dira bi bentrikuluetatik irteten diren birika arteriaren/ enborraren hasierako zatiak eta sustraiak (eskuineko bentrikuluaren infundibulutik) eta aorta arteriaren hasierako zatiak eta sustraiak (ezkerreko bentrikuluaren infundibulutik).

13. «Laburbilduz: hurbileko atala, eskuineko bentrikulua; konoa, infundibuluak; enborra, sustraiak.»
  _t=0.9 · summary · argi: bulboaren-hurbileko-atala, hasierako-eskuineko-bentrikulua, arteria-konoa, infundibuluak, enbor-arteriosoa, aortaren-sustraiak, birika-enborraren-sustraiak_
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
- Galdera (pool): mikro:10/atal-bulbarra:1
- Galdera (contrast): Arteria konoa eta enbor arteriosoa: zer sortzen da bakoitzetik?

## 7. Bentrikuluak eta aurikulak

Etapa: `atal-bentrikularra` · 9 lerro · ~63 s hitz eginda

1. «Atal bentrikularraren paretan ere muskuluak garatzen dira, eta muskulu trenkadak sortzen dira.»
  _t=0 · argi: hasierako-ezkerreko-bentrikulua, muskulu-trenkadak_
  - **F** `w10/3.2/p3/s1` Atal bentrikularreko paretan muskuluak garatzen hasten dira eta hortik muskulu trenkadak sortzen dira.
  - **F** `w10/3.2/p5/s1` Bihotz hodakiloren atal bentrikularreko paretan, hasierako ezkerreko bentrikulua ere deitua, muskulu trabekuluak garatzen dira, zeinetatik hasierako ezkerreko bentrikuluaren atal trabekulatua sortu egiten da.

2. «Hortik ezkerreko bentrikuluaren atal trabekulatua sortzen da: hasierako ezkerreko bentrikulua.»
  _t=0 · emphasis · argi: hasierako-ezkerreko-bentrikulua · arbelean: tz-bentrikularra_
  - g `w10/3.2/p3/s2` Horrela, hasierako ezkerreko bentrikuluaren atal trabekulatua sortzen da, hau da, hasierako ezkerreko bentrikulua.
  - **F** `w10/3.2/p5/s1` Bihotz hodakiloren atal bentrikularreko paretan, hasierako ezkerreko bentrikulua ere deitua, muskulu trabekuluak garatzen dira, zeinetatik hasierako ezkerreko bentrikuluaren atal trabekulatua sortu egiten da.

3. «Beraz, bi hasierako bentrikuluak jatorri desberdinekoak dira: eskumakoa bulbotik, ezkerrekoa atal bentrikularretik.»
  _t=0.36 · emphasis · argi: hasierako-eskuineko-bentrikulua, hasierako-ezkerreko-bentrikulua_
  - Ez dut ulertu: «Eskuineko bentrikuluaren atal trabekulatua bulboaren hurbileko ataletik dator; ezkerrekoarena, atal bentrikularretik.»
  - **F** `w10/3.2/p4/s1` Bi hasierako bentrikulu hauek (atal bulbarraren hurbileko atala=hasierako eskumako bentrikulua eta atal bentrikularretik sortzen den hasierako ezkerreko bentrikulua) komunikatuta daude bentrikulu arteko zulo primarioaren bitartez.

4. «Bi bentrikulu horiek bentrikulu arteko zulo primarioaren bidez komunikatuta daude.»
  _t=0.36 · argi: bentrikulu-arteko-zulo-primarioa · arbelean: b-zuloa_
  - **F** `w10/3.2/p4/s1` Bi hasierako bentrikulu hauek (atal bulbarraren hurbileko atala=hasierako eskumako bentrikulua eta atal bentrikularretik sortzen den hasierako ezkerreko bentrikulua) komunikatuta daude bentrikulu arteko zulo primarioaren bitartez.

5. «Atal bentrikularra goi atzekaldeko atal aurikular komunarekin komunikatuta dago, erreten aurikulubentrikularraren bidez.»
  _t=0.66 · argi: atal-bentrikularra, atal-aurikularra, erreten-aurikulubentrikularra_
  - **F** `w10/3.2/p6/s1` Bihotz lakioaren atal bentrikularra komunikatuta dago goi-atzekaldean gelditu den bihotz lakioaren atal aurikularrarekin (komuna dena) erreten/hodi aurikulubentrikularraren bitartez.

6. «Lakioa eratzean, enbor arteriosoa barrunbe perikardikoaren eskuinean dago; gero, erdira mugitzen da.»
  _etapa atal-aurikularra · t=0 · argi: enbor-arteriosoa, perikardio-barrunbea_
  - **F** `w10/3.3/p3/s1` Hasieran bihotz lakioa eratu bitartean atal bulbarraren arteria enborra kokatzen da barrunbe perikardikoaren eskuineko aldean, eta garapenean, erdira abiatzen da (Alde medialera mugitzen da).

7. «Aldi berean, aurikula komunean bi alboko zabalkuntza agertzen dira: hasierako eskuineko eta ezkerreko aurikulak.»
  _t=0.26 · emphasis · argi: atal-aurikularra, hasierako-eskuineko-aurikula, hasierako-ezkerreko-aurikula · arbelean: b-aurikulak_
  - Ez dut ulertu: «Enborra erdira doan bitartean, aurikula komuna bi aldeetara zabaltzen da: eskuinera eta ezkerrera.»
  - **F** `w10/3.3/p3/s1` Hasieran bihotz lakioa eratu bitartean atal bulbarraren arteria enborra kokatzen da barrunbe perikardikoaren eskuineko aldean, eta garapenean, erdira abiatzen da (Alde medialera mugitzen da).
  - **F** `w10/3.3/p3/s2` Hasieran batean, atal aurikularrean aurikula komuna dago, baina mugimendu honekin batera, komuna den aurikulan bi alboko zabalkuntza agertuko dira: hasierako eskuineko aurikula eta hasierako ezkerreko aurikula.

8. «Orain atalak plano ezberdinetan daude: bentrikuluak aurre eskuinaldean, aurikulak goi atzekaldean.»
  _t=0.5 · emphasis · argi: atal-bentrikularra, atal-aurikularra · arbelean: b-planoak_
  - **F** `w10/3.3/p3/s3` Bihotzaren atal ezberdinak plano ezberdinean daude: bentrikuluak aurre eskuinaldean eta aurikulak goi atzekaldean.

9. «Gogoratu: atzekaldean, aurikulak zain sinuarekin komunikatuta daude, eta hortaz zain guztiekin.»
  _t=0.74 · recall · argi: zain-sinua, atal-aurikularra_
  - g `w10/3.3/p3/s4` Gogoratu atzekaldean komunikatuta mantentzen direla zain sinuarekin, eta hortaz zain guztiekin.

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

Etapa: `zain-sinua` · 15 lerro · ~96 s hitz eginda

1. «Kontuz! Hau atzetik ikusita dago: hemen eskuina eta ezkerra ez dira alderantzizkatu behar.»
  _t=0 · caution · argi: eskuineko-sinu-luzapena, ezkerreko-sinu-luzapena · arbelean: b-atzetik_
  - Ez dut ulertu: «Orain bihotzaren atzean gaude: enbrioiaren eskuina zure eskuinean dago, eta ezkerra zure ezkerrean.»
  - **F** `w10/3.4/p3/s1` Ezkerraldea Eskumaldea
  - **F** `w10/3.4/p4/s1` KONTUZ!
  - **F** `w10/3.4/p4/s2` Atzetik ikusita dago, orduan, eskuina eta ezkerra ez dira alderantzizkatu behar Goi ezkerraldeko irudia (zurixka atala) aurikula komunaren espazioa da, komunikaturik dago zain sinuarekin.

2. «4. astean, zain sinuan zeharkako atala eta ezkerreko eta eskuineko luzapenak bereizten dira.»
  _t=0 · argi: zain-sinua, zain-sinuaren-zeharkako-atala, eskuineko-sinu-luzapena, ezkerreko-sinu-luzapena_
  - **F** `w10/3.4/p4/s3` Garapenaren 4.astean zain-sinuan (kolorezko atala) bereizten dira zeharkako atala eta ezkerreko eta eskubiko luzapenak.

3. «Luzapen bakoitzean enbrioiaren alde horretako 3 zainak bukatzen dira: bitelinoa, zilborrekoa eta kardinala.»
  _t=0 · argi: bitelo-zainak, zilbor-zainak, bena-kardinal-komuna_
  - **F** `w10/3.4/p4/s4` Ezkerreko eta eskumako luzapen horietan bukatzen dira enbrioiaren ezkerreko eta eskuineko zainak, hasiera batean 3 direnak (zain bitelinoak, zilborreko zainak eta kardinalak).

4. «Luzapenen bidez odola zain sinura heltzen da, eta zulo batetik atal aurikularrera pasatzen da.»
  _t=0 · argi: zain-sinua, eskuineko-sinu-luzapena, ezkerreko-sinu-luzapena_
  - **F** `w10/3.4/p4/s5` Bi luzapen edo adar horien bidez odola heltzen da zain sinura eta daukan zuloaren bidez odola pasatzen da atal aurikularrera.

5. «Zain sinuaren eta aurikularen arteko komunikazioa zulo sinoaurikularra da; hasieran oso zabala.»
  _t=0.16 · argi: zulo-sinoaurikularra, zain-sinua_
  - **F** `w10/3.4/p4/s7` Zainaren eta aurikularen arteko komunikazioa, hau da, zati zuria eta urdinaren arteko komunikazioa zulo sinuaurikularra deitzen da (hasieran honako hau oso zabala da, irudian ikusten den moduan).

6. «Hara zilborreko odol oxigenatua eta bitelinoen oxigeno gutxikoa iristen dira; beraz, odola nahasten da.»
  _t=0.16 · why · argi: zulo-sinoaurikularra_
  - **F** `w10/3.4/p5/s2` Esaterako, zilbor-hestetik datorren odola oxigeno altukoa da (odol oxigenatua), eta zain bitelinoak daramatena, gutxikoa.
  - g `w10/3.4/p5/s3` Hauek komunikatuta daudenez zulo sinoaurikularraren bitartez, odol-nahasketa gertatuko da.

7. «Garapenean anastomosiak agertzen dira: ezkerreko zainetako odola eskuineko zainetara desbideratzen da.»
  _t=0.34 · argi: anastomosiak_
  - **F** `w10/3.4/p4/s6` Garapenean, zain sisteman aldaketa anitz gertatzen dira: komunikazioak desberdinak agertu ezkerreko eta eskuineko zainen artean, zain batzuk desagertu (4.asterako desagertzen da karenatik bueltatzen den eskuineko zilborreko zaina, ezkerreko zain bitelinoa eta beranduago gutxi gorabehera 10.astean ezkerreko kardinal komuna).
  - g `w10/3.4/p6/s2` Garapenean, enbrioiaren ezkerreko zainetatik doan odola desbideratu eta eskuineko zainetara (eskuineko zain sinuaren luzapenera) heltzen da, anastomozioak (konexioak) agertzen direlako.

8. «4. asterako desagertzen dira eskuineko zilborreko zaina eta ezkerreko zain bitelinoa.»
  _t=0.34 · emphasis · argi: eskuineko-zilbor-zaina, ezkerreko-zain-bitelinoa_
  - **F** `w10/3.4/p4/s6` Garapenean, zain sisteman aldaketa anitz gertatzen dira: komunikazioak desberdinak agertu ezkerreko eta eskuineko zainen artean, zain batzuk desagertu (4.asterako desagertzen da karenatik bueltatzen den eskuineko zilborreko zaina, ezkerreko zain bitelinoa eta beranduago gutxi gorabehera 10.astean ezkerreko kardinal komuna).

9. «Kontuz: zilborrekoetatik eskuinekoa desagertzen da; bitelinoetatik, berriz, ezkerrekoa.»
  _t=0.34 · caution · argi: eskuineko-zilbor-zaina, ezkerreko-zain-bitelinoa_
  - **F** `w10/3.4/p4/s6` Garapenean, zain sisteman aldaketa anitz gertatzen dira: komunikazioak desberdinak agertu ezkerreko eta eskuineko zainen artean, zain batzuk desagertu (4.asterako desagertzen da karenatik bueltatzen den eskuineko zilborreko zaina, ezkerreko zain bitelinoa eta beranduago gutxi gorabehera 10.astean ezkerreko kardinal komuna).

10. «Beranduago, gutxi gorabehera 10. astean, ezkerreko kardinal komuna ere desagertzen da.»
  _t=0.34 · argi: ezkerreko-kardinal-komuna · arbelean: b-ixten_
  - **F** `w10/3.4/p4/s6` Garapenean, zain sisteman aldaketa anitz gertatzen dira: komunikazioak desberdinak agertu ezkerreko eta eskuineko zainen artean, zain batzuk desagertu (4.asterako desagertzen da karenatik bueltatzen den eskuineko zilborreko zaina, ezkerreko zain bitelinoa eta beranduago gutxi gorabehera 10.astean ezkerreko kardinal komuna).

11. «Horregatik, zain odol ia guztia zain sinuaren eskuineko luzapenera iristen da.»
  _t=0.34 · why · argi: eskuineko-sinu-luzapena_
  - **F** `w10/3.4/p6/s3` Horregatik, enbrioiaren zain-odol ia guztia iristen da zain sinuaren eskuineko luzapenera.

12. «Ondorioz, ezkerreko luzapenak garrantzia galtzen du, eta poliki-poliki txikitzen da.»
  _t=0.34 · why · argi: ezkerreko-sinu-luzapena_
  - **F** `w10/3.4/p6/s4` Ondorioz, zain-sinuaren ezkerreko luzapenak garrantzia galtzen du eta poliki-poliki hasten da txikitzen edo desagertzen.

13. «Ezkerreko luzapenetik bi zain egitura bakarrik sortzen dira: sinu koronarioa eta ezkerreko aurikularen zain laprana.»
  _t=0.52 · emphasis · argi: ezkerreko-sinu-luzapena, sinu-koronarioa, ezkerreko-aurikularen-zain-laprana · arbelean: tz-ezker-luzapena_
  - **F** `w10/3.4/p7/s1` Ondorioz, ezkerreko luzapen honetatik bi zain egitura sortzen dira bakarrik: alde batetik, bihotzaren atze ezkerreko partean kokatzen den zain egitura bat, sinu koronarioa, eta bestetik zain sinu horretan bukatzen edo irekitzen den eta ezkerreko aurikulatik itzultzen den ezkerreko aurikularen zain laprana.

14. «Eskuineko luzapena, aldiz, handituz doa, baita eskuineko zainak ere.»
  _t=0.7 · argi: eskuineko-sinu-luzapena_
  - **F** `w10/3.4/p8/s1` Gainerako odola anastomosi bitartez desbideratzen da eskuineko zainetara eta hauek garrantzi handiagoa irabazten dute.
  - **F** `w10/3.4/p8/s2` Horregatik eskuineko luzapena handituz doa, baita eskuineko zainak ere.

15. «Eta zulo sinoaurikularra eskuinera mugitzen da: hasierako eskuineko aurikulara, atzeko paretan.»
  _t=0.86 · argi: zulo-sinoaurikularra, hasierako-eskuineko-aurikula_
  - **F** `w10/3.4/p8/s3` Hasierako aurikularen eta zain sinuaren arteko komunikazioa eskuinalderantz mugitzen da (Aurikula komunaren eskuineko aldea, hau da, hasierako eskuineko aurikula), zain-sinua aurikula komunaren atzeko paretarekin komunikatzen delarik.

- Arbela `b-atzetik`: Atzetik ikusita: eskuina eta ezkerra ez dira alderantzizkatzen
  - **F** `w10/3.4/p4/s1` KONTUZ!
  - **F** `w10/3.4/p4/s2` Atzetik ikusita dago, orduan, eskuina eta ezkerra ez dira alderantzizkatu behar Goi ezkerraldeko irudia (zurixka atala) aurikula komunaren espazioa da, komunikaturik dago zain sinuarekin.
- Arbela `b-ixten`: 4. asterako ixten dira eskuineko zilborreko zaina eta ezkerreko zain bitelinoa; 10. aste inguruan, ezkerreko kardinal komuna
  - **F** `w10/3.4/p4/s6` Garapenean, zain sisteman aldaketa anitz gertatzen dira: komunikazioak desberdinak agertu ezkerreko eta eskuineko zainen artean, zain batzuk desagertu (4.asterako desagertzen da karenatik bueltatzen den eskuineko zilborreko zaina, ezkerreko zain bitelinoa eta beranduago gutxi gorabehera 10.astean ezkerreko kardinal komuna).
- Galdera (contrast): Aurretik eta atzetik ikusita: zer gertatzen da eskuinarekin eta ezkerrarekin?
- Galdera (predict): Zer uste duzu: ezkerreko zainak ixten direnean, zer gertatuko zaio zain sinuaren ezkerreko luzapenari?
- Galdera (contrast): Zein zain desagertzen da 10. aste inguruan, eta ez 4. asterako?
- Galdera (contrast): Zain sinuaren bi luzapenak: zer gertatzen zaio bakoitzari?

## 9. Eskuineko aurikula

Etapa: `eskuineko-aurikula` · 14 lerro · ~85 s hitz eginda

1. «Eskuin atzeko aurikularen pareta zain sinuarekin komunikatuta dago: hori da zulo sinoaurikularra.»
  _t=0 · argi: zulo-sinoaurikularra_
  - **F** `w10/3.4/p10/s1` Eskuin atzeko aurikularen pareta komunikatuta dago bihotz-hodiaren atzeko zain sinuarekin, aurretik aipatutako mugimenduen ondorioz.
  - g `w10/3.4/p10/s2` Zulo honi zulo sino-aurikularra deritzo.

2. «Zuloaren ertzetan tolesturak agertzen dira: eskuineko eta ezkerreko zain balbulak.»
  _t=0.1 · argi: eskuineko-zain-balbula, ezkerreko-zain-balbula_
  - g `w10/3.4/p10/s3` Sarrera zuloaren inguruan (sinu aurikularraren ertzeetan) tolesturak agertzen dira, eta hortik sortuko dira bi zain-balbula/balbula benosa: eskuineko balbula benosoa eta ezkerreko balbula benosoa (edo zain balbula).

3. «Biak goikaldean fusionatzen dira, eta trenkada bat sortzen dute plano sagitalean: septum spuriuma.»
  _t=0.1 · emphasis · argi: eskuineko-zain-balbula, ezkerreko-zain-balbula, septum-spurium_
  - **F** `w10/3.4/p10/s4` Bi balbula hauek zulo sinoaurikularraren goikaldean (alde kranealan) fusionatuko dira septum trenkadarekin, trenkada bat sortuz plano sagitalean: Septum Spurium/trenkada spuriuma.

4. «Gero, septum spuriuma eta ezkerreko zain balbula septum secundumarekin fusionatzen dira.»
  _t=0.22 · argi: septum-spurium, ezkerreko-zain-balbula, septum-secundum_
  - **F** `w10/3.4/p11/s1` Horrez gain, garapena aurrera doan heinean, honako trenkada hau (septum spurium), ezkerreko zain balbularekin batera, momentu horretan garatzen ari den bi aurikula artean agertzen den aurikularteko trenkadarekin fusionatuko da, trenkada hori Septum secundum da zehazki.

5. «Beraz, aurikula arteko trenkadaren osagai bihurtzen dira.»
  _t=0.22 · argi: septum-secundum · arbelean: tz-ezker-balbula_
  - **F** `w10/3.4/p11/s2` Beraz, bi aurikularteko trenkadaren osagai bat izango dira.

6. «Eskuineko zain balbula goian desagertzen da; behean bitan banatzen da: beheko kabaren balbula eta sinu koronarioaren balbula.»
  _t=0.34 · emphasis · argi: eskuineko-zain-balbula, beheko-kabaren-balbula, sinu-koronarioaren-balbula · arbelean: tz-eskuin-balbula_
  - **F** `w10/3.4/p12/s1` Eskuineko zain balbula bere goiko aldean desagertu egiten da, baina bere beheko aldetik bi balbula berri agertzen dira: beheko bena kabaren balbula eta sinu koronarioaren balbula, egitura hauek sarrera zuloetan dituzten balbulak.

7. «Zain sinua hasierako eskuineko aurikularen atzeko paretan sartzen da: horrela sortzen da behin betiko eskuineko aurikula.»
  _t=0.46 · argi: atal-lisoa, eskuineko-aurikula_
  - g `w10/3.4/p13/s1` Bukatzeko, hasierako eskuineko aurikularen atzealdean kokatuta zegoen zain sinua, garapenean, hasierako eskuineko aurikularen atzeko paretan poliki-poliki inkorporatuko da.
  - g `w10/3.4/p13/s2` Momentu honetan, inkorporazioa gertatu ondoren, hasierako eskuineko aurikula, behin-betiko eskuineko aurikula izatera pasatzen da.

8. «Atzeko pareta lisoa zain sinuaren eskuineko luzapenetik dator, eta gero eta handiagoa egiten da.»
  _t=0.58 · argi: atal-lisoa_
  - g `w10/3.4/p14/s2` Alde batetik, atzeko pareta lisoa, atzeko paretan gehitutako zain sinuetatik eskuineko luzapenetik eratorria dela.
  - g `w10/3.4/p14/s3` Atal liso hau garapenean gero eta handiagoa egiten da eta honek sortuko du behin-betiko eskuin aurikularen ia ia atzeko pareta osoa.

9. «Bertan bukatzen dira goiko eta beheko bena kabak, eta baita sinu koronarioa ere.»
  _t=0.58 · emphasis · argi: atal-lisoa, goiko-kaba-zaina, beheko-kaba-zaina, sinu-koronarioa · arbelean: tz-eskuin-luzapena_
  - g `w10/3.4/p14/s5` Zehazki, atal liso honetan bukatzen dira eskuineko aurikulara iristen diren enbrioiaren zainak, goitik goiko bena kaba sartzen da eta behetik beheko bena kaba.
  - **F** `w10/3.4/p14/s6` Halaber, bihotzeko atzeko paretaren eskuineko atal liso horretan bukatzen da sinu koronarioa (zain sinuaren ezkerreko luzapenatik sortutakoa).
  - **F** `w10/3.4/p23/s1` *Goiko eta beheko bena kabak (gorputzeko odol-hodi garrantzitsuenak) iristen dira eskuineko aurikularen atal lisora.

10. «Gainerako pareta atal trabekulatua da: hasierako eskuineko aurikulatik dator, eta belarritxoa barne hartzen du.»
  _t=0.7 · argi: atal-trabekulatua, belarritxoa_
  - **F** `w10/3.4/p14/s7` Beste aldetik, behin-betiko eskuineko aurikularrean atal trabekulatua dago, hasierako eskuineko aurikulatik sortzen dena, behin-betiko eskuineko aurikularen beste atala osatzen du, belarritxo izenez ezaguna (mintz fin bat, oso finak diren muskuluak bertan kokatzen dira, muskulu pektinioak, horregatik eskuineko aurikularen pareta atal trabekulatua dela esaten da).

11. «Bertan muskulu oso finak daude, muskulu pektinioak; horregatik esaten da trabekulatua dela.»
  _t=0.7 · why · argi: muskulu-pektinioak · arbelean: tz-aurikularra_
  - **F** `w10/3.4/p14/s7` Beste aldetik, behin-betiko eskuineko aurikularrean atal trabekulatua dago, hasierako eskuineko aurikulatik sortzen dena, behin-betiko eskuineko aurikularen beste atala osatzen du, belarritxo izenez ezaguna (mintz fin bat, oso finak diren muskuluak bertan kokatzen dira, muskulu pektinioak, horregatik eskuineko aurikularen pareta atal trabekulatua dela esaten da).

12. «Beraz, eskuineko aurikulak bi atal guztiz desberdin ditu: atzeko atal lisoa eta atal trabekulatua.»
  _t=0.7 · summary · argi: eskuineko-aurikula, atal-lisoa, atal-trabekulatua_
  - **F** `w10/3.4/p15/s1` Beraz, eskuineko aurikulak bi atal guztiz desberdin ditu, atzeko atal lisoa non bukatzen diren zain egitura ezberdinak (atal liso hau zain sinutik sortzen da eta atal handiena da) eta atal trabekulatua (gainerako pareta non muskuluak garatzen diren): aurreko pareta, belarritxoa… (hasierako eskuineko aurikulatik sortzen dira).

13. «Bi atalen artean gandor terminala dago, gandor muskular bat.»
  _t=0.8 · argi: gandor-terminala_
  - **F** `w10/3.4/p16/s1` Bi atal horien artean gandortxo (gandor muskularra da) bat egoten da, gandor terminala (atal liso eta atal trabekulatuaren artean) eta horren goiko aldean bihotz eroapen sistemako nodulu sinusala dago, bihotz eroapen sistemako egitura hori non nerbio kinadak sortzen diren, bihotzeko markapasoa dena.

14. «Haren goiko aldean nodulu sinusala dago: bihotzaren markapasoa.»
  _t=0.8 · emphasis · argi: nodulu-sinusala · arbelean: b-gandor_
  - **F** `w10/3.4/p16/s1` Bi atal horien artean gandortxo (gandor muskularra da) bat egoten da, gandor terminala (atal liso eta atal trabekulatuaren artean) eta horren goiko aldean bihotz eroapen sistemako nodulu sinusala dago, bihotz eroapen sistemako egitura hori non nerbio kinadak sortzen diren, bihotzeko markapasoa dena.

- Arbela `b-gandor`: Gandor terminala: atal lisoaren eta trabekulatuaren artean; goian nodulu sinusala (markapasoa)
  - **F** `w10/3.4/p16/s1` Bi atal horien artean gandortxo (gandor muskularra da) bat egoten da, gandor terminala (atal liso eta atal trabekulatuaren artean) eta horren goiko aldean bihotz eroapen sistemako nodulu sinusala dago, bihotz eroapen sistemako egitura hori non nerbio kinadak sortzen diren, bihotzeko markapasoa dena.
- Galdera (contrast): Eskuineko aurikularen bi atalak: nondik dator bakoitza?
- Galdera (pool): w10-q-spurium

## 10. Osatu taula

Etapa: `eskuineko-aurikula` · 1 lerro · ~6 s hitz eginda

1. «Azken zatia: taula osatu oroimenetik, eta gero zenbait galdera, gai osoko zatiak nahastuta.»
  _t=0.9 · summary_
  - **F** `w10/3.4/p15/s1` Beraz, eskuineko aurikulak bi atal guztiz desberdin ditu, atzeko atal lisoa non bukatzen diren zain egitura ezberdinak (atal liso hau zain sinutik sortzen da eta atal handiena da) eta atal trabekulatua (gainerako pareta non muskuluak garatzen diren): aurreko pareta, belarritxoa… (hasierako eskuineko aurikulatik sortzen dira).

- Galdera (fill): klasea:10/taula
- Galdera (pool): w10-q-zilbor-zainak
- Galdera (pool): w10-q-eskuineko-bentrikulua
- Galdera (pool): w10-q-atalak
- Galdera (pool): w10-q-desagertzen
- Galdera (pool): w10-q-planoak
- Galdera (pool): w10-q-atal-lisoa

## Estaldura

- Funtsezko esaldiak: 99 / 189; klaseak esaten ditu: 99.
- Klaseak aipatzen dituen esaldi guztiak: 139.
- Hitz egiteko denbora: ~13 min (galderak aparte).
