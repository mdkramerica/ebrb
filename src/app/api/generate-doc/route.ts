import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { DOC_TYPE_TIER } from '@/lib/tiers';
import type { Tier } from '@/lib/tiers';
import { requireUser, getUserTier, assertTier, requireSessionOwnership } from '@/lib/api/auth';
import { enforceRateLimit } from '@/lib/api/rate-limit';
import { getOpenAI, INJECTION_GUARD } from '@/lib/api/openai';
import { handleRouteError, notFound, badRequest } from '@/lib/api/errors';
import { INPUT_LIMITS, fenceUserContent, requireEnum, requireString, requireUuid } from '@/lib/api/validation';

const DOC_PROMPTS: Record<string, string> = {
  executive_bio: `Generate a polished executive biography of approximately 300 words.

Requirements:
- Written in third person
- Opens with the executive's name, current title, and the core value they bring
- Covers career arc briefly (no more than 2-3 sentences on history)
- Highlights 2-3 signature achievements with specific outcomes
- Closes with forward-looking positioning (what they're focused on / what kind of organizations benefit most from their leadership)
- Never use "passionate about", "results-driven", "proven track record", or generic executive clichés
- Tone: authoritative, specific, memorable

Return plain text only. No JSON.`,

  linkedin_summary: `Generate a LinkedIn About section (profile summary) of 200-300 words.

Requirements:
- Written in first person
- Opens with a positioning statement (not "I'm a ___", but an outcome or mandate statement)
- Covers the type of problems they solve and the outcomes they create reliably
- Includes 2-3 specific achievements or numbers
- Ends with a clear call to action or what kinds of opportunities/conversations they welcome
- Appropriate for a LinkedIn audience: slightly warmer than a resume but still authoritative
- No clichés. No generic leadership phrases.

Return plain text only. No JSON.`,

  board_bio: `Generate a board-ready biography of approximately 250 words.

Requirements:
- Written in third person
- Emphasizes governance experience, fiduciary oversight, risk management, and strategic advisory capacity
- Highlights cross-industry or cross-functional perspective that would benefit a board
- Specific about scale of organizations led and outcomes achieved at a governance level
- Closes with current board affiliations (if any mentioned) or note "(Board affiliations to be added)"
- Tone: formal, authoritative, concise

Return plain text only. No JSON.`,

  speaking_intro: `Generate a 60-second speaking introduction (approximately 150 words when read at a comfortable pace).

Requirements:
- Written in third person (for a moderator or host to read aloud)
- Opens with the speaker's name and the reason they're uniquely qualified to speak on this topic
- Covers 2-3 relevant career highlights or credentials
- Builds anticipation for what the audience will learn or gain
- Ends with: "Please welcome, [Name]."
- Energetic but not hyperbolic. Authoritative but accessible.

Return plain text only. No JSON.`,

  interview_stories: `Convert the resume achievements into structured interview stories using the STAR format.

For each Key Accomplishment and each strong role achievement bullet, generate a STAR story:
- Situation: 1-2 sentences of context (the challenge or opportunity that existed)
- Task: What was specifically required of the candidate in this situation
- Action: What the candidate did (this should be secondary to the outcome)
- Result: The measurable outcome (this is what the resume bullet led with)

Format each story as:
**[Achievement Topic]**
Situation: ...
Task: ...
Action: ...
Result: ...

Also include 3-5 anticipation questions — the mandate-aligned questions an interviewer is likely to ask based on the resume — with a 1-sentence response framework for each.

Return plain text only. No JSON.`,

  traction_diagnostic: `Analyze this resume and provide a traction diagnostic.

Assess the following and provide specific, honest feedback:

1. ACCESS ANALYSIS (getting seen)
- ATS keyword density vs. the target positioning
- Headline/title strength for search visibility
- Whether the most important keywords appear in the top third of the resume

2. SELECTION CONFIDENCE ANALYSIS (being chosen once seen)
- Does the Value Proposition answer "Why hire you?" specifically?
- Are achievements outcome-first, or do they lead with tasks/duties?
- Is the candidate differentiated, or interchangeable with other applicants at this level?
- Does the resume build confidence in predicted future performance?

3. TOP 3 SPECIFIC IMPROVEMENTS
- The three highest-impact changes this candidate should make
- Be direct and specific — name the section and the exact issue

Format the output as a professional assessment, not a list of generic tips.
Return plain text only. No JSON.`,

  positioning_brief: `Generate an executive positioning brief of approximately 300 words.

This is an internal strategic document that helps the candidate articulate their brand clearly.

Include:
1. POSITIONING STATEMENT (2-3 sentences): The executive's through-line — what they're hired to do, repeatedly, across organizations
2. DIFFERENTIATION FACTORS (3 bullets): What makes this executive distinctly valuable vs. peers at the same level
3. IDEAL MANDATE: What type of role, organization, or challenge would best leverage this executive's strengths
4. PROOF POINTS (3): The 3 achievements that most powerfully demonstrate the positioning
5. NARRATIVE GAPS: One honest assessment of where the positioning currently lacks evidence or clarity

Tone: strategic, honest, specific. This is for the executive's own use — no marketing language.
Return plain text only. No JSON.`,
};

const ALLOWED_DOC_TYPES = Object.keys(DOC_PROMPTS) as readonly string[];

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    await enforceRateLimit('generate-doc', { kind: 'user', userId: user.id });

    const body = await req.json();
    const sessionId = requireUuid('sessionId', body.sessionId);
    const docType = requireEnum('docType', body.docType, ALLOWED_DOC_TYPES);
    const customInstructions = body.customInstructions
      ? requireString('customInstructions', body.customInstructions, { max: INPUT_LIMITS.customInstructions })
      : '';

    const requiredTier = DOC_TYPE_TIER[docType] as Tier;
    const userTier = await getUserTier(user.id);
    assertTier(userTier, requiredTier);

    await requireSessionOwnership(user.id, sessionId);

    const { data: session } = await getSupabaseAdmin()
      .from('sessions')
      .select('job_posting, resume')
      .eq('id', sessionId)
      .single();
    if (!session) throw notFound('Session not found.');

    const { data: resumeDoc } = await getSupabaseAdmin()
      .from('documents')
      .select('content')
      .eq('session_id', sessionId)
      .eq('doc_type', 'resume')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    const resumeContent = resumeDoc?.content || session.resume;

    const docPrompt = DOC_PROMPTS[docType];
    const customNote = customInstructions
      ? `\n\nAdditional instructions:\n${fenceUserContent('customInstructions', customInstructions)}`
      : '';

    const userMessage = `${INJECTION_GUARD}

Based on the resume below, ${docPrompt}${customNote}

RESUME:
${fenceUserContent('resume', resumeContent)}

${session.job_posting ? `JOB POSTING CONTEXT:\n${fenceUserContent('jobPosting', session.job_posting.slice(0, 2000))}` : ''}`;

    const completion = await getOpenAI().chat.completions.create({
      model: 'gpt-4.1',
      messages: [
        {
          role: 'system',
          content: `You are the Executive Brand & Resume Builder, applying the J.N. Solutions outcome-first methodology. Generate the requested document based on the resume provided. Be specific, direct, and never use generic executive clichés. Apply the Hiring Outcome Model silently: every output should increase decision confidence in the candidate.`,
        },
        { role: 'user', content: userMessage },
      ],
      temperature: 0.4,
      max_tokens: 6000,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) throw badRequest('No content generated.');

    const { data: doc, error: docError } = await getSupabaseAdmin()
      .from('documents')
      .insert({
        session_id: sessionId,
        doc_type: docType,
        content,
        version: 1,
      })
      .select()
      .single();

    if (docError) {
      console.error('Document storage error:', docError);
    }

    return NextResponse.json({
      docId: doc?.id,
      docType,
      content,
    });
  } catch (error) {
    return handleRouteError('generate-doc', error);
  }
}
