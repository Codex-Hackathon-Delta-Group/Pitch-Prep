import { z } from "zod";
import { AUDIENCES } from "./contracts";

const strict = <T extends z.ZodRawShape>(shape: T) => z.strictObject(shape);
const bounded = (min: number, max: number) => z.string().trim().min(min).max(max);
const id = bounded(1, 100);
const httpsUrl = z.string().url().refine((value) => value.startsWith("https://"), "Source URLs must use HTTPS");

export const audienceSchema = z.enum(AUDIENCES);
export const alternativeSchema = strict({
  name: bounded(1, 120),
  kind: z.enum(["direct", "adjacent", "workflow_alternative"]),
  description: bounded(1, 600),
  intendedUser: bounded(1, 300),
  overlap: bounded(1, 500),
  remainingGap: bounded(1, 500),
  source: strict({ title: bounded(1, 200), url: httpsUrl }),
});
export const questionSchema = strict({
  id,
  question: bounded(1, 500),
  whyItMatters: bounded(1, 600),
  addressedUnknown: bounded(1, 400),
  recommendedAnswer: bounded(1, 1000),
  groundedTerms: z.array(bounded(1, 80)).min(1).max(3),
}).superRefine((question, ctx) => {
  if (!question.groundedTerms.some((term) => question.question.toLocaleLowerCase().includes(term.toLocaleLowerCase()))) {
    ctx.addIssue({ code: "custom", message: "A grounded term must appear in the question" });
  }
});

const uniqueBy = <T>(items: T[], key: (item: T) => string) => new Set(items.map(key)).size === items.length;

export const analysisSchema = strict({
  analysisId: id,
  analyzedAt: z.string().datetime(),
  originalSummary: bounded(1, 1500),
  alternatives: z.array(alternativeSchema).max(5),
  marketConclusion: strict({
    value: z.enum(["different", "crowded", "insufficient_evidence"]),
    explanation: bounded(1, 800),
  }),
  questions: z.array(questionSchema).length(3),
  risksAndAssumptions: z.array(bounded(1, 600)).max(12),
}).superRefine((data, ctx) => {
  if (!uniqueBy(data.questions, (q) => q.id)) ctx.addIssue({ code: "custom", message: "Question IDs must be unique" });
  const names = data.alternatives.map((a) => a.name.toLocaleLowerCase());
  const urls = data.alternatives.map((a) => { const url = new URL(a.source.url); return `${url.hostname.toLowerCase()}${url.pathname.replace(/\/$/, "")}`; });
  if (new Set(names).size !== names.length || new Set(urls).size !== urls.length) ctx.addIssue({ code: "custom", message: "Alternatives must be unique" });
});

export const answerSchema = strict({
  questionId: id,
  answer: bounded(1, 2000),
  usedRecommendation: z.boolean(),
});
export const refinementSchema = strict({
  originalSummary: bounded(1, 1500),
  risksAndAssumptions: z.array(bounded(1, 600)).max(12),
  improvedConcept: strict({
    primaryUser: bounded(1, 500), urgentProblem: bounded(1, 700), solution: bounded(1, 900),
    uniqueWedge: bounded(1, 700), smallestPoc: bounded(1, 700), advantage: bounded(1, 700),
    nextValidationStep: bounded(1, 700),
  }),
  changesMade: z.array(strict({ change: bounded(1, 500), reason: bounded(1, 600) })).min(1).max(8),
});

export const analyzeRequestSchema = strict({ idea: bounded(50, 12000), audience: audienceSchema });
export const refineRequestSchema = strict({
  idea: bounded(50, 12000), audience: audienceSchema, analysis: analysisSchema, answers: z.array(answerSchema).length(3),
}).superRefine((data, ctx) => validateAnswerMapping(data.analysis.questions, data.answers, ctx));

const presentationKeys = ["hook", "problem", "alternatives", "solution", "differentiation", "how_it_works", "next_step"] as const;
export const pitchKitSchema = strict({
  title: bounded(1, 150), tagline: bounded(1, 250), selectedConcept: z.enum(["original", "improved"]),
  audience: audienceSchema, spokenPitch: bounded(1, 3000),
  presentation: z.array(strict({ key: z.enum(presentationKeys), heading: bounded(1, 150), body: bounded(1, 1000) })).length(7),
  crowdQuestions: z.array(strict({
    id, category: z.enum(["differentiation", "evidence", "feasibility", "adoption", "business_model", "risk"]),
    question: bounded(1, 500), whyAsked: bounded(1, 600), suggestedAnswer: bounded(1, 1000),
    assumption: bounded(1, 600), validationNeeded: z.string().trim().min(1).max(600).nullable(),
    groundedTerms: z.array(bounded(1, 80)).min(1).max(3),
  })).length(5),
  assumptionsAndValidation: z.array(strict({ assumption: bounded(1, 600), nextStep: bounded(1, 600) })).min(1).max(12),
  alternatives: z.array(alternativeSchema).max(5), generatedAt: z.string().datetime(), fallback: z.boolean(),
}).superRefine((data, ctx) => {
  if (countWords(data.spokenPitch) < 120 || countWords(data.spokenPitch) > 140) ctx.addIssue({ code: "custom", message: "Spoken pitch must contain 120–140 words" });
  if (data.presentation.some((section, index) => section.key !== presentationKeys[index])) ctx.addIssue({ code: "custom", message: "Presentation sections are out of order" });
  if (!uniqueBy(data.crowdQuestions, (q) => q.id)) ctx.addIssue({ code: "custom", message: "Crowd question IDs must be unique" });
  const grounded = data.crowdQuestions.filter((q) => q.groundedTerms.some((term) => q.question.toLowerCase().includes(term.toLowerCase()))).length;
  if (grounded < 4) ctx.addIssue({ code: "custom", message: "At least four crowd questions must be grounded" });
});

export const generateRequestSchema = refineRequestSchema.safeExtend({
  refinement: refinementSchema,
  selectedConcept: z.enum(["original", "improved"]),
});

function validateAnswerMapping(questions: Array<{ id: string }>, answers: Array<{ questionId: string }>, ctx: z.RefinementCtx) {
  const expected = new Set(questions.map((q) => q.id));
  const actual = answers.map((a) => a.questionId);
  if (new Set(actual).size !== 3 || actual.some((value) => !expected.has(value))) {
    ctx.addIssue({ code: "custom", message: "Answers must map one-to-one to the three questions" });
  }
}

export function countWords(value: string) {
  return value.trim().split(/\s+/u).filter(Boolean).length;
}
