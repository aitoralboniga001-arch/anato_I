# Arquitectura

El dominio vive en `content/`: `Topic` agrupa estructuras y `Stage` ordenadas en un timeline 0..1. Cada dato conserva una `SourceReference` al DOCX de origen. Los términos vascos son primarios; español e inglés son secundarios.

`TimelineEngine` es puro y determinista: no guarda una escena mutada, sino tiempo, dirección, velocidad y reproducción. Cada snapshot se reconstruye desde el tiempo, lo que permite volver atrás exactamente. `discrete` cambia de etapa en los límites; `interpolate` solo comunica progreso pedagógico.

Weeks 1-2 deben representarse con SVG y capas CSS/2.5D: son diagramas anatómicos y celulares explicativos, con lectura clara por capas. `VisualHint` deja un punto de extensión para Three.js lazy (`renderer: 'three', lazy: true`) sin acoplar el dominio al renderer.

El progreso se abstrae tras `ProgressRepository`; `LocalStorageProgressRepository` es la implementación local actual. Una futura implementación Supabase puede sustituirla sin cambiar el motor ni el dominio. Un futuro tutor/RAG debe consumir `SourceReference` y contenido validado, sin convertir texto generado en fuente.

La ruta `/api/tutor` usa `lib/ai/provider.ts` como frontera del proveedor. El adapter actual selecciona Google desde `AI_PROVIDER` y el modelo desde `AI_MODEL`; el tutor queda desactivado por defecto mediante `AI_TUTOR_ENABLED` y `NEXT_PUBLIC_AI_TUTOR_ENABLED`. Si no está habilitado o falta la clave, la interfaz mantiene las explicaciones estáticas sin hacer una llamada externa. Así se puede añadir otro proveedor sin repartir nombres de modelo por los componentes.
