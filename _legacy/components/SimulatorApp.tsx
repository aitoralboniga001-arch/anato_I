"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  allGlossaryTerms,
  allTopics,
  getStage,
  getStructure,
  getTopic,
} from "@/content";
import type { GlossaryTerm, Stage, Structure, Topic } from "@/content/types";
import { LocalStorageProgressRepository } from "@/lib/progress";
import { TimelineEngine, type TimelineSnapshot } from "@/simulation/engine/timeline";
import SimulationViewport from "@/components/SimulationViewport";
import ExplanationPanel from "@/components/ExplanationPanel";
import StructureInspector from "@/components/StructureInspector";
import AITutor from "@/components/AITutor";

type TopicId = "week-1" | "week-2" | "week-3" | "week-4";
type LearningMode = "IKUSI" | "ULERTU" | "IKASI";

const speedOptions = [0.5, 1, 1.5, 2];
const playbackDurationSeconds = 48;

const stageBasque: Record<string, { summary: string; changes: string[]; relations: string[]; caution?: string }> = {
  orientation: {
    summary: "Planoek eta ardatzek enbrioia espazioan kokatzeko erreferentzia ematen dute. Pantailako biraketak ez du kraneal, kaudal, bentrala edo dortsala aldatzen.",
    changes: ["Plano sagitala eta koronala bereizi.", "Luzetarako, zeharkako eta dortsobentral ardatzak kokatu."],
    relations: ["Plano sagitalak ezkerra eta eskuina bereizten ditu.", "Plano koronala aurreko eta atzeko aldeak bereizten ditu."],
    caution: "Enbrioia buruz behera egon daiteke, baina norabide anatomikoek ez dute zentzua galtzen.",
  },
  fertilization: {
    summary: "Obulazioan askatutako obozito sekundarioa tronparen anpulura iristen da. Ernalkuntzak koroa erradiatua eta mintz peluzidoa zeharkatu, mintzak fusionatu eta zigotoa eratzen du.",
    changes: ["Obozito sekundarioa finbriek harrapatu dute.", "Akrosomaren eta erreakzio kortikalaren ondoren, pronukleoak eta zigotoa agertzen dira."],
    relations: ["Ernalkuntza normalean tronparen anpulua den eremuan gertatzen da.", "Zigotoa mintz peluzidoz inguratuta dago."],
    caution: "Obulazioan ateratzen dena obozito sekundarioa da, ez obulu heldua. Bigarren meiosia ernalkuntzarekin amaitzen da.",
  },
  cleavage: {
    summary: "Zigotoa umetokirantz mugitzen den bitartean, blastomeroek mitosiz zatitzen dira. Zelula gehiago agertzen dira, baina kontzeptuaren tamaina osoa gutxi gorabehera mantentzen da.",
    changes: ["Bi zelulatik lau zelulara eta 12-16 blastomerora igaro.", "Morularen kanpoko eta barruko masa zelularrak bereizi."],
    relations: ["Blastomero guztiak mintz peluzidoak inguratzen ditu.", "Morula tronparen istmoan zehar umetokiko barrunberantz doa."],
    caution: "Zelula bakoitza txikiagoa da, baina egitura osoa ez da handitzen segmentazioan.",
  },
  "blastocyst-formation": {
    summary: "Morularen zelulen artean likidoa sartzen da. Espazio txikiak elkartu eta blastozelea eratzen dute; kanpoko masa trofoblastoa da eta barruko masa enbrioblastoa.",
    changes: ["Barrunbe txikiak blastozele bakarrean elkartu.", "Trofoblastoa kanpoaldean eta enbrioblastoa mutur batean kokatu."],
    relations: ["Enbrioblastoa trofoblastoaren barruan dago, mutur embrionarioan.", "Blastozistoak mutur embrionarioa eta anembrionarioa ditu."],
    caution: "Morula eta blastozistoa ez dira irudi berdina: barrunbea eta bi masa zelularren kokapena dira aldaketa nagusiak.",
  },
  implantation: {
    summary: "Lehenengo astearen amaieran blastozistoa endometrioko mukosara hurbiltzen da eta ezartzen hasten da. Umetokiaren paretak endometrioa, miometrioa eta perimetrioa ditu.",
    changes: ["Zona peluzidoa galdu ondoren, blastozistoa endometrioan txertatzen hasi.", "Trofoblastoaren enbrioblasto-aldeko zelulek epitelioaren artean sartzen lagundu."],
    relations: ["Endometrioa barruko geruza da; miometrioa tarteko muskulu-geruza eta perimetrioa kanpokoa.", "Ezarpena normalean umetokiko aurreko edo atzeko paretan azaltzen da iturrian."],
    caution: "Iturriak ezohiko habiratze-lekuak ere aipatzen ditu: umetoki-tuba, obulutegia eta peritoneo-barrunbea.",
  },
  "day-8": {
    summary: "Blastozistoa endometrioan partzialki sartuta dago. Trofoblastoa zitotrofoblastoan eta sinzitiotrofoblastoan bereizten da; enbrioblastoak epiblastoa, hipoblastoa eta bi orriko ernetze diskoa eratzen ditu.",
    changes: ["Trofoblastoa bi geruzatan antolatu.", "Enbrioblastoa epiblasto eta hipoblasto bihurtu.", "Epiblastoaren artean amnios barrunbea eta amnioblastoak agertu."],
    relations: ["Hipoblastoa blastozelearekin kontaktuan dago.", "Epiblastoa hipoblastoaren gainean dago; bien artean disko bilaminarraren plano laua dago."],
    caution: "Sinzitiotrofoblastoan nukleoak ikusten dira, baina ez ohiko zelula-mintzen banaketa.",
  },
  "day-9": {
    summary: "Blastozistoa ia guztiz sartuta dago. Sinzitiotrofoblastoan bakuolak handitu eta lakuak elkartzen hasten dira, garai lakunarra osatuz. Hipoblastotik Heuser-en mintza sortzen da.",
    changes: ["Fibrinazko koaguloa ezarpeneko gainazalean agertu.", "Bakuolak laku bihurtu sinzitiotrofoblastoan.", "Hasierako bitelo zakua mintz exozelomikoak mugatu."],
    relations: ["Heuser-en mintzak zitoaren barruko azalera estaltzen du mutur anembrionarioan.", "Endometrioko odol-hodiek sinusoide izena hartzen dute."],
    caution: "Blastozelea ez da desagertu irudiaren zentzuan: mintz exozelomikoak mugatutako hasierako bitelo zaku gisa izendatzen da.",
  },
  "days-11-12": {
    summary: "Lakuak handitu eta konektatu egiten dira. Sinzitiotrofoblastoak sinusoideen hormak urratzen ditu, eta amaren odola laku-sarean sartzen hasten da. Aldi berean, mesodermo extraembrionarioak eta korion barrunbeak agertzen dira.",
    changes: ["Banakako lakuetatik sare lakunar konektatura igaro.", "Odol-fluxua sinusoideetatik laku-sarera ireki.", "Mesodermo extraembrionarioaren espazioak elkartu eta korion barrunbea sortu."],
    relations: ["Korion barrunbeak amniosaren eta bitelo zakuaren inguruan egiten du, finkapen pedikulua izan ezik.", "Mesodermoaren kokapenak orri somatikoa eta errai-orria bereizten ditu."],
    caution: "Orri somatikoa eta esplaknopleura ez dira bi ehun independente: mesodermo extraembrionario jarraituaren izen lokalak dira.",
  },
  "day-13": {
    summary: "Blastozistoa guztiz sartuta dago eta endometrioko epitelioak bere osotasuna berreskuratu du. Biloxka korioniko primarioak sortzen dira, eta hasierako bitelo zakua sekundario bihurtzen da.",
    changes: ["Fibrinazko koaguloa desagertu eta gainazal epiteliala itxi.", "Zitotrofoblastoaren hazkundeak biloxka primarioak sortu.", "Hasierako bitelo zakua txikiagoa den sekundario bihurtu."],
    relations: ["Biloxka primarioaren erdigunea zitotrofoblastoa da eta kanpoaldea sinzitiotrofoblastoa.", "Amnios barrunbea eta bitelo zaku sekundarioa korion plakatik finkapen pedikuluaren bidez eskegita agertzen dira."],
    caution: "Finkapen pedikulua ez da oraindik zilbor-heste osoa: iturriak geroago garatuko dela dio.",
  },
};

const structureNotes: Record<string, { description: string; where: string; origin: string; next: string; relationIds: string[] }> = {
  cytotrophoblast: { description: "Nukleo bakarreko zelulez osatutako geruza trofoblastikoa.", where: "Sinzitiotrofoblastoaren barrualdean, endometrioaren aldean.", origin: "Trofoblastotik bereizten da 8. egunean.", next: "13. egunean ugaldu eta biloxka korioniko primarioaren erdigunean agertzen da.", relationIds: ["syncytiotrophoblast", "primary-chorionic-villus"] },
  syncytiotrophoblast: { description: "Nukleo ugariko zelula-magma, ohiko zelula-mintzen banaketarik gabe.", where: "Zitotrofoblastoaren kanpoaldean, endometrioan sakonago.", origin: "Trofoblastoko zelulek mintza galdu eta fusionatzean.", next: "Lakuak eratu eta sinusoideak urratzen ditu 9. eta 11-12. egunetan.", relationIds: ["cytotrophoblast", "trophoblastic-lacunae", "chorionic-cavity"] },
  epiblast: { description: "Zelula epiblastiko handiago eta zilindrikoz osatutako geruza.", where: "Disko bilaminarraren goiko aldean, amnios barrunbearen azpian.", origin: "Enbrioblastotik bereizten da 8. egunean.", next: "Iturriak hemen bi orriko diskoaren eraketa eta amniosaren harremana nabarmentzen ditu.", relationIds: ["hypoblast", "amniotic-cavity", "bilaminar-disc"] },
  hypoblast: { description: "Zelula hipoblastiko txiki eta kubikoz osatutako geruza.", where: "Disko bilaminarraren beheko aldean, blastozelearekin kontaktuan.", origin: "Enbrioblastotik bereizten da 8. egunean.", next: "Zelulak ugaldu eta Heuser-en mintza eta bitelo zaku sekundarioa osatzen laguntzen dute.", relationIds: ["epiblast", "primary-yolk-sac", "secondary-yolk-sac"] },
  "amniotic-cavity": { description: "Epiblastoaren zelulen artean agertzen den barrunbea.", where: "Epiblastoaren gainean, zitotrofoblastoaren aldameneko aldean.", origin: "Epiblastotik sortutako amnioblastoek mugatzen dute.", next: "Korion barrunbearen barruan suspentsioan mantentzen da.", relationIds: ["epiblast", "chorionic-cavity", "connecting-stalk"] },
  "primary-yolk-sac": { description: "Heuser-en mintzak mugatutako hasierako bitelo zakua.", where: "Diskoaren azpian eta mutur anembrionarioan.", origin: "Hipoblastotik eratorritako zelulek Heuser-en mintza eratzean.", next: "13. egunean bitelo zaku sekundario txikiago bihurtzen da.", relationIds: ["hypoblast", "extraembryonic-mesoderm", "secondary-yolk-sac"] },
  "extraembryonic-mesoderm": { description: "Amniosaren, bitelo zakuaren eta zitotrofoblastoaren artean agertzen den ehuna.", where: "Zitotrofoblastoaren barruko aurpegiaren inguruan eta barrunbeen artean.", origin: "Hasierako bitelo zakuaren paretako zelula-populazio berritik.", next: "Bere espazioak fusionatzean korion barrunbea sortzen da.", relationIds: ["chorionic-cavity", "connecting-stalk", "primary-yolk-sac"] },
  "chorionic-cavity": { description: "Enbrioi kanpoko zelomaren edo korion barrunbearen izena.", where: "Mesodermo extraembrionarioaren barruan, amniosaren eta bitelo zakuaren inguruan.", origin: "Mesodermo extraembrionarioan sortutako espazioen fusioz.", next: "Amniosaren eta bitelo zakuaren konplexua inguratu eta finkapen pedikuluan uzten du konexioa.", relationIds: ["extraembryonic-mesoderm", "amniotic-cavity", "connecting-stalk"] },
  "connecting-stalk": { description: "Bi mesodermoen elkargunea, konplexu amniotikoa eta bitelo zakua korion plakarekin lotzen dituena.", where: "Korion barrunbearen barruan geratzen den konexio-eremuan.", origin: "Mesodermo extraembrionarioaren banaketatik.", next: "Iturriak dio geroago zilbor-hestea garatuko dela hemendik.", relationIds: ["chorionic-cavity", "amniotic-cavity", "secondary-yolk-sac"] },
  zygote: { description: "Bi gameto haploideen fusioaren ondoren sortzen den egitura diploidea.", where: "Normalean tronparen anpuluan eratu eta umetokirantz mugitzen da.", origin: "Espermatozoidearen eta obozito sekundarioaren fusiotik.", next: "Blastomeroek segmentazio mitotikoa egiten dute.", relationIds: ["ampulla", "morula", "blastocyst"] },
  morula: { description: "12-16 blastomero inguruko zelula-multzo trinkoa, gero 32 zelula ingurura iristen dena.", where: "Tronparen istmoan eta gero umetokiko barrunbean.", origin: "Zigotoaren segmentaziotik.", next: "Likidoa zelulen artean sartzean blastozistoaren eraketa hasten da.", relationIds: ["zygote", "blastocyst"] },
  blastocyst: { description: "Blastozelea, trofoblastoa eta enbrioblastoa dituen egitura.", where: "Umetokiko barrunbean eta, 6. egunetik aurrera, endometrioan ezartzen hasita.", origin: "Morulatik, mintz peluzidoa galdu eta likidozko barrunbea eratu ondoren.", next: "Trofoblastoa eta enbrioblastoa gehiago bereizten dira 2. astean.", relationIds: ["trophoblast", "embryoblast", "endometrium"] },
  trophoblast: { description: "Blastozistoaren kanpoko masa zelularra.", where: "Blastozistoaren kanpoaldean, enbrioblastoaren inguruan.", origin: "Morularen kanpoko masa zelularretik.", next: "Zitotrofoblasto eta sinzitiotrofoblasto geruzak sortzen ditu.", relationIds: ["blastocyst", "cytotrophoblast", "syncytiotrophoblast"] },
  embryoblast: { description: "Blastozistoaren barruko masa zelularra, mutur batean kokatua.", where: "Trofoblastoaren barruan, mutur embrionarioan.", origin: "Morularen barruko masa zelularretik.", next: "Epiblasto eta hipoblasto bihurtzen da.", relationIds: ["blastocyst", "epiblast", "hypoblast"] },
  ampulla: { description: "Tronpa uterinaren atal zabalagoa eta ernalkuntzaren ohiko kokalekua.", where: "Infundibuluaren eta istmoaren artean, obulutegiaren aldean.", origin: "Emakumearen ugal aparatuaren anatomia.", next: "Zigotoa umetokirantz mugitzen da tronpan zehar.", relationIds: ["zygote", "female-reproductive-apparatus"] },
  endometrium: { description: "Umetokiaren barruko geruza, mukosaz eta epitelioz osatua.", where: "Miometrioaren barrualdean eta perimetrioaren sakonean.", origin: "Umetokiaren paretako geruza.", next: "Blastozistoaren habiratze-azalera eta desidua erreakzioaren kokalekua.", relationIds: ["blastocyst"] },
};

function displayStage(stage: Stage) {
  return stage.explanation
    ? { summary: stage.summary, ...stage.explanation }
    : stageBasque[stage.id] ?? { summary: stage.summary, changes: [], relations: [] };
}

function primaryStructure(topic: Topic, id?: string) {
  return id ? getStructure(topic.id, id) : undefined;
}

export default function SimulatorApp({ defaultTopic }: { defaultTopic: TopicId }) {
  const [topicId, setTopicId] = useState<TopicId>(defaultTopic);
  const topic = getTopic(topicId) ?? allTopics[1];
  const engineRef = useRef<TimelineEngine>(new TimelineEngine(topic.stages));
  const [timeline, setTimeline] = useState<TimelineSnapshot>(() => new TimelineEngine(topic.stages).getState());
  const [selectedId, setSelectedId] = useState<string | null | undefined>(topic.stages[0]?.structures[0]);
  const [mode, setMode] = useState<LearningMode>("IKUSI");
  const [showLabels, setShowLabels] = useState(true);
  const [showComparison, setShowComparison] = useState(false);
  const [crossSection, setCrossSection] = useState(false);
  const [isolate, setIsolate] = useState(false);
  const [relationsOn, setRelationsOn] = useState(false);
  const [tutorOpen, setTutorOpen] = useState(false);
  const [glossaryOpen, setGlossaryOpen] = useState(false);
  const [glossaryQuery, setGlossaryQuery] = useState("");
  const aiTutorEnabled = process.env.NEXT_PUBLIC_AI_TUTOR_ENABLED === "true";

  const commit = useCallback((next: TimelineSnapshot, saveTopic: Topic = topic) => {
    setTimeline(next);
    if (typeof window !== "undefined") {
      const repository = new LocalStorageProgressRepository(window.localStorage);
      repository.save({
        topicId: saveTopic.id,
        timeline: next.time,
        completedStageIds: next.time >= 1 ? saveTopic.stages.map((stage) => stage.id) : [],
        updatedAt: new Date().toISOString(),
      });
    }
  }, [topic]);

  useEffect(() => {
    if (!timeline.playing) return;
    const timer = window.setInterval(() => commit(engineRef.current.tick(0.05 / playbackDurationSeconds)), 50);
    return () => window.clearInterval(timer);
  }, [timeline.playing, commit]);

  useEffect(() => {
    document.querySelector(".main-area")?.scrollTo({ top: 0, behavior: "auto" });
  }, [timeline.stage.id]);

  const activeSelectionId = selectedId === null ? undefined : selectedId ?? timeline.stage.structures[0];
  const selected = primaryStructure(topic, activeSelectionId);
  const stageInfo = displayStage(timeline.stage);
  const stageIndex = timeline.stageIndex;
  const relationIds = relationsOn ? (structureNotes[selected?.id ?? ""]?.relationIds ?? []) : [];
  const visibleStructures = timeline.stage.structures
    .map((id) => getStructure(topic.id, id)?.label.primary)
    .filter(Boolean) as string[];

  const resetTopic = (nextTopicId: TopicId) => {
    const nextTopic = getTopic(nextTopicId);
    if (!nextTopic) return undefined;
    const nextEngine = new TimelineEngine(nextTopic.stages);
    engineRef.current = nextEngine;
    const first = nextEngine.getState();
    setTopicId(nextTopicId);
    setTimeline(first);
    setSelectedId(first.stage.structures[0]);
    setShowComparison(false);
    setCrossSection(false);
    setIsolate(false);
    setRelationsOn(false);
    window.history.replaceState(null, "", `/topics/${nextTopicId}`);
    return nextEngine;
  };

  const chooseStage = (index: number) => {
    const next = topic.stages[Math.max(0, Math.min(index, topic.stages.length - 1))];
    if (!next || !engineRef.current) return;
    commit(engineRef.current.scrub(next.start));
    setSelectedId(next.structures[0]);
    setCrossSection(false);
  };

  const selectStructure = (id: string) => {
    setSelectedId(id);
    if (mode === "IKASI") setIsolate(true);
  };

  const openGlossaryTerm = (term: GlossaryTerm) => {
    const sourceWeek = Number(term.source.file.match(/^([1-4])\./)?.[1] ?? 1);
    const nextTopicId = `week-${sourceWeek}` as TopicId;
    const nextEngine = nextTopicId !== topicId ? resetTopic(nextTopicId) : engineRef.current;
    const targetTopic = getTopic(nextTopicId);
    const mappings: Record<string, { structure?: string; stage?: string }> = {
      cranial: { structure: "sagittal-plane", stage: "orientation" },
      caudal: { structure: "sagittal-plane", stage: "orientation" },
      "ventral-dorsal": { structure: "coronal-plane", stage: "orientation" },
      blastocoel: { structure: "blastocoel", stage: "blastocyst-formation" },
      lacunae: { structure: "trophoblastic-lacunae", stage: "day-9" },
      "decidual-reaction": { structure: "decidual-reaction", stage: "days-11-12" },
      "somatopleure-splanchnopleure": { structure: "somatic-mesoderm", stage: "days-11-12" },
      gastrulation: { structure: "definitive-endoderm", stage: "germ-layers" },
      notochord: { structure: "notochord", stage: "notochord" },
      "neurenteric-canal": { structure: "neurenteric-canal", stage: "notochord" },
      "chorionic-villi": { structure: "secondary-chorionic-villus", stage: "villi-secondary" },
      "placental-barrier": { structure: "placental-barrier", stage: "villi-tertiary" },
      neurulation: { structure: "neural-plate", stage: "neural-plate" },
      neuropore: { structure: "cranial-neuropore", stage: "neural-tube" },
      "neural-crest": { structure: "neural-crest", stage: "neural-crest" },
      somite: { structure: "somites", stage: "somites" },
      "intraembryonic-coelom": { structure: "intraembryonic-coelom", stage: "lateral-plate" },
      "vitelline-duct": { structure: "vitelline-duct", stage: "gut-tube" },
    };
    const map = mappings[term.id];
    if (targetTopic && map && nextEngine) {
      const targetStage = getStage(nextTopicId, map.stage ?? targetTopic.stages[0].id);
      if (targetStage) commit(nextEngine.scrub(targetStage.start), targetTopic);
      setSelectedId(map.structure);
    }
    setGlossaryOpen(false);
    setGlossaryQuery("");
  };

  const filteredGlossary = useMemo(() => {
    const query = glossaryQuery.trim().toLocaleLowerCase("eu");
    return allGlossaryTerms.filter((term) => !query || term.label.primary.toLocaleLowerCase("eu").includes(query));
  }, [glossaryQuery]);

  const tutorContext = {
    topic: topic.title.primary,
    stage: timeline.stage.title.primary,
    developmentalTime: timeline.stage.title.primary,
    selectedStructure: selected?.label.primary ?? null,
    visibleStructures,
    previousStage: topic.stages[stageIndex - 1]?.title.primary ?? null,
    nextStage: topic.stages[stageIndex + 1]?.title.primary ?? null,
    currentExplanation: stageInfo.summary,
    relevantCourseSource: timeline.stage.source,
    studentMode: mode,
    preferredLanguage: "eu",
  };

  return (
    <main className="app-frame">
      <header className="topbar">
        <Link className="brand-lockup" href="/" aria-label="Hasierara itzuli">
          <span className="brand-mark">EM</span>
          <span>
            <span className="brand-name">Enbriologia interaktiboa</span>
            <span className="brand-subtitle">Atlas bisuala · lehen maila</span>
          </span>
        </Link>
        <div className="topbar-meta" aria-live="polite">
          <strong>{topic.title.primary}</strong>
          <span className="crumb-divider">/</span>
          <span>{timeline.stage.title.primary}</span>
          <span className="crumb-divider">/</span>
          <span>{Math.round(timeline.time * 100)}%</span>
        </div>
        <div className="topbar-actions">
          <button className="quiet-button" type="button" onClick={() => setGlossaryOpen(true)}>Glosarioa</button>
          {aiTutorEnabled ? <button className="quiet-button" type="button" onClick={() => setTutorOpen((open) => !open)}>Tutorea</button> : <span className="ai-status" role="status">AI · desaktibatuta</span>}
        </div>
      </header>

      <aside className="rail" aria-label="Nabigazio azkarra">
        {allTopics.map((item) => <button className={`rail-button ${topicId === item.id ? "active" : ""}`} type="button" key={item.id} onClick={() => resetTopic(item.id as TopicId)} aria-label={item.title.primary}>{String(item.week).padStart(2, "0")}</button>)}
        <span className="rail-spacer" />
        <button className="rail-button" type="button" onClick={() => setGlossaryOpen(true)} aria-label="Glosarioa">G</button>
        <span className="rail-caption">EUSKARA · MED</span>
      </aside>

      <aside className="sidebar" aria-label="Ikasgaiaren nabigazioa">
        <div>
          <div className="sidebar-eyebrow">Ikasketa espazioa</div>
          <h1>Garapenaren<br />mapa</h1>
          <p className="sidebar-intro">Mugitu etapetan eta ikusi egiturak nola aldatzen diren.</p>
        </div>
        <nav className="topic-list" aria-label="Asteak">
          {allTopics.map((item) => (
            <button className={`topic-link ${item.id === topicId ? "active" : ""}`} key={item.id} type="button" onClick={() => resetTopic(item.id as TopicId)}>
              <span className="topic-link-index">0{item.week} / GAIA</span>
              <span className="topic-link-title">{item.title.primary}</span>
              <span className="topic-link-meta">{item.stages.length} etapa · SVG</span>
            </button>
          ))}
        </nav>
        <div className="sidebar-section">
          <div className="sidebar-section-heading"><span>Etapak</span><span>{String(stageIndex + 1).padStart(2, "0")} / {String(topic.stages.length).padStart(2, "0")}</span></div>
          <nav className="stage-nav" aria-label="Garapenaren etapak">
            {topic.stages.map((item, index) => (
              <button className={`stage-nav-item ${index === stageIndex ? "active" : ""}`} type="button" key={item.id} onClick={() => chooseStage(index)}>
                <span className="stage-nav-day">{item.title.primary.split(" ")[0]}</span>
                <span className="stage-nav-label">{item.title.primary.replace(/^\S+\s*/, "") || item.title.primary}</span>
              </button>
            ))}
          </nav>
        </div>
        <p className="sidebar-footnote">Iturri nagusiak<br />Ikastaroko lau apunte zuzenduta</p>
      </aside>

      <section className="main-area">
        <div className="main-area-inner">
          <div className="viewport-header">
            <div>
              <div className="viewport-kicker">{mode} · eszena aktiboa</div>
              <h2 className="viewport-title">{timeline.stage.title.primary}</h2>
            </div>
            <p className="viewport-description">{stageInfo.summary}</p>
          </div>

          <div className="mode-strip" role="group" aria-label="Ikasketa moduak">
            <span className="mode-label">MODUA</span>
            {(["IKUSI", "ULERTU", "IKASI"] as LearningMode[]).map((item) => (
              <button className={`mode-button ${mode === item ? "active" : ""}`} type="button" key={item} onClick={() => { setMode(item); if (item !== "IKASI") setIsolate(false); }} aria-pressed={mode === item}>{item}</button>
            ))}
          </div>

          <SimulationViewport
            topic={topic}
            stage={timeline.stage}
            stageProgress={timeline.stageProgress}
            selectedId={selected?.id}
            relationIds={relationIds}
            isolated={isolate}
            showLabels={showLabels && mode !== "IKASI"}
            showComparison={showComparison}
            crossSection={crossSection}
            onToggleCrossSection={() => setCrossSection((visible) => !visible)}
            onSelect={selectStructure}
          />

          <div className="viewport-tools" style={{ marginTop: 13 }}>
            <button className={`control-button ${showLabels ? "active" : ""}`} type="button" onClick={() => setShowLabels((visible) => !visible)} aria-pressed={showLabels}>Etiketak {showLabels ? "·" : "ez"}</button>
            <button className={`control-button ${showComparison ? "active" : ""}`} type="button" onClick={() => setShowComparison((visible) => !visible)} aria-pressed={showComparison}>Aurreko egoera</button>
            <button className={`control-button ${isolate ? "active" : ""}`} type="button" onClick={() => setIsolate((visible) => !visible)} aria-pressed={isolate}>Isolatu</button>
            <button className={`control-button ${relationsOn ? "active" : ""}`} type="button" onClick={() => setRelationsOn((visible) => !visible)} aria-pressed={relationsOn}>Harremanak erakutsi</button>
          </div>

          <ExplanationPanel stage={timeline.stage} info={stageInfo} mode={mode} topic={topic} />
        </div>
      </section>

      <StructureInspector topic={topic} structure={selected} stage={timeline.stage} isolated={isolate} onToggleIsolation={() => setIsolate((visible) => !visible)} onAskTutor={() => setTutorOpen(true)} tutorEnabled={aiTutorEnabled} onClose={() => setSelectedId(null)} />

      <section className="timeline" aria-label={topic.week >= 3 ? "Ikasketa-ibilbidea" : "Garapenaren denbora-lerroa"}>
        <div className="timeline-top">
        <div className="timeline-title"><strong>{topic.week >= 3 ? "Ikasketa-ibilbidea" : "Garapenaren denbora-lerroa"}</strong><span>{topic.week >= 3 ? "Prozesu batzuk aldi berean gertatzen dira" : "mugitu · atzera · aurrera"}</span></div>
          <div className="timeline-actions">
            <button className="timeline-control" type="button" onClick={() => commit(engineRef.current.previous())} aria-label="Aurreko etapa">◀</button>
            <button className="timeline-control play" type="button" onClick={() => commit(timeline.playing ? engineRef.current.pause() : engineRef.current.play())} aria-label={timeline.playing ? "Pausatu" : "Erreproduzitu"}>{timeline.playing ? "Ⅱ" : "▶"}</button>
            <button className="timeline-control" type="button" onClick={() => commit(engineRef.current.reverse())} aria-label="Atzerantz erreproduzitu">↶</button>
            <button className="timeline-control" type="button" onClick={() => commit(engineRef.current.next())} aria-label="Hurrengo etapa">▶</button>
            <button className="timeline-control" type="button" onClick={() => commit(engineRef.current.restart())} aria-label="Berrabiarazi">↺</button>
            <div className="speed-control" aria-label="Abiadura">
              {speedOptions.map((speed) => <button className={`speed-button ${timeline.speed === speed ? "active" : ""}`} type="button" key={speed} onClick={() => commit(engineRef.current.setSpeed(speed))}>{speed}x</button>)}
            </div>
          </div>
        </div>
        <div className="timeline-track-wrap">
          <div className="timeline-track"><span className="timeline-progress" style={{ width: `${timeline.time * 100}%` }} /></div>
          <input className="timeline-range" type="range" min="0" max="1" step="0.001" value={timeline.time} onChange={(event) => commit(engineRef.current.scrub(Number(event.target.value)))} aria-label={topic.week >= 3 ? "Mugitu ikasketa-ibilbidean" : "Mugitu garapenaren denboran"} />
          <span className="timeline-thumb" style={{ left: `${timeline.time * 100}%` }} />
        </div>
        <div className="stage-markers">
          {topic.stages.map((item, index) => <button className={`stage-button ${index === stageIndex ? "active" : ""}`} type="button" key={item.id} onClick={() => chooseStage(index)}><span className="stage-button-line" /><span className="stage-button-day">{String(index + 1).padStart(2, "0")}</span><span className="stage-button-label">{item.title.primary}</span></button>)}
        </div>
      </section>

      {mode === "IKASI" && <QuizCard key={`${topic.id}:${timeline.stage.id}`} topic={topic} stage={timeline.stage} selectedId={selected?.id} onSelect={selectStructure} />}
      {tutorOpen && aiTutorEnabled && <AITutor context={tutorContext} onClose={() => setTutorOpen(false)} />}
      {glossaryOpen && <GlossaryDialog query={glossaryQuery} setQuery={setGlossaryQuery} terms={filteredGlossary} onClose={() => { setGlossaryOpen(false); setGlossaryQuery(""); }} onOpen={openGlossaryTerm} />}
    </main>
  );
}

function QuizCard({ topic, stage, selectedId, onSelect }: { topic: Topic; stage: Stage; selectedId?: string; onSelect: (id: string) => void }) {
  const [answer, setAnswer] = useState<string | null>(null);
  const question = topic.id === "week-2" && stage.id === "day-13"
    ? { text: "Zein egitura dago biloxka korioniko primarioaren erdian?", options: ["Sinzitiotrofoblastoa", "Zitotrofoblastoa", "Korion barrunbea"], correct: "Zitotrofoblastoa", ids: ["syncytiotrophoblast", "cytotrophoblast", "chorionic-cavity"] }
    : topic.id === "week-2"
      ? { text: "Zein geruzak mantentzen ditu banakako zelula-mugak?", options: ["Zitotrofoblastoak", "Sinzitiotrofoblastoak"], correct: "Zitotrofoblastoak", ids: ["cytotrophoblast", "syncytiotrophoblast"] }
      : topic.id === "week-3"
        ? { text: "Zein egituratako zelulek osatzen dituzte hiru ernetze-geruzak gastrulazioan?", options: ["Epiblastokoek", "Hipoblastokoek"], correct: "Epiblastokoek", ids: ["epiblast", "definitive-endoderm"] }
        : topic.id === "week-4"
          ? { text: "Zein egiturak ematen dio hasiera nerbio-sistema zentralari?", options: ["Hodi neuralak", "Gandor neuralak"], correct: "Hodi neuralak", ids: ["neural-tube", "neural-crest"] }
          : { text: "Zein egituratik abiatzen da segmentazioa?", options: ["Zigototik", "Endometriotik"], correct: "Zigototik", ids: ["zygote", "endometrium"] };
  return (
    <section className="quiz-card" aria-label="Ikasi galdera">
      <div className="quiz-kicker">IKASI · eszena galdera</div>
      <h3>{question.text}</h3>
      <div className="quiz-options">{question.options.map((option, index) => <button className={`quiz-option ${answer === option ? (option === question.correct ? "correct" : "wrong") : ""}`} type="button" key={option} onClick={() => { setAnswer(option); if (stage.structures.includes(question.ids[index])) onSelect(question.ids[index]); }} aria-pressed={answer === option}>{option}</button>)}</div>
      {answer && <p className={`quiz-feedback ${answer === question.correct ? "correct" : "wrong"}`}>{answer === question.correct ? "Ondo. Erantzuna zuzena da." : `Oraindik ez. Aukera zuzena: ${question.correct}.`}</p>}
      {selectedId && <span className="sr-only">Aukeratutako egitura: {selectedId}</span>}
    </section>
  );
}

function GlossaryDialog({ query, setQuery, terms, onClose, onOpen }: { query: string; setQuery: (value: string) => void; terms: GlossaryTerm[]; onClose: () => void; onOpen: (term: GlossaryTerm) => void }) {
  return (
    <div className="glossary-overlay" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="glossary-dialog" role="dialog" aria-modal="true" aria-labelledby="glossary-title">
        <div className="glossary-header"><div><div className="section-eyebrow">Terminoen mapa</div><h2 id="glossary-title">Glosarioa</h2></div><button className="icon-button" type="button" onClick={onClose} aria-label="Itxi glosarioa">×</button></div>
        <input className="glossary-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Bilatu euskaraz" aria-label="Bilatu glosarioan" autoFocus />
        <div className="glossary-list">{terms.length ? terms.map((term) => <div className="glossary-row" key={term.id}><div className="glossary-term">{term.label.primary}</div><div className="glossary-definition">{term.definition}</div><button className="glossary-open" type="button" onClick={() => onOpen(term)}>Ikusi</button></div>) : <p className="empty-state">Ez da terminorik aurkitu.</p>}</div>
      </section>
    </div>
  );
}
