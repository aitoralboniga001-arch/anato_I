# 9. gaiko klasea: iturriak

_Sortua: `npx tsx scripts/klasea/audit.ts 9`. F = funtsezkoa, g = garrantzitsua._

## 0. Gaur

Etapa: `muskulu-motak` · 8 lerro · ~45 s hitz eginda

1. «Kaixo! Gaur muskuluak ikasiko ditugu: nondik sortzen diren eta zein nerbiok inerbatzen dituen.»
  _t=0_
  - Ez dut ulertu: «Gaurko gaia: muskuluak. Nondik datozen, eta zein nerbiok mugiarazten dituen.»
  - **F** `w9/1/p3/s1` Orokorrean, gure gorputzeko gihar guztiak mesodermoaren ernetze orritik sortzen dira.

2. «Gure gorputzeko gihar guztiak mesodermotik sortzen dira, ernetze orri horretatik.»
  _t=0 · emphasis · argi: somitak, paretako-orria, errai-orria · arbelean: b-mesodermoa_
  - Ez dut ulertu: «Muskulu guztiak mesodermotik datoz. Mozketa honetan haren hiru iturriak ikusten dira.»
  - **F** `w9/1/p3/s1` Orokorrean, gure gorputzeko gihar guztiak mesodermoaren ernetze orritik sortzen dira.

3. «Hiru muskulu mota bereizten dira: ildaskatuak, leunak eta bihotzekoa.»
  _t=0_
  - Ez dut ulertu: «Hiru mota ikasiko ditugu: ildaskatuak, leunak eta bihotzekoa.»
  - g `w9/1/p4/s1` Hiru motatako muskuluak bereizten dira:

4. «Muskulu ildaskatuak, edo borondatezkoak, lokomozio sistemarekin eta mugimenduarekin erlazionatuta daude.»
  _t=0.12 · argi: muskulu-ildaskatuak_
  - Ez dut ulertu: «Muskulu ildaskatuak nahi dugunean mugitzen ditugu: ibiltzeko eta mugitzeko dira.»
  - **F** `w9/1/p5/s1` ● Muskulu ildaskatuak edo borondatezko muskuluak: Lokomozio sistemarekin/mugimenduarekin erlazionatuta daude.

5. «Muskulu leunak erraiekin doaz: hestearen inguruko alboko mesodermoaren errai orritik sortzen dira.»
  _t=0.64 · argi: muskulu-leuna, errai-orria_
  - Ez dut ulertu: «Muskulu leunak erraietan daude, eta hestearen inguruko errai orritik datoz.»
  - **F** `w9/1/p6/s1` ● Muskulu lisoak edo leunak (erraiekin erlazionatutako muskuluak): Heste eta hesteen eratorrien inguruan dagoen alboko mesodermoaren errai orritik sortzen dira.

6. «Miokardioa, bihotzeko muskulua, bihotz hodiaren inguruko errai orritik sortzen da.»
  _t=0.64 · argi: miokardioa, errai-orria · arbelean: b-hiru-mota_
  - Ez dut ulertu: «Bihotzeko muskulua, miokardioa, bihotz hodiaren inguruko errai orritik dator.»
  - **F** `w9/1/p7/s1` ● Bihotzeko muskulua edo miokardioa: Bihotz hodiaren inguruan kokatzen den alboko mesodermoaren errai orritik sortzen da.

7. «Salbuespenak badira: errai batzuetako gihar batzuk ektodermotik sortzen dira.»
  _t=0.82 · caution_
  - Ez dut ulertu: «Kontuz, salbuespen batzuk daude: muskulu gutxi batzuk ektodermotik datoz.»
  - **F** `w9/1/p3/s2` Salbuespenak badira: errai batzuetan diren gihar batzuk ektodermotik sortzen dira: begi- niniko muskulu estutazil eta zabaltzailea, titi-guruinetako hodi galaktoforoan dauden muskuluak, izerdi guruinetako muskulu lisoak…

8. «Adibidez, begi-niniko muskuluak, zelula mioepitelialak eta izerdi guruinetako muskulu lisoak.»
  _t=0.82 · argi: begi-niniko-muskuluak, zelula-mioepitelialak, izerdi-guruinak_
  - Ez dut ulertu: «Hauek dira: begi-niniko muskuluak, titiko zelula mioepitelialak eta izerdi guruinetako muskulu lisoak.»
  - **F** `w9/1/p3/s2` Salbuespenak badira: errai batzuetan diren gihar batzuk ektodermotik sortzen dira: begi- niniko muskulu estutazil eta zabaltzailea, titi-guruinetako hodi galaktoforoan dauden muskuluak, izerdi guruinetako muskulu lisoak…

- Arbela `b-mesodermoa`: Gihar guztiak mesodermotik (salbuespen batzuk ektodermotik)
  - **F** `w9/1/p3/s1` Orokorrean, gure gorputzeko gihar guztiak mesodermoaren ernetze orritik sortzen dira.
  - **F** `w9/1/p3/s2` Salbuespenak badira: errai batzuetan diren gihar batzuk ektodermotik sortzen dira: begi- niniko muskulu estutazil eta zabaltzailea, titi-guruinetako hodi galaktoforoan dauden muskuluak, izerdi guruinetako muskulu lisoak…
- Arbela `b-hiru-mota`: Ildaskatuak: mugimendua. Leunak: erraiak, errai orritik. Miokardioa: bihotz hodiaren inguruko errai orritik
  - **F** `w9/1/p5/s1` ● Muskulu ildaskatuak edo borondatezko muskuluak: Lokomozio sistemarekin/mugimenduarekin erlazionatuta daude.
  - **F** `w9/1/p6/s1` ● Muskulu lisoak edo leunak (erraiekin erlazionatutako muskuluak): Heste eta hesteen eratorrien inguruan dagoen alboko mesodermoaren errai orritik sortzen dira.
  - **F** `w9/1/p7/s1` ● Bihotzeko muskulua edo miokardioa: Bihotz hodiaren inguruan kokatzen den alboko mesodermoaren errai orritik sortzen da.
- Galdera (predict): Zer uste duzu: zein ernetze orritatik datoz gihar gehienak?

## 1. Somitomeroak eta somitak

Etapa: `ildaskatuak` · 5 lerro · ~30 s hitz eginda

1. «Muskulu ildaskatu guztiak mesodermo paraxialetik sortzen dira.»
  _t=0 · emphasis · argi: mesodermo-paraxiala · arbelean: b-paraxiala_
  - Ez dut ulertu: «Muskulu ildaskatu guztiak hodi neuralaren bi aldeetako banda batetik datoz: mesodermo paraxialetik.»
  - **F** `w9/2/p3/s1` Muskulu ildaskatu guztiak mesodermo paraxialetik sortzen dira.

2. «Alde zefalikoan mesodermo hori segmentatu egiten da, baina ez osorik: somitomeroak agertzen dira, paretarik gabe.»
  _t=0.08 · argi: somitomeroak_
  - Ez dut ulertu: «Buruan zatiketa ez da osoa: somitomeroak sortzen dira, paretarik gabeko pilak.»
  - **F** `w9/2/p3/s2` Alde zefalikoan mesordermo hori segmentatu egiten da baina segmentazioa ez da osoa: somitomeroak agertzen dira (ez da gertatuko somitetan bezala pareten diferentziazioa).

3. «Alde okzipitaletik behera, berriz, zatiketa osoa da, eta somitak agertzen dira.»
  _t=0.17 · argi: somitak, somita-okzipitalak · arbelean: b-zatiketa_
  - Ez dut ulertu: «Hortik behera zatiketa osoa da: somitak sortzen dira, eta lehenengoak somita okzipitalak dira.»
  - **F** `w9/2/p3/s3` Alde okzipitaletik beherako mesodermoan, berriz, zatitze prozesu osoa ematen da eta somitak agertzen dira.

4. «Buruko muskulu ildaskatuak batez ere somitomeroetatik sortzen dira, baita somita okzipitaletatik ere.»
  _t=0.26 · argi: somitomeroak, somita-okzipitalak_
  - Ez dut ulertu: «Buruko muskulu gehienak somitomeroetatik datoz; batzuk, somita okzipitaletatik.»
  - **F** `w9/2/p4/s1` Alde zefalikoan dauden muskulu ildaskatuak (buruan, baita faringean eta laringean) batez ere somitomeroetako mesodermotik sortzen dira (baita somita okzipitaletik ere).

5. «Gainerako gorputzeko muskulu ildaskatuak, berriz, somitetatik sortzen dira.»
  _t=0.36 · emphasis · argi: somitak, miotoma_
  - Ez dut ulertu: «Gorputzeko beste muskulu ildaskatu guztiak somitetatik datoz, haien miotometatik.»
  - **F** `w9/2/p5/s1` Gainerako gorputzaren eskualdeetan dauzkagun muskulu ildaskatuak somita desberdinetatik sortzen dira.

- Arbela `b-paraxiala`: Muskulu ildaskatu guztiak: mesodermo paraxiala
  - **F** `w9/2/p3/s1` Muskulu ildaskatu guztiak mesodermo paraxialetik sortzen dira.
- Arbela `b-zatiketa`: Buruan somitomeroak (zatiketa ez osoa); okzipitaletik behera somitak (zatiketa osoa)
  - **F** `w9/2/p3/s2` Alde zefalikoan mesordermo hori segmentatu egiten da baina segmentazioa ez da osoa: somitomeroak agertzen dira (ez da gertatuko somitetan bezala pareten diferentziazioa).
  - **F** `w9/2/p3/s3` Alde okzipitaletik beherako mesodermoan, berriz, zatitze prozesu osoa ematen da eta somitak agertzen dira.
- Galdera (contrast): Somitomeroak eta somitak: zertan dira desberdinak?
- Galdera (pool): w9-q-ildaskatu-jatorria

## 2. Begiaren muskuluak

Etapa: `somitomeroak-burua` · 8 lerro · ~45 s hitz eginda

1. «Buruko eta lepoko muskulu ildaskatuak bi tokitan sortzen dira: begiaren inguruan eta faringe arkuak deituriko egituretan.»
  _t=0 · argi: begia, faringe-arkuak_
  - Ez dut ulertu: «Buruko muskuluak bi lekutan sortzen dira: begiaren inguruan, eta faringe arkuak deitzen ditugun egituretan.»
  - **F** `w9/2.1/p3/s1` Buruko eta lepoko muskulu ildaskatuak arku faringeo desberdinetan eta begiaren inguruan dagoen mesodermotik sortzen dira.

2. «Guztira 7 somitomero daude, egitura bikoitzak.»
  _t=0.1 · argi: somitomeroak_
  - Ez dut ulertu: «Zazpi somitomero daude, eta bikoitzak dira, bikoteak.»
  - **F** `w9/2.1.1/p3/s1` Guztira 7 somitomero daude eta egitura bikoitzak dira, mesodermo paraxialetik sortutakoak: 1. Begiaren inguruko muskulu ildaskatuak (begia mugitzeko) 1., 2., 3. eta 5. somitomeroen mesodermotik sortzen dira.

3. «Begia mugitzeko muskuluak 1., 2., 3. eta 5. somitomeroetatik sortzen dira.»
  _t=0.1 · emphasis · argi: begiaren-kanpoko-muskuluak · arbelean: b-begia_
  - Ez dut ulertu: «Begiaren muskuluak lau somitomerotatik datoz: lehena, bigarrena, hirugarrena eta bosgarrena.»
  - **F** `w9/2.1.1/p3/s1` Guztira 7 somitomero daude eta egitura bikoitzak dira, mesodermo paraxialetik sortutakoak: 1. Begiaren inguruko muskulu ildaskatuak (begia mugitzeko) 1., 2., 3. eta 5. somitomeroen mesodermotik sortzen dira.

4. «1. eta 2. somitomeroetatik goiko, beheko eta erdialdeko muskulu zuzenak eta beheko muskulu laprana sortzen dira.»
  _t=0.2 · argi: begi-goiko-zuzena, begi-beheko-zuzena, begi-erdiko-zuzena, begi-beheko-laprana_
  - Ez dut ulertu: «Lehen bi somitomeroetatik lau muskulu: goiko, beheko eta erdialdeko zuzenak, eta beheko muskulu laprana.»
  - **F** `w9/2.1.1/p3/s2` ○ 1 eta 2 somitomeroetan dagoen mesodermotik begiaren inguruko muskulu ildaskatuak sortzen dira: begiaren goiko, beheko eta erdialdeko muskulu zuzenak eta begiaren beheko muskulu laprana.

5. «3. somitomerotik goiko muskulu laprana sortzen da, eta 5.etik alboko muskulu zuzena.»
  _t=0.38 · argi: begi-goiko-laprana, begi-alboko-zuzena_
  - Ez dut ulertu: «Hirugarren somitomerotik goiko muskulu laprana; bosgarrenetik alboko muskulu zuzena.»
  - g `w9/2.1.1/p3/s3` ○ 3. somitomeroko mesodermotik begiaren goiko muskulu laprana.
  - g `w9/2.1.1/p3/s4` ○ 5. somitomeroaren mesodermotik begiaren alboko muskulu zuzena sortzen da.

6. «Muskulu horiek hiru nerbio kranialek inerbatzen dituzte.»
  _t=0.46_
  - Ez dut ulertu: «Hiru nerbio kranial arduratzen dira begiaren muskuluez.»
  - g `w9/2.1.1/p4/s1` Muskulu guzti hauen inerbazioan 3 gara nerbio (entzefaloarekin erlazionatzen diren nerbioak) desberdinek parte hartzen dute.

7. «Hirugarrenak, nerbio begi eragileak, 1. eta 2. somitomeroetatik sortutakoak inerbatzen ditu.»
  _t=0.46 · emphasis · argi: nerbio-begi-eragilea · arbelean: b-begi-nerbioak_
  - Ez dut ulertu: «Hirugarren nerbioa, begi eragilea, lehen bi somitomeroetatik sortutako lau muskuluetara doa.»
  - **F** `w9/2.1.1/p4/s3` Beraz hirugarren gara nerbioak 1 eta 2 somitomeroetatik sortutako muskuluak inerbatzen ditu, laugarrenak 3. somitomeroetik sortutakoak eta seigarrenak 5. somitomeroetaik eratorriak diren muskuluak.

8. «Laugarrenak, troklea nerbioak, 3.etik sortutakoa; eta seigarrenak, nerbio aldentzaileak, 5.etik sortutakoa.»
  _t=0.46 · argi: nerbio-troklearra, nerbio-aldentzailea_
  - Ez dut ulertu: «Laugarrena, troklea nerbioa, goiko laprana; seigarrena, nerbio aldentzailea, alboko zuzena.»
  - **F** `w9/2.1.1/p4/s3` Beraz hirugarren gara nerbioak 1 eta 2 somitomeroetatik sortutako muskuluak inerbatzen ditu, laugarrenak 3. somitomeroetik sortutakoak eta seigarrenak 5. somitomeroetaik eratorriak diren muskuluak.

- Arbela `b-begia`: Begiaren muskuluak: 1., 2., 3. eta 5. somitomeroetatik
  - **F** `w9/2.1.1/p3/s1` Guztira 7 somitomero daude eta egitura bikoitzak dira, mesodermo paraxialetik sortutakoak: 1. Begiaren inguruko muskulu ildaskatuak (begia mugitzeko) 1., 2., 3. eta 5. somitomeroen mesodermotik sortzen dira.
- Arbela `b-begi-nerbioak`: 1.–2. somitomeroak: III. 3.a: IV. 5.a: VI
  - **F** `w9/2.1.1/p4/s3` Beraz hirugarren gara nerbioak 1 eta 2 somitomeroetatik sortutako muskuluak inerbatzen ditu, laugarrenak 3. somitomeroetik sortutakoak eta seigarrenak 5. somitomeroetaik eratorriak diren muskuluak.
- Galdera (contrast): Goiko muskulu laprana eta alboko muskulu zuzena: zein nerbiok inerbatzen du bakoitza?

## 3. Faringe arkuetako muskuluak

Etapa: `somitomeroak-burua` · 7 lerro · ~36 s hitz eginda

1. «Beste somitomero batzuetako mesodermoak lepo mailan faringe arkuak sortzen ditu.»
  _t=0.56 · argi: faringe-arkuak, lehen-faringe-arkua, hioide-arkua, hirugarren-faringe-arkua_
  - Ez dut ulertu: «Beste somitomero batzuk lepora doaz, eta han faringe arkuak sortzen dituzte, muskuluak egiteko.»
  - g `w9/2.1.1/p5/s1` Beste somitomero jakin batzuetako mesodermoak lepo mailan arku faringeo edo brakialak (egitura bilateralak) sortzen ditu.

2. «4. somitomeroa 1. faringe arkuan kokatzen da, eta hortik muskulu murtsikatzaileak sortzen dira, barailaren jasotzaileak.»
  _t=0.66 · argi: lehen-faringe-arkua, muskulu-murtsikatzaileak · arbelean: b-arkuak_
  - Ez dut ulertu: «Laugarren somitomeroa 1. faringe arkura doa: hortik murtsikatzeko muskuluak, barailaren jasotzaileak.»
  - **F** `w9/2.1.1/p5/s2` ○ 4. somitomeroko mesodermoa 1. arku faringeoan kokatzen da eta mesodermo horretatik muskulu murtsikatzaileak  (barailaren muskulu jasotzaileak) sortzen dira (Loki muskulua, maseter muskulua, alboko eta erdialdeko muskulu perigoidea…(horiek burua eta lepoaren eraketan ikasiko ditugu)).

3. «Nerbio trigeminoak inerbatzen ditu, bosgarren bikote kranialak.»
  _t=0.66 · argi: nerbio-trigeminoa_
  - Ez dut ulertu: «Horien nerbioa bosgarrena da: trigeminoa.»
  - g `w9/2.1.1/p5/s3` Muskulu guzti hauek bosgarren gara nerbioak inerbatzen ditu (trigemino gara nerbioa).

4. «6. somitomeroa 2. arkuan kokatzen da: hortik muskulu mimikoak, keinuak egiteko, eta barailaren jeistaileak.»
  _t=0.76 · argi: hioide-arkua, muskulu-mimikoak, barailaren-muskulu-jeistaileak_
  - Ez dut ulertu: «Seigarren somitomeroa bigarren arkura doa: hortik aurpegiko keinuen muskuluak eta barailaren jeistaileak.»
  - **F** `w9/2.1.1/p5/s4` ○ 6. somitomeroko mesodermoa 2. arku faringeoan kokatzen da eta bertako mesodermotik buruko (eta aurpegiko) muskulu mimikoak (keinuak egiteko batez ere) sortzen dira (barailaren muskulu jeistaileak).

5. «Haren nerbioa aurpegi nerbioa da, zazpigarrena.»
  _t=0.76 · argi: aurpegi-nerbioa_
  - Ez dut ulertu: «Bigarren arkuaren nerbioa aurpegi nerbioa da, zazpigarrena.»
  - g `w9/2.1.1/p5/s5` 2. faringe arkuaren gara nerbioa aurpegi nerbioa da (zazpigarrena).

6. «7. somitomeroa 3. arkuan kokatzen da, eta hortik muskulu estilofaringeoa sortzen da.»
  _t=0.86 · argi: hirugarren-faringe-arkua, muskulu-estilofaringeoa_
  - Ez dut ulertu: «Zazpigarren somitomeroa hirugarren arkura doa: hortik muskulu estilofaringeoa.»
  - **F** `w9/2.1.1/p5/s6` ○ 7. somitomeroaren mesodermoa 3. arku faringeoan kokatzen da eta bertatik muskulu estilofaringeoa sortzen da.

7. «Haren nerbioa bederatzigarrena da: nerbio glosofaringeoa.»
  _t=0.86 · argi: nerbio-glosofaringeoa_
  - Ez dut ulertu: «Hirugarren arkuaren nerbioa bederatzigarrena da, glosofaringeoa.»
  - g `w9/2.1.1/p5/s7` Bere gara nerbioa bederatzigarrena da, nerbio glosofaringeoa/mihi estarrietako nerbioa.

- Arbela `b-arkuak`: 4. somitomeroa: 1. arkua, murtsikatzaileak (V). 6.a: 2. arkua, mimikoak (VII). 7.a: 3. arkua, estilofaringeoa (IX)
  - **F** `w9/2.1.1/p5/s2` ○ 4. somitomeroko mesodermoa 1. arku faringeoan kokatzen da eta mesodermo horretatik muskulu murtsikatzaileak  (barailaren muskulu jasotzaileak) sortzen dira (Loki muskulua, maseter muskulua, alboko eta erdialdeko muskulu perigoidea…(horiek burua eta lepoaren eraketan ikasiko ditugu)).
  - **F** `w9/2.1.1/p5/s4` ○ 6. somitomeroko mesodermoa 2. arku faringeoan kokatzen da eta bertako mesodermotik buruko (eta aurpegiko) muskulu mimikoak (keinuak egiteko batez ere) sortzen dira (barailaren muskulu jeistaileak).
  - **F** `w9/2.1.1/p5/s6` ○ 7. somitomeroaren mesodermoa 3. arku faringeoan kokatzen da eta bertatik muskulu estilofaringeoa sortzen da.
- Galdera (contrast): 1. arkua eta 2. arkua: zein muskulu sortzen da bakoitzean?
- Galdera (pool): mikro:9/somitomeroak-burua:9

## 4. Somita okzipitalak

Etapa: `okzipitalak` · 7 lerro · ~38 s hitz eginda

1. «Somita okzipitalak hasieran 5 bikote dira, baina lehenengoa oso goiz desagertzen da: 4 geratzen dira.»
  _t=0 · argi: somita-okzipitalak_
  - Ez dut ulertu: «Hasieran bost bikote somita okzipital daude; lehena laster galtzen da, eta lau geratzen dira.»
  - **F** `w9/2.1.2/p3/s1` Somita okzipitalak hasieran 5 bikote dira, baina lehenengoa oso goiz desagertzen da eta 4 bikote soilik gelditzen dira.

2. «Haien mesodermoak mihiko muskuluen eraketan ere parte hartzen du.»
  _t=0 · argi: somita-okzipitalak_
  - Ez dut ulertu: «Somita horiek mihiko muskuluak egiten ere laguntzen dute.»
  - **F** `w9/2.1/p3/s3` Somita okzipitaleko mesodermoak parte hartzen du mihiaren muskuluen eraketan ere.

3. «1. eta 2. somita okzipitaletatik 4. eta 6. faringe arkuak sortzen dira, eta horietan laringearen muskulu ildaskatuak.»
  _t=0.1 · argi: laugarren-seigarren-arkuak, laringearen-muskuluak, somita-okzipitalak_
  - Ez dut ulertu: «Lehen bi somita okzipitaletatik laugarren eta seigarren arkuak sortzen dira; hor, laringearen muskuluak.»
  - **F** `w9/2.1.2/p4/s1` ● 1 eta 2. somita okzipitaletako mesodermo paraxialetik 4. eta 6. arku faringeoak sortzen dira eta horietan laringearen/zintzurraren muskulu ildaskatuak sortzen dira.

4. «Nerbio bagoak inerbatzen ditu, hamargarren bikote kranialak.»
  _t=0.1 · argi: nerbio-bagoa_
  - Ez dut ulertu: «Laringearen muskuluen nerbioa bagoa da, hamargarrena.»
  - g `w9/2.1.2/p4/s2` Vagus nerbioak (nerbio bagoa), 10. bikote kranealeko zuntz motoreek inerbatzen dituzte muskulu horiek.

5. «Azken somita okzipitaletatik, 2.etik 5.era, mihiaren muskulu guztiak sortzen dira, denak ildaskatuak.»
  _t=0.2 · argi: somita-okzipitalak, mihiaren-muskuluak · arbelean: b-okzipitalak_
  - Ez dut ulertu: «Azken somita okzipitaletatik mihiko muskulu guztiak sortzen dira, eta denak ildaskatuak dira.»
  - **F** `w9/2.1.2/p5/s1` ● Azken somita okzipitaletako (2-5 somitak) mesodermotik mihiaren muskulu guztiak sortzen dira, denak ildaskatuak.

6. «Nerbio hipoglosoak inerbatzen ditu, 12. bikote kranialak, eta zuntz motoreak bakarrik ditu.»
  _t=0.2 · argi: nerbio-hipoglosoa_
  - Ez dut ulertu: «Mihiko muskuluen nerbioa hipoglosoa da, hamabigarrena; zuntz motoreak bakarrik ditu.»
  - g `w9/2.1.2/p5/s2` 12. bikote kranealak edo nerbio hipoglosoak inerbatzen ditu eta honek zuntz motoreak ditu bakarrik.

7. «Beraz, buruko muskulu ildaskatu guztiak nerbio kranialek inerbatzen dituzte.»
  _t=0.3 · emphasis · argi: nerbio-kranialak · arbelean: b-kranialak_
  - Ez dut ulertu: «Laburbilduz: buruko muskulu ildaskatu guztiak nerbio kranialek mugitzen dituzte.»
  - **F** `w9/2.1.2/p6/s1` Beraz, alde zefalikoan dauden muskulu ildaskatu guztien inerbazioa, nerbio kranealen ardurapean dago.

- Arbela `b-okzipitalak`: Somita okzipitalak 1–2: 4. eta 6. arkuak, laringea (X). 2–5: mihia (XII)
  - **F** `w9/2.1.2/p4/s1` ● 1 eta 2. somita okzipitaletako mesodermo paraxialetik 4. eta 6. arku faringeoak sortzen dira eta horietan laringearen/zintzurraren muskulu ildaskatuak sortzen dira.
  - **F** `w9/2.1.2/p5/s1` ● Azken somita okzipitaletako (2-5 somitak) mesodermotik mihiaren muskulu guztiak sortzen dira, denak ildaskatuak.
- Arbela `b-kranialak`: Buruko muskulu ildaskatu guztiak: nerbio kranialak
  - **F** `w9/2.1.2/p6/s1` Beraz, alde zefalikoan dauden muskulu ildaskatu guztien inerbazioa, nerbio kranealen ardurapean dago.
- Galdera (contrast): Laringearen muskuluak eta mihiaren muskuluak: zein nerbiok inerbatzen ditu bakoitza?

## 5. Nerbio kranialen taula

Etapa: `okzipitalak` · 6 lerro · ~27 s hitz eginda

1. «Guztira 12 nerbio kraneal daude, baina guztiek ez dituzte zuntz motoreak.»
  _t=0.68 · argi: nerbio-kranialak · arbelean: b-hamabi_
  - Ez dut ulertu: «Hamabi nerbio kraneal ditugu; batzuek bakarrik dituzte muskuluetara doazen zuntzak.»
  - **F** `w9/2.1.3/p6/s1` Guztira 12 nerbio edo bikote kraneal dira.
  - g `w9/2.1.3/p6/s2` Hala ere, guztietan ez daude zuntz motoreak, baina batzuetan bai.

2. «Faringe arku bakoitzarekin nerbio kraneal bat konektatzen da.»
  _t=0.68 · argi: nerbio-kranialak_
  - Ez dut ulertu: «Arku bakoitzak bere nerbio kraneala du.»
  - g `w9/2.1.3/p6/s3` Arku brankial bakoitzarekin nerbio bikote kraneal bat konektatzen da.

3. «Taulan aurreko guztia laburtzen da: muskuluen izena, jatorria eta inerbazioa.»
  _t=0.74 · argi: begiaren-kanpoko-muskuluak, muskulu-murtsikatzaileak_
  - Ez dut ulertu: «Taula honek dena batzen du: zein muskulu, nondik datorren eta zein nerbiok mugitzen duen.»
  - g `w9/2.1.3/p7/s1` Ondorengo taulan, aurrean aipatutako guztia laburtura agertzen da, hau da, muskuluen izena, jatorria eta haien inerbazioa.

4. «Ez da beharrezkoa muskulu guztien izenak ikastea.»
  _t=0.74 · caution_
  - Ez dut ulertu: «Lasai: ez dituzu muskulu guztien izenak buruz ikasi behar.»
  - g `w9/2.1.3/p7/s2` Ez da beharrezkoa muskulu guztien izenak ikastea.

5. «1. eta 2. somita okzipitalak 4. eta 6. faringe arkuetan garatzen dira.»
  _t=0.84 · argi: somita-okzipitalak, laringearen-muskuluak_
  - Ez dut ulertu: «Lehen bi somita okzipitalak laugarren eta seigarren arkuetan garatzen dira.»
  - **F** `w9/2.1.4/p20/s1` 1 eta 2 somita okzipitalak (4. eta 6. arku faringeotan garatu)

6. «Nerbio batek mota askotako zuntzak izan ditzake; hipoglosoak, aldiz, zuntz motoreak bakarrik ditu.»
  _t=0.92 · argi: nerbio-hipoglosoa_
  - Ez dut ulertu: «Nerbio askok zuntz mota asko dituzte; hipoglosoak, ordea, motoreak bakarrik.»
  - g `w9/2.1/p5/s1` TAULAK EZ DU ESAN NAHI BAKOITZAK ZUNTZ BAKARRA DUELA → mota anitzeko zuntzak izan ditzakete.
  - **F** `w9/2.1/p5/s3` Hipoglosoak, aldiz, soilik zuntz motoreak izango ditu.

- Arbela `b-hamabi`: 12 nerbio kraneal; ez guztiek zuntz motoreak
  - **F** `w9/2.1.3/p6/s1` Guztira 12 nerbio edo bikote kraneal dira.
  - g `w9/2.1.3/p6/s2` Hala ere, guztietan ez daude zuntz motoreak, baina batzuetan bai.
- Taula `tz-1-2`: 1. eta 2. somitomeroak → III: nerbio begi eragilea
  - **F** `w9/2.1.1/p4/s3` Beraz hirugarren gara nerbioak 1 eta 2 somitomeroetatik sortutako muskuluak inerbatzen ditu, laugarrenak 3. somitomeroetik sortutakoak eta seigarrenak 5. somitomeroetaik eratorriak diren muskuluak.
- Taula `tz-3`: 3. somitomeroa → IV: troklea nerbioa
  - **F** `w9/2.1.1/p4/s3` Beraz hirugarren gara nerbioak 1 eta 2 somitomeroetatik sortutako muskuluak inerbatzen ditu, laugarrenak 3. somitomeroetik sortutakoak eta seigarrenak 5. somitomeroetaik eratorriak diren muskuluak.
- Taula `tz-4`: 4. somitomeroa (1. arkua) → V: trigeminoa
  - **F** `w9/2.1.1/p5/s2` ○ 4. somitomeroko mesodermoa 1. arku faringeoan kokatzen da eta mesodermo horretatik muskulu murtsikatzaileak  (barailaren muskulu jasotzaileak) sortzen dira (Loki muskulua, maseter muskulua, alboko eta erdialdeko muskulu perigoidea…(horiek burua eta lepoaren eraketan ikasiko ditugu)).
  - g `w9/2.1.1/p5/s3` Muskulu guzti hauek bosgarren gara nerbioak inerbatzen ditu (trigemino gara nerbioa).
- Taula `tz-5`: 5. somitomeroa → VI: nerbio aldentzailea
  - **F** `w9/2.1.1/p4/s3` Beraz hirugarren gara nerbioak 1 eta 2 somitomeroetatik sortutako muskuluak inerbatzen ditu, laugarrenak 3. somitomeroetik sortutakoak eta seigarrenak 5. somitomeroetaik eratorriak diren muskuluak.
- Taula `tz-6`: 6. somitomeroa (2. arkua) → VII: aurpegi nerbioa
  - **F** `w9/2.1.1/p5/s4` ○ 6. somitomeroko mesodermoa 2. arku faringeoan kokatzen da eta bertako mesodermotik buruko (eta aurpegiko) muskulu mimikoak (keinuak egiteko batez ere) sortzen dira (barailaren muskulu jeistaileak).
  - g `w9/2.1.1/p5/s5` 2. faringe arkuaren gara nerbioa aurpegi nerbioa da (zazpigarrena).
- Taula `tz-7`: 7. somitomeroa (3. arkua) → IX: glosofaringeoa
  - **F** `w9/2.1.1/p5/s6` ○ 7. somitomeroaren mesodermoa 3. arku faringeoan kokatzen da eta bertatik muskulu estilofaringeoa sortzen da.
  - g `w9/2.1.1/p5/s7` Bere gara nerbioa bederatzigarrena da, nerbio glosofaringeoa/mihi estarrietako nerbioa.
- Taula `tz-ok-1-2`: 1. eta 2. somita okzipitalak (4. eta 6. arkuak) → X: bagoa
  - **F** `w9/2.1.2/p4/s1` ● 1 eta 2. somita okzipitaletako mesodermo paraxialetik 4. eta 6. arku faringeoak sortzen dira eta horietan laringearen/zintzurraren muskulu ildaskatuak sortzen dira.
  - g `w9/2.1.2/p4/s2` Vagus nerbioak (nerbio bagoa), 10. bikote kranealeko zuntz motoreek inerbatzen dituzte muskulu horiek.
- Taula `tz-ok-2-5`: 2.–5. somita okzipitalak → XII: hipoglosoa
  - **F** `w9/2.1.2/p5/s1` ● Azken somita okzipitaletako (2-5 somitak) mesodermotik mihiaren muskulu guztiak sortzen dira, denak ildaskatuak.
  - g `w9/2.1.2/p5/s2` 12. bikote kranealak edo nerbio hipoglosoak inerbatzen ditu eta honek zuntz motoreak ditu bakarrik.
- Galdera (contrast): Hipoglosoa eta trigeminoa: zer zuntz dituzte?
- Galdera (pool): mikro:9/okzipitalak:11

## 6. Ehun konektibozko patroiak

Etapa: `ehun-konektiboa` · 8 lerro · ~41 s hitz eginda

1. «Eskualde guztietako muskuluak garatzeko ehun konektibozko patroiak behar dira.»
  _t=0 · emphasis · argi: ehun-konektibozko-patroiak · arbelean: b-patroiak_
  - Ez dut ulertu: «Muskulu batek euskarri bat behar du hazteko: ehun konektibozko patroia.»
  - **F** `w9/2.1.4/p24/s1` Eskualde guztietako muskuluak garatzeko ehun konektibozko patroiak behar dira.

2. «Patroi horietara mioblastoak iristen dira, eta poliki-poliki muskulu bihurtzen dira.»
  _t=0 · argi: mioblastoak_
  - Ez dut ulertu: «Muskulu zelula gazteak, mioblastoak, patroira sartzen dira eta han muskulu bihurtzen dira.»
  - g `w9/2.1.4/p24/s2` Patroi horietara iristen diren zelula muskularren aitzindariak (mioblastoak) poliki-poliki garatu egiten dira eta muskuluak sortzen dituzte.

3. «Buruan, patroiak gandor neuraleko zelulek osatzen dituzte.»
  _t=0.12 · argi: gandor-neurala_
  - Ez dut ulertu: «Buruko patroiak gandor neuraletik datoz.»
  - **F** `w9/2.1.4/p25/s1` ● Buruan sortzen diren ehun konektibozko patroi horiek, gandor neuraletako zelulek osatzen dituzte.

4. «Lepoan, somitaren mesodermo zelulek.»
  _t=0.24 · argi: somitak_
  - Ez dut ulertu: «Lepokoak somitetatik datoz.»
  - **F** `w9/2.1.4/p25/s2` Horiek somitaren mesodermo zelulek osatzen dituzte.

5. «Gorputzaren paretetan eta gorputz-adarretan, alboko mesodermoaren paretako orriko zelulek.»
  _t=0.36 · argi: paretako-orria, gorputz-adarren-mesenkima_
  - Ez dut ulertu: «Paretetako eta gorputz-adarretako patroiak paretako orritik datoz.»
  - **F** `w9/2.1.4/p26/s1` ● Gorputzaren paretetan eta goiko eta beheko gorputz adarretan dauden muskuluak garatzeko ehun konektibozko patroi horiek, alboko mesodermoaren parteako zelula mesodermikoek osatzen dute.

6. «Mioblastoak elkarren artean fusionatzen dira, eta nukleo ugariko zuntzak osatzen dituzte.»
  _t=0.6 · argi: mioblastoak, zuntz-muskularrak · arbelean: b-fusioa_
  - Ez dut ulertu: «Mioblastoak elkartu egiten dira, eta zuntz luze bat sortzen da, nukleo askorekin.»
  - **F** `w9/2.1.4/p27/s1` Bi motatako domeinuetan dauden zelula aintzindariak migratu egiten dute domeinu abakzialera eta zelula horien desberdintze prozezuetan (aintzindariak, mioblastoak) haien artean fusionatu egiten dituzte, nukleo ugari dituzten zuntzak osatuz.

7. «Zuntz horiek ildaskatuak dira. Gogoratu: ildaskatu, mugimendu.»
  _t=0.6 · argi: zuntz-muskularrak_
  - Ez dut ulertu: «Zuntz horiek ildaskatuak dira, eta ildaskatuak mugimenduarekin lotzen dira.»
  - g `w9/2.1.4/p27/s2` Hauek muskulo ildaskatuaren osagarriak izango dira (mikrofibrila ildoak osatzen direnez muskulo ildaskatuak izango dira)
  - g `w9/2.1.4/p28/s1` * Ildaskatu=mugimendu.

8. «Gorputz-adarrek biratu ondoren, tolestatzaileak eta hedatzaileak alderantziz kokatzen dira goiko eta beheko adarretan.»
  _t=0.72 · argi: muskulu-tolestatzaileak, muskulu-hedatzaileak_
  - Ez dut ulertu: «Biraketaren ondoren, goiko eta beheko adarretan tolestatzaileen eta hedatzaileen aldeak alderantzizkoak dira.»
  - **F** `w9/2.1.3/p5/s3` Beheko adarrean tolestatzailea aurrean eta hedatzaiea atzean ikusiko dugu eta goiko adarrean alderantziz, hau da, hedatazilea aurrean egongo da eta tolestatzailea atzealdean.

- Arbela `b-patroiak`: Patroiak: buruan gandor neurala; lepoan somitak; paretetan eta gorputz-adarretan paretako orria
  - **F** `w9/2.1.4/p25/s1` ● Buruan sortzen diren ehun konektibozko patroi horiek, gandor neuraletako zelulek osatzen dituzte.
  - **F** `w9/2.1.4/p25/s2` Horiek somitaren mesodermo zelulek osatzen dituzte.
  - **F** `w9/2.1.4/p26/s1` ● Gorputzaren paretetan eta goiko eta beheko gorputz adarretan dauden muskuluak garatzeko ehun konektibozko patroi horiek, alboko mesodermoaren parteako zelula mesodermikoek osatzen dute.
- Arbela `b-fusioa`: Mioblastoak fusionatu: nukleo ugariko zuntzak
  - **F** `w9/2.1.4/p27/s1` Bi motatako domeinuetan dauden zelula aintzindariak migratu egiten dute domeinu abakzialera eta zelula horien desberdintze prozezuetan (aintzindariak, mioblastoak) haien artean fusionatu egiten dituzte, nukleo ugari dituzten zuntzak osatuz.
- Galdera (contrast): Buruko eta gorputz-adarretako muskuluen patroiak: nork osatzen ditu bakoitza?

## 7. Somitaren paretak

Etapa: `somitaren-paretak` · 11 lerro · ~68 s hitz eginda

1. «Enbriologia orokorreko birpasoa: hasieran muskulu horiek guztiak somitetatik sortzen dira.»
  _t=0 · recall · argi: somitak_
  - Ez dut ulertu: «Gogora dezagun enbriologia orokorra: muskulu horiek guztiak somitetatik datoz.»
  - **F** `w9/2.2/p3/s1` ENBRIOLOGIA OROKORREAN EMANDAKO INFORMAZIOAREN BIRPASOA:
  - g `w9/2.2/p4/s1` Hasieran, muskulu horiek guztiak somitetako mesodermotik sortzen dira.

2. «Somitan hiru pareta bereizten dira: atzekoa edo dortsala, erdialdekoa edo mediala, eta aurrekoa.»
  _t=0.1 · argi: somitaren-atzeko-pareta, somitaren-erdialdeko-pareta, somitaren-aurreko-pareta, somitak_
  - Ez dut ulertu: «Somitak hiru pareta ditu: atzekoa, erdialdekoa eta aurrekoa.»
  - **F** `w9/2.2/p5/s1` Somitetan pareta ezberdinak bereizten dira: pareta dortsala edo atzeko pareta, erdialdeko pareta edo pareta mediala eta aurreko pareta.

3. «Erdialdeko eta aurreko paretetako zelulak esklerotoma bihurtzen dira.»
  _t=0.2 · argi: esklerotoma, somitaren-aurreko-pareta_
  - Ez dut ulertu: «Erdialdeko eta aurreko paretek esklerotoma osatzen dute.»
  - **F** `w9/2.2/p6/s1` Aurreko paretako zelulak: somitetako atze erdialdeko eta aurreko paretetako zelulek dauzkaten ezaugarriak aldatu eta beste motatako zelulak bihurtzen dira: esklerotoma zelulak.

4. «Esklerotoma zelulak erdikaldera migratzen dute, hodi neurala eta notokorda inguratzeko; hortik bizkarrezurra sortuko da.»
  _t=0.2 · argi: esklerotoma, hodi-neurala, notokorda · arbelean: b-esklerotoma_
  - Ez dut ulertu: «Esklerotoma hodi neuralaren eta notokordaren inguruan biltzen da, eta hortik bizkarrezurra sortzen da.»
  - g `w9/2.2/p6/s3` Zelula hauek, erdikaldera migratzen dute erdian dauden hodi neurala eta notokorda inguratzeko.
  - g `w9/2.2/p6/s4` Hemendik bizkar hezurraren ornoak sortuko dira.

5. «Esklerotomako zelula batzuek, ordea, albora migratzen dute, eta somitaren alboko muga igarotzen dute.»
  _t=0.32 · argi: somitaren-alboko-muga, esklerotoma_
  - Ez dut ulertu: «Esklerotomako zelula batzuk albora irteten dira, somitaren alboko mugatik haratago.»
  - **F** `w9/2.2/p6/s5` Hala ere, esklorotomako zelula batzuek alboaldera migratzen dute, somitaren alboko muga igaro eta alboko mesodermoaren paretako orrira iristen dira.

6. «Horietatik sortzen dira, adibidez, gorputzaren aurrealdeko saihets kartilagoak.»
  _t=0.32 · argi: saihets-kartilagoa_
  - Ez dut ulertu: «Zelula horietatik saihets kartilagoak sortzen dira, gorputzaren aurrealdean.»
  - g `w9/2.2/p6/s6` Horietatik, adibidez, gorputzaren aurreko paretako saihets kartilagoak sortzen dira.

7. «Atzeko paretan, erdiko zelulek dermatoma osatzen dute; ertzetakoak muskulu zelulen aintzindariak dira.»
  _t=0.52 · argi: somitaren-atzeko-pareta, dermatoma, muskulu-zelula-atze-erdialdekoak, aurre-alboko-muskulu-zelulak_
  - Ez dut ulertu: «Atzeko paretaren erdian dermatoma dago; ertzetan, muskulu bihurtuko diren zelulak.»
  - g `w9/2.2/p9/s1` Atzeko paretako zelulak: Desberdintze-prozesu bat eginez, pareta erdikoek dermatoma zelula multzoa osatzen dute.
  - **F** `w9/2.2/p9/s2` Somitetako atzeko paretako ertzetan dauden zelulak, zelula muskularren aintzindariak dira.

8. «Muskulu zelula horiek dermatomaren alde bentralean miotoma osatzen dute.»
  _t=0.64 · argi: dermatoma, miotoma_
  - Ez dut ulertu: «Zelula horiek dermatomaren aurrean biltzen dira, eta miotoma osatzen dute.»
  - g `w9/2.2/p10/s1` 1) Alde batetik, muskulu zelula atze erdialekoek eta aurre alboko muskulu zelulak alde bentralera migratzen dute, eta dermatomaren alde bentralean zelula multzo bat osatzen dute, miotoma izenekoa.

9. «Miotomatik bizkarreko muskulu ildaskatuak, eskapula ingurukoak eta saihets artekoak sortzen dira.»
  _t=0.64 · emphasis · argi: miotoma · arbelean: b-miotoma_
  - Ez dut ulertu: «Miotomatik bizkarreko muskuluak, eskapula ingurukoak eta saihets artekoak datoz.»
  - **F** `w9/2.2/p10/s2` Miotoma multzoan dauden zeluletatik bizkarraren muskulu ildaskatuak, eskapula inguruan dauden muskuluak eta sahiets arteko muskuluak eratuko dituzte.

10. «Aurre-alboko zelula batzuek, berriz, alboko muga gurutzatu eta paretako orrira heltzen dira.»
  _t=0.76 · argi: aurre-alboko-muskulu-zelulak, paretako-orria_
  - Ez dut ulertu: «Beste zelula batzuk mugaz haratago joaten dira, alboko mesodermoaren paretako orrira.»
  - **F** `w9/2.2/p11/s1` 2) Bestetik, somitaren aurre alboko zelula batzuek albora migratzen dute, somitaren alboko muga gurutzatu eta alboko mesodermoaren pareta orrira heltzen dira, gorputz paretako muskulu ildaskatuak eta gorputz behe adarretako muskulu ildaskatuak sortzeko.

11. «Hortik gorputz paretako eta gorputz-adarretako muskulu ildaskatuak sortzen dira.»
  _t=0.76 · argi: paretako-orria_
  - Ez dut ulertu: «Han gorputz paretako eta gorputz-adarretako muskuluak egiten dituzte.»
  - **F** `w9/2.2/p11/s1` 2) Bestetik, somitaren aurre alboko zelula batzuek albora migratzen dute, somitaren alboko muga gurutzatu eta alboko mesodermoaren pareta orrira heltzen dira, gorputz paretako muskulu ildaskatuak eta gorputz behe adarretako muskulu ildaskatuak sortzeko.

- Arbela `b-esklerotoma`: Erdialdeko eta aurreko paretak: esklerotoma, ornoak
  - **F** `w9/2.2/p6/s1` Aurreko paretako zelulak: somitetako atze erdialdeko eta aurreko paretetako zelulek dauzkaten ezaugarriak aldatu eta beste motatako zelulak bihurtzen dira: esklerotoma zelulak.
  - g `w9/2.2/p6/s4` Hemendik bizkar hezurraren ornoak sortuko dira.
- Arbela `b-miotoma`: Miotoma: bizkarreko muskuluak, eskapula ingurukoak, saihets artekoak
  - **F** `w9/2.2/p10/s2` Miotoma multzoan dauden zeluletatik bizkarraren muskulu ildaskatuak, eskapula inguruan dauden muskuluak eta sahiets arteko muskuluak eratuko dituzte.
- Galdera (contrast): Esklerotoma eta miotoma: zer sortzen du bakoitzak?

## 8. Bi domeinuak

Etapa: `domeinuak` · 7 lerro · ~38 s hitz eginda

1. «Somitetako zelula batzuk alboko mesodermoaren paretako orrira migratzen dute.»
  _t=0 · argi: aurre-alboko-muskulu-zelulak, paretako-orria_
  - Ez dut ulertu: «Somitetako zelula batzuk paretako orrira joaten dira.»
  - **F** `w9/2.2.1/p3/s1` Somitetako zelula batzuk (zelula muskularrak eta eskletotomako zelula batzuk) migratzen dute alboko zelulen paretako orrira.

2. «Somitaren alboko mugak mesodermoa bi domeinutan banatzen du.»
  _t=0.1 · argi: somitaren-alboko-muga_
  - Ez dut ulertu: «Marra berde honek, somitaren alboko mugak, mesodermoa bi eremutan zatitzen du.»
  - **F** `w9/2.2.1/p4/s1` Somitaren alboko aldean somitaren alboko muga bat dagoela (irudian marra berdea) deskribatzen da eta honek mesodermoaren zelula multzoa 2 domeinuetan banatzen du:

3. «Domeinu primaxiala hodi neuralaren aldamenean dago, erdialdean, eta bertan daude somitak.»
  _t=0.2 · argi: domeinu-primaxiala, hodi-neurala, somitak_
  - Ez dut ulertu: «Domeinu primaxiala hodi neuralaren ondoan dago, erdialdean: somitena da.»
  - **F** `w9/2.2.1/p5/s1` DOMEINU PRIMAXIALA: hodi neuralaren aldamenean dagoen mesodermo- zelula multzoak osatutako domeinua, “erdialdean” dagoena.
  - g `w9/2.2.1/p5/s2` Bertan daude somitak.

4. «Domeinu horretatik bizkarreko muskuluak sortzen dira.»
  _t=0.2 · emphasis · argi: domeinu-primaxiala · arbelean: b-primaxiala_
  - Ez dut ulertu: «Domeinu primaxialetik bizkarreko muskuluak datoz.»
  - **F** `w9/2.2.1/p5/s3` Domeinu honetatik bizkarreko muskuluak sortzen dira.

5. «Domeinu abaxiala, berriz, paretako orriko zelulek eta bertara iritsitako somita-zelulek osatzen dute.»
  _t=0.32 · argi: domeinu-abaxiala, paretako-orria, aurre-alboko-muskulu-zelulak_
  - Ez dut ulertu: «Domeinu abaxiala paretako orria da, gehi bertara iritsitako somitetako zelulak.»
  - **F** `w9/2.2.1/p6/s1` DOMEINU ABAXIALA: alboko mesodermoaren paretako orrian dauden zelula mesodermikoak eta honetara iritsitako somita-zelulak.

6. «Hortik sortzen dira goiko eta beheko gorputz-adarretako muskulu guztiak.»
  _t=0.32 · emphasis · argi: domeinu-abaxiala · arbelean: b-abaxiala_
  - Ez dut ulertu: «Domeinu abaxialetik goiko eta beheko gorputz-adarretako muskulu guztiak datoz.»
  - g `w9/2.2.1/p6/s2` Domeinu abaxialetik muskulu infraioideoak, pektoralak, muskulu esternalak, abdomeneko muskulu gehienak eta diafragma pelbikoarena sortu egiten dira, hau da, goiko eta beheko gorputz adarreko muskulu guztiak.

7. «Lepoan, toraxean eta goiko gorputz-adarrean, muskulu batzuk primaxialak dira, eta beste batzuk abaxialak.»
  _t=0.44 · argi: domeinu-primaxiala_
  - Ez dut ulertu: «Lepoan, toraxean eta goiko gorputz-adarrean bi domeinuetako muskuluak nahasten dira.»
  - **F** `w9/2.2.1/p8/s3` Lepoan, toraxean/abdomenean, goiko gorputz adarrean… dauden muskulu batzuk domeinu primaxialetik sortu, eta besteak abaxialetik.

- Arbela `b-primaxiala`: Domeinu primaxiala: hodi neuralaren ondoan (somitak); bizkarreko muskuluak
  - **F** `w9/2.2.1/p5/s1` DOMEINU PRIMAXIALA: hodi neuralaren aldamenean dagoen mesodermo- zelula multzoak osatutako domeinua, “erdialdean” dagoena.
  - **F** `w9/2.2.1/p5/s3` Domeinu honetatik bizkarreko muskuluak sortzen dira.
- Arbela `b-abaxiala`: Domeinu abaxiala: paretako orria eta iritsitako somita-zelulak; gorputz-adarretako muskulu guztiak
  - **F** `w9/2.2.1/p6/s1` DOMEINU ABAXIALA: alboko mesodermoaren paretako orrian dauden zelula mesodermikoak eta honetara iritsitako somita-zelulak.
  - g `w9/2.2.1/p6/s2` Domeinu abaxialetik muskulu infraioideoak, pektoralak, muskulu esternalak, abdomeneko muskulu gehienak eta diafragma pelbikoarena sortu egiten dira, hau da, goiko eta beheko gorputz adarreko muskulu guztiak.
- Galdera (contrast): Domeinu primaxiala eta abaxiala: zein muskulu sortzen da bakoitzetik?
- Galdera (pool): w9-q-domeinu-abaxiala

## 9. Ornomuina

Etapa: `nerbio-espinala` · 8 lerro · ~39 s hitz eginda

1. «Bizkarrezurra ornoz osatuta dago; atzean, orno arkuak orno zuloa mugatzen du.»
  _t=0 · argi: orno-arkua, orno-zuloa_
  - Ez dut ulertu: «Bizkarrezurra orno askoren pila da; orno bakoitzaren atzean zulo bat dago, orno zuloa.»
  - **F** `w9/2.2.2/p3/s1` Bizkarrezurraren osagaiak ornoak dira.
  - g `w9/2.2.2/p3/s2` Gorputzaren atzeko aldean, arku neuralak kokatzen dira eta bi egitura hauek mugatzen duten zuloa, orno zuloa da.

2. «Orno guztiek hodi errakideoa osatzen dute, eta bertan ornomuina kokatzen da.»
  _t=0.08 · argi: hodi-errakideoa, ornomuina_
  - Ez dut ulertu: «Ornoen zuloek hodi bat egiten dute, hodi errakideoa, eta barruan ornomuina dago.»
  - **F** `w9/2.2.2/p3/s3` Bizkarrezurraren orno guztiek hodi bat osatzen dute, hodi errakideoa izenekoa eta, bertan, ornomuina kokatzen da.

3. «Ornomuinaren segmentu bakoitzarekin nerbio espinal pare bat erlazionatzen da, ezkerrekoa eta eskuinekoa.»
  _t=0.14 · argi: ornomuina, ornomuin-segmentuak, nerbio-espinalak · arbelean: b-pareak_
  - Ez dut ulertu: «Ornomuinaren zati bakoitzetik bi nerbio espinal irteten dira, ezkerrekoa eta eskuinekoa.»
  - **F** `w9/2.2.2/p4/s1` Ornomuinean segmentu desberdinak bereizten dira (lepokoa, bizkarrekoak, gerrikoak, sakroak eta kokzigeoak) eta ornomuinaren segmentu guzti horiekin erlazionatzen dira nerbio espinal/errakideo pare bat (ezkerrekoa eta eskuinekoa).

4. «Zeharkako mozketan, gai grisak H itxura du: hor neuronen somak kokatzen dira.»
  _t=0.2 · argi: gai-grisa_
  - Ez dut ulertu: «Zeharka ebakita, gai grisa tximeleta baten antzekoa da; hor daude neuronen gorputzak.»
  - g `w9/2.2.2/p5/s1` Ornomuinean zeharkako mozketa bat eginez gero, ornomuinaren barnean tximeleta (edo H) itxurako egitura bat ikusiko dugu: ornomuinaren gai grisa.
  - **F** `w9/2.2.2/p5/s2` Hemen neuronen somak kokatzen dira eta bereiz ditzakegu:

5. «Aurreko adarretan neurona motoreak daude.»
  _t=0.28 · emphasis · argi: aurreko-adarra, neurona-motoreak · arbelean: b-gai-grisa_
  - Ez dut ulertu: «Aurreko adarretan muskuluak mugiarazten dituzten neuronak daude: neurona motoreak.»
  - **F** `w9/2.2.2/p6/s1` - Aurrekaldera abiatutako 2 adar: aurreko adarrak/sustraiak.
  - **F** `w9/2.2.2/p6/s2` Hemen neurona motoreak kokatzen dira.

6. «Atzeko adarretan, neurona sentsorialak.»
  _t=0.36 · argi: atzeko-adarra, neurona-sentsorialak_
  - Ez dut ulertu: «Atzeko adarretan sentsazioak jasotzen dituztenak: neurona sentsorialak.»
  - **F** `w9/2.2.2/p7/s1` - Atzekaldera abiatutako 2 adar: atzeko ornomuinaren zeharkako mozketa adarrak/sustraiak.
  - g `w9/2.2.2/p7/s2` Hemen neurona sentsorialak/sentsitiboak kokatzen dira.

7. «Alboko adarretan, ez beti, neurona begetatiboak; eta erdian, enimo hodia.»
  _t=0.44 · argi: alboko-adarra, neurona-begetatiboak, enimo-hodia_
  - Ez dut ulertu: «Batzuetan alboko adarrak ere badaude, neurona begetatiboekin; erdian, enimo hodia.»
  - **F** `w9/2.2.2/p8/s1` - Albokoak (ez beti): neurona begetatiboak Erdian ornomuineko sistema bentrikularreko atala dago, enimo hodia.

8. «Gai grisaren kanpoan gai zuria dago, hiru kordoirekin: atzekoa, albokoa eta aurrekoa.»
  _t=0.52 · argi: gai-zuria, gai-grisa, atzeko-kordoia, alboko-kordoia, aurreko-kordoia_
  - Ez dut ulertu: «Gai grisaren inguruan gai zuria dago; hor informazioa gora eta behera doa, traktuetan.»
  - g `w9/2.2.2/p8/s2` Gai gris honen kanpoan gai zuria kokatzen da eta honetan 3 motako kordoi bereizten dira: atzeko, alboko eta aurreko kordoia.
  - g `w9/2.2.2/p8/s3` Hauetan goranzko eta beheranzko traktuak kokatzen dira (informazioa goiko zentruetara bidaltzeko edo goiko zentruetatik ornomuinera garraiatzeko).

- Arbela `b-pareak`: Ornomuinaren segmentu bakoitzean nerbio espinal pare bat (ezkerrekoa eta eskuinekoa)
  - **F** `w9/2.2.2/p4/s1` Ornomuinean segmentu desberdinak bereizten dira (lepokoa, bizkarrekoak, gerrikoak, sakroak eta kokzigeoak) eta ornomuinaren segmentu guzti horiekin erlazionatzen dira nerbio espinal/errakideo pare bat (ezkerrekoa eta eskuinekoa).
- Arbela `b-gai-grisa`: Gai grisa: aurreko adarrak motoreak; atzekoak sentsorialak; albokoak begetatiboak
  - **F** `w9/2.2.2/p6/s2` Hemen neurona motoreak kokatzen dira.
  - g `w9/2.2.2/p7/s2` Hemen neurona sentsorialak/sentsitiboak kokatzen dira.
  - **F** `w9/2.2.2/p8/s1` - Albokoak (ez beti): neurona begetatiboak Erdian ornomuineko sistema bentrikularreko atala dago, enimo hodia.
- Galdera (contrast): Gai grisaren aurreko eta atzeko adarrak: zein neurona dago bakoitzean?

## 10. Sustraiak eta nerbio espinala

Etapa: `nerbio-espinala` · 6 lerro · ~31 s hitz eginda

1. «Neurona motoreen axoiak aurreko sustraitik pasatzen dira, eta nerbio espinalaren enborrean kokatzen dira.»
  _t=0.62 · argi: axoi-motoreak, aurreko-sustraia, nerbio-espinalak, neurona-motoreak_
  - Ez dut ulertu: «Neurona motoreen hariak aurreko sustraitik irten, eta nerbio espinalera sartzen dira.»
  - **F** `w9/2.2.2/p9/s3` Aurreko sustrai honetatik pasatuz, nerbio espinalaren enborrean kokatzen dira.

2. «Beraz, informazio motorea ornomuinetik alde periferikora doa, muskulu ildaskatuetara.»
  _t=0.62 · emphasis · argi: ornomuina, muskulu-ildaskatuak · arbelean: b-motorea_
  - Ez dut ulertu: «Agindua ornomuinetik muskuluetara doa, kanpora.»
  - **F** `w9/2.2.2/p9/s4` Ondorioz, neurona hauetako zuntz motoreetatik informazioa (nerbio-kinada) ornomuinetik alde periferikora abiatzen da.

3. «Nerbio espinala aurreko eta atzeko sustraiak batzean sortzen da.»
  _t=0.76 · argi: aurreko-sustraia, atzeko-sustraia, nerbio-espinalak_
  - Ez dut ulertu: «Bi sustraiak, aurrekoa eta atzekoa, elkartu egiten dira, eta nerbio espinala osatzen dute.»
  - **F** `w9/2.2.2/p10/s1` Nerbio espinaletan (Ornomuinaren zeharkako mozketako argazkiari erreparatuz gero, nerbio errakideo/espinala sortzen da aurreko eta atzeko adarrak batzean, kordoi bakarra sortuz), zuntz motoreaz gain, zuntz sentsorialak ere badaude (beste motako zuntzak ere daude, hala nola begetatiboak, baina momentuz ez ditugu aipatuko).

4. «Horregatik, zuntz motoreez gain, zuntz sentsorialak ere baditu.»
  _t=0.76 · argi: nerbio-espinalak_
  - Ez dut ulertu: «Beraz, nerbio espinalak bi zuntz mota ditu: motoreak eta sentsorialak.»
  - **F** `w9/2.2.2/p10/s1` Nerbio espinaletan (Ornomuinaren zeharkako mozketako argazkiari erreparatuz gero, nerbio errakideo/espinala sortzen da aurreko eta atzeko adarrak batzean, kordoi bakarra sortuz), zuntz motoreaz gain, zuntz sentsorialak ere badaude (beste motako zuntzak ere daude, hala nola begetatiboak, baina momentuz ez ditugu aipatuko).

5. «Atzeko sustraian beti gongoil bat dago: gongoil errakideoa.»
  _t=0.86 · argi: atzeko-sustraia, gongoil-errakideoak_
  - Ez dut ulertu: «Atzeko sustraian lodigune bat dago, gongoil errakideoa.»
  - g `w9/2.2.2/p11/s1` Nerbio espinalen atzeko sustraian beti goingoil bat kokatzen da: goingoil errakideoa/espinala.

6. «Haren neuronek bi luzapen dituzte: zentripetoa, ornomuinera, eta zentrifugoa, alde periferikora.»
  _t=0.86 · argi: luzapen-zentripetoa, luzapen-zentrifugoa, ornomuina · arbelean: b-luzapenak_
  - Ez dut ulertu: «Gongoileko neuronek bi hari dituzte: bata ornomuinera doa, zentripetoa; bestea kanpora, zentrifugoa.»
  - **F** `w9/2.2.2/p11/s2` Gongoil honetako neuronak 2 motako luzapenak dituzte: luzapen zentripeto bat (ornomuinera abiatzen dira, informazioa ornomuineko atzeko adarretako neuronetara garraiatzeko) eta luzapen zentrifugo bat (alde periferikora abiatzen dira, informazioa neuronetako gorputzetara iristeko).

- Arbela `b-motorea`: Axoi motoreak: aurreko sustraia, nerbio espinala, muskulu ildaskatuak
  - **F** `w9/2.2.2/p9/s3` Aurreko sustrai honetatik pasatuz, nerbio espinalaren enborrean kokatzen dira.
  - **F** `w9/2.2.2/p9/s4` Ondorioz, neurona hauetako zuntz motoreetatik informazioa (nerbio-kinada) ornomuinetik alde periferikora abiatzen da.
- Arbela `b-luzapenak`: Gongoil errakideoa (atzeko sustraia): luzapen zentripetoa ornomuinera, zentrifugoa periferiara
  - g `w9/2.2.2/p11/s1` Nerbio espinalen atzeko sustraian beti goingoil bat kokatzen da: goingoil errakideoa/espinala.
  - **F** `w9/2.2.2/p11/s2` Gongoil honetako neuronak 2 motako luzapenak dituzte: luzapen zentripeto bat (ornomuinera abiatzen dira, informazioa ornomuineko atzeko adarretako neuronetara garraiatzeko) eta luzapen zentrifugo bat (alde periferikora abiatzen dira, informazioa neuronetako gorputzetara iristeko).
- Galdera (contrast): Luzapen zentripetoa eta zentrifugoa: nora doa bakoitza?
- Galdera (pool): w9-q-erroak

## 11. Epaxialak eta hipaxialak

Etapa: `epaxial-hipaxial` · 9 lerro · ~51 s hitz eginda

1. «Nerbio espinalaren enborretik bi adar nagusi sortzen dira: aurreko adar primarioa eta atzeko adar primarioa.»
  _t=0 · argi: aurreko-adar-primarioa, atzeko-adar-primarioa_
  - Ez dut ulertu: «Nerbio espinala bitan banatzen da: aurreko adar primarioa eta atzeko adar primarioa.»
  - **F** `w9/2.2.2/p12/s1` Nerbio espinal baten enborretik bi adar nagusi sortzen dira: aurreko adar (aurreko adar primarioa) bat eta atzeko beste bat (atzeko adar primarioa).

2. «Bietan zuntz sentsorialak eta mugimendukoak daude.»
  _t=0_
  - Ez dut ulertu: «Bi adarrek dituzte bi zuntz motak.»
  - g `w9/2.2.2/p12/s2` Bi adar hauetan zuntz sentsorialak eta motoreak daude.

3. «Kontuz: ez nahastu adar primario hauek gai grisaren adarrekin, ezta sustraiekin ere.»
  _t=0.14 · caution · argi: aurreko-adar-primarioa, atzeko-adar-primarioa, aurreko-adarra, atzeko-adarra_
  - Ez dut ulertu: «Kontuz: hiru adar mota daude izen antzekoekin. Hauek nerbioaren adarrak dira, ez gai grisarenak.»
  - **F** `w9/2.2.2/p13/s1` * Ez nahastu nerbio espinaletik irteten diren aurreko eta atzeko adarrak (primarioak) ornomuinaren gai grisatik ateratzen diren aurreko eta atzeko adarrekin (sustraiak) * KONTUZ!

4. «Muskuluen inerbazioak ez du zerikusirik haien jatorriarekin.»
  _t=0.26 · emphasis · arbelean: b-jatorria_
  - Ez dut ulertu: «Garrantzitsua: muskulu baten jatorriak ez du esaten zein nerbiok mugitzen duen.»
  - **F** `w9/2.2.2/p13/s2` Muskuluen inerbazioa ez du zerikusirik jatorriarekin.

5. «Gauza bat da muskuluaren jatorria; beste bat, zein adarrek inerbatzen duen.»
  _t=0.26 · argi: saihets-arteko-muskuluak, abdomeneko-muskuluak_
  - Ez dut ulertu: «Adibidez, saihets artekoak eta abdomenekoak domeinu desberdinetakoak dira, baina adar berak inerbatzen ditu.»
  - **F** `w9/2.2.2/p13/s3` Gauza bat da muskuluek daukaten jatorria eta beste gauza bat da nerbio hauetako aurreko eta atzeko adarretan dauden zuntz motoreak ze motako muskuluak inerbatzen dituzten.

6. «Aurreko adar primarioak ia muskulu ildaskatu guztiak inerbatzen ditu: gorputz paretakoak eta gorputz-adarretakoak.»
  _t=0.38 · argi: aurreko-adar-primarioa, gorputz-paretako-muskuluak_
  - Ez dut ulertu: «Aurreko adar primarioak muskulu gehienak hartzen ditu: paretakoak eta gorputz-adarretakoak.»
  - g `w9/2.2.2/p15/s1` Gorputz paretako muskulu ildaskatu guztiak.
  - g `w9/2.2.2/p16/s1` Goiko eta beheko gorputz adarretako muskulu guztiak.
  - g `w9/2.2.2/p18/s1` (Ia-ia gure gorputzeko muskulu ildaskatu guztiak inerbatzen dituzte).

7. «Baita bizkarraren muskulu autoktonoen azalean daudenak ere.»
  _t=0.38_
  - Ez dut ulertu: «Baita bizkarreko muskulu sakonen gainean daudenak ere.»
  - **F** `w9/2.2.2/p17/s1` Bizkarraren muskulu autoktonoen azalean kokatzen diren muskulu ildasktuak.

8. «Inerbazioaren arabera, bizkarrezurreko muskulu sakonak muskulu epaxialak dira, eta atzeko adar primarioak inerbatzen ditu.»
  _t=0.5 · emphasis · argi: muskulu-epaxialak, atzeko-adar-primarioa, bizkarreko-muskulu-sakonak · arbelean: b-epaxialak_
  - Ez dut ulertu: «Bizkarreko muskulu sakonak epaxialak dira: atzeko adar primarioak mugitzen ditu.»
  - **F** `w9/2.2.2/p20/s1` Ondorioz, inerbazio motaren arabera bereizten diren muskuluak:
  - **F** `w9/2.2.2/p21/s1` - Bizkarrezurreko muskulu sakonak: muskulu epaxialak (edo atzeko muskuluak) dira.
  - g `w9/2.2.2/p21/s2` Nerbio espinaletako atzeko adarretako zuntz motoreek inerbatzen dituzte.

9. «Gainerako muskulu ildaskatu guztiak hipaxialak dira, eta aurreko adar primarioak inerbatzen ditu.»
  _t=0.5 · argi: muskulu-hipaxialak, aurreko-adar-primarioa_
  - Ez dut ulertu: «Beste guztiak hipaxialak dira: aurreko adar primarioak mugitzen ditu.»
  - **F** `w9/2.2.2/p22/s1` - Gainerako gorputzeko muskulu ildaskatu guztiak (aurreko taulan aipatutakoak): muskulu hipaxialak dira.
  - g `w9/2.2.2/p22/s2` Nerbio espinaletako aurreko adarretako zuntz motoreek inerbatzen dituzte.

- Arbela `b-jatorria`: Inerbazioak ez du zerikusirik jatorriarekin
  - **F** `w9/2.2.2/p13/s2` Muskuluen inerbazioa ez du zerikusirik jatorriarekin.
- Arbela `b-epaxialak`: Epaxialak (bizkarreko muskulu sakonak): atzeko adar primarioa. Hipaxialak (gainerakoak): aurreko adar primarioa
  - **F** `w9/2.2.2/p21/s1` - Bizkarrezurreko muskulu sakonak: muskulu epaxialak (edo atzeko muskuluak) dira.
  - g `w9/2.2.2/p21/s2` Nerbio espinaletako atzeko adarretako zuntz motoreek inerbatzen dituzte.
  - **F** `w9/2.2.2/p22/s1` - Gainerako gorputzeko muskulu ildaskatu guztiak (aurreko taulan aipatutakoak): muskulu hipaxialak dira.
  - g `w9/2.2.2/p22/s2` Nerbio espinaletako aurreko adarretako zuntz motoreek inerbatzen dituzte.
- Galdera (contrast): Muskulu epaxialak eta hipaxialak: zein adarrek inerbatzen ditu bakoitza?

## 12. Segmentuak eta sareak

Etapa: `epaxial-hipaxial` · 5 lerro · ~27 s hitz eginda

1. «Toraxean, saihets arteko muskuluen inerbazioa metamerikoa da, edo segmentarioa.»
  _t=0.7 · argi: saihets-arteko-nerbioak_
  - Ez dut ulertu: «Toraxean, segmentu bakoitzak bere saihets arteko nerbioa du.»
  - **F** `w9/2.2.2/p26/s2` Toraxean dauzkagun saihets arteko muskuluen erlazioa metameriko (edo segmentarioa) izaten da.

2. «Gorputz-adarretan, aldiz, maila desberdinetako zuntzek nerbio sareak osatzen dituzte.»
  _t=0.8 · argi: nerbio-sareak · arbelean: b-sareak_
  - Ez dut ulertu: «Gorputz-adarretan, ordea, hainbat mailatako zuntzak nahasten dira: nerbio sareak sortzen dira.»
  - **F** `w9/2.2.2/p26/s3` Goiko eta beheko gorputz adarretako muskuluen kasuan, aldiz, maila desberdinetako nerbio espinaletan dauden zuntz motoreak nerbio sare desberdinak osatzen dituzte eta bertatik nerbio jakin batzuk irteten dira.

3. «Sare horietatik nerbio jakin batzuk irteten dira.»
  _t=0.8 · argi: nerbio-sareak_
  - Ez dut ulertu: «Eta sareetatik nerbio izendun batzuk ateratzen dira.»
  - **F** `w9/2.2.2/p26/s3` Goiko eta beheko gorputz adarretako muskuluen kasuan, aldiz, maila desberdinetako nerbio espinaletan dauden zuntz motoreak nerbio sare desberdinak osatzen dituzte eta bertatik nerbio jakin batzuk irteten dira.

4. «Beheko gorputz-adarrean, adibidez, nerbio femorala eta ziatikoa; goikoan, erradiala, ertaina eta kubitala.»
  _t=0.88 · argi: nerbio-femorala, nerbio-ziatikoa, nerbio-erradiala, nerbio-ertaina, nerbio-kubitala_
  - Ez dut ulertu: «Hankan, nerbio femorala eta ziatikoa; besoan, nerbio erradiala, ertaina eta kubitala.»
  - **F** `w9/2.2.2/p27/s1` - Beheko gorputz adarretan: nerbio femorala, nerbio ziatikoa, nerbio bultzatzailea...
  - **F** `w9/2.2.2/p28/s1` - Goiko gorputz adarretan: nerbio erradiala, nerbio ertaina, nerbio kubitala… Nerbio espinalean dauden zuntz motoreak gure gorputzeko muskulu guztiak inerbatzen dituzte (burukoak izan ezik).

5. «Nerbio espinalek gorputzeko muskulu guztiak inerbatzen dituzte, burukoak izan ezik.»
  _t=0.88 · emphasis · arbelean: b-espinalak_
  - Ez dut ulertu: «Nerbio espinalek gorputzeko muskulu guztiak mugitzen dituzte, buruko muskuluak izan ezik.»
  - **F** `w9/2.2.2/p28/s1` - Goiko gorputz adarretan: nerbio erradiala, nerbio ertaina, nerbio kubitala… Nerbio espinalean dauden zuntz motoreak gure gorputzeko muskulu guztiak inerbatzen dituzte (burukoak izan ezik).

- Arbela `b-sareak`: Saihets artekoak: metamerikoak. Gorputz-adarrak: nerbio sareak
  - **F** `w9/2.2.2/p26/s2` Toraxean dauzkagun saihets arteko muskuluen erlazioa metameriko (edo segmentarioa) izaten da.
  - **F** `w9/2.2.2/p26/s3` Goiko eta beheko gorputz adarretako muskuluen kasuan, aldiz, maila desberdinetako nerbio espinaletan dauden zuntz motoreak nerbio sare desberdinak osatzen dituzte eta bertatik nerbio jakin batzuk irteten dira.
- Arbela `b-espinalak`: Nerbio espinalak: muskulu guztiak, burukoak izan ezik
  - **F** `w9/2.2.2/p28/s1` - Goiko gorputz adarretan: nerbio erradiala, nerbio ertaina, nerbio kubitala… Nerbio espinalean dauden zuntz motoreak gure gorputzeko muskulu guztiak inerbatzen dituzte (burukoak izan ezik).
- Galdera (contrast): Saihets arteko muskuluak eta gorputz-adarretako muskuluak: nola iristen zaie inerbazioa?
- Galdera (pool): w9-q-sareak

## 13. Muskulu leuna

Etapa: `muskulu-lisoa` · 7 lerro · ~43 s hitz eginda

1. «Muskulu leunak erraiekin erlazionatutako muskuluak dira.»
  _t=0 · argi: muskulu-leuna_
  - Ez dut ulertu: «Muskulu leuna erraietan dago.»
  - **F** `w9/3/p3/s1` Erraiekin erlazionatutako muskuluak dira.

2. «Orokorrean, heste eta heste-eratorrien inguruko alboko mesodermoaren errai orritik sortzen da.»
  _t=0 · emphasis · argi: muskulu-leuna, errai-orria · arbelean: b-leuna_
  - Ez dut ulertu: «Gehienetan, hestearen eta haren eratorrien inguruko errai orritik dator.»
  - **F** `w9/3/p3/s5` Orokorrean, heste eta heste-eratorrien inguruan kokatzen den alboko mesodermoaren errai-orritik sortzen da.

3. «Haren inerbazioa begetatiboa da, sinpatikoa eta parasinpatikoa: ez kraniala, ez espinala.»
  _t=0.28 · argi: nerbio-sistema-begetatiboa, muskulu-leuna_
  - Ez dut ulertu: «Muskulu leuna nerbio sistema begetatiboak kontrolatzen du, ez guk nahita.»
  - g `w9/3/p5/s1` Muskulu hauek daukaten inerbazioa guztiz desberdina da; ez du zerikusirik nerbio kranealekin eta nerbio errakideoekin.
  - **F** `w9/3/p5/s2` Inerbazio begetatibo edo autonomoa du (sinpatiko eta parasinpatikoa).

4. «Diskoaren tolespenengatik endodermoa barneratzen da, eta hestea sortzen da.»
  _t=0.42 · recall_
  - Ez dut ulertu: «Gogoratu: diskoa tolestean endodermoa barrura sartzen da eta hestea egiten du.»
  - **F** `w9/3/p6/s1` Diskoak egiten dituen tolespenengatik, endodermoa eta bitelo zakuaren zatirik garrantzitsuena barneratzen da eta hestea sortzen da.

5. «Hestea mintz bukofaringeotik kloaka mintzeraino hedatzen da: aurreko, bitarteko eta atzeko hestea.»
  _t=0.42 · argi: mintz-bukofaringeoa, kloaka-mintza, aurreko-hestea, erdiko-hestea, atzeko-hestea_
  - Ez dut ulertu: «Hestea mintz bukofaringeotik kloaka mintzera doa, hiru zatitan: aurreko hestea, bitartekoa eta atzeko hestea.»
  - **F** `w9/3/p6/s2` Hestea mintz bukofaringeotik kloaka mintzeraino hedatzen da eta, egitura honetan, atal desberdinak bereizten dira: aurreko, bitarteko eta atzeko hestea.

6. «Aorta bihotzaren ezkerreko bentrikulutik irteten da, eta gorputzeko arteriarik garrantzitsuena da.»
  _t=0.72 · argi: aorta-dortsalak_
  - Ez dut ulertu: «Aorta gorputzeko arteria nagusia da, eta bihotzaren ezkerreko bentrikulutik irteten da.»
  - **F** `w9/3/p8/s2` Bihotzaren ezkerreko bentrikuluan eta gorputzean dugun arteriarik garrantzitsuena aorta da.

7. «Aortaren eta haren adarren muskulu leuna, ordea, paretako orritik eta gandor neuraletik sortzen dela uste da.»
  _t=0.72 · caution · argi: muskulu-leuna, paretako-orria, gandor-neurala, errai-orria · arbelean: b-aorta_
  - Ez dut ulertu: «Kontuz: aortaren muskulu leuna ez dator errai orritik, paretako orritik eta gandor neuraletik baizik.»
  - **F** `w9/3/p8/s4` Aortan eta aortatik irteten diren aorta adar guztien paretan dagoen muskulu lisoa, alboko mesodermoaren pareta-orritik eta gandor neuraletako zelulatik sortzen dela uste da gaur egun.

- Arbela `b-leuna`: Muskulu leuna: erraiak; hestearen inguruko errai orritik; inerbazio begetatiboa
  - **F** `w9/3/p3/s5` Orokorrean, heste eta heste-eratorrien inguruan kokatzen den alboko mesodermoaren errai-orritik sortzen da.
  - **F** `w9/3/p5/s2` Inerbazio begetatibo edo autonomoa du (sinpatiko eta parasinpatikoa).
- Arbela `b-aorta`: Aortaren muskulu leuna: paretako orritik eta gandor neuraletik
  - **F** `w9/3/p8/s4` Aortan eta aortatik irteten diren aorta adar guztien paretan dagoen muskulu lisoa, alboko mesodermoaren pareta-orritik eta gandor neuraletako zelulatik sortzen dela uste da gaur egun.
- Galdera (contrast): Hestearen paretako muskulu leuna eta aortarena: nondik dator bakoitza?

## 14. Bihotzeko muskulua

Etapa: `bihotz-muskulua` · 9 lerro · ~50 s hitz eginda

1. «Bihotzeko muskulua bi bihotz hodien inguruko alboko mesodermoaren errai orritik sortzen da.»
  _t=0 · argi: bihotz-hodiak, errai-orria, miokardioa_
  - Ez dut ulertu: «Bihotzeko muskulua bi bihotz hodien inguruko errai orritik dator.»
  - **F** `w9/4/p3/s1` Bihotzeko muskulua; hau da, bihotzaren paretan dagoen muskulua, 2 bihotz hodien inguruko alboko mesodermoaren errai orritik sortzen da.

2. «Errai orri horretatik bihotzaren tarteko geruza garatzen da: miokardioa.»
  _t=0 · argi: errai-orria, miokardioa_
  - Ez dut ulertu: «Hortik bihotzaren tarteko geruza sortzen da: miokardioa.»
  - g `w9/4/p3/s2` Errai-orri horretatik, garatzen da bihotzeko tarteko zelula-geruza: miokardioa.

3. «Bihotzeko mioblastoak ez dira fusionatzen: disko interkalarren bidez lotzen dira.»
  _t=0.14 · emphasis · argi: miokardioa, disko-interkalarrak · arbelean: b-diskoak_
  - Ez dut ulertu: «Bihotzeko zelulak ez dira elkartzen zuntz bakar batean: lotura bereziek, disko interkalarrek, lotzen dituzte.»
  - **F** `w9/4/p3/s6` Bihotz muskulu hau nahiko berezia da; izan ere, mioblastoak (hasierako muskulu zelulak) haien artean lotu edo atxikitu egiten dira lotura berezi batzuen bitartez, lotura hauei disko interkalar esaten zaie.

4. «Eskuineko aurikulan nodulu sinusala dago, markapasoa; haren beheko aldean, nodulu aurikobentrikularra.»
  _t=0.46 · argi: eskuineko-aurikula, nodulu-sinusala, nodulu-aurikobentrikularra_
  - Ez dut ulertu: «Eskuineko aurikulan nodulu sinusala dago, bihotzaren markapasoa; beherago, nodulu aurikobentrikularra.»
  - **F** `w9/4/p6/s1` Bihotzeko eroarpen sistemako egiturak: Bihotzaren eskuineko aurikulan nodulu sinusala (markapasosa) daukagu, aurikularen beheko aldean nodulu aurikobentrikularra dago, eta nodulu hauen artean, traktu desberdinak daude, aurikularteko balak.

5. «Hortik His faszikulua ateratzen da, bi adarrekin, eta endokardio azpian Purkinje sarea eratzen du.»
  _t=0.6 · argi: his-faszikulua, purkinje-sarea, endokardioa · arbelean: b-eroapena_
  - Ez dut ulertu: «Gero His faszikulua bitan banatzen da, eta endokardio azpian Purkinje sarea egiten du.»
  - **F** `w9/4/p6/s2` Nodulu aurikobentrikularratik faszikulu aurikobentrikularra edo His faszikulua ateratzen da, bi adarrekin (eskubiko eta ezkerreko adarrak) eta adar horiek adarkatu egiten dira endokardio azpian, zuntzez osatutako Purkinje sare bat eratu egiten da.

6. «Noduluak ez dira nerbio sistemaren parte: zuntz muskular oso espezializatuak dira.»
  _t=0.74 · caution · argi: nodulu-sinusala, nodulu-aurikobentrikularra, eroapen-sistema · arbelean: b-noduluak_
  - Ez dut ulertu: «Kontuz: noduluak ez dira nerbioak; muskulu zuntz bereziak dira.»
  - **F** `w9/4/p5/s1` Bihotzaren noduluak ez dira sistema nerbiosoaren parte, ordea, zuntz muskular oso espezializatuak dira.

7. «Hau da bihotzak daukan barneko inerbazioa.»
  _t=0.74 · argi: eroapen-sistema_
  - Ez dut ulertu: «Hori da bihotzaren barneko kontrola.»
  - g `w9/4/p5/s3` Hau da bihotzak daukan barneko inerbazioa.

8. «Horrez gain, bihotzak kanpoko inerbazioa du: nerbio sistema begetatiboa.»
  _t=0.84 · argi: nerbio-sistema-begetatiboa_
  - Ez dut ulertu: «Gainera, nerbio sistema begetatiboak ere kontrolatzen du bihotza, kanpotik.»
  - **F** `w9/4/p5/s4` Horrez gain, bihotza kanpoko nerbio sistema begetatiboz (sinpatikoz eta parasinpatikoz) inerbatuta dago baita ere.

9. «Gogoratu: erraien eta bihotzaren inerbazioa begetatiboa da; muskulu ildaskatuena, kraniala edo espinala.»
  _t=0.92 · recall · argi: muskulu-ildaskatuak, muskulu-leuna, miokardioa, nerbio-sistema-begetatiboa_
  - Ez dut ulertu: «Erraiak eta bihotza nerbio begetatiboek kontrolatzen dituzte; ildaskatuak, nerbio kranialek edo espinalek.»
  - **F** `w9/4/p8/s1` Erraietako eta bihotzaren inerbazioa desberdina da, nerbio sistema begetatiboarenak dira (sinpatiko eta parasinpatiko).
  - **F** `w9/2.1.2/p6/s1` Beraz, alde zefalikoan dauden muskulu ildaskatu guztien inerbazioa, nerbio kranealen ardurapean dago.
  - **F** `w9/2.2.2/p28/s1` - Goiko gorputz adarretan: nerbio erradiala, nerbio ertaina, nerbio kubitala… Nerbio espinalean dauden zuntz motoreak gure gorputzeko muskulu guztiak inerbatzen dituzte (burukoak izan ezik).

- Arbela `b-diskoak`: Miokardioa: mioblastoak ez dira fusionatzen; disko interkalarrak
  - **F** `w9/4/p3/s6` Bihotz muskulu hau nahiko berezia da; izan ere, mioblastoak (hasierako muskulu zelulak) haien artean lotu edo atxikitu egiten dira lotura berezi batzuen bitartez, lotura hauei disko interkalar esaten zaie.
- Arbela `b-eroapena`: Nodulu sinusala, nodulu aurikobentrikularra, His faszikulua, Purkinje sarea
  - **F** `w9/4/p6/s1` Bihotzeko eroarpen sistemako egiturak: Bihotzaren eskuineko aurikulan nodulu sinusala (markapasosa) daukagu, aurikularen beheko aldean nodulu aurikobentrikularra dago, eta nodulu hauen artean, traktu desberdinak daude, aurikularteko balak.
  - **F** `w9/4/p6/s2` Nodulu aurikobentrikularratik faszikulu aurikobentrikularra edo His faszikulua ateratzen da, bi adarrekin (eskubiko eta ezkerreko adarrak) eta adar horiek adarkatu egiten dira endokardio azpian, zuntzez osatutako Purkinje sare bat eratu egiten da.
- Arbela `b-noduluak`: Noduluak: zuntz muskular espezializatuak (barneko inerbazioa). Kanpokoa: nerbio sistema begetatiboa
  - **F** `w9/4/p5/s1` Bihotzaren noduluak ez dira sistema nerbiosoaren parte, ordea, zuntz muskular oso espezializatuak dira.
  - g `w9/4/p5/s3` Hau da bihotzak daukan barneko inerbazioa.
  - **F** `w9/4/p5/s4` Horrez gain, bihotza kanpoko nerbio sistema begetatiboz (sinpatikoz eta parasinpatikoz) inerbatuta dago baita ere.
- Galdera (pool): w9-q-eroapen-ordena
- Galdera (contrast): Bihotzaren barneko eta kanpoko inerbazioa: zer da bakoitza?

## 15. Osatu taula

Etapa: `okzipitalak` · 4 lerro · ~21 s hitz eginda

1. «Laburbilduz: muskulu ildaskatuak mesodermo paraxialetik datoz; leunak eta miokardioa, errai orritik.»
  _t=0.84 · summary_
  - Ez dut ulertu: «Gogoratu: ildaskatuak mesodermo paraxialetik; leunak eta bihotzekoa, errai orritik.»
  - **F** `w9/2/p3/s1` Muskulu ildaskatu guztiak mesodermo paraxialetik sortzen dira.
  - **F** `w9/1/p6/s1` ● Muskulu lisoak edo leunak (erraiekin erlazionatutako muskuluak): Heste eta hesteen eratorrien inguruan dagoen alboko mesodermoaren errai orritik sortzen dira.
  - **F** `w9/1/p7/s1` ● Bihotzeko muskulua edo miokardioa: Bihotz hodiaren inguruan kokatzen den alboko mesodermoaren errai orritik sortzen da.

2. «Buruko muskuluak nerbio kranialek inerbatzen dituzte; gainerakoak, nerbio espinalek.»
  _t=0.84 · summary · argi: nerbio-kranialak_
  - Ez dut ulertu: «Buruko muskuluak nerbio kranialek mugitzen dituzte; beste guztiak, nerbio espinalek.»
  - **F** `w9/2.1.2/p6/s1` Beraz, alde zefalikoan dauden muskulu ildaskatu guztien inerbazioa, nerbio kranealen ardurapean dago.
  - **F** `w9/2.2.2/p28/s1` - Goiko gorputz adarretan: nerbio erradiala, nerbio ertaina, nerbio kubitala… Nerbio espinalean dauden zuntz motoreak gure gorputzeko muskulu guztiak inerbatzen dituzte (burukoak izan ezik).

3. «Leunak eta bihotza, berriz, nerbio sistema begetatiboak.»
  _t=0.84 · summary_
  - Ez dut ulertu: «Erraiak eta bihotza, nerbio sistema begetatiboak.»
  - **F** `w9/3/p5/s2` Inerbazio begetatibo edo autonomoa du (sinpatiko eta parasinpatikoa).
  - **F** `w9/4/p5/s4` Horrez gain, bihotza kanpoko nerbio sistema begetatiboz (sinpatikoz eta parasinpatikoz) inerbatuta dago baita ere.

4. «Orain zure txanda: osatu buruko muskuluen taula oroimenetik, eta gero galdera bat.»
  _t=0.84 · summary_
  - Ez dut ulertu: «Orain zu: bete taula buruz, eta gero erantzun galdera bati.»
  - **F** `w9/2.1.4/p20/s1` 1 eta 2 somita okzipitalak (4. eta 6. arku faringeotan garatu)

- Galdera (fill): klasea:9/taula
- Galdera (pool): w9-q-inerbazioa

## Estaldura

- Funtsezko esaldiak: 82 / 229; klaseak esaten ditu: 82.
- Klaseak aipatzen dituen esaldi guztiak: 123.
- Hitz egiteko denbora: ~10 min (galderak aparte).
