import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { getSupabaseAdmin } from '@/lib/supabase';
import { SYSTEM_PROMPT } from '@/lib/prompt';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { sessionId, instruction, docType, currentContent } = body;

    if (!instruction || !currentContent) {
      return NextResponse.json(
        { error: 'Instruction and current content are required' },
        { status: 400 }
      );
    }

    const refinePrompt = `You are refining an already-written executive resume document.

REFINEMENT INSTRUCTION: "${instruction}"

CURRENT DOCUMENT:
${currentContent}

Apply the refinement instruction to the document above. Return ONLY the refined document text — no commentary, no explanation, no JSON. Just the improved document.

Rules:
- Preserve all section structure (VALUE PROPOSITION, KEY ACCOMPLISHMENTS, etc.)
- Apply the specific change requested and nothing else
- Maintain the executive positioning tone throughout
- Do not add new sections unless explicitly asked
- Do not remove content unless explicitly asked to trim/condense`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: refinePrompt },
      ],
      temperature: 0.3,
      max_tokens: 4000,
    });

    const refined = completion.choices[0]?.message?.content;
    if (!refined) {
      return NextResponse.json({ error: 'No output generated' }, { status: 500 });
    }

    // Store new version in Supabase if we have a session
    if (sessionId && docType) {
      // Get current version count
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

  } catch (error: unknown) {
    console.error('Refine error:', error);
    const message = error instanceof Error ? error.message : 'Refinement failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
