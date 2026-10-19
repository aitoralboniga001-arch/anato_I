# 7. gaiko klasea: iturriak

_Sortua: `npx tsx scripts/klasea/audit.ts 7`. F = funtsezkoa, g = garrantzitsua._

## 0. Gaur

Etapa: `zeloma` · 4 lerro · ~24 s hitz eginda

1. «Kaixo! Gaur gorputzaren barrunbeak ikasiko ditugu: nondik datozen, nola banatzen diren, eta diafragma nola sortzen den.»
  _t=0_
  - Ez dut ulertu: «Gaurko gaia: gorputzaren barruko hutsuneak. Nondik datozen, nola zatitzen diren, eta diafragma nola sortzen den.»
  - **F** `w7/1/p3/s1` Garapenaren 3. astearen bukaeran, enbrioiaren tolespenengatik, laua den diskoa tolestu egiten da enbrioiaren atzeko, aurreko eta alboko paretak eratzeko.

2. «3. astearen bukaeran enbrioia disko laua da, eta tolestu egiten da.»
  _t=0 · recall_
  - Ez dut ulertu: «3. astearen bukaeran enbrioia disko lau bat da. Orduan tolesten hasten da, paper bat bezala.»
  - **F** `w7/1/p3/s1` Garapenaren 3. astearen bukaeran, enbrioiaren tolespenengatik, laua den diskoa tolestu egiten da enbrioiaren atzeko, aurreko eta alboko paretak eratzeko.

3. «Tolespen horiei esker sortzen dira enbrioiaren atzeko, aurreko eta alboko paretak.»
  _t=0 · why · arbelean: b-tolespena_
  - Ez dut ulertu: «Tolestean, diskoak gorputz baten paretak eratzen ditu: atzekoa, aurrekoa eta alboetakoak.»
  - **F** `w7/1/p3/s1` Garapenaren 3. astearen bukaeran, enbrioiaren tolespenengatik, laua den diskoa tolestu egiten da enbrioiaren atzeko, aurreko eta alboko paretak eratzeko.

4. «Enbrioi barruko mesodermoak hiru atal ditu: mesodermo paraxiala, bitarteko mesodermoa eta alboko mesodermoa.»
  _t=0 · recall · argi: somitak, bitarteko-mesodermoa, alboko-mesodermoa_
  - Ez dut ulertu: «Mesodermoak hiru zati ditu: paraxiala, somitak sortzen dituena, bitarteko mesodermoa eta alboko mesodermoa.»
  - g `w7/1/p4/s1` Gainera, enbrioi barruko mesodermoak hiru atal nagusi ditu: mesodermo paraxiala, bitarteko mesodermoa eta alboko mesodermoa.

- Arbela `b-tolespena`: Tolespenak (3. astearen bukaera): atzeko, aurreko eta alboko paretak
  - **F** `w7/1/p3/s1` Garapenaren 3. astearen bukaeran, enbrioiaren tolespenengatik, laua den diskoa tolestu egiten da enbrioiaren atzeko, aurreko eta alboko paretak eratzeko.
- Galdera (predict): Zer uste duzu: tolestu ondoren, zer geratuko da enbrioiaren barruan?

## 1. Bi orri eta zeloma

Etapa: `zeloma` · 4 lerro · ~27 s hitz eginda

1. «Alboko mesodermotik bi orri bereizten dira: paretako orria, edo somatopleura, eta errai orria, edo esplaknopleura.»
  _t=0.18 · emphasis · argi: alboko-mesodermoa, paretako-orria, errai-orria · arbelean: b-orriak_
  - Ez dut ulertu: «Alboko mesodermoa bitan zatitzen da. Kanpoko orria paretako orria da; barnekoa, errai orria.»
  - **F** `w7/1/p4/s2` Alboko mesodermotik 2 orri bereizten dira: paretako orria (somatopleura) eta errai orria (esplaknopleura).

2. «Bi orri horien artean geratzen den espazioari enbrioi barruko zeloma deritzogu.»
  _t=0.18 · argi: enbrioi-barruko-zeloma_
  - Ez dut ulertu: «Bi orrien artean hutsune bat geratzen da. Hutsune hori da enbrioi barruko zeloma.»
  - g `w7/1/p4/s3` Bi orri hauen artean dagoen espazioari enbrioi barruko zeloma deritzogu.

3. «Beraz, zeloma ez da ehun bat: hutsune bat da, bi orri horiek mugatzen dutena.»
  _t=0.18 · why_
  - Ez dut ulertu: «Kontuz: zeloma ez da ehuna. Bi orrien arteko tartea da, poltsa baten barrualdea bezala.»
  - g `w7/1/p4/s3` Bi orri hauen artean dagoen espazioari enbrioi barruko zeloma deritzogu.

4. «Hasieran zeloma hori jarraia da enbrioi kanpoko zelomarekin, hau da, korion barrunbearekin.»
  _t=0.36 · argi: enbrioi-barruko-zeloma, korion-barrunbea · arbelean: b-jarraia_
  - Ez dut ulertu: «Hasieran zeloma ez dago itxita: ertzetan zabalik dago, eta korion barrunbearekin bat egiten du.»
  - **F** `w7/1/p4/s4` Hasieran, barrunbe hau jarraia da enbrioi kanpoko zelomarekin (korion barrunbea).

- Arbela `b-orriak`: Alboko mesodermoa: paretako orria (somatopleura) eta errai orria (esplaknopleura); tartean, zeloma
  - **F** `w7/1/p4/s2` Alboko mesodermotik 2 orri bereizten dira: paretako orria (somatopleura) eta errai orria (esplaknopleura).
  - g `w7/1/p4/s3` Bi orri hauen artean dagoen espazioari enbrioi barruko zeloma deritzogu.
- Arbela `b-jarraia`: Hasieran zeloma jarraia da korion barrunbearekin (enbrioi kanpoko zeloma)
  - **F** `w7/1/p4/s4` Hasieran, barrunbe hau jarraia da enbrioi kanpoko zelomarekin (korion barrunbea).
- Galdera (pool): mikro:7/zeloma:1
- Galdera (contrast): Somatopleura eta esplaknopleura: zein da zein?

## 2. Zeloma ixten da

Etapa: `zeloma` · 5 lerro · ~37 s hitz eginda

1. «Diskoak bi tolespen mota egiten ditu. Zeharkako tolespenean alboko ertzak aurrerantz eta erdikalderantz mugitzen dira.»
  _t=0.52 · emphasis · argi: tolestura-laterala · arbelean: b-bi-tolespen_
  - Ez dut ulertu: «Lehen tolespena zeharkakoa da: diskoaren bi ertzak aurrera eta erdirantz okertzen dira.»
  - **F** `w7/1/p4/s5` Hala ere, diskoak bi tolespen mota egiten ditu: zeharkakoa (alboko ertzak aurrerantz eta erdikalderantz mugitzen dira) eta zefalokaudala (alde zefalikoa eta alde kaudala aurrerantz abiatzen dira).

2. «Tolespen hauen ondorioz, enbrioi barruko zeloma gorputzaren barnealdean geratzen da.»
  _t=0.7 · emphasis · argi: enbrioi-barruko-zeloma · arbelean: b-itxita_
  - Ez dut ulertu: «Tolestu ondoren, zeloma gorputzaren barruan itxita geratzen da, poltsa baten barruan bezala.»
  - **F** `w7/1/p4/s6` Tolespen hauen ondorioz, pareta-orria eta errai-orriaren artean dagoen espazioa, hau da, enbrioi barruko zeloma, enbrioi gorputzaren barnealdean gelditzen da, enbrioi kanpoko zelomatik guztiz isolatuta.

3. «Eta enbrioi kanpoko zelomatik guztiz isolatuta geratzen da.»
  _t=0.7 · argi: korion-barrunbea_
  - Ez dut ulertu: «Korion barrunbearekin zuen lotura galtzen du: orain bi barrunbeak bereizita daude.»
  - **F** `w7/1/p4/s6` Tolespen hauen ondorioz, pareta-orria eta errai-orriaren artean dagoen espazioa, hau da, enbrioi barruko zeloma, enbrioi gorputzaren barnealdean gelditzen da, enbrioi kanpoko zelomatik guztiz isolatuta.

4. «Albotik ikusita, beste tolespena: zefalokaudalean alde zefalikoa eta alde kaudala aurrerantz abiatzen dira.»
  _t=0.86_
  - Ez dut ulertu: «Albotik begiratuta beste tolespena ikusten da: buruaren muturra eta isatsaren muturra aurrera okertzen dira.»
  - **F** `w7/1/p4/s5` Hala ere, diskoak bi tolespen mota egiten ditu: zeharkakoa (alboko ertzak aurrerantz eta erdikalderantz mugitzen dira) eta zefalokaudala (alde zefalikoa eta alde kaudala aurrerantz abiatzen dira).

5. «Sortutako zeloma gorputzaren barnean hedatzen da, geroko toraxetik abdomenera.»
  _t=0.93 · emphasis · argi: enbrioi-barruko-zeloma · arbelean: b-bakarra_
  - Ez dut ulertu: «Zeloma hori barrunbe bakarra da, luzea: gero toraxa izango denetik abdomenera iristen da.»
  - **F** `w7/1/p4/s7` Sortutako enbrioi barruko zeloma hori gorputzaren barnean hedatzen da geroago izango den toraxetik abdomenera.

- Arbela `b-bi-tolespen`: Bi tolespen: zeharkakoa (ertzak aurrera eta erdirantz) eta zefalokaudala
  - **F** `w7/1/p4/s5` Hala ere, diskoak bi tolespen mota egiten ditu: zeharkakoa (alboko ertzak aurrerantz eta erdikalderantz mugitzen dira) eta zefalokaudala (alde zefalikoa eta alde kaudala aurrerantz abiatzen dira).
- Arbela `b-itxita`: Tolestu ondoren: zeloma gorputz barruan, korion barrunbetik isolatuta
  - **F** `w7/1/p4/s6` Tolespen hauen ondorioz, pareta-orria eta errai-orriaren artean dagoen espazioa, hau da, enbrioi barruko zeloma, enbrioi gorputzaren barnealdean gelditzen da, enbrioi kanpoko zelomatik guztiz isolatuta.
- Arbela `b-bakarra`: Zeloma: barrunbe bakarra, geroko toraxetik abdomenera
  - **F** `w7/1/p4/s7` Sortutako enbrioi barruko zeloma hori gorputzaren barnean hedatzen da geroago izango den toraxetik abdomenera.
- Galdera (pool): mikro:7/zeloma:4
- Galdera (contrast): Zeloma hasieran eta tolestu ondoren: nolakoa da?

## 3. Septum transversuma

Etapa: `septum-transversum` · 5 lerro · ~26 s hitz eginda

1. «Zeloma barrunbe bakarra da, toraxetik abdomenera. Orain bitan banatuko da.»
  _t=0 · recall · argi: enbrioi-barruko-zeloma_
  - Ez dut ulertu: «Gogoratu: zeloma hutsune luze bakarra da. Orain horma batek bitan zatituko du.»
  - **F** `w7/1/p4/s7` Sortutako enbrioi barruko zeloma hori gorputzaren barnean hedatzen da geroago izango den toraxetik abdomenera.

2. «4. astean, lepo mailan, trenkada horizontal bat garatzen da: septum transversuma.»
  _t=0.14 · emphasis · argi: septum-transversum_
  - Ez dut ulertu: «4. astean horma lau bat sortzen da, etzanda, lepoaren parean. Horma horri septum transversuma deitzen zaio.»
  - **F** `w7/2/p3/s1` Garapenaren 4.astean, lepo mailan horizontala den trenkada bat garatzen da: Septum Transversum izenekoa, 3º, 4º eta 5º lepo somita mailetan (C3-C4-C5 mailetan) agertzen dena.

3. «3., 4. eta 5. lepo somiten mailan agertzen da: C3, C4 eta C5. Oso altu.»
  _t=0.14 · emphasis · argi: septum-transversum, somitak · arbelean: b-septum_
  - Ez dut ulertu: «Lepoko hirugarren, laugarren eta bosgarren somiten parean agertzen da. Oso altu, beraz.»
  - **F** `w7/2/p3/s1` Garapenaren 4.astean, lepo mailan horizontala den trenkada bat garatzen da: Septum Transversum izenekoa, 3º, 4º eta 5º lepo somita mailetan (C3-C4-C5 mailetan) agertzen dena.

4. «Septum horrek zeloma bitan banatzen du. Goiko atala hasierako perikardio barrunbea da, torax barrunbe osoa betetzen duena.»
  _t=0.3 · emphasis · argi: septum-transversum, hasierako-perikardio-barrunbea_
  - Ez dut ulertu: «Horma horrek zeloma bitan zatitzen du. Goiko zatia hasierako perikardio barrunbea da: torax osoa hartzen du.»
  - **F** `w7/2/p5/s1` Septum transversum izeneko egitura honen agerpenarekin, goitik behera hedatzen den enbrioi barruko zeloma hori bitan bananduta gelditzen da: goiko atala hasierako perikardio barrunbea da, torax barrunbe osoa okupatzen duena.

5. «Septumaren azpian geratzen den atala, berriz, peritoneo barrunbea da.»
  _t=0.3 · emphasis · argi: peritoneo-barrunbea · arbelean: b-bi-barrunbe_
  - Ez dut ulertu: «Hormaren azpian geratzen den zatia, berriz, peritoneo barrunbea da.»
  - **F** `w7/2/p5/s2` Septum Transversum honen azpian geratzen den enbrioi barruko zelomaren atala peritoneo barrunbea da.

- Arbela `b-septum`: Septum transversuma: 4. astea, C3–C5 (lepo mailan)
  - **F** `w7/2/p3/s1` Garapenaren 4.astean, lepo mailan horizontala den trenkada bat garatzen da: Septum Transversum izenekoa, 3º, 4º eta 5º lepo somita mailetan (C3-C4-C5 mailetan) agertzen dena.
- Arbela `b-bi-barrunbe`: Gainean hasierako perikardio barrunbea (torax osoa); azpian peritoneo barrunbea
  - **F** `w7/2/p5/s1` Septum transversum izeneko egitura honen agerpenarekin, goitik behera hedatzen den enbrioi barruko zeloma hori bitan bananduta gelditzen da: goiko atala hasierako perikardio barrunbea da, torax barrunbe osoa okupatzen duena.
  - **F** `w7/2/p5/s2` Septum Transversum honen azpian geratzen den enbrioi barruko zelomaren atala peritoneo barrunbea da.
- Galdera (pool): mikro:7/septum-transversum:1
- Galdera (contrast): Septum transversumaren goiko eta beheko atalak: zein da bakoitza?

## 4. Septuma ez da osoa

Etapa: `septum-transversum` · 5 lerro · ~31 s hitz eginda

1. «Mesodermoz osatutako trenkada hori gorputzaren aurreko eta alboko paretetan finkatzen da.»
  _t=0.58 · argi: septum-transversum_
  - Ez dut ulertu: «Horma hori gorputzaren paretei itsasten zaie: aurrekoari eta alboetakoei.»
  - **F** `w7/2/p4/s1` Mesenkima, mesodermoz osatutako trenkada hori finkatu egiten da gorputzaren aurreko eta alboko paretetan, eta atzekaldetik, finkatzen da aurreko hestearen (gero hestegorria izango den) inguruko mesenkima.

2. «Atzekaldetik, berriz, aurreko hestearen inguruko mesenkimari finkatzen zaio: gero hestegorria izango dena.»
  _t=0.58 · argi: hestegorri-inguruko-mesenkima · arbelean: b-finkatu_
  - Ez dut ulertu: «Atzean ez dago gorputzaren paretari lotuta: hestegorri inguruko mesenkimari lotzen zaio.»
  - **F** `w7/2/p4/s1` Mesenkima, mesodermoz osatutako trenkada hori finkatu egiten da gorputzaren aurreko eta alboko paretetan, eta atzekaldetik, finkatzen da aurreko hestearen (gero hestegorria izango den) inguruko mesenkima.

3. «Baina banaketa ez da osoa: septumaren atze alboko aldeetan bi kanal geratzen dira irekita.»
  _t=0.78 · emphasis · argi: erreten-perikardioperitonealak_
  - Ez dut ulertu: «Horma ez da guztiz ixten. Atzean, bi alboetan, bi kanal geratzen dira zabalik.»
  - **F** `w7/2/p5/s3` Gero aipatuko den moduan, Septum Transversum-ak partzialki banatuko ditu enbrioi barruko zeloma horren goiko eta beheko atalak, Septum Transversum-aren alde dortsolateraletan badaudelako 2 kanal goiko eta beheko atalak komunikatzeko: erreten perikardioperitonealak (Septum Transversumaren atze alboko aldetan dauden behin-behineko egiturak).

4. «Kanal horiei erreten perikardioperitonealak deitzen zaie, eta goiko eta beheko atalak komunikatzen dituzte.»
  _t=0.78 · argi: erreten-perikardioperitonealak · arbelean: b-erretenak_
  - Ez dut ulertu: «Bi kanal horiek erreten perikardioperitonealak dira: goiko barrunbetik behekora pasatzeko bideak.»
  - **F** `w7/2/p5/s3` Gero aipatuko den moduan, Septum Transversum-ak partzialki banatuko ditu enbrioi barruko zeloma horren goiko eta beheko atalak, Septum Transversum-aren alde dortsolateraletan badaudelako 2 kanal goiko eta beheko atalak komunikatzeko: erreten perikardioperitonealak (Septum Transversumaren atze alboko aldetan dauden behin-behineko egiturak).

5. «Behin-behineko egiturak dira: gero itxi egingo dira.»
  _t=0.78 · caution_
  - Ez dut ulertu: «Ez dira betiko: gero itxiko dira, eta bi barrunbeak guztiz bereiziko dira.»
  - **F** `w7/2/p5/s3` Gero aipatuko den moduan, Septum Transversum-ak partzialki banatuko ditu enbrioi barruko zeloma horren goiko eta beheko atalak, Septum Transversum-aren alde dortsolateraletan badaudelako 2 kanal goiko eta beheko atalak komunikatzeko: erreten perikardioperitonealak (Septum Transversumaren atze alboko aldetan dauden behin-behineko egiturak).

- Arbela `b-finkatu`: Septuma finkatuta: aurrean eta alboetan gorputz paretari; atzean hestegorri inguruko mesenkimari
  - **F** `w7/2/p4/s1` Mesenkima, mesodermoz osatutako trenkada hori finkatu egiten da gorputzaren aurreko eta alboko paretetan, eta atzekaldetik, finkatzen da aurreko hestearen (gero hestegorria izango den) inguruko mesenkima.
- Arbela `b-erretenak`: Erreten perikardioperitonealak: atze-alboko bi kanal, goiko eta beheko atalak komunikatzen
  - **F** `w7/2/p5/s3` Gero aipatuko den moduan, Septum Transversum-ak partzialki banatuko ditu enbrioi barruko zeloma horren goiko eta beheko atalak, Septum Transversum-aren alde dortsolateraletan badaudelako 2 kanal goiko eta beheko atalak komunikatzeko: erreten perikardioperitonealak (Septum Transversumaren atze alboko aldetan dauden behin-behineko egiturak).
- Galdera (contrast): Septuma non finkatzen da aurrean eta atzean?
- Galdera (pool): mikro:7/septum-transversum:4

## 5. Mesenterio dortsala

Etapa: `peritoneo-barrunbea` · 7 lerro · ~41 s hitz eginda

1. «Goazen apunteetako irudira. Hestea alde zefalikotik kaudalera hedatzen da.»
  _t=0 · argi: erdiko-hestea_
  - Ez dut ulertu: «Begiratu apunteetako irudia. Hestea hodi luze bat da, buruaren aldetik isatsaren aldera doana.»
  - **F** `w7/2.1/p3/s1` Hestea alde zefalikotik alde kaudalera hedatzen da eta alboko mesodermoaren errai orriak hestea inguratzen du.

2. «Alboko mesodermoaren errai orriak hestea inguratzen du.»
  _t=0 · emphasis · argi: errai-orria_
  - Ez dut ulertu: «Zelomaren barneko orriak, errai orriak, hestea biltzen du, azal batek bezala.»
  - **F** `w7/2.1/p3/s1` Hestea alde zefalikotik alde kaudalera hedatzen da eta alboko mesodermoaren errai orriak hestea inguratzen du.

3. «Hestea gorputzaren atzeko aldeari lotuta mantentzen da, mesenkimazko lotura zabal baten bitartez.»
  _t=0_
  - Ez dut ulertu: «Hestea ez dago libre: lotura zabal batek atzeko paretari eusten dio.»
  - g `w7/2.1/p3/s2` Hestea mantentzen da lotuta gorputzaren atzeko aldearekin nahiko zabala den mesenkimaz osatutako lotura baten bitartez.

4. «Zelomaren beheko aldean, gorputzaren paretaren eta errai orriaren artean, bi orriko atzeko lotura bat agertzen da.»
  _t=0.15 · argi: errai-orria, mesenterio-dortsala_
  - Ez dut ulertu: «Behean, paretaren eta hestearen artean, lotura hori mehetu egiten da: bi orri dira, bata bestearen ondoan.»
  - **F** `w7/2.1/p3/s4` Enbrioi barruko zelomaren beheko aldean, peritoneo barrunbean, alboko mesodermoaren pareta eta errai orriaren artean agertzen da bi orriz osatutako atzeko lotura bat: mesenterio dortsala.

5. «Lotura horri mesenterio dortsala edo atzeko mesenterioa deritzo.»
  _t=0.15 · emphasis · argi: mesenterio-dortsala · arbelean: b-mesenterioa_
  - Ez dut ulertu: «Lotura horrek bi izen ditu: mesenterio dortsala eta atzeko mesenterioa. Biak gauza bera dira.»
  - **F** `w7/2.1/p3/s4` Enbrioi barruko zelomaren beheko aldean, peritoneo barrunbean, alboko mesodermoaren pareta eta errai orriaren artean agertzen da bi orriz osatutako atzeko lotura bat: mesenterio dortsala.

6. «Barrunbearen pareta estaltzen duen orria paretako peritoneoa da; hestearen ingurukoa, errai peritoneoa.»
  _t=0.2904 · emphasis · argi: paretako-peritoneoa, errai-peritoneoa · arbelean: b-peritoneoa_
  - Ez dut ulertu: «Bi orri daude: hormari itsatsita paretako peritoneoa, eta hesteari itsatsita errai peritoneoa.»
  - **F** `w7/2.1/p5/s1` Peritoneo barrunbeko pareta paretako peritoneoa deitzen da eta hestearen inguruan kokatzen den orria errai peritoneoa du izena.

7. «Eta bi orri horien arteko lotura, lehen ikusitako mesenterio dortsala da.»
  _t=0.2904 · argi: mesenterio-dortsala_
  - Ez dut ulertu: «Bi orri horiek mesenterioan elkartzen dira: hormatik hesteraino doan zubia da.»
  - g `w7/2.1/p5/s2` Paretako eta errai orri horien arteko lotura aurretik aipatutako mesenterio dortsala da.

- Arbela `b-mesenterioa`: Mesenterio dortsala = atzeko mesenterioa: bi orriko lotura, paretaren eta errai orriaren artean
  - **F** `w7/2.1/p3/s4` Enbrioi barruko zelomaren beheko aldean, peritoneo barrunbean, alboko mesodermoaren pareta eta errai orriaren artean agertzen da bi orriz osatutako atzeko lotura bat: mesenterio dortsala.
- Arbela `b-peritoneoa`: Paretako peritoneoa: barrunbearen pareta. Errai peritoneoa: hestearen ingurua
  - **F** `w7/2.1/p5/s1` Peritoneo barrunbeko pareta paretako peritoneoa deitzen da eta hestearen inguruan kokatzen den orria errai peritoneoa du izena.
- Galdera (pool): mikro:7/peritoneo-barrunbea:1
- Galdera (contrast): Paretako peritoneoa eta errai peritoneoa: zer estaltzen du bakoitzak?

## 6. Barruan, kanpoan, atzean

Etapa: `peritoneo-barrunbea` · 9 lerro · ~66 s hitz eginda

1. «Barrunbe horretan kokatuko dira aurreko hestearen urrutiko atala, erdiko hestea eta atzeko hestearen parterik garrantzitsuena.»
  _t=0.4224 · argi: erdiko-hestea_
  - Ez dut ulertu: «Barrunbe horretan hesteko zati gehienak egongo dira: aurreko hestearen azken zatia, erdiko hestea eta atzeko hestearen zati handi bat.»
  - **F** `w7/2.1/p6/s1` Peritoneo barrunbean kokatuko da aurreko hestearen urrutiko atala, baita bitarteko atala eta atzeko hestearen parterik garrantzitsuena (urrutiko atala izan ezik: ondestea).

2. «Hasieran, egitura horiek errai peritoneoz inguratuta daude. Beraz, peritoneo barruko egiturak deitzen zaie.»
  _t=0.4224 · emphasis · argi: errai-peritoneoa, peritoneo-barruko-egiturak · arbelean: b-barrukoak_
  - Ez dut ulertu: «Hestetik sortutako organo horiek errai peritoneoak biltzen ditu, barrunbe barruan. Horregatik peritoneo barrukoak dira.»
  - g `w7/2.1/p7/s1` Hasiera batean, hortik sortutako egiturak errai peritoneoz inguraturik gelditzen dira eta egitura guzti hauek peritoneo barrunbe horretan kokatuta daude hasiera batean.
  - **F** `w7/2.1/p7/s2` Beraz, hasieran, peritoneo barruko egiturak deitzen zaie.
  - **F** `w7/2.1/p9/s1` - Peritoneo barruko egiturak: peritoneo barrunbean kokatutako organoak, hestetik sortutakoak.

3. «Peritoneo kanpoko egiturak, berriz, barrunbe horretan ez dauden organoak dira.»
  _t=0.5456 · argi: peritoneo-kanpoko-egiturak_
  - Ez dut ulertu: «Beste organo batzuk ez daude barrunbe horren barruan: peritoneo kanpokoak dira.»
  - **F** `w7/2.1/p10/s1` - Peritoneo kanpoko egiturak: Peritoneo barrunbean ez dauden organoak.

4. «Adibidez, giltzurrunak: bitarteko mesodermotik garatzen dira, barrunbearen atzeko aldean.»
  _t=0.5456 · emphasis · argi: giltzurruna_
  - Ez dut ulertu: «Adibide bat: giltzurrunak. Bitarteko mesodermotik sortzen dira, barrunbearen atzean, eta ez dira barrura sartzen.»
  - **F** `w7/2.1/p10/s2` Adibidez, bitarteko mesodermotik garatzen diren giltzurrunak (peritoneo barrunbearen atzeko aldean kokatutakoak).

5. «Abdomeneko aorta ere bai: diafragma zeharkatzen du, baina barrunbearen atzean geratzen da. Beheko kaba zaina, berdin.»
  _t=0.5456 · argi: aorta, beheko-kaba-zaina · arbelean: b-kanpokoak_
  - Ez dut ulertu: «Aorta ere kanpoan dago: toraxetik jaitsi eta barrunbearen atzean geratzen da. Beheko kaba zaina ere bai.»
  - **F** `w7/2.1/p10/s3` Beste adibidea: abdomeneko aorta, jaisten dela toraxetik, zeharkatzen du diafragma eta sartzen da abdomenera, baina ez dago peritoneo barrunbean sartuta, peritoneo barrunbearen atzeko aldean bukatzen baita.
  - g `w7/2.1/p10/s4` Beheko bena kabarekin gauza berdina gertatzen da.

6. «Beste organo batzuk hasieran peritoneo barrukoak dira, baina garapenean posizioz aldatzen dira.»
  _t=0.6688 · argi: peritoneo-barruko-egiturak_
  - Ez dut ulertu: «Beste organo batzuk hasieran barruan daude, baina gero tokiz mugitzen dira.»
  - **F** `w7/2.1/p11/s1` Bukatzeko, badaude organo batzuk hasieran, sortzen direnean, peritoneo barrukoak direnak, baina garapenean posizioz aldatzen dute barrunbe peritoneal horretan.

7. «Posizio aldaketa horregatik, atzeko mesenterioa atzekaldeko paretako peritoneoarekin fusionatzen da: peritoneo atzeko egiturak bihurtzen dira.»
  _t=0.6688 · emphasis · argi: mesenterio-dortsala, paretako-peritoneoa, peritoneo-atzeko-egiturak · arbelean: b-atzekoak_
  - Ez dut ulertu: «Organo horien mesenterioa atzeko hormari itsasten zaio, eta organoa atzean geratzen da itsatsita.»
  - **F** `w7/2.1/p11/s2` Posizio aldaketa horregatik atzeko mesenterioa fusionatzen da atzekaldeko paretako peritoneoarekin, peritoneo atzeko egiturak bihurtuz.

8. «Beraz, peritoneo barrunbeak ez du abdomeneko barrunbe osoa okupatzen.»
  _t=0.792 · emphasis · argi: peritoneo-barrunbea · arbelean: b-ez-osoa_
  - Ez dut ulertu: «Ondorioz, peritoneo barrunbeak ez du abdomen osoa betetzen: zati bat bakarrik hartzen du.»
  - **F** `w7/2.1/p12/s1` Beraz, argi eduki behar da peritoneo barrunbea ez duela okupatzen abdomeneko barrunbe osoa badaudelako organo batzuk peritoneo kanpokoak direla (abdomen barruan kokatuak) eta beste batzuk peritoneo atzekoak direla; esaterako, duodenoa eta goranzko eta beheranzko kolona.

9. «Organo batzuk peritoneo kanpokoak dira, eta beste batzuk peritoneo atzekoak: duodenoa, goranzko kolona eta beheranzko kolona.»
  _t=0.792 · argi: peritoneo-kanpoko-egiturak, peritoneo-atzeko-egiturak, goranzko-kolona, beheranzko-kolona_
  - Ez dut ulertu: «Batzuk kanpoan daude, eta beste batzuk atzean itsatsita: adibidez duodenoa, goranzko kolona eta beheranzko kolona.»
  - **F** `w7/2.1/p12/s1` Beraz, argi eduki behar da peritoneo barrunbea ez duela okupatzen abdomeneko barrunbe osoa badaudelako organo batzuk peritoneo kanpokoak direla (abdomen barruan kokatuak) eta beste batzuk peritoneo atzekoak direla; esaterako, duodenoa eta goranzko eta beheranzko kolona.

- Arbela `b-barrukoak`: Peritoneo barrukoak: hestetik sortuak, errai peritoneoz inguratuak
  - g `w7/2.1/p7/s1` Hasiera batean, hortik sortutako egiturak errai peritoneoz inguraturik gelditzen dira eta egitura guzti hauek peritoneo barrunbe horretan kokatuta daude hasiera batean.
  - **F** `w7/2.1/p9/s1` - Peritoneo barruko egiturak: peritoneo barrunbean kokatutako organoak, hestetik sortutakoak.
- Arbela `b-kanpokoak`: Peritoneo kanpokoak: giltzurrunak, aorta, beheko kaba (barrunbearen atzean)
  - **F** `w7/2.1/p10/s2` Adibidez, bitarteko mesodermotik garatzen diren giltzurrunak (peritoneo barrunbearen atzeko aldean kokatutakoak).
  - **F** `w7/2.1/p10/s3` Beste adibidea: abdomeneko aorta, jaisten dela toraxetik, zeharkatzen du diafragma eta sartzen da abdomenera, baina ez dago peritoneo barrunbean sartuta, peritoneo barrunbearen atzeko aldean bukatzen baita.
  - g `w7/2.1/p10/s4` Beheko bena kabarekin gauza berdina gertatzen da.
- Arbela `b-atzekoak`: Peritoneo atzekoak: mesenterioa atzeko paretako peritoneoarekin fusionatua
  - **F** `w7/2.1/p11/s2` Posizio aldaketa horregatik atzeko mesenterioa fusionatzen da atzekaldeko paretako peritoneoarekin, peritoneo atzeko egiturak bihurtuz.
- Arbela `b-ez-osoa`: Peritoneo barrunbeak ez du abdomen osoa betetzen
  - **F** `w7/2.1/p12/s1` Beraz, argi eduki behar da peritoneo barrunbea ez duela okupatzen abdomeneko barrunbe osoa badaudelako organo batzuk peritoneo kanpokoak direla (abdomen barruan kokatuak) eta beste batzuk peritoneo atzekoak direla; esaterako, duodenoa eta goranzko eta beheranzko kolona.
- Galdera (contrast): Peritoneo kanpokoak eta peritoneo atzekoak: zein egon zen hasieran barrunbearen barruan?
- Galdera (pool): w7-q-peritoneo-ez-osoa

## 7. Toraxean: birika hastapenak

Etapa: `pleura-perikardioa` · 7 lerro · ~43 s hitz eginda

1. «Orain toraxera. Enbrioi barruko zelomaren atzealdean aurreko hestea dago.»
  _t=0 · argi: aurreko-hestea_
  - Ez dut ulertu: «Toraxera goaz. Zelomaren atzean hodi bat dago: aurreko hestea.»
  - **F** `w7/2.2/p6/s1` Enbrioi barruko zelomaren (hasierako perikardio barrunbearen) atzealdean kokatzen da aurreko hestea.

2. «Aurreko hestearen aurreko paretatik arnas aparatuaren hastapena agertzen da: ebaginazio endodermiko bat.»
  _t=0 · emphasis · argi: aurreko-hestea, arnas-hastapena · arbelean: b-arnas_
  - Ez dut ulertu: «Aurreko hestearen aurreko hormatik poltsa txiki bat ateratzen da: arnas hastapena.»
  - **F** `w7/2.2/p6/s2` Garapenean, aurreko hestearen aurreko paretatik arnas aparatuaren hastapena agertzen da (ebaginazio endodermikoa).

3. «Hastapen hori luzatzen da: hurbileko atala hodi laringotrakeala da, eta muturretik bi birika hastapen sortzen dira.»
  _t=0 · argi: hodi-laringotrakeala, birika-hastapenak_
  - Ez dut ulertu: «Poltsa hori luzatu egiten da: hasierako zatia hodi laringotrakeala da, eta muturrean bi birika hastapen sortzen dira.»
  - g `w7/2.2/p6/s3` Hastapen hau luzatu egiten da, hurbileko atala hodi laringotrakeala deitzen da, eta hastapen horren erpinetik (urrutiko ataletik) bi alboko hastapen edo dibertikulu sortzen dira: birika hastapenak (eskuinekoa eta ezkerrekoa).

4. «Hasierako perikardio barrunbeak torax barrunbe osoa okupatzen du. Hortik hiru barrunbe sortuko dira.»
  _t=0.14 · emphasis · argi: hasierako-perikardio-barrunbea_
  - Ez dut ulertu: «Hasierako perikardio barrunbeak toraxa osorik betetzen du. Garapenean hiru barrunbe bihurtuko da.»
  - **F** `w7/2.2/p3/s1` Hasierako perikardio barrunbeak torax barrunbe osoa okupatzen du, eta beraz, hasierako perikardio barrunbetik hiru barrunbe desberdin sortzen dira garapenean:

5. «Birika hastapenak behera, eskuinera eta aurrera hazten dira.»
  _t=0.24 · argi: birika-hastapenak_
  - Ez dut ulertu: «Birika hastapenak hazi egiten dira: behera, eskuinera eta aurrera.»
  - g `w7/2.2/p6/s4` Birika hastapen horiek behera, eskuinera eta aurrera hazten dira.

6. «Hazkuntza horregatik, atzeko aldetik errai orria bultzatzen dute, eta poliki-poliki barrunbean sartzen dira.»
  _t=0.24 · emphasis · argi: birika-hastapenak, errai-orria · arbelean: b-pleura-hasi_
  - Ez dut ulertu: «Hazten diren heinean, zelomaren errai orria bultzatzen dute, eta barrunbe barrura sartzen dira, orri horrekin estalita.»
  - **F** `w7/2.2/p6/s5` Hazkuntza honengatik atzeko aldetik enbrioi barruko zelomaren errai orria bultzatzen dute, eta poliki poliki sartu egiten dira eta hasierako perikardio barrunbearen atze alboko aldeak okupatzen hasten dira eta pleura barrunbeak hasten dira eratzen.

7. «Hasierako perikardio barrunbearen atze alboko aldeak okupatzen hasten dira.»
  _t=0.24 · argi: hasierako-perikardio-barrunbea_
  - Ez dut ulertu: «Barrunbe horren atzeko eta alboetako zatiak betetzen hasten dira.»
  - **F** `w7/2.2/p6/s5` Hazkuntza honengatik atzeko aldetik enbrioi barruko zelomaren errai orria bultzatzen dute, eta poliki poliki sartu egiten dira eta hasierako perikardio barrunbearen atze alboko aldeak okupatzen hasten dira eta pleura barrunbeak hasten dira eratzen.

- Arbela `b-arnas`: Arnas hastapena: aurreko hestearen aurreko paretatik (ebaginazio endodermikoa)
  - **F** `w7/2.2/p6/s2` Garapenean, aurreko hestearen aurreko paretatik arnas aparatuaren hastapena agertzen da (ebaginazio endodermikoa).
- Arbela `b-pleura-hasi`: Birika hastapenek errai orria bultzatzen dute atzetik, eta barrunbean sartzen dira
  - **F** `w7/2.2/p6/s5` Hazkuntza honengatik atzeko aldetik enbrioi barruko zelomaren errai orria bultzatzen dute, eta poliki poliki sartu egiten dira eta hasierako perikardio barrunbearen atze alboko aldeak okupatzen hasten dira eta pleura barrunbeak hasten dira eratzen.
- Galdera (pool): mikro:7/pleura-perikardioa:0
- Galdera (contrast): Arnas hastapena eta birika hastapenak: nondik sortzen da bakoitza?

## 8. Pleurak eta perikardioa

Etapa: `pleura-perikardioa` · 12 lerro · ~69 s hitz eginda

1. «Gorputzaren alboko aldeetatik bi mintz agertzen dira: mintz pleuroperikardikoak.»
  _t=0.36 · argi: mintz-pleuroperikardikoak_
  - Ez dut ulertu: «Gorputzaren bi alboetatik horma mehe bana hazten da: mintz pleuroperikardikoak.»
  - g `w7/2.2/p7/s1` Bestetik, garapenbaren 5.asterako gorputzaren alboko aldeetatik bi mintz agertzen dira, mintz pleuroperikardiko deritzenak.

2. «5. astean, bi mintzak erdialderuntz abiatzen dira, eta haien erpinak fusionatzen dira.»
  _t=0.48 · emphasis · argi: mintz-pleuroperikardikoak_
  - Ez dut ulertu: «5. astean bi mintzak erdirantz hazten dira, eta muturrak elkartzean bat egiten dute.»
  - **F** `w7/2.2/p8/s1` Bi mintz pleuroperikardiko hauek 5.astean erdialderuntz abiatzen dira, haien artean erpinak fusionatu arte, eta era berean, heste gorriaren inguruko mesenkimarekin fusionatzen dira.

3. «Era berean, hestegorri inguruko mesenkimarekin fusionatzen dira.»
  _t=0.48 · argi: hestegorri-inguruko-mesenkima · arbelean: b-pleuroperikardikoak_
  - Ez dut ulertu: «Hestegorri inguruko mesenkimarekin ere bat egiten dute.»
  - **F** `w7/2.2/p8/s1` Bi mintz pleuroperikardiko hauek 5.astean erdialderuntz abiatzen dira, haien artean erpinak fusionatu arte, eta era berean, heste gorriaren inguruko mesenkimarekin fusionatzen dira.

4. «Horrela, hasierako perikardio barrunbetik bi pleura barrunbe sortzen dira, toraxaren alboetan.»
  _t=0.48 · argi: hasierako-perikardio-barrunbea, pleura-barrunbea_
  - Ez dut ulertu: «Horrela, hasierako barrunbe bakarretik bi pleura barrunbe sortzen dira, bat alde bakoitzean.»
  - **F** `w7/2.2/p3/s1` Hasierako perikardio barrunbeak torax barrunbe osoa okupatzen du, eta beraz, hasierako perikardio barrunbetik hiru barrunbe desberdin sortzen dira garapenean:
  - **F** `w7/2.2/p4/s1` ●​ Bi pleura barrunbe (toraxeko lateraletan), non birikak kokatzen diren.

5. «Eta erdian, aurrean, behin betiko perikardio barrunbea: bihotza kokatuko den tokia.»
  _t=0.48 · emphasis · argi: perikardio-barrunbea, bihotza · arbelean: b-hiru_
  - Ez dut ulertu: «Erdian eta aurrean, bihotzaren inguruan, perikardio barrunbea geratzen da.»
  - **F** `w7/2.2/p5/s1` ●​ Behin-betiko perikardio barrunbea (aurre erdikaldean kokatuta), non bihotza kokatuko den.

6. «Barrunbe bakoitzean bi orri bereizten dira: pleuran, paretako pleura eta errai pleura.»
  _t=0.72 · argi: pleura-barrunbea, paretako-pleura, errai-pleura_
  - Ez dut ulertu: «Barrunbe bakoitzak bi orri ditu: bata hormari itsatsita, paretako pleura, eta bestea organoari, errai pleura.»
  - **F** `w7/2.2/p10/s1` Beraz, hasierako perikardio barrunbe honetan bi motatako barrunbeak agertuko dira, eta barrunbe hauetan beti bereizten da paretako orri bat eta errai orri bat.

7. «Errai pleura birikarekin kontaktuan dago, erreflejatu egiten da, eta paretako pleurarekin jarraitzen du.»
  _t=0.72 · argi: errai-pleura, birikak, paretako-pleura · arbelean: b-pleura-orriak_
  - Ez dut ulertu: «Errai pleurak birika estaltzen du; gero bueltatu egiten da, eta paretako pleura bihurtzen da. Orri bera da.»
  - **F** `w7/2.2/p11/s2` (Bere errai pleura kontaktuan dago birikarekin, erreflejatu eta pareta pleurarekin jarraitzen du)

8. «Pleura barrunbeak atze alboko aldeetan kokatzen dira; perikardio barrunbea erdikaldean.»
  _t=0.72 · argi: pleura-barrunbea, perikardio-barrunbea_
  - Ez dut ulertu: «Pleura barrunbeak atzean eta alboetan daude; perikardio barrunbea erdian geratzen da.»
  - **F** `w7/2.2/p11/s1` ● Atze-alboko aldeetan kokatzen diren 2 pleura barrunbeak.
  - **F** `w7/2.2/p12/s1` ● Erdikaldean bukatzen den gelditzen den perikardio barrunbea.

9. «Mintz pleuroperikardikoen erdiko mesenkimatik perikardio fibrosoa garatzen da.»
  _t=0.84 · emphasis · argi: mintz-pleuroperikardikoak, perikardio-fibrosoa_
  - Ez dut ulertu: «Mintz horien erdiko ehunetik perikardio fibrosoa sortzen da.»
  - **F** `w7/2.2/p14/s1` Perikardio barrunbean mintz pleuroperkardiko hauen erdigunean dagoen mesenkimatik perikardio fibrosoa garatzen da.

10. «Somatopleura geruzatik, berriz, perikardio serosoa garatzen da, bihotz hodiaren inguruan.»
  _t=0.84 · argi: perikardio-serosoa · arbelean: b-perikardioa_
  - Ez dut ulertu: «Perikardio serosoa, aldiz, zelomaren paretako orritik dator, somatopleuratik.»
  - **F** `w7/2.2/p14/s2` Somatopleura geruzatik perikardio serosoa (bihotz hodiaren inguruan) garatzen da.

11. «Bi barrunbe hauek espazio birtualak dira: orriak bata bestearen ondoan daude, tarterik gabe.»
  _t=0.93 · argi: pleura-barrunbea, perikardio-barrunbea_
  - Ez dut ulertu: «Barrunbe hauek ia ez dute barrualderik: bi orriak elkar ukitzen dute.»
  - g `w7/2.2/p13/s1` Bi barrunbe hauek espazio birtualak dira, bi motako pleurak (gauza bera perikardioarekin) bata bestearen aldamenean (paretako pleura orria eta errai orria) daude (tartean espaziorik egon gabe).

12. «Egoera patologikoetan bakarrik bihurtzen dira espazio erreal: adibidez, pleura barrunbean airea edo odola sartzen denean.»
  _t=0.93 · caution · argi: pleura-barrunbea · arbelean: b-birtualak_
  - Ez dut ulertu: «Gaixotasunetan bakarrik irekitzen da benetako hutsune bat, adibidez airea edo odola sartzen bada.»
  - **F** `w7/2.2/p13/s2` Bakarrik espazio erreala bihurtzen da egoera patologikoetan (adibidez, pleura barrunbean batzuetan airea edo odola sartzen da).

- Arbela `b-pleuroperikardikoak`: Mintz pleuroperikardikoak: 5. astean fusionatzen dira, elkarren artean eta hestegorri inguruko mesenkimarekin
  - **F** `w7/2.2/p8/s1` Bi mintz pleuroperikardiko hauek 5.astean erdialderuntz abiatzen dira, haien artean erpinak fusionatu arte, eta era berean, heste gorriaren inguruko mesenkimarekin fusionatzen dira.
- Arbela `b-hiru`: Hasierako perikardio barrunbetik: bi pleura barrunbe (alboetan) eta perikardio barrunbea (aurrean, erdian)
  - **F** `w7/2.2/p3/s1` Hasierako perikardio barrunbeak torax barrunbe osoa okupatzen du, eta beraz, hasierako perikardio barrunbetik hiru barrunbe desberdin sortzen dira garapenean:
  - **F** `w7/2.2/p4/s1` ●​ Bi pleura barrunbe (toraxeko lateraletan), non birikak kokatzen diren.
  - **F** `w7/2.2/p5/s1` ●​ Behin-betiko perikardio barrunbea (aurre erdikaldean kokatuta), non bihotza kokatuko den.
- Arbela `b-pleura-orriak`: Errai pleura birikarekin kontaktuan; paretako pleurarekin jarraia
  - **F** `w7/2.2/p11/s2` (Bere errai pleura kontaktuan dago birikarekin, erreflejatu eta pareta pleurarekin jarraitzen du)
- Arbela `b-perikardioa`: Perikardio fibrosoa: mintzen erdiko mesenkimatik. Perikardio serosoa: somatopleuratik
  - **F** `w7/2.2/p14/s1` Perikardio barrunbean mintz pleuroperkardiko hauen erdigunean dagoen mesenkimatik perikardio fibrosoa garatzen da.
  - **F** `w7/2.2/p14/s2` Somatopleura geruzatik perikardio serosoa (bihotz hodiaren inguruan) garatzen da.
- Arbela `b-birtualak`: Espazio birtualak; errealak egoera patologikoetan bakarrik
  - **F** `w7/2.2/p13/s2` Bakarrik espazio erreala bihurtzen da egoera patologikoetan (adibidez, pleura barrunbean batzuetan airea edo odola sartzen da).
- Galdera (pool): mikro:7/pleura-perikardioa:4
- Galdera (contrast): Perikardio fibrosoa eta perikardio serosoa: nondik dator bakoitza?
- Galdera (pool): mikro:7/pleura-perikardioa:8

## 9. Diafragma: lepotik behera

Etapa: `diafragma-eraketa` · 10 lerro · ~54 s hitz eginda

1. «Orain diafragma: torax eta abdomenaren artean dagoen trenkada muskulu aponeurotikoa.»
  _t=0_
  - Ez dut ulertu: «Diafragma toraxa eta abdomena bereizten dituen horma da: muskulua du, eta tendoi zati bat ere bai.»
  - **F** `w7/3/p3/s1` Diafragma torax eta abdomenaren artean agertzen den trenkada muskulu aponeurotikoa da (trenkada bat da muskuluarekin eta baita atal tendinoso batekin).

2. «Bere osagaietako bat septum transversuma da.»
  _t=0 · argi: septum-transversum_
  - Ez dut ulertu: «Diafragma zenbait zatiren batura da, eta horietako bat septum transversuma da.»
  - g `w7/3/p3/s3` Bere eraketan parte hartzen duen osagaietako bat Septum Transversuma da.

3. «Septuma C3, C4 eta C5 mailetan agertzen da, oso altu, eta bere mesodermotik mesenkima sortzen da.»
  _t=0.1204 · argi: septum-transversum_
  - Ez dut ulertu: «Gogoratu: septuma lepoan sortzen da, oso altu. Bere ehunetik zelula berriak sortzen dira.»
  - **F** `w7/3/p4/s1` Lehen aipatu den bezala, Septum transversuma lepoko C-3, C-4 eta C-5 mailetan agertzen da (oso altu agertu) eta momentu horretan, bere mesordemotik mesenkima sortzen da.

4. «Mesenkima horretan mioblastoak bereizten dira, eta gero miozitoak bihurtzen dira: zelula muskularrak.»
  _t=0.1204 · argi: mioblastoak, miozitoak_
  - Ez dut ulertu: «Ehun horretan muskulu zelulen aitzindariak agertzen dira, mioblastoak. Gero muskulu zelula bihurtzen dira: miozitoak.»
  - g `w7/3/p4/s2` Mesenkima edo mesodermo horretan mioblastoak (zelula muskularren aitzindariak) hasten dira desberdintzen.
  - g `w7/3/p4/s3` Gero, mioblasto horiek miozitoak (zelula muskularrak) bihurtzen dira.

5. «Garai horretan, lepo mailan, zelula muskular horietara nerbio zuntzak iristen dira, inerbatzeko.»
  _t=0.258 · argi: lepoko-nerbio-espinalak_
  - Ez dut ulertu: «Lepoan dauden bitartean, muskulu zelula horiei nerbioak iristen zaizkie.»
  - **F** `w7/3/p5/s1` Garai horretan, lepo mailan kokatzen den momentuan, septum transversumean garatzen ari diren zelula muskular horietara nerbio zuntzak iristen dira, zelula muskular horiek inerbatzeko.

6. «Zuntz horiek 3., 4. eta 5. lepoko nerbio espinalen aurreko adarretatik datoz.»
  _t=0.258 · emphasis · argi: lepoko-nerbio-espinalak_
  - Ez dut ulertu: «Nerbio horiek lepoko hirugarren, laugarren eta bosgarren nerbio espinaletatik datoz.»
  - **F** `w7/3/p5/s3` Hau da, zelula muskular horiek lepo mailan agertzen direnez, horietaraino nerbio errakideoetatik, nerbio zuntzak iristen dira (nerbio motoreak eta sentsorialak) zelula muskular hauek inerbatzeko 3., 4. eta 5. lepoko nerbio espinale aurreko adarretatik (errakideoak) irtendako zuntzak, hain zuzen ere.

7. «Zuntz horiek elkartzean nerbio frenikoak osatzen dituzte.»
  _t=0.258 · emphasis · argi: nerbio-frenikoa · arbelean: b-frenikoa_
  - Ez dut ulertu: «Nerbio horiek batzen direnean nerbio frenikoa sortzen da. Horregatik du diafragmak lepoko nerbioa.»
  - **F** `w7/3/p5/s3` Hau da, zelula muskular horiek lepo mailan agertzen direnez, horietaraino nerbio errakideoetatik, nerbio zuntzak iristen dira (nerbio motoreak eta sentsorialak) zelula muskular hauek inerbatzeko 3., 4. eta 5. lepoko nerbio espinale aurreko adarretatik (errakideoak) irtendako zuntzak, hain zuzen ere.
  - g `w7/3/p5/s4` Nerbio zuntz horiek elkartzean nerbio frenikoak osatzen dituzte.

8. «Enbrioia atzetik gehiago hazten da aurretik baino, bizkarrezurragatik. Horregatik septuma jaisten hasten da.»
  _t=0.3956 · why · argi: septum-transversum_
  - Ez dut ulertu: «Bizkarra azkarrago hazten da sabela baino. Ondorioz, septuma lepotik jaisten hasten da.»
  - **F** `w7/3/p6/s1` Enbrioiaren hazkuntzarengatik (gehiago hazi atzetik aurretik baino, bizkarrezurraren garapenagatik) septum transversuma jaisten hasten da lepo mailatik.

9. «5. astearen bukaerarako, septumaren aurreko aldea 6. torax mailan dago, eta atzeko aldea 12. torax mailan.»
  _t=0.3956 · emphasis · argi: septum-transversum · arbelean: b-jaitsiera_
  - Ez dut ulertu: «5. astearen bukaeran, septumaren aurrealdea 6. torax mailan dago; atzealdea beherago, 12. torax mailan.»
  - **F** `w7/3/p6/s2` 5. astearen bukaerarako, septun transversumaren aurreko aldea askoz beherago kokatzen da (6. torax mailan), eta atzeko aldea askoz beherako (12. torax mailan).

10. «Jaitsierarekin batera, nerbio frenikoak luzatu egiten dira septumera iristeko.»
  _t=0.3956 · why · argi: nerbio-frenikoa_
  - Ez dut ulertu: «Septuma jaistean, nerbio frenikoak berarekin doaz eta luzatu egiten dira.»
  - g `w7/3/p6/s3` Jaitsiera honekin batera, nerbio frenikoetako zuntz motore eta sentsorialak luzatu egiten dira septum transversumera iritsi ahal izateko.

- Arbela `b-frenikoa`: Nerbio frenikoa: C3, C4 eta C5 (septuma lepo mailan sortzen delako)
  - **F** `w7/3/p5/s3` Hau da, zelula muskular horiek lepo mailan agertzen direnez, horietaraino nerbio errakideoetatik, nerbio zuntzak iristen dira (nerbio motoreak eta sentsorialak) zelula muskular hauek inerbatzeko 3., 4. eta 5. lepoko nerbio espinale aurreko adarretatik (errakideoak) irtendako zuntzak, hain zuzen ere.
  - g `w7/3/p5/s4` Nerbio zuntz horiek elkartzean nerbio frenikoak osatzen dituzte.
- Arbela `b-jaitsiera`: Jaitsiera (5. astearen bukaera): aurrea T6, atzea T12
  - **F** `w7/3/p6/s2` 5. astearen bukaerarako, septun transversumaren aurreko aldea askoz beherago kokatzen da (6. torax mailan), eta atzeko aldea askoz beherako (12. torax mailan).
- Galdera (pool): mikro:7/diafragma-eraketa:2
- Galdera (contrast): Jaitsi ondoren, septumaren aurreko eta atzeko aldeak: zein mailatan daude?

## 10. Erretenak ixten dira

Etapa: `diafragma-eraketa` · 8 lerro · ~56 s hitz eginda

1. «4. astean, goiko eta beheko barrunbeak komunikatuta daude, erreten perikardioperitonealen bidez, alde dortsalean.»
  _t=0.5332 · argi: erreten-perikardioperitonealak_
  - Ez dut ulertu: «Oraindik bi barrunbeak lotuta daude atzealdean, bi erretenen bidez.»
  - **F** `w7/3/p7/s1` Bestetik, 4. astean goikaldean kokatzen den hasierako perikardio barrunbea (bertatik ondoren pleura barrunbeak) erreten perikardioperitonealen (alde dortsalean) bitartez komunikatuta mantentzen da behekaldeko peritoneo barrunbearekin.

2. «5. astean, gorputzaren atze alboko paretetatik mintz pleuroperitonealak agertzen dira.»
  _t=0.6364 · argi: mintz-pleuroperitonealak_
  - Ez dut ulertu: «5. astean, gorputzaren hormatik, atzean eta alboetan, beste bi mintz hazten dira: mintz pleuroperitonealak.»
  - **F** `w7/3/p7/s2` Garapenaren 5. astean, gorputzaren atze alboko paretetatik mintz pleuroperitonealak agertzen dira.

3. «Hazi ahala, hestegorri inguruko mesenkimarekin eta septumaren atzeko ertzarekin fusionatzen dira.»
  _t=0.6364 · argi: mintz-pleuroperitonealak, hestegorri-inguruko-mesenkima, septum-transversum_
  - Ez dut ulertu: «Mintz horiek hazi eta atzeko mesenkimarekin eta septumarekin bat egiten dute.»
  - **F** `w7/3/p7/s3` Hauek hazi eta hazkuntza horren ondorioz, hestegorri inguruko mesenkimarekin eta septum transversumaren atzeko ertzarekin fusionatzen dira.

4. «Horrela, erreten perikardioperitonealak itxita geratzen dira, eta bi barrunbeen arteko komunikazioa galtzen da.»
  _t=0.6364 · emphasis · argi: erreten-perikardioperitonealak · arbelean: b-pleuroperitonealak_
  - Ez dut ulertu: «Horrela bi erretenak ixten dira, eta bi barrunbeak guztiz bereizita geratzen dira.»
  - **F** `w7/3/p7/s4` Horrela, erreten perikardioperitonealak itxita gelditzen dira, pleura eta peritoneo barrunbeen arteko komunikazioa galduz.

5. «Beraz, diafragmak lau osagai ditu. Lehena, septum transversuma: bertako miozitoak mintz pleuroperitonealetara migratzen dute.»
  _t=0.7568 · argi: septum-transversum, miozitoak, mintz-pleuroperitonealak_
  - Ez dut ulertu: «Diafragma lau zatiz egina dago. Lehena septuma da: bere muskulu zelulak mintzetara mugitzen dira.»
  - **F** `w7/3.1/p3/s1` ● Septum Transversuma: lepo mailan zegoen bitartean bertan bereizitako miozitoek migratzen dute mintz pleuroperitonialetara bertan zelula muskularrak sortzeko.

6. «Bigarrena, mintz pleuroperitonealak: pleuren eta peritoneoaren arteko komunikazioa ixten dute.»
  _t=0.7568 · argi: mintz-pleuroperitonealak · arbelean: tz-mintzak_
  - Ez dut ulertu: «Bigarrena, mintz pleuroperitonealak: bi erretenak ixten dituzte.»
  - **F** `w7/3.1/p4/s1` ● Mintz pleuroperitonealak: pleura barrunbeen eta peritoneo barrunbearen arteko komunikazioa itxi egiten dute.

7. «Hirugarrena, hestegorri inguruko mesenkimatik sortutako zuntz muskularrak: hortik gerriko atala garatuko da.»
  _t=0.7568 · argi: hestegorri-inguruko-mesenkima · arbelean: tz-mesenkima_
  - Ez dut ulertu: «Hirugarrena, hestegorri inguruko mesenkima: gerriko atala emango du.»
  - **F** `w7/3.1/p5/s1` ● Hestegorri inguruko mesenkimatik sortutako zuntz muskularrak.
  - g `w7/3.1/p5/s2` Gerriko atal muskularra garatuko da hemendik.

8. «Laugarrena, alde periferikoko atal muskularra, gorputzeko mesodermo paraxialetik sortua.»
  _t=0.7568 · argi: gorputz-paretako-mesodermoa · arbelean: tz-paraxiala_
  - Ez dut ulertu: «Laugarrena, ertzeko muskulua: gorputzeko mesodermo paraxialetik dator.»
  - **F** `w7/3.1/p6/s1` ● Diafragmaren alde periferikoko atal muskularra: gorputzeko mesodermo paraxialetik sortua.

- Arbela `b-pleuroperitonealak`: Mintz pleuroperitonealak (5. astea): erreten perikardioperitonealak ixten dituzte
  - **F** `w7/3/p7/s2` Garapenaren 5. astean, gorputzaren atze alboko paretetatik mintz pleuroperitonealak agertzen dira.
  - **F** `w7/3/p7/s4` Horrela, erreten perikardioperitonealak itxita gelditzen dira, pleura eta peritoneo barrunbeen arteko komunikazioa galduz.
- Taula `tz-septum`: Septum transversuma → Zentro tendinosoa
  - **F** `w7/3.1/p8/s1` Septum Transversumetik garatzen da diafragmaren erdian dagoen atal tendinosoa: diafragmaren zentro tendinosoa/erdiko tendoia.
- Taula `tz-mintzak`: Mintz pleuroperitonealak → Pleura eta peritoneo barrunbeen arteko komunikazioa ixten dute
  - **F** `w7/3.1/p4/s1` ● Mintz pleuroperitonealak: pleura barrunbeen eta peritoneo barrunbearen arteko komunikazioa itxi egiten dute.
- Taula `tz-mesenkima`: Hestegorri inguruko mesenkima → Gerriko atala
  - **F** `w7/3.1/p5/s1` ● Hestegorri inguruko mesenkimatik sortutako zuntz muskularrak.
  - g `w7/3.1/p5/s2` Gerriko atal muskularra garatuko da hemendik.
- Taula `tz-paraxiala`: Gorputzeko mesodermo paraxiala → Alde periferikoko atal muskularra
  - **F** `w7/3.1/p6/s1` ● Diafragmaren alde periferikoko atal muskularra: gorputzeko mesodermo paraxialetik sortua.
- Galdera (pool): mikro:7/diafragma-eraketa:5
- Galdera (contrast): Mintz pleuroperikardikoak eta mintz pleuroperitonealak: zein bi barrunbe bereizten ditu bakoitzak?

## 11. Diafragma heldua

Etapa: `diafragma-heldua` · 12 lerro · ~75 s hitz eginda

1. «Helduan, septum transversumetik erdiko atal tendinosoa garatzen da: zentro tendinosoa.»
  _t=0 · emphasis · argi: zentro-tendinosoa · arbelean: tz-septum_
  - Ez dut ulertu: «Erdiko zati tendinosoa, zentro tendinosoa, septum transversumetik dator.»
  - **F** `w7/3.1/p8/s1` Septum Transversumetik garatzen da diafragmaren erdian dagoen atal tendinosoa: diafragmaren zentro tendinosoa/erdiko tendoia.

2. «Zentro tendinosoan hiru hosto bereizten dira: eskuinekoa, erdikoa eta ezkerrekoa.»
  _t=0 · argi: zentro-tendinosoa_
  - Ez dut ulertu: «Zentro tendinosoak hiru zati ditu, hostoak: eskuinekoa, erdikoa eta ezkerrekoa.»
  - g `w7/3.1/p8/s3` Diafragmaren zentro tendinosoan 3 hosto ezberdin bereizten dira: eskuineko, erdiko eta ezkerreko hostoak.

3. «Inguruko zuntzetan, bularrezur atala bularrezurrean insertatzen da, eta saihets-hezur atala saihets hezurretan.»
  _t=0.1493 · argi: bularrezur-atala, saihets-hezur-atala_
  - Ez dut ulertu: «Muskulu zatien izenak esaten du non lotzen diren: bularrezur atala bularrezurrean, saihets-hezur atala saihetsetan.»
  - g `w7/3.1/p9/s1` Diafragmaren zentro tendinosoaren inguruan kokatzen den zuntz muskular horietan hiru azpiatal bereiz daitezke: ○ Bularrezur atala: goi aurrekaldean, bularrezurrean insertatuta.
  - g `w7/3.1/p9/s2` ○ Saihets-hezur atala: saihets hezurretan insertatuta.

4. «Gerriko atalean bi zutabe bereizten dira.»
  _t=0.2987 · argi: gerriko-atala, diafragmaren-zutabeak_
  - Ez dut ulertu: «Gerriko atala bi zutabetan amaitzen da, ornoetara lotuta.»
  - **F** `w7/3.1/p9/s4` Bertan bi zutabe bereizten dira: eskubikoa, hasierako 3 gerri-ornoen aurre alboko aurpegian insertatzen da eta ezkerrekoa, lehenengo 2 gerri-ornoen aurre alboko paretetan insertatzen da.

5. «Eskuineko zutabea hasierako hiru gerri-ornoetan insertatzen da; ezkerrekoa, lehenengo bietan.»
  _t=0.2987 · emphasis · argi: diafragmaren-zutabeak · arbelean: b-zutabeak_
  - Ez dut ulertu: «Eskuineko zutabea hiru gerri-ornotan lotzen da; ezkerrekoa, bitan bakarrik.»
  - **F** `w7/3.1/p9/s4` Bertan bi zutabe bereizten dira: eskubikoa, hasierako 3 gerri-ornoen aurre alboko aurpegian insertatzen da eta ezkerrekoa, lehenengo 2 gerri-ornoen aurre alboko paretetan insertatzen da.

6. «Bi zutabe horien artean erdiko lotailu arkutua kokatzen da.»
  _t=0.2987 · argi: erdiko-lotailu-arkutua_
  - Ez dut ulertu: «Bi zutabeen artean zubi moduko lotailu bat dago: erdiko lotailu arkutua.»
  - **F** `w7/3.1/p9/s5` Bi zutabe horien artean erdiko lotailu arkutua kokatzen da.

7. «Irudi hau mozketa frontala da, aurretik ikusita: abdomeneko aurreko pareta eta organo guztiak kendu dira.»
  _t=0.2987_
  - Ez dut ulertu: «Hau aurretik begiratzen dugu, sabelaren horma eta barruko organoak kenduta.»
  - **F** `w7/3.1/p10/s2` Mozketa frontala aurretik ikusita, kendu egin dira abdomeneko aurreko pareta eta abdomeneko organo guztiak.

8. «Hainbat egiturak zeharkatzen dute. Toraxeko aorta aortaren hiatotik sartzen da abdomenera, erdiko lotailu arkutua zeharkatuz.»
  _t=0.448 · argi: aorta, aortaren-hiatoa, erdiko-lotailu-arkutua_
  - Ez dut ulertu: «Zulo batzuetatik egiturak pasatzen dira. Aorta aortaren hiatotik pasatzen da, erdiko lotailu arkutuaren ondotik.»
  - g `w7/3.1/p14/s1` Diafragmatik egitura asko pasatzen dira eta hauek dira diafragma zeharkatzen duten egiturak:
  - **F** `w7/3.1/p15/s1` ● Toraxeko aorta: aorta zulotik (aortaren hiatoa), erdiko lotailu arkua zeharkatuz abdomenera sartzen da, bertan bere ibilbidea egiten du et aazkenean bukaerako adarrak ematen ditu: arteria iliako primitiboak.

9. «Beheko kaba zaina, abdomeneko zain garrantzitsuena, zentro tendinosoa zeharkatzen du, erdiko eta eskuineko hostoen artean.»
  _t=0.448 · emphasis · argi: beheko-kaba-zaina, zentro-tendinosoa, beheko-kabaren-zuloa · arbelean: b-zuloak_
  - Ez dut ulertu: «Beheko kaba zaina tendoiaren erdiko eta eskuineko hostoen artetik igotzen da, eta eskuineko aurikulara iristen da.»
  - **F** `w7/3.1/p16/s1` ● Beheko kaba zaina: abdomeneko zain garrantzitsuena.
  - **F** `w7/3.1/p16/s2` Peritoneo atzeko espaziotik igo, diafragma (erdiko eta eskuineko hostoen artean) zeharkatzen du eta toraxean sartzen da, zuzenena eskuineko aurikulara (diafragmaren goiko aurpegian).
  - g `w7/3.1/p8/s3` Diafragmaren zentro tendinosoan 3 hosto ezberdin bereizten dira: eskuineko, erdiko eta ezkerreko hostoak.

10. «Hestegorria toraxetik jaisten da, hestegorriaren hiatotik pasatzen da, eta abdomeneko hestegorria bihurtzen da.»
  _t=0.448 · argi: hestegorria, hestegorriaren-hiatoa_
  - Ez dut ulertu: «Hestegorria toraxetik dator, bere zulotik pasatzen da, hestegorriaren hiatotik, eta abdomenean jarraitzen du.»
  - **F** `w7/3.1/p17/s1` ● Hestegorria: aurreko hestetik sortuko da, toraxetik jaisten da, diafragma zeharkatzen du eta abdomeneko hestegorria bihurtuko da.

11. «Beste batzuk ere pasatzen dira: nerbio begetatiboak eta toraxeko nerbio esplaknikoak, besteak beste.»
  _t=0.448_
  - Ez dut ulertu: «Nerbio batzuk ere pasatzen dira: nerbio begetatiboak eta toraxeko nerbio esplaknikoak.»
  - **F** `w7/3.1/p18/s1` ● Nebio begetatibo desberdinak
  - **F** `w7/3.1/p19/s1` ● Toraxeko nerbio esplaknikoak
  - **F** `w7/3.1/p20/s1` ● …

12. «Laburpena: diafragmaren zuntz muskularrak aurretik askoz gorago insertatzen dira atzetik baino.»
  _t=0.5787 · emphasis · argi: diafragma, bularrezur-atala, gerriko-atala · arbelean: b-makurdura_
  - Ez dut ulertu: «Diafragma aurrean altu lotzen da, bularrezurrean; atzean, berriz, askoz beherago, gerri-ornoetan.»
  - **F** `w7/3.1/p11/s1` LABURPENA: Diafragmaren zuntz muskularrak aurretik askoz gorago insertatzen dira atzetik baino, atzetik askoz beherago insertatzen dira.

- Arbela `b-zutabeak`: Zutabeak: eskuinekoa hasierako 3 gerri-ornoetan; ezkerrekoa lehenengo 2etan; tartean erdiko lotailu arkutua
  - **F** `w7/3.1/p9/s4` Bertan bi zutabe bereizten dira: eskubikoa, hasierako 3 gerri-ornoen aurre alboko aurpegian insertatzen da eta ezkerrekoa, lehenengo 2 gerri-ornoen aurre alboko paretetan insertatzen da.
  - **F** `w7/3.1/p9/s5` Bi zutabe horien artean erdiko lotailu arkutua kokatzen da.
- Arbela `b-zuloak`: Aorta: aortaren hiatoa. Beheko kaba: zentro tendinosoa (erdiko eta eskuineko hostoen artean)
  - **F** `w7/3.1/p15/s1` ● Toraxeko aorta: aorta zulotik (aortaren hiatoa), erdiko lotailu arkua zeharkatuz abdomenera sartzen da, bertan bere ibilbidea egiten du et aazkenean bukaerako adarrak ematen ditu: arteria iliako primitiboak.
  - **F** `w7/3.1/p16/s2` Peritoneo atzeko espaziotik igo, diafragma (erdiko eta eskuineko hostoen artean) zeharkatzen du eta toraxean sartzen da, zuzenena eskuineko aurikulara (diafragmaren goiko aurpegian).
  - g `w7/3.1/p8/s3` Diafragmaren zentro tendinosoan 3 hosto ezberdin bereizten dira: eskuineko, erdiko eta ezkerreko hostoak.
- Arbela `b-makurdura`: Aurrean gorago (bularrezurra), atzean beherago (gerri-ornoak)
  - **F** `w7/3.1/p11/s1` LABURPENA: Diafragmaren zuntz muskularrak aurretik askoz gorago insertatzen dira atzetik baino, atzetik askoz beherago insertatzen dira.
- Galdera (pool): mikro:7/diafragma-heldua:2
- Galdera (contrast): Aorta eta beheko kaba zaina: non zeharkatzen dute bakoitzak?

## 12. Osatu taula

Etapa: `diafragma-heldua` · 5 lerro · ~33 s hitz eginda

1. «Laburbilduz: septum transversumarekin zeloma bi zatitan banatzen da, goikoa eta behekoa.»
  _t=0.84 · summary_
  - Ez dut ulertu: «Gogoratu: septumak zeloma bitan zatitzen du, goiko zatia eta beheko zatia.»
  - **F** `w7/4/p3/s1` Septum tranversum atalaren agerpenarekin, enbrio barruko zeloma bi zatitan banatzen da: goikoa (hasierako perikardio barrunbea) eta behekoa (peritoneo barrunbea).

2. «Goikoan bi pleura barrunbe eta perikardio barrunbe bat sortzen dira; behekoa peritoneo barrunbea da.»
  _t=0.84 · summary · argi: pleura-barrunbea, perikardio-barrunbea, peritoneo-barrunbea_
  - Ez dut ulertu: «Goikotik hiru barrunbe: bi pleura barrunbe eta perikardio barrunbea. Behekoa peritoneo barrunbea da.»
  - g `w7/4/p5/s1` Hasierako perikardio barrunbean, 2 pleura barrunbe eta perikardio barrunbe bat agertzen da, paretako eta errai orriak desberdintzen dira.
  - **F** `w7/4/p3/s1` Septum tranversum atalaren agerpenarekin, enbrio barruko zeloma bi zatitan banatzen da: goikoa (hasierako perikardio barrunbea) eta behekoa (peritoneo barrunbea).

3. «Hestetik sortutako atalak hasieran peritoneo barrukoak dira, baina batzuk peritoneo kanpokoak bihurtzen dira, atzekaldean.»
  _t=0.84 · summary_
  - Ez dut ulertu: «Hesteko organoak hasieran barruan daude; batzuk gero atzera mugitzen dira eta atzeko hormari itsasten zaizkio.»
  - **F** `w7/4/p4/s1` Hestetik sortutako atalak hasieran peritoneo barruko egiturak dira, errai peritoneoz inguratuta daudelako, baina horietako batzuk ondoren peritoneo kanpokoak (atzekaldean kokatu) bihurtzen dira.

4. «Eta pleura barrunbeak espazio birtualak dira: egoera patologikoetan bakarrik bihurtzen dira errealak.»
  _t=0.84 · summary · argi: pleura-barrunbea_
  - Ez dut ulertu: «Pleura barrunbeek ez dute benetako hutsunerik; gaixotasunetan bakarrik irekitzen dira.»
  - **F** `w7/4/p5/s2` 2 pleura barrunbe horiek espazio birtualak dira (pareta eta erraia bata bestearen ondoan kokatzen dira), eta errealak bihurtzen dira soilik egoera patologikoetan.

5. «Orain zure txanda: osatu diafragmaren taula oroimenetik, eta gero galdera batzuk.»
  _t=0.84 · summary · argi: diafragma_
  - Ez dut ulertu: «Orain zu: bete taula buruz, eta gero erantzun galdera batzuei, gai osoari buruz.»
  - **F** `w7/3.1/p8/s1` Septum Transversumetik garatzen da diafragmaren erdian dagoen atal tendinosoa: diafragmaren zentro tendinosoa/erdiko tendoia.

- Galdera (fill): klasea:7/taula
- Galdera (pool): w7-q-barrunbe-kopurua

## Estaldura

- Funtsezko esaldiak: 66 / 111; klaseak esaten ditu: 66.
- Klaseak aipatzen dituen esaldi guztiak: 87.
- Hitz egiteko denbora: ~10 min (galderak aparte).
