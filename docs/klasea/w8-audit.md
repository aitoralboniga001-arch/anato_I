# 8. gaiko klasea: iturriak

_Sortua: `npx tsx scripts/klasea/audit.ts 8`. F = funtsezkoa, g = garrantzitsua._

## 0. Gaur

Etapa: `jatorriak` · 6 lerro · ~37 s hitz eginda

1. «Kaixo! Gaur hezurrak ikasiko ditugu: nondik sortzen diren eta nola hezurtzen diren.»
  _t=0_
  - Ez dut ulertu: «Gaurko gaia: hezurrak. Nondik datozen, eta nola bihurtzen diren hezur.»
  - **F** `w8/1/p2/s1` Gure gorputzaren hezurrak mesodermo paraxialetik (somitomero eta somitetatik), alboko mesodermoko pareta-orritik eta gandor neuraletako zeluletatik (jatorriz ektodermikoak) sortuko dira.

2. «Gure hezurrak hiru jatorritatik sortzen dira: mesodermo paraxialetik, alboko mesodermoaren paretako orritik eta gandor neuraletik.»
  _t=0 · emphasis · argi: mesodermo-paraxiala, paretako-orria, gandor-neurala · arbelean: b-hiru_
  - Ez dut ulertu: «Hiru iturri daude: mesodermo paraxiala, paretako orria eta gandor neurala.»
  - **F** `w8/1/p2/s1` Gure gorputzaren hezurrak mesodermo paraxialetik (somitomero eta somitetatik), alboko mesodermoko pareta-orritik eta gandor neuraletako zeluletatik (jatorriz ektodermikoak) sortuko dira.

3. «Kontuz: gandor neuraleko zelulak jatorriz ektodermikoak dira.»
  _t=0 · caution · argi: gandor-neurala_
  - Ez dut ulertu: «Kontuz: gandor neuraleko zelulak ektodermotik datoz, ez mesodermotik.»
  - **F** `w8/1/p2/s1` Gure gorputzaren hezurrak mesodermo paraxialetik (somitomero eta somitetatik), alboko mesodermoko pareta-orritik eta gandor neuraletako zeluletatik (jatorriz ektodermikoak) sortuko dira.

4. «Garapenean mesodermo paraxiala segmentatu egiten da.»
  _t=0.12 · argi: mesodermo-paraxiala_
  - Ez dut ulertu: «Mesodermo paraxiala zatitan banatzen da.»
  - **F** `w8/1/p4/s1` Garapenean, mesodermo paraxiala segmentatu egiten da.

5. «Alde zefalikoan somitomeroak agertzen dira; alde okzipitaletik behera, berriz, somitak.»
  _t=0.12 · argi: somitomeroak, somitak · arbelean: b-segmentuak_
  - Ez dut ulertu: «Buruan somitomeroak sortzen dira; garondotik behera, somitak.»
  - g `w8/1/p4/s2` Alde zefalikoan somitomeroak agertzen dira (hauetatik mesenkima sortuko da).
  - **F** `w8/1/p4/s3` Alde okzipitaletik behera, berriz, somitak.

6. «Somitetan bi zelula multzo bereizten dira: esklerotoma, aurrealdeko eta erdialdeko paretatik, eta dermomiotoma, atzealdekotik.»
  _t=0.26 · argi: esklerotoma, dermatomiotoma_
  - Ez dut ulertu: «Somita bakoitzean bi talde: esklerotoma aurrean eta erdian, dermomiotoma atzean.»
  - **F** `w8/1/p4/s4` Somitetan, zelulen garapenaren ondorioz zelula multzo ezberdinak agertzen dira: esklerotoma (aurrealdeko eta erdialdeko paretako zeluletatik) eta dermomiotoma (atzealdeko zeluletatik).

- Arbela `b-hiru`: Hezurren hiru jatorri: mesodermo paraxiala, paretako orria eta gandor neurala (ektodermikoa)
  - **F** `w8/1/p2/s1` Gure gorputzaren hezurrak mesodermo paraxialetik (somitomero eta somitetatik), alboko mesodermoko pareta-orritik eta gandor neuraletako zeluletatik (jatorriz ektodermikoak) sortuko dira.
- Arbela `b-segmentuak`: Alde zefalikoan somitomeroak; okzipitaletik behera somitak
  - g `w8/1/p4/s2` Alde zefalikoan somitomeroak agertzen dira (hauetatik mesenkima sortuko da).
  - **F** `w8/1/p4/s3` Alde okzipitaletik behera, berriz, somitak.
- Galdera (predict): Zer uste duzu: hezur guztiak mesodermotik sortzen dira?

## 1. Hiru jatorriak

Etapa: `jatorriak` · 7 lerro · ~43 s hitz eginda

1. «Esklerotomako zelulak mesenkima bihurtzen dira: zelula mugikorrak, migratu egiten dutenak.»
  _t=0.4 · argi: esklerotoma, mesenkima_
  - Ez dut ulertu: «Esklerotomako zelulak mesenkima bihurtzen dira, eta mugitu egiten dira.»
  - g `w8/1/p5/s1` Esklerotoma zelulak desberdintze prozesu baten bidez mesenkima bihurtzen dira.
  - g `w8/1/p5/s2` Mesenkima zelula hauek zelula mugikorrak direla esaten da, migratzen dutelako.

2. «Lehen bidea: erdialdera migratu, eta bizkarrezurreko ornoak eta saihetsak eratu.»
  _t=0.54 · emphasis · argi: ornoak, saihetsak · arbelean: b-esklerotoma_
  - Ez dut ulertu: «Batzuk erdialdera doaz, eta ornoak eta saihetsak egiten dituzte.»
  - g `w8/1/p5/s3` Ehun hauetako zelulek bi bide ezberdin har ditzakete:
  - **F** `w8/1/p6/s1` ● Erdialdera migratzea, hodi neurala eta notokorda inguratuz bizkar-hezurreko ornoak, bai sahietsak eratuz.

3. «Bigarren bidea: hezurra eratzen duten zelulak sortu, fibroblastoak, kondroblastoak eta osteoblastoak.»
  _t=0.66 · argi: fibroblastoak, kondroblastoak, osteoblastoak_
  - Ez dut ulertu: «Beste batzuk hezurra egiten duten zelula bihurtzen dira: fibroblastoak, kondroblastoak eta osteoblastoak.»
  - **F** `w8/1/p7/s1` ● Hezurraren eraketan parte hartzen duten zelula ezberdinak eratu dezakete, hala nola, fibroblastoak, kondroblastoak eta osteoblastoak

4. «Alboko mesodermoaren paretako orritik ere mesenkima sortzen da.»
  _t=0.78 · argi: paretako-orria, mesenkima_
  - Ez dut ulertu: «Paretako orriak ere mesenkima egiten du.»
  - **F** `w8/1/p9/s1` Enbrioi barruko alboko mesodermoko pareta-orriko zelula mesodermikoek sortutako mesenkimatik hurrengo egiturak eratzen dira:

5. «Hortik goiko eta beheko gorputz-adarretako hezurrak, esternoia eta gerrialdeko hezurrak sortzen dira.»
  _t=0.78 · argi: gorputz-adarretako-hezurrak, esternoia, gerriko-hezurrak · arbelean: b-paretakoa_
  - Ez dut ulertu: «Hortik datoz besoetako eta hanketako hezurrak, esternoia eta gerrialdeko hezurrak.»
  - **F** `w8/1/p10/s1` ● Goiko eta beheko gorputz adarren hezurrak
  - **F** `w8/1/p11/s1` ● Esternoia
  - **F** `w8/1/p12/s1` ● Gerrialdeko hezurrak

6. «Hirugarren jatorria: alde zefalikoko gandor neuraleko zelula batzuek ere hezurrak eratzen dituzte.»
  _t=0.9 · argi: gandor-neurala_
  - Ez dut ulertu: «Hirugarrena: buruko gandor neuraleko zelula batzuek ere hezurrak egiten dituzte.»
  - **F** `w8/1/p14/s1` Enbrioiaren alde zefalikoan dauden gandor neuraletako zelula ektodermiko batzuek hezur desberdinen eraketan parte hartzen dute.

7. «Buruaren aldera migratzen dute eta mesenkima eratzen dute: hortik aurpegiko eta neurokraneoko hezurrak.»
  _t=0.9 · argi: mesenkima, buru-aurpegi-hezurrak · arbelean: b-gandorra_
  - Ez dut ulertu: «Burura doaz, mesenkima egiten dute, eta hortik aurpegiko eta neurokraneoko hezurrak sortzen dira.»
  - **F** `w8/1/p14/s2` Hau da, zelula hauek alde zefalikorantz migratzen dute eta mesenmika eratzen da.
  - g `w8/1/p14/s4` Aurpegiaren eta neurokraneoaren hezurrak eratzen dituzte, dermisa eta gongoil sentsorialen neuronekin batera.

- Arbela `b-esklerotoma`: Esklerotoma: mesenkima. Erdialdera migratu: ornoak eta saihetsak
  - g `w8/1/p5/s1` Esklerotoma zelulak desberdintze prozesu baten bidez mesenkima bihurtzen dira.
  - **F** `w8/1/p6/s1` ● Erdialdera migratzea, hodi neurala eta notokorda inguratuz bizkar-hezurreko ornoak, bai sahietsak eratuz.
- Arbela `b-paretakoa`: Paretako orria: gorputz-adarretako hezurrak, esternoia, gerrialdeko hezurrak
  - **F** `w8/1/p9/s1` Enbrioi barruko alboko mesodermoko pareta-orriko zelula mesodermikoek sortutako mesenkimatik hurrengo egiturak eratzen dira:
  - **F** `w8/1/p10/s1` ● Goiko eta beheko gorputz adarren hezurrak
  - **F** `w8/1/p11/s1` ● Esternoia
  - **F** `w8/1/p12/s1` ● Gerrialdeko hezurrak
- Arbela `b-gandorra`: Gandor neurala: aurpegiko eta neurokraneoko hezurrak
  - **F** `w8/1/p14/s1` Enbrioiaren alde zefalikoan dauden gandor neuraletako zelula ektodermiko batzuek hezur desberdinen eraketan parte hartzen dute.
  - g `w8/1/p14/s4` Aurpegiaren eta neurokraneoaren hezurrak eratzen dituzte, dermisa eta gongoil sentsorialen neuronekin batera.
- Galdera (contrast): Ornoak eta esternoia: nondik sortzen da bakoitza?
- Galdera (pool): w8-q-jatorriak

## 2. Bi hezurtzapen mota

Etapa: `hezurtzapena` · 7 lerro · ~42 s hitz eginda

1. «Orokorrean bi hezurtzapen mota daude, mintzezkoa eta endokondrala, eta bien abiapuntua mesenkima da.»
  _t=0 · emphasis · argi: mesenkima_
  - Ez dut ulertu: «Hezurra bi modutara egiten da, mintzezkoa eta endokondrala, eta biak mesenkimatik hasten dira.»
  - **F** `w8/2/p2/s1` Orokorrean bi motatako hezurtzapen mota daude:

2. «Mintzezkoan, mesenkimatik hezurren mintzezko ereduak sortzen dira, eta zuzenean hezurtzapen zentroak agertzen dira.»
  _t=0.16 · argi: mesenkima, hezurtzapen-zentroak, osteoblastoak_
  - Ez dut ulertu: «Lehenengoan, mesenkimazko mintz bat bera hezurtzen da, zentro batzuetatik hasita.»
  - **F** `w8/2/p3/s1` 1. Mintzeko hezurtzapena/mintzezko barrukoa: mesenkimatik hezurren mintzezko ereduak sortzen dira eta zuzenean mesenkima horietan, hezurtzapen zentroak agertzen dira.

3. «Beraz, mintzezko eredu hori zuzenean hezurtzen da, kartilagorik gabe.»
  _t=0.32 · argi: hezur-espikulak_
  - Ez dut ulertu: «Mintza bera bihurtzen da hezur, zuzenean, kartilagorik gabe.»
  - g `w8/2/p3/s2` Ondorioz, mintzezko hezurrezko eredu horrek zuzenean hezurtzen dira.

4. «Endokondralean, berriz, mesenkimatik kartilago hialinozko ereduak sortzen dira lehenik.»
  _t=0.48 · argi: mesenkima, kartilago-eredua_
  - Ez dut ulertu: «Bigarrenean, mesenkimatik lehenik kartilagozko eredu bat egiten da.»
  - **F** `w8/2/p4/s1` 2. Hezurtzapen endokondrala: Mesenkimatik hasiera bateran kartilago hialinoaren hezurren ereduak sortzen dira eta ondoren kartilago horiek hezurtuko dira.

5. «Kondroblastoek sortzen dituzte eredu horiek, eta hasieran kartilaginotsuak dira.»
  _t=0.48 · argi: kondroblastoak, kartilago-eredua_
  - Ez dut ulertu: «Kondroblastoek egiten dute eredua, eta hasieran kartilagoa da.»
  - **F** `w8/2/p4/s2` Mesenkimatik desberdindutako zelula kondroblastoak sortutako hezur eredu hauek kartilaginotsuak dira hasieran, eta beranduago, 2. fase batean eredu hauek hezurtzapen zentro ezberdinei esker hezurtzen dira.

6. «Bigarren fase batean, hezurtzapen zentroei esker, kartilago eredu horiek hezurtzen dira.»
  _t=0.64 · argi: hezurtzapen-zentroak, kartilago-eredua · arbelean: b-bi-motak_
  - Ez dut ulertu: «Gero, zentro batzuetatik hasita, kartilagoa hezurrak ordezkatzen du.»
  - **F** `w8/2/p4/s2` Mesenkimatik desberdindutako zelula kondroblastoak sortutako hezur eredu hauek kartilaginotsuak dira hasieran, eta beranduago, 2. fase batean eredu hauek hezurtzapen zentro ezberdinei esker hezurtzen dira.

7. «Laburbilduz: mintzezkoan mesenkima zuzenean hezurtzen da; endokondralean, lehenik kartilagoa, gero hezurra.»
  _t=0.8 · summary · argi: mesenkima_
  - Ez dut ulertu: «Gogoratu: mintzezkoan zuzenean hezurra; endokondralean, kartilagoa lehenik eta hezurra gero.»
  - **F** `w8/2/p3/s1` 1. Mintzeko hezurtzapena/mintzezko barrukoa: mesenkimatik hezurren mintzezko ereduak sortzen dira eta zuzenean mesenkima horietan, hezurtzapen zentroak agertzen dira.
  - **F** `w8/2/p4/s1` 2. Hezurtzapen endokondrala: Mesenkimatik hasiera bateran kartilago hialinoaren hezurren ereduak sortzen dira eta ondoren kartilago horiek hezurtuko dira.

- Arbela `b-bi-motak`: Mintzezkoa: mesenkimazko eredua zuzenean hezurtzen da. Endokondrala: kartilago hialinozko eredua, gero hezurra
  - **F** `w8/2/p3/s1` 1. Mintzeko hezurtzapena/mintzezko barrukoa: mesenkimatik hezurren mintzezko ereduak sortzen dira eta zuzenean mesenkima horietan, hezurtzapen zentroak agertzen dira.
  - **F** `w8/2/p4/s1` 2. Hezurtzapen endokondrala: Mesenkimatik hasiera bateran kartilago hialinoaren hezurren ereduak sortzen dira eta ondoren kartilago horiek hezurtuko dira.
  - **F** `w8/2/p4/s2` Mesenkimatik desberdindutako zelula kondroblastoak sortutako hezur eredu hauek kartilaginotsuak dira hasieran, eta beranduago, 2. fase batean eredu hauek hezurtzapen zentro ezberdinei esker hezurtzen dira.
- Galdera (contrast): Mintzezko hezurtzapena eta endokondrala: zertan dira desberdinak?

## 3. Buru-ganga

Etapa: `buru-ganga` · 12 lerro · ~69 s hitz eginda

1. «Burezurreko hezurrak bi zati nagusitan banatzen dira: neurokraneoa eta errai kraneoa.»
  _t=0 · emphasis · argi: neurokraneoa, errai-kraneoa · arbelean: b-burezurra_
  - Ez dut ulertu: «Burezurrak bi zati ditu: neurokraneoa eta errai kraneoa.»
  - **F** `w8/3/p2/s1` Burezurreko hezurrak bi zati nagusitan banatzen dira:
  - **F** `w8/3/p3/s1` ● Neurokraneoa: entzefaloaren inguruan kokatzen diren hezurrak edo hezur zatiak.
  - **F** `w8/3/p4/s1` ● Errai kraneoa: aurpegiaren eskeletoa osatzen duten hezurrak.

2. «Neurokraneoa entzefaloaren inguruko hezurrak dira; errai kraneoa, aurpegiaren eskeletoa.»
  _t=0 · argi: neurokraneoa, errai-kraneoa_
  - Ez dut ulertu: «Neurokraneoak burmuina babesten du; errai kraneoa aurpegiaren hezurdura da.»
  - **F** `w8/3/p3/s1` ● Neurokraneoa: entzefaloaren inguruan kokatzen diren hezurrak edo hezur zatiak.
  - g `w8/3/p3/s2` Burmuina babesten duen zatia.
  - **F** `w8/3/p4/s1` ● Errai kraneoa: aurpegiaren eskeletoa osatzen duten hezurrak.

3. «Gangako hezurrak entzefaloaren goikaldeko eta alboko mesenkimatik sortzen dira.»
  _t=0.14_
  - Ez dut ulertu: «Gangako hezurrak burmuinaren gainean eta alboetan dagoen mesenkimatik datoz.»
  - **F** `w8/3.1.1/p2/s1` Entzefaloaren goikaldeko eta alboko mesenkimatik sortzen diren hezur zatiak.

4. «Mintzezko hezurtzapena du: zuzenean hezurtzen da, eta hezur lauak eta zapalak dira.»
  _t=0.14 · argi: hezurtzapen-zentroak, hezur-espikulak_
  - Ez dut ulertu: «Zuzenean bihurtzen da hezur, kartilagorik gabe; hezur lauak dira.»
  - g `w8/3.1.1/p2/s2` Hezur hauek mintzezko hezurtzapena dute, hau da, zuzenean hezurtzen dira eta zapalak edo lauak dira:

5. «Hezur hauek dira: bi hezur frontal, bi hezur parietal eta hezur okzipitalaren ezkata.»
  _t=0.28 · argi: hezur-frontala, hezur-parietala, okzipitalaren-ezkata · arbelean: b-buruganga_
  - Ez dut ulertu: «Kopetako bi hezur, paretako bi hezur eta garondoko okzipitalaren ezkata.»
  - **F** `w8/3.1.1/p3/s1` ○ 2 hezur frontal (kopeta hezur)
  - g `w8/3.1.1/p4/s1` ○ 2 hezur parietal (pareta hezurra)
  - **F** `w8/3.1.1/p5/s1` ○ Hezur okzipitalaren ezkatak (garondoa)

6. «Joskurak bi hezur lauren arteko ehun konektibozko ildo estuak dira.»
  _t=0.42 · emphasis · argi: joskurak_
  - Ez dut ulertu: «Joskura bat bi hezurren arteko marra estu bat da, ehun konektibozkoa.»
  - g `w8/3.1.1/p8/s1` Hezur horien artean ehun konektibozko eskualdeak daude: Joskurak eta Fontanelak
  - **F** `w8/3.1.1/p9/s1` - Joskurak: hezur lau eta zapal hauen artean kokatzen diren ehun konektibozko ildo estuak dira (bi hezurren artean).

7. «Fontanelak, berriz, ildo zabalagoak dira, bi hezur baino gehiago elkartzen diren lekuetan.»
  _t=0.56 · argi: fontanelak · arbelean: b-joskurak_
  - Ez dut ulertu: «Fontanela bat leku zabalago bat da, hiru hezur edo gehiago elkartzen diren tokian.»
  - **F** `w8/3.1.1/p10/s1` - Fontanelak/fontikuluak: ehun konektibozko ildo zabalagoak dira, bi hezur baino gehiago elkartzen diren eskualdetan agertzen dira.

8. «Aurreko fontanela edo bregma bi frontal eta bi parietalen artean dago, eta 18. hilabetean ixten da.»
  _t=0.56 · argi: aurreko-fontanela_
  - Ez dut ulertu: «Bregma kopetako eta paretako hezurren artean dago, eta 18. hilabetean ixten da.»
  - **F** `w8/3.1.1/p13/s1` ● Aurreko fontanela edo Bregma : bi hezur frontal eta bi
  - · `w8/3.1.1/p14/s1` parietalen artean (18. hilabetean ixten da)

9. «Atzeko fontanela edo lambda bi parietalen eta okzipitalaren ezkataren artean dago.»
  _t=0.56 · argi: atzeko-fontanela, okzipitalaren-ezkata_
  - Ez dut ulertu: «Lambda paretako hezurren eta garondoko okzipitalaren ezkataren artean dago.»
  - **F** `w8/3.1.1/p15/s1` ● Atzeko fontanela edo Lambda: bi hezur parietalen eta hezur
  - · `w8/3.1.1/p16/s1` okzipitalaren ezkataren artean (1-2. hilabetean ixten da)

10. «Hau lehenago ixten da: lehen edo bigarren hilabetean.»
  _t=0.56 · argi: atzeko-fontanela · arbelean: b-fontanelak_
  - Ez dut ulertu: «Lambda askoz lehenago ixten da, bizitzako lehen hilabeteetan.»
  - · `w8/3.1.1/p16/s1` okzipitalaren ezkataren artean (1-2. hilabetean ixten da)

11. «Albotik, beste bi fontanela: aurre-albokoa edo esfenoidala, eta atze-albokoa edo tenporala.»
  _t=0.68 · argi: fontanela-esfenoidala, fontanela-mastoidea_
  - Ez dut ulertu: «Alboetan beste bi daude: aurrekoa, esfenoidala, eta atzekoa, tenporala. Bi aldeetan daude.»
  - **F** `w8/3.1.1/p18/s1` ● Aurre-alboko fontanela edo esfenoidala (esfenoide).
  - **F** `w8/3.1.1/p19/s1` ● Atze-alboko fontanela edo fontanela tenporala.

12. «Joskurek eta fontanelek entzefaloari hazten uzten diote; erditzean, gainera, hezur plakak gainjarri egiten dira.»
  _t=0.8 · why · argi: joskurak, fontanelak_
  - Ez dut ulertu: «Hezurren arteko tarte hauei esker burmuina hazi daiteke, eta erditzean buruak tokia egiten du.»
  - · `w8/3.1.1/p20/s2` Joskurak eta fontanelak neurokraneoaren barnean entzefaloaren hazkuntza ahalbidetzen dute.
  - · `w8/3.1.1/p20/s3` Gainera, erditzean fetuaren zatirik handiena neurokraneoa izanik, erditzea errazagoa izan dadin, hezur plakak gainjarri egiten dira kraneoaren tamaina txikiagotzeko.

- Arbela `b-burezurra`: Burezurra: neurokraneoa (buru-ganga eta kondrokraneoa) eta errai kraneoa (aurpegia)
  - **F** `w8/3/p2/s1` Burezurreko hezurrak bi zati nagusitan banatzen dira:
  - **F** `w8/3/p3/s1` ● Neurokraneoa: entzefaloaren inguruan kokatzen diren hezurrak edo hezur zatiak.
  - g `w8/3/p3/s3` ■ Mintzezko zatia / buru-ganga osatzen duten hezur zatiak (sabaiakoak eta albokoak).
  - g `w8/3/p3/s4` ■ Kondrokraneoa = zati kartilagenotsua / burezurraren oinaldean kokatutako hezur multzoa.
  - **F** `w8/3/p4/s1` ● Errai kraneoa: aurpegiaren eskeletoa osatzen duten hezurrak.
- Arbela `b-buruganga`: Buru-ganga, mintzezkoa: 2 frontal, 2 parietal, okzipitalaren ezkata
  - g `w8/3.1.1/p2/s2` Hezur hauek mintzezko hezurtzapena dute, hau da, zuzenean hezurtzen dira eta zapalak edo lauak dira:
  - **F** `w8/3.1.1/p3/s1` ○ 2 hezur frontal (kopeta hezur)
  - g `w8/3.1.1/p4/s1` ○ 2 hezur parietal (pareta hezurra)
  - **F** `w8/3.1.1/p5/s1` ○ Hezur okzipitalaren ezkatak (garondoa)
- Arbela `b-joskurak`: Joskurak: ildo estuak. Fontanelak: ildo zabalak, bi hezur baino gehiagoren artean
  - **F** `w8/3.1.1/p9/s1` - Joskurak: hezur lau eta zapal hauen artean kokatzen diren ehun konektibozko ildo estuak dira (bi hezurren artean).
  - **F** `w8/3.1.1/p10/s1` - Fontanelak/fontikuluak: ehun konektibozko ildo zabalagoak dira, bi hezur baino gehiago elkartzen diren eskualdetan agertzen dira.
- Arbela `b-fontanelak`: Bregma: 18. hilabetean ixten da. Lambda: 1.–2. hilabetean
  - **F** `w8/3.1.1/p13/s1` ● Aurreko fontanela edo Bregma : bi hezur frontal eta bi
  - · `w8/3.1.1/p14/s1` parietalen artean (18. hilabetean ixten da)
  - **F** `w8/3.1.1/p15/s1` ● Atzeko fontanela edo Lambda: bi hezur parietalen eta hezur
  - · `w8/3.1.1/p16/s1` okzipitalaren ezkataren artean (1-2. hilabetean ixten da)
- Galdera (pool): w8-q-joskura-fontanela
- Galdera (contrast): Bregma eta lambda: zein ixten da lehenago?

## 4. Kondrokraneoa

Etapa: `kondrokraneoa` · 13 lerro · ~71 s hitz eginda

1. «Kondrokraneoa neurokraneoaren oinaldean dago: kutxaren zorua da.»
  _t=0 · argi: kondrokraneoa_
  - Ez dut ulertu: «Kondrokraneoa burezurraren zorua da, burmuinaren azpian.»
  - **F** `w8/3.1.2/p2/s1` Neurokraneoaren oinaldean kokatzen da (Kutxaren zorua).

2. «Hezurtzapen endokondralaren bidez sortzen da: mesenkimatik kartilagoa, eta kartilagotik hezurra.»
  _t=0 · emphasis · argi: kondrokraneoa · arbelean: b-kondro_
  - Ez dut ulertu: «Hemen lehenik kartilagoa egiten da, eta gero kartilago hori hezur bihurtzen da.»
  - **F** `w8/3.1.2/p2/s2` Oinaldean dauden hezur zati hauek hezurtzapen endokondralaren bidez sortzen dira; hau da, mesenkimatik sortutako kartilagoatik eratutako hezurrak dira.

3. «Atzealdean kartilago parakordalak daude, bat eskuinean eta bestea ezkerrean.»
  _t=0.2 · argi: kartilago-parakordalak_
  - Ez dut ulertu: «Atzean bi kartilago parakordal daude, eskuinekoa eta ezkerrekoa.»
  - **F** `w8/3.1.2/p8/s1` Kartilago parakordalak (atzekaldean): 3 somita okzipitalen esklerotomatik + lehenego lepoko somita esklerotomatik sortzen dira.
  - g `w8/3.1.2/p8/s2` Bi dira: eskuineko bat eta ezkerreko bat.

4. «Hiru somita okzipitalen eta lehen lepoko somitaren esklerotometatik sortzen dira.»
  _t=0.2 · argi: kartilago-parakordalak_
  - Ez dut ulertu: «Garondoko hiru somitetatik eta lepoko lehenengotik datoz.»
  - **F** `w8/3.1.2/p8/s1` Kartilago parakordalak (atzekaldean): 3 somita okzipitalen esklerotomatik + lehenego lepoko somita esklerotomatik sortzen dira.

5. «Haietatik hezur okzipitalaren oinaldea eratzen da, lamina basilarra.»
  _t=0.2 · argi: okzipitalaren-oinaldea_
  - Ez dut ulertu: «Hortik okzipitalaren oinaldea egiten da.»
  - g `w8/3.1.2/p8/s3` Ondoren, kartilago parakordal eta esklerotoma okzipitaletatik, hezur okzipitalaren (oinaldea) orri/atal/lamina basilarra eratzen da.

6. «Kontuz: okzipitalak bi atal ditu. Ezkata mintzezkoa da; oinaldea, berriz, endokondrala.»
  _t=0.2 · caution · argi: okzipitalaren-ezkata, okzipitalaren-oinaldea_
  - Ez dut ulertu: «Kontuz: okzipitalaren ezkata zuzenean hezurtzen da, eta oinaldea kartilagotik.»
  - g `w8/3.1.2/p8/s4` Okzipitalak bi atal ditu: buru-gangan kokatutako eskata, mintzezko hezurtzapenekoa eta oinaldean kokatutakoa, hezurtzapen endokondralekoa.

7. «Haien aurrean hipofisi kartilagoak daude: hortik esfenoides hezurraren gorputza.»
  _t=0.33 · argi: hipofisi-kartilagoak, esfenoidesaren-gorputza_
  - Ez dut ulertu: «Aurrerago hipofisi kartilagoak: hortik esfenoidesaren gorputza egiten da.»
  - **F** `w8/3.1.2/p9/s1` Hipofisi kartilagoak: bi kartilago parakordalen aurrekaldean kokatzen dira.
  - g `w8/3.1.2/p9/s2` Hemendik esfenoides hezurraren gorputza eratzen da.

8. «Gorputz horren goiko aurpegian hipofisi hoditxoa dago, hipofisi guruina hartuko duena.»
  _t=0.33 · argi: hipofisi-hobitxoa, hipofisi-guruina_
  - Ez dut ulertu: «Haren gainean zulo txiki bat dago, hipofisi hoditxoa, eta hor egongo da hipofisi guruina.»
  - **F** `w8/3.1.2/p9/s3` Esfenoides gorputzaren goiko aurpegian horretan hipofisi hoditxo bat dago non hipofisi guruina (Guruin Pituitarioa) kokatuko den.

9. «Aurrerago trenkada kranialak daude: hauetatik etmoides hezurra sortzen da.»
  _t=0.46 · argi: trenkada-kranialak, etmoidesa · arbelean: b-erdikoa_
  - Ez dut ulertu: «Aurrealdean trenkada kranialak: hortik etmoides hezurra.»
  - g `w8/3.1.2/p10/s1` Trenkadatxo edo trenkada kranealak: hipofisi kartilagoen aurrean baita erdiko plakaren aurrean ere kokatzen diren egiturak.
  - **F** `w8/3.1.2/p10/s2` Hauetatik etmoides hezurra sortzen da.

10. «Alboetan beste bi plaka daude. Atzealdean kapsula periotikoa: tenporalaren harkaitza eta atal mastoideoa.»
  _t=0.56 · argi: kapsula-periotikoa, harkaitza_
  - Ez dut ulertu: «Alboetako plaketan, atzean, kapsula periotikoa: hortik tenporalaren harkaitza.»
  - **F** `w8/3.1.2/p11/s1` ●Erdiko bi plaka hauen alboetan, bi alboko kartilago plakak: hauetan kartilago desberdinak bereizten dira (atzetik aurrera):
  - **F** `w8/3.1.2/p12/s1` ➔ Atzealdean kapsula periotikoa: hezur tenporalen harkaitz zatia (edo zati petrosoa) eta atal mastoideoa sortzen dira → Harkaitz zatian barneko belarria egongo da kokatuta.

11. «Harkaitzean barneko belarria kokatuko da.»
  _t=0.56 · argi: harkaitza, barne-belarria_
  - Ez dut ulertu: «Harkaitzaren barruan egongo da barneko belarria.»
  - **F** `w8/3.1.2/p12/s1` ➔ Atzealdean kapsula periotikoa: hezur tenporalen harkaitz zatia (edo zati petrosoa) eta atal mastoideoa sortzen dira → Harkaitz zatian barneko belarria egongo da kokatuta.

12. «Aurrerago hego tenporala: esfenoidesaren hego handia. Haren aurrean begizulo hegoa: hego txikiak.»
  _t=0.66 · argi: hego-tenporala, esfenoidesaren-hego-handia, begizulo-hegoa, esfenoidesaren-hego-txikia · arbelean: b-alboak_
  - Ez dut ulertu: «Hego tenporaletik esfenoidesaren hego handia; begizulo hegotik, hego txikiak.»
  - **F** `w8/3.1.2/p13/s1` ➔ Aurrealdean, hego tenporala: esfenoides hezurraren hego edo hegal handia eratzen da.
  - **F** `w8/3.1.2/p13/s2` ◆ Hego tenporalaren aurrean begizulo hegoa: hauetatik esfenoides hezurraren hego (edo hegal) txikiak sortzen dira.

13. «Plaka horiek fusionatzean, oinaldean zuloak geratzen dira, eta haietatik 12 bikote nerbio kraneal pasatzen dira.»
  _t=0.87 · argi: burezurreko-zuloak, nerbio-kranialak_
  - Ez dut ulertu: «Zatiak elkartzean zuloak gelditzen dira: hortik ateratzen dira 12 nerbio kraneal bikoteak.»
  - · `w8/3.1.2/p15/s1` Plaka horietatik sortutako hezur-atalak elkarren artean fusionatzen dira.
  - · `w8/3.1.2/p15/s2` Fusio horren ondorioz, neurokraneoaren oinarrian (kondrokraneoan) hainbat zulo agertzen dira.
  - · `w8/3.1.2/p15/s4` Guztira 12 bikote nerbio kraneal/ gara nerbioak daude; hauen artean usaimen eta ikusmen nerbioak daude, zuntz sentsorialak soilik dituzteznak.

- Arbela `b-kondro`: Kondrokraneoa: oinaldea, endokondrala (mesenkima, kartilagoa, hezurra)
  - **F** `w8/3.1.2/p2/s1` Neurokraneoaren oinaldean kokatzen da (Kutxaren zorua).
  - **F** `w8/3.1.2/p2/s2` Oinaldean dauden hezur zati hauek hezurtzapen endokondralaren bidez sortzen dira; hau da, mesenkimatik sortutako kartilagoatik eratutako hezurrak dira.
- Arbela `b-erdikoa`: Erdiko plaka, atzetik aurrera: parakordalak (okzipitalaren oinaldea), hipofisi kartilagoak (esfenoidesaren gorputza), trenkadak (etmoidesa)
  - g `w8/3.1.2/p6/s1` ● Erdiko plaka kartilaginotsua: (Atzetik aurrera eratua)
  - g `w8/3.1.2/p8/s3` Ondoren, kartilago parakordal eta esklerotoma okzipitaletatik, hezur okzipitalaren (oinaldea) orri/atal/lamina basilarra eratzen da.
  - g `w8/3.1.2/p9/s2` Hemendik esfenoides hezurraren gorputza eratzen da.
  - **F** `w8/3.1.2/p10/s2` Hauetatik etmoides hezurra sortzen da.
- Arbela `b-alboak`: Alboko plakak: kapsula periotikoa (harkaitza), hego tenporala (hego handia), begizulo hegoa (hego txikia)
  - **F** `w8/3.1.2/p11/s1` ●Erdiko bi plaka hauen alboetan, bi alboko kartilago plakak: hauetan kartilago desberdinak bereizten dira (atzetik aurrera):
  - **F** `w8/3.1.2/p12/s1` ➔ Atzealdean kapsula periotikoa: hezur tenporalen harkaitz zatia (edo zati petrosoa) eta atal mastoideoa sortzen dira → Harkaitz zatian barneko belarria egongo da kokatuta.
  - **F** `w8/3.1.2/p13/s1` ➔ Aurrealdean, hego tenporala: esfenoides hezurraren hego edo hegal handia eratzen da.
  - **F** `w8/3.1.2/p13/s2` ◆ Hego tenporalaren aurrean begizulo hegoa: hauetatik esfenoides hezurraren hego (edo hegal) txikiak sortzen dira.
- Galdera (contrast): Okzipitalaren ezkata eta oinaldea: nola hezurtzen da bakoitza?
- Galdera (pool): w8-q-kondrokraneoa-esfenoidea

## 5. Faringe arkuetako kartilagoak

Etapa: `errai-kraneoa` · 8 lerro · ~39 s hitz eginda

1. «Errai kraneoa aurpegiko hezurrak dira.»
  _t=0_
  - Ez dut ulertu: «Errai kraneoa aurpegiaren hezurdura da.»
  - **F** `w8/3.2/p2/s1` Errai kraneoa aurpegian kokatzen diren hezurrak dira.

2. «Lepo mailaren bi aldeetan faringe arkuak agertzen dira: mesenkimazko goraguneak.»
  _t=0 · argi: faringe-arkuak_
  - Ez dut ulertu: «Lepoaren bi aldeetan koskor batzuk sortzen dira: faringe arkuak.»
  - **F** `w8/3.2/p2/s2` Gogoratu aurpegiko eskeletoaren eraketan oso garrantzitsuak direla lepo mailaren alde bietan agertzen diren mesenkima (mesodermoz osatutako egiturak) goragune batzuk, arku brankial edo faringeoak.

3. «Haietara gandor neuraleko zelulak iristen dira, eta haien mesenkimatik aurpegiko hezurrak garatzen dira, ez mesodermotik.»
  _t=0 · emphasis · argi: gandor-neurala, faringe-arkuak · arbelean: b-aurpegia_
  - Ez dut ulertu: «Arku horietara gandor neuraleko zelulak heltzen dira, eta haiek egiten dituzte aurpegiko hezurrak.»
  - **F** `w8/3.2/p2/s4` Egitura hauetaraino, enbrioiaren alde zefalikoan sortu diren gandor neuraletako zelulak iristen dira, zelula ektodermikoak direnak, eta arku faringeoetan sortutako mesenkimatik garatuko dira aurpegiko hezurrak; beraz, ez dira mesodermotik sortzen, baizik eta zelula ektodermikoetatik.

4. «Errai kraneoko hezurrak lehen bi arkuetatik sortzen dira.»
  _t=0.09_
  - Ez dut ulertu: «Aurpegiko hezurrak lehen bi arkuetatik datoz.»
  - **F** `w8/3.2/p3/s1` Errai kraneoko hezurrak lehenengo 2 arku brankialetatik sortzen dira.

5. «Lehen arkuak bi atal ditu: atal dortsala, prozesu maxilarra, eta atal bentrala, barail prozesua.»
  _t=0.09 · argi: prozesu-maxilarra, barail-prozesua_
  - Ez dut ulertu: «Lehen arkua bitan banatzen da: prozesu maxilarra gainean eta barail prozesua azpian.»
  - **F** `w8/3.2/p4/s1` 1. arku brankial/faringeoak → 2 atal ditu (enbrioiaren tolespen zefalo-kaudalarengatik):
  - **F** `w8/3.2/p5/s1` ● Atal dortsala, goragune edo maxilar prozesua deiturikoa, begizulo eskualdearen behekaldetik hedatzen da (aho primitiboaren goikaldetik).
  - g `w8/3.2/p7/s1` ● Atal bentrala, barail prozesua edo barail goragunea deiturikoa, aho primitiboaren behekaldetik hedatzen da.

6. «Prozesu maxilarrean, gandor neuraleko zelulek barra pterigopalatino karratua sortzen dute.»
  _t=0.18 · argi: prozesu-maxilarra, barra-pterigopalatino-karratua, gandor-neurala_
  - Ez dut ulertu: «Prozesu maxilarrean kartilago bat egiten da: barra pterigopalatino karratua.»
  - · `w8/3.2/p6/s1` ○ Maxilar prozesuan, bertara iritsi diren gandor neuraletako zelulek kartilago bat sortzen dute, barra pterigopalatino karratua, hemendik bitarteko balarrian daukagun hezurtxo bat garatzen da, ingudea (yunque).

7. «Barail prozesuan, berriz, Meckel kartilagoa.»
  _t=0.27 · argi: barail-prozesua, meckel-kartilagoa_
  - Ez dut ulertu: «Barail prozesuan beste kartilago bat: Meckel kartilagoa.»
  - **F** `w8/3.2/p8/s1` ○ Barail prozesuan, lehenengo arkuaren atal bentralera iritsi diren gandor neuraleko zelulek Meckel kartilagoa sortzen dute, hemendik ere bitarteko bitarteko belarriaren hezurtxo bat garatzen da, mailua.

8. «Barail prozesutik eta bigarren arkuaren mesenkimatik Reichert kartilagoa sortzen da.»
  _t=0.36 · argi: barail-prozesua, hioide-arkua, reichert-kartilagoa · arbelean: b-kartilagoak_
  - Ez dut ulertu: «Hirugarren kartilagoa, Reichert kartilagoa, barail prozesutik eta bigarren arkutik dator.»
  - **F** `w8/3.2/p9/s1` Barail prozesutik eta bigarren arku faringeoaren mesenkimatik (Mesenkima hau gandor neuraletako zeluletatik agertu delarik) Reichert kartilagoa sortuko da, eta bertatik ere bitarteko belarriaren hezurtxo bat garatuko da, mailua, ointoki edo estriboa.

- Arbela `b-aurpegia`: Aurpegiko hezurrak: faringe arkuetako gandor neuraletik, ez mesodermotik
  - **F** `w8/3.2/p2/s4` Egitura hauetaraino, enbrioiaren alde zefalikoan sortu diren gandor neuraletako zelulak iristen dira, zelula ektodermikoak direnak, eta arku faringeoetan sortutako mesenkimatik garatuko dira aurpegiko hezurrak; beraz, ez dira mesodermotik sortzen, baizik eta zelula ektodermikoetatik.
- Arbela `b-kartilagoak`: Prozesu maxilarra: barra pterigopalatino karratua. Barail prozesua: Meckel. Barail prozesua eta bigarren arkua: Reichert
  - · `w8/3.2/p6/s1` ○ Maxilar prozesuan, bertara iritsi diren gandor neuraletako zelulek kartilago bat sortzen dute, barra pterigopalatino karratua, hemendik bitarteko balarrian daukagun hezurtxo bat garatzen da, ingudea (yunque).
  - **F** `w8/3.2/p8/s1` ○ Barail prozesuan, lehenengo arkuaren atal bentralera iritsi diren gandor neuraleko zelulek Meckel kartilagoa sortzen dute, hemendik ere bitarteko bitarteko belarriaren hezurtxo bat garatzen da, mailua.
  - **F** `w8/3.2/p9/s1` Barail prozesutik eta bigarren arku faringeoaren mesenkimatik (Mesenkima hau gandor neuraletako zeluletatik agertu delarik) Reichert kartilagoa sortuko da, eta bertatik ere bitarteko belarriaren hezurtxo bat garatuko da, mailua, ointoki edo estriboa.
- Galdera (contrast): Meckel eta Reichert kartilagoak: nondik sortzen da bakoitza?

## 6. Belarriko hezurtxoak eta aurpegia

Etapa: `errai-kraneoa` · 12 lerro · ~70 s hitz eginda

1. «Barra pterigopalatino karratutik bitarteko belarriko hezurtxo bat garatzen da: ingudea.»
  _t=0.46 · argi: barra-pterigopalatino-karratua, ingudea_
  - Ez dut ulertu: «Barra pterigopalatino karratutik belarriko hezurtxo bat: ingudea.»
  - · `w8/3.2/p6/s1` ○ Maxilar prozesuan, bertara iritsi diren gandor neuraletako zelulek kartilago bat sortzen dute, barra pterigopalatino karratua, hemendik bitarteko balarrian daukagun hezurtxo bat garatzen da, ingudea (yunque).

2. «Haren inguruko mesenkimatik goiko maxilarra, hezur malarrak eta tenporalaren ezkata sortzen dira.»
  _t=0.46 · argi: goiko-maxilarra, hezur-malarra, tenporalaren-ezkata_
  - Ez dut ulertu: «Inguruan dagoen mesenkimatik goiko maxilarra, hezur malarrak eta tenporalaren ezkata.»
  - · `w8/3.2/p6/s2` Kartilago horren inguruko mesenkimatik (gandor neuraletako zeluletatik sortua) goiko hezur maxilarra, hezur malarrak edo zigomatikoak, eta, hezur tenporalaren/loki hezurraren ezkata sortzen dira.

3. «Ezkata horretatik estiloide apofisia irteten da.»
  _t=0.46 · argi: tenporalaren-ezkata, apofisi-estiloidea_
  - Ez dut ulertu: «Ezkata horretatik estiloide apofisia ateratzen da.»
  - · `w8/3.2/p6/s3` Azkenengotik, estiloide apofisia irteten da.

4. «Meckel kartilagotik mailua garatzen da; haren inguruko mesenkimatik, beheko maxilarra edo baraila.»
  _t=0.56 · emphasis · argi: meckel-kartilagoa, mailua, beheko-maxilarra_
  - Ez dut ulertu: «Meckel kartilagotik mailua; inguruko mesenkimatik, baraila.»
  - **F** `w8/3.2/p8/s1` ○ Barail prozesuan, lehenengo arkuaren atal bentralera iritsi diren gandor neuraleko zelulek Meckel kartilagoa sortzen dute, hemendik ere bitarteko bitarteko belarriaren hezurtxo bat garatzen da, mailua.
  - **F** `w8/3.2/p8/s2` Meckel kartilagoaren inguruko mesenkimatik, berriz, beheko maxilarra edo baraila sortzen da.

5. «Reichert kartilagotik hirugarren hezurtxoa: ointokia edo estriboa.»
  _t=0.65 · argi: reichert-kartilagoa, ointokia_
  - Ez dut ulertu: «Reichert kartilagotik hirugarren hezurtxoa: ointokia.»
  - **F** `w8/3.2/p9/s1` Barail prozesutik eta bigarren arku faringeoaren mesenkimatik (Mesenkima hau gandor neuraletako zeluletatik agertu delarik) Reichert kartilagoa sortuko da, eta bertatik ere bitarteko belarriaren hezurtxo bat garatuko da, mailua, ointoki edo estriboa.

6. «Beraz, hiru hezurtxoak hiru kartilagotatik datoz: mailua Meckeletik, ingudea barratik eta ointokia Reichertetik.»
  _t=0.74 · emphasis · argi: mailua, ingudea, ointokia_
  - Ez dut ulertu: «Hiru hezurtxo, hiru kartilago: mailua Meckeletik, ingudea barratik, ointokia Reichertetik.»
  - · `w8/3.2/p6/s1` ○ Maxilar prozesuan, bertara iritsi diren gandor neuraletako zelulek kartilago bat sortzen dute, barra pterigopalatino karratua, hemendik bitarteko balarrian daukagun hezurtxo bat garatzen da, ingudea (yunque).
  - **F** `w8/3.2/p8/s1` ○ Barail prozesuan, lehenengo arkuaren atal bentralera iritsi diren gandor neuraleko zelulek Meckel kartilagoa sortzen dute, hemendik ere bitarteko bitarteko belarriaren hezurtxo bat garatzen da, mailua.
  - **F** `w8/3.2/p9/s1` Barail prozesutik eta bigarren arku faringeoaren mesenkimatik (Mesenkima hau gandor neuraletako zeluletatik agertu delarik) Reichert kartilagoa sortuko da, eta bertatik ere bitarteko belarriaren hezurtxo bat garatuko da, mailua, ointoki edo estriboa.

7. «Jaiotzean aurpegia txikia da, bi arrazoirengatik.»
  _t=0.82_
  - Ez dut ulertu: «Jaioberriaren aurpegia oso txikia da, bi arrazoirengatik.»
  - g `w8/3.2/p10/s1` Hasiera batean aurpegiaren tamaina, hau da, errai kraneoaren tamaina oso txikia dela neurokraneoaren tamainarekin konparatuta.
  - **F** `w8/3.2/p10/s2` Hau bi arrazoiengatik ematen da.

8. «Sudur alboko sinuak eta maxilarretako apofisi albeolarrak ez daude oraindik garatuta.»
  _t=0.82 · argi: sinu-paranasalak, apofisi-albeolarrak, goiko-maxilarra_
  - Ez dut ulertu: «Sudurraren ondoko aire hutsuneak eta hortzen hezurra ez daude oraindik eginda.»
  - **F** `w8/3.2/p11/s1` Batetik, jaiotzerakoan airez osotutako sudur alboko sinuak (sinu paranasalak) (malarretan, frontalean, maxilarretan eta etmoides hezurrean adibidez ikus daitezkeen aire espazioak) oraindik ez daudelako guztiz garatuta, eta ondorioz, aurpegiaren hezurren tamaina txikiagoa da.
  - g `w8/3.2/p12/s1` Bestetik, jaiotzerakoan aurpegiaren goiko eta beheko maxilarretako apofisi albeolarrak ez daude guztiz garatuta.

9. «Apofisi albeolarretan hortzak txertatzen dira, eta hortzekin batera garatzen dira; horrela maxilarrak handitu egiten dira.»
  _t=0.82 · argi: apofisi-albeolarrak, goiko-maxilarra, beheko-maxilarra_
  - Ez dut ulertu: «Hortzak hazten diren heinean, haien hezurra ere hazten da, eta maxilarrak handitzen dira.»
  - **F** `w8/3.2/p12/s2` Izan ere, hauetan hortzak txertatzen dira; beraz, hortzeriaren garapenarekin batera garatuko dira apofisi albeolarrak, eta ondorioz, goiko eta beheko maxilarren tamaina askoz handiagoa egiten da.

10. «Sinuak eta apofisi albeolarrak garatzean, errai kraneoko hezurrak handitu egiten dira.»
  _t=0.82 · why · argi: sinu-paranasalak, apofisi-albeolarrak_
  - Ez dut ulertu: «Bi gauza horiek hazten direnean, aurpegia handitzen da.»
  - **F** `w8/3.2/p13/s2` Beraz, bi prozesu hauen ondorioz (sudur alboko sinuen agerpena eta maxilarretan apofisi albeolarren agerpena) errai kraneoaren hezurren tamaina handitu egiten da Errai kraneoko hezur guztiak gandor neuraletik sortutako mesenkimatik garatzen dira, baita neurokraneoko aurrealdeko hezurrak ere; atzealdekoak, berriz, mesodermo paraxialetik.

11. «Gogoratu: errai kraneoko hezur guztiak eta neurokraneoaren aurrealdekoak gandor neuraletik datoz.»
  _t=0.92 · emphasis · argi: gandor-neurala, hezur-frontala_
  - Ez dut ulertu: «Aurpegiko hezur guztiak eta burezurraren aurrealdekoak gandor neuraletik datoz.»
  - **F** `w8/3.2/p13/s2` Beraz, bi prozesu hauen ondorioz (sudur alboko sinuen agerpena eta maxilarretan apofisi albeolarren agerpena) errai kraneoaren hezurren tamaina handitu egiten da Errai kraneoko hezur guztiak gandor neuraletik sortutako mesenkimatik garatzen dira, baita neurokraneoko aurrealdeko hezurrak ere; atzealdekoak, berriz, mesodermo paraxialetik.

12. «Atzealdekoak, berriz, mesodermo paraxialetik. Kondrokraneoan berdin gertatzen da.»
  _t=0.92 · argi: hezur-parietala, okzipitalaren-ezkata · arbelean: b-jatorria_
  - Ez dut ulertu: «Atzealdekoak mesodermo paraxialetik. Burezurraren zoruan ere horrela da.»
  - **F** `w8/3.2/p13/s2` Beraz, bi prozesu hauen ondorioz (sudur alboko sinuen agerpena eta maxilarretan apofisi albeolarren agerpena) errai kraneoaren hezurren tamaina handitu egiten da Errai kraneoko hezur guztiak gandor neuraletik sortutako mesenkimatik garatzen dira, baita neurokraneoko aurrealdeko hezurrak ere; atzealdekoak, berriz, mesodermo paraxialetik.
  - g `w8/3.2/p13/s3` Kondrokraneoan gauza bera gertatzen da, aurrekaldeko hezur edo hezur zatiak bertaraio iritsitako gandor neuraletako zelulek sortutako mesenkimatik, eta atzealdeko kartilagoak mesodermo paraxialetik sortzen dira.

- Arbela `b-jatorria`: Errai kraneoa eta neurokraneoaren aurrealdea: gandor neurala. Atzealdea: mesodermo paraxiala
  - **F** `w8/3.2/p13/s2` Beraz, bi prozesu hauen ondorioz (sudur alboko sinuen agerpena eta maxilarretan apofisi albeolarren agerpena) errai kraneoaren hezurren tamaina handitu egiten da Errai kraneoko hezur guztiak gandor neuraletik sortutako mesenkimatik garatzen dira, baita neurokraneoko aurrealdeko hezurrak ere; atzealdekoak, berriz, mesodermo paraxialetik.
  - g `w8/3.2/p13/s3` Kondrokraneoan gauza bera gertatzen da, aurrekaldeko hezur edo hezur zatiak bertaraio iritsitako gandor neuraletako zelulek sortutako mesenkimatik, eta atzealdeko kartilagoak mesodermo paraxialetik sortzen dira.
- Taula `tz-meckel`: Meckel kartilagoa (barail prozesua) → Mailua → Beheko maxilarra
  - **F** `w8/3.2/p8/s1` ○ Barail prozesuan, lehenengo arkuaren atal bentralera iritsi diren gandor neuraleko zelulek Meckel kartilagoa sortzen dute, hemendik ere bitarteko bitarteko belarriaren hezurtxo bat garatzen da, mailua.
  - **F** `w8/3.2/p8/s2` Meckel kartilagoaren inguruko mesenkimatik, berriz, beheko maxilarra edo baraila sortzen da.
- Taula `tz-barra`: Barra pterigopalatino karratua (prozesu maxilarra) → Ingudea → Goiko maxilarra, hezur malarrak, tenporalaren ezkata
  - · `w8/3.2/p6/s1` ○ Maxilar prozesuan, bertara iritsi diren gandor neuraletako zelulek kartilago bat sortzen dute, barra pterigopalatino karratua, hemendik bitarteko balarrian daukagun hezurtxo bat garatzen da, ingudea (yunque).
  - · `w8/3.2/p6/s2` Kartilago horren inguruko mesenkimatik (gandor neuraletako zeluletatik sortua) goiko hezur maxilarra, hezur malarrak edo zigomatikoak, eta, hezur tenporalaren/loki hezurraren ezkata sortzen dira.
- Taula `tz-reichert`: Reichert kartilagoa (barail prozesua eta bigarren arkua) → Ointokia → –
  - **F** `w8/3.2/p9/s1` Barail prozesutik eta bigarren arku faringeoaren mesenkimatik (Mesenkima hau gandor neuraletako zeluletatik agertu delarik) Reichert kartilagoa sortuko da, eta bertatik ere bitarteko belarriaren hezurtxo bat garatuko da, mailua, ointoki edo estriboa.
- Galdera (contrast): Mailua eta ingudea: zein kartilagotik dator bakoitza?
- Galdera (pool): mikro:8/errai-kraneoa:10

## 7. Gorputz-adarrak

Etapa: `gorputz-adarrak` · 14 lerro · ~79 s hitz eginda

1. «Laugarren astean goiko eta beheko gorputz-adarrak garatzen hasten dira: hasieran zilindrikoak, gero luzatu egiten dira.»
  _t=0 · argi: goiko-gorputz-adarraren-hasikina, beheko-gorputz-adarraren-hasikina_
  - Ez dut ulertu: «Laugarren astean besoak eta hankak hasten dira: lehenik hodi txikiak, gero luzeagoak.»
  - **F** `w8/4/p3/s1` Garapenaren laugarren astean goiko eta beheko gorputz adarrak garatzen hasten dira, gutxi gora behera, hasieran zilindrikoak izanik eta ondoren luzatuz.

2. «Erdigunean pareta orriko zelula mesodermikoak daude, kanpotik ektodermoz estalita.»
  _t=0 · argi: gorputz-adarren-mesenkima_
  - Ez dut ulertu: «Barruan pareta orriko mesodermoa dago; kanpoan, ektodermoa.»
  - **F** `w8/4/p3/s3` Pareta-orriko zelula mesodermikoak goiko eta beheko hazikinen erdigunean kokatzen dira, kanpotik ektodermoz estalita.

3. «Hastapenen erpinean ektodermoa loditu egiten da: erpineko ektodermo ertza.»
  _t=0.12 · argi: erpineko-ektodermo-ertza_
  - Ez dut ulertu: «Puntan ektodermoa lodiagoa egiten da: erpineko ektodermo ertza.»
  - **F** `w8/4/p4/s1` Hastapen hauen erpinean ektodermoa loditu egiten da, loditasun bat agertuz: erpineko ektodermo ertza.

4. «Seigarren astean esku eta oin plakak agertzen dira, eta lehen hertsadurak bi zati bereizten ditu.»
  _t=0.22 · argi: esku-plaka, oin-plaka_
  - Ez dut ulertu: «Seigarren astean puntak zapaldu egiten dira: esku eta oin plakak.»
  - g `w8/4/p6/s2` Esku eta oin plakak agertzen dira: hastapen hauetako urrutiko atalak lauagoak egiten dira.
  - g `w8/4/p6/s3` Hasierako hertsadurak agertzen dira hastapenetan, modu horretan bi zati desberdintzen dira.

5. «Esku plaketan lau ildo erradiatu agertzen dira, zelula batzuen apoptosiaren bidez.»
  _t=0.42 · argi: esku-plaka, izpiarteko-ildoak, apoptosia_
  - Ez dut ulertu: «Plaketan lau ildo agertzen dira, zelula batzuk programatuta hiltzen direlako.»
  - **F** `w8/4/p8/s1` ● Eskukoetan: 4 ildo erradiatu agertzen dira.
  - **F** `w8/4/p8/s2` Programatutako zelula batzuen apoptosia emanez agertu ildo hauek.

6. «Ildoen artean hatzetako izpiak gelditzen dira: hortik eskuetan hatzak, eta oinetan behatzak.»
  _t=0.42 · argi: hatzetako-izpiak · arbelean: b-hatzak_
  - Ez dut ulertu: «Ildoen artean gelditzen dena hatz bihurtzen da, eskuetan eta oinetan.»
  - **F** `w8/4/p8/s3` Ildo hauen artean gelditzen diren eremuak hatzetako izpiak izango dira, eta hauetatik, eskuetan hatzak sortuko dira.
  - **F** `w8/4/p9/s1` ● Oinekoetan: 4 ildo erradiatu agertzen dira.
  - g `w8/4/p9/s2` Ildo hauen artean gelditzen diren eremuak hatzetako izpiak izango dira, eta hauetatik, oinetan behatzak sortuko dira.

7. «Seigarren asterako lehen kartilagoak agertzen dira, gorputz-adarretako mesenkimatik.»
  _t=0.54 · argi: humeroa, erradioa, ulna, eskuko-kartilagoak, falangeak, femurra, tibia, peroneoa, tartsoaren-kartilagoak, metatartsoaren-kartilagoak, iliona, iskiona, pubisa_
  - Ez dut ulertu: «Seigarren asterako lehen kartilagoak ikusten dira: geroago hezur izango direnak.»
  - **F** `w8/4/p10/s1` Gapenaren 6. asterako, lehenengo kartilagoak agertzen dira (geroago hezurrak izango direnak) goiko eta beheko gorputz adarretako mesenkimatik.

8. «Beraz, gorputz-adarretako hezurrak hezurtzapen endokondralez sortzen dira.»
  _t=0.54 · emphasis · arbelean: b-adarrak_
  - Ez dut ulertu: «Beraz, besoetako eta hanketako hezurrak kartilagotik egiten dira.»
  - **F** `w8/4/p10/s3` Beraz, goiko eta beheko gorputz adarretan agertzen diren hezurrak hezurtzapen endokondral prozesu baten bitartez sortzen dira.

9. «Zortzigarren asterako, kartilago horien erdiko ataletan hezurtzapen zentroak agertzen dira.»
  _t=0.66 · argi: hezurtzapen-zentroak_
  - Ez dut ulertu: «Zortzigarren asterako, kartilagoen erdian hezurra egiten hasten da.»
  - **F** `w8/4/p12/s1` 8. asterako, goiko eta beheko gorputz adarretako kartilagoetan hezurtzapen zentroak azalduko dira erdiko ataletan.

10. «Zortzigarren astean gorputz-adarrek kontrako biraketak egiten dituzte.»
  _t=0.76_
  - Ez dut ulertu: «Zortzigarren astean besoek eta hankek kontrako aldera biratzen dute.»
  - **F** `w8/4/p13/s1` Adar hauetan, garapenaren 8. astean gorputz adarrek kontrako biraketak egiten dituzte.

11. «Goikoek laurogeita hamar gradu biratzen dute albora, kanpora.»
  _t=0.76_
  - Ez dut ulertu: «Besoek kanpora biratzen dute, angelu zuzen bat.»
  - **F** `w8/4/p14/s1` ● Goiko gorputz adarretako hastapenek 90 graduko biraketa bat (albora) egiten dute kanpo alderantz.

12. «Ondorioz, aurreko aldean muskulu tolestatzaileak gelditzen dira, eta atzean eta alboetan hedatzaileak.»
  _t=0.76 · argi: muskulu-tolestatzaileak, muskulu-hedatzaileak · arbelean: b-goikoak_
  - Ez dut ulertu: «Besoan, tolesteko muskuluak aurrean gelditzen dira, eta luzatzekoak atzean.»
  - **F** `w8/4/p14/s2` Biraketa honen ondorioz: ○ Goiko gorputz adarretako aurreko aldean gelditzen diren muskuluak muskulu tolestatzaileak edo flexoreak dira.
  - g `w8/4/p15/s1` ○ Goiko gorputz adarretako alde dortsalean eta lateraletan gelditzen direnak, berriz, muskulu hedatzaileak edo extensoreak.

13. «Behekoek kontrako biraketa egiten dute: laurogeita hamar gradu erdialderantz, barrurantz.»
  _t=0.88_
  - Ez dut ulertu: «Hankek alderantziz biratzen dute, barrurantz.»
  - **F** `w8/4/p16/s1` ● Beheko gorputz adarrei dagokienez, kontrako biraketa gertatzen da.
  - **F** `w8/4/p16/s2` Beheko gorputz adarretako hastapenak (hazikinak) erdialderantz (barrurantz) 90 graduko biraketa egiten dute eta biraketa honen ondorioz, beheko gorputz adarretako aurreko aldean kokatzen diren muskuluak muskulu hedatzaileak dira eta atzealdean kokatzen direnak muskulu tolestatzaileak.

14. «Horregatik hankan hedatzaileak aurrean daude, eta tolestatzaileak atzealdean.»
  _t=0.88 · emphasis · argi: muskulu-hedatzaileak, muskulu-tolestatzaileak · arbelean: b-behekoak_
  - Ez dut ulertu: «Hankan, luzatzeko muskuluak aurrean daude, eta tolestekoak atzean.»
  - **F** `w8/4/p16/s2` Beheko gorputz adarretako hastapenak (hazikinak) erdialderantz (barrurantz) 90 graduko biraketa egiten dute eta biraketa honen ondorioz, beheko gorputz adarretako aurreko aldean kokatzen diren muskuluak muskulu hedatzaileak dira eta atzealdean kokatzen direnak muskulu tolestatzaileak.
  - **F** `w8/4/p16/s3` 8 asterako, beraz, biraketa hauek emanda egongo dira.

- Arbela `b-hatzak`: Plaketan 4 ildo erradiatu (apoptosia); tartean hatzetako izpiak
  - **F** `w8/4/p8/s1` ● Eskukoetan: 4 ildo erradiatu agertzen dira.
  - **F** `w8/4/p8/s2` Programatutako zelula batzuen apoptosia emanez agertu ildo hauek.
  - **F** `w8/4/p8/s3` Ildo hauen artean gelditzen diren eremuak hatzetako izpiak izango dira, eta hauetatik, eskuetan hatzak sortuko dira.
- Arbela `b-adarrak`: 6. asterako kartilagoak: gorputz-adarretako hezurrak endokondralak
  - **F** `w8/4/p10/s1` Gapenaren 6. asterako, lehenengo kartilagoak agertzen dira (geroago hezurrak izango direnak) goiko eta beheko gorputz adarretako mesenkimatik.
  - **F** `w8/4/p10/s3` Beraz, goiko eta beheko gorputz adarretan agertzen diren hezurrak hezurtzapen endokondral prozesu baten bitartez sortzen dira.
- Arbela `b-goikoak`: Goikoak 90° albora: tolestatzaileak aurrean, hedatzaileak atzean
  - **F** `w8/4/p14/s1` ● Goiko gorputz adarretako hastapenek 90 graduko biraketa bat (albora) egiten dute kanpo alderantz.
  - **F** `w8/4/p14/s2` Biraketa honen ondorioz: ○ Goiko gorputz adarretako aurreko aldean gelditzen diren muskuluak muskulu tolestatzaileak edo flexoreak dira.
  - g `w8/4/p15/s1` ○ Goiko gorputz adarretako alde dortsalean eta lateraletan gelditzen direnak, berriz, muskulu hedatzaileak edo extensoreak.
- Arbela `b-behekoak`: Behekoak 90° erdialdera: hedatzaileak aurrean, tolestatzaileak atzean
  - **F** `w8/4/p16/s2` Beheko gorputz adarretako hastapenak (hazikinak) erdialderantz (barrurantz) 90 graduko biraketa egiten dute eta biraketa honen ondorioz, beheko gorputz adarretako aurreko aldean kokatzen diren muskuluak muskulu hedatzaileak dira eta atzealdean kokatzen direnak muskulu tolestatzaileak.
- Galdera (pool): mikro:8/gorputz-adarrak:4
- Galdera (contrast): Goiko eta beheko gorputz-adarrak: nora biratzen du bakoitzak?

## 8. Hezur luzeak

Etapa: `hezur-luzeak` · 11 lerro · ~53 s hitz eginda

1. «Hamabigarren asterako, hezur luze guztien erdiko atalean hezurtzapen zentro primarioak agertzen dira.»
  _t=0 · argi: hezurtzapen-zentroak_
  - Ez dut ulertu: «Hamabigarren asterako, hezur luze bakoitzaren erdian hezurtzen hasten da.»
  - **F** `w8/4/p18/s1` 12. asterako, hezur luze guztien erdiko atalean hezurtzapen zentro primarioak agertu dira.

2. «Hezur luzeek bi atal dituzte: diafisia, erdiko gorputza, eta epifisiak, muturrak.»
  _t=0.14 · argi: diafisia, epifisiak · arbelean: b-atalak_
  - Ez dut ulertu: «Hezur luzearen erdiko zatia diafisia da; bi muturrak, epifisiak.»
  - g `w8/4/p18/s2` Goi eta beheko gorputz adarretako hezur luzeetan bi atal bereizten dira:
  - **F** `w8/4/p19/s1` ● Diafisia/ hezurraren gorputza (erdiko eremua).
  - **F** `w8/4/p20/s1` ● Epifisiak (muturrak)

3. «Hasieran, zentro primarioak diafisia hezurtzen du, zentrotik ertzetaraino.»
  _t=0.26 · argi: diafisia_
  - Ez dut ulertu: «Lehenik diafisia hezurtzen da, zentrotik muturretarantz.»
  - **F** `w8/4/p22/s1` ● Hasieran, hezurtzapen zentroak, hezurtzapen zentro primario deituak, diafisiak hezurtzen hasten dira zentrotik ertzetaraino.

4. «Epifisiak, aldiz, kartilaginotsuak dira jaiotza arte.»
  _t=0.26 · argi: epifisiak_
  - Ez dut ulertu: «Muturrak, epifisiak, kartilagoa dira jaio arte.»
  - **F** `w8/4/p23/s1` ● Epifisiak, aldiz, kartilogenotsuak mantentzen dira jaiotza arte.

5. «Beraz, jaiotzean diafisiak hezurtuta daude, eta epifisiak ez.»
  _t=0.26 · emphasis · argi: diafisia, epifisiak · arbelean: b-jaiotza_
  - Ez dut ulertu: «Jaiotzean diafisia hezurra da, baina muturrak ez.»
  - **F** `w8/4/p24/s1` Beraz, jaiotzean, hezur luze guztien diafisiak hezurtuta daude; epifisiak, ordea, hezurtu barik daude oraindik.

6. «Jaio ondoren, epifisietan hezurtzapen zentro sekundarioak agertzen dira.»
  _t=0.42 · argi: hezurtzapen-zentro-sekundarioak, epifisiak_
  - Ez dut ulertu: «Jaio ondoren muturretan beste zentro batzuk agertzen dira, eta haiek ere hezurtzen dira.»
  - **F** `w8/4/p26/s1` Epifisietan (muturretan) hezurtzapen zentro sekundarioak agertzen dira, beraz, pixkanaka hezurtzapen zentro sekundario hauen muturrak/epifisiak  hezurtzen joango dira.

7. «Diafisiaren eta epifisiaren artean eskualde bat hezurtu gabe gelditzen da: hazkuntza plaka edo metafisia.»
  _t=0.56 · argi: hazkuntza-plaka, diafisia_
  - Ez dut ulertu: «Diafisiaren eta muturraren artean marra bat gelditzen da hezurtu gabe: hazkuntza plaka.»
  - **F** `w8/4/p27/s1` Hezurtuta dauden hezur luzeen diafisi eta epifisien artean beti eskualde bat hezurtu gabe gelditzen da, epifisi orria / metafisia/ hazkuntza plaka deitua, plaka honek epifisia eta diafisia lotzen ditu.

8. «Ez da hezurtzen, hezurra luzetara hazi dadin.»
  _t=0.56 · why · argi: hazkuntza-plaka · arbelean: b-plaka_
  - Ez dut ulertu: «Plaka horri esker hezurra luzatu egiten da.»
  - **F** `w8/4/p27/s2` Jaiotzean hezur hauen luzetarako hazkuntza bermatzeko hain zuzen ere ez da hezurtzen.

9. «Hazkuntza maximoa lortzean metafisia desagertu egiten da, eta diafisia epifisiekin fusionatzen da.»
  _t=0.72 · argi: hazkuntza-plaka, diafisia, epifisiak_
  - Ez dut ulertu: «Hazten bukatzean plaka desagertzen da, eta hezurraren zatiak elkartu egiten dira.»
  - g `w8/4/p27/s3` Behin luzetarako hazkuntza maximoa lortu denean, metafisia desagertu egiten da eta diafisia epifisiekin fusionatzen da.

10. «Normalean bi hazkuntza plaka daude, bi muturretan: femurrean, adibidez.»
  _t=0.84 · argi: hazkuntza-plaka, femurra_
  - Ez dut ulertu: «Gehienetan bi plaka daude, mutur bakoitzean bat, femurrean bezala.»
  - **F** `w8/4/p29/s1` ● Normalean bi epifisi/hazkuntza plaka egoten dira: bi muturretatik hazten da hezurra (izter hezurrean esaterako).

11. «Falangeetan, berriz, plaka bakarra dago: mutur bakarretik hazten dira.»
  _t=0.84 · argi: falangeak, hazkuntza-plaka_
  - Ez dut ulertu: «Hatzetako hezurretan plaka bakarra dago.»
  - **F** `w8/4/p30/s1` ● Epifisi plaka bakarra: mutur bakarretik hazten da hezurra (hatzetako falangeetan esaterako).

- Arbela `b-atalak`: Hezur luzea: diafisia (erdiko gorputza) eta epifisiak (muturrak)
  - **F** `w8/4/p19/s1` ● Diafisia/ hezurraren gorputza (erdiko eremua).
  - **F** `w8/4/p20/s1` ● Epifisiak (muturrak)
- Arbela `b-jaiotza`: Jaiotzean: diafisiak hezurtuta, epifisiak kartilaginotsuak
  - **F** `w8/4/p24/s1` Beraz, jaiotzean, hezur luze guztien diafisiak hezurtuta daude; epifisiak, ordea, hezurtu barik daude oraindik.
- Arbela `b-plaka`: Hazkuntza plaka (metafisia): ez da hezurtzen, luzetarako hazkuntza
  - **F** `w8/4/p27/s1` Hezurtuta dauden hezur luzeen diafisi eta epifisien artean beti eskualde bat hezurtu gabe gelditzen da, epifisi orria / metafisia/ hazkuntza plaka deitua, plaka honek epifisia eta diafisia lotzen ditu.
  - **F** `w8/4/p27/s2` Jaiotzean hezur hauen luzetarako hazkuntza bermatzeko hain zuzen ere ez da hezurtzen.
- Galdera (contrast): Zentro primarioak eta sekundarioak: non agertzen dira?
- Galdera (pool): w8-q-zentro-sekundarioak

## 9. Ornoaren atalak

Etapa: `ornoa` · 10 lerro · ~44 s hitz eginda

1. «Orno gorputza ornoaren aurreko atala da, bentralerantz kokatua.»
  _t=0 · argi: orno-gorputza_
  - Ez dut ulertu: «Ornoaren aurreko zati lodia orno gorputza da.»
  - **F** `w8/5.1/p2/s1` ● Orno gorputza (aurreko atala): aldea bentralerantz kokatuta dago.

2. «Orno arkua, edo arku neurala, gorputzaren atze-alboko zatian dago.»
  _t=0.14 · argi: orno-arkua_
  - Ez dut ulertu: «Orno arkua gorputzaren atzean eta alboetan dago.»
  - **F** `w8/5.1/p3/s1` ● Arku neurala / orno arkua: Orno gorputzaren atze- alboko zatian kokatua dago.

3. «Arkutik hainbat apofisi irteten dira. Alboetara, apofisi zeharrak.»
  _t=0.26 · argi: apofisi-zeharrak_
  - Ez dut ulertu: «Arkutik zenbait punta ateratzen dira. Alboetara doazenak apofisi zeharrak dira.»
  - g `w8/5.1/p3/s2` Bertatik hainbat apofisi irteten dira:
  - **F** `w8/5.1/p4/s1` ● Alboetara: Apofisi zeharrak / Zeharkako apofisiak

4. «Atzealdera, arantza apofisia: bizkarrean ikusten duguna.»
  _t=0.36 · argi: arantza-apofisia_
  - Ez dut ulertu: «Atzera doana arantza apofisia da: bizkarrean ukitzen duguna.»
  - **F** `w8/5.1/p5/s1` ● Atzealdera: Arantza apofisia (bizkarrean ikusten ditugunak)

5. «Eta, azkenik, apofisi artikularrak.»
  _t=0.46 · argi: apofisi-artikularrak · arbelean: b-ornoa_
  - Ez dut ulertu: «Azkenik, apofisi artikularrak, ornoak elkarrekin lotzeko.»
  - **F** `w8/5.1/p6/s1` ● Apofisi artikularrak

6. «Gorputzaren eta arkuaren artean zulo bat gelditzen da: orno zuloa.»
  _t=0.56 · argi: orno-zuloa_
  - Ez dut ulertu: «Gorputzaren eta arkuaren artean zulo bat dago: orno zuloa.»
  - **F** `w8/5.3/p2/s1` ● Gorputzaren eta arku neuralaren artean zulo bat geldituko da → Orno zuloa / zulo bertebrala.

7. «Orno guztien zuloek hodi errakideoa eratzen dute, eta hor ornomuina kokatzen da.»
  _t=0.66 · emphasis · argi: hodi-errakideoa, ornomuina · arbelean: b-hodia_
  - Ez dut ulertu: «Zulo guztiak bata bestearen gainean hodi bat dira, eta haren barruan ornomuina dago.»
  - **F** `w8/5.3/p3/s1` ● Orno guztien orno zuloek hodi errakideo bat eratuko dute eta ornomuina hemen kokatuko da.
  - **F** `w8/5.1/p7/s1` ● Aurreko atala: Orno gorputza kokatzen dena tubo bat sortuz.

8. «Ornomuinean, goitik behera, segmentuak daude: lepokoak, bizkarrekoak eta gerrikoak.»
  _t=0.66 · argi: ornomuina_
  - Ez dut ulertu: «Ornomuina zatika dago: lepokoak, bizkarrekoak eta gerrikoak.»
  - **F** `w8/5.3/p3/s2` ○ Ornomuin horretan goitik behera segmentu desberdinak daude (lepokoak, bizkarrekoak, gerrikoak)

9. «Segmentu bakoitzarekin nerbio espinal bikote bat erlazionatzen da.»
  _t=0.78 · argi: nerbio-espinalak_
  - Ez dut ulertu: «Zati bakoitzetik bi nerbio espinal ateratzen dira, bat alde bakoitzera.»
  - **F** `w8/5.3/p4/s1` ➢ Segmentu bakoitzarekin nerbio errakideo / espinal bikote bat erlazionatzen da.

10. «Nerbio horiek ornoarteko zuloetatik irteten dira, diskoen mailan.»
  _t=0.78 · argi: nerbio-espinalak, ornoarteko-zuloak · arbelean: b-nerbioak_
  - Ez dut ulertu: «Nerbioak ornoen arteko zuloetatik ateratzen dira.»
  - **F** `w8/5.3/p5/s1` ➢ Orno muinaren segmentu ezberdinekin erlazionatzen diren errakideoak / espinalak bizkarezurreko orno arteko zuloetatik irteten dira (zulo hauek orno arteko diskoaren mailetan kokatuak daude)

- Arbela `b-ornoa`: Ornoa: gorputza aurrean; arkua atze-alboan; apofisi zeharrak, arantza apofisia, apofisi artikularrak
  - **F** `w8/5.1/p2/s1` ● Orno gorputza (aurreko atala): aldea bentralerantz kokatuta dago.
  - **F** `w8/5.1/p3/s1` ● Arku neurala / orno arkua: Orno gorputzaren atze- alboko zatian kokatua dago.
  - **F** `w8/5.1/p4/s1` ● Alboetara: Apofisi zeharrak / Zeharkako apofisiak
  - **F** `w8/5.1/p5/s1` ● Atzealdera: Arantza apofisia (bizkarrean ikusten ditugunak)
  - **F** `w8/5.1/p6/s1` ● Apofisi artikularrak
- Arbela `b-hodia`: Orno zuloak: hodi errakideoa, ornomuina barruan
  - **F** `w8/5.3/p2/s1` ● Gorputzaren eta arku neuralaren artean zulo bat geldituko da → Orno zuloa / zulo bertebrala.
  - **F** `w8/5.3/p3/s1` ● Orno guztien orno zuloek hodi errakideo bat eratuko dute eta ornomuina hemen kokatuko da.
- Arbela `b-nerbioak`: Nerbio espinalak: ornoarteko zuloetatik
  - **F** `w8/5.3/p5/s1` ➢ Orno muinaren segmentu ezberdinekin erlazionatzen diren errakideoak / espinalak bizkarezurreko orno arteko zuloetatik irteten dira (zulo hauek orno arteko diskoaren mailetan kokatuak daude)
- Galdera (contrast): Orno zuloa eta ornoarteko zuloak: zer igarotzen da bakoitzetik?
- Galdera (pool): mikro:8/ornoa:1

## 10. Birsegmentazioa

Etapa: `bizkarrezurra` · 16 lerro · ~87 s hitz eginda

1. «Somitetako zelulak berdinak dira hasieran, baina gero miotoma, dermatoma eta esklerotoma bereizten dira.»
  _t=0 · argi: somitak, miotoma, dermatoma, esklerotoma_
  - Ez dut ulertu: «Somitako zelulak hasieran berdinak dira; gero hiru taldetan banatzen dira.»
  - **F** `w8/5.2/p2/s1` Dakigunez, mesodermo paraxiala alde okzipitaletik behera segmentatzen da eta somitak agertzen dira.
  - g `w8/5.2/p2/s2` Somitetako zelula guztiak berdinak dira hasieran baina prozesu desberdinak eginez gaitasun ezberdineko zelulak agertzen dira: miotoma, dermotoma eta esklerotoma zelulak.

2. «Laugarren astean esklerotomako zelulak erdialdera migratzen dute, hodi neurala eta notokorda inguratzeko.»
  _t=0.08 · argi: esklerotoma, hodi-neurala, notokorda_
  - Ez dut ulertu: «Laugarren astean esklerotomako zelulak erdira doaz, hodi neurala eta notokorda inguratzera.»
  - **F** `w8/5.2.1/p2/s1` Somitetako esklerotoma zelulek erdikaldera migratzean (4. astean), hodi neurala eta notokordaren inguruan mesenkima zutabea / esklerotoma zutabea (bizkarrezurrarena) deituriko egitura sortzen da.

3. «Hor mesenkima zutabea sortzen da, edo esklerotoma zutabea.»
  _t=0.08 · argi: mesenkima-zutabea · arbelean: b-zutabea_
  - Ez dut ulertu: «Horrela mesenkima zutabea egiten da.»
  - **F** `w8/5.2.1/p2/s1` Somitetako esklerotoma zelulek erdikaldera migratzean (4. astean), hodi neurala eta notokordaren inguruan mesenkima zutabea / esklerotoma zutabea (bizkarrezurrarena) deituriko egitura sortzen da.

4. «Zutabean segmentuak bereizten dira, eta haien artean segmentu arteko mesenkima.»
  _t=0.17 · argi: esklerotoma-segmentuak, segmentu-arteko-mesenkima_
  - Ez dut ulertu: «Zutabean zati trinkoak daude, eta haien artean segmentu arteko mesenkima.»
  - **F** `w8/5.2/p5/s2` Zutabe honetan, segmentu ezberdinak bereizten dira , segmentu horien artean segmentu arteko mesenkima kokatzen dalarik.
  - **F** `w8/5.2.1/p2/s2` Hodi neurala eta notokorda inguratu eta mesenkima zutabea eratzen da non segmentu ezberdinak bereizten diren, segmentu horien artean segmentu arteko mesenkima kokatzen da.

5. «Orain gertaera nagusia: birsegmentazioa. Segmentu bakoitza bi erditan banatzen da, goikoa eta behekoa.»
  _t=0.35 · emphasis · argi: birsegmentazioa, esklerotoma-segmentuak_
  - Ez dut ulertu: «Orain garrantzitsuena: birsegmentazioa. Segmentu bakoitza bitan zatitzen da, goiko erdia eta beheko erdia.»
  - **F** `w8/5.2.1/p2/s4` Mesenkima zutabe horietan, birsegmentazio prozesu bat ematen da, non jatorrizko esklerotoma segmentu guztietan bi atal bereizten diren, goiko eta beheko atalak.

6. «Segmentu baten beheko erdia azpiko segmentuaren goiko erdiarekin fusionatzen da.»
  _t=0.44 · argi: orno-gorputza_
  - Ez dut ulertu: «Segmentu baten beheko erdia azpikoaren goiko erdiarekin elkartzen da.»
  - g `w8/5.2.1/p3/s1` Esklerotoma segmentu horien behe erdiko zelulak ugaldu egiten dira, eta behean duten esklerotoma segmentuaren goiko erdiko atalarekin fusionatzen dira.

7. «Beraz, orno bakoitza bi segmentutatik sortzen da, eta horrela orno gorputzak eratzen dira.»
  _t=0.44 · argi: orno-gorputza · arbelean: b-birsegmentazioa_
  - Ez dut ulertu: «Horregatik orno bakoitza bi segmenturen zatiekin egiten da.»
  - **F** `w8/5.2.1/p3/s2` Beraz, orno bakoitza bi hasierako segmentu ezberdinetik sortzen da.
  - **F** `w8/5.2.1/p3/s3` Prozesu honen ondorioz ornogorputzak eratzen dira.

8. «Horregatik esaten da ornoen jatorria intersegmentarioa dela.»
  _t=0.44 · why · argi: orno-gorputza, segmentu-arteko-mesenkima_
  - Ez dut ulertu: «Hori da jatorri intersegmentarioa: ornoa segmentuen artean sortzen da.»
  - **F** `w8/5.2.1/p17/s1` ○ Prozesu hau modu honetan gertatu denez, ornoak daukaten jatorria intersegmentarioa dela esaten da (segmentu arteko mailan gertatzen delako ornoen eraketa).

9. «Erdien artean gelditzen diren zeluletatik ornoarteko diskoa eratzen da.»
  _t=0.53 · argi: ornoarteko-diskoa_
  - Ez dut ulertu: «Bi erdien artean gelditzen diren zelulek ornoarteko diskoa egiten dute.»
  - **F** `w8/5.2.1/p8/s1` Esklerotoma segmentu baten goi eta beheko-erdiko atal hauen artean gelditzen diren zelula hauetatik orno arteko diskoa eratzen da.

10. «Notokorda orno gorputzetan desagertu egiten da, baina diskoetan ez: gune pulposoa sortzen du.»
  _t=0.61 · emphasis · argi: notokorda, gune-pulposoa, orno-gorputza_
  - Ez dut ulertu: «Notokorda ornoetan galtzen da, baina diskoetan gelditzen da: gune pulposoa.»
  - g `w8/5.2.1/p9/s1` ➢ Notokorda endekatu eta desagertuegiten da ornogorputzaren mailetan, baina ornoarteko diskoetan ez da desagertzen.
  - g `w8/5.2.1/p10/s1` ➢ Ornoarteko diskoaren arteko mailetan notokorda endekapen prozesu berezi bat eginez, ornoarteko diskoaren nukleo/gune pulposoa sortzen du.

11. «Haren inguruko mesenkimatik eraztun fibrosoa sortzen da.»
  _t=0.61 · argi: eraztun-fibrosoa · arbelean: b-diskoa_
  - Ez dut ulertu: «Inguruan, eraztun fibrosoa.»
  - **F** `w8/5.2.1/p11/s1` - Nukleo pulposo honen inguruko mesenkimatik sortzen da ornoarteko diskoaren gainerako atala: Eraztun fibrosoa.

12. «Birsegmentazioaren ondorioz, miotomak orno batetik bestera hedatzen dira.»
  _t=0.7 · argi: birsegmentazioa, miotoma_
  - Ez dut ulertu: «Birsegmentazioaren ondorioz, muskulu bakoitzak bi orno lotzen ditu.»
  - **F** `w8/5.2.1/p12/s1` Birsegmentazio prozesuaren ondorioz:
  - **F** `w8/5.2.1/p20/s1` a. Miotoma muskuluak eta hemendik sortutako nerbioak orno gorputz batetik bestera abiatu eta hedatuko dira→ Muskuluek bizkarrezurra mugitu behar dutelako.

13. «Zergatik? Muskuluek bizkarrezurra mugitu behar dutelako. Nerbio espinalekin gauza bera gertatzen da.»
  _t=0.7 · why · argi: miotoma, nerbio-espinalak_
  - Ez dut ulertu: «Horrela muskuluek bizkarrezurra mugi dezakete. Nerbioekin ere berdin.»
  - **F** `w8/5.2.1/p20/s1` a. Miotoma muskuluak eta hemendik sortutako nerbioak orno gorputz batetik bestera abiatu eta hedatuko dira→ Muskuluek bizkarrezurra mugitu behar dutelako.
  - g `w8/5.2.1/p15/s1` Gauza bera gertatuko da ornomuinaren segmentu desberdinetatik irtetzen diren nerbio espespinalekin/ errakideokin.

14. «Bizkarrezurraren makurdurak: zifosia primarioa da, jaio aurrekoa, eta atzerantz ganbila.»
  _t=0.84 · argi: zifosia_
  - Ez dut ulertu: «Lehen makurdura, zifosia, jaio aurretik dago, eta atzera irteten da.»
  - **F** `w8/5.2.1/p25/s1` ● Zifosia (makurdura primarioa): jaio aurrekoa da eta atzerantza ganbilak dira.

15. «Bi dira: bizkarrekoa eta sakroarena.»
  _t=0.84 · argi: zifosia_
  - Ez dut ulertu: «Bizkarrean eta sakroan daude.»
  - g `w8/5.2.1/p25/s2` 2 makurdura bereizten dira: bizkarrezkoa eta sakroarena.

16. «Lordosia sekundarioa da, jaio ondoren garatzen dena: burua altxatzean lepokoa, eta ibiltzean gerrikoa.»
  _t=0.91 · argi: lordosia · arbelean: b-makurdurak_
  - Ez dut ulertu: «Lordosia jaio ondoren dator: lepokoa burua altxatzean, gerrikoa ibiltzen hastean.»
  - **F** `w8/5.2.1/p26/s1` ● Lordosia (makurdura sekundarioa): jaio eta gero garatzen dira eta “c” itxurakoa da.
  - **F** `w8/5.2.1/p26/s2` Burua altxatuz lepokoa garatzen da eta ibiltzean gerrikoa (lumbar) agertzen da.

- Arbela `b-zutabea`: 4. astea: esklerotoma erdialdera, mesenkima zutabea
  - **F** `w8/5.2.1/p2/s1` Somitetako esklerotoma zelulek erdikaldera migratzean (4. astean), hodi neurala eta notokordaren inguruan mesenkima zutabea / esklerotoma zutabea (bizkarrezurrarena) deituriko egitura sortzen da.
- Arbela `b-birsegmentazioa`: Birsegmentazioa: beheko erdia eta azpikoaren goiko erdia, orno gorputza
  - **F** `w8/5.2.1/p2/s4` Mesenkima zutabe horietan, birsegmentazio prozesu bat ematen da, non jatorrizko esklerotoma segmentu guztietan bi atal bereizten diren, goiko eta beheko atalak.
  - g `w8/5.2.1/p3/s1` Esklerotoma segmentu horien behe erdiko zelulak ugaldu egiten dira, eta behean duten esklerotoma segmentuaren goiko erdiko atalarekin fusionatzen dira.
  - **F** `w8/5.2.1/p3/s2` Beraz, orno bakoitza bi hasierako segmentu ezberdinetik sortzen da.
- Arbela `b-diskoa`: Diskoa: notokordatik gune pulposoa, inguruko mesenkimatik eraztun fibrosoa
  - g `w8/5.2.1/p10/s1` ➢ Ornoarteko diskoaren arteko mailetan notokorda endekapen prozesu berezi bat eginez, ornoarteko diskoaren nukleo/gune pulposoa sortzen du.
  - **F** `w8/5.2.1/p11/s1` - Nukleo pulposo honen inguruko mesenkimatik sortzen da ornoarteko diskoaren gainerako atala: Eraztun fibrosoa.
- Arbela `b-makurdurak`: Zifosia: primarioa, jaio aurretik. Lordosia: sekundarioa, jaio ondoren
  - **F** `w8/5.2.1/p25/s1` ● Zifosia (makurdura primarioa): jaio aurrekoa da eta atzerantza ganbilak dira.
  - **F** `w8/5.2.1/p26/s1` ● Lordosia (makurdura sekundarioa): jaio eta gero garatzen dira eta “c” itxurakoa da.
- Galdera (pool): mikro:8/bizkarrezurra:4
- Galdera (contrast): Orno gorputza eta ornoarteko diskoa: nondik sortzen da bakoitza?
- Galdera (pool): w8-q-makurdurak

## 11. Saihetsak eta esternoia

Etapa: `saihetsak` · 7 lerro · ~45 s hitz eginda

1. «Saihetsetan bi atal bereizten dira. Atzeko atala hezurrezkoa da, saihets hezurra; aurrekoa, saihets kartilagoa.»
  _t=0 · argi: saihets-hezurra, saihets-kartilagoa_
  - Ez dut ulertu: «Saihetsak bi zati ditu: atzean hezurra, aurrean kartilagoa.»
  - **F** `w8/5.4/p2/s1` Bi atal bereizten dira:
  - **F** `w8/5.4/p3/s1` ● Atzeko atala hezurrezkoa → Saihets hezurra.

2. «Saihets hezurrak somiten esklerotomatik eratzen dira.»
  _t=0.14 · argi: saihets-hezurra, esklerotoma_
  - Ez dut ulertu: «Saihets hezurrak esklerotomatik datoz.»
  - g `w8/5.4/p5/s1` ○ Somitetako esklerotomatik eratzen dira.

3. «Esklerotoma zelula batzuek alboetara migratzen dute, eta somitaren alboko muga gurutzatzen dute.»
  _t=0.14 · emphasis · argi: esklerotoma, somitaren-alboko-muga_
  - Ez dut ulertu: «Esklerotomako zelula batzuk alboetara doaz, eta somitaren alboko muga gainditzen dute.»
  - **F** `w8/5.4/p6/s1` ➢ Esklerotoma zelula batzuk alboetara migratu eta somiten alde lateralean dagoen muga bat gurutzatu: Somitaren alboko muga.

4. «Alboko mesodermoaren paretako orriraino iristen dira, eta bertan saihets hezurrak sortzen dira.»
  _t=0.28 · argi: paretako-orria, saihets-hezurra · arbelean: b-saihets-hezurra_
  - Ez dut ulertu: «Paretako orriraino heltzen dira, eta han saihets hezurrak egiten dituzte.»
  - g `w8/5.4/p7/s1` ➢ Alboko mesodermoaren pareta orriraino iritsi.
  - g `w8/5.4/p8/s1` ➢ Bertan sahiets hezurrak sortu.

5. «Aurreko atala, saihets kartilagoa, alboko mesodermoaren paretako orritik sortzen da zuzenean.»
  _t=0.42 · caution · argi: saihets-kartilagoa, paretako-orria · arbelean: b-saihets-kartilagoa_
  - Ez dut ulertu: «Kontuz: saihets kartilagoa paretako orritik dator zuzenean.»
  - **F** `w8/5.4/p9/s1` ● Aurreko atala kartilagenozkoa → Saihets kartilagoa.
  - **F** `w8/5.4/p10/s1` ○ Alboko mesodermoaren paretako orritik sortu zuzenean.

6. «Bularrezurrarekin antzekoa gertatzen da: paretako orritik kartilagoak agertzen dira goitik behera, eta elkarrekin fusionatzen dira.»
  _t=0.56 · argi: esternoi-barrak, paretako-orria_
  - Ez dut ulertu: «Bularrezurra ere paretako orritik dator: kartilago zatiak goitik behera agertu eta elkartu egiten dira.»
  - g `w8/5.4/p10/s2` ○ Torax aurreko esternoiarekin (bularezurra) antzekoa gertatu.
  - **F** `w8/5.4/p10/s3` ➢ Paretetik kartilago desberdinak agertu (goitik behera) ➢ Beraien artean fusionatu.

7. «Bularrezurrean hiru atal eratzen dira: kirtena, gorputza eta xifoide apofisia.»
  _t=0.76 · argi: kirtena, esternoiaren-gorputza, apofisi-xifoidea · arbelean: b-esternoia_
  - Ez dut ulertu: «Bularrezurrak hiru zati ditu: kirtena, gorputza eta xifoide apofisia.»
  - **F** `w8/5.4/p11/s1` ➢ 3 atal eratu: Kirtena, gorputza eta xifoide apofisia.

- Arbela `b-saihets-hezurra`: Saihets hezurra: esklerotomatik, somitaren alboko muga gurutzatuz
  - g `w8/5.4/p5/s1` ○ Somitetako esklerotomatik eratzen dira.
  - **F** `w8/5.4/p6/s1` ➢ Esklerotoma zelula batzuk alboetara migratu eta somiten alde lateralean dagoen muga bat gurutzatu: Somitaren alboko muga.
- Arbela `b-saihets-kartilagoa`: Saihets kartilagoa: paretako orritik zuzenean
  - **F** `w8/5.4/p9/s1` ● Aurreko atala kartilagenozkoa → Saihets kartilagoa.
  - **F** `w8/5.4/p10/s1` ○ Alboko mesodermoaren paretako orritik sortu zuzenean.
- Arbela `b-esternoia`: Esternoia: paretako orria; kirtena, gorputza, xifoide apofisia
  - g `w8/5.4/p10/s2` ○ Torax aurreko esternoiarekin (bularezurra) antzekoa gertatu.
  - **F** `w8/5.4/p11/s1` ➢ 3 atal eratu: Kirtena, gorputza eta xifoide apofisia.
- Galdera (contrast): Saihets hezurra eta saihets kartilagoa: nondik sortzen da bakoitza?

## 12. Osatu taula

Etapa: `errai-kraneoa` · 3 lerro · ~16 s hitz eginda

1. «Laburbilduz: hezurrak mesodermo paraxialetik, paretako orritik eta gandor neuraletik datoz.»
  _t=0.92 · summary · argi: gandor-neurala_
  - Ez dut ulertu: «Gogoratu hiru iturriak: mesodermo paraxiala, paretako orria eta gandor neurala.»
  - **F** `w8/1/p2/s1` Gure gorputzaren hezurrak mesodermo paraxialetik (somitomero eta somitetatik), alboko mesodermoko pareta-orritik eta gandor neuraletako zeluletatik (jatorriz ektodermikoak) sortuko dira.

2. «Buru-ganga mintzezkoa da; kondrokraneoa, gorputz-adarrak eta ornoak, endokondralak.»
  _t=0.92 · summary_
  - Ez dut ulertu: «Buru-ganga zuzenean hezurtzen da; burezurraren zorua, besoak, hankak eta ornoak, kartilagotik.»
  - g `w8/3.1.1/p2/s2` Hezur hauek mintzezko hezurtzapena dute, hau da, zuzenean hezurtzen dira eta zapalak edo lauak dira:
  - **F** `w8/3.1.2/p2/s2` Oinaldean dauden hezur zati hauek hezurtzapen endokondralaren bidez sortzen dira; hau da, mesenkimatik sortutako kartilagoatik eratutako hezurrak dira.
  - **F** `w8/4/p10/s3` Beraz, goiko eta beheko gorputz adarretan agertzen diren hezurrak hezurtzapen endokondral prozesu baten bitartez sortzen dira.

3. «Orain zure txanda: osatu aurpegiko kartilagoen taula oroimenetik.»
  _t=0.92 · summary_
  - Ez dut ulertu: «Orain zu: bete taula buruz.»
  - · `w8/3.2/p6/s1` ○ Maxilar prozesuan, bertara iritsi diren gandor neuraletako zelulek kartilago bat sortzen dute, barra pterigopalatino karratua, hemendik bitarteko balarrian daukagun hezurtxo bat garatzen da, ingudea (yunque).
  - **F** `w8/3.2/p8/s1` ○ Barail prozesuan, lehenengo arkuaren atal bentralera iritsi diren gandor neuraleko zelulek Meckel kartilagoa sortzen dute, hemendik ere bitarteko bitarteko belarriaren hezurtxo bat garatzen da, mailua.
  - **F** `w8/3.2/p9/s1` Barail prozesutik eta bigarren arku faringeoaren mesenkimatik (Mesenkima hau gandor neuraletako zeluletatik agertu delarik) Reichert kartilagoa sortuko da, eta bertatik ere bitarteko belarriaren hezurtxo bat garatuko da, mailua, ointoki edo estriboa.

- Galdera (fill): klasea:8/taula

## Estaldura

- Funtsezko esaldiak: 111 / 205; klaseak esaten ditu: 111.
- Klaseak aipatzen dituen esaldi guztiak: 157.
- Hitz egiteko denbora: ~12 min (galderak aparte).
