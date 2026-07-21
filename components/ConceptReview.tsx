import type { RefinementPackage } from "@/lib/contracts";

const conceptFields = [
  ["Primary user", "primaryUser"], ["Urgent problem", "urgentProblem"], ["Solution", "solution"],
  ["Unique wedge", "uniqueWedge"], ["Smallest credible POC", "smallestPoc"],
  ["Why it may win", "advantage"], ["Immediate validation", "nextValidationStep"],
] as const;

export function ConceptReview({ refinement, fallback, onChoose }: { refinement: RefinementPackage; fallback: boolean; onChoose: (choice: "original" | "improved") => void }) {
  return <section className="flow-section">
    <p className="eyebrow">04 · Your decision</p><h2>Same intent. Sharper starting point.</h2>
    <p className="lead">The recommendation stays separate until you choose. Both paths keep your factual answers and visible assumptions.</p>
    {fallback && <div className="fallback-notice">Demo example — not live research</div>}
    <div className="concept-grid">
      <article className="concept-card original"><span>Your original idea</span><h3>The idea you submitted</h3><p>{refinement.originalSummary}</p><button className="button secondary" onClick={() => onChoose("original")}>Keep my original concept</button></article>
      <article className="concept-card improved"><span>Recommended improved concept</span><h3>A narrower, testable version</h3><dl>{conceptFields.map(([label, key]) => <div key={key}><dt>{label}</dt><dd>{refinement.improvedConcept[key]}</dd></div>)}</dl><button className="button primary" onClick={() => onChoose("improved")}>Approve improved concept <span aria-hidden="true">→</span></button></article>
    </div>
    <div className="review-grid"><div><h3>What changed—and why</h3>{refinement.changesMade.map((item) => <article className="change-item" key={item.change}><strong>{item.change}</strong><p>{item.reason}</p></article>)}</div><div><h3>Risks and missing assumptions</h3><ul className="risk-list">{refinement.risksAndAssumptions.map((risk) => <li key={risk}>{risk}</li>)}</ul></div></div>
  </section>;
}
