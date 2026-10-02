import { NextResponse } from 'next/server';
import { attachPermissionSchema, roleIdSchema } from '@/lib/admin-schemas';
import {
  adminRouteError,
  authorizeCoreAdmin,
  requireAdminSameOrigin,
} from '@/lib/admin-route';
import { coreAdminClient } from '@/lib/core-admin';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ roleId: string }> },
) {
  const authorization = await authorizeCoreAdmin();
  if ('response' in authorization) return authorization.response;
  const originFailure = requireAdminSameOrigin(request);
  if (originFailure) return originFailure;

  try {
    const { roleId: rawRoleId } = await params;
    const roleId = roleIdSchema.parse(rawRoleId);
    const body = await request.json().catch(() => null);
    const input = attachPermissionSchema.parse(body);
    const permission = await coreAdminClient().attachPermission(roleId, input);
    return NextResponse.json({ data: { permission } }, { status: 201 });
  } catch (error) {
    return adminRouteError(error);
  }
}
