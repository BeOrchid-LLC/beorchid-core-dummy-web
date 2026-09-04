import { isClerkConfigured } from '@/lib/session';

export default async function SignUpPage() {
  if (!isClerkConfigured()) return <><h1>Sign-up unavailable</h1><p>Configure Clerk to create real test identities. Fixture mode is intentionally limited to the known SDK fixture.</p></>;
  const { SignUp } = await import('@clerk/nextjs');
  return <SignUp routing="path" path="/sign-up" />;
}
