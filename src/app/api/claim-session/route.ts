import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { requireUser } from '@/lib/api/auth';
import { enforceRateLimit } from '@/lib/api/rate-limit';
import { handleRouteError, badRequest } from '@/lib/api/errors';
import { requireUuid } from '@/lib/api/validation';

const ANON_COOKIE = 'ebrb_anon_id';

/**
 * Links anonymous work to a freshly authenticated user. Two pathways:
 *
 *   1. `sessionToken` in the body (legacy one-shot analysis flow) — claims the
 *      sessions row with that token.
 *   2. The `ebrb_anon_id` cookie — claims every sessions and conversations row
 *      stamped with that anon id. This is the path used when an anon visitor
 *      signs up after chatting or diagnosing.
 *
 * Either mechanism on its own is sufficient; calling with neither is a 400.
 */
export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    await enforceRateLimit('claim-session', { kind: 'user', userId: user.id });

    const body = await req.json().catch(() => ({} as Record<string, unknown>));
    const sessionToken = body.sessionToken
      ? requireUuid('sessionToken', body.sessionToken)
      : null;
    const anonId = req.cookies.get(ANON_COOKIE)?.value ?? null;

    if (!sessionToken && !anonId) {
      throw badRequest('No session to claim.');
    }

    const admin = getSupabaseAdmin();

    if (sessionToken) {
      const { error } = await admin
        .from('sessions')
        .update({ user_id: user.id })
        .eq('session_token', sessionToken)
        .is('user_id', null);
      if (error) {
        console.error('[claim-session] session by token error', error);
      }
    }

    if (anonId) {
      const [{ error: sessErr }, { error: convErr }] = await Promise.all([
        admin
          .from('sessions')
          .update({ user_id: user.id })
          .eq('anon_session_id', anonId)
          .is('user_id', null),
        admin
          .from('conversations')
          .update({ user_id: user.id })
          .eq('anon_session_id', anonId)
          .is('user_id', null),
      ]);
      if (sessErr) console.error('[claim-session] sessions by anon error', sessErr);
      if (convErr) console.error('[claim-session] conversations by anon error', convErr);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleRouteError('claim-session', error);
  }
}
