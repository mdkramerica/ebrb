import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

export async function GET() {
  try {
    // Quick Supabase connectivity check
    const { error } = await getSupabaseAdmin().from('sessions').select('id').limit(1);
    
    return NextResponse.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      supabase: error ? 'error' : 'connected',
      openai: process.env.OPENAI_API_KEY ? 'configured' : 'missing',
    });
  } catch {
    return NextResponse.json({ status: 'error' }, { status: 500 });
  }
}
