import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { createSupabaseServer } from '@/lib/supabase/server';
import { SYSTEM_PROMPT, buildUserPrompt } from '@/lib/prompt';
import { createHash } from 'crypto';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { jobPosting, resume, tone, context, output, sessionToken } = body;

    // Validate inputs
    if (!jobPosting || !resume) {
      return NextResponse.json(
        { error: 'Job posting and resume are required' },
        { status: 400 }
      );
    }

    if (jobPosting.length < 50 || resume.length < 50) {
      return NextResponse.json(
        { error: 'Please provide complete job posting and resume content' },
        { status: 400 }
      );
    }

    // Hash IP for anonymous tracking (no PII stored)
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    const ipHash = createHash('sha256').update(ip).digest('hex').slice(0, 16);

    // Check for authenticated user
    let userId: string | null = null;
    try {
      const supabase = await createSupabaseServer();
      const { data: { user } } = await supabase.auth.getUser();
      userId = user?.id ?? null;
    } catch {}

    // Store session in Supabase
    const token = sessionToken || crypto.randomUUID();
    const sessionData = {
      session_token: token,
      job_posting: jobPosting,
      resume: resume,
      tone: tone || 'balanced',
      context: context || 'external',
      output_preference: output || 'both',
      ip_hash: ipHash,
      user_id: userId,
    };

    const { data: session, error: sessionError } = await getSupabaseAdmin()
      .from('sessions')
      .upsert(sessionData, { onConflict: 'session_token' })
      .select()
      .single();

    if (sessionError) {
      console.error('Session storage error:', sessionError);
      // Don't fail the request — continue without storage
    }

    const sessionId = session?.id;

    // Build the prompt
    const userPrompt = buildUserPrompt(
      jobPosting,
      resume,
      tone || 'balanced',
      context || 'external',
      output || 'both'
    );

    // Call OpenAI (non-streaming for reliability, returns structured JSON)
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3, // Lower temp = more consistent, professional output
      max_tokens: 8000,
    });

    const rawOutput = completion.choices[0]?.message?.content;
    if (!rawOutput) {
      return NextResponse.json({ error: 'No output generated' }, { status: 500 });
    }

    let parsed;
    try {
      parsed = JSON.parse(rawOutput);
    } catch {
      return NextResponse.json({ error: 'Failed to parse AI output' }, { status: 500 });
    }

    // Store generated documents in Supabase
    if (sessionId) {
      const docs = [
        { session_id: sessionId, doc_type: 'resume' as const, content: parsed.resume, version: 1 },
        { session_id: sessionId, doc_type: 'cover_letter' as const, content: parsed.coverLetter, version: 1 },
        { session_id: sessionId, doc_type: 'ats_report' as const, content: JSON.stringify(parsed.atsReport), version: 1 },
      ];

      const { error: docsError } = await getSupabaseAdmin()
        .from('documents')
        .insert(docs);

      if (docsError) {
        console.error('Document storage error:', docsError);
      }
    }

    return NextResponse.json({
      sessionToken: token,
      sessionId,
      mandateAnalysis: parsed.mandateAnalysis,
      strategicAdvantage: parsed.strategicAdvantage,
      resume: parsed.resume,
      coverLetter: parsed.coverLetter,
      atsReport: parsed.atsReport,
      redlineChanges: parsed.redlineChanges,
      usage: {
        promptTokens: completion.usage?.prompt_tokens,
        completionTokens: completion.usage?.completion_tokens,
      },
    });

  } catch (error: unknown) {
    console.error('Analyze error:', error);
    const message = error instanceof Error ? error.message : 'Analysis failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
