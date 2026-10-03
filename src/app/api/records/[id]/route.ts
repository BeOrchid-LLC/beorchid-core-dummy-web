import { NextResponse } from 'next/server';
import { currentContext, safeDependencyMessage } from '@/lib/core';
import { enforce, isPermissionDenied, PERMISSIONS } from '@/lib/authorization';
import { deleteRecord } from '@/lib/db';
import { isSameOrigin, safeDatabaseMessage } from '@/lib/request';

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isSameOrigin(request)) {
    return NextResponse.json(
      { code: 'CROSS_ORIGIN_REJECTED', error: 'This request was blocked because its origin could not be verified. Refresh the page and try again.' },
      { status: 403 },
    );
  }
  try {
    const result = await currentContext();
    if (result.state === 'signed-out') return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
    if (result.state === 'unlinked') return NextResponse.json({ error: 'Account is not yet linked to Core.' }, { status: 403 });
    if (!result.context.organization) return NextResponse.json({ error: 'An organization is required.' }, { status: 403 });
    enforce(result.context, PERMISSIONS.delete);
    const { id } = await params;
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) return NextResponse.json({ error: 'Invalid record id.' }, { status: 400 });
    const deleted = await deleteRecord(result.context.organization.id, id);
    if (!deleted) return NextResponse.json({ error: 'Record not found.' }, { status: 404 });
    return NextResponse.json({ deleted: true });
  } catch (error) {
    if (isPermissionDenied(error)) return NextResponse.json({ error: error.message, required: error.required }, { status: 403 });
    if (error instanceof Error && error.name === 'CoreApiError') return NextResponse.json({ error: safeDependencyMessage(error) }, { status: 503 });
    return NextResponse.json({ error: safeDatabaseMessage(error) }, { status: 503 });
  }
}
