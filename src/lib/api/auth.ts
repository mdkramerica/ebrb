import type { SupabaseClient, User } from '@supabase/supabase-js';
import { createSupabaseServer } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import type { Tier } from '@/lib/tiers';
import { forbidden, notFound, unauthorized } from './errors';

const TIER_ORDER: Record<Tier, number> = { free: 0, executive: 1, unlimited: 2 };

export interface AuthContext {
  user: User;
  /** RLS-enforced server client scoped to the signed-in user. */
  supabase: SupabaseClient;
}

export async function requireUser(): Promise<User> {
  const { user } = await requireAuth();
  return user;
}

export async function requireAuth(): Promise<AuthContext> {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw unauthorized();
  return { user, supabase };
}

export async function getOptionalUser(): Promise<User | null> {
  try {
    const supabase = await createSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    return user ?? null;
  } catch {
    return null;
  }
}

export async function getUserTier(userId: string): Promise<Tier> {
  const { data: profile } = await getSupabaseAdmin()
    .from('profiles')
    .select('tier')
    .eq('id', userId)
    .single();
  return (profile?.tier as Tier) || 'free';
}

export function assertTier(userTier: Tier, requiredTier: Tier): void {
  if (TIER_ORDER[userTier] < TIER_ORDER[requiredTier]) {
    throw forbidden(
      `This feature requires the ${requiredTier} plan. You are on the ${userTier} plan.`,
    );
  }
}

export async function requireSessionOwnership(
  userId: string,
  sessionId: string,
): Promise<void> {
  const { data } = await getSupabaseAdmin()
    .from('sessions')
    .select('user_id')
    .eq('id', sessionId)
    .single();
  if (!data) throw notFound('Session not found.');
  if (data.user_id !== userId) throw forbidden();
}

export async function requireConversationOwnership(
  userId: string,
  conversationId: string,
): Promise<void> {
  const { data } = await getSupabaseAdmin()
    .from('conversations')
    .select('user_id')
    .eq('id', conversationId)
    .single();
  if (!data) throw notFound('Conversation not found.');
  if (data.user_id !== userId) throw forbidden();
}
