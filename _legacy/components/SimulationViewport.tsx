"use client";

import { useEffect, useRef, type KeyboardEvent, type MouseEvent } from "react";
import gsap from "gsap";
import type { Stage, Topic } from "@/content/types";
import AdvancedDevelopmentScene from "@/components/AdvancedDevelopmentScene";
import WeekOneDetailedScene from "@/components/WeekOneDetailedScene";

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
  amnioblasts: "Amnioblastoak",
  "fibrin-plug": "Fibrinazko koagulua",
  "trophoblastic-lacunae": "Sinzitiotrofoblastoko lakuak",
  "heuser-membrane": "Heuser-en mintza",
  "maternal-sinusoids": "Amaren sinusoideak",
  "uteroplacental-flow": "Hasierako utero-plazentako zirkulazioa",
  "somatic-mesoderm": "Mesodermo somatikoa",
  "splanchnic-mesoderm": "Mesodermo esplaknikoa",
  "decidual-reaction": "Erreakzio deziduala",
  "chorionic-plate": "Korion plaka",
  "exocoelomic-cysts": "Kiste exozelomikoak",
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
        <div className="scene-badge"><span className="scene-dot" /><strong>GARAPENAREN ESKEMA</strong><span>SVG</span></div>
        <div className="scene-stage-readout"><strong>{props.stage.title.primary}</strong>{props.topic.id === "week-2" && props.stage.id === "day-13" && <button className="control-button scene-cross-control" type="button" onClick={props.onToggleCrossSection} aria-pressed={props.crossSection}>Zeharkako mozketa</button>}</div>
      </div>
      <div className="scene-wrap" ref={sceneRef}>
        {props.topic.id === "week-2" ? <WeekTwoScene {...props} /> : props.topic.id === "week-1" ? <WeekOneDetailedScene {...props} /> : <AdvancedDevelopmentScene {...props} />}
      </div>
      <div className="scene-annotation"><strong>Irudiaren irakurketa</strong>{props.topic.id === "week-2" ? "Eskema kontzeptuala da: koloreek ehunak bereizten dituzte eta proportzioak ez dira eskalakoak." : "Ukitu egitura bat izena eta azalpena ikusteko. Irudiak ez daude eskalara marraztuta."} <span className="mobile-scene-hint">Irristatu irudia alboetara egitura guztiak ikusteko.</span></div>
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
  const useLabelRails = true;
  const callouts = day13 ? [
    { id: "syncytiotrophoblast", title: "Sinzitiotrofoblastoa", side: "left", y: 201, target: [290, 210] },
    { id: "cytotrophoblast", title: "Zitotrofoblastoa", side: "left", y: 234, target: [313, 264] },
    { id: "chorionic-plate", title: "Korion plaka", side: "left", y: 267, target: [350, 197] },
    { id: "exocoelomic-cysts", title: "Kiste exozelomikoak", side: "left", y: 300, target: [374, 426] },
    { id: "amniotic-cavity", title: "Amnios barrunbea", side: "left", y: 333, target: [402, 236] },
    { id: "epiblast", title: "Epiblastoa", side: "left", y: 366, target: [395, 280] },
    { id: "primary-chorionic-villus", title: "Biloxka primarioa", side: "right", y: 208, target: [672, 273] },
    { id: "secondary-yolk-sac", title: "Bitelo zaku sekundarioa", side: "right", y: 245, target: [523, 348] },
    { id: "chorionic-cavity", title: "Korion barrunbea", side: "right", y: 282, target: [597, 334] },
    { id: "connecting-stalk", title: "Finkapen pedikulua", side: "right", y: 319, target: [583, 352] },
    { id: "hypoblast", title: "Hipoblastoa", side: "right", y: 356, target: [523, 305] },
    { id: "splanchnic-mesoderm", title: "Errai-orria", side: "right", y: 393, target: [521, 376] },
  ] : day11 ? [
    { id: "maternal-sinusoids", title: "Amaren sinusoideak", side: "left", y: 198, target: [190, 155] },
    { id: "trophoblastic-lacunae", title: "Sinzitioko lakuak", side: "left", y: 232, target: [264, 259] },
    { id: "uteroplacental-flow", title: "Amaren odol-fluxua", side: "left", y: 266, target: [238, 220] },
    { id: "decidual-reaction", title: "Erreakzio deziduala", side: "left", y: 300, target: [192, 477] },
    { id: "extraembryonic-mesoderm", title: "Enbrioi kanpoko mesodermoa", side: "left", y: 334, target: [315, 291] },
    { id: "somatic-mesoderm", title: "Orri somatikoa", side: "left", y: 368, target: [340, 214] },
    { id: "chorionic-cavity", title: "Korion barrunbea", side: "right", y: 198, target: [592, 300] },
    { id: "splanchnic-mesoderm", title: "Errai-orria", side: "right", y: 232, target: [540, 352] },
    { id: "connecting-stalk", title: "Finkapen pedikulua", side: "right", y: 266, target: [583, 352] },
    { id: "amniotic-cavity", title: "Amnios barrunbea", side: "right", y: 300, target: [520, 240] },
    { id: "primary-yolk-sac", title: "Hasierako bitelo zakua", side: "right", y: 334, target: [525, 343] },
    { id: "epiblast", title: "Epiblastoa", side: "right", y: 368, target: [528, 284] },
    { id: "hypoblast", title: "Hipoblastoa", side: "right", y: 402, target: [526, 304] },
  ] : day9 ? [
    { id: "syncytiotrophoblast", title: "Sinzitiotrofoblastoa", side: "left", y: 202, target: [298, 215] },
    { id: "maternal-sinusoids", title: "Amaren sinusoideak", side: "left", y: 239, target: [189, 153] },
    { id: "fibrin-plug", title: "Fibrinazko koagulua", side: "left", y: 276, target: [452, 109] },
    { id: "cytotrophoblast", title: "Zitotrofoblastoa", side: "left", y: 313, target: [317, 292] },
    { id: "trophoblastic-lacunae", title: "Sinzitioko lakuak", side: "right", y: 202, target: [290, 261] },
    { id: "heuser-membrane", title: "Heuser-en mintza", side: "right", y: 239, target: [541, 343] },
    { id: "primary-yolk-sac", title: "Hasierako bitelo zakua", side: "right", y: 276, target: [522, 341] },
    { id: "epiblast", title: "Epiblastoa", side: "right", y: 313, target: [520, 282] },
    { id: "hypoblast", title: "Hipoblastoa", side: "right", y: 350, target: [520, 305] },
  ] : [
    { id: "syncytiotrophoblast", title: "Sinzitiotrofoblastoa", side: "left", y: 202, target: [305, 216] },
    { id: "cytotrophoblast", title: "Zitotrofoblastoa", side: "left", y: 239, target: [326, 263] },
    { id: "bilaminar-disc", title: "Bi orriko diskoa", side: "left", y: 276, target: [384, 286] },
    { id: "epiblast", title: "Epiblastoa", side: "left", y: 313, target: [398, 282] },
    { id: "amniotic-cavity", title: "Amnios barrunbea", side: "right", y: 202, target: [514, 240] },
    { id: "amnioblasts", title: "Amnioblastoak", side: "right", y: 239, target: [510, 223] },
    { id: "hypoblast", title: "Hipoblastoa", side: "right", y: 276, target: [520, 302] },
  ];
  return (
    <svg className={`scene-svg ${isolated ? "isolated" : ""} ${!showLabels ? "labels-hidden" : ""} ${useLabelRails ? "week-two-rails" : ""}`} viewBox="0 0 900 560" role="img" aria-label={`Eszena ${stage.title.primary}: blastozisto ezarria eta endometrioa`}>
      <style>{`.week-two-rails .scene-label:not(.rail-label), .week-two-rails .leader:not(.rail-leader) { opacity: 0; }`}</style>
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

      {showComparison && <g aria-label="Aurreko etaparen itzala"><ellipse className="ghost" cx="452" cy="292" rx={day8 ? 180 : 215} ry={day8 ? 92 : 125} /><ellipse className="ghost" cx="452" cy="271" rx="86" ry="28" /><text className="scene-label muted" x="654" y="474">AURREKO EGOERA</text></g>}

      <g className={structureClass("syncytiotrophoblast")} {...click("syncytiotrophoblast")} aria-label={label("syncytiotrophoblast")}>
        <ellipse cx="460" cy="292" rx={day11 || day13 ? 235 : 192} ry={day11 || day13 ? 174 : 139} fill="url(#syncytio-fill)" stroke="#ec8da9" strokeWidth="3" opacity={day8 ? 0.8 : 0.98} />
        {!day8 && <g opacity={day9 || day11 || day13 ? 0.88 : 0.15}>
          {[[-8,-52],[39,-31],[84,-5],[-62,-4],[-16,0],[38,17],[-74,34],[-26,49],[25,55],[74,39]].map(([dx, dy], index) => <circle key={index} cx={460 + dx} cy={278 + dy} r={index % 3 === 0 ? 17 : 12} fill="#f0a6aa" opacity="0.66" />)}
          {network && <g stroke="#f3cbcf" strokeWidth="5" fill="none" opacity={0.4 + grow * 0.6}><path d="M345 247 C394 231 430 255 466 238 C505 220 553 238 594 260" /><path d="M329 308 C378 286 418 319 460 296 C503 273 555 310 608 292" /></g>}
        </g>}
        {showLabels && <text className="scene-label" x="294" y="183">Sinzitiotrofoblastoa</text>}
      </g>
      {showLabels && <path className="leader" d="M383 188 C390 211 404 221 414 231" />}

      <g className={structureClass("cytotrophoblast")} {...click("cytotrophoblast")} aria-label={label("cytotrophoblast")}>
        <ellipse cx="460" cy="292" rx={day11 || day13 ? 193 : 152} ry={day11 || day13 ? 151 : 112} fill="url(#cyto-fill)" stroke="#ffb386" strokeWidth="3" opacity={0.95} />
        {Array.from({ length: day13 ? 22 : 15 }).map((_, index) => { const angle = (index / (day13 ? 22 : 15)) * Math.PI * 2; const x = 460 + Math.cos(angle) * (day11 || day13 ? 180 : 138); const y = 292 + Math.sin(angle) * (day11 || day13 ? 139 : 99); return <circle key={index} cx={x} cy={y} r="6" fill="#ffe2ae" opacity="0.82" />; })}
        {showLabels && <text className="scene-label" x="654" y="206">Zitotrofoblastoa</text>}
      </g>
      {showLabels && <path className="leader" d="M650 210 C600 219 577 229 551 247" />}

      {(day11 || day13) && <g className={structureClass("chorionic-cavity")} {...click("chorionic-cavity")} aria-label={label("chorionic-cavity")}>
        <ellipse cx="460" cy="292" rx="164" ry="126" fill="url(#cavity-fill)" stroke="#73b8c8" strokeWidth="2" />
        {showLabels && <text className="scene-label" x="660" y="387">Korion barrunbea</text>}
      </g>}
      {(day11 || day13) && <g className={structureClass("extraembryonic-mesoderm")} {...click("extraembryonic-mesoderm")} aria-label={label("extraembryonic-mesoderm")}>
        <path d="M299 271 A164 126 0 0 1 621 271 M299 314 A164 126 0 0 0 621 314" fill="none" stroke="#d5e4a8" strokeWidth="7" />
        {showLabels && <text className="scene-label" x="78" y="302">Enbrioi kanpoko mesodermoa</text>}
      </g>}
      {(day11 || day13) && <g className={structureClass("somatic-mesoderm")} {...click("somatic-mesoderm")} aria-label={label("somatic-mesoderm")}>
        <path d="M319 221 A164 126 0 0 1 601 221 M319 363 A164 126 0 0 0 601 363" fill="none" stroke="#bce5ab" strokeWidth="6" />
        <path d="M388 240 Q460 183 532 240" fill="none" stroke="#bce5ab" strokeWidth="5" />
        {showLabels && <text className="scene-label" x="74" y="271">Orri somatikoa</text>}
      </g>}

      <g className={structureClass("bilaminar-disc")} {...click("bilaminar-disc")} aria-label={label("bilaminar-disc")}>
        <ellipse cx="460" cy="287" rx="77" ry="29" fill="#a7dce0" opacity="0.2" stroke="#c4f0de" strokeWidth="2" />
        <g className={structureClass("epiblast")} {...click("epiblast")} aria-label={label("epiblast")}>
          <path d="M383 284 C411 265 489 264 537 284 C512 300 411 301 383 284 Z" fill="#84c8ed" stroke="#b3e3f7" strokeWidth="2" />
          {showLabels && <text className="scene-label" x="378" y="254">Epiblastoa</text>}
        </g>
        <g className={structureClass("hypoblast")} {...click("hypoblast")} aria-label={label("hypoblast")}>
          <path d="M383 289 C419 305 502 305 537 289 C516 319 408 319 383 289 Z" fill="#e9bf76" stroke="#ffe1a4" strokeWidth="2" />
          {showLabels && <text className="scene-label" x="378" y="340">Hipoblastoa</text>}
        </g>
        {showLabels && <path className="leader" d="M373 255 H341 M373 337 H341" />}
      </g>

      <g className={structureClass("amniotic-cavity")} {...click("amniotic-cavity")} aria-label={label("amniotic-cavity")}>
        <ellipse cx="460" cy="243" rx={day8 ? 57 : 64} ry={day8 ? 24 : 29} fill="#5d9bb2" fillOpacity="0.56" stroke="#9ed9e2" strokeWidth="2" />
        {showLabels && <text className="scene-label" x="536" y="246">Amnios barrunbea</text>}
      </g>
      {day8 && <g className={structureClass("amnioblasts")} {...click("amnioblasts")} aria-label={label("amnioblasts")}>
        <path d="M407 236 C420 215 441 211 460 213 C482 212 501 222 513 238" fill="none" stroke="#c9eff2" strokeWidth="6" strokeDasharray="8 4" />
        {showLabels && <text className="scene-label" x="568" y="226">Amnioblastoak</text>}
      </g>}
      {showLabels && <path className="leader" d="M532 247 H507" />}

      {!day8 && <g className={structureClass(day13 ? "secondary-yolk-sac" : "primary-yolk-sac")} {...click(day13 ? "secondary-yolk-sac" : "primary-yolk-sac")} aria-label={label(day13 ? "secondary-yolk-sac" : "primary-yolk-sac")}>
        <ellipse cx="460" cy="342" rx={day13 ? 69 : 82} ry={day13 ? 43 : 51} fill={day13 ? "#d78a5e" : "#c77f58"} fillOpacity="0.82" stroke="#f0bc87" strokeWidth="2" />
      </g>}
      {!day8 && showLabels && <><text className="scene-label" x="544" y="363">{day13 ? "Bitelo zaku sekundarioa" : "Hasierako bitelo zakua"}</text><path className="leader" d="M542 360 H504" /></>}
      {(day11 || day13) && <g className={structureClass("splanchnic-mesoderm")} {...click("splanchnic-mesoderm")} aria-label={label("splanchnic-mesoderm")}>
        <ellipse cx="460" cy="342" rx={day13 ? 76 : 89} ry={day13 ? 50 : 58} fill="none" stroke="#c5e3a2" strokeWidth="6" />
        {showLabels && <text className="scene-label" x="74" y="389">Errai-orria / esplaknopleura</text>}
      </g>}
      {day9 && <g className={structureClass("heuser-membrane")} {...click("heuser-membrane")} aria-label={label("heuser-membrane")}>
        <ellipse cx="460" cy="342" rx="87" ry="56" fill="none" stroke="#ffe7a7" strokeWidth="3" />
        {showLabels && <text className="scene-label" x="76" y="463">Heuser-en mintza</text>}
      </g>}
      {day9 && <g className={structureClass("fibrin-plug")} {...click("fibrin-plug")} aria-label={label("fibrin-plug")}>
        <path d="M405 112 Q451 91 502 111 L495 123 Q450 107 411 124 Z" fill="#f3dca8" stroke="#fff0bd" strokeWidth="2" />
        {showLabels && <text className="scene-label" x="509" y="105">Fibrinazko koagulua</text>}
      </g>}

      {(day11 || day13) && <g className={structureClass("connecting-stalk")} {...click("connecting-stalk")} aria-label={label("connecting-stalk")}>
        <path d="M533 308 C559 323 583 344 619 368 L638 386 C611 388 593 378 573 358 C554 344 534 331 515 320 Z" fill="#c8e0ab" stroke="#edfacf" strokeWidth="2" opacity="0.95" />
      </g>}
      {(day11 || day13) && showLabels && <><text className="scene-label" x="660" y="424">Finkapen pedikulua</text><path className="leader" d="M654 414 C632 399 611 377 592 351" /></>}

      {(day9 || day11) && <g className={structureClass("trophoblastic-lacunae")} {...click("trophoblastic-lacunae")} aria-label={label("trophoblastic-lacunae")}>
        <ellipse cx={day11 ? 262 : 290} cy="261" rx="24" ry="15" fill="#f6b9bb" stroke="#ffcbd0" strokeWidth="2" />
        <ellipse cx={day11 ? 657 : 628} cy="266" rx="22" ry="17" fill="#f6b9bb" stroke="#ffcbd0" strokeWidth="2" />
        <ellipse cx="454" cy={day11 ? 130 : 160} rx="31" ry="13" fill="#f6b9bb" stroke="#ffcbd0" strokeWidth="2" />
        {showLabels && <text className="scene-label" x="88" y="209">Sinzitiotrofoblastoko lakuak</text>}
      </g>}
      {(day9 || day11) && <g className={structureClass("maternal-sinusoids")} {...click("maternal-sinusoids")} aria-label={label("maternal-sinusoids")}>
        <path d="M150 142 C169 124 201 126 216 149 C228 168 209 184 187 177 C162 170 138 161 150 142 Z" fill="#eb5b5e" stroke="#f6a49e" strokeWidth="2" />
        <path d="M696 137 C716 123 746 131 751 153 C758 174 735 185 711 174 C691 165 681 150 696 137 Z" fill="#eb5b5e" stroke="#f6a49e" strokeWidth="2" />
        {showLabels && <text className="scene-label" x="76" y="110">Amaren sinusoideak</text>}
      </g>}
      {day11 && <g className={structureClass("uteroplacental-flow")} {...click("uteroplacental-flow")} aria-label={label("uteroplacental-flow")}>
        <path d="M198 174 C224 196 240 216 258 245 M716 174 C691 196 677 224 657 247" fill="none" stroke="#e9bf76" strokeWidth="4" markerEnd="url(#arrow-flow)" />
        {[0,1,2].map((index) => <circle key={index} className={`flow-particle delay-${index}`} cx={216 + index * 12} cy={188 + index * 16} r="4" fill="#f6d38f" filter="url(#soft-glow)" />)}
        {showLabels && <text className="scene-label" x="617" y="467">Hasierako utero-plazentako odol-fluxua</text>}
      </g>}
      {day11 && <g className={structureClass("decidual-reaction")} {...click("decidual-reaction")} aria-label={label("decidual-reaction")}>
        {[0, 1, 2, 3, 4].map((index) => <circle key={index} cx={110 + index * 38} cy={470 + (index % 2) * 14} r="9" fill="#dd947c" opacity="0.8" />)}
        {showLabels && <text className="scene-label" x="73" y="450">Erreakzio deziduala</text>}
      </g>}
      {day13 && <g className={structureClass("exocoelomic-cysts")} {...click("exocoelomic-cysts")} aria-label={label("exocoelomic-cysts")}>
        <circle cx="373" cy="426" r="15" fill="#d78a5e" stroke="#f3cca0" strokeWidth="2" /><circle cx="412" cy="438" r="10" fill="#d78a5e" stroke="#f3cca0" strokeWidth="2" />
        {showLabels && <text className="scene-label" x="261" y="468">Kiste exozelomikoak</text>}
      </g>}
      {day13 && <g className={structureClass("chorionic-plate")} {...click("chorionic-plate")} aria-label={label("chorionic-plate")}>
        <path d="M297 264 A164 126 0 0 1 623 264" fill="none" stroke="#c8e0ab" strokeWidth="7" opacity="0.85" />
        {showLabels && <text className="scene-label" x="680" y="190">Korion plaka</text>}
      </g>}

      {day13 && <g className={structureClass("primary-chorionic-villus")} {...click("primary-chorionic-villus")} aria-label={label("primary-chorionic-villus")}>
        <path d="M638 251 C661 243 683 246 689 263 C695 282 680 300 647 303 L637 292 Z" fill="#ce6c8c" stroke="#f3a7b9" strokeWidth="3" />
        <path d="M638 261 C654 255 671 257 674 267 C677 279 665 289 641 288 Z" fill="#f39d75" stroke="#ffd2a4" strokeWidth="2" />
        {crossSection && <>
          <circle cx="779" cy="112" r="43" fill="#ce6c8c" stroke="#f3a7b9" strokeWidth="3" />
          <circle cx="779" cy="112" r="27" fill="#f39d75" stroke="#ffd2a4" strokeWidth="3" />
          <circle cx="767" cy="102" r="5" fill="#ffe2ae" /><circle cx="789" cy="120" r="5" fill="#ffe2ae" />
          {showLabels && <text className="scene-label rail-label" x="706" y="169">Biloxkaren mozketa</text>}
        </>}
      </g>}
      {day13 && showLabels && <><text className="scene-label" x="675" y="329">{crossSection ? "Biloxkaren zeharkako mozketa" : "Biloxka primarioa"}</text><text className="scene-label muted" x="674" y="347">zito erdian · sinzitio kanpoan</text><path className="leader" d="M679 312 L668 291" /></>}
      {day8 && showLabels && <text className="scene-label muted" x="255" y="446">Egun honetan: disko bilaminarraren eta polaritate dortso-bentralaren hasiera</text>}
      {day11 && showLabels && <text className="scene-label muted" x="252" y="446">Lakuak konektatu, sinusoideak ireki eta korion barrunbea hedatzen da</text>}
      {useLabelRails && showLabels && <>
        <g fill="none" stroke="#b8d9cf" strokeWidth="1.3" opacity=".68">
          {callouts.filter((item) => stage.structures.includes(item.id) || (day9 && item.id === "cytotrophoblast")).map((item) => <path key={item.id} d={`M${item.side === "left" ? 250 : 695} ${item.y - 5} L${item.target[0]} ${item.target[1]}`} />)}
        </g>
        <rect x="42" y="176" width="214" height={day13 || day11 ? 211 : day8 ? 155 : 158} rx="10" fill="#0c2427" fillOpacity=".9" stroke="#507974" strokeOpacity=".55" />
        <rect x="695" y="175" width="195" height={day13 ? 241 : day11 ? 248 : day9 ? 195 : 121} rx="10" fill="#0c2427" fillOpacity=".9" stroke="#507974" strokeOpacity=".55" />
        {callouts.map((item) => {
          const selectable = true;
          return <g key={item.id} className={selectable ? structureClass(item.id) : undefined}
            {...(selectable ? click(item.id) : {})} role={selectable ? "button" : undefined}
            tabIndex={selectable ? 0 : undefined} aria-label={selectable ? label(item.id) : undefined}>
            <text className="scene-label rail-label" x={item.side === "left" ? 58 : 708} y={item.y} fontSize="12">{item.title}</text>
          </g>;
        })}
      </>}
    </svg>
  );
}
