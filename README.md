# Pitch Prep

Pitch Prep turns a project description into an audience- and duration-aware pitch, then prepares the presenter for specific tough questions.

## Prerequisites

- Node.js 20.9 or later
- npm 10 or later

## Local setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create a local environment file and add the required server-only OpenAI settings:

   ```bash
   cp .env.example .env.local
   ```

3. Start the development server:

   ```bash
   npm run dev
   ```

Open [http://localhost:3000](http://localhost:3000) in a browser.

## Available commands

- `npm run dev` — start the development server.
- `npm run lint` — run the project lint checks.
- `npm run build` — create a production build.
- `npm run start` — serve a production build.

## Environment variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `OPENAI_API_KEY` | Yes for live generation | Server-only OpenAI credential. Never expose it through `NEXT_PUBLIC_` variables. |
| `OPENAI_MODEL` | Yes for live generation | Server-side model identifier. |
| `NEXT_PUBLIC_ENABLE_DEMO_FALLBACK` | No | Enables a clearly labeled browser-only demo fallback when set to `true`. |

## Architecture boundary

The browser app lives in `app/` and `components/`. OpenAI credentials and provider calls will be confined to server-only modules and API routes. Shared request, response, and validation contracts will be added in the next PR.
