# Pitch-Prep — Execution Plan

## Delivery assumptions and salvage strategy

The repository baseline (`work`, inspected 2026-07-20) contains only `docs/Pitch Prep MVP Documentation.pdf`; no code, branches, or remote `origin/main` are available to salvage. **Donor:** the PDF’s workflow, acceptance criteria, prompts, and product boundaries. **Base:** a fresh Next.js App Router skeleton. No old code may be treated as a base.

## Frozen upfront

| Re-review required | Evolvable within the contract |
| --- | --- |
| D-01 stack/no-DB boundary; D-02 request topology; enum strings; duration beat sequences; request/response/error shapes; HTTP statuses; validation limits; API route names; structured output only; no browser key; no P1 features | Prompt wording, centralized default model, labels/style, component internals, skeleton copy, exact test fixture prose, fallback fixture content |

## Dependency map and merge order

```text
P0-1 scaffold
  └─ P0-2 contracts/validation ─┬─ P0-3 API shell ─ P0-4 OpenAI generation
                                └─ P0-5 input/config UI ─ P0-6 results UI
P0-4 + P0-5 + P0-6 ─────────────────────────────────────── P0-7 integration/state
P0-7 ────────────────────────────────────────────────────── P0-8 quality/release
```

**Merge order:** P0-1 → P0-2 → P0-3 → P0-4 → P0-5 → P0-6 → P0-7 → P0-8. Run each PR’s tests after rebase onto its stated base. The single expected merge-conflict point is `src/app/page.tsx` during **P0-7** (API wiring over P0-5/P0-6 placeholders); the P0-7 integration owner resolves it after both UI PRs merge.

## Agent lanes and ownership

| Slot | Owner lane | Tasks | Exclusive file ownership / hand-off |
| --- | --- | --- | --- |
| A | Platform/API | P0-1–P0-4 | Config, schemas, API routes, prompt/client, API tests. Exposes frozen types for UI. |
| B | Input UI | P0-5 | `src/components/input-form.tsx`, `src/components/configuration.tsx`, input UI tests. |
| C | Results UI | P0-6 | `src/components/pitch-result.tsx`, `src/components/tough-questions.tsx`, results UI tests. |
| A (integrator) | State/release | P0-7–P0-8 | `src/app/page.tsx`, integration/e2e tests, QA docs. Resolves expected conflict. |

Parallelism starts only after P0-2: P0-3 and P0-5 may proceed; P0-6 starts once P0-2 mock type is available. P0-4 follows P0-3; P0-7 waits for P0-4/P0-5/P0-6.

## PR 1 — P0-1 Foundation

- **Branch/base:** `feat/p0-1-foundation` from `work`; **estimate:** 1.5 h; **blocked by:** none; **blocks:** P0-2.
- **Files:** `package.json`, `package-lock.json`, `tsconfig.json`, `next.config.ts`, `tailwind.config.ts`, `postcss.config.mjs`, `.gitignore`, `.env.example`, `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/globals.css`, `README.md`.
- **DoD:** `npm run lint`, `npm run typecheck`, `npm run build` pass; `npm run dev` renders one page; `.env.example` names but does not contain secrets; README says no DB/auth and lists required environment variables.
- **Review gate:** platform owner confirms fresh-base strategy and no client-prefixed OpenAI secret.

## PR 2 — P0-2 Contracts and validation

- **Branch/base:** `feat/p0-2-contracts` from `feat/p0-1-foundation`; **estimate:** 2 h; **blocked by:** P0-1; **blocks:** P0-3, P0-4, P0-5, P0-6.
- **Files:** `src/lib/contracts.ts`, `src/lib/validation.ts`, `src/lib/__tests__/validation.test.ts`, `vitest.config.ts`, `package.json`.
- **DoD:** unit tests assert every enum literal, defaults, 30/12,000 inclusive bounds, 29/12,001 rejection, count bounds/integer rule, and exact 60-second/5-minute beat lists; `npm run test`, lint, typecheck pass. Covers E1/E2.
- **Review gate:** reviewer compares exported types and error codes byte-for-byte with `spec.md`.

## PR 3 — P0-3 API boundary

- **Branch/base:** `feat/p0-3-api-boundary` from `feat/p0-2-contracts`; **estimate:** 2 h; **blocked by:** P0-2; **blocks:** P0-4/P0-7.
- **Files:** `src/app/api/generate/route.ts`, `src/app/api/regenerate/route.ts`, `src/lib/api-response.ts`, `src/lib/server-config.ts`, `src/app/api/__tests__/routes.test.ts`, `.env.example`.
- **DoD:** route tests assert invalid payloads return the exact `400` envelope, missing secret returns `500 CONFIGURATION_ERROR`, and no response includes a stack/key; only POST succeeds; lint/typecheck/test pass. Covers E2/E8.
- **Review gate:** security reviewer verifies server-only imports and redacted logging.

## PR 4 — P0-4 Structured generation and regeneration

- **Branch/base:** `feat/p0-4-generation` from `feat/p0-3-api-boundary`; **estimate:** 4 h; **blocked by:** P0-3; **blocks:** P0-7.
- **Files:** `src/lib/openai-client.ts`, `src/lib/prompts.ts`, `src/lib/generation.ts`, `src/lib/demo-fallback.ts`, `src/lib/__tests__/generation.test.ts`, `src/app/api/__tests__/routes.test.ts`.
- **DoD:** mocked SDK tests prove one full generate call and one targeted regeneration call use structured schema; generated question count/beat ordering validate; malformed provider output maps to exact `502 OUTPUT_VALIDATION_ERROR`; test injects hostile project text and asserts developer instruction remains separate; guarded fallback is labeled. `npm run test`, lint/typecheck pass. Covers E4/E7/E9.
- **Review gate:** AI owner checks audience/duration instructions and factual-honesty rules against source brief.

## PR 5 — P0-5 Input and configuration UI

- **Branch/base:** `feat/p0-5-input-ui` from `feat/p0-2-contracts`; **estimate:** 3 h; **blocked by:** P0-2; **blocks:** P0-7.
- **Files:** `src/components/input-form.tsx`, `src/components/configuration.tsx`, `src/components/__tests__/input-form.test.tsx`, `src/app/page.tsx` (placeholder composition only).
- **DoD:** tests assert default controls, character counter, local validation before submit, and all four audiences/two durations/3–7 counts; description survives control change; no network request from field edits. `npm run test`, lint/typecheck pass. Covers E1/E5.
- **Review gate:** UI reviewer verifies accessible labels and keyboard-operable segmented controls.

## PR 6 — P0-6 Results UI

- **Branch/base:** `feat/p0-6-results-ui` from `feat/p0-2-contracts`; **estimate:** 3 h; **blocked by:** P0-2; **blocks:** P0-7.
- **Files:** `src/components/pitch-result.tsx`, `src/components/tough-questions.tsx`, `src/components/loading-skeleton.tsx`, `src/components/error-banner.tsx`, `src/components/__tests__/results.test.tsx`.
- **DoD:** fixture-driven tests show all beat/question fields, edit controls, targeted regenerate controls, loading skeleton and generic error; desktop/tiny viewport assertions retain controls. `npm run test`, lint/typecheck pass. Covers E5/E10.
- **Review gate:** product reviewer verifies why-asked and suggested-answer fields are visible.

## PR 7 — P0-7 Integrated workflow state

- **Branch/base:** `feat/p0-7-integration` from `work` after P0-4/P0-5/P0-6 merge; **estimate:** 4 h; **blocked by:** P0-4/P0-5/P0-6; **blocks:** P0-8.
- **Files:** `src/app/page.tsx`, `src/lib/client-api.ts`, `src/app/__tests__/page.test.tsx`, `src/test/fixtures.ts`.
- **DoD:** mocked-fetch tests assert one valid generate request, disabled generate/skeleton while pending, prior package retained until success, stale notice after configuration change, inline edit sends no request, regenerate replaces only its target, failed regenerate restores enabled state and preserves old target. `npm run test`, lint/typecheck pass. Covers E3–E6.
- **Review gate:** integration owner resolves the declared `page.tsx` conflict and attaches test output.

## PR 8 — P0-8 Release hardening

- **Branch/base:** `feat/p0-8-release-hardening` from `feat/p0-7-integration`; **estimate:** 2.5 h; **blocked by:** P0-7.
- **Files:** `README.md`, `src/app/__tests__/page.test.tsx`, `tests/e2e/pitch-prep.spec.ts`, `playwright.config.ts`, `package.json`.
- **DoD:** e2e tests cover Judge/60s/5, Manager/5m, Engineering/5m, vague input, short-input API non-call, and regenerate failure retention; `npm run lint`, `npm run typecheck`, `npm run test`, `npm run build`, `npm run test:e2e` pass. Manual production checklist verifies refresh, missing-key error, and explicitly labeled fallback. Covers E7/E8/E10.
- **Review gate:** release owner runs the public-URL demo checklist and freezes scope; P1 work cannot enter this PR.
