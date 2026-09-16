# Embriologia interaktiboa

Production MVP lokala, lehen mailako Medikuntzarako, giza enbriologiaren 1. eta 2. asteen ikaskuntza bisual eta interaktiborako. Interfazearen hizkuntza nagusia euskara da; edukien iturburu nagusiak erabiltzaileak emandako bi DOCX zuzenduta dira.

## Zer dago barruan

- `/`: simulator nagusia, 1. eta 2. asteekin.
- `/topics/week-1`: 1. astearen ikuspegi zuzena.
- `/topics/week-2`: 2. astearen ikuspegi zuzena, Day 8, Day 9, Days 11-12 eta Day 13 etapekin.
- Ikusi, Ulertu eta Ikasi moduak; denbora-lerroa play/pause, reverse, scrub eta 0.5x/1x/1.5x/2x abiadurekin.
- SVG anatomiko eta zelularra, egitura-hautaketa, inspectorra, glosarioa eta test laburra.
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

Testek `TimelineEngine` determinista egiaztatzen dute. Browser bidezko QA-an bi topic-ak, 2. asteko lau etapak, erreprodukzioa, alderantzizko norabidea, inspectorra, glosarioa, quiz-a, tutorearen fallback-a eta mobile/desktop layout-a egiaztatu dira.

## Arkitektura eta iturriak

Ikusi [ARCHITECTURE.md](ARCHITECTURE.md) domeinuaren, motor deterministaren eta UI geruzen banaketa. DOCX originalak ez dira aldatu:

- `Anato lehenengo gaia (zuzenduta).docx`
- `2. ENBRIOLOGIA_GARAPENAREN BIGARREN ASTEA (zuzenduta).docx`

Iturburuko anbiguotasun eta terminologia-arazo guztiak [SOURCE_ISSUES.md](SOURCE_ISSUES.md)-n daude erregistratuta; ez dira isilpean zuzendu.

Progress lokalak `LocalStorageProgressRepository` erabiltzen du eta `ProgressRepository` interfazearen bidez beste biltegi baterako prest dago. Supabase/RAG eta Three.js etorkizuneko adapter gisa utzi dira, ez MVP honetan beharrezkoak diren dependentzia operatibo gisa.

QA lokalak kodea eta portaera lokala egiaztatzen ditu; ez du berez frogatzen Vercel-en argitalpena, production domain-a, production datuak edo azterketa klinikoa.
