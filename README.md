# Embriologia interaktiboa

Lehen mailako Medikuntzarako giza enbriologiaren lehen lau asteen ikaskuntza bisual eta interaktiboa. Interfazea, egituren izenak eta azalpenak euskaraz daude. Edukien iturburu nagusiak erabiltzaileak emandako lau apunte zuzenduta dira.

## Zer dago barruan

- `/`: simulagailu nagusia, 1.–4. asteekin.
- `/topics/week-1`: 1. astearen ikuspegi zuzena.
- `/topics/week-2`: 2. astearen ikuspegi zuzena, 8., 9., 11.–12. eta 13. egunekin.
- `/topics/week-3`: gastrulazioa, notokorda, alantoidea eta korion-biloxken garapena.
- `/topics/week-4`: tolespenak, neurulazioa, mesodermoaren bereizketa eta heste primitiboa.
- Ikusi, Ulertu eta Ikasi moduak; lehen bi asteetarako denbora-lerroa eta 3.–4. asteetarako ikasketa-ibilbidea, play/pause, reverse, scrub eta 0.5x/1x/1.5x/2x abiadurekin. Azken bi asteetako prozesu batzuk aldi berean gertatzen dira.
- SVG anatomiko eta zelularrak, egitura-hautaketa, egituren ikuskatzailea, glosarioa eta test laburra. Irudiak eskematikoak dira eta ez daude eskalara.
- AI tutorea prest dago baina desaktibatuta dago uneko MVP-an; azalpen estatikoek ez dute kanpoko APIrik behar.
- Reduced-motion eta teklatu bidezko erabilerarako oinarrizko bideak.

## Abiarazi

Node.js behar da, Next 16-rekin bateragarria.

```bash
npm install
npm run dev
```

Ondoren ireki `http://localhost:3000`.

## Kimu, laguntzaile txikia

Kimu (euskaraz «kimu» = ernamuina) txat bat da, simulagailuaren azpian dagoen edukian oinarritua: «noiz sortzen da notokorda?» galdetuta, azalpena hasten den urratsera eramaten zaitu eta bertan erreproduzitzen du (eta «Bueltatu» botoiarekin lehengo lekura itzul zaitezke). Euskaraz, gaztelaniaz eta ingelesez ulertzen du. Ireki `K` teklarekin edo goiko barrako Kimu botoiarekin.

- Bilaketa arakatzailean egiten da (`lib/kimu/search.ts`): Kimuk existitzen diren lekuetara bakarrik eraman dezake. Modeloak (Groq, `qwen/qwen3.8-27b`) hitzak jartzen ditu, ez datuak.
- `GROQ_API_KEY` ezarri Vercel-en (Project Settings → Environment Variables) eta berriro deploy egin. Aukerakoa: `KIMU_MODEL`. Gakorik gabe edo muga gainditzean Kimuk apunteen bilaketarekin erantzuten du.
- Groq-en doako mailak muga estuak ditu (~8K token/minutu, ~200K token/egun), beraz eskaera bakoitza txikia da (~1,5K token), erantzun errepikatuak cachean gordetzen dira eta IP bakoitzak muga du.

## Gemini tutorea (desaktibatuta lehenespenez)

Une honetan AI tutorea desgaituta dago nahita. Aktibatzeko etorkizuneko release batean, ezarri `AI_TUTOR_ENABLED=true` eta `NEXT_PUBLIC_AI_TUTOR_ENABLED=true`, eta bete `GOOGLE_GENERATIVE_AI_API_KEY`. Bi banderak true ez badaude, ez da modelorik deitzen eta UI-ak `AI · desaktibatuta` egoera erakusten du.

`AI_MODEL` ezartzen ez bada, `gemini-3.5-flash-lite` erabiltzen da. Gakoak server route-an bakarrik erabiltzen dira eta ez dira bezeroari bidaltzen.

## Ahots bidezko simulazioa (6 gaiak)

Ahotsaren audioak aldez aurretik sortzen dira sei gaietarako eta aplikazioarekin argitaratzen dira MP3 fitxategi gisa. Chrome-n eta beste arakatzaileetan erabiltzaileek audio berdinak entzuten dituzte: erreproduzitzeak ez du TTS APIrik deitzen eta ez du sorkuntza-kuotarik kontsumitzen. Ostalaritzaren transferentzia-mugak aplikatzen dira oraindik.

`/api/narration` endpoint-ak gai, etapa, zati eta ikuspegi identifikatzaile kanonikoak bakarrik onartzen ditu, eta lehendik sortutako MP3 fitxategira birbideratzen du. Edukiaren hitzak ez dira aldatzen. `public/narration/manifest.json` katalogoak testuaren SHA256-a audioaren URLarekin lotzen du; URLak azken MP3aren byteen SHA256-a darama. Beste ahots edo erritmo batekin birsortzeak URL berria ematen du.

Audioak [offline sortzeko tresnak](scripts/narration/README.md) erabiltzen dira. Entzuteko ez da API gakorik behar Vercel-en, eta AI tutorearen banderek ez dute narratzaile estatikoa kontrolatzen. Katalogoa hutsik dagoenean GET-ek `configured:false` itzultzen du eta audio-eskaerak `NOT_CONFIGURED` egoera. Google Cloud Standard ahotsaren sorkuntza tokian bakarrik egiten da, `eu-ES-Standard-B` ahotsarekin; prest dagoen katalogoa osorik argitaratu behar da.

## Vercel

Importatu proiektua Vercel-en eta konfiguratu `.env.local`-eko aldagaiak Project Settings → Environment Variables atalean. `GOOGLE_GENERATIVE_AI_API_KEY` aukerakoa da; hutsik utzita core simulatorrak funtzionatzen jarraitzen du fallback lokalarekin. Vercel-en build komandoa `npm run build` da.

## Egiaztapenak

```bash
npm run typecheck
npm test
npm run lint
npm run build
```

Testek `TimelineEngine` determinista egiaztatzen dute. Lau asteetako edukiaren, egituren eta eszenen egiaztapenak ere egin behar dira aldaketak argitaratu aurretik.

## Arkitektura eta iturriak

Ikusi [ARCHITECTURE.md](ARCHITECTURE.md) domeinuaren, motor deterministaren eta UI geruzen banaketa. Jatorrizko apunteak ez dira aldatu:

- `1. ENBRIOLOGIA_GARAPENAREN LEHENGO ASTEA (zuzenduta).docx`
- `2. ENBRIOLOGIA_GARAPENAREN BIGARREN ASTEA (zuzenduta).pdf`
- `3. Enbriologia_Garapenaren hirugarren astea .pdf`
- `4. Enbriologia_Garapenaren laugarren astea (ZUZENDUTA).pdf`

Identifikatutako iturri-anbiguotasun eta terminologia-arazo nagusiak [SOURCE_ISSUES.md](SOURCE_ISSUES.md)-n daude erregistratuta; ez dira isilpean zuzendu.

Progress lokalak `LocalStorageProgressRepository` erabiltzen du eta `ProgressRepository` interfazearen bidez beste biltegi baterako prest dago. Supabase/RAG eta Three.js etorkizuneko adapter gisa utzi dira, ez MVP honetan beharrezkoak diren dependentzia operatibo gisa.

QA lokalak kodea eta portaera lokala egiaztatzen ditu; ez du berez frogatzen Vercel-en argitalpena, production domain-a, production datuak edo azterketa klinikoa.
