import { NextResponse } from 'next/server';
import { isDevAuthAllowed } from '@/lib/session';

export async function POST(request: Request) {
  if (!isDevAuthAllowed()) return new NextResponse('Not found', { status: 404 });
  const form = await request.formData();
  const action = String(form.get('action') ?? '');
  const response = NextResponse.redirect(new URL('/', request.url), { status: 303 });
  if (action === 'signin') {
    const clerkUserId = String(form.get('clerkUserId') ?? '').trim();
    if (!clerkUserId) return new NextResponse('clerkUserId required', { status: 400 });
    response.cookies.set('beorchid_dev_user', clerkUserId, { httpOnly: true, sameSite: 'lax', path: '/', maxAge: 3600 });
  } else response.cookies.delete('beorchid_dev_user');
  return response;
}
