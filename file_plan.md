# Pitch-Prep — File and Module Plan

All paths are new because the inspected repository has no application code. Task IDs identify the creating/owning PR and are stable with `spec.md` and `tasks.md`.

| Path | Task | Purpose |
| --- | --- | --- |
| `package.json` | P0-1 | Scripts and runtime/dev dependencies: Next, React, TypeScript, Tailwind, OpenAI, Zod, Vitest, Testing Library, Playwright. |
| `package-lock.json` | P0-1 | Locked reproducible dependency graph. |
| `tsconfig.json` | P0-1 | Strict TypeScript project configuration. |
| `next.config.ts` | P0-1 | Next.js configuration; no public secret exposure. |
| `tailwind.config.ts` | P0-1 | Tailwind content paths/theme. |
| `postcss.config.mjs` | P0-1 | Tailwind PostCSS integration. |
| `.gitignore` | P0-1 | Ignores dependencies, builds, local env files, and test artifacts. |
| `.env.example` | P0-1/P0-3 | Documents `OPENAI_API_KEY`, `OPENAI_MODEL`, and guarded demo-fallback flag without values. |
| `README.md` | P0-1/P0-8 | Setup, environment, scripts, no-persistence boundary, and demo/release checklist. |
| `src/app/layout.tsx` | P0-1 | Root document metadata and global stylesheet import. |
| `src/app/globals.css` | P0-1 | Global Tailwind layers and responsive base styling. |
| `src/app/page.tsx` | P0-1/P0-5/P0-7 | SPA composition and, finally, authoritative client workflow state. P0-7 owner resolves the expected conflict. |
| `src/lib/contracts.ts` | P0-2 | Frozen enums, TypeScript domain types, beat lists, API envelopes, and defaults. |
| `src/lib/validation.ts` | P0-2 | Shared request and generated-output schema validation. |
| `src/lib/__tests__/validation.test.ts` | P0-2 | Frozen-boundary validation tests. |
| `vitest.config.ts` | P0-2 | Unit/component-test runner setup. |
| `src/lib/api-response.ts` | P0-3 | Exact API success/error envelope constructors and safe error mapping. |
| `src/lib/server-config.ts` | P0-3 | Server-only environment parsing and centralized model selection. |
| `src/app/api/generate/route.ts` | P0-3/P0-4 | POST endpoint for a full pitch package. |
| `src/app/api/regenerate/route.ts` | P0-3/P0-4 | POST endpoint for exactly one beat or question. |
| `src/app/api/__tests__/routes.test.ts` | P0-3/P0-4 | HTTP status/envelope/provider-error contract tests. |
| `src/lib/openai-client.ts` | P0-4 | Server-only OpenAI Responses API adapter. |
| `src/lib/prompts.ts` | P0-4 | Developer prompt, audience/duration instruction builders, and untrusted-input separation. |
| `src/lib/generation.ts` | P0-4 | Full/targeted structured generation orchestration and output validation. |
| `src/lib/demo-fallback.ts` | P0-4 | Clearly marked fallback fixture gated by environment configuration. |
| `src/lib/__tests__/generation.test.ts` | P0-4 | Prompt/schema/output/fallback tests against mocked OpenAI calls. |
| `src/components/input-form.tsx` | P0-5 | Project-description textarea, counter, local validation, and generate action. |
| `src/components/configuration.tsx` | P0-5 | Audience, duration, and question-count controls. |
| `src/components/__tests__/input-form.test.tsx` | P0-5 | Form defaults, validation, preservation, and accessibility tests. |
| `src/components/pitch-result.tsx` | P0-6 | Pitch beat display, inline edit, and per-beat regeneration control. |
| `src/components/tough-questions.tsx` | P0-6 | Question cards with category, why asked, answer edit, and targeted regeneration. |
| `src/components/loading-skeleton.tsx` | P0-6 | Initial/full/targeted loading feedback. |
| `src/components/error-banner.tsx` | P0-6 | Safe human-readable error rendering and retry affordance. |
| `src/components/__tests__/results.test.tsx` | P0-6 | Result rendering, local control, and responsive-accessibility tests. |
| `src/lib/client-api.ts` | P0-7 | Typed browser fetch wrapper for frozen API envelopes. |
| `src/app/__tests__/page.test.tsx` | P0-7/P0-8 | State-machine integration checks plus release regressions. |
| `src/test/fixtures.ts` | P0-7 | Stable valid request/package fixtures shared by UI and integration tests. |
| `tests/e2e/pitch-prep.spec.ts` | P0-8 | Browser acceptance flows corresponding to brief scenarios. |
| `playwright.config.ts` | P0-8 | E2E runner/browser/server configuration. |

## Module boundaries

- **Browser-only:** `src/app/page.tsx`, `src/components/**`, and `src/lib/client-api.ts`; none may import OpenAI SDK, `server-config`, or environment secrets.
- **Server-only:** `src/app/api/**`, `src/lib/openai-client.ts`, `src/lib/prompts.ts`, `src/lib/generation.ts`, `src/lib/server-config.ts`; all provider calls stay here.
- **Shared pure contract:** `src/lib/contracts.ts` and `src/lib/validation.ts`; API and UI import these to avoid duplicated literals.
- **Test-only:** `src/**/__tests__/**`, `src/test/**`, and `tests/e2e/**`; fixtures must comply with the frozen `PitchPackage` contract.

## Explicitly absent modules

There is deliberately no `db/`, `prisma/`, `models/`, `auth/`, `middleware.ts` authentication layer, upload handler, persistence service, or streaming route in MVP (D-01/P0-1). Adding any requires a spec re-review.
