import { isClerkConfigured } from '@/lib/session';

export default async function SignInPage() {
  if (isClerkConfigured()) {
    const { SignIn } = await import('@clerk/nextjs');
    return <SignIn routing="path" path="/sign-in" />;
  }
  return <><h1>Fixture sign-in</h1><p>This route exists only in development when Clerk is not configured.</p><form action="/api/dev-session" method="post" className="card"><input type="hidden" name="action" value="signin" /><label htmlFor="clerkUserId">Fixture Clerk user id</label><input id="clerkUserId" type="text" name="clerkUserId" defaultValue="user_2ab9k1" required /><button type="submit">Sign in as fixture user</button></form></>;
}
