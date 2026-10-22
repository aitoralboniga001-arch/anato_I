# 12. gaiko klasea: iturriak

_Sortua: `npx tsx scripts/klasea/audit.ts 12`. F = funtsezkoa, g = garrantzitsua._

## 0. Gaur

Etapa: `sarrera` · 8 lerro · ~37 s hitz eginda

1. «Kaixo! Gaur arteria sistemaren garapena ikasiko dugu.»
  _t=0.12_
  - Ez dut ulertu: «Gaurko gaia: arteriak nola sortzen eta aldatzen diren enbrioian.»
  - **F** `w12/1/p4/s1` Arteriak, bihotzetik gorputzeko beste ataletarantz odola eramaten dituzten odol-hodiak dira.

2. «Arteria bat bihotzetik gorputzeko beste ataletara odola eramaten duen odol hodia da.»
  _t=0.12 · emphasis · arbelean: b-arteria_
  - Ez dut ulertu: «Arteria: bihotzetik ateratzen den hodia. Odola bihotzetik gorputz osora eramaten du.»
  - **F** `w12/1/p4/s1` Arteriak, bihotzetik gorputzeko beste ataletarantz odola eramaten dituzten odol-hodiak dira.

3. «Bihotz lakioaren alde bulbarraren urrutiko atalari arteria enborra deritzo.»
  _t=0.28 · argi: bihotz-lakioa, enbor-arteriosoa_
  - Ez dut ulertu: «Bihotz lakioaren irteerako zatiari, arteriak sortzen diren tokiari, arteria enborra deitzen zaio.»
  - **F** `w12/1/p4/s3` Bihotz-lakioaren alde bulbarraren urrutiko atalari arteria enbor eta arteria bulboa deritzo; hortik garatuko dira gure gorputzeko arteria garrantzitsuenak (birika-arteria/birika enborra eta aorta-arteria).

4. «Handik garatuko dira gure arteria garrantzitsuenak: birika enborra eta aorta.»
  _t=0.28 · emphasis · argi: enbor-arteriosoa · arbelean: b-enborra_
  - Ez dut ulertu: «Enbor horretatik sortuko dira bi arteria handienak: birika enborra eta aorta.»
  - **F** `w12/1/p4/s3` Bihotz-lakioaren alde bulbarraren urrutiko atalari arteria enbor eta arteria bulboa deritzo; hortik garatuko dira gure gorputzeko arteria garrantzitsuenak (birika-arteria/birika enborra eta aorta-arteria).

5. «Zilborreko zainek karenatik odol oxigenatua dakarte.»
  _t=0.635 · argi: zilbor-zainak_
  - Ez dut ulertu: «Zilborreko zainek karenatik datorren odola dakarte, oxigenoz betea.»
  - **F** `w12/1/p4/s5` Zilborretako zainetatik karenatik datorren odola “oxigenatua” da (hau da, odol kontzentrazio altukoa), eta bitelino eta kardinal zainetatik datorren odolak oxigeno gutxi dauka.

6. «Bitelo zainak eta kardinal zainak, berriz, oxigeno gutxiko odola dakarte.»
  _t=0.635 · argi: bitelo-zainak_
  - Ez dut ulertu: «Bitelo zainak eta kardinal zainak, aldiz, oxigeno gutxiko odola dakarte.»
  - **F** `w12/1/p4/s5` Zilborretako zainetatik karenatik datorren odola “oxigenatua” da (hau da, odol kontzentrazio altukoa), eta bitelino eta kardinal zainetatik datorren odolak oxigeno gutxi dauka.

7. «Beraz, bihotz lakioan bi odolak nahasten dira.»
  _t=0.635 · emphasis · argi: bihotz-lakioa · arbelean: b-odola_
  - Ez dut ulertu: «Zain guztiak bihotz lakiora iristen dira, eta han odol oxigenatua eta oxigeno gutxikoa nahasten dira.»
  - **F** `w12/1/p4/s6` Beraz, bihotz-lakioan odol oxigenatua eta oxigeno gutxiko odola nahastuko dira.

8. «5. astean, lepoan, 6 faringe arku bikote agertzen dira. Bakoitzak bere arteria du: aorta arkua.»
  _t=0.96 · emphasis · argi: faringe-arkuak, aorta-arkuak · arbelean: b-arkua_
  - Ez dut ulertu: «Lepoan sei koskor bikote sortzen dira, faringe arkuak. Arku bakoitzak bere arteria izango du: aorta arkua.»
  - g `w12/1/p5/s1` Garapenaren 5. astean, lepo mailan arku faringeoak agertzen dira mesodermoz eratutakoak; guztira, 6 arku faringeo bikote azalduz.
  - **F** `w12/1/p5/s2` Arku faringeo bakoitzak arteria bat izango du, arku aortikoak izenekoak.

- Arbela `b-arteria`: Arteria: bihotzetik gorputzeko beste ataletara odola eramaten duen odol hodia
  - **F** `w12/1/p4/s1` Arteriak, bihotzetik gorputzeko beste ataletarantz odola eramaten dituzten odol-hodiak dira.
- Arbela `b-enborra`: Arteria enborra (alde bulbarraren urrutiko atala): birika enborra eta aorta
  - **F** `w12/1/p4/s3` Bihotz-lakioaren alde bulbarraren urrutiko atalari arteria enbor eta arteria bulboa deritzo; hortik garatuko dira gure gorputzeko arteria garrantzitsuenak (birika-arteria/birika enborra eta aorta-arteria).
- Arbela `b-odola`: Zilborreko zainak: odol oxigenatua. Bitelo eta kardinal zainak: oxigeno gutxi. Bihotz lakioan nahasten dira
  - **F** `w12/1/p4/s5` Zilborretako zainetatik karenatik datorren odola “oxigenatua” da (hau da, odol kontzentrazio altukoa), eta bitelino eta kardinal zainetatik datorren odolak oxigeno gutxi dauka.
  - **F** `w12/1/p4/s6` Beraz, bihotz-lakioan odol oxigenatua eta oxigeno gutxiko odola nahastuko dira.
- Arbela `b-arkua`: Faringe arku bakoitzak bere arteria: aorta arkua (6 bikote)
  - g `w12/1/p5/s1` Garapenaren 5. astean, lepo mailan arku faringeoak agertzen dira mesodermoz eratutakoak; guztira, 6 arku faringeo bikote azalduz.
  - **F** `w12/1/p5/s2` Arku faringeo bakoitzak arteria bat izango du, arku aortikoak izenekoak.
- Galdera (predict): Zer uste duzu: enbrioian, nondik ateratzen dira arteria handiak?
- Galdera (pool): mikro:12/sarrera:3

## 1. Arku sistema

Etapa: `arku-sistema` · 5 lerro · ~29 s hitz eginda

1. «Enbor arteriosoaren urrutiko atalari aorta zakua deritzo.»
  _t=0.1275 · argi: enbor-arteriosoa, aorta-zakua_
  - Ez dut ulertu: «Arteria enborraren muturrari aorta zakua deitzen zaio: hortik aterako dira arteriak.»
  - **F** `w12/2/p3/s1` Enbor arteriosoaren urrutiko ataletik (aorta zakua), bi alboko luzapeneko odol-hodi eratzen dira: aorta dortsalak (eskumako bat eta ezkerreko beste bat).

2. «Bi aorta dortsal daude, eskuinekoa eta ezkerrekoa, enbrioiaren atzealdean.»
  _t=0.2975 · argi: aorta-dortsalak_
  - Ez dut ulertu: «Enbrioiaren bizkarraldean bi aorta luze daude, bat alde bakoitzean: aorta dortsalak.»
  - **F** `w12/2/p3/s1` Enbor arteriosoaren urrutiko ataletik (aorta zakua), bi alboko luzapeneko odol-hodi eratzen dira: aorta dortsalak (eskumako bat eta ezkerreko beste bat).

3. «Aorta zakuaren luzapenak eta aorta dortsalak lotzen dituzten hodiei aorta arkuak deritze: sei bikote, bata bestearen ondoren.»
  _t=0.535 · emphasis · argi: aorta-zakua, aorta-dortsalak, aorta-arkuak · arbelean: b-arkuak_
  - Ez dut ulertu: «Aorta arkuak zubiak dira, aorta zakuaren eta aorta dortsalen artean. Sei bikote sortzen dira, ez denak batera.»
  - g `w12/2/p3/s2` Enbrioiaren zeharkako tolespenaren ondorioz, bi aorta dortsalak bihotz-hodiaren enbor arteriosoarekin komunikatzen dira, hain zuzen ere, enborraren urrutiko ataletik (aorta-zakua) ateratzen diren ezkerreko eta eskuineko luzapenekin.
  - **F** `w12/2/p3/s3` Komunikazio hauei aorta-arkuak deritze, eta 6 bikote garatuko dira, kronologikoki.

4. «Gero, bi aorta dortsalak T4 mailatik behera fusionatzen dira, eta aorta dortsal bakarra sortzen da.»
  _t=0.765 · emphasis · argi: aorta-dortsalak · arbelean: b-fusioa_
  - Ez dut ulertu: «Toraxeko laugarren ornoaren mailatik behera, bi aorta dortsalak bat egiten dute: aorta bakarra geratzen da.»
  - **F** `w12/2/p4/s1` Aorta dortsalak (2) hasiera batean banatuta egongo dira, baina garapenean, 4. maila torazikotik (T4) behera fusionatuko dira, aorta-dortsal bakarra eratuz.

5. «Gainetik, alde zefalikoan, bi aorta dortsalak bananduta geratzen dira.»
  _t=0.955 · argi: aorta-dortsalak_
  - Ez dut ulertu: «Goialdean, buruaren aldean, bi aortak bananduta jarraitzen dute.»
  - g `w12/2/p4/s2` Beraz, ezkerreko eta eskuineko aorta dortsalak soilik alde zefalikoan mantenduko dira banatuta.

- Arbela `b-arkuak`: Aorta arkuak: aorta zakuaren luzapenen eta aorta dortsalen arteko loturak; 6 bikote, banan-banan
  - g `w12/2/p3/s2` Enbrioiaren zeharkako tolespenaren ondorioz, bi aorta dortsalak bihotz-hodiaren enbor arteriosoarekin komunikatzen dira, hain zuzen ere, enborraren urrutiko ataletik (aorta-zakua) ateratzen diren ezkerreko eta eskuineko luzapenekin.
  - **F** `w12/2/p3/s3` Komunikazio hauei aorta-arkuak deritze, eta 6 bikote garatuko dira, kronologikoki.
- Arbela `b-fusioa`: Bi aorta dortsalak T4tik behera fusionatzen dira: aorta dortsal bakarra
  - **F** `w12/2/p4/s1` Aorta dortsalak (2) hasiera batean banatuta egongo dira, baina garapenean, 4. maila torazikotik (T4) behera fusionatuko dira, aorta-dortsal bakarra eratuz.
- Galdera (contrast): Aorta arkuak eta aorta dortsalak: zein da zein?
- Galdera (pool): w12-q-fusioa

## 2. 27. eguna

Etapa: `eguna-27` · 6 lerro · ~34 s hitz eginda

1. «27. egunean, faringe arkuekin batera, aorta arkuak sortzen dira, banan-banan.»
  _t=0.1125 · argi: faringe-arkuak, aorta-arkuak_
  - Ez dut ulertu: «27. egunean, lepoko faringe arku bakoitzarekin batera, bere aorta arkua agertzen da.»
  - **F** `w12/2.1/p3/s1` Hurrengo aorta arkuak, arku faringeo edo brankialen agerpenarekin batera sortuko dira:
  - · `w12/2.1/p4/s1` Garapenaren 27.eguna

2. «Lehen aorta arkua ia osorik desagertzen da; geratzen den zatitik arteria maxilarrak garatzen dira.»
  _t=0.2625 · argi: lehen-aorta-arkua, arteria-maxilarra · arbelean: tz-1_
  - Ez dut ulertu: «Lehen arkua ia osorik galtzen da. Gelditzen den zati txikitik arteria maxilarrak sortzen dira.»
  - **F** `w12/2.1/p5/s1` - Lehenengo aorta-arku bikotea agertzen da bihotzaren enbor arteriosoren eta atzekaldeko aorta dortsalaren artean, baina hasieratik poliki poliki hasten da endekatzen eta ia arku osoa desagertu egiten da.
  - g `w12/2.1/p5/s2` Arku honetatik geratzen diren ataletatik arteria maxilarrak garatuko dira.

3. «Bigarren aorta arkuan gauza bera: zati handiena desagertzen da, eta hondarretik hioide arteria eta ointokiko arteria sortzen dira.»
  _t=0.42 · argi: bigarren-aorta-arkua, hioide-arteria, ointokiko-arteria · arbelean: tz-2_
  - Ez dut ulertu: «Bigarren arkuarekin berdin: ia dena galtzen da. Geratzen denetik bi arteria txiki: hioide arteria eta ointokiko arteria.»
  - **F** `w12/2.1/p6/s1` - Bigarren aorta-arkuetan antzeko prozesu bat gertatzen da.
  - **F** `w12/2.1/p6/s2` Agertu eta garapenean egituraren atal garrantzitsuenak desagertzen dira, eta geratzen den atal txikitik bi arteria garatzen dira: hioide azpiko arteria/arteria infrahioideoak eta ointoki muskuluaren arteria.

4. «Hirugarren aorta arkuak, berriz, handi bihurtzen dira, eta laugarrenak agertzen hasten dira.»
  _t=0.58 · argi: hirugarren-aorta-arkua, laugarren-aorta-arkua_
  - Ez dut ulertu: «Hirugarren arkuak hazi eta handiak egiten dira. Laugarren arkuak ere orduan sortzen dira.»
  - **F** `w12/2.1/p7/s1` - Hirugarren aorta-arkuak agertu eta tamaina handia hartzen dute.
  - **F** `w12/2.1/p8/s1` - Laugarren arku-bikotea agertzen hasten da.

5. «Bostgarrena ez da guztiz garatzen, eta laster desagertzen da.»
  _t=0.67 · argi: bostgarren-aorta-arkua_
  - Ez dut ulertu: «Bostgarren arkua ia ez da sortzen: oso gutxi irauten du.»
  - **F** `w12/2.1/p9/s1` - Bostgarrena ez da guztiz garatzen eta denbora gutxitan desagertzen da.

6. «Seigarrena ere garatzen hasten da, eta adartxo batzuk ditu: hasierako birika arteriak.»
  _t=0.945 · emphasis · argi: seigarren-aorta-arkua, hasierako-birika-arteriak_
  - Ez dut ulertu: «Seigarren arkua ere sortzen da. Bertatik adar txiki batzuk ateratzen dira, birikara doazenak: hasierako birika arteriak.»
  - **F** `w12/2.1/p10/s1` - Seigarrena ere garatzen hasten da.
  - **F** `w12/2.1/p10/s2` Hauek adartxo batzuk izango dituzte, hasierako birika arteriak deritze.

- Taula `tz-1`: Lehena → Arteria maxilarrak
  - g `w12/2.1/p5/s2` Arku honetatik geratzen diren ataletatik arteria maxilarrak garatuko dira.
- Taula `tz-2`: Bigarrena → Hioide arteria eta ointokiko arteria
  - **F** `w12/2.1/p6/s2` Agertu eta garapenean egituraren atal garrantzitsuenak desagertzen dira, eta geratzen den atal txikitik bi arteria garatzen dira: hioide azpiko arteria/arteria infrahioideoak eta ointoki muskuluaren arteria.
- Taula `tz-3`: Hirugarrena → Karotida komuna eta barneko karotidaren hurbileko zatia
  - **F** `w12/2.3.1/p8/s1` - Ezkerreko eta eskuineko arkuetatik arteria karotida komunak sortzen dira eta hauetatik barneko karotiden hurbileko zatiak eratuko dira.
- Taula `tz-4l`: Laugarrena, ezkerrean → Aorta makoaren urrutiko atala
  - **F** `w12/2.3.2/p8/s1` -​ Aorta makuaren urrutiko atala eratu (ezkerreko karotida komunaren eta ezkerreko arteria subklabioaren arteako atala)
- Taula `tz-4r`: Laugarrena, eskuinean → Eskuineko subklabioaren hasierako atala
  - **F** `w12/2.3.2/p5/s1` -​ Eskuineko arteria subklabioaren hasierako atala (proximaletik) eratu
- Taula `tz-6l`: Seigarrena, ezkerrean → Ezkerreko birika arteria eta hodi arteriosoa
  - **F** `w12/2.3.4/p5/s1` -​ Ezkerreko birika-arteria: 6. arkuaren hurbileko ataletik eta arku honetan garatutako hasierako birika arteriatik
  - **F** `w12/2.3.4/p6/s1` -​ Hodi arteriosoa: urrutiko ataletik (ezkerreko birika-arteria aorta-arteriarekin komunikatu)
- Taula `tz-6r`: Seigarrena, eskuinean → Eskuineko birika arteria; urrutiko atala desagertzen da
  - **F** `w12/2.3.4/p7/s1` -​ Seigarren arkuaren urrutiko atala desagertzen da
  - **F** `w12/2.3.4/p8/s1` -​ Eskumako birika-arteria: arkuaren hurbileko ataletik (eta horretatik irtendako hasierako eskuineko birika-arteriatik)
- Galdera (contrast): Lehen eta bigarren aorta arkuen hondarrak: zer sortzen du bakoitzak?
- Galdera (pool): mikro:12/eguna-27:5

## 3. 29. eguna

Etapa: `eguna-29` · 7 lerro · ~41 s hitz eginda

1. «29. egunean, lehen eta bigarren aorta arkuak guztiz desagertu dira; haien arteriak bakarrik geratzen dira.»
  _t=0.1125 · argi: arteria-maxilarra, hioide-arteria, ointokiko-arteria_
  - Ez dut ulertu: «29. egunean lehen bi arkuak galdu dira. Geratzen dira arteria maxilarrak, hioide arteria eta ointokiko arteria.»
  - **F** `w12/2.2.1/p3/s1` - Lehenengo eta bigarren arku-aortikoak guztiz desagertu dira,
  - · `w12/2.2.1/p4/s1` Garapenaren 29. eguna
  - g `w12/2.2.1/p5/s1` aurretik aipatutako arteriak geldituz.

2. «Hirugarren eta laugarren aorta arkuak handitzen dira.»
  _t=0.2775 · argi: hirugarren-aorta-arkua, laugarren-aorta-arkua_
  - Ez dut ulertu: «Hirugarren arkuak eta laugarren arkuak hazi egiten dira: lodiago bihurtzen dira.»
  - **F** `w12/2.2.1/p6/s1` - Hirugarren, laugarren aorta-arkuak tamainaz handitzen dira.

3. «Trenkada bat sortzean, enbor bakarretik bi arteria bereizten dira: goranzko aorta eta birika enborra.»
  _t=0.455 · emphasis · argi: goranzko-aorta, birika-arteria_
  - Ez dut ulertu: «Arteria enbor bakarraren barruan horma bat hazten da, eta bi hodi geratzen dira: goranzko aorta eta birika enborra.»
  - **F** `w12/2.2.1/p8/s2` Enbor arteriosotik, trenkada eratu ondoren 2 arteria desberdin bereizten dira: aortaren hasierako zatia/goranzko aorta eta birika-enborra.

4. «Seigarren arkua birika enborrarekin lotzen da.»
  _t=0.455 · argi: seigarren-aorta-arkua, birika-arteria_
  - Ez dut ulertu: «Seigarren arkua birika enborrera iristen da, eta harekin lotzen da.»
  - **F** `w12/2.2.1/p8/s1` - Seigarren arkuak enbor arteriosotik trenkadatze-prozesuaren ondorioz garatutako birika enborrarekin kontaktatzen du.

5. «Aorta zakua goranzko aorta bihurtzen da, eta haren bi luzapenetatik arteria berriak sortzen dira, ez simetrikoki.»
  _t=0.62 · argi: aorta-zakua, goranzko-aorta_
  - Ez dut ulertu: «Aorta zakua goranzko aortaren parte bihurtzen da. Haren bi luzapenek arteria desberdinak emango dituzte.»
  - g `w12/2.2.2/p3/s1` Aorta-zakua goranzko aorta bihurtuko da eta hortik ezkerreko eta eskumako luzapenetatik arteria berriak eratuko dira, era ez simetrikoan:

6. «Ezkerreko luzapena, lodiagoa, aortaren makoaren hasierako zatia bihurtzen da.»
  _t=0.7875 · emphasis · argi: aortaren-makoa_
  - Ez dut ulertu: «Ezkerreko luzapena lodiagoa da: hortik aortaren makoaren lehen zatia sortzen da.»
  - **F** `w12/2.2.2/p5/s1` -​ Aorta makoaren hasiera zatia eratu (Goranzko aortaren jarraipena eta beheranzko aortarekin jarraia dena)
  - **F** `w12/2.2.2/p7/s1` - Ezkerreko luzapenetik (lodigoa) aorta makoaren hasierako zatia eratzen da.

7. «Eskuineko luzapena, estuagoa, arteria brakiozefalikoa bihurtzen da: hortik eskuineko karotida komuna eta eskuineko subklabioa.»
  _t=0.9575 · emphasis · argi: enbor-brakiozefalikoa · arbelean: b-luzapenak_
  - Ez dut ulertu: «Eskuineko luzapena meheagoa da: arteria brakiozefalikoa ematen du, eta hortik eskuineko karotida eta subklabioa ateratzen dira.»
  - **F** `w12/2.2.2/p6/s1` -​ Arteria brakiozefalikoa eratu (Bertatik eskuineko karotida komuna eta eskuineko arteria subklabioa eratuko dira)
  - **F** `w12/2.2.2/p8/s1` - Eskuineko luzapenetik (estuagoa) arteria brakiozefalikoa eratzen da.
  - g `w12/2.2.2/p8/s2` Bertatik eskuineko karotida komuna eta eskuineko arteria subklabioa eratuko dira.

- Arbela `b-luzapenak`: Ezkerreko luzapena (lodiagoa): aorta makoaren hasierako zatia. Eskuinekoa (estuagoa): arteria brakiozefalikoa
  - **F** `w12/2.2.2/p7/s1` - Ezkerreko luzapenetik (lodigoa) aorta makoaren hasierako zatia eratzen da.
  - **F** `w12/2.2.2/p8/s1` - Eskuineko luzapenetik (estuagoa) arteria brakiozefalikoa eratzen da.
- Galdera (contrast): Aorta zakuaren bi luzapenak: zer ematen du bakoitzak?

## 4. Hirugarren arkua

Etapa: `hirugarren-arkua` · 5 lerro · ~27 s hitz eginda

1. «Lehenengo arkuak eta bigarrenak 28. egunaren inguruan agertzen dira, eta laster desagertzen dira.»
  _t=0.1125 · argi: lehen-aorta-arkua_
  - Ez dut ulertu: «Lehen bi arkuak goiz agertzen dira, 28. egunaren inguruan, eta gutxira galtzen dira.»
  - **F** `w12/2.3.1/p3/s1` Lehenengo eta bigarren arkuak gutxi gora behera enbriioiaren 28. egunean agertzen dira, baina gutxira desagertu egiten dira.

2. «Hirugarren arkuak bi aldeetan batera eta berdin garatzen dira.»
  _t=0.42 · emphasis · argi: hirugarren-aorta-arkua_
  - Ez dut ulertu: «Hirugarren arkuetan bi aldeak berdinak dira: eskuinekoa eta ezkerrekoa berdin aldatzen dira.»
  - **F** `w12/2.3.1/p7/s1` Hirugarren arkuak momentu eta une berean garatuko dira.
  - **F** `w12/2.3.1/p7/s2` Eskumako eta ezkerreko aldeetan garapen berdina egiten dute:

3. «Hirugarren arkuetatik karotida komunak sortzen dira, eta haietatik barneko karotiden hurbileko zatia.»
  _t=0.595 · emphasis · argi: hirugarren-aorta-arkua, karotida-komuna, barneko-karotida · arbelean: tz-3_
  - Ez dut ulertu: «Hirugarren arkutik karotida komuna ateratzen da, eta barneko karotidaren hasiera ere bai.»
  - **F** `w12/2.3.1/p8/s1` - Ezkerreko eta eskuineko arkuetatik arteria karotida komunak sortzen dira eta hauetatik barneko karotiden hurbileko zatiak eratuko dira.

4. «Barneko karotidaren urrutiko zatia, berriz, aorta dortsalaren alde kranealetik dator.»
  _t=0.775 · argi: barneko-karotida, aorta-dortsalak_
  - Ez dut ulertu: «Barneko karotidaren azken zatia aorta dortsalaren goiko zatitik dator.»
  - **F** `w12/2.3.1/p9/s1` - Atzean dauden aorta dortsalen urrutiko ataletatik eskuineko eta ezkerreko alde kranealetik, barneko karotiden urrutiko atala garatuko da.

5. «Kanpoko karotida karotida komunaren kimu gisa sortzen da.»
  _t=0.955 · argi: kanpoko-karotida, karotida-komuna_
  - Ez dut ulertu: «Kanpoko karotida karotida komunetik ateratzen den adar berri bat da, kimu bat bezala.»
  - **F** `w12/2.3.1/p10/s1` - Kanpoko arteria karotidak karotida komunaren ebaginazio edo kimu bezala garatuko dira.

- Galdera (contrast): Barneko karotida: nondik dator haren hurbileko zatia, eta nondik urrutikoa?
- Galdera (pool): w12-q-karotidak

## 5. Laugarren arkua

Etapa: `laugarren-arkua` · 7 lerro · ~43 s hitz eginda

1. «Laugarren arkuetan, aldiz, ezkerrekoak eta eskuinekoak garapen desberdina dute.»
  _t=0.105 · emphasis · argi: laugarren-aorta-arkua_
  - Ez dut ulertu: «Laugarren arkuetan bi aldeak ez dira berdin aldatzen: bakoitzak gauza desberdina ematen du.»
  - **F** `w12/2.3.2/p3/s1` Ezkerreko eta eskumako aorta-arkuek garapen desberdina dute:

2. «Ezkerrean, laugarren arkua aorta makoaren urrutiko atala bihurtzen da: karotida komunaren eta subklabioaren artekoa.»
  _t=0.26 · argi: laugarren-aorta-arkua, makoaren-urrutiko-atala, karotida-komuna · arbelean: tz-4l_
  - Ez dut ulertu: «Ezkerreko laugarren arkua aortaren makoaren zati bat bihurtzen da: karotida komunaren eta subklabioaren arteko tartea.»
  - **F** `w12/2.3.2/p8/s1` -​ Aorta makuaren urrutiko atala eratu (ezkerreko karotida komunaren eta ezkerreko arteria subklabioaren arteako atala)
  - **F** `w12/2.3.2/p10/s1` -​ EZKERREKO ALDETIK: Aorta makuaren urrutiko atala eratzen da: ezkerreko karotida komunaren eta ezkerreko arteria subklabioaren arteko atala.

3. «Ezkerreko subklabioa ezkerreko zazpigarren segmentu arteko arteriatik sortzen da.»
  _t=0.435 · argi: ezkerreko-subklabioa_
  - Ez dut ulertu: «Ezkerreko subklabioa ez dator arku batetik: zazpigarren segmentu arteko arteriatik dator.»
  - **F** `w12/2.3.2/p9/s1` -​ Ezkerreko arteria subklabioa: ezkerreko zazpigarren segmentuarteko arteria batetik eratu baina garapenean askoz gorago kokatu (ezk. karotidatik gertu)

4. «Garapenean askoz gorago kokatzen da, ezkerreko karotidatik gertu.»
  _t=0.435 · argi: ezkerreko-subklabioa · arbelean: b-ezk-subklabioa_
  - Ez dut ulertu: «Gero mugitu egiten da, eta askoz gorago geratzen da, karotidaren ondoan.»
  - **F** `w12/2.3.2/p9/s1` -​ Ezkerreko arteria subklabioa: ezkerreko zazpigarren segmentuarteko arteria batetik eratu baina garapenean askoz gorago kokatu (ezk. karotidatik gertu)

5. «Eskuinean, laugarren arkuak eskuineko subklabioaren hasierako zatia ematen du.»
  _t=0.6 · emphasis · argi: laugarren-aorta-arkua, eskuineko-subklabioa · arbelean: tz-4r_
  - Ez dut ulertu: «Eskuineko laugarren arkuak, aldiz, eskuineko subklabioaren lehen zatia baino ez du ematen.»
  - **F** `w12/2.3.2/p5/s1` -​ Eskuineko arteria subklabioaren hasierako atala (proximaletik) eratu
  - **F** `w12/2.3.2/p11/s1` -​ ESKUINEKO ALDETIK: Eskuineko arteria subklabioaren hasierako atala eratuko da(eskuineko lepauztaipeko arteria).

6. «Haren bitarteko zatia eskuineko aorta dortsaletik dator, eta urrutikoa eskuineko zazpigarren segmentu arteko arteriatik.»
  _t=0.775 · emphasis · argi: eskuineko-subklabioa, aorta-dortsalak, zazpigarren-segmentu-arteko-arteria · arbelean: b-esk-subklabioa_
  - Ez dut ulertu: «Bitarteko zatia eskuineko aorta dortsala da, eta azkena zazpigarren segmentu arteko arteria.»
  - **F** `w12/2.3.2/p6/s1` -​ Bitarteko atala eskuineko aorta dortsaletik sortua
  - **F** `w12/2.3.2/p7/s1` -​ Urrutiko atala eskuineko aorta dortsaletik irteten den eskuineko zazpigarren lepoko segmentuarteko arteriatik sortu
  - **F** `w12/2.3.2/p11/s2` Bitarteko atala eskuineko aorta dortsaletik sortua da eta urrutiko atala eskuineko aorta dortsaletik irteten den eskuineko zazpigarren lepoko segmentuarteko arteriatik.

7. «Bostgarren arkuak, gogoratu, agertu eta ia berehala desagertzen dira: ez dute ezer sortzen.»
  _t=0.86 · recall · argi: bostgarren-aorta-arkua_
  - Ez dut ulertu: «Bostgarren arkua ia ez da sortzen, eta ez du arteriarik uzten.»
  - **F** `w12/2.2.1/p7/s1` - Bostgarren aorta-arkuak agertzen baina ia guztiz desagertzen dira.
  - g `w12/2.3.3/p4/s1` Bostgarren arku hauek guztiz desagertzen dira eta ez dute ezer sortzen.

- Arbela `b-ezk-subklabioa`: Ezkerreko subklabioa: ezkerreko zazpigarren segmentu arteko arteriatik; gero gorago, karotidatik gertu
  - **F** `w12/2.3.2/p9/s1` -​ Ezkerreko arteria subklabioa: ezkerreko zazpigarren segmentuarteko arteria batetik eratu baina garapenean askoz gorago kokatu (ezk. karotidatik gertu)
- Arbela `b-esk-subklabioa`: Eskuineko subklabioa: hasiera laugarren arkutik; bitartekoa eskuineko aorta dortsaletik; urrutikoa eskuineko zazpigarren segmentu arteko arteriatik
  - **F** `w12/2.3.2/p5/s1` -​ Eskuineko arteria subklabioaren hasierako atala (proximaletik) eratu
  - **F** `w12/2.3.2/p6/s1` -​ Bitarteko atala eskuineko aorta dortsaletik sortua
  - **F** `w12/2.3.2/p7/s1` -​ Urrutiko atala eskuineko aorta dortsaletik irteten den eskuineko zazpigarren lepoko segmentuarteko arteriatik sortu
- Galdera (pool): w12-q-ezk-subklabioa
- Galdera (contrast): Laugarren arkua: zer ematen du alde bakoitzean?

## 6. Seigarren arkua

Etapa: `seigarren-arkua` · 4 lerro · ~26 s hitz eginda

1. «Seigarren arkuetan ere ezkerrekoak eta eskuinekoak garapen desberdina dute.»
  _t=0.165 · argi: seigarren-aorta-arkua_
  - Ez dut ulertu: «Seigarren arkuan ere ezkerreko eta eskuineko arkuak ez dira berdin aldatzen.»
  - **F** `w12/2.3.4/p3/s1` Eskuineko eta ezkerreko arkuek garapen desberdina dute.

2. «Ezkerrean, arkuaren hurbileko zatitik eta hasierako birika arteriatik ezkerreko birika arteria sortzen da.»
  _t=0.4 · argi: ezkerreko-birika-arteria, hasierako-birika-arteriak_
  - Ez dut ulertu: «Ezkerreko arkuaren lehen zatia, bere adartxoarekin batera, ezkerreko birika arteria bihurtzen da.»
  - **F** `w12/2.3.4/p5/s1` -​ Ezkerreko birika-arteria: 6. arkuaren hurbileko ataletik eta arku honetan garatutako hasierako birika arteriatik
  - **F** `w12/2.3.4/p9/s1` -​ EZKERREKO ALDEAN: seigarren arkuaren hurbileko ataletik eta arku honetan garatutako hasierako ezkerreko birika-arteriatik ezkerreko birika-arteria garatzen da.

3. «Urrutiko zatitik hodi arteriosoa sortzen da: ezkerreko birika arteria aortarekin lotzen du.»
  _t=0.64 · emphasis · argi: hodi-arteriosoa, ezkerreko-birika-arteria · arbelean: tz-6l_
  - Ez dut ulertu: «Arkuaren azken zatia hodi arteriosoa bihurtzen da: ezkerreko birika arteria eta aorta lotzen ditu.»
  - **F** `w12/2.3.4/p6/s1` -​ Hodi arteriosoa: urrutiko ataletik (ezkerreko birika-arteria aorta-arteriarekin komunikatu)
  - g `w12/2.3.4/p9/s2` Bestalde, urrutiko ataletik hodi arteriosoa garatzen da, ezkerreko birika-arteria aorta-arteriarekin komunikatzen duena.

4. «Eskuinean, arkuaren urrutiko zatia desagertzen da, eta hurbilekotik eskuineko birika arteria sortzen da.»
  _t=0.925 · emphasis · argi: eskuineko-birika-arteria · arbelean: tz-6r_
  - Ez dut ulertu: «Eskuineko arkuaren azken zatia galdu egiten da; lehen zatia eskuineko birika arteria bihurtzen da.»
  - **F** `w12/2.3.4/p7/s1` -​ Seigarren arkuaren urrutiko atala desagertzen da
  - **F** `w12/2.3.4/p8/s1` -​ Eskumako birika-arteria: arkuaren hurbileko ataletik (eta horretatik irtendako hasierako eskuineko birika-arteriatik)
  - **F** `w12/2.3.4/p10/s1` -​ ESKUINEKO ALDEAN: seigarren arkuaren urrutiko atala desagertzen da eta hurbileko ataletik (eta arku horretatik irtendako hasierako eskuineko birika-arteriatik) eskumako birika-arteria garatzen da.

- Galdera (predict): Zer uste duzu: ezkerreko seigarren arkuak zer emango du?
- Galdera (contrast): Seigarren arkuaren urrutiko zatia: zer gertatzen zaio alde bakoitzean?

## 7. Beste aldaketak

Etapa: `beste-aldaketak` · 6 lerro · ~45 s hitz eginda

1. «Arkuez gain, arteria sisteman beste aldaketa batzuk ere gertatzen dira. Lau ikusiko ditugu.»
  _t=0.09_
  - Ez dut ulertu: «Arkuez gain, beste lau aldaketa garrantzitsu daude. Banan-banan ikusiko ditugu.»
  - **F** `w12/2.4/p3/s1` Garapenean zehar gertatutako aldaketez gain, arteria arku sisteman beste aldaketa mota batzuk ere agertzen dira.

2. «Lehena: hirugarren eta laugarren arkuen arteko tarteak desagertzen dira: hodi karotideoak.»
  _t=0.18 · argi: hodi-karotideoa_
  - Ez dut ulertu: «Hirugarren eta laugarren arkuen artean dagoen hodi zatia galdu egiten da. Zati horiei hodi karotideoak deitzen zaie.»
  - **F** `w12/2.4/p4/s1` 1. III. eta IV. arku aortikoen arteko aorta dortsalen atal txiki batzuk desagertzen dira: Hodi karotideoak.

3. «Bigarrena: eskuineko aorta dortsalaren zati bat ere desagertzen da, zazpigarren segmentu arteko arteriaren azpian.»
  _t=0.4 · argi: aorta-dortsalak_
  - Ez dut ulertu: «Eskuineko aorta dortsala moztu egiten da, zazpigarren segmentu arteko arteriaren azpian.»
  - **F** `w12/2.4/p4/s2` 2. Eskuineko aortaren ataltxo bat ere desagertzen da: Eskuineko VII. lepoko segmentuarteko arteriaren eta aorta dortsal komunen arteko atala.
  - **F** `w12/2.4/p4/s3` (Bi hauek lotzen zituen atala desagertu; ondorioz, ezkerreko aorta bakarrik geldituko da.)

4. «Ondorioz, ezkerreko aorta dortsala bakarrik geratzen da: beheranzko aorta ezkerreko aorta dortsaletik sortzen da.»
  _t=0.4 · emphasis · argi: aorta-dortsalak, beheranzko-aorta · arbelean: b-beheranzkoa_
  - Ez dut ulertu: «Ezkerreko aorta dortsalak bakarrik jarraitzen du, eta hura da beheranzko aorta.»
  - **F** `w12/2.4/p4/s3` (Bi hauek lotzen zituen atala desagertu; ondorioz, ezkerreko aorta bakarrik geldituko da.)
  - **F** `w12/2.4/p4/s4` Beraz, beheranzko aorta, ezkerreko aorta dortsaletik eratuko da.

5. «Hirugarrena: bihotz hodia lepotik toraxera jaisten da; horregatik, karotida komunak eta arteria brakiozefalikoa asko luzatzen dira.»
  _t=0.62 · why · argi: karotida-komuna, enbor-brakiozefalikoa_
  - Ez dut ulertu: «Bihotz hodia lepotik bularrera jaisten da. Horregatik, karotida komunak eta arteria brakiozefalikoa luzatu egin behar dira.»
  - **F** `w12/2.4/p4/s5` 3. Enbrioiak egiten duen tolespenengatik, hasieran goikaldean kokatzen den bihotz-hodia, lepo-eskualdera jaitsi ez ezik, ondoren, torax barrunbean ere kokatuko da.
  - **F** `w12/2.4/p4/s6` Hori dela eta, arteria karotida komunak eta arteria brakiozefalikoak asko luzatzen dira.

6. «Laugarrena: lepoa eratzean, ezkerreko subklabioak bere jatorria galtzen du, gorago kokatzen da, eta aortatik zuzenean irteten da.»
  _t=0.815 · argi: ezkerreko-subklabioa_
  - Ez dut ulertu: «Lepoa luzatzean, ezkerreko subklabioa gora mugitzen da, eta azkenean aortatik bertatik ateratzen da.»
  - **F** `w12/2.4/p4/s7` 4. Lepoaren eraketarekin arteria brakiozefalikoa eta karotidak luzatu egiten dira, ondorioz, ezkerreko lepauztaipeko arteria duen jatorria galdu eta askoz gorago kokatuko da, aortaren makutik irtengo da.

- Arbela `b-beheranzkoa`: Beheranzko aorta: ezkerreko aorta dortsaletik
  - **F** `w12/2.4/p4/s4` Beraz, beheranzko aorta, ezkerreko aorta dortsaletik eratuko da.
- Galdera (pool): mikro:12/beste-aldaketak:3
- Galdera (contrast): Bi zati desagertzen dira: zein dira?

## 8. Nerbio atzerakariak

Etapa: `nerbio-atzerakariak` · 9 lerro · ~57 s hitz eginda

1. «Gogoratu: laugarren eta seigarren arkuei lotutako garezur nerbioa nerbio bagoa da, hamargarren bikotea.»
  _t=0.0975 · recall · argi: nerbio-bagoa, laugarren-aorta-arkua, seigarren-aorta-arkua_
  - Ez dut ulertu: «Arku horien nerbioa nerbio bagoa da, hamargarren garezur nerbioa.»
  - **F** `w12/2.4/p5/s1` Gogoratu, arku brankialak aipatu genituenean, IV. eta VI. arku brankealekin erlazionatutako bikote kraneala, 10. bikote kraneala dela: Nerbio bagoa.

2. «Bagoaren adarrek laringeko muskuluak inerbatzen dituzte: goiko nerbio laringeoa eta nerbio laringeo atzerakaria.»
  _t=0.235 · emphasis · argi: goiko-nerbio-laringeoa, nerbio-laringeo-atzerakaria, laringea_
  - Ez dut ulertu: «Bagotik bi adar ateratzen dira laringerantz: goiko nerbio laringeoa eta nerbio laringeo atzerakaria.»
  - **F** `w12/2.4/p5/s5` Muskulu laringeo horiek inerbatzeko nerbio bagotik sortutako adarrak daude, hots, goiko nerbio laringeoa eta nerbio laringeo atzerakaria (horrela deitu irten eta goruntz abiatzen delako, laringeruntz).

3. «Atzerakaria deitzen zaio, irten ondoren goruntz itzultzen delako, laringerantz.»
  _t=0.235 · argi: nerbio-laringeo-atzerakaria, laringea_
  - Ez dut ulertu: «Izena hortik dator: nerbioa jaitsi egiten da, eta gero goruntz itzultzen da laringera.»
  - **F** `w12/2.4/p5/s5` Muskulu laringeo horiek inerbatzeko nerbio bagotik sortutako adarrak daude, hots, goiko nerbio laringeoa eta nerbio laringeo atzerakaria (horrela deitu irten eta goruntz abiatzen delako, laringeruntz).

4. «Arterien aldaketengatik, bi atzerakariek kokapen desberdina dute.»
  _t=0.3675 · argi: eskuineko-nerbio-atzerakaria, ezkerreko-nerbio-atzerakaria_
  - Ez dut ulertu: «Arteriak aldatu direnez, eskuineko eta ezkerreko nerbioak ez daude leku berean.»
  - g `w12/2.4/p6/s1` Arterietan gertatu diren aldaketen ondorioz, eskumako eta ezkerreko nerbio bago hauetatik irteten diren nerbio atzerakari horiek kokapen ezberdinak izango dituzte.

5. «Ezkerrean, atzerakariak seigarren arkuaren urrutiko zatia inguratzen du: hodi arteriosoa.»
  _t=0.5125 · emphasis · argi: ezkerreko-nerbio-atzerakaria, seigarren-aorta-arkua, hodi-arteriosoa_
  - Ez dut ulertu: «Ezkerreko nerbioak hodi arteriosoaren azpitik egiten du buelta.»
  - **F** `w12/2.4/p7/s1` -​ EZKERREKO aldean ezkerreko nerbio laringeotik irtetzen den ezkerreko nerbio atzerakariak inguratzen du ezkerreko seigarren arkuaren urrutiko atala, bertan hodi arteriosoa kokatzen da.

6. «Eskuinean, seigarren arkuaren urrutiko zatia desagertzen da, eta bostgarrena ez da inoiz garatzen.»
  _t=0.6775 · recall · argi: seigarren-aorta-arkua_
  - Ez dut ulertu: «Eskuinean seigarren arkuaren azken zatia galtzen da, eta bostgarrena ez da sortzen.»
  - **F** `w12/2.4/p9/s2` (Seigarren arkuak jasandako aldaketengatik eta bostgarrena ez delako inoiz garatzen)
  - **F** `w12/2.3.4/p10/s1` -​ ESKUINEKO ALDEAN: seigarren arkuaren urrutiko atala desagertzen da eta hurbileko ataletik (eta arku horretatik irtendako hasierako eskuineko birika-arteriatik) eskumako birika-arteria garatzen da.

7. «Horregatik, eskuineko atzerakaria gorago igotzen da, laugarren arkutik sortutako eskuineko subklabioa inguratu arte.»
  _t=0.6775 · emphasis · argi: eskuineko-nerbio-atzerakaria, laugarren-aorta-arkua, eskuineko-subklabioa_
  - Ez dut ulertu: «Eskuineko nerbioa gora mugitzen da, eta eskuineko subklabioaren azpitik egiten du buelta.»
  - **F** `w12/2.4/p9/s1` -​ ESKUINEKO nerbio bagotik irtendako eskuineko nerbio laringeo atzerakariak gero eta gorago kokatuko da eta azkenan 4. arkutik sortutako arteria subklabioa inguratuko du.
  - **F** `w12/2.4/p11/s1` - ESKUINEAN: Eskuineko nerbio laringeo atzerakariak gero eta altuago kokatuko dira, IV. arkuetatik sortutako eskuineko arteria subklabioaren hasierako atala inguratu arte.

8. «Hodi arteriosoak, gogoratu, ezkerreko birika arteria eta aorta lotzen ditu.»
  _t=0.825 · argi: hodi-arteriosoa_
  - Ez dut ulertu: «Hodi arteriosoa zubi bat da, ezkerreko birika arteriaren eta aortaren artean.»
  - **F** `w12/2.4/p12/s1` - EZKERREAN: VI. arkuaren urrutiko atala hodi bihurtzen da, hodi arteriosoa, ezkerreko birika arteria aortarekin komunikatzeko.

9. «Jaio ondoren, hodi arteriosoa lotailu bihurtzen da: lotailu arteriosoa. Ezkerreko atzerakariak hura inguratzen du.»
  _t=0.965 · emphasis · argi: hodi-arteriosoa, lotailu-arteriosoa, ezkerreko-nerbio-atzerakaria · arbelean: b-nerbioak_
  - Ez dut ulertu: «Jaio ondoren hodia itxi eta lokarri bat geratzen da, lotailu arteriosoa. Ezkerreko nerbioak hari ematen dio buelta.»
  - **F** `w12/2.4/p12/s3` Hala ere, jaio ostean gertatutako aldaketengatik, hodi arterioso hau lotailu bat bihurtzen da: LOTAILU ARTERIOSOA.
  - **F** `w12/2.4/p13/s1` Ondorioz, ezkerreko nerbio laringeo atzerakariak, hodi arterioso horretatik sortutako lotailu arteriosoa inguratuko du.

- Arbela `b-nerbioak`: Ezkerreko atzerakaria: hodi arteriosoaren azpitik (gero lotailu arteriosoa). Eskuinekoa: eskuineko subklabioaren azpitik
  - **F** `w12/2.4/p7/s1` -​ EZKERREKO aldean ezkerreko nerbio laringeotik irtetzen den ezkerreko nerbio atzerakariak inguratzen du ezkerreko seigarren arkuaren urrutiko atala, bertan hodi arteriosoa kokatzen da.
  - **F** `w12/2.4/p11/s1` - ESKUINEAN: Eskuineko nerbio laringeo atzerakariak gero eta altuago kokatuko dira, IV. arkuetatik sortutako eskuineko arteria subklabioaren hasierako atala inguratu arte.
  - **F** `w12/2.4/p13/s1` Ondorioz, ezkerreko nerbio laringeo atzerakariak, hodi arterioso horretatik sortutako lotailu arteriosoa inguratuko du.
- Galdera (pool): mikro:12/nerbio-atzerakariak:4
- Galdera (contrast): Nerbio laringeo atzerakariak: zer inguratzen du bakoitzak helduan?

## 9. Aorta heldua

Etapa: `aorta-heldua` · 7 lerro · ~49 s hitz eginda

1. «Ikus dezagun emaitza: ezkerreko bentrikulutik irteten den aorta, eta haren adarrak, desberdinak eskuinean eta ezkerrean.»
  _t=0.075 · argi: aorta_
  - Ez dut ulertu: «Hau da azken emaitza: aorta, eta bertatik ateratzen diren arteriak. Eskuinean eta ezkerrean ez dira berdinak.»
  - **F** `w12/2.3.4/p11/s1` Ezkerreko bentrikulutik irteten den aortatik adar desberdinak sortu egiten dira, desberdinak direnak eskumako eta ezkerreko aldeetan.

2. «Goranzko aorta, hurbileko zatia, enbor arteriosotik dator.»
  _t=0.19 · argi: goranzko-aorta_
  - Ez dut ulertu: «Aortaren lehen zatia, gorantz doana, enbor arteriosotik sortzen da: goranzko aorta.»
  - **F** `w12/2.4/p16/s1` - Goranzko aorta (hurbileko atala, enbor arteriosotik sortzen da).

3. «Aortaren makoaren hasierako zatia aorta zakuaren ezkerreko luzapenetik dator.»
  _t=0.31 · argi: aortaren-makoa_
  - Ez dut ulertu: «Makoa aortaren kurba da. Haren hasiera aorta zakuaren ezkerreko luzapenetik dator.»
  - **F** `w12/2.4/p17/s1` - Aortaren makoa (hasierako zatia, enbor arteriosoak duen ezkerreko adarretik sortzen da)

4. «Gero beheranzko aorta dator: toraxetik jaisten da, diafragma zeharkatu, eta abdomenera sartzen da.»
  _t=0.445 · argi: beheranzko-aorta · arbelean: b-aorta_
  - Ez dut ulertu: «Makoaren ondoren aorta behera doa: bularra, diafragma eta sabela zeharkatzen ditu.»
  - **F** `w12/2.4/p18/s1` - Beheranzko aorta.
  - g `w12/2.4/p18/s2` (urrutiko atala, ezkerreko 4. arkutik).
  - g `w12/2.4/p18/s3` Toraxetik jaitsi, diafragma zeharkatu eta abdomenerantz abiatuko da.

5. «Makotik ateratzen den lehen adarra arteria brakiozefalikoa da: hortik eskuineko subklabioa eta eskuineko karotida komuna.»
  _t=0.585 · argi: enbor-brakiozefalikoa, eskuineko-subklabioa, karotida-komuna_
  - Ez dut ulertu: «Makoaren lehen adarra arteria brakiozefalikoa da, eta bitan banatzen da: eskuineko subklabioa eta eskuineko karotida komuna.»
  - **F** `w12/2.3.4/p11/s4` Makotik ateratzen den lehenengo adarra arteria brakiozefalikoa da, hortik eskuineko subklabioa eta eskuineko karotida komuna.

6. «Kontuz: arteria brakiozefaliko bakarra dago, eskuinean. Ez esan eskuineko edo ezkerreko arteria brakiozefalikoa.»
  _t=0.585 · caution · argi: enbor-brakiozefalikoa · arbelean: b-bakarra_
  - Ez dut ulertu: «Arteria brakiozefalikoa bat bakarrik da, eta eskuinean dago. Ezkerrean ez dago halakorik.»
  - **F** `w12/2.3.4/p11/s7` Eskumako aldean sortzen den adar nagusia arteria edo enbor brankioenzefalikoa da (BAKARRA DAGO; EZ JARRI ESKUMAKOA/EZKERREKOA), eta arteria honetatik eskumako karotida komuna (eskumako, kanpoko eta barneko kariotidak) eta eskumako lepauztaipeko arteria.

7. «Ezkerrean, berriz, ezkerreko karotida komuna eta ezkerreko subklabioa makotik zuzenean ateratzen dira, enbor komunik gabe.»
  _t=0.725 · emphasis · argi: karotida-komuna, ezkerreko-subklabioa · arbelean: b-makoa_
  - Ez dut ulertu: «Ezkerreko karotida eta ezkerreko subklabioa bakoitza bere aldetik ateratzen da makotik.»
  - **F** `w12/2.4/p19/s1` Hala ere, ezkerreko aldean ez da gauza bera gertatzen, izan ere, ezkerreko karotida komuna eta ezkerreko arteria subklabioa osoa (hasieran beherago dagoena eta gero makora mugituko da) ez dira enbor komun batetik irteten.
  - g `w12/2.4/p19/s2` Kasu honetan, makotik zuzenean (independenteki) agertuko dira.

- Arbela `b-aorta`: Aorta: goranzkoa enbor arteriosotik; makoaren hasiera ezkerreko luzapenetik; urrutiko atala ezkerreko 4. arkutik
  - **F** `w12/2.4/p16/s1` - Goranzko aorta (hurbileko atala, enbor arteriosotik sortzen da).
  - **F** `w12/2.4/p17/s1` - Aortaren makoa (hasierako zatia, enbor arteriosoak duen ezkerreko adarretik sortzen da)
  - g `w12/2.4/p18/s2` (urrutiko atala, ezkerreko 4. arkutik).
- Arbela `b-bakarra`: Arteria brakiozefalikoa: bakarra, eskuinean (eskuineko karotida komuna eta eskuineko subklabioa)
  - **F** `w12/2.3.4/p11/s7` Eskumako aldean sortzen den adar nagusia arteria edo enbor brankioenzefalikoa da (BAKARRA DAGO; EZ JARRI ESKUMAKOA/EZKERREKOA), eta arteria honetatik eskumako karotida komuna (eskumako, kanpoko eta barneko kariotidak) eta eskumako lepauztaipeko arteria.
- Arbela `b-makoa`: Ezkerrean: karotida komuna eta subklabioa makotik zuzenean, enbor komunik gabe
  - **F** `w12/2.4/p19/s1` Hala ere, ezkerreko aldean ez da gauza bera gertatzen, izan ere, ezkerreko karotida komuna eta ezkerreko arteria subklabioa osoa (hasieran beherago dagoena eta gero makora mugituko da) ez dira enbor komun batetik irteten.
  - g `w12/2.4/p19/s2` Kasu honetan, makotik zuzenean (independenteki) agertuko dira.
- Galdera (pool): mikro:12/aorta-heldua:5
- Galdera (contrast): Aortaren makoaren adarrak: zein da zuzena?

## 10. Aurreko errai adarrak

Etapa: `adar-bentralak` · 7 lerro · ~50 s hitz eginda

1. «Orain, abdomenera goaz. Bi aorta dortsalak fusionatuta daude: aorta bakarra.»
  _t=0.12 · argi: aorta-dortsalak_
  - Ez dut ulertu: «Toraxetik sabelera jaitsiko gara. Han aorta bakarra dago, bi aorta dortsalen fusioz.»
  - **F** `w12/2.5/p3/s1` Burualdeko bi aorta dortsalak fusionatu egin dira.

2. «Hasieran aurreko adarrak bitelo arteriak dira. Bitelo zakua endekatzean, haiek ere bai, eta beste arteria batzuk sortzen dira.»
  _t=0.455 · argi: bitelo-arteriak, bitelo-zaku-sekundarioa_
  - Ez dut ulertu: «Lehenengo, bitelo zakura doazen arteriak daude. Zakua txikitzean, arteria horiek ere aldatu egiten dira.»
  - g `w12/2.5.1/p3/s1` Hasieran, adar bitelinoak dira, bitelo plexuetatik bitelo arteriak sortzen dira eta.
  - **F** `w12/2.5.1/p3/s2` Garapenean, bitelo zakua endekatzen hasten denean bitelo arteriek berdina egiten dute, eta beste mota bateko arteriak sortzen dituzte:

3. «Beheranzko aortatik hiru adar talde ateratzen dira: aurreko errai adarrak, alboko errai adarrak eta atze alboko adarrak.»
  _t=0.62 · emphasis · argi: beheranzko-aorta, aurreko-errai-adarrak, alboko-errai-adarrak, segmentu-arteko-arteriak · arbelean: b-taldeak_
  - Ez dut ulertu: «Hiru adar mota: hestera doazenak, abdomeneko organoetara doazenak, eta bizkarraldera doazenak, maila guztietan.»
  - **F** `w12/2.5/p3/s3` Atzealdeko aortak, aorta dortsalak, fusionatuta daude torax mailatik behera aorta bakarra eratuz, beheranzko aorta.
  - **F** `w12/2.5/p5/s1` ●​ Aurrerantz: heste eta haren eratorriko adarrak: adar bentralak = aurreko errai adarrak
  - **F** `w12/2.5/p6/s1` ●​ Abdomenean: Alboko errai adarrak sortzen dira.
  - **F** `w12/2.5/p7/s1` ●​ Atze alboko paretetatik: atze alboko adarrak (lehen aipatutako segmentu arteko adarrak edo arteriak) bilateralak izango direnak.

4. «Torax mailan, toraxeko aortaren aurreko paretatik bost arteria bikote ateratzen dira hestegorrira.»
  _t=0.78 · argi: hestegorriko-arteriak, hestegorria_
  - Ez dut ulertu: «Bularrean, bost arteria pare ateratzen dira aortatik hestegorrira.»
  - **F** `w12/2.5.1/p4/s1` ➔ TORAX mailan: 5 arteria bikote sortzen dira (toraxeko aortaren aurreko paretatik) heste gorria irrigatzeko.

5. «Abdomenean hiru arteria daude, hesteko hiru zatientzat: enbor zeliakoa, goiko arteria mesenterikoa eta beheko arteria mesenterikoa.»
  _t=0.955 · argi: enbor-zeliakoa, goiko-arteria-mesenterikoa, beheko-arteria-mesenterikoa_
  - Ez dut ulertu: «Sabelean hiru arteria daude, bakoitza hestearen zati batentzat.»
  - **F** `w12/2.5.1/p5/s1` ➔ ABDOMEN mailan: 3 arteria desberdin agertzen dira, aurreko hestetik, bitarteko hestetik eta atzeko hestetik sortzen den eratorri guztiak irrigatzeko.

6. «Enbor zeliakoa aurreko hestearen arteria da, eta barea eta gibela irrigatzen ditu.»
  _t=0.955 · argi: enbor-zeliakoa, aurreko-hestea_
  - Ez dut ulertu: «Enbor zeliakoak hestearen lehen zatia elikatzen du, aurreko hestea: barea eta gibela.»
  - **F** `w12/2.5.1/p6/s1` - Enbor zeliakoa: aurreko hestearen arteria (barea, area eta gibela irrigatzen ditu).

7. «Goiko mesenterikoa bitarteko hestearena da; beheko mesenterikoa, atzeko hestearena.»
  _t=0.955 · emphasis · argi: goiko-arteria-mesenterikoa, erdiko-hestea, beheko-arteria-mesenterikoa, atzeko-hestea · arbelean: b-hesteak_
  - Ez dut ulertu: «Goiko arteria mesenterikoa erdiko hesterako da, eta beheko arteria mesenterikoa azken zatirako, atzeko hesterako.»
  - **F** `w12/2.5.1/p7/s1` - Goiko arteria mesenterikoa: bitarteko hesteko eratorriak irrigatu (duodeno distala eta hesteen bi heren)
  - **F** `w12/2.5.1/p8/s1` - Beheko arteria mesenterikoa: atzeko hestetik sortzen diren eratorriak irrigatu (azken herena).

- Arbela `b-taldeak`: Beheranzko aortaren adarrak: aurreko errai adarrak (hestera), alboko errai adarrak (abdomenean), atze alboko adarrak (maila guztietan)
  - **F** `w12/2.5/p5/s1` ●​ Aurrerantz: heste eta haren eratorriko adarrak: adar bentralak = aurreko errai adarrak
  - **F** `w12/2.5/p6/s1` ●​ Abdomenean: Alboko errai adarrak sortzen dira.
  - **F** `w12/2.5/p7/s1` ●​ Atze alboko paretetatik: atze alboko adarrak (lehen aipatutako segmentu arteko adarrak edo arteriak) bilateralak izango direnak.
  - g `w12/2.5/p7/s2` Maila guztietan agertzen dira.
- Arbela `b-hesteak`: Enbor zeliakoa: aurreko hestea. Goiko mesenterikoa: bitarteko hestea. Beheko mesenterikoa: atzeko hestea
  - **F** `w12/2.5.1/p6/s1` - Enbor zeliakoa: aurreko hestearen arteria (barea, area eta gibela irrigatzen ditu).
  - **F** `w12/2.5.1/p7/s1` - Goiko arteria mesenterikoa: bitarteko hesteko eratorriak irrigatu (duodeno distala eta hesteen bi heren)
  - **F** `w12/2.5.1/p8/s1` - Beheko arteria mesenterikoa: atzeko hestetik sortzen diren eratorriak irrigatu (azken herena).
- Galdera (pool): mikro:12/adar-bentralak:3
- Galdera (contrast): Goiko eta beheko arteria mesenterikoak: zein hesterena da bakoitza?

## 11. Alboko eta atze alboko adarrak

Etapa: `alboko-adarrak` · 7 lerro · ~45 s hitz eginda

1. «Alboko errai adarrak abdomenean daude. Asko dira, baina hiru ikasiko ditugu.»
  _t=0.0975 · argi: alboko-errai-adarrak_
  - Ez dut ulertu: «Alboko errai adarrak sabeleko organoetara doaz. Hiru ezagutu behar ditugu.»
  - **F** `w12/2.5.2/p3/s1` ➔ ABDOMENEAN: (gehiago dira baina 3 bakarrik ikasi behar ditugu)

2. «Giltzurrun gaineko arteriak, arteria adrenalak, giltzurrun gaineko guruinetara doaz; giltzurrun arteriak, giltzurrunetara.»
  _t=0.2275 · argi: giltzurrun-gaineko-arteriak, giltzurrun-gaineko-guruinak, giltzurrun-arteriak, giltzurruna_
  - Ez dut ulertu: «Bi arteria giltzurrunetarako: giltzurrun gaineko arteriak guruinetara, eta giltzurrun arteriak giltzurrunetara.»
  - **F** `w12/2.5.2/p4/s1` - Giltzurrun gaineko arteriak = arteria adrenalak: giltzurrun gaineko guruinen irrigazioan parte hartu
  - **F** `w12/2.5.2/p5/s1` - Giltzurrun arteriak: giltzurrunak irrigatu

3. «Hirugarrena arteria gonadalak dira: obulutegietara edo barrabiletara doaz.»
  _t=0.365 · argi: arteria-gonadalak, gonadak · arbelean: b-alboko_
  - Ez dut ulertu: «Hirugarrena, arteria gonadalak, gonadetara doaz: obulutegiak edo barrabilak.»
  - **F** `w12/2.5.2/p6/s1` - Arteria gonadalak: obulutegiak edo barrabilak irrigatu.

4. «Segmentu arteko arteriak maila guztietan daude, eta bizkarraldeko muskuluak, orno muina eta larruazala irrigatzen dituzte.»
  _t=0.52 · argi: segmentu-arteko-arteriak_
  - Ez dut ulertu: «Atzeko adar hauek leku guztietan daude: bizkarreko muskuluak, bizkarrezur muina eta azala elikatzen dituzte.»
  - **F** `w12/2.5.3/p3/s1` Maila guztietan ikusten dira eta denetatik, atze alboko paretatik, atzeko adarren bat irteten da dortsoan ditugun muskulu ildaskatuak, orno muina, larruazala etab. irrigatzeko.

5. «Lepoan, segmentu arteko arteriak luzetarako anastomosien bidez lotzen dira, eta aortarekiko lotura galtzen dute.»
  _t=0.695 · argi: segmentu-arteko-arteriak, luzetarako-anastomosiak_
  - Ez dut ulertu: «Lepoan arteria horiek elkarren artean lotzen dira, kate luze bat eginez, eta aortatik askatzen dira.»
  - **F** `w12/2.5.3/p4/s1` ➔ LEPO eskualdean: Segmentu arteria hauen garapena desberdina izango da, segementu arteko arteria hauetatik luzetarako ANASTOMOSIAK (konexioak) agertzen dira eta aortarekin daukaten komunikazioa galtzen dute.

6. «Horrela sortzen dira orno arteriak eta lepoko beste arteria batzuk.»
  _t=0.695 · emphasis · argi: orno-arteria · arbelean: b-lepoa_
  - Ez dut ulertu: «Kate horretatik orno arteriak eta lepoko beste arteria batzuk sortzen dira.»
  - **F** `w12/2.5.3/p4/s2` Hori dela eta adar/arteria desberdinak agertzen dira (orno arteriak, lepoko arteria sakonak, lepoko goranzko arteria, arteria epigastriko, titiko arteriak…)

7. «Toraxean saihets arteko arteriak dira; gerrian, arteria lunbarrak; eta sakroan, alboko arteria sakroak.»
  _t=0.845 · emphasis · argi: saihets-arteko-arteriak, arteria-lunbarrak, alboko-arteria-sakroak · arbelean: b-mailak_
  - Ez dut ulertu: «Bularrean saihetsen artean doaz; gerrian, arteria lunbarrak dira; sakroan, alboko arteria sakroak.»
  - **F** `w12/2.5.3/p5/s1` ➔ TORAX mailan: Saihets arteko arteriak
  - **F** `w12/2.5.3/p6/s1` ➔ GERRI eskualdean: arteria lunbarrak edo gerriko arteriak
  - **F** `w12/2.5.3/p7/s1` ➔ SAKRO: Alboko arteria sakroak

- Arbela `b-alboko`: Alboko errai adarrak: giltzurrun gaineko arteriak (adrenalak), giltzurrun arteriak, arteria gonadalak
  - **F** `w12/2.5.2/p4/s1` - Giltzurrun gaineko arteriak = arteria adrenalak: giltzurrun gaineko guruinen irrigazioan parte hartu
  - **F** `w12/2.5.2/p5/s1` - Giltzurrun arteriak: giltzurrunak irrigatu
  - **F** `w12/2.5.2/p6/s1` - Arteria gonadalak: obulutegiak edo barrabilak irrigatu.
- Arbela `b-lepoa`: Lepoan: luzetarako anastomosiak, aortarekiko lotura galdu: orno arteriak
  - **F** `w12/2.5.3/p4/s1` ➔ LEPO eskualdean: Segmentu arteria hauen garapena desberdina izango da, segementu arteko arteria hauetatik luzetarako ANASTOMOSIAK (konexioak) agertzen dira eta aortarekin daukaten komunikazioa galtzen dute.
  - **F** `w12/2.5.3/p4/s2` Hori dela eta adar/arteria desberdinak agertzen dira (orno arteriak, lepoko arteria sakonak, lepoko goranzko arteria, arteria epigastriko, titiko arteriak…)
- Arbela `b-mailak`: Segmentu arteko arteriak: toraxean saihets artekoak, gerrian lunbarrak, sakroan alboko sakroak
  - **F** `w12/2.5.3/p5/s1` ➔ TORAX mailan: Saihets arteko arteriak
  - **F** `w12/2.5.3/p6/s1` ➔ GERRI eskualdean: arteria lunbarrak edo gerriko arteriak
  - **F** `w12/2.5.3/p7/s1` ➔ SAKRO: Alboko arteria sakroak
- Galdera (pool): mikro:12/alboko-adarrak:4
- Galdera (contrast): Alboko errai adarrak eta atze alboko adarrak: zein da zein?

## 12. Zilborreko eta iliako arteriak

Etapa: `zilbor-iliakoak` · 7 lerro · ~45 s hitz eginda

1. «Aorta dortsalaren urrutiko zatitik, sakro mailan, zilborreko arteriak ateratzen dira, karenara.»
  _t=0.1275 · argi: zilbor-arteriak, beheranzko-aorta_
  - Ez dut ulertu: «Aortaren azken zatitik zilborreko arteriak ateratzen dira, eta odola karenara daramate.»
  - **F** `w12/2.6/p3/s1` Aorta dortsalaren urrutiko ataletik karenara abiatzen diren (aortaren aurreko ataletik sakro mailan) zilborreko arteriak irteten dira.

2. «Gerriko bostgarren segmentu arteko arteriatik arteria iliako primitiboak sortzen dira, bi aldeetan.»
  _t=0.3125 · emphasis · argi: arteria-iliako-primitiboak · arbelean: b-iliakoak_
  - Ez dut ulertu: «Arteria iliako primitiboak ez datoz zuzenean aortatik: gerriko bostgarren segmentu arteko arteriatik datoz.»
  - **F** `w12/2.6/p3/s5` Gerriko V. segmentu arteko arteriatik sortzen dira arteria iliako primitiboak (ezker eta eskumaldean).

3. «Kanpoko arteria iliakoa luzatu egiten da, eta iztai lotailuaren azpitik arteria femorala deitzen da.»
  _t=0.51 · argi: kanpoko-arteria-iliakoa, arteria-femorala_
  - Ez dut ulertu: «Kanpoko iliakoa hankara doa; iztaia pasatu ondoren, arteria femorala deitzen zaio.»
  - **F** `w12/2.6/p4/s1` - Kanpoko arteria iliakoa: luzatu eta arteria femorala deituko da (iztai lotailu azpitik pasa ondorengo atala) beheko gorputz adarretako atalik garrantzitsuenak irrigatzeko.

4. «Zilborreko arteriek aortarekiko lotura galtzen dute, eta barneko arteria iliakoarekin lotzen dira.»
  _t=0.725 · emphasis · argi: zilbor-arteriak, barneko-arteria-iliakoa_
  - Ez dut ulertu: «Zilborreko arteriak aortatik askatu, eta barneko arteria iliakoari lotzen zaizkio.»
  - **F** `w12/2.6/p3/s3` Zilborreko arteria horiek aortarekin duten kontaktua galtzen dute beste arteria batekin kontaktatzeko (barneko arteria iliakoekin).
  - **F** `w12/2.6/p5/s1` - Barneko arteria iliakoa: bigarrengo konexioaren ondorioz, arteria hau zilborreko arteriarekin konektatzen da.

5. «Barneko iliakoaren adarrek pelbiseko organoak eta ipurmasailak irrigatzen dituzte.»
  _t=0.725 · argi: barneko-arteria-iliakoa_
  - Ez dut ulertu: «Barneko iliakoak pelbiseko organoak eta ipurmasailak elikatzen ditu.»
  - **F** `w12/2.6/p5/s3` Arteria honetatik irteten diren adarrek pelbiseko organoak eta ipurmasailak irrigatzen dituzte.

6. «Jaio ondoren, zilborreko arteriak itxi egiten dira, eta haien urrutiko zatitik erdialdeko zilbor lotailuak sortzen dira.»
  _t=0.945 · emphasis · argi: zilbor-arteriak, erdialdeko-zilbor-lotailua · arbelean: b-lotailuak_
  - Ez dut ulertu: «Jaio ondoren zilborreko arteriak ixten dira: azken zatia lokarri bihurtzen da, erdialdeko zilbor lotailua.»
  - **F** `w12/2.6/p6/s1` Jaio ondoren, zilborreko arteriak ixten dira eta urrutiko ataletik hedatzen dira erdialdeko zilborreko lotailuak.

7. «Hurbileko zatitik, berriz, goiko gernu maskuriaren arteria geratzen da.»
  _t=0.945 · argi: goiko-gernu-maskuri-arteria_
  - Ez dut ulertu: «Lehen zatia, aldiz, arteria bat da oraindik: goiko gernu maskuriaren arteria.»
  - g `w12/2.6/p8/s1` - Hurbileko ataletik goiko gernu maskuriaren arteria

- Arbela `b-iliakoak`: Arteria iliako primitiboak: gerriko V. segmentu arteko arteriatik
  - **F** `w12/2.6/p3/s5` Gerriko V. segmentu arteko arteriatik sortzen dira arteria iliako primitiboak (ezker eta eskumaldean).
- Arbela `b-lotailuak`: Jaio ondoren: zilborreko arterien urrutiko zatia erdialdeko zilbor lotailuak; hurbilekoa goiko gernu maskuriaren arteria
  - **F** `w12/2.6/p6/s1` Jaio ondoren, zilborreko arteriak ixten dira eta urrutiko ataletik hedatzen dira erdialdeko zilborreko lotailuak.
  - g `w12/2.6/p8/s1` - Hurbileko ataletik goiko gernu maskuriaren arteria
- Galdera (pool): mikro:12/zilbor-iliakoak:3
- Galdera (contrast): Kanpoko eta barneko arteria iliakoak: zein da zein?

## 13. Gorputz adarrak

Etapa: `gorputz-adarrak` · 5 lerro · ~33 s hitz eginda

1. «Gorputz adarren hastapen guztietan, mesodermotik, hasierako ardatz arteria bat garatzen da.»
  _t=0.0975 · argi: ardatz-arteria_
  - Ez dut ulertu: «Beso eta hanka bakoitzean arteria nagusi bat sortzen da lehenik: ardatz arteria.»
  - **F** `w12/2.7/p3/s1` Goiko eta beheko gorpuntz adarren hastapen guztietan garatu egiten dira hasierako ardatz arterialak (mesodermotik).

2. «Besoan, arteria guztiak ardatz arteria horretatik sortzen dira: brakiala, hezur artekoa, arku sakona, kubitala eta erradiala.»
  _t=0.5225 · emphasis · argi: ardatz-arteria, arteria-brakiala, hezur-arteko-arteria, eskuaurreko-arku-sakona, arteria-kubitala, arteria-erradiala_
  - Ez dut ulertu: «Besoko arteria guztiak ardatz arteria horretatik datoz, bat bera ere ez beste nonbaitetik.»
  - **F** `w12/2.7.1/p4/s2` Arteria guztiak hasierako ardatz arteriatik sortu egiten dira (arteria brakiala, hezur arteko arteria bat eta aurrean dagoen arteria arku sakona, arteria kubitala, erradiala…).

3. «Subklabioak besoko sistemara lotzen dira, baina besoko arteriak ez datoz subklabioetatik.»
  _t=0.68 · caution · argi: ezkerreko-subklabioa · arbelean: b-besoa_
  - Ez dut ulertu: «Kontuz: subklabioa besoko arteriekin lotzen da, baina ez da haien jatorria.»
  - **F** `w12/2.7.1/p4/s4` Hala ere honek ez du esan nahi goiko gorputz adarreko arteriak arteria subklabioetatik eratortzen direnik, goiko gorputz adarreko arteria sistematik sortzen dira eta subklabioekin konektatu bakarrik egiten dira.

4. «Hankan, ardatz arteria barneko arteria iliakoarekin bakarrik lotzen da, eta hortik arteria gutxi sortzen dira.»
  _t=0.965 · argi: ardatz-arteria, barneko-arteria-iliakoa_
  - Ez dut ulertu: «Hankan ezberdina da: ardatz arteria barneko arteria iliakoari lotzen zaio, eta arteria gutxi ematen ditu.»
  - **F** `w12/2.7.2/p3/s3` Garapenean ardatz arteria bakarrik barneko arteria iliakoarekin elkartzen da eta horretatik oso arteria gutxi garatzen dira: arteria ziatikoa, poplitioa eta honetatik ateratzen den arteria peroneoaren ataltxoren bat sortzen dira.

5. «Arteria ziatikoa, popliteoa eta peroneoaren zati bat. Gehienak arteria femoraletik datoz.»
  _t=0.965 · emphasis · argi: ardatz-arteria, arteria-ziatikoa, arteria-popliteoa, arteria-peroneoa, arteria-femorala · arbelean: b-hanka_
  - Ez dut ulertu: «Ardatz arteriatik ziatikoa, popliteoa eta peroneoaren zati bat; beste guztiak femoraletik.»
  - **F** `w12/2.7.2/p3/s3` Garapenean ardatz arteria bakarrik barneko arteria iliakoarekin elkartzen da eta horretatik oso arteria gutxi garatzen dira: arteria ziatikoa, poplitioa eta honetatik ateratzen den arteria peroneoaren ataltxoren bat sortzen dira.
  - g `w12/2.7.2/p3/s4` Gehienak, arteria femoraletatik sortu egiten dira.

- Arbela `b-besoa`: Besoko arteriak: ardatz arteriatik; subklabioak konektatu bakarrik egiten dira
  - **F** `w12/2.7.1/p4/s2` Arteria guztiak hasierako ardatz arteriatik sortu egiten dira (arteria brakiala, hezur arteko arteria bat eta aurrean dagoen arteria arku sakona, arteria kubitala, erradiala…).
  - **F** `w12/2.7.1/p4/s4` Hala ere honek ez du esan nahi goiko gorputz adarreko arteriak arteria subklabioetatik eratortzen direnik, goiko gorputz adarreko arteria sistematik sortzen dira eta subklabioekin konektatu bakarrik egiten dira.
- Arbela `b-hanka`: Hankan: ardatz arteria barneko iliakoarekin (ziatikoa, popliteoa, peroneoaren zati bat); gehienak femoraletik
  - **F** `w12/2.7.2/p3/s3` Garapenean ardatz arteria bakarrik barneko arteria iliakoarekin elkartzen da eta horretatik oso arteria gutxi garatzen dira: arteria ziatikoa, poplitioa eta honetatik ateratzen den arteria peroneoaren ataltxoren bat sortzen dira.
  - g `w12/2.7.2/p3/s4` Gehienak, arteria femoraletatik sortu egiten dira.
- Galdera (pool): mikro:12/gorputz-adarrak:4
- Galdera (contrast): Ardatz arteria: zer gertatzen da besoan eta hankan?

## 14. Osatu taula

Etapa: `gorputz-adarrak` · 1 lerro · ~5 s hitz eginda

1. «Azken zatia: bete taula oroimenetik, arku bakoitza eta zer sortzen duen. Gero, galdera bat.»
  _t=0.965 · summary_
  - Ez dut ulertu: «Orain zure txanda: bete taula buruz, eta gero galdera bat.»
  - **F** `w12/2/p3/s3` Komunikazio hauei aorta-arkuak deritze, eta 6 bikote garatuko dira, kronologikoki.

- Galdera (fill): klasea:12/taula
- Galdera (pool): w12-q-hodi-arteriosoa

## Estaldura

- Funtsezko esaldiak: 104 / 175; klaseak esaten ditu: 104.
- Klaseak aipatzen dituen esaldi guztiak: 122.
- Hitz egiteko denbora: ~9 min (galderak aparte).
