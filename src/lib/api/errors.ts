import { NextResponse } from 'next/server';

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly clientMessage: string,
    public readonly extra?: Record<string, unknown>,
  ) {
    super(clientMessage);
    this.name = 'ApiError';
  }
}

export function unauthorized(message = 'Sign in required.') {
  return new ApiError(401, message);
}

export function forbidden(message = 'Access denied.') {
  return new ApiError(403, message);
}

export function notFound(message = 'Not found.') {
  return new ApiError(404, message);
}

export function badRequest(message: string) {
  return new ApiError(400, message);
}

export function tooManyRequests(message = 'Too many requests. Please try again later.') {
  return new ApiError(429, message);
}

export function paymentRequired(message: string, extra?: Record<string, unknown>) {
  return new ApiError(402, message, extra);
}

type RouteName =
  | 'analyze'
  | 'chat'
  | 'refine'
  | 'generate-doc'
  | 'my-results'
  | 'claim-session'
  | 'check-tier'
  | 'health';

export function handleRouteError(route: RouteName, error: unknown): NextResponse {
  const requestId = crypto.randomUUID();

  if (error instanceof ApiError) {
    console.warn(`[${route}] ${error.status} ${error.clientMessage}`, { requestId });
    return NextResponse.json(
      { error: error.clientMessage, requestId, ...(error.extra ?? {}) },
      { status: error.status },
    );
  }

  console.error(`[${route}] unhandled error [requestId=${requestId}]`, error);
  return NextResponse.json(
    { error: 'Something went wrong. Please try again.', requestId },
    { status: 500 },
  );
}
