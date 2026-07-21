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
| **D-01** | **Tech Stack:** Next.js App Router, React, TypeScript, Tailwind CSS, OpenAI JavaScript SDK (Structured Outputs), and local React state. | Frozen |
| **D-02** | **API Design:** Full-package generation is one request; single beat/question regeneration is a separate request. | Frozen |
| **D-03** | **MVP Features:** Inline editing, item regeneration, question count, responsive layout. (Copy, export, persistence, and highlighting are deferred). | Frozen |
| **D-04** | **Persistence (None):** No database, ORM, cookies, or server-side conversation state. Client state exists only in memory for the loaded page. | Frozen |

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
```

*   **Constraints:** `projectDescription` is trimmed and must be 30–12,000 Unicode code points. `questionCount` is an integer 3–7.
*   **Sequence Rules:**
    *   `60_seconds`: Returns exactly `hook, problem, solution, value, closing`. Target length ≈ 110–145 spoken words.
    *   `5_minutes`: Returns exactly `hook, context, problem, current_alternatives, solution, how_it_works, differentiation, evidence_or_impact, risks_and_limitations, next_steps, closing`. Target length ≈ 550–700 spoken words.

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
*   **Untrusted Input:** The `projectDescription` is treated as content, not instructions. Prompt injections must not override the system instructions.
*   **No Invention:** The model must never invent users, revenue, benchmarks, test results, or security guarantees. If evidence is missing, state the limitation, add it to `PitchPackage.assumptions`, and propose a validation step.
*   **Question specificity:** Every `ToughQuestion` names the exact component/decision/claim it challenges via `projectTerms` (1–3 terms). Generic questions ("How will you scale?", "What about security?") are rejected.
*   **Audience Emphases:**
    *   `judge_investor`: Innovation, impact, differentiation.
    *   `manager`: Feasibility, ROI, ownership.
    *   `client`: Value, usability, reliability.
    *   `engineering`: Architecture, trade-offs, scalability.

## 7. Edge Cases Matrix (`E1...E11`)

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
| **E8** | Provider output fails schema | Caught as `502 OUTPUT_VALIDATION_ERROR`. No partial render or raw JSON is shown. |
| **E9** | API key or model missing | `500 CONFIGURATION_ERROR`. (Keys are server-side only; never expose to the client). |
| **E10** | Demo mode active | When `NEXT_PUBLIC_ENABLE_DEMO_FALLBACK=true` and an API call fails, load a labeled, pre-computed fallback object instead of failing. |
| **E11** | Ambiguous / thin input (≥30 chars but vague) | No blocking error. The model surfaces clear `PitchPackage.assumptions`, fabricates no data, and asks about the missing information in its questions. |
