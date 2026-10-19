# 11. gaiko klasea: iturriak

_Sortua: `npx tsx scripts/klasea/audit.ts 11`. F = funtsezkoa, g = garrantzitsua._

## 0. Gaur

Etapa: `trenkadatze-mekanismoak` · 3 lerro · ~15 s hitz eginda

1. «Kaixo! Gaur bihotzaren barrunbeak nola banatzen diren ikasiko dugu: trenkadak.»
  _t=0_
  - **F** `w11/1/p3/s1` Hasieran zuzena zen bihotz hodia tolesten hasten da bihotz lakioa eratuz.

2. «Hasieran zuzena zen bihotz hodia tolestu egiten da, eta lakio bat sortzen da.»
  _t=0 · recall_
  - **F** `w11/1/p3/s1` Hasieran zuzena zen bihotz hodia tolesten hasten da bihotz lakioa eratuz.

3. «Trenkadatzea 27. eta 37. egunen artean gertatzen da: 4. eta 5. asteetan, gutxi gorabehera.»
  _t=0.11 · emphasis · arbelean: b-noiz_
  - **F** `w11/1/p4/s1` Bihotzaren trenkadatze prozesua garapenaren 27- 37. egunen artean ematen da; hau da, 4.-5.asteetan, gutxi gorabehera.

- Arbela `b-noiz`: Trenkadatzea: 27–37. egunak (4.–5. asteak)
  - **F** `w11/1/p4/s1` Bihotzaren trenkadatze prozesua garapenaren 27- 37. egunen artean ematen da; hau da, 4.-5.asteetan, gutxi gorabehera.
- Galdera (predict): Zer uste duzu: nola bana daiteke barrunbe bat bitan?

## 1. Bi mekanismoak

Etapa: `trenkadatze-mekanismoak` · 6 lerro · ~39 s hitz eginda

1. «Lehen mekanismoa: barrunbearen paretan goraguneak agertzen dira, endokardio kuxinak.»
  _t=0.22 · argi: endokardio-kuxinak_
  - **F** `w11/1/p5/s1` -1. Barrunbe pareta batean goraguneak agertzen dira eta hauek endokardio kuxinak (edo almoadilatxoak) dira.

2. «Kuxinaren erdigunean zelula kanpoko matrizea dago, eta endokardioak estaltzen du.»
  _t=0.22 · emphasis · argi: kuxinaren-matrizea, endokardioa · arbelean: b-kuxina_
  - **F** `w11/1/p5/s2` Goragune hauen erdigunean zelula kanpoko matrizea dago eta hau estaliz endokardioa.

3. «Aurkako paretan gauza bera gertatzen bada, bi kuxinak hazi eta hurbildu egiten dira, fusionatu arte: trenkada bat.»
  _t=0.35 · emphasis · argi: endokardio-kuxinak · arbelean: b-mek1_
  - **F** `w11/1/p5/s3` Barrunbeen paretetako zelula endokardikoak ugaldu eta, endokardio masa sortzen da; barrunbearen aurkako/kontrako paretan prozesu bera gertatzen bada, bi endokardio kuxin horiek hazi eta elkarrengana hurbiltzen dira fusionatu arte, trenkada bat sortuz.

4. «Beste batzuetan kuxin bakarra sortzen da, eta kontrako paretara iritsi arte luzatzen da.»
  _t=0.5 · argi: endokardio-kuxinak_
  - g `w11/1/p5/s4` Beste batzuetan, bi endokardio kuxin agertu beharrean, barrunbeetako pareta bakarrean sortzen da (endokardio almohadillatxoak).
  - **F** `w11/1/p5/s5` Honako hau luzatu egingo da kontrako paretara iritsi arte eta trenkada osatuko du.

5. «Bigarren mekanismoa bentrikuluetan ikusten da: hasieran bi hasierako bentrikulu daude, eskuinean eta ezkerrean.»
  _t=0.63 · argi: hasierako-eskuineko-bentrikulua, hasierako-ezkerreko-bentrikulua_
  - **F** `w11/1/p6/s1` -2. Beste mekanismoan, bentrikuletan adibidez, hasieran bi hasierako bentrikulu ditugu (eskuin eta ezkerrean).

6. «Barneko bi pareta muskularrak hazi eta fusionatzen dira: trenkada muskularra. Baina ez da osoa.»
  _t=0.75 · emphasis · argi: trenkada-muskularra · arbelean: b-mek2_
  - Ez dut ulertu: «Bi pareta elkarrengana hazten dira eta ukitzean bat egiten dute, baina barrunbea ez da guztiz banatzen.»
  - **F** `w11/1/p6/s2` Zelulen hazkuntzen ondorioz, aldameneetan kokatutako bi barneko pareta muskularrak hazi, kontaktuan jarri eta fusionatu egiten dira, kontaktuaren eraginez trenkada muskular bat sortuz, bi zatitan banatuta utzi gabe, hau da, trenkada hau ezta osoa izango, eta ez du guztiz banatzen barrunbea.

- Arbela `b-kuxina`: Endokardio kuxina: erdian zelula kanpoko matrizea, endokardioz estalia
  - **F** `w11/1/p5/s2` Goragune hauen erdigunean zelula kanpoko matrizea dago eta hau estaliz endokardioa.
- Arbela `b-mek1`: Lehen mekanismoa: kuxinak hazi eta fusionatu, trenkada osoa
  - **F** `w11/1/p5/s3` Barrunbeen paretetako zelula endokardikoak ugaldu eta, endokardio masa sortzen da; barrunbearen aurkako/kontrako paretan prozesu bera gertatzen bada, bi endokardio kuxin horiek hazi eta elkarrengana hurbiltzen dira fusionatu arte, trenkada bat sortuz.
  - **F** `w11/1/p5/s5` Honako hau luzatu egingo da kontrako paretara iritsi arte eta trenkada osatuko du.
- Arbela `b-mek2`: Bigarren mekanismoa (bentrikuluak): bi pareta muskular fusionatu, trenkada ez osoa
  - **F** `w11/1/p6/s1` -2. Beste mekanismoan, bentrikuletan adibidez, hasieran bi hasierako bentrikulu ditugu (eskuin eta ezkerrean).
  - **F** `w11/1/p6/s2` Zelulen hazkuntzen ondorioz, aldameneetan kokatutako bi barneko pareta muskularrak hazi, kontaktuan jarri eta fusionatu egiten dira, kontaktuaren eraginez trenkada muskular bat sortuz, bi zatitan banatuta utzi gabe, hau da, trenkada hau ezta osoa izango, eta ez du guztiz banatzen barrunbea.
- Galdera (pool): mikro:11/trenkadatze-mekanismoak:2
- Galdera (contrast): Bi mekanismoak: zein da haien arteko aldea?

## 2. Septum primuma

Etapa: `septum-primum` · 7 lerro · ~41 s hitz eginda

1. «Hasi gaitezen aurikulekin. Aurikulan bi alboko zabalkuntza daude, baina trenkada bat sortu behar da.»
  _t=0 · argi: hasierako-eskuineko-aurikula, hasierako-ezkerreko-aurikula_
  - **F** `w11/2.1/p3/s1` Aurikula komunari dagokionez (hasiera batean goi-atzealdean kokatzen den barrunbea) nahiz eta hasieratik bi alboko zabalkuntza aurkitu, hasierako ezkerreko eta eskuineko aurikulak sortzeko trenkada sortu behar da.

2. «4. astearen amaieran, sabaian, lehen trenkada sortzen da: septum primuma, endokardio goragune bat.»
  _t=0.14 · emphasis · argi: septum-primum · arbelean: b-primum_
  - **F** `w11/2.1/p3/s4` 4. astearen amaieran, aurikula komunaren sabaian hasierako trenkada (endokardio goragune bat) bat eratzen da: Septum primum.

3. «Erretenaren inguruan bi kuxin agertzen dira: bat goikoa, eta bestea behekoa.»
  _t=0.46 · argi: kuxin-aurikulubentrikularrak_
  - g `w11/2.1/p4/s1` Horrez gain, erreten aurikulubentrikularraren inguruan, bi endokardio goragune agertzen dira: Endokardio almoadilatxoak edo endokardio kuxinak, bat goikoa eta bestea behekoa.

4. «Septum primumaren beheko aldean zulo bat geratzen da: ostium primuma. Hortik odola eskuinetik ezkerrera igarotzen da.»
  _t=0.58 · emphasis · argi: septum-primum, ostium-primuma · arbelean: b-ostium1_
  - **F** `w11/2.1/p4/s2` Septum primum-aren beheko zonaldean, hots, trenkadaren eta endokardio almoadilatxo horien artean, zulo bat eratzen da: Ostium primum-a, hots, Septum primum-a ez da trenkada oso bat, bertatik eskuineko aurikulan dagoen odola ezkerreko aurikulara igaro daiteke.

5. «Itxi aurretik, septum primumaren goiko aldean beste zulo bat irekitzen da: ostium secunduma.»
  _t=0.7 · emphasis · argi: septum-primum, ostium-secunduma_
  - g `w11/2.1/p4/s4` Hala ere, itxiera gertatu aurretik, Septum primum-aren goiko aldean, beste zulo bat agertzen da, Ostium secundum izenekoa.

6. «Horrela, odolak eskuineko aurikulatik ezkerrekora igarotzen jarraitzen du.»
  _t=0.7 · why_
  - g `w11/2.1/p4/s5` Zulo honen bitartez, eskuineko aurikulan dagoen odola ezkerreko aurikulara pasa daiteke.

7. «Ostium primuma, berriz, erretenaren kuxinetatik irteten diren luzapenek ixten dute.»
  _t=0.84 · argi: ostium-primuma, kuxin-aurikulubentrikularrak · arbelean: b-ostium2_
  - **F** `w11/2.1/p4/s3` Garapenean, almoadilatxo hauetatik (erretenekoak) irteten diren luzapen batzuek itxiko dute zulo hori.

- Arbela `b-primum`: Septum primuma: 4. aste amaieran, aurikula komunaren sabaian
  - **F** `w11/2.1/p3/s4` 4. astearen amaieran, aurikula komunaren sabaian hasierako trenkada (endokardio goragune bat) bat eratzen da: Septum primum.
- Arbela `b-ostium1`: Ostium primuma: septum primumaren beheko aldean, kuxinen ondoan
  - **F** `w11/2.1/p4/s2` Septum primum-aren beheko zonaldean, hots, trenkadaren eta endokardio almoadilatxo horien artean, zulo bat eratzen da: Ostium primum-a, hots, Septum primum-a ez da trenkada oso bat, bertatik eskuineko aurikulan dagoen odola ezkerreko aurikulara igaro daiteke.
- Arbela `b-ostium2`: Ostium primuma kuxinen luzapenek ixten dute; aurretik, goian, ostium secunduma irekitzen da
  - **F** `w11/2.1/p4/s3` Garapenean, almoadilatxo hauetatik (erretenekoak) irteten diren luzapen batzuek itxiko dute zulo hori.
  - g `w11/2.1/p4/s4` Hala ere, itxiera gertatu aurretik, Septum primum-aren goiko aldean, beste zulo bat agertzen da, Ostium secundum izenekoa.
- Galdera (pool): mikro:11/septum-primum:4
- Galdera (contrast): Ostium primuma eta ostium secunduma: non dago bakoitza?

## 3. Septum secunduma eta zulo obala

Etapa: `zulo-obala` · 6 lerro · ~43 s hitz eginda

1. «Bitartean, atzean zegoen sinua eskuineko aurikularen atzeko paretara inkorporatzen da.»
  _t=0_
  - **F** `w11/2.2/p3/s1` Hasiera batean aurikula komunaren atzekaldean kokatzen den zain sinua, eskubiko aurikularen atzeko paretara inkorporatzen joango da.

2. «Orduan, septum primumaren eskuinean, sabaitik hasita, bigarren trenkada sortzen da: septum secunduma.»
  _t=0.12 · emphasis · argi: septum-primum, septum-secundum · arbelean: b-secundum_
  - **F** `w11/2.2/p3/s2` Hori gertatzen denean, septum primum-aren eskuineko aldean eta aurikularen sabaiatik hasita, bigarren trenkada bat eratzen da: Septum Secundum.

3. «Hau ere behera hedatzen da, baina ez da osoa: beheko aldean zulo bat du, zulo obala.»
  _t=0.27 · emphasis · argi: septum-secundum, zulo-obala_
  - **F** `w11/2.2/p3/s4` Hau ere beherantz hedatzen da, erreten aurikulubentrikularrerantz, baina honek ere ez ditu guztiz banatzen bi aurikulak, haren beheko aldean zulo bat ere baitu: zulo obala.

4. «Beraz, bi trenkada daude: septum primuma, goian ostium secundumarekin, eta haren eskuinean septum secunduma, behean zulo obalarekin.»
  _t=0.55 · summary · argi: septum-primum, ostium-secunduma, septum-secundum, zulo-obala · arbelean: b-bi-trenkada_
  - **F** `w11/2.2/p4/s1` Beraz, bi aurikuluen artean bi trenkada daude: septum primum-a (goiko partean ostium secundum zuloarekin) eta bere eskuinaldean kokatzen den septum secundum-a (beheko aldean zulo obalarekin).

5. «Jaio arte, odolak bide laprana egiten du: lehenik zulo obaletik, eta gero ostium secundumatik.»
  _t=0.67 · emphasis · argi: zulo-obala, ostium-secunduma · arbelean: b-laprana_
  - **F** `w11/2.2/p5/s1` Hortaz, jaio arte, eskubiko aurikula honetan dagoen odolak, ezkerreko aurikulara igarotzeko (zuloetatik) ibilbide lapran (“oblicuo”) bat jarraitzen du; izan ere, hasieran, odola septum secumdun-aren beheko aldean dagoen zulo obaletik pasatu behar da eta gero, septum primum-aren goiko aldean dagoen ostium secundum zulo horretatik igaro behar da.

6. «Liburu batzuen arabera, septum primumaren goiko ataltxoa desagertzen da, eta beheko atala zulo obalaren balbula bihurtzen da.»
  _t=0.82 · argi: septum-primum, zulo-obalaren-balbula_
  - **F** `w11/2.2/p6/s1` Bestalde, hainbat liburuetan deskribatzen den bezala (ez guztietan), septum primum-aren goiko ataltxoa desagertu egiten da eta, geratzen den beheko ataltxoa, hau da, zulo obalaren parean kokatzen den septum primum-aren beheko atala, zulo obalak duen balbula bilakatuko da (balbula efektua egiten du), baina, nahiz eta balbula bat izan odola septumetatik igarotzen jarraitzen du komunikatuta daudelako.

- Arbela `b-secundum`: Septum secunduma: septum primumaren eskuinean, sabaitik
  - **F** `w11/2.2/p3/s2` Hori gertatzen denean, septum primum-aren eskuineko aldean eta aurikularen sabaiatik hasita, bigarren trenkada bat eratzen da: Septum Secundum.
- Arbela `b-bi-trenkada`: Septum primuma (goian ostium secunduma) eta septum secunduma (behean zulo obala)
  - **F** `w11/2.2/p4/s1` Beraz, bi aurikuluen artean bi trenkada daude: septum primum-a (goiko partean ostium secundum zuloarekin) eta bere eskuinaldean kokatzen den septum secundum-a (beheko aldean zulo obalarekin).
- Arbela `b-laprana`: Jaio arte: zulo obala, gero ostium secunduma (bide laprana)
  - **F** `w11/2.2/p5/s1` Hortaz, jaio arte, eskubiko aurikula honetan dagoen odolak, ezkerreko aurikulara igarotzeko (zuloetatik) ibilbide lapran (“oblicuo”) bat jarraitzen du; izan ere, hasieran, odola septum secumdun-aren beheko aldean dagoen zulo obaletik pasatu behar da eta gero, septum primum-aren goiko aldean dagoen ostium secundum zulo horretatik igaro behar da.
- Galdera (order): Ordenatu odolaren bidea jaio arte, eskuineko aurikulatik ezkerrekora.

## 4. Jaiotzean

Etapa: `jaiotza` · 6 lerro · ~41 s hitz eginda

1. «Jaiotzean birika zirkulazioa eratzen da: odola biriketara doa oxigenatzera, eta ezkerreko aurikulara itzultzen da.»
  _t=0 · argi: ezkerreko-aurikula-jaiotakoan_
  - **F** `w11/2.2/p7/s1` Hala ere, jaiotzaren momentuan, birika zirkulazioa eratzen da eta ondorioz, odola biriketara abiatzen da oxigenatzeko asmoarekin, ezkerreko aurikulara zehazki.

2. «Horregatik, ezkerreko aurikulara gero eta odol gehiago iristen da, eta bertako presioa handitzen da.»
  _t=0.27 · why · argi: ezkerreko-aurikula-jaiotakoan_
  - **F** `w11/2.2/p7/s3` Prozesu hau dela eta, odol kopurua gero eta hadiagoa izango da eta ezkerreko aurikulako presioa handituz joango da.

3. «Presio horrek zulo obalaren balbula septum secundumaren aurka bultzatzen du.»
  _t=0.41 · emphasis · argi: zulo-obalaren-balbula, septum-secundum_
  - **F** `w11/2.2/p7/s4` Horregatik, septum primuma sekundarioaren aurka presionatzen da.

4. «Bi trenkadak fusionatzen hasten dira, eta komunikazioa ixten da: jaio ondoren eta lehen urtean zehar.»
  _t=0.55 · emphasis · argi: zulo-obalaren-balbula, septum-secundum · arbelean: b-ixtea_
  - **F** `w11/2.2/p7/s5` Ondorioz, zulo obalaren balbula zulo obalaren aurka bultzatuko du (septum primum septum sekundum-aren aurka) eta fusionatzen hasiko dira bi aurikulen arteko komunikazioa itxiz, prozesu luze baten bitartez, jaiosteko eta lehenengo urtean zehar jarraitzen duena.

5. «Kontuz: kasuen ehuneko hogeian fusioa ez da osoa, eta arraildura txiki bat geratzen da eskuinetik ezkerrera.»
  _t=0.71 · caution · argi: zulo-obala_
  - **F** `w11/2.2/p7/s6` 2 trenkada hauen fusioa askotan ez da osoa izaten (%20 kasuetan) jaio ostean eta ondorioz, eskuineko aurikulatik ezkerreko aurikulara pasua (arraildura txiki bat) mantentzen da.

6. «Orduan, ezkerreko aurikulan odol oxigenatua eta zain odola nahasten dira: jaioberria urdinxka da, zianosia.»
  _t=0.85 · why · argi: ezkerreko-aurikula-jaiotakoan · arbelean: b-zianosia_
  - **F** `w11/2.2/p7/s7` Horregatik ezkerreko aurikulan nahasten da biriketatik datorren odol oxigenatua, eskuineko aurikulan dagoen zain odolarekin.
  - **F** `w11/2.2/p7/s8` Odol-nahasten honen ondorioz, jaioberrietako kolorea urdinxka izaten da (zianosia, jaioberria zianotikoa).

- Arbela `b-ixtea`: Jaiotzean presioak balbula septum secundumaren aurka; fusioa jaio ondoren eta lehen urtean
  - **F** `w11/2.2/p7/s4` Horregatik, septum primuma sekundarioaren aurka presionatzen da.
  - **F** `w11/2.2/p7/s5` Ondorioz, zulo obalaren balbula zulo obalaren aurka bultzatuko du (septum primum septum sekundum-aren aurka) eta fusionatzen hasiko dira bi aurikulen arteko komunikazioa itxiz, prozesu luze baten bitartez, jaiosteko eta lehenengo urtean zehar jarraitzen duena.
- Arbela `b-zianosia`: Kasuen %20an fusioa ez da osoa: odola nahasten da, zianosia
  - **F** `w11/2.2/p7/s6` 2 trenkada hauen fusioa askotan ez da osoa izaten (%20 kasuetan) jaio ostean eta ondorioz, eskuineko aurikulatik ezkerreko aurikulara pasua (arraildura txiki bat) mantentzen da.
  - **F** `w11/2.2/p7/s8` Odol-nahasten honen ondorioz, jaioberrietako kolorea urdinxka izaten da (zianosia, jaioberria zianotikoa).
- Galdera (predict): Zer uste duzu: jaiotzean, zer gertatuko zaio ezkerreko aurikulako presioari?
- Galdera (pool): mikro:11/jaiotza:3

## 5. Aurikulen paretak

Etapa: `aurikulen-paretak` · 8 lerro · ~50 s hitz eginda

1. «Orain paretak. Aurikula komuna atzean dagoen zain sinuarekin komunikatuta dago, zulo baten bidez.»
  _t=0 · argi: zain-sinua_
  - **F** `w11/2.2/p8/s1` Aurikula komuna, bihotz lakioaren atal aurikularra, nondik sortzen diren eskuineko eta ezkerreko hasierako aurikulak, atzean dagoen zain sinuarekin mantentzen dira komunikatuak, zulo sinuaurikularraren bitartez komunikatuta jarraitzen du.

2. «Zain sinua eskuineko aurikularen atzeko paretara inkorporatzen da: atzeko pareta lisoa sortzen da.»
  _t=0.12 · emphasis · argi: zain-sinua, atal-lisoa_
  - g `w11/2.2/p8/s2` Baina zain sinu hori poliki-poliki inkorporatzen hasten da hasierako eskuineko aurikularen atzeko paretara, eskuineko aurikularen tamaina handituz.
  - **F** `w11/2.2/p9/s1` -​ Atzeko pareta lisoa (jatorria zain sinuan) bertan eskuineko aurikulara iristen diren zainak irekitzen dira (goiko bena kaba (goitik), beheko bena kaba (abdomenean hasi, diafragma zeharkatuz) eta sinu koronarioa (zain sinuaren ezkerraldeko luzapen batetik sortua) (behetik).

3. «Bertan irekitzen dira goiko eta beheko kaba zainak, eta sinu koronarioa.»
  _t=0.12 · argi: goiko-kaba-zaina, beheko-kaba-zaina, sinu-koronarioa · arbelean: tz-esk-aurikula_
  - **F** `w11/2.2/p9/s1` -​ Atzeko pareta lisoa (jatorria zain sinuan) bertan eskuineko aurikulara iristen diren zainak irekitzen dira (goiko bena kaba (goitik), beheko bena kaba (abdomenean hasi, diafragma zeharkatuz) eta sinu koronarioa (zain sinuaren ezkerraldeko luzapen batetik sortua) (behetik).

4. «Gainerako pareta atal aurikularretik dator: atal trabekulatua, belarritxoa, barrutik muskulu pektinioekin.»
  _t=0.25 · emphasis · argi: atal-trabekulatua, belarritxoa, muskulu-pektinioak_
  - **F** `w11/2.2/p10/s1` -​ Bihotz lakioaren atal aurikularretik gainerako eskuin aurikularen pareta muskularra (aurreko pareta) garatuko da: eskuin aurikulako atal trabekulatua.
  - g `w11/2.2/p10/s2` Honek, eskuineko aurikularen belarritxoa osatzen dute.
  - g `w11/2.2/p10/s3` Oso pareta fina da eta barrutik muskulu txikitxo ezberdinak ditu (muskulu pektineoak/peptinatuak).

5. «Bi atalen artean gandor terminala dago, eta haren goiko aldean nodulu sinusala.»
  _t=0.37 · argi: gandor-terminala, nodulu-sinusala · arbelean: b-gandor_
  - **F** `w11/2.2/p11/s1` Bi atalen artean gandor muskular bat dago, gandor terminala, goiko aldean egongo da kokatuta bihotz sistemako nodulu sinusala (bihotzak uzkurtzeko behar dituen nerbio kinadak sortzeko).

6. «Ezkerreko aurikulan, atzeko paretatik ebaginazio bat irteten da: hasierako birika zaina.»
  _t=0.5 · argi: birika-zain-primitiboa_
  - g `w11/2.2/p13/s1` Ezkerreko aurikulan ere atzeko pareta lisoa, eta atal trabekulatua(gainerako/aurreko pareta) daude.
  - **F** `w11/2.2/p13/s2` Baita ere tamainaz handitzen da, garapenean haren atzeko paretatik ebaginazio bat irteten delako: hasierako birika zaina / birika zain primitiboa.

7. «Lau adar ematen ditu, eta birika hastapenetako zainekin kontaktatzen du.»
  _t=0.62 · argi: birika-zain-primitiboa, birika-hastapenak_
  - g `w11/2.2/p13/s3` Adarkatu egiten da (4 adar sortu) eta kontaktatuko da birika hastapenetan dauden birika zainekin (2 ezkerrera ta 2 eskuinera).

8. «Azkenean, lau birika zain inkorporatzen dira, bi birika bakoitzetik: ezkerreko aurikularen atal lisoa osatzen dute.»
  _t=0.76 · emphasis · argi: birika-zainak, ezkerreko-aurikularen-atal-lisoa · arbelean: tz-ezk-aurikula_
  - **F** `w11/2.2/p13/s4` Oso prozesu arraro baten bidez gero azkenean biriketatik irteten den odol oxigenatua ezkerreko aurikulara iritsiko da, atzeko paretara (atal lisoa) 4 birika zain (birika bakoitzetik 2 birika zain irten) iritsiko dira, ezkerreko aurikularen atal lisoa osatuz.

- Taula `tz-esk-aurikula`: Eskuineko aurikula → Zain sinutik → Atal aurikularretik
  - **F** `w11/2.2/p9/s1` -​ Atzeko pareta lisoa (jatorria zain sinuan) bertan eskuineko aurikulara iristen diren zainak irekitzen dira (goiko bena kaba (goitik), beheko bena kaba (abdomenean hasi, diafragma zeharkatuz) eta sinu koronarioa (zain sinuaren ezkerraldeko luzapen batetik sortua) (behetik).
  - **F** `w11/2.2/p10/s1` -​ Bihotz lakioaren atal aurikularretik gainerako eskuin aurikularen pareta muskularra (aurreko pareta) garatuko da: eskuin aurikulako atal trabekulatua.
- Taula `tz-ezk-aurikula`: Ezkerreko aurikula → Lau birika zainetatik → Atal aurikularraren ezkerreko zabalkuntzatik
  - **F** `w11/2.2/p13/s4` Oso prozesu arraro baten bidez gero azkenean biriketatik irteten den odol oxigenatua ezkerreko aurikulara iritsiko da, atzeko paretara (atal lisoa) 4 birika zain (birika bakoitzetik 2 birika zain irten) iritsiko dira, ezkerreko aurikularen atal lisoa osatuz.
  - g `w11/2.2/p13/s5` Gainerako atala (atal trabekulatua), muskulu pektineoekin sortzen da bihotz-lakioaren atal aurikularreko ezkerreko zabalkuntzatik.
- Taula `tz-bentrikuluak`: Bentrikuluak → Arteria konotik: infundibuluak → Hasierako bentrikuluetatik
  - g `w11/5.2/p10/s2` Atal trabekulatuak garatu egiten dira hasierako eskuineko eta ezkerreko bentrikulotik, eta bi bentrikulo horietako atal lisoak arteria kono espaziotik garatzen dira.
- Arbela `b-gandor`: Gandor terminala: atal lisoaren eta trabekulatuaren artean; goian nodulu sinusala
  - **F** `w11/2.2/p11/s1` Bi atalen artean gandor muskular bat dago, gandor terminala, goiko aldean egongo da kokatuta bihotz sistemako nodulu sinusala (bihotzak uzkurtzeko behar dituen nerbio kinadak sortzeko).
- Galdera (pool): mikro:11/aurikulen-paretak:2
- Galdera (contrast): Bi aurikulen atzeko pareta lisoa: nondik dator bakoitza?

## 6. Erreten aurikulubentrikularra

Etapa: `erreten-ab` · 13 lerro · ~93 s hitz eginda

1. «Orain bentrikuluak. Erreten aurikulubentrikularra hodi bat da, plano frontalean, ez horizontalean.»
  _t=0 · argi: erreten-aurikulubentrikularra_
  - **F** `w11/3/p3/s1` Bihotz lakioaren atalak (jarraiak erreten aurikulobentrikularraren bitartez (atal bentrikularra eta aurikularra komunikatu), hodi/kondukto bat den egitura) (gogoratu plano frontalean kokatzen dela erretena, ez horizontalean):

2. «Hasieran atal bentrikularra, hau da, hasierako ezkerreko bentrikulua, goi atzeko aurikula komunarekin komunikatzen du.»
  _t=0 · argi: hasierako-ezkerreko-bentrikulua, aurikula-komuna_
  - **F** `w11/3/p5/s1` -​ Atal bentrikularra komunikatuta mantentzen da aurikula komunarekin erreten aurikulobentrikularraren bitartez.
  - **F** `w11/3/p5/s2` Hasiera batean, erreten aurikulobentrikularrak bihotz lakioaren atal bentrikularra, nundik sortzen da ezkerreko bentrikuluaren atal trabekulatua, goi atzean geratzen den atal aurikularrarekin komunikatzen du.

3. «Hiru prozesu daude. Lehena: bi atalen arteko ertza, hasieran zorrotza, gero eta zapalagoa egiten da.»
  _t=0.1 · argi: ertz-bulbobentrikularra_
  - **F** `w11/3/p6/s1` Erretenaren trenkadatzeak hiru prozesu ditu: (1) bihotz lakioaren atal bulbarraren eta atal bentrikularraren artean dagoen ertza edo gandor bat (hasieran nahiko zorrotza da) gero eta txikiagoa (zapalagoa) egiten da.

4. «Bigarrena: erretena eskuinerantz mugitzen da, eta bi hasierako bentrikuluak goian dagoen aurikularekin komunikatzen ditu.»
  _t=0.2 · emphasis · argi: erreten-aurikulubentrikularra, hasierako-eskuineko-bentrikulua, hasierako-ezkerreko-bentrikulua · arbelean: b-eskuinera_
  - **F** `w11/3/p7/s1` (2) Erreten aurikulobentrikularra eskuinerantz mugitzen da poliki-poliki, mugimendu hori egin ondoren, erreten aurikulobentrikularrak ondoren ez du bakarrik atal bentrikularra atal aurikularrarekin komunikatuko, baizik eta, komunikatuko ditu 2 hasierako bentrikuluak (ezkerrekoa eta eskuinekoa ere) goian dagoen atal aurikularrarekin

5. «Kontuz: erretena plano frontalean dago, ez horizontalean.»
  _t=0.31 · caution · argi: erreten-aurikulubentrikularra_
  - **F** `w11/3/p8/s2` Erretena, plano frontalean dago EZ horizontalean

6. «Hirugarrena: erretenaren ertzetan lau kuxin sortzen dira: goikoa edo dortsala, behekoa eta bi alboetakoak.»
  _t=0.41 · argi: goiko-kuxina, beheko-kuxina, alboko-kuxinak_
  - **F** `w11/3/p9/s1` (3) Erreten honen ertzeetan 4 goragune desberdinak sortzen dira, endokardio kuxinak edo almoadilatxoak (masak).
  - **F** `w11/3/p9/s2` Zehazki, goiko/dortsaleko zati bat, beheko beste bat eta alboetan 2 zati ditu (ezkerrekoa eta eskuinekoa).

7. «Goikoa eta behekoa hurbildu eta fusionatzen dira, eta erretena bi zulotan banatzen da: eskuineko eta ezkerreko zulo aurikulubentrikularrak.»
  _t=0.52 · emphasis · argi: goiko-kuxina, beheko-kuxina, eskuineko-zulo-ab, ezkerreko-zulo-ab · arbelean: b-zuloak_
  - **F** `w11/3/p9/s2` Zehazki, goiko/dortsaleko zati bat, beheko beste bat eta alboetan 2 zati ditu (ezkerrekoa eta eskuinekoa).
  - **F** `w11/3/p9/s3` Garapenean, goikoak eta behekoak, haien artean hurbilduko dira, trenkada sortuz, eta erreten hori, 2 zulo ezberdinetan bihurtuko dute.
  - **F** `w11/3/p10/s1` Hau agertu eta gero erretenean 2 zulo desberdin agertzen dira: ezkerreko eta eskuineko zulo aurikulobentrikularrak.

8. «Zuloak plano frontalean daudelako, kuxin horiei goikoa eta behekoa deitzen zaie.»
  _t=0.63 · why · argi: zulo-aurikulubentrikularrak, goiko-kuxina, beheko-kuxina_
  - **F** `w11/3/p10/s3` Gainera aurikulen eta bentrikuluen kokapena dela eta (plano lapranean daudelarik, ia-ia plano frontalean) 2 zulo hauek plano frontalean kokatuta daude (ez plano horizontalean), horregatik kuxinak goikoa eta behekoa dira.

9. «Atal bulbarrean azpiatalak bereizten dira: enbor arteriosoa, arteria konoa eta hurbileko atala, eskuineko bentrikuluaren jatorria.»
  _t=0.74 · recall · argi: atal-bulbarra, enbor-arteriosoa, arteria-konoa, bulboaren-hurbileko-atala_
  - **F** `w11/3/p4/s1` -​ Atal aurikularra/bulbarra; hemendik bereizten dira azpiatal desberdinak: enbor arteriosoa, arteria konoa, hurbileko atala (hemendik sortzen da eskuineko bentrikularen atal trabekulatsua)....

10. «Albotik ikusita: atal bulbarra aurrean dago, aurrera, behera eta eskuinera abiatuta; atal bentrikularra haren ezkerrean.»
  _t=0.74 · emphasis · argi: atal-bulbarra, atal-bentrikularra_
  - **F** `w11/3/p11/s1` Bulboa, aurrera behera eta eskuinera abiatzen da.
  - g `w11/3/p12/s1` ALBOTIK IKUSITA:
  - **F** `w11/3/p13/s1` -​ Atal bulbarra: aurrera, behera eta eskuinera; aurrekaldean kokatzen da
  - **F** `w11/3/p14/s1` -​ Atal bentrikularra: bulboaren ezkerraldean dago

11. «Atal aurikularra eta zain sinua, berriz, atal bulbarraren atzean daude, eta jarraiak dira.»
  _t=0.74 · argi: atal-aurikularra, zain-sinua, atal-bulbarra_
  - **F** `w11/3/p15/s1` -​ Atal aurikularra: gora, aurrera eta atzera abiatu, atal bulbarraren atzekaldean kokatu (zain sinuarekin batera) Ondorioz, atal aurikularra eta horren atzean gelditzen den zain sinua jarraiak dira.

12. «Kontuz: apunteek haien norabidea bi eratara idazten dute: gora, atzera eta ezkerrera, edo gora, aurrera eta atzera.»
  _t=0.74 · caution_
  - **F** `w11/3/p11/s3` Atal aurikularra eta bere jarraipena, zain sinua, gora atzera eta ezkerrera abiatzen dira; ondorioz, mugimendu hauen ondoren, bihotz hodia bihotz lakioan bihurtzen da.
  - **F** `w11/3/p15/s1` -​ Atal aurikularra: gora, aurrera eta atzera abiatu, atal bulbarraren atzekaldean kokatu (zain sinuarekin batera) Ondorioz, atal aurikularra eta horren atzean gelditzen den zain sinua jarraiak dira.

13. «Bi hasierako bentrikuluen arteko komunikazioari bentrikulu arteko zulo primarioa deitzen zaio.»
  _t=0.88 · argi: bentrikulu-arteko-zulo-primarioa · arbelean: b-zulo-primarioa_
  - **F** `w11/3/p16/s1` -​ Bi hasierako bentrikulen arteko komunikazioa, bentrikulen arteko zulo primarioa deitzen da.

- Arbela `b-eskuinera`: Erretena eskuinerantz: bi bentrikuluak aurikularekin komunikatuta
  - **F** `w11/3/p7/s1` (2) Erreten aurikulobentrikularra eskuinerantz mugitzen da poliki-poliki, mugimendu hori egin ondoren, erreten aurikulobentrikularrak ondoren ez du bakarrik atal bentrikularra atal aurikularrarekin komunikatuko, baizik eta, komunikatuko ditu 2 hasierako bentrikuluak (ezkerrekoa eta eskuinekoa ere) goian dagoen atal aurikularrarekin
- Arbela `b-zuloak`: 4 kuxin; goikoa eta behekoa fusionatu: eskuineko eta ezkerreko zulo aurikulubentrikularrak (plano frontalean)
  - **F** `w11/3/p9/s1` (3) Erreten honen ertzeetan 4 goragune desberdinak sortzen dira, endokardio kuxinak edo almoadilatxoak (masak).
  - **F** `w11/3/p9/s3` Garapenean, goikoak eta behekoak, haien artean hurbilduko dira, trenkada sortuz, eta erreten hori, 2 zulo ezberdinetan bihurtuko dute.
  - **F** `w11/3/p10/s1` Hau agertu eta gero erretenean 2 zulo desberdin agertzen dira: ezkerreko eta eskuineko zulo aurikulobentrikularrak.
  - **F** `w11/3/p10/s3` Gainera aurikulen eta bentrikuluen kokapena dela eta (plano lapranean daudelarik, ia-ia plano frontalean) 2 zulo hauek plano frontalean kokatuta daude (ez plano horizontalean), horregatik kuxinak goikoa eta behekoa dira.
- Arbela `b-zulo-primarioa`: Bentrikulu arteko zulo primarioa: bi hasierako bentrikuluen arteko komunikazioa
  - **F** `w11/3/p16/s1` -​ Bi hasierako bentrikulen arteko komunikazioa, bentrikulen arteko zulo primarioa deitzen da.
- Galdera (pool): mikro:11/erreten-ab:2
- Galdera (contrast): Eskuineko eta ezkerreko zulo aurikulubentrikularrak: zer komunikatzen du bakoitzak?

## 7. Balbula aurikulubentrikularrak

Etapa: `balbula-ab` · 6 lerro · ~44 s hitz eginda

1. «Zulo horien inguruan mesenkima goraguneak sortzen dira, kuxinetatik: hortik balbula aurikulubentrikularrak.»
  _t=0 · argi: balbula-aurikulubentrikularrak_
  - **F** `w11/3/p17/s1` Gainera, aipatutako zuloen inguruan mesenkima goraguneak sortzen dira (endokardio almoadilatxoetatik sortuak).
  - g `w11/3/p17/s3` Bi zulo hauetan mesenkima goragune horietatik, balbula aurikulobentrikularrak sortzen dira:

2. «Eskuineko zuloan balbula trikuspidea dago, hiru balbarekin; ezkerrekoan, bikuspidea edo mitrala, bi balbarekin.»
  _t=0.15 · emphasis · argi: balbula-trikuspidea, balbula-mitrala · arbelean: b-ab-balbulak_
  - **F** `w11/3/p18/s1` -​ Eskuineko zulo aurikulabentrikularrean kokatutako balbulari, balbula trikuspide deritze, hiru balba (mintz antzeko egiturak) edo erpin nagusi dituelako.
  - **F** `w11/3/p19/s1` -​ Ezkerreko zulo aurikulabentrikularrean kokatzen den balbula, balbula bikuspidea edo mitrala deritze, honek bi balba dituelako.

3. «Kontuan hartu: zuloetatik pasatzen den odolak goraguneen azalera bentrikularra zulatzen du, eta balbak mehetzen dira.»
  _t=0.31 · caution · argi: balbula-trikuspidea, balbula-mitrala_
  - **F** `w11/3/p20/s1` *kontuan hartu, zulo aurikulobentrikular horietatik, pasatzen den odolak, mesenkima goraguneetako azalera bentrikularra zulatzen hasten da, eta gero eta meheagoak egiten dira.

4. «Balbak muskulu papilarrei lotuta geratzen dira, soka tendinosoen bidez: hasieran muskularrak, gero fibrotsuak.»
  _t=0.47 · emphasis · argi: muskulu-papilarrak, soka-tendinosoak · arbelean: b-sokak_
  - **F** `w11/3/p21/s1` Balbuletako balba horiek muskulu papilar izeneko bentrikuletako paretetako muskuluekin lotuta mantentzen dira soka tendinosoei esker (hauek hasieran muskularrak dira; hala ere garapenean fibrotsuak bilakatuko dira, egitura tendinosoak).

5. «Muskulu papilarrak uzkurtzean, sokek balbak mugitzen dituzte: zuloa ireki edo itxi egiten da, odola pasa dadin.»
  _t=0.65 · why · argi: muskulu-papilarrak, soka-tendinosoak_
  - **F** `w11/3/p21/s3` Muskulu papilar horiek uzkurtzen direnean, soka tendinotsuetatik tiratzen dute paretako balbak mugitzeko, zulo aurikulobentrikularra zabalduz edo itxiz, odola pasa dadin.

6. «Hiru soka mota daude: lehen, bigarren eta hirugarren mailakoak, balbetan non insertatzen diren arabera.»
  _t=0.81 · argi: soka-tendinosoak_
  - **F** `w11/3/p22/s1` Hiru motako sokak daude: lehen mailakoak, bigarren mailakoak eta hirugarren mailakoak.
  - **F** `w11/3/p22/s2` Hauen arteko desberdintasuna balbulatan nun insertatzen edo finkatzen diren araberakoa da.

- Arbela `b-ab-balbulak`: Eskuinean trikuspidea (hiru balba); ezkerrean bikuspidea edo mitrala (bi balba)
  - **F** `w11/3/p18/s1` -​ Eskuineko zulo aurikulabentrikularrean kokatutako balbulari, balbula trikuspide deritze, hiru balba (mintz antzeko egiturak) edo erpin nagusi dituelako.
  - **F** `w11/3/p19/s1` -​ Ezkerreko zulo aurikulabentrikularrean kokatzen den balbula, balbula bikuspidea edo mitrala deritze, honek bi balba dituelako.
- Arbela `b-sokak`: Soka tendinosoak: balbetatik muskulu papilarretara; hasieran muskularrak, gero fibrotsuak
  - **F** `w11/3/p21/s1` Balbuletako balba horiek muskulu papilar izeneko bentrikuletako paretetako muskuluekin lotuta mantentzen dira soka tendinosoei esker (hauek hasieran muskularrak dira; hala ere garapenean fibrotsuak bilakatuko dira, egitura tendinosoak).
- Galdera (contrast): Bi zulo aurikulubentrikularren balbulak: zein dago bakoitzean?
- Galdera (pool): mikro:11/balbula-ab:3

## 8. Bentrikuluen trenkada

Etapa: `bentrikulu-arteko-trenkada` · 7 lerro · ~46 s hitz eginda

1. «Gogoratu: hasierako eskuineko bentrikulua bulbotik dator, eta ezkerrekoa atal bentrikularretik.»
  _t=0 · recall · argi: hasierako-eskuineko-bentrikulua, hasierako-ezkerreko-bentrikulua_
  - **F** `w11/4/p3/s1` *Gogoratu, bihotz lakioaren arteria enborraren hurbileko ataletik hasierako eskuineko bentrikulua (atal trabekulatua) agertzen dela, eta bihotz lakioaren atal bentrikularretik, hasierako ezkerreko bentrikulua garatzen dela.

2. «Aurikulak bentrikuluen atzean daude; eta eskuineko bentrikulua ezkerrekoa baino pixka bat aurrerago.»
  _t=0.17 · emphasis · argi: hasierako-eskuineko-bentrikulua · arbelean: b-aurrerago_
  - g `w11/4/p4/s1` *Bentrikuluak eta aurikulak ez daude plano berean kokatuta (zuloak lapranak dira), aurikulak bentrikuluen atzeko partean kokatuta daude.
  - **F** `w11/4/p4/s2` Aldi berean, bi bentrikuluak ez daude plano berean kokatuta ezta ere, kasu honetan, eskuineko bentrikulua ezkerrekoa baino pixka bat aurrerago kokatzen da.*

3. «4. astearen bukaeran, bentrikuluen paretetan muskulu trenkadak agertzen dira, eta muskulu papilarrak.»
  _t=0.34 · argi: muskulu-trenkadak, muskulu-papilarrak_
  - **F** `w11/4/p5/s2` 4. astearen bukaeran, bi bentrikuluetako pareta, batez ere, miokardio horretatik, garapenean, muskulu trenkada/trabekula pila agertzen dira, baita bentrikuluetako paretetan muskulu papilarrak ere, soka tendinosoak insertatzeko.

4. «Bentrikuluak handitzen dira, eta haien barneko paretak hurbildu egiten dira: hortik trenkada muskularra.»
  _t=0.5 · why · argi: trenkada-muskularra_
  - **F** `w11/4/p6/s1` Beraz, miokardioaren garapenarekin, bi bentrikuluak geroz eta handiagoak egiten dira eta, ondorioz, bi bentrikuluen barruko paretak haien artean hurbildu egiten dira.
  - **F** `w11/4/p6/s2` Hori dela eta, bentrikulu arteko trenkadaren zati muskularra sortzen da, bentrikulu arteko trenkada muskularra.

5. «Trenkada hau ez da osoa: haren goiko aldetik, odola eskuineko bentrikulutik ezkerrekora pasa daiteke.»
  _t=0.5 · emphasis · argi: trenkada-muskularra, bentrikulu-arteko-zulo-primarioa · arbelean: b-ez-osoa_
  - **F** `w11/4/p6/s3` Trenkada muskular hau ez da osoa, ez ditu guztiz banatzen bentrikuluak, eta, hala, trenkada muskularraren goiko aldetik, eskuineko bentrikuluan dagoen odola ezkerrekora pasa daiteke.

6. «Arteria konoa trenkadatzean, bigarren trenkada bat agertzen da, ez muskularra: mintzezko trenkada.»
  _t=0.72 · emphasis · argi: arteria-konoa, mintzezko-trenkada_
  - **F** `w11/4/p6/s4` Arteria konoaren trenkadatze prozesuarekin batera, hemen bertan bentrikulu arteko bigarren trenkada bat agertzen da, muskularra ez den trenkada bat: bentrikulu arteko mintzezko trenkada (arteria konoaren trenkadaren beheko aldea).

7. «Beraz, trenkada horrek bi atal ditu: muskularra eta mintzezkoa; eta bentrikuluak guztiz banatuta geratzen dira.»
  _t=0.72 · summary · argi: trenkada-muskularra, mintzezko-trenkada · arbelean: b-bi-atal_
  - **F** `w11/4/p7/s1` Beraz, bi bentrikuluen artean sortzen den trenkadak, bi atal ditu: muskularra eta mintzezkoa.
  - g `w11/4/p6/s5` Mintzezko trenkada, trenkada muskularrean finkatu ondoren, guztiz banatuta geratzen dira eskuineko eta ezkerreko bentrikuluak.

- Arbela `b-aurrerago`: Aurikulak bentrikuluen atzean; eskuineko bentrikulua pixka bat aurrerago
  - g `w11/4/p4/s1` *Bentrikuluak eta aurikulak ez daude plano berean kokatuta (zuloak lapranak dira), aurikulak bentrikuluen atzeko partean kokatuta daude.
  - **F** `w11/4/p4/s2` Aldi berean, bi bentrikuluak ez daude plano berean kokatuta ezta ere, kasu honetan, eskuineko bentrikulua ezkerrekoa baino pixka bat aurrerago kokatzen da.*
- Arbela `b-ez-osoa`: Trenkada muskularra ez da osoa: goitik odola eskuinetik ezkerrera
  - **F** `w11/4/p6/s3` Trenkada muskular hau ez da osoa, ez ditu guztiz banatzen bentrikuluak, eta, hala, trenkada muskularraren goiko aldetik, eskuineko bentrikuluan dagoen odola ezkerrekora pasa daiteke.
- Arbela `b-bi-atal`: Bentrikulu arteko trenkada: zati muskularra eta mintzezkoa
  - **F** `w11/4/p7/s1` Beraz, bi bentrikuluen artean sortzen den trenkadak, bi atal ditu: muskularra eta mintzezkoa.
- Galdera (pool): mikro:11/bentrikulu-arteko-trenkada:3
- Galdera (contrast): Bentrikulu arteko trenkadaren bi atalak: nondik dator bakoitza?

## 9. Arteria konoa

Etapa: `arteria-konoa` · 9 lerro · ~63 s hitz eginda

1. «Orain irteerak. Atal bulbarrean kiribil formako trenkadak sortzen dira.»
  _t=0 · emphasis · argi: atal-bulbarra_
  - **F** `w11/5/p3/s1` kiribil formako trenkadak

2. «Bentrikuluetan bi atal bereizten dira: atal trabekulatua, muskuluekin, eta atal lisoa, arteriak irteteko.»
  _t=0_
  - g `w11/5.1/p3/s1` Bentrikuletan, guztiz desberdinak diren 2 atal desberdintzen dira: atal trabekulatua (muskuluekin) eta atal liso/infundibulua (arteria desberdinak atera)

3. «Arteria konoaren alboko paretetan bi endokardio kuxin agertzen dira: atze eskuinean eta aurre ezkerrean.»
  _t=0.16 · emphasis · argi: arteria-konoa, konoaren-gandorrak · arbelean: b-kono-gandorrak_
  - **F** `w11/5.1/p5/s2` Arteria kono honen mailan, alboko paretetan, bi endokardio kuxin (endokardio masa almoadillatxoak) agertzen dira: atze-eskuineko aldean eta aurre-ezkerreko aldean.

4. «Bi gandorrak hazi eta fusionatzen dira: arteria konoa trenkadatu egiten da, eta trenkada laprana da.»
  _t=0.34 · argi: arteria-konoa, konoaren-trenkada_
  - **F** `w11/5.1/p5/s3` Bi gandor (endokardio almoadillatxo) horiek hazten dira eta haien artean hurbiltzen dira fusionatu arte, honen ondorioz arteria konoa trenkadatu egiten da.
  - **F** `w11/5.1/p5/s4` Trenkada hau laprana da, izan ere, gandor bat agertu da aurre-eskuinaldean eta bestea atze-ezkerrean.

5. «Kontuz: apunteen hurrengo esaldiak gandorren aldeak alderantziz idazten ditu; gogoratu atze eskuinean eta aurre ezkerrean.»
  _t=0.34 · caution_
  - **F** `w11/5.1/p5/s2` Arteria kono honen mailan, alboko paretetan, bi endokardio kuxin (endokardio masa almoadillatxoak) agertzen dira: atze-eskuineko aldean eta aurre-ezkerreko aldean.
  - **F** `w11/5.1/p5/s4` Trenkada hau laprana da, izan ere, gandor bat agertu da aurre-eskuinaldean eta bestea atze-ezkerrean.

6. «Trenkadaren aurre eskuinaldean eskuineko bentrikuluaren infundibulua geratzen da: hortik birika arteria irtengo da.»
  _t=0.52 · emphasis · argi: eskuineko-infundibulua_
  - **F** `w11/5.1/p5/s5` Trenkada honen aurre-eskuinaldean geratzen den espazioa eskuineko bentrikuluaren infundibulua (atal lisoa) izango da, bertatik irtengo da birika arteria.

7. «Atze ezkerrekoa ezkerreko bentrikuluaren infundibulua da: hortik aorta.»
  _t=0.52 · argi: ezkerreko-infundibulua_
  - g `w11/5.1/p5/s6` Arteria konoaren trenkadaren atze-ezkerreko aldeko espazioa, berriz, ezkerreko bentrikuluaren infundibulua (edo atal lisoa) izango da, bertatik irtengo da aorta arteria.

8. «Biak ez daude plano berean: eskuinekoa askoz aurrerago eta eskuinerago dago. Beraz, birika arteria eta aorta ere ez.»
  _t=0.52 · emphasis · argi: eskuineko-infundibulua, ezkerreko-infundibulua · arbelean: b-infundibuluak_
  - **F** `w11/5.1/p5/s7` Beraz, ikus dezakegu infundibuluak ez daudela plano berean, eskuinekoarena askoz aurrerago eta eskuinerago gelditzen delarik.
  - **F** `w11/5.1/p5/s8` Beraz, bi infundibulu horietatik irteten diren birika arteria eta aorta ez dira plano berean kokatuta egongo.

9. «Konoaren trenkada behetik hazten da, eta trenkada muskularrarekin eta beheko kuxinarekin fusionatzen da: hori da mintzezko zatia.»
  _t=0.74 · argi: konoaren-trenkada, trenkada-muskularra, beheko-kuxina, mintzezko-trenkada_
  - g `w11/5.1/p6/s1` Arteria konoaren trenkada beheko aldetik hazten da eta azkenean fusionatu egiten da, bentrikulu arteko trenkada muskularraren goiko aldearekin, eta baita erreten aurikobentrikularreko beheko/aurreko endokardio almoadillatxoarekin.
  - **F** `w11/5.1/p6/s2` Arteria konoaren beheko ataltxo hau izango da bi bentrikuloen artean kokatzen den bentrikuloen arteko trenkadaren mintzezko zatia (Bi atal ditu, muskularra eta bere gainean mintzezkoa).

- Arbela `b-kono-gandorrak`: Konoan bi gandor: atze-eskuinean eta aurre-ezkerrean; fusionatu, trenkada laprana
  - **F** `w11/5.1/p5/s2` Arteria kono honen mailan, alboko paretetan, bi endokardio kuxin (endokardio masa almoadillatxoak) agertzen dira: atze-eskuineko aldean eta aurre-ezkerreko aldean.
  - **F** `w11/5.1/p5/s3` Bi gandor (endokardio almoadillatxo) horiek hazten dira eta haien artean hurbiltzen dira fusionatu arte, honen ondorioz arteria konoa trenkadatu egiten da.
- Arbela `b-infundibuluak`: Aurre-eskuinean eskuineko infundibulua (birika arteria); atze-ezkerrean ezkerrekoa (aorta)
  - **F** `w11/5.1/p5/s5` Trenkada honen aurre-eskuinaldean geratzen den espazioa eskuineko bentrikuluaren infundibulua (atal lisoa) izango da, bertatik irtengo da birika arteria.
  - g `w11/5.1/p5/s6` Arteria konoaren trenkadaren atze-ezkerreko aldeko espazioa, berriz, ezkerreko bentrikuluaren infundibulua (edo atal lisoa) izango da, bertatik irtengo da aorta arteria.
- Galdera (pool): mikro:11/arteria-konoa:3
- Galdera (contrast): Bi infundibuluak: non dago bakoitza, eta zer irteten da hortik?

## 10. Enbor arteriosoa

Etapa: `enbor-arteriosoa` · 13 lerro · ~82 s hitz eginda

1. «Orain enbor arteriosoa. Hemen ere trenkada bat sortzen da, eta enborra bitan banatzen du.»
  _t=0 · argi: enbor-arteriosoa_
  - **F** `w11/5.2/p3/s1` Enbor arteriosoan eratzen den trenkada trenkada aortiko-pulmonarra da.
  - g `w11/5.2/p3/s2` Trenkada sortu ostean, bitan banatuta gelditzen da: arteria aorta (ezkerreko bentrikuluaren infundibulularekin komunikatuta mantendu) eta birika arteria (eskuineko bentrikuluaren infundibuluarekin komunikatuta).

2. «Bi gandor hurbildu eta hazi egiten dira; baina toki desberdinetan finkatzen direnez, trenkada kiribila da.»
  _t=0.1 · emphasis · argi: enborraren-gandorrak, trenkada-aortikopulmonarra · arbelean: b-kiribila_
  - Ez dut ulertu: «Gandorrak hormaren inguruan biratzen dira; horregatik trenkadak ere biratzen du.»
  - **F** `w11/5.2/p3/s5` Bi trenkada/endokardio almohadillatxo (gandor) horiek bata bestearengana hurbiltzen eta hazten dira, baina enbor arterioso horretan eratzen den trenkada kiribil (espiral) formakoa da, trenkada aortiko pulmonarra du izena eta bitan banatzen du arteria enbor hori.
  - **F** `w11/5.2/p3/s6` Honegatik honen almoadillatxoak toki desberdinetan finkatzen dira.

3. «Kiribila denez, trenkadaren kokapena desberdina da enborraren maila bakoitzean.»
  _t=0.22 · why · argi: trenkada-aortikopulmonarra_
  - **F** `w11/5.2/p3/s8` Hau da, enbor arteriosoaren maila desberdinetan trenkada aortiko pulmonarraren kokapena ezberdina izango dela (kiribil formarengatik):

4. «Hurbileko mailan, behean, trenkada zeharkakoa da: aurrean birika arteria dago, eta atzean aorta.»
  _t=0.22 · emphasis · argi: birika-arteria, aorta_
  - **F** `w11/5.2/p4/s1` -​ Enbor arteriosoan hurbileko atalean (Beheko aldean) hedatutako trenkada zeharkakoa izango da, trenkadaren aurrealdean kokatzen den erretena arteria pulmonarra izango da, eta atzealdekoa aorta izango da (aorta ezkerreko bentrikularen infundibulutik irteten da).
  - g `w11/5.2/p4/s2` Hau da, birika enborra aorta baino aurrerago kokatzen da.

5. «Gorago, tarteko mailan, trenkada aurretik atzera doa: aorta eskuinean dago, eta birika arteria ezkerrean.»
  _t=0.35 · emphasis · argi: aorta, birika-arteria_
  - **F** `w11/5.2/p5/s1` -​ Enbor arteriosoan gorago, tarteko aldean, kiribil formako trenkada hor aurretik atzera abiatutakoa da eta beraz trenkadaren erretenak bata bestearen parean kokatuko dira, aorta eskuinaldean eta birika arteria ezkerraldean.

6. «Urrutiko mailan, goian, berriro zeharkakoa da: orain aorta aurrean dago, eta birika arteria atzean.»
  _t=0.47 · emphasis · argi: aorta, birika-arteria_
  - **F** `w11/5.2/p6/s1` -​ Enbor arteriosoaren urrutiko atalean (goikaldean), berriro, trenkada aortiko pulmonar hori zeharkakoa da eta, kasu honetan, aorta aurreko aldean eta birika arteria (birika enborra) atzean kokatuko dira.

7. «Hala, trenkadak bi erretenetan banatzen du enborra, eta bi hodien kokapena aldatzen da mailaz maila.»
  _t=0.47_
  - **F** `w11/5.2/p7/s2` Trenkada horrek bi erretenetan banatzen du enbor arteriosoa: birika enborra eta aorta, bi egitura horien kokapena desberdina delarik trenkadaren kokapenaren ondorioz.

8. «Behean, trenkada kiribil hau konoaren trenkadarekin fusionatzen da: jarraiak dira.»
  _t=0.59 · emphasis · argi: trenkada-aortikopulmonarra, konoaren-trenkada · arbelean: b-jarraiak_
  - **F** `w11/5.2/p8/s1` Enbor arteriosoan dagoen kiribil formako trenkada hori beheko aldetik fusionatzen da arteria konoaren trenkadarekin jarraiak dira, eta berdina gertatzen zaio arteria konoaren trenkadari.

9. «Fusioaren ondorioz, bentrikuluen arteko mintzezko zatia sortzen da.»
  _t=0.59 · argi: mintzezko-trenkada_
  - **F** `w11/5.2/p8/s3` Fusioaren ondorioz, trenkada muskularrarekin fusionatuta dagoen bentrikulu arteko mintzezko zatia sortzen da.

10. «Beraz, birika arteria aurretik irteten da, eskuineko bentrikulutik; aorta, berriz, atzetik, ezkerrekotik.»
  _t=0.59 · argi: birika-arteria_
  - g `w11/5.2/p8/s4` Eskuineko bentrikuluaren infundibulutik irteten den egitura birika arteria da, eta ezkerreko bentrikulutik ateratzen dena aorta da.
  - **F** `w11/5.2/p8/s5` Beraz aurretik irteten da birika arteria eta trenkada honen atzetik (ezkerreko bentrikuluaren infundibulutik) aorta.

11. «Bihotza apur bat biratuta dago: eskuineko bentrikulua ezkerrekoa baino aurrerago.»
  _t=0.72_
  - **F** `w11/5.2/p9/s1` Bihotza apur bat biratuta dago eta, beraz, eskuineko bentrikulua ezkerrekoa baino pixka bat aurrerago kokatzen da.

12. «Laburbilduz: behean birika arteria aortaren aurrean, tartean parean, eta goian aorta aurrean.»
  _t=0.72 · summary · argi: birika-arteria, aorta · arbelean: b-mailak_
  - **F** `w11/5.2/p9/s3` Hala, beheko aldean, enbor arteriosoaren hurbileko aldean birika arteria aortaren aurrealdean kokatuta dago, baina gero tarteko aldean aorta eta birika arteria parean daude, eta goialdean aorta aurretik kokatzen da (birika arteria eta aorta enbor arteriosotik sortzen dira, kiribil formako trenkada agertu ondoren).

13. «Eta paretak: bentrikuluen atal trabekulatuak hasierako bentrikuluetatik datoz, eta atal lisoak konotik.»
  _t=0.86 · summary · arbelean: tz-bentrikuluak_
  - g `w11/5.2/p10/s2` Atal trabekulatuak garatu egiten dira hasierako eskuineko eta ezkerreko bentrikulotik, eta bi bentrikulo horietako atal lisoak arteria kono espaziotik garatzen dira.

- Arbela `b-kiribila`: Enborraren bi gandor: trenkada aortiko-pulmonar kiribila
  - **F** `w11/5.2/p3/s5` Bi trenkada/endokardio almohadillatxo (gandor) horiek bata bestearengana hurbiltzen eta hazten dira, baina enbor arterioso horretan eratzen den trenkada kiribil (espiral) formakoa da, trenkada aortiko pulmonarra du izena eta bitan banatzen du arteria enbor hori.
- Arbela `b-mailak`: Hurbilean birika arteria aurrean · tartean aorta eskuinean · urrutian aorta aurrean
  - **F** `w11/5.2/p4/s1` -​ Enbor arteriosoan hurbileko atalean (Beheko aldean) hedatutako trenkada zeharkakoa izango da, trenkadaren aurrealdean kokatzen den erretena arteria pulmonarra izango da, eta atzealdekoa aorta izango da (aorta ezkerreko bentrikularen infundibulutik irteten da).
  - **F** `w11/5.2/p5/s1` -​ Enbor arteriosoan gorago, tarteko aldean, kiribil formako trenkada hor aurretik atzera abiatutakoa da eta beraz trenkadaren erretenak bata bestearen parean kokatuko dira, aorta eskuinaldean eta birika arteria ezkerraldean.
  - **F** `w11/5.2/p6/s1` -​ Enbor arteriosoaren urrutiko atalean (goikaldean), berriro, trenkada aortiko pulmonar hori zeharkakoa da eta, kasu honetan, aorta aurreko aldean eta birika arteria (birika enborra) atzean kokatuko dira.
  - **F** `w11/5.2/p9/s3` Hala, beheko aldean, enbor arteriosoaren hurbileko aldean birika arteria aortaren aurrealdean kokatuta dago, baina gero tarteko aldean aorta eta birika arteria parean daude, eta goialdean aorta aurretik kokatzen da (birika arteria eta aorta enbor arteriosotik sortzen dira, kiribil formako trenkada agertu ondoren).
- Arbela `b-jarraiak`: Trenkada kiribila konoaren trenkadarekin jarraia; fusioz mintzezko zatia
  - **F** `w11/5.2/p8/s1` Enbor arteriosoan dagoen kiribil formako trenkada hori beheko aldetik fusionatzen da arteria konoaren trenkadarekin jarraiak dira, eta berdina gertatzen zaio arteria konoaren trenkadari.
  - **F** `w11/5.2/p8/s3` Fusioaren ondorioz, trenkada muskularrarekin fusionatuta dagoen bentrikulu arteko mintzezko zatia sortzen da.
- Galdera (predict): Zer uste duzu: trenkada kiribila bada, aorta beti alde berean egongo da?
- Galdera (pool): mikro:11/enbor-arteriosoa:3
- Galdera (contrast): Enborraren hurbileko eta urrutiko mailak: zein dago aurrean bakoitzean?

## 11. Balbula semilunarrak

Etapa: `balbula-semilunarrak` · 6 lerro · ~39 s hitz eginda

1. «Bi arteria horien hasieran balbula semilunarrak agertzen dira, kuxinetatik: aorta balbula eta birika balbula.»
  _t=0 · argi: balbula-semilunarrak, aorta-balbula, birika-balbula_
  - **F** `w11/5.2/p12/s1` Birika arteriaren eta aortaren hasierako zatietan balbula semilunarrak (balbula semilunarrak endokardio almoadillatxoetatik sortzen dira) agertzen dira, aorta balbula (aortan) eta balbula pulmonarra edo birika balbula (birika arterian) dira.

2. «Hiru gandor agertzen dira, eta haien goikaldean goraguneak, tuberkuluak. Gero goiko aldetik zulatzen dira.»
  _t=0.1 · argi: balbula-semilunarrak_
  - g `w11/5.2/p12/s6` Balbulen eraketa: bi arteria horietako hasierako zatietan hiru gandor agertu, eta beren goikoaldean goragune (tuberkulo) batzuk agertzen dira eta gora gune horiek goiko aldetik zulatzen dira (2 zulo horietatik, goranzko aortak ematen dituen lehenengo adarrak sortu, arteria koronarioak, bihotza irrigatuko dutenak), bi egitura hauen hasierako ataletan balbula semilunarrak sortu, eta balbula bakoitzak haurrak diren 3 balbak edukiko ditu: bi albokoak eta atzekoa (aortan) edo aurrekoa (arteria pulmonarrean).

3. «Horregatik balbak bereziak dira: enara kabiko forma dute, eta ahurrak dira, goitik zulatuta.»
  _t=0.25 · emphasis · argi: aorta-balbula, birika-balbula · arbelean: b-enara_
  - **F** `w11/5.2/p12/s3` Balba horiek bereziak dira enara kabiko forma dutelako eta ahurrak (concavoak) direlako, hau da, zulatuta daude goikaldetik.

4. «Trikuspideak dira: aortan bi alboko balba eta atzeko bat; birika balbulan bi alboko eta aurreko bat.»
  _t=0.5 · emphasis · argi: aorta-balbula, birika-balbula · arbelean: b-trikuspideak_
  - **F** `w11/5.2/p12/s2` Balbula semilunarrak trikuspideak dira, hau da, horietako bakoitzak hiru balba dituzte: aortikan bi alboko eta aorta atzeko bat, eta pulmonarrean bi alboko eta aurreko bat.

5. «Aorta balbularen eskuineko eta ezkerreko balben sinuetatik arteria koronarioak irteten dira: aortaren lehen adarrak.»
  _t=0.73 · emphasis · argi: aorta-balbula, arteria-koronarioak · arbelean: b-koronarioak_
  - **F** `w11/5.2/p12/s4` Aorta balbularen eskuineko eta ezkerreko balbaren sinuetatik (balbula semilunarrak) irteten dira arteria koronarioak (eskuinekoa eta ezkerrekoa), hauek aortak ematen dituen lehenengo adarrak izanik.

6. «Arteria koronarioek bihotzaren miokardioa irrigatzen dute.»
  _t=0.73 · argi: arteria-koronarioak_
  - g `w11/5.2/p12/s5` Arteria koronarioek (goranzko aortan, aorta balbularen mailan, balbula honetako alboko balbetako paretatik irteten (eta sortzen) dira) bihotzaren miokardioa irrigatzen dute.

- Arbela `b-enara`: Balba semilunarrak: enara kabiko forma, ahurrak (goitik zulatuta)
  - **F** `w11/5.2/p12/s3` Balba horiek bereziak dira enara kabiko forma dutelako eta ahurrak (concavoak) direlako, hau da, zulatuta daude goikaldetik.
- Arbela `b-trikuspideak`: Aorta: bi alboko eta atzeko bat. Birika: bi alboko eta aurreko bat
  - **F** `w11/5.2/p12/s2` Balbula semilunarrak trikuspideak dira, hau da, horietako bakoitzak hiru balba dituzte: aortikan bi alboko eta aorta atzeko bat, eta pulmonarrean bi alboko eta aurreko bat.
- Arbela `b-koronarioak`: Koronarioak: aorta balbularen eskuineko eta ezkerreko sinuetatik; aortaren lehen adarrak
  - **F** `w11/5.2/p12/s4` Aorta balbularen eskuineko eta ezkerreko balbaren sinuetatik (balbula semilunarrak) irteten dira arteria koronarioak (eskuinekoa eta ezkerrekoa), hauek aortak ematen dituen lehenengo adarrak izanik.
- Galdera (contrast): Aorta balbula eta birika balbula: zein da bakoitzaren alboko ez den balba?
- Galdera (pool): w11-q-koronarioak

## 12. Osatu taula

Etapa: `balbula-semilunarrak` · 1 lerro · ~6 s hitz eginda

1. «Azken zatia: taula osatu oroimenetik, eta gero zenbait galdera, gai osoko zatiak nahastuta.»
  _t=0.9 · summary_
  - g `w11/5.2/p10/s1` Gaia laburbilduz, aurikuletan bi atal desberdin ditugu, atal liso eta atal trabekulatua, gauza bera gertatzen da bentrikuloetan.

- Galdera (fill): klasea:11/taula
- Galdera (pool): w11-q-kuxin-ab
- Galdera (pool): w11-q-aorta-infundibulua

## Estaldura

- Funtsezko esaldiak: 90 / 161; klaseak esaten ditu: 90.
- Klaseak aipatzen dituen esaldi guztiak: 113.
- Hitz egiteko denbora: ~10 min (galderak aparte).
