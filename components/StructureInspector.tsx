import type { Stage, Structure, Topic } from "@/content/types";

const notes: Record<string, { description: string; where: string; origin: string; next: string; relationIds: string[] }> = {
  cytotrophoblast: { description: "Nukleo bakarreko zelulez osatutako geruza trofoblastikoa.", where: "Sinzitiotrofoblastoaren barrualdean, endometrioaren aldean.", origin: "Trofoblastotik bereizten da 8. egunean.", next: "13. egunean ugaldu eta biloxka korioniko primarioaren erdigunean agertzen da.", relationIds: ["syncytiotrophoblast", "primary-chorionic-villus"] },
  syncytiotrophoblast: { description: "Nukleo ugariko zelula-magma, ohiko zelula-mintzen banaketarik gabe.", where: "Zitotrofoblastoaren kanpoaldean, endometrioan sakonago.", origin: "Trofoblastoko zelulek mintza galdu eta fusionatzean.", next: "Lakuak eratu eta sinusoideak urratzen ditu 9. eta 11-12. egunetan.", relationIds: ["cytotrophoblast", "chorionic-cavity"] },
  epiblast: { description: "Zelula epiblastiko handiago eta zilindrikoz osatutako geruza.", where: "Disko bilaminarraren goiko aldean, amnios barrunbearen azpian.", origin: "Enbrioblastotik bereizten da 8. egunean.", next: "Iturriak hemen bi orriko diskoaren eta amniosaren harremana nabarmentzen du.", relationIds: ["hypoblast", "amniotic-cavity"] },
  hypoblast: { description: "Zelula hipoblastiko txiki eta kubikoz osatutako geruza.", where: "Disko bilaminarraren beheko aldean, blastozelearekin kontaktuan.", origin: "Enbrioblastotik bereizten da 8. egunean.", next: "Heuser-en mintza eta bitelo zaku sekundarioa osatzen laguntzen du.", relationIds: ["epiblast", "primary-yolk-sac", "secondary-yolk-sac"] },
  "amniotic-cavity": { description: "Epiblastoaren zelulen artean agertzen den barrunbea.", where: "Epiblastoaren gainean, zitotrofoblastoaren aldameneko aldean.", origin: "Epiblastotik sortutako amnioblastoek mugatzen dute.", next: "Korion barrunbearen barruan suspentsioan mantentzen da.", relationIds: ["epiblast", "chorionic-cavity", "connecting-stalk"] },
  "primary-yolk-sac": { description: "Heuser-en mintzak mugatutako hasierako bitelo zakua.", where: "Diskoaren azpian eta mutur anembrionarioan.", origin: "Hipoblastotik eratorritako zelulek Heuser-en mintza eratzean.", next: "13. egunean bitelo zaku sekundario txikiago bihurtzen da.", relationIds: ["hypoblast", "secondary-yolk-sac"] },
  "extraembryonic-mesoderm": { description: "Amniosaren, bitelo zakuaren eta zitotrofoblastoaren artean agertzen den ehuna.", where: "Zitotrofoblastoaren barruko aurpegiaren inguruan eta barrunbeen artean.", origin: "Hasierako bitelo zakuaren paretako zelula-populazio berritik.", next: "Bere espazioak fusionatzean korion barrunbea sortzen da.", relationIds: ["chorionic-cavity", "connecting-stalk"] },
  "chorionic-cavity": { description: "Enbrioi kanpoko zelomaren edo korion barrunbearen izena.", where: "Mesodermo extraembrionarioaren barruan, amniosaren eta bitelo zakuaren inguruan.", origin: "Mesodermo extraembrionarioan sortutako espazioen fusioz.", next: "Finkapen pedikuluan uzten du konexioa.", relationIds: ["extraembryonic-mesoderm", "connecting-stalk"] },
  "connecting-stalk": { description: "Bi mesodermoen elkargunea eta konplexu amniotikoaren lotura-eremua.", where: "Korion barrunbearen barruan geratzen den konexio-eremuan.", origin: "Mesodermo extraembrionarioaren banaketatik.", next: "Iturriak dio geroago zilbor-hestea garatuko dela hemendik.", relationIds: ["chorionic-cavity", "amniotic-cavity"] },
  zygote: { description: "Bi gameto haploideen fusioaren ondoren sortzen den egitura diploidea.", where: "Normalean tronparen anpuluan eratu eta umetokirantz mugitzen da.", origin: "Espermatozoidearen eta obozito sekundarioaren fusiotik.", next: "Blastomeroek segmentazio mitotikoa egiten dute.", relationIds: ["ampulla", "morula"] },
  morula: { description: "12-16 blastomero inguruko zelula-multzo trinkoa, gero 32 zelula ingurura iristen dena.", where: "Tronparen istmoan eta gero umetokiko barrunbean.", origin: "Zigotoaren segmentaziotik.", next: "Likidoak blastozistoaren eraketa abiarazten du.", relationIds: ["zygote", "blastocyst"] },
  blastocyst: { description: "Blastozelea, trofoblastoa eta enbrioblastoa dituen egitura.", where: "Umetokiko barrunbean eta endometrioan ezartzen hasita.", origin: "Morulatik, mintz peluzidoa galdu eta barrunbea eratu ondoren.", next: "Trofoblastoa eta enbrioblastoa gehiago bereizten dira 2. astean.", relationIds: ["trophoblast", "embryoblast", "endometrium"] },
  trophoblast: { description: "Blastozistoaren kanpoko masa zelularra.", where: "Blastozistoaren kanpoaldean, enbrioblastoaren inguruan.", origin: "Morularen kanpoko masa zelularretik.", next: "Zitotrofoblasto eta sinzitiotrofoblasto geruzak sortzen ditu.", relationIds: ["cytotrophoblast", "syncytiotrophoblast"] },
  embryoblast: { description: "Blastozistoaren barruko masa zelularra, mutur batean kokatua.", where: "Trofoblastoaren barruan, mutur embrionarioan.", origin: "Morularen barruko masa zelularretik.", next: "Epiblasto eta hipoblasto bihurtzen da.", relationIds: ["epiblast", "hypoblast"] },
  ampulla: { description: "Tronpa uterinaren atal zabalagoa eta ernalkuntzaren ohiko kokalekua.", where: "Infundibuluaren eta istmoaren artean, obulutegiaren aldean.", origin: "Emakumearen ugal aparatuaren anatomia.", next: "Zigotoa umetokirantz mugitzen da.", relationIds: ["zygote", "female-reproductive-apparatus"] },
  endometrium: { description: "Umetokiaren barruko geruza, mukosaz eta epitelioz osatua.", where: "Miometrioaren barrualdean eta perimetrioaren sakonean.", origin: "Umetokiaren paretako geruza.", next: "Blastozistoaren habiratze-azalera da.", relationIds: ["blastocyst"] },
};

export function getStructureNote(id: string) {
  return notes[id];
}

export default function StructureInspector({ topic, structure, stage, isolated, onToggleIsolation, onAskTutor, tutorEnabled, onClose }: { topic: Topic; structure?: Structure; stage: Stage; isolated: boolean; onToggleIsolation: () => void; onAskTutor: () => void; tutorEnabled: boolean; onClose: () => void }) {
  const note = structure ? getStructureNote(structure.id) : undefined;
  return (
    <aside className="inspector" aria-label="Egitura ikuskatzailea">
      <div className="inspector-top">
        <div>
          <div className="inspector-kicker">Egitura ikuskatzailea</div>
          <h2>{structure?.label.primary ?? "Egitura bat aukeratu"}</h2>
          {structure?.label.secondary?.es && <div className="inspector-term">{structure.label.secondary.es} · {structure.label.secondary.en}</div>}
        </div>
        <button className="icon-button inspector-close" type="button" onClick={onClose} aria-label="Itxi ikuskatzailea">×</button>
      </div>
      <div className="inspector-rule" />
      <p className="inspector-copy">{note?.description ?? structure?.description ?? "Klik egin eszenako geruza batean bere kokapena, jatorria eta hurrengo aldaketa ikusteko."}</p>
      {structure && <>
        <dl className="inspector-grid">
          <div className="inspector-fact"><dt>Mota</dt><dd>{structure.kind}</dd></div>
          <div className="inspector-fact"><dt>Non</dt><dd>{note?.where ?? "Iturrian ageri den kokapena."}</dd></div>
          <div className="inspector-fact"><dt>Jatorria</dt><dd>{note?.origin ?? "Ez dago zehaztuta domeinu laburrean."}</dd></div>
          <div className="inspector-fact"><dt>Ondoren</dt><dd>{note?.next ?? "Ikusi hurrengo etapa denbora-lerroan."}</dd></div>
        </dl>
        <div className={`inspector-action-row ${tutorEnabled ? "" : "single"}`}>
          <button className={`text-button ${isolated ? "primary" : ""}`} type="button" onClick={onToggleIsolation}>{isolated ? "Testuingurua erakutsi" : "Isolatu"}</button>
          {tutorEnabled && <button className="text-button primary" type="button" onClick={onAskTutor}>Azaldu hau</button>}
        </div>
        <div className="inspector-section">
          <h3>Harremanak</h3>
          <ul className="relation-list">{(note?.relationIds ?? stage.structures.filter((id) => id !== structure.id)).slice(0, 4).map((id) => <li key={id}>{topic.structures.find((item) => item.id === id)?.label.primary ?? id}</li>)}</ul>
        </div>
      </>}
      <p className="source-note">Iturria: {structure?.source.file ?? topic.source.file}<br />Atala: {structure?.source.section ?? stage.source.section}</p>
    </aside>
  );
}
