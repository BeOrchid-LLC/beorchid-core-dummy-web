import { PermissionDeniedError, hasPermission, requirePermission, type ResolvedContext } from '@beorchid/core-sdk';

export const PERMISSIONS = {
  read: 'dummy:records:read',
  create: 'dummy:records:create',
  delete: 'dummy:records:delete',
} as const;

export function canRead(context: ResolvedContext): boolean {
  return hasPermission(context.permissions, PERMISSIONS.read);
}

export function canCreate(context: ResolvedContext): boolean {
  return hasPermission(context.permissions, PERMISSIONS.create);
}

export function canDelete(context: ResolvedContext): boolean {
  return hasPermission(context.permissions, PERMISSIONS.delete);
}

export function enforce(context: ResolvedContext, permission: string): void {
  requirePermission(context.permissions, permission);
}

export function isPermissionDenied(error: unknown): error is PermissionDeniedError {
  return error instanceof PermissionDeniedError;
}
