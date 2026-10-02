import { getSession, isClerkConfigured } from './session';

export type CoreAdminAccess =
  | { state: 'allowed'; clerkUserId: string }
  | { state: 'signed-out' }
  | { state: 'forbidden' }
  | { state: 'misconfigured'; message: string };

export function parseAdminClerkUserIds(value: string | undefined): Set<string> {
  return new Set(
    (value ?? '')
      .split(',')
      .map((entry) => entry.trim())
      .filter(Boolean),
  );
}

export async function getCoreAdminAccess(): Promise<CoreAdminAccess> {
  if (!isClerkConfigured()) {
    return {
      state: 'misconfigured',
      message: 'Clerk must be configured before the Core administration console can be used.',
    };
  }

  const allowedIds = parseAdminClerkUserIds(process.env['CORE_ADMIN_CLERK_USER_IDS']);
  if (allowedIds.size === 0) {
    return {
      state: 'misconfigured',
      message: 'CORE_ADMIN_CLERK_USER_IDS must contain at least one Clerk user ID.',
    };
  }

  try {
    const session = await getSession();
    if (!session) return { state: 'signed-out' };
    if (!allowedIds.has(session.clerkUserId)) return { state: 'forbidden' };
    return { state: 'allowed', clerkUserId: session.clerkUserId };
  } catch {
    return {
      state: 'misconfigured',
      message: 'Clerk authentication is unavailable. The administration console remains locked.',
    };
  }
}
