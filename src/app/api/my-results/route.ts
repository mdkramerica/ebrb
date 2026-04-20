import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api/auth';
import { handleRouteError, notFound } from '@/lib/api/errors';
import { requireUuid } from '@/lib/api/validation';

export async function GET(request: Request) {
  try {
    const { user, supabase } = await requireAuth();

    const { searchParams } = new URL(request.url);
    const sessionIdRaw = searchParams.get('sessionId');

    // RLS enforces user_id = auth.uid() on sessions, but we also filter
    // explicitly for clarity and defense-in-depth.
    let query = supabase
      .from('sessions')
      .select('id, session_token, intent, completion_status')
      .eq('user_id', user.id);

    if (sessionIdRaw) {
      const sessionId = requireUuid('sessionId', sessionIdRaw);
      query = query.eq('id', sessionId);
    } else {
      query = query.order('created_at', { ascending: false }).limit(1);
    }

    const { data: session, error: sessionError } = await query.single();
    if (sessionError || !session) throw notFound('No results found.');

    const { data: docs, error: docsError } = await supabase
      .from('documents')
      .select('id, doc_type, content, version, created_at')
      .eq('session_id', session.id)
      .order('created_at', { ascending: false });

    if (docsError || !docs?.length) throw notFound('No documents found.');

    const resume = docs.find((d) => d.doc_type === 'resume')?.content || '';
    const coverLetter = docs.find((d) => d.doc_type === 'cover_letter')?.content || '';
    const atsRaw = docs.find((d) => d.doc_type === 'ats_report')?.content || '{}';

    let atsReport: unknown;
    try {
      atsReport = typeof atsRaw === 'string' ? JSON.parse(atsRaw) : atsRaw;
    } catch {
      atsReport = atsRaw;
    }

    const allDocs = docs.map((d) => ({
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
      resume,
      coverLetter,
      atsReport,
      documents: allDocs,
    });
  } catch (error) {
    return handleRouteError('my-results', error);
  }
}
