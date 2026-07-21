import type { AnalysisPackage } from "@/lib/contracts";

const conclusionLabels = { different: "A supportable gap may exist", crowded: "Close alternatives exist", insufficient_evidence: "More evidence is needed" };

export function ResearchResults({ analysis, fallback, onContinue }: { analysis: AnalysisPackage; fallback: boolean; onContinue: () => void }) {
  return <section className="flow-section">
    <div className="section-heading"><div><p className="eyebrow">02 · Research review</p><h2>What the landscape reveals</h2></div><span className={`conclusion ${analysis.marketConclusion.value}`}>{conclusionLabels[analysis.marketConclusion.value]}</span></div>
    {fallback && <div className="fallback-notice">Demo example — not live research</div>}
    <div className="summary-card"><span>Your idea, faithfully summarized</span><p>{analysis.originalSummary}</p></div>
    <div className="market-note"><strong>{conclusionLabels[analysis.marketConclusion.value]}</strong><p>{analysis.marketConclusion.explanation}</p></div>
    <h3>Comparable approaches</h3>
    {analysis.alternatives.length ? <div className="alternatives-grid">{analysis.alternatives.map((item) => <article className="alternative-card" key={`${item.name}-${item.source.url}`}>
      <div><span className="kind">{item.kind.replaceAll("_", " ")}</span><h4>{item.name}</h4></div>
      <p>{item.description}</p><dl><dt>Built for</dt><dd>{item.intendedUser}</dd><dt>Overlap</dt><dd>{item.overlap}</dd><dt>Remaining gap</dt><dd>{item.remainingGap}</dd></dl>
      <a href={item.source.url} target="_blank" rel="noopener noreferrer">{item.source.title}<span aria-hidden="true"> ↗</span></a>
    </article>)}</div> : <div className="empty-card"><strong>No credible alternatives are shown.</strong><p>This is not a “no competitors” claim. The available evidence was insufficient, so verification remains a next step.</p></div>}
    <div className="footer-action"><p>Next: three decisions chosen from the biggest unknowns.</p><button className="button primary" onClick={onContinue}>Answer three questions <span aria-hidden="true">→</span></button></div>
  </section>;
}
