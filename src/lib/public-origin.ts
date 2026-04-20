/**
 * Resolve the public-facing origin for a server-side request.
 *
 * Railway (and most reverse proxies) forward the original host and scheme via
 * `x-forwarded-host` / `x-forwarded-proto`. The raw `request.url` on the Node
 * side resolves to the internal address (often `localhost:8080`), which would
 * cause user-facing redirects to send browsers to a non-routable URL.
 *
 * Resolution order:
 *   1. `NEXT_PUBLIC_APP_URL` env var (explicit config wins)
 *   2. `x-forwarded-host` + `x-forwarded-proto` headers
 *   3. `x-forwarded-host` alone (assume https)
 *   4. `host` header
 *   5. `URL(request.url).origin` (dev fallback)
 */
export function getPublicOrigin(request: Request): string {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '');
  if (configured && /^https?:\/\//.test(configured)) {
    return configured;
  }

  const headers = request.headers;
  const forwardedHost = headers.get('x-forwarded-host') || headers.get('host');
  const forwardedProto = headers.get('x-forwarded-proto');

  if (forwardedHost && !forwardedHost.includes('localhost') && !forwardedHost.startsWith('127.')) {
    const proto = forwardedProto || 'https';
    return `${proto}://${forwardedHost}`;
  }

  return new URL(request.url).origin;
}
