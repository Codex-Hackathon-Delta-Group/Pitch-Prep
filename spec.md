# Pitch-Prep — MVP Specification

**Planning baseline:** `work` branch at the repository state inspected 2026-07-20. The repository contains only the product brief; there is no application, reusable implementation, remote-tracking baseline, or historical branch to restore. The PDF is the authoritative product source. **Salvage decision:** there is no donor code and no code base to preserve; build a clean Next.js application.

## 1. Scope and decisions

Pitch-Prep turns a pasted project description into an audience- and duration-specific pitch plus difficult, project-specific questions and candid answers. It is a single-page, stateless MVP: the browser holds the draft and results; the server performs OpenAI calls without exposing the API key.

| ID | Decision | Status |
| --- | --- | --- |
| D-01 | Next.js App Router, React, TypeScript, Tailwind CSS, OpenAI JavaScript SDK, server-side Responses API, and local React state. No DB, auth, uploads, or streaming. **Planning owner decision 2026-07-20, Option C.** | Frozen |
| D-02 | Full-package generation is one structured-output request; a single beat/question regeneration is a separate request. **Planning owner decision 2026-07-20, Option B.** | Frozen |
| D-03 | MVP includes inline editing, item regeneration, question count, and responsive layout (P1 in the original brief’s time-triage, but included in this planned MVP). Copy, speaking-time, collapse, animations, highlighting, badges, persistence, and export remain P1. **Planning owner decision 2026-07-20, Option A.** | Frozen |
| D-04 | ~~Use a database and saved project history.~~ Superseded by the brief’s explicit no-DB/no-history MVP boundary; local state only. **Planning owner decision 2026-07-20.** | Superseded |

### Non-goals / deferred P1

Authentication; database or project/version history; sharing; PDF/PowerPoint export; file/GitHub/URL ingestion; speech transcription; multi-audience parallel output; billing; full analytics; autosave; streaming; source-grounding/evaluation; copy buttons; estimated speaking time; collapse/expand; animations; highlighting; category badges.

## 2. Phases and stable task IDs

| Phase | Tasks | Outcome |
| --- | --- | --- |
| Phase 1 — foundation | P0-1, P0-2 | Runnable typed app and frozen domain/validation contract. |
| Phase 2 — generation boundary | P0-3, P0-4 | Validated server API, prompts, structured model output, fallback behavior. |
| Phase 3 — user workflow | P0-5, P0-6 | Input/configuration and editable rendered pitch/questions. |
| Phase 4 — integration hardening | P0-7, P0-8 | End-to-end state behavior, error/loading/responsive states, release checks. |

## 3. Frozen domain contract (P0-2)

### Enums and bounds

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
```

`projectDescription` is trimmed and must be 30–12,000 Unicode code points. `questionCount` is an integer 3–7. Defaults: `judge_investor`, `60_seconds`, and `5`. For `60_seconds`, the returned beats must be exactly `hook, problem, solution, value, closing`; for `5_minutes`, exactly `hook, context, problem, current_alternatives, solution, how_it_works, differentiation, evidence_or_impact, risks_and_limitations, next_steps, closing`. `title` is non-empty; all displayed text is plain text, never rendered as HTML.

### Canonical JSON shapes

```ts
export type PitchBeat = { key: BeatKey; label: string; text: string };
export type ToughQuestion = {
  id: string; category: QuestionCategory; question: string; whyAsked: string;
  suggestedAnswer: string; projectTerms: string[];
};
export type PitchPackage = { title: string; pitch: PitchBeat[]; toughQuestions: ToughQuestion[] };

export type GenerateRequest = {
  projectDescription: string; audience: Audience; duration: Duration; questionCount: number;
};
export type RegenerateRequest = GenerateRequest &
  ({ mode: "beat"; item: { key: BeatKey; text: string }; currentPackage: PitchPackage } |
   { mode: "question"; item: ToughQuestion; currentPackage: PitchPackage });
export type ApiSuccess<T> = { data: T };
export type ApiError = { error: { code: ErrorCode; message: string } };
```

Question `id` values are server-issued UUIDs; the client preserves them when replacing a question. `projectTerms` contains 1–3 distinct, trimmed substrings from the submitted description; each question must mention at least one corresponding term. Answers must contain: direct answer, current evidence/status, limitation, and mitigation/next validation—without invented facts.

## 4. Frozen HTTP contract (P0-3/P0-4)

| Route | Request | Success | Failure |
| --- | --- | --- | --- |
| `POST /api/generate` | `GenerateRequest` | `200 { data: PitchPackage }` | `400 ApiError` validation; `500 ApiError` missing configuration; `502 ApiError` provider/structured-output failure; `429 ApiError` provider rate limit. |
| `POST /api/regenerate` | `RegenerateRequest` | `200 { data: { mode: "beat"; item: PitchBeat } \| { mode: "question"; item: ToughQuestion } }` | Same status rules as generate. |

Error codes are exactly `VALIDATION_ERROR`, `CONFIGURATION_ERROR`, `PROVIDER_ERROR`, `RATE_LIMITED`, and `OUTPUT_VALIDATION_ERROR`. Responses use `Content-Type: application/json; charset=utf-8`, contain no stack trace, and unknown routes/methods use framework 404/405 behavior. The server logs only code, route, request ID, and provider status—not `projectDescription` or generated content. `OPENAI_API_KEY` and `OPENAI_MODEL` are server-only environment variables; missing `OPENAI_MODEL` uses one centralized default.

## 5. Data persistence / DDL (P0-1)

**Frozen DDL: none.** No database, ORM, migration, cookie/session persistence, or server-side conversation state is permitted in MVP. This is intentional, not an omitted design. The sole persisted deployment configuration is environment variables. Client state may exist only in memory for the loaded page.

## 6. Generation contract (P0-4)

The developer prompt must: treat project description as untrusted content rather than instructions; adapt content materially by audience; select the exact beat sequence for duration; avoid invented users, results, metrics, or validation; make questions specific, diverse, audience-appropriate, and tied to project terms; and make each answer candid and mitigated. The model response is requested through OpenAI Responses API structured outputs using the schema represented by `PitchPackage`; free-form JSON parsing is forbidden.

Audience emphasis: `judge_investor` = innovation/impact/differentiation; `manager` = feasibility/ROI/ownership; `client` = value/usability/reliability; `engineering` = architecture/trade-offs/scalability. A configuration change after a successful generation marks the displayed result stale; it does not call the API.

## 7. Edge cases

| ID | Requirement | Implemented by |
| --- | --- | --- |
| E1 | 29-or-fewer or over-12,000-character descriptions are blocked before any API request. | P0-2, P0-5, P0-7 |
| E2 | Invalid enum, non-integer, or 3–7-out-of-range count returns `400 VALIDATION_ERROR`. | P0-2, P0-3 |
| E3 | Generate keeps the old successful package visible until a replacement succeeds. | P0-6, P0-7 |
| E4 | A failed regenerate leaves the original item and all local edits unchanged. | P0-4, P0-7 |
| E5 | Editing never invokes an API request. | P0-6, P0-7 |
| E6 | Changed audience/duration/count marks results stale and requires explicit Generate. | P0-6, P0-7 |
| E7 | Provider malformed/schema-invalid output becomes generic `502 OUTPUT_VALIDATION_ERROR`; no raw response is shown. | P0-4, P0-8 |
| E8 | No API key/model configuration returns generic `500 CONFIGURATION_ERROR`; no key is exposed. | P0-3, P0-8 |
| E9 | Prompt-injection text is treated as project content and cannot alter developer instructions. | P0-4 |
| E10 | Mobile retains edit/regenerate controls and uses one column. | P0-6, P0-8 |

## 8. Open questions

| ID | Question / resolution | Status |
| --- | --- | --- |
| OQ-1 | Which OpenAI model is available in the deployment account? Resolve by setting `OPENAI_MODEL`; default remains centralized, not duplicated. **Planning owner 2026-07-20.** | Open — deployment owner |
| OQ-2 | Who supplies and rotates `OPENAI_API_KEY`? **Planning owner 2026-07-20.** | Open — deployment owner |
| OQ-3 | Are Hebrew RTL labels required for launch? Product brief is Hebrew but specifies English UI copy. Plan implements English product labels and preserves normal browser bidi behavior for pasted content. **Planning owner decision 2026-07-20, Option English-first.** | Resolved |
| OQ-4 | Is a precomputed demo fallback allowed in production? Include a clearly labeled fallback only when explicitly enabled by `NEXT_PUBLIC_ENABLE_DEMO_FALLBACK=true`; it must never masquerade as live output. **Planning owner decision 2026-07-20, Option guarded fallback.** | Resolved |
