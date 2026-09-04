import {
  CoreApiError,
  HttpCoreClient,
  StubCoreClient,
  type CoreClient,
  type ResolvedContext,
} from '@beorchid/core-sdk';
import { getSession } from './session';

export const APP_KEY = 'core_dummy_web';

let client: CoreClient | null = null;

export function isCoreApiConfigured(): boolean {
  return Boolean(process.env['CORE_API_URL'] && process.env['CORE_API_KEY']);
}

export function isLiveIntegrationConfigured(): boolean {
  return Boolean(isCoreApiConfigured() && process.env['DATABASE_URL'] && process.env['NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY']?.startsWith('pk_') && process.env['CLERK_SECRET_KEY']?.startsWith('sk_'));
}

function coreClient(): CoreClient {
  if (client) return client;

  const baseUrl = process.env['CORE_API_URL'];
  const apiKey = process.env['CORE_API_KEY'];
  const hasPartialCoreConfig = Boolean(baseUrl) !== Boolean(apiKey);

  if (hasPartialCoreConfig) {
    throw new Error('Core integration is partially configured. Set both CORE_API_URL and CORE_API_KEY.');
  }

  if (baseUrl && apiKey) {
    client = new HttpCoreClient({ baseUrl, apiKey, appKey: APP_KEY });
    return client;
  }

  if (process.env.NODE_ENV !== 'development' && process.env.NODE_ENV !== 'test') {
    throw new Error('Core API configuration is required outside development and test.');
  }

  client = new StubCoreClient();
  return client;
}

export type CurrentContext =
  | { state: 'signed-out' }
  | { state: 'unlinked'; clerkUserId: string }
  | { state: 'resolved'; context: ResolvedContext };

export async function currentContext(): Promise<CurrentContext> {
  const session = await getSession();
  if (!session) return { state: 'signed-out' };

  const context = await coreClient().resolveContext(
    session.clerkUserId,
    APP_KEY,
    session.clerkOrgId,
  );
  if (!context) return { state: 'unlinked', clerkUserId: session.clerkUserId };

  return { state: 'resolved', context };
}

export function safeDependencyMessage(error: unknown): string {
  if (error instanceof CoreApiError) {
    if (error.status === 401 || error.status === 403) return 'Core rejected this app credential.';
    if (error.status === 404) return 'Core could not find the requested identity.';
    return 'Core is unavailable. Check the API URL and try again.';
  }
  if (error instanceof Error && error.message.includes('configuration')) return error.message;
  return 'The integration dependency is unavailable. No data was changed.';
}
