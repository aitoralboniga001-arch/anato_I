# Cobertura frente a los apuntes (1.–6. gaiak)

Auditoría hecha el 2026-09-28. La pregunta de fondo es si un estudiante que solo usara el atlas, sin los apuntes, podría preparar el examen.

## Método

1. **Texto.** Se cruzó cada línea de los apuntes (`_source-review/notes/w1–w4.txt`, más w5 y w6) con todo el contenido del atlas: fichas, pasos, preguntas y escenas. Se aplicó por raíces de palabra, y la gametogénesis quedó fuera porque los apuntes la marcan como «ez da azterketan sartzen».
2. **Por estructura.** De cada una de las 292 estructuras se comprobaron cuatro cosas:
   - **visual:** está dibujada en alguna escena;
   - **textual:** tiene definición;
   - **evaluable:** tiene al menos una pregunta en el banco;
   - **imagen:** puede preguntarse en «Aurkitu» o en el laboratorio de imágenes, lo que exige que esté dibujada como parte clicable.

## Resultado

| | 1 | 2 | 3 | 4 | 5 | 6 | Total |
|---|---|---|---|---|---|---|---|
| Estructuras | 55 | 28 | 30 | 66 | 77 | 36 | 292 |
| Dibujadas (visual + imagen) | 52 | 28 | 30 | 65 | 77 | 33 | 288 |
| Con pregunta (antes) | 14 | 22 | 22 | 54 | 12 | 14 | 165 |
| Con pregunta (ahora) | 44 | 28 | 29 | 66 | 68 | 35 | 276 |

- **Texto.** Solo 24 líneas de apuntes quedaron por debajo del 75 % de coincidencia. Se revisaron todas a mano y en su mayoría eran palabras de relleno («momentu», «kontuan»…). El contenido de apariencia nueva ya estaba cubierto:
  - diagnóstico prenatal: ecografía, α-fetoproteína, amniocentesis y biopsia de vellosidades coriónicas;
  - viabilidad y actividad fetal.
- **Sin dibujar (4):**
  - umetokiaren gorputza y umetokiaren lepoa, que solo aparecen en texto dentro del esquema del útero;
  - karenaren fetu-atala y karenaren ama-atala, que se ven como korion hostotsua y dezidua basala.
- **Sin pregunta textual (16):**
  - partes finas del útero y la trompa: fundusa, istmoa, perimetrioa, Douglas…;
  - ejes y términos de orientación;
  - amniosa, endotelioa, bekainak, buruko-ilea, oinzola.

  Todas están dibujadas y se evalúan como imagen. Además, la orientación tiene su propio ejercicio en `/irudiak`.
- **Sin definición útil (2):** hurrupaketa-mugimenduak y argi-sentikortasuna. Son hitos fechados (24. y 28. astea); los apuntes solo dan la fecha, y así aparecen.

## Qué se añadió para cerrar huecos

- **«Zer da hau?».** Preguntas generadas desde la definición de los apuntes, con el nombre oculto (265). Los distractores salen de la misma categoría y del mismo tema o del contiguo, y nunca se ofrece una estructura que la propia definición nombra.
- **«Non dago? / Non gertatzen da?».** Preguntas generadas desde el campo `location` (154). Se descartan los lugares que se parecen demasiado al correcto, cuando comparten al menos la mitad de sus palabras, y los de estructuras relacionadas: así no hay dos respuestas válidas.
- **Laboratorio de imágenes (`/irudiak`).** Cubre las cuatro destrezas de lectura de figuras: señalar, flecha, orientación y plano de corte.
- **Tests** (`tests/study.test.tsx`):
  - «Zer da hau?» nunca muestra la respuesta;
  - «Non dago?» ofrece cuatro lugares distintos;
  - la lógica de orientación es correcta con giro y espejo.
