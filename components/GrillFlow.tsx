import type { GrillQuestion } from "@/lib/contracts";

type Props = {
  question: GrillQuestion;
  index: number;
  answer: string;
  usedRecommendation: boolean;
  onAnswer: (value: string, usedRecommendation: boolean) => void;
  onContinue: () => void;
};

export function GrillFlow({ question, index, answer, usedRecommendation, onAnswer, onContinue }: Props) {
  const valid = answer.trim().length > 0 && answer.trim().length <= 2000;
  return <section className="question-shell" aria-labelledby="question-title">
    <div className="question-progress"><span>Question {index + 1} of 3</span><div>{[0, 1, 2].map((step) => <i key={step} className={step <= index ? "filled" : ""} />)}</div></div>
    <p className="eyebrow">A decision worth making</p>
    <h2 id="question-title">{question.question}</h2>
    <div className="question-context"><div><span>Why it matters</span><p>{question.whyItMatters}</p></div><div><span>Unknown addressed</span><p>{question.addressedUnknown}</p></div></div>
    <div className="recommendation">
      <div><span>Our recommendation</span><em>Suggestion, not evidence</em></div>
      <p>{question.recommendedAnswer}</p>
      <button className="button secondary" onClick={() => onAnswer(question.recommendedAnswer, true)}>Use recommendation</button>
    </div>
    <label className="field"><span>Your answer</span><textarea rows={5} maxLength={2000} value={answer} onChange={(event) => onAnswer(event.target.value, false)} placeholder="Use, edit, or replace the recommendation…" /></label>
    <div className="input-meta"><span>{usedRecommendation ? "Using the recommendation—you can still edit it." : "Your answer will shape the concept recommendation."}</span><span>{answer.length} / 2,000</span></div>
    <div className="footer-action"><span /><button className="button primary" disabled={!valid} onClick={onContinue}>{index === 2 ? "Review the stronger concept" : "Continue"} <span aria-hidden="true">→</span></button></div>
  </section>;
}
