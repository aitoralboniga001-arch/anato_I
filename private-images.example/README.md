# Ikasgaiko irudiak (pribatuak)

Ikasgaiko irudiak (Langman, diapositibak…) egile-eskubidedunak dira: **ez dira inoiz argitaratzen**.
Irudi-laborategian (`/irudiak`) zure ordenagailuan bakarrik erabil ditzakezu:

1. Kopiatu karpeta hau `private-images/` izenarekin proiektuaren erroan (git-ek ez du jasotzen).
2. Utzi irudiak bertan (`.png`, `.jpg`, `.webp`, `.gif`, `.svg`).
3. Idatzi `manifest.json`: irudi bakoitzeko `file` (fitxategi-izena soilik), `title`, `source` eta `hotspots`.
   - `id`: atlaseko egitura baten id-a (orduan saiakerak egitura horren «Irudian» gaitasuna elikatzen du) edo testu librea `label`-ekin.
   - `x`, `y`: puntuaren erdigunea, irudiaren zabalera/altueraren zatiki gisa (0–1).
   - `r`: klikak onartzeko erradioa, zabaleraren zatiki gisa (lehenetsia 0.05).
4. `npm run dev` eta ireki `/irudiak`: «Ikasgaiko irudiak (pribatuak)» fitxa agertuko da.

Beste karpeta bat erabiltzeko: `PRIVATE_IMAGES_DIR=/bidea/karpetara`.
Vercel-en (webgune publikoan) bide hau beti itzalita dago.
