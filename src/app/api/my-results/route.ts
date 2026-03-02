import { NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

export async function GET() {
  try {
    const supabase = await createSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the user's most recent session
    const { data: session, error: sessionError } = await getSupabaseAdmin()
      .from('sessions')
      .select('id, session_token')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (sessionError || !session) {
      return NextResponse.json({ error: 'No results found' }, { status: 404 });
    }

    // Get all documents for that session
    const { data: docs, error: docsError } = await getSupabaseAdmin()
      .from('documents')
      .select('doc_type, content')
      .eq('session_id', session.id)
      .order('version', { ascending: false });

    if (docsError || !docs?.length) {
      return NextResponse.json({ error: 'No documents found' }, { status: 404 });
    }

    // Build response matching the shape the results page expects
    const resume = docs.find(d => d.doc_type === 'resume')?.content || '';
    const coverLetter = docs.find(d => d.doc_type === 'cover_letter')?.content || '';
    const atsRaw = docs.find(d => d.doc_type === 'ats_report')?.content || '{}';

    let atsReport;
    try {
      atsReport = typeof atsRaw === 'string' ? JSON.parse(atsRaw) : atsRaw;
    } catch {
      atsReport = atsRaw;
    }

    return NextResponse.json({
      sessionToken: session.session_token,
      resume,
      coverLetter,
      atsReport,
    });
  } catch (error) {
    console.error('my-results error:', error);
    return NextResponse.json({ error: 'Failed to load results' }, { status: 500 });
  }
}
