import { NextResponse, type NextFetchEvent, type NextRequest } from 'next/server';

function clerkConfigured(): boolean {
  const key = process.env['NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY'];
  return typeof key === 'string' && key.startsWith('pk_');
}

const PUBLIC_ROUTES = ['/', '/sign-in', '/sign-up', '/api/dev-session'];
type ClerkMiddleware = (req: NextRequest, event: NextFetchEvent) => Promise<Response> | Response;
let cached: ClerkMiddleware | null = null;

async function clerkHandler(): Promise<ClerkMiddleware> {
  if (cached) return cached;
  const { clerkMiddleware, createRouteMatcher } = await import('@clerk/nextjs/server');
  const isPublic = createRouteMatcher(
    PUBLIC_ROUTES.map((route) => (route === '/' ? '/' : `${route}(.*)`)),
  );
  cached = clerkMiddleware(async (auth, request) => {
    if (!isPublic(request)) await auth.protect();
  }) as ClerkMiddleware;
  return cached;
}

export default async function middleware(request: NextRequest, event: NextFetchEvent) {
  if (!clerkConfigured()) return NextResponse.next();
  return (await clerkHandler())(request, event);
}

export const config = {
  matcher: ['/((?!_next|.*\\..*).*)'],
};
