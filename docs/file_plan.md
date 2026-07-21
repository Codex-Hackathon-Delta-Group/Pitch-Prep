# Pitch Prep — Finalized File & Module Plan (`file_plan.md`)

> **Purpose:** Maps every file to its purpose, its owning lane, and the PR that creates it. This guarantees a conflict-free execution environment for three parallel agent lanes while enforcing strict App Router security boundaries.
> **Status:** Canonical source of truth.
> **Companion docs:** [`spec.md`](./spec.md) (contracts, edge cases), [`tasks.md`](./tasks.md) (PRs, lanes, DoD).
> **Lanes:** **LANE-A** (`ai-prompt`), **LANE-B** (`ui-state`), **LANE-C** (`api-integration`).
> **Stack:** Next.js (App Router), React, TypeScript, Tailwind, OpenAI JS SDK (Structured Outputs), Zod, Vitest, Playwright. No database, no auth.

---

## 1. File Tree & Lane Ownership

```text
pitch-prep/
├── app/
│   ├── page.tsx                  LANE-B   PR-01/05/07 Minimal route in PR-01 → SPA composition + state (🚨 Conflict Point)
│   ├── layout.tsx                LANE-B   PR-01      Root metadata & layouts
│   ├── globals.css               LANE-B   PR-01      Tailwind layers
│   ├── __tests__/                LANE-A   PR-07      State machine & integration tests
│   └── api/
│       ├── generate/route.ts     LANE-C   PR-03      POST /api/generate (Server-only)
│       ├── regenerate/route.ts   LANE-C   PR-06      POST /api/regenerate (Server-only)
│       └── __tests__/            LANE-C   PR-03      HTTP contract & error tests
├── components/
│   ├── InputForm.tsx             LANE-B   PR-05      Textarea, validation, generate action
│   ├── ConfigurationPanel.tsx    LANE-B   PR-05      Audience, duration, question count
│   ├── PitchResult.tsx           LANE-B   PR-06      Beat display & inline editing
│   ├── ToughQuestions.tsx        LANE-B   PR-06      Question cards & answer editing
│   ├── LoadingSkeleton.tsx       LANE-B   PR-06      UI loading feedback stages
│   ├── ErrorBanner.tsx           LANE-B   PR-06      Safe error rendering & retry
│   └── __tests__/                LANE-B   PR-05/06   UI component test suites
├── lib/
│   ├── contracts.ts              SHARED   PR-02      Frozen types, enums, WORD_BUDGETS, LIMITS, API envelopes, generation-seam types
│   ├── validation.ts             SHARED   PR-02      Zod request/output schemas enforcing LIMITS + WORD_BUDGETS
│   ├── openai-client.ts          LANE-C   PR-04      Server-only Responses API adapter
│   ├── server-config.ts          LANE-C   PR-03      Server-only environment & model selection
│   ├── client-api.ts             LANE-C   PR-07      Typed fetch wrapper; serves demo-fallback on failure when flag set (E10)
│   ├── prompts.ts                LANE-A   PR-04      Developer prompt & instruction builders
│   ├── generation.ts             LANE-A   PR-02/04   Typed seam + fixture stub (PR-02) → structured orchestration (PR-04)
│   ├── demo-fallback.ts          LANE-C   PR-04      Browser-safe labeled fallback package (E10), used by client-api.ts
│   └── __tests__/                LANE-A/C PR-02/04   Validation & prompt generation tests
├── tests/e2e/
│   └── pitch-prep.spec.ts        LANE-C   PR-08      Playwright browser acceptance tests
├── demo/
│   └── pitch-prep-input.txt      LANE-C   PR-08      Golden paste-in input for demo
├── Root Configs/
│   ├── package.json              LANE-C   PR-01      Dependencies & script definitions
│   ├── package-lock.json         LANE-C   PR-01      Locked, reproducible dependency graph
│   ├── tsconfig.json             LANE-C   PR-01      Strict TypeScript configuration
│   ├── next.config.ts            LANE-C   PR-01      Next.js configuration
│   ├── tailwind.config.ts        LANE-C   PR-01      Tailwind theme configuration
│   ├── postcss.config.mjs        LANE-C   PR-01      PostCSS setup
│   ├── .gitignore                LANE-C   PR-01      Ignores deps, builds, local env, test artifacts
│   ├── vitest.config.ts          LANE-C   PR-02      Unit/component runner setup
│   ├── playwright.config.ts      LANE-C   PR-08      E2E runner configuration
│   ├── .env.example              LANE-C   PR-01      Documents OPENAI_API_KEY, OPENAI_MODEL, NEXT_PUBLIC_ENABLE_DEMO_FALLBACK
│   └── README.md                 LANE-C   PR-01/10   Setup, architecture, and runbook
```

---

## 2. Next.js Module Boundaries

To prevent leaking secrets or causing React hydration errors, strictly enforce these boundaries:

*   **Browser-Only:** `app/page.tsx`, `components/**`, `lib/client-api.ts`, and `lib/demo-fallback.ts` (static labeled fixture — no secrets or SDK).
    *   *Rule:* None of these files may import the OpenAI SDK, `lib/server-config.ts`, or access `process.env` secrets directly (the public `NEXT_PUBLIC_ENABLE_DEMO_FALLBACK` flag is allowed).
*   **Server-Only:** `app/api/**`, `lib/openai-client.ts`, `lib/prompts.ts`, `lib/generation.ts`, `lib/server-config.ts`.
    *   *Rule:* All provider calls, prompt construction, and secret parsing stay here.
*   **Shared Pure Contracts:** `lib/contracts.ts` and `lib/validation.ts`.
    *   *Rule:* Both the UI components and API routes import from these files to avoid duplicating types or literal strings. Changes require a cross-lane contract review (LANE-A + LANE-C) before UI/API consume them.

---

## 3. Disjoint Ownership & Conflict Resolution

No file (other than shared contracts) is owned by more than one lane. This lets the three agent lanes merge PRs rapidly without blocking each other.

**The Single Git Conflict Point (`app/page.tsx`):**
During PR-07, `LANE-C` wires the generated API hooks (`lib/client-api.ts`) into the UI placeholders built by `LANE-B`.
*   **Resolution Rule:** `LANE-B` owns `page.tsx` outright. `LANE-C` integrates logic through props and hooks, but if a merge conflict arises in this file, the `LANE-B` owner dictates the resolution.

---

## 4. The Time-Crunch Cut (Critical Subset)

If the 4-hour clock is running down and features are dropping, development freezes on all non-essential UI polish and testing. The following files are the *absolute minimum* required to deliver a functional MVP demo. If time collapses, over-abstracting must stop, and work consolidates entirely into:

1.  `app/page.tsx` (Handles all state and layout)
2.  `app/api/generate/route.ts` (Handles the AI call)
3.  `lib/prompts.ts` (Handles output quality)
4.  `lib/contracts.ts` (Ensures the front and back ends agree)
5.  `demo/pitch-prep-input.txt` (Ensures a clean demo presentation)

*Note: `app/api/regenerate/route.ts` and its associated components are immediately cut if the primary Generate flow is unstable by the final hour.*
