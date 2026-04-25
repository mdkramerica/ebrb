# EBRB — Executive Brand & Resume Builder

A premium AI-powered career positioning platform built by executive recruiter John Nilon (J.N. Solutions, 30+ years in talent acquisition). EBRB decodes what employers actually need in a role, then repositions a candidate's narrative around that mandate. Not a template tool — a strategic repositioning engine for CEOs, VPs, and C-suite executives.

## Core Flow

1. Upload job posting + resume
2. AI decodes the employer mandate and capability signals
3. System generates tailored resume, cover letter, and ATS keyword report
4. User sees before/after keyword alignment, redline comparison, and (on paid tiers) extended docs — executive bio, LinkedIn summary, interview stories, board bio, speaking intro

The product frames outcomes around two gaps: **Access** (getting past ATS/keyword filters) and **Selection** (hiring-committee confidence). Every output is shaped by the Achievement Formula: `[Result/Changed State] → [Limited Context] → [Optional Action]` — outcome-first, never action-first.

## Tech Stack

- **Framework:** Next.js 16.1.6 (App Router) + React 19 + TypeScript 5
- **Styling:** Tailwind CSS 4, Framer Motion, Radix UI primitives
- **Auth & DB:** Supabase (PostgreSQL, Auth with PKCE + email OTP, RLS)
- **AI:** OpenAI GPT-4.1 (12k max_tokens per analysis)
- **Docs:** `docx` + `jspdf` + `file-saver` for Word/PDF export
- **Hosting:** Railway (Nixpacks, health check at `/api/health`)
- **Node:** `>=22.0.0`, npm `>=10.0.0`

## Five-Layer AI Architecture

The AI "brain" is a single ~459-line system prompt at [src/lib/prompt.ts](src/lib/prompt.ts), injected into every OpenAI call. It encodes John Nilon's methodology (the source PDFs live in the untracked `EBRB Documents_3-10-2026/` folder) across five layers:

1. **Master Operating Rules** — behavior priority, tone handling, Achievement Formula, completion checklist
2. **Outcome-First Methodology (J.N. Solutions KD)** — Value Proposition discovery, Key Accomplishments, Job Mandate decoding
3. **Intent Detection & Routing** — classifies the first message into one of ~8 intents (direct_improvement, traction_diagnostic, positioning_discovery, interview_prep, etc.)
4. **Navigator Flows (A–F)** — multi-step protocols for each intent (e.g. Flow E is the 5-step direct-improvement pipeline)
5. **Hiring Outcome Model** — two-phase model (Access then Selection) that shapes every output silently

The layers are applied invisibly — users never see the framework named. Intent classification is done via regex keyword matching in the chat route (not a separate GPT call) for cost reasons.

## Directory Structure

```
src/
├── app/
│   ├── page.tsx               Landing page
│   ├── intake/                3-step wizard: job posting, resume, preferences
│   ├── process/               Streaming analysis visualization
│   ├── results/               Document viewer, redline, export, refinement
│   ├── chat/                  Guided chat sessions (Executive tier+)
│   ├── profile/               User profile, session history, achievement library
│   ├── login/, signup/        Supabase Auth UI
│   ├── auth/callback/         PKCE + OTP callback
│   └── api/
│       ├── analyze/           Main analysis engine
│       ├── refine/            Iterative refinement
│       ├── chat/              SSE streaming chat
│       ├── generate-doc/      Extended doc types (bio, LinkedIn, interview stories, etc.)
│       ├── claim-session/     Links anonymous sessions to new accounts
│       ├── my-results/        User's document index
│       ├── check-tier/        Lightweight tier flags endpoint
│       └── health/            Railway health check
├── components/                Nav, Logo, AuthProvider
├── lib/
│   ├── prompt.ts              Five-layer system prompt
│   ├── tiers.ts               Tier definitions, feature flags, doc-type gating
│   ├── public-origin.ts       Resolves public origin via x-forwarded-host
│   ├── safe-redirect.ts       Whitelist-based open-redirect prevention
│   ├── supabase/              client / server / admin / middleware
│   └── api/                   auth, errors, rate-limit, openai, validation, analyze-schema
└── middleware.ts              Protects /profile and /chat
```

## Database

Supabase schema lives in three SQL files:

- [supabase-schema.sql](supabase-schema.sql) — `sessions`, `documents`
- [supabase-migration-auth.sql](supabase-migration-auth.sql) — `profiles` (with tier), auto-create trigger, base RLS policies
- [supabase-migration-phase2.sql](supabase-migration-phase2.sql) — `conversations`, `messages`, `modular_achievements`, `rate_limits`

All API routes use the Supabase service role (admin) client and bypass RLS intentionally; ownership is enforced manually via helpers in [src/lib/api/auth.ts](src/lib/api/auth.ts) (`requireSessionOwnership`, `requireConversationOwnership`). RLS is enabled as a safety net.

## Tiers

Defined in [src/lib/tiers.ts](src/lib/tiers.ts):

| Tier       | Price    | Analyses/mo | Downloads | Extended docs            | Chat |
|------------|----------|-------------|-----------|--------------------------|------|
| Free       | Free     | 1           | preview   | no                       | no   |
| Executive  | $59      | 5           | PDF + DOCX | bio, LinkedIn, stories  | yes  |
| Unlimited  | $99/mo   | ∞           | PDF + DOCX | + board bio, speaking   | yes  |

Payment is not yet integrated — tier is set manually in the `profiles.tier` column.

## Security

Covered in the security-hardening pass:

- **Input limits** — jobPosting ≤ 50k, resume ≤ 20k, message ≤ 5k chars
- **Prompt-injection fencing** — user content is always wrapped in `<USER_CONTENT>...</USER_CONTENT>` with an injection-guard clause in the system prompt
- **DB-backed rate limiting** — sliding-window limiter in `rate_limits` table keyed by user UUID or IP hash; fails open on DB error
- **Ownership checks** — every API route that touches user data validates ownership explicitly
- **Generic error responses** — all errors return `{error, requestId}` with no stack traces
- **Safe redirects** — post-auth redirects run through a whitelist in [src/lib/safe-redirect.ts](src/lib/safe-redirect.ts)

## Local Development

```bash
npm install
npm run dev
```

Open http://localhost:3000.

Required environment variables (in `.env.local`):

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
OPENAI_API_KEY=
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Run all three SQL files against your Supabase project before first use.

## Deployment (Railway)

Config in [railway.toml](railway.toml): Nixpacks builder, `npm run start`, health check at `/api/health` (30s timeout), restart-on-failure with 3 max retries.

`/api/health` returns `{status, supabase, openai}` — use it to verify env wiring after deploy.

The auth callback depends on Railway's reverse proxy forwarding `x-forwarded-host`. [src/lib/public-origin.ts](src/lib/public-origin.ts) resolves the public origin in this order: `NEXT_PUBLIC_APP_URL` → `x-forwarded-host` + `x-forwarded-proto` → host header → `request.url`. Any new auth-redirect code must use `getPublicOrigin()` — never `new URL(request.url).origin` directly.

## Source Documents

John Nilon's methodology PDFs live in an untracked `EBRB Documents_3-10-2026/` folder at the repo root. They are the source material for the five-layer prompt and are deliberately not committed. See `Documents Explanation.docx` for the mapping from each PDF to its prompt layer.

---

Built for John Nilon, J.N. Solutions.
