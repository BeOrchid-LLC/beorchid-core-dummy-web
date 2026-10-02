import { NextResponse, type NextFetchEvent, type NextRequest } from 'next/server';

function clerkConfigured(): boolean {
  const key = process.env['NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY'];
  return typeof key === 'string' && key.startsWith('pk_');
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
type ClerkProxy = (req: NextRequest, event: NextFetchEvent) => Promise<Response> | Response;
let cached: ClerkProxy | null = null;

async function clerkHandler(): Promise<ClerkProxy> {
  if (cached) return cached;
  const { clerkMiddleware, createRouteMatcher } = await import('@clerk/nextjs/server');
  const isPublic = createRouteMatcher(
    PUBLIC_ROUTES.map((route) => (route === '/' ? '/' : `${route}(.*)`)),
  );
  cached = clerkMiddleware(async (auth, request) => {
    if (!isPublic(request)) await auth.protect();
  }) as ClerkProxy;
  return cached;
}

export default async function proxy(request: NextRequest, event: NextFetchEvent) {
  if (!clerkConfigured()) return NextResponse.next();
  return (await clerkHandler())(request, event);
}

export const config = {
  matcher: ['/((?!_next|.*\\..*).*)'],
};
