const stages = [
  "Understanding the idea",
  "Looking for comparable solutions",
  "Finding gaps and assumptions",
  "Preparing the questions you may not know to ask",
];

export function LoadingState({ mode = "analysis", stage = 0 }: { mode?: "analysis" | "refine" | "generate"; stage?: number }) {
  const title = mode === "refine" ? "Strengthening your concept" : mode === "generate" ? "Building your pitch kit" : stages[Math.min(stage, stages.length - 1)];
  return <section className="loading-card" role="status" aria-live="polite">
    <div className="orbit" aria-hidden="true"><span /></div>
    <p className="eyebrow">Working with care</p>
    <h2>{title}</h2>
    <p>{mode === "analysis" ? "We’re looking for evidence and useful uncertainty—not filling space with confident guesses." : "Keeping your decisions, evidence, and assumptions visibly separate."}</p>
    {mode === "analysis" && <ol className="stage-list">{stages.map((item, index) => <li key={item} className={index <= stage ? "active" : ""}>{item}</li>)}</ol>}
  </section>;
}
