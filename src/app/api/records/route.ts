import { NextResponse } from 'next/server';
import { currentContext, safeDependencyMessage } from '@/lib/core';
import { canRead, enforce, isPermissionDenied, PERMISSIONS, canCreate } from '@/lib/authorization';
import { createRecord, listRecords } from '@/lib/db';
import { isSameOrigin, safeDatabaseMessage } from '@/lib/request';

function unauthorized(): NextResponse {
  return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
}

async function resolvedContext() {
  try {
    const result = await currentContext();
    if (result.state === 'signed-out') return { response: unauthorized() } as const;
    if (result.state === 'unlinked') return { response: NextResponse.json({ error: 'Account is not yet linked to Core.' }, { status: 403 }) } as const;
    return { context: result.context } as const;
  } catch (error) {
    return { response: NextResponse.json({ error: safeDependencyMessage(error) }, { status: 503 }) } as const;
  }
}

export async function GET(request: Request) {
  const result = await resolvedContext();
  if ('response' in result) return result.response;
  if (!result.context.organization) return NextResponse.json({ error: 'An organization is required.' }, { status: 403 });
  try {
    enforce(result.context, PERMISSIONS.read);
    const records = await listRecords(result.context.organization.id);
    return NextResponse.json({ records });
  } catch (error) {
    if (isPermissionDenied(error)) return NextResponse.json({ error: error.message, required: error.required }, { status: 403 });
    return NextResponse.json({ error: safeDatabaseMessage(error) }, { status: 503 });
  }
}

export async function POST(request: Request) {
  if (!isSameOrigin(request)) {
    return NextResponse.json(
      { code: 'CROSS_ORIGIN_REJECTED', error: 'This request was blocked because its origin could not be verified. Refresh the page and try again.' },
      { status: 403 },
    );
  }
  const result = await resolvedContext();
  if ('response' in result) return result.response;
  if (!result.context.organization) return NextResponse.json({ error: 'An organization is required.' }, { status: 403 });
  try {
    enforce(result.context, PERMISSIONS.create);
    const contentType = request.headers.get('content-type') ?? '';
    let body: { name?: unknown };
    try {
      body = contentType.includes('application/json')
        ? await request.json() as { name?: unknown }
        : Object.fromEntries(await (await request.formData()).entries());
    } catch {
      return NextResponse.json({ code: 'INVALID_REQUEST_BODY', error: 'The request body could not be read. Send a record name and try again.' }, { status: 400 });
    }
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    if (!name || name.length > 120) return NextResponse.json({ code: 'INVALID_RECORD_NAME', error: 'Record name must be between 1 and 120 characters.' }, { status: 400 });
    const record = await createRecord(result.context.organization.id, result.context.user.id, name);
    if (contentType.includes('application/json') || request.headers.get('accept')?.includes('application/json')) return NextResponse.json({ record }, { status: 201 });
    return NextResponse.redirect(new URL('/records', request.url), { status: 303 });
  } catch (error) {
    if (isPermissionDenied(error)) return NextResponse.json({ error: error.message, required: error.required }, { status: 403 });
    return NextResponse.json({ error: safeDatabaseMessage(error) }, { status: 503 });
  }
}
