import { cookies } from 'next/headers';
import type { SessionClaims } from '@beorchid/core-sdk';

export function isClerkConfigured(): boolean {
  const publishableKey = process.env['NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY'];
  const secretKey = process.env['CLERK_SECRET_KEY'];
  return typeof publishableKey === 'string' && publishableKey.startsWith('pk_') && typeof secretKey === 'string' && secretKey.startsWith('sk_');
}

export function isDevAuthAllowed(): boolean {
  return process.env.NODE_ENV === 'development' && !process.env['NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY'] && !process.env['CLERK_SECRET_KEY'];
}

export async function getSession(): Promise<SessionClaims | null> {
  if (isClerkConfigured()) {
    const { auth } = await import('@clerk/nextjs/server');
    const { userId, orgId, sessionId } = await auth();
    if (!userId) return null;
    return {
      clerkUserId: userId,
      clerkOrgId: orgId ?? undefined,
      sessionId: sessionId ?? undefined,
      issuedAt: 0,
      expiresAt: 0,
    };
  }

  if (!isDevAuthAllowed()) return null;
  const store = await cookies();
  const clerkUserId = store.get('beorchid_dev_user')?.value;
  if (!clerkUserId) return null;

  return {
    clerkUserId,
    clerkOrgId: 'org_acme',
    sessionId: 'dev_session',
    issuedAt: Math.floor(Date.now() / 1000),
    expiresAt: Math.floor(Date.now() / 1000) + 3600,
  };
}
