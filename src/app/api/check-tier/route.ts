import { NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase/server';
import { getTierFlags, getAnalysisLimit } from '@/lib/tiers';
import type { Tier } from '@/lib/tiers';

export async function GET() {
  try {
    const supabase = await createSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({
        tier: 'free',
        flags: getTierFlags('free'),
        analysesThisMonth: 0,
        analysisLimit: getAnalysisLimit('free'),
      });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('tier')
      .eq('id', user.id)
      .single();

    const tier: Tier = (profile?.tier as Tier) || 'free';

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { count } = await supabase
      .from('sessions')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('created_at', startOfMonth.toISOString());

    const analysesThisMonth = count ?? 0;
    const analysisLimit = getAnalysisLimit(tier);

    return NextResponse.json({
      tier,
      flags: getTierFlags(tier),
      analysesThisMonth,
      analysisLimit,
      limitReached: analysisLimit !== Infinity && analysesThisMonth >= analysisLimit,
    });
  } catch (error) {
    console.error('check-tier error:', error);
    return NextResponse.json(
      { tier: 'free', flags: getTierFlags('free') },
      { status: 200 },
    );
  }
}
