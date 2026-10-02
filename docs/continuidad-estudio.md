# Continuidad del estudio en EnbrioAtlas

Estado: propuesta preparada; implementación pendiente.

Propuesta: retomar el último punto guardado y acceder al repaso pendiente. Prioridad hipotética basada en fricciones del código: reducir búsquedas y clics. Aprendizaje y satisfacción deberán medirse.

## Evidencia y prioridad

Hechos verificados:

- `components/shell/Home.tsx:94`: el botón principal siempre abre el primer tema disponible. En `Home.tsx:36-37`, «Jarraitu» usa la primera etapa no visitada, no la ubicación exacta abandonada.
- `components/shell/progress.ts:37-49`: se guardan etapas visitadas. `Simulator.tsx:483-493` actualiza etapa y vista en la URL, elimina `une` y marca la etapa visitada al abrirla. Visitar no equivale a dominar.
- `components/shell/Questions.tsx:41-58`: el repaso existente selecciona una pregunta por competencia pendiente. `Questions.tsx:80-83` inicia práctica del tema actual.
- `components/shell/StudyMap.tsx:78-79`: practicar y dominar enlazan al tema 1. `StudyMap.tsx:71` cuenta preguntas pendientes, mientras `Questions.tsx:104` cuenta competencias: ambas cifras pueden diferir.
- `Simulator.tsx:1430` y `1885`: abrir/cerrar preguntas no pausa ni restaura reproducción; `questionsOpen` solo afecta `holdLocator` en `1557`. Hay riesgo de perder contexto si se abre durante reproducción, sin afirmar que suceda en toda sesión.

Reconocer el historial reduce la necesidad de recordar dónde estaba el usuario. Fundamenta la propuesta, sin demostrar su impacto: [Recognition vs. Recall, sección History and Previously Visited Content](https://www.nngroup.com/articles/recognition-and-recall/).

| Alternativa | Motivo de prioridad |
| --- | --- |
| Continuidad y repaso directo | Fricción concreta y verificable al regresar; impacto aún hipotético. |
| Más feedback | Ya existe feedback de preguntas; menor urgencia en esta comparación. |
| Optimizar velocidad | Falta una medición que identifique un problema prioritario. |
| Rediseñar PC | Fuera del alcance acordado; conservar la interfaz validada. |

## MVP: una entrada clara al estudio

Primera visita: «Hasi ikasten» abre el primer tema disponible. No mostrar porcentajes de aprendizaje deducidos de visitas.

Con ubicación válida: el botón principal pasa a «Jarraitu ikasten». Un resumen compacto muestra tema, etapa y «Urratsa X/N», derivados del contenido real. Un toque recupera tema, etapa, vista y posición guardada. Empieza pausado, con avance explícito, sin cambiar automáticamente de etapa. Conserva preferencias de modo, voz y apuntes y el acceso a elegir tema, en euskara.

La entrada secundaria «Gaurko errepasoa · N gaitasun» usa el mismo número de competencias que el motor existente para todos los temas. Abre directamente Questions en `errepasoa` y ámbito `denak`, sin mostrar un paso intermedio por el tema 1 ni exigir filtros. Reutiliza reglas y preguntas actuales. Si N es cero, muestra un texto en euskara equivalente a «No hay repaso pendiente» y un acceso discreto a practicar. Entrar al repaso es opcional y siempre se puede cerrar para continuar la simulación; esta mejora no añade preguntas obligatorias.

Al abrir repaso, capturar el origen: desde Home, volver a Home; desde Simulator, snapshot de tema/etapa/vista/t. Pausar antes de abrir Questions. Al cerrar, restaurar el origen y dejar la simulación pausada. Los callbacks actuales `onGoto` → `gotoWeekStage` (`Simulator.tsx:954-967`) y `onFind` → `findConcept` (`1180-1192`) no crean retorno hoy: preparar su extensión para saltos explicativos temporales. Suspender la escritura canónica durante esos saltos hasta «Bueltatu» o una acción explícita de continuar estudiando allí. No se exige conservar o reanudar una sesión de preguntas tras salir.

Usuarios con ubicación válida acceden al bloque de estudio sin repetir automáticamente la introducción. Mantener la primera visita y la reproducción manual. Antes de implementar, revisar `components/shell/intro/Intro.tsx` y `app/layout.tsx`, respetando hidratación y movimiento reducido.

## Persistencia propuesta

Nueva clave local `enbrioatlas:resume`, esquema versión 1: `week`, `stageId`, `viewId`, `t`, `updatedAt`. Validar contra el catálogo real; `t` debe ser numérico finito y se limita a 0–1. Nunca aceptar NaN.

No escribir por fotograma. Durante reproducción con pestaña activa, el objetivo es guardar checkpoints separados como máximo 1000 ms; guardar exactamente al pausar o cambiar etapa/vista. Vaciar pendientes en `pagehide` y `visibilitychange` cuando lo permita el navegador. Un cierre abrupto o la suspensión del navegador puede dejar un checkpoint anterior: no se garantiza el intervalo real en segundo plano. Leer durante hidratación y resolver enlaces explícitos antes de guardar: el estado inicial no debe pisar una restauración.

La URL explícita prevalece al cargar. El registro guardado solo se aplica mediante la acción de retomar, sin redirección global. JSON inválido o etapa eliminada conduce a «Hasi ikasten»; una vista eliminada usa la vista primaria válida. Al terminar la última etapa, conservar el final y ofrecer «Berrikusi», sin siguiente inexistente.

Si el almacenamiento falla, la app sigue funcionando y no afirma haber guardado. El alcance es este navegador y dispositivo, sin cuentas ni sincronización. Entre pestañas, prevalece el último contexto utilizado intencionalmente; escuchar `storage` para actualizar la disponibilidad sin mover sesiones abiertas.

## Interfaz y archivos previstos

Reutilizar CTA, resumen compacto y repaso secundario. Sin dashboard nuevo. Móvil: 360, 390, 430 y 820 px, controles de 44 px, sin desbordamiento. PC: cambios limitados al inicio; conservar escena, cabecera y reproductor validados a 1280 px. Interfaz en euskara; documento en español.

Cambios previstos:

- `components/shell/resume.ts`: almacenamiento validado y pruebas de comportamiento.
- `Home.tsx` y `Simulator.tsx`: CTA, persistencia, restauración y enlace de apertura del repaso.
- `Questions.tsx`: parámetros iniciales de modo y ámbito validados; helper común de selección y contador compartido con `StudyMap.tsx`.
- `components/shell/intro/Intro.tsx`/`app/layout.tsx`, solo si hace falta; `globals.css`, acotada al inicio y móvil.

No cambiar contenidos, escenas, ritmo, apuntes originales, dependencias ni sincronización. Duración de sesiones, personalización del coach y restauración de sesiones de preguntas quedan fuera del MVP.

## Aceptación y validación futura

1. Pausar en tema 3, etapa a medias y vista secundaria, cerrar y reabrir: un toque recupera dibujo y paso exactos, pausados. Durante reproducción, recuperar el último checkpoint; admitir hasta 1 s sin guardar con pestaña activa, sin garantía de ese intervalo ante suspensión o cierre abrupto.
2. Un enlace explícito diferente prevalece. Abrir repaso mientras reproduce detiene la posición. Cerrar desde Home vuelve a Home; desde Simulator restaura el snapshot pausado. Las rutas de explicación conservan la ubicación guardada y permiten volver al origen.
3. N coincide con las competencias listadas antes de responder; cambios de fecha actualizan lo pendiente.
4. Cubrir primera visita, cero pendientes, registro corrupto, almacenamiento bloqueado, final de última etapa y varias pestañas.
5. Mantener controles móviles, ausencia de desbordamiento y cambios mínimos en PC.

Orden de implementación: almacenamiento validado; CTA y restauración; helper y enlace de repaso; introducción apropiada; QA. Ejecutar pruebas significativas de almacenamiento, enlaces y competencias pendientes; las 332 regresiones existentes, TypeScript, lint y build; después flujos reales en navegador móvil/PC y verificación independiente. Estas comprobaciones no se han ejecutado para esta mejora.

Medición propuesta: observar a cinco alumnos, sin analítica. Comparar tiempo hasta estudiar, errores, pasos y facilidad (1–5). Objetivo: retomar con un toque desde portada. Afirmar satisfacción medida solo tras recoger resultados.
