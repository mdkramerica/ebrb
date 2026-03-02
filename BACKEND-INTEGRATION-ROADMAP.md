# Backend Integration Roadmap
## From Frontend to Live Product

---

## Phase 1: API Endpoint Setup (1-2 days)

### 1.1 Create `/api/analyze` Endpoint

**File:** `src/app/api/analyze/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { jobPosting, resume, tone, context, output } = body;

  // Validate inputs
  if (!jobPosting || !resume) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  try {
    // Stream response to client
    const stream = new ReadableStream({
      async start(controller) {
        const completion = await openai.chat.completions.create({
          model: 'gpt-4o',
          stream: true,
          messages: [
            {
              role: 'system',
              content: SYSTEM_PROMPT, // Load from ~/clawd/projects/exec-brand-resume/system-prompt-v1.md or actual GPT prompt
            },
            {
              role: 'user',
              content: `Job Posting:\n${jobPosting}\n\nResume:\n${resume}\n\nPreferences: Tone=${tone}, Context=${context}, Output=${output}`,
            },
          ],
        });

        for await (const event of completion) {
          if (event.choices[0].delta.content) {
            const text = event.choices[0].delta.content;
            controller.enqueue(new TextEncoder().encode(text));
          }
        }
        controller.close();
      },
    });

    return new NextResponse(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error) {
    console.error('Analysis error:', error);
    return NextResponse.json({ error: 'Analysis failed' }, { status: 500 });
  }
}
```

### 1.2 Load System Prompt

**Option A: From file**
```typescript
import fs from 'fs';
import path from 'path';

const SYSTEM_PROMPT = fs.readFileSync(
  path.join(process.cwd(), '../exec-brand-resume/system-prompt-v1.md'),
  'utf8'
);
```

**Option B: From environment variable** (more secure for production)
```typescript
const SYSTEM_PROMPT = process.env.SYSTEM_PROMPT || '';
```

### 1.3 Update `/process` Page to Call API

**File:** `src/app/process/page.tsx`

Replace the mock analysis with real API call:

```typescript
useEffect(() => {
  const form = JSON.parse(sessionStorage.getItem('ebrb_form') || '{}');
  
  fetch('/api/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(form),
  })
    .then(res => res.body?.getReader())
    .then(reader => {
      // Stream chunks and update UI...
    });
}, []);
```

---

## Phase 2: Authentication (2-3 days)

### 2.1 Set Up Clerk

```bash
npm install @clerk/nextjs
```

**File:** `.env.local`
```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
```

**File:** `src/middleware.ts`
```typescript
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

const isProtectedRoute = createRouteMatcher([
  '/intake(.*)',
  '/process(.*)',
  '/results(.*)',
  '/api/analyze(.*)',
]);

export default clerkMiddleware((auth, req) => {
  if (isProtectedRoute(req)) auth().protect();
});

export const config = {
  matcher: ['/((?!.*\\..*|_next).*)', '/', '/(api|trpc)(.*)'],
};
```

**File:** `src/app/layout.tsx`
```typescript
import { ClerkProvider } from '@clerk/nextjs';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body>{children}</body>
      </html>
    </ClerkProvider>
  );
}
```

### 2.2 Protect Routes

Wrap protected pages with `<SignedIn>` / `<SignedOut>`:

```typescript
import { SignedIn, SignedOut, RedirectToSignIn } from '@clerk/nextjs';

export default function IntakePage() {
  return (
    <>
      <SignedIn>
        {/* Your intake UI */}
      </SignedIn>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
    </>
  );
}
```

---

## Phase 3: Document Storage (2-3 days)

### 3.1 Supabase Setup

```bash
npm install @supabase/supabase-js
```

**Create tables:**

```sql
-- users (extends Clerk)
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT UNIQUE,
  name TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  tier TEXT DEFAULT 'free'
);

-- documents
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  job_posting TEXT,
  resume TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- generated_output
CREATE TABLE generated_output (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID REFERENCES documents(id),
  output_type TEXT, -- 'resume' | 'cover_letter' | 'ats_report'
  content TEXT,
  tone TEXT,
  context TEXT,
  version INT DEFAULT 1,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE generated_output ENABLE ROW LEVEL SECURITY;
```

### 3.2 Store Results

**File:** `src/app/api/analyze/route.ts` (update)

```typescript
import { createClient } from '@supabase/supabase-js';
import { auth } from '@clerk/nextjs/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export async function POST(req: NextRequest) {
  const { userId } = auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { jobPosting, resume, tone, context, output } = body;

  // Save document
  const { data: doc } = await supabase
    .from('documents')
    .insert({ user_id: userId, job_posting: jobPosting, resume })
    .select()
    .single();

  // Generate analysis and save output...
  // [API streaming logic here]
}
```

---

## Phase 4: Payments (2-3 days)

### 4.1 Stripe Setup

```bash
npm install stripe @stripe/stripe-js
```

**File:** `.env.local`
```
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

### 4.2 Pricing Tiers

**File:** `src/lib/stripe.ts`

```typescript
export const PLANS = {
  free: {
    name: 'Preview',
    price: 0,
    features: ['Full mandate decoding', 'Draft resume'],
  },
  executive: {
    name: 'Executive',
    price: 5900, // $59 in cents
    features: ['Full tailored resume', 'Cover letter', 'ATS report', 'PDF + Word + Google Doc'],
  },
  unlimited: {
    name: 'Unlimited',
    price: 9900, // $99 in cents
    recurring: 'month',
    features: ['Unlimited applications', 'Version history', 'Priority processing'],
  },
};
```

### 4.3 Checkout Endpoint

**File:** `src/app/api/checkout/route.ts`

```typescript
import Stripe from 'stripe';
import { auth } from '@clerk/nextjs/server';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: NextRequest) {
  const { userId } = auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { plan } = body;

  const session = await stripe.checkout.sessions.create({
    mode: plan === 'unlimited' ? 'subscription' : 'payment',
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: { name: plan },
          unit_amount: PLANS[plan].price,
          recurring: PLANS[plan].recurring ? { interval: PLANS[plan].recurring } : undefined,
        },
        quantity: 1,
      },
    ],
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/results?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/results`,
  });

  return NextResponse.json({ url: session.url });
}
```

### 4.4 Verify Payment

**File:** `src/lib/auth.ts`

```typescript
export async function checkUserTier(userId: string) {
  const { data: user } = await supabase
    .from('users')
    .select('tier')
    .eq('id', userId)
    .single();

  return user?.tier || 'free';
}
```

---

## Phase 5: Error Handling & Refinement (1-2 days)

### 5.1 Retry Logic

```typescript
async function analyzeWithRetry(input, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fetch('/api/analyze', {
        method: 'POST',
        body: JSON.stringify(input),
      });
    } catch (err) {
      if (i === maxRetries - 1) throw err;
      await new Promise(r => setTimeout(r, 2 ** i * 1000)); // exponential backoff
    }
  }
}
```

### 5.2 Error Boundaries

```typescript
import { ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || <div>Something went wrong. Please try again.</div>;
    }
    return this.props.children;
  }
}
```

---

## Deployment Checklist

- [ ] OpenAI API key in `.env`
- [ ] Supabase project created, tables configured, RLS enabled
- [ ] Clerk project created, keys in `.env`
- [ ] Stripe keys in `.env`
- [ ] Build test: `npm run build` succeeds
- [ ] All routes protected appropriately
- [ ] Error handling in place
- [ ] Logging configured
- [ ] Analytics wired up
- [ ] Deploy to Vercel

---

## Testing Commands

```bash
# Test locally
npm run dev

# Test build
npm run build

# Test API
curl -X POST http://localhost:3000/api/analyze \
  -H "Content-Type: application/json" \
  -d '{"jobPosting":"...","resume":"..."}'
```

---

## Estimated Timeline

| Phase | Tasks | Days |
|-------|-------|------|
| 1 | API endpoint + streaming | 1-2 |
| 2 | Clerk auth | 2-3 |
| 3 | Supabase storage | 2-3 |
| 4 | Stripe payments | 2-3 |
| 5 | Error handling + polish | 1-2 |
| **Total** | | **10-14 days** |

---

## Notes

- All code above is pseudocode/examples. Exact implementation depends on how you want to handle streaming, state management, etc.
- The system prompt (reverse-engineered at `system-prompt-v1.md`) should be swapped out with the actual GPT system instructions as soon as available.
- Consider adding request rate limiting on the API endpoints.
- Set up monitoring/logging (Sentry, LogRocket) early.

---

**Ready to start Phase 1? You have everything you need.**
