import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { getCoreAdminAccess } from './admin-auth';
import { CoreAdminApiError, CoreAdminConfigurationError } from './core-admin';
import { isStrictSameOrigin } from './request';

export type AdminAuthorization =
  | { clerkUserId: string }
  | { response: NextResponse };

function errorResponse(code: string, message: string, status: number, details?: unknown) {
  return NextResponse.json(
    { error: { code, message, ...(details ? { details } : {}) } },
    { status },
  );
}

export async function authorizeCoreAdmin(): Promise<AdminAuthorization> {
  const access = await getCoreAdminAccess();
  if (access.state === 'allowed') return { clerkUserId: access.clerkUserId };
  if (access.state === 'signed-out') {
    return { response: errorResponse('AUTHENTICATION_REQUIRED', 'Authentication required.', 401) };
  }
  if (access.state === 'forbidden') {
    return { response: errorResponse('ADMIN_ACCESS_DENIED', 'Core administration access denied.', 403) };
  }
  return { response: errorResponse('ADMIN_NOT_CONFIGURED', access.message, 503) };
}

export function requireAdminSameOrigin(request: Request): NextResponse | null {
  if (isStrictSameOrigin(request)) return null;
  return errorResponse('CROSS_ORIGIN_REJECTED', 'Cross-origin administrative request rejected.', 403);
}

export function adminRouteError(error: unknown): NextResponse {
  if (error instanceof ZodError) {
    return errorResponse('INVALID_REQUEST', 'Check the submitted fields.', 400, error.flatten().fieldErrors);
  }
  if (error instanceof CoreAdminConfigurationError) {
    return errorResponse('ADMIN_NOT_CONFIGURED', error.message, 503);
  }
  if (error instanceof CoreAdminApiError) {
    if (error.status === 400 || error.status === 404 || error.status === 409) {
      return errorResponse('CORE_REQUEST_REJECTED', error.message, error.status);
    }
    if (error.status === 401 || error.status === 403) {
      return errorResponse('CORE_CREDENTIAL_REJECTED', 'Core rejected the configured server credential.', 502);
    }
    return errorResponse('CORE_UNAVAILABLE', error.message, error.status === 503 ? 503 : 502);
  }
  return errorResponse('ADMIN_REQUEST_FAILED', 'The administrative request failed safely.', 500);
}
