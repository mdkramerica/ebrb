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
  if (!canUseFeature(userTier, requiredTier)) {
    throw forbidden(
      `This feature requires the ${requiredTier} plan. You are on the ${userTier} plan.`,
    );
  }
}

export function canUseFeature(userTier: Tier, requiredTier: Tier): boolean {
  return TIER_ORDER[userTier] >= TIER_ORDER[requiredTier];
}

/** Max messages per conversation for anonymous and free-tier users. */
export const FREE_CHAT_MESSAGE_CAP = 5;

export interface ChatAccessResult {
  /** True if the user may send another message on this conversation. */
  allowed: boolean;
  /** How many sends remain after this one. `Infinity` for unlimited tiers. */
  messagesRemaining: number;
  /** Populated when `allowed` is false so the client can render the right wall. */
  reason?: 'chat_cap';
}

/**
 * Gate for the free-tier chat message cap. Executive+ users pass through with
 * unlimited remaining. Free-tier and anonymous users are capped per conversation
 * based on how many user-role messages already exist.
 *
 * Called before we send a new user message — it returns how many sends remain
 * *after* this one is accepted. If the user has already hit the cap, returns
 * `{ allowed: false, reason: 'chat_cap' }`.
 */
export async function checkChatMessageCap(params: {
  conversationId: string | null;
  userTier: Tier | 'anon';
}): Promise<ChatAccessResult> {
  if (params.userTier !== 'anon' && canUseFeature(params.userTier, 'executive')) {
    return { allowed: true, messagesRemaining: Infinity };
  }

  if (!params.conversationId) {
    return { allowed: true, messagesRemaining: FREE_CHAT_MESSAGE_CAP - 1 };
  }

  const { count } = await getSupabaseAdmin()
    .from('messages')
    .select('id', { count: 'exact', head: true })
    .eq('conversation_id', params.conversationId)
    .eq('role', 'user');

  const used = count ?? 0;
  if (used >= FREE_CHAT_MESSAGE_CAP) {
    return { allowed: false, messagesRemaining: 0, reason: 'chat_cap' };
  }
  return { allowed: true, messagesRemaining: FREE_CHAT_MESSAGE_CAP - used - 1 };
}

/**
 * Authorization for a chat conversation that may belong to an anon visitor
 * (stamped with `anon_session_id`) or a signed-in user. Throws 403 when the
 * caller doesn't match the owner via either mechanism.
 */
export async function requireChatConversationAccess(params: {
  conversationId: string;
  userId: string | null;
  anonId: string | null;
}): Promise<void> {
  const { data } = await getSupabaseAdmin()
    .from('conversations')
    .select('user_id, anon_session_id')
    .eq('id', params.conversationId)
    .single();
  if (!data) throw notFound('Conversation not found.');

  if (params.userId && data.user_id === params.userId) return;
  if (!data.user_id && params.anonId && data.anon_session_id === params.anonId) return;

  throw forbidden();
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
