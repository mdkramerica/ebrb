import { createHash } from 'crypto';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { tooManyRequests } from './errors';

type Bucket = 'analyze' | 'chat' | 'refine' | 'generate-doc' | 'claim-session' | 'diagnose';

interface LimitConfig {
  max: number;
  windowSeconds: number;
}

const LIMITS: Record<Bucket, { user: LimitConfig; anon: LimitConfig }> = {
  analyze:         { user: { max: 10, windowSeconds: 60 }, anon: { max: 2,  windowSeconds: 3600 } },
  chat:            { user: { max: 30, windowSeconds: 60 }, anon: { max: 10, windowSeconds: 3600 } },
  refine:          { user: { max: 20, windowSeconds: 60 }, anon: { max: 0,  windowSeconds: 60   } },
  'generate-doc':  { user: { max: 15, windowSeconds: 60 }, anon: { max: 0,  windowSeconds: 60   } },
  'claim-session': { user: { max: 10, windowSeconds: 60 }, anon: { max: 0,  windowSeconds: 60   } },
  diagnose:        { user: { max: 5,  windowSeconds: 60 }, anon: { max: 2,  windowSeconds: 3600 } },
};

export function hashIp(ip: string): string {
  return createHash('sha256').update(ip).digest('hex').slice(0, 32);
}

export function extractIp(headers: Headers): string {
  return (
    headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    headers.get('x-real-ip') ||
    'unknown'
  );
}

/**
 * DB-backed sliding-window rate limit. Fails open on DB error so a transient
 * outage does not take the whole app down; logs server-side instead.
 */
export async function enforceRateLimit(
  bucket: Bucket,
  actor: { kind: 'user'; userId: string } | { kind: 'ip'; ipHash: string },
): Promise<void> {
  const config = LIMITS[bucket][actor.kind === 'user' ? 'user' : 'anon'];
  if (config.max === 0) {
    throw tooManyRequests('Sign in required for this action.');
  }

  const actorKey = actor.kind === 'user' ? `user:${actor.userId}` : `ip:${actor.ipHash}`;
  const since = new Date(Date.now() - config.windowSeconds * 1000).toISOString();
  const admin = getSupabaseAdmin();

  const { count, error } = await admin
    .from('rate_limits')
    .select('id', { count: 'exact', head: true })
    .eq('actor', actorKey)
    .eq('bucket', bucket)
    .gte('created_at', since);

  if (error) {
    console.error('[rate-limit] count error — failing open', { bucket, error });
    return;
  }

  if ((count ?? 0) >= config.max) {
    throw tooManyRequests(
      `You're sending requests too quickly. Please wait a moment and try again.`,
    );
  }

  const { error: insertError } = await admin
    .from('rate_limits')
    .insert({ actor: actorKey, bucket });
  if (insertError) {
    console.error('[rate-limit] insert error — continuing', { bucket, insertError });
  }
}
