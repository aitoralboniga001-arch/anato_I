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

## Gemini tutorea (desaktibatuta lehenespenez)

Une honetan AI tutorea desgaituta dago nahita. Aktibatzeko etorkizuneko release batean, ezarri `AI_TUTOR_ENABLED=true` eta `NEXT_PUBLIC_AI_TUTOR_ENABLED=true`, eta bete `GOOGLE_GENERATIVE_AI_API_KEY`. Bi banderak true ez badaude, ez da modelorik deitzen eta UI-ak `AI · desaktibatuta` egoera erakusten du.

`AI_MODEL` ezartzen ez bada, `gemini-3.5-flash-lite` erabiltzen da. Gakoak server route-an bakarrik erabiltzen dira eta ez dira bezeroari bidaltzen.

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
