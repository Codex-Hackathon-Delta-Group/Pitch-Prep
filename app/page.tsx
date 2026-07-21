"use client";

import { useEffect, useState } from "react";
import { ConceptReview } from "@/components/ConceptReview";
import { ErrorBanner } from "@/components/ErrorBanner";
import { GrillFlow } from "@/components/GrillFlow";
import { IdeaInput, AudienceSelect } from "@/components/IdeaInput";
import { LoadingState } from "@/components/LoadingState";
import { PitchKitView } from "@/components/PitchKitView";
import { ResearchResults } from "@/components/ResearchResults";
import { postJson } from "@/lib/client-api";
import type { AnalysisPackage, Audience, GrillAnswer, PitchKit, RefinementPackage } from "@/lib/contracts";
import { demoAnalysis, demoPitchKit, demoRefinement } from "@/lib/demo-fallback";
import { downloadPitchHtml } from "@/lib/html-export";

type Phase = "input" | "analyzing" | "research" | "questions" | "refining" | "concept" | "generating" | "results";
type FailedOperation = "analyze" | "refine" | "generate" | null;

export default function Home() {
  const [phase, setPhase] = useState<Phase>("input");
  const [idea, setIdea] = useState("");
  const [audience, setAudience] = useState<Audience>("hackathon_judges");
  const [analysis, setAnalysis] = useState<AnalysisPackage | null>(null);
  const [refinement, setRefinement] = useState<RefinementPackage | null>(null);
  const [kit, setKit] = useState<PitchKit | null>(null);
  const [selectedConcept, setSelectedConcept] = useState<"original" | "improved">("improved");
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answerDrafts, setAnswerDrafts] = useState<string[]>(["", "", ""]);
  const [usedRecommendations, setUsedRecommendations] = useState<boolean[]>([false, false, false]);
  const [fallbackActive, setFallbackActive] = useState(false);
  const [presenting, setPresenting] = useState(false);
  const [loadingStage, setLoadingStage] = useState(0);
  const [error, setError] = useState<{ message: string; operation: FailedOperation } | null>(null);
  const canFallback = process.env.NEXT_PUBLIC_ENABLE_DEMO_FALLBACK === "true";

  useEffect(() => {
    if (phase !== "analyzing") return;
    const timer = window.setInterval(() => setLoadingStage((stage) => Math.min(stage + 1, 3)), 3500);
    return () => window.clearInterval(timer);
  }, [phase]);

  const answers = (): GrillAnswer[] => analysis!.questions.map((question, index) => ({
    questionId: question.id,
    answer: answerDrafts[index].trim(),
    usedRecommendation: usedRecommendations[index],
  }));

  async function analyzeIdea() {
    setError(null); setLoadingStage(0); setPhase("analyzing"); setFallbackActive(false);
    try {
      const data = await postJson<AnalysisPackage>("/api/analyze", { idea: idea.trim(), audience });
      setAnalysis(data); setAnswerDrafts(data.questions.map(() => "")); setUsedRecommendations([false, false, false]); setPhase("research");
    } catch (caught) {
      if (canFallback) {
        setFallbackActive(true); setAnalysis(demoAnalysis); setAnswerDrafts(["", "", ""]); setUsedRecommendations([false, false, false]); setPhase("research"); return;
      }
      setPhase("input"); setError({ message: caught instanceof Error ? caught.message : "Research failed.", operation: "analyze" });
    }
  }

  async function refineConcept() {
    if (!analysis) return;
    if (fallbackActive) { setRefinement(demoRefinement); setPhase("concept"); return; }
    setError(null); setPhase("refining");
    try {
      const data = await postJson<RefinementPackage>("/api/refine", { idea: idea.trim(), audience, analysis, answers: answers() });
      setRefinement(data); setPhase("concept");
    } catch (caught) {
      setPhase("questions"); setError({ message: caught instanceof Error ? caught.message : "Refinement failed.", operation: "refine" });
    }
  }

  async function generatePitch(selectedConcept: "original" | "improved") {
    if (!analysis || !refinement) return;
    setSelectedConcept(selectedConcept);
    if (fallbackActive) { setKit({ ...demoPitchKit, selectedConcept }); setPhase("results"); return; }
    setError(null); setPhase("generating");
    try {
      const data = await postJson<PitchKit>("/api/generate", { idea: idea.trim(), audience, analysis, answers: answers(), refinement, selectedConcept });
      setKit(data); setPhase("results");
    } catch (caught) {
      setPhase("concept"); setError({ message: caught instanceof Error ? caught.message : "Pitch generation failed.", operation: "generate" });
    }
  }

  function loadFallback() {
    setError(null); setFallbackActive(true);
    if (error?.operation === "analyze") {
      setAnalysis(demoAnalysis); setAnswerDrafts(["", "", ""]); setUsedRecommendations([false, false, false]); setPhase("research");
    } else if (error?.operation === "refine") {
      setRefinement(demoRefinement); setPhase("concept");
    } else {
      setKit({ ...demoPitchKit, selectedConcept }); setPhase("results");
    }
  }

  function retry() {
    if (error?.operation === "analyze") void analyzeIdea();
    else if (error?.operation === "refine") void refineConcept();
    else if (error?.operation === "generate") void generatePitch(selectedConcept);
  }

  function continueQuestion() {
    if (questionIndex < 2) setQuestionIndex((index) => index + 1);
    else void refineConcept();
  }

  const showAudience = analysis && ["research", "questions", "refining", "concept"].includes(phase);

  return <>
    {!presenting && <header className="site-header"><a className="brand" href="#top" aria-label="Pitch Prep home"><span>PP</span> Pitch Prep</a><div className="step-indicator">{phase === "input" || phase === "analyzing" ? "Shape the input" : phase === "research" || phase === "questions" || phase === "refining" || phase === "concept" ? "Challenge the idea" : "Present the story"}</div>{showAudience ? <AudienceSelect value={audience} onChange={setAudience} disabled={phase === "refining"} /> : <span className="header-note">Evidence before confidence</span>}</header>}
    <main id="top" className={presenting ? "" : "app-shell"}>
      {!presenting && phase === "input" && <section className="landing"><div className="hero-copy"><p className="eyebrow">Idea clarity, on a deadline</p><h1>Make the idea<br /><em>worth pitching.</em></h1><p>Turn a rough thought into a research-backed, founder-approved pitch kit in five guided minutes.</p><div className="promise-row"><span>Research</span><i>→</i><span>Challenge</span><i>→</i><span>Approve</span><i>→</i><span>Present</span></div></div><div>{error && <ErrorBanner message={error.message} onRetry={retry} onFallback={loadFallback} canFallback={canFallback} />}<IdeaInput idea={idea} audience={audience} busy={false} onIdeaChange={setIdea} onAudienceChange={setAudience} onSubmit={analyzeIdea} /></div></section>}
      {!presenting && phase === "analyzing" && <LoadingState stage={loadingStage} />}
      {!presenting && phase === "research" && analysis && <ResearchResults analysis={analysis} fallback={fallbackActive} onContinue={() => { setQuestionIndex(0); setPhase("questions"); }} />}
      {!presenting && phase === "questions" && analysis && <>{error && <ErrorBanner message={error.message} onRetry={retry} onFallback={loadFallback} canFallback={canFallback} />}<GrillFlow question={analysis.questions[questionIndex]} index={questionIndex} answer={answerDrafts[questionIndex]} usedRecommendation={usedRecommendations[questionIndex]} onAnswer={(value, used) => { setAnswerDrafts((items) => items.map((item, index) => index === questionIndex ? value : item)); setUsedRecommendations((items) => items.map((item, index) => index === questionIndex ? used : item)); }} onContinue={continueQuestion} /></>}
      {!presenting && phase === "refining" && <LoadingState mode="refine" />}
      {!presenting && phase === "concept" && refinement && <>{error && <ErrorBanner message={error.message} onRetry={retry} onFallback={loadFallback} canFallback={canFallback} />}<ConceptReview refinement={refinement} fallback={fallbackActive} onChoose={generatePitch} /></>}
      {!presenting && phase === "generating" && <LoadingState mode="generate" />}
      {phase === "results" && kit && <PitchKitView kit={kit} presenting={presenting} onPresent={() => setPresenting(true)} onExit={() => setPresenting(false)} onSave={() => downloadPitchHtml(kit)} />}
    </main>
  </>;
}
