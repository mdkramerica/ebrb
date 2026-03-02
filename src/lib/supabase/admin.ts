import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Service role client — for API routes that need to bypass RLS.
// NEVER expose this in client-side code.
let _admin: SupabaseClient | null = null

export function getSupabaseAdmin(): SupabaseClient {
  if (!_admin) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !key) throw new Error('Missing Supabase env vars: NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY')
    _admin = createClient(url, key)
  }
  return _admin
}
