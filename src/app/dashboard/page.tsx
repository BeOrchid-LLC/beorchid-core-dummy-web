import Link from 'next/link';
import { currentContext, APP_KEY, safeDependencyMessage } from '@/lib/core';

export default async function Dashboard() {
  let result: Awaited<ReturnType<typeof currentContext>>;
  try { result = await currentContext(); } catch (error) { return <><h1>Dashboard</h1><div className="banner error">{safeDependencyMessage(error)}</div><Link className="btn" href="/">Return home</Link></>; }

  if (result.state === 'signed-out') return <><h1>Dashboard</h1><p>Not signed in.</p><Link className="btn" href="/sign-in">Go to sign in</Link></>;
  if (result.state === 'unlinked') return <><h1>Dashboard</h1><div className="banner dev">Authenticated in Clerk, but this account is not yet projected into Core.</div><div className="card"><dl className="kv"><dt>Clerk user id</dt><dd>{result.clerkUserId}</dd><dt>Core identity</dt><dd>pending webhook/reconciliation</dd></dl></div><p>Do not treat this state as an authorization failure caused by the dummy app. Wait for Core reconciliation, then reload.</p></>;

  const { user, organization, membership, permissions } = result.context;
  return <>
    <h1>Core context</h1>
    <p className="lede">This page displays facts returned by Core, not a local identity table.</p>
    <h2>Identity</h2>
    <div className="card"><dl className="kv"><dt>Core user id</dt><dd>{user.id}</dd><dt>Clerk user id</dt><dd>{user.clerkUserId}</dd><dt>Email</dt><dd>{user.email}</dd><dt>Name</dt><dd>{user.fullName ?? '—'}</dd><dt>Status</dt><dd>{user.status}</dd></dl></div>
    <h2>Organization and membership</h2>
    <div className="card">{organization ? <dl className="kv"><dt>Name</dt><dd>{organization.name}</dd><dt>Slug</dt><dd>{organization.slug}</dd><dt>Core organization id</dt><dd>{organization.id}</dd><dt>Membership id</dt><dd>{membership?.id ?? '—'}</dd><dt>Role</dt><dd>{membership?.roleKey ?? '—'}</dd></dl> : <p>No organization is present in the current Clerk session.</p>}</div>
    <h2>Effective permissions in <code>{APP_KEY}</code></h2>
    <div className="card">{permissions ? <><p className="muted">Core-wide</p><div className="row">{permissions.orgWide.length ? permissions.orgWide.map((permission) => <span className="chip granted" key={permission}>{permission}</span>) : <span className="muted">none</span>}</div><p className="muted">App-scoped</p><div className="row">{permissions.appScoped.length ? permissions.appScoped.map((permission) => <span className="chip granted" key={permission}>{permission}</span>) : <span className="muted">none</span>}</div></> : <p>No app-role assignment exists; default deny applies.</p>}</div>
    <Link className="btn" href="/records">Test permission-gated records</Link>
  </>;
}
