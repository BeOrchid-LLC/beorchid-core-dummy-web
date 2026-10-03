import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse, type NextFetchEvent, type NextRequest } from 'next/server';

function clerkConfigured(): boolean {
  const publishableKey = process.env['NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY'];
  const secretKey = process.env['CLERK_SECRET_KEY'];
  return publishableKey?.startsWith('pk_') === true && secretKey?.startsWith('sk_') === true;
}

// API handlers perform their own authorization so they can return stable JSON
// 401/403 responses instead of Clerk's page-oriented redirect behavior.
const PUBLIC_ROUTES = [
  '/',
  '/sign-in',
  '/sign-up',
  '/api/dev-session',
  '/api/records',
  '/api/admin/core',
];
const isPublic = createRouteMatcher(
  PUBLIC_ROUTES.map((route) => (route === '/' ? '/' : `${route}(.*)`)),
);
const handleClerk = clerkMiddleware(async (auth, request) => {
  if (!isPublic(request)) await auth.protect();
});

export default async function proxy(request: NextRequest, event: NextFetchEvent) {
  if (!clerkConfigured()) return NextResponse.next();
  return handleClerk(request, event);
}

export const config = {
  matcher: ['/((?!_next|.*\\..*).*)'],
};
