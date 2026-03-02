# EBRB — Executive Brand & Resume Builder

A premium, AI-powered resume positioning platform built by executive recruiter John Nilon (30+ years in talent acquisition).

## What It Does

EBRB decodes what employers actually need in a role, then repositions your career narrative around that mandate. Not a template tool — a strategic repositioning engine.

**Core flow:**
1. Upload job posting + resume
2. AI decodes employer mandate & capability signals
3. Generates tailored resume, cover letter, ATS keyword report
4. Shows before/after keyword alignment + redline comparison

## Tech Stack

- **Framework:** Next.js 15 (App Router, TypeScript)
- **Styling:** Tailwind CSS + custom design tokens
- **Animation:** Framer Motion
- **Hosting:** Vercel-ready
- **Auth:** Clerk (ready to integrate)
- **Backend:** OpenAI API (custom prompt reverse-engineered from working GPT, ready for direct API integration)

## Structure

```
src/app/
├── page.tsx           # Landing page (6 sections, full scroll experience)
├── intake/page.tsx    # Job posting + resume upload (3-step wizard)
├── process/page.tsx   # Live AI analysis screen (12-step analysis with insights)
├── results/page.tsx   # Resume preview + export (multi-doc viewer, refinement)
├── layout.tsx         # Root layout with fonts + globals
└── globals.css        # Design system (colors, typography, animations)
```

## Design System

**Colors:**
- Navy `#0E1A2B` (primary background)
- Gold `#C5933A` (accent, authority)
- Cream `#F9F7F3` (off-white, premium paper feel)
- Slate `#4A5568` (neutral text)

**Typography:**
- Display: Cormorant Garamond (editorial, premium)
- Body: Inter (clean, modern)
- Mono: IBM Plex Mono (code/technical)

**Spacing & Motion:**
- Smooth fade-ins, no bouncy animations
- Generous whitespace (premium aesthetic)
- Progress indicators on key flows

## Getting Started

```bash
cd ~/clawd/projects/ebrb-app
npm run dev
```

Then open http://localhost:3000

## Pages

### `/` — Landing Page
- Hero section with immediate value prop
- Transformation demo (before/after examples)
- How It Works (4-step process)
- ATS alignment visualization
- About John Nilon (credibility founder)
- Pricing (3 tiers: Preview/Executive/Unlimited)
- Final CTA

### `/intake` — Brand Interview Flow
- Step 1: Job posting (paste/upload)
- Step 2: Resume (paste/upload)
- Step 3: Preferences (tone, output format, context)
- Animated transitions between steps
- Real-time validation

### `/process` — AI Analysis Screen
- Live streaming analysis log (12 steps)
- Typewriter-effect details on each step
- Recruiter insights carousel
- Progress bar
- Auto-navigates to `/results` when done

### `/results` — Output & Refinement
- Side-by-side document viewer (resume/cover/ATS report)
- Redline comparison tab (what changed & why)
- Refinement input + quick-action chips
- Export options (PDF, Word, Google Apps Script, email)
- Version history
- Next steps upsell

## Backend Integration (Next Steps)

Currently, the frontend is fully built. To wire up the backend:

1. **Create `/api/analyze` endpoint** that:
   - Accepts: job posting, resume, tone, context, output preference
   - Calls OpenAI with the reverse-engineered system prompt
   - Returns: tailored resume, cover letter, ATS report
   - Streams analysis steps to client for progress UI

2. **Create `/api/refine` endpoint** for iterative refinement

3. **Add authentication** (Clerk integration ready)

4. **Add document storage** (Supabase or similar for version history)

5. **Wire payment** (Stripe integration for tiers)

## The Reverse-Engineered Prompt

Located at: `~/clawd/projects/exec-brand-resume/system-prompt-v1.md`

This is based on reverse-engineering the working GPT from the Sara Lovett workflow example. When the actual system prompt is available, replace this file and redeploy.

## Key Features Ready to Implement

- ✅ Landing page (full, polished, conversion-focused)
- ✅ Intake flow (multi-step, animated, validated)
- ✅ Process screen (streaming analysis visualization)
- ✅ Results viewer (document preview, export, refinement UI)
- ✅ Design system (comprehensive, premium aesthetic)
- ✅ Mobile responsive (all screens)
- ⏳ Backend API (prompt ready, needs OpenAI endpoint)
- ⏳ Authentication (Clerk config ready)
- ⏳ Payment (Stripe integration ready)
- ⏳ Document storage (schema ready for Supabase)

## Deployment

```bash
# Build
npm run build

# Deploy to Vercel
vercel deploy
```

Or push to GitHub and connect to Vercel for auto-deploy.

## Notes for John Nilon

This frontend is built to:
1. **Signal premium quality** — Navy + gold + Cormorant typeface = executive-grade positioning
2. **Build trust instantly** — Your story on the landing page, real transformation examples
3. **Make the AI work visible** — Process screen shows the intelligence happening in real-time
4. **Enable refinement loops** — Results page supports iteration without full rebuilds
5. **Convert free → paid** — Preview tier proves value before payment gate

The backend system prompt is ready to integrate. Once you have the actual GPT system instructions, swap out `system-prompt-v1.md` and we're live.

---

**Built for John Nilon, J.N. Solutions**
*30 years of executive search expertise + AI positioning engine*
