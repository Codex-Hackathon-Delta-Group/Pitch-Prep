# Pitch Prep — Finalized MVP Specification (`spec.md`)

> **What it is:** An AI tool that turns a project description into an audience- and duration-aware pitch, plus the specific tough questions that audience will ask and honest, prepared answers.
> **Status:** Canonical source of truth. Supersedes all prior origin documents for engineering purposes.
> **Origin references (do not delete):** `docs/Pitch Prep MVP Documentation.pdf`, `docs/Pitch-Prep-Task-Plan-PR-Branches.docx`.
> **Companion docs:** [`tasks.md`](./tasks.md) (PRs, lanes, DoD), [`file_plan.md`](./file_plan.md) (file layout, module boundaries).

## 1. Success Criterion (The Demo Loop)

The product is judged by one loop working end to end:

```text
Project description → Audience-aware pitch → Project-specific tough questions → Prepared answers
```

**Canonical acceptance demo:** Paste the Pitch Prep description into Pitch Prep itself, choose **Audience: Judge**, **Duration: 60 seconds**, **Questions: 5**, press Generate, and receive a readable 60-second pitch plus five questions that name concrete product concepts (e.g., output quality, differentiation, post-hackathon continuation) with usable, honest answers.

**Demo readiness gates:**
*   Paste → full result in one action.
*   Consistently valid output structure.
*   Questions mention ≥2 concrete input concepts.
*   Changing audience produces visibly different emphasis.
*   Changing 60s → 5m changes the underlying pitch structure.
*   Every text field is editable inline; regenerating one item never wipes edits elsewhere.
*   Output surfaces honest `assumptions` instead of fabricating unproven claims.

## 2. Scope & Architecture Decisions

This is a single-page, stateless MVP. The browser holds the draft and results; the server performs OpenAI calls without exposing the API key.

| ID | Decision | Status |
| :--- | :--- | :--- |
| **D-01** | **Tech Stack:** Next.js App Router, React, TypeScript, Tailwind CSS, OpenAI JavaScript SDK (Structured Outputs), server-side Responses API, local React state. No DB, auth, uploads, or streaming. *(Owner decision 2026-07-20, Option C.)* | Frozen |
| **D-02** | **API Design:** Full-package generation is one structured-output request; single beat/question regeneration is a separate request. *(Owner decision 2026-07-20, Option B.)* | Frozen |
| **D-03** | **MVP Features:** Inline editing, item regeneration, question count, responsive layout. (Copy, export, persistence, highlighting deferred to P1.) *(Owner decision 2026-07-20, Option A.)* | Frozen |
| **D-04** | **Persistence (None):** No database, ORM, cookies, or server-side conversation state; client state lives only in memory for the loaded page. *(Owner decision 2026-07-20.)* | Frozen |
| **D-05** | ~~Use a database and saved project history.~~ Superseded by the brief's explicit no-DB / no-history boundary (see D-04). *(Owner decision 2026-07-20.)* | Superseded |

**Data / DDL:** none. No database, ORM, migration, cookie/session, or server-side conversation state is permitted in MVP; the only persisted configuration is environment variables. This is an intentional boundary, not an omitted design — adding any persistence requires a spec re-review.

## 3. Phased PR Breakdown

Phases group PRs by real dependency order to avoid merge conflicts. PR definitions and DoD live in [`tasks.md`](./tasks.md).

| Phase | Name | PRs | Depends on (contract) |
| :--- | :--- | :--- | :--- |
| **PH1** | Scaffold & shared contracts | PR-01, PR-02 | — (establishes configs, `as const` enums, contracts, validation) |
| **PH2** | Producers (parallel) | PR-03, PR-04, PR-05 | PH1 contracts + validation |
| **PH3** | Results, regenerate & integration | PR-06, PR-07 | PR-04 (AI core), PR-05 (input UI) |
| **PH4** | Hardening & release | PR-08, PR-09, PR-10 | PR-07; PR-10 needs all P0 |

**Critical path to a demo:** PR-01 → PR-02 → PR-05 → PR-06 → PR-07 → PR-08 → PR-10, with PR-03 (generate route) and PR-04 (AI core) as parallel producers that must merge before PR-07. Only the *regenerate slice* of PR-06 and PR-09 (polish) are cuttable P1.

## 4. Frozen Domain Contract (Types & State)

Anything in this section changes **only** through a dedicated, re-reviewed contract PR. UI and API both depend on these verbatim.

### 4.1 Enums and Bounds

```ts
export const AUDIENCES = ["judge_investor", "manager", "client", "engineering"] as const;
export const DURATIONS = ["60_seconds", "5_minutes"] as const;
export const QUESTION_CATEGORIES = [
  "differentiation", "evidence", "feasibility", "technical_design", "risk", "adoption", "business_value",
] as const;
export const BEAT_KEYS = [
  "hook", "problem", "solution", "value", "closing",
  "context", "current_alternatives", "how_it_works", "differentiation", "evidence_or_impact", "risks_and_limitations", "next_steps",
] as const;

export type Audience = (typeof AUDIENCES)[number];
export type Duration = (typeof DURATIONS)[number];
export type QuestionCategory = (typeof QUESTION_CATEGORIES)[number];
export type BeatKey = (typeof BEAT_KEYS)[number];

// Enforced output word budgets per duration (counted across all beat text).
export const WORD_BUDGETS = {
  "60_seconds": { min: 110, max: 145 },
  "5_minutes": { min: 550, max: 700 },
} as const;

// Aggregate + per-field size caps. Request validation enforces these
// (oversized → 400 VALIDATION_ERROR); output validation enforces WORD_BUDGETS.
export const LIMITS = {
  projectDescription: { min: 30, max: 12_000 }, // Unicode code points
  beatText: 2_000,                              // chars per beat text
  questionField: 2_000,                         // chars per question / whyAsked / suggestedAnswer
  projectTerm: 100,                             // chars per term
  projectTermsPerQuestion: { min: 1, max: 3 },
  regeneratePayloadBytes: 64_000,               // serialized RegenerateRequest.currentPackage cap
} as const;
```

*   **Constraints:** `projectDescription` is trimmed and must be 30–12,000 Unicode code points (`LIMITS.projectDescription`). `questionCount` is an integer 3–7.
*   **Sequence Rules:**
    *   `60_seconds`: exactly `hook, problem, solution, value, closing`; total spoken words within `WORD_BUDGETS["60_seconds"]` (110–145).
    *   `5_minutes`: exactly `hook, context, problem, current_alternatives, solution, how_it_works, differentiation, evidence_or_impact, risks_and_limitations, next_steps, closing`; total within `WORD_BUDGETS["5_minutes"]` (550–700).
*   **Enforcement:** request validation rejects any field beyond `LIMITS` with `400 VALIDATION_ERROR`; generated-output validation rejects an out-of-sequence beat list or an out-of-budget total word count with `502 OUTPUT_VALIDATION_ERROR`.

### 4.2 Canonical JSON Shapes

```ts
export type PitchBeat = {
  key: BeatKey;
  label: string;
  text: string;
  purpose: string; // why this beat exists — fed back on regenerate to keep replacements coherent
};

export type ToughQuestion = {
  id: string; // Server-issued UUID
  category: QuestionCategory;
  question: string;
  whyAsked: string;
  suggestedAnswer: string;
  projectTerms: string[]; // 1-3 terms from the project description
};

export type PitchPackage = {
  title: string;
  pitch: PitchBeat[];
  toughQuestions: ToughQuestion[];
  assumptions: string[]; // honest, model-surfaced assumptions; empty array, never fabricated facts
};

export type GenerateRequest = {
  projectDescription: string;
  audience: Audience;
  duration: Duration;
  questionCount: number;
};

// Discriminated union ensures strict payload matching for item regeneration.
// currentPackage carries the user's inline edits so the replacement stays consistent.
// For a beat, the server resolves the target's `purpose` from currentPackage.pitch[key].
export type RegenerateRequest = GenerateRequest &
  ({ mode: "beat"; item: { key: BeatKey; text: string }; currentPackage: PitchPackage } |
   { mode: "question"; item: ToughQuestion; currentPackage: PitchPackage });
```

## 5. Frozen HTTP Contract

| Route | Request | Success | Failure |
| :--- | :--- | :--- | :--- |
| `POST /api/generate` | `GenerateRequest` | `200 { data: PitchPackage }` | `400 ApiError` validation; `500 ApiError` config; `502 ApiError` provider; `429 ApiError` rate limit. |
| `POST /api/regenerate` | `RegenerateRequest` | `200 { data: { mode: "beat"; item: PitchBeat } \| { mode: "question"; item: ToughQuestion } }` | Same status rules as generate. |

Oversized requests — any field beyond `LIMITS`, or a `RegenerateRequest.currentPackage` whose serialized size exceeds `LIMITS.regeneratePayloadBytes` — are rejected with `400 VALIDATION_ERROR` **before** any provider call, so an arbitrarily large body is never parsed into an OpenAI request.

### 5.1 Error Handling Types

```ts
export type ErrorCode =
  | "VALIDATION_ERROR"
  | "CONFIGURATION_ERROR"
  | "PROVIDER_ERROR"
  | "RATE_LIMITED"
  | "OUTPUT_VALIDATION_ERROR";

export type ApiError = { error: { code: ErrorCode; message: string } };
export type ApiSuccess<T> = { data: T };
```

*   **Security:** Stack traces are never sent to the client. The server logs only the `ErrorCode`, route, request ID, and provider status—**not** the `projectDescription` or generated content.

## 6. Generation Rules (Prompt & AI)

*   **Persona:** Expert presentation strategist and hostile-but-fair reviewer.
*   **Untrusted Input:** The `projectDescription` — and, during regeneration, the client-supplied `item` and `currentPackage` (which contain user-editable beats and answers) — are all delimited as data, never instructions. A prompt injection inside any of them must not override the developer/system instructions.
*   **No Invention:** The model must never invent users, revenue, benchmarks, test results, or security guarantees. If evidence is missing, state the limitation, add it to `PitchPackage.assumptions`, and propose a validation step.
*   **Question specificity:** Every `ToughQuestion` names the exact component/decision/claim it challenges via `projectTerms` (1–3 terms). Generic questions ("How will you scale?", "What about security?") are rejected.
*   **Audience Emphases:**
    *   `judge_investor`: Innovation, impact, differentiation.
    *   `manager`: Feasibility, ROI, ownership.
    *   `client`: Value, usability, reliability.
    *   `engineering`: Architecture, trade-offs, scalability.

## 7. Edge Cases Matrix (`E1...E13`)

Referenced by ID from PR DoDs in [`tasks.md`](./tasks.md).

| ID | Trigger / Requirement | Required Behavior |
| :--- | :--- | :--- |
| **E1** | Input `< 30` chars | Block before API call; message *"A more detailed description is needed."* (`400 VALIDATION_ERROR`) |
| **E2** | Input `> 12,000` chars | Block; message *"The description is too long for the MVP."* (`400 VALIDATION_ERROR`) |
| **E3** | Invalid configuration | Invalid enum, non-integer, or count out of range returns `400 VALIDATION_ERROR`. |
| **E4** | Audience/Duration/Count changed | Marks the current result stale. Shows *"Configuration changed. Generate again to update."* Does **not** auto-regenerate. |
| **E5** | Generate fails after existing result | Keeps the previous successful package visible until a replacement succeeds; shows error banner. |
| **E6** | Single-item regenerate fails | Leaves the original item text and all local edits completely untouched. |
| **E7** | User edits text inline | Updates local state only. Never invokes an API request. |
| **E8** | Provider output fails schema, beat sequence, or word budget | Caught as `502 OUTPUT_VALIDATION_ERROR`. No partial render or raw JSON is shown. |
| **E9** | API key or model missing | `500 CONFIGURATION_ERROR`. (Keys are server-side only; never expose to the client). |
| **E10** | Demo mode active | When `NEXT_PUBLIC_ENABLE_DEMO_FALLBACK=true` and an API call fails, load a labeled, pre-computed fallback object instead of failing. |
| **E11** | Ambiguous / thin input (≥30 chars but vague) | No blocking error. The model surfaces clear `PitchPackage.assumptions`, fabricates no data, and asks about the missing information in its questions. |
| **E12** | Oversized regeneration payload (`item`/`currentPackage` beyond `LIMITS`) | Rejected with `400 VALIDATION_ERROR` before any provider call; nothing is sent to OpenAI. |
| **E13** | Injection via an edited beat/answer in the regeneration context | `item`/`currentPackage` are delimited as data; developer instructions are unaffected (hostile-input test in PR-04). |
