import Link from 'next/link';
import { currentContext, safeDependencyMessage } from '@/lib/core';
import { canCreate, canDelete, canRead, PERMISSIONS } from '@/lib/authorization';
import { listRecords } from '@/lib/db';
import { DeleteRecordButton } from '@/app/components/delete-record-button';

export default async function RecordsPage() {
  let result: Awaited<ReturnType<typeof currentContext>>;
  try { result = await currentContext(); } catch (error) { return <><h1>Dummy Records</h1><div className="banner error">{safeDependencyMessage(error)}</div><Link className="btn" href="/">Return home</Link></>; }
  if (result.state === 'signed-out') return <><h1>Dummy Records</h1><p>Not signed in.</p><Link className="btn" href="/sign-in">Go to sign in</Link></>;
  if (result.state === 'unlinked') return <><h1>Dummy Records</h1><div className="banner dev">This Clerk account is waiting for its Core identity projection.</div><Link className="btn" href="/dashboard">View status</Link></>;
  const { context } = result;
  if (!context.organization) return <><h1>Dummy Records</h1><div className="banner dev">Select or create a Clerk organization before testing organization-scoped records.</div></>;
  const read = canRead(context); const create = canCreate(context); const remove = canDelete(context);
  if (!read) return <><h1>Dummy Records</h1><div className="banner error">Access denied. This app requires <code>{PERMISSIONS.read}</code>.</div><p>The denial comes from the permission set resolved by Core for this membership and this app.</p></>;

  let records: Awaited<ReturnType<typeof listRecords>> = [];
  let dbUnavailable = false;
  try { records = await listRecords(context.organization.id); } catch { dbUnavailable = true; }
  return <>
    <h1>Dummy Records</h1>
    <p className="lede">Records are stored in <code>core_dummy_web</code> and filtered by the organization ID returned by Core.</p>
    <div className="row" style={{ marginBottom: '1.5rem' }}><span className="chip granted">{PERMISSIONS.read}</span><span className={create ? 'chip granted' : 'chip denied'}>{PERMISSIONS.create}</span><span className={remove ? 'chip granted' : 'chip denied'}>{PERMISSIONS.delete}</span></div>
    {create && <form action="/api/records" method="post" className="row" style={{ marginBottom: '1.5rem' }}><label className="muted" htmlFor="record-name">New record</label><input id="record-name" type="text" name="name" maxLength={120} placeholder="Record name" required /><button type="submit">Create record</button></form>}
    {dbUnavailable ? <div className="banner error">The app database is unavailable. Run <code>npm run db:migrate</code> with the app database role.</div> : records.length === 0 ? <p>No records yet{create ? '. Create one above.' : '.'}</p> : <table><thead><tr><th>Name</th><th>Created by</th><th>Created</th>{remove && <th>Action</th>}</tr></thead><tbody>{records.map((record) => <tr key={record.id}><td>{record.name}</td><td><code>{record.createdBy}</code></td><td>{new Date(record.createdAt).toLocaleString()}</td>{remove && <td><DeleteRecordButton id={record.id} /></td>}</tr>)}</tbody></table>}
    <p className="muted" style={{ marginTop: '1.5rem' }}>Core identity and permission data came from the Core API. This app never queries Core tables directly.</p>
  </>;
}
