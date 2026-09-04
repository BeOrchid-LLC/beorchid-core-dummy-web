import Link from 'next/link';
import { getSession, isClerkConfigured, isDevAuthAllowed } from '@/lib/session';
import { isCoreApiConfigured, isLiveIntegrationConfigured } from '@/lib/core';

async function SignOutControl() {
  if (isClerkConfigured()) {
    const { SignOutButton } = await import('@clerk/nextjs');
    return <SignOutButton redirectUrl="/"><button className="secondary" type="button">Sign out</button></SignOutButton>;
  }
  return <form action="/api/dev-session" method="post"><input type="hidden" name="action" value="signout" /><button className="secondary" type="submit">Sign out</button></form>;
}

export default async function Home() {
  const session = await getSession();
  const clerk = isClerkConfigured();
  const core = isCoreApiConfigured();
  const live = isLiveIntegrationConfigured();

  return (
    <>
      <h1>Dummy Records acceptance harness</h1>
      <p className="lede">A deliberately small new app that proves Clerk authentication, Core identity and permissions, and app-owned database isolation.</p>
      <div className={live ? 'banner live' : 'banner dev'}>
        {live ? 'LIVE ACCEPTANCE MODE: Clerk, Core API, and the app database are configured.' : 'SMOKE MODE: this is not evidence of a successful staging integration.'}
      </div>
      <h2>Integration status</h2>
      <div className="card">
        <dl className="kv">
          <dt>Authentication</dt><dd>{clerk ? 'Clerk (live)' : 'Development stand-in'}</dd>
          <dt>Identity and permissions</dt><dd>{core ? 'Core API (live)' : 'StubCoreClient (fixture)'}</dd>
          <dt>App-owned database</dt><dd>{process.env['DATABASE_URL'] ? 'core_dummy_web' : 'not configured'}</dd>
          <dt>Fixed Core app key</dt><dd><code>core_dummy_web</code></dd>
          <dt>Signed in as</dt><dd>{session?.clerkUserId ?? 'nobody'}</dd>
        </dl>
      </div>
      <p className="muted">The acceptance app never reads Core tables directly. It asks the SDK for one resolved context and gates every records operation on that result.</p>
      {session ? <div className="row"><Link className="btn" href="/dashboard">View Core context</Link><Link className="btn" href="/records">Open records</Link><SignOutControl /></div> : <div className="row"><Link className="btn" href="/sign-in">Go to sign in</Link>{isDevAuthAllowed() && <Link className="btn secondary" href="/sign-in">Use fixture sign-in</Link>}</div>}
    </>
  );
}
