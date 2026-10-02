import { z } from 'zod';
import { APP_KEY } from './core';
import type { AttachPermissionInput, CreateRoleInput } from './admin-schemas';

const configSchema = z.object({
  baseUrl: z.url(),
  adminApiKey: z.string().min(1),
  appApiKey: z.string().min(1),
  appId: z.uuid(),
});

const roleSchema = z.object({
  id: z.uuid(),
  key: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  isSystem: z.boolean(),
});

const permissionSchema = z.object({
  permissionId: z.uuid(),
  permissionKey: z.string(),
});

const membershipSchema = z.object({
  id: z.uuid(),
  userId: z.uuid(),
  orgId: z.uuid(),
  roleKey: z.string(),
  status: z.string(),
});

const assignmentSchema = z.object({ id: z.uuid(), enabled: z.boolean() });

export type CoreRole = z.infer<typeof roleSchema>;
export type CoreMembership = z.infer<typeof membershipSchema>;

export interface CoreAdminConfig {
  baseUrl: string;
  adminApiKey: string;
  appApiKey: string;
  appId: string;
}

type Fetcher = (input: string | URL | Request, init?: RequestInit) => Promise<Response>;

export class CoreAdminConfigurationError extends Error {}

export class CoreAdminApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

export function readCoreAdminConfig(): CoreAdminConfig {
  const result = configSchema.safeParse({
    baseUrl: process.env['CORE_API_URL'],
    adminApiKey: process.env['CORE_ADMIN_API_KEY'],
    appApiKey: process.env['CORE_API_KEY'],
    appId: process.env['CORE_APP_ID'],
  });
  if (!result.success) {
    throw new CoreAdminConfigurationError(
      'Core administration is not fully configured. Check CORE_API_URL, CORE_ADMIN_API_KEY, CORE_API_KEY, and CORE_APP_ID.',
    );
  }
  return result.data;
}

function upstreamErrorMessage(body: unknown): string {
  if (
    typeof body === 'object' &&
    body !== null &&
    'error' in body &&
    typeof body.error === 'string' &&
    body.error.length <= 240
  ) {
    return body.error;
  }
  return 'Core rejected the request.';
}

export function createCoreAdminClient(config: CoreAdminConfig, fetcher: Fetcher = fetch) {
  const baseUrl = config.baseUrl.endsWith('/') ? config.baseUrl : `${config.baseUrl}/`;

  async function request<T>(
    path: string,
    init: RequestInit,
    responseSchema: z.ZodType<T>,
    credential: 'admin' | 'app',
  ): Promise<T> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10_000);
    try {
      const response = await fetcher(new URL(path.replace(/^\//, ''), baseUrl), {
        ...init,
        cache: 'no-store',
        signal: controller.signal,
        headers: {
          accept: 'application/json',
          authorization: `Bearer ${credential === 'admin' ? config.adminApiKey : config.appApiKey}`,
          ...(credential === 'app' ? { 'x-beorchid-app': APP_KEY } : {}),
          ...(init.body ? { 'content-type': 'application/json' } : {}),
        },
      });

      const text = await response.text();
      let body: unknown = null;
      if (text) {
        try {
          body = JSON.parse(text);
        } catch {
          body = null;
        }
      }

      if (!response.ok) throw new CoreAdminApiError(response.status, upstreamErrorMessage(body));
      const parsed = responseSchema.safeParse(body);
      if (!parsed.success) {
        throw new CoreAdminApiError(502, 'Core returned an unexpected response.');
      }
      return parsed.data;
    } catch (error) {
      if (error instanceof CoreAdminApiError) throw error;
      throw new CoreAdminApiError(503, 'Core is unavailable. No administrative change was made.');
    } finally {
      clearTimeout(timer);
    }
  }

  return {
    createRole(input: CreateRoleInput) {
      return request(
        '/v1/admin/roles',
        {
          method: 'POST',
          body: JSON.stringify({
            key: input.key,
            name: input.name,
            ...(input.description ? { description: input.description } : {}),
          }),
        },
        roleSchema,
        'admin',
      );
    },

    attachPermission(roleId: string, input: AttachPermissionInput) {
      return request(
        `/v1/admin/roles/${encodeURIComponent(roleId)}/permissions`,
        {
          method: 'POST',
          body: JSON.stringify({
            key: input.key,
            appId: config.appId,
            ...(input.description ? { description: input.description } : {}),
          }),
        },
        permissionSchema,
        'admin',
      );
    },

    listMemberships(clerkUserId: string) {
      const params = new URLSearchParams({ clerk_user_id: clerkUserId });
      return request(
        `/v1/me/memberships?${params.toString()}`,
        { method: 'GET' },
        z.array(membershipSchema),
        'app',
      );
    },

    assignAppRole(membershipId: string, roleId: string) {
      return request(
        `/v1/admin/memberships/${encodeURIComponent(membershipId)}/app-roles`,
        {
          method: 'POST',
          body: JSON.stringify({ appId: config.appId, roleId }),
        },
        assignmentSchema,
        'admin',
      );
    },
  };
}

export function coreAdminClient() {
  return createCoreAdminClient(readCoreAdminConfig());
}
