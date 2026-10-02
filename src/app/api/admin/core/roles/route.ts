import { NextResponse } from 'next/server';
import { createRoleSchema } from '@/lib/admin-schemas';
import {
  adminRouteError,
  authorizeCoreAdmin,
  requireAdminSameOrigin,
} from '@/lib/admin-route';
import { coreAdminClient } from '@/lib/core-admin';

export async function POST(request: Request) {
  const authorization = await authorizeCoreAdmin();
  if ('response' in authorization) return authorization.response;
  const originFailure = requireAdminSameOrigin(request);
  if (originFailure) return originFailure;

  try {
    const body = await request.json().catch(() => null);
    const input = createRoleSchema.parse(body);
    const role = await coreAdminClient().createRole(input);
    return NextResponse.json({ data: { role } }, { status: 201 });
  } catch (error) {
    return adminRouteError(error);
  }
}
