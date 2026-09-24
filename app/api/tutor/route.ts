import { generateText } from "ai";
import { NextResponse } from "next/server";
import { getTutorModel } from "@/lib/ai/provider";

export const runtime = "nodejs";

type TutorContext = {
  topic?: unknown;
  stage?: unknown;
  developmentalTime?: unknown;
  selectedStructure?: unknown;
  visibleStructures?: unknown;
  previousStage?: unknown;
  nextStage?: unknown;
  currentExplanation?: unknown;
  relevantCourseSource?: unknown;
  studentMode?: unknown;
  preferredLanguage?: unknown;
};

const FALLBACKS: Record<string, string> = {
  explain: "Eszena honetan egitura berriak aurreko konfigurazioaren gainean antolatzen ari dira. Begiratu kolore bereko geruzak eta erabili denbora-lerroa pausoz pauso.",
  change: "Aurreko etaparekiko aldaketa nabarmena laku, geruza edo barrunbe berriaren agerpena da. Mugitu denbora-lerroa poliki eta konparaketa aktibatu.",
  why: "Aldaketa espazialak hurrengo irudiaren zentzua azaltzen du: egitura batek barrunbe bat mugatzen duenean, inguruko ehunek kokapen berri bat hartzen dute.",
  simple: "Pentsa ezazu eszena geruza eta barrunbe gisa. Zer agertu den jakiteko, begiratu kolore berriei eta aukeratu egitura bat.",
  deep: "Iturriaren arabera, eszena honek egitura baten kokapena, bereizketa eta aurreko etaparekin duen lotura erakusten ditu. Xehetasunak egitura-ikuskatzailean daude.",
  quiz: "Galdera: zein egitura agertu berri da eszenan eta zer dago haren kanpoaldean? Erantzun zure hitzekin.",
  "student-question": "Zure galdera eszena aktiboarekin lotuta dago. Erabili koloreak, geruzak eta etapa-aldaketa zure azalpenaren hiru froga gisa.",
};

const AI_DISABLED_MESSAGE = "Tutorearen IA desaktibatuta dago oraingoz. Erabili eszenaren azalpen estatikoak.";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function sanitizeContext(value: unknown) {
  if (!isRecord(value)) return null;
  const context = value as TutorContext;
  const text = (key: keyof TutorContext) => typeof context[key] === "string" ? String(context[key]).slice(0, 500) : null;
  const visible = Array.isArray(context.visibleStructures) ? context.visibleStructures.filter((item): item is string => typeof item === "string").slice(0, 30) : [];
  return {
    topic: text("topic"), stage: text("stage"), developmentalTime: text("developmentalTime"), selectedStructure: text("selectedStructure"), visibleStructures: visible,
    previousStage: text("previousStage"), nextStage: text("nextStage"), currentExplanation: text("currentExplanation"), relevantCourseSource: isRecord(context.relevantCourseSource) ? context.relevantCourseSource : null,
    studentMode: text("studentMode"), preferredLanguage: text("preferredLanguage"),
  };
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as { action?: unknown; question?: unknown; context?: unknown };
    const action = typeof body.action === "string" && body.action.length < 80 ? body.action : "explain";
    const question = typeof body.question === "string" ? body.question.trim().slice(0, 600) : "";
    const context = sanitizeContext(body.context);
    if (!context) return NextResponse.json({ answer: "Eszena-testuingurua falta da. Itxi tutorea eta berriro ireki." }, { status: 400 });
    if (process.env.AI_TUTOR_ENABLED !== "true") return NextResponse.json({ answer: AI_DISABLED_MESSAGE, disabled: true, fallback: true });
    const model = getTutorModel();
    if (!model) return NextResponse.json({ answer: FALLBACKS[action] ?? FALLBACKS.explain, fallback: true });
    const prompt = [
      "Azaldu eszena hau lehen mailako Medikuntzako ikasle bati, euskaraz.",
      "Erabili iturri akademikoaren terminologia nagusia. Ez asmatu iturrian ez dagoen ikastaroko daturik.",
      "Lehenengo esan zer ikusten den; ondoren lotu aurreko eta hurrengo etaparekin.",
      `Ekintza: ${action}`,
      question ? `Ikaslearen galdera: ${question}` : "",
      `Eszena-testuingurua: ${JSON.stringify(context)}`,
    ].filter(Boolean).join("\n");
    const result = await generateText({ model, system: "Egin iturrietan oinarritutako azalpen labur eta zehatza, osorik euskaraz. Ez erabili gaztelaniazko sinonimorik edo iturrian egiaztatu gabeko daturik.", prompt, abortSignal: AbortSignal.timeout(12000) });
    return NextResponse.json({ answer: result.text.slice(0, 1800), fallback: false });
  } catch {
    return NextResponse.json({ answer: "Tutorea ez dago erabilgarri orain. Eszenaren azalpen estatikoa mantendu da.", fallback: true }, { status: 200 });
  }
}
