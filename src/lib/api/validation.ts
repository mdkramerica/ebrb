import { badRequest } from './errors';

export const INPUT_LIMITS = {
  message: 8000,
  instruction: 2000,
  jobPosting: 30000,
  resume: 30000,
  customInstructions: 1000,
  content: 30000,
} as const;

export function requireString(
  field: string,
  value: unknown,
  opts: { min?: number; max: number },
): string {
  if (typeof value !== 'string') {
    throw badRequest(`${field} is required.`);
  }
  const trimmed = value.trim();
  if (opts.min !== undefined && trimmed.length < opts.min) {
    throw badRequest(`${field} must be at least ${opts.min} characters.`);
  }
  if (trimmed.length > opts.max) {
    throw badRequest(`${field} is too long (max ${opts.max} characters).`);
  }
  return trimmed;
}

export function requireUuid(field: string, value: unknown): string {
  if (typeof value !== 'string') {
    throw badRequest(`${field} is required.`);
  }
  const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuid.test(value)) {
    throw badRequest(`${field} must be a valid UUID.`);
  }
  return value;
}

export function requireEnum<T extends string>(
  field: string,
  value: unknown,
  allowed: readonly T[],
): T {
  if (typeof value !== 'string' || !allowed.includes(value as T)) {
    throw badRequest(`${field} must be one of: ${allowed.join(', ')}`);
  }
  return value as T;
}

/**
 * Escape closing delimiters and strip control characters so user input cannot
 * break out of its fenced block in the prompt.
 */
export function sanitizeForPrompt(input: string, openTag: string, closeTag: string): string {
  return input
    .replace(new RegExp(openTag, 'gi'), openTag.replace('<', '(&lt;').replace('>', '&gt;)'))
    .replace(new RegExp(closeTag, 'gi'), closeTag.replace('<', '(&lt;').replace('>', '&gt;)'))
    // Drop null bytes and exotic control chars (keep tab/newline/CR).
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '');
}

export function fenceUserContent(
  label: string,
  content: string,
): string {
  const open = `<USER_CONTENT name="${label}">`;
  const close = `</USER_CONTENT>`;
  const safe = sanitizeForPrompt(content, open, close);
  return `${open}\n${safe}\n${close}`;
}
