import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const { sessionToken } = await req.json()
  if (!sessionToken) {
    return NextResponse.json({ error: 'Missing sessionToken' }, { status: 400 })
  }

  // Claim the session — only if it doesn't already belong to someone else
  const { error } = await getSupabaseAdmin()
    .from('sessions')
    .update({ user_id: user.id })
    .eq('session_token', sessionToken)
    .is('user_id', null)

  if (error) {
    return NextResponse.json({ error: 'Failed to claim session' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
