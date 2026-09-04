/** Best-effort same-origin protection for browser mutations. */
export function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get('origin');
  if (!origin) return true;
  return origin === new URL(request.url).origin;
}

export function safeDatabaseMessage(error: unknown): string {
  if (error instanceof Error && error.message.includes('DATABASE_URL')) return error.message;
  return 'The app database is unavailable. No data was changed.';
}
