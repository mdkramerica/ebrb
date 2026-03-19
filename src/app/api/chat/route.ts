import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { createSupabaseServer } from '@/lib/supabase/server';
import { SYSTEM_PROMPT } from '@/lib/prompt';
import type { Tier } from '@/lib/tiers';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Lightweight intent classification prompt for the first message
const INTENT_CLASSIFIER_PROMPT = `You are a routing classifier for the Executive Brand & Resume Builder.

Analyze the user's first message and classify their intent into EXACTLY one of these categories:
- traction_diagnostic (not getting interviews, no callbacks, resume not working)
- differentiation_discovery (want to stand out, differentiate, look stronger)
- positioning_discovery (unclear on positioning, not sure what level to target)
- direct_improvement (rewrite resume, fix resume, make it better)
- career_positioning (what role to target, career direction)
- interview_prep (interview preparation, practice questions)
- general_question (general question about resumes or job searching)

Respond with ONLY the category string, nothing else.`;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { conversationId, message } = body;

    if (!message?.trim()) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // Auth check
    let userId: string | null = null;
    let userTier: Tier = 'free';

    try {
      const supabase = await createSupabaseServer();
      const { data: { user } } = await supabase.auth.getUser();
      userId = user?.id ?? null;

      if (userId) {
        const { data: profile } = await getSupabaseAdmin()
          .from('profiles')
          .select('tier')
          .eq('id', userId)
          .single();
        userTier = (profile?.tier as Tier) || 'free';
      }
    } catch {}

    // Check chat access — requires executive tier
    if (!userId) {
      return NextResponse.json({ error: 'Sign in required to use guided sessions.' }, { status: 401 });
    }
    if (userTier === 'free') {
      return NextResponse.json({
        error: 'Guided sessions require the Executive plan. Upgrade to access interactive coaching.',
        tierRequired: 'executive',
      }, { status: 403 });
    }

    let activeConversationId = conversationId;
    let intent: string | null = null;

    // New conversation setup
    if (!activeConversationId) {
      // Classify intent on the first message
      try {
        const intentResponse = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: INTENT_CLASSIFIER_PROMPT },
            { role: 'user', content: message },
          ],
          temperature: 0,
          max_tokens: 30,
        });
        intent = intentResponse.choices[0]?.message?.content?.trim() || 'direct_improvement';
      } catch {
        intent = 'direct_improvement';
      }

      // Create conversation record
      const { data: conv, error: convError } = await getSupabaseAdmin()
        .from('conversations')
        .insert({
          user_id: userId,
          intent,
          status: 'active',
        })
        .select()
        .single();

      if (convError || !conv) {
        console.error('Conversation creation error:', convError);
        return NextResponse.json({ error: 'Failed to start conversation' }, { status: 500 });
      }

      activeConversationId = conv.id;

      // Store the opening system context message (not shown to user)
      await getSupabaseAdmin()
        .from('messages')
        .insert({
          conversation_id: activeConversationId,
          role: 'system',
          content: `Conversation intent detected: ${intent}. Apply the corresponding Navigator flow.`,
          metadata: { intentDetected: intent },
        });
    }

    // Fetch conversation history
    const { data: history } = await getSupabaseAdmin()
      .from('messages')
      .select('role, content')
      .eq('conversation_id', activeConversationId)
      .order('created_at', { ascending: true });

    // Build OpenAI messages array
    const messages: { role: 'system' | 'user' | 'assistant'; content: string }[] = [
      { role: 'system', content: SYSTEM_PROMPT },
    ];

    // Add conversation history (skip system messages — they're already encoded in the prompt)
    for (const msg of history || []) {
      if (msg.role === 'user' || msg.role === 'assistant') {
        messages.push({ role: msg.role as 'user' | 'assistant', content: msg.content });
      }
    }

    // Add the current user message
    messages.push({ role: 'user', content: message });

    // Store user message
    await getSupabaseAdmin()
      .from('messages')
      .insert({
        conversation_id: activeConversationId,
        role: 'user',
        content: message,
      });

    // Stream response from OpenAI
    const stream = await openai.chat.completions.create({
      model: 'gpt-4.1',
      messages,
      temperature: 0.4,
      max_tokens: 4000,
      stream: true,
    });

    // Collect full response for storage
    let fullResponse = '';

    const readable = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();

        try {
          for await (const chunk of stream) {
            const delta = chunk.choices[0]?.delta?.content || '';
            if (delta) {
              fullResponse += delta;
              // SSE format: data: {content}\n\n
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: delta })}\n\n`));
            }

            // Stream finished
            if (chunk.choices[0]?.finish_reason) {
              // Store assistant response
              await getSupabaseAdmin()
                .from('messages')
                .insert({
                  conversation_id: activeConversationId,
                  role: 'assistant',
                  content: fullResponse,
                });

              // Update conversation updated_at
              await getSupabaseAdmin()
                .from('conversations')
                .update({ updated_at: new Date().toISOString() })
                .eq('id', activeConversationId);

              controller.enqueue(encoder.encode(
                `data: ${JSON.stringify({ done: true, conversationId: activeConversationId, intent })}\n\n`
              ));
            }
          }
        } catch (err) {
          console.error('Stream error:', err);
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: 'Stream failed' })}\n\n`));
        } finally {
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'X-Conversation-Id': activeConversationId,
      },
    });
  } catch (error: unknown) {
    console.error('Chat error:', error);
    const message = error instanceof Error ? error.message : 'Chat failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// GET: fetch conversation history
export async function GET(req: NextRequest) {
  try {
    const supabase = await createSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const conversationId = searchParams.get('conversationId');

    if (conversationId) {
      // Fetch messages for a specific conversation
      const { data: messages } = await getSupabaseAdmin()
        .from('messages')
        .select('id, role, content, created_at')
        .eq('conversation_id', conversationId)
        .neq('role', 'system')
        .order('created_at', { ascending: true });

      const { data: conv } = await getSupabaseAdmin()
        .from('conversations')
        .select('id, intent, status, created_at')
        .eq('id', conversationId)
        .eq('user_id', user.id)
        .single();

      return NextResponse.json({ conversation: conv, messages: messages || [] });
    }

    // Fetch all conversations for this user
    const { data: conversations } = await getSupabaseAdmin()
      .from('conversations')
      .select('id, intent, status, created_at, updated_at')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })
      .limit(20);

    return NextResponse.json({ conversations: conversations || [] });
  } catch (error) {
    console.error('Chat GET error:', error);
    return NextResponse.json({ error: 'Failed to load conversations' }, { status: 500 });
  }
}
