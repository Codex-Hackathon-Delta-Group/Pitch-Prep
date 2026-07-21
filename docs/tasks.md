# Pitch Prep — Execution Plan (`tasks.md`)

> **Purpose:** Translate [`spec.md`](./spec.md) and [`file_plan.md`](./file_plan.md) into an operative work plan: PRs, branches, file scope, dependencies, agent lanes, DoD, and a merge process that minimizes conflicts under a 4-hour clock.
> **Status:** Canonical source of truth. **Origin:** `docs/Pitch-Prep-Task-Plan-PR-Branches.docx`.
> **Execution model:** three parallel **AI-agent lanes** with strict file-ownership. PRs stay small and staged — never one giant end-of-hackathon PR.
> **Contract authority:** all type/enum/route names below are the frozen forms from [`spec.md` §4–5](./spec.md); all file paths and PR-to-file mappings come from [`file_plan.md`](./file_plan.md).

---

## 1. Git & branching strategy

- **`main`** — always runnable and demoable. No force-push. Squash-merge only.
- **Branch naming:** `feat/<area>-<short-desc>`, `fix/<area>-<short-desc>`, `chore/<area>-<short-desc>`. Examples: `feat/contracts`, `feat/api-generate`, `feat/ai-core`, `feat/ui-input`.
- Every branch starts from up-to-date `main`. Before opening a PR: `git fetch origin && git rebase origin/main`.
- **PR size:** ≤ 250–350 net changed lines; overage allowed only for scaffolding (PR-01).
- One review gate per PR (one reviewer approves, squash-merge). After merge, delete remote + local branch.
- **No single PR mixes UI + prompt + API** unless it is a small, defined integration (PR-07).

---

## 2. Agent lanes, file ownership & module boundaries

Disjoint file ownership is what lets the three lanes run in parallel. Ownership mirrors [`file_plan.md` §1](./file_plan.md).

| Lane | Agent role | Owns these paths | Owns PRs | Co-owns |
|---|---|---|---|---|
| **LANE-A** | `ai-prompt` | `lib/prompts.ts`, `lib/generation.ts`, `app/__tests__/`, `lib/__tests__` (prompt) | PR-04, PR-07 tests | PR-02 (contracts, with C) |
| **LANE-B** | `ui-state` | `components/*`, `app/page.tsx`, `app/layout.tsx`, `app/globals.css`, component `__tests__` | PR-05, PR-06 (UI), PR-09 | — |
| **LANE-C** | `api-integration` | `app/api/**`, `lib/openai-client.ts`, `lib/server-config.ts`, `lib/client-api.ts`, `lib/demo-fallback.ts`, `tests/e2e/*`, `demo/*`, all root config | PR-01, PR-03, PR-08, PR-10 | PR-02, PR-06 (regenerate route), PR-07 |

### Module boundaries (enforced — [`file_plan.md` §2](./file_plan.md))
- **Browser-only:** `app/page.tsx`, `components/**`, `lib/client-api.ts` — must **not** import the OpenAI SDK, `lib/server-config.ts`, or read `process.env` secrets.
- **Server-only:** `app/api/**`, `lib/openai-client.ts`, `lib/prompts.ts`, `lib/generation.ts`, `lib/server-config.ts`.
- **Shared pure:** `lib/contracts.ts`, `lib/validation.ts`.

### Change-controlled shared files
`lib/contracts.ts` and `lib/validation.ts` are consumed by every lane. **Any change goes through a dedicated contract PR reviewed by LANE-A + LANE-C *before* B/C consume it.** No lane edits them inside a feature PR. This keeps the [`spec.md` §4–5](./spec.md) frozen contracts from drifting.

### The single expected merge-conflict point
**`app/page.tsx`.** At PR-07, LANE-C wires the API hooks (`lib/client-api.ts`) into the UI placeholders LANE-B built.
**Resolution rule:** LANE-B owns `page.tsx` outright; LANE-C integrates only through props/hooks and never edits it directly. If a conflict still occurs there, LANE-B resolves it.

---

## 3. Dependency map & merge order

```
PR-01 ─→ PR-02 ─┬─→ PR-03 ─┐
(scaffold) (contracts) (gen API) │
                ├─→ PR-04 ───────┤        (AI core; also feeds PR-06 regenerate)
                │   (A)          │
                └─→ PR-05 ─→ PR-06 ─→ PR-07 ─┬─→ PR-08 ─→ PR-10
                    (input)  (results) (wire) │   (e2e/demo) (RC)
                                     🚨page.tsx└─→ PR-09
                                                   (polish, P1)
```

**Rules:** a PR may open early as a Draft but must not merge before its dependency merges.
**Critical path to demo:** `PR-01 → PR-02 → PR-05 → PR-06 → PR-07 → PR-08 → PR-10`, with **PR-03** (generate route) and **PR-04** (AI core) as parallel producers that must merge before PR-07.
**Cut line (P1, cuttable):** the **regenerate slice of PR-06** (`app/api/regenerate/route.ts` + client merge) and **PR-09** (polish). Everything else is P0.

---

## 4. Pull Requests

Each PR: branch, base, owner, blocked-by/blocks, priority, scope, file list (see [`file_plan.md`](./file_plan.md)), and **testable DoD**. Tests are written **inside the same PR** against the frozen contracts — never deferred.

### PR-01 — Project scaffold
- **Branch:** `chore/scaffold` (base `main`) · **Owner:** LANE-C (+LANE-B for `layout.tsx`/`globals.css`) · **Priority:** P0 · **Blocked-by:** — · **Blocks:** PR-02
- **Tasks:** T-101, T-102, T-103, T-104
- **Scope:** Next.js App Router + TS + Tailwind; `package.json`, `next.config.ts`, `tailwind.config.ts`, `postcss.config.mjs`; `app/layout.tsx`, `app/globals.css`; `.env.example` (`OPENAI_API_KEY`, `OPENAI_MODEL`, `NEXT_PUBLIC_ENABLE_DEMO_FALLBACK`); README init.
- **DoD:** `npm run dev`, `npm run lint`, `npm run build` all pass; single page renders; **no** API key in code or git history; `.env.local` gitignored.

### PR-02 — Shared contracts & validation
- **Branch:** `feat/contracts` (base `main`) · **Owner:** SHARED (LANE-A + LANE-C review) · **Priority:** P0 · **Blocked-by:** PR-01 · **Blocks:** PR-03, PR-04, PR-05, PR-06
- **Tasks:** T-201, T-202, T-203
- **Scope:** `lib/contracts.ts` (all `as const` enums, `BeatKey`, `PitchBeat` incl. `purpose`, `ToughQuestion`, `PitchPackage` incl. `assumptions`, `GenerateRequest`, `RegenerateRequest`, `ApiSuccess`/`ApiError`/`ErrorCode` — spec §4–5); `lib/validation.ts` (Zod schemas for request + provider output); `vitest.config.ts`.
- **DoD:** contract tests assert enum membership, `questionCount` 3–7, `projectDescription` 30–12,000, beat sequence rules per duration (spec §4.1); output schema validates a sample `PitchPackage`; `npm run test` green. Any later change here requires a fresh contract PR.

### PR-03 — Generate API route
- **Branch:** `feat/api-generate` (base `main`) · **Owner:** LANE-C · **Priority:** P0 · **Blocked-by:** PR-02 · **Blocks:** PR-07
- **Tasks:** T-301, T-302, T-303
- **Scope:** `app/api/generate/route.ts` + `app/api/__tests__/`; `lib/server-config.ts` (env + model selection, server-only). Route validates `GenerateRequest`, calls the generation function (interface from `lib/contracts`), returns `{ data: PitchPackage }`; full behavior lands once PR-04 merges.
- **DoD:** valid fixture → `200 { data }` with schema-valid `PitchPackage`; **API key absent from the client bundle** (grep built output); invalid payload → `400 VALIDATION_ERROR` (**E1/E2/E3**); missing key/model → `500 CONFIGURATION_ERROR` (**E9**); provider failure → `502 PROVIDER_ERROR`; bad model output → `502 OUTPUT_VALIDATION_ERROR` (**E8**); rate limit → `429 RATE_LIMITED`. No stack trace or `projectDescription` in client responses/logs.

### PR-04 — AI generation core
- **Branch:** `feat/ai-core` (base `main`) · **Owner:** LANE-A (+LANE-C for `openai-client.ts`, `demo-fallback.ts`) · **Priority:** P0 · **Blocked-by:** PR-02 · **Blocks:** PR-06 (regenerate slice), PR-07
- **Tasks:** T-401, T-402, T-403, T-404
- **Scope:** `lib/prompts.ts` (hostile-but-fair persona, audience/duration instruction blocks, untrusted-input framing — spec §6); `lib/generation.ts` (Structured-Outputs orchestration; populates `assumptions`; enforces `projectTerms` per question); `lib/openai-client.ts` (server-only Responses adapter); `lib/demo-fallback.ts` (guarded fixture for **E10**).
- **DoD:** given `(projectDescription, config)` returns a schema-conformant `PitchPackage`; `pitch` matches the exact beat sequence for the duration; `toughQuestions.length === questionCount`; each question has 1–3 `projectTerms`; missing evidence appears in `assumptions`, never fabricated (**E11**); never-invent list honored (spec §6); fixture tests cover all four audiences producing distinct emphasis.

### PR-05 — Input & configuration UI
- **Branch:** `feat/ui-input` (base `main`) · **Owner:** LANE-B · **Priority:** P0 · **Blocked-by:** PR-02 · **Blocks:** PR-06
- **Tasks:** T-501, T-502, T-503, T-504
- **Scope:** `app/page.tsx` (state scaffold: draft, config, package, status); `components/InputForm.tsx` (textarea + char counter + client validation); `components/ConfigurationPanel.tsx` (audience default `judge_investor`, duration, question count 3–7 default 5); component `__tests__`.
- **DoD:** no API calls; local state correct; invalid input blocked with clear message (**E1/E2**); changing audience/duration/count marks the result stale (**E4**); Generate button toggles disabled/loading/ready; basic responsive layout.

### PR-06 — Results UI + per-item regeneration
- **Branch:** `feat/ui-results` (base `main`; regenerate route co-branch `feat/api-regenerate`) · **Owner:** LANE-B (components) + LANE-C (regenerate route) · **Priority:** P0 for display; **P1 (cuttable)** for the regenerate slice · **Blocked-by:** PR-05 (display); PR-04 (regenerate slice) · **Blocks:** PR-07
- **Tasks:** T-601, T-602, T-603, T-604 (P0); T-605, T-606 (P1)
- **Scope (P0):** `components/PitchResult.tsx` (beats + inline edit), `components/ToughQuestions.tsx` (question cards + answer edit), `components/LoadingSkeleton.tsx`, `components/ErrorBanner.tsx`. **Scope (P1):** `app/api/regenerate/route.ts` (`RegenerateRequest` discriminated union; resolves beat `purpose` from `currentPackage`; returns `{ data: { mode, item } }`) + client merge of the single replacement.
- **DoD (P0):** full `PitchPackage` renders; every beat and answer editable; editing updates local state only, no API call (**E7**); error banner shows no stack trace. **DoD (P1):** only the selected item changes; other edits preserved (**E6**); scoped spinner. If cut, no broken regenerate button appears in the UI.

### PR-07 — End-to-end integration
- **Branch:** `feat/integration` (base `main`) · **Owner:** LANE-C (integrates) + LANE-B (owns `page.tsx`) + LANE-A (integration tests) · **Priority:** P0 · **Blocked-by:** PR-03, PR-04, PR-05, PR-06 (display) · **Blocks:** PR-08, PR-09
- **Tasks:** T-701, T-702, T-703, T-704
- **Scope:** `lib/client-api.ts` (typed browser fetch wrapper); wire `page.tsx` Generate (and Regenerate if PR-06 P1 shipped) to the API; loading skeleton + simulated stages; stale-result behavior; error banner + manual retry; `app/__tests__/` state-machine + integration tests. **This is the conflict point** — LANE-C via props/hooks only.
- **DoD:** paste → Generate → result works end to end; failure keeps the previous package (**E5**); loading keeps prior result visible; retry available; module boundaries respected (no server import in browser files).

### PR-08 — E2E acceptance + demo hardening
- **Branch:** `chore/e2e-demo` (base `main`) · **Owner:** LANE-C · **Priority:** P0 · **Blocked-by:** PR-07 · **Blocks:** PR-10
- **Tasks:** T-801, T-802, T-803
- **Scope:** `tests/e2e/pitch-prep.spec.ts` (Playwright acceptance of the demo loop); `demo/pitch-prep-input.txt` (golden input); `playwright.config.ts`; verify demo fallback path.
- **DoD:** e2e run covers paste → Generate → edit → (regenerate or skip); demo works even when the live API fails, clearly labeled as fallback (**E10**); `demo/pitch-prep-input.txt` ready to paste.

### PR-09 — UI polish & accessibility
- **Branch:** `fix/ui-polish` (base `main`) · **Owner:** LANE-B · **Priority:** P1 · **Blocked-by:** PR-07 · **Blocks:** —
- **Tasks:** T-901
- **Scope:** disabled states, focus rings, labels, mobile spacing, copy cleanup (edits existing component files — no new files).
- **DoD:** no clipping; basic keyboard navigation works; mobile usable.

### PR-10 — Release candidate
- **Branch:** `chore/release-candidate` (base `main`) · **Owner:** LANE-C · **Priority:** P0 · **Blocked-by:** all P0 (PR-01,02,03,04,05,06-display,07,08) · **Blocks:** —
- **Tasks:** T-1001, T-1002, T-1003
- **Scope:** finalize `README.md` runbook; freeze; build/deploy check; production smoke test.
- **DoD:** public URL opens with no login; Generate + edit + (regenerate or fallback) verified from a second machine; demo script rehearsed 3×.

---

## 5. Task backlog (`T-xxx`)

| ID | Task | Owner | PR | Est. | Prio | Acceptance |
|---|---|---|---|---|---|---|
| T-101 | Create repo + Next.js app | C | PR-01 | 15m | P0 | `dev`/`lint`/`build` pass |
| T-102 | Tailwind + `layout.tsx` + `globals.css` | B | PR-01 | 10m | P0 | One page loads clean |
| T-103 | Config files (next/tailwind/postcss) | C | PR-01 | 10m | P0 | Build uses them |
| T-104 | `.env.example` + README init | C | PR-01 | 5m | P0 | No key in code/history |
| T-201 | `lib/contracts.ts` (types/enums/envelopes) | A+C | PR-02 | 25m | P0 | All spec §4–5 shapes exported |
| T-202 | `lib/validation.ts` (Zod request + output) | A+C | PR-02 | 20m | P0 | Rejects out-of-bounds input |
| T-203 | Vitest setup + contract tests | C | PR-02 | 15m | P0 | `npm run test` green |
| T-301 | `lib/server-config.ts` (env + model) | C | PR-03 | 10m | P0 | Key stays server-side (**E9**) |
| T-302 | Generate route + validation + error map | C | PR-03 | 20m | P0 | Status codes per spec §5 |
| T-303 | Route HTTP contract tests | C | PR-03 | 15m | P0 | 200/400/429/500/502 covered |
| T-401 | `lib/prompts.ts` (persona/audience/duration) | A | PR-04 | 25m | P0 | Distinct emphasis per audience |
| T-402 | `lib/generation.ts` (orchestration + assumptions) | A | PR-04 | 25m | P0 | `projectTerms` + `assumptions` populated (**E11**) |
| T-403 | `lib/openai-client.ts` (server adapter) | C | PR-04 | 15m | P0 | Structured Outputs call works |
| T-404 | `lib/demo-fallback.ts` (guarded fixture) | C | PR-04 | 10m | P0 | Loads only in demo/failure (**E10**) |
| T-501 | `page.tsx` state scaffold | B | PR-05 | 20m | P0 | draft/config/package/status modeled |
| T-502 | `InputForm` (textarea+counter+validation) | B | PR-05 | 20m | P0 | 30–12,000 chars; clear message |
| T-503 | `ConfigurationPanel` (audience/duration/count) | B | PR-05 | 15m | P0 | Defaults judge_investor / 60_seconds / 5 |
| T-504 | Input component tests | B | PR-05 | 10m | P0 | Validation + stale-mark covered |
| T-601 | `PitchResult` (display + inline edit) | B | PR-06 | 20m | P0 | Beats editable, local only (**E7**) |
| T-602 | `ToughQuestions` (cards + answer edit) | B | PR-06 | 20m | P0 | Question/why/answer/category shown |
| T-603 | `LoadingSkeleton` | B | PR-06 | 10m | P0 | Prior result kept during load |
| T-604 | `ErrorBanner` + retry | B | PR-06 | 10m | P0 | No stack trace; retry available |
| T-605 | Regenerate route (discriminated union) | C | PR-06 | 25m | P1 | Returns single replacement |
| T-606 | Merge replacement in client state | B | PR-06 | 15m | P1 | No overwrite of other edits (**E6**) |
| T-701 | `lib/client-api.ts` (typed fetch) | C | PR-07 | 15m | P0 | Browser-only; no server import |
| T-702 | Wire Generate flow in `page.tsx` | C+B | PR-07 | 20m | P0 | Full flow works |
| T-703 | Stale/loading/error behavior | B | PR-07 | 15m | P0 | Failure keeps result (**E5**) |
| T-704 | App integration tests | A | PR-07 | 15m | P0 | State machine asserted |
| T-801 | Playwright e2e spec | C | PR-08 | 20m | P0 | Demo loop passes |
| T-802 | Golden demo input | C | PR-08 | 5m | P0 | Pitch Prep description ready |
| T-803 | Playwright config + fallback verify | C | PR-08 | 10m | P0 | Fallback labeled (**E10**) |
| T-901 | Polish + a11y pass | B | PR-09 | 20m | P1 | No clipping; keyboard basic |
| T-1001 | README runbook | C | PR-10 | 10m | P0 | Setup + demo documented |
| T-1002 | Deploy + smoke test | C | PR-10 | 10m | P0 | Public URL works |
| T-1003 | Demo rehearsal ×3 | A+B+C | PR-10 | 20m | P0 | On time, no improvisation |

---

## 6. 4-hour schedule

| Window | Lanes active | Activity | Exit criteria |
|---|---|---|---|
| 00:00–00:20 | all | PR-01 scaffold + PR-02 contracts, branch split, demo input | `main` builds; contracts + validation merged |
| 00:20–01:15 | A / B / C parallel | PR-03, PR-04, PR-05 | generate route; AI core; input UI |
| 01:15–02:00 | B / C | PR-06 display (+regenerate slice if time) | results render on mock/real |
| 02:00–02:45 | all | PR-07 integration | full flow works end to end |
| 02:45–03:20 | C / B | PR-08 e2e/demo + PR-09 polish | fallback + acceptance green |
| 03:20–03:40 | all | PR-10, freeze, deploy | stable RC |
| 03:40–04:00 | all | demo rehearsal | 3 successful runs |

---

## 7. Frozen upfront vs evolvable

**Frozen (no change without a re-reviewed contract PR):**
- All `as const` enums, `BeatKey`, and every type in [`spec.md` §4.2](./spec.md) (`PitchBeat` incl. `purpose`, `ToughQuestion`, `PitchPackage` incl. `assumptions`, requests).
- HTTP contract + `ErrorCode`/envelopes ([`spec.md` §5](./spec.md)); status-code semantics.
- Input/count bounds and per-duration beat sequences ([`spec.md` §4.1](./spec.md)).
- Env var **names** and the module boundaries ([`file_plan.md` §2](./file_plan.md)).
- The shared files `lib/contracts.ts` and `lib/validation.ts`.
- The generation guarantees in [`spec.md` §6](./spec.md) (persona, never-invent, `projectTerms` specificity, untrusted-input framing, assumptions surfacing).

**Evolvable:** prompt wording and audience/duration copy (behind fixtures — PR-04); component internals, styling, microcopy; loading-stage labels; the regenerate token strategy.

---

## 8. Scope-cut rules

- No full mock flow by ~02:00 → stop polish, focus PR-06 display + PR-07.
- Generate unstable by the final hour → cut the **regenerate slice of PR-06** (`api/regenerate` + client merge); ship display only.
- Weak question quality → cut animations/copy, invest in PR-04 prompt tuning.
- Unstable deploy → run local fallback with clear disclosure (**E10**).
- Big `page.tsx` conflict → LANE-B owns it; LANE-C works through props/hooks.
- Remove all P1/P2 the moment any P0 is unstable.

---

## 9. PR template

```markdown
## Summary
- What changed?
- Why is it needed for the demo?

## Scope
- [ ] UI  - [ ] API  - [ ] Prompt/schema  - [ ] Demo/release

## Test plan
1. ...

## Acceptance criteria (link E-x / spec section)
- [ ] ...

## Risks / follow-ups
- ...

## Screenshots or sample JSON
- Attach when relevant.
```

## 10. Pre-merge checklist

- [ ] Branch rebased on `main`, no conflicts.
- [ ] `npm run lint` passes.
- [ ] `npm run build` passes.
- [ ] `npm run test` passes (unit/contract); e2e where relevant.
- [ ] No secrets/API keys/`projectDescription` in logs or client bundle.
- [ ] Module boundaries respected (no server-only import in a browser-only file).
- [ ] No uncoordinated change to `lib/contracts.ts` / `lib/validation.ts`.
- [ ] PR acceptance criteria checked; one reviewer approved; squash-merged.

---

## 11. Definition of Done

Public URL opens with no login; paste a description, choose audience/duration/count, press Generate; the result includes a full `PitchPackage` (title, pitch beats, the selected number of `toughQuestions`, and honest `assumptions`); ≥4 of 5 demo questions reference the project directly via `projectTerms`; at least one beat and one answer are editable; Regenerate works **or** is removed from the UI (no broken button); an API error shows a friendly message while the previous result is preserved (**E5**); demo fallback ready and tested (**E10**); clean build with `main` marked as release candidate.
