# Revisión de animaciones de los temas 7 a 9

Estado al 15 de octubre de 2026. El objetivo es que una persona que empieza embriología entienda el proceso, su orientación y su resultado. La revisión se ha detenido por petición del usuario. Los cambios están en el directorio de trabajo, sin commit ni publicación.

Trabajar sin subagentes. No añadir cambios estéticos o funcionalidades sin demostrar una mejora para el aprendizaje. Mantener el contenido en euskera y los apuntes originales intactos.

## Correcciones realizadas en las animaciones

### Pausas que interrumpían el proceso

La pausa de lectura predeterminada quedaba antes del final de algunos movimientos. Se ha añadido `Beat.completeAt` y una función compartida, `lib/sim/beat-completion.ts`, para que la reproducción, la observación narrada y el avance manual utilicen el mismo fotograma final.

- Tema 7, `diafragma-eraketa`, paso de los cuatro componentes: pausa en 0.855. La cúpula alcanza su forma final y los miozitos siguen visibles en las membranas antes de pasar a la vista adulta.
- Tema 8, `gorputz-adarrak`, giro superior: pausa en 0.87. Se completa el giro de 90 grados y aparece la indicación del codo posterior antes de empezar con las piernas.
- Tema 9, `domeinuak`, primer paso: pausa en 0.099. Las células llegan a la hoja parietal; antes la pausa en aproximadamente 0.075 las dejaba a medio camino.

Los pasos sin una excepción conservan sus tiempos anteriores. No se ha cambiado la velocidad global.

### Migración de miozitos sin saltos al origen

En `DiaphragmDome3D.tsx`, el recorrido usaba un módulo que devolvía cada célula de golpe al septum y repetía la migración. Ahora cada célula avanza una vez, en un trayecto ligeramente separado, y permanece en su destino durante la pausa. La explicación de la cúpula tampoco desaparece antes de esa pausa.

### Etiquetas que podían señalar el tejido equivocado

En `LimbRotation3D.tsx`, una etiqueta de flexores podía proyectarse sobre los extensores azules desde delante o sobre el tronco desde detrás. Ahora el anclaje se coloca en la superficie de la masa muscular correspondiente y se comprueba si hay tejido opaco delante. Si no hay un anclaje visible, se oculta esa etiqueta y se indica que se puede girar el modelo.

`lib/three-d/visibility.ts` contiene la comprobación geométrica. Su contrato es **rotación y traslación sin escala**; los elementos utilizados aquí cumplen ese contrato. No extender su uso a matrices con escala sin adaptar el cálculo.

## Mejoras previas que siguen en el mismo directorio de trabajo

- Controles de cámara con flechas y restablecimiento sin reiniciar el desarrollo.
- Límites de órbita para evitar que la cámara se invierta al cruzar los polos.
- Recorrido de estructuras 3D con avance manual.
- Guía `Irudia ulertu` en las cuatro vistas, con orientación, observación y pregunta. Se abre con un botón de la barra de reproducción y se superpone al texto del paso (no cambia la altura del dock ni del 3D); al abrirla se pausa, y se cierra con ✕, Esc, al reproducir o al cambiar de paso.
- Etiquetas del cráneo que siguen la cámara real y eligen el lado visible.
- Subtítulos de orientación que no contradicen el giro manual.
- Aclaración de que la superficie verde de los dominios representa una frontera conceptual, no una membrana anatómica.

Estos cambios ya estaban presentes al comenzar esta revisión específica del movimiento. No separar ni descartar ese trabajo al continuar.

## Ajustes de la revisión posterior

- Paso 9 de `gorputz-adarrak`: mientras giran las piernas, la cámara acompaña el giro hacia atrás-izquierda, para que al final del paso se vean las dos masas que nombra el texto (la suite `visibility` lo exige). Test: `tests/limb-labels.test.tsx`.
- Controles de cámara: cruz redonda compacta en la esquina inferior derecha del 3D (como en un mapa), con el restablecimiento en el centro; arriba solo queda «3D bira» y el aviso temporal de arrastre.
- Oclusión de etiquetas: esfera envolvente por malla para descartar rayos y rayos lanzados por orden de puntuación (normalmente uno por masa). Mismo resultado, aproximadamente la mitad del coste añadido.
- Respuesta de la guía del diafragma alineada con los apuntes (w7: hasierako perikardio barrunbea → pleura barrunbeak; peritoneo barrunbea).

## Contraste con los apuntes

Los tres PDF originales están disponibles en `C:\Users\aitor\Downloads`. También existe su extracción literal en `content/notes-text/w7.ts`, `w8.ts` y `w9.ts`.

| Proceso | Fuente consultada | Relación contrastada |
| --- | --- | --- |
| Diafragma | Tema 7, página 6, secciones 3 y 3.1; `w7/3/p7`, `w7/3.1/p3–p8` | Cierre de los canales, cuatro componentes y migración desde el septum hacia las membranas. |
| Cráneo | Tema 8, página 4, sección 3.1.1 | Situación de huesos, suturas y fontanelas, y superposición de placas durante el parto. |
| Extremidades | Tema 8, página 9, sección 4; `w8/4/p13–p16` | Giros opuestos; flexores anteriores en el miembro superior y extensores anteriores en el inferior. |
| Dominios musculares | Tema 9, página 10, sección 2.2.1 | Migración desde el somita a la hoja parietal y distinción entre dominios. |

Se han inspeccionado las páginas y figuras anteriores. Esto no constituye una auditoría anatómica completa de todos los modelos ni de todas las animaciones de los tres temas.

La contradicción sobre el cierre de la fontanela posterior ya figura en `SOURCE_ISSUES.md`: el tema 8 dice 1–2 meses; la introducción del tema 9 dice «1. eta 2. lauhilabetetan». La simulación mantiene el dato del tema 8. Resolver con el docente antes de cambiarlo; no corregir silenciosamente los originales.

## Verificación realizada

- Navegador local con WebGL: antes y después de las pausas del diafragma, brazos y migración de dominios; final de la rotación inferior; etiquetas de las piernas desde delante y desde una vista posterior oblicua.
- La reproducción guiada del primer paso de dominios mantiene la pausa sin entrar en el siguiente texto.
- Sin errores de página en las sesiones de navegador utilizadas.
- Última ejecución tras la corrección de oclusión: **38 pruebas superadas**, en `animation-completion`, `limb-labels`, `visibility-ray`, `notes` y `view-changes`.
- `npm run typecheck`: correcto tras los últimos cambios de código.
- ESLint de los archivos de animación, cálculo y pruebas modificados en esta revisión: correcto.
- `git diff --check`: correcto; solo avisos de normalización LF/CRLF de Git.

La compilación de producción y las pruebas móviles realizadas en la pasada anterior corresponden a una versión anterior a estas últimas correcciones. No utilizarlas como prueba de la versión final. El lint global tenía un error previo de pureza por `Math.random` en `Simulator.tsx`; esta revisión no lo ha corregido.

## Trabajo pendiente por prioridad

1. **Compilación final y comprobación móvil.** Ejecutar `npm run build` sobre estos cambios y revisar las cuatro escenas a 390 px, especialmente las etiquetas de extremidades y el aviso para girar. El navegador de esta última corrección se ha comprobado en escritorio. `next-env.d.ts` contiene las rutas generadas por `next dev` a `.next/dev/types`; revisar la regeneración del archivo al compilar antes de incluirlo en un commit.

2. **Medir el coste de la oclusión.** La búsqueda del anclaje y las intersecciones se ejecutan durante el render de las extremidades. Solo se calculan las masas del grupo activo, salvo durante la transición, pero falta medir el rendimiento en un dispositivo modesto. Si se detectan tirones, optimizar candidatos o reutilizar resultados conservando la precisión; no quitar la comprobación que evita señalar el tejido equivocado.

3. **Completar el barrido de ángulos y momentos.** Revisar las cuatro vistas con rotación libre, zoom y estructuras seleccionadas. En particular, las indicaciones de codo y rodilla aún usan una extremidad fija; el anclaje de las células de `Domains3D` también merece comprobarse desde el lado contrario. Son puntos a verificar, no fallos visuales confirmados en todas las vistas. Corregir solo si se reproduce un problema.

4. **Recorrer todas las secuencias con audio y movimiento reducido.** El cálculo de la pausa narrada comparte la función corregida, pero no se ha hecho una sesión completa con audio generado. Verificar que el resultado se observe antes de `Jarraitu`, que repetir un paso no produzca saltos y que el modo de movimiento reducido conserve la secuencia pedagógica.

5. **Ampliar la revisión al resto de animaciones de los temas 7 a 9.** Esta pasada se ha concentrado en las cuatro incorporaciones 3D. Los pendientes históricos de `docs/handover/topics-8-9.md` y `docs/visual-plan-7-9.md` necesitan comprobarse contra el código actual antes de ejecutarlos; no asumir que los diagnósticos antiguos siguen vigentes.

6. **Resolver la discrepancia de las fontanelas con el docente.** Mantener el registro existente en `SOURCE_ISSUES.md` mientras no haya una respuesta fiable. No convertir la animación en una fuente de fechas contradictorias.

## Cómo retomar la revisión

El servidor de desarrollo queda en `http://localhost:3005` con `npm run dev -- --webpack --port 3005`.

- Diafragma: `/astea/7?etapa=diafragma-eraketa&ikuspegia=kupula&une=0.757`
- Cráneo: `/astea/8?etapa=buru-ganga&ikuspegia=kupula&une=0.141`
- Brazos: `/astea/8?etapa=gorputz-adarrak&ikuspegia=biraketa&une=0.761`
- Piernas: `/astea/8?etapa=gorputz-adarrak&ikuspegia=biraketa&une=0.881`
- Dominios: `/astea/9?etapa=domeinuak&ikuspegia=domeinuak-3d&une=0.001`

Usar `Ikusi urratsa` o `Hasi` y observar tanto el movimiento como la pausa final. No limitar la revisión a capturas estáticas.

Pruebas enfocadas: `npx vitest run tests/animation-completion.test.ts tests/limb-labels.test.tsx tests/visibility-ray.test.ts tests/notes.test.ts tests/view-changes.test.ts --silent`.

No se ha hecho commit, push ni despliegue. Los PDF y su extracción original permanecen intactos.
