# Deploy Checklist — EBRB
## Railway + Supabase Setup (in order)

---

## STEP 1 — Supabase (5 min)

1. Go to https://supabase.com/dashboard
2. Create new project (or use existing)
3. Go to: Settings → API
4. Copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon/public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role key** → `SUPABASE_SERVICE_ROLE_KEY`

5. Go to: SQL Editor → New Query
6. Paste the entire contents of `supabase-schema.sql` → Run
7. Verify: Tables `sessions` and `documents` now exist

---

## STEP 2 — OpenAI API Key (2 min)

1. Go to https://platform.openai.com/api-keys
2. Create new key (or copy existing)
3. Save as: `OPENAI_API_KEY`

---

## STEP 3 — Railway Deploy (5 min)

### Option A: Deploy via GitHub (recommended)

1. Push repo to GitHub:
```bash
cd ~/clawd/projects/ebrb-app
git remote add origin https://github.com/YOUR_USERNAME/ebrb-app.git
git push -u origin main
```

2. Go to https://railway.app/new
3. Click "Deploy from GitHub repo"
4. Select `ebrb-app`
5. Railway auto-detects Next.js — click Deploy

### Option B: Deploy via CLI (after railway login)

```bash
cd ~/clawd/projects/ebrb-app
railway init        # creates new project
railway up          # deploys current directory
```

---

## STEP 4 — Set Environment Variables on Railway (3 min)

In Railway dashboard → your project → Variables tab, add:

```
OPENAI_API_KEY=sk-...
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
NEXT_PUBLIC_APP_URL=https://your-app.railway.app
```

Then redeploy (Railway auto-redeploys on variable change).

---

## STEP 5 — Verify (2 min)

Hit the health endpoint:
```
https://your-app.railway.app/api/health
```

Should return:
```json
{
  "status": "ok",
  "supabase": "connected",
  "openai": "configured"
}
```

If both show green — you're live.

---

## STEP 6 — Test End-to-End

1. Go to `https://your-app.railway.app`
2. Click "Get Started"
3. Paste a real job posting + resume
4. Submit → Watch the analysis screen
5. Results should populate with real AI-generated output
6. Check Supabase dashboard → Table Editor → sessions table should have a new row

---

## Env Vars Summary

| Variable | Where to get it |
|---|---|
| `OPENAI_API_KEY` | platform.openai.com/api-keys |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings → API |
| `NEXT_PUBLIC_APP_URL` | Your Railway app URL |

---

## Troubleshooting

**Build fails on Railway:**
- Check Node version: Railway should use Node 22 (set in `package.json` engines if needed)
- Check build logs for missing env vars

**Supabase connection error:**
- Verify service role key (not anon key) is in `SUPABASE_SERVICE_ROLE_KEY`
- Check RLS is enabled but API routes use service role (bypasses RLS)

**OpenAI errors:**
- Check API key has GPT-4o access
- Check usage limits/billing at platform.openai.com

**Analysis takes too long:**
- GPT-4o with 8k max tokens can take 30-60 seconds
- Consider adding a timeout message in the process page after 45s
