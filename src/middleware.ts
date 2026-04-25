import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'
import { safeRedirect } from '@/lib/safe-redirect'

const PROTECTED_ROUTES = ['/profile']
const AUTH_ROUTES = ['/login', '/signup']
const ANON_COOKIE = 'ebrb_anon_id'
const ANON_COOKIE_MAX_AGE = 60 * 60 * 24 * 7

function attachAnonCookie(response: NextResponse, existingId: string | undefined) {
  if (existingId) return
  response.cookies.set({
    name: ANON_COOKIE,
    value: crypto.randomUUID(),
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: ANON_COOKIE_MAX_AGE,
    path: '/',
  })
}

export async function middleware(request: NextRequest) {
  const { supabaseResponse, user } = await updateSession(request)
  const { pathname } = request.nextUrl
  const existingAnonId = request.cookies.get(ANON_COOKIE)?.value

  if (user && AUTH_ROUTES.some((r) => pathname.startsWith(r))) {
    const url = request.nextUrl.clone()
    url.pathname = '/'
    const res = NextResponse.redirect(url)
    attachAnonCookie(res, existingAnonId)
    return res
  }

  if (!user && PROTECTED_ROUTES.some((r) => pathname.startsWith(r))) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('redirect', safeRedirect(pathname))
    const res = NextResponse.redirect(url)
    attachAnonCookie(res, existingAnonId)
    return res
  }

  attachAnonCookie(supabaseResponse, existingAnonId)
  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
