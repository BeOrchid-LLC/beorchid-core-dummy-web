import { z } from 'zod';

const UUID = z.string().uuid('Enter a valid UUID.');
const DESCRIPTION = z.string().trim().max(500, 'Use 500 characters or fewer.').optional();

export const createRoleSchema = z.object({
  key: z
    .string()
    .trim()
    .min(2, 'Role key is required.')
    .max(64, 'Use 64 characters or fewer.')
    .regex(/^[a-z][a-z0-9_]*$/, 'Use lowercase letters, digits, and underscores.'),
  name: z.string().trim().min(1, 'Role name is required.').max(120, 'Use 120 characters or fewer.'),
  description: DESCRIPTION,
});

export const attachPermissionSchema = z.object({
  key: z
    .string()
    .trim()
    .min(3, 'Permission key is required.')
    .max(120, 'Use 120 characters or fewer.')
    .regex(
      /^[a-z][a-z0-9_-]*(?::[a-z][a-z0-9_-]*)+$/,
      'Use colon-separated lowercase segments, for example dummy:records:read.',
    ),
  description: DESCRIPTION,
});

export const membershipLookupSchema = z.object({
  clerkUserId: z
    .string()
    .trim()
    .min(1, 'Clerk user ID is required.')
    .max(200, 'Use 200 characters or fewer.')
    .regex(/^user_[A-Za-z0-9_-]+$/, 'Enter a Clerk user ID beginning with user_.'),
});

export const assignAppRoleSchema = z.object({
  roleId: UUID,
});

export const roleIdSchema = UUID;
export const membershipIdSchema = UUID;

export type CreateRoleInput = z.infer<typeof createRoleSchema>;
export type AttachPermissionInput = z.infer<typeof attachPermissionSchema>;
export type MembershipLookupInput = z.infer<typeof membershipLookupSchema>;
export type AssignAppRoleInput = z.infer<typeof assignAppRoleSchema>;
