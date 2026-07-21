"use client";

import type { PitchKit } from "@/lib/contracts";
import { countWords } from "@/lib/validation";

export function PitchKitView({ kit, presenting, onPresent, onExit, onSave }: { kit: PitchKit; presenting: boolean; onPresent: () => void; onExit: () => void; onSave: () => void }) {
  if (presenting) return <div className="present-mode">
    {kit.fallback && <div className="fallback-notice present-fallback">Demo example — not live research</div>}
    <button className="exit-present" onClick={onExit}>Exit presentation</button>
    <header className="present-hero"><p>Pitch Prep presentation</p><h1>{kit.title}</h1><div>{kit.tagline}</div></header>
    {kit.presentation.map((section, index) => <section key={section.key} className="present-section"><span>{String(index + 1).padStart(2, "0")}</span><h2>{section.heading}</h2><p>{section.body}</p>{section.key === "alternatives" && kit.alternatives.length > 0 && <div className="present-links">{kit.alternatives.map((item) => <a key={item.source.url} href={item.source.url} target="_blank" rel="noopener noreferrer">{item.name} ↗</a>)}</div>}</section>)}
  </div>;

  return <section className="results-shell">
    <div className="results-hero"><div><p className="eyebrow">05 · Your pitch kit</p><h1>{kit.title}</h1><p>{kit.tagline}</p></div><div className="button-group"><button className="button secondary" onClick={onSave}>Save HTML</button><button className="button primary" onClick={onPresent}>Present <span aria-hidden="true">↗</span></button></div></div>
    {kit.fallback && <div className="fallback-notice">Demo example — not live research</div>}
    <section className="pitch-card"><div><span>60-second pitch</span><span>{countWords(kit.spokenPitch)} words</span></div><blockquote>{kit.spokenPitch}</blockquote></section>
    <section><p className="eyebrow">The one-page story</p><div className="presentation-preview">{kit.presentation.map((section, index) => <article key={section.key}><span>{String(index + 1).padStart(2, "0")}</span><h3>{section.heading}</h3><p>{section.body}</p></article>)}</div></section>
    <section><p className="eyebrow">Prepare for the room</p><h2>Five questions they’re likely to ask</h2><div className="qa-list">{kit.crowdQuestions.map((item, index) => <details key={item.id} open={index === 0}><summary><span>{item.category.replace("_", " ")}</span>{item.question}</summary><div className="qa-answer"><p><strong>Why they’ll ask</strong>{item.whyAsked}</p><p><strong>Suggested answer</strong>{item.suggestedAnswer}</p><p><strong>Underlying assumption</strong>{item.assumption}</p>{item.validationNeeded && <p><strong>Validation needed</strong>{item.validationNeeded}</p>}</div></details>)}</div></section>
    <section><p className="eyebrow">Honest next steps</p><h2>Assumptions to validate</h2><div className="validation-grid">{kit.assumptionsAndValidation.map((item) => <article key={`${item.assumption}-${item.nextStep}`}><p>{item.assumption}</p><span>Validate next</span><p>{item.nextStep}</p></article>)}</div></section>
    <p className="disclosure">Research is a starting point, not legal, investment, medical, patent, or regulatory advice. Verify important claims and source details.</p>
  </section>;
}
