import type { Stage, Topic } from "@/content/types";

type StageInfo = { summary: string; changes: string[]; relations: string[]; caution?: string };

export default function ExplanationPanel({ stage, info, mode, topic }: { stage: Stage; info: StageInfo; mode: "IKUSI" | "ULERTU" | "IKASI"; topic: Topic }) {
  return (
    <section className="learning-panels" aria-label="Eszenaren azalpena">
      <div className="learning-panel">
        <details open={mode !== "IKASI"}>
          <summary>Zer gertatzen ari da?</summary>
          <p>{info.summary}</p>
        </details>
      </div>
      <div className="learning-panel">
        <details open={mode === "ULERTU"}>
          <summary>Aurretik → Orain</summary>
          <ul className="change-list">{info.changes.map((change) => <li key={change}>{change}</li>)}</ul>
        </details>
      </div>
      <div className="learning-panel">
        <details open={mode === "IKUSI"}>
          <summary>Egitura berriak</summary>
          <ul className="change-list">{stage.structures.map((structure) => <li key={structure}>{topic.structures.find((item) => item.id === structure)?.label.primary ?? structure.replaceAll("-", " ")}</li>)}</ul>
        </details>
      </div>
      <div className="learning-panel">
        <details>
          <summary>Harremanak</summary>
          <ul className="change-list">{info.relations.map((relation) => <li key={relation}>{relation}</li>)}</ul>
        </details>
      </div>
      {info.caution && <div className="learning-panel">
        <details>
          <summary>Kontuz</summary>
          <p>{info.caution}</p>
        </details>
      </div>}
    </section>
  );
}
