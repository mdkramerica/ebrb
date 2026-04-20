import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { SYSTEM_PROMPT, buildUserPrompt } from '@/lib/prompt';
import { getAnalysisLimit } from '@/lib/tiers';
import type { Tier } from '@/lib/tiers';
import { getOptionalUser, getUserTier } from '@/lib/api/auth';
import { enforceRateLimit, extractIp, hashIp } from '@/lib/api/rate-limit';
import { getOpenAI } from '@/lib/api/openai';
import { handleRouteError, badRequest, paymentRequired } from '@/lib/api/errors';
import { parseAnalyzeOutput } from '@/lib/api/analyze-schema';
import { INPUT_LIMITS, requireEnum, requireString } from '@/lib/api/validation';

const TONES = ['concise', 'balanced', 'detailed'] as const;
const CONTEXTS = ['internal', 'external'] as const;
const OUTPUTS = ['resume', 'both', 'full'] as const;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const jobPosting = requireString('jobPosting', body.jobPosting, {
      min: 50,
      max: INPUT_LIMITS.jobPosting,
    });
    const resume = requireString('resume', body.resume, {
      min: 50,
      max: INPUT_LIMITS.resume,
    });
    const tone = body.tone ? requireEnum('tone', body.tone, TONES) : 'balanced';
    const context = body.context ? requireEnum('context', body.context, CONTEXTS) : 'external';
    const output = body.output ? requireEnum('output', body.output, OUTPUTS) : 'both';
    const sessionToken = typeof body.sessionToken === 'string' ? body.sessionToken : undefined;

    const ip = extractIp(req.headers);
    const ipHash = hashIp(ip);

    const user = await getOptionalUser();

    if (user) {
      await enforceRateLimit('analyze', { kind: 'user', userId: user.id });

      const tier: Tier = await getUserTier(user.id);
      const limit = getAnalysisLimit(tier);
      if (limit !== Infinity) {
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const { count } = await getSupabaseAdmin()
          .from('sessions')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .gte('created_at', startOfMonth.toISOString());

        if ((count ?? 0) >= limit) {
          throw paymentRequired(
            `You've reached your ${limit} analysis limit for this month. Upgrade to run more analyses.`,
            { limitReached: true, tier },
          );
        }
      }
    } else {
      await enforceRateLimit('analyze', { kind: 'ip', ipHash });
    }

    const token = sessionToken || crypto.randomUUID();
    const sessionData = {
      session_token: token,
      job_posting: jobPosting,
      resume,
      tone,
      context,
      output_preference: output,
      ip_hash: ipHash,
      user_id: user?.id ?? null,
    };

    const { data: session, error: sessionError } = await getSupabaseAdmin()
      .from('sessions')
      .upsert(sessionData, { onConflict: 'session_token' })
      .select()
      .single();

    if (sessionError) {
      console.error('Session storage error:', sessionError);
    }

    const sessionId = session?.id;

    const userPrompt = buildUserPrompt(jobPosting, resume, tone, context, output);

    const completion = await getOpenAI().chat.completions.create({
      model: 'gpt-4.1',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
      max_tokens: 12000,
    });

    const rawOutput = completion.choices[0]?.message?.content;
    if (!rawOutput) throw badRequest('No output generated.');

    let parsedJson: unknown;
    try {
      parsedJson = JSON.parse(rawOutput);
    } catch {
      console.error('[analyze] JSON parse failure');
      throw badRequest('AI output was not valid JSON. Please retry.');
    }

    let parsed;
    try {
      parsed = parseAnalyzeOutput(parsedJson);
    } catch (e) {
      console.error('[analyze] schema mismatch', e);
      throw badRequest('AI output did not match the expected format. Please retry.');
    }

    if (sessionId) {
      await getSupabaseAdmin()
        .from('sessions')
        .update({
          intent: parsed.intentDetected,
          completion_status: parsed.completionStatus,
        })
        .eq('id', sessionId);

      const docs = [
        { session_id: sessionId, doc_type: 'resume', content: parsed.resume, version: 1 },
      ];
      if (parsed.coverLetter) {
        docs.push({
          session_id: sessionId,
          doc_type: 'cover_letter',
          content: parsed.coverLetter,
          version: 1,
        });
      }
      docs.push({
        session_id: sessionId,
        doc_type: 'ats_report',
        content: JSON.stringify(parsed.atsReport),
        version: 1,
      });

      const { error: docsError } = await getSupabaseAdmin()
        .from('documents')
        .insert(docs);
      if (docsError) console.error('Document storage error:', docsError);

      if (parsed.modularAchievements.length > 0 && user?.id) {
        const achievements = parsed.modularAchievements.map((content) => ({
          session_id: sessionId,
          user_id: user.id,
          content,
          tags: [],
        }));
        const { error: achievementsError } = await getSupabaseAdmin()
          .from('modular_achievements')
          .insert(achievements);
        if (achievementsError) console.error('Modular achievements error:', achievementsError);
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
      modularAchievements: parsed.modularAchievements,
      intentDetected: parsed.intentDetected,
      completionStatus: parsed.completionStatus,
      usage: {
        promptTokens: completion.usage?.prompt_tokens,
        completionTokens: completion.usage?.completion_tokens,
        cachedTokens: completion.usage?.prompt_tokens_details?.cached_tokens,
      },
    });
  } catch (error) {
    return handleRouteError('analyze', error);
  }
}
