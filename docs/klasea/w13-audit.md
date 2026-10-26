# 13. gaiko klasea: iturriak

_Sortua: `npx tsx scripts/klasea/audit.ts 13`. F = funtsezkoa, g = garrantzitsua._

## 0. Gaur

Etapa: `sarrera` · 7 lerro · ~39 s hitz eginda

1. «Kaixo! Gaur zain sistemaren garapena ikasiko dugu, jaiotzako zirkulazioa eta linfa sistema barne.»
  _t=0.12_
  - Ez dut ulertu: «Gaurko gaia: zainak nola sortzen eta aldatzen diren, jaiotzan zer gertatzen den, eta linfa sistema.»
  - **F** `w13/1/p3/s1` Garapenaren 5. astean, enbrioiaren zain sinura 3 motako zain ezberdinak iristen dira, bikoitzak guztiak (eskumakoa eta ezkerrekoa dute):

2. «5. astean, zain sinura hiru zain mota iristen dira, eta guztiak bikoitzak dira: eskumakoa eta ezkerrekoa.»
  _t=0.12 · emphasis · argi: zain-sinua · arbelean: b-hiru_
  - Ez dut ulertu: «Bihotzaren sarrerara, zain sinura, hiru zain mota heltzen dira, eta mota bakoitzetik bi daude.»
  - **F** `w13/1/p3/s1` Garapenaren 5. astean, enbrioiaren zain sinura 3 motako zain ezberdinak iristen dira, bikoitzak guztiak (eskumakoa eta ezkerrekoa dute):

3. «Lehenak zain bitelinoak dira, bitelo zakutik datozenak. Hasieran bi dira.»
  _t=0.3 · argi: bitelo-zainak, bitelo-zaku-sekundarioa_
  - Ez dut ulertu: «Lehen mota: zain bitelinoak. Bitelo zakuko odola dakarte, eta bi dira.»
  - **F** `w13/1/p4/s1` ● Zain bitelinoak/onfalomesenterikoak: Hasiera batean bi dira, eskumakoa eta ezkerrekoa.

4. «Bigarrenak zilborreko zainak dira: karenatik datorren odol oxigenatua dakarte.»
  _t=0.5 · emphasis · argi: zilbor-zainak · arbelean: b-zilbor_
  - Ez dut ulertu: «Bigarren mota: zilborreko zainak. Haiek bakarrik dakarte oxigenoz betetako odola, karenatik.»
  - **F** `w13/1/p5/s1` ● Zilborreko zainak: Bi zain (ezker eta eskuma).
  - **F** `w13/1/p5/s2` Karenatik bueltatzen den odol oxigenatua, zilborreko zainen bitartez zain sinura heltzen da eta oxigenatua da karenatik datorrelako.

5. «Hirugarrenak kardinal komunak dira: aurreko eta atzeko kardinalak elkartuz sortzen dira.»
  _t=0.7 · argi: bena-kardinal-komuna_
  - Ez dut ulertu: «Hirugarren mota: kardinal komunak. Buruko eta gorputzeko zainak elkartzen dira, eta kardinal komuna eratzen dute.»
  - **F** `w13/1/p6/s1` ● Zain kardinal komunak: Aurreko kardinalak (odola enbrioiaren alde zefalikotik hartzen dutenak) eta atzeko kardinalak (odola alde kaudaletik hartzen dutenak,) elkartu egiten dira zain kardinal komuna eratuz.

6. «Kardinal zainek, berriz, oxigeno gutxiko odola dakarte.»
  _t=0.7_
  - Ez dut ulertu: «Kardinal zainetako odolak oxigeno gutxi du.»
  - **F** `w13/1/p6/s3` Beraz, zain sinura bueltatzen den odola oxigeno gutxikoa da.

7. «Beraz, hiru zain motak zain sinuaren luzapenetara heltzen dira, eta zain sinuan odola nahasten da.»
  _t=0.88 · argi: zain-sinua · arbelean: b-nahasi_
  - Ez dut ulertu: «Hiru zain motak toki berera heltzen dira, eta han odolak nahasten dira.»
  - **F** `w13/1/p7/s1` Beraz, 3 motako zain desberdin heltzen dira zain sinuaren alboko luzapenetaraino (ezkerreko zainak ezkerreko luzapenera eta eskumako zainak eskumako luzapenera) eta bihotz hodiaren zain sinuan, odol nahasketa ematen da.

- Arbela `b-hiru`: 5. astean zain sinura 3 zain mota, bikoitzak: bitelinoak, zilborrekoak eta kardinal komunak
  - **F** `w13/1/p3/s1` Garapenaren 5. astean, enbrioiaren zain sinura 3 motako zain ezberdinak iristen dira, bikoitzak guztiak (eskumakoa eta ezkerrekoa dute):
- Arbela `b-zilbor`: Zilborreko zainak: karenako odol oxigenatua
  - **F** `w13/1/p5/s2` Karenatik bueltatzen den odol oxigenatua, zilborreko zainen bitartez zain sinura heltzen da eta oxigenatua da karenatik datorrelako.
- Arbela `b-nahasi`: Zain sinuan odola nahasten da
  - **F** `w13/1/p7/s1` Beraz, 3 motako zain desberdin heltzen dira zain sinuaren alboko luzapenetaraino (ezkerreko zainak ezkerreko luzapenera eta eskumako zainak eskumako luzapenera) eta bihotz hodiaren zain sinuan, odol nahasketa ematen da.
- Galdera (predict): Zer uste duzu: hiru zain motetatik, zeinek dakar odol oxigenatua?
- Galdera (pool): mikro:13/sarrera:2

## 1. Zain bitelinoak

Etapa: `zain-nagusiak` · 9 lerro · ~54 s hitz eginda

1. «Zain sinuak bi luzapen ditu, eskumakoa eta ezkerrekoa, eta hiru zain motak haietara iristen dira.»
  _t=0.2 · argi: zain-sinua, eskuineko-sinu-luzapena, ezkerreko-sinu-luzapena_
  - Ez dut ulertu: «Zain sinuak bi beso ditu, bat alde bakoitzean, eta zain guztiak beso horietara heltzen dira.»
  - **F** `w13/2/p3/s1` Zain sinua eskumako eta ezkerreko luzapenak ditu eta bertara iristen dira aurretik aipatutako 3 zain motak: kardinal komunak, zain bitelinoak eta zilborreko zainak.

2. «Zainen artean anastomosiak sortzen dira: ezkerreko zainetako odola eskuinekoetara doa.»
  _t=0.5 · emphasis · argi: anastomosiak · arbelean: b-anast_
  - Ez dut ulertu: «Zainen artean zubiak sortzen dira, eta ezkerreko odola eskuinera pasatzen da.»
  - **F** `w13/2/p3/s2` Zainen artean anastomosiak gertatzen dira, ezkerreko zainetako odola normalean eskuinetara abiatuz.

3. «Horregatik, zain sinuaren ezkerreko luzapenak gero eta garrantzi gutxiago du.»
  _t=0.85 · argi: ezkerreko-sinu-luzapena_
  - Ez dut ulertu: «Ezkerreko besoak gero eta lan gutxiago egiten du.»
  - **F** `w13/2/p3/s3` Zain sinuaren ezkerreko luzapena gero eta garrantzia gutxiago izanik.

4. «Zain bitelinoek bitelo zakuko odola hartzen dute.»
  _etapa bitelinoak · t=0.08 · argi: bitelo-zainak, bitelo-zaku-sekundarioa_
  - Ez dut ulertu: «Zain bitelinoek bitelo zakuko odola biltzen dute.»
  - **F** `w13/2.1.1/p3/s1` Odola zaku bitelinoaren eratorri desberdinetatik hartzen dute.

5. «Gibelaren barruan adarkatzen dira, eta beste zain sare bat sortzen dute: gibeleko sinusoideak.»
  _t=0.45 · argi: gibela, gibeleko-sinusoideak_
  - Ez dut ulertu: «Gibelaren barruan zatitu egiten dira, eta hodi txikien sare bat egiten dute.»
  - **F** `w13/2.1.1/p3/s8` Gibel barnean adarkatu egiten dira eta beste zain sare/plexu bat sortzen dute.

6. «Gibeletik irteten diren azken atalak hodi hepatokardiakoak dira.»
  _t=0.55 · argi: gibela, hodi-hepatokardiakoak_
  - Ez dut ulertu: «Gibeletik bihotzera doazen azken zatiei hodi hepatokardiakoak deritze.»
  - **F** `w13/2.1.1/p3/s12` Hauek zain bitelinoen azken atalak dira.

7. «Garrantzitsua: eskuineko hodi hepatokardiakoa ez da galtzen; geroago, kaba zain baten zati bat izango da.»
  _t=0.68 · emphasis · argi: eskuineko-hodi-hepatokardiakoa · arbelean: tz-gibel_
  - Ez dut ulertu: «Eskuineko hodi hepatokardiakoa geratu egiten da, eta zain handi baten zati bihurtzen da.»
  - **F** `w13/2.1.1/p3/s13` Egitura hauek garrantzi handikoak dira, garapenaren ondorioz, eskuineko hodi hepatokardiakoa beheko bena kabaren gibel atala izango delako.

8. «Desagertzen dira ezkerreko zain bitelinoaren urrutiko eta hurbileko atalak, eta eskuinekoaren urrutiko atala.»
  _t=0.8 · argi: ezkerreko-zain-bitelinoa, eskuineko-zain-bitelinoa_
  - Ez dut ulertu: «Ezkerreko bitelinoa ia osorik galtzen da, eta eskuinekoaren mutur urruna ere bai.»
  - **F** `w13/2.1.1/p4/s3` Zehazki, ezkerreko zain bitelinoaren urrutiko atala eta hurbilekoa (edo ezkerreko hodi hepatokardiakoa) desagertuz, baita ere eskuineko zain bitelinoaren urritiko atala.

9. «Geratzen den zatitik porta zaina sortzen da: abdomeneko erraien odola, batez ere zeliakoena, hara iristen da.»
  _t=0.93 · argi: porta-zaina · arbelean: tz-porta_
  - Ez dut ulertu: «Geratzen den zatia porta zaina da. Sabeleko erraien odola biltzen du.»
  - **F** `w13/2.1.1/p4/s5` Bena portara iristen dira abdomeneko errai batzuetatik irteten den odola, batez ere errai zeliakoetatik irteten den odola helduko da.

- Arbela `b-anast`: Anastomosiak: ezkerreko zainetako odola eskuineko zainetara
  - **F** `w13/2/p3/s2` Zainen artean anastomosiak gertatzen dira, ezkerreko zainetako odola normalean eskuinetara abiatuz.
- Taula `tz-porta`: Porta zaina → Eskuineko zain bitelinoa, duodenoaren inguruan
  - **F** `w13/2.1.2/p3/s1` Duodenoaren inguruko plexutik porta zaina sortzen da, zain hau eskuineko zain bitelinotik sortzen da eta bertatik irekitzen diren (bertan bukatzen duten) porta zain garrantzitsuenak hauek 2 dira:
- Taula `tz-gibel`: Beheko kabaren gibel segmentua → Eskuineko hodi hepatokardiakoa
  - **F** `w13/2.1.1/p3/s13` Egitura hauek garrantzi handikoak dira, garapenaren ondorioz, eskuineko hodi hepatokardiakoa beheko bena kabaren gibel atala izango delako.
- Taula `tz-azigos`: Azigos zaina → Eskuineko kardinal gaineko zaina eta eskuineko atzeko kardinalaren hurbileko atala
  - **F** `w13/2.3/p8/s5` *Beraz, azigos zainaren eraketan parte hartzen du eskuineko kardinal gaineko zaina eta eskuineko atzeko kardinalaren hurbileko atala.
- Taula `tz-hemi`: Hemiazigosa eta hemiazigos laguntzailea → Ezkerreko kardinal gaineko zaina
  - **F** `w13/2.3/p9/s1` ● Ezkerreko kardinal gaineko zainetik, bi zain enbor ezberdin eratuko dira: hemiazigos zaina eta bere goikaldean hemiazigos laguntzailea.
- Taula `tz-giltz`: Beheko kabaren giltzurrun segmentua → Eskuineko kardinal azpiko zaina
  - **F** `w13/3.1/p6/s1` ➔ ESKUINEKO kardinal azpiko zainetik beheko bena kabaren beste atal bat eratuko da: Beheko bena kabaren giltzurrun segmentua.
- Taula `tz-ezk-giltz`: Ezkerreko giltzurrun zaina → Kardinal azpiko zainen anastomosia
  - **F** `w13/3.1/p4/s1` ● Kardinal azpiko zainak: kardinal azpiko zainen artean (ezkerrekoa eta eskumakoa) ANASTOMOSI bat agertuko da, ezkerretik datorren odola eskumaldera eramateko.
  - **F** `w13/3.1/p5/s1` ➔ EZKERREKO giltzurrun zaina: Horretan, ezkerreko kardinal azpiko zainaren urrutiko ataletik: ezkerreko zain gonadala (obolutegikoa edo barrabiletako) agertuko da (*irudian ezkerreko giltzurrun benaren behetik*) eta honek eskuineko kardinal azpiko zainera iritsiko da.
- Taula `tz-iliako`: Ezkerreko zain iliako primitiboa → Ezkerreko sakrokardinalaren urrutiko atala
  - **F** `w13/3.1/p8/s1` ➔ EZKERREKO zainaren urrutiko ataletik: ezkerreko zain iliako primitiboa eratuko da.
- Taula `tz-sakro`: Beheko kabaren segmentu sakrokardinala → Eskuineko zain sakrokardinala
  - **F** `w13/3.1/p9/s7` Gibel segmentua/atala (hodi hepatokardiakotik sortua), fusionatzen dena eskuineko kardinal azpitik sortutako gilltzurrun segmentuarekin (eskuineko kardinal azpiko zainetik sorturikoa), eta azken hau atal sakrokardinalarekin (eskuin zain sakrokardinalaren hurbileko ataletik garatu).
- Taula `tz-sinu`: Sinu koronarioa → Zain sinuaren ezkerreko luzapena
  - **F** `w13/3.1/p9/s14` Honetatik, bi egitura sortzen dira: sinu koronarioa (gibelako atzeko paretan dagoen zain berezi bat) eta zain sinu koronarioraino iristen den beste zaina, ezkerreko aurikularen zain laprana.
- Taula `tz-brakio`: Ezkerreko zain brakiozefalikoa → Aurreko kardinalen anastomosia
  - **F** `w13/3.2/p4/s1` ● Aurreko kardinalak: EZKERREKO aurreko kardinalaren eta ESKUINEKO aurreko kardinalaren artean beste ANASTOMOSI bat emango da.
  - **F** `w13/3.2/p5/s1` ➔ EZKERREKO zain brakiozefalikoa sortuko da.
- Taula `tz-goiko`: Goiko kaba zaina → Eskuineko kardinal komuna eta eskuineko aurreko kardinalaren hurbileko atala
  - **F** `w13/3.2/p11/s4` Beraz, goiko bena kabaren enborra eskuineko kardinal komunetik eta eskuineko aurreko kardinalaren hurbileko ataletik sortzen da.
- Galdera (contrast): Bi hodi hepatokardiakoak: zer gertatzen zaie?

## 2. Porta zaina

Etapa: `porta` · 6 lerro · ~36 s hitz eginda

1. «Duodenoaren inguruan porta zaina sortzen da. Bi zain garrantzitsu irekitzen dira hara.»
  _t=0.1 · argi: duodenoa, porta-zaina_
  - Ez dut ulertu: «Porta zaina duodenoaren inguruan eratzen da, eta bi zain handi heltzen zaizkio.»
  - **F** `w13/2.1.2/p3/s1` Duodenoaren inguruko plexutik porta zaina sortzen da, zain hau eskuineko zain bitelinotik sortzen da eta bertatik irekitzen diren (bertan bukatzen duten) porta zain garrantzitsuenak hauek 2 dira:

2. «Lehena goiko zain mesenterikoa da, portaren eskuman. Hau ere eskuineko zain bitelinotik sortzen da.»
  _t=0.22 · argi: goiko-zain-mesenterikoa, eskuineko-zain-bitelinoa_
  - Ez dut ulertu: «Lehen zaina goiko zain mesenterikoa da, eskuinaldean, eta eskuineko zain bitelinotik dator.»
  - **F** `w13/2.1.2/p4/s1` ● Goiko zain mesenterikoa: (portaren eskuma) eskuineko zain bitelinotik ere sortzen da.

3. «Bigarrena zain esplenikoa da: baretik dator, portaren ezkerrean dago, eta bi bitelinoen arteko lotura batetik sortzen da.»
  _t=0.38 · argi: zain-esplenikoa, barea_
  - Ez dut ulertu: «Bigarrena zain esplenikoa da. Baretik dator, ezkerraldetik, eta bi bitelinoak lotzen dituen zubi batetik sortzen da.»
  - **F** `w13/2.1.2/p5/s1` ● Zain esplenikoa: (portaren ezker) baretik dator eta bi zain bitelinoen arteko (ezkerrekoa eta eskuinekoa) anastomosi bidez sortua.

4. «Bi zain horiek elkartu egiten dira, eta porta zainera heltzen dira.»
  _t=0.55 · argi: porta-zaina_
  - Ez dut ulertu: «Mesenterikoa eta esplenikoa elkartzen dira, eta porta zaina osatzen dute.»
  - g `w13/2.1.2/p5/s2` Bi zain hauek elkartu eta porta zainera heltzen dira.

5. «Portatik sartzen den odola sinusoideen saretik pasatzen da, eta eskuineko hodi hepatokardiakotik irteten da.»
  _t=0.82 · argi: gibeleko-sinusoideak, eskuineko-hodi-hepatokardiakoa_
  - Ez dut ulertu: «Portako odolak hodi txikien sarea zeharkatzen du, eta eskuineko hodi hepatokardiakotik ateratzen da.»
  - **F** `w13/2.1.3/p4/s2` Horren ondorioz, odolaren ibilbidea honakoa izango da: zain portatik (behetik) gibelera sartzen den odola gibel barneko zain plexutik pasatuko da, gibeletik irteteko eta ESKUINEKO hodi hepatokardiakora (goian) iristeko (honek zain sinuaren eskuineko luzapenean amaituko du).

6. «Bi hodietatik ezkerrekoa desagertzen da, eta eskuinekoa geratzen da.»
  _t=0.93 · emphasis · argi: eskuineko-hodi-hepatokardiakoa_
  - Ez dut ulertu: «Ezkerrekoa galtzen da, eta eskuinekoa geratzen da.»
  - **F** `w13/2.1.3/p4/s1` ➔ EZKERREKO hodi hepatokardiakoa desagertuko da.
  - **F** `w13/2.1.3/p5/s1` ➔ ESKUINEKO hodi hepatokardiakoa garapenean, beheko bena kabaren gibel segmentu bat izango da.

- Galdera (contrast): Porta zainera heltzen diren bi zainak: non dago bakoitza?
- Galdera (pool): w13-q-plexua

## 3. Zilborreko zainak

Etapa: `zilbor-zainak` · 6 lerro · ~36 s hitz eginda

1. «Hasieran, zilborreko zainak gibelaren bi aldeetatik pasatzen dira, zain sinuaren bi luzapenetara.»
  _t=0.13 · argi: zilbor-zainak, gibela_
  - Ez dut ulertu: «Hasieran bi zilborreko zainak gibelaren alde banatik doaz, zain sinura.»
  - **F** `w13/2.2/p3/s1` Hasieran, zilborreko zainak gibelaren bi aldetatik pasatzen dira eta zain sinuaren ezkerreko zein eskuineko luzapenetara iristen dira.

2. «Eskuineko zilborreko zaina osorik desagertzen da.»
  _t=0.45 · emphasis · argi: eskuineko-zilbor-zaina_
  - Ez dut ulertu: «Eskuineko zilborreko zaina erabat galtzen da.»
  - **F** `w13/2.2/p4/s1` ➔ ESKUINEKO zilborreko zain osoa desagertuko da.

3. «Ezkerrekoaren hurbileko atala ere desagertzen da; urrutiko atalak lotura zuzena egiten du eskuineko hodi hepatokardiakoarekin.»
  _t=0.75 · argi: eskuineko-hodi-hepatokardiakoa_
  - Ez dut ulertu: «Ezkerrekoaren zati bat galtzen da, eta beste zatia eskuineko hodi hepatokardiakoarekin lotzen da zuzenean.»
  - **F** `w13/2.2/p5/s1` ➔ EZKERREKO zilborreko zainaren hurbileko ataltxoa ere desagertzen da.
  - **F** `w13/2.2/p5/s2` Eta ezkerreko zilborreko zainaren urrutiko atalak zuzeneko komunikazioa edo anastomosia sortzen du eskuineko hodi hepatokardiakoarekin: Hodi benosoa (behean berriz azaltzen da).

4. «Lotura horri hodi benosoa deritzo.»
  _t=0.76 · emphasis · argi: hodi-benosoa · arbelean: b-benosoa_
  - Ez dut ulertu: «Lotura zuzen horrek hodi benosoa du izena.»
  - **F** `w13/2.2/p5/s2` Eta ezkerreko zilborreko zainaren urrutiko atalak zuzeneko komunikazioa edo anastomosia sortzen du eskuineko hodi hepatokardiakoarekin: Hodi benosoa (behean berriz azaltzen da).

5. «Beraz, karenako odol oxigenatua ezkerreko zilborreko zainetik dator, eta hodi benosotik eskuineko hodi hepatokardiakora pasatzen da.»
  _t=0.78 · argi: ezkerreko-zilbor-zaina, hodi-benosoa, eskuineko-hodi-hepatokardiakoa_
  - Ez dut ulertu: «Karenako odol ona ezkerreko zilborreko zainetik dator, eta hodi benosotik pasatzen da.»
  - **F** `w13/2.2/p5/s3` Beraz, karenatik datorren odol oxigenatua ezkerreko zilborreko zaina*ren bitartez garraiatzen da.
  - **F** `w13/2.2/p5/s4` Ezkerreko zilbor-zain honek zuzeneko anastomosi/konexio bat egingo du eskuineko hodi hepatokardiakoarekin, hodi benosoa* deritzona (komukazio hau gibelaren azalean kokatzen da).

6. «Kontuz: hodi benosoa gibelaren azalean dago, ez barruan, irudietan dirudien arren.»
  _t=0.9 · caution · argi: hodi-benosoa, gibela_
  - Ez dut ulertu: «Kontuz: hodi benosoa gibelaren gainazalean dago, ez gibelaren barruan.»
  - **F** `w13/2.2/p5/s9` *KONTUZ: Hodi benosoa gibelaren azaleran dago kokatuta, eta ez gibelaren barrualdean, irudietan dirudien bezala.

- Arbela `b-benosoa`: Hodi benosoa: ezkerreko zilborreko zaina eta eskuineko hodi hepatokardiakoa lotzen ditu, gibelaren azalean
  - **F** `w13/2.2/p5/s4` Ezkerreko zilbor-zain honek zuzeneko anastomosi/konexio bat egingo du eskuineko hodi hepatokardiakoarekin, hodi benosoa* deritzona (komukazio hau gibelaren azalean kokatzen da).
  - **F** `w13/2.2/p5/s9` *KONTUZ: Hodi benosoa gibelaren azaleran dago kokatuta, eta ez gibelaren barrualdean, irudietan dirudien bezala.
- Galdera (contrast): Bi zilborreko zainak: zer geratzen da?
- Galdera (pool): mikro:13/zilbor-zainak:5

## 4. Kardinal zainak

Etapa: `kardinalak` · 5 lerro · ~31 s hitz eginda

1. «Hasieran, 5. astera arte, bi zain kardinal mota daude: aurreko kardinalak eta atzeko kardinalak.»
  _t=0.06 · argi: aurreko-zain-kardinalak, atzeko-zain-kardinalak_
  - Ez dut ulertu: «5. astera arte, bi kardinal mota daude: buruko odola biltzen dutenak eta gorputzeko odola biltzen dutenak.»
  - **F** `w13/2.3/p3/s1` Hasieran, garapenaren 5. astera arte 2 motatako zain kardinal daude:

2. «5. eta 7. asteen artean, hiru zain sistema berri agertzen dira, bikoitzak. Lehena, kardinal azpiko zainak: giltzurrunetako odola.»
  _t=0.38 · emphasis · argi: kardinal-azpiko-zainak, giltzurruna · arbelean: b-hiru-sistema_
  - Ez dut ulertu: «Gero hiru zain sistema berri sortzen dira. Lehenak, kardinal azpiko zainek, giltzurrunetako odola biltzen dute.»
  - **F** `w13/2.3/p7/s2` Baina garapenaren 5. eta 7. asteen artean, beste 3 zain-sistema berri agertzen dira, guztiak bilateralak (eskumako bat eta ezkerreko beste bat): 1. Kardinal azpiko zainak/subkardinalak: Giltzurrunetatik irteten den zain odola (desoxigenatua) kardinal azpiko zain hauetara bueltatzeaz arduratzen dira.

3. «Bigarrena, zain sakrokardinalak: beheko gorputz adarretako odola hara heltzen da.»
  _t=0.5 · argi: zain-sakrokardinalak_
  - Ez dut ulertu: «Bigarrenak, zain sakrokardinalek, hanketako odola biltzen dute.»
  - **F** `w13/2.3/p7/s3` (Abdomenean kokatuak) 2. Zain sakrokardinalak: Beheko gorputz adarretatik iristen den zain odola hona heltzen da.

4. «Hirugarrena, kardinal gaineko zainak: gorputz paretako odola, saihets arteko zainen bidez.»
  _t=0.72 · argi: kardinal-gaineko-zainak, saihets-arteko-zainak_
  - Ez dut ulertu: «Hirugarrenak, kardinal gaineko zainek, gorputz paretako odola biltzen dute, saihets arteko zainetatik.»
  - **F** `w13/2.3/p7/s5` Zonalde hauetara gorputz paretako zainen oldola iritsikoa da, iritsitako odola saihets arteko zainen bitartez itzultzen da.

5. «Ondorioz, atzeko kardinalek egiten zuten lana kardinal gaineko zainek egiten dute orain.»
  _t=0.85 · argi: atzeko-zain-kardinalak, kardinal-gaineko-zainak_
  - Ez dut ulertu: «Atzeko kardinalen lana kardinal gaineko zainek hartzen dute.»
  - **F** `w13/2.3/p7/s8` Ondorioz, lehen atzeko kardinal zainek egiten zuten lana, beranduago kardinal gaineko zainek egiten dute.

- Arbela `b-hiru-sistema`: 5.–7. asteak: kardinal azpikoak (giltzurrunak), sakrokardinalak (beheko gorputz adarrak), kardinal gainekoak (gorputz pareta)
  - **F** `w13/2.3/p7/s2` Baina garapenaren 5. eta 7. asteen artean, beste 3 zain-sistema berri agertzen dira, guztiak bilateralak (eskumako bat eta ezkerreko beste bat): 1. Kardinal azpiko zainak/subkardinalak: Giltzurrunetatik irteten den zain odola (desoxigenatua) kardinal azpiko zain hauetara bueltatzeaz arduratzen dira.
  - **F** `w13/2.3/p7/s3` (Abdomenean kokatuak) 2. Zain sakrokardinalak: Beheko gorputz adarretatik iristen den zain odola hona heltzen da.
  - **F** `w13/2.3/p7/s5` Zonalde hauetara gorputz paretako zainen oldola iritsikoa da, iritsitako odola saihets arteko zainen bitartez itzultzen da.
- Galdera (contrast): Hiru sistema berriak: zer odol biltzen du bakoitzak?
- Galdera (pool): w13-q-sistema-berriak

## 5. Azigos sistema

Etapa: `azigos` · 5 lerro · ~29 s hitz eginda

1. «Eskuineko kardinal gaineko zaina eskuineko atzeko kardinalaren hurbileko atalarekin elkartzen da.»
  _t=0.06 · argi: kardinal-gaineko-zainak, atzeko-zain-kardinalak_
  - Ez dut ulertu: «Eskuinean, kardinal gaineko zaina atzeko kardinalaren zati batekin lotzen da.»
  - **F** `w13/2.3/p8/s1` ● Eskuineko kardinal gaineko zainak kontaktatzen du eskuineko atzeko kardinalaren hurbileko atalarekin.

2. «Bien artean azigos zaina eratzen dute.»
  _t=0.2 · emphasis · argi: azigos-zaina · arbelean: tz-azigos_
  - Ez dut ulertu: «Bi zati horiek elkartuta, zain berri bat: azigos zaina.»
  - **F** `w13/2.3/p8/s2` Orduan, eskuineko kardinal gaineko zain honetatik, eta baita eskuineko atzeko kardinalaren hurbileko ataletik, paretako zain bat sortzen da, azigos zaina, beheko kaba zainan bukatzen dena.
  - **F** `w13/2.3/p8/s5` *Beraz, azigos zainaren eraketan parte hartzen du eskuineko kardinal gaineko zaina eta eskuineko atzeko kardinalaren hurbileko atala.

3. «Ezkerreko kardinal gaineko zainetik bi enbor sortzen dira: behean hemiazigos zaina, eta goian hemiazigos laguntzailea.»
  _t=0.68 · argi: kardinal-gaineko-zainak, hemiazigos-zaina, hemiazigos-laguntzailea · arbelean: tz-hemi_
  - Ez dut ulertu: «Ezkerreko kardinal gaineko zainak bi zain ematen ditu: hemiazigosa behean eta hemiazigos laguntzailea goian.»
  - **F** `w13/2.3/p9/s1` ● Ezkerreko kardinal gaineko zainetik, bi zain enbor ezberdin eratuko dira: hemiazigos zaina eta bere goikaldean hemiazigos laguntzailea.

4. «Hemiazigosak 9., 10. eta 11. saihets arteko espazioetako odola eramaten du azigos zainera.»
  _t=0.8 · argi: hemiazigos-zaina, azigos-zaina_
  - Ez dut ulertu: «Hemiazigosak saihets tarteetako odola, 9.etik 11.era, azigos zainera darama.»
  - **F** `w13/2.3/p10/s1` - Hemiazigos: 9, 10 eta 11. sahiets-arteko espazioetatik odola hartzen dute eskuinean kokatzen den azigos zaineraino.

5. «Hemiazigos laguntzaileak, goian, 4.etik 8.era bitarteko espazioetako odola darama azigos zainera.»
  _t=0.92 · argi: hemiazigos-laguntzailea, azigos-zaina_
  - Ez dut ulertu: «Hemiazigos laguntzaileak goiko saihets tarteetako odola, 4.etik 8.era, azigos zainera darama.»
  - **F** `w13/2.3/p11/s1` - Hemiazigos laguntzailea: goikaldean ezkerreko kardinal gaineko zainetik 4., 5., 6., 7., 8., saihets-arteko espazioetatik zainek eramaten duten odola beste enbor baten bidez garraiatzen dute odola eskuinean kokatzen den azigos zainera.

- Galdera (zer-da-hau)
- Galdera (contrast): Hemiazigos zaina eta hemiazigos laguntzailea: zein espaziotako odola?
- Galdera (pool): w13-q-azigos

## 6. Kaba zainak

Etapa: `kaba-zainak` · 11 lerro · ~64 s hitz eginda

1. «Hiru zain sistema horietatik bi zain sistema nagusi sortzen dira, gure zainik garrantzitsuenak.»
  _t=0.12 · argi: kardinal-gaineko-zainak, kardinal-azpiko-zainak, zain-sakrokardinalak_
  - Ez dut ulertu: «Hiru sistema horietatik gorputzeko zain handienak sortzen dira.»
  - **F** `w13/3/p3/s1` 3 zain sistema hauetatik (kardinal gaineko eta azpiko zainak eta zain sakrokardinalak) 2 zain sistema nagusiak sortzen dira.
  - **F** `w13/3/p3/s2` Sistema guzti hauetatik gure gorputzean ditugun zainik garrantzitsuenak sortuko dira:

2. «Goiko kaba zaina atzeko pareta lisotik sartzen da, eta beheko kaba zaina behetik.»
  _t=0.6 · argi: goiko-kaba-zaina, atal-lisoa, beheko-kaba-zaina_
  - Ez dut ulertu: «Bi kaba zainak bihotzera sartzen dira: goikoa atzeko horma lisotik, behekoa behetik.»
  - **F** `w13/3/p6/s2` (atzeko pareta lisotik goiko kaba zaina sartuko da eta behetik beheko kaba zaina).

3. «Gogoratu prozesu garrantzitsuena: ezkerreko zainetako odola eskuineko zainetara pasatzen da, lotura hauen bidez.»
  _t=0.85 · emphasis · argi: aurreko-kardinalen-anastomosia, kardinal-gaineko-anastomosia, kardinal-azpiko-anastomosia, sakrokardinal-anastomosia_
  - Ez dut ulertu: «Gako nagusia: lotura horiei esker, ezkerreko odola eskuineko zainetara pasatzen da.»
  - **F** `w13/3/p7/s1` Gogoratu, zain sistemaren garapenean gertatzen den prozesu garrantzitsuenetarikoa dela ezkerreko zainetik doan odola eskumako zainetara pasatzen dela.
  - **F** `w13/3/p7/s2` Beraz, eskumako eta ezkerreko zainen artean anastomosiak (konexioak) sortuko dira denborarekin:

4. «Beheko kaba zaina abdomenetik heltzen den zainik garrantzitsuena da, eta hainbat atal ditu.»
  _etapa beheko-kaba · t=0.05 · argi: beheko-kaba-zaina_
  - Ez dut ulertu: «Beheko kaba sabeleko zain nagusia da, eta zati batzuez osatuta dago.»
  - **F** `w13/3.1/p3/s1` BEHEKO kaba zainan atal desberdinak bereiziko dira.
  - **F** `w13/3.1/p3/s2` Abdomenetik heltzen den zainik garrantzitsuena da.

5. «Goiko segmentua gibel segmentua da.»
  _t=0.15 · argi: kabaren-gibel-segmentua_
  - Ez dut ulertu: «Goiko zatiari gibel segmentua deritzo.»
  - **F** `w13/3.1/p3/s4` Beheko bena kabaren goiko segmentua Gibel segmentua da (eskuineko hodi hepatokardiakotik sortua).

6. «Kardinal azpiko zainen anastomosia agertzen da: ezkerreko odola eskuinera eramaten du.»
  _t=0.25 · argi: kardinal-azpiko-anastomosia, kardinal-azpiko-zainak_
  - Ez dut ulertu: «Bi kardinal azpiko zainen artean zubi bat sortzen da, ezkerretik eskuinera.»
  - **F** `w13/3.1/p4/s1` ● Kardinal azpiko zainak: kardinal azpiko zainen artean (ezkerrekoa eta eskumakoa) ANASTOMOSI bat agertuko da, ezkerretik datorren odola eskumaldera eramateko.

7. «Hortik ezkerreko giltzurrun zaina sortzen da, eta ezkerreko kardinal azpikoaren urrutiko ataletik, ezkerreko zain gonadala.»
  _t=0.35 · argi: ezkerreko-giltzurrun-zaina, ezkerreko-zain-gonadala · arbelean: tz-ezk-giltz_
  - Ez dut ulertu: «Zubi hori ezkerreko giltzurrun zaina da. Ezkerreko zain gonadala ere hortik sortzen da.»
  - **F** `w13/3.1/p5/s1` ➔ EZKERREKO giltzurrun zaina: Horretan, ezkerreko kardinal azpiko zainaren urrutiko ataletik: ezkerreko zain gonadala (obolutegikoa edo barrabiletako) agertuko da (*irudian ezkerreko giltzurrun benaren behetik*) eta honek eskuineko kardinal azpiko zainera iritsiko da.

8. «Eskuineko kardinal azpiko zainetik beheko kabaren giltzurrun segmentua sortzen da.»
  _t=0.45 · argi: kardinal-azpiko-zainak, kabaren-giltzurrun-segmentua · arbelean: tz-giltz_
  - Ez dut ulertu: «Eskuineko kardinal azpiko zaina beheko kabaren giltzurrun segmentua bihurtzen da.»
  - **F** `w13/3.1/p6/s1` ➔ ESKUINEKO kardinal azpiko zainetik beheko bena kabaren beste atal bat eratuko da: Beheko bena kabaren giltzurrun segmentua.

9. «Zain sakrokardinalen anastomosia ere agertzen da.»
  _t=0.55 · argi: sakrokardinal-anastomosia, zain-sakrokardinalak_
  - Ez dut ulertu: «Bi sakrokardinalen artean ere zubi bat sortzen da.»
  - **F** `w13/3.1/p7/s1` ● Zain sakrokardinalak: (Eskuineko eta ezkerrekoa daude) Haien artean beste ANASTOMOSI (kontaktu) bat agertuko da.

10. «Ezkerreko sakrokardinalaren urrutiko ataletik ezkerreko zain iliako primitiboa sortzen da; eskuinekotik, eskuinekoa.»
  _t=0.65 · argi: zain-sakrokardinalak, ezkerreko-zain-iliako-primitiboa, eskuineko-zain-iliako-primitiboa · arbelean: tz-iliako_
  - Ez dut ulertu: «Sakrokardinal bakoitzaren mutur urruna iliako bat bihurtzen da, alde bakoitzean.»
  - **F** `w13/3.1/p8/s1` ➔ EZKERREKO zainaren urrutiko ataletik: ezkerreko zain iliako primitiboa eratuko da.
  - **F** `w13/3.1/p9/s1` ➔ ESKUINEKO sakrokardinalaren urrutiko ataletik: eskuineko zain iliako primitiboa.

11. «Laburbilduz, beheko kabak hiru atal ditu: gibel segmentua, giltzurrun segmentua eta segmentu sakrokardinala.»
  _t=0.85 · emphasis · argi: beheko-kaba-zaina, kabaren-gibel-segmentua, kabaren-giltzurrun-segmentua, kabaren-segmentu-sakrokardinala · arbelean: tz-sakro_
  - Ez dut ulertu: «Beheko kaba hiru zatiz egina dago, hiru jatorritatik.»
  - **F** `w13/3.1/p9/s7` Gibel segmentua/atala (hodi hepatokardiakotik sortua), fusionatzen dena eskuineko kardinal azpitik sortutako gilltzurrun segmentuarekin (eskuineko kardinal azpiko zainetik sorturikoa), eta azken hau atal sakrokardinalarekin (eskuin zain sakrokardinalaren hurbileko ataletik garatu).

- Galdera (contrast): Beheko kabaren atalak: nondik dator bakoitza?
- Galdera (pool): w13-q-ezkerreko-giltzurruna

## 7. Sinu koronarioa eta goiko kaba

Etapa: `sinu-koronarioa` · 8 lerro · ~52 s hitz eginda

1. «Anastomosien ondorioz, ezkerreko luzapenak garrantzia galtzen du, eta odol osoa eskuineko luzapenera doa.»
  _t=0.2 · argi: ezkerreko-sinu-luzapena, eskuineko-sinu-luzapena_
  - Ez dut ulertu: «Odol guztia eskuinera doanez, ezkerreko besoak garrantzia galtzen du.»
  - **F** `w13/3.1/p9/s12` Ezkerreko eta eskuineko zainen artean gertatzen diren anastomosien ondorioz, zain sinuaren ezkerreko luzapena galtzen du daukan garrantzia eta odol osoa abiatzen da eskuineko luzapenera.

2. «Ezkerreko luzapenetik bi egitura geratzen dira: sinu koronarioa eta ezkerreko aurikularen zain laprana.»
  _t=0.55 · emphasis · argi: ezkerreko-sinu-luzapena, sinu-koronarioa, ezkerreko-aurikularen-zain-laprana · arbelean: tz-sinu_
  - Ez dut ulertu: «Ezkerreko beso horretatik sinu koronarioa geratzen da, eta zain txiki bat: ezkerreko aurikularen zain laprana.»
  - **F** `w13/3.1/p9/s14` Honetatik, bi egitura sortzen dira: sinu koronarioa (gibelako atzeko paretan dagoen zain berezi bat) eta zain sinu koronarioraino iristen den beste zaina, ezkerreko aurikularen zain laprana.

3. «Aurreko kardinalen anastomosia sortzen da, ezkerretik eskuinera.»
  _etapa goiko-kaba · t=0.18 · argi: aurreko-kardinalen-anastomosia_
  - Ez dut ulertu: «Lepoan, bi aurreko kardinalen artean zubi bat sortzen da.»
  - **F** `w13/3.2/p4/s1` ● Aurreko kardinalak: EZKERREKO aurreko kardinalaren eta ESKUINEKO aurreko kardinalaren artean beste ANASTOMOSI bat emango da.

4. «Hortik ezkerreko zain brakiozefalikoa sortzen da.»
  _t=0.3 · emphasis · argi: ezkerreko-zain-brakiozefalikoa · arbelean: tz-brakio_
  - Ez dut ulertu: «Zubi hori ezkerreko zain brakiozefalikoa da.»
  - **F** `w13/3.2/p5/s1` ➔ EZKERREKO zain brakiozefalikoa sortuko da.

5. «Hara bi zain iristen dira: ezkerreko barneko jugularra, buruaren ezkerretik, eta ezkerreko subklabioa, goiko gorputz adarretik.»
  _t=0.43 · argi: barneko-jugularrak, zain-subklabioak_
  - Ez dut ulertu: «Hara heltzen dira buruko zaina, barneko jugularra, eta besoko zaina, subklabioa.»
  - **F** `w13/3.2/p6/s1` ➔ Ezkerreko zain brakiozefaliko horretara, bi zain nagusi iristen dira:
  - **F** `w13/3.2/p7/s1` - Ezkerreko barneko jugularra (ezkerreko aurreko kardinalaren urrutiko ataletik sortzen dena) → buruaren eta aurpegiaren ezkerreko aldea drenatzeko.
  - **F** `w13/3.2/p8/s1` - Ezkerreko lepauztaipeko zaina/subklabioa (ezkerreko goiko gorputz adarretik irteten dena).

6. «Eskuman, eskuineko zain brakiozefalikoa: eskuineko barruko jugularra eta eskuineko subklabioa.»
  _t=0.56 · argi: eskuineko-zain-brakiozefalikoa, barneko-jugularrak, zain-subklabioak_
  - Ez dut ulertu: «Eskuinean, eskuineko zain brakiozefalikoa dago, jugularrarekin eta subklabioarekin.»
  - **F** `w13/3.2/p9/s1` ➔ ESKUINEKO zain brakiozefalikoa sortuko da ere bai.
  - **F** `w13/3.2/p10/s1` - Eskuineko barruko jugularra (eskuineko aurreko zain kardinalaren urrutiko ataletik sortu).
  - **F** `w13/3.2/p11/s1` - Eskuineko lepauztaipeko zaina /subklabioa: (eskuineko goiko gorputz adarretik iristen dena).

7. «Beraz, goiko kaba zaina eskuineko kardinal komunetik eta eskuineko aurreko kardinalaren hurbileko ataletik sortzen da.»
  _t=0.68 · emphasis · argi: goiko-kaba-zaina, bena-kardinal-komuna, aurreko-zain-kardinalak · arbelean: tz-goiko_
  - Ez dut ulertu: «Goiko kaba bi zatiz egina dago: eskuineko kardinal komuna eta eskuineko aurreko kardinalaren zati bat.»
  - **F** `w13/3.2/p3/s1` Sortu egingo da eskuineko kardinal komunetik eta eskuineko aurreko zain kardinalaren hurbileko ataletik.
  - **F** `w13/3.2/p11/s4` Beraz, goiko bena kabaren enborra eskuineko kardinal komunetik eta eskuineko aurreko kardinalaren hurbileko ataletik sortzen da.

8. «Hasierako atala eskuineko aurreko kardinaletik dator, eta bukaerakoa eskuineko kardinal komunetik.»
  _t=0.92 · argi: goiko-kaba-zaina, goiko-kabaren-hasierako-atala, goiko-kabaren-bukaerako-atala_
  - Ez dut ulertu: «Goiko kabaren lehen zatia aurreko kardinaletik dator, eta azkena kardinal komunetik.»
  - **F** `w13/3.2/p12/s1` ● Hasierako atala: eskuineko aurreko kardinaletik sortua.
  - **F** `w13/3.2/p13/s1` ● Bukaerazko atala: eskuineko kardinal komunetik sortuko da.

- Galdera (contrast): Ezkerreko zain brakiozefalikoa: nondik dator?
- Galdera (pool): w13-q-sinu-koronarioa

## 8. Jakin beharrekoa

Etapa: `laburpena` · 3 lerro · ~21 s hitz eginda

1. «Jakin beharrekoa: goiko kaba zainara bi zain brakiozefalikoak eta azigos zaina iristen dira.»
  _t=0.12 · emphasis · argi: goiko-kaba-zaina, zain-brakiozefalikoak, azigos-zaina · arbelean: b-goiko_
  - Ez dut ulertu: «Goiko kabara hiru zain heltzen dira: bi brakiozefalikoak eta azigos zaina.»
  - **F** `w13/3.2/p14/s1` JAKIN BEHARREKOA: Dauzkagun zainik garrantzitsuenak:
  - **F** `w13/3.2/p15/s1` ● Goiko bena kabak → iristen diren zainik garrantzitsuenak: ○ Eskuineko eta ezkerreko zain brakiozefalikoak.
  - **F** `w13/3.2/p15/s2` ○ Azigos zaina.

2. «Beheko kaba zainara beheko gorputz adarretako odol guztia iristen da: iliakoetatik, portatik eta abdomeneko erraietatik.»
  _t=0.36 · emphasis · argi: beheko-kaba-zaina, zain-iliako-primitiboak, porta-zaina · arbelean: b-beheko_
  - Ez dut ulertu: «Beheko kabara hanketako eta sabeleko odola heltzen da.»
  - **F** `w13/3.2/p16/s1` ● Beheko bena kabak: ○ Beheko gorputz-adarretako zain-odol guztia iristen da zain ezberdinen bitartez: iliakoak, porta, abdomeneko errai-ezberdinetatik datorrena…
  - **F** `w13/3.2/p17/s1` -------------

3. «Behin betiko beheko kabak hiru atal ditu: atal sakrokardinala, gibel atala eta giltzurrun atala.»
  _t=0.6 · argi: beheko-kaba-zaina, kabaren-segmentu-sakrokardinala, kabaren-gibel-segmentua, kabaren-giltzurrun-segmentua_
  - Ez dut ulertu: «Beheko kaba hiru zatiz osatuta dago, hiru jatorritatik.»
  - **F** `w13/3.2/p18/s1` ● Behin-betiko beheko bena kabaren atalak: ○ Atal sakrokardinala (honetatik ezkerreko eta eskuineko zain iliako primitiboak garatu) ○ Gibel atala (eskuineko hodi hepatotokardiakotik sortzen da) ○ Giltzurrun atala (eskuineko kardinal azpiko zainetik sorturikoa)

- Arbela `b-goiko`: Goiko kaba ← bi zain brakiozefalikoak + azigos zaina
  - **F** `w13/3.2/p15/s1` ● Goiko bena kabak → iristen diren zainik garrantzitsuenak: ○ Eskuineko eta ezkerreko zain brakiozefalikoak.
  - **F** `w13/3.2/p15/s2` ○ Azigos zaina.
- Arbela `b-beheko`: Beheko kaba ← beheko gorputz adarrak (iliakoak), porta, abdomeneko erraiak
  - **F** `w13/3.2/p16/s1` ● Beheko bena kabak: ○ Beheko gorputz-adarretako zain-odol guztia iristen da zain ezberdinen bitartez: iliakoak, porta, abdomeneko errai-ezberdinetatik datorrena…
- Galdera (contrast): Goiko eta beheko kaba zainak: zer iristen da bakoitzera?
- Galdera (fill): klasea:13/taula

## 9. Jaio aurreko zirkulazioa

Etapa: `jaio-aurretik` · 6 lerro · ~43 s hitz eginda

1. «Jaio baino lehen, karenako odol oxigenatua, %80koa, ezkerreko zilborreko zainetik itzultzen da.»
  _t=0.05 · emphasis · argi: karena, ezkerreko-zilbor-zaina · arbelean: b-fetua1_
  - Ez dut ulertu: «Fetuan, karenako odol ona ezkerreko zilborreko zainetik dator. Oso oxigenatuta dago.»
  - **F** `w13/4.1.1/p3/s1` Karenatik enbrioira itzultzen den odol oxigenatua (%80ko saturazioa) ezkerreko zilborreko zainaren bidez itzultzen da, zuzeneko konexioa (hodi benosoa) egiten duena beheko bena kabarekin.

2. «Hodi benosoak zilborreko odol hori zuzenean beheko kaba zainara eramaten du.»
  _t=0.2 · argi: hodi-benosoa, beheko-kaba-zaina_
  - Ez dut ulertu: «Hodi benosotik, odol hori beheko kabara pasatzen da.»
  - **F** `w13/4.1.1/p3/s1` Karenatik enbrioira itzultzen den odol oxigenatua (%80ko saturazioa) ezkerreko zilborreko zainaren bidez itzultzen da, zuzeneko konexioa (hodi benosoa) egiten duena beheko bena kabarekin.

3. «Bena portatik datorren oxigeno gutxiko odolarekin ere nahasten da, eta oxigenoa jaisten da.»
  _t=0.3 · argi: porta-zaina_
  - Ez dut ulertu: «Han, portako odol txarrarekin nahasten da, eta oxigeno gutxiago geratzen da.»
  - **F** `w13/4.1.1/p3/s5` Baita nahasten da bena portatik datorren (odol desoxigenatua) eta gibeletik pasatzen den odolarekin.
  - **F** `w13/4.1.1/p3/s6` Honen ondorioz, odolaren oxigeno kontzentrazioa jeisten da.

4. «Odol nahastu hori eskuineko aurikulara iristen da, eta gehiena, ez osoa, zulo obaletik ezkerreko aurikulara pasatzen da.»
  _t=0.37 · emphasis · argi: eskuineko-aurikula, zulo-obala, ezkerreko-aurikula-jaiotakoan_
  - Ez dut ulertu: «Odola eskuineko aurikulara heltzen da, eta gehiena zulo obaletik ezkerrera pasatzen da.»
  - **F** `w13/4.1.1/p3/s7` Nahastutako odol hori eskuineko aurikulara iristen da beheko bena kabaren bidez, eta ondoren, odol-kopururik handiena (ez osoa), aurikula arteko trenkadatik igaroz, ezkerreko aurikulara iristen da zulo obala zeharkatuz.

5. «Biriketan erresistentzia handia dago. Horregatik, odol gehiena hodi arteriosotik pasatzen da, eta ez biriketatik.»
  _t=0.72 · emphasis · argi: birikak, hodi-arteriosoa · arbelean: b-fetua2_
  - Ez dut ulertu: «Fetuaren birikak itxita bezala daude. Odolak hodi arteriosotik egiten du ihes.»
  - **F** `w13/4.1.2/p3/s4` Jaioaurretik eskumako biriketan erresistentzia (odol hodietan) handia dago.
  - **F** `w13/4.1.2/p3/s5` Beraz, odola neurri txiki batean biriketara helduko da, baina batez ere odol hori hodi arteriosoa erabiliz pasatzen da aortara eta nahasten da aortatik jeisten den odolarekin.

6. «Zilborreko arterietako odolaren saturazioa askoz baxuagoa da, %58 ingurukoa, eta karenara itzultzen da oxigenatzeko.»
  _t=0.88 · argi: zilbor-arteriak, karena_
  - Ez dut ulertu: «Zilborreko arterietatik doan odolak oxigeno gutxiago du, eta karenara itzultzen da berriz kargatzeko.»
  - **F** `w13/4.1.2/p3/s8` Hori dela eta, zilborreko arteriatik (aortaren aurreko paretatik sortuak) doan odolaren oxigeno saturazioa askoz baxuagoa da, gutxi gora behera %58 ingurukoa (pixka bat gutxiago).
  - **F** `w13/4.1.2/p3/s9` Beraz, zilborreko arteria hauetatik doan odola karenara abiatzen da berriz oxigenatzeko.

- Arbela `b-fetua1`: Ezkerreko zilborreko zaina (%80) → hodi benosoa → beheko kaba → eskuineko aurikula → zulo obala → ezkerreko aurikula
  - **F** `w13/4.1.1/p3/s1` Karenatik enbrioira itzultzen den odol oxigenatua (%80ko saturazioa) ezkerreko zilborreko zainaren bidez itzultzen da, zuzeneko konexioa (hodi benosoa) egiten duena beheko bena kabarekin.
  - **F** `w13/4.1.1/p3/s7` Nahastutako odol hori eskuineko aurikulara iristen da beheko bena kabaren bidez, eta ondoren, odol-kopururik handiena (ez osoa), aurikula arteko trenkadatik igaroz, ezkerreko aurikulara iristen da zulo obala zeharkatuz.
- Arbela `b-fetua2`: Biriketan erresistentzia handia: odol gehiena hodi arteriosotik aortara
  - **F** `w13/4.1.2/p3/s4` Jaioaurretik eskumako biriketan erresistentzia (odol hodietan) handia dago.
  - **F** `w13/4.1.2/p3/s5` Beraz, odola neurri txiki batean biriketara helduko da, baina batez ere odol hori hodi arteriosoa erabiliz pasatzen da aortara eta nahasten da aortatik jeisten den odolarekin.
- Galdera (contrast): Zilborreko zaina eta zilborreko arteriak: zer saturazio?
- Galdera (pool): mikro:13/jaio-aurretik:4
- Galdera (pool): w13-q-hodi-arteriosoa

## 10. Jaiotzako aldaketak

Etapa: `jaiotza` · 9 lerro · ~51 s hitz eginda

1. «Jaiotza momentuan birika zirkulazioa hasten da.»
  _t=0.05 · emphasis · argi: birikak_
  - Ez dut ulertu: «Jaiotzean, birikak lanean hasten dira.»
  - **F** `w13/4.2/p3/s1` Jaiotza momentuan birika zirkulazioa hasten da.

2. «Zilborreko arteriak ixten dira. Urrutiko atala zilborreko erdialdeko lotailuak bihurtzen da, fibrosiaren ondorioz.»
  _t=0.25 · argi: zilbor-arteriak, erdialdeko-zilbor-lotailua_
  - Ez dut ulertu: «Zilborreko arteriak itxi egiten dira. Mutur urruna lotailu bihurtzen da.»
  - g `w13/4.2/p3/s2` Jaiotzaren 2-3 minutuetara, zilborreko arterien paretetan dauden muskulu lisoak uzkurtu egiten dira, zilborreko arteriak itxiz.
  - **F** `w13/4.2/p4/s1` ● Urrutiko atala: zilborreko erdialdeko lotailuak bihurtuko dira, fibrosi prozesu baten ondorioz (jaio osteko hurrengo hilabeteetan gertatzen dena).

3. «Hurbileko atala irekita geratzen da: goiko gernu maskuriaren arteriak, barneko arteria iliakoen zatiak.»
  _t=0.35 · argi: goiko-gernu-maskuri-arteria, barneko-arteria-iliakoa · arbelean: b-zilborart_
  - Ez dut ulertu: «Hurbileko zatia irekita geratzen da, eta arteria izaten jarraitzen du.»
  - **F** `w13/4.2/p5/s1` ● Hurbileko atala: Permeable mantentzen dira eta bertatik goiko gernu maskuriaren arteriak eratuko dira, barneko arteria iliakoen zatiak direnak.

4. «Ezkerreko zilborreko zaina gibeleko lotailu borobila bihurtzen da.»
  _t=0.45 · argi: gibeleko-lotailu-borobila_
  - Ez dut ulertu: «Zilborreko zaina lotailu bat bihurtzen da: gibeleko lotailu borobila.»
  - **F** `w13/4.2/p6/s1` ● Ezkerreko zilborreko zaina → gibeleko lotailu borobila.

5. «Hodi benosoa gibeleko lotailu benosoa bihurtzen da.»
  _t=0.55 · argi: gibeleko-lotailu-benosoa_
  - Ez dut ulertu: «Hodi benosoa ere lotailu bihurtzen da.»
  - **F** `w13/4.2/p7/s1` ● Hodi benosoa → gibeleko lotailu benosoa.

6. «Hodi arteriosoa ere ixten da, 2 edo 3 hilabete geroago, eta lotailu arteriosoa bihurtzen da.»
  _t=0.65 · argi: lotailu-arteriosoa_
  - Ez dut ulertu: «Hodi arteriosoa hilabete batzuk geroago ixten da, eta lotailu bihurtzen da.»
  - **F** `w13/4.2/p7/s2` (gibelaren azalean) Hodi arteriosoa ere itxi egiten da eta lotailu arteriosoa bihurtzen da, hurrengo hilabeteetan (2-3 hilabete beranduago).

7. «Horrela, birika arteriaren eta aortaren arteko komunikazioa eteten da.»
  _t=0.67 · argi: birika-arteria_
  - Ez dut ulertu: «Birika arteriaren eta aortaren arteko bidea mozten da.»
  - **F** `w13/4.2/p7/s3` Ondorioz, birika arteriaren eta aortaren arteko komunikazioa eten egiten da.

8. «Jaio ostean ezkerreko aurikularen presioa handitzen da, eta zulo obalaren balbula septum secundumaren aurka estutzen da.»
  _t=0.75 · emphasis · argi: ezkerreko-aurikula-jaiotakoan, zulo-obalaren-balbula, septum-secundum · arbelean: b-fo_
  - Ez dut ulertu: «Ezkerreko aurikulan presioa igotzen da, eta balbula itxi egiten da.»
  - **F** `w13/4.2/p7/s4` Aurikula arteko trenkadan (bertan dagoen zulo obala ixten da) gertatzen den ibilbidearen itxiera ere ematen da: jaio ostean, birika zirkulazioa hastean ezkerreko aurikularen presioa zeharo handitzen da (odol oxigenatua heltzen baita ezkerreko aurikulara), Septum Sekundum-aren aurka, zulo obalaren balbula bultzatuz (Septum Primum-aren beheko aldetik sortutako zuloa).

9. «Hala ere, kasuen %20an komunikazioa iragazkor geratzen da: odol apur bat pasa daiteke.»
  _t=0.93 · argi: zulo-obala_
  - Ez dut ulertu: «Bost pertsonatik batengan zulo txiki bat geratzen da.»
  - **F** `w13/4.2/p7/s7` Hala ere, kasuen %20an komunikazioa iragazkor mantentzen da, hau da, odola apur bat pasa daiteke eskumako aurikulatik ezkerreko aurikulara (oso kopuru txikia).

- Arbela `b-zilborart`: Zilborreko arteriak: urrutikoa → erdialdeko zilbor lotailuak; hurbilekoa → goiko gernu maskuriaren arteriak
  - **F** `w13/4.2/p4/s1` ● Urrutiko atala: zilborreko erdialdeko lotailuak bihurtuko dira, fibrosi prozesu baten ondorioz (jaio osteko hurrengo hilabeteetan gertatzen dena).
  - **F** `w13/4.2/p5/s1` ● Hurbileko atala: Permeable mantentzen dira eta bertatik goiko gernu maskuriaren arteriak eratuko dira, barneko arteria iliakoen zatiak direnak.
- Arbela `b-fo`: Ezkerreko aurikularen presioa ↑: zulo obalaren balbula septum secundumaren aurka; %20an iragazkor
  - **F** `w13/4.2/p7/s4` Aurikula arteko trenkadan (bertan dagoen zulo obala ixten da) gertatzen den ibilbidearen itxiera ere ematen da: jaio ostean, birika zirkulazioa hastean ezkerreko aurikularen presioa zeharo handitzen da (odol oxigenatua heltzen baita ezkerreko aurikulara), Septum Sekundum-aren aurka, zulo obalaren balbula bultzatuz (Septum Primum-aren beheko aldetik sortutako zuloa).
  - **F** `w13/4.2/p7/s7` Hala ere, kasuen %20an komunikazioa iragazkor mantentzen da, hau da, odola apur bat pasa daiteke eskumako aurikulatik ezkerreko aurikulara (oso kopuru txikia).
- Galdera (contrast): Zilborreko arterien bi atalak: zer bihurtzen dira?
- Galdera (pool): w13-q-lotailu-borobila

## 11. Jaio osteko zirkulazioa

Etapa: `jaio-ondoren` · 4 lerro · ~31 s hitz eginda

1. «Jaio ondoren, zain odol guztia goiko eta beheko kaba zainen bidez eskuineko aurikulara iristen da.»
  _t=0.06 · argi: goiko-kaba-zaina, beheko-kaba-zaina, eskuineko-aurikula_
  - Ez dut ulertu: «Gorputzeko zain odola bi kaba zainetatik eskuineko aurikulara heltzen da.»
  - **F** `w13/4.3/p3/s1` Gure gorputzaren zain-odol guztia goiko eta beheko bena kaben bitartez eskuineko aurikulara iristen da.

2. «Biriketan oxigenatuta, odola lau birika zainetatik ezkerreko aurikulara itzultzen da, eta ezkerreko bentrikulura pasatzen da.»
  _t=0.4 · argi: birikak, birika-zainak, ezkerreko-aurikula-jaiotakoan, ezkerreko-bentrikulua_
  - Ez dut ulertu: «Biriketako odol ona birika zainetatik ezkerreko bihotzera itzultzen da.»
  - **F** `w13/4.3/p3/s4` Behin oxigenatuta, odol hori ezkerreko aurikulara itzultzen da dauzkagun 4 birika zainen bitartez, eta bertatik odol oxigenatua ezkerreko bentrikulura iristen da ezkerreko zulo aurikulobentrikularretik igaro ondoren.

3. «Aortaren irteeran balbula bat dago, hiru balboz osatua; alboko poltsatxoak Valsalvaren sinuak dira.»
  _t=0.62 · emphasis · argi: aorta-balbula, valsalva-sinuak · arbelean: b-valsalva_
  - Ez dut ulertu: «Aortaren hasieran hiru atal dituen balbula bat dago. Atal bakoitzaren ondoan poltsatxo bat dago: Valsalvaren sinuak.»
  - **F** `w13/4.3/p4/s1` Aortaren irteeran balbula bat dago, 3 balbez osatua: alboko balbula horiek Valsalva sinuak dira.

4. «Sinu horien paretetatik arteria koronarioak irteten dira; aorta makotik, arteria brakiozefalikoa eta ezkerreko karotida komuna.»
  _t=0.72 · argi: arteria-koronarioak, aortaren-makoa, enbor-brakiozefalikoa, karotida-komuna_
  - Ez dut ulertu: «Sinu horietatik bihotzaren arteriak ateratzen dira. Aorta makotik, buruko eta besoko arteriak.»
  - **F** `w13/4.3/p4/s2` Horietako paretetatik arteria koronarioak irteten dira (eskuinekoa eta ezkerrekoa) eta aorta makotik, aldiz, arteria brankiozefalikoak eta ezkerreko arteria karotida komuna.

- Arbela `b-valsalva`: Aortaren balbula: 3 balbo; Valsalvaren sinuak → arteria koronarioak
  - **F** `w13/4.3/p4/s1` Aortaren irteeran balbula bat dago, 3 balbez osatua: alboko balbula horiek Valsalva sinuak dira.
  - **F** `w13/4.3/p4/s2` Horietako paretetatik arteria koronarioak irteten dira (eskuinekoa eta ezkerrekoa) eta aorta makotik, aldiz, arteria brankiozefalikoak eta ezkerreko arteria karotida komuna.
- Galdera (contrast): Fetuan eta jaio ondoren: nora doa beheko kabatik eskuineko aurikulara heltzen den odol gehiena?
- Galdera (pool): mikro:13/jaio-ondoren:4

## 12. Linfa sistema

Etapa: `linfa` · 9 lerro · ~56 s hitz eginda

1. «Azkenik, linfa sistema: linfa zakuak eta linfa hodiak alboko mesodermoaren errai orritik garatzen dira.»
  _t=0.06 · argi: linfa-hodiak_
  - Ez dut ulertu: «Linfa sistemaren zakuak eta hodiak mesodermoaren geruza batetik sortzen dira.»
  - **F** `w13/5/p3/s1` Sistema linfatikoaren egiturak (linfa eramaten dituztenak), hau da, linfa zakuak eta linfa hodiak, alboko mesodermoaren errai orritik garatzen dira.

2. «Buruko, lepoko, enborreko eta goiko gorputz adarretako linfa hodiak bi linfa zaku yugularretara iristen dira.»
  _t=0.16 · argi: linfa-hodiak, linfa-zaku-yugularrak_
  - Ez dut ulertu: «Gorputzaren goiko aldeko linfa lepoko bi zakuetara heltzen da.»
  - **F** `w13/5/p3/s2` Hasiera batean, gure gorputzaren eskualde ezberdinetan sortzen den linfa linfa-hodien bidez garraiatzen da, hau da, buruko, lepoko, enborreko eta goiko gorputz-adarretako hodi linfatikoen bidez.
  - g `w13/5/p3/s3` Hodi horiek yugular inguruan kokatzen diren linfa-zaku yugularretara (bi dira) iristen dira.

3. «Abdomenean, berriz, lau linfa zaku daude. Lehena, peritoneo atzeko linfa zakua, peritoneoaren atzekaldean.»
  _t=0.35 · argi: peritoneo-atzeko-linfa-zakua_
  - Ez dut ulertu: «Sabelean lau zaku daude. Lehena peritoneoaren atzean dago.»
  - g `w13/5/p3/s4` Bestalde, abdomenean beste linfa zaku ezberdinak agertzen dira zeintzuetara beheko gorputz adarretako eta abdomeneko hodi linfatikoak heltzen diren, 4 linfa zaku dira:
  - **F** `w13/5/p4/s1` - Peritoneo atzeko linfa zakua (peritoneoaren atzekaldean)

4. «Kiloren zisterna, Pecquet zisterna ere deitua: abdomenean dago, eta garrantzitsuena da.»
  _t=0.45 · emphasis · argi: kiloren-zisterna · arbelean: b-zisterna_
  - Ez dut ulertu: «Bigarrena kiloren zisterna da, sabeleko zaku nagusia.»
  - **F** `w13/5/p5/s1` - Kiloren zisterna/ Pecquet zisterna (abdomenean eta garrantzitsuena)

5. «Eta bi atzeko linfa zaku, barneko eta kanpoko zain iliakoak batzen diren tokian.»
  _t=0.55 · argi: atzeko-linfa-zakuak, kanpoko-zain-iliakoak, barneko-zain-iliakoak_
  - Ez dut ulertu: «Azkenik, bi zaku pelbisean, zain iliakoak elkartzen diren tokian.»
  - **F** `w13/5/p6/s1` - 2 Atzeko linfa zakuak: eskumakoa eta ezkerrekoa.
  - **F** `w13/5/p6/s2` (barneko eta kanpoko zain iliakoak batzen diren eskualdeetan kokatzen dira) Linfa-zaku guztietara iristen den linfa, ondoren, kiloren zisternara bideratzen da, eta bertatik bi linfa-hodi nagusi hasten dira gorantz: hodi toraxikoak.

6. «Linfa guztia kiloren zisternara doa, eta hortik bi hodi toraxiko igotzen dira.»
  _t=0.66 · argi: kiloren-zisterna, hodi-toraxikoa_
  - Ez dut ulertu: «Zaku guztietako linfa zisternara biltzen da, eta hortik bi hodi igotzen dira.»
  - **F** `w13/5/p6/s2` (barneko eta kanpoko zain iliakoak batzen diren eskualdeetan kokatzen dira) Linfa-zaku guztietara iristen den linfa, ondoren, kiloren zisternara bideratzen da, eta bertatik bi linfa-hodi nagusi hasten dira gorantz: hodi toraxikoak.

7. «Garapenean, bakarra mantentzen da: toraxeko linfa hodia.»
  _t=0.75 · argi: hodi-toraxikoa_
  - Ez dut ulertu: «Bi hodi horietatik bat bakarrik geratzen da.»
  - g `w13/5/p6/s3` Garapenaren ondorioz, hodi horietatik bat bakarrik mantentzen da (toraxeko linfa hodia).

8. «Hodi toraxikoak diafragma zeharkatzen du, mediastinotik igotzen da eta ezkerrerantz jotzen du, ezkerreko lotura yugulosubklabikoraino.»
  _t=0.86 · emphasis · argi: hodi-toraxikoa, diafragma, lotura-yugulosubklabikoa · arbelean: b-toraxikoa_
  - Ez dut ulertu: «Hodi toraxikoa diafragmatik igarotzen da, bularrean gora doa, eta ezkerreko lepoan zain odolera sartzen da.»
  - **F** `w13/5/p6/s4` Hodi toraxikoak diafragma zeharkatu, mediastinotik gora egiten du eta ezkerrerantz jotzen du, ezkerreko lotura yugulosubklabikoarekin bat egiteko eta bertan ireki dadin.

9. «Lotura hori ezkerreko zain yugularra eta ezkerreko subklabioa elkartzen diren puntua da.»
  _t=0.95 · argi: zain-subklabioak_
  - Ez dut ulertu: «Puntu hori lepoko zaina eta besoko zaina elkartzen diren tokia da.»
  - g `w13/5/p6/s5` Lotura yugulosubklabikoa ezkerreko zain yugularra eta ezkerreko zain subklabia elkartzen diren puntua da.

- Arbela `b-zisterna`: Kiloren (Pecquet) zisterna: abdomeneko linfa zakurik garrantzitsuena
  - **F** `w13/5/p5/s1` - Kiloren zisterna/ Pecquet zisterna (abdomenean eta garrantzitsuena)
- Arbela `b-toraxikoa`: Hodi toraxikoa: kiloren zisterna → diafragma → mediastinoa → ezkerreko lotura yugulosubklabikoa
  - **F** `w13/5/p6/s2` (barneko eta kanpoko zain iliakoak batzen diren eskualdeetan kokatzen dira) Linfa-zaku guztietara iristen den linfa, ondoren, kiloren zisternara bideratzen da, eta bertatik bi linfa-hodi nagusi hasten dira gorantz: hodi toraxikoak.
  - **F** `w13/5/p6/s4` Hodi toraxikoak diafragma zeharkatu, mediastinotik gora egiten du eta ezkerrerantz jotzen du, ezkerreko lotura yugulosubklabikoarekin bat egiteko eta bertan ireki dadin.
- Galdera (contrast): Hodi toraxikoa: non hasten eta non irekitzen da?
- Galdera (pool): mikro:13/linfa:0

## 13. Laburpena

Etapa: `laburpena` · 3 lerro · ~19 s hitz eginda

1. «Gogoratu: hiru zain bikote, eta anastomosien bidez ezkerreko odola eskuinera pasatzen da.»
  _t=0.7 · summary_
  - Ez dut ulertu: «Laburpena: hiru zain mota, eta odola ezkerretik eskuinera.»
  - **F** `w13/1/p3/s1` Garapenaren 5. astean, enbrioiaren zain sinura 3 motako zain ezberdinak iristen dira, bikoitzak guztiak (eskumakoa eta ezkerrekoa dute):
  - **F** `w13/3/p7/s1` Gogoratu, zain sistemaren garapenean gertatzen den prozesu garrantzitsuenetarikoa dela ezkerreko zainetik doan odola eskumako zainetara pasatzen dela.

2. «Fetuan, odol oxigenatua zilborreko zainetik dator, eta zulo obaletik eta hodi arteriosotik ihes egiten du.»
  _t=0.7 · summary_
  - Ez dut ulertu: «Fetuan bi lasterbide daude, eta jaiotzean ixten dira.»
  - **F** `w13/4.1.1/p3/s1` Karenatik enbrioira itzultzen den odol oxigenatua (%80ko saturazioa) ezkerreko zilborreko zainaren bidez itzultzen da, zuzeneko konexioa (hodi benosoa) egiten duena beheko bena kabarekin.
  - **F** `w13/4.1.1/p3/s7` Nahastutako odol hori eskuineko aurikulara iristen da beheko bena kabaren bidez, eta ondoren, odol-kopururik handiena (ez osoa), aurikula arteko trenkadatik igaroz, ezkerreko aurikulara iristen da zulo obala zeharkatuz.
  - **F** `w13/4.1.2/p3/s5` Beraz, odola neurri txiki batean biriketara helduko da, baina batez ere odol hori hodi arteriosoa erabiliz pasatzen da aortara eta nahasten da aortatik jeisten den odolarekin.

3. «Eta linfa guztia hodi toraxikotik ezkerreko lotura yugulosubklabikora itzultzen da.»
  _t=0.7 · summary_
  - Ez dut ulertu: «Linfa, azkenean, zain odolera itzultzen da.»
  - **F** `w13/5/p6/s4` Hodi toraxikoak diafragma zeharkatu, mediastinotik gora egiten du eta ezkerrerantz jotzen du, ezkerreko lotura yugulosubklabikoarekin bat egiteko eta bertan ireki dadin.

- Galdera (pool): w13-q-gibel-segmentua
- Galdera (pool): w13-q-zulo-obala
- Galdera (pool): w13-q-hodi-toraxikoa

## Estaldura

- Funtsezko esaldiak: 103 / 202; klaseak esaten ditu: 103.
- Klaseak aipatzen dituen esaldi guztiak: 109.
- Hitz egiteko denbora: ~9 min (galderak aparte).
