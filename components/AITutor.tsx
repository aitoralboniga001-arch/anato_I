"use client";

import { FormEvent, useMemo, useState } from "react";

type TutorContext = {
  topic: string;
  stage: string;
  developmentalTime: string;
  selectedStructure: string | null;
  visibleStructures: string[];
  previousStage: string | null;
  nextStage: string | null;
  currentExplanation: string;
  relevantCourseSource: { file: string; section: string };
  studentMode: string;
  preferredLanguage: string;
};

const actions = [
  ["Azaldu hau", "explain"],
  ["Zer aldatu da?", "change"],
  ["Zergatik?", "why"],
  ["Errazago", "simple"],
  ["Sakonago", "deep"],
  ["Galdetu nazazu", "quiz"],
] as const;

export default function AITutor({ context, onClose }: { context: TutorContext; onClose: () => void }) {
  const initial = useMemo(() => `Une honetan ${context.stage} ikusten ari zara. Egin klik ekintza batean eszena honi buruz galdetzeko.`, [context.stage]);
  const [messages, setMessages] = useState<Array<{ role: "assistant" | "user"; text: string }>>([{ role: "assistant", text: initial }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const ask = async (action: string, question?: string) => {
    if (loading) return;
    setLoading(true);
    if (question) setMessages((current) => [...current, { role: "user", text: question }]);
    try {
      const response = await fetch("/api/tutor", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action, question, context }) });
      const payload = await response.json() as { answer?: string };
      setMessages((current) => [...current, { role: "assistant", text: payload.answer ?? "Une honetan ezin dut erantzuna prestatu. Erabili eszenaren azalpen estatikoa." }]);
    } catch {
      setMessages((current) => [...current, { role: "assistant", text: "Tutorea ez dago erabilgarri orain. Eszenaren azalpen estatikoa mantendu da." }]);
    } finally {
      setLoading(false);
    }
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const question = input.trim();
    if (!question) return;
    setInput("");
    void ask("student-question", question);
  };

  return (
    <section className="tutor-drawer" aria-label="AI tutorea">
      <header className="tutor-header"><div><strong>Eszenaren tutorea</strong><span>{context.selectedStructure ? `Aukeratua: ${context.selectedStructure}` : "Eszena osoa"} · {context.stage}</span></div><button className="icon-button" type="button" onClick={onClose} aria-label="Itxi tutorea">×</button></header>
      <div className="tutor-body">
        {messages.map((message, index) => <div className={`tutor-message ${message.role === "user" ? "user" : ""}`} key={`${message.role}-${index}`}>{message.text}</div>)}
        {loading && <div className="tutor-message" aria-live="polite">Eszena irakurtzen...</div>}
        <div className="tutor-actions">{actions.map(([label, action]) => <button className="tutor-action" type="button" key={action} onClick={() => void ask(action)} disabled={loading}>{label}</button>)}</div>
      </div>
      <form className="tutor-form" onSubmit={submit}><label className="sr-only" htmlFor="tutor-question">Zure galdera</label><textarea id="tutor-question" value={input} onChange={(event) => setInput(event.target.value)} placeholder="Idatzi zure azalpena edo galdera..." maxLength={600} /><button type="submit" disabled={loading || !input.trim()}>Bidali</button></form>
    </section>
  );
}
