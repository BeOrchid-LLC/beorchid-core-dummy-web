'use client';

import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import {
  assignAppRoleSchema,
  attachPermissionSchema,
  createRoleSchema,
  membershipLookupSchema,
} from '@/lib/admin-schemas';

const attachPermissionFormSchema = attachPermissionSchema.extend({
  roleId: z.string().uuid('Enter a valid role UUID.'),
});
const assignRoleFormSchema = assignAppRoleSchema.extend({
  membershipId: z.string().uuid('Enter a valid membership UUID.'),
});

type CreateRoleForm = z.infer<typeof createRoleSchema>;
type AttachPermissionForm = z.infer<typeof attachPermissionFormSchema>;
type MembershipLookupForm = z.infer<typeof membershipLookupSchema>;
type AssignRoleForm = z.infer<typeof assignRoleFormSchema>;

interface Membership {
  id: string;
  userId: string;
  orgId: string;
  roleKey: string;
  status: string;
}

interface ApiFailure {
  error?: { message?: string };
}

function isApiFailure(value: unknown): value is ApiFailure {
  return typeof value === 'object' && value !== null && 'error' in value;
}

async function requestJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: {
      accept: 'application/json',
      ...(init?.body ? { 'content-type': 'application/json' } : {}),
    },
  });
  const body = (await response.json().catch(() => null)) as T | ApiFailure | null;
  if (!response.ok) {
    const message = isApiFailure(body) ? body.error?.message : null;
    throw new Error(message || 'The administrative request failed.');
  }
  if (!body) throw new Error('The server returned an empty response.');
  return body as T;
}

function Result({ value, error }: { value: unknown; error: string | null }) {
  if (error) return <p className="banner error" role="alert">{error}</p>;
  if (!value) return null;
  return <pre className="result" aria-live="polite">{JSON.stringify(value, null, 2)}</pre>;
}

function FieldError({ message }: { message?: string }) {
  return message ? <span className="field-error">{message}</span> : null;
}

export function AdminConsole({ appId, appKey }: { appId: string; appKey: string }) {
  const [roleResult, setRoleResult] = useState<unknown>(null);
  const [roleError, setRoleError] = useState<string | null>(null);
  const [permissionResult, setPermissionResult] = useState<unknown>(null);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [membershipError, setMembershipError] = useState<string | null>(null);
  const [assignmentResult, setAssignmentResult] = useState<unknown>(null);
  const [assignmentError, setAssignmentError] = useState<string | null>(null);

  const roleForm = useForm<CreateRoleForm>({
    resolver: zodResolver(createRoleSchema),
    defaultValues: { key: '', name: '', description: '' },
  });
  const permissionForm = useForm<AttachPermissionForm>({
    resolver: zodResolver(attachPermissionFormSchema),
    defaultValues: { roleId: '', key: '', description: '' },
  });
  const membershipForm = useForm<MembershipLookupForm>({
    resolver: zodResolver(membershipLookupSchema),
    defaultValues: { clerkUserId: '' },
  });
  const assignmentForm = useForm<AssignRoleForm>({
    resolver: zodResolver(assignRoleFormSchema),
    defaultValues: { membershipId: '', roleId: '' },
  });

  async function createRole(values: CreateRoleForm) {
    setRoleError(null);
    setRoleResult(null);
    try {
      const result = await requestJson<{ data: { role: { id: string } & Record<string, unknown> } }>(
        '/api/admin/core/roles',
        { method: 'POST', body: JSON.stringify(values) },
      );
      setRoleResult(result.data.role);
      permissionForm.setValue('roleId', result.data.role.id, { shouldValidate: true });
      assignmentForm.setValue('roleId', result.data.role.id, { shouldValidate: true });
    } catch (error) {
      setRoleError(error instanceof Error ? error.message : 'Role creation failed.');
    }
  }

  async function attachPermission(values: AttachPermissionForm) {
    setPermissionError(null);
    setPermissionResult(null);
    try {
      const result = await requestJson<{ data: { permission: unknown } }>(
        `/api/admin/core/roles/${encodeURIComponent(values.roleId)}/permissions`,
        {
          method: 'POST',
          body: JSON.stringify({ key: values.key, description: values.description }),
        },
      );
      setPermissionResult(result.data.permission);
    } catch (error) {
      setPermissionError(error instanceof Error ? error.message : 'Permission attachment failed.');
    }
  }

  async function lookupMemberships(values: MembershipLookupForm) {
    setMembershipError(null);
    setMemberships([]);
    try {
      const params = new URLSearchParams({ clerk_user_id: values.clerkUserId });
      const result = await requestJson<{ data: { memberships: Membership[] } }>(
        `/api/admin/core/memberships?${params.toString()}`,
      );
      setMemberships(result.data.memberships);
      const first = result.data.memberships[0];
      if (first) assignmentForm.setValue('membershipId', first.id, { shouldValidate: true });
    } catch (error) {
      setMembershipError(error instanceof Error ? error.message : 'Membership lookup failed.');
    }
  }

  async function assignRole(values: AssignRoleForm) {
    setAssignmentError(null);
    setAssignmentResult(null);
    try {
      const result = await requestJson<{ data: { assignment: unknown } }>(
        `/api/admin/core/memberships/${encodeURIComponent(values.membershipId)}/app-role`,
        { method: 'POST', body: JSON.stringify({ roleId: values.roleId }) },
      );
      setAssignmentResult(result.data.assignment);
    } catch (error) {
      setAssignmentError(error instanceof Error ? error.message : 'App-role assignment failed.');
    }
  }

  return (
    <>
      <div className="card">
        <dl className="kv">
          <dt>Configured app key</dt><dd>{appKey}</dd>
          <dt>Configured app ID</dt><dd>{appId}</dd>
        </dl>
      </div>

      <section aria-labelledby="create-role-heading">
        <h2 id="create-role-heading">1. Create or update a Core role</h2>
        <form className="card form-grid" onSubmit={roleForm.handleSubmit(createRole)}>
          <label>Role key<input type="text" autoComplete="off" {...roleForm.register('key')} /><FieldError message={roleForm.formState.errors.key?.message} /></label>
          <label>Display name<input type="text" autoComplete="off" {...roleForm.register('name')} /><FieldError message={roleForm.formState.errors.name?.message} /></label>
          <label className="full">Description<textarea rows={3} {...roleForm.register('description')} /><FieldError message={roleForm.formState.errors.description?.message} /></label>
          <button type="submit" disabled={roleForm.formState.isSubmitting}>{roleForm.formState.isSubmitting ? 'Saving…' : 'Create or update role'}</button>
          <Result value={roleResult} error={roleError} />
        </form>
      </section>

      <section aria-labelledby="attach-permission-heading">
        <h2 id="attach-permission-heading">2. Attach an app-scoped permission</h2>
        <p>The server fixes the permission scope to <code>{appKey}</code>; the browser cannot choose another app.</p>
        <form className="card form-grid" onSubmit={permissionForm.handleSubmit(attachPermission)}>
          <label>Role ID<input type="text" autoComplete="off" {...permissionForm.register('roleId')} /><FieldError message={permissionForm.formState.errors.roleId?.message} /></label>
          <label>Permission key<input type="text" autoComplete="off" placeholder="dummy:records:read" {...permissionForm.register('key')} /><FieldError message={permissionForm.formState.errors.key?.message} /></label>
          <label className="full">Description<textarea rows={3} {...permissionForm.register('description')} /><FieldError message={permissionForm.formState.errors.description?.message} /></label>
          <button type="submit" disabled={permissionForm.formState.isSubmitting}>{permissionForm.formState.isSubmitting ? 'Attaching…' : 'Attach permission'}</button>
          <Result value={permissionResult} error={permissionError} />
        </form>
      </section>

      <section aria-labelledby="membership-heading">
        <h2 id="membership-heading">3. Find Core memberships</h2>
        <form className="card form-grid" onSubmit={membershipForm.handleSubmit(lookupMemberships)}>
          <label className="full">Clerk user ID<input type="text" autoComplete="off" placeholder="user_…" {...membershipForm.register('clerkUserId')} /><FieldError message={membershipForm.formState.errors.clerkUserId?.message} /></label>
          <button type="submit" disabled={membershipForm.formState.isSubmitting}>{membershipForm.formState.isSubmitting ? 'Looking up…' : 'Find memberships'}</button>
          <Result value={null} error={membershipError} />
        </form>
        {memberships.length > 0 && <div className="card table-scroll"><table><thead><tr><th>Membership</th><th>Organization</th><th>Org role</th><th>Status</th><th>Use</th></tr></thead><tbody>{memberships.map((membership) => <tr key={membership.id}><td><code>{membership.id}</code></td><td><code>{membership.orgId}</code></td><td>{membership.roleKey}</td><td>{membership.status}</td><td><button className="secondary" type="button" onClick={() => assignmentForm.setValue('membershipId', membership.id, { shouldValidate: true })}>Select</button></td></tr>)}</tbody></table></div>}
        {!membershipError && membershipForm.formState.isSubmitSuccessful && memberships.length === 0 && <p className="muted">No active Core memberships were returned.</p>}
      </section>

      <section aria-labelledby="assign-role-heading">
        <h2 id="assign-role-heading">4. Assign the Core app role</h2>
        <form className="card form-grid" onSubmit={assignmentForm.handleSubmit(assignRole)}>
          <label>Membership ID<input type="text" autoComplete="off" {...assignmentForm.register('membershipId')} /><FieldError message={assignmentForm.formState.errors.membershipId?.message} /></label>
          <label>Role ID<input type="text" autoComplete="off" {...assignmentForm.register('roleId')} /><FieldError message={assignmentForm.formState.errors.roleId?.message} /></label>
          <button type="submit" disabled={assignmentForm.formState.isSubmitting}>{assignmentForm.formState.isSubmitting ? 'Assigning…' : 'Assign app role'}</button>
          <Result value={assignmentResult} error={assignmentError} />
        </form>
      </section>
    </>
  );
}
