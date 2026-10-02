import Link from 'next/link';
import { AdminConsole } from './admin-console';
import { getCoreAdminAccess } from '@/lib/admin-auth';
import { CoreAdminConfigurationError, readCoreAdminConfig } from '@/lib/core-admin';
import { APP_KEY } from '@/lib/core';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const access = await getCoreAdminAccess();
  if (access.state === 'signed-out') {
    return <><h1>Core administration</h1><p>Sign in before opening the onboarding console.</p><Link className="btn" href="/sign-in">Go to sign in</Link></>;
  }
  if (access.state === 'forbidden') {
    return <><h1>Core administration</h1><div className="banner error">This Clerk user is not allowed to administer Core from the dummy app.</div><Link className="btn secondary" href="/">Return home</Link></>;
  }
  if (access.state === 'misconfigured') {
    return <><h1>Core administration</h1><div className="banner error">{access.message}</div><Link className="btn secondary" href="/">Return home</Link></>;
  }

  try {
    const config = readCoreAdminConfig();
    return <><h1>Core onboarding console</h1><p className="lede">Create app roles and permissions, find projected Clerk memberships, and assign access without exposing Core credentials to the browser.</p><AdminConsole appId={config.appId} appKey={APP_KEY} /></>;
  } catch (error) {
    const message = error instanceof CoreAdminConfigurationError ? error.message : 'Core administration is not configured.';
    return <><h1>Core administration</h1><div className="banner error">{message}</div><Link className="btn secondary" href="/">Return home</Link></>;
  }
}
