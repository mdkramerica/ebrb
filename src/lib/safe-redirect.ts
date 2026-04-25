/**
 * Allow-listed post-auth redirects. Any value not in this list falls back to
 * the default so an attacker cannot use `/login?redirect=https://evil.com`
 * to send users to an external origin after sign-in.
 */
export const ALLOWED_REDIRECTS: readonly string[] = [
  '/',
  '/results',
  '/profile',
  '/chat',
  '/intake',
  '/diagnose',
  '/diagnose-results',
  '/build',
];

export function safeRedirect(raw: string | null | undefined, fallback = '/results'): string {
  if (!raw) return fallback;
  // Must be a same-origin path.
  if (!raw.startsWith('/') || raw.startsWith('//')) return fallback;
  const pathOnly = raw.split('?')[0].split('#')[0];
  return ALLOWED_REDIRECTS.some((p) => pathOnly === p || pathOnly.startsWith(p + '/'))
    ? raw
    : fallback;
}
