function forwardedValue(request: Request, name: string): string | undefined {
  return request.headers.get(name)?.split(',')[0]?.trim() || undefined;
}

function effectiveRequestOrigin(request: Request): string | null {
  const requestUrl = new URL(request.url);
  const host = forwardedValue(request, 'x-forwarded-host') || request.headers.get('host') || requestUrl.host;
  const protocol = forwardedValue(request, 'x-forwarded-proto') || requestUrl.protocol.slice(0, -1);
  if (!host || (protocol !== 'http' && protocol !== 'https')) return null;

  try {
    return new URL(`${protocol}://${host}`).origin;
  } catch {
    return null;
  }
}

/** Same-origin protection for browser mutations, including trusted reverse proxies. */
export function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get('origin');
  if (!origin) return true;

  try {
    return new URL(origin).origin === effectiveRequestOrigin(request);
  } catch {
    return false;
  }
}

/** Strict CSRF protection for cookie-authenticated administrative mutations. */
export function isStrictSameOrigin(request: Request): boolean {
  const origin = request.headers.get('origin');
  if (!origin) return false;

  try {
    return new URL(origin).origin === effectiveRequestOrigin(request);
  } catch {
    return false;
  }
}

export function safeDatabaseMessage(error: unknown): string {
  if (error instanceof Error && error.message.includes('DATABASE_URL')) return error.message;
  return 'The app database is unavailable. No data was changed.';
}
