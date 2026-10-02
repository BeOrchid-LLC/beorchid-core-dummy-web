import { NextResponse } from 'next/server';
import { membershipLookupSchema } from '@/lib/admin-schemas';
import { adminRouteError, authorizeCoreAdmin } from '@/lib/admin-route';
import { coreAdminClient } from '@/lib/core-admin';

export async function GET(request: Request) {
  const authorization = await authorizeCoreAdmin();
  if ('response' in authorization) return authorization.response;

  try {
    const clerkUserId = new URL(request.url).searchParams.get('clerk_user_id');
    const input = membershipLookupSchema.parse({ clerkUserId });
    const memberships = await coreAdminClient().listMemberships(input.clerkUserId);
    return NextResponse.json({ data: { memberships } });
  } catch (error) {
    return adminRouteError(error);
  }
}
