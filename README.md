# HireAI — AI Recruitment Intelligence Platform

A multi-tenant recruiting platform that parses resumes, ranks candidates against a
role, runs AI voice screening interviews, and turns the results into structured
interview intelligence, fraud signals, and hiring recommendations.

Built with Next.js 15 (App Router), React 19, TypeScript, Prisma/PostgreSQL, and a
Bolna voice agent for outbound screening calls. Resume/JD extraction uses Google
Gemini with a deterministic heuristic fallback so the product degrades gracefully
when AI is unavailable.

---

## Features

- **Authentication & multi-tenancy** — email/password auth with `scrypt` hashing,
  signed session cookies with server-verifiable expiry, email verification, and
  every record scoped to its owning user.
- **Job management** — create roles with required skills and an AI-generated
  interviewer prompt (`smartPrompt`).
- **Resume parsing & intelligence** — upload a PDF/text resume to extract contact
  details, skills, a deterministic **skill-match score**, an extraction
  **confidence** score, and AI-assisted strengths/weaknesses/summary.
- **Candidate ranking** — a multi-dimension scorecard (skill match, technical,
  experience, communication, education, confidence) that redistributes weight
  across whatever signals are actually available.
- **AI voice screening** — trigger single or batched outbound calls via Bolna; a
  signed webhook writes back scores and the transcript idempotently.
- **Interview intelligence** — deterministic, explainable analysis of a transcript:
  communication, confidence, speaking-quality, and overall scores plus a summary
  and recommendation.
- **Fraud detection** — lightweight checks for disposable emails, keyword
  stuffing, inconsistent/implausible experience, and near-duplicate resumes.
- **Candidate comparison** — side-by-side pros/cons, hiring risk, and a best-fit
  pick across candidates.
- **Interview scheduling** — a scheduling workflow (phone/video/onsite) backed by
  a first-class `Interview` model.
- **Analytics dashboard** — pipeline, score, and funnel views.

---

## Architecture

```
Browser (React 19 client pages)
  │  fetch → JSON API
  ▼
Next.js App Router
  ├── middleware.ts ......... edge auth gate (signed session cookie)
  ├── src/app/api/* ......... route handlers, all wrapped by withRoute()
  │      • requireUser() / assertSameOrigin() / enforceRateLimit()
  │      • Zod-validated inputs, typed JSON responses
  ├── src/services/* ........ business logic (bolna, parsing, fraud,
  │                           interview-intelligence, comparison, candidate)
  └── src/lib/* ............. env, auth/session, api helpers, serializers,
                             rate-limit, http, logger, ranking, constants
  ▼
Prisma → PostgreSQL   ·   Bolna (voice)   ·   Gemini (parsing)   ·   Resend (email)
```

Key conventions:

- **`src/env.ts`** validates all environment variables at boot with Zod. Required
  secrets (e.g. `AUTH_SECRET`) fail closed — there are no insecure fallbacks.
- **`withRoute()`** ([src/lib/api.ts](src/lib/api.ts)) centralizes error handling:
  throw a typed `ApiError` (or a `ZodError`) and it becomes a consistent JSON
  response; unexpected errors are logged and never leak internals in production.
- **Serializers** ([src/lib/serializers.ts](src/lib/serializers.ts)) parse the
  JSON-string columns defensively so one malformed row cannot break a list.
- **Pure, testable modules** — ranking, fraud detection, interview intelligence,
  and comparison are pure functions with unit tests.

---

## Getting started

### Prerequisites

- Node.js 22+
- PostgreSQL 14+

### Setup

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
#   - set DATABASE_URL to your PostgreSQL connection string
#   - generate a session secret:  openssl rand -hex 48  → AUTH_SECRET
#   - (optional) RESEND_API_KEY + EMAIL_FROM for real verification emails
#   - (optional) GOOGLE_AI_API_KEY to enable AI parsing (heuristics otherwise)
#   - (recommended) BOLNA_WEBHOOK_SECRET to authenticate inbound webhooks

# 3. Apply the database schema
npx prisma migrate deploy      # fresh database
# If your database was previously created with `prisma db push`, baseline it once:
#   npx prisma migrate resolve --applied 20260704000000_baseline

# 4. Run the app
npm run dev
```

Bolna API key + agent id are configured **per recruiter** in the in-app Settings
page (stored per-user), not via environment variables.

### Local webhooks

Bolna posts call results to `/api/bolna/webhook`. For local testing, expose your
dev server (e.g. `npm run dev:webhook`, which runs ngrok) and set the tunnel URL —
with `?token=<BOLNA_WEBHOOK_SECRET>` — as the webhook in Bolna.

---

## Scripts

| Script                             | Description                                         |
| ---------------------------------- | --------------------------------------------------- |
| `npm run dev`                      | Start the dev server                                |
| `npm run build`                    | Production build (`prisma generate` + `next build`) |
| `npm start`                        | Start the production server                         |
| `npm run typecheck`                | `tsc --noEmit`                                      |
| `npm run lint`                     | ESLint                                              |
| `npm run format` / `format:check`  | Prettier write / check                              |
| `npm test`                         | Run the Vitest unit suite                           |
| `npm run db:migrate` / `db:deploy` | Prisma migrations                                   |

---

## Testing

Unit tests (Vitest) cover the security-critical and business-logic modules:
session tokens & password hashing, webhook signature verification, Zod schemas,
resume parsing, ranking, fraud detection, interview intelligence, and comparison.

```bash
npm test
```

CI ([.github/workflows/ci.yml](.github/workflows/ci.yml)) runs typecheck, lint,
format check, tests, and a production build on every push and PR.

---

## Deployment (Docker)

The app builds to a standalone Next.js server.

```bash
docker build -t hireai .
docker run -p 3000:3000 --env-file .env hireai
```

Run `npx prisma migrate deploy` against your database as a release step.

---

## Security notes

- Sessions are HMAC-signed cookies with a server-verified expiry; `AUTH_SECRET`
  is required (no fallback).
- Mutating endpoints enforce a same-origin check (CSRF) and per-key rate limits.
- The Bolna webhook is verified by HMAC signature or shared-secret token when
  `BOLNA_WEBHOOK_SECRET` is set.
- All queries are tenant-scoped by `userId`; cross-entity references are
  ownership-checked.
- Inputs are validated with Zod; error responses never leak internals in prod.

---

## Project structure

```
src/
  app/            Next.js routes (pages + /api route handlers)
  components/     UI components (layout, cards, modals)
  context/        Client-side app/session context
  lib/            env, auth/session, api helpers, serializers, rate-limit,
                  http, logger, ranking, text-metrics, constants, schemas
  services/       bolna, parsing, fraud-detection, interview-intelligence,
                  comparison, candidate, auth
  types/          Shared domain types
prisma/
  schema.prisma   Data model
  migrations/     SQL migrations (baseline + platform upgrade)
```
