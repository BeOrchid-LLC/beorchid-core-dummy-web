/** Best-effort same-origin protection for browser mutations. */
export function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get('origin');
  if (!origin) return true;
  return origin === new URL(request.url).origin;
}

/** Strict CSRF protection for cookie-authenticated administrative mutations. */
export function isStrictSameOrigin(request: Request): boolean {
  const origin = request.headers.get('origin');
  if (!origin) return false;

  const requestUrl = new URL(request.url);
  const forwardedHost = request.headers.get('x-forwarded-host')?.split(',')[0]?.trim();
  const forwardedProto = request.headers.get('x-forwarded-proto')?.split(',')[0]?.trim();
  const host = forwardedHost || request.headers.get('host') || requestUrl.host;
  const protocol = forwardedProto || requestUrl.protocol.slice(0, -1);
  if (!host || (protocol !== 'http' && protocol !== 'https')) return false;

  try {
    return new URL(origin).origin === new URL(`${protocol}://${host}`).origin;
  } catch {
    return false;
  }
}

export function safeDatabaseMessage(error: unknown): string {
  if (error instanceof Error && error.message.includes('DATABASE_URL')) return error.message;
  return 'The app database is unavailable. No data was changed.';
}
