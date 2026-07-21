import type { AnalysisPackage, PitchKit, RefinementPackage } from "./contracts";

export const demoAnalysis: AnalysisPackage = {
  analysisId: "demo-pitch-prep",
  analyzedAt: "2026-07-21T00:00:00.000Z",
  originalSummary: "Pitch Prep helps non-technical founders research comparable solutions, uncover gaps, improve an early idea with guided questions, and turn an approved concept into a presentation-ready pitch kit.",
  alternatives: [],
  marketConclusion: {
    value: "insufficient_evidence",
    explanation: "This fixed demo does not include live research. Comparable workflows still need to be verified before making a differentiation claim.",
  },
  questions: [
    {
      id: "demo-user",
      question: "Which non-technical founders need Pitch Prep urgently enough to use it this week?",
      whyItMatters: "A narrow first user makes the workflow, language, and validation test concrete.",
      addressedUnknown: "The first user and urgent moment are broad.",
      recommendedAnswer: "Start with hackathon participants who have a rough idea and must pitch judges within 24 hours.",
      groundedTerms: ["Pitch Prep", "non-technical founders"],
    },
    {
      id: "demo-workaround",
      question: "What part of the current research and pitch workflow should Pitch Prep replace first?",
      whyItMatters: "The sharpest wedge should remove a painful workflow, not merely add more generated text.",
      addressedUnknown: "The most valuable current workaround is unverified.",
      recommendedAnswer: "Replace the repeated loop of competitor searching, generic AI prompting, and manually assembling a one-page pitch.",
      groundedTerms: ["Pitch Prep", "research"],
    },
    {
      id: "demo-proof",
      question: "What evidence would show that the 60-second pitch is genuinely better?",
      whyItMatters: "A credible success measure keeps polished output from being mistaken for validated value.",
      addressedUnknown: "No quality or time-saving evidence exists yet.",
      recommendedAnswer: "Test five founders and compare time-to-first-pitch plus judge ratings for clarity before and after using the product.",
      groundedTerms: ["60-second pitch"],
    },
  ],
  risksAndAssumptions: [
    "Founders will trust source-linked AI research as a useful starting point.",
    "Three questions can materially improve a rough concept without overwhelming the user.",
    "A one-page presentation is sufficient for the first target setting.",
  ],
};

export const demoRefinement: RefinementPackage = {
  originalSummary: demoAnalysis.originalSummary,
  risksAndAssumptions: demoAnalysis.risksAndAssumptions,
  improvedConcept: {
    primaryUser: "Non-technical hackathon participants preparing to pitch within 24 hours.",
    urgentProblem: "They lose scarce build time switching between competitor searches, generic prompts, and slide editing while important assumptions remain hidden.",
    solution: "A guided five-minute flow that researches alternatives, asks three idea-specific questions, requests approval, and produces a source-aware pitch kit.",
    uniqueWedge: "The visible, approval-based transformation from rough idea to evidence-aware concept—not presentation generation alone.",
    smallestPoc: "Text input, source-linked research, three questions, concept choice, a spoken pitch, one-page presentation, and five judge Q&As.",
    advantage: "It combines research, product challenge, founder control, and immediate presentation output in one focused workflow.",
    nextValidationStep: "Observe five hackathon participants and compare preparation time and judge-rated clarity with their current workflow.",
  },
  changesMade: [
    { change: "Narrowed the first user to time-constrained hackathon participants.", reason: "A specific urgent moment makes the POC and pitch testable." },
    { change: "Made explicit approval the center of the workflow.", reason: "The product should challenge the idea without taking ownership from the founder." },
    { change: "Defined a measurable first validation test.", reason: "Presentation quality and time saved are assumptions until observed." },
  ],
};

export const demoPitchKit: PitchKit = {
  title: "Pitch Prep",
  tagline: "From rough idea to an evidence-aware pitch kit in five guided minutes.",
  selectedConcept: "improved",
  audience: "hackathon_judges",
  spokenPitch: "A promising hackathon idea can disappear under hours of competitor searches, generic AI prompts, and slide editing. Non-technical founders often reach judging with polished words but unanswered assumptions. Pitch Prep turns that scattered workflow into one guided conversation. It researches comparable solutions with source links, identifies what the founder may have missed, and asks three specific questions. Then it shows the original idea beside a stronger recommendation and waits for explicit approval. Only then does it create a 60-second pitch, a one-page presentation, and five honest answers for likely judge questions. Our wedge is not another slide generator; it is the visible, evidence-aware improvement of the idea while the founder keeps control. The next step is testing five hackathon teams for preparation time and judge-rated clarity.",
  presentation: [
    { key: "hook", heading: "Good ideas get lost before judging", body: "Hackathon founders spend their final hours searching, prompting, and formatting instead of sharpening the idea." },
    { key: "problem", heading: "Polish can hide unanswered assumptions", body: "Non-technical founders may not know which competitors, user decisions, feasibility risks, or evidence gaps a judge will challenge." },
    { key: "alternatives", heading: "Today’s workflow is fragmented", body: "Search engines, general AI chats, and slide tools each solve a piece. The founder still has to connect the evidence and decide what should change." },
    { key: "solution", heading: "One guided idea-to-pitch flow", body: "Pitch Prep researches, asks three focused questions, proposes an improvement, waits for approval, and builds a complete pitch kit." },
    { key: "differentiation", heading: "Challenge without hijacking", body: "The memorable moment is the side-by-side transformation. Recommendations stay visibly separate until the founder chooses." },
    { key: "how_it_works", heading: "Research → questions → approval → pitch", body: "Every stage produces structured, reusable output with sources, assumptions, and validation needs—not unexplained confidence." },
    { key: "next_step", heading: "Validate clarity and time saved", body: "Observe five hackathon teams, compare preparation time, and ask judges to rate pitch clarity before and after Pitch Prep." },
  ],
  crowdQuestions: [
    { id: "demo-q1", category: "differentiation", question: "How is Pitch Prep different from prompting a general AI chatbot?", whyAsked: "Judges will compare the product with the fastest familiar workaround.", suggestedAnswer: "Pitch Prep owns a constrained workflow: live source-linked research, three grounded questions, an explicit approval gate, and deterministic presentation export.", assumption: "The integrated workflow is meaningfully easier than a sequence of manual prompts.", validationNeeded: "Compare completion time and output quality with five users using their current chatbot workflow.", groundedTerms: ["Pitch Prep"] },
    { id: "demo-q2", category: "evidence", question: "What proves the 60-second pitch is better?", whyAsked: "Generated polish is not evidence of communication quality.", suggestedAnswer: "Nothing proves it yet. The POC proposes a direct before-and-after clarity test with judges.", assumption: "The guided workflow improves clarity.", validationNeeded: "Blind-rate original and generated pitches with hackathon judges.", groundedTerms: ["60-second pitch"] },
    { id: "demo-q3", category: "feasibility", question: "Can live research finish inside the five-minute Pitch Prep promise?", whyAsked: "Web search and structured generation can be slow or fail.", suggestedAnswer: "The experience has staged loading, retries, strict output checks, and a clearly labeled demo fallback; latency still needs measurement.", assumption: "Typical live calls fit the target latency.", validationNeeded: "Record p50 and p95 completion time across representative ideas.", groundedTerms: ["Pitch Prep", "live research"] },
    { id: "demo-q4", category: "risk", question: "How does Pitch Prep avoid inventing competitor claims?", whyAsked: "Research credibility is central to the product promise.", suggestedAnswer: "Named alternatives require HTTPS sources, primary sources are preferred, weak matches are omitted, and insufficient evidence is an allowed conclusion.", assumption: "Schema and prompt controls reduce unsupported claims enough for a useful starting point.", validationNeeded: "Manually audit sources and summaries across a benchmark set.", groundedTerms: ["Pitch Prep", "competitor"] },
    { id: "demo-q5", category: "adoption", question: "Will hackathon teams answer three questions under time pressure?", whyAsked: "Even useful friction may be rejected near a deadline.", suggestedAnswer: "The questions appear one at a time with editable recommendations, but the interaction cost must be observed.", assumption: "Three focused decisions feel valuable rather than burdensome.", validationNeeded: "Measure completion and abandonment with five live teams.", groundedTerms: ["hackathon teams", "three questions"] },
  ],
  assumptionsAndValidation: [
    { assumption: "The guided flow improves pitch clarity.", nextStep: "Blind-rate before-and-after pitches with judges." },
    { assumption: "Founders value source-linked research enough to trust the workflow.", nextStep: "Interview users after they inspect and verify the returned sources." },
    { assumption: "The full live flow completes within five minutes.", nextStep: "Measure end-to-end latency across representative ideas." },
  ],
  alternatives: [],
  generatedAt: "2026-07-21T00:00:00.000Z",
  fallback: true,
};
