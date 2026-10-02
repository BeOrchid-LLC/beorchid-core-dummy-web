import { NextResponse } from 'next/server';
import { assignAppRoleSchema, membershipIdSchema } from '@/lib/admin-schemas';
import {
  adminRouteError,
  authorizeCoreAdmin,
  requireAdminSameOrigin,
} from '@/lib/admin-route';
import { coreAdminClient } from '@/lib/core-admin';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ membershipId: string }> },
) {
  const authorization = await authorizeCoreAdmin();
  if ('response' in authorization) return authorization.response;
  const originFailure = requireAdminSameOrigin(request);
  if (originFailure) return originFailure;

  try {
    const { membershipId: rawMembershipId } = await params;
    const membershipId = membershipIdSchema.parse(rawMembershipId);
    const body = await request.json().catch(() => null);
    const input = assignAppRoleSchema.parse(body);
    const assignment = await coreAdminClient().assignAppRole(membershipId, input.roleId);
    return NextResponse.json({ data: { assignment } }, { status: 201 });
  } catch (error) {
    return adminRouteError(error);
  }
}
