import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { requireUser } from '@/lib/api/auth';
import { enforceRateLimit } from '@/lib/api/rate-limit';
import { handleRouteError } from '@/lib/api/errors';
import { requireUuid } from '@/lib/api/validation';

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    await enforceRateLimit('claim-session', { kind: 'user', userId: user.id });

    const body = await req.json();
    const sessionToken = requireUuid('sessionToken', body.sessionToken);

    const { error } = await getSupabaseAdmin()
      .from('sessions')
      .update({ user_id: user.id })
      .eq('session_token', sessionToken)
      .is('user_id', null);

    if (error) {
      console.error('[claim-session] update error', error);
      return NextResponse.json({ error: 'Failed to claim session.' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleRouteError('claim-session', error);
  }
}
