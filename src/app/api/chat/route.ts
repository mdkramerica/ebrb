import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { SYSTEM_PROMPT } from '@/lib/prompt';
import {
  requireUser,
  requireAuth,
  getUserTier,
  assertTier,
  requireConversationOwnership,
} from '@/lib/api/auth';
import { enforceRateLimit } from '@/lib/api/rate-limit';
import { getOpenAI } from '@/lib/api/openai';
import { handleRouteError, notFound } from '@/lib/api/errors';
import { INPUT_LIMITS, requireString, requireUuid } from '@/lib/api/validation';

const MAX_HISTORY_TURNS = 40;

type IntentKey =
  | 'traction_diagnostic'
  | 'differentiation_discovery'
  | 'positioning_discovery'
  | 'direct_improvement'
  | 'career_positioning'
  | 'interview_prep'
  | 'general_question';

const INTENT_KEYWORDS: Array<{ intent: IntentKey; patterns: RegExp[] }> = [
  { intent: 'traction_diagnostic',      patterns: [/not getting (?:interviews?|callbacks?)/i, /no (?:interviews?|callbacks?)/i, /(?:resume|cv) (?:isn'?t|is not) working/i, /why (?:am i|aren'?t i) (?:getting|hearing)/i] },
  { intent: 'differentiation_discovery', patterns: [/stand out/i, /differentiate/i, /look stronger/i, /blend in/i, /(?:indistinguishable|interchangeable)/i] },
  { intent: 'positioning_discovery',    patterns: [/(?:position|positioning)/i, /what level/i, /unclear on/i, /not sure (?:what|how) to (?:pitch|frame)/i] },
  { intent: 'career_positioning',       patterns: [/career (?:direction|change|transition|pivot)/i, /next step/i, /what role/i] },
  { intent: 'interview_prep',           patterns: [/interview prep/i, /prepare(?: for\b[^.!?]*)? interview/i, /practice questions?/i, /(?:upcoming|next) interview/i] },
  { intent: 'direct_improvement',       patterns: [/(?:rewrite|fix|improve|tailor|update) (?:my )?(?:resume|cv)/i, /make (?:it|my resume) better/i, /job posting/i] },
];

function classifyIntent(message: string): IntentKey {
  for (const { intent, patterns } of INTENT_KEYWORDS) {
    if (patterns.some((p) => p.test(message))) return intent;
  }
  // Heuristic: short messages default to general_question, others to direct_improvement.
  return message.trim().length < 60 ? 'general_question' : 'direct_improvement';
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const userTier = await getUserTier(user.id);
    assertTier(userTier, 'executive');
    await enforceRateLimit('chat', { kind: 'user', userId: user.id });

    const body = await req.json();
    const message = requireString('message', body.message, {
      min: 1,
      max: INPUT_LIMITS.message,
    });
    const conversationId = body.conversationId
      ? requireUuid('conversationId', body.conversationId)
      : null;

    let activeConversationId = conversationId;
    let intent: IntentKey | null = null;

    if (!activeConversationId) {
      intent = classifyIntent(message);

      const { data: conv, error: convError } = await getSupabaseAdmin()
        .from('conversations')
        .insert({
          user_id: user.id,
          intent,
          status: 'active',
        })
        .select()
        .single();

      if (convError || !conv) {
        console.error('Conversation creation error:', convError);
        throw new Error('Failed to start conversation');
      }

      activeConversationId = conv.id;

      await getSupabaseAdmin()
        .from('messages')
        .insert({
          conversation_id: activeConversationId,
          role: 'system',
          content: `Conversation intent detected: ${intent}. Apply the corresponding Navigator flow.`,
          metadata: { intentDetected: intent },
        });
    } else {
      await requireConversationOwnership(user.id, activeConversationId);
    }

    // Fetch last N turns only, reversed to chronological order.
    const { data: historyRaw } = await getSupabaseAdmin()
      .from('messages')
      .select('role, content')
      .eq('conversation_id', activeConversationId)
      .in('role', ['user', 'assistant'])
      .order('created_at', { ascending: false })
      .limit(MAX_HISTORY_TURNS);

    const history = (historyRaw ?? []).slice().reverse();

    const messages: { role: 'system' | 'user' | 'assistant'; content: string }[] = [
      { role: 'system', content: SYSTEM_PROMPT },
    ];
    for (const msg of history) {
      if (msg.role === 'user' || msg.role === 'assistant') {
        messages.push({ role: msg.role, content: msg.content });
      }
    }
    messages.push({ role: 'user', content: message });

    await getSupabaseAdmin()
      .from('messages')
      .insert({
        conversation_id: activeConversationId,
        role: 'user',
        content: message,
      });

    const stream = await getOpenAI().chat.completions.create({
      model: 'gpt-4.1',
      messages,
      temperature: 0.4,
      max_tokens: 4000,
      stream: true,
    });

    let fullResponse = '';

    const readable = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        try {
          for await (const chunk of stream) {
            const delta = chunk.choices[0]?.delta?.content || '';
            if (delta) {
              fullResponse += delta;
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ content: delta })}\n\n`),
              );
            }
            if (chunk.choices[0]?.finish_reason) {
              await getSupabaseAdmin()
                .from('messages')
                .insert({
                  conversation_id: activeConversationId,
                  role: 'assistant',
                  content: fullResponse,
                });

              await getSupabaseAdmin()
                .from('conversations')
                .update({ updated_at: new Date().toISOString() })
                .eq('id', activeConversationId);

              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({
                    done: true,
                    conversationId: activeConversationId,
                    intent,
                  })}\n\n`,
                ),
              );
            }
          }
        } catch (err) {
          console.error('Stream error:', err);
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ error: 'Stream interrupted.' })}\n\n`,
            ),
          );
        } finally {
          controller.close();
        }
      },
    });

    const headers: Record<string, string> = {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    };
    if (activeConversationId) headers['X-Conversation-Id'] = activeConversationId;

    return new Response(readable, { headers });
  } catch (error) {
    return handleRouteError('chat', error);
  }
}

// GET: fetch conversation history. RLS on conversations/messages enforces
// that a user can only read rows they own, so even if the explicit user_id
// filter was removed this query would stay safe.
export async function GET(req: NextRequest) {
  try {
    const { user, supabase } = await requireAuth();

    const { searchParams } = new URL(req.url);
    const conversationIdRaw = searchParams.get('conversationId');

    if (conversationIdRaw) {
      const conversationId = requireUuid('conversationId', conversationIdRaw);

      const { data: conv } = await supabase
        .from('conversations')
        .select('id, intent, status, created_at')
        .eq('id', conversationId)
        .eq('user_id', user.id)
        .single();

      if (!conv) throw notFound('Conversation not found.');

      const { data: messages } = await supabase
        .from('messages')
        .select('id, role, content, created_at')
        .eq('conversation_id', conversationId)
        .neq('role', 'system')
        .order('created_at', { ascending: true });

      return NextResponse.json({
        conversation: conv,
        messages: messages || [],
      });
    }

    const { data: conversations } = await supabase
      .from('conversations')
      .select('id, intent, status, created_at, updated_at')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })
      .limit(20);

    return NextResponse.json({ conversations: conversations || [] });
  } catch (error) {
    return handleRouteError('chat', error);
  }
}
