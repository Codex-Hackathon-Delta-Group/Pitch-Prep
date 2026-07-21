export const AUDIENCES = [
  "hackathon_judges",
  "investors",
  "partners",
  "first_customers",
] as const;

export type Audience = (typeof AUDIENCES)[number];
export type AlternativeKind = "direct" | "adjacent" | "workflow_alternative";
export type MarketConclusion = "different" | "crowded" | "insufficient_evidence";

export type Source = { title: string; url: string };
export type Alternative = {
  name: string;
  kind: AlternativeKind;
  description: string;
  intendedUser: string;
  overlap: string;
  remainingGap: string;
  source: Source;
};
export type GrillQuestion = {
  id: string;
  question: string;
  whyItMatters: string;
  addressedUnknown: string;
  recommendedAnswer: string;
  groundedTerms: string[];
};
export type ConceptSummary = {
  primaryUser: string;
  urgentProblem: string;
  solution: string;
  uniqueWedge: string;
  smallestPoc: string;
  advantage: string;
  nextValidationStep: string;
};
export type AnalysisPackage = {
  analysisId: string;
  analyzedAt: string;
  originalSummary: string;
  alternatives: Alternative[];
  marketConclusion: { value: MarketConclusion; explanation: string };
  questions: [GrillQuestion, GrillQuestion, GrillQuestion];
  risksAndAssumptions: string[];
};
export type RefinementPackage = {
  originalSummary: string;
  risksAndAssumptions: string[];
  improvedConcept: ConceptSummary;
  changesMade: Array<{ change: string; reason: string }>;
};
export type GrillAnswer = { questionId: string; answer: string; usedRecommendation: boolean };
export type PresentationSectionKey =
  | "hook" | "problem" | "alternatives" | "solution"
  | "differentiation" | "how_it_works" | "next_step";
export type PresentationSection = { key: PresentationSectionKey; heading: string; body: string };
export type CrowdQuestion = {
  id: string;
  category: "differentiation" | "evidence" | "feasibility" | "adoption" | "business_model" | "risk";
  question: string;
  whyAsked: string;
  suggestedAnswer: string;
  assumption: string;
  validationNeeded: string | null;
  groundedTerms: string[];
};
export type ValidationItem = { assumption: string; nextStep: string };
export type PitchKit = {
  title: string;
  tagline: string;
  selectedConcept: "original" | "improved";
  audience: Audience;
  spokenPitch: string;
  presentation: PresentationSection[];
  crowdQuestions: CrowdQuestion[];
  assumptionsAndValidation: ValidationItem[];
  alternatives: Alternative[];
  generatedAt: string;
  fallback: boolean;
};

export type AnalyzeIdeaRequest = { idea: string; audience: Audience };
export type RefineConceptRequest = {
  idea: string; audience: Audience; analysis: AnalysisPackage; answers: GrillAnswer[];
};
export type GeneratePitchRequest = RefineConceptRequest & {
  refinement: RefinementPackage; selectedConcept: "original" | "improved";
};

export type ErrorCode =
  | "VALIDATION_ERROR" | "CONFIGURATION_ERROR" | "RATE_LIMITED"
  | "RESEARCH_FAILED" | "PROVIDER_ERROR" | "OUTPUT_VALIDATION_ERROR";
