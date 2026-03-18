import { NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

export async function GET(request: Request) {
  try {
    const supabase = await createSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    // Get a specific session or the most recent one
    const query = getSupabaseAdmin()
      .from('sessions')
      .select('id, session_token, intent, completion_status')
      .eq('user_id', user.id);

    if (sessionId) {
      query.eq('id', sessionId);
    } else {
      query.order('created_at', { ascending: false }).limit(1);
    }

    const { data: session, error: sessionError } = await query.single();

    if (sessionError || !session) {
      return NextResponse.json({ error: 'No results found' }, { status: 404 });
    }

    // Get ALL documents for that session (no doc_type filter — supports all V2 types)
    const { data: docs, error: docsError } = await getSupabaseAdmin()
      .from('documents')
      .select('id, doc_type, content, version, created_at')
      .eq('session_id', session.id)
      .order('created_at', { ascending: false });

    if (docsError || !docs?.length) {
      return NextResponse.json({ error: 'No documents found' }, { status: 404 });
    }

    // Build the legacy response shape (for backward compatibility with results page)
    const resume = docs.find(d => d.doc_type === 'resume')?.content || '';
    const coverLetter = docs.find(d => d.doc_type === 'cover_letter')?.content || '';
    const atsRaw = docs.find(d => d.doc_type === 'ats_report')?.content || '{}';

    let atsReport;
    try {
      atsReport = typeof atsRaw === 'string' ? JSON.parse(atsRaw) : atsRaw;
    } catch {
      atsReport = atsRaw;
    }

    // All documents as a flat array for the dynamic sidebar
    const allDocs = docs.map(d => ({
      id: d.id,
      docType: d.doc_type,
      hasContent: Boolean(d.content),
      createdAt: d.created_at,
    }));

    return NextResponse.json({
      sessionToken: session.session_token,
      sessionId: session.id,
      intent: session.intent,
      completionStatus: session.completion_status,
      // Legacy fields preserved for backward compatibility
      resume,
      coverLetter,
      atsReport,
      // New: full document index
      documents: allDocs,
    });
  } catch (error) {
    console.error('my-results error:', error);
    return NextResponse.json({ error: 'Failed to load results' }, { status: 500 });
  }
}
