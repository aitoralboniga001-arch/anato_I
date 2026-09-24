"use client";

import type { KeyboardEvent, MouseEvent, ReactNode } from "react";
import type { Stage, Topic } from "@/content/types";
import "@/app/advanced-scenes.css";

type Props = {
  stage: Stage;
  topic: Topic;
  stageProgress: number;
  selectedId?: string;
  relationIds: string[];
  isolated: boolean;
  showLabels: boolean;
  showComparison: boolean;
  onSelect: (id: string) => void;
};

const C = { ect: "#83c9ed", mes: "#e49b8b", end: "#e7c67f", neural: "#a9a0ed", crest: "#c8a9df", cavity: "#285a66", green: "#a8d9b7", ink: "#102829" };

export default function AdvancedDevelopmentScene(props: Props) {
  const { stage, topic, stageProgress, selectedId, relationIds, isolated, showLabels, showComparison, onSelect } = props;
  const names = new Map(topic.structures.map((item) => [item.id, item.label.primary]));
  const target = (preferred: string, ...aliases: string[]) => [preferred, ...aliases].find((id) => stage.structures.includes(id));
  const label = (id: string, fallback: string) => names.get(id) ?? fallback;
  const part = (id: string, fallback: string, children: ReactNode, ...aliases: string[]) => {
    const actual = target(id, ...aliases);
    if (!actual) return <g className="adv-static">{children}</g>;
    const active = selectedId === actual;
    const cls = `interactive-structure adv-part${active ? " selected" : ""}${relationIds.includes(actual) ? " related" : ""}`;
    const activate = (event: MouseEvent<SVGGElement> | KeyboardEvent<SVGGElement>) => { event.stopPropagation(); onSelect(actual); };
    return <g className={cls} onClick={activate} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); activate(event); } }} role="button" tabIndex={0} aria-label={label(actual, fallback)}>{children}</g>;
  };
  const caption = (x: number, y: number, title: string, detail?: string) => <g className="adv-caption"><text x={x} y={y}>{title}</text>{detail && <text className="adv-caption-detail" x={x} y={y + 20}>{detail}</text>}</g>;
  const arrow = (d: string, color = C.green) => <path d={d} className="adv-arrow" stroke={color} markerEnd="url(#adv-arrowhead)" opacity={0.45 + Math.min(1, Math.max(0, stageProgress)) * 0.55} />;
  const is3 = topic.id === "week-3";
  const title = stage.title.primary;

  const primitive = stage.id === "primitive-streak";
  const layers = stage.id === "germ-layers";
  const notochord = stage.id === "notochord";
  const allantois = stage.id === "allantois-growth";
  const villi = stage.id.startsWith("villi-");
  const folding = stage.id === "folding";
  const neural = ["neural-plate", "neural-tube", "neural-crest"].includes(stage.id);
  const mesoderm = ["somites", "intermediate-mesoderm", "lateral-plate"].includes(stage.id);
  const gut = ["gut-tube", "endoderm-derivatives"].includes(stage.id);

  const view = primitive ? "BIZKARRETIK · DORTSAL IKUSPEGIA" : notochord || allantois || folding || gut ? "ERDIKO MOZKETA · SAGITALA" : villi ? "BILOXKAREN LUZETARAKO ESKEMA" : "GORPUTZAREN MOZKETA · ZEHARKAKOA";
  return <svg className={`scene-svg adv-svg${isolated ? " isolated" : ""}${!showLabels ? " labels-hidden" : ""}`} viewBox="0 0 900 560" role="img" aria-label={`${title}: ${view.toLowerCase()}`}>
    <defs>
      <marker id="adv-arrowhead" markerWidth="9" markerHeight="9" refX="8" refY="4.5" orient="auto"><path d="M0 0 L9 4.5 L0 9 Z" fill={C.green} /></marker>
      <pattern id="adv-cells" width="23" height="20" patternUnits="userSpaceOnUse"><circle cx="7" cy="8" r="2" fill="#f9e4c1" fillOpacity=".7" /></pattern>
    </defs>
    <rect width="900" height="560" fill="#102829" />
    <path d="M0 50 H900 M0 510 H900" stroke="#32605b" opacity=".6" />
    <text className="adv-kicker" x="45" y="33">{is3 ? "3. ASTEA" : "4. ASTEA"}  /  {view}</text>
    <text className="adv-title" x="45" y="86" style={{ fontSize: title.length > 60 ? 18 : title.length > 46 ? 21 : undefined }}>{title}</text>
    {showComparison && <g opacity=".35"><path d="M65 462 H835" stroke="#c0e2d4" strokeDasharray="5 8" /><text className="adv-note" x="650" y="483">Aurreko egoeraren erreferentzia</text></g>}

    {primitive && <>
      <text className="adv-axis" x="428" y="132">KRANEALA ↑</text>
      {part("epiblast", "Epiblastoa", <><ellipse cx="450" cy="298" rx="207" ry="157" fill={C.ect} fillOpacity=".2" stroke={C.ect} strokeWidth="6" />{caption(88, 215, "Epiblastoa", "amnios barrunbearen zorua")}</>)}
      {part("primitive-streak", "Lerro primitiboa", <><path d="M441 282 Q451 365 451 431" stroke={C.mes} strokeWidth="25" strokeLinecap="round" fill="none" />{caption(593, 377, "Lerro primitiboa")}</>)}
      {part("primitive-groove", "Ildo primitiboa", <><path d="M450 301 V427" stroke="#653e47" strokeWidth="7" strokeLinecap="round" />{caption(592, 406, "Ildo primitiboa")}</>)}
      {part("primitive-node", "Nodo primitiboa", <><circle cx="450" cy="279" r="25" fill={C.end} stroke="#fff0bf" strokeWidth="3" />{caption(581, 250, "Nodo primitiboa")}</>)}
      {part("primitive-pit", "Hobi primitiboa", <><circle cx="450" cy="279" r="8" fill="#655b5e" stroke="#fff0bf" strokeWidth="2" />{caption(581, 277, "Hobi primitiboa")}</>)}
      {arrow("M363 359 C402 352 420 341 435 325")}{arrow("M536 359 C498 352 476 341 464 325")}
      {part("amniotic-cavity", "Amnioi-barrunbea", <><rect x="66" y="272" width="155" height="38" rx="17" fill={C.cavity} stroke="#7ec0d3" strokeWidth="2" />{caption(76, 297, "Amnioi-barrunbea")}</>)}
      {part("yolk-sac", "Bitelo-zakua", <><rect x="66" y="329" width="155" height="38" rx="17" fill={C.cavity} stroke="#e7c67f" strokeWidth="2" />{caption(76, 354, "Bitelo-zakua")}</>)}
      <path d="M73 318 H215" stroke={C.ect} strokeWidth="6" />
      {caption(75, 396, "Alboko ebakidura txikia")}
      {caption(81, 445, "Epiblastoko zelulak erdialdera migratzen dira", "nodoan eta ildoan barrurantz sartzen dira")}
      <text className="adv-axis" x="424" y="479">KAUDALA ↓</text>
    </>}

    {layers && <>
      {caption(87, 155, "DORTSALA", "amnios barrunbea")}
      <path d="M264 171 Q451 132 638 171 L638 210 Q450 176 264 210 Z" fill={C.cavity} stroke="#6ab5d1" strokeWidth="2" />
      {part("ectoderm", "Ektodermoa", <><path d="M256 212 Q450 181 645 212 L645 239 Q450 209 256 239 Z" fill={C.ect} stroke="#d5f4fb" strokeWidth="2" />{caption(680, 224, "Ektodermoa")}</>, "epiblast")}
      {part("intraembryonic-mesoderm", "Enbrioi barruko mesodermoa", <><path d="M257 242 Q450 213 644 242 L644 301 Q450 274 257 301 Z" fill={C.mes} stroke="#f6bdb0" strokeWidth="2" />{caption(680, 274, "Mesodermoa")}</>, "mesoderm")}
      {part("definitive-endoderm", "Behin betiko endodermoa", <><path d="M259 304 Q450 277 642 304 L642 328 Q450 301 259 328 Z" fill={C.end} stroke="#fae6ad" strokeWidth="2" />{caption(680, 321, "Endodermoa")}</>, "endoderm")}
      <path d="M269 330 Q449 303 633 330 L610 401 Q450 374 290 401 Z" fill={C.cavity} stroke="#5798a1" strokeWidth="2" />
      {part("epiblast", "Epiblastoa", <>{caption(78, 199, "Epiblastoa: hiru orrien jatorria")}</>)}
      {part("invagination", "Inbaginazioa", <>{arrow("M449 149 V205")}{arrow("M449 228 V268")}{arrow("M410 228 C371 250 353 273 347 302")}{caption(66, 376, "Inbaginazioa", "lehen zelulek hipoblastoa ordezkatzen dute")}</>)}
      {part("extraembryonic-mesoderm", "Enbrioi kanpoko mesodermoa", <><path d="M232 242 V317" stroke="#ddaf9c" strokeWidth="10" strokeDasharray="7 5" />{caption(75, 269, "Kanpoko mesodermoa")}</>)}
      {part("primitive-streak", "Lerro primitiboa", <>{caption(73, 307, "Sarrera: lerro primitiboa")}</>)}
      {caption(65, 467, "Muturretako mintzak: alboko kokapen-eskema")}
      {part("oropharyngeal-membrane", "Mintz orofaringeoa", <><path d="M285 461 V482" stroke="#fff1bd" strokeWidth="11" />{caption(94, 483, "Mintz orofaringeoa")}</>)}
      {part("cloacal-membrane", "Kloaka-mintza", <><path d="M607 461 V482" stroke="#fff1bd" strokeWidth="11" />{caption(653, 483, "Kloaka-mintza")}</>)}
      {caption(86, 449, "BENTRALA", "bitelo zakuaren aldea")}
    </>}

    {notochord && <>
      <text className="adv-axis" x="70" y="147">KRANEALA ←</text><text className="adv-axis" x="702" y="147">→ KAUDALA</text>
      <path d="M90 177 H814 V222 H90 Z" fill={C.cavity} stroke="#6ab5d1" strokeWidth="2" />
      <path d="M92 229 H811 V248 H92 Z" fill={C.ect} stroke="#d5f4fb" strokeWidth="2" />
      <path d="M92 249 H129 V316 H92 Z M139 249 H811 V316 H139 Z" fill={C.mes} stroke="#f6bdb0" strokeWidth="2" />
      <path d="M92 317 H811 V335 H92 Z" fill={C.end} stroke="#fae6ad" strokeWidth="2" />
      <path d="M92 337 H811 V402 H92 Z" fill={C.cavity} stroke="#5798a1" strokeWidth="2" />
      {caption(109, 206, "Amnioi-barrunbea")}{caption(107, 386, "Bitelo-zakua")}
      {part("oropharyngeal-membrane", "Mintz orofaringeoa", <><path d="M134 228 V336" stroke="#fff1bd" strokeWidth="9" />{caption(72, 448, "Mintz orofaringeoa", "bi geruza; mesodermorik gabe")}</>)}
      {part("prechordal-plate", "Plaka prekordala", <><ellipse cx="223" cy="279" rx="45" ry="18" fill="#efcc9c" stroke="#fff1bc" strokeWidth="3" />{caption(155, 296, "Plaka prekordala")}</>)}
      {part("notochord", "Notokorda", <><path d="M284 279 Q456 268 632 279" fill="none" stroke="#e8aede" strokeWidth="19" strokeLinecap="round" />{caption(360, 264, "Notokorda · orain")}</>)}
      {part("primitive-node", "Nodo primitiboa", <><ellipse cx="691" cy="270" rx="35" ry="17" fill={C.end} stroke="#fff0bf" strokeWidth="3" />{caption(673, 246, "Nodo primitiboa")}</>)}
      {part("primitive-pit", "Hobi primitiboa", <><circle cx="691" cy="259" r="8" fill={C.ink} stroke="#fff0bf" strokeWidth="2" />{caption(692, 311, "Hobi primitiboa")}</>)}
      {part("neurenteric-canal", "Kanal neurenterikoa", <><path d="M693 222 V339" stroke="#78d5e6" strokeWidth="8" strokeDasharray="8 5" />{caption(557, 378, "Kanal neurenteriko iragankorra")}</>)}
      {part("notochordal-plate", "Plaka notokordala", <><rect x="309" y="423" width="174" height="17" rx="8" fill="#e8aede" stroke="#ffe5f2" strokeWidth="2" />{caption(315, 466, "Plaka notokordala · aurrekoa")}</>)}
      {arrow("M496 432 H580")}{caption(587, 434, "Plaka askatu → notokorda")}
    </>}

    {allantois && <>
      <text className="adv-axis" x="95" y="137">KRANEALA ←</text><text className="adv-axis" x="690" y="137">→ KAUDALA</text>
      <path d="M148 260 Q420 197 748 255 L748 278 Q420 228 148 278 Z" fill={C.ect} stroke="#cceafa" strokeWidth="3" />
      <path d="M148 281 Q420 240 748 281 L748 334 Q420 299 148 334 Z" fill={C.mes} />
      <path d="M148 339 Q420 303 748 339 L748 359 Q420 328 148 359 Z" fill={C.end} stroke="#f8e4b5" strokeWidth="2" />
      {part("ectoderm", "Ektodermoa", <>{caption(105, 245, "Ektodermoa")}</>)}
      {part("intraembryonic-mesoderm", "Enbrioi barruko mesodermoa", <>{caption(105, 315, "Barneko mesodermoa")}</>)}
      {part("definitive-endoderm", "Behin betiko endodermoa", <>{caption(105, 359, "Endodermoa")}</>)}
      {part("allantois", "Alantoidea", <><path d="M651 347 C688 369 730 380 793 378 L793 403 C726 404 679 389 647 358 Z" fill={C.end} stroke="#f6e2b2" strokeWidth="3" />{caption(640, 440, "Alantoidea", "bitelo zakuaren dibertikulua")}</>)}
      {part("connecting-stalk", "Finkapen pedikulua", <><path d="M655 248 Q755 230 819 273 L819 350 Q763 324 672 336 Z" fill={C.mes} fillOpacity=".7" stroke="#f3c1b4" strokeWidth="2" />{caption(640, 210, "Finkapen pedikulua")}</>)}
      {caption(95, 194, "Diskoaren hazkuntza", "mutur kraneala bizkorrago hedatzen da")}
      {arrow("M281 180 C370 158 473 158 559 183")}
      {part("yolk-sac", "Bitelo-zakua", <>{caption(95, 414, "Bitelo-zakua", "endodermoaren jarraipena")}</>)}
    </>}

    {stage.id === "villi-secondary" && <>
      <text className="adv-axis" x="60" y="125">AMAREN ODOLA: BILOXKEN ARTEKO ESPAZIOAN</text>
      <text className="adv-axis" x="115" y="153">AURREKOA</text>
      <text className="adv-axis" x="404" y="153">{stage.id === "villi-secondary" ? "ORAIN" : "AURREKOA"}</text>
      <text className="adv-axis" x="640" y="153">{stage.id === "villi-secondary" ? "HURRENGOA" : "ORAIN"}</text>
      <rect x="55" y="168" width="790" height="238" rx="26" fill="#602f46" stroke="#a55c70" strokeWidth="2" />
      {[195, 450, 705].map((x, index) => {
        const id = ["primary-chorionic-villus", "secondary-chorionic-villus", "tertiary-chorionic-villus"][index];
        const active = stage.id === (index === 1 ? "villi-secondary" : "villi-tertiary") && index === (stage.id === "villi-secondary" ? 1 : 2);
        const diagram = <g opacity={active ? 1 : .64}>
          <ellipse cx={x} cy="282" rx="80" ry="101" fill="#be6486" stroke="#ffc4d2" strokeWidth="4" />
          <ellipse cx={x} cy="282" rx="60" ry="82" fill="#ec9676" stroke="#ffd3b0" strokeWidth="3" />
          {index > 0 && <ellipse cx={x} cy="282" rx="41" ry="65" fill={C.mes} stroke="#ffded2" strokeWidth="3" />}
          {index === 2 && <><path d={`M${x - 13} 333 C${x - 27} 300 ${x - 24} 265 ${x} 230 M${x + 15} 334 C${x + 33} 298 ${x + 22} 259 ${x + 2} 233`} fill="none" stroke="#e64e5e" strokeWidth="8" strokeLinecap="round" /><circle cx={x - 17} cy="280" r="7" fill="#e64e5e" /><circle cx={x + 22} cy="282" r="7" fill="#e64e5e" /></>}
          {active && <rect x={x - 97} y="174" width="194" height="216" rx="20" fill="none" stroke="#abebce" strokeWidth="3" strokeDasharray="7 5" />}
        </g>;
        return <g key={id}>{part(id, ["Biloxka primarioa", "Biloxka sekundarioa", "Biloxka tertziarioa"][index], diagram)}{caption(x - 71, 438, ["PRIMARIOA", "SEKUNDARIOA", "TERTZIARIOA"][index], ["zitotrofoblasto muina", "mesodermoaren muina", "kapilar fetalak"][index])}</g>;
      })}
      {arrow("M287 284 H341")}{arrow("M542 284 H596")}
      {part("extraembryonic-mesoderm", "Enbrioi kanpoko mesodermoa", <>{caption(324, 169, "Mesodermoa biloxkan sartzen da")}</>)}
      {part("chorion", "Koriona eta korion-plaka", <><path d="M120 404 H782" stroke="#e5a991" strokeWidth="8" />{caption(361, 494, "Korion-plaka")}</>)}
      {part("syncytiotrophoblast", "Sinzitiotrofoblastoa", <>{caption(62, 476, "Kanpoaldea: sinzitiotrofoblastoa")}</>)}
      {part("cytotrophoblast", "Zitotrofoblastoa", <>{caption(472, 476, "Barrualdea: zitotrofoblastoa")}</>)}
    </>}

    {stage.id === "villi-tertiary" && <>
      <text className="adv-axis" x="67" y="135">AMA: ODOLA BILOXKEN ARTEKO ESPAZIOAN</text>
      <rect x="64" y="155" width="773" height="280" rx="22" fill="#602f46" stroke="#a55c70" strokeWidth="2" />
      <path d="M115 173 H785" stroke="#db9383" strokeWidth="18" />
      {caption(86, 195, "Amaren dezidua")}
      {part("intervillous-space", "Biloxken arteko espazioa", <><circle cx="242" cy="295" r="15" fill="#ec7580" opacity=".7" /><circle cx="610" cy="278" r="14" fill="#ec7580" opacity=".7" />{caption(78, 257, "Amaren odola", "biloxken kanpoaldean")}</>)}
      {part("anchoring-villus", "Ainguratzeko biloxka", <><path d="M449 419 C435 362 433 293 433 184 H475 C475 293 472 362 458 419 Z" fill="#be6486" stroke="#ffc4d2" strokeWidth="4" />{caption(522, 206, "Ainguratzeko biloxka", "korionetik deziduara")}</>)}
      {part("free-villus", "Biloxka askea", <><path d="M453 307 C416 287 367 291 335 253 L352 231 C389 261 423 263 452 276 M455 342 C494 318 541 322 574 285 L592 307 C554 351 503 352 456 372" fill="#be6486" stroke="#ffc4d2" strokeWidth="4" />{caption(91, 352, "Biloxka askeen adarrak", "truke-azalera handitzen dute")}</>)}
      {part("syncytiotrophoblast", "Sinzitiotrofoblastoa", <><path d="M455 218 V377" stroke="#efadc5" strokeWidth="7" strokeDasharray="12 6" />{caption(522, 260, "Sinzitiotrofoblastoa")}</>)}
      {part("cytotrophoblast", "Zitotrofoblastoa", <><path d="M445 220 V373" stroke="#e9a080" strokeWidth="7" strokeDasharray="12 6" />{caption(522, 290, "Zitotrofoblastoa")}</>)}
      {part("fetal-capillaries", "Fetuaren kapilarrak", <><path d="M450 415 C443 361 449 292 448 206 M459 414 C469 358 457 289 461 205" stroke="#ec4e5e" strokeWidth="5" fill="none" />{caption(522, 324, "Fetuaren kapilarrak", "zilbor-hodiekin lotzen dira")}</>)}
      {part("placental-barrier", "Karena-hesia", <><path d="M480 348 V392" stroke="#a8d9b7" strokeWidth="4" strokeDasharray="5 4" />{caption(522, 385, "Karena-hesia", "bi odolak bereizten ditu")}</>)}
      {part("chorion", "Koriona eta korion-plaka", <><path d="M120 423 H786" stroke="#e5a991" strokeWidth="21" />{caption(88, 466, "Korion-plaka → pedikuluko hodiak → enbrioia")}</>)}
      {part("connecting-stalk", "Finkapen-pedikulua", <>{caption(518, 490, "Finkapen-pedikulua → enbrioiaren hodiak")}</>)}
      {part("tertiary-chorionic-villus", "Korion-biloxka tertziarioa", <>{caption(306, 213, "Biloxka tertziarioa")}</>)}
    </>}

    {folding && <>
      <rect x="53" y="151" width="385" height="319" rx="18" fill="#173c40" stroke="#4b7d77" />
      <rect x="462" y="151" width="385" height="319" rx="18" fill="#173c40" stroke="#4b7d77" />
      <text className="adv-axis" x="75" y="182">LUZETARAKO EBAKIDURA · SAGITALA</text>
      <text className="adv-axis" x="484" y="182">ZEHARKAKO EBAKIDURA</text>
      {part("cranio-caudal-fold", "Tolespen zefalokaudala", <>
        <path d="M115 253 C138 218 176 212 205 240 Q245 272 288 240 C320 211 365 218 386 255 C379 295 356 322 332 331 L310 298 Q242 314 171 297 L148 330 C128 316 112 289 115 253 Z" fill={C.ect} fillOpacity=".46" stroke={C.ect} strokeWidth="6" />
        {arrow("M135 206 C107 243 115 278 151 307")}{arrow("M366 206 C395 243 382 280 344 307")}
        {caption(113, 364, "Buru eta isatsaren", "tolespen bentralak")}
      </>)}
      {part("heart-tube", "Bihotz-hodia", <><ellipse cx="246" cy="320" rx="36" ry="17" fill="#e98289" stroke="#ffd1d3" strokeWidth="3" />{caption(286, 349, "Bihotz-hodia", "alde bentralera")}</>)}
      {part("amniotic-cavity", "Amnioi-barrunbea", <><path d="M161 238 Q248 167 334 238" fill="none" stroke="#7ec0d3" strokeWidth="6" />{caption(158, 217, "Amnioi-barrunbea")}</>)}
      {part("yolk-sac", "Bitelo-zakua", <><ellipse cx="241" cy="409" rx="58" ry="34" fill={C.end} fillOpacity=".65" stroke="#ffeab8" strokeWidth="3" />{caption(302, 421, "Bitelo-zakua")}</>)}
      {part("lateral-fold", "Alboko tolespena", <>
        <path d="M500 260 C523 219 564 215 589 254 L619 316 M810 260 C787 219 746 215 721 254 L691 316" fill="none" stroke={C.ect} strokeWidth="23" strokeLinecap="round" />
        <path d="M516 230 C543 265 571 292 610 316 M795 230 C766 266 739 292 701 316" fill="none" stroke={C.green} strokeWidth="4" markerEnd="url(#adv-arrowhead)" strokeDasharray="8 6" />
        {caption(492, 367, "Bi ertzak erdiko lerroan", "elkartu → aurreko pareta")}
      </>)}
      {part("surface-ectoderm", "Gainazaleko ektodermoa", <><path d="M608 226 Q655 201 702 226" fill="none" stroke={C.ect} strokeWidth="10" />{caption(599, 213, "Ektodermoa")}</>)}
      <ellipse cx="655" cy="316" rx="50" ry="31" fill={C.end} stroke="#ffeab8" strokeWidth="3" />
      {caption(570, 413, "Endodermoa barrura", "heste-hodia eratuz")}
    </>}

    {(neural || mesoderm) && <>
      {caption(68, 148, "DORTSALA", "gainazaleko ektodermoa")}
      {part("surface-ectoderm", "Gainazaleko ektodermoa", <><path d="M171 262 Q288 191 352 219 M548 219 Q613 191 729 262" fill="none" stroke={C.ect} strokeWidth="20" strokeLinecap="round" />{caption(700, 224, "Ektodermoa")}</>, "ectoderm")}
      {part(stage.id === "neural-plate" ? "neural-plate" : "neural-tube", stage.id === "neural-plate" ? "Plaka neurala" : "Hodi neurala", <><path d={stage.id === "neural-plate" ? "M350 220 Q451 243 550 220 L550 257 Q450 280 350 257 Z" : "M381 223 C371 177 411 158 451 158 C489 158 529 177 519 223 Q503 274 450 275 Q397 274 381 223 Z"} fill={C.neural} stroke="#e4ddff" strokeWidth="4" />{stage.id !== "neural-plate" && <ellipse cx="450" cy="216" rx="26" ry="22" fill={C.cavity} />}{caption(362, 126, stage.id === "neural-plate" ? "Plaka neurala" : "Hodi neurala")}</>, "neural-folds")}
      {stage.id === "neural-plate" && part("neural-groove", "Ildo neurala", <><path d="M414 233 Q450 250 486 233" fill="none" stroke="#617391" strokeWidth="7" />{caption(548, 278, "Ildo neurala", "bi ertzetan tolesdurak")}</>)}
      {stage.id === "neural-tube" && part("neural-groove", "Ildo neurala", <>{caption(75, 175, "Lehenagoko ildoa", "tolesdurak elkartu dira")}</>)}
      {stage.id === "neural-crest" && <>
        {part("neural-crest", "Gandor neurala", <><circle cx="421" cy="158" r="11" fill={C.crest} stroke="#f4ddff" strokeWidth="2" /><circle cx="481" cy="158" r="11" fill={C.crest} stroke="#f4ddff" strokeWidth="2" /><circle cx="349" cy="182" r="12" fill={C.crest} /><circle cx="551" cy="182" r="12" fill={C.crest} />{arrow("M403 146 C380 139 355 151 340 169")}{arrow("M497 146 C520 139 545 151 560 169")}{caption(75, 204, "Gandor neurala", "hodi itxitik zelulak migratzen dira")}</>)}
        {part("neural-crest-ganglia", "Gongoil sentsorialak eta autonomoak", <><circle cx="319" cy="272" r="15" fill={C.crest} stroke="#f4ddff" strokeWidth="2" /><circle cx="581" cy="272" r="15" fill={C.crest} stroke="#f4ddff" strokeWidth="2" />{arrow("M347 202 C327 219 320 244 319 254")}{arrow("M553 202 C573 219 580 244 581 254")}{caption(66, 360, "Gongoil periferikoak", "sentsorialak eta autonomoak")}</>)}
        {part("neural-crest-other", "Gandor neuralaren beste eratorriak", <>{caption(607, 364, "Beste migrazio batzuk", "melanozitoak, aurpegia, bihotza")}</>)}
      </>}
      {part("notochord", "Notokorda", <><ellipse cx="450" cy="316" rx="41" ry="20" fill="#df9fce" stroke="#f8d7ed" strokeWidth="3" />{caption(508, 326, "Notokorda")}</>)}
      {mesoderm && <>
        {part("somites", "Somitak", <><ellipse cx="337" cy="316" rx="55" ry="37" fill={C.mes} stroke="#ffd4c5" strokeWidth="3" /><ellipse cx="563" cy="316" rx="55" ry="37" fill={C.mes} stroke="#ffd4c5" strokeWidth="3" />{caption(77, 286, "Mesodermo paraxiala", "somita pare segmentatuak")}</>, "paraxial-mesoderm")}
        {stage.id === "somites" && part("paraxial-mesoderm", "Mesodermo paraxiala", <>{caption(75, 245, "Mesodermo paraxiala → somitak")}</>)}
        {part("intermediate-mesoderm", "Bitarteko mesodermoa", <><ellipse cx="256" cy="339" rx="37" ry="21" fill="#deaa8b" stroke="#ffe2c3" strokeWidth="3" /><ellipse cx="644" cy="339" rx="37" ry="21" fill="#deaa8b" stroke="#ffe2c3" strokeWidth="3" />{caption(73, 397, "Bitarteko mesodermoa")}</>)}
        {part("lateral-plate-mesoderm", "Alboko mesodermoa", <><path d="M120 365 Q166 338 209 354 L225 412 Q168 393 120 418 Z M680 354 Q733 337 780 365 L780 418 Q732 394 680 412 Z" fill={C.mes} stroke="#ffd4c5" strokeWidth="3" />{caption(621, 399, "Alboko mesodermoa")}</>, "lateral-plate")}
        {part("intraembryonic-coelom", "Enbrioi barruko zeloma", <><path d="M144 382 Q184 367 211 380 M689 380 Q725 365 759 382" fill="none" stroke="#6cbbcf" strokeWidth="11" strokeLinecap="round" />{caption(334, 456, "Barneko zeloma", "somatopleura ↔ esplaknopleura")}</>, "coelom")}
        {stage.id === "somites" && <>
          {part("sclerotome", "Esklerotoma", <>{caption(73, 176, "Esklerotoma → ornoak eta saihetsak")}</>)}
          {part("dermatome", "Dermatoma", <>{caption(585, 171, "Dermatoma → bizkarreko dermisa")}</>)}
          {part("myotome", "Miotoma", <>{caption(640, 197, "Miotoma → giharrak")}</>)}
        </>}
        {stage.id === "intermediate-mesoderm" && <>
          {part("nephrotomes", "Nefrotomak", <>{caption(74, 174, "Goialdean: nefrotomak")}</>)}
          {part("nephrogenic-cord", "Kordoi nefrogenoa", <>{caption(640, 176, "Kaudalki: kordoi nefrogenoa")}</>)}
        </>}
        {stage.id === "lateral-plate" && <>
          {part("somatopleure", "Somatopleura", <>{caption(73, 171, "Orri somatikoa", "ektodermoaren ondoan")}</>)}
          {part("splanchnopleure", "Esplaknopleura", <>{caption(661, 172, "Orri esplaknikoa", "endodermoaren ondoan")}</>)}
          {part("body-cavities", "Gorputz barrunbeak", <>{caption(660, 464, "Zeloma → serosa barrunbeak")}</>)}
          {part("heart-tube", "Bihotz-hodia", <>{caption(73, 430, "Bihotz-hodia: alde bentraleko egitura")}</>)}
        </>}
      </>}
      {mesoderm && part("definitive-endoderm", "Endodermoa", <><path d="M280 424 Q451 368 620 424" fill="none" stroke={C.end} strokeWidth="21" strokeLinecap="round" />{caption(693, 436, "Endodermoa")}</>, "endoderm")}
      {neural && <>
        {arrow("M450 348 V285")}
        <g className="adv-neural-sequence">
          <path d="M93 451 Q129 464 165 451 M360 451 Q388 470 414 455 Q440 470 468 451 M680 451 Q711 417 742 451 Q744 479 711 480 Q679 479 680 451" fill="none" stroke={C.neural} strokeWidth="8" strokeLinecap="round" />
          <path d="M199 456 H317 M503 456 H638" stroke={C.green} strokeWidth="3" markerEnd="url(#adv-arrowhead)" />
          <text x="81" y="495">Plaka neurala</text><text x="347" y="495">Ildo eta tolesdurak</text><text x="661" y="495">Hodi neurala</text>
        </g>
        {stage.id === "neural-tube" && <>
          <path d="M176 361 H724" stroke={C.neural} strokeWidth="14" strokeLinecap="round" />
          {part("cranial-neuropore", "Neuroporo kraneala", <><circle cx="176" cy="361" r="18" fill={C.ink} stroke="#f0d5a7" strokeWidth="4" />{caption(72, 315, "Aurreko neuroporoa", "25. egun inguruan")}</>)}
          {part("caudal-neuropore", "Neuroporo kaudala", <><circle cx="724" cy="361" r="18" fill={C.ink} stroke="#f0d5a7" strokeWidth="4" />{caption(640, 315, "Atzeko neuroporoa", "27.–28. egun inguruan")}</>)}
          {part("primary-brain-vesicles", "Hiru garun besikula primarioak", <><circle cx="328" cy="361" r="25" fill="#bbafea" stroke="#e8ddff" strokeWidth="3" /><circle cx="391" cy="361" r="21" fill="#bbafea" stroke="#e8ddff" strokeWidth="3" /><circle cx="449" cy="361" r="18" fill="#bbafea" stroke="#e8ddff" strokeWidth="3" />{caption(228, 415, "Prosentzefaloa · mesentzefaloa · erronbentzefaloa")}</>)}
        </>}
      </>}
      {mesoderm && caption(67, 484, "ERDI-TIK ALBORA: paraxiala → bitartekoa → alboko xafla")}
    </>}

    {gut && <>
      <text className="adv-axis" x="75" y="145">KRANEALA ←</text><text className="adv-axis" x="686" y="145">→ KAUDALA</text>
      <path d="M133 280 C238 225 335 233 453 273 C555 306 654 286 770 252" fill="none" stroke={C.ect} strokeWidth="35" strokeLinecap="round" opacity=".55" />
      {part("gut-tube", "Heste hodia", <><path d="M163 318 C249 276 335 289 447 317 C558 347 661 313 749 296" fill="none" stroke={C.end} strokeWidth="65" strokeLinecap="round" /><path d="M163 318 C249 276 335 289 447 317 C558 347 661 313 749 296" fill="none" stroke="#835d4e" strokeWidth="26" strokeLinecap="round" />{caption(359, 217, "Heste hodia", "endodermoz estalitako hodia")}</>)}
      {part("foregut", "Aurreko hestea", <><ellipse cx="261" cy="297" rx="72" ry="24" fill={C.end} fillOpacity=".3" stroke="#fff0c5" strokeWidth="3" />{caption(86, 403, "Aurreko hestea")}</>)}
      {part("midgut", "Erdiko hestea", <><ellipse cx="451" cy="316" rx="75" ry="28" fill={C.end} fillOpacity=".28" stroke="#fff0c5" strokeWidth="3" />{caption(375, 412, "Erdiko hestea")}</>)}
      {part("hindgut", "Atzeko hestea", <><ellipse cx="647" cy="313" rx="69" ry="26" fill={C.end} fillOpacity=".25" stroke="#fff0c5" strokeWidth="3" />{caption(657, 404, "Atzeko hestea")}</>)}
      {stage.id === "endoderm-derivatives" && <>
        {part("pharyngeal-pouches", "Faringe-poltsak", <><path d="M228 277 Q208 249 190 248 M252 277 Q240 247 225 239" fill="none" stroke="#f8ddaa" strokeWidth="11" strokeLinecap="round" />{caption(77, 219, "Faringe-poltsak")}</>)}
        {part("respiratory-bud", "Arnas-dibertikulua", <><path d="M300 331 Q294 365 269 390" fill="none" stroke={C.end} strokeWidth="20" strokeLinecap="round" />{caption(86, 433, "Arnas-dibertikulua")}</>)}
        {part("cloaca", "Kloaka", <><ellipse cx="735" cy="309" rx="37" ry="35" fill="#d9ad7d" stroke="#ffdfa9" strokeWidth="3" />{caption(711, 445, "Kloaka")}</>)}
        {part("allantois", "Alantoidea", <><path d="M745 333 Q777 371 807 370" fill="none" stroke={C.end} strokeWidth="13" strokeLinecap="round" />{caption(684, 474, "Alantoidea")}</>)}
        {part("surface-ectoderm", "Gainazaleko ektodermoa", <>{caption(75, 165, "Ahoaren eta uzkiaren muturrak: ektodermoak")}</>)}
        {caption(374, 464, "Epitelioa: endodermoa")}
      </>}
      {stage.id === "gut-tube" && <>
        {part("vitelline-duct", "Hodi bitelinoa", <><path d="M440 340 V401 M463 340 V401" fill="none" stroke={C.end} strokeWidth="8" />{caption(509, 381, "Hodi bitelinoa")}</>)}
        {part("yolk-sac", "Bitelo-zakua", <><path d="M410 400 Q450 385 490 400 L490 431 Q450 458 410 431 Z" fill={C.end} fillOpacity=".6" stroke="#fff0c5" strokeWidth="3" />{caption(506, 452, "Bitelo-zakua")}</>)}
        {part("splanchnopleure", "Orri esplaknikoa", <><path d="M166 348 C260 311 339 323 446 351 C550 381 660 350 747 328" fill="none" stroke={C.mes} strokeWidth="5" strokeDasharray="9 6" />{caption(90, 244, "Orri esplaknikoa: kanpoko horma")}</>)}
        {part("amniotic-cavity", "Amnioi-barrunbea", <>{caption(550, 168, "Amnioi-barrunbeak gorputza inguratzen du")}</>)}
        {caption(81, 469, "Tolesturek endodermoaren zati bat barneratzen dute")}
      </>}
    </>}
    <text className="adv-foot" x="45" y="531">ESKEMA ANATOMIKOA · ESKALA ETA KOKAPEN ZEHAZTAK SINPLIFIKATUTA · EGIN KLIK EGITURETAN</text>
  </svg>;
}
