"use client";

import { useEffect, useRef, type KeyboardEvent, type MouseEvent } from "react";
import gsap from "gsap";
import type { Stage, Topic } from "@/content/types";

type SceneProps = {
  topic: Topic;
  stage: Stage;
  stageProgress: number;
  selectedId?: string;
  relationIds: string[];
  isolated: boolean;
  showLabels: boolean;
  showComparison: boolean;
  crossSection: boolean;
  onToggleCrossSection?: () => void;
  onSelect: (id: string) => void;
};

const structureLabels: Record<string, string> = {
  "sagittal-plane": "Plano sagitala",
  "coronal-plane": "Plano koronala",
  "female-reproductive-apparatus": "Emakumearen ugal aparatua",
  ampulla: "Anpulua",
  endometrium: "Endometrioa",
  zygote: "Zigotoa",
  morula: "Morula",
  blastocyst: "Blastozistoa",
  trophoblast: "Trofoblastoa",
  embryoblast: "Enbrioblastoa",
  cytotrophoblast: "Zitotrofoblastoa",
  syncytiotrophoblast: "Sinzitiotrofoblastoa",
  epiblast: "Epiblastoa",
  hypoblast: "Hipoblastoa",
  "bilaminar-disc": "Bi orriko ernetze diskoa",
  "amniotic-cavity": "Amnios barrunbea",
  "primary-yolk-sac": "Hasierako bitelo zakua",
  "extraembryonic-mesoderm": "Enbrioi kanpoko mesodermoa",
  "chorionic-cavity": "Korion barrunbea",
  "primary-chorionic-villus": "Biloxka korioniko primarioa",
  "secondary-yolk-sac": "Behin-betiko bitelo zakua",
  "connecting-stalk": "Finkapen pedikulua",
};

export default function SimulationViewport(props: SceneProps) {
  const sceneRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!sceneRef.current) return;
    const context = gsap.context(() => {
      gsap.fromTo(sceneRef.current, { opacity: 0.7, scale: 0.985 }, { opacity: 1, scale: 1, duration: 0.45, ease: "power2.out" });
    }, sceneRef);
    return () => context.revert();
  }, [props.stage.id]);

  return (
    <div className="simulation-card">
      <div className="simulation-toolbar">
        <div className="scene-badge"><span className="scene-dot" /><strong>{props.topic.id === "week-2" ? "ZEHARKAKO KONTZEPTUALA" : "ESZENA BISUALA"}</strong><span>SVG / 2.5D</span></div>
        <div className="scene-stage-readout"><strong>{props.stage.title.primary}</strong><span>{props.stage.title.secondary?.es ?? ""}</span>{props.topic.id === "week-2" && props.stage.id === "day-13" && <button className="control-button scene-cross-control" type="button" onClick={props.onToggleCrossSection} aria-pressed={props.crossSection}>Zeharkako mozketa</button>}</div>
      </div>
      <div className="scene-wrap" ref={sceneRef}>
        {props.topic.id === "week-2" ? <WeekTwoScene {...props} /> : <WeekOneScene {...props} />}
      </div>
      <div className="scene-annotation"><strong>{props.topic.id === "week-2" ? "Kokapen-irakurketa" : "Ikusi, gero izendatu"}</strong>{props.topic.id === "week-2" ? "Ezkerrean kaudala eta eskuinean kraneala. Endometrioa kanpoko ehun gisa eta barrunbeak erdigunean irakurri." : "Egin klik geruza edo egitura batean. Inspector-ean jatorria eta hurrengo pausoa agertuko dira."}</div>
    </div>
  );
}

function WeekTwoScene({ stage, stageProgress, selectedId, relationIds, isolated, showLabels, showComparison, crossSection, onSelect }: SceneProps) {
  const day8 = stage.id === "day-8";
  const day9 = stage.id === "day-9";
  const day11 = stage.id === "days-11-12";
  const day13 = stage.id === "day-13";
  const grow = day11 ? 0.45 + stageProgress * 0.55 : day13 ? 1 : day9 ? 0.38 : 0.12;
  const network = day11 || day13;
  const structureClass = (id: string) => `interactive-structure ${selectedId === id ? "selected" : ""} ${relationIds.includes(id) ? "related" : ""}`;
  const click = (id: string) => ({
    onClick: (event: MouseEvent<SVGGElement>) => { event.stopPropagation(); onSelect(id); },
    onKeyDown: (event: KeyboardEvent<SVGGElement>) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); event.stopPropagation(); onSelect(id); } },
  });
  const label = (id: string) => structureLabels[id] ?? id;
  return (
    <svg className={`scene-svg ${isolated ? "isolated" : ""} ${!showLabels ? "labels-hidden" : ""}`} viewBox="0 0 900 560" role="img" aria-label={`Eszena ${stage.title.primary}: blastozisto ezarria eta endometrioa`}>
      <defs>
        <linearGradient id="maternal-tissue" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#7b4d58" /><stop offset="1" stopColor="#432d39" /></linearGradient>
        <linearGradient id="syncytio-fill" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#b95579" stopOpacity="0.96" /><stop offset="1" stopColor="#7d405f" stopOpacity="0.9" /></linearGradient>
        <linearGradient id="cyto-fill" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#ff9a72" /><stop offset="1" stopColor="#c85e58" /></linearGradient>
        <linearGradient id="cavity-fill" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#8ccde0" stopOpacity="0.22" /><stop offset="1" stopColor="#2b6775" stopOpacity="0.42" /></linearGradient>
        <marker id="arrow-flow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0 L8 4 L0 8 Z" fill="#e9bf76" /></marker>
        <filter id="soft-glow" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="5" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
      </defs>
      <rect width="900" height="560" fill="#0b2021" />
      <path d="M30 120 C155 70 260 86 344 113 C450 145 560 74 682 99 C760 114 822 103 870 83 L870 224 C786 243 691 232 603 249 C491 270 385 225 287 242 C172 263 96 227 30 244 Z" fill="url(#maternal-tissue)" opacity="0.92" />
      <path d="M26 234 C126 214 228 270 325 252 C418 235 499 292 597 263 C704 231 793 266 875 233 L875 324 C773 349 694 313 594 346 C504 375 407 316 308 349 C190 388 103 329 26 357 Z" fill="#70434c" opacity="0.58" />
      <path d="M22 324 C128 308 208 373 318 354 C421 337 512 393 612 356 C718 317 788 357 878 323 L878 520 L22 520 Z" fill="#233735" opacity="0.92" />
      <path d="M33 120 C151 75 264 86 346 113 C455 148 557 75 682 100 C759 115 818 103 867 83" className="leader" stroke="#e9bf76" strokeWidth="2" opacity="0.7" />
      <text className="scene-label muted" x="57" y="152">ENDOMETRIOA</text>
      <text className="scene-label muted" x="55" y="399">MIOMETRIOAREN ALDE KONTZEPTUALA</text>
      <text className="orientation" x="56" y="51">KAUDALA</text>
      <text className="orientation" x="777" y="51">KRANEALA</text>
      <path d="M75 59 H160" className="leader" /><path d="M740 59 H825" className="leader" />

      {showComparison && <g aria-label="Aurreko etapa, ghost"><ellipse className="ghost" cx="452" cy="292" rx={day8 ? 180 : 215} ry={day8 ? 92 : 125} /><ellipse className="ghost" cx="452" cy="271" rx="86" ry="28" /><text className="scene-label muted" x="654" y="474">AURREKOAREN GHOSTA</text></g>}

      <g className={structureClass("chorionic-cavity")} {...click("chorionic-cavity")} role="button" tabIndex={0} aria-label={label("chorionic-cavity")} opacity={day8 ? 0.1 : 0.22 + grow * 0.7}>
        <ellipse cx="460" cy="310" rx={day8 ? 210 : 257} ry={day8 ? 130 : 177} fill="url(#cavity-fill)" stroke="#73b8c8" strokeWidth="2" strokeDasharray={day8 ? "7 8" : "none"} />
        {showLabels && <text className="scene-label" x="663" y="298">Korion barrunbea</text>}
      </g>
      {showLabels && <path className="leader" d="M654 302 C610 302 594 313 575 324" />}

      <g className={structureClass("extraembryonic-mesoderm")} {...click("extraembryonic-mesoderm")} role="button" tabIndex={0} aria-label={label("extraembryonic-mesoderm")} opacity={day8 ? 0.08 : day9 ? 0.22 : 0.3 + grow * 0.62}>
        <ellipse cx="460" cy="310" rx={day8 ? 151 : 214} ry={day8 ? 100 : 139} fill="none" stroke="#c8e0ab" strokeWidth={day8 ? 3 : 12} strokeDasharray={day8 ? "4 9" : "none"} />
        {showLabels && <text className="scene-label" x="112" y="314">Enbrioi kanpoko mesodermoa</text>}
      </g>
      {showLabels && <path className="leader" d="M296 315 C330 310 348 302 360 294" />}
      {(day11 || day13) && showLabels && <g opacity={0.72}><text className="scene-label muted" x="115" y="268">Orri somatikoa / somatopleura</text><text className="scene-label muted" x="115" y="284">kanpoaldeko eta amnios inguruko kokapena</text><text className="scene-label muted" x="115" y="365">Errai-orria / esplaknopleura</text><text className="scene-label muted" x="115" y="381">bitelo zakuaren inguruko kokapena</text></g>}

      <g className={structureClass("syncytiotrophoblast")} {...click("syncytiotrophoblast")} role="button" tabIndex={0} aria-label={label("syncytiotrophoblast")}>
        <path d="M288 208 C309 169 362 148 420 154 C475 132 547 151 592 181 C631 207 655 248 644 290 C637 329 607 362 565 379 C516 399 453 393 412 382 C357 388 310 359 285 322 C261 288 263 246 288 208 Z" fill="url(#syncytio-fill)" stroke="#ec8da9" strokeWidth="3" opacity={day8 ? 0.8 : 0.98} />
        {!day8 && <g opacity={day9 || day11 || day13 ? 0.88 : 0.15}>
          {[[-8,-52],[39,-31],[84,-5],[-62,-4],[-16,0],[38,17],[-74,34],[-26,49],[25,55],[74,39]].map(([dx, dy], index) => <circle key={index} cx={460 + dx} cy={278 + dy} r={index % 3 === 0 ? 17 : 12} fill="#f0a6aa" opacity="0.66" />)}
          {network && <g stroke="#f3cbcf" strokeWidth="5" fill="none" opacity={0.4 + grow * 0.6}><path d="M345 247 C394 231 430 255 466 238 C505 220 553 238 594 260" /><path d="M329 308 C378 286 418 319 460 296 C503 273 555 310 608 292" /></g>}
        </g>}
        {showLabels && <text className="scene-label" x="294" y="183">Sinzitiotrofoblastoa</text>}
      </g>
      {showLabels && <path className="leader" d="M383 188 C390 211 404 221 414 231" />}

      <g className={structureClass("cytotrophoblast")} {...click("cytotrophoblast")} role="button" tabIndex={0} aria-label={label("cytotrophoblast")}>
        <ellipse cx="460" cy="292" rx={day13 ? 145 : 116} ry={day13 ? 94 : 73} fill="url(#cyto-fill)" stroke="#ffb386" strokeWidth="3" opacity={0.95} />
        {Array.from({ length: day13 ? 18 : 12 }).map((_, index) => { const angle = (index / (day13 ? 18 : 12)) * Math.PI * 2; const x = 460 + Math.cos(angle) * (day13 ? 117 : 93); const y = 292 + Math.sin(angle) * (day13 ? 72 : 54); return <circle key={index} cx={x} cy={y} r="6" fill="#ffe2ae" opacity="0.82" />; })}
        {showLabels && <text className="scene-label" x="654" y="206">Zitotrofoblastoa</text>}
      </g>
      {showLabels && <path className="leader" d="M650 210 C600 219 577 229 551 247" />}

      <g className={structureClass("bilaminar-disc")} {...click("bilaminar-disc")} role="button" tabIndex={0} aria-label={label("bilaminar-disc")}>
        <ellipse cx="460" cy="287" rx="77" ry="29" fill="#a7dce0" opacity="0.2" stroke="#c4f0de" strokeWidth="2" />
        <g className={structureClass("epiblast")} {...click("epiblast")} role="button" tabIndex={0} aria-label={label("epiblast")}>
          <path d="M383 284 C411 265 489 264 537 284 C512 300 411 301 383 284 Z" fill="#84c8ed" stroke="#b3e3f7" strokeWidth="2" />
          {showLabels && <text className="scene-label" x="378" y="254">Epiblastoa</text>}
        </g>
        <g className={structureClass("hypoblast")} {...click("hypoblast")} role="button" tabIndex={0} aria-label={label("hypoblast")}>
          <path d="M383 289 C419 305 502 305 537 289 C516 319 408 319 383 289 Z" fill="#e9bf76" stroke="#ffe1a4" strokeWidth="2" />
          {showLabels && <text className="scene-label" x="378" y="340">Hipoblastoa</text>}
        </g>
        {showLabels && <path className="leader" d="M373 255 H341 M373 337 H341" />}
      </g>

      <g className={structureClass("amniotic-cavity")} {...click("amniotic-cavity")} role="button" tabIndex={0} aria-label={label("amniotic-cavity")}>
        <ellipse cx="460" cy="243" rx={day8 ? 57 : 64} ry={day8 ? 24 : 29} fill="#5d9bb2" fillOpacity="0.56" stroke="#9ed9e2" strokeWidth="2" />
        {showLabels && <text className="scene-label" x="536" y="246">Amnios barrunbea</text>}
      </g>
      {showLabels && <path className="leader" d="M532 247 H507" />}

      <g className={structureClass(day13 ? "secondary-yolk-sac" : "primary-yolk-sac")} {...click(day13 ? "secondary-yolk-sac" : "primary-yolk-sac")} role="button" tabIndex={0} aria-label={label(day13 ? "secondary-yolk-sac" : "primary-yolk-sac")}>
        <ellipse cx="460" cy="342" rx={day13 ? 69 : 82} ry={day13 ? 43 : 51} fill={day13 ? "#d78a5e" : "#c77f58"} fillOpacity="0.82" stroke="#f0bc87" strokeWidth="2" />
      </g>
      {showLabels && <><text className="scene-label" x="544" y="363">{day13 ? "Bitelo zaku sekundarioa" : "Hasierako bitelo zakua"}</text><path className="leader" d="M542 360 H504" /></>}

      <g className={structureClass("connecting-stalk")} {...click("connecting-stalk")} role="button" tabIndex={0} aria-label={label("connecting-stalk")}>
        <path d="M516 327 C542 348 562 369 582 396 C566 406 546 397 524 377 C506 359 493 344 486 331 Z" fill="#c8e0ab" stroke="#edfacf" strokeWidth="2" opacity="0.9" />
      </g>
      {showLabels && <><text className="scene-label" x="592" y="420">Finkapen pedikulua</text><path className="leader" d="M588 412 C565 399 551 379 538 365" /></>}

      <g className={structureClass("syncytiotrophoblast")} {...click("syncytiotrophoblast")} role="button" tabIndex={0} aria-label="Lakuak eta sinusoideak" opacity={network ? 1 : 0.22}>
        {network && <>
          <path d="M160 121 C180 109 205 121 218 141 C231 160 218 178 196 179 C171 179 144 156 150 139 Z" fill="#eb5b5e" opacity="0.8" />
          <path d="M692 119 C714 104 744 116 749 139 C755 161 737 177 714 171 C692 165 677 137 692 119 Z" fill="#eb5b5e" opacity="0.8" />
          <path d="M193 151 C279 205 310 236 350 266" fill="none" stroke="#e9bf76" strokeWidth="2" markerEnd="url(#arrow-flow)" />
          <path d="M716 151 C644 193 616 222 572 255" fill="none" stroke="#e9bf76" strokeWidth="2" markerEnd="url(#arrow-flow)" />
          {[0,1,2].map((index) => <circle key={index} className={`flow-particle delay-${index}`} cx={250 + index * 34} cy={202 + index * 20} r="4" fill="#f6d38f" filter="url(#soft-glow)" />)}
          <text className="scene-label" x="71" y="111">Sinusoideak</text>
          <text className="scene-label" x="671" y="105">Odol-fluxua</text>
          <text className="scene-label" x="660" y="448">Hasierako zirkulazio utero-plazentarioa</text>
        </>}
        {day9 && <g opacity="0.85"><text className="scene-label" x="253" y="410">GARAI LAKUNARRA</text><path className="leader" d="M350 402 C365 373 377 350 389 328" /></g>}
      </g>

      {day13 && !crossSection && <g className={structureClass("primary-chorionic-villus")} {...click("primary-chorionic-villus")} role="button" tabIndex={0} aria-label={label("primary-chorionic-villus")}>
        <path d="M730 240 C700 207 702 169 729 152 C756 135 787 153 783 188 C779 219 805 238 790 266 C776 292 750 280 730 240 Z" fill="#ce6c8c" stroke="#f3a7b9" strokeWidth="3" />
        <path d="M743 232 C725 204 729 178 746 170 C761 163 774 177 768 193 C762 211 778 230 766 246 C758 257 749 249 743 232 Z" fill="#f39d75" stroke="#ffd2a4" strokeWidth="2" />
      </g>}
      {day13 && crossSection && <g className={structureClass("primary-chorionic-villus")} {...click("primary-chorionic-villus")} role="button" tabIndex={0} aria-label={label("primary-chorionic-villus")}>
        <circle cx="752" cy="213" r="66" fill="#ce6c8c" stroke="#f3a7b9" strokeWidth="3" />
        <circle cx="752" cy="213" r="40" fill="#f39d75" stroke="#ffd2a4" strokeWidth="3" />
        <circle cx="735" cy="198" r="6" fill="#ffe2ae" /><circle cx="772" cy="223" r="6" fill="#ffe2ae" /><circle cx="752" cy="236" r="6" fill="#ffe2ae" />
      </g>}
      {day13 && showLabels && <><text className="scene-label" x="678" y="320">{crossSection ? "Zeharkako mozketa" : "Biloxka primarioa"}</text><text className="scene-label muted" x="676" y="338">erdian zitotrofoblastoa · kanpoan sinzitiotrofoblastoa</text><path className="leader" d={crossSection ? "M723 314 C734 283 744 264 750 246" : "M735 316 C741 286 746 266 749 248"} /></>}
      {day8 && showLabels && <text className="scene-label muted" x="255" y="446">Egun honetan: disko bilaminarraren eta polaritate dortso-bentralaren hasiera</text>}
      {day11 && showLabels && <text className="scene-label muted" x="252" y="446">Lakuak konektatu, sinusoideak ireki eta korion barrunbea hedatzen da</text>}
    </svg>
  );
}

function WeekOneScene({ stage, selectedId, relationIds, isolated, showLabels, showComparison, onSelect }: SceneProps) {
  const structureClass = (id: string) => `interactive-structure ${selectedId === id ? "selected" : ""} ${relationIds.includes(id) ? "related" : ""}`;
  const click = (id: string) => ({ onClick: (event: MouseEvent<SVGGElement>) => { event.stopPropagation(); onSelect(id); }, onKeyDown: (event: KeyboardEvent<SVGGElement>) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); event.stopPropagation(); onSelect(id); } } });
  const labels = stage.id === "orientation";
  const fert = stage.id === "fertilization";
  const cleavage = stage.id === "cleavage";
  const blast = stage.id === "blastocyst-formation";
  const implant = stage.id === "implantation";
  const cells = cleavage ? (stage.start < 0.5 ? 4 : 16) : 12;
  return (
    <svg className={`scene-svg ${isolated ? "isolated" : ""} ${!showLabels ? "labels-hidden" : ""}`} viewBox="0 0 900 560" role="img" aria-label={`Lehenengo asteko eszena: ${stage.title.primary}`}>
      <defs>
        <linearGradient id="week1-bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#173e3e" /><stop offset="1" stopColor="#0d2425" /></linearGradient>
        <marker id="week1-arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0 L8 4 L0 8 Z" fill="#9ae5c8" /></marker>
      </defs>
      <rect width="900" height="560" fill="url(#week1-bg)" />
      {showComparison && <g opacity="0.35"><circle cx="450" cy="279" r="112" className="ghost" /><text className="scene-label muted" x="652" y="494">AURREKOAREN GHOSTA</text></g>}
      {labels && <OrientationScene structureClass={structureClass} click={click} showLabels={showLabels} />}
      {fert && <FertilizationScene structureClass={structureClass} click={click} showLabels={showLabels} />}
      {cleavage && <CleavageScene structureClass={structureClass} click={click} showLabels={showLabels} cells={cells} />}
      {blast && <BlastocystScene structureClass={structureClass} click={click} showLabels={showLabels} />}
      {implant && <ImplantationScene structureClass={structureClass} click={click} showLabels={showLabels} />}
      {showLabels && <text className="scene-label muted" x="45" y="510">1. ASTEA · prozesuaren eskala aldatzen da, ideia biologikoa mantentzen da</text>}
    </svg>
  );
}

type SmallSceneProps = { structureClass: (id: string) => string; click: (id: string) => { onClick: (event: MouseEvent<SVGGElement>) => void; onKeyDown: (event: KeyboardEvent<SVGGElement>) => void }; showLabels: boolean };

function OrientationScene({ structureClass, click, showLabels }: SmallSceneProps) {
  return <g>
    <text className="scene-label" x="54" y="76">Orientazioa</text>
    <text className="scene-label muted" x="54" y="101">Enbrioiaren norabideak, ez pantailarenak</text>
    <g className={structureClass("sagittal-plane")} {...click("sagittal-plane")} role="button" tabIndex={0} aria-label="Plano sagitala"><path d="M252 126 L375 126 L375 407 L252 407 Z" fill="#9ae5c8" fillOpacity="0.13" stroke="#9ae5c8" strokeWidth="2" /><path d="M314 93 V443" stroke="#9ae5c8" strokeWidth="2" strokeDasharray="6 8" markerEnd="url(#week1-arrow)" /><text className="scene-label" x="235" y="466">Plano sagitala</text></g>
    <g className={structureClass("coronal-plane")} {...click("coronal-plane")} role="button" tabIndex={0} aria-label="Plano koronala"><path d="M490 126 L613 126 L613 407 L490 407 Z" fill="#84c8ed" fillOpacity="0.13" stroke="#84c8ed" strokeWidth="2" /><path d="M551 95 H665" stroke="#84c8ed" strokeWidth="2" strokeDasharray="6 8" markerEnd="url(#week1-arrow)" /><text className="scene-label" x="480" y="466">Plano koronala</text></g>
    <path d="M432 145 V413" stroke="#e9bf76" strokeWidth="2" strokeDasharray="4 7" /><path d="M398 277 H466" stroke="#e9bf76" strokeWidth="2" strokeDasharray="4 7" />
    {showLabels && <><text className="scene-label muted" x="394" y="137">luzetarako ardatza</text><text className="scene-label muted" x="399" y="298">dortsobentral ardatza</text><text className="scene-label muted" x="73" y="260">KRANEALA / ZEFALIKOA</text><path className="leader" d="M201 256 H247" /><text className="scene-label muted" x="72" y="347">KAUDALA</text><path className="leader" d="M154 343 H247" /><text className="scene-label muted" x="685" y="259">BENTRALA</text><path className="leader" d="M615 257 H679" /><text className="scene-label muted" x="685" y="347">DORTSALA</text><path className="leader" d="M615 344 H679" /></>}
  </g>;
}

function FertilizationScene({ structureClass, click, showLabels }: SmallSceneProps) {
  return <g>
    <path d="M136 350 C220 325 282 287 357 280 C430 273 496 285 567 252 C635 220 699 201 776 234" fill="none" stroke="#e9bf76" strokeWidth="44" strokeLinecap="round" opacity="0.28" /><path d="M136 350 C220 325 282 287 357 280 C430 273 496 285 567 252 C635 220 699 201 776 234" fill="none" stroke="#d88272" strokeWidth="26" strokeLinecap="round" opacity="0.6" />
    <g className={structureClass("female-reproductive-apparatus")} {...click("female-reproductive-apparatus")} role="button" tabIndex={0} aria-label="Emakumearen ugal aparatua"><circle cx="169" cy="357" r="40" fill="#f17d6b" fillOpacity="0.4" stroke="#f5ae8c" strokeWidth="2" /><path d="M756 204 C793 176 822 194 842 216 M777 209 C806 181 838 181 858 197" fill="none" stroke="#eaa37c" strokeWidth="5" strokeLinecap="round" />{showLabels && <text className="scene-label" x="96" y="425">Obulutegia</text>}</g>
    <g className={structureClass("ampulla")} {...click("ampulla")} role="button" tabIndex={0} aria-label="Anpulua"><path d="M532 268 C599 239 680 209 747 216" fill="none" stroke="#efae83" strokeWidth="10" strokeLinecap="round" />{showLabels && <text className="scene-label" x="620" y="179">Anpulua · ernalkuntza-ohiko gunea</text>}</g>
    <g className={structureClass("zygote")} {...click("zygote")} role="button" tabIndex={0} aria-label="Zigotoa"><circle cx="581" cy="244" r="31" fill="#84c8ed" fillOpacity="0.65" stroke="#c2edee" strokeWidth="3" /><circle cx="573" cy="236" r="7" fill="#f0c47a" /><circle cx="591" cy="252" r="7" fill="#f0c47a" />{showLabels && <text className="scene-label" x="552" y="309">Zigotoa</text>}</g>
    <g opacity="0.9">{[0,1,2,3,4].map((index) => <path key={index} d={`M${650 + index * 20} ${160 + index * 13} q18 -11 35 0`} fill="none" stroke="#9ae5c8" strokeWidth="3" strokeLinecap="round" />)}</g>
    {showLabels && <><text className="scene-label" x="78" y="92">Obulazioa → anpuluan ernalkuntza</text><text className="scene-label muted" x="76" y="118">koroa erradiatua · zona peluzidoa · fusioa · erreakzio kortikala</text><path className="leader" d="M245 136 C337 165 409 203 487 232" /><text className="scene-label muted" x="748" y="374">Espermatozoideak</text><text className="scene-label muted" x="80" y="490">Umetokia · istmoa · anpulu zabala · infundibulua · finbriak</text></>}
  </g>;
}

function CleavageScene({ structureClass, click, showLabels, cells }: SmallSceneProps & { cells: number }) {
  const count = cells === 4 ? 4 : 16;
  return <g>
    <g className={structureClass("morula")} {...click("morula")} role="button" tabIndex={0} aria-label="Morula"><circle cx="448" cy="276" r="137" fill="#e9bf76" fillOpacity="0.12" stroke="#e9bf76" strokeWidth="3" />{Array.from({ length: count }).map((_, index) => { const angle = (index / count) * Math.PI * 2; const ring = index < 8 ? 66 : 35; const x = 448 + Math.cos(angle) * (index < 8 ? ring : 28); const y = 276 + Math.sin(angle) * (index < 8 ? ring : 28); return <circle key={index} cx={x} cy={y} r={count === 4 ? 42 : 25} fill={index % 2 ? "#84c8ed" : "#9ae5c8"} fillOpacity="0.72" stroke="#d7f0e2" strokeWidth="2" />; })}{showLabels && <text className="scene-label" x="366" y="454">{count === 4 ? "4 zelula" : "12-16 blastomero · morula"}</text>}</g>
    <path d="M118 275 H276" stroke="#9ae5c8" strokeWidth="2" strokeDasharray="6 8" markerEnd="url(#week1-arrow)" /><path d="M615 275 H781" stroke="#9ae5c8" strokeWidth="2" strokeDasharray="6 8" markerEnd="url(#week1-arrow)" />
    {showLabels && <><text className="scene-label" x="88" y="191">Zigotoa</text><text className="scene-label muted" x="83" y="214">zelula 1</text><text className="scene-label" x="704" y="191">32 zelula inguru</text><text className="scene-label muted" x="704" y="214">tamaina osoa ≈ konstante</text><text className="scene-label muted" x="341" y="109">ZELULA KOPURUA ↑ · BANAKAKO TAMAINA ↓</text></>}
  </g>;
}

function BlastocystScene({ structureClass, click, showLabels }: SmallSceneProps) {
  return <g>
    <g className={structureClass("blastocyst")} {...click("blastocyst")} role="button" tabIndex={0} aria-label="Blastozistoa"><circle cx="450" cy="278" r="177" fill="#db7594" fillOpacity="0.14" stroke="#db7594" strokeWidth="8" /><circle cx="450" cy="278" r="119" fill="#5d9bb2" fillOpacity="0.42" stroke="#9ed9e2" strokeWidth="2" /><g className={structureClass("trophoblast")} {...click("trophoblast")} role="button" tabIndex={0} aria-label="Trofoblastoa"><path d="M348 150 C393 106 504 100 565 150 C594 174 608 210 594 235 C559 218 533 201 499 188 C438 164 390 173 348 200 C329 188 331 168 348 150 Z" fill="#db7594" stroke="#f3a7b9" strokeWidth="3" />{showLabels && <text className="scene-label" x="620" y="155">Trofoblastoa</text>}</g><g className={structureClass("embryoblast")} {...click("embryoblast")} role="button" tabIndex={0} aria-label="Enbrioblastoa"><ellipse cx="411" cy="204" rx="61" ry="38" fill="#84c8ed" stroke="#bdeaf6" strokeWidth="3" />{showLabels && <text className="scene-label" x="319" y="133">Enbrioblastoa</text>}</g>{showLabels && <text className="scene-label" x="510" y="300">Blastozelea</text>}</g>
    <path d="M150 478 C260 430 338 418 430 419" stroke="#9ae5c8" strokeWidth="2" strokeDasharray="6 8" markerEnd="url(#week1-arrow)" />
    {showLabels && <><text className="scene-label" x="78" y="87">Morula → likidoa → blastozelea</text><text className="scene-label muted" x="75" y="112">kanpoko masa: trofoblastoa · barruko masa: enbrioblastoa</text><text className="scene-label muted" x="640" y="420">mutur embrionarioa / anembrionarioa</text></>}
  </g>;
}

function ImplantationScene({ structureClass, click, showLabels }: SmallSceneProps) {
  return <g>
    <path d="M84 118 C220 91 317 103 428 94 C570 81 705 96 817 119 L817 234 C707 218 611 224 495 214 C354 203 222 223 84 237 Z" fill="#75434c" opacity="0.85" /><path d="M84 236 C208 216 326 244 447 225 C582 204 692 242 817 228 L817 451 L84 451 Z" fill="#263b37" opacity="0.94" /><g className={structureClass("endometrium")} {...click("endometrium")} role="button" tabIndex={0} aria-label="Endometrioa"><path d="M84 231 C215 213 325 241 447 223 C584 204 697 241 817 226" fill="none" stroke="#f0a7a0" strokeWidth="16" />{showLabels && <text className="scene-label" x="92" y="175">Endometrioa</text>}</g><path d="M84 451 H817" stroke="#55776e" strokeWidth="2" /><text className="scene-label muted" x="93" y="433">Miometrioaren sekzio kontzeptuala</text><g className={structureClass("blastocyst")} {...click("blastocyst")} role="button" tabIndex={0} aria-label="Blastozistoa"><circle cx="471" cy="210" r="103" fill="#db7594" fillOpacity="0.28" stroke="#f3a7b9" strokeWidth="5" /><circle cx="471" cy="210" r="72" fill="#5d9bb2" fillOpacity="0.5" /><ellipse cx="451" cy="188" rx="35" ry="23" fill="#84c8ed" />{showLabels && <text className="scene-label" x="545" y="187">Blastozistoa</text>}</g><path d="M514 183 C574 169 612 150 652 126" fill="none" stroke="#9ae5c8" strokeWidth="2" strokeDasharray="6 8" markerEnd="url(#week1-arrow)" />{showLabels && <><text className="scene-label" x="83" y="79">Habiratzea · 6. eguna</text><text className="scene-label muted" x="82" y="101">blastozistoa endometrioko mukosara hurbildu eta txertatzen hasten da</text><text className="scene-label muted" x="650" y="121">epitelioaren artean</text></>}</g>;
}
