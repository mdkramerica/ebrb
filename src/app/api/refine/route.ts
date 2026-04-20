import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { SYSTEM_PROMPT } from '@/lib/prompt';
import { requireUser, requireSessionOwnership } from '@/lib/api/auth';
import { enforceRateLimit } from '@/lib/api/rate-limit';
import { getOpenAI, INJECTION_GUARD } from '@/lib/api/openai';
import { handleRouteError, badRequest } from '@/lib/api/errors';
import { INPUT_LIMITS, fenceUserContent, requireEnum, requireString, requireUuid } from '@/lib/api/validation';
import { DOC_TYPE_LABELS } from '@/lib/tiers';

const REFINABLE_DOC_TYPES = Object.keys(DOC_TYPE_LABELS) as readonly string[];

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    await enforceRateLimit('refine', { kind: 'user', userId: user.id });

    const body = await req.json();
    const instruction = requireString('instruction', body.instruction, {
      min: 3,
      max: INPUT_LIMITS.instruction,
    });
    const currentContent = requireString('currentContent', body.currentContent, {
      min: 10,
      max: INPUT_LIMITS.content,
    });

    let sessionId: string | null = null;
    let docType: string | null = null;
    if (body.sessionId !== undefined || body.docType !== undefined) {
      sessionId = requireUuid('sessionId', body.sessionId);
      docType = requireEnum('docType', body.docType, REFINABLE_DOC_TYPES);
      await requireSessionOwnership(user.id, sessionId);
    }

    const refinePrompt = `You are refining an already-written executive resume document.

${INJECTION_GUARD}

REFINEMENT INSTRUCTION:
${fenceUserContent('instruction', instruction)}

CURRENT DOCUMENT:
${fenceUserContent('currentContent', currentContent)}

Apply the refinement instruction to the document above. Return ONLY the refined document text — no commentary, no explanation, no JSON. Just the improved document.

Rules:
- Preserve all section structure (VALUE PROPOSITION, KEY ACCOMPLISHMENTS, etc.)
- Apply the specific change requested and nothing else
- Maintain the executive positioning tone throughout
- Do not add new sections unless explicitly asked
- Do not remove content unless explicitly asked to trim/condense`;

    const completion = await getOpenAI().chat.completions.create({
      model: 'gpt-4.1',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: refinePrompt },
      ],
      temperature: 0.3,
      max_tokens: 6000,
    });

    const refined = completion.choices[0]?.message?.content;
    if (!refined) throw badRequest('No output generated.');

    if (sessionId && docType) {
      const { data: existing } = await getSupabaseAdmin()
        .from('documents')
        .select('version')
        .eq('session_id', sessionId)
        .eq('doc_type', docType)
        .order('version', { ascending: false })
        .limit(1)
        .single();

      const nextVersion = (existing?.version || 1) + 1;

      await getSupabaseAdmin()
        .from('documents')
        .insert({
          session_id: sessionId,
          doc_type: docType,
          content: refined,
          version: nextVersion,
        });
    }

    return NextResponse.json({ refined });
  } catch (error) {
    return handleRouteError('refine', error);
  }
}
