# Arquitectura

Edukiaren eredua `content/` direktorioan dago: `Topic`-ek egiturak eta 0..1 denbora-lerroan ordenatutako `Stage`-ak biltzen ditu. Datu bakoitzak jatorrizko DOCX edo PDFaren `SourceReference` gordetzen du. Pantailan agertzen diren izen eta azalpen nagusiak euskaraz daude.

`TimelineEngine` hutsa eta determinista da: denbora, norabidea, abiadura eta erreprodukzioa gordetzen ditu. Etapa bakoitzaren egoera denboratik berreraikitzen da. `discrete` etaparen muga adierazteko erabiltzen da; `interpolate`-k prozesuaren aurrerapen pedagogikoa irudikatzen du.

Lehenengo eta bigarren asteetako irudiak SVG geruzetan daude; hirugarren eta laugarren asteetakoak `AdvancedDevelopmentScene`-n. Marrazkiek garapenaren ordena eta egituren harremanak sinplifikatzen dituzte, eta ikuspegia edo ebakidura adierazten dute. `VisualHint`-ek etorkizuneko Three.js aukera uzten du (`renderer: 'three', lazy: true`) edukia marrazteko moduarekin lotu gabe.

El progreso se abstrae tras `ProgressRepository`; `LocalStorageProgressRepository` es la implementación local actual. Una futura implementación Supabase puede sustituirla sin cambiar el motor ni el dominio. Un futuro tutor/RAG debe consumir `SourceReference` y contenido validado, sin convertir texto generado en fuente.

La ruta `/api/tutor` usa `lib/ai/provider.ts` como frontera del proveedor. El adapter actual selecciona Google desde `AI_PROVIDER` y el modelo desde `AI_MODEL`; el tutor queda desactivado por defecto mediante `AI_TUTOR_ENABLED` y `NEXT_PUBLIC_AI_TUTOR_ENABLED`. Si no está habilitado o falta la clave, la interfaz mantiene las explicaciones estáticas sin hacer una llamada externa. Así se puede añadir otro proveedor sin repartir nombres de modelo por los componentes.

Ebaki errealistak (zelula-geruzak, Langman irudien antzera): `components/scenes/section/Section.tsx`-ko `Cells` osagaiak bi polilerro parekatuen artean zelula-xafla bat marrazten du. 3. asteko diskoa `components/scenes/week3/DiscSection.tsx`-ek eraikitzen du (epiblastoa/ektodermoa, mesodermoa, endodermoa, hipoblastoa, amniosa eta bitelo-zakua), eta 4. asteko ebaki sagitalak `components/scenes/week4/FoldSagittal.tsx`-ek: ardatz neuralaren kurbadura integratuz tolesten da enbrioia, eta buru- eta buztan-eremuak mintzetan giltzatutako «hegal» gisa biratzen dira (bihotza aurreko hestearen bentralera, alantoidea eta finkapen-pedikulua bentralera). Heste-hodiaren ikuspegiek (`week4-meso/Stage5Endoderm.tsx`) eredu bera berrerabiltzen dute.
